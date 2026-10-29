(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.UISewingMap=api;})(typeof globalThis!=='undefined'?globalThis:this,root=>{
 const num=v=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(v);
 const point=p=>{if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))throw Error('Некорректная точка схемы');return p.x+' '+p.y;};
 function pathData(segments,reverse=false){
  const rows=reverse?[...segments].reverse().map(s=>({...s,start:s.end,end:s.start,c1:s.c2,c2:s.c1})):segments;
  if(!rows.length)return '';
  return 'M '+point(rows[0].start)+' '+rows.map(s=>s.c1&&s.c2?'C '+point(s.c1)+' '+point(s.c2)+' '+point(s.end):'L '+point(s.end)).join(' ');
 }
 function ranges(indices){
  if(!indices?.length)return 'не определены';const groups=[];
  for(const index of indices){const n=index+1,last=groups.at(-1);if(last&&Math.abs(n-last.at(-1))===1)last.push(n);else groups.push([n]);}
  return groups.map(g=>g.length>2?g[0]+'–'+g.at(-1):g.join(', ')).join('; ');
 }
 function endpointText(e,label){return label+': '+e.piece_name+(e.verified?' · '+e.source_name+' №'+(e.shape_index+1)+' · сегменты '+ranges(e.native_line_indices)+' · '+num(e.length_mm)+' мм':' · '+e.reason);}
 function seamText(s){return [s.order+'. '+s.title,...s.ends.map((e,i)=>endpointText(e,i?'Б':'А')),s.pairing,
  'Допуск '+num(s.tolerance_mm)+' мм; заданная разница длин '+num(s.ease_mm)+' мм'+(s.residual_mm==null?'; фактическая невязка не измерена':'; фактическая невязка '+num(s.residual_mm)+' мм'),
  ...s.marks.filter(m=>m.fraction>0&&m.fraction<1).map(m=>'Метка '+num(m.fraction*100)+'%: '+m.label),
  ...s.issues.map(x=>'Проверить: '+x)].join('\n');}
 function mapText(map){return ['Карта сборки · версия '+map.garment_version,'Сопоставлено в CLO: '+map.mapped_count+' из '+map.seam_count+'. Полностью проверено с метками: '+map.verified_count+'. Швы автоматически не созданы.',map.note,...map.seams.map(seamText),'Порядок работы:',...map.sequence.map((x,i)=>(i+1)+'. '+x)].join('\n\n');}
 let serial=0;
 function diagram(piece,end,marks,side,ui){
  const document=ui.document||root.document,{node}=ui,wrap=node('figure',undefined,'sewing-diagram');
  const svg=(tag,attrs={})=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));return n;};
  const points=piece.outline.flatMap(s=>[s.start,s.end,s.c1,s.c2].filter(Boolean)),xs=points.map(p=>p.x),ys=points.map(p=>p.y);
  const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y,size=Math.max(w,h,1),pad=size*.09;
  const drawing=svg('svg',{viewBox:[x-pad,y-pad,w+2*pad,h+2*pad].join(' '),role:'img','aria-label':(side?'Б: ':'А: ')+piece.name+'; выделен соединяемый участок'});
  const markerID='seam-direction-'+(++serial),defs=svg('defs'),marker=svg('marker',{id:markerID,viewBox:'0 0 6 6',refX:5,refY:3,markerWidth:size*.05,markerHeight:size*.05,markerUnits:'userSpaceOnUse',orient:'auto'});
  marker.append(svg('path',{d:'M 0 0 L 6 3 L 0 6 Z',class:'sewing-arrow'}));defs.append(marker);drawing.append(defs);
  drawing.append(svg('path',{d:pathData(piece.outline)+' Z',class:'sewing-outline','vector-effect':'non-scaling-stroke'}));
  drawing.append(svg('path',{d:pathData(end.path,end.reverse),class:'sewing-span','vector-effect':'non-scaling-stroke','marker-end':'url(#'+markerID+')'}));
  for(const [i,m]of marks.entries()){
   const p=m.ends[side]?.model_point;if(!p)continue;
   const unverified=m.ends[side]?.native_guide?.verified===false;
   drawing.append(svg('circle',{cx:p[0],cy:p[1],r:size*.009,class:unverified?'sewing-mark sewing-mark-unverified':'sewing-mark','vector-effect':'non-scaling-stroke'}));
   if(i===0||i===marks.length-1){const label=svg('text',{x:p[0]+pad*.3,y:p[1]-pad*.25,'font-size':size*.055});label.textContent=(side?'Б':'А')+(i===0?'1':'2');drawing.append(label);}
  }
  wrap.append(drawing,node('figcaption',(side?'Б: ':'А: ')+piece.name));return wrap;
 }
 function render(parent,map,ui=root.UI){
  const {node,api}=ui,panel=node('details',undefined,'sewing-map');panel.open=true;
  panel.append(node('summary','Карта сборки · '+map.mapped_count+' из '+map.seam_count+' соединений сопоставлено'));
  panel.append(node('p','Полностью проверено с контрольными метками: '+map.verified_count+' из '+map.seam_count+'. Швы автоматически не созданы.','muted'));
  panel.append(node('p','Синим выделены участки стачивания. Совместите А1 с Б1, А2 с Б2. Стрелки задают порядок обхода. Внешний срез припуска здесь не показан.','muted'));
  const copy=node('button','Копировать карту');copy.type='button';ui.bindCopy(copy,{copy:()=>api('copy-text',mapText(map)),onSuccess:()=>{copy.textContent='Карта скопирована';},onError:()=>{copy.textContent='Не удалось скопировать — повторить';}});panel.append(copy);
  const pieces=new Map(map.pieces.map(p=>[p.id,p]));let phase;
  for(const seam of map.seams){
   if(phase!==seam.phase){phase=seam.phase;panel.append(node('h3',phase));}
   const card=node('details',undefined,'sewing-card'),label=seam.status==='verified'?'Участки проверены':'Требуется проверка';
   card.append(node('summary',seam.order+'. '+seam.title+' · '+label));
   card.append(node('p',seam.pairing));const figures=node('div',undefined,'sewing-figures');
   seam.ends.forEach((end,side)=>{card.append(node('p',endpointText(end,side?'Б':'А'),end.verified?'':'error'));if(end.verified&&pieces.has(end.piece_id))figures.append(diagram(pieces.get(end.piece_id),end,seam.marks,side,ui));});
   if(figures.children.length)card.append(figures);
   card.append(node('p','Заданная разница длин А − Б: '+num(seam.ease_mm)+' мм. Допуск: '+num(seam.tolerance_mm)+' мм. Фактическая невязка: '+(seam.residual_mm==null?'не измерена':num(seam.residual_mm)+' мм')+'.','muted'));
   const inner=seam.marks.filter(m=>m.fraction>0&&m.fraction<1);
   if(inner.length){const list=node('ul');for(const m of inner){const guides=m.ends.map(e=>e.native_guide).filter(Boolean),state=guides.some(g=>!g.verified)?'метки в CLO требуют проверки':guides.length===m.ends.length?'метки сопоставлены':'позиции по схеме; отдельные метки CLO не проверялись';list.append(node('li',num(m.fraction*100)+'% обхода А: '+m.label+' · '+state));}card.append(list);}
   for(const issue of seam.issues)card.append(node('p',issue,'error'));
   if(seam.ends.some(e=>e.encoding==='legacy_polyline'))card.append(node('p','В этой версии детали линия состоит из прямых отрезков. Новые детали создаются компактными кривыми. Список выше объединяет отрезки одного участка.','muted'));
   panel.append(card);
  }
  const sequence=node('details'),steps=node('ol');sequence.append(node('summary','Последовательность и ручные действия'));for(const step of map.sequence)steps.append(node('li',step));sequence.append(steps,node('p',map.note,'muted'));panel.append(sequence);parent.append(panel);return panel;
 }
 return {pathData,ranges,seamText,mapText,render};
});
