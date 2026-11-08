/* הזירה (אוראל, 8.11.2026: "לאחד את ארבע הזירות לזירה אחת"). יש זירה אחת: האתגר (gauntlet), עשרה שלבים על מנוע הגלים (S.wv).
   כל שלב קצת חזק יותר עם אויבים וחומרים משלו (tags ב-data.js, ולכן גם החולשות). באמצע קירות שמשתנים (maze.js, גלים 5-6),
   בגל 8 האויבים מקיפים אותך בטבעת, בכל הפסקה מתרפאים קצת, ובגל האחרון בוס. הניצחון, השלל ומסך הסוף כמו בריצה רגילה:
   הבוס שמופל קורא ל-runWon (boss.js, village.js).
   כניסה רכה: כמה שניות חסינות (inv), והגל הראשון מחכה firstGap עם ספירה לאחור. אויבים רחוקים "ישנים" (wake): הולכים לאט
   ובלי לירות, עד שמתקרבים, נפגעים, או שהגל נגמר. כך לא כל הזירה נופלת עליך ברגע הראשון.
   חיבורים: startRun ב-input.js, runReset/runUpdate/runK ב-run.js, spawner ב-spawn.js (לא שולח כלום: לזירה מקור אויבים משלה),
   arenaZz בלולאת האויבים ב-update.js, והכפתור "כניסה לזירה" בכרטיס של שער בעולם (world.js) */

const ARENAS={
  gauntlet:{
    win:'boss',                      // הבוס של הגל האחרון
    floor:null,                      // null = הרצפה הרגילה (C.ink בדו-ממד, VIEW.ground בתלת-ממד)
    inv:3,                           // כמה שניות חסינות בכניסה
    firstGap:6,                      // כמה שניות עד הגל הראשון (רק לפני הראשון)
    countdown:3,                     // הספירה לאחור בסוף ההמתנה הראשונה: 3, 2, 1
    breakSecs:5,                     // הפסקה בין גלים, בשניות
    heal:0.12,                       // בכל הפסקה: ריפוי של חלק מהחיים המלאים
    spawnSecs:12,                    // לאורך כמה שניות האויבים של גל מגיעים, בגושים
    clump:10,                        // כמה אויבים לכל היותר בגוש אחד
    spread:55,                       // כמה הגוש צפוף
    bossDelay:3,                     // כמה שניות אחרי תחילת הגל האחרון הבוס מגיע
    mazeWaves:[4,5],                 // באילו גלים (מ-0) הקירות של maze.js פעילים: גלים 5 ו-6
    /* טבעת: בגל עם ring:true כל גוש נפרש סביבך במעגל שלם, כמו הגל הענק (swarm ב-run.js), במרחק RUN.swarmR מהצלע הארוכה */
    /* אויבים ישנים: רחוק מ-r (כפול הצלע הארוכה של המסך) אויב רגיל הולך אליך במהירות speed עם נדנוד קל (wob: תדירות, זווית),
       ומכשף לא יורה. מתעורר לתמיד כשמתקרבים, כשהוא נפגע, בסוף הגל (lastCall) וכשהבוס בדרך. בוס ומבוקש לא ישנים */
    wake:{r:0.55,speed:0.3,wob:[1.3,0.55]},
    /* סוף הגל: כשנשארו n אויבים או פחות (ואין עוד גושים בדרך), חץ בקצה המסך לכל אחד, והם מפסיקים לשמור מרחק ובאים אליך
       (מכשפים נשארו רחוק והגל לא נגמר). secs: אם אף אחד לא נפל כל כך הרבה שניות, הם רצים אליך מהר פי rush */
    lastCall:{n:5,secs:20,rush:1.8,col:'#FF6B5E',arrow:1.2},
    /* השלבים. t: כמה חזקים האויבים, כמו בשנייה הזו של ריצה רגילה (runK ב-run.js). g: [סוג מ-ETYPES, כמה, חיים יחסית לרגיל].
       sup: אויב-על אחד (גדול, RUN.elite ב-run.js) שמגיע באמצע הגל. ring: הגושים מקיפים אותך.
       1 עצמות וג׳לי (פיזי, ברק) · 2 שריון ורוחות (אש, קרח) · 3 ביצה (ברק, מים) · 4 יער (אש, קרח) · 5 קור ומתכת, וייתי (אש), קירות
       6 רוחות (קרח, ברק), קירות · 7 אבנים (מים) · 8 קברים בטבעת, ושד (אש, מים) · 9 הכל מעורבב לפני הבוס, וייתי · 10 הבוס */
    list:[
      {t:0,  g:[['grunt',14,0.5],['slime',4,1]]},
      {t:30, g:[['ghost',10,1],['shield',4,1],['grunt',8,0.5]]},
      {t:60, g:[['slime',10,1],['wisp',8,1],['goleling',3,1]]},
      {t:95, g:[['treant',5,1],['sprite',8,1],['mushnub',3,1]]},
      {t:130,g:[['shield',8,1],['crawler',4,1]],sup:'yeti'},
      {t:165,g:[['grunt',24,0.5],['ghost',8,1],['wisp',10,1]]},
      {t:200,g:[['golem',5,1],['goleling',10,1],['shield',7,1]]},
      {t:240,g:[['mummy',12,1],['grunt',16,0.5]],sup:'demon',ring:true},
      {t:280,g:[['crawler',6,1],['mushnub',6,1],['slime',8,1],['ghost',6,1]],sup:'yeti'},
      {t:320,g:[['grunt',20,0.5],['shield',6,1],['slime',6,1]],boss:true}
    ]
  }
};
const ARENA=()=>ARENAS.gauntlet;

