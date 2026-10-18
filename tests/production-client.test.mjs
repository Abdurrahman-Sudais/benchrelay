import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM, VirtualConsole} from 'jsdom';
test('production client hydrates generated pages without simulated-DOM runtime errors',async()=>{
 const index=await readFile('dist/index.html','utf8');
 const source=index.match(/<script type="module"[^>]*src="([^"]+)"/)[1];
 const code=await readFile('dist'+source,'utf8');
 for(const [file,path] of [['index.html','/'],['privacy/index.html','/privacy'],['terms/index.html','/terms'],['brand/index.html','/brand'],['404.html','/unknown-page']]){
  const errors=[];const console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e.message));console.on('error',e=>errors.push(String(e)));
  const dom=new JSDOM(await readFile('dist/'+file,'utf8'),{url:'https://benchrelay.top'+path,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:console});
  dom.window.eval(code);
  await new Promise(resolve=>setTimeout(resolve,40));
  assert.deepEqual(errors,[],file+' hydrates cleanly');
  if(path==='/'){
   const menu=dom.window.document.querySelector('[aria-label="Open menu"]');menu.click();await new Promise(resolve=>setTimeout(resolve,10));assert.equal(menu.getAttribute('aria-expanded'),'true');
  }
  dom.window.close();
 }
});
