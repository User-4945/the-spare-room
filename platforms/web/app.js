(()=>{
 const info=window.spareInstallInfo,coarse=matchMedia('(pointer: coarse)').matches;
 let promptEvent,registration,pausedHere=false;
 const button=document.createElement('button');button.id='install-game';button.textContent='INSTALL';button.setAttribute('aria-label','Install game and offline settings');document.body.append(button);
 const panel=document.createElement('dialog');panel.id='install-panel';
 panel.innerHTML='<form method="dialog"><button class="install-close" aria-label="Close install settings">×</button></form><p class="small">THE SPARE ROOM</p><h2>Take the house with you</h2><p id="install-version"></p><p id="offline-status" role="status">Preparing offline play…</p><button id="install-native" hidden>Install game</button><p>On <strong>Android</strong>, open the browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p><p>On <strong>iPhone or iPad</strong>, open this page in Safari, tap <strong>Share → Add to Home Screen</strong>, then <strong>Add</strong>. Enable <strong>Open as Web App</strong> if shown.</p><p>Open the installed app once while online and wait for “Ready to play offline”. Saves stay on this device. Browser storage removal also removes offline files and saves.</p><button id="refresh-offline" hidden>Save and apply update</button><p><a href="https://github.com/User-4945/the-spare-room/releases" target="_blank" rel="noopener">Windows, Mac and Linux downloads</a></p><p class="small">Drag to look · movement buttons to walk · RUN / JUMP · USE to interact. Landscape gives you more room.</p>';
 document.body.append(panel);
 const status=panel.querySelector('#offline-status'),install=panel.querySelector('#install-native'),refresh=panel.querySelector('#refresh-offline');
 panel.querySelector('#install-version').textContent='Version '+info.version+(info.prerelease?' · Prerelease':' · Stable');
 button.onclick=()=>{if(typeof paused==='function'&&!paused()){pausedHere=true;modal('Game paused','Installation settings are open.',[['Resume',()=>close()]])}panel.showModal()};
 panel.addEventListener('close',()=>{if(pausedHere){pausedHere=false;close()}});
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;install.hidden=false});
 install.onclick=async()=>{if(!promptEvent)return;await promptEvent.prompt();await promptEvent.userChoice;promptEvent=null;install.hidden=true};
 window.addEventListener('appinstalled',()=>{install.hidden=true;button.textContent='OFFLINE APP'});
 let updating=false;
 refresh.onclick=()=>{if(registration?.waiting){if(typeof save==='function')save();updating=true;registration.waiting.postMessage({type:'ACTIVATE_UPDATE'})}};
 if('serviceWorker' in navigator&&location.protocol!=='file:'){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(updating)location.reload();else status.textContent='Ready to play offline'});
  navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(async r=>{
   registration=r;await navigator.serviceWorker.ready;status.textContent='Ready to play offline';
   const pending=()=>{if(r.waiting){refresh.hidden=false;status.textContent='An offline update is ready. Save and apply it when you finish playing.'}};
   pending();r.addEventListener('updatefound',()=>r.installing?.addEventListener('statechange',pending));
  }).catch(()=>{status.textContent='Offline setup could not finish. Reconnect and reload to try again.'});
 }else status.textContent='This browser cannot save an offline copy. You can keep playing online.';
 if(coarse){
  document.body.classList.add('touch-game');
  const clear=()=>{house.keys={};house.drag=null;house.press=null};
  window.addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{clear();if(document.hidden){if(typeof save==='function')save();if(!paused())modal('Game paused','Your progress is saved. Resume when you are ready.',[['Resume',()=>close()]])}});
  for(const [label,key] of [['LEFT','a'],['RIGHT','d']]){const b=document.createElement('button');b.textContent=label;b.setAttribute('aria-label','Strafe '+label.toLowerCase());b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(!paused())house.keys[key]=true};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>delete house.keys[key];controls.append(b)}
  const use=document.createElement('button');use.id='touch-use';use.textContent='USE';use.setAttribute('aria-label','Interact with highlighted object');use.onclick=()=>{if(!paused()){house.pointer=null;updateTargets();if(house.target){tone();house.target.fn()}}};gameScene.append(use);
  canvas.addEventListener('pointerup',()=>{house.pointer=null;house.dirty=true});
  for(const b of controls.children)b.addEventListener('lostpointercapture',()=>{house.keys={}});
  if(typeof advancedEngine!=='undefined'&&advancedEngine?.renderer){advancedEngine.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.2));advancedEngine.sun.shadow.mapSize.set(1024,1024);advancedEngine.sun.shadow.map?.dispose();advancedEngine.sun.shadow.map=null;house.dirty=true}
 }
})();
