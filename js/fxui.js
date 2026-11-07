/* אפקטים בממשק, בכל המשחק (אוראל, 7.11.2026: "אפקטים בכל מקום, גם בתפריטים"). האפקטים מספריית Mochi Lab (docs/fx.md).
   fxUi (fxlib.js) מצייר על הקנבס, ולכן מתחת לחלונות. כאן נגן קטן ב-HTML (fxDom) שמצייר מעל החלונות, באותם גיליונות.
   הכל כאן, כדי לא לגעת בקבצים של אחרים: מה קורה, ואיזה אפקט, בטבלאות בראש הקובץ.
   - FXUI.hooks: פונקציה קיימת במשחק → האפקט אחריה (עוטפים אותה פעם אחת בטעינה). קווסט, דרגה, קנייה, מתנה, טעינה.
   - FXUI.open: חלון שנפתח → אפקט סביבו. כל חלון ב-WINS גם נפתח בתנועה קצרה (0.18 שנ').
   - מעבר מקום (פתיחה, כפר, עולם, זירה, משחקי השאול): וילון שנעלם ב-FXUI.trans שניות, ואפקט ui_trans.
   - כפתורים: ui_juice על כפתור חשוב, ui_click על השאר, ui_hover רק עם עכבר. כפתורי הסקילים לא, יש להם אפקט משלהם.
   - נדירות: ui_epic / ui_legend חוזר סביב התמונה בכרטיס חפץ זהב או אגדי, כל עוד הכרטיס פתוח.
   שום דבר כאן לא חוסם נגיעה (pointer-events:none), ושום אפקט לא נשאר יותר מ-dur שלו. בלי קבצי fx/: מדלג בשקט.
   המראה ב-css/fxui.css. הבדיקה: FXUI.log (check.js קורא אותו). */
const FXUI={
  max:12,          // כמה אפקטים בבת אחת על המסך
  trans:0.35,      // מעבר מקום, בשניות (לכל היותר 0.4)
  win:0.18,        // פתיחת חלון, בשניות
  hover:56,click:64,juice:110,
  // כפתורים שמקבלים ui_juice (חשובים). השאר ui_click. ולא בכלל: כפתורי סקילים ותנועה
  important:'.go,.vbtn,.icbuy,.qr,.mtab,.updbtn',
  skip:'.skb,.sig,.spellb,.ult,.divine,.swap,.skills,#mbSk,#joy,.joy',
  // איפה מקשיבים לכפתורים: חלונות, תפריט, טור הקיצורים והסרגלים
  zone:'.win,.ov,#qRail,.bnav,#vTop,#menuRail,.qr,.gearbtn,.updbtn',
  // חלון שנפתח → אפקטים. at: 'win' = מרכז החלון, fit: גודל ביחס לחלון (במקום size)
  open:{
    ovDaily:[['globe_frame',{fit:1.15,loop:true}],['stars',{fit:0.9,loop:true,add:true}]],   // המתנה היומית: מסגרת קסם
    ovLevel:[['levelup',{size:300,add:true}]],                                              // עלית רמה בזירה
    ovWelcome:[['ui_new',{size:200}]],                                                      // "בזמן שלא היית"
  },
  rare:{gold:'ui_epic',legend:'ui_legend'},   // שכבת נדירות (GEAR.tiers) → האפקט סביב התמונה
  log:{},          // כמה פעמים כל סוג אפקט רץ (לבדיקה ב-check.js)
  list:[],raf:0,ready:false,lastTap:null,
};
// איפה על המסך: מרכז של אלמנט, ההודעה, או נקודת הנגיעה האחרונה
function fxuiRect(el){if(typeof el==='string')el=document.querySelector(el);if(!el||el.closest('[hidden]'))return null;const r=el.getBoundingClientRect();return r.width||r.height?r:null}
function fxuiAt(el){const r=fxuiRect(el);return r?{x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}:null}
const fxuiMid=()=>({x:innerWidth/2,y:innerHeight/2});
const fxuiBanner=()=>{const b=document.getElementById('banner');if(b&&b.classList.contains('on')){const r=b.getBoundingClientRect();return{x:innerWidth/2,y:r.top+r.height/2}}return{x:innerWidth/2,y:innerHeight*0.34}};
const fxuiTap=()=>FXUI.lastTap&&performance.now()-FXUI.lastTap.t<1500?FXUI.lastTap:fxuiBanner();
const fxuiBag=()=>fxuiAt('#gearBtnQ')||fxuiAt('#gearBtnRun')||fxuiAt('#gearBtn')||fxuiBanner();

