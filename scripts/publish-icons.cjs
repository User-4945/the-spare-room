const versions=[{"version":"2.5.0","sha":"25212ffdb3bdaf8596c42b12c05a4b033b665843","tag":"v.2.5.0","id":421814321,"prerelease":false,"old":"b5b5771592b982fef401d8fc1208705a1e46cbb8"},{"version":"2.6.5","sha":"c9c4a7855f4c9363015345511e7d788d2f1783e5","tag":"v2.6.5","id":422913580,"prerelease":true,"old":"d60f019a0dd5464e21f9abcc26a03c2aac133ae9"}];
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const repo=process.env.GH_REPO;
function api(route,method='GET',data){const out=execFileSync('gh',['api','repos/'+repo+'/'+route,'--method',method,...(data?['--input','-']:[])],{encoding:'utf8',input:data?JSON.stringify(data):undefined});return out.trim()?JSON.parse(out):null;}
if(api('git/ref/heads/halloween-favicons').object.sha!==process.env.GITHUB_SHA)throw Error('Superseded icon build');
const before=api('releases?per_page=100'),latest=api('releases/latest');
const digest=file=>'sha256:'+crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
for(const v of versions){
 let release=before.find(r=>r.id===v.id);if(!release||release.tag_name!==v.tag||release.draft||release.prerelease!==v.prerelease)throw Error('Unexpected release state');
 if(api('git/ref/tags/'+v.tag).object.sha!==v.old)throw Error('Release tag changed during build');
 const files=new Map();for(const name of fs.readdirSync('release-artifacts').filter(n=>n.startsWith('halloween-icons-'+v.version+'-'))){const dir=path.join('release-artifacts',name),record=fs.readdirSync(dir).find(n=>n.endsWith('-BUILD.json'));if(!record)throw Error('No build provenance');const m=JSON.parse(fs.readFileSync(path.join(dir,record)));if(m.game_version!==v.version||m.game_commit!==v.sha||m.icon_patch_commit!==process.env.GITHUB_SHA||m.prerelease!==v.prerelease||m.endings!==(v.prerelease?41:38))throw Error('Mixed release features');for(const f of fs.readdirSync(dir)){if(files.has(f))throw Error('Duplicate '+f);files.set(f,path.join(dir,f));}}
 const expected=release.assets.map(a=>a.name);for(const name of expected.filter(n=>n!=='SHA256SUMS.txt'))if(!files.has(name))throw Error('Missing original download '+name);
 const dir=path.join('checksums',v.version);fs.mkdirSync(dir,{recursive:true});const sumPath=path.join(dir,'SHA256SUMS.txt');fs.writeFileSync(sumPath,[...files].map(([n,f])=>digest(f).slice(7)+'  '+n).join('\n')+'\n');files.set('SHA256SUMS.txt',sumPath);
 if(files.size!==expected.length)throw Error('Download set changed');
 const note='### Halloween icon refresh\nA small jack-o’-lantern accompanies the doorway symbol in browser tabs, installed web apps and desktop installers. Gameplay and release status are unchanged. Reinstall this refreshed build if you already installed the same version.';
 api('releases/'+v.id,'PATCH',{draft:true,prerelease:v.prerelease,make_latest:'false',body:release.body+'\n\n'+note,target_commitish:v.sha});
 api('git/refs/tags/'+v.tag,'PATCH',{sha:v.sha,force:true});
 execFileSync('gh',['release','upload',v.tag,...files.values(),'--clobber'],{stdio:'inherit'});
 release=api('releases/'+v.id);for(const [name,file]of files)if(!release.assets.some(a=>a.name===name&&a.state==='uploaded'&&a.digest===digest(file)))throw Error('Upload checksum mismatch: '+name);
 api('releases/'+v.id,'PATCH',{draft:false,prerelease:v.prerelease,make_latest:v.prerelease?'false':'true'});
 if(api('git/ref/tags/'+v.tag).object.sha!==v.sha)throw Error('Source archive tag does not match installers');
 console.log('Refreshed '+v.tag+' with '+files.size+' checksum-verified downloads from its own gameplay commit.');
}
if(api('releases/latest').id!==latest.id)throw Error('Latest stable changed');
for(const old of before.filter(r=>!versions.some(v=>v.id===r.id))){const now=api('releases/'+old.id);if(now.prerelease!==old.prerelease||now.assets.length!==old.assets.length||old.assets.some(a=>!now.assets.some(b=>b.id===a.id&&b.digest===a.digest)))throw Error('An unrelated release changed');}
console.log('PASS: v2.5.0 remains stable/latest; v2.6.5 remains a prerelease; other releases unchanged.');
