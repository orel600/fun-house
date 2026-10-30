/* קווסטים: תמיד יש מה לעשות ולמה לשאוף (ניר, game-design.md "החלטות של ניר").
   כל קווסט הוא שורה ב-QUESTS.list, וקווסט חדש = שורה חדשה, בלי קוד. השם ומשפט הדיאלוג ב-lang.js תחת 'q.<id>': [שם, משפט].
   id: שם קבוע. giver: מי נותן (מבנה בכפר, ובהמשך NPC). צריך להיות בנוי כדי לתת. kind: הסוג, ההתנהגות שלו ב-QUESTS.kinds.
   obj: מטרות, מתוך חמש:
     kill    להפיל n מ-what: grunt, shield, wisp, wanted, boss, או any (כל אויב)
     collect להביא הביתה n מ-what: משאב (כל משאב ב-RES, resources.js), מהייצור בכפר או מהשלל של ריצה
     reach   להגיע n פעמים ל-what: arena (יציאה לזירה), room (חדר הבונוס)
     upgrade המבנה what ברמה n לפחות. נבדק לפי הכפר עצמו, אז מה שכבר בנית נספר
     win     לנצח בוס n פעמים. אפשר בתנאי: noHit (בלי לחטוף פגיעה כל עוד הבוס בזירה), under (לפני שעברו כך וכך שניות בריצה)
   reward: משאבים לתרמיל לפי השם, xp לדמות, item: פריט לתרמיל (השם ב-lang.js תחת 'item.<id>'). id של פריט ציוד מ-GEAR.items (gear.js) נכנס לתרמיל כציוד שאפשר ללבוש.
   req: תנאי פתיחה. level: רמת דמות, quest: קווסט שכבר הושלם, b: {מבנה:רמה}.
   המשחק מדווח מה קרה דרך questEvent(סוג, מה, כמה): שורה אחת בכל מקום (kill, hurt, win, collect, upgrade, reach). המנוע מחליט לאיזה קווסט זה שייך.
   ההתקדמות נשמרת רק ב-SAVE.quests (save.js). בזירה היא נשמרת יחד עם השלל, בסוף הריצה */

