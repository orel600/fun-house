/* אתגר יומי (Claude מוביל, 31.10.2026. המחקר: docs/research-skills.md, מקום 10).
   פעם ביום חוק מיוחד בעולם הפתוח בלבד, עם יתרון וחיסרון. אותו חוק לכל השחקנים באותו תאריך (לפי התאריך, לא אקראי).
   מטרה פשוטה ליום (CHALLENGE.goal הריגות בעולם תחת החוק), והפרס נאסף בכפר, ביומן הקווסטים.
   לא מענישים על פספוס: מי שהשלים ולא אסף, הפרס מחכה לו גם מחר. מי שלא שיחק, לא מפסיד כלום.
   החוק נכנס לאויב כשהוא מופיע בעולם (challengeSpawn מ-wSpawn ב-world.js), ולכן הזירה לא מושפעת.
   נשמר ב-SAVE.challenge: {day, n:כמה הריגות היום, got:היום שבו נאסף הפרס, owed:פרס מיום קודם שמחכה}.
   הטקסטים ב-lang.js תחת 'ch.' */
const CHALLENGE={
  goal:30,                                        // כמה הריגות בעולם תחת החוק
  reward:{coins:90,iron:4,essence:2},             // הפרס, למשאבים ב-RES
  icon:'🌀',                                      // הסימן בפס העליון בעולם
  /* החוקים. כל מספר משנה את האויב כשהוא מופיע בעולם:
     speed, hp, dmg, r: פי כמה. affix: כל אויב מקבל תכונה (affix.js). type+boost/cut: סוג הנזק הזה חזק (פי boost), וכל השאר חלשים (פי cut).
     loot: בכל הריגה עוד הגרלה של השלל. coins:[מ,עד] מטבעות נוספים על הרצפה בכל הריגה */
  rules:{
    swift:  {speed:1.45,loot:1},                  // כולם מהירים, אבל שלל כפול
    elite:  {affix:true,coins:[4,9]},             // אויבים מיוחדים בכל מקום, ועוד מטבעות
    fire:   {type:'fire',boost:2.2,cut:0.6},      // רק אש פוגעת חזק
    storm:  {type:'lightning',boost:2.2,cut:0.6}, // רק ברק פוגע חזק
    giants: {hp:2,r:1.3,coins:[6,12]},            // ענקים: פי 2 חיים, ומטבעות על כל אחד
    glass:  {hp:0.5,dmg:1.8},                     // זכוכית: נופלים מהר, אבל מכים חזק
    gold:   {dmg:1.4,coins:[5,10]}                // בהלה לזהב: מכים חזק יותר, וכל אחד מפיל מטבעות
  },
  announce:1.2                                    // שניות אחרי הכניסה לעולם עד ההודעה על החוק
};

const chDay=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
// החוק של התאריך: אותו חוק לכולם. day: לבדיקה בבוט
function chRule(day=chDay()){let h=0;for(const c of day)h=(h*31+c.charCodeAt(0))>>>0;const ids=Object.keys(CHALLENGE.rules);return ids[h%ids.length]}
// השמירה. יום חדש מאפס את ההתקדמות, ופרס שהושלם ולא נאסף נשמר כ-owed
function chSave(day=chDay()){
  const c=SAVE.challenge||(SAVE.challenge={day,n:0,got:'',owed:false});
  if(c.day!==day){if(c.n>=CHALLENGE.goal&&c.got!==c.day)c.owed=true;c.day=day;c.n=0}
  return c;
}
const chDone=()=>chSave().n>=CHALLENGE.goal;
const chCan=()=>{const c=chSave();return c.owed||c.n>=CHALLENGE.goal&&c.got!==c.day};

