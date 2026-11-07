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
  // מטבעות בעולם הפתוח: פי כמה הסיכוי למטבעות בטבלת השלל של אויב רגיל (בזירה לא משתנה. שלל בטוח, סיכוי 1, כמו מבוקש, שומר ותיבה, לא משתנה). יעד: כ-300 בעשר הדקות הראשונות (המבקר, 1.11)
  worldCoins:0.25,
  // הריגה ראשונה של כל סוג אויב היום: בונוס קטן ואבן שבורה
  firstKill:{coins:[1,10],rubyC:[0.25,1],sapphireC:[0.25,1],boltC:[0.25,1],aquaC:[0.25,1],amberC:[0.25,1]},
  // מזל עם הגנה: משלל בדרגה from ומעלה. כל החטאה מוסיפה step לסיכוי (כפול), עד max. נופל = מתאפס
  pity:{from:2,step:0.04,max:3},
  /* ציוד מאויבים בעולם הפתוח (ניר, 31.10.2026: "הרגתי כמה מפלצות וקיבלתי כל מיני דברים, אבל אף פעם לא נשק או פריט"; התכוון לאזור הראשון).
     רק בעולם הפתוח (S.wd). הזירה היא של אוראל, ושם ציוד נופל כמו קודם, בסוף ריצה (GEAR.loot).
     נשק, תכשיט, מגפיים או חפץ מסתובב (gRoll ב-gear.js, לפי GEAR.tiers). הסיכוי לפי מי נפל, rolls: כמה הגרלות, והנדיר ביותר נבחר.
     pity: כמו המזל עם ההגנה, כל אויב בלי ציוד מגדיל קצת את הסיכוי הבא, עד max (SAVE.gearPity) */
  gear:{
    foe:{chance:0.03,rolls:1}, champ:{chance:0.1,rolls:2}, elite:{chance:0.25,rolls:2},   // בעולם: בערך פריט אחד כל 25-30 מפלצות
    wanted:{chance:0.6,rolls:3}, boss:{chance:0.5,rolls:3},
    pity:{step:0.06,max:3},
    /* מה נופל ובאיזו שכבה (ניר, 2.11.2026: "הגעתי לרמה 20 ולא נפל לי אף נשק שמתאים לקלאס שלי"). רק בעולם, דרך lootRoll. בזירה gRoll כמו קודם.
       slot: כמה נפוצה כל משבצת. cls.share: איזה חלק מהנשקים הם של הדמות (arms ב-HEROES), והשאר מהדמויות האחרות, כי כל דמות יכולה להחזיק כל נשק.
       cls.pity: אחרי כמה פריטים ברצף בלי נשק של הדמות, הבא הוא בטוח נשק שלה (SAVE.clsPity).
       tier: מפל שכבות (ניר, 7.11.2026, מסרטון על טבלאות שלל). p = האחוז האמיתי של כל שכבה (עץ, ברזל, כסף, זהב, אגדי) לפי רמת הדמות.
       מגרילים מלמעלה: קודם אגדי, אחר כך זהב, כסף וברזל, ועץ הוא מה שנשאר (המספר שלו לא בשימוש). כך האחוז של שכבה לא זז
       כשמוסיפים פריטים או משנים שכבה אחרת. הסכום של ברזל עד אגדי לא עובר 100.
       חל המדרג האחרון שה-lv שלו קטן או שווה לרמה. דרגת העולם מכפילה את האחוזים (TIERS.list[*].gw ב-tiers.js) ואז הם חוזרים לסכום 100:
       אגדי נופל בעולם רק בדרגה 3.
       אין פריט בשכבה שנבחרה (למשל מגפי זהב): השכבה הקרובה מתחת, ואם אין, מעל */
    slot:{weapon:0.4,acc:0.25,boots:0.15,orbit:0.2},
    cls:{share:0.6,pity:3},
    tier:[{lv:1,p:[0,30,9,1,0]},{lv:5,p:[0,40,20,5,0]},{lv:10,p:[0,35,35,13,2]},{lv:15,p:[0,25,40,24,5]},{lv:20,p:[0,15,38,35,10]}]
  },
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
    if(Math.random()>=ch*(t>=pf?boost:1)*orbitLuck()*statLoot()*(r==='coins'&&S.wd&&ch<1?LOOT.worldCoins:1)*lootK)continue;   // orbitLuck: חפץ מזל (orbit.js). lootK: אויב עם יותר חיים (lootFoeK)
    // נופל לרצפה ונאסף כשעוברים לידו (drops.js). בחדר הבונוס נכנס ישר לשלל
    if(S.room)runLoot()[r]=(runLoot()[r]||0)+n;else dropSpawn(r,n,x,y);got.push(r);top=Math.max(top,t);
    (S.drops||(S.drops=[0,0,0,0,0]))[t]+=n;
  }
  if(hasRare)SAVE.pity=top>=pf?0:(SAVE.pity||0)+1;
  if(top>=pf){celebrate(x,y,'loot'+top,resIcon(got.find(r=>lootTier(r)===top)))}
  return got;
}

