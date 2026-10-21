const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const config=require('../release.json'),{compareVersions}=require('../desktop/updater-core.cjs');
const repo=process.env.GH_REPO,sha=process.env.GITHUB_SHA,folder='installer-artifacts/installer-2.0.5';
function api(route,method='GET',data){const out=execFileSync('gh',['api',route,'--method',method,...(data?['--input','-']:[])],{encoding:'utf8',input:data?JSON.stringify(data):undefined});return out.trim()?JSON.parse(out):null}
if(config.version!=='2.0.5'||config.prerelease)throw Error('Expected stable v2.0.5');
const latest=api('repos/'+repo+'/releases/latest');
if(compareVersions(latest.tag_name,config.version)>0)throw Error('A newer stable release already exists; refusing to replace Latest');
const files=['The-Spare-Room-Setup-2.0.5-x64.exe','The-Spare-Room-v2.0.5-web.zip','SHA256SUMS.txt','DESKTOP_README.md','INSTALLER_BUILD.json'];
for(const file of files)if(!fs.statSync(path.join(folder,file)).isFile())throw Error('Missing verified asset '+file);
const builds=JSON.parse(fs.readFileSync(path.join(folder,'INSTALLER_BUILD.json'),'utf8'));
if(builds.game_commit!==sha||builds.scope!=='signage-only')throw Error('Incorrect installer provenance');
let release=api('repos/'+repo+'/releases?per_page=100').find(r=>r.tag_name===config.tag);
if(release&&!release.draft){const ref=api('repos/'+repo+'/git/ref/tags/'+config.tag);if(ref.object.sha!==sha)throw Error('A different v2.0.5 is already published');console.log('This verified commit is already published.');process.exit(0)}
if(release&&release.target_commitish!==sha)throw Error('A different v2.0.5 draft already exists');
if(!release)release=api('repos/'+repo+'/releases','POST',{tag_name:config.tag,target_commitish:sha,name:config.name,body:fs.readFileSync('RELEASE_NOTES.md','utf8'),draft:true,prerelease:false,make_latest:'false'});
execFileSync('gh',['release','upload',config.tag,...files.map(f=>path.join(folder,f)),'--clobber'],{stdio:'inherit'});
release=api('repos/'+repo+'/releases/'+release.id);
for(const file of files){const asset=release.assets.find(a=>a.name===file&&a.state==='uploaded'),digest=crypto.createHash('sha256').update(fs.readFileSync(path.join(folder,file))).digest('hex');if(!asset||asset.digest!=='sha256:'+digest)throw Error('Uploaded asset checksum mismatch: '+file)}
release=api('repos/'+repo+'/releases/'+release.id,'PATCH',{draft:false,prerelease:false,make_latest:'true',name:config.name,body:fs.readFileSync('RELEASE_NOTES.md','utf8')});
console.log('Published verified stable release as Latest: '+release.html_url);
