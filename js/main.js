/* לולאת המשחק והפעלה */
let last=performance.now();
function frame(now){
  let dt=Math.min(0.033,(now-last)/1000);last=now;
  if(S&&S.mode==='play'){
    if(S.hitstop>0)S.hitstop-=dt;
    else{if(S.slow>0){S.slow-=dt;dt*=0.35}update(dt)}
  }else if(S){S.cam.x+=(P.x-S.cam.x)*0.1;S.cam.y+=(P.y-S.cam.y)*0.1}
  if(S&&S.mode==='play'){const k=Math.min(1,dt*8);S.cam.x+=(P.x-S.cam.x)*k;S.cam.y+=(P.y-S.cam.y)*k}
  render();hud();requestAnimationFrame(frame);
}
// כל הטקסט שעל המסך מחדש, בשפה הנוכחית: בהפעלה ובכל החלפת שפה
function showLang(){applyLang();updateSwapBtn();$('bestLine').textContent=best>0?T('best',fmt(best)):''}
function boot(){
  reset();
  showLang();
  requestAnimationFrame(frame);
}
window.claude?.hot?.ready?window.claude.hot.ready(boot):boot();