// מתחילים ריצה בזירה. נקרא מ-startRun אחרי reset(). יש זירה אחת
function arenaStart(){
  S.arena='gauntlet';const A=ARENA();
  document.documentElement.classList.add('waves');
  S.nextBoss=Infinity;   // הבוס מגיע רק בגל האחרון
  P.inv=A.inv;           // כניסה רכה: כמה שניות חסינות, וזזים חופשי
  S.wv={i:-1,phase:'break',until:S.t+A.firstGap,q:[],log:[],boss:false,cd:0,healed:0};
  MZ.on=false;MZ.t0=-99;MZ.key='';   // הקירות (maze.js) מתחילים כבויים בכל ריצה
}
// ניקוי בכל reset (גם בכפר ובעולם)
function arenaReset(){S.arena='gauntlet';S.wv=null;document.documentElement.classList.remove('waves');arenaTag('')}

// כמה זמן "ריצה רגילה" שווה הרגע הזה, בשביל חוזק האויבים (runK)
const arenaT=()=>S.wv?ARENA().list[Math.max(0,S.wv.i)].t:S.t;
// לזירה מקור אויבים משלה: spawn.js לא שולח בודדים וגושים. פונקציה (ולא const), כדי שבדיקה תוכל לבדוק את spawner לבד
function arenaOwnSpawn(){return true}
// הבוס נפל (boss.js). בזירה יש בוס אחד, אז הריצה תמיד נגמרת
function arenaBossDown(){return false}

// כל פריים בזירה (runUpdate). מחזיר true כשהזירה מנהלת את הריצה בעצמה, ואז אין תחנות של run.js
function arenaRun(){
  mazeRun();   // קירות (maze.js), רק בגלים של mazeWaves
  const A=ARENA(),w=S.wv;if(!w)return false;
  if(w.phase==='break'){
    if(w.i<0){const s=Math.ceil(w.until-S.t);if(s>0&&s<=A.countdown&&s!==w.cd){w.cd=s;banner(T('arena.wake',s),C.gold);sfx('ui')}}   // ספירה לאחור לפני הגל הראשון
    if(S.t>=w.until)waveStart(w.i+1);
  }
  if(w.phase==='fight'){
    while(w.q.length&&S.t>=w.q[0].at&&enemies.length<HORDE.cap)waveClump(w.q.shift());   // מעל המגבלה הגוש מחכה
    const left=enemies.filter(e=>!e.dead&&e.wv===w.i).length;w.left=left+w.q.reduce((s,c)=>s+c.n,0);
    waveLastCall(w,A,left);
    if(!w.q.length&&!left&&w.i<A.list.length-1){   // הגל נוקה: הפסקה עם ריפוי, ואז הגל הבא
      w.phase='break';w.until=S.t+A.breakSecs;w.log.push({i:w.i,end:S.t});
      banner(T('wave.clear',w.i+1),C.gold);sfx('ui');waveHeal(A);
    }
  }
  arenaHud();return true;
}
// ריפוי בהפסקה: מספר ירוק מעל הגיבור, כמו הריפוי אחרי בוס
function waveHeal(A){
  const h=Math.min(P.maxHp-P.hp,P.maxHp*A.heal);S.wv.healed++;if(h<=0)return;
  P.hp+=h;floatText(P.x,P.y-46,'+'+Math.round(h),'#7BE38F',18,true);
}
function waveStart(i){
  const A=ARENA(),w=S.wv,W=A.list[i];w.i=i;w.phase='fight';w.start=S.t;w.call=w.rush=false;w.lk=null;
  // כל קבוצה מתחלקת לגושים, והגושים מתפזרים לאורך spawnSecs, מסוגים מתחלפים
  const parts=W.g.map(([type,n,hp])=>{const out=[];for(let k=n;k>0;k-=A.clump)out.push({type,n:Math.min(A.clump,k),hp});return out});
  const q=[];for(let k=0;parts.some(p=>p.length);k++)for(const p of parts)if(p.length)q.push(p.shift());
  q.forEach((c,k)=>{c.at=S.t+k*A.spawnSecs/q.length;if(W.ring)c.ring=true});
  if(W.sup)q.splice(q.length>>1,0,{type:W.sup,n:1,hp:1,sup:true,at:q[q.length>>1]?q[q.length>>1].at:S.t});   // אויב-העל באמצע הגל
  w.q=q;
  if(W.boss){S.nextBoss=S.t+A.bossDelay;w.boss=true}   // update.js מביא את הבוס (makeBoss) כשמגיע הזמן. w.boss גם מעיר את כולם (arenaZz)
  banner(W.boss?T('wave.last'):W.ring?T('wave.ring',i+1,A.list.length):T('wave.start',i+1,A.list.length),W.boss?C.lilac:C.chalk);S.shake=Math.max(S.shake,4);
}
function waveClump(c){
  if(c.sup)return waveSuper(c.type);
  const n=Math.min(c.n,HORDE.cap-enemies.length),A=ARENA();
  if(c.ring){   // טבעת שלמה סביבך, כמו swarm ב-run.js
    const o=rand(0,6.28),R=RUN.swarmR*Math.max(W,H);
    for(let i=0;i<n;i++){const a=o+i/n*Math.PI*2,d=R+rand(-25,25);const e=addEnemy(c.type,P.x+Math.cos(a)*d,P.y+Math.sin(a)*d,c.hp);e.wv=S.wv.i}
  }else{
    const p=spawnPos();
    for(let i=0;i<n;i++){const a=rand(0,6.28),d=Math.sqrt(Math.random())*A.spread*(1+n/20);const e=addEnemy(c.type,p.x+Math.cos(a)*d,p.y+Math.sin(a)*d,c.hp);e.wv=S.wv.i}
  }
  if(n<c.n)S.wv.q.unshift({...c,n:c.n-n,at:S.t+0.5});   // מה שלא נכנס בגלל המגבלה מגיע אחר כך
}

