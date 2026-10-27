const fs=require('node:fs'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const plan=require('../admin-release-plan.json'),v=plan.find(v=>v.version===process.argv[2]);if(!v)throw Error('Unknown version');
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const admin=Object.fromEntries(['admin-panel.js','admin-auth.js','admin-auth-config.js'].map(n=>[n,fs.readFileSync('dist/'+n)]));
fs.rmSync('dist',{recursive:true,force:true});execFileSync('git',['restore','--source',v.ref,'--worktree','--','dist','tests/game-smoke.cjs']);
const expected=git('ls-tree','-r',v.ref,'--','dist').split('\n').filter(Boolean);
for(const line of expected){const m=/^\d+ blob ([a-f0-9]+)\t(.+)$/.exec(line);if(!m||git('hash-object',m[2])!==m[1])throw Error('Original game differs: '+line);}
const originalHTML=fs.readFileSync('dist/index.html','utf8');
for(const [n,b]of Object.entries(admin))fs.writeFileSync('dist/'+n,b);
fs.writeFileSync('dist/index.html',originalHTML.replace('</body>','<script src="admin-auth-config.js"></script><script src="admin-auth.js"></script><script src="admin-panel.js"></script></body>'));
// Keep the original release's favicon/branding in its native packages.
if(v.version==='2.5.0'){execFileSync('git',['restore','--source',v.ref,'--worktree','--','desktop/icon.ico','platforms/icons']);}
else{const iconCommit=git('log','--reverse','--format=%H','--','platforms/icons/icon-1024.png').split('\n')[0];if(!iconCommit)throw Error('Original platform icons unavailable');execFileSync('git',['restore','--source',iconCommit,'--worktree','--','platforms/icons']);const windowsIconCommit=git('log','--reverse','--format=%H','--','desktop/icon.ico').split('\n')[0];if(!windowsIconCommit)throw Error('Original Windows icon unavailable');execFileSync('git',['restore','--source',windowsIconCommit,'--worktree','--','desktop/icon.ico']);}
const api=route=>JSON.parse(execFileSync('gh',['api','repos/'+process.env.GH_REPO+'/'+route],{encoding:'utf8'}));
const r=api('releases/'+v.id);if(r.tag_name!==v.tag||r.prerelease!==v.prerelease||r.draft)throw Error('Release state changed');
for(const name of ['package.json','package-lock.json']){const p=JSON.parse(fs.readFileSync(name));p.version=v.version;if(p.packages)p.packages[''].version=v.version;fs.writeFileSync(name,JSON.stringify(p,null,2)+'\n');}
fs.writeFileSync('release.json',JSON.stringify({name:r.name,version:v.version,tag:v.tag,prerelease:v.prerelease,generation_version:2},null,2));
const note='\n\n<!-- admin-panel-refresh-start -->\n## Admin Panel refresh\nOpen ADMIN or press F8 and sign in with the owner credentials. Teleport, set sanity, revive after sanity loss, change story nights and daylight, refill supplies, or enable session-only sanity/stamina/time tools. Versions with an anomaly system also support spawning and clearing their existing anomalies. Login and commands require internet authorization; credentials are stored privately on the server and never in the game files. Normal play remains offline. Sessions lock after ten minutes or going offline.\n\nThis refresh preserves this version’s original gameplay, endings and release channel. Existing same-version installations need a one-time reinstall to receive the panel. The matching desktop-source ZIP includes the exact refreshed source.\n<!-- admin-panel-refresh-end -->\n';
fs.writeFileSync('RELEASE_NOTES.md',r.body.replace(/\n*<!-- admin-panel-refresh-start -->[\s\S]*?<!-- admin-panel-refresh-end -->/g,'')+note);
fs.writeFileSync('DESKTOP_README.md',fs.readFileSync('DESKTOP_README.md','utf8')+'\n'+note);
fs.writeFileSync('installer-build.json',JSON.stringify({game_version:v.version,game_tag:v.tag,game_commit:v.ref,game_tree:git('rev-parse',v.ref+':dist'),admin_patch_commit:process.env.GITHUB_SHA,updater_commit:process.env.GITHUB_SHA,prerelease:v.prerelease,platform:process.argv[3],verified_original_files:expected.length,allowed_game_changes:['index.html','admin-panel.js','admin-auth.js','admin-auth-config.js'],original_index_sha256:crypto.createHash('sha256').update(originalHTML).digest('hex'),update_settings:{default:'stable',prereleases:'opt-in',never_downgrade:true}},null,2));
// The original smoke suite still runs first; older suites predate harness exports.
if(!fs.readFileSync('tests/game-smoke.cjs','utf8').includes('module.exports='))fs.appendFileSync('tests/game-smoke.cjs','\nmodule.exports={context,vm};\n');
console.log('Restored and verified '+expected.length+' original files for '+v.tag+'; added only three admin scripts and their HTML tags.');
