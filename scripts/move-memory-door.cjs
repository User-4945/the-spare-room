const fs=require('node:fs');
const file=process.argv[2]||'dist/week3.js';let s=fs.readFileSync(file,'utf8');
if(s.includes('Interior memory-house entrance · refresh'))process.exit(0);
const old="box(-2.5,0,-3.5,1.6,2.6,.12,'#594a43',true);box(-2.5,2.6,-3.5,1.9,.12,.24,'#a38d6c');for(const x of [-3.38,-1.62])box(x,0,-3.5,.12,2.7,.22,'#a38d6c',true);";
if(!s.includes(old))throw Error('Unexpected memory-door source');
s=s.replace(old,"/* Interior memory-house entrance · refresh */box(-1.39,0,9.6,.07,2.35,1.1,'#594a43',true);box(-1.36,2.35,9.6,.12,.12,1.3,'#a38d6c');for(const z of [8.99,10.21])box(-1.36,0,z,.12,2.4,.12,'#a38d6c',true);box(-1.29,1,9.92,.07,.06,.12,'#bca579');")
.replace('p:[-2.5,1.2,-3.38]','p:[-1.29,1.2,9.6]')
.replace("house.z=inside?13.5:-4.5;house.a=inside?0:Math.PI;", "house.z=inside?13.5:9.6;house.a=inside?0:-Math.PI/2;")
.replace("s.room=inside?'last_house':'garden'", "s.room=inside?'last_house':'hall'")
.replace("action:'Return to the garden'", "action:'Return to the hallway'")
.replaceAll('final door beside the garden path, on the shed side','final door on the left-hand wall at the far end of the ground-floor hallway')
.replaceAll('final door beside the garden path','final door inside the ground-floor hallway')
.replace("engineLabel(e.world,['THE FINAL HOUSE','ONE LAST DOOR'],-2.5,2.15,3.4,1.5,.45,theme).rotation.y=Math.PI", "engineLabel(e.world,['THE FINAL HOUSE','ONE LAST DOOR'],-1.28,2.13,-9.6,.95,.3,theme).rotation.y=Math.PI/2");
fs.writeFileSync(file,s);
