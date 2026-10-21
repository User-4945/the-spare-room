const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const [version,tag,ref,pre]=process.argv.slice(2);
if(!/^\d+\.\d+\.\d+$/.test(version)||!/^v?\.?\d+\.\d+\.\d+$/.test(tag)||!ref||!['true','false'].includes(pre))throw Error('Invalid installer release');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const gameCommit=git('rev-parse',ref+'^{commit}');
// Always restore the exact game tree, including the active prerelease. Shared
// desktop changes cannot add newer game files to a historical installer.
fs.rmSync('dist',{recursive:true,force:true});
execFileSync('git',['restore','--source',gameCommit,'--worktree','--','dist','tests/game-smoke.cjs'],{stdio:'inherit'});
const expected=git('ls-tree','-r',gameCommit,'--','dist').split('\n').filter(Boolean);
for(const line of expected){const m=/^\d+ blob ([a-f0-9]+)\t(.+)$/.exec(line);if(!m||git('hash-object',m[2])!==m[1])throw Error('Game file changed: '+line)}
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)])}
if(files('dist').length!==expected.length)throw Error('Unexpected game files');
const upstream=JSON.parse(execFileSync('gh',['api','repos/'+process.env.GH_REPO+'/releases/tags/'+encodeURIComponent(tag)],{encoding:'utf8'}));
if(upstream.prerelease!==(pre==='true'))throw Error('Release channel changed during build');
const addition='\n\n## Windows Settings refresh\n\nGame version '+version+' is preserved. Open SETTINGS or Game → Settings for update preferences and Check for updates. Include prerelease updates is off by default. Save preferences remembers your choice and immediately checks the selected channel. Unchecked checks only GitHub’s latest stable release; checked also offers newer prereleases. Newer installed versions are never downgraded. Automatic checks run once per day while open and online. Updates are verified, preserve saves and preferences, reopen the app, and show closeable release notes. No GitHub login is needed. Existing copies need a one-time reinstall to receive these settings.\n';
const notes=require('./desktop-settings-notes.cjs').originalNotes(upstream.body)+addition;
for(const filename of ['package.json','package-lock.json']){const p=JSON.parse(fs.readFileSync(filename,'utf8'));p.version=version;if(p.packages)p.packages[''].version=version;fs.writeFileSync(filename,JSON.stringify(p,null,2)+'\n')}
fs.writeFileSync('release.json',JSON.stringify({name:upstream.name,version,tag,prerelease:pre==='true',generation_version:2},null,2));
fs.writeFileSync('RELEASE_NOTES.md',notes);
fs.writeFileSync('DESKTOP_README.md','# The Spare Room '+tag+' — Windows desktop\n\nDownload and run The-Spare-Room-Setup-'+version+'-x64.exe. The game runs offline. Updates require an internet connection.\n\n## Settings and updates\n\nOpen SETTINGS in the game or Game → Settings. Leave Include prerelease updates unchecked for the latest stable releases only. Check it to also receive newer prereleases. Click Save preferences to remember your choice and check immediately. Check for updates uses your saved choice. Automatic checks run once every 24 hours while open and online. A newer installed version is never downgraded, even after opting out of prereleases.\n\nClick Update to download and verify the installer, install, and reopen with release notes. Saves and preferences survive updates. Open release page provides a browser fallback. No GitHub account or token is needed; optional saved tokens use Windows protection and rejected tokens fall back to public access.\n\nWASD: walk. Shift: sprint. Space: jump. Click: capture mouse. E / click: interact. Esc: release mouse. F11: fullscreen. Ctrl+Q: quit. Saves and preferences remain in %APPDATA%\\The Spare Room.\n\nPreviously installed copies need a one-time reinstall from the refreshed installer to gain Settings. These installers are unsigned. The matching desktop-source ZIP contains this version’s game and the refreshed desktop code; INSTALLER_BUILD.json records both source commits.\n');
fs.writeFileSync('README.md',git('show',gameCommit+':README.md')+'\n\nSee DESKTOP_README.md for the refreshed Windows Settings page and update preferences.\n');
fs.writeFileSync('installer-build.json',JSON.stringify({game_version:version,game_tag:tag,game_commit:gameCommit,game_tree:git('rev-parse',gameCommit+':dist'),verified_game_files:expected.length,updater_version:'2026.10.21',updater_commit:process.env.GITHUB_SHA,prerelease:pre==='true',update_settings:{default:'stable',prereleases:'opt-in',never_downgrade:true}},null,2));
console.log('Verified '+expected.length+' original game files for '+tag+'; shared Settings added only to desktop files.');
