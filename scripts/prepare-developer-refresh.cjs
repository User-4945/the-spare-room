const fs=require('node:fs'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const version=process.argv[2],platform=process.argv[3],repo=process.env.GH_REPO;
const api=p=>JSON.parse(execFileSync('gh',['api','repos/'+repo+'/'+p],{encoding:'utf8'}));
const revision=Number(process.env.GITHUB_RUN_ID)*100+Number(process.env.GITHUB_RUN_ATTEMPT||1);if(!Number.isSafeInteger(revision))throw Error('Bad revision');
let info,origin;
if(version==='3.0.0'){
 fs.rmSync('dist',{recursive:true,force:true});fs.cpSync('developer-game','dist',{recursive:true});
 {const p='desktop/main.cjs';let t=fs.readFileSync(p,'utf8');t=t.replace('async function checkDesktop(){try{',"async function checkDesktop(){if(require('./release-info.json').developer){try{return report(await require('./developer-smoke.cjs')({win,updates,version,verifySave}),0)}catch(error){return report({ok:false,error:String(error)},1)}}try{");fs.writeFileSync(p,t);}
 info={version,tag:'',developer:true,prerelease:true,name:'THE SPARE ROOM v3.0.0 — Beneath the House · Developer preview',build_revision:revision};
 fs.writeFileSync('RELEASE_NOTES.md',fs.readFileSync('developer-game/RELEASE_NOTES_DRAFT.md'));
}else{
 const release=api('releases?per_page=100').find(r=>r.tag_name.replace(/^v\.?/,'')===version&&!r.draft);if(!release)throw Error('Release missing');
 const a=release.assets.find(a=>a.name==='The-Spare-Room-v'+version+'-desktop-source.zip');if(!a?.digest?.startsWith('sha256:'))throw Error('Missing verified source');
 fs.mkdirSync('refresh-original',{recursive:true});execFileSync('gh',['release','download',release.tag_name,'--pattern',a.name,'--dir','refresh-original','--clobber']);
 const zip='refresh-original/'+a.name;if('sha256:'+crypto.createHash('sha256').update(fs.readFileSync(zip)).digest('hex')!==a.digest)throw Error('Source checksum mismatch');
 execFileSync(process.platform==='win32'?'python':'python3',['-c',`import zipfile,pathlib
z=zipfile.ZipFile(${JSON.stringify(zip)})
for n in z.namelist():
 p=pathlib.PurePosixPath(n)
 if p.is_absolute() or '..' in p.parts or ':' in n: raise Exception('Unsafe path')
z.extractall('refresh-original/extracted')`]);
 const root='refresh-original/extracted/the-spare-room',old=JSON.parse(fs.readFileSync(root+'/release.json'));if(old.version!==version)throw Error('Wrong game version');
 fs.rmSync('dist',{recursive:true,force:true});fs.cpSync(root+'/dist','dist',{recursive:true});fs.copyFileSync(root+'/tests/game-smoke.cjs','tests/game-smoke.cjs');fs.copyFileSync(root+'/desktop/main.cjs','desktop/main.cjs');
 {const p='desktop/main.cjs';let t=fs.readFileSync(p,'utf8');t=t.replace("if(url===API+'/releases/latest')return stable;","if(url===API+'/releases/latest')return stable;\n  if(url.startsWith(API+'/releases/tags/'))return {...stable,tag_name:decodeURIComponent(url.split('/').at(-1))};");fs.writeFileSync(p,t);}
 // The shell keeps the matching release's smoke and game behavior. Shared settings are separate modules.
 for(const p of ['desktop/icon.ico','platforms/icons']){fs.rmSync(p,{recursive:true,force:true});fs.cpSync(root+'/'+p,p,{recursive:true});}
 if(version==='2.7.5')execFileSync('node',['scripts/move-memory-door.cjs']);
 info={...old,tag:release.tag_name,prerelease:release.prerelease,build_revision:revision};origin={release_id:release.id,source_asset:a.id,source_sha256:a.digest};
 fs.writeFileSync('RELEASE_NOTES.md',release.body+'\n\n### Desktop developer-channel refresh\nSettings now includes online Admin sign in. After signing in, enable Include developer versions and Save preferences. Stable and prerelease choices remain separate; no downgrades. Original game content is preserved.'+(version==='2.7.5'?' The Final House doorway is now on the left wall near the end of the indoor hallway, clear of routes.':''));
}
for(const file of ['package.json','package-lock.json']){const p=JSON.parse(fs.readFileSync(file));p.version=version;if(p.packages)p.packages[''].version=version;fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');}
fs.writeFileSync('release.json',JSON.stringify(info,null,2));
fs.writeFileSync('installer-build.json',JSON.stringify({schema:1,game_version:version,game_tag:info.tag,developer:!!info.developer,prerelease:info.prerelease,platform,revision,commit:process.env.GITHUB_SHA,...origin},null,2));
console.log('Prepared '+version+' '+platform+'; preserved original game, developer channel off by default.');
