/* לולאת המשחק והפעלה */
let last=performance.now();
function frame(now){
  let dt=Math.min(0.033,(now-last)/1000);last=now;
  if(typeof pwaHeld==='function'&&pwaHeld())dt=0;   // אפליקציה מותקנת שמוחזקת לאורך: המשחק עוצר עד שמסובבים (pwa.js)
  if(S&&S.mode==='play'){
    if(S.vil)villageUpdate(dt);   // בכפר מתעדכן רק הכפר
    else if(S.hitstop>0)S.hitstop-=dt;
    else{if(S.slow>0){S.slow-=dt;dt*=0.35}S.wd?worldUpdate(dt):update(dt)}   // בעולם הפתוח מתעדכן רק העולם (world.js)
  }else if(S){S.cam.x+=(P.x-S.cam.x)*0.1;S.cam.y+=(P.y-S.cam.y)*0.1}
  if(S&&!(S.hitstop>0)){petUpdate(dt);statTick(dt)}   // ועץ הסקילים (stats.js)   // חיית המחמד הולכת אחרי השחקן בכל מקום (pet.js)
  if(S&&S.mode==='play'){const k=Math.min(1,dt*8);S.cam.x+=(P.x-S.cam.x)*k;S.cam.y+=(P.y-S.cam.y)*k}
  render();hud();requestAnimationFrame(frame);
}
// כל הטקסט שעל המסך מחדש, בשפה הנוכחית: בהפעלה ובכל החלפת שפה
function showLang(){applyLang();showGfx();updateSwapBtn();$('bestLine').textContent=best>0?T('best',fmt(best)):'';$('verLine').textContent='v'+VERSION}
function boot(){
  reset();
  showLang();
  requestAnimationFrame(frame);
}
window.claude?.hot?.ready?window.claude.hot.ready(boot):boot();
