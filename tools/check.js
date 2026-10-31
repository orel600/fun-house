/* בדיקה אוטומטית: פותח את המשחק בדפדפן ללא ממשק בגודל טלפון לרוחב, בוט משחק עד אחרי הבוס, ובסוף דוח.
   הבוט בוחר דמות התחלה, מתחיל בכפר (מקבל קווסט, בונה, אוסף תוצרת, יוצא בשער), יוצא לעולם הפתוח (כורת עץ, מפיל אויב, נכנס לזירה בשער),
   משחק בזירה עד אחרי הבוס, חוזר לאותו שער עם השלל, נופל בעולם ובודק שאבד חצי מהמשאבים, קם בכפר ולוקח את פרס הקווסט.
   הרצה: node tools/check.js
   אפשרויות: --time 480   כמה שניות משחק לשחק, לכל היותר (הריצה נגמרת כשהבוס בסוף מובס)
             --seed 7     אותו מספר = אותה ריצה בדיוק, כדי לשחזר באג או להשוות לפני ואחרי שינוי
             --real       בלי חסינות: הבוט יכול למות, כדי לבדוק קושי ולא רק קריסות
             --shots      צילומי מסך לתיקייה tools/shots
             --skin nomad הדמות לובשת סקין מ-SKINS, כדי לראות עיצוב חדש בצילומים
             --lang en    משחק באנגלית, ונכשל אם על המסך מופיע טקסט בעברית
             --gfx 2d     משחק בדו-ממד. ברירת המחדל: תלת-ממד, ונכשל אם הוא לא עלה
   הזמן במשחק מואץ בשעון מזויף, אז ריצה של שש דקות לוקחת דקה-שתיים. */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');

const args=process.argv.slice(2);
const opt=k=>{const i=args.indexOf('--'+k);if(i<0)return null;const v=args[i+1];return v&&!v.startsWith('--')?v:true};
const CFG={
  time:+(opt('time')||480),
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
    const sv=JSON.parse(localStorage.getItem(SAVE_STORE.key));L.heroStart=sv.hero.start;L.heroW=SAVE.gear.weapon;L.heroVil=!!S.vil&&document.getElementById('ovHero').hidden;return L}
  // שדרוגים: מול הבוס, סוג הנזק שהוא חלש אליו. אחרת סוג נזק לנשק שעוד אין לו, ושונה מהנשק השני, כדי שהריצה תפגע בכמה סוגים
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
  L.marks=document.querySelectorAll('#runbar .mk').length;L.marksDone=document.querySelectorAll('#runbar .mk.done').length;
  L.stations=S.run.log.map(s=>s.kind+'@'+Math.round(s.t)).join(' ');L.elites=S.run.elites;L.nStations=RUN.stations.length;
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
  L.swapBtn=document.getElementById('swap').hidden===(wHeld().length<2);L.nHeld=wHeld().length;
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
    L.nodes=S.nd.broken;L.nodeGot=[...new Set(S.nd.got)].join(', ');if(S.nd.broken)L.nodeAt??=at;
    L.nodeInLoot=S.nd.got.length>0&&S.nd.got.every(r=>(S.loot||{})[r]>0||drops().some(d=>!d.got&&d.r===r));   // או שעוד שוכב על הרצפה (drops.js), ונאסף בסוף לבד
    L.gearDrops=S.gearDrops||0;
    L.drops=(S.drops||[0,0,0,0,0]).join('/');L.elites=S.elites||0;L.jackpots=S.jackpots||0;L.firstKills=S.firstKills||0;
    L.chests=S.nd.got.length?S.nd.chests||0:0;L.creatures=Object.entries(S.killsBy||{}).filter(([k])=>ETYPES[k]&&!['grunt','shield','wisp'].includes(k)).map(([k,n])=>k+' '+n).join(', ');
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
      // כמו שחקן אמיתי: מנקים את המגינים שהוא מזמן עם הנשק הנכון להם, ואת הבוס עם הנשק שסוג הנזק שלו הכי טוב נגדו
      if(!m.faced&&b.rage<0.99){tx=b.x;ty=b.y;flee=true}
      else{
        if(!m.faced)m.faced=S.t;L.rageLow=Math.min(L.rageLow??1,b.rage);
        const n=nearest(130);useWeapon(best(n&&!n.isBoss?n:b));
        tx=b.x;ty=b.y;stop=P.weapon==='sword'?b.r+30:240;
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
      const n=nearest(220);
      if(n){tx=n.x;ty=n.y;flee=true}
      if(wHeld().length>1&&(document.getElementById('swap').classList.contains('hint')||S.t-m.swapAt>10)){swapWeapon();L.swaps++;m.swapAt=S.t}
    }
  }
  return steer(tx,ty,flee,stop,L);
}
// הגוף פונה לאן שהולכים (P.face, update.js). אחרי צעד שלם של הליכה (P.walk התקדם כל הצעד, והג'ויסטיק לא השתנה בו),
// הזווית צריכה להיות בדיוק כיוון הג'ויסטיק, גם בזירה כשיש אויב קרוב. בכפר בודקים גם את הדמות בתלת-ממד
function faceStep(m,L){
  const F=L.face||(L.face={n:0,bad:0,max:0,arena:0,n3:0,bad3:0}),dw=P.walk-(m.fw??P.walk);m.fw=P.walk;
  if(!joy||!P.moving||S.mode!=='play'||P.power>0||dw<P.speed*0.07*0.19)return;
  const d=Math.abs(angDiff(P.face,Math.atan2(joy.dy,joy.dx)));
  F.n++;if(!S.vil&&!S.wd&&!S.room&&nearest(440))F.arena++;F.max=Math.max(F.max,Math.round(d*100)/100);if(d>0.1)F.bad++;   // 0.1 רדיאנים: כ-6 מעלות, לא רואים בעין;
  if(R3D.on&&S.vil&&R3D.player){F.n3++;if(Math.abs(angDiff(R3D.player.root.rotation.y,yawOf(Math.cos(P.face),Math.sin(P.face))))>0.15)F.bad3++}
}
/* חיית המחמד (pet.js): כמה פעמים היא קרובה לשחקן, באילו מצבים נראתה, ושהחפירה מוציאה שלל לרצפה.
   בעולם הפתוח היא חופרת מיד (בלי לחכות לזמן), ואחרי החפירה הראשונה מוסיפים לה XP בכוח, פעמיים, ובודקים שהיא עוברת את שני השלבים ונשמרת */
