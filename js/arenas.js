/* סוגי זירות (אוראל, roadmap.md: "עוד סוגי זירות"). כל ריצה יודעת באיזו זירה היא: S.arena (מפתח ב-ARENAS).
   כל זירה קובעת לעצמה: אילו אויבים מגיעים (ומהם החומרים, tags ב-data.js, ולכן גם החולשות), צבע רצפה, ואיך מנצחים.
   classic: הזירה של היום, בדיוק כמו קודם: run.js (תחנות) ו-spawn.js (HORDE) עושים הכל, והקובץ הזה לא נוגע בה.
   waves: גלים ממוספרים עם הפסקה קצרה ביניהם, מונה "גל 3/10" למעלה, כל גל קצת חזק יותר עם אויבים משלו, ובגל האחרון בוס.
   הניצחון, השלל ומסך הסוף כמו בריצה רגילה: הבוס שמופל קורא ל-runWon (boss.js, village.js).
   חיבורים: startRun(a) ב-input.js, runReset/runUpdate/runK ב-run.js, spawner ב-spawn.js, צבע הרצפה ב-render.js וב-render3d.js,
   והכפתור "זירת גלים" בכרטיס של שער בעולם (world.js). boss: זירת בוסים, שלושה בוסים ברצף בלי אויבים אחרים. מבוך עוד לא נבנה: יהיה עוד שורה כאן */

const ARENAS={
  classic:{win:'boss',floor:null},   // floor:null = הצבעים הרגילים (C.ink בדו-ממד, VIEW.ground בתלת-ממד)
  waves:{
    win:'boss',                      // הבוס של הגל האחרון
    floor:{d2:'#261C36',d3:'#33284D',line:'#54467A'},   // רצפה סגולה כהה, כדי שיהיה ברור שזו זירה אחרת
    breakSecs:5,                     // הפסקה בין גלים, בשניות
    firstGap:2.5,                    // כמה שניות עד הגל הראשון
    spawnSecs:12,                    // לאורך כמה שניות האויבים של גל מגיעים, בגושים
    clump:10,                        // כמה אויבים לכל היותר בגוש אחד
    spread:55,                       // כמה הגוש צפוף
    bossDelay:3,                     // כמה שניות אחרי תחילת הגל האחרון הבוס מגיע
    /* סוף הגל: כשנשארו n אויבים או פחות (ואין עוד גושים בדרך), חץ בקצה המסך לכל אחד, והם מפסיקים לשמור מרחק ובאים אליך
       (מכשפים נשארו רחוק והגל לא נגמר). secs: אם אף אחד לא נפל כל כך הרבה שניות, הם רצים אליך מהר פי rush */
    lastCall:{n:5,secs:20,rush:1.8,col:'#FF6B5E',arrow:1.2},
    /* הגלים. t: כמה חזקים האויבים, כמו בשנייה הזו של ריצה רגילה (runK ב-run.js). g: [סוג מ-ETYPES, כמה, חיים יחסית לרגיל].
       sup: אויב-על אחד (גדול, כמו בתחנות של הזירה הרגילה, RUN.elite ב-run.js) שמגיע באמצע הגל.
       לכל גל אופי וחומרים משלו (tags ב-data.js), כדי שיהיה שווה להחליף סוג נזק. סך החיים בכל גל כמו קודם, בערך:
       1 עצמות וג'לי (פיזי, ברק) · 2 שריון ורוחות (אש, קרח) · 3 ביצה (ברק, מים) · 4 יער (אש, קרח) · 5 קור ומתכת, וייתי (אש)
       6 רוחות (קרח, ברק) · 7 אבנים (מים) · 8 קברים, ושד (אש, מים) · 9 הכל מעורבב לפני הבוס, וייתי · 10 הבוס */
    list:[
      {t:0,  g:[['grunt',14,0.5],['slime',4,1]]},
      {t:30, g:[['ghost',10,1],['shield',4,1],['grunt',8,0.5]]},
      {t:60, g:[['slime',10,1],['wisp',8,1],['goleling',3,1]]},
      {t:95, g:[['treant',5,1],['sprite',8,1],['mushnub',3,1]]},
      {t:130,g:[['shield',8,1],['crawler',4,1]],sup:'yeti'},
      {t:165,g:[['grunt',24,0.5],['ghost',8,1],['wisp',10,1]]},
      {t:200,g:[['golem',5,1],['goleling',10,1],['shield',7,1]]},
      {t:240,g:[['mummy',12,1],['grunt',16,0.5]],sup:'demon'},
      {t:280,g:[['crawler',6,1],['mushnub',6,1],['slime',8,1],['ghost',6,1]],sup:'yeti'},
      {t:320,g:[['grunt',20,0.5],['shield',6,1],['slime',6,1]],boss:true}
    ]
  },
  /* זירת בוסים: דו-קרב בלי ליווי. שלושה בוסים ברצף, וכל אחד לומד אותך מחדש (makeBoss), כולל מה שעשית בבוס הקודם.
     hp: חיי כל בוס יחסית לבוס רגיל. בין בוס לבוס הפסקה והחיים מתמלאים חלקית (heal). אחרי האחרון הריצה נגמרת בניצחון */
  boss:{
    win:'boss',
    floor:{d2:'#2E1A22',d3:'#432A35',line:'#6E4452'},   // רצפה בורדו כהה, כדי שיהיה ברור שזו זירה אחרת
    firstGap:3,breakSecs:7,heal:0.35,
    hp:[0.6,0.8,1.05]
  }
};
/* זירת מבוך (maze.js): זירת גלים קצרה יותר (6 גלים מתוך העשרה, האחרון עם הבוס) עם קירות שמשתנים. הקירות והמספרים שלהם ב-MAZE */
ARENAS.maze={...ARENAS.waves,floor:{d2:'#172A2D',d3:'#23424A',line:'#3E6D74'},list:[0,1,2,4,6,9].map(i=>ARENAS.waves.list[i])};   // רצפה כחולה-ירקרקה כהה
const ARENA=()=>ARENAS[S&&S.arena]||ARENAS.classic;

