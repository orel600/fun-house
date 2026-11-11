/* מסלול הודעות אחד בעולם ובכפר (ניר, סרטון 7.11.2026: "יותר מדי טקסט גדול על הקרב", הודעות שנחתכות בקצה ומתחת לסקילים).
   כל ההודעות (banner מכל מקום, מתנת פנס, שמועה, נמצא נדיר, סקיל חדש, "היום בעולם") נכנסות לעמודה אחת למעלה במרכז,
   בין האשכול השמאלי (☰, מפה קטנה) לימני (חיים, קווסט, כפתורים), ותמיד מעל הגיבור.
   - קטנות: עד 3 יחד, שורה אחת (מה שארוך נחתך ב-…), נעלמות לבד. מה שמגיע כשמלא מחכה בתור.
   - גדולה: אחת בכל פעם, רק לרגעים גדולים (msgBig: כניסה ראשונה לאזור, דרגה חדשה, בוס הובס).
     כשיש אויבים בטווח קרב היא מחכה שהקרב יירגע, ואחרי MSG.bigWait שניות יורדת לקטנה.
   - המקום נמדד מחדש (getBoundingClientRect) מול כל מה שעל המסך, אז שום הודעה לא מכסה כפתור ולא נחתכת.
   בזירה (של אוראל) ובמשחקי השאול: הכל כמו קודם (msgOn() מחזיר false).
   חיבור: banner ב-progression.js שואל את msgOn() בשורה הראשונה, והעטיפה למטה עוקפת את התור של welcome.js. feedTitle ו-mutShowBar קוראים לכאן */
const MSG={
  small:{max:3, life:2.4, q:4, fight:1},  // כמה קטנות יחד, כמה שניות כל אחת, כמה מחכות בתור (הישנות נזרקות), וכמה יחד באמצע קרב (השאר מחכות לסוף. ניר 8.11)
  big:{life:2.2, wait:6, q:2},      // גדולה: כמה שניות, כמה לחכות לסוף הקרב לפני שיורדת לקטנה, וכמה בתור
  fight:360,                        // אויב חי במרחק הזה (יחידות משחק) = באמצע קרב
  pad:8, gap:6, minW:220, maxW:540, // רווח מכל כפתור, רווח בין שורות, ורוחב העמודה
  hero:{up:95, side:70},            // הגיבור על המסך: כמה מעליו וכמה לצדדים שמורים לו (יחידות משחק, כפול ZOOM)
  seen:[], stat:{small:0,big:0,down:0,waits:0,most:0,mostBig:0,held:0,card:0,both:0,lv:0}   // לבדיקה (tools/check.js)
};
const MQ={small:[],big:[],rows:[],bigRow:null,t:0};
function msgOn(){const bc=document.body.classList;return !!S&&!bc.contains('mb')&&(bc.contains('world')||bc.contains('vil'))}
function msgEl(){let el=$('msgLane');if(!el){el=document.createElement('div');el.id='msgLane';el.className='msglane';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el)}return el}
const msgNow=()=>performance.now()/1000;
const msgSeen=t=>MSG.seen.includes(t)||MQ.small.some(m=>m.txt===t)||MQ.big.some(m=>m.txt===t);
function msgNote(t){MSG.seen.push(t);if(MSG.seen.length>30)MSG.seen.shift()}

// הודעה רגילה: קטנה בעמודה
function msgSay(txt,col){
  txt=String(txt==null?'':txt).trim();if(!txt)return;
  const live=MQ.rows.find(r=>r.txt===txt);if(live){live.t=msgNow();return}   // אותה הודעה שוב: רק מאריכים
  if(MQ.small.some(m=>m.txt===txt)||(MQ.bigRow&&MQ.bigRow.txt===txt))return;
  MQ.small.push({txt,col:col||C.chalk});while(MQ.small.length>MSG.small.q)MQ.small.shift();msgPump();
}
// רגע גדול: אחת בכל פעם, לא באמצע קרב
function msgBig(txt,col){
  if(!msgOn()){if(typeof banner==='function')banner(txt,col);return}
  txt=String(txt||'').trim();if(!txt||MQ.big.some(m=>m.txt===txt)||(MQ.bigRow&&MQ.bigRow.txt===txt))return;
  MQ.small=MQ.small.filter(m=>m.txt!==txt);   // אותו טקסט כקטנה (ranks.js קורא לשתיהן): רק הגדולה
  MQ.big.push({txt,col:col||C.gold,at:msgNow()});while(MQ.big.length>MSG.big.q)MQ.big.shift();msgPump();
}
function msgFight(){if(!S||!S.wd||typeof enemies==='undefined')return false;const r=MSG.fight;
  for(const e of enemies)if(!e.dead&&Math.abs(e.x-P.x)<r&&Math.abs(e.y-P.y)<r&&Math.hypot(e.x-P.x,e.y-P.y)<r)return true;return false}

