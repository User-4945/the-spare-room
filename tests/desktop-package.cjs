const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
execFileSync(process.execPath,[path.join(root,'scripts/prepare-desktop.cjs')]);
const pkg=require('../package.json');
assert.equal(pkg.version,require('../release.json').version);
assert.equal(pkg.build.win.target[0].target,'nsis');
assert.equal(pkg.build.nsis.perMachine,false);
assert.equal(pkg.build.nsis.deleteAppDataOnUninstall,false);
const game=path.join(root,'desktop/game');
const html=fs.readFileSync(path.join(game,'index.html'),'utf8');
assert(html.includes("connect-src 'none'"));
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
 const asset=match[1].split('?')[0];
 assert(!/^(https?:|\/)/.test(asset),'Non-local asset: '+asset);
 assert(fs.existsSync(path.join(game,asset)),'Missing bundled asset: '+asset);
}
const ico=fs.readFileSync(path.join(root,'desktop/icon.ico'));
assert.equal(ico.readUInt16LE(2),1);
let has256=false;for(let i=0;i<ico.readUInt16LE(4);i++)if(ico[6+i*16]===0)has256=true;
assert(has256,'Windows icon must include a 256px image');
console.log('PASS: self-contained NSIS config, persistent-save policy, offline CSP, complete local assets and installer icon');
