/* צילומים לפיילוט האפקטים (docs/plan-fx.md). לא חלק מהבדיקה.
   node tools/fxlab/shoot.js [--out dir] [--gfx 2d]
   לכל גרסה: צילום מלא, חיתוך מוגדל סביב הדמות, רצף פריימים ל-GIF, ומדידת זמן ציור */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const args=process.argv.slice(2),opt=k=>{const i=args.indexOf('--'+k);return i<0?null:args[i+1]};
const OUT=path.resolve(opt('out')||'/tmp/fxshots');fs.mkdirSync(OUT,{recursive:true});
const GFX=opt('gfx')||'3d';
const LAB=fs.readFileSync(path.join(__dirname,'fxlab.js'),'utf8');
const ONLY=opt('only');
const RUNS=[
  ['before',''],
  ['wisps-a','wisps:a,drops:1,msg:1'],
  ['wisps-b','wisps:b,drops:2,msg:2'],
  ['wisps-c','wisps:c,drops:1,msg:1'],
].filter(r=>!ONLY||ONLY.split(',').includes(r[0]));
const perf={};
(async()=>{
  const br=await chromium.launch();
  for(const [name,fx] of RUNS){
    const p=await br.newPage({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
    await p.addInitScript(()=>{let a=11;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}});
    await p.clock.install({time:new Date('2026-11-01T10:00:00').getTime()});
    await p.addInitScript(g=>{try{localStorage.setItem('zm-gfx',g)}catch(e){}},GFX);
    await p.goto('file://'+path.resolve(__dirname,'../..','index.html')+(fx?'?fx='+fx:''));
    await p.clock.runFor(500);
    if(fx)await p.addScriptTag({content:LAB});
    const run=ms=>p.clock.runFor(ms);
    await p.evaluate(()=>{SAVE.hero.start='warrior';SAVE.gift=true;SAVE.story=SAVE.story||{};SAVE.story.intro=true;saveNow()});
    await p.tap('#startBtn').catch(()=>p.evaluate(()=>document.getElementById('startBtn').click()));await run(1200);
    await p.evaluate(()=>{for(const id of ['ovDaily','ovHero'])try{const e=document.getElementById(id);if(e)e.hidden=true}catch(e){}
      villageUi(false);enterWorld('home')});
    await run(800);
    await p.evaluate(()=>{document.querySelectorAll('[id^=ov],.win').forEach(e=>{if(e.id!=='ovHud')e.hidden=true});try{dailyClose&&dailyClose()}catch(e){}});
    await run(300);
    // הסצנה: חמשת החפצים, בלי אויבים, שלל מכל הדרגות סביב
    await p.evaluate(()=>{window.orbitTypes=()=>['attack','control','defense','support','luck'];
      enemies.length=0;WORLD.max=0;const x=P.x,y=P.y;S.cam.x=x;S.cam.y=y;
      const put=(r,n,dx,dy)=>{const d=dropSpawn(r,n,x+dx,y+dy);d.x=x+dx;d.y=y+dy;d.vx=d.vy=0;d.z=0;d.vz=0;d.fly=false;d.t=1;d.ok=true};
      put('wood',5,-150,40);put('stone',3,-110,-30);put('copper',2,130,30);put('gem',1,165,-20);put('oakSword',1,-60,85);put('coins',12,70,95);
      P.magnet=0.01;P.hp=P.maxHp=1e6});
    await run(2500);
    // רגע של איסוף: הודעות
    await p.evaluate(()=>{floatText(P.x,P.y-40,'+3 '+resIcon('wood'),C.gold,16);floatText(P.x,P.y-40,'+2 '+resIcon('stone'),C.gold,16);
      banner(T('loot.gear')+' '+gIcon('oakSword')+' '+gName('oakSword'),dropTier('oakSword').col);floatText(P.x,P.y-40,gIcon('oakSword')+' '+gName('oakSword'),dropTier('oakSword').col,16)});
    await run(250);
    await p.screenshot({path:path.join(OUT,name+'-full.png')});
    const cx=422,cy=195;
    await p.screenshot({path:path.join(OUT,name+'-zoom.png'),clip:{x:cx-150,y:cy-95,width:300,height:170}});
    // תנועה: הדמות הולכת במעגל, 40 פריימים בקצב 25 לשנייה
    const dir=path.join(OUT,name+'-frames');fs.mkdirSync(dir,{recursive:true});
    for(let i=0;i<40;i++){
      await p.evaluate(i=>{const a=i*0.09;joy={id:-1,ox:-999,oy:-999,dx:Math.cos(a)*0.7,dy:Math.sin(a)*0.7};S.cam.x=P.x;S.cam.y=P.y},i);
      await run(40);
      await p.screenshot({path:path.join(dir,String(i).padStart(3,'0')+'.png'),clip:{x:cx-130,y:cy-85,width:260,height:150}});
    }
    // ביצועים: זמן הציור של החפצים והשלל לפריים, אחרי חימום
    perf[name]=await p.evaluate(async()=>{const T={o:0,d:0,f:0,r:0,n:0};
      const w=(k,fn)=>{const f=window[fn];window[fn]=function(){const s=performance.now();try{return f.apply(this,arguments)}finally{T[k]+=performance.now()-s}}};
      w('o','drawOrbits');w('d','drawDrops');w('f','drawFx');w('r','render');
      // render קורא ל-drawOrbits בשם גלובלי, אז העטיפה נתפסת
      for(let i=0;i<120;i++){render();T.n++}
      const k=v=>+(v/T.n).toFixed(3);return{orbits_ms:k(T.o),drops_ms:k(T.d),fx_ms:k(T.f),render_ms:k(T.r),frames:T.n}});
    perf[name].errors=errs.slice(0,3);
    console.log(name,JSON.stringify(perf[name]));
    await p.close();
  }
  fs.writeFileSync(path.join(OUT,'perf-'+GFX+'.json'),JSON.stringify(perf,null,1));
  await br.close();
})();
