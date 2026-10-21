const fs=require('node:fs'),release=require('../release.json');
if(release.version!=='2.0.5'||release.prerelease)throw Error('Wrong stable release configuration');
fs.writeFileSync('installer-build.json',JSON.stringify({game_version:release.version,game_tag:release.tag,game_commit:process.env.GITHUB_SHA,base_game_tag:'v2.0.0',base_game_commit:'c5cd1cafc8849d6b4bd24df46224d89d8e698dc2',signage_from:'v.2.1.0',signage_source_commit:'5c47415e7dd559f7ff7e59f8e08e539da0565386',updater_version:'2.1.0',updater_commit:process.env.GITHUB_SHA,prerelease:false,scope:'signage-only'},null,2)+'\n');
