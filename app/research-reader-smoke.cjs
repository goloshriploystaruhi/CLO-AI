// Opt-in anonymous network proof; no main app, user profile, account or GUI.
const {app,net}=require('electron'),fs=require('node:fs'),path=require('node:path');
const research=path.join(__dirname,'../research');fs.mkdirSync(research,{recursive:true});const folder=fs.mkdtempSync(path.join(research,'source-reader-live-'));app.setPath('userData',path.join(folder,'electron'));
app.whenReady().then(async()=>{
 const web=require('./web-research.cjs'),fetch=(url,options)=>net.fetch(url,options),report={computer_use:false,account_used:false,real_app_started:false,queries:[]};
 try{for(const query of ['sew socks pattern EU42','sew raglan jacket pattern drafting tutorial']){
  const start=Date.now(),found=await web.search(query,{fetch}),row={query,provider:found.provider,attempts:found.attempts,results:found.results.map(r=>({url:r.url,title:r.title,relevance:r.relevance})),reads:[]};
  for(const result of found.results.slice(0,2)){try{const page=await web.read(result.url,{fetch});row.reads.push({url:page.url,valid:page.valid!==false,format:page.format,code:page.code,characters:page.text?.length||0,coverage:page.coverage,elapsed_ms:page.elapsed_ms});}catch(error){row.reads.push({url:result.url,valid:false,code:error.code||'guard_or_network_error'});}}
  row.elapsed_ms=Date.now()-start;report.queries.push(row);
 }
 report.completed=true;fs.writeFileSync(path.join(research,'source-reader-live.json'),JSON.stringify(report,null,2));app.quit();
 }catch(error){report.error=error.message;fs.writeFileSync(path.join(research,'source-reader-live.json'),JSON.stringify(report,null,2));app.exit(1);}
});
