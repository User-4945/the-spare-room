const fs=require('node:fs'),{context,vm}=require('./game-smoke.cjs');
const listeners={};context.document.addEventListener=(name,fn)=>{(listeners[name]??=[]).push(fn)};context.window.addEventListener=(name,fn)=>{(listeners['window:'+name]??=[]).push(fn)};
context.emitHoldEvent=(name,e)=>{for(const fn of listeners[name]||[])fn({preventDefault(){},stopImmediatePropagation(){},...e})};
context.document.exitPointerLock=()=>{};
for(const n of ['halloween','more-halloween','action-prompts','release-event','week2','third-person','week3','halloween-interactions'])if(fs.existsSync('dist/'+n+'.js'))vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),context);
vm.runInContext(`{
const check=(v,m)=>{if(!v)throw Error(m)};if(typeof enterReleaseWeek==='function')enterReleaseWeek('week1');s.started=true;s.ending=null;s.sanityLost=false;close();paused=()=>false;locked=()=>true;
let actions=0,which='A',available=true;const oldTargets=updateTargets;updateTargets=()=>{house.target=available?{name:which,action:'Read note',p:[house.x+.5,1.4,house.z],fn:()=>actions++}:null;updateActionPrompt();};updateTargets();
check(!actionPrompt.hidden,'Nearby prompt');activateActionPrompt();actionPrompt.onclick();check(actions===0,'Tap shortcut');
emitHoldEvent('keydown',{key:'e',target:{tagName:'CANVAS'}});for(let i=0;i<3;i++)advanceInteractionHold(.1);check(actions===0&&interactionHold.elapsed>.2,'Early activation');emitHoldEvent('keyup',{key:'e'});check(!interactionHold,'Early release');
emitHoldEvent('keydown',{key:'e',target:{tagName:'CANVAS'}});for(let i=0;i<8;i++)advanceInteractionHold(.1);check(actions===1&&!interactionHold,'Completed E hold');for(let i=0;i<20;i++)advanceInteractionHold(.1);emitHoldEvent('keydown',{key:'e',repeat:true,target:{tagName:'CANVAS'}});check(actions===1&&!interactionHold,'Repeated held key');emitHoldEvent('keyup',{key:'e'});
emitHoldEvent('pointerdown',{target:actionPrompt,button:0,pointerId:1});for(let i=0;i<8;i++)advanceInteractionHold(.1);check(actions===2,'Pointer hold');emitHoldEvent('pointerup',{pointerId:1});
beginInteractionHold('test');advanceInteractionHold(.1);which='B';advanceInteractionHold(.1);check(!interactionHold&&actions===2,'Target switch');beginInteractionHold('test');available=false;advanceInteractionHold(.1);check(!interactionHold,'Look away/range loss');available=true;
beginInteractionHold('test');emitHoldEvent('window:blur',{});check(!interactionHold,'Blur');beginInteractionHold('test');paused=()=>true;advanceInteractionHold(.1);check(!interactionHold&&actions===2,'Menu');paused=()=>false;
updateTargets=oldTargets;house.x=0;house.z=3;house.a=-Math.PI/2;house.pitch=.03;house.jumpHeight=0;s.room='hall';buildHouse();renderAdvanced();updateTargets();check(house.target?.name==='Childhood photograph'&&!actionPrompt.hidden,'Real close target');house.x=.8;updateTargets();check(actionPrompt.hidden,'Close-range gate');
console.log('PASS: hold E/pointer, release cancellation, no tap/repeat, target/range/menu/blur cancellation and real hallway aim');
}`,context);
