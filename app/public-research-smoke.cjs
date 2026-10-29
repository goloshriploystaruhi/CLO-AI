// Opt-in anonymous live research check. No account, API key, user profile or GUI.
const {app,net}=require('electron'),fs=require('node:fs'),path=require('node:path');
fs.mkdirSync(path.join(__dirname,'../research'),{recursive:true});const folder=fs.mkdtempSync(path.join(__dirname,'../research/public-research-live-'));app.setPath('userData',path.join(folder,'electron'));
app.whenReady().then(async()=>{const started=Date.now();try{
 const tools=require('./web-research.cjs'),found=await tools.search(process.argv[2]||'garment construction pattern drafting tutorial',{fetch:(url,init)=>net.fetch(url,init)});
 const report={computer_use:false,account_used:false,query:found.query,provider:found.provider,attempts:found.attempts,results:found.results,elapsed_ms:Date.now()-started};
 if(found.results.length){try{const page=await tools.read(found.results[0].url,{fetch:(url,init)=>net.fetch(url,init)});report.read={url:page.url,title:page.title,text_characters:page.text.length};}catch(error){report.read_error=error.message;}}
 fs.writeFileSync(path.join(__dirname,'../research/public-research-live.json'),JSON.stringify(report,null,2));app.quit();
 }catch(error){fs.writeFileSync(path.join(__dirname,'../research/public-research-live.json'),JSON.stringify({error:error.message,elapsed_ms:Date.now()-started,computer_use:false},null,2));app.exit(1);}});
