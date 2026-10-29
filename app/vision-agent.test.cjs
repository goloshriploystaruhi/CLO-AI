const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {run}=require('./construction-agent.cjs'),{validateInput,modelInput}=require('./vision-input.cjs');
const {ConversationStore}=require('./conversation-store.cjs'),refs=require('./chat-references.cjs');
const reply=tools=>({text:JSON.stringify({dialogue:{intent:'construction',message:'Проверяю вариант',tools}})});

test('actual image data replaces filename-only references and remains conversation-scoped',()=>{
 const folder=testWorkspace.create('vision-'),store=new ConversationStore(path.join(folder,'chat.json'));
 const file=path.join(folder,'reference.png'),bytes=Buffer.alloc(30);Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes);bytes.writeUInt32BE(100,16);bytes.writeUInt32BE(200,20);fs.writeFileSync(file,bytes);
 const image={isEmpty:()=>false,getSize:()=>({width:100,height:200}),toJPEG:()=>Buffer.from([255,216,255,1,2,3])};
 const decoder={createFromBuffer:()=>image,createFromDataURL:()=>image};
 const row=refs.add(store,file,decoder);store.add('user','Разбери форму',{references:[row]});
 const input=modelInput(store,decoder),part=input[0].content.find(p=>p.type==='input_image');
 assert(part);assert.equal(Buffer.from(part.image_url.split(',')[1],'base64').toString('hex'),'ffd8ff010203');
 const other=new ConversationStore(path.join(folder,'other.json'));other.add('user','Чужой референс',{references:[row]});assert.throws(()=>modelInput(other,decoder));
 assert.throws(()=>validateInput([{role:'user',content:[{type:'input_image',image_url:'file:///secret'}]}]));
 assert.throws(()=>validateInput([{role:'user',content:[{type:'input_image',image_url:'https://private.example/photo'}]}]));
});

test('response transport sends pixels and web-search tools through the same OAuth request and preserves citations',async()=>{
 const {streamResponse}=await import('./siwc-responses.mjs');const old=globalThis.fetch;let payload,headers;
 try{
  globalThis.fetch=async(url,init)=>{payload=JSON.parse(init.body);headers=new Headers(init.headers);
   const events=[{type:'response.web_search_call.in_progress'},{type:'response.output_text.delta',delta:'{"message":"Готово"}'},{type:'response.output_text.annotation.added',annotation:{type:'url_citation',url:'https://example.org/pattern',title:'Источник'}},{type:'response.completed',response:{id:'response-test',status:'completed'}}];
   return new Response(events.map(e=>'data: '+JSON.stringify(e)+'\n\n').join(''),{headers:{'content-type':'text/event-stream'}});
  };
  let searched=false;const r=await streamResponse('test-token',{model:'selected-model',input:[{role:'user',content:[{type:'input_text',text:'Что на фото?'},{type:'input_image',image_url:'data:image/jpeg;base64,/9j/'}]}],webSearch:true,onSearch:()=>searched=true},new AbortController().signal);
  assert.equal(payload.input[0].content[1].type,'input_image');assert.equal(payload.tools[0].type,'web_search');assert.equal(payload.store,false);assert.equal(headers.get('authorization'),'Bearer test-token');assert(searched);assert.equal(r.sources[0].url,'https://example.org/pattern');
 }finally{globalThis.fetch=old;}
});

test('agent reads research and corrects a failed construction before returning an executable command',async()=>{
 const queue=[reply([{action:'get_category_engineering',args:{category:'jacket'}}]),reply([{action:'create_garment',args:{method:'workwear_zip_jacket_v1',parameters:{length_mm:200}}}]),reply([{action:'create_garment',args:{method:'workwear_zip_jacket_v1',parameters:{length_mm:600}}}])];
 let calls=0,reads=0,previews=0;const prompts=[];
 const r=await run({options:{model:'selected',input:[{role:'user',content:'Сделай куртку'}]},request:async o=>{prompts.push(structuredClone(o));calls++;return queue.shift();},read:async()=>{reads++;return {source:'https://example.org/reference'};},preview:async t=>{previews++;return t.args.parameters.length_mm<500?{valid:false,message:'Недостаточная длина корпуса'}:{valid:true};},ensureCurrent:async()=>{}});
 assert.equal(calls,3);assert.equal(reads,1);assert.equal(previews,2);assert.equal(JSON.parse(r.text).dialogue.tools[0].args.parameters.length_mm,600);
 assert(prompts[2].input.some(m=>JSON.stringify(m).includes('Недостаточная длина корпуса')));
});

test('unsupported search falls back explicitly, policy errors and image inputs are never bypassed',async()=>{
 let calls=0;const options={webSearch:true,model:'selected',input:[{role:'user',content:[{type:'input_image',image_url:'data:image/jpeg;base64,/9j/'}]}]};
 await run({options,request:async o=>{calls++;assert.equal(o.input[0].content[0].type,'input_image');if(calls===1)throw Object.assign(Error('Unsupported'),{code:'subscription_sharing_unsupported_capability'});assert.equal(o.webSearch,false);return {text:'{"message":"Локальный расчёт"}'};},ensureCurrent:async()=>{},read:async()=>{},preview:async()=>{}});
 assert.equal(calls,2);calls=0;
 await assert.rejects(run({options,request:async()=>{calls++;throw Object.assign(Error('Policy denied'),{status:403});},ensureCurrent:async()=>{}}),/Policy denied/);assert.equal(calls,1);
});

test('unresolved geometry and changed project stop before any application',async()=>{
 let calls=0;const r=await run({options:{input:[]},request:async()=>{calls++;return reply([{action:'create_garment',args:{}}]);},preview:async()=>({valid:false,message:'Самопересечение'}),ensureCurrent:async()=>{}});
 assert.equal(calls,4);assert.match(JSON.parse(r.text).message,/CLO не изменён/);
 await assert.rejects(run({options:{input:[]},request:async()=>{throw Error('Should not run');},ensureCurrent:async()=>{throw Error('Проект сменился');}}),/Проект сменился/);
});
