/* הפונדק (roadmap משימה ע, 4.11.2026): המבנה של דודה פלפל בדרום הכפר (VILLAGE.b.inn ב-village.js), עם שלושה דברים:
   1. לוח משימות: כל יום 3 משימות לפי התאריך, ממאגר שמתחבר למה שיש בעולם (נמסיס, עומק הצל, החוק היומי, סקילים, סוג הנזק שהבוס חלש אליו, חפץ טוב).
      כל משימה היא קווסט רגיל ב-QUESTS.list (quests.js) מהסוג 'inn': לוקחים ומקבלים פרס רק בפונדק. הדיווח דרך questEvent, כמו כל קווסט.
   2. שמועה: שורה שמתחלפת, שמכוונת לנמסיס שמחכה או למבוקש של היום (hunt.js).
   3. מנוחה: פעם ביום, ברכה לכניסה הבאה לעולם (יותר XP לכמה דקות), עם אייקון קטן בפס העליון בעולם.
   ובכפר: קיצור 🍲 בשורה העליונה (hudrank.js), שמופיע עם נקודה אדומה כשיש פרס שמחכה בפונדק.
   החיבור: innSvcs ב-npcSvcs ו-bwMain (bwin.js), innUpdate ב-worldUpdate (world.js), innXpK ב-statKillXp (stats.js), innDot ב-npcUpdate (npc.js).
   הדיווחים: 'nemesis' (nemesis.js), 'depth' (depths.js), 'sklv' (wsklvl.js), 'qual' (drops.js), 'weak' (combat.js). נשמר ב-SAVE.inn. הטקסטים תחת 'inn.' ב-lang.js */

const INN={
  board:3,              // כמה משימות על הלוח בכל יום
  /* המאגר. כל שורה: מטרה (obj, כמו ב-quests.js), פרס, ומתי היא יכולה להופיע (need). gem: הסיכוי שהיום יש בפרס גם אבן חן.
     depth: n נקבע כל יום לפי השיא (dpUp קומות מעליו, לפחות dpMin). weak: what נקבע כל יום לסוג הנזק שהבוס היה חלש אליו */
  pool:{
    iNem:  {obj:[{type:'nemesis',n:1}],reward:{coins:70,iron:6},gem:0.6,need:()=>typeof NS==='function'&&NS().list.length>0},
    iDepth:{obj:[{type:'depth',n:5,max:true}],reward:{coins:60,silver:4},gem:0.5,need:()=>typeof storyOpen==='function'&&storyOpen('end')},
    iMut:  {obj:[{type:'mut',n:10}],reward:{coins:40,wood:25,stone:20},gem:0.2,need:()=>typeof mutOpen==='function'&&mutOpen()},
    iSklv: {obj:[{type:'sklv',n:1}],reward:{coins:35,essence:3},gem:0.3,need:()=>typeof wslIds==='function'&&wslIds().length>0},
    iWeak: {obj:[{type:'weak',what:'fire',n:15}],reward:{coins:40,bone:8,copper:4},gem:0.3},
    iQual: {obj:[{type:'qual',n:1}],reward:{coins:45,copper:6,hide:4},gem:0.3},
    iHunt: {obj:[{type:'kill',what:'any',n:60}],reward:{coins:30,wood:15},gem:0.15}   // תמיד אפשר: כדי שיהיו 3 גם לשחקן שעוד אין לו הכל
  },
  dpMin:3,dpUp:2,
  gemN:1,               // כמה אבני חן כשיש
  qual:105,             // "חפץ טוב": איכות מעל זה (itemroll.js)
  mutMin:60,            // המטרה של החוק היומי נספרת בדקות: כל כך הרבה שניות בעולם = דקה
  rest:{min:10,xp:0.10,perLv:0.02},   // מנוחה: כמה דקות, כמה XP נוסף, ועוד כמה בכל רמה של הפונדק מעל 1
  rumorEvery:45,        // כל כמה שניות השמועה מתחלפת
  icon:'🍲'
};

