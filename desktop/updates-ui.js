const api=window.spareUpdates,$=id=>document.getElementById(id);
let lastState={},dirty=false,saving=false;
function preferenceStatus(){
 const changed=$('prereleases').checked!==lastState.preferences?.allowPrereleases;
 $('preferences-status').textContent=changed?'Unsaved changes. Save preferences to apply this choice.':lastState.preferences?.allowPrereleases?'Saved: stable releases and prereleases.':'Saved: latest stable releases only.';
}
function render(state){
 lastState=state;
 const busy=['checking','downloading','verifying','installing'].includes(state.phase);
 const notes=state.notes||state.release&&{version:state.release.version,body:state.release.notes};
 if(!dirty||saving)$('prereleases').checked=!!state.preferences?.allowPrereleases;
 preferenceStatus();
 $('title').textContent=state.notes?'Updated to v'+state.notes.version:state.phase==='available'?(state.release?.refresh?'A refreshed build is available':state.release?.prerelease?'A new prerelease is available':'A new release is available'):'Game updates';
 $('status').textContent=state.message;
 $('version').textContent='Installed: '+state.currentVersion+(state.currentRevision?' · build '+state.currentRevision:'')+(state.currentPrerelease?' · prerelease':'')+(state.lastChecked?' · Last checked: '+new Date(state.lastChecked).toLocaleString():'');
 $('progress').hidden=state.phase!=='downloading';$('progress').value=state.progress||0;
 $('install').hidden=state.phase!=='available'||!state.release?.canInstall;
 for(const id of ['install','check','save-token','clear-token','save-preferences','prereleases'])$(id).disabled=busy||saving;
 $('notes-section').hidden=!notes;$('notes').textContent=notes?.body||'';
 $('access-status').textContent=state.hasToken?'Optional GitHub access is saved on this device.':'Using public updates. No login required.';
 if(state.phase==='access')$('access').open=true;
}
async function action(fn){try{const state=await fn();if(state)render(state)}catch{$('status').textContent='That action could not finish. Please try again.'}}
$('prereleases').onchange=()=>{dirty=true;preferenceStatus()};
$('save-preferences').onclick=async()=>{
 const allowPrereleases=$('prereleases').checked;saving=true;
 for(const id of ['save-preferences','prereleases','check','install'])$(id).disabled=true;
 try{const state=await api.savePreferences({allowPrereleases});dirty=false;saving=false;render(state)}
 catch{saving=false;render(lastState);$('preferences-status').textContent='Preferences were not saved. Wait for the current action and try again.'}
};
$('check').onclick=()=>action(()=>api.check());
$('install').onclick=()=>action(()=>api.install());
$('github').onclick=()=>action(()=>api.openLatest());
$('close').onclick=()=>api.close();
$('save-token').onclick=()=>{const token=$('token').value;$('token').value='';action(()=>api.saveToken(token))};
$('clear-token').onclick=()=>action(()=>api.clearToken());
api.onStatus(render);action(()=>api.state());
