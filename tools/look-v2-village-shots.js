/* Evidence for look v2, village stage 2 (js/look-v2.js part 4; concept: docs/concept-visual-language.md §7). Not part of the game or of npm run check.
   Offline and disposable like tools/look-v2-shots.js: a fresh browser context (empty storage), every http(s) request answered locally (no cloud, no live site),
   Math.random seeded, the clock faked. The village levels are set on the in-memory save of that empty context only.
   Same steps twice, ?look=v1 (before) and the default (v2), in 3D (SwiftShader): the whole village, then close-ups of the forge yard, the market row,
   the plaza stalls, the gate, the smith and the innkeeper; at day and with ?tod=night; at village levels 2, 4 and 5. Plus the arena (must be pixel-identical),
   console errors, and the load: which lazy files the opening fetched (M3D.bootKs), their size, and how long each v2 piece took (M3D.log).
   Run: node tools/look-v2-village-shots.js [--out dir] [--seed 5] [--vw 915 --vh 412 | --ipad] [--night]
   NODE_PATH with sharp (the build3d.js packages) for the arena pixel compare. */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const args=process.argv.slice(2),opt=k=>{const i=args.indexOf('--'+k);return i<0?null:(args[i+1]&&!args[i+1].startsWith('--')?args[i+1]:true)};
const OUT=path.resolve(opt('out')||path.join(__dirname,'look-v2-village-shots')),SEED=+(opt('seed')||5),NIGHT=!!opt('night');
const VP=opt('ipad')?{width:1180,height:820}:{width:+(opt('vw')||915),height:+(opt('vh')||412)},TAG=(opt('ipad')?'ipad':'p'+VP.width)+(NIGHT?'-night':'');
fs.mkdirSync(OUT,{recursive:true});
const LV2KEYS=['lv2_smith','lv2_inn','vx_lv2_gate','vx_lv2_rack','vx_lv2_barrel','vx_lv2_bucket','vx_lv2_crate','vx_lv2_crateS','vx_lv2_lumber','vx_lv2_fence','vx_lv2_banner','vx_lv2_pennant','vx_lv2_stall','vx_lv2_sack'];

