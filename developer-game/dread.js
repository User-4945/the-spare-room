// Alpha horror polish: pooled visuals, measured pacing, no rapid flashes or extra sanity charges.
const DREAD_PROFILE=Object.freeze({watcherScale:1.28,gazeSeconds:4.8});
const dreadReducedMotion=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function decorateDreadPool(pool){
 if(pool.dreadReady)return pool;
 pool.dreadReady=true;
 const T=THREE;
 const black=plainMaterial('#101716'),ivory=new T.MeshStandardMaterial({color:'#a5b397',emissive:'#26332b',roughness:.85});
 const add=(group,geometry,material,x,y,z)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);group.add(m);return m};
 const w=pool.groups.watcher;w.scale.setScalar(DREAD_PROFILE.watcherScale);
 w.children[1].material=black;
 add(w,new T.ConeGeometry(.23,.48,9),black,0,1.83,0);
 for(const side of [-1,1]){
  add(w,new T.SphereGeometry(.014,6,6),ivory,side*.045,1.75,.133);
  for(let f=0;f<3;f++)add(w,new T.CapsuleGeometry(.011,.2,2,5),black,side*(.23+f*.018),.37,.025);
 }
 const toy=pool.groups.toy;
 for(const side of [-1,1])add(pool.toyHead,new T.SphereGeometry(.012,6,6),ivory,side*.033,0,.09);
 add(toy,new T.ConeGeometry(.15,.27,8),plainMaterial('#735b57'),0,-.02,0);
 pool.dreadDoorGap=add(pool.groups.door,new T.PlaneGeometry(.025,1.8),black,.39,.95,.095);
 pool.dreadDoorGap.visible=false;
 return pool;
};
const dreadCreate=createAnomalyVisuals;
createAnomalyVisuals=function(e){return decorateDreadPool(dreadCreate(e));};
// The original event scheduler remains authoritative, including pauses and once-only damage.
anomalyDefinitions.watcher.text='Its head almost reaches the ceiling. The face is hidden, but the eyes have found you.';
anomalyDefinitions.toy.text='The doll turns its head towards you. Its body keeps facing the empty chair.';
anomalyDefinitions.door.text='The plate says YOUR ROOM. The narrow gap is dark. Something is keeping it open.';
const dreadVisuals=updateAnomalyVisuals;
updateAnomalyVisuals=function(e){
 dreadVisuals(e);
 const event=anomalyRuntime.active,pool=e.anomalies;
 if(pool)decorateDreadPool(pool);
 if(!event||!pool)return;
 const t=event.elapsed,fade=Math.min(1,t/1.4,Math.max(0,(anomalyDefinitions[event.id].duration-t)/1.5));
 if(event.id==='watcher'){
  pool.groups.watcher.scale.setScalar(DREAD_PROFILE.watcherScale);
  pool.groups.watcher.rotation.z=0;
  pool.groups.watcher.rotation.y+=dreadReducedMotion?0:Math.min(.16,Math.max(0,t-2)*.016);
 }
 if(event.id==='toy'){
  pool.groups.toy.rotation.y=event.yaw||0;
  pool.toyHead.rotation.y=dreadReducedMotion?.5:Math.min(Math.PI*.65,Math.max(0,t-2)*.17);
  pool.toyHead.rotation.z=dreadReducedMotion?0:Math.sin(t*.4)*.08;
 }
 if(event.id==='footprints')pool.groups.footprints.children.forEach((m,i)=>m.visible=!!event.points[i]&&t>=i*.7);
 if(event.id==='door')pool.dreadDoorGap.visible=t>3;
 // Reuse materials for dim exit fades; no transient meshes or lights per frame.
 pool.root.userData.dreadEnvelope=fade;
};
const dreadDeep=deepVisuals;
deepVisuals=function(e){
 dreadDeep(e);
 const effects=e.deepEffects;if(!effects)return;
 if(!effects.dreadReady){
  for(const [id,g] of Object.entries(effects.rigs)){
   const details=new THREE.Group();details.name='dread-detail:'+id;g.add(details);g.children.unshift(g.children.pop());
   const material=plainMaterial('#17221d');
   if(['coat','shadow','frost'].includes(id)){
    for(const side of [-1,1])for(let i=0;i<3;i++){
     const finger=new THREE.Mesh(new THREE.BoxGeometry(.025,.38,.025),material);
     finger.position.set(side*(.33+i*.055),.32,.01);details.add(finger);
    }
   }
   if(['portrait','names','ink','boxes','label','drawing'].includes(id)){
    engineLabel(details,[id==='names'?'FOUR CHILDREN':'KEEP BOTH COPIES'],0,1.5,.11,1.1,.18,{bg:null,fg:'#c8b99a',font:'Georgia',border:false});
    details.visible=false;
   }
   g.userData.dreadDetail=details;
  }
  effects.dreadReady=true;
 }
 const event=deepRuntime.active;if(!event)return;
 const rig=effects.rigs[event.id],t=deepRuntime.elapsed;
 if(!rig||!rig.visible)return;
 if(rig.userData.dreadGeneration!==deepRuntime.generation){rig.userData.dreadGeneration=deepRuntime.generation;rig.userData.dreadLooked=false;rig.userData.dreadChanged=false;}
 const point=deepAnomalyPoint(event),p=view(point);
 const seen=p[2]>.08&&Math.abs(p[0]/p[2])<.65&&visibleTo({p:point});
 if(seen)rig.userData.dreadLooked=true;
 else if(rig.userData.dreadLooked)rig.userData.dreadChanged=true;
 if(['portrait','names','ink','boxes','label','drawing'].includes(event.id))rig.userData.dreadDetail.visible=rig.userData.dreadChanged;
 if(event.id==='coat'){
  rig.rotation.z=0;
  rig.rotation.y+=dreadReducedMotion?0:Math.min(.2,Math.max(0,t-4)*.018);
 }
 if(event.id==='shadow')rig.scale.y*=1.35;
 if(event.id==='steps')rig.children.filter(m=>m!==rig.userData.dreadDetail).forEach((m,i)=>m.visible=t>i*.8);
};
// A longer stare gives the player time to notice the full silhouette before it leaves.
// Keep all existing collision, captions, pause clocks and journal rules intact.
