// Bounded skill-body playback proof: warrior s1 must fade at source time to*D, not run to clip end.
const {chromium}=require('playwright'),path=require('path'),GPU=require('./gpu.js');
(async()=>{
  const repo=process.argv[2];
  const browser=await chromium.launch(GPU.launchOpts(['--use-angle=swiftshader','--enable-unsafe-swiftshader']));
  const page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.clock.install({time:0});await page.clock.pauseAt(1000);
  await page.goto('file://'+path.resolve(repo,process.argv[4]==='preview'?'preview.html':'index.html')+(process.argv[4]==='preview'?'':'?compact=1'+(process.argv[4]||'')));
  await page.clock.runFor(300);
  await page.evaluate(()=>{mobaStart('warrior')});
  await page.clock.runFor(1200);
  await page.waitForTimeout(4000);   // GLB + clips load real-async
  await page.clock.runFor(600);
  const target=await page.evaluate(()=>{loopPause();const u=MB.me;u.inv=0;u.hp=u.max=10000;u.x=P.x=500;u.y=P.y=0;MBCAM.free=true;MBCAM.x=S.cam.x=500;MBCAM.y=S.cam.y=0;
   const foe=MB.u.find(e=>e.k==='hero'&&e.team!==u.team);foe.x=580;foe.y=0;foe.inv=0;foe.actT=MB.t;foe.hp=foe.max;mbVisNow(true);MB.lock=null;
   MB.zones.push({x:560,y:70,r:65,team:u.team,delay:1,t0:1,left:1,look:'test'});render();
   const r=cvs.getBoundingClientRect();return{x:r.left+(foe.x-S.cam.x+W/2)/W*r.width,y:r.top+(foe.y-S.cam.y+H/2)/H*r.height,visible:mbShow(foe),targetable:mbAtkOk(u,foe),team:u.team};
  });
  const button=await page.locator('#mbAtk').boundingBox();await page.mouse.move(button.x+button.width/2,button.y+button.height/2);await page.mouse.down();await page.mouse.move(target.x,target.y,{steps:8});await page.mouse.up();
  await page.evaluate(()=>render());await page.screenshot({path:process.argv[3]+'-input-lock.png'});
  console.log(JSON.stringify({errors,target,state:await page.evaluate(()=>({mode:!!S.mb,r:MB.me.r,hero:heroLook().h,zones:MB.zones.length,lock:!!MB.lock,lockVisible:MB.lock&&mbShow(MB.lock)}))}));
  await browser.close()})().catch(e=>{console.error('FATAL',e);process.exit(1)});
