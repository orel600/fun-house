/* בדיקה אוטומטית: פותח את המשחק בדפדפן ללא ממשק ברוחב טלפון, ובסוף דוח.
   הבוט בוחר דמות התחלה, מתחיל בכפר (מקבל קווסט, בונה, אוסף תוצרת, יוצא בשער), משחק בזירה עד אחרי הבוס, חוזר לכפר עם השלל ולוקח את פרס הקווסט.
   הרצה: node tools/check.js
   אפשרויות: --time 150   כמה שניות משחק לשחק
             --seed 7     אותו מספר = אותה ריצה בדיוק, כדי לשחזר באג או להשוות לפני ואחרי שינוי
             --real       בלי חסינות: הבוט יכול למות, כדי לבדוק קושי ולא רק קריסות
             --shots      צילומי מסך לתיקייה tools/shots
             --skin nomad הדמות לובשת סקין מ-SKINS, כדי לראות עיצוב חדש בצילומים
             --lang en    משחק באנגלית, ונכשל אם על המסך מופיע טקסט בעברית
             --gfx 2d     משחק בדו-ממד. ברירת המחדל: תלת-ממד, ונכשל אם הוא לא עלה
   הזמן במשחק מואץ בשעון מזויף, אז דקה וחצי של משחק לוקחות כמה שניות. */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');

const args=process.argv.slice(2);
const opt=k=>{const i=args.indexOf('--'+k);if(i<0)return null;const v=args[i+1];return v&&!v.startsWith('--')?v:true};
const CFG={
  time:+(opt('time')||150),
  seed:+(opt('seed')||Math.floor(Math.random()*1e6)),
  god:!opt('real'),
  shots:opt('shots')?path.join(__dirname,'shots'):null,
  skin:opt('skin'),
  lang:opt('lang')||'he',
  gfx:opt('gfx')==='2d'?'2d':'3d',
  step:200,                          // כל כמה מילישניות של משחק הבוט מחליט מחדש
  phone:{width:844,height:390}       // טלפון לרוחב: ככה משחקים (ניר, 30.10.2026)
};