// אויב שמופיע בעולם (wSpawn ב-world.js): החוק של היום נכנס אליו
function challengeSpawn(e){
  if(!S.wd||e.creature)return;
  const R=CHALLENGE.rules[chRule()];e.ch=1;
  if(R.speed)e.speed*=R.speed;
  if(R.hp){e.hp*=R.hp;e.max*=R.hp}
  if(R.dmg)e.dmg*=R.dmg;
  if(R.r)e.r*=R.r;
  if(R.affix&&!e.affix){const ids=Object.keys(AFFIX.list);affixSet(e,ids[Math.floor(Math.random()*ids.length)])}
  if(R.type){const m=Object.assign({},e.mult);for(const t in DMG.types)m[t]=(m[t]??1)*(t===R.type?R.boost:R.cut);e.mult=m}   // עותק: המכפילים של הסוג משותפים לכל האויבים מהסוג
}
// אויב שנפל (kill ב-combat.js): נספר למטרה, ושלל נוסף לפי החוק
function challengeKill(e){
  if(!S.wd||!e.ch)return;
  const R=CHALLENGE.rules[chRule()],c=chSave();
  if(R.loot)runGive(dropTable(e),e.x,e.y);
  if(R.coins)dropSpawn('coins',Math.round(rand(...R.coins)),e.x,e.y);
  if(c.n<CHALLENGE.goal){c.n++;if(c.n===CHALLENGE.goal){banner(T('ch.done'),C.gold);celebrate(P.x,P.y-10,'quest',CHALLENGE.icon);saveNow()}}
  challengeHud();
}
// כניסה לעולם (enterWorld ב-world.js): הסימן למעלה, והודעה על החוק
function challengeEnter(){
  challengeHud();
  setTimeout(()=>{if(S.wd&&S.mode==='play')banner(CHALLENGE.icon+' '+T('ch.r.'+chRule())[0]+' · '+T('ch.r.'+chRule())[1],C.tide)},CHALLENGE.announce*1000);
}
// הסימן בפס העליון בעולם: אייקון והתקדמות (קצר, כדי שלא ידחוף את התרמיל). השם בהודעה בכניסה וביומן
function challengeHud(){
  const el=$('chTag');if(!el)return;
  if(!S.wd){el.hidden=true;return}
  const c=chSave(),t=CHALLENGE.icon+' '+Math.min(c.n,CHALLENGE.goal)+'/'+CHALLENGE.goal+(chDone()?' ✓':'');
  el.hidden=false;if(el.textContent!==t)el.textContent=t;
}
// לוקחים את הפרס (בכפר). מחזיר true אם נאסף
function challengeClaim(){
  if(!S.vil||!chCan())return false;
  const c=chSave();
  if(c.owed)c.owed=false;else c.got=c.day;
  for(const r in CHALLENGE.reward)bagAdd(r,CHALLENGE.reward[r]);
  saveNow();celebrate(P.x,P.y-10,'quest',CHALLENGE.icon);
  banner(T('ch.claimed'),C.gold);return true;
}
// הכרטיס ביומן הקווסטים (questLog ב-quests.js)
function challengeCard(){
  const c=chSave(),id=chRule(),[name,say]=T('ch.r.'+id),can=chCan();
  let h='<h4>'+CHALLENGE.icon+' '+T('ch.title')+'</h4><div class="qc chc'+(can?' ready':'')+'"><b>'+name+'</b><small>'+T('ch.sub')+'</small><p class="say">'+say+'</p>';
  h+='<ul><li>'+T('ch.goal',CHALLENGE.goal)+' <em>'+Math.min(c.n,CHALLENGE.goal)+'/'+CHALLENGE.goal+'</em></li></ul>';
  h+='<div class="qrow"><div class="cost">'+qRewardLine(CHALLENGE.reward)+'</div>';
  if(can)h+=S.vil?'<button class="vbtn" data-act="chClaim">'+T('q.claim')+'</button>':'<p class="next">'+T('ch.home')+'</p>';
  else if(c.got===c.day)h+='<p class="next">'+T('q.doneToday')+'</p>';
  return h+'</div></div>';
}
$('qLog').addEventListener('click',e=>{const b=e.target.closest('[data-act="chClaim"]');if(b&&challengeClaim())questLog()});
