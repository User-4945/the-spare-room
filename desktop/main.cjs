const {app,BrowserWindow,Menu,session,dialog}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
const {fileURLToPath}=require('node:url');
const smoke=process.argv.includes('--smoke-test');
const verifySave=process.argv.includes('--smoke-verify-save');
const gameRoot=path.join(__dirname,'game');
let win;
app.setName('The Spare Room');
app.setAppUserModelId('io.github.user4945.thespareroom');
const profile=smoke&&process.env.SPARE_ROOM_SMOKE_PROFILE?process.env.SPARE_ROOM_SMOKE_PROFILE:path.join(app.getPath('appData'),'The Spare Room');
fs.mkdirSync(profile,{recursive:true});app.setPath('userData',profile);
app.commandLine.appendSwitch('disable-background-networking');
if(smoke){app.commandLine.appendSwitch('use-angle','swiftshader');app.commandLine.appendSwitch('enable-unsafe-swiftshader')}
function localGameURL(url){try{let u=new URL(url);if(u.protocol!=='file:')return false;let relative=path.relative(gameRoot,fileURLToPath(u));return relative!==''&&!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)}catch{return false}}
function report(result,code){if(process.env.SPARE_ROOM_SMOKE_REPORT)fs.writeFileSync(process.env.SPARE_ROOM_SMOKE_REPORT,JSON.stringify(result,null,2));console.log(JSON.stringify(result));app.exit(code)}
async function checkDesktop(){try{let result=await win.webContents.executeJavaScript(`(async()=>{
if(typeof THREE==='undefined'||!advancedEngine||advancedEngine.failed)throw Error('3D engine did not start');
if(cityWorld().length!==20||advancedEngine.actors.length!==6)throw Error('World content missing');
if(!Array.from(document.scripts).filter(s=>s.src).every(s=>s.src.startsWith('file:')))throw Error('Remote script dependency');
renderAdvanced();if(advancedEngine.failed)throw Error('World failed to render');
let persisted=localStorage.getItem('desktop-smoke-save');
if(${verifySave}&&persisted!=='v1.5.1')throw Error('Save did not survive restart');
localStorage.setItem('desktop-smoke-save','v1.5.1');
let networkBlocked=false;try{await fetch('https://example.com/')}catch{networkBlocked=true}
if(!networkBlocked)throw Error('Network requests are not blocked');
return{ok:true,version:'1.5.1',locations:cityWorld().length,renderer:'Three.js '+THREE.REVISION,networkBlocked,saveVerified:${verifySave}};
})()`);await session.defaultSession.flushStorageData();report(result,0)}catch(error){report({ok:false,error:String(error)},1)}}
app.whenReady().then(async()=>{
const ses=session.defaultSession;
ses.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*','ws://*/*','wss://*/*']},(_details,callback)=>callback({cancel:true}));
ses.setPermissionRequestHandler((contents,permission,callback)=>callback(localGameURL(contents.getURL())&&['pointerLock','fullscreen'].includes(permission)));
ses.setPermissionCheckHandler((contents,permission)=>!!contents&&localGameURL(contents.getURL())&&['pointerLock','fullscreen'].includes(permission));
ses.on('will-download',event=>event.preventDefault());
win=new BrowserWindow({width:1440,height:960,minWidth:960,minHeight:700,show:!smoke,backgroundColor:'#152019',title:'The Spare Room v1.5.1',icon:path.join(__dirname,'icon.ico'),webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,spellcheck:false}});
win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
win.webContents.on('will-navigate',(event,url)=>{if(!localGameURL(url))event.preventDefault()});
win.webContents.on('will-attach-webview',event=>event.preventDefault());
Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'Game',submenu:[{label:'Fullscreen',accelerator:'F11',click:()=>win.setFullScreen(!win.isFullScreen())},{type:'separator'},{label:'Quit',accelerator:'Ctrl+Q',click:()=>app.quit()}]}]));
if(smoke){let timer=setTimeout(()=>report({ok:false,error:'Desktop smoke test timed out'},1),60000);timer.unref()}
try{await win.loadFile(path.join(gameRoot,'index.html'));if(smoke)await checkDesktop()}catch(error){if(smoke)report({ok:false,error:String(error)},1);else dialog.showErrorBox('The Spare Room could not start',String(error))}
});
app.on('window-all-closed',()=>app.quit());
