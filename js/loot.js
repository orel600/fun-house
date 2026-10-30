/* שלל: מה נופל, באיזו דרגה, ואיך זה מרגיש (ניר: "שיהיו יותר אפשרויות של DROPS, כדי שתמיד יהיה עניין").
   הדרגה של שלל היא הנדירות של המשאב ב-RES.rarity: רגיל, לא שכיח, נדיר, אפי, אגדי. לכל דרגה צבע ועמוד אור על הקרקע,
   ומנדיר ומעלה גם חגיגה וצליל (celebrate ב-fx.js).
   מה שנופל: טבלאות drop ו-elite לכל אויב (data.js), מקורות משאבים ותיבות (nodes.js), המבוקש (wanted.js), חדר הבונוס (bonus.js).
   כאן: אויבי עלית, פיצוץ שלל נדיר, בונוס להריגה ראשונה של כל סוג אויב בכל יום, ו"מזל עם הגנה":
   הסיכויים אמיתיים, אבל כל פעם ששלל נדיר לא נופל הסיכוי הבא גדל קצת, עד שהוא נופל (SAVE.pity).
   הכל נכנס לשלל של הריצה (S.loot), ומגיע לתרמיל בסוף הריצה (runEnd ב-village.js). כל המספרים באובייקט LOOT */

const LOOT={
  // אויב עלית: גדול וחזק יותר, מסומן בטבעת זהב, ומפיל את הטבלה שלו פעמיים ועוד את טבלת ה-elite שלו
  elite:{chance:0.05,from:20,hp:3,r:1.3,xp:3,dmg:1.3,col:C.gold},
  // פיצוץ שלל: רגע נדיר בהריגה של אויב רגיל
  jackpot:{chance:0.004,orbs:30,table:{coins:[1,60],gold:[1,3],ruby:[0.4,1],sapphire:[0.4,1],bolt:[0.4,1],aqua:[0.4,1],amber:[0.4,1],star:[0.2,1]}},
  // הריגה ראשונה של כל סוג אויב היום: בונוס קטן ואבן שבורה
  firstKill:{coins:[1,10],rubyC:[0.25,1],sapphireC:[0.25,1],boltC:[0.25,1],aquaC:[0.25,1],amberC:[0.25,1]},
  // מזל עם הגנה: משלל בדרגה from ומעלה. כל החטאה מוסיפה step לסיכוי (כפול), עד max. נופל = מתאפס
  pity:{from:2,step:0.04,max:3},
  beam:90                          // גובה עמוד האור של שלל נדיר על הרצפה, כפול beam של הדרגה חלקי 100 (drops.js)
};

const lootDay=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
const lootTier=r=>(resOf(r)||{rar:0}).rar;

// טבלת השלל של מה שנפל: מקור משאבים (NODES), בוס (BOSSES), מבוקש (WANTED) או אויב (ETYPES)
function dropTable(e){return e.node?NODES.kinds[e.kind].drop:e.isBoss?(BOSSES[e.type]||{}).drop:e.wanted?WANTED.drop:(ETYPES[e.type]||{}).drop}

/* מגריל טבלת שלל {משאב:[סיכוי, כמה, משנייה]}. מה שנפל נוחת על הרצפה ב-(x,y) (dropSpawn ב-drops.js), בצבע ובעמוד האור של הדרגה,
   ונכנס לשלל כשאוספים אותו. מחזיר מה נפל. נקרא מ-lootKill, nodeDown, wantedDown ו-exitRoom */
function runGive(D,x,y){
  const got=[];if(!D)return got;
  const pf=LOOT.pity.from,boost=1+Math.min(LOOT.pity.max,(SAVE.pity||0)*LOOT.pity.step);
  let top=-1,hasRare=false;
  for(const r in D){
    const [ch,n,from]=D[r];if(from&&S.t<from)continue;
    const t=lootTier(r);if(t>=pf)hasRare=true;
    if(Math.random()>=ch*(t>=pf?boost:1)*orbitLuck())continue;   // orbitLuck: חפץ מזל (orbit.js)
    // נופל לרצפה ונאסף כשעוברים לידו (drops.js). בחדר הבונוס נכנס ישר לשלל
    if(S.room)runLoot()[r]=(runLoot()[r]||0)+n;else dropSpawn(r,n,x,y);got.push(r);top=Math.max(top,t);
    (S.drops||(S.drops=[0,0,0,0,0]))[t]+=n;
  }
  if(hasRare)SAVE.pity=top>=pf?0:(SAVE.pity||0)+1;
  if(top>=pf){celebrate(x,y,'loot'+top,resIcon(got.find(r=>lootTier(r)===top)))}
  return got;
}