/* ---- המאגר נכנס לטבלת הקווסטים, כקווסטים רגילים ---- */
QUESTS.kinds.inn={talk:true,repeat:true,board:true};   // talk: רק בפונדק, לא ביומן. repeat: אפשר שוב ביום אחר
for(const id in INN.pool){const p=INN.pool[id],q={id,giver:'inn',kind:'inn',obj:p.obj.map(o=>({...o})),reward:{...p.reward}};QUESTS.list.push(q);QBY[id]=q}

const IN=()=>{const s=SAVE.inn&&typeof SAVE.inn==='object'?SAVE.inn:(SAVE.inn={});s.got=s.got||{};return s};
const innDay=()=>qDay();
const innHash=(s,k)=>{let h=k>>>0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h};
// סוג הנזק שהבוס היה חלש אליו עכשיו: מה שהכי פחות השתמשת בו ממה שביד (כמו makeBoss ב-boss.js)
function innWeak(){
  const t=(P&&P.track&&P.track.types)||{},held=typeof bossHeld==='function'?bossHeld().filter(Boolean):[];
  const L=(held.length?held:Object.keys(DMG.types)).slice().sort((a,b)=>(t[a]||0)-(t[b]||0));return L[0]||'fire';
}
// היום: אילו 3 על הלוח, והמספרים של היום (קומה, סוג נזק, אבן חן). אותו לוח כל היום
function innRoll(){
  const I=IN(),day=innDay();
  if(I.day!==day||!Array.isArray(I.ids)){
    const Q=QS();for(const id in INN.pool)if(Q.active[id]&&!qReady(QBY[id]))delete Q.active[id];   // משימה של אתמול שלא נגמרה יורדת. מוכנה נשארת עד שלוקחים
    const ok=Object.keys(INN.pool).filter(id=>!INN.pool[id].need||INN.pool[id].need());
    I.ids=ok.sort((a,b)=>innHash(day+a,7)-innHash(day+b,7)).slice(0,INN.board);
    I.day=day;I.weak=innWeak();I.dp=Math.max(INN.dpMin,(typeof depthsBest==='function'?depthsBest():0)+INN.dpUp);I.got={};
  }
  innApply();return I.ids;
}
// המספרים של היום נכנסים לשורות בטבלה (גם אחרי טעינה מחדש)
function innApply(){
  const I=IN(),day=I.day||innDay();
  for(const id in INN.pool){const p=INN.pool[id],q=QBY[id];q.reward={...p.reward};
    if(innHash(day+id,23)%100<p.gem*100)q.reward.gem=INN.gemN;
    for(const o of q.obj){if(o.type==='depth')o.n=I.dp||INN.dpMin;if(o.type==='weak')o.what=I.weak||'fire'}
    innFreeze(id)}
}
// משימה שנלקחה שומרת את היעד והפרס של היום שבו נלקחה (fz על הרשומה הפעילה), כדי שמחר היא לא תאבד אבן חן או תפסיק להיות מוכנה (ביקורת 6.11, פריט 3)
function innFreeze(id){const a=QS().active[id],q=QBY[id];if(!a||!q)return;
  if(!a.fz){a.fz={reward:{...q.reward},obj:q.obj.map(o=>({n:o.n,what:o.what}))};return}
  q.reward={...a.fz.reward};a.fz.obj.forEach((o,i)=>{const t=q.obj[i];if(t){t.n=o.n;if(o.what!=null)t.what=o.what}})}
// מותר לקחת מהלוח: על הלוח של היום, ועוד לא נלקח פרס עליה היום (qOpen ב-quests.js)
const innOpen=q=>(IN().ids||[]).includes(q.id)&&!IN().got[q.id];
const innReady=()=>Object.keys(INN.pool).some(id=>QS().active[id]&&qReady(QBY[id]))||QUESTS.list.some(q=>q.giver==='inn'&&QS().active[q.id]&&qReady(q));

