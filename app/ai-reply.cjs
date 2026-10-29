const validation=require('./command-validation.cjs');
function parse(text){
 if(typeof text!=='string'||!text.trim())throw Error('AI вернул пустой ответ. Повторите запрос.');
 let raw=text.trim();if(/^```(?:json)?\s*\n[\s\S]*\n```$/i.test(raw))raw=raw.replace(/^```(?:json)?\s*\n/i,'').replace(/\n```$/,'').trim();
 let spec;
 try{spec=JSON.parse(raw);}catch{
  // Plain text is a conversational answer, never an executable command.
  if(/^[\[{`]/.test(raw))throw Error('AI вернул некорректную команду. Лекала не изменены; повторите запрос.');
  spec={message:raw};
 }
 validation.response(spec);return spec;
}
module.exports={parse};
