/* משחקי השאול: גיבור גדול מחייל (MBSCALE, השיפוץ, MAX ל-BOB, 10.11.2026). רק מראה: ה-hitbox (e.r), הטווח והתנועה לא משתנים.
   הכלל: כל גיבור (בוט, וגם אתה) עומד לפחות min פעמים הגובה של החייל, בגובה האמיתי של הגוף בעמידה (כל קודקוד, בלי חפצים),
   ולא לפי h של המראה (h הוא גודל התבנית, ובכל מודל הגוף ממלא חלק אחר ממנה). רק מגדילים, לא מקטינים.
   נמדד פעם אחת לכל מראה (גם הטנק החדש של mb-tankx.js, כי זה עוטף אחריו). מדידה (BOB, 10.11): חייל 40.7, מתנקש 41.3 (פי 1.01), טנק 47.3 (1.16),
   צייד 58.5 (1.44), לוחם 65.9 (1.62), קוסמת 68.7 (1.69), tankX 58.1 (1.43). ?mbscale=0 מכבה. מחיקה: הקובץ והשורה ב-index.html */
const MBSCALE={
  on:!/[?&]mbscale=0(&|$)/.test(location.search),
  min:1.4,          // גיבור לפחות פי זה מהחייל
  ref:'mb_m0',      // המראה של החייל שאליו משווים
  stat:{measured:0,scaled:{},ref:null}
};
const mbScaleC=new WeakMap();
// הגובה בעמידה, ביחידות של המשחק. null אם המודל עוד לא נטען
function mbScaleStand(L){
  const t=R3D.tmpl[L.model];if(!t)return null;
  const r=THREE.SkeletonUtils.clone(t);r.scale.setScalar(L.h/COSB()/t.userData.h);
  const n=L.anim&&(L.anim.idle||L.anim.run),c=n&&(L.tx&&typeof tankxClip==='function'?tankxClip(n):R3D.clips[n]);
  const mx=new THREE.AnimationMixer(r);if(c){mx.clipAction(c).play();mx.update(0.3)}r.updateMatrixWorld(true);
  let lo=1e9,hi=-1e9;const v=new THREE.Vector3();
  r.traverse(m=>{if(m.isSkinnedMesh){const pa=m.geometry.attributes.position;for(let i=0;i<pa.count;i+=3){v.fromBufferAttribute(pa,i);m.applyBoneTransform(i,v);v.applyMatrix4(m.matrixWorld);if(v.y<lo)lo=v.y;if(v.y>hi)hi=v.y}}});
  mx.stopAllAction();MBSCALE.stat.measured++;return (hi-lo)*COSB();
}
// המראה בגודל של הכלל. אותו אובייקט לאותו מראה, כדי שהמאגר והמטמונים לא יתבלבלו
function mbScaleLook(L){
  const X=MBSCALE;if(!X.on||!L||!L.model)return L;
  if(mbScaleC.has(L))return mbScaleC.get(L);
  if(X._ref==null){const R=LOOK3D[X.ref];const h=R&&mbScaleStand(R);if(!h)return L;X._ref=h;X.stat.ref=+h.toFixed(1)}
  const h=mbScaleStand(L);if(!h)return L;
  const k=X.min*X._ref/h,out=k>1.001?Object.assign({},L,{h:+(L.h*k).toFixed(1),mbk:+k.toFixed(3)}):L;
  X.stat.scaled[L.model+(L.tx?'*':'')]={from:+h.toFixed(1),k:+Math.max(1,k).toFixed(3)};
  mbScaleC.set(L,out);return out;
}
(function(){
  if(typeof lookOf!=='function'||typeof heroLook!=='function')return;
  const bl=lookOf;lookOf=function(e){const L=bl.apply(this,arguments);return S.mb&&e&&e!==P&&e.k==='hero'?mbScaleLook(L):L};
  const bh=heroLook;heroLook=function(){const L=bh.apply(this,arguments);return S.mb?mbScaleLook(L):L};
})();
