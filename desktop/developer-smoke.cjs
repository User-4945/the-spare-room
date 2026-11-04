module.exports=async function({win,updates,version,verifySave}){
 const result=await win.webContents.executeJavaScript(`(async()=>{
 if(!advancedEngine||advancedEngine.failed)throw Error('Developer 3D renderer failed');
 if(BENEATH.diary.length!==20||BENEATH.anomalies.length!==25||BENEATH.endings.length!==30)throw Error('Developer content missing');
 reset();s.started=true;close();deepMove('storage');close();if(!deepAdminSpawn('coat'))throw Error('Developer event failed');house.frameSeconds=.5;updateMovement(.04);renderAdvanced();if(deepRuntime.elapsed!==.5||anomalyCaption.style.opacity!=='1'||advancedEngine.failed)throw Error('Developer event animation/caption failed');
 if(STORY_KEY!=='spare-room-beneath-v3')throw Error('Developer save isolation failed');
 if(${verifySave}&&localStorage.getItem('desktop-developer-smoke-save')!=='3.0.0')throw Error('Developer save did not persist');
 localStorage.setItem('desktop-developer-smoke-save','3.0.0');save();return {ok:true,saveVerified:${verifySave},version:'3.0.0',developer:true};
 })()`);
 await updates.open();const p=updates.getWindow();await p.webContents.executeJavaScript(`(async()=>{const s=await window.spareUpdates.state();if(!document.getElementById('settings-admin-form')||!document.getElementById('developer-versions')||!document.getElementById('developer-settings').hidden||s.preferences.allowDeveloperVersions)throw Error('Secret developer setting missing or on by default');})()`);
 return result;
};
