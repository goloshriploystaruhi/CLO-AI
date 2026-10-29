const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {DialogueManager}=require('./dialogue-manager.cjs'),{ConversationStore}=require('./conversation-store.cjs'),{BodyProfiles}=require('./body-profiles.cjs');
const design=()=>({version:1,name:'Новая конструкция',category:'custom',parameters:{width_mm:200,height_mm:300},measurements:[],seam_allowance_mm:10,pieces:[{role:'panel',name:'Деталь',primitive:{type:'rectangle',width:'p_width_mm',height:'p_height_mm'}}]});
function setup(){const folder=testWorkspace.create('design-dialogue-'),profiles=new BodyProfiles(path.join(folder,'profiles.json'));profiles.create({name:'Человек',metadata:{sex:'female'}});const conversation=new ConversationStore(path.join(folder,'conversation.json')),ticket={project_id:'project',session_id:'session',content_digest:'empty'},data={draft:{method:'wide_trousers_experimental_v1',parameters:{length_mm:1000}},design_draft:{design:design(),profile_id:profiles.data.active}},garments=[{id:'first'},{id:'second'}];let active='first';const runtime={state:{...ticket},stores:{profiles,garments:{data}},assert(t){assert.equal(t.session_id,this.state.session_id);},isCurrent:t=>t.session_id===ticket.session_id,assertGarment:query=>{const result=garments.find(g=>g.id===(query==='selected'?active:query));if(!result)throw Error('Изделие отсутствует');return result;},assertPiece:()=>{throw Error('No piece expected');}};
 const manager=new DialogueManager(conversation,runtime),turn={ticket,operation_id:'operation',allowApproximate:false};return {manager,profiles,conversation,data,runtime,ticket,turn,active(value){active=value;},question(){return manager.missing(turn,{needs_input:{method:'parametric_design_v1',missing_measurements:['waist']}}).question;},consume(q){return manager.consume({id:q.actions.find(a=>a.type==='continue_draft').id,question_id:q.id,project_session:ticket.session_id});}};}
test('generic missing measurements offer a scoped continuation without resurrecting an old trouser draft',()=>{
 const h=setup(),q=h.question();assert(q.actions.some(a=>a.type==='open_profiles'));assert(q.actions.some(a=>a.type==='continue_draft'));
 const selected=h.consume(q);assert.equal(selected.spec.tools[0].action,'create_pattern_design');assert.deepEqual(selected.spec.tools[0].args.design,h.data.design_draft.design);assert.equal(selected.spec.tools[0].args.method,undefined);assert.equal(selected.params.text,'Продолжай без этих данных');
});

test('a direct collaborative request executes the current design without another approval loop',()=>{
 for(const text of ['Давай тогда создадим один носок, не обязательно пару','Давайте построим другую деталь','Давай лучше изменим ширину']){
  const h=setup();h.manager.begin(h.ticket,'current',text);
  const tool={action:'create_pattern_design',args:{design:design()}},result=h.manager.accept({dialogue:{intent:'construction',tools:[tool]}},h.turn,text);
  assert.deepEqual(result.tools,[tool],text);assert.equal(h.manager.state.proposal,null,text);
 }
});