async function session(browser,v2){
  const ctx=await browser.newContext({viewport:VP,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await ctx.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/plain',body:''}));
  await page.addInitScript(seed=>{let a=seed>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
    try{localStorage.setItem('zm-gfx','3d')}catch(e){}},SEED);
  await page.clock.install({time:0});await page.clock.pauseAt(1000);
  const q=[v2?'':'look=v1',NIGHT?'tod=night':'','m3dIdle=0'].filter(Boolean).join('&');
  await page.goto('file://'+path.resolve(__dirname,'..','index.html')+'?'+q,{timeout:120000});
  await page.clock.runFor(300);
  for(let i=0;i<300;i++){const r=await page.evaluate(()=>R3D.ready||R3D.failed);if(r)break;await page.waitForTimeout(50);await page.clock.runFor(50)}
  const run=async(ms,step=50)=>{for(let t=0;t<ms;t+=step){await page.evaluate(()=>{if(typeof P!=='undefined'&&P.maxHp){P.hp=P.maxHp;P.inv=0}
    for(const o of document.querySelectorAll('[id^="ov"],.win'))if(!o.hidden&&o.id!=='ovHud')o.hidden=true});await page.clock.runFor(step)}};
  const noHud=v=>page.evaluate(v=>{for(const el of document.body.children)if(!el.querySelector('canvas')&&el.tagName!=='CANVAS')el.style.visibility=v?'hidden':''},v);
  const settle=async()=>{for(let i=0;i<200;i++){if(await page.evaluate(()=>M3D.pending()===0&&!(LV2.wait&&LV2.wait.size)))break;await page.waitForTimeout(50);await page.clock.runFor(50)}await run(300)};
  const shot=async(name,clip)=>{await page.evaluate(()=>{if(typeof P!=='undefined')P.inv=0});await page.clock.runFor(17);const f=path.join(OUT,TAG+'-'+name+'-'+(v2?'v2':'before')+'.png');await page.screenshot({path:f,...(clip?{clip}:{})});return f};
  const R={v2,errors,shots:{}};
  R.boot=await page.evaluate(ks=>({bootKs:M3D.bootKs,lv2Boot:(M3D.bootKs||[]).filter(k=>ks.includes(k)),kb:Math.round((M3D.bootKs||[]).filter(k=>ks.includes(k)).reduce((a,k)=>a+(M3D_LAZY[k]||0),0)*0.75/1024)}),LV2KEYS);
  // the arena first (pixel-identical with and without v2)
  await page.evaluate(()=>{R3D.drawEvery=1;heroPick('warrior')});await run(400);
  await page.evaluate(()=>startRun());await run(1500);
  await noHud(true);R.arenaScene=await shot('arena-scene');await noHud(false);
  // the village at three levels
  const C=VP.width/2,M=VP.height/2,crop=(w,h,dy=0)=>({x:Math.max(0,Math.round(C-w/2)),y:Math.max(0,Math.round(M-h/2+dy)),width:Math.min(VP.width,w),height:Math.min(VP.height,h)});
  for(const L of [4,2,5]){
    await page.evaluate(L=>{for(const k in VILLAGE.b)SAVE.village[k]=Math.min(L,VILLAGE.b[k].look?VILLAGE.b[k].look[VILLAGE.b[k].look.length-1].at:L);SAVE.village.center=L;   // in-memory save of this empty context
      if(S.vil&&R3D.vil){R3D.scene.remove(R3D.vil.g);R3D.vil=null}enterVillage()},L);
    await run(600);await settle();
    const at=(x,y)=>page.evaluate(([x,y])=>{P.x=x;P.y=y;S.vil&&(S.vil.cam=null)},[x,y]);
    if(L===4){await at(0,-60);await run(900);await settle();await noHud(true);R.shots.village=await shot('L4-village');await noHud(false)}
    await at(-450,-120);await run(900);R.shots['forge'+L]=await shot('L'+L+'-forge',crop(520,330,-40));
    await at(450,-120);await run(900);R.shots['market'+L]=await shot('L'+L+'-market',crop(520,330,-40));
    if(L>=4){await at(0,-120);await run(900);R.shots['plaza'+L]=await shot('L'+L+'-plaza',crop(620,330,-30))}
    if(L===4){
      await page.evaluate(()=>{const g=VILLAGE.gate;P.x=g.x+90;P.y=g.y-90});await run(900);R.shots.gate=await shot('L4-gate',crop(560,330,0));
      // the two NPCs, standing still next to the hero
      for(const id of ['smith','inn']){await page.evaluate(id=>{const n=npcState()[id];if(n){P.x=n.x+50;P.y=n.y+10}},id);await run(700);R.shots[id]=await shot('L4-'+id,crop(360,260,-30))}
    }
  }
  R.load=await page.evaluate(ks=>({log:M3D.log.filter(l=>ks.includes(l.k)),fail:ks.filter(k=>M3D.st[k]==='fail'),
    sizesKB:Object.fromEntries(ks.map(k=>[k,Math.round((M3D_LAZY[k]||0)*0.75/102.4)/10])),
    npc:typeof R3D.npcs==='object'?Object.fromEntries(['smith','inn'].map(id=>[id,R3D.npcs[id]&&R3D.npcs[id].L.model])):null}),LV2KEYS);
  await ctx.close();return R;
}

(async()=>{
  const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const A=await session(browser,false),B=await session(browser,true);
  await browser.close();
  const sharp=(()=>{try{return require('sharp')}catch(e){return null}})();
  let arena='sharp not installed';
  if(sharp){const rd=f=>sharp(f).removeAlpha().raw().toBuffer({resolveWithObject:true});const [a,b]=await Promise.all([rd(A.arenaScene),rd(B.arenaScene)]);let d=0;
    for(let i=0;i<a.data.length;i+=3)if(a.data[i]!==b.data[i]||a.data[i+1]!==b.data[i+1]||a.data[i+2]!==b.data[i+2])d++;
    arena={pixelsDiffer:d,of:a.info.width*a.info.height};
    // side-by-side pairs (before | v2) for every shot
    for(const k in B.shots){const [l,r]=[A.shots[k],B.shots[k]];if(!l||!r)continue;const m=await sharp(l).metadata();
      await sharp({create:{width:m.width*2+6,height:m.height,channels:3,background:'#111'}}).composite([{input:l,left:0,top:0},{input:r,left:m.width+6,top:0}]).jpeg({quality:86}).toFile(path.join(OUT,TAG+'-'+k+'.jpg'))}}
  const rep={seed:SEED,viewport:VP,night:NIGHT,arena,before:{errors:A.errors,boot:A.boot},v2:{errors:B.errors,boot:B.boot,load:B.load}};
  fs.writeFileSync(path.join(OUT,TAG+'-report.json'),JSON.stringify(rep,null,1));
  console.log(JSON.stringify(rep,null,1));
})().catch(e=>{console.error(e);process.exit(1)});
