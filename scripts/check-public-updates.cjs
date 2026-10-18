const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createTransport,selectRelease,verifyInstaller,API}=require('../desktop/updater-core.cjs');
// Exercise the shipped HTTPS transport without reading GH_TOKEN or any saved credentials.
async function main(){
 const transport=createTransport(),repo=await transport.json(API);
 if(repo.private!==false)throw Error('The update repository is not public');
 const data=await transport.json(API+'/releases/latest'),release=selectRelease(data,'0.0.0');
 if(!release?.asset)throw Error('No public stable Windows installer is available');
 const manifest=data.assets.find(a=>a.name==='INSTALLER_BUILD.json'&&a.state==='uploaded');
 if(!manifest)throw Error('Installer build manifest is missing');
 const build=JSON.parse(await transport.text(API+'/releases/assets/'+manifest.id));
 if(process.env.GITHUB_SHA&&build.updater_commit!==process.env.GITHUB_SHA)throw Error('Public download is not the refreshed installer');
 const digest=/^sha256:([a-f0-9]{64})$/i.exec(release.asset.digest||'')?.[1];
 if(!digest)throw Error('Installer checksum is missing');
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'spare-public-update-'));
 try{const file=path.join(directory,release.asset.name);await transport.download(API+'/releases/assets/'+release.asset.id,file,release.asset.size,()=>{});await verifyInstaller(file,digest,release.asset.size)}
 finally{fs.rmSync(directory,{recursive:true,force:true})}
 console.log('PASS: public latest stable '+release.tag+', refreshed manifest, complete installer download and SHA-256 verification without a GitHub login or token.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
