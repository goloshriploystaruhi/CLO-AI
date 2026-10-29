// UI projection only: construction and native CLO operations stay in their existing modules.
function snapshot(garments,semantics,project){
 const groups=project?project.currentGarments():garments.data.garments;
 const all=project?project.currentPieces():semantics.list(),linked=new Set(groups.flatMap(g=>g.pieces.map(p=>p.id))),selected=all.some(p=>p.id===semantics.data.selected)?semantics.data.selected:null;
 const owner=groups.find(g=>g.pieces.some(p=>p.id===selected));
 return {active:owner?{kind:'garment',id:owner.id}:selected?{kind:'piece',id:selected}:groups.some(g=>g.id===garments.data.active)?{kind:'garment',id:garments.data.active}:null,
  labels:require('./garment-store.cjs').labels,
  project:project?.publicState(),native_parts:project?.state.parts||[],
  garments:groups.map(g=>({id:g.id,name:g.name,method:g.method,variant:g.method_spec?.variant,version:g.version,parameters:g.parameters,approximate:g.approximate,readiness:g.readiness,quality_status:g.quality_status,pieces:g.pieces.map(p=>({id:p.id,name:p.name,role:p.role}))})),
  pieces:all.filter(p=>!linked.has(p.id)).map(p=>({id:p.id,name:p.name,type:p.type,version:p.version,approximate:p.approximate,parameters:p.geometry?.parameters||{}}))};
}
function select(garments,semantics,arg,project){
 if(!arg||typeof arg.id!=='string'||!['garment','piece'].includes(arg.kind))throw Error('Выберите изделие или деталь из списка');
 if(arg.kind==='garment'){const g=garments.find(arg.id);garments.data.active=g.id;garments.save();semantics.data.selected=g.pieces[0]?.id||null;semantics.save();}
 else{const p=semantics.find(arg.id);semantics.data.selected=p.id;semantics.save();}
 return snapshot(garments,semantics,project);
}
module.exports={snapshot,select};
