/* בוסים ענקיים בעולם (ניר, 4.11.2026: "אני רוצה שבוסים יהיו מודלים גדולים מאוד, משהו משמעותי").
   השומרים של ששת הפנסים (STORY.lanterns ב-story.js) הם ענקים: מודל משלהם לכל פרק (LOOK3D.wb_<פנס> ב-render3d.js), פי 5 מהגיבור בערך.
   e.wboss = הפנס של הענק. הזירה ומשחקי השאול (אוראל) לא נוגעים כאן: שם הבוס נשאר LOOK3D.boss, כי הבחירה היא לפי wboss ולא isBoss.
   כדי שבוס אחר בעולם ייראה כמו ענק של פרק: giantRise(e,'<פנס>').
   כאן: הגודל הלוגי (גרפיקה ולוגיקה גדלות יחד), כניסה (קם מהאדמה או נוחת מהשמיים, עם השם בפס הבוס), רעידה בכל צעד ובכל מכה,
   מצלמה שמתרחקת בזמן הקרב, וקריסה איטית במוות. הצל הגדול והקריסה בתלת-ממד: syncEnemy ו-retire ב-render3d.js */
const GIANT={
  r:2,                                   // פי כמה הרדיוס הלוגי (פגיעה, מגע) מהשומר של story.js. הגוף בתלת-ממד (h ב-LOOK3D) גדל באותו יחס
  rise:{t:1.6,shake:3,land:12},          // כניסה: t שניות של קימה מהאדמה (או נחיתה), רעד קטן כל הזמן, ורעד גדול בסוף. בזמן הזה הוא לא תוקף
  step:{len:70,shake:3},                 // רעידה בכל צעד: כל len פיקסלים שהוא הולך
  hit:{shake:8},                         // רעידה כשמכה יוצאת (רקיעה, הסתערות, יריות, טבעת, ברקים)
  zoom:{k:0.66,near:900,inT:1.2,outT:2.4,step:0.01},   // המצלמה מתרחקת (פי k) כשענק חי עד near מהגיבור, כדי לראות את כולו ואת הגיבור
  cam:{k:0.5,tall:4.4,max:0.3},           // והמרכז זז לכיוון האמצע של הגוף שלו (k מהדרך, גובה הגוף tall×r), עד max מהמסך, כדי שהגיבור נשאר בפנים
  die:{t:3.2,anim:2.2,sink:1.2,shake:14},// מוות: t שניות עד שנעלם, anim שניות של קריסה, ושוקע באדמה ב-sink האחרונות. רעד גדול כשנופל
  shadow:1.35                            // הצל על הקרקע: פי כמה מהצל של אויב רגיל באותו רדיוס
};
// נקרא מ-storyWarden: השומר נהיה ענק. k: הפנס (earth, water, ice, fire, bolt, light)
function giantRise(e,k){
  e.wboss=k;e.r*=GIANT.r;e.rise=GIANT.rise.t;e.stepAcc=0;e.gx=e.x;e.gy=e.y;
  S.shake=Math.max(S.shake,GIANT.rise.shake);
}
// כל פריים בעולם (storyUpdate): כניסה, צעדים ומכות שמרעידים את האדמה, ונפילה
function giantUpdate(dt){
  const w=S.wd,e=w&&w.warden;if(!e||!e.wboss)return;
  if(e.dead){if(!e.fell){e.fell=true;S.shake=Math.max(S.shake,GIANT.die.shake);sparks(e.x,e.y,'#C9A26B',26,320);sfx('death')}return}
  if(e.rise>0){e.rise-=dt;S.shake=Math.max(S.shake,GIANT.rise.shake);
    if(e.rise<=0){S.shake=Math.max(S.shake,GIANT.rise.land);sparks(e.x,e.y,'#C9A26B',22,300);sfx('shoot')}}
  e.stepAcc+=Math.hypot(e.x-e.gx,e.y-e.gy);e.gx=e.x;e.gy=e.y;
  if(e.stepAcc>GIANT.step.len){e.stepAcc=0;S.shake=Math.max(S.shake,GIANT.step.shake)}
  const busy=!!(e.tel||e.dash);if(e.gBusy&&!e.tel&&!e.dash||e.dash&&!e.gDash)S.shake=Math.max(S.shake,GIANT.hit.shake);   // מכה יצאה
  e.gBusy=busy;e.gDash=!!e.dash;
}
// בכניסה הוא לא זז ולא תוקף (storyWardenMove)
const giantWaking=e=>e.wboss&&e.rise>0;
// כמה הוא מתחת לאדמה (קם) או מעליה (נוחת, למרחפים), בפיקסלים, לציור בתלת-ממד
function giantLift(e,L){if(!(e.rise>0))return 0;const k=e.rise/GIANT.rise.t,ease=k*k;return (L.float?L.h*2:-L.h*1.1)*ease}
// המצלמה (camZoom ב-camera.js): מתרחקת לאט כשענק קרוב, וחוזרת לאט אחרי
function giantZoom(){
  const Z=GIANT.zoom,st=giantZoom,now=performance.now()/1000,dt=Math.min(0.1,st.last?now-st.last:0);st.last=now;
  const e=S&&S.wd&&S.wd.warden,want=e&&e.wboss&&!e.dead&&P&&Math.hypot(e.x-P.x,e.y-P.y)<Z.near?Z.k:1;
  st.z=st.z||1;st.z+=(want-st.z)*Math.min(1,dt/(want<st.z?Z.inT:Z.outT)*3);
  return Math.round(st.z/Z.step)*Z.step;
}
// כמה להזיז את מרכז המצלמה מהגיבור לכיוון הענק (main.js). גדל יחד עם ההתרחקות, אז נכנס ויוצא לאט
function giantCam(){
  const Z=GIANT.zoom,C=GIANT.cam,e=S&&S.wd&&S.wd.warden,f=Math.max(0,Math.min(1,(1-(giantZoom.z||1))/(1-Z.k)));
  if(!e||!e.wboss||e.dead||!f||!P)return{x:0,y:0};
  const cl=(v,m)=>Math.max(-m,Math.min(m,v));
  return{x:cl((e.x-P.x)*C.k,W*C.max)*f,y:cl((e.y-e.r*C.tall*0.5-P.y)*C.k,H*C.max)*f};
}
// פס הבוס בראש המסך (hud ב-render.js), עם השם והתואר של הענק. null כשאין ענק חי
function giantBar(){
  const e=S&&S.wd&&S.wd.warden;if(!e||!e.wboss||e.dead)return null;
  return{name:T('story.'+e.wboss+'.name'),title:T('giant.t.'+e.wboss),weak:e.weak,hp:e.hp,max:e.max,rage:0};
}