const QUESTS={
  // auto: פעיל לבד, בלי לקבל. repeat: אפשר לקחת שוב אחרי שהושלם. daily: נבחר מהמאגר כל יום מחדש
  kinds:{
    village:{},
    hunt:{repeat:true},
    daily:{auto:true,daily:true},
    achievement:{auto:true},
    rank:{},     // בהמשך: קווסט עלייה בדרגה, כל 20 רמות
    world:{}     // בהמשך: NPC שמוצאים בעולם הפתוח
  },
  daily:4,       // כמה קווסטים יומיים בכל יום. מתחלפים בחצות, לפי השעון בטלפון
  list:[
    // ---- כפר: נותנים המבנים, ומובילים את השחקן בכפר ובזירה ----
    {id:'firstMill',giver:'center',kind:'village',obj:[{type:'upgrade',what:'mill',n:1}],reward:{coins:15,wood:10}},
    {id:'firstMine',giver:'center',kind:'village',obj:[{type:'upgrade',what:'mine',n:1}],reward:{coins:15,stone:10}},
    {id:'grunts',giver:'center',kind:'village',obj:[{type:'kill',what:'grunt',n:15}],reward:{coins:20,xp:20}},
    {id:'firstBoss',giver:'center',kind:'village',obj:[{type:'win',n:1}],reward:{coins:60,iron:8,xp:80},req:{quest:'grunts'}},
    {id:'forge',giver:'center',kind:'village',obj:[{type:'upgrade',what:'forge',n:1}],reward:{stone:15,iron:3},req:{quest:'grunts'}},
    {id:'market',giver:'center',kind:'village',obj:[{type:'upgrade',what:'market',n:1}],reward:{coins:20},req:{quest:'firstMine'}},
    {id:'center2',giver:'center',kind:'village',obj:[{type:'upgrade',what:'center',n:2}],reward:{coins:40,xp:50},req:{quest:'forge'}},
    {id:'millWood',giver:'mill',kind:'village',obj:[{type:'collect',what:'wood',n:30}],reward:{coins:20}},
    {id:'wisps',giver:'mill',kind:'village',obj:[{type:'kill',what:'wisp',n:15}],reward:{wood:25,xp:20},req:{quest:'millWood'}},
    {id:'mill3',giver:'mill',kind:'village',obj:[{type:'upgrade',what:'mill',n:3}],reward:{wood:40,coins:30},req:{quest:'center2'}},
    {id:'mineStone',giver:'mine',kind:'village',obj:[{type:'collect',what:'stone',n:20}],reward:{coins:20,wood:10}},
    {id:'mine3',giver:'mine',kind:'village',obj:[{type:'upgrade',what:'mine',n:3},{type:'collect',what:'iron',n:10}],reward:{stone:40,iron:10},req:{quest:'center2'}},
    {id:'bones',giver:'forge',kind:'village',obj:[{type:'collect',what:'bone',n:10}],reward:{iron:5,coins:20}},
    {id:'shields',giver:'forge',kind:'village',obj:[{type:'kill',what:'shield',n:15}],reward:{iron:6,xp:20},req:{quest:'bones'}},
    {id:'door',giver:'market',kind:'village',obj:[{type:'reach',what:'room',n:1}],reward:{coins:30}},
    // ---- ציד: אפשר לקחת שוב ושוב ----
    {id:'huntWanted',giver:'market',kind:'hunt',obj:[{type:'kill',what:'wanted',n:1}],reward:{coins:40}},
    {id:'huntFast',giver:'forge',kind:'hunt',obj:[{type:'win',n:1,under:240}],reward:{iron:10,xp:40},req:{quest:'firstBoss'}},
    // ---- יומיים: 4 מהמאגר הזה בכל יום ----
    {id:'dGrunts',giver:'center',kind:'daily',obj:[{type:'kill',what:'grunt',n:40}],reward:{coins:20}},
    {id:'dShields',giver:'center',kind:'daily',obj:[{type:'kill',what:'shield',n:12}],reward:{coins:15,iron:2}},
    {id:'dWisps',giver:'center',kind:'daily',obj:[{type:'kill',what:'wisp',n:12}],reward:{coins:15,bone:3}},
    {id:'dAny',giver:'center',kind:'daily',obj:[{type:'kill',what:'any',n:100}],reward:{coins:30}},
    {id:'dWanted',giver:'center',kind:'daily',obj:[{type:'kill',what:'wanted',n:1}],reward:{coins:25}},
    {id:'dBoss',giver:'center',kind:'daily',obj:[{type:'win',n:1}],reward:{coins:30,iron:3}},
    {id:'dRuns',giver:'center',kind:'daily',obj:[{type:'reach',what:'arena',n:2}],reward:{coins:15}},
    {id:'dRoom',giver:'center',kind:'daily',obj:[{type:'reach',what:'room',n:1}],reward:{coins:20}},
    {id:'dWood',giver:'center',kind:'daily',obj:[{type:'collect',what:'wood',n:20}],reward:{coins:15}},
    {id:'dStone',giver:'center',kind:'daily',obj:[{type:'collect',what:'stone',n:15}],reward:{coins:15}},
    {id:'dBones',giver:'center',kind:'daily',obj:[{type:'collect',what:'bone',n:5}],reward:{coins:15,wood:10}},
    {id:'dCoins',giver:'center',kind:'daily',obj:[{type:'collect',what:'coins',n:30}],reward:{stone:15,wood:15}},
    // ---- הישגים: פעילים תמיד, פעם אחת ----
    {id:'aHunter',giver:null,kind:'achievement',obj:[{type:'kill',what:'any',n:500}],reward:{coins:100,item:'qTrophy'}},
    {id:'aClean',giver:null,kind:'achievement',obj:[{type:'win',n:1,noHit:true}],reward:{iron:20,item:'qSock'}},
    {id:'aSpeed',giver:null,kind:'achievement',obj:[{type:'win',n:1,under:150}],reward:{coins:80,xp:60}},
    {id:'aBuilder',giver:null,kind:'achievement',obj:[{type:'upgrade',what:'center',n:3}],reward:{coins:100,stone:50}},
    {id:'aWanted',giver:null,kind:'achievement',obj:[{type:'kill',what:'wanted',n:5}],reward:{coins:60,item:'qCrown'}}
  ],
  icon:{xp:'✨',item:'🎁',track:'📜'}    // אייקונים לפרס (מעבר למשאבים ב-RES) ולקו המעקב
};

const QBY={};for(const q of QUESTS.list)QBY[q.id]=q;
const QS=()=>SAVE.quests;
const qKind=q=>QUESTS.kinds[q.kind]||{};
const qDay=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
const qRun=()=>S.q||(S.q={bossHit:0});   // מה שקרה בריצה הזו, לתנאי ניצחון. S חדש בכל ריצה

