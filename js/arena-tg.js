/* אזהרות לאויבים רגילים בזירה (ATG, אוראל W5, 8.11.2026). הבוס כבר מקבל אזהרה לכל מתקפה (arena-fx.js, #426); כאן השאר.
   היום האויב היחיד בזירה שתוקף מרחוק הוא המכשף (wisp, update.js): הוא יורה בלי שום סימן, ואי אפשר להתחמק.
   עכשיו lead שניות לפני היריה הוא נועל את הכיוון, ועל הרצפה נמתח פס tg_line מהגיליונות (docs/fx.md) מהמכשף לכיוון היריה,
   שנמשך בדיוק עד היריה ונעלם. היריה יוצאת בכיוון שננעל, כך שמי שזז בזמן ההכנה התחמק (זה כל העניין באזהרה).
   בלי הגיליון (עוד לא נטען, או חסר): קו אדום דק שמתמלא, בתור שעון. "פחות אפקטים" לא מכבה: האזהרה היא חלק מהמשחק.
   חיבורים: atgTick עוטף את spawner (spawn.js) מבחוץ, update.js שואל atgAim לכיוון היריה, הציור הישן-חדש דרך עטיפה של fxDraw (fxlib.js).
   מחיקה: הקובץ, השורה ב-index.html והקריאה ל-atgAim ב-update.js. המספרים ב-ATG, הספירה לבוט ב-ATG.stat */
const ATG={
  on:true,
  lead:0.6,            // שניות לפני היריה שהכיוון ננעל והפס מופיע (כמו wind של היורה בעולם, foeai.js)
  range:380,           // הטווח שממנו המכשף יורה (אותו מספר כמו ב-update.js)
  // הפס בגיליון tg_line אופקי, כמעט כל רוחב הפריים (fit) וכחמישית מגובהו. sx מותח אותו לאורך, וכך הוא נהיה צר פי sx (היריה דקה).
  // len: אורך הפס על הרצפה. pulse: פעימה בשקיפות (כמה, וכמה מהר)
  line:{id:'tg_line',fit:0.9,len:300,sx:3,a:0.85,pulse:{k:0.3,speed:9}},
  stale:0.5,           // נעילה ישנה מזה אחרי שהיריה הייתה אמורה לצאת (השחקן יצא מהטווח): לא משתמשים בה
  fallback:{col:'#FF4D4D',w:3},
  stat:{tg:0,shots:0,locked:0}
};
const atgOn=()=>ATG.on&&typeof skArena==='function'&&skArena()&&!S.mb&&S.mode==='play'&&typeof fxPlay==='function';
// כל פריים (עוטף את spawner): מתחיל אזהרה למכשף שעומד לירות, ומנקה אזהרות שנגמרו
function atgTick(){
  if(!atgOn())return;
  const L=ATG.line;
  for(const e of enemies){
    if(e.dead||e.isBoss||e.type!=='wisp'){if(e.atg)atgClear(e);continue}
    if(e.atg){if(e.shoot<=-ATG.stale||e.stun>0||e.frozen>0)atgClear(e);else if(e.atg.h){const Pq=L.pulse;e.atg.h.alpha=L.a*(1-Pq.k+Pq.k*(0.5+0.5*Math.sin(S.t*Pq.speed)))}continue}   // פועם   // נעילה ישנה, או שהמכשף נעצר באמצע: בלי יריה מהכיוון הישן
    if(e.shoot>ATG.lead||e.stun>0||e.frozen>0)continue;
    const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy);if(d>=ATG.range)continue;
    const a=Math.atan2(dy,dx),dur=Math.max(0.1,e.shoot)+0.05,s=L.len/(L.fit*L.sx);
    const h=fxPlay(L.id,e.x,e.y,{follow:e,dx:Math.cos(a)*L.len/2,dy:Math.sin(a)*L.len/2,size:s,sx:L.sx,rot:a,alpha:L.a,dur,loop:true,under:true});
    e.atg={a,h,t0:S.t,dur};ATG.stat.tg++;
  }
}
function atgClear(e){if(e.atg&&e.atg.h)fxStop(e.atg.h);e.atg=null}
// update.js: הכיוון של היריה. ננעל באזהרה, אחרת (בלי אזהרה, או ישנה) הכיוון הטרי
function atgAim(e,a){
  ATG.stat.shots++;
  const g=e.atg;if(!g)return a;
  atgClear(e);ATG.stat.locked++;return g.a;
}
// שעון מילוי כשהגיליון לא נטען: קו דק שמתארך מהמכשף לכיוון היריה
function atgDraw(){
  if(!atgOn())return;
  const F=ATG.fallback,L=ATG.line;
  for(const e of enemies){const g=e.atg;if(!g||e.dead)continue;
    if(g.h&&g.h.on&&typeof fxImg==='function'&&fxImg(L.id))continue;   // הגיליון מוצג: הוא האזהרה
    const k=Math.min(1,(S.t-g.t0)/g.dur);
    ctx.save();ctx.translate(e.x,e.y);ctx.rotate(g.a);ctx.strokeStyle=F.col;ctx.lineWidth=F.w;ctx.lineCap='round';
    ctx.globalAlpha=0.35;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(L.len,0);ctx.stroke();
    ctx.globalAlpha=0.5+0.5*k;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(L.len*k,0);ctx.stroke();ctx.restore()}
  ctx.globalAlpha=1;
}
// החיבורים מבחוץ: הטיק אחרי spawner (לפני לולאת האויבים ב-update.js), והציור לפני שאר האפקטים
(function(){
  if(typeof spawner==='function'){const b=spawner;spawner=function(dt){const r=b.apply(this,arguments);atgTick(dt);return r}}
  if(typeof fxDraw==='function'){const b=fxDraw;fxDraw=function(){atgDraw();return b.apply(this,arguments)}}
})();
