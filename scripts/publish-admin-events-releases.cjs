const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process'),plan=require('../admin-events-release-plan.json');
const api=(r,method='GET',data)=>{const s=execFileSync('gh',['api','repos/'+process.env.GH_REPO+'/'+r,'--method',method,...(data?['--input','-']:[])],{encoding:'utf8',input:data?JSON.stringify(data):undefined});return s.trim()?JSON.parse(s):null;};
const hash=p=>'sha256:'+crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
if(api('git/ref/heads/admin-events-all-releases').object.sha!==process.env.GITHUB_SHA)throw Error('Superseded build');
const before=api('releases?per_page=100'),latest=api('releases/latest'),ready=[];
for(const v of plan){const r=before.find(r=>r.id===v.id);if(!r||r.tag_name!==v.tag||r.prerelease!==v.prerelease||r.draft)throw Error('Release state changed');if(api('git/ref/tags/'+v.tag).object.sha!==v.ref)throw Error('Game tag changed');
const files=new Map();for(const dir of fs.readdirSync('admin-events-artifacts').filter(n=>n.startsWith('admin-events-'+v.version+'-'))){const root=path.join('admin-events-artifacts',dir),m=JSON.parse(fs.readFileSync(path.join(root,dir.split('-').at(-1)+'-BUILD.json')));if(m.game_version!==v.version||m.game_commit!==v.ref||m.admin_events_patch_commit!==process.env.GITHUB_SHA||m.prerelease!==v.prerelease||m.week3!==(v.version==='2.7.5')||m.third_person!==(v.version==='2.7.5')||m.week2!==['2.6.5','2.7.5'].includes(v.version))throw Error('Mixed game source');for(const n of fs.readdirSync(root)){if(files.has(n))throw Error('Duplicate '+n);files.set(n,path.join(root,n));}}
if(files.size===0)throw Error('No verified files');const folder=path.join('admin-events-checksums',v.version);fs.mkdirSync(folder,{recursive:true});
for(const n of r.assets.map(a=>a.name).filter(n=>/SHA256SUMS/.test(n))){const file=path.join(folder,n);fs.writeFileSync(file,[...files].map(([name,p])=>hash(p).slice(7)+'  '+name).join('\n')+'\n');files.set(n,file);}
for(const a of r.assets)if(!files.has(a.name))throw Error('Missing original download '+v.tag+' '+a.name);
ready.push({v,r,files});}
// All versions pass the complete inventory/provenance check before the first upload.
for(const {v,r,files}of ready){execFileSync('gh',['release','upload',v.tag,...files.values(),'--clobber'],{stdio:'inherit'});const now=api('releases/'+v.id);for(const [n,p]of files)if(!now.assets.some(a=>a.name===n&&a.digest===hash(p)&&a.state==='uploaded'))throw Error('Checksum mismatch '+n);
const note=require('./admin-events-note.cjs');
api('releases/'+v.id,'PATCH',{body:r.body.replace(/\n*<!-- admin-events-refresh-start -->[\s\S]*?<!-- admin-events-refresh-end -->/g,'')+note,prerelease:v.prerelease,make_latest:v.id===latest.id?'true':'false'});console.log('Verified refreshed downloads for '+v.tag);}
if(api('releases/latest').id!==latest.id)throw Error('Latest release changed');for(const r of before){const now=api('releases/'+r.id);if(now.prerelease!==r.prerelease||now.draft!==r.draft)throw Error('Release channel changed');if(!plan.some(v=>v.id===r.id)&&r.assets.some(a=>!now.assets.some(b=>a.id===b.id&&a.digest===b.digest)))throw Error('Existing admin prerelease changed');}
console.log('PASS: all seven releases refreshed with admin flight and event previews; original gameplay and latest/prerelease status preserved.');
