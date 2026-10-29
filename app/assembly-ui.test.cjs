const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class Element{
 constructor(tag,text,cls){this.tagName=tag;this.textContent=text||'';this.className=cls||'';this.children=[];this.isConnected=true;this.classList={add(){},remove(){}};}
 append(...children){for(const c of children){c.parent=this;this.children.push(c);}}
 replaceChildren(...children){this.children=[];this.append(...children);}
 setAttribute(){}
 querySelectorAll(selector){const all=this.children.flatMap(n=>[n,...n.querySelectorAll('*')]);return selector==='*'?all:all.filter(n=>selector==='button'?n.tagName==='button':selector.split(',').some(s=>n.className===s.slice(1)));}
 remove(){this.parent.children=this.parent.children.filter(n=>n!==this);this.isConnected=false;}
}
test('fresh and restored assembly reports show the native map without automatically starting simulation',async()=>{
 for(const cached of [false,true]){
  const parent=new Element('article'),calls=[],rendered=[],report={status:'unavailable',text:'Сопоставлено 13 соединений',sewing_map:{mapped_count:13},capabilities:{simulate_callable:true},avatar_count:1};
  const scope={UI:{node:(...args)=>new Element(...args),api:async(method,arg)=>{calls.push(method);if(method==='assembly-action')return cached?{existing:true,offer:{report}}:{id:'native-job'};if(method==='result')return {id:'native-job',assembly:report};return {queued:true};}},UIFormat:{num:String},UISewingMap:{render(p,map){rendered.push(map);p.append(new Element('details','Карта','sewing-map'));}},CustomEvent:class{},Event:class{},Date,setTimeout:fn=>fn(),window:{dispatchEvent(){},confirm(){throw Error('Подтверждение симуляции не должно появляться автоматически');}}};
  vm.runInNewContext(fs.readFileSync(require.resolve('./assembly-ui.js'),'utf8'),scope);
  scope.window.UIAssembly.offer(parent,{id:'proposal',name:'Футболка',version:1});
  await parent.querySelectorAll('button').find(b=>b.textContent==='Проверить карту в CLO').onclick();
  assert.equal(rendered.length,1);assert.equal(rendered[0],report.sewing_map);assert.equal(calls.includes('apply'),!cached);assert.equal(calls.filter(x=>x==='assembly-action').length,1);
  assert(parent.querySelectorAll('button').some(b=>b.textContent==='Симуляция после ручной сборки'));
 }
});

test('reopening a manual map retires the previous chat actions without executing CLO',async()=>{
 const calls=[],scope={UI:{node:(...args)=>new Element(...args),api:async(...args)=>calls.push(args)},window:{},UIFormat:{num:String}};
 vm.runInNewContext(fs.readFileSync(require.resolve('./assembly-ui.js'),'utf8'),scope);
 const old=new Element('article'),fresh=new Element('article');scope.window.UIAssembly.offer(old,{id:'old',garment_id:'g',name:'Куртка',version:1});scope.window.UIAssembly.offer(fresh,{id:'new',garment_id:'g',name:'Куртка',version:1});
 assert(old.querySelectorAll('button').every(b=>b.disabled));assert(fresh.querySelectorAll('button').every(b=>!b.disabled));await old.querySelectorAll('button')[0].onclick();assert.equal(calls.length,0);
});
