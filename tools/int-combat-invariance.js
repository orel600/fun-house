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
  await page.goto('file://'+path.resolve(repo,'index.html')+'?arenanew=1'+(process.argv[4]||''));
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
  await page.evaluate(()=>loopPause());
  const all=[];
  for(const id of ['quake','splash','frost','flame','zap','comet','lance','bloom']){
    const result=await page.evaluate(id=>{
      let seed=714;const random=Math.random;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
      try{startRun();S.mode='play';P.x=P.y=0;P.inv=999;P.sw.t=P.gn.t=999;P.hp=50;S.cam.x=S.cam.y=0;enemies=[];eb=[];mines=[];waves=[];FXLIB.list=[];floats=[];S.run.tip=false;
        S.sk.ids=['quake',id];S.sk.cd=[999,0];if(id==='quake'){S.sk.ids=['quake'];S.sk.cd=[0]}
        for(const [x,y] of [[90,35],[-90,40],[70,-80],[200,0],[500,0]]){const e=addEnemy('grunt',x,y);e.hp=e.max=10000;e.dmg=0;e.speed=0;e.home=0}
        const at=S.t,ok=skillUse(id),samples=[];
        for(let i=0;i<=330;i++){
          if(i%5===0)samples.push({dt:+(S.t-at).toFixed(3),cd:S.sk.cd.map(n=>+n.toFixed(3)),used:S.sk.used,hero:[P.hp,P.r],foes:enemies.map(e=>({x:+e.x.toFixed(2),y:+e.y.toFixed(2),hp:e.hp,r:e.r,wet:e.wet,frozen:e.frozen,slow:e.slow,burn:e.burn})),pend:S.skm.pend.map(p=>[p.x,p.y,+p.t.toFixed(3),p.max]),pools:S.skm.pools.map(p=>[p.x,p.y,+p.t.toFixed(3),p.max,+p.tick.toFixed(3)])});
          update(.016);if(i%10===0)render();
        }
        const groundEnd=COMBATNEW.ground.size,uprightEnd=COMBATNEW.upright.size;S.sk.cd.fill(0);skillUse(id);update(.016);render();const groundActive=COMBATNEW.ground.size,uprightActive=COMBATNEW.upright.size;skillsReset();render();const groundReset=COMBATNEW.ground.size,uprightReset=COMBATNEW.upright.size;
        return{id,ok,samples,groundEnd,groundActive,groundReset,uprightEnd,uprightActive,uprightReset};
      }finally{Math.random=random}
    },id);all.push(result);
  }
  fs.writeFileSync(out+'/audit.json',JSON.stringify({method:'deterministic actual skillUse, 331 update/render frames each; mechanics and ground cleanup',all,errors},null,2));console.log(JSON.stringify({skills:all.length,errors,cleanup:all.map(a=>[a.id,a.groundEnd,a.groundActive,a.groundReset,a.uprightEnd,a.uprightActive,a.uprightReset])}));
  await browser.close()})().catch(e=>{console.error('FATAL',e);process.exit(1)});
