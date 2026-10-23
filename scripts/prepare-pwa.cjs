const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const source=path.resolve(process.argv[2]||'dist'),out=path.resolve(process.argv[3]||'pwa-build');
const release=JSON.parse(fs.readFileSync(process.argv[4]||path.join(root,'release.json'),'utf8'));
if(source===out||source.startsWith(out+path.sep))throw Error('PWA output must not contain its game source');
fs.rmSync(out,{recursive:true,force:true});fs.cpSync(source,out,{recursive:true});
for(const file of ['app.js','app.css'])fs.copyFileSync(path.join(root,'platforms/web',file),path.join(out,'install-'+file));
for(const size of [192,512])fs.copyFileSync(path.join(root,'platforms/icons/icon-'+size+'.png'),path.join(out,'icon-'+size+'.png'));
const manifest={id:'./',name:release.web_app_name||'The Spare Room'+(release.prerelease?' Preview':''),short_name:release.web_app_short_name||'Spare Room',description:'An offline psychological horror game',start_url:'./',scope:'./',display:'standalone',background_color:release.web_app_theme||'#152019',theme_color:release.web_app_theme||'#152019',icons:[192,512].map(size=>({src:'icon-'+size+'.png',sizes:size+'x'+size,type:'image/png',purpose:'any'}))};
fs.writeFileSync(path.join(out,'manifest.webmanifest'),JSON.stringify(manifest,null,2));
let html=fs.readFileSync(path.join(out,'index.html'),'utf8').replace(/href="\/(favicon[^" ]*|apple-touch-icon\.png)"/g,'href="$1"').replace('width=device-width,initial-scale=1','width=device-width,initial-scale=1,viewport-fit=cover');
// Stable and preview installed apps use separate saves on the shared hosted origin.
if(!release.prerelease)html=html.replaceAll("'spare-room-v1'","'spare-room-stable-v1'");
html=html.replace('</head>','<link rel="manifest" href="manifest.webmanifest"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><link rel="stylesheet" href="install-app.css"></head>');
html=html.replace('</body>','<script>window.spareInstallInfo='+JSON.stringify({version:release.version,prerelease:release.prerelease})+'</script><script src="install-app.js"></script></body>');
fs.writeFileSync(path.join(out,'index.html'),html);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)])}
const files=walk(out).map(f=>path.relative(out,f).split(path.sep).join('/')).sort(),hash=crypto.createHash('sha256');
for(const file of files)hash.update(file).update(fs.readFileSync(path.join(out,file)));
const revision=hash.digest('hex').slice(0,16);
fs.writeFileSync(path.join(out,'sw.js'),`const PREFIX='spare-'+new URL(self.registration.scope).pathname+'-';\nconst CACHE=PREFIX+${JSON.stringify(revision)};\nconst FILES=${JSON.stringify(files)};\nself.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(new URL(f,self.registration.scope),{cache:'reload'}))))));\nself.addEventListener('activate',e=>e.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim()})()));\nself.addEventListener('message',e=>{if(e.data?.type==='ACTIVATE_UPDATE')self.skipWaiting()});\nself.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||!u.href.startsWith(self.registration.scope))return;const rel=u.pathname.slice(new URL(self.registration.scope).pathname.length);if(!FILES.includes(rel)&&!(e.request.mode==='navigate'&&(rel===''||rel==='index.html')))return;e.respondWith((async()=>{const c=await caches.open(CACHE),hit=await c.match(e.request,{ignoreSearch:true});return hit||(e.request.mode==='navigate'?await c.match(new URL('index.html',self.registration.scope)):null)||fetch(e.request)})())});\n`);
console.log('Prepared installable '+release.version+' '+(release.prerelease?'preview':'stable')+' with '+files.length+' offline assets.');
