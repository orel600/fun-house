// מצלם את preview-hammer.html: node tools/blender/shoot-hammer.js <hammer.glb> <תמונה.png> [--crown=<hat.glb>] [--gpu]
const fs=require('fs'),path=require('path'),{chromium}=require('playwright'),GPU=require('../gpu.js');
(async()=>{const here=__dirname,outp=path.resolve(process.argv[3]);const b=await chromium.launch(GPU.launchOpts(GPU.gpuOn()?[]:['--use-angle=swiftshader','--enable-unsafe-swiftshader']));
  const p=await b.newPage({viewport:{width:1500,height:900},deviceScaleFactor:1});p.on('console',m=>console.log('console:',m.text()));
  await p.addInitScript(w=>{window.WEAP=w},Object.assign({stoneHammer:fs.readFileSync(path.resolve(process.argv[2])).toString('base64')},(c=>c?{tankCrown:fs.readFileSync(path.resolve(c.slice(8))).toString('base64')}:{})(process.argv.find(a=>a.startsWith('--crown=')))));await p.goto('file://'+path.join(here,'preview-hammer.html'));
  await p.waitForFunction(()=>document.title==='ready'||document.title.startsWith('ERR'),null,{timeout:120000});console.log(await p.title());
  await p.screenshot({path:outp,fullPage:true});await b.close()})();