function msgRow(m,big){const d=document.createElement('div');d.className='mrow'+(big?' big':'');d.textContent=m.txt;d.style.setProperty('--mc',m.col);
  msgEl().appendChild(d);void d.offsetWidth;d.classList.add('on');msgNote(m.txt);return d}
// The "New: skill" card (skguide.js) is up: a big line (region, rank, boss) waits in its queue, and does not drop to small meanwhile
// (desert 11.11: the card sat on top of "The Burning Desert..." at 915x412)
function msgCardUp(){const c=$('skOffer');return !!c&&!c.hidden}
// The "Level N!" card (levelpath.js, top center) is up: the whole lane steps aside until it is gone. Lines on screen go back to the front of
// their queues, new ones wait (a big one does not drop to small), and the cards in the lane hide (CI 11.11: "Level 9!" touched "You beat Storm Warden again!")
function msgLvUp(){const c=$('lpCard');return !!c&&c.classList.contains('on')}
// The new-skill moment (skillreveal.js): the icon rises over the hero and flies to its button, right where the lane sits at the top center.
// The lane steps aside the same way until it ends (CI 11.11: "Everything for Forge! Head home to build" ran over the flying quake icon at 915x412)
function msgPause(){if(msgLvUp())return true;if(typeof SKR!=='undefined'&&SKR&&!SKR.done){MSG.stat.skr=(MSG.stat.skr||0)+1;return true}return false}
function msgPump(){
  const el=msgEl(),now=msgNow();if(!msgOn()){msgClear();return}
  if(msgPause()){
    if(MQ.bigRow){msgGone(MQ.bigRow);MQ.big.unshift({txt:MQ.bigRow.txt,col:MQ.bigRow.col,at:now});MQ.bigRow=null}
    for(const r of MQ.rows.reverse()){msgGone(r);MQ.small.unshift({txt:r.txt,col:r.col})}MQ.rows=[];
    for(const m of MQ.big)m.at=now;MSG.stat.lv++;el.style.visibility='hidden';
    if(!MQ.t&&(MQ.big.length||MQ.small.length))MQ.t=setInterval(msgTick,200);return}
  const card=msgCardUp();
  if(card&&MQ.bigRow){msgGone(MQ.bigRow);MQ.big.unshift({txt:MQ.bigRow.txt,col:MQ.bigRow.col,at:now});MQ.bigRow=null}   // a big one already up when the card came: it steps back and comes after it
  // גדולה: רק כשאין גדולה על המסך ואין קרב. מחכה יותר מדי: יורדת לקטנה
  if(!MQ.bigRow&&MQ.big.length){const m=MQ.big[0];
    if(card){m.at=now;MSG.stat.card++}
    else if(!msgFight()){MQ.big.shift();MQ.bigRow={txt:m.txt,col:m.col,t:now,life:MSG.big.life,el:msgRow(m,true)};el.prepend(MQ.bigRow.el);MSG.stat.big++}
    else if(now-m.at>MSG.big.wait){MQ.big.shift();MSG.stat.down++;MQ.small.unshift({txt:m.txt,col:m.col})}
    else MSG.stat.waits++}
  const cap=MQ.small.length&&msgFight()?MSG.small.fight:MSG.small.max;if(MQ.small.length&&MQ.rows.length>=cap&&cap<MSG.small.max)MSG.stat.held++;
  while(MQ.small.length&&MQ.rows.length<cap){const m=MQ.small.shift();MQ.rows.push({txt:m.txt,col:m.col,t:now,el:msgRow(m)});MSG.stat.small++}
  if(card&&MQ.bigRow)MSG.stat.both++;   // for the check: a big line on screen together with the card
  MSG.stat.most=Math.max(MSG.stat.most,MQ.rows.length);MSG.stat.mostBig=Math.max(MSG.stat.mostBig,el.querySelectorAll('.mrow.big').length);
  msgPlace();
  if(!MQ.t&&(MQ.rows.length||MQ.bigRow||MQ.big.length||MQ.small.length))MQ.t=setInterval(msgTick,200);
}
function msgGone(r){r.el.classList.remove('on');setTimeout(()=>r.el.remove(),260)}
function msgTick(){
  const now=msgNow();if(!msgOn()){msgClear();return}
  MQ.rows=MQ.rows.filter(r=>{if(now-r.t<MSG.small.life)return true;msgGone(r);return false});
  if(MQ.bigRow&&now-MQ.bigRow.t>MQ.bigRow.life){msgGone(MQ.bigRow);MQ.bigRow=null}
  msgPump();
  if(!MQ.rows.length&&!MQ.bigRow&&!MQ.big.length&&!MQ.small.length){clearInterval(MQ.t);MQ.t=0}
}
function msgClear(){MQ.small=[];MQ.big=[];MQ.rows=[];MQ.bigRow=null;clearInterval(MQ.t);MQ.t=0;const el=$('msgLane');if(!el)return;
  for(const id of [...MSG_CARDS,'tip1']){const c=$(id);if(c&&c.parentNode===el)document.body.appendChild(c)}   // the cards that live in the lane (skill, first meeting, "today in the world") stay in the page
  el.textContent=''}

