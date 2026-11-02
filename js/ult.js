/* אולטימייט (אוראל, 1.11.2026, בהשראת MLBB): סקיל רביעי וחזק מאוד, שמתמלא מהריגות בזירה.
   הכפתור משמאל לקשת של הסקילים, ומילוי סביבו מראה כמה נטען. מלא: זוהר וטבעת קצרה. לחיצה: "פרץ הפנס", גל הדף גדול
   מהשחקן שפוגע בכל אויב על המסך, בסוג הנזק של הנשק שביד (אז חולשות וקומבו עובדים), עם רגע קצר של הילוך איטי.
   הגל מצויר דרך הטבעות של הסקילים (skills.js), אז גם החליל והניצוץ (THEMES) מקבלים אותו בסגנון שלהם.
   רק בזירה. המצב ב-S.ult, חדש בכל ריצה. נקרא מ-kill (combat.js) ומ-render.js. מקלדת: 4 */
const ULT={
  need:60,       // כמה הריגות ממלאות אותו
  boss:15,       // הריגה של אויב-על או מבוקש שווה כמה הריגות
  dmg:6,         // נזק: כפול הנזק של הנשק שביד (skBase), לכל אויב על המסך
  boss2:0.5,     // לבוס: חלק מהנזק הזה
  r:520,         // רדיוס הגל (מכסה את המסך לרוחב)
  slow:0.45,     // שניות הילוך איטי
  shake:8        // רעידת מסך
};
const ultArena=()=>!!S&&skArena()&&S.mode==='play';
function ultKill(e){
  if(!skArena())return;
  const u=S.ult||(S.ult={c:0,used:0});
  u.c=Math.min(ULT.need,u.c+(e&&(e.elite||e.champ||e.wanted)?ULT.boss:1));
}
function ultUse(){
  const u=S.ult;if(!ultArena()||!u||u.c<ULT.need)return false;
  u.c=0;u.used++;
  const t=P.dt[P.weapon]||'physical',base=skBase()*ULT.dmg,col=dtCol(t);
  for(const e of enemies.slice()){
    if(e.dead||e.node||Math.hypot(e.x-P.x,e.y-P.y)>ULT.r)continue;
    damage(e,e.isBoss?base*ULT.boss2:base,'skill',Math.atan2(e.y-P.y,e.x-P.x),t);
  }
  if(S.sk)S.sk.fx.push({ring:1,x:P.x,y:P.y,r:ULT.r,t:0,max:0.6*themeK(),col});
  S.slow=Math.max(S.slow||0,ULT.slow);S.shake=Math.max(S.shake||0,ULT.shake);sfx('celebrate');
  return true;
}
// הכפתור: מוסתר מחוץ לזירה. --cd הוא החלק שעוד לא נטען (כמו בסקילים), ו-ping כשהוא מתמלא
function ultHud(){
  const b=$('ult'),on=ultArena();if(b.hidden===on)b.hidden=!on;if(!on)return;
  const u=S.ult||(S.ult={c:0,used:0}),v=String(Math.round(20*(1-u.c/ULT.need))/20);
  if(b.dataset.cd!==v){const was=b.classList.contains('ready');b.dataset.cd=v;b.style.setProperty('--cd',v);b.style.setProperty('--dt',dtCol(P.dt[P.weapon]||'physical'));
    b.classList.toggle('ready',v==='0');if(v==='0'&&!was){b.classList.remove('ping');void b.offsetWidth;b.classList.add('ping')}}
}
$('ult').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();ultUse()});
$('ult').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();ultUse()}});
addEventListener('keydown',e=>{if(e.code==='Digit4'&&S&&e.target===document.body)ultUse()});
