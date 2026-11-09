/* בדיקה אוטומטית: פותח את המשחק בדפדפן ללא ממשק בגודל טלפון לרוחב, בוט משחק עד אחרי הבוס, ובסוף דוח.
   הבוט בוחר דמות התחלה, מתחיל בכפר (מקבל קווסט, בונה, אוסף תוצרת, יוצא בשער), יוצא לעולם הפתוח (כורת עץ, מפיל אויב, נכנס לזירה בשער),
   משחק בזירה עד אחרי הבוס, חוזר לאותו שער עם השלל, נופל בעולם ובודק שאבד חצי מהמשאבים, קם בכפר ולוקח את פרס הקווסט.
   הרצה: node tools/check.js
   אפשרויות: --time 560   כמה שניות משחק לשחק, לכל היותר (הריצה נגמרת כשהבוס בסוף מובס)
             --seed 7     אותו מספר = אותה ריצה בדיוק, כדי לשחזר באג או להשוות לפני ואחרי שינוי
             --real       בלי חסינות: הבוט יכול למות, כדי לבדוק קושי ולא רק קריסות
             --shots      צילומי מסך לתיקייה tools/shots
             --skin nomad הדמות לובשת סקין מ-SKINS, כדי לראות עיצוב חדש בצילומים
             (English only, 7.11.2026: every run is in English and fails on Hebrew on screen; --lang is ignored)
             --gfx 2d     משחק בדו-ממד. ברירת המחדל: תלת-ממד, ונכשל אם הוא לא עלה
   הזמן במשחק מואץ בשעון מזויף, אז ריצה של שש דקות לוקחת דקה-שתיים. */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');

const args=process.argv.slice(2);
const opt=k=>{const i=args.indexOf('--'+k);if(i<0)return null;const v=args[i+1];return v&&!v.startsWith('--')?v:true};
const GPU=require('./gpu.js');   // --gpu או FH_GPU=1: כרטיס מסך אמיתי במקום SwiftShader (tools/gpu.js). בלי זה: כמו קודם, וב-GitHub גם
const CFG={
  time:+(opt('time')||600),   // 600 (היה 560, 8.11: מרווח לזירה של 10 גלים). 560 (היה 480): באחו הגדול ההליכה לשער הזירה ארוכה בכ-40 שניות
  seed:+(opt('seed')||Math.floor(Math.random()*1e6)),
  god:!opt('real'),
  shots:opt('shots')?path.join(__dirname,'shots'):null,
  skin:opt('skin'),
  lang:'en',   // English only (Nir, 7.11.2026): every run is in English and fails on Hebrew on screen
  gfx:opt('gfx')==='2d'?'2d':'3d',
  step:200,                          // כל כמה מילישניות של משחק הבוט מחליט מחדש
  phone:{width:844,height:390}       // טלפון לרוחב: ככה משחקים (ניר, 30.10.2026)
};

/* הבוט רץ בתוך הדף, עם גישה למשתנים הגלובליים של המשחק. הזיכרון שלו ב-window.__bot */
function botStep({god,en}){
  const m=window.__bot||(window.__bot={log:{levels:0,swaps:0,taken:0,coins:0},faced:0,swapAt:0,atGate:0});
  const L=m.log,at=Math.round(S.t*10)/10,vis=id=>!document.getElementById(id).hidden;
  faceStep(m,L);   // בכל מקום: הגוף פונה לאן שהולכים
  petBot(m,L);     // חיית המחמד: הולכת אחרי השחקן, חופרת ומתפתחת
  // באנגלית: כל טקסט שמופיע על המסך (ממשק, באנר, מסכים, טקסט צף) נבדק לפני שהבוט לוחץ
  if(en&&!L.heLeak){const he=/[֐-׿]/;
    for(const s of [document.querySelector('.hud').innerText,document.getElementById('banner').textContent,document.getElementById('swaplbl').textContent,
      ...['ovHero','ovLevel','ovBoss','ovOver','vhud','vPanel','ovGear','whud','wPanel','ovWDeath'].filter(vis).map(id=>document.getElementById(id).innerText),...floats.map(f=>f.txt)])
      if(he.test(s)){L.heLeak=s.trim().slice(0,80);break}}
  // משחק ראשון: בוחרים לוחם, ובודקים שהחרב שלו נלבשה ושהבחירה נשמרה
  if(vis('ovHero')){L.heroCards=document.querySelectorAll('#heroCards [data-hero]').length;document.querySelector('#heroCards [data-hero="warrior"]').click();
    const sv=JSON.parse(localStorage.getItem(SAVE_STORE.key));L.heroStart=sv.hero.start;L.heroW=SAVE.gear.weapon;L.heroVil=!!S.vil&&document.getElementById('ovHero').hidden;
    // שחקן חדש (המבקר, 2.11): 1-2 משימות, בלי יומיים, הישגים ואתגר יומי לפני הפנס הראשון, ומתנת הפתיחה לא נכתבת על השיחה עם אבנר
    const Q=SAVE.quests,act=Object.keys(Q.active);
    L.early={act:act.length+QUESTS.list.filter(q=>qOpen(q)).length,ids:act.concat(QUESTS.list.filter(q=>qOpen(q)).map(q=>q.id)).join(','),daily:Q.daily.length,ach:act.filter(id=>QBY[id]&&QBY[id].kind==='achievement').length,
      ch:!chOpen()&&!chCan()&&challengeCard()==='',gift:!!SAVE.gift&&!document.getElementById('banner').textContent.includes(T('vil.gift'))};
    QUESTS.early.ids=QUESTS.list.map(q=>q.id);   // מכאן הבוט בודק את כל הקווסטים, כמו שחקן אחרי הפנס הראשון
    return L}
  // שדרוגים: מול הבוס, סוג הנזק שהוא חלש אליו. אחרת סוג נזק לנשק שעוד אין לו, ושונה מהנשק השני, כדי שהריצה תפגע בכמה סוגים
  // בטלפון שוכב, הכפתורים של עליית רמה, הבוס ומסך הסוף בתוך המסך, בלי לגלול (בדיקת הזירה, 1.11.2026)
  const fitChk=(k,els)=>{L.fit=L.fit||{};if(L.fit[k])return;const out=els.filter(e=>{const r=e.getBoundingClientRect();return r.bottom>innerHeight+1||r.top<-1||r.right>innerWidth+1||r.left<-1});L.fit[k]=out.length?'בחוץ':'בפנים'};
  // הודעות בזירה (2.11.2026): פס קטן למעלה מתחת ל-HUD, לא על הגיבור באמצע ולא על פס הריצה או פס הבוס. נמדד פעם בתחילת הריצה ופעם מול הבוס
  // תור ההודעות (welcome.js) מתרוקן קודם, כדי שהודעת הבדיקה תוצג עכשיו ולא נמדוד הודעה ישנה
  const banChk=k=>{if(L[k])return;if(typeof BANNER!=='undefined'){clearTimeout(BANNER.t);BANNER.t=0;BANNER.q.length=0;BANNER.last=-1e9}if(typeof CQS!=='undefined'){CQS.cur=null;CQS.q.length=0}banner('check ✓',C.gold);const be=document.getElementById('banner'),b={top:be.offsetTop,bottom:be.offsetTop+be.offsetHeight,left:be.offsetLeft,right:be.offsetLeft+be.offsetWidth},   // המקום הסופי, בלי ההחלקה של הכניסה (translateY)
    bars=['runbar','bossbar'].map(id=>document.getElementById(id)).filter(e=>e&&e.offsetParent).map(e=>e.getBoundingClientRect());
    const hud=document.querySelector('.hud'),hb=hud?Math.round(hud.getBoundingClientRect().bottom):0;
    L[k]={top:Math.round(b.top),bot:Math.round(b.bottom),H:innerHeight,hud:hb,hit:bars.some(r=>r.bottom>b.top&&r.top<b.bottom&&r.right>b.left&&r.left<b.right)}};
  if(S.mode==='play'&&!['vil','world','mb'].some(c=>document.body.classList.contains(c))){banChk('banA');if(vis('bossbar'))banChk('banB')}
  if(vis('ovLevel'))fitChk('level',[...document.querySelectorAll('#cards .card')]);
  if(vis('ovBoss'))fitChk('boss',[document.getElementById('fightBtn')]);
  if(vis('ovOver'))fitChk('over',[document.getElementById('againBtn')]);
  if(vis('ovLevel')){const cs=[...document.querySelectorAll('#cards .card')],o=w=>P.dt[w==='sword'?'gun':'sword'];
    (cs.find(c=>S.boss&&c.dataset.el===S.boss.weak)||cs.find(c=>c.dataset.sk)||cs.find(c=>c.dataset.el&&P.dt[c.dataset.w]==='physical'&&c.dataset.el!==o(c.dataset.w))||cs.find(c=>!c.dataset.el)||cs[0]).click();
    L.levels++;return L}
  if(vis('ovBoss')){L.bossIntro??=at;document.getElementById('fightBtn').click();return L}
  if(S.wd)return worldBot(m,L,god);   // העולם הפתוח, כולל המוות בו
  // סוף ריצה: רושמים איך נגמרה ומה השלל, וחוזרים לכפר
  if(S.mode==='over'){
    if(S.won)L.won??=at;else L.died??=at;
    L.dropsArena??=JSON.stringify(dropStats());   // שלל על הרצפה בזירה: כמה נפל, כמה נאסף בהליכה, וכמה נאסף לבד בסוף
    L.gearLoot??=(S.gearLoot||[]).join(', ');
    if(vis('ovOver')&&!m.home){   // צעד אחד מסתכלים על המסך (וצילום), ובצעד הבא חוזרים
      if(L.lootTxt==null)L.lootTxt=document.getElementById('sLoot').innerText.replace(/\s+/g,' ').trim();
      else{m.home=1;document.getElementById('againBtn').click()}}
    return L}
  // "בזמן שלא היית" (welcome.js): מאז 2.11 לא קופץ חלון בכניסה לכפר, רק כפתור 📦 (נבדק אחרי הריצה). אם החלון בכל זאת נפתח, הבוט סוגר אותו (ובדוח: welFirst)
  // הביקור הראשון (המבקר, 1.11): בלי "בזמן שלא היית". המתנה של היום הראשון כבר בתרמיל, והכפתור 🎁 מוסתר
  if(S.vil&&!L.v1)L.v1={daily:!dailyCan(),n:dailySave().n,btn:document.getElementById('dBtn').hidden,coins:SAVE.bag.coins||0,want:DAILY.days[0].coins};
  if(!S.vil&&L.v1)L.v1x=1;
  if(vis('ovWelcome')){const b=document.querySelector('#welWin [data-act="all"]');
    if(!L.v1x)L.welFirst=1;
    if(L.welOpen==null)L.welOpen={at,rows:document.querySelectorAll('#welWin .welrow').length,daily:document.querySelectorAll('#welWin .welrow.daily').length,daily0:!document.getElementById('ovDaily').hidden};
    else if(b&&L.welUi==null){const c=SAVE.bag.coins||0;b.click();L.welUi={got:(SAVE.bag.coins||0)-c,want:DAILY.days[0].coins,btn:document.getElementById('dBtn').hidden,
      saved:JSON.parse(localStorage.getItem(SAVE_STORE.key)).daily.gift.n,next:!!(document.querySelector('#welWin .welnext')||{}).textContent}}
    else welcomeClose();
    return L}
  if(vis('ovDaily'))L.dailyPop=1;   // הלוח של 7 ימים לא אמור לקפוץ לבד יותר
  if(S.mode!=='play'&&S.mode!=='gear'&&S.mode!=='forge')return L;   // gear, forge: מסך הציוד או הנפחייה פתוח בכפר
  if(S.vil)return villageBot(m,L);
  // הריצה הראשונה אחרי שלבשנו קשת בכפר: מתחילים איתה, והנזק שלה גדל
  if(L.gearW==null){L.gearW=P.weapon;L.gearDmg=Math.round(P.gn.dmg/m.gdmg0*100)/100;L.heroHp=P.maxHp-100-(gearStats().hp||0)}   // 100: החיים ההתחלתיים ב-reset
  // באמצע הריצה: פותחים את הציוד מהכפתור בזירה, בודקים שהמשחק עוצר, לובשים קמע ורואים שהחיים עלו מיד
  if(S.mode==='gear'||(!m.runGear&&S.t>5&&!S.room&&!S.boss&&S.mode==='play')){
    if(!m.runGear){m.runGear=1;m.rt=S.t;m.hp0=P.maxHp;document.getElementById('gearBtnRun').click();L.rgOpen=S.mode==='gear'&&!document.getElementById('ovGear').hidden;return L}
    if(m.runGear===1){L.rgPaused=S.t===m.rt;const it=document.querySelector('#gItems [data-id="boneCharm"]');
      if(it){it.click();document.querySelector('#gDetail [data-act="equip"]').click()}
      L.doll=R3D.on?(document.querySelector('#gSlots .gfig .doll3d')&&R3D.doll&&R3D.doll.a?'3d':'חסר'):'2d';   // הדמות בתלת-ממד בחלון (doll3d.js)
      L.rgHp=P.maxHp-m.hp0;L.rgSaved=JSON.parse(localStorage.getItem(SAVE_STORE.key)).gear.acc.includes('boneCharm');
      document.getElementById('gearClose').click();L.rgClosed=S.mode==='play';m.runGear=2;return L}
  }
  if(god)P.hp=P.maxHp;
  // סקילים: לוחצים על הכפתור עצמו, כמו שחקן שמחפש קומבו. קודם מרטיבים, אחר כך קרח או ברק על רטובים, ואדמה על קפואים.
  // רק מול אויב-על או בוס, כמו שחקן ששומר סקילים לאויבים קשים. בגושים לא, כדי שהבדיקה "גושים" תמדוד כמה אויבים הזירה מביאה
  const sb=document.getElementById('skills');
  if(S.sk&&!S.room&&S.mode==='play'){
    L.skBtns=sb.hidden?0:sb.querySelectorAll('[data-sk]').length;L.skIds=S.sk.ids.join(' ');L.skUsed=S.sk.used;L.combos={...S.sk.combos};
    const near=enemies.filter(e=>!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<150),ready=id=>{const i=S.sk.ids.indexOf(id);return i>=0&&S.sk.cd[i]<=0};
    if(near.length&&(S.boss||enemies.some(e=>e.elite))){
      const pick=near.some(e=>e.frozen>0)&&ready('quake')?'quake':near.some(e=>e.wet>0)&&(ready('frost')||ready('zap'))?(ready('frost')?'frost':'zap')
        :ready('splash')?'splash':S.sk.ids.includes('splash')?null:S.sk.ids.find(ready);
      const b=pick&&sb.querySelector('[data-sk="'+pick+'"]');if(b)b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));
    }
  }
  if(R3D.on){L.actorsMax=Math.max(L.actorsMax||0,R3D.stats.actors||0);L.callsMax=Math.max(L.callsMax||0,R3D.stats.calls||0)}
  L.taken=S.bn.taken;L.coins=S.bn.coins;L.t=at;L.level=P.level;
  // הריצה: טיימר, פס התקדמות, תחנות, וכמה אויבים היו בזירה יחד
  L.peak=Math.max(L.peak||0,enemies.length);L.hordeMax=S.hordeMax||0;L.clock=document.getElementById('clock').textContent;
  // הזירה (arenas.js): עד איזה גל הגענו, כמה הפסקות עם ריפוי, והמונה למעלה
  if(S.wv){L.wvN=ARENAS.gauntlet.list.length;L.wvMax=Math.max(L.wvMax||0,S.wv.i+1);L.wvHeal=S.wv.healed;L.wvEnds=S.wv.log.map(x=>fmt(x.end)).join(' ');L.wvLate=S.wv.late||0;if(S.wv.phase==='fight'&&S.t-S.wv.start>60&&!L.wvStuck)L.wvStuck='גל '+(S.wv.i+1)+' אחרי 60 שניות: '+enemies.filter(e=>!e.dead&&e.wv===S.wv.i).map(e=>e.type+(e.champ?'*':'')+' '+Math.round(100*e.hp/e.max)+'% '+Math.round(Math.hypot(e.x-P.x,e.y-P.y))+(e.awake?'':' ישן')).join(', ')+' · נשק '+P.weapon;L.lvAt=L.lvAt||{};L.lvAt[S.wv.i+1]??=P.level;const tg=document.getElementById('waveTag');if(tg&&!tg.hidden&&tg.textContent)L.waveTag=tg.textContent}
  // צילומים באמצע הגלים המיוחדים (QUINN, 8.11): קירות המבוך אחרי שצמחו (גלים 5-6), והטבעת בגל 8 כשהיא כבר סביבך
  if(S.wv&&S.wv.phase==='fight'){
    if(L.wvMaze==null&&!S.room&&typeof mazeOn==='function'&&mazeOn()&&mazeFade()>=MAZE.solidAt&&MZ.walls.some(w=>w.x+w.w>S.cam.x-W*0.45&&w.x<S.cam.x+W*0.45&&w.y+w.h>S.cam.y-H*0.45&&w.y<S.cam.y+H*0.45))L.wvMaze=at;   // קיר בתוך המסך
    if(L.wvRing==null&&ARENAS.gauntlet.list[S.wv.i]&&ARENAS.gauntlet.list[S.wv.i].ring&&enemies.filter(e=>!e.dead&&e.wv!=null&&Math.hypot(e.x-P.x,e.y-P.y)<420).length>=6)L.wvRing=at}
  L.elites=S.run.elites;L.supsN=ARENAS.gauntlet.list.filter((x,i)=>x.sup&&i<(L.wvMax||0)).length;
  L.eliteLeft=enemies.filter(e=>e.elite).map(e=>e.type+' '+Math.round(100*e.hp/e.max)+'% במרחק '+Math.round(Math.hypot(e.x-P.x,e.y-P.y))).join(', ');
  // מספרים גדולים: הכי גדול שנראה, כמה קריטיות, ומספר נזק שלא נכתב משמאל לימין
  const val=s=>{const x=/^([\d.]+)([KMBT]?)/.exec(s);return x?+x[1]*{'':1,K:1e3,M:1e6,B:1e9,T:1e12}[x[2]]:0};
  for(const f of floats){if(!f.ltr&&/^[\d.]+[KMBT]?!?$/.test(f.txt))L.notLtr=f.txt;if(!f.ltr)continue;
    if(val(f.txt)>(L.dmgMax||0)){L.dmgMax=val(f.txt);L.dmgMaxTxt=f.txt}if(f.crit&&!f.counted){f.counted=1;L.crits=(L.crits||0)+1}}
  const qa=SAVE.quests.active[m.qid];if(qa){L.qProg=qa.p[0];if(qa.r)L.qReadyAt??=at}
  if(!document.getElementById('qTrack').hidden)L.qTrack??=document.getElementById('qTrack').textContent;
  L.hpTxt=document.getElementById('hpTxt').textContent;L.xpTxt=document.getElementById('xpTxt').textContent;
  for(const f of floats)if(/^\+\d+$/.test(f.txt))L.gainMax=Math.max(L.gainMax||0,+f.txt.slice(1));
  // החלפה רק בין נשקים שלבושים. עם נשק אחד הכפתור מוסתר, ובודקים את זה
  const useWeapon=w=>{if(P.weapon!==w&&wHeld().length>1){swapWeapon();L.swaps++;m.swapAt=S.t}};
  L.swapBtn=document.getElementById('swap').hidden===(wHeld().length<2);L.nHeld=Math.max(L.nHeld||0,wHeld().length);   // הכי הרבה נשקים ביד בריצה: בדרך הבוט יכול למכור או ללבוש את הנשק השני, וההחלפות שכבר נספרו נשארות
  // הנשק שסוג הנזק שלו הכי טוב נגד האויב
  const best=e=>(e.mult[P.dt.sword]??1)>=(e.mult[P.dt.gun]??1)?'sword':'gun';
  L.hits={...S.hits};L.dt=P.dt.sword+'/'+P.dt.gun;
  let tx=null,ty=null,flee=false,stop=0;
  if(S.room){
    L.room??=at;L.saws??=S.room.saws.length;
    const c=S.room.coins.reduce((b,c)=>!b||Math.hypot(c.x-P.x,c.y-P.y)<Math.hypot(b.x-P.x,b.y-P.y)?c:b,null);
    if(c){tx=c.x;ty=c.y}
  }else{
    if(L.room!=null&&L.roomBack==null)L.roomBack=at;
    for(const k of S.bn.picks)L['pick_'+k.type]??=at;
    if(S.bossCount>0)L.bossDown??=at;
    if(S.boss||S.bossCount>0)L.arfx=JSON.parse(JSON.stringify(ARFXS.stat));   // אפקטים בזירה ובבוס (arena-fx.js)
    L.nodes=S.nd.broken;L.nodeGot=[...new Set(S.nd.got)].join(', ');if(S.nd.broken)L.nodeAt??=at;
    L.nodeInLoot=S.nd.got.length>0&&S.nd.got.every(r=>(S.loot||{})[r]>0||drops().some(d=>!d.got&&d.r===r));   // או שעוד שוכב על הרצפה (drops.js), ונאסף בסוף לבד
    L.gearDrops=S.gearDrops||0;
    L.drops=(S.drops||[0,0,0,0,0]).join('/');L.elites=S.elites||0;L.jackpots=S.jackpots||0;L.firstKills=S.firstKills||0;
    L.chests=S.nd.got.length?S.nd.chests||0:0;L.creatures=Object.entries(S.killsBy||{}).filter(([k])=>ETYPES[k]&&!['grunt','shield','wisp'].includes(k)&&!HORDE.monsters.some(m=>m.type===k)&&!RUN.elite.types.includes(k)).map(([k,n])=>k+' '+n).join(', ');
    L.monsters=Object.entries(S.killsBy||{}).filter(([k])=>HORDE.monsters.some(m=>m.type===k)||RUN.elite.types.includes(k)).map(([k,n])=>k+' '+n).join(', ');
    const w=S.wn;
    if(w.rumor)L.wRumor??=at;
    if(w.e)L.wanted??=at;else if(L.wanted!=null)L.wEnd??=at;
    L.wCaught=w.caught;L.wEscaped=w.escaped;L.wLoot=w.got.join(', ');
    const b=S.boss;
    if(b){
      L.boss??=at;L.bossName=b.name;L.rageMax=Math.max(L.rageMax||0,b.rage);
      if(!L.bossRes){L.bossRes=b.res;L.bossWeak=b.weak;L.bossRole=b.role;const u=b.used;L.usedTop=Object.keys(u).sort((a,c)=>u[c]-u[a])[0];
        L.held=bossHeld().includes(b.weak)}
      // קודם בורחים כדי לבדוק שהבוס מתעצבן, ואז מתעמתים ובודקים שהוא נרגע.
      // כמו שחקן אמיתי: מתמקדים בבוס עם הנשק שסוג הנזק שלו הכי טוב נגדו, והמלווים נופלים בדרך
      if(!m.faced&&b.rage<0.99){tx=b.x;ty=b.y;flee=true}
      else{
        if(!m.faced)m.faced=S.t;L.rageLow=Math.min(L.rageLow??1,b.rage);
        useWeapon(best(b));   // תמיד הנשק הכי טוב נגד הבוס. קודם מלווה קרוב "גנב" את הנשק, ובוס עמיד לנזק הזה לא נפל עד 8:00 (1.11)
        tx=b.x;ty=b.y;stop=b.r+30;   // גם עם קשת צמוד לבוס: ההתקפה האוטומטית בזירה מכוונת לקרוב (aimTarget), ומ-240 המלווים באמצע ספגו את החצים
      }
    }else if(enemies.some(e=>e.elite)){
      // אויב-על: כמו שחקן אמיתי, הולכים אליו עם הנשק שסוג הנזק שלו הכי טוב נגדו
      const e=enemies.find(e=>e.elite),wk=best(e);
      useWeapon(wk);tx=e.x;ty=e.y;stop=wk==='sword'?e.r+40:e.r+70;   // קרוב, כדי שהוא יהיה המטרה הקרובה ולא המלווים
    }else if(S.bn.door){L.door??=at;tx=S.bn.door.x;ty=S.bn.door.y}
    else if(w.e){tx=w.e.x;ty=w.e.y}
    else if(S.bn.picks.length){const k=S.bn.picks[0];tx=k.x;ty=k.y}
    else if(S.nd.broken<4&&S.nd.list.length){   // מקור משאבים: עומדים לידו עם חרב עד שהוא נשבר (nodes.js)
      const n=S.nd.list.reduce((b,n)=>!b||Math.hypot(n.x-P.x,n.y-P.y)<Math.hypot(b.x-P.x,b.y-P.y)?n:b,null);
      L.nodeSeen??=at;useWeapon('sword');tx=n.x;ty=n.y;
    }
    else{
      // בזירה עם חרב נצמדים לאויב הקרוב, ובורחים רק עם קשת או בחיים נמוכים (QUINN, 8.11: הבריחה מכל אויב ב-220 מתחה את הגלים, והבוס לא הגיע עד 600 שניות)
      const n=nearest(220),melee=S.wv&&S.wv.phase==='fight'&&P.weapon==='sword'&&P.hp>P.maxHp*0.35;
      if(n&&melee){tx=n.x;ty=n.y;stop=n.r+30}
      else if(n){tx=n.x;ty=n.y;flee=true}
      else if(S.wv&&S.wv.phase==='fight'){   // הזירה (arenas.js): אף אחד לא קרוב, אז כמו שחקן הולכים לאויב הקרוב בגל (רחוקים ישנים ומתקרבים לאט)
        const e=enemies.reduce((b,e)=>e.dead||e.wv==null||b&&Math.hypot(b.x-P.x,b.y-P.y)<=Math.hypot(e.x-P.x,e.y-P.y)?b:e,null);
        if(e){tx=e.x;ty=e.y;stop=P.weapon==='sword'?e.r+40:180}}
      if(wHeld().length>1&&(document.getElementById('swap').classList.contains('hint')||S.t-m.swapAt>10)){swapWeapon();L.swaps++;m.swapAt=S.t}
    }
  }
  return steer(tx,ty,flee,stop,L);
}
// הגוף פונה לאן שהולכים (P.face, update.js): כשהגוף כבר הספיק להסתובב אל כיוון הג'ויסטיק, הזווית צריכה להיות בדיוק כיוון הג'ויסטיק,
// גם בזירה כשיש אויב קרוב. בכפר בודקים גם את הדמות בתלת-ממד.
// כמה זמן הגוף הסתובב סופרים בתוך movePlayer עצמו (עטיפה), ולא לפי המרחק שהלך: עצירה קצרה (hitstop), האטה או מהירות שהשתנתה באמצע הצעד
// הפרידו בין המרחק לזמן הסיבוב, וגרמו לכשל אקראי אחד מתוך כ-1700 (main, 2.11.2026)
function faceStep(m,L){
  const F=L.face||(L.face={n:0,bad:0,max:0,arena:0,n3:0,bad3:0});
  if(!m.fwrap){m.fwrap=1;const mp=movePlayer;
    movePlayer=function(dt){const f0=P.face,r=mp.apply(this,arguments),a=P.moving&&joy?Math.atan2(joy.dy,joy.dx):null;
      if(a===null||a!==m.fa||P!==m.fp){m.fa=a;m.fp=P;m.ft=0;m.fd=a===null?0:Math.abs(angDiff(a,f0))}   // כיוון חדש: כמה צריך להסתובב
      m.ft+=dt;return r}}
  // רק אחרי לפחות חצי צעד של הליכה באותו כיוון, ורק כשהיה מספיק זמן להסתובב (MOVE.turn רדיאנים בשנייה)
  if(!joy||!P.moving||S.mode!=='play'||P.power>0||P!==m.fp||m.fa!==Math.atan2(joy.dy,joy.dx)||m.ft<0.1||m.ft*MOVE.turn<m.fd+0.05)return;
  const d=Math.abs(angDiff(P.face,Math.atan2(joy.dy,joy.dx)));
  F.n++;if(!S.vil&&!S.wd&&!S.room&&nearest(440))F.arena++;F.max=Math.max(F.max,Math.round(d*100)/100);
  if(d>0.1){F.bad++;F.where=(S.vil?'כפר':S.wd?'עולם':S.room?'חדר':'זירה')+' '+Math.round(d*100)/100}   // 0.1 רדיאנים: כ-6 מעלות, לא רואים בעין
  if(R3D.on&&S.vil&&R3D.player){F.n3++;if(Math.abs(angDiff(R3D.player.root.rotation.y,yawOf(Math.cos(P.face),Math.sin(P.face))))>0.15)F.bad3++}
}
/* חיית המחמד (pet.js): כמה פעמים היא קרובה לשחקן, באילו מצבים נראתה, ושהחפירה מוציאה שלל לרצפה.
   בעולם הפתוח היא חופרת מיד (בלי לחכות לזמן), ואחרי החפירה הראשונה מוסיפים לה XP בכוח, פעמיים, ובודקים שהיא עוברת את שני השלבים ונשמרת.
   גזר: נותנים לבוט גזר, מקרבים אותה, ובודקים שהכפתור מופיע, שהלחיצה מורידה גזר, מוסיפה XP, מפעילה חיזוק ולבבות.
   תקיפה: סופרים נשיכות, נזק וחזרות לשחקן, כמה רחוק היא הגיעה ממנו בזמן תקיפה, ושבעולם היא לא יצאה מהגבולות */
function petBot(m,L){
  const p=S.pet,Q=L.pet||(L.pet={n:0,near:0,st:{},digs:0,dug:[],drop:false,evo:null,bites:0,dealt:0,ret:0,far:0,oob:0,feed:null});if(!p||!petHere())return;
  if(S.mode==='play'&&!['go','dig','jump','hunt','back'].includes(p.st)){Q.n++;if(Math.hypot(p.x-P.x,p.y-P.y)<200)Q.near++}
  Q.st[p.st]=(Q.st[p.st]||0)+1;
  if(R3D.on&&R3D.pet){Q.r3=R3D.pet.root.visible;Q.clips=Object.values(DOG_ANIM).filter(c=>!R3D.clips[c]).join(',')||'ok'}
  if(S.wd&&!m.petDig&&S.mode==='play'){m.petDig=1;p.digT=0}
  if(S.wd&&S.mode==='play'&&(Q.wBites||0)<3&&p.st!=='hunt'&&p.st!=='back')p.atkCd=0;   // בעולם: תוקפת מיד כשיש אויב קרוב, בלי לחכות למנוחה
  if(p!==m.petP){m.petP=p;m.petDigs0=Q.digs;m.petB0=[Q.bites,Q.dealt,Q.ret]}
  Q.digs=m.petDigs0+p.digs;Q.bites=m.petB0[0]+p.bitesAll;Q.dealt=m.petB0[1]+p.dealt;Q.ret=m.petB0[2]+p.returns;
  if(S.wd)Q.wBites=Math.max(Q.wBites||0,p.bitesAll);else if(!S.vil&&!S.room)Q.aBites=Math.max(Q.aBites||0,p.bitesAll);   // תוקפת רק בעולם
  Q.far=Math.max(Q.far,Math.round(p.far||0));
  if(S.wd){const B=WORLD.size;if(Math.abs(p.x)>B.w/2||Math.abs(p.y)>B.h/2)Q.oob++}
  // גזר: פעם אחת, במקום הראשון שהיא פנויה בו
  if(S.mode==='play'&&!m.petFed){const b=document.getElementById('feedBtn');
    if(!m.petCarrot){m.petCarrot=1;Q.leash=PET.attack.leash;bagAdd(PET.feed.res,1)}
    if(b&&!b.hidden){const xp=SAVE.pet.xp,c=SAVE.bag[PET.feed.res]||0;b.click();m.petFed=1;
      Q.feed={btn:true,xp:Math.round(SAVE.pet.xp-xp),ate:c-(SAVE.bag[PET.feed.res]||0),buff:SAVE.pet.buff,hearts:p.hearts.length,fed:SAVE.pet.fed,hide:b.hidden,
        saved:JSON.parse(localStorage.getItem(SAVE_STORE.key)).pet.fed===SAVE.pet.fed}}
    else if(!['hunt','back','go','dig'].includes(p.st)){p.x=P.x+30;p.y=P.y;p.feedCd=0;m.petTry=(m.petTry||0)+1}}if(p.dug.length)Q.dug=[...new Set([...Q.dug,...p.dug])];
  if((S.gd||[]).some(d=>d.pet))Q.drop=true;
  if(Q.digs&&!m.petEvo&&S.mode==='play'){   // XP בכוח: שלב 1 → 2 → 3
    const st=petKind().stages,a=SAVE.pet.stage;petXP(st[1].xp-SAVE.pet.xp);const b=SAVE.pet.stage;petXP(st[2].xp-SAVE.pet.xp);
    m.petEvo=1;Q.evo=[a,b,SAVE.pet.stage].map(s=>s+1).join('→');Q.evoSaved=JSON.parse(localStorage.getItem(SAVE_STORE.key)).pet.stage===2;Q.evoFx=FX.length>0}
  if(SAVE.pet.stage===2&&S.mode==='play')Q.fxOk=!R3D.on||!!PET_FX.tail;   // בתלת-ממד: הלהבה בקצה הזנב יודעת איפה הזנב
}
// מזיז את השחקן לכיוון (tx,ty), או הרחק ממנו (flee), עד מרחק stop. בלי יעד: הולך במעגל
function steer(tx,ty,flee,stop,L){
  let dx=0,dy=0;
  if(tx!=null){const d=Math.hypot(tx-P.x,ty-P.y)||1;if(flee||d>stop){
    let gx=tx,gy=ty;if(S.wd&&!flee&&typeof TR!=='undefined'&&TR){const t=tDir(P,tx,ty);gx=t.x;gy=t.y}   // בעולם עם מפה: מסביב לנהר וליער (A* ב-terrain.js)
    const g=Math.hypot(gx-P.x,gy-P.y)||1;dx=(gx-P.x)/g;dy=(gy-P.y)/g;if(flee){dx=-dx;dy=-dy}}}
  else{const a=S.t*0.6;dx=Math.cos(a);dy=Math.sin(a)}
  joy={id:-1,ox:-999,oy:-999,dx,dy};
  return L;
}
/* בכפר: מקבלים קווסט מהיומן, בונים מנסרה, מדמים שעתיים בלי לשחק ואוספים את העץ, ויוצאים בשער.
   כשחוזרים מהזירה בודקים שהשלל הגיע, ולוקחים את פרס הקווסט */
function villageBot(m,L){
  const bag=()=>Object.assign({},SAVE.bag),B=VILLAGE.b.mill,g=VILLAGE.gate,saved=()=>JSON.parse(localStorage.getItem(SAVE_STORE.key));
  const qBtn=act=>document.querySelector('#qLog [data-q="'+m.qid+'"][data-act="'+act+'"]');
  // מבנים בנגיעה (בדיקת החוויה, 1.11): עומדים ליד מבנה כמה צעדים, בודקים שלא נפתח שום חלון, ורק אז לוחצים "להיכנס" בסרגל
  const enter=k=>{if(S.vil.near!==k)return false;const pn=document.getElementById('vPanel');if(!pn.hidden&&S.vil.open===k)return true;
    if((m.pass=(m.pass||0)+1)<4)return false;
    if(L.passNoPanel==null)L.passNoPanel=pn.hidden&&!S.vil.open;
    const b=document.getElementById('vEnter');if(b&&!b.hidden){L.enterBtn=L.enterBtn||b.innerText;b.click()}
    return !pn.hidden&&S.vil.open===k};
  if(m.home){   // חזרנו מהזירה
    if(L.back==null){L.back=S.t;const now=bag(),got=[];for(const r in now){const d=now[r]-(m.runBag[r]||0);if(d>0)got.push(r+' +'+d)}
      L.lootGot=got.join(', ');L.lootSaved=JSON.stringify(saved().bag)===JSON.stringify(SAVE.bag)
      const st=JSON.parse(localStorage.getItem(SAVE_STORE.key)).hero.style;L.style={};for(const k in st)L.style[k]=Math.round(st[k])}   // סגנון המשחק, כפי שנשמר
    else if(L.boots==null){   // פרס הנעליים: נלבשות מיד, והמהירות עולה
      document.getElementById('qBtn').click();const b=document.querySelector('#qLog [data-q="boots"][data-act="claim"]'),sp=P.speed;
      const s0=gearStats().speed||0;if(b)b.click();const k=Math.round((100+s0+GEAR.items.starterBoots.stats.speed)/(100+s0)*1000)/1000;   // אחוזי מהירות מתחברים: עם עוד מהירות (זריזות, עץ) הנעליים מוסיפות קצת פחות מ-8%
      L.boots={claimed:!!b&&SAVE.quests.done.boots===1,worn:SAVE.gear.boots.includes('starterBoots'),k:Math.round(P.speed/sp*1000)/1000,want:k,
        saved:JSON.parse(localStorage.getItem(SAVE_STORE.key)).gear.boots.includes('starterBoots'),sp:Math.round(P.speed)};
      document.querySelector('#qLog [data-act="close"]').click()}
    else if(L.qClaimed==null){   // פותחים את היומן ולוקחים את הפרס: הוא צריך להגיע לתרמיל ולשמירה
      document.getElementById('qBtn').click();const btn=qBtn('claim'),rw=QUESTS.list.find(q=>q.id===m.qid).reward,before=bag(),xp=SAVE.hero.xp;
      if(btn)btn.click();
      L.qClaimed=!!btn&&!SAVE.quests.active[m.qid]&&SAVE.quests.done[m.qid]===1;
      L.qPaid=Object.keys(rw).every(k=>k==='xp'?SAVE.hero.xp-xp===rw.xp:(SAVE.bag[k]||0)-(before[k]||0)===rw[k]);
      L.qReward=JSON.stringify(rw);L.qFx=FX.some(f=>f.K===CELEBRATE.quest);
      const sv=saved();L.qSaved=sv.quests.done[m.qid]===1&&!sv.quests.active[m.qid]&&JSON.stringify(sv.bag)===JSON.stringify(SAVE.bag)}
    return steer(null,null,false,0,L)}
  if(!m.vil){m.vil=1;L.vilOpen=!!S.vil;const mr=document.querySelector('#vBag .resmore');L.topBar=(document.querySelectorAll('#vBag .res').length+(mr?+mr.textContent.slice(1):0))+'/'+resShown(null).length;L.topMax=document.querySelectorAll('#vBag .res').length<=UI.top;L.gift=JSON.stringify(SAVE.bag);L.vilModels=R3D.on?(R3D.vil?R3D.vil.g.children.length:0):null;
    // כמה הולכים בקו ישר: מהכניסה לכפר עד השער, ומהשער בעולם עד השער הקרוב לזירה
    const h=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),wa={x:WORLD.home.x,y:WORLD.home.y+WORLD.arrive},wg=Object.values(WORLD.gates).sort((a,b)=>h(a,wa)-h(b,wa))[0];
    L.walkPx=Math.round(h(VILLAGE.spawn,VILLAGE.gate)+h(wa,wg));L.walkSp=Math.round(P.speed)}
  if(!m.qid){   // יומן הקווסטים: מקבלים את הקווסט הראשון שמבקש להפיל אויבים. היומן נשאר פתוח לצעד אחד, לצילום
    m.qid=(QUESTS.list.find(q=>q.kind==='village'&&q.obj[0].type==='kill'&&qOpen(q))||{}).id;
    document.getElementById('qBtn').click();L.qLogTxt=document.querySelector('#qLog h3').textContent;
    const btn=qBtn('accept');if(btn)btn.click();
    // הקווסט של הנעליים מראש הכפר: 5 עץ בעולם
    const bb=document.querySelector('#qLog [data-q="boots"][data-act="accept"]');if(bb)bb.click();L.bootsAcc=!!SAVE.quests.active.boots;
    L.qAccepted=!!SAVE.quests.active[m.qid]&&!!saved().quests.active[m.qid];L.qName=m.qid;L.qDaily=SAVE.quests.daily.length;
    return steer(null,null,false,0,L)}
  if(!document.getElementById('qLog').hidden){document.querySelector('#qLog [data-act="close"]').click();return steer(null,null,false,0,L)}
  if(vLv('mill')===0){   // הולכים למנסרה ובונים אותה
    if(enter('mill')){const before=bag(),btn=document.querySelector('#vPanel [data-act="up"]');L.panel=document.getElementById('vPanel').innerText.split('\n')[0];
      if(btn&&!btn.disabled){btn.click();L.built=vLv('mill');L.fx=FX.length>0&&vLook('mill')===null;L.paid=Object.keys(before).filter(r=>(SAVE.bag[r]||0)<before[r]).map(r=>r+' -'+(before[r]-(SAVE.bag[r]||0))).join(', ');
        L.builtSaved=JSON.parse(localStorage.getItem(SAVE_STORE.key)).village.mill===1}else L.built=0}
    return steer(B.x,B.y,false,0,L)}
  if(!m.away){   // כאילו השחקן לא שיחק שעתיים: התוצרת מצטברת עד המחסן
    m.away=1;m.wood=SAVE.bag.wood||0;vProd('mill').t-=2*3600e3;L.expect=Math.min(B.cap[1],B.make.wood[1]*2);return steer(B.x,B.y,false,0,L)}
  if(L.collected==null){   // ליד המנסרה: מחכים לעדכון המלאי, ולוחצים "לאסוף" בפאנל
    const cb=enter('mill')&&document.querySelector('#vPanel [data-act="collect"]');
    if(cb&&!cb.disabled){cb.click();L.collected=(SAVE.bag.wood||0)-m.wood}
    return steer(B.x,B.y,false,0,L)}
  if(m.gear!==2){   // מסך הציוד: פותחים, לוחצים על קשת העץ כדי להשוות, ואז גוררים אותה למשבצת הנשק
    const d=()=>document.getElementById('gDetail').innerText.replace(/\s+/g,' ').trim();
    if(!m.gear){m.gear=1;m.gdmg0=P.gn.dmg;document.getElementById('gearBtn').click();L.gearOpen=S.mode==='gear'&&!document.getElementById('ovGear').hidden;return L}
    // גרירה כמו של אצבע: לוחצים על הפריט, זזים עד המשבצת ומשחררים שם (pointer events, כמו בטלפון)
    const drag=(from,to)=>{const at=el=>{const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}},a=at(from),b=at(to),
      ev=(t,el,p)=>el.dispatchEvent(new PointerEvent(t,{bubbles:true,cancelable:true,pointerId:9,isPrimary:true,button:0,clientX:p.x,clientY:p.y}));
      ev('pointerdown',from,a);ev('pointermove',to,{x:(a.x+b.x)/2,y:(a.y+b.y)/2});ev('pointermove',to,b);ev('pointerup',to,b)};
    const it=document.querySelector('#gItems [data-id="oakBow"]'),acc=document.querySelector('#gSlots [data-slot="acc"][data-i="0"]');
    // גרירה אסורה: קשת למשבצת אקססוריז. המשבצת רועדת, והקשת נשארת בתרמיל
    if(it&&acc){const a0=SAVE.gear.acc[0];drag(it,acc);L.gearBad=SAVE.gear.acc[0]===a0&&SAVE.bag.oakBow===1&&SAVE.gear.weapon!=='oakBow'&&acc.classList.contains('shake')}
    // חגיגה רק כשזה שיפור. הלוחם כבר מחזיק חרב עץ, וקשת עץ שווה לה, אז כאן לא אמורה להיות חגיגה
    const it2=document.querySelector('#gItems [data-id="oakBow"]');
    if(it2){L.gearBetter=gScore('oakBow')>gScore(SAVE.gear.weapon);it2.click();L.gearCmp=d();drag(document.querySelector('#gItems [data-id="oakBow"]'),document.querySelector('#gSlots [data-slot="weapon"]'));L.gearDrag=SAVE.gear.weapon==='oakBow'}
    const sv=JSON.parse(localStorage.getItem(SAVE_STORE.key));
    L.gearEquip=SAVE.gear.weapon;L.gearFx=FX.some(f=>f.K===CELEBRATE.gear)&&!!document.querySelector('#gSlots .pop');L.gearSaved=sv.gear.weapon==='oakBow'&&!sv.bag.oakBow;
    document.getElementById('gearClose').click();L.gearClosed=S.mode==='play'&&document.getElementById('ovGear').hidden;m.gear=2;return L}
  if(m.age!==5){   // נפחייה: Aging על קשת העץ שלבושה. הצלחה מעלה רמה וסטטים, כישלון מוריד רמה, ואבן חן מגינה
    const F=VILLAGE.b.forge,q=s=>document.querySelector(s);
    if(!m.age){m.age=1;SAVE.village.forge=Math.max(1,vLv('forge'));bagAdd('coins',100);bagAdd('stone',40);bagAdd('gem',1);return steer(F.x,F.y,false,0,L)}
    if(m.age===1){
      if(!enter('forge'))return steer(F.x,F.y,false,0,L);
      const fb=q('#vPanel [data-act="forge"]');if(!fb)return steer(F.x,F.y,false,0,L);
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
    // כוחות (powers.js): לשונית בנפחייה, מוציאים כוח מחרב שבתרמיל (היא נהרסת), ומטביעים אותו על הקשת שלבושה. הנזק מרחוק עולה
    if(m.age===2&&!m.pow){
      const W=L.pow={},box=()=>SAVE.powers||{};bagAdd('coins',300);bagAdd('iron',5);bagAdd('oakSword#hunt');
      q('#fTabs [data-tab="pow"]').click();W.tab=AUI.tab==='pow';
      W.roll=gPow(powRoll('ironRing',0))!=null&&powRoll('ironRing',0.99)==='ironRing';
      q('#fItems [data-id="oakSword#hunt"]').click();W.line=!!q('#fDetail .gpow');
      q('#fDetail [data-act="extract"]').click();W.out=box().hunt===1&&!SAVE.bag['oakSword#hunt'];
      q('#fItems [data-slot="weapon"]').click();const d0=gearStats().gdmg||0;FX.length=0;
      const pb=q('#fDetail [data-pw="hunt"]');if(pb)pb.click();q('#fDetail [data-act="imprint"]').click();
      const d1=gearStats().gdmg||0;W.dmg=d0+'→'+d1;
      W.in=gPow(SAVE.gear.weapon)==='hunt'&&Math.abs(d1-d0-POWERS.list.hunt.give.gdmg)<0.01&&!box().hunt&&FX.some(f=>f.K===CELEBRATE.aging);
      W.saved=/#hunt$/.test(JSON.parse(localStorage.getItem(SAVE_STORE.key)).gear.weapon);
      if(LANG==='en'&&/[֐-׿]/.test(q('#ovForge').innerText))L.heLeak=q('#ovForge').innerText.trim().slice(0,80);
      m.pow=1;L.powOpen=1;return L}   // המסך נשאר פתוח לצעד אחד, בשביל הצילום
    // התכה (fuse.js): גחלים + כפור = אדים (הצלחה), ואז אדים + תלתן = שביט (שלושה חלקים) שנכשל: הולכים המשאבים והתלתן, והאדים נשארים
    if(m.age===2&&!m.fuse){
      const U=L.fuse={},press=roll=>{const r=Math.random;Math.random=()=>roll;try{const b=q('#fDetail [data-act="fuse"]');U.btn=!!b&&!b.disabled;if(b)b.click()}finally{Math.random=r}};
      bagAdd('emberOrb');bagAdd('frostOrb');bagAdd('cloverOrb');bagAdd('star',3);bagAdd('coins',300);
      const bar=()=>[...document.querySelectorAll('#fRes [data-tip]')].map(e=>e.dataset.tip).join();
      q('#fTabs [data-tab="fuse"]').click();U.tab=AUI.tab==='fuse';U.bar=bar();   // הפס העליון בהתכה: רק 🌟, 💎 ומטבעות (fuse.js, fuseRes)
      U.same=fuseOut('emberOrb','steamOrb').why==='same'&&fuseOut('trinityOrb','cloverOrb').why==='big';
      q('#fItems [data-id="emberOrb"]').click();q('#fItems [data-id="frostOrb"]').click();
      U.odds=(q('#fDetail .odds')||{}).innerText;U.out=(q('#fDetail h3')||{}).innerText;
      const st0=SAVE.bag.star||0,c0=SAVE.bag.coins||0;FX.length=0;press(0);
      U.ok=!!SAVE.bag.steamOrb&&!SAVE.bag.emberOrb&&!SAVE.bag.frostOrb&&FX.some(f=>f.K===CELEBRATE.aging);
      U.cost=st0-(SAVE.bag.star||0)===FUSE.cost[2].star&&c0-(SAVE.bag.coins||0)===FUSE.cost[2].coins;
      q('#fItems [data-id="cloverOrb"]').click();U.out3=fuseOut('steamOrb','cloverOrb').id;
      const st1=SAVE.bag.star||0;FX.length=0;press(0.9999);
      U.fail=!!SAVE.bag.steamOrb&&!SAVE.bag.cloverOrb&&!SAVE.bag.cometOrb&&st1-(SAVE.bag.star||0)===FUSE.cost[3].star&&FX.some(f=>f.K===CELEBRATE.agingFail);
      const sv=JSON.parse(localStorage.getItem(SAVE_STORE.key)).bag;U.saved=!!sv.steamOrb&&!sv.cloverOrb&&!sv.emberOrb;
      if(LANG==='en'&&/[֐-׿]/.test(q('#ovForge').innerText))L.heLeak=q('#ovForge').innerText.trim().slice(0,80);
      q('#fTabs [data-tab="age"]').click();U.barAge=bar();U.barAgeOk=/^gem,coins/.test(U.barAge)&&U.barAge.split(',').length<=FORGE_BAR.max;   // בשדרוג בלי פריט: 💎, מטבעות, ועד FORGE_BAR.max
      // הרבה משאבים (ניר, 3.11: "רואים רק את המשאבים"): הפס בשורה אחת, והפריטים וכפתור השדרוג בתוך המסך. אחר כך התרמיל חוזר כמו שהיה
      const keep={...SAVE.bag},keepBk=JSON.stringify(BK()),inV=e=>{if(!e)return false;const r=e.getBoundingClientRect();return r.height>0&&r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1};
      for(const k in RES.list)bagAdd(k,50);forgeDraw();q('#fItems [data-slot="weapon"]').click();
      const C=U.crowd={tile:inV(q('#fItems [data-slot="weapon"]')),go:inV(q('#fDetail [data-act="age"]')),h:Math.round(q('#fRes').getBoundingClientRect().height),more:!!q('#fRes .resmore')};
      C.need=Object.keys(ageCost(SAVE.gear.weapon)||{}).every(r=>bar().split(',').includes(r));   // מה שהשדרוג צריך תמיד בפס
      if(C.more){q('#fRes .resmore').click();C.all=!q('#fRes .resmore')&&bar().split(',').length>FORGE_BAR.max}
      for(const k of Object.keys(SAVE.bag))delete SAVE.bag[k];Object.assign(SAVE.bag,keep);SAVE.book=JSON.parse(keepBk);AUI.sel=null;   // גם ספר ההרפתקאות: המשאבים לא נרשמים בו
      q('#fTabs [data-tab="fuse"]').click();
      m.fuse=1;L.fuseOpen=1;return L}   // המסך נשאר פתוח לצעד אחד, בשביל הצילום
    if(m.age===2){q('#forgeClose').click();L.ageClosed=S.mode==='play';m.age=3;return L}
    // הזוהר: לרגע הקשת היא +10, ובודקים שיש שובל וחלקיקים על הנשק
    if(m.age===3){m.age=4;SAVE.gear.weapon='oakBow+10';P.weapon='gun';L.glowOn=1;return L}
    // החלקיקים יוצאים באקראי (rate בשנייה, aging.js), אז מחכים עד כ-2 שניות של פריימים לפני שקובעים שאין
    m.ageT=(m.ageT||0)+1;if(!AGE_FX.parts.length&&m.ageT<120)return L;
    L.glow={trail:AGE_FX.trail.length,parts:AGE_FX.parts.length,hand:!!AGE_FX.hand};SAVE.gear.weapon='oakBow+1';m.age=5;return L}
  if(!m.stash){   // המחסן: בונים, מכניסים את חרב העץ ועץ, ומחזירים את החרב לתרמיל
    const St=VILLAGE.b.stash;
    if(S.vil.near!=='stash')return steer(St.x,St.y,false,0,L);
    // כאן נוגעים במבנה עצמו בקנבס, כמו אצבע: נגיעה קצרה בלי לגרור פותחת את הפאנל שלו
    if(S.vil.open!=='stash'){const cx=(St.x-S.cam.x+W/2)*ZOOM,cy=(St.y-S.cam.y+H/2)*ZOOM,cv=document.getElementById('c'),
      ev=t=>cv.dispatchEvent(new PointerEvent(t,{bubbles:true,cancelable:true,pointerId:11,isPrimary:true,button:0,clientX:cx,clientY:cy}));
      if(!m.tapTry){m.tapTry=1;joy=null;ev('pointerdown');ev('pointerup');L.tapOpen=S.vil.open==='stash'&&!document.getElementById('vPanel').hidden}
      if(S.vil.open!=='stash'&&!enter('stash'))return steer(St.x,St.y,false,0,L)}
    m.stash=1;const q=s=>document.querySelector('#vPanel '+s),up=q('[data-act="up"]');
    if(up&&!up.disabled)up.click();L.stashLv=vLv('stash');
    // נגיעה מעבירה BWIN.move, ולחיצה ארוכה הכל (bwin.js מסמן אותה ב-data-n="all")
    const w0=SAVE.bag.wood||0,mv=(d,r,all)=>{const b=q('[data-act="stash"][data-dir="'+d+'"][data-r="'+r+'"]');if(b){if(all)b.dataset.n='all';b.click()}return!!b};
    const s0=SAVE.bag.oakSword||0;   // כמה חרבות עץ בתרמיל: הלוחם מקבל אחת בבחירה ועוד אחת במתנה
    const swIn=mv('in','oakSword')&&SAVE.stash.oakSword===1&&(SAVE.bag.oakSword||0)===s0-1;   // פריט עובר אחד-אחד
    const w1=Math.min(BWIN.move,w0),wTap=mv('in','wood')&&SAVE.stash.wood===w1&&(SAVE.bag.wood||0)===w0-w1;
    const wIn=wTap&&(SAVE.bag.wood?mv('in','wood',true):true)&&SAVE.stash.wood===w0&&!SAVE.bag.wood;
    const swOut=mv('out','oakSword')&&SAVE.bag.oakSword===s0&&!SAVE.stash.oakSword;
    const sv=JSON.parse(localStorage.getItem(SAVE_STORE.key));
    L.stash={move:BWIN.move,swIn,wTap,wIn,swOut,saved:sv.stash.wood===w0&&!sv.stash.oakSword&&sv.bag.oakSword===s0,cap:stashCap(),used:stashUsed()};
    return L}
  if(m.npc!==3){   // תושבים: הולכים לנפח, לוחצים "לדבר", מקבלים ממנו קווסט, ורואים אותו ביומן. בודקים שהם לא חוסמים, ושהוא מריע לשדרוג
    const n=npcAt('smith'),dlg=document.getElementById('npcDlg'),tb=document.getElementById('talkBtn');
    if(!n){L.npc={err:'אין נפח'};m.npc=3;return L}
    if(!m.npc){
      if(S.vil.npcNear!=='smith'||tb.hidden)return steer(n.x,n.y,false,25,L);
      const N=L.npc={waved:n.waved,btn:tb.innerText,auto:!dlg.hidden&&!S.vil.dlgStay};tb.click();
      const acc=dlg.querySelector('[data-act="accept"]'),qid=acc&&acc.dataset.q;
      N.open=!dlg.hidden;N.say=(dlg.querySelector('.npcsay')||{}).innerText;N.qid=qid;
      if(acc)acc.click();
      N.got=!!qid&&!!SAVE.quests.active[qid]&&QBY[qid].giver==='smith'&&!!JSON.parse(localStorage.getItem(SAVE_STORE.key)).quests.active[qid];
      N.after=!!dlg.querySelector('[data-q="'+qid+'"][data-act="track"]');
      if(LANG==='en'&&/[֐-׿]/.test(dlg.innerText))L.heLeak=dlg.innerText.trim().slice(0,80);
      L.npcTalk=1;m.npc=1;return steer(null,null,false,0,L)}   // השיחה נשארת פתוחה לצעד אחד, בשביל הצילום
    const N=L.npc;
    if(m.npc===1){
      document.getElementById('qBtn').click();N.inLog=!!document.querySelector('#qLog [data-q="'+N.qid+'"]');N.closed=dlg.hidden;
      // לא חוסמים: עומדים בדיוק על כל תושב, והוא לא דוחף. ואף אחד לא עומד על הדרך לשער או בתוך מבנה
      const p0={x:P.x,y:P.y},j=joy;joy=null;let push=0;
      for(const id in NPC.list){const t=npcState()[id];P.x=t.x;P.y=t.y;villageUpdate(0.001);push=Math.max(push,Math.hypot(P.x-t.x,P.y-t.y))}
      P.x=p0.x;P.y=p0.y;joy=j;N.push=Math.round(push);
      N.free=Object.keys(NPC.list).every(id=>npcFree(NPC.list[id].at.x,NPC.list[id].at.y)&&npcFree(npcState()[id].x,npcState()[id].y));
      n.seenL=vLv('forge')-1;m.npc=2;return steer(null,null,false,0,L)}   // כאילו הנפחייה עלתה רמה עכשיו
    N.cheer=n.st==='cheer';N.n=Object.keys(npcState()).filter(npcHere).length;m.npc=3;return steer(null,null,false,0,L)}
  if(!m.tour){   // הכפר הגדול (2.11): הולכים לכל מבנה. בכל אחד מופיע "להיכנס", והשלט שלו על המסך (בלי חפיפה, vSignsFlush)
    const Tu=L.tour||(L.tour={seen:[],sign:[],t0:S.t,n:Object.keys(VILLAGE.b).length});m.tq=m.tq||Object.keys(VILLAGE.b);
    const k=m.tq[0];if(!k){m.tour=1;Tu.sec=Math.round(S.t-Tu.t0);return steer(null,null,false,0,L)}
    if(S.vil.here===k){m.tw=(m.tw||0)+1;if(m.tw>3){m.tw=0;Tu.seen.push(k);if((VSIGN.shown||[]).some(t=>t.includes(T('vil.'+k))))Tu.sign.push(k);m.tq.shift()}return steer(null,null,false,0,L)}
    if(S.t-Tu.t0>90){m.tour=1;Tu.stuck=k;return L}
    const B=VILLAGE.b[k];return steer(B.x,B.y+B.r,false,0,L)}
  m.runBag=bag();L.gateAt=1;   // לשער
  // עומדים בשער ודוחפים לתוכו כשנייה: זה לא אמור להוציא מהכפר. רק לחיצה על הכפתור בפאנל מוציאה לעולם
  // ליד השער לא נפתח חלון: "לעולם" בסרגל יוצא (ואם יש פנס דולק, פותח את "לאן?")
  if(S.vil.gate&&++m.atGate>=5){L.gateNoRun=!!S.vil&&document.getElementById('vPanel').hidden;const go=document.getElementById('vEnter');L.gateBtn=go&&!go.hidden?go.innerText:null;if(L.gateBtn)go.click();
    const g2=S.vil&&document.querySelector('#vPanel [data-act="go"]');if(g2)g2.click()}
  return steer(g.x,g.y,false,0,L);
}

/* בעולם הפתוח: כורתים עץ, מפילים אויב (יצור משאב, אם יש), ונכנסים לזירה בשער החורשה.
   כשחוזרים מהזירה בודקים שחזרנו לאותו שער ושהשלל הגיע לתרמיל, ואז נופלים בכוונה: חצי מכל משאב הולך, פריטים והמחסן נשארים */
function worldBot(m,L,god){
  const W=S.wd,bag=()=>Object.assign({},SAVE.bag),saved=()=>JSON.parse(localStorage.getItem(SAVE_STORE.key)),vis=id=>!document.getElementById(id).hidden;
  const stay=()=>{joy=null;return L},far=(a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y);
  if(m.wp==='dead'){   // מסך המוות: מה אבד ומה נשאר. צעד אחד מסתכלים (וצילום), ובצעד הבא קמים בכפר
    if(!vis('ovWDeath'))return stay();
    if(L.wDeathTxt==null){L.wDeathTxt=document.getElementById('wLost').innerText.replace(/\s+/g,' ').trim();return stay()}
    document.getElementById('wRespawn').click();L.wRespawn=!!S.vil&&document.getElementById('ovWDeath').hidden;m.wp='done';return L}
  if(god&&m.wp!=='die')P.hp=P.maxHp;
  // טווח ההתקפה בעולם: כל מכה ישירה (לא ברק שקפץ) נמדדת, והרחוקה ביותר נרשמת
  if(!m.hitHook){m.hitHook=1;const d0=damage;damage=function(e,b,w,a,t,ch){if(S.wd&&!ch&&w!=='pet'){const d=Math.hypot(e.x-P.x,e.y-P.y)-(e.r||0);L.wHitMax=Math.max(L.wHitMax||0,Math.round(d));L.wHits=(L.wHits||0)+1}return d0.apply(this,arguments)}}
  L.wRange=WORLD.attackRange;   // רק מכות של השחקן: נשיכות של פיוחו (w='pet') רצות רחוק יותר, עד PET.attack.leash
  if(!m.wp){m.wp='gather';L.wEnter=!S.vil&&S.mode==='play';L.wName=document.getElementById('wName').textContent;L.wHud=vis('whud')&&!vis('vhud');
    if(TR){const rc=terrainReach(WORLD,'meadow');L.wTerr={ms:TR.ms,size:WORLD.size.w+'×'+WORLD.size.h,bad:terrainBad(WORLD,'meadow'),un:Object.keys(rc).filter(k=>!rc[k]),n:Object.keys(rc).length,lazy:W.groups.filter(g=>g.lazy).length,river:tBlocked(WORLD.map.rivers[0].pts[5][0],WORLD.map.rivers[0].pts[5][1]),bridge:!tBlocked(WORLD.map.bridges[0].x,WORLD.map.bridges[0].y),ford:tSlow(WORLD.map.fords[0].x,WORLD.map.fords[0].y)}}   // המפה של האחו (terrain.js)
    if(TR&&WORLD.regions.lake.map){const LR=WORLD.regions.lake,M=LR.map,rc=terrainReach(LR,'lake');   // אגם הערפל הגדול (js/map-lake.js): נבנה ונבדק כאן, ואז חוזרים למפה של האחו
      L.wLake={ms:TR.ms,bad:terrainBad(LR,'lake'),un:Object.keys(rc).filter(k=>!rc[k]),n:Object.keys(rc).length,lake:tBlocked(-600,700),isle:!tBlocked(LR.waystones[1].x,LR.waystones[1].y),swamp:tSlow(M.marks.find(m=>m.id==='boards').x,M.marks.find(m=>m.id==='boards').y)};terrainEnter(WORLD,'meadow')}
    if(TR&&WORLD.regions.ridge.map){const RR=WORLD.regions.ridge,M=RR.map,rc=terrainReach(RR,'ridge');   // הרכס הקפוא הגדול (js/map-ridge.js)
      L.wRidge={ms:TR.ms,bad:terrainBad(RR,'ridge'),un:Object.keys(rc).filter(k=>!rc[k]),n:Object.keys(rc).length,crag:tBlocked(-1100,-200),gap:tBlocked(2180,520)&&!tBlocked(M.bridges[0].x,M.bridges[0].y)};terrainEnter(WORLD,'meadow')}
    if(TR&&WORLD.regions.shadow.map){const SR=WORLD.regions.shadow,rc=terrainReach(SR,'shadow');   // לב הצל הגדול (js/map-shadow.js): ארבעה חלקים סביב התהום
      L.wShadow={ms:TR.ms,bad:terrainBad(SR,'shadow'),un:Object.keys(rc).filter(k=>!rc[k]),n:Object.keys(rc).length,abyss:tBlocked(-700,0),bone:!tBlocked(-10,25),rocks:typeof SROCKS!=='undefined'&&[SROCKS.shore[0],SROCKS.shore[1],SROCKS.isle].every(q=>!tBlocked(q.x,q.y))&&tBlocked(1150,-600),wood:tBlocked(-2400,-400)};terrainEnter(WORLD,'meadow')}
    if(TR){const D=WORLD.regions.desert,M=D.map,rc=terrainReach(D,'desert'),T=TRC.desert;L.dTerr={ms:T.ms,bad:terrainBad(D,'desert'),un:Object.keys(rc).filter(k=>!rc[k]),n:Object.keys(rc).length,mesa:tBlocked(-1500,-800),lava:tBlocked(D.ponds[1].x,D.ponds[1].y),canyon:!tBlocked(-1600,-260),cut:!!tPath(400,-700,600,300),dune:tSlow(1100,950)};terrainEnter(WORLD,'meadow')}   // המדבר הגדול (ת17, map-desert.js). terrainEnter: חוזרים למפת האחו
    if(TR&&WORLD.regions.storm.map){const SR=WORLD.regions.storm,M=SR.map,rc=terrainReach(SR,'storm'),mk=id=>M.marks.find(m=>m.id===id),a=SR.home,b=M.bridges[0];   // מגדלי הסערה הגדולים (js/map-storm.js): נבנה ונבדק כאן, ואז חוזרים למפה של האחו
      for(const m of M.marks)rc['mark.'+m.id]=!!tPath(a.x,a.y+WORLD.arrive,m.x,m.y);
      if(typeof WNPC!=='undefined')for(const id in WNPC.list){const N=WNPC.list[id];if(N.reg==='storm')rc['npc.'+id]=!tBlocked(N.at.x,N.at.y)&&!!tPath(a.x,a.y+WORLD.arrive,N.at.x,N.at.y)}   // הדמויות והלוח (worldnpc.js, questboard.js)
      L.wStorm={ms:TR.ms,bad:terrainBad(SR,'storm'),un:Object.keys(rc).filter(k=>!rc[k]),n:Object.keys(rc).length,river:tBlocked(-210,-300),bridge:!tBlocked(b.x,b.y),stones:tSlow(mk('stones').x,mk('stones').y),
        wall:tBlocked(-1000,1072)&&tBlocked(700,987),gate:!tBlocked(mk('egate').x,mk('egate').y),tower:tBlocked(SR.towers[5].x,SR.towers[5].y),
        towerFree:!SR.foes.concat(SR.fields,M.marks,SR.waystones,M.dens).some(o=>SR.towers.some(t=>Math.hypot(o.x-t.x,o.y-t.y)<t.r+40))};terrainEnter(WORLD,'meadow')}
    L.wNodes=S.nd.list.length;L.wFoes=enemies.length;L.wCreatures=enemies.filter(e=>e.creature).length;m.w0=SAVE.bag.wood||0;m.wt=W.t;
    // המפלצות הראשונות ליד השער: קלות. אחת נזרקת רחוק מהבית שלה (צריכה לחזור), וקבוצה אחת מופלת (צריכה לחזור אחרי זמן)
    const st=enemies.filter(e=>e.zone==='start'),gi=G=>WORLD.foes.indexOf(G),home=e=>WORLD.foes[e.home];
    L.wStart={n:st.length,easy:st.length>0&&st.every(e=>e.dmg<=ETYPES[e.type].dmg*0.5&&e.speed<ETYPES[e.type].speed&&(e.wind||STRIKE.wind)>STRIKE.wind),   // קלות: חצי נזק, איטיות, והכנה ארוכה יותר למכה. חיים: לא פחות, כדי שגם כאן אויב ייקח 2-3 מכות (fix/start-zone-fight)
      dmg:st.map(e=>Math.round(e.dmg*10)/10).join('/')};
    const east=st.filter(e=>home(e).x>100),west=st.filter(e=>home(e).x<-100);
    if(east[0]){const e=east[0],G=home(e);m.le=e;e.x=G.x+600;e.y=G.y;m.leD0=Math.round(Math.hypot(e.x-G.x,e.y-G.y))}
    if(west[0]){m.rg=west[0].home;for(const e of west)if(e.home===m.rg){e.hp=0;kill(e)}}
    return stay()}
  if(m.le&&!m.le.dead&&m.leD1==null&&W.t-m.wt>6){const G=WORLD.foes[m.le.home];m.leD1=Math.round(Math.hypot(m.le.x-G.x,m.le.y-G.y));L.wLeash=m.leD0+'→'+m.leD1}
  if(m.rg!=null&&W.groups[m.rg].n)L.wFoeBack??=Math.round(W.t-m.wt);
    if((SAVE.bag.wood||0)===m.w0&&(S.gd||[]).some(d=>d.r==='wood'))L.wDropGround=true;
  if(m.wp==='gather'){   // הולכים לעץ הכי קרוב ועומדים לידו עד שהוא נשבר. העץ נופל לרצפה, ורק כשעוברים לידו הוא נכנס לתרמיל
    if((SAVE.bag.wood||0)===m.w0&&(S.gd||[]).some(d=>d.r==='wood'))L.wDropGround=true;
    const bq=SAVE.quests.active.boots;L.bootsProg=bq?bq.p[0]:null;
    if((SAVE.bag.wood||0)>m.w0&&!(bq&&!qReady(QBY.boots))){L.wGather=(SAVE.bag.wood||0)-m.w0;L.wGatherSaved=(saved().bag.wood||0)===SAVE.bag.wood;L.wGatherT=Math.round(W.t-m.wt);
      const q=SAVE.quests.active.wFirst;L.wQuest=q?q.p.join('/'):null;m.wp='kill';m.k0=S.kills;return L}
    const n=S.nd.list.filter(n=>!n.dead&&n.kind==='tree').sort(far)[0];
    return n?steer(n.x,n.y,false,n.r+P.r+20,L):stay()}   // אחרי שהעץ נשבר: לעץ הבא, עד שיש 5 לקווסט הנעליים
  if(m.wp==='kill'){   // מפילים אויב אחד: יצור משאב אם יש, אחרת הכי קרוב
    if(m.kt!=null&&S.kills>m.k0){L.wKill=m.kt;m.wp='wnpc';return L}   // סופרים רק מאז שנבחר אויב: פיוחו (pet.js) יכולה להפיל אחד לפני כן
    const pool=enemies.filter(e=>!e.dead&&!e.wanted),cr=pool.filter(e=>e.creature),e=(cr.length?cr:pool).sort(far)[0];if(!e)return stay();
    if(m.kt==null)m.k0=S.kills;m.kt=e.type+(e.creature?' (יצור)':'');return steer(e.x,e.y,false,P.weapon==='sword'?e.r+30:200,L)}
  if(m.wp==='wnpc'){   // דמות בעולם (worldnpc.js): הולכים לקרובה, היא נמצאת (נשמר, חגיגה, חץ), מדברים, מקבלים קווסט, משלימים ולוקחים פרס רק אצלה
    const N=L.wn||(L.wn={}),tb=document.getElementById('talkBtn'),dlg=document.getElementById('npcDlg'),btn=a=>dlg.querySelector('[data-act="'+a+'"]');
    if(!m.wn){const id=Object.keys(WNPC.list).filter(k=>!WNPC.list[k].reg&&!WNPC.list[k].look&&!WNPC.list[k].board).sort((a,b)=>far(WNPC.list[a].at,WNPC.list[b].at))[0];if(!window.__cel){window.__cel=0;const c=celebrate;window.celebrate=(...a)=>{window.__cel++;return c(...a)}}m.wn={id,step:0,fx:window.__cel};N.id=id;N.n=Object.keys(WNPC.list).length;N.metBefore=!!SAVE.met[id];N.markBefore=wnpcMarks()[id]||null}
    const M=m.wn,id=M.id,n=wnpcState()[id];
    if(M.step===0){
      if(!SAVE.met[id])return steer(n.x,n.y,false,0,L);
      N.found=true;N.saved=!!(saved().met||{})[id];N.fx=window.__cel>M.fx;N.mark=wnpcMarks()[id]||null;M.step=1}
    if(M.step===1){   // כפתור "לדבר": רק לחיצה פותחת
      if(S.wd.npcNear!==id||tb.hidden)return steer(n.x,n.y,false,25,L);
      N.btn=tb.innerText;N.auto=!dlg.hidden;tb.click();N.open=!dlg.hidden;N.say=(dlg.querySelector('.npcsay')||{}).innerText;
      const acc=btn('accept');if(!acc){N.err='אין קווסט לקבל';m.wp='gate';return L}
      M.q=acc.dataset.q;N.q=M.q;N.inLogNew=(questLog(),!!document.querySelector('#qLog [data-act="accept"][data-q="'+M.q+'"]'));
      acc.click();N.got=!!SAVE.quests.active[M.q];M.step=2;return steer(null,null,false,0,L)}
    if(M.step===2){   // משלימים את המטרות (בכאילו, כמו בבדיקת מנוע הקווסטים), סוגרים, ובודקים שהסימן התחלף ל-✓
      const q=QBY[M.q];for(const o of q.obj)questEvent(o.type,o.what,o.n);
      N.ready=qReady(q);btn('close').click();N.closed=dlg.hidden;N.markReady=wnpcMarks()[id]||null;
      N.logClaim=(questLog(),!!document.querySelector('#qLog [data-act="claim"][data-q="'+M.q+'"]'));M.fx2=window.__cel;M.step=3;return steer(null,null,false,0,L)}
    if(M.step===3){   // שוב "לדבר", ולוקחים את הפרס
      if(tb.hidden)return steer(n.x,n.y,false,25,L);
      tb.click();const c=btn('claim');if(!c){N.err='אין כפתור פרס';m.wp='gate';return L}
      M.b0=Object.assign({},SAVE.bag);c.click();const q=QBY[M.q],r=q.reward;   // התרמיל ממש לפני הלחיצה: פיוחו (pet.js) חופרת ומוסיפה בינתיים
      N.claimed=!SAVE.quests.active[M.q]&&!!SAVE.quests.done[M.q];N.paid=Object.keys(r).filter(k=>resOf(k)).every(k=>(SAVE.bag[k]||0)-(M.b0[k]||0)===r[k]);
      N.claimSaved=!!(saved().quests.done||{})[M.q];N.claimFx=window.__cel>M.fx2;btn('close').click();
      // דמות שעוד לא נמצאה: אין לה סימן ואין לה קווסט פתוח
      const other=Object.keys(WNPC.list).find(k=>!SAVE.met[k]&&!WNPC.list[k].reg);N.hidden=!other||(!wnpcMarks()[other]&&!QUESTS.list.some(q=>q.giver===other&&qOpen(q)));
      L.wnDone=1;m.wp='fish';return L}
  }
  if(m.wp==='fish'){   // דיג (fishing.js): הולכים לבריכה של הדייג, "לדוג", מחכים ל-!, ולוחצים כשהמחוג בירוק. הדג בתרמיל, בשמירה ובספר
    const F=L.fish||(L.fish={}),b=document.getElementById('fishBtn'),f=W.fish,tap=()=>b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));
    if(!m.fs){const N=WNPC.list.fisher;m.fs={t0:W.t,x:N.at.x+N.pond.dx,y:N.at.y+N.pond.dy,n0:fishList().reduce((a,r)=>a+(SAVE.bag[r]||0),0),bites:0,tries:0}}
    const M=m.fs,got=fishList().filter(r=>(SAVE.bag[r]||0)>0);
    if(fishList().reduce((a,r)=>a+(SAVE.bag[r]||0),0)>M.n0){const id=got[0];F.caught=id;F.inBag=true;F.saved=(saved().bag[id]||0)===SAVE.bag[id];F.book=bookHas('r',id);F.count=FS().caught[id]||0;
      F.bites=M.bites;F.tries=M.tries;F.t=Math.round(W.t-M.t0);L.fishDone=1;m.wp='gate';return stay()}
    if(W.t-M.t0>90){F.err='לא נתפס דג ב-90 שניות';m.wp='gate';return stay()}
    if(!f){if(b.hidden)return steer(M.x,M.y,false,40,L);F.btn=b.innerText;M.tries++;tap();return stay()}
    if(f.st==='bite'){M.bites++;F.bite=true;tap();return stay()}
    if(f.st==='reel'){F.reel=true;if(fishNeedleIn())tap();return stay()}
    return stay()}
  if(m.wp==='gate'){   // שער החורשה: ליד השער רק בועה וכפתור עגול (#wGo). לחיצה אחת עליו נכנסת לזירה, בלי כרטיס (9.11)
    const g=WORLD.gates.grove,pn=document.getElementById('wPanel'),wg=document.getElementById('wGo');
    if(W.near==='grove'&&!pn.hidden&&L.wGateAuto==null)L.wGateAuto=true;   // כרטיס נפתח לבד: לא אמור לקרות
    if(W.near==='grove'&&pn.hidden&&!wg.hidden&&(L.wFoeBack!=null||W.t-m.wt>90)){if(L.wGateAuto==null)L.wGateAuto=false;L.wGoBtn=wg.innerText.replace(/\s+/g,' ');
      L.wPicked=dropStats().picked;m.runBag=bag();wg.click();L.wArena=!S.wd&&S.mode==='play';m.wp='arena';return L}
    return steer(g.x,g.y,false,0,L)}
  if(m.wp==='arena'){   // חזרנו מהזירה: לאותו שער, והשלל בתרמיל
    const g=WORLD.gates.grove;L.wBack=Math.round(Math.hypot(P.x-g.x,P.y-g.y));L.back=S.t;
    const now=bag(),got=[];for(const r in now){const d=now[r]-(m.runBag[r]||0);if(d>0)got.push(r+' +'+d)}
    L.lootGot=got.join(', ');L.lootSaved=JSON.stringify(saved().bag)===JSON.stringify(SAVE.bag);
    const st=saved().hero.style;L.style={};for(const k in st)L.style[k]=Math.round(st[k]);   // סגנון המשחק, כפי שנשמר
    m.wp='die';return stay()}
  if(m.wp==='die'){   // נופלים בכוונה, עם משאבים ופריט בתרמיל ומשהו במחסן
    if(SAVE.ways)SAVE.ways.open={};   // כאן בודקים קימה בכפר, בלי אבן מסע פתוחה. קימה באבן: בדיקת "אבני מסע" (waystones.js)
    bagAdd('wood',7);bagAdd('stone',5);bagAdd('coins',1);bagAdd('oakSword',1);SAVE.stash.stone=(SAVE.stash.stone||0)+3;saveNow();
    m.d0=bag();m.s0=JSON.stringify(SAVE.stash);P.inv=0;hurt(P.hp+999);
    const res=Object.keys(m.d0).filter(r=>resOf(r)),items=Object.keys(m.d0).filter(r=>!resOf(r));
    L.wDeath={over:S.mode==='over',res:res.every(r=>(SAVE.bag[r]||0)===m.d0[r]-Math.floor(m.d0[r]/2)),items:items.every(r=>SAVE.bag[r]===m.d0[r]),
      stash:JSON.stringify(SAVE.stash)===m.s0,saved:JSON.stringify(saved().bag)===JSON.stringify(SAVE.bag),
      txt:res.map(r=>r+' '+m.d0[r]+'→'+(SAVE.bag[r]||0)).join(', ')+' · '+items.map(r=>r+' '+SAVE.bag[r]).join(', ')};
    m.wp='dead';return stay()}
  return stay();
}

(async()=>{
  // תלת-ממד בלי כרטיס גרפי: WebGL רץ על המעבד (SwiftShader). איטי, אבל מספיק כדי לבדוק שהכל עולה ומצויר
  const browser=await chromium.launch({...(process.env.PW_CHANNEL?{channel:process.env.PW_CHANNEL}:{}),args:GPU.gpuOn()?GPU.GPU_ARGS:CFG.gfx==='3d'?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});   // רק בתלת-ממד: הדגל הזה מאט גם את הציור הרגיל  // ב-GitHub: ה-Chrome שכבר מותקן שם, בלי להוריד דפדפן
  const page=await browser.newPage({viewport:CFG.phone,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  const m3dWarn=[];page.on('console',m=>{if(/missing model/.test(m.text()))m3dWarn.push(m.text())});   // מודל שלא נטען (js/m3d.js)
  // הפונטים מגוגל לא נטענים בבדיקה, כדי שהיא תרוץ זהה גם בלי רשת
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(seed=>{let a=seed>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}},CFG.seed);
  await page.clock.install({time:0});
  await page.clock.pauseAt(1000);
  // מפתח טקסט גולמי על המסך (ביקורת 6.11, פריט 8: "sq.pl.storm.spire" ביומן): כל טקסט גלוי, וכל מה שנכתב על הקנבס, נבדק.
  // מועמד = מילה עם נקודות (a.b.c), והחלק הראשון שלה הוא קידומת של מפתח ב-TEXT (lang.js). כך כתובת או מספר עשרוני לא נחשבים
  await page.addInitScript(()=>{const RK=window.__rk={hits:[],seen:{}};let pre=null;
    const pf=()=>pre||(typeof TEXT==='object'&&TEXT?(pre=new Set(Object.keys(TEXT).filter(k=>k.includes('.')).map(k=>k.split('.')[0]))):null);
    const re=/(?<![\w\-\/.@#:])[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9_]+)+(?![\w\-\/])/g;
    const test=(s,where)=>{if(typeof s!=='string'||s.indexOf('.')<0)return;const p=pf();if(!p)return;
      for(const m of s.matchAll(re)){const k=m[0];if(p.has(k.split('.')[0])&&!RK.seen[k]){RK.seen[k]=1;RK.hits.push(k+' ('+where+')')}}};
    const C=CanvasRenderingContext2D.prototype;for(const f of ['fillText','strokeText']){const o=C[f];C[f]=function(t,...a){test(t,'קנבס');return o.call(this,t,...a)}}
    window.__rkScan=()=>{if(!document.body)return;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
      while((n=w.nextNode())){const s=n.nodeValue;if(s.indexOf('.')<0)continue;const el=n.parentElement;
        if(!el||el.closest('[hidden],script,style')||!el.getClientRects().length)continue;
        test(s,el.closest('[id]')?el.closest('[id]').id:el.tagName)}}});
  {const rf=page.clock.runFor.bind(page.clock);let n=0;   // כל כמה צעדים של הבוט סורקים את המסך
    page.clock.runFor=async ms=>{const r=await rf(ms);if(++n%6===0)await page.evaluate(()=>window.__rkScan&&__rkScan()).catch(()=>{});return r}}
  await page.addInitScript(g=>{try{localStorage.setItem('zm-gfx',g);localStorage.setItem('zm-lang','he')}catch(e){}},CFG.gfx);   // zm-lang 'he': an old save, must migrate to en (English only, 7.11)
  // 5.11.2026: models3d.js כבר כ-16MB, ובמכונות של GitHub הטעינה עברה את 30 השניות של ברירת המחדל. הבדיקה לא בודקת זמן טעינה
  await page.goto('file://'+path.resolve(__dirname,'..','index.html'),{timeout:120000});
  await page.clock.runFor(300);
  // הדמויות בתלת-ממד נטענות ברקע. מחכים להן לפני שמתחילים
  await page.evaluate(de=>{R3D.drawEvery=de},GPU.gpuOn()?1:60);   // עם --gpu: כל פריים. אחרת: בבדיקה מציירים תלת-ממד פעם ב-60 פריימים, אחרת היא לוקחת שעה
  await page.evaluate(()=>{ITEMROLL.skip=true});   // הבוט לובש חפצים בלי לצבור נקודות. הבדיקה של itemroll.js מדליקה את הדרישות לבד
  let g3={};for(let i=0;i<200;i++){g3=await page.evaluate(()=>({ready:R3D.ready,failed:R3D.failed,on:R3D.on}));if(g3.ready||g3.failed||CFG.gfx==='2d')break;await page.waitForTimeout(50);await page.clock.runFor(50)}

  const results=[];
  const check=(ok,txt)=>results.push((ok?'✓ ':'✗ ')+txt);
  // מודלים לפי צורך (js/m3d.js): בפתיחה נטענת רק הליבה, ומבחוץ רק מה שהשמירה צריכה עכשיו (דמות אישית, חיה, חפץ לבוש)
  if(g3.ready){const b=await page.evaluate(()=>{const on=Object.keys(M3D_LAZY).filter(k=>MODELS3D[k]),want=new Set(M3D.bootKs||[]);
      return {n:Object.keys(M3D_LAZY).length,on,extra:on.filter(k=>!want.has(k)),core:Object.keys(MODELS3D).length-on.length,mb:(Object.values(M3D_LAZY).reduce((a,b)=>a+b,0)/1e6).toFixed(1)}});
    check(b.n>0&&!b.extra.length,'מודלים בפתיחה: '+b.core+' בליבה, '+b.on.length+' מתוך '+b.n+' שבחוץ ('+b.mb+'MB) נטענו'+(b.on.length?' ('+b.on.join(', ')+')':'')+(b.extra.length?' · נטענו בלי צורך: '+b.extra.join(', '):''))}
  let shotN=0;
  // כל מסך שמצטלם נסרק גם למפתחות גולמיים (__rkScan), גם בלי צילומים
  const fxOver=[];   // אפקטים בממשק (fxui.js) שיושבים על חלון פתוח, בכל רגע של צילום, גם בלי --shots
  const shot=async name=>{await page.evaluate(()=>window.__rkScan&&__rkScan()).catch(()=>{});
    {const ov=await page.evaluate(()=>typeof fxuiOverWin==='function'?fxuiOverWin():[]).catch(()=>[]);if(ov.length)fxOver.push(name+': '+ov.join(','))}
    if(!CFG.shots)return;fs.mkdirSync(CFG.shots,{recursive:true});
    // השעון בבדיקה עומד, ולכן אייקון "סקיל חדש" (skillreveal.js, 1.8 שניות במשחק) נשאר באמצע המסך מעל הגיבור, והכפתור בפינה ריק.
    // לפני צילום: האייקון נוחת על הכפתור שלו
    await page.evaluate(()=>{if(typeof SKR!=='undefined'&&SKR&&SKR.el){SKR.el.remove();SKR.el=null;skrBtn(SKR.id,false)}});
    await page.evaluate(()=>{R3D.drawEvery=0});await page.clock.runFor(34);await page.evaluate(de=>{R3D.drawEvery=de},GPU.gpuOn()?1:60);
    await page.screenshot({path:path.join(CFG.shots,String(++shotN).padStart(2,'0')+'-'+name+'.png')})};

  const open=await page.$$eval('.ov',els=>els.filter(e=>getComputedStyle(e).display!=='none').map(e=>e.id));
  check(open.length===1&&open[0]==='ovStart','מסך פתיחה: רק הוא גלוי'+(open.length===1?'':' (גלויים: '+open.join(', ')+')'));
  const ver=await page.$eval('#verLine',e=>e.textContent);
  check(/^v\d+\.\d+\.(dev|\d+\.\d+(-pr\d+)?)$/.test(ver),'מספר גרסה במסך הפתיחה: '+(ver||'חסר'));
  await shot('start');
  // התקנה כאפליקציה (js/pwa.js): ה-manifest תקין והאייקונים קיימים, מ-file:// אין service worker, ומשרת http הוא נרשם ושומר את המשחק
  const pw={file:await page.evaluate(()=>PWA.state)};
  try{const root=path.resolve(__dirname,'..'),mf=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
    const png=f=>{try{const b=fs.readFileSync(path.join(root,f));return b.readUInt32BE(16)+'x'+b.readUInt32BE(20)}catch(e){return null}};
    pw.bad=['name','short_name','start_url','display','orientation','background_color','theme_color'].filter(k=>!mf[k]);
    if(mf.orientation!=='landscape')pw.bad.push('orientation='+mf.orientation);
    for(const i of mf.icons||[])if(png(i.src)!==i.sizes)pw.bad.push(i.src+' '+(png(i.src)||'חסר'));
    if(!(mf.icons||[]).some(i=>i.purpose==='maskable'))pw.bad.push('maskable');
    const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
    for(const f of [...html.matchAll(/<link rel="(?:manifest|icon|apple-touch-icon)" href="([^"]+)"/g)].map(m=>m[1]))if(!fs.existsSync(path.join(root,f)))pw.bad.push(f+' חסר');
    if(!/viewport-fit=cover/.test(html)||!/apple-mobile-web-app-capable/.test(html))pw.bad.push('meta של אייפון');
    const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json','.json':'application/json'};
    const srv=require('http').createServer((q,r)=>{let f=decodeURIComponent(q.url.split('?')[0]);if(f==='/version.json'){r.writeHead(200,{'content-type':'application/json'});return r.end('{"v":""}')}   // כמו במחשב: אין גרסה מפורסמת (update-check.js לא עושה כלום)
      if(f.endsWith('/'))f+='index.html';f=path.join(root,path.normalize(f));
      if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end()}
      r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
    await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));
    const ctx=await browser.newContext({viewport:CFG.phone,isMobile:true,hasTouch:true}),pg=await ctx.newPage(),perr=[];
    pg.on('pageerror',e=>perr.push(e.message));pg.on('console',m=>{if(m.type()==='error')perr.push(m.text())});
    await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
    await ctx.addInitScript(()=>{try{localStorage.setItem('zm-gfx','2d')}catch(e){}});
    await pg.goto('http://127.0.0.1:'+srv.address().port+'/');
    pw.http=await pg.evaluate(async()=>{const t=Date.now();await Promise.race([navigator.serviceWorker.ready,new Promise(ok=>setTimeout(ok,20000))]);
      const k=(await caches.keys()).filter(n=>n.startsWith('fh-'));let n=0;for(const c of k)n+=(await (await caches.open(c)).keys()).length;
      return{state:PWA.state,active:!!(await navigator.serviceWorker.getRegistration()),cache:k.join(','),n,ms:Date.now()-t}});
    // עדכון לבד (js/update-check.js): מדמים גרסה חדשה ב-version.json. במסך הפתיחה: רענון אחד לבד ואז רק הכפתור (בלי לולאה). בזירה: רק כפתור, בלי רענון
    {let navs=0;pg.on('framenavigated',f=>{if(f===pg.mainFrame())navs++});
      await ctx.route(/\/version\.json/,r=>r.fulfill({status:200,contentType:'application/json',body:'{"v":"9.9.9.9"}'}));
      // מחכים לרענון עצמו ולטעינה המלאה, ולא לזמן קבוע: במחשב עמוס 6 שניות לא הספיקו, והבדיקה קראה UPD באמצע הטעינה ("UPD is not defined")
      await pg.evaluate(()=>{updCheck();return 1});
      for(let t=0;t<300&&navs<1;t++)await pg.waitForTimeout(100);
      await pg.waitForLoadState('load');await pg.waitForFunction(()=>typeof UPD==='object'&&typeof $==='function',null,{timeout:30000}).catch(()=>{});
      await pg.waitForTimeout(2500);   // ועוד רגע: רענון שני כאן הוא לולאה, ו-upStart יראה אותו
      await pg.waitForLoadState('load');
      pw.upStart=navs;pw.upBtn1=await pg.evaluate(()=>!$('updBtn').hidden&&UPD.next==='9.9.9.9');
      await pg.evaluate(()=>{sessionStorage.removeItem(UPD.key);startRun();window.__keep=1});navs=0;
      await pg.evaluate(()=>updCheck());await pg.waitForTimeout(2500);
      pw.upArena={navs,keep:await pg.evaluate(()=>window.__keep===1),btn:await pg.evaluate(()=>!$('updBtn').hidden)}}
    pw.errs=perr;await ctx.close();srv.close();
  }catch(e){pw.crash=e.message}
  check(!pw.crash&&!pw.bad.length,'אפליקציה: '+(pw.crash?'הבדיקה נפלה: '+pw.crash:pw.bad.length?'בעיות ב-manifest: '+pw.bad.join(', '):'manifest תקין, לרוחב, עם אייקונים 192/512 ו-maskable'));
  check(pw.file==='file','אפליקציה: מ-file:// '+(pw.file==='file'?'אין service worker':'ניסה לרשום service worker ('+pw.file+')'));
  if(!pw.crash)check(pw.http&&pw.http.state==='ok'&&pw.http.active&&pw.http.n>40&&!pw.errs.length,'אפליקציה: משרת http '+(pw.http&&pw.http.active?'ה-service worker נרשם ושמר '+pw.http.n+' קבצים ('+pw.http.cache+')':'ה-service worker לא נרשם ('+(pw.http&&pw.http.state)+')')+(pw.errs.length?' · שגיאות: '+[...new Set(pw.errs)].join(' | '):''));
  if(!pw.crash)check(pw.upStart===1&&pw.upBtn1,'עדכון: במסך הפתיחה '+(pw.upStart===1?'רענון אחד לבד':pw.upStart+' רענונים במקום אחד')+(pw.upBtn1?', ואחריו רק הכפתור':', הכפתור לא הופיע אחרי הרענון'));
  if(!pw.crash)check(pw.upArena&&!pw.upArena.navs&&pw.upArena.keep&&pw.upArena.btn,'עדכון: בזירה '+(pw.upArena&&!pw.upArena.navs?'לא מרעננים':'רענן באמצע ריצה')+(pw.upArena&&pw.upArena.btn?', רק כפתור 🔄':', אין כפתור'));
  check(await page.evaluate(()=>!updWeb()&&!!$('updBtn').hidden&&$('updCheckBtn').hidden),'עדכון: מ-file:// לא בודקים ולא מציגים כפתור');
  // דיווח באג (bugreport.js): הכפתור בהגדרות, הדוח עם גרסה ומקום, ושגיאה מכוונת מופיעה בו. שגיאה מדומה (ErrorEvent), כדי לא לסמן את הבדיקה
  const bug=await page.evaluate(()=>{const b=$('bugBtn'),inSet=!!b&&!!b.closest('#ovSound')&&b.textContent.includes('🐞');
    window.dispatchEvent(new ErrorEvent('error',{message:'bugtest-boom',filename:'x.js',lineno:7,error:new Error('bugtest-boom')}));
    Object.defineProperty(navigator,'share',{value:undefined,configurable:true});b&&b.click();   // הדוח נכתב מיד בלחיצה (BUG.lastText). בלי setTimeout: השעון של הבדיקה עצור כאן
   
    const r=BUG.lastText||'';BUG.errs=BUG.errs.filter(e=>!e.msg.includes('bugtest'));
    return{inSet,ver:r.includes('version: v'+VERSION),place:/\nplace: \S/.test(r),err:r.includes('bugtest-boom'),lines:r.split('\n').length}});
  check(bug.inSet&&bug.ver&&bug.place&&bug.err,'דיווח באג: '+(!bug.inSet?'אין כפתור 🐞 בהגדרות':!bug.ver?'אין גרסה בדוח':!bug.place?'אין מקום בדוח':!bug.err?'השגיאה המכוונת לא בדוח':'כפתור בהגדרות, דוח של '+bug.lines+' שורות עם גרסה, מקום ושגיאה'));
  // שמירה: נכתבת, נטענת חזרה, ושמירה ישנה בלי שדה חדש מקבלת אותו. בסוף מנקים, כדי שהריצה תתחיל נקייה
  const sv=await page.evaluate(()=>{bagAdd('wood',5);bagAdd('wood',2);const took=bagTake('wood',3)&&!bagTake('wood',99);SAVE.village.forge=2;saveNow();
    SAVE=saveBlank();saveLoad();const back=SAVE.bag.wood===4&&SAVE.village.forge===2&&took;
    localStorage.setItem(SAVE_STORE.key,JSON.stringify({v:0,bag:{bone:1}}));saveLoad();const old=SAVE.bag.bone===1&&SAVE.village.center===1&&Array.isArray(SAVE.gear.orbit);
    localStorage.removeItem(SAVE_STORE.key);saveLoad();return{back,old}});
  check(sv.back&&sv.old,'שמירה: '+(sv.back?'נשמרת ונטענת':'לא חזרה אחרי טעינה')+', '+(sv.old?'שמירה ישנה משלימה שדות חדשים':'שמירה ישנה נשברה'));
  // שמירה בענן (cloud.js) בלי רשת: בבדיקה כל הרשת חסומה, אז ההפעלה נכשלה בשקט והמשחק ממשיך. אחר כך שרת מדומה: דחיפה, משיכה של שמירה חדשה יותר, ושמירה ישנה בענן לא דורסת
  const cl=await page.evaluate(async()=>{const r={off:CLOUD.status==='off'&&!!SAVE&&!!document.getElementById('cloudLine').textContent};const bak=JSON.stringify(SAVE);
    CLOUD.fake=cloudFakeServer();CLOUD.session=null;try{localStorage.removeItem(CLOUD.lsKey)}catch(e){}
    bagAdd('wood',3);saveNow();r.first=await cloudSync();const row=CLOUD.fake.rows.u1;r.push=!!row&&row.data.bag.wood===SAVE.bag.wood&&CLOUD.status==='ok';
    const nd=JSON.parse(JSON.stringify(row.data));nd.ts=SAVE.ts+60000;nd.village.forge=7;CLOUD.fake.rows.u1.data=nd;
    r.pull=await cloudSync()==='took'&&SAVE.village.forge===7&&JSON.parse(localStorage.getItem(SAVE_STORE.key)).village.forge===7;
    const od=JSON.parse(JSON.stringify(nd));od.ts=1;od.village.forge=1;CLOUD.fake.rows.u1.data=od;
    r.keep=await cloudSync()==='kept'&&SAVE.village.forge===7&&CLOUD.fake.rows.u1.data.village.forge===7;
    CLOUD.fake.down=true;r.down=await cloudSync()==='offline'&&CLOUD.status==='off';CLOUD.fake.down=false;
    r.users=CLOUD.fake.users;SAVE=JSON.parse(bak);SAVE_STORE.write(SAVE,true);CLOUD.dirty=false;r.p0=CLOUD.pushes;return r});
  check(cl.off,'ענן: בלי רשת '+(cl.off?'המשחק עולה, והסמל אומר "לא מחובר"':'משהו נשבר'));
  check(cl.push,'ענן: דחיפה '+(cl.push?'הגיעה לשרת המדומה':'לא הגיעה ('+cl.first+')'));
  check(cl.pull,'ענן: שמירה חדשה יותר בענן '+(cl.pull?'נמשכה ונשמרה בטלפון':'לא נמשכה'));
  check(cl.keep&&cl.users===1,'ענן: שמירה ישנה בענן '+(cl.keep?'לא דרסה, והחדשה נדחפה':'דרסה את החדשה')+(cl.users===1?'':', '+cl.users+' כניסות במקום אחת'));
  check(cl.down,'ענן: שרת נופל '+(cl.down?'בשקט, הסמל חוזר ל"לא מחובר"':'שבר משהו'));
  // הגנה על ההתקדמות (ביקורת 6.11.2026). 1: "יאללה" לפני שהסנכרון נגמר, והענן חדש יותר: הענן לא נדרס, ובפתיחה הבאה השחקן בוחר. ו"יאללה" מחכה לסנכרון
  const sf=await page.evaluate(async()=>{const r={},bak=JSON.stringify(SAVE),st=$('ovStart'),stH=st.hidden,F=CLOUD.fake=cloudFakeServer();CLOUD.session=null;try{localStorage.removeItem(CLOUD.lsKey)}catch(e){}
    st.hidden=false;SAVE.hero.xp=10;SAVE.village.forge=1;saveNow();await cloudSync();const u=CLOUD.session.uid;
    const nd=JSON.parse(JSON.stringify(F.rows[u].data));nd.ts=SAVE.ts+60000;nd.hero.xp=99999;nd.village.forge=7;F.rows[u].data=nd;
    st.hidden=true;r.early=await cloudSync();bagAdd('wood',1);saveNow();await cloudSync(true);await cloudPush();
    r.safe=F.rows[u].data.hero.xp===99999&&F.rows[u].data.village.forge===7&&CLOUD.status==='hold';
    st.hidden=false;const pr=cloudSync();for(let i=0;i<500&&$('ovCloud').hidden;i++)await Promise.resolve();
    r.ask=!$('ovCloud').hidden&&$('cloudAskS').textContent===T('cloud.askS2');$('cloudAcct').click();
    r.took=await pr==='took'&&SAVE.hero.xp===99999&&!cloudHeld()&&F.rows[u].data.hero.xp===99999;
    CLOUD.status='sync';let went=0;cloudReady(()=>went=1);r.wait=went===0&&$('startBtn').disabled;CLOUD.status='off';window.__sfGo=()=>went;
    SAVE=JSON.parse(bak);SAVE_STORE.write(SAVE,true);CLOUD.fake=cloudFakeServer();CLOUD.session=null;cloudHeld(false);CLOUD.dirty=false;st.hidden=stH;return r});
  await page.clock.runFor(300);
  sf.go=await page.evaluate(()=>window.__sfGo()===1&&!$('startBtn').disabled);
  check(sf.safe&&sf.ask&&sf.took,'ענן: "יאללה" לפני סוף הסנכרון '+(sf.safe?'לא דורס שמירה חדשה יותר בענן':'דרס את הענן ('+sf.early+')')+', '+(sf.ask&&sf.took?'ובפתיחה הבאה השחקן בוחר, והענן נלקח':'ובפתיחה הבאה לא נשאל'));
  check(sf.wait&&sf.go,'ענן: "יאללה" '+(sf.wait&&sf.go?'מחכה לסנכרון ואז ממשיך':'לא מחכה לסנכרון'));
  // 2: שמירה פגומה לא נדרסת: עותק בצד (fh-save-bad), שחזור מהגיבוי המתגלגל (fh-save-bak2), והודעה לשחקן. בלי גיבוי: משחק חדש, והעותק נשאר
  const bad=await page.evaluate(()=>{const r={},K=SAVE_STORE.key,bak=JSON.stringify(SAVE),ls=k=>localStorage.getItem(K+k);
    localStorage.removeItem(K+'-bak');SAVE.village.forge=4;SAVE_STORE.lastBak=-1e15;saveNow();SAVE_STORE.lastBak=-1e15;SAVE.village.forge=5;saveNow();   // -1e15: השעון של הבדיקה מתחיל קרוב ל-0
    const cut=ls('').slice(0,-40);localStorage.setItem(K,cut);SAVE_STORE.note=null;saveLoad();saveWarnShow();
    r.restored=SAVE.village.forge===4&&SAVE_STORE.note==='save.restored'&&ls('-bad')===cut&&!$('saveWarn').hidden&&$('saveWarn').textContent===T('save.restored');
    saveNow();r.kept=ls('-bad')===cut&&JSON.parse(ls('')).village.forge===4&&JSON.parse(ls('-bak2')).village.forge===4;
    localStorage.removeItem(K+'-bak2');localStorage.setItem(K,'{"v":1,"hero":{"lev');SAVE_STORE.note=null;saveLoad();
    r.lost=SAVE.village.forge===0&&SAVE_STORE.note==='save.lost';saveNow();r.lostKept=ls('-bad')==='{"v":1,"hero":{"lev';
    for(const k of['-bad','-bak2'])localStorage.removeItem(K+k);SAVE_STORE.note=null;$('saveWarn').hidden=true;
    SAVE=JSON.parse(bak);SAVE_STORE.lastBak=0;SAVE_STORE.write(SAVE,true);return r});
  check(bad.restored&&bad.kept&&bad.lost&&bad.lostKept,'שמירה פגומה: '+(bad.restored?'שוחזרה מהגיבוי, עם הודעה':'לא שוחזרה מגיבוי')+', '+(bad.kept&&bad.lostKept?'והעותק הפגום נשמר בצד ולא נדרס':'והעותק הפגום נדרס')+(bad.lost?'':', ובלי גיבוי משהו נשבר'));
  // 2ב (ביקורת 7.11.2026): מקום מלא. הגיבוי נכשל: השמירה הראשית עדיין נכתבת. גם הראשית נכשלת: השמירה הקודמת נשארת, והודעה פעם אחת
  const quota=await page.evaluate(()=>{const r={},K=SAVE_STORE.key,bak=JSON.stringify(SAVE),set0=Storage.prototype.setItem;let deny=null,warns=0;
    const warn0=window.saveWarnShow;window.saveWarnShow=()=>{warns++};
    Storage.prototype.setItem=function(k,v){if(deny&&deny(k)){const e=new Error('quota');e.name='QuotaExceededError';throw e}return set0.call(this,k,v)};
    try{deny=k=>k===K+'-bak2';SAVE_STORE.lastBak=-1e15;SAVE.bag.wood=(SAVE.bag.wood||0)+777;const w=SAVE.bag.wood;saveNow();
      r.main=JSON.parse(localStorage.getItem(K)).bag.wood===w&&!SAVE_STORE.failed;
      deny=k=>k===K;SAVE.bag.wood+=1;saveNow();saveNow();
      r.kept=JSON.parse(localStorage.getItem(K)).bag.wood===w&&SAVE_STORE.failed&&warns===1;
      deny=null;saveNow();r.back=JSON.parse(localStorage.getItem(K)).bag.wood===w+1&&!SAVE_STORE.failed}
    finally{Storage.prototype.setItem=set0;window.saveWarnShow=warn0;SAVE_STORE.failed=false;SAVE_STORE.note=null;
      localStorage.removeItem(K+'-bak2');SAVE=JSON.parse(bak);SAVE_STORE.lastBak=0;SAVE_STORE.write(SAVE,true)}return r});
  check(quota.main&&quota.kept&&quota.back,'מקום מלא בטלפון: '+(quota.main?'הגיבוי נכשל והשמירה הראשית נכתבה':'הגיבוי נכשל והשמירה הראשית דולגה')+', '+(quota.kept?'כשגם הראשית נכשלת, הקודמת נשארת והודעה פעם אחת':'כשהראשית נכשלת משהו נשבר')+(quota.back?'':', ואחרי שהתפנה מקום השמירה לא חזרה'));
  // 3: אויב קפוא, מסוחרר או מאובן לא מכה (strike.js), ואויב רגיל כן
  const frz=await page.evaluate(()=>{const h0=window.hurt;let n=0;window.hurt=()=>{n++};const r={};
    try{const run=k=>{n=0;const e={x:P.x+P.r+6,y:P.y,r:10,dmg:1,kx:0,ky:0};if(k)e[k]=30;for(let i=0;i<300;i++)strikeTick(e,1/60,6);return n};
      r.free=run(null);r.frozen=run('frozen');r.stun=run('stun');r.stone=run('stone')}finally{window.hurt=h0}return r});
  check(frz.free>0&&!frz.frozen&&!frz.stun&&!frz.stone,'אויב קפוא: '+(frz.free>0?'רגיל מכה ('+frz.free+' ב-5 שניות)':'גם רגיל לא מכה')+', '+(!frz.frozen&&!frz.stun&&!frz.stone?'קפוא, מסוחרר ומאובן לא מכים':'קפוא '+frz.frozen+', מסוחרר '+frz.stun+', מאובן '+frz.stone+' מכות'));
  // כניסה עם Google (שלב 2), על השרת המדומה: חיבור המשתמש הזמני, כניסה רגילה כשהחיבור נכשל, מיזוג (טלפון חדש לוקח, שמירות שונות מאוד = שאלה), והתנתקות
  const gl=await page.evaluate(async()=>{const r={},bak=JSON.stringify(SAVE),F=CLOUD.fake=cloudFakeServer();let went=null;CLOUD.nav=u=>{went=u};
    CLOUD.session=null;try{localStorage.removeItem(CLOUD.lsKey)}catch(e){}
    const p=cloudHash('#access_token=a%2Bb&refresh_token=r&expires_at=99&x=1'),bad=cloudHash('#foo=1');r.parse=p.access_token==='a+b'&&p.expires_at==='99'&&bad===null&&cloudHash('#error=x&error_code=identity_already_exists').error_code==='identity_already_exists';
    r.btnFile=document.getElementById('cloudIn').hidden;   // הבדיקה רצה מ-file://: אין כפתור
    // 1. חיבור: אותו משתמש, אותה שמירה, ובסמל מופיע השם
    bagAdd('wood',2);saveNow();await cloudSync();const u=CLOUD.session.uid;
    r.link=await cloudGoogle()==='link'&&/link=/.test(went);F.google[u]='Nir';
    r.linked=await cloudBack(F.back(u))==='linked'&&CLOUD.session.uid===u&&CLOUD.session.name==='Nir'&&!!F.rows[u]&&/Nir/.test(document.getElementById('cloudLine').textContent)&&!document.getElementById('cloudOut').hidden&&!localStorage.getItem(CLOUD.lsKey+'-go');
    // 2. החיבור נכשל (Google כבר שייך למשתמש אחר): חזרה עם שגיאה מובילה לכניסה רגילה
    CLOUD.session=null;localStorage.removeItem(CLOUD.lsKey);await cloudSync();
    await cloudGoogle();r.relink=await cloudBack('#error=server_error&error_code=identity_already_exists')==='relink'&&/\/auth\/v1\/authorize\?provider=google/.test(went);
    // גם הכניסה הרגילה נכשלה: הסמל אומר שהכניסה לא הצליחה (ולא "לא מחובר" בשקט), ובלי עוד ניסיון
    went=null;r.err=await cloudBack('#error=server_error&error_description=Unable+to+exchange+external+code')==='error'&&CLOUD.status==='err'&&/Google/.test(document.getElementById('cloudLine').textContent)&&went===null;
    // 3. מכשיר שני (בלי התקדמות) לוקח את השמירה מהחשבון
    const g='u90';F.google[g]='Nir';const far=JSON.parse(bak);far.hero.xp=(SAVE.hero.xp||0)+5000;far.hero.level=9;far.village.forge=5;far.ts=1;F.rows[g]={data:far};
    const mine=JSON.stringify(SAVE);SAVE=saveBlank();r.second=await cloudBack(F.back(g))==='cloud'&&SAVE.village.forge===5&&CLOUD.status==='ok';
    // 4. שתי שמירות שונות מאוד: שואלים, והשחקן בוחר את הטלפון. הטלפון נשמר ונדחף לחשבון
    SAVE=JSON.parse(mine);SAVE.hero.xp=1;saveNow();CLOUD.session=null;localStorage.removeItem(CLOUD.lsKey);await cloudGoogle(true);
    const pr=cloudBack(F.back(g));for(let i=0;i<500&&document.getElementById("ovCloud").hidden;i++)await Promise.resolve();const ov=document.getElementById('ovCloud');r.ask=!ov.hidden&&/9/.test(document.getElementById('cloudAcct').textContent);
    document.getElementById('cloudPhone').click();r.kept=await pr==='phone'&&ov.hidden&&F.rows[g].data.hero.xp===1&&SAVE.village.forge!==5;
    // חשבון בלי התקדמות (נפתח בדפדפן אחר), גם כשהוא חדש יותר, לא דורס את הטלפון
    F.rows[g]={data:Object.assign(saveBlank(),{ts:Date.now()+1e7})};SAVE.hero.xp=50;saveNow();CLOUD.session=null;localStorage.removeItem(CLOUD.lsKey);await cloudGoogle(true);r.emptyAcct=await cloudBack(F.back(g))==='phone'&&F.rows[g].data.hero.xp===50;
    // נשארים מחוברים: Supabase דוחה את הרענון. לא נפתח משתמש זמני במקום החשבון, ובפתיחה חוזרים ל-Google לבד
    const n0=F.users;CLOUD.session.exp=0;cloudKeep(CLOUD.session);F.badRefresh=true;went=null;
    r.stay=await cloudSync()==='offline'&&!CLOUD.session&&cloudWas()==='Nir'&&await cloudSync()==='offline'&&F.users===n0;
    F.badRefresh=false;r.relog=await cloudRelog()==='plain'&&/\/auth\/v1\/authorize\?provider=google/.test(went)&&F.users===n0;
    await cloudBack(F.back(g));r.relog=r.relog&&!!CLOUD.session&&CLOUD.session.name==='Nir'&&!cloudWas();
    // 5. התנתקות: הכניסה נמחקת מהטלפון, השמירה נשארת
    const wood=SAVE.bag.wood;document.getElementById("cloudOut").click();for(let i=0;i<500&&CLOUD.session;i++)await Promise.resolve();
    r.out=!CLOUD.session&&!localStorage.getItem(CLOUD.lsKey)&&F.calls.includes('POST /auth/v1/logout')&&SAVE.bag.wood===wood&&document.getElementById('cloudOut').hidden&&CLOUD.status==='off';
    SAVE=JSON.parse(bak);SAVE_STORE.write(SAVE,true);CLOUD.fake=cloudFakeServer();CLOUD.session=null;CLOUD.dirty=false;r.p0=CLOUD.pushes;return r});
  cl.p0=gl.p0;
  check(gl.parse&&gl.btnFile,'ענן: כתובת החזרה מ-Google '+(gl.parse?'נקראת':'לא נקראה')+', '+(gl.btnFile?'ומ-file:// אין כפתור כניסה':'וכפתור הכניסה מופיע גם מ-file://'));
  check(gl.link&&gl.linked,'ענן: Google '+(gl.link?'מתחבר למשתמש הזמני':'לא ניסה להתחבר')+', '+(gl.linked?'אותה שמירה, והסמל אומר "מחובר כ-"':'בחזרה משהו לא עבד'));
  check(gl.relink,'ענן: כשהחיבור נכשל '+(gl.relink?'עוברים לכניסה רגילה עם Google':'נתקע'));
  check(gl.emptyAcct,'ענן: חשבון ריק '+(gl.emptyAcct?'לא דורס את ההתקדמות בטלפון':'דרס את ההתקדמות בטלפון'));
  check(gl.stay&&gl.relog,'ענן: כשהכניסה ל-Google נדחית '+(gl.stay?'לא נפתח משתמש זמני במקומה':'נפתח משתמש זמני במקום החשבון')+', '+(gl.relog?'ובפתיחה חוזרים ל-Google לבד':'ולא חוזרים ל-Google'));
  check(gl.err,'ענן: כשגם הכניסה הרגילה נכשלת '+(gl.err?'הסמל אומר שהכניסה לא הצליחה, בלי עוד ניסיון':'השחקן לא יודע שנכשל, או שיש לופ'));
  check(gl.second,'ענן: מכשיר שני '+(gl.second?'לוקח את השמירה מהחשבון':'לא לקח את השמירה'));
  check(gl.ask&&gl.kept,'ענן: שתי שמירות שונות '+(gl.ask?'השחקן נשאל':'לא נשאל')+', '+(gl.kept?'ומה שבחר נשמר':'הבחירה לא נשמרה'));
  check(gl.out,'ענן: התנתקות '+(gl.out?'מוחקת את הכניסה ומשאירה את השמירה':'לא עבדה'));
  // ביקור אצל חבר (visit.js), על השרת המדומה עם שתי הטבלאות: בלי Google מוסבר, פרופיל מתפרסם, הכפר של החבר מוצג, מתנה נשלחת פעם ביום ומתקבלת פעם אחת, וכשהטבלאות חסרות הכפתור מוסבר
  const vs=await page.evaluate(async()=>{const r={},F=CLOUD.fake=cloudFakeServer();window.__visBak=JSON.stringify(SAVE);
    CLOUD.session=null;try{localStorage.removeItem(CLOUD.lsKey)}catch(e){}VISIT.ready=null;VISIT.last='';
    await cloudSync();r.anon=visitWhy()==='noName'&&await visitOpen()===false&&$('ovVisit').hidden;
    F.google.u1='Nir';CLOUD.session.name='Nir';await visitPublish();const me=F.profiles.u1;
    r.pub=!!me&&me.name==='Nir'&&me.data.village.center===SAVE.village.center&&await visitPublish()==='same';
    F.google.u2='Orel';F.profiles.u2={user_id:'u2',name:'Orel',level:7,data:{village:{center:3,forge:2,mill:1},start:'warrior',pet:'piocho'}};
    bagAdd('wood',12);window.__visWood=SAVE.bag.wood;await visitOpen();
    r.open=!$('ovVisit').hidden&&!!VISIT.sel&&VISIT.sel.name==='Orel'&&document.querySelectorAll('#visitWin .visb').length===Object.keys(VILLAGE.b).length&&
      document.querySelectorAll('#visitWin .visb.none').length===Object.keys(VILLAGE.b).length-3&&!!document.querySelector('#visitWin [data-act="send"]');
    window.__visSt=$('ovStart').hidden;$('ovStart').hidden=true;return r});
  await shot('visit');
  const vs2=await page.evaluate(async()=>{const r={},F=CLOUD.fake;$('ovStart').hidden=window.__visSt;
    document.querySelector('#visitWin [data-act="send"]').click();for(let i=0;i<2000&&!document.querySelector('#visitWin .visdone');i++)await Promise.resolve();
    const g=F.gifts[0];r.send=!!g&&g.from_id==='u1'&&g.to_id==='u2'&&g.res==='wood'&&g.n===1&&SAVE.bag.wood===window.__visWood-1;
    r.once=await visitSend()===false&&F.gifts.length===1&&!!document.querySelector('#visitWin .visdone');visitClose();r.closed=$('ovVisit').hidden;
    const anon={user_id:'u1',to_id:'u2',from_id:'u3',res:'wood',n:1,note:0};let bad=false;try{await F.req('POST','/rest/v1/gifts',anon,'au3')}catch(e){bad=true}r.rls=bad;
    const w=SAVE.bag.wood;CLOUD.session=Object.assign({},CLOUD.session,{uid:'u2',access:'au2',name:'Orel',exp:Date.now()/1000+3600});
    r.got=await visitInbox()===1&&SAVE.bag.wood===w+1&&!F.gifts.length&&await visitInbox()===0;
    F.noVisit=true;VISIT.ready=null;VISIT.last='';await visitPublish();r.noTable=VISIT.ready===false&&visitWhy()==='noTable';
    SAVE=JSON.parse(window.__visBak);SAVE_STORE.write(SAVE,true);CLOUD.fake=cloudFakeServer();CLOUD.session=null;try{localStorage.removeItem(CLOUD.lsKey)}catch(e){}
    CLOUD.dirty=false;VISIT.ready=null;VISIT.last='';r.p0=CLOUD.pushes;return r}).catch(e=>({err:String(e)}));
  if(vs2.p0!=null)cl.p0=vs2.p0;
  check(vs.anon,'ביקור: בלי Google '+(vs.anon?'הכפתור מסביר ולא נפתח':'החלון נפתח בכל זאת'));
  check(vs.pub,'ביקור: הפרופיל הציבורי '+(vs.pub?'מתפרסם, ולא נשלח שוב כשלא השתנה':'לא התפרסם כמו שצריך'));
  check(vs.open,'ביקור: הכפר של החבר '+(vs.open?'מוצג עם כל המבנים והרמות':'לא הוצג'));
  check(vs2.send&&vs2.once&&vs2.closed,'ביקור: מתנה '+(vs2.send?'נשלחה ויצאה מהתרמיל':'לא נשלחה'+(vs2.err?' ('+vs2.err+')':''))+', '+(vs2.once?'ופעם אחת ביום':'ונשלחה שוב'));
  check(vs2.rls&&vs2.got,'ביקור: החבר '+(vs2.got?'מקבל את המתנה פעם אחת':'לא קיבל')+', '+(vs2.rls?'ואי אפשר לשלוח בשם מישהו אחר':'ומישהו שלח בשם אחר'));
  check(vs2.noTable,'ביקור: בלי הטבלאות בענן '+(vs2.noTable?'הכפתור מוסבר והמשחק ממשיך':'משהו נשבר'));
  // מסחר עם חבר (trade.js), על השרת המדומה: הצעה נועלת את מה שנותנים, ביטול מחזיר, החבר מקבל או דוחה, השולח אוסף פעם אחת, ובלי הטבלה הכפתור לא מופיע
  const td=await page.evaluate(async()=>{const r={},F=CLOUD.fake=cloudFakeServer();const bak=JSON.stringify(SAVE);
    CLOUD.session=null;try{localStorage.removeItem(CLOUD.lsKey)}catch(e){}VISIT.ready=null;VISIT.last='';TRADE.ready=null;
    await cloudSync();F.google.u1='Nir';F.google.u2='Orel';CLOUD.session.name='Nir';const nir=Object.assign({},CLOUD.session);
    const orel=Object.assign({},nir,{uid:'u2',access:'au2',name:'Orel'}),as=x=>{CLOUD.session=Object.assign({},x,{exp:Date.now()/1000+3600})};
    F.profiles.u2={user_id:'u2',name:'Orel',level:5,data:{village:{center:2},bag:{stone:30,iron:4}}};
    await tradeVillage(true);r.ready=TRADE.ready===true;
    bagAdd('wood',20);const w0=SAVE.bag.wood,s0=SAVE.bag.stone||0;await visitOpen();
    document.querySelector('#visitWin [data-act="trade"]').click();
    r.open=!$('ovTrade').hidden&&$('ovVisit').hidden&&TRADE.mode==='make'&&!!document.querySelector('#tradeWin [data-act="want"][data-r="stone"]')&&
      document.querySelectorAll('#tradeWin [data-act="want"]').length===2;
    TRADE.give='wood';TRADE.gn=5;TRADE.want='stone';TRADE.wn=5;tradeDraw();
    window.__trSt=$('ovStart').hidden;$('ovStart').hidden=true;
    return Object.assign(r,{bak,w0,s0,nir,orel})}).catch(e=>({err:String(e)}));
  await shot('trade');
  const td2=await page.evaluate(async T0=>{const r={},F=CLOUD.fake,as=x=>{CLOUD.session=Object.assign({},x,{exp:Date.now()/1000+3600})};$('ovStart').hidden=window.__trSt;
    const wait=async f=>{for(let i=0;i<3000&&!f();i++)await Promise.resolve()};
    document.querySelector('#tradeWin [data-act="send"]').click();await wait(()=>F.trades.length&&!TRADE.busy);
    const t=F.trades[0];r.lock=!!t&&t.status==='open'&&t.give_res==='wood'&&t.give_n===5&&t.want_res==='stone'&&t.want_n===5&&SAVE.bag.wood===T0.w0-5;
    // ביטול מחזיר
    TRADE.gn=1;TRADE.wn=1;await tradeSend();const c=F.trades[1];const back=c&&await tradeCancel(c.id);
    r.cancel=!!back&&F.trades.length===1&&SAVE.bag.wood===T0.w0-5;
    // עוד הצעה, שתידחה. ועד 3 פתוחות
    TRADE.gn=1;TRADE.want='iron';await tradeSend();await tradeSend();const full=await tradeSend()===false&&F.trades.length===3;
    tradeClose();r.back=!$('ovVisit').hidden;visitClose();
    let bad=false;try{await F.req('POST','/rest/v1/trades',{from_id:'u1',to_id:'u2',give_res:'wood',give_n:1,want_res:'stone',want_n:1},'au1')}catch(e){bad=true}r.rls=bad&&full;
    // אוראל: מקבל את הראשונה, דוחה את השנייה. אוראל לא יכול לשנות כמויות
    as(T0.orel);const keep=JSON.stringify(SAVE.bag);SAVE.bag={stone:10};await tradeVillage(true);r.inc=TRADE.inc.length===3;
    tradeInbox();r.win=!$('ovTrade').hidden&&document.querySelectorAll('#tradeWin [data-act="yes"]').length===3&&!!document.querySelector('#tradeWin [data-act="yes"][disabled]');
    let bad2=false;try{await F.req('PATCH','/rest/v1/trades?id=eq.'+F.trades[0].id,{status:'accepted',give_n:20},'au2')}catch(e){bad2=true}
    const ids=F.trades.map(x=>x.id);
    document.querySelector('#tradeWin [data-act="yes"][data-id="'+ids[0]+'"]').click();await wait(()=>!TRADE.busy&&TRADE.inc.length===2);
    r.acc=SAVE.bag.stone===5&&SAVE.bag.wood===5&&F.trades[0].status==='accepted'&&bad2;
    r.no=await tradeAnswer(ids[1],false)&&F.trades[1].status==='declined'&&await tradeAnswer(ids[1],true)===false;
    tradeClose();r.closed=$('ovTrade').hidden;
    // ניר אוסף: אבן מהעסקה, עץ שחזר מהדחייה, פעם אחת בלבד
    SAVE.bag=JSON.parse(keep);as(T0.nir);const w1=SAVE.bag.wood,s1=SAVE.bag.stone||0;await tradeVillage(true);
    r.got=SAVE.bag.stone===s1+5&&SAVE.bag.wood===w1+1&&F.trades.length===1&&TRADE.out.length===1;
    await tradeVillage(true);r.once=SAVE.bag.stone===s1+5&&SAVE.bag.wood===w1+1;
    // בלי הטבלה: הכפתור לא מופיע
    F.noTrade=true;TRADE.ready=null;await tradeVillage(true);VISIT.sel={user_id:'u2',name:'Orel',level:1,data:{}};r.noTable=TRADE.ready===false&&tradeBtnHtml(VISIT.sel)===''&&tradeOpen(VISIT.sel)===false;
    SAVE=JSON.parse(T0.bak);SAVE_STORE.write(SAVE,true);CLOUD.fake=cloudFakeServer();CLOUD.session=null;try{localStorage.removeItem(CLOUD.lsKey)}catch(e){}
    CLOUD.dirty=false;VISIT.ready=null;VISIT.last='';TRADE.ready=null;TRADE.inc=[];TRADE.out=[];VISIT.sel=null;return r},td).catch(e=>({err:String(e)}));
  check(td.ready&&td.open,'מסחר: חלון ההצעה '+(td.open?'נפתח מהביקור, עם מה שיש לחבר':'לא נפתח'));
  check(td2.lock&&td2.cancel&&td2.back,'מסחר: הצעה '+(td2.lock?'נשלחה ומה שנותנים נעול':'לא ננעלה'+(td2.err?' ('+td2.err+')':''))+', '+(td2.cancel?'וביטול מחזיר אותו':'וביטול לא החזיר'));
  check(td2.rls,'מסחר: '+(td2.rls?'עד 3 הצעות פתוחות':'יותר מ-3 הצעות פתוחות'));
  check(td2.inc&&td2.win&&td2.acc&&td2.no&&td2.closed,'מסחר: החבר '+(td2.acc?'מקבל הצעה ומשאבים עוברים':'לא הצליח לקבל')+', '+(td2.no?'דוחה הצעה פעם אחת':'דחייה לא עבדה'));
  check(td2.got&&td2.once,'מסחר: השולח '+(td2.got?'אוסף את מה שביקש ואת מה שנדחה':'לא קיבל')+', '+(td2.once?'פעם אחת בלבד':'וקיבל פעמיים'));
  check(td2.noTable,'מסחר: בלי הטבלה בענן '+(td2.noTable?'הכפתור לא מופיע':'משהו נשבר'));
  // שוק: מוכרים עץ, לא מצליחים לקנות בלי מספיק מטבעות, ואז קונים אבן. בסוף מנקים
  const mk=await page.evaluate(()=>{SAVE.village.market=1;bagAdd('wood',10);const sell=vTrade('sell','wood')&&SAVE.bag.coins===5&&SAVE.bag.wood===5;
    const poor=!vTrade('buy','stone');bagAdd('coins',20);const buy=vTrade('buy','stone')&&SAVE.bag.stone===5&&SAVE.bag.coins===10;
    localStorage.removeItem(SAVE_STORE.key);saveLoad();return{sell,poor,buy}});
  check(mk.sell&&mk.poor&&mk.buy,'שוק: '+(mk.sell?'מכירה עובדת':'מכירה נכשלה')+', '+(mk.poor?'בלי מטבעות אי אפשר לקנות':'קנה בלי כסף')+', '+(mk.buy?'קנייה עובדת':'קנייה נכשלה'));
  // לילה בכפר (vfx.js, VFX.night ו-VFX.pools): בשיא הלילה הכפר מקבל את המספרים הבהירים, העולם נשאר חשוך, ביום אין שינוי. בתלת-ממד: כתמי האור נבנים, דולקים בלילה וכבויים ביום
  const nv=await page.evaluate(()=>{if(typeof VFX==='undefined'||typeof VFX.todAt!=='function')return{skip:true};const N=VFX.night.village,v=VFX.todAt(1,'village'),w=VFX.todAt(1,'meadow'),d=VFX.todAt(12,'village'),q=x=>Math.abs(x)<1e-6;
    const r={vil:q(v.k-N.k)&&q(v.exp-N.exp)&&q(v.vig-N.vig)&&v.n===1,world:q(w.k-VFX.tod[0].k)&&q(w.exp-VFX.tod[0].exp),day:d.n===0&&d.k===1};
    if(R3D.on&&R3D.ready){VFX.poolsSync(1);const L=VFX.poolList(),want=VILLAGE.props.filter(p=>p.k==='lamp').length+VFX.pools.mark.at.length;r.pools=L.length+'/'+want;
      r.lit=L.length===want&&L.every(m=>m.visible&&m.material.opacity>0);VFX.poolsSync(0);r.off=L.every(m=>!m.visible)}else{r.lit=r.off=true;r.pools='2d'}
    return r});
  check(nv.skip||nv.vil&&nv.world&&nv.day&&nv.lit&&nv.off,'לילה בכפר: '+(nv.skip?'VFX כבוי':(nv.vil?'המספרים הבהירים בכפר':'הכפר לא קיבל את מספרי הלילה')+', '+(nv.world?'העולם לא השתנה':'העולם השתנה')+', '+(nv.day?'ביום בלי שינוי':'היום השתנה')+', כתמי אור '+nv.pools+(nv.lit?' דולקים בלילה':' לא דולקים')+(nv.off?' וכבויים ביום':' ולא כבים')));
  // חנות קישוטים (deco.js): קונים דגל, הוא עומד במקום פנוי (לא על מבנה), השני יקר יותר, בלי מטבעות אי אפשר, מזיזים ומורידים למחסן, והחבר רואה בפרופיל. בסוף מנקים
  const dc=await page.evaluate(()=>{const r={};try{SAVE.village.market=1;SAVE.bag.coins=0;bagAdd('coins',DECO.items.flag.price);
    const sl=decoSlots();r.slots=sl.length;r.clear=sl.every(s=>Object.values(VILLAGE.b).every(B=>Math.hypot(s.x-B.x,s.y-B.y)>B.r+20));
    const p1=decoPrice('flag');r.buy=decoBuy('flag')===''&&!SAVE.bag.coins&&SAVE.deco.put.length===1&&SAVE.deco.put[0].k==='flag'&&decoAt(0)===0;
    r.dearer=decoPrice('flag')>p1&&decoBuy('flag')==='coins'&&SAVE.deco.put.length===1;
    const box=document.createElement('div');box.innerHTML=decoHtml();r.html=box.querySelectorAll('.dslot').length===sl.length&&box.querySelectorAll('.dslot.has').length===1&&!!box.querySelector('[data-act="decoBuy"][data-k="flag"][disabled]');
    decoAct('decoSlot',{i:'0'});decoAct('decoSlot',{i:'3'});r.move=decoAt(3)===0&&decoAt(0)<0;
    decoAct('decoSlot',{i:'3'});decoAct('decoStore',{});r.store=!SAVE.deco.put.length&&SAVE.deco.own.flag===1;
    decoAct('decoOwn',{k:'flag'});decoAct('decoSlot',{i:'1'});r.back=decoAt(1)===0&&!SAVE.deco.own.flag;
    const pub=decoPub();r.pub=pub.length===1&&pub[0][0]==='flag'&&box.innerHTML!==''&&/visdeco/.test(decoVisitHtml(pub));
    r.save=JSON.parse(localStorage.getItem(SAVE_STORE.key)).deco.put.length===1;
  }catch(e){r.err=String(e)}
    localStorage.removeItem(SAVE_STORE.key);saveLoad();DECO.sel=null;return r});
  check(dc.slots>=12&&dc.clear,'קישוטים: '+dc.slots+' מקומות פנויים בכפר'+(dc.clear?', אף אחד לא על מבנה':', ויש מקום על מבנה')+(dc.err?' ('+dc.err+')':''));
  check(dc.buy&&dc.dearer&&dc.html,'קישוטים: דגל '+(dc.buy?'נקנה ועומד בכפר':'לא נקנה')+', '+(dc.dearer?'השני יקר יותר ובלי מטבעות אי אפשר':'המחיר לא עולה או שנקנה בלי כסף')+', '+(dc.html?'והמפה בשוק מראה אותו':'והמפה לא מראה'));
  check(dc.move&&dc.store&&dc.back&&dc.save,'קישוטים: '+(dc.move?'מזיזים במפה':'הזזה לא עבדה')+', '+(dc.store?'מורידים למחסן':'לא ירד למחסן')+', '+(dc.back?'ומציבים שוב':'ולא הוצב שוב')+(dc.save?'':', ולא נשמר'));
  check(dc.pub,'קישוטים: החבר '+(dc.pub?'רואה אותם בביקור':'לא רואה אותם'));
  // מתנה יומית: יום ראשון נותן, אותו יום לא נותן שוב, יום חדש מתקדם. יום 7 נותן תיבה, ואחריו הלוח מתחיל מחדש. בסוף מנקים
  const dg=await page.evaluate(()=>{const r1=dailyClaim('t1'),c=SAVE.bag.coins||0,r2=dailyClaim('t1'),again=r2===null&&(SAVE.bag.coins||0)===c,r3=dailyClaim('t2');
    const first=!!r1&&r1.i===0&&r1.got.coins===DAILY.days[0].coins,next=!!r3&&r3.i===1;
    let last;for(let d=3;d<=7;d++)last=dailyClaim('t'+d);
    const chest=last.i===6&&last.big&&Object.keys(last.got).some(k=>k==='gem'||GEAR.items[k]),wrap=dailyIdx()===0;
    localStorage.removeItem(SAVE_STORE.key);saveLoad();return{first,again,next,chest,wrap}});
  check(dg.first&&dg.again&&dg.next,'מתנה יומית: '+(dg.first?'יום ראשון נותן פרס':'יום ראשון לא נתן')+', '+(dg.again?'אותו יום לא נותן שוב':'נתן פעמיים ביום')+', '+(dg.next?'יום חדש מתקדם':'יום חדש לא התקדם'));
  check(dg.chest&&dg.wrap,'מתנה יומית: יום 7 '+(dg.chest?'נותן תיבה (אבן חן או ציוד)':'בלי תיבה')+', '+(dg.wrap?'ואחריו הלוח מתחיל מחדש':'והלוח לא חזר להתחלה'));
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
    const arenaMon=new Set([...HORDE.monsters.map(m=>m.type),...RUN.elite.types]);   // מפלצות הזירה (spawn.js) באות מה-spawner, לא ממקור
    for(const t in ETYPES)if(!['grunt','shield','wisp'].includes(t)&&!arenaMon.has(t)&&!ETYPES[t].warden&&!ETYPES[t].rare&&(!guards.has(t)||!LOOK3D[t]||!(ETYPES[t].tags||[]).length))lost.push(t);
    for(const b in BOSSES)add(src,BOSSES[b].drop,'boss:'+b);
    add(src,WANTED.drop,'wanted');WANTED.loot.forEach(l=>add(src,l.res,'wanted:'+l.key));
    add(src,BONUS.roomRes,'room');
    // פרסים של קווסטים הם עוד מקור, ומשאב שקווסט מבקש להביא חייב להיות קיים (quests.js)
    for(const q of QUESTS.list){add(src,Object.fromEntries(Object.entries(q.reward||{}).filter(([k])=>k!=='xp'&&k!=='item'&&k!=='rank'&&k!=='story')),'quest:'+q.id);
      for(const o of q.obj)if(o.type==='collect'&&o.what!=='coins'&&!resOf(o.what))bad.add(o.what+' (quest:'+q.id+')')}
    const placed=new Set(Object.values(NODES.arenas).flatMap(a=>a.spawn.map(s=>s.kind)));
    for(const k in NODES.kinds)if(placed.has(k))add(src,NODES.kinds[k].drop,'node:'+k);
    for(const f of WORLD.fields)add(src,NODES.kinds[f.kind].wdrop,'world:'+f.kind);   // שלל שרק בעולם הפתוח
    for(const k in PET.kinds)PET.kinds[k].stages.forEach((s,i)=>add(src,s.dig.loot,'pet:'+k+(i+1)));   // החפירה של חיית המחמד (pet.js)
    add(use,{[PET.feed.res]:1},'pet:feed');
    for(const p in FISH.pools)add(src,FISH.pools[p],'fish:'+p);for(const k in FISH.meals)add(use,FISH.meals[k].need,'cook:'+k);   // דיג ובישול (fishing.js)   // גזר: להאכיל את חיית המחמד (pet.js)
    AGING.cost.forEach(c=>add(use,c,'aging'));add(use,{[AGING.gem]:1},'aging:gem');
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
    (eco.tier.length?' · מתכון בלי המתכת של השכבה: '+eco.tier.join(', '):'')+(eco.lost.length?' · יצור בלי מקור ששומר עליו, LOOK3D או tags: '+eco.lost.join(', '):'')+(eco.death?'':' · deathLoss חסר'));
  // שלל: מזל עם הגנה (אחרי הרבה החטאות הסיכוי לנדיר גדל, ונופל = מתאפס), והריגה ראשונה היום נותנת בונוס פעם אחת לכל סוג
  const lt=await page.evaluate(()=>{
    const c0=celebrate;celebrate=()=>0;   // בלי אלפי חגיגות בבדיקה
    const rate=p=>{let n=0;for(let i=0;i<2000;i++){SAVE.pity=p;if(runGive({rubyC:[0.1,1]},0,0).length)n++}return n/2000};
    const low=rate(0),high=rate(1000);SAVE.pity=5;runGive({rubyC:[1,1]},0,0);const reset=SAVE.pity===0;runGive({rubyC:[0,1]},0,0);const grow=SAVE.pity===1;
    SAVE.daily={day:'1999-1-1',first:{}};S.firstKills=0;const g={type:'grunt',x:0,y:0,r:13};lootKill(g);lootKill(g);const first=S.firstKills===1&&SAVE.daily.first.grunt===1;
    celebrate=c0;FX.length=0;floats=[];orbs=[];S.loot={};S.gd=[];S.gdN=null;S.drops=null;S.killsBy=null;localStorage.removeItem(SAVE_STORE.key);saveLoad();
    return{low,high,reset,grow,first}});
  check(lt.high>lt.low*2&&lt.reset&&lt.grow&&lt.first,'מזל עם הגנה: נדיר '+Math.round(lt.low*100)+'% בהתחלה, '+Math.round(lt.high*100)+'% אחרי הרבה החטאות'+
    (lt.reset&&lt.grow?', מתאפס כשנופל':', לא מתאפס')+(lt.first?', הריגה ראשונה היום: בונוס פעם אחת':', בונוס הריגה ראשונה שבור'));
  // טווח נזק (weapons.js): לכל נשק טווח, הממוצע שווה לנזק של לפני הטווח (בסיס × סוג × ציוד), כבדים רחבים יותר, והמכות באמת בטווח
  const wr=await page.evaluate(()=>{
    const bad=[],ids=Object.keys(GEAR.items).filter(id=>GEAR.items[id].slot==='weapon'),P0=P,out=[];
    for(const id of ids){const it=GEAR.items[id],W=WEAPONS[it.w],st=gStats(id);
      const old=(W.use==='sword'?20:9)*((W.k||{}).dmg||1)*(1+(st[W.use==='sword'?'sdmg':'gdmg']||0)/100),avg=wItemAvg(id),r=wRange(avg,it.w);
      if(!(W.spread>0)||Math.abs(avg-old)>1e-9||!(r[0]<avg&&avg<r[1]))bad.push(id);
      P={wt:it.w};let sum=0,lo=1e9,hi=0;const N=4000;for(let i=0;i<N;i++){const d=wRoll(avg);sum+=d;lo=Math.min(lo,d);hi=Math.max(hi,d)}P=P0;
      if(lo<avg*(1-W.spread)-1e-9||hi>avg*(1+W.spread)+1e-9||Math.abs(sum/N-avg)>avg*0.03)bad.push(id+' (הגרלה)');
      out.push(id+' '+r[0]+'–'+r[1])}
    const order=wSpread('wand')<wSpread('bow')&&wSpread('sword')<wSpread('bow')&&wSpread('bow')<wSpread('axe')&&wSpread('axe')<wSpread('hammer');
    const card=/–/.test(gStatsHtml('oakSword'))&&/▲/.test(gCompare('ironSword','oakSword'))&&/▼/.test(gCompare('oakSword','ironSword'));
    return{bad,order,card,out:out.slice(0,4).join(', ')}});
  check(!wr.bad.length&&wr.order&&wr.card,'טווח נזק: '+(wr.bad.length?'שבור ב-'+wr.bad.join(', '):'לכל נשק טווח, הממוצע כמו קודם והמכות בטווח')+
    (wr.order?', כבדים רחבים יותר':', הסדר של הטווחים לא נכון')+(wr.card?', בכרטיס ובהשוואה':', חסר בכרטיס או בהשוואה')+' ('+wr.out+')');
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
    // "מה זה?": לכל משאב יש שורה עם מאיפה ובשביל מה, ונגיעה בתג מציגה אותה
    const tipBad=Object.keys(RES.list).filter(r=>r!=='coins'&&!(resTip(r).includes(T('tip.from','').trim())&&resTip(r).includes(T('tip.for','').trim())));
    document.body.insertAdjacentHTML('beforeend','<div id="tipT">'+resChip('iron',1)+'</div>');document.querySelector('#tipT .res').click();
    const tt=document.getElementById('resTip'),tapTip=!!tt&&!tt.hidden&&tt.textContent===resTip('iron');document.getElementById('tipT').remove();if(tt)tt.hidden=true;
    return{spread,gate,top,sold,bought,buyable,n:rs.length,craft,ore,bar,tipBad,tapTip}});
  check(!mk2.spread.length&&mk2.gate&&mk2.top&&mk2.sold===mk2.n&&mk2.bought===mk2.buyable,'שוק מלא: נמכרו '+mk2.sold+'/'+mk2.n+', נקנו '+mk2.bought+'/'+mk2.buyable+
    (mk2.spread.length?' · קנייה לא יקרה ממכירה: '+mk2.spread.join(', '):', קנייה תמיד יקרה ממכירה')+(mk2.gate&&mk2.top?', נדיר נפתח ברמה גבוהה, חלק בוס לא למכירה':', הרמות של השוק לא נכונות'));
  check(!mk2.tipBad.length&&mk2.tapTip,'מה זה? על משאב: '+(mk2.tipBad.length?'בלי מקור או שימוש: '+mk2.tipBad.join(', '):'לכל משאב מאיפה ובשביל מה')+(mk2.tapTip?', נגיעה מציגה':', נגיעה לא מציגה'));
  check(mk2.craft&&mk2.ore&&mk2.bar,'נפחייה ופס עליון: '+(mk2.craft?'יוצרים חרב עץ, ברזל נעול ברמה 1':'יצירה נכשלה')+(mk2.ore?', עפרות ישנות הפכו לברזל':', עפרות לא הומרו')+
    (mk2.bar?', בנפחייה רואים מתכות ולא עץ':', הפס העליון לא לפי מקום'));
  // קווסטים: 4 יומיים ויום חדש מחליף אותם, הישגים פעילים לבד, ניצחון בלי פגיעה ושדרוג מבנה נספרים נכון. בסוף מנקים
  // לפני פנס האדמה רק העלילה (QUESTS.early): כאן בודקים את המנוע עצמו, ולכן הוא פתוח לכולם. החסימה עצמה נבדקת בשחקן חדש
  const qe=await page.evaluate(()=>{const Q=SAVE.quests,by=id=>QUESTS.list.find(q=>q.id===id);QUESTS.early.ids=QUESTS.list.map(q=>q.id);questsRefresh();
    const daily=Q.daily.length===QUESTS.daily&&Q.daily.every(id=>Q.active[id]);
    const ach=QUESTS.list.filter(q=>q.kind==='achievement').every(q=>Q.active[q.id]);
    // יום חדש: יומי שלא נגמר יורד, ויומי שנגמר ומחכה לפרס נשאר עד שלוקחים (ביקורת 6.11, פריט 3). הראשון מוכן בכוונה
    const old=Q.daily.slice();for(const id of old)Q.active[id].p[0]=1;Q.active[old[0]].p=QBY[old[0]].obj.map(o=>o.n);const rdy=old.filter(id=>qReady(QBY[id]));
    Q.day='1999-1-1';questsRefresh();
    const day=Q.daily.length===QUESTS.daily&&Q.daily.every(id=>Q.active[id]&&Q.active[id].p.every(v=>v===0))&&rdy.every(id=>Q.active[id]&&!Q.daily.includes(id))&&
      old.filter(id=>!Q.daily.includes(id)&&!rdy.includes(id)).every(id=>!Q.active[id]);
    for(const id of rdy)delete Q.active[id];
    S.boss={};questEvent('hurt');S.boss=null;questEvent('win');const hit=!qReady(by('aClean'));S.q.bossHit=0;questEvent('win');const clean=qReady(by('aClean'));
    qStart(by('firstMill'));SAVE.village.mill=1;questEvent('upgrade','mill');const up=qReady(by('firstMill'));
    qStart(by('wFirst'));questEvent('reach','world');questEvent('gather','wood',6);questEvent('collect','wood',9);const wHalf=!qReady(by('wFirst'));questEvent('gather','wood',4);const world=wHalf&&qReady(by('wFirst'));
    localStorage.removeItem(SAVE_STORE.key);saveLoad();QUESTS.early.ids=['boots'];S.q=null;$('qTrack').hidden=true;$('qTrack').textContent='';   // קו המעקב נכתב כאן בעברית, לפני שהבדיקה באנגלית מחליפה שפה
    return{daily,ach,day,noHit:hit&&clean,up,world}});
  check(qe.daily&&qe.ach&&qe.day&&qe.noHit&&qe.up&&qe.world,'מנוע קווסטים: '+(qe.daily?'4 יומיים':'יומיים לא נבחרו')+', '+(qe.day?'מתחלפים ביום חדש':'לא מתחלפים ביום חדש')+', '+
    (qe.ach?'הישגים פעילים':'הישגים לא פעילים')+', '+(qe.noHit?'ניצחון בלי פגיעה נבדק':'ניצחון בלי פגיעה שבור')+', '+(qe.up?'שדרוג מבנה נספר':'שדרוג מבנה לא נספר')+', '+(qe.world?'יציאה לעולם ואיסוף בו נספרים':'אירועי העולם לא נספרים'));
  // קווסטים צדדיים ולוח מודעות (questboard.js, ת15): בכל אזור 6-10, מגוונים, וכל מקום ודמות קיימים. קווסט מתקבל, מושלם ונותן פרס, השרשרת ממשיכה,
  // להגן נספר בשניות, "למסור הודעה" נותן פרס במקום, והלוח: 3 משימות, מה שנלקח מתחלף, ואחרי פרס הלוח שוב מלא. בסוף מנקים
  const sq=await page.evaluate(()=>{const r={};try{const Q=QS(),E=QUESTS.early.ids;QUESTS.early.ids=QUESTS.list.map(q=>q.id);
    const side=QUESTS.list.filter(q=>/^sq/.test(q.id)),per={};
    for(const q of side){const g=WNPC.list[q.giver];const reg=g?(g.reg||'meadow'):'?';(per[reg]=per[reg]||{n:0,types:new Set()}).n++;q.obj.forEach(o=>per[reg].types.add(o.type))}
    r.per=Object.keys(per).map(k=>k+':'+per[k].n+'/'+per[k].types.size).join(' ');
    r.regions=Object.keys(QBOARD.regs).every(k=>per[k]&&per[k].n>=6&&per[k].n<=10&&per[k].types.size>=3);
    r.bad=side.filter(q=>!WNPC.list[q.giver]||q.obj.some(o=>(o.type==='visit'||o.type==='hold')&&!sqPlace(o.what)||o.type==='meet'&&!WNPC.list[o.what])).map(q=>q.id);
    r.text=side.filter(q=>!Array.isArray(T('q.'+q.id))).map(q=>q.id).concat(Object.keys(WNPC.list).filter(k=>!Array.isArray(T('npc.'+k))));
    SAVE.met.scout=1;SAVE.met.hermit=1;const a=QBY.sqScout1,xp0=SAVE.hero.xp||0,c0=SAVE.bag.coins||0;
    r.open=qOpen(a)&&!qOpen(QBY.sqScout2);questAct('accept','sqScout1');questEvent('visit','meadow:spring');const notYet=!qReady(a);questEvent('visit','meadow:lookout');
    r.visit=notYet&&qReady(a);questAct('claim','sqScout1');r.paid=(SAVE.hero.xp||0)-xp0===a.reward.xp&&(SAVE.bag.coins||0)-c0===a.reward.coins&&!!Q.done.sqScout1;
    r.chain=qOpen(QBY.sqScout2);questAct('accept','sqScout2');questEvent('hold','meadow:bank',24);const h1=!qReady(QBY.sqScout2);questEvent('hold','meadow:bank',1);r.hold=h1&&qReady(QBY.sqScout2);
    questAct('claim','sqScout2');questAct('accept','sqScout3');questEvent('meet','hermit');r.meet=!!Q.done.sqScout3&&!Q.active.sqScout3;
    // הלוח באחו
    SAVE.met.qb_meadow=1;qbSync('meadow');const B=qbR('meadow'),first=B.offer.slice(),id=qbId('meadow',first[0]),q=QBY[id];
    r.board=first.length===QBOARD.offers&&first.every(t=>qOpen(QBY[qbId('meadow',t)]))&&q.reward.xp>0&&q.obj.length>0;
    questAct('accept',id);qbSync('meadow');r.swap=B.offer.length===QBOARD.offers&&!B.offer.includes(first[0])&&!qOpen(q);
    for(const o of q.obj)questEvent(o.type,o.what,o.n);r.bReady=qReady(q);const x1=SAVE.hero.xp;questAct('claim',id);
    r.bPaid=SAVE.hero.xp>x1&&QB().n===1&&B.offer.length===QBOARD.offers&&!Q.active[id];
    B.day='1999-1-1';const before=B.offer.map(t=>B.p[t]);qbSync('meadow');r.day=B.offer.length===QBOARD.offers;r.dayNew=B.day===qDay()&&B.offer.every(t=>B.p[t]&&!before.includes(B.p[t]));   // כל משימה על הלוח נוצרה מחדש. לא משווים סדר: ההגרלה יכולה לצאת אותו דבר במקרה
    QUESTS.early.ids=E;
  }catch(e){r.err=String(e&&e.stack||e).slice(0,200)}
    localStorage.removeItem(SAVE_STORE.key);saveLoad();S.q=null;$('qTrack').hidden=true;$('qTrack').textContent='';return r});
  check(sq.regions&&!sq.bad.length&&!sq.text.length,'קווסטים צדדיים: '+sq.per+' (אזור:קווסטים/סוגי יעדים)'+(sq.bad.length?', מקום או דמות חסרים: '+sq.bad.join(','):'')+(sq.text.length?', בלי טקסט: '+sq.text.join(','):'')+(sq.err?' ('+sq.err+')':''));
  check(sq.open&&sq.visit&&sq.paid&&sq.chain&&sq.hold&&sq.meet,'קווסט צדדי: '+(sq.open?'נפתח כשמוצאים את הסיירת':'לא נפתח')+', '+(sq.visit?'לחקור מקום נספר':'לחקור לא נספר')+', '+(sq.paid?'פרס XP ומטבעות':'בלי פרס')+', '+
    (sq.chain?'השרשרת ממשיכה':'השרשרת נתקעה')+', '+(sq.hold?'להגן נספר בשניות':'להגן לא נספר')+', '+(sq.meet?'הודעה נמסרת עם פרס במקום':'הודעה לא נמסרה'));
  check(sq.board&&sq.swap&&sq.bReady&&sq.bPaid&&sq.day&&sq.dayNew,'לוח מודעות: '+(sq.board?'3 משימות עם פרס':'אין 3 משימות')+', '+(sq.swap?'מה שנלקח מתחלף בחדשה':'לא התחלף')+', '+(sq.bPaid?'פרס והלוח שוב מלא':'בלי פרס או לוח חסר')+', '+(sq.dayNew?'יום חדש מחדש':'יום חדש לא מחדש'));
  // ליווי דמות (escort.js): לכל קווסט ליווי יש דרך מהבית שלה ליעד. הנזיר יוצא לדרך כשאתה לידו והולך, אויב שמגיע אליו מפיל אותו: הקווסט נכשל,
  // הוא חוזר הביתה ולא יוצא שוב עד שמדברים איתו. בפעם השנייה הוא מגיע, היעד הושלם, והפרס אצלו. בסוף מחזירים את השמירה
  const es=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={},ov=['ovStart','ovOver','ovLevel','ovBoss','ovWDeath'].map(id=>[id,$(id).hidden]);   // enterWorld מסתיר את מסך הפתיחה, והבדיקה באנגלית לוחצת עליו אחר כך
    try{const Q=QS(),E0=QUESTS.early.ids;QUESTS.early.ids=QUESTS.list.map(q=>q.id);r.paths={};
      for(const q of QUESTS.list){const i=q.obj.findIndex(o=>o.type==='escort');if(i<0)continue;const N=WNPC.list[q.giver],p=sqPlace(q.obj[i].what);
        enterWorld('home',N.reg||'meadow');r.paths[q.id]=!!tPath(N.at.x,N.at.y,p.x,p.y)}
      SAVE.met.hermit=1;Q.done.sqHerm3=1;enterWorld('home','meadow');enemies=[];const W=S.wd,n=wnpcState().hermit,A=WNPC.list.hermit.at;
      questAct('accept','sqHerm4');const near=()=>{P.x=n.x+40;P.y=n.y;P.hp=P.maxHp};
      const step=t=>{for(let i=0;i<t*30;i++){near();escUpdate(1/30)}};
      step(0.1);r.start=!!W.esc&&W.esc.id==='hermit';const x0=n.x;step(1);r.walk=Math.hypot(n.x-A.x,n.y-A.y)>40&&n.walk;
      const e=addEnemy('grunt',n.x+15,n.y);e.esc=true;e.dmg=ESCORT.hp+10;step(0.3);
      r.fail=!W.esc&&Math.hypot(n.x-A.x,n.y-A.y)<1&&!qReady(QBY.sqHerm4)&&!!QS().active.sqHerm4;
      step(0.5);r.noRestart=!W.esc;e.dead=true;enemies=[];
      escTalk('hermit');step(0.1);r.again=!!W.esc;
      for(let k=0;k<200&&W.esc;k++)step(1);
      r.arrive=!W.esc&&qReady(QBY.sqHerm4)&&Math.hypot(n.x-SIDEQ.places.meadow.temple.x,n.y-SIDEQ.places.meadow.temple.y)<ESCORT.arrive+5;
      const x1=SAVE.hero.xp;questAct('claim','sqHerm4');r.paid=SAVE.hero.xp>x1&&!!QS().done.sqHerm4;
      QUESTS.early.ids=E0;
    }catch(err){r.err=String(err&&err.stack||err).slice(0,300)}
    worldUi(false);SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}for(const [id,h] of ov)$(id).hidden=h;return r});
  check(es.start&&es.walk&&es.fail&&es.noRestart&&es.again&&es.arrive&&es.paid&&Object.values(es.paths||{}).every(Boolean),'ליווי: '+Object.keys(es.paths||{}).filter(k=>es.paths[k]).length+'/'+Object.keys(es.paths||{}).length+' עם דרך'+
    ', '+(es.start&&es.walk?'יוצא לדרך והולך':'לא יצא לדרך')+', '+(es.fail&&es.noRestart?'נופל, הקווסט נכשל והוא חוזר הביתה':'נפילה לא עובדת')+', '+(es.again?'שיחה מנסה שוב':'לא מנסה שוב')+', '+
    (es.arrive?'מגיע ליעד':'לא הגיע')+', '+(es.paid?'ופרס':'בלי פרס')+(es.err?' ('+es.err+')':''));
  // דרגות (ranks.js): רמה 20 פותחת קווסט דרגה אצל הכוהנת, הסגנון קובע איזו דרגה, ולקיחת הפרס שומרת אותה, מפעילה טקס ומוסיפה בונוס קבוע. בסוף מנקים
  const rk=await page.evaluate(()=>{const q=QUESTS.list.find(q=>q.kind==='rank'),mode=S.mode,r={every:RANKS.every};
    r.locked=!qOpen(q);
    SAVE.hero.xp=0;for(let l=1;l<RANKS.every;l++)SAVE.hero.xp+=rankNeed(l);rankSync();r.lv=SAVE.hero.level;
    r.open=qOpen(q)&&q.giver==='priest';r.call=[document.getElementById('banner').textContent,...(typeof BANNER!=='undefined'?BANNER.q.map(b=>b[0]):[]),...(typeof CQS!=='undefined'?CQS.q.map(m=>m.txt||''):[]),...(typeof MSG!=='undefined'?MSG.seen.concat(MQ.small.map(m=>m.txt),MQ.big.map(m=>m.txt)):[])].includes(T('rank.call',T('npc.priest')[0]));   // הודעות בתור (welcome.js)   // הכוהנת קוראת לך (rankCall)
    const sty=st=>{SAVE.hero.style=st;return rankFor(1)};
    const picks={knight:sty({dmg_sword:900,dmg_gun:100,t_run:100}),ranger:sty({dmg_sword:50,dmg_gun:900,t_run:100}),
      hybrid:sty({dmg_sword:500,dmg_gun:500,t_run:100}),guardian:sty({dmg_sword:900,t_run:100,t_defense:80})};
    r.picks=Object.keys(picks).map(k=>k+'→'+picks[k]).join(', ');r.style=Object.keys(picks).every(k=>picks[k]===k);
    sty({dmg_sword:900,dmg_gun:50,t_run:100});   // בעיקר חרב: אביר
    questLogOpen(true);const acc=document.querySelector('#qLog [data-q="'+q.id+'"][data-act="accept"]');if(acc)acc.click();
    questLog();r.accepted=!!SAVE.quests.active[q.id];r.card=(document.querySelector('#qLog [data-q="'+q.id+'"]')||{closest:()=>null}).closest('.qc');
    r.card=r.card?r.card.textContent.includes(rankName('knight')):false;   // textContent: הסוג מכווץ ביומן (guide.js)
    questEvent('collect','bone',30);SAVE.rares={got:{mossback:1,glimmer:1,pearl:1},miss:0};questEvent('rare','pearl');   // 3 נדירות שונות (rares.js). הצייד האמיתי נבדק ב'מפלצות נדירות'
    questLog();const hp=P.maxHp,cl=document.querySelector('#qLog [data-q="'+q.id+'"][data-act="claim"]');if(cl)cl.click();
    r.claimed=!!cl&&SAVE.quests.done[q.id]===1;r.rank=SAVE.hero.rankId;r.hp=P.maxHp-hp;r.want=RANKS.list.knight.bonus.hp;
    r.fx=FX.some(f=>f.K===CELEBRATE.rankup);r.fxLib=!(S.vil||S.wd)||FXV.stat.rankup>0;   // דרגה: טקס זהב משלו, ובכפר ובעולם גם עמוד אור ומדליה מהספרייה (fxvil.js)
    const sv=JSON.parse(localStorage.getItem(SAVE_STORE.key));r.saved=sv.hero.rankId==='knight'&&sv.hero.rank===1;
    SAVE.hero.rankId=null;reset();const base=P.maxHp;SAVE.hero.rankId='knight';reset();r.kept=P.maxHp-base;
    r.label=rankLabel();
    // שריון לפי דרגה (rankArmor3d ב-render3d.js): בתלת-ממד, החלקים של הדרגה מוסתרים לפני ונדלקים אחרי. בדו-ממד אין מה לבדוק
    if(R3D.on&&R3D.ready){
      const vis=all=>{syncPlayer(0);const v=new Set();R3D.player.root.traverse(o=>{const p=o.isMesh&&armorPart(o,ARMOR3D);if(p&&(all||o.visible))v.add(p)});return v};
      const look=RANKS.list.knight.look,has=vis(true),want=look.show.filter(p=>has.has(p));
      // משבצת ריקה = בלי החלקים, גם עם דרגה (ניר, 4.11.2026). עם שריון לבוש, הדרגה זוהרת על החלקים שלה
      const g0=JSON.stringify(SAVE.gear),wear=on=>{SAVE.gear.head=on?['warriorHead0']:[];SAVE.gear.body=on?['warriorBody0']:[];R3D._hl=null};
      const em=()=>{let s=0;R3D.player.root.traverse(o=>{if(o.isMesh&&o.visible&&armorPart(o,look.show)){const c=o.material.emissive;s+=c.r+c.g+c.b}});return s};
      wear(false);SAVE.hero.rankId='knight';const bare=vis();
      wear(true);SAVE.hero.rankId=null;const before=vis(),e0=em();SAVE.hero.rankId='knight';const after=vis(),glow=em()>e0+0.01;
      SAVE.gear=JSON.parse(g0);R3D._hl=null;
      r.armor={model:R3D.player.L.model,want:want.join('+')||'-',before:'בלי שריון '+([...bare].join('+')||'-'),after:'עם שריון '+([...after].join('+')||'-'),glow,
        ok:want.length>0&&!want.some(p=>bare.has(p))&&want.every(p=>before.has(p)&&after.has(p))&&glow};
    }
    questLogOpen(false);localStorage.removeItem(SAVE_STORE.key);saveLoad();reset();S.mode=mode;S.q=null;FX=[];
    $('qTrack').hidden=true;$('qTrack').textContent='';document.getElementById('banner').textContent='';
    return r});
  check(rk.locked&&rk.lv===rk.every&&rk.open&&rk.call&&rk.style,'דרגות: '+(rk.locked?'נעול לפני רמה '+rk.every:'פתוח מוקדם מדי')+', '+(rk.open?'ברמה '+rk.lv+' נפתח קווסט אצל הכוהנת':'לא נפתח ברמה '+rk.lv)+(rk.call?', הכוהנת קוראת לך':', בלי הודעה שהכוהנת קוראת')+
    ' · לפי סגנון: '+rk.picks);
  check(rk.accepted&&rk.card&&rk.claimed&&rk.rank==='knight'&&rk.saved&&rk.fx&&rk.fxLib&&rk.hp===rk.want&&rk.kept===rk.want,'קווסט דרגה: '+(rk.accepted?'התקבל':'לא התקבל')+(rk.card?', הכרטיס מראה "אביר"':', הכרטיס לא מראה את הדרגה')+
    (rk.claimed?', הושלם ונלקח':', הפרס לא נלקח')+', דרגה: '+(rk.label||'-')+(rk.saved?', נשמרה':', לא נשמרה')+(rk.fx?', טקס'+(rk.fxLib?' עם עמוד אור ומדליה':' בלי עמוד ומדליה!'):', בלי טקס')+
    ', חיים +'+rk.hp+' מיד ו-+'+rk.kept+' בכל ריצה (צפוי +'+rk.want+')');
  if(rk.armor)check(rk.armor.ok,'שריון לפי דרגה ('+rk.armor.model+'): לפני הדרגה '+rk.armor.before+', אחרי '+rk.armor.after+' (צפוי שיופיעו '+rk.armor.want+')'+(rk.armor.glow?', זוהר בצבע הדרגה':', בלי זוהר'));
  else results.push('· שריון לפי דרגה: דו-ממד, אין מה לבדוק');
  if(CFG.skin)await page.evaluate(n=>{LOOK.player=n},CFG.skin);
  let startLeak=null;
  // הבדיקות שלמעלה רצו בעברית, ויכלו להשאיר באנר בעברית (קווסט שהושלם). בלי זה מסך בחירת הדמות מציג אותו באנגלית
  await page.evaluate(()=>{document.getElementById('banner').textContent=''});
  {startLeak=await page.evaluate(()=>{const s=document.getElementById('ovStart').innerText;return /[֐-׿]/.test(s)||document.documentElement.dir!=='ltr'?s.slice(0,80):null});
    await shot('start-en');
    // English only (Nir, 7.11.2026): no language toggle on the start screen, LANG is en, and an old save that stored 'he' opens in English
    const enOnly=await page.evaluate(()=>({toggle:document.querySelectorAll('#ovStart [data-lang],[data-lang="he"],[data-ta="langGroup"]').length,lang:LANG,dir:document.documentElement.dir,stored:localStorage.getItem('zm-lang')}));
    // the page was loaded with zm-lang='he' (an old save, see addInitScript above), so stored==='en' means it migrated
    check(!enOnly.toggle&&enOnly.lang==='en'&&enOnly.dir==='ltr'&&enOnly.stored==='en',
      'English only: '+(enOnly.toggle?enOnly.toggle+' language buttons left on screen':'no language toggle')+', LANG '+enOnly.lang+', dir '+enOnly.dir+
      ' · old save with he: stored now '+enOnly.stored);
  }
  const rgHp=await page.evaluate(()=>GEAR.items.boneCharm.stats.hp);   // כמה חיים הקמע מוסיף באמצע ריצה
  // סטים (sets.js): חלק אחד לא נותן כלום, שניים נותנים את מדרגה 2, ארבעה את שתי המדרגות. וכל פריט בסט מקבל שם ומתכון
  // "תביא לי" (ניר 1.11: "הנפח רוצה 10 עצמות ויש עליי מאות"): מה שכבר בתרמיל נספר, ובקבלת הפרס נמסר לנותן. על עותק, בלי לשנות את השמירה
  const qHandT=await page.evaluate(()=>{const keep=JSON.stringify(SAVE),q=QBY.bones;if(!q)return{skip:1};
    try{const Q=QS();delete Q.done.bones;delete Q.active.bones;SAVE.bag.bone=200;qStart(q);const ready=qReady(q);
      questEvent('gather','bone',1);const ok=questClaim('bones',true);return{ready,ok,left:SAVE.bag.bone}}
    finally{const o=JSON.parse(keep);for(const k in SAVE)delete SAVE[k];Object.assign(SAVE,o)}});
  // אפקטים בממשק (fxui.js, אוראל 7.11): קווסט, קנייה, דרגה, פתיחת חלון ומעבר מקום מפעילים אפקט, ואף אפקט לא חוסם נגיעה
  const fxuiT=await page.evaluate(async()=>{if(typeof FXUI==='undefined')return{miss:1};
    const tick=()=>new Promise(f=>queueMicrotask(f)),n=k=>FXUI.log[k]||0,b0={t:n('ui_toast'),b:n('ui_buy'),a:n('ui_ach'),w:n('win'),tr:n('trans')},r={};
    const keep=[...document.querySelectorAll('.ov,'+WINS.map(w=>'#'+w.id).join(','))].map(e=>[e,e.hidden]);for(const [e] of keep)e.hidden=true;await tick();   // בלי חלון פתוח, ובסוף חוזרים למצב שהיה
    r.wrapped=['questClaim','shopBuy','rankUp','gearCraft','dailyClaim'].filter(f=>!(window[f]&&window[f].fxui));
    FXUI.hooks.questClaim(true,['bones',false]);FXUI.lastTap={x:innerWidth/2,y:innerHeight*0.7,t:performance.now()};FXUI.hooks.shopBuy(true);FXUI.hooks.rankUp('x');   // קנייה: בנגיעה, כמו במשחק
    const d=$('ovDaily'),was=d.hidden;d.hidden=true;await tick();d.hidden=false;await tick();
    d.hidden=was;
    const pl=FXUI.place;FXUI.place='fxtest';document.body.classList.toggle('fxtest');await tick();document.body.classList.toggle('fxtest');
    r.wipe=[...document.querySelectorAll('.fxd')].filter(e=>FXUI.never.some(id=>e.style.backgroundImage.includes(id+'.webp'))).length+(fxDom('ui_trans',100,100)?1:0);   // מעבר שממלא מסך לא מופיע כריבוע
    // חלון פתוח: אפקט של הודעה לא יושב על הכותרת או הטקסט שלו
    questLogOpen(true);const qn=document.querySelectorAll('.fxlayer .fxd').length;
    FXUI.hooks.questClaim(true,['bones',false]);FXUI.hooks.rankUp('x');
    const hd=$('qLog').getBoundingClientRect(),ov=(a,b)=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
    r.overWin=[...document.querySelectorAll('.fxlayer .fxd')].slice(qn).filter(e=>ov(e.getBoundingClientRect(),hd)).length;questLogOpen(false);
    // כרטיס עם טקסט שאינו חלון (עלית רמה בעולם, lpCard): אפקט חופשי לא נוחת עליו, ומה שכבר רץ עליו נעצר
    {let c=$('lpCard'),mk=!c;if(mk){c=document.createElement('div');c.id='lpCard';c.className='lpcard';c.innerHTML='<h3>Level 2!</h3><ul><li>+1 hero points</li></ul>';document.body.appendChild(c)}
     const wasOn=c.classList.contains('on');c.classList.add('on');const q=c.getBoundingClientRect(),cx=q.left+q.width/2,cy=q.top+q.height/2;
     r.card=fxDom('ui_coin',cx,cy,{size:120})?1:0;c.classList.remove('on');const pre=fxDom('ui_coin',cx,cy,{size:120});c.classList.add('on');
     r.cardOver=fxuiOverWin().length;if(pre)fxuiTick();r.cardRun=pre&&pre.el?1:0;c.classList.toggle('on',wasOn);if(mk)c.remove()}
    r.toast=n('ui_toast')>b0.t;r.buy=n('ui_buy')>b0.b;r.ach=n('ui_ach')>b0.a;r.win=n('win')>b0.w;r.trans=n('trans')>b0.tr;r.place=pl;
    for(const [e,h] of keep)e.hidden=h;
    const els=[...document.querySelectorAll('.fxd,.fxlayer,#fxVeil')];r.n=els.length;
    r.block=els.filter(e=>getComputedStyle(e).pointerEvents!=='none').length;
    const f=document.querySelector('#fxLayer .fxd');if(f){const q=f.getBoundingClientRect(),h=document.elementFromPoint(q.left+q.width/2,q.top+q.height/2);r.hit=!!(h&&h.closest('.fxlayer,#fxVeil'))}
    return r});
  check(!fxuiT.miss&&!fxuiT.wrapped.length&&fxuiT.toast&&fxuiT.buy&&fxuiT.ach&&fxuiT.win&&fxuiT.trans&&!fxuiT.wipe&&!fxuiT.overWin&&!fxuiT.card&&!fxuiT.cardRun&&!fxuiT.block&&!fxuiT.hit,
    'אפקטים בממשק: '+(fxuiT.miss?'fxui.js לא נטען':'קווסט '+(fxuiT.toast?'✓':'✗')+', קנייה '+(fxuiT.buy?'✓':'✗')+', דרגה '+(fxuiT.ach?'✓':'✗')+', אפקט בפתיחת חלון '+(fxuiT.win?'✓':'✗')+', מעבר מקום '+(fxuiT.trans?'✓':'✗')+(fxuiT.wipe?' (ריבוע אטום של ui_trans!)':' בלי ריבוע אטום')+(fxuiT.overWin?', '+fxuiT.overWin+' אפקטים על חלון פתוח!':', לא על חלון פתוח')+(fxuiT.card||fxuiT.cardRun?', אפקט על כרטיס עלית רמה!':', לא על כרטיס עלית רמה')+
    (fxuiT.wrapped.length?', לא מחובר: '+fxuiT.wrapped.join(','):'')+(fxuiT.block||fxuiT.hit?', חוסם נגיעה!':', לא חוסם נגיעה ('+fxuiT.n+' שכבות)')));
  const setT=await page.evaluate(()=>{const r={};for(const s in SETS){const it=setItems(s),b=SETS[s].bonus;
    const one=setStats(it.slice(0,1)),two=setStats(it.slice(0,2)),four=gearStats(it);
    r[s]={n:it.length,one:Object.keys(one).length===0,two:JSON.stringify(two)===JSON.stringify(b[2]),
      four:Object.keys(b[4]).every(k=>four[k]>=(b[4][k]+(b[2][k]||0))),named:it.every(k=>!/^it\./.test(T('it.'+k))&&GEAR.recipes[k])}}return r});
  // אופי לחפצים (ניר, 3.11.2026): לכל חפץ של ניר (לא המסתובבים, של אוראל) שם ומשפט אופי בעברית ובאנגלית, והמסגרת מקבלת class לפי השכבה (css/rarity.css)
  const chr=await page.evaluate(()=>{const miss=[],cls=[],ids=Object.keys(GEAR.items).filter(id=>GEAR.items[id].slot!=='orbit');
    const ok=e=>e&&typeof e.en==='string'&&e.en.trim()&&!/[\u0590-\u05FF]/.test(e.en);   // English only (7.11): he is optional
    for(const id of ids){if(!ok(TEXT['it.'+id]))miss.push('it.'+id);if(!ok(TEXT['itf.'+id]))miss.push('itf.'+id);
      const t=GEAR.tiers[GEAR.items[id].tier].id;if(!gTile(id,'','').includes('rar-'+t)||!gFlavHtml(id).includes('gflav'))cls.push(id)}
    const css=[...document.styleSheets].some(x=>/rarity\.css/.test(x.href||''));
    return{n:ids.length,miss,cls,css,tiers:GEAR.tiers.map(t=>t.id).join('/')}});
  check(chr.n>=60&&!chr.miss.length&&!chr.cls.length&&chr.css,'אופי לחפצים: '+chr.n+' חפצים עם שם ומשפט אופי באנגלית, ומסגרת לפי השכבה ('+chr.tiers+')'+
    (chr.miss.length?' · חסר: '+chr.miss.slice(0,8).join(', '):'')+(chr.cls.length?' · בלי class של שכבה: '+chr.cls.slice(0,8).join(', '):'')+(chr.css?'':' · css/rarity.css לא נטען'));
  // שמות מקומות לקווסטים צדדיים (ביקורת 6.11, פריט 8): לכל מקום ב-SIDEQ.places (גם ציוני הדרך של המפות הגדולות) יש שם ב-lang.js
  const sqNames=await page.evaluate(()=>{const miss=[];let n=0;for(const reg in SIDEQ.places)for(const id in SIDEQ.places[reg]){n++;const k='sq.pl.'+reg+'.'+id,e=TEXT[k];if(!e||!e.en)miss.push(reg+'.'+id)}return{n,miss}});
  check(sqNames.n>0&&!sqNames.miss.length,'שמות מקומות לקווסטים: '+sqNames.n+' מקומות'+(sqNames.miss.length?' · בלי שם ('+sqNames.miss.length+'): '+sqNames.miss.slice(0,10).join(', '):', לכולם שם באנגלית'));
  // איזון לפי אזור (ביקורת 6.11, פריט 10): בכל אזור, האויב הממוצע ליד השער (start) לא חזק מזה שבאזור הבא (near). חיים אחרי הרצפה (wFloor), ונזק
  const zoneBal=await page.evaluate(()=>{const out=[],bad=[];
    for(const [reg,R] of [['meadow',WORLD],...Object.entries(WORLD.regions)]){if(!R||!R.zones||!R.foes||!R.home)continue;if(typeof wFloors==='function')wFloors(R.zones);
      const acc={};for(const G of R.foes){const E=ETYPES[G.type];if(!E||G.creature)continue;const Z=R.zones.find(z=>Math.hypot(G.x-R.home.x,G.y-R.home.y)<z.to);if(!Z)continue;
        const fl=typeof wFloor==='function'?wFloor(Z):(Z.min??WORLD.foeMin*Z.hp),a=acc[Z.id]||(acc[Z.id]={hp:0,dmg:0,n:0});
        a.hp+=Math.max(E.hp*Z.hp*WORLD.foeHp,fl)*G.n;a.dmg+=E.dmg*Z.dmg*G.n;a.n+=G.n}
      const st=acc.start,nr=acc.near;if(!st||!nr)continue;const f=x=>Math.round(x);
      out.push(reg+' '+f(st.hp/st.n)+'/'+f(nr.hp/nr.n));if(st.hp/st.n>nr.hp/nr.n+0.5||st.dmg/st.n>nr.dmg/nr.n+0.05)bad.push(reg)}
    return{out,bad}});
  check(zoneBal.out.length&&!zoneBal.bad.length,'איזון לפי אזור: אויב ממוצע ליד השער לא חזק מהאזור הבא (חיים start/near): '+zoneBal.out.join(', ')+(zoneBal.bad.length?' · הפוך ב: '+zoneBal.bad.join(', '):''));
  // כמה קשת העץ אמורה להוסיף, לפי GEAR. בנפחייה היא עולה ל-+1 (AGING.scale)
  const gx=await page.evaluate(()=>Math.round((1+GEAR.items.oakBow.stats.gdmg*(1+AGING.scale)/100)*100)/100);
  await page.click('#startBtn');
  // חולשה: אותה מכה של 10 על אויב לפי החומר שלו, בלי מכה קריטית. מגן (עצם ושריון) מהחולשה שלו, ואבן ממים, מברק ומאש. אחר כך מנקים
  const wk=await page.evaluate(()=>{const c=HITFX.crit;HITFX.crit=0;const tr=P.track,hits=S.hits;P.track=newTrack();S.hits={};
    const hit=(tags,t)=>{const e=addEnemy('shield',P.x+5000,P.y);e.mult=multOf(tags);e.hp=e.max=1e9;damage(e,10,'sword',0,t,true);e.dead=true;return Math.round(1e9-e.hp)};
    const sh=ETYPES.shield.tags,r={weak:weakOf(multOf(sh)),plain:hit([],'physical')};r.weakDmg=hit(sh,r.weak);
    r.stone={water:hit(['stone'],'water'),lightning:hit(['stone'],'lightning'),fire:hit(['stone'],'fire')};
    enemies=enemies.filter(e=>!e.dead);HITFX.crit=c;P.track=tr;S.hits=hits;return r});
  // קומבו (skills.js): מכות של 10 על אויבים רחוקים, בלי מכה קריטית ובלי חולשות, בסדר של כל קומבו. אחר כך מנקים
  const cb=await page.evaluate(()=>{const c=HITFX.crit;HITFX.crit=0;const tr=P.track,hits=S.hits;P.track=newTrack();S.hits={};
    const mk=(dx,boss)=>{const e=addEnemy('grunt',P.x+5000+dx,P.y);e.mult={};e.hp=e.max=1e9;if(boss)e.isBoss=true;return e},hit=(e,t)=>damage(e,10,'skill',0,t);
    const a=mk(0),b=mk(200);hit(a,'water');hit(b,'water');const b0=b.hp;hit(a,'lightning');   // 200: רחוק מהקפיצה הרגילה של ברק, קרוב לחשמול
    const f=mk(600);hit(f,'water');hit(f,'ice');const frozen=f.frozen>0&&slowK(f)===0;hit(f,'earth');
    const m=mk(900),p=mk(1200);hit(m,'fire');const m0=m.hp;hit(m,'ice');hit(p,'ice');
    const B=mk(1500,true),three=()=>{hit(B,'water');hit(B,'ice');hit(B,'earth')};three();const bs1=B.stun>0;B.stun=0;three();
    const r={shock:b.hp<b0,frozen,stun:f.stun>=SKILLS.combo.stun.t-0.01&&!(f.frozen>0),melt:Math.round(10*(m0-m.hp)/(1e9-p.hp))/10,bossStun:bs1&&!(B.stun>0),
      plainIce:!(p.frozen>0)};
    for(const e of [a,b,f,m,p,B])e.dead=true;enemies=enemies.filter(e=>!e.dead);HITFX.crit=c;P.track=tr;S.hits=hits;S.sk.combos={};return r});
  // מראה הסקילים בזירה (skill-fx.js): כל חמשת הסקילים ושני קומבו מצוירים בלי שגיאה ובתקרת החלקיקים. "פחות אפקטים" = בלי חלקיקים, ובעולם הציור הישן
  const sfx=await page.evaluate(()=>{const r={},bak={vil:S.vil,wd:S.wd,room:S.room,mode:S.mode,ids:S.sk.ids,cd:S.sk.cd,fx:S.sk.fx,fl:SAVE.fxLess,last:S.sk.last,combos:{...S.sk.combos},sh:S.shake,used:S.sk.used,tr:P.track,hits:S.hits};P.track=newTrack();S.hits={};
    try{S.vil=null;S.wd=null;S.room=null;S.mode='play';SAVE.fxLess=false;S.sk.fx=[];S.sk.last={};
      const ens=[];for(let i=0;i<6;i++){const e=addEnemy('grunt',P.x+60+i*30,P.y+20);e.hp=e.max=1e9;e.speed=0;e.mult={};ens.push(e)}
      ens[0].wet=3;ens[1].frozen=2;ens[2].stun=2;
      const ids=['quake','splash','frost','flame','zap'];S.sk.ids=ids;S.sk.cd=ids.map(()=>0);const an0=SKANIMS.stat.fx,l0=FXLIB.list.length;r.cast=ids.filter(id=>skillUse(id)).length;
      r.anim=[SKANIMS.stat.fx-an0,ids.filter(id=>SKANIMS.stat.cast[id]).length,FXLIB.list.length-l0<=FXLIB.max,SKANIM.perCast+SKANIM.hit.perFrame<=12];   // אנימציות מהגיליונות (skill-anim.js): כמה אפקטים, לכמה סקילים, בתוך התקרה
      comboShow(ens[0],'shock');comboShow(ens[1],'melt');r.combo=S.sk.fx.some(f=>f.combo);
      const d0=SKFXS.drawn,o0=SKFXS.old;SKFXS.peak=0;ctx.save();for(let i=0;i<20;i++){skillsUpdate(1/60);drawSkills(0,0)}r.drawn=SKFXS.drawn-d0===20&&SKFXS.old===o0;r.peak=SKFXS.peak;r.max=SKFX.maxParts;
      SAVE.fxLess=true;drawSkills(0,0);r.less=SKFXS.parts===0;SAVE.fxLess=false;
      S.wd=bak.wd||{};const o1=SKFXS.old;drawSkills(0,0);r.world=SKFXS.old===o1+1;S.wd=null;ctx.restore();
      for(const e of ens)e.dead=true;enemies=enemies.filter(e=>!e.dead)}catch(err){r.err=String(err&&err.stack||err)}
    S.vil=bak.vil;S.wd=bak.wd;S.room=bak.room;S.mode=bak.mode;S.sk.ids=bak.ids;S.sk.cd=bak.cd;S.sk.fx=bak.fx;SAVE.fxLess=bak.fl;S.sk.last=bak.last;S.sk.combos=bak.combos;S.shake=bak.sh;S.sk.used=bak.used;P.track=bak.tr;S.hits=bak.hits;return r});
  // סקילים נוספים (skills-more.js): שביט נופל אחרי השהיה ופוגע, חנית קרח עוברת דרך כולם בקו, פריחה מרפאת ומרטיבה. בזירה בלבד: בעולם הכפתור לא פועל
  const skm=await page.evaluate(()=>{const r={},bak={vil:S.vil,wd:S.wd,room:S.room,mode:S.mode,ids:S.sk.ids,cd:S.sk.cd,hp:P.hp,skm:S.skm};
    try{S.vil=null;S.wd=null;S.room=null;S.mode='play';S.skm={fx:[],pend:[],pools:[],cast:0,hits:0};
      const ens=[];for(let i=0;i<4;i++){const e=addEnemy('grunt',P.x+120+i*40,P.y);e.hp=e.max=1e9;e.speed=0;e.mult={};ens.push(e)}
      const far=addEnemy('grunt',P.x-300,P.y+200);far.hp=far.max=1e9;far.speed=0;far.mult={};
      const ids=['comet','lance','bloom'];S.sk.ids=ids;S.sk.cd=ids.map(()=>0);
      const h0=ens.map(e=>e.hp);r.cast=ids.filter(id=>skillUse(id)).length;r.pend=S.skm.pend.length===1;
      P.hp=P.maxHp*0.5;const hp0=P.hp;r.cd=S.sk.cd.every(c=>c>0);
      for(let i=0;i<90;i++){skillsUpdate(1/60);drawSkills(0,0)}
      r.comet=S.skm.hits>0;r.lance=ens.every((e,i)=>e.hp<h0[i]);r.farSafe=far.hp===far.max;r.heal=P.hp>hp0;r.wet=ens.some(e=>e.wet>0);
      S.sk.ids=ids;S.sk.cd=ids.map(()=>0);S.mode='pause';r.gate=!skillUse('comet');S.mode='play';S.wd={};S.sk.cd=ids.map(()=>0);r.world=!skillUse('lance');S.wd=null;
      for(const e of ens.concat(far))e.dead=true;enemies=enemies.filter(e=>!e.dead)}catch(err){r.err=String(err&&err.stack||err)}
    S.vil=bak.vil;S.wd=bak.wd;S.room=bak.room;S.mode=bak.mode;S.sk.ids=bak.ids;S.sk.cd=bak.cd;P.hp=bak.hp;S.skm=bak.skm;return r});
  check(!skm.err&&skm.cast===3&&skm.pend&&skm.comet&&skm.lance&&skm.farSafe&&skm.heal&&skm.wet&&skm.cd&&skm.gate&&skm.world,'סקילים נוספים: '+(skm.err||[skm.cast+'/3 הוטלו',skm.comet?'שביט פגע':'שביט לא פגע',skm.lance?'חנית עברה דרך כולם':'חנית פספסה',skm.farSafe?'מי שרחוק לא נפגע':'פגיעה ברחוק',skm.heal?'פריחה מרפאת':'פריחה לא מרפאת',skm.wet?'מרטיבה':'לא מרטיבה',skm.cd?'נטענים':'בלי טעינה',skm.gate&&skm.world?'לא בהפסקה ולא בעולם':'פועל במקום שלא צריך'].join(', ')));
  // חפצים מסתובבים (orbit.js): כל החמישה לבושים, ואויב, יריית אויב ומכה מגיעים אליהם. רק בזירה, אז הכפר מושהה לרגע. אחר כך הכל חוזר
  const ob=await page.evaluate(()=>{const bak={orb:SAVE.gear.orbit.slice(),lv:SAVE.hero.level,vil:S.vil,wd:S.wd,room:S.room,mode:S.mode,o:S.orb,hp:P.hp,inv:P.inv,t:S.t},c=HITFX.crit;
    HITFX.crit=0;S.vil=S.wd=S.room=null;S.mode='play';SAVE.hero.level=99;SAVE.gear.orbit=['emberOrb','frostOrb','stoneOrb','leafOrb','cloverOrb'];
    orbitReset();orbitUpdate(0);const r={types:S.orb.types.join(','),crit:orbitCrit(),luck:orbitLuck()};
    const mk=i=>{const p=S.orb.pos[i],e=addEnemy('grunt',p.x,p.y);e.mult={};e.hp=e.max=1e9;return e};
    const e1=mk(0),e2=mk(1);orbitUpdate(0);r.fire=e1.hp<e1.max&&!!e1.burn;r.slow=e2.slow>0;   // כדור האש והכפור בדיוק על אויב
    const s=S.orb.pos[2];eb.push({x:s.x,y:s.y,vx:0,vy:0,r:6,dmg:5,life:2});orbitUpdate(0);r.block=S.orb.blocked>0;
    P.inv=0;const h0=P.hp;hurt(10);r.shield=P.hp===h0&&S.orb.shields===1;P.inv=0;hurt(10);r.shieldOnce=P.hp<h0;
    P.hp=P.maxHp/2;S.t+=ORBIT.types.support.heal.every+0.1;orbitUpdate(0);r.heal=P.hp>P.maxHp/2;
    try{const w0=WISPS.stat.draws;drawOrbits();r.draw=WISPS.stat.draws===w0?true:'האורות (wisps.js) מצוירים בזירה'}catch(err){r.draw=String(err)}   // בזירה הציור הישן, לא האורות
    e1.dead=e2.dead=true;enemies=enemies.filter(e=>!e.dead);eb=eb.filter(b=>b.life>0);
    SAVE.gear.orbit=bak.orb;SAVE.hero.level=bak.lv;S.vil=bak.vil;S.wd=bak.wd;S.room=bak.room;S.mode=bak.mode;S.orb=bak.o;P.hp=bak.hp;P.inv=bak.inv;S.t=bak.t;HITFX.crit=c;return r});
  // חפץ משולב (orbit.js, ORBIT.combo): אדים = אש + כפור במשבצת אחת. שני חלקים צמודים, כל אחד בחלק מהכוח, והמשולב נופל מבוס
  const ocb=await page.evaluate(()=>{const bak={orb:SAVE.gear.orbit.slice(),lv:SAVE.hero.level,vil:S.vil,wd:S.wd,room:S.room,mode:S.mode,o:S.orb,t:S.t,m:Math.random},r={};
    S.vil=S.wd=S.room=null;S.mode='play';SAVE.hero.level=99;SAVE.gear.orbit=['steamOrb'];orbitReset();orbitUpdate(0);
    r.parts=S.orb.types.join(',');r.k=S.orb.ks.join(',');r.close=Math.hypot(S.orb.pos[0].x-S.orb.pos[1].x,S.orb.pos[0].y-S.orb.pos[1].y)<60;
    const p=S.orb.pos[0],e=addEnemy('grunt',p.x,p.y);e.mult={};e.hp=e.max=1e9;orbitUpdate(0);r.hit=e.hp<e.max;e.dead=true;enemies=enemies.filter(x=>!x.dead);
    r.facts=orbitFacts('steamOrb').map(f=>f.k+':'+f.v).join(',');r.txt=gStatsHtml('trinityOrb').length>20&&gCompare('steamOrb',null).length>20;
    Math.random=()=>0;r.drop=!!GEAR.items[orbitComboRoll()];Math.random=bak.m;
    let pool=0;for(let i=0;i<300;i++)if(gItem(gRoll()).types)pool++;r.pool=pool;
    SAVE.gear.orbit=bak.orb;SAVE.hero.level=bak.lv;S.vil=bak.vil;S.wd=bak.wd;S.room=bak.room;S.mode=bak.mode;S.orb=bak.o;S.t=bak.t;return r});
  // ברק אלוהי (divine.js): אחרי שני אויבי-על מוכן, הכפתור מפעיל 5 שניות: כל החמישה מסתובבים, ברק פוגע באויב קרוב, ובסוף הכל חוזר
  const dvr=await page.evaluate(()=>{const bak={vil:S.vil,wd:S.wd,room:S.room,mode:S.mode,dv:S.dv,o:S.orb,orb:SAVE.gear.orbit.slice(),t:S.t},r={};
    S.vil=S.wd=S.room=null;S.mode='play';SAVE.gear.orbit=[];divineReset();orbitReset();
    try{divineElite();r.early=S.dv.ready;divineElite();r.ready=S.dv.ready;divineHud();r.btn=!$('divine').hidden;
      const e=addEnemy('grunt',P.x+100,P.y);e.mult={};e.hp=e.max=1e9;
      r.used=divineUse();divineUpdate(0);orbitUpdate(0);r.five=S.orb.types.length===5;r.hit=e.hp<e.max&&S.dv.strikes>0;
      try{drawDivine();divineHud();r.draw=true}catch(err){r.draw=String(err)}
      divineUpdate(DIVINE.dur+1);r.ended=!divineOn();orbitUpdate(0);r.back=S.orb.types.length===0;divineElite();r.once=!S.dv.ready;
      e.dead=true;enemies=enemies.filter(x=>!x.dead)}catch(err){r.err=String(err)}
    S.vil=bak.vil;S.wd=bak.wd;S.room=bak.room;S.mode=bak.mode;S.dv=bak.dv;S.orb=bak.o;SAVE.gear.orbit=bak.orb;S.t=bak.t;return r});
  // אולטימייט (ult.js): מתמלא מהריגות, לא עובד לפני שהוא מלא, ומלא פוגע בכל אויב על המסך ומתאפס
  const ult=await page.evaluate(()=>{const bak={vil:S.vil,wd:S.wd,room:S.room,mode:S.mode,u:S.ult},r={};S.vil=S.wd=S.room=null;S.mode='play';S.ult=null;
    try{for(let i=0;i<ULT.need/2;i++)ultKill({});r.early=ultUse()===false;for(let i=0;i<ULT.need;i++)ultKill({});
      const es=[0,1,2].map(i=>{const e=addEnemy('grunt',P.x+60+i*40,P.y);e.hp=e.max=1e9;return e});r.use=ultUse()===true&&es.every(e=>e.hp<e.max)&&S.ult.c===0;
      ultHud();r.btn=!document.getElementById('ult').hidden;for(const e of es)e.dead=true;enemies=enemies.filter(e=>!e.dead)}catch(err){r.err=String(err)}
    S.vil=bak.vil;S.wd=bak.wd;S.room=bak.room;S.mode=bak.mode;S.ult=bak.u;S.slow=0;return r});
  // כישוף מיוחד (spell.js): קפיצה מזיזה ומגינה, ואז מחכים. ריפוי מחזיר חיים. מכה פוגעת באויב-העל. הבחירה נזכרת
  const spl=await page.evaluate(()=>{const bak={vil:S.vil,wd:S.wd,room:S.room,mode:S.mode,spl:S.spl,hp:P.hp,x:P.x,y:P.y},r={};let mem=null;try{mem=localStorage.getItem(SPELL.key)}catch(e){}
    S.vil=S.wd=S.room=null;S.mode='play';S.spl=null;
    try{spellHud();const id0=spellState().id,b=document.getElementById('spell');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));spellHud();r.next=S.spl.id!==id0&&!S.spl.used&&b.classList.contains('pick')&&!!b.dataset.name}catch(err){r.err=String(err)}
    try{spellPick('dash');const x0=P.x,y0=P.y;r.dash=spellUse()===true&&Math.hypot(P.x-x0,P.y-y0)>100&&P.inv>0&&spellUse()===false;
      spellPick('heal');S.spl.until=0;P.hp=P.maxHp*0.3;const h0=P.hp;r.heal=spellUse()===true&&P.hp>h0;
      spellPick('smite');S.spl.until=0;const e=addEnemy('grunt',P.x+100,P.y);e.hp=e.max=1e6;e.elite=true;r.smite=spellUse()===true&&e.hp<e.max;e.dead=true;enemies=enemies.filter(x=>!x.dead);
      r.mem=spellId()==='smite';spellHud();r.btn=!document.getElementById('spell').hidden}catch(err){r.err=String(err)}
    try{mem?localStorage.setItem(SPELL.key,mem):localStorage.removeItem(SPELL.key)}catch(e){}
    S.vil=bak.vil;S.wd=bak.wd;S.room=bak.room;S.mode=bak.mode;S.spl=bak.spl;P.hp=bak.hp;P.x=bak.x;P.y=bak.y;return r});
  // חנות הריצה (shop.js): הריגות נותנות זהב, קנייה מורידה זהב ומשפרת, ובלי מספיק זהב לא קונים. החלון עוצר את המשחק ונסגר ב-Esc
  const shp=await page.evaluate(()=>{const bak={vil:S.vil,wd:S.wd,room:S.room,mode:S.mode,shop:S.shop,dmg:P.sw.dmg,gdmg:P.gn.dmg},r={};S.vil=S.wd=S.room=null;S.mode='play';S.shop=null;
    try{for(let i=0;i<30;i++)shopKill({});r.gold=S.shop.gold===30;const d0=P.sw.dmg;r.buy=shopBuy('blade')===true&&P.sw.dmg>d0&&S.shop.gold===10;r.poor=shopBuy('blade')===false;
      shopOpen();r.pause=S.mode==='shop'&&!document.getElementById('ovShop').hidden;uiCloseTop();r.close=S.mode==='play'&&document.getElementById('ovShop').hidden}catch(err){r.err=String(err)}
    S.vil=bak.vil;S.wd=bak.wd;S.room=bak.room;S.mode=bak.mode;S.shop=bak.shop;P.sw.dmg=bak.dmg;P.gn.dmg=bak.gdmg;return r});
  // רצף הריגות (streak.js): 10 הריגות ברצף מראות מילה, והפסקה ארוכה שוברת את הרצף
  const stk=await page.evaluate(()=>{const bak={vil:S.vil,wd:S.wd,room:S.room,mode:S.mode,st:S.st,t:S.t,kills:S.kills},r={};S.vil=S.wd=S.room=null;S.mode='play';S.st=null;if(typeof CQS!=='undefined'){CQS.cur=null;CQS.q.length=0}   // the center queue (centerq.js) empty, so the word shows now
    try{for(let i=0;i<10;i++)streakKill();r.show=!!S.st.show&&S.st.show.key==='st.0'&&T('st.0')!=='st.0';try{streakDraw();r.draw=true}catch(err){r.draw=String(err)}
      S.t+=STREAK.gap+1;streakKill();r.reset=S.st.n===1}catch(err){r.err=String(err)}
    S.vil=bak.vil;S.wd=bak.wd;S.room=bak.room;S.mode=bak.mode;S.st=bak.st;S.t=bak.t;return r});
  // זירה נקייה (arenaui.js): מכות רצופות באותו אויב מתמזגות למספר אחד, פס חיים רק למי שנפגע או לאויב-על, חץ לאויב-על מחוץ למסך, והפס העליון שקט בקרב
  const aui=await page.evaluate(()=>{const bak={vil:S.vil,wd:S.wd,room:S.room,mode:S.mode},r={};S.vil=S.wd=S.room=null;S.mode='play';
    try{const a=addEnemy('grunt',P.x+80,P.y),b=addEnemy('grunt',P.x-80,P.y),el=addEnemy('grunt',P.x+3000,P.y);a.hp=a.max=b.hp=b.max=el.hp=el.max=1e9;el.elite=true;
      const n0=floats.length;for(let i=0;i<4;i++)dmgFloat(a,10,C.chalk,15,false);r.merge=floats.filter(f=>f.e===a).length===1&&floats.find(f=>f.e===a).n===40;
      r.bars=hpBarOn(a)&&!hpBarOn(b)&&hpBarOn(el);try{ctx.save();arenaArrows(0,0);ctx.restore();r.arrow=true}catch(err){r.arrow=String(err)}
      arenaQuiet();r.quiet=document.documentElement.classList.contains('fight');
      for(const e of [a,b,el])e.dead=true;enemies=enemies.filter(e=>!e.dead)}catch(err){r.err=String(err)}
    S.vil=bak.vil;S.wd=bak.wd;S.room=bak.room;S.mode=bak.mode;arenaQuiet();return r});
  // פיוחו מצילה (rescue.js): מתחת ל-30% חיים בזירה, עם סיכוי, מופיעה עצם. הרמה מעלימה אויבים רגילים בקרבת מקום, בוס רק נפגע, ופעם אחת בריצה
  const rsr=await page.evaluate(()=>{const bak={vil:S.vil,wd:S.wd,room:S.room,mode:S.mode,rs:S.rs,hp:P.hp,rnd:Math.random,kills:S.kills},r={};
    S.vil=S.wd=S.room=null;S.mode='play';S.rs=null;
    try{const near=addEnemy('grunt',P.x+80,P.y),far=addEnemy('grunt',P.x+RESCUE.radius+200,P.y),bs=addEnemy('grunt',P.x-80,P.y);
      bs.isBoss=true;bs.hp=bs.max=1e9;far.hp=far.max=1e9;
      P.hp=P.maxHp;rescueUpdate(0.01);r.early=!!S.rs.item;
      Math.random=()=>0.9;P.hp=P.maxHp*0.2;rescueUpdate(0.01);r.missNo=!S.rs.item&&S.rs.rolled;   // יצא "לא": אין עצם, ולא מגרילים שוב
      Math.random=()=>0.1;rescueUpdate(0.01);r.once=!S.rs.item;
      S.rs=null;rescueUpdate(0.01);r.item=!!S.rs.item;
      try{rescueDraw();r.draw=true}catch(err){r.draw=String(err)}
      S.rs.item.x=P.x;S.rs.item.y=P.y;rescueUpdate(0.01);
      r.took=!S.rs.item&&S.rs.done;r.gone=near.dead===true;r.far=!far.dead;r.boss=!bs.dead&&bs.hp<bs.max;
      try{rescueDraw();r.draw2=true}catch(err){r.draw2=String(err)}
      enemies.forEach(e=>{if(e===far||e===bs)e.dead=true});enemies=enemies.filter(e=>!e.dead)}catch(err){r.err=String(err)}
    Math.random=bak.rnd;S.vil=bak.vil;S.wd=bak.wd;S.room=bak.room;S.mode=bak.mode;S.rs=bak.rs;P.hp=bak.hp;return r});
  // הפרעוש (parosh.js): החיה של אוראל. מתגנב לאויב שליד השחקן, חוטף, חוזר ומפיל שלל לידו, והציור רץ בלי שגיאה
  const prs=await page.evaluate(()=>{const bak={vil:S.vil,wd:S.wd,room:S.room,mode:S.mode,pet:S.pet,kind:SAVE.pet.kind},r={};
    S.vil=S.wd=S.room=null;S.mode='play';SAVE.pet.kind='parosh';S.pet=null;
    try{const p=petMake();p.x=P.x-40;p.y=P.y+20;const e=addEnemy('grunt',P.x+150,P.y);e.hp=e.max=1e9;p.digT=0;const n0=drops().length,seen={};
      for(let i=0;i<600&&!p.digs;i++){petUpdate(1/60);seen[p.st]=1}
      r.sneak=!!seen.sneak;r.flee=!!seen.flee;r.grab=p.grabs===1;r.give=p.digs===1&&drops().length>n0;
      p.bag=true;try{drawPet();r.draw=true}catch(err){r.draw=String(err)}
      r.name=T('pet.name.parosh')!=='pet.name.parosh'&&petTx('pet.up')==='pet.up.parosh';
      S.rs={rolled:true,done:false,ring:null,saved:0,item:{x:P.x-60,y:P.y,t:0}};try{rescueDraw();r.rescue=rescueLook().item==='pouch'&&T(petTx('rs.saved'))!==T('rs.saved')}catch(err){r.rescue=String(err)}S.rs=null;   // פיוחו מצילה, עם הפריט של הפרעוש
      e.dead=true;enemies=enemies.filter(x=>!x.dead)}catch(err){r.err=String(err)}
    SAVE.pet.kind=bak.kind;S.pet=bak.pet;S.vil=bak.vil;S.wd=bak.wd;S.room=bak.room;S.mode=bak.mode;return r});
  // הנודד עם החליל (flute.js): המראה האישי של אוראל. חליל ביד בתלת-ממד, וכל הציורים (ירייה, חץ, חמשה, טבעת, ברק) רצים בלי שגיאה. אחר כך חוזר
  // החלפה מהירה (combat.js): הכפתור לובש את הנשק הכי חזק בתרמיל מהצד השני, והקודם חוזר לתרמיל. אחר כך הכל חוזר כמו שהיה
  const qsw=await page.evaluate(()=>{const r={},bak={w:SAVE.gear.weapon,bag:JSON.stringify(SAVE.bag),mode:S.mode};
    try{const ws=Object.keys(GEAR.items).filter(id=>GEAR.items[id].slot==='weapon'),by=u=>ws.filter(id=>wUse(id)===u).sort((a,b)=>gScore(a)-gScore(b));
      const sw=by('sword'),bw=by('gun');const before=gearStats();SAVE.gear.weapon=sw[0];for(const id of [sw[sw.length-1],bw[0],bw[bw.length-1]])bagAdd(id);gearLive(before);S.mode='play';
      swapCheck();r.btn=!$('swap').hidden;swapWeapon();r.bow=SAVE.gear.weapon===bw[bw.length-1]&&P.weapon==='gun'&&bagHas(sw[0]);
      swapWeapon();r.sword=SAVE.gear.weapon===sw[sw.length-1]&&P.weapon==='sword'}catch(e){r.err=e.message}
    const b2=gearStats();SAVE.gear.weapon=bak.w;SAVE.bag=JSON.parse(bak.bag);gearLive(b2);S.mode=bak.mode;swapCheck();return r});
  // הנודד עם הניצוץ (spark.js): ערכת המראה של ניר. היריות, מכת החרב, הטבעת והברק מצוירים כלהבונים וגצים בלי שגיאה, והחליל לא נדלק אצלו
  const spk=await page.evaluate(()=>{const sk=SAVE.hero.skin,r={};SAVE.hero.skin='nir';
    try{const th=heroTheme();r.on=th===THEMES.spark;r.slow=themeK()===SPARK.slow;r.noFlute=!fluteOn();
      ctx.save();th.shot({x:P.x,y:P.y,vx:300,vy:0,shot:'bolt'},'#fff');th.shot({x:P.x,y:P.y,vx:0,vy:300},'#fff');
      th.swing({ang:0,arc:2,range:80},0.5,'#fff');th.ring({x:P.x,y:P.y,r:120,col:'#fff'},0.5);th.line({ax:P.x,ay:P.y,bx:P.x+200,by:P.y,col:'#fff'},0.5);ctx.restore();r.draw=true}
    catch(e){r.draw=e.message}
    SAVE.hero.skin=sk;r.off=heroTheme()!==THEMES.spark;return r});
  const fl=await page.evaluate(()=>{const sk=SAVE.hero.skin,r={};SAVE.hero.skin='orel';
    try{r.on=fluteOn();r.slow=fluteK()===FLUTE.slow;r.prop=!R3D.on||Object.values(heroLook().props).every(p=>p.prop==='flute');
      ctx.save();fluteShot({x:P.x,y:P.y,vx:300,vy:0,shot:'bolt'},'#fff');fluteShot({x:P.x,y:P.y,vx:0,vy:300},'#fff');
      fluteSwing({ang:0,arc:2,range:80},0.5,'#fff');fluteRing({x:P.x,y:P.y,r:120,col:'#fff'},0.5);fluteLine({ax:P.x,ay:P.y,bx:P.x+200,by:P.y,col:'#fff'},0.5);ctx.restore();r.draw=true}
    catch(e){r.draw=e.message}
    SAVE.hero.skin=sk;r.off=!fluteOn();return r});
  // המראה שלי בכל זמן (heroes.js, ניר 4.11.2026): כפתור בהגדרות מחליף את הדמות בתלת-ממד, נשמר, ונמצא גם בחלון הציוד
  // הדמות האישית נטענת לפי צורך (js/m3d.js): עד שהיא מוכנה רואים לרגע את הגיבור של המחלקה. כאן מחכים לה, ואז בודקים שהבחירה מחליפה
  if(g3.on){await page.evaluate(()=>{m3dGo(LOOK3D[HEROES.skins.nir.look].model)});
    for(let i=0;i<200&&!(await page.evaluate(()=>m3dReady(LOOK3D[HEROES.skins.nir.look].model)));i++){await page.waitForTimeout(20);await page.clock.runFor(50)}}
  // החיה של הסקין (heroSkinPet ב-heroes.js, אוראל 8.11: "לאן הלך הפרעוש"): סקין אוראל עם חיה ריקה או פיוחו מקבל את הפרעוש,
  // סקין אחר נשאר כמו שהוא, וחיה שנבחרה (לא ברירת המחדל) לא מתחלפת. בטעינה (parosh.js) ובענן (cloudTake) אותה פונקציה
  const hpp=await page.evaluate(()=>{const sk=SAVE.hero.skin,pk=SAVE.pet.kind,r={};
    try{const go=(skin,kind)=>{SAVE.hero.skin=skin;SAVE.pet.kind=kind;heroSkinPet();return SAVE.pet.kind};
      r.d=PET.default;r.nul=go('orel',null);r.def=go('orel',PET.default);r.nir=go('nir',PET.default);r.none=go(null,null);r.keep=go('orel','parosh');
      r.cloud=/heroSkinPet\(\)/.test(String(cloudTake))}catch(err){r.err=String(err)}
    SAVE.hero.skin=sk;SAVE.pet.kind=pk;return r});
  check(!hpp.err&&hpp.nul==='parosh'&&hpp.def==='parosh'&&hpp.nir===hpp.d&&hpp.none===null&&hpp.keep==='parosh'&&hpp.cloud,
    'הפרעוש של אוראל: '+(hpp.err||'סקין אוראל עם חיה ריקה: '+hpp.nul+', עם פיוחו: '+hpp.def+' · סקין ניר: '+hpp.nir+' · בלי סקין: '+hpp.none+' · בענן: '+(hpp.cloud?'✓':'✗')));
  // כלי פיתוח: ?level=30 (rankDevLevel ב-ranks.js) מעלה לרמה 30 עם 29 נקודות סטטים פנויות, בלי פרמטר כלום לא משתנה, פעם אחת בטעינה, ועד המקסימום
  const dlv=await page.evaluate(async()=>{const bak=JSON.stringify(SAVE),r={},lpu=window.lpLevelUp,rc=window.rankCall,cf=CLOUD.fake,cs=CLOUD.session,ch=CLOUD.hold,lsS=localStorage.getItem(CLOUD.lsKey);
    try{window.lpLevelUp=()=>{};window.rankCall=()=>false;CLOUD.session=null;   // בלי חגיגות וחלונות באמצע הבדיקה, ובלי ענן עד החלק שלו
      const fresh=()=>{SAVE.hero.xp=0;SAVE.hero.level=1;SAVE.hero.xpv=2;SAVE.bag={};rankDevLevel.done=false};
      fresh();const j0=JSON.stringify(SAVE);r.none=!rankDevLevel('')&&JSON.stringify(SAVE)===j0;
      fresh();r.set=rankDevLevel('?level=30')&&SAVE.hero.level===30&&SAVE.hero.xp===rankXpAt(30)&&stFree()===29-stSpent();
      const t=rankDevRes(30);r.coins=t.coins;r.res=Object.keys(t).length>5&&Object.keys(t).every(k=>RES.list[k]&&SAVE.bag[k]===t[k])&&t.coins>1000&&!t.horn;   // רק משאבים, בלי חלקי בוס ברמה 30
      r.once=!rankDevLevel('?level=40')&&SAVE.hero.level===30;
      const j1=JSON.stringify(SAVE.bag);rankDevLevel.done=false;r.stack=!rankDevLevel('?level=30')&&JSON.stringify(SAVE.bag)===j1;   // טעינה חוזרת: לא מוסיף עוד
      fresh();SAVE.bag.wood=99999;rankDevLevel('?level=30');r.keep=SAVE.bag.wood===99999;   // יש יותר מהיעד: לא מוריד
      fresh();rankDevLevel('?skin=orel&level=999');r.max=SAVE.hero.level===RANKS.xp.max;
      fresh();SAVE.hero.xp=rankXpAt(50);SAVE.hero.level=50;rankDevLevel('?level=30');r.down=SAVE.hero.level===50;   // רק מעלה
      // ענן (שרת מדומה): מחובר, אז נדחף מיד. ומכשיר אחר עם שמירה ישנה יותר לוקח את החדשה ולא דורס אותה
      CLOUD.fake=cloudFakeServer();cloudHeld(false);try{localStorage.removeItem(CLOUD.lsKey)}catch(e){}
      fresh();SAVE.hero.xp=rankXpAt(15);SAVE.hero.level=15;saveNow();SAVE.ts-=60000;await cloudSync();const old=JSON.parse(JSON.stringify(SAVE));   // ts ישן בדקה: בריצה מהירה שתי השמירות יוצאות באותה אלפית
      rankDevLevel.done=false;rankDevLevel('?level=30');const ts1=SAVE.ts,pu=rankDevLevel.push;await pu;const row=CLOUD.fake.rows.u1;   // המשחק רץ בין ה-await, ויכול לשמור שוב: משווים ל-ts של הרגע הזה
      r.cloud=!!pu&&!!row&&row.data.hero.level===30&&(row.data.bag.coins||0)>=t.coins&&row.data.ts>=ts1&&ts1>old.ts;if(!r.cloud)r.cdbg=[!!pu,!!row,row&&row.data.hero.level,row&&row.data.bag.coins,row&&row.data.ts-ts1,ts1-old.ts,cloudHeld(),CLOUD.status].join('/');
      SAVE=old;const rr=await cloudSync();r.other=CLOUD.fake.rows.u1.data.hero.level===30&&(rr==='took'?SAVE.hero.level===30:rr==='newer'&&cloudHeld());   // בפתיחה לוקח אותה, ובאמצע משחק מחכה לבחירה, ובשני המקרים לא דורס
    }catch(err){r.err=String(err&&err.stack||err)}
    window.lpLevelUp=lpu;window.rankCall=rc;rankDevLevel.done=true;CLOUD.fake=cf;CLOUD.session=cs;cloudHeld(!!ch);CLOUD.dirty=false;
    try{lsS?localStorage.setItem(CLOUD.lsKey,lsS):localStorage.removeItem(CLOUD.lsKey)}catch(e){}SAVE=JSON.parse(bak);SAVE_STORE.write(SAVE,true);return r});
  {const L=[[dlv.set,'רמה 30 עם 29 נקודות','לא עלה ל-30'],[dlv.res,'משאבים של רמה 30 ('+dlv.coins+' מטבעות)','משאבים לא לפי הטבלאות'],[dlv.none,'בלי פרמטר בלי שינוי','שינה בלי פרמטר!'],[dlv.once,'פעם אחת','חוזר'],[dlv.stack,'טעינה חוזרת לא מוסיפה','המשאבים נערמים'],[dlv.keep,'לא מוריד משאבים','הוריד משאבים!'],[dlv.max,'עד המקסימום','עבר את המקסימום'],[dlv.down,'רק מעלה','הוריד רמה!'],[dlv.cloud,'נדחף לענן מיד','לא הגיע לענן ('+dlv.cdbg+')'],[dlv.other,'מכשיר אחר לוקח את החדשה','ענן ישן דרס']];
   check(!dlv.err&&L.every(x=>x[0]),'?level=30 (כלי פיתוח): '+(dlv.err||L.map(x=>x[0]?x[1]:x[2]).join(', ')))}
  // כלי פיתוח: ?fresh=1 / ?restore=1 (js/devsave.js): גיבוי, שמירה חדשה מאפס, ושחזור זהה לגמרי. ענן מדומה
  const dfs=await page.evaluate(async()=>{const bak=JSON.stringify(SAVE),r={},cf=CLOUD.fake,cs=CLOUD.session,ch=CLOUD.hold,lsS=localStorage.getItem(CLOUD.lsKey),lsB=localStorage.getItem(DEVSAVE.key);
    const noTs=o=>{const c=devStrip(o);delete c.ts;return JSON.stringify(c)};
    try{CLOUD.fake=cloudFakeServer();CLOUD.session=null;cloudHeld(false);localStorage.removeItem(CLOUD.lsKey);localStorage.removeItem(DEVSAVE.key);delete SAVE.devBak;delete SAVE.devFresh;
      SAVE.hero.xp=rankXpAt(12);SAVE.hero.level=12;bagAdd('wood',77);SAVE.village.forge=3;saveNow();SAVE.ts-=60000;await cloudSync();
      const before=devClone(SAVE);r.btn0=!devHasBak();
      r.fresh=await devFresh()==='ok';const row=()=>CLOUD.fake.rows.u1.data;
      r.gone=SAVE.hero.level===1&&!SAVE.hero.xp&&!SAVE.bag.wood&&!SAVE.village.forge&&SAVE.devFresh===true;
      r.bakL=devSame(devLocalBak(),devStrip(before));r.bakS=devSame(SAVE.devBak,devStrip(before));
      r.bakC=devSame(row().devBak,devStrip(before))&&row().devFresh===true&&row().ts===SAVE.ts;
      r.pull=await cloudSync()!=='took'&&SAVE.devFresh===true&&!SAVE.bag.wood;   // the old save does not come back
      bagAdd('stone',5);saveNow();r.again=await devFresh()==='ok'&&devSame(devLocalBak(),devStrip(before))&&!SAVE.bag.stone;   // a 2nd ?fresh keeps the real backup
      r.rest=await devRestore()==='ok';r.same=noTs(SAVE)===noTs(before);if(!r.same)r.dbg=[noTs(SAVE).length,noTs(before).length].join('/');
      r.keep=devHasBak()&&devSame(devLocalBak(),devStrip(before))&&devSame(row().devBak,devStrip(before))&&!row().devFresh&&row().hero.level===12;
      // the backup can't be written: nothing changes
      const j0=JSON.stringify(SAVE),si=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===DEVSAVE.key)throw new Error('full');return si.call(this,k,v)};
      try{localStorage.removeItem(DEVSAVE.key);delete SAVE.devBak;const j1=JSON.stringify(SAVE);r.abort=await devFresh()==='fail'&&JSON.stringify(SAVE)===j1&&SAVE.hero.level===12}finally{Storage.prototype.setItem=si}
      CLOUD.session=null;r.none=await devRestore()==='none';
    }catch(err){r.err=String(err&&err.stack||err)}
    CLOUD.fake=cf;CLOUD.session=cs;cloudHeld(!!ch);CLOUD.dirty=false;clearTimeout(CLOUD.timer);CLOUD.timer=null;
    try{lsS?localStorage.setItem(CLOUD.lsKey,lsS):localStorage.removeItem(CLOUD.lsKey);lsB?localStorage.setItem(DEVSAVE.key,lsB):localStorage.removeItem(DEVSAVE.key)}catch(e){}SAVE=JSON.parse(bak);SAVE_STORE.write(SAVE,true);return r});
  {const L=[[dfs.fresh&&dfs.gone,'מאפס','לא התאפס'],[dfs.bakL&&dfs.bakS,'גיבוי בטלפון','גיבוי בטלפון חסר!'],[dfs.bakC,'גיבוי בענן','גיבוי בענן חסר!'],[dfs.pull,'הישנה לא חוזרת מהענן','הישנה חזרה'],[dfs.again,'?fresh שני שומר את הגיבוי','הגיבוי נדרס!'],[dfs.rest&&dfs.same,'שחזור זהה','השחזור שונה! '+(dfs.dbg||'')],[dfs.keep,'הגיבוי נשאר','הגיבוי נמחק'],[dfs.abort,'גיבוי נכשל = בלי שינוי','שינה בלי גיבוי!'],[dfs.none&&dfs.btn0,'בלי גיבוי: אין שחזור','שחזור בלי גיבוי']];
   check(!dfs.err&&L.every(x=>x[0]),'?fresh=1 / ?restore=1 (כלי פיתוח): '+(dfs.err||L.map(x=>x[0]?x[1]:x[2]).join(', ')))}
  const hsk=await page.evaluate(()=>{const sk=SAVE.hero.skin,pk=SAVE.pet.kind,r={};
    try{soundOpen();const lk=()=>R3D.on?heroLook().model:heroSkin();SAVE.hero.skin=null;const base=lk();
      document.querySelector('#ovSound [data-skin="nir"]').click();
      r.set=SAVE.hero.skin==='nir'&&JSON.parse(localStorage.getItem(SAVE_STORE.key)).hero.skin==='nir';
      r.look=lk()!==base;r.pressed=document.querySelector('#ovSound [data-skin="nir"]').getAttribute('aria-pressed')==='true';
      document.querySelector('#ovSound [data-skin="none"]').click();r.back=SAVE.hero.skin===null&&lk()===base;
      r.gear=gStatPanel().includes('data-skin="orel"');soundClose()}
    catch(e){r.err=e.message}
    SAVE.hero.skin=sk;SAVE.pet.kind=pk;saveNow();return r});
  // שדרוג שמרגישים (upfeel.js): מדרגות Aging לנשק (מכה כבדה, התזה, גל הדף, זעם), מספרים בזהב אחרי שדרוג, מכה שמעיפה, ומכה טעונה באזור הרחוק.
  // Math.random קבוע בזמן הבדיקה, כדי לא להזיז את ה-seed לבדיקות שאחרי
  const upf=await page.evaluate(()=>{const rnd=Math.random,bak={vil:S.vil,wd:S.wd,room:S.room,mode:S.mode,hs:S.hitstop,sh:S.shake,ar:JUICE.where.arena,tr:P.track,hits:S.hits,w:SAVE.gear.weapon,uf:JSON.stringify({...UF,fr:[],rings:[]}),ch:UPFEEL.charge.chance.far,n0:enemies.length},r={};
    Math.random=()=>0.5;
    try{S.vil=S.wd=S.room=null;S.mode='play';UPFEEL.test=true;JUICE.where.arena=true;P.track=newTrack();S.hits={};
      const base=gBase(SAVE.gear.weapon||'oakSword');
      const two=()=>{for(const q of enemies)q.dead=true;const e=addEnemy('grunt',P.x+60,P.y),o=addEnemy('grunt',P.x+60,P.y+30);for(const q of [e,o]){q.mult={};q.hp=q.max=1e9}return[e,o]};
      const hits=(e,k)=>{const L=[];for(let i=0;i<k;i++){const h=e.hp;damage(e,10,'sword',0,'physical');L.push(Math.round(h-e.hp))}return L};
      SAVE.gear.weapon=base;UF.n=0;let [e,o]=two();const L0=hits(e,5),u=L0[0];r.u=u;r.lv0=u>0&&L0.every(x=>x===u)&&o.hp===1e9;
      SAVE.gear.weapon=base+'+3';UF.n=0;[e,o]=two();const L3=hits(e,5);r.heavy=L3.slice(0,4).every(x=>x===u)&&L3[4]===2*u&&o.hp===1e9;
      SAVE.gear.weapon=base+'+5';UF.n=0;[e,o]=two();hits(e,1);r.splash=Math.abs((1e9-o.hp)-u/2)<=1;
      SAVE.gear.weapon=base+'+7';UF.n=0;[e,o]=two();const r0=UF.rings.length;hits(e,5);r.shock=Math.abs((1e9-o.hp)-u*(5*0.5+0.6))<=3&&UF.rings.length>r0;
      SAVE.gear.weapon=base+'+10';UF.n=0;[e,o]=two();const L10=hits(e,3);r.fury=Math.abs(L10[2]-2.5*u)<=1&&L10[0]===u;
      SAVE.gear.weapon=base;UF.gold=0;[e]=two();damage(e,10,'sword',0,'physical');const N0=juice().n[juice().n.length-1],c0=N0&&N0.col;
      ufUp();damage(e,10,'sword',0,'physical');const N1=juice().n[juice().n.length-1];r.gold=!!N1&&N1.col===UPFEEL.gold.col&&String(N1.txt).startsWith(UPFEEL.gold.mark)&&!!N0&&c0!==UPFEEL.gold.col;
      const f0=UF.flyN;[e]=two();e.max=100;ufKill(e,10,8,0);ufKill(e,20,5,0);r.noFly=UF.flyN===f0;ufKill(e,60,25,0);r.fly=UF.flyN===f0+1&&UF.fr.length>0;
      r.hint=ufForgeHint(base+'+1',1).includes(T('uf.p.heavy'))&&ufForgeHint(base+'+9',9).includes(T('uf.p.fury'))&&ufForgeHint(base+'+10',10)==='';
      // מכה טעונה: באזור הרחוק ההכנה ארוכה יותר ולוקחת 17% מהחיים, ואחריה מכה רגילה. בהתחלה אף פעם
      UPFEEL.charge.chance.far=1;const s=addEnemy('grunt',P.x+40,P.y);s.zone='far';s.dmg=1;
      const w=ufCharge(s);r.charge=w===UPFEEL.charge.wind&&s.hv===1&&ufStrikeDmg(s,1)>=(P.maxHp||100)*UPFEEL.charge.hp-1e-6&&ufCharge(s)===1&&!s.hv;
      s.zone='start';r.start=ufCharge(s)===1;s.zone='far';ufCharge(s);const dg=UF.chDodge;ufDodge(s);r.dodge=UF.chDodge===dg+1&&!s.hv;
      // לא בזירה: בלי test ומחוץ לעולם, כלום
      UPFEEL.test=false;SAVE.gear.weapon=base+'+10';UF.n=0;[e]=two();r.arena=hits(e,3).every(x=>x===u);UPFEEL.test=true;
      try{ctx.save();ufDraw();ctx.restore();r.draw=true}catch(err){r.draw=String(err)}
    }catch(err){r.err=String(err&&err.stack||err)}
    Math.random=rnd;UPFEEL.test=false;UPFEEL.charge.chance.far=bak.ch;enemies.length=bak.n0;
    Object.assign(UF,JSON.parse(bak.uf));SAVE.gear.weapon=bak.w;Object.assign(S,{vil:bak.vil,wd:bak.wd,room:bak.room,mode:bak.mode,hitstop:bak.hs,shake:bak.sh,hits:bak.hits});JUICE.where.arena=bak.ar;P.track=bak.tr;juice().n.length=0;return r});
  {const L=[[upf.lv0,'בלי Aging בלי שינוי','שינוי בלי Aging'],[upf.heavy,'‎+3 מכה חמישית כפולה','‎+3 בלי מכה כבדה'],[upf.splash,'‎+5 התזה','‎+5 בלי התזה'],[upf.shock,'‎+7 גל הדף','‎+7 בלי גל'],[upf.fury,'‎+10 זעם','‎+10 בלי זעם'],
    [upf.gold,'מספרים בזהב אחרי שדרוג','בלי זהב'],[upf.fly&&upf.noFly,'מכה שמעיפה','בלי חתיכות'],[upf.hint,'רמז בנפחייה','בלי רמז'],[upf.charge&&upf.start&&upf.dodge,'מכה טעונה (רחוק, לא בהתחלה, התחמקות)','מכה טעונה שבורה'],[upf.arena,'בזירה כבוי','פועל בזירה'],[upf.draw===true,'ציור','ציור: '+upf.draw]];
   check(!upf.err&&L.every(x=>x[0]),'שדרוג שמרגישים (upfeel.js): '+(upf.err||L.map(x=>x[0]?x[1]:x[2]).join(', ')))}
  // דרמה בקרב בעולם (drama.js): אוטומטי ×0.75 עם 2 סקילים, סקיל ×1.3 ועוד לפי הפער, חיסול בסקיל (לא באוטומטי, לא בנדיר), מוות של שלד בתקרה
  // והאחרון בקבוצה מלא, שלל שנמשך, רגע מחיצה, מכה טעונה בזוגות כשחלש, וקפיצה על מי שעומד רחוק. Math.random קבוע, כמו upfeel
  const drm=await page.evaluate(()=>{const rnd=Math.random,bak={vil:S.vil,wd:S.wd,room:S.room,mode:S.mode,hs:S.hitstop,sh:S.shake,sl:S.slow,sk:S.sk,hp:P.hp,mh:P.maxHp,inv:P.inv,x:P.x,y:P.y,n0:enemies.length,ch:UPFEEL.charge.chance.far,gd:(S.gd||[]).length,st:JSON.stringify(DM.stat)},r={};
    Math.random=()=>0.5;
    try{S.vil=S.wd=S.room=null;S.mode='play';S.sk={ids:['a','b'],cd:[0,0],fx:[]};
      const L=heroLv(),mk=(gap,o={})=>{const e=addEnemy('grunt',P.x+60,P.y);e.mult={};e.hp=e.max=o.hp||1e9;e.dmLv=L-gap;Object.assign(e,o);return e};
      const hit=(e,w,on)=>{DRAMA.test=on;const h=e.hp;damage(e,10,w,0,'physical');DRAMA.test=true;return h-e.hp};
      const a0=hit(mk(0),'sword',false),a1=hit(mk(0),'sword',true);S.sk.ids=['a'];const a2=hit(mk(0),'sword',true);S.sk.ids=['a','b'];
      r.auto=Math.abs(a1/a0-0.75)<0.01&&Math.abs(a2/a0-1)<0.01;
      const s0=hit(mk(0),'skill',false),s1=hit(mk(0),'skill',true),s3=hit(mk(3),'skill',true),s9=hit(mk(9),'skill',true);
      r.skill=Math.abs(s1/s0-1.3)<0.01&&Math.abs(s3/s0-1.3*1.6)<0.01&&Math.abs(s9/s0-1.3*2.5)<0.01;
      const x0=DM.stat.exec,u=s0;   // u: מכת סקיל של 10 בלי דרמה
      const e1=mk(3,{hp:100});e1.hp=u*2.08+20;damage(e1,10,'skill',0,'physical');
      const e2=mk(0,{hp:100});e2.hp=u*1.3+20;damage(e2,10,'skill',0,'physical');
      const e3=mk(3,{hp:100});e3.hp=a1+5;damage(e3,10,'sword',0,'physical');
      const e4=mk(3,{hp:100,rare:'x'});e4.hp=u*2.08+20;damage(e4,10,'skill',0,'physical');
      r.exec=e1.dead&&!e2.dead&&!e3.dead&&!e4.dead&&DM.stat.exec===x0+1;
      // מוות: 4 שלדים מאותה קבוצה. שניים מלאים, השלישי קצר (תקרה), והאחרון בקבוצה מלא עם טבעת
      for(const q of enemies.slice(bak.n0))q.dead=true;const g=[0,1,2,3].map(()=>mk(0,{home:9999}));DM.fulls=[];const st=Object.assign({},DM.stat),fx0=DM.fx.length;
      for(const q of g)kill(q);
      r.death=DM.stat.full===st.full+3&&DM.stat.short===st.short+1&&DM.stat.last===st.last+1&&DM.fx.length===fx0+4&&!!DM.fx[DM.fx.length-1].skull&&!DM.fx[DM.fx.length-2].skull;
      const n0=drops().length;dropSpawn('wood',1,P.x+300,P.y+300);dmLoot(n0);r.pull=!!drops()[n0]&&drops()[n0].fly;drops().splice(n0);
      // מחיצה: הטלה, ו-4 הריגות בסקיל בתוך החלון
      const c0=DM.stat.crush;S.slow=0;DM.cast={id:'a',t:DM.t,k:0};for(let k=0;k<4;k++)damage(mk(0,{hp:5}),1e6,'skill',0,'physical');
      r.crush=DM.stat.crush===c0+1&&S.slow>0;
      // חלש: מכה טעונה באזור הרחוק עד 60%, ושכן טוען גם הוא. בלי פער: כלום
      for(const q of enemies.slice(bak.n0))q.dead=true;UPFEEL.charge.chance.far=0;
      const w1=mk(-5,{zone:'far',home:9998}),w2=mk(-5,{zone:'far',home:9998});w2.x=w1.x+50;
      const k1=ufCharge(w1),k2=ufCharge(w2),ev=mk(0,{zone:'far'});const k3=ufCharge(ev);
      r.charge=k1===UPFEEL.charge.wind&&w2.dmForce===0&&k2===UPFEEL.charge.wind&&k3===1;
      // קפיצה: אויב חלש-ממני רחוק מסמן, מי שזז מתחמק, מי שעומד נפגע
      for(const q of enemies.slice(bak.n0))q.dead=true;DM.marks=[];P.inv=0;P.hp=P.maxHp=Math.max(P.maxHp||100,100);
      const j=mk(-5,{alert:5});j.x=P.x+200;j.y=P.y;DM.pT=0;dmUpdate(0.01);const m1=DM.marks.length===1;
      const d0=DM.stat.pDodge;P.x+=300;for(let k=0;k<15;k++)dmUpdate(0.1);P.x-=300;const dodge=DM.stat.pDodge===d0+1;
      j.x=P.x+200;j.y=P.y;DM.pT=0;DM.marks=[];dmUpdate(0.01);const h0=DM.stat.pHit;P.inv=0;for(let k=0;k<15;k++)dmUpdate(0.1);
      r.pounce=m1&&dodge&&DM.stat.pHit===h0+1;
      // בזירה: בלי test ובלי עולם, כלום
      DRAMA.test=false;r.arena=Math.abs(hit(mk(9),'skill',false)/s0-1)<0.01&&Math.abs(hit(mk(0),'sword',false)/a0-1)<0.01;DRAMA.test=true;
      try{ctx.save();dmDraw();ctx.restore();r.draw=true}catch(err){r.draw=String(err)}
    }catch(err){r.err=String(err&&err.stack||err)}
    Math.random=rnd;DRAMA.test=false;UPFEEL.charge.chance.far=bak.ch;for(const q of enemies.slice(bak.n0))q.dead=true;enemies.length=bak.n0;DM.marks=[];DM.fx=[];DM.rings=[];DM.cast=null;DM.gk={};
    Object.assign(DM.stat,JSON.parse(bak.st));Object.assign(S,{vil:bak.vil,wd:bak.wd,room:bak.room,mode:bak.mode,hitstop:bak.hs,shake:bak.sh,slow:bak.sl,sk:bak.sk});Object.assign(P,{hp:bak.hp,maxHp:bak.mh,inv:bak.inv,x:bak.x,y:bak.y});DM.fulls=[];return r});
  {const L=[[drm.auto,'auto x0.75 with 2 skills','auto not weaker'],[drm.skill,'skill x1.3 and by level gap','skill multiplier wrong'],[drm.exec,'skill execute (not auto, not rare)','execute wrong'],
    [drm.death,'skeleton death (cap, last of group)','death fx wrong'],[drm.pull,'loot pulled','loot not pulled'],[drm.crush,'crush moment','no crush'],[drm.charge,'charged hit in pairs when weaker','charge pressure wrong'],
    [drm.pounce,'pounce on ranged (dodge, hit)','pounce wrong'],[drm.arena,'off in arena','on in arena'],[drm.draw===true,'draws','draw '+drm.draw]];
   check(!drm.err&&L.every(x=>x[0]),'Combat drama (drama.js): '+(drm.err||L.map(x=>x[0]?x[1]:x[2]).join(', ')))}
  // אפקטים של קרב (juice.js): פגיעה מפעילה עצירה, הבזק, הדיפה, ניצוצות ומספר. קריטי צהוב עם רעידה, הריגה עם עשן, תקרה לטלפון, ובזירה כבוי.
  // הבדיקה רצה במקום ניטרלי עם המתג של אוראל (JUICE.where.arena), כדי לא לגעת בשמירה של העולם
  const jc=await page.evaluate(()=>{const bak={vil:S.vil,wd:S.wd,room:S.room,mode:S.mode,hs:S.hitstop,sh:S.shake,jc:S.jc,ar:JUICE.where.arena,tr:P.track,hits:S.hits},c=HITFX.crit,r={};
    try{S.vil=S.wd=S.room=null;S.mode='play';S.jc=null;HITFX.crit=0;JUICE.where.arena=true;P.track=newTrack();S.hits={};
      const e=addEnemy('grunt',P.x+60,P.y);e.mult={fire:1.5};e.hp=e.max=1e9;S.hitstop=0;S.shake=0;
      damage(e,10,'sword',0,'fire');const J=juice();r.stop=S.hitstop>0&&S.hitstop<=JUICE.stop.weak+1e-6;r.fl=J.fl.length===1;r.flash=e.flash>=JUICE.flash-1e-6;r.kb=e.kx>0;r.parts=J.p.length>0;r.num=J.n.length===1&&J.n[0].weak==='fire';
      r.squash=(e.jT=jNow()-JUICE.squash.t/2,juiceSquash(e)>0);
      S.hitstop=0;damage(e,10,'sword',0,'fire');r.stopGap=!(S.hitstop>0);   // מכה שנייה מיד: בלי עצירה (gapHit)
      // תחושת מכה (hitfeel.js): האויב נוטה ונגמר, והגיבור נוטה לאחור בהכנה, בלי לשנות את זמן הקירור
      {const W=HITFEEL.where.arena,w0=P.weapon,t0=P.sw.t;HITFEEL.where.arena=true;e.hfT=0;hfHit(e,1.5,false,0);const on=e.hfT>0;   // ישירות ולא דרך damage: בלי rand, כדי לא להזיז את ה-seed לבדיקות שאחרי
        e.hfT=jNow()-e.hfD*0.2;r.hfLean=on&&hfFoe(e)>0;e.hfT=jNow()-e.hfD-0.01;r.hfEnd=hfFoe(e)===0&&!e.hfT;
        P.weapon='sword';P.sw.t=0.03;r.hfWind=hfHero().lean<0&&P.sw.t===0.03;P.sw.t=t0;P.weapon=w0;HITFEEL.where.arena=W;r.hfN=HF.n.wind+'/'+HF.n.foe}
      HITFX.crit=1;S.hitstop=0;J.last=-9;damage(e,10,'sword',0,'ice');const N=J.n[J.n.length-1];r.crit=!!N&&N.crit&&N.col===JUICE.nums.critCol&&S.hitstop>=JUICE.stop.crit-1e-6;r.shake=S.shake>0;HITFX.crit=0;
      e.elite=true;S.hitstop=0;J.last=jNow();juiceKill(e);r.poof=J.poofs.length===1&&S.hitstop>=JUICE.stop.big-1e-6;
      // מכה עם הכנה (strike.js): נעצר ומתכונן, לא פוגע לפני הסוף, פוגע כשנשארים בטווח, ולא פוגע כשמתרחקים (התחמקות)
      {const h0=hurt;let hits=0;hurt=()=>{hits++};try{const s=addEnemy('grunt',P.x+e.r+P.r,P.y);s.scd=0;s.sw=null;strikeTick(s,0.01,Math.hypot(P.x-s.x,P.y-s.y));s.scd=0;
        const d0=Math.hypot(P.x-s.x,P.y-s.y);strikeTick(s,0.01,d0);r.swStart=s.sw>0&&strikeTick(s,0.001,d0);strikeTick(s,STRIKE.wind*0.5,d0);r.swEarly=hits===0;strikeTick(s,STRIKE.wind,d0);r.swHit=hits===1;
        s.x=P.x+e.r+P.r;s.y=P.y;s.kx=s.ky=0;s.scd=0;strikeTick(s,0.01,d0);P.x-=200;strikeTick(s,STRIKE.wind+0.1,999);P.x+=200;r.swDodge=hits===1&&(s.dodged||0)>=1;
        s.dead=true}finally{hurt=h0}}
      // עמיד: במקום "0" כתוב "חסין" באפור, ואחרי כמה שניות של מכות חלשות טיפ בפיד עם סוג נזק טוב יותר (פעם אחת)
      e.mult={fire:1.5,water:0};damage(e,10,'sword',0,'water');const R=J.n[J.n.length-1];r.resist=!!R&&R.txt.includes(T('jc.immune'))&&R.col===C.dim&&R.weak==='water';
      const fa=FEED.where.arena;FEED.where.arena=true;delete JTIP[e.type];e.jRes={t:'water',t0:jNow()-9,last:jNow()};const f0=FEED.stat.added;damage(e,10,'sword',0,'water');
      r.tip=FEED.stat.added===f0+1&&!!FL.find(f=>f.key==='tip:'+e.type&&f.txt.includes(T('dt.fire')));damage(e,10,'sword',0,'water');r.tipOnce=FEED.stat.added===f0+1;FEED.where.arena=fa;
      for(let i=0;i<300;i++)damage(e,1,'sword',0,'lightning',true);r.cap=J.p.length<=JUICE.parts.max&&J.n.length<=JUICE.nums.max;
      // כוח שרואים: ‎+9 נותן 3 הדים לשובל ובלי לעבור את התקרה, ורצף של 10 הריגות קופץ (juice.js, weapons.js)
      {const w0=P.wid;P.wid='oakSword+9';r.grow=wSteps()===3&&wGrow()>1&&wGrow()<=WEAPONS.grow.max+1e-9;P.wid=w0;
        J.st=0;J.stT=-9;J.stPop=0;for(let i=0;i<10;i++)juiceKill({x:e.x,y:e.y,r:10,weak:'fire'});r.streak=J.st===10&&J.stPop>0}
      try{ctx.save();juiceDraw();r.swing=jSwing({ang:0,arc:2,range:60},0.6,'#fff');ctx.restore();r.draw=true}catch(err){r.draw=String(err)}
      // בזירה (arena-juice.js): juice.js כבוי (בלי המספרים שלו), ומכה של הנשק מקבלת הבזק וניצוצות קטנים. חיית מחמד וברק שקפץ לא.
      // 250 אויבים: לא יותר מ-perFrame אפקטים בפריים, ניצוצות והבזקים מתחת לתקרה, בלי עצירה. פוף רק לאלוף. "פחות אפקטים" מכבה
      JUICE.where.arena=false;const A=JUICE.arena,a0=A.on,fl0=SAVE.fxLess;A.on=true;SAVE.fxLess=false;
      const n0=J.n.length;J.fl=[];J.p=[];J.poofs=[];AJ.f=-1;e.flash=0;damage(e,10,'sword',0,'fire');r.arenaOff=J.n.length===n0;r.arOn=J.fl.length===1&&e.flash>=(A.flash??JUICE.flash)-1e-6&&J.p.length>0;   // A.flash: 60ms מ-arena-feel.js (#508)
      AJ.f=-1;const fx0=AJ.stat.fx;damage(e,10,'pet',0,'fire');damage(e,10,'sword',0,'fire',true);r.arSrc=AJ.stat.fx===fx0;
      const many=[];for(let i=0;i<250;i++){const o=addEnemy('grunt',P.x+rand(-300,300),P.y+rand(-150,150));o.hp=o.max=1e9;o.elite=false;many.push(o)}
      AJ.f=-1;S.hitstop=0;const fx1=AJ.stat.fx;HITFX.crit=1;for(const o of many)damage(o,1,'gun',0,'fire');HITFX.crit=0;r.arN=AJ.stat.fx-fx1;r.arMax=A.perFrame;
      r.arCap=r.arN>0&&r.arN<=A.perFrame&&J.p.length<=A.parts.max&&J.fl.length<=A.impact.max;r.arStop=!(S.hitstop>0);
      const p0=J.poofs.length;juiceKill(many[0]);r.arPoof=J.poofs.length===p0;many[1].champ=true;juiceKill(many[1]);r.arPoof=r.arPoof&&J.poofs.length===p0+(!fxLess()&&typeof fxImg==='function'&&fxImg(many[1].isBoss?'ko_boss':'ko')?0:1);   // MLBB 3.3: when the ko sheet will show, it is the moment and the poof steps aside
      for(const o of many)o.dead=true;
      SAVE.fxLess=true;AJ.f=-1;const fx2=AJ.stat.fx;damage(e,10,'sword',0,'fire');r.arLess=AJ.stat.fx===fx2;SAVE.fxLess=fl0;A.on=a0;
      e.dead=true;enemies=enemies.filter(x=>!x.dead)}catch(err){r.err=String(err)}
    S.vil=bak.vil;S.wd=bak.wd;S.room=bak.room;S.mode=bak.mode;S.hitstop=bak.hs;S.shake=bak.sh;S.jc=bak.jc;JUICE.where.arena=bak.ar;P.track=bak.tr;S.hits=bak.hits;HITFX.crit=c;return r});

  // חלון מלא עוצר את העולם (ui.js, uiHold. באג 9.11: יומן הקווסטים נפתח ליד אויבים, והגיבור המשיך לחטוף מאחוריו).
  // אויב צמוד לגיבור, פותחים את היומן בתפריט ומריצים 5 שניות של פריימים: בלי נזק ובלי תזוזה. סוגרים: הקרב חוזר. בכפר הייצור ממשיך לפי השעון
  const hold=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={};const dn=Date.now;
    try{if(SKR)skrEnd(false);enterWorld('home');enemies=[];P.maxHp=P.hp=1e6;
      let t=performance.now();const run=s=>{last=t;for(let i=0;i<s*60;i++){t+=1000/60;frameStep(t)}};
      const e=addEnemy('grunt',P.x+60,P.y);e.home=0;e.hp=e.max=1e9;run(0.5);
      menuShow('qBtn');r.open=!$('qLog').hidden&&document.body.classList.contains('menu')&&uiHold();
      const hp=P.hp,ex=e.x,ey=e.y,n=enemies.length;run(5);
      r.still=P.hp===hp&&e.x===ex&&e.y===ey&&enemies.length===n;
      menuClose();r.closed=$('qLog').hidden&&!uiHold();run(3);r.resume=P.hp<hp||e.x!==ex||e.y!==ey;
      enemies=[];worldUi(false);enterVillage();
      const k=Object.keys(VILLAGE.b).find(k=>VILLAGE.b[k].make);SAVE.village[k]=Math.max(1,SAVE.village[k]||0);SAVE.prod[k]={t:0,have:{}};vSettle(k);
      menuShow('qBtn');r.vHold=uiHold();const T0=dn();Date.now=()=>T0+3600e3;run(0.5);
      const p=vSettle(k);r.prod=Object.values(p.have).some(v=>v>0);Date.now=dn;menuClose()}catch(err){r.err=String(err&&err.stack||err)}
    Date.now=dn;last=performance.now();menuClose();SAVE=JSON.parse(bak);if(vil)enterVillage();else{worldUi(false);reset();S.mode=mode}return r});   // last: השעון של הלולאה חוזר להווה, אחרת הפריים הבא מקבל dt שלילי
  // סקילים וחפצים מסתובבים בעולם הפתוח (wskill.js): כפתור סקיל מעל הסרגל, נגיעה יורה אל הקרוב, גרירה מכוונת, הכדור נוחת ופוגע, קירור עם מספר,
  // וחמשת החפצים מסתובבים, פוגעים ומצוירים (מרחפים עם צל). אחר כך הכל חוזר
  const wsk=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={};
    try{SAVE.hero.level=99;SAVE.gear.orbit=['emberOrb','frostOrb','stoneOrb','leafOrb','cloverOrb'];enterWorld('home');enemies=[];
      const run=t=>{for(let i=0;i<t*60;i++){P.hp=P.maxHp;worldUpdate(1/60)}};
      const mk=(dx,dy)=>{const e=addEnemy('grunt',P.x+dx,P.y+dy);e.home=0;e.mult={};e.hp=e.max=1e9;e.speed=0;e.dmg=0;return e};
      run(0.1);hud();const box=$('skills'),b=box.querySelector('[data-sk]'),nav=$('nav').getBoundingClientRect();
      r.btn=!box.hidden&&!!b;r.id=S.sk.ids[0];
      if(b){const q=b.getBoundingClientRect();r.place=q.right>innerWidth*0.6&&q.bottom<=innerHeight-24&&q.right<=innerWidth-16&&(q.bottom<=nav.top||q.right<=nav.left||q.left>=nav.right)}
      const wh=()=>S.sk.wHits||0,e=mk(150,0),h1=wh();r.tap=wskUse(r.id);run(0.6);r.tapHit=wh()>h1&&e.hp<e.max;r.cd=S.sk.cd[0]>0;wskHud();r.sec=+(b&&b.dataset.sec)>0;
      r.again=!wskUse(r.id);   // בזמן ההמתנה לא יורה
      S.sk.cd[0]=0;const e2=mk(-160,0),h2=wh();r.drag=wskUse(r.id,{a:Math.PI,len:200});run(0.6);r.dragHit=wh()>h2&&e2.hp<e2.max;
      // אצבע אמיתית על הכפתור: לוחצים, גוררים ומרימים
      S.sk.cd[0]=0;const u0=S.sk.wUsed;if(b){const q=b.getBoundingClientRect(),x=q.left+q.width/2,y=q.top+q.height/2,o={bubbles:true,pointerId:7,isPrimary:true};
        b.dispatchEvent(new PointerEvent('pointerdown',{...o,clientX:x,clientY:y}));window.dispatchEvent(new PointerEvent('pointermove',{...o,clientX:x-90,clientY:y}));
        let aimed=false;const a0=ctx.setLineDash;ctx.setLineDash=function(v){if(v&&v.length)aimed=true;return a0.apply(this,arguments)};try{drawWSkill()}finally{ctx.setLineDash=a0}r.aimDraw=aimed;
        b.dispatchEvent(new PointerEvent('pointerup',{...o,clientX:x-90,clientY:y}))}
      r.finger=S.sk.wUsed===u0+1&&!wskAim;
      for(const x of enemies)x.dead=true;enemies=enemies.filter(x=>!x.dead);run(0.2);
      // בעולם החפצים מצוירים כאורות (wisps.js): נספר כמה אורות צוירו, ושפגיעה של חפץ מבזיקה את האור שלו
      const W=WISPS.stat;drawOrbits();const d0=W.draws,f0=W.flashes;
      r.orbs=S.orb.types.length;const p=S.orb.pos[0],e3=mk(p.x-P.x,p.y-P.y);orbitUpdate(0);r.orbHit=e3.hp<e3.max;
      drawOrbits();r.orbDraw=W.draws>d0&&W.lights>=5;r.orbFlash=W.flashes>f0;
      e3.dead=true;enemies=[]}catch(err){r.err=String(err&&err.stack||err)}
    worldUi(false);SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}return r});
  // הגיבור מטיל סקיל (skillcast.js): בכל שימוש יש תנועה של פלג הגוף העליון ועיגול רונות בצבע סוג הנזק שנעלם לבד. בזירה לא
  const skc=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={};
    try{if(SKR)skrEnd(false);SAVE.hero.level=99;enterWorld('home');enemies=[];SAVE.hero.skSeen=[...(SAVE.hero.skSeen||[]),...S.sk.ids];
      const run=t=>{for(let i=0;i<t*60;i++){P.hp=P.maxHp;worldUpdate(1/60)}};
      const e=addEnemy('grunt',P.x+150,P.y);e.home=0;e.mult={};e.hp=e.max=1e9;e.speed=0;e.dmg=0;
      const id=S.sk.ids[0],n0=P.skCast?P.skCast.n:0;S.sk.cd[0]=0;r.id=id;r.cast=wskUse(id);if(SKR)skrEnd(false);
      r.anim=!!P.skCast&&P.skCast.n===n0+1;r.clip=R3D.ready?skcClip(heroLook()):'Ranged_Magic_Shoot';r.clipOk=!R3D.ready||!!R3D.clips[r.clip+'@up'];
      r.rune=!!skcRune;r.col=skcRune&&skcRune.col;const d=skcRune&&(skcRune.d3||skcRune.d3b);r.r3d=!!d;r.band=!R3D.on||!!(skcRune&&skcRune.d3b);r.tier=skcRune&&skcRune.big?'big':'normal';
      // בקרב (אויב במרחק 150): קטן ושקוף יותר, וגל ההדף לא מגיע לאויב. בלי אויבים: בגודל מלא
      const C=SKCAST.combat,rk=()=>skcRune?[skcRune.fight,skcRune.k,skcRune.a,skcWaveR(skcRune.T.wave)]:[];r.fight=rk();
      run(SKCAST.rune.life+0.1);r.gone=!skcRune&&!(d&&d.on);
      e.dead=true;enemies=[];skCast(id);r.calm=rk();skcFree();skcRune=null;
      r.combat=r.fight[0]===true&&r.fight[1]===C.r&&r.fight[2]===C.a&&r.fight[3]<150-e.r&&r.calm[0]===false&&r.calm[1]===1&&r.calm[3]>r.fight[3];
      worldUi(false);reset();const c0=skcStat.casts;skCast(id);r.arena=skcStat.casts===c0;   // זירה: כלום
      enemies=[]}catch(err){r.err=String(err&&err.stack||err)}
    worldUi(false);SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}return r});
  // רגע גילוי של סקיל חדש בעולם (skillreveal.js): מתחיל אחרי SKREVEAL.delay, עוצר את הזמן ומקרב, האייקון עף ונגמר לבד, פעם אחת לכל סקיל.
  // ההטלה הראשונה גדולה, נגיעה מדלגת, ודרגה גבוהה בעץ מגדילה ומחליפה צבע. אחר כך המשחק ממשיך
  const skr=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={};
    try{if(SKR)skrEnd(false);SAVE.hero.level=99;SAVE.hero.skSeen=[];SAVE.hero.tree={};enterWorld('home');enemies=[];
      const run=t=>{for(let i=0;i<t*60;i++){P.hp=P.maxHp;worldUpdate(1/60)}},s0={...skrStat},id=S.sk.ids[0];r.id=id;
      run(SKREVEAL.delay*0.5);r.wait=!SKR;run(SKREVEAL.delay*0.6+0.05);hud();
      r.start=!!SKR&&skrStat.starts===s0.starts+1&&S.hitstop>0&&SAVE.hero.skSeen.includes(id);
      SKR.t0-=SKREVEAL.zin+0.05;r.zoom=skrZoom()>1;r.fly=!!document.querySelector('.skrfly');
      SKR.t0-=SKREVEAL.dur+0.4;render();camZoom();   // השעון בבדיקה עומד: מזיזים את ההתחלה אחורה
      r.end=!SKR&&!document.querySelector('.skrfly')&&skrStat.ends===s0.ends+1&&skrZoom()===1&&S.mode==='play';
      run(1);r.once=skrStat.starts===s0.starts+1;
      const e=addEnemy('grunt',P.x+150,P.y);e.home=0;e.mult={};e.hp=e.max=1e9;e.speed=0;e.dmg=0;S.sk.cd[0]=0;S.hitstop=0;
      const b0=skrStat.big;r.big=wskUse(id)&&skrStat.big===b0+1;run(0.6);r.on=e.hp<e.max;
      SAVE.hero.skSeen=[];run(0.02);r.skipStart=!!SKR;if(SKR)SKR.t0-=0.3;
      dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.skip=!SKR&&skrStat.skips===s0.skips+1&&!(S.hitstop>0);
      const g0=skSize(id),c0=skCol(id);SAVE.hero.tree={[SKREVEAL.branch[id]]:['w1','x','y','z','u','v']};
      r.grade=skrGrade(id)===SKREVEAL.grade.max&&skSize(id)>g0&&skCol(id)!==c0&&c0===dtCol(skDef(id).dt);
      e.dead=true;enemies=[]}catch(err){r.err=String(err&&err.stack||err)}
    if(SKR)skrEnd(false);worldUi(false);SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}return r});
  // ספר הסקילים (wskbook.js): סקיל נפתח ברמה ומופיע במסלול הרמות, עלייה ברמה ממלאת משבצת, הספר נפתח ומחליף מה על הכפתור,
  // וכל אחד מתשעת הסקילים החדשים יורה ופוגע בלי שגיאות. אחר כך הכל חוזר
  const wsb=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={ok:[],bad:[],n:Object.keys(WSKBOOK.list).length};
    try{if(SKR)skrEnd(false);SAVE.hero.level=1;SAVE.hero.skLoad=[];SAVE.hero.skSeen=wsbIds().slice();enterWorld('home');enemies=[];
      const run=t=>{for(let i=0;i<t*60;i++){P.hp=P.maxHp;worldUpdate(1/60)}};
      const mk=(dx,dy)=>{const e=addEnemy('grunt',P.x+dx,P.y+dy);e.home=0;e.mult={};e.hp=e.max=1e9;e.speed=0;e.dmg=0;return e};
      run(0.05);r.one=S.sk.ids.length===(wsbWeapon()?1:0);r.lock=!wsbOpen('meteor')&&!wsbOpen('charge');
      const n=Math.min(...Object.keys(WSKBOOK.list).map(wsbNeed));r.lp=lpAt(n).some(x=>x.k==='skill');
      SAVE.hero.level=99;wsbLevelUp(1,99);r.fill=wsbLoad().filter(Boolean).length===WSKBOOK.slots;run(0.05);r.btns=S.sk.ids.length===SKILLS.max;
      wsbOpenUi();const ov=$('ovBook');r.ui=!!ov&&!ov.hidden&&ov.querySelectorAll('.wsbc').length===wsbIds().filter(id=>id!==wsbWeapon()).length;
      // הכרטיסים לא עולים זה על זה והתיאור לא גולש מהכרטיס (ניר, 4.11), והמספר על כרטיס נבחר הוא המספר של המשבצת שלו (2 או 3, כי 1 הנשק)
      {const cs=[...ov.querySelectorAll('.wsbc')],R=cs.map(e=>e.getBoundingClientRect());let n=0;
        for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){const a=R[i],c=R[j];if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1)n++}
        r.cardOv=n;r.cardSpill=cs.filter(e=>e.scrollHeight>e.clientHeight+2).map(e=>e.dataset.wsbid);
        r.cardNum=wsbLoad().every((id,i)=>{if(!id)return true;const k=ov.querySelector('.wsbc[data-wsbid="'+id+'"] .wsbk');return !!k&&k.textContent===String(i+2)})}
      const c0=ov.querySelector('.wsbc:not(.on):not(.lock)'),pid=c0&&c0.dataset.wsbid;
      if(pid){ov.querySelector('[data-wslot="1"]').click();ov.querySelector('[data-wsbid="'+pid+'"]').click();r.swap=wsbLoad()[1]===pid}
      ov.querySelector('[data-wsb="x"]').click();r.close=ov.hidden;run(0.05);r.swapBtn=!!pid&&S.sk.ids.includes(pid);hud();
      for(const id in WSKBOOK.list){
        try{SAVE.hero.skLoad=[id,null];run(0.05);for(const x of enemies)x.dead=true;enemies=[];
          const i=S.sk.ids.indexOf(id);if(i<0){r.bad.push(id+':לא על כפתור');continue}S.sk.cd[i]=0;
          const e=mk(80,0),h0=wsbStat.hits[id]||0,D=WSKBOOK.list[id];
          if(!wskUse(id)){r.bad.push(id+':לא ירה');continue}
          run((D.t||D.delay||D.arm||0.4)+0.6);
          const hit=(wsbStat.hits[id]||0)>h0&&e.hp<e.max;(hit?r.ok:r.bad).push(id+(hit?'':':לא פגע'))}
        catch(err){r.bad.push(id+':'+String(err))}}
      for(const x of enemies)x.dead=true;enemies=[];run(8);r.clean=!(S.wsb&&S.wsb.fx.length);r.noPic=Object.keys(WSKBOOK.list).filter(id=>wsbPicOk[id]!==true)}catch(err){r.err=String(err&&err.stack||err)}
    const o=$('ovBook');if(o)o.hidden=true;if(SKR)skrEnd(false);worldUi(false);SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}return r});
  // ספר קדום (wskbook.js): בוס בעולם מפיל ספר שפותח את הסקיל הבא של הדמות לפני הרמה שלו. כשהכל פתוח, זהב במקום. שמירה ישנה (בלי tome) עובדת
  const tome=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={};
    try{if(SKR)skrEnd(false);SAVE.hero.start='hunter';SAVE.gear.weapon=HEROES.list.hunter.weapon;SAVE.hero.level=1;SAVE.hero.skLoad=[];delete SAVE.hero.tome;enterWorld('home');enemies=[];
      r.oldSave=!wsbOpen('volley')&&wsbTomed().length===0;
      const K=WSKBOOK.tome.chance;r.hooks=K.warden>0&&K.rematch>0&&K.nemesis>0&&String(storyUpdate).includes('wsbTome')&&String(nemBeat).includes('wsbTome');
      const mine=Object.keys(WSKBOOK.list).filter(id=>WSKBOOK.list[id].cls==='hunter').sort((a,b)=>WSKBOOK.list[a].lv-WSKBOOK.list[b].lv);
      const got=wsbTome('warden',P.x,P.y,true);
      r.first=got===mine[0]&&wsbOpen(got)&&heroLv()===1&&wsbLoad().includes(got)&&!wsbAt(WSKBOOK.list[got].lv).some(x=>x.txt.includes(T('sk.'+got)));
      for(let i=1;i<mine.length;i++)wsbTome('nemesis',P.x,P.y,true);
      r.all=mine.every(wsbOpen);r.spare=wsbTome('rematch',P.x,P.y,true)==='spare';r.n=wsbTomeStat.opened.length;
      r.saved=JSON.parse(JSON.stringify(SAVE)).hero.tome.length===mine.length}catch(err){r.err=String(err&&err.stack||err)}
    if(SKR)skrEnd(false);worldUi(false);SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}return r});
  // אפקטים בתלת-ממד (vfx3d.js, skfx3d-meteor.js): המטאור מוטל, בנפילה יש חלקיקים ומתכון פעיל (והציור הדו-ממדי מדלג), בפגיעה פיצוץ, ובסוף הכל משתחרר
  const vfx=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={};
    try{if(SKR)skrEnd(false);SAVE.hero.level=99;SAVE.hero.skSeen=wsbIds().slice();SAVE.hero.skLoad=['meteor',null];enterWorld('home');enemies=[];
      const run=t=>{for(let i=0;i<t*60;i++){P.hp=P.maxHp;worldUpdate(1/60);VFX3D.step(1/60)}};
      run(0.05);if(SKR)skrEnd(false);r.d3=VFX3D.on();
      const e=addEnemy('grunt',P.x+80,P.y);e.home=0;e.mult={};e.hp=e.max=1e9;e.speed=0;e.dmg=0;
      const i=S.sk.ids.indexOf('meteor');if(i>=0)S.sk.cd[i]=0;r.cast=wskUse('meteor');if(SKR)skrEnd(false);
      run(0.5);r.fall=VFX3D.parts()>0&&SKFX3D.n()>0;r.skip2d=!!S.wsb&&S.wsb.fx.some(o=>SKFX3D.owns(o));r.p1=VFX3D.parts();
      run(0.6);r.boom=VFX3D.parts()>0;r.p2=VFX3D.parts();r.hit=e.hp<e.max;
      for(const x of enemies)x.dead=true;enemies=[];run(6);r.end=VFX3D.n()===0&&SKFX3D.n()===0}catch(err){r.err=String(err&&err.stack||err)}
    if(SKR)skrEnd(false);worldUi(false);SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}return r});
  // מתכוני הצייד בתלת-ממד (skfx3d-volley.js, skfx3d-trap.js, skfx3d-vines.js): לכל סקיל יש מתכון שתופס את הציור,
  // יוצא ממנו חלקיקים, ובסוף הכל משתחרר (גם מה שממשיך אחרי שהסקיל נגמר: חצים נעוצים, גבישי קרח, שורשים)
  // מספרים אקראיים משלה: הבדיקה לא מזיזה את הרצף של הבוט, וכך שאר הריצה זהה לריצה בלעדיה (אותו seed = אותו משחק)
  const vfxh=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={ok:[],bad:[]},rnd=Math.random;let sd=97;Math.random=()=>(sd=sd*16807%2147483647)/2147483647;
    try{if(SKR)skrEnd(false);SAVE.hero.level=99;SAVE.hero.skSeen=wsbIds().slice();enterWorld('home');enemies=[];
      const run=t=>{for(let i=0;i<t*60;i++){P.hp=P.maxHp;worldUpdate(1/60);VFX3D.step(1/60)}};
      run(0.05);r.d3=VFX3D.on();
      if(r.d3)for(const id of ['volley','trap','vines']){   // בדו-ממד אין מתכונים: הציור הישן, ואין מה לבדוק כאן
        try{for(const x of enemies)x.dead=true;enemies=[];SAVE.hero.skLoad=[id,null];run(0.05);if(SKR)skrEnd(false);
          const e=addEnemy('grunt',P.x+70,P.y);e.home=0;e.mult={};e.hp=e.max=1e9;e.speed=0;e.dmg=0;
          const i=S.sk.ids.indexOf(id);if(i<0){r.bad.push(id+':לא על כפתור');continue}S.sk.cd[i]=0;
          if(!wskUse(id)){r.bad.push(id+':לא ירה');continue}
          if(SKR)skrEnd(false);run(0.25);
          const own=!!S.wsb&&S.wsb.fx.some(o=>o.id===id&&SKFX3D.owns(o)),fx=SKFX3D.n()>0,p=VFX3D.parts()>0;
          run((WSKBOOK.list[id].t||0.5)+0.6);for(const x of enemies)x.dead=true;enemies=[];run(6);
          const end=VFX3D.n()===0&&SKFX3D.n()===0;
          if(own&&fx&&p&&end)r.ok.push(id);
          else r.bad.push(id+':'+[own?'':'הציור הישן לא מדלג',fx?'':'אין מתכון',p?'':'אין חלקיקים',end?'':'לא השתחרר'].filter(Boolean).join('+'))}
        catch(err){r.bad.push(id+':'+String(err))}}}
    catch(err){r.err=String(err&&err.stack||err)}
    if(SKR)skrEnd(false);worldUi(false);SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}Math.random=rnd;return r});
  // אפקטים בתלת-ממד לסקילי הלוחם (skfx3d-charge/whirl/shield.js): לכל סקיל יש מתכון שמצייר אותו, חלקיקים בזמן הסקיל, והכל משתחרר בסוף
  const vfxw=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={ok:[],bad:[]};
    try{if(SKR)skrEnd(false);SAVE.hero.level=99;SAVE.hero.skSeen=wsbIds().slice();enterWorld('home');enemies=[];
      const run=t=>{for(let i=0;i<t*60;i++){P.hp=P.maxHp;worldUpdate(1/60);VFX3D.step(1/60)}};
      r.d3=VFX3D.on();
      for(const id of ['charge','whirl','shield']){
        try{SAVE.hero.skLoad=[id,null];for(const x of enemies)x.dead=true;enemies=[];run(0.05);if(SKR)skrEnd(false);
          const e=addEnemy('grunt',P.x+40,P.y);e.home=0;e.mult={};e.hp=e.max=1e9;e.speed=0;e.dmg=0;
          const i=S.sk.ids.indexOf(id);if(i<0){r.bad.push(id+':לא על כפתור');continue}S.sk.cd[i]=0;
          if(!wskUse(id)){r.bad.push(id+':לא הוטל');continue}
          if(SKR)skrEnd(false);run(0.1);
          const own=!!S.wsb&&S.wsb.fx.some(o=>o.id===id&&SKFX3D.owns(o)),p=VFX3D.parts();
          run((WSKBOOK.list[id].t||WSKBOOK.list[id].inv||0.3)+0.4);
          for(const x of enemies)x.dead=true;enemies=[];run(6);
          const free=VFX3D.n()===0&&SKFX3D.n()===0;
          if(!r.d3)r.ok.push(id);
          else if(own&&p>0&&free)r.ok.push(id+' '+p);
          else r.bad.push(id+(own?'':':בלי מתכון')+(p>0?'':':בלי חלקיקים')+(free?'':':לא השתחרר'))}
        catch(err){r.bad.push(id+':'+String(err))}}
      for(const x of enemies)x.dead=true;enemies=[]}catch(err){r.err=String(err&&err.stack||err)}
    if(SKR)skrEnd(false);worldUi(false);SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}return r});
  // הסבב השני בספר (wskx.js): קללת הגרניט מאבנת ואז מכה פיזית מנפצת לנזק כפול (והבוס רק מואט), שרשרת הברק קופצת בין 3,
  // ובאויבים רטובים רחוק יותר ועוד קפיצה, והמערבולת שואבת ומרטיבה. בתלת-ממד: לכל אחד מתכון, חלקיקים, גם באיכות נמוכה, והכל משתחרר
  const wskx=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={bad:[],d3:[]},rnd=Math.random;let sd=31;Math.random=()=>(sd=sd*16807%2147483647)/2147483647;
    try{if(SKR)skrEnd(false);SAVE.hero.level=99;SAVE.hero.skSeen=wsbIds().slice();enterWorld('home');enemies=[];
      const run=t=>{for(let i=0;i<t*60;i++){P.hp=P.maxHp;worldUpdate(1/60);VFX3D.step(1/60)}};
      const mk=(dx,dy,boss)=>{const e=addEnemy('grunt',P.x+dx,P.y+dy);e.home=0;e.mult={};e.hp=e.max=1e9;e.speed=boss?60:0;e.dmg=0;if(boss)e.isBoss=true;return e};
      const clear=()=>{for(const x of enemies)x.dead=true;enemies=[];run(0.05)};
      const cast=id=>{SAVE.hero.skLoad=[id,null];run(0.05);if(SKR)skrEnd(false);const i=S.sk.ids.indexOf(id);if(i<0)return false;S.sk.cd[i]=0;const ok=wskUse(id);if(SKR)skrEnd(false);return ok};
      run(0.05);const d3=VFX3D.on();
      // קללת הגרניט
      clear();let a=mk(60,0),b=mk(-60,0,true);
      r.pCast=cast('petrify');run(0.1);r.stone=a.stone>0&&!(b.stone>0);r.bossSlow=b.slow>0;
      const ax=a.x;a.speed=120;run(0.3);r.still=Math.abs(a.x-ax)<4;r.moved=Math.round(a.x-ax);
      r.pOwn=d3?S.wsb.fx.some(o=>o.id==='petrify'&&SKFX3D.owns(o))&&VFX3D.parts()>0:true;
      const rr=Math.random;Math.random=()=>0.99;   // בלי מכה קריטית
      const c0=wcStat.crush||0,h0=a.max-a.hp;damage(a,100,'skill',0,'physical');const h1=a.max-a.hp-h0;damage(a,100,'skill',0,'physical');const h2=a.max-a.hp-h0-h1;Math.random=rr;
      r.crush=(wcStat.crush||0)>c0&&!(a.stone>0)&&h1>=h2*1.9;r.crushDmg=Math.round(h1)+'/'+Math.round(h2);
      // שרשרת ברק: חמישה יבשים צפופים: 3 קפיצות. חמישה רטובים: 4. ושניים במרחק 230 (מעבר לקפיצה רגילה): יבשים פעם אחת, רטובים פעמיים
      const pack=wt=>[[50,0],[80,30],[80,-30],[110,0],[60,50]].map(([x,y])=>{const e=mk(x,y);if(wt)e.wet=9;return e});
      const hops=(wt,make)=>{clear();const L=make(wt),h=wskxStat.hops;r.cCast=cast('chain')&&r.cCast!==false;run(1);return [wskxStat.hops-h,L.filter(e=>e.hp<e.max).length]};
      const s0=SKFX3D.stat.start;[r.dryHops,r.dryHit]=hops(false,pack);r.cOwn=d3?SKFX3D.stat.start>s0:true;
      const w0=wskxStat.wetHops;[r.wetHops]=hops(true,pack);r.wetPlus=wskxStat.wetHops>w0;
      const far=wt=>[mk(60,0),mk(60,0)].map((e,i)=>{if(i){e.x=P.x-220;e.y=P.y}else e.x=P.x+60;if(wt)e.wet=9;return e});
      const fd=hops(false,far)[0],fw=hops(true,far)[0];r.far=fd===1&&fw===2;r.farN=fd+'/'+fw;
      // מערבולת
      clear();const v=[mk(60,0),mk(0,70),mk(-50,-40)];
      r.vCast=cast('vortex');run(0.2);const o=S.wsb.fx.find(x=>x.id==='vortex');
      r.vOwn=d3?!!o&&SKFX3D.owns(o)&&VFX3D.parts()>=0:true;
      if(o){const dd0=v.map(e=>Math.hypot(e.x-o.x,e.y-o.y));run(1.2);const dd1=v.map(e=>Math.hypot(e.x-o.x,e.y-o.y));
        r.pull=dd1.every((d,i)=>d<dd0[i]||d<20);r.wet=v.every(e=>e.wet>0)}
      run(3);clear();run(6);r.end=!S.wsb.fx.length&&(!d3||(VFX3D.n()===0&&SKFX3D.n()===0));
      // איכות נמוכה: אותם סקילים בלי שגיאה ובלי אור, ופחות חלקיקים
      if(d3){const q=SAVE.vfxQ;SAVE.vfxQ='lo';for(const id of ['petrify','chain','vortex']){clear();mk(60,0);mk(200,0);const ok=cast(id);run(0.4);r.d3.push(id+':'+VFX3D.parts());if(!ok)r.bad.push(id+':לא הוטל באיכות נמוכה')}
        clear();run(6);r.loEnd=VFX3D.n()===0&&SKFX3D.n()===0;SAVE.vfxQ=q}else r.loEnd=true;
      r.is3d=d3}catch(err){r.err=String(err&&err.stack||err)}
    if(SKR)skrEnd(false);worldUi(false);SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}Math.random=rnd;return r});
  /* אפקטים בתלת-ממד לסקילי הקוסם ולפיוחו (skfx3d-spirit.js, skfx3d-storm.js, petfx3d.js):
     רוח מים יורה ומתיז, ענן הסערה מוריד ברקים, האש של פיוחו יוצאת מהזנב ומהפה בנשיכה, והתנועה שלה חלקה (בלי עצירות פתאום) */
  const vfx2=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={};
    try{if(SKR)skrEnd(false);SAVE.hero.level=99;SAVE.hero.skSeen=wsbIds().slice();SAVE.hero.skLoad=['spirit','storm'];enterWorld('home');enemies=[];
      const run=t=>{for(let i=0;i<t*60;i++){P.hp=P.maxHp;worldUpdate(1/60);petUpdate(1/60);drawPet();VFX3D.step(1/60)}};
      /* תנועה חלקה (ניר, 3.11.2026: "התנועה של פיוחו לא חלקה"): מזיזים את השחקן על מסלול קבוע (ישר, פנייה, עצירה, עיגול, זיגזג),
         ומודדים כמה המהירות שלה קופצת בין פריימים, כמה פעמים היא נעצרת פתאום באמצע ריצה, וכמה פעמים האנימציה מתחלפת */
      r.move=(()=>{const sm=[];let t=0,SP=185;P.x=0;P.y=0;P.face=0;S.pet=null;petUpdate(1/60);
        for(const [k,sec] of [['r',1.2],['u',1.2],['s',0.6],['c',2],['z',1.2]])for(let i=0;i<sec*60;i++){let vx=0,vy=0;
          if(k==='r')vx=SP;else if(k==='u')vy=-SP;else if(k==='c'){const a=t*1.4;vx=Math.cos(a)*SP;vy=Math.sin(a)*SP}else if(k==='z')vx=(Math.floor(t*4)%2?1:-1)*SP;
          P.x+=vx/60;P.y+=vy/60;P.moving=!!(vx||vy);P.speed=SP;if(P.moving)P.face=Math.atan2(vy,vx);
          if(S.wd)S.wd.scentT=999;if(S.pet)S.pet.digT=999;petUpdate(1/60);t+=1/60;sm.push([S.pet.x,S.pet.y,!!S.pet.run])}
        let jerk=0,stops=0,flips=0,n=0,pv=null;
        for(let i=1;i<sm.length;i++){const vx=(sm[i][0]-sm[i-1][0])*60,vy=(sm[i][1]-sm[i-1][1])*60;
          if(pv){jerk+=Math.hypot(vx-pv[0],vy-pv[1]);n++;if(Math.hypot(pv[0],pv[1])>40&&Math.hypot(vx,vy)<6)stops++}
          pv=[vx,vy];if(sm[i][2]!==sm[i-1][2])flips++}
        return {jerk:Math.round(jerk/Math.max(1,n)),stops,flips}})();
      run(0.05);if(SKR)skrEnd(false);r.d3=VFX3D.on();
      const e=addEnemy('grunt',P.x+90,P.y);e.home=0;e.mult={};e.hp=e.max=1e9;e.speed=0;e.dmg=0;
      // רוח מים: מתכון פעיל (הציור הדו-ממדי מדלג), קליעים שיוצאים ומתיזים, ובסוף הכל משתחרר
      SPR3D.stat.shots=SPR3D.stat.splash=0;
      let i=S.sk.ids.indexOf('spirit');if(i>=0)S.sk.cd[i]=0;r.castS=wskUse('spirit');if(SKR)skrEnd(false);
      run(0.4);r.sOwn=(S.wsb.fx||[]).some(o=>o.id==='spirit'&&SKFX3D.owns(o));r.sPart=VFX3D.parts();
      run(2.2);r.sShot=SPR3D.stat.shots;r.sSplash=SPR3D.stat.splash;
      run(6);r.sEnd=!(S.wsb.fx||[]).some(o=>o.id==='spirit');
      // ענן סערה: ברקים שיורדים על האויב
      const near=()=>{e.x=P.x+90;e.y=P.y;e.kx=e.ky=0};near();   // רוח המים דוחפת אותו, ואז הוא יוצא מטווח ההתקפה (260) והסערה לא מכה אף אחד
      STM3D.stat.strikes=STM3D.stat.bolts=0;
      i=S.sk.ids.indexOf('storm');if(i>=0)S.sk.cd[i]=0;r.castT=wskUse('storm');if(SKR)skrEnd(false);
      run(0.4);r.tOwn=(S.wsb.fx||[]).some(o=>o.id==='storm'&&SKFX3D.owns(o));r.tPart=VFX3D.parts();
      run(1.6);r.tStrike=STM3D.stat.strikes;r.tBolt=STM3D.stat.bolts;
      run(4);r.tEnd=!(S.wsb.fx||[]).some(o=>o.id==='storm');
      // שלוליות של רונות (skfx3d-pools.js): לבה ומים מקבלים משטח, ובסוף המשטח משתחרר ונשאר סימן על הקרקע
      POOL3D.stat.start=POOL3D.stat.end=POOL3D.stat.after=0;
      for(const [dt,dx] of [['fire',70],['water',-70]])wrFx().push({k:'pool',id:'meteor',x:P.x+dx,y:P.y+40,r:80,t:0,wait:0,dur:1.2,tick:0.4,ti:0,dt,base:1,col:dtCol(dt)});
      run(0.5);r.lOn=POOL3D.stat.start;r.lMesh=POOL3D.n();r.lOwn=POOL3D.owns();
      run(1.2);r.lEnd=POOL3D.stat.end;r.lAfter=POOL3D.stat.after;r.lFree=POOL3D.n()===0;
      // האש של פיוחו בשלב 3: להבה מהזנב, ושלהבת בנשיכה
      SAVE.pet.xp=petKind().stages[2].xp;SAVE.pet.stage=2;PETFX3D.stat.flame=PETFX3D.stat.bite=0;
      const p=S.pet;if(p){p.x=P.x+40;p.y=P.y+20;p.st='follow'}
      run(0.6);r.pFlame=PETFX3D.stat.flame;r.pOn=petFx3dOn();
      near();if(p){p.st='hunt';p.foe=e;p.bites=0;p.biteT=0;p.t=0}
      run(1.2);r.pBite=PETFX3D.stat.bite;
      for(const x of enemies)x.dead=true;enemies=[];
    }catch(err){r.err=String(err&&err.stack||err)}
    if(SKR)skrEnd(false);worldUi(false);SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}return r});
  // סקיל חתימה (sigskill.js): לכל דרגה סקיל משלה. בלי דרגה אין כפתור, עם דרגה הכפתור בעולם, רגע גילוי, והטלה שפוגעת. בזירה אין כפתור
  const sig=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={ok:[],bad:[],n:Object.keys(RANKS.list).length};
    try{if(SKR)skrEnd(false);SAVE.hero.skSeen=wsbIds().slice();SAVE.hero.rankId=null;enterWorld('home');enemies=[];
      const run=t=>{for(let i=0;i<t*60;i++){P.hp=P.maxHp;worldUpdate(1/60)}};
      const mk=(dx,dy)=>{const e=addEnemy('grunt',P.x+dx,P.y+dy);e.home=0;e.mult={};e.hp=e.max=1e9;e.speed=0;e.dmg=0;return e};
      run(0.05);r.noRank=$('sig').hidden&&!sigUse();r.all=Object.values(RANKS.list).every(R=>SIGSKILL.list[R.skill]);
      SAVE.hero.rankId='knight';SAVE.hero.skSeen=wsbIds().slice();S.skrT=0;run(SKREVEAL.delay+0.1);
      r.reveal=!!SKR&&SKR.id===sigId()&&SAVE.hero.skSeen.includes(sigId());if(SKR)skrEnd(true);
      r.btn=!$('sig').hidden&&getComputedStyle($('sig')).display!=='none'&&$('sig').dataset.sk===sigId();
      for(const rk in RANKS.list){
        try{SAVE.hero.rankId=rk;const id=sigId();SAVE.hero.skSeen.push(id);for(const x of enemies)x.dead=true;enemies=[];sigCd=0;run(0.05);
          const e=mk(90,0),h0=sigStat.hits;if(!sigUse()){r.bad.push(id+':לא הוטל');continue}
          const cdOn=sigCd>0&&!sigUse();run(2.2);
          const hit=sigStat.hits>h0&&e.hp<e.max;(hit&&cdOn?r.ok:r.bad).push(id+(hit?'':':לא פגע')+(cdOn?'':':בלי קירור'))}
        catch(err){r.bad.push(rk+':'+String(err))}}
      for(const x of enemies)x.dead=true;enemies=[];run(1);r.clean=!(S.sig&&S.sig.fx.length)}catch(err){r.err=String(err&&err.stack||err)}
    if(SKR)skrEnd(false);worldUi(false);SAVE=JSON.parse(bak);sigCd=0;if(vil)enterVillage();else{reset();S.mode=mode}r.arena=!S.wd&&!S.vil?getComputedStyle($('sig')).display==='none':true;return r});
  // איך מוצאים את הסקילים (skguide.js) ואימון (skpractice.js): הספר נפתח מעל חלון הדמות, נגיעה ארוכה על כפתור סקיל פותחת אותו (וקצרה לא),
  // נקודה אדומה מופיעה כשיש סקיל חדש ונעלמת כשפותחים את הספר, והכרטיס אחרי רגע הגילוי מתחיל אימון עם בובות שלא מתות ונגמר ב-✕ או בזמן
  // השעון של הדף עומד (page.clock), ולכן את זמן הנגיעה הארוכה מריצים מבחוץ, בין שלושה חלקים
  await page.evaluate(()=>{const G=window.__skg={bak:JSON.stringify(SAVE),vil:!!S.vil,mode:S.mode,r:{}},r=G.r;
    try{if(SKR)skrEnd(false);SAVE.hero.level=99;SAVE.hero.skSeen=wsbIds().slice();enterWorld('home');enemies=[];
      const run=t=>{for(let i=0;i<t*60;i++){P.hp=P.maxHp;worldUpdate(1/60)}};
      const ids=Object.keys(WSKBOOK.list).filter(id=>wsbOpen(id)&&id!==wsbWeapon());SAVE.hero.skLoad=ids.slice(0,2);run(0.05);hud();
      gearOpen('char');wsbOpenUi();const ov=$('ovBook'),q=ov.querySelector('.wsbwin').getBoundingClientRect(),top=document.elementFromPoint(q.left+q.width/2,q.top+q.height/2);
      r.top=!!top&&!!top.closest('#ovBook');wsbClose();r.gearStays=!$('ovGear').hidden;gearClose();r.play=S.mode==='play';
      const b=$('skills').querySelector('[data-sk]'),bq=b.getBoundingClientRect();
      G.pe=(t,id)=>b.dispatchEvent(new PointerEvent(t,{bubbles:true,pointerId:id,clientX:bq.left+9,clientY:bq.top+9}));
      G.pe('pointerdown',11);G.pe('pointerup',11)}catch(err){r.err=String(err&&err.stack||err)}});
  await page.clock.runFor(700);
  await page.evaluate(()=>{const G=window.__skg,r=G.r;if(r.err)return;
    try{r.shortNo=$('ovBook').hidden;for(let i=0;i<S.sk.cd.length;i++)S.sk.cd[i]=5;G.pe('pointerdown',12)}catch(err){r.err=String(err&&err.stack||err)}});
  await page.clock.runFor(700);
  const skg=await page.evaluate(async()=>{const G=window.__skg,r=G.r,ov=$('ovBook'),tick=async()=>{for(let i=0;i<4;i++)await Promise.resolve()};
    try{if(r.err)throw r.err;
      const run=t=>{for(let i=0;i<t*60;i++){P.hp=P.maxHp;worldUpdate(1/60)}};
      G.pe('pointerup',12);r.hold=!ov.hidden&&S.mode==='gear'&&!wskAim&&skgStat.holds>0;wsbClose();r.holdBack=S.mode==='play';
      SAVE.hero.skKnown=[];skgDots();await tick();r.dotOn=!$('skDot').hidden&&$('skills').classList.contains('sknew')&&!document.querySelector('#qRail [data-tab="gearBtn"] .qrdot').hidden;   // הנקודה על "דמות" בטור הקיצורים (menu.js)
      wsbOpenUi();await tick();r.dotOff=$('skDot').hidden&&!$('skills').classList.contains('sknew');wsbClose();
      const id=S.sk.ids[S.sk.ids.length-1];G.ovs=skgWins().filter(o=>o.classList.contains('ov'));for(const o of G.ovs)o.hidden=true;   // מסכים שנשארו פתוחים מהמשחק של הבוט (למשל ovHero): הכרטיס מחכה להם בצדק. מחזירים בסוף
      if(skgBlocked())throw 'הכרטיס חסום: '+[document.body.className,...skgWins().map(o=>o.id||o.className)].join(' | ');skgOffer(id);const of=$('skOffer');r.offer=!!of&&!of.hidden&&!!of.querySelector('[data-skg="book"]');
      of.querySelector('[data-skg="try"]').click();r.pStart=!!SKP&&SKP.dummies.length===SKPRACTICE.n&&of.hidden;
      const d=SKP&&SKP.dummies[0],x0=d&&d.x;run(2);r.pDummy=!!d&&!d.dead&&d.x===x0&&enemies.filter(e=>e.dummy&&!e.dead).length===SKPRACTICE.n&&!$('skpBar').hidden;
      $('skpBar').querySelector('[data-skp="x"]').click();run(0.05);r.pSkip=!SKP&&!enemies.some(e=>e.dummy)&&$('skpBar').hidden;
      skpStart(id);run(SKPRACTICE.t+0.5);r.pEnd=!SKP&&!enemies.some(e=>e.dummy);
      skgOffer(id);$('skOffer').querySelector('[data-skg="book"]').click();r.offerBook=!ov.hidden;wsbClose();
      // חלון פתוח: הכרטיס מחכה ולא יושב על הכותרת שלו. נפתח מעל כרטיס שכבר מוצג: מתחבא. נסגר: חוזר
      questLogOpen(true);skgOffer(id);r.offerWait=$('skOffer').hidden;questLogOpen(false);skgOfferTick();r.offerBack=!$('skOffer').hidden;
      questLogOpen(true);skgOfferTick();r.offerHide=$('skOffer').hidden;questLogOpen(false);skgOfferTick();r.offerBack=r.offerBack&&!$('skOffer').hidden;skgOfferClose()}catch(err){r.err=String(err&&err.stack||err)}
    if(ov)ov.hidden=true;skgOfferClose();for(const o of G.ovs||[])o.hidden=false;if(SKP)skpEnd(true);if(S.mode==='gear')S.mode='play';if(SKR)skrEnd(false);worldUi(false);SAVE=JSON.parse(G.bak);
    if(G.vil)enterVillage();else{reset();S.mode=G.mode}delete window.__skg;return r});
  // שילובים בעולם (wcombo.js): לכל דמות שני סקילים מהספר בסדר הנכון יוצרים שילוב. לוחם: שריון קרח ואז הסתערות = ניפוץ.
  // צייד: שורשים ואז גשם חצים = ננעץ. קוסם: רוח מים ואז מטאור = אדים, וענן סערה על רטוב = חשמול. אחר כך הכל חוזר
  const wcb=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={ok:{},bad:[]};
    try{if(SKR)skrEnd(false);SAVE.hero.level=99;SAVE.hero.skSeen=wsbIds().slice();enterWorld('home');enemies=[];
      const run=t=>{for(let i=0;i<t*60;i++){P.hp=P.maxHp;worldUpdate(1/60)}};
      const mk=(dx,dy)=>{const e=addEnemy('grunt',P.x+dx,P.y+dy);e.home=0;e.mult={};e.hp=e.max=1e9;e.speed=0;e.dmg=0;return e};
      const cast=id=>{const i=S.sk.ids.indexOf(id);if(i<0)return false;S.sk.cd[i]=0;return wskUse(id)};
      const tries=[['warrior','shield','charge','shatter',0.15],['hunter','vines','volley','pinned',0.1],['mage','spirit','meteor','steam',1.2],['mage','spirit','storm','shock',1.2]];
      for(const [cls,a,b,kind,wait] of tries){
        try{SAVE.hero.skLoad=[a,b];run(0.05);for(const x of enemies)x.dead=true;enemies=[];run(0.05);
          const e=mk(70,0),n0=S.sk.combos[kind]||0;
          if(!cast(a)){r.bad.push(cls+':'+a+' לא ירה');continue}run(wait);
          if(!cast(b)){r.bad.push(cls+':'+b+' לא ירה');continue}run(2.5);
          if((S.sk.combos[kind]||0)>n0)r.ok[kind]=cls;else r.bad.push(cls+':'+kind+' לא קרה')}
        catch(err){r.bad.push(cls+':'+String(err))}}
      for(const x of enemies)x.dead=true;enemies=[];run(3);r.root=!enemies.some(e=>e.root>0)}catch(err){r.err=String(err&&err.stack||err)}
    if(SKR)skrEnd(false);worldUi(false);SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}return r});
  // רונות (wrunes.js): כל אחת מ-18 הרונות עושה את שלה ופוגעת, רמה פותחת ומכניסה רונה, מסלול הרמות מראה אותה, והספר מחליף רונה. אחר כך הכל חוזר
  const wrn=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={ok:[],bad:[],n:0};
    try{if(SKR)skrEnd(false);SAVE.hero.skSeen=wsbIds().slice();SAVE.hero.level=1;SAVE.hero.skRune={};enterWorld('home');enemies=[];
      const run=t=>{for(let i=0;i<t*60;i++){P.hp=P.maxHp;worldUpdate(1/60)}};
      const mk=(dx,dy)=>{const e=addEnemy('grunt',P.x+dx,P.y+dy);e.home=0;e.mult={};e.hp=e.max=1e9;e.speed=0;e.dmg=0;return e};
      r.lock=!wrOf('charge');const lv=wrNeed('charge','trail');r.lp=lpAt(lv).some(x=>x.txt===T('wr.lp',T('sk.charge'),T('wr.charge.trail')));
      SAVE.hero.level=99;wrLevelUp(1,99);r.auto=Object.keys(WRUNES.list).every(id=>!!wrOf(id));r.lootLock=!wrOpen('charge','quake');
      for(const id in WRUNES.list)for(const k of wrKeys(id))if(wrLoot(id,k))wrGot().push(id+':'+k);   // הרונות השלישיות: כאילו כבר נמצאו
      for(const id in WRUNES.list)for(const k of wrKeys(id)){r.n++;
        try{SAVE.hero.skLoad=[id,null];SAVE.hero.skRune[id]=k;run(0.05);for(const x of enemies)x.dead=true;enemies=[];S.wr&&(S.wr.fx=[]);
          const i=S.sk.ids.indexOf(id);if(i<0){r.bad.push(id+':'+k+':לא על כפתור');continue}S.sk.cd[i]=0;
          const e=mk(80,0),e2=mk(140,30),n0=wrStat[id+':'+k]||0,h0=wsbStat.hits[id]||0;
          if(!wskUse(id)){r.bad.push(id+':'+k+':לא ירה');continue}
          run(4);const did=(wrStat[id+':'+k]||0)>n0,hit=(wsbStat.hits[id]||0)>h0;
          (did&&hit?r.ok:r.bad).push(id+':'+k+(did?'':':הרונה לא פעלה')+(hit?'':':לא פגע'))}
        catch(err){r.bad.push(id+':'+k+':'+String(err))}}
      SAVE.hero.skLoad=['charge','volley'];SAVE.hero.skRune={};run(0.05);wsbOpenUi();const ov=$('ovBook');
      r.ui=ov.querySelectorAll('.wrc').length===6;const c=ov.querySelector('[data-wrune="volley:fire"]');if(c)c.click();
      r.pick=SAVE.hero.skRune.volley==='fire'&&!!ov.querySelector('.wrc.on');const c2=ov.querySelector('[data-wrune="volley:fire"]');if(c2)c2.click();r.unpick=!SAVE.hero.skRune.volley;
      ov.querySelector('[data-wsb="x"]').click();
      for(const x of enemies)x.dead=true;enemies=[];run(6);r.clean=!(S.wr&&S.wr.fx.length)&&!(S.wsb&&S.wsb.fx.length)}catch(err){r.err=String(err&&err.stack||err)}
    const o=$('ovBook');if(o)o.hidden=true;if(SKR)skrEnd(false);worldUi(false);SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}return r});
  // שדרוג סקילים אצל הכוהנת (wsklvl.js): שמירה ישנה בלי sklv עובדת, הלשונית אצל הכוהנת משדרגת ולוקחת מחיר, +5 נותן יותר נזק ופחות טעינה,
  // כל סקיל בספר (גם חדש) משתדרג, ו-+N מופיע על הכפתור ובספר. אחר כך הכל חוזר
  const wsl=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={};
    try{if(SKR)skrEnd(false);delete SAVE.sklv;SAVE.hero.skSeen=wsbIds().slice();SAVE.hero.level=99;SAVE.hero.skRune={};
      r.old=wslLv('meteor')===0&&wslK('meteor')===1;
      enterVillage();for(const k of ['coins','bone','essence','dust','hide','plate','rubyC','ruby','gem'])bagAdd(k,5000);const c0=SAVE.bag.coins;
      npcTalk(WSKLVL.npc);S.vil.dlgTab='sklv';npcDialog();const dlg=$('npcDlg');r.tab=!!dlg.querySelector('[data-tab="sklv"]');
      r.rows=dlg.querySelectorAll('.wslr').length;const b=dlg.querySelector('[data-act="sklv"][data-id="meteor"]');if(b)b.click();
      r.up=wslLv('meteor')===1&&c0-SAVE.bag.coins===WSKLVL.coins[0]&&wslStat.ups>0;npcTalk(null);
      r.all=Object.keys(WSKBOOK.list).every(id=>{const D=WSKBOOK.list[id];SAVE.sklv[id]=3;const ok=wslK(id)>1&&D.cd<D.cd0;SAVE.sklv[id]=0;return ok});
      enterWorld('home');enemies=[];const run=t=>{for(let i=0;i<t*60;i++){P.hp=P.maxHp;worldUpdate(1/60)}};
      SAVE.hero.skLoad=['meteor',null];run(0.05);const i=S.sk.ids.indexOf('meteor'),cast=()=>{S.sk.cd[i]=0;S.wsb&&(S.wsb.fx=[]);wskUse('meteor');const o=S.wsb.fx.find(o=>o.id==='meteor');return o?o.base:0};
      if(i>=0){SAVE.sklv.meteor=0;const b0=cast();SAVE.sklv.meteor=5;const b5=cast();r.dmg=b0>0?Math.round(b5/b0*100)/100:0;
        r.cd=Math.abs(S.sk.cd[i]-WSKBOOK.list.meteor.cd0*WSKLVL.cd[5]*dmCdK('meteor'))<0.05;skillsHud();wslBadges();const sb=document.querySelector('#skills .skb[data-sk="meteor"] .wslb');r.btn=sb?sb.textContent:'';
        wsbOpenUi();wslBadges();const kb=document.querySelector('#ovBook .wsbc[data-wsbid="meteor"] .wslb');r.book=kb?kb.textContent:'';wsbClose()}
      for(const x of enemies)x.dead=true;enemies=[];run(2)}catch(err){r.err=String(err&&err.stack||err)}
    if(SKR)skrEnd(false);worldUi(false);if(!vil)villageUi(false);SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}return r});
  // שלב 3 בסקילים (wcombo.js): בוער שמת מדליק את השכן (התפשטות), סקיל של הצייד מסמן טרף והריגה של מסומן מקצרת קירור,
  // והסטט "נזק שילובים" מגיע מכוח על ציוד ומהעץ. אחר כך הכל חוזר
  const wst=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={};
    try{if(SKR)skrEnd(false);SAVE.hero.skSeen=wsbIds().slice();SAVE.hero.level=99;SAVE.hero.skRune={};enterWorld('home');enemies=[];
      const run=t=>{for(let i=0;i<t*60;i++){P.hp=P.maxHp;worldUpdate(1/60)}};
      const mk=(dx,dy,hp)=>{const e=addEnemy('grunt',P.x+dx,P.y+dy);e.home=0;e.mult={};e.hp=e.max=hp||1e9;e.speed=0;e.dmg=0;return e};
      const a=mk(80,0,50),b=mk(130,0),f0=S.sk.combos.wildfire||0;a.burn={dps:20,t:2,tick:0.5,acc:0};damage(a,1e6,'skill',0,'physical');
      r.fire=TF('spread')||(a.dead&&!!b.burn&&(S.sk.combos.wildfire||0)>f0);
      for(const x of enemies)x.dead=true;enemies=[];
      SAVE.hero.skLoad=['volley',null];run(0.05);const i=S.sk.ids.indexOf('volley'),c=mk(80,0),m0=S.sk.combos.mark||0;
      if(i>=0){S.sk.cd[i]=0;wskUse('volley');run(1);r.mark=c.wmark>0&&(S.sk.combos.mark||0)>m0;
        const h0=c.hp;damage(c,100,'skill',0,'physical');r.bonus=h0-c.hp>100;   // מסומן חוטף יותר
        S.sk.cd[0]=5;c.hp=1;damage(c,10,'skill',0,'physical');r.cd=c.dead&&S.sk.cd[0]<=4.01}
      const c0=P.combo||0,k0=wcK();gApply(powGive('surge'),1);r.stat=P.combo-c0===POWERS.list.surge.give.combo&&wcK()>k0;gApply(powGive('surge'),-1);
      r.tree=['w3','h3','m3'].every(id=>Object.values(TREE.branches).some(B=>B.steps.some(st=>st.id===id&&st.give.combo>0)));
      for(const x of enemies)x.dead=true;enemies=[];run(1)}catch(err){r.err=String(err&&err.stack||err)}
    if(SKR)skrEnd(false);worldUi(false);SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}return r});
  // שלב 4 בסקילים: מגן יסודות (affix.js + wcombo.js) חוטף רבע נזק עד שילוב, שילוב שובר אותו, והשבירה הראשונה נותנת רונה שלישית (wrunes.js)
  const wsh=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={};
    try{if(SKR)skrEnd(false);SAVE.hero.skSeen=wsbIds().slice();SAVE.hero.level=99;SAVE.hero.skRuneGot=[];enterWorld('home');enemies=[];
      const mk=()=>{const e=addEnemy('grunt',P.x+80,P.y);e.home=0;e.mult={};e.hp=e.max=1e7;e.speed=0;e.dmg=0;return e};
      const c=mk(),e=mk();affixSet(e,'shell');const cr=HITFX.crit,pc=P.crit,tf=P.tfx;HITFX.crit=-9;P.crit=0;P.tfx={};P.markE=null;   // בלי מכות קריטיות ובלי צמתים מהעץ (מכה ראשונה, סימון, סערה), כדי שההשוואה תהיה מדויקת
      const hit=(x,t)=>{const h=x.hp;damage(x,1000,'skill',0,t);return h-x.hp};
      const dc=hit(c,'physical'),d0=hit(e,'physical');r.weak=d0>0&&Math.abs(d0/dc-WCOMBO.shell.k)<0.02;   // המגן: רבע ממכה רגילה
      e.wet=3;const b0=wcStat.shellBreak||0;hit(e,'fire');r.broke=e.shellOff===1&&(wcStat.shellBreak||0)>b0;
      const d1=hit(e,'physical');r.full=Math.abs(d1/dc-1)<0.02;HITFX.crit=cr;P.crit=pc;P.tfx=tf;c.dead=true;
      r.rune=wrGot().length===1&&wrOpen(...wrGot()[0].split(':'));
      e.dead=true;enemies=[]}catch(err){r.err=String(err&&err.stack||err)}
    worldUi(false);SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}return r});
  // פיד הודעות (feed.js): בעולם שלל שנאסף נכנס לפיד בצד ולא על הדמות, אותו משאב מתאחד, ציוד בצבע הדרגה, עד 3 שורות, נעלם אחרי FEED.life, ובזירה לא פועל
  const feed=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={};
    try{enterWorld('home');enemies=[];FL.length=0;const f0=floats.length,st=FEED.stat,d0=st.drawn;
      r.on=feedOn();dropTake({r:'wood',n:3,x:P.x,y:P.y},false);dropTake({r:'wood',n:2,x:P.x,y:P.y},false);
      r.merge=FL.length===1&&FL[0].n===5;r.noFloat=floats.length===f0;
      feedGear('oakSword');feedAdd('',T('book.new'),C.gold,'book');feedRes('stone',1);r.max=FL.length===FEED.max;
      render();r.drawn=st.drawn>d0;
      const fb=feedBottom(),sk=$('skills').getBoundingClientRect();r.above=sk.height?fb<=sk.top:true;
      for(const f of FL)f.t-=FEED.life+0.1;render();r.gone=FL.length===0;
      S.wd=null;S.vil=null;r.arena=!feedOn()}catch(err){r.err=String(err&&err.stack||err)}
    worldUi(false);SAVE=JSON.parse(bak);FL.length=0;if(vil)enterVillage();else{reset();S.mode=mode}return r});
  // עמודת ההודעות (msglane.js, 7.11.2026, הסרטון של ניר): באמצע קרב בעולם, ב-844x390 וב-1386x636. שום הודעה (למעלה או בפיד בצד) לא על הגיבור,
  // הסקילים, הכפתורים, הקווסט או המפה, שום דבר לא יוצא מהמסך, ולכל היותר הודעה גדולה אחת. הגדולה מחכה לסוף הקרב, ואז מופיעה
  const lane={};
  // גם 848x388 (הסרטון של ניר) ו-924x424 (OnePlus 15 ב-DPR 3) עם שוליים בטוחים מדומים (מסך מעוגל ומצלמה, דרך CDP)
  const laneCdp=await page.context().newCDPSession(page).catch(()=>null);
  for(const vp of [{width:844,height:390},{width:1386,height:636},{width:848,height:388},{width:924,height:424,safe:{left:40,right:40,top:0,bottom:16}}]){
    if(laneCdp)await laneCdp.send('Emulation.setSafeAreaInsetsOverride',{insets:vp.safe||{left:0,right:0,top:0,bottom:0}}).catch(()=>{});
    await page.setViewportSize({width:vp.width,height:vp.height});
    // הגדלים שנוספו (848, 924) והבדיקה של 🥕 והשמות רצים על מחולל אקראי משלהם, כדי לא להזיז את הרצף של שאר הבדיקות (משחקי השאול תלויים בו)
    const ownRnd=on=>page.evaluate(on=>{if(on){window.__rndMain=Math.random;let a=4242;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}else if(window.__rndMain){Math.random=__rndMain;window.__rndMain=null}},on);
    const extra=vp.width===848||vp.width===924;if(extra)await ownRnd(true);
    await page.evaluate(()=>{window.__lbak={s:JSON.stringify(SAVE),vil:!!S.vil,mode:S.mode,sk:S.sk&&JSON.stringify(S.sk.ids)};
      window.__lmeas=()=>{const vw=innerWidth,vh=innerHeight,R=e=>e.getBoundingClientRect(),hit=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1;
        const vis=e=>!e.hidden&&!e.closest('[hidden]')&&e.offsetHeight>0&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden';
        const ln=$('msgLane'),lr=ln?R(ln):null;
        // שורה שנחתכה בתוך העמודה (overflow) לא נראית: נמדד רק החלק שבתוך העמודה
        const rows=[...document.querySelectorAll('#msgLane>*')].filter(vis).map(e=>{const r=R(e);return {left:r.left,right:r.right,top:Math.max(r.top,lr.top),bottom:Math.min(r.bottom,lr.bottom)}}).filter(r=>r.bottom-r.top>2)
          .concat([...document.querySelectorAll('#feedCol .frow')].filter(vis).map(R));
        const keep=[...document.querySelectorAll('#skills>*,#ult,#sig,#nav>*,#qTrack,#miniMap,#menuBtn,#whud>*,#who')].filter(vis).map(R),h=msgHero();
        return {n:rows.length,big:[...document.querySelectorAll('#msgLane .mrow.big')].filter(vis).length,hero:rows.some(r=>hit(r,h)),ui:rows.some(r=>keep.some(k=>hit(r,k))),
          out:rows.some(r=>r.left<-1||r.top<-1||r.right>vw+1||r.bottom>vh+1),d:ln?[ln.style.top,ln.style.maxHeight,Math.round(h.top),ln.style.visibility||'-',ln.querySelectorAll('.cut').length,ln.children.length,Math.round(h.left)+'..'+Math.round(h.right),MSG.where||'-'].join('/'):'-',feed:document.querySelectorAll('#feedCol .frow').length,sk:document.querySelectorAll('#skills>*').length,keep:keep.length}};
      enterWorld('home');S.mode='play';enemies=[];FL.length=0;msgClear();__lbak.ov=[...document.querySelectorAll('.ov,.win')].filter(o=>!o.hidden);for(const o of __lbak.ov)o.hidden=true;   // חלון פתוח מסתיר את העמודה (msgWinOpen), אז בבדיקה כמו במשחק: בלי חלון
      for(const k in MSG.stat)MSG.stat[k]=0;
      if(S.sk&&S.sk.ids.length<3){S.sk.ids=Object.keys(SKILLS.list).slice(0,3);S.sk.cd=S.sk.ids.map(()=>0)}if(typeof skillsHud==='function')skillsHud();   // כל שלושת הכפתורים בקשת: השלישי יוצא מגבולות #skills (הסרטון של ניר)
      __lbak.hid={sig:$('sig').hidden,feed:$('feedBtn').hidden};$('sig').hidden=false;$('feedBtn').hidden=false;   // סקיל החתימה ו-🥕 גלויים, כמו בסרטון (ומוחזרים בסוף)
      for(let i=0;i<4;i++){const e=addEnemy('grunt',P.x+90+i*25,P.y+30);e.home=0;e.speed=0;e.dmg=0;e.hp=e.max=1e9}
      S.cam.x=P.x;S.cam.y=P.y;
      banner(T('home.earth.gift'),C.gold);banner(T('rare.rumor',T('rare.at.reeds')),C.gold);banner(T('wn.found','Nessa'),C.gold);banner(T('skr.new','Xx'),C.gold);banner(HUNT.icon+' '+T('hunt.here','Grok'),HUNT.col);if(typeof skgOffer==='function')skgOffer(Object.keys(SKILLS.list)[0]);
      msgBig(T('bossDown','Test'),C.gold);if(innerWidth===848||innerWidth===924){SAVE.lore={met:{}};flMeet('grunt');FLC.t=99}feedRes('stone',3);feedGear('oakSword');feedAdd('🎯','Spotted the Wanted · '.repeat(4),C.gold,'w');render()});
    await page.clock.runFor(700);
    const a=await page.evaluate(()=>{S.cam.x=P.x;S.cam.y=P.y;render();return {...__lmeas(),waits:MSG.stat.waits,shown:MSG.stat.big,win:msgWinOpen(),on:msgOn()}});
    await page.evaluate(()=>{for(const e of enemies)e.dead=true;enemies=[];window.__lmf=msgFight;msgFight=()=>false;msgPump()});   // הקרב נגמר (העולם יכול להוליד להקה חדשה בזמן ההמתנה, אז הקרב נקבע כאן)
    await page.clock.runFor(500);
    const b=await page.evaluate(()=>{S.cam.x=P.x;S.cam.y=P.y;render();const o={...__lmeas(),shown:MSG.stat.big,most:MSG.stat.most,win:msgWinOpen(),on:msgOn()};msgFight=__lmf;return o});
    // 🥕 "האכל" לא נוגע באף כפתור סקיל (מקום קבוע ב-style.css), ושמות האויבים (labels.js) לא על כפתור ולא אחד על השני
    if(!extra)await ownRnd(true);
    const hb=await page.evaluate(()=>{const R=e=>e.getBoundingClientRect(),hit=(a,b)=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
      $('sig').hidden=false;$('feedBtn').hidden=false;const f=R($('feedBtn')),sk=[...document.querySelectorAll('#skills>*,#sig,#ult')].filter(e=>!e.hidden&&!e.closest('[hidden]')&&e.getClientRects().length).map(R);
      const o={feed:f.width>0&&!sk.some(k=>hit(f,k))};
      enemies=[];const nm=['Dardak Terror of Ducks','Pack Leader','Armored','Elemental Shield','Bruza the Almost-Brave'];
      for(let i=0;i<5;i++){const e=addEnemy('grunt',P.x+60+i*24,P.y+10-i*8);e.home=0;e.speed=0;e.dmg=0;e.hp=e.max=1e9;if(i===0||i===4){e.pname=nm[i];e.flSeen=true}if(i===1)e.leader=true;if(i===2)e.affix='tough';if(i===3)e.affix='shell'}
      S.wd.flSay={e:enemies[0],txt:'I am Dardak Who Ate a Lantern! Fear my bark!',t:99};   // בועת דיבור על העלית: עוברת באותו סידור כמו השמות (ביקורת 7.11.2026, ממצא 4)
      const L=LABELS.stat;for(const k in L)L[k]=0;S.cam.x=P.x;S.cam.y=P.y;
      const C2=CanvasRenderingContext2D.prototype,fr=C2.fillRect,rr=C2.roundRect,boxes=[];let on=false;C2.fillRect=function(x,y,w,h){if(on&&this.fillStyle.startsWith('rgba(10, 12, 20')){const t=this.getTransform(),d=devicePixelRatio||1;boxes.push({left:(t.a*x+t.e)/d,top:(t.d*y+t.f)/d,right:(t.a*(x+w)+t.e)/d,bottom:(t.d*(y+h)+t.f)/d})}return fr.apply(this,arguments)};
      C2.roundRect=function(x,y,w,h){if(on&&String(this.fillStyle).startsWith('rgba(250, 246, 232')){const t=this.getTransform(),d=devicePixelRatio||1;boxes.push({bub:1,left:(t.a*x+t.e)/d,top:(t.d*y+t.f)/d,right:(t.a*(x+w)+t.e)/d,bottom:(t.d*(y+h)+t.f)/d})}return rr.apply(this,arguments)};
      const lf=lblFlush;lblFlush=function(){on=true;try{return lf.apply(this,arguments)}finally{on=false}};
      try{render()}finally{C2.fillRect=fr;C2.roundRect=rr;lblFlush=lf;S.wd.flSay=null}
      const hud=lblHud();o.bub=boxes.filter(b=>b.bub).length;o.n=boxes.length;o.full=L.full;o.icon=L.icon;o.over=boxes.some((a,i)=>boxes.some((b,j)=>j>i&&a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1));
      o.onHud=boxes.some(a=>hud.some(b=>hit(a,b)));
      // נדירה באמצע קרב (rares.js, fx.js): העמוד והחגיגה בחצי גודל. בלי אויבים: בגודל מלא
      celebrate(P.x,P.y,'quest','');o.fx=FX[FX.length-1].s;enemies=[];celebrate(P.x,P.y,'quest','');o.fx0=FX[FX.length-1].s;FX.length=0;return o});
    if(!extra)await ownRnd(false);
    if(CFG.shots)await shot('msg-lane-'+vp.width);
    await page.evaluate(()=>{const k=__lbak;FLC.q=[];flCardNext();msgClear();$('sig').hidden=k.hid.sig;$('feedBtn').hidden=k.hid.feed;for(const o of k.ov)o.hidden=false;FL.length=0;enemies=[];if(typeof skgOfferClose==='function')skgOfferClose();worldUi(false);SAVE=JSON.parse(k.s);if(S.sk&&k.sk)S.sk.ids=JSON.parse(k.sk);if(k.vil)enterVillage();else{reset();S.mode=k.mode}});
    if(extra)await ownRnd(false);   // רק אחרי החזרה למצב הקודם (גם היא משתמשת באקראי)
    lane[vp.width]={a,b,hb,ok:hb.feed&&hb.fx===0.5&&hb.fx0===1&&hb.full<=3&&hb.full>0&&!hb.over&&!hb.onHud&&a.n>0&&a.big===0&&a.waits>0&&!a.hero&&!a.ui&&!a.out&&a.feed>0&&b.big===1&&b.shown===1&&!b.hero&&!b.ui&&!b.out&&b.most<=3};
  }
  if(laneCdp)await laneCdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{left:0,right:0,top:0,bottom:0}}).catch(()=>{});
  // הפיד בכפר (ביקורת 7.11.2026, ממצא 2): "חדש בספר!" לא מתחת לכפתורי הצד (ספר, קווסטים, גיבור ב-#qRail), ב-848x388 וב-924x424
  const vfeed={};
  for(const [vw,vh] of [[848,388],[924,424]]){
    await page.setViewportSize({width:vw,height:vh});await page.clock.runFor(100);
    vfeed[vw]=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,R=e=>e.getBoundingClientRect(),hit=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1,r={};
      const ov=[...document.querySelectorAll('.ov,.win')].filter(o=>!o.hidden);
      try{enterVillage();S.mode='play';for(const o of document.querySelectorAll('.ov,.win'))o.hidden=true;FL.length=0;FEED._spot=null;feedAdd('',T('book.new'),C.gold,'book');render();
        const rows=[...document.querySelectorAll('#feedCol .frow')].filter(e=>e.offsetHeight>0).map(R),rail=[...document.querySelectorAll('#qRail>*')].filter(e=>!e.hidden&&e.offsetHeight>0).map(R);
        r.rows=rows.length;r.rail=rail.length;r.hit=rows.some(a=>rail.some(b=>hit(a,b)))}
      finally{FL.length=0;render();for(const o of ov)o.hidden=false;SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}}return r});
  }
  check(Object.values(vfeed).every(o=>o.rows>0&&o.rail>0&&!o.hit),'פיד בכפר מול כפתורי הצד: '+Object.entries(vfeed).map(([k,o])=>k+'px: '+(o.rows?(o.hit?'השורה מתחת לכפתור':'לא נוגע')+' ('+o.rail+' כפתורים)':'אין שורה')).join(' · '));
  await page.setViewportSize(CFG.phone);
  // רואים מה כל אור עושה (wisps.js, WACT): פגיעה של אש וכפור מסומנת על האויב, ריפוי בפיד, הסבר בפעם הראשונה, ושורת אייקונים ליד "מי אני"
  const wac=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={};
    try{SAVE.hero.level=99;SAVE.gear.orbit=['emberOrb','frostOrb','stoneOrb','leafOrb','cloverOrb'];SAVE.wispTip={};enterWorld('home');enemies=[];FL.length=0;
      const st=WACT.stat,s0={...st};worldUpdate(1/60);drawOrbits();
      r.tips=st.tips-s0.tips===5;
      const p0=S.orb.pos[0],e=addEnemy('grunt',p0.x,p0.y);e.home=0;e.mult={};e.hp=e.max=1e9;e.speed=0;e.dmg=0;
      const p1=S.orb.pos[1],e2=addEnemy('grunt',p1.x,p1.y);e2.home=0;e2.mult={};e2.hp=e2.max=1e9;e2.speed=0;e2.dmg=0;
      orbitUpdate(0);drawOrbits();r.fire=st.fire>s0.fire;r.ring=st.ring>s0.ring;
      P.hp=P.maxHp/2;S.t+=ORBIT.types.support.heal.every+0.1;orbitUpdate(0);drawOrbits();r.heal=st.heal>s0.heal&&FL.some(f=>f.key==='wheal');
      const draws=[];const ft=ctx.fillText;ctx.fillText=function(t){draws.push(t);return ft.apply(this,arguments)};try{drawOrbits()}finally{ctx.fillText=ft}
      r.row=!document.getElementById('who').hidden?Object.values(GEAR.orbit).every(ic=>draws.includes(ic)):true;
      e.dead=e2.dead=true;enemies=[];
      // ציד: אויב במרחק, אור האש יוצא אליו ופוגע
      const h0=WACT.stat.hunt||0,e3=addEnemy('grunt',P.x+180,P.y);e3.home=0;e3.mult={};e3.hp=e3.max=1e9;e3.speed=0;e3.dmg=0;
      for(let k=0;k<240;k++)orbitUpdate(1/60);r.hunt=(WACT.stat.hunt||0)>h0&&e3.hp<e3.max;e3.dead=true;enemies=[]}catch(err){r.err=String(err&&err.stack||err)}
    worldUi(false);SAVE=JSON.parse(bak);FL.length=0;if(vil)enterVillage();else{reset();S.mode=mode}return r});
  // כותרת אזור ופחות אפקטים (feed.js, juice.js): הכותרת רק בכניסה הראשונה לאזור, והמתג חוצה חלקיקים, מוריד את השובל ונשמר
  const fxl=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,r={};
    try{SAVE.regSeen={};const t0=FEED.stat.titles;enterWorld('home');r.first=FEED.stat.titles===t0+1&&!!FTITLE;
      // הכותרת לא מצוירת בקנבס מעל עמודת ההודעות: עוברת אליה כרגע גדול (feedTitle נקרא לפני worldUi)
      {const tt=FTITLE.txt;drawFeedTitle();r.lane=FTITLE.lane===1&&(MQ.big.some(m=>m.txt===tt)||!!(MQ.bigRow&&MQ.bigRow.txt===tt));msgClear()}FTITLE=null;
      enterWorld('home');r.once=FEED.stat.titles===t0+1;
      const btn=document.querySelector('[data-fxless="1"]');r.btn=!!btn;
      const burst=()=>{const J=juice();J.p.length=0;jBurst(P.x,P.y,'fire',12,0);return J.p.length};
      setFxLess(false);const full=burst();setFxLess(true);const less=burst();r.half=less>0&&less<full;r.saved=SAVE.fxLess===true&&btn.getAttribute('aria-pressed')==='true';
      setFxLess(false);r.off=!SAVE.fxLess}catch(err){r.err=String(err&&err.stack||err)}
    worldUi(false);SAVE=JSON.parse(bak);FTITLE=null;if(vil)enterVillage();else{reset();S.mode=mode}return r});
  // כל דמות התחלה לשתי שניות מול אויב אחד: איך היא תוקפת, מה עף, ואיזו הנפשה. אחר כך הכל חוזר כמו שהיה
  const heroes=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),mode=S.mode,out={};
    const W3={sword:'Melee_1H_Attack_Slice_Horizontal',bow:'Ranged_Bow_Release',staff:'Ranged_Magic_Shoot'};   // ההנפשה שכל נשק צריך (GRIP3D)
    for(const id in HEROES.list){
      SAVE.hero.start=id;SAVE.gear.weapon=HEROES.list[id].weapon;reset();S.mode='play';S.spawnT=S.hordeT=1e9;
      const e=addEnemy('grunt',P.x+60,P.y);e.hp=e.max=1e9;let swings=0,homed=false;const shots=new Set();
      for(let i=0;i<120;i++){const a=P.sw.anim;P.hp=P.maxHp;update(1/60);if(P.sw.anim>a)swings++;
        for(const b of pb){shots.add(b.shot);if(b.home)homed=true}}
      out[id]={wt:P.wt,swings,shots:[...shots].join('+')||'-',homed,hit:e.hp<e.max,swapHidden:document.getElementById('swap').hidden===!wBestOther(),
        anim:R3D.on?heroLook().anim[P.weapon]:null,want3d:W3[P.wt]};
    }
    // הקוסם גם בעולם הפתוח: מכה במקור משאבים ובאויב, שתיהן בקסם ולא בחצים
    SAVE.hero.start='mage';SAVE.gear.weapon=HEROES.list.mage.weapon;enterWorld('home');enemies=[];
    const n=S.nd.list[0],run=t=>{const s=new Set();for(let i=0;i<t*60;i++){P.hp=P.maxHp;worldUpdate(1/60);for(const b of pb)s.add(b.shot)}return[...s].join('+')||'-'};
    S.nd.list=[n];P.x=n.x+n.r+40;P.y=n.y;const nHp=n.hp,nShots=run(1.5);
    S.nd.list=[];const fi=Math.max(0,WORLD.foes.findIndex(G=>G.creature&&ETYPES[G.type])),ft=ETYPES[WORLD.foes[fi].type]?WORLD.foes[fi].type:'grunt',c=addEnemy(ft,P.x+110,P.y);c.home=fi;   // יצור משאב, אם כבר יש כזה
    c.hp=c.max=1e9;const cShots=run(1.5);
    out.mageWorld={ft,node:nShots,nodeHit:n.hp<nHp||n.dead,foe:cShots,foeHit:c.hp<c.max};
    worldUi(false);document.getElementById('banner').textContent='';
    SAVE=JSON.parse(bak);reset();S.mode=mode;return out});
  const T_=t=>({sword:'חרב',bow:'קשת',staff:'מטה'})[t]||t;
  // קצב העולם (pacing.js): 3 דקות של סיבוב באחו. להקות מגיעות בקצב שנקבע ב-PACE, בגודל שלו, יש שיא ושקט, לא עוברים את המגבלה גם בעומס, ולהקה שהופלה משאירה שלל (נבדק ישירות, לא תלוי במזל)
  const pace=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),mode=S.mode;let maxE=0,first=null;
    enterWorld('home');const secs=180,dt=1/30;paceHush('__pace1');paceHush('__pace2');const hush=document.getElementById('banner').textContent!=='__pace2'&&!!S.wd.later&&S.wd.later[0]==='__pace2';   // השם של האזור יכול לחכות בתור של welcome.js, אז שתיים: השנייה תמיד מחכה   // בכניסה: הודעה אחת, השנייה מחכה
    for(let t=0;t<secs;t+=dt){P.hp=P.maxHp;const a=t*0.12;joy={id:-1,ox:-999,oy:-999,dx:-Math.sin(a),dy:Math.cos(a)};
      if(S.mode!=='play')S.mode='play';worldUpdate(dt);maxE=Math.max(maxE,enemies.length);if(first==null&&S.wd.pace&&S.wd.pace.packs)first=Math.round(t)}
    // עומס: מנסים להכניס הרבה להקות ועוד 20 שניות של עולם (קבוצות שחוזרות, פיצולים, אירועים). המגבלה נשמרת תמיד
    for(let i=0;i<60;i++)paceSpawn(8);for(let t=0;t<20;t+=dt){P.hp=P.maxHp;worldUpdate(dt);maxE=Math.max(maxE,paceAlive())}
    // בונוס להקה, ישירות: להקה של 3 ליד השחקן, כולן מופלות, והבונוס ניתן פעם אחת
    enemies=[];const b0=S.wd.pace.bonus,pk=paceSpawn(3,{x:P.x+60,y:P.y}),pkN=pk?enemies.filter(e=>e.pack===pk).length:0;
    for(const e of enemies.filter(e=>e.pack===pk)){e.affix=null;kill(e)}paceUpdate(0.01);const pkBonus=S.wd.pace.bonus-b0;paceUpdate(0.01);
    const p=S.wd.pace,o={secs,packs:p.packs,first,min:Math.min(...p.sizes),max:Math.max(...p.sizes),peaks:p.peaks,rests:p.rests,bonus:p.bonus,maxE,cap:PACE.cap,
      pkN,pkBonus,pkTwice:S.wd.pace.bonus-b0,
      want:Math.floor(secs/(PACE.beats[0].every[1]+8)),firstWant:PACE.first,hush:hush&&!S.wd.later};   // לפחות להקה כל every הארוך + 8 שניות (שקט, הפסקה אחרי קרב גדול, ועומס)
    worldUi(false);document.getElementById('banner').textContent='';enemies=[];SAVE=JSON.parse(bak);reset();S.mode=mode;return o});
  check(pace.packs>=pace.want&&pace.first!=null&&pace.first<=pace.firstWant+2&&pace.min>=2&&pace.max<=8&&pace.peaks>=1&&pace.rests>=1&&pace.maxE<=pace.cap&&pace.pkN>=2&&pace.pkBonus===1&&pace.pkTwice===1&&pace.hush,
    'קצב העולם: '+pace.packs+' להקות ב-'+pace.secs+' שניות (לפחות '+pace.want+'), הראשונה אחרי '+pace.first+' שניות, '+pace.min+' עד '+pace.max+' מפלצות בלהקה, '+
    pace.peaks+' שיאים, '+pace.rests+' רגעי שקט, '+pace.bonus+' בונוסי להקה בסיבוב, להקה של '+pace.pkN+' שהופלה נתנה '+pace.pkBonus+' בונוס'+(pace.pkTwice===1?'':' (ניתן שוב!)')+', הכי הרבה אויבים יחד '+pace.maxE+' גם בעומס (מגבלה '+pace.cap+')'+(pace.hush?', בכניסה הודעה אחת':', בכניסה כמה הודעות יחד'));

  // עומס בזירה (arena-load.js): מעל המגבלה הרחוקים נעלמים, אויב רחוק ואויב-על רחוק קופצים קרוב, וכדורי XP מתאחדים בלי לאבד XP
  const crowd=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),mode=S.mode,o={};startRun();P.x=P.y=0;enemies=[];orbs=[];
    for(let i=0;i<HORDE.cap+40;i++)addEnemy('grunt',rand(-300,300),rand(-200,200)).elite=false;
    const far=addEnemy('grunt',6000,0),el=addEnemy('shield',0,-6000);far.elite=false;el.elite=true;
    for(let i=0;i<400;i++)orbs.push({x:rand(-2000,2000),y:rand(-2000,2000),v:1});
    S.aloadT=0;arenaLoad(0.01);enemies=enemies.filter(e=>!e.dead);
    const lim=ALOAD.far*Math.max(W,H),d=e=>Math.hypot(e.x-P.x,e.y-P.y);
    o.n=enemies.length;o.cap=HORDE.cap;o.far=enemies.includes(far)?Math.round(d(far)):'נעלם';o.elite=enemies.includes(el)?Math.round(d(el)):'נעלם';o.lim=Math.round(lim);
    o.orbs=orbs.length;o.xp=orbs.reduce((a,b)=>a+b.v,0);
    enemies=[];orbs=[];SAVE=JSON.parse(bak);reset();S.mode=mode;return o});
  check(crowd.n<=crowd.cap&&typeof crowd.elite==='number'&&crowd.elite<=crowd.lim&&(crowd.far==='נעלם'||crowd.far<=crowd.lim)&&crowd.orbs<=150&&crowd.xp===400,
    'עומס בזירה: '+crowd.n+' אויבים (מגבלה '+crowd.cap+'), אויב רחוק: '+crowd.far+', אויב-על רחוק קפץ ל-'+crowd.elite+' (עד '+crowd.lim+'), כדורי XP: 400→'+crowd.orbs+' ששווים '+crowd.xp+' XP');
  // מודלים לפי צורך (js/m3d.js): בכניסה לכל אזור נטענים ברקע הענק שלו ומפלצות הזירה, ובזירה המפלצות שלה. בלי אזהרת "missing model"
  if(g3.on){
    const settle=async()=>{for(let i=0;i<300;i++){if(await page.evaluate(()=>!M3D.hint.length&&!M3D.busy&&!M3D.pending()))return true;await page.waitForTimeout(20);await page.clock.runFor(50)}return false};
    const regs=await page.evaluate(()=>{let ls=null;try{ls=localStorage.getItem(SAVE_STORE.key)}catch(e){}   // כמו שאר הבדיקות: הכל חוזר בסוף, כולל השמירה בדפדפן (enterWorld שומר)
      window.__m3dBak={save:JSON.stringify(SAVE),ls,mode:S.mode,vil:S.vil,wd:S.wd,room:S.room,body:document.body.className,ov:[...document.querySelectorAll('[id^=ov]')].map(e=>[e,e.hidden])};return ['meadow',...Object.keys(WORLD.regions).filter(k=>k!=='meadow')]}),rows=[],bad=[];
    for(const reg of regs){
      await page.evaluate(r=>{enterWorld('home',r);R3D.wWarm&&(R3D.wWarm.done[r]=0);for(let i=0;i<R3D.drawEvery;i++)render3d(0,0)},reg);   // render3d: הכניסה (wldWarm) מבקשת את מה שצריך
      const ok=await settle();
      const r=await page.evaluate(r=>{const ks=[];for(const k in STORY.lanterns)if(STORY.lanterns[k].reg===r&&LOOK3D['wb_'+k])ks.push(LOOK3D['wb_'+k].model);
        const want=ks.concat(M3D.arena.map(t=>LOOK3D[t].model)),miss=want.filter(k=>!m3dReady(k));return {giant:ks.join('/')||'-',miss}},reg);
      rows.push(reg+' '+r.giant.replace(/mon_/g,''));if(!ok||r.miss.length)bad.push(reg+': '+(ok?'':'לא נגמר ')+r.miss.join(','))}
    await page.evaluate(()=>{worldUi(false);startRun();for(let i=0;i<R3D.drawEvery;i++)render3d(0,0)});const ok=await settle();
    const ar=await page.evaluate(()=>{const miss=M3D.arena.filter(t=>!m3dReady(LOOK3D[t].model)||!R3D.tmpl[LOOK3D[t].model]),B=__m3dBak;
      worldUi(false);enemies=[];SAVE=JSON.parse(B.save);reset();S.mode=B.mode;S.vil=B.vil;S.wd=B.wd;S.room=B.room;try{if(B.ls==null)localStorage.removeItem(SAVE_STORE.key);else localStorage.setItem(SAVE_STORE.key,B.ls)}catch(e){}
      document.body.className=B.body;for(const [e,h] of B.ov)e.hidden=h;return miss});
    if(!ok||ar.length)bad.push('זירה: '+ar.join(','));
    const log=await page.evaluate(()=>M3D.log.map(l=>l.ms));
    check(!bad.length&&!m3dWarn.length,'מודלים לפי צורך: בכניסה לאזור הענק שלו ('+rows.join(', ')+') ומפלצות הזירה, '+log.length+' נטענו, הארוך '+Math.max(0,...log)+'ms'+
      (bad.length?' · חסר: '+bad.join(' | '):'')+(m3dWarn.length?' · אזהרות: '+m3dWarn.slice(0,3).join(' | '):''))}
  // קפיצה כשאויב חדש מופיע בעולם (ניר, 7.11: "215.9ms" כשחלודן הטבוע הופיע): אחרי ההכנה בכניסה לאזור והתור ברקע (wldWarm ב-render3d.js),
  // כל סוג שיכול להופיע בעולם, בכל אזור, מופיע בלי טקסטורה חדשה, בלי shader חדש, וכשהקהל שלו כבר אפוי. הזמן בדוח רק למידע (בלי כרטיס גרפי)
  if(g3.on){
    const wm=await page.evaluate(()=>{const o={rows:[],bad:[],max:0},B={save:JSON.stringify(SAVE),mode:S.mode,vil:S.vil,wd:S.wd,room:S.room,de:R3D.drawEvery,gap:WWARM.gap};let ls=null;try{ls=localStorage.getItem(SAVE_STORE.key)}catch(e){}
      try{R3D.drawEvery=0;WWARM.gap=1;const I=R3D.r.info,draw=()=>render3d(0,0);
        for(const reg of ['meadow',...Object.keys(WORLD.regions)]){
          enterWorld('home',reg);S.mode='play';enemies=[];R3D.wWarm&&(R3D.wWarm.done[reg]=0);
          for(let i=0;i<400&&(i<6||R3D.wWarm.a||R3D.wWarm.q&&R3D.wWarm.q.length);i++)draw();   // ההכנה של האזור, והתור ברקע (בפעם הראשונה)
          const ks=wldTypes();let n=0,worst=[0,''];
          for(const k of ks){const p0=I.programs.length,t0=I.memory.textures,crowd=k==='wanted'||k in R3D.crowd;
            const e=addEnemy(k==='wanted'?'grunt':k,P.x+90,P.y+30,1);if(k==='wanted')e.wanted=true;e.flSeen=1;
            const pool=((R3D.pool||{})[lookKey(lookOf(e))]||[]).length>0;   // דמות מוכנה (כבר צוירה) מחכה במאגר
            const t=performance.now();draw();const ms=performance.now()-t;if(ms>worst[0])worst=[ms,k];
            const dp=I.programs.length-p0,dt=I.memory.textures-t0;if(dp||dt||!crowd||!pool)o.bad.push(reg+'/'+k+(dp?' shader+'+dp:'')+(dt?' טקסטורה+'+dt:'')+(crowd?'':' בלי קהל')+(pool?'':' לא הוכן'));
            e.dead=true;draw();enemies=[];draw();n++}
          o.max=Math.max(o.max,worst[0]);o.rows.push(reg+' '+n+' ('+Math.round(worst[0])+'ms '+worst[1]+')')}
      }catch(err){o.bad.push(String(err&&err.stack||err))}
      R3D.drawEvery=B.de;WWARM.gap=B.gap;worldUi(false);enemies=[];SAVE=JSON.parse(B.save);reset();S.mode=B.mode;S.vil=B.vil;S.wd=B.wd;S.room=B.room;
      try{if(ls==null)localStorage.removeItem(SAVE_STORE.key);else localStorage.setItem(SAVE_STORE.key,ls)}catch(e){}
      return o});
    check(!wm.bad.length,'אויב חדש בעולם בלי קפיצה: כל סוג בכל אזור כבר הוכן (דמות במאגר, קהל אפוי) ומופיע בלי טקסטורה או shader חדשים ('+wm.rows.join(', ')+')'+(wm.bad.length?' · חסר הכנה: '+wm.bad.slice(0,8).join(' | '):''))}
  // מפלצות הזירה (Quaternius, HORDE.monsters ב-spawn.js, RUN.elite.types ב-run.js): לכל אחת חומרים, שם, צבע בדו-ממד ומודל עם ריצה ומוות,
  // הן לא מופיעות לפני הזמן שלהן ומופיעות אחריו, ואויבי-העל בתחנות הם לפי התור
  const mons=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),mode=S.mode,o={bad:[],early:0,seen:{},elites:[],want:RUN.elite.types},er=window.eliteRoll,os=window.arenaOwnSpawn;window.eliteRoll=()=>{};startRun();enemies=[];window.arenaOwnSpawn=()=>false;   // spawner לבד (בזירה עצמה הגלים מביאים את האויבים)
    const all=[...new Set([...HORDE.monsters.map(m=>m.type),...RUN.elite.types])];o.n=all.length;
    for(const t of all){const d=ETYPES[t],L=LOOK3D[t],miss=[];
      if(!d||!(d.tags||[]).length)miss.push('tags');if(!MATCOL[((d&&d.tags)||[])[0]])miss.push('צבע בדו-ממד');
      for(const k of ['foe.','book.f.'])if(T(k+t)===k+t)miss.push(k+t);
      const has=k=>MODELS3D[k]||m3dLazy(k);   // מבחוץ (js/m3d.js): נטען כשצריך
      if(!L||!has(L.model)||!has('anim_'+L.model)||!L.anim||!L.anim.run||!L.anim.die)miss.push('מודל');
      else if(R3D.ready&&(!R3D.tmpl[L.model]||!R3D.clips[L.anim.run]||!R3D.clips[L.anim.die]))miss.push('אנימציה בתלת-ממד');
      if(miss.length)o.bad.push(t+': '+miss.join(', '))}
    const roll=t=>{S.t=t;const c={};for(let i=0;i<1500;i++){enemies=[];S.spawnT=0;S.hordeT=99;spawner(0);for(const e of enemies)c[e.type]=(c[e.type]||0)+1}return c};
    const first=Math.min(...HORDE.monsters.map(m=>m.from)),c0=roll(first-1);o.early=all.reduce((n,t)=>n+(c0[t]||0),0);
    o.seen=roll(RUN.bossAt-10);o.missing=HORDE.monsters.map(m=>m.type).filter(t=>!o.seen[t]);
    enemies=[];S.run.log=[];for(const t of RUN.elite.types){S.run.log.push({kind:'elite',t:0});elite();o.elites.push((enemies.find(e=>e.elite)||{}).type);enemies=[]}
    window.eliteRoll=er;window.arenaOwnSpawn=os;enemies=[];SAVE=JSON.parse(bak);reset();S.mode=mode;return o});
  check(!mons.bad.length&&!mons.early&&!mons.missing.length&&mons.elites.join()===mons.want.join(),
    'מפלצות בזירה: '+mons.n+' סוגים'+(mons.bad.length?' · חסר: '+mons.bad.join(' | '):', לכל אחת מודל, שם וצבע')+', לפני הזמן '+mons.early+
    ', בסוף הריצה '+Object.entries(mons.seen).filter(([k])=>!['grunt','shield','wisp'].includes(k)).map(([k,n])=>k+' '+n).join(', ')+(mons.missing.length?' · לא הופיעו: '+mons.missing.join(', '):'')+
    ', אויבי-על בתחנות: '+mons.elites.join(', '));
  // התחלה רכה בזירה (run.js, RUN.ease): אויב מההתחלה פוגע פחות והחסינות אחרי מכה ארוכה יותר, ואחרי ease.secs הכל רגיל. בעולם תמיד רגיל
  const ease=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),mode=S.mode,o={},er=window.eliteRoll;window.eliteRoll=()=>{};startRun();enemies=[];   // בלי אויב עלית אקראי, שפוגע חזק יותר
    S.t=0;const a=addEnemy('grunt',500,0);a.elite=false;o.d0=a.dmg/ETYPES.grunt.dmg;P.inv=0;P.hp=P.maxHp;hurt(1);o.inv0=P.inv;
    S.t=RUN.ease.secs+5;const ec=LOOT.elite.chance;LOOT.elite.chance=0;const b=addEnemy('grunt',500,0);LOOT.elite.chance=ec;o.d1=b.dmg/ETYPES.grunt.dmg;P.inv=0;hurt(1);o.inv1=P.inv;
    window.eliteRoll=er;enemies=[];SAVE=JSON.parse(bak);reset();S.mode=mode;return o});
  check(Math.abs(ease.d0-0.45)<0.01&&ease.d1===1&&ease.inv0>ease.inv1&&Math.abs(ease.inv1-0.6)<0.01,
    'התחלה רכה בזירה: נזק אויב בהתחלה x'+ease.d0.toFixed(2)+', אחרי הזמן x'+ease.d1+', חסינות אחרי מכה '+ease.inv0.toFixed(2)+'→'+ease.inv1.toFixed(2)+' שניות');
  // קושי לפי הכוח שלך (arena-scale.js): שחקן חדש ×1, שחקן חזק פי 4 בנזק ופי 3 בחיים מקבל אויבים עם פי 4 חיים ויותר נזק, ושלד בדקה 2 נופל באותו זמן בערך. בעולם תמיד ×1
  const asc=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),mode=S.mode,o={},er=window.eliteRoll;window.eliteRoll=()=>{};
    try{SAVE=saveBlank();SAVE.gearGift=true;SAVE.hero.start='warrior';SAVE.gear.weapon='oakSword';   // שחקן חדש: לוחם עם חרב עץ, בלי כלום
      
      startRun();S.mode='play';floats=[];runUpdate();const pw=arenaPower(),B=ARENA_SCALE.base;o.raw=pw.dps/B.dps;o.rawH=pw.ehp/B.ehp;o.new=S.run.sc.hp===1&&S.run.sc.dmg===1&&S.run.sc.boss===1;o.line0=floats.filter(f=>f.txt.includes('×')).length;
      S.t=120;const a=addEnemy('grunt',500,0),ttkA=a.max/pw.dps;
      const big=arenaScaleCalc({dps:B.dps*4,ehp:B.ehp*3,wdmg:B.wdmg});o.hp=big.hp;o.dmg=big.dmg;
      startRun();S.mode='play';P.sw.dmg*=4;P.maxHp*=3;P.hp=P.maxHp;floats=[];runUpdate();o.line=(floats.find(f=>f.txt.includes('×'))||{}).txt||'';o.sHp=S.run.sc.hp;o.sDmg=S.run.sc.dmg;
      S.t=120;const b=addEnemy('grunt',500,0),ttkB=b.max/arenaPower().dps;o.ttk=ttkB/ttkA;
      P.inv=0;const h=P.hp;hurt(10);o.hit=(h-P.hp)/10;
      enterWorld('home');o.world=ascHp()===1&&ascDmg()===1;worldUi(false)}catch(err){o.err=String(err&&err.stack||err)}
    window.eliteRoll=er;enemies=[];floats=[];document.getElementById('banner').textContent='';SAVE=JSON.parse(bak);reset();S.mode=mode;return o});
  check(!asc.err&&asc.new&&asc.line0===0&&Math.abs(asc.raw-1)<0.1&&Math.abs(asc.rawH-1)<0.1&&Math.abs(asc.hp-4)<0.01&&asc.dmg>1.5&&Math.abs(asc.sHp-4)<0.05&&asc.ttk>0.7&&asc.ttk<1.3&&asc.hit>1.5&&!!asc.line&&asc.world,
    'קושי לפי הכוח שלך: '+(asc.err||'שחקן חדש '+(asc.new?'×1':'משתנה!')+' (מדידה '+asc.raw.toFixed(2)+'/'+asc.rawH.toFixed(2)+'), פי 4 נזק ופי 3 חיים → חיי אויב ×'+asc.hp.toFixed(1)+', נזק ×'+asc.dmg.toFixed(2)+
      ', שלד בדקה 2 נופל ב-×'+asc.ttk.toFixed(2)+' מהזמן של חדש, מכה של 10 → '+(asc.hit*10).toFixed(1)+', שורה "'+asc.line+'"'+(asc.world?', בעולם ×1':', בעולם משתנה!')));
  // הממשק של הזירה (אוראל, 2.11): תג המכפיל ליד הרמה רק לשחקן חזק, טיפ בשתי הריצות הראשונות בלבד,
  // והכישוף והאולטימייט בפינה: מחוץ לשליש האמצעי של המסך, לא אחד על השני ולא על הסקילים
  // עם מזל משלה (Math.random מוחזר בסוף), כדי שהבדיקות שאחריה יקבלו בדיוק את אותו מזל כמו בלעדיה
  const ahud=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),mode=S.mode,o={},er=window.eliteRoll,rnd=Math.random;window.eliteRoll=()=>{};let sd=11;Math.random=()=>(sd=(sd*16807)%2147483647)/2147483647;const $b=()=>document.getElementById('ascB');
    try{SAVE=saveBlank();SAVE.gearGift=true;SAVE.hero.start='warrior';SAVE.gear.weapon='oakSword';
      try{localStorage.removeItem(ARENA_SCALE.tip.key)}catch(e){}
      const run=strong=>{startRun();S.mode='play';if(strong){P.sw.dmg*=4;P.maxHp*=3;P.hp=P.maxHp}floats=[];runUpdate();drawRunBar();
        return{tip:!!S.run.tip&&floats.some(f=>f.txt===T('arena.tip')),badge:!$b().hidden&&getComputedStyle($b()).display!=='none',txt:$b().textContent,title:$b().title}};
      const r1=run(false),r2=run(true),r3=run(true);
      o.tip1=r1.tip;o.tip3=r3.tip;o.newBadge=r1.badge;o.strong=r2.badge&&/^×\d/.test(r2.txt)&&r2.title===T('ascale.tip');o.txt=r2.txt;
      for(const id of Object.keys(SKILLS.list))skillAdd(id);skillsHud();ultHud();spellHud();
      const W=innerWidth,box=id=>document.getElementById(id).getBoundingClientRect(),sp=box('spell'),ul=box('ult');
      const mid=b=>b.width>0&&b.right>W/3&&b.left<W*2/3,ovl=(a,b)=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
      const circ=(a,b)=>Math.hypot(a.left+a.width/2-b.left-b.width/2,a.top+a.height/2-b.top-b.height/2)<(a.width+b.width)/2-1;
      o.vis=sp.width>0&&ul.width>0;o.mid=[mid(sp)?'כישוף':'',mid(ul)?'אולטימייט':''].filter(Boolean);o.ovl=ovl(sp,ul);
      o.onSk=[...document.querySelectorAll('#skills .skb')].filter(k=>circ(k.getBoundingClientRect(),sp)||circ(k.getBoundingClientRect(),ul)).length;
      o.box='כישוף '+Math.round(sp.left)+'-'+Math.round(sp.right)+', אולטימייט '+Math.round(ul.left)+'-'+Math.round(ul.right)+' (אמצע '+Math.round(W/3)+'-'+Math.round(W*2/3)+')'}catch(err){o.err=String(err&&err.stack||err)}
    window.eliteRoll=er;enemies=[];floats=[];SAVE=JSON.parse(bak);reset();Math.random=rnd;S.mode=mode;return o});
  check(!ahud.err&&ahud.tip1&&!ahud.tip3&&!ahud.newBadge&&ahud.strong&&ahud.vis&&!ahud.mid.length&&!ahud.ovl&&!ahud.onSk,
    'ממשק הזירה: '+(ahud.err||'טיפ בריצה 1 '+(ahud.tip1?'כן':'לא!')+', בריצה 3 '+(ahud.tip3?'כן!':'לא')+', תג מכפיל לחדש '+(ahud.newBadge?'יש!':'אין')+', לחזק '+(ahud.strong?'"'+ahud.txt+'"':'חסר!')+
      ', '+ahud.box+(ahud.mid.length?', באמצע המסך: '+ahud.mid.join('+'):'')+(ahud.ovl?', הכישוף על האולטימייט!':'')+(ahud.onSk?', על סקיל!':'')));
  // הרמה הראשונה בזירה (run.js, RUN.ease.horde): שחקן שעומד במקום, מזל קבוע. הגוש הראשון מגיע מהר, אז רמה ראשונה לפני 15 שניות של משחק (המבקר, 2.11: היה עד 25)
  const flv=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),mode=S.mode,rnd=Math.random,er=window.eliteRoll;let sd=7,t=null;
    Math.random=()=>(sd=(sd*16807)%2147483647)/2147483647;window.eliteRoll=()=>{};
    try{startRun();for(let i=0;i<60*30&&t==null;i++){P.hp=P.maxHp;joy=null;S.mode='play';update(1/60);if(P.level>1)t=S.t}}
    finally{Math.random=rnd;window.eliteRoll=er;enemies=[];SAVE=JSON.parse(bak);reset();S.mode=mode}return{t:t==null?null:t-ARENAS.gauntlet.firstGap,k:S.kills}});   // נספר מהגל הראשון (לפניו המתנה רכה, arenas.js)
  check(flv.t!=null&&flv.t<15,'רמה ראשונה בזירה: '+(flv.t!=null?'אחרי '+flv.t.toFixed(1)+' שניות מהגל הראשון':'לא הגיעה תוך 30 שניות'));
  // הזירה (arenas.js, ARENAS.gauntlet): נכנסים בלחיצה אחת על העיגול ליד שער בעולם, ומשחקים עד הסוף (האויבים נופלים ביד, כדי שיהיה מהר).
  // 10 גלים לפי הסדר, הפסקה בלי אויבים וריפוי של 12% בכל הפסקה, קירות רק בגלים 5-6, טבעת בגל 8, המונה, כל גל חזק יותר עם אויבים משלו, ובוס בגל האחרון שמנצח
  const wav=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),mode=S.mode,o={},rw=window.runWon,rnd=Math.random;let won=0,sd=99;window.runWon=()=>{won++};
    Math.random=()=>(sd=(sd*16807)%2147483647)/2147483647;   // מזל משלה, כדי לא להזיז את המזל של הבדיקות שאחריה (אותו seed = אותה ריצה)
    try{enterWorld('home');const w=S.wd;o.btns={};
      const wg=document.getElementById('wGo');
      for(const g of ['pit','grove']){w.near=g;w.open=null;w.ui='';worldHud();o.btns[g]=!wg.hidden&&document.getElementById('wPanel').hidden?1:0}   // בכל שער עיגול אחד שנכנס מיד, בלי כרטיס
      o.btn=!wg.hidden?wg.innerText.replace(/\s+/g,' '):null;if(o.btn)wg.click();if(S.wd){o.btn=null;worldUi(false);startRun()}
      o.arena=S.arena;o.bar=getComputedStyle(document.getElementById('runbar')).display==='none';
      const A=ARENAS.gauntlet,N=A.list.length,dt=1/30,k={},tag={},types={},sups=[],maze=new Set(),heals=[],seen=new WeakSet(),ringA=new Set();o.N=N;o.heal=A.heal;
      // המונה לא נוגע בשכנים בשורה העליונה ולא בחיה (שמצוירת בקנבס: הקופסה שלה סביב המקום שלה על המסך, כשהיא ליד השחקן)
      const tagOverlap=()=>{const el=document.getElementById('waveTag'),r=el.getBoundingClientRect(),out=[];
        const hit=(b,nm)=>{if(Math.min(r.right,b.right)-Math.max(r.left,b.left)>1&&Math.min(r.bottom,b.bottom)-Math.max(r.top,b.top)>1)out.push(nm)};
        for(const id of ['hp','lvl','gearBtnRun','shopBtn','clock']){const e=document.getElementById(id);if(e&&e.offsetParent&&e!==el)hit(e.getBoundingClientRect(),'#'+id)}
        if(S.pet){const p=S.pet;p.x=P.x-30;p.y=P.y-40;const z=innerWidth/W,sx=(p.x+W/2-S.cam.x)*z,sy=(p.y+H/2-S.cam.y)*z,h=petStage().h*z;hit({left:sx-h*0.6,right:sx+h*0.6,top:sy-h,bottom:sy},'pet')}
        return out};o.breaks=0;o.breakSpawn=0;let ph='';o.bossAt=null;
      for(let t=0;t<900&&!won;t+=dt){
        P.hp=P.maxHp*0.5;P.inv=1;if(S.mode!=='play'){for(const id of ['ovLevel','ovBoss'])document.getElementById(id).hidden=true;S.mode='play';S.pendingLv=0}   // חצי חיים וחסין: כך רואים את הריפוי בהפסקה
        const was=S.wv&&S.wv.phase;update(dt);hud();const v=S.wv;if(!v)break;
        if(v.phase==='break'&&was==='fight')heals.push(Math.round(1000*(P.hp/P.maxHp-0.5))/10);   // באותו פריים שהגל נוקה
        if(v.phase==='break'){if(ph!=='break'){o.breaks++;if(v.i>=0)tag.br??=document.getElementById('waveTag').textContent}if(enemies.some(e=>!e.dead&&e.wv>v.i))o.breakSpawn++}
        ph=v.phase;
        if(v.phase==='fight'){if(mazeOn())maze.add(v.i+1);if(v.i===A.mazeWaves[0]&&mazeFade()>=MAZE.solidAt&&o.wall==null&&MZ.walls.length){   // קיר חוסם באמת: שחקן במרכז קיר נדחף החוצה
          const q=MZ.walls[0],bx=P.x,by=P.y;P.x=q.x+q.w/2;P.y=q.y+q.h/2;mazeRun();o.wall=!(P.x>q.x&&P.x<q.x+q.w&&P.y>q.y&&P.y<q.y+q.h);P.x=bx;P.y=by}}
        if(v.phase==='fight'&&k[v.i]==null){k[v.i]=runK();tag[v.i]=document.getElementById('waveTag').textContent;if(v.i===2)o.ovl=tagOverlap()}
        for(const e of enemies)if(!e.dead&&e.wv!=null){
          if(!seen.has(e)){seen.add(e);if(e.wv===7&&!e.elite)ringA.add(Math.floor(((Math.atan2(e.y-P.y,e.x-P.x)+Math.PI)/(2*Math.PI))*8)%8)}   // גל 8: מאיזה כיוון כל אויב נולד (8 גזרות)
          (types[e.wv]=types[e.wv]||new Set()).add(e.type);if(e.elite&&!sups.includes(e.type+(e.wv+1)))sups.push(e.type+(e.wv+1));if(e.wv===v.i&&Math.random()<0.06)kill(e)}
        if(S.boss&&!S.boss.dead){o.bossAt??=v.i;if(Math.random()<0.03)kill(S.boss)}
      }
      const ks=Object.keys(k).map(Number).sort((a,b)=>a-b).map(i=>k[i]);
      o.waves=ks.length;o.grow=ks.every((x,i)=>!i||x>ks[i-1]);o.k1=Math.round(ks[0]*10)/10;o.kN=Math.round(ks[ks.length-1]);
      o.tag3=tag[2]||'';o.tagBr=tag.br||'';o.tagN=tag[N-1]||'';o.sets=new Set(Object.values(types).map(s=>[...s].sort().join('+'))).size;
      const NEW=['slime','mushnub','goleling','ghost'];o.news=NEW.filter(t=>Object.values(types).some(s=>s.has(t)));o.sups=sups;
      o.maze=[...maze].sort((a,b)=>a-b).join(',');o.heals=heals;o.ring=ringA.size;
      o.won=won;o.bossCount=S.bossCount;o.runWon=S.run.won>0;o.stations=S.run.next;o.t=Math.round(S.t)}catch(err){o.err=String(err&&err.stack||err)}
    window.runWon=rw;Math.random=rnd;enemies=[];wRet=null;for(const id of ['ovLevel','ovBoss'])document.getElementById(id).hidden=true;document.getElementById('banner').textContent='';
    SAVE=JSON.parse(bak);reset();S.mode=mode;o.after=!S.wv&&!document.documentElement.classList.contains('waves');return o});
  {const H=wav.heal*100,hOk=wav.heals&&wav.heals.length===wav.N-1&&wav.heals.every(h=>h>=H-0.5&&h<=H+1);
  check(!wav.err&&wav.btns&&wav.btns.pit===1&&wav.btns.grove===1&&!!wav.btn&&wav.arena==='gauntlet'&&wav.bar&&wav.waves===wav.N&&wav.N===10&&wav.grow&&wav.breaks>=wav.N-1&&wav.breakSpawn===0&&wav.tag3.includes('3/'+wav.N)&&!!wav.tagBr&&wav.sets>=4
    &&wav.bossAt===wav.N-1&&wav.won===1&&wav.bossCount===1&&wav.runWon&&wav.stations===0&&wav.after&&wav.maze==='5,6'&&wav.wall===true&&wav.ring>=7&&hOk
    &&wav.news.length===4&&wav.sups.some(x=>x.startsWith('yeti'))&&wav.sups.some(x=>x.startsWith('demon'))&&wav.ovl&&!wav.ovl.length,
    'הזירה (האתגר): '+(wav.err||'כפתורי זירה בשער: '+JSON.stringify(wav.btns)+', "'+wav.btn+'", '+wav.waves+'/'+wav.N+' גלים ב-'+wav.t+' שניות, '+wav.breaks+' הפסקות (אויבים בהפסקה: '+wav.breakSpawn+'), ריפוי בהפסקות: '+(wav.heals||[]).join('/')+'%'+(hOk?'':' (צריך '+(wav.N-1)+' × '+H+'%)')
      +', קירות בגלים: '+(wav.maze||'אף אחד')+(wav.wall?' (חוסמים)':' (לא חוסמים!)')+', טבעת בגל 8: '+wav.ring+'/8 כיוונים, מונה "'+wav.tag3+'", בהפסקה "'+wav.tagBr+'", אחרון "'+wav.tagN+'", חוזק x'+wav.k1+'→x'+wav.kN+(wav.grow?' (עולה)':' (לא עולה!)')+', '+wav.sets+' הרכבי אויבים, בוס בגל '+(wav.bossAt==null?'-':wav.bossAt+1)+', ניצחון: '+(wav.won===1&&wav.runWon?'כן':'לא')+', תחנות ישנות: '+wav.stations+', אחרי: '+(wav.after?'נקי':'נשאר גלים!')+', מפלצות: '+(wav.news||[]).join('+')+', אויבי-על: '+(wav.sups||[]).join(' ')+', המונה נוגע ב: '+(wav.ovl?wav.ovl.join(',')||'כלום':'-')))}
  // כניסה רכה (arenas.js): חסינות בכניסה, הגל הראשון אחרי firstGap עם ספירה 3/2/1, וזזים חופשי בזמן ההמתנה
  const gr=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),mode=S.mode,o={bn:[]},ob=window.banner;
    try{window.banner=(t,c)=>{o.bn.push(t);return ob(t,c)};startRun();const A=ARENAS.gauntlet,dt=1/30;o.inv=Math.round(P.inv*10)/10;o.gap=Math.round((S.wv.until-S.t)*10)/10;
      const x0=P.x;joy={id:-1,ox:0,oy:0,dx:1,dy:0};for(let t=0;t<0.5;t+=dt)update(dt);joy=null;o.moved=Math.round(P.x-x0);
      const hp0=P.hp;let first=null,hpLow=hp0;
      for(let t=0.5;t<A.firstGap+1;t+=dt){if(S.mode!=='play'){S.mode='play';S.pendingLv=0}update(dt);if(first==null&&enemies.some(e=>!e.dead&&e.wv===0))first=Math.round(S.t*10)/10;if(S.t<A.inv-0.1){hurt(5);hpLow=Math.min(hpLow,P.hp)}}   // רק בזמן החסינות
      o.first=first;o.hpKept=hpLow>=hp0;o.cd=o.bn.filter(t=>/wakes/i.test(t)).map(t=>t.replace(/\D/g,'')).join(',');
    }catch(err){o.err=String(err&&err.stack||err)}
    window.banner=ob;joy=null;enemies=[];document.getElementById('banner').textContent='';SAVE=JSON.parse(bak);reset();S.mode=mode;return o});
  check(!gr.err&&gr.inv===3&&gr.gap===6&&gr.moved>20&&gr.hpKept&&gr.first!=null&&gr.first>=5.9&&gr.cd==='3,2,1',
    'כניסה רכה לזירה: '+(gr.err||'חסינות '+gr.inv+' שניות'+(gr.hpKept?' (מכות לא פגעו)':' (נפגע!)')+', הגל הראשון אחרי '+gr.first+' שניות (מתוכנן '+gr.gap+'), ספירה '+(gr.cd||'אין')+', זז '+gr.moved+' בזמן ההמתנה'));
  // זמן לגל (waveMax ב-arenas.js): אויב שלא נופל (סוג נזק שלא עובד עליו) לא תוקע את הריצה. אחרי waveMax הגל הבא מתחיל, והשארית לא חוסמת אותו
  const wmx=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),mode=S.mode,o={},at=window.attack;
    try{window.attack=()=>{};startRun();const A=ARENAS.gauntlet,dt=1/30;waveStart(1);const w=S.wv;w.q=[];enemies=[];
      const e=addEnemy('golem',P.x+2000,P.y);e.wv=1;e.hp=e.max=1e12;
      for(let t=0;t<A.waveMax+1;t+=dt){P.hp=P.maxHp;P.inv=1;update(dt);if(w.phase==='break'&&o.at==null)o.at=Math.round(S.t-w.start)}
      o.late=w.late||0;o.alive=!e.dead;o.ban=document.getElementById('banner').textContent;
      for(let t=0;t<A.breakSecs+1&&w.i<2;t+=dt){P.hp=P.maxHp;P.inv=1;update(dt)}o.next=w.i===2;
    }catch(err){o.err=String(err&&err.stack||err)}
    window.attack=at;enemies=[];document.getElementById('banner').textContent='';SAVE=JSON.parse(bak);reset();S.mode=mode;return o});
  check(!wmx.err&&wmx.late===1&&wmx.at!=null&&wmx.alive&&wmx.next,'זמן לגל בזירה: '+(wmx.err||'אויב שלא נופל, הגל נגמר אחרי '+wmx.at+' שניות'+(wmx.alive?' והוא נשאר':'')+', '+(wmx.next?'הגל הבא התחיל':'הגל הבא לא התחיל!')+' · "'+wmx.ban+'"'));
  // קירות הזירה בתלת-ממד (maze3d.js): בגלים 5-6 קופסאות בסצנה (לא בקנבס, שמצייר מעל הגיבור), ומחוץ לזירה נעלמות. בדו-ממד: הקנבס
  const mz3=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),mode=S.mode,o={on:R3D.on&&R3D.ready};
    try{startRun();S.mode='play';waveStart(4);S.wv.q=[];enemies=[];S.t=Math.floor(S.t/MAZE.shiftSecs)*MAZE.shiftSecs+10;MZ.on=true;MZ.t0=S.t-5;
      if(o.on){maze3d();o.n=MZ3.m.count;o.vis=MZ3.m.visible&&MZ3.top.visible;o.op=MZ3.m.material.opacity;o.canvas=!maze3dOn()}
      else{o.draw=(()=>{try{mazeDraw(0,0);return true}catch(err){return String(err)}})()}
      reset();if(o.on){maze3d();o.off=!MZ3.m.visible}   // maze3d ישירות: בבדיקה render3d מדלג על רוב הפריימים (R3D.drawEvery)
    }catch(err){o.err=String(err&&err.stack||err)}
    enemies=[];SAVE=JSON.parse(bak);reset();S.mode=mode;return o});
  check(!mz3.err&&(mz3.on?mz3.n>0&&mz3.vis&&mz3.op>0.9&&!mz3.canvas&&mz3.off:mz3.draw===true),'קירות הזירה בתלת-ממד: '+(mz3.err||(mz3.on?mz3.n+' קירות בסצנה'+(mz3.vis?'':' (מוסתרים!)')+', שקיפות '+(mz3.op||0).toFixed(2)+(mz3.canvas?', גם בקנבס!':', לא בקנבס')+(mz3.off?', נעלמים מחוץ לזירה':', נשארים מחוץ לזירה!'):'בדו-ממד: הקנבס מצייר ('+mz3.draw+')')));
  // תחושת קרב בזירה (arena-feel.js, #502): עצירה במכה בלי הצטברות ועם תקרה, הפחתת תנועה מכבה, חוצץ לחיצה, Rampage מ-3 ברצף,
  // תנועת הטלה (P.skCast), הבזק קצר, נטייה אחורה של hitfeel בזירה, ובעולם כלום. בלי rand: לא מזיז את ה-seed
  const afl=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),mode=S.mode,o={},calm=SAVE.calm,clk=window.afClock;let fake=1000;
    try{window.afClock=()=>fake;startRun();S.mode='play';enemies=[];AF.last=-9;AF.win=0;AF.used=0;S.hitstop=0;
      const e=addEnemy('grunt',P.x+30,P.y);e.hp=e.max=1e9;AJ.src={w:'sword',ch:false};
      juiceHit(e,10,1,false,'physical',0);o.hit=Math.round(S.hitstop*1000);o.flash=Math.round(e.flash*1000);o.lean=e.hfT>0;
      juiceHit(e,10,1,true,'physical',0);o.stack=Math.round(S.hitstop*1000);   // עצירה פעילה: לא מתחלפת ולא מצטברת
      fake+=2;let n=0;for(let i=0;i<19;i++){S.hitstop=0;fake+=0.05;if(afStop(0.035))n++}o.perSec=n;   // שנייה אחת בצעדים של 0.05: המרווח (0.22) נותן לכל היותר 4
      fake+=2;afStop(0.035);S.hitstop=0;fake+=0.3;AF.used=ARFEEL.stop.budget-0.01;o.budget=!afStop(0.035);   // התקרה לשנייה: אין מקום
      S.hitstop=0;SAVE.calm=true;fake+=2;o.calm=!afStop(0.1)&&S.hitstop===0;SAVE.calm=calm;
      // התקרה האמיתית: עצירה ארוכה של מערכת אחרת (S.hitstop ישירות) נחתכת אחרי budget שניות של עמידה
      fake+=2;AF.tk=fake;S.hitstop=0.5;let cut=-1;for(let j=1;j<=15&&cut<0;j++){fake+=0.02;afTick();if(!(S.hitstop>0))cut=j}o.capCut=cut;S.hitstop=0;
      // חוצץ: לחיצה שנשארו לה 0.1 שניות נשמרת, ויוצאת כשהסקיל מוכן
      const k=S.sk,id=k.ids[0],i=0;k.cd[i]=0.1;fake+=2;const u0=k.used;o.press=skillUse(id);o.buf=!!AF.buf;k.cd[i]=0;afTick();o.fired=k.used===u0+1&&!AF.buf;o.cast=!!P.skCast&&P.skCast.k===ARFEEL.cast[id];
      // Rampage: הריגה שלישית ברצף
      S.st=null;const r0=AF.stat.rampage;for(let j=0;j<3;j++)streakKill();o.ramp=AF.stat.rampage===r0+1;for(let j=0;j<3;j++)streakKill();o.rampOnce=AF.stat.rampage===r0+1;
      AJ.src=null;enemies=[];
      // בעולם: כלום
      enterWorld('home');S.hitstop=0;const ew=addEnemy('grunt',P.x+30,P.y);o.world=!afArena()&&S.hitstop===0;
    }catch(err){o.err=String(err&&err.stack||err)}
    window.afClock=clk;enemies=[];S.hitstop=0;S.slow=0;SAVE=JSON.parse(bak);reset();S.mode=mode;return o});
  check(!afl.err&&afl.hit===35&&afl.flash===60&&afl.lean&&afl.stack===35&&afl.perSec>0&&afl.perSec<=4&&afl.budget&&afl.capCut>=7&&afl.capCut<=8&&afl.calm&&afl.press===false&&afl.buf&&afl.fired&&afl.cast&&afl.ramp&&afl.rampOnce&&afl.world,
    'תחושת קרב בזירה: '+(afl.err||'עצירה '+afl.hit+'ms, הבזק '+afl.flash+'ms, נטייה אחורה '+(afl.lean?'✓':'✗')+', בלי הצטברות ('+afl.stack+'ms), '+afl.perSec+' עצירות בשנייה (מרווח), תקרה לשנייה '+(afl.budget?'✓':'✗')+', עצירה ארוכה של מערכת אחרת נחתכה אחרי '+afl.capCut+' פריימים של 20ms'+', הפחתת תנועה '+(afl.calm?'מכבה':'לא מכבה!')+
      ', חוצץ '+(afl.buf&&afl.fired?'✓':'✗')+', תנועת הטלה '+(afl.cast?'✓':'✗')+', Rampage '+(afl.ramp?(afl.rampOnce?'פעם אחת לרצף':'חוזר!'):'✗')+', בעולם '+(afl.world?'כלום':'משהו!')));
  // אירוע אחד = רגע אחד (MLBB 3.3, ה5): "Rampage!" והמדרגות של הרצף באותו מקום למעלה, כרטיס אחד בכל רגע ובלי מילה צפה מעל הגיבור.
  // הריגת אויב-על: הגיליון ko או הפוף, לא שניהם. "פחות אפקטים": בלי כרטיס. הפחתת תנועה: בלי עמוד אור
  const om=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),mode=S.mode,o={},fl=SAVE.fxLess,calm=SAVE.calm,cq=typeof CQ!=='undefined'&&CQ.on;
    // בלי תור המרכז (centerq.js): הבאנר של startRun מחזיק את הרצף בתור, וזה תלוי בתזמון (נכשל לפעמים ב-seed 2026). לתור יש בדיקה משלו
    if(cq)CQ.on=false;try{startRun();S.mode='play';enemies=[];P.hp=P.maxHp=1e9;P.next=1e9;SAVE.fxLess=false;SAVE.calm=false;S.st=null;FXLIB.ui.length=0;FXLIB.list.length=0;
      const cards=()=>FXLIB.ui.filter(f=>f.id===STREAK.card.fx&&f.on!==false).length,k=()=>{const e=addEnemy('grunt',P.x+80,P.y);e.hp=1;e.elite=false;kill(e)};
      const f0=floats.length,sh0=STREAK.shown||0;k();k();k();o.ramp=S.st.show&&S.st.show.key;o.c3=cards();
      o.noFloat=!floats.slice(f0).some(f=>f.txt===T('feel.rampage'));o.noWorld=!FXLIB.list.some(f=>f.id===STREAK.card.fx);
      for(let i=0;i<7;i++)k();o.step=S.st.show&&S.st.show.key;o.c10=cards();o.shows=(STREAK.shown||0)-sh0;
      const big=()=>{const p0=AJ.stat.poofs,ko0=ARFXS.stat.ko;const e=addEnemy('grunt',P.x+120,P.y);e.elite=true;e.hp=1;kill(e);return (AJ.stat.poofs-p0)+(ARFXS.stat.ko-ko0)};
      o.big=big();o.koImg=!!fxImg('ko');SAVE.fxLess=true;o.bigLess=big();
      S.st=null;FXLIB.ui.length=0;k();k();k();o.lessCard=cards()===0&&S.st.show&&S.st.show.key==='feel.rampage';
      SAVE.fxLess=false;SAVE.calm=true;const pl=AF.stat.pillars;S.st=null;k();k();k();o.calmPillar=AF.stat.pillars===pl;
    }catch(err){o.err=String(err&&err.stack||err)}
    if(cq)CQ.on=true;SAVE.fxLess=fl;SAVE.calm=calm;FXLIB.ui.length=0;FXLIB.list.length=0;enemies=[];S.st=null;SAVE=JSON.parse(bak);reset();S.mode=mode;return o});
  check(!om.err&&om.ramp==='feel.rampage'&&om.c3===1&&om.noFloat&&om.noWorld&&om.step==='st.0'&&om.c10===1&&om.shows===2&&om.big===1&&om.bigLess<=1&&om.lessCard&&om.calmPillar,
    'רגע אחד לכל אירוע: '+(om.err||'Rampage למעלה '+(om.ramp==='feel.rampage'&&om.noFloat&&om.noWorld?'✓':'✗ ('+om.ramp+(om.noFloat?'':', מילה צפה')+(om.noWorld?'':', כרטיס בעולם')+')')+
    ', כרטיסים '+om.c3+'/'+om.c10+' ('+om.shows+' רגעים ב-10 הריגות), אויב-על '+(om.big===1?'רגע אחד ('+(om.koImg?'ko':'פוף')+')':om.big+' רגעים!')+
    ', פחות אפקטים '+(om.bigLess<=1&&om.lessCard?'✓':'✗')+', הפחתת תנועה בלי עמוד אור '+(om.calmPillar?'✓':'✗')));
  // center queue (centerq.js, MLBB 3.1): never two center messages at once in the arena; danger jumps ahead and replaces what is shown;
  // info (first kill, book) goes last; a streak replaces a streak; at most CQ.max waiting. Fake clock (CQ.clock), so no timing flakes
  const cq=await page.evaluate(()=>{const o={},mode=S.mode,bak=JSON.stringify(SAVE);let t=0;
    try{startRun();S.mode='play';document.body.classList.remove('vil','world','mb');CQ.clock=()=>t;   // body classes are set on the next frame; a leftover 'vil' sends banner to the village lane (msglane.js)
      CQS.cur=null;CQS.q.length=0;{const b0=document.getElementById('banner');if(b0)b0.classList.remove('on')}S.st=null;const st0={...CQ.stat};let worst=0;
      const v=()=>{const n=cqVisible();worst=Math.max(worst,n);return n},txt=()=>document.getElementById('banner').textContent;
      S.st={n:10,last:S.t,show:null,best:10};
      banner('Alpha',C.gold);o.a=v()===1&&txt()==='Alpha';
      streakShow('st.0',10,STREAK.ring);o.wait=v()===1&&!S.st.show;
      const peak=T('pace.peak');banner(peak,'#EF4E57');o.jump=v()===1&&txt()===peak;
      cqSay(T('loot.first','X'),C.gold);o.lowQ=CQS.q.length===2&&CQS.q[1].pri===0;
      t=0.5;cqTick();o.minHold=txt()===peak;   // shown at least CQ.min
      t=1.0;cqTick();o.streakNext=v()===1&&!!S.st.show&&S.st.show.key==='st.0';
      streakShow('st.1',25,STREAK.ring);o.sameKind=v()===1&&S.st.show.key==='st.1';
      t=2.0;cqTick();o.low=v()===1&&txt()===T('loot.first','X')&&!S.st.show;
      for(let i=0;i<5;i++)banner('N'+i,C.chalk);o.max=CQS.q.length===CQ.max;
      t=9;cqTick();o.stale=CQ.stat.stale>st0.stale;
      // boss/wave moments are never lost (QUINN): behind 3 waiting normal ones, and a param-first key ('n is furious')
      t=20;cqTick();CQS.cur=null;CQS.q.length=0;banner('Busy',C.chalk);for(let i=0;i<3;i++)banner('W'+i,C.chalk);const fw=T('wave.last');banner(fw,C.gold);o.last=txt()===fw;
      o.rage=cqPri(T('rage2','Boss'))===2&&cqPri(T('bossDown','Boss'))===2;
      o.worst=worst;o.overlap=CQ.stat.overlap-st0.overlap;o.qmax=CQ.max;
    }catch(err){o.err=String(err&&err.stack||err)}
    CQ.clock=null;CQS.cur=null;CQS.q.length=0;const b=document.getElementById('banner');if(b)b.classList.remove('on');S.st=null;SAVE=JSON.parse(bak);reset();S.mode=mode;return o});
  {const L=[[cq.a,'shown'],[cq.wait,'second waits'],[cq.jump,'danger jumps ahead'],[cq.lowQ,'info last'],[cq.minHold,'min time'],[cq.streakNext,'then the streak'],[cq.sameKind,'streak replaces streak'],[cq.low,'then info'],[cq.max,'at most '+cq.qmax+' waiting'],[cq.stale,'old ones dropped'],[cq.last,'final wave behind 3 waiting'],[cq.rage,'boss moments high']];
   check(!cq.err&&L.every(x=>x[0])&&cq.worst===1&&cq.overlap===0,'center queue in the arena: '+(cq.err||L.map(x=>x[1]+(x[0]?' ✓':' ✗')).join(', ')+', at most '+cq.worst+' on screen'+(cq.overlap?', '+cq.overlap+' overlaps!':'')))}
  // arena ult lanterns (ult-lantern3d.js, correction pack B): visual only, on the cast frame; n lanterns in the damage-type color, fewer in fxLess,
  // all gone after the flight, and a new run starts clean. 2D: nothing to draw
  const ull=await page.evaluate(()=>{const o={},fl=SAVE.fxLess,mode=S.mode;try{
      if(!(R3D.on&&R3D.ready)){o.d2=true;return o}
      startRun();S.mode='play';SAVE.fxLess=false;const cast=()=>{S.ult={c:ULT.need,used:0};return ultUse()};
      o.ok=cast();o.n=ULTLS.orbs.filter(x=>x.g.visible).length;
      const want=new THREE.Color(dtCol(P.dt[P.weapon]||'physical'));o.col=ULTLS.orbs[0].g.userData.O.cr.material.color.equals(want);
      for(let i=0;i<20;i++)ult3dLanterns(0.05);o.gone=ULTLS.orbs.every(x=>!x.g.visible)&&!ULTLS.beam.visible&&!ULTLS.ring.visible;
      SAVE.fxLess=true;cast();o.less=ULTLS.orbs.filter(x=>x.g.visible).length;SAVE.fxLess=fl;
      reset();startRun();o.clean=ULTLS.orbs.every(x=>!x.g.visible);
    }catch(e){o.err=String(e&&e.stack||e)}SAVE.fxLess=fl;S.mode=mode;return o});
  check(!ull.err&&(ull.d2||ull.ok&&ull.n===6&&ull.col&&ull.gone&&ull.less===4&&ull.clean),'arena ult lanterns: '+(ull.err||(ull.d2?'2D, nothing to draw':[[ull.n+' lanterns',ull.n===6],['damage-type color',ull.col],['gone after the flight',ull.gone],['fewer effects '+ull.less,ull.less===4],['new run clean',ull.clean]].map(x=>x[0]+(x[1]?' ✓':' ✗')).join(', '))));
  // painted arena sky (arena-sky.js, correction pack layer A): in 3D the floor stops at the wooden rim and a camera-attached sky shows beyond it.
  // Off (flat color, floor everywhere) in fewer effects, in the boss palette (no picture) and outside the arena. 2D: nothing to check
  // waiting for something async in the page (a picture decoding, a lazy model): the page clock is paused, so wait here and step it (like settle above)
  const waitPage=async(fn,arg)=>{for(let i=0;i<300;i++){if(await page.evaluate(fn,arg))return true;await page.waitForTimeout(20);await page.clock.runFor(50)}return false};
  await page.evaluate(()=>{if(R3D.on&&R3D.ready)for(const a of ['classic','waves','maze'])askyTex(ARENA_SKY.map[a])});   // decoding the data URIs takes a moment
  await waitPage(()=>!(R3D.on&&R3D.ready)||['classic','waves','maze'].every(a=>{const t=askyTex(ARENA_SKY.map[a]);return t&&t.image&&t.image.width}));
  const sky=await page.evaluate(()=>{const o={},fl=SAVE.fxLess,mode=S.mode;try{
      if(!(R3D.on&&R3D.ready)){o.d2=true;return o}
      startRun();S.mode='play';const run=a=>{S.arena=a;FRAME_T+=17;const de=R3D.drawEvery;R3D.drawEvery=0;render3d(R3D.ox||0,R3D.oy||0);R3D.drawEvery=de;   // drawEvery=0: in CI 3D draws once every 60 frames, so force this one
        const u=ALOOK.mat&&ALOOK.mat.userData.u;return {q:!!(ASKY.quad&&ASKY.quad.visible),r:u&&u.aSky.value}};
      o.why={on:ARENA_SKY.on,err:ARENA_SKY.stat.err||'',name:askyName(),w:(askyTex('classic')||{image:{}}).image&&askyTex('classic').image.width,here:aLookHere(),less:fxLess(),calm:calmOn(),u:!!(ALOOK.mat&&ALOOK.mat.userData.u)};   // why it would not show (for a failing run)
      o.key=S.arena;const g=run(S.arena);o.real=g.q&&g.r===ARENA_SKY.edge;   // הזירה האמיתית (startRun שם S.arena), בלי לכפות מפתח
      const c=run('classic');o.on=c.q&&c.r===ARENA_SKY.edge;o.waves=run('waves').q;o.maze=run('maze').q;
      const b=run('boss');o.boss=!b.q&&b.r===0;
      SAVE.fxLess=true;const l=run('classic');o.less=!l.q&&l.r===0;SAVE.fxLess=fl;
    }catch(e){o.err=String(e&&e.stack||e)}SAVE.fxLess=fl;S.mode=mode;return o});
  check(!sky.err&&(sky.d2||sky.real&&sky.on&&sky.waves&&sky.maze&&sky.boss&&sky.less),'painted arena sky: '+(sky.err||(sky.d2?'2D, nothing to draw':[['real arena ('+sky.key+')'+(sky.real?'':' '+JSON.stringify(sky.why)),sky.real],['classic',sky.on],['waves',sky.waves],['maze (dimension)',sky.maze],['boss stays flat',sky.boss],['fewer effects: flat',sky.less]].map(x=>x[0]+(x[1]?' ✓':' ✗')).join(', '))));
  // רגעים לסקילי הזירה (MLBB 1.1, skill-anim.js SKANIM.mo): רק מה שהיה חסר לפי טבלת הפערים. בתוך perCast, ו"פחות אפקטים" מוריד את הקישוטים
  // רגע הסכנה של הבוס (arena-danger.js, MLBB 2.1): המילוי לפי השעונים האמיתיים מגיע ל-100% ברגע הפגיעה (בפריים האחרון לפניה: 1 פחות פריים),
  // באמצע לפי החשבון (גל הדף: 0.4 מתוך 1.0 ברגע שהאזהרה נגמרת), תקתוק, הבזק, חריכה עד max, ו"פחות אפקטים" בלי חריכה. המכשף במג'נטה
  const adg=await page.evaluate(()=>{const o={},mode=S.mode,fl=SAVE.fxLess,bak=JSON.stringify(SAVE);
    try{reset();S.mode='play';enemies.length=0;S.arena='classic';SAVE.fxLess=false;P.hp=P.maxHp=1e9;P.next=1e9;   // P.next: בלי עליית רמה באמצע (S.mode='level' עוצר את update, ואז אין st)
      for(const k in ARDG.stat.hitP)delete ARDG.stat.hitP[k];const n0={...ARDG.stat};ARDGS.sc.length=0;
      const b=makeBoss();b.x=P.x+200;b.y=P.y;S.boss=b;enemies.push(b);b.hp=b.max=1e12;
      const run=(k,sec)=>{b.patT=99;b.arTele=null;doPattern(b,k);let mid=null;for(let i=0;i<sec*60;i++){b.patT=99;P.hp=P.maxHp;update(1/60);const st=ARDGS.b.get(b);if(st&&mid==null&&st.ph==='after')mid=st.p}return mid};
      o.mShock=run('shock',2.5);o.mCharge=run('charge',2.5);run('ring',1.5);run('aimed',1.5);run('mines',2.5);run('shock',2.5);run('mines',2.5);
      const H=ARDG.stat.hitP,ks=['shock','charge','ring','aimed','mines'];o.hit=ks.map(k=>k+' '+(H[k]==null?'-':H[k].toFixed(3))).join(', ');
      o.full=ks.every(k=>H[k]>=0.97&&H[k]<=1);o.mid=Math.abs(o.mShock-0.4)<0.02&&Math.abs(o.mCharge-0.3/1.05)<0.02;
      o.ticks=ARDG.stat.ticks-n0.ticks;o.flash=ARDG.stat.flash-n0.flash;o.sc=ARDGS.sc.length;o.scN=ARDG.stat.scorch-n0.scorch;
      SAVE.fxLess=true;ARDGS.sc.length=0;run('shock',2.5);o.less=ARDGS.sc.length===0;
      o.col=ARDG.col==='#FF3DD8'&&ATG.fallback.col===ARDG.col;
      // reduced motion: no flash and no tick thickening; the fill and outline stay. Measured on the drawing itself ('lighter' fills, line width)
      SAVE.fxLess=false;const calm0=SAVE.calm;SAVE.calm=true;S.mode='play';S.hitstop=0;b.patT=99;b.arTele=null;doPattern(b,'ring');const tl=b.arTele;tl.t=tl.max*0.5;update(1/60);const st=ARDGS.b.get(b);st.tk=S.t;
      let lighter=0,maxW=0;const fl=ctx.fill,sk=ctx.stroke;ctx.fill=function(){if(ctx.globalCompositeOperation==='lighter')lighter++;return fl.apply(this,arguments)};ctx.stroke=function(){maxW=Math.max(maxW,ctx.lineWidth);return sk.apply(this,arguments)};
      const r3=R3D.on;R3D.on=false;   // the canvas path (2D); 3D is checked below on the scene
      try{S.cam.x=b.x;S.cam.y=b.y;ardgDrawUnder();b.ardgFl=S.t;if(!ARDGS.fl.includes(b))ARDGS.fl.push(b);ardgDrawOver()}finally{ctx.fill=fl;ctx.stroke=sk;R3D.on=r3}
      o.calm=lighter===0&&maxW===ARDG.line;
      // 3D: the fill and edge are meshes on the floor (arena-danger3d.js), and the canvas draws no fill on top of the actors
      if(R3D.on&&R3D.ready){let cf=0;const f2=ctx.fill;ctx.fill=function(){cf++;return f2.apply(this,arguments)};try{ardgDrawUnder()}finally{ctx.fill=f2}
        ardg3d();const s0=AD3.sl[0];o.d3=!!s0&&s0.fill.visible&&s0.edge.visible&&cf===0&&Math.abs(s0.edge.material.opacity-ARDG.lineA)<0.01;o.d3s=(s0&&s0.fill.visible)+'/'+cf}else o.d3=true;
      SAVE.calm=calm0;
      // ghost (QUINN): a live warning, then a new run. Nothing of the old boss stays: no entries, no scorch, no visible 3D mesh
      b.patT=99;b.arTele=null;doPattern(b,'ring');update(1/60);ardgScorch(b.x,b.y,80);const had=ARDGS.b.size>0;reset();startRun();S.mode='play';
      if(R3D.on&&R3D.ready)ardg3d();o.ghost=had&&ARDGS.b.size===0&&ARDGS.sc.length===0&&(typeof AD3==='undefined'||!AD3.on||!AD3.sl.some(s=>s.fill.visible||s.edge.visible)&&!AD3.sc.some(m=>m.visible));
    }catch(err){o.err=String(err&&err.stack||err)}
    SAVE.fxLess=fl;mines.length=0;waves.length=0;enemies.length=0;S.boss=null;ARDGS.b.clear();ARDGS.sc.length=0;ARDGS.fl.length=0;SAVE=JSON.parse(bak);reset();S.mode=mode;return o});
  check(!adg.err&&adg.full&&adg.mid&&adg.ticks>=8&&adg.flash>=5&&adg.sc>0&&adg.sc<=6&&adg.scN>adg.sc&&adg.less&&adg.col&&adg.calm&&adg.d3&&adg.ghost,
    'רגע הסכנה של הבוס: '+(adg.err||'מילוי ברגע הפגיעה '+adg.hit+(adg.full?' ✓':' ✗')+', באמצע '+(adg.mShock??0).toFixed(2)+'/'+(adg.mCharge??0).toFixed(2)+(adg.mid?' ✓':' ✗')+
    ', תקתוקים '+adg.ticks+', הבזקים '+adg.flash+', חריכה '+adg.sc+' מתוך '+adg.scN+(adg.sc<=6?' (עד 6)':' (מעל 6!)')+', פחות אפקטים '+(adg.less?'בלי חריכה':'עם חריכה!')+', מג\'נטה '+(adg.col?'✓':'✗')+', reduced motion '+(adg.calm?'no flash/thickening ✓':'flash or thickening!')+(adg.d3?'':', 3D floor mesh missing ('+adg.d3s+')')+(adg.ghost?', new run clean':', old boss warning left on the new run!')));
  const smo=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),mode=S.mode,o={},fl=SAVE.fxLess;
    try{startRun();S.mode='play';enemies=[];P.x=0;P.y=0;S.cam.x=0;S.cam.y=0;SAVE.fxLess=false;
      for(let i=0;i<6;i++){const e=addEnemy('grunt',60+i*25,(i%2?40:-40));e.hp=e.max=1e9;e.elite=false}
      const ids=['quake','splash','frost','flame','zap','comet','lance','bloom'];S.sk.ids=ids.slice();S.sk.cd=ids.map(()=>0);
      const got=id=>{FXLIB.list.length=0;S.sk.cd=ids.map(()=>0);const ok=skillUse(id);return {ok,ids:FXLIB.list.map(f=>f.id),hold:FXLIB.list.filter(f=>f.hold>0).map(f=>f.id),n:SKANIMS.n}};
      const R={};for(const id of ids)R[id]=got(id);o.cap=ids.every(id=>R[id].n<=SKANIM.perCast);o.n=ids.map(id=>id+':'+R[id].n).join(' ');
      o.quake=R.quake.ids.includes('step_dust')&&R.quake.hold.includes('sk_anvil');o.splash=R.splash.ids.includes('wt_wave');o.frost=R.frost.hold.includes('whit_ice');
      o.comet=R.comet.ids.some(i=>i==='hit_fire');o.lance=R.lance.hold.includes('sk_pierce_ray');o.bloom=R.bloom.ids.includes('petals');
      FXLIB.list.length=0;for(let i=0;i<40;i++)skillsUpdate(0.05);o.crater=FXLIB.list.some(f=>f.id==='whit_fire'&&f.hold>0);   // השביט נחת
      P.hp=P.maxHp*0.5;const f0=floats.length;for(let i=0;i<20;i++)skillsUpdate(0.05);o.heal=floats.slice(f0).some(f=>/^\+\d/.test(f.txt)&&f.col===SKANIM.mo.bloom.healCol);
      enemies=[];for(let i=0;i<150;i++){const e=addEnemy('grunt',(i%15-7)*4,(Math.floor(i/15)-5)*4);e.hp=e.max=1e9;e.elite=false}S.shake=0;got('quake');   // 150 בטווח: הרעידה עד max, לא 8 של הבוס
      o.qshake=(typeof calmOn==='function'&&calmOn())||S.shake===SKANIM.mo.quake.shake.max&&SKANIM.mo.quake.shake.max<ARFEEL.shake.big;o.qsh=S.shake;enemies=[];
      SAVE.fxLess=true;const lite=got('quake');o.less=!lite.ids.includes('step_dust')&&!lite.hold.length;
    }catch(err){o.err=String(err&&err.stack||err)}
    SAVE.fxLess=fl;FXLIB.list.length=0;enemies=[];SAVE=JSON.parse(bak);reset();S.mode=mode;return o});
  {const ks={quake:'רעידה: אבק וסדקים שנשארים',splash:'התזה: טבעת גל',frost:'כפור שנשאר',comet:'שביט: שובל',crater:'מכתש',lance:'פס קרח',bloom:'עלי כותרת',heal:'מספר ריפוי ירוק',cap:'בתוך perCast',less:'פחות אפקטים',qshake:'רעידה ב-150 אויבים עד '+(smo.qsh??'?')+' (בוס 8)'};
   check(!smo.err&&Object.keys(ks).every(k=>smo[k]),'רגעים לסקילי הזירה: '+(smo.err||Object.keys(ks).map(k=>ks[k]+(smo[k]?' ✓':' ✗')).join(', ')+' ('+smo.n+')'))}
  // אויבים ישנים (arenaZz ב-arenas.js): רחוק מ-wake.r הולכים לאט ומכשף לא יורה. מתעוררים מקרבה, ממכה, מסוף הגל ומהבוס. קפיצה של arena-load לא מעירה, והישנים נספרים בגל
  const zz=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),mode=S.mode,o={},at=window.attack,r0=ARENAS.gauntlet.wake.r,lc0=ARENAS.gauntlet.lastCall;
    try{window.attack=()=>{};startRun();const A=ARENAS.gauntlet,Z=A.wake,R=Z.r*Math.max(W,H),dt=1/30;waveStart(0);const w=S.wv;w.q=[];enemies=[];eb.length=0;P.x=P.y=0;
      o.zs=Z.speed;const mk=(type,d,a=0)=>{const e=addEnemy(type,Math.cos(a)*d,Math.sin(a)*d);e.wv=0;e.elite=false;e.champ=false;return e};
      const far=mk('grunt',R*1.6),wisp=mk('wisp',R*1.5,2),near=mk('grunt',R*0.5,4),hit=mk('grunt',R*1.6,1),lc=mk('grunt',R*1.6,3),jump=mk('grunt',R*3,5);
      const p0=[far.x,far.y];let T=0;for(;T<1;T+=dt){P.hp=P.maxHp;P.inv=1;arenaLoad(0);update(dt)}   // aloadT לא מגיע ל-0 כאן: את הקפיצה בודקים לבד
      o.slow=Math.round(100*Math.hypot(far.x-p0[0],far.y-p0[1])/(far.speed*slowK(far)*T))/100;
      o.farZz=!far.awake;o.nearAw=!!near.awake;o.wispZz=!wisp.awake;update(dt);o.left=w.left;
      hit.hp-=1;update(dt);o.hitAw=!!hit.awake;
      lc.left=true;update(dt);o.lcAw=!!lc.awake;
      S.aloadT=0;arenaLoad(1/60);o.jumpD=Math.round(Math.hypot(jump.x-P.x,jump.y-P.y));o.jumpZz=!jump.awake;o.R=Math.round(R);update(dt);o.jumpZz2=!jump.awake;
      w.boss=true;update(dt);o.bossAw=enemies.filter(e=>!e.dead&&!e.isBoss).every(e=>e.awake);
      // מכשף ישן בטווח יריה: רדיוס ההתעוררות קטן זמנית, כדי שהמכשף יהיה ישן אבל קרוב מספיק לירות אם היה ער
      w.boss=false;enemies=[];eb.length=0;Z.r=0.2;A.lastCall=null;   /* אויב אחד בגל: בלי סוף-הגל, שמעיר אותו */
      const R2=Z.r*Math.max(W,H),wz=mk('wisp',Math.min(330,R2+140));for(let t=0;t<3;t+=dt){P.hp=P.maxHp;P.inv=1;update(dt)}
      o.wispShots=eb.length;o.wispZz=o.wispZz&&!wz.awake;
    }catch(err){o.err=String(err&&err.stack||err)}
    window.attack=at;ARENAS.gauntlet.wake.r=r0;ARENAS.gauntlet.lastCall=lc0;enemies=[];eb.length=0;SAVE=JSON.parse(bak);reset();S.mode=mode;return o});
  check(!zz.err&&zz.farZz&&Math.abs(zz.slow-zz.zs)<0.08&&zz.nearAw&&zz.wispZz&&zz.wispShots===0&&zz.left===6&&zz.hitAw&&zz.lcAw&&zz.jumpZz&&zz.jumpZz2&&zz.jumpD>zz.R&&zz.bossAw,
    'אויבים ישנים בזירה: '+(zz.err||'רחוק: '+(zz.farZz?'ישן':'ער!')+' במהירות ×'+zz.slow+', קרוב: '+(zz.nearAw?'ער':'ישן!')+', מכשף ישן: '+zz.wispShots+' יריות, נספרים בגל: '+zz.left+'/6, מכה מעירה: '+zz.hitAw+', סוף הגל מעיר: '+zz.lcAw+
      ', קפיצה של arena-load: '+zz.jumpD+' (רדיוס '+zz.R+')'+(zz.jumpZz&&zz.jumpZz2?' ונשאר ישן':' והתעורר!')+', הבוס מעיר את כולם: '+zz.bossAw));
  // סוף הגל (lastCall ב-ARENAS.gauntlet): 3 מכשפים נשארו רחוק בגל 3 והשחקן עומד. תוך 25 שניות של משחק הגל נגמר (או שהם הגיעו לטווח), וחצים מצוירים אליהם
  const wlc=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),mode=S.mode,o={arrows:0,minD:1e9},rnd=Math.random,ea=window.edgeArrow;let sd=7;
    Math.random=()=>(sd=(sd*16807)%2147483647)/2147483647;
    try{enterWorld('home');worldUi(false);startRun();waveStart(2);const w=S.wv,L=ARENAS.gauntlet.lastCall,dt=1/30;w.q=[];enemies=[];o.n=L.n;
      for(let k=0;k<3;k++){const a=k*2.1;const e=addEnemy('wisp',P.x+Math.cos(a)*1100,P.y+Math.sin(a)*1100);e.wv=2}
      window.edgeArrow=(...a)=>{if(S.wv&&S.wv.call)o.arrows++;return ea(...a)};
      for(let t=0;t<25;t+=dt){
        P.hp=P.maxHp;if(S.mode!=='play'){for(const id of ['ovLevel','ovBoss'])document.getElementById(id).hidden=true;S.mode='play';S.pendingLv=0}
        update(dt);const live=enemies.filter(e=>!e.dead&&e.wv===2);
        if(Math.round(t/dt)%15===0)render();
        o.called??=w.call?Math.round(t*10)/10:null;if(w.rush)o.rush??=Math.round(t*10)/10;
        for(const e of live)o.minD=Math.min(o.minD,Math.hypot(e.x-P.x,e.y-P.y));
        if(w.phase==='break'){o.end=Math.round(t*10)/10;break}
        if(live.length&&live.every(e=>Math.hypot(e.x-P.x,e.y-P.y)<200)){o.near=Math.round(t*10)/10;break}
      }
      o.left=enemies.filter(e=>!e.dead&&e.wv===2).length}catch(err){o.err=String(err&&err.stack||err)}
    window.edgeArrow=ea;Math.random=rnd;enemies=[];wRet=null;for(const id of ['ovLevel','ovBoss'])document.getElementById(id).hidden=true;document.getElementById('banner').textContent='';
    SAVE=JSON.parse(bak);reset();S.mode=mode;return o});
  check(!wlc.err&&wlc.called===0&&wlc.arrows>0&&(wlc.end!=null||wlc.near!=null),
    'סוף גל: '+(wlc.err||'3 מכשפים רחוק, '+(wlc.called===0?'מסומנים מיד':'לא סומנו!')+', '+wlc.arrows+' חצים, '+(wlc.end!=null?'הגל נגמר אחרי '+wlc.end+' שניות':wlc.near!=null?'הגיעו לטווח אחרי '+wlc.near+' שניות':'תקוע! נשארו '+wlc.left+', הכי קרוב '+Math.round(wlc.minD))+(wlc.rush!=null?', רצו אחרי '+wlc.rush:'')));
  await page.addScriptTag({content:steer+'\n'+faceStep+'\n'+petBot+'\n'+villageBot+'\n'+worldBot});   // עוזרים של הבוט, בתוך הדף
  let L={},took={},guard=0;
  while(guard++<CFG.time*30){
    await page.clock.runFor(CFG.step);
    // התקדמות ל-stderr (לא נכנס לדוח): אם הבדיקה נתקעת ב-GitHub, רואים איפה
    if(guard%300===1)console.error('…',await page.evaluate(()=>[Math.round(S.t),S.mode,S.vil?'village':S.wd?'world':S.room?'room':'arena',enemies.length,S.nd?S.nd.list.length:0].join(' ')));
    L=await page.evaluate(botStep,{god:CFG.god,en:CFG.lang==='en'});
    for(const k of ['welOpen','vilOpen','qAccepted','npcTalk','built','collected','gearOpen','ageOpen','powOpen','fuseOpen','glowOn','stash','wEnter','wGather','wKill','wnDone','fishDone','wArena','rgOpen','door','room','wanted','wvMaze','wvRing','boss','bossDown','lootTxt','back','wDeathTxt','qClaimed'])if(L[k]!=null&&!took[k]){took[k]=1;await shot(k==='welOpen'?'welcome':k==='vilOpen'?'village':k==='lootTxt'?'loot':k==='qAccepted'?'quests':k==='npcTalk'?'npc':k==='wEnter'?'world':k==='wnDone'?'world-npc':k==='fishDone'?'fishing':k==='wDeathTxt'?'world-death':k==='wvMaze'?'arena-maze':k==='wvRing'?'arena-ring':k)}
    if(L.qClaimed!=null||L.t>=CFG.time)break;   // חזרנו לכפר ולקחנו את פרס הקווסט: אין עוד מה לבדוק
  }
  await shot('end');
  {const bs=[['banA','תחילת ריצה'],['banB','מול הבוס']].map(([k,n])=>[n,L[k]]),ok=b=>b&&b.top<=Math.max(b.H*.3,b.hud+12)&&b.bot<=b.H*.45&&!b.hit;   // למעלה, או מיד מתחת ל-HUD כשהוא גבוה (באנגלית השורה נשברת), ולא עד הגיבור באמצע
    check(bs.every(([,b])=>ok(b)),'הודעות בזירה למעלה, לא על הגיבור ולא על הפסים: '+bs.map(([n,b])=>n+' '+(b?b.top+'-'+b.bot+'/'+b.H+' (HUD '+b.hud+')'+(b.hit?', על פס':''):'לא נמדד')).join(', '))}
  {const f=L.fit||{},ks=['level','boss','over'];check(ks.every(k=>f[k]==='בפנים'),'חלונות הזירה בטלפון שוכב, בלי גלילה: '+ks.map(k=>({level:'עליית רמה',boss:'הבוס',over:'מסך הסוף'})[k]+' '+(f[k]||'לא הופיע')).join(', '))}
  check(L.v1&&!L.welFirst&&!L.dailyPop,'ביקור ראשון בכפר: '+(L.welFirst?'"בזמן שלא היית" קפץ, אבל השחקן עוד לא היה כאן':'בלי "בזמן שלא היית"')+(L.dailyPop?', אבל הלוח של 7 ימים קפץ':', והלוח של 7 ימים לא קפץ'));
  check(L.v1&&L.v1.daily&&L.v1.n===1&&L.v1.btn&&L.v1.coins>=L.v1.want,'ביקור ראשון בכפר: '+(L.v1?(L.v1.daily&&L.v1.n===1?'המתנה של היום הראשון נכנסה לתרמיל':'המתנה של היום הראשון לא נלקחה')+(L.v1.btn?', הכפתור 🎁 מוסתר':', הכפתור 🎁 נשאר')+', '+L.v1.coins+' מטבעות':'לא הגענו לכפר'));
  // חוזרים לכפר אחרי זמן: ייצור, מתנה יומית, מתנה מחבר וקווסט מוכן. בלי חלון שקופץ (ניר, 2.11): רק כפתור קטן 📦 בצד, ונגיעה אחת אוספת הכל עם חגיגה אחת
  const wl=await page.evaluate(()=>{const o={};welcomeClose();questLogOpen(false);npcTalk(null);gearClose();
    SAVE.village.center=Math.max(1,vLv('center'));SAVE.village.mill=Math.max(1,vLv('mill'));vSettle('mill');vProd('mill').have={};vProd('mill').t=Date.now()-2*3600e3;
    dailySave().day='';const Q=QS(),q=QUESTS.list.find(q=>!q.giver&&!Q.done[q.id]&&!q.reward.rank&&!q.reward.story&&!qKind(q).talk&&q.obj.every(x=>x.type!=='upgrade'));
    if(q){Q.active[q.id]={p:q.obj.map(x=>x.n)};o.q=q.id}
    bagAdd('stone',3);WELCOME.gifts.push({from:'Orel',res:'stone',n:3,note:0});
    window.__ban0=BANNER.shown;enterVillage();return o});
  // תור קפיצות: בשלוש השניות הראשונות בכפר, לכל היותר חלון אחד בכל רגע, והודעה אחת בכל 2 שניות
  wl.maxWin=0;wl.pop=false;for(let i=0;i<12;i++){await page.clock.runFor(250);
    const r=await page.evaluate(()=>[['ovWelcome','ovDaily','ovVisit','npcDlg','qLog','ovGear'].filter(id=>!document.getElementById(id).hidden).length,!document.getElementById('ovWelcome').hidden]);
    wl.maxWin=Math.max(wl.maxWin,r[0]);wl.pop=wl.pop||r[1]}
  wl.bans=await page.evaluate(()=>BANNER.shown-window.__ban0);
  Object.assign(wl,await page.evaluate(()=>{const o={},kinds=welcomeRows().map(w=>w.kind);o.btn=!document.getElementById('welBtn').hidden;
    o.kinds=kinds.join(',');o.all=['prod','daily','gift','quest'].every(k=>kinds.includes(k));return o}));
  await shot('welcome-back');
  Object.assign(wl,await page.evaluate(q=>{const o={},w0=SAVE.bag.wood||0,fx0=FX.length;
    document.getElementById('welBtn').click();
    o.wood=(SAVE.bag.wood||0)-w0;o.prod=vStock('mill')===0&&o.wood>0;o.daily=!dailyCan();o.quest=!q||!!QS().done[q]&&!QS().active[q];o.fx=FX.length-fx0;
    o.fly=document.querySelectorAll('.welfly').length>0;o.noWin=document.getElementById('ovWelcome').hidden&&S.mode==='play';return o},wl.q));
  await page.clock.runFor(2500);
  Object.assign(wl,await page.evaluate(()=>{const o={},$=id=>document.getElementById(id);
    o.noPop=['ovWelcome','ovDaily','ovVisit','qLog','ovGear'].every(id=>$(id).hidden);
    for(const id in QS().active)if(QBY[id]&&qReady(QBY[id])&&!qKind(QBY[id]).talk)questClaim(id,true);   // קווסט יומי שהאיסוף עצמו השלים: פרס חדש, לא שארית
    o.left=welcomeRows().map(w=>w.kind+':'+w.key).join(',');welcomeBtn();o.gone=$('welBtn').hidden;
    enterVillage();return o}));
  await page.clock.runFor(1500);
  Object.assign(wl,await page.evaluate(()=>({empty:document.getElementById('ovWelcome').hidden&&document.getElementById('welBtn').hidden})));
  check(!wl.pop&&wl.btn&&wl.all,'בזמן שלא היית: חוזרים לכפר, '+(wl.pop?'קפץ חלון (ניר ביקש בלי)':'בלי חלון קופץ')+(wl.btn?', כפתור 📦 בצד עם '+wl.kinds:', אין כפתור 📦')+(wl.all?'':' (חסר משהו מ-prod,daily,gift,quest)'));
  check(wl.maxWin<=1&&wl.bans<=2,'כניסה לכפר: '+(wl.maxWin<=1?'לכל היותר חלון אחד בכל רגע':wl.maxWin+' חלונות יחד')+', '+wl.bans+' הודעות ב-3 שניות (לכל היותר 2)');
  check(wl.prod&&wl.daily&&wl.quest&&wl.fx===1&&wl.fly&&wl.noWin,'בזמן שלא היית: נגיעה ב-📦 '+(wl.prod?'אספה '+wl.wood+' עץ':'לא אספה את הייצור')+(wl.daily?', מתנה יומית':', בלי המתנה היומית')+(wl.quest?', קווסט':', הקווסט לא נלקח')+
    ', '+wl.fx+' חגיגות (צפוי 1)'+(wl.fly?', מספרים עפים':', בלי מספרים עפים')+(wl.noWin?', בלי חלון':', ונפתח חלון'));
  check(wl.noPop&&wl.gone&&wl.empty,'בזמן שלא היית: '+(wl.noPop?'שום חלון לא קפץ אחרי האיסוף':'קפץ חלון אחרי האיסוף')+(wl.gone?', הכפתור נעלם':', הכפתור נשאר ('+wl.left+')')+(wl.empty?', ובלי כלום שמחכה הוא לא מופיע':', והופיע גם בלי כלום שמחכה'));
  // צלילים: כמה פעמים כל צליל התבקש, אם הקבצים נטענו מ-file://, ואם כפתור ההשתקה עובד ונשמר
  // הכפתור פותח את חלון הצלילים: השתקה בתוכו, ועוצמה לכל ערוץ שנשמרת בטלפון
  const au=await page.evaluate(()=>{const $=id=>document.getElementById(id);$('muteBtn').click();const open=!$('ovSound').hidden;
    $('sndMute').click();const m=AUDIO.muted&&localStorage.getItem('zm-mute')==='1';$('sndMute').click();
    const v0=AUDIO.vol.fight,sl=document.querySelector('#ovSound input[data-ch="fight"]');sl.value=30;sl.dispatchEvent(new Event('input'));
    const vSaved=JSON.parse(localStorage.getItem(SOUND_MIX.key)).fight===0.3&&audioPrefsLoad().fight===0.3;setVol('fight',v0);
    $('sndClose').click();const closed=$('ovSound').hidden;
    // כמה פעמים צליל יכול להתנגן בשנייה: מאה בקשות בשנייה אחת, וסופרים כמה עברו
    const rate={};for(const id in SOUNDS){AUDIO.last={};AUDIO.grpLast={};let n=0;for(let i=0;i<100;i++)if(sfxGate(id,1000+i/100))n++;rate[id]=n}
    AUDIO.last={};AUDIO.grpLast={};
    return{count:AUDIO.count,played:AUDIO.played,errors:AUDIO.errors,unlocked:AUDIO.unlocked,ids:Object.keys(SOUNDS),mute:m&&!AUDIO.muted,open,closed,vSaved,rate,
      grp:Object.fromEntries(Object.keys(SOUNDS).map(id=>[id,SOUNDS[id].grp])),loaded:Object.keys(AUDIO.buf).length}});
  // צלילי קרב בכפר ובעולם (where:'fight', audio.js): נמדד כאן, כשהדף עוד פתוח. הבדיקה עצמה בדוח בסוף
  const sg=await page.evaluate(()=>{const o={},c=()=>Object.keys(SOUNDS).filter(id=>SOUNDS[id].where==='fight').reduce((n,id)=>n+(AUDIO.count[id]||0),0),sv=S.vil,sw=S.wd;
    const fire=()=>{const a=c();sfx('ui');sfxCast('fire');sfxCombo('melt');return c()-a};
    try{o.n=Object.keys(SOUNDS).filter(id=>SOUNDS[id].where==='fight').length;S.vil=null;S.wd={};o.world=fire();S.wd=null;S.vil={};o.vil=fire();S.vil=null;o.arena=fire()}catch(err){o.err=String(err)}
    S.vil=sv;S.wd=sw;return o});
  const cp=await page.evaluate(()=>({n:CLOUD.pushes,every:CLOUD.pushEvery}));
  check(cp.n>cl.p0,'ענן: במשחק עצמו נדחפו '+(cp.n-cl.p0)+' שמירות לענן (המדומה), לכל היותר אחת בכל '+cp.every+' שניות');
  // בפעם השנייה מסך הפתיחה מוביל ישר לכפר, בלי בחירת דמות
  const again=await page.evaluate(()=>{document.getElementById('startBtn').click();return document.getElementById('ovHero').hidden&&!!S.vil});
  const heroHp=await page.evaluate(()=>HEROES.list.warrior.passive.hp);
  // הממשק (js/ui.js): בטלפון שוכב ועומד, הכפתורים בפס העליון ובסרגל למטה לא נוגעים זה בזה ולא יוצאים מהמסך,
  // וכל חלון שנפתח נסגר ב-✕ גלוי (44px לפחות) וחוזרים למשחק. גם Esc, לחיצה על הרקע, ונגיעה במשחק
  const UIV={land:CFG.phone,port:{width:412,height:915}},uiR={},uiWel={};let uiNoScroll=null;
  const uiMeasure=place=>{const o0={},vis=e=>{if(!e||e.closest('[hidden]'))return null;const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'?r:null};
    const hit=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1,W=innerWidth,H=innerHeight;
    const box=sel=>[...document.querySelectorAll(sel)].map(e=>({n:e.id||(e.className.split(' ')[0]+(e.dataset.tip?':'+e.dataset.tip:'')),r:vis(e)})).filter(x=>x.r);
    const els=box(place==='world'?'#menuBtn,#muteBtn,.hud .hp,#who,#miniMap,#wBag .res,#wBag .resmore,#nav .nbtn,#guide,#qRail .qr':'#menuBtn,#muteBtn,#who,.dgift,#vTop .nbtn,#vBag .res,#vBag .resmore,#nav .nbtn,#guide,#qRail .qr'),bad=[],off=[];
    els.forEach((a,i)=>els.slice(i+1).forEach(b=>{if(hit(a.r,b.r))bad.push(a.n+'×'+b.n)}));
    for(const x of els)if(x.r.left<-0.5||x.r.right>W+0.5||x.r.top<-0.5||x.r.bottom>H+0.5)off.push(x.n);
    o0.who=!!vis($('who'));o0.res=document.querySelectorAll('#'+(place==='world'?'w':'v')+'Bag .res').length;
    if(place==='world'){const mm=$('miniMap');o0.mini=!!vis(mm);if(o0.mini){mm.click();o0.miniOpen=!$('wMap').hidden&&S.mode==='map';wmapOpen(false)}}   // המפה הקטנה (minimap.js)
    if(place==='world'){const g=$('wGo');o0.gateAuto=!$('wPanel').hidden;o0.goBtn=!!g&&!g.hidden}   // שער: רק עיגול, ולחיצה עליו נכנסת לזירה (לא לוחצים כאן)
    const pid=place==='world'?'wPanel':'vPanel',pn=vis($(pid));if(pn)for(const x of box('#nav .nbtn,#guide'))if(hit(pn,x.r))bad.push(pid+'×'+x.n);
    const win=(open,panel,sel)=>{open();const p=$(panel),b=document.querySelector(sel),r=vis(b),ok=!!r&&r.width>=40&&r.height>=40&&r.left>=0&&r.right<=W&&r.top>=0&&r.bottom<=H&&!p.hidden;
      const why=!ok?(!b?'אין כפתור':!r?'מוסתר':'מקום '+[r.left,r.top,r.width,r.height].map(Math.round).join(',')+(p.hidden?' חלון סגור':'')+(!$('npcDlg').hidden?' שיחה פתוחה':'')+' · רוחב העמוד '+document.documentElement.scrollWidth+'/'+innerWidth+' · רחב מדי: '+[...document.querySelectorAll('body *')].filter(e=>{const q=e.getBoundingClientRect();return q.width>0&&q.right>innerWidth+2&&!e.closest('[hidden]')}).slice(0,4).map(e=>e.id||e.className||e.tagName).join(',')):'';
      if(b)b.click();return !ok?'אין ✕ גלוי ('+why+')':!p.hidden?'לא נסגר':S.mode!=='play'?'מצב '+S.mode:'ok'};
    // גבולות הגודל (docs/plan-hud.md, פרק 3), באחוזים מגובה המסך. בינתיים אזהרה בלבד, כדי ששום PR לא יגדיל משהו בלי שנראה
    const LIM={button:16,pill:9,bar:3.5,window:85},big=[];
    for(const e of document.querySelectorAll('button:not(.skb),.res,.win,.hp')){const r=vis(e);if(!r)continue;   // .skb: הסקיל הראשי גדול בכוונה (--b3)const c=String(e.className),
      k=/\bwin\b/.test(c)?'window':/\bres\b/.test(c)?'pill':/\bhp\b/.test(c)?'bar':e.tagName==='BUTTON'?'button':'';const p=r.height/H*100;
      if(k&&p>LIM[k])big.push((e.id||c.split(' ')[0])+' '+p.toFixed(1)+'%>'+LIM[k])}
    const o={...o0,n:els.length,bad,off,panel:!!pn,big,more:!!document.querySelector('#'+(place==='world'?'w':'v')+'Bag .resmore'),cards:0,wins:{}};
    if(place!=='world'){const ss=[...document.querySelectorAll('#vPanel .bwcols>section')].map(vis);   // השוק נפתח על לשונית המסחר (bwin.js)
      o.cards=document.querySelectorAll('#vPanel .tcard').length;o.cols=ss.length===2&&ss[0]&&ss[1]?(Math.abs(ss[0].top-ss[1].top)<2?2:1):0;
      const tab=t=>{const b=document.querySelector('#vPanel [data-act="tab"][data-tab="'+t+'"]');if(b)b.click();return!!b};
      o.tradeBack=tab('up')&&!!document.querySelector('#vPanel .bwup')&&!document.querySelector('#vPanel .tcard')&&tab('main')&&document.querySelectorAll('#vPanel .tcard').length===o.cards}
    if(place!=='world')o.wins.market=win(()=>{},pid,'#'+pid+' [data-act="close"]');   // בעולם אין כרטיס שער: העיגול נכנס מיד
    o.wins.gear=win(gearOpen,'ovGear','#gearClose');
    o.wins.quests=win(()=>questLogOpen(true),'qLog','#qLog [data-act="close"]');
    o.wins.book=win(()=>bookOpen(true),'bookWin','#bookWin [data-act="close"]');
    if(place==='world'){o.wins.map=win(()=>wmapOpen(true),'wMap','#wMap [data-act="close"]');return o}
    o.wins.forge=win(forgeOpen,'ovForge','#forgeClose');
    const npc=Object.keys(NPC.list).find(npcHere);o.wins.npc=win(()=>npcTalk(npc),'npcDlg','#npcDlg [data-act="close"]');
    gearOpen();dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));keys.Escape=false;o.esc=$('ovGear').hidden&&S.mode==='play';
    gearOpen();const ov=$('ovGear');ov.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));ov.click();o.backdrop=ov.hidden&&S.mode==='play';
    questLogOpen(true);$('c').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:7}));joy=null;o.tapOut=$('qLog').hidden;
    return o};
  // התפריט הראשי (menu.js): ☰ גלוי, הלשוניות לפחות 48 ולא נוגעות ב-✕ של החלון, כל לשונית מחליפה את החלון (רק אחד פתוח), ו-✕, Esc והרקע סוגרים הכל.
  // async: התפריט נסגר אחרי שהחלון נסגר (MutationObserver), אז מחכים רגע לפני שבודקים
  const menuTest=async place=>{const $=id=>document.getElementById(id),tick=()=>Promise.resolve().then(()=>{}),on=()=>document.body.classList.contains('menu'),W=innerWidth,H=innerHeight;
    const vis=e=>{if(!e||e.closest('[hidden]'))return null;const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'?r:null};
    const hit=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1;
    const m={},mb=vis($('menuBtn'));m.btn=!!mb&&mb.width>=44&&mb.height>=44&&mb.right<=W&&mb.top>=0;
    $('menuBtn').click();await tick();m.open=on()&&!!MENU.cur;
    const tabs=[...document.querySelectorAll('#menuRail .mtab')].map(e=>({n:e.id,r:vis(e)})).filter(x=>x.r);
    m.tabs=tabs.length;m.want=place==='world'?6:5;m.small=tabs.filter(x=>x.r.width<48||x.r.height<48).map(x=>x.n);
    m.out=tabs.filter(x=>x.r.left<0||x.r.right>W+0.5||x.r.top<0||x.r.bottom>H+0.5).map(x=>x.n);
    const seen=[];for(const t of MENU.tabs){const b=$(t.id);if(!vis(b))continue;if(MENU.cur!==t.id)b.click();await tick();
      const xr=vis(document.querySelector('#'+t.win+' .wx'));
      const why=$(t.win).hidden?'סגור':MENU.cur!==t.id||!on()?'בלי תפריט':!MENU.tabs.every(u=>u===t||$(u.win).hidden)?'שני חלונות':!xr?'אין ✕':xr.right>W||xr.bottom>H||xr.left<0||xr.top<0?'✕ מחוץ למסך':tabs.some(y=>hit(y.r,xr))?'✕ מתחת ללשונית':'';
      seen.push(t.id.replace('Btn','')+(why?' ('+why+')':''))}
    m.seen=seen.join(', ');m.allOk=!/\(/.test(m.seen);
    const xx=MENU.cur&&document.querySelector('#'+menuTab(MENU.cur).win+' .wx');if(xx)xx.click();await tick();m.xClose=!on()&&S.mode==='play'&&MENU.tabs.every(u=>$(u.win).hidden);
    $('menuBtn').click();await tick();dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));keys.Escape=false;await tick();m.esc=!on()&&S.mode==='play';
    $('menuBtn').click();await tick();$('menuBg').click();await tick();m.bg=!on()&&S.mode==='play';
    // טור הקיצורים (menu.js): אייקון לכל לשונית שמשחקים בה הרבה, 48 לפחות, בתוך המסך ולא על כפתור אחר. כל אחד פותח את הלשונית שלו, ☰ פותח הגדרות,
    // והנקודה האדומה של הלשונית מופיעה על הקיצור שלה (ולא על ☰)
    const rail=[...document.querySelectorAll('#qRail .qr')].map(e=>({n:e.dataset.tab,e,r:vis(e)})).filter(x=>x.r);m.rail=rail.length;m.railWant=place==='world'?4:3;
    const near=[...document.querySelectorAll('#menuBtn,.dgift,#miniMap,#guide,#who,#skills .skb,.qtrack,#nav .nbtn,#vBag .res,#wBag .res')].map(vis).filter(Boolean);
    // אזור הג'ויסטיק (פינה שמאלית תחתונה) ואזור הסקילים (פינה ימנית תחתונה, ui-guide פרק 1): אין שם קיצור
    const joy={left:0,right:W*0.4,top:H-200,bottom:H},skz={left:W-260,right:W,top:H-230,bottom:H};
    m.railBad=rail.filter(x=>x.r.width<48||x.r.height<48||x.r.left<0||x.r.right>W||x.r.top<0||x.r.bottom>H||near.some(q=>hit(q,x.r))||hit(joy,x.r)||place==='world'&&hit(skz,x.r)).map(x=>x.n.replace('Btn',''));
    if(place==='village'&&rail.some(x=>x.r.left<W/2))m.railBad.push('בכפר הטור לא בצד ימין');   // ניר, 4.11: השמאל פנוי לאגודל שמזיז
    // השורה העליונה (#vTop): בכפר מתנה, ביקור, איסוף והאכלה באמצע למעלה. כולם מוצגים לרגע: לא נוגעים זה בזה, בטור, בפס העליון או בקווסט
    if(place==='village'){const ids=['dBtn','visBtn','welBtn','feedBtn'],h0=ids.map(i=>$(i).hidden),fb=$('feedBtn'),f0=fb.innerHTML;
      if(!f0)fb.innerHTML='<span class="ni">🥕</span>';ids.forEach(i=>$(i).hidden=false);
      const tr=ids.map(i=>({n:i,r:vis($(i))})),others=[...document.querySelectorAll('#menuBtn,#who,#guide,#vBag .res,#vBag .resmore,#qRail .qr,#nav .nbtn')].map(e=>({n:e.id||e.className.split(' ')[0],r:vis(e)})).filter(x=>x.r);
      // מה לא בסדר בכל כפתור: מוסתר, קטן, מחוץ למסך, נמוך מדי (מחוץ לשליש העליון, או לחצי בטלפון עומד), או על מה הוא עולה
      const why=(x,i)=>!x.r?'מוסתר':x.r.width<44?'קטן':x.r.top<0||x.r.left<0||x.r.right>W?'בחוץ':x.r.bottom>H*(H>W?0.6:0.3)?'נמוך':
        (others.find(q=>hit(q.r,x.r))||{}).n||(tr.find((y,j)=>j!==i&&y.r&&hit(y.r,x.r))||{}).n||'';
      m.topBad=tr.map((x,i)=>({x,w:why(x,i)})).filter(o=>o.w).map(o=>o.x.n.replace('Btn','')+'('+o.w+')');
      m.feedTop=fb.parentNode.id==='vTop';ids.forEach((i,k)=>$(i).hidden=h0[k]);fb.innerHTML=f0}
    else{m.topBad=[];m.feedTop=$('feedBtn').parentNode.id==='nav'}   // בעולם ההאכלה בסרגל של המקום
    // היררכיה (hudrank.js): הסידור לפי העדיפות, והחשוב הכי קרוב לפינה הימנית התחתונה. לחיצות מוסיפות מעט, ולא מזיזות כפתור למקום אחר
    {const L=hudLayout(),want=place==='village'?{qRail:'gearBtnQ,qBtnQ,bookBtnQ',vTop:'welBtn,feedBtn,dBtn,visBtn,innBtn'}:{qRail:'gearBtnQ,qBtnQ,bookBtnQ,wMapBtnQ'};
      m.rankBad=Object.keys(want).filter(k=>(L[k]||[]).join(',')!==want[k]).map(k=>k+'='+(L[k]||[]).join('/'));
      const rr=[...document.querySelectorAll('#qRail .qr')].map(e=>({id:e.id,r:vis(e)})).filter(x=>x.r),g=rr.find(x=>x.id==='gearBtnQ');
      if(g&&rr.some(x=>x!==g&&(place==='village'?x.r.bottom>g.r.bottom:x.r.right>g.r.right)))m.rankBad.push('דמות לא הכי קרובה לפינה');
      const n=hudUses(),k0=n.visBtn;n.visBtn=1e6;m.useCap=hudScore('visBtn','village')<=HUDRANK.rank.visBtn.village+HUDRANK.use.max;
      const L2=hudLayout();if(place==='village'&&(L2.vTop||[]).indexOf('visBtn')!==3)m.rankBad.push('שימוש הזיז את הביקור');if(k0==null)delete n.visBtn;else n.visBtn=k0;hudLayout()}
    m.railOpen=[];for(const x of rail){x.e.click();await tick();if(MENU.cur!==x.n||$(menuTab(x.n).win).hidden||!on())m.railOpen.push(x.n.replace('Btn',''));menuClose();await tick()}
    $('menuBtn').click();await tick();m.setOnly=MENU.cur==='setBtn';menuClose();await tick();
    const gb=$('gBadge'),h0=gb.hidden;gb.hidden=false;menuDot();m.dot=!document.querySelector('#qRail [data-tab="gearBtn"] .qrdot').hidden&&$('menuBtn').querySelector('b').hidden;gb.hidden=h0;menuDot();
    m.nav=[...document.querySelectorAll('#nav button')].every(b=>b.classList.contains('talkbtn'));   // בסרגל רק כפתורים של המקום
    m.ok=m.btn&&m.open&&m.tabs===m.want&&!m.small.length&&!m.out.length&&m.allOk&&m.xClose&&m.esc&&m.bg&&m.dot&&m.nav&&m.rail===m.railWant&&!m.railBad.length&&!m.railOpen.length&&m.setOnly&&!m.topBad.length&&m.feedTop&&!m.rankBad.length&&m.useCap;return m};
  // חלונות לרוחב (ביקורת 6.11, פריטים 1 ו-9): בחלון פתוח אף שני כפתורים, כותרות או שדות לא יושבים זה על זה, וכרטיס "חדש" (foelore.js) לא מכסה חלון.
  // חפיפה = יותר מ-4px בשני הכיוונים, ולפחות רבע מהשטח של הקטן מהשניים. אלמנט בתוך אלמנט לא נחשב
  // place='village': חלונות המבנים בכפר (vPanel: נפחייה, מכרה, שוק, מחסן) וחלון הנפחייה, ובועת טיפ שלא יושבת עליהם (ביקורת 9.11)
  const winOvl=place=>{const $=id=>document.getElementById(id),o={wins:{},cover:[],open:[]};
    const vis=e=>{if(!e||e.closest('[hidden]'))return null;const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return r.width>2&&r.height>2&&cs.display!=='none'&&cs.visibility!=='hidden'&&+cs.opacity>0.05?r:null};
    const nm=e=>e.id||e.dataset.t||e.dataset.act&&(e.dataset.act+(e.dataset.q?':'+e.dataset.q:''))||(e.textContent||'').trim().slice(0,16)||e.tagName;
    const ovl=root=>{const els=[...root.querySelectorAll('button,input,select,h2,h3,h4,label,.sub>span')].map(e=>({e,r:vis(e)})).filter(x=>x.r),bad=[];
      for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){const a=els[i],b=els[j];if(a.e.contains(b.e)||b.e.contains(a.e))continue;
        const w=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left),h=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);
        if(w>4&&h>4&&w*h>0.25*Math.min(a.r.width*a.r.height,b.r.width*b.r.height))bad.push(nm(a.e)+'×'+nm(b.e))}
      return bad};
    FLC.q=[Object.keys(FOELORE.list)[0]];flCardNext();   // כרטיס "חדש" פתוח בזמן שכל חלון נפתח
    const W=[['settings',()=>$('muteBtn').click(),'ovSound',()=>$('sndClose').click()],['gear',gearOpen,'ovGear',gearClose],
      ['quests',()=>questLogOpen(true),'qLog',()=>questLogOpen(false)],['map',()=>wmapOpen(true),'wMap',()=>wmapOpen(false)],
      ['jump',()=>travelWin(true),'trWin',()=>travelWin(false)]];
    if(place==='village'){W.length=0;const lv0=JSON.stringify(SAVE.village);
      const bOpen=k=>()=>{SAVE.village[k]=Math.max(1,vLv(k));S.vil.ui='';S.vil.open=S.vil.near=k;villageHud()},bClose=()=>{S.vil.open=null;S.vil.ui='';villageHud()};
      for(const k of ['forge','mine','market','stash'])if(VILLAGE.b[k])W.push(['b:'+k,bOpen(k),'vPanel',bClose]);
      W.push(['forgeWin',forgeOpen,'ovForge',forgeClose]);
      // בועת טיפ כשחלון מבנה פתוח: מחכה מתחת לחלון ולא יושבת על הכותרת (firsttips.js tipBusy)
      bOpen('market')();const t0=JSON.stringify(SAVE.tips||null),off0=!!SAVE.tipsOff;SAVE.tipsOff=false;SAVE.tips={};tipClose();TIP1.q=[];
      tipOnce('sklv',['Luna']);for(let i=0;i<3;i++)tipTick(0.25);o.tipUnder=$('tip1').hidden;
      bClose();tipClose();TIP1.q=[];SAVE.tips=JSON.parse(t0);SAVE.tipsOff=off0;
      if(!o.tipUnder)o.open.push('tip on market');
      o.restore=()=>{SAVE.village=JSON.parse(lv0);S.vil.ui=''}}
    for(const [k,open,id,close] of W){open();const p=$(id);if(p.hidden){o.open.push(k);continue}
      if(window.__rkScan)__rkScan();
      const pn=p.matches('.ov')?p.querySelector('.panel,.win')||p:p;o.wins[k]=ovl(pn);
      {const cs=getComputedStyle(pn),hid=pn.scrollHeight>pn.clientHeight+4;   // תוכן חתוך: מתחת לקפל בלי גלילה, או גלילה בלי סימן "יש עוד למטה" (scrollMore, ביקורת 6.11)
        if(hid&&(!/auto|scroll/.test(cs.overflowY)||!pn.classList.contains('more')))(o.cut=o.cut||[]).push(k)}
      flCardVis();const ce=flCardEl(),c=!ce.hidden&&ce.getBoundingClientRect(),r=pn.getBoundingClientRect();if(c&&c.left<r.right&&r.left<c.right&&c.top<r.bottom&&r.top<c.bottom)o.cover.push(k);   // הכרטיס והחלון נכנסים בהדרגה (opacity), אז בודקים רק שהם לא מוסתרים
      close()}
    FLC.q=[];flCardNext();if(S.mode!=='play'&&S.wd)S.mode='play';if(o.restore){o.restore();delete o.restore}return o};
  let winChk=null;
  const uiMenu={};
  for(const nm in UIV){
    await page.setViewportSize(UIV[nm]);
    await page.evaluate(()=>{SAVE.village.market=Math.max(1,vLv('market'));SAVE.village.forge=Math.max(1,vLv('forge'));bagAdd('coins',1300);
      for(const r of Object.keys(RES.list).slice(0,9))bagAdd(r,3);   // יותר משאבים ממה שנכנס לפס, כדי שיופיע "+N"
      const B=VILLAGE.b.market;P.x=B.x;P.y=B.y+B.r+P.r+5;S.cam.x=P.x;S.cam.y=P.y;S.vil.ui='';S.vil.open=S.vil.near='market'});
    await page.clock.runFor(300);
    await shot('ui-market-'+nm);await page.evaluate(()=>gearOpen());await shot('ui-gear-'+nm);await page.evaluate(()=>gearClose());
    // "בזמן שלא היית" בגודל הזה: כל החלון בתוך המסך, והכפתור הגדול נראה (welcome.js)
    uiWel[nm]=await page.evaluate(()=>{dailySave().day='';welcomeOpen();const r=document.getElementById('welWin').getBoundingClientRect(),b=document.querySelector('#welWin [data-act="all"]');
      const br=b&&b.getBoundingClientRect(),o={fit:r.top>=0&&r.left>=0&&r.bottom<=innerHeight&&r.right<=innerWidth,btn:!!br&&br.bottom<=innerHeight&&br.height>=40};return o});
    await shot('ui-welcome-'+nm);await page.evaluate(()=>{welcomeClose();dailySave().day=dailyDay()});
    const v=await page.evaluate(uiMeasure,'village');
    const vm=await page.evaluate(menuTest,'village');
    const winVil=nm==='land'?await page.evaluate(winOvl,'village'):null;
    if(CFG.shots){await page.evaluate(()=>$('menuBtn').click());await shot('ui-menu-'+nm);await page.evaluate(()=>menuClose())}
    await page.evaluate(()=>{leaveVillage();const g=WORLD.gates.grove;P.x=g.x;P.y=g.y+g.r+P.r+2;S.cam.x=P.x;S.cam.y=P.y});   // ליד שער לזירה: העיגול נראה (לחיצה עליו נכנסת מיד)
    await page.clock.runFor(200);
    await shot('ui-world-'+nm);
    const w=await page.evaluate(uiMeasure,'world');
    const wm=await page.evaluate(menuTest,'world');uiMenu[nm]={vm,wm};
    if(nm==='land'){winChk=await page.evaluate(winOvl);for(const k in winVil.wins)winChk.wins[k]=winVil.wins[k];for(const f of ['cover','open','cut'])if(winVil[f])winChk[f]=[...(winChk[f]||[]),...winVil[f]];if(CFG.shots){await page.evaluate(()=>{FLC.q=[Object.keys(FOELORE.list)[0]];flCardNext();$('muteBtn').click()});await shot('win-settings-land');
      await page.evaluate(()=>{$('sndClose').click();wmapOpen(true);flCardVis()});await shot('win-map-card-land');await page.evaluate(()=>{wmapOpen(false);FLC.q=[];flCardNext()})}}
    if(CFG.shots){await page.evaluate(()=>{$('menuBtn').click();$('wMapBtn').click()});await shot('ui-menu-map-'+nm);await page.evaluate(()=>menuClose())}
    await page.evaluate(()=>wHome());await page.clock.runFor(100);   // חזרה הביתה כמו במשחק: worldUi(false) ואז הכפר. בלי זה נשארת על body גם world וכפתורי הכפר מוסתרים
    uiR[nm]={v,w};
    // בלי גלילה (docs/plan-hud.md פרק 5): מסך הנקודות והבובה בחלון הציוד, והשיחה עם תושב (קווסט אחד בכל פעם)
    if(nm==='land')uiNoScroll=await page.evaluate(()=>{const sc=id=>{const e=$(id);return e&&e.scrollHeight>e.clientHeight+4?id+' '+e.scrollHeight+'/'+e.clientHeight:''},o={};
      // חלון הציוד בשני דפים (gear.js): בדף ציוד הבובה והפרטים, בדף דמות הנקודות. בלי גלילה ובלי טקסט חתוך (…), והתרמיל לפחות 4 בשורה
      const cut=()=>[...document.querySelectorAll('#ovGear *')].filter(e=>e.offsetParent&&getComputedStyle(e).textOverflow==='ellipsis'&&e.scrollWidth>e.clientWidth+1).map(e=>e.textContent.trim().slice(0,14));
      gearOpen();GUI.sel=null;gearDraw();o.gear=[sc('gDetail'),sc('gSlots')].filter(Boolean);o.cols=getComputedStyle($('gItems')).gridTemplateColumns.split(' ').length;o.cut=cut();
      $('gPages').querySelector('[data-page="char"]').click();o.gear.push(...[sc('gChar')].filter(Boolean));o.stv=$('ovGear').classList.contains('stv')&&!$('gChar').hidden&&$('ovGear').querySelector('.gbody').hidden;o.cut.push(...cut());gearClose();
      const id=Object.keys(NPC.list).find(npcHere);npcTalk(id);o.npc=sc('npcDlg');o.pager=document.querySelectorAll('#npcDlg .qc').length<=1;npcTalk(null);return o});
  }
  // תמיד מטרה ברורה (guide.js): יש מטרה בשורה למעלה, החץ מצביע לכיוון הנכון גם כשהמטרה באזור אחר, והמטרה מתחלפת כשקווסט נגמר
  const gd=await page.evaluate(()=>{
    const keep=JSON.stringify({q:SAVE.quests,s:SAVE.story}),o={},Q=QS();SAVE.story.intro=true;   // בלי הקדמה של ראש הכפר באמצע (story.js)
    const ang=t=>t?Math.round(Math.atan2(t.y-P.y,t.x-P.x)*100):null;
    const tick=()=>{guideT=0;guideUpdate()};
    questLogOpen(false);gearClose();enterVillage();npcTalk(null);
    for(const id of ['s1Lanterns','s1Bones','s1Shard','s1Path','s1Warden'])delete Q.active[id],delete Q.done[id];Q.track=null;
    qStart(QBY.s1Warden);P.x=0;P.y=0;$('vPanel').hidden=true;$('wPanel').hidden=true;tick();
    const g=VILLAGE.gate,t1=guideTarget(guideG);
    o.vil=!$('guide').hidden&&$('guideTxt').textContent.length>3&&guideG.icon===GUIDE.icon.story;
    o.vilGate=!!t1&&t1.x===g.x&&t1.y===g.y&&ang(t1)===ang(g);o.txt=$('guideTxt').textContent;o.dist=$('guideDist').textContent;
    leaveVillage();P.x=0;P.y=0;$('wPanel').hidden=true;tick();const L=STORY.lanterns.earth,t2=guideTarget(guideG);
    o.lantern=!!t2&&t2.x===L.x&&t2.y===L.y&&ang(t2)===ang(L);
    // שומר חי ליד הפנס וליד השחקן: המרחק אליו, לא לפנס (ניר, 1.11)
    {P.x=L.x+150;P.y=L.y+100;const w=addEnemy('grunt',L.x+60,L.y+40,1);w.warden='earth';const tw=guideTarget(guideG);o.toWarden=!!tw&&tw.x===w.x&&tw.y===w.y;w.dead=true;enemies=enemies.filter(e=>!e.dead);P.x=0;P.y=0}
    worldUi(false);enterWorld('home','lake');P.x=300;P.y=200;tick();const h=WR().home,t3=guideTarget(guideG);   // מהאגם: החץ לשער חזרה לאחו
    o.lakeBack=!!t3&&t3.x===h.x&&t3.y===h.y&&ang(t3)===ang(h)&&/·/.test($('guideTxt').textContent);
    SAVE.story.earth=true;worldUi(false);enterWorld('home','lake');tick();o.jump=$('guideJump').hidden?'':$('guideJump').dataset.to;   // מהאגם, המטרה באחו והפנס שם דולק: "קפוץ"
    SAVE.story.earth=false;worldUi(false);enterWorld('home');tick();const before=guideG.text;
    questEvent('kill','warden');tick();o.claim=guideG.icon===GUIDE.icon.claim;
    SAVE.story.earth=true;questClaim('s1Warden');tick();o.after=guideG.text;o.changed=before!==guideG.text&&guideG.q!=='s1Warden';
    $('guideMin').click();o.min=$('guide').classList.contains('min')&&(t=>t.length>0&&t.split(' ').length<=3)($('guideTxt').textContent);   // מכווצת: 2-3 מילים, לא ריקה$('guideMin').click();
    $('guideMain').click();o.log=!$('qLog').hidden&&!!document.querySelector('#qLog .gnow');questLogOpen(false);
    worldUi(false);startRun();tick();o.arena=$('guide').hidden;
    const k=JSON.parse(keep);SAVE.quests=k.q;k.s.intro=k.s.intro||SAVE.story.intro;SAVE.story=k.s;saveNow();enterVillage();npcTalk(null);   // הקדמה שכבר נאמרה נשארת אמורה. חוזרים לכפר רק אחרי השחזור, אחרת פנס האדמה הדלוק מפעיל שם סיפור (homecoming.js)
    return o});
  // השורה עצמה (בלי פאנל פתוח): לא נוגעת בפס העליון, במפה, בהשתקה ובסרגל, בטלפון שוכב ועומד, בכפר ובעולם
  const gdHit={};
  for(const nm in UIV){await page.setViewportSize(UIV[nm]);
    for(const pl of ['village','world']){
      await page.evaluate(pl=>{questLogOpen(false);if(pl==='world'){leaveVillage();P.x=-300;P.y=-100}else{enterVillage();P.x=0;P.y=60}S.cam.x=P.x;S.cam.y=P.y;guideT=0},pl);
      await page.clock.runFor(200);if(nm==='land'&&pl==='world')await shot('guide-world');
      gdHit[nm+'-'+pl]=await page.evaluate(()=>{const g=$('guide');if(g.hidden)return 'מוסתרת';const r=g.getBoundingClientRect(),bad=[];
        for(const e of document.querySelectorAll('#menuBtn,#muteBtn,.dgift,.hud .hp,#who,#miniMap,#vBag .res,#vBag .resmore,#wBag .res,#wBag .resmore,#nav .nbtn,#vTop .nbtn,#qRail .qr')){if(e.closest('[hidden]'))continue;const q=e.getBoundingClientRect();
          if(q.width&&getComputedStyle(e).display!=='none'&&r.left<q.right-1&&q.left<r.right-1&&r.top<q.bottom-1&&q.top<r.bottom-1)bad.push(e.id||e.className.split(' ')[0])}
        return r.right>innerWidth||r.left<0?'מחוץ למסך':bad.join(',')})}}
  await page.setViewportSize(CFG.phone);await page.evaluate(()=>{enterVillage();npcTalk(null);const g=VILLAGE.gate;P.x=g.x;P.y=g.y-90;S.cam.x=P.x;S.cam.y=P.y});
  // פס המשאבים ליד ☰ (#vBag, #wBag): השבבים יושבים זה ליד זה בלי לעלות אחד על השני, גם עם מספרים ארוכים (8.5K, 12K) ושבב החוק של היום,
  // בטלפון שוכב ובמסך של ניר (OnePlus 15, 2772x1272 = 1386x636), ובמעבר ישר מהכפר לעולם (פס הכפר לא נשאר מתחת לפס העולם)
  const pillBad={};
  for(const [nm,vp] of [['phone',CFG.phone],['nir',{width:1386,height:636}]]){await page.setViewportSize(vp);
    pillBad[nm]=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),out=[];
      try{const ks=Object.keys(RES.list).filter(k=>k!=='coins');SAVE.bag.coins=12345;SAVE.bag[ks[0]]=8500;for(const k of ks.slice(1,5))SAVE.bag[k]=3;
        SAVE.story=SAVE.story||{};if(typeof MUTATION!=='undefined')SAVE.story[MUTATION.after]=true;
        const look=pl=>{const L=[...document.querySelectorAll('#vhud .res,#vhud .resmore,#whud .res,#whud .resmore,#whud .mutchip,#whud .innchip')].filter(e=>!e.closest('[hidden]')&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width)
          .map(e=>({e,r:e.getBoundingClientRect(),n:(e.closest('#vhud')?'v:':'w:')+(e.className.split(' ')[0])+'('+e.textContent.trim().slice(0,6)+')'}));
          const fix=[...document.querySelectorAll('#menuBtn,#miniMap')].filter(e=>!e.closest('[hidden]')&&e.getBoundingClientRect().width).map(e=>({r:e.getBoundingClientRect(),n:e.id}));
          const hit=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1;
          for(let i=0;i<L.length;i++){for(let j=i+1;j<L.length;j++)if(hit(L[i].r,L[j].r))out.push(pl+': '+L[i].n+'×'+L[j].n);
            for(const f of fix)if(hit(L[i].r,f.r))out.push(pl+': '+L[i].n+'×'+f.n);if(L[i].r.left<0||L[i].r.right>innerWidth)out.push(pl+': '+L[i].n+' מחוץ למסך')}
          if(!L.length)out.push(pl+': אין שבבים')};
        enterVillage();for(let i=0;i<5;i++)villageUpdate(1/60);hud();look('village');
        const mf=MUT.force;MUT.force='split';enterWorld('home','meadow');for(let i=0;i<5;i++)worldUpdate(1/60);hud();if(typeof mutHud==='function')mutHud();look('world');MUT.force=mf;
      }catch(err){out.push(String(err&&err.message||err))}
      worldUi(false);SAVE=JSON.parse(bak);enterVillage();return out})}
  await page.setViewportSize(CFG.phone);await page.evaluate(()=>{enterVillage();npcTalk(null);const g=VILLAGE.gate;P.x=g.x;P.y=g.y-90;S.cam.x=P.x;S.cam.y=P.y});
  check(!pillBad.phone.length&&!pillBad.nir.length,'שבבי המשאבים ליד ☰: '+(!pillBad.phone.length&&!pillBad.nir.length?'זה ליד זה בלי חפיפה, עם 12K ו-8.5K ושבב החוק, בטלפון ובמסך של ניר, וגם במעבר ישר מהכפר לעולם':
    'חפיפה: '+[...pillBad.phone.map(x=>'טלפון '+x),...pillBad.nir.map(x=>'ניר '+x)].join(', ')));
  // ניר (31.10.2026): המבוקש נהרג מחוץ לגבולות העולם, והשלל לא נאסף. כאן הוא בורח לקצה ונהרג מעבר לו: הוא נשאר בפנים, והשלל נוחת בפנים ונאסף.
  // וציוד מאויב: פריט שנפל (בכוח) נוחת על הרצפה, נמשך לשחקן ונכנס לתרמיל ולשמירה
  // העלילה, פרק 1 (story.js): ההקדמה אצל ראש הכפר, הרסיס מפיוחו, השומר ליד הפנס, והפנס נדלק
  const sto=await page.evaluate(()=>{
    const o={};SAVE.story={intro:false};questLogOpen(false);gearClose();forgeClose();enterVillage();npcTalk(null);return o});   // בלי חלונות פתוחים, אחרת ההקדמה מחכה (ואם יש, היא מנסה שוב כל שנייה)
  await page.clock.runFor(6000);
  const sto2=await page.evaluate(()=>{
    const o={intro:SAVE.story.intro&&!$('npcDlg').hidden&&$('npcDlg').innerText.includes(T('story.intro').slice(0,12)),dbg:[SAVE.story.intro,$('npcDlg').hidden,S.mode,$('qLog').hidden,$('ovGear').hidden,!!S.vil].join('/')};npcTalk(null);
    const Q=QS();for(const id of ['s1Lanterns','s1Bones','s1Shard','s1Path','s1Warden']){delete Q.done[id];delete Q.active[id]}
    o.offer=qOpen(QBY.s1Lanterns)&&!qOpen(QBY.s1Shard);
    // יוצאים לאחו: הפרס של הקווסט הראשון ניתן במקום, ו"עצמות באחו" מתחיל לבד. שלושה שלדים, והוא נגמר גם במקום
    const c0=SAVE.bag.coins||0;qStart(QBY.s1Lanterns);leaveVillage();o.spot=!!Q.done.s1Lanterns&&!!Q.active.s1Bones&&(SAVE.bag.coins||0)-c0===QBY.s1Lanterns.reward.coins&&QS().track==='s1Bones';
    questEvent('kill','grunt',3);o.bones=!!Q.done.s1Bones&&!!Q.active.s1Shard;delete Q.active.s1Shard;
    qStart(QBY.s1Shard);const p=S.pet||petMake();S.wd.digs0=p.digs;p.digs++;storyUpdate(0.1);o.shard=!!Q.done.s1Shard&&!!Q.active.s1Path;   // הרסיס והשביל: הפרס במקום, והבא מתחיל לבד (בלי לחזור לאבנר)
    qStart(QBY.s1Path);questEvent('kill','grunt',25);o.path=!!Q.done.s1Path&&!!Q.active.s1Warden;
    qStart(QBY.s1Warden);const L=STORY.lanterns.earth;P.x=L.x;P.y=L.y+200;storyUpdate(0.1);const w=S.wd.warden;o.warden=!!w&&w.warden;
    if(w){P.inv=99;damage(w,w.hp*10,'sword',0,'water')}o.ready=qReady(QBY.s1Warden);
    const d0=SAVE.story.earth;questClaim('s1Warden');o.lit=!d0&&SAVE.story.earth;
    enterWorld('home');o.safer=enemies.filter(e=>!e.dead&&e.type==='grunt').every(e=>e.dmg<=ETYPES.grunt.dmg*0.75*0.26+0.001);
    P.inv=0;enterVillage();return o});
  check(sto2.spot&&sto2.bones,'עלילה, פרק 1: '+(sto2.spot?'ביציאה לאחו הפרס ניתן במקום, ו"עצמות באחו" התחיל לבד':'ביציאה לאחו הפרס לא ניתן במקום או שהקווסט הבא לא התחיל')+(sto2.bones?', ואחרי שלושה שלדים הרסיס מתחיל לבד':', ואחרי שלושה שלדים לא התקדם')+(sto2.path?', ועד השומר הכל בעולם':', השביל לא נגמר במקום'));
  check(sto2.path,'עלילה, פרק 1: '+(sto2.path?'25 אויבים: הפרס במקום והשומר מתחיל לבד, בלי לחזור לאבנר':'אחרי 25 אויבים צריך לחזור לאבנר'));
  check(sto2.intro&&sto2.offer&&sto2.shard&&sto2.warden&&sto2.ready&&sto2.lit,'עלילה, פרק 1: '+(sto2.intro?'ההקדמה אצל ראש הכפר':'אין הקדמה ('+sto2.dbg+')')+(sto2.offer?', קווסט ראשון מוצע והבא נעול':', סדר הקווסטים שבור')+
    (sto2.shard?', פיוחו מצאה רסיס':', אין רסיס')+(sto2.warden?', השומר קם ליד הפנס':', השומר לא קם')+(sto2.ready?' והופל':', לא הופל')+(sto2.lit?', הפנס נדלק':', הפנס לא נדלק')+(sto2.safer?', האחו בטוח יותר':''));
  // השומר לא בורח (ניר, 1.11: "ברח לי"): כשמתרחקים הוא ממשיך לרדוף, מוותר רק אחרי כמה שניות רחוק, חוזר בלי להתרפא,
  // ומכה לא דוחפת אותו מחוץ לאזור. וסביב כל פנס שטח פתוח: רחוק מהקצה ומהקישוטים (גבעות ועצים)
  const wch=await page.evaluate(()=>{
    const o={open:[]},CH=STORY.chase;
    for(const k in STORY.lanterns){const L=STORY.lanterns[k];enterWorld('home',L.reg);const {w,h}=WR().size;
      const edge=Math.min(w/2-Math.abs(L.x),h/2-Math.abs(L.y)),dec=Math.min(...worldDecor().map(d=>Math.hypot(d.x-L.x,d.y-L.y)-(d.kind==='hills'?130:0)));
      if(edge<CH.clear||dec<200)o.open.push(k+':'+Math.round(edge)+'/'+Math.round(dec))}
    const Q=QS(),was=Q.active.s1Warden;enemies.length=0;enterWorld('home','meadow');qStart(QBY.s1Warden);
    const L=STORY.lanterns.earth,M=giantLair('earth');P.x=M.x;P.y=M.y+150;P.inv=1e9;storyUpdate(0.1);const e=S.wd.warden;o.warden=!!e;
    if(e){e.rise=0;e.hp=e.max/2;const hp=e.hp,B=placeBox();
      const run=(px,py,sec)=>{for(let t=0;t<sec;t+=0.05){P.x=px;P.y=py;storyWardenMove(e,0.05)}};
      const d0=Math.hypot(e.x-(L.x-600),e.y-(L.y+200));run(L.x-600,L.y+200,3);o.chase=!e.back&&Math.hypot(e.x-P.x,e.y-P.y)<d0-40;     // 600 מהפנס: עוד רודף
      run(L.x-1500,L.y+300,CH.giveUp+1);o.gaveUp=e.back&&e.say>0;                      // רחוק מספיק זמן: חוזר ואומר משהו
      run(L.x-300,L.y+150,0.2);o.back=!e.back;                                         // חוזרים אליו בדרך: הקרב ממשיך
      run(L.x-1500,L.y+300,CH.giveUp+1);run(L.x-1500,L.y+300,60);o.dist=Math.round(Math.hypot(e.x-M.x,e.y-M.y));   // הדרך חזרה איטית (back מהמהירות)
      o.home=Math.hypot(e.x-M.x,e.y-M.y)<20;o.heal=e.hp===e.max&&e.gone&&!S.wd.warden&&!enemies.includes(e);   // הגיע למאורה: מתרפא וחוזר לישון
      P.x=M.x;P.y=M.y+150;storyUpdate(0.05);const e2=S.wd.warden;o.again=!!e2&&e2!==e&&e2.hp===e2.max;                  // מתקרבים: קם שוב
      if(e2){e2.rise=0;e2.kx=9000;for(let t=0;t<0.5;t+=0.05){P.x=L.x;P.y=L.y+150;storyWardenMove(e2,0.05)}o.inside=e2.x>=B.x0&&e2.x<=B.x1&&e2.y>=B.y0&&e2.y<=B.y1;  // מכה חזקה לא מעיפה אותו אל הגבעות
        e2.dead=true;storyUpdate(0.1)}}
    delete STO().bt;
    if(!was)delete Q.active.s1Warden;P.inv=0;enterVillage();return o});
  check(!wch.open.length&&wch.warden&&wch.chase&&wch.gaveUp&&wch.home&&wch.heal&&wch.again&&wch.back&&wch.inside,'השומר לא בורח: '+
    (wch.chase?'רודף כשמתרחקים':'חוזר לפנס מיד כשמתרחקים')+(wch.gaveUp?', מוותר רק אחרי כמה שניות ואומר משהו':', לא מוותר או לא אומר כלום')+
    (wch.back?', הקרב ממשיך כשחוזרים בדרך':', לא חוזר לקרב')+(wch.home&&wch.heal?', במאורה מתרפא וישן':', לא חזר לישון במאורה ('+wch.dist+' ממנה)')+(wch.again?' וקם שוב':', לא קם שוב')+(wch.inside?', נשאר בתוך האזור':', נדחף מחוץ לאזור')+(wch.open.length?', פנס ליד קצה או קישוט: '+wch.open.join(' '):', שטח פתוח סביב כל 6 הפנסים'));
  // הבוסים הענקיים (giant.js, ניר 4.11): כל שומר בעולם הוא ענק עם מודל משלו לפרק, פי 4 עד 6 מהגיבור, ורדיוס לוגי ×GIANT.r.
  // בכניסה הוא קם ולא תוקף, בקרב המכות של הגיבור פוגעות בו, הוא מובס וקורס לאט. בזירה הבוס נשאר LOOK3D.boss
  const gnt=await page.evaluate(()=>{
    const o={rows:[],bad:[],models:new Set()},hp0=P.hp,mx0=P.maxHp,H=lookOf(P).h;
    for(const k in STORY.lanterns){const L=STORY.lanterns[k],W=L.warden;enterWorld('home',L.reg);for(const e of enemies)e.dead=true;enemies=enemies.filter(e=>!e.dead);
      P.x=L.x;P.y=L.y-160;P.maxHp=P.hp=1e9;const e=storyWarden(k,L.y+70),LK=lookOf(e),x=LK?LK.h/H:0,rOk=Math.abs(e.r/(ETYPES[W.type].r*W.r)-GIANT.r)<0.01;
      let h3=null;if(R3D.on&&LK&&R3D.tmpl[LK.model]){syncEnemy(e,0.016);const a=R3D.actors.get(e);if(a){a.root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(a.root);h3=(b.max.y-b.min.y)*COSB()/LK.h}}   // הגובה בתלת-ממד ביחס ל-h
      // כניסה: שנייה ליד הגיבור, בלי מכה
      const woke=e.rise>0;for(let i=0;i<40;i++){P.inv=1e9;worldUpdate(0.025)}const calm=!e.tel&&!e.dash&&!(S.wd.rings||[]).length&&!(S.wd.marks||[]).length;
      // קרב קצר: הגיבור עומד ליד הקצה ותוקף לבד
      for(let i=0;i<160;i++){P.inv=1e9;const a=Math.atan2(P.y-e.y,P.x-e.x);P.x=e.x+Math.cos(a)*(e.r+40);P.y=e.y+Math.sin(a)*(e.r+40);worldUpdate(0.025)}
      const hit=e.hp<e.max;damage(e,e.hp*10,'sword',0,'physical');worldUpdate(0.025);
      const down=e.dead&&!S.wd.warden&&e.fell;let die=null;if(R3D.on){const a=R3D.actors.get(e);if(a){retire(e,a,0.016);die=a.dieT>GIANT.die.t*0.8;retire(e,a,GIANT.die.t)}}
      o.rows.push(k+' '+(LK?LK.model.replace('mon_',''):'-')+' x'+x.toFixed(1)+(h3!=null?' (3D x'+(h3*x).toFixed(1)+')':''));o.models.add(LK&&LK.model);
      if(!e.wboss||!LK||LK===LOOK3D.boss||x<4||x>6||!rOk||(h3!=null&&Math.abs(h3-1)>0.25)||!woke||!calm||!hit||!down||die===false)
        o.bad.push(k+':'+[!e.wboss&&'wboss',(!LK||LK===LOOK3D.boss)&&'look',(x<4||x>6)&&'size',!rOk&&'r',h3!=null&&Math.abs(h3-1)>0.25&&'3d',!woke&&'rise',!calm&&'attack in rise',!hit&&'no hit',!down&&'not down',die===false&&'no collapse'].filter(Boolean).join('/'))}
    o.arena=lookOf({isBoss:true,type:'boss'})===LOOK3D.boss;o.n=o.models.size;delete o.models;
    o.bar=!!giantBar()===false;P.maxHp=mx0;P.hp=hp0;P.inv=0;enterVillage();return o});
  check(!gnt.bad.length&&gnt.n===6&&gnt.arena,'בוסים ענקיים בעולם: '+gnt.rows.join(', ')+(gnt.n===6?' · מודל שונה לכל פרק':' · רק '+gnt.n+' מודלים')+
    (gnt.arena?' · בזירה הבוס הרגיל':' · הבוס בזירה השתנה!')+(gnt.bad.length?' · בעיות: '+gnt.bad.join(' '):' · קמים בלי לתקוף, נפגעים, מובסים וקורסים'));
  // העלילה, פרק 2 (story.js, WORLD.regions.lake): הדרך לאגם סגורה עד שפנס האדמה דולק, באגם יש אויבים רטובים (חלשים לברק),
  // והקווסטים מובילים לשומר המים, שמפיל את פנס המים
  const ch2=await page.evaluate(()=>{
    const o={},Q=QS(),e0=SAVE.story.earth;
    SAVE.story.earth=false;enterWorld('home');o.closed=!wGates().lake;
    SAVE.story.earth=true;enterWorld('home');o.open=!!wGates().lake;SAVE.story.earth=e0||true;
    for(const id of ['s2Mist','s2Glow','s2Warden']){delete Q.done[id];delete Q.active[id]}delete SAVE.story.water;
    o.offer=qOpen(QBY.s2Mist)&&!qOpen(QBY.s2Glow);
    qStart(QBY.s2Mist);wGo('lake');o.reg=S.wd.reg;o.mist=qReady(QBY.s2Mist);questClaim('s2Mist');
    const wet=enemies.filter(e=>!e.dead&&(e.type==='drowned'||e.type==='mistling'));o.foes=wet.length;
    o.weak=wet.some(e=>e.type==='drowned'&&e.weak==='lightning');o.noNpc=Object.keys(wnpcState()).every(k=>WNPC.list[k].reg===S.wd.reg);
    return o});
  await page.clock.runFor(400);await shot('world-lake');
  const ch2b=await page.evaluate(()=>{
    const o={};qStart(QBY.s2Glow);questEvent('kill','drowned',8);questEvent('gather','aquaC',3);o.glow=qReady(QBY.s2Glow);questClaim('s2Glow');
    qStart(QBY.s2Warden);const L=STORY.lanterns.water;P.x=L.x;P.y=L.y+200;storyUpdate(0.1);const w=S.wd.warden;o.warden=!!w&&w.type==='tidewarden';
    if(w){P.inv=99;damage(w,w.hp*10,'sword',0,'lightning');storyUpdate(0.1)}o.ready=qReady(QBY.s2Warden);
    wGo('meadow');o.back=S.wd.reg==='meadow'&&Math.hypot(P.x-WORLD.paths.lake.x,P.y-WORLD.paths.lake.y)<WORLD.arrive+10;
    enterVillage();questClaim('s2Warden');o.lit=!!SAVE.story.water;
    enterWorld('home','lake');o.safer=storySafe()<1;P.inv=0;enterVillage();return o});
  Object.assign(ch2,ch2b);
  check(ch2.closed&&ch2.open&&ch2.offer&&ch2.reg==='lake'&&ch2.mist&&ch2.foes>0&&ch2.weak&&ch2.noNpc&&ch2.glow&&ch2.warden&&ch2.ready&&ch2.back&&ch2.lit,
    'עלילה, פרק 2: '+(ch2.closed&&ch2.open?'הדרך לאגם נפתחת רק אחרי פנס האדמה':'הדרך לאגם לא נשלטת ע"י הפנס')+(ch2.offer?', קווסט ראשון מוצע':', סדר הקווסטים שבור')+
    (ch2.reg==='lake'&&ch2.mist?', הגעה לאגם':', לא הגיע לאגם')+', '+ch2.foes+' אויבים רטובים'+(ch2.weak?' (חלשים לברק)':' (לא חלשים לברק!)')+(ch2.noNpc?'':', דמויות האחו באגם!')+
    (ch2.glow?', מים זוהרים':', קווסט המים שבור')+(ch2.warden?', שומר המים קם':', שומר המים לא קם')+(ch2.ready?' והופל':', לא הופל')+(ch2.back?', חזרה לאחו ליד השביל':', החזרה לאחו שבורה')+
    (ch2.lit?', פנס המים נדלק':', פנס המים לא נדלק')+(ch2.safer?', האגם בטוח יותר':''));
  // העלילה, פרק 3 (story.js, WORLD.regions.ridge): השביל מהאגם לרכס סגור עד שפנס המים דולק, ברכס שלג ואויבים קפואים (חלשים לאש),
  // והקווסטים מובילים לשומר הקרח, שמדליק את פנס הקרח
  const ch3=await page.evaluate(()=>{
    const o={},Q=QS(),w0=SAVE.story.water;
    SAVE.story.water=false;enterWorld('home','lake');o.closed=!wGates().ridge;
    SAVE.story.water=true;enterWorld('home','lake');o.open=!!wGates().ridge;
    for(const id of ['s3Climb','s3Frost','s3Warden']){delete Q.done[id];delete Q.active[id]}delete SAVE.story.ice;
    o.offer=qOpen(QBY.s3Climb)&&!qOpen(QBY.s3Frost);
    qStart(QBY.s3Climb);wGo('ridge');o.reg=S.wd.reg;o.climb=qReady(QBY.s3Climb);questClaim('s3Climb');
    const cold=enemies.filter(e=>!e.dead&&(e.type==='rimeknight'||e.type==='frostwraith'));o.foes=cold.length;
    o.weak=cold.length>0&&cold.every(e=>e.weak==='fire');o.noNpc=Object.keys(wnpcState()).every(k=>WNPC.list[k].reg===S.wd.reg);o.snow=!!WR().snow&&typeof wSnow==='function';
    return o});
  await page.clock.runFor(400);await shot('world-ridge');
  const ch3b=await page.evaluate(()=>{
    const o={};qStart(QBY.s3Frost);questEvent('kill','rimeknight',8);questEvent('gather','sapphireC',3);o.frost=qReady(QBY.s3Frost);questClaim('s3Frost');
    qStart(QBY.s3Warden);const L=STORY.lanterns.ice;P.x=L.x;P.y=L.y+200;storyUpdate(0.1);const w=S.wd.warden;o.warden=!!w&&w.type==='frostwarden';
    if(w){P.inv=99;damage(w,w.hp*10,'sword',0,'fire');storyUpdate(0.1)}o.ready=qReady(QBY.s3Warden);
    wGo('lake');const pr=WORLD.regions.lake.paths.ridge;o.back=S.wd.reg==='lake'&&Math.hypot(P.x-pr.x,P.y-pr.y)<WORLD.arrive+10;
    enterVillage();questClaim('s3Warden');o.lit=!!SAVE.story.ice;
    enterWorld('home','ridge');o.safer=storySafe()<1;P.inv=0;enterVillage();return o});
  Object.assign(ch3,ch3b);
  check(ch3.closed&&ch3.open&&ch3.offer&&ch3.reg==='ridge'&&ch3.climb&&ch3.foes>0&&ch3.weak&&ch3.noNpc&&ch3.snow&&ch3.frost&&ch3.warden&&ch3.ready&&ch3.back&&ch3.lit,
    'עלילה, פרק 3: '+(ch3.closed&&ch3.open?'השביל לרכס נפתח רק אחרי פנס המים':'השביל לרכס לא נשלט ע"י הפנס')+(ch3.offer?', קווסט ראשון מוצע':', סדר הקווסטים שבור')+
    (ch3.reg==='ridge'&&ch3.climb?', הגעה לרכס':', לא הגיע לרכס')+(ch3.snow?' בשלג':', בלי שלג')+', '+ch3.foes+' אויבים קפואים'+(ch3.weak?' (חלשים לאש)':' (לא חלשים לאש!)')+(ch3.noNpc?'':', דמויות האחו ברכס!')+
    (ch3.frost?', ספיר':', קווסט הספיר שבור')+(ch3.warden?', שומר הקרח קם':', שומר הקרח לא קם')+(ch3.ready?' והופל':', לא הופל')+(ch3.back?', חזרה לאגם ליד השביל':', החזרה לאגם שבורה')+
    (ch3.lit?', פנס הקרח נדלק':', פנס הקרח לא נדלק')+(ch3.safer?', הרכס בטוח יותר':''));
  // הרכס הקפוא (ridge-hazards.js): במדרון פס אדום מתמלא ואז כדור שלג מתגלגל, פוגע בשחקן ובאויב, צעד הצידה מתחמק, והוא נגמר בתחתית.
  // באגם הקפוא מחליקים: ממשיכים לגלוש בלי אגודל, ועדיין חוצים אותו
  const rfx=await page.evaluate(()=>{
    const o={},step=(n,f)=>{for(let i=0;i<n;i++)f(1/60)},mk=id=>WR().map.marks.find(m=>m.id===id);
    enterWorld('home','ridge');for(const e of enemies)e.dead=true;enemies=[];
    const s=mk('slide');P.x=s.x;P.y=s.y;P.inv=0;P.hp=P.maxHp;const hp0=P.hp;
    step(120,ridgeUpdate);const R=S.wd.rfx,b=R&&R.list[0];o.warn=!!b&&b.t>0;
    if(b){R.cd=99;b.x=P.x;const e=addEnemy('rimeknight',b.x,P.y-150,1);e.hp=e.max;
      step(240,ridgeUpdate);o.hit=P.hp<hp0&&R.hits===1;o.foe=R.foeHits>0;o.done=R.done>0&&!R.list.length;
      R.cd=0;P.inv=0;step(5,ridgeUpdate);const b2=R.list[0];if(b2){R.cd=99;P.x=b2.x+RIDGEFX.slide.r*3+P.r;step(240,ridgeUpdate)}o.dodge=!!b2&&R.hits===1&&R.done===2;o.n=R.n}
    for(const e of enemies)e.dead=true;P.inv=99;
    const f=mk('frozen');P.x=f.x;P.y=f.y;joy={id:-1,ox:-999,oy:-999,dx:1,dy:0};step(40,worldUpdate);
    joy=null;const x0=P.x;step(30,worldUpdate);o.glide=(S.wd.glide||0)>0&&P.x-x0>5;o.slips=S.wd.slips||0;
    P.x=-1650;P.y=1150;joy={id:-1,ox:-999,oy:-999,dx:1,dy:0};let t=0;while(t<600&&P.x<-650){worldUpdate(1/60);t++}o.cross=P.x>=-650;o.crossT=(t/60).toFixed(1);
    joy=null;P.inv=0;enterVillage();return o});
  check(rfx.warn&&rfx.hit&&rfx.foe&&rfx.done&&rfx.dodge&&rfx.glide&&rfx.cross,
    'הרכס, מפולות והחלקה: '+(rfx.warn?'פס אזהרה לפני המפולת':'אין פס אזהרה!')+(rfx.hit?', פוגעת בשחקן':', לא פוגעת בשחקן!')+(rfx.foe?' ובאויב':', לא פוגעת באויב!')+
    (rfx.done?', נגמרת בתחתית':', לא נגמרת!')+(rfx.dodge?', צעד הצידה מתחמק':', אי אפשר להתחמק!')+' ('+rfx.n+' מפולות)'+
    (rfx.glide?', באגם ממשיכים לגלוש':', באגם לא מחליקים!')+(rfx.cross?', חצייה ב-'+rfx.crossT+' שניות':', לא הצליח לחצות את האגם!'));
  // העלילה, פרק 4 (story.js, WORLD.regions.desert): המעבר מהרכס למדבר סגור עד שפנס הקרח דולק, במדבר חום ואויבים חמים (חלשים למים),
  // שומר האש שולח טבעות אש שמתרחבות (עם פתח), והקווסטים מובילים אליו ולפנס האש
  const ch4=await page.evaluate(()=>{
    const o={},Q=QS();
    SAVE.story.ice=false;enterWorld('home','ridge');o.closed=!wGates().desert;
    SAVE.story.ice=true;enterWorld('home','ridge');o.open=!!wGates().desert;
    for(const id of ['s4Sand','s4Ember','s4Warden']){delete Q.done[id];delete Q.active[id]}delete SAVE.story.fire;
    Q.done.s3Warden=Q.done.s3Warden||1;o.offer=qOpen(QBY.s4Sand)&&!qOpen(QBY.s4Ember);
    qStart(QBY.s4Sand);wGo('desert');o.reg=S.wd.reg;o.sand=qReady(QBY.s4Sand);questClaim('s4Sand');
    const hot=enemies.filter(e=>!e.dead&&(e.type==='cinderscorp'||e.type==='flamewisp'));o.foes=hot.length;
    o.weak=hot.length>0&&hot.every(e=>e.weak==='water');o.noNpc=Object.keys(wnpcState()).every(k=>WNPC.list[k].reg===S.wd.reg);o.heat=!!WR().heat&&typeof wHeat==='function';
    return o});
  await page.clock.runFor(400);await shot('world-desert');
  const ch4b=await page.evaluate(()=>{
    const o={};qStart(QBY.s4Ember);questEvent('kill','cinderscorp',8);questEvent('gather','rubyC',3);o.ember=qReady(QBY.s4Ember);questClaim('s4Ember');
    qStart(QBY.s4Warden);const L=STORY.lanterns.fire;P.x=L.x;P.y=L.y+200;storyUpdate(0.1);const w=S.wd.warden;o.warden=!!w&&w.type==='emberwarden';if(w){w.x=L.x;w.y=L.y+70}   // קם במאורה (GIANT.lair), והבדיקה מקרבת אותו
    if(w){w.rise=0;w.ring=0;P.inv=0;const hp0=P.hp;storyWardenMove(w,0.016);for(let j=0;j<80&&w.tel;j++)storyWardenMove(w,0.016);o.ring=(S.wd.rings||[]).length>0;
      const R=S.wd.rings&&S.wd.rings[0];if(R){R.gap=Math.atan2(P.y-R.y,P.x-R.x)+Math.PI;for(let i=0;i<120&&!R.hit;i++)storyRings(1/60);o.ringHit=R.hit&&P.hp<hp0}
      P.inv=99;damage(w,w.hp*10,'sword',0,'water');storyUpdate(0.1)}o.ready=qReady(QBY.s4Warden);
    wGo('ridge');const pd=WORLD.regions.ridge.paths.desert;o.back=S.wd.reg==='ridge'&&Math.hypot(P.x-pd.x,P.y-pd.y)<WORLD.arrive+10;
    enterVillage();questClaim('s4Warden');o.lit=!!SAVE.story.fire;
    enterWorld('home','desert');o.safer=storySafe()<1;P.inv=0;enterVillage();return o});
  Object.assign(ch4,ch4b);
  check(ch4.closed&&ch4.open&&ch4.offer&&ch4.reg==='desert'&&ch4.sand&&ch4.foes>0&&ch4.weak&&ch4.noNpc&&ch4.heat&&ch4.ember&&ch4.warden&&ch4.ring&&ch4.ringHit&&ch4.ready&&ch4.back&&ch4.lit,
    'עלילה, פרק 4: '+(ch4.closed&&ch4.open?'המעבר למדבר נפתח רק אחרי פנס הקרח':'המעבר למדבר לא נשלט ע"י הפנס')+(ch4.offer?', קווסט ראשון מוצע':', סדר הקווסטים שבור')+
    (ch4.reg==='desert'&&ch4.sand?', הגעה למדבר':', לא הגיע למדבר')+(ch4.heat?' בחום':', בלי חום')+', '+ch4.foes+' אויבים חמים'+(ch4.weak?' (חלשים למים)':' (לא חלשים למים!)')+(ch4.noNpc?'':', דמויות האחו במדבר!')+
    (ch4.ember?', אודם':', קווסט האודם שבור')+(ch4.warden?', שומר האש קם':', שומר האש לא קם')+(ch4.ring?(ch4.ringHit?', טבעת אש פוגעת':', טבעת אש לא פוגעת'):', בלי טבעות אש')+(ch4.ready?' והופל':', לא הופל')+
    (ch4.back?', חזרה לרכס ליד המעבר':', החזרה לרכס שבורה')+(ch4.lit?', פנס האש נדלק':', פנס האש לא נדלק')+(ch4.safer?', המדבר בטוח יותר':''));
  // הבאר היבשה במדבר (desertwell.js): ליד הבאר פיוחו רצה וחופרת, שלל עולה, הבאר יבשה לזמן אמיתי, ובלי חיה שחופרת יש הסבר
  const well=await page.evaluate(()=>{
    const o={},k0=SAVE.pet.kind;SAVE.pet.kind=null;SAVE.well={next:0,n:0};enterWorld('home','desert');P.inv=99;
    const w=wellAt();o.mark=!!w;if(!w){enterVillage();return o}
    P.x=w.x+60;P.y=w.y+40;S.pet=null;petUpdate(0.016);const p=S.pet;p.x=P.x+30;p.y=P.y;p.st='idle';const n0=drops().filter(d=>d.pet).length;
    wellUpdate(0.016);o.went=p.well&&p.st==='go';
    for(let i=0;i<60*12&&SAVE.well.n===0;i++){P.inv=99;petUpdate(1/60);wellUpdate(1/60);if(p.st==='dig')o.dig=true}
    o.dug=SAVE.well.n===1;o.loot=drops().filter(d=>d.pet).length>n0;o.wait=wellLeft()>WELL.wait*0.9;
    p.st='idle';wellUpdate(0.016);o.again=!p.well;
    SAVE.well.next=0;SAVE.pet.kind='parosh';S.wd.well.tip=false;p.st='idle';p.well=false;wellUpdate(0.016);o.hint=S.wd.well.tip&&!p.well;
    SAVE.pet.kind=k0;o.clock=wellClock(5400e3)==='1:30:00';SAVE.well={next:Date.now()+WELL.wait,n:1};enterVillage();return o});
  check(well.mark&&well.went&&well.dig&&well.dug&&well.loot&&well.wait&&well.again&&well.hint&&well.clock,
    'הבאר היבשה במדבר: '+(!well.mark?'אין באר במפה':(well.went?'פיוחו רצה לבאר':'פיוחו לא יצאה לבאר')+(well.dig?', חופרת':', לא חופרת')+(well.dug&&well.loot?', אוצר עלה':', בלי אוצר')+
    (well.wait?', הבאר יבשה לשעתיים':', בלי זמן המתנה')+(well.again?'':', חופרת שוב מיד!')+(well.hint?', הסבר בלי חיה שחופרת':', בלי הסבר')+(well.clock?'':', השעון שבור')));
  // שכבת האפקטים בכפר ובעולם (fxworld.js): כל אפקט במקום שלו, ובלי עומס (סופרים כמה אפקטים פעילים)
  const fxw=await page.evaluate(()=>{
    const o={ids:new Set()},of=fxPlay;window.fxPlay=(id,...a)=>{o.ids.add(id);return of(id,...a)};
    const tick=n=>{for(let i=0;i<n;i++){FXW.t=0;fxwUpdate(1/60)}},walk=n=>{for(let i=0;i<n;i++){P.x+=FXW.step.dist+1;tick(1);P.x-=FXW.step.dist+1;tick(1)}};
    enterVillage();tick(2);
    celebrate(P.x,P.y,'upgrade');o.party=o.ids.has('win_confetti');walk(2);o.stepV=o.ids.has('step_dust');
    const reg={};for(const r of ['ridge','desert','storm']){SAVE.story.ice=true;FXW.gustEnd=0;FXW.gustT=99;enterWorld('home',r);P.inv=99;FXW.t=0;tick(2);walk(2);reg[r]=[...FXW.wxl.keys()].filter(k=>k.startsWith('w:')).map(k=>k.slice(2).replace(/\d.*/,''))}
    o.weather=wxwCore()||reg.ridge.includes('snow')&&(fxwNight()?reg.ridge.includes('aurora'):!reg.ridge.includes('aurora'))&&reg.desert.includes('haze')&&reg.storm.includes('wx_rainheavy');
    o.steps=o.ids.has('step_snow')&&o.ids.has('step_sand');
    walk(400);o.mine=FXW.n;o.cap=FXW.cap;o.all=FXLIB.list.length;o.max=FXLIB.max;   // הרבה הליכה בלי שהזמן עובר: השכבה נעצרת בתקרה
    // באגם על קו המים: אדוות או בועות (בלי הליכה, אז לא מהצעדים). בלב הצל: כוכבים. ובזירה (בלי עולם וכפר): הכל כבה
    enterWorld('home','lake');P.inv=99;tick(1);const b=tWaterNear(P.x,P.y);if(b){P.x=b.x;P.y=b.y}o.ids.delete('water_ripple');o.ids.delete('bubbles_bg');
    for(let i=0;i<20;i++){FXW.shoreT=0;FXW.once.length=0;tick(1)}o.shore=o.ids.has('water_ripple')||o.ids.has('bubbles_bg');
    enterWorld('home','shadow');P.inv=99;tick(1);FXW.ambT=0;FXW.once.length=0;tick(1);o.stars=o.ids.has('stars');
    // 7.11 (הבאנדל): שובל בצבע סוג הנזק על הנפה, ואווירה משלו לכל אזור
    const md=S.mode,wt=P.weapon,pdt=P.dt.sword;S.mode='play';P.weapon='sword';P.dt.sword='fire';P.sw.anim=0;tick(1);P.sw.anim=0.2;tick(1);o.trail=[...o.ids].find(i=>i.startsWith('tr_'))||'';
    o.trailOk=/^tr_(slash|axe|smash)_crimson$/.test(o.trail);   // אש = crimson, בכל סוג נשק קרוב
    o.scene={};for(const r of ['desert','storm','ridge','lake','shadow']){enterWorld('home',r);S.mode='play';P.inv=99;const want=FXW.scene[r].map(e=>e.id);
      for(let i=0;i<12;i++){FXW.sceneT=0;FXW.once.length=0;tick(1)}const wx=id=>[...FXW.wxl.values()].some(h=>h.id===id);if(FXW.gust[r]){FXW.gustT=0;tick(1);tick(1)}   // רכס: משב סופת שלג מחליף את אריחי השלג
      o.scene[r]=want.some(id=>o.ids.has(id)||wx(id))||!!FXW.gust[r]&&wx(FXW.gust[r].to)||wxwCore()&&WXW.reg===r&&!!WEATHER.scenes.world}   // עם ליבת מזג האוויר: גיליונות wx_ ומשב השלג מגיעים ממנה
    o.sceneOk=Object.values(o.scene).every(Boolean);
    // 7.11 (WXW, wxworld.js): מזג האוויר הנכון לכל אזור, סערה שמתקדמת במצבים, כפר עם גשם קל, ומצויר מתחת לאפקטים ולמספרי הנזק
    {const core=wxwCore(),r={},has=id=>[...FXW.wxl.values()].some(h=>h.id===id),run=n=>core&&WX.run[n]&&WX.run[n].state,cfg=n=>core&&WEATHER.scenes[n]||{};
      enterWorld('home','meadow');P.inv=99;tick(1);WXW.t=0;tick(1);r.cycle=WXW.st==='building'&&(!core||run('world')==='building');wxwSet('storm');tick(1);
      r.meadow=core?run('world')==='storm'&&(cfg('world').storm||[]).some(v=>v[0]==='rain_heavy')&&!!cfg('world').ev:has('wx_rainheavy');
      enterWorld('home','ridge');P.inv=99;tick(1);const rc=wxwCfg('ridge');r.ridge=WXW.reg==='ridge'&&(rc.theme==='arctic'||rc.theme==='night')&&rc.storm[0][0]==='snow_blizzard'&&(!core||cfg('world')[`storm`][0][0]==='snow_blizzard');
      enterWorld('home','desert');P.inv=99;tick(1);r.desert=wxwCfg('desert').theme!=='temperate'&&wxwCfg('desert').storm.some(v=>v[0]==='wind_tornado');
      enterWorld('home','storm');P.inv=99;tick(1);r.storm=WXW.st==='storm'&&(!core||run('world')==='storm'&&!!cfg('world').ev.storm.bolt);
      enterVillage();tick(1);wxwSet('storm');tick(1);r.village=core?run('village')==='storm'&&!!cfg('village').ev:has('rain');wxwSet('calm');tick(1);
      // מתחת לקרב: עם הליבה, FXW לא מצייר מזג אוויר משלו (אין אריחי w: ואין משב או הבזק), והליבה מציירת לפני הסקילים (render.js)
      enterWorld('home','storm');P.inv=99;FXW.t=0;tick(2);r.under=core?![...FXW.wxl.keys()].length&&!String(fxDraw).includes('fxwWxDraw'):String(juiceDraw).includes('fxwWxDraw')&&!String(fxDraw).includes('fxwWxDraw');
      o.wxw=r;o.wxwOk=Object.values(r).every(Boolean)}
    const wd=S.wd;S.wd=null;o.ids.clear();P.sw.anim=0;tick(1);P.sw.anim=0.2;tick(1);o.arena=FXW.live.size===0&&FXW.wxl.size===0&&![...o.ids].some(i=>i.startsWith('tr_'));S.wd=wd;
    S.mode=md;P.weapon=wt;P.dt.sword=pdt;
    window.fxPlay=of;o.ids=[...o.ids];enterVillage();return o});
  check(fxw.wxwOk,'מזג אוויר בעולם ובכפר (wxworld.js): '+Object.entries(fxw.wxw||{}).map(([k,v])=>(v?'✓ ':'✗ ')+k).join(' · '));
  check(fxw.party&&fxw.stepV&&fxw.weather&&fxw.steps&&fxw.shore&&fxw.stars&&fxw.arena&&fxw.trailOk&&fxw.sceneOk&&fxw.mine<=fxw.cap&&fxw.all<=fxw.max,
    'אפקטים בכפר ובעולם: '+(fxw.party?'קונפטי בחגיגה':'בלי קונפטי')+
    (fxw.stepV&&fxw.steps?', צעדים לפי הקרקע':', בלי צעדים')+(fxw.weather?', מזג אוויר לפי אזור':', מזג אוויר חסר')+(fxw.shore?', אדוות על קו המים באגם':', בלי אדוות באגם')+(fxw.stars?', כוכבים בלב הצל':', בלי כוכבים בצל')+(fxw.trailOk?', שובל אש על הנפה':', שובל חסר או בצבע לא נכון ('+fxw.trail+')')+(fxw.sceneOk?', אווירה לכל אזור':', אווירה חסרה ב-'+Object.keys(fxw.scene).filter(k=>!fxw.scene[k]).join('/'))+(fxw.arena?', כבוי בזירה':', פועל בזירה!')+', '+fxw.mine+'/'+fxw.cap+' אפקטים של השכבה ('+fxw.all+'/'+fxw.max+' בכל המשחק)');
  // מזג אוויר לכל המשחק (weather.js, אוראל 7.11): setWeather, מכונת המצבים, מצויר מתחת לאפקטים, עוצר בלשונית מוסתרת, ותקרה של שכבות
  const wx=await page.evaluate(()=>{if(typeof WX==='undefined')return{none:1};const o={};try{
    const U0=new Map(WX.user);WX.user.clear();
    const h=setWeather('rain_light','night',0.8,{fade:0.5});o.id=h&&h.id;o.set=!!h&&WX.layers.get('u:main')===h&&h.id==='wx_rain_light_night'&&h.fadeIn===0.5;
    o.fall=(wxRes('rain_torrent','tropical')||'')+','+(wxRes('snow_heavy','night')||'');o.fallOk=/^wx_rain_torrent_/.test(o.fall)&&/,wx_snow_heavy_/.test(o.fall);   // חסר נושא: temperate או הקרוב
    setWeather(null);o.unset=!WX.layers.has('u:main');
    // מכונת המצבים: סצנה עם auto עוברת calm → building → storm → clearing → calm, ו-weatherState מעביר מבחוץ
    weatherScene('wxtest',{auto:true,chance:1,calm:[['wind_breeze',0.5]],building:[['cloud_dark',0.6]],storm:[['rain_heavy',0.8],['storm_cloud',0.5]],clearing:[['rainbow',0.7]]});
    const sc0=WX.scene;WX.scene='wxtest';WX.stat.states.length=0;
    for(let i=0;i<5;i++)wxDrive('wxtest',WX.run.wxtest.t+0.01);o.cycle=WX.stat.states.join('>');o.cycleOk=o.cycle==='building>storm>clearing>calm>building';
    weatherState('storm');o.st=WX.run.wxtest.state;wxSync();o.storm=[...WX.layers.keys()].join(',');o.stOk=o.st==='storm'&&WX.layers.has('s:rain_heavy');
    weatherClear(0.2);o.clear=WX.layers.size===0&&WX.run.wxtest.state==='calm';
    WX.scene=sc0;weatherScene('wxtest',null);
    // תקרה: חמש שכבות מבוקשות, נשארות לכל היותר wxMax
    const vs=['rain_light','snow_light','fog_drift','wind_petals','sun_rays'];for(const v of vs)setWeather(v,'auto',1,{slot:v});wxSync();o.n=WX.layers.size;o.max=wxMax();o.capOk=o.n<=o.max&&WX.layers.size+WX.dying.length<=o.max+1;
    for(const v of vs)setWeather(null,0,0,{slot:v});
    // ברק, הבזק ונקודה
    WX.boltT=WX.flashT=-99;o.bolt=!!weatherBolt(P.x+200,P.y)&&WX.pts.some(p=>/lightning_bolt/.test(p.id));o.pt=!!wxPoint('rain_puddle',P.x,P.y,{size:60});
    // סדר הציור: בפריים אחד, מזג האוויר מצויר לפני fxDraw (האפקטים של הסקילים)
    setWeather('rain_light','auto',0.5);FRAME_T+=16;render();o.under=WX.drawn===FRAME_T&&WX.fxAfter===true;setWeather(null);
    // לשונית מוסתרת: השעון של מזג האוויר עומד ושום דבר לא מצויר
    Object.defineProperty(document,'hidden',{get:()=>true,configurable:true});const c0=WX.clk;FRAME_T+=16;const t1=wxTick();FRAME_T+=500;wxTick();o.pause=t1===false&&WX.clk===c0&&WX.paused;
    delete document.hidden;FRAME_T+=16;wxTick();o.resume=!WX.paused;
    for(const [k,v] of U0)WX.user.set(k,v);
  }catch(e){o.err=e.message}return o});
  check(wx.none||!wx.err&&wx.set&&wx.unset&&wx.fallOk&&wx.cycleOk&&wx.stOk&&wx.clear&&wx.capOk&&wx.bolt&&wx.pt&&wx.under&&wx.pause&&wx.resume,'מזג אוויר: '+(wx.none?'אין weather.js':wx.err?'שגיאה '+wx.err:
    [wx.set&&wx.unset?'setWeather ✓':'setWeather ✗ ('+wx.id+')',wx.fallOk?'חלופה ✓':'חלופה ✗ '+wx.fall,'מצבים '+wx.cycle+(wx.cycleOk?' ✓':' ✗'),wx.stOk?'weatherState ✓':'weatherState ✗ '+wx.st+' '+wx.storm,
     wx.clear?'weatherClear ✓':'weatherClear ✗',wx.under?'מתחת לאפקטים ✓':'מעל האפקטים ✗',wx.pause?'עוצר בלשונית מוסתרת ✓':'לא עוצר ✗',wx.capOk?'תקרה '+wx.n+'/'+wx.max+' ✓':'תקרה ✗ '+wx.n+'/'+wx.max,
     wx.bolt?'ברק ✓':'ברק ✗',wx.pt?'נקודה ✓':'נקודה ✗'].join(' · ')));
  // סבב 2 (fxvil.js, skillcast.js): סימן אחד מעל כל דמות לפי המצב, טקס דרגה עם עמוד אור ומדליה, ומעגל קסם לפי סוג הנזק
  // התמונות נטענות בלי קשר לשעון של הבדיקה (שעומד), אז מחכים להן מבחוץ ולא ב-setTimeout בתוך הדף
  const fxvIds=await page.evaluate(()=>{const N=FXV.npc.ids,ids=[N.turnin,N.quest,N.shop,N.talk,'wrank_burst','wrank_badge',...Object.values(SKCAST.sprite.ids)];fxPreload(ids);return ids});
  for(let i=0;i<60&&!await page.evaluate(ids=>ids.every(id=>fxImg(id)||FXLIB.bad[id]),fxvIds);i++)await new Promise(r=>setTimeout(r,50));
  const fxv=await page.evaluate(ids=>{const o={},bak=JSON.stringify(SAVE);
    try{o.loaded=ids.filter(id=>fxImg(id)).length+'/'+ids.length;
      enterVillage();const all=npcState(),here=Object.keys(all).filter(k=>npcHere(k)),pos=(id,n)=>({x:n.x,y:n.y-80}),seen=FXV.seen.v;
      const other=here.find(k=>!FXV.npc.shop.includes(k)&&!/^v/.test(k)),shop=here.find(k=>FXV.npc.shop.includes(k));
      const st=(mark,near,px)=>{S.vil.npcNear=near;if(px){P.x=px.x;P.y=px.y}fxvNpcIcons(mark,'v',pos);for(const k in mark)fxvMark(mark[k],0,0);return {...seen}};
      const far={x:all[other].x+3000,y:all[other].y};
      o.turn=st({[other]:'✓'},other,far)[other];o.quest=st({[other]:'!'},other,far)[other];o.talk=st({},other,far)[other];o.none=st({},null,far)[other]===undefined;
      o.shop=shop?st({},null,{x:all[shop].x+50,y:all[shop].y})[shop]:'shop';o.shopQuest=shop?st({[shop]:'✓'},shop,{x:all[shop].x+50,y:all[shop].y})[shop]:'turnin';   // מסירה גוברת על חנות ושיחה
      o.one=Object.values(seen).length===Object.keys(seen).length;
      // המצב האמיתי: הסימנים שהציור חישב מהקווסטים, ושום עיגול כהה ישן כשהתמונה נטענה
      S.vil.npcNear=null;drawQuestMarks(0,0);o.real=Object.entries(FXV.seen.v).map(([k,v])=>k+':'+v).join(',');
      // דרגה
      const r0=FXV.stat.rankup,c0=FXLIB.list.length;S.mode='play';celebrate(P.x,P.y,'rankup');o.rankup=FXV.stat.rankup===r0+1&&FXLIB.list.slice(c0).some(f=>f.id==='wrank_burst')&&FXLIB.list.slice(c0).some(f=>f.id==='wrank_badge');
      const r1=FXV.stat.rankup;celebrate(P.x,P.y,'rank');o.lvDiff=FXV.stat.rankup===r1;   // רמה רגילה: בלי עמוד ומדליה
      // מעגל לפי סוג נזק: אותו סקיל עם סוג נזק אחר בכל פעם
      SAVE.hero.level=99;enterWorld('home');enemies=[];const id=S.sk.ids[0],D=SKILLS.list[id],dt0=D.dt;o.circ={};
      for(const dt of ['fire','ice','lightning','earth','water','physical','plant']){D.dt=dt;skCast(id);o.circ[dt]=skcStat.spr||'-';o.mesh=o.mesh||!!(R3D.on&&skcSpr.m&&skcSpr.m.visible)}
      D.dt=dt0;const t0=performance.now();for(let i=0;i<60;i++)skcUpdate(1/60);o.gone=!skcRune&&!(skcSpr.m&&skcSpr.m.visible);
      skCast(id);const t1=performance.now();for(let i=0;i<20;i++){skcDraw()}o.ms=+((performance.now()-t1)/20).toFixed(3);skcFree();skcRune=null;
      const cd=JSON.stringify(o.circ);o.circOk=o.circ.fire==='wcirc_fire'&&o.circ.ice==='wcirc_ice'&&o.circ.lightning==='wcirc_lightning'&&o.circ.earth==='wcirc_earth'&&o.circ.water==='wcirc_water'&&o.circ.physical==='wcirc_phys'&&o.circ.plant==='-';
      const ta=performance.now();for(let i=0;i<200;i++)fxvNpcIcons({},'v',pos);o.iconMs=+((performance.now()-ta)/200).toFixed(3)}
    catch(err){o.err=String(err&&err.stack||err).slice(0,300)}
    SAVE=JSON.parse(bak);enterVillage();return o},fxvIds);
  check(!fxv.err&&fxv.turn==='turnin'&&fxv.quest==='quest'&&fxv.talk==='talk'&&fxv.none&&fxv.shop==='shop'&&fxv.shopQuest==='turnin'&&fxv.rankup&&fxv.lvDiff&&fxv.circOk&&fxv.gone,
    'סימנים, דרגה ומעגלים (סבב 2): '+(fxv.err||('תמונות '+fxv.loaded+', דמות: מסירה='+fxv.turn+' קווסט='+fxv.quest+' שיחה='+fxv.talk+(fxv.none?', בלי מצב בלי סימן':', סימן בלי מצב!')+', סוחרת='+fxv.shop+' ועם מסירה='+fxv.shopQuest+
    ' · בכפר עכשיו: '+(fxv.real||'אין')+' · '+(fxv.rankup?'דרגה: עמוד אור ומדליה':'דרגה בלי עמוד ומדליה!')+(fxv.lvDiff?', רמה רגילה בלעדיהם':', גם ברמה רגילה!')+
    ' · מעגל: '+Object.entries(fxv.circ||{}).map(([k,v])=>k+'→'+v.replace('wcirc_','')).join(' ')+(fxv.mesh?' (תלת-ממד)':'')+(fxv.gone?', נעלם':', לא נעלם!')+' · ציור: עיגול '+fxv.ms+'ms, סימנים '+fxv.iconMs+'ms')));
  // אפקטים של קרב בעולם (fxcombat.js): אזהרה על הרצפה בזמן ההכנה ונעלמת אחריה, פגיעה ומוות לפי סוג הנזק, כרייה, ותקרה לפגיעות בפריים
  await page.evaluate(()=>fxcPreload());
  for(let i=0;i<60&&!await page.evaluate(()=>['wtg_cone','wtg_line','wtg_circle','wtg_circle_big','whit_fire','whit_phys','wko_ice','wmine_stone','wmine_gem_ruby'].every(id=>fxImg(id)));i++)await new Promise(r=>setTimeout(r,150));   // הגיליונות נטענים מהקבצים (שעון אמיתי, לא השעון של הבדיקה)
  const fxc=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),o={};
    try{enterWorld('home');enemies=[];S.mode='play';P.inv=99;const tick=()=>fxcUpdate(1/60),live=h=>!!h&&h.on&&(FXLIB.list.includes(h)||FXC.tgL.includes(h));
      const e=addEnemy('grunt',P.x+60,P.y,1);e.hp=e.max=1e6;
      // מכה מקרוב: משולש בזמן ההכנה, ונעלם כשהיא נגמרת
      e.sw=0.5;e.sa=0;tick();const h1=e.fxTg&&e.fxTg.h;o.cone=!!h1&&h1.id.replace('~t','')==='wtg_cone'&&live(h1)&&fxcTgOn(e);
      e.sw=0;tick();o.coneGone=!e.fxTg&&!live(h1);
      // קפיצה: עיגול במקום הנחיתה. הסתערות: פס וכדור נטען
      e.act='crouch';e.at=e.am=0.7;e.tx=P.x;e.ty=P.y;tick();const h2=e.fxTg&&e.fxTg.h;o.leap=!!h2&&h2.id.replace('~t','')==='wtg_circle'&&Math.abs(h2.x-P.x)<1;
      e.act='wind';e.aa=0;tick();o.charge=!!e.fxTg&&e.fxTg.h.id.replace('~t','')==='wtg_line'&&!!e.fxTg.h2&&!live(h2);
      e.act=null;tick();o.chargeGone=!e.fxTg;
      // עיגול של שומר (S.wd.marks): עיגול גדול למכה הגדולה של ענק
      S.wd.marks=[{x:P.x,y:P.y,t:1,boom:0,k:'bolt',big:true,mk:{r:120,fuse:1,dmg:0,flash:0.3}}];tick();o.big=!!S.wd.marks[0].fxTg&&S.wd.marks[0].fxTg.h.id.replace('~t','')==='wtg_circle_big';S.wd.marks=[];
      // פגיעה לפי סוג: אש = whit_fire, ובמוות מקרח = wko_ice
      const n0=FXC.stat.hit.whit_fire||0;FXC.fr++;damage(e,1,'sword',0,'fire');o.hitFire=(FXC.stat.hit.whit_fire||0)>n0;
      const k0=FXC.stat.ko.wko_ice||0;FXC.fr++;e.hp=1;damage(e,999,'sword',0,'ice');o.koIce=(FXC.stat.ko.wko_ice||0)>k0&&e.dead;
      // תקרה: 12 אויבים נפגעים באותו פריים, לכל היותר FXC.hit.perFrame פיצוצים
      const many=[];for(let i=0;i<12;i++){const f=addEnemy('grunt',P.x+rand(-80,80),P.y+rand(-80,80),1);f.hp=f.max=1e6;many.push(f)}
      const s0=Object.values(FXC.stat.hit).reduce((a,b)=>a+b,0);FXC.fr++;for(const f of many)damage(f,1,'sword',0,'physical');
      o.perFrame=Object.values(FXC.stat.hit).reduce((a,b)=>a+b,0)-s0;o.cap=FXC.hit.perFrame;
      // כרייה: סלע = רסיסים, מרבץ אש = אבן חן אדומה
      const m0=Object.assign({},FXC.stat.mine);nodeDown({kind:'rock',x:P.x,y:P.y,r:24,dead:true});nodeDown({kind:'emberRock',x:P.x,y:P.y,r:24,dead:true});
      o.mineStone=(FXC.stat.mine.wmine_stone||0)>(m0.wmine_stone||0);o.mineGem=(FXC.stat.mine.wmine_gem_ruby||0)>(m0.wmine_gem_ruby||0);
      o.all=FXLIB.list.length;o.max=FXLIB.max;o.img=!!fxImg('wtg_cone');
    }catch(err){o.err=String(err&&err.stack||err).slice(0,200)}
    enemies=[];SAVE=JSON.parse(bak);enterVillage();return o});
  check(!fxc.err&&(!fxc.img||fxc.cone&&fxc.coneGone&&fxc.leap&&fxc.charge&&fxc.chargeGone&&fxc.big&&fxc.hitFire&&fxc.koIce&&fxc.perFrame<=fxc.cap&&fxc.mineStone&&fxc.mineGem)&&fxc.all<=fxc.max,
    'אפקטים של קרב בעולם: '+(fxc.err||(!fxc.img?'הגיליונות לא נטענו, דילגתי':(fxc.cone&&fxc.coneGone?'משולש אזהרה בזמן ההכנה ונעלם אחריה':'אזהרת מכה חסרה או נשארת')+(fxc.leap?', עיגול בקפיצה':', בלי עיגול קפיצה')+(fxc.charge&&fxc.chargeGone?', פס וכדור בהסתערות':', הסתערות בלי סימן')+(fxc.big?', מכ"ם לענק':', בלי מכ"ם לענק')+
    (fxc.hitFire?', פגיעת אש':', בלי פגיעה לפי סוג')+(fxc.koIce?', מוות מקרח':', בלי מוות לפי סוג')+', '+fxc.perFrame+'/'+fxc.cap+' פגיעות בפריים'+(fxc.mineStone&&fxc.mineGem?', רסיסים ואבן חן בכרייה':', כרייה בלי אפקט')))+' ('+fxc.all+'/'+fxc.max+' אפקטים)');
  // קריאות בקרב צפוף (ניר 8.11, docs/combat-feel-2026-11-08.md פרק 3): האזהרה בצבע משלה ומצוירת אחרי הפגיעות והמספרים, משולש קרוב בגודל מינימלי,
  // שמות עמומים ומעט, טיפ מחכה לסוף הקרב, ובעמודת ההודעות הודעה קטנה אחת בקרב (השאר אחרי)
  const crd=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),o={};
    try{enterWorld('home');enemies=[];S.mode='play';msgClear();tipClose();TIP1.q=[];TIP1.pendWin=null;SAVE.tipsOff=false;
      const e=addEnemy('grunt',P.x+60,P.y,1);e.hp=e.max=1e6;e.home=0;e.speed=0;e.dmg=0;e.pname='Test Terror';e.flSeen=true;
      e.sw=0.5;e.sa=0;fxcUpdate(1/60);const h=e.fxTg&&e.fxTg.h;o.img=!!fxImg('wtg_cone');
      o.own=!!h&&FXC.tgL.includes(h)&&!FXLIB.list.includes(h);o.tint=!!h&&h.id==='wtg_cone~t';
      o.size=!!h&&h.size>=FXC.tg.coneMin/FXC.tg.fit.wtg_cone.h-0.01;
      const seq=[],fd=fxDraw,fc=fxcTgDraw,jd=juiceDraw,t0=FXC.stat.top,l0=LABELS.stat.fight;
      fxDraw=function(){seq.push('fx');return fd.apply(this,arguments)};fxcTgDraw=function(){seq.push('tg');return fc.apply(this,arguments)};juiceDraw=function(){seq.push('juice');return jd.apply(this,arguments)};
      S.cam.x=P.x;S.cam.y=P.y;try{render()}finally{fxDraw=fd;fxcTgDraw=fc;juiceDraw=jd}
      const ti=seq.indexOf('tg');o.top=ti>seq.lastIndexOf('fx')&&ti>seq.indexOf('juice')&&FXC.stat.top>t0;o.seq=seq.join('>');
      o.lbl=LABELS.stat.fight>l0;
      FLC.q=[];flCardNext();nemCardOff();MUT.bar=null;if(typeof skgOfferClose==='function')skgOfferClose();   // פסים אחרים שמעכבים טיפ גם בלי קרב (כמו בבדיקת הטיפים)
      delete tipSeen().inn;tipOnce('inn');tipTick(0.25);o.tipHeld=!(TIP1.on&&TIP1.on.k==='inn')&&TIP1.q.some(x=>x.k==='inn');
      o.lane=msgOn();if(o.lane){banner('one',C.gold);banner('two',C.gold);banner('three',C.gold);o.laneFight=MQ.rows.length}
      e.sw=0;fxcUpdate(1/60);for(const f of enemies)f.dead=true;enemies=[];
      tipTick(0.25);o.tipAfter=!!TIP1.on&&TIP1.on.k==='inn';o.tipWhy=tipBusy()?'busy':'q='+TIP1.q.map(x=>x.k);
      if(o.lane){msgPump();o.laneAfter=MQ.rows.length}
    }catch(err){o.err=String(err&&err.stack||err).slice(0,200)}
    tipClose();TIP1.q=[];msgClear();enemies=[];SAVE=JSON.parse(bak);enterVillage();return o});
  check(!crd.err&&(!crd.img||crd.own&&crd.tint&&crd.size&&crd.top)&&crd.lbl&&crd.tipHeld&&crd.tipAfter&&(!crd.lane||crd.laneFight===1&&crd.laneAfter===3),
    'Combat readability: '+(crd.err||((!crd.img?'sheets not loaded, warning skipped':(crd.own&&crd.tint?'warning in its own colour':'warning colour/list wrong!')+(crd.size?', cone min size':', cone too small!')+(crd.top?', drawn on top':', NOT on top ('+crd.seq+')'))+
    (crd.lbl?', names dimmed in fight':', names not dimmed!')+(crd.tipHeld&&crd.tipAfter?', tip waits for fight end':', tip shown mid-fight or lost! ('+crd.tipHeld+' '+crd.tipWhy+')')+
    (crd.lane?(crd.laneFight===1&&crd.laneAfter===3?', 1 message in fight then 3':', messages in fight '+crd.laneFight+'/'+crd.laneAfter+'!'):', lane off'))));
  // תחושת איסוף (gather.js, ניר 8.11): חורשות, מכה מתיזה עם תקרה, המקור מתכווץ, עץ מתנדנד ונופל, קרב קודם, השלל עף לגיבור ונאסף,
  // נבט שגדל בזמן הצמיחה, צמיחה מחדש שמתחילה קטנה, ובזירה כלום לא משתנה. מזל משלה (Math.random מוחלף ומוחזר): לא מזיז את ה-seed לבדיקות שאחריה
  const gat=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),R0=Math.random,o={};let sd=4242;
    Math.random=()=>(sd=(sd*16807)%2147483647)/2147483647;
    try{SAVE.fxLess=false;enterWorld('home');enemies=[];S.mode='play';P.inv=99;const st=GATHER.stat,s0=Object.assign({},st),sh=n=>wKind(n.kind).shape;
      const live=S.nd.list.filter(n=>!n.dead),trees=live.filter(n=>sh(n)==='tree'),tree=trees[0],rock=live.find(n=>['rock','vein','crystal'].includes(sh(n)));
      o.grove=Math.round(100*trees.filter(t=>trees.some(u=>u!==t&&Math.hypot(u.x-t.x,u.y-t.y)<160)).length/Math.max(1,trees.length));
      P.x=rock.x-rock.r-P.r-10;P.y=rock.y;gUpdate(1/60);gHit(rock,0);o.chips=st.chips-s0.chips;
      for(let i=0;i<5;i++)gHit(rock,0);o.perFrame=st.chips-s0.chips;o.cap=GATHER.chip.perFrame;
      rock.hp=rock.max*0.2;for(let i=0;i<60;i++)gUpdate(1/60);o.shrink=gScale(rock)<0.75;
      gHit(tree,0);o.sway=!!tree.gHitT;
      const foe={x:P.x+30,y:P.y,r:12,dead:false};enemies=[foe];o.foeFirst=aimTarget(999)===foe;enemies=[];o.node=aimTarget(999)===rock;
      const bag0=Object.values(SAVE.bag).reduce((a,b)=>a+b,0);
      rock.hp=0;nodeDown(rock);o.fly=st.fly-s0.fly;o.cleared=GATHER.from===null;
      // נראה בטלפון (ניר 9.11: "רק כמה אבנים קטנות"): התנפצות עם רסיסים, חתיכות בגודל של לפחות 4 פיקסלים במסך, מצוירות על הקנבס גם בתלת-ממד,
      // השלל מחכה רגע לפני שהוא נמשך, והרסיסים נמשכים לגיבור
      o.burst=st.burst-s0.burst;o.px=Math.round(GATHER.chip.size[0]*ZOOM*10)/10;o.r3d=R3D.on;const dr0=st.drawn;render();o.drawn=st.drawn-dr0;
      for(let i=0;i<18;i++){dropsUpdate(1/60);gUpdate(1/60);wLootIn()}o.early=st.take-s0.take;
      for(let i=0;i<120;i++){dropsUpdate(1/60);gUpdate(1/60);wLootIn()}o.pulled=st.pulled-s0.pulled;
      o.take=st.take-s0.take;o.bag=Object.values(SAVE.bag).reduce((a,b)=>a+b,0)>bag0;
      tree.hp=0;nodeDown(tree);o.fell=st.fell-s0.fell;
      tree.back=tree.regrow*0.5;o.sprout=Math.abs(gSprout(tree)-0.5)<0.01;
      tree.back=0;tree.dead=false;tree.hp=tree.max;gUpdate(1/60);o.regrow=st.regrown>s0.regrown&&gScale(tree)<0.6;
      const wd=S.wd,a0=JSON.stringify(st),d={r:'stone',n:1,fly:false,t:0,vz:100};S.wd=null;
      try{gHit(rock,0);gDown(rock);gDown(null);gSpawn(d);gTake({gth:1,r:'stone',n:1})}finally{S.wd=wd}
      o.arena=JSON.stringify(st)===a0&&!d.fly&&!d.gth;
    }catch(err){o.err=String(err&&err.stack||err).slice(0,200)}
    finally{Math.random=R0}
    enemies=[];SAVE=JSON.parse(bak);enterVillage();return o});
  check(!gat.err&&gat.grove>=60&&gat.chips>0&&gat.burst>0&&gat.px>=4&&gat.drawn>0&&gat.early===0&&gat.pulled>0&&gat.perFrame<=gat.cap&&gat.shrink&&gat.sway&&gat.foeFirst&&gat.node&&gat.fly>0&&gat.cleared&&gat.take>0&&gat.bag&&gat.fell>0&&gat.sprout&&gat.regrow&&gat.arena,
    'תחושת איסוף: '+(gat.err||('חורשות '+gat.grove+'% מהעצים עם שכן'+(gat.chips>0?', מכה מתיזה '+gat.chips+' חתיכות':', מכה בלי חתיכות!')+' ('+gat.perFrame+'/'+gat.cap+' בפריים)'+
    (gat.shrink?', סלע מתכווץ':', לא מתכווץ')+(gat.sway?', עץ מתנדנד':', בלי נדנוד')+(gat.foeFirst&&gat.node?', אויב קודם למקור':', עדיפות שגויה!')+
    (gat.fly>0&&gat.take>0&&gat.bag?', השלל עף ונאסף ('+gat.take+')':', השלל לא נאסף!')+(gat.fell>0?', עץ נופל':', לא נופל')+(gat.sprout&&gat.regrow?', נבט וצמיחה מחדש':', בלי צמיחה')+(gat.arena?', בזירה בלי שינוי':', הזירה השתנתה!')+
    (gat.burst>0&&gat.drawn>0&&gat.px>=4?', התנפצות נראית ('+(gat.r3d?'3D':'2D')+', חתיכה '+gat.px+'px)':', התנפצות לא נראית! ('+gat.burst+'/'+gat.drawn+'/'+gat.px+'px)')+
    (gat.early===0&&gat.pulled>0?', שלל מחכה ונמשך ('+gat.pulled+' רסיסים)':', שלל נאסף מיד או רסיסים לא נמשכו!'))));
  // מומחיות איסוף (gmastery.js): דרגה 1 = הקצב של היום, נקודות מכל מקור שנשבר, דרגה חדשה עם חגיגה, שלל נמשך מרחוק, מקור צמוד, מכה חזקה, נצנוץ,
  // חלון הדמות, שמירה, ובזירה בלי שינוי. מזל משלה, כמו הבדיקה שלפניה
  const gmr=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),R0=Math.random,o={};let sd=777;
    Math.random=()=>(sd=(sd*16807)%2147483647)/2147483647;
    try{SAVE.gm={wood:0,stone:0,plant:0};enterWorld('home');enemies=[];S.mode='play';P.inv=99;const G=GMASTERY,st=G.stat,up0=st.up,sh=n=>wKind(n.kind).shape;
      const trees=S.nd.list.filter(n=>!n.dead&&sh(n)==='tree'),t=trees.find(a=>trees.some(b=>b!==a&&Math.hypot(a.x-b.x,a.y-b.y)-a.r-b.r<=G.near.r));
      const nb=trees.find(b=>b!==t&&Math.hypot(t.x-b.x,t.y-b.y)-t.r-b.r<=G.near.r);o.pair=!!(t&&nb);
      t.hp=nb.hp=1e4;gHit(t,0,10);o.t1=gmTier('wood')===1&&t.hp===1e4&&nb.hp===1e4&&gmMagnet('wood')===1;
      for(let i=0;i<G.at[1];i++)gmGain(t);o.t2=gmTier('wood')===2&&st.up===up0+1&&SAVE.gm.wood===G.at[1];
      o.magnet=gmMagnet('wood')===G.magnet.k&&gmMagnet('stone')===1;
      SAVE.gm.wood=G.at[2];gHit(t,0,10);o.t3=nb.hp===1e4-10&&t.hp===1e4;
      SAVE.gm.wood=G.at[3];t.hp=nb.hp=1e4;gHit(t,0,10);o.t4=t.hp===1e4-10*(G.power.k-1)&&nb.hp===1e4-10*G.power.k;
      SAVE.gm.wood=G.at[4];o.t5=gmTier('wood')===5&&gmGlint(t,2)===G.glint.col&&!gmGlint(t,1);
      o.win=gStatPanel().includes('gmrow')&&gmHtml().includes(T('gm.wood')+': '+T('gm.lv',5));o.blank=saveBlank().gm.wood===0;
      const wd=S.wd,g0=JSON.stringify(SAVE.gm),h0=t.hp;S.wd=null;
      try{gmGain(t);gHit(t,0,10);o.arena=JSON.stringify(SAVE.gm)===g0&&t.hp===h0&&gmMagnet('wood')===1}finally{S.wd=wd}
    }catch(err){o.err=String(err&&err.stack||err).slice(0,200)}
    finally{Math.random=R0}
    enemies=[];SAVE=JSON.parse(bak);enterVillage();return o});
  check(!gmr.err&&gmr.pair&&gmr.t1&&gmr.t2&&gmr.magnet&&gmr.t3&&gmr.t4&&gmr.t5&&gmr.win&&gmr.blank&&gmr.arena,
    'מומחיות איסוף: '+(gmr.err||((gmr.t1?'דרגה 1 בקצב של היום':'דרגה 1 שונה!')+(gmr.t2?', עלייה לדרגה 2 עם חגיגה ושמירה':', בלי עלייה')+(gmr.magnet?', שלל נמשך מרחוק':', בלי משיכה')+
    (gmr.t3?', מכה גם בעץ צמוד':gmr.pair?', בלי צמוד':', לא נמצאו עצים צמודים')+(gmr.t4?', מכה חזקה':', בלי מכה חזקה')+(gmr.t5?', נצנוץ זהב':', בלי נצנוץ')+(gmr.win?', בחלון הדמות':', לא בחלון הדמות')+
    (gmr.blank?', בשמירה':', לא בשמירה')+(gmr.arena?', בזירה בלי שינוי':', הזירה השתנתה!'))));
  // כלי איסוף ביד (gtool.js): דרגה 1 בקצב של היום, דרגה גבוהה מכה חזק יותר, מתכת קשה עם כלי חלש לאט (לא חסום), הכלי ביד, תנאי נפחייה ומומחיות,
  // שדרוג עם שעון שנגמר, הלשונית בנפחייה, השלט בכפר, שמירה, ובזירה בלי שינוי
  const gtr=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),o={};
    try{SAVE.gt={axe:1,hammer:1,job:{}};SAVE.gm={wood:0,stone:0,plant:0};enterWorld('home');enemies=[];S.mode='play';P.inv=99;const G=GTOOL,sh=n=>wKind(n.kind).shape;
      const t=S.nd.list.find(n=>!n.dead&&sh(n)==='tree');o.tree=!!t;
      t.hp=1e4;gHit(t,0,10);o.t1=t.hp===1e4&&gtHeld()==='axe';
      SAVE.gt.axe=3;t.hp=1e4;gHit(t,0,10);o.t3=t.hp===1e4-10*(G.tiers[3].pow-1);
      const v={node:true,kind:'silver',x:t.x+2000,y:t.y,r:24,hp:1e4};o.metal=gtOf(v)==='hammer';
      gHit(v,0,10);o.slow=v.hp===1e4+10*(1-G.slow)&&gtHeld()==='hammer';
      SAVE.gt.hammer=G.hard.silver;v.hp=1e4;gHit(v,0,10);o.hard=v.hp===1e4-10*(G.tiers[G.hard.silver].pow-1);
      SAVE.gt={axe:1,hammer:2,job:{}};const lv=SAVE.village.forge;SAVE.village.forge=1;o.bForge=gtBlock('axe')==='forge';
      SAVE.village.forge=5;o.bGm=gtBlock('hammer')==='gm';for(const r in G.cost[2])SAVE.bag[r]=(SAVE.bag[r]||0)+G.cost[2][r];
      o.start=gtStart('axe')&&!!gtJob('axe')&&gtTier('axe')===1&&gtBlock('axe')==='job'&&gtLeft('axe')>0;
      o.sign=(gtSign()||'').startsWith('⏳');
      SAVE.gt.job.axe.end=Date.now()-1;const d0=G.stat.done;gtTick();o.done=gtTier('axe')===2&&!gtJob('axe')&&G.stat.done===d0+1;
      AUI.tab='tool';gtDraw();o.tab=document.querySelectorAll('#fItems .gtcard').length===2;SAVE.village.forge=lv;
      if(R3D.on){const L=heroLook();o.look=!!(L.props.tool_axe&&L.props.tool_hammer)}else o.look=true;
      o.blank=saveBlank().gt.axe===1;
      const wd=S.wd;S.wd=null;try{SAVE.gt.axe=5;t.hp=1e4;P.gtHold=null;gHit(t,0,10);o.arena=t.hp===1e4&&!gtHeld()}finally{S.wd=wd}
    }catch(err){o.err=String(err&&err.stack||err).slice(0,200)}
    enemies=[];SAVE=JSON.parse(bak);P.gtHold=null;AUI.tab='age';enterVillage();return o});
  check(!gtr.err&&gtr.tree&&gtr.t1&&gtr.t3&&gtr.metal&&gtr.slow&&gtr.hard&&gtr.bForge&&gtr.bGm&&gtr.start&&gtr.sign&&gtr.done&&gtr.tab&&gtr.look&&gtr.blank&&gtr.arena,
    'כלי איסוף: '+(gtr.err||((gtr.t1?'דרגה 1 בקצב של היום והגרזן ביד':'דרגה 1 שונה!')+(gtr.t3?', דרגה 3 חזקה יותר':', בלי חיזוק')+(gtr.slow?', כסף עם פטיש חלש לאט':', כסף חסום או רגיל!')+
    (gtr.hard?', ובפטיש מתאים רגיל':', פטיש מתאים לא עוזר')+(gtr.bForge&&gtr.bGm?', תנאי נפחייה ומומחיות':', תנאים שגויים')+(gtr.start&&gtr.sign?', שעון ושלט בכפר':', השעון לא התחיל')+
    (gtr.done?', השעון נגמר והדרגה עלתה':', הדרגה לא עלתה')+(gtr.tab?', לשונית בנפחייה':', אין לשונית')+(gtr.look?', הכלים בדמות בתלת-ממד':', אין כלים בתלת-ממד')+(gtr.blank?', בשמירה':', לא בשמירה')+(gtr.arena?', בזירה בלי שינוי':', הזירה השתנתה!'))));
  // לולאת הכפר, שלב 1 (docs/concept-village-loop.md): הכלי מכפיל את החומר הראשי (לא את הנדירים), כלי חלש מדי = חצי שלל ולאט (רך, לא חסום),
  // רמות 4-5 של מבנים עולות ×1.3 עץ ואבן, ויעד ליד המשאבים: 📌 בכפר, שבב בעולם, ⌂ וחגיגה כשיש הכל
  const vlr=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),o={};
    try{SAVE.gt={axe:1,hammer:1,job:{}};enterWorld('home');enemies=[];S.mode='play';const G=GTOOL;
      const tr={node:true,kind:'tree',x:0,y:0,r:28,hp:1},ir={node:true,kind:'iron',x:0,y:0,r:24,hp:1},D=NODES.kinds.tree.drop,DI=NODES.kinds.iron.drop;
      o.y1=gtDrop(tr,D)===D;
      SAVE.gt.axe=5;const d5=gtDrop(tr,D);o.y5=d5.wood[1]===D.wood[1]*G.tiers[5].yld&&d5.resin[1]===D.resin[1]&&d5.resin[0]===D.resin[0];
      const w=gtDrop(ir,DI);o.weak=gtWeak(ir)&&w.iron[1]===Math.max(1,DI.iron[1]*G.half)&&gtPow(ir)<1;
      SAVE.gt.hammer=2;o.ok=!gtWeak(ir)&&gtDrop(ir,DI).iron[1]>=DI.iron[1];
      const wd=S.wd;S.wd=null;try{o.arena=gtDrop(tr,D)===D}finally{S.wd=wd}
      // מקור משאבים לא מראה "עמיד": הכלי קובע, לא סוג הנזק. אויב כן
      const rn=S.nd.list.find(n=>!n.dead);if(juiceOn()&&rn){juiceHit(rn,3,0.5,false,Object.keys(DMG.types)[0],0);const a=juice().n[juice().n.length-1];o.nores=!(a&&a.e===rn&&a.res)}else o.nores=true;
      const raw=VILLAGE.b.forge.cost;o.late=vCostAt('forge',4).wood===Math.ceil(raw[4].wood*VILLAGE.late.k)&&vCostAt('forge',3).wood===raw[3].wood&&vCostAt('forge',4).iron===raw[4].iron;
      SAVE.gt.hammer=1;AUI.tab='tool';GT_SEL='hammer';gtDraw();o.opens=!!document.querySelector('#fItems .gtopen')&&!!document.querySelector('#fDetail [data-act="pinT"]');
      // יעד: מסמנים את השוק, בלי עץ ואבן. השבב מראה את מה שחסר, פועם באיסוף, ומסמן ⌂ כשיש הכל
      const lv=SAVE.village.market,lc=SAVE.village.center;SAVE.village.center=Math.max(2,lc||0);SAVE.village.market=1;SAVE.bag.wood=0;SAVE.bag.stone=0;
      goalS().pin=null;goalS().hit=null;goalPin({k:'market'});o.pin=goalPinned({k:'market'});
      const sh=goalShow();o.miss=!!sh&&!sh.done&&(sh.r==='wood'||sh.r==='stone')&&sh.need===vCost('market')[sh.r];
      GOALW.t=0;GOALW.key='';goalUpdate(0.1);const chip=document.getElementById('goalChip');o.chip=!!chip&&!chip.hidden&&chip.textContent.includes(T('vil.market'))&&chip.textContent.includes('/'+sh.need)&&!chip.querySelector('b');   // לא b: שם האזור (‎.whud b‎) נעלם אחרי 5 שניות
      const p0=GOAL.stat.pulse;SAVE.bag[sh.r]=1;GOALW.t=0;goalUpdate(0.1);o.pulse=GOAL.stat.pulse===p0+1;
      const c=vCost('market');for(const r of GOAL.res)if(c[r])SAVE.bag[r]=c[r];const d0=GOAL.stat.done;GOALW.t=0;goalUpdate(0.1);o.done=GOAL.stat.done===d0+1&&chip.textContent.includes('⌂');
      GOALW.t=0;goalUpdate(0.1);o.once=GOAL.stat.done===d0+1;
      goalPin({k:'market'});o.unpin=!goalS().pin&&!!goalNow();
      o.blank=saveBlank().goal&&saveBlank().goal.pin===null;
      SAVE.village.market=lv;SAVE.village.center=lc;
    }catch(err){o.err=String(err&&err.stack||err).slice(0,200)}
    enemies=[];SAVE=JSON.parse(bak);AUI.tab='age';const ch=document.getElementById('goalChip');if(ch)ch.hidden=true;enterVillage();return o});
  check(!vlr.err&&vlr.nores&&vlr.y1&&vlr.y5&&vlr.weak&&vlr.ok&&vlr.arena&&vlr.late&&vlr.opens&&vlr.pin&&vlr.miss&&vlr.chip&&vlr.pulse&&vlr.done&&vlr.once&&vlr.unpin&&vlr.blank,
    'לולאת הכפר: '+(vlr.err||((vlr.y1?'כלי 1 בלי שינוי':'כלי 1 שינה שלל!')+(vlr.y5?', כלי 5 מכפיל את העץ ולא את השרף':', בלי הכפלה')+(vlr.weak?', ברזל עם פטיש 1: חצי ולאט':', כלי חלש לא רך!')+
    (vlr.ok?', פטיש 2: מלא':', פטיש 2 לא עוזר')+(vlr.arena?', בזירה בלי שינוי':', הזירה השתנתה!')+(vlr.nores?', בלי "עמיד" על מקורות':', "עמיד" על מקור!')+(vlr.late?', רמה 4 ×1.3 עץ':', מחיר רמה 4 שגוי')+(vlr.opens?', מה נפתח ו-📌 בנפחייה':', אין "נפתח" או 📌')+
    (vlr.pin&&vlr.miss?', יעד מסומן ומה חסר':', היעד שגוי')+(vlr.chip?', שבב בעולם':', אין שבב')+(vlr.pulse?', פועם באיסוף':', לא פועם')+(vlr.done&&vlr.once?', ⌂ וחגיגה פעם אחת':', בלי ⌂ או חגיגה כפולה')+
    (vlr.unpin?', ביטול סימון':', הסימון נתקע')+(vlr.blank?', בשמירה':', לא בשמירה'))));
  // לולאת הכפר, שלב 2 (vproj.js): החוצבת בכפר → סדנה בשלושה שלבים → המחצבה העמוקה נפתחת (או ברמה 10), עם מקורות שצומחים מהר, והחלפה טובה יותר
  const vpr=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),o={};
    try{const V=VPROJ,id='cutterShop',pl='deepQuarry',Q=QS();SAVE.vproj={st:{},seen:{}};SAVE.hero.level=1;delete Q.done[RESID.list.cutter.last];
      o.away=!vpTab('cutter')&&vpBlock(id)==='away';
      Q.done[RESID.list.cutter.last]=1;o.tab=!!vpTab('cutter')&&npcSvcs('vcutter').some(t=>t.id==='proj')&&vpTab('cutter').html().includes('data-act="vp"');
      enterWorld('home');enemies=[];S.mode='play';VPW.t=0;vpUpdate(1);o.closed=!vpOpen(pl)&&!S.nd.list.some(n=>n.vp);
      SAVE.bag.stone=0;goalS().pin=null;goalPin({p:id});const sh=goalShow();o.goal=!!sh&&sh.g.p===id&&!!vpCost(id)[sh.r];
      SAVE.bag.stone=0;o.cost=vpBlock(id)==='cost'&&!vpBuild(id);
      for(const c of V.list[id].stages){for(const r in c)SAVE.bag[r]=(SAVE.bag[r]||0)+c[r];vpBuild(id)}
      o.done=vpDone(id)&&vpStage(id)===3&&V.stat.build>=3&&resGet('cutter').iron===V.list[id].get.iron;
      const o0=V.stat.open;VPW.t=0;vpUpdate(1);const add=S.nd.list.filter(n=>n.vp===pl);
      o.nodes=add.length>=5&&add.every(n=>n.regrow===30)&&add.some(n=>n.kind==='silver')&&V.stat.open===o0+1&&SAVE.vproj.seen[pl]===1;
      VPW.t=0;vpUpdate(1);o.once=S.nd.list.filter(n=>n.vp===pl).length===add.length&&V.stat.open===o0+1;
      SAVE.vproj={st:{},seen:{}};SAVE.hero.level=V.places[pl].lv;o.lv=vpOpen(pl);
      o.blank=!!saveBlank().vproj;
    }catch(err){o.err=String(err&&err.stack||err).slice(0,200)}
    enemies=[];SAVE=JSON.parse(bak);goalS().pin=null;enterVillage();return o});
  check(!vpr.err&&vpr.away&&vpr.tab&&vpr.closed&&vpr.goal&&vpr.cost&&vpr.done&&vpr.nodes&&vpr.once&&vpr.lv&&vpr.blank,
    'סדנת החוצבת: '+(vpr.err||((vpr.away?'נסגר עד שהחוצבת בכפר':'פתוח בלי החוצבת!')+(vpr.tab?', לשונית בשיחה':', אין לשונית')+(vpr.closed?', המחצבה העמוקה סגורה':', פתוחה מההתחלה!')+(vpr.goal?', יעד 📌':', בלי יעד')+
    (vpr.cost?', חסום בלי אבן':', נבנה בלי אבן!')+(vpr.done?', 3 שלבים והחלפה טובה יותר':', לא הושלם')+(vpr.nodes?', נפתחה עם מקורות מהירים וחגיגה':', לא נפתחה')+(vpr.once?', פעם אחת':', כפול!')+(vpr.lv?', או ברמה 10':', לא ברמה 10')+(vpr.blank?', בשמירה':', לא בשמירה'))));
  // לולאת הכפר, שלב 3 (services.js): הנפח נותן כוח לבחירה, הזמנה רביעית בלוח הפונדק עם פרס ×1.25 שנוטה ליעד, והשוק משלם יותר על המשפחה של היום
  const svr=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),o={};
    try{const V=SVC;SAVE.svc={n:0,day:'',fam:{}};
      // הנפח
      SAVE.village.forge=V.smith.forge-1;const id=Object.keys(GEAR.recipes).find(k=>{const it=gItem(k);return it&&powFor(it.slot).length>=2});
      o.off=svcPicks(id).length===0&&svcCraftId(id)===id;
      SAVE.village.forge=V.smith.forge;const ps=svcPicks(id);SVC_PICK=ps[1];const got=svcCraftId(id);o.smith=ps.length===2&&gPow(got)===ps[1]&&svcPicks(id)[0]!==ps[0]&&svcSmithHtml(id).includes('data-act="smithP"');
      // הפונדק
      SAVE.village.inn=V.order.inn-1;IN().day=null;o.three=!innRoll().includes('iOrder');
      SAVE.village.inn=V.order.inn;IN().day=null;delete QS().active.iOrder;const ids=innRoll(),q=QBY.iOrder,r=q.obj[0].what;
      o.four=ids.length===INN.board+1&&ids.includes('iOrder')&&q.obj[0].type==='gather'&&q.obj[0].n===V.order.what[r].n&&q.reward.coins===Math.round(V.order.reward.coins*V.order.k);
      // השוק: אבן נשברה הכי הרבה היום
      SAVE.village.market=Math.max(1,SAVE.village.market||0);const p0=vPrice('stone','sell'),w0=vPrice('wood','sell'),b0=vPrice('stone','buy');
      enterWorld('home');const rk=S.nd.list.find(n=>gmFam(n)==='stone');svcNode(rk);svcNode(rk);
      o.trade=svcFam()==='stone'&&svcSellK('stone')===1+V.trade.bonus&&svcSellK('wood')===1&&vPrice('wood','sell')===w0&&vPrice('stone','buy')===b0&&svcTradeLine().includes(T('gm.stone'));
      o.trade=o.trade&&vPrice('stone','sell')>p0&&vPrice('stone','sell')<b0;   // לפחות מטבע אחד יותר, ותמיד פחות מקנייה
      o.blank=!!saveBlank().svc;
    }catch(err){o.err=String(err&&err.stack||err).slice(0,200)}
    enemies=[];SAVE=JSON.parse(bak);SVC_PICK=null;enterVillage();return o});
  check(!svr.err&&svr.off&&svr.smith&&svr.three&&svr.four&&svr.trade&&svr.blank,
    'שירותי הכפר: '+(svr.err||((svr.off?'נפחייה נמוכה בלי כוח':'כוח בנפחייה נמוכה!')+(svr.smith?', הנפח נותן את הכוח שבחרת':', הכוח לא לפי הבחירה')+(svr.three?', פונדק נמוך: 3':', הזמנה בפונדק נמוך!')+
    (svr.four?', הזמנה רביעית ×1.25':', בלי הזמנה')+(svr.trade?', אבן של היום ביותר בשוק':', השוק לא משתנה')+(svr.blank?', בשמירה':', לא בשמירה'))));
  // העלילה, פרק 5 (story.js, WORLD.regions.storm): השביל מהמדבר למגדלים סגור עד שפנס האש דולק, במגדלים גשם, ברקים ומגדלים שבורים שאי אפשר לעבור,
  // אויבים מחושמלים (חלשים לאדמה), ושומר הסערה מסמן עיגולי ברק שמתפוצצים אחרי שנייה: מי שנשאר נפגע, מי שזז לא
  const ch5=await page.evaluate(()=>{
    const o={},Q=QS();
    SAVE.story.fire=false;enterWorld('home','desert');o.closed=!wGates().storm;
    SAVE.story.fire=true;enterWorld('home','desert');o.open=!!wGates().storm;
    for(const id of ['s5Climb','s5Spark','s5Warden']){delete Q.done[id];delete Q.active[id]}delete SAVE.story.bolt;
    Q.done.s4Warden=Q.done.s4Warden||1;o.offer=qOpen(QBY.s5Climb)&&!qOpen(QBY.s5Spark);
    qStart(QBY.s5Climb);wGo('storm');o.reg=S.wd.reg;o.climb=qReady(QBY.s5Climb);questClaim('s5Climb');
    const zap=enemies.filter(e=>!e.dead&&(e.type==='stormknight'||e.type==='sparkwisp'));o.foes=zap.length;
    o.weak=zap.length>0&&zap.every(e=>e.weak==='earth');o.noNpc=Object.keys(wnpcState()).every(k=>WNPC.list[k].reg===S.wd.reg);
    const tw=(WR().towers||[])[0];o.storm=!!WR().storm&&typeof wStorm==='function'&&!!tw;
    if(tw){P.x=tw.x+3;P.y=tw.y;wPonds(P);o.solid=Math.hypot(P.x-tw.x,P.y-tw.y)>=tw.r}
    return o});
  await page.clock.runFor(400);await shot('world-storm');
  const ch5b=await page.evaluate(()=>{
    const o={};qStart(QBY.s5Spark);questEvent('kill','stormknight',8);questEvent('gather','boltC',3);o.spark=qReady(QBY.s5Spark);questClaim('s5Spark');
    qStart(QBY.s5Warden);const L=STORY.lanterns.bolt;P.x=L.x;P.y=L.y+200;storyUpdate(0.1);const w=S.wd.warden;o.warden=!!w&&w.type==='stormwarden';if(w){w.x=L.x;w.y=L.y+70}   // קם במאורה (GIANT.lair), והבדיקה מקרבת אותו
    if(w){w.rise=0;const mk=L.warden.marks;w.marks=0;P.inv=0;const hp0=P.hp;storyWardenMove(w,0.016);const M=S.wd.marks||[];o.marks=M.length===mk.n&&M.some(m=>Math.hypot(m.x-P.x,m.y-P.y)<1);
      for(let i=0;i<120;i++)storyMarks(1/60);o.markHit=M.some(m=>m.hit)&&P.hp<hp0;
      S.wd.marks=[];w.marks=0;P.inv=0;storyWardenMove(w,0.016);const M2=S.wd.marks.slice();P.x+=mk.spread+mk.r*3;
      for(let i=0;i<120;i++)storyMarks(1/60);o.dodge=M2.length>0&&!M2.some(m=>m.hit)&&!S.wd.marks.length;
      P.inv=99;damage(w,w.hp*10,'sword',0,'earth');storyUpdate(0.1)}o.ready=qReady(QBY.s5Warden);
    wGo('desert');const pd=WORLD.regions.desert.paths.storm;o.back=S.wd.reg==='desert'&&Math.hypot(P.x-pd.x,P.y-pd.y)<WORLD.arrive+10;
    enterVillage();questClaim('s5Warden');o.lit=!!SAVE.story.bolt;
    enterWorld('home','storm');o.safer=storySafe()<1;P.inv=0;enterVillage();return o});
  Object.assign(ch5,ch5b);
  check(ch5.closed&&ch5.open&&ch5.offer&&ch5.reg==='storm'&&ch5.climb&&ch5.foes>0&&ch5.weak&&ch5.noNpc&&ch5.storm&&ch5.solid&&ch5.spark&&ch5.warden&&ch5.marks&&ch5.markHit&&ch5.dodge&&ch5.ready&&ch5.back&&ch5.lit,
    'עלילה, פרק 5: '+(ch5.closed&&ch5.open?'השביל למגדלים נפתח רק אחרי פנס האש':'השביל למגדלים לא נשלט ע"י הפנס')+(ch5.offer?', קווסט ראשון מוצע':', סדר הקווסטים שבור')+
    (ch5.reg==='storm'&&ch5.climb?', הגעה למגדלים':', לא הגיע למגדלים')+(ch5.storm?' בסערה':', בלי סערה')+(ch5.solid?', מגדל חוסם':', עוברים דרך מגדל')+', '+ch5.foes+' אויבים מחושמלים'+(ch5.weak?' (חלשים לאדמה)':' (לא חלשים לאדמה!)')+(ch5.noNpc?'':', דמויות האחו במגדלים!')+
    (ch5.spark?', ברק גולמי':', קווסט הברק שבור')+(ch5.warden?', שומר הסערה קם':', שומר הסערה לא קם')+(ch5.marks?(ch5.markHit?', עיגול ברק פוגע':', עיגול ברק לא פוגע')+(ch5.dodge?' ומי שזז ניצל':', ואי אפשר להתחמק'):', בלי עיגולי ברק')+(ch5.ready?' והופל':', לא הופל')+
    (ch5.back?', חזרה למדבר ליד השביל':', החזרה למדבר שבורה')+(ch5.lit?', פנס הברק נדלק':', פנס הברק לא נדלק')+(ch5.safer?', המגדלים בטוחים יותר':''));
  // נהר הברקים (storm-river.js): במעבר האבנים אזהרה לפני כל ברק, מי שנשאר נפגע ומי שמחכה לא, והמחזור חוזר. הגשר בטוח, נגיעה בנהר פוגעת ונהדפים, ברק במים נגמר, ואויב נפגע
  const rz=await page.evaluate(()=>{
    const o={};enterWorld('home','storm');S.mode='play';const keep=enemies.find(e=>!e.dead&&!e.isBoss);for(const e of enemies)if(e!==keep)e.dead=true;enemies=keep?[keep]:[];if(keep){keep.x=0;keep.y=-1700}
    const M=TR.map,f=M.fords[0],b=M.bridges[0],F=RIVERZAP.ford,cyc=F.calm+F.warn+F.hit,st=rzState(),fs=st.ford[0],dt=1/60,full=()=>{P.hp=P.maxHp;P.inv=0};
    // מעבר האבנים: עומדים באמצע
    P.x=f.x;P.y=f.y;full();fs.ph=0;fs.struck=false;st.next=1e9;let tW=-1,tH=-1,back=false;
    for(let i=0;i<cyc*2/dt;i++){riverUpdate(dt);st.next=1e9;const t=i*dt;if(tW<0&&fs.ph>F.calm&&!fs.struck)tW=t;if(tH<0&&P.hp<P.maxHp)tH=t;if(tH>=0&&!fs.struck&&fs.ph<F.calm)back=true}
    o.zone=rzFordZone(f,f.x,f.y,12);o.warn=tW>=0&&tH>=0?+(tH-tW).toFixed(2):-1;o.fordHit=tH>=0;o.ends=back;
    // מחכים על הגדה, לא נפגעים. והבוט מחכה בזמן אזהרה
    P.x=-1400;P.y=0;full();fs.ph=0;fs.struck=false;let hit=false;for(let i=0;i<cyc/dt;i++){riverUpdate(dt);st.next=1e9;if(P.hp<P.maxHp)hit=true}o.wait=!hit;
    const fe=tFree({x:f.x,y:f.y-118});fs.ph=F.calm+0.2;fs.struck=false;const ux=(f.x-fe.x)/Math.hypot(f.x-fe.x,f.y-fe.y),uy=(f.y-fe.y)/Math.hypot(f.x-fe.x,f.y-fe.y);
    o.botWait=rzWait(fe,ux,uy);fs.ph=0.1;o.botGo=!rzWait(fe,ux,uy);
    // הגשר בטוח, גם עם ברקים במים
    P.x=b.x;P.y=b.y;full();st.next=0;hit=false;for(let i=0;i<6/dt;i++){riverUpdate(dt);fs.ph=0.1;if(P.hp<P.maxHp)hit=true}o.bridge=!hit;
    // הגדה: הולכים אל הנהר. נפגעים, נהדפים, לא בכל פריים, ולא נתקעים
    const s=rzSegs(M).find(q=>q.ax===500),mx=(s.ax+s.bx)/2,my=(s.ay+s.by)/2,nx=-(s.by-s.ay)/s.len,ny=(s.bx-s.ax)/s.len;
    P.x=mx+nx*130;P.y=my+ny*130;P._tx=P.x;P._ty=P.y;full();let hits=0,last=P.hp;
    for(let i=0;i<3/dt;i++){P.x-=nx*3;P.y-=ny*3;wPonds(P);riverUpdate(dt);st.next=1e9;if(P.hp<last-0.01)hits++;last=P.hp;P.inv=0}
    o.bank=hits;o.free=!tBlocked(P.x,P.y);
    // ברק במים ליד השחקן: נוצר, מכה ונגמר
    st.bolts=[];st.next=0;riverUpdate(dt);o.bolt=st.bolts.length;for(let i=0;i<2/dt;i++){riverUpdate(dt);st.next=1e9}o.boltEnd=!st.bolts.length;
    // אויב במעבר נפגע
    if(keep){keep.x=f.x;keep.y=f.y;keep.hp=keep.max;P.x=-1400;P.y=0;fs.ph=F.calm+F.warn-0.01;fs.struck=false;riverUpdate(dt);riverUpdate(dt);o.foe=keep.hp<keep.max||keep.dead}
    P.x=f.x;P.y=f.y-150;fs.ph=F.calm+F.warn*0.6;fs.struck=false;st.next=1e9;return o});
  await page.clock.runFor(100);await shot('world-storm-river');
  check(rz.zone&&rz.warn>=0.5&&rz.fordHit&&rz.ends&&rz.wait&&rz.botWait&&rz.botGo&&rz.bridge&&rz.bank>=1&&rz.bank<=4&&rz.free&&rz.bolt&&rz.boltEnd&&rz.foe,
    'נהר הברקים: '+(rz.fordHit?'ברק מכה במעבר האבנים, '+(rz.warn>=0.5?rz.warn+' שניות אחרי האזהרה':'בלי אזהרה מספיקה ('+rz.warn+')'):'ברק לא פוגע במעבר')+(rz.ends?', והמחזור חוזר':', המחזור לא חוזר')+(rz.wait?', מי שמחכה על הגדה בטוח':', נפגעים גם על הגדה!')+
    (rz.botWait&&rz.botGo?', הבוט מחכה לפני מכה ועובר אחריה':', הבוט לא מתזמן')+(rz.bridge?', הגשר בטוח':', נפגעים על הגשר!')+', נגיעה בנהר: '+rz.bank+' פגיעות ב-3 שניות'+(rz.free?' ולא נתקעים':' ונתקעים בנהר!')+
    (rz.bolt&&rz.boltEnd?', ברק במים מכה ונגמר':', אין ברקים במים')+(rz.foe?', אויבים נפגעים':', אויבים לא נפגעים'));
  await page.evaluate(()=>{P.inv=0;enterVillage()});
  // העלילה, פרק 6 והאחרון (story.js, WORLD.regions.shadow): השביל ללב הצל נפתח רק כשכל חמשת הפנסים דולקים, שם חושך וצללים עם חומרים מעורבבים.
  // הצל לומד את סוג הנזק שהכי השתמשת בו בעולם ועובר בחמישה שלבים (שומר אחרי שומר, עם ההתקפה שלו). אחרי הניצחון: הפנס הלבן, הריעות בכפר ו"תודה ששיחקת"
  const ch6=await page.evaluate(()=>{
    const o={},Q=QS();
    Object.assign(SAVE.story,{earth:true,water:true,ice:false,fire:true,bolt:true});enterWorld('home','storm');o.closed=!wGates().shadow;
    SAVE.story.ice=true;enterWorld('home','storm');o.open=!!wGates().shadow;
    for(const id of ['s6Dark','s6Echo','s6Heart']){delete Q.done[id];delete Q.active[id]}delete SAVE.story.light;delete SAVE.story.end;
    Q.done.s5Warden=Q.done.s5Warden||1;o.offer=qOpen(QBY.s6Dark)&&!qOpen(QBY.s6Echo);
    qStart(QBY.s6Dark);wGo('shadow');o.reg=S.wd.reg;o.dark=qReady(QBY.s6Dark);questClaim('s6Dark');
    const sh=enemies.filter(e=>!e.dead&&(e.type==='shadeknight'||e.type==='shadewisp'));o.foes=sh.length;
    o.mixed=['shadeknight','shadewisp'].every(t=>(ETYPES[t].tags||[]).length>1);
    o.noNpc=Object.keys(wnpcState()).every(k=>WNPC.list[k].reg===S.wd.reg);o.shadow=!!WR().shadow&&typeof wShadow==='function';
    qStart(QBY.s6Echo);questEvent('kill','shadeknight',6);questEvent('kill','shadewisp',6);o.echo=qReady(QBY.s6Echo);questClaim('s6Echo');
    return o});
  await page.clock.runFor(400);await shot('world-shadow');
  const ch6b=await page.evaluate(()=>{
    const o={};STO().use={fire:5000,water:10};   // "השתמשת" הכי הרבה באש
    qStart(QBY.s6Heart);const L=STORY.lanterns.light;P.x=L.x;P.y=L.y+200;storyUpdate(0.1);const w=S.wd.warden;o.warden=!!w&&w.type==='shade';if(w){w.x=L.x;w.y=L.y+70}   // קם במאורה (GIANT.lair), והבדיקה מקרבת אותו
    if(w){w.rise=0;P.inv=99;o.learn=w.res==='fire';const seen=[];let res=true;
      for(const f of [0.9,0.7,0.5,0.3,0.1]){w.hp=w.max*f;storyWardenMove(w,0.016);seen.push(w.pk);res=res&&w.mult.fire<1}
      o.phases=seen.join(',');o.allPhases=o.phases===STORY.lanterns.light.warden.phases.join(',');o.learnAll=res;
      w.hp=w.max*0.7;storyWardenMove(w,0.016);w.shoot=0;const eb0=eb.length;storyWardenMove(w,0.016);for(let j=0;j<80&&w.tel;j++)storyWardenMove(w,0.016);o.shoot=eb.length>eb0;
      w.hp=w.max*0.3;storyWardenMove(w,0.016);w.ring=0;storyWardenMove(w,0.016);for(let j=0;j<80&&w.tel;j++)storyWardenMove(w,0.016);o.ring=(S.wd.rings||[]).some(r=>r.k==='fire');
      w.hp=w.max*0.1;storyWardenMove(w,0.016);w.marks=0;storyWardenMove(w,0.016);for(let j=0;j<80&&w.tel;j++)storyWardenMove(w,0.016);o.marks=(S.wd.marks||[]).some(m=>m.k==='bolt');
      S.wd.rings=[];S.wd.marks=[];damage(w,w.max*10,'sword',0,'water');storyUpdate(0.1)}
    o.ready=qReady(QBY.s6Heart);
    wGo('storm');const ps=WORLD.regions.storm.paths.shadow;o.back=S.wd.reg==='storm'&&Math.hypot(P.x-ps.x,P.y-ps.y)<WORLD.arrive+10;
    enterVillage();$('ovDaily').hidden=true;welcomeClose();questLogOpen(false);questClaim('s6Heart');o.lit=!!SAVE.story.light;return o});
  // הסוף: התושבים מריעים, ראש הכפר מדבר, ואחרי שסוגרים את השיחה: "תודה ששיחקת" עם סיכום. סוגרים, וממשיכים לשחק
  await page.clock.runFor(900);
  ch6b.cheer=await page.evaluate(()=>Object.values(npcState()||{}).filter(n=>n.st==='cheer').length);
  for(let i=0;i<14;i++){await page.clock.runFor(1500);
    const st=await page.evaluate(()=>{const o={end:!$('ovEnd').hidden,dlg:!$('npcDlg').hidden};
      if(o.dlg){o.head=S.vil&&S.vil.dlgLine===T('story.light.head');npcTalk(null)}return o});
    if(st.head)ch6b.head=true;if(st.end){ch6b.end=true;break}}
  if(ch6b.end)await shot('the-end');
  Object.assign(ch6b,await page.evaluate(()=>{const o={rows:document.querySelectorAll('#endWin .endrow').length,sum:storySummary(),saved:!!JSON.parse(localStorage.getItem(SAVE_STORE.key)).story.end};
    const b=document.querySelector('#endWin [data-act="close"]');if(b)b.click();o.goOn=$('ovEnd').hidden&&S.mode==='play';return o}));
  Object.assign(ch6,ch6b);
  check(ch6.closed&&ch6.open&&ch6.offer&&ch6.reg==='shadow'&&ch6.dark&&ch6.foes>0&&ch6.mixed&&ch6.noNpc&&ch6.shadow&&ch6.echo&&ch6.warden&&ch6.learn&&ch6.learnAll&&ch6.allPhases&&ch6.shoot&&ch6.ring&&ch6.marks&&ch6.ready&&ch6.back&&ch6.lit&&ch6.cheer>=3&&ch6.head&&ch6.end&&ch6.rows===4&&ch6.saved&&ch6.goOn,
    'עלילה, פרק 6: '+(ch6.closed&&ch6.open?'השביל ללב הצל נפתח רק עם חמשת הפנסים':'השביל ללב הצל לא נשלט ע"י הפנסים')+(ch6.offer?', קווסט ראשון מוצע':', סדר הקווסטים שבור')+
    (ch6.reg==='shadow'&&ch6.dark?', הגעה ללב הצל':', לא הגיע ללב הצל')+(ch6.shadow?' בחושך':', בלי חושך')+', '+ch6.foes+' צללים'+(ch6.mixed?' (חומרים מעורבבים)':' (חומר אחד!)')+(ch6.noNpc?'':', דמויות האחו בחושך!')+(ch6.echo?'':', קווסט ההדים שבור')+
    (ch6.warden?', הצל קם':', הצל לא קם')+(ch6.learn&&ch6.learnAll?' ולמד (עמיד לאש בכל השלבים)':', לא למד')+', שלבים: '+(ch6.phases||'-')+(ch6.shoot&&ch6.ring&&ch6.marks?' עם ההתקפות של השומרים':', התקפה של שלב חסרה')+(ch6.ready?', הופל':', לא הופל')+
    (ch6.back?', חזרה למגדלים':', החזרה למגדלים שבורה')+(ch6.lit?', הפנס הלבן נדלק':', הפנס הלבן לא נדלק')+', '+(ch6.cheer||0)+' תושבים מריעים'+(ch6.head?', ראש הכפר מדבר':', ראש הכפר שותק')+
    (ch6.end?', "תודה ששיחקת" ('+ch6.rows+' שורות: '+(ch6.sum?ch6.sum.time+' · '+ch6.sum.kills+' · '+ch6.sum.secrets+' · '+ch6.sum.fish:'')+')':', בלי מסך סיום')+(ch6.saved?'':', לא נשמר')+(ch6.goOn?' וממשיכים לשחק':', אי אפשר להמשיך'));
  // עומק הצל (depths.js): אחרי הסוף נפתח שביל בלב הצל. קומה אחרי קומה, קשה יותר ושלל טוב יותר, בוס כל 5, יציאה בכל רגע, מוות בלי הפסד, ושיא שנשמר
  const dp=await page.evaluate(()=>{
    const o={},st0=JSON.stringify(SAVE.story),best0=SAVE.depths&&SAVE.depths.best,kill=()=>{for(let r=0;r<5;r++){for(const e of enemies.slice())if(!e.dead&&!e.pack&&!e.evt)damage(e,e.max*10,'sword',0,'water');for(let i=0;i<4;i++)worldUpdate(0.016)}};   // כמה סבבים: חוק יומי שמפצל אויבים (mutation.js)
    SAVE.story.end=false;enterWorld('home','shadow');o.closed=!wGates().depths;SAVE.story.end=true;enterWorld('home','shadow');o.open=!!wGates().depths;
    SAVE.depths.best=0;P.inv=999;wGo('depths');o.f1=S.wd.dp===1&&/^dp_/.test(S.wd.reg);worldHud();o.hud=$('wName').textContent.includes('1');
    const ty=new Set(enemies.filter(e=>!e.dead&&e.home!=null).map(e=>e.type));o.foes=enemies.filter(e=>!e.dead&&e.home!=null).length;o.types=ty.size;
    const hp1=WR().zones[0].hp;o.shut=!wGates().deeper;
    kill();o.clear=!!S.wd.dpClear&&!!wGates().deeper;o.got=(S.wd.dpGot||[]).length;o.q=(S.wd.dpGot||[]).every(id=>gQ(id)>=DEPTHS.loot.q.min);
    wGo('deeper');o.f2=S.wd.dp===2&&WR().zones[0].hp>hp1&&SAVE.depths.best===2;
    depthsEnter(5);const w=S.wd.warden;o.boss=!!w&&w.type==='shade'&&w.dpBoss;
    if(w)damage(w,w.max*10,'sword',0,'water');kill();o.bossWin=!!S.wd.dpClear&&(S.wd.reGot||[]).length>0;
    depthsEnter(30);kill();o.legend=(S.wd.dpGot||[]).some(id=>(gItem(id)||{}).tier===4);o.f30=WR().zones[0].hp/hp1;
    SAVE.bag.wood=(SAVE.bag.wood||0)+10;const wood=SAVE.bag.wood;P.hp=0;gameOver();o.keep=SAVE.bag.wood===wood&&$('wLost').textContent.includes('30');
    $('wRespawn').click();o.home=!!S.vil;
    depthsEnter(3);S.wd.near='home';$('wGo').click();o.exit=!!S.vil;
    o.saved=JSON.parse(localStorage.getItem(SAVE_STORE.key)).depths.best===30;
    SAVE.story=JSON.parse(st0);SAVE.depths.best=best0||0;saveNow();return o});
  check(dp.closed&&dp.open&&dp.f1&&dp.hud&&dp.foes>0&&dp.types>1&&dp.shut&&dp.clear&&dp.got>0&&dp.q&&dp.f2&&dp.boss&&dp.bossWin&&dp.legend&&dp.f30>3&&dp.keep&&dp.home&&dp.exit&&dp.saved,
    'עומק הצל: '+(dp.closed&&dp.open?'השביל נפתח רק אחרי הסוף':'השביל לא תלוי בסוף')+(dp.f1&&dp.hud?', קומה 1':', לא נכנס לקומה 1')+', '+dp.foes+' אויבים מ-'+dp.types+' סוגים'+(dp.shut&&dp.clear?', השער למטה נפתח אחרי ניקוי':', השער למטה שבור')+
    ', '+dp.got+' חפצים בתיבה'+(dp.q?'':' (איכות נמוכה!)')+(dp.f2?', קומה 2 קשה יותר':', קומה 2 לא קשה יותר')+(dp.boss&&dp.bossWin?', בוס בקומה 5 והופל':', הבוס בקומה 5 חסר')+(dp.legend?', אגדי בקומה 30':', בלי אגדי בעומק')+' (חיים פי '+(Math.round((dp.f30||0)*10)/10)+')'+
    (dp.keep?', מוות בלי הפסד':', מוות מאבד שלל!')+(dp.home?' וחזרה לכפר':'')+(dp.exit?', יציאה בשער':', היציאה שבורה')+(dp.saved?', השיא נשמר':', השיא לא נשמר'));
  // הסלעים המרחפים בלב הצל (shadowrocks.js): הבוט חוצה מהשפה הצפונית לדרומית, מחכה כשגשר האור כבוי, ולא נופל. דחיפה אל התהום מפילה לשפה עם נזק קטן.
  // אויבים ופיוחו לא עולים על הסלעים, ומחוץ ללב הצל אין להם השפעה
  const sr=await page.evaluate(()=>{
    const o={},K=SROCKS,dt=1/60,inv0=P.inv;enterWorld('home','shadow');P.inv=999;S.mode='play';
    const s0=K.shore[0];P.x=s0.x;P.y=s0.y;P._tx=P.x;P._ty=P.y;worldUpdate(dt);
    const N=SR.nodes,f0=SR.falls;let at=1,t=0,wait=0,carry=0,foeOn=0,petOn=0;
    for(;t<90&&at<N.length;t+=dt){const nx=N[at],l=SR.links[at-1],d=Math.hypot(nx.x-P.x,nx.y-P.y);
      if(d<(nx.fixed?nx.r*0.5+10:nx.r*0.4)){at++;continue}
      if(l.on){joy={id:-9,dx:(nx.x-P.x)/d,dy:(nx.y-P.y)/d}}else{joy=null;wait+=dt}
      const x0=P.x;worldUpdate(dt);if(!joy&&P.x!==x0)carry++;
      for(const e of enemies)if(!e.dead&&tBlocked(e.x,e.y))foeOn++;if(S.pet&&tBlocked(S.pet.x,S.pet.y))petOn++}
    joy=null;o.cross=at>=N.length;o.time=Math.round(t);o.wait=Math.round(wait*10)/10;o.carry=carry;o.noFall=SR.falls===f0;o.foeOn=foeOn;o.petOn=petOn;
    o.land=!tBlocked(P.x,P.y);
    // נפילה בכוונה: עומדים על סלע ודוחפים הצידה, אל התהום
    const r=N[2];P.x=r.x;P.y=r.y;P._tx=P.x;P._ty=P.y;SR.land={x:K.shore[0].x,y:K.shore[0].y};P.hp=P.maxHp;
    for(let i=0;i<120&&SR.falls===f0;i++){joy={id:-9,dx:r.nx,dy:r.ny};worldUpdate(dt)}joy=null;
    o.fell=SR.falls===f0+1;o.back=Math.hypot(P.x-K.shore[0].x,P.y-K.shore[0].y)<30;o.hurt=P.hp<P.maxHp&&P.hp>0;
    o.lit=SR.links.some(l=>l.on)&&SR.links.some(l=>!l.on)||o.wait>0;
    enterWorld('home','storm');o.off=!TR||!TR.walk;P.inv=inv0;enterVillage();return o});
  check(sr.cross&&sr.wait>0&&sr.carry>0&&sr.noFall&&sr.land&&!sr.foeOn&&!sr.petOn&&sr.fell&&sr.back&&sr.hurt&&sr.off,
    'הסלעים המרחפים: '+(sr.cross?'הבוט חצה ב-'+sr.time+' שניות':'הבוט לא חצה!')+(sr.wait>0?', חיכה '+sr.wait+' שניות לגשר אור':', אף גשר לא כבה')+(sr.carry?', הסלע לקח אותו איתו':', הסלע לא זז איתו')+
    (sr.noFall?', בלי נפילה בדרך':', נפל בדרך!')+(sr.foeOn||sr.petOn?', אויב או פיוחו בתהום!':', אויבים ופיוחו לא עלו')+(sr.fell&&sr.back&&sr.hurt?', דחיפה לתהום: חזרה לשפה עם נזק קטן':', הנפילה שבורה')+(sr.off?'':', משפיע מחוץ לצל!'));
  // כל פנס שנדלק משנה את הכפר (homecoming.js): בכניסה הבאה לכפר התושב חוזר, העמוד שלו דולק, ראש הכפר מספר, ובעולם נופל חפץ ביסוד של הפנס
  const hm=await page.evaluate(()=>{
    const o={},b0=SAVE.home.back;SAVE.home.back={};
    o.away=!npcHere('gardener');enterVillage();o.k=homeBack('earth')&&!homeBack('water');o.here=npcHere('gardener')&&!!npcAt('gardener');
    o.free=Object.keys(HOME.list).every(k=>npcFree(HOME.list[k].at.x,HOME.list[k].at.y));
    o.posts=HOME.posts.filter(p=>STO()[p.k]&&homeBack(p.k)).length;
    o.line=!!npcLine('gardener')&&!/^npc\./.test(npcLine('gardener'));
    o.saved=!!JSON.parse(localStorage.getItem(SAVE_STORE.key)).home.back.earth;
    enterVillage();o.next=homeBack('water');enterVillage();o.three=homeBack('ice');
    o.fire=!homeBack('fire')&&!npcHere('baker')||!!STO().fire;
    o.bolt=!homeBack('bolt')&&!npcHere('bellringer')||!!STO().bolt;
    o.light=!homeBack('light')&&!npcHere('lamplighter')||!!STO().light;
    enterWorld('home');const H=HOME.list.earth,c=H.chance;H.chance=2;const n0=drops().length;o.gift=homeKill({x:P.x,y:P.y,r:13})===H.item&&drops().length>n0;H.chance=c;
    SAVE.home.back={...b0,...SAVE.home.back};npcTalk(null);enterVillage();return o});
  check(hm.away&&hm.k&&hm.here&&hm.free&&hm.posts>=1&&hm.line&&hm.saved&&hm.next&&hm.three&&hm.fire&&hm.bolt&&hm.light&&hm.gift,'פנס משנה את הכפר: '+(hm.away&&hm.here?'הגנן חוזר בכניסה לכפר':'הגנן לא חזר')+(hm.k?' (פנס אחד בכל כניסה)':', כמה פנסים בבת אחת')+
    (hm.saved?', נשמר':', לא נשמר')+', '+hm.posts+' עמודים דולקים'+(hm.next&&hm.three?', המים והקרח בכניסות הבאות':', המים והקרח לא חזרו')+(hm.free?'':', תושב עומד במקום אסור')+(hm.line?'':', אין לו משפט')+(hm.gift?', וחפץ ביסוד נופל בעולם':', החפץ לא נפל'));
  // הכפר מתמלא (residents.js): הקווסט האחרון של דמות בעולם, היא נפרדת, נעלמת מהאחו, ובכפר יש לה בית, חגיגה ושירות
  const rsd=await page.evaluate(()=>{
    const o={},Q=QS(),d0={...Q.done},r0={...(SAVE.resid||{})};delete Q.done.wGolems;delete Q.done.wCatch;SAVE.resid={};
    o.away=!npcHere('vcutter');enterWorld('home');o.inWorld=!!wnpcState().cutter;
    Q.done.wGolems=1;S.wd.dlg='cutter';resLeave('cutter');o.bye=RSS().cutter===1&&!/^rsd\./.test(S.wd.dlgLine);
    enterWorld('home');o.gone=!wnpcState().cutter&&!!wnpcState().fisher;
    npcTalk(null);enterVillage();o.here=npcHere('vcutter')&&!!npcAt('vcutter')&&!npcHere('vfisher');o.arrived=RSS().cutter===2;
    o.free=Object.values(RESID.list).every(R=>npcFree(R.house.x,R.house.y+RESID.front));
    SAVE.bag.stone=(SAVE.bag.stone||0)+10;const st=SAVE.bag.stone,ir=SAVE.bag.iron||0;npcTalk('vcutter');o.line=!/^npc\./.test(S.vil.dlgLine);const svc=()=>{const t=document.querySelector('#npcDlg [data-act="tab"][data-tab="serve"]');if(t)t.click()};svc();
    const b=document.querySelector('#npcDlg [data-act="res"]');o.btn=!!b&&!b.disabled;if(b)b.click();o.swap=SAVE.bag.stone===st-10&&SAVE.bag.iron===ir+2;
    Q.done.wCatch=1;bagAdd('perch',1);const c0=SAVE.bag.coins||0;npcTalk('vfisher');svc();const f=document.querySelector('#npcDlg [data-act="res"][data-k="perch"]');if(f)f.click();
    o.fish=SAVE.bag.coins===c0+RES.list.perch.sell*RESID.list.fisher.mult;
    npcTalk(null);Object.assign(Q.done,d0);for(const k of ['wGolems','wCatch'])if(!d0[k])delete Q.done[k];SAVE.resid=r0;enterVillage();return o});
  check(rsd.away&&rsd.inWorld&&rsd.bye&&rsd.gone&&rsd.here&&rsd.arrived&&rsd.free&&rsd.line&&rsd.btn&&rsd.swap&&rsd.fish,'הכפר מתמלא: '+(rsd.away&&rsd.inWorld?'החוצבת באחו':'החוצבת לא במקום')+(rsd.bye?', נפרדת אחרי הקווסט האחרון':', לא נפרדת')+
    (rsd.gone?', נעלמת מהאחו':', נשארת באחו')+(rsd.here&&rsd.arrived?', גרה בכפר עם חגיגה':', לא הגיעה לכפר')+(rsd.free?'':', בית במקום אסור')+(rsd.line?'':', אין לה משפט')+
    (rsd.btn&&rsd.swap?', אבנים לברזל':', ההחלפה לא עובדת')+(rsd.fish?', והדייג קונה דגים':', הדייג לא קונה'));
  // חלונות המבנים בתבנית אחת (bwin.js, ניר 2.11: "כל החנויות לא נוחות"): כל מבנה נפתח עם שם, שורה של מה עושים בו, גוף ו-✕,
  // ושום כפתור לא יוצא מהחלון. בלשונית השדרוג יש מחיר. במחסן "הכל למחסן" ו"הכל לתרמיל", ובשוק קונים אבן. על עותק של השמירה
  const bw=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),o={bad:[],n:0,all:Object.keys(VILLAGE.b).length};
    try{npcTalk(null);enterVillage();for(const k in VILLAGE.b)SAVE.village[k]=Math.max(2,vLv(k));SAVE.village.stash=VILLAGE.max;SAVE.stash={};bagAdd('coins',500);bagAdd('wood',40);
      for(const k in VILLAGE.b){S.vil.ui='';if(!vOpen(k)){o.bad.push(k+' לא נפתח');continue}const pn=$('vPanel'),r=pn.getBoundingClientRect();
        const ok=pn.classList.contains('bw')&&!!pn.querySelector('.bwhd h3')&&!!pn.querySelector('.bwhd .bwt p')&&!!pn.querySelector('.bwbody')&&!!pn.querySelector('.bwhd [data-act="close"]');
        const out=[...pn.querySelectorAll('button')].filter(b=>{const q=b.getBoundingClientRect();return q.width&&(q.left<r.left-1||q.right>r.right+1||q.top<r.top-1)}).length;
        if(!ok||out)o.bad.push(k+(ok?'':' בלי תבנית')+(out?' '+out+' כפתורים בחוץ':''));
        const up=pn.querySelector('[data-act="tab"][data-tab="up"]');if(up){up.click();if(!pn.querySelector('.bwup')||!pn.querySelector('.bwprice .bwpc'))o.bad.push(k+': שדרוג בלי מחיר')}
        o.n++;S.vil.tab={}}
      const q=s=>document.querySelector('#vPanel '+s);S.vil.ui='';vOpen('stash');const w0=SAVE.bag.wood;
      q('[data-act="stashAll"][data-dir="in"]').click();o.allIn=SAVE.stash.wood===w0&&!SAVE.bag.wood&&!SAVE.stash.coins;
      q('[data-act="stashAll"][data-dir="out"]').click();o.allOut=SAVE.bag.wood===w0&&!SAVE.stash.wood;
      S.vil.ui='';vOpen('market');const c0=SAVE.bag.coins,s0=SAVE.bag.stone||0,b=q('.tcard[data-act="buy"][data-r="stone"]');o.buyBtn=!!b&&!b.disabled;
      if(o.buyBtn)b.click();o.buy=SAVE.bag.stone===s0+vLot('stone')&&SAVE.bag.coins===c0-vPrice('stone','buy')*vLot('stone');
      // הנפחייה (itemcard.js): אריחים, נגיעה בוחרת, הכרטיס עם מספר כוח, קנייה מהכרטיס, וכפתור אפור כשחסר
      S.vil.ui='';SAVE.village.forge=Math.max(2,vLv('forge'));vOpen('forge');const ts=document.querySelectorAll('#vPanel .ictile');o.fTiles=ts.length;
      const t2=ts[1],fid=t2&&t2.dataset.id;
      if(t2){t2.click();o.fPick=BWIN.sel.forge===fid&&!!q('.icard .icpow b')&&!!q('.icbuy')&&q('.icbuy').dataset.r===fid;
        const c=GEAR.recipes[fid];for(const r in c)bagAdd(r,c[r]);villageHud();const n0=SAVE.bag[fid]||0;q('.icbuy').click();o.fBuy=(SAVE.bag[fid]||0)===n0+1;
        for(const r in c)SAVE.bag[r]=0;villageHud();o.fPoor=!!q('.icbuy')&&q('.icbuy').disabled;
        // דרישות (itemroll.js): חפץ שדורש רמה מראה אותה בכרטיס, באדום כשהגיבור לא עומד בה
        const rq=[...document.querySelectorAll('#vPanel .ictile')].find(b=>irReq(b.dataset.id)),lv0=SAVE.hero.level;
        if(rq){ITEMROLL.skip=false;SAVE.hero.level=1;rq.click();o.fReq=!!q('.icard .ireq.no')&&!!q('.ictile[aria-pressed="true"] .iclock');ITEMROLL.skip=true;SAVE.hero.level=lv0}else o.fReq=true}
      vShut();o.closed=$('vPanel').hidden;
    }finally{const d=JSON.parse(bak);for(const k in SAVE)delete SAVE[k];Object.assign(SAVE,d);saveNow();if(S.vil){S.vil.tab={};S.vil.ui='';villageHud()}}
    return o});
  check(bw.fTiles>1&&bw.fPick&&bw.fBuy&&bw.fPoor&&bw.fReq,'חלון הנפחייה (itemcard.js): '+bw.fTiles+' חפצים ברשימה'+(bw.fPick?', נגיעה מציגה כרטיס עם מספר כוח':', הבחירה לא עובדת')+(bw.fBuy?', קנייה מהכרטיס עובדת':', הקנייה לא עברה')+(bw.fPoor?', בלי מספיק הכפתור אפור':', הכפתור לא אפור כשחסר')+(bw.fReq?', דרישות באדום':', הדרישות לא מוצגות'));
  check(!bw.bad.length&&bw.n===bw.all&&bw.allIn&&bw.allOut&&bw.buy&&bw.closed,'חלונות המבנים: '+bw.n+'/'+bw.all+' בתבנית אחת (שם, מה עושים, לשוניות, ✕)'+(bw.bad.length?', בעיות: '+bw.bad.join(' | '):'')+
    (bw.allIn?', "הכל למחסן" עובד':', "הכל למחסן" לא עובד')+(bw.allOut?', "הכל לתרמיל" עובד':', "הכל לתרמיל" לא עובד')+(bw.buy?', קנייה בשוק עובדת':bw.buyBtn?', הקנייה לא עברה':', אין כפתור קנייה')+(bw.closed?'':', לא נסגר'));
  // הפונדק (inn.js): הקיצור 🍲 פותח את דודה פלפל, לוח עם 3 משימות, לוקחים אחת, מסיימים, נקודה אדומה, אוספים פרס, ומנוחה שנותנת XP בכניסה לעולם
  const inn=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),o={},$d=()=>document.querySelector('#innBtn .innd');
    try{SAVE.story.earth=true;SAVE.inn={};for(const id in QS().active)if(QBY[id]&&QBY[id].giver==='inn')delete QS().active[id];npcTalk(null);enterVillage();$('ovDaily').hidden=true;
      const b=$('innBtn');o.btn=!!b;if(b)b.click();const dlg=$('npcDlg');o.open=!dlg.hidden&&S.vil.dlg==='inn';
      o.n=dlg.querySelectorAll('.innboard .qc').length;o.rum=!!dlg.querySelector('.innrum');
      if(LANG==='en'&&/[֐-׿]/.test(dlg.innerText))o.leak=dlg.innerText.trim().slice(0,80);
      const acc=dlg.querySelector('[data-act="innaccept"]'),id=acc&&acc.dataset.q,q=QBY[id];o.id=id;if(acc)acc.click();o.on=!!(id&&QS().active[id]);
      innTick(1);o.dot0=$d().hidden;
      if(q)q.obj.forEach(ob=>questEvent(ob.type,ob.what||null,ob.n));   // מסיימים: מדווחים בדיוק את מה שהמטרה מבקשת
      innTick(1);o.dot=!$d().hidden&&!b.hidden;o.dotW=Math.round(b.getBoundingClientRect().width);
      const c0=SAVE.bag.coins||0;npcDialog();const cl=dlg.querySelector('[data-act="innclaim"]');o.claim=!!cl;if(cl)cl.click();
      o.paid=!!q&&(SAVE.bag.coins||0)===c0+q.reward.coins;o.gone=!!q&&!QS().active[id]&&!qOpen(q);innTick(1);o.dotOff=$d().hidden&&b.hidden;
      S.vil.dlgTab='rest';npcDialog();const r=dlg.querySelector('[data-act="innRest"]');o.restBtn=!!r;if(r)r.click();o.armed=!!SAVE.inn.arm;
      npcTalk(null);enterWorld('home');for(const e of enemies)e.dead=true;innUpdate(0.1);innUpdate(1.1);
      o.xp=innXpK()>1;o.chip=!!$('innChip')&&!$('innChip').hidden;
      const e=addEnemy('grunt',P.x+300,P.y,1),w=QBY.iWeak;QS().active.iWeak={p:[0]};e.lt=w.obj[0].what;innKill(e);o.weak=QS().active.iWeak.p[0]===1;delete QS().active.iWeak;e.dead=true;
      enterVillage()}
    finally{const d=JSON.parse(bak);for(const k in SAVE)delete SAVE[k];Object.assign(SAVE,d);saveNow();if(S.vil){S.vil.ui='';villageHud()}}
    return o});
  check(inn.btn&&inn.open&&inn.n===3&&inn.rum&&inn.on&&inn.dot0&&inn.dot&&inn.claim&&inn.paid&&inn.gone&&inn.dotOff&&inn.restBtn&&inn.armed&&inn.xp&&inn.chip&&inn.weak&&!inn.leak,
    'הפונדק (inn.js): '+(inn.btn&&inn.open?'הקיצור 🍲 פותח את דודה פלפל':'הקיצור לא פותח את הפונדק')+', '+inn.n+' משימות על הלוח'+(inn.rum?' ושמועה':', בלי שמועה')+
    (inn.on?', לקחתי את '+inn.id:', הלקיחה נכשלה')+(inn.dot0&&inn.dot?', נקודה אדומה כשהיא מוכנה':', הנקודה האדומה לא עובדת ('+[inn.dot0,inn.dot,inn.dotW]+')')+(inn.claim&&inn.paid&&inn.gone?', הפרס נאסף והמשימה ירדה מהלוח':', האיסוף נכשל')+
    (inn.dotOff?'':', הנקודה נשארה')+(inn.restBtn&&inn.armed&&inn.xp&&inn.chip?', מנוחה: +XP ושבב בעולם':', המנוחה לא עובדת')+(inn.weak?', הריגה בסוג הנזק נספרת':', הריגה בסוג הנזק לא נספרת')+(inn.leak?', עברית באנגלית: '+inn.leak:''));
  // חלון הקפיצה האחד (travel.js): כל נקודת קפיצה (השער בכפר, השער הביתה באחו, 🏮 ליד פנס, 🗿 ליד אבן, המפה) פותחת אותו חלון עם אותה רשימה,
  // בלי המקום שעומדים בו. קפיצה לפנס, לאבן ולכפר עובדת, ולא באמצע קרב. בלי פנס ובלי אבן השער יוצא ישר. וקמים באבן אחרי מוות
  const tw=await page.evaluate(()=>{const o={},bak=JSON.stringify(SAVE);window.__twBak=bak;P.inv=99;npcTalk(null);
    const keys=()=>[...document.querySelectorAll('#trWin [data-act="tjump"]')].map(b=>b.dataset.k);
    SAVE.ways={open:{},fog:{}};for(const k in STORY.lanterns)if(SAVE.story)SAVE.story[k]=false;
    enterVillage();$('ovDaily').hidden=true;$('ovWelcome').hidden=true;o.any=travelAny();o.direct=vOpen('gate')&&!!S.wd&&$('trWin').hidden;   // אין לאן: יוצאים ישר
    enterWorld('home');for(const e of enemies)e.dead=true;const A=WORLD.waystones[0],B=WORLD.waystones[1];
    o.closed=!wsIsOpen('meadow',A);P.x=A.x;P.y=A.y+20;wsUpdate(0.016);o.open=wsIsOpen('meadow',A);o.btn=!$('wsBtn').hidden;
    o.fog=(SAVE.ways.fog.meadow||{s:''}).s.split('1').length-1;
    P.x=B.x;P.y=B.y+20;wsUpdate(0.016);o.two=wsOpenAll().length===2;
    SAVE.story.water=true;const all=travelDests().flatMap(g=>g.items.map(i=>i.k));o.all=all.join(',');
    const sets={};
    enterVillage();$('ovDaily').hidden=true;vOpen('gate');sets.gate=keys();travelWin(false);
    enterWorld('home');for(const e of enemies)e.dead=true;
    S.wd.near='home';$('wGo').hidden=false;$('wGo').click();sets.mgate=keys();travelWin(false);S.wd.near=null;
    P.x=B.x;P.y=B.y+20;wsUpdate(0.016);$('wsBtn').click();sets.stone=keys();travelWin(false);
    wmapOpen(true);const mb=document.querySelector('#wMap [data-act="trwin"]');o.mapBtn=!!mb;if(mb)mb.click();sets.map=keys();o.mapShut=$('wMap').hidden;travelWin(false);
    o.sets=sets;o.same=Object.entries(sets).every(([w,ks])=>{const here=w==='gate'?'home':w==='mgate'?'meadow':w==='stone'?'ws:meadow.'+B.id:'ws:meadow.'+B.id;
      return ks.length===all.length-1&&!ks.includes(here)&&all.filter(k=>k!==here).every(k=>ks.includes(k))});
    const e=addEnemy('grunt',P.x+30,P.y,1);travelWin(true);const fb=document.querySelector('#trWin [data-act="tjump"]');o.fight=!!fb&&fb.disabled&&!travelJump('home')&&!!S.wd;
    travelWin(false);e.dead=true;enemies=enemies.filter(x=>!x.dead);
    travelWin(true);const b=document.querySelector('#trWin [data-k="ws:meadow.'+A.id+'"]');if(b)b.click();return o});
  await page.clock.runFor(1200);
  Object.assign(tw,await page.evaluate(()=>{const o={},A=WORLD.waystones[0];P.inv=99;
    o.jump=!!S.wd&&Math.hypot(P.x-A.x,P.y-A.y)<WAYSTONES.arrive+30&&$('trWin').hidden&&S.mode==='play';
    enterVillage();$('ovDaily').hidden=true;vOpen('gate');const b=document.querySelector('#trWin [data-k="water"]');o.lantBtn=!!b;if(b)b.click();return o}));
  await page.clock.runFor(1200);
  Object.assign(tw,await page.evaluate(()=>{const o={},L=STORY.lanterns.water;P.inv=99;
    o.reg=S.wd&&S.wd.reg;o.at=!!S.wd&&Math.hypot(P.x-L.x,P.y-L.y)<TRAVEL.arrive+30;
    for(const e of enemies)e.dead=true;P.x=L.x;P.y=L.y+60;travelUpdate();o.lbtn=!$('trBtn').hidden;$('trBtn').click();
    const ks=[...document.querySelectorAll('#trWin [data-act="tjump"]')].map(b=>b.dataset.k);o.noHere=!ks.includes('water')&&ks.includes('home');
    const h=document.querySelector('#trWin [data-k="home"]');if(h)h.click();return o}));
  await page.clock.runFor(1200);
  Object.assign(tw,await page.evaluate(()=>{const o={},B=WORLD.waystones[1];o.home=!!S.vil&&!S.wd;
    vOpen('gate');const b=document.querySelector('#trWin [data-k="ws:meadow.'+B.id+'"]');if(b)b.click();return o}));
  await page.clock.runFor(1200);
  Object.assign(tw,await page.evaluate(()=>{const o={},B=WORLD.waystones[1];
    o.fromVil=!!S.wd&&!S.vil&&Math.hypot(P.x-B.x,P.y-B.y)<WAYSTONES.arrive+30;
    for(const e of enemies)e.dead=true;P.x=B.x+250;P.y=B.y+250;worldDeath();o.label=$('wRespawn').textContent===T('ws.respawn');$('wRespawn').click();
    o.woke=!!S.wd&&S.mode==='play'&&Math.hypot(P.x-B.x,P.y-B.y)<WAYSTONES.arrive+30;
    const d=JSON.parse(window.__twBak);for(const k in SAVE)delete SAVE[k];Object.assign(SAVE,d);saveNow();P.inv=0;enterVillage();return o}));
  check(tw.direct&&tw.closed&&tw.open&&tw.btn&&tw.fog>0&&tw.two&&tw.mapBtn&&tw.mapShut&&tw.same&&tw.fight&&tw.jump&&tw.lantBtn&&tw.reg==='lake'&&tw.at&&tw.lbtn&&tw.noHere&&tw.home&&tw.fromVil&&tw.label&&tw.woke,
    'חלון קפיצה אחד: '+(tw.direct?'בלי יעדים השער יוצא ישר':'השער לא יצא ישר ('+(tw.any?'יש יעדים':'חלון חוסם')+')')+(tw.closed&&tw.open&&tw.btn?', אבן נפתחת כשמגיעים ו-🗿 לידה':', האבן לא נפתחה')+(tw.fog>0?', הערפל נפתח':', הערפל לא נפתח')+
    (tw.same?', אותה רשימה מהשער, מהשער הביתה, מהאבן ומהמפה ('+tw.all.split(',').length+' יעדים, בלי המקום הנוכחי)':', הרשימות שונות: '+JSON.stringify(tw.sets)+' מול '+tw.all)+(tw.mapShut?'':', המפה לא נסגרה')+
    (tw.fight?' (לא באמצע קרב)':', קופצים באמצע קרב!')+(tw.jump?', קפיצה לאבן':', הקפיצה לאבן נכשלה')+(tw.lantBtn&&tw.reg==='lake'&&tw.at?', קפיצה מהכפר לפנס המים':', הקפיצה לפנס נכשלה ('+tw.reg+')')+
    (tw.lbtn&&tw.noHere?', 🏮 ליד הפנס פותח את החלון בלי הפנס עצמו':', הכפתור ליד הפנס לא עובד')+(tw.home?', חזרה לכפר':', החזרה לכפר נכשלה')+(tw.fromVil?', קפיצה מהכפר לאבן':', הקפיצה מהכפר לאבן נכשלה')+
    (tw.label&&tw.woke?', וקמים באבן אחרי מוות':', הקימה באבן נכשלה'));
  // 5: חלון הקפיצה לא חותך יעדים (ביקורת 6.11.2026): כל האבנים באחו פתוחות ופנס המים דולק. כל כפתור נראה בלי גלילה, או שיש סימן "יש עוד למטה"
  const trv=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),r={};
    try{enterWorld('home');for(const e of enemies)e.dead=true;enemies=enemies.filter(x=>!x.dead);SAVE.ways={open:{},fog:{}};for(const s of WORLD.waystones)SAVE.ways.open[wsKey('meadow',s)]=1;SAVE.story.water=true;
      travelWin(true);const w=$('trWin'),wr=w.getBoundingClientRect(),bs=[...w.querySelectorAll('.trgo')];
      r.n=bs.length;r.seen=bs.filter(b=>{const q=b.getBoundingClientRect();return q.top>=wr.top-1&&q.bottom<=wr.bottom+1}).length;r.more=w.classList.contains('more');r.h=Math.round(wr.height);
      w.scrollTop=w.scrollHeight;r.last=!bs.length||bs[bs.length-1].getBoundingClientRect().bottom<=w.getBoundingClientRect().bottom+1;travelWin(false)}
    finally{const d=JSON.parse(bak);for(const k in SAVE)delete SAVE[k];Object.assign(SAVE,d);saveNow();enterVillage()}return r});
  check(trv.n>=5&&(trv.seen===trv.n||trv.more&&trv.last),'חלון הקפיצה: '+(trv.seen===trv.n?'כל '+trv.n+' היעדים נראים':trv.more?trv.seen+' מתוך '+trv.n+' נראים, עם "יש עוד למטה"':'רק '+trv.seen+' מתוך '+trv.n+' יעדים נראים, בלי סימן שיש עוד')+' (גובה '+trv.h+')');
  // אירועים בעולם (events.js): גל שנגמר בתיבה, עגלה שנותנת שלל כשמגיעים, ומטר שמפיל מתכות
  const evt=await page.evaluate(()=>{
    enterWorld('home');const o={},n0=()=>drops().length;
    const W=evStart('wave');o.wave=W.foes.length;for(const e of W.foes)damage(e,e.hp*10,'sword',0,'water');let d0=n0();eventsUpdate(0.1);o.waveLoot=n0()-d0;o.waveEnd=!S.wd.ev;
    const C_=evStart('cart');P.x=C_.x;P.y=C_.y;d0=n0();eventsUpdate(0.1);o.cartLoot=n0()-d0;o.cartEnd=!S.wd.ev;
    evStart('rain');d0=n0();for(let i=0;i<15;i++)eventsUpdate(1);o.rain=n0()-d0;o.rainEnd=!S.wd.ev;o.next=S.wd.evT>0;
    enterVillage();return o});
  check(evt.wave>0&&evt.waveLoot>0&&evt.waveEnd&&evt.cartLoot>0&&evt.cartEnd&&evt.rain>3&&evt.rainEnd&&evt.next,'אירועים בעולם: גל של '+evt.wave+(evt.waveEnd?', הופל ונפל שלל '+evt.waveLoot:', לא נגמר')+
    ', עגלה '+(evt.cartEnd?'נלקחה ('+evt.cartLoot+')':'לא נלקחה')+', מטר הפיל '+evt.rain+(evt.next?', והבא מתוזמן':', אין אירוע הבא'));
  // סודות בעולם (secrets.js): כל המקומות בתוך האזור ולא במים, תיבה נחשפת ונפתחת, מקדש מברך ונגמר, תצפית חושפת מקורות, וסימן בעץ שפיוחו חופרת את האוצר שלו
  const sec=await page.evaluate(()=>{
    const o={bad:[]};SAVE.secrets={found:{},read:{}};
    for(const reg in SECRETS.regions){enterWorld('home',reg);const B=placeBox(),R=WR();
      for(const s of SECRETS.regions[reg])for(const q of [s,s.to].filter(Boolean)){
        if(q.x<B.x0||q.x>B.x1||q.y<B.y0||q.y>B.y1||(R.ponds||[]).some(p=>Math.hypot(p.x-q.x,p.y-q.y)<p.r+20)||Object.values(wGates(true)).some(g=>Math.hypot(g.x-q.x,g.y-q.y)<g.r+60))o.bad.push(s.id)}}
    enterWorld('home');const L=SECRETS.regions.meadow,go=s=>{P.x=s.x;P.y=s.y;secretsUpdate(0.05)},n0=()=>drops().length,of=k=>L.find(s=>s.kind===k);
    for(const e of enemies)e.dead=true;
    const ch=of('chest');P.x=ch.x+SECRETS.reveal-10;P.y=ch.y;secretsUpdate(0.05);o.shown=!!scState()['v'+ch.id]&&!scFound(ch.id);let d0=n0();go(ch);for(let i=0;i<60&&!scFound(ch.id);i++)secretsUpdate(0.05);o.chest=scFound(ch.id)&&n0()>d0;   // m_chest: the opening moment takes ~0.7s (chest.js)
    const sp0=P.speed,sh=of('shrine');go(sh);o.bless=scState().bless&&P.speed>sp0;for(let i=0;i<70;i++)secretsUpdate(1);o.blessEnd=!scState().bless&&Math.abs(P.speed-sp0)<1e-6;
    const lk=of('lookout');go(lk);o.look=scState().look>0&&scFound(lk.id);
    const cv=of('carving');go(cv);o.read=!!SC().read[cv.id];P.x=cv.to.x;P.y=cv.to.y+20;petUpdate(0.05);d0=n0();secretsUpdate(0.05);o.sniff=S.pet&&S.pet.st==='go';
    for(let i=0;i<200&&!scFound(cv.id);i++){petUpdate(0.05);secretsUpdate(0.05)}
    o.dug=scFound(cv.id)&&n0()>d0;o.count=scCount('meadow')+'/'+L.length;secretsHud();o.hud=$('wSec').textContent;
    o.saved=Object.keys((JSON.parse(localStorage.getItem(SAVE_STORE.key)).secrets||{}).found||{}).length;
    o.lake=(SECRETS.regions.lake||[]).length;o.ridge=(SECRETS.regions.ridge||[]).length;
    return o});
  if(CFG.shots){await page.clock.runFor(300);await shot('world-secrets')}
  await page.evaluate(()=>enterVillage());
  check(!sec.bad.length&&sec.shown&&sec.chest&&sec.bless&&sec.blessEnd&&sec.look&&sec.read&&sec.dug&&sec.saved===4&&sec.hud.includes('4/')&&sec.ridge>0,
    'סודות בעולם: '+(sec.bad.length?'מחוץ לאזור או במים: '+sec.bad.join(','):'כל המקומות תקינים')+(sec.shown?', תיבה נחשפת':', התיבה לא נחשפה')+(sec.chest?' ונפתחת':' ולא נפתחת')+
    (sec.bless?', מקדש מברך':', המקדש לא מברך')+(sec.blessEnd?' והברכה נגמרת':' והברכה לא נגמרת!')+(sec.look?', תצפית חושפת':', התצפית לא עובדת')+
    (sec.read?', סימן בעץ':', הסימן לא נקרא')+(sec.sniff?', פיוחו רצה':'')+(sec.dug?' וחופרת אוצר':' ולא חפרה')+', '+sec.count+' באחו ("'+sec.hud+'"), נשמר '+sec.saved+', באגם '+sec.lake+', ברכס '+sec.ridge);
  // Chest opening moment (chest.js, Nir 9.11): m_chest wobbles, slams open (not instant), loot + capped gear, effects capped, reduced-motion path short
  const chs=await page.evaluate(()=>{
    const o={};enterWorld('home');for(const e of enemies)e.dead=true;const s=SECRETS.regions.meadow.find(q=>q.id==='m_chest'),n0=()=>drops().length,run=sec=>{for(let i=0;i<sec/0.05;i++)secretsUpdate(0.05)};
    // d0: loot spawned, not the floor count (coins land on the last play's coins and stack)
    const play=calm=>{SAVE.secrets={found:{},read:{}};S.wd.sc=null;S.gd=[];S.hitstop=0;SAVE.calm=calm;const n=CHEST.n,d0=dropStats().spawned;P.x=s.x;P.y=s.y+40;secretsUpdate(0.05);
      const r={started:CHEST.n===n+1,instant:scFound(s.id)};run(0.3);const p=chPose(chSt()[s.id]);r.wobble=Math.abs(p.rot)>0.001||p.sx!==1;r.early=scFound(s.id);
      run(calm?0.1:0.5);r.found=scFound(s.id);r.loot=dropStats().spawned>d0;r.hs=S.hitstop||0;S.hitstop=0;r.sp=(chSt()[s.id]||{sp:[]}).sp.length;
      r.parts=juice().p.length<=JUICE.parts.max&&parts.length<=HITFX.parts;run(3);r.gone=!chSt()[s.id];return r};
    o.n=play(false);o.c=play(true);SAVE.calm=false;
    // loot odds: 200 gear rolls, none above the meadow cap
    let got=0,over=0;const k=CHEST.gear.chance;CHEST.gear.chance=1;for(let i=0;i<100;i++){const id=chGear(s.x,s.y);if(id){got++;if(gItem(id).tier>CHEST.gear.cap)over++}}CHEST.gear.chance=k;
    o.got=got;o.over=over;S.gd=[];FX.length=0;SAVE.secrets={found:{},read:{}};return o});
  await page.evaluate(()=>enterVillage());
  check(chs.n.started&&!chs.n.instant&&!chs.n.early&&chs.n.wobble&&chs.n.found&&chs.n.loot&&chs.n.hs>0&&chs.n.parts&&chs.n.gone&&chs.c.found&&chs.c.loot&&!chs.c.wobble&&!(chs.c.hs>0)&&chs.got>50&&!chs.over,
    'Chest moment: '+(chs.n.started?'starts on touch':'did not start')+(chs.n.instant||chs.n.early?', opened instantly!':', wobbles first')+(chs.n.wobble?'':' (no wobble!)')+(chs.n.found?', slams open':', never opened')+(chs.n.loot?' with loot':' without loot')+
    (chs.n.hs>0?', hit-stop':', no hit-stop')+(chs.n.parts?', effects capped':', over the particle cap!')+(chs.n.gone?', ends':', never ends')+
    ' · reduced motion: '+(chs.c.found&&chs.c.loot?'opens':'broken')+(chs.c.wobble||chs.c.hs>0?' but still shakes!':', still')+' · gear '+chs.got+'/100, over cap '+chs.over);
  // עולם עם חיים (wlife.js): שרידים בכל אזור פעיל ורק על קרקע פתוחה, מחנה נותן מתנה פעם אחת ומרפא, שריד נלקח פעם אחת ולא חוזר אחרי כניסה מחדש, וחיות בורחות
  const wlf=await page.evaluate(()=>{
    const o={reg:[],bad:[]},bak=JSON.stringify(SAVE.wlife||null);SAVE.wlife={met:{},got:{}};const n0=()=>drops().length;
    for(const reg in WLIFE.on){enterWorld('home',reg);const st=wlState();o.reg.push(reg+':'+st.rems.length+'/'+st.camps.length+'/'+st.herds.length);
      for(const r of st.rems)if(tBlocked(r.x,r.y))o.bad.push(r.id);if(!st.rems.length)o.bad.push(reg+':ריק')}
    enterWorld('home','meadow');for(const e of enemies)e.dead=true;let st=wlState();
    const c=st.camps[0];P.x=c.x;P.y=c.y+40;let d0=n0();wlifeUpdate(0.05);o.gift=n0()>d0&&!!WLS().met[c.id];
    P.x=c.x;P.y=c.y+600;wlifeUpdate(0.05);P.x=c.x;P.y=c.y+40;d0=n0();wlifeUpdate(0.05);o.once=n0()===d0;
    P.hp=P.maxHp*0.5;for(let i=0;i<10;i++)wlifeUpdate(0.1);o.heal=P.hp>P.maxHp*0.5;P.hp=P.maxHp;
    const r=st.rems[0];P.x=r.x;P.y=r.y;d0=n0();wlifeUpdate(0.05);o.rem=n0()>d0&&!!WLS().got[r.id];
    enterWorld('home','meadow');st=wlState();P.x=r.x;P.y=r.y;d0=n0();wlifeUpdate(0.05);o.stay=st.rems.some(q=>q.id===r.id)&&n0()===d0;
    const H=st.herds.find(h=>!WLIFE.beasts[h.sp].fly)||st.herds[0],a=H.a[0],x0=a.x,y0=a.y;P.x=a.x-60;P.y=a.y;for(let i=0;i<20;i++)wlifeUpdate(0.05);
    o.flee=Math.hypot(a.x-x0,a.y-y0)>80&&Math.hypot(a.x-P.x,a.y-P.y)>Math.hypot(x0-P.x,y0-P.y);o.sp=H.sp;
    o.saved=Object.keys((JSON.parse(localStorage.getItem(SAVE_STORE.key)).wlife||{}).got||{}).length;
    SAVE.wlife=JSON.parse(bak)||undefined;return o});
  if(CFG.shots){await page.clock.runFor(300);await shot('world-life')}
  await page.evaluate(()=>enterVillage());
  check(!wlf.bad.length&&wlf.gift&&wlf.once&&wlf.heal&&wlf.rem&&wlf.stay&&wlf.flee&&wlf.saved>0,
    'עולם עם חיים: '+wlf.reg.join(', ')+' (שרידים/מחנות/להקות)'+(wlf.bad.length?', לא במקום: '+wlf.bad.join(','):'')+(wlf.gift?', מחנה נותן מתנה':', אין מתנה במחנה')+(wlf.once?' פעם אחת':' שוב ושוב!')+
    (wlf.heal?' ומרפא':', האש לא מרפאת')+(wlf.rem?', שריד נלקח':', השריד לא נלקח')+(wlf.stay?' ולא חוזר':' וחוזר אחרי כניסה!')+(wlf.flee?', '+wlf.sp+' בורחים':', החיות לא בורחות')+', נשמר '+wlf.saved);
  // פעמון הערפל והגשרים הצפים באגם (lake-bell.js): כפתור ליד הפעמון, צלצול, הערפל נחלש וחוזר, המתנה בין צלצולים, התיבה הטבועה, וגשר שחורק
  const lbl=await page.evaluate(()=>{
    const o={};SAVE.lakeBell={};LB.cd=0;LB.t=0;LB.k=0;enterWorld('home','lake');for(const e of enemies)e.dead=true;enemies=enemies.filter(e=>!e.dead);
    const bl=lbBell(),b=$('bellBtn'),tap=()=>b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true})),n=k=>AUDIO.count[k]||0;
    o.bell=!!bl&&!tBlocked(bl.x,bl.y);P.x=bl.x+40;P.y=bl.y+20;lakeBellUpdate(0.05);o.btn=!b.hidden;
    const f0=FOG.alpha,far0=typeof HD!=='undefined'?HD.air.far:0,s0=n('bell');tap();o.ring=LB.t>0&&n('bell')>s0;
    for(let i=0;i<10;i++)lakeBellUpdate(0.5);o.clear=FOG.alpha<f0*0.5&&(typeof HD==='undefined'||HD.air.far>far0);o.fog=Math.round(f0*100)+'→'+Math.round(FOG.alpha*100);
    const t1=LB.t;tap();o.block=LB.t<=t1;
    const sc=lbSecret();o.scOk=!tBlocked(sc.x,sc.y);const d0=drops().length;P.x=sc.x;P.y=sc.y;lakeBellUpdate(0.05);o.found=!!LBS().found&&drops().length>d0;
    for(let i=0;i<70;i++)lakeBellUpdate(1);o.end=LB.t===0&&LB.k===0&&Math.abs(FOG.alpha-f0)<1e-9&&(typeof HD==='undefined'||HD.air.far===far0);
    P.x=bl.x+40;P.y=bl.y+20;lakeBellUpdate(0.05);o.wait=LB.cd>0&&!b.hidden&&/\d:\d\d/.test(b.textContent);
    for(let i=0;i<120;i++)lakeBellUpdate(1);o.again=!(LB.cd>0)&&!/\d:\d\d/.test(b.textContent);
    const br=WR().map.bridges[0],c0=n('creak');P.x=br.x;P.y=br.y;lakeBellUpdate(0.05);o.bridge=LB.onB===0&&n('creak')>c0&&!tBlocked(br.x,br.y);
    P.moving=true;for(let i=0;i<5;i++)lakeBellUpdate(0.4);o.rip=LB.rip.length>0;P.moving=false;
    o.saved=!!(JSON.parse(localStorage.getItem(SAVE_STORE.key)).lakeBell||{}).found;
    P.x=bl.x+40;P.y=bl.y+60;LB.cd=0;tap();for(let i=0;i<6;i++)lakeBellUpdate(0.5);   // לצילום: הערפל למטה, ליד הפעמון
    return o});
  if(CFG.shots){await page.clock.runFor(300);await shot('world-lake-bell')}
  await page.evaluate(()=>{LB.t=0;LB.k=0;LB.cd=0;enterVillage()});
  check(lbl.bell&&lbl.btn&&lbl.ring&&lbl.clear&&lbl.block&&lbl.scOk&&lbl.found&&lbl.end&&lbl.wait&&lbl.again&&lbl.bridge&&lbl.rip&&lbl.saved,
    'פעמון הערפל: '+(lbl.btn?'כפתור ליד הפעמון':'אין כפתור ליד הפעמון')+(lbl.ring?', מצלצל':', לא מצלצל')+(lbl.clear?', הערפל נחלש ('+lbl.fog+')':', הערפל לא נחלש')+
    (lbl.block?', אי אפשר לצלצל שוב מיד':', אפשר לצלצל בלי סוף!')+(lbl.found?', התיבה הטבועה נמצאה':', התיבה הטבועה לא נמצאה')+(lbl.saved?' ונשמרה':'')+(lbl.end?', הערפל חוזר':', הערפל לא חוזר!')+
    (lbl.wait?', שעון המתנה':', אין שעון המתנה')+(lbl.again?' ואחריו שוב מוכן':' והוא לא נגמר')+(lbl.bridge?', גשר צף חורק':', הגשר לא חורק')+(lbl.rip?' ועושה אדוות':''));
  // אויבים מיוחדים בעולם (affix.js): מתפצל נותן שניים, מתפוצץ פוגע אחרי רגע, מתחדש מרפא, ולכולם שם ושלל
  const afx=await page.evaluate(()=>{
    enterWorld('home');const o={},n0=enemies.length,L=WORLD.foes[3],mk=id=>{const e=addEnemy('grunt',P.x+60,P.y,1);e.home=3;affixSet(e,id);return e};
    const s=mk('split');damage(s,s.hp*10,'sword',0,'water');o.split=enemies.filter(e=>!e.dead&&e.split).length;
    const b=mk('burst');P.inv=0;const h0=P.hp;damage(b,b.hp*10,'sword',0,'water');o.wait=(S.wd.blasts||[]).length;P.inv=0;affixUpdate(1);o.blast=Math.round(h0-P.hp);P.hp=P.maxHp;
    const r=mk('regen');r.hp=r.max*0.5;affixUpdate(1);o.regen=r.hp>r.max*0.5;
    const f=mk('fast');o.fast=f.speed>ETYPES.grunt.speed*1.5;o.name=T('af.fast');o.drops=drops().filter(d=>d.r==='coins').length;
    enterVillage();return o});
  check(afx.split===2&&afx.wait===1&&afx.blast>0&&afx.regen&&afx.fast&&afx.drops>0,'אויבים מיוחדים: מתפצל → '+afx.split+' קטנים, מתפוצץ: '+(afx.wait?'מחכה רגע':'מיד')+' ופגע '+afx.blast+', מתחדש '+(afx.regen?'מרפא':'לא מרפא')+', מהיר '+(afx.fast?'רץ מהר':'לא')+', שלל מטבעות '+afx.drops+' · "'+afx.name+'"');
  // אויבים עם התנהגות (foeai.js): קבוצה רודפת, מסתער עם פס אדום, יורה מרחוק עם קו, קופץ עם עיגול, קורא שמביא חברים. בכל אחד: פוגע כשנשארים, ולא כשזזים
  const fai=await page.evaluate(()=>{
    enterWorld('home');enemies=[];eb=[];const o={},h0=hurt;let hits=0;hurt=()=>{hits++};
    try{
      const sy=P.y;P.y=WORLD.home.y+WORLD.safe.r+60;   // מחוץ לטבעת הבטוחה בשער (WORLD.safe)
      const g=addEnemy('grunt',P.x+150,P.y,1);g.home=3;g.zone='near';const d0=Math.hypot(P.x-g.x,P.y-g.y);for(let i=0;i<10;i++)wFoes(0.05);o.chase=Math.hypot(P.x-g.x,P.y-g.y)<d0-15;enemies=[];
      P.y=sy;{const g=addEnemy('grunt',P.x+150,P.y,1);g.home=3;g.zone='near';const d0=Math.hypot(P.x-g.x,P.y-g.y);for(let i=0;i<10;i++)wFoes(0.05);o.safe=wSafe()&&Math.hypot(P.x-g.x,P.y-g.y)>=d0-15;enemies=[]}   // בתוך הטבעת: לא רודפת
      const run=(e,t)=>{for(let i=0;i<t/0.02;i++)foeAi(e,0.02,Math.hypot(P.x-e.x,P.y-e.y))};
      const mk=(type,ai,dx)=>{enemies.length=0;const e=addEnemy(type,P.x+dx,P.y,1);e.zone='far';foeAiInit(e);e.ai=ai;e.acd=0;e.caller=0;return e};
      // הסתערות: נשארים = נפגעים. זזים הצידה בזמן ההכנה = התחמקות
      let e=mk('shield','charge',200);hits=0;foeAi(e,0.02,200);o.cWind=e.act==='wind';run(e,0.3);o.cEarly=hits===0;run(e,1.5);o.cHit=hits===1;
      e=mk('shield','charge',200);hits=0;foeAi(e,0.02,200);P.y+=120;run(e,2);P.y-=120;o.cDodge=hits===0&&e.dodged>=1;
      // ירייה מרחוק: קו ואז חץ קסם
      e=mk('wisp','ranged',200);const b0=eb.length;foeAi(e,0.02,200);o.rAim=e.act==='aim';run(e,0.3);o.rWait=eb.length===b0;run(e,0.5);o.rShot=eb.length===b0+1;
      // קפיצה: עיגול על המקום שלך, נוחת. זזת = התחמקת
      e=mk('grunt','leap',160);hits=0;foeAi(e,0.02,160);o.lCrouch=e.act==='crouch';run(e,1.4);o.lHit=hits===1;
      e=mk('grunt','leap',160);hits=0;foeAi(e,0.02,160);P.x-=150;run(e,1.4);P.x+=150;o.lDodge=hits===0&&e.dodged>=1;
      // קורא: נפצע, בורח, ואם לא הופל, מביא חברים
      enemies=[];e=mk('grunt','flank',150);e.caller=1;e.hp=e.max*0.3;const n0=enemies.length;foeAi(e,0.02,150);o.flee=e.act==='flee';run(e,2.5);o.called=!!e.called&&enemies.length===n0+FOEAI.call.friends;
      // ליד השער: אין קופצים וקוראים, וההכנה איטית יותר
      o.calm=FOEAI.leapChance.start===0&&FOEAI.callChance.start===0&&FOEAI.startWind>1;
      // מנהיג להקה: בסוף שיא מגיעה להקה עם מנהיג (גדול, מהיר יותר ללהקה), ונפילה שלו נותנת ערימה פעם אחת
      enemies=[];P.x=0;P.y=0;P.moving=false;paceUpdate(0.01);const p=S.wd.pace;p.b=PACE.beats.findIndex(b=>b.id==='peak');p.bt=PACE.beats[p.b].dur-FOEAI.leader.at+0.1;p.peaks=1;
      foeLeaderTick();const ld=enemies.find(x=>x.leader);o.leader=!!ld&&ld.r>ETYPES[ld.type].r*1.2&&enemies.filter(x=>x.pack===ld.pack).length>=2;foeLeaderTick();o.once=enemies.filter(x=>x.leader).length===1;
      if(ld){const dr0=drops().length;kill(ld);foeLeaderTick();foeLeaderTick();o.pile=(p.leaders||0)===1&&drops().length>dr0}
    }finally{hurt=h0}
    enemies=[];eb=[];enterVillage();return o});
  check(fai.chase&&fai.safe&&fai.cWind&&fai.cEarly&&fai.cHit&&fai.cDodge&&fai.rAim&&fai.rWait&&fai.rShot&&fai.lCrouch&&fai.lHit&&fai.lDodge&&fai.flee&&fai.called&&fai.calm&&fai.leader&&fai.once&&fai.pile,
    'אויבים עם התנהגות (foeai.js): '+(fai.chase?'קבוצה רודפת':'קבוצה לא רודפת!')+(fai.safe?', לא בטבעת השער':', רודפת לתוך טבעת השער!')+', מסתער '+(fai.cWind&&fai.cEarly?'מסמן קודם':'בלי סימון')+(fai.cHit?' ופוגע':' ולא פוגע')+(fai.cDodge?', צעד הצידה = התחמקות':', אי אפשר להתחמק')+
    ', יורה '+(fai.rAim&&fai.rWait?'עם קו':'בלי קו')+(fai.rShot?' ויורה':' ולא יורה')+', קופץ '+(fai.lCrouch?'עם עיגול':'בלי עיגול')+(fai.lHit?' ונוחת עליך':' ולא פוגע')+(fai.lDodge?', זזת = התחמקת':', אי אפשר להתחמק')+
    ', קורא '+(fai.flee?'בורח':'לא בורח')+(fai.called?' ומביא חברים':' ולא מביא')+(fai.calm?', ליד השער רגוע':', ליד השער לא רגוע')+(fai.leader?', מנהיג מגיע בשיא':', אין מנהיג')+(fai.once?'':' (יותר מאחד!)')+(fai.pile?' ומשאיר ערימה':' בלי ערימה'));
  // מפלצות שנלחמות (6.11, foeai.js): לכל סוג אויב בעולם תפקיד, ובקבוצה של 5 לכל היותר 3 תוקפות בו זמנית, והשאר מקיפות ומתחלפות
  const trn=await page.evaluate(()=>{
    const o={},types=new Set();for(const R of [WORLD,...Object.values(WORLD.regions)])for(const G of R.foes||[])if(!G.creature)types.add(G.type);
    o.types=types.size;o.noRole=[...types].filter(t=>!FOEAI.kinds[t]);
    enterWorld('home');enemies=[];eb=[];const h0=hurt;hurt=()=>{};
    try{
      const g0=WR().foes.findIndex(G=>G.type==='grunt'&&!G.creature),G=WR().foes[g0];P.x=G.x;P.y=G.y;
      for(let i=0;i<5;i++){const a=i/5*6.28,e=addEnemy('grunt',P.x+Math.cos(a)*120,P.y+Math.sin(a)*120,1);e.home=g0;e.zone='far';e.alert=99;e.hp=e.max=1e6;foeAiInit(e);e.ai='flank';e.caller=0}
      const busy=e=>e.sw>0||['wind','dash','aim','crouch','jump'].includes(e.act);let maxA=0,maxT=0,moved=0;const held=new Set(),last=enemies.map(e=>[e.x,e.y]),path=enemies.map(()=>0);   // דרך שעברו, לא מרחק מההתחלה: מי שמקיף חוזר לפעמים קרוב לנקודת ההתחלה (#381 נכשל לסירוגין)
      for(let i=0;i<400;i++){S.wd.t+=0.05;wFoes(0.05);const live=enemies.filter(e=>!e.dead);
        maxA=Math.max(maxA,live.filter(busy).length);maxT=Math.max(maxT,live.filter(e=>e.tok>0).length);live.forEach(e=>{if(e.tok>0)held.add(e)});enemies.forEach((e,j)=>{path[j]+=Math.hypot(e.x-last[j][0],e.y-last[j][1]);last[j]=[e.x,e.y]})}
      moved=path.filter(x=>x>300).length;   // 20 שניות: כל אחת זזה לפחות 300 (בפועל 1000-1200)
      Object.assign(o,{maxA,maxT,held:held.size,moved,n:enemies.filter(e=>!e.dead).length});
    }finally{hurt=h0}
    enemies=[];eb=[];enterVillage();return o});
  check(!trn.noRole.length&&trn.n===5&&trn.maxA<=3&&trn.maxT<=3&&trn.held>=4&&trn.moved===5,
    'מפלצות שנלחמות (תורות): '+trn.types+' סוגים בעולם'+(trn.noRole.length?', בלי תפקיד: '+trn.noRole.join(','):', לכולם תפקיד')+', בקבוצה של '+trn.n+': עד '+trn.maxA+' תוקפות ו-'+trn.maxT+' בתור בו זמנית, '+trn.held+' היו בתור (מתחלפות), '+trn.moved+' זזו');
  // מתקפה שרואים (6.11): אויב בעולם שמתכונן למכה מנגן אנימציית מכה ומאדים בתלת-ממד, ומרחף שמכוון מטיל. בדו-ממד: רק ה-"!" והסימון
  const fat=await page.evaluate(()=>{
    enterWorld('home');enemies=[];const o={on:R3D.on};
    try{
      const g=addEnemy('grunt',P.x+30,P.y,1);g.zone='far';g.sw=null;strikeTick(g,0.01,30);g.scd=0;strikeTick(g,0.01,30);o.tele=foeTele(g)>=0;
      if(R3D.on){syncEnemy(g,0.016);strikeTick(g,STRIKE.wind*0.5,30);syncEnemy(g,0.016);const a=R3D.actors.get(g),L=lookOf(g),c={...FOEATK3D.def,...FOEATK3D.clip[L.model]};
        o.clip=a&&a.one?a.one.getClip().name:'-';o.want=c.hit;o.has=!!R3D.clips[c.hit];o.mid=a&&a.one?a.one.time>0:false;
        o.red=a?a.mats.some(m=>m.emissive.r>0.1&&m.emissive.r>m.emissive.g*2):false;
        const w=addEnemy('wisp',P.x+200,P.y,1);w.zone='far';foeAiInit(w);w.ai='ranged';w.acd=0;w.caller=0;foeAi(w,0.02,200);syncEnemy(w,0.016);
        const b=R3D.actors.get(w),cw={...FOEATK3D.def,...FOEATK3D.clip[lookOf(w).model]};o.cast=b&&b.one?b.one.getClip().name===cw.cast:false}
    }finally{enemies=[]}
    enterVillage();return o});
  check(fat.tele&&(!fat.on||(fat.has&&fat.clip===fat.want&&fat.mid&&fat.red&&fat.cast)),'מתקפה שרואים (render3d.js FOEATK3D): '+(fat.tele?'הכנה מסומנת':'אין סימון!')+
    (fat.on?', מנגן '+fat.clip+(fat.clip===fat.want?'':' (ציפיתי ל-'+fat.want+(fat.has?'':', אין קליפ כזה')+')')+(fat.mid?' עד חצי':' בלי תנועה')+(fat.red?', מאדים':', לא מאדים')+(fat.cast?', מרחף מטיל':', מרחף לא מטיל'):', דו-ממד'));
  // המשימה של היום (mutation.js, היה challenge.js): החוק נכנס לאויב בעולם, הריגות נספרות, הפרס נאסף רק בכפר ופעם אחת, ופספוס לא מעניש
  const chl=await page.evaluate(()=>{
    const o={};SAVE.challenge=null;MUTATION.rules.test={icon:'🧪',hp:2,speed:1.5,mult:{fire:2},xp:1,loot:0};MUT.force='test';
    const e0=SAVE.story.earth;SAVE.story.earth=false;enterWorld('home');o.shut=$('chTag').hidden&&!enemies.some(x=>!x.dead&&x.mut)&&challengeCard()==='';   // לפני פנס האדמה: עולם רגיל
    SAVE.story.earth=true;
    enterWorld('home');o.tag=!$('chTag').hidden&&$('chTag').textContent.includes('/'+MUTATION.goal)&&$('mutChip').textContent.includes('/'+MUTATION.goal);   // ההתקדמות על השבב
    const e=enemies.find(x=>!x.dead&&x.mut&&!x.creature);o.rule=!!e&&e.mult!==ETYPES[e.type].mult&&e.mult.fire>=(ETYPES[e.type].mult.fire??1)*1.9;
    for(let i=0;i<MUTATION.goal;i++){const k=addEnemy('grunt',P.x+60,P.y,1);k.home=0;mutSpawn(k);damage(k,k.hp*10,'sword',0,'fire')}
    o.n=chSave().n;o.chipDone=$('mutChip').textContent.includes('✓');o.noWorld=!challengeClaim();
    wHome();o.tag2=$('chTag').hidden;questLogOpen(true);const b=document.querySelector('#qLog [data-act="chClaim"]');const m=SAVE.bag.coins||0;if(b)b.click();o.got=(SAVE.bag.coins||0)-m;o.once=!challengeClaim();questLogOpen(false);
    o.saved=JSON.parse(localStorage.getItem(SAVE_STORE.key)).challenge.got===chDay();
    SAVE.challenge={day:'1999-1-1',n:MUTATION.goal,got:'',owed:false};o.owed=chCan()&&chSave().n===0&&challengeClaim();   // שמירה ישנה: פרס מאתמול מחכה
    o.goal=MUTATION.goal;o.want=MUTATION.reward.coins;MUT.force=null;delete MUTATION.rules.test;SAVE.challenge=null;SAVE.story.earth=e0;return o});
  check(chl.shut,'משימת היום: '+(chl.shut?'סגורה לפני פנס האדמה, העולם רגיל':'פעילה לפני פנס האדמה'));
  check(chl.tag&&chl.rule&&chl.n===chl.goal&&chl.chipDone&&chl.noWorld&&chl.got>=chl.want&&chl.once&&chl.saved&&chl.owed&&chl.tag2,
    'משימת היום: '+(chl.tag?'התקדמות על השבב':'אין התקדמות על השבב')+', '+(chl.rule?'החוק נכנס לאויב':'החוק לא נכנס לאויב')+', '+chl.n+'/'+chl.goal+' הריגות'+(chl.chipDone?' ✓':', בלי ✓')+
    (chl.noWorld?', לא נאסף בעולם':', נאסף בעולם')+', בכפר +'+chl.got+' מטבעות'+(chl.once?' פעם אחת':' יותר מפעם')+(chl.saved?', נשמר':', לא נשמר')+(chl.owed?', פרס מאתמול מחכה':', פרס מאתמול אבד')+(chl.tag2?'':', הסימן נשאר בכפר'));
  // מוטציה יומית (mutation.js): אותו חוק לאותו תאריך, כל חוק נכנס לעולם ועובד, פרס מוגדל, פס בכניסה, סגור לפני פנס האדמה ומחוץ לעולם
  const mut=await page.evaluate(()=>{
    const o={},e0=SAVE.story.earth,days=Array.from({length:30},(_,i)=>'2026-12-'+(i+1));
    o.same=mutRule('2026-11-4')===mutRule('2026-11-4');o.many=new Set(days.map(d=>mutRule(d))).size;
    SAVE.story.earth=false;MUT.force='giants';enterWorld('home');o.shut=!mutNow()&&!enemies.some(x=>x.mut);SAVE.story.earth=true;
    const R={},cnt=()=>enemies.filter(x=>!x.dead&&!x.creature&&x.home!=null&&!x.wanted&&!x.hunt).length;
    MUT.force='thirst';enterWorld('home');const base=cnt();R.thirst=mutK('regen')<1;
    for(const id in MUTATION.rules){MUT.force=id;enterWorld('home');
      const e=enemies.find(x=>!x.dead&&x.mut&&!x.creature),et=e&&ETYPES[e.type];let ok=!!e;
      if(id==='giants')ok=ok&&cnt()<base&&e.r>et.r*1.2;
      if(id==='swarm')ok=ok&&cnt()>base;
      if(id==='fire'||id==='frost'){const t=id==='fire'?'fire':'ice';ok=ok&&e.mult[t]>=(et.mult[t]??1)*1.45}
      if(id==='rain'){e.wet=0;e.mw=0;mutUpdate(1/60);ok=ok&&e.wet>0;e.wet=0.5;for(let i=0;i<60;i++)dmgUpdate(1/60);ok=ok&&!(e.wet>0)}   // רטוב שוב, ורטיבות נגמרת בעולם (dmgUpdate)
      if(id==='fire'){e.hp=e.max=1e6;damage(e,1,'sword',0,'physical');mutUpdate(1/60);ok=ok&&!!e.burn;const h=e.hp;for(let i=0;i<60;i++)dmgUpdate(1/60);ok=ok&&e.hp<h}
      if(id==='gold')ok=ok&&e.speed>0;
      if(id==='elite')ok=ok&&!!e.affix;
      if(id==='wanted'){S.wn.e=null;S.wn.rumor=null;S.wn.t=100;mutUpdate(1);ok=ok&&S.wn.t<=98.5}
      if(id==='fog'){try{mutDraw()}catch(err){ok=false}}
      if(id==='split'){const n0=enemies.filter(x=>!x.dead&&x.mutKid).length;kill(e);const kids=enemies.filter(x=>!x.dead&&x.mutKid);ok=ok&&kids.length===n0+MUTATION.rules.split.split.n&&kids.every(k=>k.max<e.max);
        const k=kids[0];if(k){const n1=enemies.length;kill(k);ok=ok&&enemies.length===n1}}   // קטן לא מתפצל שוב
      R[id]=ok}
    o.rules=R;o.allOk=Object.keys(MUTATION.rules).every(k=>R[k]);
    MUT.force='split';enterWorld('home');const x0=SAVE.hero.xp||0;MUT.xpAcc=0;const g=addEnemy('grunt',P.x+60,P.y,1);g.home=0;g.xp=0;kill(g);
    o.xp=Math.round(((SAVE.hero.xp||0)-x0+MUT.xpAcc)*100)/100;o.xpBase=STATS.xp.kill;   // xpAcc: שבר הבונוס שעוד לא נכנס (עם XP קטן להריגה)
    o.line=mutLine().includes(mutName('split'));
    enterVillage();o.village=!mutNow();SAVE.story.earth=e0;return o});
  await page.evaluate(()=>{SAVE.story.earth=true;MUT.force='fog';enterWorld('home');for(const e of enemies)e.dmg=0;P.inv=99});await page.clock.runFor(1200);
  mut.bar=await page.evaluate(()=>{const el=$('mutBar');return !!el&&!el.hidden&&el.classList.contains('on')&&el.textContent.includes(mutName('fog'))});
  if(CFG.shots)await shot('mutation');
  await page.clock.runFor(6000);mut.barGone=await page.evaluate(()=>!$('mutBar').classList.contains('on'));
  mut.chip=await page.evaluate(()=>{const c=$('mutChip');if(!c||c.hidden||!c.textContent.includes(MUTATION.rules.fog.icon))return false;c.click();return $('mutBar').classList.contains('on')});   // השבב בפס העליון: נגיעה מחזירה את הפס
  await page.evaluate(()=>{MUT.force=null;enemies=[];wHome()});mut.chipOff=await page.evaluate(()=>$('whud').hidden||$('mutChip').hidden);   // חוזרים לכפר כמו שחקן (wHome מסתיר את הפס העליון של העולם)
  check(mut.same&&mut.many>=5&&mut.shut&&mut.allOk&&mut.xp>mut.xpBase&&mut.line&&mut.village&&mut.bar&&mut.barGone&&mut.chip&&mut.chipOff,
    'מוטציה יומית: '+mut.many+' חוקים שונים ב-30 יום'+(mut.shut?', סגור לפני פנס האדמה':', פתוח לפני פנס האדמה!')+
    ', עובדים: '+Object.keys(mut.rules).filter(k=>mut.rules[k]).join(',')+(mut.allOk?'':' (לא עובדים: '+Object.keys(mut.rules).filter(k=>!mut.rules[k]).join(',')+')')+
    ', XP בהריגה +'+mut.xp+' (רגיל '+mut.xpBase+')'+(mut.bar?', פס בכניסה':', אין פס!')+(mut.barGone?' שנעלם':' שלא נעלם')+(mut.chip?', שבב בפס העליון שמחזיר אותו':', אין שבב בפס העליון!')+(mut.chipOff?'':', השבב נשאר בכפר!')+(mut.line?', שורה בחלון בכפר':', אין שורה בכפר')+(mut.village?'':', פועל בכפר!')+(mut.same?'':', לא קבוע לתאריך'));
  // ספר ההרפתקאות (book.js): הריגה נרשמת, פריט ומשאב מהתרמיל נרשמים, פרס מגיע כל BOOK.every רשומות, והחלון נפתח, מראה צללית ונסגר
  const bk=await page.evaluate(()=>{
    enterWorld('home');const o={},b=BK();
    o.k0=b.f.mummy||0;kill(addEnemy('mummy',P.x+60,P.y,1));o.kill=(b.f.mummy||0)-o.k0;
    o.weak=bookWeak('golem');
    const it=Object.keys(GEAR.items).find(k=>!b.i[k]);if(it){bagAdd(it);o.item=!!b.i[it];bagTake(it)}else o.item=true;
    const rs=Object.keys(RES.list).filter(k=>!b.r[k]);if(rs[0]){bagAdd(rs[0]);o.res=!!b.r[rs[0]]}else o.res=true;
    // מספיק רשומות לפרס: משאבים חדשים עד שיש פרס שמחכה
    for(const r of rs.slice(1)){if(bookPending())break;bagAdd(r)}
    o.pend=bookPending();o.badge=!$('bBadge').hidden;
    bookOpen(true);o.open=!$('bookWin').hidden&&S.mode==='book';o.cards=document.querySelectorAll('#bookWin .bkc').length;
    document.querySelector('#bookWin [data-tab="r"]').click();o.unk=document.querySelectorAll('#bookWin .bkc.unk').length;
    const c0=SAVE.bag.coins||0,cl=document.querySelector('#bookWin [data-act="claim"]');o.btn=!!cl;if(cl)cl.click();o.coins=(SAVE.bag.coins||0)-c0;o.after=bookPending();
    o.saved=!!(JSON.parse(localStorage.getItem(SAVE_STORE.key)).book||{}).paid;o.fx=FX.length>0;
    document.querySelector('#bookWin [data-act="close"]').click();o.closed=$('bookWin').hidden&&S.mode==='play';
    bookOpen(true);dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));keys.Escape=false;o.esc=$('bookWin').hidden&&S.mode==='play';
    bookOpen(true);return o});
  if(CFG.shots){await page.setViewportSize(CFG.phone);await page.clock.runFor(200);await shot('book')}
  await page.evaluate(()=>{bookOpen(false);enterVillage()});
  check(bk.kill===1&&bk.weak==='water'&&bk.item&&bk.res&&bk.pend>0&&bk.badge&&bk.open&&bk.cards>0&&bk.btn&&bk.coins>0&&bk.after===0&&bk.saved&&bk.fx&&bk.closed&&bk.esc,
    'ספר ההרפתקאות: הריגה '+(bk.kill===1?'נרשמה':'לא נרשמה')+', חולשת גולם '+bk.weak+(bk.item?', פריט נרשם':', פריט לא נרשם')+(bk.res?', משאב נרשם':', משאב לא נרשם')+
    ', פרס מחכה '+bk.pend+(bk.badge?' עם נקודה':' בלי נקודה')+', החלון '+(bk.open?'נפתח ('+bk.cards+' רשומות, '+bk.unk+' צלליות)':'לא נפתח')+
    (bk.btn?', נלקח +'+bk.coins+' מטבעות':', אין כפתור פרס')+(bk.saved?', נשמר':', לא נשמר')+(bk.closed?', נסגר ב-✕':', לא נסגר')+(bk.esc?' וב-Esc':''));
  // מפת העולם (worldmap.js): הכפתור פותח חלון עם שתי מפות, האזור הנוכחי מסומן, אזור שלא ביקרו בו הוא צללית, הביקור נשמר, וחלון נסגר ב-✕ וב-Esc
  const wm=await page.evaluate(()=>{
    const o={};SAVE.wmap={seen:{}};const st0=JSON.stringify(SAVE.story),sc0=JSON.stringify(SAVE.secrets);
    SAVE.story=Object.assign({},SAVE.story,{earth:true,water:false,ice:false,fire:false});SAVE.secrets={found:{},read:{}};
    enterWorld('home');o.btn=getComputedStyle($('menuBtn')).display!=='none'&&menuTab('wMapBtn').when();   // המפה: לשונית בתפריט הראשי (menu.js)
    $('wMapBtn').click();o.open=!$('wMap').hidden&&S.mode==='map';const G=wmGraph();o.show=G.show.join(',');o.edges=G.edges.length;
    o.fog=G.show.filter(r=>!wmSeen(r)).join(',');o.canv=['wmWorld','wmHere'].every(id=>{const c=$(id);return c&&c.width>50&&c.height>50});
    // כל אזור שעוד לא התגלה מופיע כצללית עם ? (המבקר, worldmap-locked-tiers): גם הרכס הסגור, כצללית ולא כאי שביקרו בו
    o.fogAll=['meadow',...Object.keys(WORLD.regions)].every(r=>G.show.includes(r));o.hidden=o.fogAll&&!wmSeen('ridge');   // כל האזורים במפה, והרכס (שעוד לא התגלה) ביניהם כצללית
    document.querySelector('#wMap [data-act="close"]').click();o.closed=$('wMap').hidden&&S.mode==='play';
    wGo('lake');o.saved=!!(JSON.parse(localStorage.getItem(SAVE_STORE.key)).wmap||{seen:{}}).seen.lake;
    wmapOpen(true);o.cur=S.wd.reg;o.lakeSeen=wmSeen('lake');dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));keys.Escape=false;o.esc=$('wMap').hidden&&S.mode==='play';
    // כל אזור ב-WORLD.regions מגיע למפה לבד, בלי שני איים באותו מקום
    const P0=wmGraph().pos,ks=Object.keys(P0);o.all=['meadow',...Object.keys(WORLD.regions)].every(r=>P0[r]);
    o.apart=ks.every((a,i)=>ks.slice(i+1).every(b=>Math.hypot(P0[a].x-P0[b].x,P0[a].y-P0[b].y)>=WMAP.minGap*WMAP.step-1e-6));
    SAVE.story=JSON.parse(st0);SAVE.secrets=sc0?JSON.parse(sc0):SAVE.secrets;wmapOpen(true);return o});
  if(CFG.shots){await page.setViewportSize(CFG.phone);await page.clock.runFor(200);await shot('world-map')}
  await page.evaluate(()=>{wmapOpen(false);enterVillage()});
  check(wm.btn&&wm.open&&wm.canv&&wm.fogAll&&wm.hidden&&wm.closed&&wm.saved&&wm.lakeSeen&&wm.esc&&wm.all&&wm.apart&&wm.edges>=1,
    'מפת העולם: '+(wm.btn?'כפתור בעולם':'אין כפתור')+', '+(wm.open?'נפתחה':'לא נפתחה')+(wm.canv?' עם שתי מפות':' בלי מפות')+', אזורים: '+wm.show+' (צללית: '+(wm.fog||'אין')+')'+
    (wm.hidden?', כל מה שלא התגלה (גם הרכס) בצללית עם ?':', אזור שלא התגלה חסר או מופיע כגלוי')+(wm.closed?', נסגרה ב-✕':', לא נסגרה')+(wm.saved?', הביקור באגם נשמר':', הביקור לא נשמר')+(wm.esc?' ונסגרה ב-Esc':'')+
    (wm.all?'':', אזור חסר במפה')+(wm.apart?'':', שני איים חופפים'));
  // מפת העולם, כל האזורים פתוחים (worldmap.js, wmLabels): אף שם או מונה לא עולה על שם אחר או על אי, בגודל טלפון ובגודל מחשב. האנגלית: בריצה עם --lang en
  const wml={};
  for(const [vw,vh] of [[CFG.phone.width,CFG.phone.height],[1280,590]]){
    await page.setViewportSize({width:vw,height:vh});await page.clock.runFor(100);
    wml[vw]=await page.evaluate(()=>{const st0=JSON.stringify(SAVE.story),wm0=JSON.stringify(SAVE.wmap||{seen:{}}),all=['meadow',...Object.keys(WORLD.regions)];
      SAVE.wmap={seen:{}};all.forEach(r=>SAVE.wmap.seen[r]=1);SAVE.story=Object.assign({},SAVE.story,{earth:true,water:true,ice:true,fire:true,bolt:true,end:true});   // end: שורת דרגת העולם מתחת למפה, כמו אחרי ריצה ארוכה (ביקורת 7.11.2026, ממצא 6)
      enterWorld('home','ridge');for(const e of enemies)e.dead=true;wmapOpen(true);
      const c=$('wmWorld'),cw=c.clientWidth,ch=c.clientHeight,in_=(WMAP.rects||[]).every(b=>b.x0>=-1&&b.y0>=-1&&b.x1<=cw+1&&b.y1<=ch+1);
      const o={n:(WMAP.rects||[]).length,show:wmGraph().show.length,bad:WMAP.bad,here:WMAP.hereBad,in:in_};
      wmapOpen(false);SAVE.story=JSON.parse(st0);SAVE.wmap=JSON.parse(wm0);enterVillage();return o});
  }
  await page.setViewportSize(CFG.phone);await page.clock.runFor(100);
  check(Object.values(wml).every(o=>o.n===o.show&&o.n>=6&&o.bad===0&&o.here===0&&o.in),
    'מפת העולם, כל האזורים פתוחים: '+Object.entries(wml).map(([k,o])=>k+'px: '+o.n+'/'+o.show+' תוויות, '+(o.bad||o.here?'חפיפות: '+o.bad+' בעולם, '+o.here+' בשערים':'בלי חפיפות')+(o.in?'':', יוצאות מהמפה')).join(' · '));
  // מבוקש היום (hunt.js): אותו מבוקש לאותו תאריך, רק באזור שהתגלה, מופיע בכניסה עם שם, כרטיס ביומן, שלל כשנופל, פעם ביום
  const hu=await page.evaluate(()=>{
    const o={},h0=JSON.stringify(SAVE.hunt||null);SAVE.hunt=null;
    const a=huntToday('2030-1-1'),b=huntToday('2030-1-1');o.same=a.reg===b.reg&&a.name===b.name&&a.g.i===b.g.i;
    o.seen=Array.from({length:20},(_,i)=>huntToday('2030-1-'+(i+1)).reg).every(r=>wmSeen(r));
    const real=huntToday;huntToday=()=>Object.assign(real(),{reg:'meadow',g:real('x').reg==='meadow'?real('x').g:WORLD.foes.map((G,i)=>({G,i})).find(o=>ETYPES[o.G.type]&&!o.G.creature)});
    enterWorld('home');const e=S.wd.hunt;o.spawn=!!e&&e.hunt&&e.max>ETYPES[e.type].hp*2;
    questLogOpen(true);o.card=!!document.querySelector('#qLog')&&$('qLog').innerHTML.includes(T('hunt.title'));questLogOpen(false);
    const c0=dropStats().spawned;damage(e,e.hp*10,'sword',0,'physical');o.loot=dropStats().spawned>c0;o.done=huntDone()&&!S.wd.hunt;
    o.saved=(JSON.parse(localStorage.getItem(SAVE_STORE.key)).hunt||{}).got===huntDay();
    enterVillage();enterWorld('home');o.once=!S.wd.hunt;
    huntToday=real;SAVE.hunt=JSON.parse(h0);return o});
  await page.evaluate(()=>enterVillage());
  check(hu.same&&hu.seen&&hu.spawn&&hu.card&&hu.loot&&hu.done&&hu.saved&&hu.once,
    'מבוקש היום: '+(hu.same?'אותו מבוקש לאותו יום':'משתנה באותו יום')+(hu.seen?', רק באזורים שהתגלו':', באזור סגור')+(hu.spawn?', הופיע חזק עם שם':', לא הופיע')+(hu.card?', כרטיס ביומן':', אין כרטיס')+
    (hu.loot?', שלל':', בלי שלל')+(hu.done?', הופל':', לא נרשם')+(hu.saved?', נשמר':', לא נשמר')+(hu.once?', פעם ביום':', חוזר באותו יום'));
  // מפלצות נדירות (rares.js): מקומות נסתרים לכל אזור, סיכוי בכניסה, שמועה, פיוחו מריחה, נעלמת בזמן, נספרת בקווסט הדרגה, ונרשמת בספר
  const rar=await page.evaluate(()=>{
    const o={},r0=JSON.stringify(SAVE.rares||null),b0=JSON.stringify(SAVE.book||null),ch0=RARES.chance,pi0=RARES.pity,ids=Object.keys(RARES.list);
    const regs=['meadow',...Object.keys(WORLD.regions)];
    o.noRare=regs.filter(g=>!ids.some(id=>RARES.list[id].reg===g));
    o.bad=ids.filter(id=>{const R=RARES.list[id],G=R.reg==='meadow'?WORLD:WORLD.regions[R.reg];if(!G)return true;const {w,h}=G.size;
      return !ETYPES[id]||!ETYPES[id].rare||!LOOK3D[id]||/^fl\./.test(flName(id)||'fl.')||!flLine(id)||!bookList('f').includes(id)||R.spots.length<2||
        R.spots.some(s=>Math.abs(s.x)>w/2-40||Math.abs(s.y)>h/2-40||(G.ponds||[]).some(p=>Math.hypot(p.x-s.x,p.y-s.y)<p.r+50)||/^rare\.at/.test(rareAt(s)))});
    SAVE.rares={got:{},miss:0};RARES.chance=0;RARES.pity=0;enterWorld('home');o.none=!S.wd.rare&&RS().miss===1;
    RARES.chance=ch0;RARES.pity=pi0;enemies=[];S.wd.rare=null;S.wd.scent=null;
    const e=rareSpawn('mossback',0),sp=RARES.list.mossback.spots[0];
    o.spawn=!!e&&e.type==='mossback'&&e.rare==='mossback'&&Math.hypot(e.x-sp.x,e.y-sp.y)<5&&e.max>ETYPES.golem.hp*2;
    S.wd.t=PACE.hush+1;rareUpdate(RARES.rumorAt+0.1);const bq=()=>[document.getElementById('banner').textContent,...(typeof BANNER!=='undefined'?BANNER.q.map(b=>b[0]):[]),...(typeof CQS!=='undefined'?CQS.q.map(m=>m.txt||''):[]),...(typeof MSG!=='undefined'?MSG.seen.concat(MQ.small.map(m=>m.txt),MQ.big.map(m=>m.txt)):[])];o.rumor=S.wd.rare.rumor<=0&&bq().some(t=>String(t).includes(T('rare.at.'+sp.at)));   // הודעות בתור (welcome.js)
    rareDraw();rareMove(e,0.05);
    const sc=scentStart(null);o.scent=!!sc&&sc.kind==='rare'&&sc.foe===e&&!rareScent();S.wd.scent=null;
    QS().active.rank1={p:[0,0]};const q=QBY.rank1,ri=q.obj.findIndex(x=>x.type==='rare');
    const hunt=id=>{const x=rareSpawn(id,1);damage(x,x.hp*20,'sword',0,'physical');rareUpdate(0.01);return x.dead};
    damage(e,e.hp*20,'sword',0,'physical');rareUpdate(0.01);o.p1=qProg(q,ri);o.book=bookHas('f','mossback');
    hunt('mossback');o.same=qProg(q,ri)===1&&RS().got.mossback===2;
    hunt('glimmer');hunt('pearl');o.p3=qProg(q,ri);
    const v=rareSpawn('hoarfrost',0);S.wd.rare.t=0;rareUpdate(0.01);o.vanish=v.dead&&!RS().got.hoarfrost&&S.wd.rare.done;
    // ניר, 7.11: מי שנשאר באזור מקבל עוד הגרלה, שורת שמועה עם זמן, עיגול במפה, שם זהוב עם ✨, ורשימה בקווסט
    const ac0=RARES.againChance;RARES.againChance=1;rareUpdate(30);o.wait=S.wd.rare.done;rareUpdate((tierRareAgain()||RARES.again));
    const ag=S.wd.rare;RARES.againChance=ac0;o.again=!ag.done&&!ag.e.dead&&RARES.list[ag.id].reg===(S.wd.reg||'meadow');
    o.label=ag.e.pname.startsWith(RARES.icon)&&ag.e.pname.includes(rareName(ag.id));
    ag.rumor=0;rareLineSync();const rl=document.getElementById('rareLine');o.line=!rl.hidden&&rl.textContent.includes(rareAt(ag.sp))&&/\d:\d\d/.test(rl.textContent)&&Math.hypot(ag.mx-ag.sp.x,ag.my-ag.sp.y)<=RARES.mapR*0.5+1;
    const lh=rareListHtml();o.list=(lh.match(/class="runk"/g)||[]).length===Object.keys(RARES.list).length-Object.keys(RS().got).length&&lh.includes(rareName('pearl'));
    ag.gone=true;ag.e.dead=true;rareUpdate(0.01);rareLineSync();o.lineOff=rl.hidden;
    o.saved=((JSON.parse(localStorage.getItem(SAVE_STORE.key)).rares||{}).got||{}).pearl===1;
    delete QS().active.rank1;SAVE.rares=JSON.parse(r0);SAVE.book=JSON.parse(b0);enemies=[];enterVillage();return o});
  check(!rar.noRare.length&&!rar.bad.length&&rar.none&&rar.spawn&&rar.rumor&&rar.scent&&rar.p1===1&&rar.book&&rar.same&&rar.p3===3&&rar.vanish&&rar.saved&&rar.wait&&rar.again&&rar.label&&rar.line&&rar.list&&rar.lineOff,
    'מפלצות נדירות: '+(rar.noRare.length?'אזור בלי נדירה: '+rar.noRare.join(','):'בכל אזור')+(rar.bad.length?', נתונים שבורים: '+rar.bad.join(','):', מקומות, שם, מראה וספר')+(rar.none?', בלי מזל אין':', מופיעה תמיד')+
    (rar.spawn?', הופיעה חזקה במקום הנסתר':', לא הופיעה')+(rar.rumor?', שמועה':', בלי שמועה')+(rar.scent?', פיוחו מריחה':', פיוחו לא מריחה')+
    ', קווסט הדרגה '+rar.p1+'→'+rar.p3+'/3'+(rar.same?'':' (אותה נדירה נספרה פעמיים!)')+(rar.book?', בספר':', לא בספר')+(rar.vanish?', נעלמת בזמן':', לא נעלמת')+(rar.saved?', נשמר':', לא נשמר')+
    (rar.wait?'':', הגרלה חוזרת מוקדם מדי')+(rar.again?', הגרלה חוזרת באזור':', אין הגרלה חוזרת')+(rar.label?', שם ✨':', בלי שם ✨')+(rar.line?', שורת שמועה עם זמן':', אין שורת שמועה')+(rar.lineOff?'':', השורה לא נעלמת')+(rar.list?', רשימה בקווסט':', אין רשימה בקווסט'));
  // שמות ואופי לאויבים (foelore.js): לכל סוג בעולם שם, שם אישי לעלית, כרטיס בפגישה ראשונה שנסגר לבד ונשמר, בועה מעל הראש
  const flo=await page.evaluate(()=>{
    const o={},m0=JSON.stringify(SAVE.lore||null);SAVE.lore=null;FLC.q=[];flCardNext();   // כרטיסים שנשארו בתור מהמשחק של הבוט
    const types=[...new Set([WORLD,...Object.values(WORLD.regions||{})].flatMap(R=>(R.foes||[]).map(G=>G.type)))];
    o.missing=types.filter(k=>!flName(k)||/^fl\./.test(flName(k))||!flLine(k));
    o.elite=flPersonal(12345);o.eliteOk=/ /.test(o.elite)&&flPersonal(12345)===o.elite;
    enterWorld('home');enemies=[];
    const e=addEnemy('grunt',P.x+90,P.y,1);e.home=0;e.affix='fast';foeLoreUpdate(0.01);
    o.pname=!!e.pname;o.card=flCardOn()&&!$('flCard').hidden&&$('flCard').textContent.includes(flName('grunt'))&&$('flCard').getBoundingClientRect().height<60;o.met=!!(SAVE.lore&&SAVE.lore.met.grunt);
    o.say=!!(S.wd.flSay&&S.wd.flSay.txt);
    for(let i=0;i<70;i++)foeLoreUpdate(0.1);o.closed=!flCardOn()&&$('flCard').hidden;
    const e2=addEnemy('grunt',P.x+80,P.y,1);e2.home=0;foeLoreUpdate(0.01);o.once=!flCardOn();
    o.saved=!!((JSON.parse(localStorage.getItem(SAVE_STORE.key)).lore||{}).met||{}).grunt;
    // חלון פתוח: הפס לא מופיע מעליו ולא נגמר מתחתיו, וחוזר כשהחלון נסגר
    const ov=document.querySelector('.ov[hidden]');ov.hidden=false;flMeet('shield');for(let i=0;i<70;i++)foeLoreUpdate(0.1);
    o.ovHide=flCardOn()&&$('flCard').hidden;ov.hidden=true;foeLoreUpdate(0.01);o.ovBack=flCardOn()&&!$('flCard').hidden;FLC.q=[];flCardNext();
    enemies=[];enterVillage();SAVE.lore=JSON.parse(m0);return o});
  check(!flo.missing.length&&flo.eliteOk&&flo.pname&&flo.card&&flo.met&&flo.say&&flo.closed&&flo.once&&flo.saved&&flo.ovHide&&flo.ovBack,
    'שמות לאויבים: '+(flo.missing.length?'חסר שם ל-'+flo.missing.join(','):'לכל סוג בעולם יש שם')+', עלית: "'+flo.elite+'"'+(flo.pname?'':' (לא קיבל שם)')+(flo.card?', פס פגישה ראשונה':', אין פס')+
    (flo.closed?' שנסגר לבד':' שלא נסגר')+(flo.once?', פעם אחת':', חוזר')+(flo.saved?', נשמר':', לא נשמר')+(flo.say?', בועה':', בלי בועה')+(flo.ovHide?(flo.ovBack?', מחכה מתחת לחלון':', לא חוזר אחרי חלון'):', מופיע מעל חלון'));
  // סימן קריאה מעל אויב של קווסט (questmark.js): אויב של יעד kill פעיל מסומן, אחר לא, 'any' ונדירה לא, ואחרי שהיעד הושלם הסימן נעלם
  const qmk=await page.evaluate(()=>{
    const o={},a0=JSON.stringify(QS().active);enterWorld('home');enemies=[];
    for(const id in QS().active)delete QS().active[id];
    QS().active.grunts={p:[0]};QS().active.dAny={p:[0]};
    const g=addEnemy('grunt',P.x+90,P.y,1),s=addEnemy('shield',P.x-90,P.y,1),r=addEnemy('grunt',P.x,P.y+90,1);r.rare='x';
    QM.f=0;qmScreen(0,0);o.on=qmMarked(g);o.other=!qmMarked(s);o.rare=!qmMarked(r);
    QS().active.grunts.p[0]=QBY.grunts.obj[0].n;QM.f=0;qmScreen(0,0);o.off=!qmMarked(g);
    QS().active.grunts.p[0]=0;enemies=[];enterVillage();enemies=[g];qmScreen(0,0);o.arena=!QM.list.length;enemies=[];const A=JSON.parse(a0);for(const id in QS().active)delete QS().active[id];Object.assign(QS().active,A);return o});
  check(qmk.on&&qmk.other&&qmk.rare&&qmk.off&&qmk.arena,
    'סימן קווסט: '+(qmk.on?'אויב של קווסט מסומן':'אויב של קווסט לא מסומן')+(qmk.other?', אחר לא':', גם אחר מסומן')+(qmk.rare?', נדירה לא':', נדירה מסומנת')+
    (qmk.off?', נעלם כשהיעד הושלם':', נשאר אחרי שהושלם')+(qmk.arena?', רק בעולם':', גם מחוץ לעולם'));
  // בוס-נמסיס (nemesis.js): עלית שהפיל אותך נהיה נמסיס עם שם ונשמר, חוזר באותו אזור חזק יותר וזוכר אותך, עולה דרגה כשהוא מנצח שוב, אחד לאזור, וכשמנצחים אותו: שלל, חגיגה, ונעלם לספר
  const nm=await page.evaluate(()=>{
    const o={},n0=JSON.stringify(SAVE.nem||null);SAVE.nem=null;
    const type=WORLD.foes.find(G=>ETYPES[G.type]&&!G.creature).type;
    enterWorld('home');enemies=[];
    const e=addEnemy(type,P.x+60,P.y,1);e.home=0;e.affix='burst';nemOnDeath();
    const N=NS().list[0];o.born=!!N&&N.reg==='meadow'&&N.rank===1&&N.cause==='burst'&&/ /.test(nemName(N));
    o.saved=((JSON.parse(localStorage.getItem(SAVE_STORE.key)).nem||{}).list||[]).length===1;
    const e5=addEnemy(type,P.x+50,P.y,1);e5.home=0;e5.leader=1;nemOnDeath();o.one=NS().list.length===1;   // אחד לאזור
    enterWorld('home');const a=S.wd.nemE;o.spawn=!!a&&a.nem===N.id&&a.pname===nemName(N)&&a.max>ETYPES[type].hp*2;
    P.x=a.x+40;P.y=a.y;nemUpdate(0.05);o.say=!!S.wd.flSay&&S.wd.flSay.txt===T('nem.say.by',T('nem.cause.burst'))&&N.esc>0;
    enemies=[a];nemOnDeath();o.rank=N.rank===2&&N.wins===2&&N.esc==null;
    const m1=a.max;enterWorld('home');const b=S.wd.nemE;o.stronger=!!b&&b.max>m1;
    nemCard(N);o.card=nemCardOn()&&!$('nemCard').hidden&&$('nemCard').textContent.includes(T('nem.say.wins',2));
    for(let i=0;i<60;i++)nemCardTick(0.1);o.closed=!nemCardOn()&&$('nemCard').hidden;
    const c0=dropStats().spawned,f0=FX.length;damage(b,b.hp*10,'sword',0,'physical');nemUpdate(0.01);
    o.beat=!NS().list.length&&NS().won.length===1&&!S.wd.nemE;o.loot=dropStats().spawned>c0+1&&FX.length>f0;
    o.book=nemBookHtml().includes(T('nem.wonIt'));
    enterWorld('home');o.gone=!S.wd.nemE;
    enemies=[];enterVillage();SAVE.nem=JSON.parse(n0);return o});
  check(Object.values(nm).every(Boolean),'בוס-נמסיס: '+Object.entries(nm).map(([k,v])=>(v?'':'✗')+k).join(', '));
  // טיפ ראשון (firsttips.js): נמסיס ובוס ענק יחד: מוצג אחד, השני בתור. מחכה מתחת לחלון ולפס אחר, לא חוזר, נשמר. דרישה של חפץ: טיפ בתוך החלון שנעלם עם השורה. כבוי: כלום
  const tp=await page.evaluate(()=>{
    const o={},t0=JSON.stringify(SAVE.tips||null),off0=!!SAVE.tipsOff,n0=JSON.stringify(SAVE.nem||null),lo0=JSON.stringify(SAVE.lore||null);
    enterWorld('home');enemies=[];S.mode='play';FLC.q=[];flCardNext();nemCardOff();MUT.bar=null;skgOfferClose();tipClose();TIP1.q=[];TIP1.pendWin=null;
    SAVE.tipsOff=false;SAVE.tips={mut:1,skill:1,sklv:1,depths:1,req:1,q:1};SAVE.nem=null;
    const N={id:'ntip',reg:'meadow',type:WORLD.foes.find(G=>ETYPES[G.type]&&!G.creature).type,n:77,rank:1,wins:1,esc:null,cause:'near'};NS().list.push(N);
    const w0=S.wd.warden;S.wd.warden={wboss:'earth',dead:false};
    tipTick(0.25);
    o.first=!!TIP1.on&&TIP1.on.k==='nem'&&tipShownN()===1&&$('tip1').textContent.includes(nemName(N));
    o.queue=TIP1.q.length===1&&TIP1.q[0].k==='giant';
    const ov=document.querySelector('.ov[hidden]');ov.hidden=false;const t1=TIP1.t;for(let i=0;i<8;i++)tipTick(0.25);
    o.underOv=$('tip1').hidden&&TIP1.t===t1&&TIP1.on.k==='nem';ov.hidden=true;tipTick(0.01);o.backOv=!$('tip1').hidden;
    for(let i=0;i<30&&TIP1.on&&TIP1.on.k==='nem';i++)tipTick(0.25);
    tipTick(0.25);   // הבא בתור עולה בבדיקה שאחרי
    o.next=!!TIP1.on&&TIP1.on.k==='giant'&&tipShownN()===1;
    FLC.q=['grunt'];flCardNext();tipTick(0.25);o.band=flCardOn()&&!$('flCard').hidden&&$('tip1').hidden;FLC.q=[];flCardNext();
    for(let i=0;i<30&&TIP1.on;i++)tipTick(0.25);
    for(let i=0;i<8;i++)tipTick(0.25);o.once=!TIP1.on&&!TIP1.q.length;
    o.saved=!!(JSON.parse(localStorage.getItem(SAVE_STORE.key)).tips||{}).nem;
    // בתוך חלון: חפץ שנעול בדרישה
    delete SAVE.tips.req;const id=Object.keys(GEAR.items).find(k=>GEAR.items[k].tier===3&&GEAR.items[k].slot!=='orbit'),lv0=ITEMROLL.req.lv[3],sk0=ITEMROLL.skip;ITEMROLL.req.lv[3]=99;ITEMROLL.skip=false;
    const d=document.createElement('div');d.innerHTML=itemCard(id);document.body.appendChild(d);tipTick(0.25);
    o.req=!!TIP1.on&&TIP1.on.k==='req'&&TIP1.on.win&&$('tip1').textContent.includes('99');
    d.remove();tipTick(0.25);o.reqGone=!TIP1.on;ITEMROLL.req.lv[3]=lv0;ITEMROLL.skip=sk0;
    SAVE.tipsOff=true;o.off=!tipOnce('depths');
    S.wd.warden=w0;SAVE.nem=JSON.parse(n0);SAVE.lore=JSON.parse(lo0);SAVE.tips=JSON.parse(t0);SAVE.tipsOff=off0;tipClose();TIP1.q=[];
    enemies=[];enterVillage();return o});
  check(Object.values(tp).every(Boolean),'טיפ ראשון: '+Object.entries(tp).map(([k,v])=>(v?'':'✗')+k).join(', '));
  // החיה מריחה ומובילה (petscent.js): מרחרחת, רצה למקום ומחכה עם חץ, תיבה נותנת שלל כשמגיעים, אויב מיוחד נותן שלל כשנופל, ומי שלא בא היא מוותרת
  const ps=await page.evaluate(()=>{
    const o={};enterWorld('home');if(S.wd.rare){S.wd.rare.e.dead=true;S.wd.rare=null}const p=S.pet||petMake();p.st='idle';const pk=SCENT.pick;   // נדירה שהופיעה במקרה קודמת לכל ריח (rares.js), אז מוציאים אותה
    SCENT.pick={secret:0,chest:1,elite:0};S.wd.scentT=0;petUpdate(0.02);const s=S.wd.scent;o.start=!!s&&s.st==='sniff'&&s.kind==='chest';
    for(let i=0;i<200&&s.st!=='wait';i++)petUpdate(0.05);o.wait=s.st==='wait'&&Math.hypot(p.x-s.x,p.y-s.y)<12;
    o.far=Math.hypot(s.x-P.x,s.y-P.y)>=120;
    const c0=dropStats().spawned;P.x=s.x;P.y=s.y;petUpdate(0.02);o.chest=dropStats().spawned>c0&&!S.wd.scent&&S.wd.scentT>0;
    SCENT.pick={secret:0,chest:0,elite:1};S.wd.scentT=0;p.st='idle';petUpdate(0.02);const e=S.wd.scent;o.elite=!!e&&!!e.foe&&!!e.foe.affix;
    P.x=e.foe.x+20;P.y=e.foe.y;petUpdate(0.02);o.fight=e.st==='fight';const c1=dropStats().spawned;damage(e.foe,e.foe.hp*10,'sword',0,'physical');petUpdate(0.02);
    o.eliteLoot=dropStats().spawned>c1&&!S.wd.scent;
    SCENT.pick={secret:0,chest:1,elite:0};S.wd.scentT=0;p.st='idle';petUpdate(0.02);const g=S.wd.scent;g.st='wait';g.t=SCENT.wait+1;p.x=g.x;p.y=g.y;P.x=g.x+300;P.y=g.y;petUpdate(0.02);o.giveUp=!S.wd.scent;
    S.wd.scentT=0;p.st='idle';petUpdate(0.02);const j=S.wd.scent;j.st='wait';p.x=j.x;p.y=j.y;P.x=j.x+900;P.y=j.y;petUpdate(0.02);petUpdate(0.02);o.giveUp=o.giveUp&&!S.wd.scent;
    SCENT.pick=pk;return o});
  await page.evaluate(()=>enterVillage());
  check(ps.start&&ps.wait&&ps.far&&ps.chest&&ps.elite&&ps.fight&&ps.eliteLoot&&ps.giveUp,
    'החיה מריחה ומובילה: '+(ps.start?'מרחרחת':'לא מתחילה')+(ps.wait?', רצה ומחכה במקום':', לא הגיעה')+(ps.far?'':', קרוב מדי')+(ps.chest?', תיבה נותנת שלל':', תיבה בלי שלל')+
    (ps.elite?', אויב מיוחד הופיע':', אין אויב מיוחד')+(ps.fight?', קרב':', בלי קרב')+(ps.eliteLoot?', שלל כשנפל':', בלי שלל מהאויב')+(ps.giveUp?', מוותרת אחרי המתנה':', לא מוותרת'));
  // דרגות עולם (tiers.js): סגור עד סוף הסיפור, נבחר במפה, מחזק אויבים בעולם (גם את מי שכבר שם), שלל נוסף, ודרגה 3 נפתחת אחרי הריגות
  const tr=await page.evaluate(()=>{
    const o={},st0=JSON.stringify(SAVE.story);SAVE.tier=null;SAVE.story=Object.assign({},SAVE.story,{end:false});
    enterWorld('home');wmapOpen(true);o.lock=!document.querySelector('#wMap .tierrow')&&!tierSet(2);wmapOpen(false);   // לפני סוף הסיפור אין בחירת דרגה במפה בכלל (המבקר)
    const a=addEnemy('grunt',P.x+300,P.y,1);a.home=0;tierSpawn(a);const h1=a.max,d1=a.dmg;
    SAVE.story.end=true;wmapOpen(true);const b2=document.querySelector('#wMap [data-act="tier"][data-n="2"]');o.btn=!!b2&&!b2.disabled;if(b2)b2.click();
    o.on=TS().t===2&&!!document.querySelector('#wMap .tierb.on[data-n="2"]');o.lock3=!!document.querySelector('#wMap [data-act="tier"][data-n="3"]:disabled');wmapOpen(false);
    o.live=Math.abs(a.max/h1-TIERS.list[1].hp)<0.01&&Math.abs(a.dmg/d1-TIERS.list[1].dmg)<0.01;
    const c0=dropStats().spawned;damage(a,a.hp*10,'sword',0,'physical');o.coins=dropStats().spawned>c0;o.k=TS().k;
    TS().k=999;o.noKill=!tierOpen(3);   // הריגות כבר לא פותחות את אגדי (ת11)
    // שומר בדרגה 2 חזק יותר משומר בדרגה 1, ופי big
    tierSet(1);const w1=storyWarden('earth',P.y+400);const h1w=w1.max,d1w=w1.dmg;w1.dead=true;S.wd.warden=null;
    tierSet(2);const w2=storyWarden('earth',P.y+400);o.warden=Math.abs(w2.max/h1w-TIERS.list[1].big.hp)<0.01&&Math.abs(w2.dmg/d1w-TIERS.list[1].big.dmg)<0.01;
    const g0=S.gearDrops||0;damage(w2,w2.hp*10,'sword',0,'physical');o.bigGear=(S.gearDrops||0)>g0;S.wd.warden=null;
    // אגדי לא נופל בדרגה 1, גם ברמה גבוהה. נבדק על ההגרלה עצמה (lootRoll), 300 פעם
    const lv0=SAVE.hero.level;SAVE.hero.level=60;tierSet(1);o.noLegend=true;
    for(let i=0;i<300;i++){const id=lootRoll(3);if(GEAR.items[gBase(id)]&&GEAR.items[gBase(id)].tier>=4){o.noLegend=false;break}}
    SAVE.hero.level=lv0;tierSet(2);
    o.open3=tierWin({warden:TIERS.boss,tierK:{t:2}})&&tierSet(3)&&tierNow()===3;   // שומר הצל באמיץ פותח את אגדי
    o.saved=(JSON.parse(localStorage.getItem(SAVE_STORE.key)).tier||{}).t===3;
    SAVE.story.end=false;o.back=tierNow()===1;SAVE.story=JSON.parse(st0);SAVE.tier=null;return o});
  await page.evaluate(()=>enterVillage());
  check(tr.lock&&tr.btn&&tr.on&&tr.lock3&&tr.live&&tr.coins&&tr.k===1&&tr.noKill&&tr.warden&&tr.bigGear&&tr.noLegend&&tr.open3&&tr.saved&&tr.back,
    'דרגות עולם: '+(tr.lock?'סגור לפני הסוף':'פתוח לפני הסוף')+(tr.btn?', נפתח אחרי הסוף':', לא נפתח')+(tr.on?', אמיץ נבחר במפה':', הבחירה לא עבדה')+(tr.lock3?', אגדי נעול':', אגדי פתוח מוקדם')+
    (tr.live?', אויב קיים התחזק':', אויב קיים לא השתנה')+(tr.coins?', שלל נוסף':', בלי שלל נוסף')+', נספרו '+tr.k+(tr.noKill?'':', הריגות פתחו את אגדי')+(tr.warden?', שומר מתחזק':', שומר לא התחזק')+(tr.bigGear?', חפץ בטוח משומר':', בלי חפץ משומר')+(tr.noLegend?', אין אגדי ברגיל':', אגדי נפל ברגיל')+(tr.open3?', הצל פתח את אגדי':', אגדי לא נפתח')+(tr.saved?', נשמר':', לא נשמר')+(tr.back?'':', לא חוזר לרגיל בלי סוף'));
  // רמה מקסימלית ועקומה (ranks.js, ת11): לא עוברים את RANKS.xp.max, אחרי late.from כל רמה יקרה יותר, ושחקן קיים לא מאבד רמות במעבר
  const rc=await page.evaluate(()=>{const h=SAVE.hero,b={xp:h.xp,level:h.level,xpv:h.xpv},X=RANKS.xp,o={};
    o.cap=rankLevelOf(1e12)===X.max&&rankNeed(X.max)===Infinity;
    o.late=rankNeed(X.late.from+10)-rankNeed(X.late.from+9)>rankNeed(X.late.from-9)-rankNeed(X.late.from-10);
    h.level=60;h.xp=0;for(let l=1;l<60;l++)h.xp+=X.base+X.per*l;h.xpv=0;rankFix();o.keep=h.level===60&&rankLevelOf(h.xp)===60;   // XP של רמה 60 בעקומה הישנה
    Object.assign(h,b);return o});
  check(rc.cap&&rc.late&&rc.keep,'רמה עד '+100+': '+(rc.cap?'תקרה':'אין תקרה')+(rc.late?', הרמות הגבוהות יקרות יותר':', העקומה לא מואצת')+(rc.keep?', שחקן קיים שומר על הרמה':', שחקן קיים איבד רמות'));
  // מתח בקרב בעולם (wtension.js): מכים אחד והקבוצה שלו רודפת, ושחקן שעבר את האחו פוגש אויבים חזקים יותר (שחקן חדש לא)
  const wt=await page.evaluate(()=>{
    const o={},lv0=SAVE.hero.level;enterWorld('home');
    const g=WORLD.foes.findIndex(G=>G.type==='grunt'&&!G.creature),mk=()=>{const e=addEnemy('grunt',P.x+400,P.y,1);e.home=g;return e};
    const a=mk(),b=mk(),c=addEnemy('grunt',P.x+420,P.y,1);c.home=g+1;
    damage(a,1,'sword',0,'physical');wtGroups();o.group=b.alert>0&&!(c.alert>0);
    SAVE.hero.level=1;o.newK=wtOverK();o.cap=wtCap();
    SAVE.hero.level=20;o.hiK=wtOverK();const e=mk(),h=e.max;wtSpawn(e);o.hp=Math.round(e.max/h*100)/100;
    SAVE.hero.level=lv0;return o});
  await page.evaluate(()=>enterVillage());
  check(wt.group&&wt.newK===1&&wt.hiK>1&&wt.hiK<=2.4&&wt.hp===Math.round(wt.hiK*100)/100,
    'מתח בעולם: '+(wt.group?'מכה באחד מעירה את הקבוצה שלו (ולא אחרת)':'הקבוצה לא התעוררה')+', האחו מתאים עד רמה '+wt.cap+', ברמה 1 ×'+wt.newK+', ברמה 20 ×'+wt.hiK+' (חיים ×'+wt.hp+')');
  // מכות עם הכנה (story.js, STORY.tele, docs/plan-combat.md שינוי 1): כל שומר מכה לפחות מכה אחת, ולפני כל מכה יש סימן של 0.6 שניות לפחות.
  // לשומר האבן: רקיעה והסתערות. ברקיעה: מי שנשאר בעיגול נפגע, מי שזז לא
  const tl=await page.evaluate(()=>{const out={};const hp0=P.hp,mx0=P.maxHp;
    for(const k in STORY.lanterns){const L=STORY.lanterns[k];enterWorld('home',L.reg);for(const e of enemies)e.dead=true;
      P.x=L.x;P.y=L.y-150;P.hp=P.maxHp=1e9;const e=storyWarden(k,L.y+70);e.rise=0;S.wd.telLog=[];let t=0;
      for(let i=0;i<480;i++){const dd=Math.floor(t/3)%2?110:320,a=Math.atan2(P.y-e.y,P.x-e.x);P.x=e.x+Math.cos(a)*dd;P.y=e.y+Math.sin(a)*dd;P.inv=0;e.hp=e.max;worldUpdate(0.025);t+=0.025}
      const lg=S.wd.telLog;out[k]={n:lg.length,min:lg.length?Math.min(...lg.map(l=>l.warn)):0,kinds:[...new Set(lg.map(l=>l.kind))].join('+')};e.dead=true}
    // רקיעה: עומד בעיגול נפגע, זז החוצה לא
    const L=STORY.lanterns.earth,slam=stay=>{enterWorld('home','meadow');for(const e of enemies)e.dead=true;P.maxHp=1e9;P.hp=1e9;const e=storyWarden('earth',L.y+70);e.rise=0;const gap=e.r+30;   // מחוץ לגוף של הענק, בתוך הרקיעה
      P.x=e.x+gap;P.y=e.y;e.slamT=0;let h=0;for(let i=0;i<60;i++){P.inv=0;if(!stay&&e.tel)P.x=e.x+400;const b=P.hp;worldUpdate(0.025);if(e.tel&&e.tel.kind!=='slam')break;h+=b-P.hp;P.x=stay?e.x+gap:P.x}
      e.dead=true;return h};
    out.hitStay=slam(true)>0;out.hitMove=slam(false);P.maxHp=mx0;P.hp=hp0;enterVillage();return out});
  const tk=Object.keys(tl).filter(k=>!k.startsWith('hit'));
  check(tk.every(k=>tl[k].n>0&&tl[k].min>=0.6)&&/slam/.test(tl.earth.kinds)&&/charge/.test(tl.earth.kinds)&&tl.hitStay&&tl.hitMove===0,
    'שומרים, מכות עם סימן: '+tk.map(k=>k+' '+tl[k].kinds+' ('+tl[k].n+', סימן '+tl[k].min+'s)').join(', ')+(tl.hitStay?' · רקיעה פוגעת במי שנשאר':' · רקיעה לא פוגעת')+(tl.hitMove===0?' ולא במי שזז':' וגם במי שזז ('+Math.round(tl.hitMove)+')'));
  // חוק הנדירות (gear.js, GEAR.ladder): בכל משבצת, פריט נדיר יותר חזק לפחות פי ladder מהשכבה שמתחת. ניר: "נעליים נדירות גרועות מרגילות"
  // והתרמיל המסודר: מסננים לפי משבצת, מיון לפי משבצת ונדירות, ▲/▼ מול מה שלבוש, נקודה לחדש, ללבוש הכי טוב, ולמכור חלשים עם אישור בחלון
  const bg=await page.evaluate(()=>{
    const o={bad:gLadder().map(b=>b.weak+'<'+b.top+' ×'+b.k)},keep=JSON.stringify({bag:SAVE.bag,gear:SAVE.gear,seen:SAVE.gseen||null}),c0=celebrate;celebrate=()=>0;
    enterVillage();const g0=gearStats();SAVE.gear.boots=['starterBoots'];gearLive(g0);SAVE.gseen={};
    for(const k in SAVE.bag)if(gItem(k))delete SAVE.bag[k];   // תרמיל נקי: פריטים מהריצה (שלל, קווסטים) לא משנים את הבדיקה
    ['swiftBoots','wardenBoots','wardenBoots','oakSword','ironSword','boneCharm'].forEach(k=>bagAdd(k));bagAdd('starterBoots');bagAdd('starterBoots');
    gSeen().oakSword=1;S.mode='play';gearOpen();
    o.chips=Object.keys(GEAR.filter).every(f=>!!document.querySelector('#gTabs [data-tab="'+f+'"]'));
    const ids=[...document.querySelectorAll('#gItems [data-id]')].map(e=>e.dataset.id),sl=ids.map(k=>Object.keys(GEAR.filter).indexOf(gItem(k).slot));
    o.sorted=sl.every((v,i)=>!i||v>=sl[i-1])&&ids.indexOf('swiftBoots')<ids.indexOf('wardenBoots');
    const t=k=>document.querySelector('#gItems [data-id="'+k+'"]');
    o.up=!!t('swiftBoots').querySelector('.gmk.up');o.new=!!t('swiftBoots').querySelector('.gnew')&&!t('oakSword').querySelector('.gnew');
    t('swiftBoots').click();o.seen=!t('swiftBoots').querySelector('.gnew');
    document.querySelector('#gTabs [data-tab="boots"]').click();o.filter=[...document.querySelectorAll('#gItems [data-id]')].every(e=>gItem(e.dataset.id).slot==='boots');
    document.querySelector('#gActs [data-act="best"]').click();o.best=SAVE.gear.boots[0]==='swiftBoots';
    o.down=!!t('starterBoots')&&!!t('starterBoots').querySelector('.gmk.down');
    // מכירה (ניר 2.11: "לא ברור איך משתמשים... מכרתי משהו שלא התכוונתי, ואין אפשרות למכור הכל"): מצב בחירה, ✓ בנגיעה, בחר חלשים, אישור ליקר, נעילה והחזר
    bagAdd('ironSword');bagAdd('stormBow');document.querySelector('#gTabs [data-tab="items"]').click();
    t('ironSword').click();document.querySelector('#gDetail [data-act="lock"]').click();o.lock=gLocked('ironSword');
    const coins=SAVE.bag.coins||0,b0=Object.assign({},SAVE.bag),dq=s=>document.querySelector('#gDetail '+s);
    document.querySelector('#gActs [data-act="sell"]').click();
    o.ask=GUI.sell&&!!dq('[data-act="sellYes"]')&&dq('[data-act="sellYes"]').disabled&&(SAVE.bag.starterBoots||0)>0;   // נכנסים למצב בחירה, ולא מוכרים כלום
    dq('[data-act="sellWeak"]').click();const pk=gSellPick();o.list=Object.keys(pk).join(',');
    o.weak=pk.starterBoots===b0.starterBoots&&!pk.stormBow&&!pk.ironSword&&pk.wardenBoots===b0.wardenBoots-1;   // לא יקר, לא נעול, ומסט נשאר עותק
    o.scroll=getComputedStyle(t('starterBoots')).touchAction==='pan-y'&&getComputedStyle(dq('.gsell')).overflowY==='auto';
    t('starterBoots').click();o.keep=t('starterBoots').getAttribute('aria-pressed')==='false'&&!gSellPick().starterBoots;
    t('starterBoots').click();o.keep=o.keep&&t('starterBoots').getAttribute('aria-pressed')==='true'&&gSellPick().starterBoots===b0.starterBoots&&t('ironSword').disabled;
    t('stormBow').click();dq('[data-act="sellYes"]').click();o.rare=!!dq('[data-act="sellSure"]')&&SAVE.bag.stormBow===b0.stormBow;   // יקר: אישור קודם
    dq('[data-act="sellBack"]').click();t('stormBow').click();dq('[data-act="sellYes"]').click();
    o.out=!GUI.sell&&!dq('[data-act="sellYes"]')&&!$('ovGear').hidden;
    o.sold=!SAVE.bag.starterBoots&&SAVE.bag.wardenBoots===1&&SAVE.bag.stormBow===b0.stormBow&&SAVE.bag.ironSword===b0.ironSword&&(SAVE.bag.coins||0)>coins;o.got=(SAVE.bag.coins||0)-coins;
    document.querySelector('#gActs [data-act="undo"]').click();
    o.undo=SAVE.bag.starterBoots===b0.starterBoots&&SAVE.bag.wardenBoots===b0.wardenBoots&&(SAVE.bag.coins||0)===coins&&!document.querySelector('#gActs [data-act="undo"]');
    // חפץ מסתובב (gOrbFacts): בפרטים רואים מה הוא נותן, וההשוואה מראה ▲ ולא "בלי שינוי"
    SAVE.gear.orbit=SAVE.gear.orbit.map(()=>null);bagAdd('cloverOrb');document.querySelector('#gTabs [data-tab="items"]').click();
    const ob=document.querySelector('#gItems [data-id="cloverOrb"]');if(ob)ob.click();const ot=$('gDetail').innerText;
    o.orb=!!ob&&/▲/.test(ot)&&!ot.includes(T('gear.same'))&&ot.includes(T('orb.f.crit'))&&ot.includes(T('orb.f.loot'));o.orbTxt=ot.replace(/\s+/g,' ').slice(0,90);
    gearClose();const g1=gearStats(),k=JSON.parse(keep);SAVE.bag=k.bag;SAVE.gear=k.gear;SAVE.gseen=k.seen||undefined;gearLive(g1);celebrate=c0;saveNow();return o});
  check(!bg.bad.length&&bg.chips&&bg.sorted&&bg.up&&bg.new&&bg.seen&&bg.filter&&bg.best&&bg.down&&bg.ask&&bg.sold&&bg.scroll&&bg.keep&&bg.out&&bg.orb&&bg.lock&&bg.weak&&bg.rare&&bg.undo,
    'ציוד ותרמיל: '+(bg.bad.length?'פריט נדיר חלש מדי: '+bg.bad.join(', '):'כל נדירות חזקה מזו שמתחת')+(bg.chips?', מסננים':', אין מסננים')+(bg.sorted?', ממוין':', לא ממוין')+
    (bg.up&&bg.down?', ▲/▼':', חסר ▲/▼')+(bg.new&&bg.seen?', נקודה לחדש':', הנקודה לא עובדת')+(bg.filter?'':', המסנן לא מסנן')+(bg.best?', ללבוש הכי טוב':', "הכי טוב" לא עבד')+
    (bg.ask?', מצב בחירה':', אין מצב בחירה')+(bg.weak?', בחר חלשים ('+bg.list+')':', "בחר חלשים" בחר לא נכון ('+bg.list+')')+(bg.lock?', נעילה':', הנעילה לא עובדת')+
    (bg.rare?', אישור ליקר':', יקר בלי אישור')+(bg.sold?', נמכרו (+'+bg.got+')':', המכירה לא עבדה')+(bg.undo?', החזר':', "החזר" לא החזיר')+
    (bg.scroll?', נגלל':', לא נגלל באצבע')+(bg.keep?', נגיעה מסמנת':', נגיעה בפריט לא מסמנת')+(bg.out?', יוצאים ממצב מכירה':', נתקע במצב מכירה')+
    (bg.orb?', חפץ מסתובב מראה מה הוא נותן':', חפץ מסתובב בלי סטטים ("'+bg.orbTxt+'")'));
  // כרטיס החפץ בחלון הציוד (gCardHtml ב-gearui.js, itemCard ב-itemcard.js): מספר כוח, איכות "מתוך", בלי שורות 0%, ללבוש, ולשדרג שעובר לנפחייה עם החפץ בחור
  const gc=await page.evaluate(()=>{
    const o={},keep=JSON.stringify({bag:SAVE.bag,gear:SAVE.gear,vf:SAVE.village.forge}),c0=celebrate;celebrate=()=>0;
    try{enterVillage();SAVE.village.forge=Math.max(1,vLv('forge'));S.mode='play';const id='ironSword~104';bagAdd(id);gearOpen();
      const q=s=>document.querySelector('#gDetail '+s),t=document.querySelector('#gItems [data-id="'+id+'"]');if(t)t.click();
      o.card=!!q('.icard .icpow b')&&+q('.icpow b').textContent===icPow(id)&&!!q('.icard h4');
      o.q=!!q('.iq')&&q('.iq').textContent.includes(String(icPow(id)));
      o.zero=!!q('.iclines')&&!/(^|[^\d.])[+-]?0(\.0)?%/.test(q('.iclines').textContent);
      o.btns=!!q('.gcbtns [data-act="equip"]')&&!!q('.gcbtns [data-act="gup"]');
      if(q('[data-act="equip"]'))q('[data-act="equip"]').click();o.worn=SAVE.gear.weapon===id&&!!q('.gcbtns [data-act="unequip"]')&&!q('.icd');
      if(q('[data-act="gup"]'))q('[data-act="gup"]').click();o.up=S.mode==='forge'&&$('ovGear').hidden&&!$('ovForge').hidden&&aSelId()===id;
      forgeClose();
    }finally{gearClose();forgeClose();const g1=gearStats(),k=JSON.parse(keep);SAVE.bag=k.bag;SAVE.gear=k.gear;SAVE.village.forge=k.vf;gearLive(g1);celebrate=c0;S.mode='play';saveNow()}
    return o});
  check(gc.card&&gc.q&&gc.zero&&gc.btns&&gc.worn&&gc.up,'כרטיס חפץ בציוד (gearui.js): '+(gc.card?'מספר כוח ושם':'אין כרטיס')+(gc.q?', איכות מתוך טווח':', בלי איכות')+(gc.zero?', בלי שורות 0%':', יש שורות 0%')+
    (gc.btns?', ללבוש ולשדרג':', חסר כפתור')+(gc.worn?', לבוש: בלי השוואה, עם להוריד':', הלבישה מהכרטיס לא עבדה')+(gc.up?', לשדרג פותח את הנפחייה עם החפץ':', לשדרג לא פתח את הנפחייה'));
  // מספר כוח (power.js): לכל חפץ יש מספר, ובכל מחלקה ובכל משבצת חפץ בשכבה גבוהה יותר חזק מכל חפץ בשכבה שמתחת. בחלון: מספר הגיבור בראש הטור, בלי שורות 0, ו-+N כשעולה
  const pwn=await page.evaluate(()=>{
    const o={none:[],inv:[]},keep=JSON.stringify({bag:SAVE.bag,gear:SAVE.gear,hero:SAVE.hero.start,seen:SAVE.hero.powSeen}),c0=celebrate;let cel=0;celebrate=()=>{cel++;return 0};
    try{for(const id in GEAR.items)if(GEAR.items[id].slot!=='orbit'&&!(powItem(id)>0))o.none.push(id);
      for(const c of Object.keys(HEROES.list)){SAVE.hero.start=c;
        for(const a in GEAR.items)for(const b in GEAR.items){const A=GEAR.items[a],B=GEAR.items[b];
          if(A.slot!=='orbit'&&A.slot===B.slot&&B.tier===A.tier+1&&powItem(b)<=powItem(a))o.inv.push(c+':'+a+'>'+b)}}
      SAVE.hero.start=JSON.parse(keep).hero;
      enterVillage();S.mode='play';SAVE.gear.weapon='oakSword';bagAdd('ironSword');gearOpen();SAVE.hero.powSeen=powHero();gearDraw();
      const q=s=>document.querySelector('#ovGear '+s);
      o.hero=!!q('.gpow b')&&+q('.gpow b').textContent===powHero();
      o.zero=!!q('.gsrows')&&!/(^|[^\d.])[+-]?0(\.0)?%/.test(q('.gsrows').textContent+(q('.gres')?q('.gres').textContent:''));
      const t=q('#gItems [data-id="ironSword"] .gmk.up');o.tile=!!t&&t.textContent.includes(String(powVs('ironSword')));
      const h0=powHero();gearEquip('ironSword');gearDraw();o.rise=powHero()>h0&&cel>0&&!!q('.gpow.gpup .gpowd');
    }finally{gearClose();const g1=gearStats(),k=JSON.parse(keep);SAVE.bag=k.bag;SAVE.gear=k.gear;SAVE.hero.start=k.hero;SAVE.hero.powSeen=k.seen;gearLive(g1);celebrate=c0;S.mode='play';saveNow()}
    return o});
  check(!pwn.none.length&&!pwn.inv.length&&pwn.hero&&pwn.zero&&pwn.tile&&pwn.rise,'מספר כוח (power.js): '+(pwn.none.length?'בלי מספר: '+pwn.none.join(', '):'לכל חפץ מספר')+
    (pwn.inv.length?', שכבה גבוהה חלשה: '+pwn.inv.slice(0,4).join(', '):', שכבה גבוהה תמיד חזקה')+(pwn.hero?', מספר הגיבור בטור':', אין מספר לגיבור')+
    (pwn.zero?', בלי שורות 0':', יש שורות 0')+(pwn.tile?', ▲ עם הפרש בתרמיל':', אין הפרש בתרמיל')+(pwn.rise?', עולה עם חגיגה':', אין חגיגה כשעולה'));
  // שריון לפי מחלקה (armor.js): קסדה וגוף של המחלקה נלבשים במשבצות ראש וגוף, ההגנה עולה, השריון נראה על הדמות ובחלון, והשלל בעולם מוטה למחלקה
  const ar=await page.evaluate(()=>{
    const o={},keep=JSON.stringify({bag:SAVE.bag,gear:SAVE.gear,pity:SAVE.clsPity}),c0=celebrate;celebrate=()=>{};
    const h=ARMOR.cls[heroId()]?heroId():'warrior',hd=h+'Head2',bd=h+'Body2',d0=P.def||0,od0=defOld();
    o.items=ARMOR.slots.every(s=>Object.keys(ARMOR.cls).every(c=>[0,1,2,3,4].every(t=>{const it=gItem(c+armorSlot(s)+t);return it&&it.slot===s&&it.stats.def>0&&T('it.'+c+armorSlot(s)+t)!=='it.'+c+armorSlot(s)+t})));
    o.items=o.items&&[0,1,2,3,4].every(t=>gItem('shield'+t)&&gItem('shield'+t).slot==='shield');
    bagAdd(hd);bagAdd(bd);bagAdd('shield2');S.mode='play';gearOpen();
    o.slots=!!document.querySelector('#gSlots [data-slot="head"]')&&!!document.querySelector('#gSlots [data-slot="body"]')&&!!document.querySelector('#gSlots [data-slot="shield"]');
    gDoEquip(hd);gDoEquip(bd);gDoEquip('shield2');gRedraw();
    o.worn=gGet('head',0)===hd&&gGet('body',0)===bd&&gearWorn().includes(hd)&&gearWorn().includes(bd);
    o.oldD=Math.round((defOld()-od0)*100)/100;   // בזירה: אותו אחוז כמו קודם, 5+9+8 (defense.js)
    o.def=Math.round(((P.def||0)-d0)*10)/10;o.defOk=o.def===gItem(hd).stats.def+gItem(bd).stats.def+gItem('shield2').stats.def;
    {const t=document.querySelector('#gSlots [data-slot="head"]');o.tile=!!t&&(t.textContent.includes(gItem(hd).icon)||!!t.querySelector('img[src*="/'+gBase(hd)+'.png"]'))}   // אימוג'י, או התמונה של הפריט (icons/ui/gear)
    if(R3D.on&&R3D.ready){syncPlayer(0.016);o.r3=(R3D.player.arG||[]).length>0;o.doll=!R3D.doll||!R3D.doll.a||(R3D.doll.a.arG||[]).length>0}else o.r3=o.doll=true;
    gearClose();
    // השלל בעולם: לכל אחת משלוש המחלקות (לא רק זו שהבוט בחר, ובלי מחלקה אין הטיה בכלל), 3000 הגרלות עם מזל משלה,
    // כדי שהבדיקה לא תזיז את המזל של הבוט ולא תיפול על מזל. בכל מחלקה נופלים כ-500 שריונות, ו-ARMOR.loot.mine (0.7) מהם של המחלקה: בודקים טווח של ±0.12
    const hs=SAVE.hero.start,rnd=Math.random;let sd=4242;Math.random=()=>(sd=sd*16807%2147483647)/2147483647;o.loot=[];o.lootOk=true;
    try{for(const c of Object.keys(ARMOR.cls)){SAVE.hero.start=c;let mine=0,other=0;
      for(let i=0;i<3000;i++){const it=gItem(lootRoll(1));if(it&&it.cls){if(it.cls===c)mine++;else other++}}
      const r=mine/Math.max(1,mine+other);o.loot.push(c+' '+mine+'/'+other);if(mine+other<200||Math.abs(r-ARMOR.loot.mine)>0.12)o.lootOk=false}}
    finally{Math.random=rnd;SAVE.hero.start=hs}o.loot=o.loot.join(', ');
    const g1=gearStats(),k=JSON.parse(keep);SAVE.bag=k.bag;SAVE.gear=k.gear;SAVE.clsPity=k.pity;gearLive(g1);celebrate=c0;saveNow();
    o.back=(P.def||0)===d0;return o});
  check(ar.items&&ar.slots&&ar.worn&&ar.defOk&&ar.tile&&ar.r3&&ar.doll&&ar.lootOk&&ar.back,
    'שריון לפי מחלקה: '+(ar.items?'30 חלקים ו-5 מגנים':'חסרים חלקים או שמות')+(ar.slots?', משבצות ראש, גוף ומגן':', אין משבצות')+(ar.worn?', נלבש':', לא נלבש')+
    (ar.defOk?', הגנה +'+ar.def:', ההגנה לא עלתה ('+ar.def+')')+(ar.tile?'':', לא מופיע במשבצת')+(ar.r3?'':', לא נראה על הדמות')+(ar.doll?'':', לא נראה בחלון')+
    (ar.lootOk?', שלל מוטה למחלקה ('+ar.loot+')':', השלל לא מוטה ('+ar.loot+')')+(ar.back?'':', לא חזר אחרי הבדיקה'));
  // הנשק בבובה של חלון הציוד (doll3d.js, באג 9.11.2026, docs/weapon-audit-2026-11-09.md): לפני שהמודל של הנשק נטען, מודל זמני בלי זוהר הדרגה;
  // אחרי שהוא נטען הבובה מתחלפת לבד (בלי לצייר את החלון מחדש); והנשק כולו בתוך הקנבס בכל הנדנוד
  if(CFG.gfx==='3d'){
    const dw=await page.evaluate(()=>{const o={keep:JSON.stringify({gear:SAVE.gear,start:SAVE.hero.start,bag:SAVE.bag})};
      const ids=Object.keys(GEAR.items).filter(k=>GEAR.items[k].slot==='weapon'&&m3dLazy('w_item_'+k));
      o.id=ids.find(k=>!R3D.props['w_item_'+k]&&!M3D.p['w_item_'+k])||ids[0];if(!o.id)return o;const id=o.id;o.was=!!R3D.props['w_item_'+id];
      const t=wTypeOf(id);SAVE.hero.start=Object.keys(HEROES.list).find(k=>HEROES.list[k].arms.includes(t))||SAVE.hero.start;
      for(const s in SAVE.gear){const v=SAVE.gear[s];SAVE.gear[s]=Array.isArray(v)?v.map(()=>null):null}SAVE.gear.weapon=id;wEquip(id);R3D._hl=null;
      S.mode='play';gearOpen();const D=R3D.doll;if(!D||!D.a)return o;
      const p=heroLook().props[wUse(id)];o.pre=p.prop;o.preGlow=o.was?null:p.glow||null;o.preTier=p.tier;return o});
    for(let i=0;i<120&&dw.id&&!await page.evaluate(id=>['ready','fail'].includes(M3D.st['w_item_'+id]),dw.id);i++){await page.waitForTimeout(50);await page.clock.runFor(50)}
    const d2=await page.evaluate(id=>{const o={};if(!id||!R3D.doll||!R3D.doll.a)return o;const D=R3D.doll;
      o.st=M3D.st['w_item_'+id];o.keyOld=D.key!==dollKey();dollFrame();o.fresh=D.key===dollKey();o.prop=heroLook().props[wUse(id)].prop;
      if(D.raf){cancelAnimationFrame(D.raf);D.raf=0}
      // הקופסה של הנשק בחמש נקודות בנדנוד: כל פינה בתוך הקנבס (מעט שוליים, כי הקופסה גדולה מהנשק)
      const a=D.a,pr=a.props[wUse(id)];o.out=0;
      for(let j=0;j<5;j++){a.root.rotation.y=D.yaw+D.sway*(j/2-1);a.root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(pr);
        for(const X of [b.min.x,b.max.x])for(const Y of [b.min.y,b.max.y])for(const Z of [b.min.z,b.max.z]){const v=new THREE.Vector3(X,Y,Z).project(D.cam);if(Math.abs(v.x)>1.04||Math.abs(v.y)>1.04)o.out++}}
      return o},dw.id);
    await page.evaluate(k=>{gearClose();const K=JSON.parse(k);SAVE.gear=K.gear;SAVE.hero.start=K.start;SAVE.bag=K.bag;R3D._hl=null;wEquip(SAVE.gear.weapon);saveNow()},dw.keep);
    const ok=dw.id&&!dw.preGlow&&d2.st==='ready'&&d2.fresh&&/^w_item_/.test(d2.prop)&&d2.out===0;
    check(ok,'נשק בבובה ('+dw.id+'): '+(dw.was?'כבר נטען':'לפני הטעינה '+dw.pre+'/'+dw.preTier+(dw.preGlow?' עם זוהר '+dw.preGlow+' ✗':' בלי זוהר'))+
      ', '+(d2.st!=='ready'?'המודל לא נטען ('+d2.st+')':d2.fresh&&/^w_item_/.test(d2.prop)?'הבובה התחלפה לבד ('+d2.prop+')':'הבובה לא התחלפה ('+d2.prop+')')+
      (d2.out===0?', כולו בתוך הקנבס':', נחתך ('+d2.out+' פינות מחוץ לקנבס)'));
  }
  // הגנה כדירוג (defense.js, ניר 7.11.2026): נקודות מול רמת התוקף, תשואה פוחתת, תקרה גבוהה, והזירה בדיוק כמו קודם
  const dfr=await page.evaluate(()=>{
    const o={},r1=v=>Math.round(v*10)/10;
    o.pct=[defPct(36,1),defPct(110,12),defPct(210,22)].map(r1);   // עץ באחו, כסף ברכס, זהב במדבר: היו 12%, 22%, 30%
    o.pctOk=Math.abs(o.pct[0]-12)<2&&Math.abs(o.pct[1]-22)<2&&Math.abs(o.pct[2]-30)<2;
    o.dr=defPct(200,10)-defPct(100,10)<defPct(100,10)&&defPct(100,30)<defPct(100,1);   // כל נקודה שווה פחות, ומפלצת גבוהה בולעת פחות
    o.cap=DEFENSE.cap>=80;
    o.anchor=[1,12,30].every(L=>{const K=defK(L);return K>0&&defPct(0,L)===0&&defPct(-50,L)===0&&Math.abs(defPct(K,L)-50)<1e-9&&Math.abs(defPct(2*K,L)-200/3)<1e-9});   // עוגנים: 0 → 0%, K → 50%, 2K → 66.7%
    const k={wd:S.wd,vil:S.vil,mb:S.mb},pd=P.def;
    try{S.wd=null;S.vil=null;S.mb=null;P.def=9e4;o.arenaCap=defNow()===STATS.cap.def;   // בזירה: התקרה הישנה
      P.def=pd;o.arena=Math.abs(defNow()-Math.min(STATS.cap.def,defOld()+defFx()))<1e-9;
      S.vil=k.vil||{};P.def=9e4;o.worldCap=defNow()<=DEFENSE.cap&&defNow()>STATS.cap.def}
    finally{S.wd=k.wd;S.vil=k.vil;S.mb=k.mb;P.def=pd}
    return o});
  check(dfr.pctOk&&dfr.anchor&&dfr.dr&&dfr.cap&&dfr.arenaCap&&dfr.arena&&dfr.worldCap&&Math.abs(ar.oldD-22)<0.01,
    'הגנה כדירוג: '+dfr.pct.join('% / ')+'%'+(dfr.pctOk?' (כמו קודם באזור)':' (רחוק מהישן)')+(dfr.anchor?', עוגנים 0/50/67%':', עוגנים שגויים')+(dfr.dr?', תשואה פוחתת':', בלי תשואה פוחתת')+
    (dfr.worldCap&&dfr.cap?', תקרה '+'85%':', תקרה שגויה')+(dfr.arenaCap&&dfr.arena&&Math.abs(ar.oldD-22)<0.01?', בזירה כמו קודם (+'+ar.oldD+'%)':', הזירה השתנתה (+'+ar.oldD+'%)'));
  // משבצת ריקה = בלי כובע (ניר, 4.11.2026): בלי ראש וגוף אין קסדה, כובע או גלימה דלוקים, ולבישת ראש משנה את מה שרואים. בכל המחלקות, בסקינים ובבובה
  if(CFG.gfx==='3d'){const hv=await page.evaluate(()=>{
    if(!R3D.on||!R3D.ready)return {skip:true};
    const o={bad:[],same:[]},keep=JSON.stringify({gear:SAVE.gear,start:SAVE.hero.start,skin:SAVE.hero.skin});
    const sig=a=>{const n=[];a.root.traverse(m=>{if(m.isMesh&&m.visible&&armorPart(m,ARMOR_NATIVE))n.push(armorPart(m,ARMOR_NATIVE))});return {nat:n,built:(a.arG||[]).length}};
    const look=(h,sk,head,doll)=>{SAVE.hero.start=h;SAVE.hero.skin=sk;SAVE.gear.head=head?[h+'Head2']:[];SAVE.gear.body=[];R3D._hl=null;
      if(doll){const D=R3D.doll||dollInit();D.key=null;dollBuild(D);return sig(D.a)}syncPlayer(0);return sig(R3D.player)};
    try{for(const [h,sk,doll] of [['warrior',null],['hunter',null],['mage',null],['warrior','nir'],['warrior','orel'],['warrior',null,1]]){
      const tag=h+(sk?'/'+sk:'')+(doll?'/בובה':''),off=look(h,sk,false,doll),on=look(h,sk,true,doll);
      if(off.nat.length||off.built)o.bad.push(tag+': '+(off.nat.join('+')||'חלק'));
      if(JSON.stringify(off)===JSON.stringify(on)&&!(sk&&ARMOR.hat.none.includes(HEROES.skins[sk].look)))o.same.push(tag)}   // אוראל: בלי כובע בכלל (ARMOR.hat.none)
    }finally{const k=JSON.parse(keep);SAVE.gear=k.gear;SAVE.hero.start=k.start;SAVE.hero.skin=k.skin;R3D._hl=null;syncPlayer(0);if(R3D.doll&&R3D.doll.a)R3D.doll.key=null}
    return o});
    if(!hv.skip)check(!hv.bad.length&&!hv.same.length,'משבצת ראש ריקה: '+(hv.bad.length?'חלק ראש דלוק בלי קסדה ('+hv.bad.join(', ')+')':'בלי כובע או קסדה ב-3 המחלקות, בסקינים ובבובה')+(hv.same.length?', הקסדה לא שינתה כלום ('+hv.same.join(', ')+')':', וקסדה משנה את המראה'))}
  // חפצים כמו ב-Priston Tale (itemroll.js): איכות אקראית בשלל בעולם שנשמרת במזהה, דרישות רמה ותכונה שחוסמות לבישה (ומה שלבוש נשאר), ובונוס מחלקה
  const ir=await page.evaluate(()=>{
    const o={},keep=JSON.stringify({bag:SAVE.bag,gear:SAVE.gear,pity:SAVE.clsPity,pts:SAVE.hero.pts||{},lv:SAVE.hero.level,start:SAVE.hero.start}),v0=S.vil,g0=gearStats(),c0=celebrate;celebrate=()=>{};
    try{ITEMROLL.skip=false;if(!S.vil&&!S.wd)S.vil={near:null,open:null,ui:'',raise:{}};
      // איכות: כל ציוד שנופל בעולם מקבל ~, בטווח, ולא תמיד אותו מספר
      const qs=[];for(let i=0;i<300;i++){const id=lootRoll(1);if(gItem(id)&&gItem(id).slot!=='orbit')qs.push(gQtag(id)?gQ(id):-1)}
      o.q=qs.length>20&&qs.every(q=>q>=ITEMROLL.q.min&&q<=ITEMROLL.q.max)&&Math.min(...qs)<100&&Math.max(...qs)>100;o.qr=Math.min(...qs)+'–'+Math.max(...qs);
      const x='ironSword+3#keen~104';
      o.fmt=gBase(x)==='ironSword'&&gPlus(x)===3&&gPow(x)==='keen'&&gQ(x)===104&&gQ('ironSword')===100&&ageId(x,4)==='ironSword+4#keen~104'&&powId('ironSword~96','hunt')==='ironSword#hunt~96';
      o.stat=gStats('ironSword~110',true).sdmg===27.5&&gStats('ironSword').sdmg===25&&gScore('ironSword~110',true)>gScore('ironSword~90',true)&&/\(22\.5–27\.5\)/.test(gStatsHtml('ironSword~100'));
      // דרישות: רמה 1 בלי נקודות לא לובשת ברזל, עץ תמיד. עם הרמה והנקודות כן, ואחרי שהן יורדות הוא נשאר לבוש
      SAVE.hero.start='warrior';SAVE.hero.level=1;SAVE.hero.pts={};const id='ironSword~100';bagAdd(id);
      o.free=irReq('oakSword')==null&&irCanWear('oakSword');
      o.block=!gearEquip(id)&&SAVE.bag[id]===1&&/class="ireq no"/.test(gStatsHtml(id))&&gMark(id)===-2&&!gBestPlan().some(p=>p.id===id);
      const r=irReq(id);o.req=r.lv+' '+r.st+' '+r.n;SAVE.hero.level=r.lv;SAVE.hero.pts={[r.st]:r.n};
      o.wear=!!gearEquip(id)&&SAVE.gear.weapon===id;SAVE.hero.level=1;SAVE.hero.pts={};o.kept=SAVE.gear.weapon===id&&gearWorn().includes(id);
      o.arena=(()=>{const a=S.vil,b=S.wd;S.vil=S.wd=null;const k=irCanWear('goldAxe');S.vil=a;S.wd=b;return k})();   // בזירה אין דרישות
      o.typ=irReq('ironBow').st==='agi'&&irReq('ironAxe').st==='str'&&irReq('silverWand').st==='haste'&&irReq('hunterHead2').st==='agi';
      // בונוס מחלקה: חרב מהעולם אצל לוחם עולה, חרב בלי ~ לא, ואצל צייד לא
      o.cls=gStats('ironSword~100').sdmg>gStats('ironSword~100',true).sdmg&&gStats('ironSword').sdmg===25&&/class="icls on"/.test(gStatsHtml('ironSword~100'));
      SAVE.hero.start='hunter';o.cls=o.cls&&gStats('ironSword~100').sdmg===25&&gStats('ironBow~100').gdmg>25;
    }catch(e){o.err=e.message}
    const k=JSON.parse(keep);ITEMROLL.skip=true;S.vil=v0;SAVE.bag=k.bag;SAVE.gear=k.gear;SAVE.clsPity=k.pity;SAVE.hero.pts=k.pts;SAVE.hero.level=k.lv;SAVE.hero.start=k.start;gearLive(g0);celebrate=c0;saveNow();
    o.back=JSON.stringify(gearStats())===JSON.stringify(g0);return o});
  check(!ir.err&&ir.q&&ir.fmt&&ir.stat&&ir.free&&ir.block&&ir.wear&&ir.kept&&ir.arena&&ir.typ&&ir.cls&&ir.back,
    'חפצים (itemroll.js): '+(ir.err?'שגיאה: '+ir.err:(ir.q?'איכות בשלל '+ir.qr+'%':'אין איכות בשלל ('+ir.qr+')')+(ir.fmt?'':', המזהה נשבר')+(ir.stat?'':', הסטטים לא לפי האיכות')+
    (ir.block?', דרישה ('+ir.req+') חוסמת':', דרישה לא חוסמת')+(ir.free?'':', עץ עם דרישה')+(ir.wear?', נלבש כשעומדים בה':', לא נלבש')+(ir.kept?', לבוש נשאר':', לבוש נזרק')+
    (ir.arena?'':', דרישות בזירה')+(ir.typ?'':', תכונה לא לפי סוג')+(ir.cls?', בונוס מחלקה':', בונוס מחלקה שבור')+(ir.back?'':', לא חזר אחרי הבדיקה')));
  // בוסים תמיד, בטיימר (giant.js, GIANT.ladder, ניר 5.11): הענק במאורה גם בלי קווסט ועם שלט רמה מומלצת. ניצחון: טיימר בשעה אמיתית (נשמר),
  // אבן עם שעון ולא קם, וכשהזמן עובר (מקדמים את השעון) קם שוב. ניצחון חוזר נותן שלל, והסולם: טיימר ושלל פי ratio מבוס לבוס
  const gt=await page.evaluate(()=>{
    const o={},st0=JSON.stringify(SAVE.story),L=STORY.lanterns.water,Q=QS(),qa=Q.active.s2Warden,qd=Q.done.s2Warden,now0=Date.now,lv0=SAVE.hero.level;
    delete Q.active.s2Warden;STO().bt={};enterWorld('home','lake');for(const e of enemies)e.dead=true;enemies=enemies.filter(e=>!e.dead);
    P.x=L.x+700;P.y=L.y;worldUpdate(0.016);o.asleep=!S.wd.warden&&Math.hypot(P.x-L.x,P.y-L.y)>L.warden.wake;
    SAVE.hero.level=1;const sh=[];const ft=ctx.fillText;ctx.fillText=function(t){sh.push(String(t));return ft.apply(this,arguments)};giantLairScreen('water',L,0,0);ctx.fillText=ft;
    o.sign=sh.some(t=>t===T('cu.rec',giantLv('water')));SAVE.hero.level=lv0;
    {const m=giantLair('water');P.x=m.x;P.y=m.y+200}worldUpdate(0.016);const e=S.wd.warden;o.noQuest=!!e&&e.warden==='water'&&!e.first;
    if(e){P.inv=1e9;damage(e,e.hp*10,'sword',0,'physical');worldUpdate(0.016)}
    const bt=STO().bt.water,want=Math.round(GIANT.ladder.base*GIANT.ladder.ratio)*60000;
    o.timer=!!bt&&Math.abs(bt-Date.now()-want)<5000;o.saved=(JSON.parse(localStorage.getItem(SAVE_STORE.key)).story.bt||{}).water===bt;
    o.loot=(S.wd.reGot||[]).length>0&&drops().some(d=>d.r==='coins');
    for(let i=0;i<5;i++)worldUpdate(0.016);o.wait=!S.wd.warden&&giantLeft('water')>0;
    o.ladder=[0,1,2,3,4,5].map(i=>Math.round(giantWait(Object.keys(STORY.lanterns)[i])/60000)).join(',');
    Date.now=()=>now0()+want+1000;worldUpdate(0.016);o.back=!!S.wd.warden;Date.now=now0;
    if(S.wd.warden){S.wd.warden.dead=true;enemies=enemies.filter(e=>!e.dead);S.wd.warden=null}
    SAVE.story=JSON.parse(st0);if(qa)Q.active.s2Warden=qa;if(qd)Q.done.s2Warden=qd;P.inv=0;saveNow();enterVillage();return o});
  check(gt.asleep&&gt.sign&&gt.noQuest&&gt.timer&&gt.saved&&gt.loot&&gt.wait&&gt.back&&gt.ladder==='10,15,23,34,51,76',
    'בוסים בטיימר: '+(gt.asleep?'ישן רחוק מהמאורה':'קם מרחוק')+(gt.sign?', שלט רמה מומלצת':', אין שלט')+(gt.noQuest?', קם גם בלי קווסט':', לא קם בלי קווסט')+
    (gt.timer?', ניצחון מתחיל טיימר':', אין טיימר')+(gt.saved?' שנשמר':' שלא נשמר')+(gt.loot?', שלל':', בלי שלל')+(gt.wait?', מחכה':', קם מיד')+
    (gt.back?', וחוזר כשהזמן עובר':', לא חוזר')+', דקות: '+gt.ladder);
  // קפיצה לא נוחתת על הענק (ניר, 6.11: "אם אתה משתגר לפנס, הבוס ישר מופיע עליך"): בכל אזור, אחרי קפיצה לפנס הדולק (TRAVEL.arrive)
  // ולכל אבן מסע (WAYSTONES.arrive), הענק לא קם, והמרחק מהמאורה לפחות GIANT.lair.safe. המאורה לא במכשול ועד leash מהפנס
  const lj2=await page.evaluate(()=>{
    const bad=[],st0=JSON.stringify(SAVE.story);let min=1e9;STO().bt={};
    for(const k in STORY.lanterns){const L=STORY.lanterns[k],m=giantLair(k);STO()[k]=true;
      enterWorld('home',L.reg);for(const e of enemies)e.dead=true;enemies=enemies.filter(e=>!e.dead);
      if(tBlocked(m.x,m.y))bad.push(k+': מאורה במכשול');if(Math.hypot(m.x-L.x,m.y-L.y)>STORY.chase.leash)bad.push(k+': מאורה רחוקה מהפנס');
      const lands=[{n:'פנס',x:L.x,y:L.y+TRAVEL.arrive}].concat(wsList(L.reg).map(s=>({n:s.id,x:s.x,y:s.y+WAYSTONES.arrive})));
      for(const l of lands){P.x=l.x;P.y=l.y;placeClamp(P);S.wd.warden=null;storyUpdate(0.016);
        const d=Math.hypot(P.x-m.x,P.y-m.y);min=Math.min(min,Math.round(d));
        if(S.wd.warden||d<GIANT.lair.safe)bad.push(k+'/'+l.n+': '+Math.round(d));
        if(S.wd.warden){S.wd.warden.dead=true;enemies=enemies.filter(e=>!e.dead);S.wd.warden=null}}}
    SAVE.story=JSON.parse(st0);saveNow();enterVillage();return{bad,min}});
  check(!lj2.bad.length,'קפיצה ליד ענק: '+(lj2.bad.length?'נוחתים ליד המאורה ('+lj2.bad.join(', ')+')':'בכל 6 האזורים נוחתים רחוק מהמאורה (הכי קרוב '+lj2.min+'), והענק לא קם'));
  // שלבים בענקים (giant.js, GIANT.phase, ניר 5.11): מתחת ל-66% שלב 2 עם התקפה חדשה ורעידה, מתחת ל-33% שלב 3 עם מכה גדולה:
  // עיגול ⚠️ מתחת לשחקן שמתפוצץ אחרי fuse, ואפשר לצאת ממנו. הצל שומר על חמשת השלבים שלו
  const gph=await page.evaluate(()=>{
    const o={},L=STORY.lanterns.earth,hp0=P.hp,mx0=P.maxHp;enterWorld('home','meadow');for(const e of enemies)e.dead=true;enemies=enemies.filter(e=>!e.dead);
    P.x=L.x;P.y=L.y-150;P.hp=P.maxHp=1e9;P.inv=1e9;const e=storyWarden('earth',L.y+70);e.rise=0;S.wd.marks=[];
    storyWardenMove(e,0.016);o.p1=!e.gph;
    S.shake=0;e.hp=e.max*0.6;storyWardenMove(e,0.016);o.p2=e.gph===1&&!!(e.pw&&e.pw.shoot)&&S.shake>=GIANT.phase.shake-0.01;
    e.hp=e.max*0.3;for(let t=0;t<GIANT.phase.big.first+0.2;t+=0.05){e.tel=null;e.dash=null;e.stun=0;P.x=L.x;P.y=L.y-150;storyWardenMove(e,0.05)}
    const B=(S.wd.marks||[]).find(m=>m.big);o.p3=e.gph===2&&!!B&&Math.hypot(B.x-P.x,B.y-P.y)<B.mk.r;
    if(B){S.wd.marks=[B];P.inv=0;P.hp=P.maxHp=1000;P.x+=B.mk.r*3;for(let i=0;i<120;i++)storyMarks(1/60);o.dodge=!B.hit&&P.hp===1000}
    const sh=storyWarden('light',L.y+70);sh.rise=0;sh.hp=sh.max*0.3;storyWardenMove(sh,0.016);o.shade=sh.gph===2&&sh.phases===true&&!!sh.pk;
    for(const x of [e,sh])x.dead=true;enemies=enemies.filter(x=>!x.dead);S.wd.warden=null;S.wd.marks=[];P.inv=0;P.maxHp=mx0;P.hp=hp0;enterVillage();return o});
  check(gph.p1&&gph.p2&&gph.p3&&gph.dodge&&gph.shade,'שלבים בענקים: '+(gph.p1?'מתחיל בשלב 1':'לא מתחיל בשלב 1')+(gph.p2?', שלב 2 עם התקפה חדשה ורעידה':', שלב 2 שבור')+
    (gph.p3?', שלב 3 עם מכה גדולה מתחת לשחקן':', אין מכה גדולה')+(gph.dodge?' שאפשר לצאת ממנה':', אי אפשר לצאת ממנה')+(gph.shade?', הצל שומר על השלבים שלו':', השלבים של הצל נשברו'));
  // נקודות דמות (stats.js): הריגה בעולם נותנת XP לדמות, רמה נותנת נקודה, נקודה מעלה נזק, נשמרת, ואיפוס אצל הכוהנת עולה מטבעות
  const stt=await page.evaluate(()=>{
    enterWorld('home');const o={};const xp0=SAVE.hero.xp||0,e={x:P.x+40,y:P.y,xp:3,type:'grunt',hp:0,r:10,mult:{}};
    statKillXp(e);o.xp=(SAVE.hero.xp||0)-xp0;
    SAVE.hero.xp+=rankNeed(SAVE.hero.level)+5;rankSync();o.free=stFree();
    const d0=P.sw.dmg;o.add=statAdd('str');o.dmg=Math.round(P.sw.dmg/d0*100)/100;o.saved=(JSON.parse(localStorage.getItem(SAVE_STORE.key)).hero.pts||{}).str>=1;
    statAdd('def');const h0=P.hp;P.inv=0;hurt(100);o.def=Math.round((h0-P.hp)*10)/10;P.hp=P.maxHp;
    gearOpen('char');o.ui=document.querySelectorAll('#gChar .strow').length;
    SAVE.hero.xp+=4000;rankSync();o.tfree=trFree();const sw0=P.sw.dmg;document.querySelector('#gChar [data-act="tree"]').click();
    o.tree=document.querySelectorAll('#gTree .trn').length;const hp0=P.maxHp,lb=document.querySelector('#gTree [data-act="learn"][data-b="war"]');if(lb)lb.click();
    o.learned=((SAVE.hero.tree||{}).war||[])[0]==='w1'&&P.maxHp>hp0;
    // צומת "אחד משניים": נטוע באדמה. עומדים שנייה, ומכה נחלשת. והשני (מכה חוזרת) נסגר
    document.querySelector('#gTree [data-act="learn"][data-id="wRoot"]').click();o.fork=!document.querySelector('#gTree [data-id="wCounter"]');
    gearClose();P.moving=false;P.stillT=0;statTick(1.2);const h1=P.hp;P.inv=0;hurt(100);o.rooted=P.rooted&&Math.round(h1-P.hp)<100;P.hp=P.maxHp;o.build=buildName();
    // שתי בניות: מחליפים לבנייה 2 (ריקה, כל הנקודות פנויות) וחוזרים, והעץ של בנייה 1 חוזר
    enterVillage();const tb1=JSON.stringify(SAVE.hero.tree),f1=stFree();statBuild(1);o.b2=stFree()>f1&&!Object.keys(SAVE.hero.tree).length;statBuild(0);o.b1=JSON.stringify(SAVE.hero.tree)===tb1;
    // צייד: תנופה (בתנועה הנזק עולה). קוסם: גלגל היסודות (כל פגיעה בסוג אחר)
    SAVE.hero.xp+=6000;rankSync();treeLearn('hunt','h1');treeLearn('hunt','hMomentum');P.moving=true;statTick(2.2);o.mom=Math.round(statDmgFx('gun',{max:100,hp:50})*100)/100;P.moving=false;statTick(0.1);
    treeLearn('mage','m1');treeLearn('mage','mRotate');const t1=statDmgType('gun',P.dt.gun),t2=statDmgType('gun',P.dt.gun);o.rot=t1!==t2?t1+'→'+t2:'';
    enterVillage();bagAdd('coins',statRespecCost());const c0=SAVE.bag.coins;S.vil.dlg=null;npcTalk(STATS.respec.npc);
    const rb=document.querySelector('#npcDlg [data-act="respec"]');o.btn=!!rb;if(rb)rb.click();o.reset=stSpent()===0;o.paid=c0-(SAVE.bag.coins||0);npcTalk(null);
    return o});
  check(stt.xp>0&&stt.free>0&&stt.add&&stt.dmg>1&&stt.saved&&stt.def<100&&stt.ui===6&&stt.tree>=18&&stt.learned&&stt.fork&&stt.rooted&&!!stt.build&&stt.b2&&stt.b1&&stt.mom>1.2&&!!stt.rot&&stt.btn&&stt.reset&&stt.paid===0,
    'נקודות דמות: הריגה בעולם +'+stt.xp+' XP, נקודות פנויות '+stt.free+', כוח: נזק x'+stt.dmg+(stt.saved?', נשמר':', לא נשמר')+', הגנה: מכה של 100 עשתה '+stt.def+
    ', במסך הציוד '+stt.ui+' סטטים, עץ סקילים: '+stt.tree+' סקילים, '+stt.tfree+' נקודות, '+(stt.learned?'נלמד עור עבה והחיים עלו':'לא נלמד')+(stt.fork?', אחד משניים נסגר':', הצומת לא נסגר')+(stt.rooted?', נטוע באדמה מוריד נזק':', נטוע באדמה לא עבד')+', הבנייה: '+(stt.build||'בלי שם')+(stt.b2&&stt.b1?', שתי בניות מתחלפות':', שתי הבניות לא עובדות')+', צייד בתנועה: נזק x'+stt.mom+', גלגל יסודות: '+(stt.rot||'לא עבד')+', איפוס אצל הכוהנת '+(stt.btn?'':'(אין כפתור) ')+(stt.reset?'עבד':'לא עבד')+(stt.paid?' ושילם '+stt.paid+' (צריך חינם בפעם הראשונה)':' בחינם, פעם ראשונה'));
  // ציוד שרואים (GEAR3D ב-render3d.js): עם חרב מגן ביד השנייה, עם קשת בלי, ונשק נדיר זוהר. בתלת-ממד גם בודקים שהמגן באמת ביד
  const gv=await page.evaluate(()=>{
    enterWorld('home');const o={},g0=JSON.stringify(SAVE.gear),b0=JSON.stringify(SAVE.bag);
    for(const id of ['silverBlade','oakBow','goldAmulet','swiftBoots'])bagAdd(id,1);
    SAVE.gear.weapon='silverBlade';SAVE.gear.acc=['goldAmulet'];SAVE.gear.boots=['swiftBoots'];SAVE.gear.shield=[];R3D._hl=null;
    let L=heroLook();o.noShield=!L.props.shield;SAVE.gear.shield=['shield3'];R3D._hl=null;L=heroLook();o.shield=!!L.props.shield&&L.props.shield.prop===itemModel('shield3');o.head=!!L.g3&&!!L.g3.head;
    if(R3D.on&&R3D.ready){P.weapon='sword';syncPlayer(0);const a=R3D.player;o.in3d=!!a.props.shield&&a.props.shield.visible;
      let g=false;a.props.sword.traverse(m=>{if(m.isMesh&&m.material.emissive.getHex())g=true});o.glow=g}else{o.in3d=true;o.glow=true}
    SAVE.gear.weapon='oakBow';R3D._hl=null;L=heroLook();o.noBow=!L.props.shield;
    SAVE.gear=JSON.parse(g0);SAVE.bag=JSON.parse(b0);R3D._hl=null;return o});
  check(gv.shield&&gv.noShield&&gv.head&&gv.in3d&&gv.glow&&gv.noBow,'ציוד שרואים: '+(gv.shield?'מגן זהב מהמשבצת':'אין מגן')+(gv.noShield?'':', מגן בלי משבצת')+(gv.head?', קסדה זוהרת מקמע זהב':', קסדה בלי זוהר')+(gv.in3d?'':', המגן לא נראה בתלת-ממד')+(gv.glow?', הנשק זוהר':', הנשק לא זוהר')+(gv.noBow?', ועם קשת אין מגן':', מגן גם עם קשת'));
  // צללים (look-hd.js, HD.shadow): בתלת-ממד בעולם השמש מטילה צל, הגיבור מטיל ועצים לא, והמתג בהגדרות מכבה ומדליק
  if(CFG.gfx==='3d'){const sd=await page.evaluate(()=>{
    if(!R3D.on||!R3D.ready)return {skip:true};
    const o={},sun=R3D.scene.children.find(x=>x.isDirectionalLight),u=HD.sh.user,de=R3D.drawEvery,casts=x=>{let c=false;x.traverse(m=>{if(m.isMesh&&m.castShadow)c=true});return c};
    const draw=()=>{try{render3d(W/2-P.x,H/2-P.y)}catch(e){o.err=String(e)}};
    enterWorld('home');R3D.drawEvery=0;draw();
    o.on=sun.castShadow;o.hero=casts(R3D.player.root);o.trees=Object.values(R3D.wld.nodes).filter(casts).length;
    setShadow(false);draw();o.off=!sun.castShadow;setShadow(true);draw();o.back=sun.castShadow;
    HD.sh.user=u;try{if(u)localStorage.setItem(HD.shadow.key,u);else localStorage.removeItem(HD.shadow.key)}catch(e){}R3D.drawEvery=de;return o});
    check(sd.skip||(sd.on&&sd.hero&&!sd.trees&&sd.off&&sd.back&&!sd.err),'צללים: '+(sd.skip?'אין תלת-ממד':(sd.on?'דלוקים בעולם':'לא דלוקים')+(sd.hero?', הגיבור מטיל צל':', הגיבור בלי צל')+(sd.trees?', '+sd.trees+' מקורות מטילים צל (רק דמויות ומבנים)':', עצים וסלעים בלי')+(sd.off&&sd.back?', המתג מכבה ומדליק':', המתג לא עובד')+(sd.err?', שגיאה: '+sd.err:'')))}
  // טבעות השיבוץ ברצפת הזירה (MLBB 1.3, arena-look.js): רוחב מהנתונים (A.inlay), קצה חד (fwidth) בתלת-ממד, בלי ברק גרגירי,
  // ובדיווח: כמה זמן לוקחת אפיית אריח הרצפה בדו-ממד (באפייה הרגילה היא מתחלקת לפריימים של עד 5ms)
  {const ri=await page.evaluate(()=>{const o={};try{const A=ARENA_LOOK,I=A.inlay;o.data=!!I&&I.w.length===A.rings.length&&I.w.every(w=>w>0&&w<=4)&&I.mix<=0.5&&I.sparkle===0;
      ALOOK2.tile=null;ALOOK2.key='';ALOOK2.bake=null;let g=0;while(!aLook2dTile(1000)&&g++<50);o.bake=ALOOK2.stat.bakeMs}catch(err){o.err=String(err)}return o});
   check(!ri.err&&ri.data,'טבעות ברצפת הזירה: '+(ri.err||(ri.data?'דקות וחדות (A.inlay)':'הנתונים לא כמו שצריך')+' · אפיית הרצפה בדו-ממד, בבת אחת: '+ri.bake+'ms'))}
  // מראה הזירה (arena-look.js): בתלת-ממד הזירה מקבלת את הרצפה, התאורה והאובך של העולם, החותמות והרונות מגיבות, והציור לא כבד בהרבה מהמראה הישן
  if(CFG.gfx==='3d'){
    const al=await page.evaluate(()=>{
      if(!R3D.on||!R3D.ready||typeof ALOOK==='undefined')return {skip:true};
      const o={},de=R3D.drawEvery;R3D.drawEvery=0;reset();S.mode='play';enemies.length=0;
      const draw=()=>{S.cam.x=P.x;S.cam.y=P.y;render()};
      try{draw();draw();o.here=aLookHere();o.mat=R3D.ground.material===ALOOK.mat;o.fog=!!R3D.scene.fog;
        S.hits={fire:50,ice:5};for(let i=0;i<20;i++){S.t+=0.1;draw()}o.sig=ALOOK.lit.fire>ALOOK.lit.ice+0.3;
        S.run.log.push({kind:'swarm',t:S.t});S.t+=0.05;draw();o.pulse=ALOOK.pulse>0.9;
        const b=makeBoss();b.x=P.x+150;b.y=P.y;S.boss=b;enemies.push(b);for(let i=0;i<8;i++){S.t+=0.1;draw()}o.beam=ALOOK.beam.visible;
        S.boss=null;enemies.length=0;for(let i=0;i<150;i++){const a=i*2.4,d=60+(i*37)%400;addEnemy('grunt',P.x+Math.cos(a)*d,P.y+Math.sin(a)*d*0.6)}draw();
        o.noShadow=!R3D.scene.children.find(x=>x.isDirectionalLight).castShadow;
        S.room=true;o.room=!aLookHere();S.room=null;window.__alDraw=draw}catch(e){o.err=String(e)}
      R3D.drawEvery=de;return o});
    // זמן לציור עם 150 אויבים: המראה החדש מול הישן (ARENA_LOOK.on=false), יחסי, כי אין כרטיס גרפי
    if(!al.skip&&!al.err){const t={};
      for(const on of [false,true,false,true]){await page.evaluate(on=>{ARENA_LOOK.on=on;R3D.drawEvery=0;__alDraw();__alDraw()},on);
        const t0=Date.now();await page.evaluate(()=>{for(let i=0;i<8;i++){__alDraw();R3D.r.getContext().finish()}});t[on]=Math.min(t[on]??1e9,(Date.now()-t0)/8)}
      await page.evaluate(()=>{ARENA_LOOK.on=true;R3D.drawEvery=60;enemies.length=0});al.ms=t;al.ratio=t[true]/Math.max(0.5,t[false])}
    check(al.skip||(al.here&&al.mat&&al.fog&&al.sig&&al.pulse&&al.beam&&al.noShadow&&al.room&&!al.err&&al.ratio<2),'מראה הזירה: '+(al.skip?'אין תלת-ממד':al.err?'שגיאה: '+al.err:
      (al.here&&al.mat?'רצפת אבן':'הרצפה הישנה')+(al.fog?', אובך':', בלי אובך')+(al.sig?', חותמת האש דולקת':', החותמות לא מגיבות')+(al.pulse?', רונות פועמות בגל ענק':', בלי פעימה')+(al.beam?', עמוד אור לבוס':', בלי עמוד אור')+
      (al.noShadow?'':', צללים עם 150 אויבים')+(al.room?'':', דולק בחדר הבונוס')+', ציור עם 150 אויבים '+al.ms[false].toFixed(1)+'→'+al.ms[true].toFixed(1)+'ms (פי '+al.ratio.toFixed(2)+')'));
  }
  // Weather in the arena and boss fights (arena-weather.js over weather.js): atmosphere in a boss fight, a storm when he gets angry, lightning with a big attack,
  // drawn before the boss's telegraphs (mines) and before fxDraw, nothing in the classic arena, clearing after the boss, and the frame time with and without it
  {const aw=await page.evaluate(()=>{
    if(typeof AWX==='undefined'||typeof WX==='undefined')return {err:'no AWX/WX'};
    const o={};window.__awDe=R3D.drawEvery;R3D.drawEvery=0;window.__awMenu=WEATHER.menus.map(id=>document.getElementById(id)).filter(Boolean).map(e=>[e,e.hidden]);for(const [e] of __awMenu)e.hidden=true;   // a menu window open = the 'menu' scene
    try{reset();S.mode='play';enemies.length=0;S.arena='classic';
      const draw=window.__awDraw=()=>{FRAME_T+=17;S.t+=1/60;S.cam.x=P.x;S.cam.y=P.y;render()},layers=()=>[...WX.layers.keys()].join(',');
      draw();wxSync();o.plain=WX.scene+':'+WX.run.arena.state;o.plainN=wxWant().length;
      const b=window.__awB=makeBoss();b.x=P.x+150;b.y=P.y;S.boss=b;enemies.push(b);
      draw();wxSync();o.calm=WX.scene+':'+WX.run.boss.state;o.calmL=layers();
      b.rage=1;draw();wxSync();o.storm=WX.run.boss.state;o.stormL=layers();
      const n0=AWX.bolts;WX.boltT=-99;S.t+=5;doPattern(b,'shock');draw();o.bolt=AWX.bolts-n0;o.boltPt=WX.pts.some(p=>/lightning_bolt/.test(p.id));o.tele=waves.some(w=>w.t<0)||!!(b.arTele&&b.arTele.k==='shock');   // with arena-fx.js the attack waits behind its warning
      mines.push({x:P.x+40,y:P.y,t:1});let at=null,fx=null;const sl=ctx.setLineDash,fd=window.fxDraw;
      ctx.setLineDash=function(a){if(at==null&&a&&a[0]===6)at=WX.drawn===FRAME_T;return sl.apply(this,arguments)};window.fxDraw=function(){fx=WX.drawn===FRAME_T;return fd.apply(this,arguments)};
      draw();ctx.setLineDash=sl;window.fxDraw=fd;o.under=at===true&&fx===true;
      o.maxA=Math.max(0,...[...WX.layers.values()].map(f=>f.a));mines.length=0;waves.length=0;b.arTele=null;
    }catch(e){o.err=String(e&&e.stack||e)}
    return o});
  if(!aw.err){
    for(let i=0;i<60;i++){if(await page.evaluate(()=>[...WX.layers.values()].every(f=>wxIm(f.id))))break;await page.waitForTimeout(50)}   // the sheets load in the background
    const ms={};
    for(const on of [false,true,false,true]){await page.evaluate(on=>{WEATHER.on=on;__awDraw();wxSync();for(const f of WX.layers.values())f.cur=1;__awDraw()},on);
      const t0=Date.now();await page.evaluate(()=>{for(let i=0;i<20;i++){__awDraw();if(R3D.on&&R3D.r)R3D.r.getContext().finish()}});ms[on]=Math.min(ms[on]??1e9,(Date.now()-t0)/20)}
    Object.assign(aw,await page.evaluate(()=>{const o={loaded:[...WX.layers.values()].every(f=>wxIm(f.id)),n:WX.layers.size};WEATHER.on=true;
      try{S.boss=null;__awB.dead=true;enemies.length=0;__awDraw();o.clear=WX.scene+':'+WX.run.arena.state;for(let i=0;i<AWX.clearT*60+30;i++)__awDraw();o.after=WX.run.arena.state}catch(e){o.err=String(e)}
      reset();R3D.drawEvery=__awDe;for(const [e,h] of __awMenu)e.hidden=h;return o}));
    aw.off=ms[false];aw.on=ms[true]}
  else await page.evaluate(()=>{if(window.__awMenu)for(const [e,h] of __awMenu)e.hidden=h;if(window.__awDe!=null)R3D.drawEvery=__awDe;reset()});
  check(!aw.err&&aw.plain==='arena:calm'&&aw.plainN===0&&aw.calm==='boss:calm'&&/fog_drift/.test(aw.calmL)&&aw.storm==='storm'&&/rain_heavy/.test(aw.stormL)&&aw.bolt===1&&aw.boltPt&&aw.tele&&aw.under&&aw.maxA<=0.45&&aw.clear==='arena:clearing'&&aw.after==='calm'&&aw.on-aw.off<6,
    'Arena weather: '+(aw.err||[aw.plain==='arena:calm'&&aw.plainN===0?'classic arena clear':'classic arena '+aw.plain+' ('+aw.plainN+')',aw.calm==='boss:calm'&&/fog_drift/.test(aw.calmL)?'boss fight: '+aw.calmL:'no boss atmosphere ('+aw.calm+' '+aw.calmL+')',
      aw.storm==='storm'&&/rain_heavy/.test(aw.stormL)?'storm when he gets angry':'no storm ('+aw.storm+' '+aw.stormL+')',aw.bolt===1&&aw.boltPt&&aw.tele?'lightning with the shock telegraph':'lightning '+aw.bolt+(aw.boltPt?'':' (no bolt drawn)'),
      aw.under?'under the telegraphs and fxDraw':'drawn over the telegraphs!','opacity ≤'+aw.maxA.toFixed(2),aw.clear==='arena:clearing'&&aw.after==='calm'?'clears after the boss':'no clearing ('+aw.clear+'→'+aw.after+')',
      'frame in the storm '+aw.off.toFixed(1)+'→'+aw.on.toFixed(1)+'ms with '+aw.n+' layers'+(aw.loaded?'':' (sheets not loaded)')].join(', ')));}
  // מסלול רמות (levelpath.js): מה נפתח בכל רמה נגזר מהטבלאות, "הבא" בחלון הדמות, ובעליית רמה הבזק וכרטיס עם מה שנפתח ומה הבא
  const lp=await page.evaluate(()=>{
    enterWorld('home');const o={};
    o.orbit=lpAt(GEAR.slots.orbit[2]).some(x=>x.k==='orbit');o.rank=lpAt(RANKS.every).some(x=>x.k==='rank');o.tree=lpAt(1+TREE.every).some(x=>x.k==='tree');
    const n=lpNext(heroLv());o.next=!!n&&n.lv>heroLv()&&n.items.length>0;
    const lv0=heroLv();SAVE.hero.xp+=rankNeed(lv0)+1;rankSync();
    const c=document.getElementById('lpCard'),f=document.getElementById('lpFlash');
    o.up=heroLv()===lv0+1;o.card=!!c&&c.classList.contains('on')&&c.querySelectorAll('li').length>=1&&c.textContent.includes(T('lp.up',heroLv()));
    o.cardNext=!!c&&c.textContent.includes(T('lp.next'));o.flash=!!f&&f.classList.contains('on');
    gearOpen('char');const el=document.querySelector('#gChar .lpnext');o.win=!!el&&el.textContent.includes(T('lp.next'));gearClose();
    c.classList.remove('on');return o});
  check(lp.orbit&&lp.rank&&lp.tree&&lp.next&&lp.up&&lp.card&&lp.cardNext&&lp.flash&&lp.win,
    'מסלול רמות: '+(lp.orbit&&lp.rank&&lp.tree?'משבצת, דרגה ונקודת סקיל נמצאו':'חסר משהו בטבלה')+(lp.next?', יש "הבא"':', אין "הבא"')+(lp.card?', כרטיס בעליית רמה':', אין כרטיס')+(lp.cardNext?' עם הבא':'')+(lp.flash?', הבזק':', בלי הבזק')+(lp.win?', ובחלון הדמות':', לא בחלון הדמות'));
  // סקרנות וחקירה (curiosity.js): שלט "רמה מומלצת" ומכשול בדרך הסגורה, שומרים בכניסה, המכשול נעלם ברמה. סוד לפי רמה נעול לפני ופתוח אחרי, ובמסלול הרמות ובמפה
  const cu=await page.evaluate(()=>{
    const o={},lv0=SAVE.hero.level,sc0=JSON.stringify(SAVE.secrets||{found:{},read:{}}),cu0=JSON.stringify(CU()),st0=JSON.stringify(SAVE.story);
    SAVE.secrets={found:{},read:{}};SAVE.curio={clear:{}};SAVE.story=Object.assign({},SAVE.story,{earth:false});
    const rec=CURIO.paths.lake.lv;SAVE.hero.level=rec-1;enterWorld('home');for(const e of enemies)e.dead=true;
    let g=cuSigns().find(x=>x.k==='lake');o.sign=!!g&&!g.open&&g.ob==='log';o.guards=WORLD.foes.some(G=>G.guard==='lake'&&G.tough>1);
    curioUpdate();o.stay=!CU().clear.lake;
    SAVE.hero.level=rec;curioUpdate();g=cuSigns().find(x=>x.k==='lake');o.clear=!!CU().clear.lake&&!!g&&!g.ob;o.stillShut=!wPathOpen(WORLD.paths.lake);
    const s=SECRETS.regions.meadow.find(q=>q.lv);SAVE.hero.level=s.lv-1;enterWorld('home');for(const e of enemies)e.dead=true;
    o.locked=!scList().includes(s);P.x=s.x;P.y=s.y;secretsUpdate(0.05);o.noFind=!scFound(s.id);o.noMark=!cuNew('meadow');
    SAVE.hero.level=s.lv;o.lp=lpAt(s.lv).some(x=>x.k==='secret'&&x.txt===T('cu.new',T('cu.in.meadow')));o.mark=cuNew('meadow');
    o.open=scList().includes(s);P.x=s.x+SECRETS.reveal-10;P.y=s.y;secretsUpdate(0.05);P.x=s.x;P.y=s.y;secretsUpdate(0.05);o.found=scFound(s.id);o.markGone=!cuNew('meadow');
    o.each=Object.keys(SECRETS.regions).every(r=>SECRETS.regions[r].some(q=>q.lv));o.lvs=[...new Set(Object.values(SECRETS.regions).flat().filter(q=>q.lv).map(q=>q.lv))].sort((a,b)=>a-b).join(',');
    SAVE.hero.level=lv0;SAVE.secrets=JSON.parse(sc0);SAVE.curio=JSON.parse(cu0);SAVE.story=JSON.parse(st0);saveNow();enterVillage();return o});
  check(cu.sign&&cu.guards&&cu.stay&&cu.clear&&cu.stillShut&&cu.locked&&cu.noFind&&cu.noMark&&cu.lp&&cu.mark&&cu.open&&cu.found&&cu.markGone&&cu.each,
    'סקרנות: '+(cu.sign?'שלט ומכשול בדרך לאגם':'אין שלט או מכשול')+(cu.guards?', שומרים בכניסה':', בלי שומרים')+(cu.stay&&cu.clear?', המכשול נעלם ברמה':', המכשול לא נעלם בזמן')+(cu.stillShut?' והדרך עדיין לפי הפנס':', הדרך נפתחה בלי פנס!')+
    (cu.locked&&cu.noFind?', סוד ברמה נעול לפני':', סוד ברמה פתוח מוקדם')+(cu.open&&cu.found?' ונמצא אחרי':' ולא נמצא אחרי')+(cu.lp?', "משהו חדש" במסלול הרמות':', לא במסלול הרמות')+(cu.noMark&&cu.mark&&cu.markGone?', ? במפה':', הסימן במפה לא עובד')+(cu.each?', בכל אזור (רמות '+cu.lvs+')':', חסר אזור'));
  const edge=await page.evaluate(()=>{
    enterWorld('home');const B=placeBox(),n0=drops().length,out=o=>o.x<B.x0||o.x>B.x1||o.y<B.y0||o.y>B.y1;
    wantedAppear(0);const e=S.wn.e;e.x=B.x1+300;e.y=B.y0-200;wantedMove(e,0.05);const wIn=!out(e);
    e.x=B.x1+120;e.y=B.y1+120;lootKill(e);wantedDown(e);e.dead=true;S.wn.e=null;
    const ds=drops().slice(n0);P.x=B.x1-10;P.y=B.y1-10;P._tx=null;placeClamp(P);P.inv=99;   // placeClamp: באחו הגדול הפינה היא מפרץ, אז לנקודה הפנויה הקרובהenemies.length=0;
    for(let i=0;i<120;i++)dropsUpdate(1/30);
    const left=ds.filter(d=>!d.got),gid=lootGear({x:P.x+60,y:P.y-60},true),g0=SAVE.bag[gid]||0;
    for(let i=0;i<120;i++)dropsUpdate(1/30);
    return{wIn,n:ds.length,inside:ds.every(d=>!out(d)),left:left.length,kept:dropStats().kept,gid,gBag:(SAVE.bag[gid]||0)>g0,
      gSaved:(JSON.parse(localStorage.getItem(SAVE_STORE.key)).bag[gid]||0)>0,gGround:!drops().some(d=>d.r===gid)}});
  const fc=await page.evaluate(()=>{
    const bak=JSON.stringify(SAVE),mode=S.mode,vil=!!S.vil,out={};
    // בלי מים: אין כפתור. הקווסט של הדייג סופר דגים. בישול אצל הפונדקאית: לוקח את הדגים ונותן ארוחה, והחיזוק חל בעולם ונגמר בזמן
    SAVE.quests.active.wCatch={p:[0]};questEvent('fish','minnow',3);out.quest=qReady(QBY.wCatch);delete SAVE.quests.active.wCatch;
    bagAdd('minnow',2);bagAdd('perch',1);const n0=(SAVE.bag.minnow||0)+(SAVE.bag.perch||0);
    enterVillage();npcTalk('inn');document.querySelector('#npcDlg [data-act="tab"][data-tab="cook"]').click();const cb=document.querySelector('#npcDlg [data-act="cook"][data-m="stew"]');out.cookBtn=!!cb&&!cb.disabled;if(cb)cb.click();
    out.taken=n0-((SAVE.bag.minnow||0)+(SAVE.bag.perch||0))===3;out.meal=(FS().meal||{}).id;npcTalk(null);
    enterWorld('home');const hp0=P.maxHp;out.on=S.wd.meal==='stew';
    P.x=9999;P.y=9999;out.noBtn=(fishBtn(true),document.getElementById('fishBtn').hidden);
    FS().meal.t=0.01;fishUpdate(0.1);out.off=!S.wd.meal&&!FS().meal&&P.maxHp===hp0-FISH.meals.stew.buff.hp;
    // דיג באגם הגדול (מפה, tWaterNear): עומדים ליד שפת המים, מטילים, מחכים לנשיכה ולוחצים כשהמחוג בירוק. דג מהמאגר של האגם בתרמיל
    try{if(WORLD.regions.lake.map){enterWorld('home','lake');enemies=[];P.moving=false;
      const st=WORLD.regions.lake.waystones[0];P.x=st.x;P.y=st.y;const w=tWaterNear(P.x,P.y),d=Math.hypot(P.x-w.x,P.y-w.y)||1,k=(TERRAIN.pad+20)/d;
      P.x=w.x+(P.x-w.x)*k;P.y=w.y+(P.y-w.y)*k;S.wd.fishRest=0;fishBtn(true);
      const sp=fishSpot();out.lakeSpot=!!sp&&sp.pool==='lake'&&!tBlocked(P.x,P.y);out.lakeBtn=!document.getElementById('fishBtn').hidden;
      const pool=Object.keys(FISH.pools.lake),cnt=()=>pool.reduce((a,r)=>a+(SAVE.bag[r]||0),0),n1=cnt();
      for(let tries=0;tries<6&&cnt()===n1;tries++){S.wd.fishRest=0;fishTap();
        for(let i=0;i<600&&S.wd.fish&&cnt()===n1;i++){const f=S.wd.fish;if(f.st==='bite'||(f.st==='reel'&&fishNeedleIn()))fishTap();fishUpdate(1/60)}}
      out.lakeFish=cnt()===n1+1}else out.lakeSpot=out.lakeBtn=out.lakeFish=true}catch(err){out.lakeErr=String(err).slice(0,120)}
    worldUi(false);SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}return out});
  // משחקי השאול (moba.js, docs/moba.md): משחק שלם, מואץ, שבו כל ששת הגיבורים בוטים. נגמר, כל הסקילים הוטלו, יש שליטה בקהל וקומבו
  const mb=await page.evaluate(en=>{const o={};try{
    const heb=x=>/[֐-׿]/.test(x);
    mobaOpen();o.pick=document.querySelectorAll('#mbWin [data-kit]').length;if(en&&heb($('mbWin').innerText))o.he=$('mbWin').innerText.slice(0,60);
    // רמת קושי (moba-bot.js): שלושה כפתורים, אחד מסומן, בחירה נשמרת. מתחילים ב"קל" (ברירת המחדל), אחרי בדיקה שהבחירה עובדת
    {const bs=[...document.querySelectorAll('#mbWin [data-diff]')],d0=mbDiffGet(),on=bs.filter(b=>b.classList.contains('on'));
      document.querySelector('#mbWin [data-diff="hard"]').click();const saved=mbDiffGet()==='hard'&&document.querySelector('#mbWin [data-diff="hard"]').classList.contains('on');
      document.querySelector('#mbWin [data-diff="easy"]').click();o.diff={n:bs.length,one:on.length===1&&on[0].dataset.diff===d0,saved,back:mbDiffGet()==='easy'}}
    document.querySelector('#mbWin [data-kit="tank"]').click();
    // מסך הבנייה (moba-spells.js): אחרי הגיבור, בחירת לחש עם הסבר. ברירת המחדל זינוק, הבחירה נשמרת לכל גיבור ונטענת שוב
    if(typeof MBSPELL!=='undefined'){const B={},q=x=>document.querySelector('#mbWin '+x);try{localStorage.removeItem(MBSPELL.key)}catch(e){}mbBuildOpen('tank');
      B.step=$('mbWin').dataset.mode==='build';B.n=document.querySelectorAll('#mbWin [data-b]').length;B.def=mbSpellGet('tank')==='dash'&&!!q('[data-b="dash"].on');
      q('[data-b="barrier"]').click();B.saved=mbSpellGet('tank')==='barrier'&&mbSpellGet('hunter')==='dash'&&!!q('[data-b="barrier"].on')&&$('mbWin').innerText.includes(T('mb.spD.barrier'));
      q('[data-bact="back"]').click();B.back=$('mbWin').dataset.mode==='pick'&&!!q('[data-diff].on');q('[data-kit="tank"]').click();B.load=!!q('[data-b="barrier"].on');
      if(en&&!o.he&&heb($('mbWin').innerText))o.he=$('mbWin').innerText.slice(0,60);q('[data-bact="go"]').click();o.build=B}
    o.on=!!S.mb&&document.body.classList.contains('mb');if(o.build)o.build.game=MB.me.spell==='barrier'||(mobaUpdate(1/30),MB.me.spell==='barrier');if(o.diff)o.diff.game=MB.diff==='easy';
    if(en&&!o.he&&heb($('mbHud').innerText))o.he=$('mbHud').innerText.slice(0,60);
    mbPress('ult');o.lock=$('banner').textContent!==T('mb.locked')&&document.querySelector('#mbSk [data-sk="ult"]').classList.contains('shake');   // סקיל-על נעול: הכפתור רועד, בלי הודעה באמצע
    // תנועה (moba-move.js, אוראל 3.11: "התנועתיות מוזרה"): סיבוב רך ולא בבת אחת, גיבור עובר דרך חייל בלי להאט, והודעת הריגה
    {const me=MB.me,hx=me.x,hy=me.y;me.x=-700;me.y=150;me.face=0;mbFeelReset(me);
     joy={id:-7,ox:150,oy:280,dx:-1,dy:0};mobaUpdate(1/30);const r1=Math.abs(mbAng(me.rot));for(let i=0;i<9;i++)mobaUpdate(1/30);const r10=Math.abs(mbAng(me.rot));
     const m=mbUnit({k:'minion',team:0,type:'mb_m0',x:me.x-40,y:me.y,r:MOBA.minion.r,hp:1e6,max:1e6,speed:0,lane:0,face:0});MB.u.push(m);
     const x0=me.x;for(let i=0;i<30;i++)mobaUpdate(1/30);const run=x0-me.x,want=mbSpeed(me);MB.u.splice(MB.u.indexOf(m),1);joy=null;me.x=hx;me.y=hy;mbFeelReset(me);
     const n0=$('mbFeed').children.length,f=mbHeroes(1)[0];mbKillFeed(f,me);
     o.feel={soft:r1>0.05&&r1<3,turned:r10>3,run:Math.round(run),want:Math.round(want),feed:$('mbFeed').children.length===n0+1};$('mbFeed').innerHTML=''}
    // זהב וחפצים (moba-items.js, אוראל 3.11: "אין חפצים"): זהב מצטבר, קנייה מהירה, הסטטים משתנים, מכירה, חלון החנות, ובוט שקונה לבד
    {const me=MB.me,I={};me.gold=0;me.it=[];mbItCalc(me);mbItTick({u:[me]},10);I.tick=me.gold>=MBITEM.gold.tick*9;
     const m=mbUnit({k:'minion',team:1,x:me.x+30,y:me.y,r:12,hp:1,max:1}),g0=me.gold;mbItDie(m,me);I.minion=me.gold-g0===MBITEM.gold.minion;
     me.gold=3000;const n=mbNext(me),b0=JSON.stringify(mbIb(me)),hp0=me.max,sp0=mbSpeed(me);mobaHud();
     $('mbQuick').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));
     I.quick=me.it[0]===n&&me.gold===3000-MBITEM.items[n].cost;I.stat=JSON.stringify(mbIb(me))!==b0&&(me.max!==hp0||mbSpeed(me)!==sp0||mbIb(me).def>0||mbIb(me).aspd>0);
     const g1=me.gold;mbSell(me,n);I.sell=!me.it.length&&me.gold===g1+Math.floor(MBITEM.items[n].cost*MBITEM.sell);
     mbShopOpen();I.win=!$('ovMbShop').hidden&&S.mode==='mbshop';document.querySelector('#mbShop [data-act="buy"]').click();I.buy=me.it.length===1;
     uiCloseTop();I.close=$('ovMbShop').hidden&&S.mode==='play';
     const bt=mbHero('tank',1,false,0);bt.gold=1000;bt.buyT=0;MB.u.push(bt);mbItTick(MB,1/30);I.bot=bt.it&&bt.it[0]===MBITEM.build.tank[0];MB.u.splice(MB.u.indexOf(bt),1);
     me.gold=0;me.it=[];mbItCalc(me);me.hp=me.max;o.items=I}
    // שומר אותך בחיים (moba-recall.js, הבודק 4.11): אזהרה בחיים נמוכים מופיעה ונעלמת, חזרה לבסיס עובדת, תזוזה ופגיעה מבטלות, וטבעת הזהב על הקנייה המהירה
    {const me=MB.me,L={},hx=me.x,hy=me.y,tk=n=>{for(let i=0;i<n;i++)mbRecallTick({u:[me]},1/30)};
     me.hp=me.max*0.2;me.lowWarn=false;mobaHud();L.lowOn=$('mbLow').classList.contains('on')&&($('banner').textContent===T('mb.low')||(mbBanner.q||[]).some(m=>m.txt===T('mb.low')));   /* ההודעה מוצגת או מחכה בתור */me.hp=me.max;mobaHud();L.lowOff=!$('mbLow').classList.contains('on');
     me.x=me.home.x+(me.team?-1:1)*900;me.y=0;$('mbRecall').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));L.start=!!me.recall;tk(MBRECALL.t*30+3);L.home=!me.recall&&mbDist(me,me.home)<1;
     me.x=me.home.x+(me.team?-1:1)*900;mbFeelReset(me);mbRecallStart(me);tk(10);me.x+=20;tk(1);L.move=!me.recall&&mbDist(me,me.home)>800;
     mbRecallStart(me);tk(10);me.hp-=50;tk(1);L.hit=!me.recall&&mbDist(me,me.home)>800;me.hp=me.max;
     const n=mbNext(me),c=MBITEM.items[n].cost,q=$('mbQuick'),p=()=>+q.style.getPropertyValue('--p');me.gold=c/2;mobaHud();L.half=Math.abs(p()-0.5)<0.02&&!q.classList.contains('ok')&&q.textContent.includes(String(c))&&q.querySelector('span').classList.contains('miss');   // המחיר תמיד, ובאדום כשחסר (W4, 8.11: בלי מספר שלילי)
     me.gold=c;mobaHud();L.full=p()===1&&q.classList.contains('ok');me.gold=0;me.x=hx;me.y=hy;mbFeelReset(me);mobaHud();o.life=L}
    // כפתור התקיפה (moba-atk.js, אוראל 8.11, כמו ב-MLBB): הכי גדול ולא נוגע בסקילים, נגיעה בלי אף אחד בטווח מקרבת, גרירה אל אויב נועלת, הנעול קודם,
    // הנעילה נגמרת במוות ובמרחק, ✕ מבטל, הטעינה על הכפתור, ורווח במקלדת
    {const me=MB.me,K={},hx=me.x,hy=me.y,cam={x:S.cam.x,y:S.cam.y},A=MBKIT[me.kit].atk,keep=MB.u,b=$('mbAtk'),cv=cvs.getBoundingClientRect();   // cam: המצלמה חוזרת בסוף, אחרת הבדיקות שאחרי רואות אפקטים מחוץ למסך
     const scr=o=>({x:cv.left+((o.x-S.cam.x)/W+0.5)*cv.width,y:cv.top+((o.y-S.cam.y)/H+0.5)*cv.height});
     const pe=(el,t,x,y)=>(el||window).dispatchEvent(new PointerEvent(t,{bubbles:true,cancelable:true,pointerId:9,clientX:x,clientY:y}));
     try{mobaHud();K.btn=!!b&&!!b.offsetParent;const sk=[...document.querySelectorAll('#mbSk [data-sk]')].filter(e=>e.offsetParent),br=b.getBoundingClientRect();
      K.big=sk.length>0&&sk.every(e=>e.getBoundingClientRect().width<br.width);
      const rs=[br,...sk.map(e=>e.getBoundingClientRect())];K.free=!rs.some((a,i)=>rs.some((c,j)=>j>i&&Math.min(a.right,c.right)-Math.max(a.left,c.left)>1&&Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top)>1));
      MB.u=keep.filter(o=>o===me||o.k==='tower'||o.k==='base');me.x=0;me.y=0;me.atkT=0;joy=null;MB.lock=MB.atkGo=null;
      const mk=(dx,dy)=>{const m=mbUnit({k:'minion',team:1-me.team,type:'mb_m1',x:me.x+dx,y:me.y+dy,r:MOBA.minion.r,hp:1e6,max:1e6,speed:0,lane:dy,face:0});MB.u.push(m);return m};
      const far=mk(A.range+me.r+MOBA.minion.r+160,0),cx=br.left+br.width/2,cy=br.top+br.height/2;
      pe(b,'pointerdown',cx,cy);pe(null,'pointerup',cx,cy);const d0=mbDist(me,far);for(let i=0;i<10;i++)mobaUpdate(1/30);K.step=d0-mbDist(me,far)>20;K.taps=MB.atkTaps||0;
      me.x=0;me.y=0;MB.atkGo=null;far.x=me.x+60;far.y=-50;const lk=mk(70,60);S.cam.x=me.x;S.cam.y=me.y;
      const p=scr(lk);pe(b,'pointerdown',cx,cy);pe(null,'pointermove',cx-30,cy-30);pe(null,'pointermove',p.x,p.y);pe(null,'pointerup',p.x,p.y);K.lock=MB.lock===lk;
      K.pref=mbAutoTarget(me,A.range+200)===lk;K.draw=(()=>{try{mbAtkDraw();return true}catch(err){return String(err)}})();
      const fr=n=>{for(let i=0;i<n;i++)mobaUpdate(1/30)};   // כמה פריימים: אחרי מכה יש עצירת פריים (mbfxTime)
      lk.x=me.x+(A.range+me.r+lk.r)*MBATK.lockK+120;fr(8);K.far=MB.lock===null;
      MB.lock=far;far.dead=true;fr(8);K.dead=MB.lock===null;far.dead=false;MB.lock=null;
      lk.x=me.x+70;const c=$('mbCancel'),q=c.getBoundingClientRect();pe(b,'pointerdown',cx,cy);pe(null,'pointermove',cx-30,cy-30);const cr=c.getBoundingClientRect();pe(null,'pointermove',cr.left+cr.width/2,cr.top+cr.height/2);pe(null,'pointerup',cr.left+cr.width/2,cr.top+cr.height/2);K.cancel=MB.lock===null&&c.hidden;
      me.atkT=A.cd/2;mobaHud();K.cd=Math.abs(parseFloat(b.style.getPropertyValue('--cd'))-0.5)<0.02;me.atkT=0;
      const t0=MB.atkTaps||0;keys.Space=true;fr(8);keys.Space=false;fr(2);K.space=(MB.atkTaps||0)===t0+1;
     }catch(err){K.err=String(err&&err.stack||err)}
     MB.u=keep;MB.lock=MB.atkGo=null;keys.Space=false;joy=null;me.x=hx;me.y=hy;S.cam.x=cam.x;S.cam.y=cam.y;mbFeelReset(me);mobaHud();o.atk=K}
    // הטלה מהירה (moba-aim.js, MLBB 1.2): נגיעה בלי גרירה מראה לרגע את הצורה של הסקיל (קו, עיגול, מטרה, סביבך) בצבע סוג הנזק, ודועכת.
    // בגרירה אין הבזק (רואים כבר), ולבוט אין
    {const me=MB.me,F={kinds:{}},kit=me.kit,keep=MB.u,hx=me.x,hy=me.y,lv=me.lvl,cam={x:S.cam.x,y:S.cam.y},cds={...me.cd};
     try{MB.u=keep.filter(o=>o===me||o.k==='tower'||o.k==='base');me.x=0;me.y=0;me.dead=false;me.lvl=MOBA.ultAt;S.cam.x=0;S.cam.y=0;
       const foe=mbHero('warrior',1-me.team,false,1);foe.x=150;foe.y=10;foe.hp=foe.max=1e6;MB.u.push(foe);if(typeof mbVisNow==='function')mbVisNow(true);
       for(const k of Object.keys(MBKIT))for(const sl of MB_SLOTS){const sk=MBKIT[k][sl],kind=mbAimKind(sk);if(F.kinds[kind]!=null)continue;
         me.kit=k;for(const c of MB_SLOTS)me.cd[c]=0;Object.assign(me.st,{stun:0,root:0,dash:null,veil:0});me.x=0;me.y=0;MB.aimFl=null;
         mbPress(sl);const f=MB.aimFl;F.kinds[kind]=!!f&&f.kind===kind&&f.col===(sk.col||dtCol(sk.dt||MBKIT[k].dt))}
       F.draw=(()=>{try{mbAimFlashDraw();return true}catch(err){return String(err)}})();
       if(MB.aimFl){MB.aimFl.t0-=MBAIM.flash.dur*1000+10;mbAimFlashDraw();F.ends=MB.aimFl===null}
       me.kit=kit;for(const c of MB_SLOTS)me.cd[c]=0;MB.aimFl=null;mbPress('s1',{x:me.x+100,y:me.y});F.drag=MB.aimFl===null;   // כיוון מגרירה: בלי הבזק
       const bot=mbHero(kit,me.team,false,0);bot.x=0;bot.y=0;MB.u.push(bot);for(const c of MB_SLOTS)bot.cd[c]=0;MB.aimFl=null;mbCast(bot,'s1',foe);F.bot=MB.aimFl===null;
     }catch(err){F.err=String(err&&err.stack||err)}
     MB.u=keep;me.kit=kit;me.lvl=lv;Object.assign(me.cd,cds);mbStReset(me);me.x=hx;me.y=hy;S.cam.x=cam.x;S.cam.y=cam.y;MB.aimFl=null;if(typeof mbVisNow==='function')mbVisNow(true);mbFeelReset(me);mobaHud();o.qaim=F}   // mbStReset: סקיל שהוטל כאן (קפיצה, כיסוי) לא נשאר לבדיקות שאחרי
    // חץ הברק (#513, moba-skill-anim.js): תנועת שחרור קשת ברגע ההטלה, בלי מעגל על הרצפה, פס מאחורי החץ האמיתי, הבזק רק בפגיעה מאושרת,
    // נקודה עמומה בסוף, בלי שאריות אחרי משחק חדש, וחץ של אויב בערפל לא מצויר
    {const me=MB.me,Z={},kit=me.kit,hx=me.x,hy=me.y,keep=MB.u,cd=me.cd.s1,H=MBANIMS.stat,cam={x:S.cam.x,y:S.cam.y};
     try{me.kit='hunter';MB.u=keep.filter(o=>o===me||o.k==='tower'||o.k==='base');me.x=0;me.y=0;me.dead=false;me.cd.s1=0;const vis=()=>{S.cam.x=me.x;S.cam.y=me.y;if(typeof mbVisNow==='function')mbVisNow(true)};vis();   // המצלמה והראייה במקום החדש (אפקט מחוץ למסך או בערפל לא נוצר)
       const fly=()=>{for(let i=0;i<60&&MB.shots.length;i++)mbShots(1/30)};MB.shots=[];
       const n0=P.skCast?P.skCast.n:0,h0=H.hits,e0=H.end||0;Z.cast=mbCast(me,'s1',{x:me.x+300,y:me.y});
       Z.pose=!!P.skCast&&P.skCast.k==='zap'&&P.skCast.n===n0+1&&SKCAST.dur>0&&SKCAST.dur<1;   // שחרור קשת, פעם אחת, וקצר (נגמר לבד)
       Z.circ=!FXLIB.list.some(f=>f.id==='wcirc_lightning');const sh=MB.shots[0];Z.trail=!!sh&&!!sh.trail;
       const t0=H.trail||0;mbPierceTrail(sh);mbShots(1/30);mbPierceTrail(sh);Z.drawn=(H.trail||0)>t0;
       fly();Z.miss=H.hits===h0&&(H.end||0)===e0+1;   // החטאה: בלי הבזק פגיעה, ונקודה אחת בסוף
       const m=mbUnit({k:'minion',team:1-me.team,type:'mb_m1',x:me.x+200,y:me.y,r:MOBA.minion.r,hp:1e6,max:1e6,speed:0,lane:0,face:0});MB.u.push(m);vis();
       me.cd.s1=0;const h1=H.hits;mbCast(me,'s1',m);fly();Z.hit=H.hits===h1+1;
       // אויב בערפל: חץ שלו לא מצויר (גם לא הפס)
       const f=mbHero('hunter',1-me.team,false,1);f.x=1500;f.y=-300;MB.u.push(f);if(typeof mbVisNow==='function')mbVisNow(true);f.cd.s1=0;
       Z.fogged=typeof mbVisPt==='function'&&!mbVisPt(f.x,f.y);mbCast(f,'s1',{x:f.x-300,y:f.y});const fs=MB.shots[MB.shots.length-1];mbShots(1/30);const t1=H.trail||0;mbPierceTrail(fs);Z.fog=Z.fogged&&(H.trail||0)===t1;
       MB.shots=[];Z.reset=MB.shots.length===0;
     }catch(err){Z.err=String(err&&err.stack||err)}
     MB.shots=[];MB.u=keep;me.kit=kit;me.x=hx;me.y=hy;me.cd.s1=cd;S.cam.x=cam.x;S.cam.y=cam.y;if(typeof mbVisNow==='function')mbVisNow(true);mbFeelReset(me);mobaHud();o.arrow=Z}
    // המתנקש (#485, הגיליונות של ARI ב-#529): עשן סגול בהיעלמות, מוטות לילך רק לקבוצה שלו ושנעלמים כשהכיסוי נשבר או במוות,
    // יהלום סגול לסימן מוות, ו-CRIT סגול במכה בגב
    {const me=MB.me,Q={},keep=MB.u,hx=me.x,hy=me.y,cam={x:S.cam.x,y:S.cam.y},has=id=>FXLIB.list.some(f=>f.id===id&&f.on!==false);   // hx,hy: הגיבור חוזר למקומו בסוף (אחרת בדיקת הספרייה רואה אפקטים מחוץ למסך)
     try{MB.u=keep.filter(o=>o===me||o.k==='tower'||o.k==='base');me.x=0;me.y=0;S.cam.x=0;S.cam.y=0;
       const a=mbHero('assassin',me.team,false,1),b=mbHero('assassin',1-me.team,false,1);a.x=60;a.y=0;b.x=160;b.y=40;MB.u.push(a,b);if(typeof mbVisNow==='function')mbVisNow(true);
       for(const h of [a,b]){h.cd.s1=h.cd.s2=h.cd.ult=0;h.lvl=MOBA.ultAt}
       Q.c1=mbCast(a,'s2');Q.vanish=has('sk_vanish');Q.mine=!!a.st.veilFx;Q.c2=mbCast(b,'s2');Q.foe=!b.st.veilFx;   // הכיסוי של האויב לא מסומן
       a.st.dash=null;a.st.veil=0;mbTick(a,0.01);Q.brk=a.st.veilFx===null;
       a.cd.s2=0;mbCast(a,'s2');a.st.dash=null;const had=!!a.st.veilFx;mbStReset(a);Q.dead=had&&!a.st.veilFx;
       const t=mbHero('warrior',1-me.team,false,1);t.x=120;t.y=0;t.face=0;t.hp=t.max=1e6;MB.u.push(t);a.x=t.x-(a.r+t.r+4);a.y=0;a.atkT=0;if(typeof mbVisNow==='function')mbVisNow(true);
       mbAttack(a,0,t,MBKIT.assassin.atk);Q.back=has('dmg_backstab');
       a.cd.ult=0;t.mark=null;mbCast(a,'ult',t);Q.mark=!!t.mark&&!!t.mark.fx&&t.mark.fx.id==='sk_deathmark';
     }catch(err){Q.err=String(err&&err.stack||err)}
     MB.u=keep;me.x=hx;me.y=hy;S.cam.x=cam.x;S.cam.y=cam.y;if(typeof mbVisNow==='function')mbVisNow(true);mbFeelReset(me);o.sinFx=Q}   // sinFx ולא sin: הבדיקה של המתנקש מ-#475 כותבת ל-o.sin
    // לא מתנפלים יחד (moba-bot.js, 8.11, DANA, moba-difficulty): ב"קל" לכל היותר בוט אויב אחד מתמקד בשחקן כשהוא מעל 20% חיים.
    // שלושת גיבורי האויב לידך, החברים רחוק, ו-8 שניות של קרב. בודקים גם שמתחת ל-20% מותר לגמור (יותר מאחד)
    {const me=MB.me,G={max:0,low:0,n:0},keep=MB.u.map(u=>({u,x:u.x,y:u.y,hp:u.hp})),diff=MB.diff,mine=me.bot;
     try{MB.diff='easy';me.bot=null;const foes=mbHeroes(1-me.team),al=mbHeroes(me.team).filter(h=>h!==me);
      me.x=0;me.y=0;for(const [i,f] of foes.entries()){f.dead=false;f.hp=f.max;f.x=me.x+(me.team?-1:1)*(140+i*30);f.y=(i-1)*60;f.bot.t=0;f.bot.focus=null;f.bot.mode='push'}
      for(const a of al){a.x=me.home.x;a.y=me.home.y}
      for(let i=0;i<8*30;i++){me.hp=Math.max(me.hp,me.max*0.6);me.dead=false;for(const a of al){a.x=me.home.x;a.y=me.home.y}mobaUpdate(1/30);
        const n=foes.filter(f=>!f.dead&&f.bot&&f.bot.focus===me).length;G.max=Math.max(G.max,n);G.n+=n>0?1:0}
      // מתחת ל-20%: מותר לגמור, הכלל לא חל
      for(const f of foes){f.bot.focus=me}me.hp=me.max*0.1;G.low=foes.filter(f=>mbGangFull(f,me)).length;
     }catch(err){G.err=String(err&&err.stack||err)}
     for(const k of keep){k.u.x=k.x;k.u.y=k.y;k.u.hp=k.hp}for(const f of mbHeroes(1-me.team))f.bot.focus=null;MB.diff=diff;me.bot=mine;mbFeelReset(me);mobaHud();o.gang=G}
    // סקין מתמונות עם גודל (rig.js, pose עם k): כל drawImage מקבל מידות סופיות ופי k. תמונה מזויפת "טעונה", ו-drawImage רק נרשם
    {const R={},src='skins/__t.png',dI=ctx.drawImage,sizes=[];SKINS.__t={};for(const n of ['head','body','armF','armB','legF','legB','sword'])SKINS.__t[n]={src,w:10,h:12};
     skinImgs[src]={complete:true,naturalWidth:10};ctx.drawImage=function(im,x,y,w,h){sizes.push(w,h)};
     try{const p=pose(0,0,0,false,0,10,0,1.15);drawRig(p,{skin:'__t',col:'#fff',lw:2});drawRigWeapon(p,{skin:'__t'},'sword',0);
       R.n=sizes.length/2;R.ok=R.n===7&&sizes.every(v=>Number.isFinite(v)&&(Math.abs(v/11.5-1)<0.01||Math.abs(v/13.8-1)<0.01))}catch(err){R.err=String(err)}
     ctx.drawImage=dI;delete SKINS.__t;delete skinImgs[src];o.rigK=R}
    // כיוון וביטול בגרירה (moba-aim.js): גוררים מהכפתור, משחררים על ✕ = בוטל ובלי טעינה. גוררים שמאלה עד הסוף = הסדן נוחת בקצה הטווח משמאל
    {const me=MB.me,b=document.querySelector('#mbSk [data-sk="s1"]'),r=b.getBoundingClientRect(),cx=r.x+r.width/2,cy=r.y+r.height/2,z0=MB.zones.length,R=MBKIT.tank.s1.range;
      const ev=(el,t,x,y)=>el.dispatchEvent(new PointerEvent(t,{pointerId:9,clientX:x,clientY:y,bubbles:true,cancelable:true}));
      me.cd.s1=0;me.st.stun=0;ev(b,'pointerdown',cx,cy);ev(document.body,'pointermove',cx-60,cy);
      const on=!!mbAim&&mbAim.on&&!$('mbCancel').hidden&&b.classList.contains('aiming');render();
      const c=$('mbCancel').getBoundingClientRect();ev(document.body,'pointermove',c.x+c.width/2,c.y+c.height/2);const hot=$('mbCancel').classList.contains('hot');ev(document.body,'pointerup',c.x+c.width/2,c.y+c.height/2);
      const cancel=me.cd.s1===0&&MB.zones.length===z0&&!me.st.dash&&$('mbCancel').hidden&&!mbAim;
      ev(b,'pointerdown',cx,cy);ev(document.body,'pointermove',cx-MBAIM.pull-20,cy);ev(document.body,'pointerup',cx-MBAIM.pull-20,cy);
      const z=MB.zones[MB.zones.length-1],D=me.st.dash,cast=me.cd.s1>0&&(MB.zones.length===z0+1&&Math.abs(z.x-(me.x-R))<5&&Math.abs(z.y-me.y)<5||!!D&&D.vx<-0.999&&Math.abs(D.left-R)<5);   // הסדן קופץ (moba-kits.js): נוחת בקצה הטווח משמאל
      mbAimSecs();const sec=b.dataset.sec===String(Math.ceil(me.cd.s1));
      o.aim={on,hot,cancel,cast,sec};if(MB.zones.length>z0)MB.zones.pop();me.st.dash=null;me.cd.s1=0;mbAimSecs()}
    // הולכים ישר אל מגדל שלנו באמצע הנתיב: מחליקים מסביב, לא נתקעים (אוראל, 3.11: "המוד תקוע לגמרי")
    {const me=MB.me,tw=MB.u.find(b=>b.k==='tower'&&b.team===0&&Math.abs(b.x)===MOBA.towers[1]);const hx=me.x,hy=me.y;me.x=tw.x-tw.r-me.r-4;me.y=tw.y;
      joy={id:-7,ox:150,oy:280,dx:1,dy:0};for(let i=0;i<75;i++)mobaUpdate(1/30);o.slide={pass:me.x>tw.x+tw.r,dx:Math.round(me.x-tw.x)};joy=null;me.x=hx;me.y=hy}
    // שמירה עם קשת וחרב (הדוח של אוראל מהאייפון, 3.11): ה-HUD חיפש את המכפילים של "האויב הקרוב", מצא גיבור מובה, ונפל בכל פריים, אז כל המשחק קפא
    {const g=SAVE.gear.weapon,bag=JSON.stringify(SAVE.bag),ws=Object.keys(GEAR.items).filter(id=>GEAR.items[id].slot==='weapon');
      SAVE.gear.weapon=ws.find(id=>wUse(id)==='gun');SAVE.bag[ws.find(id=>wUse(id)==='sword')]=1;const me=MB.me,f=MB.u.find(u=>u.k==='hero'&&u.team===1),fx=f.x,fy=f.y;f.x=me.x+60;f.y=me.y;
      o.two={held:wHeld().length};try{hud();o.two.ok=true}catch(e){o.two.err=e.message}f.x=fx;f.y=fy;SAVE.gear.weapon=g;SAVE.bag=JSON.parse(bag)}
    for(let i=0;i<30;i++)mobaUpdate(1/30);render();o.m3=typeof M3!=='undefined'?M3.map.size:-1;o.r3=R3D.on;   // תלת-ממד: מגדלים ובסיסים כמודלים (moba3d.js)
    // המראה (moba-look.js): כפתורי הסקילים והפקודות כאייקוני SVG בלי אימוג'י, והרצפה של המוד (בתלת-ממד: במקום הרצפה של הזירה)
    o.look={svg:document.querySelectorAll('#mbSk [data-sk]:not(.mbsp) :is(svg.mbski,svg.mbgi)').length+document.querySelectorAll('#mbPing svg').length,emoji:/\p{Extended_Pictographic}/u.test($('mbSk').textContent+$('mbPing').textContent),
      pic:[...document.querySelectorAll('#mbSk [data-sk]:not(.mbsp)')].map(b=>{const im=b.querySelector('img.mbpic');return im?im.getAttribute('src'):b.querySelector('svg.mbgi')?'gi':''}),   // האייקון: צללית game-icons ('gi', הסגנון החדש) או התמונה המצוירת של העולם (קלאסי, moba-icons.js)
      floor:R3D.on&&R3D.ready?!!(M3.floor&&M3.floor.visible)&&!R3D.ground.visible:!!MB_FLOOR};
    // מצלמה ומפה (moba-look.js, 3.11): המצלמה רחוקה (רואים לרוחב לפחות פי 1.5), יש שיחים ואבנים, והמפה הקטנה בתוך המסך
    {const b=mbMiniBox(W/2-MB.me.x,H/2-MB.me.y);o.cam={z:ZOOM,wide:Math.round(100/ZOOM)/100,bush:mbDecor().filter(d=>d.k==='bush').length,rock:mbDecor().filter(d=>d.k==='rock').length,
      mini:b.x0>=0&&b.x0+b.mw<=innerWidth,fires:R3D.on&&R3D.ready?(M3.floor&&M3.floor.userData.fires||[]).length:-1}}
    // פקודות לבוטים החברים (mbOrder): נסיגה, ואז התקפה. הכפתור מסומן, והפקודה נגמרת לבד
    for(let i=0;i<30*25;i++)mobaUpdate(1/30);
    const al=mbHeroes(0).filter(h=>!h.me);
    document.querySelector('#mbPing [data-o="back"]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));
    for(let i=0;i<30*2;i++)mobaUpdate(1/30);
    o.back=al.every(h=>h.dead||h.bot.mode==='order'||h.bot.mode==='retreat'||h.bot.mode==='dodge');
    for(const h of al){h.dead=false;h.hp=h.max;h.st.stun=h.st.taunt=0;h.bot.mode='push'}   // החברים חיים ובריאים: בודקים את הפקודה, לא את המזל של הקרב (נכשל לפעמים כששניהם מתו)
    mbOrder('attack');for(let i=0;i<30;i++)mobaUpdate(1/30);mobaHud();
    o.att=al.some(h=>!h.dead&&h.bot.mode==='order'&&h.bot.focus);o.btn=document.querySelector('#mbPing [data-o="attack"]').classList.contains('on');
    for(let i=0;i<30*9;i++)mobaUpdate(1/30);o.end=!MB.order;
    // קומבו בתרחיש קבוע, לא לפי המזל של המשחק: רטוב + ברק = חשמול (נזק ×MOBA.combo.shock), ורטוב + סופת קרח = הקפאה ארוכה (×MOBA.combo.freeze)
    {const e=mbHeroes(1)[0],w0={},ow=mbWord;mbWord=function(u,w){w0[w]=(w0[w]||0)+1;return ow(u,w)};
     Object.assign(e.st,{wet:0,imm:0,stun:0,taunt:0,armor:0,rage:0,shield:0});e.dead=false;e.hp=e.max=1e6;   // shield: מגן שנשאר מהקרב (mbShield) בולע את המכה הראשונה
     const dry=mbDmg(null,e,100,'lightning');e.st.wet=3;const wetD=mbDmg(null,e,100,'lightning');
     const mg=mbHero('mage',0,false,1);mg.lvl=MOBA.ultAt;mg.x=e.x-200;mg.y=e.y;MB.u.push(mg);e.st.wet=3;e.st.imm=0;
     mbCast(mg,'ult',e);const z=MB.zones.pop();z.fire(z);   // הסופה נוחתת מיד, בלי שהבוטים זזים או מרטיבים/מייבשים בינתיים
     o.combo={shock:w0.shock||0,k:Math.round(wetD/dry*100)/100,freeze:w0.freeze||0,frozen:e.st.stun>MBKIT.mage.ult.freeze*0.9,want:MOBA.combo.shock};
     mbWord=ow;MB.u.splice(MB.u.indexOf(mg),1);e.hp=e.max=MBKIT[e.kit].hp}
    // כל סקיל של כל ערכה, בתרחיש קבוע: גיבור ברמה 6 מטיל את שלושת הסקילים על אויב קרוב (לא תלוי באורך משחק הבוטים)
    {const e=mbHeroes(1)[0],ex0=e.x,ey0=e.y;e.hp=e.max=1e6;e.dead=false;o.fixed=[];   /* dead=false: אם מת בסוף משחק הבוטים, הרשת, הבועה והתשישות לא תופסות (mbCC) ונראה כאילו אין להן אפקט */const fx0=typeof FXLIB!=='undefined'?FXLIB.list.length:-1;o.fxIds=new Set();
     const ofx=typeof fxPlay==='function'?fxPlay:null;if(ofx)window.fxPlay=(id,...a)=>{o.fxIds.add(id);return ofx(id,...a)};   // ספריית האפקטים: אילו אפקטים הסקילים הפעילו
     /* חשיפה (QUINN, 8.11): האויב בסוף משחק הבוטים יכול לעמוד בשיח, ואז סקיל על יחידה (צעד צל, סימן מוות) לא מוטל. רואים אותו כאן, ומחזירים אחרי */
     const rv=typeof mbVisReveal==='function'?(mbVisReveal(e.x,e.y,300,999,0),MB.vis.rev[MB.vis.rev.length-1]):null;
     for(const k of Object.keys(MBKIT)){const h=mbHero(k,0,false,1);h.lvl=MOBA.ultAt;h.x=e.x-150;h.y=e.y;MB.u.push(h);
       for(const sl of MB_SLOTS){h.cd[sl]=0;h.st.dash=null;Object.assign(h.st,{stun:0,taunt:0});Object.assign(e.st,{imm:0,pure:0,stun:0,taunt:0,root:0,bub:0,exh:0,dash:null,veil:0});e.dead=false;e.hp=e.max;   /* בלי חסינות ובלי שליטה שנשארה מהסקיל הקודם או ממשחק הבוטים: שליטה שפגה מדליקה חסינות (ccImmune) באמצע החלון, והרשת או הבועה לא תופסות (W4) */if(!mbCast(h,sl,e))o.fixed.push(MBKIT[k][sl].id);for(let i=0;i<20;i++){e.x=ex0;e.y=ey0;e.st.imm=0;h.st.imm=9;mobaUpdate(1/30)}}   /* האויב נשאר במקום: בוט שזז יוצא מהבועה לפני שהיא עולה. h חסין: הלם או רשת מהבוט של האויב היו מבטלים את זינוק הסדן לפני הנחיתה (W2) */
       MB.u.splice(MB.u.indexOf(h),1)}
     if(rv)MB.vis.rev=MB.vis.rev.filter(r=>r!==rv);   // החשיפה של הבדיקה לא נשארת
     // הלחשים, הריפוי והחזרה לבסיס (moba-spells.js, moba-recall.js): כל אחד מפעיל את האפקט שלו מהספרייה
     if(typeof mbSpellCast==='function'){const h=mbHero('mage',0,false,1),V0=MB.vis&&MB.vis.rev.slice(),Z0=MB.spellZ&&MB.spellZ.slice(),es=Object.assign({},e.st);   /* העתק שטוח ולא JSON: st.tBy מצביע על גיבור, ומאז #423 לגיבור שנלכד ברשת יש fxs.rootFx.follow שחוזר אליו (מעגל) */e.x=ex0;e.y=ey0;h.x=e.x-150;h.y=e.y;MB.u.push(h);typeof mbVisReveal==='function'&&mbVisReveal(e.x,e.y,120,5,h.team);typeof mbVisNow==='function'&&mbVisNow(true);   /* חשיפה קצרה: תשישות צריכה לראות את האויב גם אם הוא בשיח */
       for(const id of Object.keys(MBSPELL.list)){mbSpellInit(h);h.spell=id;h.cd.spell=0;Object.assign(h.st,{dash:null,stun:0,taunt:0,root:0});mbSpellCast(h,{x:e.x,y:e.y});h.st.dash=null;h.x=e.x-150;h.y=e.y}
       h.hp=h.max/2;h.cd.heal=0;mbHealCast(h);
       if(typeof mbRecallStart==='function'){h.st.stun=0;mbRecallStart(h);if(h.recall)mbRecallStop(h,false)}
       MB.u.splice(MB.u.indexOf(h),1);if(MB.vis)MB.vis.rev=V0||[];MB.spellZ=Z0;Object.assign(e.st,es);typeof mbVisNow==='function'&&mbVisNow(true)}   /* בלי שאריות: חשיפה ותשישות היו מפילות את בדיקות הראייה שאחרי */
     e.hp=e.max=MBKIT[e.kit].hp;if(ofx)window.fxPlay=ofx;o.fxIds=[...o.fxIds];o.sharpSkip=typeof MBSHARP!=='undefined'&&MBSHARP.on?Object.values(MBSHARP.skip).flat():[];o.fxLib=typeof FXDATA!=='undefined'?Object.keys(FXDATA).length:0;
     try{fxDraw();fxDrawUi();o.fxDrawOk=true}catch(err){o.fxDrawOk=err.message}
     // האפקט נוחת על המסך ליד הגיבור: עד 7.11 render.js צייר אותם אחרי ש-mobaDraw עבר לקואורדינטות המסך, וכל אפקט במובה היה מחוץ למסך
     try{const me=MB.me,od=ctx.drawImage,oi=window.fxImg,fake=document.createElement('canvas');let at=null;const al=MB.u.find(u=>u.k==='hero'&&u.team===me.team&&!u.dead)||me,cam0={x:S.cam.x,y:S.cam.y};S.cam.x=al.x;S.cam.y=al.y;const L0=FXLIB.list.splice(0);fxPlay('ult_cast',al.x,al.y,{dur:5});   /* רק האפקט של הבדיקה ברשימה: אפקטים אחרים ממשחק הבוטים נמצאים במקומות אחרים במפה */   /* מצלמה על גיבור חי שלנו: בלי ערפל, והאפקט צריך לנחות במרכז */
       window.fxImg=()=>fake;   // תמונה מדומה: בתוך הבדיקה הזמן לא עובר, והתמונה האמיתית לא מספיקה להיטען
       ctx.drawImage=function(im){if(!at&&im===fake){const t=ctx.getTransform();at=[t.e/DPR,t.f/DPR];return}return od.apply(this,arguments)};
       try{render()}finally{ctx.drawImage=od;window.fxImg=oi;S.cam.x=cam0.x;S.cam.y=cam0.y;FXLIB.list.length=0;FXLIB.list.push(...L0)}o.fxAt=at?{x:Math.round(at[0]),y:Math.round(at[1]),on:at[0]>0&&at[0]<innerWidth&&at[1]>0&&at[1]<innerHeight}:null}catch(err){o.fxAt={err:err.message}}}
    // הסקילים שהחליפו זינוק וריפוי (6.11, docs/moba-plan.md פרק 2), בתרחיש קבוע: אין יותר charge, leap ו-heal ב-MBKIT. רשת ציד לוכדת (st.root):
    // לא זז, כן תוקף, ואחרי זה חסינות קצרה. כלא מים מרים ומרטיב, וברק אחריו = חשמול. גל חרב מהמם ומאט לאורך קו
    {const e=mbHeroes(1)[0],R={},ow=mbWord,w0={},ex=e.x,ey=e.y,clr=()=>{Object.assign(e.st,{wet:0,imm:0,stun:0,taunt:0,root:0,bub:0,slow:0,armor:0,rage:0,shield:0,dash:null});e.dead=false;e.hp=e.max=1e6};
     mbWord=function(u,w){w0[w]=(w0[w]||0)+1;return ow(u,w)};
     // רשת, כלא מים וגל חרב יוצאים בקו: חומת ברזל אדומה שנשארה מהקרב (MB.walls, נבדקת לפי x בלבד) או גיבור אדום אחר בנתיב תפסו אותם, והבדיקה נכשלה לפעמים (QUINN, 8.11).
     // לכן בבלוק הזה אין חומות ואין גיבורים אדומים חוץ מ-e. הכל חוזר בסוף
     const wl=MB.walls.slice(),u0=MB.u;MB.walls.length=0;MB.u=MB.u.filter(o=>o===e||!(o.k==='hero'&&o.team===e.team));
     const ids=Object.values(MBKIT).flatMap(K=>MB_SLOTS.map(sl=>K[sl].id));R.gone=['charge','leap','heal'].filter(i=>ids.includes(i));R.new=['cleave','net','bubble'].every(i=>ids.includes(i));
     const add=k=>{const h=mbHero(k,0,false,1);h.x=e.x-200;h.y=e.y;MB.u.push(h);return h},del=h=>MB.u.splice(MB.u.indexOf(h),1),run=(n,f)=>{for(let i=0;i<n&&!f();i++)mbShots(1/30)};
     clr();let h=add('hunter');mbCast(h,'s2',e);run(40,()=>e.st.root>0);R.root=e.st.root>0&&w0.root>0;
     const x0=e.x,y0=e.y;mbMove(e,e.x+300,e.y,0.5);R.still=Math.hypot(e.x-x0,e.y-y0)<0.5&&!e.moving;
     h.x=e.x-(e.r+h.r+5);h.y=e.y;e.atkT=0;R.atk=mbAttack(e,0,h,MBKIT[e.kit].atk)&&e.atkT>0;
     for(let i=0;i<60;i++)mbTick(e,1/30);R.free=!(e.st.root>0)&&e.st.imm>0&&!mbCC(e,'root',1,h);del(h);
     clr();h=add('mage');mbCast(h,'s2',e);const z=MB.zones.pop();z.fire(z);R.bub=e.st.bub>0&&e.st.stun>0&&e.st.wet>0;
     const sh=w0.shock||0,mt=MB.t;MB.t=Math.max(MB.t,MOBA.early?MOBA.early.t:0);const d0=mbDmg(null,e,100,'lightning');MB.t=mt;R.shock=(w0.shock||0)>sh&&d0>100;del(h);   // d0 אחרי הפתיחה הרכה (MOBA.early)
     clr();h=add('warrior');mbCast(h,'s1',e);run(40,()=>e.st.stun>0);R.cleave=e.st.stun>0&&e.st.slow>0;del(h);
     mbWord=ow;clr();e.hp=e.max=MBKIT[e.kit].hp;e.x=ex;e.y=ey;MB.u=u0;MB.walls.length=0;MB.walls.push(...wl);o.newSk=R}
    // טנק ולוחם יעילים, ואפקטים (moba-kits.js, moba-fx.js), בתרחיש קבוע: זינוק של תקיפה רגילה אל מטרה קצת מחוץ לטווח, מגן שסופג,
    // חלקיקים מוגבלים, עצירת פריים במכה קריטית של השחקן, ורגע הסקיל-על (הילוך איטי ושם הסקיל). gap: הכי קרוב שהגיע, כי אחרי המכה הבוט יכול ללכת
    {const e=mbHeroes(1)[0],r={},ex=e.x,ey=e.y;Object.assign(e.st,{stun:9,taunt:0,imm:0,shield:0,armor:0,rage:0,slow:0,dash:null});e.dead=false;e.hp=e.max=1e6;
     MB.walls.length=0;e.x=0;e.y=-MOBA.lane.half+40;   // מקום ריק: באמצע הנתיב (בין המגדלים), בלי חומות שנשארו מהקרב
     const all=MB.u;   // רק התוקף והמטרה בעולם: בוט אחר (מגן של קוסמת, הלם) לא ישנה את התוצאה
     for(const k of ['tank','warrior']){const h=mbHero(k,0,false,1),A=MBKIT[k].atk;h.x=e.x-(e.r+h.r+A.range+A.lunge*0.6);h.y=e.y;MB.u=[e,h];if(typeof mbVisNow==='function')mbVisNow(true);e.st.shield=0;const hp0=e.hp;
       r[k]=mbAutoTarget(h,A.range)!==null&&mbAttack(h,0,e,A)&&!!h.st.dash;let gap=1e9;for(let i=0;i<20;i++){mobaUpdate(1/30);gap=Math.min(gap,mbDist(h,e)-e.r-h.r)}r[k]=r[k]&&e.hp<hp0&&gap<=A.range}
     MB.u=all;
     const h0=e.hp;mbShield(e,100,3);mbDmg(null,e,60,'physical');r.shield=e.hp===h0&&e.st.shield>0;
     const F=mbfxS(),me=MB.me,bot=me.bot;me.bot=null;for(let i=0;i<40;i++)mbBoom(e.x,e.y,200,'fire');r.cap=F.p.length>0&&F.p.length<=MBFX.max;
     F.stopCd=0;mbfxNum(e.x,e.y,150,C.gold,{crit:true},me,e);const t0=MB.t;mobaUpdate(1/30);r.stop=F.stop>=0&&MB.t===t0&&F.n.length>0;F.stop=0;
     Object.assign(me,{dead:false,lvl:MOBA.ultAt,hp:me.max});me.cd.ult=0;Object.assign(me.st,{stun:0,taunt:0,dash:null});r.ult=mbCast(me,'ult',e)&&F.slow>0&&!!F.ult&&F.ult.txt.length>0;
     F.slow=0;F.ult=null;me.bot=bot;Object.assign(e.st,{stun:0,shield:0});e.hp=e.max=MBKIT[e.kit].hp;e.x=ex;e.y=ey;o.fx=r}
    // מזג אוויר (moba-weather.js, אוראל 7.11): גשם קל בהתחלה שמתחזק עם הזמן, ברק ומבזק במבנה שנופל (רק איפה שאני רואה), ומצויר מתחת לסקילים
    if(typeof MBWX!=='undefined'){const X=MBWX,w={},t0=MB.t,f0=X.falls,fl0=X.fl,b0=X.bolts.length;
     w.rain=X.core||!!X.h;{const rb=document.getElementById('mbRecall');if(rb&&rb.offsetParent&&typeof mbfxUltY==='function'){const cr=cvs.getBoundingClientRect(),rr=rb.getBoundingClientRect(),yPx=cr.top+mbfxUltY(34)/H*cr.height;w.ultY=Math.round(yPx);w.recallTop=Math.round(rr.top);w.ultOk=yPx+8<=rr.top}}   // MLBB 3.1: the ult name (moba-fx.js) above Recall, not on it
const wf=MBWX.falls;MBWX.falls=0;MB.t=5;const k1=mbWxK(MB);MB.t=MOBA.maxT*0.9;const k2=mbWxK(MB);MB.t=t0;MBWX.falls=wf;w.build=k1<0.1&&k2>k1+0.5;   // falls=0: a tower the bot already dropped added 0.12 and made this flaky (#536 CI)
     const mt=MB.u.find(b=>b.k==='tower'&&b.team===0),fake=b=>mbUnit({k:'tower',team:b.team,x:b.x,y:b.y,r:b.r,hp:1,max:1});
     if(typeof mbVisNow==='function')mbVisNow(true);   // הראייה מחושבת מחדש: הבלוק הקודם חישב אותה עם שתי יחידות בלבד
     const sv=mbHeroes(1).map(h=>[h.xp,h.lvl]);mbDie(fake(mt),null);w.fall=X.falls===f0+1&&(X.core||X.bolts.length===b0+1&&(RM||typeof fxLess==='function'&&fxLess()||X.fl===1));
     const fx=MOBA.base.x,hid=typeof mbVisPt==='function'&&!mbVisPt(fx,0);if(hid){const n=X.bolts.length;mbDie(fake({team:1,x:fx,y:0,r:40}),null);w.fog=X.bolts.length===n}else w.fog=true;
     mbHeroes(1).forEach((h,i)=>{h.xp=sv[i][0];h.lvl=sv[i][1]});X.falls=f0;X.fl=fl0;X.bolts.length=b0;
     const src=mobaDraw.toString(),iw=src.indexOf('mbWxDraw');w.under=iw>0&&iw<src.indexOf('mbfxDraw')&&iw<src.indexOf('M.zones')&&iw<src.indexOf('M.shots');
     try{mbWxDraw();w.draw=true}catch(err){w.draw=err.message}w.ms=Math.round(X.ms*100)/100;o.wx=w}
    // משוב קרב מספריית האפקטים (moba-fx.js MBLIB, אוראל 7.11), בתרחיש קבוע ליד המצלמה: יריה עפה ופגיעה, חיתוך מקרוב, CRIT!, עליית רמה,
    // סימן "רטוב" שמופיע ונעלם עם המצב, הריגה, מגדל שנפגע ונופל, וטבעת קבוצה מתחת לגיבור
    if(typeof MBLIB!=='undefined'){const r={},all=MB.u,me=MB.me,bk={x:me.x,y:me.y,lvl:me.lvl,xp:me.xp,hp:me.hp,dead:me.dead,score:MB.score.slice()};MBFX.log={};
     const cx=S.cam.x,cy=S.cam.y,hu=mbHero('hunter',0,false,1),wa=mbHero('warrior',0,false,2),e=mbHero('tank',1,false,0),tw=all.find(b=>b.k==='tower'&&b.team===1&&Math.abs(b.x)===MOBA.towers[0]);
     Object.assign(me,{x:cx,y:cy,dead:false});hu.x=cx-60;hu.y=cy;wa.x=cx+100;wa.y=cy+40;e.x=cx+150;e.y=cy;e.hp=e.max=1e6;MB.u=[me,hu,wa,e,tw];mbVisNow(true);
     hu.atkT=0;mbAttack(hu,0,e,MBKIT.hunter.atk);for(let i=0;i<40&&MB.shots.length;i++)mbShots(1/30);
     wa.atkT=0;mbAttack(wa,0,e,MBKIT.warrior.atk);mbfxNum(e.x,e.y,150,C.gold,{crit:true},hu,e);
     me.lvl=1;me.xp=0;mbXp(me,MOBA.xp.need[1]+1);
     e.st.wet=3;mbfxUnits();r.wetOn=!!(e.fxh&&e.fxh.st_wet&&e.fxh.st_wet.on);const wh=e.fxh&&e.fxh.st_wet;e.st.wet=0;mbfxUnits();r.wetOff=!!wh&&!wh.on&&!e.fxh.st_wet;
     const noGlow=typeof MBSHARP!=='undefined'&&MBSHARP.on&&!MBSHARP.teamGlow;   // שפת האפקטים החדה (mb-sharp.js): טבעת הזוהר של הקבוצה כבויה בכוונה, ואז בודקים שהיא לא שם
     r.glow=noGlow?!(me.fxh&&me.fxh.glow):!!(me.fxh&&me.fxh.glow&&e.fxh.glow&&e.fxh.glow.id==='glow_enemy');
     const tx=tw.x,ty=tw.y;tw.x=cx-150;tw.y=cy-60;tw.fxHit=-9;mbfxTower(tw);mbfxFall(tw);delete tw.fallT;tw.x=tx;tw.y=ty;
     e.hp=1;mbDmg(hu,e,999,'physical');const L=MBFX.log;
     r.got=['shot_arrow','hit','slash','dmg_crit','levelup','levelup_ring','st_wet','ko','tower_hit','tower_fall','debris'].concat(noGlow?[]:['glow_ally','glow_enemy']).filter(id=>!L[id]);
     try{render();r.draw=true}catch(err){r.draw=err.message}
     MB.u=all;MB.shots.length=0;MBFX.log=null;Object.assign(me,{x:bk.x,y:bk.y,lvl:bk.lvl,xp:bk.xp,hp:bk.hp,dead:bk.dead});MB.score=bk.score;mbVisNow(true);o.lib=r}
    // זרימה (הבודק, 6.11): הקושי משנה את המוח של בוטי האויב בלבד, מגן מגדלים ב-3 הדקות הראשונות, זהב חזרה, חזרה מהירה בהתחלה, ריצה מהבסיס, ו-XP ברדיוס רחב
    {const r={},t0=MB.t,me=MB.me,red=mbHeroes(1)[0],blue=mbHeroes(0).find(h=>!h.me),d0=MB.diff;
     MB.diff='easy';const e=mbMind(red),a=mbMind(blue);MB.diff='hard';const h=mbMind(red);MB.diff=d0;
     r.diff=e.think>h.think&&e.skill>h.skill&&a===MBBOT.diff.hard;   // האויבים לפי הקושי, החברים תמיד אותו דבר. חיים ונזק לא תלויים בזה (MBKIT)
     // המגדל כמו שמשחק הבוטים השאיר אותו (QUINN, 8.11): עם 50 חיים או פחות המכה הראשונה הפילה אותו והבדיקה נכשלה, ומגדל שכבר נפל לא נמצא. מודדים על מגדל מלא, ומחזירים חיים, מקסימום ומוות
     const tw=MB.u.find(b=>b.k==='tower'&&b.team===1&&Math.abs(b.x)===MOBA.towers[0]),tw0={hp:tw.hp,max:tw.max,dead:tw.dead};tw.dead=false;tw.hp=tw.max=1e6;
     MB.t=10;const early=mbDmg(null,tw,100,'physical');MB.t=MOBA.shield.t+5;const late=mbDmg(null,tw,100,'physical');MB.t=t0;Object.assign(tw,tw0);
     r.shield=Math.abs(early-100*(1-MOBA.shield.k))<0.01&&Math.abs(late-100)<0.01;
     const bk=mbHeroes(1).map(x=>x.gold||0);mbHeroes(1).forEach(x=>x.gold=(x.gold||0)+3000);   // בלי זהב קאמבק (moba-gamble.js מחליף אותו): הריגה של מוביל משלמת בדיוק כמו כל הריגה
     const victim=mbUnit({k:'hero',kit:red.kit,team:1,hp:10,max:10,lvl:1,hitBy:new Map(),deaths:0,home:red.home});const g0=blue.gold||0;
     mbItDie(victim,blue);r.bounty=Math.abs((blue.gold||0)-g0-MBITEM.gold.kill)<0.01&&!MBITEM.comeback;
     mbHeroes(1).forEach((x,i)=>x.gold=bk[i]);
     MB.t=30;r.resp=mbResp({lvl:1})===MOBA.respawn.base;r.late=mbResp({lvl:6})>mbResp({lvl:1})*4;MB.t=t0;
     const hx=blue.x,hy=blue.y,ht=blue.hurtT;blue.x=blue.home.x;blue.y=blue.home.y;blue.hurtT=-99;const fast=mbSpeed(blue);blue.hurtT=MB.t;const hurt=mbSpeed(blue);blue.hurtT=-99;
     blue.x=0;blue.y=0;const out=mbSpeed(blue);r.haste=Math.abs(fast/out-MOBA.haste.k)<0.01&&Math.abs(hurt-out)<0.01;blue.x=hx;blue.y=hy;blue.hurtT=ht;
     const x0=blue.xp,l0=blue.lvl,mn=mbUnit({k:'minion',team:1,x:blue.x+MOBA.xp.share-40,y:blue.y,hp:1,max:1});MB.u.push(mn);const bd=blue.dead;blue.lvl=1;blue.dead=false;mbDie(mn,null);r.xp=blue.xp>x0;blue.lvl=l0;
     if(typeof mbRecallStart==='function'){blue.x=0;blue.y=0;blue.hurtT=-99;Object.assign(blue.st,{stun:0,dash:null});const on0=mbHaste(blue);   // חזרה לבסיס (moba-recall.js) + ריצה מהבסיס: מי שחזר רץ מהר כשהוא יוצא
       r.recall=!on0&&mbRecallStart(blue)&&(mbRecallTick(MB,MBRECALL.t+0.1),mbHaste(blue));blue.recall=null;blue.x=hx;blue.y=hy;blue.hurtT=ht}else r.recall=true;
     blue.dead=bd;o.flow=r}
    // ריפוי ולחשים (moba-spells.js) בתרחיש קבוע, באמצע המפה: כל אחד עובד, נכנס לטעינה, ויש לו הסבר. וכפתורים שלא מכסים את הסקילים
    if(typeof MBSPELL!=='undefined'){const me=MB.me,r={},L=MBSPELL.list,hx=me.x,hy=me.y,e=mbHeroes(1).find(x=>!x.dead)||mbHeroes(1)[0],ex=e.x,ey=e.y,ed=e.dead;
      const calm=u=>Object.assign(u.st,{stun:0,taunt:0,slow:0,slowK:0,imm:0,dash:null,haste:0,exh:0,pure:0,shield:0});
      const away=mbHeroes(1).filter(x=>x!==e).map(x=>[x,x.x,x.y]);for(const [x] of away){x.x=MOBA.base.x;x.y=0}   // רק גיבור אויב אחד ליד
      me.x=0;me.y=0;calm(me);me.dead=false;me.hp=me.max*0.5;me.cd.heal=0;const h0=me.hp;mbPress('heal');
      r.heal=Math.abs(me.hp-h0-me.max*MBSPELL.heal.k)<1&&me.cd.heal===MBSPELL.heal.cd;const h1=me.hp;mbPress('heal');r.healCd=me.hp===h1;
      const done=[],tip=[];for(const id in L){if(T('mb.spD.'+id)!=='mb.spD.'+id)tip.push(id);me.spell=id;me.cd.spell=0;calm(me);me.x=0;me.y=0;e.dead=false;e.hp=e.max;calm(e);e.x=600;e.y=0;let ok=false;
        if(id==='dash'){ok=mbSpellCast(me,{x:500,y:0});for(let i=0;i<8&&me.st.dash;i++){const D=me.st.dash,st=Math.min(D.left,D.sp/30);mbStep(me,D.vx*st,D.vy*st);D.left-=st;if(D.left<=0.5){me.st.dash=null;D.end()}}ok=ok&&Math.abs(me.x-L.dash.range)<15}
        else if(id==='haste'){const v0=mbSpeed(me);ok=mbSpellCast(me)&&Math.abs(mbSpeed(me)/v0-1-L.haste.k)<0.01}
        else if(id==='barrier')ok=mbSpellCast(me)&&Math.abs(me.st.shield-me.max*L.barrier.k)<1;
        else if(id==='reveal'){const n=(MB.spellZ||[]).length;ok=mbSpellCast(me,{x:300,y:0})&&MB.spellZ.length===n+1}
        else if(id==='exhaust'){ok=!mbSpellCast(me)&&me.cd.spell===0;e.x=300;typeof mbVisNow==='function'&&mbVisNow(true);ok=ok&&mbSpellCast(me)&&e.st.exh>0&&e.st.slow>0&&Math.abs(mbSpellDmgK(e)-(1-L.exhaust.dmg))<0.01}
        else if(id==='cleanse'){me.st.stun=2;me.st.slow=2;me.st.slowK=0.5;me.st.root=2;me.st.bub=2;ok=mbSpellCast(me)&&!(me.st.stun>0)&&!(me.st.slow>0)&&!(me.st.root>0)&&!(me.st.bub>0)&&!mbCC(me,'stun',1,e)}
        if(ok&&me.cd.spell===L[id].cd&&!mbSpellCast(me,{x:300,y:0}))done.push(id)}
      // נגיעה קצרה אחרי פריים כבד (ההסבר כבר הופיע) עדיין מטילה, ולחיצה ארוכה באמת לא (moba-aim.js, לפי הזמנים של הנגיעה)
      {const b=document.querySelector('#mbSk [data-sk="spell"]'),ev=t=>new PointerEvent(t,{pointerId:91,bubbles:true,cancelable:true,clientX:5,clientY:5});me.spell='haste';calm(me);me.dead=false;
       me.cd.spell=0;b.dispatchEvent(ev('pointerdown'));let tp=!!mbAim;if(tp){mbAim.t0-=2000;mbAimDraw();tp=mbAim.tip}dispatchEvent(ev('pointerup'));r.tap=tp&&me.cd.spell>0;
       me.cd.spell=0;calm(me);b.dispatchEvent(ev('pointerdown'));if(mbAim){mbAim.t0-=2000;mbAim.ts-=2000;mbAimDraw()}dispatchEvent(ev('pointerup'));r.hold=me.cd.spell===0&&!mbAim;calm(me);me.cd.spell=0}
      Object.assign(r,{done,tip,n:Object.keys(L).length});calm(me);calm(e);me.spell='barrier';me.cd.spell=0;me.x=hx;me.y=hy;me.hp=me.max;e.x=ex;e.y=ey;e.dead=ed;MB.spellZ=[];for(const [x,ax,ay] of away){x.x=ax;x.y=ay}
      mobaHud();const sk=k=>{const b=document.querySelector('#mbSk [data-sk="'+k+'"]');return b&&b.getBoundingClientRect()},hit=(a,b)=>a&&b&&a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
      const mine=['heal','spell'].map(sk),rc=$('mbRecall').getBoundingClientRect();const bad=[];['heal','spell'].forEach((n,i)=>{const m=mine[i];if(!m){bad.push(n+' חסר');return}for(const k of ['s1','s2','ult'])if(hit(m,sk(k)))bad.push(n+'/'+k);if(hit(m,rc))bad.push(n+'/חזרה');if(m.right>innerWidth||m.bottom>innerHeight||m.left<0||m.top<0)bad.push(n+' בחוץ '+[m.left,m.top,m.right,m.bottom].map(Math.round))});
      if(hit(mine[0],mine[1]))bad.push('heal/spell');r.btn=!bad.length;r.bad=bad;
      r.pic=[...document.querySelectorAll('#mbSk .mbsp')].map(b=>{const im=b.querySelector('img.mbpic');return im?im.getAttribute('src'):b.querySelector('svg.mbgi')?'gi':''});o.spell=r}
    // תיקונים מבדיקת ה-QA (docs/moba-qa-report.md, 7.11): הטלה בחדר ההימור חוסמת זינוק, סדן וחזרה בלי טעינה; מי שמת בחדר חוזר בלי רשת ובועה;
    // לחש מתוך שיח חושף; אזור של אויב בערפל לא מצויר; הודעה של החדר קופצת לראש התור; ההסבר מעל כפתור הריפוי; ליד החדר ההודעות יורדות
    if(typeof mbGbBusy==='function'&&typeof MBSPELL!=='undefined'){const r={},me=MB.me,bk={x:me.x,y:me.y,sp:me.spell,cd:{...me.cd},hp:me.hp,dead:me.dead,deaths:me.deaths,resp:me.resp},G=mbGb(),R0=G.roll;
     try{me.dead=false;me.hp=me.max;mbStReset(me);me.x=MBGAMBLE.at.x;me.y=MBGAMBLE.at.y;me.cd.s1=0;me.cd.spell=0;me.spell='dash';
      G.roll={u:me,t:2,x:me.x,y:me.y,win:false,tick:-1};
      r.roll=!mbCast(me,'s1',{x:me.x+100,y:me.y})&&me.cd.s1===0&&!mbSpellCast(me,{x:me.x+100,y:me.y})&&me.cd.spell===0&&!mbRecallStart(me);
      me.st.root=2;me.st.bub=2;me.st.stun=1;mbGambleTick(MB,2.1);r.reset=me.dead&&!(me.st.root>0)&&!(me.st.bub>0)&&!(me.st.stun>0);
      G.roll=null;G.used[me.team]=Math.max(0,G.used[me.team]-1);
      me.dead=false;me.hp=me.max;me.x=MBGAMBLE.at.x;me.y=MBGAMBLE.at.y;mbGambleTick(MB,1/30);r.near=document.body.classList.contains('mbgbnear');me.x=bk.x;me.y=bk.y;mbGambleTick(MB,1/30);r.near=r.near&&!document.body.classList.contains('mbgbnear');
      const e=mbHeroes(1)[0],eb={x:e.x,y:e.y,dead:e.dead,sp:e.spell,cd:e.cd.spell,act:e.actT},bz=mbBushes().list.find(b=>Math.abs(b.x)<300&&b.y<0)||mbBushes().list[0];
      const iso=MB.u.filter(u=>u!==me&&u!==e&&u.k!=='tower'&&u.k!=='base'&&!u.dead).map(u=>[u,u.x,u.y]);for(const [u] of iso){u.x=-1e5;u.y=-1e5}const rvb=MB.vis?MB.vis.rev.splice(0):[];   // יחידות אחרות וחשיפות פעילות לא בשיח (אחרת התוצאה תלויה במקרה: מיניון שעבר שם)
      e.dead=false;e.x=bz.x;e.y=bz.y;e.actT=-99;me.x=bz.x;me.y=bz.y+200;mbVisNow(true);const hid=!mbSeen(e,0);e.spell='haste';e.cd.spell=0;e.st.haste=0;mbSpellCast(e);mbVisNow(true);r.bushCast=hid&&mbSeen(e,0);
      for(const [u,x,y] of iso){u.x=x;u.y=y}if(MB.vis)MB.vis.rev.push(...rvb);mbVisNow(true);
      e.actT=-99;mbVisNow(true);let fp=null;for(let x=-1800;x<=1800&&!fp;x+=150)for(const y of [-600,0,600])if(!fp&&!mbVisPt(x,y))fp={x,y};
      const far=fp?{x:fp.x,y:fp.y,r:80,team:1}:{x:0,y:0,r:80,team:0},mine={x:far.x,y:far.y,r:80,team:0},seen={x:me.x+100,y:me.y,r:80,team:1};e.actT=-99;mbVisNow(true);r.zone=!!fp&&!mbZoneShown(far)&&mbZoneShown(mine)&&mbZoneShown(seen);
      Object.assign(e,{x:eb.x,y:eb.y,dead:eb.dead,spell:eb.sp,actT:eb.act});e.cd.spell=eb.cd;e.st.haste=0;mbVisNow(true);
      clearTimeout(mbBanner.tm);mbBanner.tm=null;mbBanner.q=[];mbBanner.at=performance.now();mbBanner('qa-a',C.dim);mbBanner('qa-b',C.dim);mbBanner('qa-gb',C.gold,true);r.pri=mbBanner.q[0].txt==='qa-gb';clearTimeout(mbBanner.tm);mbBanner.tm=null;mbBanner.q=[];
      me.x=bk.x;me.y=bk.y;mobaHud();const hb=document.querySelector('#mbSk [data-sk="spell"]');mbSpellTip('spell',hb);const tp=$('mbSpTip'),cs=getComputedStyle(tp);   // ההסבר מעל כל הכפתורים (pointer-events:none, אז בודקים את הסדר ולא elementFromPoint)
      r.tip=tp.parentNode===document.body&&cs.position==='fixed'&&+cs.zIndex>+(getComputedStyle($('mbSk')).zIndex||0)&&!tp.hidden;mbSpellTip(null);
     }catch(e){r.err=String(e)}
     MB.gb.roll=R0;Object.assign(me,{x:bk.x,y:bk.y,spell:bk.sp,hp:bk.hp,dead:bk.dead,deaths:bk.deaths,resp:bk.resp});Object.assign(me.cd,bk.cd);mbStReset(me);document.body.classList.remove('mbgbnear');o.qa=r}
    const spl={heal:0,use:{},pick:{}};if(typeof MBSPELL!=='undefined'){const fs0={c:mbSpellCast,h:mbHealCast};spl.f=fs0;
      mbSpellCast=function(u,a){const r=fs0.c(u,a);if(r&&u.bot)spl.use[u.spell]=(spl.use[u.spell]||0)+1;return r};
      mbHealCast=function(u){const r=fs0.h(u);if(r&&u.bot)spl.heal++;return r}}
    // חדר ההימור (moba-gamble.js): סגור לפני unlock, רק הזכאי נכנס ואחרים נדחפים, בשוויון אף אחד, ניצחון = בדיוק כמו העשיר, הפסד בלי זהב ו-XP לאויב, פעם לקבוצה
    if(typeof MBGAMBLE==='object'){const r={},A=MBGAMBLE,c=A.at,t0=MB.t,G0=MB.gb,rnd=Math.random,sc=[...MB.score],hs=MB.u.filter(u=>u.k==='hero');
     const bak=hs.map(h=>({h,v:{x:h.x,y:h.y,gold:h.gold,it:[...(h.it||[])],dead:h.dead,hp:h.hp,deaths:h.deaths,resp:h.resp,xp:h.xp,lvl:h.lvl,kills:h.kills,bot:h.bot&&{...h.bot}}}));
     try{const B=mbHeroes(0),R=mbHeroes(1),set=(L,g)=>L.forEach((h,i)=>{h.gold=g[i];h.it=[];mbItCalc(h);h.dead=false;h.hp=h.max;h.x=-600-i*80;h.y=200}),
       put=u=>{u.x=c.x;u.y=c.y;u.dead=false;u.hp=u.max},out=u=>Math.hypot(u.x-c.x,u.y-c.y)>=A.r,tk=s=>{for(let i=0;i<s*30;i++)mbGambleTick(MB,1/30)};
      MB.gb=null;set(B,[100,200,300]);set(R,[500,600,700]);const low=B[0],mid=B[2];
      MB.t=A.unlock-10;put(low);tk(0.1);r.closed=!MB.gb.roll&&out(low);
      MB.t=A.unlock+1;put(mid);tk(0.1);r.push=!MB.gb.roll&&out(mid)&&MB.gb.open;
      set(R,[100,200,300]);put(low);tk(0.1);r.tie=mbGbTeam()===null&&!MB.gb.roll&&out(low);set(R,[500,600,700]);
      Math.random=()=>0;put(low);tk(0.05);r.enter=!!MB.gb.roll&&MB.gb.roll.u===low&&MB.gb.used[0]===1;Math.random=rnd;
      put(mid);tk(0.1);r.busy=out(mid)&&MB.gb.roll&&MB.gb.roll.u===low;
      const lx=low.x;low.x+=60;tk(0.2);r.lock=low.x===lx;tk(A.roll);
      r.win=!MB.gb.roll&&Math.abs(mbWorth(low)-700)<0.01&&!low.dead;
      const nxt=B.reduce((a,h)=>mbWorth(h)<mbWorth(a)?h:a);put(nxt);tk(0.1);r.once=!MB.gb.roll&&out(nxt);
      set(R,[50,60,70]);const rl=R[0],bg=B.map(h=>h.gold),bx=B.map(h=>h.xp),bk=B.map(h=>h.kills),s0=MB.score.join();
      Math.random=()=>0.99;put(rl);tk(0.05);Math.random=rnd;const started=!!MB.gb.roll&&MB.gb.roll.u===rl;tk(A.roll+0.1);
      r.lose=started&&rl.dead&&rl.resp>0&&MB.score.join()===s0&&B.every((h,i)=>h.gold===bg[i]&&h.xp===bx[i]&&h.kills===bk[i]);
     }catch(e){r.err=String(e)}
     Math.random=rnd;MB.gb=G0;MB.t=t0;MB.score=sc;for(const {h,v} of bak){Object.assign(h,v);mbItCalc(h);h.hp=v.hp}o.gb=r}
    // ראייה, ערפל ושיחים (moba-vision.js, אוראל 6.11): אויב מחוץ לראייה לא מצויר ולא מותקף, מופיע כשנכנס, ושיח מסתיר מהאויב בלבד
    if(typeof mbSeen==='function'){const r={},me=MB.me,e=mbHeroes(1)[0],al=mbHeroes(0).find(h=>!h.me),hs=MB.u.filter(u=>u.k==='hero'),bak=hs.map(h=>[h,h.x,h.y,h.dead,h.actT,h.st.stun]);
     for(const h of hs){h.x=h.home.x;h.y=h.home.y;h.dead=false;h.actT=-99}
     const bz=mbBushes().list.find(b=>Math.abs(b.x)<300&&b.y<0)||mbBushes().list[0],see=()=>(mbVisNow(true),mbSeen(e,0)),put=(u,x,y)=>{u.x=x;u.y=y};
     const iso=MB.u.filter(u=>u!==me&&u!==e&&u!==al&&u.k!=='tower'&&u.k!=='base'&&!u.dead).map(u=>[u,u.x,u.y]);for(const [u] of iso){u.x=-1e5;u.y=-1e5}const rvb=MB.vis?MB.vis.rev.splice(0):[];   // יחידות אחרות וחשיפות פעילות רחוק מהשיח: אחרת התוצאה תלויה במקרה (מיניון שעבר שם)
     const shown=()=>{e.st.stun=me.st.stun=1;mobaUpdate(1/30);return enemies.includes(e)},aimed=()=>mbAutoTarget(me,2000)===e||mbAimFor(me,{range:2000})===e;
     put(me,bz.x,-560);put(e,bz.x+650,-560);r.far=!see()&&!shown()&&!aimed();   // רחוק: לא רואים, לא מצויר בתלת-ממד, לא מכוונים אליו
     put(e,me.x+250,me.y);r.near=see()&&shown();   // נכנס לטווח: מופיע
     put(e,bz.x,bz.y);put(me,bz.x,bz.y+200);r.bush=mbInBush(e)>0&&!mbInBush(me)&&!see()&&!aimed();   // בשיח, והאויב קרוב אבל בחוץ: נסתר
     put(al,bz.x,bz.y);mbVisNow(true);r.ally=mbSeen(al,0)&&mbSeen(e,1)&&mbVisFade(al)===MBVIS.allyFade;put(al,al.home.x,al.home.y);   // החברים רואים, שקוף למחצה
     put(me,bz.x+4,bz.y);r.same=mbInBush(me)===mbInBush(e)&&see();put(me,bz.x,bz.y+200);   // אותו שיח: רואים
     e.actT=MB.t;r.atk=see();e.actT=MB.t-MBVIS.bushReveal-0.1;r.atk=r.atk&&!see();   // תקף מהשיח: חשוף לשנייה, ואז שוב נסתר
     mbVisReveal(bz.x,bz.y,150,2,0);r.rev=mbSeen(e,0);const t0=MB.t;MB.t+=2.5;r.rev=r.rev&&!see();MB.t=t0;   // חשיפה: רואים לתוך השיח, ונגמרת
     for(const [u,x,y] of iso){u.x=x;u.y=y}if(MB.vis)MB.vis.rev.push(...rvb);
     for(const [h,x,y,d,a,st] of bak){h.x=x;h.y=y;h.dead=d;h.actT=a;h.st.stun=st}mbVisNow(true);o.vis=r}
    // המתנקש (moba-kits.js, 8.11): מכה בגב חזקה, צעד צל נוחת מאחורי המטרה עם מכה מחוזקת, היעלמות שמגדל וחיילים לא מכוונים אליה,
    // סימן מוות שמתפוצץ עם הנזק שנצבר ונטען בהריגה, ניקוי מסיר אותו, ושני החפצים (ניבי הכסף, להב הארס)
    if(MBKIT.assassin){const A={},bak=MB.u,bt=MB.t,rnd=Math.random;try{
      MB.u=bak.filter(u=>u.k==='tower'||u.k==='base');MB.t=400;Math.random=()=>0.99;
      const mk=(k,tm,x)=>{const h=mbHero(k,tm,false,1);h.x=x;h.y=0;h.bot={t:999,skT:999,mode:'push'};MB.u.push(h);return h},K=MBKIT.assassin;
      let a=mk('assassin',0,0),v=mk('hunter',1,40);if(typeof mbVisNow==='function')mbVisNow(true);
      v.face=0;a.atkT=0;let h0=v.hp;mbAttack(a,0,v,K.atk);const bk=h0-v.hp;v.face=Math.PI;a.atkT=0;h0=v.hp;mbAttack(a,0,v,K.atk);A.back=Math.abs(bk/(h0-v.hp)-K.atk.backstab)<0.02;
      a.x=-200;v.hp=v.max;v.face=Math.PI;A.step=mbCast(a,'s1',v)&&a.x>v.x&&!!a.st.step&&!mbCast(mk('assassin',0,0),'s1',{x:9,y:9});
      a.atkT=0;h0=v.hp;mbAttack(a,0,v,K.atk);A.step=A.step&&h0-v.hp>K.atk.dmg*K.atk.backstab&&v.st.slow>0&&!a.st.step;
      MB.u=MB.u.filter(u=>u.k==='tower'||u.k==='base');const tw=MB.u.find(u=>u.k==='tower'&&u.team===1&&Math.abs(u.x)===MOBA.towers[0]);
      a=mk('assassin',0,tw.x-150);const w=mk('warrior',1,tw.x-200);mbCast(a,'s2');for(let i=0;i<8;i++)mobaUpdate(1/30);
      A.veil=a.st.veil>0&&tw.tgt!==a&&mbAutoTarget(w,500)!==a&&mbAimFor(w,{range:500})!==a;
      w.x=a.x+30;w.y=a.y;a.atkT=0;mbAttack(a,0,w,K.atk);A.veil=A.veil&&a.st.veil===0;
      a.lvl=MOBA.ultAt;v=mk('hunter',1,a.x+100);v.st.imm=0;a.cd.ult=0;mbCast(a,'ult',v);mbDmg(a,v,100,'physical');const acc=v.mark&&v.mark.dmg;h0=v.hp;MB.t+=K.ult.t+0.1;mbTick(v,0.01);
      A.mark=acc>90&&h0-v.hp>K.ult.end&&!v.mark;a.cd.s1=5;a.cd.ult=0;mbCast(a,'ult',v);v.hp=5;MB.t+=K.ult.t+0.1;mbTick(v,0.01);A.mark=A.mark&&v.dead&&a.cd.s1===0;
      const c=mk('hunter',1,a.x+60);a.cd.ult=0;mbCast(a,'ult',c);c.spell='cleanse';c.cd.spell=0;Object.assign(c.st,{stun:1});mbSpellCast(c);A.cleanse=!c.mark;
      a.it=['fang','venom'];mbItCalc(a);const m=mk('tank',1,a.x+30);a.atkT=0;mbAttack(a,0,m,K.atk);A.items=mbIb(a).critp===MBITEM.items.fang.critp&&m.st.poison>0&&m.st.burn>0&&MBITEM.build.assassin.every(k=>MBITEM.items[k]);
    }catch(e){A.err=String(e)}MB.u=bak;MB.t=bt;Math.random=rnd;if(typeof mbVisNow==='function')mbVisNow(true);o.sin=A}
    MB.me.bot={t:0,mode:'push'};const casts={},cc={stun:0,taunt:0},cmb={},f={cast:mbCast,cc:mbCC,word:mbWord};
    mbCast=function(u,s,a){const r=f.cast(u,s,a);if(r)casts[MBKIT[u.kit][s].id]=1;return r};
    mbCC=function(t,k,d,b){const r=f.cc(t,k,d,b);if(r&&t.k==='hero')cc[k]++;return r};
    mbWord=function(u,w){cmb[w]=(cmb[w]||0)+1;return f.word(u,w)};
    let n=0;const ultT=new Map();while(!MB.over&&n<MOBA.maxT*30+60){mobaUpdate(1/30);n++;for(const h of MB.u)if(h.k==='hero'&&!h.me&&h.lvl>=MOBA.ultAt&&!ultT.has(h))ultT.set(h,Math.round(MB.t))}
    {const v=[...ultT.values()].sort((a,b)=>a-b),bots=MB.u.filter(h=>h.k==='hero'&&!h.me).length;o.ult1=v[0];o.ultN=v.length;o.ultBots=bots;o.ultMed=v.length*2>bots?v[Math.floor(bots/2)]:undefined}   // החציון של הבוטים: הראשון לבד הוא מקרי (בוט אחד עם הרבה הריגות), החציון יציב   // הסקיל-על הראשון של בוט (MOBA.xp.need)
    mbCast=f.cast;mbCC=f.cc;mbWord=f.word;
    if(spl.f){mbSpellCast=spl.f.c;mbHealCast=spl.f.h;delete spl.f;for(const h of MB.u)if(h.k==='hero'&&!h.me)spl.pick[h.kit+':'+h.spell]=(MBSPELL.bot[h.kit]||[]).includes(h.spell);o.spl=spl}
    const kits=[...new Set(MB.u.filter(u=>u.k==='hero').map(u=>u.kit))];
    o.kits=kits.join(',');o.miss=kits.flatMap(k=>MB_SLOTS.map(s=>MBKIT[k][s].id)).filter(id=>!casts[id]);o.mage=kits.includes('mage');
    o.t=Math.round(MB.t);o.over=MB.over;o.towers=MB.u.filter(u=>u.k==='tower'&&u.dead).length;o.towerSfx=AUDIO.count.tower_fall||0;o.base=MB.u.some(u=>u.k==='base'&&u.dead);
    o.cc=cc;o.cmb=cmb;o.lv=Math.max(...MB.u.filter(u=>u.k==='hero').map(u=>u.lvl));o.score=MB.score.join(':');
    // מסך הסוף ומסך הבנייה יוצאים באמת (הבודק, 7.11: "בית", "שחק שוב" ו-✕ פתחו שוב את מסך הבנייה, והמשחק הישן נשאר ב-S.mb)
    if(typeof mbBuildOpen==='function'){const X={},q=x=>document.querySelector('#mbWin '+x);
      mbEndShow(S.won);q('[data-act="home"]').click();X.home=!S.mb&&!MB&&$('ovMoba').hidden&&!document.body.classList.contains('mb');
      mobaStart('tank');MB.over=true;mbEndShow(true);q('[data-act="again"]').click();X.again=!S.mb&&!MB&&$('mbWin').dataset.mode==='pick'&&!$('ovMoba').hidden;
      q('[data-kit="tank"]').click();X.build=$('mbWin').dataset.mode==='build';q('[data-act="close"]').click();X.bx=$('ovMoba').hidden&&!S.mb;
      mobaOpen();q('[data-kit="tank"]').click();q('[data-bact="back"]').click();q('[data-act="close"]').click();X.px=$('ovMoba').hidden&&!S.mb;
      if(!$('ovStart').hidden)$('ovStart').hidden=true;o.endX=X}
    mobaExit();o.out=!S.mb&&!document.body.classList.contains('mb');if(o.cam)o.cam.back=camZoom()!==MBLOOK.cam.zoom;   // מחוץ למוד: המצלמה הרגילה
  }catch(e){o.err=String(e)+(e.stack?' @ '+(e.stack.split('\n')[1]||'').trim().replace(/^at /,'').replace(/.*\/js\//,'js/'):'')}return o},CFG.lang==='en');
  // המפה הקטנה במשחקי השאול (moba-look.js, אוראל 6.11): במגע אמיתי (CDP), שתי אצבעות. נגיעה מזיזה את המצלמה, גרירה עוקבת, המלבן לפי המצלמה,
  // אחרי שחרור המצלמה נשארת, נגיעה בגיבור שלי / 🎯 / C / ג'ויסטיק מחזירים, והג'ויסטיק עובד בזמן גרירה
  const mmap=await(async()=>{const o={};try{
    const cdp=await page.context().newCDPSession(page),E=(f,a)=>page.evaluate(f,a);
    const touch=async(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(([id,x,y])=>({id,x,y}))});
    await E(()=>{mobaOpen();document.querySelector('#mbWin [data-kit="hunter"]').click();const go=document.querySelector('#mbWin [data-bact="go"]');if(go)go.click();render()});   // go: מסך הבנייה (moba-spells.js)
    const px=(x,y)=>E(([x,y])=>{const l=mbMiniLay();return [l.X(x),l.Y(y)]},[x,y]);
    const st=()=>E(()=>{const g=giantCam(),me=MB.me;for(let i=0;i<20;i++){S.cam.x+=(P.x+giantCam().x-S.cam.x)*0.3;S.cam.y+=(P.y+giantCam().y-S.cam.y)*0.3}   // כמו main.js: המצלמה הולכת אל P + giantCam
      return {x:S.cam.x,y:S.cam.y,free:MBCAM.free,pid:MBCAM.pid,g}});
    const at=(c,x,y,d)=>Math.abs(c.x-x)<(d||30)&&Math.abs(c.y-y)<(d||30);
    let [ax,ay]=await px(1000,200);await touch('touchStart',[[1,ax,ay]]);
    o.tap=await E(()=>({x:S.cam.x,y:S.cam.y,joy:!!joy}));o.tap=at(o.tap,1000,200)&&!o.tap.joy;
    [ax,ay]=await px(-500,-300);await touch('touchMove',[[1,ax,ay]]);o.drag=at(await E(()=>({x:S.cam.x,y:S.cam.y})),-500,-300);
    o.rect=await E(()=>{render();const l=MB_MINI_L,v=l.view;return !!v&&Math.abs(v.x+v.w/2-l.X(S.cam.x))<1&&Math.abs(v.y+v.h/2-l.Y(S.cam.y))<1&&Math.abs(v.w-innerWidth/ZOOM*l.k)<1});
    await touch('touchEnd',[]);{const c=await st();o.stay=at(c,-500,-300)&&c.free&&c.pid===null}
    const [hx,hy]=await px(...await E(()=>[MB.me.x,MB.me.y]));await touch('touchStart',[[2,hx,hy]]);await touch('touchEnd',[]);
    {const c=await st();o.meBack=!c.free&&at(c,...await E(()=>[P.x,P.y]))}
    [ax,ay]=await px(800,0);await touch('touchStart',[[3,ax,ay]]);await touch('touchEnd',[]);await page.keyboard.press('c');o.key=!(await st()).free;
    await touch('touchStart',[[4,ax,ay]]);await touch('touchEnd',[]);const bt=await E(()=>{const b=MB_MINI_L.bt;return [b.x+b.s/2,b.y+b.s/2]});
    await touch('touchStart',[[5,...bt]]);await touch('touchEnd',[]);o.btn=!(await st()).free;
    // ג'ויסטיק אחרי שהמצלמה חופשית: מחזיר לגיבור
    await touch('touchStart',[[6,ax,ay]]);await touch('touchEnd',[]);
    await touch('touchStart',[[7,200,300]]);await touch('touchMove',[[7,140,300]]);o.joyBack=await E(()=>!!joy&&joy.dx<-0.5)&&!(await st()).free;await touch('touchEnd',[]);
    // שתי אצבעות: אחת גוררת על המפה, השנייה מזיזה את הגיבור. המצלמה נשארת על האצבע, והגיבור זז
    [ax,ay]=await px(600,100);await touch('touchStart',[[8,ax,ay]]);await touch('touchStart',[[8,ax,ay],[9,200,300]]);
    const [bx,by]=await px(400,-100);await touch('touchMove',[[8,bx,by],[9,140,300]]);
    o.two=await E(()=>{const me=MB.me,x0=me.x,j=!!joy&&joy.dx<-0.5,p=MBCAM.pid;for(let i=0;i<10;i++){mobaUpdate(1/30);const g=giantCam();S.cam.x+=(P.x+g.x-S.cam.x)*0.3;S.cam.y+=(P.y+g.y-S.cam.y)*0.3}
      return {j,p:p!==null,moved:me.x<x0-5,free:MBCAM.free,x:S.cam.x,y:S.cam.y}});o.two=o.two.j&&o.two.p&&o.two.moved&&o.two.free&&at(o.two,400,-100);
    await touch('touchEnd',[[8,bx,by]]);   // משחררים רק את האצבע שעל המפה (touchEnd עם האצבע הזאת בלבד. touchMove בלעדיה לא משחרר אותה בכרום הזה)
    o.lift=await E(()=>MBCAM.pid===null&&!!joy);o.liftBack=!(await st()).free;await touch('touchEnd',[]);
    await E(()=>{mobaExit()});await cdp.detach();
  }catch(e){o.err=String(e).slice(0,160)}return o})();
  // tank basic attack (mb-atk3d.js, morning package item 1): visual only. Same damage and the same cooldown with the layer on and off,
  // the impact sound on the damage frame, and in 3D: the strike starts on that frame, stops hard at the contact pose, then the ready pose
  const tka=await page.evaluate(()=>{const o={};try{mobaStart('tank');const me=MB.me,A=MBKIT.tank.atk,C=MBATK3D.kit.tank;
      const t=MB.u.find(x=>x.team!==me.team&&x.k==='minion')||MB.u.find(x=>x.team!==me.team&&x.k==='hero');
      const near=()=>{t.x=me.x+me.r+t.r+10;t.y=me.y;t.dead=false;t.hp=t.max=1e9;t.st.shield=0};near();
      const hit=()=>{me.atkT=0;const h=t.hp;mbAttack(me,1/30,t,A);return [Math.round(h-t.hp),me.atkT]};
      const s0=MBATK3D.stat.sounds;const on=hit();o.snd=MBATK3D.stat.sounds-s0;MBATK3D.on=false;near();const off=hit();MBATK3D.on=true;
      o.dmg=on[0];o.same=on[0]===off[0]&&on[1]===off[1];
      if(R3D.on&&R3D.ready&&R3D.player){me.moving=false;me.mvT=0;me.atkT=0;syncPlayer(1/60);near();mbAttack(me,1/30,t,A);syncPlayer(1/60);
        const a=R3D.player,st=a.mbA||{};o.ph=st.ph;o.clip=a.one&&a.one.getClip().name;
        for(let i=0;i<40;i++){me.atkT=Math.max(0,me.atkT-1/60);syncPlayer(1/60)}
        o.stop=st.x?+(st.x.time/st.x.getClip().duration).toFixed(2):null;o.base=a.base;
        o.d3=o.ph==='hit'&&o.clip===C.hit+'@up'&&o.stop===C.to&&o.base===C.ready}else o.d3=true;
      // never pose-locked: in the middle of the strike (and of the hard stop) the tank still casts, moves and strikes again
      me.st.stun=0;me.st.dash=null;me.atkT=0;near();mbAttack(me,1/30,t,A);if(R3D.on&&R3D.ready&&R3D.player)syncPlayer(1/60);
      me.cd.s2=0;me.lvl=10;o.castMid=mbCast(me,'s2',{x:me.x+10,y:me.y});const x0=me.x;mbMove(me,me.x+300,me.y,0.1,0);o.moveMid=me.x>x0;
      const k0=MBATK3D.stat.strikes;me.atkT=0;if(R3D.on&&R3D.ready&&R3D.player)syncPlayer(1/60);near();mbAttack(me,1/30,t,A);if(R3D.on&&R3D.ready&&R3D.player)syncPlayer(1/60);o.reMid=!(R3D.on&&R3D.ready&&R3D.player)||MBATK3D.stat.strikes===k0+1;
    }catch(err){o.err=String(err&&err.stack||err)}
    MBATK3D.on=true;try{mobaExit()}catch(e){}return o});
  check(!tka.err&&tka.dmg>0&&tka.same&&tka.snd===1&&tka.d3&&tka.castMid&&tka.moveMid&&tka.reMid,'underworld tank attack (visual only): '+(tka.err||'damage '+tka.dmg+(tka.same?' and cooldown unchanged by the visuals':' CHANGED by the visuals!')+', impact sound '+(tka.snd===1?'on the damage frame':tka.snd+'×')+
    (tka.ph==null?' (2D: no body)':', strike '+(tka.ph==='hit'&&tka.clip?'on the frame':'missing ('+tka.ph+'/'+tka.clip+')')+', hard stop at '+tka.stop+', then '+tka.base))+', never locked: cast '+(tka.castMid?'✓':'✗')+' move '+(tka.moveMid?'✓':'✗')+' strike again '+(tka.reMid?'✓':'✗'));
  // underworld kit look (mb-kitlook.js): your hero wears the kit's model at the bots' height (tank = barbarian); SAVE.mbOwnLook keeps the personal skin.
  // Only the look: rank and armor never paint the kit model. 2D: nothing to draw
  const kl=await page.evaluate(()=>{const o={},own=SAVE.mbOwnLook;try{
      if(!(R3D.on&&R3D.ready)){o.d2=true;return o}
      o.kits={};for(const k of Object.keys(MBKIT)){mobaStart(k);syncPlayer(1/60);syncPlayer(1/60);const a=R3D.player,B=LOOK3D['mb_'+k];
        o.kits[k]=!B||!m3dNeed(B.model)||a.L.model===(mbPartsLook(B,k)||B).model&&a.L.h===(typeof mbScaleLook==='function'?mbScaleLook(mbPartsLook(B,k)||B):B).h&&Object.values(a.props).some(p=>p.visible)}   // הגובה של הבוטים אחרי כלל הגודל (mb-scale.js, השיפוץ)
      mobaStart('tank');SAVE.mbOwnLook=true;syncPlayer(1/60);o.own=R3D.player.L.model!==LOOK3D.mb_tank.model||!m3dNeed(LOOK3D.mb_tank.model);
      SAVE.mbOwnLook=false;syncPlayer(1/60);o.back=R3D.player.L.mbKit==='tank'||!m3dNeed(LOOK3D.mb_tank.model);
    }catch(e){o.err=String(e&&e.stack||e)}SAVE.mbOwnLook=own;return o});
  check(!kl.err&&(kl.d2||Object.values(kl.kits).every(Boolean)&&kl.own&&kl.back),'underworld kit look: '+(kl.err||(kl.d2?'2D, nothing to draw':
    Object.entries(kl.kits).map(([k,v])=>k+(v?' ✓':' ✗')).join(', ')+', personal skin option '+(kl.own&&kl.back?'✓':'✗'))));
  // home zone (mb-zone.js, morning package 6): an enemy hero inside your base circle loses MOBA.zone.hurt.k of max HP per second in ticks,
  // minions are never punished, allies still heal exactly as before (mbTower), the warning glow grows as you near the enemy circle,
  // and a recall landing flashes your circle gold. Off switch: MOBA.zone.hurt.on=false. Values are untested starting values
  const zn=await page.evaluate(()=>{const o={},Z=MOBA.zone;try{mobaStart('tank');const me=MB.me,b0=MB.u.find(b=>b.k==='base'&&b.team===me.team),b1=MB.u.find(b=>b.k==='base'&&b.team!==me.team);
      MB.t=999;const foe=MB.u.find(u=>u.k==='hero'&&u.team!==me.team),mn=MB.u.find(u=>u.k==='minion'&&u.team!==me.team);
      const put=(u,b,dx)=>{u.x=b.x+dx;u.y=b.y;u.dead=false;u.hp=u.max;u.st.shield=0};
      put(foe,b0,60);const t0=Z.stat.ticks;mbZoneTick(Z.hurt.every);o.lost=1-foe.hp/foe.max;o.maxLoss=Z.hurt.k*Z.hurt.every;o.ticks=Z.stat.ticks-t0;
      put(foe,b0,MOBA.base.healR+40);mbZoneTick(Z.hurt.every);o.outside=foe.hp===foe.max;
      if(mn){put(mn,b0,60);mbZoneTick(Z.hurt.every);o.minion=mn.hp===mn.max}else o.minion=true;
      Z.hurt.on=false;put(foe,b0,60);mbZoneTick(Z.hurt.every);o.off=foe.hp===foe.max;Z.hurt.on=true;
      put(me,b0,60);me.hp=me.max*0.5;mbTower(b0,0.5);o.heal=Math.abs(me.hp/me.max-0.5-MOBA.base.heal*0.5)<0.01;
      put(me,b1,MOBA.base.healR+Z.warn.pad+50);o.w0=mbZoneWarnK();put(me,b1,MOBA.base.healR+Z.warn.pad/2);o.wMid=mbZoneWarnK();put(me,b1,30);o.w1=mbZoneWarnK();
      me.x=b0.x+600;me.y=b0.y;const f0=Z.stat.flash;mbRecallStart(me);for(let i=0;i<400&&me.recall;i++)mbRecallTick(MB,1/60);o.flash=Z.stat.flash===f0+1;
    }catch(e){o.err=String(e&&e.stack||e)}Z.hurt.on=true;return o});
  check(!zn.err&&zn.ticks===1&&zn.lost>0&&zn.lost<=zn.maxLoss+1e-6&&zn.outside&&zn.minion&&zn.off&&zn.heal&&zn.w0===0&&zn.wMid>0&&zn.wMid<1&&zn.w1===1&&zn.flash,
    'underworld home zone: '+(zn.err||[['enemy loses '+Math.round(zn.lost*1000)/10+'% per tick',zn.ticks===1&&zn.lost>0],['outside safe',zn.outside],['minions safe',zn.minion],['switch off',zn.off],['ally heal unchanged',zn.heal],['warning '+zn.w0+'/'+(+zn.wMid).toFixed(2)+'/'+zn.w1,zn.w0===0&&zn.wMid>0&&zn.w1===1],['recall flash',zn.flash]].map(([n,v])=>n+(v?' ✓':' ✗')).join(', ')));
  // hero parts (mb-parts.js, ARI #552): the tank gets the stone hammer in the right hand and the crown on the head, with the barbarian's axe and fur hat hidden,
  // on bots and on your hero (kit look). A bot built before the parts loaded is rebuilt once. Switch: MBPARTS.tank.on. 2D: nothing to draw
  const PARTS=['w_item_stoneHammer','w_item_shadowDagger','w_item_mageCrystal','tankHF','warriorHF','mageHF','assassinHF'];   // lazy models (m3d.js): ask once, wait here
  await page.evaluate(ps=>{if(R3D.on&&R3D.ready)ps.forEach(m3dNeed)},PARTS);await waitPage(ps=>!(R3D.on&&R3D.ready)||ps.every(p=>R3D.props[p]||m3dReady(p)),PARTS);
  const pa=await page.evaluate(()=>{const o={},on=MBPARTS.tank.on,hf=MBTANKHF.on;MBTANKHF.on=false;try{   // the barbarian body (the new body has no axe or fur hat to hide)
      if(!(R3D.on&&R3D.ready)){o.d2=true;return o}
      mobaStart('tank');
      syncPlayer(1/60);syncPlayer(1/60);const a=R3D.player,hid={};a.root.traverse(x=>{if(['2H_Axe','Barbarian_Hat'].includes(x.name))hid[x.name]=x.visible});
      o.me=!!(a.props.sword&&a.props.sword.visible&&a.props.x_crown&&a.props.x_crown.visible)&&Object.keys(hid).length===2&&!Object.values(hid).some(Boolean);
      const bot=MB.u.find(u=>u.k==='hero'&&u.kit==='tank'&&!u.me);
      if(bot){MBPARTS.tank.on=false;R3D.actors.delete(bot);mb3dUnit(bot,1/60);const k0=R3D.actors.get(bot).key;MBPARTS.tank.on=true;const r0=MBPARTS.stat.rebuilt;mb3dUnit(bot,1/60);
        o.bot=MBPARTS.stat.rebuilt===r0+1&&R3D.actors.get(bot).key!==k0&&!!R3D.actors.get(bot).props.hammer}else o.bot=true;
      MBPARTS.use.crown=false;syncPlayer(1/60);{const b=R3D.player;let hat=null;b.root.traverse(x=>{if(x.name==='Barbarian_Hat')hat=x.visible});o.one=!b.props.x_crown&&!!(b.props.sword&&b.props.sword.visible)&&hat===true}MBPARTS.use.crown=true;   // חלק אחד כבוי: הכובע הפרוותי חוזר, הפטיש נשאר
      MBPARTS.tank.on=false;syncPlayer(1/60);o.off=!R3D.player.props.x_crown;
    }catch(e){o.err=String(e&&e.stack||e)}MBPARTS.tank.on=on;MBTANKHF.on=hf;return o});
  check(!pa.err&&(pa.d2||pa.me&&pa.bot&&pa.one&&pa.off),'underworld hero parts: '+(pa.err||(pa.d2?'2D, nothing to draw':[['your tank: hammer + crown, axe and fur hat hidden',pa.me],['bot rebuilt once parts load',pa.bot],['one part off (crown): fur hat back, hammer stays',pa.one],['switch off',pa.off]].map(([n,v])=>n+(v?' ✓':' ✗')).join(', '))));
  // tank stone look (mb-tankstone.js): the barbarian body gets the stone + lava-crack shader, the hammer draws bigger (visual only), and the switch turns both off live
  const tsk=await page.evaluate(()=>{const o={},on=MBTANKSTONE.on,hf=MBTANKHF.on;MBTANKHF.on=false;try{
      if(!(R3D.on&&R3D.ready)){o.d2=true;return o}
      mobaStart('tank');MBTANKSTONE.on=true;syncPlayer(1/60);syncPlayer(1/60);const a=R3D.player;let body=0,ts=0;a.root.traverse(x=>{if(x.isSkinnedMesh){body++;if(x.material.userData.ts)ts++}});
      const h=Object.keys(a.props).find(k=>a.L.props[k]&&a.L.props[k].prop==='w_item_stoneHammer'),m=h&&a.props[h];
      o.body=body>0&&ts===body&&MBTS_U.tsOn.value===1;o.big=!!m&&Math.abs(m.scale.x/m.userData.s0-MBTANKSTONE.hammer)<1e-6;
      const r0=MB.me.r;MBTANKSTONE.on=false;syncPlayer(1/60);o.off=MBTS_U.tsOn.value===0&&!!m&&Math.abs(m.scale.x-m.userData.s0)<1e-6&&MB.me.r===r0;
    }catch(e){o.err=String(e&&e.stack||e)}MBTANKSTONE.on=on;MBTANKHF.on=hf;return o});
  check(!tsk.err&&(tsk.d2||tsk.body&&tsk.big&&tsk.off),'underworld tank stone look: '+(tsk.err||(tsk.d2?'2D, nothing to draw':[['stone + lava cracks on the body',tsk.body],['bigger hammer (draw only)',tsk.big],['switch off',tsk.off]].map(([n,v])=>n+(v?' ✓':' ✗')).join(', '))));
  // the new tank body (ARI #578, tankHF via mb-parts.js, MBTANKHF): on your hero and the bots, every tank clip moves its bones, hammer and crown stay,
  // the stone shader stays off (the body has its own cracks), and the switch brings the barbarian back
  const thf=await page.evaluate(()=>{const o={},hf=MBTANKHF.on;try{
      if(!(R3D.on&&R3D.ready)){o.d2=true;return o}
      MBTANKHF.on=true;mobaStart('tank');syncPlayer(1/60);syncPlayer(1/60);const a=R3D.player;o.me=a.L.model==='tankHF'&&!!(a.props.sword&&a.props.x_crown);
      let st=0;a.root.traverse(x=>{if(x.isSkinnedMesh&&x.material.userData.ts)st++});o.noStone=st===0;
      const bot=MB.u.find(u=>u.k==='hero'&&u.kit==='tank'&&!u.me);if(bot){mb3dUnit(bot,1/60);mb3dUnit(bot,1/60);o.bot=R3D.actors.get(bot).L.model==='tankHF'}else o.bot=true;
      let arm=null;a.root.traverse(n=>{if(!arm&&n.isBone&&/arm|upper/i.test(n.name))arm=n});o.bad=[];
      for(const c of ['Idle_A','Running_B','Death_A','Melee_2H_Attack_Chop@up','Melee_2H_Idle','Jump_Idle','Taunt@up']){const C=R3D.clips[c];if(!C){o.bad.push(c+' missing');continue}
        const x=a.mixer.clipAction(C);a.mixer.stopAllAction();x.reset().play();const q=arm.quaternion.clone();a.mixer.update(0.3);if(arm.quaternion.equals(q))o.bad.push(c);x.stop()}
      MBTANKHF.on=false;syncPlayer(1/60);o.off=R3D.player.L.model==='barbarian';
    }catch(e){o.err=String(e&&e.stack||e)}MBTANKHF.on=hf;return o});
  check(!thf.err&&(thf.d2||thf.me&&thf.bot&&thf.noStone&&!thf.bad.length&&thf.off),'underworld new tank body: '+(thf.err||(thf.d2?'2D, nothing to draw':[['yours, with hammer + crown',thf.me],['bots',thf.bot],['no stone shader on it',thf.noStone],['all 7 tank clips move it'+(thf.bad.length?' ('+thf.bad.join(',')+')':''),!thf.bad.length],['switch: barbarian back',thf.off]].map(([n,v])=>n+(v?' ✓':' ✗')).join(', '))));
  // the new warrior, mage and assassin bodies (ARI #579-#581, mb-parts.js): on your hero, every clip moves them, the overlapping part (mask, circlet) is skipped,
  // the weapons stay, and each switch brings the old body back
  const hf3=await page.evaluate(()=>{const o={},W={warrior:[MBWARHF,'warriorHF','knight'],mage:[MBMAGEHF,'mageHF','mage'],assassin:[MBASNHF,'assassinHF','rogue']};try{
      if(!(R3D.on&&R3D.ready)){o.d2=true;return o}
      for(const k in W){const [sw,hf,old]=W[k],on0=sw.on;sw.on=true;mobaStart(k);syncPlayer(1/60);syncPlayer(1/60);const a=R3D.player,r={};
        r.on=a.L.model===hf&&Object.values(a.props).some(p=>p.visible)&&!a.props.x_mask&&!a.props.x_circlet;
        let arm=null;a.root.traverse(n=>{if(!arm&&n.isBone&&/arm|upper/i.test(n.name))arm=n});r.bad=[];
        for(const c of [a.L.anim.idle,a.L.anim.run,a.L.anim.die,'Spellcasting']){const C=R3D.clips[c];if(!C){r.bad.push(c+'?');continue}const x=a.mixer.clipAction(C);a.mixer.stopAllAction();x.reset().play();const q=arm.quaternion.clone();a.mixer.update(0.3);if(arm.quaternion.equals(q))r.bad.push(c);x.stop()}
        sw.on=false;syncPlayer(1/60);r.off=R3D.player.L.model===old;sw.on=on0;o[k]=r}
    }catch(e){o.err=String(e&&e.stack||e)}return o});
  check(!hf3.err&&(hf3.d2||['warrior','mage','assassin'].every(k=>hf3[k]&&hf3[k].on&&!hf3[k].bad.length&&hf3[k].off)),'underworld new warrior/mage/assassin bodies: '+(hf3.err||(hf3.d2?'2D, nothing to draw':
    ['warrior','mage','assassin'].map(k=>{const r=hf3[k]||{};return k+(r.on?' ✓':' ✗')+(r.bad&&r.bad.length?' (clips '+r.bad.join(',')+')':'')+(r.off?'':' (switch ✗)')}).join(', '))));
  // ARI #556/#557: the assassin's mask and second dagger, the mage's circlet (witch hat hidden) and floating crystal that bobs. 2D: nothing to draw
  const p2=await page.evaluate(()=>{const o={},hf=[MBMAGEHF.on,MBASNHF.on];MBMAGEHF.on=MBASNHF.on=false;try{   // the old bodies: the new ones carry their own mask and circlet
      if(!(R3D.on&&R3D.ready)){o.d2=true;return o}
      const vis=(a,ks)=>ks.every(k=>a.props[k]&&a.props[k].visible);
      mobaStart('assassin');syncPlayer(1/60);syncPlayer(1/60);o.as=vis(R3D.player,['sword','x_mask','x_dagger2']);
      mobaStart('mage');syncPlayer(1/60);syncPlayer(1/60);const a=R3D.player;let hat=null;a.root.traverse(x=>{if(x.name==='Mage_Hat')hat=x.visible});
      o.mg=vis(a,['gun','x_circlet','x_crystal'])&&hat===false;const c=a.props.x_crystal,y0=c.position.y;MB.t+=0.4;syncPlayer(1/60);o.bob=Math.abs(c.position.y-y0)>0.005;
    }catch(e){o.err=String(e&&e.stack||e)}MBMAGEHF.on=hf[0];MBASNHF.on=hf[1];return o});
  check(!p2.err&&(p2.d2||p2.as&&p2.mg&&p2.bob),'underworld assassin and mage parts: '+(p2.err||(p2.d2?'2D, nothing to draw':[['assassin mask + second dagger',p2.as],['mage circlet (hat hidden) + crystal',p2.mg],['crystal bobs',p2.bob]].map(([n,v])=>n+(v?' ✓':' ✗')).join(', '))));
  // hero accents (mb-accent.js, ARI's colours): each hero's weapon glows in its own colour, capped at 1.2, on your hero and the bots;
  // the mage's staff flashes turquoise on the ult; steady (no pulse) in fewer effects. 2D: nothing to draw
  const ac=await page.evaluate(()=>{const o={},fl=SAVE.fxLess;try{
      if(!(R3D.on&&R3D.ready)){o.d2=true;return o}
      const lit=m=>m.emissive.r+m.emissive.g+m.emissive.b>0.05;o.kits={};
      for(const k of Object.keys(MBACC.kit)){mobaStart(k);syncPlayer(1/60);syncPlayer(1/60);const M=mbAccMats(R3D.player,MBACC.kit[k]);o.kits[k]=M.length>0&&M.every(lit)}
      mobaStart('mage');const me=MB.me;me.lvl=10;me.cd.ult=0;mbCast(me,'ult',{x:me.x+50,y:me.y});syncPlayer(1/60);
      const m=mbAccMats(R3D.player,MBACC.kit.mage)[0],u=new THREE.Color(MBACC.kit.mage.ult.col);o.ult=m.emissive.b>m.emissive.r&&Math.abs(m.emissive.g/m.emissive.b-u.g/u.b)<0.1;
      me.accUlt=0;SAVE.fxLess=true;MB.t=1.1;syncPlayer(1/60);const e1=m.emissive.b;MB.t=1.3;syncPlayer(1/60);o.steady=Math.abs(m.emissive.b-e1)<1e-6;
    }catch(e){o.err=String(e&&e.stack||e)}SAVE.fxLess=fl;return o});
  check(!ac.err&&(ac.d2||Object.values(ac.kits).every(Boolean)&&ac.ult&&ac.steady),'underworld hero accents: '+(ac.err||(ac.d2?'2D, nothing to draw':
    Object.entries(ac.kits).map(([k,v])=>k+(v?' ✓':' ✗')).join(', ')+', mage ult flash '+(ac.ult?'✓':'✗')+', steady in fewer effects '+(ac.steady?'✓':'✗'))));
  // tank s1 slow field (moba-kits.js, the one approved mechanic change of the morning package): after the anvil lands, an mbZone the size of the slam
  // slows enemies inside by field.k, refreshed in short steps (so it ends when they walk out), no damage, and the zone ends after field.t
  const anf=await page.evaluate(()=>(()=>{const o={};try{mobaStart('tank');const me=MB.me,s=MBKIT.tank.s1;
  const foes=MB.u.filter(x=>x.team!==me.team&&x.k==='hero'),foe=foes[0],late=foes[1];
  me.lvl=10;me.cd.s1=0;const tx=me.x+150,ty=me.y;for(const f of [foe,late]){f.hp=f.max=1e9;f.st.root=99}
  foe.x=tx+30;foe.y=ty;late.x=tx+600;late.y=ty;
  o.cast=mbCast(me,'s1',{x:tx,y:ty});let landed=-1;
  for(let i=0;i<60&&landed<0;i++){mobaUpdate(1/60);if(!me.st.dash)landed=i}
  me.st.stun=99;let mine=0;const md=mbDmg;mbDmg=function(u){if(u===me)mine++;return md.apply(this,arguments)};o.zone=MB.zones.some(z=>z.look==='anvil');
  const hold=(f,x,n)=>{for(let i=0;i<n;i++){f.x=x;mobaUpdate(1/60)}};
  hold(late,tx+600,30);o.lateBefore=!(late.st.slow>0);   // 0.5s: far away, no slow
  late.st.stun=0;hold(late,tx+20,6);o.lateIn=late.st.slow>0&&late.st.slow<=0.25&&late.st.slowK===s.field.k;   // walked in: 30%, refreshed in small steps
  hold(late,tx+600,16);o.lateOut=!(late.st.slow>0);   // walked out: gone within 0.27s
  for(let i=0;i<120;i++)mobaUpdate(1/60);o.ended=!MB.zones.some(z=>z.look==='anvil');
  mbDmg=md;o.noDmg=mine===0;   // the field never damages (only damage from me counts: the tower near my base shoots)
}catch(e){o.err=String(e&&e.stack||e)}try{mobaExit()}catch(e){}return o})());
  check(!anf.err&&anf.cast&&anf.zone&&anf.lateBefore&&anf.lateIn&&anf.lateOut&&anf.ended&&anf.noDmg,'underworld tank s1 slow field: '+(anf.err||[['zone after landing',anf.zone],['enemy walking in is slowed '+Math.round(100*0.3)+'%',anf.lateIn],['ends when it walks out',anf.lateOut],['no damage',anf.noDmg],['field ends',anf.ended]].map(x=>x[0]+(x[1]?' ✓':' ✗')).join(', ')));
  // tank s1 body (mb-anvil3d.js, morning package 2, visual only): jump pose and arc in the air, the hammer chop hard-stops on the landing frame, a 14% squash,
  // and the landing frame and damage are identical with the visual on or off
  const an=await page.evaluate(()=>{const o={},on=MBANVIL.on,rnd0=Math.random;try{
      const rnd=Math.random,run=v=>{let sd=7;Math.random=()=>(sd=sd*16807%2147483647)/2147483647;MBANVIL.on=v;mobaStart('tank');const me=MB.me;me.lvl=10;me.cd.s1=0;S.mode='play';
        const foe=MB.u.find(u=>u.k==='hero'&&u.team!==me.team);for(const u of MB.u)if(u!==me&&u!==foe&&u.k!=='base'&&u.k!=='tower'){u.x=me.x+5000;u.y=me.y;u.st.stun=99}foe.x=me.x+250;foe.y=me.y;foe.hp=foe.max=1e6;foe.st.root=99;foe.st.stun=99;
        const d3=R3D.on&&R3D.ready;if(d3)syncPlayer(1/60);const y0=d3&&R3D.player.root.position.y;mbCast(me,'s1',{x:me.x+250,y:me.y});
        let land=-1,maxY=0,air='',clip=null,sq=1,hit=0;
        for(let i=0;i<40;i++){const h0=foe.hp;mobaUpdate(1/60);if(d3){syncPlayer(1/60);const a=R3D.player,dy=a.root.position.y-y0;if(dy>maxY){maxY=dy;air=a.base}}
          if(land<0&&!me.st.dash){land=i;hit=Math.round(h0-foe.hp);if(d3){syncPlayer(1/60);clip=R3D.player.one&&R3D.player.one.getClip().name;sq=R3D.player.root.scale.y/R3D.player.root.scale.x}}}
        Math.random=rnd;return {land,dmg:hit,maxY,air,clip,sq,d3}};
      const a=run(true),b=run(false);o.same=a.land===b.land&&a.dmg===b.dmg&&a.dmg>0;o.land=a.land;o.dmg=a.dmg;
      o.d3=a.d3;o.body=!a.d3||a.maxY>10&&a.air===MBANVIL.air&&a.clip===MBANVIL.land.clip+'@up'&&a.sq<0.95;o.off=!b.d3||b.maxY<1;
    }catch(e){o.err=String(e&&e.stack||e)}MBANVIL.on=on;if(typeof rnd0==='function')Math.random=rnd0;return o});
  check(!an.err&&an.same&&an.body&&an.off,'underworld tank s1 body (visual only): '+(an.err||'landing frame '+an.land+' and damage '+an.dmg+(an.same?' same with the body on or off ✓':' CHANGED ✗')+
    (an.d3?', jump arc + chop on landing + squash '+(an.body?'✓':'✗')+', off = flat '+(an.off?'✓':'✗'):' (2D: no body)')));
  // tank taunt and iron wall bodies (mb-tankskill3d.js, morning package 3+4, visual only): the roar plays on the cast frame with cry_war and a heat glow while the
  // shield lasts; the wall chop hard-stops at contact and holds, with imp_wall; never locked (moves mid-animation). 2D: sounds only
  const tkb=await page.evaluate(()=>{const o={};try{mobaStart('tank');const me=MB.me;me.lvl=10;S.mode='play';const d3=R3D.on&&R3D.ready&&R3D.player;
      if(d3)syncPlayer(1/60);const s0=MBTANK3D.stat.sounds;me.cd.s2=0;mbCast(me,'s2',{x:me.x,y:me.y});
      if(d3){syncPlayer(1/60);o.roar=R3D.player.one&&R3D.player.one.getClip().name===MBTANK3D.taunt.clip+'@up';for(let i=0;i<6;i++){mobaUpdate(1/60);syncPlayer(1/60)}o.heat=R3D.player.mats.some(m=>m.emissive.r>0.1)}
      me.cd.ult=0;mbCast(me,'ult',{x:me.x+100,y:me.y});
      if(d3){syncPlayer(1/60);for(let i=0;i<12;i++)syncPlayer(1/60);const st=R3D.player.tk3;o.hold=st.ph==='hold'&&+(st.x.time/st.x.getClip().duration).toFixed(2)===MBTANK3D.wall.to}
      o.snd=MBTANK3D.stat.sounds-s0;const x0=me.x;mbMove(me,me.x+300,me.y,0.1,0);o.move=me.x>x0;o.d3=!!d3;
    }catch(e){o.err=String(e&&e.stack||e)}return o});
  check(!tkb.err&&tkb.snd===2&&tkb.move&&(!tkb.d3||tkb.roar&&tkb.heat&&tkb.hold),'underworld tank taunt + iron wall bodies (visual only): '+(tkb.err||'sounds on the cast frame '+(tkb.snd===2?'✓':'✗ ('+tkb.snd+')')+', moves mid-animation '+(tkb.move?'✓':'✗')+
    (tkb.d3?', roar '+(tkb.roar?'✓':'✗')+', heat glow '+(tkb.heat?'✓':'✗')+', wall chop holds at contact '+(tkb.hold?'✓':'✗'):' (2D: no body)')));
  /* ניסוי הטנק החדש (mb-tankx.js, ?tankx=1) וקפיצות חיית המחמד (petx.js, ?petx=1): שניהם כבויים כברירת מחדל, ונבדקים רק בתוך הניסוי.
     הטנק: אותו משחק פעמיים (seed קבוע), פעם עם הגוף החדש ופעם בלי. הלוגיקה זהה (רגעי התקיפה, החיים והמיקומים), הגוף החדש מנגן
     אנימציות מתוקנות (ערוצי המיקום מוכפלים ביחס אורך העצמות), העצמות זזות, תוקף תוך כדי תנועה, מהבהב בפגיעה, נופל במוות, ומתג באמצע משחק בונה מחדש.
     עד שהקבצים של ARI נכנסים, הגוף הוא תחליף: הברברי עם עצמות ירכיים ורגליים ארוכות פי 1.5, כדי לבדוק את כל הדרך */
  /* הציור עצמו מושך מספרים אקראיים (כ-260 ב-900 פריימים, גם בלי הניסוי), ולכן הוא רץ על מקור אקראי נפרד, כדי שרק הלוגיקה תושווה */
  const txT=await (async()=>{const E=(f,a)=>page.evaluate(f,a),o={};
    try{o.def=await E(()=>MBTANKX.on===false&&PETX.on===false);o.d3=await E(()=>!!(R3D.on&&R3D.ready));if(!o.d3)return o;
      o.real=await E(()=>m3dLazy(MBTANKX.model));
      if(o.real){await E(()=>{m3dGo(MBTANKX.model);if(MBTANKX.hammer&&m3dLazy(MBTANKX.hammer.prop))m3dGo(MBTANKX.hammer.prop)});
        for(let i=0;i<120&&!(await E(()=>m3dReady(MBTANKX.model)&&m3dReady(MBTANKX.hammer.prop)));i++)await page.clock.runFor(100);
        o.load=await E(()=>M3D.log.filter(l=>l.k===MBTANKX.model||l.k===MBTANKX.hammer.prop).map(l=>l.k+' '+l.ms+'ms').join(', '))}
      else await E(()=>{const r=R3D.tmpl[MBTANKX.ref],t=THREE.SkeletonUtils.clone(r);t.userData=Object.assign({},r.userData);
        t.traverse(b=>{if(b.isBone&&/^(hips|upperleg)/.test(b.name))b.position.multiplyScalar(1.5)});R3D.tmpl.__tx=t;MBTANKX._m0=MBTANKX.model;MBTANKX.model='__tx'});
      Object.assign(o,await E(()=>{const X=MBTANKX,rnd=Math.random,out={},sv0=JSON.stringify(SAVE),seed=s=>{let x=s;Math.random=()=>(x=(x*16807)%2147483647)/2147483647};
        const tkOf=()=>MB.u.find(u=>u.k==='hero'&&u.kit===X.kit&&!u.me);
        const game=(on,s)=>{SAVE=JSON.parse(sv0);seed(s);X.on=on;mobaStart('warrior');MB.me.bot={t:0,mode:'push'};const tk=tkOf();if(!tk){mobaExit();return null}
          const snap=()=>MB.u.map(u=>[u.x,u.y,u.hp,u.atkT,u.dead,u.flash,u.rot,u.face,u.cd&&u.cd.s1,u.cd&&u.cd.s2].join()).join('|');
          const r={dirty:0,atk:[],moveAtk:0,tx:0,comp:0,bones:new Set(),fams:'',flash:false,die:null,toggle:null};let pa=tk.atkT;
          for(let i=0;i<900&&!MB.over;i++){const x0=tk.x,y0=tk.y;mobaUpdate(1/30);if(tk.atkT>pa+0.05)r.atk.push(i);pa=tk.atkT;
            if(i===300)tk.flash=1;
            if(!tk.dead){const s0=snap(),R0=Math.random;Math.random=rnd;try{syncEnemy(tk,1/30)}finally{Math.random=R0}if(snap()!==s0)r.dirty++;const a=R3D.actors.get(tk);
              if(a&&on){const R1=Math.random;Math.random=rnd;try{if(a.L.tx)r.tx++;const b=a.base&&act(a,a.base);if(b&&b.getClip()!==R3D.clips[a.base])r.comp++;
                const h=bone(a.root,'upperarmr')||bone(a.root,'hips');if(h&&i%15===0)r.bones.add(h.quaternion.toArray().map(v=>v.toFixed(2)).join());
                const one=a.one&&a.one.isRunning()?a.one.getClip().name:'';if(/Attack|Chop|Slice/.test(one)&&Math.hypot(tk.x-x0,tk.y-y0)>0.5)r.moveAtk++;
                if(i===300)r.flash=a.mats.some(m=>m.emissive.r>0.5)&&a.mats.every(m=>!m.userData.txF||m.userData.txF.value===1)}finally{Math.random=R1}}}
            if(i===300)tk.flash=0}
          r.hash=MB.u.map(u=>[u.kit||u.k,Math.round(u.hp),Math.round(u.x),Math.round(u.y)].join(':')).join('|');
          if(on){const a=R3D.actors.get(tk);
            if(a){const L=a.L,fp=[],at=MBMOVE.atk[tk.kit];a.mixer.stopAllAction();a.one=null;a.base=null;   // תנוחת הפטיש: עמידה, ריצה ותקיפה, אחת אחת
              loop(a,L.anim.idle);tankxCarry(a);fp.push(a.fam);loop(a,L.anim.run);tankxCarry(a);fp.push(a.fam);once(a,R3D.clips[at+'@up']?at+'@up':at,0.4);a.mixer.update(0.05);tankxCarry(a);fp.push(a.fam);r.fams=fp.join('/');
              const h=bone(a.root,'hips'),q0=h&&h.quaternion.clone();once(a,L.anim.die,1.2,true);a.mixer.update(0.6);tankxCarry(a);r.dieFam=a.fam;
              const d=a.one&&a.one.getClip(),tr=d&&d.tracks.find(t=>t.name==='hips.position'),t0=R3D.clips[L.anim.die].tracks.find(t=>t.name==='hips.position');
              r.die={moved:!!h&&h.quaternion.angleTo(q0)>0.05,ratio:tr&&t0?+(tr.values[1]/t0.values[1]).toFixed(3):null};
              a.one=null;a.mixer.stopAllAction();
              X.on=false;tk.dead=false;syncEnemy(tk,1/30);const off=R3D.actors.get(tk);X.on=true;syncEnemy(tk,1/30);const back=R3D.actors.get(tk);
              r.toggle={off:!!off&&off.L.model===X.ref,back:!!back&&!!back.L.tx}}}
          mobaExit();return r};
        try{let s=0,A=null;for(let k=1;k<40&&!s;k++){seed(k);mobaStart('warrior');if(tkOf())s=k;mobaExit()}
          // המשחק הראשון אחרי הפתיחה תמיד שונה מכל השאר (גם בלי הניסוי), ולכן משחק חימום לפני ההשוואה
          if(s){game(false,s);A=game(true,s)}
          if(A){const B=game(false,s),C=game(false,s);out.same=!!B&&A.hash===B.hash&&A.atk.join()===B.atk.join();out.offoff=!!C&&B.hash===C.hash&&B.atk.join()===C.atk.join();out.dirty=A.dirty+(B?B.dirty:0);out.atkN=A.atk.length;out.tx=A.tx;out.comp=A.comp;out.bones=A.bones.size;
            out.moveAtk=A.moveAtk;out.flash=A.flash;out.die=A.die;out.toggle=A.toggle;out.seed=s;out.fams=A.fams;out.dieFam=A.dieFam}else out.err='no tank bot';
          // הצעד בריצה: כמה הרגל עולה (ביחס לגובה הגוף), וכמה מהר היא זזה כשהיא על הרצפה מול מהירות הקרקע. הגוף החדש מול הברברי
          const gait=L=>{const a=makeActor(L);a.root.position.set(0,0,0);a.root.rotation.set(0,0,0);const H=L.h/COSB(),x=act(a,L.anim.run);a.mixer.stopAllAction();x.reset().setLoop(THREE.LoopRepeat).play();
            const D=x.getClip().duration,N=120,b=bone(a.root,'footl'),pts=[];if(!b){freeActor(a);return null}
            for(let i=0;i<=N;i++){a.mixer.setTime(D*i/N);a.root.updateMatrixWorld(true);pts.push(b.getWorldPosition(new THREE.Vector3()))}
            const ys=pts.map(v=>v.y),lo=Math.min(...ys),bd=0.03*H;let sp=0,n=0;for(let i=1;i<pts.length;i++)if(pts[i].y<lo+bd&&pts[i-1].y<lo+bd){sp+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z)/(D/N);n++}
            a.mixer.stopAllAction();freeActor(a);return {lift:+((Math.max(...ys)-lo)/H).toFixed(3),slide:+(sp/Math.max(1,n)/MBMOVE.run).toFixed(2)}};   // slide: מהירות הרגל במגע מול מהירות הקרקע (1 = בלי החלקה)
          X.on=true;const LX=tankxLook();X.on=false;out.gait={kk:gait(LOOK3D.mb_tank),tx:LX&&gait(LX)};
          // אתה כטנק: אותו גוף על הגיבור שלך, עם הפטיש במקום הנשק מקרוב. ובלי הניסוי: הדמות שלך
          SAVE=JSON.parse(sv0);seed(1);X.on=true;mobaStart('tank');Math.random=rnd;syncPlayer(1/30);syncPlayer(1/30);{const a=R3D.player;out.me={model:a&&a.L.model,sword:!!(a&&a.props.sword&&a.props.sword.visible),fam:a&&a.fam||null}}
          X.on=false;syncPlayer(1/30);out.meOff=R3D.player&&R3D.player.L.model;mobaExit();
          out.h=X.stat.h;out.size=X.size;out.clamp=X.stat.clamp;
          out.fac=X.stat.fac;out.clips=X.stat.clips;out.gaitN=X.stat.gait;out.tracks=X.stat.tracks;out.rebuilt=X.stat.rebuilt;out.hammer=!!R3D.props[X.hammer.prop]}
        catch(e){out.err=String(e&&e.stack||e).slice(0,200)}
        Math.random=rnd;X.on=false;SAVE=JSON.parse(sv0);if(X._m0){X.model=X._m0;delete X._m0;delete R3D.tmpl.__tx;X._f=null;X._L=null}if(S.mb)mobaExit();return out}));
      /* חיית המחמד: אותו מסלול פעמיים (זזה 1.5 שניות, עומדת 1.5), עם הקפיצות ובלי. המיקום שלה זהה (המעקב לא השתנה),
         בתנועה הגוף קופץ ונמעך בגבולות המפרט, ובעמידה חוזר לגודל ולזווית הרגילים, עם נשימה קטנה */
      const pk=await E(()=>{const L=LOOK3D['pet_'+(SAVE.pet.kind||PET.default)+(SAVE.pet.stage+1)];if(L)m3dNeed(L.model);return L&&L.model});
      if(pk)for(let i=0;i<80&&!(await E(k=>m3dReady(k),pk));i++)await page.clock.runFor(100);
      o.pet=await E(()=>{const bak=JSON.stringify(SAVE),vil=!!S.vil,mode=S.mode,rnd=Math.random,r={};
        const path=on=>{let x=7;Math.random=()=>(x=(x*16807)%2147483647)/2147483647;PETX.on=on;Object.assign(PETX.stat,{frames:0,hops:0,maxLift:0,minSy:9,maxSy:0});
          enterWorld('home');enemies=[];S.pet=null;P.x=0;P.y=0;P.face=0;petUpdate(1/60);const pos=[];let idle=null;
          for(let i=0;i<180;i++){const mv=i<90;P.x+=mv?185/60:0;P.moving=mv;P.speed=185;enemies=[];if(S.wd)S.wd.scentT=999;if(S.pet)S.pet.digT=999;
            petUpdate(1/60);syncPet(1/60);if(S.pet)pos.push(Math.round(S.pet.x)+','+Math.round(S.pet.y))}
          const a=R3D.pet;if(a&&a.root.visible){const t=R3D.tmpl[a.L.model],sc0=a.L.h/COSB()/t.userData.h;idle={sy:+(a.root.scale.y/sc0).toFixed(3),sx:+(a.root.scale.x/sc0).toFixed(3),rz:+a.root.rotation.z.toFixed(3),w:a.px?+a.px.w.toFixed(2):null}}
          return {pos:pos.join(';'),idle,vis:!!(a&&a.root.visible),st:Object.assign({},PETX.stat)}};
        try{const A=path(true),B=path(false);r.same=A.pos===B.pos&&A.pos.length>0;r.vis=A.vis;r.idle=A.idle;r.hops=A.st.hops;r.lift=+A.st.maxLift.toFixed(3);r.sy=[+A.st.minSy.toFixed(3),+A.st.maxSy.toFixed(3)];
          r.offIdle=B.idle}catch(e){r.err=String(e&&e.stack||e).slice(0,200)}
        PETX.on=false;Math.random=rnd;SAVE=JSON.parse(bak);if(vil)enterVillage();else{reset();S.mode=mode}return r});
    }catch(e){o.err=String(e).slice(0,200)}return o})();
  // צילומי משחקי השאול (QUINN, 8.11): חלון הבחירה, מסך הבנייה, משחק באמצע (כולם בוטים, 40 שניות), החנות ומסך הסוף, כדי לבדוק את החלון כולו
  // הגיבור: האחרון ב-MBKIT, כך שגיבור חדש מצולם לבד. תקלה כאן לא מפילה את הבדיקה, רק נכתבת
  if(CFG.shots){try{const E=(f,a)=>page.evaluate(f,a),k=await E(()=>Object.keys(MBKIT).pop());
    await E(()=>{mobaOpen();render()});await page.clock.runFor(200);await shot('moba-pick');
    await E(k=>{const b=document.querySelector('#mbWin [data-kit="'+k+'"]');if(b)b.click()},k);await page.clock.runFor(200);
    if(await E(()=>$('mbWin').dataset.mode==='build'))await shot('moba-build');
    await E(k=>{const go=document.querySelector('#mbWin [data-bact="go"]');if(go)go.click();if(!S.mb)mobaStart(k);
      MB.me.bot={t:0,mode:'push'};for(let i=0;i<1200&&!MB.over;i++)mobaUpdate(1/30);S.cam.x=P.x;S.cam.y=P.y;render()},k);
    await page.clock.runFor(400);await shot('moba-game');
    await E(()=>{MB.me.gold=3000;mbShopOpen();render()});await page.clock.runFor(200);await shot('moba-shop');
    await E(()=>{mbShopClose();MB.over=true;mbEndShow(true);render()});await page.clock.runFor(200);await shot('moba-end');
    await E(()=>mobaExit());
  }catch(e){console.log('  ⚠ צילומי משחקי השאול: '+String(e).slice(0,140))}}
  // שלל לפי דמות (LOOT.gear ב-loot.js): לכל דמות רוב הנשקים בעולם שלה, יש לה נשק בכל שכבה, ה"מזל" מבטיח נשק שלה, וברמה 20 השכבה גבוהה יותר
  const clsL=await page.evaluate(()=>{const bak=JSON.stringify(SAVE.hero),cp=SAVE.clsPity,out={};
    try{for(const c in HEROES.list){const A=HEROES.list[c].arms;SAVE.hero.start=c;let w=0,m=0,t1=0,t20=0;
      const tiers=new Set(Object.keys(GEAR.items).filter(id=>A.includes(GEAR.items[id].w)).map(id=>GEAR.items[id].tier));
      SAVE.hero.level=1;for(let i=0;i<600;i++){const it=gItem(lootRoll());t1+=it.tier;if(it.slot==='weapon'){w++;if(A.includes(it.w))m++}}
      SAVE.hero.level=20;for(let i=0;i<600;i++)t20+=gItem(lootRoll()).tier;
      SAVE.clsPity=LOOT.gear.cls.pity;const p=gItem(lootRoll());
      out[c]={share:Math.round(m/Math.max(1,w)*100),all:tiers.size===GEAR.tiers.length,pity:A.includes(p.w)&&SAVE.clsPity===0,up:t20>t1*1.5}}}catch(e){out.err=e.message}
    SAVE.hero=JSON.parse(bak);SAVE.clsPity=cp;return out});
  await page.evaluate(()=>window.__rkScan&&__rkScan()).catch(()=>{});const rawKeys=await page.evaluate(()=>(window.__rk||{hits:[]}).hits).catch(()=>['(לא נקרא)']);   // מפתחות גולמיים: נבדק בסוף הדוח
  // שמירה ישנה: משאב ששמו השתנה (RES.renamed, ore→iron) עובר גם במה שמחכה באיסוף במבנה (SAVE.prod), ולא נאסף לתרמיל כמשאב שלא מופיע בשום מקום (ביקורת 9.11)
  const rmOk=await page.evaluate(()=>{const sv={bag:{ore:2,iron:1},stash:{ore:3},prod:{mine:{t:1,have:{ore:12.4,stone:1}},x:{t:1}}};resMigrate(sv);
     return sv.bag.iron===3&&!('ore' in sv.bag)&&sv.stash.iron===3&&!('ore' in sv.stash)&&Math.abs(sv.prod.mine.have.iron-12.4)<1e-9&&!('ore' in sv.prod.mine.have)&&sv.prod.mine.have.stone===1});
  // Arena new skills (js/arena-new.js, ARENA-B, preview only): OFF by default (no bar, no state, every wrapper a no-op), and with the flag on every one of the
  // eight casts, shows its effect, deals damage, ends, and respects its cooldown. Gravitas pulls foes (only here), Skyblade nicks and sticks, Phoenix burns a trail.
  {const an=await page.evaluate(()=>{
    if(typeof ARN==='undefined')return {err:'no ARN'};
    const o={off:{on:ARN.on,bar:!!document.querySelector('.arnbar'),state:ARN.s,cast:null},sk:{}};
    try{const de=R3D.drawEvery;
      reset();S.mode='play';enemies.length=0;o.off.cast=ARN.use('meteor');   // flag off: refuses
      arnEnable(true);
      const run=(id,frames)=>{startRun();P.x=P.y=0;P.aim=0;enemies.length=0;S.nextBoss=1e9;
        for(let i=0;i<24;i++){const a=i*2.399,d=120+((i*37)%220),e=addEnemy('grunt',Math.cos(a)*d,Math.sin(a)*d);e.elite=false;e.speed=0.4;e.hp=e.max=1e6;e.shoot=99}
        for(let i=0;i<4;i++){const a=i*1.57,e=addEnemy('grunt',Math.cos(a)*75,Math.sin(a)*75);e.elite=false;e.speed=0.4;e.hp=e.max=1e6;e.shoot=99}
        S.t=5;const r={ok:ARN.use(id),again:null,h0:ARN.stat.hits,fx:0,end:-1,hit:-1,px:P.x,py:P.y,clip:P.skCast&&P.skCast.k,pull0:ARN.stat.pulled,nick0:ARN.stat.nicks,st0:ARN.stat.stuck};
        r.again=ARN.use(id);const c0={};
        for(let f=0;f<frames;f++){P.hp=P.maxHp;P.inv=9;update(1/60);render();const n=ARN.s?ARN.s.fx.length:0;r.fx=Math.max(r.fx,n);if(r.hit<0&&ARN.stat.hits>r.h0)r.hit=f/60;if(n===0&&r.end<0){r.end=f/60;break}}
        r.dx=P.x-r.px;r.pulled=ARN.stat.pulled-r.pull0;r.nicks=ARN.stat.nicks-r.nick0;r.stuck=ARN.stat.stuck-r.st0;r.hits=ARN.stat.hits-r.h0;r.cd=(ARN.s.cd[id]||0)>S.t;return r};
      for(const id of ARN.order)o.sk[id]=run(id,60*8);
      o.bar=!!document.querySelector('.arnbar')&&document.querySelectorAll('.arnb').length===8;
      arnEnable(false);o.after={on:ARN.on,hidden:ARN.bar.hidden,state:ARN.s,cast:ARN.use('moon')};
      enemies.length=0;R3D.drawEvery=de}catch(e){o.err=String(e)}
    return o});
    const sk=an.sk||{},ids=Object.keys(sk),bad=ids.filter(id=>!(sk[id].ok&&sk[id].again===false&&sk[id].fx>0&&sk[id].hit>=0&&sk[id].end>0&&sk[id].cd)),
      extra=ids.length===8&&sk.rift.pulled>0&&sk.blade.nicks>0&&sk.blade.stuck===3&&sk.phoenix.dx>150&&sk.phoenix.hits>0&&sk.moon.hit>=1.4&&sk.arrows.hits>0;
    check(!an.err&&an.off&&an.off.on===false&&!an.off.bar&&an.off.state==null&&an.off.cast===false&&an.bar&&ids.length===8&&!bad.length&&extra&&an.after.on===false&&an.after.hidden&&an.after.cast===false,
      'Arena new skills (preview, ?arenanew=1): '+(an.err||[an.off.on===false&&!an.off.bar?'off by default: no bar, no cast':'NOT OFF by default',an.bar?'8 buttons':'no buttons',
        ids.map(id=>id+' '+(sk[id].ok?'cast':'no cast')+(sk[id].hits?', '+sk[id].hits+' hits':', no hits')+(sk[id].end>0?', ends '+sk[id].end.toFixed(1)+'s':', never ends')).join(' · '),
        bad.length?'failed: '+bad.join(','):'',extra?'rift pulls, blades nick and stick, phoenix dashes and burns, moon lands on time':'special behaviour missing',an.after&&an.after.on===false&&an.after.cast===false?'switch off again':'does not switch off'].filter(Boolean).join(' · ')));}
  await browser.close();

  const t=s=>s==null?'-':Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
  {const E=L.early||{};check(E.act>=1&&E.act<=2&&!E.daily&&!E.ach&&E.ch&&E.gift,'שחקן חדש: '+E.act+' משימות ('+E.ids+')'+(E.daily||E.ach?', '+E.daily+' יומיים ו-'+E.ach+' הישגים לפני הפנס':', בלי יומיים והישגים')+
    (E.ch?', בלי אתגר יומי לפני פרק 1':', האתגר היומי פתוח לפני פרק 1')+(E.gift?', מתנת הפתיחה מחכה לסוף השיחה':', מתנת הפתיחה נכתבת על השיחה'))}
  check(L.heroCards===3&&L.heroStart==='warrior'&&L.heroW==='oakSword'&&L.heroVil,'דמות התחלה: '+(L.heroCards||0)+' כרטיסים, '+(L.heroStart==='warrior'?'נבחר לוחם ונשמר':'הבחירה לא נשמרה')+
    ', נשק: '+(L.heroW||'-')+(L.heroVil?', ומשם לכפר':', לא נכנס לכפר'));
  check(L.heroHp===heroHp,'פסיבית בריצה: הלוחם קיבל +'+L.heroHp+' חיים (צפוי +'+heroHp+')');
  check(again,'בחירת דמות: '+(again?'לא חוזרת במשחק השני':'הופיעה שוב'));
  {const o=txT,pt=o.pet||{},T=o.real?'הגוף החדש':'תחליף (הקבצים של ARI עוד לא נכנסו)';
    const tk=!o.d3||(o.dirty===0&&(o.same||!o.offoff)&&o.tx>0&&o.comp>0&&o.bones>=3&&o.moveAtk>0&&o.flash&&o.die&&o.die.moved&&o.toggle&&o.toggle.off&&o.toggle.back&&o.fac&&o.tracks>0&&(!o.real||o.gait&&o.gait.tx&&o.gait.kk&&o.gait.tx.lift<=o.gait.kk.lift*1.5&&o.gait.tx.slide>=o.gait.kk.slide*0.8&&o.gait.tx.slide<=1.1&&o.me&&o.me.model==='tankX'&&o.me.sword&&o.meOff!=='tankX'&&o.h&&o.h.now<=o.h.old*(o.size+0.02)&&!!o.clamp&&!!o.clamp.Death_A)&&(!o.hammer||o.fams==='idle/run/attack'&&o.dieFam==='attack')&&!o.err);
    const pe=!o.d3||(pt.vis&&pt.same&&pt.hops>=2&&pt.lift>0.08&&pt.lift<=0.125&&pt.sy[0]>=0.87&&pt.sy[1]<=1.14&&pt.idle&&Math.abs(pt.idle.sy-1)<=0.025&&Math.abs(pt.idle.sx-1)<0.01&&Math.abs(pt.idle.rz)<0.01&&!pt.err);
    check(o.def&&tk&&pe,'ניסוי הטנק והחיה (?tankx=1, ?petx=1): '+(o.def?'כבויים כברירת מחדל':'דולקים בלי לבקש')+(!o.d3?', בדו-ממד אין מה לבדוק':
      ', טנק ('+T+(o.load?', נטען '+o.load:'')+'): '+(o.err||(o.dirty===0?'הציור לא נוגע במצב המשחק (900 פריימים)':'הציור שינה את מצב המשחק '+o.dirty+' פעמים!')+(o.same?', אותו משחק בדיוק עם ובלי':o.offoff?', המשחק השתנה!':', המשחק לא חוזר על עצמו גם בלי הניסוי (לא קשור לניסוי)')+', '+o.atkN+' תקיפות, '+o.tx+' פריימים בגוף החדש, '+o.comp+' באנימציה מתוקנת'+
        ', צעד בריצה (גובה ביחס לגוף, ומהירות במגע מול הקרקע): '+(o.gait?JSON.stringify(o.gait.tx)+' מול הברברי '+JSON.stringify(o.gait.kk):'-')+', '+o.clips+' אנימציות ו-'+o.tracks+' ערוצים תוקנו (יחס '+JSON.stringify(o.fac)+')'+', '+o.bones+' תנוחות שונות, '+o.moveAtk+' פריימים של תקיפה בתנועה'+(o.flash?', מהבהב':', לא מהבהב')+
        (o.die?', מוות '+(o.die.moved?'זז':'לא זז')+' (יחס הירכיים '+o.die.ratio+')':', אין מוות')+(o.toggle?', מתג: '+(o.toggle.off?'חוזר לטנק הרגיל':'לא חוזר')+' ו'+(o.toggle.back?'שוב לחדש':'לא חוזר לחדש'):'')+(o.h?', גובה '+o.h.now+' מול '+o.h.old+' (בלי תיקון '+o.h.raw+', ירד לרצפה '+o.h.lo+')'+(o.clamp&&o.clamp.Death_A?', מוות בלי ריחוף ('+o.clamp.Death_A.keys+'/'+o.clamp.Death_A.of+' פריימים ירדו)':', מוות בלי תיקון ריחוף')+(o.clamp&&o.clamp.Running_B?', ריצה בלי שקיעה ('+o.clamp.Running_B.keys+'/'+o.clamp.Running_B.of+' פריימים עלו)':''):'')+(o.me?', אתה כטנק: '+o.me.model+(o.me.sword?' עם פטיש':' בלי פטיש')+', ובלי הניסוי '+o.meOff:'')+(o.hammer?', עם פטיש (תנוחות '+o.fams+', במוות '+o.dieFam+')':', בלי פטיש (עוד לא נכנס)'))+
      ', חיה: '+(pt.err||(!pt.vis?'לא נראית':(pt.same?'אותו מסלול':'המסלול השתנה!')+', '+pt.hops+' קפיצות, גובה עד '+pt.lift+', מעיכה '+(pt.sy||[]).join('..')+', בעמידה '+JSON.stringify(pt.idle)))))}
  for(const nm in uiR){const {v,w}=uiR[nm],all=[...Object.entries(v.wins),...Object.entries(w.wins)],bad=[...v.bad,...w.bad],off=[...v.off,...w.off];
    check(!bad.length&&!off.length&&v.n>3&&w.n>3&&v.panel&&w.gateAuto===false&&w.goBtn&&v.who&&w.who&&w.mini&&w.miniOpen&&v.res<=2&&w.res<=2&&v.more&&v.cards>0&&v.tradeBack&&(nm!=='land'||v.cols===2)&&all.every(x=>x[1]==='ok')&&v.esc&&v.backdrop&&v.tapOut,
      'ממשק, '+(nm==='port'?'טלפון עומד 412×915':'לרוחב 844×390')+': '+(bad.length?'נוגעים זה בזה: '+bad.join(', '):'הפס העליון והסרגל לא נוגעים')+(off.length?', מחוץ למסך: '+off.join(', '):'')+
      (v.who&&w.who?', רמה וחיים בפינה':', אין "מי אני"')+(w.mini?(w.miniOpen?', מפה קטנה פותחת את המפה':', המפה הקטנה לא פותחת'):', אין מפה קטנה')+', '+Math.max(v.res,w.res)+' משאבים למעלה'+(w.gateAuto?', כרטיס השער נפתח לבד':w.goBtn?', שער: עיגול שנכנס בלחיצה':', אין עיגול ליד השער')+(v.more?', "+N" לשאר התרמיל':', אין "+N"')+', '+v.cards+' כרטיסים במסחר'+(v.cols===2?' בשני טורים':'')+(v.tradeBack?', ✕ חוזר לשוק':', ✕ לא חזר לשוק')+' · יציאה: '+all.map(x=>x[0]+(x[1]==='ok'?' ✕':' '+x[1])).join(', ')+
      (v.esc?', Esc':', Esc לא סוגר')+(v.backdrop?', רקע':', רקע לא סוגר')+(v.tapOut?', נגיעה במשחק':', נגיעה במשחק לא סוגרת יומן'))}
  if(uiNoScroll){const n=uiNoScroll;check(n.stv&&!n.gear.length&&!n.cut.length&&n.cols>=4&&!n.npc&&n.pager,'חלונות בלי גלילה, לרוחב: '+(n.gear.length?'הציוד נגלל ('+n.gear.join(', ')+')':'הציוד ודף הדמות נכנסים')+
    (n.stv?'':', דף הדמות לא נפתח')+(n.cut.length?', טקסט חתוך: '+n.cut.join(' | '):'')+', התרמיל '+n.cols+' בשורה'+
    (n.npc?', השיחה נגללת ('+n.npc+')':', השיחה נכנסת')+(n.pager?', קווסט אחד בכל פעם':', כמה קווסטים יחד'))}
  for(const nm in uiR){const b=[...new Set([...uiR[nm].v.big.map(x=>'כפר '+x),...uiR[nm].w.big.map(x=>'עולם '+x)])];   // אזהרה, לא כישלון (plan-hud.md)
    results.push((b.length?'⚠ ':'· ')+'גודל ממשק, '+(nm==='port'?'טלפון עומד':'לרוחב')+': '+(b.length?'גדול מהגבול: '+b.join(', '):'הכל בתוך הגבולות'))}
  for(const nm in uiMenu){const {vm,wm}=uiMenu[nm],d=(m,p)=>p+': '+(m.btn?'☰':'אין ☰')+(m.open?'':' לא נפתח')+', '+m.tabs+'/'+m.want+' לשוניות'+(m.small.length?' קטנות: '+m.small.join(','):'')+(m.out.length?' מחוץ למסך: '+m.out.join(','):'')+
      ' ['+m.seen+']'+(m.xClose?', ✕':', ✕ לא סוגר')+(m.esc?', Esc':', Esc לא סוגר')+(m.bg?', רקע':', רקע לא סוגר')+(m.dot?', נקודה בטור':', אין נקודה בטור (או שהיא על ☰)')+(m.nav?'':', בסרגל יש כפתור שלא שייך למקום')+
      ', טור '+m.rail+'/'+m.railWant+(m.railBad.length?' (קטן, בחוץ או על כפתור: '+m.railBad.join(',')+')':'')+(m.railOpen.length?' (לא נפתח: '+m.railOpen.join(',')+')':'')+(m.setOnly?', ☰ = הגדרות':', ☰ לא פותח הגדרות')+(m.topBad.length?', שורה עליונה: '+m.topBad.join(','):'')+(m.feedTop?'':', ההאכלה לא במקום')+(m.rankBad.length?', היררכיה: '+m.rankBad.join(' · '):', היררכיה')+(m.useCap?'':', השימוש מזיז יותר מדי');
    check(vm.ok&&wm.ok,'תפריט ראשי, '+(nm==='port'?'טלפון עומד 412×915':'לרוחב 844×390')+': '+d(vm,'כפר')+' · '+d(wm,'עולם'))}
  check(gd.vil&&gd.vilGate&&gd.lantern&&gd.toWarden&&gd.lakeBack&&gd.jump==='earth'&&gd.claim&&gd.changed&&gd.min&&gd.log&&gd.arena,'מטרה ברורה: '+(gd.vil?'בכפר "'+gd.txt+'" '+gd.dist:'אין שורה בכפר')+(gd.vilGate?', החץ לשער':', החץ לא לשער')+
    (gd.lantern?', בעולם לפנס':', לא לפנס')+(gd.toWarden?', שומר ליד: המרחק אליו':', שומר ליד: עדיין לפנס')+(gd.lakeBack?', מהאגם לשער חזרה':', מהאגם לא לשער')+(gd.jump==='earth'?', ו"קפוץ" לפנס האדמה':', בלי "קפוץ" ('+gd.jump+')')+(gd.claim?', לפרס':', לא לפרס')+(gd.changed?', אחר כך: "'+gd.after+'"':', המטרה לא התחלפה')+
    (gd.min?', מתכווצת':', לא מתכווצת')+(gd.log?', נגיעה פותחת יומן עם "עכשיו"':', נגיעה לא פותחת יומן עם "עכשיו"')+(gd.arena?', בזירה מוסתרת':', מופיעה בזירה'));
  check(Object.values(gdHit).every(v=>v===''),'מטרה ברורה, מקום השורה: '+Object.entries(gdHit).map(([k,v])=>k+' '+(v||'פנוי')).join(', '));
  for(const nm in uiWel){const u=uiWel[nm];check(u.fit&&u.btn,'בזמן שלא היית, '+(nm==='port'?'טלפון עומד 412×915':'לרוחב 844×390')+': '+(u.fit?'החלון כולו בתוך המסך':'החלון יוצא מהמסך')+(u.btn?', והכפתור "אסוף הכל" נראה':', והכפתור "אסוף הכל" לא נראה'))}
  const sty=L.style||{};
  check(sty.t_run>0&&sty.kills>0&&(sty.dmg_sword||0)+(sty.dmg_gun||0)>0,'סגנון משחק: '+(Object.keys(sty).map(k=>k+' '+sty[k]).join(', ')||'לא נספר'));
  check(L.vilOpen&&L.gift&&L.gift!=='{}'&&(L.vilModels==null||L.vilModels>0),'כפר: נפתח אחרי מסך הפתיחה, מתנת פתיחה '+L.gift+(L.vilModels!=null?', '+L.vilModels+' מודלים בתלת-ממד':''));
  check(L.topBar&&L.topBar.split('/')[0]===L.topBar.split('/')[1]&&L.topMax,'פס עליון בכפר: '+L.topBar+' משאבים (מטבעות וחומרי בנייה בלבד), לכל היותר 4 בפס והשאר ב-"+N"');
  check(L.nodes>0&&!!L.nodeGot&&L.nodeInLoot,'מקורות משאבים: '+(L.nodeSeen!=null?'הופיע '+t(L.nodeSeen):'לא הופיע')+', נשברו '+(L.nodes||0)+(L.nodeAt!=null?' (ראשון '+t(L.nodeAt)+')':'')+
    ', נפל: '+(L.nodeGot||'כלום')+(L.nodeInLoot?', בשלל של הריצה':', לא הגיע לשלל'));
  const dr=(L.drops||'0/0/0/0/0').split('/').map(Number);
  check(dr[0]>0&&L.firstKills>0,'שלל לפי דרגה: '+['רגיל','לא שכיח','נדיר','אפי','אגדי'].map((n,i)=>n+' '+dr[i]).join(', ')+
    ' · עלית '+L.elites+', פיצוץ שלל '+L.jackpots+', הריגה ראשונה '+L.firstKills+', תיבות '+(L.chests||0)+', יצורי משאבים: '+(L.creatures||'לא הופלו')+', מפלצות: '+(L.monsters||'לא הופלו'));
  check(L.built===1&&L.builtSaved&&L.fx,'בנייה: '+(L.panel||'הפאנל לא נפתח')+', '+(L.built===1?'נבנתה, שולם '+L.paid:'לא נבנתה')+(L.builtSaved?', נשמר':', לא נשמר')+(L.fx?', חגיגה עם פיגום':', בלי חגיגה'));
  {const Tu=L.tour||{seen:[],sign:[]};
    const nB=Tu.n||6;check(Tu.seen.length===nB&&Tu.sign.length===nB,'כפר גדול: ביקור בכל המבנים, '+Tu.seen.length+'/'+nB+' הגיעו'+(Tu.stuck?' (נתקע בדרך ל-'+Tu.stuck+')':'')+', שלט על המסך ליד '+Tu.sign.length+'/'+nB+(Tu.sec!=null?', '+Tu.sec+' שניות':''))}
  check(L.passNoPanel===true&&!!L.enterBtn&&L.tapOpen===true,'מבנים בנגיעה: '+(L.passNoPanel?'עוברים ליד מבנה בלי שנפתח חלון':'הפאנל נפתח לבד')+', '+
    (L.enterBtn?'"'+L.enterBtn+'" בסרגל פותח את הפאנל':'אין כפתור "להיכנס"')+', '+(L.tapOpen?'נגיעה במחסן פותחת אותו':'נגיעה במבנה לא פתחה'));
  check(L.collected>0&&L.collected===L.expect,'ייצור: אחרי שעתיים בלי לשחק נאספו '+L.collected+' עץ (צפוי '+L.expect+')');
  check(L.gearOpen&&L.gearEquip==='oakBow'&&L.gearSaved&&L.gearFx===L.gearBetter&&L.gearClosed&&/\+10%/.test(L.gearCmp||''),'ציוד: '+(L.gearOpen?'המסך נפתח':'המסך לא נפתח')+', השוואה: "'+(L.gearCmp||'-')+'"'+
    (L.gearEquip==='oakBow'?', נלבשה קשת עץ':', לא נלבשה')+(L.gearSaved?', נשמר':', לא נשמר')+(L.gearFx?', חגיגה':', בלי חגיגה')+(L.gearBetter?' (שיפור)':' (לא שיפור)')+(L.gearClosed?', נסגר':', לא נסגר'));
  check(L.gearDrag&&L.gearSaved&&L.gearBad,'גרירה בציוד: '+(L.gearDrag?'קשת נגררה למשבצת הנשק ונלבשה':'הגרירה לא הלבישה')+(L.gearSaved?' ונשמרה':', לא נשמר')+
    (L.gearBad?', קשת למשבצת אקססוריז נדחתה ברעידה':L.gearBad==null?', הגרירה האסורה לא נבדקה':', גרירה אסורה התקבלה'));
  const A=L.age||{};
  check(L.ageOpen&&A.up&&A.down&&A.pity&&A.gem&&A.saved&&L.ageClosed,'Aging: '+(L.ageOpen?'הנפחייה נפתחה, '+(A.odds||'בלי סיכוי'):'הנפחייה לא נפתחה')+
    (A.up?', הצלחה: '+A.name+', נזק קשת '+A.dmg:', הצלחה לא עבדה')+(A.down?', כישלון הוריד רמה':', כישלון לא הוריד')+(A.pity?'':', המזל הרך לא התאפס')+
    (A.gem?', אבן חן הגנה':', אבן חן לא הגנה')+(A.saved?', נשמר':', לא נשמר')+(L.ageClosed?'':', לא נסגר'));
  const W=L.pow||{};
  check(W.tab&&W.roll&&W.line&&W.out&&W.in&&W.saved,'כוחות: '+(W.tab?'הלשונית נפתחה':'הלשונית לא נפתחה')+(W.roll?', שלל עם כוח':', שלל בלי כוח')+(W.out?', הוצאה':', לא הוצא')+
    (W.in?', הוטבע (נזק מרחוק '+W.dmg+')':', לא הוטבע ('+(W.dmg||'')+')')+(W.saved?', נשמר':', לא נשמר'));
  const U=L.fuse||{};
  check(U.tab&&U.same&&U.ok&&U.cost&&U.out3==='cometOrb'&&U.fail&&U.saved,'התכה: '+(U.tab?'הלשונית נפתחה, '+(U.odds||'בלי סיכוי')+' '+(U.out||'?'):'הלשונית לא נפתחה')+(U.same?'':', חסימה לא עובדת')+
    (U.ok?', הצליחה':', לא הצליחה')+(U.cost?', שולם':', מחיר שגוי')+(U.fail?', כישלון לקח משאב וחפץ':', כישלון לא עבד')+(U.saved?', נשמר':', לא נשמר'));
  check(U.bar==='star,gem,coins'&&U.barAgeOk,'הפס העליון בהתכה: '+(U.bar||'ריק')+(U.barAgeOk?', ובשדרוג קצר ('+(U.barAge||'ריק')+')':', בשדרוג לא קצר ('+U.barAge+')'));
  const FC=U.crowd||{};
  check(FC.tile&&FC.go&&FC.h<60&&FC.more&&FC.need&&FC.all,'נפחייה עם הרבה משאבים: '+(FC.tile&&FC.go?'הפריטים וכפתור השדרוג בתוך המסך':'פריט '+(FC.tile?'נראה':'מחוץ למסך')+', כפתור '+(FC.go?'נראה':'מחוץ למסך'))+', הפס בגובה '+FC.h+'px'+(FC.more?'':', בלי +N')+(FC.need?'':', חסר מחיר בפס')+(FC.all?'':', +N לא פתח הכל'));
  const G=L.glow||{};
  check(G.hand&&G.trail>1&&G.parts>0,'זוהר Aging ב-+10: '+(G.hand?'שובל '+G.trail+' נקודות, '+G.parts+' חלקיקים':'לא נמצא הנשק'));
  check(L.gearW==='gun'&&L.gearDmg===gx,'ציוד בריצה: מתחיל עם '+(L.gearW==='gun'?'קשת':L.gearW)+', נזק קשת x'+L.gearDmg+' (צפוי x'+gx+')');
  check(L.won==null||!!L.gearLoot,'שלל ציוד: '+(L.gearLoot||'לא נפל')+(L.won!=null?' (בוס = פריט בטוח)':''));
  const st=L.stash||{};
  check(L.stashLv===1&&st.swIn&&st.wTap&&st.wIn&&st.swOut&&st.saved,'מחסן: '+(L.stashLv===1?'נבנה':'לא נבנה')+(st.swIn?', חרב נכנסה':', חרב לא נכנסה')+(st.wTap?', נגיעה העבירה '+st.move+' עץ':', נגיעה לא העבירה')+(st.wIn?', לחיצה ארוכה את כל העץ':', עץ לא נכנס')+
    (st.swOut?', חרב חזרה לתרמיל':', חרב לא חזרה')+(st.saved?', נשמר':', לא נשמר')+' ('+st.used+' מתוך '+st.cap+')');
  check(L.rgOpen&&L.rgPaused&&L.rgHp===rgHp&&L.rgSaved&&L.rgClosed,'ציוד באמצע ריצה: '+(L.rgOpen?'נפתח':'לא נפתח')+(L.rgPaused?', המשחק עצר':', המשחק לא עצר')+
    ', חיים +'+L.rgHp+' (צפוי +'+rgHp+')'+(L.rgSaved?', נשמר':', לא נשמר')+(L.rgClosed?', ממשיכים לשחק':', לא נסגר'));
  const WN=L.wn||{};
  check(WN.found&&WN.saved&&WN.fx&&!WN.metBefore&&!WN.markBefore&&WN.mark==='!'&&WN.btn&&!WN.auto&&WN.open&&WN.got&&!WN.inLogNew&&WN.ready&&WN.closed&&WN.markReady==='✓'&&!WN.logClaim&&WN.claimed&&WN.paid&&WN.claimSaved&&WN.claimFx&&WN.hidden,
    'דמויות בעולם: '+(WN.err?WN.err+' · ':'')+(WN.n||0)+' באחו, הלך אל '+(WN.id||'-')+(WN.found?', נמצאה'+(WN.saved?' ונשמרה':' (לא נשמרה)')+(WN.fx?' עם חגיגה':' בלי חגיגה'):', לא נמצאה')+(WN.markBefore?', היה סימן לפני שנמצאה':'')+
    ', סימן '+(WN.mark||'אין')+(WN.btn?', כפתור "'+WN.btn+'"':', אין כפתור')+(WN.auto?', השיחה נפתחה לבד':'')+(WN.open?', שיחה: "'+(WN.say||'').slice(0,40)+'"':', השיחה לא נפתחה')+
    (WN.got?', התקבל '+WN.q:', לא התקבל')+(WN.inLogNew?', מופיע לקבלה ביומן (לא אמור)':'')+(WN.ready?', הושלם':', לא הושלם')+', סימן '+(WN.markReady||'אין')+(WN.logClaim?', פרס ביומן (לא אמור)':'')+
    (WN.claimed?', פרס נלקח אצלה'+(WN.paid?' והגיע לתרמיל':' אבל לא הגיע')+(WN.claimSaved?', נשמר':', לא נשמר')+(WN.claimFx?', חגיגה':', בלי חגיגה'):', הפרס לא נלקח')+(WN.hidden?'':', דמות שלא נמצאה כבר נותנת קווסט'));
  const FI=L.fish||{};
  check(FI.btn&&FI.bite&&FI.reel&&FI.caught&&FI.saved&&FI.book&&FI.count===1,'דיג: '+(FI.err?FI.err+' · ':'')+(FI.btn?'כפתור "'+FI.btn+'" ליד הבריכה':'אין כפתור ליד המים')+(FI.bite?', נשיכה (!)':', אין נשיכה')+(FI.reel?', פס עם מחוג':', בלי פס')+
    (FI.caught?', נתפס '+FI.caught+' אחרי '+FI.tries+' הטלות ו-'+FI.t+' שניות'+(FI.saved?', בתרמיל ונשמר':', לא נשמר')+(FI.book?', בספר':', לא בספר'):', לא נתפס דג'));
  check(fc.lakeSpot&&fc.lakeBtn&&fc.lakeFish,'דיג באגם: '+(fc.lakeErr?fc.lakeErr+' · ':'')+(fc.lakeSpot?'מקום ליד שפת המים':'אין מקום לדוג ליד המים')+(fc.lakeBtn?', כפתור':', בלי כפתור')+(fc.lakeFish?', נתפס דג מהאגם':', לא נתפס דג'));
  check(fc.quest&&fc.cookBtn&&fc.taken&&fc.meal==='stew'&&fc.on&&fc.off&&fc.noBtn,'דיג: '+(fc.quest?'קווסט הדייג סופר דגים':'הקווסט לא סופר')+(fc.cookBtn?', הפונדקאית מבשלת':', אין כפתור בישול')+(fc.taken?' (הדגים נלקחו)':' (הדגים לא נלקחו)')+
    (fc.on?', החיזוק חל בעולם':', החיזוק לא חל')+(fc.off?' ונגמר בזמן':' ולא נגמר')+(fc.noBtn?', בלי מים אין כפתור':', הכפתור מופיע רחוק מהמים'));
  const Nn=L.npc||{};
  check(Nn.btn&&!Nn.auto&&Nn.open&&Nn.got&&Nn.after&&Nn.inLog&&Nn.closed&&Nn.push===0&&Nn.free&&Nn.waved&&Nn.cheer,'תושבים: '+(Nn.err||Nn.n+' בכפר')+
    (Nn.waved?', הנפח נופף':', לא נופף')+(Nn.btn?', כפתור "'+Nn.btn+'"':', אין כפתור')+(Nn.auto?', השיחה נפתחה לבד':'')+(Nn.open?', שיחה: "'+(Nn.say||'').slice(0,50)+'"':', השיחה לא נפתחה')+
    (Nn.got?', התקבל '+Nn.qid+(Nn.after?'':' (הכרטיס לא התעדכן)'):', לא התקבל קווסט')+(Nn.inLog?', מופיע ביומן':', לא ביומן')+(Nn.closed?'':', השיחה לא נסגרה')+
    (Nn.push===0?', לא חוסמים':', דוחפים '+Nn.push+'px')+(Nn.free?'':', מישהו על הדרך או בתוך מבנה')+(Nn.cheer?', מריע לשדרוג':', לא מריע לשדרוג'));
  check(L.gateNoRun&&L.gateBtn&&L.wEnter,'שער הכפר: '+(L.gateNoRun?'מעבר בשער לא מוציא מהכפר':'יצא בלי לחיצה')+', '+(L.wEnter?'לחיצה על "'+L.gateBtn+'" מוציאה לעולם':'לחיצה לא הוציאה לעולם'));
  {const T=L.wTerr;check(!!T&&!T.bad.length&&!T.un.length&&T.river&&T.bridge&&T.ford<1,'מפת האחו: '+(T?T.size+', נבנתה ב-'+T.ms+'ms, '+(T.bad.length?'בתוך מים/יער: '+T.bad.join(', '):'אף מקום לא בתוך מים או יער')+', '+(T.un.length?'אין דרך אל: '+T.un.join(', '):'כל '+T.n+' המקומות נגישים מהשער')+(T.river?', הנהר חוסם':', הנהר לא חוסם!')+(T.bridge?', הגשר פתוח':', הגשר חסום!')+', המעבר הרדוד ×'+T.ford.toFixed(2)+', '+T.lazy+' קבוצות רחוקות ממתינות':'לא נבנתה'))}
  {const T=L.wStorm;check(!!T&&!T.bad.length&&!T.un.length&&T.river&&T.bridge&&T.stones<1&&T.wall&&T.gate&&T.tower&&T.towerFree,'מפת הסערה: '+(T?'נבנתה ב-'+T.ms+'ms, '+(T.bad.length?'בתוך חסימה: '+T.bad.join(', '):'אף מקום לא בתוך חסימה')+', '+(T.un.length?'אין דרך אל: '+T.un.join(', '):'כל '+T.n+' המקומות נגישים מהשער')+(T.river?', הנהר חוסם':', הנהר לא חוסם!')+(T.bridge?', הגשר פתוח':', הגשר חסום!')+', מעבר האבנים ×'+T.stones.toFixed(2)+(T.wall?', החומה חוסמת':', החומה לא חוסמת!')+(T.gate?', השער פתוח':', השער חסום!')+(T.tower?', המגדלים חוסמים':', המגדל לא חוסם!')+(T.towerFree?'':', משהו נופל על מגדל!'):'לא נבדקה'))}
  {const T=L.wLake;check(!!T&&!T.bad.length&&!T.un.length&&T.lake&&T.isle&&T.swamp<1,'מפת האגם: '+(T?'נבנתה ב-'+T.ms+'ms, '+(T.bad.length?'בתוך מים: '+T.bad.join(', '):'אף מקום לא בתוך מים')+', '+(T.un.length?'אין דרך אל: '+T.un.join(', '):'כל '+T.n+' המקומות נגישים מהשער')+(T.lake?', האגם חוסם':', האגם לא חוסם!')+(T.isle?', האי פתוח':', האי חסום!')+', הביצה ×'+T.swamp.toFixed(2):'לא נבדקה'))}
  {const T=L.wRidge;check(!!T&&!T.bad.length&&!T.un.length&&T.crag&&T.gap,'מפת הרכס: '+(T?'נבנתה ב-'+T.ms+'ms, '+(T.bad.length?'בתוך צוק/סדק: '+T.bad.join(', '):'אף מקום לא בתוך צוק או סדק')+', '+(T.un.length?'אין דרך אל: '+T.un.join(', '):'כל '+T.n+' המקומות נגישים מהשער')+(T.crag?', הגוש חוסם':', הגוש לא חוסם!')+(T.gap?', החריץ חוסם והגשר פתוח':', החריץ או הגשר לא תקינים!'):'לא נבדקה'))}
  {const T=L.wShadow;check(!!T&&!T.bad.length&&!T.un.length&&T.abyss&&T.bone&&T.rocks&&T.wood,'מפת הצל: '+(T?'נבנתה ב-'+T.ms+'ms, '+(T.bad.length?'בתוך תהום/יער: '+T.bad.join(', '):'אף מקום לא בתוך התהום או היער')+', '+(T.un.length?'אין דרך אל: '+T.un.join(', '):'כל '+T.n+' המקומות נגישים מהשער (גם השער לעומק)')+(T.abyss?', התהום חוסמת':', התהום לא חוסמת!')+(T.bone?', גשר העצם פתוח':', גשר העצם חסום!')+(T.rocks?', השפות והאי של הסלעים המרחפים פנויים':', השפות של הסלעים חסומות!')+(T.wood?', היער חוסם':', היער לא חוסם!'):'לא נבדקה'))}
  {const T=L.dTerr;check(!!T&&!T.bad.length&&!T.un.length&&T.mesa&&T.lava&&T.canyon&&T.cut&&T.dune<1,'מפת המדבר: '+(T?'נבנתה ב-'+T.ms+'ms, '+(T.bad.length?'בתוך מסה/לבה: '+T.bad.join(', '):'אף מקום לא בתוך מסה או לבה')+', '+(T.un.length?'אין דרך אל: '+T.un.join(', '):'כל '+T.n+' המקומות נגישים מהשער')+(T.mesa?', המסה חוסמת':', המסה לא חוסמת!')+(T.lava?', הלבה חוסמת':', הלבה לא חוסמת!')+(T.canyon?', הקניון פתוח':', הקניון חסום!')+(T.cut?', יש דרך בנקיק':', הנקיק חסום!')+', הדיונות ×'+T.dune.toFixed(2):'לא נבנתה'))}
  check(L.wEnter&&L.wHud&&!!L.wName&&L.wNodes>0&&L.wFoes>0,'עולם פתוח: '+(L.wName||'בלי שם אזור')+(L.wHud?', ממשק העולם מוצג':', ממשק העולם חסר')+', '+L.wNodes+' מקורות משאבים, '+L.wFoes+' אויבים'+(L.wCreatures?' ('+L.wCreatures+' יצורי משאבים)':' (יצורי משאבים יגיעו עם הכלכלה)'));
  check(L.wGather>0&&L.wGatherSaved,'איסוף בעולם: '+(L.wGather?'עץ +'+L.wGather+' נכנס לתרמיל אחרי '+L.wGatherT+' שניות'+(L.wGatherSaved?', נשמר':', לא נשמר'):'לא נאסף')+(L.wQuest?' · קווסט '+L.wQuest:''));
  check(!!L.wKill,'אויב בעולם: '+(L.wKill?'הופל '+L.wKill:'לא הופל'));
  const WS=L.wStart||{};
  check(WS.easy&&!!L.wLeash&&+L.wLeash.split('→')[1]<+L.wLeash.split('→')[0]&&L.wFoeBack!=null,'מפלצות ליד השער: '+(WS.n||0)+(WS.easy?' קלות (נזק '+WS.dmg+')':' לא קלות')+
    (L.wLeash?', חוזרות הביתה ('+L.wLeash+')':', לא נבדק שחוזרות')+(L.wFoeBack!=null?', קבוצה שהופלה חזרה אחרי '+L.wFoeBack+' שניות':', קבוצה שהופלה לא חזרה'));
  const DA=JSON.parse(L.dropsArena||'{}');
  check(L.wDropGround&&L.wPicked>0&&DA.spawned>0&&DA.picked>0,'שלל על הרצפה: '+(L.wDropGround?'עץ נפל לרצפה לפני התרמיל':'נכנס לתרמיל בלי להיראות')+', בעולם נאספו '+(L.wPicked||0)+' בהליכה'+
    ' · בזירה נפלו '+(DA.spawned||0)+', נאספו בהליכה '+(DA.picked||0)+', ובסוף לבד '+(DA.auto||0));
  check(L.wArena&&L.wGateAuto===false&&!!L.wGoBtn&&L.wBack!=null&&L.wBack<200,'שער לזירה: '+(L.wGateAuto?'כרטיס נפתח לבד':L.wGoBtn?'ליד השער רק עיגול "'+L.wGoBtn+'"':'אין עיגול ליד השער')+', '+(L.wArena?'לחיצה אחת מתחילה ריצה':'לחיצה על העיגול לא נכנסה לזירה')+(L.wBack!=null?', בסוף חזר לשער ('+L.wBack+' פיקסלים ממנו)':', לא חזר לעולם'));
  check(L.back!=null&&!!L.lootGot&&L.lootSaved,'שלל: '+(L.won!=null?'ניצחון '+t(L.won):L.died!=null?'נפל '+t(L.died):'הריצה לא נגמרה')+
    (L.back!=null?', חזר לשער. במסך: '+L.lootTxt+' · בתרמיל: '+(L.lootGot||'כלום')+(L.lootSaved?', נשמר':', לא נשמר'):''));
  const D=L.wDeath||{};
  check(D.over&&D.res&&D.items&&D.stash&&D.saved&&L.wRespawn&&!!L.wDeathTxt,'מוות בעולם: '+(D.over?'נפל':'לא נפל')+(D.res?', חצי מכל משאב אבד':', המשאבים לא נחתכו בחצי')+(D.items?', הפריטים נשארו':', פריט אבד')+
    (D.stash?', המחסן שלם':', המחסן השתנה')+(D.saved?', נשמר':', לא נשמר')+(L.wRespawn?', קם בכפר':', לא קם בכפר')+' ('+(D.txt||'-')+') · במסך: '+(L.wDeathTxt||'-'));
  check(L.qAccepted&&L.qClaimed&&L.qPaid&&L.qSaved&&L.qFx,'קווסט: '+(L.qAccepted?'התקבל '+L.qName+' מהיומן ('+L.qLogTxt+', '+L.qDaily+' יומיים)':'לא התקבל')+
    ', בזירה '+(L.qProg??0)+(L.qReadyAt!=null?', הושלם '+t(L.qReadyAt):', לא הושלם')+(L.qTrack?' · מעקב: '+L.qTrack:'')+
    (L.qClaimed?', פרס נלקח '+L.qReward+(L.qPaid?' והגיע לתרמיל':' אבל לא הגיע לתרמיל')+(L.qSaved?', נשמר':', לא נשמר')+(L.qFx?', חגיגה':', בלי חגיגה'):', הפרס לא נלקח'));
  const F=L.face||{};
  check(F.n>20&&!F.bad&&F.arena>0&&!F.bad3,'כיוון הגוף: '+F.n+' בדיקות בהליכה ('+F.arena+' בזירה עם אויב קרוב), '+(F.bad?F.bad+' לא פנו לכיוון ההליכה (עד '+F.max+' רדיאנים, האחרון: '+F.where+')':'תמיד פונה לאן שהולכים')+
    (F.n3?', בתלת-ממד '+(F.bad3?F.bad3+' מתוך '+F.n3+' לא פנו':F.n3+' בדיקות תקינות'):''));
  const Bt=L.boots||{};
  check(L.bootsAcc&&Bt.claimed&&Bt.worn&&Bt.saved&&Math.abs(Bt.k-Bt.want)<0.002,'נעליים: '+(L.bootsAcc?'קווסט התקבל מראש הכפר':'הקווסט לא התקבל')+', עץ בעולם '+(L.bootsProg??0)+'/5'+
    (Bt.claimed?', פרס נלקח':', הפרס לא נלקח')+(Bt.worn?', נלבשו מיד':', לא נלבשו')+(Bt.saved?', נשמר':', לא נשמר')+', מהירות x'+Bt.k+' (צפוי x'+Bt.want+')');
  // לפני השינוי (ניר, משחק ראשון בטלפון): 2007 פיקסלים במהירות 165, כלומר 12.2 שניות של הליכה רק כדי להגיע לזירה.
  // האחו הגדול (ניר, 5.11.2026: "משהו שלוקח זמן להגיע מקצה לקצה"): שערי הזירה בעומק המפה, אז הגבול עכשיו 20 שניות בקו ישר. אבני המסע (ת10) יקצרו
  const ws=L.walkPx/L.walkSp,wb=Bt.sp?L.walkPx/Bt.sp:null;
  check(ws<20,'הליכה מהכפר לשער הזירה: '+L.walkPx+' פיקסלים, '+ws.toFixed(1)+' שניות'+(wb?', עם נעליים '+wb.toFixed(1):'')+' (גבול: 20 שניות. במפה הקטנה: 2007 פיקסלים, 12.2 שניות)');
  check(L.levels>0,'עליית רמה ובחירת שדרוג: '+L.levels+' פעמים, הגיע לרמה '+L.level);
  check(L.swapBtn&&(L.nHeld>1?L.swaps>0:L.swaps===0),'כפתור החלפת נשק: '+(L.nHeld>1?L.swaps+' החלפות בין '+L.nHeld+' נשקים':(L.swapBtn?'מוסתר, כי יש נשק אחד ביד':'מוצג עם נשק אחד')));
  // כל דמות עם הנשק שלה: לוחם מניף, צייד יורה חצים, קוסם יורה קסם (WEAPONS ב-weapons.js)
  const MW=heroes.mageWorld;delete heroes.mageWorld;
  check(MW.node==='bolt'&&MW.nodeHit&&MW.foe==='bolt'&&MW.foeHit,'קוסם בעולם: מקור משאבים '+(MW.node==='bolt'?'בקסם':'ב-'+MW.node)+(MW.nodeHit?' ונפגע':' ולא נפגע')+
    ', '+MW.ft+' '+(MW.foe==='bolt'?'בקסם':'ב-'+MW.foe)+(MW.foeHit?' ונפגע':' ולא נפגע'));
  for(const id in heroes){const h=heroes[id],want={warrior:'swing',hunter:'arrow',mage:'bolt'}[id],got=h.swings&&h.shots==='-'?'swing':h.shots;
    check(got===want&&h.hit&&h.swapHidden&&(!h.homed===(want!=='bolt'))&&(h.anim==null||h.anim===h.want3d),'דמות '+id+': '+T_(h.wt)+', '+
      (got==='swing'?h.swings+' הנפות':got==='arrow'?'יורה חצים':got==='bolt'?'יורה קסם':'יורה '+got)+(h.homed?' שמתביית':'')+(h.hit?', פוגע':', לא פוגע')+(h.swapHidden?'':', כפתור ההחלפה לא תואם לתרמיל')+
      (h.anim!=null?', הנפשה '+h.anim+(h.anim===h.want3d?'':' (צפוי '+h.want3d+')'):'')+(got===want?'':' (צפוי '+want+')'))}
  check(wk.weakDmg>wk.plain*1.2,'חולשה: מכה של '+wk.weak+' על מגן עשתה '+wk.weakDmg+', ואותה מכה בלי חולשה '+wk.plain);
  check(wk.stone.lightning===0&&wk.stone.water===15&&wk.stone.fire===5,'טבלת יעילות: מכה של 10 על אבן · מים '+wk.stone.water+' (צריך 15), ברק '+wk.stone.lightning+' (צריך 0), אש '+wk.stone.fire+' (צריך 5)');
  const hits=L.hits||{},nTypes=Object.keys(hits).filter(k=>hits[k]>0).length;
  check(!sfx.err&&sfx.cast===5&&sfx.combo&&sfx.drawn&&sfx.peak>0&&sfx.peak<=sfx.max&&sfx.less&&sfx.world&&sfx.anim[1]===5&&sfx.anim[2]&&sfx.anim[3],'מראה הסקילים בזירה: '+(sfx.err||[sfx.cast+'/5 סקילים','אנימציות מגיליונות: '+sfx.anim[0]+' ל-'+sfx.anim[1]+'/5 סקילים'+(sfx.anim[2]&&sfx.anim[3]?'':' (מעל התקרה)'),sfx.combo?'הבזק קומבו':'בלי הבזק קומבו',sfx.drawn?'מצויר':'לא מצויר',
    'עד '+sfx.peak+' חלקיקים בפריים (תקרה '+sfx.max+')',sfx.less?'"פחות אפקטים" בלי חלקיקים':'חלקיקים גם ב"פחות אפקטים"',sfx.world?'בעולם הציור הישן':'בעולם הציור החדש'].join(', ')));
  check(cb.shock&&cb.frozen&&cb.stun&&cb.melt>=1.9&&cb.bossStun&&cb.plainIce,'קומבו: '+[cb.shock?'רטוב+ברק קפץ לרטוב רחוק':'חשמול לא קפץ',cb.frozen?'רטוב+קרח קפא ולא זז':'לא קפא',
    cb.stun?'קפוא+אדמה = הלם':'אין הלם','אש+קרח x'+cb.melt+(cb.melt>=1.9?'':' (צריך x2)'),cb.bossStun?'בוס בהלם פעם אחת ואז חסין':'הלם בבוס לא עבד',cb.plainIce?'קרח לבד לא מקפיא':'קרח לבד הקפיא'].join(', '));
  check(ocb.parts==='attack,control'&&ocb.k==='0.6,0.6'&&ocb.close&&ocb.hit&&ocb.txt&&ocb.drop&&ocb.pool===0,'חפץ משולב: '+(ocb.parts==='attack,control'?'שני חלקים ב-60% כל אחד':'חלקים שגויים '+ocb.parts+' '+ocb.k)+', '+(ocb.close?'צמודים':'רחוקים')+', '+(ocb.hit?'פגע':'לא פגע')+', '+(ocb.drop?'נופל מבוס':'לא נופל')+', '+(ocb.pool===0?'לא בשלל הרגיל':'נפל בשלל הרגיל')+(ocb.txt?'':', תצוגה ריקה')+' ['+ocb.facts+']');
  check(ob.fire&&ob.slow&&ob.block&&ob.shield&&ob.shieldOnce&&ob.heal&&ob.crit>0&&ob.luck>1&&ob.draw===true,'חפצים מסתובבים ('+ob.types+'): '+[ob.fire?'אש שורפת':'אש לא פגעה',ob.slow?'כפור מאט':'כפור לא האט',
    ob.block?'אבן עצרה ירייה':'ירייה עברה',ob.shield?(ob.shieldOnce?'מגן בלע מכה אחת':'מגן בלע יותר ממכה'):'מגן לא בלע',ob.heal?'עלה ריפא':'אין ריפוי',
    'תלתן: קריטי +'+ob.crit+', שלל x'+ob.luck,ob.draw===true?'מצויר':'ציור נכשל: '+ob.draw].join(', '));
  check(!wac.err&&wac.tips&&wac.fire&&wac.ring&&wac.heal&&wac.row&&wac.hunt,'רואים מה האורות עושים: '+(wac.err||[wac.tips?'הסבר לכל אור בפעם הראשונה':'אין הסבר',wac.fire?'אש מסומנת על האויב':'אש לא מסומנת',
    wac.ring?'טבעת כפור':'אין טבעת כפור',wac.heal?'ריפוי בפיד':'ריפוי לא בפיד',wac.row?'שורת אייקונים':'אין שורת אייקונים',wac.hunt?'אש יוצאת לציד ופוגעת':'אין ציד'].join(', ')));
  check(!fxl.err&&fxl.first&&fxl.lane&&fxl.once&&fxl.btn&&fxl.half&&fxl.saved&&fxl.off,'כותרת אזור ופחות אפקטים: '+(fxl.err||[fxl.first?'כותרת בכניסה הראשונה':'אין כותרת',fxl.lane?'בעמודת ההודעות':'בקנבס, מעל ההודעות',fxl.once?'לא חוזרת':'חוזרת בכל כניסה',
    fxl.btn?'כפתור בהגדרות':'אין כפתור',fxl.half?'פחות חלקיקים':'אותם חלקיקים',fxl.saved?'נשמר':'לא נשמר',fxl.off?'חוזר למלא':'לא חוזר'].join(', ')));
  for(const w in lane){const {a,b,hb}=lane[w];check(lane[w].ok,'עמודת הודעות '+w+': '+[(hb.feed?'🥕 לא נוגע בסקילים':'🥕 על כפתור סקיל'),'שמות אויבים: '+hb.full+' מלאים, '+hb.icon+' אייקונים, '+hb.bub+' בועות'+(hb.over?', עולים אחד על השני':'')+(hb.onHud?', על כפתור':''),hb.fx===0.5&&hb.fx0===1?'חגיגה בקרב בחצי גודל':'חגיגה בקרב: '+hb.fx+'/'+hb.fx0,a.waits>0&&a.big===0?'בקרב הגדולה מחכה':'גדולה באמצע קרב',b.big===1?'אחרי הקרב גדולה אחת':'גדולות: '+b.big,
    !a.hero&&!b.hero?'לא על הגיבור':'על הגיבור',!a.ui&&!b.ui?'לא על כפתורים, סקילים, קווסט ומפה':'על כפתור',!a.out&&!b.out?'הכל בתוך המסך':'נחתך בקצה',a.feed>0?'פיד בצד':'אין פיד','שורות '+a.n+'/'+b.n+', סקילים '+a.sk+', כפתורים '+a.keep,...(lane[w].ok?[]:['חלון: '+b.win+', פעיל: '+b.on+', מקום (top/max/hero/vis/cut/n/x): '+a.d+' → '+b.d])].join(', '))}
  check(!feed.err&&feed.on&&feed.merge&&feed.noFloat&&feed.max&&feed.drawn&&feed.above&&feed.gone&&feed.arena,'פיד הודעות: '+(feed.err||[feed.on?'פועל בעולם':'כבוי בעולם',feed.merge?'עץ +3 ו-+2 התאחדו ל-+5':'לא התאחד',feed.noFloat?'בלי טקסט על הדמות':'טקסט על הדמות',
    feed.max?'עד 3 שורות':'יותר מדי שורות',feed.drawn?'מצויר':'לא מצויר',feed.above?'מעל הסקילים':'על הסקילים',feed.gone?'נעלם':'לא נעלם',feed.arena?'בזירה כבוי':'דולק בזירה'].join(', ')));
  check(!skg.err&&skg.top&&skg.gearStays&&skg.play&&skg.shortNo&&skg.hold&&skg.holdBack&&skg.dotOn&&skg.dotOff&&skg.offer&&skg.pStart&&skg.pDummy&&skg.pSkip&&skg.pEnd&&skg.offerBook&&skg.offerWait&&skg.offerHide&&skg.offerBack,
    'מציאת הסקילים: '+(skg.err||[skg.top?'הספר מעל חלון הדמות':'הספר מוסתר',skg.shortNo&&skg.hold&&skg.holdBack?'נגיעה ארוכה פותחת':'נגיעה ארוכה לא עובדת',
    skg.dotOn&&skg.dotOff?'נקודה אדומה מופיעה ונעלמת':'הנקודה האדומה לא עובדת',skg.offer&&skg.offerBook?'כרטיס אחרי הגילוי':'אין כרטיס',
    skg.offerWait&&skg.offerHide&&skg.offerBack?'הכרטיס מחכה כשחלון פתוח':'הכרטיס יושב על חלון פתוח',
    skg.pStart&&skg.pDummy&&skg.pSkip&&skg.pEnd?'אימון: בובות, דילוג וסוף':'האימון לא עובד'].join(', ')+(skg.err||Object.values(skg).every(Boolean)?'':' '+JSON.stringify(skg))));
  check(!sig.err&&sig.noRank&&sig.all&&sig.reveal&&sig.btn&&!sig.bad.length&&sig.ok.length===sig.n&&sig.clean&&sig.arena,'סקיל חתימה: '+(sig.err||[sig.noRank?'בלי דרגה אין כפתור':'יש כפתור בלי דרגה',
    sig.all?'לכל דרגה סקיל':'יש דרגה בלי סקיל',sig.reveal?'רגע גילוי':'אין רגע גילוי',sig.btn?'כפתור בעולם':'אין כפתור בעולם','עובדים: '+sig.ok.join(', '),
    sig.bad.length?'נכשלו: '+sig.bad.join(', '):'',sig.clean?'נגמרים':'לא נגמרו',sig.arena?'':'כפתור בזירה'].filter(Boolean).join(' · ')));
  check(!vfx.err&&vfx.cast&&vfx.hit&&(!vfx.d3||vfx.fall&&vfx.skip2d&&vfx.boom&&vfx.end),'אפקטים בתלת-ממד: '+(vfx.err||(!vfx.d3?'דו-ממד, המטאור בציור הישן'+(vfx.cast&&vfx.hit?' ופוגע':' לא פגע'):
    [vfx.fall?'נופל עם '+vfx.p1+' חלקיקים':'אין חלקיקים בנפילה',vfx.skip2d?'הציור הישן מדלג':'הציור הישן לא מדלג',vfx.boom?'פיצוץ עם '+vfx.p2+' חלקיקים':'אין פיצוץ',vfx.hit?'פוגע':'לא פגע',vfx.end?'נגמר ומשחרר':'לא השתחרר'].join(' · '))));
  check(!vfxh.err&&!vfxh.bad.length&&(!vfxh.d3||vfxh.ok.length===3),'אפקטים לסקילי הצייד: '+(vfxh.err||(!vfxh.d3?'דו-ממד, הציור הישן':
    ['עובדים: '+vfxh.ok.join(', '),vfxh.bad.length?'נכשלו: '+vfxh.bad.join(', '):''].filter(Boolean).join(' · '))));
  check(!wskx.err&&!wskx.bad.length&&wskx.pCast&&wskx.stone&&wskx.bossSlow&&wskx.still&&wskx.crush&&wskx.pOwn&&wskx.cCast&&wskx.dryHops===3&&wskx.dryHit>=3&&wskx.cOwn&&wskx.wetHops===4&&wskx.wetPlus&&wskx.far&&wskx.vCast&&wskx.vOwn&&wskx.pull&&wskx.wet&&wskx.end&&wskx.loEnd,
    'סבב שני בספר: '+(wskx.err||[wskx.stone&&wskx.still?'גרניט מאבן':'גרניט לא מאבן ('+(wskx.stone?'':'אין אבן ')+'זז '+wskx.moved+')',wskx.bossSlow?'הבוס מואט':'הבוס לא מואט',wskx.crush?'ניפוץ אבן '+wskx.crushDmg:'אין ניפוץ אבן',
      'ברק: '+wskx.dryHops+' קפיצות, ברטובים '+wskx.wetHops+', רחוק '+wskx.farN,wskx.pull&&wskx.wet?'מערבולת שואבת ומרטיבה':'מערבולת לא שואבת/מרטיבה',
      wskx.is3d?(wskx.pOwn&&wskx.cOwn&&wskx.vOwn?'מתכונים בתלת-ממד':'חסר מתכון')+' · נמוכה '+wskx.d3.join(' '):'דו-ממד',wskx.end&&wskx.loEnd?'נגמרים':'לא נגמרו'].join(' · '))+(wskx.bad.length?' ✗ '+wskx.bad.join(' · '):'')+(()=>{const no=['pCast','stone','bossSlow','still','crush','pOwn','cCast','cOwn','wetPlus','far','vCast','vOwn','pull','wet','end','loEnd'].filter(k=>!wskx[k]);return no.length?' ✗ '+no.join(','):''})());
  check(!vfxw.err&&!vfxw.bad.length,'אפקטים לסקילי הלוחם: '+(vfxw.err||(!vfxw.d3?'דו-ממד, הציור הישן':vfxw.ok.join(' · ')))+(vfxw.bad.length?' ✗ '+vfxw.bad.join(' · '):''));
  {const v=vfx2,m=v.move||{};
    check(!v.err&&m.stops===0&&m.jerk<9&&m.flips<=6,'פיוחו זזה חלק: '+(v.err||'קפיצות מהירות '+m.jerk+' (עד 9), עצירות פתאום '+m.stops+' (צריך 0), חילופי הליכה/ריצה '+m.flips+' (עד 6)'));
    check(!v.err&&v.castS&&v.castT&&(!v.d3||v.sOwn&&v.sShot>0&&v.sSplash>0&&v.sEnd&&v.tOwn&&v.tStrike>0&&v.tBolt>0&&v.tEnd),
      'אפקטים לסקילי הקוסם: '+(v.err||(!v.d3?'דו-ממד, הציור הישן':
      ['רוח מים: '+(v.sOwn?'מתכון תלת-ממד':'בלי מתכון')+', '+v.sShot+' קליעים, '+v.sSplash+' התזות'+(v.sEnd?', נגמר':', לא נגמר'),
       'סערה: '+(v.tOwn?'מתכון תלת-ממד':'בלי מתכון')+', '+v.tStrike+' ברקים ('+v.tBolt+' קווים)'+(v.tEnd?', נגמר':', לא נגמר')].join(' · '))));
    check(!v.err&&(!v.d3||v.lOn>=2&&v.lMesh>=2&&v.lOwn&&v.lEnd>=2&&v.lAfter>=2&&v.lFree),'לבה ושלוליות של רונות: '+(v.err||(!v.d3?'דו-ממד, הציור הישן':
      v.lOn+' שלוליות עם משטח ('+v.lMesh+' משטחים), '+(v.lOwn?'הציור הישן מדלג':'הציור הישן לא מדלג')+', '+v.lEnd+' נגמרו, '+v.lAfter+' השאירו סימן'+(v.lFree?', הכל השתחרר':', משטח נשאר תקוע'))));
    check(!v.err&&(!v.d3||v.pOn&&v.pFlame>0&&v.pBite>0),'האש של פיוחו בתלת-ממד: '+(v.err||(!v.d3?'דו-ממד, הלהבות בקנבס':
      (v.pOn?'דולקת':'לא דולקת')+', '+v.pFlame+' להבות מהזנב, '+v.pBite+' שלהבות בנשיכה')));}
  check(!tome.err&&tome.oldSave&&tome.hooks&&tome.first&&tome.all&&tome.spare&&tome.saved,
    'ספר קדום: '+(tome.err||[tome.oldSave?'שמירה ישנה עובדת':'שמירה ישנה נשברה',tome.hooks?'מחובר לשומר ולנמסיס':'לא מחובר לבוסים',
    tome.first?'פותח את הסקיל הבא לפני הרמה':'לא פתח סקיל',tome.all?'פותח את כולם':'לא פתח את כולם',tome.spare?'אחרי הכל: זהב':'אחרי הכל: לא נפל שלל',tome.saved?'נשמר':'לא נשמר'].join(' · ')));
  check(!wsb.err&&wsb.one&&wsb.lock&&wsb.lp&&wsb.fill&&wsb.btns&&wsb.ui&&wsb.swap&&wsb.close&&wsb.swapBtn&&!wsb.cardOv&&!wsb.cardSpill.length&&wsb.cardNum&&!wsb.bad.length&&wsb.ok.length===wsb.n&&wsb.clean&&!wsb.noPic.length,
    'ספר הסקילים: '+(wsb.err||[wsb.one&&wsb.lock?'נעול בהתחלה':'לא נעול',wsb.lp?'במסלול הרמות':'לא במסלול',wsb.fill&&wsb.btns?'רמה ממלאת משבצות':'רמה לא מילאה',
    wsb.ui&&wsb.swap&&wsb.close&&wsb.swapBtn?'הספר מחליף כפתור':'הספר לא החליף','עובדים: '+wsb.ok.join(', '),wsb.bad.length?'נכשלו: '+wsb.bad.join(', '):'',wsb.cardOv||wsb.cardSpill.length?'כרטיסים עולים זה על זה: '+wsb.cardOv+' '+wsb.cardSpill.join(','):'כרטיסים בלי חפיפה',wsb.cardNum?'':'המספר על הכרטיס לא כמו המשבצת',wsb.clean?'נגמרים':'לא נגמרו',wsb.noPic.length?'אייקונים שלא נטענו: '+wsb.noPic.join(', '):''+wsb.n+' אייקונים נטענו'].filter(Boolean).join(' · ')));
  check(!wsl.err&&wsl.old&&wsl.tab&&wsl.rows>0&&wsl.up&&wsl.all&&wsl.dmg>=1.55&&wsl.cd&&wsl.btn==='+5'&&wsl.book==='+5','שדרוג סקילים אצל הכוהנת: '+(wsl.err||[wsl.old?'שמירה ישנה עובדת':'שמירה ישנה נשברה',
    wsl.tab?'לשונית עם '+wsl.rows+' סקילים':'אין לשונית',wsl.up?'שדרוג לקח מחיר':'השדרוג לא עבד',wsl.all?'כל סקילי הספר משתדרגים':'יש סקיל שלא משתדרג',
    '+5: נזק x'+wsl.dmg,wsl.cd?'טעינה קצרה יותר':'הטעינה לא התקצרה','כפתור '+(wsl.btn||'בלי +N'),'ספר '+(wsl.book||'בלי +N')].join(' · ')));
  check(!wrn.err&&wrn.lootLock&&wrn.lock&&wrn.lp&&wrn.auto&&wrn.ui&&wrn.pick&&wrn.unpick&&!wrn.bad.length&&wrn.ok.length===wrn.n&&wrn.clean,'רונות: '+(wrn.err||[wrn.lock?'נעולות בהתחלה':'לא נעולות',
    wrn.lp?'במסלול הרמות':'לא במסלול',wrn.auto?'רמה מכניסה רונה':'רמה לא הכניסה',wrn.ui&&wrn.pick&&wrn.unpick?'הספר מחליף רונה':'הספר לא החליף',
    'עובדות '+wrn.ok.length+'/'+wrn.n,wrn.bad.length?'נכשלו: '+wrn.bad.join(', '):'',wrn.clean?'נגמרות':'לא נגמרו'].filter(Boolean).join(' · ')));
  check(!wst.err&&wst.fire&&wst.mark&&wst.bonus&&wst.cd&&wst.stat&&wst.tree,'סקילים שלב 3: '+(wst.err||[wst.fire?'בוער מדליק שכן':'אין התפשטות',
    wst.mark?'צייד מסמן':'לא מסמן',wst.bonus?'מסומן חוטף יותר':'בלי תוספת',wst.cd?'הריגה מקצרת קירור':'הקירור לא התקצר',
    wst.stat?'כוח על ציוד נותן נזק שילובים':'הכוח לא נתן',wst.tree?'גם בעץ':'לא בעץ'].join(' · ')));
  check(!wsh.err&&wsh.weak&&wsh.broke&&wsh.full&&wsh.rune,'סקילים שלב 4: '+(wsh.err||[wsh.weak?'מגן יסודות חוטף רבע':'המגן לא מגן',
    wsh.broke?'שילוב שובר אותו':'השילוב לא שבר',wsh.full?'אחרי השבירה נזק מלא':'עדיין מוגן',wsh.rune?'נפלה רונה שלישית':'לא נפלה רונה'].join(' · ')));
  check(!wcb.err&&!wcb.bad.length&&wcb.ok.shatter&&wcb.ok.pinned&&wcb.ok.steam&&wcb.ok.shock,'שילובים בעולם: '+(wcb.err||[
    Object.entries(wcb.ok).map(([k,c])=>c+' '+k).join(', '),wcb.bad.length?'נכשלו: '+wcb.bad.join(', '):''].filter(Boolean).join(' · ')));
  check(!skr.err&&skr.wait&&skr.start&&skr.zoom&&skr.fly&&skr.end&&skr.once&&skr.big&&skr.on&&skr.skipStart&&skr.skip&&skr.grade,
    'סקיל חדש בעולם ('+skr.id+'): '+(skr.err||[skr.wait&&skr.start?'רגע גילוי מתחיל':'לא התחיל',skr.zoom&&skr.fly?'מצלמה מתקרבת ואייקון עף':'בלי מצלמה או אייקון',
    skr.end?'נגמר והמשחק ממשיך':'לא נגמר',skr.once?'פעם אחת':'חוזר',skr.big&&skr.on?'הטלה ראשונה גדולה':'הטלה ראשונה רגילה',
    skr.skipStart&&skr.skip?'נגיעה מדלגת':'אי אפשר לדלג',skr.grade?'דרגה בעץ משנה מראה':'דרגה לא משנה'].join(', ')));
  check(!skc.err&&skc.cast&&skc.anim&&skc.clipOk&&skc.rune&&skc.band&&skc.gone&&skc.arena&&skc.combat,
    'הטלת סקיל ('+skc.id+'): '+(skc.err||[skc.anim?'תנועה '+skc.clip:'אין תנועה',skc.rune?'עיגול רונות '+skc.col+' ('+skc.tier+')'+(skc.r3d?' בתלת-ממד':'')+(skc.band?'':' בלי טבעת חיצונית'):'אין עיגול',skc.gone?'נעלם':'לא נעלם',skc.arena?'בזירה כבוי':'דולק בזירה',
      skc.combat?'בקרב קטן ×'+skc.fight[1]+' (גל עד '+Math.round(skc.fight[3])+', בלי קרב '+Math.round(skc.calm[3])+')':'בקרב לא קטן: '+JSON.stringify([skc.fight,skc.calm])].join(', ')));
  check(!hold.err&&hold.open&&hold.still&&hold.closed&&hold.resume&&hold.vHold&&hold.prod,
    'חלון עוצר את העולם: '+(hold.err||[hold.open?'היומן נפתח בתפריט':'היומן לא נפתח',hold.still?'5 שניות בלי נזק ובלי תזוזה':'העולם המשיך מאחורי היומן',
      hold.closed&&hold.resume?'בסגירה הקרב חוזר':'הקרב לא חזר',hold.vHold&&hold.prod?'בכפר הייצור ממשיך לפי השעון':'הייצור בכפר נעצר'].join(', ')));
  check(!wsk.err&&wsk.btn&&wsk.place&&wsk.tap&&wsk.tapHit&&wsk.cd&&wsk.sec&&wsk.again&&wsk.drag&&wsk.dragHit&&wsk.aimDraw&&wsk.finger&&wsk.orbs===5&&wsk.orbHit&&wsk.orbDraw&&wsk.orbFlash,
    'סקילים בעולם ('+wsk.id+'): '+(wsk.err||[wsk.btn?'כפתור':'אין כפתור',wsk.place?'למטה מימין, מעל הסרגל':'הכפתור לא במקום',wsk.tap&&wsk.tapHit?'נגיעה יורה ופוגעת':'נגיעה לא פגעה',
    wsk.cd&&wsk.sec&&wsk.again?'קירור עם מספר':'אין קירור',wsk.drag&&wsk.dragHit?'גרירה מכוונת ופוגעת':'גרירה לא פגעה',wsk.aimDraw?'כוונת מצוירת':'אין כוונת',wsk.finger?'אצבע על הכפתור יורה':'אצבע לא ירתה',
    'חפצים מסתובבים: '+wsk.orbs,wsk.orbHit?'פוגעים':'לא פוגעים',wsk.orbDraw?'מצוירים כאורות':'לא מצוירים',wsk.orbFlash?'מבזיקים בפגיעה':'לא מבזיקים'].join(', ')));
  check(!prs.err&&prs.sneak&&prs.flee&&prs.grab&&prs.give&&prs.draw===true&&prs.name&&prs.rescue===true,'הפרעוש: '+(prs.err||[prs.sneak?'מתגנב':'לא התגנב',prs.grab?'חוטף':'לא חטף',prs.flee&&prs.give?'מביא שלל לשחקן':'לא הביא שלל',prs.draw===true?'מצויר':'ציור: '+prs.draw,prs.name?'עם שם וטקסט משלו':'בלי טקסט משלו',prs.rescue===true?'ומציל עם שק שלל':'הצלה: '+prs.rescue].join(', ')));
  check(!ult.err&&ult.early&&ult.use&&ult.btn,'אולטימייט: '+(ult.err||[ult.btn?'כפתור בזירה':'אין כפתור',ult.early?'לא עובד לפני שמלא':'עבד לפני שמלא',ult.use?'מלא: פוגע בכולם ומתאפס':'לא פגע או לא התאפס'].join(', ')));
  check(!spl.err&&spl.dash&&spl.heal&&spl.smite&&spl.mem&&spl.btn&&spl.next,'כישוף מיוחד: '+(spl.err||[spl.btn?'כפתור בזירה':'אין כפתור',spl.next?'נגיעה בהתחלה מחליפה':'נגיעה בהתחלה לא החליפה',spl.dash?'קפיצה':'הקפיצה לא עבדה',spl.heal?'ריפוי':'הריפוי לא עבד',spl.smite?'מכה באויב-על':'המכה לא עבדה',spl.mem?'הבחירה נזכרת':'הבחירה לא נזכרה'].join(', ')));
  check(!shp.err&&shp.gold&&shp.buy&&shp.poor&&shp.pause&&shp.close,'חנות הריצה: '+(shp.err||[shp.gold?'זהב מהריגות':'אין זהב',shp.buy?'קנייה משפרת':'הקנייה לא עבדה',shp.poor?'בלי זהב לא קונים':'קנה בלי זהב',shp.pause?'החלון עוצר':'החלון לא עצר',shp.close?'ונסגר':'לא נסגר'].join(', ')));
  check(!stk.err&&stk.show&&stk.draw===true&&stk.reset,'רצף הריגות: '+(stk.err||[stk.show?'מילה ב-10':'אין מילה ב-10',stk.draw===true?'מצויר':'ציור: '+stk.draw,stk.reset?'הפסקה שוברת את הרצף':'הרצף לא נשבר'].join(', ')));
  check(!aui.err&&aui.merge&&aui.bars&&aui.arrow===true&&aui.quiet,'זירה נקייה: '+(aui.err||[aui.merge?'מכות מתמזגות למספר אחד':'המכות לא התמזגו',aui.bars?'פס חיים רק למי שנפגע ולאויב-על':'פסי חיים לא נכונים',aui.arrow===true?'חץ לאויב-על':'חץ: '+aui.arrow,aui.quiet?'פס עליון שקט':'הפס העליון לא נרגע'].join(', ')));
  check(!rsr.err&&!rsr.early&&rsr.missNo&&rsr.once&&rsr.item&&rsr.draw===true&&rsr.draw2===true&&rsr.took&&rsr.gone&&rsr.far&&rsr.boss,'פיוחו מצילה: '+(rsr.err||[rsr.early?'הופיעה מוקדם':'לא לפני סכנה',rsr.missNo?'הגרלה שנכשלה לא חוזרת':'הגרלה לא נכשלה',rsr.once?'פעם אחת':'שוב',rsr.item?'עצם':'אין עצם',rsr.draw===true&&rsr.draw2===true?'מצויר':'ציור נכשל',rsr.took&&rsr.gone?'אויב קרוב נעלם':'אויב לא נעלם',rsr.far?'רחוק נשאר':'רחוק נעלם',rsr.boss?'בוס רק נפגע':'בוס לא נפגע'].join(', ')));
  check(!dvr.err&&!dvr.early&&dvr.ready&&dvr.btn&&dvr.used&&dvr.five&&dvr.hit&&dvr.draw===true&&dvr.ended&&dvr.back&&dvr.once,'ברק אלוהי: '+(dvr.err||[dvr.early?'התעורר מוקדם':'מחכה לשני אויבי-על',dvr.ready?'מוכן':'לא מוכן',dvr.btn?'כפתור':'אין כפתור',dvr.five?'חמשת החפצים':'לא חמישה',dvr.hit?'ברק פגע':'ברק לא פגע',dvr.draw===true?'מצויר':'ציור נכשל: '+dvr.draw,dvr.ended&&dvr.back?'נגמר אחרי 5 שניות':'לא נגמר',dvr.once?'פעם אחת בריצה':'שוב'].join(', ')));
  check(!qsw.err&&qsw.btn&&qsw.bow&&qsw.sword,'החלפה מהירה: '+(qsw.err||[qsw.btn?'הכפתור מופיע':'אין כפתור',qsw.bow?'לקשת הכי חזקה':'לא עבר לקשת הכי חזקה',qsw.sword?'ובחזרה לחרב הכי חזקה':'לא חזר לחרב הכי חזקה'].join(', ')));
  check(hsk.set&&hsk.look&&hsk.pressed&&hsk.back&&hsk.gear&&!hsk.err,'המראה שלי: '+(hsk.err?'שגיאה: '+hsk.err:[hsk.set?'ההגדרות מחליפות ושומרות':'הבחירה לא נשמרה',hsk.look?'הדמות מתחלפת':'הדמות לא התחלפה',hsk.pressed?'הכפתור מסומן':'הכפתור לא מסומן',hsk.back?'וחוזרת לרגיל':'לא חזרה לרגיל',hsk.gear?'גם בחלון הציוד':'חסר בחלון הציוד'].join(', ')));
  check(spk.on&&spk.off&&spk.slow&&spk.noFlute&&spk.draw===true,'הנודד עם הניצוץ: '+[spk.on?'נדלק':'לא נדלק',spk.noFlute?'בלי חליל':'החליל נדלק אצלו',spk.draw===true?'להבונים וגצים מצוירים':'ציור: '+spk.draw,spk.off?'וכבה':'לא כבה'].join(', '));
  check(fl.on&&fl.off&&fl.slow&&fl.prop&&fl.draw===true,'הנודד עם החליל: '+[fl.on?'נדלק':'לא נדלק',fl.prop?'חליל ביד':'אין חליל ביד',fl.slow?'אפקט סקיל ארוך יותר':'אפקט סקיל באורך רגיל',
    fl.draw===true?'תווים וחלילים מצוירים':'ציור נכשל: '+fl.draw,fl.off?'כבה בחזרה':'נשאר דלוק'].join(', '));
  check(jc.swStart&&jc.swEarly&&jc.swHit&&jc.swDodge,'אויבים שנלחמים בחזרה (strike.js): '+(jc.swStart?'נעצר ומתכונן':'לא מתכונן')+', '+(jc.swEarly?'לא פוגע באמצע ההכנה':'פוגע לפני הזמן')+', '+(jc.swHit?'מכה בסוף':'אין מכה')+', '+(jc.swDodge?'התרחקות = התחמקות':'פוגע גם כשהתרחקת'));
  check(!jc.err&&jc.hfLean&&jc.hfEnd&&jc.hfWind,'תחושת מכה (hitfeel.js): '+(jc.hfLean?'האויב נוטה אחורה':'האויב לא נוטה')+', '+(jc.hfEnd?'ונגמר':'לא נגמר')+', '+(jc.hfWind?'הגיבור מתכונן לפני המכה':'בלי הכנה')+' (הכנות/נטיות: '+jc.hfN+')');
  check(jc.resist&&jc.tip&&jc.tipOnce,'עמיד במכה: '+(jc.resist?'"🛡 חסין" באפור עם סמל הסוג':'עדיין מספר')+', '+(jc.tip?'טיפ בפיד עם סוג טוב יותר':'אין טיפ')+(jc.tipOnce?', פעם אחת':', חוזר'));
  check(!jc.err&&jc.grow&&jc.streak&&jc.stop&&jc.stopGap&&jc.fl&&jc.swing&&jc.flash&&jc.kb&&jc.parts&&jc.num&&jc.squash&&jc.crit&&jc.shake&&jc.poof&&jc.cap&&jc.draw===true&&jc.arenaOff&&jc.arOn&&jc.arSrc&&jc.arCap&&jc.arStop&&jc.arPoof&&jc.arLess,'אפקטים של קרב: '+(jc.err||[jc.grow?'נשק שגדל':'נשק לא גדל',jc.streak?'רצף הריגות':'בלי רצף',jc.stop?'עצירה קטנה במכה':'בלי עצירה במכה',jc.stopGap?'לא עוצר ברצף':'עוצר בכל מכה ברצף',jc.fl?'הבזק פגיעה':'בלי הבזק פגיעה',jc.swing?'שובל הנפה':'בלי שובל הנפה',jc.flash?'הבזק':'בלי הבזק',jc.kb?'הדיפה':'בלי הדיפה',jc.parts?'ניצוצות':'בלי ניצוצות',jc.num?'מספר עם סמל חולשה':'אין מספר',jc.squash?'מעיכה':'בלי מעיכה',
    jc.crit?'קריטי צהוב':'קריטי רגיל',jc.shake?'רעידה':'בלי רעידה',jc.poof?'פוף בהריגה':'בלי פוף',jc.cap?'בתקרה':'מעל התקרה',jc.draw===true?'מצויר':'ציור נכשל: '+jc.draw,'בזירה: '+(jc.arenaOff&&jc.arOn?'גרסה קלה דולקת':'לא כמו שצריך')+(jc.arSrc?'':', גם מחיית מחמד או מברק שקפץ')+(jc.arCap?', עם 250 אויבים '+jc.arN+' אפקטים בפריים (עד '+jc.arMax+')':', מעל התקרה ('+jc.arN+')')+(jc.arStop?'':', עוצר בגל גדול')+(jc.arPoof?', פוף רק לאלוף':', פוף לא נכון')+(jc.arLess?'':', דולק גם ב"פחות אפקטים"')].join(', ')));
  const cmb=Object.entries(L.combos||{}).map(([k,v])=>k+' '+v).join(', ');
  check(L.skBtns>0&&L.skUsed>0,'סקילים: '+(L.skBtns||0)+' כפתורים ('+(L.skIds||'-')+'), '+(L.skUsed||0)+' שימושים בריצה · קומבו בריצה: '+(cmb||'אף אחד'));
  check(nTypes>=2,'פגיעות לפי סוג נזק: '+(Object.entries(hits).map(([k,v])=>k+' '+v).join(', ')||'אין')+' · בסוף: חרב/קשת '+L.dt);
  check(L.door!=null&&L.room!=null&&L.roomBack!=null,'דלת זהב: הופיעה '+t(L.door)+', נכנס לחדר '+t(L.room)+(L.saws?' (עם מסורים)':'')+', חזר '+t(L.roomBack)+', '+L.coins+' מטבעות');
  const picks=['bomb','power'].filter(k=>L['pick_'+k]!=null).map(k=>(k==='bomb'?'פצצה ':'כוח ')+t(L['pick_'+k]));
  check(picks.length>0&&L.taken>0,'פריטים באזורי סכנה: '+(picks.join(', ')||'לא הופיעו')+', נלקחו '+L.taken);
  check(L.wanted!=null&&L.wRumor<L.wanted&&L.wEnd!=null,'מבוקש: שמועה '+t(L.wRumor)+', הופיע '+t(L.wanted)+', '+
    (L.wEnd==null?'לא נתפס ולא ברח':'נגמר '+t(L.wEnd)+' · נתפס '+L.wCaught+', ברח '+L.wEscaped+(L.wLoot?' · שלל: '+L.wLoot:'')));
  const num=/^\d+ \/ \d+$/;
  check(num.test(L.hpTxt)&&num.test(L.xpTxt)&&L.gainMax>0,'מספרים בממשק: חיים '+L.hpTxt+', XP '+L.xpTxt+', הכי הרבה שנאסף ברצף: +'+(L.gainMax||0));
  check(/^\d+:\d\d$/.test(L.clock||'')&&/\d+\/\d+/.test(L.waveTag||''),'שעון ומונה גלים: השעון הגיע ל-'+L.clock+', המונה "'+(L.waveTag||'-')+'"');
  check(L.wvMax===L.wvN&&L.wvHeal>=L.wvN-1&&L.elites>0,'הזירה בריצה: הגיע לגל '+(L.wvMax||0)+'/'+(L.wvN||'-')+', הפסקות עם ריפוי: '+(L.wvHeal||0)+' · גלים נגמרו ב: '+(L.wvEnds||'-')+(L.wvLate?' ('+L.wvLate+' בזמן שנגמר)':'')+(L.wvStuck?' · '+L.wvStuck:'')+' · רמה בתחילת גל: '+Object.entries(L.lvAt||{}).map(([w,l])=>w+':'+l).join(' ')+' · אויבי-על מתוכננים בגלים: '+(L.supsN||0)+', כל אויבי-העל והעלית שהופלו: '+L.elites+(L.eliteLeft?' (נשאר: '+L.eliteLeft+')':''));
  check(L.peak>=20,'גושים: עד '+L.peak+' אויבים בזירה יחד');
  check(/[KMB]!?$/.test(L.dmgMaxTxt||'')&&L.crits>0&&!L.notLtr,'מספרים גדולים: הכי גדול '+(L.dmgMaxTxt||'-')+', קריטיות: '+(L.crits||0)+(L.notLtr?', מספר שלא נכתב משמאל לימין: '+L.notLtr:''));
  check(L.boss!=null,'בוס: הופיע '+t(L.boss)+(L.bossName?' ('+L.bossName+')':''));
  if(L.boss!=null){
    check(L.bossRes===L.usedTop&&L.bossWeak!==L.bossRes,'הבוס למד: עמיד ל-'+L.bossRes+' (הכי הרבה נזק שלך: '+L.usedTop+'), חלש ל-'+L.bossWeak+(L.held?' (יש לך אותו ביד)':' (אין לך אותו ביד)')+', תפקיד '+L.bossRole);
    check(L.rageMax>0.9,'זעם כשבורחים: הגיע ל-'+Math.round(100*(L.rageMax||0))+'%');
    check(L.rageLow<L.rageMax,'נרגע כשמתעמתים: ירד ל-'+Math.round(100*(L.rageLow??1))+'%');
    check(L.bossDown!=null,'בוס הובס: '+t(L.bossDown));
    check(L.won!=null,'ניצחון: הבוס בסוף הובס והריצה נגמרה '+t(L.won));
    {const A=L.arfx||{tele:{}},tl=Object.entries(A.tele||{}),low=tl.filter(([k,v])=>v.warn<1);   // אזהרה לכל מתקפה של הבוס, לפחות שנייה לפני (arena-fx.js)
      check(tl.length>=2&&!low.length&&A.hits>0&&A.koBoss>0&&A.win>0,'אפקטים בבוס: אזהרות '+(tl.map(([k,v])=>k+' '+v.n+'× '+v.warn.toFixed(2)+'ש\'').join(', ')||'אף אחת')+
        (low.length?' (פחות משנייה: '+low.map(([k])=>k).join(', ')+')':'')+' · פגיעות '+(A.hits||0)+' (כבדות '+(A.heavy||0)+', קריטי '+(A.crits||0)+') · הריגות '+(A.ko||0)+' · ko_boss '+(A.koBoss||0)+' · ניצחון '+(A.win||0))}
  }
  const quiet=au.ids.filter(id=>!au.count[id]&&!(id==='bossIn'&&L.boss==null)&&!(id==='bossDown'&&L.bossDown==null)&&!(id==='coin'&&L.room==null)&&!['bell','creak'].includes(id)&&!id.startsWith('cast_')&&!['streak2','streak3','tower_fall','base_alarm','imp_hammer','imp_wall','cry_war','me_die','me_back','gamble_tick','gamble_win','gamble_lose'].includes(id));   // רצף 2-3 תלוי במזל, והשאר במשחקי השאול (tower_fall נבדק שם)   // cast_*: הבוט מטיל רק חלק מסוגי הנזק, ונבדק למטה שלפחות אחד נשמע   // bell, creak: נבדקים בבדיקת פעמון הערפל, שרצה אחרי הצילום של הצלילים
  check(au.unlocked&&!quiet.length,'צלילים: '+au.ids.map(id=>id+' '+(au.count[id]||0)).join(', ')+(au.unlocked?'':' · לא נפתחו בנגיעה')+(quiet.length?' · לא נשמעו: '+quiet.join(', '):''));
  // צלילי קרב (where:'fight' ב-SOUNDS) שקטים בכפר ובעולם, הצד של ניר, גם כשקוד שם קורא להם, ונשמעים בזירה
  check(!sg.err&&sg.n>0&&sg.world===0&&sg.vil===0&&sg.arena===3,'צלילי קרב לא בכפר ובעולם: '+(sg.err||sg.n+' צלילים מסומנים, בעולם '+sg.world+', בכפר '+sg.vil+', בזירה '+sg.arena+'/3'));
  // סבב צלילים 1 (audio.js, docs/concept/sound.md): (א) כל sfx('...') בקוד קיים ב-SOUNDS (כך sfx('ui') היה שקט ב-64 מקומות),
  // (ב) בריצה בזירה נשמע לפחות צליל הטלה אחד לפי סוג נזק, ו-ui נשמע
  {const ids=new Set();for(const f of fs.readdirSync(path.resolve(__dirname,'..','js')).filter(f=>f.endsWith('.js')&&f!=='sounds-data.js')){
     const src=fs.readFileSync(path.resolve(__dirname,'..','js',f),'utf8');for(const m of src.matchAll(/\bsfx\(([^)]*)\)/g))for(const q of m[1].matchAll(/(?<!==)'([A-Za-z_]\w*)'/g))ids.add(q[1])}   // לא מחרוזת אחרי == (השוואה, לא שם צליל)
   const miss=[...ids].filter(id=>!au.ids.includes(id)),casts=au.ids.filter(id=>id.startsWith('cast_')&&au.count[id]>0);
   check(!miss.length,'כל sfx בקוד קיים ב-SOUNDS: '+ids.size+' שמות'+(miss.length?' · חסרים: '+miss.join(', '):''));
   check(casts.length>0&&au.count.ui>0,'צלילי הטלה ו-ui בזירה: '+(casts.map(id=>id+' '+au.count[id]).join(', ')||'אף צליל הטלה')+' · ui '+(au.count.ui||0))}
  check(!au.errors.length&&au.loaded===au.ids.length,'קבצי צליל: נטענו '+au.loaded+' מתוך '+au.ids.length+(au.errors.length?' · שגיאות: '+[...new Set(au.errors)].join(', '):''));
  check(au.open&&au.mute&&au.vSaved&&au.closed,'חלון צלילים: '+(au.open?'נפתח מהרמקול':'לא נפתח')+(au.mute?', השתקה עובדת ונשמרת':', השתקה לא עובדת')+
    (au.vSaved?', עוצמת קרב נשמרת':', העוצמה לא נשמרה')+(au.closed?', נסגר':', לא נסגר'));
  // צלילי קרב חוזרים כל הזמן: לכל היותר 8 בשנייה מכל אחד. הבוט גם רואה כמה באמת התנגנו בריצה (played) מול כמה התבקשו (count)
  const loud=au.ids.filter(id=>au.grp[id]==='fight'&&au.rate[id]>8);
  check(!loud.length,'קצב צלילים בשנייה: '+au.ids.map(id=>id+' '+au.rate[id]).join(', ')+(loud.length?' · יותר מדי: '+loud.join(', '):'')+
    ' · התנגנו בריצה: '+(au.ids.map(id=>au.played[id]?id+' '+au.played[id]:'').filter(Boolean).join(', ')||'0 (בלי צליל בדפדפן ללא ממשק)'));
  check(L.wHits>0&&L.wHitMax<=L.wRange,'טווח התקפה בעולם: '+(L.wHits||0)+' מכות, הרחוקה '+(L.wHitMax??'-')+' (מותר עד '+L.wRange+')');
  check(edge.wIn&&edge.n>0&&edge.inside&&!edge.left,'מבוקש בקצה העולם: '+(edge.wIn?'לא יצא מהגבול':'יצא מהגבול')+', '+edge.n+' שלל'+(edge.inside?' נחת בפנים':' נחת בחוץ')+
    (edge.left?', '+edge.left+' לא נאספו':', הכל נאסף')+' (הוחזרו פנימה: '+edge.kept+')');
  check(edge.gid&&edge.gBag&&edge.gSaved&&edge.gGround&&!(L.gearDrops>0),'ציוד מאויב: '+(edge.gid||'לא נפל')+(edge.gBag?' בתרמיל':' לא בתרמיל')+(edge.gSaved?', נשמר':', לא נשמר')+
    ' · בזירה לא נופל מאויבים (של אוראל): '+(L.gearDrops||0));
  check(!clsL.err&&Object.values(clsL).every(o=>o.share>=50&&o.all&&o.pity&&o.up),'שלל לפי דמות: '+(clsL.err||Object.keys(clsL).map(c=>c+' '+clsL[c].share+'% מהנשקים'+(clsL[c].all?'':', חסרה שכבה')+(clsL[c].pity?'':', מזל שבור')+(clsL[c].up?'':', רמה 20 לא משפרת')).join(' · ')));
  if(CFG.gfx==='3d')check(g3.on&&L.actorsMax>0,g3.on?'תלת-ממד: פעיל, עד '+L.actorsMax+' דמויות במסך, עד '+L.callsMax+' ציורים בפריים':'תלת-ממד: לא עלה'+(g3.failed?' (נפל לדו-ממד)':''));
  else check(!g3.on,'דו-ממד: פעיל לפי הבחירה');
  check(!startLeak&&!L.heLeak,startLeak||L.heLeak?'שפה: נשאר טקסט בעברית: '+(startLeak||L.heLeak):'שפה: כל המסכים באנגלית, משמאל לימין');
  if(!CFG.god)results.push(L.died!=null?'· מת ב-'+t(L.died):'· שרד עד '+t(L.t));
  const pt=L.pet||{st:{}},pst=Object.entries(pt.st).map(([k,v])=>k+' '+v).join(', ');
  check(pt.n>20&&pt.near/pt.n>0.85,'חיית מחמד הולכת אחרי השחקן: קרובה אליו ב-'+Math.round(100*pt.near/(pt.n||1))+'% מהזמן · מצבים: '+(pst||'לא נראתה'));
  check(pt.digs>0&&pt.drop,'פיוחו חופרת: '+(pt.digs||0)+' חפירות, הוציאה '+(pt.dug.join(', ')||'כלום')+(pt.drop?', השלל נפל לרצפה':', שום שלל לא נפל לרצפה'));
  const fd=pt.feed;
  check(fd&&fd.btn&&fd.xp>0&&fd.ate===1&&fd.buff>0&&fd.hearts>0&&fd.hide&&fd.saved,'פיוחו אוכלת גזר: '+(fd?'הכפתור הופיע, אכלה '+fd.ate+', ‎+'+fd.xp+' XP, חיזוק '+Math.round(fd.buff)+' שניות, '+fd.hearts+' לבבות'+(fd.hide?'':', הכפתור לא נעלם')+(fd.saved?', נשמר':', לא נשמר'):'הכפתור לא הופיע'));
  check(pt.wBites>0&&!pt.aBites&&pt.dealt>0&&pt.ret>0&&!pt.oob&&pt.far<=pt.leash*1.6,'פיוחו תוקפת בעולם: '+(pt.wBites||0)+' נשיכות, בזירה '+(pt.aBites||0)+' (צריך 0), '+Math.round(pt.dealt||0)+' נזק, חזרה לשחקן '+(pt.ret||0)+' פעמים, הכי רחוק ממנו '+(pt.far||0)+(pt.oob?' · יצאה מגבולות העולם '+pt.oob+' פעמים':''));
  check(L.doll==='3d'||L.doll==='2d','הדמות בחלון הציוד: '+(L.doll==='3d'?'בתלת-ממד, עם מה שלבוש':L.doll==='2d'?'דו-ממד, אימוג\'י':'לא הופיעה ('+L.doll+')'));
  check(qHandT.skip||qHandT.ready&&qHandT.ok&&qHandT.left===190,'קווסט "תביא לי": '+(qHandT.skip?'אין קווסט עצמות':(qHandT.ready?'200 עצמות בתרמיל = מוכן מיד':'לא נספר מהתרמיל')+(qHandT.ok?', הפרס התקבל':', הפרס לא התקבל')+', נשארו '+qHandT.left+' (צריך 190)'));
  const setBad=Object.entries(setT).filter(([s,v])=>!(v.n===4&&v.one&&v.two&&v.four&&v.named)).map(([s,v])=>s+' '+JSON.stringify(v));
  check(Object.keys(setT).length&&!setBad.length,'סטים של ציוד: '+Object.keys(setT).length+' סטים, 2 ו-4 חלקים נותנים בונוס'+(setBad.length?' · בעיה: '+setBad.join(', '):''));
  check(pt.evo==='1→2→3'&&pt.evoSaved&&pt.evoFx&&pt.fxOk,'פיוחו מתפתחת: '+(pt.evo||'לא נבדק')+(pt.evoSaved?', נשמר':', לא נשמר')+(pt.evoFx?', עם חגיגה':', בלי חגיגה')+(pt.fxOk?'':', להבה בשלב 3 לא מצאה את הזנב'));
  if(CFG.gfx==='3d')check(pt.r3&&pt.clips==='ok','פיוחו בתלת-ממד: '+(pt.r3?'נראית':'לא נראתה')+(pt.clips==='ok'?', כל 7 האנימציות נטענו':', חסרות: '+pt.clips));
  check(!mb.err&&mb.pick===5&&mb.on&&mb.out,'משחקי השאול: '+(mb.err||'חלון בחירה עם '+mb.pick+' דמויות'+(mb.on?', המשחק נפתח':', לא נפתח')+(mb.out?', יציאה עובדת':', היציאה לא עובדת')));
  if(!mb.err){
    check(mb.over,'משחקי השאול: משחק של בוטים '+(mb.over?'נגמר':'לא נגמר')+' אחרי '+t(mb.t)+' · '+mb.towers+' מגדלים נפלו'+(mb.base?', בסיס נהרס':', נגמר בזמן')+' · הריגות '+mb.score+' · רמה עד '+mb.lv);
    check(!mb.towers||mb.towerSfx>0,'משחקי השאול: צליל מגדל נופל (tower_fall): '+(mb.towerSfx||0)+' פעמים, '+mb.towers+' מגדלים נפלו');
    if(CFG.gfx==='3d')check(!mb.r3||mb.m3===6,'משחקי השאול בתלת-ממד: '+(mb.r3?mb.m3+' מבנים כמודלים (צריך 6)':'התלת-ממד כבוי'));
    {const p=(mb.look||{}).pic||[],ok=p.filter(f=>f==='gi'||f&&fs.existsSync(path.resolve(__dirname,'..',f)));check(p.length===3&&ok.length===3,'משחקי השאול: כפתורי הסקילים עם אייקון (צללית או תמונה): '+ok.length+' מתוך '+p.length+(ok.length<p.length?' (חסר: '+p.filter(f=>!ok.includes(f)).join(', ')+')':''))}
    {const k=mb.look||{};check(k.svg===5&&!k.emoji&&k.floor,'משחקי השאול: מראה: '+k.svg+' אייקונים (צריך 5)'+(k.emoji?', נשאר אימוג\'י בכפתורים':'')+(k.floor?', רצפה משלו':', בלי רצפה משלו'))}
    {const c=mb.cam||{};check(c.wide>=1.5&&c.bush>0&&c.rock>0&&c.mini&&c.back&&c.fires!==0,'משחקי השאול: מצלמה ומפה: רואים פי '+c.wide+' לרוחב (צריך 1.5), '+c.bush+' שיחים, '+c.rock+' אבנים'+(c.mini?'':', המפה הקטנה יוצאת מהמסך')+(c.back?'':', המצלמה לא חזרה אחרי היציאה')+(c.fires===0?', בלי לפידים בתלת-ממד':''))}
    {const m=mmap,ks={tap:'נגיעה מזיזה',drag:'גרירה עוקבת',rect:'המלבן לפי המצלמה',stay:'נשארת אחרי שחרור',meBack:'נגיעה בגיבור מחזירה',key:'C מחזיר',btn:'🎯 מחזיר',joyBack:'ג׳ויסטיק מחזיר',two:'ג׳ויסטיק עובד בזמן גרירה',lift:'שחרור אצבע אחת',liftBack:'ואז הג׳ויסטיק מחזיר'},bad=Object.keys(ks).filter(k=>!m[k]);
     check(!m.err&&!bad.length,'משחקי השאול: מפה קטנה במגע: '+(m.err||(bad.length?bad.map(k=>ks[k]+' ✗').join(', '):'נגיעה, גרירה, מלבן, חזרה לגיבור ושתי אצבעות')))}
    check(mb.two&&mb.two.held===2&&mb.two.ok,'משחקי השאול עם קשת וחרב: '+(mb.two?(mb.two.ok?'ה-HUD עובד':'ה-HUD נופל: '+mb.two.err):'לא נבדק'));
    check(mb.slide&&mb.slide.pass,'משחקי השאול: הולכים ישר אל מגדל ומחליקים מסביבו '+(mb.slide?(mb.slide.pass?'✓':'נתקע ('+mb.slide.dx+' מהמגדל)'):'לא נבדק'));
    {const f=mb.feel||{};check(f.soft&&f.turned&&f.run>=f.want*0.9&&f.feed,'משחקי השאול: תנועה: סיבוב '+(f.soft&&f.turned?'רך ✓':'בבת אחת או תקוע')+', דרך חייל '+f.run+'/'+f.want+' פיקסלים בשנייה'+(f.feed?', הודעת הריגה ✓':', בלי הודעת הריגה'))}
    {const L=mb.life||{},ks={lowOn:'אזהרה בחיים נמוכים',lowOff:'נעלמת',start:'כפתור חזרה',home:'מגיע לבסיס',move:'תזוזה מבטלת',hit:'פגיעה מבטלת',half:'טבעת זהב חצי',full:'מלאה ומוארת'};
     check(Object.keys(ks).every(k=>L[k]),'משחקי השאול: שומר בחיים: '+Object.keys(ks).map(k=>ks[k]+(L[k]?' ✓':' ✗')).join(', '))}
    {const G=mb.gang||{};check(!G.err&&G.n>0&&G.max===1&&G.low===0,'משחקי השאול: לא מתנפלים יחד ב"קל": '+(G.err||'הכי הרבה בוטים על השחקן בבת אחת: '+G.max+' (מותר 1), התמקדו בו '+G.n+' פריימים מתוך 240, ומתחת ל-20% '+(G.low===0?'מותר לגמור':'עדיין חסום!')))}
    {const R=mb.rigK||{};check(R.ok,'סקין מתמונות בגודל ×1.15 (rig.js): '+(R.err||R.n+' חלקים מצוירים'+(R.ok?', כל המידות סופיות ופי 1.15':', מידות לא נכונות')))}
    {const Q=mb.sinFx||{},ks={vanish:'עשן בהיעלמות',mine:'מוטות לקבוצה שלו',foe:'לא לאויב',brk:'נעלמים בשבירה',dead:'נעלמים במוות',back:'CRIT סגול בגב',mark:'יהלום לסימן מוות'};
     check(!Q.err&&Object.keys(ks).every(k=>Q[k]),'משחקי השאול: אפקטים של המתנקש: '+(Q.err||Object.keys(ks).map(k=>ks[k]+(Q[k]?' ✓':' ✗')).join(', ')))}
    {const Z=mb.arrow||{},ks={cast:'הטלה',pose:'שחרור קשת',circ:'בלי מעגל',trail:'פס',drawn:'מצויר',miss:'החטאה בלי הבזק',hit:'הבזק רק בפגיעה',fog:'אויב בערפל מוסתר',reset:'ניקוי'};
     check(!Z.err&&Object.keys(ks).every(k=>Z[k]),'משחקי השאול: חץ הברק: '+(Z.err||Object.keys(ks).map(k=>ks[k]+(Z[k]?' ✓':' ✗')).join(', ')))}
    {const F=mb.qaim||{},kn=Object.entries(F.kinds||{}),ok=kn.length>=4&&kn.every(([,v])=>v);
     check(!F.err&&ok&&F.draw===true&&F.ends&&F.drag&&F.bot,'משחקי השאול: סימון בהטלה מהירה: '+(F.err||kn.map(([k,v])=>k+(v?' ✓':' ✗')).join(', ')+(F.draw===true?'':', ציור: '+F.draw)+', דועך '+(F.ends?'✓':'✗')+', בגרירה בלי הבזק '+(F.drag?'✓':'✗')+', לבוט בלי '+(F.bot?'✓':'✗')))}
    {const K=mb.atk||{},ks={btn:'כפתור',big:'הכי גדול',free:'לא נוגע בסקילים',step:'נגיעה מקרבת',lock:'גרירה נועלת',pref:'הנעול קודם',far:'נגמרת במרחק',dead:'נגמרת במוות',cancel:'✕ מבטל',cd:'טעינה על הכפתור',space:'רווח'};
     check(!K.err&&K.draw===true&&Object.keys(ks).every(k=>K[k]),'משחקי השאול: כפתור התקיפה: '+(K.err||Object.keys(ks).map(k=>ks[k]+(K[k]?' ✓':' ✗')).join(', ')+(K.draw===true?'':', ציור: '+K.draw)))}
    {const I=mb.items||{},ks={tick:'זהב עם הזמן',minion:'זהב מחייל',quick:'קנייה מהירה',stat:'סטטים',sell:'מכירה',win:'חלון החנות',buy:'קנייה בחלון',close:'סגירה',bot:'בוט קונה'};
     check(Object.keys(ks).every(k=>I[k]),'משחקי השאול: חפצים: '+Object.keys(ks).map(k=>ks[k]+(I[k]?' ✓':' ✗')).join(', '))}
    if(mb.build||mb.spell){const B=mb.build||{},r=mb.spell||{},p=mb.spl||{pick:{},use:{}},pk=Object.entries(p.pick),bad=pk.filter(x=>!x[1]).map(x=>x[0]),pics=(r.pic||[]).filter(f=>f==='gi'||f&&fs.existsSync(path.resolve(__dirname,'..',f)));
      check(B.step&&B.n===6&&B.def&&B.saved&&B.back&&B.load&&B.game,'משחקי השאול: מסך בנייה: '+(B.step?B.n+' לחשים':'לא נפתח אחרי הגיבור')+(B.def?', ברירת מחדל זינוק':', ברירת המחדל לא זינוק')+(B.saved?', בחירה נשמרת לגיבור עם הסבר':', הבחירה לא נשמרה')+(B.back?', חזרה לבחירת גיבור (והקושי שם)':', החזרה לא עובדת')+(B.load?', נטענת שוב':', לא נטענת')+(B.game?', ובמשחק':', לא עברה למשחק'));
      check(r.heal&&r.healCd&&r.done&&r.done.length===r.n&&r.tip.length===r.n&&r.btn&&pics.length===2&&r.tap&&r.hold,'משחקי השאול: ריפוי '+(r.heal?'✓ 15%':'✗')+(r.healCd?' עם טעינה':' בלי טעינה')+' · לחשים שעובדים עם טעינה: '+(r.done||[]).join(', ')+' ('+(r.done||[]).length+'/'+r.n+')'+(r.tip&&r.tip.length===r.n?', לכולם הסבר':', חסר הסבר')+(r.btn?', הכפתורים לא מכסים סקילים או חזרה':', כפתור מכסה או מחוץ למסך: '+(r.bad||[]).join(', '))+', '+pics.length+'/2 אייקונים מצוירים'+(r.tap?', נגיעה קצרה אחרי פריים כבד מטילה':', נגיעה קצרה אחרי פריים כבד נבלעה')+(r.hold?', לחיצה ארוכה לא':', לחיצה ארוכה הטילה'));
      check(!bad.length&&pk.length>0&&p.heal>0&&Object.keys(p.use).length>0,'משחקי השאול: בוטים: בחרו לפי תפקיד '+(bad.length?'✗ '+bad.join(', '):'✓ ('+pk.map(x=>x[0]).join(', ')+')')+', ריפוי '+(p.heal||0)+' פעמים, לחשים: '+(Object.entries(p.use).map(x=>x[0]+' '+x[1]).join(', ')||'אף אחד'))}
    {const X=mb.endX||{};check(X.home&&X.again&&X.build&&X.bx&&X.px,'משחקי השאול: יציאה: '+[X.home?'"בית" בסוף יוצא ✓':'"בית" לא יוצא ✗',X.again?'"שחק שוב" לבחירת גיבור ✓':'"שחק שוב" ✗',X.build&&X.bx?'✕ במסך הבנייה סוגר ✓':'✕ במסך הבנייה ✗',X.px?'✕ בבחירה אחרי "גיבור אחר" סוגר ✓':'✕ אחרי "גיבור אחר" ✗'].join(', '))}
    {const q=mb.qa||{};check(!q.err&&q.roll&&q.reset&&q.bushCast&&q.zone&&q.pri&&q.tip&&q.near,'משחקי השאול: תיקוני QA: '+(q.err?'שגיאה '+q.err+' · ':'')+[q.roll?'בהטלה זינוק/סדן/חזרה חסומים בלי טעינה ✓':'בהטלה ✗',q.reset?'מת בחדר חוזר בלי רשת ובועה ✓':'רשת/בועה נשארו ✗',q.bushCast?'לחש משיח חושף ✓':'לחש משיח ✗',q.zone?'אזור אויב בערפל מוסתר ✓':'אזור בערפל ✗',q.pri?'הודעת החדר בראש התור ✓':'הודעת החדר ✗',q.tip?'ההסבר מעל הריפוי ✓':'ההסבר מוסתר ✗',q.near?'ליד החדר ההודעות יורדות ✓':'הודעות ליד החדר ✗'].join(', '))}
    {const A=mb.sin||{},ks={back:'מכה בגב',step:'צעד צל מאחור',veil:'היעלמות (לא מטרה)',mark:'סימן מוות ונטען בהריגה',cleanse:'ניקוי מסיר סימן',items:'ניבים וארס'};
     check(!A.err&&Object.keys(ks).every(k=>A[k]),'משחקי השאול: המתנקש: '+(A.err?'שגיאה '+A.err+' · ':'')+Object.keys(ks).map(k=>ks[k]+(A[k]?' ✓':' ✗')).join(', '))}
    check(mb.lock,'משחקי השאול: סקיל-על נעול '+(mb.lock?'רועד בלי הודעה':'קפץ כהודעה'));
    {const A=mb.aim||{};check(A.on&&A.hot&&A.cancel&&A.cast&&A.sec,'משחקי השאול: כיוון בגרירה '+(A.on?'✓':'לא הופיע')+(A.hot?', ✕ נדלק':', ✕ לא נדלק')+(A.cancel?', ביטול בלי טעינה':', הביטול לא עבד')+(A.cast?', שחרור מטיל לנקודה':', השחרור לא הטיל לנקודה')+(A.sec?', שניות על הכפתור':', אין שניות'))}
    check(mb.back&&mb.att&&mb.btn&&mb.end,'משחקי השאול: פקודות לחברים: נסיגה '+(mb.back?'✓':'לא עבדה')+', התקפה '+(mb.att?'✓':'לא עבדה')+(mb.btn?', הכפתור מסומן':', הכפתור לא מסומן')+(mb.end?', נגמרת לבד':', לא נגמרת'));
    {const need=['sk_pierce','sk_wave','sk_anvil','sk_anvil_wave','sk_taunt','sk_wall','sk_cleave','sk_spin','sk_rage','sk_rage_glow','sk_net','sk_net_root','sk_rain','sk_bubble','sk_bubble_halo','sk_bubble_aura','sk_blizzard','sk_blizzard_ice','ult_cast','ult_ray','sp_dash','sp_haste','sp_barrier','sp_reveal','sp_exhaust','sp_cleanse','sp_heal','recall'].filter(i=>!(mb.sharpSkip||[]).includes(i)),miss=need.filter(i=>!(mb.fxIds||[]).includes(i)),fs=require('fs'),path=require('path'),
       files=Object.keys(JSON.parse(fs.readFileSync(path.join(__dirname,'fx-list.json'),'utf8'))).filter(k=>!k.startsWith('_')).filter(k=>!fs.existsSync(path.join(__dirname,'..','fx',k+'.webp')));
     check(mb.fxLib>=100&&!files.length&&!miss.length&&mb.fxDrawOk===true&&!!mb.fxAt&&mb.fxAt.on,'ספריית האפקטים: '+mb.fxLib+' אפקטים'+(files.length?', חסרים קבצים: '+files.slice(0,5).join(', '):', כל הקבצים ב-fx/')+(miss.length?' · סקילים/לחשים בלי אפקט: '+miss.join(', '):' · '+need.length+' אפקטים של סקילים, לחשים וחזרה הופעלו')+(mb.fxDrawOk===true?'':' · הציור נכשל: '+mb.fxDrawOk)+(!mb.fxAt?' · האפקט לא צויר בכלל!':mb.fxAt.on?' · על המסך ליד הגיבור':' · מחוץ למסך! '+JSON.stringify(mb.fxAt)))}
    check(mb.fixed&&!mb.fixed.length,'משחקי השאול: כל 15 הסקילים (5 ערכות) הוטלו בתרחיש קבוע'+(mb.fixed&&mb.fixed.length?' · לא הוטלו: '+mb.fixed.join(', '):'')+' · במשחק הבוטים ('+mb.kits+'): '+(mb.miss.length?'לא הגיעו ל: '+mb.miss.join(', '):'כולם'));
    {const r=mb.lib||{},got=r.got||['?'];check(!got.length&&r.wetOn&&r.wetOff&&r.glow&&r.draw===true,'משחקי השאול: משוב קרב מספריית האפקטים: '+(got.length?'חסר '+got.join(','):'יריה, פגיעה, חיתוך, CRIT!, רמה, הריגה ומגדל ✓')+(r.wetOn&&r.wetOff?' · סימן רטוב מופיע ונעלם':' · סימן רטוב ✗')+(r.glow?' · טבעות קבוצה':' · בלי טבעות קבוצה')+(r.draw===true?'':' · ציור נפל: '+r.draw))}
    {const u=mb.ultMed,mm=t=>t===undefined?'never':Math.floor(t/60)+':'+String(t%60).padStart(2,'0');check(u!==undefined&&u>=100&&u<=270,'משחקי השאול: חציון הסקיל-על של הבוטים ב-'+mm(u)+' (הראשון ב-'+mm(mb.ult1)+', '+(mb.ultN||0)+' מתוך '+mb.ultBots+' הגיעו. צריך בין 1:40 ל-4:30, אוראל 7.11: "סביב דקה 3-4")')}
    {const r=mb.fx||{};check(r.tank&&r.warrior&&r.shield&&r.cap&&r.stop&&r.ult,'משחקי השאול: טנק ולוחם מזנקים אל מטרה קצת רחוקה: '+(r.tank?'נפח ✓':'נפח ✗')+(r.warrior?' לוחם ✓':' לוחם ✗')+(r.shield?', מגן סופג':', המגן לא סופג')+' · פיצוצי: '+(r.cap?'חלקיקים מוגבלים':'חלקיקים בלי גבול')+(r.stop?', עצירת פריים בקריטי':', בלי עצירת פריים')+(r.ult?', רגע סקיל-על':', בלי רגע סקיל-על'))}
    {const d=mb.diff||{},r=mb.flow||{};
     check(d.n===3&&d.one&&d.saved&&d.back&&d.game&&r.diff,'משחקי השאול: קושי: '+(d.n===3?'3 כפתורים':(d.n||0)+' כפתורים')+(d.one?', אחד מסומן':', הסימון שגוי')+(d.saved&&d.back?', נשמר':', לא נשמר')+(d.game?', המשחק לפי הבחירה':', המשחק לא לפי הבחירה')+(r.diff?', משנה רק את המוח של האויבים':', לא משנה את הבוטים'));
     check(r.shield&&r.bounty&&r.resp&&r.late&&r.haste&&r.xp&&r.recall,'משחקי השאול: זרימה: '+[r.shield?'מגן מגדל בהתחלה ✓':'מגן מגדל ✗',r.bounty?'בלי זהב קאמבק ✓':'זהב קאמבק עוד קיים ✗',r.resp&&r.late?'חזרה מהירה בהתחלה ✓':'זמן חזרה ✗',r.haste?'ריצה מהבסיס ✓':'ריצה מהבסיס ✗',r.recall?'גם אחרי חזרה לבסיס ✓':'אחרי חזרה לבסיס ✗',r.xp?'XP ברדיוס רחב ✓':'XP ✗'].join(', '))}
    {const g=mb.gb||{};check(g.closed&&g.push&&g.tie&&g.enter&&g.busy&&g.lock&&g.win&&g.once&&g.lose,'משחקי השאול: חדר ההימור: '+(g.err?'שגיאה '+g.err+' · ':'')+[g.closed?'סגור לפני הזמן ✓':'פתוח לפני הזמן ✗',g.push?'אחר נדחף ✓':'אחר נכנס ✗',g.tie?'בשוויון אף אחד ✓':'שוויון ✗',
      g.enter?'הזכאי נכנס ✓':'הזכאי לא נכנס ✗',g.busy?'אחד בכל פעם ✓':'שניים יחד ✗',g.lock?'מקובע בהטלה ✓':'זז בהטלה ✗',g.win?'ניצחון = העשיר ביותר ✓':'ניצחון ✗',g.once?'פעם לקבוצה ✓':'יותר מפעם ✗',g.lose?'הפסד בלי פרס לאויב ✓':'הפסד ✗'].join(', '))}
    if(mb.wx&&mb.wx.ultY!=null)check(mb.wx.ultOk,'underworld: ult name above Recall: name '+mb.wx.ultY+'px, button '+mb.wx.recallTop+'px'+(mb.wx.ultOk?' ✓':' (on the button!)'));
    {const w=mb.wx;check(w&&w.rain&&w.build&&w.fall&&w.fog&&w.under&&w.draw===true,'משחקי השאול: מזג אוויר: גשם קל בהתחלה שמתחזק, ברק במגדל שנופל (לא בערפל), ומצויר מתחת לסקילים'+(w?' ('+w.ms+'ms)'+(w.draw!==true?' · '+w.draw:'')+['rain','build','fall','fog','under'].filter(k=>!w[k]).map(k=>' · '+k).join(''):' · לא נבדק'))}
    {const R=mb.newSk||{};check(R.gone&&!R.gone.length&&R.new,'משחקי השאול: אין יותר זינוק או ריפוי בסקילים (גל חרב, רשת ציד וכלא מים במקומם)'+(R.gone&&R.gone.length?' · עוד יש: '+R.gone.join(', '):''));
     check(R.root&&R.still&&R.atk&&R.free,'משחקי השאול: רשת ציד: לכוד '+(R.root?'✓':'✗')+', לא זז '+(R.still?'✓':'✗')+', תוקף '+(R.atk?'✓':'✗')+', ואחרי זה חסין לרגע '+(R.free?'✓':'✗'));
     check(R.bub&&R.shock&&R.cleave,'משחקי השאול: כלא מים מרים ומרטיב '+(R.bub?'✓':'✗')+', ברק אחריו = חשמול '+(R.shock?'✓':'✗')+' · גל חרב מהמם ומאט '+(R.cleave?'✓':'✗'))}
    const cb=mb.combo||{};check(cb.shock>0&&Math.abs(cb.k-cb.want)<0.01&&cb.freeze>0&&cb.frozen,'משחקי השאול: קומבו בתרחיש קבוע: חשמול '+(cb.shock?'✓ נזק ×'+cb.k:'לא קרה')+', קפוא '+(cb.freeze&&cb.frozen?'✓ הקפאה ארוכה':'לא קרה'));
    check(mb.cc.stun>0&&mb.cc.taunt>0,'משחקי השאול: שליטה בקהל על גיבורים: הלם '+mb.cc.stun+', הכרחה '+mb.cc.taunt+' · קומבו: חשמול '+(mb.cmb.shock||0)+', קפוא '+(mb.cmb.freeze||0));
    {const V=mb.vis||{},ks={far:'רחוק: לא מצויר ולא מכוונים',near:'נכנס לטווח: מופיע',bush:'בשיח: נסתר מהאויב',ally:'חבר בשיח: נראה, שקוף',same:'מאותו שיח: נראה',atk:'תקיפה חושפת לשנייה',rev:'חשיפת אזור'};
     check(Object.keys(ks).every(k=>V[k]),'משחקי השאול: ראייה ושיחים: '+Object.keys(ks).map(k=>ks[k]+(V[k]?' ✓':' ✗')).join(', '))}
    if(CFG.lang==='en')check(!mb.he,mb.he?'משחקי השאול: נשאר טקסט בעברית: '+mb.he:'משחקי השאול: באנגלית');
  }
  check(rmOk,'שמירה ישנה: עפרה (ore) עוברת לברזל בתרמיל, במחסן ובאיסוף של המכרה'+(rmOk?'':' ✗'));
  // מפתחות גולמיים על המסך, בכל מה שהבוט עבר (נסרק כל כמה צעדים, בכל צילום ובכל חלון של winOvl)
  {const rk=rawKeys;check(!rk.length,rk.length?'מפתח טקסט גולמי על המסך: '+rk.slice(0,8).join(', '):'אין מפתח טקסט גולמי על המסך (DOM וקנבס)')}
  if(winChk){const w=winChk,bad=Object.entries(w.wins).filter(([k,v])=>v.length);
    check(!bad.length&&!w.cover.length&&!w.open.length&&!(w.cut||[]).length,'חלונות לרוחב: '+Object.keys(w.wins).join(', ')+(bad.length?' · יושבים זה על זה: '+bad.map(([k,v])=>k+': '+v.slice(0,4).join(', ')).join(' | '):', שום דבר לא יושב על משהו אחר')+
      (w.cover.length?' · כרטיס "חדש" מעל: '+w.cover.join(', '):', כרטיס "חדש" לא מכסה חלון')+(w.open.length?' · לא נפתחו: '+w.open.join(', '):'')+((w.cut||[]).length?' · תוכן חתוך בלי סימן שיש עוד: '+w.cut.join(', '):', בלי תוכן חתוך'))}
  else check(false,'חלונות לרוחב: הבדיקה לא רצה');
  check(!fxOver.length,'אפקטים בממשק לא יושבים על חלון פתוח או על כרטיס עם טקסט (עלית רמה ועוד, FXUI.cards) בשום צילום'+(fxOver.length?': '+fxOver.join(' · '):''));
  check(errors.length===0,errors.length?'שגיאות בקונסול:\n    '+[...new Set(errors)].join('\n    '):'אין שגיאות בקונסול');

  console.log('ריצה: seed '+CFG.seed+', '+t(L.t)+' זמן משחק'+(CFG.god?', עם חסינות':'')+(CFG.lang==='en'?', באנגלית':'')+(CFG.gfx==='2d'?', בדו-ממד':', בתלת-ממד')+(CFG.shots?', צילומים ב-'+CFG.shots:''));
  console.log(results.join('\n'));
  process.exit(results.some(r=>r.startsWith('✗'))?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
