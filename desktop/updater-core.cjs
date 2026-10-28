const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const https=require('node:https');
const {EventEmitter}=require('node:events');
const REPO='User-4945/the-spare-room';
const API='https://api.github.com/repos/'+REPO;
const LATEST_PAGE='https://github.com/'+REPO+'/releases/latest';
const DAY=24*60*60*1000;
function versionParts(value){const m=/^v?\.?([0-9]+)\.([0-9]+)\.([0-9]+)$/.exec(String(value));return m?m.slice(1).map(Number):null}
function compareVersions(a,b){a=versionParts(a);b=versionParts(b);if(!a||!b)throw Error('Invalid release version');for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i]?1:-1}return 0}
function readJSON(file){try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return {}}}
function writeJSON(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});const temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(value,null,2),{mode:0o600});fs.renameSync(temp,file)}
function allowedURL(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&(['api.github.com','github.com','release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(u.hostname))}catch{return false}}
function assetURL(asset){return API+'/releases/assets/'+asset.id}
function selectRelease(release,current,prerelease=false,confirmedStable='',allowPrereleases=false,platform='win32',currentRevision=0){
 if(!release||typeof release.prerelease!=='boolean'||release.prerelease&&!allowPrereleases||release.draft!==false||!versionParts(release.tag_name))return null;
 const version=versionParts(release.tag_name).join('.'),comparison=compareVersions(version,current);
 const refresh=comparison===0&&Number.isSafeInteger(release.build_revision)&&release.build_revision>currentRevision;
 if(comparison<0||comparison===0&&!refresh&&(release.prerelease||!prerelease||confirmedStable===version))return null;
 const name=platform==='darwin'?'The-Spare-Room-'+version+'-mac-universal.dmg':platform==='linux'?'The-Spare-Room-'+version+'-linux-x64.AppImage':'The-Spare-Room-Setup-'+version+'-x64.exe';
 const asset=(release.assets||[]).find(a=>a.name===name&&a.state==='uploaded'&&Number.isSafeInteger(a.id)&&a.id>0&&a.size>0&&a.size<400*1024*1024);
 const checksum=(release.assets||[]).find(a=>a.name==='SHA256SUMS.txt'&&a.state==='uploaded'&&Number.isSafeInteger(a.id));
 return {id:release.id,version,revision:release.build_revision||0,refresh,prerelease:release.prerelease,page:'https://github.com/'+REPO+'/releases/tag/'+encodeURIComponent(release.tag_name),tag:release.tag_name,name:String(release.name||release.tag_name),notes:String(release.body||'No release notes were supplied.').slice(0,60000),asset,checksum};
}
function selectLatest(releases,current,prerelease=false,confirmedStable='',allowPrereleases=false,platform='win32'){
 if(!Array.isArray(releases))throw Error('Invalid release list');
 return releases.map(r=>selectRelease(r,current,prerelease,confirmedStable,allowPrereleases,platform)).filter(Boolean)
  .sort((a,b)=>compareVersions(b.version,a.version)||Number(a.prerelease)-Number(b.prerelease)||b.id-a.id)[0]||null;
}
// Public updates need no token. An optional token is sent
// solely to this repository's API; it is stripped before every CDN redirect.
function createTransport(getToken=()=>'',request=https.get){
 async function response(url,accept='application/vnd.github+json',hops=0,anonymous=false){
  if(!allowedURL(url)||hops>5)throw Error('Untrusted update download address');
  const headers={'User-Agent':'The-Spare-Room-Updater','Accept':accept,'X-GitHub-Api-Version':'2022-11-28'};
  if(!anonymous&&url.startsWith(API+'/')){const token=getToken();if(token)headers.Authorization='Bearer '+token;}
  const res=await new Promise((resolve,reject)=>{const req=request(url,{headers,timeout:30000},resolve);req.on('error',reject);req.on('timeout',()=>req.destroy(Error('Connection timed out')))});
  // A token saved while the repository was private may have expired. Retry
  // anonymously once, including subsequent redirects, to keep public updates usable.
  if([401,403].includes(res.statusCode)&&headers.Authorization){res.resume();return response(url,accept,hops,true)}
  if([301,302,303,307,308].includes(res.statusCode)){const next=new URL(res.headers.location,url).href;res.resume();return response(next,accept,hops+1,anonymous)}
  if(res.statusCode!==200){res.resume();const e=Error('GitHub request failed');e.status=res.statusCode;throw e}
  return res;
 }
 async function buffer(url,max,accept){const res=await response(url,accept);let size=0,chunks=[];for await(const chunk of res){size+=chunk.length;if(size>max){res.destroy();throw Error('Update response is too large')}chunks.push(chunk)}return Buffer.concat(chunks)}
 return {
  json:async url=>JSON.parse((await buffer(url,2*1024*1024)).toString('utf8')),
  text:async url=>(await buffer(url,65536,'application/octet-stream')).toString('utf8'),
  async download(url,destination,size,onProgress){
   const res=await response(url,'application/octet-stream');const file=fs.openSync(destination,'wx',0o600);let received=0;const timer=setTimeout(()=>res.destroy(Error('Download timed out')),5*60*1000);
   try{for await(const chunk of res){received+=chunk.length;if(received>size||received>400*1024*1024)throw Error('Installer size mismatch');fs.writeSync(file,chunk);onProgress(Math.floor(received/size*100))}if(received!==size)throw Error('Installer download was incomplete')}
   finally{clearTimeout(timer);fs.closeSync(file);res.destroy()}
  }
 };
}
async function verifyInstaller(file,expected,size){
 const stat=fs.statSync(file);if(stat.size!==size||!/^([a-f0-9]{64})$/i.test(expected))throw Error('Installer integrity information is invalid');
 const fd=fs.openSync(file,'r'),magic=Buffer.alloc(2);fs.readSync(fd,magic,0,2,0);fs.closeSync(fd);if(magic.toString()!=='MZ')throw Error('The download is not a Windows executable');
 const hash=crypto.createHash('sha256');for await(const part of fs.createReadStream(file))hash.update(part);if(hash.digest('hex').toLowerCase()!==expected.toLowerCase())throw Error('Installer checksum verification failed');
}
class UpdateService extends EventEmitter{
 constructor({profile,version,prerelease=false,platform='win32',notes='',revision=0,tag='',transport,isOnline=()=>true,now=Date.now,runInstaller,prepareInstall=async()=>{}}){
  super();Object.assign(this,{profile,version,prerelease,platform,revision,tag,transport,isOnline,now,runInstaller,prepareInstall});this.file=path.join(profile,'updater-state.json');this.saved=readJSON(this.file);this.busy=false;this.candidate=null;this.status={phase:'idle',message:'Checks for updates once a day while the game is open and connected. Save your preferences to check a different update channel.',version};
  const previous=this.saved.lastLaunchVersion,pending=this.saved.pendingUpdate;
  if(pending&&pending.version===version&&(!pending.revision||pending.revision===revision)){this.saved.releaseNotes={version,body:pending.notes};if(pending.prerelease===false||pending.prerelease===undefined&&!prerelease)this.saved.confirmedStable=version;delete this.saved.pendingUpdate;}
  else if(previous&&(previous!==version||this.saved.lastLaunchRevision&&this.saved.lastLaunchRevision!==revision)){this.saved.releaseNotes={version,body:notes||'The game has been updated.'};}
  this.saved.allowPrereleases=this.saved.allowPrereleases===true;this.saved.lastLaunchVersion=version;this.saved.lastLaunchRevision=revision;this.persist();
 }
 persist(){writeJSON(this.file,this.saved)}
 state(){return {...this.status,currentVersion:this.version,currentRevision:this.revision,currentPrerelease:this.prerelease&&this.saved.confirmedStable!==this.version,preferences:{allowPrereleases:this.saved.allowPrereleases},lastChecked:this.saved.lastChecked||null,notes:this.saved.releaseNotes||null,latestPage:this.candidate?.page||(this.saved.allowPrereleases?'https://github.com/'+REPO+'/releases':LATEST_PAGE)}}
 publish(phase,message,extra={}){this.status={phase,message,...extra};this.emit('status',this.state());return this.state()}
 due(){const n=this.now();return (!this.saved.lastChecked||n-this.saved.lastChecked>=DAY||n<this.saved.lastChecked)&&(!this.saved.lastAttempt||n-this.saved.lastAttempt>=15*60*1000||n<this.saved.lastAttempt)}
 async savePreferences(value){
  if(!value||typeof value.allowPrereleases!=='boolean')throw Error('Invalid update preferences');
  if(this.busy)throw Error('Wait for the current update action to finish');
  this.saved.allowPrereleases=value.allowPrereleases;
  delete this.saved.lastChecked;delete this.saved.lastAttempt;this.candidate=null;this.persist();
  this.publish('idle','Preferences saved. Checking the selected update channel…');
  return this.check(true);
 }
 async withRefresh(release){
  if(!release||compareVersions(release.tag_name,this.version)!==0)return release;
  const asset=(release.assets||[]).find(a=>a.name==='BUILD-REFRESH.json'&&a.state==='uploaded'&&Number.isSafeInteger(a.id)&&a.id>0&&a.size>0&&a.size<65536);
  if(!asset)return release;
  const m=JSON.parse(await this.transport.text(assetURL(asset)));
  if(m.schema!==1||m.version!==this.version||m.tag!==release.tag_name||m.release_id!==release.id||!Number.isSafeInteger(m.revision)||m.revision<=0)throw Error('Invalid refresh metadata');
  return {...release,build_revision:m.revision};
 }
 async sameReleaseRefresh(){
  if(!/^v?\.?[0-9]+\.[0-9]+\.[0-9]+$/.test(this.tag))return null;
  const r=await this.withRefresh(await this.transport.json(API+'/releases/tags/'+encodeURIComponent(this.tag)));
  if(!r||r.tag_name!==this.tag||compareVersions(r.tag_name,this.version)!==0||!r.build_revision||r.build_revision<=this.revision)return null;
  // An already installed prerelease may receive its own refresh without opting into other prereleases.
  return selectRelease(r,this.version,this.prerelease,this.saved.confirmedStable,this.prerelease||this.saved.allowPrereleases,this.platform,this.revision);
 }
 async findRelease(){
  if(!this.saved.allowPrereleases){
   const release=await this.transport.json(API+'/releases/latest');
   if(!release||release.prerelease!==false||release.draft!==false)throw Error('GitHub did not return a stable release');
   return selectRelease(await this.withRefresh(release),this.version,this.prerelease,this.saved.confirmedStable,false,this.platform,this.revision)||await this.sameReleaseRefresh();
  }
  const releases=[];
  // GitHub sorts by publication date, not version. Read every page before selecting.
  for(let page=1;page<=100;page++){
   const batch=await this.transport.json(API+'/releases?per_page=100&page='+page);
   if(!Array.isArray(batch))throw Error('Invalid release list');releases.push(...batch);
   if(batch.length<100){const current=releases.find(r=>r.tag_name===this.tag);if(current){const i=releases.indexOf(current);releases[i]=await this.withRefresh(current);}
 return releases.map(r=>selectRelease(r,this.version,this.prerelease,this.saved.confirmedStable,true,this.platform,this.revision)).filter(Boolean).sort((a,b)=>compareVersions(b.version,a.version)||Number(a.prerelease)-Number(b.prerelease)||b.revision-a.revision)[0]||null;}
  }
  throw Error('Release list exceeded the supported size');
 }
 async check(manual=false){
  if(this.busy)return this.state();if(!manual&&!this.due())return this.state();
  if(!this.isOnline())return manual?this.publish('offline','You are offline. You can keep playing; checks resume when you reconnect.'):this.state();
  this.busy=true;this.candidate=null;this.saved.lastAttempt=this.now();this.persist();this.publish('checking',this.saved.allowPrereleases?'Checking stable releases and prereleases…':'Checking GitHub’s latest stable release…');
  try{
   this.candidate=await this.findRelease();
   this.saved.lastChecked=this.now();this.persist();
   if(this.candidate)return this.publish('available',this.candidate.refresh?'A refreshed build of this version is available.':'A new release is available.',{release:this.publicCandidate()});
   return this.publish('current',this.saved.allowPrereleases?'No newer stable release or prerelease is available.':'No newer stable release is available. Prereleases are excluded; an installed newer version is kept.');
  }catch(error){if(error.status){this.saved.lastChecked=this.now();this.persist()}this.candidate=null;return this.publish([401,403,404].includes(error.status)?'access':'error',[401,403,404].includes(error.status)?'GitHub could not provide the release, or its request limit was reached. Public updates do not require a login. Try again later or open the latest release in your browser.':'Could not reach GitHub. Keep playing and try again when your connection is available.');}
  finally{this.busy=false}
 }
 publicCandidate(){if(!this.candidate)return null;let c=this.candidate;return {version:c.version,revision:c.revision,refresh:c.refresh,name:c.name,notes:c.notes,prerelease:c.prerelease,canInstall:this.platform==='win32'&&!!c.asset}}
 async install(){
  if(this.busy||!this.candidate)return this.state();if(this.platform!=='win32')return this.publish('fallback','Open the release page to install the update for your operating system.',{release:this.publicCandidate()});const chosen=this.candidate;if(!chosen.asset)return this.publish('fallback','This release has no Windows installer. Open its GitHub page to download it.',{release:this.publicCandidate()});
  this.busy=true;let directory;
  try{
   if(!this.isOnline())throw Error('offline');
   const fresh=await this.findRelease();
   if(!fresh||fresh.id!==chosen.id||fresh.asset?.id!==chosen.asset.id||fresh.prerelease!==chosen.prerelease||fresh.version!==chosen.version||fresh.revision!==chosen.revision){this.candidate=fresh;return this.publish(fresh?'available':'current',fresh?'The latest release changed. Review it before updating.':'No newer stable release is available.',fresh?{release:this.publicCandidate()}:{});}
   let expected=/^sha256:([a-f0-9]{64})$/i.exec(fresh.asset.digest||'')?.[1];
   if(!expected&&fresh.checksum){let sums=await this.transport.text(assetURL(fresh.checksum));expected=sums.split(/\r?\n/).map(line=>/^([a-f0-9]{64})\s+\*?(.+)$/i.exec(line.trim())).find(m=>m&&m[2]===fresh.asset.name)?.[1]}
   if(!expected)throw Error('No verified installer checksum is available');
   fs.mkdirSync(path.join(this.profile,'updates'),{recursive:true});directory=fs.mkdtempSync(path.join(this.profile,'updates','download-'));const file=path.join(directory,fresh.asset.name);
   this.publish('downloading','Downloading the update…',{progress:0,release:this.publicCandidate()});let last=-1;
   await this.transport.download(assetURL(fresh.asset),file,fresh.asset.size,progress=>{if(progress!==last){last=progress;this.publish('downloading','Downloading the update…',{progress,release:this.publicCandidate()})}});
   this.publish('verifying','Verifying the downloaded installer…');await verifyInstaller(file,expected,fresh.asset.size);
   await this.prepareInstall();this.saved.pendingUpdate={version:fresh.version,revision:fresh.revision,prerelease:fresh.prerelease,notes:fresh.notes,releaseId:fresh.id};this.persist();this.publish('installing','Installing the update. The game will close and reopen automatically.');
   await this.runInstaller(file,['--updated','/S','--force-run']);return this.state();
  }catch(error){if(directory)fs.rmSync(directory,{recursive:true,force:true});delete this.saved.pendingUpdate;this.persist();return this.publish('fallback','The update could not be installed. Your game is unchanged. Open the selected GitHub release to install it manually.',{release:this.publicCandidate()});}
  finally{this.busy=false}
 }
 notesPresented(){if(this.saved.releaseNotes){this.saved.notesShownVersion=this.saved.releaseNotes.version;this.persist()}}
 acknowledgeNotes(){delete this.saved.releaseNotes;this.persist();this.emit('status',this.state());}
}
module.exports={UpdateService,createTransport,selectRelease,selectLatest,compareVersions,versionParts,verifyInstaller,allowedURL,readJSON,writeJSON,API,LATEST_PAGE,DAY};
