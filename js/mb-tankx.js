/* משחקי השאול: ניסוי של הטנק החדש של אוראל (Tripo, גוף TankKK של ARI), כבוי כברירת מחדל. MAX ל-BOB, 9.11.2026.
   ?tankx=1 (או MBTANKX.on=true תוך כדי משחק) מחליף את הגוף של בוט הטנק בגוף החדש, עם הפטיש ביד ימין. הטנק הנוכחי הוא ברירת המחדל,
   וגם הגיבוי: כל עוד הקובץ של הגוף או של הפטיש לא נטען, או שהוא חסר, הבוט נשאר הטנק הרגיל.
   רק מראה: הגודל, הטווח, רגע הנזק וההבהוב לא משתנים (lookOf מחזיר מראה, ולא נוגע ביחידה).
   תיקון אורך העצמות (ARI): לגוף החדש יש שמות עצמות של KayKit, אבל עצמות באורך אחר. לכן כל ערוץ מיקום (position) באנימציה
   מוכפל ביחס בין אורך העצמה בגוף החדש לאורך שלה בברברי של KayKit (אותו שם). ערוצי סיבוב לא משתנים. רק לגוף הזה, ברגע שהאנימציה נטענת לו.
   הפטיש: על handslotr, בתנוחה לפי סוג האנימציה (carry, מ-ARI).
   מחיקה: הקובץ והשורה ב-index.html */
