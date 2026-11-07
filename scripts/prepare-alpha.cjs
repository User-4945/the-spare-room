const fs=require('node:fs'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const revision=process.env.GITHUB_RUN_ID?Number(process.env.GITHUB_RUN_ID)*100+Number(process.env.GITHUB_RUN_ATTEMPT||1):0;
if(!Number.isSafeInteger(revision)||revision<0)throw Error('Invalid revision');
fs.rmSync('dist',{recursive:true,force:true});fs.cpSync('developer-game','dist',{recursive:true});
for(const file of ['package.json','package-lock.json']){const p=JSON.parse(fs.readFileSync(file));p.version='3.0.0';if(p.packages)p.packages[''].version='3.0.0';fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');}
const release={name:'THE SPARE ROOM v.3.0.0 — Beneath the House · Alpha',version:'3.0.0',tag:'v.3.0.0',prerelease:true,alpha:true,developer:false,channel:'alpha',generation_version:2,halloween_ui:false,build_revision:revision};
fs.writeFileSync('release.json',JSON.stringify(release,null,2)+'\n');
fs.copyFileSync('RELEASE_NOTES_ALPHA.md','RELEASE_NOTES.md');
fs.copyFileSync('dist/favicon.ico','desktop/icon.ico');
const tree=()=>{const h=crypto.createHash('sha256');const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).forEach(d=>{const p=dir+'/'+d.name;if(d.isDirectory())walk(p);else{h.update(p+'\0');h.update(fs.readFileSync(p));}});walk('dist');return h.digest('hex')};
fs.writeFileSync('installer-build.json',JSON.stringify({schema:1,game_version:'3.0.0',game_tag:release.tag,prerelease:true,alpha:true,platform:process.argv[2]||'local',revision,commit:process.env.GITHUB_SHA||'local',game_sha256:tree(),game_tree:execFileSync('git',['rev-parse','HEAD:developer-game'],{encoding:'utf8'}).trim(),endings:61,basement_anomalies:25},null,2)+'\n');
console.log('Prepared Alpha; v2.7.6 downloads remain unchanged.');
