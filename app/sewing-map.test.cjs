const {test}=require('node:test'),assert=require('node:assert/strict'),mapUI=require('./sewing-map.js');
function sample(){const straight={start:{x:0,y:0},end:{x:100,y:0}},outline=[straight,{start:{x:100,y:0},end:{x:100,y:200}},{start:{x:100,y:200},end:{x:0,y:0}}];return {garment_version:2,seam_count:1,mapped_count:1,verified_count:1,note:'Посадка не проверена.',sequence:['Стачать плечи'],pieces:[{id:'p',name:'Перед <script>',outline}],seams:[{order:1,title:'Плечевой шов',phase:'Плечи',status:'verified',direction:'reverse',pairing:'А1 совместить с Б1, А2 — с Б2',ease_mm:0,tolerance_mm:.2,residual_mm:.01,issues:[],ends:[false,true].map(reverse=>({piece_id:'p',piece_name:'Перед <script>',verified:true,source_name:'Внутренняя линия стачивания',shape_index:0,native_line_indices:[0],length_mm:100,path:[straight],reverse,encoding:'native_bezier'})),marks:[{fraction:0,label:'Начало',ends:[{model_point:[0,0]},{model_point:[100,0]}]},{fraction:.5,label:'Плечо',ends:[{model_point:[50,0],native_guide:{verified:true}},{model_point:[50,0],native_guide:{verified:true}}]},{fraction:1,label:'Конец',ends:[{model_point:[100,0]},{model_point:[0,0]}]}]}]};}
class Element{
 constructor(tag,text){this.tagName=tag;this.textContent=text||'';this.children=[];this.attributes={};}
 append(...children){this.children.push(...children);}
 setAttribute(k,v){this.attributes[k]=String(v);}
}
const walk=n=>[n,...n.children.flatMap(walk)];
const bindCopy=(element,options)=>{element.onclick=async()=>{try{await options.copy();options.onSuccess();}catch(e){options.onError(e);}};};
test('native index ranges are compact, directional and use human numbering',()=>{
 assert.equal(mapUI.ranges([0,1,2,3]),'1–4');assert.equal(mapUI.ranges([5,4,3]),'6–4');assert.equal(mapUI.ranges([0,2]),'1; 3');
});
test('reversed Bezier diagram reverses endpoints and both control points',()=>{
 const s={start:{x:0,y:0},end:{x:100,y:20},c1:{x:10,y:50},c2:{x:80,y:60}};
 assert.equal(mapUI.pathData([s],true),'M 100 20 C 80 60 10 50 0 0');assert.throws(()=>mapUI.pathData([{start:{x:NaN,y:0},end:{x:1,y:2}}]));
});
test('map renders real spans and accessible diagrams, copy uses existing IPC',async()=>{
 const parent=new Element('section'),copied=[],ui={bindCopy,node:(tag,text)=>new Element(tag,text),document:{createElementNS:(_,tag)=>new Element(tag)},api:async(method,text)=>{assert.equal(method,'copy-text');copied.push(text);}};
 mapUI.render(parent,sample(),ui);const nodes=walk(parent),svgs=nodes.filter(n=>n.tagName==='svg');assert.equal(svgs.length,2);assert(svgs.every(n=>n.attributes.role==='img'&&n.attributes['aria-label'].includes('выделен')));
 assert.equal(nodes.filter(n=>n.tagName==='path'&&n.attributes['marker-end']).length,2);
 assert(!nodes.some(n=>n.tagName==='script'));await nodes.find(n=>n.tagName==='button').onclick();assert.match(copied[0],/сегменты 1/);assert.match(copied[0],/Швы автоматически не созданы/);assert.match(copied[0],/Плечо/);assert.doesNotMatch(copied[0],/native_line_indices|\{"/);
});
test('unresolved spans never get an invented highlight or successful measurement',()=>{
 const map=sample();map.verified_count=0;map.mapped_count=0;const s=map.seams[0];s.status='unresolved';s.residual_mm=null;s.issues=['Внутренняя линия не найдена'];s.marks=[];s.ends=s.ends.map(e=>({...e,verified:false,length_mm:null,reason:'Внутренняя линия не найдена'}));
 const parent=new Element('section');mapUI.render(parent,map,{bindCopy,node:(tag,text)=>new Element(tag,text),api:async()=>{}});assert.equal(walk(parent).filter(n=>n.tagName==='svg').length,0);assert.match(mapUI.mapText(map),/невязка не измерена/);
});
