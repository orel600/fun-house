/* דמויות בעולם הפתוח: מגלים אותן בחקירה, כמו ב-Genshin (game-design.md, "NPC בעולם": "דייג מבקש לנקות את האגם ממפלצות").
   כל דמות עומדת במקום קבוע באחו. כשמתקרבים אליה בפעם הראשונה היא "נמצאת": נשמר ב-SAVE.met (save.js), וחגיגה (celebrate ב-fx.js) פעם אחת.
   מאז יש חץ בקצה המסך אליה כשיש לה קווסט חדש או פרס שמחכה, וסימן ! או ✓ מעליה.
   שיחה: אותו כפתור "לדבר" ואותה שיחה כמו בכפר (npc.js). רק לחיצה פותחת. הקווסטים שלה הם שורות ב-QUESTS.list (quests.js) עם giver = ה-id שלה ו-kind 'world':
   מקבלים אותם ולוקחים את הפרס רק אצלה.
   כל המספרים באובייקט WNPC. השמות והמשפטים ב-lang.js תחת 'npc.<id>' (כמו תושבי הכפר), והמראה בתלת-ממד ב-LOOK3D.npc_<id> (render3d.js).
   דמות חדשה = שורה ב-list, שורה ב-LOOK3D, משפטים ב-lang.js וקווסטים ב-QUESTS */

const WNPC={
  find:230,         // מאיזה מרחק דמות "נמצאת" בפעם הראשונה
  talk:70,          // כמה פיקסלים ממנה מופיע כפתור "לדבר"
  leave:190,        // מתרחקים יותר מזה: השיחה נסגרת
  wave:150,         // נכנסים לטווח הזה: היא מנופפת, פעם אחת בכל התקרבות
  waveT:1.3,
  r:16,markUp:78,   // רדיוס הגוף, וכמה גבוה מעליה הסימן (! או ✓)
  /* at: איפה היא עומדת באחו (WORLD ב-world.js). col: הצבע שלה בדו-ממד ובחץ.
     pond: אגם קטן לידה (מצויר בקנבס), dx/dy ממנה ורדיוס */
  list:{
    fisher:{at:{x:-110,y:520},col:'#3F7BF5',pond:{dx:95,dy:20,rx:80,ry:38}},   // הדייג, ליד אגם בדרום. הרוחות מפחידות לו את הדגים
    cutter:{at:{x:430,y:-330},col:'#A8784A'},                                  // החוצבת, בין הסלעים לעורקי הנחושת במחצבה
    herbal:{at:{x:-470,y:205},col:'#5FA35A'}                                   // הלקטת, ליד השיחים במערב
  }
};

const wnpcMet=id=>!!WNPC.list[id]&&!!SAVE.met[id];
// המצב החי, רק בעולם. נוצר מחדש בכל כניסה לעולם
function wnpcState(){
  const W=S.wd;if(!W)return null;
  if(!W.npc){W.npc={};for(const id in WNPC.list){const A=WNPC.list[id].at;W.npc[id]={id,x:A.x,y:A.y,face:Math.PI/2,st:'idle',t:0,waved:false}}}
  return W.npc;
}
// הסימן מעל כל דמות שנמצאה: ✓ פרס מחכה, ! קווסט חדש. גם החצים בקצה המסך הולכים לפיו
function wnpcMarks(){
  const Q=QS(),mark={};
  for(const q of QUESTS.list){if(!WNPC.list[q.giver]||!wnpcMet(q.giver))continue;
    if(Q.active[q.id]&&qReady(q))mark[q.giver]='✓';else if(!mark[q.giver]&&qOpen(q))mark[q.giver]='!'}
  return mark;
}

