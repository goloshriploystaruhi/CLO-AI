const identifier=(value,max=160)=>typeof value==='string'&&value.length<=max&&/^[a-zA-Z0-9_][a-zA-Z0-9_.:[\]-]*$/.test(value)?value:undefined;
function safe(error){
 const result={};
 for(const key of ['code','param','requestId']){const value=identifier(error?.[key]);if(value)result[key]=value;}
 if(Number.isInteger(error?.status)&&error.status>=100&&error.status<=599)result.status=error.status;
 if(typeof error?.retryable==='boolean')result.retryable=error.retryable;
 return result;
}
function text(error){
 const info=safe(error);if(!info.status&&!info.requestId&&!info.param)return '';
 return [info.status&&'Ответ сервера: HTTP '+info.status,info.code&&'Код: '+info.code,info.param&&'Поле запроса: '+info.param,info.requestId&&'Идентификатор запроса: '+info.requestId].filter(Boolean).join('\n');
}
module.exports={safe,text};
