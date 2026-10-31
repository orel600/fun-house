/* מתנה יומית: לוח של 7 ימים בכפר (Claude מוביל, 31.10.2026).
   בכניסה הראשונה לכפר בכל יום (תאריך מקומי, כמו הקווסטים היומיים) נפתח חלון. היום הנוכחי מאיר, ולוחצים "לקחת".
   מי שפספס יום לא מתחיל מאפס, אלא ממשיך מאיפה שעצר (נדיב, בשביל ילדים). אחרי יום 7 הלוח מתחיל מחדש.
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
  openDelay:0.6,                        // שניות אחרי הכניסה לכפר, כדי שהכפר יופיע קודם
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
function dailyDraw(){
  const i=dailyIdx(),can=dailyCan();
  let s=winHead(T('daily.title'),T('daily.sub'),'h2')+'<div class="dbody"><div class="dgrid">';
  DAILY.days.forEach((D,k)=>{
    const st=k<i||(k===i&&!can)?'done':k===i?'now':'';
    const main=D.chest?'<img class="dchest" src="icons/ui/daily-chest.png" alt="">':dIcon(Object.keys(D).find(r=>r!=='coins')||'coins');
    s+='<div class="dday '+st+(D.chest?' big':'')+'"><small>'+T('daily.day',k+1)+'</small>'+main+'<span>'+resPic('coins')+shortN(D.coins||0)+'</span>'+(st==='done'?'<i>✓</i>':'')+'</div>';
  });
  const D=DAILY.days[i];
  s+='</div><div class="dside"><h3>'+T('daily.day',i+1)+'</h3><ul>';
  for(const r in D)s+='<li>'+(r==='chest'?'<img class="ri" src="icons/ui/daily-chest.png" alt="">'+T('daily.chest'):dIcon(r)+' '+dName(r)+' <b>×'+D[r]+'</b>')+'</li>';
  s+='</ul><p class="dim">'+T(can?'daily.keep':'daily.back')+'</p>'+
    (can?'<button class="vbtn" data-act="take">'+T('daily.take')+'</button>':'<button class="vbtn ghost" data-act="close">'+T('q.close')+'</button>')+'</div></div>';
  $('dailyWin').innerHTML=s;
}
function dailyOpen(){if(!S||S.mode!=='play'||!S.vil)return;S.mode='daily';joy=null;dailyDraw();$('ovDaily').hidden=false}
function dailyClose(){$('ovDaily').hidden=true;if(S&&S.mode==='daily')S.mode='play';dailyBtn()}
// הכפתור הקטן בסרגל: רק בכפר, ורק כשיש מה לקחת
function dailyBtn(){$('dBtn').hidden=!(S&&S.vil&&dailyCan())}
// נקרא בכניסה לכפר (village.js): פעם ראשונה היום, החלון נפתח לבד, אם אין חלון אחר פתוח
function dailyVillage(){
  dailyBtn();
  if(!dailyCan())return;
  setTimeout(()=>{if(S.vil&&dailyCan()&&S.mode==='play'&&$('npcDlg').hidden&&$('qLog').hidden)dailyOpen()},DAILY.openDelay*1000);
}
$('dailyWin').addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  if(b.dataset.act==='close'){dailyClose();sfx('ui');return}
  if(b.dataset.act==='take'){const r=dailyClaim();if(!r)return;
    celebrate(P.x,P.y,r.big?'rank':'quest',r.big?'🎁':'+');
    banner(T('daily.got',Object.keys(r.got).map(k=>'+'+r.got[k]+' '+dName(k)).join(' · ')),C.gold);
    dailyDraw();dailyBtn();setTimeout(()=>{if(!$('ovDaily').hidden)dailyClose()},r.big?1400:900)}
});
$('dBtn').addEventListener('click',()=>{dailyOpen();sfx('ui')});
