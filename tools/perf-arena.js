/* מדידת ביצועים בקרב (W6, 8.11.2026): סצנת קרב קבועה בזירה, seed קבוע, 60 שניות, בדו-ממד.
   מה נמדד: זמן frameStep לכל פריים (החישובים + הציור בקנבס + הממשק), ואיתו FPS לפי הפערים בין פריימים.
   מדווח: FPS חציוני (לפי חלונות של שנייה), זמן פריים חציוני ו-p95, כמה אויבים בממוצע, ושיאים של מספרי נזק ואפקטים.
   הרצה: node tools/perf-arena.js [--seed 7] [--secs 60] [--cpu 4] [--warm 5] [--json out.json] [--gfx 2d|3d] [--hidden] [--scene arena|world|moba] [--gpu]
   --scene world: קרב בעולם הפתוח (אחו), עם גושי אויבים שמופיעים סביב השחקן, כדי למדוד את juice.js (מספרי נזק, ניצוצות) שפועל רק בעולם ובכפר.
   --enemies N: זירה צפופה קבועה (QUINN, 9.11): N אויבים חיים כל הזמן סביב השחקן (מתמלא כל 50ms, אויבים בלתי ניתנים להריגה שרודפים אחריו, סוגים מעורבים), כדי שלפני ואחרי ידמו אותה צפיפות. מיקומי ההופעה מ-RNG משלו מה-seed (לא נוגע ברצף של המשחק), ולכן שתי הרצות זהות באוכלוסייה.
   --game <תיקייה>: מודד משחק של checkout אחר (לפני/אחרי מאותו כלי: node tools/perf-arena.js --game ../fh-main ... ואז --game ../fh-pr). commit בפלט הוא של ה-checkout הנמדד.
   --boss: בוס אחד חי כל הזמן (זורק את המתקפות שלו כרגיל). --skills: כל הסקילים מוטלים בטיימר (עומס אפקטים). שלושתם רק בסצנת arena.
   --cpu: האטת מעבד (CDP), כדי לדמות טלפון. 1 = בלי האטה.
   --hidden: בדיקת העצירה ברקע: באמצע הקרב מדמים document.hidden, בודקים שהלולאה עצרה (S.t לא זז) ושחזרה נקי.
   במחשב בלי כרטיס גרפי מודדים רק בדו-ממד (תלת-ממד שם רץ על המעבד ולא אומר כלום על הטלפון).
   להשוואה לפני/אחרי: אותו seed, אותו --cpu, ולכתוב איזה commit נמדד (git rev-parse --short HEAD). */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const GPU=require('./gpu.js');   // --gpu: כרטיס מסך אמיתי (tools/gpu.js)
const args=process.argv.slice(2);
const opt=k=>{const i=args.indexOf('--'+k);if(i<0)return null;const v=args[i+1];return v&&!v.startsWith('--')?v:true};
const CFG={seed:+(opt('seed')||7),secs:+(opt('secs')||60),warm:+(opt('warm')||5),cpu:+(opt('cpu')||4),gfx:opt('gfx')||'2d',hidden:!!opt('hidden'),game:opt('game')&&opt('game')!==true?opt('game'):null,enemies:+(opt('enemies')||0),boss:!!opt('boss'),skills:!!opt('skills'),json:opt('json'),scene:opt('scene')||'arena',
  phone:{width:844,height:390},dsf:2};

