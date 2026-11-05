/* ביצועים בטלפון (משימה פ, 4.11.2026): כמה מילישניות לפריים בחמישה מצבים, בתלת-ממד מלא (בלי drawEvery של הבדיקה),
   ברוחב טלפון שוכב, עם האטת מעבד פי 4 (CDP), כדי לדמות טלפון. גם זמן טעינה וגודל הקבצים.
   המצבים: כפר, עולם רגיל, עולם עם ערפל, עולם עם גשם, קרב בענק, עומק הצל קומה 10. בכל מצב השחקן הולך במעגל ולא מת.
   מודד לכל פריים את frameStep כולו, ובתוכו: update, render (קנבס), render3d, hud, mutDraw. ומספר הציורים (draw calls).
   הרצה: node tools/perf.js [--q hi|lo] [--secs 5] [--cpu 4] [--json out.json] [--only village,fog] [--shadow 0|1] [--url bloom=0] [--prof] [--vw 1386 --vh 636 --dsf 3]
   הטלפון של ניר (OnePlus 15): --cpu 1 --vw 1386 --vh 636 --dsf 3
   לא רץ ב-GitHub. אין כרטיס גרפי: WebGL על המעבד (SwiftShader), אז המספרים להשוואה לפני/אחרי, לא ערך מוחלט של טלפון */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const args=process.argv.slice(2);
const opt=k=>{const i=args.indexOf('--'+k);if(i<0)return null;const v=args[i+1];return v&&!v.startsWith('--')?v:true};
const CFG={q:opt('q')||'hi',secs:+(opt('secs')||5),warm:1.5,cpu:+(opt('cpu')||4),phone:{width:+(opt('vw')||844),height:+(opt('vh')||390)},dsf:+(opt('dsf')||2),
  prof:!!opt('prof'),url:opt('url')||'',shadow:opt('shadow')||'1',only:opt('only')?String(opt('only')).split(','):null,json:opt('json')};

const SCENES={
  village:()=>{enterVillage()},
  world:()=>{MUT.force='split';enterWorld('home','meadow')},
  fog:()=>{MUT.force='fog';enterWorld('home','meadow')},
  rain:()=>{MUT.force='rain';enterWorld('home','lake')},
  giant:()=>{MUT.force='split';enterWorld('home','meadow');const e=storyWarden('earth',P.y+260);e.rise=0},
  depths10:()=>{MUT.force='split';depthsEnter(10)},
  desert:()=>{MUT.force='split';enterWorld('home','desert')},   // המדבר (ת17): ליד השער
  canyon:()=>{MUT.force='split';enterWorld('home','desert');P.x=-1500;P.y=-250;P._tx=null}   // המדבר: בתוך הקניון, בין המסות והלבה
};

