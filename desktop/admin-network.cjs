const ADMIN_ORIGIN='https://the-spare-room.sunsetjelly6.chatgpt.site';
function allowAdminRequest(details,fromLocalGame){
 if(!fromLocalGame||!['POST','OPTIONS'].includes(details.method)||details.resourceType!=='xhr')return false;
 try{const u=new URL(details.url);return u.origin===ADMIN_ORIGIN&&!u.username&&!u.password&&!u.search&&!u.hash&&['/api/admin/login','/api/admin/authorize'].includes(u.pathname);}catch{return false;}
}
module.exports={allowAdminRequest};
