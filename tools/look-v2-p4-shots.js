/* Evidence for look v2 phase 4 (js/look-v2.js part 5; concept: docs/concept-visual-language.md §10). Not part of the game or of npm run check.
   Offline and disposable like tools/look-v2-village-shots.js: a fresh browser context (empty storage), every http(s) request answered locally,
   Math.random seeded, the clock faked, village levels set on the in-memory save of that empty context only. Always 3D (never --gfx 2d).
   Same steps twice, ?look=v1 (before) and the default (v2): the arena (must be pixel-identical), the village at center levels 1-5 (every building at
   that level: a wide shot and a close-up of each building), and the meadow with a tree and a rock mid-gather (hp at 50%).
   Also: console errors, which lazy files the opening fetched, the size of each v2 piece, how long each took to load, and the frame times in the village.
   Run: node tools/look-v2-p4-shots.js [--out dir] [--seed 5] [--vw 915 --vh 412] [--night] [--levels 1,2,3,4,5]
   NODE_PATH with sharp (the build3d.js packages) for the arena pixel compare and the side-by-side pairs. */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const args=process.argv.slice(2),opt=k=>{const i=args.indexOf('--'+k);return i<0?null:(args[i+1]&&!args[i+1].startsWith('--')?args[i+1]:true)};
const OUT=path.resolve(opt('out')||path.join(__dirname,'look-v2-p4-shots')),SEED=+(opt('seed')||5),NIGHT=!!opt('night');
const VP={width:+(opt('vw')||915),height:+(opt('vh')||412)},TAG='p'+VP.width+(NIGHT?'-night':''),LEVELS=(opt('levels')||'1,2,3,4,5').split(',').map(Number);
const BLD=['center','forge','mill','mine','market','stash','inn'];
fs.mkdirSync(OUT,{recursive:true});

