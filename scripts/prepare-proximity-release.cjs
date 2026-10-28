// Preserve each release's actual shipped game rather than rebuilding an old tag.
const fs=require('node:fs'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const v=require('../proximity-release-plan.json').find(v=>v.version===process.argv[2]);if(!v)throw Error('Unknown release');
const api=p=>JSON.parse(execFileSync('gh',['api','repos/'+process.env.GH_REPO+'/'+p],{encoding:'utf8'}));
const r=api('releases/'+v.id);if(r.tag_name!==v.tag||r.prerelease!==v.prerelease||r.draft)throw Error('Release state changed');
const source=r.assets.find(a=>a.name==='The-Spare-Room-v'+v.version+'-desktop-source.zip');if(!source||!/^sha256:[a-f0-9]{64}$/.test(source.digest))throw Error('Missing verified matching source');
fs.mkdirSync('refresh-original',{recursive:true});execFileSync('gh',['release','download',v.tag,'--pattern',source.name,'--dir','refresh-original','--clobber']);
const archive='refresh-original/'+source.name;if('sha256:'+crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex')!==source.digest)throw Error('Source checksum mismatch');
// Zip paths are inspected before extraction; only the known matching subtree is used.
execFileSync(process.platform==='win32'?'python':'python3',['-c',`import zipfile,pathlib
z=zipfile.ZipFile(${JSON.stringify(archive)})
for n in z.namelist():
 p=pathlib.PurePosixPath(n)
 if p.is_absolute() or '..' in p.parts: raise Exception('Unsafe archive')
z.extractall('refresh-original/extracted')`]);
const holdAssets=Object.fromEntries(['action-prompts.js','halloween-ui.js','halloween-ui.css','halloween-interactions.js'].map(n=>[n,fs.readFileSync('dist/'+n)]));
const root='refresh-original/extracted/the-spare-room';const old=JSON.parse(fs.readFileSync(root+'/release.json'));if(old.version!==v.version)throw Error('Wrong matching source');
if(v.version!=='2.7.5'){
 fs.rmSync('dist',{recursive:true,force:true});fs.cpSync(root+'/dist','dist',{recursive:true});
 fs.copyFileSync(root+'/tests/game-smoke.cjs','tests/game-smoke.cjs');fs.copyFileSync(root+'/desktop/main.cjs','desktop/main.cjs');
}
for(const [n,data]of Object.entries(holdAssets))fs.writeFileSync('dist/'+n,data);
{const p='dist/index.html';let html=fs.readFileSync(p,'utf8');if(!html.includes('halloween-interactions.js'))html=html.replace('</body>','<script src="halloween-ui.js"></script><script src="halloween-interactions.js"></script></body>');fs.writeFileSync(p,html);}
// Extend the existing smoke-only transport to cover the installed release endpoint.
{const p='desktop/main.cjs';let t=fs.readFileSync(p,'utf8');t=t.replace("if(url===API+'/releases/latest')return stable;","if(url===API+'/releases/latest')return stable;\n  if(url.startsWith(API+'/releases/tags/'))return {...stable,tag_name:decodeURIComponent(url.split('/').at(-1))};");if(!t.includes('function qaHoldAction()'))t=t.replaceAll('actionPrompt.click();','qaHoldAction();').replace("const promptLock=locked;","function qaHoldAction(){beginInteractionHold('test');for(let i=0;i<8;i++)advanceInteractionHold(.1);}"+"const promptLock=locked;").replace("canvas.dispatchEvent(new KeyboardEvent('keyup'","for(let i=0;i<8;i++)advanceInteractionHold(.1);canvas.dispatchEvent(new KeyboardEvent('keyup'").replace("actionKey.textContent!=='TAP'","actionKey.textContent!=='E'");t=t.replace('const stalePrompt=house.target;house.z=-13;','const stalePrompt=house.target;house.x=150;house.z=150;');fs.writeFileSync(p,t);}
for(const p of ['desktop/icon.ico','platforms/icons']){fs.rmSync(p,{recursive:true,force:true});fs.cpSync(root+'/'+p,p,{recursive:true});}
const revision=Number(process.env.GITHUB_RUN_ID)*100+1;if(!Number.isSafeInteger(revision)||revision<=0)throw Error('Invalid build revision');
const meta=r.assets.find(a=>a.name==='BUILD-REFRESH.json');if(meta){const previous=JSON.parse(execFileSync('gh',['api','repos/'+process.env.GH_REPO+'/releases/assets/'+meta.id,'-H','Accept: application/octet-stream'],{encoding:'utf8'}));if(revision<=previous.revision)throw Error('Refresh revision must increase');}
for(const n of ['package.json','package-lock.json']){const p=JSON.parse(fs.readFileSync(n));p.version=v.version;if(p.packages)p.packages[''].version=v.version;fs.writeFileSync(n,JSON.stringify(p,null,2)+'\n');}
fs.writeFileSync('release.json',JSON.stringify({...old,tag:v.tag,prerelease:v.prerelease,build_revision:revision,halloween_ui:true},null,2));
const note=require('./proximity-note.cjs');fs.writeFileSync('RELEASE_NOTES.md',r.body.replace(/\n*<!-- proximity-refresh-start -->[\s\S]*?<!-- proximity-refresh-end -->/g,'')+note);fs.writeFileSync('DESKTOP_README.md',fs.readFileSync(root+'/DESKTOP_README.md','utf8')+note);
fs.writeFileSync('installer-build.json',JSON.stringify({game_version:v.version,game_tag:v.tag,game_commit:v.ref,runtime_commit:process.env.GITHUB_SHA,refresh_patch_commit:process.env.GITHUB_SHA,build_revision:revision,source_asset_id:source.id,source_sha256:source.digest,prerelease:v.prerelease,platform:process.argv[3],week2:fs.existsSync('dist/week2.js'),week3:fs.existsSync('dist/week3.js'),third_person:fs.existsSync('dist/third-person.js'),update_settings:{same_version_refreshes:true,default:'stable',prereleases:'opt-in',never_downgrade:true}},null,2));
console.log('Preserved shipped '+v.tag+'; prepared refresh '+revision+' / '+process.argv[3]);
