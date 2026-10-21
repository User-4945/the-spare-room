const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve('pwa-build');
test('installed game has local icons, standalone identity, and all cache assets',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
 assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');
 for(const icon of manifest.icons)assert(fs.statSync(path.join(root,icon.src)).size>1000);
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert(html.includes('viewport-fit=cover'));assert(html.includes('install-app.js'));
 for(const m of html.matchAll(/(?:href|src)="([^"#]+)"/g)){if(m[1].startsWith('http'))continue;assert(fs.existsSync(path.join(root,m[1].split('?')[0])),'Missing '+m[1])}
});
test('offline navigation and version-query assets load from the atomic cache; updates require a request',async()=>{
 const events={},stores=new Map(),scope='https://game.example/stable/';let activated=0,claimed=0,network=0;
 const key=r=>new URL(typeof r==='string'?r:r.url||String(r),scope).href;
 const caches={keys:async()=>[...stores.keys()],delete:async n=>stores.delete(n),open:async n=>{
  if(!stores.has(n))stores.set(n,new Map());const files=stores.get(n);
  return {addAll:async requests=>{for(const r of requests){const url=key(r),file=new URL(url).pathname.slice('/stable/'.length);assert(fs.existsSync(path.join(root,file)));files.set(url,new Response(fs.readFileSync(path.join(root,file))))}},match:async(r,options)=>{const url=new URL(key(r));if(options?.ignoreSearch)url.search='';return files.get(url.href)?.clone()}};
 }};
 const self={registration:{scope},location:{origin:new URL(scope).origin},clients:{claim:async()=>claimed++},skipWaiting:()=>activated++,addEventListener:(type,fn)=>events[type]=fn};
 vm.runInNewContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),{self,caches,Request,Response,URL,fetch:async()=>{network++;throw Error('offline')}});
 let task;events.install({waitUntil:p=>task=p});await task;assert.equal(activated,0);
 stores.set('spare-/stable/-old',new Map());stores.set('spare-/-preview',new Map());events.activate({waitUntil:p=>task=p});await task;assert.equal(claimed,1);assert(stores.has('spare-/-preview'));assert(!stores.has('spare-/stable/-old'));
 async function request(url,mode){let response;events.fetch({request:{url,method:'GET',mode},respondWith:p=>response=p});return response?await response:null}
 assert((await(await request(scope,'navigate')).text()).includes('The Spare Room'));
 assert((await(await request(scope+'favicon.svg?v=1','cors')).text()).includes('<svg'));
 assert.equal(network,0);assert.equal(await request('https://example.com/unrelated','cors'),null);
 events.message({data:{type:'ACTIVATE_UPDATE'}});assert.equal(activated,1);
});
