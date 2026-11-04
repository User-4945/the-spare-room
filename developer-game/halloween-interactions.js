/* Halloween interactions: one continuous hold, one action, no tap shortcuts. */
const HALLOWEEN_HOLD_SECONDS=.75,HALLOWEEN_INTERACT_REACH=1.9;
let interactionHold=null,interactionPointerDown=false,interactionKeyDown=false,interactionFrame=0;
const actionCopy=document.createElement('span');actionCopy.className='action-copy';
const actionHelp=document.createElement('span');actionHelp.className='action-help';actionHelp.textContent='HOLD E / HOLD CLICK';
actionCopy.append(actionLabel,actionHelp);actionPrompt.replaceChildren(actionKey,actionCopy);
actionPrompt.setAttribute('aria-description','Move close to a visible object. Hold E or hold the pointer for three quarters of a second. Release to cancel.');
function holdIdentity(t){return t?String(t.id||t.name)+'|'+String(t.event||'')+'|'+interactionAction(t):'';}
function paintInteractionProgress(value){actionKey.style.setProperty?.('--hold-progress',(Math.max(0,Math.min(1,value))*360)+'deg');actionPrompt.classList.toggle('holding',value>0);}
function cancelInteractionHold(){interactionHold=null;paintInteractionProgress(0);}
function validHoldTarget(t){return !!t&&Array.isArray(t.p)&&Math.hypot(t.p[0]-house.x,t.p[2]-house.z)<=HALLOWEEN_INTERACT_REACH&&Math.abs(t.p[1]-(1.55+(house.jumpHeight||0)))<=1.9&&visibleTo(t);}
// Proximity supplies a target even when the cursor misses the small outline.
function nearbyInteractionTarget(aimed){
 const facing=t=>{if(!validHoldTarget(t))return false;const dx=t.p[0]-house.x,dz=t.p[2]-house.z,d=Math.hypot(dx,dz);return d<.35||(dx*Math.sin(house.a)+dz*Math.cos(house.a))/d>.05;};
 if(aimed&&facing(aimed))return aimed;
 const nearby=targets().filter(facing);
 if(interactionHold){const held=nearby.find(t=>holdIdentity(t)===interactionHold.key);if(held)return held;}
 return nearby.sort((a,b)=>Math.hypot(a.p[0]-house.x,a.p[2]-house.z)-Math.hypot(b.p[0]-house.x,b.p[2]-house.z)||holdIdentity(a).localeCompare(holdIdentity(b)))[0]||null;
}
const halloweenPromptUpdate=updateActionPrompt;
updateActionPrompt=function(){
 house.target=nearbyInteractionTarget(house.target);
 halloweenPromptUpdate();
 if(actionPrompt.hidden){cancelInteractionHold();return;}
 const cross=document.getElementById('crosshair');if(cross)cross.classList.toggle('ready',true);
 actionKey.textContent='E';actionHelp.textContent=document.body.classList.contains('touch-game')?'HOLD TO INTERACT':'HOLD E / HOLD CLICK';
 actionPrompt.setAttribute('aria-label',interactionAction(house.target)+'. Hold E or hold click to complete.');
 if(interactionHold&&interactionHold.key!==holdIdentity(house.target))cancelInteractionHold();
};
const halloweenPromptHide=hideActionPrompt;hideActionPrompt=function(){cancelInteractionHold();halloweenPromptHide();};
function beginInteractionHold(source){
 if(paused()||!s.started||s.ending||s.sanityLost)return false;
 updateTargets();if(actionPrompt.hidden||!validHoldTarget(house.target))return false;
 if(interactionHold)return false;
 interactionHold={source,key:holdIdentity(house.target),elapsed:0};paintInteractionProgress(0);return true;
}
function advanceInteractionHold(dt){
 if(!interactionHold)return;
 if(paused()||!s.started||s.ending||s.sanityLost){cancelInteractionHold();return;}
 const hold=interactionHold;updateTargets();
 if(interactionHold!==hold||!validHoldTarget(house.target)||hold.key!==holdIdentity(house.target)){cancelInteractionHold();return;}
 hold.elapsed+=Math.max(0,Math.min(.1,dt));paintInteractionProgress(hold.elapsed/HALLOWEEN_HOLD_SECONDS);
 if(hold.elapsed+1e-8<HALLOWEEN_HOLD_SECONDS)return;
 const target=house.target;cancelInteractionHold();tone();target.fn();updateActionPrompt();
}
// The old public activation helper is no longer a tap shortcut in Halloween builds.
activateActionPrompt=function(){return false;};actionPrompt.onclick=e=>e?.preventDefault?.();
function releaseInteractionPointer(event){if(!interactionPointerDown)return;interactionPointerDown=false;cancelInteractionHold();event?.preventDefault?.();event?.stopImmediatePropagation?.();house.drag=null;house.press=null;}
document.addEventListener('pointerdown',event=>{
 const onPrompt=event.target===actionPrompt||actionPrompt.contains?.(event.target),onCanvas=event.target===canvas,onTouchUse=event.target?.id==='touch-use';
 if(!onPrompt&&!onCanvas&&!onTouchUse)return;
 if(event.button!==undefined&&event.button!==0)return;
 // First desktop click still captures the mouse. Touch drag keeps its look controls.
 if(onCanvas&&!locked()&&event.pointerType!=='touch')return;
 if(onCanvas&&event.pointerType==='touch'){if(locked()){event.preventDefault();event.stopImmediatePropagation();}return;}
 event.preventDefault();event.stopImmediatePropagation();
 if(interactionPointerDown)return;interactionPointerDown=true;
 if(onTouchUse){house.pointer=null;updateTargets();}
 beginInteractionHold('pointer');
 try{actionPrompt.setPointerCapture?.(event.pointerId);}catch{}
},true);
document.addEventListener('click',event=>{if(event.target===actionPrompt||actionPrompt.contains?.(event.target)||event.target?.id==='touch-use'){event.preventDefault();event.stopImmediatePropagation();}},true);
document.addEventListener('pointerup',releaseInteractionPointer,true);
document.addEventListener('pointercancel',releaseInteractionPointer,true);
actionPrompt.addEventListener('lostpointercapture',()=>{if(interactionPointerDown){interactionPointerDown=false;cancelInteractionHold();}});
document.addEventListener('keyup',event=>{if((event.key||'').toLowerCase()==='e'){interactionKeyDown=false;if(interactionHold?.source==='keyboard')cancelInteractionHold();}},true);
window.addEventListener('blur',()=>{interactionPointerDown=false;interactionKeyDown=false;cancelInteractionHold();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){interactionPointerDown=false;interactionKeyDown=false;cancelInteractionHold();}});
document.addEventListener('pointerlockchange',()=>{if(!locked())cancelInteractionHold();});
// Touch canvas taps previously interacted on release; keep them for looking only.
canvas.addEventListener('pointerup',event=>{if(event.pointerType==='touch'){house.press=null;house.drag=null;}},true);
function interactionHoldTick(now){const dt=interactionFrame?(now-interactionFrame)/1000:0;interactionFrame=now;advanceInteractionHold(dt);requestAnimationFrame(interactionHoldTick);}
requestAnimationFrame(interactionHoldTick);updateActionPrompt();
