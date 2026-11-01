/* מעבדת קרב: צילום קרוב של האורות המרחפים (wisps.js) בקרב, 10 תמונות בשנייה, בשביל GIF.
   עם --truth: עיגול אדום דק איפה שהחפץ באמת פוגע (S.orb.pos, orbit.js), כדי לראות כמה רחוק האור המצויר ממנו.
   הרצה: node tools/combat-lab/lights.js [--truth]   פלט: tools/combat-lab/out3d/lights[-truth]/ */
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const TRUTH=process.argv.includes('--truth');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const page=await b.newPage({viewport:{width:1280,height:590},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(()=>{let a=5;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}});
  await page.clock.install({time:new Date('2026-11-01T10:00:00').getTime()});
  await page.addInitScript(()=>{localStorage.setItem('zm-gfx','3d');localStorage.setItem('zm-lang','en')});
  await page.goto('file://'+path.resolve(__dirname,'..','..','index.html'));await page.clock.runFor(400);
  await page.evaluate(()=>{SAVE.hero.start='warrior';SAVE.hero.level=10;SAVE.gift=true;SAVE.gear.orbit=['emberOrb','frostOrb','stoneOrb','leafOrb',null];SAVE.story=SAVE.story||{};SAVE.story.intro=true;saveNow()});
  await page.evaluate(()=>document.getElementById('startBtn').click());await page.clock.runFor(1500);
  await page.evaluate(()=>{if(typeof welcomeClose==='function')try{welcomeClose()}catch(e){};for(const s of ['#dailyWin [data-act="close"]','#qLog [data-act="close"]']){const x=document.querySelector(s);if(x&&x.offsetParent)x.click()}});
  await page.evaluate(()=>{villageUi(false);enterWorld('home')});await page.clock.runFor(900);
  await page.evaluate(t=>{P.x=300;P.y=-100;S.cam.x=P.x;S.cam.y=P.y;joy=null;P.hp=P.maxHp*0.7;
    for(const e of enemies)if(Math.hypot(e.x-P.x,e.y-P.y)<700)e.dead=true;
    for(let i=0;i<4;i++){const e=addEnemy('golem',P.x+Math.cos(i*1.6)*120,P.y+Math.sin(i*1.6)*90,1.4);e.xp=0;e.home=0}
    if(t){const old=drawOrbits;drawOrbits=function(){old();const o=S.orb;if(!o)return;ctx.save();ctx.strokeStyle='#ff2a2a';ctx.lineWidth=2;
      for(const g of o.pos)if(g){ctx.beginPath();ctx.arc(g.x,g.y,ORBIT.size,0,7);ctx.stroke()}ctx.restore()}}},TRUTH);
  const dir=path.join(__dirname,'out3d','lights'+(TRUTH?'-truth':''));fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
  for(let i=0;i<40;i++){await page.evaluate(()=>{joy={id:-1,ox:-999,oy:-999,dx:Math.cos(S.wd.t*0.8),dy:Math.sin(S.wd.t*0.8)*0.4}});
    await page.clock.runFor(100);
    const box=await page.evaluate(()=>{const s=typeof w2s==='function'?w2s(P.x,P.y):null;return s});
    await page.screenshot({path:path.join(dir,String(i).padStart(3,'0')+'.png'),clip:{x:640-230,y:295-150,width:460,height:280}})}
  await b.close();
})();
