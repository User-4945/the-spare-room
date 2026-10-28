/* Detailed event props use batched static meshes and persistent animated pools. */
function eventArtMaterials(e){
 if(e.eventArtMaterials)return e.eventArtMaterials;const T=THREE;
 function fabric(kind){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),rand=seededRandom(kind==='wallpaper'?77:91);g.fillStyle=kind==='wallpaper'?'#74656f':kind==='cloth'?'#84737e':'#a49176';g.fillRect(0,0,256,256);
  if(kind==='wallpaper'){g.strokeStyle='#cab4a33f';g.lineWidth=1.3;for(let y=0;y<256;y+=64)for(let x=0;x<256;x+=48){g.beginPath();g.moveTo(x+24,y+3);g.quadraticCurveTo(x+45,y+28,x+24,y+61);g.quadraticCurveTo(x+3,y+28,x+24,y+3);g.stroke();g.beginPath();g.ellipse(x+24,y+31,5,11,0,0,Math.PI*2);g.stroke();}}
  for(let i=0;i<2000;i++){g.fillStyle='rgba(29,20,24,'+(.03+rand()*.12)+')';g.fillRect(rand()*256,rand()*256,kind==='cloth'?1:rand()*8+1,kind==='cloth'?rand()*18+1:1);}
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;e.textures['event-'+kind]=tex;return tex;
 }
 const palette={wood:{color:'#76604b',map:e.textures.wood},darkWood:{color:'#40332f',map:e.textures.wood},brass:{color:'#b09661',metalness:.67,roughness:.38},iron:{color:'#393c3d',metalness:.65,roughness:.6},stone:{color:'#aaa18a',map:e.textures.stone},damp:{color:'#788077',map:e.textures.stone},cloth:{color:'#867184',map:fabric('cloth'),side:T.DoubleSide},paper:{color:'#d9c5a2'},wallpaper:{color:'#d3bec4',map:fabric('wallpaper')},wax:{color:'#ddd1ab'},glass:{color:'#a6b9b4',transparent:true,opacity:.18,depthWrite:false,roughness:.12},black:{color:'#29252d'},leather:{color:'#77563c',map:fabric('leather')}};
 const out={};for(const [key,settings]of Object.entries(palette)){out[key]=new T.MeshStandardMaterial({roughness:.86,...settings});e.materials['event-'+key]=out[key];}e.eventArtMaterials=out;return out;
}
function eventArtMesh(parent,geometry,material,x,y,z){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=!material.transparent;m.receiveShadow=true;parent.add(m);return m;}
function eventArtBox(parent,mat,x,y,z,w,h,d){return eventArtMesh(parent,new THREE.BoxGeometry(w,h,d),mat,x,y+h/2,z);}
function eventArtTube(parent,mat,points,r=.018){return eventArtMesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),16,r,6,false),mat,0,0,0);}
function eventArtMask(parent,mat,x,y,z,scale=1){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);parent.add(g);const face=eventArtMesh(g,new THREE.SphereGeometry(.15,16,12),mat.paper,0,0,0);face.scale.set(1,1.3,.35);for(const side of [-1,1]){const eye=eventArtMesh(g,new THREE.SphereGeometry(.032,9,7),mat.black,side*.052,.027,.049);eye.scale.set(.85,1.3,.2);}eventArtTube(g,mat.leather,[[0,.1,.05],[.018,.045,.055],[-.012,.005,.057],[.01,-.06,.053]],.003);return g;}
function eventArtLantern(parent,mat,x,y,z,scale=1){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);parent.add(g);eventArtBox(g,mat.iron,0,0,0,.32,.06,.32);for(const dx of [-.14,.14])for(const dz of [-.14,.14])eventArtBox(g,mat.brass,dx,.06,dz,.023,.41,.023);eventArtBox(g,mat.glass,0,.06,0,.27,.39,.27);eventArtMesh(g,new THREE.ConeGeometry(.25,.16,4),mat.iron,0,.51,0).rotation.y=Math.PI/4;eventArtMesh(g,new THREE.TorusGeometry(.07,.011,6,14),mat.brass,0,.66,0);eventArtMesh(g,new THREE.CylinderGeometry(.065,.07,.2,12),mat.wax,0,.16,0);const flame=eventArtMesh(g,new THREE.SphereGeometry(.035,9,7),new THREE.MeshStandardMaterial({color:'#ffe2a9',emissive:'#ffb557',emissiveIntensity:2}),0,.3,0);flame.scale.y=1.8;return {root:g,flame};}
// Static detail is merged by material, reducing hundreds of props to a small number of draws.
function batchEventArt(root){root.updateMatrixWorld(true);const buckets=new Map(),remove=[];root.traverse(o=>{if(!o.isMesh||o.userData.sign||o.material.transparent||!o.geometry?.attributes?.position)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry,b=buckets.get(o.material)||{p:[],n:[],uv:[]};const pos=g.attributes.position,norm=g.attributes.normal,uv=g.attributes.uv,v=new THREE.Vector3(),n=new THREE.Vector3(),normalMatrix=new THREE.Matrix3().getNormalMatrix(o.matrixWorld);for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);b.p.push(v.x,v.y,v.z);if(norm){n.fromBufferAttribute(norm,i).applyNormalMatrix(normalMatrix);b.n.push(n.x,n.y,n.z);}else b.n.push(0,1,0);const worldMapped=o.material.map&&['event-wallpaper','event-wood','event-darkWood','event-stone','event-damp'].some(k=>advancedEngine.materials[k]===o.material);if(worldMapped){const axis=Math.abs(n.y)>Math.max(Math.abs(n.x),Math.abs(n.z))?'y':Math.abs(n.x)>Math.abs(n.z)?'x':'z';b.uv.push((axis==='x'?v.z:v.x)*.75,(axis==='y'?v.z:v.y)*.75);}else b.uv.push(uv?.getX(i)||0,uv?.getY(i)||0);}buckets.set(o.material,b);remove.push(o);if(g!==o.geometry)g.dispose();});
 for(const o of remove){o.parent.remove(o);o.geometry.dispose();}for(const [material,b]of buckets){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));g.computeBoundingSphere();const m=new THREE.Mesh(g,material);m.castShadow=m.receiveShadow=true;m.name='event-detail-batch';root.add(m);}}
