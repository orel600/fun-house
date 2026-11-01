/* "בזמן שלא היית" (ניר, 1.11.2026): בחזרה לכפר, ובפתיחת המשחק, חלון אחד שמסכם כל מה שמחכה, ולחיצה אחת אוספת הכל.
   במקום כמה חלונות קופצים בזה אחר זה: הייצור של כל מבנה, המתנה היומית (daily.js, הלוח של 7 ימים נשאר מאחורי כפתור 🎁),
   מתנות מחברים (visit.js, כבר בתרמיל, כאן רק מראים ממי), קווסטים שמוכנים לאיסוף (quests.js, בלי דרגה ופנס, שיש להם טקס משלהם) ופרס מספר ההרפתקאות (book.js).
   "אסוף הכל": חגיגה אחת, המספרים עפים לפס העליון, ושורה אחת עם מה כדאי לעשות עכשיו. אין כלום? החלון לא מופיע.
   נקרא מ-enterVillage (village.js). השמות ב-lang.js תחת 'wel.' */
const WELCOME={
  delay:0.7,        // שניות אחרי הכניסה לכפר, כדי שהכפר יופיע קודם
  retry:1,          // חלון אחר פתוח (שיחה, יומן)? מנסים שוב כל כמה שניות
  closeAfter:3.5,   // שניות אחרי האיסוף עד שהחלון נסגר לבד
  fly:900,          // אלפיות שנייה: כמה זמן מספר עף לפס העליון
  flyMax:6,         // כמה מספרים לכל היותר עפים
  icon:{prod:'🏭',daily:'🎁',gift:'💌',quest:'📜',book:'📖'},
  bIcon:{mill:'🪵',mine:'⛏️'},
  auto:true,        // נפתח לבד בכניסה לכפר. הבדיקה מכבה אחרי שבדקה, כדי שלא יפריע לבדיקות אחרות
  // מצב
  timer:0,gifts:[],rows:null,done:null
};

/* ---- מה מחכה ---- */
// כל שורה: {kind, key, got:{משאב:כמה}} (ובקווסט ובספר גם פריטים ו-XP)
function welcomeRows(){
  const rows=[];
  for(const k in VILLAGE.b){const p=vSettle(k);if(!p)continue;const got={};
    for(const r in p.have){const w=Math.floor(p.have[r]);if(w>0)got[r]=w}
    if(Object.keys(got).length)rows.push({kind:'prod',key:k,got})}
  if(dailyCan()){const D=DAILY.days[dailyIdx()],got={};for(const r in D)if(r!=='chest')got[r]=D[r];rows.push({kind:'daily',key:dailyIdx(),got,chest:!!D.chest})}
  for(const g of WELCOME.gifts)rows.push({kind:'gift',key:g.from,got:{[g.res]:g.n},note:g.note});
  for(const id in QS().active){const q=QBY[id];if(q&&qReady(q)&&!qKind(q).talk&&!q.reward.rank&&!q.reward.story)rows.push({kind:'quest',key:id,got:q.reward})}
  const bp=bookPending();if(bp){const got={};for(let i=1;i<=bp;i++){const r=bookReward(BK().paid+i);for(const k in r)got[k]=(got[k]||0)+r[k]}rows.push({kind:'book',key:bp,got})}
  return rows;
}
const wTitle=w=>w.kind==='prod'?T('vil.'+w.key):w.kind==='daily'?T('daily.title')+' · '+T('daily.day',w.key+1):w.kind==='gift'?T('wel.gift',vEsc(w.key)):
  w.kind==='quest'?T('q.'+w.key)[0]:T('book.title');
const wIcon=w=>w.kind==='prod'?(WELCOME.bIcon[w.key]||WELCOME.icon.prod):WELCOME.icon[w.kind];
// פרס אחד כתג: משאב, פריט, XP, סיפור או דרגה
function wChip(k,v){
  if(k==='xp')return'<span class="res">'+QUESTS.icon.xp+' '+v+'</span>';
  if(k==='item')return'<span class="res">'+(gItem(v)?gIcon(v)+' '+gName(v):QUESTS.icon.item+' '+T('item.'+v))+'</span>';
  if(k==='story'||k==='rank')return qRewardLine({[k]:v});
  if(GEAR.items[k])return'<span class="res">'+gPic(k)+'</span>';
  return resOf(k)?resChip(k,shortN(v)):'';
}
const wGot=w=>Object.keys(w.got).map(k=>wChip(k,w.got[k])).join('')+(w.chest?'<span class="res"><img class="ri" src="icons/ui/daily-chest.png" alt=""></span>':'');

