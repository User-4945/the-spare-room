const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {UpdateService,createTransport,readJSON}=require('./updater-core.cjs');
function setupUpdates({app,BrowserWindow,ipcMain,safeStorage,net,shell,win,profile,version,smoke=false,transport,runInstaller}){
 const info=readJSON(path.join(__dirname,'release-info.json')),tokenFile=path.join(profile,'github-access.bin');let token='',window=null,pauseOwned=false,opening=null;
 try{if(safeStorage.isEncryptionAvailable()&&fs.existsSync(tokenFile))token=safeStorage.decryptString(fs.readFileSync(tokenFile))}catch{}
 const service=new UpdateService({profile,version,platform:process.platform,prerelease:!!info.prerelease,notes:info.notes,transport:transport||createTransport(()=>token),isOnline:()=>smoke?true:net.isOnline(),prepareInstall:async()=>{if(!win.isDestroyed())await win.webContents.executeJavaScript("if(typeof save==='function')save();");await win.webContents.session.flushStorageData();},runInstaller:runInstaller||((file,args)=>new Promise((resolve,reject)=>{const child=spawn(file,[...args,'/D='+path.dirname(app.getPath('exe'))],{detached:true,stdio:'ignore',windowsHide:true});child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();app.quit()})}))});
 const state=()=>({...service.state(),hasToken:!!token});
 function open(check=false){if(opening)return opening;opening=openWindow(check).finally(()=>opening=null);return opening}
 async function openWindow(check=false){
  if(window&&!window.isDestroyed()){window.show();window.focus();if(check)void service.check(true);return state()}
  pauseOwned=await win.webContents.executeJavaScript("(()=>{if(typeof house!=='undefined')house.keys={};if(document.pointerLockElement)document.exitPointerLock();if(typeof paused==='function'&&!paused()){window.__spareUpdatesPause=true;modal('Game paused','Settings are open.',[['Resume',()=>{window.__spareUpdatesPause=false;close()}]]);return true}return false})()");
  window=new BrowserWindow({parent:win,modal:true,width:720,height:780,minWidth:520,minHeight:540,show:false,title:'The Spare Room · Settings',backgroundColor:'#111914',webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,spellcheck:false}});
  window.setMenu(null);window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',event=>event.preventDefault());
  window.on('close',()=>service.acknowledgeNotes());window.on('closed',()=>{window=null;if(pauseOwned&&!win.isDestroyed())void win.webContents.executeJavaScript("if(window.__spareUpdatesPause){window.__spareUpdatesPause=false;close()}").catch(()=>{});pauseOwned=false});
  await window.loadFile(path.join(__dirname,'updates.html'));service.notesPresented();window.show();window.webContents.send('updates:status',state());if(check)void service.check(true);return state();
 }
 service.on('status',()=>{if(window&&!window.isDestroyed())window.webContents.send('updates:status',state());if(service.status.phase==='available'&&!smoke)void open().catch(()=>{});});
 function handle(channel,fn,settingsOnly=false){ipcMain.handle(channel,async(event,...args)=>{if(event.senderFrame!==event.sender.mainFrame||!(event.sender===win.webContents||window&&event.sender===window.webContents)||settingsOnly&&event.sender!==window?.webContents)throw Error('Untrusted update request');return fn(...args)})}
 handle('updates:open',()=>open(false));handle('updates:state',state);handle('updates:check',async()=>{await service.check(true);return state()});handle('updates:install',async()=>{await service.install();return state()});
 handle('updates:preferences',async value=>{await service.savePreferences(value);return state()},true);
 handle('updates:latest',async()=>{await shell.openExternal(service.state().latestPage);return state()});handle('updates:close',()=>{if(window)window.close();return null});
 handle('updates:token',async value=>{if(typeof value!=='string'||!/^[a-zA-Z0-9_]{20,255}$/.test(value.trim()))return {...state(),message:'Enter a valid GitHub access token.'};if(!safeStorage.isEncryptionAvailable())return {...state(),message:'Windows credential protection is unavailable. Use Open latest release instead.'};token=value.trim();fs.writeFileSync(tokenFile,safeStorage.encryptString(token),{mode:0o600});await service.check(true);return state()},true);
 handle('updates:clear-token',()=>{token='';fs.rmSync(tokenFile,{force:true});return state()},true);
 const timer=smoke?null:setInterval(()=>{void service.check(false)},60000);timer?.unref();
 async function start(){if(service.saved.releaseNotes)await open();else if(!smoke)await service.check(false)}
 return {service,state,open,start,getWindow:()=>window};
}
module.exports={setupUpdates};