// פי כמה XP ושלל לאויב רגיל בעולם: יש לו יותר חיים (WORLD.foeReward, 6.11). שומרים, נדירות, מבוקש, נמסיס וציד: כרגיל
function lootFoeK(e){return S.wd&&!e.node&&!e.isBoss&&!e.wanted&&!e.warden&&!e.rare&&!e.nem&&!e.hunt?(WORLD.foeReward||1):1}
let lootK=1;   // בזמן lootKill: מכפיל את הסיכויים ב-runGive
// נקרא מ-kill בכל אויב שנופל: הטבלה שלו, עלית, הריגה ראשונה היום ופיצוץ שלל
function lootKill(e){
  const D=dropTable(e),y=e.y-e.r;
  lootK=lootFoeK(e);
  try{runGive(D,e.x,e.y);
  if(e.elite||e.champ){runGive(D,e.x,e.y);runGive(ETYPES[e.type].elite,e.x,e.y)}}finally{lootK=1}
  const key=e.isBoss?'boss':e.wanted?'wanted':e.type,dl=SAVE.daily;(S.killsBy||(S.killsBy={}))[key]=(S.killsBy[key]||0)+1;
  if(dl.day!==lootDay()){dl.day=lootDay();dl.first={}}
  if(!dl.first[key]){dl.first[key]=1;S.firstKills=(S.firstKills||0)+1;if(feedOn())feedAdd('☀️',T('loot.first',T('foe.'+key)),C.gold,'first:'+key);else floatText(e.x,y-60,T('loot.first',T('foe.'+key)),C.gold,14);runGive(LOOT.firstKill,e.x,e.y)}
  lootGear(e);homeKill(e);   // חפץ ביסוד של פנס שדולק (homecoming.js)
  const J=LOOT.jackpot;
  if(!e.isBoss&&!e.wanted&&Math.random()<J.chance){
    S.jackpots=(S.jackpots||0)+1;runGive(J.table,e.x,e.y);
    for(let i=0;i<J.orbs;i++){const a=rand(0,6.28),rr=rand(8,70);orbs.push({x:e.x+Math.cos(a)*rr,y:e.y+Math.sin(a)*rr,v:1})}
    banner(T('loot.jackpot'),C.gold);celebrate(e.x,e.y,'loot4','💰');sparks(e.x,e.y,C.gold,40,320);S.shake=Math.max(S.shake,10);
  }
}