const MBTANKX={
  on:/[?&]tankx=1(&|$)/.test(location.search),
  kit:'tank',model:'tankX',ref:'barbarian',
  hammer:{prop:'w_item_tankXHammer',bone:'handslotr',pos:[0,0,0],rot:[0,-1,0,0],s:1},
  shield:false,   // הגוף החדש מחזיק פטיש בשתי ידיים: בלי המגן של הטנק הרגיל
  // תנוחת הפטיש ביד לפי מה שמנגן (ARI, #586, נפתרה לכל אנימציה): idle רק ל-Idle_*, run לריצה, וכל השאר (תקיפה, פגיעה, מוות) בתנוחה הרגילה
  carry:{idle:{pos:[0,0,0],rot:[-0.5998,0.4684,0.6176,0.1985]},run:{pos:[0,0,0],rot:[-0.6369,0.2983,0.6826,0.1987]},attack:{pos:[0,0,0],rot:[0,-1,0,0]}},
  minLen:1e-4,    // עצמה שאורכה בברברי קטן מזה: בלי תיקון
  comp:null,      // אם ARI מספקת פונקציה משלה: (clip, tmpl, ref) => clip. אחרת tankxComp למטה
  stat:{looks:0,actors:0,rebuilt:0,clips:0,tracks:0,fallback:0,fac:null}
};
// המראה: כמו הטנק הרגיל, עם הגוף החדש והפטיש. null אם משהו עוד לא מוכן (ואז הטנק הרגיל)
function tankxLook(){
  const X=MBTANKX,B=typeof LOOK3D!=='undefined'&&LOOK3D.mb_tank;if(!B)return null;
  const hm=X.hammer&&X.hammer.prop,okM=m3dNeed(X.model),okH=!hm||m3dNeed(hm);
  if(!okM||!okH||!R3D.tmpl[X.model]){X.stat.fallback++;return null}
  const hasH=!!hm&&!!R3D.props[hm];
  if(X._L&&X._L.base===B&&X._L.model===X.model&&X._h===hasH)return X._L;
  const props={};if(X.shield&&B.props&&B.props.shield)props.shield=B.props.shield;
  if(hasH)props.hammer=Object.assign({},X.hammer);
  X._h=hasH;X.stat.looks++;
  return X._L=Object.assign({},B,{model:X.model,props,base:B,tx:1});
}
// אורך כל עצמה במנוחה (המיקום המקומי שלה), לפי שם
function tankxRest(t){const m={};t.traverse(o=>{if(o.isBone)m[o.name]=o.position.length()});return m}
// היחס לכל עצמה: אורך בגוף החדש / אורך בברברי. מחושב פעם אחת לכל תבנית
function tankxFactors(){
  const X=MBTANKX,t=R3D.tmpl[X.model],k=R3D.tmpl[X.ref];if(!t||!k)return null;
  if(X._f&&X._ft===t)return X._f;
  const a=tankxRest(t),b=tankxRest(k),f={};let lo=Infinity,hi=0,n=0;
  for(const nm in a)if(nm in b&&b[nm]>=X.minLen){f[nm]=a[nm]/b[nm];lo=Math.min(lo,f[nm]);hi=Math.max(hi,f[nm]);n++}
  X._f=f;X._ft=t;X._c={};
  X.stat.fac={n,lo:+lo.toFixed(3),hi:+hi.toFixed(3),hips:f.hips!=null?+f.hips.toFixed(3):null};
  return f;
}
// האנימציה עם התיקון. ערוץ שלא השתנה נשאר אותו אובייקט, ואנימציה בלי ערוצי מיקום חוזרת כמו שהיא
function tankxComp(c,f){
  let n=0;const tr=c.tracks.map(t=>{
    const i=t.name.lastIndexOf('.');if(t.name.slice(i+1)!=='position')return t;
    const k=f[t.name.slice(0,i)];if(k==null||Math.abs(k-1)<1e-6)return t;
    const q=t.clone();for(let j=0;j<q.values.length;j++)q.values[j]*=k;n++;return q});
  if(!n)return c;
  MBTANKX.stat.tracks+=n;return new THREE.AnimationClip(c.name,c.duration,tr);
}
function tankxClip(name){
  const X=MBTANKX,c=R3D.clips[name];if(!c)return null;
  const f=tankxFactors();if(!f)return c;
  if(name in X._c)return X._c[name];
  X.stat.clips++;
  return X._c[name]=typeof X.comp==='function'?X.comp(c,R3D.tmpl[X.model],R3D.tmpl[X.ref]):tankxComp(c,f);
}
// סוג האנימציה בשביל הפטיש: אנימציה חד-פעמית (תקיפה, פגיעה, מוות, הופעה) גוברת, ואז הבסיס. רק Idle_* ו-Running/Walking מקבלים תנוחה משלהם
const tankxFam=(one,base)=>{const n=(one||base||'').split('@')[0];return /^Idle_/.test(n)?'idle':/^(Running|Walking)_/.test(n)?'run':'attack'};
// תנוחת הפטיש לפי מה שמנגן עכשיו
function tankxCarry(a){
  const C=MBTANKX.carry,m=a.props&&a.props.hammer;if(!C||!m)return;
  const one=a.one&&a.one.isRunning()?a.one.getClip().name:'';
  const fam=tankxFam(one,a.base),p=C[fam]||C.attack;a.fam=fam;
  if(!p||a.carry===p)return;a.carry=p;
  if(p.pos)m.position.fromArray(p.pos);if(p.rot)m.quaternion.fromArray(p.rot);if(p.s)m.scale.setScalar(p.s);
}
(function(){
  if(typeof lookOf!=='function'||typeof mb3dUnit!=='function')return;
  const isTank=e=>!!e&&S.mb&&e!==P&&e.k==='hero'&&e.kit===MBTANKX.kit;
  const bl=lookOf;lookOf=function(e){if(MBTANKX.on&&isTank(e)){const L=tankxLook();if(L)return L}return bl.apply(this,arguments)};
  // האנימציות של הגוף החדש עוברות דרך התיקון. כל המקומות שמנגנים (loop, once) עוברים דרך act
  const ba=act;act=function(a,name){if(a&&a.L&&a.L.tx){const c=tankxClip(name);return c?a.mixer.clipAction(c):null}return ba.apply(this,arguments)};
  // מתג תוך כדי משחק, או גוף שסיים להיטען: הדמות נבנית מחדש (עם אותו מצב תקיפה, כדי שלא תצא תקיפה מיותרת)
  const bu=mb3dUnit;mb3dUnit=function(e,dt){
    if(isTank(e)){const a=R3D.actors.get(e),L=lookOf(e);
      if(a&&L&&a.key!==lookKey(L)&&!a.dieT){const pv=a.prev;freeActor(a);R3D.actors.delete(e);MBTANKX.stat.rebuilt++;
        const n=makeActor(L);n.root.scale.setScalar(L.h/COSB()/R3D.tmpl[L.model].userData.h);n.sc0=n.root.scale.x;n.prev=pv;R3D.actors.set(e,n)}}
    const r=bu.apply(this,arguments);
    if(isTank(e)){const a=R3D.actors.get(e);if(a&&a.L&&a.L.tx){if(!a.txSeen){a.txSeen=1;MBTANKX.stat.actors++}tankxCarry(a)}}
    return r};
})();
