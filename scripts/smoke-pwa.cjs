const {app,BrowserWindow}=require('electron'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve('pwa-build');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'spare-offline-test-')));
const backend=process.env.SPARE_ROOM_TEST_ANGLE||(process.platform==='darwin'?'default':'swiftshader');
if(!['default','metal','gl','swiftshader'].includes(backend))throw Error('Unknown test graphics backend');
if(backend!=='default')app.commandLine.appendSwitch('use-angle',backend);
if(backend==='swiftshader')app.commandLine.appendSwitch('enable-unsafe-swiftshader');
const timer=setTimeout(()=>{console.error('Offline app verification timed out');app.exit(1)},90000);
app.whenReady().then(async()=>{
 let server,stage='starting local server';
 try{
  server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file===root)file=path.join(root,'index.html');if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const win=new BrowserWindow({width:430,height:860,show:false,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
  async function evaluate(code){
   // Serialize page errors explicitly: Electron can otherwise replace them
   // with an unhelpful cross-context "Script failed to execute" message.
   const result=await win.webContents.executeJavaScript('(async()=>{try{return {ok:true,value:await ('+code+')}}catch(error){return {ok:false,error:String(error)}}})()');
   if(!result.ok)throw Error(result.error);return result.value;
  }
  stage='loading online game';
  await win.loadURL('http://127.0.0.1:'+server.address().port+'/');
  stage='waiting for the offline worker to control this page';
  // serviceWorker.ready can resolve before clients.claim() controls the first
  // page. Wait for both events before deliberately shutting down the server.
  await evaluate(`(async()=>{for(let i=0;i<600;i++){if(navigator.serviceWorker.controller&&document.getElementById('offline-status')?.textContent==='Ready to play offline')return;await new Promise(r=>setTimeout(r,50))}throw Error('Offline cache or page controller never became ready')})()`);
  stage='checking online game';
  const info=await evaluate(`(()=>{if(!navigator.serviceWorker.controller)throw Error('No active worker');if(!advancedEngine||advancedEngine.failed)throw Error('Renderer failed');localStorage.setItem('offline-smoke','retained');return window.spareInstallInfo})()`);
  server.closeAllConnections();await new Promise(r=>server.close(r));server=null;
  stage='reloading with the server stopped';
  const loaded=new Promise((resolve,reject)=>{win.webContents.once('did-finish-load',resolve);win.webContents.once('did-fail-load',(_e,code,message)=>reject(Error(code+': '+message)))});
  win.reload();await loaded;
  const verified=await evaluate(`(()=>{if(localStorage.getItem('offline-smoke')!=='retained')throw Error('Offline save missing');if(typeof THREE==='undefined'||!advancedEngine||advancedEngine.failed)throw Error('Offline game failed');if(!document.getElementById('install-game'))throw Error('Install interface missing');return {version:window.spareInstallInfo.version,offline:true,save:true}})()`);
  if(info.version!==verified.version)throw Error('Mixed offline version');console.log('PASS: real offline reload with server stopped, retained save and complete 3D game '+JSON.stringify(verified));clearTimeout(timer);app.exit(0);
 }catch(e){console.error('Offline verification failed while '+stage+':',e);server?.close();clearTimeout(timer);app.exit(1)}
});
