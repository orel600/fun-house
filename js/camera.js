/* המצלמה לפי המקום (ניר, 1.11.2026: "המצלמה צריכה להיות יותר מגבוהה").
   כמה רחוק (VIEW.zoom) ובאיזו זווית (VIEW.tilt) בכל מקום, ב-render3d.js. כאן רק מי קורא להם, והבחירה של השחקן.
   כמו ב-ARPG בטלפון (Diablo Immortal, Torchlight, Archero): מצלמה גבוהה שרואה הרבה מסביב, ואפשר לקרב אם הדמות קטנה מדי.
   steps: מכפיל על VIEW.zoom בעולם ובכפר. מעל 1 = קרוב יותר. הזירה לא מושפעת (התחום של אוראל). נשמר בטלפון (zm-cam). */
const CAM={steps:{near:1.2,mid:1,far:0.85},def:'mid',cur:'mid'};
try{const v=localStorage.getItem('zm-cam');if(CAM.steps[v])CAM.cur=v}catch(e){}

const camPlace=()=>S&&S.vil?'village':S&&S.wd?'world':'arena';
function camZoom(){const p=camPlace();return p==='arena'?1:VIEW.zoom[p]*CAM.steps[CAM.cur]}
function camTilt(){return (VIEW.tilt[typeof S!=='undefined'?camPlace():'arena']||VIEW.tilt.arena)*Math.PI/180}
function setCam(k){if(!CAM.steps[k])return;CAM.cur=k;try{localStorage.setItem('zm-cam',k)}catch(e){}showCam()}
function showCam(){for(const b of document.querySelectorAll('[data-cam]'))b.setAttribute('aria-pressed',String(b.dataset.cam===CAM.cur))}
for(const b of document.querySelectorAll('[data-cam]'))b.onclick=()=>setCam(b.dataset.cam);
showCam();
