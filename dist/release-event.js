// Seasonal access is based on one absolute instant, not the player's timezone.
const releaseEventInfo={name:'All Hallows’ Eve: The Houses That Answer',version:'2.7.5',unlockAt:'2026-10-30T17:00:00Z',timezone:'Europe/London'};
function eventTimeRemaining(now=Date.now()){return Math.max(0,Date.parse(releaseEventInfo.unlockAt)-now);}
function eventCountdown(now=Date.now()){let total=Math.ceil(eventTimeRemaining(now)/1000);return {days:Math.floor(total/86400),hours:Math.floor(total%86400/3600),minutes:Math.floor(total%3600/60),seconds:total%60};}
let releaseAccess='locked';
// Private admin session supplies a temporary capability; normal players keep the real clock.
let eventAdminAuthorizer=()=>false;
function adminMayEnterEvent(week){return eventAdminAuthorizer(week)===true;}
const eventOverlay=document.createElement('section');eventOverlay.id='release-event';eventOverlay.setAttribute('role','dialog');eventOverlay.setAttribute('aria-modal','true');eventOverlay.setAttribute('aria-labelledby','release-event-name');
const eventCard=document.createElement('div');eventCard.className='event-card';eventOverlay.append(eventCard);
function eventElement(tag,cls,text,parent=eventCard){let e=document.createElement(tag);e.className=cls;e.textContent=text;parent.append(e);return e;}
eventElement('p','event-eyebrow','THE SPARE ROOM · v.2.7.5 PRERELEASE');
const eventHeading=eventElement('h1','','All Hallows’ Eve');eventHeading.id='release-event-name';
const week2HubTitle=eventElement('h2','','The Houses That Answer');
const eventMessage=eventElement('p','event-message','Week 2 is almost here. The doors are still closed. Please wait for the event to unlock—or return to Week 1 while you wait.');
const eventDate=eventElement('p','event-date','UNLOCKS FRIDAY 30 OCTOBER · 5:00 PM UK TIME (GMT)');
const eventTimer=eventElement('div','event-countdown','');eventTimer.setAttribute('aria-label','Time until Week 2 unlocks');
function createEventDigits(timer){const digits={};for(const [id,label]of [['days','DAYS'],['hours','HOURS'],['minutes','MINUTES'],['seconds','SECONDS']]){const block=eventElement('div','event-time','',timer);digits[id]=eventElement('strong','','00',block);eventElement('span','',label,block);}return digits;}
const eventDigits=createEventDigits(eventTimer);
const eventActions=eventElement('div','event-buttons','');
const week2Button=eventElement('button','event-primary','Week 2 · Locked',eventActions);week2Button.type='button';week2Button.disabled=true;
const week1Button=eventElement('button','event-secondary','Play Week 1',eventActions);week1Button.type='button';
eventElement('p','event-foot','The countdown uses the same unlock time worldwide. Leave this screen open and it will unlock automatically.');
const eventAdminLogin=eventElement('button','event-secondary','Admin login / event previews',eventActions);eventAdminLogin.type='button';eventAdminLogin.onclick=()=>window.spareAdmin?.open();
gameScene.append(eventOverlay);
const eventStyle=document.createElement('style');eventStyle.textContent=`
 #release-event[hidden]{display:none!important}
 #release-event{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:24px;overflow:auto;background:radial-gradient(ellipse at 80% 10%,#59312466,transparent 45%),radial-gradient(ellipse at 10% 85%,#33324d88,transparent 55%),#0b0c12;color:#f0e1cd;font-family:Georgia,serif}
 #release-event .event-card{width:min(760px,100%);padding:46px;border:1px solid #b17a50;background:linear-gradient(130deg,#251d27,#14151f);box-shadow:0 25px 90px #0008}
 #release-event .event-eyebrow{font:11px/1.6 monospace;letter-spacing:3px;color:#d1a579;margin:0 0 22px}
 #release-event h1{font-size:clamp(38px,6vw,66px);line-height:1.05;font-weight:normal;margin:0 0 12px;color:#efc395}
 #release-event h2{font-size:clamp(21px,3vw,31px);font-weight:normal;font-style:italic;margin:0 0 26px;color:#d6a278}
 #release-event .event-message{font-size:16px;line-height:1.8;color:#cfc2b8;max-width:590px}
 #release-event .event-date{font:11px/1.6 monospace;letter-spacing:1px;color:#dfb98e;margin:24px 0 16px}
 #release-event .event-countdown{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:0 0 28px}
 #release-event .event-time{text-align:center;padding:18px 8px;border:1px solid #73513e;background:#11121ba8}
 #release-event .event-time strong{display:block;font:clamp(30px,6vw,52px)/1.2 Georgia,serif;font-variant-numeric:tabular-nums;color:#f1d0a7}
 #release-event .event-time span{display:block;font:9px/1.6 monospace;letter-spacing:2px;color:#ac9686;margin-top:9px}
 #release-event .event-buttons{display:flex;gap:12px;flex-wrap:wrap}
 #release-event button{flex:1;min-height:52px;padding:14px 18px;border:1px solid #c28b5b;font:15px/1.4 Georgia,serif;cursor:pointer;color:#fff0d7}
 #release-event .event-primary{background:#9b5937}#release-event .event-primary:disabled{background:#30262c;color:#a99483;border-color:#695243;opacity:1;cursor:not-allowed}
 #release-event .event-secondary{background:#252631}#release-event button:hover:not(:disabled){background:#664330}
 #release-event button:focus-visible{outline:2px solid #ffd399;outline-offset:4px}
 #release-event .event-foot{font:10px/1.8 monospace;color:#a39590;margin:22px 0 0}
 @media(max-width:600px){#release-event{padding:16px;align-items:safe center}#release-event .event-card{padding:25px 20px}#release-event .event-eyebrow{font-size:9px;letter-spacing:2px}#release-event .event-message{font-size:14px;line-height:1.6}#release-event .event-countdown{gap:6px}#release-event .event-time{padding:14px 4px}#release-event .event-time span{letter-spacing:1px;font-size:8px}#release-event .event-buttons{flex-direction:column}}
`;
document.body.append(eventStyle);
const eventPreviousPaused=paused;paused=function(){return !eventOverlay.hidden||releaseAccess==='locked'||eventPreviousPaused();};
const eventPreviousPrompt=updateActionPrompt;updateActionPrompt=function(){if(releaseAccess==='locked'||!eventOverlay.hidden)return hideActionPrompt();eventPreviousPrompt();};
const eventPreviousTitle=titleScreen;
titleScreen=function(){
 if(releaseAccess==='locked')return showReleaseEvent();
 eventPreviousTitle();
 const kicker=$('modal').querySelector('.event-kicker');
 if(kicker)kicker.textContent=releaseAccess==='week1'?'WEEK 1 · ALL HALLOWS’ EVE · PLAY NOW':'v.2.7.5 PRERELEASE · WEEK 2';
};
function refreshReleaseEvent(now=Date.now()){
 const time=eventCountdown(now),ready=eventTimeRemaining(now)===0;
 for(const key of Object.keys(eventDigits)){const text=String(time[key]).padStart(2,'0');if(eventDigits[key].textContent!==text)eventDigits[key].textContent=text;}
 week2Button.disabled=!ready;week2Button.textContent=ready?'Play Week 2':'Week 2 · Locked';
 eventMessage.textContent=ready?'The countdown is over. The houses are ready to answer. Week 2 is unlocked—you can enter now, or keep playing Week 1.':'Week 2 is almost here. The doors are still closed. Please wait for the event to unlock—or return to Week 1 while you wait.';
 return ready;
}
function showReleaseEvent(){if(locked())document.exitPointerLock();house.keys={};hideActionPrompt();eventOverlay.hidden=false;refreshReleaseEvent();}
function enterReleaseWeek(week){
 if(week==='week2'&&eventTimeRemaining()>0&&!adminMayEnterEvent(week)){showReleaseEvent();return false;}
 releaseAccess=week;eventOverlay.hidden=true;house.keys={};titleScreen();return true;
}
week1Button.onclick=()=>enterReleaseWeek('week1');week2Button.onclick=()=>enterReleaseWeek('week2');
const releaseEventButton=document.createElement('button');releaseEventButton.textContent='WEEK 2 EVENT';releaseEventButton.onclick=showReleaseEvent;toolbar.append(releaseEventButton);
// The timer continues while the game is paused, including while the wait screen is open.
setInterval(()=>{refreshReleaseEvent();},1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshReleaseEvent();});
showReleaseEvent();
