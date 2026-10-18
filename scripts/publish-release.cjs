const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const repo=process.env.GH_REPO,sha=process.env.GITHUB_SHA,release=require('../release.json');
function api(route,method='GET',data){const out=execFileSync('gh',['api',route,'--method',method,...(data?['--input','-']:[])],{encoding:'utf8',input:data?JSON.stringify(data):undefined});return out.trim()?JSON.parse(out):null;}
const releases=api('repos/'+repo+'/releases?per_page=100');let found=releases.find(r=>r.tag_name===release.tag)||releases.find(r=>r.tag_name===release.renamed_from);
const body=fs.readFileSync('RELEASE_NOTES.md','utf8'),data={tag_name:release.tag,target_commitish:sha,name:release.name,body,prerelease:!!release.prerelease,draft:false,make_latest:release.prerelease?'false':'true'};
if(found)found=api('repos/'+repo+'/releases/'+found.id,'PATCH',data);else found=api('repos/'+repo+'/releases','POST',data);
const zip='release-build/The-Spare-Room-v'+release.version+'-web.zip';execFileSync('gh',['release','upload',release.tag,zip,'--clobber'],{stdio:'inherit'});
for(let asset of found.assets||[])if(asset.name.endsWith('-web.zip')&&asset.name!==path.basename(zip))api('repos/'+repo+'/releases/assets/'+asset.id,'DELETE');
const inventory=api('repos/'+repo+'/releases?per_page=100').filter(r=>!r.draft&&(r.tag_name===release.tag||r.assets.some(a=>a.name.endsWith('.exe'))));
const include=inventory.map(r=>{const m=/^v?\.?([0-9]+\.[0-9]+\.[0-9]+)$/.exec(r.tag_name);if(!m)throw Error('Unrecognized installer release '+r.tag_name);return {version:m[1],tag:r.tag_name,ref:r.tag_name===release.tag?sha:r.tag_name,prerelease:r.prerelease}});
if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,'matrix='+JSON.stringify({include})+'\n');
console.log('Release ready: '+found.html_url+'; '+include.length+' installer releases selected.');
