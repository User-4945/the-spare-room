/* Session-only environment overrides. Admin session is required for mutations. */
(function(){
 const profiles={Clear:{fog:0,light:1},Rain:{fog:.35,light:.84},Storm:{fog:.6,light:.65},Mist:{fog:.75,light:.8},Wind:{fog:.18,light:.92},Snow:{fog:.4,light:.93},Snowstorm:{fog:.65,light:.75}};
 let state={weather:'Auto',fog:null},engine=null,points=null,positions=null,clock=0;
 const permitted=()=>window.spareAdmin?.isAuthenticated()===true;
 function reset(){state={weather:'Auto',fog:null};return true;}
 function setWeather(value){if(!permitted()||(value!=='Auto'&&!Object.hasOwn(profiles,value)))return false;state.weather=value;return true;}
 function setFog(value){if(!permitted()||!Number.isFinite(value)||value<0||value>.8)return false;state.fog=value;return true;}
 function attach(e){if(engine===e)return;engine=e;const T=THREE;positions=new Float32Array(180*3);for(let i=0;i<180;i++){positions[i*3]=Math.random()*18-9;positions[i*3+1]=Math.random()*10;positions[i*3+2]=Math.random()*18-9;}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));points=new T.Points(geometry,new T.PointsMaterial({color:0xd2dfde,size:.045,transparent:true,opacity:.6,depthWrite:false}));points.name='AdminWeatherVolume';points.frustumCulled=false;e.scene.add(points);
  let previousFog=null;const render=e.renderer.render.bind(e.renderer);e.renderer.render=function(scene,camera){const weather=state.weather,profile=profiles[weather];
   if(scene.fog&&!profile&&state.fog===null&&previousFog){scene.fog.near=previousFog.near;scene.fog.far=previousFog.far;previousFog=null;}
   if(scene.fog&&(profile||state.fog!==null)&&!previousFog)previousFog={near:scene.fog.near,far:scene.fog.far};
   if(scene.fog&&(profile||state.fog!==null)){const d=state.fog??profile.fog;scene.fog.near=5+(1-d)*35;scene.fog.far=25+(1-d)*110;}
   if(profile&&e.hemi)e.hemi.intensity=(.36+worldDaylight()*.55)*profile.light;
   points.visible=!!profile&&['Rain','Storm','Snow','Snowstorm'].includes(weather)&&['city','garden'].includes(houseRoom())&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
   const snowy=weather==='Snow'||weather==='Snowstorm';points.material.size=snowy?.045:.025;points.position.set(house.x,0,-house.z);render(scene,camera);
  };
 }
 const movement=updateMovement;updateMovement=function(dt){movement(dt);if(!permitted())reset();clock+=Math.min(.1,Math.max(0,dt));if(positions){const snow=state.weather.startsWith('Snow');for(let i=0;i<180;i++){positions[i*3+1]-=Math.min(.1,Math.max(0,dt))*(snow?1:12);if(positions[i*3+1]<0)positions[i*3+1]=10;}points.geometry.attributes.position.needsUpdate=true;}};
 const render=renderAdvanced;renderAdvanced=function(){if(advancedEngine&&!advancedEngine.failed)attach(advancedEngine);return render.apply(this,arguments);};
 window.SpareRoomEnvironment=Object.freeze({setWeather,setFog,reset:()=>permitted()&&reset(),clear:reset,status:()=>({...state})});
})();
