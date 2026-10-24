const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const repo=process.env.GH_REPO,tag='v2.6.5';
function api(route,method='GET',data){const out=execFileSync('gh',['api','repos/'+repo+'/'+route,'--method',method,...(data?['--input','-']:[])],{encoding:'utf8',input:data?JSON.stringify(data):undefined});return out.trim()?JSON.parse(out):null;}
const files=new Map();
for(const name of fs.readdirSync('release-artifacts')){
 if(name==='halloween-265-screenshots')continue;
 const dir=path.join('release-artifacts',name),metaFile=fs.readdirSync(dir).find(f=>f.endsWith('-BUILD.json'));
 if(!metaFile)throw Error('Missing build record');const m=JSON.parse(fs.readFileSync(path.join(dir,metaFile)));
 if(m.game_version!=='2.6.5'||m.updater_commit!==process.env.GITHUB_SHA||!m.prerelease||m.anomalies!==11||m.endings!==41)throw Error('Wrong game package');
 for(const f of fs.readdirSync(dir)){if(files.has(f))throw Error('Duplicate asset '+f);files.set(f,path.join(dir,f));}
}
const required=['The-Spare-Room-Setup-2.6.5-x64.exe','The-Spare-Room-2.6.5-mac-universal.dmg','The-Spare-Room-2.6.5-linux-x64.AppImage','The-Spare-Room-2.6.5-linux-x64.deb','The-Spare-Room-v2.6.5-web.zip','The-Spare-Room-v2.6.5-installable-web.zip','The-Spare-Room-v2.6.5-desktop-source.zip','win-BUILD.json','mac-BUILD.json','linux-BUILD.json'];
for(const name of required)if(!files.has(name))throw Error('Missing release download '+name);
const digest=file=>'sha256:'+crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sums=[...files].map(([name,file])=>digest(file).slice(7)+'  '+name).join('\n')+'\n';fs.writeFileSync('SHA256SUMS.txt',sums);files.set('SHA256SUMS.txt',path.resolve('SHA256SUMS.txt'));
const previousLatest=api('releases/latest');const all=api('releases?per_page=100');let release=all.find(r=>r.tag_name===tag);
if(release&&(release.id!==422913580||!release.prerelease))throw Error('Only the existing v2.6.5 prerelease may be updated');
if(release){api('releases/'+release.id,'PATCH',{draft:true,prerelease:true,body:fs.readFileSync('RELEASE_NOTES.md','utf8'),make_latest:'false'});api('git/refs/tags/'+tag,'PATCH',{sha:process.env.GITHUB_SHA,force:true});}
if(!release)release=api('releases','POST',{tag_name:tag,target_commitish:process.env.GITHUB_SHA,name:'The Spare Room v2.6.5 — All Hallows’ Eve: The Houses That Answer',body:fs.readFileSync('RELEASE_NOTES.md','utf8'),draft:true,prerelease:true,make_latest:'false'});
execFileSync('gh',['release','upload',tag,...files.values(),'--clobber'],{stdio:'inherit'});
release=api('releases/'+release.id);for(const [name,file]of files)if(!release.assets.some(a=>a.name===name&&a.state==='uploaded'&&a.digest===digest(file)))throw Error('Checksum mismatch '+name);
api('releases/'+release.id,'PATCH',{draft:false,prerelease:true,make_latest:'false'});
const published=api('releases/'+release.id),latest=api('releases/latest');
if(!published.prerelease||published.draft||published.assets.length!==files.size)throw Error('Prerelease verification failed');
if(latest.id!==previousLatest.id)throw Error('Stable latest changed');
for(const old of previousLatest.assets)if(!latest.assets.some(a=>a.id===old.id&&a.digest===old.digest))throw Error('Stable download changed');
console.log('Published v2.6.5 prerelease with '+files.size+' verified assets; stable latest preserved.');
