/* טיפ ראשון (משימה ק ב-roadmap.md, 4.11.2026): הרבה מערכות חדשות לא מוסברות. טון של RPG: קצר וענייני (ניר, 4.11: "דרוש: רמה 12, כוח 20").
   בפעם הראשונה בלבד שפוגשים דבר מהרשימה: בועה קטנה בעץ וזהב, שורה או שתיים עם אייקון. אחר כך לא חוזרת (SAVE.tips).
   - שני סוגים: טיפ במשחק (ליד הדבר אם יש לו כפתור, אחרת למעלה במרכז), וטיפ בתוך חלון (ליד השורה שהוא מסביר, למשל בכרטיס חפץ).
   - טיפ במשחק לא מופיע מעל חלון ולא כשיש פס אחר למעלה (foelore.js, nemesis.js, mutation.js, הכרטיס של סקיל חדש): מחכה לתור, והזמן שלו לא רץ.
   - אחד בכל פעם, השאר בתור. לא עוצר את המשחק ולא חוסם מגע (נגיעה עוברת דרך הבועה, ונגיעה עליה סוגרת אותה). נעלם לבד אחרי כמה שניות.
   - מתג בהגדרות: טיפים פועל או כבוי (SAVE.tipsOff).
   איך זה מתחבר: רוב הטיפים נבדקים כאן כל רבע שנייה (TIPS.watch), בלי לגעת בקבצים אחרים. החפצים: שורה אחת ב-itemCard (itemcard.js).
   טיפ חדש: שורה ב-TIPS.list, טקסט 'tip1.<מפתח>' ב-lang.js, ותנאי ב-TIPS.watch או קריאה ל-tipOnce('<מפתח>') מהמקום שבו זה קורה. */
const TIPS={
  dur:5.5,          // שניות שטיפ נשאר
  winDur:5,         // טיפ בתוך חלון
  tick:0.25,        // כל כמה שניות בודקים
  // האייקון של כל טיפ
  list:{req:'🔒',q:'⭐',sklv:'📈',mut:'🎲',depths:'🌀',nem:'💀',giant:'🗿',skill:'📖'},
  // טיפ במשחק: מתי הוא נכנס לתור (כל רבע שנייה), ולאיזה כפתור הוא מצביע אם יש. משתמש רק במה שקיים (typeof)
  watch:{
    mut:{when:()=>S.wd&&typeof mutNow==='function'&&mutNow()&&TIP1.wt>(typeof MUTATION!=='undefined'?MUTATION.bar.delay+MUTATION.bar.dur:4),at:'#mutChip'},   // אחרי הפס של החוק
    skill:{when:()=>S.wd&&typeof skgNew==='function'&&skgNew()>0,at:'#skills'},
    sklv:{when:()=>(S.vil||S.wd)&&typeof wslIds==='function'&&wslIds().some(wslCan),args:()=>[T('npc.priest')[0]]},
    nem:{when:()=>S.wd&&typeof NS==='function'&&NS().list.length>0,args:()=>[nemName(NS().list[NS().list.length-1])]},
    giant:{when:()=>S.wd&&S.wd.warden&&S.wd.warden.wboss&&!S.wd.warden.dead},
    depths:{when:()=>S.wd&&S.wd.reg==='shadow'&&typeof storyOpen==='function'&&storyOpen('end')}
  },
  q:{good:105,bad:95}   // איכות חפץ: מעל זה "יצא חזק", מתחת "יצא חלש" (itemroll.js)
};

// המצב: התור, הטיפ שמוצג, והזמן בעולם הנוכחי (בשביל החוק היומי)
const TIP1={q:[],on:null,t:0,wt:0,wdRef:null,stat:{shown:0,both:0}};
const tipSeen=()=>SAVE.tips||(SAVE.tips={});
const tipsOn=()=>!!SAVE&&!SAVE.tipsOff;
const tipDone=k=>!!tipSeen()[k];

// טיפ במשחק: נכנס לתור אם לא ראו אותו. at: כפתור שהבועה מצביעה עליו (selector). args: מה נכנס לטקסט
function tipOnce(k,args,at){
  if(!TIPS.list[k]||!tipsOn()||tipDone(k)||TIP1.on&&TIP1.on.k===k||TIP1.q.some(x=>x.k===k))return false;
  TIP1.q.push({k,args:args||[],at:at||null});return true;
}
// טיפ בתוך חלון: מוצג רק אם השורה שהוא מסביר נראית עכשיו ואין טיפ אחר. אם לא, מחכה לפעם הבאה (לא נשמר)
function tipWin(k,args,sel){
  if(!TIPS.list[k]||!tipsOn()||tipDone(k)||TIP1.on)return false;
  TIP1.pendWin={k,args:args||[],at:sel,win:1};return true;
}