/* הבוט רץ בתוך הדף, עם גישה למשתנים הגלובליים של המשחק. הזיכרון שלו ב-window.__bot */
function botStep({god,en}){
  const m=window.__bot||(window.__bot={log:{levels:0,swaps:0,taken:0,coins:0},faced:0,swapAt:0});
  const L=m.log,at=Math.round(S.t*10)/10,vis=id=>!document.getElementById(id).hidden;
  // באנגלית: כל טקסט שמופיע על המסך (ממשק, באנר, מסכים, טקסט צף) נבדק לפני שהבוט לוחץ
  if(en&&!L.heLeak){const he=/[֐-׿]/;
    for(const s of [document.querySelector('.hud').innerText,document.getElementById('banner').textContent,document.getElementById('swaplbl').textContent,
      ...['ovHero','ovLevel','ovBoss','ovOver','vhud','vPanel','ovGear'].filter(vis).map(id=>document.getElementById(id).innerText),...floats.map(f=>f.txt)])
      if(he.test(s)){L.heLeak=s.trim().slice(0,80);break}}
  // משחק ראשון: בוחרים לוחם, ובודקים שהחרב שלו נלבשה ושהבחירה נשמרה
  if(vis('ovHero')){L.heroCards=document.querySelectorAll('#heroCards [data-hero]').length;document.querySelector('#heroCards [data-hero="warrior"]').click();
    const sv=JSON.parse(localStorage.getItem(SAVE_STORE.key));L.heroStart=sv.hero.start;L.heroW=SAVE.gear.weapon;L.heroVil=!!S.vil&&document.getElementById('ovHero').hidden;return L}
  if(vis('ovLevel')){document.querySelector('#cards .card').click();L.levels++;return L}
  if(vis('ovBoss')){L.bossIntro??=at;document.getElementById('fightBtn').click();return L}
  // סוף ריצה: רושמים איך נגמרה ומה השלל, וחוזרים לכפר
  if(S.mode==='over'){
    if(S.won)L.won??=at;else L.died??=at;
    L.gearLoot??=(S.gearLoot||[]).join(', ');
    if(vis('ovOver')&&!m.home){   // צעד אחד מסתכלים על המסך (וצילום), ובצעד הבא חוזרים
      if(L.lootTxt==null)L.lootTxt=document.getElementById('sLoot').innerText.replace(/\s+/g,' ').trim();
      else{m.home=1;document.getElementById('againBtn').click()}}
    return L}
  if(S.mode!=='play'&&S.mode!=='gear'&&S.mode!=='forge')return L;   // gear, forge: מסך הציוד או הנפחייה פתוח בכפר
  if(S.vil)return villageBot(m,L);
  // הריצה הראשונה אחרי שלבשנו קשת בכפר: מתחילים איתה, והנזק שלה גדל
  if(L.gearW==null){L.gearW=P.weapon;L.gearDmg=Math.round(P.gn.dmg/m.gdmg0*100)/100;L.heroHp=P.maxHp-100-(gearStats().hp||0)}   // 100: החיים ההתחלתיים ב-reset
  // באמצע הריצה: פותחים את הציוד מהכפתור בזירה, בודקים שהמשחק עוצר, לובשים קמע ורואים שהחיים עלו מיד
  if(S.mode==='gear'||(!m.runGear&&S.t>5&&!S.room&&!S.boss&&S.mode==='play')){
    if(!m.runGear){m.runGear=1;m.rt=S.t;m.hp0=P.maxHp;document.getElementById('gearBtnRun').click();L.rgOpen=S.mode==='gear'&&!document.getElementById('ovGear').hidden;return L}
    if(m.runGear===1){L.rgPaused=S.t===m.rt;const it=document.querySelector('#gItems [data-id="boneCharm"]');
      if(it){it.click();document.querySelector('#gDetail [data-act="equip"]').click()}
      L.rgHp=P.maxHp-m.hp0;L.rgSaved=JSON.parse(localStorage.getItem(SAVE_STORE.key)).gear.acc.includes('boneCharm');
      document.getElementById('gearClose').click();L.rgClosed=S.mode==='play';m.runGear=2;return L}
  }
  if(god)P.hp=P.maxHp;
  if(R3D.on){L.actorsMax=Math.max(L.actorsMax||0,R3D.stats.actors||0);L.callsMax=Math.max(L.callsMax||0,R3D.stats.calls||0)}
  L.taken=S.bn.taken;L.coins=S.bn.coins;L.t=at;L.level=P.level;
  const qa=SAVE.quests.active[m.qid];if(qa){L.qProg=qa.p[0];if(qa.r)L.qReadyAt??=at}
  if(!document.getElementById('qTrack').hidden)L.qTrack??=document.getElementById('qTrack').textContent;
  L.hpTxt=document.getElementById('hpTxt').textContent;L.xpTxt=document.getElementById('xpTxt').textContent;
  for(const f of floats)if(/^\+\d/.test(f.txt))L.gainMax=Math.max(L.gainMax||0,+f.txt.slice(1));
  const useWeapon=w=>{if(P.weapon!==w){swapWeapon();L.swaps++;m.swapAt=S.t}};
  let tx=null,ty=null,flee=false,stop=0;
  if(S.room){
    L.room??=at;L.saws??=S.room.saws.length;
    const c=S.room.coins.reduce((b,c)=>!b||Math.hypot(c.x-P.x,c.y-P.y)<Math.hypot(b.x-P.x,b.y-P.y)?c:b,null);
    if(c){tx=c.x;ty=c.y}
  }else{
    if(L.room!=null&&L.roomBack==null)L.roomBack=at;
    for(const k of S.bn.picks)L['pick_'+k.type]??=at;
    if(S.bossCount>0)L.bossDown??=at;
    const w=S.wn;
    if(w.rumor)L.wRumor??=at;
    if(w.e)L.wanted??=at;else if(L.wanted!=null)L.wEnd??=at;
    L.wCaught=w.caught;L.wEscaped=w.escaped;L.wLoot=w.got.join(', ');
    const b=S.boss;
    if(b){
      L.boss??=at;L.bossName=b.name;L.rageMax=Math.max(L.rageMax||0,b.rage);
      // קודם בורחים כדי לבדוק שהבוס מתעצבן, ואז מתעמתים ובודקים שהוא נרגע.
      // כמו שחקן אמיתי: מנקים את המגינים שהוא מזמן עם הנשק הנכון להם, ואת הבוס עם הנשק שהוא חלש אליו
      if(!m.faced&&b.rage<0.99){tx=b.x;ty=b.y;flee=true}
      else{
        if(!m.faced)m.faced=S.t;L.rageLow=Math.min(L.rageLow??1,b.rage);
        const n=nearest(130);useWeapon(n&&!n.isBoss?(n.mult.sword>=n.mult.gun?'sword':'gun'):b.weak);
        tx=b.x;ty=b.y;stop=P.weapon==='sword'?b.r+30:240;
      }
    }else if(S.bn.door){L.door??=at;tx=S.bn.door.x;ty=S.bn.door.y}
    else if(w.e){tx=w.e.x;ty=w.e.y}
    else if(S.bn.picks.length){const k=S.bn.picks[0];tx=k.x;ty=k.y}
    else{
      const n=nearest(220);
      if(n){tx=n.x;ty=n.y;flee=true}
      if(document.getElementById('swap').classList.contains('hint')||S.t-m.swapAt>10){swapWeapon();L.swaps++;m.swapAt=S.t}
    }
  }
  return steer(tx,ty,flee,stop,L);
}
// מזיז את השחקן לכיוון (tx,ty), או הרחק ממנו (flee), עד מרחק stop. בלי יעד: הולך במעגל
function steer(tx,ty,flee,stop,L){
  let dx=0,dy=0;
  if(tx!=null){const d=Math.hypot(tx-P.x,ty-P.y)||1;if(flee||d>stop){dx=(tx-P.x)/d;dy=(ty-P.y)/d;if(flee){dx=-dx;dy=-dy}}}
  else{const a=S.t*0.6;dx=Math.cos(a);dy=Math.sin(a)}
  joy={id:-1,ox:-999,oy:-999,dx,dy};
  return L;
}
/* בכפר: מקבלים קווסט מהיומן, בונים מנסרה, מדמים שעתיים בלי לשחק ואוספים את העץ, ויוצאים בשער.
   כשחוזרים מהזירה בודקים שהשלל הגיע, ולוקחים את פרס הקווסט */
