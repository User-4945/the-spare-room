const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {selectDeveloperRelease,UpdateService,API}=require('../desktop/updater-core.cjs');
const release={id:426674255,draft:false,tag_name:'v.2.7.5',assets:[{id:2,name:'DEVELOPER-CHANNEL.json',size:100,state:'uploaded'},{id:3,name:'The-Spare-Room-Developer-Setup-3.0.0-x64.exe',state:'uploaded',size:100,digest:'sha256:'+'a'.repeat(64)}]},manifest={schema:1,channel:'developer',version:'3.0.0',revision:999,notes:'Developer notes'};
test('developer selection is explicit, verified, revision-aware and never downgrades',()=>{
 assert(selectDeveloperRelease(release,manifest,'2.7.5',0)?.developer);
 assert.equal(selectDeveloperRelease(release,manifest,'3.1.0',0),null);
 assert.equal(selectDeveloperRelease(release,manifest,'3.0.0',999),null);
 assert(selectDeveloperRelease(release,manifest,'3.0.0',998)?.refresh);
 assert.equal(selectDeveloperRelease(release,{...manifest,channel:'stable'},'2.7.5'),null);
 assert.equal(selectDeveloperRelease({...release,assets:release.assets.map(a=>({...a,digest:null}))},manifest,'2.7.5'),null);
 assert.equal(selectDeveloperRelease(release,manifest,'2.7.5',0,'darwin'),null);
});
test('stable and prerelease users never query developer feed; opt-in persists and checks immediately',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'spare-dev-')),requests=[];
 const transport={json:async url=>{requests.push(url);if(url===API+'/releases/426674255')return release;if(url===API+'/releases/latest')return {id:1,tag_name:'v2.7.5',draft:false,prerelease:false,assets:[]};throw Error(url)},text:async()=>JSON.stringify(manifest)};
 try{const s=new UpdateService({profile,version:'2.7.5',transport});await s.check(true);assert(!requests.some(u=>u.endsWith('/426674255')));await s.savePreferences({allowPrereleases:false,allowDeveloperVersions:true});assert(s.candidate.developer);assert(s.state().preferences.allowDeveloperVersions);const restarted=new UpdateService({profile,version:'3.0.0',revision:999,transport});assert(restarted.state().preferences.allowDeveloperVersions);await restarted.check(true);assert(!restarted.candidate);await restarted.savePreferences({allowPrereleases:false,allowDeveloperVersions:false});assert(!restarted.candidate);}
 finally{fs.rmSync(profile,{recursive:true,force:true});}
});
test('settings admin login and preference mutations are restricted to the trusted settings window',async()=>{
 const {setupUpdates}=require('../desktop/updates-controller.cjs');const handlers=new Map();const profile=fs.mkdtempSync(path.join(os.tmpdir(),'spare-admin-settings-'));
 const win={webContents:{},isDestroyed:()=>false};win.webContents.mainFrame={};
 try{setupUpdates({app:{},BrowserWindow:function(){},ipcMain:{handle:(n,fn)=>handlers.set(n,fn)},safeStorage:{isEncryptionAvailable:()=>false},net:{isOnline:()=>false},shell:{},win,profile,version:'2.7.5',smoke:true});
 const sender={mainFrame:{}};await assert.rejects(()=>handlers.get('updates:admin-login')({sender,senderFrame:sender.mainFrame},{username:'test',password:'test'}),/Untrusted/);
 await assert.rejects(()=>handlers.get('updates:preferences')({sender:win.webContents,senderFrame:win.webContents.mainFrame},{allowPrereleases:false,allowDeveloperVersions:true}),/Untrusted/);
 assert(!fs.readFileSync(path.join(profile,'updater-state.json'),'utf8').includes('password'));
 }finally{fs.rmSync(profile,{recursive:true,force:true});}
});
test('a final stable release wins over a same-version developer revision',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'spare-dev-promote-'));
 const transport={json:async url=>url.endsWith('/426674255')?release:{id:4,tag_name:'v3.0.0',draft:false,prerelease:false,assets:[]},text:async()=>JSON.stringify(manifest)};
 try{const s=new UpdateService({profile,version:'3.0.0',prerelease:true,revision:998,transport});s.saved.allowDeveloperVersions=true;await s.check(true);assert(s.candidate);assert.equal(s.candidate.prerelease,false);assert(!s.candidate.developer);}finally{fs.rmSync(profile,{recursive:true,force:true});}
});