/* ---- החלון ---- */
function welcomeDraw(){
  const D=WELCOME.done;
  let s=winHead(T('wel.title'),'','h2')+'<div class="welbody">';
  if(!D){
    s+='<ul class="wellist">'+WELCOME.rows.map(w=>'<li class="welrow '+w.kind+'"><span class="welic">'+wIcon(w)+'</span><b>'+wTitle(w)+'</b><span class="welgot">'+wGot(w)+'</span></li>').join('')+'</ul>';
    s+='<button class="vbtn welgo" data-act="all">'+T('wel.all')+'</button>';
  }else{
    s+='<p class="weldone">'+T('wel.done')+'</p><div class="welsum">'+Object.keys(D.got).map(k=>wChip(k,D.got[k])).join('')+'</div>';
    s+='<p class="welnext">'+D.next+'</p><button class="vbtn ghost welgo" data-act="close">'+T('wel.go')+'</button>';
  }
  $('welWin').innerHTML=s+'</div>';
}
function welcomeOpen(){
  if(!S||!S.vil)return false;
  WELCOME.rows=welcomeRows();WELCOME.done=null;
  if(!WELCOME.rows.length)return false;
  if(S.mode==='play')S.mode='welcome';joy=null;
  welcomeDraw();$('ovWelcome').hidden=false;sfx('ui');
  return true;
}
function welcomeClose(){
  clearTimeout(WELCOME.timer);WELCOME.timer=0;
  $('ovWelcome').hidden=true;if(S&&S.mode==='welcome')S.mode='play';
  WELCOME.done=null;dailyBtn();
}

/* ---- אסוף הכל ---- */
function welcomeCollect(){
  const rows=WELCOME.rows||[],got={},add=(k,v)=>{if(typeof v==='number')got[k]=(got[k]||0)+v};
  let big=false;
  for(const w of rows){
    if(w.kind==='prod'){const p=vSettle(w.key);
      for(const r in p.have){const n=Math.floor(p.have[r]);if(n>0){bagAdd(r,n);questEvent('collect',r,n);p.have[r]-=n;add(r,n)}}}
    else if(w.kind==='daily'){const r=dailyClaim();if(r){for(const k in r.got)add(k,r.got[k]);big=big||r.big}}
    else if(w.kind==='gift')for(const k in w.got)add(k,w.got[k]);   // כבר בתרמיל (visitInbox)
    else if(w.kind==='quest'){const q=QBY[w.key];if(questClaim(w.key,true))for(const k in q.reward)if(k!=='item')add(k,q.reward[k])}
    else if(w.kind==='book'){const r=bookClaim(true);if(r)for(const k in r)add(k,r[k])}
  }
  WELCOME.gifts=[];saveNow();
  celebrate(P.x,P.y,big?'rank':'quest','✓');   // חגיגה אחת לכל האיסוף
  welcomeFly(got);
  const G=typeof guideGoal==='function'?guideGoal():null,q=qTracked();   // המטרה הבאה, כמו בשורה למעלה (guide.js)
  WELCOME.done={got,next:G?T('g.now')+' '+G.icon+' '+G.text:q?T('wel.next',T('q.'+q.id)[0]):T('wel.nextGate')};
  welcomeDraw();dailyBtn();bookBadge();
  WELCOME.timer=setTimeout(()=>{if(!$('ovWelcome').hidden)welcomeClose()},WELCOME.closeAfter*1000);
  return got;
}
// המספרים עפים מהכפתור אל הפס העליון. רק קישוט: אם אין אנימציה בדפדפן, פשוט לא רואים
function welcomeFly(got){
  const from=$('welWin').querySelector('.welgo'),to=$('vBag');if(!from||!to||!from.animate)return;
  const a=from.getBoundingClientRect(),b=to.getBoundingClientRect();
  Object.keys(got).filter(k=>resOf(k)).slice(0,WELCOME.flyMax).forEach((k,i)=>{
    const el=document.createElement('div');el.className='welfly';el.innerHTML=resPic(k)+'+'+shortN(got[k]);
    el.style.left=(a.x+a.width/2)+'px';el.style.top=(a.y)+'px';document.body.appendChild(el);
    const dx=b.x+b.width/2-(a.x+a.width/2)+(i-2)*28,dy=b.y+b.height/2-a.y;
    el.animate([{transform:'translate(-50%,0) scale(1)',opacity:1},{transform:'translate(calc(-50% + '+dx*0.4+'px),'+(dy*0.2-40)+'px) scale(1.2)',opacity:1,offset:0.35},
      {transform:'translate(calc(-50% + '+dx+'px),'+dy+'px) scale(.6)',opacity:0.2}],{duration:WELCOME.fly,delay:i*90,easing:'ease-in',fill:'forwards'});
    setTimeout(()=>el.remove(),WELCOME.fly+i*90+50);
  });
}

