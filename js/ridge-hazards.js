/* הרכס הקפוא: מדרון המפולות ואגם קפוא שמחליקים בו (ניר, 6.11: "יותר חי וברור, לא יותר קשה"). השרטוט: docs/concept-regions.md, פרק 2.
   - מפולות: במשטח הקרח שמסומן slide ב-map.ice (המדרון, 14 בשרטוט), כל כמה שניות כדור שלג או סלע מתגלגל מלמעלה למטה.
     לפני כל אחד פס אדום על הרצפה מתמלא לאורך כל המסלול שלו (כמו ההסתערות ב-foeai.js), ורק אז הוא יוצא. צעד הצידה = התחמקת.
     פוגע בשחקן (נזק מתון, חלק מהחיים) ובאויבים (אפשר למשוך אותם לשם). המסלול נבחר ליד השחקן, כדי שתמיד יהיה ממה להתחמק כשאתה שם.
   - החלקה: במשטח שמסומן slip (האגם הקפוא, 16) התנועה מחליקה: תאוצה, תנופה ועצירה איטית, וקצת יותר מהר מהליכה. כיף, לא מעצבן.
   הנתונים בקובץ המפה (map-ridge.js), והמספרים כאן. כל משטח ice במפה של כל אזור יכול לקבל slide או slip.
   חיבור: ridgeSlip ו-ridgeUpdate מ-worldUpdate, ridgeDraw מהציור של העולם (world.js), ridge3d מ-syncWorld (render3d.js) */

const RIDGEFX={
  slide:{every:[3.2,4.8],first:1.2,near:420,warn:1.5,speed:520,r:26,grow:0.5,max:2,pad:60,over:160,aim:90,
         hurt:0.13,foe:0.35,push:220,rock:0.3,col:'#FF4D4D',snow:'#F4FAFF',stone:'#8A929C'},   // hurt: חלק מהחיים של השחקן. foe: חלק מהחיים של אויב. rock: הסיכוי לסלע במקום כדור שלג
  slip:{accel:2.4,stop:0.9,top:1.3,trail:0.06}   // accel: כמה מהר מגיעים למהירות שרוצים (לשנייה). stop: כמה מהר עוצרים בלי אגודל. top: המהירות המקסימלית ביחס להליכה
};

// המשטחים של האזור הנוכחי, פעם אחת לכל אזור: {p: פוליגון, b: מסגרת}
function ridgeAreas(kind){
  const R=WR(),c=ridgeAreas.c||(ridgeAreas.c={}),k=R.region+'|'+kind;if(c[k])return c[k];
  return c[k]=((R.map&&R.map.ice)||[]).filter(q=>q[kind]).map(q=>{const xs=q.pts.map(p=>p[0]),ys=q.pts.map(p=>p[1]);
    return{p:q.pts,x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)}});
}
const ridgeOn=(o,a)=>o.x>a.x0&&o.x<a.x1&&o.y>a.y0&&o.y<a.y1&&inPoly(o.x,o.y,a.p);

/* ---- החלקה: אחרי movePlayer. מחליפים את הצעד של הפריים בצעד עם תנופה ---- */
function ridgeSlip(dt){
  const A=ridgeAreas('slip');if(!A.length||!S.wd){P.sl=null;return}
  if(!A.some(a=>ridgeOn(P,a))){P.sl=null;return}
  const F=RIDGEFX.slip,px=P.x-P.vx*dt,py=P.y-P.vy*dt;   // איפה השחקן היה לפני הצעד הרגיל
  if(!P.sl){P.sl={x:P.vx,y:P.vy,t:0};S.wd.slips=(S.wd.slips||0)+1;if(!S.wd.slipTold){S.wd.slipTold=1;floatText(P.x,P.y-40,T('rfx.slip'),C.tide,16)}}
  const v=P.sl,k=P.moving?Math.min(1,F.accel*dt):Math.min(1,F.stop*dt);
  v.x+=(P.vx-v.x)*k;v.y+=(P.vy-v.y)*k;
  const top=P.speed*F.top,m=Math.hypot(v.x,v.y);if(m>top){v.x*=top/m;v.y*=top/m}
  P.x=px+v.x*dt;P.y=py+v.y*dt;P.vx=v.x;P.vy=v.y;
  if(!P.moving&&m>30)S.wd.glide=(S.wd.glide||0)+dt;   // נמדד בבדיקה: ממשיכים לגלוש בלי אגודל
  if(m>P.speed*0.6&&(v.t-=dt)<=0){v.t=F.trail;sparks(P.x-v.x/m*10,P.y-v.y/m*10,'#E6F6FF',1,40)}   // שובל קרח
}

