const fs=require('node:fs');
const {context,vm}=require('./game-smoke.cjs');
vm.runInContext(fs.readFileSync('dist/halloween.js','utf8'),context);
vm.runInContext(fs.readFileSync('dist/more-halloween.js','utf8'),context);
vm.runInContext(fs.readFileSync('dist/action-prompts.js','utf8'),context);
vm.runInContext(`{
const check=(v,m)=>{if(!v)throw Error(m)};
reset();s.started=true;s.sanity=100;s.ending=null;s.sanityLost=false;
let reading=false;paused=()=>reading;
// Give the test DOM a real body class set so touch and keyboard states differ.
const classes=new Set();document.body.classList={add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)};
check(interactionAction({name:'Open kitchen door'})==='Open kitchen door','Door action wrong');
check(interactionAction({name:'Read tomorrow’s diary'})==='Read diary','Diary action wrong');
check(interactionAction({name:'Sticky note: note1'})==='Read note','Note action wrong');
check(interactionAction({name:'Brass key'})==='Pick up key','Key action wrong');
check(interactionAction({event:'ribbon'})==='Take ribbon','Ribbon action wrong');
check(interactionAction({name:'Door',action:'Knock'})==='Knock','Future action override ignored');
flags().mirror=false;check(interactionAction({name:'Covered mirror'})==='Uncover mirror','Mirror initial action');flags().mirror=true;check(interactionAction({name:'Covered mirror'})==='Inspect mirror','Mirror action does not change');
let presses=0;house.target={name:'Read tomorrow’s diary',fn:()=>presses++};updateActionPrompt();check(!actionPrompt.hidden&&actionLabel.textContent==='Read diary'&&actionKey.textContent==='E','Keyboard prompt missing');
reading=true;updateActionPrompt();check(actionPrompt.hidden,'Prompt visible in popup');reading=false;
classes.add('touch-game');updateActionPrompt();check(actionKey.textContent==='TAP','Touch prompt missing');classes.delete('touch-game');
s.sanityLost=true;updateActionPrompt();check(actionPrompt.hidden,'Prompt visible after loss');s.sanityLost=false;
// Real selector integration: only an aimed, visible object inside reach is eligible.
house.x=0;house.z=4.45;house.a=-Math.PI/2;house.pitch=0;house.pointer=null;house.jumpHeight=0;buildHouse();updateTargets();
check(house.target?.name==='Halloween invitation'&&!actionPrompt.hidden,'Invitation prompt not aligned with interaction target');
house.z=1;updateTargets();check(actionPrompt.hidden,'Out-of-range prompt remains visible');
house.x=0;house.z=4.45;house.a=-Math.PI/2;updateTargets();let visibility=visibleTo;visibleTo=()=>false;updateTargets();check(actionPrompt.hidden,'Prompt visible through wall');visibleTo=visibility;
// Click revalidates instead of executing the previous frame's target.
house.target={name:'Read tomorrow’s diary',fn:()=>presses++};house.x=40;house.z=0;actionPrompt.onclick();check(presses===0&&actionPrompt.hidden,'Stale target activated');
console.log('PASS: contextual labels, state changes, keyboard/touch display, pause/loss hiding, real range/aim/occlusion and stale-click rejection');
}`,context);
