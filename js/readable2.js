/* קריאות שלב 2 בקרב צפוף בעולם (READ2, ניר 9.11 ו-10.11.2026: "חד אבל קריא", צילום מהטלפון ברמה 36).
   המטרה: הגיבור והסכנה תמיד נקראים בקרב צפוף.
   1. מסלול מעל הראש: אזהרה אחת בכל פעם ("Step out!", "Now!" של skillteach.js) בכדור כהה עם מסגרת בצבע משלה,
      מצוירת אחרונה (אחרי הפגיעות, המספרים והאזהרות על הרצפה), כך ששום אפקט לא עולה עליה. החשובה מנצחת (סכנה > עכשיו > מידע).
   2. מספרי נזק: לא על גוף הגיבור ולא על המסלול שמעליו. מספר שנופל שם זז הצידה, לצד של האויב.
      לכל היותר READ2.nums.cap מספרים ליד הגיבור (הוותיק נזרק, קריטי נשאר), ובקרב צפוף מכות באותו אויב מתמזגות בחלון ארוך יותר.
   3. שמות (labels.js): בקרב השם המלא היחיד (המטרה, בוס, עלית) מלא, והשאר עמומים יותר. השמות לא עולים על השלטים של השערים ולא על המסלול מעל הגיבור.
   4. כרטיס "New: <אויב>" (foelore.js) וההודעות הגדולות (msglane.js) מחכים עד שהקרב נרגע READ2.calm שניות (בלי הבהוב כשאויב יוצא לרגע מהטווח), ואחרי READ2.cardWait מופיעים בכל זאת.
   רק בעולם. בזירה (של אוראל) לא משתנה כלום. הפחתת תנועה: בלי פעימה.
   חיבור: עוטף מבחוץ את juiceHit ו-fxcTgDraw (ציור המסלול, פעם בפריים), flCardVis ו-msgFight לשאלה "יש קרב".
   skillteach.js שולח את התווית ל-r2Head, labels.js קורא ל-r2Fixed ול-r2LblA, ו-world.js רושם את השלטים ב-r2Fix.
   מחיקה: הקובץ, השורה ב-index.html, ושלוש השורות שקוראות לכאן (כולן עם typeof, אז גם בלי הקובץ הכל עובד כמו קודם) */
const READ2={
  on:true,
  head:{up:46,size:15,padX:9,h:21,line:2,bg:'rgba(20,6,22,0.9)',
    col:{danger:'#FF4FD8',now:'#F4C74F',info:'#EDE8DA'},   // סכנה: מג'נטה כמו האזהרות על הרצפה (FXC.tg.col), אבל על רקע כהה משלה
    pri:{danger:3,now:2,info:1}},
  // מספרי נזק. hero: התיבה של הגיבור והמסלול מעליו (יחידות משחק): חצי רוחב, כמה למעלה מהרגליים, כמה למטה
  nums:{near:120,cap:4,hero:{w:24,lane:62,up:64,down:14},gapX:6,crowd:6,crowdR:220,merge:0.4,mergeCrowd:0.65},
  lbl:{full:1,dim:0.32},   // בקרב: השם המלא (המטרה/החשוב) בלי שקיפות, והשאר עמומים יותר מ-LABELS.fight.a
  calm:0.35,               // כמה שניות בלי קרב עד שכרטיס או הודעה גדולה מופיעים
  cardWait:30,             // אחרי כמה שניות של קרב רצוף הכרטיס מופיע בכל זאת
  stat:{head:0,headDanger:0,headOver:0,numPush:0,numStack:0,numCap:0,numOnHero:0,cardHeld:0,cardShown:0,lblDim:0,lblFix:0,bigHeld:0,crowd:0}
};
const R2={want:null,fix:[],fightT:-9,fight:false,crowd:0,fr:-1};
const r2On=()=>READ2.on&&!!S&&!!S.wd&&!S.mb;
const r2Now=()=>performance.now()/1000;
const r2Calm=()=>typeof calmOn==='function'?calmOn():(typeof RM!=='undefined'&&RM);

/* ---- מצב הקרב, פעם בפריים ---- */
function r2Frame(){
  R2.fix.length=0;if(!r2On())return;
  const f=typeof msgFight==='function'?msgFight():false;R2.fight=f;if(f)R2.fightT=r2Now();
  let n=0;const N=READ2.nums,r=N.crowdR;
  if(f&&typeof enemies!=='undefined')for(const e of enemies)if(!e.dead&&Math.abs(e.x-P.x)<r&&Math.abs(e.y-P.y)<r)n++;
  R2.crowd=n;const crowd=n>=N.crowd;if(crowd)READ2.stat.crowd++;
  if(typeof JUICE!=='undefined')JUICE.nums.merge=crowd?N.mergeCrowd:N.merge;
}
// הקרב נרגע: אין אויב קרוב כבר READ2.calm שניות
function r2Quiet(){const f=typeof msgFight==='function'&&msgFight();R2.fight=f;if(f)R2.fightT=r2Now();return !f&&r2Now()-R2.fightT>=READ2.calm}   // msgFight (לא העותק): מה שהעמודה עצמה חושבת