// מתחילים ריצה בזירה מסוג a. נקרא מ-startRun אחרי reset()
function arenaStart(a){
  S.arena=ARENAS[a]?a:'classic';const A=ARENA();
  document.documentElement.classList.toggle('waves',!!(A.list||A.hp));
  if(A.hp){S.nextBoss=S.t+A.firstGap;S.bd={i:0,until:S.t+A.firstGap};return}   // בוס ראשון בעוד רגע. bd: איזה בוס עכשיו, ועד מתי ההפסקה
  if(!A.list)return;
  S.nextBoss=Infinity;   // הבוס מגיע רק בגל האחרון
  S.wv={i:-1,phase:'break',until:S.t+A.firstGap,q:[],log:[],boss:false};
}
// ניקוי בכל reset (גם בכפר ובעולם): חוזרים לזירה הרגילה
function arenaReset(){S.arena='classic';S.wv=S.bd=null;document.documentElement.classList.remove('waves');arenaTag('')}

// כמה זמן "ריצה רגילה" שווה הרגע הזה, בשביל חוזק האויבים (runK)
const arenaT=()=>S.wv?ARENA().list[Math.max(0,S.wv.i)].t:S.t;
// זירה עם מקור אויבים משלה: spawn.js לא שולח בודדים וגושים
const arenaOwnSpawn=()=>!!(S.wv&&ARENA().list||S.bd);

// כל פריים בזירה (runUpdate). מחזיר true כשהזירה מנהלת את הריצה בעצמה, ואז אין תחנות של classic
function arenaRun(){
  mazeRun();   // קירות המבוך (maze.js), רק בזירת מבוך
  if(S.bd)return bossArenaRun();
  const A=ARENA(),w=S.wv;if(!A.list||!w)return false;
  if(w.phase==='break'&&S.t>=w.until)waveStart(w.i+1);
  if(w.phase==='fight'){
    while(w.q.length&&S.t>=w.q[0].at&&enemies.length<HORDE.cap)waveClump(w.q.shift());   // מעל המגבלה הגוש מחכה
    const left=enemies.filter(e=>!e.dead&&e.wv===w.i).length;w.left=left+w.q.reduce((s,c)=>s+c.n,0);
    waveLastCall(w,A,left);
    if(!w.q.length&&!left&&w.i<A.list.length-1){   // הגל נוקה: הפסקה, ואז הגל הבא
      w.phase='break';w.until=S.t+A.breakSecs;w.log.push({i:w.i,end:S.t});
      banner(T('wave.clear',w.i+1),C.gold);sfx('ui');
    }
  }
  arenaHud();return true;
}
/* ---- זירת בוסים ---- */
// כל פריים: רק המונה למעלה ("בוס 2/3", או "הבא בעוד 4" בהפסקה)
function bossArenaRun(){
  const A=ARENA(),d=S.bd,N=A.hp.length;
  arenaTag(S.t<d.until&&!S.boss?T('bossar.next',d.i+1,N,Math.max(1,Math.ceil(d.until-S.t))):T('bossar.count',d.i+1,N));
  return true;
}
// הבוס נולד (update.js): החיים לפי הבוס הנוכחי
function arenaBoss(b){
  if(!S.bd)return;const A=ARENA();b.hp=b.max=b.hp*A.hp[S.bd.i];
}
// הבוס נפל (bossDown). true = יש עוד בוס, אז לא מסיימים את הריצה
function arenaBossDown(){
  const d=S.bd;if(!d)return false;const A=ARENA();
  if(++d.i>=A.hp.length)return false;
  d.until=S.nextBoss=S.t+A.breakSecs;
  P.hp=Math.min(P.maxHp,P.hp+P.maxHp*A.heal);floatText(P.x,P.y-46,'+'+Math.round(P.maxHp*A.heal),'#7BE38F',18,true);
  return true;
}
function waveStart(i){
  const A=ARENA(),w=S.wv,W=A.list[i];w.i=i;w.phase='fight';w.start=S.t;w.call=w.rush=false;w.lk=null;
  // כל קבוצה מתחלקת לגושים, והגושים מתפזרים לאורך spawnSecs, מסוגים מתחלפים
  const parts=W.g.map(([type,n,hp])=>{const out=[];for(let k=n;k>0;k-=A.clump)out.push({type,n:Math.min(A.clump,k),hp});return out});
  const q=[];for(let k=0;parts.some(p=>p.length);k++)for(const p of parts)if(p.length)q.push(p.shift());
  q.forEach((c,k)=>{c.at=S.t+k*A.spawnSecs/q.length});
  if(W.sup)q.splice(q.length>>1,0,{type:W.sup,n:1,hp:1,sup:true,at:q[q.length>>1]?q[q.length>>1].at:S.t});   // אויב-העל באמצע הגל
  w.q=q;
  if(W.boss){S.nextBoss=S.t+A.bossDelay;w.boss=true}   // update.js מביא את הבוס (makeBoss) כשמגיע הזמן
  banner(W.boss?T('wave.last'):T('wave.start',i+1,A.list.length),W.boss?C.lilac:C.chalk);S.shake=Math.max(S.shake,4);
}
function waveClump(c){
  if(c.sup)return waveSuper(c.type);
  const p=spawnPos(),n=Math.min(c.n,HORDE.cap-enemies.length),A=ARENA();
  for(let i=0;i<n;i++){const a=rand(0,6.28),d=Math.sqrt(Math.random())*A.spread*(1+n/20);const e=addEnemy(c.type,p.x+Math.cos(a)*d,p.y+Math.sin(a)*d,c.hp);e.wv=S.wv.i}
  if(n<c.n)S.wv.q.unshift({...c,n:c.n-n,at:S.t+0.5});   // מה שלא נכנס בגלל המגבלה מגיע אחר כך
}

