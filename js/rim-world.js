/* קו אור על קצה הגיבור במקומות חשוכים (RIMW, ניר 11.11.2026: "לעבור על מה שאוראל בונה ולהשתמש"). רק מראה.
   למה: בלב הצל (האזור shadow, map-shadow.js) ובלילה (wxTheme ב-weather.js) הגיבור נבלע ברקע הכהה.
   איך: mbRimMat הועתק מהענף של אוראל overhaul/preview (PR #599, js/mb-rim.js, MBRIM): אור רק במשטחים שכמעט בזווית למצלמה,
   כך שמלמעלה נדלק רק קו המתאר, ועוד אור עצמי עדין (fill) לפי צבע הדמות. השם שונה ל-rimwMat כדי לא להתנגש עם הקובץ של אוראל.
   רק הגיבור (R3D.player), רק בעולם ובכפר. החומר מוכן כבר כשהגיבור נבנה (בלי קפיצה בכניסה לחושך), והעוצמה עולה ויורדת בהדרגה.
   במקום אחר העוצמה 0, כלומר כבוי. ?rimw=0 מכבה הכל. חיבור: עוטף את syncPlayer (render3d.js). מחיקה: הקובץ והשורה ב-index.html */
const RIMW={
  on:!/[?&]rimw=0(&|$)/.test(location.search),
  c:'#DCE6FF',      // צבע הקו: לבן-תכלת קר, כמו אור ירח
  k:0.6,            // חוזק הקו בחושך מלא
  fill:0.18,        // אור עצמי עדין לכל הגוף, לפי צבע הדמות
  lo:0.55,hi:0.9,   // איפה הקו מתחיל ואיפה הוא מלא: 1 פחות cos הזווית בין הנורמל למצלמה (כמו אצל אוראל)
  fade:2.5,         // כמה מהר נכנס ויוצא (לשנייה)
  where:()=>!!S&&(S.wd||S.vil)&&!S.room&&!S.mb,
  dark:()=>!!(S.wd&&typeof WR==='function'&&WR().shadow)||typeof wxTheme==='function'&&wxTheme()==='night',
  stat:{mats:0,actors:0,on:0,f:0}   // f: העוצמה עכשיו (0 עד 1), בשביל הבוט
};
// החומר: uniforms משלו לכל חומר, וקוד אחד לכולם (customProgramCacheKey). שומר על onBeforeCompile קודם. מ-mbRimMat של אוראל (#599)
function rimwMat(m,R){
  if(m.userData.rimwU)return m.userData.rimwU;
  const U=m.userData.rimwU={c:{value:new THREE.Color(R.c)},k:{value:0},lo:{value:R.lo},hi:{value:R.hi},f:{value:0}};RIMW.stat.mats++;
  const prev=m.onBeforeCompile,pk=m.customProgramCacheKey&&m.customProgramCacheKey!==THREE.Material.prototype.customProgramCacheKey?m.customProgramCacheKey.bind(m):null;
  m.onBeforeCompile=function(sh,r){if(prev)prev.call(this,sh,r);
    sh.uniforms.rwC=U.c;sh.uniforms.rwK=U.k;sh.uniforms.rwLo=U.lo;sh.uniforms.rwHi=U.hi;sh.uniforms.rwF=U.f;
    sh.fragmentShader='uniform vec3 rwC;uniform float rwK,rwLo,rwHi,rwF;\n'+sh.fragmentShader.replace('#include <opaque_fragment>',
      '{vec3 rV=isOrthographic?vec3(0.0,0.0,1.0):normalize(vViewPosition);float rR=smoothstep(rwLo,rwHi,1.0-clamp(dot(normal,rV),0.0,1.0));outgoingLight+=rwC*rR*rwK+diffuseColor.rgb*rwF;}\n#include <opaque_fragment>')};
  m.customProgramCacheKey=()=>(pk?pk():'')+'|rimw';m.needsUpdate=true;return U;
}
// כל החומרים של הגוף (SkinnedMesh), פעם אחת לכל גיבור שנבנה
function rimwActor(a){
  if(a.rimw)return a.rimw;a.rimw=[];RIMW.stat.actors++;
  a.root.traverse(o=>{if(o.isSkinnedMesh)for(const m of [].concat(o.material))a.rimw.push(rimwMat(m,RIMW))});
  return a.rimw;
}
let rimwF=0;   // העוצמה עכשיו
function rimwTick(dt){
  const a=R3D.player;if(!a||!a.root)return;
  const want=RIMW.where()&&RIMW.dark()?1:0,s=Math.min(1,(dt||0)*RIMW.fade);
  rimwF+=(want-rimwF)*(dt?s:1);if(Math.abs(want-rimwF)<0.01)rimwF=want;
  const us=rimwActor(a);for(const U of us){U.k.value=RIMW.k*rimwF;U.f.value=RIMW.fill*rimwF}
  RIMW.stat.f=rimwF;if(want)RIMW.stat.on++;
}
(function(){
  if(!RIMW.on||typeof syncPlayer!=='function')return;
  const bp=syncPlayer;syncPlayer=function(dt){const r=bp.apply(this,arguments);if(R3D.on)rimwTick(dt);return r};
})();
