/* הסקיל-על בזירה בתלת-ממד: פנסים שאפשר לזהות (חבילת התיקונים של אוראל, 9.11.2026, B: "פנסים מוכרים, לא פרץ אור מופשט").
   רק מראה. הנזק, ההאטה והרעידה נשארים ב-ultUse (ult.js), באותו פריים של הלחיצה. הגל בקנבס (S.sk.fx) נשאר גם הוא.
   ברגע הלחיצה n פנסים מרחפים (p3LanternOrb ב-props3d.js: כלוב, גביש דולק והילה) קופצים סביב הגיבור, בהיצת הפנס של העולם,
   ועפים החוצה עד רדיוס הגל, יחד עם הגל ובאותו זמן (dur), עם שובל קצר שנמוג. על הגיבור: עמוד אור וטבעת, כמו בהדלקת פנס.
   הגביש בצבע סוג הנזק של הנשק שביד (כמו הגל). מספרים אקראיים רק ממחולל של מראה (ulRnd), לא מ-Math.random של המשחק.
   "פחות אפקטים": פחות פנסים ובלי שובל. הפחתת תנועה: בלי עמוד האור ובלי שובל. רק בזירה ורק בתלת-ממד.
   מאגר קבוע: הפנסים נבנים פעם אחת. חיבור: עוטף את ultUse, ו-ult3dLanterns(dt) נקרא מ-render3d.js */
