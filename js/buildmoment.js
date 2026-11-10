/* רגע הבנייה בכפר (ניר, 10.11.2026: "לא קיבלתי את הכפר, לא רואים בו שינוי וצמיחה").
   כשמבנה נבנה או עולה רמה: החלון נסגר, המצלמה נוסעת אל המבנה, המראה הישן שוקע באדמה, פיגום עולה עם אבק וחגיגה (celebrate ב-fx.js),
   המראה החדש קופץ, שורה קצרה "לפני → אחרי", והמצלמה חוזרת לגיבור והחלון נפתח שוב. נגיעה בכל מקום מדלגת.
   הפחתת תנועה (calmOn ב-arena-feel.js): בלי מצלמה ובלי קפיצות, רק הפיגום והחגיגה כמו קודם, והשורה. בלי עצירת זמן (hitstop).
   חיבור: bmStart מ-vUpgrade (village.js). עוטף מבחוץ את vLook (איזה מראה לצייר), giantCam (לאן המצלמה מסתכלת, main.js) ו-syncVillage (גובה וגודל בתלת-ממד) */
const BUILDM={
  pan:0.7,      // שניות: המצלמה נוסעת אל המבנה
  sink:0.45,    // המראה הישן שוקע (לא בבנייה ראשונה, אין מה להשקיע)
  rise:0.75,    // הפיגום עולה מהאדמה, עם האבק של החגיגה
  pop:0.4,      // המראה החדש קופץ: גדל מעבר לגודל וחוזר
  hold:1.3,     // מסתכלים על התוצאה, עם השורה "לפני → אחרי"
  back:0.6,     // המצלמה חוזרת לגיבור
  // מרכז הכפר: אחרי "לפני → אחרי" המצלמה מתרחקת ומראה את כל הכפר שגדל (vgrowth.js, ניר 10.11.2026), עם ניצוץ על מה שנוסף
  ovIn:0.6,ovHold:1.5,ovOut:0.6,overZoom:0.36,overAt:{x:0,y:-20},zoomStep:0.02,
  lift:0.3,     // כמה רדיוסים מעל מרכז המבנה המצלמה מסתכלת, כדי שגם הגג ייכנס
  popMax:1.14,  // הגודל בשיא הקפיצה
  shake:6,      // רעידה קטנה כשהמבנה החדש נוחת (לא בהפחתת תנועה)
  guard:0.2,    // שניות בהתחלה שבהן נגיעה לא מדלגת (הלחיצה על כפתור השדרוג עצמה)
  lineFor:2.4,  // כמה שניות השורה "לפני → אחרי" נשארת (כתובית משלה, #bmLine, ולא בתור ההודעות, שבו היא יכלה ללכת לאיבוד)
  log:[]        // לבדיקה (tools/check.js): כל רגע שהתחיל ואיך נגמר
};
// ה-calm של הזירה, או של הטלפון
const bmCalm=()=>typeof calmOn==='function'&&calmOn();
// השלב עכשיו ו-k בתוכו (0..1). null כשאין רגע פעיל
function bmPhase(m){
  const t=fxNow()-m.t0,seq=[['pan',BUILDM.pan],['sink',m.from?BUILDM.sink:0],['rise',BUILDM.rise],['pop',BUILDM.pop],['hold',BUILDM.hold],
    ...(m.k==='center'?[['ovIn',BUILDM.ovIn],['over',BUILDM.ovHold],['ovOut',BUILDM.ovOut]]:[]),['back',BUILDM.back]];
  let a=0;for(const [n,d] of seq){if(t<a+d)return{n,k:d?(t-a)/d:1,t};a+=d}
  return{n:'end',k:1,t};
}
// המראה של מבנה ברמה L (כמו vLook, בלי המצב של עכשיו)
function bmLookAt(k,L){
  if(!L)return null;const look=VILLAGE.b[k].look;let band=look[0];for(const b of look)if(L>=b.at)band=b;
  return{...band,size:band.scale*(1+VILLAGE.grow*(L-band.at)),L};
}
// הכתובית "לפני → אחרי" באמצע למעלה. נעלמת לבד
function bmShowLine(txt){
  let el=$('bmLine');if(!el){el=document.createElement('div');el.id='bmLine';document.body.appendChild(el)}
  el.textContent=txt;el.hidden=false;el.classList.remove('on');void el.offsetWidth;el.classList.add('on');
  clearTimeout(bmShowLine.t);bmShowLine.t=setTimeout(()=>{el.classList.remove('on');el.hidden=true},BUILDM.lineFor*1000);
}
const bmName=lk=>lk?T('bm.m.'+lk.model):T('bm.empty');
// השורה "לפני → אחרי": מראה אחר = שני השמות, אותו מראה = שתי הרמות
function bmLine(k,from,to){
  const a=bmLookAt(k,from),b=bmLookAt(k,to);
  return a&&b&&a.model===b.model?T('bm.same',T('vil.'+k),bmName(b),from,to):T('bm.line',T('vil.'+k),bmName(a),bmName(b));
}

