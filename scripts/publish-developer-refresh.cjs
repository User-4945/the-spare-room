const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const repo=process.env.GH_REPO,version=process.argv[2],platform=process.argv[3],root='platform-build';
const api=(p,method='GET',data)=>JSON.parse(execFileSync('gh',['api','repos/'+repo+'/'+p,'--method',method,...(data?['--input','-']:[])],{encoding:'utf8',input:data?JSON.stringify(data):undefined}));
const latest=api('releases/latest'),meta=require('../installer-build.json');if(meta.commit!==process.env.GITHUB_SHA||meta.game_version!==version||meta.platform!==platform)throw Error('Build mismatch');
const release=version==='3.0.0'?api('releases/426674255'):api('releases/'+meta.release_id);if(release.draft||version!=='3.0.0'&&release.prerelease!==meta.prerelease)throw Error('Release channel changed');
let files=fs.readdirSync(root).filter(n=>/\.(exe|dmg|AppImage|deb|zip|md)$/.test(n));if(!files.length)throw Error('No installer');
if(version==='3.0.0'){if(platform!=='win')throw Error('Unsupported developer platform');files=files.map(n=>{const name=n.replace('The-Spare-Room-Setup-','The-Spare-Room-Developer-Setup-');fs.renameSync(path.join(root,n),path.join(root,name));return name;});}
fs.copyFileSync('installer-build.json',path.join(root,(version==='3.0.0'?'developer':platform)+'-DEVELOPER-REFRESH-BUILD.json'));files.push((version==='3.0.0'?'developer':platform)+'-DEVELOPER-REFRESH-BUILD.json');
if(version==='3.0.0'){
 const name='DEVELOPER-CHANNEL.json';fs.writeFileSync(path.join(root,name),JSON.stringify({schema:1,channel:'developer',version,revision:meta.revision,notes:fs.readFileSync('RELEASE_NOTES.md','utf8').slice(0,50000),commit:meta.commit},null,2));files.push(name);
}else if(platform==='win'){
 fs.writeFileSync(path.join(root,'BUILD-REFRESH.json'),JSON.stringify({schema:1,version,tag:release.tag_name,release_id:release.id,revision:meta.revision,commit:meta.commit},null,2));files.push('BUILD-REFRESH.json');
}
const hash=file=>'sha256:'+crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifestFiles=files.filter(n=>!['BUILD-REFRESH.json','DEVELOPER-CHANNEL.json'].includes(n));
execFileSync('gh',['release','upload',release.tag_name,...manifestFiles.map(n=>path.join(root,n)),'--clobber'],{stdio:'inherit'});
for(const n of files.filter(n=>!manifestFiles.includes(n)))execFileSync('gh',['release','upload',release.tag_name,path.join(root,n),'--clobber'],{stdio:'inherit'});
let after=api('releases/'+release.id);for(const n of files)if(!after.assets.some(a=>a.name===n&&a.digest===hash(path.join(root,n))&&a.state==='uploaded'))throw Error('Upload digest mismatch '+n);
if(api('releases/latest').id!==latest.id||after.prerelease!==release.prerelease)throw Error('Release status changed');
console.log('Verified '+version+' '+platform+' downloads; latest and prerelease statuses preserved.');

const sums=after.assets.filter(a=>!a.name.includes('SHA256SUMS')&&/^sha256:[a-f0-9]{64}$/i.test(a.digest||'')).map(a=>a.digest.slice(7)+'  '+a.name).join('\n')+'\n';
const sumNames=[...new Set(['SHA256SUMS.txt',...after.assets.filter(a=>a.name.includes('SHA256SUMS')).map(a=>a.name)])];
for(const n of sumNames){fs.writeFileSync(path.join(root,n),sums);execFileSync('gh',['release','upload',release.tag_name,path.join(root,n),'--clobber'],{stdio:'inherit'});}
const marker='<!-- developer-settings-refresh -->';let body=after.body||'';body=body.split(marker)[0].trim();
body+='\n\n'+marker+'\n### Desktop settings refresh\nAll original gameplay is retained. Settings → Admin sign in reveals the opt-in Include developer versions preference. Passwords are never saved. Saving preferences checks immediately. Stable and prerelease preferences remain separate, same-version refreshes remain supported, and newer versions are never downgraded.'+(['2.7.5','2.7.6'].includes(version)?' The memory-house doorway is now on the left-hand wall near the end of the indoor ground-floor hallway, away from passages. The return door leads back to this hallway.':'');
api('releases/'+release.id,'PATCH',{body,prerelease:release.prerelease,make_latest:release.id===latest.id?'true':'false'});
