// מצלם את preview-hero.html: node tools/trellis/shoot-hero.js <דמות.glb> <מפתח הדמות הנוכחית, למשל ranger> <תמונה.png> [--bow] [--gpu]
const fs=require('fs'),path=require('path'),{chromium}=require('playwright'),GPU=require('../gpu.js');
(async()=>{const [glb,base,outp]=process.argv.slice(2,5);const b=await chromium.launch(GPU.launchOpts(GPU.gpuOn()?[]:['--use-angle=swiftshader','--enable-unsafe-swiftshader']));
  const p=await b.newPage({viewport:{width:1500,height:900},deviceScaleFactor:1});p.on('console',m=>console.log('console:',m.text()));
  await p.addInitScript(n=>{window.NEW=n},{glb:fs.readFileSync(path.resolve(glb)).toString('base64'),base,bow:process.argv.includes('--bow')});
  await p.goto('file://'+path.join(__dirname,'preview-hero.html'));
  await p.waitForFunction(()=>document.title==='ready'||document.title.startsWith('ERR'),null,{timeout:180000});console.log(await p.title());
  await p.screenshot({path:path.resolve(outp),fullPage:true});await b.close()})();