/* ---- החיבור מכרטיס החפץ (itemCard ב-itemcard.js): דרישה שלא עומדים בה, או איכות ---- */
function tipItem(id){
  if(!tipsOn()||typeof irReq!=='function'||!irOn())return;
  const r=irReq(id);
  if(r&&!irMeets(id)&&!tipDone('req')){
    const st=r.st&&r.n?T('st.'+r.st)[0]:null;
    tipWin('req',[r.lv,st,r.n],'.icard .ireq.no');return;
  }
  if(gQtag(id)&&!tipDone('q')){
    const p=q=>icPow(id.replace(/~\d+/,'~'+q)),Q=gQ(id),v=Q>=TIPS.q.good?'good':Q<=TIPS.q.bad?'bad':'mid';
    tipWin('q',[icPow(id),p(ITEMROLL.q.min)+'–'+p(ITEMROLL.q.max),T('tip1.q.'+v)],'.icard .iq');
  }
}

/* ---- מתי מותר להציג טיפ במשחק: אין חלון, אין פס אחר, ומשחקים ---- */
const tipVis=el=>!!el&&!el.hidden&&el.getClientRects().length>0;
function tipBusy(){
  if(!S||S.mode!=='play'||!(S.vil||S.wd))return true;
  if([...document.querySelectorAll('.ov')].some(o=>!o.hidden))return true;
  if(typeof flCardOn==='function'&&flCardOn())return true;
  if(typeof nemCardOn==='function'&&nemCardOn())return true;
  if(typeof MUT!=='undefined'&&MUT.bar)return true;
  return tipVis(document.getElementById('skOffer'));
}
const tipFind=sel=>{if(!sel)return null;for(const el of document.querySelectorAll(sel))if(tipVis(el))return el;return null};

/* ---- הבועה ---- */
function tipEl(){
  let el=document.getElementById('tip1');if(el)return el;
  el=document.createElement('div');el.id='tip1';el.className='tip1';el.setAttribute('role','status');el.hidden=true;
  document.body.appendChild(el);return el;
}
function tipText(x){
  const a=x.args;
  if(x.k==='req')return a[1]?T('tip1.req',a[0],a[1],a[2]):T('tip1.reqLv',a[0]);
  return T('tip1.'+x.k,...a);
}
function tipShow(x){
  const el=tipEl();TIP1.on=x;TIP1.t=x.win?TIPS.winDur:TIPS.dur;tipSeen()[x.k]=1;TIP1.stat.shown++;
  if(typeof saveNow==='function')saveNow();
  el.innerHTML='<span class="t1pic">'+TIPS.list[x.k]+'</span><p>'+tipText(x)+'</p>';
  el.classList.toggle('inwin',!!x.win);el.hidden=false;tipPlace();void el.offsetWidth;el.classList.add('on');
  if(typeof sfx==='function')sfx('ui');
}
function tipClose(){
  TIP1.on=null;const el=document.getElementById('tip1');if(el){el.classList.remove('on');el.hidden=true}
}
// ליד מה שמסבירים: מתחתיו אם יש מקום, אחרת מעליו. בלי כפתור: למעלה במרכז, איפה שהפסים האחרים
function tipPlace(){
  const el=tipEl(),x=TIP1.on,a=x&&tipFind(x.at);
  el.classList.toggle('free',!a);
  if(!a){el.style.left=el.style.top='';el.removeAttribute('data-up');return}
  const r=a.getBoundingClientRect(),w=el.offsetWidth||220,h=el.offsetHeight||44,m=8;
  const cx=Math.max(m+w/2,Math.min(innerWidth-m-w/2,r.left+r.width/2));
  const below=r.bottom+h+12<innerHeight;
  el.style.left=cx+'px';el.style.top=(below?r.bottom+8:r.top-h-8)+'px';
}