/* ---- מצב ---- */
function qProg(q,i){
  const o=q.obj[i];if(o.type==='upgrade')return Math.min(o.n,vLv(o.what));
  const a=QS().active[q.id];return Math.min(o.n,a?a.p[i]||0:0);
}
const qReady=q=>!!QS().active[q.id]&&q.obj.every((o,i)=>qProg(q,i)>=o.n);
function qReq(q){
  const r=q.req||{};
  if(q.giver&&VILLAGE.b[q.giver]&&!vLv(q.giver))return false;
  if(r.level&&SAVE.hero.level<r.level)return false;
  if(r.quest&&!QS().done[r.quest])return false;
  if(r.b)for(const k in r.b)if(vLv(k)<r.b[k])return false;
  return true;
}
// אפשר לקבל עכשיו מהיומן
const qOpen=q=>{const K=qKind(q);return !K.auto&&!QS().active[q.id]&&(K.repeat||!QS().done[q.id])&&qReq(q)};
function qStart(q){QS().active[q.id]={p:q.obj.map(()=>0)};if(!qKind(q).auto)QS().track=q.id}

// בכל כניסה לכפר: יום חדש מביא קווסטים יומיים חדשים, והישגים שנפתחו מתחילים לבד
function questsRefresh(){
  const Q=QS();
  for(const id in Q.active)if(!QBY[id])delete Q.active[id];   // קווסט שהוסר מהטבלה
  const day=qDay();
  if(Q.day!==day){
    for(const id of Q.daily)delete Q.active[id];
    const pool=QUESTS.list.filter(q=>qKind(q).daily&&qReq(q)).sort(()=>Math.random()-0.5);
    Q.daily=pool.slice(0,QUESTS.daily).map(q=>q.id);Q.day=day;
    for(const id of Q.daily)qStart(QBY[id]);
  }
  for(const q of QUESTS.list){const K=qKind(q);if(K.auto&&!K.daily&&!Q.active[q.id]&&!Q.done[q.id]&&qReq(q))qStart(q)}
  if(Q.track&&!Q.active[Q.track])Q.track=null;
  $('qLog').hidden=true;   // חוזרים הביתה עם יומן סגור, ולא עם מה שהיה פתוח לפני הריצה
}

/* ---- מה שקרה במשחק ---- */
function questEvent(type,what,n=1){
  if(type==='hurt'){if(S.boss)qRun().bossHit++;return}
  const Q=QS();let moved=false;
  for(const id in Q.active){
    const q=QBY[id],a=Q.active[id];if(!q)continue;
    q.obj.forEach((o,i)=>{
      if(o.type!==type||type==='upgrade'||a.p[i]>=o.n)return;
      if(o.what&&o.what!=='any'&&o.what!==what)return;
      if(type==='win'&&(o.noHit&&qRun().bossHit||o.under&&S.t>o.under))return;
      a.p[i]=Math.min(o.n,(a.p[i]||0)+n);moved=true;
    });
    if(!a.r&&qReady(q)){a.r=true;moved=true;banner(T('q.ready',T('q.'+id)[0]),C.gold)}
  }
  if(moved||type==='reach')questTrack();   // reach: גם בתחילת ריצה, כדי שקו המעקב יופיע מיד
}
function questClaim(id){
  const q=QBY[id],Q=QS();if(!q||!qReady(q))return false;
  for(const k in q.reward){const v=q.reward[k];if(k==='xp')SAVE.hero.xp+=v;else if(k==='item')bagAdd(v,1);else bagAdd(k,v)}
  delete Q.active[id];Q.done[id]=(Q.done[id]||0)+1;
  if(Q.track===id)Q.track=null;
  saveNow();
  celebrate(P.x,P.y-10,'quest');
  banner(T('q.claimed',T('q.'+id)[0]),C.gold);
  return true;
}

/* ---- ממשק: היומן בכפר, וקו מעקב בזירה ---- */
const qWhat=o=>o.type==='kill'?T('foe.'+o.what):o.type==='collect'?resName(o.what):o.type==='reach'?T('place.'+o.what):o.type==='upgrade'?T('vil.'+o.what):'';
const qObjTxt=(q,i)=>{const o=q.obj[i];return T('qo.'+o.type,qWhat(o),o.n)+(o.noHit?T('qo.noHit'):'')+(o.under?T('qo.under',fmt(o.under)):'')};
const qRewardLine=r=>Object.keys(r).map(k=>'<span class="res">'+(k==='item'?QUESTS.icon.item+' '+T('item.'+r[k]):(resIcon(k)||QUESTS.icon[k])+' '+r[k])+'</span>').join('');
// הקווסט שמוצג בזירה: זה שבחרת לעקוב אחריו, ואם אין, הראשון שעוד לא הושלם
function qTracked(){
  const Q=QS(),ids=Object.keys(Q.active).filter(id=>QBY[id]);
  if(Q.track&&Q.active[Q.track])return QBY[Q.track];
  const open=ids.map(id=>QBY[id]).filter(q=>!qReady(q));
  return open.find(q=>!qKind(q).auto)||open.find(q=>qKind(q).daily)||null;
}
function questTrack(){
  const el=$('qTrack'),q=qTracked();
  if(!q){el.hidden=true;return}
  el.hidden=false;
  el.textContent=QUESTS.icon.track+' '+T('q.'+q.id)[0]+' · '+q.obj.map((o,i)=>qObjTxt(q,i)+' '+qProg(q,i)+'/'+o.n).join(' · ');
}