/* ---- כל פריים בעולם (נקרא מ-worldUpdate) ---- */
function wnpcUpdate(dt){
  const all=wnpcState();if(!all)return;
  const W=S.wd,D=W.dlg;let near=null,best=WNPC.talk;
  for(const id in all){
    const n=all[id],d=Math.hypot(P.x-n.x,P.y-n.y);
    if(!SAVE.met[id]&&d<WNPC.find){SAVE.met[id]=1;saveNow();celebrate(n.x,n.y-10,'quest','!');banner(T('wn.found',T('npc.'+id)[0]),C.gold)}   // נמצאה!
    if(d<best){best=d;near=id}
    if(d<WNPC.wave&&!n.waved){n.waved=true;n.st='wave';n.t=WNPC.waveT;n.emote='👋'}
    else if(d>WNPC.wave*1.4)n.waved=false;
    if(n.st==='wave'&&(n.t-=dt)<=0){n.st='idle';n.emote=null}
    if(d<WNPC.wave)n.face=Math.atan2(P.y-n.y,P.x-n.x);   // מסתכלת עליך כשאתה קרוב
  }
  W.npcNear=near;
  if(D&&Math.hypot(P.x-all[D].x,P.y-all[D].y)>WNPC.leave)wnpcTalk(null);
  const btn=$('talkBtn'),show=!!near&&W.dlg!==near;
  if(btn.hidden===show||btn.dataset.id!==(near||'')){btn.hidden=!show;btn.dataset.id=near||'';if(near)btn.textContent='💬 '+T('npc.talk',T('npc.'+near)[0])}
}

/* ---- שיחה: באותו חלון כמו תושבי הכפר (#npcDlg) ---- */
function wnpcLine(id){
  const mine=QUESTS.list.filter(q=>q.giver===id),Q=QS();
  const k=mine.some(q=>Q.active[q.id]&&qReady(q))?'ready':mine.some(qOpen)?'new':mine.some(q=>Q.active[q.id])?'busy':'idle';
  return T('npc.'+id+'.'+k);
}
function wnpcDialog(){
  const id=S.wd&&S.wd.dlg,el=$('npcDlg');if(!id){el.hidden=true;return}
  const Q=QS(),[name,role]=T('npc.'+id),mine=QUESTS.list.filter(q=>q.giver===id);
  const ready=mine.filter(q=>Q.active[q.id]&&qReady(q)),open=mine.filter(qOpen),on=mine.filter(q=>Q.active[q.id]&&!qReady(q));
  let h=winHead(name,role);   // ui.js
  h+='<p class="npcsay">'+npcPic(id)+S.wd.dlgLine+'</p>';
  h+=ready.map(q=>qCard(q,'claim')).join('')+open.map(q=>qCard(q,'accept')).join('')+on.map(q=>qCard(q,'track')).join('');
  if(!ready.length&&!open.length&&!on.length)h+='<p class="next">'+T('npc.noQuest')+'</p>';
  el.innerHTML=h;el.hidden=false;
}
function wnpcTalk(id){
  if(!S.wd)return;
  S.wd.dlg=id;if(id){S.wd.dlgLine=wnpcLine(id);sfx('ui')}
  wnpcDialog();
}
$('talkBtn').addEventListener('click',()=>{const id=$('talkBtn').dataset.id;if(id&&S.wd&&WNPC.list[id])wnpcTalk(id)});
$('npcDlg').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||!S.wd)return;
  if(b.dataset.act==='close'){wnpcTalk(null);return}
  questAct(b.dataset.act,b.dataset.q);   // quests.js
  wnpcDialog();
});
// יציאה מהעולם: סוגרים את השיחה ומורידים את הדמויות בתלת-ממד
function wnpcOff(){npcHide();if(R3D.wnpcs){for(const id in R3D.wnpcs)freeActor(R3D.wnpcs[id]);R3D.wnpcs=null}}

