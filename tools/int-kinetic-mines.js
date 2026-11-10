// Staged cosmetic boss-wear prototypes at phone landscape size. Not natural combat acceptance.
// Every shot: render() called once on the live state, then screenshot. Zero-error log.
const {chromium}=require('playwright'),path=require('path'),fs=require('fs'),GPU=require('./gpu.js');
(async()=>{
  const repo=process.argv[2],out=process.argv[3];fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch(GPU.launchOpts(['--use-angle=swiftshader','--enable-unsafe-swiftshader']));
  const page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.clock.install({time:0});await page.clock.pauseAt(1000);
  await page.goto('file://'+path.resolve(repo,'index.html')+'?arenanew=1');
  await page.clock.runFor(500);
  for(let i=0;i<20;i++){
    const done=await page.evaluate(()=>{
      const d=document.getElementById('dBtn');if(d&&!d.hidden){d.click();return 0}
      const c=document.querySelector('#heroCards [data-hero="warrior"]');
      if(c&&!document.getElementById('ovHero').hidden){c.click();return 0}
      return typeof S!=='undefined'&&S&&S.mode?1:0});
    if(done)break;
    await page.clock.runFor(700)}
  await page.evaluate(()=>{try{startRun()}catch(e){console.error('startRun',e)}});
  await page.clock.runFor(1500);
  await page.evaluate(()=>{S.mode='play';enemies=[];P.inv=0;P.x=P.y=0;S.cam.x=S.cam.y=0;S.run.tip=false;P.track.types.fire=1000;const b=makeBoss();b.x=160;b.y=20;b.hp=b.max=1e8;b.speed=0;b.dmg=0;b.patT=999;enemies=[b];S.boss=b;fxPreload(Object.values(ARFX.tele).map(d=>d.fx))});
  await page.clock.runFor(100);await page.waitForTimeout(2000);await page.clock.runFor(100);
  await page.evaluate(()=>{enemies=[];S.boss=null;eb=[];FXLIB.list=[];floats=[];P.sw.t=P.gn.t=999;P.inv=0;P.hp=100;S.run.tip=false;
   const b=makeBoss();b.x=170;b.y=-20;b.hp=b.max=10000;b.dmg=0;b.patT=999;b.speed=0;enemies=[b];S.boss=b;doPattern(b,'mines');
  });
  const trace=[];
  for(let i=0;i<48;i++){
    if(i===48)await page.keyboard.down('ArrowRight');if(i===72)await page.keyboard.up('ArrowRight');
    if(i===84)await page.keyboard.down('ArrowLeft');if(i===108)await page.keyboard.up('ArrowLeft');
    await page.clock.runFor(1000/24);
    trace.push(await page.evaluate(()=>({t:S.t,hero:{x:P.x,y:P.y,r:P.r},swing:P.sw.anim,hits:KINETIC.hits.length,mines:mines.length,blasts:KINETIC.blasts.length,foes:enemies.length,floats:floats.map(f=>({text:f.txt,x:f.x,y:f.y})),fx:FXLIB.list.filter(h=>h.on).map(h=>h.id)})));
    await page.screenshot({path:out+'/motion-'+String(i).padStart(3,'0')+'.png'});
  }
  fs.writeFileSync(out+'/trace.json',JSON.stringify({staged:true,seconds:2,fps:24,trace,errors},null,2));console.log(JSON.stringify({frames:trace.length,seconds:trace.at(-1).t-trace[0].t,hitFrames:trace.filter(t=>t.hits).length,errors}));
  await browser.close()})().catch(e=>{console.error('FATAL',e);process.exit(1)});
