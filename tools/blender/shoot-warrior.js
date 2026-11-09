// מצלם את preview-warrior.html: node tools/blender/shoot-warrior.js <תמונה.png> [--gpu]
const path=require('path'),{chromium}=require('playwright'),GPU=require('../gpu.js');
(async()=>{const here=__dirname,outp=path.resolve(process.argv[2]);const b=await chromium.launch(GPU.launchOpts(GPU.gpuOn()?[]:['--use-angle=swiftshader','--enable-unsafe-swiftshader']));
  const p=await b.newPage({viewport:{width:1500,height:900},deviceScaleFactor:1});p.on('console',m=>console.log('console:',m.text()));
  await p.goto('file://'+path.join(here,'preview-warrior.html'));
  await p.waitForFunction(()=>document.title==='ready'||document.title.startsWith('ERR'),null,{timeout:120000});console.log(await p.title());
  await p.screenshot({path:outp,fullPage:true});await b.close()})();