function villageBot(m,L){
  const bag=()=>Object.assign({},SAVE.bag),B=VILLAGE.b.mill,g=VILLAGE.gate,saved=()=>JSON.parse(localStorage.getItem(SAVE_STORE.key));
  const qBtn=act=>document.querySelector('#qLog [data-q="'+m.qid+'"][data-act="'+act+'"]');
  if(m.home){   // חזרנו מהזירה
    if(L.back==null){L.back=S.t;const now=bag(),got=[];for(const r in now){const d=now[r]-(m.runBag[r]||0);if(d>0)got.push(r+' +'+d)}
      L.lootGot=got.join(', ');L.lootSaved=JSON.stringify(saved().bag)===JSON.stringify(SAVE.bag)
      const st=JSON.parse(localStorage.getItem(SAVE_STORE.key)).hero.style;L.style={};for(const k in st)L.style[k]=Math.round(st[k])}   // סגנון המשחק, כפי שנשמר
    else if(L.qClaimed==null){   // פותחים את היומן ולוקחים את הפרס: הוא צריך להגיע לתרמיל ולשמירה
      document.getElementById('qBtn').click();const btn=qBtn('claim'),rw=QUESTS.list.find(q=>q.id===m.qid).reward,before=bag(),xp=SAVE.hero.xp;
      if(btn)btn.click();
      L.qClaimed=!!btn&&!SAVE.quests.active[m.qid]&&SAVE.quests.done[m.qid]===1;
      L.qPaid=Object.keys(rw).every(k=>k==='xp'?SAVE.hero.xp-xp===rw.xp:(SAVE.bag[k]||0)-(before[k]||0)===rw[k]);
      L.qReward=JSON.stringify(rw);L.qFx=FX.some(f=>f.K===CELEBRATE.quest);
      const sv=saved();L.qSaved=sv.quests.done[m.qid]===1&&!sv.quests.active[m.qid]&&JSON.stringify(sv.bag)===JSON.stringify(SAVE.bag)}
    return steer(null,null,false,0,L)}
  if(!m.vil){m.vil=1;L.vilOpen=!!S.vil;L.gift=JSON.stringify(SAVE.bag);L.vilModels=R3D.on?(R3D.vil?R3D.vil.g.children.length:0):null}
  if(!m.qid){   // יומן הקווסטים: מקבלים את הקווסט הראשון שמבקש להפיל אויבים. היומן נשאר פתוח לצעד אחד, לצילום
    m.qid=(QUESTS.list.find(q=>q.kind==='village'&&q.obj[0].type==='kill'&&qOpen(q))||{}).id;
    document.getElementById('qBtn').click();L.qLogTxt=document.querySelector('#qLog h3').textContent;
    const btn=qBtn('accept');if(btn)btn.click();
    L.qAccepted=!!SAVE.quests.active[m.qid]&&!!saved().quests.active[m.qid];L.qName=m.qid;L.qDaily=SAVE.quests.daily.length;
    return steer(null,null,false,0,L)}
  if(!document.getElementById('qLog').hidden){document.querySelector('#qLog [data-act="close"]').click();return steer(null,null,false,0,L)}
  if(vLv('mill')===0){   // הולכים למנסרה ובונים אותה
    if(S.vil.near==='mill'){const before=bag(),btn=document.querySelector('#vPanel [data-act="up"]');L.panel=document.getElementById('vPanel').innerText.split('\n')[0];
      if(btn&&!btn.disabled){btn.click();L.built=vLv('mill');L.fx=FX.length>0&&vLook('mill')===null;L.paid=Object.keys(before).filter(r=>(SAVE.bag[r]||0)<before[r]).map(r=>r+' -'+(before[r]-(SAVE.bag[r]||0))).join(', ');
        L.builtSaved=JSON.parse(localStorage.getItem(SAVE_STORE.key)).village.mill===1}else L.built=0}
    return steer(B.x,B.y,false,0,L)}
  if(!m.away){   // כאילו השחקן לא שיחק שעתיים: התוצרת מצטברת עד המחסן
    m.away=1;m.wood=SAVE.bag.wood||0;vProd('mill').t-=2*3600e3;L.expect=Math.min(B.cap[1],B.make.wood[1]*2);return steer(B.x,B.y,false,0,L)}
  if(L.collected==null){L.collected=(SAVE.bag.wood||0)-m.wood;return steer(B.x,B.y,false,0,L)}
  if(m.gear!==2){   // מסך הציוד: פותחים, בוחרים את קשת העץ מהתרמיל, משווים ולובשים
    const d=()=>document.getElementById('gDetail').innerText.replace(/\s+/g,' ').trim();
    if(!m.gear){m.gear=1;m.gdmg0=P.gn.dmg;document.getElementById('gearBtn').click();L.gearOpen=S.mode==='gear'&&!document.getElementById('ovGear').hidden;return L}
    const it=document.querySelector('#gItems [data-id="oakBow"]');
    // חגיגה רק כשזה שיפור. הלוחם כבר מחזיק חרב עץ, וקשת עץ שווה לה, אז כאן לא אמורה להיות חגיגה
    if(it){L.gearBetter=gScore('oakBow')>gScore(SAVE.gear.weapon);it.click();L.gearCmp=d();document.querySelector('#gDetail [data-act="equip"]').click()}
    const sv=JSON.parse(localStorage.getItem(SAVE_STORE.key));
    L.gearEquip=SAVE.gear.weapon;L.gearFx=FX.some(f=>f.K===CELEBRATE.gear)&&!!document.querySelector('#gSlots .pop');L.gearSaved=sv.gear.weapon==='oakBow'&&!sv.bag.oakBow;
    document.getElementById('gearClose').click();L.gearClosed=S.mode==='play'&&document.getElementById('ovGear').hidden;m.gear=2;return L}
  if(m.age!==5){   // נפחייה: Aging על קשת העץ שלבושה. הצלחה מעלה רמה וסטטים, כישלון מוריד רמה, ואבן חן מגינה
    const F=VILLAGE.b.forge,q=s=>document.querySelector(s);
    if(!m.age){m.age=1;SAVE.village.forge=Math.max(1,vLv('forge'));bagAdd('coins',100);bagAdd('stone',40);bagAdd('gem',1);return steer(F.x,F.y,false,0,L)}
    if(m.age===1){
      const fb=q('#vPanel [data-act="forge"]');if(S.vil.near!=='forge'||!fb)return steer(F.x,F.y,false,0,L);
      fb.click();L.ageOpen=S.mode==='forge'&&!q('#ovForge').hidden;
      // מכריחים את ההגרלה: 0 תמיד מצליח, 0.9999 נכשל (הסיכוי ל-+2 הוא 95%)
      const A=L.age={},w=()=>SAVE.gear.weapon,dmg=()=>gearStats().gdmg||0,fx=K=>FX.some(f=>f.K===K);
      const press=roll=>{const r=Math.random;Math.random=()=>roll;try{q('#fDetail [data-act="age"]').click()}finally{Math.random=r}};
      q('#fItems [data-slot="weapon"]').click();A.odds=(q('#fDetail .odds')||{}).innerText;
      const d0=dmg();press(0);A.dmg=d0+'→'+dmg();A.up=w()==='oakBow+1'&&dmg()>d0&&fx(CELEBRATE.aging);
      A.name=q('#fDetail h3').innerText;FX.length=0;
      press(0.9999);A.down=w()==='oakBow'&&dmg()===d0&&SAVE.agePity===1&&fx(CELEBRATE.agingFail);
      press(0);A.pity=SAVE.agePity===0;
      q('#fDetail [data-act="gem"]').click();press(0.9999);A.gem=w()==='oakBow+1'&&!bagHas('gem');
      A.saved=JSON.parse(localStorage.getItem(SAVE_STORE.key)).gear.weapon==='oakBow+1';
      if(LANG==='en'&&/[֐-׿]/.test(q('#ovForge').innerText))L.heLeak=q('#ovForge').innerText.trim().slice(0,80);
      m.age=2;return L}   // המסך נשאר פתוח לצעד אחד, בשביל הצילום
    if(m.age===2){q('#forgeClose').click();L.ageClosed=S.mode==='play';m.age=3;return L}
    // הזוהר: לרגע הקשת היא +10, ובודקים שיש שובל וחלקיקים על הנשק
    if(m.age===3){m.age=4;SAVE.gear.weapon='oakBow+10';P.weapon='gun';L.glowOn=1;return L}
    L.glow={trail:AGE_FX.trail.length,parts:AGE_FX.parts.length,hand:!!AGE_FX.hand};SAVE.gear.weapon='oakBow+1';m.age=5;return L}
  if(!m.stash){   // המחסן: בונים, מכניסים את חרב העץ ועץ, ומחזירים את החרב לתרמיל
    const St=VILLAGE.b.stash;
    if(S.vil.near!=='stash')return steer(St.x,St.y,false,0,L);
    m.stash=1;const q=s=>document.querySelector('#vPanel '+s),up=q('[data-act="up"]');
    if(up&&!up.disabled)up.click();L.stashLv=vLv('stash');
    const w0=SAVE.bag.wood||0,mv=(d,r)=>{const b=q('[data-act="stash"][data-dir="'+d+'"][data-r="'+r+'"]');if(b)b.click();return!!b};
    const s0=SAVE.bag.oakSword||0;   // כמה חרבות עץ בתרמיל: הלוחם מקבל אחת בבחירה ועוד אחת במתנה
    const swIn=mv('in','oakSword')&&SAVE.stash.oakSword===1&&(SAVE.bag.oakSword||0)===s0-1;   // פריט עובר אחד-אחד
    const wIn=mv('in','wood')&&SAVE.stash.wood===w0&&!SAVE.bag.wood;
    const swOut=mv('out','oakSword')&&SAVE.bag.oakSword===s0&&!SAVE.stash.oakSword;
    const sv=JSON.parse(localStorage.getItem(SAVE_STORE.key));
    L.stash={swIn,wIn,swOut,saved:sv.stash.wood===w0&&!sv.stash.oakSword&&sv.bag.oakSword===s0,cap:stashCap(),used:stashUsed()};
    return L}
  m.runBag=bag();L.gateAt=1;   // לשער
  return steer(g.x,g.y,false,0,L);
}

