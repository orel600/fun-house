// מדידה: באיזו רמת גיבור שחקן רגיל מגיע למנסרה 3, מכרה 4 ושוק 4, ומסיים את שלושת הצוותים (vproj.js). ממצא 7 בביקורת Sonnet, 11.11.2026
// הרצה: NODE_PATH=/opt/node-tools/node_modules node docs/measure-crew-gate.js   (CLS=warrior,hunter,mage CH=4 SEED=7 FILL=0 OUT=crew.json)
// הבוט של tools/balance-world.js (install): עובר את פרקי הסיפור, מטפס לרמה המומלצת ומפיל את השומר, חוזר לכפר כל 600 שניות.
// תוספות כאן: (1) איסוף: בכל מחזור של 300 שניות, 120 מהן הוא הולך למקורות (עצים, סלעים) כמו שחקן שאוסף. (2) בכל כניסה לכפר:
//   שעון הכפר מוזז ביד (SAVE.prod[k].t אחורה) בזמן השחקן שעבר: זמן משחק ×1.5 (playtime.js: walk) + 90 שניות לכל ביקור.
//   FILL=1: במקום זה, כל ביקור ממלא את המחסנים עד התקרה (שחקן שמשחק בהפסקות, והכפר מייצר כשהוא לא משחק).
//   אחר כך: אוסף, בונה צוות כשאפשר, ומשדרג מבנים לפי הסדר center, mill, mine, market, forge, stash, inn (חמדני, כמו שחקן רגיל).
// מקומי, רשת חסומה, שמירה זמנית. דו-ממד (מדידה פנימית)
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const {BAL,install}=require('../tools/balance-world.js');
const CLS=(process.env.CLS||'warrior,hunter,mage').split(','),CH=+(process.env.CH||4),SEED=+(process.env.SEED||7),FILL=+(process.env.FILL||0);
function addon(o){
  const m=window.__bal,R=m.rep;const dd=dmDraw;dmDraw=function(){try{return dd.apply(this,arguments)}catch(e){R.drawErr=(R.drawErr||0)+1;ctx.restore&&ctx.restore()}};   // drama.js: arc עם רדיוס שלילי עצר ריצה (11.11), נספר ולא עוצר
  R.ms={};R.vis=0;let lastG=m.gt;
  const ORDER=['center','mill','mine','market','forge','stash','inn'],CREWS=['roadCrew','tunnelCrew','caravan'];
  const hrs=()=>(m.gt*1.5+R.vis*90+R.deaths*45)/3600;
  const mark=(k,extra)=>{if(R.ms[k])return;R.ms[k]=Object.assign({lv:heroLv(),gt:Math.round(m.gt),h:+hrs().toFixed(2),ch:m.ch},extra||{})};
  const ev=enterVillage;enterVillage=function(){const r=ev.apply(this,arguments);try{vil()}catch(e){R.err=(R.err||'')+e.message}return r};
  function vil(){R.vis++;const dt=(m.gt-lastG)*1.5+90;lastG=m.gt;
    for(const k in VILLAGE.b){const B=VILLAGE.b[k];if(!B.make||vLv(k)<1)continue;const p=vProd(k);
      if(o.fill){vSettle(k);for(const r in B.make)if(B.make[r][vLv(k)])p.have[r]=vCapOf(B,r,vLv(k))}
      else{if(!p.t)p.t=Date.now();p.t-=dt*1000;vSettle(k)}
      vCollect(k)}
    for(let g=0;g<30;g++){let any=0;
      for(const id of CREWS){if(vpHere(id)&&!vpDone(id))mark(id+':ready');if(vpBuild(id)){any=1;if(vpDone(id))mark(id+':done',{road:VPROJ.places[VPROJ.list[id].opens].path,story:storyOpen({roadCrew:'earth',tunnelCrew:'water',caravan:'ice'}[id])})}}
      for(const k of ORDER)if(!vBlock(k)&&vUpgrade(k)){any=1;mark(k+vLv(k))}
      if(!any)break}
    for(const k of ['earth','water','ice'])if(storyOpen(k))mark('story:'+k);
    R.vlv=ORDER.map(k=>k+vLv(k)).join(' ');
    R.miss=CREWS.filter(id=>!vpDone(id)).map(id=>{const c=vpCost(id);return id+'('+vpBlock(id)+':'+Object.keys(c).filter(r=>!bagHas(r,c[r])).map(r=>r+' '+(SAVE.bag[r]||0)+'/'+c[r]).join(',')+')'}).join(' ')}
  // איסוף: 120 מכל 300 שניות משחק, רק בזמן טיפוס בעולם
  window.__gRun=n=>{let r={};for(let i=0;i<n&&!r.done;i++){
    const cyc=m.gt%300,gather=cyc>180&&m.ph==='grind'&&S.wd&&!S.vil&&S.mode==='play'&&$('ovWDeath').hidden;
    if(!gather){r=window.__balRun(5);i+=4;continue}
    last=performance.now()-50;frameStep(performance.now());m.gt+=0.05;
    if(i%5)continue;
    const F=enemies.filter(e=>!e.dead&&!e.node&&Math.hypot(e.x-P.x,e.y-P.y)<300);let tx,ty,stop;
    if(F.length){const e=F[0];tx=e.x;ty=e.y;stop=(P.weapon==='sword'?28:150)+(e.r||0);if(S.sk)for(const id of S.sk.ids.slice())if(wskReady(id)>=0)wskUse(id)}
    else{const L=(S.nd&&S.nd.list||[]).filter(n=>!n.dead);if(!L.length){joy=null;continue}
      const nd=L.reduce((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)<Math.hypot(b.x-P.x,b.y-P.y)?a:b);tx=nd.x;ty=nd.y;stop=nd.r+(P.weapon==='sword'?20:60)}
    if(typeof TR!=='undefined'&&TR&&typeof tDir==='function'&&Math.hypot(tx-P.x,ty-P.y)>stop){const t=tDir(P,tx,ty);if(t.x!==tx||t.y!==ty){tx=t.x;ty=t.y;stop=0}}
    const d=Math.hypot(tx-P.x,ty-P.y)||1;joy=d>stop?{id:-1,ox:-999,oy:-999,dx:(tx-P.x)/d,dy:(ty-P.y)/d}:null}
    if(m.ch>=CHN)r={done:true};return r};
  const CHN=o.ch;
}
(async()=>{
  const browser=await chromium.launch();const out={};
  await Promise.all(CLS.map(async cls=>{
    const page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    page.on('pageerror',e=>console.log(cls,'ERR',e.message));
    await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
    await page.addInitScript(seed=>{let a=seed>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}},SEED);
    await page.addInitScript(()=>{try{localStorage.setItem('zm-gfx','2d')}catch(e){}});
    await page.goto('file://'+path.resolve(__dirname,'..','index.html'));await page.waitForTimeout(500);
    await page.evaluate(c=>{$('ovStart').hidden=true;heroPick(c)},cls);await page.waitForTimeout(300);
    await page.evaluate(install,Object.assign({},BAL,{cap:4000,trip:600,only:CH}));
    await page.evaluate(`(${addon})(${JSON.stringify({fill:FILL,ch:CH})})`);
    const t0=Date.now();let r={},n=0;
    while(!r.done){r=await page.evaluate(()=>__gRun(200));
      if(++n%40===0){const s=await page.evaluate(()=>({ch:__bal.ch,lv:heroLv(),gt:Math.round(__bal.gt),v:__bal.rep.vlv,ms:Object.keys(__bal.rep.ms).join(',')}));console.log(cls,'ch',s.ch+1,'lv',s.lv,s.gt+'s',s.v,'|',s.ms,Math.round((Date.now()-t0)/1000)+'s real')}}
    const R=await page.evaluate(()=>__bal.rep);
    out[cls]={ms:R.ms,vlv:R.vlv,miss:R.miss,vis:R.vis,deaths:R.deaths,err:R.err,drawErr:R.drawErr,ch:R.ch.map(c=>({reg:c.reg,lv0:c.lv0,lv1:c.lv1,t:c.t,ok:c.ok,deaths:c.deaths,z:c.z}))};
    console.log(cls,'DONE',JSON.stringify(out[cls].ms));
    await page.close()}));
  await browser.close();fs.writeFileSync(process.env.OUT||'crew.json',JSON.stringify(out,null,1));
})();