const ULTL={
  n:6,less:4,           // כמה פנסים, וכמה ב"פחות אפקטים"
  dur:0.6,              // כמה זמן הם עפים (כמו הגל של ult.js: 0.6 כפול themeK)
  pop:0.12,             // ההיצה: קפיצה של הגביש בהתחלה
  start:40,             // מאיזה רדיוס מהגיבור הם יוצאים
  lift:[54,90],         // גובה: בהתחלה, ובשיא המעוף
  size:1.6,             // גודל הפנס ביחס למודל (p3LanternOrb בנוי בגובה כ-45)
  trail:{n:3,gap:0.035,a:0.55},   // שובל: כמה רוחות, כל כמה שניות, ושקיפות הראשונה
  beam:{h:520,t:0.5},ring:{t:0.6} // עמוד האור על הגיבור (גובה, זמן), וטבעת על הרצפה עד רדיוס הגל
};
const ULTLS={on:false,orbs:[],beam:null,ring:null,t:-1,col:null,r:520,x:0,y:0,seed:1,n:0,stat:{casts:0,orbs:0}};
// מחולל מספרים של מראה בלבד (כמו mbaRnd), כדי שבדיקות עם seed ומדידות ביצועים יישארו זהות
const ulRnd=()=>{ULTLS.seed=(ULTLS.seed*16807)%2147483647;return (ULTLS.seed-1)/2147483646};
const ultl3dOn=()=>typeof R3D!=='undefined'&&R3D.on&&R3D.ready&&typeof p3LanternOrb==='function'&&typeof skArena==='function'&&skArena()&&!S.mb;
function ultl3dInit(){
  for(let i=0;i<ULTL.n;i++){const g=p3LanternOrb('#ffffff');g.visible=false;g.scale.setScalar(ULTL.size);R3D.scene.add(g);
    const tr=[];for(let k=0;k<ULTL.trail.n;k++){const s=new THREE.Sprite(new THREE.SpriteMaterial(p3Add('#ffffff')));s.visible=false;R3D.scene.add(s);tr.push(s)}
    ULTLS.orbs.push({g,tr,a:0,sp:1})}
  const add=c=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,fog:false,side:THREE.DoubleSide});
  ULTLS.beam=new THREE.Mesh(p3Cyl(16,26,1,10),add('#ffffff'));ULTLS.beam.visible=false;R3D.scene.add(ULTLS.beam);
  ULTLS.ring=new THREE.Mesh(new THREE.RingGeometry(0.86,1,64),add('#ffffff'));ULTLS.ring.rotation.x=-Math.PI/2;ULTLS.ring.visible=false;R3D.scene.add(ULTLS.ring);
  ULTLS.on=true;
}
// הלחיצה: הנזק כבר נחת (ultUse), ועכשיו הפנסים יוצאים
function ultl3dCast(col,r){
  if(!ultl3dOn())return;if(!ULTLS.on)ultl3dInit();
  const less=typeof fxLess==='function'&&fxLess(),n=less?ULTL.less:ULTL.n,c=new THREE.Color(col);
  ULTLS.t=0;ULTLS.col=c;ULTLS.r=r;ULTLS.x=P.x;ULTLS.y=P.y;ULTLS.n=n;ULTLS.seed=(ULTLS.stat.casts*7919+1)%2147483647||1;ULTLS.stat.casts++;
  const a0=ulRnd()*Math.PI*2;
  ULTLS.orbs.forEach((o,i)=>{const on=i<n;o.g.visible=on;for(const s of o.tr)s.visible=false;if(!on)return;
    o.a=a0+i/n*Math.PI*2+(ulRnd()-0.5)*0.3;o.sp=0.9+ulRnd()*0.2;
    const O=o.g.userData.O;O.cr.material.color.copy(c);O.halo.material.color.copy(c);for(const s of o.tr)s.material.color.copy(c);ULTLS.stat.orbs++});
  ULTLS.beam.material.color.copy(c);ULTLS.ring.material.color.copy(c);
}
// כל פריים (render3d.js): המעוף החוצה, ההיצה, השובל, ועמוד האור והטבעת על הגיבור
function ult3dLanterns(dt){
  if(!ULTLS.on||ULTLS.t<0)return;
  if(!ultl3dOn()){ultl3dHide();return}
  ULTLS.t+=dt;const t=ULTLS.t,L=ULTL,sn=SIN(),calm=typeof calmOn==='function'?calmOn():typeof RM!=='undefined'&&RM,less=typeof fxLess==='function'&&fxLess();
  let alive=false;
  for(let i=0;i<ULTLS.n;i++){const o=ULTLS.orbs[i],k=Math.min(1,t*o.sp/L.dur);
    if(k>=1){o.g.visible=false;for(const s of o.tr)s.visible=false;continue}alive=true;
    const e=1-(1-k)*(1-k),d=L.start+(ULTLS.r*0.92-L.start)*e,x=ULTLS.x+Math.cos(o.a)*d,y=ULTLS.y+Math.sin(o.a)*d,h=L.lift[0]+(L.lift[1]-L.lift[0])*Math.sin(Math.PI*k);
    o.g.visible=true;o.g.position.set(x,h,y/sn);
    const O=o.g.userData.O,pop=t<L.pop?1+Math.sin(t/L.pop*Math.PI)*0.7:1,fade=k>0.75?(1-k)/0.25:1;
    O.cr.rotation.y=t*6;O.cr.scale.set(pop,1.45*pop,pop);O.cr.position.y=Math.sin(t*14+i)*1.5;
    O.halo.material.opacity=(0.75+0.2*Math.sin(t*20+i))*fade;o.g.scale.setScalar(L.size*(0.6+0.4*Math.min(1,t/L.pop))*(0.85+0.15*fade));
    if(!less&&!calm)o.tr.forEach((s,j)=>{const kk=Math.max(0,k-(j+1)*L.trail.gap*o.sp/L.dur),ee=1-(1-kk)*(1-kk),dd=L.start+(ULTLS.r*0.92-L.start)*ee;
      s.visible=kk>0;s.position.set(ULTLS.x+Math.cos(o.a)*dd,L.lift[0]+(L.lift[1]-L.lift[0])*Math.sin(Math.PI*kk),(ULTLS.y+Math.sin(o.a)*dd)/sn);
      s.scale.setScalar(70*(1-j*0.22));s.material.opacity=L.trail.a*(1-j/L.trail.n)*fade});
  }
  // עמוד האור והטבעת על הגיבור (כמו בהדלקת פנס בעולם)
  const B=ULTLS.beam,R=ULTLS.ring,bk=t/L.beam.t,rk=t/L.ring.t;
  B.visible=!calm&&bk<1;if(B.visible){B.position.set(ULTLS.x,L.beam.h*0.5*Math.min(1,bk*3),ULTLS.y/sn);B.scale.set(1+bk,L.beam.h*Math.min(1,bk*3),1+bk);B.material.opacity=(typeof ARSH!=='undefined&&ARSH.on?0.4:0.8)*(1-bk)}
  R.visible=!(typeof ARSH!=='undefined'&&ARSH.on)&&rk<1;if(R.visible){R.position.set(ULTLS.x,1.5,ULTLS.y/sn);const rr=ULTLS.r*(0.15+0.85*(1-(1-rk)*(1-rk)));R.scale.set(rr,rr/sn,1);R.material.opacity=0.7*(1-rk)}
  if(!alive&&bk>=1&&rk>=1)ultl3dHide();
}
function ultl3dHide(){ULTLS.t=-1;for(const o of ULTLS.orbs){o.g.visible=false;for(const s of o.tr)s.visible=false}if(ULTLS.beam)ULTLS.beam.visible=ULTLS.ring.visible=false}
(function(){
  if(typeof ultUse!=='function')return;
  const b=ultUse;ultUse=function(){const r=b.apply(this,arguments);if(r){try{ultl3dCast(dtCol(P.dt[P.weapon]||'physical'),ULT.r)}catch(e){console.warn('ult-lantern3d',e)}}return r};
  if(typeof reset==='function'){const rs=reset;reset=function(){ultl3dHide();return rs.apply(this,arguments)}}
})();
