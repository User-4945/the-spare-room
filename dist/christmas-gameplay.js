// Week 1 gameplay, shared lore, optional classes and seasonal ending gates.
(function(){
 const config=window.SPARE_ROOM_CHRISTMAS||{};
 const D=window.SPARE_ROOM_CHRISTMAS_DATA;
 if(!config.enabled||!D)return;
 const parentDrain=drainSanity;drainSanity=function(amount){return parentDrain(amount*D.sanityMultiplier);};
 function progress(){if(!s.christmas||!Array.isArray(s.christmas.secrets))s.christmas={secrets:[],classId:'Wanderer'};return s.christmas;}
 function found(id){return progress().secrets.includes(id);}
 function ready(id){const e=D.endings.find(x=>x.id===id);return !!e&&s.started&&!s.ending&&!s.sanityLost&&e.requires.every(found);}
 function finish(id){const e=D.endings.find(x=>x.id===id);if(!ready(id))return false;s.ending={title:e.title,body:e.text};save();showEnding();return true;}
 function discover(id){const item=D.secrets.find(x=>x.id===id);if(!item)return;
  if(!found(id))progress().secrets.push(id);save();
  modal(item.name,item.text,[['Keep the memory',close]]);
 }
 const classMode=currentMode;
 currentMode=function(){const mode=classMode();const c=D.classes.find(x=>x.id===progress().classId);
  return c?Object.assign({},mode,{damage:mode.damage*c.drain,stamina:mode.stamina*c.stamina,restore:mode.restore+c.food}):mode;};
 function wardrobe(){modal('Winter wardrobe','Find seasonal secrets to unlock these roles. Your old class and story are still here.',
  D.classes.map((c,i)=>[c.name+' — '+c.description,()=>{if(progress().secrets.length<i+1){say('Find '+(i+1)+' Christmas secrets first.');return;}progress().classId=c.id;save();close();say(c.name+' equipped.');}]).concat([['Wanderer',()=>{progress().classId='Wanderer';save();close();}],['Back',close]]));}
 const locations=[[-4.1,.96,7.8],[0,.2,-3],[4,.3,-4],[4,1,6],[-2,.3,-7],[3,.9,11]];
 // Replace preliminary lore targets with actual persistent secrets.
 const oldTargets=targets;
 targets=function(){return oldTargets().filter(x=>!x.name.startsWith('A winter')).concat(
  D.secrets.map((item,i)=>({name:item.name,p:locations[i],fn:()=>discover(item.id)})),
  [{name:'Winter wardrobe',p:[-1,.8,1],fn:wardrobe},{name:'Christmas decisions',p:[0,1,13],fn:()=>modal('Christmas at the spare room',
   'Every ending asks you to follow the winter clues first.',
   D.endings.map(e=>[e.title,()=>{if(!ready(e.id)){say('Discover the required Christmas secrets before choosing this ending.');return;}
    modal(e.title,e.text,[['Choose this ending',()=>finish(e.id)],['Not yet',close]]);}]).concat([['Back',close]]))}]);};
 for(const a of D.anomalies){if(anomalyDefinitions[a.base])Object.assign(anomalyDefinitions[a.base],{title:a.title,text:a.text});}
 const parentVisual=createAnomalyVisuals;
 function winterPool(pool){if(!pool.christmasHat){
  const T=THREE,red=new T.MeshStandardMaterial({color:0x6b2927,roughness:1}),ivory=new T.MeshStandardMaterial({color:0xb6b7a1,roughness:1});
  const hat=new T.Mesh(new T.ConeGeometry(.18,.4,7),red);hat.position.set(0,2.12,0);hat.rotation.z=.25;pool.groups.watcher.add(hat);
  const trim=new T.Mesh(new T.TorusGeometry(.15,.035,4,8),ivory);trim.position.set(0,1.96,0);trim.rotation.x=Math.PI/2;pool.groups.watcher.add(trim);pool.christmasHat=true;
 }return pool;}
 createAnomalyVisuals=function(engine){return winterPool(parentVisual(engine));};
 if(advancedEngine?.anomalies)winterPool(advancedEngine.anomalies);
 const clock=document.createElement('div');clock.id='christmas-game-clock';clock.setAttribute('aria-label','In-game day and time');
 Object.assign(clock.style,{position:'absolute',top:'14px',left:'14px',padding:'8px 12px',background:'#101d18df',color:'#eee8cf',font:'16px monospace',zIndex:'4',pointerEvents:'none'});gameScene.append(clock);
 const parentMove=updateMovement;updateMovement=function(dt){parentMove(dt);const hour=clockTime();clock.textContent='DAY '+(Math.floor((s.worldSeconds||0)/720)+1)+' · '+String(Math.floor(hour)%24).padStart(2,'0')+':'+String(Math.floor(hour*60)%60).padStart(2,'0');clock.style.display=s.started&&!s.ending?'block':'none';};
 window.SpareRoomChristmasGameplay=Object.freeze({ready,finish,discover,progress,data:D});
})();