function fxuiLayer(lo){
  const id=lo?'fxLayerLo':'fxLayer';let L=document.getElementById(id);
  if(!L){L=document.createElement('div');L.id=id;L.className='fxlayer'+(lo?' lo':'');L.setAttribute('aria-hidden','true');document.body.appendChild(L)}
  return L;
}
/* אפקט מהספרייה ב-HTML, מעל החלונות. x,y בפיקסלים של המסך (CSS). o: size, loop, dur, add, alpha, fps,
   anchor (אלמנט: האפקט נצמד אליו ונעלם כשהוא נסגר), fit (גודל ביחס ל-anchor), lo (מתחת להודעה, כדי לא לכסות טקסט) */
function fxDom(id,x,y,o={}){
  const D=typeof FXDATA!=='undefined'&&FXDATA[id];if(!D||typeof FXLIB!=='undefined'&&FXLIB.bad[id])return null;
  if(typeof fxImg==='function')fxImg(id);   // טוען, ומסמן אם הקובץ חסר
  FXUI.log[id]=(FXUI.log[id]||0)+1;
  const el=document.createElement('i');el.className='fxd'+(o.add?' add':'');
  el.style.backgroundImage='url('+(typeof FXLIB!=='undefined'?FXLIB.base:'fx/')+id+'.webp)';
  if(o.alpha!=null)el.style.opacity=o.alpha;
  const f={id,el,D,x,y,size:o.size||D.s,fit:o.fit||0,anchor:o.anchor||null,t0:performance.now()/1000,loop:!!o.loop,dur:o.dur||0,fps:o.fps||30,i:-1};
  fxuiLayer(o.lo).appendChild(el);fxuiPlace(f);
  FXUI.list.push(f);if(FXUI.list.length>FXUI.max)fxuiEnd(FXUI.list.shift());
  if(!FXUI.raf)FXUI.raf=requestAnimationFrame(fxuiTick);
  return f;
}
const fxuiEnd=f=>{if(f&&f.el){f.el.remove();f.el=null}};
function fxuiPlace(f){
  let x=f.x,y=f.y,s=f.size;
  if(f.anchor){const a=fxuiAt(f.anchor);if(!a||!f.anchor.isConnected)return false;x=a.x;y=a.y;if(f.fit)s=Math.max(a.w,a.h)*f.fit}
  if(f.s!==s){f.s=s;f.el.style.width=f.el.style.height=s+'px';f.el.style.backgroundSize=f.D.c*s+'px '+f.D.r*s+'px';f.i=-1}
  f.el.style.transform='translate('+(x-s/2)+'px,'+(y-s/2)+'px)';
  return true;
}
function fxuiTick(){
  const now=performance.now()/1000;let j=0;
  for(const f of FXUI.list){
    if(!f.el)continue;
    const age=now-f.t0,n=Math.floor(age*f.fps);let i=f.loop||f.dur?n%f.D.n:n;
    if((!f.loop&&!f.dur&&n>=f.D.n)||(f.dur&&age>f.dur)||!fxuiPlace(f)){fxuiEnd(f);continue}
    if(i!==f.i){f.i=i;f.el.style.backgroundPosition=-(i%f.D.c)*f.s+'px '+(-Math.floor(i/f.D.c)*f.s)+'px'}
    FXUI.list[j++]=f;
  }
  FXUI.list.length=j;
  FXUI.raf=j?requestAnimationFrame(fxuiTick):0;
}
const fxuiAtEl=(id,el,o={})=>{const a=fxuiAt(el);return a?fxDom(id,a.x,a.y,o):null};