async function session(browser,v2){
  const ctx=await browser.newContext({viewport:VP,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await ctx.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/plain',body:''}));
  await page.addInitScript(seed=>{let a=seed>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
    try{localStorage.setItem('zm-gfx','3d')}catch(e){}},SEED);
  await page.clock.install({time:0});await page.clock.pauseAt(1000);
  const q=[v2?'':'look=v1',NIGHT?'tod=night':'tod=day','m3dIdle=0'].filter(Boolean).join('&');
  await page.goto('file://'+path.resolve(__dirname,'..','index.html')+'?'+q,{timeout:120000});
  await page.clock.runFor(300);
  for(let i=0;i<300;i++){const r=await page.evaluate(()=>R3D.ready||R3D.failed);if(r)break;await page.waitForTimeout(50);await page.clock.runFor(50)}
  const run=async(ms,step=50)=>{for(let t=0;t<ms;t+=step){await page.evaluate(()=>{if(typeof P!=='undefined'&&P.maxHp){P.hp=P.maxHp;P.inv=0}
    for(const o of document.querySelectorAll('[id^="ov"],.win'))if(!o.hidden&&o.id!=='ovHud')o.hidden=true});await page.clock.runFor(step)}};
  const noHud=v=>page.evaluate(v=>{for(const el of document.body.children)if(!el.querySelector('canvas')&&el.tagName!=='CANVAS')el.style.visibility=v?'hidden':''},v);
  const settle=async()=>{for(let i=0;i<300;i++){if(await page.evaluate(()=>M3D.pending()===0&&!(typeof LV2!=='undefined'&&LV2.wait&&LV2.wait.size)))break;await page.waitForTimeout(50);await page.clock.runFor(50)}await run(300)};
  const shot=async(name,clip)=>{await page.evaluate(()=>{if(typeof P!=='undefined')P.inv=0});await page.clock.runFor(17);const f=path.join(OUT,TAG+'-'+name+'-'+(v2?'v2':'before')+'.png');await page.screenshot({path:f,...(clip?{clip}:{})});return f};
  const R={v2,errors,shots:{}};
  R.boot=await page.evaluate(()=>({bootKs:M3D.bootKs,kb:Math.round((M3D.bootKs||[]).reduce((a,k)=>a+(M3D_LAZY[k]||0),0)*0.75/1024)}));
  await page.evaluate(()=>{R3D.drawEvery=1;heroPick('warrior')});await run(400);
  // the arena first (pixel-identical with and without v2)
  await page.evaluate(()=>startRun());await run(1500);
  await noHud(true);R.arenaScene=await shot('arena-scene');await noHud(false);
  const C=VP.width/2,M=VP.height/2,crop=(w,h,dy=0)=>({x:Math.max(0,Math.round(C-w/2)),y:Math.max(0,Math.round(M-h/2+dy)),width:Math.min(VP.width,w),height:Math.min(VP.height,h)});
  const at=(x,y)=>page.evaluate(([x,y])=>{P.x=x;P.y=y;S.vil&&(S.vil.cam=null)},[x,y]);
  R.frames={};
  for(const L of LEVELS){
    await page.evaluate(L=>{for(const k in VILLAGE.b)SAVE.village[k]=L;   // in-memory save of this empty context
      if(S.vil&&R3D.vil){R3D.scene.remove(R3D.vil.g);R3D.vil=null}enterVillage()},L);
    await run(600);await settle();
    await at(0,-60);await run(900);await settle();await noHud(true);R.shots['village'+L]=await shot('L'+L+'-village');await noHud(false);
    // frame time in the plaza: real wall ms of 30 steps (SwiftShader, CPU: a relative number, v1 against v2)
    R.frames['L'+L]=await page.evaluate(()=>R3D.stats&&{calls:R3D.stats.calls,tris:R3D.stats.tris});   // what the plaza view costs the GPU (draw calls and triangles), v1 against v2
    for(const k of BLD){
      await page.evaluate(k=>{const B=VILLAGE.b[k];P.x=B.x+(B.x>0?-40:40);P.y=B.y+(k==='center'?175:120);S.vil&&(S.vil.cam=null)},k);await run(900);
      R.shots[k+L]=await shot('L'+L+'-'+k,crop(560,360,-40))}
  }
  // the meadow: one tree and one rock at half hp, next to the hero (the gather stages: gather.js shrinks and sways by hp)
  await page.evaluate(()=>{enemies.length=0;enterWorld('home')});await run(800);await settle();
  await page.evaluate(()=>{window.__only=1;enemies.length=0;const L=S.nd.list,near=(sh)=>L.filter(n=>!n.dead&&wKind(n.kind).shape===sh).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];
    const t=near('tree'),r=near('rock');window.__nodes=[t,r];if(t){P.x=t.x+60;P.y=t.y+70}for(const n of [t,r])if(n){n.hp=n.max*0.5}});
  await run(900);await settle();await page.evaluate(()=>{enemies.length=0});await run(300);
  R.shots.gather=await shot('meadow-tree',crop(620,380,-30));
  await page.evaluate(()=>{const r=window.__nodes[1];if(r){P.x=r.x+60;P.y=r.y+70}enemies.length=0});await run(900);
  R.shots.rock=await shot('meadow-rock',crop(620,380,-30));
  await page.evaluate(()=>{const t=window.__nodes[0];P.x=t.x+60;P.y=t.y+70;enemies.length=0});await run(600);
  R.world=await page.evaluate(()=>({rebuilt:typeof LV2!=='undefined'&&LV2.rebuilt||0,nodes:(window.__nodes||[]).map(n=>{const G=R3D.wlds[S.wd.reg||'meadow'],m=n&&G&&G.nodes[n.id];return n&&{kind:n.kind,hp:n.hp,max:n.max,r:n.r,v2piece:m?m.userData.lv2w:null,scale:m?Math.round(m.scale.x*100)/100:null}})}));
  // break the tree: fall, stump, sprout (gather.js), then a wide meadow view
  await page.evaluate(()=>{const t=window.__nodes[0];if(t&&typeof gHit==='function'){t.hp=0;try{gHit(t,0,1)}catch(e){}}});await run(1500);
  R.shots.broken=await shot('meadow-broken',crop(620,380,-30));
  R.load=await page.evaluate(()=>({log:M3D.log.filter(l=>/^vx_lv2_|^lv2_/.test(l.k)),fail:Object.keys(M3D.st).filter(k=>M3D.st[k]==='fail'),
    loadedKB:Math.round(M3D.log.filter(l=>/^vx_lv2_/.test(l.k)).reduce((a,l)=>a+(M3D_LAZY[l.k]||0),0)*0.75/1024),
    loadedOldKB:Math.round(M3D.log.filter(l=>/^vx_(?!lv2_)/.test(l.k)).reduce((a,l)=>a+(M3D_LAZY[l.k]||0),0)*0.75/1024)}));
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
    for(const k in B.shots){const [l,r]=[A.shots[k],B.shots[k]];if(!l||!r)continue;const m=await sharp(l).metadata();
      await sharp({create:{width:m.width*2+6,height:m.height,channels:3,background:'#111'}}).composite([{input:l,left:0,top:0},{input:r,left:m.width+6,top:0}]).jpeg({quality:86}).toFile(path.join(OUT,TAG+'-'+k+'.jpg'))}}
  const rep={seed:SEED,viewport:VP,night:NIGHT,arena,before:{errors:A.errors,boot:A.boot,frames:A.frames,load:A.load,world:A.world},v2:{errors:B.errors,boot:B.boot,frames:B.frames,load:B.load,world:B.world}};
  fs.writeFileSync(path.join(OUT,TAG+'-report.json'),JSON.stringify(rep,null,1));
  console.log(JSON.stringify(rep,null,1));
})().catch(e=>{console.error(e);process.exit(1)});