/* ---- ציור ---- */
// דו-ממד: האגם, וגוף פשוט בצבע שלה. בתלת-ממד הגוף מצויר בשכבה שמתחת (syncWnpcs), והאגם שקוף יותר
function drawWnpcs(){
  const all=wnpcState();if(!all)return;
  for(const id in all){const N=WNPC.list[id],n=all[id],p=N.pond;
    if(p){ctx.fillStyle=R3D.on?'rgba(63,123,245,0.45)':'#2D5FB8';ctx.beginPath();ctx.ellipse(n.x+p.dx,n.y+p.dy,p.rx,p.ry,0,0,7);ctx.fill();
      ctx.strokeStyle='rgba(236,231,220,0.35)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(n.x+p.dx,n.y+p.dy,p.rx*0.6,p.ry*0.5,0,0.3,2.4);ctx.stroke()}
    if(R3D.on)continue;
    const bob=n.st==='wave'?Math.abs(Math.sin(fxNow()*12))*5:0;
    ctx.fillStyle='rgba(5,7,13,0.4)';ctx.beginPath();ctx.ellipse(n.x,n.y+WNPC.r,WNPC.r,WNPC.r*0.4,0,0,7);ctx.fill();
    ctx.fillStyle=N.col;ctx.beginPath();ctx.roundRect(n.x-10,n.y-18-bob,20,30,8);ctx.fill();
    ctx.fillStyle=C.chalk;ctx.beginPath();ctx.arc(n.x,n.y-26-bob,9,0,7);ctx.fill()}
}
// מעל הכל: נפנוף, השם (כשקרובים, או ? לפני שנמצאה), הסימן, וחץ בקצה המסך לדמות שנמצאה ויש לה משהו בשבילך
function drawWnpcScreen(ox,oy){
  const all=wnpcState();if(!all)return;
  const mark=wnpcMarks(),bob=Math.sin(fxNow()*4)*4;
  ctx.textAlign='center';ctx.direction=DIR;
  for(const id in all){const n=all[id],x=n.x+ox,y=n.y+oy,col=WNPC.list[id].col;
    if(n.emote){ctx.font='26px system-ui, sans-serif';ctx.fillText(n.emote,x,y-WNPC.markUp-14+Math.sin(fxNow()*8)*3)}
    if(S.wd.npcNear===id||S.wd.dlg===id){const nm=T('npc.'+id)[0];ctx.font='800 14px Heebo, system-ui, sans-serif';ctx.fillStyle='#0009';ctx.fillText(nm,x+1,y+33);ctx.fillStyle=col;ctx.fillText(nm,x,y+32)}
    const m=mark[id];if(!m)continue;
    ctx.direction='ltr';ctx.font='800 22px Heebo, system-ui, sans-serif';const my=y-WNPC.markUp+bob;
    ctx.fillStyle='rgba(18,22,36,0.85)';ctx.beginPath();ctx.arc(x,my-7,15,0,7);ctx.fill();ctx.fillStyle=C.gold;ctx.fillText(m,x,my+1);ctx.direction=DIR;
    edgeArrow(x,y,C.gold)}
}
// תלת-ממד: דמות KayKit לכל אחת (LOOK3D.npc_<id>), עומדת ומנופפת. נקרא מ-render3d בעולם
function syncWnpcs(dt){
  const all=wnpcState();if(!all)return;const A=R3D.wnpcs||(R3D.wnpcs={});
  for(const id in all){
    const L=LOOK3D['npc_'+id],n=all[id];if(!L)continue;
    let a=A[id];if(!a){a=A[id]=makeActor(L);a.npcSt=null}
    if(a.own)a.own.visible=L.own!==false;
    if(a.npcSt!==n.st){a.npcSt=n.st;if(n.st==='wave')once(a,L.anim.wave,WNPC.waveT);else a.one=null}
    loop(a,L.anim.idle+(a.one&&a.one.isRunning()?'@low':''));
    place(a,n.x,n.y,L.foot,yawOf(Math.cos(n.face),Math.sin(n.face)));
    a.mixer.update(dt);mark('shadow',a.root.position.x,a.root.position.z,15);
  }
}