/* ---- הלוח ---- */
function innCard(id){
  const q=QBY[id],Q=QS(),a=Q.active[id];
  return qCard(q,a&&qReady(q)?'claim':a?'track':IN().got[id]?'done':'accept').replace(/data-act="(accept|claim|track)"/,'data-act="inn$1"');
}
function innBoardHtml(){
  let h='<p class="innrum">🗣️ '+innRumor()+'</p>';
  if(qEarly())return h+'<p class="next">'+T('inn.early')+'</p>';
  const ids=innRoll();h+='<p class="bwlead">'+T('inn.boardWhy')+'</p><div class="innboard">'+ids.map(innCard).join('')+'</div>';
  return h;
}
// השמועה: נמסיס שמחכה, המבוקש של היום, או רכילות סתם. מתחלפת כל rumorEvery שניות
function innRumor(){
  const L=[],day=innDay();
  if(typeof NS==='function')for(const N of NS().list)L.push(T('inn.rum.nem',nemName(N),T('w.region.'+N.reg)));
  if(typeof huntToday==='function'&&!huntDone()&&!qEarly()){const H=huntToday();L.push(T('inn.rum.hunt',huntNm(H.name),T('w.region.'+H.reg)))}
  const G=T('inn.rum.gen');if(!L.length||Array.isArray(G))L.push(G[innHash(day,5)%G.length]);
  return L[Math.floor(Date.now()/1000/INN.rumorEvery)%L.length];
}

/* ---- מנוחה ---- */
const innRestK=()=>INN.rest.xp+INN.rest.perLv*Math.max(0,vLv('inn')-1);
const innRested=()=>IN().rest===innDay();
const innBuffOn=()=>(IN().buff||0)>Date.now();
const innXpK=()=>S&&S.wd&&innBuffOn()?1+(IN().buffK||INN.rest.xp):1;   // statKillXp (stats.js)
function innRestHtml(){
  const pc=Math.round(innRestK()*100);
  let h='<p class="bwlead">'+T('inn.restWhy',pc,INN.rest.min)+'</p>';
  if(innBuffOn())h+='<p class="next">'+INN.icon+' '+T('inn.restOn',Math.ceil((IN().buff-Date.now())/60e3))+'</p>';
  else if(IN().arm)h+='<p class="next">'+INN.icon+' '+T('inn.restArmed')+'</p>';
  else if(innRested())h+='<p class="next">'+T('inn.restDone')+'</p>';
  else h+='<button class="vbtn vmain" data-act="innRest">🛏️ '+T('inn.restBtn')+'</button>';
  return h;
}
function innRest(){
  const I=IN();if(innRested())return false;
  I.rest=innDay();I.arm=true;I.buffK=innRestK();saveNow();celebrate(P.x,P.y-10,'quest',INN.icon);banner(INN.icon+' '+T('inn.restGot'),C.gold);return true;
}
// הכניסה הבאה לעולם: הברכה מתחילה
function innStart(){const I=IN();if(!I.arm)return;I.arm=false;I.buff=Date.now()+INN.rest.min*60e3;saveNow();banner(INN.icon+' '+T('inn.restStart',Math.round((I.buffK||INN.rest.xp)*100),INN.rest.min),C.gold)}

/* ---- השירותים: לשוניות אצל דודה פלפל (npcSvcs) ובחלון המבנה (bwMain, bwin.js) ---- */
const innSvcs=id=>id==='inn'?[{id:'board',label:'📋 '+T('inn.board'),dot:innReady(),html:innBoardHtml},{id:'rest',label:'🛏️ '+T('inn.rest'),dot:!innRested(),html:innRestHtml}]:[];
// לחיצות בלוח ובמנוחה, בחלון המבנה ובשיחה. לפני המטפלים הרגילים (capture), כמו ב-bwin.js
for(const el of [$('vPanel'),$('npcDlg')])el.addEventListener('click',e=>{
  const b=e.target.closest('button[data-act^="inn"]');if(!b||!S.vil)return;
  e.stopImmediatePropagation();const a=b.dataset.act,id=b.dataset.q;
  if(a==='innaccept'&&qOpen(QBY[id])){qStart(QBY[id]);innFreeze(id);saveNow();sfx('ui')}
  else if(a==='innclaim'&&questClaim(id)){if(INN.pool[id])IN().got[id]=innDay();saveNow()}
  else if(a==='inntrack'){QS().track=QS().track===id?null:id;saveNow()}
  else if(a==='innRest')innRest();
  questTrack();innDot();S.vil.ui='';if(el.id==='npcDlg')npcDialog();else villageHud();
},true);

