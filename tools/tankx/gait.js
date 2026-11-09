// node tools/tankx/gait.js [model] [k] [clip]: lift/contact speed/stride of the feet normalised by body height (heights per second). Compare tankX with barbarian.
const path=require('path'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--allow-file-access-from-files']});const p=await b.newPage();p.on('console',m=>console.log('console:',m.text()));
 await p.goto('file:///'+path.join(__dirname,'gait.html').split(String.fromCharCode(92)).join('/')+'?m='+(process.argv[2]||'tankX')+'&k='+(process.argv[3]||1)+'&clip='+(process.argv[4]||'Running_B'));
 await p.waitForFunction(()=>document.title==='ready'||document.title.startsWith('ERR'),null,{timeout:120000});console.log(await p.title(),JSON.stringify(await p.evaluate(()=>window.RESULT)));await b.close()})();
