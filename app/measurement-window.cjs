const path=require('node:path');
const SIZE=Object.freeze({width:300,height:600});
const GAP=20;
function position(parent,area){
 return {x:Math.max(area.x,Math.min(parent.x-SIZE.width-GAP,area.x+area.width-SIZE.width)),y:Math.max(area.y,Math.min(parent.y,area.y+area.height-SIZE.height))};
}
function create({BrowserWindow,screen,parent,catalog,show=true}){
 let window=null,current=null,loading=null,opening=0;
 const move=()=>{if(!window||window.isDestroyed()||parent.isDestroyed())return;const bounds=parent.getBounds(),area=screen.getDisplayMatching(bounds).workArea;const p=position(bounds,area);window.setPosition(p.x,p.y,false);};
 function close(){opening++;current=null;const old=window;window=null;loading=null;if(old&&!old.isDestroyed())old.close();}
 parent.on('move',move);parent.on('resize',move);parent.on('closed',close);
 parent.on('minimize',()=>window?.hide());parent.on('restore',()=>{if(show&&current&&window&&!window.isDestroyed())window.showInactive();});
 async function open(id){
  const def=catalog().find(d=>d.id===id);if(!def)throw Error('Мерка не найдена');
  const ticket=++opening;current={id:def.id,name:def.name,unit:({mm:'см',kg:'кг',year:'лет',deg:'°'})[def.unit]||def.unit,help:def.help||require('./measurement-help.js').getHelp(def)};
  if(!window||window.isDestroyed()){
   // Make room on the left only when the whole pair fits on this display.
   const bounds=parent.getBounds(),area=screen.getDisplayMatching(bounds).workArea;
   if(bounds.x-SIZE.width-GAP<area.x&&area.width>=bounds.width+SIZE.width+GAP)parent.setPosition(area.x+SIZE.width+GAP,bounds.y,false);
   const created=new BrowserWindow({...SIZE,minWidth:SIZE.width,maxWidth:SIZE.width,minHeight:SIZE.height,maxHeight:SIZE.height,parent,modal:false,show:false,resizable:false,maximizable:false,minimizable:false,fullscreenable:false,title:'Как снять мерку',backgroundColor:'#060606',icon:path.join(__dirname,'assets/clo-ai.ico'),webPreferences:{preload:path.join(__dirname,'measurement-preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,offscreen:!show}});
   window=created;created.setMenuBarVisibility(false);created.webContents.setWindowOpenHandler(()=>({action:'deny'}));
   created.on('closed',()=>{if(window===created){window=null;loading=null;current=null;opening++;}});
   loading=created.loadFile(path.join(__dirname,'measurement-window.html'));
  }
  const target=window;move();await loading;
  if(ticket!==opening||window!==target||target.isDestroyed())return {cancelled:true};
  target.webContents.send('measurement-help-updated',current);if(show)target.showInactive();return {opened:true,id:current.id};
 }
 return {open,close,state:()=>current,owns:sender=>!!window&&!window.isDestroyed()&&window.webContents===sender,window:()=>window};
}
module.exports={create,position,SIZE};