/* ---- בעולם: כמה זמן משחקים עם החוק היומי, והברכה ---- */
const INNW={mt:0,chip:0};
function innUpdate(dt){
  if(!S.wd||S.room)return;
  if(IN().arm)innStart();
  if(typeof mutNow==='function'&&mutNow()&&(INNW.mt+=dt)>=INN.mutMin){INNW.mt-=INN.mutMin;questEvent('mut')}
  if((INNW.chip-=dt)<=0){INNW.chip=1;innChip()}
}
// אייקון קטן בפס העליון בעולם, ליד השבב של החוק היומי, כל עוד הברכה פעילה
function innChip(){
  let b=$('innChip');const on=!!S.wd&&innBuffOn();
  if(!b){if(!on)return;b=document.createElement('span');b.id='innChip';b.className='innchip';const hud=$('whud');if(!hud)return;hud.insertBefore(b,$('wBag')||null)}
  b.hidden=!on;if(on){const m=Math.ceil((IN().buff-Date.now())/60e3);b.textContent=INN.icon+m+"'";b.setAttribute('aria-label',T('inn.restOn',m))}
}
// הריגה (kill ב-combat.js): בעולם, עם סוג הנזק של המכה האחרונה (onHit ב-dmg.js)
function innKill(e){if(S.wd&&!S.room&&e.lt)questEvent('weak',e.lt)}
// חפץ שנאסף בעולם (dropTake ב-drops.js)
function innGear(id){if(S.wd&&typeof gQ==='function'&&gQ(id)>INN.qual)questEvent('qual')}

/* ---- הקיצור בכפר: 🍲 פותח את הפונדק מכל מקום, ונקודה אדומה כשיש פרס שמחכה ---- */
(function(){const top=$('vTop');if(!top)return;const b=document.createElement('button');b.id='innBtn';b.className='dgift innbtn';b.hidden=true;b.setAttribute('aria-label',T('vil.inn'));
  b.innerHTML='<span aria-hidden="true">'+INN.icon+'</span><i class="innd" hidden></i>';top.appendChild(b);
  b.addEventListener('click',()=>{if(!S.vil)return;npcTalk('inn');S.vil.dlgStay=true;S.vil.dlgTab='board';npcDialog()});
  HUDRANK.rank.innBtn={village:5};b.addEventListener('click',()=>{const n=hudUses();n.innBtn=(n.innBtn||0)+1})})();
// כל שנייה בכפר (npcUpdate): לוח חדש בחצות, והנקודה על הקיצור
const INNV={t:0};
function innTick(dt){if((INNV.t-=dt)>0)return;INNV.t=1;innRoll();innDot()}
// הקיצור מופיע רק כשיש פרס שמחכה בפונדק (כמו 📦 האיסוף), כדי לא להעמיס את השורה העליונה
function innDot(){const b=$('innBtn'),d=b&&b.querySelector('.innd');if(!d)return;const on=innReady();if(d.hidden===on){d.hidden=!on;b.hidden=!on;if(on&&typeof tipOnce==='function')tipOnce('inn',[],'#innBtn')}}   // טיפ ראשון (firsttips.js)

(function(){const st=document.createElement('style');st.textContent=
  '.innbtn{position:relative}.innbtn .innd{position:absolute;top:2px;inset-inline-end:2px;width:10px;height:10px;border-radius:50%;background:var(--blood,#D8443A);box-shadow:0 0 0 2px #0008}.innbtn .innd[hidden]{display:none}'+
  '.innrum{margin:0 0 6px;padding:5px 9px;border-radius:8px;background:#0003;border-inline-start:3px solid #C08A52;font-style:italic}'+
  '.innboard{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:6px}'+
  '.innchip{flex:none;padding:2px 7px;border-radius:12px;background:#2C1E14e6;border:1.5px solid #C9A24A;color:#F4C74F;font:700 12px Heebo,system-ui,sans-serif;pointer-events:none}.innchip[hidden]{display:none}';
  document.head.appendChild(st)})();
