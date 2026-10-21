const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const repo=process.env.GH_REPO,root='installer-artifacts';
function api(route,method='GET',data){const out=execFileSync('gh',['api',route,'--method',method,...(data?['--input','-']:[])],{encoding:'utf8',input:data?JSON.stringify(data):undefined});return out.trim()?JSON.parse(out):null}
const latest=api('repos/'+repo+'/releases/latest'),results=[];
for(const directory of fs.readdirSync(root)){
 const dir=path.join(root,directory),manifest=JSON.parse(fs.readFileSync(path.join(dir,'INSTALLER_BUILD.json'),'utf8')),tag=manifest.game_tag;
 if(manifest.updater_commit!==process.env.GITHUB_SHA||manifest.update_settings?.never_downgrade!==true||!manifest.game_tree)throw Error('Incorrect installer provenance');
 const before=api('repos/'+repo+'/releases/tags/'+encodeURIComponent(tag));
 if(before.prerelease!==manifest.prerelease)throw Error('Release channel changed');
 const exe='The-Spare-Room-Setup-'+manifest.game_version+'-x64.exe',source='The-Spare-Room-v'+manifest.game_version+'-desktop-source.zip';
 const checksum=[exe,source].map(name=>crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,name))).digest('hex')+'  '+name);
 for(const asset of before.assets.filter(a=>a.name.endsWith('-web.zip'))){const digest=/^sha256:([a-f0-9]{64})$/i.exec(asset.digest||'')?.[1];if(digest)checksum.push(digest+'  '+asset.name)}
 fs.writeFileSync(path.join(dir,'SHA256SUMS.txt'),checksum.join('\n')+'\n');
 const names=[exe,source,'SHA256SUMS.txt','DESKTOP_README.md','INSTALLER_BUILD.json'];
 execFileSync('gh',['release','upload',tag,...names.map(f=>path.join(dir,f)),'--clobber'],{stdio:'inherit'});
 const release=api('repos/'+repo+'/releases/tags/'+encodeURIComponent(tag));
 for(const name of names){const asset=release.assets.find(a=>a.name===name&&a.state==='uploaded');const expected=crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,name))).digest('hex');if(!asset||asset.digest!=='sha256:'+expected)throw Error('Upload digest mismatch: '+name)}
 for(const web of before.assets.filter(a=>a.name.endsWith('-web.zip')))if(!release.assets.some(a=>a.id===web.id&&a.digest===web.digest))throw Error('Browser game asset changed');
 const marker='<!-- desktop-updater-start -->',end='<!-- desktop-updater-end -->';
 const note=marker+'\n## Windows Settings refresh · 21 October 2026\n\nOpen **SETTINGS** in the game or **Game → Settings**. Use **Check for updates**, or change **Include prerelease updates** and click **Save preferences** to remember the choice and check immediately. Prereleases are **off by default**: unchecked uses GitHub’s latest stable release; checked also offers newer prereleases. Automatic checks run once per day while open and online. A newer installed version is never downgraded, including after opting out of prereleases.\n\nUpdate downloads are verified, saves and preferences are preserved, and the app reopens with closeable release notes. No GitHub login is needed. **Game version '+manifest.game_version+' and its original features are unchanged.** The matching desktop-source ZIP includes this version’s game and the updated desktop code; INSTALLER_BUILD.json records both source commits and the verified game tree. Browser ZIPs and original game tags are unchanged. Existing installations need a one-time reinstall from this refreshed installer to receive Settings.\n'+end;
 const body=require('./desktop-settings-notes.cjs').originalNotes(release.body)+'\n\n'+note;
 api('repos/'+repo+'/releases/'+release.id,'PATCH',{body,prerelease:release.prerelease,make_latest:release.id===latest.id?'true':'false'});results.push(tag);
}
const all=api('repos/'+repo+'/releases?per_page=100').filter(r=>!r.draft&&r.assets.some(a=>a.name.endsWith('.exe')));
if(all.some(r=>!results.includes(r.tag_name)))throw Error('A release installer was not refreshed');
api('repos/'+repo+'/releases/'+latest.id,'PATCH',{make_latest:'true'});
if(api('repos/'+repo+'/releases/latest').id!==latest.id)throw Error('Latest stable changed');
console.log('Refreshed installers and matching source for '+results.join(', ')+'. Latest stable and all game tags preserved.');