/* ---- 1. המסלול מעל הראש ---- */
// skillteach.js קורא בכל פריים עם התווית שהוא רוצה. החשובה בפריים מנצחת, ורק היא מצוירת
function r2Head(key,kind,a){
  if(!r2On())return false;const p=READ2.head.pri[kind]||0;
  if(!R2.want||p>R2.want.p)R2.want={key,kind,p,a:a==null?1:a};
  return true;
}
// התיבה של המסלול (קואורדינטות העולם), בשביל המספרים והשמות
function r2HeadBox(){const H=READ2.head,y=P.y-(P.r||14)-H.up;return{x:P.x,y,t:y-H.h+5,b:y+6}}
function r2HeadDraw(){
  const w=R2.want;R2.want=null;if(!w||!r2On())return;
  const H=READ2.head,col=H.col[w.kind]||H.col.info,b=r2HeadBox(),txt=T(w.key);
  const pulse=w.kind==='now'&&!r2Calm()?1+0.06*Math.sin(r2Now()*14):1;
  ctx.save();ctx.globalAlpha=Math.max(0.6,Math.min(1,w.a));ctx.textAlign='center';ctx.direction='ltr';
  ctx.font='800 '+Math.round(H.size*pulse)+'px Heebo,system-ui,sans-serif';
  const tw=ctx.measureText(txt).width+H.padX*2,h=H.h*pulse;
  ctx.fillStyle=H.bg;ctx.strokeStyle=col;ctx.lineWidth=H.line;
  ctx.beginPath();ctx.roundRect(b.x-tw/2,b.y-h+5,tw,h,h/2);ctx.fill();ctx.stroke();
  ctx.fillStyle=col;ctx.fillText(txt,b.x,b.y);ctx.restore();
  const st=READ2.stat;st.head++;if(w.kind==='danger')st.headDanger++;
}

/* ---- 2. מספרי נזק ---- */
function r2HeroHit(f){   // האם המספר (קו הבסיס y, גובה size) נופל על הגיבור או על המסלול מעליו
  const Hb=READ2.nums.hero,tw=f.txt.length*f.size*0.32+4,top=P.y-(P.r||14)-Hb.up,bot=P.y+Hb.down,lane=P.y-(P.r||14)-READ2.head.up+8;
  if(f.y<=top||f.y-f.size>=bot)return false;
  return Math.abs(f.x-P.x)<(f.y-f.size<lane?Hb.lane:Hb.w)+tw;   // למעלה: רוחב הכדור של האזהרה. למטה: רוחב הגוף
}
function r2Num(e){
  const J=S.jc;if(!J||!J.n.length)return;const N=READ2.nums,st=READ2.stat;
  let f=null;for(let i=J.n.length-1;i>=0;i--)if(J.n[i].e===e){f=J.n[i];break}
  if(!f)return;
  // "Resists" זהה מאויב קרוב: אחד מספיק (מרענן את הקיים במקום עוד שורה)
  if(f.res)for(const g of J.n)if(g!==f&&g.res&&g.txt===f.txt&&Math.hypot(g.x-f.x,g.y-f.y)<N.near){g.t0=f.t0;J.n.splice(J.n.indexOf(f),1);st.numCap++;return}
  // לא על הגיבור: הצידה, לצד שבו האויב (או לצד שהמספר כבר נוטה אליו)
  if(r2HeroHit(f)){const side=Math.sign(e.x-P.x)||(f.dx>=0?1:-1),tw=f.txt.length*f.size*0.32+4,hw=f.y-f.size<P.y-(P.r||14)-READ2.head.up+8?N.hero.lane:N.hero.w;
    f.x=P.x+side*(hw+tw+N.gapX);f.dx=Math.abs(f.dx)*side;st.numPush++}
  // לא אחד על השני: מספר שעולה על מספר אחר עולה מעליו (עד 3 פעמים), כך שבקבוצה הם נפרשים מעל האויבים
  const tw=f.txt.length*f.size*0.32+4;
  for(let k=0;k<3;k++){let c=null;for(const g of J.n)if(g!==f&&Math.abs(g.x-f.x)<tw+g.txt.length*g.size*0.32+4&&Math.abs(g.y-f.y)<(f.size+g.size)*0.5){c=g;break}
    if(!c)break;f.y=c.y-(f.size+c.size)*0.55-3;st.numStack++;if(r2HeroHit(f)){const side=Math.sign(f.x-P.x)||1;f.x=P.x+side*(N.hero.lane+tw+N.gapX)}}
  // תקרה ליד הגיבור: הוותיק שאינו קריטי נזרק
  let near=0;for(const g of J.n)if(Math.hypot(g.x-P.x,g.y-P.y)<N.near)near++;
  while(near>N.cap){let k=-1;for(let i=0;i<J.n.length;i++){const g=J.n[i];if(g!==f&&!g.crit&&Math.hypot(g.x-P.x,g.y-P.y)<N.near){k=i;break}}
    if(k<0)break;J.n.splice(k,1);near--;st.numCap++}
}
// לבדיקה: כמה מספרים יושבים עכשיו על הגיבור (צריך להיות 0)
function r2NumsOnHero(){const J=S&&S.jc;if(!J)return 0;let n=0;for(const f of J.n)if(r2HeroHit(f))n++;return n}

