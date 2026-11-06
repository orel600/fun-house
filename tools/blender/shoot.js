// מצלם את preview.html: node tools/blender/shoot.js <תיקיית ה-GLB> <תמונה.png>. ROWS ב-preview.html: איזה פריט, איזו דמות ואיזו אחיזה
const fs=require('fs'),path=require('path'),{chromium}=require('playwright');
(async()=>{const d=path.resolve(process.argv[2]),here=__dirname,outp=path.resolve(process.argv[3]);const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage({viewport:{width:1500,height:900},deviceScaleFactor:2});p.on('console',m=>{if(m.type()==='error')console.log('console:',m.text())});
  const W={};for(const k of ['skyBow','starStaff'])W[k]=fs.readFileSync(path.join(d,k+'.glb')).toString('base64');
  await p.addInitScript(w=>{window.WEAP=w},W);await p.goto('file://'+path.join(here,'preview.html'));
  await p.waitForFunction(()=>document.title==='ready'||document.title.startsWith('ERR'),null,{timeout:120000});console.log(await p.title());
  await p.screenshot({path:outp,fullPage:true});await b.close()})();
