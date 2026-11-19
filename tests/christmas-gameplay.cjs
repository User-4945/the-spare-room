const fs=require('node:fs'),vm=require('node:vm');
let setup=fs.readFileSync('tests/beneath.cjs','utf8').split('vm.runInContext(`{')[0];
const sandbox={require,process,__dirname,module:{exports:{}},console};vm.runInNewContext(setup+';module.exports={c};',sandbox);const c=sandbox.module.exports.c;
vm.runInContext('window.SPARE_ROOM_CHRISTMAS={enabled:true,snow:true,particleCount:60};',c);
for(const f of ['christmas-data','christmas','christmas-gameplay'])vm.runInContext(fs.readFileSync('events/christmas/'+f+'.js','utf8'),c);
vm.runInContext(`{
 const check=(v,m)=>{if(!v)throw Error(m)};reset();s.started=true;close();s.difficulty='intermediate';s.sanity=100;
 drainSanity(10);check(Math.abs(s.sanity-94.5)<.001,'Christmas drain is not slower');
 const api=window.SpareRoomChristmasGameplay;
 for(const e of api.data.endings)check(!api.ready(e.id),'Seasonal ending gate bypass');
 for(const item of api.data.secrets){api.discover(item.id);close();}
 check(api.progress().secrets.length===6,'Secret persistence');
 for(const e of api.data.endings){s.ending=null;close();s.started=true;check(api.ready(e.id),'Ending unreachable');check(api.finish(e.id),'Ending failed');check(s.ending.title===e.title,'Wrong ending');}
 s.ending=null;close();api.progress().classId='Lamplighter';s.sanity=100;drainSanity(10);check(Math.abs(s.sanity-95.325)<.001,'Class drain modifier');
 const pool=createAnomalyVisuals({scene:new THREE.Scene()});check(pool.christmasHat&&pool.groups.watcher.children.length>8,'Santa appearance missing');
 check(anomalyDefinitions.watcher.title==='The Red Coat Waiting','Santa anomaly missing');
 check(BENEATH.endings.length===30,'Permanent ending definitions changed');
}`,c);
console.log('PASS: 55% sanity drain, six persistent secrets, three gated endings, winter class modifiers and Santa anomaly visuals');