/* ---- מפולות ---- */
function ridgeUpdate(dt){
  const A=ridgeAreas('slide'),w=S.wd;if(!A.length||!w)return;
  const F=RIDGEFX.slide,R=w.rfx||(w.rfx={list:[],cd:F.first,n:0,hits:0,foeHits:0,done:0});
  for(const a of A){
    const near=P.x>a.x0-F.near&&P.x<a.x1+F.near&&P.y>a.y0-F.near&&P.y<a.y1+F.near;
    if(near&&!w.slideTold){w.slideTold=1;banner(T('rfx.slide'),F.col)}
    if(near&&(R.cd-=dt)<=0&&R.list.length<F.max){R.cd=rand(...F.every);
      const x=Math.max(a.x0+F.pad,Math.min(a.x1-F.pad,P.x+rand(-F.aim,F.aim)));   // ליד השחקן, אבל תמיד בתוך המדרון
      R.list.push({x,y0:a.y0-F.r,y1:a.y1+F.over,y:a.y0-F.r,t:F.warn,rock:Math.random()<F.rock,hit:new Set(),spin:0});R.n++}}
  for(const b of R.list){
    if(b.t>0){b.t-=dt;if(b.t<=0)sfx('ui');continue}
    b.y+=F.speed*dt;b.spin+=F.speed*dt/F.r;const r=ridgeR(b);
    if(Math.random()<0.4)sparks(b.x+rand(-r,r),b.y-r*0.6,b.rock?F.stone:F.snow,1,50);
    if(!b.hit.has(P)&&Math.hypot(P.x-b.x,P.y-b.y)<r+P.r){b.hit.add(P);const hp=P.hp;hurt(P.maxHp*F.hurt);
      if(P.hp<hp){R.hits++;P.x+=(P.x<b.x?-1:1)*F.push*0.2;sparks(P.x,P.y,F.snow,10,200)}}
    for(const e of enemies){if(e.dead||e.isBoss||e.warden||e.wanted||b.hit.has(e)||Math.hypot(e.x-b.x,e.y-b.y)>r+e.r)continue;
      b.hit.add(e);e.hp-=e.max*F.foe;e.flash=0.12;e.kx+=(e.x<b.x?-1:1)*F.push;R.foeHits++;sparks(e.x,e.y,F.snow,8,200);
      if(e.hp<=0&&!e.dead)kill(e)}
    if(b.y>=b.y1){b.gone=1;R.done++;sparks(b.x,b.y,b.rock?F.stone:F.snow,14,220)}}
  R.list=R.list.filter(b=>!b.gone);
}
const ridgeR=b=>RIDGEFX.slide.r*(1+RIDGEFX.slide.grow*Math.max(0,Math.min(1,(b.y-b.y0)/((b.y1-b.y0)||1))));   // כדור השלג גדל קצת בדרך

// ציור על הרצפה (לפני הדמויות): הפס האדום שמתמלא, והכדור עצמו בדו-ממד (בתלת-ממד הכדור ב-ridge3d)
function ridgeDraw(){
  const R=S.wd&&S.wd.rfx;if(!R||!R.list.length)return;
  const F=RIDGEFX.slide,w=F.r*1.6;ctx.save();
  for(const b of R.list){const len=b.y1-b.y0;
    if(b.t>0){const k=1-b.t/F.warn;
      ctx.globalAlpha=0.2;ctx.fillStyle=F.col;ctx.fillRect(b.x-w,b.y0,w*2,len);
      ctx.globalAlpha=0.45+0.4*k;ctx.fillRect(b.x-w,b.y0,w*2,len*k);
      ctx.globalAlpha=0.9;ctx.strokeStyle=F.col;ctx.lineWidth=(2.5+2*k)/ZOOM;ctx.strokeRect(b.x-w,b.y0,w*2,len);
      ctx.globalAlpha=0.6+0.4*k;ctx.fillStyle=F.col;ctx.font='900 '+(26+10*k)/ZOOM+'px Heebo, system-ui, sans-serif';ctx.textAlign='center';ctx.fillText('▼',b.x,b.y0+30);continue}
    ctx.globalAlpha=0.25;ctx.fillStyle=F.col;ctx.fillRect(b.x-w,b.y,w*2,b.y1-b.y);   // מה שנשאר מהמסלול
    if(R3D.on)continue;const r=ridgeR(b);ctx.globalAlpha=1;
    ctx.fillStyle='rgba(5,7,13,0.35)';ctx.beginPath();ctx.ellipse(b.x,b.y+r*0.7,r*1.1,r*0.4,0,0,7);ctx.fill();
    ctx.fillStyle=b.rock?F.stone:F.snow;ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,r,0,7);ctx.fill();ctx.stroke();
    ctx.strokeStyle=b.rock?'#5D616B':'#BFD9EA';ctx.beginPath();ctx.arc(b.x,b.y,r*0.6,b.spin,b.spin+2);ctx.stroke()}
  ctx.restore();
}

// תלת-ממד: כדור לכל מפולת שמתגלגלת, מתוך מאגר קטן. נקרא מ-syncWorld בכל פריים
function ridge3d(G){
  const R=S.wd&&S.wd.rfx,F=RIDGEFX.slide,pool=G.rfx||(G.rfx=[]);let i=0;
  for(const b of R?R.list:[]){if(b.t>0)continue;
    let m=pool[i];if(!m){m=pool[i]=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),p3Mat(F.snow));G.g.add(m)}
    m.material=p3Mat(b.rock?F.stone:F.snow);const r=ridgeR(b);m.scale.setScalar(r);m.position.set(b.x,r,b.y/SIN());m.rotation.x=b.spin;m.visible=true;i++}
  for(;i<pool.length;i++)pool[i].visible=false;
}
