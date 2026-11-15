// Copies the disabled event into preview builds. Does not build, tag or publish.
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'events/christmas/manifest.json')));
if(manifest.enabled!==false||manifest.automaticActivation!==false)throw Error('Preparation must remain disabled');
for(const dir of ['dist','developer-game']){
 const target=path.join(root,dir);if(!fs.existsSync(target))continue;
 for(const file of ['christmas-config.js','christmas.js'])fs.copyFileSync(path.join(root,'events/christmas',file),path.join(target,file));
 const page=path.join(target,'index.html');let html=fs.readFileSync(page,'utf8');
 if(!html.includes('src="christmas-config.js"'))html=html.replace('</body>','<script src="christmas-config.js"></script><script src="christmas.js"></script></body>');
 fs.writeFileSync(page,html);
}
console.log('Prepared disabled Christmas previews. Nothing published.');

