/* ריצה בזירה בסגנון XP Hero: כמה דקות עם תחנות בדרך, והבוס מחכה בסוף. הבוס שמופל מסיים את הריצה בניצחון (runWon ב-village.js).
   המספרים גדלים פי כמה ולא באחוזים: חיי האויבים גדלים עם הזמן, ונזק השחקן גדל עם כל רמה.
   הגושים והאויבים הבודדים ב-spawn.js (HORDE). הפס והטיימר מצוירים ב-render.js */

const RUN={
  bossAt:360,                    // מתי הבוס מגיע, בשניות. עם הקרב בו, ריצה של 6-7 דקות
  stations:[                     // תחנות בדרך. swarm: גל ענק שמקיף אותך מכל הכיוונים. elite: אויב-על עם ליווי
    {t:60,kind:'swarm'},{t:120,kind:'elite'},{t:180,kind:'swarm'},{t:240,kind:'elite'},{t:300,kind:'swarm'}],
  hpGrowth:4.5,                   // חיי האויבים גדלים פי כך בכל דקה
  lvlDmg:1.35,                   // נזק השחקן גדל פי כך בכל רמה
  bossHits:110,                  // חיי הבוס: כמה מכות של הנשק החזק שלך הוא סופג. הוא נמדד מולך כשהוא מגיע, אז הקרב תמיד באותו אורך בערך
  swarmN:56, swarmR:0.58,        // גל ענק: כמה אויבים, ובאיזה מרחק מסביב (חלק מהצלע הארוכה של המסך, כדי שיתחיל מחוץ לתמונה)
  elite:{hp:40,size:1.9,dmg:2,xp:30,speed:0.75,escort:16}    // אויב-על: פי כמה חיים, גודל, נזק ומהירות, כמה XP, וכמה מלווים
};

// פי כמה האויבים חזקים עכשיו, ופי כמה השחקן
const runK=()=>Math.pow(RUN.hpGrowth,S.t/60)*(1+S.bossCount*0.5);
const dmgK=()=>Math.pow(RUN.lvlDmg,P.level-1);

function runReset(){S.run={next:0,log:[],elites:0,won:0}}
function runUpdate(){
  const r=S.run,st=RUN.stations[r.next];
  if(st&&S.t>=st.t){r.next++;r.log.push({kind:st.kind,t:S.t});st.kind==='swarm'?swarm():elite()}
}
// התחנה הבאה בדרך לבוס, בשביל הטקסט מתחת לטיימר
function nextStation(){return RUN.stations[S.run.next]||{t:RUN.bossAt,kind:'boss'}}

function swarm(){
  const n=Math.max(0,Math.min(RUN.swarmN,HORDE.cap-enemies.length)),o=rand(0,6.28);   // לא עוברים את המגבלה (spawn.js)
  for(let i=0;i<n;i++){const a=o+i/n*Math.PI*2,d=RUN.swarmR*Math.max(W,H)+rand(-25,25);addEnemy('grunt',P.x+Math.cos(a)*d,P.y+Math.sin(a)*d,HORDE.weak)}
  banner(T('st.swarm'),C.chalk);S.shake=Math.max(S.shake,5);
}
// אויב-על: מתחלף בין אביר בשריון (חלש לאש) למכשף מרחף (חלש לקרח), כדי שיהיה שווה להחזיק יותר מסוג נזק אחד
function elite(){
  const E=RUN.elite,type=S.run.log.filter(s=>s.kind==='elite').length%2?'shield':'wisp',p=spawnPos();
  // הליווי לא עובר את המגבלה (spawn.js). אויב-העל עצמו תמיד מגיע
  for(let i=0,n=Math.min(E.escort,HORDE.cap-enemies.length-1);i<n;i++){const a=rand(0,6.28),d=rand(40,110);addEnemy('grunt',p.x+Math.cos(a)*d,p.y+Math.sin(a)*d,HORDE.weak)}
  const e=addEnemy(type,p.x,p.y);
  e.elite=true;e.big=E.size;e.r*=E.size;e.hp*=E.hp;e.max=e.hp;e.dmg*=E.dmg;e.xp=E.xp;e.speed*=E.speed;
  banner(T('st.elite',T('elite.'+type)),dtCol(e.weak));S.shake=Math.max(S.shake,6);
}
function eliteDown(e){
  S.run.elites++;S.hitstop=Math.max(S.hitstop,0.08);S.shake=Math.max(S.shake,8);
  sparks(e.x,e.y,C.gold,24,280);banner(T('eliteDown'),C.gold);divineElite();   // ברק אלוהי (divine.js)
}
