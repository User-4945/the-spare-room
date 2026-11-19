/* Static winter dressing: rebuilt only when the generated world changes. */
(function(){
 if(!window.SPARE_ROOM_CHRISTMAS?.enabled)return;
 let version=-1,scene=null,group=null;
 const parent=renderAdvanced;
 renderAdvanced=function(){parent.apply(this,arguments);const e=advancedEngine;if(!e||e.failed)return;
  if(scene!==e.scene||version!==e.version){
   if(group){group.traverse(x=>{x.geometry?.dispose();x.material?.dispose();});group.parent?.remove(group);}
   scene=e.scene;version=e.version;const T=THREE;group=new T.Group();group.name='ChristmasSnowScenery';scene.add(group);
   e.world.updateMatrixWorld(true);let caps=0;
   const ray=new T.Raycaster(),up=new T.Vector3(0,1,0),snow=new T.MeshStandardMaterial({color:0xc5d2ce,roughness:1});
   for(const m of e.world.children){if(caps>=140)break;if(!m.isMesh||m.geometry?.type!=='BoxGeometry')continue;
    const box=new T.Box3().setFromObject(m),size=new T.Vector3();box.getSize(size);if(box.max.y<0||size.y>.65||size.x*size.z<3)continue;
    const p=new T.Vector3();box.getCenter(p);p.y=box.max.y+.015;ray.set(p,up);ray.far=30;
    if(ray.intersectObjects(e.world.children,false).length)continue;
    const cap=new T.Mesh(new T.BoxGeometry(size.x,.04,size.z),snow.clone());cap.position.copy(p);cap.position.y+=.025;cap.receiveShadow=true;group.add(cap);caps++;
   }
   snow.dispose();
   const pine=new T.MeshStandardMaterial({color:0x254834,roughness:1}),amber=new T.MeshStandardMaterial({color:0xc9a66a,emissive:0x805521,emissiveIntensity:.7});
   for(const [x,z]of [[-5,-12],[5,-12],[-10,0],[10,0]]){
    for(let j=0;j<3;j++){const tree=new T.Mesh(new T.ConeGeometry(1.1-j*.24,1.7,7),pine.clone());tree.position.set(x,1+j*.8,z);group.add(tree);}
    const star=new T.Mesh(new T.OctahedronGeometry(.17),amber.clone());star.position.set(x,3.55,z);group.add(star);
    for(let j=0;j<4;j++){const bulb=new T.Mesh(new T.SphereGeometry(.035,4,3),amber.clone());bulb.position.set(x+Math.cos(j*1.6)*.65,1.3+(j%2)*.6,z+Math.sin(j*1.6)*.65);group.add(bulb);}
   }
   pine.dispose();amber.dispose();group.userData.snowSurfaces=caps;
  }
  group.visible=(house.jumpHeight||0)>-1;
 };
})();
