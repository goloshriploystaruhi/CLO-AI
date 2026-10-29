const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('measurementHelp',{
 current:()=>ipcRenderer.invoke('call','measurement-help-state'),
 onUpdate:callback=>{ipcRenderer.on('measurement-help-updated',(_,value)=>callback(value));}
});