// מ-vUpgrade, אחרי שהרמה כבר נשמרה. from: הרמה הקודמת
function bmStart(k,from){
  const V=S.vil,B=VILLAGE.b[k],to=vLv(k);if(!V)return;
  if(V.bm)bmEnd(true);
  const rec={k,from,to,calm:bmCalm(),end:''};BUILDM.log.push(rec);
  if(rec.calm){   // כמו קודם: אבק ופיגום במקום, ואז פרץ ו-+1. בלי מצלמה ובלי רעידה
    const dust=celebrate(B.x,B.y,'upgrade','+1');V.raise[k]=fxNow()+dust;
    bmShowLine(bmLine(k,from,to));rec.end='calm';return}
  V.bm={k,from,to,t0:fxNow(),fx:false,open:V.open===k,rec};
  V.open=null;villageHud();   // החלון נסגר כדי שיראו את המבנה, ונפתח שוב בסוף
}
// סוף הרגע. skip: נגיעה דילגה (החגיגה והשורה בכל זאת מגיעות). בשני המקרים חוזרים לחלון שממנו שדרגו
// (לא אחרי בנייה ראשונה: אז החגיגה של firstup.js על הגיבור באה מיד אחרי, והחלון היה נפתח ונסגר)
function bmEnd(skip){
  const V=S&&S.vil,m=V&&V.bm;if(!m)return;
  const B=VILLAGE.b[m.k];
  if(!m.fx){celebrate(B.x,B.y,'upgrade','+1');m.fx=true}
  if(!m.line){m.line=true;bmShowLine(bmLine(m.k,m.from,m.to))}
  V.bm=null;bmRestore(m.k);m.rec.end=skip?'skip':'done';
  if(m.from&&m.open&&!V.open&&$('npcDlg').hidden&&S.mode==='play'){V.open=V.near=m.k;V.ui='';villageHud()}
}
// כל פריים (מ-giantCam, שנקרא בכל פריים של משחק): מתקדמים בשלבים
function bmTick(){
  const m=S&&S.vil&&S.vil.bm;if(!m)return null;
  const p=bmPhase(m),B=VILLAGE.b[m.k];
  if(!m.fx&&(p.n==='rise'||p.n==='pop'||p.n==='hold'||p.n==='back')){m.fx=true;celebrate(B.x,B.y,'upgrade','+1')}   // האבק של החגיגה הוא הפיגום שעולה
  if(!m.line&&(p.n==='hold'||p.n==='back')){m.line=true;bmShowLine(bmLine(m.k,m.from,m.to));S.shake=Math.max(S.shake,BUILDM.shake)}
  if(!m.spark&&p.n==='over'){m.spark=true;   // מבט העל: ניצוץ על התוספות של הרמה החדשה
    if(typeof vgNew==='function')vgNew(m.to).filter(it=>it.m!=='v_crate'&&it.m!=='v_barrel'&&it.m!=='vx_sack').slice(0,VGROW.spark).forEach(it=>celebrate(it.x,it.y,'quest',''))}
  if(p.n==='end'){bmEnd(false);return null}
  return p;
}
const bmEase=k=>k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;