// נקרא מ-kill בכל אויב שנופל: הטבלה שלו, עלית, הריגה ראשונה היום ופיצוץ שלל
function lootKill(e){
  const D=dropTable(e),y=e.y-e.r;
  runGive(D,e.x,e.y);
  if(e.elite||e.champ){runGive(D,e.x,e.y);runGive(ETYPES[e.type].elite,e.x,e.y)}
  const key=e.isBoss?'boss':e.wanted?'wanted':e.type,dl=SAVE.daily;(S.killsBy||(S.killsBy={}))[key]=(S.killsBy[key]||0)+1;
  if(dl.day!==lootDay()){dl.day=lootDay();dl.first={}}
  if(!dl.first[key]){dl.first[key]=1;S.firstKills=(S.firstKills||0)+1;floatText(e.x,y-60,T('loot.first',T('foe.'+key)),C.gold,14);runGive(LOOT.firstKill,e.x,e.y)}
  const J=LOOT.jackpot;
  if(!e.isBoss&&!e.wanted&&Math.random()<J.chance){
    S.jackpots=(S.jackpots||0)+1;runGive(J.table,e.x,e.y);
    for(let i=0;i<J.orbs;i++){const a=rand(0,6.28),rr=rand(8,70);orbs.push({x:e.x+Math.cos(a)*rr,y:e.y+Math.sin(a)*rr,v:1})}
    banner(T('loot.jackpot'),C.gold);celebrate(e.x,e.y,'loot4','💰');sparks(e.x,e.y,C.gold,40,320);S.shake=Math.max(S.shake,10);
  }
}

// נקרא מ-addEnemy: לפעמים אויב רגיל הוא אויב עלית (e.champ). אויב-העל של התחנות (run.js, e.elite) מפיל את אותו שלל עלית
function eliteRoll(e){
  const E=LOOT.elite;if(S.t<E.from||!ETYPES[e.type].elite||Math.random()>=E.chance)return;
  e.champ=true;e.hp*=E.hp;e.max*=E.hp;e.r*=E.r;e.xp*=E.xp;e.dmg*=E.dmg;S.elites=(S.elites||0)+1;
}

// כל פריים בזירה. עמודי האור של השלל מצוירים עכשיו על השלל עצמו ברצפה (drops.js)
function lootUpdate(dt){}

/* ---- ציור: טבעת זהב מתחת לאויבי עלית. בקנבס, מעל התלת-ממד ---- */
function drawLoot(){
  if(S.room)return;
  for(const e of enemies)if(e.champ&&!e.dead){ctx.strokeStyle=LOOT.elite.col;ctx.lineWidth=3;ctx.globalAlpha=0.6+0.3*Math.sin(S.t*6);
    ctx.beginPath();ctx.ellipse(e.x,e.y+e.r*0.8,e.r*1.3,e.r*0.5,0,0,7);ctx.stroke();ctx.globalAlpha=1}

}

/* ---- סיכום בסוף ריצה: מה נפל, מהנדיר לרגיל, וכמה מכל דרגה ---- */
function lootSummary(L){
  const rs=Object.keys(L).filter(r=>resOf(r)&&L[r]>0).sort((a,b)=>lootTier(b)-lootTier(a));
  if(!rs.length)return '';
  const by=[0,0,0,0,0];rs.forEach(r=>by[lootTier(r)]+=L[r]);
  const head=by.map((n,t)=>n&&t?'<span class="tier" style="--tint:'+RES.rarity[t].col+'">'+n+' '+T('tier')[t]+'</span>':'').reverse().join('');
  return (head?'<div class="tiers">'+head+'</div>':'')+bagLine(L,rs);
}
