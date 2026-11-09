/* לולאת המשחק והפעלה */
let last=performance.now(),FRAME_T=last;
// dt עד 0.05: בטלפון שרץ ב-20-30 פריימים בשנייה (הכפר בתלת-ממד) פריים איטי לא "מאבד" זמן, אז הדמות לא מאטה ונתקעת (ניר, 2.11: "מקוטעת")
// שגיאה בפריים לא עוצרת את המשחק: הפריים הבא תמיד מתוזמן (אוראל, 3.11: באייפון שגיאה ב-hud הקפיאה את משחקי השאול לגמרי)
// עצירה ברקע (W6, 8.11.2026): כשהטלפון עובר לאפליקציה אחרת או נועל מסך (document.hidden) הלולאה נעצרת לגמרי: בלי פריימים, בלי עדכון.
// בחזרה היא ממשיכה נקי: last מתאפס, אז אין קפיצת dt (וגם ככה dt מוגבל ל-maxDt). טיימרים של זמן אמיתי (ייצור בכפר) ממשיכים לפי השעון כמו קודם.
// log: שורת console בכל עצירה וחזרה, כדי שאפשר יהיה לראות בבדיקה (tools/perf-arena.js --hidden) שזה באמת קרה
const LOOP={paused:false,raf:0,maxDt:0.05,log:true,hidAt:0};
function frame(now){if(LOOP.paused){LOOP.raf=0;return}LOOP.raf=requestAnimationFrame(frame);try{frameStep(now)}catch(e){console.error(e)}}
function loopPause(){if(LOOP.paused)return;LOOP.paused=true;if(LOOP.raf)cancelAnimationFrame(LOOP.raf);LOOP.raf=0;LOOP.hidAt=performance.now();if(LOOP.log)console.log('[loop] paused')}
function loopResume(){if(!LOOP.paused)return;LOOP.paused=false;last=performance.now();LOOP.raf=requestAnimationFrame(frame);
  if(LOOP.log)console.log('[loop] resumed after '+((performance.now()-LOOP.hidAt)/1000).toFixed(1)+'s')}
document.addEventListener('visibilitychange',()=>{document.hidden?loopPause():loopResume()});
function frameStep(now){
  let dt=Math.min(LOOP.maxDt,(now-last)/1000);last=now;FRAME_T=now;   // FRAME_T: אותו שעון לתלת-ממד (render3d.js), בלי קפיצות בין שני שעונים
  if(typeof pwaHeld==='function'&&pwaHeld())dt=0;   // אפליקציה מותקנת שמוחזקת לאורך: המשחק עוצר עד שמסובבים (pwa.js)
  if(S&&S.mode==='play'&&!uiHold()){   // uiHold: חלון מלא פתוח בעולם או בכפר עוצר את העולם (ui.js)
    if(S.mb)mobaUpdate(dt);   // משחקי השאול (moba.js)
    else if(S.vil)villageUpdate(dt);   // בכפר מתעדכן רק הכפר
    else if(S.hitstop>0)S.hitstop-=dt;
    else{if(S.slow>0){S.slow-=dt;dt*=0.35}S.wd?worldUpdate(dt):update(dt)}   // בעולם הפתוח מתעדכן רק העולם (world.js)
  }else if(S){S.cam.x+=(P.x-S.cam.x)*0.1;S.cam.y+=(P.y-S.cam.y)*0.1}
  if(S&&!(S.hitstop>0)&&!S.mb){petUpdate(dt);statTick(dt);storyTick(dt)}   // storyTick: זמן המשחק, לסיכום בסוף העלילה (story.js)   // ועץ הסקילים (stats.js)   // חיית המחמד הולכת אחרי השחקן בכל מקום (pet.js)
  if(S&&S.mode==='play'){const k=Math.min(1,dt*8),g=giantCam();S.cam.x+=(P.x+g.x-S.cam.x)*k;S.cam.y+=(P.y+g.y-S.cam.y)*k}   // giantCam: בקרב עם ענק המצלמה זזה לכיוונו (giant.js)
  if(R3D.note&&S&&S.mode==='play'){R3D.note=false;banner(T('gfx.auto'))}   // מעבר אוטומטי לדו-ממד: הודעה אחת (render3d.js, GFX_AUTO)
  render();hud();if(S&&S.mb)mobaHud();
}
// כל הטקסט שעל המסך מחדש, בשפה הנוכחית: בהפעלה ובכל החלפת שפה
function showLang(){applyLang();showGfx();updateSwapBtn();$('verLine').textContent='v'+VERSION;if(typeof updShow==='function')updShow()}
function boot(){
  reset();
  showLang();
  LOOP.raf=requestAnimationFrame(frame);
}
window.claude?.hot?.ready?window.claude.hot.ready(boot):boot();