/* ---- המקום: מה תפוס על המסך ---- */
// כל מה שגלוי ונראה על המסך (כפתורים, פסים, מפה, קווסט, סקילים). מכל מיכל רחב לוקחים את הילדים, כי האמצע שלו שקוף
function msgBlocks(){
  const out=[],vw=innerWidth,vh=innerHeight,skip=new Set(['msgLane','banner','feedCol','c','c3d']);
  const add=(e,d)=>{if(!e||skip.has(e.id)||e.hidden||e.tagName==='SCRIPT'||e.tagName==='CANVAS'||e.tagName==='STYLE')return;
    const r=e.getBoundingClientRect();if(r.width<2||r.height<2||r.right<0||r.bottom<0||r.left>vw||r.top>vh)return;
    const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity<0.05)return;
    if(r.width*r.height>vw*vh*0.4||(r.height>vh*0.6&&d>=3))return;   // חלון או שכבה על כל המסך (או עמוד גבוה): לא כפתור
    if((r.width>vw*0.5||r.height>vh*0.5)&&d<3){for(const k of e.children)add(k,d+1);return}
    // הודעות וכרטיסים שקופים למגע: לא חוסמים. אבל מיכל שקוף יכול להחזיק כפתורים (#qRail: ספר, קווסטים, גיבור. ביקורת 7.11.2026): בודקים את הילדים
    if(cs.pointerEvents==='none'&&!e.closest('.whud,.vhud,.hud,#qTrack,.skills,#who,#rareLine')){if(d<3)for(const k of e.children)add(k,d+1);return}
    out.push({left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,el:e});
    // ילדים שיוצאים מגבולות המיכל (קשת הסקילים ב-#skills: המיכל בגודל הכפתור הראשון, והשניים האחרים מחוץ לו. ניר, סרטון 7.11): נמדדים גם הם
    if(d<3)for(const k of e.children){const q=k.getBoundingClientRect();if(q.width>=2&&q.height>=2&&(q.left<r.left-1||q.right>r.right+1||q.top<r.top-1||q.bottom>r.bottom+1))add(k,d+1)}};
  for(const e of document.body.children)add(e,0);
  return out;
}
// הגיבור על המסך (render.js: המצלמה S.cam במרכז, ZOOM)
function msgHero(){
  if(!S||!S.cam||typeof P==='undefined')return null;const z=ZOOM||1,x=(P.x-S.cam.x+W/2)*z,y=(P.y-S.cam.y+H/2)*z;
  return {left:x-MSG.hero.side*z,right:x+MSG.hero.side*z,top:y-MSG.hero.up*z,bottom:y+30*z};
}
function msgPlace(){
  const el=$('msgLane');if(!el||!el.children.length)return;
  const vw=innerWidth,bl=msgBlocks(),h=Math.max(24,el.offsetHeight),pad=MSG.pad,hero=msgHero(),cx=hero?Math.min(vw*0.62,Math.max(vw*0.38,(hero.left+hero.right)/2)):vw/2;
  // מנסים גבהים מלמעלה למטה: בכל גובה, הפס הפנוי סביב מרכז המסך בין מה שתפוס משמאל ומימין
  // רק גבהים מעל הגיבור (או בחצי העליון), והפס נבדק בגובה של שורה-שתיים: מה שלא נכנס מתחת מוסתר בכל מקרה
  const lim=hero?hero.top-26:innerHeight*0.45,hb=Math.min(h,60);
  const tops=[pad,...bl.map(r=>r.bottom+pad)].filter(y=>y>=pad&&y<=lim).sort((a,b)=>a-b);let best=null;
  for(const y of tops){let L=pad,R=vw-pad,hit=null;
    for(const r of bl){if(r.bottom<=y||r.top>=y+hb)continue;
      if(r.right<=cx)L=Math.max(L,r.right+pad);else if(r.left>=cx)R=Math.min(R,r.left-pad);else{L=R;hit=r;break}}
    const w=R-L;if(!best||w>best.w)best={y,L,R,w,hit};if(w>=MSG.minW){best={y,L,R,w};break}}
  if(!best||best.w<60)best={y:pad,L:pad,R:vw-pad,w:vw-2*pad,hit:best&&best.hit};   // אין פס פנוי: למעלה במרכז, כמו פעם
  MSG.where=best.hit?(best.hit.el.id||best.hit.el.className||best.hit.el.tagName):'';   // לבדיקה: מה חסם
  const w=Math.min(MSG.maxW,best.w),x=Math.max(best.L,Math.min(best.R-w,cx-w/2));
  el.style.top=Math.round(best.y)+'px';el.style.left=Math.round(x)+'px';el.style.width=Math.round(w)+'px';
  // לא יורדים על הגיבור: מה שלא נכנס מעליו מתקצר (הקטנות האחרונות נעלמות קודם)
  if(hero){const room=Math.max(26,Math.round(hero.top-best.y));el.style.maxHeight=room+'px';
    for(const c of el.children)c.classList.toggle('cut',c.offsetTop+c.offsetHeight>room+1)}   // שורה שלא נכנסת כולה: מוסתרת, לא חצי
}
addEventListener('resize',()=>{if(msgOn())msgPlace()});
// הכרטיסים שכבר קיימים (פגישה ראשונה foelore.js, "היום בעולם" mutation.js) עוברים לגור בעמודה: אותו מקום, ולא עולים על הכפתורים
const MSG_CARDS=['skOffer','flCard','mutBar'];   // skOffer: "חדש: סקיל" עם כפתורים (skguide.js)
const msgWinOpen=()=>[...document.querySelectorAll('.ov,.win')].some(o=>!o.hidden&&!o.closest('[hidden]')&&o.getClientRects().length>0);   // רק חלון שבאמת על המסך (גם display:none של אבא לא נחשב, כמו skgWins)
setInterval(()=>{const el=msgEl();
  if(!msgOn()){for(const id of [...MSG_CARDS,'tip1']){const c=$(id);if(c&&c.parentNode===el)document.body.appendChild(c)}return}
  for(const id of MSG_CARDS){const c=$(id);if(c&&c.parentNode!==el)el.appendChild(c)}
  el.style.visibility=msgWinOpen()||msgPause()?'hidden':'';   // חלון פתוח (או כרטיס "Level N!"): ההודעות לא מעליו
  if([...el.children].some(c=>!c.hidden&&c.offsetHeight))msgPlace()},300);

