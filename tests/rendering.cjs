const {context,vm}=require('./game-smoke.cjs');
vm.runInContext(`{
 const e=advancedEngine,check=(v,m)=>{if(!v)throw Error(m)};close();s.started=true;s.ending=null;s.sanityLost=false;renderAdvanced();
 const fog=e.scene.fog,start={...e.renderStats},resize=e.renderer.setSize,projection=e.camera.updateProjectionMatrix;let resizes=0,projections=0;
 e.renderer.setSize=function(...a){resizes++;return resize.apply(this,a)};e.camera.updateProjectionMatrix=function(...a){projections++;return projection.apply(this,a)};
 for(let i=0;i<30;i++)renderAdvanced();
 check(!e.failed,'Renderer failed');check(resizes===0&&projections===0,'Unchanged frames resize the canvas/projection');check(e.scene.fog===fog,'Per-frame fog allocation');check(e.renderStats.lightPlacements===start.lightPlacements,'Stationary lights sorted again');check(e.viewport.width*e.viewport.height*e.viewport.ratio*e.viewport.ratio<=2800001,'Unbounded resolution');
 e.renderer.setSize=resize;e.camera.updateProjectionMatrix=projection;const placements=e.renderStats.lightPlacements;house.x+=2;renderAdvanced();check(e.renderStats.lightPlacements===placements+1,'Moving failed to update lights');
 check(e.renderer.shadowMap.autoUpdate===false&&e.sun.shadow.normalBias<.035,'Shadow quality/passes not configured');console.log('PASS: cached canvas/projection, stable fog, bounded drawing resolution, movement-aware lights and one shadow update per frame');
}`,context);
