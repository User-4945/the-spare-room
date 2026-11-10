const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync:run}=require('child_process'),plan=require('../settings-refresh-plan.json');
const api=(p,method='GET',body)=>JSON.parse(run('gh',['api','repos/'+process.env.GH_REPO+'/'+p,'--method',method,...(body?['--input','-']:[])],{encoding:'utf8',input:body?JSON.stringify(body):undefined}));
const hash=p=>'sha256:'+crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const before=api('releases?per_page=100'),latest=api('releases/latest'),prepared=[];
// Validate every platform of every release before changing any public download.
for(const v of plan){
 const r=before.find(x=>x.id===v.id);if(!r||r.tag_name!==v.tag||r.prerelease!==v.prerelease||r.draft)throw Error('Release state changed');
 const files=new Map(),metas=[];
 for(const platform of ['win','mac','linux']){
  const dir=path.join('settings-artifacts','settings-'+v.version+'-'+platform),meta=JSON.parse(fs.readFileSync(path.join(dir,platform+'-BUILD.json')));
  if(meta.game_version!==v.version||meta.game_commit!==v.ref||meta.runtime_commit!==process.env.GITHUB_SHA||meta.prerelease!==v.prerelease||meta.settings_modes.join(',')!=='always,stable,never')throw Error('Build provenance mismatch');metas.push(meta);
  for(const name of fs.readdirSync(dir)){if(files.has(name))throw Error('Duplicate asset '+name);files.set(name,path.join(dir,name));}
 }
 if(!metas.every(m=>m.build_revision===metas[0].build_revision))throw Error('Revision mismatch');
 const required=[/Setup.*\.exe$/,/mac-universal\.dmg$/,/\.AppImage$/,/\.deb$/,/desktop-source\.zip$/];for(const re of required)if(![...files.keys()].some(n=>re.test(n)))throw Error('Installer/source missing '+re);
 const out=path.join('settings-manifests',v.version);fs.mkdirSync(out,{recursive:true});
 const manifest=path.join(out,'BUILD-REFRESH.json');fs.writeFileSync(manifest,JSON.stringify({schema:1,version:v.version,tag:v.tag,release_id:v.id,revision:metas[0].build_revision,commit:process.env.GITHUB_SHA},null,2));files.set('BUILD-REFRESH.json',manifest);
 // Existing browser/event downloads stay intact. Keep their hashes in the combined list.
 const hashes=new Map(r.assets.filter(a=>a.digest?.startsWith('sha256:')&&!/SHA256SUMS/.test(a.name)).map(a=>[a.name,a.digest]));
 for(const [n,p]of files)hashes.set(n,hash(p));
 for(const name of new Set(['SHA256SUMS.txt',...r.assets.filter(a=>/SHA256SUMS/.test(a.name)).map(a=>a.name)])){
  const p=path.join(out,name);fs.writeFileSync(p,[...hashes].map(([n,h])=>h.slice(7)+'  '+n).join('\n')+'\n');files.set(name,p);
 }
 prepared.push({v,r,files});
}
for(const {v,r,files}of prepared){
 run('gh',['release','upload',v.tag,...[...files].filter(([n])=>n!=='BUILD-REFRESH.json').map(([,p])=>p),'--clobber'],{stdio:'inherit'});
 run('gh',['release','upload',v.tag,files.get('BUILD-REFRESH.json'),'--clobber'],{stdio:'inherit'});
 const now=api('releases/'+v.id);for(const [n,p]of files)if(!now.assets.some(a=>a.name===n&&a.digest===hash(p)))throw Error('Uploaded hash mismatch '+n);
 const note=fs.readFileSync(files.get('RELEASE_NOTES.md'),'utf8');api('releases/'+v.id,'PATCH',{body:note,prerelease:v.prerelease,make_latest:v.id===latest.id?'true':'false'});
}
if(api('releases/latest').id!==latest.id)throw Error('Latest changed');
for(const old of before){const now=api('releases/'+old.id);if(now.prerelease!==old.prerelease||now.draft!==old.draft)throw Error('Channel changed');}
console.log('Verified settings refresh for '+prepared.length+' releases; latest and preview status preserved.');