/* ---- חיבורים ---- */
// בכניסה לכפר (village.js): פותחים אחרי רגע, כשאין חלון אחר פתוח
function welcomeVillage(){
  clearTimeout(WELCOME.timer);if(!WELCOME.auto)return;
  const go=()=>{WELCOME.timer=0;if(!S||!S.vil||!$('ovWelcome').hidden)return;
    if(S.mode!=='play'||!$('npcDlg').hidden||!$('qLog').hidden||!$('ovGear').hidden||!$('vPanel').hidden){WELCOME.timer=setTimeout(go,WELCOME.retry*1000);return}
    welcomeOpen()};
  WELCOME.timer=setTimeout(go,WELCOME.delay*1000);
}
// מתנה מחבר שהגיעה (visitInbox). אם החלון פתוח, היא נכנסת אליו. אם כבר נאסף או נסגר, הודעה קצרה אחת
function welcomeGift(g){
  WELCOME.gifts.push(g);
  const open=!$('ovWelcome').hidden;
  if(open&&!WELCOME.done){WELCOME.rows=welcomeRows();welcomeDraw();return}
  if(!open&&WELCOME.timer)return;   // החלון עומד להיפתח: המתנה תופיע בו
  WELCOME.gifts.pop();if(P&&S)celebrate(P.x,P.y-20,'quest','🎁');
  banner(T('visit.got',vEsc(g.from),'+'+g.n+' '+T('res.'+g.res),T('visit.note.'+g.note)),C.gold);
}
$('welWin').addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  if(b.dataset.act==='close'){welcomeClose();sfx('ui');return}
  if(b.dataset.act==='all'&&!WELCOME.done)welcomeCollect();
});

/* ---- תור קפיצות (בדיקת החוויה, 1.11: "מטח בכניסה לכפר") ----
   חלון אחד בכל פעם: "בזמן שלא היית" מחכה לשיחה פתוחה, ושיחת העלילה (storySay ב-story.js) מחכה לחלון הזה.
   הודעות (banner): לכל היותר אחת בכל BANNER.gap שניות. מה שמגיע בינתיים מחכה בתור, ומהתור נשארות רק האחרונות (max), כדי שלא יגיעו הודעות ישנות */
const BANNER={gap:2,max:2,q:[],last:-1e9,t:0,shown:0};
{const show=banner;
  const pump=()=>{BANNER.t=0;if(!BANNER.q.length)return;
    const w=BANNER.last+BANNER.gap*1000-Date.now();if(w>0){BANNER.t=setTimeout(pump,w);return}
    const [t,c]=BANNER.q.shift();BANNER.last=Date.now();BANNER.shown++;show(t,c);
    if(BANNER.q.length)BANNER.t=setTimeout(pump,BANNER.gap*1000)};
  banner=function(txt,col){if(BANNER.q.some(b=>b[0]===txt))return;BANNER.q.push([txt,col]);while(BANNER.q.length>BANNER.max)BANNER.q.shift();if(!BANNER.t)pump()};
}
