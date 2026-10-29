const {test}=require('node:test'),assert=require('node:assert/strict'),render=require('./chat-renderer.js');
class Element{
 constructor(tag,text){this.tagName=tag;this.textContent=text||'';this.children=[];this.attributes={};this.dataset={};}
 append(...nodes){for(const node of nodes){node.parentNode=this;this.children.push(node);}}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 setAttribute(k,v){this.attributes[k]=String(v);}
 remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(node=>node!==this);this.parentNode=null;}}
}
const walk=n=>[n,...n.children.flatMap(walk)],ui={node:(tag,text)=>new Element(tag,text),api:async()=>({})};
test('local PDF links use an opaque artifact ID and never render arbitrary local paths',async()=>{
 const root=new Element('div'),calls=[],id='12345678-1234-1234-1234-123456789012';render.render(root,'[PDF](clo-artifact://'+id+') [Секрет](file:///C:/private.txt)',{...ui,api:async(...args)=>{calls.push(args);}});const links=walk(root).filter(n=>n.tagName==='a');assert.equal(links.length,1);assert.equal(links[0].href,'clo-artifact://'+id);await links[0].onclick({preventDefault(){}});assert.deepEqual(calls,[['open-link','clo-artifact://'+id]]);
});
test('paragraphs, ordered/unordered lists and emphasis render with safe DOM, never raw HTML',()=>{
 const root=new Element('div');render.render(root,'### План\n\n**Перед** и `рукав`.\nВторая строка.\n\n1. Проверить контур\n2. Измерить швы\n\n- Примерка\n\n<script>alert(1)</script>\n![x](javascript:alert(1))',ui);
 const nodes=walk(root);assert(nodes.some(n=>n.tagName==='h3'));assert(nodes.some(n=>n.tagName==='ol'));assert(nodes.some(n=>n.tagName==='ul'));assert(nodes.some(n=>n.tagName==='strong'&&n.textContent==='Перед'));assert(nodes.some(n=>n.tagName==='br'));assert(!nodes.some(n=>['script','img','iframe'].includes(n.tagName)));
});
test('questions carry structured IDs, hide the chosen controls immediately and consume them exactly once',async()=>{
 const root=new Element('article'),q={id:'q',status:'active',actions:[{id:'a',type:'reply',label:'Мягкий силуэт',active:true,status:'active'}]};let count=0;
 const panel=render.question(root,q,async(question,action)=>{assert.equal(question.id,'q');assert.equal(action.id,'a');count++;},ui),button=panel.children[0],selected=button.onclick();button.onclick();assert(button.disabled);assert(panel.hidden);
 await selected;assert.equal(count,1);assert.equal(root.children.length,0);
 for(const state of ['completed','cancelled'])assert.equal(render.question(root,{...q,status:state,actions:[{...q.actions[0],active:false,status:state}]},async()=>{},ui),undefined);
 assert(!walk(root).some(node=>node.textContent.startsWith('Выбрано:')));
});
test('only current actions render and a consumed snapshot removes a selection still awaiting its result',async()=>{
 const root=new Element('article'),q={id:'q',status:'active',actions:[{id:'a',type:'reply',label:'Продолжить',active:true,status:'active'},{id:'b',type:'reply',label:'Старая кнопка',active:false,status:'cancelled'}]};let resolve;
 const panel=render.question(root,q,()=>new Promise(r=>resolve=r),ui);assert.equal(panel.children.length,1);
 const selected=panel.children[0].onclick();await Promise.resolve();assert(panel.hidden);
 assert.equal(render.reconcileQuestion(panel,undefined,{busy:true}),false);assert.equal(root.children.length,0);
 resolve();await selected;assert.equal(root.children.length,0);
});
test('an unaccepted failed action can retry and active controls respect the global busy state',async()=>{
 const root=new Element('article'),q={id:'q',status:'active',actions:[{id:'a',label:'Продолжить',type:'reply',active:true,status:'active'}]};let calls=0;
 const panel=render.question(root,q,async()=>{if(++calls===1)throw Error('Нет связи');},ui),button=panel.children[0];
 await button.onclick();assert.equal(panel.hidden,false);assert.equal(button.disabled,false);assert(walk(panel).some(node=>node.textContent==='Нет связи'));
 assert(render.reconcileQuestion(panel,q,{busy:true}));assert(button.disabled);assert(render.reconcileQuestion(panel,q,{busy:false}));assert(!button.disabled);
 await button.onclick();assert.equal(calls,2);assert.equal(root.children.length,0);
});
test('image sources reject SVG',async()=>{
 const root=new Element('article');
 await render.references(root,[{id:'ref',name:'<script>.png'}],'s',{...ui,api:async()=>({data_url:'data:image/svg+xml;base64,AA=='})});assert(!walk(root).some(n=>n.tagName==='img'));
});
