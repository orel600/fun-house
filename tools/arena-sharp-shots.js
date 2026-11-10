// צילומי הרצף של שפת האפקטים החדה בזירה (ARSH, js/arena-sharp.js): לכל סקיל כמה פריימים בזמנים קבועים אחרי ההטלה, בפרופיל טלפון שוכב.
// שימוש: node tools/arena-sharp-shots.js . <תיקיית פלט> [--gfx 3d|2d] [--dsf 3] [--only comet,quake] [--sharp 0]   (דורש playwright). הזמן מצועד ב-60Hz, לא בזמן אמת
const {chromium}=require('playwright'),path=require('path'),fs=require('fs'),GPU=require('./gpu.js');
const arg=(n,d)=>{const i=process.argv.indexOf('--'+n);return i>0?process.argv[i+1]:d};
const repo=process.argv[2],out=process.argv[3],GFX=arg('gfx','3d'),DSF=+arg('dsf','2'),only=arg('only','').split(',').filter(Boolean),SHARP=arg('sharp','1')!=='0';
const TIMES=[0.04,0.12,0.22,0.35,0.5,0.7,0.95,1.3];
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch(GPU.launchOpts(GFX==='3d'&&!GPU.gpuOn()?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:[])),page=await browser.newPage({viewport:{width:924,height:424},deviceScaleFactor:DSF,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(()=>{let a=7;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}});
  await page.clock.install({time:0});await page.clock.pauseAt(1000);
  await page.addInitScript(g=>{try{localStorage.setItem('zm-gfx',g)}catch(e){}},GFX);
  await page.goto('file://'+path.resolve(repo,'index.html')+(SHARP?'':'?arsharp=0'));
  await page.clock.runFor(400);
  await page.evaluate(()=>{startRun();S.mode='play';enemies.length=0;fxPreload(skAnimIds())});
  for(let i=0;i<100;i++){const ok=await page.evaluate(()=>skAnimIds().every(id=>fxImg(id)||FXLIB.bad[id]));if(ok)break;await page.waitForTimeout(50);await page.clock.runFor(50)}
  const mode=await page.evaluate(()=>({r3d:typeof R3D!=='undefined'&&!!R3D.on,sharp:typeof ARSH!=='undefined'&&!!ARSH.on}));
  const setup=ids=>{ARSH.list.length=0;S.mode='play';enemies.length=0;ids=[...new Set([SKILLS.weapon[P.wt]].concat(ids))];S.sk.ids=ids;S.sk.cd=ids.map(()=>0);S.sk.fx=[];S.sk.last={};S.skm={fx:[],pend:[],pools:[],cast:0,hits:0};fxClear();S.shake=0;P.hp=P.maxHp*0.5;
    for(let i=0;i<7;i++){const a=i/7*6.283,d=70+(i%3)*25;const e=addEnemy('grunt',P.x+Math.cos(a)*d,P.y+Math.sin(a)*d*0.8);e.hp=e.max=1e9;e.speed=0;e.mult={};e.kx=e.ky=0}
    const b=addEnemy('grunt',P.x+150,P.y-40);b.hp=b.max=1e9;b.speed=0;b.mult={};b.elite=true;b.r*=1.6;skillsHud()};
  const cast={quake:()=>skillUse('quake'),splash:()=>skillUse('splash'),frost:()=>skillUse('frost'),flame:()=>skillUse('flame'),zap:()=>skillUse('zap'),lance:()=>skillUse('lance'),comet:()=>skillUse('comet'),bloom:()=>skillUse('bloom'),
    dash:()=>{SAVE.x=1;spellState().id='dash';spellState().until=0;P.vx=1;P.vy=0;return spellUse()},heal:()=>{spellState().id='heal';spellState().until=0;return spellUse()},smite:()=>{spellState().id='smite';spellState().until=0;return spellUse()},
    ult:()=>{S.ult={c:ULT.need,used:0};return ultUse()}};
  const stats={mode,errors:[]};
  for(const id of Object.keys(cast)){
    if(only.length&&!only.includes(id))continue;
    await page.evaluate(setup,['dash','heal','smite','ult'].includes(id)?[]:[id]);await page.clock.runFor(34);
    for(const e of [0])await page.evaluate(()=>{for(const e of enemies)e.kx=e.ky=0});
    const ok=await page.evaluate(c=>window.__cast=eval('('+c+')')(),cast[id].toString());
    let t0=0;const peaks=[];
    for(const t of TIMES){const ms=Math.round((t-t0)*1000);for(let s=0;s<ms;s+=16)await page.clock.runFor(16);t0=t;
      peaks.push(await page.evaluate(()=>typeof ARSH!=='undefined'?ARSH.list.length:-1));
      await page.screenshot({path:path.join(out,id+'-'+String(Math.round(t*100)).padStart(3,'0')+'.png'),clip:{x:150,y:40,width:640,height:340}})}
    stats[id]={ok,live:peaks};
  }
  stats.arsh=await page.evaluate(()=>typeof ARSH!=='undefined'?ARSH.stat:null);stats.errors=errors;
  console.log(JSON.stringify(stats,null,1));
  await browser.close();
})();