// פריט ציוד שנופל מאויב בעולם הפתוח: נוחת על הרצפה, נמשך לשחקן ונכנס לתרמיל (dropTake ב-drops.js). force: לבדיקה, נופל תמיד. מחזיר את הפריט או null
function lootGear(e,force){
  const G=LOOT.gear,k=e.isBoss?'boss':e.wanted?'wanted':e.elite?'elite':e.champ?'champ':'foe',R=G[k];
  if(e.node||!R||S.room||(!S.wd&&!force))return null;   // רק בעולם הפתוח, לא בזירה
  const ch=R.chance*lootFoeK(e)*(1+Math.min(G.pity.max,(SAVE.gearPity||0)*G.pity.step))*orbitLuck()*statLoot()*(typeof tierGearK==='function'?tierGearK():1);   // דרגת עולם (tiers.js)
  if(!force&&Math.random()>=ch){SAVE.gearPity=(SAVE.gearPity||0)+1;return null}
  SAVE.gearPity=0;const id=lootRoll(R.rolls);S.gearDrops=(S.gearDrops||0)+1;
  dropSpawn(id,1,e.x,e.y);if(feedOn())feedGear(id);else banner(T('loot.gear')+' '+gIcon(id)+' '+gName(id)+powTag(id),dropTier(id).col);   // בעולם ובכפר: בפיד (feed.js)
  celebrate(e.x,e.y,'loot'+Math.max(2,dropRar(id)),gIcon(id));
  return id;
}

/* איזה פריט נופל בעולם (LOOT.gear: slot, cls, tier). n: כמה הגרלות של שכבה, והגבוהה נבחרת. mine: לבדיקה, true מכריח נשק של הדמות.
   לפעמים עם כוח (powRoll ב-powers.js), כמו gRoll */
// מפל השכבות (LOOT.gear.tier): מגריל מספר אחד בין 0 ל-100 ובודק מהשכבה הנדירה למטה. מחזיר את מספר השכבה (0 = עץ)
function lootCascade(P){let r=Math.random()*100;for(let i=P.length-1;i>0;i--){if(r<P[i])return i;r-=P[i]}return 0}

function lootRoll(n=1,mine){
  const G=LOOT.gear,h=heroId(),arms=h&&HEROES.list[h].arms,pick=o=>{let r=Math.random()*Object.values(o).reduce((a,b)=>a+b,0);for(const k in o){r-=o[k];if(r<0)return k}return Object.keys(o)[0]};
  let slot=pick(Object.assign({},G.slot,ARMOR.loot.slot));
  if(arms){if(mine||(SAVE.clsPity||0)>=G.cls.pity){slot='weapon';mine=true}else mine=slot==='weapon'&&Math.random()<G.cls.share}
  const arm=armorPick(slot);   // שריון: מוטה למחלקה שלך (armor.js). אחרי המזל, שכבר יכול היה להפוך את המשבצת לנשק
  const lv=heroLv(),B=G.tier.filter(b=>b.lv<=lv).pop().p,W=tierGearW([100-B.slice(1).reduce((a,b)=>a+b,0)].concat(B.slice(1))),   // tierGearW: דרגת העולם. זהב נפוץ רק מדרגה 2, אגדי רק בדרגה 3 (tiers.js)
    tot=W.reduce((a,b)=>a+b,0),P=W.map(w=>w*100/tot);let t=0;   // אחרי דרגת העולם חוזרים ל-100%, כדי שמה שירד לא ייפול כולו על עץ
  for(let i=0;i<n;i++)t=Math.max(t,lootCascade(P));
  const ok=id=>{const it=GEAR.items[id];return it.slot===slot&&!it.types&&arm(it)&&(slot!=='weapon'||!arms||arms.includes(it.w)===!!mine)};
  const pool=Object.keys(GEAR.items).filter(ok),near=pool.length?Math.min(...pool.map(id=>{const d=GEAR.items[id].tier-t;return d<=0?-d:d+10})):0,
    at=pool.filter(id=>{const d=GEAR.items[id].tier-t;return (d<=0?-d:d+10)===near}),id=at[Math.floor(Math.random()*at.length)]||gRoll(n);
  if(arms){const it=GEAR.items[gBase(id)];SAVE.clsPity=it.slot==='weapon'&&arms.includes(it.w)?0:(SAVE.clsPity||0)+1}
  return GEAR.items[id]?irRoll(powRoll(id)):id;   // איכות אקראית (itemroll.js)
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