function buildEventLocationArt(e){
 const T=THREE,mat=eventArtMaterials(e),g=new T.Group();g.name='event-location-detail';e.world.add(g);const box=(m,x,y,z,w,h,d)=>eventArtBox(g,mat[m],x,y,z,w,h,d),mesh=(geo,m,x,y,z)=>eventArtMesh(g,geo,mat[m],x,y,z);
 // Three lantern stops: engraved plinth, metalwork, folded offerings and wax trails.
 for(const seal of halloweenSeals){const c=cityWorld().find(c=>c.id===seal.id),x=c.x+1.8,z=-(c.z+1);box('stone',x,.05,z,.85,.18,.85);box('darkWood',x,.23,z,.58,.66,.58);for(const side of [-1,1]){box('brass',x+side*.26,.27,z,.025,.57,.6);box('brass',x,.27,z+side*.26,.6,.025,.025);}box('wood',x,.89,z,.76,.065,.76);for(let i=0;i<3;i++)mesh(new T.CylinderGeometry(.038,.05,.1+i*.035,10),'wax',x-.27+i*.1,.99,z+.24);}
 // Timber bell shrine leaves the original approach and interaction target clear.
 for(const side of [-1,1]){box('wood',2+side*.61,.04,8.48,.1,1.95,.12);box('brass',2+side*.61,.1,8.48,.13,.04,.15);}box('darkWood',2,1.96,8.48,1.5,.1,.75);mesh(new T.ConeGeometry(1.06,.4,4),'wood',2,2.2,8.48).rotation.y=Math.PI/4;box('stone',2,.01,8.48,1.6,.09,1.1);
 const second=typeof week2WorldActive==='function'&&week2WorldActive(),third=typeof week3Active==='function'&&week3Active();
 if(second){
  // Velvet & Ash: fitted wall panelling, patterned paper and recessed shop windows.
  for(const x of [50.14,61.86]){box('wallpaper',x,1.02,33,.025,1.8,9.7);box('wood',x,.12,33,.06,.82,9.7);box('brass',x,.94,33,.075,.035,9.7);box('darkWood',x,2.78,33,.12,.1,9.7);}
  box('wallpaper',56,1.02,37.86,11.6,1.7,.025);box('wood',56,.12,37.84,11.6,.82,.06);
  for(const x of [52.2,59.8]){box('darkWood',x,.7,27.84,2.7,1.65,.07);box('glass',x,.78,27.78,2.5,1.47,.025);for(const dx of [-1.38,0,1.38])box('brass',x+dx,.68,27.73,.035,1.7,.05);box('brass',x,1.49,27.72,2.8,.035,.05);box('wood',x,.62,27.72,2.95,.07,.22);for(const side of [-1,1]){const curtain=mesh(new T.CylinderGeometry(.15,.25,1.48,10,1,true),'cloth',x+side*1.05,1.5,27.77);curtain.scale.z=.25;}}
  for(const x of [50.38,61.62])eventArtTube(g,mat.iron,[[x,.1,27.65],[x,2.82,27.65],[x,2.82,37.7]],.035);
  // Rails and tailored coats occupy the existing rack footprints.
  for(const x of [52,60])for(const z of [31,35]){for(let i=-1;i<=1;i++){const cx=x+i*.4;eventArtTube(g,mat.brass,[[cx-.16,1.77,z-.06],[cx,1.96,z-.06],[cx+.16,1.77,z-.06]],.012);const coat=mesh(new T.CylinderGeometry(.12,.19,.93,9,1,true),'cloth',cx,1.21,z-.065);coat.scale.z=.52;for(const side of [-1,1]){const sleeve=mesh(new T.CylinderGeometry(.055,.07,.65,7),'cloth',cx+side*.17,1.38,z-.065);sleeve.rotation.z=side*.18;}}}
  // Counter drawers, brass cash register, spools and a curved sewing-machine arm.
  for(const dx of [-.8,0,.8]){box('darkWood',53+dx,.32,31.48,.7,.34,.025);box('brass',53+dx,.52,31.45,.15,.028,.04);}box('iron',52.65,.86,32,.45,.09,.32);box('iron',52.6,.95,32,.29,.29,.23);box('brass',52.6,1.24,32,.36,.06,.28);for(let i=0;i<4;i++)box('paper',52.49+i*.07,1.05,31.868,.045,.035,.015);
  box('iron',53.35,.86,32,.56,.035,.29);eventArtTube(g,mat.iron,[[53.17,.9,32],[53.17,1.17,32],[53.48,1.17,32],[53.48,1.03,32]],.045);mesh(new T.TorusGeometry(.1,.014,6,16),'brass',53.13,1.08,32.02).rotation.y=Math.PI/2;for(let i=0;i<3;i++)mesh(new T.CylinderGeometry(.027,.027,.08,10),'cloth',53.7+i*.09,.93,32);
  for(const x of [53.4,58.5]){box('paper',x,-2.326,35.5,.59,.008,.39);for(let i=0;i<4;i++)box('leather',x-.6+i*.15,-3.15,35.92,.12,.53,.5);}
  for(const x of [51,61])eventArtTube(g,mat.iron,[[x,-.4,28.4],[x,-.4,37.5],[56,-.4,37.5]],.035);
  box('damp',56,-3.18,37.86,11.6,2.7,.025);box('darkWood',56,-3.17,37.83,11.6,.55,.035);for(let i=0;i<9;i++)box('damp',51+i*1.2,-2.9,37.807,.04,.6+(i%3)*.23,.009);
  for(const side of [-1,1])box('iron',56+side*.3,-3.15,37.62,.045,2.7,.045);for(let y=-2.95;y<-.45;y+=.3)box('brass',56,y,37.6,.64,.035,.045);
  for(const x of [54.5,57.7]){eventArtTube(g,mat.iron,[[x,-.35,37.4],[x,-.65,37.4]],.008);const shroud=mesh(new T.CylinderGeometry(.11,.28,1.15,14,1,true),'cloth',x,-1.27,37.4);shroud.scale.z=.53;for(let i=0;i<4;i++)box('paper',x+(i-1.5)*.06,-1.8,37.22,.008,.95,.01);}
  for(const r of [.66,.87]){const chalk=mesh(new T.TorusGeometry(r,.008,4,48),'paper',56,-3.065,35.2);chalk.rotation.x=Math.PI/2;}
  const warning=engineLabel(g,['ALTERATIONS','RETURN WHAT YOU BORROWED'],56,-1.14,37.72,1.5,.39,{bg:'#342d2b',fg:'#d6c6a5',border:'#99794e',font:'Georgia'});warning.rotation.y=Math.PI;

  if(week2State().extraHouse){for(const x of [51.12,60.88])box('stone',x,.1,55,.06,.5,9.8);for(const side of [-1,1]){const x=56+side*3;box('darkWood',x,1,49.74,1.42,1.53,.08);box('glass',x,1.1,49.68,1.2,1.3,.02);box('wood',x,1.75,49.65,1.23,.045,.05);box('wood',x,1.08,49.65,.045,1.36,.05);}box('wood',56,2.53,49.68,1.82,.12,.2);}
 }
 if(third){
  // The Final House has rooms with panelled walls, picture rails and memory displays.
  for(const x of [70.15,89.85]){box('wallpaper',x,1.02,-20,.025,1.9,19.6);box('wood',x,.12,-20,.07,.85,19.6);box('brass',x,.99,-20,.09,.025,19.6);}for(const z of [-10.15,-29.85]){box('wallpaper',80,1.02,z,19.6,1.9,.025);box('wood',80,.12,z,19.6,.85,.07);box('brass',80,.99,z,19.6,.025,.09);}
  for(const x of [77,83])for(const [z,d]of [[-12.5,5],[-20,4],[-27,6]])for(const side of [-1,1]){box('wood',x+side*.086,.1,z,.018,.8,d-.1);box('brass',x+side*.103,.9,z,.023,.025,d-.1);box('wallpaper',x+side*.081,1,z,.012,1.85,d-.1);}
  // Frames share the structural opening dimensions; jambs sit over wall ends.
  g.userData.memoryDoorFrames=[];
  for(const x of [77,83])for(const d of week3DoorwayLayout()){
   for(const z of [d.start-d.trim/2,d.end+d.trim/2])box('darkWood',x,d.base,-z,.26,d.head+d.trim/2-d.base,d.trim);
   box('wood',x,d.head-d.trim/2,-d.center,.26,d.trim,d.width+2*d.trim);
   for(const side of [-1,1])box('wallpaper',x+side*.081,d.head+d.trim/2,-d.center,.012,2.85-d.head-d.trim/2,d.width);
   g.userData.memoryDoorFrames.push({x,start:d.start,end:d.end,center:d.center,width:d.width,head:d.head});
  }
  for(const [x,z]of [[74,-17],[86,-17],[74,-24]]){box('cloth',x,.115,z-1.1,3.8,.008,2.8);for(const dx of [-1.2,1.2])box('brass',x+dx,.18,z,.035,.69,1.12);box('glass',x,.9,z,2.5,.52,1.05);box('darkWood',x,1.41,z,2.6,.035,1.13);box('paper',x,.92,z,.59,.014,.4);}
  eventArtMask(g,mat,86,1.1,-17,.75);eventArtLantern(g,mat,74,.92,-17,.7);
  // Open journal: folded pages, stitched binding and faint ruled lines.
  box('leather',74,.94,-24,.7,.04,.48);for(const side of [-1,1]){const page=box('paper',74+side*.15,.98,-24,.29,.025,.43);page.rotation.z=side*.06;for(let i=0;i<6;i++)box('wood',74+side*.15,1.007,-24.15+i*.05,.22,.001,.004);}
  // Suitcase straps, rounded handle, rivets and metal clasps.
  box('leather',80,.12,-27,1.32,.65,.54);for(const side of [-1,1]){box('darkWood',80+side*.42,.15,-26.716,.085,.58,.014);box('brass',80+side*.42,.44,-26.7,.12,.09,.015);for(const z of [-26.73,-27.27])box('brass',80+side*.61,.18,z,.045,.05,.025);}eventArtTube(g,mat.leather,[[79.8,.77,-27],[79.83,.87,-27],[80.17,.87,-27],[80.2,.77,-27]],.022);
  // Clock has a cream dial and real raised hour markers; hands animate in the pool.
  box('darkWood',80,.12,-24,.69,.12,.54);box('darkWood',80,2.48,-24,.72,.1,.56);box('darkWood',80,.65,-23.778,.43,1.16,.025);box('glass',80,.67,-23.748,.36,1.12,.014);for(const side of [-1,1])box('brass',80+side*.235,.63,-23.74,.025,1.2,.025);mesh(new T.CircleGeometry(.205,32),'brass',80,2.2,-23.756);mesh(new T.CircleGeometry(.183,32),'paper',80,2.2,-23.75);for(let i=0;i<12;i++){const a=i*Math.PI/6,m=box('brass',80+Math.sin(a)*.157,2.2+Math.cos(a)*.157,-23.73,.013,.035,.014);m.rotation.z=-a;}
 }
 batchEventArt(g);return g;
}
const eventArtPreviousRebuild=rebuildAdvancedWorld;rebuildAdvancedWorld=function(){eventArtPreviousRebuild();buildEventLocationArt(advancedEngine);};
function createEventPerformanceArt(e){
 const T=THREE,mat=eventArtMaterials(e),root=new T.Group();root.name='event-performance-pool';e.scene.add(root);const lanterns=[],rigs=[],ribbons=[];
 for(const [x,y,z]of [[1.4,.12,8.5],[2.6,.12,8.5],[51,.18,29],[61,.18,29],[55.2,-3.1,34],[74,.92,-24]]){const l=eventArtLantern(root,mat,x,y,z,.8);l.week=x>70?3:x>45?2:1;lanterns.push(l);}
 const ribbonMat=new T.MeshStandardMaterial({color:'#b89570',roughness:.9,side:T.DoubleSide});for(let i=0;i<3;i++){const r=eventArtMesh(root,new T.PlaneGeometry(.07,.42),ribbonMat,1.9+i*.07,1.05,8.43);ribbons.push(r);}
 const clock=new T.Group();clock.position.set(80,2.2,-23.716);root.add(clock);const hands=[];for(const [length,width]of [[.12,.018],[.16,.012]]){const pivot=new T.Group();clock.add(pivot);eventArtBox(pivot,mat.black,0,0,.003,width,length,.012);hands.push(pivot);}const pendulum=new T.Group();pendulum.position.set(80,1.85,-23.712);root.add(pendulum);eventArtBox(pendulum,mat.brass,0,-1,0,.014,1,.014);eventArtMesh(pendulum,new T.SphereGeometry(.075,12,8),mat.brass,0,-.9,0);
 const dustPositions=new Float32Array(64*3),dustGeometry=new T.BufferGeometry();dustGeometry.setAttribute('position',new T.BufferAttribute(dustPositions,3));const dust=new T.Points(dustGeometry,new T.PointsMaterial({color:'#edc293',size:.025,transparent:true,opacity:.4,depthWrite:false}));dust.frustumCulled=false;root.add(dust);
 return {root,lanterns,rigs,ribbons,clock,hands,pendulum,dust,dustPositions,upgraded:false,week2Upgraded:false};
}
function upgradeEventFigures(e,pool){const T=THREE;
 if(e.halloween&&!pool.upgraded){const h=e.halloween;for(const old of [h.guest,...h.walkers]){for(const child of old.children)child.visible=false;const rig=createCitizenRig({name:'masked-procession',coat:'#302736',faceless:true,mask:true,cloak:true});old.add(rig.root);pool.rigs.push({rig,type:old===h.guest?'guest':'procession',carrier:old});}pool.upgraded=true;}
 if(e.week2&&!pool.week2Upgraded){const w=e.week2;for(const child of w.mannequin.children)child.visible=false;const mannequin=createCitizenRig({name:'jointed-wooden-mannequin',wood:true,faceless:true});w.mannequin.add(mannequin.root);pool.mannequin=mannequin;
  for(const child of w.parade.children)child.visible=false;for(let i=0;i<3;i++){const rig=createCitizenRig({name:'following-neighbour-'+i,coat:i%2?'#4a3b49':'#282b32',faceless:true,mask:true,cloak:true});rig.root.position.x=(i-1)*.72;w.parade.add(rig.root);pool.rigs.push({rig,type:'following'});}
  // A continuous soft-edged silhouette replaces the rectangular detached shadow.
  for(const child of w.shadow.children)child.visible=false;const c=document.createElement('canvas');c.width=128;c.height=256;const g=c.getContext('2d');g.fillStyle='#090710';g.shadowColor='#090710';g.shadowBlur=7;g.beginPath();g.ellipse(64,34,15,20,0,0,Math.PI*2);g.ellipse(64,103,24,52,0,0,Math.PI*2);g.fill();g.lineWidth=16;g.lineCap='round';for(const side of [-1,1]){g.beginPath();g.moveTo(64+side*17,70);g.lineTo(64+side*36,139);g.moveTo(64+side*12,142);g.lineTo(64+side*20,232);g.stroke();}const tex=new T.CanvasTexture(c),m=new T.MeshBasicMaterial({map:tex,transparent:true,opacity:.62,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});const shadow=eventArtMesh(w.shadow,new T.PlaneGeometry(.9,2.5),m,0,.012,.3);shadow.rotation.x=-Math.PI/2;pool.detachedShadow=shadow;
  const oldFace=w.face,faceRoot=new T.Group();faceRoot.position.copy(oldFace.position);oldFace.parent.add(faceRoot);oldFace.visible=false;w.face=faceRoot;faceRoot.rotation.y=Math.PI;eventArtMask(faceRoot,eventArtMaterials(e),0,0,0,.85);
  const knocker=new T.Group();w.bell.add(knocker);knocker.position.set(0,1.3,.12);eventArtMesh(knocker,new T.TorusGeometry(.09,.014,7,18),eventArtMaterials(e).brass,0,0,0);pool.knocker=knocker;pool.week2Upgraded=true;
 }
 if(e.anomalies&&!pool.watcher){const old=e.anomalies.groups.watcher;for(const c of old.children)c.visible=false;const rig=createCitizenRig({name:'the-waiting-figure',coat:'#24252a',skin:'#b9b6a7',faceless:true,cloak:true});rig.root.scale.set(.88,1.13,.85);old.add(rig.root);pool.watcher=rig;}
}
// Collision checks do not use canWalk: admin flight must not make the procession noclip.
function processionOutdoors(x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z)||x< -45||x>64||z< -89||z>=-.2)return false;
 if(x< -4&&x> -8.8&&z< -5&&z> -10.8)return false;
 if(x>50&&x<62&&z> -38&&z< -28||x>51&&x<61&&z> -60&&z< -50)return false;
 return !cityWorld().some(c=>Math.abs(x-c.x)<5.3&&z>c.z-6.3&&z<c.z+4.5);
}
function processionClear(x,z){
 if(!processionOutdoors(x,z))return false;const floor=supportAt(x,z);if(!Number.isFinite(floor)||floor>.45||floor<-.3)return false;
 return !house.solids.some(b=>Math.abs(x-b.x)<b.w/2+.24&&Math.abs(z-b.z)<b.d/2+.24&&floor<b.y+b.h-.02&&floor+1.78>b.y);
}
function processionSweep(a,b){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.12));for(let i=0;i<=n;i++)if(!processionClear(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true;}
function processionTrailPoint(path,d){if(!path.length||d<path[0].d)return null;if(d>=path.at(-1).d){const p=path.at(-1);return {x:p.x,z:p.z};}let low=1,high=path.length-1;while(low<high){const mid=(low+high)>>1;if(path[mid].d<d)low=mid+1;else high=mid;}const a=path[low-1],b=path[low],t=(d-a.d)/Math.max(.00001,b.d-a.d);return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};}
function processionHeading(entry,target,dt){if(entry.heading===undefined)entry.heading=target;else{const angle=Math.atan2(Math.sin(target-entry.heading),Math.cos(target-entry.heading));entry.heading+=Math.max(-dt*4,Math.min(dt*4,angle));}return entry.heading;}
function processionRoutePoint(station,d){const top=station.z+9,bottom=top-18,corners=[[-43,top],[43,top],[43,bottom],[-43,bottom]],perimeter=208;let distance=((station.x+43+d)%perimeter+perimeter)%perimeter;for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(distance<=length){const t=distance/length;return {x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,yaw:Math.atan2(b[0]-a[0],-(b[1]-a[1]))};}distance-=length;}}
function poseProcessionRig(rig,dt,speed){rig.action.setEffectiveWeight(Math.min(1,speed/.5));rig.action.timeScale=speed>0?speed/1.5:0;rig.mixer.update(dt);rig.head.rotation.z=0;}
function updateProcessionMotion(e,q,dt){
 const first=typeof releaseAccess==='undefined'||releaseAccess==='week1',second=typeof week2Active==='function'&&week2Active(),h=halloweenState();
 if(e.halloween){const pool=e.halloween,station=cityWorld().find(c=>c.id==='station');pool.parade.position.set(0,0,0);pool.parade.rotation.set(0,0,0);pool.parade.visible=first&&pool.parade.visible;
  for(let i=0;i<pool.walkers.length;i++){const carrier=pool.walkers[i],entry=q.rigs.find(r=>r.carrier===carrier);if(!entry)continue;const p=processionRoutePoint(station,Math.max(0,h.elapsed-90)*.85-i*1.2);carrier.visible=!!p&&processionClear(p.x,p.z);if(carrier.visible){carrier.position.set(p.x,supportAt(p.x,p.z),-p.z);carrier.rotation.set(0,processionHeading(entry,p.yaw,dt),0);}poseProcessionRig(entry.rig,dt,pool.parade.visible&&carrier.visible?.85:0);}
 }
 for(const entry of q.rigs.filter(r=>r.type==='guest'))poseProcessionRig(entry.rig,dt,0);
 if(!e.week2)return;const parade=e.week2.parade,w=week2State(),eligible=second&&!!w.mask&&w.worn>=45&&!s.ending&&!s.sanityLost&&(house.jumpHeight||0)<1.5&&processionOutdoors(house.x,house.z);parade.position.set(0,0,0);parade.rotation.set(0,0,0);
 if(!eligible){parade.visible=false;q.followTrail=null;for(const entry of q.rigs.filter(r=>r.type==='following')){entry.rig.root.visible=false;entry.progress=null;poseProcessionRig(entry.rig,dt,0);}return;}
 let trail=q.followTrail,last=trail?.at(-1);if(!trail||last&&Math.hypot(last.x-house.x,last.z-house.z)>2){trail=[];const far={x:house.x-Math.sin(house.a)*6.2,z:house.z-Math.cos(house.a)*6.2},near={x:house.x,z:house.z};if(processionSweep(far,near)){for(let d=0;d<6.2;d+=.2)trail.push({x:far.x+Math.sin(house.a)*d,z:far.z+Math.cos(house.a)*d,d});trail.push({...near,d:6.2});}else trail.push({...near,d:0});q.followTrail=trail;for(const entry of q.rigs.filter(r=>r.type==='following'))entry.progress=null;last=trail.at(-1);}
 const moved=Math.hypot(house.x-last.x,house.z-last.z);if(moved>=.015){if(!processionSweep(last,{x:house.x,z:house.z})){q.followTrail=null;parade.visible=false;return;}trail.push({x:house.x,z:house.z,d:last.d+moved});last=trail.at(-1);}
 while(trail.length>2&&trail[1].d<last.d-20)trail.shift();let visible=0;
 q.rigs.filter(r=>r.type==='following').forEach((entry,i)=>{const desired=last.d-3.2-i*1.15,rig=entry.rig;if(desired<trail[0].d){rig.root.visible=false;return;}const before=entry.progress??desired,next=Math.min(desired,before+dt*2.65),point=processionTrailPoint(trail,next),previous=processionTrailPoint(trail,before);if(!point||!previous||!processionSweep(previous,point)){rig.root.visible=false;return;}entry.progress=next;rig.root.visible=true;visible++;rig.root.position.set(point.x,supportAt(point.x,point.z),-point.z);const ahead=processionTrailPoint(trail,Math.min(last.d,next+.12));if(ahead&&Math.hypot(ahead.x-point.x,ahead.z-point.z)>.001)rig.root.rotation.y=processionHeading(entry,Math.atan2(ahead.x-point.x,-(ahead.z-point.z)),dt);poseProcessionRig(rig,dt,dt>0?Math.max(0,next-before)/dt:0);});
 parade.visible=visible>0;
}

