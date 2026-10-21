// Match the texture to the physical board. Never squeeze glyphs with fillText(maxWidth).
const signThemes={
 station:['#193b39','#f3e8cd','#be5142','Arial','transport'],
 library:['#243749','#f0dfb6','#bfa16a','Georgia','heritage'],
 cinema:['#56272c','#fff0c7','#cfaa60','Trebuchet MS','marquee'],
 clinic:['#e5eee5','#205752','#4d8580','Arial','medical'],
 chapel:['#343a33','#ece3c8','#a58c5f','Georgia','heritage'],
 radio:['#252e2d','#e8cf87','#9ba87a','Courier New','technical'],
 cafe:['#513b2e','#f3dfb9','#c49867','Georgia','heritage'],
 laundry:['#c6d8cc','#234f53','#648c89','Arial','clean'],
 postoffice:['#843f32','#f6e4c3','#d4b78b','Courier New','transport'],
 workshop:['#303934','#e6c59b','#a77a4a','Courier New','technical'],
 florist:['#354c3b','#f2e6d1','#b8a27e','Georgia','heritage'],
 bakery:['#e3cda6','#61432e','#a97b4e','Georgia','heritage'],
 apartments:['#475456','#eee8d5','#9eacaa','Arial','clean'],
 hotel:['#4e3037','#ecdbb6','#b99a65','Georgia','heritage'],
 market:['#3c5040','#f4e2aa','#c49c54','Trebuchet MS','transport'],
 greenhouse:['#29473e','#e5e4c7','#97b09c','Georgia','heritage'],
 waterworks:['#334f58','#e1e9df','#97b7b5','Arial','technical'],
 garage:['#3e4648','#ecd5ae','#ba7754','Courier New','technical'],
 bookshop:['#594837','#f1e1bc','#b8a17a','Georgia','heritage'],
 playground:['#405771','#f4e4c4','#b89871','Trebuchet MS','clean']
};
function buildingSignTheme(id){let t=signThemes[id]||['#d6c5a0','#343a30','#8a7655','Georgia','heritage'];return {id,bg:t[0],fg:t[1],accent:t[2],font:t[3],style:t[4]}}
function signTextLayout(g,lines,width,height,theme){
 const pad=Math.max(4,height*.14),maxWidth=width-pad*2,maxHeight=height-pad*2;
 let size=Math.floor(Math.min(height*.58,maxHeight/(lines.length*1.16)));
 const font=n=>'bold '+n+'px "'+(theme.font||'Arial')+'"';
 while(size>2){g.font=font(size);if(lines.every(line=>g.measureText(line).width<=maxWidth))break;size--}
 g.font=font(size);
 return {size,font:g.font,pad,maxWidth,maxHeight,lineHeight:size*1.16,widths:lines.map(line=>g.measureText(line).width)};
}
function makeSignLabel(parent,lines,x,y,z,w,h,style='#e1d8ac'){
 const theme=typeof style==='string'?{bg:style,fg:'#27332c',accent:'#8d8264',font:'Arial'}:style;
 const c=document.createElement('canvas');
 c.width=Math.min(1536,Math.max(192,Math.round(w*300)));c.height=Math.max(32,Math.round(c.width*h/w));
 const g=c.getContext('2d'),W=c.width,H=c.height;
 if(theme.bg){g.fillStyle=theme.bg;g.fillRect(0,0,W,H)}
 if(theme.border!==false){
  g.strokeStyle=theme.accent;g.lineWidth=Math.max(1.5,H*.015);g.strokeRect(H*.055,H*.055,W-H*.11,H-H*.11);
  if(theme.style==='heritage')g.strokeRect(H*.09,H*.09,W-H*.18,H-H*.18);
  if(theme.style==='marquee'){g.fillStyle=theme.accent;for(let a=H*.13;a<W-H*.1;a+=H*.22)for(let b of [H*.06,H*.94]){g.beginPath();g.arc(a,b,H*.022,0,Math.PI*2);g.fill()}}
  if(theme.style==='transport'){g.fillStyle=theme.accent;g.fillRect(H*.05,H*.05,H*.065,H*.9);g.fillRect(W-H*.115,H*.05,H*.065,H*.9)}
 }
 const layout=signTextLayout(g,lines,W,H,theme);g.fillStyle=theme.fg||'#27332c';g.textAlign='center';g.textBaseline='middle';
 lines.forEach((line,i)=>g.fillText(line,W/2,H/2+(i-(lines.length-1)/2)*layout.lineHeight));
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,side:THREE.FrontSide,transparent:!theme.bg}));
 mesh.position.set(x,y,z);mesh.userData.sign={lines,theme,layout,width:W,height:H,worldWidth:w,worldHeight:h};parent.add(mesh);return mesh;
}
