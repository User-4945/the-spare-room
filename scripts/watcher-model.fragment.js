 const watcher=groups.watcher;watcher.scale.set(1.32,1.38,1.32);
 const hood=plainMaterial('#090e0c'),eyeGlow=new T.MeshStandardMaterial({color:'#b8ba9c',emissive:'#535a43',emissiveIntensity:.24,roughness:1});
 part(watcher,new T.CapsuleGeometry(.145,1.12,4,8),dark,0,1.05,0);
 part(watcher,new T.SphereGeometry(.165,12,10),hood,0,1.95,0);
 part(watcher,new T.SphereGeometry(.097,10,8),skin,0,1.91,.115);
 for(let side of [-1,1]){
  part(watcher,new T.CapsuleGeometry(.038,1.14,3,6),dark,side*.22,.98,0);
  part(watcher,new T.CapsuleGeometry(.055,.7,3,6),dark,side*.085,.4,0);
  part(watcher,new T.SphereGeometry(.011,6,6),eyeGlow,side*.035,1.94,.201);
  for(let finger=0;finger<4;finger++)part(watcher,new T.CapsuleGeometry(.009,.15,2,4),skin,side*(.205+finger*.014),.285-finger*.012,.02);
 }
 watcher.userData.horrorProfile='tall-hooded-slow-gaze';