/* משחקי השאול: קו אור עדין על קצה הדמות (MBRIM, השיפוץ, MAX ל-BOB, 10.11.2026). רק מראה, ורק ב-overhaul/preview. ?mbrim=0 מכבה.
   למה: הגיבורים הכהים (הצייד, tankX, מתנקש בצל) נבלעים ברצפה הכהה. הרצפה היא מנוף חלש (MBFLOOR), אז מאירים רק את קצה הגוף, לא את כולו.
   איך: אור רק במשטחים כמעט בזווית למצלמה (smoothstep בין lo ל-hi על 1 פחות הזווית), כך שמהמצלמה מלמעלה רק קו המתאר נדלק.
   (קו האור הקודם של tankX היה עקומה רכה, וצבע את כל הגוף.) מתווסף בסוף התאורה (לפני opaque_fragment), ולכן לא תלוי בחומר של tankX ובהבזק.
   מטרה (MAX): ΔL* מול הרצפה לפחות 20, ולפחות חצי מפיקסלי קו המתאר בהפרש 20 ומעלה. נמדד בכלים של BOB (floorsep), במצלמת המשחק.
   מחיקה: הקובץ והשורה ב-index.html */
const MBRIM={
  on:!/[?&]mbrim=0(&|$)/.test(location.search),
  lo:0.55,hi:0.9,     // איפה מתחיל הקו ואיפה הוא מלא: 1 פחות cos הזווית בין הנורמל למצלמה
  // לכל ערכה: צבע וחוזק. k 0: בלי קו. החיילים לפי הקבוצה (m0 כחול שלנו, m1 אדום)
  // lo/hi לכל ערכה (לא חובה). הטנק 0: ב-tankX (Tripo, אטלס לפי משולש) הנורמלים שבורים לפאות, וכל קו אור נשבר לנקודות חול על כל הגוף. אצלו gain במקום (mb-tankx.js)
  // fill (לא חובה): אור עצמי עדין לפי הצבע של הדמות עצמה (diffuseColor), בכל הגוף, לגיבור שגופו כהה מדי גם עם הקו (המתנקש)
  kit:{tank:{c:'#FFE2B8',k:0,lo:0.78,hi:0.97},hunter:{c:'#E8F2FF',k:0.55},assassin:{c:'#F0E6FF',k:0.85,fill:0.35},warrior:{c:'#FFF4E0',k:0},mage:{c:'#E6F0FF',k:0},
       m0:{c:'#DCEBFF',k:0},m1:{c:'#FFE0DC',k:0}},
  stat:{mats:0,actors:0}
};
// החומר: uniforms משלו לכל חומר, וקוד אחד לכולם (customProgramCacheKey). שומר על onBeforeCompile קודם (tankX)
function mbRimMat(m,R){
  const lo=R.lo!=null?R.lo:MBRIM.lo,hi=R.hi!=null?R.hi:MBRIM.hi;
  if(m.userData.rimU){const u=m.userData.rimU;u.c.value.set(R.c);u.k.value=R.k;u.lo.value=lo;u.hi.value=hi;u.f.value=R.fill||0;return}
  const U=m.userData.rimU={c:{value:new THREE.Color(R.c)},k:{value:R.k},lo:{value:lo},hi:{value:hi},f:{value:R.fill||0}};MBRIM.stat.mats++;
  const prev=m.onBeforeCompile,pk=m.customProgramCacheKey&&m.customProgramCacheKey!==THREE.Material.prototype.customProgramCacheKey?m.customProgramCacheKey.bind(m):null;
  m.onBeforeCompile=function(sh,r){if(prev)prev.call(this,sh,r);
    sh.uniforms.mbRimC=U.c;sh.uniforms.mbRimK=U.k;sh.uniforms.mbRimLo=U.lo;sh.uniforms.mbRimHi=U.hi;sh.uniforms.mbRimF=U.f;
    sh.fragmentShader='uniform vec3 mbRimC;uniform float mbRimK,mbRimLo,mbRimHi,mbRimF;\n'+sh.fragmentShader.replace('#include <opaque_fragment>',
      '{vec3 rV=isOrthographic?vec3(0.0,0.0,1.0):normalize(vViewPosition);float rR=smoothstep(mbRimLo,mbRimHi,1.0-clamp(dot(normal,rV),0.0,1.0));outgoingLight+=mbRimC*rR*mbRimK+diffuseColor.rgb*mbRimF;}\n#include <opaque_fragment>')};
  m.customProgramCacheKey=()=>(pk?pk():'')+'|mbRim';m.needsUpdate=true;
}
function mbRimActor(a,key){
  const R=MBRIM.kit[key];if(!a||!R||a.rimKey===key)return;a.rimKey=key;MBRIM.stat.actors++;
  a.root.traverse(o=>{if(o.isSkinnedMesh)for(const m of [].concat(o.material))mbRimMat(m,R)});
}
(function(){
  if(!MBRIM.on||typeof mb3dUnit!=='function')return;
  const keyOf=e=>e.k==='hero'?e.kit:e.k==='minion'?'m'+e.team:null;
  const bu=mb3dUnit;mb3dUnit=function(e){const r=bu.apply(this,arguments),k=keyOf(e);if(k&&MBRIM.kit[k]&&(MBRIM.kit[k].k>0||MBRIM.kit[k].fill>0))mbRimActor(R3D.actors.get(e),k);return r};
  const bp=syncPlayer;syncPlayer=function(){const r=bp.apply(this,arguments);if(S.mb&&MB&&MB.me){const k=MB.me.kit;if(MBRIM.kit[k]&&(MBRIM.kit[k].k>0||MBRIM.kit[k].fill>0))mbRimActor(R3D.player,k)}return r};
})();
