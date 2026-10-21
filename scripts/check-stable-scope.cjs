const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {selectRelease}=require('../desktop/updater-core.cjs');
const release=require('../release.json');
assert.equal(release.version,'2.0.5');assert.equal(release.prerelease,false);
const allowed=new Set(['dist/index.html','dist/advanced.js','dist/city.js','dist/upstairs.js','dist/signage.js']);
const changed=execFileSync('git',['diff','--name-only','v2.0.0','HEAD','--','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
assert(changed.every(file=>allowed.has(file)),'Game changes extend beyond the requested signage backport: '+changed.join(', '));
assert(!fs.existsSync('dist/anomalies.js'),'Prerelease anomaly module must not ship');
for(const file of allowed){const code=fs.readFileSync(file,'utf8');assert(!/anomalyDefinitions|poseAnomalyResident|updateAnomalyVisuals|anomaly-caption|anomalies\.js/.test(code),'Prerelease hook in '+file)}
assert(fs.readFileSync('dist/index.html','utf8').includes('The Spare Room v2.0.5'));
const candidate={id:1,tag_name:'v2.0.5',draft:false,prerelease:false,assets:[]};
assert(selectRelease(candidate,'2.0.0'),'Stable 2.0.0 must be offered 2.0.5');
assert(!selectRelease(candidate,'2.1.0',true),'Prerelease 2.1.0 must not downgrade');
console.log('PASS: only signage and version labels differ from v2.0.0; no prerelease anomalies; v2.1.0 cannot downgrade to v2.0.5.');