/* ---- מה קורה במשחק → איזה אפקט. r: מה הפונקציה החזירה, a: הארגומנטים ---- */
FXUI.hooks={
  questClaim:(r,a)=>{if(!r||a[1])return;const b=fxuiBanner();fxDom('ui_toast',b.x,b.y,{size:260,lo:true});   // קווסט הושלם
    const q=typeof QBY!=='undefined'&&QBY[a[0]];if(q&&q.reward&&q.reward.coins)setTimeout(()=>fxDom('ui_coin',b.x,b.y+40,{size:120}),250)},
  qStart:()=>{if(!FXUI.ready)return;const b=fxuiBanner();fxDom('ui_new',b.x,b.y,{size:200,lo:true})},          // קווסט חדש
  rankUp:r=>{if(!r)return;const m=fxuiMid();fxDom('halo_ach',m.x,m.y-70,{size:180,add:true});fxDom('ui_ach',m.x,m.y,{size:300,lo:true})},   // דרגה
  bookClaim:(r,a)=>{if(r&&!a[0]){const b=fxuiBanner();fxDom('ui_ach',b.x,b.y,{size:240,lo:true})}},           // ספר ההרפתקאות
  challengeClaim:r=>{if(r){const b=fxuiBanner();fxDom('halo_ach',b.x,b.y-50,{size:140,add:true});fxDom('ui_ach',b.x,b.y,{size:240,lo:true})}},
  shopBuy:r=>{if(r){const t=fxuiTap();fxDom('ui_buy',t.x,t.y,{size:160})}},                                      // חנות הריצה
  gearCraft:r=>{if(r){const t=fxuiTap();fxDom('ui_buy',t.x,t.y,{size:180})}},                                    // נפחייה: יצירה
  vTrade:(r,a)=>{if(r){const t=fxuiTap();fxDom(a[0]==='sell'?'ui_coin':'ui_buy',t.x,t.y,{size:140})}},          // שוק
  decoBuy:r=>{if(!r){const t=fxuiTap();fxDom('ui_buy',t.x,t.y,{size:160})}},                                      // קישוטים: מחזיר סיבה רק כשנכשל
  dailyClaim:r=>{if(r){const t=fxuiTap();fxDom('ui_buy',t.x,t.y,{size:180});fxDom('ui_coin',t.x,t.y-40,{size:120})}},   // המתנה היומית
  updGo:()=>{const m=fxuiMid();fxDom('ui_load',m.x,m.y,{size:96,loop:true,dur:8})},                              // גרסה חדשה: נטען
  bagAdd:(r,a)=>{if(!FXUI.ready||typeof gItem!=='function'||!gItem(a[0]))return;   // חפץ נכנס לתרמיל
    const t=performance.now();if(t-(FXUI.bagT||0)<600)return;FXUI.bagT=t;const p=fxuiBag();fxDom(gRar(a[0])>=3?'pickup_chest':'pickup_gem',p.x,p.y,{size:96})},
};
function fxuiWrap(name,after){
  const f=window[name];if(typeof f!=='function'||f.fxui)return;
  const w=function(...a){const r=f.apply(this,a);try{after(r,a)}catch(e){}return r};w.fxui=true;window[name]=w;
}

/* ---- חלונות: תנועת פתיחה קצרה, ואפקט לחלונות מיוחדים ---- */
function fxuiWinOpen(el){
  el.classList.remove('fxin');void el.offsetWidth;el.classList.add('fxin');
  clearTimeout(el.fxinT);el.fxinT=setTimeout(()=>el.classList.remove('fxin'),FXUI.win*1000+80);
  FXUI.log.win=(FXUI.log.win||0)+1;
  const box=el.querySelector('.win')||el;
  for(const [id,o] of FXUI.open[el.id]||[])fxDom(id,0,0,Object.assign({anchor:box},o));
}
function fxuiWatchWins(){
  const ids=(typeof WINS!=='undefined'?WINS.map(w=>w.id):[]).concat(Object.keys(FXUI.open));
  const mo=new MutationObserver(ms=>{for(const m of ms){const el=m.target;if(m.oldValue!==null&&!el.hidden)fxuiWinOpen(el)}});
  for(const id of new Set(ids)){const el=document.getElementById(id);if(el)mo.observe(el,{attributes:true,attributeFilter:['hidden'],attributeOldValue:true})}
}

