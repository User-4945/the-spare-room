const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {Readable}=require('node:stream'),{EventEmitter}=require('node:events');
const {UpdateService,createTransport,selectRelease,compareVersions,allowedURL,API,DAY}=require('../desktop/updater-core.cjs');
const bytes=Buffer.from('MZ a verified installer fixture'),digest=crypto.createHash('sha256').update(bytes).digest('hex');
function release(version='2.0.0'){return {id:10,tag_name:'v.'+version,name:'The Spare Room '+version,draft:false,prerelease:false,body:'Release notes for '+version,assets:[{id:12,name:'The-Spare-Room-Setup-'+version+'-x64.exe',state:'uploaded',size:bytes.length,digest:'sha256:'+digest}]}}
function fixture(t,extra={}){let now=100000000,online=true,calls=0,installs=0,downloads=0,data=release();const profile=fs.mkdtempSync(path.join(os.tmpdir(),'spare-updater-'));t.after(()=>fs.rmSync(profile,{recursive:true,force:true}));const transport={json:async url=>{assert.equal(url,API+'/releases/latest');calls++;return data},download:async(url,file,size,progress)=>{assert.equal(url,API+'/releases/assets/12');downloads++;fs.writeFileSync(file,bytes);progress(100)},text:async()=>digest+'  '+data.assets[0].name};const options={profile,version:'1.5.1',transport,isOnline:()=>online,now:()=>now,runInstaller:async(file,args)=>{assert(fs.existsSync(file));assert.deepEqual(args,['--updated','/S','--force-run']);installs++},...extra};const service=new UpdateService(options);return {service,options,profile,transport,setData:x=>data=x,setNow:x=>now=x,setOnline:x=>online=x,get calls(){return calls},get downloads(){return downloads},get installs(){return installs}}}
test('latest stable only, semantic comparison, promotion and no downgrade',()=>{assert.equal(compareVersions('v.2.10.0','v2.9.9'),1);assert(!selectRelease({...release(),prerelease:true},'1.0.0'));assert(!selectRelease({...release(),draft:true},'1.0.0'));assert(!selectRelease({...release(),tag_name:'v2.2.0-beta'},'1.0.0'));assert(!selectRelease(release(),'2.1.0',true));assert(!selectRelease(release(),'2.0.0'));assert(selectRelease(release(),'2.0.0',true));assert(!selectRelease(release(),'2.0.0',true,'2.0.0'));assert(!selectRelease({...release(),assets:[]},'2.0.0'));});
test('daily checks persist across launches; manual bypass and offline retry',async t=>{const f=fixture(t);f.setOnline(false);await f.service.check();assert.equal(f.calls,0);assert(!f.service.saved.lastChecked);f.setOnline(true);await f.service.check();await f.service.check();assert.equal(f.calls,1);const restarted=new UpdateService(f.options);await restarted.check();assert.equal(f.calls,1);await restarted.check(true);assert.equal(f.calls,2);f.setNow(100000000+DAY+1);await restarted.check();assert.equal(f.calls,3);assert.equal(f.downloads,0);assert.equal(f.installs,0);});
test('failed network request does not mark a successful day; access errors are explicit',async t=>{const f=fixture(t);f.transport.json=async()=>{throw Error('offline')};await f.service.check();assert.equal(f.service.state().phase,'error');assert(!f.service.saved.lastChecked);f.transport.json=async()=>{throw Object.assign(Error('private'),{status:404})};await f.service.check(true);assert.equal(f.service.state().phase,'access');});
test('only an explicit install downloads, verifies and launches; notes survive restart and dismiss',async t=>{const f=fixture(t);await f.service.check(true);assert.equal(f.downloads,0);await f.service.install();assert.equal(f.downloads,1);assert.equal(f.installs,1);assert.equal(f.service.saved.pendingUpdate.version,'2.0.0');const next=new UpdateService({...f.options,version:'2.0.0'});assert.equal(next.state().notes.body,'Release notes for 2.0.0');assert(!next.saved.pendingUpdate);next.notesPresented();assert.equal(next.saved.notesShownVersion,'2.0.0');next.acknowledgeNotes();assert.equal(new UpdateService({...f.options,version:'2.0.0'}).state().notes,null);});
test('checksum failure never starts an executable and cleans partial downloads',async t=>{const f=fixture(t);f.transport.download=async(url,file)=>fs.writeFileSync(file,Buffer.from('MZ corrupted installer fixture'));await f.service.check(true);await f.service.install();assert.equal(f.installs,0);assert.equal(f.service.state().phase,'fallback');assert(!f.service.saved.pendingUpdate);assert.equal(fs.readdirSync(path.join(f.profile,'updates')).length,0);});
test('checksum file fallback; missing installer and replaced latest remain safe',async t=>{const f=fixture(t);let r=release();delete r.assets[0].digest;r.assets.push({id:13,name:'SHA256SUMS.txt',state:'uploaded'});f.setData(r);await f.service.check(true);await f.service.install();assert.equal(f.installs,1);const g=fixture(t);g.setData({...release(),assets:[]});await g.service.check(true);assert.equal(g.service.state().release.canInstall,false);await g.service.install();assert.equal(g.installs,0);assert.equal(g.service.state().phase,'fallback');const h=fixture(t);await h.service.check(true);h.setData({...release('2.2.0'),id:20});await h.service.install();assert.equal(h.installs,0);assert.equal(h.service.state().phase,'available');});
test('private token stays on repository API; redirects are bounded and HTTPS only',async()=>{let requests=[];const request=(url,opts,callback)=>{const req=new EventEmitter();req.destroy=()=>{};requests.push({url,headers:opts.headers});queueMicrotask(()=>{const res=Readable.from([Buffer.from('{}')]);res.statusCode=requests.length===1?302:200;res.headers=requests.length===1?{location:'https://release-assets.githubusercontent.com/fixture'}:{};callback(res)});return req};const transport=createTransport(()=>'test-token-never-shared',request);await transport.json(API+'/releases/latest');assert.equal(requests[0].headers.Authorization,'Bearer test-token-never-shared');assert.equal(requests[1].headers.Authorization,undefined);for(let value of ['http://github.com/a','https://github.com.evil.test/a','file:///tmp/x','https://user:pass@github.com/a','https://github.com:8443/a'])assert(!allowedURL(value));});
test('public access needs no credentials; rejected saved tokens retry anonymously once',async()=>{
 function server(statuses){let calls=[];return {calls,request:(url,opts,callback)=>{const req=new EventEmitter();req.destroy=()=>{};const code=statuses[calls.length]||200;calls.push({url,headers:opts.headers});queueMicrotask(()=>{const res=Readable.from([Buffer.from('{}')]);res.statusCode=code;res.headers=code===302?{location:'https://release-assets.githubusercontent.com/public-installer'}:{};callback(res)});return req}}}
 const publicServer=server([200]);await createTransport(undefined,publicServer.request).json(API+'/releases/latest');assert.equal(publicServer.calls[0].headers.Authorization,undefined);
 for(const code of [401,403]){const s=server([code,302,200]);await createTransport(()=>'expired-fixture-token',s.request).json(API+'/releases/latest');assert.equal(s.calls.length,3);assert.equal(s.calls[0].headers.Authorization,'Bearer expired-fixture-token');assert.equal(s.calls[1].headers.Authorization,undefined);assert.equal(s.calls[2].headers.Authorization,undefined)}
 const denied=server([401,403]);await assert.rejects(createTransport(()=>'expired-fixture-token',denied.request).json(API+'/releases/latest'),{status:403});assert.equal(denied.calls.length,2);
 const limited=server([403]);await assert.rejects(createTransport(undefined,limited.request).json(API+'/releases/latest'),{status:403});assert.equal(limited.calls.length,1);
});
test('saved opt-in chooses the highest version, stable wins ties, and pagination ignores drafts',async t=>{
 const f=fixture(t,{version:'2.0.5'}),calls=[];
 const pre={...release('2.1.0'),prerelease:true,id:21};
 f.transport.json=async url=>{calls.push(url);if(url===API+'/releases/latest')return release('2.0.5');if(url.endsWith('page=1'))return Array.from({length:100},()=>({...release('9.0.0'),draft:true}));if(url.endsWith('page=2'))return [release('2.0.0'),pre,release('2.0.5')];throw Error('Wrong endpoint')};
 assert.equal(f.service.state().preferences.allowPrereleases,false);
 await f.service.check(true);assert.equal(f.service.state().phase,'current');
 await f.service.savePreferences({allowPrereleases:true});assert.equal(f.service.state().release.version,'2.1.0');assert.equal(f.service.state().release.prerelease,true);
 assert.deepEqual(calls.slice(-2),[API+'/releases?per_page=100&page=1',API+'/releases?per_page=100&page=2']);
 const restarted=new UpdateService(f.options);assert.equal(restarted.state().preferences.allowPrereleases,true);await restarted.check();assert.equal(calls.length,3);
 const {selectLatest}=require('../desktop/updater-core.cjs');assert.equal(selectLatest([pre,release('2.1.0')],'2.0.5',false,'',true).prerelease,false);
 assert.equal(selectLatest([pre],'2.1.0',false,'',true),null);assert.equal(selectLatest([pre],'2.1.0',true,'',true),null);
});
test('opting out checks only latest stable and never downgrades a newer installed prerelease',async t=>{
 const f=fixture(t,{version:'2.1.0',prerelease:true}),urls=[];
 f.transport.json=async url=>{urls.push(url);return url.endsWith('/latest')?release('2.0.5'):[{...release('2.2.0'),prerelease:true}]};
 await f.service.savePreferences({allowPrereleases:true});assert.equal(f.service.state().phase,'available');
 await f.service.savePreferences({allowPrereleases:false});assert.equal(urls.at(-1),API+'/releases/latest');assert.equal(f.service.state().phase,'current');assert.equal(f.service.candidate,null);
 await f.service.install();assert.equal(f.installs,0);assert.equal(new UpdateService(f.options).state().preferences.allowPrereleases,false);
});
test('prerelease installation preserves opt-in, shows notes, and can later graduate to stable',async t=>{
 const f=fixture(t,{version:'2.0.5'}),pre={...release('2.1.0'),prerelease:true};
 f.transport.json=async url=>{assert(url.includes('/releases?'));return [pre]};
 await f.service.savePreferences({allowPrereleases:true});await f.service.install();assert.equal(f.installs,1);assert.equal(f.service.saved.pendingUpdate.prerelease,true);
 const next=new UpdateService({...f.options,version:'2.1.0',prerelease:true});assert.equal(next.state().currentPrerelease,true);assert.equal(next.saved.confirmedStable,undefined);assert.equal(next.state().notes.body,pre.body);
 assert.equal(next.state().preferences.allowPrereleases,true);
 f.transport.json=async url=>{assert.equal(url,API+'/releases/latest');return release('2.1.0')};
 await next.savePreferences({allowPrereleases:false});assert.equal(next.state().phase,'available');await next.install();
 const stable=new UpdateService({...f.options,version:'2.1.0',prerelease:false});assert.equal(stable.saved.confirmedStable,'2.1.0');assert.equal(stable.state().currentPrerelease,false);await stable.check(true);assert.equal(stable.state().phase,'current');
});
test('saving offline persists the preference and checks the chosen feed on reconnect',async t=>{
 const f=fixture(t);f.setOnline(false);await f.service.savePreferences({allowPrereleases:true});assert.equal(f.service.state().phase,'offline');assert.equal(f.service.saved.allowPrereleases,true);assert.equal(f.calls,0);
 f.transport.json=async url=>{assert(url.includes('/releases?'));return [{...release('2.1.0'),prerelease:true}]};f.setOnline(true);await f.service.check();assert.equal(f.service.state().release.version,'2.1.0');
});
test('preference changes are rejected during checks and withdrawn prereleases cannot install',async t=>{
 const f=fixture(t);let resolve;f.transport.json=()=>new Promise(r=>resolve=r);const check=f.service.check(true);
 await assert.rejects(f.service.savePreferences({allowPrereleases:true}),/Wait/);assert.equal(f.service.saved.allowPrereleases,false);resolve(release());await check;
 f.transport.json=async()=>[{...release('2.1.0'),prerelease:true}];await f.service.savePreferences({allowPrereleases:true});
 f.transport.json=async()=>[];await f.service.install();assert.equal(f.installs,0);assert.equal(f.service.state().phase,'current');
 await assert.rejects(f.service.savePreferences({allowPrereleases:'true'}),/Invalid/);
});
test('failed channel check clears stale candidates and fallback links match the selected release',async t=>{
 const f=fixture(t);f.transport.json=async()=>[{...release('2.1.0'),prerelease:true}];await f.service.savePreferences({allowPrereleases:true});assert(f.service.state().latestPage.endsWith('/tag/v.2.1.0'));
 f.transport.json=async()=>{throw Error('offline')};await f.service.check(true);assert.equal(f.service.candidate,null);await f.service.install();assert.equal(f.installs,0);
});
test('macOS and Linux select their own downloads and never execute a Windows installer',async t=>{
 for(const [platform,name] of [['darwin','The-Spare-Room-2.0.0-mac-universal.dmg'],['linux','The-Spare-Room-2.0.0-linux-x64.AppImage']]){
  const f=fixture(t,{platform});const r=release();r.assets.push({...r.assets[0],id:20,name});f.setData(r);
  await f.service.check(true);assert.equal(f.service.candidate.asset.name,name);assert.equal(f.service.state().release.canInstall,false);
  await f.service.install();assert.equal(f.installs,0);assert.equal(f.downloads,0);assert.equal(f.service.state().phase,'fallback');
 }
});
test('same-version refreshes use a strictly newer revision, install once and retain notes',async t=>{
 const f=fixture(t,{version:'2.0.0',tag:'v.2.0.0',revision:100});const r=release();r.assets.push({id:30,name:'BUILD-REFRESH.json',state:'uploaded',size:140});
 f.transport.json=async()=>r;let revision=101;f.transport.text=async()=>JSON.stringify({schema:1,version:'2.0.0',tag:r.tag_name,release_id:r.id,revision});
 await f.service.check(true);assert.equal(f.service.state().release.refresh,true);assert.equal(f.service.state().release.revision,101);await f.service.install();assert.equal(f.installs,1);
 const updated=new UpdateService({...f.options,revision:101});assert.equal(updated.state().notes.body,r.body);await updated.check(true);assert.equal(updated.state().phase,'current');
 revision=99;await updated.check(true);assert.equal(updated.state().phase,'current');revision=102;await updated.check(true);assert.equal(updated.state().release.revision,102);
});
test('installed prerelease refresh is allowed when opted out without accepting other prereleases or downgrades',async t=>{
 const f=fixture(t,{version:'2.7.5',tag:'v.2.7.5',revision:10,prerelease:true});const own={...release('2.7.5'),prerelease:true};own.assets.push({id:30,name:'BUILD-REFRESH.json',state:'uploaded',size:150});const urls=[];
 f.transport.json=async url=>{urls.push(url);return url.endsWith('/latest')?release('2.5.0'):own};f.transport.text=async()=>JSON.stringify({schema:1,version:'2.7.5',tag:own.tag_name,release_id:own.id,revision:11});
 await f.service.check(true);assert.equal(f.service.state().release.version,'2.7.5');assert.equal(f.service.state().release.refresh,true);assert.deepEqual(urls,[API+'/releases/latest',API+'/releases/tags/v.2.7.5']);assert.equal(f.service.saved.allowPrereleases,false);
 f.transport.text=async()=>JSON.stringify({schema:1,version:'2.7.5',tag:own.tag_name,release_id:999,revision:12});await f.service.check(true);assert.equal(f.service.state().phase,'error');assert.equal(f.service.candidate,null);
});
test('replaced refresh revision requires another review before execution',async t=>{
 const f=fixture(t,{version:'2.0.0',tag:'v.2.0.0',revision:1});const r=release();r.assets.push({id:30,name:'BUILD-REFRESH.json',state:'uploaded',size:140});let revision=2;f.transport.json=async()=>r;f.transport.text=async()=>JSON.stringify({schema:1,version:'2.0.0',tag:r.tag_name,release_id:r.id,revision});await f.service.check(true);revision=3;await f.service.install();assert.equal(f.installs,0);assert.equal(f.service.state().phase,'available');assert.equal(f.service.state().release.revision,3);
});

test('manual same-version reinstall shows refresh notes for a legacy profile',t=>{const f=fixture(t,{version:'2.0.0'});fs.writeFileSync(path.join(f.profile,'updater-state.json'),JSON.stringify({lastLaunchVersion:'2.0.0',allowPrereleases:true}));const next=new UpdateService({...f.options,revision:100,notes:'Refreshed build notes'});assert.equal(next.state().notes.body,'Refreshed build notes');assert.equal(next.state().preferences.allowPrereleases,true);});
