// מדידה: כמה בטוח האיסוף בכל אזור ואיזור, עם PACE.gather.hold שונים
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const ROOT=require('path').resolve(__dirname,'..');   // הרצה: node docs/measure-gather-hold.js (HOLDS=4,20,0 T=150 CLS=... REGS=... OUT=...). מקומי, רשת חסומה, שמירה זמנית
const HOLDS=(process.env.HOLDS||'4,20,0').split(',').map(Number);
const T=+(process.env.T||150), CLS=(process.env.CLS||'warrior,hunter,mage').split(','), SEED=+(process.env.SEED||7);
const REGS=(process.env.REGS||'meadow,lake,ridge,desert,storm,shadow').split(',');
function trial(o){
  const {reg,zone,hold,T,lv}=o;PACE.gather.hold=hold;
  if(!window.__inst){window.__inst=1;frame=function(){};
    const hu=hurt;hurt=function(d){const h0=P.hp,r=hu.apply(this,arguments);if(window.__M)window.__M.hin+=Math.max(0,h0-P.hp)/P.maxHp;return r}}
  if(SAVE.hero.level<lv){SAVE.hero.xp=rankXpAt(lv);rankSync()}
  const plan={warrior:['str','vit','str','def'],hunter:['agi','str','agi','vit'],mage:['haste','str','haste','vit']}[heroId()];
  let g=0;while(stFree()>0&&g++<200){if(!statAdd(plan[stSpent()%plan.length]))break}
  const M=window.__M={hin:0,deaths:0,packs:0,met:0,res:0,t:0,gt:0,hits:0};
  const bagN=()=>{let n=0;for(const k in SAVE.bag)if(k!=='coins')n+=SAVE.bag[k]||0;return n};
  const enter=()=>{if(S.wd)worldUi(false);enterWorld('home',reg);for(const id of ['npcDlg','qLog','ovGear','ovDaily','ovWelcome','ovBook'])if($(id))$(id).hidden=true};
  enter();
  const inZ=n=>wZone(n).id===zone;
  const spot=()=>{const L=S.nd.list.filter(n=>!n.dead&&inZ(n));if(!L.length)return false;const n=L[Math.floor(Math.random()*L.length)];P.x=n.x+n.r+20;P.y=n.y;return true};
  if(!spot())return{none:1};
  let packs0=S.wd.pace?S.wd.pace.packs:0,seen=new Set(),b0=bagN(),wasOver=0,inv=0;
  for(let i=0;M.t<T&&i<T*20*4;i++){
    last=performance.now()-50;frameStep(performance.now());
    if(!S.wd||S.vil){enter();if(!spot())break;packs0=S.wd.pace?S.wd.pace.packs:0;continue}
    if(S.mode==='over'||!$('ovWDeath').hidden){if(!wasOver){wasOver=1;M.deaths++;M.packs+=(S.wd.pace?S.wd.pace.packs:0)-packs0}
      if(!$('ovWDeath').hidden){$('wRespawn').click();wasOver=0;if(S.wd&&!S.vil){if(!spot())break;packs0=S.wd.pace?S.wd.pace.packs:0}}continue}
    if(S.mode!=='play')continue;
    M.t+=0.05;if(S.wd.gath!=null&&S.wd.t-S.wd.gath<1)M.gt+=0.05;
    for(const e of enemies)if(e.pack&&!e.dead&&!seen.has(e.pack.id)&&Math.hypot(e.x-P.x,e.y-P.y)<350){seen.add(e.pack.id);M.met++}
    if(i%5)continue;
    const F=enemies.filter(e=>!e.dead&&!e.node&&Math.hypot(e.x-P.x,e.y-P.y)<300);
    let tx,ty,stop;
    if(F.length){const e=F.reduce((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)<Math.hypot(b.x-P.x,b.y-P.y)?a:b);tx=e.x;ty=e.y;stop=(P.weapon==='sword'?28:150)+(e.r||0);
      if(P.hp<P.maxHp*0.3){joy={id:-1,ox:-999,oy:-999,dx:(P.x-e.x)/(Math.hypot(P.x-e.x,P.y-e.y)||1),dy:(P.y-e.y)/(Math.hypot(P.x-e.x,P.y-e.y)||1)};continue}
      if(S.sk)for(const id of S.sk.ids.slice())if(wskReady(id)>=0)wskUse(id)}
    else{const L=S.nd.list.filter(n=>!n.dead&&inZ(n));if(!L.length){joy=null;continue}
      const n=L.reduce((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)<Math.hypot(b.x-P.x,b.y-P.y)?a:b);tx=n.x;ty=n.y;stop=n.r+(P.weapon==='sword'?20:60)}
    if(typeof TR!=='undefined'&&TR&&Math.hypot(tx-P.x,ty-P.y)>stop){const t=tDir(P,tx,ty);if(t.x!==tx||t.y!==ty){tx=t.x;ty=t.y;stop=0}}
    const d=Math.hypot(tx-P.x,ty-P.y)||1;joy=d>stop?{id:-1,ox:-999,oy:-999,dx:(tx-P.x)/d,dy:(ty-P.y)/d}:null;
  }
  if(S.wd)M.packs+=(S.wd.pace?S.wd.pace.packs:0)-packs0;M.res=bagN()-b0;
  if(S.wd)worldUi(false);
  return M;
}
(async()=>{
  const browser=await chromium.launch();const out={};
  await Promise.all(CLS.map(async cls=>{
    const page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    page.on('pageerror',e=>console.log(cls,'ERR',e.message));
    await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
    await page.addInitScript(seed=>{let a=seed>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}},SEED);
    await page.addInitScript(()=>{try{localStorage.setItem('zm-gfx','2d')}catch(e){}});
    await page.goto('file://'+path.join(ROOT,'index.html'));await page.waitForTimeout(500);
    await page.evaluate(c=>{$('ovStart').hidden=true;heroPick(c);for(const k of ['earth','water','ice','fire','bolt'])STO()[k]=true},cls);await page.waitForTimeout(300);
    const LV={meadow:4,lake:9,ridge:15,desert:21,storm:27,shadow:33};
    for(const reg of REGS)for(const zone of ['start','near','far'])for(const hold of HOLDS){
      const r=await page.evaluate(`(${trial})(${JSON.stringify({reg,zone,hold,T,lv:LV[reg]})})`);
      (out[reg]=out[reg]||{});(out[reg][zone]=out[reg][zone]||{});(out[reg][zone][hold]=out[reg][zone][hold]||[]).push(r);
      console.log(cls,reg,zone,hold,JSON.stringify(r));
    }
    await page.close()}));
  await browser.close();fs.writeFileSync(process.env.OUT||'ghold.json',JSON.stringify(out));
})();
