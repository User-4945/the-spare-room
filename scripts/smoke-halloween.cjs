// GPU integration test in an isolated Electron profile. No release publishing.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'spare-halloween-graphics-')));
app.commandLine.appendSwitch('use-angle','swiftshader');
app.commandLine.appendSwitch('enable-unsafe-swiftshader');
const out=path.resolve('halloween-checks');fs.mkdirSync(out,{recursive:true});
const timeout=setTimeout(()=>{console.error('Halloween graphics check timed out');app.exit(1)},120000);
app.whenReady().then(async()=>{
 try{
  const win=new BrowserWindow({width:1360,height:960,show:true,webPreferences:{sandbox:true,nodeIntegration:false,contextIsolation:true}});
  const errors=[];win.webContents.on('console-message',(_event,level,message)=>{if(level>=3)errors.push(message)});
  const evaluate=async code=>{const r=await win.webContents.executeJavaScript('(async()=>{try{return {ok:true,value:await('+code+')}}catch(e){return {ok:false,error:String(e),stack:e.stack}}})()');if(!r.ok)throw Error(r.error+'\n'+r.stack);return r.value;};
  await win.loadFile(path.resolve('halloween-build/index.html'));
  await evaluate(`(()=>{if(!advancedEngine||advancedEngine.failed)throw Error('WebGL engine failed');renderAdvanced();if(!advancedEngine.halloween)throw Error('Event props missing');})()`);
  async function snapshot(name){await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');const frame=await win.webContents.capturePage();if(frame.isEmpty())throw Error('Empty screenshot');fs.writeFileSync(path.join(out,name+'.png'),frame.toPNG());}
  await snapshot('01-title');
  await evaluate(`(()=>{reset();s.started=true;s.difficulty='easy';halloweenReadInvitation();close();s.worldSeed=317;house.citySeed=null;halloweenTravel('cinema');house.pitch=-.12;renderAdvanced();})()`);
  await snapshot('02-cinema-lantern');
  await evaluate(`(()=>{halloweenReadNote('cinema');close();halloweenLightSeal('cinema');const b=[...document.querySelectorAll('#modal button')].find(b=>b.textContent==='Light the seal');if(!b)throw Error('Missing seal action');b.click();close();renderAdvanced();if(advancedEngine.halloween.seals.find(s=>s.id==='cinema').light.intensity<=0)throw Error('Lantern stayed dark');})()`);
  await snapshot('03-lit-lantern');
  await evaluate(`(()=>{halloweenTravel('guest');renderAdvanced();})()`);
  await snapshot('04-tall-guest');
  await evaluate(`(()=>{const h=halloweenState();h.elapsed=91;h.midnight=true;const c=cityWorld().find(c=>c.id==='station');house.x=c.x;house.z=c.z+9;house.a=Math.PI;house.pitch=0;s.room='city';renderAdvanced();if(!advancedEngine.halloween.parade.visible)throw Error('Procession invisible');})()`);
  await snapshot('05-procession');
  await evaluate(`(()=>{halloweenPromise();close();const h=halloweenState();h.seals=halloweenSeals.map(n=>n.id);halloweenTravel('bell');halloweenBell();const b=[...document.querySelectorAll('#modal button')].find(b=>b.textContent.startsWith('Ring once'));if(!b)throw Error('Ending action missing');b.click();[...document.querySelectorAll('#modal button')].find(b=>b.textContent==='Choose this ending').click();if(!s.ending?.title.includes('Leave the porch light on'))throw Error('Ending did not finish');})()`);
  await snapshot('06-ending');
  // Mobile title layout must fit and remain scrollable at a narrow viewport.
  win.setSize(430,860);
  await evaluate(`(()=>{titleScreen();})()`);
  await snapshot('07-mobile-title');
  const metrics=await evaluate(`(()=>{const r=document.getElementById('modal').getBoundingClientRect();if(r.left<0||r.right>innerWidth+1)throw Error('Mobile title overflows');if(advancedEngine.failed)throw Error('Renderer failed later');return {drawCalls:advancedEngine.renderer.info.render.calls,triangles:advancedEngine.renderer.info.render.triangles,geometry:advancedEngine.renderer.info.memory.geometries,textures:advancedEngine.renderer.info.memory.textures};})()`);
  if(errors.length)throw Error('Renderer console errors: '+errors.join('\n'));
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({ok:true,metrics},null,2));
  console.log('PASS: real WebGL scene, lit lantern interaction, tall guest, procession, completed ending and mobile title '+JSON.stringify(metrics));
  clearTimeout(timeout);app.exit(0);
 }catch(e){console.error(e);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({ok:false,error:String(e)},null,2));clearTimeout(timeout);app.exit(1)}
});