(async()=>{
  // תלת-ממד בלי כרטיס גרפי: WebGL רץ על המעבד (SwiftShader). איטי, אבל מספיק כדי לבדוק שהכל עולה ומצויר
  const browser=await chromium.launch({...(process.env.PW_CHANNEL?{channel:process.env.PW_CHANNEL}:{}),args:CFG.gfx==='3d'?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});   // רק בתלת-ממד: הדגל הזה מאט גם את הציור הרגיל  // ב-GitHub: ה-Chrome שכבר מותקן שם, בלי להוריד דפדפן
  const page=await browser.newPage({viewport:CFG.phone,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  // הפונטים מגוגל לא נטענים בבדיקה, כדי שהיא תרוץ זהה גם בלי רשת
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(seed=>{let a=seed>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}},CFG.seed);
  await page.clock.install({time:0});
  await page.clock.pauseAt(1000);
  await page.addInitScript(g=>{try{localStorage.setItem('zm-gfx',g)}catch(e){}},CFG.gfx);
  await page.goto('file://'+path.resolve(__dirname,'..','index.html'));
  await page.clock.runFor(300);
  // הדמויות בתלת-ממד נטענות ברקע. מחכים להן לפני שמתחילים
  await page.evaluate(()=>{R3D.drawEvery=60});   // בבדיקה מציירים תלת-ממד פעם ב-60 פריימים, אחרת היא לוקחת שעה
  let g3={};for(let i=0;i<200;i++){g3=await page.evaluate(()=>({ready:R3D.ready,failed:R3D.failed,on:R3D.on}));if(g3.ready||g3.failed||CFG.gfx==='2d')break;await page.waitForTimeout(50);await page.clock.runFor(50)}

  const results=[];
  const check=(ok,txt)=>results.push((ok?'✓ ':'✗ ')+txt);
  let shotN=0;
  const shot=async name=>{if(!CFG.shots)return;fs.mkdirSync(CFG.shots,{recursive:true});
    await page.evaluate(()=>{R3D.drawEvery=0});await page.clock.runFor(34);await page.evaluate(()=>{R3D.drawEvery=60});
    await page.screenshot({path:path.join(CFG.shots,String(++shotN).padStart(2,'0')+'-'+name+'.png')})};

  const open=await page.$$eval('.ov',els=>els.filter(e=>getComputedStyle(e).display!=='none').map(e=>e.id));
  check(open.length===1&&open[0]==='ovStart','מסך פתיחה: רק הוא גלוי'+(open.length===1?'':' (גלויים: '+open.join(', ')+')'));
  await shot('start');
  // שמירה: נכתבת, נטענת חזרה, ושמירה ישנה בלי שדה חדש מקבלת אותו. בסוף מנקים, כדי שהריצה תתחיל נקייה
  const sv=await page.evaluate(()=>{bagAdd('wood',5);bagAdd('wood',2);const took=bagTake('wood',3)&&!bagTake('wood',99);SAVE.village.forge=2;saveNow();
    SAVE=saveBlank();saveLoad();const back=SAVE.bag.wood===4&&SAVE.village.forge===2&&took;
    localStorage.setItem(SAVE_STORE.key,JSON.stringify({v:0,bag:{bone:1}}));saveLoad();const old=SAVE.bag.bone===1&&SAVE.village.center===1&&Array.isArray(SAVE.gear.orbit);
    localStorage.removeItem(SAVE_STORE.key);saveLoad();return{back,old}});
  check(sv.back&&sv.old,'שמירה: '+(sv.back?'נשמרת ונטענת':'לא חזרה אחרי טעינה')+', '+(sv.old?'שמירה ישנה משלימה שדות חדשים':'שמירה ישנה נשברה'));
  // שוק: מוכרים עץ, לא מצליחים לקנות בלי מספיק מטבעות, ואז קונים אבן. בסוף מנקים
  const mk=await page.evaluate(()=>{SAVE.village.market=1;bagAdd('wood',10);const sell=vTrade('sell','wood')&&SAVE.bag.coins===5&&SAVE.bag.wood===5;
    const poor=!vTrade('buy','stone');bagAdd('coins',20);const buy=vTrade('buy','stone')&&SAVE.bag.stone===5&&SAVE.bag.coins===10;
    localStorage.removeItem(SAVE_STORE.key);saveLoad();return{sell,poor,buy}});
  check(mk.sell&&mk.poor&&mk.buy,'שוק: '+(mk.sell?'מכירה עובדת':'מכירה נכשלה')+', '+(mk.poor?'בלי מטבעות אי אפשר לקנות':'קנה בלי כסף')+', '+(mk.buy?'קנייה עובדת':'קנייה נכשלה'));
  // קווסטים: 4 יומיים ויום חדש מחליף אותם, הישגים פעילים לבד, ניצחון בלי פגיעה ושדרוג מבנה נספרים נכון. בסוף מנקים
  const qe=await page.evaluate(()=>{const Q=SAVE.quests,by=id=>QUESTS.list.find(q=>q.id===id);questsRefresh();
    const daily=Q.daily.length===QUESTS.daily&&Q.daily.every(id=>Q.active[id]);
    const ach=QUESTS.list.filter(q=>q.kind==='achievement').every(q=>Q.active[q.id]);
    const old=Q.daily.slice();for(const id of old)Q.active[id].p[0]=1;Q.day='1999-1-1';questsRefresh();
    const day=Q.daily.length===QUESTS.daily&&Q.daily.every(id=>Q.active[id]&&Q.active[id].p.every(v=>v===0))&&old.filter(id=>!Q.daily.includes(id)).every(id=>!Q.active[id]);
    S.boss={};questEvent('hurt');S.boss=null;questEvent('win');const hit=!qReady(by('aClean'));S.q.bossHit=0;questEvent('win');const clean=qReady(by('aClean'));
    qStart(by('firstMill'));SAVE.village.mill=1;questEvent('upgrade','mill');const up=qReady(by('firstMill'));
    localStorage.removeItem(SAVE_STORE.key);saveLoad();S.q=null;$('qTrack').hidden=true;$('qTrack').textContent='';   // קו המעקב נכתב כאן בעברית, לפני שהבדיקה באנגלית מחליפה שפה
    return{daily,ach,day,noHit:hit&&clean,up}});
  check(qe.daily&&qe.ach&&qe.day&&qe.noHit&&qe.up,'מנוע קווסטים: '+(qe.daily?'4 יומיים':'יומיים לא נבחרו')+', '+(qe.day?'מתחלפים ביום חדש':'לא מתחלפים ביום חדש')+', '+
    (qe.ach?'הישגים פעילים':'הישגים לא פעילים')+', '+(qe.noHit?'ניצחון בלי פגיעה נבדק':'ניצחון בלי פגיעה שבור')+', '+(qe.up?'שדרוג מבנה נספר':'שדרוג מבנה לא נספר'));
  if(CFG.skin)await page.evaluate(n=>{LOOK.player=n},CFG.skin);
  let startLeak=null;
  // הבדיקות שלמעלה רצו בעברית, ויכלו להשאיר באנר בעברית (קווסט שהושלם). בלי זה מסך בחירת הדמות מציג אותו באנגלית
  await page.evaluate(()=>{document.getElementById('banner').textContent=''});
  if(CFG.lang!=='he'){
    await page.click('[data-lang="'+CFG.lang+'"]');
    startLeak=await page.evaluate(()=>{const s=document.getElementById('ovStart').innerText.replace('עברית','');return /[֐-׿]/.test(s)||document.documentElement.dir!=='ltr'?s.slice(0,80):null});
    await shot('start-'+CFG.lang);
  }
  const rgHp=await page.evaluate(()=>GEAR.items.boneCharm.stats.hp);   // כמה חיים הקמע מוסיף באמצע ריצה
  // כמה קשת העץ אמורה להוסיף, לפי GEAR. בנפחייה היא עולה ל-+1 (AGING.scale)
  const gx=await page.evaluate(()=>Math.round((1+GEAR.items.oakBow.stats.gdmg*(1+AGING.scale)/100)*100)/100);
  await page.click('#startBtn');

  await page.addScriptTag({content:steer+'\n'+villageBot});   // עוזרים של הבוט, בתוך הדף
  let L={},took={},guard=0;
  while(guard++<CFG.time*30){
    await page.clock.runFor(CFG.step);
    L=await page.evaluate(botStep,{god:CFG.god,en:CFG.lang==='en'});
    for(const k of ['vilOpen','qAccepted','built','collected','gearOpen','ageOpen','glowOn','stash','rgOpen','door','room','wanted','boss','bossDown','lootTxt','back','qClaimed'])if(L[k]!=null&&!took[k]){took[k]=1;await shot(k==='vilOpen'?'village':k==='lootTxt'?'loot':k==='qAccepted'?'quests':k)}
    if(L.qClaimed!=null||L.t>=CFG.time)break;   // חזרנו לכפר ולקחנו את פרס הקווסט: אין עוד מה לבדוק
  }
  await shot('end');
  // צלילים: כמה פעמים כל צליל התבקש, אם הקבצים נטענו מ-file://, ואם כפתור ההשתקה עובד ונשמר
  const au=await page.evaluate(()=>{const b=document.getElementById('muteBtn');b.click();const m=AUDIO.muted&&localStorage.getItem('zm-mute')==='1';b.click();
    return{count:AUDIO.count,errors:AUDIO.errors,unlocked:AUDIO.unlocked,ids:Object.keys(SOUNDS),mute:m&&!AUDIO.muted,
      loaded:Object.values(AUDIO.pool).filter(p=>p.every(a=>a.readyState>=1)).length}});
  // בפעם השנייה מסך הפתיחה מוביל ישר לכפר, בלי בחירת דמות
  const again=await page.evaluate(()=>{document.getElementById('startBtn').click();return document.getElementById('ovHero').hidden&&!!S.vil});
  const heroHp=await page.evaluate(()=>HEROES.list.warrior.passive.hp);
  await browser.close();

  const t=s=>s==null?'-':Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
  check(L.heroCards===3&&L.heroStart==='warrior'&&L.heroW==='oakSword'&&L.heroVil,'דמות התחלה: '+(L.heroCards||0)+' כרטיסים, '+(L.heroStart==='warrior'?'נבחר לוחם ונשמר':'הבחירה לא נשמרה')+
    ', נשק: '+(L.heroW||'-')+(L.heroVil?', ומשם לכפר':', לא נכנס לכפר'));
  check(L.heroHp===heroHp,'פסיבית בריצה: הלוחם קיבל +'+L.heroHp+' חיים (צפוי +'+heroHp+')');
  check(again,'בחירת דמות: '+(again?'לא חוזרת במשחק השני':'הופיעה שוב'));
  const sty=L.style||{};
  check(sty.t_run>0&&sty.kills>0&&(sty.dmg_sword||0)+(sty.dmg_gun||0)>0,'סגנון משחק: '+(Object.keys(sty).map(k=>k+' '+sty[k]).join(', ')||'לא נספר'));
  check(L.vilOpen&&L.gift&&L.gift!=='{}'&&(L.vilModels==null||L.vilModels>0),'כפר: נפתח אחרי מסך הפתיחה, מתנת פתיחה '+L.gift+(L.vilModels!=null?', '+L.vilModels+' מודלים בתלת-ממד':''));
  check(L.built===1&&L.builtSaved&&L.fx,'בנייה: '+(L.panel||'הפאנל לא נפתח')+', '+(L.built===1?'נבנתה, שולם '+L.paid:'לא נבנתה')+(L.builtSaved?', נשמר':', לא נשמר')+(L.fx?', חגיגה עם פיגום':', בלי חגיגה'));
  check(L.collected>0&&L.collected===L.expect,'ייצור: אחרי שעתיים בלי לשחק נאספו '+L.collected+' עץ (צפוי '+L.expect+')');
  check(L.gearOpen&&L.gearEquip==='oakBow'&&L.gearSaved&&L.gearFx===L.gearBetter&&L.gearClosed&&/\+10%/.test(L.gearCmp||''),'ציוד: '+(L.gearOpen?'המסך נפתח':'המסך לא נפתח')+', השוואה: "'+(L.gearCmp||'-')+'"'+
    (L.gearEquip==='oakBow'?', נלבשה קשת עץ':', לא נלבשה')+(L.gearSaved?', נשמר':', לא נשמר')+(L.gearFx?', חגיגה':', בלי חגיגה')+(L.gearBetter?' (שיפור)':' (לא שיפור)')+(L.gearClosed?', נסגר':', לא נסגר'));
  const A=L.age||{};
  check(L.ageOpen&&A.up&&A.down&&A.pity&&A.gem&&A.saved&&L.ageClosed,'Aging: '+(L.ageOpen?'הנפחייה נפתחה, '+(A.odds||'בלי סיכוי'):'הנפחייה לא נפתחה')+
    (A.up?', הצלחה: '+A.name+', נזק קשת '+A.dmg:', הצלחה לא עבדה')+(A.down?', כישלון הוריד רמה':', כישלון לא הוריד')+(A.pity?'':', המזל הרך לא התאפס')+
    (A.gem?', אבן חן הגנה':', אבן חן לא הגנה')+(A.saved?', נשמר':', לא נשמר')+(L.ageClosed?'':', לא נסגר'));
  const G=L.glow||{};
  check(G.hand&&G.trail>1&&G.parts>0,'זוהר Aging ב-+10: '+(G.hand?'שובל '+G.trail+' נקודות, '+G.parts+' חלקיקים':'לא נמצא הנשק'));
  check(L.gearW==='gun'&&L.gearDmg===gx,'ציוד בריצה: מתחיל עם '+(L.gearW==='gun'?'קשת':L.gearW)+', נזק קשת x'+L.gearDmg+' (צפוי x'+gx+')');
  check(L.won==null||!!L.gearLoot,'שלל ציוד: '+(L.gearLoot||'לא נפל')+(L.won!=null?' (בוס = פריט בטוח)':''));
  const st=L.stash||{};
  check(L.stashLv===1&&st.swIn&&st.wIn&&st.swOut&&st.saved,'מחסן: '+(L.stashLv===1?'נבנה':'לא נבנה')+(st.swIn?', חרב נכנסה':', חרב לא נכנסה')+(st.wIn?', עץ נכנס':', עץ לא נכנס')+
    (st.swOut?', חרב חזרה לתרמיל':', חרב לא חזרה')+(st.saved?', נשמר':', לא נשמר')+' ('+st.used+' מתוך '+st.cap+')');
  check(L.rgOpen&&L.rgPaused&&L.rgHp===rgHp&&L.rgSaved&&L.rgClosed,'ציוד באמצע ריצה: '+(L.rgOpen?'נפתח':'לא נפתח')+(L.rgPaused?', המשחק עצר':', המשחק לא עצר')+
    ', חיים +'+L.rgHp+' (צפוי +'+rgHp+')'+(L.rgSaved?', נשמר':', לא נשמר')+(L.rgClosed?', ממשיכים לשחק':', לא נסגר'));
  check(L.gateAt&&L.t!=null,'שער: '+(L.t!=null?'יצא לזירה':'לא יצא לזירה'));
  check(L.back!=null&&!!L.lootGot&&L.lootSaved,'שלל: '+(L.won!=null?'ניצחון '+t(L.won):L.died!=null?'נפל '+t(L.died):'הריצה לא נגמרה')+
    (L.back!=null?', חזר לכפר. במסך: '+L.lootTxt+' · בתרמיל: '+(L.lootGot||'כלום')+(L.lootSaved?', נשמר':', לא נשמר'):''));
  check(L.qAccepted&&L.qClaimed&&L.qPaid&&L.qSaved&&L.qFx,'קווסט: '+(L.qAccepted?'התקבל '+L.qName+' מהיומן ('+L.qLogTxt+', '+L.qDaily+' יומיים)':'לא התקבל')+
    ', בזירה '+(L.qProg??0)+(L.qReadyAt!=null?', הושלם '+t(L.qReadyAt):', לא הושלם')+(L.qTrack?' · מעקב: '+L.qTrack:'')+
    (L.qClaimed?', פרס נלקח '+L.qReward+(L.qPaid?' והגיע לתרמיל':' אבל לא הגיע לתרמיל')+(L.qSaved?', נשמר':', לא נשמר')+(L.qFx?', חגיגה':', בלי חגיגה'):', הפרס לא נלקח'));
  check(L.levels>0,'עליית רמה ובחירת שדרוג: '+L.levels+' פעמים, הגיע לרמה '+L.level);
  check(L.swaps>0,'החלפת נשק: '+L.swaps+' פעמים');
  check(L.door!=null&&L.room!=null&&L.roomBack!=null,'דלת זהב: הופיעה '+t(L.door)+', נכנס לחדר '+t(L.room)+(L.saws?' (עם מסורים)':'')+', חזר '+t(L.roomBack)+', '+L.coins+' מטבעות');
  const picks=['bomb','power'].filter(k=>L['pick_'+k]!=null).map(k=>(k==='bomb'?'פצצה ':'כוח ')+t(L['pick_'+k]));
  check(picks.length>0&&L.taken>0,'פריטים באזורי סכנה: '+(picks.join(', ')||'לא הופיעו')+', נלקחו '+L.taken);
  check(L.wanted!=null&&L.wRumor<L.wanted&&L.wEnd!=null,'מבוקש: שמועה '+t(L.wRumor)+', הופיע '+t(L.wanted)+', '+
    (L.wEnd==null?'לא נתפס ולא ברח':'נגמר '+t(L.wEnd)+' · נתפס '+L.wCaught+', ברח '+L.wEscaped+(L.wLoot?' · שלל: '+L.wLoot:'')));
  const num=/^\d+ \/ \d+$/;
  check(num.test(L.hpTxt)&&num.test(L.xpTxt)&&L.gainMax>0,'מספרים בממשק: חיים '+L.hpTxt+', XP '+L.xpTxt+', הכי הרבה שנאסף ברצף: +'+(L.gainMax||0));
  check(L.boss!=null,'בוס: הופיע '+t(L.boss)+(L.bossName?' ('+L.bossName+')':''));
  if(L.boss!=null){
    check(L.rageMax>0.9,'זעם כשבורחים: הגיע ל-'+Math.round(100*(L.rageMax||0))+'%');
    check(L.rageLow<L.rageMax,'נרגע כשמתעמתים: ירד ל-'+Math.round(100*(L.rageLow??1))+'%');
    check(L.bossDown!=null,'בוס הובס: '+t(L.bossDown));
  }
  const quiet=au.ids.filter(id=>!au.count[id]&&!(id==='bossIn'&&L.boss==null)&&!(id==='bossDown'&&L.bossDown==null)&&!(id==='coin'&&L.room==null));
  check(au.unlocked&&!quiet.length,'צלילים: '+au.ids.map(id=>id+' '+(au.count[id]||0)).join(', ')+(au.unlocked?'':' · לא נפתחו בנגיעה')+(quiet.length?' · לא נשמעו: '+quiet.join(', '):''));
  check(!au.errors.length&&au.loaded===au.ids.length,'קבצי צליל: נטענו '+au.loaded+' מתוך '+au.ids.length+(au.errors.length?' · שגיאות: '+[...new Set(au.errors)].join(', '):''));
  check(au.mute,'כפתור השתקה: '+(au.mute?'משתיק, נשמר ומחזיר':'לא עובד'));
  if(CFG.gfx==='3d')check(g3.on&&L.actorsMax>0,g3.on?'תלת-ממד: פעיל, עד '+L.actorsMax+' דמויות במסך, עד '+L.callsMax+' ציורים בפריים':'תלת-ממד: לא עלה'+(g3.failed?' (נפל לדו-ממד)':''));
  else check(!g3.on,'דו-ממד: פעיל לפי הבחירה');
  if(CFG.lang==='en')check(!startLeak&&!L.heLeak,startLeak||L.heLeak?'שפה: נשאר טקסט בעברית: '+(startLeak||L.heLeak):'שפה: כל המסכים באנגלית, משמאל לימין');
  if(!CFG.god)results.push(L.died!=null?'· מת ב-'+t(L.died):'· שרד עד '+t(L.t));
  check(errors.length===0,errors.length?'שגיאות בקונסול:\n    '+[...new Set(errors)].join('\n    '):'אין שגיאות בקונסול');

  console.log('ריצה: seed '+CFG.seed+', '+t(L.t)+' זמן משחק'+(CFG.god?', עם חסינות':'')+(CFG.lang==='en'?', באנגלית':'')+(CFG.gfx==='2d'?', בדו-ממד':', בתלת-ממד')+(CFG.shots?', צילומים ב-'+CFG.shots:''));
  console.log(results.join('\n'));
  process.exit(results.some(r=>r.startsWith('✗'))?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
