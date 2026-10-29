const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const printer=require('./print-patterns.cjs'),geometry=require('./print-patterns-geometry.cjs');
function rectangle(w,h,x=0,y=0){return [[[x,y],[x+w,y]],[[x+w,y],[x+w,y+h]],[[x+w,y+h],[x,y+h]],[[x,y+h],[x,y]]].map(([start,end])=>({start,end}));}
function garment(){return {id:'print-test',name:'Проверка печати',version:1,pieces:[{id:'piece-1',role:'front',name:'Передняя деталь',cut_contour:rectangle(400,600,-10,-10),seam_contour:rectangle(380,580),cut_quantity:1,allowance_mm:10,grainline:[[190,100],[190,400]],notches:[{segment:1,t:.5}],internal_lines:[[[50,100],[200,100]]]}]};}
test('A4 plan covers negative coordinates and the complete piece at 1:1 with repeated overlap',()=>{
 const g=garment(),p=printer.plan(g,{format:'A4'});assert.equal(p.scale_percent,100);assert.equal(p.page_count,10);assert.equal(p.pages.length,9);assert.equal(p.pages[0].columns,3);assert.equal(p.pages[0].rows,3);
 assert.equal(p.pages[0].x,-15);assert.equal(p.pages[1].x-p.pages[0].x,p.frame_mm.width-10);
 assert.equal(p.pages[0].y,-15);assert.equal(p.pages[3].y-p.pages[0].y,p.frame_mm.height-10);
 for(const item of p.pieces){const tiles=p.pages.filter(t=>t.piece_index===item.index);assert(Math.max(...tiles.map(t=>t.x+t.width))>=item.bounds.right+5);assert(Math.max(...tiles.map(t=>t.y+t.height))>=item.bounds.bottom+5);}
 assert.equal(p.calibration_mm,100);assert.equal(p.fit_verified,false);assert.equal(p.sewing_ready,false);assert.equal(p.printer_scale_verified,false);
 const html=printer.renderHTML(p);assert(html.includes('width="100" height="100"'));assert(html.includes('width="190mm" height="249mm"'));assert(html.includes('viewBox="-15 -15 190 249"'));assert(html.includes('Раскроить: 1 шт.'));assert(html.includes('Ряд 1/3, столбец 1/3'));assert(!html.includes('<script'));
});
test('A0 preserves full size and tiles oversized pieces instead of shrinking them',()=>{
 const g=garment(),p=printer.plan(g,{format:'A0'});assert.equal(p.page_count,2);assert.deepEqual(p.paper_mm,{width:841,height:1189});assert.equal(p.pages[0].width,821);assert.equal(p.pages[0].height,1141);
 g.pieces[0].cut_contour=rectangle(900,1300);const bigger=printer.plan(g,{format:'A0'});assert.equal(bigger.pages.length,4);assert.equal(bigger.scale_percent,100);
});
test('graphic guides outside the cut box are included rather than silently clipped',()=>{
 const g=garment();g.pieces[0].grainline=[[-30,-40],[-30,100]];g.pieces[0].internal_lines.push([[400,10],[430,20]]);const p=printer.plan(g);assert.equal(p.pieces[0].bounds.left,-10);assert.equal(p.pages[0].x,-35);assert.equal(p.pages[0].y,-45);assert.equal(p.pieces[0].visualBounds.right,430);
});
test('true cubic extrema are included in SVG bounds, avoiding clipped curve bulges',()=>{
 const contour=[{start:[0,0],end:[100,0],c1:[0,-200],c2:[100,-200]},...rectangle(100,100).slice(1)];
 const box=geometry.bounds(contour);assert.equal(box.top,-150);assert.equal(box.height,250);
 const folder=testWorkspace.create('print-svg-'),g=garment();g.pieces[0].cut_contour=contour;g.pieces[0].cut_quantity=2;
 require('./garment-export.cjs').exportPatterns(g,folder);const svg=fs.readFileSync(path.join(folder,'front.svg'),'utf8');assert(svg.includes('viewBox="-20 -180 140 300"'));assert(svg.includes('2 шт'));assert(svg.includes('примерка не проверена'));
});
test('print preparation rejects broken contours, absent production data, failed QA and excessive pages',()=>{
 for(const change of [g=>g.qa_report={valid:false},g=>g.pieces[0].cut_contour[0].end=[3,7],g=>g.pieces[0].grainline=null,g=>g.pieces[0].allowance_mm=null,g=>g.pieces[0].cut_quantity=0,g=>g.pieces[0].notches[0].segment=99,g=>g.pieces[0].cut_contour=rectangle(100000,100000)]){const g=garment();change(g);assert.throws(()=>printer.plan(g));}
 assert.throws(()=>printer.plan(garment(),{format:'Letter'}));assert.throws(()=>printer.plan(garment(),{scale:.5}));
 const g=garment();g.pieces.push(structuredClone(g.pieces[0]));assert.throws(()=>printer.plan(g),/идентификатор/);
});
test('all labels are escaped and plan creation does not mutate source garment data',()=>{
 const g=garment();g.name='<img src=x onerror=run()> &';g.pieces[0].name='<script>bad()</script>';const before=structuredClone(g),p=printer.plan(g),html=printer.renderHTML(p);assert.deepEqual(g,before);assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));assert(html.includes('&lt;img src=x onerror=run()&gt; &amp;'));
});
test('large pieces get interior identification away from grain and construction lines; narrow pieces keep header labels',()=>{
 const g=garment(),p=printer.plan(g),label=p.pieces[0].label;assert(label);assert(label.x+label.width/2<g.pieces[0].grainline[0][0]-2);assert(printer.renderHTML(p).includes('data-piece-label="piece-1"'));
 g.pieces[0].cut_contour=rectangle(24,100,-10,-10);g.pieces[0].seam_contour=rectangle(4,80);g.pieces[0].grainline=[[2,10],[2,70]];g.pieces[0].internal_lines=[];const narrow=printer.plan(g);assert.equal(narrow.pieces[0].label,null);assert(narrow.warnings.some(w=>w.includes('узких')));
});
test('export keeps output local to the caller-controlled directory and always cleans its renderer',async()=>{
 const folder=testWorkspace.create('print-output-');let created,destroyed=false;
 class Window{constructor(){created=this;this.webContents={setWindowOpenHandler(){},executeJavaScript:async code=>code==='document.fonts.ready'?true:{pages:10,calibration:100*96/25.4,pageWidth:210*96/25.4,overflow:false},printToPDF:async options=>{assert.equal(options.scale,1);assert.equal(options.preferCSSPageSize,true);assert.deepEqual(options.margins,{top:0,bottom:0,left:0,right:0});return Buffer.from('%PDF-1.4\nsynthetic')}};}async loadURL(url){assert(url.startsWith('data:text/html'));}isDestroyed(){return destroyed;}destroy(){destroyed=true;}}
 const result=await printer.exportPrint(garment(),folder,{BrowserWindow:Window});assert(created&&destroyed);assert.equal(result.scale_percent,100);assert.equal(result.sewing_ready,false);assert(fs.existsSync(result.paths.pdf));assert(fs.existsSync(result.paths.manifest));
 const saved=JSON.parse(fs.readFileSync(result.paths.manifest,'utf8'));assert.equal(saved.pieces[0].cut_quantity,1);assert.equal(saved.geometry_fingerprint.length,64);assert.deepEqual(fs.readdirSync(folder).sort(),['v1-A4-1to1.json','v1-A4-1to1.pdf']);
 await assert.rejects(printer.exportPrint(garment(),'relative',{BrowserWindow:Window}),/абсолютная/);
});
module.exports={garment,rectangle};