// סוף הגל (lastCall): האחרונים מסומנים e.left (update.js: מכשף לא בורח), ואחרי secs בלי הפלה גם e.rush (מהירות)
function waveLastCall(w,A,left){
  const L=A.lastCall;if(!L)return;
  if(w.q.length||!left||left>L.n){w.call=w.rush=false;w.lk=null;return}
  if(w.lk==null||left<w.lkN){w.lk=S.t;w.lkN=left}   // מתי נפל האחרון (או מתי התחיל סוף הגל)
  w.call=true;w.rush=S.t-w.lk>=L.secs;
  for(const e of enemies)if(!e.dead&&e.wv===w.i){e.left=true;if(w.rush)e.rush=L.rush}
}
// חץ בקצה המסך לכל אחד מהאחרונים שמחוץ למסך (נקרא מ-render.js). כשהם רצים, החץ פועם
function waveArrows(ox,oy){
  const w=S.wv,L=ARENA().lastCall;if(!w||!w.call||!L||S.mode!=='play')return;
  const s=L.arrow*(w.rush?1+Math.sin(fxNow()*8)*0.12:1);
  for(const e of enemies)if(!e.dead&&e.left&&e.wv===w.i)edgeArrow(e.x+ox,e.y+oy,L.col,s);
}

// אויב-על בגל: אותם מספרים כמו בתחנה של הזירה הרגילה (RUN.elite), בלי ליווי, כי הגל עצמו הוא הליווי
function waveSuper(type){
  const E=RUN.elite,p=spawnPos(),e=addEnemy(type,p.x,p.y);e.wv=S.wv.i;
  e.elite=true;e.big=E.size;e.r*=E.size;e.hp*=E.hp;e.max=e.hp;e.dmg*=E.dmg;e.xp=E.xp;e.speed*=E.speed;
  banner(T('st.elite',T('elite.'+type)),dtCol(e.weak));S.shake=Math.max(S.shake,6);
}

/* ---- המונה למעלה: "גל 3/10", או "הגל הבא בעוד 4" בהפסקה. יושב בשעון (index.html .clock), ו-css מסתיר שם את התחנות של classic ---- */
const arenaTagEl=(()=>{const c=document.querySelector('.hud .clock');if(!c)return null;const s=document.createElement('b');s.id='waveTag';s.className='wavetag';s.hidden=true;c.appendChild(s);return s})();
function arenaTag(txt){const el=arenaTagEl;if(!el)return;if(el.textContent!==txt)el.textContent=txt;el.hidden=!txt}
function arenaHud(){
  const w=S.wv,N=ARENA().list.length;if(!w)return arenaTag('');
  arenaTag(w.phase==='break'?T('wave.next',w.i+2,Math.max(1,Math.ceil(w.until-S.t))):w.i===N-1?T('wave.final',N):T('wave.count',w.i+1,N,w.left||0));
}
// צבע הרצפה של הזירה, או null לצבע הרגיל. k: d2 (קנבס), d3 (רקע בתלת-ממד), line (הקרקע בתלת-ממד)
const arenaFloor=k=>S&&!S.wd&&!S.vil&&!S.room&&ARENA().floor?ARENA().floor[k]:null;
