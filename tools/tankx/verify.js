// node tools/tankx/verify.js [tankX|wandererX] : בודק את tankX (הגוף) מול כל הקליפים ב-TANKX.verifyClips: רצועות שנקשרות, גובה סביר לאורך הקליפ, אין NaN. כותב JSON. בלי כרטיס מסך.
const path=require('path'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--allow-file-access-from-files']});const p=await b.newPage();p.on('console',m=>console.log('console:',m.text()));
 await p.goto('file:///'+path.join(__dirname,'verify.html').split(String.fromCharCode(92)).join('/')+'?m='+(process.argv[2]||'tankX'));
 await p.waitForFunction(()=>document.title==='ready'||document.title.startsWith('ERR'),null,{timeout:120000});const t=await p.title();
 const r=await p.evaluate(()=>window.RESULT);console.log(t);console.log(JSON.stringify(r,null,1));await b.close();
 if(t.startsWith('ERR')||Object.values(r.clips).some(c=>c.status==='FAIL'))process.exit(1)})();
