/* Evidence for the look v2 pilot (?look=v2, js/look-v2.js; concept: docs/concept-visual-language.md). Not part of the game or of npm run check.
   Offline and disposable, like tools/check.js: a fresh browser context (its own empty storage), every http(s) request answered locally
   with an empty body (no cloud, no Supabase, no live site), Math.random seeded, the clock faked. No real save is ever read or written.
   Same steps twice, without and with ?look=v2, in 3D on the CPU (SwiftShader), phone landscape 844x390 (and --ipad: 1180x820):
     village plaza, a world fight (8 grunts + 3 shields + 2 wisps around the hero), motion strips of one grunt (spawn, walk, attack, death),
     the arena right after it starts (must be identical with and without v2), and numbers: first-spawn cost of the new body,
     20 grunts spawning in one frame, JS heap, GPU geometries and textures, draw calls, triangles, and HUD drift over 30 frames.
   Run: node tools/look-v2-shots.js [--out docs/concept/visual-language/pilot] [--seed 5] [--ipad]
   Output: <out>/*.png and <out>/look-v2-report.json, plus a summary in the console. */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const args=process.argv.slice(2),opt=k=>{const i=args.indexOf('--'+k);return i<0?null:(args[i+1]&&!args[i+1].startsWith('--')?args[i+1]:true)};
const OUT=path.resolve(opt('out')||path.join(__dirname,'look-v2-shots')),SEED=+(opt('seed')||5);
const VP=opt('ipad')?{width:1180,height:820}:{width:844,height:390},TAG=opt('ipad')?'ipad':'phone';
fs.mkdirSync(OUT,{recursive:true});

