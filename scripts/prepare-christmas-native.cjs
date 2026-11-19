const fs=require('node:fs'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
for(const script of ['prepare-environment','prepare-christmas','build-christmas-preview'])execFileSync(process.execPath,['scripts/'+script+'.cjs','--preview'],{stdio:'inherit'});
fs.cpSync('christmas-build/web','dist',{recursive:true});
for(const file of ['package.json','package-lock.json']){const p=JSON.parse(fs.readFileSync(file));p.version='3.5.0';if(p.packages)p.packages[''].version='3.5.0';fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');}
const revision=Number(process.env.GITHUB_RUN_NUMBER||1)*100+Number(process.env.GITHUB_RUN_ATTEMPT||1);
const release={name:'THE SPARE ROOM v.3.5.0 - Christmas Week 1 Preview',version:'3.5.0',tag:'v.3.5.0',prerelease:true,alpha:false,developer:false,channel:'prerelease',generation_version:2,halloween_ui:false,build_revision:revision};
fs.writeFileSync('release.json',JSON.stringify(release,null,2)+'\n');
fs.copyFileSync('events/christmas/PRERELEASE_NOTES.md','RELEASE_NOTES.md');
fs.copyFileSync('dist/favicon.ico','desktop/icon.ico');
const hash=crypto.createHash('sha256');function walk(dir){for(const d of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=dir+'/'+d.name;if(d.isDirectory())walk(p);else{hash.update(p+'\0');hash.update(fs.readFileSync(p));}}}walk('dist');
fs.writeFileSync('installer-build.json',JSON.stringify({schema:1,game_version:'3.5.0',game_tag:'v.3.5.0',prerelease:true,platform:process.argv[2]||'local',revision,commit:process.env.GITHUB_SHA||'local',game_sha256:hash.digest('hex')},null,2));
console.log('Prepared explicit Christmas native prerelease; stable Latest unchanged.');
