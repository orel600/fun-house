/* משחקי השאול: נתוני הנשק בתקיפה (MBBLADE, השיפוץ, BOB, 10.11.2026, הבקשה של NOVA). נתונים בלבד: לא מצייר ולא משנה שום דבר במשחק.
   לכל גיבור עם נשק מקרוב (הטנק, הלוחם, המתנקש), בכל פריים: בסיס הנשק (היד) והקצה שלו בעולם התלת-ממדי ובמישור המשחק, השלב של התקיפה (MBATK3D: hit, settle),
   הקליפ והזמן בו. ובכל מגע (פריים הנזק של התקיפה הרגילה): קריאה לכל מאזין ב-MBBLADE.on, עם המצב של הנשק באותו פריים, אחרי שהגוף כבר בתנוחת המגע.
   ככה שובל ההנפה וסימן המגע יכולים להיות שני דברים נפרדים (שובל לפי הדרך של הקצה, מגע לפי הפריים של הנזק).
   שימוש: MBBLADE.get(u) (או MBBLADE.get(MB.me)), MBBLADE.on.push(fn), MBBLADE.log (טבעת של log.max דגימות, רק כש-MBBLADE.rec). ?mbblade=0 מכבה.
   מחיקה: הקובץ והשורה ב-index.html */
const MBBLADE={
  on:[],                           // מאזינים למגע: fn({u,t,base,tip,phase,clip,ct})
  enabled:!/[?&]mbblade=0(&|$)/.test(location.search),
  kits:{tank:1,warrior:1,assassin:1},
  end:0.12,                        // כמה מהקצה של הנשק נחשב קצה (ובסיס): חלק מהאורך שלו, ממוצע הנקודות שם
  rec:false,log:[],max:600,        // הקלטה של כל פריים (בשביל צילום), כבויה כברירת מחדל
  cache:new WeakMap(),stat:{samples:0,contacts:0}
};
// הקצוות של הנשק (במרחב שלו): הציר הארוך, הקצה הקרוב לאחיזה (מקור הנשק) והקצה הרחוק
function mbBladeAxis(m){
  let c=MBBLADE.cache.get(m.geometry);if(c)return c;
  const g=m.geometry;g.computeBoundingBox();const bb=g.boundingBox,sz=bb.getSize(new THREE.Vector3()),ax=sz.x>=sz.y&&sz.x>=sz.z?'x':sz.y>=sz.z?'y':'z';
  const P=g.attributes.position,v=new THREE.Vector3(),lo=new THREE.Vector3(),hi=new THREE.Vector3();let nl=0,nh=0;
  for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);const f=(v[ax]-bb.min[ax])/(sz[ax]||1);if(f<MBBLADE.end){lo.add(v);nl++}else if(f>1-MBBLADE.end){hi.add(v);nh++}}
  lo.multiplyScalar(1/Math.max(1,nl));hi.multiplyScalar(1/Math.max(1,nh));
  c=lo.lengthSq()<=hi.lengthSq()?{base:lo,tip:hi}:{base:hi,tip:lo};MBBLADE.cache.set(m.geometry,c);return c;
}
// הנשק של הדמות: החלק הראשון שאינו מגן, עם mesh
function mbBladeMesh(a){
  if(!a||!a.props)return null;for(const k in a.props){if(k==='shield'||k.startsWith('x_'))continue;let m=null;a.props[k].traverse(o=>{if(!m&&o.isMesh)m=o});if(m&&a.props[k].visible!==false)return m}return null;
}
// דגימה של פריים: עולם (x,y,z) ומישור המשחק (x, y, גובה)
function mbBladeSample(u,a){
  const m=mbBladeMesh(a);if(!m)return null;const c=mbBladeAxis(m);m.updateWorldMatrix(true,false);
  const b=c.base.clone().applyMatrix4(m.matrixWorld),t=c.tip.clone().applyMatrix4(m.matrixWorld),s=typeof SIN==='function'?SIN():1;
  const st=a.mbA||{},x=st.x,clip=x?x.getClip().name:(a.one&&a.one.isRunning()?a.one.getClip().name:''),ct=x?+(x.time/x.getClip().duration).toFixed(3):null;
  const r=v=>[+v.x.toFixed(2),+v.y.toFixed(2),+v.z.toFixed(2)],gm=v=>[+v.x.toFixed(1),+(v.z*s).toFixed(1),+v.y.toFixed(1)];
  return {t:+MB.t.toFixed(3),base:r(b),tip:r(t),baseGame:gm(b),tipGame:gm(t),phase:st.ph||'',clip,ct};
}
MBBLADE.get=u=>{if(!u||typeof R3D==='undefined'||!R3D.on)return null;const a=u.me?R3D.player:R3D.actors.get(u);return a?mbBladeSample(u,a):null};
(function(){
  const B=MBBLADE;if(!B.enabled)return;
  // המגע: mbAttack מוריד את הנזק. מסמנים, והדגימה נלקחת אחרי שהגוף עודכן באותו פריים (syncPlayer / mb3dUnit)
  if(typeof mbAttack==='function'){const b=mbAttack;mbAttack=function(u){const t0=u&&u.atkT,r=b.apply(this,arguments);if(u&&u.k==='hero'&&B.kits[u.kit]&&(u.atkT||0)>(t0||0)+0.05)u.bladeHit=MB.t;return r}}
  const after=(u,a)=>{if(!u||u.k!=='hero'||!B.kits[u.kit]||!a)return;
    if(!B.rec&&u.bladeHit==null)return;const s=mbBladeSample(u,a);if(!s)return;B.stat.samples++;
    if(B.rec){s.kit=u.kit;s.me=!!u.me;B.log.push(s);if(B.log.length>B.max)B.log.shift()}
    if(u.bladeHit!=null){const ev=Object.assign({u,hitT:u.bladeHit},s);u.bladeHit=null;B.stat.contacts++;for(const fn of B.on){try{fn(ev)}catch(e){}}}};
  if(typeof syncPlayer==='function'){const b=syncPlayer;syncPlayer=function(){const r=b.apply(this,arguments);const u=typeof MB!=='undefined'&&S.mb&&MB.me;if(u&&R3D.player)after(u,R3D.player);return r}}
  if(typeof mb3dUnit==='function'){const b=mb3dUnit;mb3dUnit=function(e){const r=b.apply(this,arguments);if(e&&e.k==='hero')after(e,R3D.actors.get(e));return r}}
})();
