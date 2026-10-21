const {app,BrowserWindow,Menu,session,dialog,ipcMain,safeStorage,net,shell}=require('electron');
const {setupUpdates}=require('./updates-controller.cjs');
const path=require('node:path');
const fs=require('node:fs');
const {fileURLToPath}=require('node:url');
const version=app.getVersion();
const smokeUpgrade=process.argv.includes('--smoke-upgrade');
const smoke=process.argv.includes('--smoke-test')||smokeUpgrade;
const verifySave=process.argv.includes('--smoke-verify-save');
const verifyUpgrade=process.argv.includes('--smoke-verify-upgrade');
const gameRoot=path.join(__dirname,'game');
let win,updates,smokeStage='loading game';
app.setName('The Spare Room');
app.setAppUserModelId('io.github.user4945.thespareroom');
const profile=smoke&&process.env.SPARE_ROOM_SMOKE_PROFILE?process.env.SPARE_ROOM_SMOKE_PROFILE:path.join(app.getPath('appData'),'The Spare Room');
fs.mkdirSync(profile,{recursive:true});app.setPath('userData',profile);
if(!smoke&&!app.requestSingleInstanceLock()){app.quit();return;}
app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus()}});
app.commandLine.appendSwitch('disable-background-networking');
if(smoke){app.commandLine.appendSwitch('use-angle','swiftshader');app.commandLine.appendSwitch('enable-unsafe-swiftshader')}
function localGameURL(url){try{let u=new URL(url);if(u.protocol!=='file:')return false;let relative=path.relative(gameRoot,fileURLToPath(u));return relative!==''&&!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)}catch{return false}}
function report(result,code){if(process.env.SPARE_ROOM_SMOKE_REPORT)fs.writeFileSync(process.env.SPARE_ROOM_SMOKE_REPORT,JSON.stringify(result,null,2));console.log(JSON.stringify(result));app.exit(code)}
async function checkDesktop(){try{smokeStage='checking installed renderer, signs and encounters';let result=await win.webContents.executeJavaScript(`(async()=>{
if(typeof THREE==='undefined'||!advancedEngine||advancedEngine.failed)throw Error('3D engine did not start');
if(cityWorld().length!==20||advancedEngine.actors.length!==6)throw Error('World content missing');
if(typeof anomalyDefinitions!=='undefined'||document.querySelector('.anomaly-caption'))throw Error('Prerelease anomalies leaked into the stable build');
if(!Array.from(document.scripts).filter(s=>s.src).every(s=>s.src.startsWith('file:')))throw Error('Remote script dependency');
renderAdvanced();if(advancedEngine.failed)throw Error('World failed to render');
let signs=[];advancedEngine.world.traverse(m=>{if(m.userData.sign)signs.push(m)});
for(let mesh of signs){let q=mesh.userData.sign,g=mesh.material.map.image.getContext('2d');g.font=q.layout.font;
 if(Math.abs(q.width/q.height-q.worldWidth/q.worldHeight)/(q.worldWidth/q.worldHeight)>.02)throw Error('Stretched sign texture');
 if(q.lines.some(line=>g.measureText(line).width>q.layout.maxWidth+.1))throw Error('Sign text clipped with installed fonts');
}
// Build one shared fixture, then render each effect. Rebuilding every room for
// every case needlessly repeats shadow passes on the CI software renderer.
reset();close();s.started=true;s.difficulty='intermediate';s.cityOpen=true;buildHouse();
function prepareEncounter(){anomalyRuntime.active=null;s.sanity=100;s.sanityLost=false;s.ending=null;house.x=0;house.z=3;house.a=0;house.pitch=0;house.jumpHeight=0;house.jumpVelocity=0;}
const encounters=typeof anomalyDefinitions==='undefined'?[]:['watcher','footprints','toy','door','brownout','knocks','mirror','stare'];
for(let id of encounters){
 prepareEncounter();
 if(id==='mirror'){flags().mirror=true;house.x=4.2;house.z=5;house.a=Math.PI;buildHouse();}
 if(id==='stare'){let p=residents()[0];house.x=p.x;house.z=p.z+3;house.a=Math.PI;}
 if(!startAnomaly(id))throw Error('Cannot start installed encounter: '+id);
 advanceAnomalies(.1);renderAdvanced();
 if(advancedEngine.failed||!advancedEngine.anomalies.groups[id].visible)throw Error('Encounter did not render: '+id);
}
if(encounters.length){anomalyRuntime.active=null;s=fresh();save();updateAnomalyVisuals(advancedEngine);}
let persisted=localStorage.getItem('desktop-smoke-save');
if(${verifySave}&&persisted!==${JSON.stringify(version)})throw Error('Save did not survive restart');
localStorage.setItem('desktop-smoke-save',${JSON.stringify(version)});
if(${verifyUpgrade}&&localStorage.getItem('desktop-upgrade-save')!=='retained')throw Error('Update lost saved progress');
let networkBlocked=false;try{await fetch('https://example.com/')}catch{networkBlocked=true}
if(!networkBlocked)throw Error('Network requests are not blocked');
if(!window.spareUpdates||!Array.from(toolbar.children).some(b=>b.textContent==='UPDATES'))throw Error('Desktop update controls missing');
return{ok:true,version:${JSON.stringify(version)},locations:cityWorld().length,renderer:'Three.js '+THREE.REVISION,signsChecked:signs.length,encountersRendered:encounters.length,updateControls:true,networkBlocked,saveVerified:${verifySave},upgradeSaveVerified:${verifyUpgrade}};
})()`);await updates.open(false);let panel=updates.getWindow();result.updatePanel=await panel.webContents.executeJavaScript("!!(window.spareUpdates&&document.getElementById('check')&&document.getElementById('install')&&document.getElementById('notes'))");if(!result.updatePanel)throw Error('Update window failed to load');panel.close();await session.defaultSession.flushStorageData();report(result,0)}catch(error){report({ok:false,error:String(error)},1)}}
function upgradeFixture(){
 const {createHash}=require('node:crypto'),{API}=require('./updater-core.cjs'),file=process.env.SPARE_ROOM_SMOKE_INSTALLER,target=process.env.SPARE_ROOM_SMOKE_TARGET_VERSION;
 if(!smokeUpgrade||!file||!/^\d+\.\d+\.\d+$/.test(target||''))throw Error('Invalid upgrade test fixture');
 const size=fs.statSync(file).size,digest=createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 return {json:async url=>{if(url!==API+'/releases/latest')throw Error('Unexpected update endpoint');return {id:991,tag_name:'v'+target,name:'Test stable '+target,prerelease:false,draft:false,body:'Upgrade integration test: release notes after automatic restart.',assets:[{id:992,name:'The-Spare-Room-Setup-'+target+'-x64.exe',state:'uploaded',size,digest:'sha256:'+digest}]}},download:async(url,dest,expected,progress)=>{if(url!==API+'/releases/assets/992'||expected!==size)throw Error('Unexpected installer');fs.copyFileSync(file,dest);progress(100)}};
}
app.whenReady().then(async()=>{
const ses=session.defaultSession;
ses.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*','ws://*/*','wss://*/*']},(_details,callback)=>callback({cancel:true}));
ses.setPermissionRequestHandler((contents,permission,callback)=>callback(localGameURL(contents.getURL())&&['pointerLock','fullscreen'].includes(permission)));
ses.setPermissionCheckHandler((contents,permission)=>!!contents&&localGameURL(contents.getURL())&&['pointerLock','fullscreen'].includes(permission));
ses.on('will-download',event=>event.preventDefault());
win=new BrowserWindow({width:smoke?960:1440,height:smoke?700:960,minWidth:960,minHeight:700,show:!smoke,backgroundColor:'#152019',title:'The Spare Room v'+version,icon:path.join(__dirname,'icon.ico'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,spellcheck:false}});
win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
win.webContents.on('will-navigate',(event,url)=>{if(!localGameURL(url))event.preventDefault()});
win.webContents.on('will-attach-webview',event=>event.preventDefault());
updates=setupUpdates({app,BrowserWindow,ipcMain,safeStorage,net,shell,win,profile,version,smoke,transport:smokeUpgrade?upgradeFixture():undefined});
Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'Game',submenu:[{label:'Fullscreen',accelerator:'F11',click:()=>win.setFullScreen(!win.isFullScreen())},{label:'Check for updates…',click:()=>updates.open(true)},{type:'separator'},{label:'Quit',accelerator:'Ctrl+Q',click:()=>app.quit()}]}]));
if(smoke){let timer=setTimeout(()=>report({ok:false,error:'Desktop smoke test timed out',stage:smokeStage},1),150000);timer.unref()}
try{await win.loadFile(path.join(gameRoot,'index.html'));if(smokeUpgrade){await win.webContents.executeJavaScript("localStorage.setItem('desktop-upgrade-save','retained')");await updates.service.check(true);if(updates.state().phase!=='available')throw Error('Stable update not offered');await updates.service.install();if(updates.state().phase!=='installing')throw Error('Upgrade could not start');}else if(smoke)await checkDesktop();else await updates.start()}catch(error){if(smoke)report({ok:false,error:String(error)},1);else dialog.showErrorBox('The Spare Room could not start',String(error))}
});
app.on('window-all-closed',()=>app.quit());
