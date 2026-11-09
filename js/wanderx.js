/* הדמות האישית של אוראל: ניסוי של הנודד החדש (Tripo, wandererX של ARI), כבוי כברירת מחדל. MAX ל-BOB, 9.11.2026.
   ?wanderx=1 (או WANDX.on=true תוך כדי משחק) מחליף רק את הגוף של הסקין של אוראל (HEROES.skins.orel) בגוף החדש, עם מטה ביד שמאל.
   הדמות הישנה (orelHero) נשארת ברירת המחדל, וגם הגיבוי כל עוד הגוף או המטה לא נטענו. המחלקה, הנשק, החליל והכוח לא משתנים.
   האנימציות: לשלד הזה כיוון אחר לתרגומים המקומיים, ולכן RETARGET.applyRotOnly (js/retarget-tracks.js, ARI): רק סיבובים, וגובה הירכיים לפי היחס.
   המטה: על handslotl, בתנוחה לפי האנימציה (WANDERX.carry, ARI: Idle_A ו-Running_B פתורים, השאר תנוחת הבסיס).
   מחיקה: הקובץ והשורה ב-index.html */
const WANDX={
  on:/[?&]wanderx=1(&|$)/.test(location.search),
  skin:'orel',model:'wandererX',ref:'barbarian',
  stat:{looks:0,fallback:0,clips:0,carry:0}
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
  if(X._ft!==t){X._ft=t;X._f=RETARGET.ratios(t,r);X._c={};X.stat.fac=RETARGET.report(X._f)}
  if(!(name in X._c)){X._c[name]=RETARGET.applyRotOnly(c,X._f);X.stat.clips++}
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
(function(){
  if(typeof heroLook!=='function'||typeof syncPlayer!=='function')return;
  const bh=heroLook;heroLook=function(){const L=bh.apply(this,arguments);return WANDX.on&&L&&heroSkin()===WANDX.skin?wandxLook(L):L};
  const ba=act;act=function(a,name){if(a&&a.L&&a.L.wx){const c=wandxClip(name);return c?a.mixer.clipAction(c):null}return ba.apply(this,arguments)};
  const bp=syncPlayer;syncPlayer=function(){const r=bp.apply(this,arguments),a=R3D.player;if(a&&a.L&&a.L.wx)wandxCarry(a);return r};
})();