/* אויב ישן (update.js, לכל אויב רגיל בכל פריים, O(1)). מחזיר 0 כשהוא ער, אחרת את מכפיל המהירות.
   מתעורר לתמיד: קרוב מ-wake.r, נפגע (חיים לא מלאים), האחרונים בגל (e.left), או שהבוס בדרך (w.boss) */
function arenaZz(e,d){
  const w=S.wv;if(e.awake||!w)return 0;
  const Z=ARENA().wake;
  if(d<Z.r*Math.max(W,H)||e.hp<e.max||e.left||w.boss){e.awake=true;return 0}
  return Z.speed;
}
// הנדנוד של אויב ישן: זווית קטנה שמשתנה לאט, שונה לכל אויב
const arenaWob=e=>{const Z=ARENA().wake.wob;return Math.sin(S.t*Z[0]+(e.zz||(e.zz=rand(0,6.28))))*Z[1]};

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

// אויב-על בגל: אותם מספרים כמו אויב-על רגיל (RUN.elite), בלי ליווי, כי הגל עצמו הוא הליווי
function waveSuper(type){
  const E=RUN.elite,p=spawnPos(),e=addEnemy(type,p.x,p.y);e.wv=S.wv.i;
  e.elite=true;e.big=E.size;e.r*=E.size;e.hp*=E.hp;e.max=e.hp;e.dmg*=E.dmg;e.xp=E.xp;e.speed*=E.speed;
  banner(T('st.elite',T('elite.'+type)),dtCol(e.weak));S.shake=Math.max(S.shake,6);
}

/* ---- המונה למעלה: "גל 3/10", או "הגל הבא בעוד 4" בהפסקה. יושב בשעון (index.html .clock), ו-css מסתיר שם את התחנות של run.js ---- */
const arenaTagEl=(()=>{const c=document.querySelector('.hud .clock');if(!c)return null;const s=document.createElement('b');s.id='waveTag';s.className='wavetag';s.hidden=true;c.appendChild(s);return s})();
function arenaTag(txt){const el=arenaTagEl;if(!el)return;if(el.textContent!==txt)el.textContent=txt;el.hidden=!txt}
function arenaHud(){
  const w=S.wv,N=ARENA().list.length;if(!w)return arenaTag('');
  arenaTag(w.phase==='break'?T('wave.next',w.i+2,Math.max(1,Math.ceil(w.until-S.t))):w.i===N-1?T('wave.final',N):T('wave.count',w.i+1,N,w.left||0));
}
// צבע הרצפה של הזירה, או null לצבע הרגיל. k: d2 (קנבס), d3 (רקע בתלת-ממד), line (הקרקע בתלת-ממד)
const arenaFloor=k=>S&&!S.wd&&!S.vil&&!S.room&&ARENA().floor?ARENA().floor[k]:null;
