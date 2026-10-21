const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('spareUpdates',Object.freeze({
 open:()=>ipcRenderer.invoke('updates:open'),
 state:()=>ipcRenderer.invoke('updates:state'),
 check:()=>ipcRenderer.invoke('updates:check'),
 savePreferences:preferences=>ipcRenderer.invoke('updates:preferences',preferences),
 install:()=>ipcRenderer.invoke('updates:install'),
 openLatest:()=>ipcRenderer.invoke('updates:latest'),
 saveToken:token=>ipcRenderer.invoke('updates:token',token),
 clearToken:()=>ipcRenderer.invoke('updates:clear-token'),
 close:()=>ipcRenderer.invoke('updates:close'),
 onStatus:callback=>{const listener=(_event,state)=>callback(state);ipcRenderer.on('updates:status',listener);return()=>ipcRenderer.removeListener('updates:status',listener)}
}));
