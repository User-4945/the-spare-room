const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const repo=process.env.GH_REPO;
function api(route,method='GET',body){return JSON.parse(execFileSync('gh',['api','repos/'+repo+'/'+route,'--method',method,...(body?['--input','-']:[])],{encoding:'utf8',input:body?JSON.stringify(body):undefined}))}
const latest=api('releases/latest'),groups=new Map();
for(const folder of fs.readdirSync('platform-artifacts')){
 const dir=path.join('platform-artifacts',folder),metaFile=fs.readdirSync(dir).find(f=>f.endsWith('-BUILD.json')),meta=JSON.parse(fs.readFileSync(path.join(dir,metaFile),'utf8'));
 if(meta.updater_commit!==process.env.GITHUB_SHA)throw Error('Wrong platform source');
 if(!groups.has(meta.game_tag))groups.set(meta.game_tag,{meta,files:new Map()});
 const g=groups.get(meta.game_tag);
 for(const f of fs.readdirSync(dir))g.files.set(f,path.join(dir,f));
}
for(const [tag,{meta,files}] of groups){
 const before=api('releases/tags/'+encodeURIComponent(tag));if(before.prerelease!==meta.prerelease)throw Error('Wrong release channel');
 const expected=['The-Spare-Room-'+meta.game_version+'-mac-universal.dmg','The-Spare-Room-'+meta.game_version+'-linux-x64.AppImage','The-Spare-Room-'+meta.game_version+'-linux-amd64.deb'];
 // electron-builder uses x64 in the configured artifact filename for both Linux formats.
 expected[2]='The-Spare-Room-'+meta.game_version+'-linux-x64.deb';
 for(const name of expected)if(!files.has(name))throw Error('Missing package '+name);
 const sums=[...files].map(([name,file])=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')+'  '+name).join('\n')+'\n';
 const sumsPath=path.join(path.dirname(files.values().next().value),'PLATFORM-SHA256SUMS.txt');fs.writeFileSync(sumsPath,sums);files.set('PLATFORM-SHA256SUMS.txt',sumsPath);
 execFileSync('gh',['release','upload',tag,...files.values(),'--clobber'],{stdio:'inherit'});
 const after=api('releases/tags/'+encodeURIComponent(tag));for(const [name,file] of files){const hash='sha256:'+crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');if(!after.assets.some(a=>a.name===name&&a.digest===hash))throw Error('Upload checksum failed: '+name)}
 for(const old of before.assets.filter(a=>a.name.endsWith('.exe')||a.name.endsWith('-web.zip')))if(!after.assets.some(a=>a.id===old.id&&a.digest===old.digest))throw Error('An existing game download changed');
 const note='<!-- platforms-start -->\n## Mac, Linux and mobile installation\n\n- **macOS:** universal DMG for Apple Silicon and Intel Macs. Drag the app into Applications. This prototype is ad-hoc signed, not Apple-notarized.\n- **Linux x64:** AppImage and Debian/Ubuntu DEB packages.\n- **Android, iPhone and iPad:** installable web app with offline caching and touch controls. Open [the stable app](https://the-spare-room.sunsetjelly6.chatgpt.site/stable/) or [the prerelease app](https://the-spare-room.sunsetjelly6.chatgpt.site/), then use INSTALL for instructions. These are home-screen web apps, not APK or App Store packages.\n\nThis release also includes its own installable-web ZIP for hosting this exact version. The native packages preserve game version '+meta.game_version+'. Mac/Linux Settings retain daily/manual stable or opt-in prerelease checks; install updates from the linked release page. Windows installation behavior is unchanged. See INSTALL-PLATFORMS.md and PLATFORM-SHA256SUMS.txt.\n<!-- platforms-end -->';
 const body=after.body.includes('<!-- platforms-start -->')?after.body.replace(/<!-- platforms-start -->[\s\S]*?<!-- platforms-end -->/,note):after.body+'\n\n'+note;
 api('releases/'+after.id,'PATCH',{body,make_latest:after.id===latest.id?'true':'false'});
}
if(api('releases/latest').id!==latest.id)throw Error('Latest stable changed');
console.log('Published and verified Mac, Linux and installable web packages for '+[...groups.keys()].join(', '));
