const fs=require('node:fs'),{context,vm}=require('./game-smoke.cjs');
for(const name of ['halloween','more-halloween','action-prompts','release-event'])vm.runInContext(fs.readFileSync('dist/'+name+'.js','utf8'),context);
vm.runInContext(`{
const check=(v,m)=>{if(!v)throw Error(m)};
const cutoff=Date.parse('2026-10-30T17:00:00Z');
check(releaseEventInfo.timezone==='Europe/London','Timezone missing');
check(eventTimeRemaining(cutoff-1)===1&&eventTimeRemaining(cutoff)===0&&eventTimeRemaining(cutoff+1)===0,'Unlock boundary wrong');
check(!refreshReleaseEvent(cutoff-1000)&&week2Button.disabled,'Unlocks early');
check(refreshReleaseEvent(cutoff)&&!week2Button.disabled&&week2Button.textContent==='Play Week 2','Does not unlock at zero');
check(eventCountdown(cutoff-90061000).days===1&&eventCountdown(cutoff-90061000).hours===1&&eventCountdown(cutoff-90061000).minutes===1&&eventCountdown(cutoff-90061000).seconds===1,'Countdown arithmetic wrong');
const realNow=Date.now;Date.now=()=>cutoff-1000;showReleaseEvent();check(paused(),'Waiting screen does not pause gameplay');check(!enterReleaseWeek('week2')&&releaseAccess==='locked','Locked week can start');
check(enterReleaseWeek('week1')&&eventOverlay.hidden&&releaseAccess==='week1','Week 1 unavailable');
house.target={name:'Brass key',fn(){}};s.started=true;s.ending=null;s.sanityLost=false;updateActionPrompt();check(actionPrompt.hidden,'Week 2 prompt leaks into Week 1');
showReleaseEvent();Date.now=()=>cutoff;refreshReleaseEvent();check(enterReleaseWeek('week2')&&releaseAccess==='week2'&&eventOverlay.hidden,'Week 2 cannot open at cutoff');
showReleaseEvent();check(!week2Button.disabled,'Unlocked event relocks on return');Date.now=realNow;
console.log('PASS: exact UK/GMT unlock instant, second/day arithmetic, no early entry, automatic zero transition, paused waiting room and playable Week 1 fallback');
}`,context);
