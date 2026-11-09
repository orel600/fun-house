/* משחקי השאול: מראה האבן של הטנק (MAX אחרי ההשוואה של DANA, 9.11.2026: "הפער הגדול ביותר: גוף הטנק").
   הקונספט (hero-concept-tank.png): גולם אובסידיאן עם סדקי לבה. הגוף נשאר הברברי של KayKit, ורק החומר שלו משתנה:
   - אבן כהה: הטקסטורה המקורית נמשכת לאפור-אבן כהה (נשאר קצת מהגוון, כדי שהחלקים עדיין נבדלים זה מזה).
   - סדקי לבה: רשת סדקים (Voronoi) במרחב של הגוף עצמו (לפני השלד, ולכן הסדקים זזים עם הגוף), זוהרים בכתום #FF8A3D ופועמים לאט.
   - הפטיש גדול יותר (hammer), רק בציור: הטווח, הפגיעה והגודל של היחידה לא משתנים.
   הפטיש והכתר נשארים (mb-parts.js). חל על הבוטים ועל הגיבור שלך במראה הערכה. "פחות אפקטים" והפחתת תנועה: בלי פעימה.
   מתג: MBTANKSTONE.on (גם תוך כדי משחק), או ?stone=off. רק מראה. מחיקה: הקובץ והשורה ב-index.html */
const MBTANKSTONE={
  on:!/[?&]stone=off\b/.test(location.search),
  stone:'#3A3633',     // אפור-אבן כהה
  keep:0.22,           // כמה מהצבע המקורי נשאר (0: אבן אחידה)
  ember:'#FF8A3D',k:1.15,   // צבע הסדקים ועוצמה (עד בערך 1.2, כמו צבעי ההדגשה)
  freq:3.2,width:0.12, // צפיפות הסדקים (ביחידות של המודל, הגוף בגובה של כ-2) ועובי
  pulse:{amp:0.25,rate:0.7},
  hammer:1.4,          // קנה מידה של הפטיש בציור
  stat:{mats:0,actors:0}
};
const MBTS_U={tsOn:{value:1},tsT:{value:0},tsStone:{value:new THREE.Color()},tsEmber:{value:new THREE.Color()},tsKeep:{value:0.2},tsFreq:{value:5},tsW:{value:0.07}};
// הגוף של הטנק: הבוט (LOOK3D.mb_tank או המראה עם החלקים) או הגיבור שלך במראה הערכה
// רק על גוף הברברי: לגוף החדש (tankHF, mb-parts.js) יש סדקים וזהב משלו
const mbTsIs=L=>!!L&&typeof LOOK3D!=='undefined'&&L.model==='barbarian'&&(L===LOOK3D.mb_tank||L.base===LOOK3D.mb_tank||L.mbKit==='tank');
function mbTsMat(m){
  if(m.userData.ts)return;m.userData.ts=1;MBTANKSTONE.stat.mats++;
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,MBTS_U);
    sh.vertexShader='varying vec3 vTs;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTs=position;');
    sh.fragmentShader=`varying vec3 vTs;uniform float tsOn,tsT,tsKeep,tsFreq,tsW;uniform vec3 tsStone,tsEmber;
      vec3 tsH(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return fract(sin(p)*43758.5453);}
      float tsCrack(vec3 p){vec3 i=floor(p),f=fract(p);float d1=8.0,d2=8.0;
        for(int z=-1;z<=1;z++)for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec3 g=vec3(float(x),float(y),float(z));vec3 r=g+tsH(i+g)-f;float d=dot(r,r);if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;}
        return 1.0-smoothstep(0.0,tsW,sqrt(d2)-sqrt(d1));}
      `+sh.fragmentShader
      .replace('#include <map_fragment>','#include <map_fragment>\nif(tsOn>0.5){float l=dot(diffuseColor.rgb,vec3(0.299,0.587,0.114));diffuseColor.rgb=mix(tsStone*(0.55+0.9*l),diffuseColor.rgb*0.6,tsKeep);}')
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nif(tsOn>0.5){float c=tsCrack(vTs*tsFreq);totalEmissiveRadiance+=tsEmber*c*tsT;}');
  };
  m.customProgramCacheKey=()=>'mbTankStone';m.needsUpdate=true;
}
// הפטיש: גדול יותר בציור. נשמר הגודל המקורי כדי שאפשר יהיה לכבות
function mbTsHammer(a){
  const L=a.L||{};for(const k in a.props){const p=L.props&&L.props[k];if(!p||p.prop!=='w_item_stoneHammer')continue;const m=a.props[k];
    if(m.userData.s0==null)m.userData.s0=m.scale.x;m.scale.setScalar(m.userData.s0*(MBTANKSTONE.on?MBTANKSTONE.hammer:1))}
}
// כל פריים, פעם אחת: עוצמת הסדקים (פעימה), הצבעים והמתג
function mbTsTick(){
  const S_=MBTANKSTONE,calm=(typeof fxLess==='function'&&fxLess())||(typeof calmOn==='function'?calmOn():typeof RM!=='undefined'&&RM);
  MBTS_U.tsOn.value=S_.on?1:0;MBTS_U.tsKeep.value=S_.keep;MBTS_U.tsFreq.value=S_.freq;MBTS_U.tsW.value=S_.width;
  MBTS_U.tsStone.value.set(S_.stone);MBTS_U.tsEmber.value.set(S_.ember);
  const t=typeof MB!=='undefined'&&MB?MB.t:0;MBTS_U.tsT.value=Math.min(1.2,S_.k*(calm?1:1-S_.pulse.amp*0.5+S_.pulse.amp*0.5*Math.sin(t*S_.pulse.rate*Math.PI*2)));
}
(function(){
  if(typeof makeActor!=='function')return;
  // רק הגוף (עם שלד). הפטיש, הכתר והמגן הם חפצים על עצמות ונשארים כמו שהם
  const bm=makeActor;window.makeActor=function(L){const a=bm.apply(this,arguments);
    try{if(mbTsIs(L)&&!a.ts){a.ts=1;MBTANKSTONE.stat.actors++;a.root.traverse(o=>{if(o.isSkinnedMesh)mbTsMat(o.material)})}}catch(e){console.warn('mb-tankstone',e)}
    return a};
  const tick=a=>{if(a&&a.ts)mbTsHammer(a)};
  if(typeof mb3dUnit==='function'){const bu=mb3dUnit;mb3dUnit=function(e,dt){const r=bu.apply(this,arguments);if(e&&e.kit==='tank')tick(R3D.actors.get(e));return r}}
  if(typeof syncPlayer==='function'){const bp=syncPlayer;window.syncPlayer=function(){mbTsTick();const r=bp.apply(this,arguments);if(S.mb)tick(R3D.player);return r}}
})();
