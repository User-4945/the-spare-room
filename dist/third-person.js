/* Camera preference is separate from story saves. V works in every event week. */
const playerCamera={third:false,distance:3.2,actualDistance:0};
try{playerCamera.third=localStorage.getItem('spare-camera')==='third';}catch{}
const cameraButton=document.createElement('button');toolbar.append(cameraButton);
function setThirdPerson(value){playerCamera.third=!!value;playerCamera.actualDistance=0;try{localStorage.setItem('spare-camera',value?'third':'first');}catch{}cameraButton.textContent=value?'CAMERA · THIRD PERSON (V)':'CAMERA · FIRST PERSON (V)';house.dirty=true;}
cameraButton.onclick=()=>setThirdPerson(!playerCamera.third);setThirdPerson(playerCamera.third);
document.addEventListener('keydown',event=>{if(event.code==='KeyV'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'')&&!event.repeat){event.preventDefault();setThirdPerson(!playerCamera.third);}});
function createPlayerAvatar(e){const T=THREE,root=new T.Group();root.name='player-avatar';e.scene.add(root);const limbs=[];
 engineBox(root,0,.7,0,.36,.6,.25,'#645650');engineBox(root,0,1.3,0,.13,.12,.13,'#bda185');let head=new T.Mesh(new T.SphereGeometry(.14,12,10),plainMaterial('#bda185'));head.position.y=1.56;root.add(head);engineBox(root,0,1.65,-.025,.26,.1,.23,'#332f31');
 for(const side of [-1,1]){const arm=new T.Group();arm.position.set(side*.25,1.24,0);root.add(arm);engineBox(arm,0,-.55,0,.09,.55,.11,'#645650');engineBox(arm,0,-.62,0,.085,.09,.1,'#bda185');const leg=new T.Group();leg.position.set(side*.11,.72,0);root.add(leg);engineBox(leg,0,-.64,0,.13,.64,.15,'#303840');engineBox(leg,0,-.72,.045,.16,.1,.28,'#262729');limbs.push({arm,leg,side});}
 return {root,limbs,ray:new T.Raycaster(),head:new T.Vector3(),direction:new T.Vector3(),desired:new T.Vector3(),sample:new T.Vector3()};}
function applyPlayerCamera(e){if(!e.playerAvatar)e.playerAvatar=createPlayerAvatar(e);const p=e.playerAvatar,feet=house.jumpHeight||0; p.root.visible=playerCamera.third;p.root.position.set(house.x,feet,-house.z);p.root.rotation.y=Math.PI-house.a;
 const moving=!paused()&&Object.values(house.keys||{}).some(Boolean),phase=(s.worldSeconds||0)*8;for(const l of p.limbs){l.leg.rotation.x=feet>supportAt(house.x,house.z)+.15?-.25:moving?Math.sin(phase)*.45*l.side:0;l.arm.rotation.x=moving?-Math.sin(phase)*.32*l.side:0;}
 if(!playerCamera.third){playerCamera.actualDistance=0;return;}
 e.camera.updateMatrixWorld(true);p.head.set(house.x,1.5+feet,-house.z);p.direction.set(0,0,1).applyQuaternion(e.camera.quaternion);p.desired.copy(p.head).addScaledVector(p.direction,playerCamera.distance);p.desired.y+=.35;p.desired.x+=Math.cos(house.a)*.4;p.desired.z+=Math.sin(house.a)*.4;
 p.direction.copy(p.desired).sub(p.head);let length=p.direction.length();p.direction.normalize();e.world.updateMatrixWorld(true);p.ray.set(p.head,p.direction);p.ray.near=.03;p.ray.far=length+.15;const hit=p.ray.intersectObjects(e.world.children,true).find(h=>h.object.isMesh&&h.distance>.03);let distance=hit?Math.max(0,hit.distance-.22):length;
 // Probe a small camera volume as well as the centre ray to keep corners out of the lens.
 for(const dx of [-.14,.14]){p.sample.copy(p.head);p.sample.x+=Math.cos(house.a)*dx;p.sample.z+=Math.sin(house.a)*dx;p.ray.set(p.sample,p.direction);const h=p.ray.intersectObjects(e.world.children,true)[0];if(h)distance=Math.min(distance,Math.max(0,h.distance-.22));}
 playerCamera.actualDistance=distance;e.camera.position.copy(p.head).addScaledVector(p.direction,distance);p.root.visible=distance>.65;e.camera.updateMatrixWorld(true);
}
const playerPreviousView=view;view=function(point){if(!playerCamera.third||!advancedEngine||advancedEngine.failed)return playerPreviousView(point);const v=new THREE.Vector3(point[0],point[1],-point[2]).applyMatrix4(advancedEngine.camera.matrixWorldInverse);return [v.x,v.y,-v.z];};

const playerPreviousVisibility=visibleTo;visibleTo=function(target){if(!playerPreviousVisibility(target))return false;if(!playerCamera.third||!advancedEngine)return true;const c=advancedEngine.camera.position,start=[c.x,c.y,-c.z],distance=Math.hypot(target.p[0]-start[0],target.p[1]-start[1],target.p[2]-start[2]);for(let d=.1;d<distance-.35;d+=.1){const t=d/distance,x=start[0]+(target.p[0]-start[0])*t,y=start[1]+(target.p[1]-start[1])*t,z=start[2]+(target.p[2]-start[2])*t;if(house.solids.some(b=>y>b.y&&y<b.y+b.h&&Math.abs(x-b.x)<b.w/2&&Math.abs(z-b.z)<b.d/2))return false;}return true;};
