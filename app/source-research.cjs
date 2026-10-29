// Search and read a small number of candidates in one model round. This is
// evidence gathering, never a construction method or permission to apply it.
const web=require('./web-research.cjs');
async function searchAndRead(query,options={}){
 const {search=web.search,read=web.read,maxPages=2,...network}=options,result=await search(query,network);
 if(!result?.results?.length)return result;
 const pages=await Promise.all(result.results.slice(0,Number.isInteger(maxPages)?Math.max(0,Math.min(2,maxPages)):2).map(async candidate=>{
  try{return await read(candidate.url,{...network,timeoutMs:8000});}
  catch(error){if(network.signal?.aborted&&network.signal.reason?.name!=='TimeoutError')throw error;return {url:candidate.url,valid:false,recoverable:true,code:'source_unavailable',message:'Источник не удалось прочитать; используйте другой результат.',next_action:'Прочитать другую общедоступную страницу.'};}
 }));
 const evidence=pages.filter(p=>p.valid!==false&&p.text?.trim()).map(p=>({...p,text:p.text.slice(0,8000),coverage:{...p.coverage,complete:p.coverage?.complete===true&&p.text.length<=8000,truncated:p.text.length>8000||p.coverage?.truncated===true}}));
 return {...result,evidence,failed_sources:pages.filter(p=>p.valid===false),pages_attempted:pages.length,message:'Первые подходящие страницы прочитаны автоматически. evidence содержит фактический текст; результаты поиска и размерная таблица сами по себе не являются методикой построения. Проверьте применимость, затем выполните математическую пробу.'};
}
module.exports={searchAndRead};
