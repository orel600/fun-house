/* משחקי השאול: חומת הברזל של הטנק כחומה אמיתית בתלת-ממד (MBWALL3D, השיפוץ, BOB, 10.11.2026). רק מראה.
   אוראל דחה את הפס הדק: בקנבס (moba.js) החומה הייתה מלבן שטוח ברוחב 20 לכל גובה הנתיב, מעל התלת-ממד, וממצלמת המשחק היא נראתה קו שחוצה את כל המסך.
   כאן: שורה של גושי אבן בחישוקי ברזל לאורך הנתיב, מקצה לקצה, באותו x. מכסה צבע הקבוצה (כחול או אדום) על כל גוש, ולוח כהה על הרצפה מתחתיה.
   היא עולה מהאדמה (rise שניות), עומדת, ושוקעת בסוף (sink שניות לפני שנגמר הזמן). נמחקת לגמרי כשהיא נגמרת, במשחק חדש וביציאה.
   הכללים לא משתנים: איפה החומה (MB.walls: x, קבוצה, זמן), מי עובר ומי לא (moba.js mbStep ויריות), והזמן שלה. ?mbwall=old מחזיר את הפס, ובדו-ממד הפס נשאר.
   גובה נמוך מגיבור (h), כדי שגיבור שעומד מאחורי הקו ייראה מעליה. מחיקה: הקובץ, השורה ב-index.html והשמירה ב-moba.js */
const MBWALL3D={
  on:!/[?&]mbwall=old(&|$)/.test(location.search),
  seg:{w:40,d:34,h:60,jit:0.18,gap:4,ridge:14},   // גוש: רוחב (ציר x), עומק (לאורך הנתיב), גובה ביחידות משחק. jit: גבהים שונים קצת. gap: רווח בין גושים. ridge: רוחב פס הקבוצה לאורך הראש
  rise:0.2,sink:0.3,                     // שניות לעלייה בהתחלה ולשקיעה בסוף
  stone:'#6a6470',strap:'#2a2730',cap:0.85,   // צבע האבן, צבע החישוק, ועוצמת מכסה הקבוצה
  plate:{a:0.35,pad:10},                 // הלוח הכהה על הרצפה: שקיפות, וכמה רחב מהגושים
  band:{a:0.5,pad:12,glow:0.6},          // פס בצבע הקבוצה על הרצפה לרגלי החומה (QUINN: הכחול חלש על רצפה כהה): שקיפות, כמה בולט מכל צד, ועוצמת הזוהר של פס הראש
  stat:{built:0,removed:0}
};
const mbWall3dOn=()=>MBWALL3D.on&&typeof R3D!=='undefined'&&R3D.on&&R3D.scene&&typeof S!=='undefined'&&S&&S.mb;
(function(){
  const X=MBWALL3D;if(!X.on)return;
  const live=new Map();let geo=null,mats=null;
  const ensure=()=>{if(geo)return;geo=new THREE.BoxGeometry(1,1,1);
    mats={stone:new THREE.MeshLambertMaterial({color:X.stone}),strap:new THREE.MeshLambertMaterial({color:X.strap}),
      plate:new THREE.MeshBasicMaterial({color:'#000000',transparent:true,opacity:X.plate.a,depthWrite:false})}};
  const hash=(i,k)=>{const v=Math.sin(i*12.9898+k*78.233)*43758.5453;return v-Math.floor(v)};
  // a wall: segments, iron straps, team caps and the floor plate, in one group at the wall's x
  const build=w=>{
    ensure();const L=MOBA.lane,s=SIN(),c=COS(),G=X.seg,n=Math.ceil(L.half*2/(G.d+G.gap)),g=new THREE.Group(),step=L.half*2/n;
    const capMat=new THREE.MeshLambertMaterial({color:MOBA.team[w.team],emissive:MOBA.team[w.team],emissiveIntensity:X.band.glow*X.cap});
    const st=new THREE.InstancedMesh(geo,mats.stone,n),sp=new THREE.InstancedMesh(geo,mats.strap,n),cp=new THREE.InstancedMesh(geo,capMat,n),m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),P=new THREE.Vector3(),Sc=new THREE.Vector3();
    for(let i=0;i<n;i++){const y=-L.half+step*(i+0.5),h=G.h*(1+(hash(i,w.x)-0.5)*2*G.jit),z=y/s;e.set(0,(hash(i,7)-0.5)*0.12,0);q.setFromEuler(e);
      P.set(w.x,h/c/2,z);Sc.set(G.w,h/c,(step-G.gap)/s);st.setMatrixAt(i,m.compose(P,q,Sc));
      P.set(w.x,h/c*0.55,z);Sc.set(G.w+1.5,4/c,(step-G.gap)/s+1.5);sp.setMatrixAt(i,m.compose(P,q,Sc));
      P.set(w.x,h/c+1.5/c,z);Sc.set(G.ridge,3/c,(step-G.gap)/s);cp.setMatrixAt(i,m.compose(P,q,Sc))}
    const pl=new THREE.Mesh(new THREE.PlaneGeometry(G.w+X.plate.pad*2+X.band.pad*2,L.half*2/s).rotateX(-Math.PI/2),mats.plate);pl.position.set(w.x,0.6,0);pl.renderOrder=1;
    const bandMat=new THREE.MeshBasicMaterial({color:MOBA.team[w.team],transparent:true,opacity:X.band.a,depthWrite:false,toneMapped:false}),bd=new THREE.Mesh(new THREE.PlaneGeometry(G.w+X.band.pad*2,L.half*2/s).rotateX(-Math.PI/2),bandMat);bd.position.set(w.x,0.9,0);bd.renderOrder=2;
    g.add(pl,bd,st,sp,cp);R3D.scene.add(g);X.stat.built++;return {g,cap:capMat,band:bd,T:w.t,inst:[st,sp,cp],pl};
  };
  const drop=(w,r)=>{r.g.removeFromParent();for(const o of r.inst)o.dispose();r.pl.geometry.dispose();r.band.geometry.dispose();r.band.material.dispose();r.cap.dispose();live.delete(w);X.stat.removed++};
  const sync=()=>{
    if(!mbWall3dOn()){for(const [w,r] of live)drop(w,r);return}
    const W=MB.walls||[];for(const [w,r] of live)if(!W.includes(w))drop(w,r);
    for(const w of W){let r=live.get(w);if(!r){r=build(w);live.set(w,r)}
      const age=r.T-w.t,k=Math.min(1,age/X.rise,w.t/X.sink),e=1-(1-Math.max(0,k))*(1-Math.max(0,k));r.g.scale.y=Math.max(0.001,e);r.band.material.opacity=X.band.a*e;r.g.visible=e>0.01}
  };
  if(typeof syncPlayer==='function'){const b=syncPlayer;syncPlayer=function(){const r=b.apply(this,arguments);try{sync()}catch(e){}return r}}
  if(typeof mobaStart==='function'){const b=mobaStart;mobaStart=function(){for(const [w,r] of live)drop(w,r);return b.apply(this,arguments)}}
})();