/* ---- 3. שמות ---- */
// השקיפות של שם בקרב (labels.js): המלא (החשוב/המטרה) מלא, השאר עמומים
function r2LblA(full){if(!r2On())return null;if(!full)READ2.stat.lblDim++;return full?READ2.lbl.full:READ2.lbl.dim}
// מקומות תפוסים שהשמות לא עולים עליהם (פיקסלים של מסך, כמו ב-lblFlush): שלטים של שערים והמסלול מעל הגיבור
function r2Fix(x,y,w,h){if(r2On())R2.fix.push({l:x*ZOOM,r:(x+w)*ZOOM,t:y*ZOOM,b:(y+h)*ZOOM,fix:1})}
function r2Fixed(){
  const out=R2.fix;R2.fix=[];if(!r2On()||!S.cam)return out;
  const z=ZOOM||1,ox=W/2-S.cam.x,oy=H/2-S.cam.y,b=r2HeadBox(),hw=READ2.nums.hero.lane;
  out.push({l:(b.x+ox-hw)*z,r:(b.x+ox+hw)*z,t:(b.t+oy)*z,b:(P.y+READ2.nums.hero.down+oy)*z,fix:1});READ2.stat.lblFix+=out.length;   // המסלול וגוף הגיבור
  return out;
}

/* ---- חיבורים ---- */
{const o=juiceHit;juiceHit=function(e){if(typeof JUICE!=='undefined')JUICE.nums.merge=r2On()&&R2.crowd>=READ2.nums.crowd?READ2.nums.mergeCrowd:READ2.nums.merge;   // בכפר ובזירה: הרגיל
  const r=o.apply(this,arguments);if(r&&r2On())try{r2Num(e)}catch(_){}return r}}
if(typeof fxcTgDraw==='function'){const o=fxcTgDraw;fxcTgDraw=function(){const r=o.apply(this,arguments);try{r2Frame();r2HeadDraw()}catch(_){}return r}}
// "יש קרב" לעמודת ההודעות: הגדולה מחכה עד שהקרב באמת נרגע (ולא מהבהבת כשאויב יוצא לרגע מהטווח)
var msgFight0=typeof msgFight==='function'?msgFight:null;
if(msgFight0&&typeof msgBig==='function'){const ob=msgPump;msgPump=function(){
  const hold=r2On()&&MQ.big.length&&!MQ.bigRow&&!r2Quiet()&&!msgFight();
  if(hold){READ2.stat.bigHeld++;const keep=MQ.big;MQ.big=[];try{return ob.apply(this,arguments)}finally{MQ.big=keep.concat(MQ.big)}}
  return ob.apply(this,arguments)}}
// כרטיס פגישה ראשונה: מחכה לסוף הקרב, והזמן שלו לא רץ בינתיים
if(typeof flCardVis==='function'){const o=flCardVis;flCardVis=function(){
  if(r2On()&&FLC.on){const el=$('flCard');
    if(el&&el.hidden){FLC.w=FLC.w||r2Now();
      if(!r2Quiet()&&r2Now()-FLC.w<READ2.cardWait){READ2.stat.cardHeld++;return false}}}   // כבר על המסך: נשאר עד הסוף, בלי הבהוב
  const r=o.apply(this,arguments);if(r&&FLC.on&&!FLC.r2){FLC.r2=1;READ2.stat.cardShown++}
  return r}
  const on=flCardNext;flCardNext=function(){FLC.w=0;FLC.r2=0;return on.apply(this,arguments)}}
