const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
(async()=>{
 const out=path.resolve(process.argv[2]||'compact-evidence');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']});
 const page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route(/^https?:/,r=>r.fulfill({status:200,body:''}));
 await page.addInitScript(()=>{localStorage.clear();localStorage.setItem('zm-gfx','3d');localStorage.setItem('zm-gfx-slow','0')});
 await page.goto('file://'+path.resolve('index.html')+'?compact=1&mbdummy=1&m3dIdle=0');
 await page.waitForFunction(()=>typeof R3D!=='undefined'&&R3D.ready,{timeout:30000});
 await page.evaluate(()=>mobaStart('tank'));
 await page.waitForFunction(()=>S.mb&&MB.me&&R3D.player);
 for(const kit of ['tank','warrior','hunter','mage','assassin']){
   await page.evaluate(async kit=>{mobaStart(kit);await m3dGo(MBCOMPACT.keys[kit]);},kit);
   await page.waitForTimeout(1500);
   await page.screenshot({path:out+'/'+kit+'-game.png'}); const info=await page.evaluate(()=>({L:R3D.player?.L,props:Object.keys(R3D.player?.props||{}),boneNames:(()=>{const a=[];R3D.player.root.traverse(o=>{if(o.isBone)a.push(o.name)});return a})()}));fs.writeFileSync(out+'/'+kit+'-actor.json',JSON.stringify(info,null,2));
 }
 // Standalone actual rig/clip evidence at useful size, using game's own parsed skeleton and clips.
 const result=await page.evaluate(async()=>{
   for(const key of Object.values(MBCOMPACT.keys))await m3dGo(key);
   return {keys:Object.keys(R3D.tmpl).filter(k=>k.startsWith('compact')),clips:Object.keys(R3D.clips).filter(k=>!k.includes('@')),mode:R3D.on,errors:[]};
 });
 fs.writeFileSync(out+'/test.json',JSON.stringify({result,errors},null,2));
 await page.screenshot({path:out+'/current.png'});
 await browser.close();console.log(JSON.stringify({out,errors,result}));
})();
