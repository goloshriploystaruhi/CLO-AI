const {GarmentStore}=require('./garment-store.cjs'),validation=require('./command-validation.cjs');
function parameters(args){return args.features?.length?{...args.parameters,development:{version:1,features:args.features,sources:args.sources||[]}}:args.parameters;}
async function trial(tool,context){
 const {stores,turn}=context;
 if(['create_pattern_design','revise_pattern_design','trial_pattern_design'].includes(tool.action))return require('./construction-tools.cjs').trial(tool,{stores,turn});
 validation.tool(tool);const args=tool.args||{};
 const isolated=new GarmentStore(stores.garments.file);isolated.data=structuredClone(stores.garments.data);isolated.save=()=>{};
 const editing=['update_garment','revise_development'].includes(tool.action);
 const revision=tool.action==='revise_development'?{_development:{version:1,features:args.features,sources:args.sources||[]}}:{};
 const result=await isolated.build({...args,...revision,parameters:parameters(args),approximateConsent:turn.allowApproximate},stores.profiles,editing);
 if(result.needs_input)return {needs_input:result.needs_input,message:result.message};
 if(!result.garment)return {valid:false,message:result.message||'Не удалось проверить конструкцию',issues:result.qa_report?.issues};
 const g=result.garment,work_order=require('./garment-patternmaking-tools.cjs').guard(context,g);
 return {valid:!work_order||work_order.allows_construction,...(work_order?{work_order,message:work_order.message}:{}),clo_changed:false,method:g.method,parameters:g.parameters,pieces:g.pieces.map(p=>({role:p.role,name:p.name,seams:p.seams})),seam_count:g.sewing_graph.length,fit_verified:false};
}
async function read(tool,context){
 validation.tool(tool);const {stores,runtime}=context,a=tool.args||{};
 if(require('./construction-tools.cjs').actions.has(tool.action))return require('./construction-tools.cjs').read(tool,context);
 if(tool.action==='search_sources')return require('./source-research.cjs').searchAndRead(a.query,{signal:context.signal,maxPages:context.researchPolicy?.remainingPages});
 if(tool.action==='read_web_source')return require('./web-research.cjs').read(a.url,{signal:context.signal});
 if(tool.action==='trial_garment')return trial(tool,context);
 if(tool.action==='get_category_engineering')return {message:require('./category-engineering.cjs').summary(a.category)};
 if(tool.action==='get_engineering_knowledge'){const kb=require('../engineering/knowledge-base.json');return {method:kb.implemented_methods.find(m=>m.id==='clo_ai/'+a.method)};}
 if(tool.action==='list_construction_methods')return Object.values(require('../construction-catalog.json')).filter(m=>!a.category||m.category===a.category);
 if(tool.action==='list_garments')return runtime.currentGarments();
 if(tool.action==='get_garment')return runtime.assertGarment(a.query);
 if(tool.action==='get_pattern_piece')return runtime.assertPiece(a.query);
 if(tool.action==='list_pattern_pieces')return runtime.currentPieces();
 return stores.profiles.tool(tool.action,a);
}
module.exports={trial,read,parameters};