test('discussion, hypothetical suggestions and refusals do not gain execution authority from collaborative verbs',()=>{
 for(const text of ['Давай обсудим, как создадим деталь','Может создадим один носок?','Давай тогда создадим один носок, но пока не создавай','Пока только обсудим: давай сделаем деталь','Проведи проверку конструкции, ничего не меняй']){
  const h=setup();h.manager.begin(h.ticket,'current',text);
  const result=h.manager.accept({dialogue:{intent:'construction',tools:[{action:'create_pattern_design',args:{design:design()}}]}},h.turn,text);
  assert(result.question,text);assert(h.manager.state.proposal,text);
 }
});
test('changes to generic parameters, measurements or sex invalidate its continuation',()=>{
 for(const change of [h=>{h.data.design_draft.design.parameters.width_mm=250;},h=>h.profiles.update({measurement:'height',value:180,unit:'cm'}),h=>h.profiles.tool('update_profile_metadata',{metadata:{sex:'male'}})]){const h=setup(),q=h.question();change(h);assert.throws(()=>h.consume(q),/Черновик изменился|Профиль мерок изменился/);assert.equal(h.manager.state.questions.at(-1).status,'active');}
});
test('explicit textual continuation pins the generic draft but a new garment request does not inherit it',()=>{
 const h=setup();h.manager.state.brief='Свободная накидка';h.manager.save();const approved=h.manager.begin(h.ticket,'next','Продолжай без этих данных');assert.equal(approved.tools[0].action,'create_pattern_design');assert.deepEqual(approved.tools[0].args.design,h.data.design_draft.design);
 assert.equal(h.manager.begin(h.ticket,'other','Создай другую юбку без мерок'),null);assert.equal(h.manager.begin(h.ticket,'discussion','Пока не строй, только обсудим'),null);
});
test('editing continuation and proposed selected revisions remain bound to the original garment ID',()=>{
 const h=setup();h.data.design_draft={design:design(),profile_id:h.profiles.data.active,query:'first',editing:true};const q=h.question();h.active('second');assert.equal(h.consume(q).spec.tools[0].args.query,'first');
 h.active('first');const plan=h.manager.accept({dialogue:{intent:'planning',message:'Предлагаю изменить ширину',tools:[{action:'revise_pattern_design',args:{query:'selected',parameters:{width_mm:230}}}]}},h.turn,'Давай обсудим ширину');assert(plan.question);assert.equal(h.manager.state.proposal.spec.tools[0].args.query,'first');h.active('second');const approved=h.manager.consume({id:plan.question.actions.find(a=>a.type==='approve_proposal').id,question_id:plan.question.id,project_session:h.ticket.session_id});assert.equal(approved.spec.tools[0].args.query,'first');
});
test('registered draft continuation retains existing behavior and never obtains a generic command',()=>{
 const h=setup();delete h.data.design_draft;const q=h.question(),selected=h.consume(q);assert.equal(selected.spec,undefined);assert.equal(selected.type,'continue_draft');assert.equal(h.manager.begin(h.ticket,'next','Продолжай без этих данных'),null);
});
test('consumed decisions persist but never return as buttons when chat history is restored',()=>{
 const h=setup(),q=h.question();h.conversation.add('assistant','Можно продолжить с допущениями',{question_id:q.id});
 assert.equal(h.manager.decorate(h.conversation.list())[0].question.id,q.id);h.consume(q);
 const restored=new ConversationStore(h.conversation.file),manager=new DialogueManager(restored,h.runtime),message=manager.decorate(restored.list())[0];
 assert.equal(message.text,'Можно продолжить с допущениями');assert.equal(message.question,undefined);
 assert.equal(manager.state.questions[0].status,'completed');assert.equal(manager.state.questions[0].actions.filter(a=>a.status==='completed').length,1);
 assert.equal(manager.snapshot().questions.length,0);assert.throws(()=>manager.consume({id:q.actions[1].id,question_id:q.id,project_session:h.ticket.session_id}),/больше не актуален/);
});
test('cancelled and legacy embedded questions cannot resurrect stale controls on history load',()=>{
 const h=setup(),q=h.question();h.conversation.add('assistant','Ранее заданный вопрос',{question:q});
 h.manager.begin(h.ticket,'new','Обсудим другую конструкцию');assert.equal(h.manager.decorate(h.conversation.list())[0].question,undefined);
 assert.equal(h.manager.decorate([{role:'assistant',text:'Старый вопрос',question:{...q,id:'absent'}}])[0].question,undefined);
});
test('textual continuation cannot switch a real draft to another person but can attach an initially missing profile',()=>{
 const h=setup(),oldProfile=h.profiles.data.active;h.profiles.create({name:'Другой человек'});assert.throws(()=>h.manager.begin(h.ticket,'wrong','Продолжай без этих данных'),/Черновик относится к другому профилю/);assert.equal(h.data.design_draft.profile_id,oldProfile);
 h.data.design_draft.profile_id=null;assert.equal(h.manager.begin(h.ticket,'missing','Продолжай без этих данных').tools[0].action,'create_pattern_design');
 h.data.design_draft.profile_id='reference-design-draft';assert.equal(h.manager.begin(h.ticket,'reference','Продолжай без этих данных').tools[0].action,'create_pattern_design');
 h.data.design_draft.profile_id=h.profiles.data.active;assert.equal(h.manager.begin(h.ticket,'matched','Продолжай без этих данных').tools[0].action,'create_pattern_design');
});
