const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const repo=process.env.GH_REPO,tag='v.2.5.0';
function api(route,method='GET',data){const out=execFileSync('gh',['api','repos/'+repo+'/'+route,'--method',method,...(data?['--input','-']:[])],{encoding:'utf8',input:data?JSON.stringify(data):undefined});return out.trim()?JSON.parse(out):null;}
const files=new Map();
for(const name of fs.readdirSync('release-artifacts')){
 if(name==='halloween-250-screenshots')continue;
 const dir=path.join('release-artifacts',name),metaFile=fs.readdirSync(dir).find(f=>f.endsWith('-BUILD.json'));
 if(!metaFile)throw Error('Missing build record');const m=JSON.parse(fs.readFileSync(path.join(dir,metaFile)));
 if(m.game_version!=='2.5.0'||m.updater_commit!==process.env.GITHUB_SHA||m.prerelease||m.anomalies!==8||m.endings!==38)throw Error('Wrong game package');
 for(const f of fs.readdirSync(dir)){if(files.has(f))throw Error('Duplicate asset '+f);files.set(f,path.join(dir,f));}
}
const required=['The-Spare-Room-Setup-2.5.0-x64.exe','The-Spare-Room-2.5.0-mac-universal.dmg','The-Spare-Room-2.5.0-linux-x64.AppImage','The-Spare-Room-2.5.0-linux-x64.deb','The-Spare-Room-v2.5.0-web.zip','The-Spare-Room-v2.5.0-installable-web.zip','The-Spare-Room-v2.5.0-desktop-source.zip','win-BUILD.json','mac-BUILD.json','linux-BUILD.json'];
for(const name of required)if(!files.has(name))throw Error('Missing release download '+name);
const digest=file=>'sha256:'+crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sums=[...files].map(([name,file])=>digest(file).slice(7)+'  '+name).join('\n')+'\n';fs.writeFileSync('SHA256SUMS.txt',sums);files.set('SHA256SUMS.txt',path.resolve('SHA256SUMS.txt'));
const all=api('releases?per_page=100');let release=all.find(r=>r.tag_name===tag);
if(release&&!release.draft)throw Error('Existing published release requires explicit reconciliation');
if(!release)release=api('releases','POST',{tag_name:tag,target_commitish:process.env.GITHUB_SHA,name:'The Spare Room v.2.5.0 — All Hallows’ Eve',body:fs.readFileSync('RELEASE_NOTES.md','utf8'),draft:true,prerelease:false,make_latest:'false'});
execFileSync('gh',['release','upload',tag,...files.values(),'--clobber'],{stdio:'inherit'});
release=api('releases/'+release.id);for(const [name,file]of files)if(!release.assets.some(a=>a.name===name&&a.state==='uploaded'&&a.digest===digest(file)))throw Error('Checksum mismatch '+name);
const previous=all.find(r=>r.tag_name==='v.2.1.0');if(!previous)throw Error('Previous release missing');
api('releases/'+previous.id,'PATCH',{prerelease:false,make_latest:'false',body:'**v.2.1.0 is now a normal release. The latest Halloween update is [v.2.5.0](https://github.com/'+repo+'/releases/tag/v.2.5.0).**\n\n'+previous.body});
api('releases/'+release.id,'PATCH',{draft:false,prerelease:false,make_latest:'true'});
const latest=api('releases/latest');if(latest.tag_name!==tag||latest.prerelease||latest.assets.length!==files.size)throw Error('Latest release verification failed');
const promoted=api('releases/'+previous.id);if(promoted.prerelease)throw Error('Promotion failed');
for(const old of previous.assets)if(!promoted.assets.some(a=>a.id===old.id&&a.digest===old.digest))throw Error('Historical download changed');
console.log('Published complete latest v.2.5.0 with '+files.size+' verified assets; v.2.1.0 is stable and its downloads are preserved.');
