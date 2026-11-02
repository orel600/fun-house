/* איך מוצאים את הסקילים (דוח המבקר, 2.11.2026: "שחקן חדש לא יגלה איפה בוחרים סקילים ורונות"). בעולם ובכפר, הזירה לא משתנה.
   1. נגיעה ארוכה על כפתור סקיל בעולם פותחת את ספר הסקילים (wskbook.js). נגיעה קצרה וגרירה יורים כמו קודם (wskill.js).
   2. נקודה אדומה כשנפתח סקיל או רונה שעוד לא ראית בספר: על ☰, על לשונית הגיבור, על "📖 סקילים" ועל הכפתור הראשי בעולם.
      נעלמת כשפותחים את הספר. מה כבר נראה: SAVE.hero.skKnown (סקילים, ורונות כ-"סקיל:רונה").
   3. אחרי רגע הגילוי (skillreveal.js): כרטיס קטן למעלה עם "לספר" ו"לנסות" (אימון של 20 שניות, skpractice.js). נעלם לבד.
   המספרים כאן, הטקסט ב-lang.js ('skg.*') */
const SKGUIDE={
  hold:0.45,    // כמה שניות להחזיק את כפתור הסקיל עד שהספר נפתח
  tick:1,       // כל כמה שניות בודקים אם נפתח משהו חדש
  offer:7       // כמה שניות הכרטיס אחרי רגע הגילוי נשאר
};
const skgStat={holds:0,offers:0};   // בשביל הבוט

/* ---- מה נפתח, ומה עוד לא נראה ---- */
function skgOpenSet(){
  if(typeof wsbIds!=='function'||!SAVE||!SAVE.hero)return [];
  const out=[];
  for(const id of wsbIds()){if(id===wsbWeapon()||!wsbOpen(id))continue;out.push(id);
    if(typeof wrKeys==='function')for(const k of wrKeys(id))if(wrOpen(id,k))out.push(id+':'+k)}
  return out;
}
function skgKnown(){const h=SAVE.hero;if(!Array.isArray(h.skKnown))h.skKnown=skgOpenSet();return h.skKnown}   // פעם ראשונה: מה שכבר פתוח לא חדש
const skgNew=()=>{if(!SAVE||!SAVE.hero)return 0;const k=skgKnown();return skgOpenSet().filter(x=>!k.includes(x)).length};
// נקרא כשהספר נפתח: הכל נראה
function skgSeen(){if(!SAVE||!SAVE.hero)return;SAVE.hero.skKnown=skgOpenSet();skgDots()}
function skgDots(){
  const on=S&&S.mode&&(S.vil||S.wd)&&skgNew()>0;
  const d=$('skDot');if(d&&d.hidden===!!on)d.hidden=!on;   // על לשונית הגיבור, ו-menuDot (menu.js) מדליק את ☰
  const b=$('skills');if(b)b.classList.toggle('sknew',!!(on&&S.wd));
  for(const x of document.querySelectorAll('.wsbopen'))x.classList.toggle('sknew',!!on);
}
setInterval(()=>{try{skgDots()}catch(e){}},SKGUIDE.tick*1000);

/* ---- נגיעה ארוכה על כפתור סקיל בעולם. wskill.js תופס את הנגיעה קודם, וכאן רק מודדים זמן ומבטלים את הירייה ---- */
let skgHold=null;
function skgBook(){
  if(!S||S.mode!=='play')return false;
  S.mode='gear';S.bookSolo=true;joy=null;   // המשחק עוצר כמו בחלון הדמות. wsbClose מחזיר
  wsbOpenUi();sfx('ui');return true;
}
addEventListener('pointerdown',e=>{
  const b=S&&S.wd&&e.target.closest&&e.target.closest('#skills [data-sk]');if(!b)return;
  const pid=e.pointerId,sx=e.clientX,sy=e.clientY;clearTimeout(skgHold&&skgHold.t);
  skgHold={pid,sx,sy,t:setTimeout(()=>{const a=wskAim;skgHold=null;
    if(!a||a.pid!==pid||a.len>=WSKILL.drag)return;
    wskAim=null;try{b.releasePointerCapture(pid)}catch(_){}
    if(skgBook())skgStat.holds++},SKGUIDE.hold*1000)};
},true);
const skgCancel=e=>{if(skgHold&&e.pointerId===skgHold.pid){clearTimeout(skgHold.t);skgHold=null}};
addEventListener('pointerup',skgCancel,true);addEventListener('pointercancel',skgCancel,true);
addEventListener('pointermove',e=>{if(skgHold&&e.pointerId===skgHold.pid&&Math.hypot(e.clientX-skgHold.sx,e.clientY-skgHold.sy)>=WSKILL.drag)skgCancel(e)},true);

/* ---- הכרטיס אחרי רגע הגילוי: "לספר" ו"לנסות" ---- */
let skgOfferT=0;
function skgOffer(id){
  if(!S||!S.wd||!SKILLS.list[id])return;
  let el=$('skOffer');
  if(!el){el=document.createElement('div');el.id='skOffer';el.className='skoffer';el.hidden=true;document.body.appendChild(el);
    el.addEventListener('click',e=>{const b=e.target.closest('[data-skg]');if(!b)return;e.stopPropagation();const k=b.dataset.skg,sid=el.dataset.id;skgOfferClose();
      if(k==='book')skgBook();else if(k==='try'&&typeof skpStart==='function')skpStart(sid);else sfx('ui')})}
  el.dataset.id=id;el.style.setProperty('--dt',skCol(id));
  const pr=typeof skpCan==='function'&&skpCan();
  el.innerHTML='<b class="skon">'+T('skg.new',T('sk.'+id))+'</b>'+
    '<button class="vbtn" data-skg="book">📖 '+T('skg.book')+'</button>'+
    (pr?'<button class="vbtn" data-skg="try">🎯 '+T('skg.try')+'</button>':'')+
    '<button class="wx" data-skg="x" aria-label="'+T('q.close')+'">✕</button>';
  el.hidden=false;skgStat.offers++;clearTimeout(skgOfferT);skgOfferT=setTimeout(skgOfferClose,SKGUIDE.offer*1000);
}
function skgOfferClose(){clearTimeout(skgOfferT);const el=$('skOffer');if(el)el.hidden=true}
