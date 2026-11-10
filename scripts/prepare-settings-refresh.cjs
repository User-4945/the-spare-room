// Rebuild each installed edition from its own verified, shipped source archive.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync:run}=require('child_process');
const plan=require('../settings-refresh-plan.json'),v=plan.find(x=>x.version===process.argv[2]);if(!v)throw Error('Unknown release');
const api=p=>JSON.parse(run('gh',['api','repos/'+process.env.GH_REPO+'/'+p],{encoding:'utf8'}));
if(run('git',['rev-parse',v.tag+'^{commit}'],{encoding:'utf8'}).trim()!==v.ref)throw Error('Game tag changed');
const release=api('releases/'+v.id);if(release.tag_name!==v.tag||release.prerelease!==v.prerelease||release.draft)throw Error('Release channel changed');
const source=release.assets.find(a=>a.name==='The-Spare-Room-v'+v.version+'-desktop-source.zip');if(!source||!/^sha256:/.test(source.digest))throw Error('Verified source missing');
fs.mkdirSync('settings-original',{recursive:true});run('gh',['release','download',v.tag,'--pattern',source.name,'--dir','settings-original','--clobber']);const zip='settings-original/'+source.name;
if('sha256:'+crypto.createHash('sha256').update(fs.readFileSync(zip)).digest('hex')!==source.digest)throw Error('Source checksum mismatch');
run(process.platform==='win32'?'python':'python3',['-c',`import zipfile,pathlib
z=zipfile.ZipFile(${JSON.stringify(zip)})
for n in z.namelist():
 p=pathlib.PurePosixPath(n)
 if p.is_absolute() or '..' in p.parts: raise Exception('Unsafe archive')
z.extractall('settings-original/extracted')`]);
const root='settings-original/extracted/the-spare-room',old=JSON.parse(fs.readFileSync(root+'/release.json'));if(old.version!==v.version)throw Error('Version mismatch');
for(const name of ['dist','developer-game','desktop/main.cjs','desktop/icon.ico','platforms/icons','tests/game-smoke.cjs']){
 if(fs.existsSync(root+'/'+name)){fs.rmSync(name,{force:true,recursive:true});fs.cpSync(root+'/'+name,name,{recursive:true});}
}
let watcher=false;
for(const folder of ['dist','developer-game']){
 const file=folder+'/anomalies.js';if(!fs.existsSync(file))continue;let text=fs.readFileSync(file,'utf8');
 const a=text.indexOf(' const watcher=groups.watcher;'),b=text.indexOf('\n const toy=',a);
 if(a>=0&&b>a){text=text.slice(0,a)+fs.readFileSync('scripts/watcher-model.fragment.js','utf8')+text.slice(b);watcher=true;fs.writeFileSync(file,text);}
}
const revision=Number(process.env.GITHUB_RUN_ID)*100+3;if(!Number.isSafeInteger(revision))throw Error('Invalid revision');
for(const name of ['package.json','package-lock.json']){const p=JSON.parse(fs.readFileSync(name));p.version=v.version;if(p.packages)p.packages[''].version=v.version;fs.writeFileSync(name,JSON.stringify(p,null,2)+'\n');}
fs.writeFileSync('release.json',JSON.stringify({...old,tag:v.tag,prerelease:v.prerelease,build_revision:revision},null,2));
const note='\n\n<!-- settings-refresh-start -->\n### Settings refresh\nChoose Always check for updates, Notify only for stable releases, or Never check for updates. Enabled checks run daily; manual Check now remains available. No automatic downgrades. '+(watcher?'The Watcher has a taller hooded silhouette, dim eyes and longer fingers; no additional jump scare. ':'')+'This build preserves this release’s original story and event content.\n<!-- settings-refresh-end -->\n';
fs.writeFileSync('RELEASE_NOTES.md',(release.body||'').replace(/\n*<!-- settings-refresh-start -->[\s\S]*?<!-- settings-refresh-end -->/g,'')+note);
if(fs.existsSync(root+'/DESKTOP_README.md'))fs.writeFileSync('DESKTOP_README.md',fs.readFileSync(root+'/DESKTOP_README.md','utf8')+note);
fs.writeFileSync('installer-build.json',JSON.stringify({game_version:v.version,game_tag:v.tag,game_commit:v.ref,runtime_commit:process.env.GITHUB_SHA,source_asset_id:source.id,source_sha256:source.digest,prerelease:v.prerelease,build_revision:revision,platform:process.argv[3],settings_modes:['always','stable','never'],watcher_refresh:watcher},null,2));
