const fs=require('node:fs'),path=require('node:path'),geometry=require('./print-patterns-geometry.cjs');
function exportPatterns(g,folder){
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const pointAt=(s,t)=>s.c1?[0,1].map(i=>(1-t)**3*s.start[i]+3*(1-t)**2*t*s.c1[i]+3*(1-t)*t*t*s.c2[i]+t**3*s.end[i]):[0,1].map(i=>s.start[i]*(1-t)+s.end[i]*t);
 const d=segments=>'M '+segments[0].start.join(' ')+segments.map(s=>s.c1?' C '+s.c1.join(' ')+' '+s.c2.join(' ')+' '+s.end.join(' '):' L '+s.end.join(' ')).join('')+' Z';
 fs.mkdirSync(folder,{recursive:true});
 for(const p of g.pieces){const box=geometry.bounds(p.cut_contour),x=box.left-20,y=box.top-30,w=box.width+40,h=box.height+50;
 const marks=p.notches.map(n=>{const q=pointAt(p.seam_contour[n.segment],n.t);return `<circle cx="${q[0]}" cy="${q[1]}" r="1" fill="red"/>`;}).join('');
 const content=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="${x} ${y} ${w} ${h}"><title>${escape(p.name)}</title><text x="${x+5}" y="${y+12}" font-size="6">${escape(p.name)} · ${escape(p.cut_quantity??1)} шт · примерка не проверена</text><path d="${d(p.cut_contour)}" fill="none" stroke="black" stroke-width="0.5"/><path d="${d(p.seam_contour)}" fill="none" stroke="blue" stroke-width="0.4" stroke-dasharray="3 2"/><line x1="${p.grainline[0][0]}" y1="${p.grainline[0][1]}" x2="${p.grainline[1][0]}" y2="${p.grainline[1][1]}" stroke="green" stroke-width="0.5"/>${marks}${p.internal_lines.map(l=>`<polyline points="${l.map(q=>q.join(',')).join(' ')}" fill="none" stroke="purple" stroke-width="0.4"/>`).join('')}</svg>`;
 const role=p.role.replace(/[^a-z0-9_]/g,'_');fs.writeFileSync(path.join(folder,role+'.svg'),content);
 }
}
module.exports={exportPatterns};
