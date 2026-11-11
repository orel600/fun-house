/* מתנה יומית: לוח של 7 ימים בכפר (Claude מוביל, 31.10.2026).
   בכניסה הראשונה לכפר בכל יום המתנה מופיעה כשורה בחלון "בזמן שלא היית" (welcome.js). הלוח עצמו נפתח מכפתור 🎁: היום הנוכחי מאיר, ולוחצים "לקחת".
   מי שפספס יום לא מתחיל מאפס, אלא ממשיך מאיפה שעצר. אחרי יום 7 הלוח מתחיל מחדש.
   סגרו בלי לקחת? כפתור קטן עם נקודה אדומה בסרגל למטה מזכיר. נשמר ב-SAVE.daily.gift: {n:כמה ימים נלקחו בלוח, day:התאריך האחרון שנלקח}.
   (SAVE.daily עצמו משמש גם את ההריגה הראשונה היום ב-loot.js, ולכן המתנה בתוכו, בשדה משלה) */
const DAILY={
  // הפרס לכל יום: משאבים מ-RES. יום 7 הוא תיבה: המשאבים, ועוד אחד מ-chest (אבן חן או פריט ציוד אקראי)
  days:[
    {coins:50, wood:10},
    {coins:80, stone:15},
    {coins:120,cloth:6,resin:4},
    {coins:160,iron:6,herb:8},
    {coins:220,silver:4},
    {coins:300,gold:3,essence:4},
    {coins:400,chest:1},
  ],
  chest:{gem:0.55,gems:2,gearTier:2},   // gem: הסיכוי לאבני חן (gems כמה). אחרת פריט ציוד אקראי עד הדרגה gearTier
};

const dailyDay=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
// השמירה של המתנה. שמירה ישנה (או מהענן) בלי השדה מקבלת אותו כאן
function dailySave(){const d=SAVE.daily||(SAVE.daily={day:'',first:{}});return d.gift||(d.gift={n:0,day:''})}
const dailyIdx=()=>dailySave().n%DAILY.days.length;
const dailyCan=(day=dailyDay())=>dailySave().day!==day;

// לוקחים את המתנה של היום. מחזיר מה התקבל ({r:כמה}), או null אם כבר נלקחה היום. day: לבדיקה בבוט
function dailyClaim(day=dailyDay()){
  if(!dailyCan(day))return null;
  const G=dailySave(),i=dailyIdx(),D=DAILY.days[i],got={};
  for(const r in D)if(r!=='chest')got[r]=D[r];
  if(D.chest){const C=DAILY.chest;
    if(Math.random()<C.gem)got.gem=(got.gem||0)+C.gems;
    else{const ids=Object.keys(GEAR.items).filter(id=>GEAR.items[id].tier<=C.gearTier);got[ids[Math.floor(Math.random()*ids.length)]]=1}}
  for(const r in got)bagAdd(r,got[r]);
  G.n=(G.n+1)%DAILY.days.length;G.day=day;saveNow();
  return{got,i,big:!!D.chest};
}

/* ---- החלון ---- */
const dIcon=r=>GEAR.items[r]?gPic(r):resPic(r);
const dName=r=>GEAR.items[r]?gName(r):T('res.'+r);
// כרטיס קטן ושקט (ניר, 11.11, קונספט מסכים ברורים #672): לא חלון גדול שנראה כמו פרסומת. אותו מידע: 7 ימים כשורת עיגולים, מה מקבלים היום, וכפתור אחד.
// "לקחת" לוקח וסוגר מיד (נגיעה אחת). נגיעה מחוץ לכרטיס או ✕ סוגרים. רק בכפר, אז אף פעם לא באמצע קרב
function dailyDraw(){
  const i=dailyIdx(),can=dailyCan(),D=DAILY.days[i];
  let s=winHead('🎁 '+T('daily.title'),T('daily.day',i+1)+'/'+DAILY.days.length,'h3')+'<div class="dpips">';
  DAILY.days.forEach((d,k)=>{const st=k<i||(k===i&&!can)?'done':k===i?'now':'';
    s+='<span class="dpip '+st+(d.chest?' big':'')+'" aria-label="'+T('daily.day',k+1)+'">'+(st==='done'?'✓':d.chest?'<img class="ri" src="icons/ui/daily-chest.png" alt="">':k+1)+'</span>'});
  s+='</div><div class="dgot">';
  for(const r in D)s+=r==='chest'?'<span class="res" title="'+T('daily.chest')+'"><img class="ri" src="icons/ui/daily-chest.png" alt="">'+T('daily.chestS')+'</span>':'<span class="res">'+dIcon(r)+' '+shortN(D[r])+'</span>';
  s+='</div>'+(can?'<button class="vbtn" data-act="take">'+T('daily.take')+'</button>':'<p class="dim">'+T('daily.back')+'</p>');
  $('dailyWin').innerHTML=s;
}
function dailyOpen(){if(!S||S.mode!=='play'||!S.vil)return;S.mode='daily';joy=null;dailyDraw();$('ovDaily').hidden=false}
function dailyClose(){$('ovDaily').hidden=true;if(S&&S.mode==='daily')S.mode='play';dailyBtn()}
// הכפתור הקטן בסרגל: רק בכפר, ורק כשיש מה לקחת
function dailyBtn(){$('dBtn').hidden=!(S&&S.vil&&dailyCan())}
// נקרא בכניסה לכפר (village.js): רק הכפתור. המתנה של היום מופיעה בחלון "בזמן שלא היית" (welcome.js), ולא בחלון קופץ משלה
function dailyVillage(){dailyBtn()}
$('dailyWin').addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  if(b.dataset.act==='close'){dailyClose();sfx('ui');return}
  if(b.dataset.act==='take'){const r=dailyClaim();if(!r)return;
    celebrate(P.x,P.y,r.big?'rank':'quest',r.big?'🎁':'+');
    banner(T('daily.got',Object.keys(r.got).map(k=>'+'+r.got[k]+' '+dName(k)).join(' · ')),C.gold);
    dailyClose()}   // נגיעה אחת: לוקחים וסוגרים
});
$('dBtn').addEventListener('click',()=>{dailyOpen();sfx('ui')});
