/* Christmas in Ashfield: isolated, opt-in seasonal layer for the v3 game. */
(function () {
 'use strict';
 const config=window.SPARE_ROOM_CHRISTMAS || {};
 const profiles=Object.freeze({
  snow:Object.freeze({extraDrain:.10,anomalyPacing:1,light:1}),
  squall:Object.freeze({extraDrain:.20,anomalyPacing:.9,light:.9})
 });
 function effects(weather,sheltered){const p=profiles[weather]||profiles.snow;
  return {extraDrain:sheltered?0:p.extraDrain,anomalyPacing:sheltered?1:p.anomalyPacing,light:p.light};
 }
 const clues=Object.freeze([
  'There are four names on the parcels. A fifth ribbon is already tied.',
  'The timetable lists a Christmas service. Its destination has been rubbed away.',
  'A card reads: Leave a place for whoever comes home.',
  'The snow beneath the window is untouched. Someone has wiped the glass from outside.',
  'Tomorrow’s diary mentions a bell. No one remembers hanging one.'
 ]);
 window.SpareRoomChristmas=Object.freeze({enabled:config.enabled===true,effects,clues});
 if(config.enabled!==true)return;
 // No event save slot, ending registration, reward or calendar gate is introduced.
 let elapsed=0,weather='snow',sceneRef=null,group=null,snow=null,positions=null;
 const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const count=Math.max(0,Math.min(240,Number(config.particleCount)||180));
 const outside=()=>['city','garden'].includes(houseRoom()) && (house.jumpHeight||0)>=-.1;
 function initialize(){
  if(!advancedEngine||advancedEngine.failed||sceneRef===advancedEngine.scene)return;
  sceneRef=advancedEngine.scene;
  const T=THREE;
  group=new T.Group();group.name='AshfieldChristmas';sceneRef.add(group);
  const pine=new T.MeshStandardMaterial({color:0x283e2f,roughness:1});
  const amber=new T.MeshStandardMaterial({color:0xb49a6b,emissive:0x705529,emissiveIntensity:.45});
  for(let i=0;i<11;i++){
   const sprig=new T.Mesh(new T.BoxGeometry(.34,.15,.18),pine);
   sprig.position.set(-1.7+i*.34,2.45,6.1);sprig.rotation.z=Math.sin(i)*.12;group.add(sprig);
   if(i%2===0){const bulb=new T.Mesh(new T.SphereGeometry(.045,5,4),amber);bulb.position.copy(sprig.position);bulb.position.y-=.13;group.add(bulb);}
  }
  if(config.snow!==false&&!reduced&&count){
   positions=new Float32Array(count*3);
   for(let i=0;i<count;i++){positions[i*3]=Math.random()*18-9;positions[i*3+1]=Math.random()*10;positions[i*3+2]=Math.random()*18-9;}
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));
   snow=new T.Points(geometry,new T.PointsMaterial({color:0xd5dfd6,size:.035,transparent:true,opacity:.55,depthWrite:false}));
   snow.frustumCulled=false;group.add(snow);
  }
 }
 const parentMovement=updateMovement;
 updateMovement=function(dt){
  parentMovement(dt);
  if(paused()||!s.started||s.ending||s.sanityLost)return;
  dt=Math.max(0,Math.min(.1,dt));elapsed+=dt;weather=elapsed%180>135?'squall':'snow';
  initialize();
  const exposed=outside(),fx=effects(weather,!exposed);
  if(exposed)drainSanity(dt/30*fx.extraDrain);
  if(snow){
   snow.visible=exposed;
   snow.position.set(house.x,0,-house.z);
   if(exposed){for(let i=0;i<count;i++){positions[i*3+1]-=dt*(weather==='squall'?1.8:.8);positions[i*3]+=dt*.12;
    if(positions[i*3+1]<0)positions[i*3+1]=10;if(positions[i*3]>9)positions[i*3]=-9;}
    snow.geometry.attributes.position.needsUpdate=true;
   }
  }
  // Grade the existing sky light without adding shadow-casting lights.
  if(advancedEngine?.hemi){const base=worldDaylight();advancedEngine.hemi.intensity=(.36+base*.55)*fx.light;}
 };
 const parentInterval=anomalyInterval;
 anomalyInterval=function(){return parentInterval()*effects(weather,!outside()).anomalyPacing;};
 const parentTargets=targets;
 targets=function(){const locations=[[-4.1,.96,7.8],[0,.2,-3],[4,.3,-4],[4,1,6],[-2,.3,-7]];
  return parentTargets().concat(clues.map((clue,i)=>({
   name:i===2?'A winter card':'A winter trace '+(i+1),p:locations[i],
   fn:()=>modal('Christmas in Ashfield',clue,[['Put it back',close]])
  })));
 };
 const parentReset=reset;
 reset=function(){elapsed=0;weather='snow';return parentReset();};
})();

