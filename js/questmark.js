/* סימן קריאה מעל אויב שצריך להרוג לקווסט (ניר, 5.11.2026: "יופיע מעל המפלצת הרלוונטית סימן קריאה, כדי שיהיה ברור את מי צריך להרוג").
   רק בעולם הפתוח. בזירה (של אוראל) לא משתנה כלום.
   מי מסומן (qmWants): אויב שהריגה שלו מקדמת עכשיו יעד שעוד לא הושלם בקווסט פעיל. אותו מפתח כמו ב-kill ב-combat.js
   (boss / wanted / warden / סוג האויב), ובנוסף הנמסיס של לוח הפונדק (inn.js, יעד nemesis) והמבוקש היום (hunt.js, 'hunt').
   כל המקורות עוברים דרך QS().active: הקווסטים של quests.js, הלוח בפונדק (inn.js מוסיף את המשימות שלו כקווסטים), יומיים והישגים.
   מה לא מסומן, בכוונה:
   - יעד 'any' (להרוג כל אויב), והמשימה היומית של החוק (mutation.js: כל אויב בעולם תחת החוק נספר). סימן על כל אויב זה רעש.
   - מפלצות נדירות (rares.js), גם כשקווסט הדרגה דורש אותן: הן אמורות להיות קשות למצוא.
   - קורא שבורח (foeai.js) כבר מקבל "!" משלו, אז בזמן הבריחה לא מוסיפים עוד אחד.
   ביצועים: הרשימה מחושבת פעם ב-QMARK.every פריימים, והציור רק עובר עליה.
   החיבור: qmScreen בציור העולם (drawWorldScreen ב-world.js). */
const QMARK={
  every:10,          // כל כמה פריימים מחשבים מחדש מי מסומן
  col:'#FFD34D',     // צהוב-זהב
  edge:'#3A2A08',    // קו מתאר כהה, שייקרא גם על דשא
  size:24,           // גודל על המסך (px), קבוע ולא מתכווץ עם המצלמה
  bob:3,speed:5,     // קפיצה עדינה: כמה פיקסלים ובאיזו מהירות
  // כמה מעל הראש (יחידות עולם), לפי מה שכבר מצויר שם: שם רגיל, שם עלית, המבוקש היום, שם השומר
  up:{base:50,named:64,hunt:62,warden:76,say:30}   // say: מעל בועת דיבור (foelore.js), שלא תכסה את הסימן
};
const QM={f:0,want:null,list:[]};

// מה צריך עכשיו: מפתחות הריגה מכל יעד פעיל שעוד לא הושלם
function qmNeeds(){
  const w=new Set();if(typeof QS!=='function'||!SAVE||!SAVE.quests)return w;
  for(const id in QS().active){const q=QBY[id];if(!q)continue;
    q.obj.forEach((o,i)=>{if(qProg(q,i)>=o.n)return;
      if(o.type==='kill'&&o.what&&o.what!=='any')w.add(o.what);
      else if(o.type==='nemesis')w.add('nemesis')})}
  return w;
}
// האם האויב הזה נחוץ לקווסט פעיל (המפתח כמו ב-kill ב-combat.js)
function qmWants(e,W=QM.want){
  if(!W||!W.size||!e||e.dead||e.rare||e.dummy||e.node)return false;
  const k=e.isBoss?'boss':e.wanted?'wanted':e.warden?'warden':e.type;
  return W.has(k)||!!e.nem&&W.has('nemesis')||!!e.hunt&&W.has('hunt');
}
function qmRefresh(){QM.f=QMARK.every;QM.want=qmNeeds();QM.list=QM.want.size?enemies.filter(e=>qmWants(e)):[]}
const qmMarked=e=>QM.list.includes(e)&&!e.dead;

// ציור מעל התלת-ממד (drawWorldScreen ב-world.js)
function qmScreen(ox,oy){
  if(!S.wd){QM.list=[];return}
  if(--QM.f<=0)qmRefresh();
  if(!QM.list.length)return;
  const M=QMARK,U=M.up,fs=S.wd.flSay,b=Math.sin(fxNow()*M.speed)*M.bob;
  ctx.save();ctx.textAlign='center';ctx.direction=DIR;ctx.lineJoin='round';
  for(const e of QM.list){
    if(e.dead||e.act==='flee')continue;
    const up=fs&&fs.e===e?(e.pname||e.affix||e.hunt?66:50)+U.say:e.hunt?U.hunt:e.warden&&!e.wboss?U.warden:e.pname||e.affix?U.named:U.base,x=e.x+ox,y=e.y+oy-e.r-up;
    if(!onScreen(x,y))continue;
    ctx.save();ctx.translate(x,y);ctx.scale(1/ZOOM,1/ZOOM);
    ctx.font='900 '+M.size+'px Heebo, system-ui, sans-serif';ctx.lineWidth=5;ctx.strokeStyle=M.edge;
    ctx.strokeText('!',0,b);ctx.fillStyle=M.col;ctx.fillText('!',0,b);ctx.restore();
  }
  ctx.restore();
}
