// צילומי הטלה של כל סקיל בזירה ברגע ההטלה (W1, אוראל 8.11.2026). הבוט של check.js לא תמיד תופס את הרגע, אז כאן מטילים ומצלמים בכוונה.
// שימוש: node tools/skill-shots.js . <תיקיית פלט> [--less]   (דורש playwright, כמו tools/check.js)
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
const repo=process.argv[2],out=process.argv[3],less=process.argv.includes('--less');
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(()=>{let a=7;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}});
  await page.clock.install({time:0});await page.clock.pauseAt(1000);
  await page.addInitScript(()=>{try{localStorage.setItem('zm-gfx','2d')}catch(e){}});
  await page.goto('file://'+path.resolve(repo,'index.html'));
  await page.clock.runFor(300);
  await page.evaluate(l=>{startRun();SAVE.fxLess=l;S.mode='play';enemies.length=0;fxPreload(skAnimIds());},less);
  // מחכים שהתמונות ייטענו
  for(let i=0;i<100;i++){const ok=await page.evaluate(()=>skAnimIds().every(id=>fxImg(id)||FXLIB.bad[id]));if(ok)break;await page.waitForTimeout(50);await page.clock.runFor(50)}
  const bad=await page.evaluate(()=>Object.keys(FXLIB.bad));
  const setup=(ids)=>{S.mode='play';enemies.length=0;ids=[...new Set([SKILLS.weapon[P.wt]].concat(ids))];S.sk.ids=ids;S.sk.cd=ids.map(()=>0);S.sk.fx=[];S.sk.last={};S.skm={fx:[],pend:[],pools:[],cast:0,hits:0};fxClear();S.shake=0;
    const ens=[];for(let i=0;i<7;i++){const a=i/7*6.283,d=70+(i%3)*25;const e=addEnemy('grunt',P.x+Math.cos(a)*d,P.y+Math.sin(a)*d*0.8);e.hp=e.max=1e9;e.speed=0;e.mult={};e.kx=e.ky=0;ens.push(e)}
    const b=addEnemy('grunt',P.x+150,P.y-40);b.hp=b.max=1e9;b.speed=0;b.mult={};b.elite=true;b.r*=1.6;ens.push(b);window.__ens=ens;skillsHud()};
  const shots=[['quake',0.25],['splash',0.3],['frost',0.3],['flame',0.3],['zap',0.2],['comet',1.0],['lance',0.2],['bloom',0.6]];
  const stats={};
  for(const [id,t] of shots){
    await page.evaluate(setup,[id]);await page.clock.runFor(34);
    const ok=await page.evaluate(id=>{for(const e of window.__ens)e.kx=e.ky=0;return skillUse(id)},id);
    await page.clock.runFor(Math.round(t*1000));
    stats[id]={ok,n:await page.evaluate(()=>FXLIB.list.length),ids:await page.evaluate(()=>[...new Set(FXLIB.list.map(f=>f.id))])};
    await page.screenshot({path:path.join(out,id+(less?'-less':'')+'.png')});
  }
  // קומבו: רטוב ואז ברק = חשמול, רטוב ואז קרח = קפוא
  await page.evaluate(setup,['zap','frost']);
  await page.evaluate(()=>{for(const e of window.__ens)e.wet=3;skillUse('zap');skillUse('frost')});
  await page.clock.runFor(200);stats.combo={n:await page.evaluate(()=>FXLIB.list.length),ids:await page.evaluate(()=>[...new Set(FXLIB.list.map(f=>f.id))])};
  await page.screenshot({path:path.join(out,'combo'+(less?'-less':'')+'.png')});
  const st=await page.evaluate(()=>JSON.stringify(SKANIMS.stat));
  console.log(JSON.stringify({bad,stats,st,errors},null,1));
  await browser.close();
})();