async function session(browser,v2){
  const ctx=await browser.newContext({viewport:VP,deviceScaleFactor:1,isMobile:true,hasTouch:true});   // new context = empty storage: no real save
  const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await ctx.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/plain',body:''}));   // offline: nothing leaves the machine
  await page.addInitScript(seed=>{let a=seed>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
    try{localStorage.setItem('zm-gfx','3d')}catch(e){}},SEED);
  await page.clock.install({time:0});await page.clock.pauseAt(1000);
  await page.goto('file://'+path.resolve(__dirname,'..','index.html')+(v2?'?look=v2':''),{timeout:120000});
  await page.clock.runFor(300);
  for(let i=0;i<300;i++){const r=await page.evaluate(()=>R3D.ready||R3D.failed);if(r)break;await page.waitForTimeout(50);await page.clock.runFor(50)}
  // each step: the hero can't die, open windows close, and (when set) only the test's own enemies stay, so nothing else walks into the frame
  const run=async(ms,step=50)=>{for(let t=0;t<ms;t+=step){await page.evaluate(()=>{if(typeof P!=='undefined'&&P.maxHp)P.hp=P.maxHp;
    for(const o of document.querySelectorAll('[id^="ov"]'))if(!o.hidden&&o.id!=='ovHud')o.hidden=true;
    if(window.__only&&typeof enemies!=='undefined')for(let i=enemies.length-1;i>=0;i--)if(!enemies[i].lv2t)enemies.splice(i,1)});await page.clock.runFor(step)}};
  const noHud=v=>page.evaluate(v=>{for(const el of document.body.children)if(!el.querySelector('canvas')&&el.tagName!=='CANVAS')el.style.visibility=v?'hidden':''},v);
  const waitModel=async k=>{for(let i=0;i<200;i++){if(await page.evaluate(k=>!m3dLazy(k)||m3dReady(k),k))return true;await page.waitForTimeout(50);await page.clock.runFor(50)}return false};
  const shot=async(name,clip)=>{const f=path.join(OUT,TAG+'-'+name+'-'+(v2?'v2':'before')+'.png');await page.screenshot({path:f,...(clip?{clip}:{})});return f};
  const R={v2,errors};
  // the arena first, straight from a fresh start: the same steps with and without v2
  await page.evaluate(()=>{R3D.drawEvery=1;heroPick('warrior')});await run(400);
  await page.evaluate(()=>startRun());await run(1500);
  R.arena=await shot('arena');await noHud(true);R.arenaScene=await shot('arena-scene');await noHud(false);   // scene only: the HUD has its own animations
  // village: the hero on the plaza
  await page.evaluate(()=>{enterVillage()});await run(600);
  await page.evaluate(()=>{P.x=40;P.y=-110});await run(1200);
  R.village=await shot('village');R.villageHero=await shot('village-hero',{x:VP.width/2-110,y:VP.height/2-120,width:220,height:200});
  // world: a crowd around the hero
  await page.evaluate(()=>{enterWorld('home')});await run(600);
  await page.evaluate(()=>{P.y+=380;window.__only=1});await run(600);   // away from the gate lantern, on open grass
  R.orcReady=v2?await waitModel('mon_orcSkull'):null;
  await page.evaluate(()=>{enemies.length=0;const ts=[['grunt',8],['shield',3],['wisp',2]];let i=0;
    for(const [t,n] of ts)for(let j=0;j<n;j++,i++){const a=i/13*Math.PI*2;const e=addEnemy(t,P.x+Math.cos(a)*120,P.y+Math.sin(a)*90);e.speed=0;e.dmg=0;e.lv2t=1}});
  await run(900);
  R.world=await shot('world-crowd');R.worldHero=await shot('world-hero',{x:VP.width/2-110,y:VP.height/2-120,width:220,height:200});
  // motion strip of one grunt, 60 px right of the hero, cropped around it
  await page.evaluate(()=>{enemies.length=0;window.__g=addEnemy('grunt',P.x+70,P.y);__g.dmg=0;__g.lv2t=1});
  const box=()=>page.evaluate(()=>{const s=document.getElementById('c3')||document.querySelector('canvas'),r=s.getBoundingClientRect();
    return {x:Math.max(0,Math.round(r.width/2-60)),y:Math.max(0,Math.round(r.height/2-95)),width:200,height:150}});
  const strip=[];
  for(const [ph,ms] of [['spawn',80],['spawn2',200],['walk',500],['walk2',300]]){await run(ms);strip.push(await shot('m-'+ph,await box()))}
  await page.evaluate(()=>{__g.sw=0.3;__g.flash=0});await run(100);strip.push(await shot('m-attack',await box()));
  await run(150);strip.push(await shot('m-attack2',await box()));
  await page.evaluate(()=>{__g.hp=0;__g.dead=true});await run(250);strip.push(await shot('m-death',await box()));
  await run(500);strip.push(await shot('m-death2',await box()));
  R.strip=strip;
  // numbers: 20 grunts in one frame, first-spawn cost, memory, draw calls, HUD drift
  // the page's clock is fake (performance.now stands still), so times are wall clock from here, around one frame each. Heap from CDP
  const cdp=await ctx.newCDPSession(page),heap=async()=>{const m=(await cdp.send('Performance.getMetrics')).metrics;return Math.round(m.find(x=>x.name==='JSHeapUsedSize').value/1e5)/10};
  await cdp.send('Performance.enable');
  const frame=async(fn,arg)=>{const t=Date.now();await page.evaluate(fn,arg);return Date.now()-t};
  await page.evaluate(()=>{enemies.length=0;window.__ft=performance.now()});const h0=await heap();
  const idleMs=await frame(()=>{frameStep(window.__ft+=16)});
  const spawn20=await frame(()=>{for(let i=0;i<20;i++){const a=i/20*Math.PI*2;const e=addEnemy('grunt',P.x+Math.cos(a)*150,P.y+Math.sin(a)*110);e.dmg=0;e.lv2t=1}frameStep(window.__ft+=16)});
  const next=[];for(let i=0;i<5;i++)next.push(await frame(()=>{frameStep(window.__ft+=16)}));
  await page.evaluate(()=>{enemies.length=0});await frame(()=>{frameStep(window.__ft+=16)});
  const again20=await frame(()=>{for(let i=0;i<20;i++){const a=i/20*Math.PI*2;const e=addEnemy('grunt',P.x+Math.cos(a)*150,P.y+Math.sin(a)*110);e.dmg=0;e.lv2t=1}frameStep(window.__ft+=16)});
  const h1=await heap();
  R.perf=await page.evaluate(async()=>{const ri=R3D.r.info;
    const k=foeKey(enemies[0]),L=LOOK3D[k];let tris=0;const tm=R3D.tmpl[L.model];if(tm)tm.traverse(o=>{if(o.isMesh&&o.geometry.index)tris+=o.geometry.index.count/3});
    // HUD drift: the hp bar and the skill button must not move between consecutive frames, also after spawn protection ends
    const els=['hpWrap','hpBar','sk1','skBtn','skills'].map(id=>document.getElementById(id)).filter(Boolean),pos=[];
    for(let i=0;i<30;i++){frameStep(window.__ft+=16);pos.push(els.map(e=>{const r=e.getBoundingClientRect();return r.x.toFixed(1)+','+r.y.toFixed(1)}).join('|'))}
    return {key:k,model:L.model,tris,geometries:ri.memory.geometries,textures:ri.memory.textures,hud:{els:els.map(e=>e.id),distinct:new Set(pos).size}}});
  Object.assign(R.perf,{wallMs:{idleFrame:idleMs,first20SpawnFrame:spawn20,next5:next,second20SpawnFrame:again20},heapMB:[h0,h1]});
  await run(300);R.world20=await shot('world-20');
  await ctx.close();return R;
}

(async()=>{
  const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-precise-memory-info']});
  const A=await session(browser,false),B=await session(browser,true);
  await browser.close();
  // arena: pixel compare with and without v2
  // needs sharp (the build3d.js packages, NODE_PATH). Without it: compare the two arena images by eye
  const sharp=(()=>{try{return require('sharp')}catch(e){return null}})();
  let arena='sharp not installed: compare the two arena images by eye';
  if(sharp){const rd=f=>sharp(f).removeAlpha().raw().toBuffer({resolveWithObject:true});const [a,b]=await Promise.all([rd(A.arenaScene),rd(B.arenaScene)]);let d=0;
    for(let i=0;i<a.data.length;i+=3)if(Math.abs(a.data[i]-b.data[i])+Math.abs(a.data[i+1]-b.data[i+1])+Math.abs(a.data[i+2]-b.data[i+2])>12)d++;
    arena={pixelsDiffer:d,of:a.info.width*a.info.height}}
  const rep={seed:SEED,viewport:VP,arena,before:A,v2:B};
  fs.writeFileSync(path.join(OUT,TAG+'-look-v2-report.json'),JSON.stringify(rep,null,1));
  console.log(JSON.stringify({arena,errors:[A.errors.length,B.errors.length],perfBefore:A.perf,perfV2:B.perf,orcReady:B.orcReady},null,1));
})().catch(e=>{console.error(e);process.exit(1)});
