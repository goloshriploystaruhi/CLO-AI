(()=>{
 const root=document.getElementById('help-content');
 const node=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');let current=null,frame=0;
 const asset=src=>typeof src==='string'&&/^assets\/measurements\/[a-z0-9_-]+\.(?:gif|png)$/.test(src)?src:null;
 function fit(){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const title=root.querySelector('h1'),description=root.querySelector('p');if(!title||!description)return;root.classList.toggle('text-only',title.getBoundingClientRect().height+description.getBoundingClientRect().height+12>root.clientHeight);});}
 function render(data){if(!data)return;current=data;const h=data.help;root.classList.remove('text-only');root.replaceChildren(node('h1',data.name),node('p',h.short_description));
  const illustration=h.illustration||{},src=asset(motion.matches?illustration.poster:illustration.src);
  if(src){const figure=document.createElement('figure'),image=document.createElement('img');figure.className='measurement-animation';image.src=src;image.alt=illustration.alt||data.name+' — схема измерения';image.width=illustration.width||528;image.height=illustration.height||600;image.decoding='async';image.addEventListener('error',()=>{figure.remove();},{once:true});figure.append(image);if(illustration.view)figure.append(node('figcaption',illustration.view));root.append(figure);}
  document.title=data.name+' — как снять мерку';root.scrollTop=0;window.scrollTo(0,0);fit();
 }
 const resize=new ResizeObserver(fit);resize.observe(root);document.fonts.ready.then(fit);const motionChanged=()=>{if(current)render(current);};window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);resize.disconnect();motion.removeEventListener('change',motionChanged);});
 motion.addEventListener('change',motionChanged);
 let updated=false;window.measurementHelp.onUpdate(data=>{updated=true;render(data);});window.measurementHelp.current().then(data=>{if(!updated)render(data);}).catch(()=>root.replaceChildren(node('p','Не удалось загрузить инструкцию. Нажмите на мерку ещё раз.')));
})();
