/* סוגי נזק: פיזי, אש, קרח וברק. החולשה של אויב היא לסוג נזק ולא לנשק (החלטה של ניר, קרב גמיש).
   כל סוג: צבע, צורה (נתיב SVG בריבוע 24, משמש גם בקנבס וגם בממשק), ומה קורה כשפוגעים בו.
   החולשות של כל אויב ב-data.js (mult), והשמות של הסוגים ב-lang.js ('dt.fire' וכו') */
const DMG={
  types:{
    physical:{col:C.chalk,icon:'M6 6h12v12H6z'},
    fire:{col:C.ember,icon:'M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3 1-2 0-5 0-8z',
      burn:{k:0.4,t:2}},                 // שורף: עוד 40% מהמכה לאורך 2 שניות
    ice:{col:C.tide,icon:'M12 2l7 10-7 10-7-10z',
      slow:{k:0.45,t:1.2}},              // מאט: 45% מהמהירות לשנייה ורבע. הבוס לא מאט
    lightning:{col:'#8F86FF',icon:'M14 2 5 14h6l-2 8 10-13h-6z',
      chain:{n:2,r:130,k:0.35}}          // קופץ לעוד 2 אויבים קרובים, ב-35% מהנזק
  },
  weapons:{sword:'physical',gun:'physical'},   // סוג הנזק שכל נשק מתחיל איתו. שדרוג (data.js) או חפץ יכולים לשנות
  boss:{resist:0.5,weak:1.8}                   // הבוס: עמיד לסוג שהכי השתמשת בו, וחלש לזה שהכי פחות
};
const dtCol=t=>DMG.types[t]?DMG.types[t].col:C.chalk;
// החולשה של אויב: הסוג עם המכפיל הכי גדול מעל 1, או null
function weakOf(mult){let w=null,m=1;for(const k in mult)if(mult[k]>m){m=mult[k];w=k}return w}
const ICON2D={};
function dtIcon(x,y,t,size,col){
  const p=ICON2D[t]||(ICON2D[t]=new Path2D(DMG.types[t].icon));
  ctx.save();ctx.translate(x-size/2,y-size/2);ctx.scale(size/24,size/24);
  ctx.fillStyle=col||dtCol(t);ctx.strokeStyle=C.ink;ctx.lineWidth=2.5;ctx.stroke(p);ctx.fill(p);ctx.restore();
}
const dtSvg=t=>'<svg class="dti" viewBox="0 0 24 24" aria-hidden="true"><path fill="'+dtCol(t)+'" d="'+DMG.types[t].icon+'"/></svg>';

// אחרי כל פגיעה: ספירה (בשביל הבוס שלומד), ומה שהסוג עושה
function onHit(e,d,base,w,t,ang,chained){
  P.track.types[t]=(P.track.types[t]||0)+d;S.hits[t]=(S.hits[t]||0)+1;
  const T_=DMG.types[t];
  if(T_.burn){const dps=d*T_.burn.k/T_.burn.t;if(!e.burn||e.burn.dps<dps)e.burn={dps,t:T_.burn.t,tick:0.5,acc:0};else e.burn.t=T_.burn.t}
  if(T_.slow&&!e.isBoss)e.slow=T_.slow.t;
  if(T_.chain&&!chained){
    const c=T_.chain,near=[];
    for(const o of enemies){if(o===e||o.dead)continue;const dd=Math.hypot(o.x-e.x,o.y-e.y);if(dd<c.r)near.push([dd,o])}
    near.sort((a,b)=>a[0]-b[0]);
    for(const [,o] of near.slice(0,c.n)){
      for(let i=1;i<4;i++)parts.length<FX.parts&&parts.push({x:e.x+(o.x-e.x)*i/4+rand(-6,6),y:e.y+(o.y-e.y)*i/4+rand(-6,6),vx:0,vy:0,life:.12,max:.12,col:T_.col,size:3});
      damage(o,base*c.k,w,ang,t,true);
    }
  }
}
// כל פריים: שריפה מורידה חיים, האטה נגמרת
function dmgUpdate(dt){
  const F=DMG.types.fire;
  for(const e of enemies){
    if(e.dead)continue;
    if(e.slow>0)e.slow-=dt;
    const b=e.burn;if(!b)continue;
    const d=Math.min(b.dps*dt,b.dps*b.t);e.hp-=d;b.acc+=d;b.t-=dt;b.tick-=dt;P.track.types.fire+=d;
    if(b.tick<=0&&b.acc>=1){b.tick=0.5;floatText(e.x+rand(-6,6),e.y-e.r-4,big(b.acc),F.col,11,true);b.acc=0}
    if(b.t<=0)e.burn=null;
    if(e.hp<=0)kill(e);
  }
}
const slowK=e=>e.slow>0?DMG.types.ice.slow.k:1;
