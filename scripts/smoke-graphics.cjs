// Diagnose a CI host's actual WebGL2 rendering before choosing a test backend.
const {app,BrowserWindow}=require('electron');
const backend=process.env.SPARE_ROOM_TEST_ANGLE||'default';
if(!['default','metal','gl','swiftshader'].includes(backend))throw Error('Invalid backend');
if(backend!=='default')app.commandLine.appendSwitch('use-angle',backend);
if(backend==='swiftshader')app.commandLine.appendSwitch('enable-unsafe-swiftshader');
const timer=setTimeout(()=>{console.error('Graphics probe timed out: '+backend);app.exit(1)},30000);
app.whenReady().then(async()=>{
 try{
  const win=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
  await win.loadURL('data:text/html,<canvas width="4" height="4"></canvas>');
  const result=await win.webContents.executeJavaScript(`(()=>{
   const gl=document.querySelector('canvas').getContext('webgl2');
   if(!gl)throw Error('WebGL2 unavailable');
   gl.clearColor(1,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);
   const pixel=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
   if(pixel[0]!==255||pixel[1]!==0||pixel[3]!==255)throw Error('WebGL2 did not render');
   const ext=gl.getExtension('WEBGL_debug_renderer_info');
   return {renderer:gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER),pixel:Array.from(pixel)};
  })()`);
  console.log(JSON.stringify({backend,arch:process.arch,ok:true,...result}));clearTimeout(timer);app.exit(0);
 }catch(error){console.error(JSON.stringify({backend,arch:process.arch,ok:false,error:String(error)}));clearTimeout(timer);app.exit(1)}
});
