import {apiError, isObject} from '../vendor/siwc/packages/local/dist/errors.js';

// Validation bodies may echo prompts, image URLs or credentials. Retain only
// recognized request fields; never expose the server's free-form message.
const fields=new Set(['input','model','instructions','store','stream','tools','max_tool_calls']);
function fieldOf(value){
 if(typeof value!=='string')return undefined;
 const field=value.split(/[.[]/,1)[0];return fields.has(field)?field:undefined;
}
export function responseError(body,status,requestId){
 const error=apiError(body,status,requestId);
 if(error.param)error.param=fieldOf(error.param);
 if(![400,422].includes(status))return error;
 let detail=body;
 for(let depth=0;depth<4&&isObject(detail);depth++){
  if(isObject(detail.error)||Array.isArray(detail.error))detail=detail.error;
  else if(isObject(detail.detail)||Array.isArray(detail.detail))detail=detail.detail;
  else break;
 }
 for(const issue of Array.isArray(detail)?detail:[detail]){
  if(!isObject(issue))continue;
  const field=fieldOf(issue.param)||(Array.isArray(issue.loc)?issue.loc.map(fieldOf).find(Boolean):undefined);
  if(field){error.param=field;break;}
 }
 return error;
}
