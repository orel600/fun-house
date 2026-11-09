// node tools/blender/shoot-kit.js <kit.json> <תמונה.png> [--gpu]. kit.json: {title, base, cur:[...], add:[...], hide:[...], anims:[[קליפ,שנייה]...]}. חלק: {bone,key|file,pos,rot,scale,tint,glow}; file = נתיב ל-GLB
const fs=require('fs'),path=require('path'),{chromium}=require('playwright'),GPU=require('../gpu.js');
(async()=>{const cfg=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));for(const p of [...cfg.cur,...cfg.add])if(p.file)p.b64=fs.readFileSync(path.resolve(path.dirname(process.argv[2]),p.file)).toString('base64');
  const b=await chromium.launch(GPU.launchOpts(GPU.gpuOn()?[]:['--use-angle=swiftshader','--enable-unsafe-swiftshader']));const pg=await b.newPage({viewport:{width:1500,height:900},deviceScaleFactor:1});pg.on('console',m=>console.log('console:',m.text()));
  await pg.addInitScript(k=>{window.KIT=k},cfg);await pg.goto('file://'+path.join(__dirname,'preview-kit.html'));
  await pg.waitForFunction(()=>document.title==='ready'||document.title.startsWith('ERR'),null,{timeout:180000});console.log(await pg.title());
  await pg.screenshot({path:path.resolve(process.argv[3]),fullPage:true});await b.close()})();
