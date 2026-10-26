/* All admin mutations go through the same session check. The session is never saved. */
(function(){
 'use strict';
 const auth=createAdminAuth(adminAuthConfig),options={freezeSanity:false,infiniteStamina:false,freezeDaylight:false};
 let returnFocus=null,feedback='',shown='login';
 const panel=document.createElement('section');panel.id='admin-panel';panel.hidden=true;
 panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','admin-heading');
 const card=el('div','admin-card','',panel),header=el('div','admin-header','',card),title=el('h2','','Game admin',header);title.id='admin-heading';
 const closeButton=button('Close',hide,header);closeButton.setAttribute('aria-label','Close admin panel');
 el('p','admin-intro','Online authorization · F8 to open · 10-minute sessions',card);
 const login=el('form','admin-login','',card),userLabel=el('label','','Username',login),username=el('input','','',userLabel);username.type='text';username.autocomplete='username';username.name='admin-username';username.required=true;
 const passLabel=el('label','','Password',login),password=el('input','','',passLabel);password.type='password';password.autocomplete='current-password';password.name='admin-password';password.required=true;
 const loginButton=el('button','admin-primary','Unlock admin tools',login);loginButton.type='submit';
 const loginMessage=el('p','admin-message','',login);loginMessage.setAttribute('role','status');loginMessage.setAttribute('aria-live','polite');
 const controls=el('div','admin-controls','',card);controls.hidden=true;
 const sessionRow=el('div','admin-session','',controls),sessionLabel=el('span','','',sessionRow);button('Lock admin',lock,sessionRow);
 const stats=el('p','admin-stats','',controls),notice=el('p','admin-message','',controls);notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
 button('Start / resume Week 1',()=>run('start'),controls);
 const travel=group('Teleport',controls),place=select('Destination',travel);button('Teleport and resume',()=>run('teleport',{place:place.value}),travel);
 const scares=group('Anomalies',controls),anomaly=select('Encounter',scares);button('Spawn and resume',()=>run('spawn',{id:anomaly.value}),scares);button('Clear current anomalies',()=>run('clear'),scares);
 el('small','','Spawns use the game’s placement checks. Move to an open area if there is no safe position. Mirror and resident events need their usual surroundings.',scares);
 const sanity=group('Sanity and supplies',controls),sanityValue=number('Sanity %',0,100,100,sanity);
 button('Set sanity',()=>run('sanity',{value:Number(sanityValue.value)}),sanity);button('+10 sanity',()=>run('sanityDelta',{value:10}),sanity);button('−10 sanity',()=>run('sanityDelta',{value:-10}),sanity);button('Full heal / revive after sanity loss',()=>run('revive'),sanity);
 button('Refill kitchen sandwich now',()=>run('sandwich'),sanity);button('Restore stamina',()=>run('stamina'),sanity);if(typeof halloweenState==='function')button('Give 3 sweets',()=>run('sweets'),sanity);
 const days=group('Day and time',controls),day=select('Story night',days);for(let n=1;n<=3;n++)option(day,String(n),'Night '+n);
 button('Set story night',()=>run('day',{day:Number(day.value)}),days);button('Skip to next story night',()=>run('day',{day:Math.min(3,s.day+1)}),days);
 const hour=select('Daylight time',days);for(const [n,label]of [[6,'Dawn · 06:00'],[12,'Noon · 12:00'],[18,'Dusk · 18:00'],[0,'Midnight · 00:00']])option(hour,String(n),label);
 button('Set daylight time',()=>run('time',{hour:Number(hour.value)}),days);if(typeof halloweenState==='function')button('Trigger Halloween midnight',()=>run('midnight'),days);
 el('small','','Story nights are 1–3. Changing daylight does not complete quests or advance their separate clocks.',days);
 const cheats=group('Session tools',controls),toggles={};for(const [key,label]of [['freezeSanity','Freeze sanity loss'],['infiniteStamina','Infinite stamina'],['freezeDaylight','Freeze daylight clock']]){const row=el('label','admin-toggle',label,cheats),input=document.createElement('input');input.type='checkbox';row.prepend(input);input.onchange=()=>run('toggle',{key,value:input.checked});toggles[key]=input;}
 el('small','','These toggles turn off when you lock the panel, the session expires, or the game reloads.',cheats);
 gameScene.append(panel);
 const style=document.createElement('style');style.textContent=`
 #admin-panel[hidden],#admin-panel [hidden]{display:none!important}
 #admin-panel{position:fixed;inset:0;z-index:500;display:flex;align-items:center;justify-content:center;padding:18px;background:#090b12cf;overflow:auto;color:#ede2d4;font:14px/1.5 system-ui,sans-serif;box-sizing:border-box}
 #admin-panel *{box-sizing:border-box}#admin-panel .admin-card{width:min(820px,100%);max-height:calc(100dvh - 36px);overflow:auto;background:#181c25;border:1px solid #9f794d;padding:24px;box-shadow:0 20px 80px #0009;border-radius:12px}
 #admin-panel .admin-header,#admin-panel .admin-session{display:flex;align-items:center;justify-content:space-between;gap:12px}#admin-panel h2{margin:0;font:28px/1.2 Georgia,serif;color:#ecc495}#admin-panel .admin-intro{color:#b6b4b8;margin:12px 0 20px;font-size:12px}
 #admin-panel .admin-login{display:grid;gap:15px;max-width:400px}#admin-panel label{display:flex;flex-direction:column;gap:6px}#admin-panel input,#admin-panel select{min-height:44px;background:#0c111b;border:1px solid #666b78;color:#f2eee7;border-radius:5px;padding:9px 11px;font:inherit;max-width:100%}
 #admin-panel button{font:13px/1.4 system-ui,sans-serif;letter-spacing:0;min-height:42px;padding:9px 12px;border:1px solid #827158;border-radius:5px;background:#303644;color:#f6e5cf;margin:3px 5px 3px 0;cursor:pointer}#admin-panel button:hover{background:#4d4550}#admin-panel .admin-primary{background:#915b36}#admin-panel button:disabled{opacity:.6;cursor:wait}
 #admin-panel :focus-visible{outline:2px solid #f6bd6a;outline-offset:3px}#admin-panel .admin-controls{display:grid;gap:15px}#admin-panel .admin-group{margin:0;padding:15px;border:1px solid #48505e;border-radius:7px;min-width:0}#admin-panel legend{padding:0 7px;color:#e7bb84;font-weight:600}#admin-panel .admin-group>label{margin:0 0 10px}#admin-panel .admin-group select{width:100%}#admin-panel input[type=number]{width:140px}
 #admin-panel small{display:block;color:#aaaeba;font-size:12px;line-height:1.6;margin-top:9px}#admin-panel .admin-message{white-space:pre-line;color:#f3cc94;min-height:20px;margin:4px 0}#admin-panel .admin-stats{margin:0;color:#bdc8d1;font:12px/1.7 monospace;overflow-wrap:anywhere}#admin-panel .admin-session{color:#a8d5b8;font-size:12px}#admin-panel label.admin-toggle{flex-direction:row;align-items:center;margin:7px 0}#admin-panel input[type=checkbox]{width:20px;min-height:20px;margin:0 8px 0 0;accent-color:#e9b16c}
 @media(max-width:550px){#admin-panel{padding:8px}#admin-panel .admin-card{padding:17px;max-height:calc(100dvh - 16px)}#admin-panel h2{font-size:24px}#admin-panel .admin-header button{margin:0}#admin-panel .admin-group button{width:100%;margin:4px 0}}
 `;document.body.append(style);
 const toolbarButton=button('ADMIN',open,toolbar);toolbarButton.setAttribute('aria-keyshortcuts','F8');
 function el(tag,cls,text,parent){const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;if(parent)parent.append(n);return n;}
 function button(label,fn,parent){const b=el('button','',label,parent);b.type='button';b.onclick=fn;return b;}
 function group(label,parent){const g=el('fieldset','admin-group','',parent);el('legend','',label,g);return g;}
 function select(label,parent){const l=el('label','',label,parent);return el('select','','',l);}
 function option(parent,value,label){const o=el('option','',label,parent);o.value=value;return o;}
 function number(label,min,max,value,parent){const l=el('label','',label,parent),i=el('input','','',l);i.type='number';i.min=String(min);i.max=String(max);i.step='1';i.value=String(value);return i;}
 function clearToggles(){for(const key of Object.keys(options)){options[key]=false;toggles[key].checked=false;}}
 function lock(){auth.lock();clearToggles();password.value='';feedback='Admin session locked.';updateView();if(!panel.hidden)password.focus();}
 function destinations(){
  const result=[];for(const id of ['hall','kitchen','bedroom','spare','garden','shed'])if(spawn[id])result.push({id,label:'House · '+rooms[id],p:spawn[id],y:0});
  if(typeof upperRooms!=='undefined')for(const [id,r]of Object.entries(upperRooms))result.push({id:'upper_'+id,label:'Upstairs · '+r.name,p:r.spawn,y:3.2});
  result.push({id:'city',label:'City · Entrance',p:[0,-15,Math.PI],y:0});
  if(typeof cityWorld==='function')for(const c of cityWorld())result.push({id:c.id,label:'City · '+rooms[c.id],p:[c.x,c.z+2.8,Math.PI],y:0});
  if(typeof week2Active==='function'&&week2Active()){result.push({id:'costume_shop',label:'Week 2 · Costume shop',p:[56,-29.5,Math.PI],y:.1});if(week2State().key)result.push({id:'costume_basement',label:'Week 2 · Basement',p:[56,-34,Math.PI],y:-3.2});if(week2State().extraHouse)result.push({id:'extra_house',label:'Week 2 · Extra house',p:[56,-47.5,Math.PI],y:.1});}
  return result;
 }
 function fillSelects(){place.replaceChildren();for(const d of destinations())option(place,d.id,d.label);place.value=destinations().some(d=>d.id===s.room)?s.room:'hall';anomaly.replaceChildren();for(const [id,d]of Object.entries(anomalyDefinitions))option(anomaly,id,d.title);if(typeof week2Active==='function'&&week2Active())for(const [id,label]of [['week2:bell','Week 2 · Doorbell behind you'],['week2:shadow','Week 2 · Detached shadow'],['week2:house','Week 2 · Reveal extra house']])option(anomaly,id,label);day.value=String(s.day);sanityValue.value=String(Math.round(s.sanity??100));}
 function updateView(){const valid=auth.isAuthenticated();if(!valid)clearToggles();login.hidden=valid;controls.hidden=!valid;shown=valid?'tools':'login';if(valid){const seconds=Math.ceil(auth.status().expiresIn/1000);sessionLabel.textContent='Unlocked · locks in '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');stats.textContent='Night '+s.day+' · '+(rooms[s.room]||s.room)+' · Sanity '+Math.round(s.sanity??100)+'% · X '+house.x.toFixed(1)+' / Y '+(house.jumpHeight||0).toFixed(1)+' / Z '+house.z.toFixed(1);notice.textContent=feedback;}else loginMessage.textContent=feedback;}
 function open(){if(locked())document.exitPointerLock();house.keys={};if(typeof hideActionPrompt==='function')hideActionPrompt();returnFocus=document.activeElement;panel.hidden=false;fillSelects();updateView();(auth.isAuthenticated()?closeButton:username).focus();}
 function hide(){panel.hidden=true;password.value='';house.keys={};returnFocus?.focus?.();if(typeof updateActionPrompt==='function')updateActionPrompt();}
 async function authenticate(user,pass){const result=await auth.authenticate(user,pass);feedback=result.message;if(result.ok){fillSelects();updateView();closeButton.focus();}else updateView();return result;}
 login.onsubmit=async event=>{event.preventDefault();loginButton.disabled=true;const user=username.value,pass=password.value;password.value='';try{await authenticate(user,pass);}finally{loginButton.disabled=false;}};
 function reply(ok,message){feedback=message;if(!panel.hidden)updateView();if(panel.hidden&&message)say(message);return {ok,message};}
 function ready(){return s.started&&!s.ending&&!s.sanityLost&&!(typeof releaseAccess!=='undefined'&&releaseAccess==='locked');}
 function changed(){s.adminUsed=true;save();render();sanityDisplay();if(typeof halloweenDisplay==='function')halloweenDisplay();house.dirty=true;}
 function resume(){house.keys={};panel.hidden=true;close();}
 function setSanity(value){if(!Number.isFinite(value)||value<0||value>100)return reply(false,'Enter a sanity value from 0 to 100.');if(s.ending)return reply(false,'This run has ended. Start a new run before changing it.');sanityState();s.pendingSanity=0;const before=s.sanity;if(value>0&&s.sanityLost){s.sanityLost=false;$('overlay').classList.add('hidden');}if(value<before){const scale=typeof currentMode==='function'?currentMode().damage:1;originalDrain((before-value)/scale);}else s.sanity=value;if(value===0&&!s.sanityLost)sanityLoss();changed();return reply(true,'Sanity set to '+Math.round(s.sanity)+'%.');}
 function teleport(id){if(!ready())return reply(false,'Start / resume Week 1 first, or revive after sanity loss.');const d=destinations().find(d=>d.id===id);if(!d)return reply(false,'That destination is not available in this game mode.');
  const previous={x:house.x,z:house.z,a:house.a,y:house.jumpHeight,room:s.room,city:s.cityOpen};s.cityOpen=true;s.room=d.id==='extra_house'?'city':d.id;house.x=d.p[0];house.z=d.p[1];house.a=d.p[2];house.jumpHeight=d.y;house.jumpVelocity=0;house.pitch=0;house.pointer=null;house.keys={};buildHouse();
  let found=false;for(const [dx,dz]of [[0,0],[.5,0],[-.5,0],[0,.5],[0,-.5],[1,0],[-1,0],[0,1],[0,-1]])if(canWalk(d.p[0]+dx,d.p[1]+dz)){house.x=d.p[0]+dx;house.z=d.p[1]+dz;found=true;break;}
  if(!found){Object.assign(house,{x:previous.x,z:previous.z,a:previous.a,jumpHeight:previous.y});s.room=previous.room;s.cityOpen=previous.city;buildHouse();return reply(false,'No safe arrival point was found. Choose another destination.');}
  house.jumpHeight=supportAt(house.x,house.z);s.room=houseRoom();changed();resume();return reply(true,'Teleported to '+d.label+'.');
 }
 function dispatchLocal(action,data={}){
  if(!auth.isAuthenticated()){clearToggles();return reply(false,'Sign in to use admin tools.');}auth.touch();
  if(action==='start'){
   if(s.ending)return reply(false,'This story has ended. Start a new run from the game menu.');if(s.sanityLost)return reply(false,'Use Full heal / revive first.');
   if(typeof releaseAccess!=='undefined'&&releaseAccess==='locked'){if(!enterReleaseWeek('week1'))return reply(false,'Week 1 could not start.');}
   s.started=true;changed();resume();return reply(true,'Admin tools are ready. Press F8 to reopen them.');
  }
  if(action==='sanity')return setSanity(data.value);
  if(action==='sanityDelta')return Number.isFinite(data.value)?setSanity(Math.max(0,Math.min(100,(s.sanity??100)+data.value))):reply(false,'Invalid sanity change.');
  if(action==='revive')return setSanity(100);
  if(action==='teleport')return teleport(data.place);
  if(action==='toggle'){if(!Object.hasOwn(options,data.key)||typeof data.value!=='boolean')return reply(false,'Unknown session tool.');options[data.key]=data.value;changed();return reply(true,'Session tool '+(data.value?'enabled.':'disabled.'));}
  if(!ready())return reply(false,'Start / resume the game first, or revive after sanity loss.');
  if(action==='spawn'){
   const id=String(data.id||'');if(!Object.hasOwn(anomalyDefinitions,id)&&!['week2:bell','week2:shadow','week2:house'].includes(id))return reply(false,'Choose an available anomaly.');
   if(id.startsWith('week2:')&&!(typeof week2Active==='function'&&week2Active()))return reply(false,'Week 2 anomalies are available after Week 2 unlocks.');
   if(id==='mirror'&&!flags().mirror)return reply(false,'Uncover the bedroom mirror first, then stand near it.');
   resume();let ok=false;
   if(id.startsWith('week2:')){if(id==='week2:house'){const w=week2State();w.extraHouse=true;if(!w.seen.includes('house'))w.seen.push('house');buildHouse();ok=true;}else ok=week2Scare(id.slice(6));}
   else{const previous=anomalyRuntime.active;anomalyRuntime.active=null;ok=startAnomaly(id);if(!ok)anomalyRuntime.active=previous;}
   if(!ok){open();return reply(false,'No safe spawn here. Try an open floor; the resident stare needs nearby people and the mirror event needs the uncovered mirror.');}
   changed();return reply(true,'Anomaly spawned. Press F8 to reopen admin tools.');
  }
  if(action==='clear'){anomalyRuntime.active=null;anomalyRuntime.captionUntil=0;if(typeof week2Runtime!=='undefined'){week2Runtime.effect=null;week2Runtime.shadow=null;week2Runtime.pressure=0;if(typeof week2Active==='function'&&week2Active()){week2State().mask=null;week2State().worn=0;}}changed();return reply(true,'Current anomalies cleared. Any Week 2 mask was removed.');}
  if(action==='sandwich'){s.sandwichAt=0;buildHouse();changed();return reply(true,'The kitchen sandwich is ready.');}
  if(action==='stamina'){house.stamina=100;house.sprintExhausted=false;changed();return reply(true,'Stamina restored.');}
  if(action==='sweets'&&typeof halloweenState==='function'){halloweenState().candy=Math.min(999,halloweenState().candy+3);changed();return reply(true,'Added three sweets.');}
  if(action==='day'){if(!Number.isInteger(data.day)||data.day<1||data.day>3)return reply(false,'Story nights must be 1, 2 or 3.');s.day=data.day;s.read=false;s.acted=false;s.pendingSanity=0;const result=teleport('hall');if(result.ok){open();day.value=String(s.day);return reply(true,'Story night '+s.day+' selected. Diary and choice progress were reset for this night.');}return result;}
  if(action==='time'){if(!Number.isFinite(data.hour)||data.hour<0||data.hour>=24)return reply(false,'Choose an hour from 0 to 23.');s.worldSeconds=Math.floor((s.worldSeconds||0)/720)*720+((data.hour-15+24)%24)*30;changed();if(typeof clockDisplay==='function')clockDisplay();return reply(true,'Daylight clock set to '+String(data.hour).padStart(2,'0')+':00.');}
  if(action==='midnight'&&typeof halloweenState==='function'){const h=halloweenState();h.midnight=true;h.elapsed=Math.max(90,h.elapsed);changed();return reply(true,'Halloween midnight triggered. Quest requirements still apply.');}
  return reply(false,'Unknown admin action.');
 }
 async function dispatch(action,data={}){const allowed=await auth.authorize(action);if(!allowed.ok)return reply(false,allowed.message);try{return dispatchLocal(action,data);}catch{return reply(false,'The command could not be applied to this game state.');}}
 async function run(action,data){const result=await dispatch(action,data);for(const [key,input]of Object.entries(toggles))input.checked=options[key];return result;}
 const originalPaused=paused;paused=function(){return !panel.hidden||originalPaused();};
 const originalDrain=drainSanity;drainSanity=function(amount){if(options.freezeSanity&&auth.isAuthenticated())return;return originalDrain(amount);};
 const originalMovement=updateMovement;updateMovement=function(dt){const active=auth.isAuthenticated(),before=s.worldSeconds;originalMovement(dt);if(active&&options.infiniteStamina){house.stamina=100;house.sprintExhausted=false;}if(active&&options.freezeDaylight)s.worldSeconds=before;};
 window.spareAdmin=Object.freeze({open,close:hide,lock,authenticate,isAuthenticated:auth.isAuthenticated,dispatch,status:()=>({...auth.status(),tools:{...options}})});
 window.addEventListener('offline',lock);
 document.addEventListener('keydown',event=>{
  if(event.key==='F8'){event.preventDefault();event.stopImmediatePropagation();panel.hidden?open():hide();return;}
  if(panel.hidden)return;
  if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();hide();return;}
  if(event.key==='Tab'&&typeof panel.querySelectorAll==='function'){const focusable=Array.from(panel.querySelectorAll('button,input,select')).filter(n=>!n.disabled&&n.getClientRects().length);const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
 },true);
 panel.addEventListener('pointerdown',()=>{if(auth.isAuthenticated())auth.touch();});
 setInterval(()=>{const was=shown;if(!auth.isAuthenticated()){clearToggles();if(was==='tools')feedback='Your admin session expired. Sign in again.';}if(!panel.hidden)updateView();},1000);
})();
