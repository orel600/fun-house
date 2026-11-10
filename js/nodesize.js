/* מקורות משאבים גדולים ומרשימים בעולם (NODESIZE, ניר 10.11.2026: "המשאבים צריכים להיות גדולים, גדולים ומרשימים").
   רק בעולם הפתוח: הזירה של אוראל משתמשת באותם NODES.kinds ולא משתנה.
   vis: פי כמה המודל בתלת-ממד גדל, לפי הצורה (shape ב-NODES.kinds). המודל עצמו נשאר אותו מודל, כך שאין עוד ציורים לטלפון.
   hit: פי כמה הגבול שאי אפשר לעבור דרכו (n.r) גדל בעולם. סלע גדול שאפשר ללכת לתוכו נראה שבור, אבל עץ הוא גזע:
     הצמרת מעל הראש, והגבול נשאר כמו קודם, כדי שהשבילים בין החורשות יישארו פתוחים. הגבול הגדול נכנס גם לפיזור (wNodes ב-world.js),
     כך שמקורות לא עולים אחד על השני. הדו-ממד מצייר לפי n.r, אז גם הוא גדל.
   rare: מתכות יקרות וגבישים נושמים אור (pulse: כמה, hz: כמה מהר), כדי שרואים אותם מרחוק. כבוי בהפחתת תנועה.
   חיבורים: nzR ב-wNodes (world.js), nzBig3d ו-nzPulse ב-syncWorld (render3d.js) */
const NODESIZE={
  vis:{tree:1.45,bush:1.6,reed:1.5,rock:1.7,vein:1.7,crystal:1.75,chest:1.15},
  hit:{tree:1,bush:1.25,reed:1.1,rock:1.4,vein:1.4,crystal:1.4,chest:1.1},
  rare:{kinds:['silver','gold','mythril','tideRock','iceRock','emberRock','stormRock','voidRock'],pulse:0.6,hz:1.3},
  stat:{big:0,pulse:0}
};
const nzShape=k=>(NODES.kinds[k]||{}).shape;
// הרדיוס של מקור מסוג k בעולם
const nzR=k=>{const K=NODES.kinds[k];return K?Math.round(K.r*(NODESIZE.hit[K.shape]||1)):0};
// פעם אחת, כשהמודל נבנה (לפני gather3d, ששומר את הגודל המקורי)
function nzBig3d(n,m){if(m.userData.nz)return;m.userData.nz=1;const k=NODESIZE.vis[nzShape(n.kind)]||1;if(k!==1)m.scale.multiplyScalar(k);NODESIZE.stat.big++;
  if(NODESIZE.rare.kinds.includes(n.kind)){const L=[];m.traverse(o=>{if(o.isMesh&&o.material&&o.material.emissive&&o.material.emissive.getHex()){o.material.userData.em0=o.material.emissive.clone();L.push(o.material)}});if(L.length)m.userData.nzMats=L}}
// כל פריים: מתכת יקרה או גביש נושמים אור
function nzPulse(m){
  const L=m.userData.nzMats;if(!L||!m.visible)return;const R=NODESIZE.rare,k=typeof RM!=='undefined'&&RM?1:1+R.pulse*Math.sin(performance.now()/1000*R.hz*6.283);
  for(const x of L)x.emissive.copy(x.userData.em0).multiplyScalar(k);NODESIZE.stat.pulse++;
}
