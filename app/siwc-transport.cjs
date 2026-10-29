// Reproducible overlay of the SDK response transport, never OAuth code.
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
function install(root=path.join(__dirname,'..')){
 const target=path.join(root,'vendor/siwc/packages/local/dist/responses.js');
 const source='export { streamResponse } from '+JSON.stringify(pathToFileURL(path.join(root,'app/siwc-responses.mjs')).href)+';\n';
 if(fs.readFileSync(target,'utf8')!==source)fs.writeFileSync(target,source);
}
module.exports={install};
