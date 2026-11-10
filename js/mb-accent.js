/* משחקי השאול: צבע הדגשה לכל גיבור (חבילת הבוקר של אוראל, 9.11.2026, משימה 5. הצבעים של ARI).
   זוהר (emissive) על חלק שכבר קיים, בדרך כלל הנשק, כדי שכל גיבור ייזהה מרחוק בצבע משלו:
   טנק: הסדקים הזוהרים בפטיש (כתום), לוחם: הלהב (לבן-עצם), צייד: הקשת (סגול), קוסם: המטה (כחול, מהבהב לטורקיז בסקיל-העל), מתנקש: הלהב (לילך).
   חוקים: רק על חלקים קיימים, עוצמה עד בערך 1.2, צבע הקבוצה אף פעם לא על חלק ההדגשה (הקבוצה בטבעת שבקנבס),
   ופעימה עדינה שנעצרת ב"פחות אפקטים" ובהפחתת תנועה. רק מראה.
   חל על הבוטים (mb3dUnit) ועל הגיבור שלך במראה הערכה (mb-kitlook.js). כיבוי: MBACC.on=false, או ?accent=off */
const MBACC={
  on:!/[?&]accent=off\b/.test(location.search),
  kit:{
    tank:{prop:'w_item_stoneHammer',col:'#FF8A3D',k:1.2},   // הפטיש זוהר רק בחלקים שיש להם emissiveMap (לבה ואבן חן), אז מלא
    warrior:{prop:'blade',col:'#ECE7DC',k:0.35},
    hunter:{prop:'w_bow_A_withString',col:'#D46BFF',k:0.55},
    mage:{prop:'staff',col:'#3F7BF5',k:0.6,ult:{col:'#46D3E6',k:1.2,t:0.8}},
    assassin:{prop:'blade',col:'#C7A6FF',k:0.5}
  },
  pulse:{amp:0.15,rate:2.2},   // פעימה: כמה (חלק מהעוצמה) וכמה מהר
  stat:{on:0,flash:0}
};
// החומרים של חלק ההדגשה בדמות הזאת, נאספים פעם אחת לכל דמות
function mbAccMats(a,C){
  if(a.accFor===C)return a.accM;a.accFor=C;a.accM=[];
  const L=a.L||{};for(const k in a.props){const p=L.props&&L.props[k];if(!p||p.prop!==C.prop)continue;
    a.props[k].traverse(o=>{if(o.isMesh)a.accM.push(o.material)})}
  return a.accM;
}
const mbAccCalm=()=>(typeof fxLess==='function'&&fxLess())||(typeof calmOn==='function'?calmOn():typeof RM!=='undefined'&&RM);
function mbAccTick(u,a){
  const C=MBACC.on&&u&&u.k==='hero'&&MBACC.kit[u.kit];if(!C||!a)return;
  const M=mbAccMats(a,C);if(!M.length)return;
  let col=C.col,k=C.k;const U=C.ult;
  if(U&&u.accUlt>MB.t){col=U.col;k=U.k*Math.min(1,(u.accUlt-MB.t)/U.t*2)}   // הבהוב בסקיל-העל
  if(!mbAccCalm())k*=1-MBACC.pulse.amp+MBACC.pulse.amp*Math.sin(MB.t*MBACC.pulse.rate*Math.PI*2+(u.id||0));
  k=Math.min(1.2,k);
  const c=a.accC||(a.accC=new THREE.Color());c.set(col).multiplyScalar(k);
  for(const m of M){m.emissive.copy(c);m.userData.em=c.clone()}   // em: setFlash חוזר לזה אחרי הבהוב פגיעה
  MBACC.stat.on++;
}
(function(){
  if(typeof mb3dUnit==='function'){const bu=mb3dUnit;mb3dUnit=function(e,dt){const r=bu.apply(this,arguments);
    try{if(e&&e.k==='hero')mbAccTick(e,R3D.actors.get(e))}catch(err){MBACC.on=false;console.warn('mb-accent',err)}return r}}
  if(typeof syncPlayer==='function'){const bp=syncPlayer;window.syncPlayer=function(){const r=bp.apply(this,arguments);
    try{const u=S.mb&&MB&&MB.me,a=R3D.player;if(u&&a&&a.L&&a.L.mbKit)mbAccTick(u,a)}catch(err){MBACC.on=false;console.warn('mb-accent',err)}return r}}
  if(typeof mbCast==='function'){const bc=mbCast;mbCast=function(u,slot){const r=bc.apply(this,arguments);
    const U=u&&MBACC.kit[u.kit]&&MBACC.kit[u.kit].ult;if(r&&slot==='ult'&&U){u.accUlt=MB.t+U.t;MBACC.stat.flash++}return r}}
})();
