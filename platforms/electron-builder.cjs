const path=require('node:path');
module.exports={
 ...require('../package.json').build,
 mac:{target:[{target:'dmg',arch:['universal']}],icon:path.join(__dirname,'icons/icon-1024.png'),category:'public.app-category.games',identity:'-',hardenedRuntime:false,notarize:false,artifactName:'The-Spare-Room-${version}-mac-${arch}.${ext}'},
 linux:{target:['AppImage','deb'],icon:path.join(__dirname,'icons/icon-512.png'),category:'Game',executableName:'the-spare-room',maintainer:'User-4945',artifactName:'The-Spare-Room-${version}-linux-${arch}.${ext}'},
 dmg:{sign:false},
 directories:{output:'platform-build'}
};
