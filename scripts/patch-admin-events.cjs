const fs=require('node:fs');
function patchAdminEvents(root='dist'){
 const path=root+'/release-event.js';if(!fs.existsSync(path))return;
 let s=fs.readFileSync(path,'utf8');
 if(!s.includes('let eventAdminAuthorizer='))s=s.replace("let releaseAccess='locked';","let releaseAccess='locked';\n// Private admin session supplies a temporary capability; normal players keep the real clock.\nlet eventAdminAuthorizer=()=>false;\nfunction adminMayEnterEvent(week){return eventAdminAuthorizer(week)===true;}");
 s=s.replace("week==='week2'&&eventTimeRemaining()>0)","week==='week2'&&eventTimeRemaining()>0&&!adminMayEnterEvent(week))");
 if(!s.includes('eventAdminLogin'))s=s.replace('gameScene.append(eventOverlay);',"const eventAdminLogin=eventElement('button','event-secondary','Admin login / event previews',eventActions);eventAdminLogin.type='button';eventAdminLogin.onclick=()=>window.spareAdmin?.open();\ngameScene.append(eventOverlay);");
 fs.writeFileSync(path,s);
 const w=root+'/week3.js';if(fs.existsSync(w)){let t=fs.readFileSync(w,'utf8');t=t.replace("week==='week3'&&week3Remaining()>0)","week==='week3'&&week3Remaining()>0&&!adminMayEnterEvent(week))");if(!t.includes('week3AdminLogin'))t=t.replace('const week3PreviousRefresh=refreshReleaseEvent;',"const week3AdminLogin=eventElement('button','event-secondary','Admin login / preview Week 3');week3AdminLogin.onclick=()=>window.spareAdmin?.open();\nconst week3PreviousRefresh=refreshReleaseEvent;");fs.writeFileSync(w,t);}
}
module.exports={patchAdminEvents};if(require.main===module)patchAdminEvents(process.argv[2]||'dist');
