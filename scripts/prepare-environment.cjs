const fs=require('node:fs');
let admin=fs.readFileSync('developer-game/admin-panel.js','utf8');
if(!admin.includes("group('Weather and fog'")){
 admin=admin.replace(" const cheats=group('Session tools'",` const environment=group('Weather and fog',controls),weatherChoice=select('Weather',environment);
 for(const name of ['Auto','Clear','Rain','Storm','Mist','Wind','Snow','Snowstorm'])option(weatherChoice,name,name);
 button('Apply weather',()=>run('weather',{value:weatherChoice.value}),environment);
 const fogValue=number('Fog density %',0,80,42,environment);
 button('Apply fog',()=>run('fog',{value:Number(fogValue.value)/100}),environment);
 button('Restore automatic environment',()=>run('environmentReset'),environment);
 el('small','','Environment overrides apply to this session and clear when admin locks. Use Day and time above to set or freeze daylight.',environment);
 const cheats=group('Session tools'`);
 admin=admin.replace("  if(action==='start'){",`  if(action==='weather'||action==='fog'||action==='environmentReset'){
   const env=window.SpareRoomEnvironment;if(!env)return reply(false,'Environment controls are unavailable.');
   const ok=action==='weather'?env.setWeather(data.value):action==='fog'?env.setFog(data.value):env.reset();
   if(ok)changed();return reply(ok,ok?'Environment updated for this session.':'Invalid environment setting.');
  }
  if(action==='start'){`);
 admin=admin.replace('function clearToggles(){','function clearToggles(){window.SpareRoomEnvironment?.clear();');
}
for(const dir of ['developer-game','dist']){
 fs.writeFileSync(dir+'/admin-panel.js',admin);
 fs.copyFileSync('developer-game/environment.js',dir+'/environment.js');
 let html=fs.readFileSync(dir+'/index.html','utf8');
 if(!html.includes('src="environment.js"'))html=html.replace('<script src="admin-panel.js"></script>','<script src="admin-panel.js"></script><script src="environment.js"></script>');
 fs.writeFileSync(dir+'/index.html',html);
}
let service=fs.readFileSync('server/admin-service.mjs','utf8');
if(!service.includes("'environmentReset'"))service=service.replace("'day','time','midnight'","'day','time','midnight','weather','fog','environmentReset'");
fs.writeFileSync('server/admin-service.mjs',service);
let prep=fs.readFileSync('scripts/prepare-christmas.cjs','utf8');
if(!prep.includes("'christmas-scenery.js'"))prep=prep.replace("'christmas-gameplay.js'","'christmas-gameplay.js','christmas-scenery.js'");
fs.writeFileSync('scripts/prepare-christmas.cjs',prep);
let build=fs.readFileSync('scripts/build-christmas-preview.cjs','utf8');
if(!build.includes("'christmas-scenery.js'"))build=build.replace("'christmas-gameplay.js'","'christmas-gameplay.js','christmas-scenery.js'");
fs.writeFileSync('scripts/build-christmas-preview.cjs',build);
console.log('Prepared original environment controls and seasonal snow scenery');