function qCard(q,act){
  const [name,say]=T('q.'+q.id),Q=QS(),on=!!Q.active[q.id];
  let h='<div class="qc'+(act==='claim'?' ready':'')+'"><b>'+name+'</b><small>'+(q.giver?T('vil.'+q.giver)+' · ':'')+T('q.kind.'+q.kind)+'</small>';
  if(say)h+='<p class="say">'+say+'</p>';
  h+='<ul>'+q.obj.map((o,i)=>'<li>'+qObjTxt(q,i)+' <em>'+(on||o.type==='upgrade'?qProg(q,i):0)+'/'+o.n+'</em></li>').join('')+'</ul>';
  h+='<div class="qrow"><div class="cost">'+qRewardLine(q.reward)+'</div>';
  if(act==='claim')h+='<button class="vbtn" data-q="'+q.id+'" data-act="claim">'+T('q.claim')+'</button>';
  else if(act==='accept')h+='<button class="vbtn" data-q="'+q.id+'" data-act="accept">'+T('q.accept')+'</button>';
  else if(act==='track')h+='<button class="qtrk" data-q="'+q.id+'" data-act="track"'+(Q.track===q.id?' aria-pressed="true"':'')+'>'+T(Q.track===q.id?'q.tracking':'q.track')+'</button>';
  else if(act==='done')h+='<p class="next">'+T('q.doneToday')+'</p>';
  return h+'</div></div>';
}
function questLog(){
  const Q=QS(),act=Object.keys(Q.active).map(id=>QBY[id]).filter(Boolean),L=QUESTS.list;
  const sec=(k,cards)=>cards.length?'<h4>'+T('q.sec.'+k)+'</h4>'+cards.join(''):'';
  let h='<div class="qhead"><h3>'+T('q.log')+'</h3><button class="qx" data-act="close" aria-label="'+T('q.close')+'">✕</button></div>';
  h+=sec('ready',act.filter(qReady).map(q=>qCard(q,'claim')));
  h+=sec('active',act.filter(q=>!qReady(q)&&!qKind(q).auto).map(q=>qCard(q,'track')));
  h+=sec('new',L.filter(qOpen).map(q=>qCard(q,'accept')));
  h+=sec('daily',Q.daily.map(id=>QBY[id]).filter(q=>q&&!(Q.active[q.id]&&qReady(q))).map(q=>qCard(q,Q.active[q.id]?'track':'done')));
  h+=sec('ach',act.filter(q=>!qReady(q)&&qKind(q).achievement).map(q=>qCard(q,'')));
  $('qLog').innerHTML=h;
}
function questLogOpen(on){$('qLog').hidden=!on;if(on)questLog()}
$('qBtn').addEventListener('click',()=>questLogOpen($('qLog').hidden));
$('qLog').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  const id=b.dataset.q,a=b.dataset.act;
  if(a==='close'){questLogOpen(false);return}
  if(a==='accept'&&qOpen(QBY[id])){qStart(QBY[id]);saveNow()}
  else if(a==='claim')questClaim(id);
  else if(a==='track'){QS().track=QS().track===id?null:id;saveNow()}
  questLog();
});

// בכפר: סימן מעל מי שיש לו קווסט חדש (!) או פרס שמחכה (✓), ומספר על כפתור היומן
function drawQuestMarks(ox,oy){
  if(!S.vil)return;
  const Q=QS(),mark={};let n=0;
  for(const q of QUESTS.list){
    const ready=Q.active[q.id]&&qReady(q);if(ready)n++;
    if(!q.giver||!VILLAGE.b[q.giver])continue;
    if(ready)mark[q.giver]='✓';else if(!mark[q.giver]&&qOpen(q))mark[q.giver]='!';
  }
  ctx.textAlign='center';ctx.direction='ltr';ctx.font='800 22px Heebo, system-ui, sans-serif';
  const bob=Math.sin(fxNow()*4)*4;
  for(const k in mark){const B=VILLAGE.b[k],x=B.x+ox,y=B.y-B.r*1.25+oy+bob;
    ctx.fillStyle='rgba(18,22,36,0.85)';ctx.beginPath();ctx.arc(x,y-7,15,0,7);ctx.fill();ctx.fillStyle=C.gold;ctx.fillText(mark[k],x,y+1)}
  ctx.direction=DIR;
  const t=n?String(n):'';if($('qBadge').textContent!==t){$('qBadge').textContent=t;$('qBadge').hidden=!n}
}
