// node film.js cfg.json out.png [--gpu]   cfg: {rows:[{label,glbFile,mode,pbr:{n,m,r}(files),clips,scaleH|scale,deg,az,rotY,prop:{glbFile,bone,pos,rot,scale}}]}
const fs=require('fs'),path=require('path'),{chromium}=require('playwright'),GPU=require('C:/Orel claude/fh-ari-tank/tools/gpu.js');
const b64=f=>fs.readFileSync(f).toString('base64');
(async()=>{const cfg=JSON.parse(fs.readFileSync(process.argv[2]));
 for(const r of cfg.rows){r.glb=b64(r.glbFile);if(r.pbr)for(const k of ['n','m','r'])r.pbr[k]=b64(r.pbr[k]);if(r.prop)r.prop.glb=b64(r.prop.glbFile)}
 const b=await chromium.launch(GPU.launchOpts(['--allow-file-access-from-files']));
 const p=await b.newPage({viewport:{width:1500,height:900}});p.on('console',m=>console.log('c:',m.text()));
 await p.addInitScript(c=>{window.CFG=c},cfg);await p.goto('file:///'+path.join(__dirname,'film.html').split(String.fromCharCode(92)).join('/'));
 await p.waitForFunction(()=>document.title==='ready'||document.title.startsWith('ERR'),null,{timeout:240000});console.log(await p.title());
 console.log(JSON.stringify(await p.evaluate(()=>window.INFO)));
 await p.screenshot({path:process.argv[3],fullPage:true});await b.close()})();
