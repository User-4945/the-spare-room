const fs=require('node:fs'),path=require('node:path');
const preview=process.argv.includes('--preview'),root=path.join(__dirname,'..');
const target=path.join(root,'christmas-build','web');fs.mkdirSync(target,{recursive:true});fs.cpSync(path.join(root,'developer-game'),target,{recursive:true});
for(const file of ['christmas-data.js','christmas.js','christmas-gameplay.js','christmas-scenery.js'])fs.copyFileSync(path.join(root,'events/christmas',file),path.join(target,file));
fs.writeFileSync(path.join(target,'christmas-config.js'),'window.SPARE_ROOM_CHRISTMAS={enabled:true,snow:true,particleCount:180};\n');
let html=fs.readFileSync(path.join(target,'index.html'),'utf8');html=html.replaceAll('v3.0.0','v3.5.0').replaceAll('ALPHA','CHRISTMAS WEEK 1');
fs.writeFileSync(path.join(target,'index.html'),html);
fs.writeFileSync(path.join(root,'christmas-build','release.json'),JSON.stringify({version:'3.5.0',tag:'v.3.5.0',prerelease:preview,robloxVersion:'3.7.0',startUTC:'2026-12-11T20:00:00Z',preparedAt:new Date().toISOString()},null,2));
console.log('Built '+(preview?'explicit Christmas prerelease preview':'Christmas release candidate')+'. No publish performed.');

