/* retarget-tracks.js: קליפים של KayKit על מודל עם אורכי עצמות אחרים (ARI, 9.11.2026, ניסוי tankX). לא נטען מ-index.html: BOB מחבר.

   הבעיה: כל קליפ של KayKit (Rig_Medium) כולל גם רצועות position לכל עצם, עם אורכי העצמות של KayKit (hips y=0.39, ירך-שוק 0.227...). מודל על אותו שלד עם שמות
   זהים אבל אורכי עצמות אחרים (הטנק של Tripo, בגובה 0.9 ובפרופורציות של אדם) יקבל את אורכי ה-KayKit ויתעוות. הרצועות quaternion נשארות כמו שהן.

   הפתרון (לא אוניברסלי, מוודאים לכל מודל לחוד): לכל עצם b, גורם יחיד  f_b = |rest_model(b)| / |rest_kaykit(b)|, כש-rest הוא ה-position המקומי של העצם בתנוחת
   המנוחה של השלד. מכפילים את כל שלושת הרכיבים של כל רצועת position של b ב-f_b (כולל hips: גם הגובה שלו משתנה). עצמות עם אורך KayKit < 1e-4 (למשל root) לא נוגעים.
   זה לא היסט ולא אחיד: כל עצם עם הגורם שלה. מודל שהשלד שלו זהה ל-KayKit מקבל f=1 בכל מקום, ולכן הפונקציה בטוחה גם בלי מפתח.

   שימוש (רק למודל הזה, בזמן טעינת הקליפים):
     const ref = (await parse(MODELS3D.barbarian)).scene, mine = (await parse(MODELS3D.tankX)).scene;
     const ratios = RETARGET.ratios(mine, ref);                 // טבלה {שם עצם: גורם}, אפשר לשמור
     const clip2 = RETARGET.apply(clip, ratios);                // קליפ חדש, המקורי לא משתנה
   כדי לוודא שהגורמים סבירים: RETARGET.report(ratios) מחזיר את המינימום והמקסימום ואת העצמות הקיצוניות.

   TANKX.carry: היסט של הפטיש על handslotr לפי משפחת קליפ (נתונים בטבלה אחת). הפטיש מתחיל בגריפ (בראשית, ידית על y, הראש ב-y חיובי).
   ברירת מחדל (התקפה, מוות, כל השאר): pos [0,0,0], rot [0,-1,0,0] (כמו הפטיש של #552). במשפחות idle/run הידית מורמת לאחור מעל הכתף, בכיוון בחזית הדמות (-x ימין, +z קדימה).
   כל רשומה נפתרת ב-tools/tankx/carry.js מהכיוון הרצוי וממצב העצם בזמן הייחוס, ולכן תקפה רק לקליפ הזה. */
const RETARGET={
  /* ratios(modelScene, refScene): גורם לכל עצם ששמה משותפת. שני הארגומנטים הם scene שנטען עם GLTFLoader (בלי sanitize ידני: השמות כמו שנטענו) */
  ratios(model,ref){
    const rl={};ref.traverse(o=>{if(o.isBone)rl[o.name]=o.position.length()});
    const f={};model.traverse(o=>{if(o.isBone&&rl[o.name]>1e-4)f[o.name]=o.position.length()/rl[o.name]});
    return f},
  /* apply(clip, ratios): מחזיר AnimationClip חדש. רק רצועות '<עצם>.position'; רצועות בלי גורם נשארות */
  apply(clip,f){
    const tr=clip.tracks.map(t=>{const i=t.name.lastIndexOf('.'),bone=t.name.slice(0,i),prop=t.name.slice(i+1);
      if(prop!=='position'||!(bone in f))return t;const v=t.values.slice();for(let k=0;k<v.length;k++)v[k]*=f[bone];
      return new THREE.VectorKeyframeTrack(t.name,t.times,v)});
    return new THREE.AnimationClip(clip.name,clip.duration,tr)},
  /* applyRotOnly(clip): למודל שכיוון התרגומים המקומיים שלו שונה מ-KayKit (שלד שנבנה מהרשת עצמה, כמו הנודד): זורקים את כל רצועות position חוץ מ-hips (שגובהו מוכפל ב-f_hips כמו ב-apply).
     העצמות שומרות על אורכי המנוחה שלהן. המחיר: אין תזוזה של עצמות מלבד ה-hips (מספיק לריצה והתקפה, פחות למוות). */
  applyRotOnly(clip,f){
    const tr=clip.tracks.filter(t=>!(t.name.endsWith('.position')&&t.name.split('.')[0]!=='hips'));return RETARGET.apply(new THREE.AnimationClip(clip.name,clip.duration,tr),f)},
  report(f){const e=Object.entries(f).sort((a,b)=>a[1]-b[1]);return {min:e[0],max:e[e.length-1],count:e.length}}
};
/* הטבלה של הפטיש (נפתרה ב-9.11.2026 על TankX.glb; rot הוא quaternion [x,y,z,w] מקומי לעצם handslotr). משפחות: idle ו-run מורמים, השאר ברירת המחדל */
const TANKX={
  hammerProp:'w_item_tankXHammer',bone:'handslotr',
  carry:{
    default:{pos:[0,0,0],rot:[0,-1,0,0]},
    Idle_A:{pos:[0,0,0],rot:[-0.5998,0.4684,0.6176,0.1985]},
    Running_B:{pos:[0,0,0],rot:[-0.6369,0.2983,0.6826,0.1987]}
  },
  /* הקליפים שבודקים לכל מודל (tools/tankx/verify.js) */
  verifyClips:['Idle_A','Running_B','Melee_2H_Attack_Chop','Death_A','Hit_A','Melee_2H_Idle','Jump_Idle','Taunt']
};

/* הנודד (wandererX): מטה על handslotl. ברירת מחדל = ההרכבה בתנוחת הבסיס של המודל; Idle_A ו-Running_B פתורים כך שהמטה אנכי (נפתר ב-9.11.2026) */
const WANDERX={
  staffProp:'w_item_wandererXStaff',bone:'handslotl',rotOnly:true,verifyClips:TANKX.verifyClips,
  carry:{default:{pos:[0.0608, 0.0164, 0.0389],rot:[-0.1576, 0.343, 0.3175, -0.8699]},Idle_A:{pos:[0.0608, 0.0164, 0.0389],rot:[-0.5443, -0.5786, -0.4065, 0.4514]},Running_B:{pos:[0.0608, 0.0164, 0.0389],rot:[-0.067, -0.6897, -0.1512, 0.705]}}
};
