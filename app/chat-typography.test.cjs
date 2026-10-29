const {test}=require('node:test'),assert=require('node:assert/strict'),{size}=require('./chat-typography.js');
test('typography is width-driven, continuous and bounded for Cyrillic and long pasted paragraphs',()=>{
 const measure=(text,px)=>[...text].length*px*.5;
 assert.equal(size('',460,measure),48);assert.equal(size('Идея',460,measure),48);
 const text='Необычная свободная куртка с объёмными рукавами';const a=size(text,400,measure),b=size(text,399,measure);
 assert(a<48&&a>16);assert(b<a&&a-b<.1);assert.equal(size('Очень длинный текст '.repeat(200),460,measure),16);
 assert.equal(size('Идея\nКрой',460,measure),48);
 const pasted='Свободная куртка\nС карманами\nИ рукавами\nС воротником\nИ подкладкой';
 assert(size(pasted,460,measure)<48);assert.equal(size(('Короткая строка\n').repeat(100),460,measure),16);
 assert.equal(size(pasted.replaceAll('\n',' '),460,measure),size(pasted,460,measure));
});
test('native window uses the mockup size without resize, maximize or full-screen controls',()=>{
 const c=require('./window-config.cjs');assert.equal(c.width,600);assert.equal(c.height,600);assert.equal(c.resizable,false);assert.equal(c.maximizable,false);assert.equal(c.fullscreenable,false);
});

test('canvas tracking follows computed input styles at every font size',()=>{const {trackingRatio}=require('./chat-typography.js');assert.equal(trackingRatio({letterSpacing:'0.32px',fontSize:'16px'}),.02);assert.equal(trackingRatio({letterSpacing:'0.96px',fontSize:'48px'}),.02);assert.equal(trackingRatio({letterSpacing:'-1.92px',fontSize:'48px'}),-.04);assert.equal(trackingRatio({letterSpacing:'normal',fontSize:'16px'}),0);});

test('font fitting verifies the actual candidate when fractional shaping exceeds the proportional estimate',()=>{
 const measure=(text,px)=>text.length*px*.5+(px<48?12:0),text='Пример достаточно длинной строки для уменьшения';
 const px=size(text,560,measure);assert(px>16&&px<48);assert(measure(text,px)<=560);assert(measure(text,px+.01)>560);
 assert.equal(size(text.repeat(100),560,measure),16,'Long input must retain the minimum font size and normal wrapping');
});