// נגיעה בכל מקום מדלגת. capture: הנגיעה לא מגיעה גם לג'ויסטיק או למבנה
function bmSkipEv(e){
  const m=S&&S.vil&&S.vil.bm;if(!m||S.mode!=='play'||fxNow()-m.t0<BUILDM.guard)return;   // מסך אחר פתוח (ציוד, נפחייה): הנגיעה שלו
  e.preventDefault();e.stopPropagation();bmEnd(true);
}
addEventListener('pointerdown',bmSkipEv,true);
addEventListener('keydown',bmSkipEv,true);

/* ---- עטיפות ---- */
// איזה מראה לצייר: לפני הקפיצה עדיין הישן, בזמן העלייה פיגום (null), ואחר כך החדש
{const base=vLook;vLook=function(k){
  const m=S&&S.vil&&S.vil.bm;if(!m||m.k!==k)return base(k);
  const n=bmPhase(m).n;
  if(n==='pan'||n==='sink')return bmLookAt(k,m.from);
  if(n==='rise')return null;
  return base(k);
}}
// המצלמה: מהגיבור אל המבנה ובחזרה. main.js מוסיף את זה למיקום של הגיבור
{const base=giantCam;giantCam=function(){
  const p=bmTick();if(!p)return base();
  const m=S.vil.bm,B=VILLAGE.b[m.k],f=p.n==='pan'?bmEase(p.k):p.n==='back'?1-bmEase(p.k):1,o=bmOver(p),O=BUILDM.overAt;
  const tx=B.x+(O.x-B.x)*o,ty=B.y-B.r*BUILDM.lift+(O.y-B.y+B.r*BUILDM.lift)*o;
  return{x:(tx-P.x)*f,y:(ty-P.y)*f};
}}
// כמה מבט העל עכשיו (0..1)
function bmOver(p){return p.n==='ovIn'?bmEase(p.k):p.n==='over'?1:p.n==='ovOut'?1-bmEase(p.k):0}
// הזום: מתרחקים במבט העל, בקפיצות קטנות (כל שינוי מחשב מחדש את הקנבס, כמו הזום בקרב ב-camera.js)
{const base=camZoom;camZoom=function(){
  const m=typeof S!=='undefined'&&S&&S.vil&&S.vil.bm;if(!m||m.k!=='center')return base();
  const o=bmOver(bmPhase(m));if(!o)return base();
  const z=1-(1-BUILDM.overZoom)*o;return base()*Math.round(z/BUILDM.zoomStep)*BUILDM.zoomStep;
}}
// בתלת-ממד: הישן שוקע, הפיגום עולה מהאדמה, החדש קופץ. בדו-ממד רק המראה מתחלף (דרך vLook)
function bmMeshes(k){const V=R3D.vil;return V&&V.b[k]?V.b[k].all:[]}
function bmBase(o){const u=o.userData;if(u.bmY==null){u.bmY=o.position.y;u.bmS=o.scale.x;u.bmH=new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()).y||1}return u}
function bmRestore(k){for(const o of bmMeshes(k)){const u=o.userData;if(u.bmY==null)continue;o.position.y=u.bmY;o.scale.setScalar(u.bmS)}}
if(typeof syncVillage==='function'){const base=syncVillage;syncVillage=function(){
  base();
  const m=S&&S.vil&&S.vil.bm;if(!m)return;
  const p=bmPhase(m);
  for(const o of bmMeshes(m.k)){const u=bmBase(o);let dy=0,s=1;
    if(p.n==='pan')dy=m.from?0:-u.bmH;                      // בנייה ראשונה: הפיגום עוד מתחת לאדמה
    else if(p.n==='sink')dy=-u.bmH*bmEase(p.k);
    else if(p.n==='rise')dy=-u.bmH*(1-bmEase(p.k));
    else if(p.n==='pop')s=p.k<0.6?0.6+(BUILDM.popMax-0.6)*(p.k/0.6):BUILDM.popMax-(BUILDM.popMax-1)*((p.k-0.6)/0.4);
    o.position.y=u.bmY+dy;o.scale.setScalar(u.bmS*s)}
}}
