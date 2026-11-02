/* המצלמה לפי המקום (ניר, 1.11.2026: "המצלמה צריכה להיות יותר מגבוהה").
   כמה רחוק (VIEW.zoom) ובאיזו זווית (VIEW.tilt) בכל מקום, ב-render3d.js. כאן רק מי קורא להם, והבחירה של השחקן.
   כמו ב-ARPG בטלפון (Diablo Immortal, Torchlight, Archero): מצלמה גבוהה שרואה הרבה מסביב, ואפשר לקרב אם הדמות קטנה מדי.
   steps: מכפיל על VIEW.zoom בעולם ובכפר. מעל 1 = קרוב יותר. הזירה לא מושפעת (התחום של אוראל). נשמר בטלפון (zm-cam).
   angs: הזווית (ניר, 2.11.2026: "הכובע מפריע... הייתי רוצה יותר זווית"). מעלות שמוסיפים ל-VIEW.tilt בעולם ובכפר:
   נמוכה = רואים פנים וגוף, מלמעלה = המצלמה של לפני 2.11. נשמר בטלפון (zm-ang).
   השטח שרואים על המסך לא משתנה עם הזווית (המצלמה אורתוגרפית): רק הדמויות והעצים נראים יותר מהצד. */
const CAM={steps:{near:1.2,mid:1,far:0.85},def:'mid',cur:'mid',angs:{low:-8,mid:0,top:18},ang:'mid'};
try{const v=localStorage.getItem('zm-cam');if(CAM.steps[v])CAM.cur=v}catch(e){}
try{const v=localStorage.getItem('zm-ang');if(v in CAM.angs)CAM.ang=v}catch(e){}

const camPlace=()=>S&&S.vil?'village':S&&S.wd?'world':'arena';
function camZoom(){const p=camPlace(),k=typeof skrZoom==='function'?skrZoom():1;return p==='arena'?1:VIEW.zoom[p]*CAM.steps[CAM.cur]*k}   // skrZoom: רגע גילוי של סקיל (skillreveal.js)
function camTilt(){const p=typeof S!=='undefined'?camPlace():'arena';return ((VIEW.tilt[p]||VIEW.tilt.arena)+(p==='arena'?0:CAM.angs[CAM.ang]))*Math.PI/180}
// כמה רחוק קצה המסך מהמרכז בכיוון a (רדיאנים), ביחידות של המשחק. לאויבים שצריכים להופיע ממש מחוץ למסך (pacing.js)
function camEdge(a){const c=Math.abs(Math.cos(a)),s=Math.abs(Math.sin(a));return Math.min(c>1e-3?W/2/c:1e9,s>1e-3?H/2/s:1e9)}
function setCam(k){if(!CAM.steps[k])return;CAM.cur=k;try{localStorage.setItem('zm-cam',k)}catch(e){}showCam()}
function setAng(k){if(!(k in CAM.angs)||k===CAM.ang)return;CAM.ang=k;try{localStorage.setItem('zm-ang',k)}catch(e){}camRebuild();showCam()}
// הכפר והעולם בתלת-ממד נבנים פעם אחת, במיקום שתלוי בזווית (y/sin). זווית חדשה: זורקים אותם, והם נבנים מחדש בפריים הבא
function camRebuild(){if(typeof R3D==='undefined'||!R3D.scene)return;
  if(R3D.vil){R3D.scene.remove(R3D.vil.g);R3D.vil=null}
  for(const k in R3D.wlds||{})R3D.scene.remove(R3D.wlds[k].g);R3D.wlds={}}
function showCam(){for(const b of document.querySelectorAll('[data-cam]'))b.setAttribute('aria-pressed',String(b.dataset.cam===CAM.cur));
  for(const b of document.querySelectorAll('[data-ang]'))b.setAttribute('aria-pressed',String(b.dataset.ang===CAM.ang))}
for(const b of document.querySelectorAll('[data-cam]'))b.onclick=()=>setCam(b.dataset.cam);
for(const b of document.querySelectorAll('[data-ang]'))b.onclick=()=>setAng(b.dataset.ang);
showCam();
