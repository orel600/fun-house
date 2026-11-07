/* ספריית האפקטים של המשחק (אוראל, 7.11.2026): גיליונות מחבילות Mochi Lab שנקנו.
   הכלל: כל אפקט חדש מחפשים קודם כאן (FXDATA, tools/fx-list.json), ובונים בעצמנו רק אם אין מתאים.
   הקבצים: fx/<id>.webp (מוקטנים ב-tools/fx-convert.py). המידע לכל אפקט ב-FXDATA (js/fx-data.js): c עמודות, r שורות, n פריימים, s גודל פריים.
   שימוש, מכל מקום במשחק:
     fxPlay(id,x,y,{size,rot,loop,dur,follow,alpha,add,fps,flip,under,sx})  אפקט בנקודה של העולם (מעל התלת-ממד, באותו מקום כמו הקנבס)
     fxUi(id,x,y,{...})       אפקט על המסך (פיקסלים של המשחק, כמו W,H): ממשק, חלונות, מעברים
     fxStop(h)                עוצר אפקט שחוזר (loop) או עוקב (follow)
   follow: יחידה עם x,y. האפקט זז איתה, ונעלם כשהיא מתה (dead) או כש-dur נגמר.
   sx: מתיחה לרוחב של התמונה (לפני הסיבוב), למשל קונוס צר יותר.
   add: true = הוספת אור (lighter), לאש, ברק וזוהר. under: true = מצויר לפני הדמויות (בדו-ממד), לטבעות על הרצפה.
   התמונות נטענות רק כשצריך (new Image עובד גם מ-file://). עד שנטענו, האפקט מדלג בשקט. בלי קבצים בכלל (בדיקה בלי fx/): המשחק רץ כרגיל.
   מגבלה: עד FXLIB.max אפקטים בעולם ו-maxUi במסך. כשמגיעים לגבול, הוותיק נזרק. */
const FXLIB={
  fps:30,          // פריימים בשנייה כברירת מחדל (24 פריימים = 0.8 שנ')
  max:70,maxUi:14, // כמה אפקטים בבת אחת, לטלפון
  base:'fx/',
  img:{},list:[],ui:[],bad:{},
};
// התמונה של אפקט: נטענת פעם אחת. null עד שהיא מוכנה
function fxImg(id){
  if(FXLIB.bad[id]||typeof FXDATA==='undefined'||!FXDATA[id])return null;
  let im=FXLIB.img[id];
  if(!im){im=FXLIB.img[id]=new Image();im.onerror=()=>{FXLIB.bad[id]=1};im.src=FXLIB.base+id+'.webp'}
  return im.complete&&im.naturalWidth?im:null;
}
const fxPreload=ids=>{for(const id of ids)fxImg(id)};   // לטעון מראש: כשנכנסים למקום, לפני שהאפקט צריך להופיע
const fxNowT=()=>performance.now()/1000;
function fxMake(id,x,y,o){
  const D=typeof FXDATA!=='undefined'&&FXDATA[id];if(!D)return null;
  fxImg(id);
  return{id,D,x,y,t0:fxNowT(),size:o.size||D.s,rot:o.rot||0,loop:!!o.loop,dur:o.dur||0,follow:o.follow||null,dx:o.dx||0,dy:o.dy||0,
    alpha:o.alpha??1,sx:o.sx||1,add:!!o.add,fps:o.fps||FXLIB.fps,flip:!!o.flip,under:!!o.under,vx:o.vx||0,vy:o.vy||0,on:true};
}
function fxPlay(id,x,y,o={}){const f=fxMake(id,x,y,o);if(!f)return null;FXLIB.list.push(f);if(FXLIB.list.length>FXLIB.max)FXLIB.list.shift();return f}
function fxUi(id,x,y,o={}){const f=fxMake(id,x,y,o);if(!f)return null;FXLIB.ui.push(f);if(FXLIB.ui.length>FXLIB.maxUi)FXLIB.ui.shift();return f}
function fxStop(f){if(f)f.on=false}
function fxClear(){FXLIB.list.length=0;FXLIB.ui.length=0}   // מעבר מקום: מנקים מה שנשאר
// פריים נוכחי, או -1 כשנגמר
function fxFrame(f,now){
  if(!f.on)return -1;const age=now-f.t0;
  if(f.dur&&age>f.dur)return -1;
  if(f.follow&&(f.follow.dead||f.follow.gone))return -1;
  const i=Math.floor(age*f.fps);
  if(f.loop||f.dur)return i%f.D.n;
  return i<f.D.n?i:-1;
}
function fxDrawList(list,under){
  if(!list.length)return;
  const now=fxNowT();let j=0;
  ctx.save();
  for(const f of list){
    const i=fxFrame(f,now);if(i<0)continue;list[j++]=f;
    if(under!==undefined&&f.under!==under)continue;
    const im=fxImg(f.id);if(!im)continue;
    const D=f.D,age=now-f.t0,x=(f.follow?f.follow.x:f.x)+f.dx+f.vx*age,y=(f.follow?f.follow.y:f.y)+f.dy+f.vy*age,s=f.size;
    if(list===FXLIB.list&&!fxSeen(x,y))continue;   // בערפל של משחקי השאול: לא מסגירים אויב נסתר
    ctx.globalAlpha=f.alpha;ctx.globalCompositeOperation=f.add?'lighter':'source-over';
    ctx.save();ctx.translate(x,y);if(f.rot)ctx.rotate(f.rot);if(f.flip)ctx.scale(-1,1);if(f.sx!==1)ctx.scale(f.sx,1);
    ctx.drawImage(im,(i%D.c)*D.s,Math.floor(i/D.c)*D.s,D.s,D.s,-s/2,-s/2,s,s);
    ctx.restore();
  }
  list.length=j;
  ctx.restore();
}
// משחקי השאול: אפקט במקום שהקבוצה שלי לא רואה לא מצויר (moba-vision.js)
const fxSeen=(x,y)=>!(typeof S!=='undefined'&&S&&S.mb)||typeof mbVisPt!=='function'||mbVisPt(x,y);
// נקרא מ-render() (ומ-mobaDraw) בקואורדינטות העולם. under=true: לפני הדמויות, false: אחרי, בלי: הכל
function fxDraw(under){fxDrawList(FXLIB.list,under)}
// נקרא מ-render() בקואורדינטות המסך
function fxDrawUi(){fxDrawList(FXLIB.ui)}