/* ---- מעבר בין מקומות: וילון כהה שנעלם, ו-ui_trans במרכז ---- */
function fxuiPlace0(){
  const b=document.body.classList,st=document.getElementById('ovStart');
  return b.contains('mb')?'mb':b.contains('world')?'world':b.contains('vil')?'vil':st&&!st.hidden?'start':'arena';
}
function fxuiTrans(){
  let v=document.getElementById('fxVeil');
  if(!v){v=document.createElement('div');v.id='fxVeil';v.setAttribute('aria-hidden','true');document.body.appendChild(v)}
  v.style.animationDuration=FXUI.trans+'s';v.classList.remove('on');void v.offsetWidth;v.classList.add('on');
  const m=fxuiMid();fxDom('ui_trans',m.x,m.y,{size:Math.min(innerWidth,innerHeight)*0.9,fps:24/FXUI.trans/1.6,alpha:0.85});   // נגמר יחד עם הווילון, בערך
  FXUI.log.trans=(FXUI.log.trans||0)+1;
}
function fxuiWatchPlace(){
  FXUI.place=fxuiPlace0();
  const chk=()=>{const p=fxuiPlace0();if(p!==FXUI.place){FXUI.place=p;fxuiTrans()}};
  new MutationObserver(chk).observe(document.body,{attributes:true,attributeFilter:['class']});
  const st=document.getElementById('ovStart');if(st)new MutationObserver(chk).observe(st,{attributes:true,attributeFilter:['hidden']});
}

/* ---- כפתורים: נגיעה וריחוף ---- */
function fxuiButtons(){
  addEventListener('pointerdown',e=>{
    FXUI.lastTap={x:e.clientX,y:e.clientY,t:performance.now()};
    const b=e.target.closest&&e.target.closest('button,[data-act]');
    if(!b||b.disabled||b.closest(FXUI.skip)||!b.closest(FXUI.zone))return;
    if(b.matches(FXUI.important)){const a=fxuiAt(b);if(a)fxDom('ui_juice',a.x,a.y,{size:Math.max(FXUI.juice,Math.min(a.w,200)*1.3)})}
    else fxDom('ui_click',e.clientX,e.clientY,{size:FXUI.click,add:true});
  },{capture:true,passive:true});
  if(!matchMedia('(hover:hover) and (pointer:fine)').matches)return;   // ריחוף: רק במחשב עם עכבר
  addEventListener('pointerover',e=>{
    if(e.pointerType!=='mouse')return;const b=e.target.closest&&e.target.closest('button');
    if(!b||b===FXUI.hov||b.disabled||b.closest(FXUI.skip)||!b.closest(FXUI.zone))return;
    FXUI.hov=b;const a=fxuiAt(b);if(a)fxDom('ui_hover',a.x,a.y,{size:FXUI.hover,add:true,alpha:0.8});
  },{passive:true});
  addEventListener('pointerout',e=>{if(FXUI.hov&&!FXUI.hov.contains(e.relatedTarget))FXUI.hov=null},{passive:true});
}

/* ---- נדירות: זוהר חוזר סביב התמונה בכרטיס חפץ זהב או אגדי ---- */
function fxuiRare(){
  for(const k in FXUI.rare)for(const el of document.querySelectorAll('.icard.rar-'+k+' .icbig')){
    if(el.fxr&&el.fxr.el||el.closest('[hidden]'))continue;
    el.fxr=fxDom(FXUI.rare[k],0,0,{anchor:el,fit:1.9,loop:true,add:true});
  }
}

function fxuiInit(){
  for(const n in FXUI.hooks)fxuiWrap(n,FXUI.hooks[n]);
  fxuiWatchWins();fxuiWatchPlace();fxuiButtons();
  setInterval(fxuiRare,400);
  fxPreload(['ui_click','ui_juice','ui_trans','ui_toast','ui_buy']);
  setTimeout(()=>{FXUI.ready=true},2500);   // הטעינה הראשונה (שמירה, קווסטים אוטומטיים) בלי אפקטים
}
if(document.readyState==='loading')addEventListener('DOMContentLoaded',fxuiInit);else fxuiInit();
