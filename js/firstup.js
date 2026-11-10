/* השדרוג הראשון (FIRSTUP, playtest חיצוני 9.11.2026, בקשה מהמתאם 10.11): "שדרוג ראשון אחד שאפשר להרשות בחזרה הראשונה,
   עם לפני/אחרי ברור, ואז בחירה".
   מתנת הפתיחה מספיקה למנסרה ולמכרה, אבל לא לנפחייה (המחיר שלה במטבעות ב-VILLAGE.b.forge.cost[1]). יציאה ראשונה לעולם מביאה
   את המטבעות (הבוט, 10.11: כ-60 עד 160 מטבעות ב-4 דקות משחק), ולכן הנפחייה היא היעד של החזרה הראשונה.
   כשבונים אותה, הנפח משחיז את הנשק שביד עד ‎+plus בחינם: נזק לפני/אחרי, חגיגה, והמכה הכבדה של ‎+3 (upfeel.js) שמרגישים מיד בעולם.
   פעם אחת בלבד (SAVE.fu). שמירה ישנה עם נפחייה בנויה לא מקבלת כלום, ונשק שכבר ‎+plus ומעלה לא משתנה.
   עד שהנפחייה נבנית, היעד בעולם (goal.js) הוא הנפחייה, אלא אם סימנו יעד אחר.
   חיבורים: fuBuilt מ-vUpgrade (village.js), fuInfo מ-bwUpgrade (bwin.js), fuGoal מ-goalNow (goal.js). טקסט ב-lang.js תחת 'fu.' */
const FIRSTUP={
  at:'forge',   // המבנה שהוא השדרוג הראשון
  plus:3,       // עד איזה ‎+ הנשק מושחז. ‎+3 פותח את המכה הכבדה (UPFEEL.perks)
  stat:{built:0,temper:0}
};
// מה הנשק יקבל: {id,from,to,k,a,b} או null (אין נשק, כבר חזק מספיק, או שכבר קיבל)
function fuGives(){
  if(typeof SAVE==='undefined'||!SAVE||SAVE.fu)return null;
  const id=SAVE.gear&&SAVE.gear.weapon;if(!id||!gItem(id))return null;
  const from=gPlus(id),to=Math.max(from,FIRSTUP.plus);if(to<=from)return null;
  const nid=ageId(id,to),s0=gStats(id),s1=gStats(nid),k=Object.keys(s1)[0];if(!k)return null;
  return{id,nid,from,to,k,a:s0[k]||0,b:s1[k]||0};
}
const fuStat=g=>T(GEAR.stats[g.k]&&GEAR.stats[g.k].t||'st.'+g.k);
// בחלון הבנייה של הנפחייה (bwUpgrade): מה זה משנה בנשק, ושאפשר להרשות את זה עכשיו
function fuInfo(k,L){
  if(k!==FIRSTUP.at||L)return'';const g=fuGives();if(!g)return'';
  return'<div class="fubox"><p class="fuline">✦ '+T('fu.temper',gName(g.id),g.to)+'</p>'+
    '<p class="fucmp"><span>'+fuStat(g)+'</span> <bdi dir="ltr">'+g.a+' ➜ <b>'+g.b+'</b></bdi> · '+T('uf.p.heavy')+'</p>'+
    (vBlock(k)?'':'<p class="fuok">✓ '+T('fu.afford')+'</p>')+'</div>';
}
// אחרי שדרוג מבנה (vUpgrade): הנפחייה נבנתה, הנפח משחיז את הנשק
function fuBuilt(k){
  if(k!==FIRSTUP.at||vLv(k)!==1)return;FIRSTUP.stat.built++;
  const g=fuGives();SAVE.fu=1;
  if(g){const before=gearStats();gSet('weapon',0,g.nid);gearLive(before);FIRSTUP.stat.temper++;
    if(typeof ufUp==='function')ufUp();   // מספרי הנזק בזהב ביציאה הבאה (upfeel.js)
    setTimeout(()=>{if(!S.vil)return;if(S.vil.open===k){S.vil.open=null;villageHud()}   // החלון נסגר, כדי לראות את החגיגה על הגיבור
      celebrate(P.x,P.y-30,'aging','+'+g.to);
      banner(T('fu.done',gName(g.nid),fuStat(g),g.a,g.b),C.gold)},1800)}
  saveNow();
}
// היעד בעולם (goal.js): עד שהשדרוג הראשון נבנה, הוא היעד
function fuGoal(){const k=FIRSTUP.at;return !vLv(k)&&!SAVE.fu&&vBlock(k)!=='center'?{k}:null}
