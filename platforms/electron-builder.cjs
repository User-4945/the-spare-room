const path=require('node:path');
module.exports={
 ...require('../package.json').build,
 mac:{target:[{target:'dmg',arch:['universal']}],icon:path.join(__dirname,'icons/icon-1024.png'),category:'public.app-category.games',identity:'-',hardenedRuntime:false,notarize:false,artifactName:'The-Spare-Room-${version}-mac-${arch}.${ext}'},
 // Electron Builder rewrites ${arch} as x86_64 for AppImage and amd64 for DEB.
 // These targets are explicitly x64; keep one filename contract for updates.
 linux:{target:[{target:'AppImage',arch:['x64']},{target:'deb',arch:['x64']}],icon:path.join(__dirname,'icons/icon-512.png'),category:'Game',executableName:'the-spare-room',maintainer:'User-4945',artifactName:'The-Spare-Room-${version}-linux-x64.${ext}'},
 dmg:{sign:false},
 directories:{output:'platform-build'}
};
