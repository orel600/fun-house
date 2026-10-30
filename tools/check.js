/* בדיקה אוטומטית: פותח את המשחק בדפדפן ללא ממשק ברוחב טלפון, ובסוף דוח.
   הבוט מתחיל בכפר (מקבל קווסט, בונה, אוסף תוצרת, יוצא בשער), משחק בזירה עד אחרי הבוס, חוזר לכפר עם השלל ולוקח את פרס הקווסט.
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
      ...['ovLevel','ovBoss','ovOver','vhud','vPanel','ovGear'].filter(vis).map(id=>document.getElementById(id).innerText),...floats.map(f=>f.txt)])
      if(he.test(s)){L.heLeak=s.trim().slice(0,80);break}}
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
  if(S.mode!=='play'&&S.mode!=='gear')return L;   // gear: מסך הציוד פתוח בכפר
  if(S.vil)return villageBot(m,L);
  // הריצה הראשונה אחרי שלבשנו קשת בכפר: מתחילים איתה, והנזק שלה גדל
  if(L.gearW==null){L.gearW=P.weapon;L.gearDmg=Math.round(P.gn.dmg/m.gdmg0*100)/100}
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
    L.nodes=S.nd.broken;L.nodeGot=[...new Set(S.nd.got)].join(', ');if(S.nd.broken)L.nodeAt??=at;
    L.nodeInLoot=S.nd.got.length>0&&S.nd.got.every(r=>(S.loot||{})[r]>0);
    L.drops=(S.drops||[0,0,0,0,0]).join('/');L.elites=S.elites||0;L.jackpots=S.jackpots||0;L.firstKills=S.firstKills||0;
    L.chests=S.nd.got.length?S.nd.chests||0:0;L.creatures=Object.entries(S.killsBy||{}).filter(([k])=>ETYPES[k]&&ETYPES[k].mat&&!['grunt','shield','wisp'].includes(k)).map(([k,n])=>k+' '+n).join(', ');
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
    else if(S.nd.broken<4&&S.nd.list.length){   // מקור משאבים: עומדים לידו עם חרב עד שהוא נשבר (nodes.js)
      const n=S.nd.list.reduce((b,n)=>!b||Math.hypot(n.x-P.x,n.y-P.y)<Math.hypot(b.x-P.x,b.y-P.y)?n:b,null);
      L.nodeSeen??=at;useWeapon('sword');tx=n.x;ty=n.y;
    }
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
      L.lootGot=got.join(', ');L.lootSaved=JSON.stringify(saved().bag)===JSON.stringify(SAVE.bag)}
    else if(L.qClaimed==null){   // פותחים את היומן ולוקחים את הפרס: הוא צריך להגיע לתרמיל ולשמירה
      document.getElementById('qBtn').click();const btn=qBtn('claim'),rw=QUESTS.list.find(q=>q.id===m.qid).reward,before=bag(),xp=SAVE.hero.xp;
      if(btn)btn.click();
      L.qClaimed=!!btn&&!SAVE.quests.active[m.qid]&&SAVE.quests.done[m.qid]===1;
      L.qPaid=Object.keys(rw).every(k=>k==='xp'?SAVE.hero.xp-xp===rw.xp:(SAVE.bag[k]||0)-(before[k]||0)===rw[k]);
      L.qReward=JSON.stringify(rw);L.qFx=FX.some(f=>f.K===CELEBRATE.quest);
      const sv=saved();L.qSaved=sv.quests.done[m.qid]===1&&!sv.quests.active[m.qid]&&JSON.stringify(sv.bag)===JSON.stringify(SAVE.bag)}
    return steer(null,null,false,0,L)}
  if(!m.vil){m.vil=1;L.vilOpen=!!S.vil;L.topBar=document.querySelectorAll('#vBag .res').length+'/'+resShown(null).length;L.gift=JSON.stringify(SAVE.bag);L.vilModels=R3D.on?(R3D.vil?R3D.vil.g.children.length:0):null}
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
    if(it){it.click();L.gearCmp=d();document.querySelector('#gDetail [data-act="equip"]').click()}
    const sv=JSON.parse(localStorage.getItem(SAVE_STORE.key));
    L.gearEquip=SAVE.gear.weapon;L.gearFx=FX.some(f=>f.K===CELEBRATE.gear)&&!!document.querySelector('#gSlots .pop');L.gearSaved=sv.gear.weapon==='oakBow'&&!sv.bag.oakBow;
    document.getElementById('gearClose').click();L.gearClosed=S.mode==='play'&&document.getElementById('ovGear').hidden;m.gear=2;return L}
  if(!m.stash){   // המחסן: בונים, מכניסים את חרב העץ ועץ, ומחזירים את החרב לתרמיל
    const St=VILLAGE.b.stash;
    if(S.vil.near!=='stash')return steer(St.x,St.y,false,0,L);
    m.stash=1;const q=s=>document.querySelector('#vPanel '+s),up=q('[data-act="up"]');
    if(up&&!up.disabled)up.click();L.stashLv=vLv('stash');
    const w0=SAVE.bag.wood||0,mv=(d,r)=>{const b=q('[data-act="stash"][data-dir="'+d+'"][data-r="'+r+'"]');if(b)b.click();return!!b};
    const swIn=mv('in','oakSword')&&SAVE.stash.oakSword===1&&!SAVE.bag.oakSword;
    const wIn=mv('in','wood')&&SAVE.stash.wood===w0&&!SAVE.bag.wood;
    const swOut=mv('out','oakSword')&&SAVE.bag.oakSword===1&&!SAVE.stash.oakSword;
    const sv=JSON.parse(localStorage.getItem(SAVE_STORE.key));
    L.stash={swIn,wIn,swOut,saved:sv.stash.wood===w0&&!sv.stash.oakSword&&sv.bag.oakSword===1,cap:stashCap(),used:stashUsed()};
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
  // כלכלה, בדיקה על הנתונים: לכל משאב לפחות שני מקורות (לחלק בוס: הבוס שלו) ושימוש אחד, וכל שם בטבלאות קיים ב-RES.
  // השוק לא נספר כמקור או כשימוש, כי הוא קונה ומוכר הכל. מקור או שימוש חדש? מוסיפים אותו כאן
  const eco=await page.evaluate(()=>{
    const src={},use={},bad=new Set(),add=(o,tbl,tag)=>{for(const r in tbl||{}){if(r==='coins')continue;if(!resOf(r))bad.add(r+' ('+tag+')');(o[r]=o[r]||new Set()).add(tag)}};
    for(const k in VILLAGE.b){const B=VILLAGE.b[k];
      for(const r in B.make||{})if(B.make[r].some(n=>n>0))add(src,{[r]:1},'make:'+k);
      B.cost.forEach(c=>add(use,c,'build:'+k))}
    for(const t in ETYPES){add(src,ETYPES[t].drop,'drop:'+t);add(src,ETYPES[t].elite,'elite:'+t)}
    add(src,LOOT.firstKill,'first');add(src,LOOT.jackpot.table,'jackpot');
    // יצורי משאבים לא באים מה-spawner: כל אחד חייב מקור ששומר עליו, ושורה ב-LOOK3D
    const guards=new Set(Object.values(NODES.kinds).map(k=>k.guard&&k.guard.type).filter(Boolean)),lost=[];
    for(const t in ETYPES)if(!['grunt','shield','wisp'].includes(t)&&(!guards.has(t)||!LOOK3D[t]||!ETYPES[t].mat))lost.push(t);
    for(const b in BOSSES)add(src,BOSSES[b].drop,'boss:'+b);
    add(src,WANTED.drop,'wanted');WANTED.loot.forEach(l=>add(src,l.res,'wanted:'+l.key));
    add(src,BONUS.roomRes,'room');
    // פרסים של קווסטים הם עוד מקור, ומשאב שקווסט מבקש להביא חייב להיות קיים (quests.js)
    for(const q of QUESTS.list){add(src,Object.fromEntries(Object.entries(q.reward||{}).filter(([k])=>k!=='xp'&&k!=='item')),'quest:'+q.id);
      for(const o of q.obj)if(o.type==='collect'&&o.what!=='coins'&&!resOf(o.what))bad.add(o.what+' (quest:'+q.id+')')}
    const placed=new Set(Object.values(NODES.arenas).flatMap(a=>a.spawn.map(s=>s.kind)));
    for(const k in NODES.kinds)if(placed.has(k))add(src,NODES.kinds[k].drop,'node:'+k);
    for(const id in GEAR.recipes){if(!GEAR.items[id])bad.add(id+' (recipe)');add(use,GEAR.recipes[id],'craft:'+id)}
    const dead=[],few=[],out=[];
    for(const r in RES.list){const R=RES.list[r];if(R.fam==='coins')continue;
      const s=src[r]?src[r].size:0,u=use[r]?use[r].size:0;out.push(r+' '+s+'/'+u);
      if(!u)dead.push(r);
      if(s<RES.fams[R.fam].min||R.boss&&!(src[r]||new Set()).has('boss:'+R.boss))few.push(r)}
    // שכבת ציוד ↔ מתכת: כל מתכון צריך את המתכת של השכבה שלו
    const tier=Object.keys(GEAR.recipes).filter(id=>GEAR.items[id]&&!GEAR.recipes[id][GEAR.tiers[GEAR.items[id].tier].metal]);
    return{n:out.length,dead,few,bad:[...bad],tier,lost,out:out.join(', '),death:RES.deathLoss&&RES.deathLoss.resources===0.5&&RES.deathLoss.items===0}});
  check(eco.n>=30&&!eco.dead.length&&!eco.few.length&&!eco.bad.length&&!eco.tier.length&&!eco.lost.length&&eco.death,'כלכלה: '+eco.n+' משאבים (מקורות/שימושים): '+eco.out+
    (eco.dead.length?' · משאב מת: '+eco.dead.join(', '):'')+(eco.few.length?' · חסרים מקורות: '+eco.few.join(', '):'')+(eco.bad.length?' · לא ב-RES: '+eco.bad.join(', '):'')+
    (eco.tier.length?' · מתכון בלי המתכת של השכבה: '+eco.tier.join(', '):'')+(eco.lost.length?' · יצור בלי מקור ששומר עליו, LOOK3D או mat: '+eco.lost.join(', '):'')+(eco.death?'':' · deathLoss חסר'));
  // שלל: מזל עם הגנה (אחרי הרבה החטאות הסיכוי לנדיר גדל, ונופל = מתאפס), והריגה ראשונה היום נותנת בונוס פעם אחת לכל סוג
  const lt=await page.evaluate(()=>{
    const c0=celebrate;celebrate=()=>0;   // בלי אלפי חגיגות בבדיקה
    const rate=p=>{let n=0;for(let i=0;i<2000;i++){SAVE.pity=p;if(runGive({rubyC:[0.1,1]},0,0).length)n++}return n/2000};
    const low=rate(0),high=rate(1000);SAVE.pity=5;runGive({rubyC:[1,1]},0,0);const reset=SAVE.pity===0;runGive({rubyC:[0,1]},0,0);const grow=SAVE.pity===1;
    SAVE.daily={day:'1999-1-1',first:{}};S.firstKills=0;const g={type:'grunt',x:0,y:0,r:13};lootKill(g);lootKill(g);const first=S.firstKills===1&&SAVE.daily.first.grunt===1;
    celebrate=c0;FX.length=0;floats=[];orbs=[];S.loot={};S.beams=[];S.drops=null;S.killsBy=null;localStorage.removeItem(SAVE_STORE.key);saveLoad();
    return{low,high,reset,grow,first}});
  check(lt.high>lt.low*2&&lt.reset&&lt.grow&&lt.first,'מזל עם הגנה: נדיר '+Math.round(lt.low*100)+'% בהתחלה, '+Math.round(lt.high*100)+'% אחרי הרבה החטאות'+
    (lt.reset&&lt.grow?', מתאפס כשנופל':', לא מתאפס')+(lt.first?', הריגה ראשונה היום: בונוס פעם אחת':', בונוס הריגה ראשונה שבור'));
  // שוק מלא: מוכרים וקונים כל משאב, קנייה תמיד יקרה ממכירה בכל רמה, נדיר נפתח ברמה גבוהה, וחלק בוס אי אפשר לקנות.
  // יצירה בנפחייה, שמירה ישנה עם 'עפרות' הופכת לברזל, והפס העליון בנפחייה מראה מתכות ולא עץ
  const mk2=await page.evaluate(()=>{
    const rs=Object.keys(RES.list).filter(r=>RES.list[r].fam!=='coins'),spread=[];
    for(let L=1;L<=5;L++){SAVE.village.market=L;for(const r of rs)if(RES.list[r].buy&&vPrice(r,'buy')<=vPrice(r,'sell'))spread.push(r+'@'+L)}
    SAVE.village.market=1;const gate=!vCanTrade('buy','star')&&vCanTrade('buy','wood');
    SAVE.village.market=5;const top=vCanTrade('buy','star')&&!vCanTrade('buy','horn');
    let sold=0,bought=0;for(const r of rs){bagAdd(r,5);const c=SAVE.bag.coins||0;if(vTrade('sell',r)&&SAVE.bag.coins>c)sold++;
      if(vCanTrade('buy',r)){bagAdd('coins',vPrice(r,'buy')*vLot(r));const h=SAVE.bag[r]||0;if(vTrade('buy',r)&&SAVE.bag[r]>h)bought++}}
    const buyable=rs.filter(r=>vCanTrade('buy',r)).length;
    SAVE.village.forge=1;for(const r in GEAR.recipes.oakSword)bagAdd(r,GEAR.recipes.oakSword[r]);
    const sw=SAVE.bag.oakSword||0,craft=gearCraft('oakSword')&&SAVE.bag.oakSword===sw+1&&!gearCraft('ironSword');
    localStorage.setItem(SAVE_STORE.key,JSON.stringify({v:1,bag:{ore:7}}));saveLoad();const ore=SAVE.bag.iron===7&&!SAVE.bag.ore;
    bagAdd('silver',1);const bar=resShown('forge').includes('silver')&&!resShown('forge').includes('wood')&&resShown(null).includes('wood')&&!resShown(null).includes('silver');
    localStorage.removeItem(SAVE_STORE.key);saveLoad();
    return{spread,gate,top,sold,bought,buyable,n:rs.length,craft,ore,bar}});
  check(!mk2.spread.length&&mk2.gate&&mk2.top&&mk2.sold===mk2.n&&mk2.bought===mk2.buyable,'שוק מלא: נמכרו '+mk2.sold+'/'+mk2.n+', נקנו '+mk2.bought+'/'+mk2.buyable+
    (mk2.spread.length?' · קנייה לא יקרה ממכירה: '+mk2.spread.join(', '):', קנייה תמיד יקרה ממכירה')+(mk2.gate&&mk2.top?', נדיר נפתח ברמה גבוהה, חלק בוס לא למכירה':', הרמות של השוק לא נכונות'));
  check(mk2.craft&&mk2.ore&&mk2.bar,'נפחייה ופס עליון: '+(mk2.craft?'יוצרים חרב עץ, ברזל נעול ברמה 1':'יצירה נכשלה')+(mk2.ore?', עפרות ישנות הפכו לברזל':', עפרות לא הומרו')+
    (mk2.bar?', בנפחייה רואים מתכות ולא עץ':', הפס העליון לא לפי מקום'));
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
  if(CFG.lang!=='he'){
    await page.click('[data-lang="'+CFG.lang+'"]');
    startLeak=await page.evaluate(()=>{const s=document.getElementById('ovStart').innerText.replace('עברית','');return /[֐-׿]/.test(s)||document.documentElement.dir!=='ltr'?s.slice(0,80):null});
    await shot('start-'+CFG.lang);
  }
  const rgHp=await page.evaluate(()=>GEAR.items.boneCharm.stats.hp);   // כמה חיים הקמע מוסיף באמצע ריצה
  const gx=await page.evaluate(()=>Math.round((1+GEAR.items.oakBow.stats.gdmg/100)*100)/100);   // כמה קשת העץ אמורה להוסיף, לפי GEAR
  await page.click('#startBtn');

  await page.addScriptTag({content:steer+'\n'+villageBot});   // עוזרים של הבוט, בתוך הדף
  let L={},took={},guard=0;
  while(guard++<CFG.time*30){
    await page.clock.runFor(CFG.step);
    L=await page.evaluate(botStep,{god:CFG.god,en:CFG.lang==='en'});
    for(const k of ['vilOpen','qAccepted','built','collected','gearOpen','stash','rgOpen','door','room','wanted','boss','bossDown','lootTxt','back','qClaimed'])if(L[k]!=null&&!took[k]){took[k]=1;await shot(k==='vilOpen'?'village':k==='lootTxt'?'loot':k==='qAccepted'?'quests':k)}
    if(L.qClaimed!=null||L.t>=CFG.time)break;   // חזרנו לכפר ולקחנו את פרס הקווסט: אין עוד מה לבדוק
  }
  await shot('end');
  // צלילים: כמה פעמים כל צליל התבקש, אם הקבצים נטענו מ-file://, ואם כפתור ההשתקה עובד ונשמר
  const au=await page.evaluate(()=>{const b=document.getElementById('muteBtn');b.click();const m=AUDIO.muted&&localStorage.getItem('zm-mute')==='1';b.click();
    return{count:AUDIO.count,errors:AUDIO.errors,unlocked:AUDIO.unlocked,ids:Object.keys(SOUNDS),mute:m&&!AUDIO.muted,
      loaded:Object.values(AUDIO.pool).filter(p=>p.every(a=>a.readyState>=1)).length}});
  await browser.close();

  const t=s=>s==null?'-':Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
  check(L.vilOpen&&L.gift&&L.gift!=='{}'&&(L.vilModels==null||L.vilModels>0),'כפר: נפתח אחרי מסך הפתיחה, מתנת פתיחה '+L.gift+(L.vilModels!=null?', '+L.vilModels+' מודלים בתלת-ממד':''));
  check(L.topBar&&L.topBar.split('/')[0]===L.topBar.split('/')[1],'פס עליון בכפר: '+L.topBar+' משאבים (מטבעות וחומרי בנייה בלבד)');
  check(L.nodes>0&&!!L.nodeGot&&L.nodeInLoot,'מקורות משאבים: '+(L.nodeSeen!=null?'הופיע '+t(L.nodeSeen):'לא הופיע')+', נשברו '+(L.nodes||0)+(L.nodeAt!=null?' (ראשון '+t(L.nodeAt)+')':'')+
    ', נפל: '+(L.nodeGot||'כלום')+(L.nodeInLoot?', בשלל של הריצה':', לא הגיע לשלל'));
  const dr=(L.drops||'0/0/0/0/0').split('/').map(Number);
  check(dr[0]>0&&L.firstKills>0,'שלל לפי דרגה: '+['רגיל','לא שכיח','נדיר','אפי','אגדי'].map((n,i)=>n+' '+dr[i]).join(', ')+
    ' · עלית '+L.elites+', פיצוץ שלל '+L.jackpots+', הריגה ראשונה '+L.firstKills+', תיבות '+(L.chests||0)+', יצורי משאבים: '+(L.creatures||'לא הופלו'));
  check(L.built===1&&L.builtSaved&&L.fx,'בנייה: '+(L.panel||'הפאנל לא נפתח')+', '+(L.built===1?'נבנתה, שולם '+L.paid:'לא נבנתה')+(L.builtSaved?', נשמר':', לא נשמר')+(L.fx?', חגיגה עם פיגום':', בלי חגיגה'));
  check(L.collected>0&&L.collected===L.expect,'ייצור: אחרי שעתיים בלי לשחק נאספו '+L.collected+' עץ (צפוי '+L.expect+')');
  check(L.gearOpen&&L.gearEquip==='oakBow'&&L.gearSaved&&L.gearFx&&L.gearClosed&&/\+10%/.test(L.gearCmp||''),'ציוד: '+(L.gearOpen?'המסך נפתח':'המסך לא נפתח')+', השוואה: "'+(L.gearCmp||'-')+'"'+
    (L.gearEquip==='oakBow'?', נלבשה קשת עץ':', לא נלבשה')+(L.gearSaved?', נשמר':', לא נשמר')+(L.gearFx?', חגיגה':', בלי חגיגה')+(L.gearClosed?', נסגר':', לא נסגר'));
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