function petBot(m,L){
  const p=S.pet,Q=L.pet||(L.pet={n:0,near:0,st:{},digs:0,dug:[],drop:false,evo:null});if(!p||!petHere())return;
  if(S.mode==='play'&&p.st!=='go'&&p.st!=='dig'&&p.st!=='jump'){Q.n++;if(Math.hypot(p.x-P.x,p.y-P.y)<200)Q.near++}
  Q.st[p.st]=(Q.st[p.st]||0)+1;
  if(R3D.on&&R3D.pet){Q.r3=R3D.pet.root.visible;Q.clips=Object.values(DOG_ANIM).filter(c=>!R3D.clips[c]).join(',')||'ok'}
  if(S.wd&&!m.petDig&&S.mode==='play'){m.petDig=1;p.digT=0}
  if(p!==m.petP){m.petP=p;m.petDigs0=Q.digs}
  Q.digs=m.petDigs0+p.digs;if(p.dug.length)Q.dug=[...new Set([...Q.dug,...p.dug])];
  if((S.gd||[]).some(d=>d.pet))Q.drop=true;
  if(Q.digs&&!m.petEvo&&S.mode==='play'){   // XP בכוח: שלב 1 → 2 → 3
    const st=petKind().stages,a=SAVE.pet.stage;petXP(st[1].xp-SAVE.pet.xp);const b=SAVE.pet.stage;petXP(st[2].xp-SAVE.pet.xp);
    m.petEvo=1;Q.evo=[a,b,SAVE.pet.stage].map(s=>s+1).join('→');Q.evoSaved=JSON.parse(localStorage.getItem(SAVE_STORE.key)).pet.stage===2;Q.evoFx=FX.length>0}
  if(SAVE.pet.stage===2&&S.mode==='play')Q.fxOk=!R3D.on||!!PET_FX.tail;   // בתלת-ממד: הלהבה בקצה הזנב יודעת איפה הזנב
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
    else if(L.boots==null){   // פרס הנעליים: נלבשות מיד, והמהירות עולה
      document.getElementById('qBtn').click();const b=document.querySelector('#qLog [data-q="boots"][data-act="claim"]'),sp=P.speed;
      if(b)b.click();const k=1+GEAR.items.starterBoots.stats.speed/100;
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
    if(S.vil.near==='mill'){const before=bag(),btn=document.querySelector('#vPanel [data-act="up"]');L.panel=document.getElementById('vPanel').innerText.split('\n')[0];
      if(btn&&!btn.disabled){btn.click();L.built=vLv('mill');L.fx=FX.length>0&&vLook('mill')===null;L.paid=Object.keys(before).filter(r=>(SAVE.bag[r]||0)<before[r]).map(r=>r+' -'+(before[r]-(SAVE.bag[r]||0))).join(', ');
        L.builtSaved=JSON.parse(localStorage.getItem(SAVE_STORE.key)).village.mill===1}else L.built=0}
    return steer(B.x,B.y,false,0,L)}
  if(!m.away){   // כאילו השחקן לא שיחק שעתיים: התוצרת מצטברת עד המחסן
    m.away=1;m.wood=SAVE.bag.wood||0;vProd('mill').t-=2*3600e3;L.expect=Math.min(B.cap[1],B.make.wood[1]*2);return steer(B.x,B.y,false,0,L)}
  if(L.collected==null){   // ליד המנסרה: מחכים לעדכון המלאי, ולוחצים "לאסוף" בפאנל
    const cb=S.vil.near==='mill'&&document.querySelector('#vPanel [data-act="collect"]');
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
  if(m.npc!==3){   // תושבים: הולכים לנפח, לוחצים "לדבר", מקבלים ממנו קווסט, ורואים אותו ביומן. בודקים שהם לא חוסמים, ושהוא מריע לשדרוג
    const n=npcAt('smith'),dlg=document.getElementById('npcDlg'),tb=document.getElementById('talkBtn');
    if(!n){L.npc={err:'אין נפח'};m.npc=3;return L}
    if(!m.npc){
      if(S.vil.npcNear!=='smith'||tb.hidden)return steer(n.x,n.y,false,25,L);
      const N=L.npc={waved:n.waved,btn:tb.innerText,auto:!dlg.hidden};tb.click();
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
  m.runBag=bag();L.gateAt=1;   // לשער
  // עומדים בשער ודוחפים לתוכו כשנייה: זה לא אמור להוציא מהכפר. רק לחיצה על הכפתור בפאנל מוציאה לעולם
  if(S.vil.gate&&++m.atGate>=5){L.gateNoRun=!!S.vil;const go=document.querySelector('#vPanel [data-act="go"]');L.gateBtn=go?go.innerText:null;if(go)go.click()}
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
  if(!m.hitHook){m.hitHook=1;const d0=damage;damage=function(e,b,w,a,t,ch){if(S.wd&&!ch){const d=Math.hypot(e.x-P.x,e.y-P.y)-(e.r||0);L.wHitMax=Math.max(L.wHitMax||0,Math.round(d));L.wHits=(L.wHits||0)+1}return d0.apply(this,arguments)}}
  L.wRange=WORLD.attackRange;
  if(!m.wp){m.wp='gather';L.wEnter=!S.vil&&S.mode==='play';L.wName=document.getElementById('wName').textContent;L.wHud=vis('whud')&&!vis('vhud');
    L.wNodes=S.nd.list.length;L.wFoes=enemies.length;L.wCreatures=enemies.filter(e=>e.creature).length;m.w0=SAVE.bag.wood||0;m.wt=W.t;
    // המפלצות הראשונות ליד השער: קלות. אחת נזרקת רחוק מהבית שלה (צריכה לחזור), וקבוצה אחת מופלת (צריכה לחזור אחרי זמן)
    const st=enemies.filter(e=>e.zone==='start'),gi=G=>WORLD.foes.indexOf(G),home=e=>WORLD.foes[e.home];
    L.wStart={n:st.length,easy:st.length>0&&st.every(e=>e.dmg<=ETYPES[e.type].dmg*0.5&&e.max<ETYPES[e.type].hp&&e.speed<ETYPES[e.type].speed),
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
    if(S.kills>m.k0){L.wKill=m.kt;m.wp='wnpc';return L}
    const pool=enemies.filter(e=>!e.dead&&!e.wanted),cr=pool.filter(e=>e.creature),e=(cr.length?cr:pool).sort(far)[0];if(!e)return stay();
    m.kt=e.type+(e.creature?' (יצור)':'');return steer(e.x,e.y,false,P.weapon==='sword'?e.r+30:200,L)}
  if(m.wp==='wnpc'){   // דמות בעולם (worldnpc.js): הולכים לקרובה, היא נמצאת (נשמר, חגיגה, חץ), מדברים, מקבלים קווסט, משלימים ולוקחים פרס רק אצלה
    const N=L.wn||(L.wn={}),tb=document.getElementById('talkBtn'),dlg=document.getElementById('npcDlg'),btn=a=>dlg.querySelector('[data-act="'+a+'"]');
    if(!m.wn){const id=Object.keys(WNPC.list).sort((a,b)=>far(WNPC.list[a].at,WNPC.list[b].at))[0];if(!window.__cel){window.__cel=0;const c=celebrate;window.celebrate=(...a)=>{window.__cel++;return c(...a)}}m.wn={id,step:0,fx:window.__cel};N.id=id;N.n=Object.keys(WNPC.list).length;N.metBefore=!!SAVE.met[id];N.markBefore=wnpcMarks()[id]||null}
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
      const other=Object.keys(WNPC.list).find(k=>!SAVE.met[k]);N.hidden=!other||(!wnpcMarks()[other]&&!QUESTS.list.some(q=>q.giver===other&&qOpen(q)));
      L.wnDone=1;m.wp='gate';return L}
  }
  if(m.wp==='gate'){   // שער החורשה: נכנסים רק בלחיצה על הכפתור בפאנל
    const g=WORLD.gates.grove,go=document.querySelector('#wPanel [data-act="arena"][data-g="grove"]');
    if(W.near==='grove'&&go&&(L.wFoeBack!=null||W.t-m.wt>90)){L.wPicked=dropStats().picked;m.runBag=bag();L.wGateBtn=go.innerText;go.click();L.wArena=!S.wd&&S.mode==='play';m.wp='arena';return L}
    return steer(g.x,g.y,false,0,L)}
  if(m.wp==='arena'){   // חזרנו מהזירה: לאותו שער, והשלל בתרמיל
    const g=WORLD.gates.grove;L.wBack=Math.round(Math.hypot(P.x-g.x,P.y-g.y));L.back=S.t;
    const now=bag(),got=[];for(const r in now){const d=now[r]-(m.runBag[r]||0);if(d>0)got.push(r+' +'+d)}
    L.lootGot=got.join(', ');L.lootSaved=JSON.stringify(saved().bag)===JSON.stringify(SAVE.bag);
    const st=saved().hero.style;L.style={};for(const k in st)L.style[k]=Math.round(st[k]);   // סגנון המשחק, כפי שנשמר
    m.wp='die';return stay()}
  if(m.wp==='die'){   // נופלים בכוונה, עם משאבים ופריט בתרמיל ומשהו במחסן
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
    const srv=require('http').createServer((q,r)=>{let f=decodeURIComponent(q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';f=path.join(root,path.normalize(f));
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
    pw.errs=perr;await ctx.close();srv.close();
  }catch(e){pw.crash=e.message}
  check(!pw.crash&&!pw.bad.length,'אפליקציה: '+(pw.crash?'הבדיקה נפלה: '+pw.crash:pw.bad.length?'בעיות ב-manifest: '+pw.bad.join(', '):'manifest תקין, לרוחב, עם אייקונים 192/512 ו-maskable'));
  check(pw.file==='file','אפליקציה: מ-file:// '+(pw.file==='file'?'אין service worker':'ניסה לרשום service worker ('+pw.file+')'));
  if(!pw.crash)check(pw.http&&pw.http.state==='ok'&&pw.http.active&&pw.http.n>40&&!pw.errs.length,'אפליקציה: משרת http '+(pw.http&&pw.http.active?'ה-service worker נרשם ושמר '+pw.http.n+' קבצים ('+pw.http.cache+')':'ה-service worker לא נרשם ('+(pw.http&&pw.http.state)+')')+(pw.errs.length?' · שגיאות: '+[...new Set(pw.errs)].join(' | '):''));
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
    // 3. מכשיר שני (בלי התקדמות) לוקח את השמירה מהחשבון
    const g='u90';F.google[g]='Nir';const far=JSON.parse(bak);far.hero.xp=(SAVE.hero.xp||0)+5000;far.hero.level=9;far.village.forge=5;far.ts=1;F.rows[g]={data:far};
    const mine=JSON.stringify(SAVE);SAVE=saveBlank();r.second=await cloudBack(F.back(g))==='cloud'&&SAVE.village.forge===5&&CLOUD.status==='ok';
    // 4. שתי שמירות שונות מאוד: שואלים, והשחקן בוחר את הטלפון. הטלפון נשמר ונדחף לחשבון
    SAVE=JSON.parse(mine);SAVE.hero.xp=1;saveNow();CLOUD.session=null;localStorage.removeItem(CLOUD.lsKey);await cloudGoogle(true);
    const pr=cloudBack(F.back(g));for(let i=0;i<500&&document.getElementById("ovCloud").hidden;i++)await Promise.resolve();const ov=document.getElementById('ovCloud');r.ask=!ov.hidden&&/9/.test(document.getElementById('cloudAcct').textContent);
    document.getElementById('cloudPhone').click();r.kept=await pr==='phone'&&ov.hidden&&F.rows[g].data.hero.xp===1&&SAVE.village.forge!==5;
    // 5. התנתקות: הכניסה נמחקת מהטלפון, השמירה נשארת
    const wood=SAVE.bag.wood;document.getElementById("cloudOut").click();for(let i=0;i<500&&CLOUD.session;i++)await Promise.resolve();
    r.out=!CLOUD.session&&!localStorage.getItem(CLOUD.lsKey)&&F.calls.includes('POST /auth/v1/logout')&&SAVE.bag.wood===wood&&document.getElementById('cloudOut').hidden&&CLOUD.status==='off';
    SAVE=JSON.parse(bak);SAVE_STORE.write(SAVE,true);CLOUD.fake=cloudFakeServer();CLOUD.session=null;CLOUD.dirty=false;r.p0=CLOUD.pushes;return r});
  cl.p0=gl.p0;
  check(gl.parse&&gl.btnFile,'ענן: כתובת החזרה מ-Google '+(gl.parse?'נקראת':'לא נקראה')+', '+(gl.btnFile?'ומ-file:// אין כפתור כניסה':'וכפתור הכניסה מופיע גם מ-file://'));
  check(gl.link&&gl.linked,'ענן: Google '+(gl.link?'מתחבר למשתמש הזמני':'לא ניסה להתחבר')+', '+(gl.linked?'אותה שמירה, והסמל אומר "מחובר כ-"':'בחזרה משהו לא עבד'));
  check(gl.relink,'ענן: כשהחיבור נכשל '+(gl.relink?'עוברים לכניסה רגילה עם Google':'נתקע'));
  check(gl.second,'ענן: מכשיר שני '+(gl.second?'לוקח את השמירה מהחשבון':'לא לקח את השמירה'));
  check(gl.ask&&gl.kept,'ענן: שתי שמירות שונות '+(gl.ask?'השחקן נשאל':'לא נשאל')+', '+(gl.kept?'ומה שבחר נשמר':'הבחירה לא נשמרה'));
  check(gl.out,'ענן: התנתקות '+(gl.out?'מוחקת את הכניסה ומשאירה את השמירה':'לא עבדה'));
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
    for(const t in ETYPES)if(!['grunt','shield','wisp'].includes(t)&&(!guards.has(t)||!LOOK3D[t]||!(ETYPES[t].tags||[]).length))lost.push(t);
    for(const b in BOSSES)add(src,BOSSES[b].drop,'boss:'+b);
    add(src,WANTED.drop,'wanted');WANTED.loot.forEach(l=>add(src,l.res,'wanted:'+l.key));
    add(src,BONUS.roomRes,'room');
    // פרסים של קווסטים הם עוד מקור, ומשאב שקווסט מבקש להביא חייב להיות קיים (quests.js)
    for(const q of QUESTS.list){add(src,Object.fromEntries(Object.entries(q.reward||{}).filter(([k])=>k!=='xp'&&k!=='item'&&k!=='rank')),'quest:'+q.id);
      for(const o of q.obj)if(o.type==='collect'&&o.what!=='coins'&&!resOf(o.what))bad.add(o.what+' (quest:'+q.id+')')}
    const placed=new Set(Object.values(NODES.arenas).flatMap(a=>a.spawn.map(s=>s.kind)));
    for(const k in NODES.kinds)if(placed.has(k))add(src,NODES.kinds[k].drop,'node:'+k);
    for(const k in PET.kinds)PET.kinds[k].stages.forEach((s,i)=>add(src,s.dig.loot,'pet:'+k+(i+1)));   // החפירה של חיית המחמד (pet.js)
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
  const qe=await page.evaluate(()=>{const Q=SAVE.quests,by=id=>QUESTS.list.find(q=>q.id===id);questsRefresh();
    const daily=Q.daily.length===QUESTS.daily&&Q.daily.every(id=>Q.active[id]);
    const ach=QUESTS.list.filter(q=>q.kind==='achievement').every(q=>Q.active[q.id]);
    const old=Q.daily.slice();for(const id of old)Q.active[id].p[0]=1;Q.day='1999-1-1';questsRefresh();
    const day=Q.daily.length===QUESTS.daily&&Q.daily.every(id=>Q.active[id]&&Q.active[id].p.every(v=>v===0))&&old.filter(id=>!Q.daily.includes(id)).every(id=>!Q.active[id]);
    S.boss={};questEvent('hurt');S.boss=null;questEvent('win');const hit=!qReady(by('aClean'));S.q.bossHit=0;questEvent('win');const clean=qReady(by('aClean'));
    qStart(by('firstMill'));SAVE.village.mill=1;questEvent('upgrade','mill');const up=qReady(by('firstMill'));
    qStart(by('wFirst'));questEvent('reach','world');questEvent('gather','wood',6);questEvent('collect','wood',9);const wHalf=!qReady(by('wFirst'));questEvent('gather','wood',4);const world=wHalf&&qReady(by('wFirst'));
    localStorage.removeItem(SAVE_STORE.key);saveLoad();S.q=null;$('qTrack').hidden=true;$('qTrack').textContent='';   // קו המעקב נכתב כאן בעברית, לפני שהבדיקה באנגלית מחליפה שפה
    return{daily,ach,day,noHit:hit&&clean,up,world}});
  check(qe.daily&&qe.ach&&qe.day&&qe.noHit&&qe.up&&qe.world,'מנוע קווסטים: '+(qe.daily?'4 יומיים':'יומיים לא נבחרו')+', '+(qe.day?'מתחלפים ביום חדש':'לא מתחלפים ביום חדש')+', '+
    (qe.ach?'הישגים פעילים':'הישגים לא פעילים')+', '+(qe.noHit?'ניצחון בלי פגיעה נבדק':'ניצחון בלי פגיעה שבור')+', '+(qe.up?'שדרוג מבנה נספר':'שדרוג מבנה לא נספר')+', '+(qe.world?'יציאה לעולם ואיסוף בו נספרים':'אירועי העולם לא נספרים'));
  // דרגות (ranks.js): רמה 20 פותחת קווסט דרגה אצל הכוהנת, הסגנון קובע איזו דרגה, ולקיחת הפרס שומרת אותה, מפעילה טקס ומוסיפה בונוס קבוע. בסוף מנקים
  const rk=await page.evaluate(()=>{const q=QUESTS.list.find(q=>q.kind==='rank'),mode=S.mode,r={every:RANKS.every};
    r.locked=!qOpen(q);
    SAVE.hero.xp=0;for(let l=1;l<RANKS.every;l++)SAVE.hero.xp+=rankNeed(l);rankSync();r.lv=SAVE.hero.level;
    r.open=qOpen(q)&&q.giver==='priest';
    const sty=st=>{SAVE.hero.style=st;return rankFor(1)};
    const picks={knight:sty({dmg_sword:900,dmg_gun:100,t_run:100}),ranger:sty({dmg_sword:50,dmg_gun:900,t_run:100}),
      hybrid:sty({dmg_sword:500,dmg_gun:500,t_run:100}),guardian:sty({dmg_sword:900,t_run:100,t_defense:80})};
    r.picks=Object.keys(picks).map(k=>k+'→'+picks[k]).join(', ');r.style=Object.keys(picks).every(k=>picks[k]===k);
    sty({dmg_sword:900,dmg_gun:50,t_run:100});   // בעיקר חרב: אביר
    questLogOpen(true);const acc=document.querySelector('#qLog [data-q="'+q.id+'"][data-act="accept"]');if(acc)acc.click();
    questLog();r.accepted=!!SAVE.quests.active[q.id];r.card=(document.querySelector('#qLog [data-q="'+q.id+'"]')||{closest:()=>null}).closest('.qc');
    r.card=r.card?r.card.innerText.includes(rankName('knight')):false;
    questEvent('collect','bone',30);S.q={bossHit:0};S.boss=null;questEvent('win');
    questLog();const hp=P.maxHp,cl=document.querySelector('#qLog [data-q="'+q.id+'"][data-act="claim"]');if(cl)cl.click();
    r.claimed=!!cl&&SAVE.quests.done[q.id]===1;r.rank=SAVE.hero.rankId;r.hp=P.maxHp-hp;r.want=RANKS.list.knight.bonus.hp;
    r.fx=FX.some(f=>f.K===CELEBRATE.rank);
    const sv=JSON.parse(localStorage.getItem(SAVE_STORE.key));r.saved=sv.hero.rankId==='knight'&&sv.hero.rank===1;
    SAVE.hero.rankId=null;reset();const base=P.maxHp;SAVE.hero.rankId='knight';reset();r.kept=P.maxHp-base;
    r.label=rankLabel();
    // שריון לפי דרגה (rankArmor3d ב-render3d.js): בתלת-ממד, החלקים של הדרגה מוסתרים לפני ונדלקים אחרי. בדו-ממד אין מה לבדוק
    if(R3D.on&&R3D.ready){
      const vis=all=>{syncPlayer(0);const v=new Set();R3D.player.root.traverse(o=>{const p=o.isMesh&&armorPart(o,ARMOR3D);if(p&&(all||o.visible))v.add(p)});return v};
      const look=RANKS.list.knight.look,has=vis(true),want=look.show.filter(p=>has.has(p));
      SAVE.hero.rankId=null;const before=vis();SAVE.hero.rankId='knight';const after=vis();
      let glow=false;R3D.player.root.traverse(o=>{if(o.isMesh&&o.visible&&armorPart(o,look.show)&&o.material.emissive.getHex())glow=true});
      r.armor={model:R3D.player.L.model,want:want.join('+')||'-',before:[...before].join('+')||'-',after:[...after].join('+')||'-',glow,
        ok:want.length>0&&want.every(p=>!before.has(p)&&after.has(p))&&glow};
    }
    questLogOpen(false);localStorage.removeItem(SAVE_STORE.key);saveLoad();reset();S.mode=mode;S.q=null;FX=[];
    $('qTrack').hidden=true;$('qTrack').textContent='';document.getElementById('banner').textContent='';
    return r});
  check(rk.locked&&rk.lv===rk.every&&rk.open&&rk.style,'דרגות: '+(rk.locked?'נעול לפני רמה '+rk.every:'פתוח מוקדם מדי')+', '+(rk.open?'ברמה '+rk.lv+' נפתח קווסט אצל הכוהנת':'לא נפתח ברמה '+rk.lv)+
    ' · לפי סגנון: '+rk.picks);
  check(rk.accepted&&rk.card&&rk.claimed&&rk.rank==='knight'&&rk.saved&&rk.fx&&rk.hp===rk.want&&rk.kept===rk.want,'קווסט דרגה: '+(rk.accepted?'התקבל':'לא התקבל')+(rk.card?', הכרטיס מראה "אביר"':', הכרטיס לא מראה את הדרגה')+
    (rk.claimed?', הושלם ונלקח':', הפרס לא נלקח')+', דרגה: '+(rk.label||'-')+(rk.saved?', נשמרה':', לא נשמרה')+(rk.fx?', טקס':', בלי טקס')+
    ', חיים +'+rk.hp+' מיד ו-+'+rk.kept+' בכל ריצה (צפוי +'+rk.want+')');
  if(rk.armor)check(rk.armor.ok,'שריון לפי דרגה ('+rk.armor.model+'): לפני הדרגה '+rk.armor.before+', אחרי '+rk.armor.after+' (צפוי שיופיעו '+rk.armor.want+')'+(rk.armor.glow?', זוהר בצבע הדרגה':', בלי זוהר'));
  else results.push('· שריון לפי דרגה: דו-ממד, אין מה לבדוק');
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
  // חפצים מסתובבים (orbit.js): כל החמישה לבושים, ואויב, יריית אויב ומכה מגיעים אליהם. רק בזירה, אז הכפר מושהה לרגע. אחר כך הכל חוזר
  const ob=await page.evaluate(()=>{const bak={orb:SAVE.gear.orbit.slice(),lv:SAVE.hero.level,vil:S.vil,wd:S.wd,room:S.room,mode:S.mode,o:S.orb,hp:P.hp,inv:P.inv,t:S.t},c=HITFX.crit;
    HITFX.crit=0;S.vil=S.wd=S.room=null;S.mode='play';SAVE.hero.level=99;SAVE.gear.orbit=['emberOrb','frostOrb','stoneOrb','leafOrb','cloverOrb'];
    orbitReset();orbitUpdate(0);const r={types:S.orb.types.join(','),crit:orbitCrit(),luck:orbitLuck()};
    const mk=i=>{const p=S.orb.pos[i],e=addEnemy('grunt',p.x,p.y);e.mult={};e.hp=e.max=1e9;return e};
    const e1=mk(0),e2=mk(1);orbitUpdate(0);r.fire=e1.hp<e1.max&&!!e1.burn;r.slow=e2.slow>0;   // כדור האש והכפור בדיוק על אויב
    const s=S.orb.pos[2];eb.push({x:s.x,y:s.y,vx:0,vy:0,r:6,dmg:5,life:2});orbitUpdate(0);r.block=S.orb.blocked>0;
    P.inv=0;const h0=P.hp;hurt(10);r.shield=P.hp===h0&&S.orb.shields===1;P.inv=0;hurt(10);r.shieldOnce=P.hp<h0;
    P.hp=P.maxHp/2;S.t+=ORBIT.types.support.heal.every+0.1;orbitUpdate(0);r.heal=P.hp>P.maxHp/2;
    try{drawOrbits();r.draw=true}catch(err){r.draw=String(err)}
    e1.dead=e2.dead=true;enemies=enemies.filter(e=>!e.dead);eb=eb.filter(b=>b.life>0);
    SAVE.gear.orbit=bak.orb;SAVE.hero.level=bak.lv;S.vil=bak.vil;S.wd=bak.wd;S.room=bak.room;S.mode=bak.mode;S.orb=bak.o;P.hp=bak.hp;P.inv=bak.inv;S.t=bak.t;HITFX.crit=c;return r});

  // כל דמות התחלה לשתי שניות מול אויב אחד: איך היא תוקפת, מה עף, ואיזו הנפשה. אחר כך הכל חוזר כמו שהיה
  const heroes=await page.evaluate(()=>{const bak=JSON.stringify(SAVE),mode=S.mode,out={};
    const W3={sword:'Melee_1H_Attack_Slice_Horizontal',bow:'Ranged_Bow_Release',staff:'Ranged_Magic_Shoot'};   // ההנפשה שכל נשק צריך (GRIP3D)
    for(const id in HEROES.list){
      SAVE.hero.start=id;SAVE.gear.weapon=HEROES.list[id].weapon;reset();S.mode='play';S.spawnT=S.hordeT=1e9;
      const e=addEnemy('grunt',P.x+60,P.y);e.hp=e.max=1e9;let swings=0,homed=false;const shots=new Set();
      for(let i=0;i<120;i++){const a=P.sw.anim;P.hp=P.maxHp;update(1/60);if(P.sw.anim>a)swings++;
        for(const b of pb){shots.add(b.shot);if(b.home)homed=true}}
      out[id]={wt:P.wt,swings,shots:[...shots].join('+')||'-',homed,hit:e.hp<e.max,swapHidden:document.getElementById('swap').hidden,
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

  await page.addScriptTag({content:steer+'\n'+faceStep+'\n'+petBot+'\n'+villageBot+'\n'+worldBot});   // עוזרים של הבוט, בתוך הדף
  let L={},took={},guard=0;
  while(guard++<CFG.time*30){
    await page.clock.runFor(CFG.step);
    // התקדמות ל-stderr (לא נכנס לדוח): אם הבדיקה נתקעת ב-GitHub, רואים איפה
    if(guard%300===1)console.error('…',await page.evaluate(()=>[Math.round(S.t),S.mode,S.vil?'village':S.wd?'world':S.room?'room':'arena',enemies.length,S.nd?S.nd.list.length:0].join(' ')));
    L=await page.evaluate(botStep,{god:CFG.god,en:CFG.lang==='en'});
    for(const k of ['vilOpen','qAccepted','npcTalk','built','collected','gearOpen','ageOpen','glowOn','stash','wEnter','wGather','wKill','wnDone','wArena','rgOpen','door','room','wanted','boss','bossDown','lootTxt','back','wDeathTxt','qClaimed'])if(L[k]!=null&&!took[k]){took[k]=1;await shot(k==='vilOpen'?'village':k==='lootTxt'?'loot':k==='qAccepted'?'quests':k==='npcTalk'?'npc':k==='wEnter'?'world':k==='wnDone'?'world-npc':k==='wDeathTxt'?'world-death':k)}
    if(L.qClaimed!=null||L.t>=CFG.time)break;   // חזרנו לכפר ולקחנו את פרס הקווסט: אין עוד מה לבדוק
  }
  await shot('end');
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
  const cp=await page.evaluate(()=>({n:CLOUD.pushes,every:CLOUD.pushEvery}));
  check(cp.n>cl.p0,'ענן: במשחק עצמו נדחפו '+(cp.n-cl.p0)+' שמירות לענן (המדומה), לכל היותר אחת בכל '+cp.every+' שניות');
  // בפעם השנייה מסך הפתיחה מוביל ישר לכפר, בלי בחירת דמות
  const again=await page.evaluate(()=>{document.getElementById('startBtn').click();return document.getElementById('ovHero').hidden&&!!S.vil});
  const heroHp=await page.evaluate(()=>HEROES.list.warrior.passive.hp);
  // הממשק (js/ui.js): בטלפון שוכב ועומד, הכפתורים בפס העליון ובסרגל למטה לא נוגעים זה בזה ולא יוצאים מהמסך,
  // וכל חלון שנפתח נסגר ב-✕ גלוי (44px לפחות) וחוזרים למשחק. גם Esc, לחיצה על הרקע, ונגיעה במשחק
  const UIV={land:CFG.phone,port:{width:412,height:915}},uiR={};
  const uiMeasure=place=>{const vis=e=>{if(!e||e.closest('[hidden]'))return null;const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'?r:null};
    const hit=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1,W=innerWidth,H=innerHeight;
    const box=sel=>[...document.querySelectorAll(sel)].map(e=>({n:e.id||(e.className.split(' ')[0]+(e.dataset.tip?':'+e.dataset.tip:'')),r:vis(e)})).filter(x=>x.r);
    const els=box(place==='world'?'#muteBtn,.hud .hp,#wBag .res,#wBag .resmore,#nav .nbtn':'#muteBtn,#vBag .res,#vBag .resmore,#nav .nbtn'),bad=[],off=[];
    els.forEach((a,i)=>els.slice(i+1).forEach(b=>{if(hit(a.r,b.r))bad.push(a.n+'×'+b.n)}));
    for(const x of els)if(x.r.left<-0.5||x.r.right>W+0.5||x.r.top<-0.5||x.r.bottom>H+0.5)off.push(x.n);
    const pid=place==='world'?'wPanel':'vPanel',pn=vis($(pid));if(pn)for(const x of box('#nav .nbtn'))if(hit(pn,x.r))bad.push(pid+'×'+x.n);
    const win=(open,panel,sel)=>{open();const p=$(panel),b=document.querySelector(sel),r=vis(b),ok=!!r&&r.width>=40&&r.height>=40&&r.left>=0&&r.right<=W&&r.top>=0&&r.bottom<=H&&!p.hidden;
      if(b)b.click();return !ok?'אין ✕ גלוי':!p.hidden?'לא נסגר':S.mode!=='play'?'מצב '+S.mode:'ok'};
    const o={n:els.length,bad,off,panel:!!pn,more:!!document.querySelector('#'+(place==='world'?'w':'v')+'Bag .resmore'),cards:0,wins:{}};
    if(place!=='world'){const tb=document.querySelector('#vPanel [data-act="trade"]');if(tb)tb.click();const ss=[...document.querySelectorAll('#vPanel .tcols>section')].map(vis);
      o.cards=document.querySelectorAll('#vPanel .tcard').length;o.cols=ss.length===2&&ss[0]&&ss[1]?(Math.abs(ss[0].top-ss[1].top)<2?2:1):0;
      const x=document.querySelector('#vPanel [data-act="close"]');if(x)x.click();o.tradeBack=!!document.querySelector('#vPanel [data-act="trade"]')&&!$('vPanel').hidden}
    o.wins[place==='world'?'gate':'market']=win(()=>{},pid,'#'+pid+' [data-act="close"]');
    o.wins.gear=win(gearOpen,'ovGear','#gearClose');
    o.wins.quests=win(()=>questLogOpen(true),'qLog','#qLog [data-act="close"]');
    if(place==='world')return o;
    o.wins.forge=win(forgeOpen,'ovForge','#forgeClose');
    const npc=Object.keys(NPC.list).find(npcHere);o.wins.npc=win(()=>npcTalk(npc),'npcDlg','#npcDlg [data-act="close"]');
    gearOpen();dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));keys.Escape=false;o.esc=$('ovGear').hidden&&S.mode==='play';
    gearOpen();const ov=$('ovGear');ov.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));ov.click();o.backdrop=ov.hidden&&S.mode==='play';
    questLogOpen(true);$('c').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:7}));joy=null;o.tapOut=$('qLog').hidden;
    return o};
  for(const nm in UIV){
    await page.setViewportSize(UIV[nm]);
    await page.evaluate(()=>{SAVE.village.market=Math.max(1,vLv('market'));SAVE.village.forge=Math.max(1,vLv('forge'));bagAdd('coins',1300);
      for(const r of Object.keys(RES.list).slice(0,9))bagAdd(r,3);   // יותר משאבים ממה שנכנס לפס, כדי שיופיע "+N"
      const B=VILLAGE.b.market;P.x=B.x;P.y=B.y+B.r+P.r+5;S.cam.x=P.x;S.cam.y=P.y;S.vil.ui='';S.vil.shut=null});
    await page.clock.runFor(300);
    await shot('ui-market-'+nm);await page.evaluate(()=>gearOpen());await shot('ui-gear-'+nm);await page.evaluate(()=>gearClose());
    const v=await page.evaluate(uiMeasure,'village');
    await page.evaluate(()=>{leaveVillage();const g=WORLD.home;P.x=g.x;P.y=g.y+g.r+P.r+2;S.cam.x=P.x;S.cam.y=P.y});
    await page.clock.runFor(200);
    await shot('ui-world-'+nm);
    const w=await page.evaluate(uiMeasure,'world');
    await page.evaluate(()=>enterVillage());await page.clock.runFor(100);
    uiR[nm]={v,w};
  }
  // ניר (31.10.2026): המבוקש נהרג מחוץ לגבולות העולם, והשלל לא נאסף. כאן הוא בורח לקצה ונהרג מעבר לו: הוא נשאר בפנים, והשלל נוחת בפנים ונאסף.
  // וציוד מאויב: פריט שנפל (בכוח) נוחת על הרצפה, נמשך לשחקן ונכנס לתרמיל ולשמירה
  // נקודות דמות (stats.js): הריגה בעולם נותנת XP לדמות, רמה נותנת נקודה, נקודה מעלה נזק, נשמרת, ואיפוס אצל הכוהנת עולה מטבעות
  const stt=await page.evaluate(()=>{
    enterWorld('home');const o={};const xp0=SAVE.hero.xp||0,e={x:P.x+40,y:P.y,xp:3,type:'grunt',hp:0,r:10,mult:{}};
    statKillXp(e);o.xp=(SAVE.hero.xp||0)-xp0;
    SAVE.hero.xp+=rankNeed(SAVE.hero.level)+5;rankSync();o.free=stFree();
    const d0=P.sw.dmg;o.add=statAdd('str');o.dmg=Math.round(P.sw.dmg/d0*100)/100;o.saved=(JSON.parse(localStorage.getItem(SAVE_STORE.key)).hero.pts||{}).str>=1;
    statAdd('def');const h0=P.hp;P.inv=0;hurt(100);o.def=Math.round((h0-P.hp)*10)/10;P.hp=P.maxHp;
    gearOpen();o.ui=document.querySelectorAll('#gDetail .strow').length;
    SAVE.hero.xp+=4000;rankSync();o.tfree=trFree();const sw0=P.sw.dmg;document.querySelector('#gDetail [data-act="tree"]').click();
    o.tree=document.querySelectorAll('#gTree .trn').length;const hp0=P.maxHp,lb=document.querySelector('#gTree [data-act="learn"][data-b="war"]');if(lb)lb.click();
    o.learned=((SAVE.hero.tree||{}).war||[])[0]==='w1'&&P.maxHp>hp0;
    // צומת "אחד משניים": נטוע באדמה. עומדים שנייה, ומכה נחלשת. והשני (מכה חוזרת) נסגר
    document.querySelector('#gTree [data-act="learn"][data-id="wRoot"]').click();o.fork=!document.querySelector('#gTree [data-id="wCounter"]');
    gearClose();P.moving=false;P.stillT=0;statTick(1.2);const h1=P.hp;P.inv=0;hurt(100);o.rooted=P.rooted&&Math.round(h1-P.hp)<100;P.hp=P.maxHp;o.build=buildName();
    enterVillage();bagAdd('coins',statRespecCost());const c0=SAVE.bag.coins;S.vil.dlg=null;npcTalk(STATS.respec.npc);
    const rb=document.querySelector('#npcDlg [data-act="respec"]');o.btn=!!rb;if(rb)rb.click();o.reset=stSpent()===0;o.paid=c0-(SAVE.bag.coins||0);npcTalk(null);
    return o});
  check(stt.xp>0&&stt.free>0&&stt.add&&stt.dmg>1&&stt.saved&&stt.def<100&&stt.ui===6&&stt.tree>=18&&stt.learned&&stt.fork&&stt.rooted&&!!stt.build&&stt.btn&&stt.reset&&stt.paid===0,
    'נקודות דמות: הריגה בעולם +'+stt.xp+' XP, נקודות פנויות '+stt.free+', כוח: נזק x'+stt.dmg+(stt.saved?', נשמר':', לא נשמר')+', הגנה: מכה של 100 עשתה '+stt.def+
    ', במסך הציוד '+stt.ui+' סטטים, עץ סקילים: '+stt.tree+' סקילים, '+stt.tfree+' נקודות, '+(stt.learned?'נלמד עור עבה והחיים עלו':'לא נלמד')+(stt.fork?', אחד משניים נסגר':', הצומת לא נסגר')+(stt.rooted?', נטוע באדמה מוריד נזק':', נטוע באדמה לא עבד')+', הבנייה: '+(stt.build||'בלי שם')+', איפוס אצל הכוהנת '+(stt.btn?'':'(אין כפתור) ')+(stt.reset?'עבד':'לא עבד')+(stt.paid?' ושילם '+stt.paid+' (צריך חינם בפעם הראשונה)':' בחינם, פעם ראשונה'));
  const edge=await page.evaluate(()=>{
    enterWorld('home');const B=placeBox(),n0=drops().length,out=o=>o.x<B.x0||o.x>B.x1||o.y<B.y0||o.y>B.y1;
    wantedAppear(0);const e=S.wn.e;e.x=B.x1+300;e.y=B.y0-200;wantedMove(e,0.05);const wIn=!out(e);
    e.x=B.x1+120;e.y=B.y1+120;lootKill(e);wantedDown(e);e.dead=true;S.wn.e=null;
    const ds=drops().slice(n0);P.x=B.x1-10;P.y=B.y1-10;P.inv=99;enemies.length=0;
    for(let i=0;i<120;i++)dropsUpdate(1/30);
    const left=ds.filter(d=>!d.got),gid=lootGear({x:P.x+60,y:P.y-60},true),g0=SAVE.bag[gid]||0;
    for(let i=0;i<120;i++)dropsUpdate(1/30);
    return{wIn,n:ds.length,inside:ds.every(d=>!out(d)),left:left.length,kept:dropStats().kept,gid,gBag:(SAVE.bag[gid]||0)>g0,
      gSaved:(JSON.parse(localStorage.getItem(SAVE_STORE.key)).bag[gid]||0)>0,gGround:!drops().some(d=>d.r===gid)}});
  await browser.close();

  const t=s=>s==null?'-':Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
  check(L.heroCards===3&&L.heroStart==='warrior'&&L.heroW==='oakSword'&&L.heroVil,'דמות התחלה: '+(L.heroCards||0)+' כרטיסים, '+(L.heroStart==='warrior'?'נבחר לוחם ונשמר':'הבחירה לא נשמרה')+
    ', נשק: '+(L.heroW||'-')+(L.heroVil?', ומשם לכפר':', לא נכנס לכפר'));
  check(L.heroHp===heroHp,'פסיבית בריצה: הלוחם קיבל +'+L.heroHp+' חיים (צפוי +'+heroHp+')');
  check(again,'בחירת דמות: '+(again?'לא חוזרת במשחק השני':'הופיעה שוב'));
  for(const nm in uiR){const {v,w}=uiR[nm],all=[...Object.entries(v.wins),...Object.entries(w.wins)],bad=[...v.bad,...w.bad],off=[...v.off,...w.off];
    check(!bad.length&&!off.length&&v.n>3&&w.n>3&&v.panel&&w.panel&&v.more&&v.cards>0&&v.tradeBack&&(nm!=='land'||v.cols===2)&&all.every(x=>x[1]==='ok')&&v.esc&&v.backdrop&&v.tapOut,
      'ממשק, '+(nm==='port'?'טלפון עומד 412×915':'לרוחב 844×390')+': '+(bad.length?'נוגעים זה בזה: '+bad.join(', '):'הפס העליון והסרגל לא נוגעים')+(off.length?', מחוץ למסך: '+off.join(', '):'')+
      (v.more?', "+N" לשאר התרמיל':', אין "+N"')+', '+v.cards+' כרטיסים במסחר'+(v.cols===2?' בשני טורים':'')+(v.tradeBack?', ✕ חוזר לשוק':', ✕ לא חזר לשוק')+' · יציאה: '+all.map(x=>x[0]+(x[1]==='ok'?' ✕':' '+x[1])).join(', ')+
      (v.esc?', Esc':', Esc לא סוגר')+(v.backdrop?', רקע':', רקע לא סוגר')+(v.tapOut?', נגיעה במשחק':', נגיעה במשחק לא סוגרת יומן'))}
  const sty=L.style||{};
  check(sty.t_run>0&&sty.kills>0&&(sty.dmg_sword||0)+(sty.dmg_gun||0)>0,'סגנון משחק: '+(Object.keys(sty).map(k=>k+' '+sty[k]).join(', ')||'לא נספר'));
  check(L.vilOpen&&L.gift&&L.gift!=='{}'&&(L.vilModels==null||L.vilModels>0),'כפר: נפתח אחרי מסך הפתיחה, מתנת פתיחה '+L.gift+(L.vilModels!=null?', '+L.vilModels+' מודלים בתלת-ממד':''));
  check(L.topBar&&L.topBar.split('/')[0]===L.topBar.split('/')[1]&&L.topMax,'פס עליון בכפר: '+L.topBar+' משאבים (מטבעות וחומרי בנייה בלבד), לכל היותר 4 בפס והשאר ב-"+N"');
  check(L.nodes>0&&!!L.nodeGot&&L.nodeInLoot,'מקורות משאבים: '+(L.nodeSeen!=null?'הופיע '+t(L.nodeSeen):'לא הופיע')+', נשברו '+(L.nodes||0)+(L.nodeAt!=null?' (ראשון '+t(L.nodeAt)+')':'')+
    ', נפל: '+(L.nodeGot||'כלום')+(L.nodeInLoot?', בשלל של הריצה':', לא הגיע לשלל'));
  const dr=(L.drops||'0/0/0/0/0').split('/').map(Number);
  check(dr[0]>0&&L.firstKills>0,'שלל לפי דרגה: '+['רגיל','לא שכיח','נדיר','אפי','אגדי'].map((n,i)=>n+' '+dr[i]).join(', ')+
    ' · עלית '+L.elites+', פיצוץ שלל '+L.jackpots+', הריגה ראשונה '+L.firstKills+', תיבות '+(L.chests||0)+', יצורי משאבים: '+(L.creatures||'לא הופלו'));
  check(L.built===1&&L.builtSaved&&L.fx,'בנייה: '+(L.panel||'הפאנל לא נפתח')+', '+(L.built===1?'נבנתה, שולם '+L.paid:'לא נבנתה')+(L.builtSaved?', נשמר':', לא נשמר')+(L.fx?', חגיגה עם פיגום':', בלי חגיגה'));
  check(L.collected>0&&L.collected===L.expect,'ייצור: אחרי שעתיים בלי לשחק נאספו '+L.collected+' עץ (צפוי '+L.expect+')');
  check(L.gearOpen&&L.gearEquip==='oakBow'&&L.gearSaved&&L.gearFx===L.gearBetter&&L.gearClosed&&/\+10%/.test(L.gearCmp||''),'ציוד: '+(L.gearOpen?'המסך נפתח':'המסך לא נפתח')+', השוואה: "'+(L.gearCmp||'-')+'"'+
    (L.gearEquip==='oakBow'?', נלבשה קשת עץ':', לא נלבשה')+(L.gearSaved?', נשמר':', לא נשמר')+(L.gearFx?', חגיגה':', בלי חגיגה')+(L.gearBetter?' (שיפור)':' (לא שיפור)')+(L.gearClosed?', נסגר':', לא נסגר'));
  check(L.gearDrag&&L.gearSaved&&L.gearBad,'גרירה בציוד: '+(L.gearDrag?'קשת נגררה למשבצת הנשק ונלבשה':'הגרירה לא הלבישה')+(L.gearSaved?' ונשמרה':', לא נשמר')+
    (L.gearBad?', קשת למשבצת אקססוריז נדחתה ברעידה':L.gearBad==null?', הגרירה האסורה לא נבדקה':', גרירה אסורה התקבלה'));
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
  const WN=L.wn||{};
  check(WN.found&&WN.saved&&WN.fx&&!WN.metBefore&&!WN.markBefore&&WN.mark==='!'&&WN.btn&&!WN.auto&&WN.open&&WN.got&&!WN.inLogNew&&WN.ready&&WN.closed&&WN.markReady==='✓'&&!WN.logClaim&&WN.claimed&&WN.paid&&WN.claimSaved&&WN.claimFx&&WN.hidden,
    'דמויות בעולם: '+(WN.err?WN.err+' · ':'')+(WN.n||0)+' באחו, הלך אל '+(WN.id||'-')+(WN.found?', נמצאה'+(WN.saved?' ונשמרה':' (לא נשמרה)')+(WN.fx?' עם חגיגה':' בלי חגיגה'):', לא נמצאה')+(WN.markBefore?', היה סימן לפני שנמצאה':'')+
    ', סימן '+(WN.mark||'אין')+(WN.btn?', כפתור "'+WN.btn+'"':', אין כפתור')+(WN.auto?', השיחה נפתחה לבד':'')+(WN.open?', שיחה: "'+(WN.say||'').slice(0,40)+'"':', השיחה לא נפתחה')+
    (WN.got?', התקבל '+WN.q:', לא התקבל')+(WN.inLogNew?', מופיע לקבלה ביומן (לא אמור)':'')+(WN.ready?', הושלם':', לא הושלם')+', סימן '+(WN.markReady||'אין')+(WN.logClaim?', פרס ביומן (לא אמור)':'')+
    (WN.claimed?', פרס נלקח אצלה'+(WN.paid?' והגיע לתרמיל':' אבל לא הגיע')+(WN.claimSaved?', נשמר':', לא נשמר')+(WN.claimFx?', חגיגה':', בלי חגיגה'):', הפרס לא נלקח')+(WN.hidden?'':', דמות שלא נמצאה כבר נותנת קווסט'));
  const Nn=L.npc||{};
  check(Nn.btn&&!Nn.auto&&Nn.open&&Nn.got&&Nn.after&&Nn.inLog&&Nn.closed&&Nn.push===0&&Nn.free&&Nn.waved&&Nn.cheer,'תושבים: '+(Nn.err||Nn.n+' בכפר')+
    (Nn.waved?', הנפח נופף':', לא נופף')+(Nn.btn?', כפתור "'+Nn.btn+'"':', אין כפתור')+(Nn.auto?', השיחה נפתחה לבד':'')+(Nn.open?', שיחה: "'+(Nn.say||'').slice(0,50)+'"':', השיחה לא נפתחה')+
    (Nn.got?', התקבל '+Nn.qid+(Nn.after?'':' (הכרטיס לא התעדכן)'):', לא התקבל קווסט')+(Nn.inLog?', מופיע ביומן':', לא ביומן')+(Nn.closed?'':', השיחה לא נסגרה')+
    (Nn.push===0?', לא חוסמים':', דוחפים '+Nn.push+'px')+(Nn.free?'':', מישהו על הדרך או בתוך מבנה')+(Nn.cheer?', מריע לשדרוג':', לא מריע לשדרוג'));
  check(L.gateNoRun&&L.gateBtn&&L.wEnter,'שער הכפר: '+(L.gateNoRun?'מעבר בשער לא מוציא מהכפר':'יצא בלי לחיצה')+', '+(L.wEnter?'לחיצה על "'+L.gateBtn+'" מוציאה לעולם':'לחיצה לא הוציאה לעולם'));
  check(L.wEnter&&L.wHud&&!!L.wName&&L.wNodes>0&&L.wFoes>0,'עולם פתוח: '+(L.wName||'בלי שם אזור')+(L.wHud?', ממשק העולם מוצג':', ממשק העולם חסר')+', '+L.wNodes+' מקורות משאבים, '+L.wFoes+' אויבים'+(L.wCreatures?' ('+L.wCreatures+' יצורי משאבים)':' (יצורי משאבים יגיעו עם הכלכלה)'));
  check(L.wGather>0&&L.wGatherSaved,'איסוף בעולם: '+(L.wGather?'עץ +'+L.wGather+' נכנס לתרמיל אחרי '+L.wGatherT+' שניות'+(L.wGatherSaved?', נשמר':', לא נשמר'):'לא נאסף')+(L.wQuest?' · קווסט '+L.wQuest:''));
  check(!!L.wKill,'אויב בעולם: '+(L.wKill?'הופל '+L.wKill:'לא הופל'));
  const WS=L.wStart||{};
  check(WS.easy&&!!L.wLeash&&+L.wLeash.split('→')[1]<+L.wLeash.split('→')[0]&&L.wFoeBack!=null,'מפלצות ליד השער: '+(WS.n||0)+(WS.easy?' קלות (נזק '+WS.dmg+')':' לא קלות')+
    (L.wLeash?', חוזרות הביתה ('+L.wLeash+')':', לא נבדק שחוזרות')+(L.wFoeBack!=null?', קבוצה שהופלה חזרה אחרי '+L.wFoeBack+' שניות':', קבוצה שהופלה לא חזרה'));
  const DA=JSON.parse(L.dropsArena||'{}');
  check(L.wDropGround&&L.wPicked>0&&DA.spawned>0&&DA.picked>0,'שלל על הרצפה: '+(L.wDropGround?'עץ נפל לרצפה לפני התרמיל':'נכנס לתרמיל בלי להיראות')+', בעולם נאספו '+(L.wPicked||0)+' בהליכה'+
    ' · בזירה נפלו '+(DA.spawned||0)+', נאספו בהליכה '+(DA.picked||0)+', ובסוף לבד '+(DA.auto||0));
  check(L.wArena&&L.wBack!=null&&L.wBack<200,'שער לזירה: '+(L.wArena?'לחיצה על "'+L.wGateBtn+'" מתחילה ריצה':'לא נכנס לזירה')+(L.wBack!=null?', בסוף חזר לשער ('+L.wBack+' פיקסלים ממנו)':', לא חזר לעולם'));
  check(L.back!=null&&!!L.lootGot&&L.lootSaved,'שלל: '+(L.won!=null?'ניצחון '+t(L.won):L.died!=null?'נפל '+t(L.died):'הריצה לא נגמרה')+
    (L.back!=null?', חזר לשער. במסך: '+L.lootTxt+' · בתרמיל: '+(L.lootGot||'כלום')+(L.lootSaved?', נשמר':', לא נשמר'):''));
  const D=L.wDeath||{};
  check(D.over&&D.res&&D.items&&D.stash&&D.saved&&L.wRespawn&&!!L.wDeathTxt,'מוות בעולם: '+(D.over?'נפל':'לא נפל')+(D.res?', חצי מכל משאב אבד':', המשאבים לא נחתכו בחצי')+(D.items?', הפריטים נשארו':', פריט אבד')+
    (D.stash?', המחסן שלם':', המחסן השתנה')+(D.saved?', נשמר':', לא נשמר')+(L.wRespawn?', קם בכפר':', לא קם בכפר')+' ('+(D.txt||'-')+') · במסך: '+(L.wDeathTxt||'-'));
  check(L.qAccepted&&L.qClaimed&&L.qPaid&&L.qSaved&&L.qFx,'קווסט: '+(L.qAccepted?'התקבל '+L.qName+' מהיומן ('+L.qLogTxt+', '+L.qDaily+' יומיים)':'לא התקבל')+
    ', בזירה '+(L.qProg??0)+(L.qReadyAt!=null?', הושלם '+t(L.qReadyAt):', לא הושלם')+(L.qTrack?' · מעקב: '+L.qTrack:'')+
    (L.qClaimed?', פרס נלקח '+L.qReward+(L.qPaid?' והגיע לתרמיל':' אבל לא הגיע לתרמיל')+(L.qSaved?', נשמר':', לא נשמר')+(L.qFx?', חגיגה':', בלי חגיגה'):', הפרס לא נלקח'));
  const F=L.face||{};
  check(F.n>20&&!F.bad&&F.arena>0&&!F.bad3,'כיוון הגוף: '+F.n+' בדיקות בהליכה ('+F.arena+' בזירה עם אויב קרוב), '+(F.bad?F.bad+' לא פנו לכיוון ההליכה (עד '+F.max+' רדיאנים)':'תמיד פונה לאן שהולכים')+
    (F.n3?', בתלת-ממד '+(F.bad3?F.bad3+' מתוך '+F.n3+' לא פנו':F.n3+' בדיקות תקינות'):''));
  const Bt=L.boots||{};
  check(L.bootsAcc&&Bt.claimed&&Bt.worn&&Bt.saved&&Math.abs(Bt.k-Bt.want)<0.002,'נעליים: '+(L.bootsAcc?'קווסט התקבל מראש הכפר':'הקווסט לא התקבל')+', עץ בעולם '+(L.bootsProg??0)+'/5'+
    (Bt.claimed?', פרס נלקח':', הפרס לא נלקח')+(Bt.worn?', נלבשו מיד':', לא נלבשו')+(Bt.saved?', נשמר':', לא נשמר')+', מהירות x'+Bt.k+' (צפוי x'+Bt.want+')');
  // לפני השינוי (ניר, משחק ראשון בטלפון): 2007 פיקסלים במהירות 165, כלומר 12.2 שניות של הליכה רק כדי להגיע לזירה
  const ws=L.walkPx/L.walkSp,wb=Bt.sp?L.walkPx/Bt.sp:null;
  check(ws<12.2,'הליכה מהכפר לשער הזירה: '+L.walkPx+' פיקסלים, '+ws.toFixed(1)+' שניות'+(wb?', עם נעליים '+wb.toFixed(1):'')+' (לפני: 2007 פיקסלים, 12.2 שניות)');
  check(L.levels>0,'עליית רמה ובחירת שדרוג: '+L.levels+' פעמים, הגיע לרמה '+L.level);
  check(L.swapBtn&&(L.nHeld>1?L.swaps>0:L.swaps===0),'כפתור החלפת נשק: '+(L.nHeld>1?L.swaps+' החלפות בין '+L.nHeld+' נשקים':(L.swapBtn?'מוסתר, כי יש נשק אחד ביד':'מוצג עם נשק אחד')));
  // כל דמות עם הנשק שלה: לוחם מניף, צייד יורה חצים, קוסם יורה קסם (WEAPONS ב-weapons.js)
  const MW=heroes.mageWorld;delete heroes.mageWorld;
  check(MW.node==='bolt'&&MW.nodeHit&&MW.foe==='bolt'&&MW.foeHit,'קוסם בעולם: מקור משאבים '+(MW.node==='bolt'?'בקסם':'ב-'+MW.node)+(MW.nodeHit?' ונפגע':' ולא נפגע')+
    ', '+MW.ft+' '+(MW.foe==='bolt'?'בקסם':'ב-'+MW.foe)+(MW.foeHit?' ונפגע':' ולא נפגע'));
  for(const id in heroes){const h=heroes[id],want={warrior:'swing',hunter:'arrow',mage:'bolt'}[id],got=h.swings&&h.shots==='-'?'swing':h.shots;
    check(got===want&&h.hit&&h.swapHidden&&(!h.homed===(want!=='bolt'))&&(h.anim==null||h.anim===h.want3d),'דמות '+id+': '+T_(h.wt)+', '+
      (got==='swing'?h.swings+' הנפות':got==='arrow'?'יורה חצים':got==='bolt'?'יורה קסם':'יורה '+got)+(h.homed?' שמתביית':'')+(h.hit?', פוגע':', לא פוגע')+(h.swapHidden?'':', כפתור החלפה מוצג')+
      (h.anim!=null?', הנפשה '+h.anim+(h.anim===h.want3d?'':' (צפוי '+h.want3d+')'):'')+(got===want?'':' (צפוי '+want+')'))}
  check(wk.weakDmg>wk.plain*1.2,'חולשה: מכה של '+wk.weak+' על מגן עשתה '+wk.weakDmg+', ואותה מכה בלי חולשה '+wk.plain);
  check(wk.stone.lightning===0&&wk.stone.water===15&&wk.stone.fire===5,'טבלת יעילות: מכה של 10 על אבן · מים '+wk.stone.water+' (צריך 15), ברק '+wk.stone.lightning+' (צריך 0), אש '+wk.stone.fire+' (צריך 5)');
  const hits=L.hits||{},nTypes=Object.keys(hits).filter(k=>hits[k]>0).length;
  check(cb.shock&&cb.frozen&&cb.stun&&cb.melt>=1.9&&cb.bossStun&&cb.plainIce,'קומבו: '+[cb.shock?'רטוב+ברק קפץ לרטוב רחוק':'חשמול לא קפץ',cb.frozen?'רטוב+קרח קפא ולא זז':'לא קפא',
    cb.stun?'קפוא+אדמה = הלם':'אין הלם','אש+קרח x'+cb.melt+(cb.melt>=1.9?'':' (צריך x2)'),cb.bossStun?'בוס בהלם פעם אחת ואז חסין':'הלם בבוס לא עבד',cb.plainIce?'קרח לבד לא מקפיא':'קרח לבד הקפיא'].join(', '));
  check(ob.fire&&ob.slow&&ob.block&&ob.shield&&ob.shieldOnce&&ob.heal&&ob.crit>0&&ob.luck>1&&ob.draw===true,'חפצים מסתובבים ('+ob.types+'): '+[ob.fire?'אש שורפת':'אש לא פגעה',ob.slow?'כפור מאט':'כפור לא האט',
    ob.block?'אבן עצרה ירייה':'ירייה עברה',ob.shield?(ob.shieldOnce?'מגן בלע מכה אחת':'מגן בלע יותר ממכה'):'מגן לא בלע',ob.heal?'עלה ריפא':'אין ריפוי',
    'תלתן: קריטי +'+ob.crit+', שלל x'+ob.luck,ob.draw===true?'מצויר':'ציור נכשל: '+ob.draw].join(', '));
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
  const nElite=(L.stations||'').split('elite').length-1;
  check(L.marks===L.nStations+1&&/^\d+:\d\d$/.test(L.clock||''),'טיימר ופס התקדמות: השעון הגיע ל-'+L.clock+', '+L.marksDone+' מתוך '+L.marks+' סימנים בפס עברו');
  check(L.stations&&L.stations.split(' ').length===L.nStations&&L.elites>0,'תחנות: '+(L.stations||'אף אחת')+' · אויבי-על שהופלו: '+L.elites+' מתוך '+nElite+(L.eliteLeft?' (נשאר: '+L.eliteLeft+')':''));
  check(L.hordeMax>=20,'גושים: הגוש הכי גדול '+L.hordeMax+' אויבים, ועד '+L.peak+' בזירה יחד');
  check(/[KMB]!?$/.test(L.dmgMaxTxt||'')&&L.crits>0&&!L.notLtr,'מספרים גדולים: הכי גדול '+(L.dmgMaxTxt||'-')+', קריטיות: '+(L.crits||0)+(L.notLtr?', מספר שלא נכתב משמאל לימין: '+L.notLtr:''));
  check(L.boss!=null,'בוס: הופיע '+t(L.boss)+(L.bossName?' ('+L.bossName+')':''));
  if(L.boss!=null){
    check(L.bossRes===L.usedTop&&L.bossWeak!==L.bossRes,'הבוס למד: עמיד ל-'+L.bossRes+' (הכי הרבה נזק שלך: '+L.usedTop+'), חלש ל-'+L.bossWeak+(L.held?' (יש לך אותו ביד)':' (אין לך אותו ביד)')+', תפקיד '+L.bossRole);
    check(L.rageMax>0.9,'זעם כשבורחים: הגיע ל-'+Math.round(100*(L.rageMax||0))+'%');
    check(L.rageLow<L.rageMax,'נרגע כשמתעמתים: ירד ל-'+Math.round(100*(L.rageLow??1))+'%');
    check(L.bossDown!=null,'בוס הובס: '+t(L.bossDown));
    check(L.won!=null,'ניצחון: הבוס בסוף הובס והריצה נגמרה '+t(L.won));
  }
  const quiet=au.ids.filter(id=>!au.count[id]&&!(id==='bossIn'&&L.boss==null)&&!(id==='bossDown'&&L.bossDown==null)&&!(id==='coin'&&L.room==null));
  check(au.unlocked&&!quiet.length,'צלילים: '+au.ids.map(id=>id+' '+(au.count[id]||0)).join(', ')+(au.unlocked?'':' · לא נפתחו בנגיעה')+(quiet.length?' · לא נשמעו: '+quiet.join(', '):''));
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
  if(CFG.gfx==='3d')check(g3.on&&L.actorsMax>0,g3.on?'תלת-ממד: פעיל, עד '+L.actorsMax+' דמויות במסך, עד '+L.callsMax+' ציורים בפריים':'תלת-ממד: לא עלה'+(g3.failed?' (נפל לדו-ממד)':''));
  else check(!g3.on,'דו-ממד: פעיל לפי הבחירה');
  if(CFG.lang==='en')check(!startLeak&&!L.heLeak,startLeak||L.heLeak?'שפה: נשאר טקסט בעברית: '+(startLeak||L.heLeak):'שפה: כל המסכים באנגלית, משמאל לימין');
  if(!CFG.god)results.push(L.died!=null?'· מת ב-'+t(L.died):'· שרד עד '+t(L.t));
  const pt=L.pet||{st:{}},pst=Object.entries(pt.st).map(([k,v])=>k+' '+v).join(', ');
  check(pt.n>20&&pt.near/pt.n>0.85,'חיית מחמד הולכת אחרי השחקן: קרובה אליו ב-'+Math.round(100*pt.near/(pt.n||1))+'% מהזמן · מצבים: '+(pst||'לא נראתה'));
  check(pt.digs>0&&pt.drop,'פיוחו חופרת: '+(pt.digs||0)+' חפירות, הוציאה '+(pt.dug.join(', ')||'כלום')+(pt.drop?', השלל נפל לרצפה':', שום שלל לא נפל לרצפה'));
  check(pt.evo==='1→2→3'&&pt.evoSaved&&pt.evoFx&&pt.fxOk,'פיוחו מתפתחת: '+(pt.evo||'לא נבדק')+(pt.evoSaved?', נשמר':', לא נשמר')+(pt.evoFx?', עם חגיגה':', בלי חגיגה')+(pt.fxOk?'':', להבה בשלב 3 לא מצאה את הזנב'));
  if(CFG.gfx==='3d')check(pt.r3&&pt.clips==='ok','פיוחו בתלת-ממד: '+(pt.r3?'נראית':'לא נראתה')+(pt.clips==='ok'?', כל 7 האנימציות נטענו':', חסרות: '+pt.clips));
  check(errors.length===0,errors.length?'שגיאות בקונסול:\n    '+[...new Set(errors)].join('\n    '):'אין שגיאות בקונסול');

  console.log('ריצה: seed '+CFG.seed+', '+t(L.t)+' זמן משחק'+(CFG.god?', עם חסינות':'')+(CFG.lang==='en'?', באנגלית':'')+(CFG.gfx==='2d'?', בדו-ממד':', בתלת-ממד')+(CFG.shots?', צילומים ב-'+CFG.shots:''));
  console.log(results.join('\n'));
  process.exit(results.some(r=>r.startsWith('✗'))?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
