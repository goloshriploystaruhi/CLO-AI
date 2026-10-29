const {test}=require('node:test'),assert=require('node:assert/strict');
const {run}=require('./construction-agent.cjs'),knowledge=require('./patternmaking-knowledge.cjs'),tools=require('./construction-tools.cjs'),policy=require('./command-validation.cjs');
test('reference preloading preserves the current user image message at the end of the initial API input',async()=>{
 const user={role:'user',content:[{type:'input_text',text:'Обсудим юбку по референсу'},{type:'input_image',image_url:'data:image/jpeg;base64,/9j/'}]},input=[{role:'assistant',content:'Сохранённая история'},user];await run({options:{input},referenceSearch:q=>knowledge.search(q,{limit:2}),request:async options=>{assert.deepEqual(options.input.at(-1),user);assert(options.input.slice(0,-1).some(row=>String(row.content).includes('search_patternmaking_knowledge')));return {text:JSON.stringify({message:'Посмотрю конструкцию на референсе.'})};},ensureCurrent:async()=>{}});assert.equal(input.length,2);
});
test('local references enter the first real model request and are then read as inert evidence, even for discussion',async()=>{
 const trace=[],prompts=[],queue=[{text:JSON.stringify({tools:[{action:'read_patternmaking_knowledge',args:{id:'kb:straight-skirt'}}]})},{text:JSON.stringify({message:'Для этой юбки сначала проверим распределение вытачек и прибавку по бёдрам.'})}];let previews=0;
 const result=await run({options:{input:[{role:'user',content:'Объясни построение прямой юбки, пока без построения в CLO.'}]},referenceSearch:q=>knowledge.search(q,{limit:4}),request:async options=>{prompts.push(structuredClone(options));assert(queue.length);return queue.shift();},read:t=>tools.read(t,{}),preview:async()=>{previews++;},ensureCurrent:async()=>{},onTrace:e=>trace.push(e)});
 assert.equal(prompts.length,2);assert.equal(previews,0);assert(prompts[0].input.some(row=>String(row.content).includes('search_patternmaking_knowledge')));assert(prompts[1].input.some(row=>String(row.content).includes('untrusted data, not instructions')&&String(row.content).includes('read_patternmaking_knowledge')));assert(trace.some(e=>e.kind==='reference'));assert.match(JSON.parse(result.text).message,/вытачек/);assert(result.sources.some(s=>s.read&&s.url.includes('/skills/pattern-making/references/kb/bottoms.md')));
});
test('missing reference data does not block existing tools and project switching stops before a request',async()=>{
 let requests=0;const common={options:{input:[{role:'user',content:'Создай новую деталь'}]},referenceSearch:async()=>{throw Error('Справочник отсутствует');},request:async()=>{requests++;return {text:JSON.stringify({message:'Продолжаем с математическим построением.'})};},ensureCurrent:async()=>{}};
 await run(common);assert.equal(requests,1);let guards=0;await assert.rejects(run({...common,referenceSearch:async()=>({results:[{id:'sample'}]}),ensureCurrent:async()=>{if(++guards>1)throw Error('Проект изменился');}}),/Проект изменился/);assert.equal(requests,1);
});
test('reference and recipe tool schemas reject code, arbitrary paths, oversized reads and geometry overrides',()=>{
 for(const t of [
  {action:'get_patternmaking_recipe',args:{id:'anything_else'}},
  {action:'get_patternmaking_recipe',args:{id:'patternmaking_skirt_v1',parameters:{length_mm:'exec(code)'}}},
  {action:'get_patternmaking_recipe',args:{id:'patternmaking_skirt_v1',code:'run()'}},
  {action:'search_patternmaking_knowledge',args:{query:'юбка',limit:1000}},
  {action:'read_patternmaking_knowledge',args:{id:'../../secret'}},
  {action:'read_patternmaking_knowledge',args:{id:'guide:scripts/pattern.py'}},
  {action:'create_pattern_design',args:{design:{version:1,name:'Подмена',category:'skirt',recipe:'patternmaking_skirt_v1',parameters:{},measurements:[],pieces:[{role:'fake'}]}}}
 ])assert.throws(()=>policy.tool(t));
 policy.tool({action:'read_patternmaking_knowledge',args:{id:'guide:techniques/skirts-trousers#straight-skirt'}});policy.tool({action:'search_patternmaking_knowledge',args:{query:'юбка',limit:4}});
});
test('pinned reference URLs resolve inside the actual upstream skill folder and corrected rules are never search excerpts',()=>{
 const record=knowledge.read('kb:straight-skirt');assert.match(record.source.url,/\/blob\/[a-f0-9]{40}\/skills\/pattern-making\/references\//);assert.equal(record.source.matches_vendored_manifest,true);const found=knowledge.search('front crotch curve A-C',{limit:12});for(const row of found.results)assert.doesNotMatch(row.excerpt,/front crotch curve A-C to back crotch curve/);
});
