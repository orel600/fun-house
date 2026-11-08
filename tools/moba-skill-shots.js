// צילומי הטלה של כל סקיל במשחקי השאול ברגע ההטלה (W2, אוראל 8.11.2026, js/moba-skill-anim.js). הבוט של check.js לא תופס את הרגע, אז כאן מטילים ומצלמים בכוונה.
// שימוש: node tools/moba-skill-shots.js . <תיקיית פלט> [--less]   (דורש playwright, כמו tools/check.js). לכל ערכה: תקיפה, s1, s2, ult, ובנוסף הלחשים.
// בסוף נבנים שלושה גרידים (jpg): grid-skills (ערכה בכל שורה: תקיפה, s1, s2), grid-ults (2 בשורה) ו-grid-spells. הצילומים ב-docs/refs/fx-moba-skill-anim*.jpg
// סקילי-על של השחקן רצים חצי שנייה בהילוך איטי (MBFX.slow), ולכן הזמן שלהם ארוך יותר
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
  await page.evaluate(l=>{SAVE.fxLess=l;mobaStart('tank');MB.waveT=1e9},less);
  // מחכים שהתמונות ייטענו (mbfxPreload טוען את כל הגיליונות של הסקילים)
  const ids=await page.evaluate(()=>Object.keys(MBFXSK).filter(k=>typeof MBFXSK[k]==='object').concat(mbAnimIds(),['sk_wave','sk_wave_crest','sk_pierce_ray','slash','shot_arrow','shot_orb','hit','hit_water','hit_earth']));
  for(let i=0;i<200;i++){const ok=await page.evaluate(ids=>ids.every(id=>fxImg(id)||FXLIB.bad[id]),ids);if(ok)break;await page.waitForTimeout(50);await page.clock.runFor(50)}
  const bad=await page.evaluate(ids=>ids.filter(id=>FXLIB.bad[id]),ids);
  // תרחיש קבוע: הגיבור שלי באמצע הנתיב, שלושה גיבורי אויב וארבעה חיילים קפואים מולו (הבוטים כבויים: mbBot ריק, בלי הודעות), החברים רחוק
  const setup=kit=>{
    mbBot=function(){};banner=function(){};document.getElementById('banner').hidden=true;MB.over=false;MB.zones.length=0;MB.shots.length=0;MB.walls.length=0;MB.fx.length=0;MB.floats.length=0;MB.spellZ=[];fxClear();S.shake=0;MB.fxs=null;
    MB.u=MB.u.filter(u=>u.k==='tower'||u.k==='base');
    const h=mbHero(kit,0,true,0);h.lvl=MOBA.ultAt;h.x=0;h.y=0;h.face=h.aim=0;MB.u.unshift(h);MB.me=h;mbSpellInit(h);
    for(const [k,i] of [['tank',0],['warrior',1],['mage',2]]){const e=mbHero(k,1,false,i);e.x=[120,95,105][i];e.y=[0,-70,70][i];e.hp=e.max=1e6;MB.u.push(e)}
    for(let i=0;i<4;i++)MB.u.push(mbUnit({k:'minion',team:1,type:'mb_m1',x:60+i*35,y:i%2?-38:38,lane:0,r:MOBA.minion.r,hp:1e6,max:1e6,pow:1,speed:0,face:Math.PI}));
    for(const k of ['warrior','hunter'])if(k!==kit){const a=mbHero(k,0,false,1);a.x=-900;a.y=0;MB.u.push(a)}
    P.x=h.x;P.y=h.y;S.cam.x=h.x;S.cam.y=h.y;P.weapon=MBKIT[kit].atk.shot?'gun':'sword';
    typeof mbVisNow==='function'&&mbVisNow(true);window.__h=h;window.__e=MB.u.find(u=>u.team===1&&u.k==='hero')};
  // מה לצלם ומתי (שניות אחרי ההטלה): סקיל עם השהיה מצולם כשהוא נוחת
  const when={atk:0.22,anvil:0.3,taunt:0.25,wall:0.3,cleave:0.22,spin:0.2,rage:0.35,pierce:0.18,net:0.3,rain:1.6,wave:0.3,bubble:0.6,blizzard:1.4,shadowstep:0.22,vanish:0.3,deathmark:0.35};
  const stats={};
  for(const kit of ['tank','warrior','hunter','mage','assassin']){
    for(const slot of ['atk','s1','s2','ult']){
      await page.evaluate(setup,kit);await page.clock.runFor(34);
      const id=slot==='atk'?'atk':MBKIT_ID(kit,slot);
      const ok=await page.evaluate(([slot])=>{const h=window.__h,e=window.__e;
        if(slot==='atk'){h.atkT=0;return mbAttack(h,0,e,MBKIT[h.kit].atk)}
        h.cd[slot]=0;return mbCast(h,slot,e)},[slot]);
      await page.clock.runFor(Math.round((when[id]||0.25)*1000));
      await page.evaluate(()=>{MB.floats.length=0;if(MB.fxs)MB.fxs.n.length=0});await page.clock.runFor(17);   // בלי מספרי הנזק: הם מכסים את האפקט בצילום (ועוד פריים, שהציור יתעדכן)
      stats[kit+'.'+id]={ok,n:await page.evaluate(()=>FXLIB.list.length),ids:await page.evaluate(()=>[...new Set(FXLIB.list.concat(MB.fxs&&MB.fxs.top||[],MB.fxs&&MB.fxs.under||[]).filter(f=>f.on).map(f=>f.id))])};
      await page.screenshot({path:path.join(out,kit+'-'+id+(less?'-less':'')+'.png')});
    }
  }
  // הלחשים והריפוי: הקוסמת מטילה כל אחד
  for(const id of Object.keys(MBSPELL_LIST).concat(['heal'])){
    await page.evaluate(setup,'mage');await page.clock.runFor(34);
    const ok=await page.evaluate(id=>{const h=window.__h,e=window.__e;if(id==='heal'){h.hp=h.max/2;h.cd.heal=0;return mbHealCast(h)}h.spell=id;h.cd.spell=0;return mbSpellCast(h,{x:e.x,y:e.y})},id);
    await page.clock.runFor(250);
    stats['spell.'+id]={ok,n:await page.evaluate(()=>FXLIB.list.length),ids:await page.evaluate(()=>[...new Set(FXLIB.list.filter(f=>f.on).map(f=>f.id))])};
    await page.screenshot({path:path.join(out,'spell-'+id+(less?'-less':'')+'.png')});
  }
  // גרידים: דף ריק עם התמונות (כ-data URL: דף setContent לא טוען file://), מצולם פעם אחת
  const sfx=less?'-less':'',grid=async(name,files,cols,w)=>{
    const html='<body style="margin:0;background:#111"><div style="display:grid;grid-template-columns:repeat('+cols+','+w+'px);gap:4px">'+files.map(f=>'<img src="data:image/png;base64,'+fs.readFileSync(path.join(out,f+sfx+'.png')).toString('base64')+'" style="width:'+w+'px;display:block">').join('')+'</div></body>';
    const g=await browser.newPage({viewport:{width:cols*(w+4),height:Math.ceil(files.length/cols)*(Math.round(w*390/844)+4)},deviceScaleFactor:1});
    await g.setContent(html);await g.waitForFunction(()=>[...document.images].every(i=>i.complete));
    await g.screenshot({path:path.join(out,name+sfx+'.jpg'),type:'jpeg',quality:82,fullPage:true});await g.close()};
  const kits=['tank','warrior','hunter','mage','assassin'];   // המתנקש (QUINN, 8.11: לא היה כאן, ARI מצא בסבב 0)
  await grid('grid-skills',kits.flatMap(k=>['atk','s1','s2'].map(sl=>k+'-'+(sl==='atk'?'atk':MBKIT_ID(k,sl)))),3,500);
  await grid('grid-ults',kits.map(k=>k+'-'+MBKIT_ID(k,'ult')),2,700);
  await grid('grid-spells',Object.keys(MBSPELL_LIST).concat(['heal']).map(id=>'spell-'+id),4,400);
  const st=await page.evaluate(()=>JSON.stringify(MBANIMS.stat));
  console.log(JSON.stringify({bad,stats,st,errors},null,1));
  await browser.close();
})();
// שמות הסקילים והלחשים, כדי לא להריץ קוד של המשחק ב-node
const MBKIT_ID=(kit,slot)=>({tank:{s1:'anvil',s2:'taunt',ult:'wall'},warrior:{s1:'cleave',s2:'spin',ult:'rage'},hunter:{s1:'pierce',s2:'net',ult:'rain'},mage:{s1:'wave',s2:'bubble',ult:'blizzard'},assassin:{s1:'shadowstep',s2:'vanish',ult:'deathmark'}})[kit][slot];
const MBSPELL_LIST={dash:1,haste:1,barrier:1,reveal:1,exhaust:1,cleanse:1};
