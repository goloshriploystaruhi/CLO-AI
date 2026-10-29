// Geometry used by SVG and print exports. Coordinates stay in source millimetres.
const escape=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function point(p){if(!Array.isArray(p)||p.length!==2||!p.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=100000))throw Error('Контур содержит некорректную координату');return p;}
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function pointAt(s,t){return s.c1?[0,1].map(i=>(1-t)**3*s.start[i]+3*(1-t)**2*t*s.c1[i]+3*(1-t)*t*t*s.c2[i]+t**3*s.end[i]):[0,1].map(i=>s.start[i]*(1-t)+s.end[i]*t);}
function contour(segments,label='Контур'){
 if(!Array.isArray(segments)||segments.length<2||segments.length>8000)throw Error(label+': допустимо 2–8000 сегментов');
 for(let i=0;i<segments.length;i++){const s=segments[i];point(s.start);point(s.end);if(!!s.c1!==!!s.c2)throw Error(label+': неполная кривая Безье');if(s.c1){point(s.c1);point(s.c2);}if(distance(s.end,segments[(i+1)%segments.length].start)>.01)throw Error(label+': контур не замкнут или содержит разрыв');}
 return segments;
}
function extrema(a,b,c,d){
 const A=-a+3*b-3*c+d,B=2*(a-2*b+c),C=b-a,out=[];
 if(Math.abs(A)<1e-12){if(Math.abs(B)>1e-12)out.push(-C/B);}else{const q=B*B-4*A*C;if(q>=0){out.push((-B+Math.sqrt(q))/(2*A),(-B-Math.sqrt(q))/(2*A));}}
 return out.filter(t=>t>0&&t<1);
}
function bounds(segments){
 const points=[];for(const s of contour(segments)){points.push(s.start,s.end);if(s.c1)for(const axis of [0,1])for(const t of extrema(s.start[axis],s.c1[axis],s.c2[axis],s.end[axis]))points.push(pointAt(s,t));}
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),left=Math.min(...xs),top=Math.min(...ys),right=Math.max(...xs),bottom=Math.max(...ys);
 return {left,top,right,bottom,width:right-left,height:bottom-top};
}
function pathData(segments){contour(segments);return 'M '+segments[0].start.join(' ')+segments.map(s=>s.c1?' C '+s.c1.join(' ')+' '+s.c2.join(' ')+' '+s.end.join(' '):' L '+s.end.join(' ')).join('')+' Z';}
function inspectPiece(p,index){
 const name=String(p?.name||'Деталь '+(index+1));if(name.length>300)throw Error('Слишком длинное название детали');
 try{
  contour(p?.seam_contour,'Линия стачивания');const box=bounds(p?.cut_contour);if(box.width<.1||box.height<.1)throw Error('Нулевая или слишком маленькая деталь');
  if(!Number.isInteger(p.cut_quantity)||p.cut_quantity<1||p.cut_quantity>50)throw Error('Укажите количество деталей для раскроя');
  if(typeof p.allowance_mm!=='number'||!Number.isFinite(p.allowance_mm)||p.allowance_mm<0||p.allowance_mm>100)throw Error('Не определены припуски на швы');
  if(!Array.isArray(p.grainline)||p.grainline.length!==2||distance(point(p.grainline[0]),point(p.grainline[1]))<.1)throw Error('Не определено направление долевой');
  if(!Array.isArray(p.notches)||p.notches.length>512)throw Error('Некорректный список контрольных меток');
  for(const n of p.notches)if(!Number.isInteger(n.segment)||!p.seam_contour[n.segment]||typeof n.t!=='number'||!Number.isFinite(n.t)||n.t<0||n.t>1)throw Error('Контрольная метка ссылается на отсутствующий участок');
  if(!Array.isArray(p.internal_lines)||p.internal_lines.length>512)throw Error('Некорректные внутренние линии');for(const l of p.internal_lines){if(!Array.isArray(l)||l.length<2||l.length>8000)throw Error('Некорректная внутренняя линия');l.forEach(point);}
  const seamBox=bounds(p.seam_contour),all=[...p.grainline,...p.internal_lines.flat(),[box.left,box.top],[box.right,box.bottom],[seamBox.left,seamBox.top],[seamBox.right,seamBox.bottom]],xs=all.map(q=>q[0]),ys=all.map(q=>q[1]),left=Math.min(...xs),top=Math.min(...ys),right=Math.max(...xs),bottom=Math.max(...ys);
  return {piece:p,index,name,bounds:box,visualBounds:{left,top,right,bottom,width:right-left,height:bottom-top}};
 }catch(error){throw Error('«'+name+'»: '+error.message);}
}
function labelPlacement(p){
 const box=bounds(p.seam_contour),width=Math.min(75,box.width-12),height=20;if(width<40||box.height<32)return null;
 const polygon=[];for(const s of p.seam_contour){const n=s.c1?32:1;for(let i=0;i<n;i++)polygon.push(pointAt(s,i/n));}if(polygon.length>16000)return null;
 const spans=y=>{const xs=[];for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length];if((a[1]<=y&&y<b[1])||(b[1]<=y&&y<a[1]))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);return xs.flatMap((a,i)=>i%2?[]:[{left:a+3,right:xs[i+1]-3}]);};
 const obstacles=[p.grainline,...p.internal_lines],crosses=(line,l,r,t,b)=>line.some((q,i)=>i&&Math.max(q[0],line[i-1][0])>=l&&Math.min(q[0],line[i-1][0])<=r&&Math.max(q[1],line[i-1][1])>=t&&Math.min(q[1],line[i-1][1])<=b);
 for(const level of [.35,.55,.75,.2,.85]){const y=box.top+box.height*level;if(y-height/2<box.top+3||y+height/2>box.bottom-3)continue;
  for(const interval of spans(y)){let left=interval.left,right=interval.right;
   for(let i=0;i<7;i++){const line=spans(y-height/2+i*height/6).find(s=>s.left<right&&s.right>left);if(!line){right=left;break;}left=Math.max(left,line.left);right=Math.min(right,line.right);}
   if(right-left<width)continue;
   for(const x of [(left+right)/2,left+width/2,right-width/2]){const l=x-width/2,r=x+width/2,t=y-height/2,b=y+height/2;
    if(obstacles.some(line=>crosses(line,l-2,r+2,t-2,b+2)))continue;
    if(p.notches.some(n=>{const q=pointAt(p.seam_contour[n.segment],n.t);return q[0]>=l-3&&q[0]<=r+3&&q[1]>=t-3&&q[1]<=b+3;}))continue;
    return {x,y,width,height};
   }
  }
 }
 return null;
}
function annotation(p,index,place){
 if(!place)return '';
 const id=String(p.id).slice(0,12),limit=Math.floor(place.width/1.7),words=String(p.name).split(/\s+/),lines=[''];
 for(const word of words){const last=lines.length-1;if((lines[last]+' '+word).trim().length>limit&&lines[last])lines.push(word);else lines[last]=(lines[last]+' '+word).trim();}
 const title=lines.slice(0,2);if(lines.length>2)title[1]=title[1].slice(0,Math.max(0,limit-3))+'...';
 const text=[...title,'Деталь '+(index+1)+' · '+p.cut_quantity+' шт · '+p.allowance_mm+' мм','ID: '+id];
 return '<g class="piece-label" data-piece-label="'+escape(p.id)+'" fill="black" font-family="Arial, sans-serif" font-size="3" text-anchor="middle">'+text.map((line,i)=>'<text data-label-width="'+place.width+'" x="'+place.x+'" y="'+(place.y-6+i*4)+'">'+escape(line)+'</text>').join('')+'</g>';
}
function drawing(p,{prefix='p',colour=false}={}){
 const line=colour?'#315780':'#555',internal=colour?'#795780':'#777';
 const marks=p.notches.map((n,i)=>{const q=pointAt(p.seam_contour[n.segment],n.t);return '<g><circle cx="'+q[0]+'" cy="'+q[1]+'" r=".7" fill="white" stroke="black" stroke-width=".25"/><path d="M '+(q[0]-1.8)+' '+q[1]+' h 3.6 M '+q[0]+' '+(q[1]-1.8)+' v 3.6" stroke="black" stroke-width=".2"/><title>Контрольная метка '+(i+1)+'</title></g>';}).join('');
 return '<defs><marker id="'+prefix+'-arrow" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M 0 0 L 4 2 L 0 4" fill="none" stroke="black" stroke-width=".4"/></marker></defs><path d="'+pathData(p.cut_contour)+'" fill="none" stroke="black" stroke-width=".4"/><path d="'+pathData(p.seam_contour)+'" fill="none" stroke="'+line+'" stroke-width=".3" stroke-dasharray="3 1.5"/><line x1="'+p.grainline[0][0]+'" y1="'+p.grainline[0][1]+'" x2="'+p.grainline[1][0]+'" y2="'+p.grainline[1][1]+'" stroke="black" stroke-width=".35" marker-start="url(#'+prefix+'-arrow)" marker-end="url(#'+prefix+'-arrow)"/>'+marks+p.internal_lines.map(l=>'<polyline points="'+l.map(q=>q.join(',')).join(' ')+'" fill="none" stroke="'+internal+'" stroke-width=".25" stroke-dasharray="1 1"/>').join('');
}
module.exports={escape,point,pointAt,contour,bounds,pathData,inspectPiece,drawing,labelPlacement,annotation};