const eventArtPreviousVisuals=updateAnomalyVisuals;updateAnomalyVisuals=function(e){eventArtPreviousVisuals(e);const q=e.eventPerformance||(e.eventPerformance=createEventPerformanceArt(e));upgradeEventFigures(e,q);const active3=typeof week3Active==='function'&&week3Active(),active2=typeof week2WorldActive==='function'&&week2WorldActive(),time=s.worldSeconds||0,motionTime=citizenMotionClock,dt=paused()?0:Math.min(.08,Math.max(0,motionTime-(q.lastTime??motionTime)));q.lastTime=motionTime;
 q.root.visible=!s.ending&&!s.sanityLost;for(const l of q.lanterns){l.root.visible=l.week===1||l.week===2&&active2||l.week===3&&active3;l.flame.scale.y=1.8+Math.sin(time*2.2+l.root.position.x)*.12;l.flame.material.emissiveIntensity=1.8+Math.sin(time*1.7)*.18;}
 q.ribbons.forEach((r,i)=>{r.rotation.z=Math.sin(time*.7+i)*.12;r.rotation.x=Math.sin(time*.5+i)*.08;});q.clock.visible=q.pendulum.visible=active3;q.hands[0].rotation.z=-time*.008;q.hands[1].rotation.z=-time*.09;q.pendulum.rotation.z=Math.sin(time*2.1)*.12;
 updateProcessionMotion(e,q,dt);
 if(q.mannequin){q.mannequin.action.setEffectiveWeight(0);q.mannequin.mixer.update(0);if(q.mannequinIndex!==week2State().mannequin){q.mannequinIndex=week2State().mannequin;q.mannequinYaw=e.week2.mannequin.rotation.y;q.mannequin.head.rotation.y=.13*(q.mannequinIndex-1);}e.week2.mannequin.rotation.y=q.mannequinYaw;q.mannequin.limbs.forEach(l=>{l.elbow.rotation.x=-.12;l.arm.rotation.z=l.side*.035;});}
 if(q.detachedShadow){const sh=week2Runtime.shadow;q.detachedShadow.material.opacity=sh?Math.max(0,.65*(1-sh.time/3)):0;q.detachedShadow.scale.x=1+Math.sin((sh?.time||0)*3)*.025;}
 if(q.knocker)q.knocker.rotation.x=Math.sin((week2Runtime.effect?.time||0)*8)*.15;
 if(q.watcher){q.watcher.head.rotation.z=Math.sin(time*.4)*.045;q.watcher.torso.scale.y=1+Math.sin(time*.8)*.008;}
 // Dust stays local and reuses one buffer; no new meshes appear during animation.
 q.dust.visible=active2&&house.x>50||active3&&house.x>70;if(q.dust.visible){for(let i=0;i<64;i++){q.dustPositions[i*3]=house.x+Math.sin(i*17.3)*3.5;q.dustPositions[i*3+1]=(house.jumpHeight||0)+.2+((i*.071+time*.035)%2.6);q.dustPositions[i*3+2]=-house.z+Math.cos(i*13.1)*3.5;}q.dust.geometry.attributes.position.needsUpdate=true;}
};
