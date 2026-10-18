const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const repo=process.env.GH_REPO,root='installer-artifacts';
function api(route,method='GET',data){let out=execFileSync('gh',['api',route,'--method',method,...(data?['--input','-']:[])],{encoding:'utf8',input:data?JSON.stringify(data):undefined});return out.trim()?JSON.parse(out):null;}
const results=[];
for(let directory of fs.readdirSync(root)){
 const dir=path.join(root,directory),manifest=JSON.parse(fs.readFileSync(path.join(dir,'INSTALLER_BUILD.json'),'utf8')),tag=manifest.game_tag;
 const exe='The-Spare-Room-Setup-'+manifest.game_version+'-x64.exe';
 execFileSync('gh',['release','upload',tag,...[exe,'SHA256SUMS.txt','DESKTOP_README.md','INSTALLER_BUILD.json'].map(f=>path.join(dir,f)),'--clobber'],{stdio:'inherit'});
 let release=api('repos/'+repo+'/releases/tags/'+encodeURIComponent(tag));
 if(!release.assets.some(a=>a.name===exe&&a.state==='uploaded'))throw Error('Installer upload incomplete');
 // The renamed prerelease must not retain a download carrying the old version.
 for(let asset of release.assets)if(asset.name.endsWith('.exe')&&asset.name!==exe)api('repos/'+repo+'/releases/assets/'+asset.id,'DELETE');
 const marker='<!-- desktop-updater-start -->',end='<!-- desktop-updater-end -->';
 const note=marker+'\n## Desktop installer refresh · 18 October 2026\n\nThe Windows installer has been rebuilt with daily and manual checks for GitHub’s latest stable release, verified downloads, automatic reopening after installation and closeable release notes. Prereleases are excluded. Game version '+manifest.game_version+' is preserved. Already-installed or previously downloaded copies require a one-time reinstall to gain the updater. Because this repository is private, configure a read-only GitHub token in the app’s GitHub access settings, or use Open latest release. Installer build details are attached in INSTALLER_BUILD.json.\n'+end;
 const body=release.body.includes(marker)?release.body.replace(/<!-- desktop-updater-start -->[\s\S]*?<!-- desktop-updater-end -->/,note):release.body+'\n\n'+note;
 api('repos/'+repo+'/releases/'+release.id,'PATCH',{body,prerelease:release.prerelease});results.push(tag);
}
const all=api('repos/'+repo+'/releases?per_page=100').filter(r=>!r.draft&&r.assets.some(a=>a.name.endsWith('.exe')));
if(all.some(r=>!results.includes(r.tag_name)))throw Error('A release installer was not refreshed');
console.log('Refreshed every release installer: '+results.join(', '));
