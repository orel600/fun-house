// צילום השוואה של חמשת גיבורי משחקי השאול כמו שהם במשחק היום (ARI, 9.11.2026): חמישה מודלים זה לצד זה על רצפה ריקה.
// שימוש: node tools/hero-lineup.js . <תיקיית פלט> [--gpu]   (תלת-ממד, דורש playwright, כמו tools/check.js)
// יוצא: lineup-game.png (זום המשחק) ו-lineup-close.png (קרוב פי 2, בלי ממשק), ושלוש מצלמות לכל גיבור: lineup-<גיבור>.png (חתך קרוב).
// זה "המודלים בפועל במשחק", לא תמונת קונספט: אין כאן טענה שהם דומים לאיורי הקונספט.
const {chromium}=require('playwright'),path=require('path'),fs=require('fs'),GPU=require('./gpu.js');
const repo=process.argv[2],out=process.argv[3];
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch(GPU.launchOpts(!GPU.gpuOn()?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:[])),page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(()=>{let a=7;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}});
  await page.clock.install({time:0});await page.clock.pauseAt(1000);
  await page.addInitScript(()=>{try{localStorage.setItem('zm-gfx','3d')}catch(e){}});
  await page.goto('file://'+path.resolve(repo,'index.html'));
  await page.clock.runFor(300);
  await page.evaluate(()=>{mobaStart('tank');MB.waveT=1e9});
  await page.clock.runFor(1500);
  const KITS=['tank','warrior','hunter','mage','assassin'];
  await page.evaluate(kits=>{
    mbBot=function(){};banner=function(){};document.getElementById('banner').hidden=true;MB.over=false;MB.zones.length=0;MB.shots.length=0;MB.walls.length=0;MB.fx.length=0;MB.floats.length=0;fxClear();S.shake=0;
    MB.u=MB.u.filter(u=>u.k==='tower'||u.k==='base');   // בלי חיילים ובלי גיבורים אחרים
    kits.forEach((k,i)=>{const h=mbHero(k,0,i===0,i);h.lvl=1;h.x=(i-2)*70;h.y=0;h.face=h.aim=Math.PI/2;MB.u.unshift(h);if(i===0)MB.me=h});
    P.x=0;P.y=0;S.cam.x=0;S.cam.y=0;typeof mbVisNow==='function'&&mbVisNow(true)},KITS);
  for(let i=0;i<30;i++)await page.clock.runFor(34);
  const shot=async(name)=>{await page.evaluate(()=>{MB.floats.length=0});await page.clock.runFor(34);await page.screenshot({path:path.join(out,name+'.png')})};
  const renderer=await GPU.report(page,'hero-lineup');
  await shot('lineup-game');
  await page.evaluate(()=>{window.__z=MBLOOK.cam.zoom;MBLOOK.cam.zoom=MBLOOK.cam.zoom*2.1;window.dispatchEvent(new Event('resize'));for(const e of document.body.children)if(e.tagName!=='CANVAS'&&!e.querySelector('canvas'))e.style.visibility='hidden'});   // 2.1 ולא 2: כך שחמשת הגיבורים ממלאים את המסך. בלי ממשק, כדי לראות רק את המודלים
  for(let i=0;i<20;i++)await page.clock.runFor(34);
  await shot('lineup-close');
  console.log(JSON.stringify({renderer,gfx:await page.evaluate(()=>R3D.on),zoomGame:await page.evaluate(()=>window.__z),errors},null,1));
  await browser.close();
})();
