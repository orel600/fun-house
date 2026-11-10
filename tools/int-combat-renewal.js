// Staged actual-cast motion and contact fixture. Not natural combat acceptance.
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
  const id=process.argv[4]||'quake';
  await page.evaluate(id=>{enemies=[];S.boss=null;eb=[];pb=[];FXLIB.list=[];floats=[];ARSH.list=[];P.sw.t=P.gn.t=999;P.inv=0;P.hp=P.maxHp=100;S.run.tip=false;
   S.sk.ids=[id];S.sk.cd=[0];P.aim=0;
   for(const [kind,x,y] of [['golem',90,35],['grunt',-90,40],['wisp',70,-80]]){const e=addEnemy(kind,x,y);e.hp=e.max=10000;e.speed=0;e.dmg=0;e.home=0}
   skillUse(id);render();
  },id);
  const trace=[];
  for(let i=0;i<36;i++){
    
    
    await page.clock.runFor(1000/24);
    trace.push(await page.evaluate(()=>({t:S.t,hero:{x:P.x,y:P.y,r:P.r},swing:P.sw.anim,hits:KINETIC.hits.length,contacts:COMBATNEW.contacts.length,ground:COMBATNEW.ground.size,upright:COMBATNEW.upright.size,renewal:COMBATNEW.drawn,adopted:ARSH.list.map(e=>e.kind),foes:enemies.length,floats:floats.map(f=>({text:f.txt,x:f.x,y:f.y})),fx:FXLIB.list.filter(h=>h.on).map(h=>h.id)})));
    await page.screenshot({path:out+'/motion-'+String(i).padStart(3,'0')+'.png'});
  }
  fs.writeFileSync(out+'/trace.json',JSON.stringify({staged:true,seconds:1.5,fps:24,trace,errors},null,2));console.log(JSON.stringify({frames:trace.length,seconds:trace.at(-1).t-trace[0].t,hitFrames:trace.filter(t=>t.hits||t.contacts).length,errors}));
  await browser.close()})().catch(e=>{console.error('FATAL',e);process.exit(1)});
