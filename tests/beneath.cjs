const fs=require('node:fs'),vm=require('node:vm');
let harness=fs.readFileSync('tests/game-smoke.cjs','utf8').split('vm.runInContext(`reset();')[0].replaceAll('dist/','developer-game/').replace("'signage','advanced'","'signage','citizen-rig','advanced'");
const marker="vm.runInContext(fs.readFileSync('developer-game/index.html'";
harness=harness.replace("vm.runInContext(fs.readFileSync('developer-game/save-store.js','utf8'),context);",'');
harness=harness.replace(marker,"vm.runInContext(fs.readFileSync('developer-game/save-store.js','utf8'),context);"+marker);
const sandbox={require,process,__dirname,module:{exports:{}},console};vm.runInNewContext(harness+';module.exports={context,vm};',sandbox);const c=sandbox.module.exports.context;
for(const name of ['action-prompts','third-person','halloween-interactions','maintenance','beneath-data','beneath'])vm.runInContext(fs.readFileSync('developer-game/'+name+'.js','utf8'),c);
vm.runInContext(`{
 const check=(v,m)=>{if(!v)throw Error(m)};reset();s.started=true;s.sanity=100;close();check(BENEATH.diary.length===20&&BENEATH.anomalies.length===25&&BENEATH.endings.length===30,'Content totals');check(deepItems.length===59,'Collectible totals');check(new Set(BENEATH.endings.map(e=>e.id)).size===30,'Duplicate endings');
 deepMove('hall');check(deepBelow()&&house.jumpHeight===-4,'Basement entry');check(canWalk(0,5),'Corridor blocked');check(!deepGateOpen('archive'),'Archive starts unlocked');check(!visibleTo({p:[.75,.12,10.5]}),'Floor occlusion leaked upwards');
 house.x=0;house.z=5;check(canWalk(-1.4,5),'Storage doorway blocked');house.x=0;check(!canWalk(1.5,15),'Locked archive has no collider');
 for(const e of BENEATH.endings)check(!deepAllowed(e),'Ungated ending '+e.id);
 for(const id of ['key-archive','key-study','key-observation','key-chamber'])deepState().items.push(id);for(const n of deepItems.filter(n=>n.type==='diary').slice(0,12))deepState().items.push(n.id);for(const n of deepItems.filter(n=>n.type==='record').slice(0,3))deepState().items.push(n.id);deepState().flags.valve=true;
 check(BENEATH.rooms.every(r=>deepGateOpen(r.id)),'Key progression softlock');buildHouse();house.x=0;house.z=15;check(canWalk(1.6,15),'Unlocked door blocked');
 // Every collectible has at least one clear, standing inspection position.
 const inaccessible=[];for(const n of deepItems){const p=deepPoint(n.room,n.id);let found=false;house.jumpHeight=-4;for(const [dx,dz]of [[0,.8],[0,-.8],[.8,0],[-.8,0],[.5,.6],[-.5,.6]]){house.x=p[0]+dx;house.z=p[2]+dz;if(canWalk(house.x,house.z)&&visibleTo({p})){found=true;break;}}if(!found)inaccessible.push(n.id);}check(!inaccessible.length,'Unreachable: '+inaccessible.join(','));
 deepState().items=deepItems.map(n=>n.id);for(const rows of Object.values(deepActions))for(const [f]of rows)deepState().flags[f]=true;deepState().flags.mum=true;deepState().witnessed=BENEATH.anomalies.map(a=>a.id);
 for(const e of BENEATH.endings){s.ending=null;s.sanityLost=false;s.sanity=e.requirements.sanityMax!==undefined?e.requirements.sanityMax:100;const r=deepRoom(deepEndRoom[e.category]);house.x=r.side*8.2;house.z=r.row*10+5;house.jumpHeight=-4;check(deepAllowed(e),'Unreachable ending '+e.id);check(deepFinish(e.id),'Ending activation failed '+e.id);close();}
 s.ending=null;s.sanity=100;deepMove('storage');close();for(const a of BENEATH.anomalies){deepRuntime.active=null;const r=deepRoom(a.room);house.x=r.side*8.2;house.z=r.row*10+5;house.jumpHeight=-4;deepState().witnessed=[];deepRuntime.sequence=0;check(deepTrigger(),'Anomaly unavailable '+a.id);deepRuntime.active=a;renderAdvanced();check(!advancedEngine.failed&&advancedEngine.deepEffects.rigs[a.id].visible,'Anomaly visual missing '+a.id);deepWitness();check(deepState().witnessed.includes(a.id),'Anomaly not recorded');close();}

 // Real seconds, rather than movement's capped dt, govern event timing.
 deepMove('storage');close();deepRuntime.active=null;deepRuntime.elapsed=0;deepRuntime.next=18;
 const priorPause=paused;paused=()=>false;house.frameSeconds=.5;
 for(let i=0;i<36;i++)updateMovement(.04);
 check(!!deepRuntime.active,'Low-frame-rate event scheduler stalled');
 const eventAge=deepRuntime.elapsed;paused=()=>true;updateMovement(.04);check(deepRuntime.elapsed===eventAge,'Reading advanced event clock');paused=()=>false;
 for(let i=0;i<37;i++)updateMovement(.04);check(!deepRuntime.active,'Event did not expire after real duration');
 for(let i=0;i<20;i++)updateMovement(.04);check(!!deepRuntime.active,'Repeat event did not recover');
 deepRuntime.elapsed=3;const beforeFaces=house.faces.length;deepSoftwareEvent();check(house.faces.length>beforeFaces,'Compatibility event has no geometry');house.faces.length=beforeFaces;
 const rig=advancedEngine.deepEffects.rigs[deepRuntime.active.id];renderAdvanced();rig.userData.sounded=true;deepRuntime.active=null;deepTrigger();renderAdvanced();check(rig.userData.generation!==undefined,'New event did not reset animation state');
 paused=priorPause;delete house.frameSeconds;close();

 deepMove('storage');close();const savedPause=paused;paused=()=>false;deepClearEvents();house.frameSeconds=.5;
 check(startAnomaly('brownout'),'Legacy admin event failed underground');const legacy=anomalyRuntime.active;updateMovement(.04);check(legacy.elapsed===.5,'Legacy admin event frozen underground');check(anomalyCaption.style.opacity==='1'&&anomalyCaption.textContent.includes('Held breath'),'Legacy caption missing');
 paused=()=>true;updateMovement(.04);check(legacy.elapsed===.5,'Admin event advanced while paused');paused=()=>false;
 deepClearEvents();check(!anomalyRuntime.active&&!deepRuntime.active&&anomalyCaption.style.opacity==='0','Clear left an event or caption');
 check(deepAdminSpawn('coat'),'Basement admin spawn rejected');updateMovement(.04);check(deepRuntime.elapsed===.5&&anomalyCaption.style.opacity==='1'&&anomalyCaption.textContent.includes('Small Shoulders'),'Basement animation/caption stalled');
 check(!deepAdminSpawn('clock'),'Wrong-room admin event allowed');deepClearEvents();paused=savedPause;delete house.frameSeconds;
 const snapshot=JSON.parse(JSON.stringify(s));check(validateStory(snapshot)?.beneath.items.length===59,'Preview save rejected');check(!validateStory({...snapshot,beneath:{schema:3,items:4}}).beneath,'Corrupt optional progress retained');
 house.x=0;house.z=5;house.jumpHeight=-4;renderAdvanced();check(advancedEngine.world.children.filter(m=>m.userData.deepRoom==='surface').every(m=>!m.visible),'Surface not culled');check(!deepVisibility('surface'),'Floor culling failed');deepMove('surface');check(!deepBelow()&&deepVisibility('surface'),'Return upstairs failed');check(!visibleTo({p:[0,-2.8,5]}),'Basement visible through floor');
 const oldStorage=c=>{};check(STORY_KEY==='spare-room-beneath-v3','Preview save isolation');check(!targets().some(t=>t.week2||t.week3),'Retired event target');console.log('PASS: 59 reachable collectibles, 20 diary entries, 25 rendered anomalies, 30 gated endings, ten-room progression, collision, culling, save validation and isolated preview');
}`,c);
// Exercise the actual admin command route with a test-only authorized session.
vm.runInContext(`var adminAuthConfig={};function createAdminAuth(){return {isAuthenticated:()=>true,touch(){},status:()=>({expiresIn:600000}),authorize:async()=>({ok:true}),lock(){},authenticate:async()=>({ok:true})};}`,c);
vm.runInContext(fs.readFileSync('developer-game/admin-panel.js','utf8'),c);
(async()=>{await vm.runInContext(`(async()=>{
 const check=(v,m)=>{if(!v)throw Error(m)};s.ending=null;s.sanityLost=false;s.started=true;deepMove('storage');close();house.frameSeconds=.5;
 check((await window.spareAdmin.dispatch('spawn',{id:'brownout'})).ok,'Admin legacy dispatch failed');updateMovement(.04);check(anomalyRuntime.active.elapsed===.5&&anomalyCaption.style.opacity==='1','Admin legacy dispatch froze');
 check((await window.spareAdmin.dispatch('spawn',{id:'beneath:coat'})).ok,'Admin basement dispatch failed');check(!anomalyRuntime.active&&deepRuntime.active.id==='coat','Admin spawn did not replace previous event');updateMovement(.04);check(deepRuntime.elapsed===.5&&anomalyCaption.textContent.includes('Small Shoulders'),'Admin basement dispatch froze');
 await window.spareAdmin.dispatch('clear');check(!deepRuntime.active&&!anomalyRuntime.active&&anomalyCaption.style.opacity==='0','Admin clear left caption');
 check(!(await window.spareAdmin.dispatch('spawn',{id:'beneath:clock'})).ok,'Admin ignored required room');window.spareAdmin.close();
 console.log('PASS: actual admin spawn/resume/clear routes, basement and legacy clocks, captions and room restrictions');
})()`,c);})().catch(e=>{console.error(e);process.exitCode=1;});
