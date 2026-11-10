// Deterministic narrative-data conversion; no executable browser code enters Roblox.
function lua(value){
 if(value===null)return 'nil';
 if(typeof value==='string')return JSON.stringify(value);
 if(typeof value==='number'||typeof value==='boolean')return String(value);
 if(Array.isArray(value))return '{'+value.map(lua).join(',')+'}';
 return '{'+Object.entries(value).map(([key,item])=>'['+lua(key)+']='+lua(item)).join(',')+'}';
}
module.exports=data=>'-- Generated from the published original game source. Do not hand-edit narrative text.\nreturn '+lua(data)+'\n';
