const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const repo=process.env.GH_REPO,tag='v.3.0.0',stableTag='v2.7.6';
function api(route,method='GET',data){const out=execFileSync('gh',['api','repos/'+repo+'/'+route,'--method',method,...(data?['--input','-']:[])],{encoding:'utf8',input:data?JSON.stringify(data):undefined});return out.trim()?JSON.parse(out):null;}
const digest=p=>'sha256:'+crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
if(api('git/ref/heads/'+process.env.GITHUB_REF_NAME).object.sha!==process.env.GITHUB_SHA)throw Error('Superseded Alpha build');
const expectedTree=execFileSync('git',['rev-parse','HEAD:developer-game'],{encoding:'utf8'}).trim();
const files=new Map(),builds=[];
for(const name of fs.readdirSync('alpha-results')){
 const dir=path.join('alpha-results',name),record=fs.readdirSync(dir).find(f=>f.endsWith('-BUILD.json'));
 if(!record)throw Error('Missing build record in '+name);
 const m=JSON.parse(fs.readFileSync(path.join(dir,record)));
 if(m.commit!==process.env.GITHUB_SHA||m.game_tree!==expectedTree||m.game_version!=='3.0.0'||m.game_tag!==tag||!m.prerelease||!m.alpha||m.endings!==61||m.basement_anomalies!==25)throw Error('Wrong Alpha package');
 if(!Number.isSafeInteger(m.revision)||m.revision<=0)throw Error('Missing build revision');
 builds.push(m);
 for(const f of fs.readdirSync(dir)){if(files.has(f))throw Error('Duplicate asset '+f);files.set(f,path.join(dir,f));}
}
if(builds.length!==3||new Set(builds.map(m=>m.platform)).size!==3||new Set(builds.map(m=>m.revision)).size!==1)throw Error('Incomplete native build set');
for(const name of ['The-Spare-Room-Setup-3.0.0-x64.exe','The-Spare-Room-3.0.0-mac-universal.dmg','The-Spare-Room-3.0.0-linux-x64.AppImage','The-Spare-Room-3.0.0-linux-x64.deb','The-Spare-Room-v3.0.0-web.zip','The-Spare-Room-v3.0.0-installable-web.zip','The-Spare-Room-v3.0.0-desktop-source.zip'])if(!files.has(name))throw Error('Missing '+name);
const stable=api('releases/tags/'+stableTag);
if(stable.id!==434235503||stable.draft||!stable.assets.some(a=>a.name==='The-Spare-Room-Setup-2.7.6-x64.exe'))throw Error('Stable target does not match the reviewed release');
const previousAssets=stable.assets.map(a=>({id:a.id,digest:a.digest,name:a.name}));
const all=api('releases?per_page=100');let alpha=all.find(r=>r.tag_name===tag);
if(alpha&&!alpha.draft)throw Error('Alpha already published; do not overwrite an existing public release');
const notes=fs.readFileSync('RELEASE_NOTES_ALPHA.md','utf8');
if(!alpha)alpha=api('releases','POST',{tag_name:tag,target_commitish:process.env.GITHUB_SHA,name:'THE SPARE ROOM v.3.0.0 — Beneath the House · Alpha',body:notes,draft:true,prerelease:true,make_latest:'false'});
const manifest='BUILD-REFRESH.json';fs.writeFileSync(manifest,JSON.stringify({schema:1,version:'3.0.0',tag,release_id:alpha.id,revision:builds[0].revision,commit:process.env.GITHUB_SHA},null,2)+'\n');files.set(manifest,path.resolve(manifest));
files.set('RELEASE_NOTES.md',path.resolve('RELEASE_NOTES_ALPHA.md'));
// Upload under the intended basename rather than the source notes filename.
fs.copyFileSync('RELEASE_NOTES_ALPHA.md','RELEASE_NOTES.md');files.set('RELEASE_NOTES.md',path.resolve('RELEASE_NOTES.md'));
fs.writeFileSync('SHA256SUMS.txt',[...files].map(([name,p])=>digest(p).slice(7)+'  '+name).join('\n')+'\n');files.set('SHA256SUMS.txt',path.resolve('SHA256SUMS.txt'));
execFileSync('gh',['release','upload',tag,...files.values(),'--clobber'],{stdio:'inherit'});
alpha=api('releases/'+alpha.id);
for(const [name,p]of files)if(!alpha.assets.some(a=>a.name===name&&a.state==='uploaded'&&a.digest===digest(p)))throw Error('Asset integrity failed '+name);
api('releases/'+alpha.id,'PATCH',{draft:false,prerelease:true,make_latest:'false',body:notes});
const stableBody=String(stable.body).replace('**Prerelease · Maintenance and secrets update**','**Stable · Maintenance and secrets update**');
api('releases/'+stable.id,'PATCH',{prerelease:false,draft:false,make_latest:'true',body:stableBody});
const latest=api('releases/latest'),published=api('releases/'+alpha.id);
if(latest.id!==stable.id||latest.prerelease||published.draft||!published.prerelease)throw Error('Release channel verification failed');
for(const old of previousAssets)if(!latest.assets.some(a=>a.id===old.id&&a.name===old.name&&a.digest===old.digest))throw Error('Stable downloads changed');
console.log('Published Alpha '+published.html_url+'; latest stable '+latest.html_url+'; stable asset identities and checksums unchanged.');
