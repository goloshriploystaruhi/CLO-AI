(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MeasurementFields=api;})(typeof globalThis==='undefined'?this:globalThis,()=>{
 const femaleIds=Object.freeze(['underbust','bust_height','bust_spacing']);
 const legacy=Object.freeze({waist_level:true,seat_length:true});
 function applies(def,sex){return !['female','male'].includes(sex)||!Array.isArray(def.applies_to)||def.applies_to.includes(sex);}
 function visible(def,sex){return def.profile_visible!==false&&applies(def,sex);}
 function annotate(catalog,{basicIds=[],methods={},planning={}}={}){
  // Keep every field needed by an implemented base, a planning checklist or
  // the basic person profile. Extra and historical values remain in storage.
  const used=new Set([...basicIds,'age','weight',...Object.values(methods).flatMap(m=>[...(m.required_measurements||[]),...(m.recommended_measurements||[])]),...Object.values(planning).flat()]);
  return catalog.map(def=>{
   const historical=Object.hasOwn(legacy,def.id),profile_visible=used.has(def.id)&&!historical;
   return {...def,profile_visible,applies_to:Array.isArray(def.applies_to)?[...def.applies_to]:femaleIds.includes(def.id)?['female']:['female','male'],...(!profile_visible?{hidden_reason:historical?'ambiguous_legacy':'unused_in_current_methods'}:{})};
  });
 }
 return {femaleIds,legacy,applies,visible,annotate};
});