// כל banner בעולם ובכפר: ישר לעמודה, בלי התור של welcome.js (לעמודה יש תור משלה)
{const old=banner;banner=function(txt,col){if(msgOn())return msgSay(txt,col);return old.apply(this,arguments)}}

(function(){const st=document.createElement('style');st.textContent=
  '.msglane{position:fixed;z-index:4;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:'+MSG.gap/2+'px;overflow:hidden;top:8px;left:30%;width:40%}'+
  '.msglane .mrow{max-width:100%;box-sizing:border-box;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;flex:none;'+
    'padding:2px 12px;border-radius:999px;background:rgba(5,7,13,.62);border-inline-start:3px solid var(--mc);color:#ECE7DC;'+
    'font:700 clamp(11px,2.8vh,14px)/1.35 Heebo,system-ui,sans-serif;text-shadow:0 1px 2px #000a;opacity:0;transform:translateY(-6px);transition:opacity .22s,transform .22s}'+
  '#msgLane>.skoffer{flex-wrap:wrap;justify-content:center;row-gap:4px}#msgLane>.skoffer .skon{flex-basis:100%;text-align:center}#msgLane>.skoffer .vbtn{min-height:38px;font-size:14px}'+
  '.msglane>.cut{visibility:hidden}.msglane .mrow.on{opacity:1;transform:none}.msglane .mrow.big{order:0}#msgLane>.skoffer{order:1;pointer-events:auto}#msgLane>.flcard{order:2}#msgLane>.mutbar{order:3}.msglane .mrow:not(.big){order:4}'+
  '#msgLane>.skoffer,#msgLane>.flcard,#msgLane>.mutbar{position:static;transform:none;left:auto;top:auto;max-width:100%;flex:none;box-sizing:border-box}#msgLane>.flcard:not(.on),#msgLane>.mutbar:not(.on),#msgLane>[hidden]{display:none}'+
  '.msglane .mrow.big{color:var(--mc);font:800 clamp(14px,4.2vh,20px)/1.3 var(--display,Heebo),Heebo,system-ui,sans-serif;padding:3px 18px;border:1.5px solid var(--mc);background:linear-gradient(#3a2818ee,#20160ee6)}'+
  // a card that just appeared waits up to 300 ms before it moves into the lane: until then it is invisible, not on top of the goal row (10.11: "New: Quake" covered Jump)
  'body.world:not(.mb)>.skoffer,body.world:not(.mb)>.flcard,body.world:not(.mb)>.mutbar,body.vil:not(.mb)>.skoffer,body.vil:not(.mb)>.flcard,body.vil:not(.mb)>.mutbar{visibility:hidden}'+
  '@media (prefers-reduced-motion:reduce){.msglane .mrow{transition:none;transform:none}}';
  document.head.appendChild(st)})();
