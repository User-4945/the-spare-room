const fs=require('node:fs'),{execFileSync}=require('node:child_process');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
if(require('../release.json').version!=='2.5.0'||require('../release.json').prerelease)throw Error('Wrong release metadata');
fs.writeFileSync('installer-build.json',JSON.stringify({game_version:'2.5.0',game_tag:'v.2.5.0',game_commit:process.env.GITHUB_SHA,game_tree:git('rev-parse','HEAD:dist'),verified_game_files:git('ls-tree','-r','HEAD','--','dist').split('\n').length,updater_commit:process.env.GITHUB_SHA,prerelease:false,platform:process.argv[2],endings:38,halloween_endings:7,anomalies:8,update_settings:{default:'stable',prereleases:'opt-in',never_downgrade:true}},null,2));
