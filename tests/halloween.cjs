const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const {context,vm,assert}=require('./game-smoke.cjs');
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'spare-halloween-'));
try{
 const out=path.join(folder,'game');
 cp.execFileSync(process.execPath,['scripts/prepare-halloween.cjs',out]);
 const html=fs.readFileSync(path.join(out,'index.html'),'utf8'),city=fs.readFileSync(path.join(out,'city.js'),'utf8');
 assert(html.includes("localStorage.getItem('spare-room-halloween-v1')"));
 assert(html.includes("localStorage.setItem('spare-room-halloween-v1'"));
 assert(!html.includes("'spare-room-v1'"));
 assert(city.includes("'spare-room-halloween-endings'"));
 assert(!city.includes("'spare-room-endings'"));
 for(const file of ['advanced.js','anomalies.js','house.js','upstairs.js'])assert.equal(fs.readFileSync(path.join(out,file),'utf8'),fs.readFileSync('dist/'+file,'utf8'));
 console.log('PASS: isolated Halloween saves/journal, original game modules preserved');
}finally{fs.rmSync(folder,{recursive:true,force:true})}
vm.runInContext(fs.readFileSync('events/halloween/halloween.js','utf8'),context);
vm.runInContext(`
{
const check=(value,message)=>{if(!value)throw Error(message)};
const button=label=>{const all=[];function visit(node){if(node.textContent===label&&node.onclick)all.push(node);for(const child of node.children||[])visit(child)}visit($('modal'));check(all.length===1,'Missing/duplicate action: '+label);all[0].onclick()};
let reading=false;paused=()=>reading;
function freshEvent(){reset();s.started=true;s.difficulty='intermediate';s.sanity=100;s.pendingSanity=0;reading=false;house.keys={};}
freshEvent();
for(const id of Object.keys(halloweenEndings)){ending('halloween:'+id);check(!s.ending,'Ungated seasonal ending: '+id)}
check(s.worldSeconds===180&&s.cityOpen,'Event evening/open city missing');
reading=true;advanceHalloween(5);check(halloweenState().elapsed===0,'Countdown advances while reading');reading=false;
for(let i=0;i<901;i++)advanceHalloween(.1);check(halloweenState().midnight,'Midnight never opens');
check(s.sanity===100,'Clock imposes unseen damage');
const h=halloweenState();halloweenReadInvitation();check(h.invitation&&s.sanity===100&&s.pendingSanity===3,'Invitation damage not deferred');close();check(s.sanity===97,'Invitation close damage wrong');
halloweenReadInvitation();close();check(s.sanity===97,'Rereading invitation costs sanity');
for(const n of halloweenSeals){
 halloweenLightSeal(n.id);check(!h.seals.includes(n.id),'Seal skips its note');
 let before=s.sanity;halloweenReadNote(n.id);check(s.sanity===before,'Note damage before closing');close();check(s.sanity===before-4,'Note damage after closing');
 halloweenLightSeal(n.id);button('Light the seal');check(h.seals.includes(n.id),'Seal action fails');check(s.pendingSanity===6,'Seal damage missing');close();
 before=s.sanity;halloweenLightSeal(n.id);close();check(s.sanity===before,'Seal can be farmed/recharged');
}
check(halloweenReady()&&halloweenEndingAllowed('unmask'),'Base ritual cannot complete');
check(!halloweenEndingAllowed('hearth')&&!halloweenEndingAllowed('procession'),'Secret paths bypass prerequisites');
halloweenPromise();check(halloweenEndingAllowed('hearth'),'Mother path missing');
for(const id of ['station','library','cinema']){speakResident(id);button('Trick or treat');close()}
check(h.candy===3&&h.treats.length===3,'Treats not collected');
speakResident('station');check(h.candy===3,'Duplicate treats');close();
halloweenGuest();button('Offer three sweets');check(h.candy===0&&h.offering===3,'Offering not consumed');close();
halloweenGuest();button('Take the spare mask');close();check(h.mask&&halloweenEndingAllowed('procession'),'Procession prerequisite missing');
for(const id of Object.keys(halloweenEndings)){s.ending=null;ending('halloween:'+id);check(s.ending?.title===halloweenEndings[id][0],'Failed seasonal ending: '+id)}
check(endingBook.filter(e=>e.title.startsWith('Ending 3')).length>=4,'Endings not journalled');
freshEvent();halloweenState().candy=1;s.sanity=98;halloweenEatSweet();check(s.sanity===100&&halloweenState().candy===0,'Sweet recovery/cap wrong');halloweenEatSweet();check(s.sanity===100,'Sweet underflow');
halloweenState().candy=1;halloweenEatSweet();check(halloweenState().candy===1,'Wasted sweet at full sanity');
s.sanityLost=true;halloweenState().elapsed=89.99;advanceHalloween(.1);check(!halloweenState().midnight,'Clock advances after loss');
freshEvent();renderAdvanced();check(!advancedEngine.failed,'Event renderer failed');
const pool=advancedEngine.halloween;check(pool&&pool.decorations.length===47&&pool.seals.length===3,'Missing Halloween geometry');
for(let seed=1;seed<=5;seed++){
 s.worldSeed=seed;house.citySeed=null;buildHouse();renderAdvanced();check(advancedEngine.halloween===pool,'Rebuild leaked effect pool');
 for(const n of halloweenSeals){const c=cityWorld().find(c=>c.id===n.id);house.jumpHeight=0;s.room=n.id;house.x=c.x+1.8;house.z=c.z+3;house.a=Math.PI;house.pitch=0;
  check(canWalk(c.x,c.z+4.2)&&canWalk(c.x,c.z+3.7),'Blocked city entrance');check(canWalk(house.x,house.z),'Bad event travel point');
  const ts=targets().filter(t=>t.event&&Math.abs(t.p[0]-(c.x+1.8))<.01&&Math.abs(t.p[2]-(c.z+1))<.3);check(ts.length===2&&ts.every(t=>visibleTo(t)),'Clues hidden by scenery');
  const lamp=pool.seals.find(item=>item.id===n.id);check(Math.abs(lamp.group.position.x-ts[0].p[0])<.01,'Prop does not match target');
 }
}
check(advancedEngine.scene.children.filter(g=>g.name==='halloween-pool').length===1,'Multiple pools');
check(advancedEngine.actors.every(a=>a.root.getObjectByName('halloween-mask')),'Missing resident masks');
for(const place of ['invitation','bell','guest','library','cinema','chapel']){halloweenTravel(place);check(canWalk(house.x,house.z),'Travel obstructed: '+place)}
halloweenState().notes=['chapel'];save();const copy=JSON.parse(JSON.stringify(s));s=copy;check(halloweenState().notes.includes('chapel'),'Event state not serializable');
const count=endingBook.length;reset();check(!halloweenState().midnight&&halloweenState().notes.length===0&&halloweenState().candy===0,'Restart retains puzzle state');check(endingBook.length===count,'Restart deletes journal');
check(taskRows().length===5&&taskRows()[0].label.includes('invitation'),'Event checklist missing');
console.log('PASS: 4 gated endings, three note/lantern puzzles, deferred once-only sanity, pause/resume clock, treat spending/recovery, five seeded layouts, aligned reachable props, pooled graphics and restart persistence');
}
`,context);
vm.runInContext(fs.readFileSync('events/halloween/more-halloween.js','utf8'),context);
vm.runInContext(`{
const check=(v,m)=>{if(!v)throw Error(m)};
const click=text=>{let found;function find(n){if(n.textContent===text&&n.onclick)found=n;for(const c of n.children||[])find(c)}find($('modal'));check(found,'Missing action '+text);found.onclick()};
reset();s.started=true;s.difficulty='intermediate';s.sanity=100;let h=halloweenState(),m=moreHalloweenState();
for(const id of Object.keys(moreHalloweenEndings)){ending('hallows-extra:'+id);check(!s.ending,'Extra ending bypass '+id)}
halloweenChild();check(m.childMet&&s.pendingSanity===4&&s.sanity===100,'Child discovery not deferred');close();
halloweenRibbon();close();check(m.ribbon,'Ribbon missing');halloweenChild();click('Return the ribbon and one sweet');check(!m.childHelped,'Child accepts nonexistent sweet');close();
h.candy=1;halloweenChild();click('Return the ribbon and one sweet');close();check(m.childHelped&&h.candy===0,'Ribbon/sweet exchange failed');check(!moreHalloweenAllowed('child'),'Child ignores porch promise');halloweenPromise();close();halloweenPorch();click('Follow the child’s shadow');click('Choose this ending');check(s.ending?.title.startsWith('Ending 36'),'Child ending failed');
s.ending=null;h.seals=[];halloweenSeed('library');check(m.seeds.length===0,'Unlit seed acquired');close();h.seals=halloweenSeals.map(n=>n.id);for(const n of halloweenSeals){halloweenSeed(n.id);close();}let count=m.seeds.length;halloweenSeed('library');close();check(m.seeds.length===count&&count===3,'Seed duplication');halloweenFlowerBed();check(!m.planted,'Planting bypasses water');close();flags().water=true;halloweenFlowerBed();click('Plant and water the three black seeds');close();check(m.planted&&moreHalloweenAllowed('orchard'),'Orchard path failed');ending('hallows-extra:orchard');check(s.ending?.title.startsWith('Ending 37'),'Orchard ending failed');
s.ending=null;h.mask=false;halloweenWaxMirror();check(!m.maskWax,'Mirror accepts absent mask');close();flags().mirror=true;h.mask=true;halloweenWaxMirror();click('Press the spare mask into the glass');close();check(m.maskWax,'Mask wax missing');ending('hallows-extra:mirror');check(s.ending?.title.startsWith('Ending 38'),'Mirror ending failed');
s.ending=null;renderAdvanced();check(advancedEngine.halloweenMore,'Child model missing');let child=targets().find(t=>t.event==='child');check(child.p[2]===-1.2&&advancedEngine.halloweenMore.group.position.z===1.2,'Child target/model disagree');let pool=advancedEngine.halloweenMore;buildHouse();renderAdvanced();check(pool===advancedEngine.halloweenMore,'Extra models leak on rebuild');
reset();check(moreHalloweenState().seeds.length===0&&!moreHalloweenState().ribbon&&!moreHalloweenState().maskWax,'Extra quests persist across new runs');
console.log('PASS: three extra gated endings, child exchange and relocation, seed uniqueness and water requirement, mask/mirror puzzle, deferred costs and pooled models');
}`,context);
