const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('clo',{
 call:(method,arg)=>ipcRenderer.invoke('call',method,arg),
 onCompletionAttention:callback=>{const listener=(_,data)=>{if(typeof data?.play==='boolean')callback({play:data.play});};ipcRenderer.on('completion-attention',listener);return ()=>ipcRenderer.removeListener('completion-attention',listener);},
 onCompletionOpenChat:callback=>{const listener=()=>callback();ipcRenderer.on('completion-open-chat',listener);return ()=>ipcRenderer.removeListener('completion-open-chat',listener);}
});
