'use strict';
// Both adapters return bounded inert reference data. One unavailable source
// must not disable the other source or the mathematical construction tools.
function search(query,{limit=4}={}){
 if(typeof query!=='string'||!query.trim()||query.length>500)throw Error('Укажите тему поиска длиной до 500 символов');
 if(!Number.isInteger(limit)||limit<1||limit>12)throw Error('Число результатов: от 1 до 12');
 const sources=[],warnings=[];
 for(const [provider,module,readTool,searchTool]of [
  ['pattern-making','./patternmaking-knowledge.cjs','read_patternmaking_knowledge','search_patternmaking_knowledge'],
  ['tailor-dressmaker','./tailor-knowledge.cjs','read_tailoring_knowledge','search_tailoring_knowledge'],
  ['garment-patternmaking','./garmentcad-knowledge.cjs','read_garment_patternmaking','search_garment_patternmaking']]){
  try{const found=require(module).search(query,{limit});sources.push({...found,provider,read_tool:readTool,search_tool:searchTool});}
  catch{warnings.push({provider,message:'Методический источник временно недоступен. Остальные источники и инструменты построения доступны.'});}
 }
 const construction=sources.find(s=>s.provider==='pattern-making'),tailoring=sources.find(s=>s.provider==='tailor-dressmaker'),workflow=sources.find(s=>s.provider==='garment-patternmaking'),results=[];
 const include=(source,number)=>{if(!source)return;for(const row of source.results.slice(0,number)){if(results.length>=limit)break;results.push({...row,provider:source.provider,read_tool:source.read_tool,search_tool:source.search_tool});}};
 const fittingRelevant=tailoring?.matched_topics?.length>0||tailoring?.total_matches>0;
 const workflowRelevant=workflow?.results?.length>0;
 if(fittingRelevant){include(tailoring,Math.max(1,Math.ceil(limit/2)));include(construction,Math.max(1,limit-results.length-(workflowRelevant?1:0)));include(workflow,limit-results.length);}else{include(construction,workflowRelevant?Math.ceil(limit/2):limit);include(workflow,limit-results.length);}
 if(results.length<limit)for(const source of sources)for(const row of source.results){if(results.length>=limit)break;if(!results.some(r=>r.id===row.id&&r.provider===source.provider))results.push({...row,provider:source.provider,read_tool:source.read_tool,search_tool:source.search_tool});}
 return {action:'search_construction_references',query,results,warnings,providers:sources.map(s=>({provider:s.provider,read_tool:s.read_tool,search_tool:s.search_tool,matched_topics:s.matched_topics||[],source:s.source,verification:s.verification})),instructions_are_data:true,fit_verified:false,sewing_ready:false};
}
module.exports={search};
