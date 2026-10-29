// Chat history keeps small diagnostics; reusable source text lives separately
// in project-scoped construction evidence, not in every subsequent API turn.
const text=(v,n)=>typeof v==='string'?v.replace(/Bearer\s+\S+|\bsk-[A-Za-z0-9_-]{8,}/g,'[скрыто]').slice(0,n):'';
function compact(event={}){
 const r=event.result||event,out={kind:text(event.kind,80),action:text(event.action,120)};
 const message=event.message||r.message;if(message)out.message=text(message,700);
 if(typeof r.valid==='boolean')out.valid=r.valid;if(r.needs_input)out.needs_input=true;
 if(r.url)out.url=text(r.url,1500);if(r.method)out.method=text(r.method,100);
 if(Array.isArray(r.pieces))out.piece_count=r.pieces.length;
 else if(Number.isSafeInteger(r.piece_count)&&r.piece_count>=0)out.piece_count=r.piece_count;
 if(Array.isArray(r.results||r.sources))out.sources=(r.results||r.sources).slice(0,4).map(v=>({url:text(v.url,1000),title:text(v.title,100)}));
 const issues=r.issues||r.qa_report?.issues;if(Array.isArray(issues))out.issues=issues.slice(0,4).map(v=>typeof v==='string'?text(v,250):{code:text(v.code,80),piece:text(v.piece,100),section:text(v.section,100),message:text(v.message,250)});
 if(JSON.stringify(out).length>2200){delete out.sources;delete out.issues;}
 return out;
}
function append(events,event){const result=[...(events||[]),compact(event)].slice(-16);while(result.length>1&&JSON.stringify(result).length>14000)result.shift();return result;}
function context(value){if(typeof value!=='string')return value;try{const parsed=JSON.parse(value);if(Array.isArray(parsed?.research)){parsed.research=parsed.research.reduce((list,event)=>append(list,event),[]);return JSON.stringify(parsed);}}catch{}return value;}
module.exports={compact,append,context};
