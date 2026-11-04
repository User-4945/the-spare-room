const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const repo=process.env.GH_REPO,tag='v2.7.6';
function api(route,method='GET',data){const out=execFileSync('gh',['api','repos/'+repo+'/'+route,'--method',method,...(data?['--input','-']:[])],{encoding:'utf8',input:data?JSON.stringify(data):undefined});return out.trim()?JSON.parse(out):null;}
if(api('git/ref/heads/'+process.env.GITHUB_REF_NAME).object.sha!==process.env.GITHUB_SHA)throw Error('A newer prerelease build superseded this run');
for(const dir of ['dist','desktop','platforms'])if(execFileSync('git',['rev-parse','HEAD:'+dir],{encoding:'utf8'}).trim()!==execFileSync('git',['rev-parse','bef2f7204d266910220f55558012c2c55b606d1d:'+dir],{encoding:'utf8'}).trim())throw Error('Product differs from previously verified installers: '+dir);
const files=new Map();
for(const name of fs.readdirSync('release-artifacts')){
 if(name==='halloween-276-screenshots')continue;
 const dir=path.join('release-artifacts',name),metaFile=fs.readdirSync(dir).find(f=>f.endsWith('-BUILD.json'));
 if(!metaFile)throw Error('Missing build record');const m=JSON.parse(fs.readFileSync(path.join(dir,metaFile)));
 if(m.game_tree!==execFileSync('git',['rev-parse','HEAD:dist'],{encoding:'utf8'}).trim())throw Error('Game tree differs from verified installers');
 if(m.game_version!=='2.7.6'||![process.env.GITHUB_SHA,'bef2f7204d266910220f55558012c2c55b606d1d'].includes(m.updater_commit)||!m.prerelease||m.easter_eggs!==16||m.secret_achievements!==5||m.endings!==44)throw Error('Wrong game package');
 for(const f of fs.readdirSync(dir)){if(files.has(f))throw Error('Duplicate asset '+f);files.set(f,path.join(dir,f));}
}
const required=['The-Spare-Room-Setup-2.7.6-x64.exe','The-Spare-Room-2.7.6-mac-universal.dmg','The-Spare-Room-2.7.6-linux-x64.AppImage','The-Spare-Room-2.7.6-linux-x64.deb','The-Spare-Room-v2.7.6-web.zip','The-Spare-Room-v2.7.6-installable-web.zip','The-Spare-Room-v2.7.6-desktop-source.zip','win-BUILD.json','mac-BUILD.json','linux-BUILD.json'];
for(const name of required)if(!files.has(name))throw Error('Missing release download '+name);
const digest=file=>'sha256:'+crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const builds=['win','mac','linux'].map(p=>JSON.parse(fs.readFileSync(files.get(p+'-BUILD.json'))));if(!builds.every(b=>Number.isSafeInteger(b.build_revision)&&b.build_revision>0&&b.build_revision===builds[0].build_revision&&b.update_settings.same_version_refreshes))throw Error('Build revision mismatch');
const previousLatest=api('releases/latest');const all=api('releases?per_page=100');let release=all.find(r=>r.tag_name===tag);
if(release)throw Error('Release already exists; use an explicit refresh workflow rather than moving its tag');
if(!release)release=api('releases','POST',{tag_name:tag,target_commitish:process.env.GITHUB_SHA,name:'THE SPARE ROOM v2.7.6 — Secrets in the Walls',body:fs.readFileSync('RELEASE_NOTES.md','utf8'),draft:true,prerelease:true,make_latest:'false'});
const manifest=path.resolve('BUILD-REFRESH.json');fs.writeFileSync(manifest,JSON.stringify({schema:1,version:'2.7.6',tag,release_id:release.id,revision:JSON.parse(fs.readFileSync(files.get('win-BUILD.json'))).build_revision,commit:process.env.GITHUB_SHA},null,2));files.set('BUILD-REFRESH.json',manifest);
const sums=[...files].map(([name,file])=>digest(file).slice(7)+'  '+name).join('\n')+'\n';fs.writeFileSync('SHA256SUMS.txt',sums);files.set('SHA256SUMS.txt',path.resolve('SHA256SUMS.txt'));
execFileSync('gh',['release','upload',tag,...files.values(),'--clobber'],{stdio:'inherit'});
release=api('releases/'+release.id);for(const [name,file]of files)if(!release.assets.some(a=>a.name===name&&a.state==='uploaded'&&a.digest===digest(file)))throw Error('Checksum mismatch '+name);
api('releases/'+release.id,'PATCH',{draft:false,prerelease:true,make_latest:'false'});
const published=api('releases/'+release.id),latest=api('releases/latest');
if(!published.prerelease||published.draft||published.assets.length!==files.size)throw Error('Prerelease verification failed');
if(latest.id!==previousLatest.id)throw Error('Stable latest changed');
for(const old of previousLatest.assets)if(!latest.assets.some(a=>a.id===old.id&&a.digest===old.digest))throw Error('Stable download changed');
console.log('Published v2.7.6 prerelease with '+files.size+' verified assets; stable latest preserved.');
