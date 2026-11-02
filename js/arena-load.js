/* עומס בזירה (בדיקת הזירה של אוראל, 1.11.2026): הבוט מצא 444 אויבים בבת אחת כשבורחים, ו-747 כדורי XP כשעומדים.
   שלושה דברים שומרים על הטלפון:
   1. אויב שנשאר רחוק מאחור (איטי, או שברחו ממנו) קופץ לטבעת שמחוץ למסך, ליד השחקן, במקום לרדוף לנצח. גם אויב-על: כך אפשר להפיל אותו.
   2. מעל HORDE.cap (spawn.js), האויבים הרגילים הכי רחוקים נעלמים, בלי שלל ובלי XP. בוס, מבוקש ואויב-על לא נעלמים.
   3. מעל orbCap, כדורי ה-XP הכי רחוקים מתאחדים לכדור אחד ששווה את כולם. שום XP לא הולך לאיבוד.
   רק בזירה: נקרא מ-update ב-update.js. המספרים כאן */
const ALOAD={
  every:1,        // כל כמה שניות בודקים
  far:1.5,        // אויב רחוק יותר מזה (כפול הצלע הארוכה של המסך) קופץ קרוב
  orbCap:150,     // הכי הרבה כדורי XP על הרצפה
};
const aloadKeep=e=>e.isBoss||e.wanted||e.elite;   // אלה לא נעלמים אף פעם
function arenaLoad(dt){
  S.aloadT=(S.aloadT||0)-dt;if(S.aloadT>0)return;S.aloadT=ALOAD.every;
  const far=ALOAD.far*Math.max(W,H);
  for(const e of enemies){if(e.dead||e.isBoss||e.wanted)continue;
    if(Math.hypot(e.x-P.x,e.y-P.y)>far){const p=spawnPos();e.x=p.x;e.y=p.y;e.kx=e.ky=0;S.aload=S.aload||{moved:0,cut:0,merged:0};S.aload.moved++}}
  // מעל המגבלה: הרגילים הכי רחוקים נעלמים (לא kill: בלי שלל, XP וקווסטים)
  let over=enemies.length-HORDE.cap;
  if(over>0){const d=e=>Math.hypot(e.x-P.x,e.y-P.y);
    const cut=enemies.filter(e=>!e.dead&&!aloadKeep(e)).sort((a,b)=>d(b)-d(a)).slice(0,over);
    for(const e of cut)e.dead=true;(S.aload=S.aload||{moved:0,cut:0,merged:0}).cut+=cut.length}
  // כדורי XP: הרחוקים מתאחדים לתוך הכדור הקרוב אליהם
  if(orbs.length>ALOAD.orbCap){const d=o=>Math.hypot(o.x-P.x,o.y-P.y);orbs.sort((a,b)=>d(a)-d(b));
    const keep=orbs.slice(0,ALOAD.orbCap),rest=orbs.slice(ALOAD.orbCap);
    for(const o of rest){let best=keep[0],bd=1e18;for(const k of keep){const q=(k.x-o.x)**2+(k.y-o.y)**2;if(q<bd){bd=q;best=k}}best.v+=o.v}
    orbs=keep;(S.aload=S.aload||{moved:0,cut:0,merged:0}).merged+=rest.length}
}
