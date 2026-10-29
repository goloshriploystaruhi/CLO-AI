const fs=require('node:fs'),path=require('node:path'),{randomUUID,createHash}=require('node:crypto');
const geometry=require('./print-patterns-geometry.cjs');
const formats=Object.freeze({A4:{width:210,height:297},A0:{width:841,height:1189}}),MAX_PAGES=256;
function options(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Некорректные параметры печати');
 for(const key of Object.keys(input))if(!['format','BrowserWindow','timeoutMs'].includes(key))throw Error('Неизвестный параметр печати: '+key);
 const format=input.format||'A4';if(!Object.hasOwn(formats,format))throw Error('Выберите формат A4 или A0');
 const timeoutMs=input.timeoutMs??45000;if(!Number.isInteger(timeoutMs)||timeoutMs<1000||timeoutMs>120000)throw Error('Некорректное время подготовки PDF');
 return {...input,format,timeoutMs};
}
function plan(garment,input={}){
 const config=options(input),paper=formats[config.format];
 if(!garment||!Array.isArray(garment.pieces)||!garment.pieces.length||garment.pieces.length>64)throw Error('Для печати нужен комплект из 1–64 деталей');
 if(!Number.isInteger(garment.version)||garment.version<1||garment.version>1000000)throw Error('Некорректная версия конструкции');
 if(garment.qa_report?.valid===false)throw Error('Печать остановлена: в проверке конструкции есть ошибки. Сначала исправьте их');
 const names=new Set(),ids=new Set(),frame={x:10,y:28,width:paper.width-20,height:paper.height-48},overlap=10,step={x:frame.width-overlap,y:frame.height-overlap};
 const pieces=garment.pieces.map((p,index)=>{const item=geometry.inspectPiece(p,index);if(typeof p.id!=='string'||!p.id||p.id.length>200||ids.has(p.id))throw Error('У детали отсутствует уникальный идентификатор');ids.add(p.id);if(typeof p.role!=='string'||!p.role||names.has(p.role))throw Error('У детали отсутствует уникальная роль');names.add(p.role);item.label=geometry.labelPlacement(p);return item;});
 if(pieces.reduce((sum,p)=>sum+p.piece.cut_contour.length+p.piece.seam_contour.length,0)>30000)throw Error('В комплекте слишком много сегментов для одного PDF');
 const pages=[];
 for(const item of pieces){const box={left:item.visualBounds.left-5,top:item.visualBounds.top-5,width:item.visualBounds.width+10,height:item.visualBounds.height+10};
  const columns=Math.max(1,Math.ceil((box.width-overlap)/step.x)),rows=Math.max(1,Math.ceil((box.height-overlap)/step.y));
  if(pages.length+columns*rows+1>MAX_PAGES)throw Error('Для печати требуется больше '+MAX_PAGES+' листов. Выберите A0 или разделите комплект');
  item.rows=rows;item.columns=columns;item.box=box;
  for(let row=0;row<rows;row++)for(let column=0;column<columns;column++)pages.push({piece_index:item.index,row,column,rows,columns,x:box.left+column*step.x,y:box.top+row*step.y,width:frame.width,height:frame.height});
 }
 const warnings=['Печатайте в масштабе 100%, без подгонки под страницу. Перед раскроем измерьте контрольный квадрат 100 × 100 мм.','Проверка геометрии не подтверждает посадку. Нужны примерка макета и технологическая проверка перед раскроем основной ткани.','Крестики обозначают точки совмещения на линии стачивания. Это не вырезаемые надсечки; перенесите метки на ткань и проверьте глубину надсечек отдельно.'];
 if(garment.qa_report?.valid!==true)warnings.unshift('У комплекта нет положительного отчёта проверки. PDF предназначен для пробной печати и проверки макета.');
 if(pieces.some(p=>!p.label))warnings.push('На узких или сложных деталях маркировка вынесена в заголовок листа. Перенесите номер детали до вырезания бумажного лекала.');
 const fingerprint=createHash('sha256').update(JSON.stringify({id:garment.id,version:garment.version,pieces:garment.pieces})).digest('hex');
 return {version:1,garment_id:String(garment.id||''),garment_name:String(garment.name||'Комплект лекал').slice(0,300),construction_version:garment.version,format:config.format,paper_mm:paper,frame_mm:frame,overlap_mm:overlap,scale_percent:100,calibration_mm:100,page_count:pages.length+1,part_count:pieces.length,geometry_fingerprint:fingerprint,pieces,pages,warnings,printer_scale_verified:false,sewing_ready:false,fit_verified:false};
}
function registration(tile,p){
 const marks=[],half=2,add=(x,y,label)=>marks.push('<g stroke="#777" stroke-width=".2" fill="none"><path d="M '+(x-half)+' '+y+' h 4 M '+x+' '+(y-half)+' v 4"/><circle cx="'+x+'" cy="'+y+'" r="1.2"/><title>'+label+'</title><text x="'+(x+(x-tile.x>tile.width/2?-3:3))+'" y="'+(y+(y-tile.y<10?4:-2))+'" text-anchor="'+(x-tile.x>tile.width/2?'end':'start')+'" font-family="Arial" font-size="2.3" stroke="none" fill="#777">Склейка</text></g>');
 const o=p.overlap_mm,stepX=tile.width-o,stepY=tile.height-o;
 for(const edge of [0,1]){if((edge===0&&tile.column===0)||(edge===1&&tile.column===tile.columns-1))continue;const x=tile.x+(edge?stepX+o/2:o/2);for(const y of [tile.y+15,tile.y+tile.height-15])add(x,y,'Совместить соседние столбцы');}
 for(const edge of [0,1]){if((edge===0&&tile.row===0)||(edge===1&&tile.row===tile.rows-1))continue;const y=tile.y+(edge?stepY+o/2:o/2);for(const x of [tile.x+15,tile.x+tile.width-15])add(x,y,'Совместить соседние ряды');}
 return marks.join('');
}
function renderHTML(p){
 const esc=geometry.escape,{width,height}=p.paper_mm,frame=p.frame_mm;
 const footer=number=>'<footer>Лист '+number+' / '+p.page_count+' · '+p.format+' · Масштаб 100% · Версия '+p.construction_version+'</footer>';
 const guide='<section class="page guide"><h1>'+esc(p.garment_name)+'</h1><p>Лекала для печати в натуральную величину · '+p.part_count+' '+(p.part_count%10===1&&p.part_count%100!==11?'деталь':p.part_count%10>=2&&p.part_count%10<=4&&!(p.part_count%100>=12&&p.part_count%100<=14)?'детали':'деталей')+'</p><h2>Проверка масштаба</h2><svg class="calibration" width="110mm" height="110mm" viewBox="-5 -5 110 110"><rect id="calibration-100mm" x="0" y="0" width="100" height="100" fill="none" stroke="black" stroke-width=".3"/><path d="M 0 0 L 100 100 M 100 0 L 0 100" stroke="#999" stroke-width=".15"/><text x="50" y="48" text-anchor="middle" font-family="Arial" font-size="5">100 × 100 мм</text><text x="50" y="56" text-anchor="middle" font-family="Arial" font-size="3.5">Измерьте обе стороны</text></svg><div class="guide-notes"><h2>Печать и сборка листов</h2><ol><li>Печатайте один контрольный лист. Отключите «Вписать» и «Уменьшить большие страницы».</li><li>Измерьте квадрат по обеим осям. Если размер отличается от 100 мм, исправьте настройки принтера.</li><li>Детали крупнее листа разделены на ряды и столбцы. Совмещайте крестики, перекрытие '+p.overlap_mm+' мм.</li><li>Левая и правая детали уже отражены в геометрии. Не отражайте их повторно.</li></ol><h2>Обозначения</h2><p>Сплошная линия - срез с припуском. Штриховая - линия стачивания. Линия со стрелками - долевая. Точки с крестиком - контрольные метки. Частый пунктир - внутренние линии. Крестики «Склейка» служат для сборки листов.</p><h2>Перед раскроем</h2>'+p.warnings.map(w=>'<p>'+esc(w)+'</p>').join('')+'</div>'+footer(1)+'</section>';
 const tiles=p.pages.map((tile,index)=>{const item=p.pieces[tile.piece_index],piece=item.piece,svg='<svg class="pattern" x="0" y="0" width="'+frame.width+'mm" height="'+frame.height+'mm" viewBox="'+tile.x+' '+tile.y+' '+tile.width+' '+tile.height+'" aria-label="'+esc(item.name)+'">'+geometry.drawing(piece,{prefix:'p'+index})+geometry.annotation(piece,item.index,item.label)+registration(tile,p)+'<rect x="'+tile.x+'" y="'+tile.y+'" width="'+tile.width+'" height="'+tile.height+'" fill="none" stroke="#aaa" stroke-width=".15"/></svg>';
  return '<section class="page"><header><strong>'+esc(item.name)+'</strong><span>Деталь '+(item.index+1)+' / '+p.part_count+' · Раскроить: '+piece.cut_quantity+' шт. · Припуск: '+piece.allowance_mm+' мм</span><small>ID: '+esc(piece.id)+' · Ряд '+(tile.row+1)+'/'+tile.rows+', столбец '+(tile.column+1)+'/'+tile.columns+'</small></header>'+svg+footer(index+2)+'</section>';}).join('');
 return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src \'none\'; font-src \'none\'"><title>'+esc(p.garment_name)+'</title><style>@page{size:'+width+'mm '+height+'mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;font-family:Arial,"Segoe UI",sans-serif;color:#000}.page{width:'+width+'mm;height:'+height+'mm;position:relative;overflow:hidden;break-after:page}.page:last-child{break-after:auto}header{position:absolute;left:10mm;right:10mm;top:6mm;height:20mm;overflow:hidden;font-size:3.3mm;line-height:4.5mm}header{overflow-wrap:anywhere}header strong{font-size:4mm}header span,header small{display:block}header small{font-size:2.8mm}footer{position:absolute;bottom:7mm;left:10mm;right:10mm;font-size:3mm;line-height:4mm}.pattern{position:absolute;left:'+frame.x+'mm;top:'+frame.y+'mm}.guide{padding:10mm;font-size:3.5mm;line-height:4.7mm}.guide h1{font-size:6mm;line-height:7mm;margin:0 0 3mm}.guide h2{font-size:4.2mm;margin:3mm 0 2mm}.guide p{margin:1.5mm 0}.calibration{display:block;margin:2mm 0}.guide-notes{max-width:185mm}.guide ol{margin:0;padding-left:5mm}</style></head><body>'+guide+tiles+'</body></html>';
}
async function exportPrint(garment,directory,input={}){
 const config=options(input);if(typeof config.BrowserWindow!=='function')throw Error('Для подготовки PDF нужен встроенный Electron');if(typeof directory!=='string'||!path.isAbsolute(directory))throw Error('Для PDF требуется абсолютная папка экспорта');
 const p=plan(garment,config),html=renderHTML(p);if(Buffer.byteLength(html)>24000000)throw Error('Комплект слишком большой для одного PDF');
 let win,timer;
 try{
  win=new config.BrowserWindow({show:false,width:800,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,offscreen:true,backgroundThrottling:false,partition:'pattern-print-'+randomUUID()}});win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  const operation=(async()=>{await win.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(html));await win.webContents.executeJavaScript('document.fonts.ready');await win.webContents.executeJavaScript('for(const n of document.querySelectorAll("[data-label-width]")){const width=Number(n.dataset.labelWidth);if(n.getBBox().width>width){n.setAttribute("textLength",String(width));n.setAttribute("lengthAdjust","spacingAndGlyphs");}}for(const n of document.querySelectorAll("header")){if(n.scrollHeight>n.clientHeight){n.querySelector("strong").style.fontSize="3mm";n.style.lineHeight="3.6mm";n.querySelector("small").style.fontSize="2.5mm";}}');
   const layout=await win.webContents.executeJavaScript('({pages:document.querySelectorAll(".page").length,calibration:document.querySelector(".calibration rect").getBoundingClientRect().width,pageWidth:document.querySelector(".page").getBoundingClientRect().width,headerOverflow:[...document.querySelectorAll("header")].some(n=>n.scrollHeight>n.clientHeight+1),overflow:[...document.querySelectorAll(".guide-notes")].some(n=>n.getBoundingClientRect().bottom>document.querySelector("footer").getBoundingClientRect().top)})');
   if(layout.pages!==p.page_count||Math.abs(layout.calibration-100*96/25.4)>.1||Math.abs(layout.pageWidth-p.paper_mm.width*96/25.4)>.1||layout.overflow||layout.headerOverflow)throw Error('Не удалось подтвердить размещение и масштаб PDF');
   return win.webContents.printToPDF({pageSize:config.format,preferCSSPageSize:true,scale:1,printBackground:true,displayHeaderFooter:false,margins:{top:0,bottom:0,left:0,right:0},generateTaggedPDF:false});})();
  const buffer=await Promise.race([operation,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Истекло время подготовки PDF')),config.timeoutMs);})]);
  if(buffer.subarray(0,5).toString()!=='%PDF-')throw Error('Не удалось создать PDF');
  fs.mkdirSync(directory,{recursive:true});const pdf=path.join(directory,'v'+p.construction_version+'-'+config.format+'-1to1.pdf'),manifestFile=pdf.replace(/\.pdf$/,'.json'),temp=pdf+'.'+randomUUID()+'.tmp';
  try{fs.writeFileSync(temp,buffer,{flag:'wx'});fs.renameSync(temp,pdf);}finally{try{fs.unlinkSync(temp);}catch{}}
  const manifest={...p,pieces:p.pieces.map(({piece,index,name,bounds,visualBounds,rows,columns,label})=>({id:piece.id,role:piece.role,index,name,bounds,visual_bounds:visualBounds,cut_quantity:piece.cut_quantity,allowance_mm:piece.allowance_mm,grainline_mm:piece.grainline,alignment_mark_count:piece.notches.length,internal_line_count:piece.internal_lines.length,interior_label:label,rows,columns})),created_at:new Date().toISOString(),paths:{pdf,manifest:manifestFile}};
  require('./atomic-json.cjs').writeJSON(manifestFile,manifest,{backup:false});
  return {format:p.format,scale_percent:100,page_count:p.page_count,part_count:p.part_count,calibration_mm:100,paths:manifest.paths,warnings:p.warnings,print_preparation:'created',sewing_ready:false,fit_verified:false};
 }finally{clearTimeout(timer);if(win&&!win.isDestroyed())win.destroy();}
}
module.exports={formats,plan,renderHTML,exportPrint,options};
