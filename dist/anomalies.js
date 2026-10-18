// Small, pooled world effects. Only active gameplay advances their clock.
const anomalyDefinitions={
 watcher:{title:'Someone waiting',text:'There is someone at the end of the room. It has been standing there too long.',duration:14,damage:3},
 footprints:{title:'The extra set',text:'Wet footprints. Bare feet. They start exactly where you stopped.',duration:20,damage:2.5},
 toy:{title:'The nursery visitor',text:'The little doll rises without a string. Its head turns before its body does.',duration:15,damage:3},
 stare:{title:'They all noticed',text:'The footsteps stop together. Every nearby face turns towards you.',duration:10,damage:3},
 mirror:{title:'Your reflection stayed',text:'The glass fogs from the other side. Two hands press against it.',duration:16,damage:4},
 knocks:{title:'The answer',text:'Three knocks from the spare room. Then three more, from inside the wall beside you.',duration:9,damage:2.5},
 brownout:{title:'Held breath',text:'The house draws a breath. The lights sink with it. Your torch is still working.',duration:11,damage:1.5},
 door:{title:'The extra door',text:'A door stands where there was empty space. The brass plate says YOUR ROOM.',duration:17,damage:3}
};
let anomalyRuntime={active:null,captionUntil:0};
const anomalyCaption=document.createElement('div');anomalyCaption.className='anomaly-caption';anomalyCaption.setAttribute('role','status');gameScene.append(anomalyCaption);
function anomalyState(){
 if(!s.anomalies||!Number.isFinite(s.anomalies.elapsed))s.anomalies={elapsed:0,nextAt:20,sequence:0,seen:[],last:null};
 return s.anomalies;
}
function anomalyInterval(){return ({easy:80,intermediate:58,hard:40})[s.difficulty]||58}
function anomalyInView(p){let v=view(p);return v[2]>.08&&Math.abs(v[0]/v[2])<500/(house.focalX||620)&&Math.abs(v[1]/v[2])<.56&&visibleTo({p})}
function anomalyAnchor(distance=3.3,radius=.32){
 let floor=supportAt(house.x,house.z);
 for(let turn of [.5,-.5,0,1.1,-1.1,Math.PI]){let a=house.a+turn,x=house.x+Math.sin(a)*distance,z=house.z+Math.cos(a)*distance;
  if([[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius]].every(([dx,dz])=>canWalk(x+dx,z+dz)&&Math.abs(supportAt(x+dx,z+dz)-floor)<.12)&&visibleTo({p:[x,floor+1.2,z]}))return [x,floor,z];
 }
 return null;
}
function anomalyFootprints(){
 let points=[],floor=supportAt(house.x,house.z),a=house.a;
 for(let i=0;i<7;i++){let d=.35+i*.32,side=i%2?.12:-.12,x=house.x-Math.sin(a)*d+Math.cos(a)*side,z=house.z-Math.cos(a)*d-Math.sin(a)*side;
  if(canWalk(x,z)&&Math.abs(supportAt(x,z)-floor)<.12&&visibleTo({p:[x,floor+.15,z]}))points.push([x,floor+.052,z]);
 }
 return points;
}
function eligibleAnomalies(){
 let list=['watcher','footprints','door'],room=houseRoom();
 if(['hall','bedroom','kitchen','spare','upper_landing','upper_study','upper_nursery','upper_loft','shed'].includes(room))list.push('toy','brownout','knocks');
 if(flags().mirror&&room==='bedroom'&&Math.hypot(house.x-4.2,house.z-mirrorPlane)<6)list.push('mirror');
 if(house.z< -11&&residents().some(p=>Math.hypot(p.x-house.x,p.z-house.z)<11&&visibleTo({p:[p.x,1.5,p.z]})))list.push('stare');
 return list;
}
function startAnomaly(id){
 if(!anomalyDefinitions[id]||anomalyRuntime.active||paused()||!s.started||s.ending||s.sanityLost)return false;
 if(!advancedEngine||advancedEngine.failed)return false;
 let floor=supportAt(house.x,house.z);if(Math.abs((house.jumpHeight||0)-floor)>.1)return false;
 const def=anomalyDefinitions[id],state=anomalyState(),event={id,elapsed:0,witnessed:false,gaze:0,p:[house.x,floor,house.z],residents:[],knocks:0};
 if(['watcher','toy','door'].includes(id)){event.p=anomalyAnchor(id==='watcher'?4:2.4,id==='door'?.6:.32);if(!event.p)return false;event.yaw=Math.atan2(house.x-event.p[0],-(house.z-event.p[2]));}
 if(id==='footprints'){event.points=anomalyFootprints();if(event.points.length<3)return false;event.p=event.points[Math.floor(event.points.length/2)];event.yaw=-house.a;}
 if(id==='mirror'){if(!flags().mirror)return false;event.p=[4.2,0,mirrorPlane+.035];event.yaw=Math.PI;}
 if(id==='stare'){event.residents=residents().filter(p=>Math.hypot(p.x-house.x,p.z-house.z)<11&&visibleTo({p:[p.x,1.5,p.z]})).map(p=>({id:p.id,x:p.x,z:p.z}));if(!event.residents.length)return false;}
 anomalyRuntime.active=event;state.last=id;state.sequence++;state.nextAt=state.elapsed+def.duration+anomalyInterval()+cityStream(s.worldSeed,'anomaly-gap-'+state.sequence)()*18;save();return true;
}
function witnessAnomaly(event){
 if(event.witnessed)return;event.witnessed=true;
 let state=anomalyState(),def=anomalyDefinitions[event.id];
 if(!state.seen.some(item=>item.id===event.id))state.seen.push({id:event.id,place:rooms[houseRoom()]||houseRoom()});
 anomalyCaption.textContent=def.text;anomalyRuntime.captionUntil=state.elapsed+7;say(def.text);drainSanity(def.damage);save();
}
function advanceAnomalies(dt){
 if(!s.started||paused()||s.ending||s.sanityLost)return;
 let state=anomalyState();state.elapsed+=Math.min(.1,Math.max(0,dt));let event=anomalyRuntime.active;
 if(!event){if(state.elapsed<state.nextAt)return;let list=eligibleAnomalies().filter(id=>id!==state.last),unseen=list.filter(id=>!state.seen.some(item=>item.id===id));if(unseen.length)list=unseen;let rand=cityStream(s.worldSeed,'anomaly-'+state.sequence),offset=Math.floor(rand()*list.length);for(let i=0;i<list.length;i++)if(startAnomaly(list[(offset+i)%list.length]))return;state.nextAt=state.elapsed+5;return;}
 event.elapsed+=Math.min(.1,Math.max(0,dt));let def=anomalyDefinitions[event.id],p=event.p;
 if(event.id==='knocks'){let beats=[.6,1.25,1.9,4.5,5.15,5.8];if(event.knocks<beats.length&&event.elapsed>=beats[event.knocks]){tone(event.knocks<3?72:52,.18);event.knocks++;}if(event.elapsed>1.9)witnessAnomaly(event);}
 else if(event.id==='brownout'){if(event.elapsed>2)witnessAnomaly(event);}
 else if(event.id==='stare'){if(event.residents.some(p=>anomalyInView([p.x,1.5,p.z])))witnessAnomaly(event);}
 else{let target=[p[0],p[1]+(event.id==='footprints'?0:event.id==='mirror'?1.55:1.3),p[2]],seen=anomalyInView(target);if(seen)witnessAnomaly(event);if(event.id==='watcher'){event.gaze=seen?event.gaze+dt:0;if(event.witnessed&&(event.gaze>1.15||Math.hypot(p[0]-house.x,p[2]-house.z)<1.4))event.elapsed=def.duration;}}
 if(event.elapsed>=def.duration)anomalyRuntime.active=null;
}
function createAnomalyVisuals(e){
 const T=THREE,root=new T.Group(),groups={};root.name='anomaly-pool';e.scene.add(root);
 for(let id of Object.keys(anomalyDefinitions)){groups[id]=new T.Group();groups[id].name='anomaly:'+id;root.add(groups[id]);}
 const dark=plainMaterial('#18201d'),cloth=plainMaterial('#716e59'),skin=plainMaterial('#b5ad91');
 function part(group,geometry,material,x,y,z){let m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;group.add(m);return m;}
 const watcher=groups.watcher;part(watcher,new T.CapsuleGeometry(.16,.95,4,8),dark,0,1,0);part(watcher,new T.SphereGeometry(.12,10,8),skin,0,1.75,0);for(let side of [-1,1]){part(watcher,new T.CapsuleGeometry(.045,.95,3,6),dark,side*.24,.92,0);part(watcher,new T.CapsuleGeometry(.065,.6,3,6),dark,side*.095,.38,0);part(watcher,new T.SphereGeometry(.026,6,6),dark,side*.041,1.76,.104);}
 const toy=groups.toy;part(toy,new T.SphereGeometry(.12,10,8),cloth,0,0,0);let head=part(toy,new T.SphereGeometry(.09,10,8),skin,0,.17,0);for(let side of [-1,1]){part(toy,new T.CapsuleGeometry(.035,.13,3,6),cloth,side*.16,0,0).rotation.z=side*.8;part(toy,new T.CapsuleGeometry(.04,.17,3,6),cloth,side*.07,-.19,0);part(head,new T.SphereGeometry(.015,6,6),dark,side*.033,0,.081);}
 const door=groups.door;engineBox(door,0,0,0,.85,2,.06,'#313b32');for(let side of [-1,1])engineBox(door,side*.47,0,0,.1,2.12,.12,'#7c6a4d');engineBox(door,0,2,0,1.04,.12,.12,'#7c6a4d');for(let y of [.22,1.12])engineBox(door,0,y,.04,.61,.65,.018,'#424c3d');part(door,new T.SphereGeometry(.045,8,8),plainMaterial('#b8a16b',.6),.29,1,.09);engineLabel(door,['YOUR ROOM'],0,1.77,.077,.63,.13,'#b7a77f');
 const sole=document.createElement('canvas');sole.width=64;sole.height=128;const g=sole.getContext('2d');g.fillStyle='#1d2723';g.beginPath();g.ellipse(32,68,17,38,0,0,Math.PI*2);g.fill();for(let i=0;i<5;i++){g.beginPath();g.arc(15+i*9,24-Math.sin(i/4*Math.PI)*9,7-i*.6,0,Math.PI*2);g.fill();}const tex=new T.CanvasTexture(sole);tex.colorSpace=T.SRGBColorSpace;const printMaterial=new T.MeshStandardMaterial({map:tex,transparent:true,opacity:.82,roughness:.12,depthWrite:false});for(let i=0;i<7;i++){let m=part(groups.footprints,new T.PlaneGeometry(.18,.36),printMaterial,0,0,0);m.rotation.x=-Math.PI/2;}
 engineLabel(groups.mirror,['I AM STILL HERE','BEHIND YOU'],0,1.82,.005,.92,.35,{bg:null,fg:'#eadcca',font:'Georgia',border:false});const palm=new T.MeshBasicMaterial({color:'#b6c1b0',transparent:true,opacity:.53});for(let side of [-1,1]){let h=part(groups.mirror,new T.CircleGeometry(.07,12),palm,side*.23,1.22,.004);h.scale.y=1.3;for(let i=0;i<4;i++){let finger=part(groups.mirror,new T.PlaneGeometry(.019,.12),palm,side*.23+(i-1.5)*.033,1.34+Math.sin(i)*.013,.004);finger.rotation.z=(i-1.5)*-.07;}}
 e.anomalies={root,groups,toyHead:head};return e.anomalies;
}
function poseAnomalyResident(actor){
 let event=anomalyRuntime.active;if(!event||event.id!=='stare'||s.ending||s.sanityLost)return false;let p=event.residents.find(p=>p.id===actor.id);if(!p)return false;
 actor.root.position.set(p.x,0,-p.z);actor.root.lookAt(house.x,0,-house.z);actor.torso.scale.y=1+Math.sin(event.elapsed*2)*.003;return true;
}
// Interaction targets and collision follow the same frozen people as the renderer.
const movingResidents=residents;residents=function(){let people=movingResidents(),event=anomalyRuntime.active;if(!event||event.id!=='stare')return people;return people.map(p=>{let still=event.residents.find(q=>q.id===p.id);return still?{...p,x:still.x,z:still.z}:p})};
function updateAnomalyVisuals(e){
 const pool=e.anomalies||createAnomalyVisuals(e),event=anomalyRuntime.active,state=anomalyState();for(let group of Object.values(pool.groups))group.visible=false;
 for(let light of e.indoorLights||[])light.intensity=light.userData.baseIntensity;
 anomalyCaption.style.opacity=!paused()&&!s.ending&&!s.sanityLost&&state.elapsed<anomalyRuntime.captionUntil?'1':'0';
 if(!event||s.ending||s.sanityLost)return;let group=pool.groups[event.id],p=event.p,t=event.elapsed;group.visible=true;group.position.set(p[0],p[1],-p[2]);group.rotation.y=event.yaw||0;
 if(event.id==='toy'){group.position.y+=1.1+Math.sin(t*1.1)*.18;group.rotation.y+=t*.25;pool.toyHead.rotation.y=-t*.6;}
 if(event.id==='watcher')group.rotation.z=Math.sin(t*.7)*.025;
 if(event.id==='footprints'){group.position.set(0,0,0);group.rotation.y=0;group.children.forEach((m,i)=>{let pt=event.points[i];m.visible=!!pt;if(pt){m.position.set(pt[0],pt[1],-pt[2]);m.rotation.z=event.yaw;}});}
 if(event.id==='brownout'){let fade=1-.72*Math.pow(Math.sin(Math.PI*t/anomalyDefinitions.brownout.duration),2);for(let light of e.indoorLights||[])light.intensity*=fade;e.ambient.intensity*=.8+.2*fade;}
}
function anomalyJournal(){let state=anomalyState();modal('Anomalies · '+state.seen.length+' / '+Object.keys(anomalyDefinitions).length,state.seen.length?state.seen.map(item=>anomalyDefinitions[item.id].title+' — '+item.place+'\n'+anomalyDefinitions[item.id].text).join('\n\n'):'Nothing recorded yet. Some things only appear when you stop looking for them.',[['Back',close]])}
const anomalyMovement=updateMovement;updateMovement=function(dt){anomalyMovement(dt);advanceAnomalies(dt)};
const anomalyReset=reset;reset=function(){anomalyRuntime={active:null,captionUntil:0};anomalyReset();s.anomalies={elapsed:0,nextAt:20,sequence:0,seen:[],last:null};anomalyCaption.style.opacity='0';save()};
let anomalyButton=document.createElement('button');anomalyButton.textContent='ANOMALIES';anomalyButton.onclick=anomalyJournal;toolbar.append(anomalyButton);
anomalyState();
