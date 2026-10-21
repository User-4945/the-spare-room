const fs=require('node:fs'),{execFileSync}=require('node:child_process');
const repo=process.env.GH_REPO;
function api(route){return JSON.parse(execFileSync('gh',['api','repos/'+repo+'/'+route],{encoding:'utf8'}))}
const latest=api('releases/latest');
const releases=api('releases?per_page=100').filter(r=>!r.draft&&r.assets.some(a=>a.name.endsWith('.exe')));
const include=releases.map(r=>{
 const match=/^v?\.?([0-9]+\.[0-9]+\.[0-9]+)$/.exec(r.tag_name);if(!match)throw Error('Unrecognized game version');
 const ref=execFileSync('git',['rev-parse',r.tag_name+'^{commit}'],{encoding:'utf8'}).trim();
 return {version:match[1],tag:r.tag_name,ref,prerelease:r.prerelease};
});
if(!include.length||latest.prerelease)throw Error('Invalid release inventory');
fs.appendFileSync(process.env.GITHUB_OUTPUT,'matrix='+JSON.stringify({include})+'\n');
console.log('Preserving '+include.length+' game versions. Latest stable remains '+latest.tag_name+'.');
