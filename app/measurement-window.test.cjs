const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {create,position}=require('./measurement-window.cjs');
class Window extends EventEmitter{
 constructor(options={}){super();this.options=options;this.bounds={x:50,y:40,width:600,height:600};this.webContents={setWindowOpenHandler:()=>{},send:(name,data)=>{this.last={name,data};}};}
 isDestroyed(){return !!this.closed;}getBounds(){return this.bounds;}setPosition(x,y){Object.assign(this.bounds,{x,y});}setMenuBarVisibility(){}loadFile(){return Promise.resolve();}showInactive(){this.shown=true;}hide(){this.shown=false;}close(){this.closed=true;this.emit('closed');}
}
test('measurement instructions reuse one nonmodal 300 × 600 window, stay on the left and follow the parent',async()=>{
 const parent=new Window(),screen={getDisplayMatching:()=>({workArea:{x:0,y:0,width:1920,height:1080}})},catalog=()=>[{id:'height',name:'Рост',unit:'mm'},{id:'weight',name:'Вес',unit:'kg'}];
 const help=create({BrowserWindow:Window,screen,parent,catalog});
 await help.open('height');const window=help.window();assert.equal(window.options.width,300);assert.equal(window.options.height,600);assert.equal(window.options.modal,false);assert.equal(window.options.webPreferences.sandbox,true);assert.equal(window.options.backgroundColor,'#060606');assert.equal(window.getBounds().x+320,parent.getBounds().x);assert(help.owns(window.webContents));assert(!help.owns({}));
 await help.open('weight');assert.equal(help.window(),window);assert.equal(help.state().id,'weight');assert.equal(window.last.data.unit,'кг');
 parent.setPosition(900,100);parent.emit('move');assert.equal(window.getBounds().x,580);assert.equal(window.getBounds().y,100);
 await assert.rejects(help.open('../private'),/Мерка не найдена/);assert.equal(help.state().id,'weight');
 parent.emit('minimize');assert.equal(window.shown,false);parent.emit('restore');assert.equal(window.shown,true);
 help.close();assert(window.closed);assert.equal(help.state(),null);await help.open('height');assert.notEqual(help.window(),window);parent.close();assert.equal(help.window(),null);
});
test('helper positions clamp to display work area, including negative monitor coordinates',()=>{
 assert.deepEqual(position({x:-500,y:-50},{x:-1920,y:0,width:1920,height:1080}),{x:-820,y:0});
 assert.deepEqual(position({x:10,y:1000},{x:0,y:0,width:1920,height:1080}),{x:0,y:480});
});
