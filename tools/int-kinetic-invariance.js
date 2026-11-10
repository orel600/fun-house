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
  for(const kind of ['aimed','ring','spiral','charge','shields','wisps','shock','mines']){
    const result=await page.evaluate(kind=>{
      let seed=714;const random=Math.random;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
      try{startRun();S.mode='play';P.x=P.y=0;P.inv=999;P.sw.t=P.gn.t=999;S.cam.x=S.cam.y=0;enemies=[];eb=[];mines=[];waves=[];FXLIB.list=[];floats=[];ARDGS.b.clear();S.run.tip=false;
        const b=makeBoss();b.x=180;b.y=0;b.hp=b.max=1e8;b.dmg=0;b.speed=0;b.patT=999;b.rage=0;enemies=[b];S.boss=b;const at=S.t;doPattern(b,kind);const samples=[];
        for(let i=0;i<=150;i++){
          if(i%5===0)samples.push({dt:+(S.t-at).toFixed(3),warning:b.arTele?{t:+b.arTele.t.toFixed(3),max:b.arTele.max}:null,eb:eb.map(p=>[+p.x.toFixed(2),+p.y.toFixed(2),p.r]),mines:mines.map(m=>[m.x,m.y,+m.t.toFixed(3)]),waves:waves.map(w=>[w.r,+w.t.toFixed(3),w.max]),charge:b.charge?{stage:b.charge.stage,t:+b.charge.t.toFixed(3)}:null,foes:enemies.length,heroR:P.r});
          update(.016);
        }
        render();return{kind,samples};
      }finally{Math.random=random}
    },kind);
    all.push(result);await page.screenshot({path:out+'/'+kind+'.png'});
  }
  fs.writeFileSync(out+'/audit.json',JSON.stringify({method:'actual update(.016), rendering only final stage; deterministic fixture',all,errors},null,2));console.log(JSON.stringify({patterns:all.length,errors}));
  await browser.close()})().catch(e=>{console.error('FATAL',e);process.exit(1)});
