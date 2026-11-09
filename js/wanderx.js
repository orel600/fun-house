/* הדמות האישית של אוראל: ניסוי של הנודד החדש (Tripo, wandererX של ARI), כבוי כברירת מחדל. MAX ל-BOB, 9.11.2026.
   ?wanderx=1 (או WANDX.on=true תוך כדי משחק) מחליף רק את הגוף של הסקין של אוראל (HEROES.skins.orel) בגוף החדש, עם מטה ביד שמאל.
   הדמות הישנה (orelHero) נשארת ברירת המחדל, וגם הגיבוי כל עוד הגוף או המטה לא נטענו. המחלקה, הנשק, החליל והכוח לא משתנים.
   האנימציות: לשלד הזה כיוון אחר לתרגומים המקומיים, ולכן RETARGET.applyRotOnly (js/retarget-tracks.js, ARI): רק סיבובים, וגובה הירכיים לפי היחס.
   המטה: על handslotl, בתנוחה לפי האנימציה (WANDERX.carry, ARI: Idle_A ו-Running_B פתורים, השאר תנוחת הבסיס).
   מחיקה: הקובץ והשורה ב-index.html */
const WANDX={
  on:/[?&]wanderx=1(&|$)/.test(location.search),
  skin:'orel',model:'wandererX',ref:'barbarian',
  stat:{looks:0,fallback:0,clips:0,carry:0,gait:0,mats:0}
};
// המראה: כמו של אוראל, עם הגוף החדש והמטה. בלי שינוי אם משהו עוד לא מוכן
function wandxLook(L){
  const X=WANDX,W=typeof WANDERX!=='undefined'?WANDERX:null;if(!W||typeof RETARGET==='undefined')return L;
  const okM=m3dNeed(X.model),okS=m3dNeed(W.staffProp);
  if(!okM||!okS||!R3D.tmpl[X.model]){X.stat.fallback++;return L}
  if(X._b===L&&X._L)return X._L;
  const props=Object.assign({},L.props),c=W.carry.default;
  for(const k in props)if(props[k].bone===W.bone&&k!=='gun')delete props[k];   // היד של המטה פנויה (הקשת נשארת: היא מוסתרת כשהחרב ביד)
  if(R3D.props[W.staffProp])props.staff={prop:W.staffProp,bone:W.bone,pos:c.pos,rot:c.rot,s:1};
  X._b=L;X.stat.looks++;
  return X._L=Object.assign({},L,{model:X.model,props,wx:1});
}
function wandxClip(name){
  const X=WANDX,c=R3D.clips[name];if(!c)return null;
  const t=R3D.tmpl[X.model],r=R3D.tmpl[X.ref];if(!t||!r)return c;
  if(X._ft!==t){X._ft=t;X._f=RETARGET.ratios(t,r);X._c={};X._rq=null;X.stat.fac=RETARGET.report(X._f)}
  if(!(name in X._c)){let k=RETARGET.applyRotOnly(c,X._f);X.stat.clips++;
    // ריצה: צעד קטן יותר (ARI, WANDERX.gait): הרגליים ארוכות ביחס לגובה, ובאותן זוויות הרגל עפה רחוק ומחליקה
    const G=WANDERX.gait&&WANDERX.gait[name.split('@')[0]];
    if(G&&RETARGET.dampen){if(!X._rq){X._rq={};t.traverse(o=>{if(o.isBone)X._rq[o.name]=o.quaternion.toArray()})}k=RETARGET.dampen(k,X._rq,G.k,G.bones);X.stat.gait++}
    X._c[name]=k}
  return X._c[name];
}
// המטה: גלוי תמיד, ובתנוחה של האנימציה שמנגנת (חד-פעמית קודם, ואז הבסיס)
function wandxCarry(a){
  const W=WANDERX,m=a.props&&a.props.staff;if(!m)return;m.visible=true;
  const one=a.one&&a.one.isRunning()?a.one.getClip().name:'',n=(one||a.base||'').split('@')[0],p=W.carry[n]||W.carry.default;
  if(a.wxCarry===p)return;a.wxCarry=p;a.wxClip=W.carry[n]?n:'default';X_.carry++;
  m.position.fromArray(p.pos);m.quaternion.fromArray(p.rot);
}
const X_=WANDX.stat;
// הבהוב פגיעה על כל הגוף: לגוף הזה יש מפת זוהר (הפנס, ARI), שמכפילה את צבע ההבהוב ומשאירה אותו רק על הפנס
function wandxMat(m){
  if(m.userData.wxF)return;m.userData.wxF={value:0};X_.mats++;
  m.onBeforeCompile=sh=>{sh.uniforms.wxF=m.userData.wxF;
    sh.fragmentShader='uniform float wxF;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance=mix(totalEmissiveRadiance,emissive,wxF);')};
  m.customProgramCacheKey=()=>'wandX';m.needsUpdate=true;
}
(function(){
  if(typeof heroLook!=='function'||typeof syncPlayer!=='function')return;
  // כשאתה משחק טנק עם הניסוי שלו (mb-tankx.js), הגוף של הטנק גובר
  const bh=heroLook;heroLook=function(){const L=bh.apply(this,arguments);return WANDX.on&&L&&!L.tx&&heroSkin()===WANDX.skin?wandxLook(L):L};
  const bm=makeActor;makeActor=function(L){const a=bm.apply(this,arguments);if(L&&L.wx)for(const m of a.mats)wandxMat(m);return a};
  const bf=setFlash;setFlash=function(a,k){bf.apply(this,arguments);if(a&&a.L&&a.L.wx)for(const m of a.mats)if(m.userData.wxF)m.userData.wxF.value=k>0?1:0};
  for(const n of ['armor3d','rankArmor3d','gear3dParts'])if(typeof window[n]==='function'){const b=window[n];window[n]=function(a){if(a&&a.L&&a.L.wx)return;return b.apply(this,arguments)}}
  const ba=act;act=function(a,name){if(a&&a.L&&a.L.wx){const c=wandxClip(name);return c?a.mixer.clipAction(c):null}return ba.apply(this,arguments)};
  const bp=syncPlayer;syncPlayer=function(){const r=bp.apply(this,arguments),a=R3D.player;if(a&&a.L&&a.L.wx)wandxCarry(a);return r};
})();