(async()=>{
  const sizes={};for(const f of fs.readdirSync(path.join(__dirname,'..','js')))sizes[f]=fs.statSync(path.join(__dirname,'..','js',f)).size;
  const total=Object.values(sizes).reduce((a,b)=>a+b,0);
  const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:CFG.phone,deviceScaleFactor:CFG.dsf,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(q=>{try{localStorage.setItem('zm-gfx','3d');localStorage.setItem('zm-shadow',q.sh)}catch(e){}window.__perfQ=q.q},{q:CFG.q,sh:CFG.shadow});
  const cdp=await page.context().newCDPSession(page);
  if(CFG.cpu>1)await cdp.send('Emulation.setCPUThrottlingRate',{rate:CFG.cpu});
  const t0=Date.now();
  await page.goto('file://'+path.resolve(__dirname,'..','index.html')+(CFG.url?'?'+CFG.url:''));
  const tDom=Date.now()-t0;
  await page.waitForFunction(()=>typeof R3D!=='undefined'&&(R3D.ready||R3D.failed),null,{timeout:600000,polling:200});
  const tReady=Date.now()-t0;
  const ok3d=await page.evaluate(()=>R3D.ready&&!R3D.failed);
  // מכינים: שמירה עם הפנסים הראשונים (המוטציה נפתחת אחרי האדמה), איכות האפקטים, ומדידה של כל פונקציה
  await page.evaluate(()=>{
    SAVE.story=SAVE.story||{};SAVE.story.earth=true;SAVE.vfxQ=window.__perfQ;R3D.user=true;
    const M=window.__pm={on:false,f:[],part:{}};
    // n: שם של פונקציה גלובלית, או 'אובייקט.שדה' (VFX3D.render, R3D.r.render)
    const wrap=n=>{const ps=n.split('.'),k=ps.pop();let o=window;for(const q of ps)o=o&&(o[q]!==undefined?o[q]:eval(q));if(!o||typeof o[k]!=='function')return;const f=o[k];
      o[k]=function(){if(!M.on)return f.apply(this,arguments);const a=performance.now();try{return f.apply(this,arguments)}finally{M.part[n]=(M.part[n]||0)+performance.now()-a}}};
    ['update','worldUpdate','villageUpdate','render','render3d','hud','mutDraw','drawWorld','syncPlayer','syncWorld','syncEnemy','syncVillage','syncNpcs','syncWnpcs','syncPet','crowdAdd',
     'VFX3D.frame','VFX3D.render','R3D.r.render','R3D.r.shadowMap.render','R3D.scene.updateMatrixWorld'].forEach(wrap);
    R3D.r.info.autoReset=false;const fs0=frameStep;window.frameStep=function(now){const I=R3D.r.info.render;R3D.r.info.reset();const a=performance.now();try{return fs0.apply(this,arguments)}finally{if(M.on){M.f.push(performance.now()-a);M.calls=(M.calls||0)+I.calls;M.tris=(M.tris||0)+I.triangles}}};
    let lastRaf=0;M.gaps=[];const loop=t=>{if(M.on&&lastRaf)M.gaps.push(t-lastRaf);lastRaf=t;requestAnimationFrame(loop)};requestAnimationFrame(loop);
  });
  const out={cfg:{q:CFG.q,cpu:CFG.cpu,viewport:CFG.phone,secs:CFG.secs},load:{domMs:tDom,ready3dMs:tReady,ok3d,jsBytes:total,models3d:sizes['models3d.js']},scenes:{}};
  for(const [name,fn] of Object.entries(SCENES)){
    if(CFG.only&&!CFG.only.includes(name))continue;
    await page.evaluate(`(${fn})()`);
    // השחקן לא מת והולך במעגל, כדי שהמסך ישתנה
    await page.evaluate(()=>{window.__pt=0;clearInterval(window.__pi);window.__pi=setInterval(()=>{if(!P)return;P.hp=P.max=99999;window.__pt+=0.05;const a=window.__pt*0.6;joy={id:-1,ox:-999,oy:-999,dx:Math.cos(a),dy:Math.sin(a)}},50)});
    await page.waitForTimeout(CFG.warm*1000);
    await page.evaluate(()=>{const M=__pm;M.f=[];M.gaps=[];M.part={};M.calls=0;M.tris=0;M.on=true});
    if(CFG.prof)await cdp.send('Profiler.enable'),await cdp.send('Profiler.start');
    await page.waitForTimeout(CFG.secs*1000);
    if(CFG.prof){const {profile}=await cdp.send('Profiler.stop');const self={},byId={};for(const n of profile.nodes)byId[n.id]=n;
      const dt=profile.timeDeltas,smp=profile.samples;for(let i=0;i<smp.length;i++){const n=byId[smp[i]],cf=n.callFrame,k=(cf.functionName||'(anon)')+' '+path.basename(cf.url||'')+':'+(cf.lineNumber+1);self[k]=(self[k]||0)+(dt[i]||0)}
      console.log('  top self-time:',Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,14).map(([k,v])=>k+' '+(v/1000).toFixed(0)+'ms').join(' | '))}
    const r=await page.evaluate(()=>{const M=__pm;M.on=false;const f=M.f.slice().sort((a,b)=>a-b),n=f.length||1,g=M.gaps,gs=g.reduce((a,b)=>a+b,0);
      const avg=f.reduce((a,b)=>a+b,0)/n,part={};for(const k in M.part)part[k]=+(M.part[k]/n).toFixed(2);
      return{frames:f.length,msAvg:+avg.toFixed(2),ms50:+(f[Math.floor(n*0.5)]||0).toFixed(2),ms95:+(f[Math.floor(n*0.95)]||0).toFixed(2),
        fps:+(1000*g.length/Math.max(1,gs)).toFixed(1),part,calls:Math.round(M.calls/n),tris:Math.round(M.tris/n),
        enemies:enemies.filter(e=>!e.dead).length,sparks:typeof parts!=='undefined'&&parts.length!=null?parts.length:null,mode:S.mode,wd:!!S.wd}});
    out.scenes[name]=r;
    console.log(name.padEnd(9),'fps',String(r.fps).padStart(5),' ms/frame avg',String(r.msAvg).padStart(6),'p95',String(r.ms95).padStart(6),' calls',r.calls,' parts',JSON.stringify(r.part));
  }
  await page.evaluate(()=>clearInterval(window.__pi));
  console.log('load: dom',tDom,'ms, 3d ready',tReady,'ms, js',(total/1e6).toFixed(1),'MB, models3d',(sizes['models3d.js']/1e6).toFixed(1),'MB',ok3d?'':'(3D FAILED)');
  if(errors.length)console.log('errors:',errors.slice(0,5));
  out.errors=errors.slice(0,10);
  if(CFG.json)fs.writeFileSync(CFG.json,JSON.stringify(out,null,1));
  await browser.close();
})();
