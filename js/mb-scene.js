/* משחקי השאול: מראה הסצנה מהכיוון האמנותי של ARI (art-direction-1.md, artdir/ov1.json, MBSCENE, השיפוץ, 10.11.2026). רק מראה.
   דולק יחד עם רצפת הלוחות (?mbfloor=plates, ברירת המחדל המועמדת, mb-floor.js). ?mbfloor=deep מחזיר את כל הישן (רצפה, אור, קו אור, צל וטבעות), כדי שההשוואה תהיה הוגנת.
   - קו האור והאור העצמי לפי ערכה (MBRIM.kit, רק המספרים): הטנק, הצייד והמתנקש חזקים יותר, והלוחם והקוסמת מקבלים קו.
   - האור של הסצנה, רק בשאול: שמיים חלשים יותר, שמש חזקה וחמה יותר (light). בכל מקום אחר האור המקורי חוזר.
   - הצל העגול מתחת לדמויות כהה יותר (shadowA), והטבעת מתחת לדמויות עבה יותר (ring: הרדיוס הפנימי, 0.78 במקור), רק בשאול.
   - עיגול הטווח של מגדל של הקבוצה עמום יותר (rangeA, moba.js). עיגול של מגדל שמכוון אליך נשאר כמו שהוא: זו סכנה.
   מחיקה: הקובץ, השורה ב-index.html, הפלטה plates ב-mb-floor.js והקריאה ב-moba.js */
const MBSCENE={
  on:typeof MBFLOOR!=='undefined'&&MBFLOOR.on==='plates'&&!/[?&]mbscene=0(&|$)/.test(location.search),   // ?mbscene=0: רצפת הלוחות בלי שאר השינויים (להשוואה: מה מגיע מהרצפה ומה מהאור)
  rim:{tank:{k:0.5,lo:0.6,hi:0.92,fill:0.45},hunter:{k:0.9,fill:0.25},assassin:{k:1.2,fill:0.6},warrior:{k:0.5},mage:{k:0.5}},
  light:{hemi:1.35,sun:2.4,sunCol:'#ffe8c8',sky:'#e8eeff',ground:'#4a3c5c'},
  shadowA:0.6,ring:0.62,rangeA:'30',   // rangeA: שקיפות עיגול הטווח של מגדל של הקבוצה (hex, במקור 55)
  stat:{applied:0}
};
(function(){
  const X=MBSCENE;if(!X.on)return;
  if(typeof MBRIM!=='undefined')for(const k in X.rim)if(MBRIM.kit[k])Object.assign(MBRIM.kit[k],X.rim[k]);
  // האור, הצל והטבעות: רק כשבשאול, וחוזרים כשיוצאים. נבדק בכל פריים (זול), ומוחל רק כשהמצב משתנה
  let was=null,orig=null,ringGeo=null;
  const apply=on=>{
    if(typeof R3D==='undefined'||!R3D.scene||!R3D.marks)return;
    if(!orig){orig={lights:[],shadow:R3D.marks.shadow.material.opacity,ring:{}};R3D.scene.traverse(o=>{if(o.isHemisphereLight||o.isDirectionalLight)orig.lights.push({o,i:o.intensity,c:o.color.clone(),g:o.groundColor&&o.groundColor.clone()})});
      for(const k in DMG.types)if(R3D.marks[k])orig.ring[k]=R3D.marks[k].geometry}
    const L=X.light,v=typeof VIEW!=='undefined'&&VIEW.light||1;
    for(const l of orig.lights){if(!on){l.o.intensity=l.i;l.o.color.copy(l.c);if(l.g)l.o.groundColor.copy(l.g);continue}
      if(l.o.isHemisphereLight){l.o.intensity=L.hemi*v;l.o.color.set(L.sky);l.o.groundColor.set(L.ground)}else{l.o.intensity=L.sun*v;l.o.color.set(L.sunCol)}}
    R3D.marks.shadow.material.opacity=on?X.shadowA:orig.shadow;
    if(on&&!ringGeo)ringGeo=new THREE.RingGeometry(X.ring,1,28).rotateX(-Math.PI/2);
    for(const k in orig.ring)R3D.marks[k].geometry=on?ringGeo:orig.ring[k];
    X.stat.applied++;
  };
  if(typeof syncPlayer==='function'){const b=syncPlayer;syncPlayer=function(){const now=!!(typeof S!=='undefined'&&S&&S.mb);if(now!==was){was=now;apply(now)}return b.apply(this,arguments)}}
})();
