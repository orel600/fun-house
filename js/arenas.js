/* סוגי זירות (אוראל, roadmap.md: "עוד סוגי זירות"). כל ריצה יודעת באיזו זירה היא: S.arena (מפתח ב-ARENAS).
   כל זירה קובעת לעצמה: אילו אויבים מגיעים (ומהם החומרים, tags ב-data.js, ולכן גם החולשות), צבע רצפה, ואיך מנצחים.
   classic: הזירה של היום, בדיוק כמו קודם: run.js (תחנות) ו-spawn.js (HORDE) עושים הכל, והקובץ הזה לא נוגע בה.
   waves: גלים ממוספרים עם הפסקה קצרה ביניהם, מונה "גל 3/10" למעלה, כל גל קצת חזק יותר עם אויבים משלו, ובגל האחרון בוס.
   הניצחון, השלל ומסך הסוף כמו בריצה רגילה: הבוס שמופל קורא ל-runWon (boss.js, village.js).
   חיבורים: startRun(a) ב-input.js, runReset/runUpdate/runK ב-run.js, spawner ב-spawn.js, צבע הרצפה ב-render.js וב-render3d.js,
   והכפתור "זירת גלים" בכרטיס של שער בעולם (world.js). מבוך וזירת בוס עוד לא נבנו: כל אחד יהיה עוד שורה כאן */

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
    /* הגלים. t: כמה חזקים האויבים, כמו בשנייה הזו של ריצה רגילה (runK ב-run.js). g: [סוג מ-ETYPES, כמה, חיים יחסית לרגיל].
       כל גל עם חומרים אחרים, כדי שיהיה שווה להחליף סוג נזק: עצם (פיזי), מתכת (אש, ברק, אדמה), צמח (אש, קרח), אבן (מים), קסם (קרח, ברק) */
    list:[
      {t:0,  g:[['grunt',20,0.5]]},
      {t:30, g:[['grunt',22,0.5],['shield',4,1]]},
      {t:60, g:[['grunt',20,0.5],['wisp',8,1]]},
      {t:95, g:[['treant',7,1],['sprite',8,1]]},
      {t:130,g:[['shield',12,1],['crawler',6,1]]},
      {t:165,g:[['grunt',36,0.5],['wisp',10,1]]},
      {t:200,g:[['golem',7,1],['shield',10,1]]},
      {t:240,g:[['mummy',14,1],['grunt',26,0.5]]},
      {t:280,g:[['crawler',9,1],['wisp',10,1],['treant',7,1]]},
      {t:320,g:[['grunt',24,0.5],['shield',8,1]],boss:true}
    ]
  }
};
const ARENA=()=>ARENAS[S&&S.arena]||ARENAS.classic;

// מתחילים ריצה בזירה מסוג a. נקרא מ-startRun אחרי reset()
function arenaStart(a){
  S.arena=ARENAS[a]?a:'classic';const A=ARENA();
  document.documentElement.classList.toggle('waves',!!A.list);
  if(!A.list)return;
  S.nextBoss=Infinity;   // הבוס מגיע רק בגל האחרון
  S.wv={i:-1,phase:'break',until:S.t+A.firstGap,q:[],log:[],boss:false};
}
// ניקוי בכל reset (גם בכפר ובעולם): חוזרים לזירה הרגילה
function arenaReset(){S.arena='classic';S.wv=null;document.documentElement.classList.remove('waves');arenaTag('')}

// כמה זמן "ריצה רגילה" שווה הרגע הזה, בשביל חוזק האויבים (runK)
const arenaT=()=>S.wv?ARENA().list[Math.max(0,S.wv.i)].t:S.t;
// זירה עם מקור אויבים משלה: spawn.js לא שולח בודדים וגושים
const arenaOwnSpawn=()=>!!(S.wv&&ARENA().list);

// כל פריים בזירה (runUpdate). מחזיר true כשהזירה מנהלת את הריצה בעצמה, ואז אין תחנות של classic
function arenaRun(){
  const A=ARENA(),w=S.wv;if(!A.list||!w)return false;
  if(w.phase==='break'&&S.t>=w.until)waveStart(w.i+1);
  if(w.phase==='fight'){
    while(w.q.length&&S.t>=w.q[0].at&&enemies.length<HORDE.cap)waveClump(w.q.shift());   // מעל המגבלה הגוש מחכה
    const left=enemies.filter(e=>!e.dead&&e.wv===w.i).length;w.left=left+w.q.reduce((s,c)=>s+c.n,0);
    if(!w.q.length&&!left&&w.i<A.list.length-1){   // הגל נוקה: הפסקה, ואז הגל הבא
      w.phase='break';w.until=S.t+A.breakSecs;w.log.push({i:w.i,end:S.t});
      banner(T('wave.clear',w.i+1),C.gold);sfx('ui');
    }
  }
  arenaHud();return true;
}
function waveStart(i){
  const A=ARENA(),w=S.wv,W=A.list[i];w.i=i;w.phase='fight';w.start=S.t;
  // כל קבוצה מתחלקת לגושים, והגושים מתפזרים לאורך spawnSecs, מסוגים מתחלפים
  const parts=W.g.map(([type,n,hp])=>{const out=[];for(let k=n;k>0;k-=A.clump)out.push({type,n:Math.min(A.clump,k),hp});return out});
  const q=[];for(let k=0;parts.some(p=>p.length);k++)for(const p of parts)if(p.length)q.push(p.shift());
  q.forEach((c,k)=>{c.at=S.t+k*A.spawnSecs/q.length});w.q=q;
  if(W.boss){S.nextBoss=S.t+A.bossDelay;w.boss=true}   // update.js מביא את הבוס (makeBoss) כשמגיע הזמן
  banner(W.boss?T('wave.last'):T('wave.start',i+1,A.list.length),W.boss?C.lilac:C.chalk);S.shake=Math.max(S.shake,4);
}
function waveClump(c){
  const p=spawnPos(),n=Math.min(c.n,HORDE.cap-enemies.length),A=ARENA();
  for(let i=0;i<n;i++){const a=rand(0,6.28),d=Math.sqrt(Math.random())*A.spread*(1+n/20);const e=addEnemy(c.type,p.x+Math.cos(a)*d,p.y+Math.sin(a)*d,c.hp);e.wv=S.wv.i}
  if(n<c.n)S.wv.q.unshift({...c,n:c.n-n,at:S.t+0.5});   // מה שלא נכנס בגלל המגבלה מגיע אחר כך
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