/* ---- כל רבע שנייה (ובבוט ישירות) ---- */
function tipTick(dt){
  if(!S||!SAVE)return;
  if(S.wd!==TIP1.wdRef){TIP1.wdRef=S.wd;TIP1.wt=0}   // כניסה לעולם (או יציאה): הזמן מתחיל מחדש
  if(S.wd&&S.mode==='play')TIP1.wt+=dt;
  if(!tipsOn()){if(TIP1.on)tipClose();TIP1.q=[];TIP1.pendWin=null;return}
  for(const k in TIPS.watch){const W=TIPS.watch[k];if(tipDone(k))continue;let ok=false;try{ok=!!W.when()}catch(e){}
    if(ok)tipOnce(k,W.args?W.args():[],W.at)}
  const el=tipEl();
  if(TIP1.on){
    if(TIP1.on.win){   // בתוך חלון: נעלם כשהשורה נעלמה (החלון נסגר או התחלף)
      if(!tipFind(TIP1.on.at)){tipClose();return}
      tipPlace();if((TIP1.t-=dt)<=0)tipClose();return;
    }
    const busy=tipBusy();   // במשחק: חלון או פס אחר עולה מעליו, הבועה מחכה והזמן לא רץ
    if(busy!==el.hidden){el.hidden=busy;el.classList.toggle('on',!busy)}
    if(!busy){tipPlace();if((TIP1.t-=dt)<=0)tipClose()}
    return;
  }
  const p=TIP1.pendWin;TIP1.pendWin=null;
  if(p&&tipFind(p.at)){tipShow(p);return}
  if(TIP1.q.length&&!tipBusy())tipShow(TIP1.q.shift());
}
setInterval(()=>{try{tipTick(TIPS.tick)}catch(e){}},TIPS.tick*1000);
// נגיעה סוגרת: בתוך חלון נגיעה בכל מקום, ובמשחק נגיעה על הבועה. הבועה לא תופסת את הנגיעה (pointer-events:none), אז מה שמתחתיה עדיין עובד
addEventListener('pointerdown',e=>{if(!TIP1.on)return;const el=document.getElementById('tip1');if(!el||el.hidden)return;
  const r=el.getBoundingClientRect();if(TIP1.on.win||e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)tipClose()},true);
// בדיקה (tools/check.js): כמה טיפים נראים עכשיו
const tipShownN=()=>document.querySelectorAll('.tip1:not([hidden])').length;

/* ---- מתג בהגדרות: טיפים פועל / כבוי ---- */
(function(){
  const box=document.querySelector('#ovSound .sub.upd');if(!box)return;
  const d=document.createElement('div');d.className='sub gfx tipset';
  d.innerHTML='<span data-t="tip1.group">'+T('tip1.group')+'</span><div class="langs" role="group" data-ta="tip1.group">'+
    '<button class="lang" data-tips="1" data-t="tip1.on">'+T('tip1.on')+'</button><button class="lang" data-tips="0" data-t="tip1.off">'+T('tip1.off')+'</button></div>';
  box.before(d);
  const sync=()=>{for(const b of d.querySelectorAll('[data-tips]'))b.setAttribute('aria-pressed',String((b.dataset.tips==='1')===tipsOn()))};
  for(const b of d.querySelectorAll('[data-tips]'))b.onclick=()=>{SAVE.tipsOff=b.dataset.tips!=='1';if(SAVE.tipsOff)tipClose();saveNow();sync();if(typeof sfx==='function')sfx('ui')};
  document.getElementById('muteBtn')&&document.getElementById('muteBtn').addEventListener('click',sync);
  setTimeout(sync,0);
})();

// העיצוב: עץ וזהב כמו הפסים של foelore.js. כאן ולא ב-CSS, כדי שהמכניקה תהיה בקובץ אחד
(function(){const st=document.createElement('style');st.textContent=
  '.tip1{position:fixed;transform:translate(-50%,-6px);opacity:0;transition:opacity .25s,transform .25s;z-index:60;pointer-events:none;'+
  'display:flex;gap:8px;align-items:center;width:max-content;max-width:min(320px,44vw);padding:5px 12px 5px 10px;border-radius:12px;'+
  'background:linear-gradient(#4A3322f0,#2C1E14f0);border:1.5px solid #C9A24A;box-shadow:inset 0 1px 0 #ffffff1a,0 3px 10px #000a;color:#EDE8DA;font:500 12px/1.35 Heebo,system-ui,sans-serif;text-align:start}'+
  '.tip1.free{left:50%;top:calc(env(safe-area-inset-top,0px) + 54px)}.tip1.on{opacity:1;transform:translate(-50%,0)}'+
  '.tip1 .t1pic{font-size:20px;line-height:1;flex:none}.tip1 p{margin:0}.tip1 b{color:#F4C74F}';
  document.head.appendChild(st)})();