(async()=>{
  // בלי הגבלת קצב פריימים ובלי GPU: הפריימים רצים כמה שהמעבד נותן, והקנבס מצויר במעבד (עם SwiftShader הקנבס היה איטי פי 20 ולא מדד כלום)
  const browser=await chromium.launch(GPU.gpuOn()?{args:[...GPU.GPU_ARGS,'--disable-frame-rate-limit','--disable-gpu-vsync']}:{args:['--disable-frame-rate-limit','--disable-gpu-vsync','--disable-gpu']});   // --gpu: בלי --disable-gpu, ובכרטיס הממשי
  const page=await browser.newPage({viewport:CFG.phone,deviceScaleFactor:CFG.dsf,isMobile:true,hasTouch:true});
  const errors=[],logs=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());else if(/\[loop\]/.test(m.text()))logs.push(m.text())});
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  // אותו seed = אותו קרב (כמו tools/check.js)
  await page.addInitScript(o=>{let a=o.seed>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
    try{localStorage.setItem('zm-gfx',o.gfx);localStorage.setItem('zm-mute','1')}catch(e){}},{seed:CFG.seed,gfx:CFG.gfx});
  const cdp=await page.context().newCDPSession(page);
  if(CFG.cpu>1)await cdp.send('Emulation.setCPUThrottlingRate',{rate:CFG.cpu});
  await page.goto('file://'+path.resolve(CFG.game||path.join(__dirname,'..'),'index.html'));
  await page.waitForFunction(()=>typeof startRun==='function'&&typeof S!=='undefined'&&S&&typeof R3D!=='undefined'&&(R3D.ready||R3D.failed||!R3D.want),null,{timeout:120000,polling:200});
  const commit=(()=>{try{return require('child_process').execSync('git rev-parse --short HEAD',{cwd:path.resolve(CFG.game||path.join(__dirname,'..'))}).toString().trim()}catch(e){return '?'}})();
  // לתוך הזירה, ומדידה של כל פריים
  await page.evaluate(o=>{const scene=o.scene;
    const M=window.__pa={on:false,f:[],gaps:[],peak:{floats:0,nums:0,layers:0,fx:0,enemies:0},en:0,n:0};
    const fs0=frameStep;window.frameStep=function(now){const a=performance.now();try{return fs0.apply(this,arguments)}finally{if(M.on){M.f.push(performance.now()-a);M.n++;M.en+=enemies.length;
      M.peak.floats=Math.max(M.peak.floats,floats.length);M.peak.enemies=Math.max(M.peak.enemies,enemies.length);
      M.peak.nums=Math.max(M.peak.nums,S.jc?S.jc.n.length:0);M.peak.layers=Math.max(M.peak.layers,S.jc&&typeof jLayers==='function'?jLayers(S.jc):0);M.peak.fx=Math.max(M.peak.fx,typeof FXLIB!=='undefined'?FXLIB.list.length:0)}}};
    let lastRaf=0;const loop=t=>{if(M.on&&lastRaf)M.gaps.push(t-lastRaf);lastRaf=t;if(M.on&&typeof R3D!=='undefined'&&R3D.on&&R3D.r){const i=R3D.r.info;M.calls=Math.max(M.calls||0,i.render.calls);M.tris=Math.max(M.tris||0,i.render.triangles);M.geo=i.memory.geometries;M.tex=i.memory.textures}requestAnimationFrame(loop)};requestAnimationFrame(loop);   // תלת-ממד: קריאות ציור ומשולשים לפריים (שיא), וזיכרון. גם בלי כרטיס מסך אלה מספרים אמיתיים
    if(scene==='world'){SAVE.story=SAVE.story||{};SAVE.story.earth=true;enterWorld('home','meadow')}
    else if(scene==='moba'){mobaStart('hunter');MB.me.bot={t:0,mode:'push'}}   // משחקי השאול: כל הששה בוטים, משחק אחרי משחק (QUINN, 9.11)
    else startRun();
    // השחקן לא מת, הולך במעגל, ומאשר כל חלון (רמה, בוס) מיד, כדי שהקרב לא ייעצר
    let _r=(o.seed>>>0)^0x9E3779B9;const rnd=()=>{_r=_r+0x6D2B79F5|0;let t=Math.imul(_r^_r>>>15,1|_r);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};   // RNG משלנו: לא מזיז את Math.random של המשחק
    const AT=['grunt','grunt','grunt','shield','wisp','crawler'].filter(k=>ETYPES[k]);window.__sk=0;
    window.__pt=0;window.__pi=setInterval(()=>{if(!P||!S)return;P.hp=P.maxHp;window.__pt+=0.05;const a=window.__pt*0.5;joy={id:-1,ox:-999,oy:-999,dx:Math.cos(a)*0.8,dy:Math.sin(a)*0.8};
      const vis=id=>!document.getElementById(id).hidden;
      if(scene==='moba'){if(MB&&MB.over){mobaStart('hunter');MB.me.bot={t:0,mode:'push'}}return}
      if(vis('ovLevel')){const c=document.querySelector('#cards .card');if(c)c.click()}
      if(vis('ovBoss'))document.getElementById('fightBtn').click();
      if(S.mode==='over')document.getElementById('againBtn').click();
      if(scene==='arena'&&S.mode==='play'&&(o.enemies||o.boss||o.skills)){
        if(o.enemies){const live=enemies.filter(e=>!e.dead&&!e.isBoss).length;for(let i=live;i<o.enemies;i++){const a=rnd()*6.283,d=130+rnd()*300,t=AT[Math.floor(rnd()*AT.length)],e=addEnemy(t,P.x+Math.cos(a)*d,P.y+Math.sin(a)*d*0.8);if(e){e.hp=e.max=1e12;e.mult={}}}}
        if(o.boss&&!S.boss){const b=makeBoss();b.hp=b.max=1e12;S.boss=b;enemies.push(b);S.nextBoss=Infinity}
        if(o.skills&&S.sk&&(++window.__sk%6===0)){S.sk.cd=S.sk.ids.map(()=>0);for(const id of S.sk.ids.slice())try{skillUse(id)}catch(err){}}}
      // בעולם: גוש אויבים חדש סביב השחקן כשנשארו מעט, כדי שהקרב יהיה צפוף כמו במחנה
      if(scene==='world'&&S.wd&&S.mode==='play'&&enemies.filter(e=>!e.dead).length<24)for(let i=0;i<8;i++){const a=i/8*6.283;addEnemy('grunt',P.x+Math.cos(a)*230,P.y+Math.sin(a)*230,1)}},50);
  },{scene:CFG.scene,enemies:CFG.enemies,boss:CFG.boss,skills:CFG.skills,seed:CFG.seed});
  await page.waitForTimeout(CFG.warm*1000);
  await page.evaluate(()=>{const M=__pa;M.f=[];M.gaps=[];M.n=0;M.en=0;M.on=true});
  let hid=null;
  if(CFG.hidden){
    // חצי מהזמן בקרב, ואז "הטלפון עבר לרקע": document.hidden=true ואירוע visibilitychange. הלולאה אמורה לעצור
    await page.waitForTimeout(CFG.secs*500);
    const before=await page.evaluate(()=>{Object.defineProperty(document,'hidden',{get:()=>true,configurable:true});Object.defineProperty(document,'visibilityState',{get:()=>'hidden',configurable:true});
      document.dispatchEvent(new Event('visibilitychange'));return{t:S.t,frames:__pa.n,now:performance.now()}});
    await page.waitForTimeout(3000);
    const during=await page.evaluate(()=>({t:S.t,frames:__pa.n,paused:typeof LOOP!=='undefined'?LOOP.paused:null}));
    const back=await page.evaluate(()=>{Object.defineProperty(document,'hidden',{get:()=>false,configurable:true});Object.defineProperty(document,'visibilityState',{get:()=>'visible',configurable:true});
      document.dispatchEvent(new Event('visibilitychange'));return{t:S.t}});
    await page.waitForTimeout(500);
    const after=await page.evaluate(()=>({t:S.t,frames:__pa.n,paused:typeof LOOP!=='undefined'?LOOP.paused:null,maxDt:typeof LOOP!=='undefined'?LOOP.maxDt:null}));
    hid={gameTimeWhileHidden:+(during.t-before.t).toFixed(3),framesWhileHidden:during.frames-before.frames,pausedFlag:during.paused,resumedFlag:after.paused===false,
      gameTimeFirstHalfSecondBack:+(after.t-back.t).toFixed(3),frozen:during.frames-before.frames===0};
    await page.waitForTimeout(CFG.secs*500);
  }else await page.waitForTimeout(CFG.secs*1000);
  const r=await page.evaluate(()=>{const M=__pa;M.on=false;clearInterval(window.__pi);
    const f=M.f.slice().sort((a,b)=>a-b),n=f.length||1,avg=f.reduce((a,b)=>a+b,0)/n;
    // FPS לפי חלונות של שנייה (מהפערים בין פריימים), ואז החציון שלהם
    const win=[];let acc=0,cnt=0;for(const g of M.gaps){acc+=g;cnt++;if(acc>=1000){win.push(1000*cnt/acc);acc=0;cnt=0}}win.sort((a,b)=>a-b);
    return{frames:f.length,msAvg:+avg.toFixed(2),ms50:+(f[Math.floor(n*0.5)]||0).toFixed(2),ms95:+(f[Math.floor(n*0.95)]||0).toFixed(2),ms99:+(f[Math.floor(n*0.99)]||0).toFixed(2),
      fpsMedian:+(win[Math.floor(win.length/2)]||0).toFixed(1),fpsMin:+(win[0]||0).toFixed(1),enemiesAvg:+(M.en/Math.max(1,M.n)).toFixed(1),peak:M.peak,t:+S.t.toFixed(1),level:P.level,kills:S.kills,gfx3d:R3D.on,calls:M.calls,tris:M.tris,geo:M.geo,tex:M.tex,objs:R3D.on&&R3D.scene?(()=>{let c=0;R3D.scene.traverse(()=>c++);return c})():null}});
  r.renderer=await GPU.report(page,'perf-arena');
  const out={commit,cfg:CFG,result:r,hidden:hid,loopLog:logs.slice(0,10),errors:errors.slice(0,10)};
  console.log('renderer: '+r.renderer+(GPU.isSoft(r.renderer)?'  (תוכנה)':'')+(r.gfx3d?`  · 3D: calls ${r.calls}, tris ${r.tris}, objects ${r.objs}, geometries ${r.geo}, textures ${r.tex}`:''));
  console.log(`commit ${commit} ${CFG.scene}${CFG.enemies?' crowd '+CFG.enemies:''}${CFG.boss?' +boss':''}${CFG.skills?' +skills':''} seed ${CFG.seed} cpu x${CFG.cpu} ${CFG.gfx} ${CFG.secs}s: fps median ${r.fpsMedian} (min ${r.fpsMin}), frame ms avg ${r.msAvg} p50 ${r.ms50} p95 ${r.ms95} p99 ${r.ms99}, frames ${r.frames}, enemies avg ${r.enemiesAvg} peak ${r.peak.enemies}, floats peak ${r.peak.floats}, nums peak ${r.peak.nums}, layers peak ${r.peak.layers}, fx peak ${r.peak.fx}, game t ${r.t} lvl ${r.level} kills ${r.kills}`);
  if(hid)console.log('hidden:',JSON.stringify(hid));
  if(logs.length)console.log('loop log:',logs.join(' | '));
  if(errors.length)console.log('errors:',errors.slice(0,5));
  if(CFG.json)fs.writeFileSync(CFG.json,JSON.stringify(out,null,1));
  await browser.close();
})();
