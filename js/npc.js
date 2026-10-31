/* תושבי הכפר (NPC): עומדים, מסתובבים קצת, עובדים, מנופפים כשמתקרבים ומריעים כשהמבנה שלהם עולה רמה.
   הם חיים רק בכפר (S.vil). הם לא חוסמים: השחקן עובר דרכם, והם לא הולכים על הדרך לשער או לתוך מבנים.
   שיחה: כשעומדים ליד תושב מופיע כפתור "לדבר". רק לחיצה פותחת שיחה (כמו השער: בלי הפתעות).
   בשיחה: משפט עם אופי, לפי רמת הכפר ומצב הקווסטים, והקווסטים שלו (giver ב-QUESTS.list, quests.js).
   כל המספרים באובייקט NPC. השמות והמשפטים ב-lang.js תחת 'npc.<id>', והבדיחות הפנימיות שם תחת 'npc.jokes.<id>'.
   איך הם נראים בתלת-ממד: LOOK3D.npc_<id> ב-render3d.js. תושב חדש = שורה ב-list, שורה ב-LOOK3D ומשפטים ב-lang.js */

const NPC={
  talk:70,          // כמה פיקסלים מהתושב מופיע כפתור "לדבר"
  leave:190,        // מתרחקים יותר מזה: השיחה נסגרת
  wave:150,         // נכנסים לטווח הזה: הוא מנופף, פעם אחת בכל התקרבות
  speed:34,         // מהירות הליכה, פיקסלים בשנייה
  pause:[2,5],      // כמה שניות הוא עומד (או עובד) בין הליכה להליכה
  waveT:1.3,cheerT:2.4,   // כמה זמן נמשך נפנוף והרעה
  road:46,          // חצי רוחב הדרך ממרכז הכפר לשער: תושבים לא עומדים עליה
  r:16,             // רדיוס הגוף, לציור ולמרחק מהמבנים
  markUp:78,        // כמה גבוה מעל התושב מופיע סימן הקווסט (! או ✓)
  joke:0.3,         // סיכוי שבמקום משפט רגיל הוא יגיד בדיחה פנימית (אם כתובות כאלה ב-lang.js)
  high:3,           // מאיזו רמה של מרכז הכפר המשפטים מתחלפים ל"כפר גדול"
  /* home: המבנה שלו ב-VILLAGE.b. הוא מופיע רק כשהמבנה בנוי, ומריע כשהמבנה עולה רמה.
     spot: לתושב בלי מבנה (עוד אין פונדק ומקדש): פינה משלו עם קישוטים (VIL3D.deco), עד שיהיה מבנה.
     at: איפה הוא עומד. area: כמה רחוק הוא מסתובב משם. work: עובד בזמן העמידה (פטיש, תפילה) במקום לעמוד סתם.
     col: הצבע שלו בדו-ממד ובסימנים */
  list:{
    head:    {home:'center',at:{x:106,y:-89},area:45,col:C.gold},
    smith:   {home:'forge', at:{x:-180,y:30},area:35,work:true,col:C.ember},
    merchant:{home:'market',at:{x:174,y:115},area:40,col:C.gold},
    inn:     {home:null,spot:{x:149,y:285,deco:['barrel','crate','barrel']},at:{x:119,y:255},area:35,col:'#C08A52'},
    priest:  {home:null,spot:{x:-149,y:-281,deco:['flag','flag']},at:{x:-119,y:-247},area:35,work:true,col:C.lilac}
  }
};

const npcHere=id=>{const N=NPC.list[id];return N?(!N.home||vLv(N.home)>0):wnpcMet(id)};   // דמות בעולם (worldnpc.js): כשכבר נמצאה
// המצב החי של התושבים, רק בכפר. נוצר מחדש בכל כניסה לכפר
function npcState(){
  const V=S.vil;if(!V)return null;
  if(!V.npc){V.npc={};for(const id in NPC.list){const N=NPC.list[id];
    V.npc[id]={id,x:N.at.x,y:N.at.y,tx:N.at.x,ty:N.at.y,face:Math.PI/2,st:'idle',t:0,wait:hash(id.length,7)*3,seenL:N.home?vLv(N.home):0,waved:false}}}
  return V.npc;
}
const npcAt=id=>{const s=npcState();return s&&npcHere(id)?s[id]:null};

// נקודה שמותר לעמוד בה: לא על הדרך לשער, לא בתוך מבנה, ובתוך הכפר
function npcFree(x,y){
  const g=VILLAGE.gate,top=VILLAGE.b.center.y;
  if(Math.abs(x-g.x)<NPC.road&&y>top&&y<g.y+g.r)return false;
  for(const k in VILLAGE.b){const B=VILLAGE.b[k];if(Math.hypot(x-B.x,y-B.y)<B.r+NPC.r+6)return false}
  return Math.hypot(x,y)<VILLAGE.radius-NPC.r;
}
function npcPick(n){
  const N=NPC.list[n.id];
  for(let i=0;i<8;i++){const a=Math.random()*Math.PI*2,d=Math.random()*N.area,x=N.at.x+Math.cos(a)*d,y=N.at.y+Math.sin(a)*d;if(npcFree(x,y))return{x,y}}
  return{x:N.at.x,y:N.at.y};
}

/* ---- כל פריים בכפר (נקרא מ-villageUpdate) ---- */
function npcUpdate(dt){
  const all=npcState();if(!all)return;
  const D=S.vil.dlg;let near=null,best=NPC.talk;
  for(const id in all){
    const n=all[id],N=NPC.list[id];if(!npcHere(id))continue;
    const d=Math.hypot(P.x-n.x,P.y-n.y);
    if(d<best){best=d;near=id}
    // המבנה שלו עלה רמה: הוא מריע
    if(N.home){const L=vLv(N.home);if(L>n.seenL){n.seenL=L;n.st='cheer';n.t=NPC.cheerT;n.emote='🎉'}}
    // השחקן התקרב: נפנוף, פעם אחת עד שהוא מתרחק שוב
    if(d<NPC.wave&&!n.waved&&n.st!=='cheer'){n.waved=true;n.st='wave';n.t=NPC.waveT;n.emote='👋'}
    else if(d>NPC.wave*1.4)n.waved=false;
    if(D===id){n.face=Math.atan2(P.y-n.y,P.x-n.x);if(n.st==='walk'){n.st='idle';n.t=1}}   // מדברים איתו: עומד ומסתכל עליך
    if(n.st==='cheer'||n.st==='wave'){n.face=Math.atan2(P.y-n.y,P.x-n.x);if((n.t-=dt)<=0){n.st='idle';n.t=1;n.emote=null}continue}
    if(n.st==='walk'){
      const dx=n.tx-n.x,dy=n.ty-n.y,l=Math.hypot(dx,dy);
      if(l<2){n.st=N.work?'work':'idle';n.t=NPC.pause[0]+Math.random()*(NPC.pause[1]-NPC.pause[0])}
      else{const s=Math.min(l,NPC.speed*dt);n.x+=dx/l*s;n.y+=dy/l*s;n.face=Math.atan2(dy,dx)}
    }else if(D!==id&&(n.t-=dt)<=0){const p=npcPick(n);n.tx=p.x;n.ty=p.y;n.st='walk'}
  }
  S.vil.npcNear=near;
  if(D&&!S.vil.dlgStay&&(!npcHere(D)||Math.hypot(P.x-all[D].x,P.y-all[D].y)>NPC.leave))npcTalk(null);   // dlgStay: ההקדמה של העלילה נשארת עד שסוגרים (story.js)
  const btn=$('talkBtn'),show=!!near&&D!==near;
  if(btn.hidden===show||btn.dataset.id!==(near||'')){btn.hidden=!show;btn.dataset.id=near||'';if(near)btn.textContent='💬 '+T('npc.talk',T('npc.'+near)[0])}
}

/* ---- שיחה ---- */
// המשפט שהוא אומר: פרס שמחכה, קווסט חדש, קווסט באמצע, או משהו על הכפר לפי הרמה. לפעמים בדיחה פנימית
function npcLine(id){
  const mine=QUESTS.list.filter(q=>q.giver===id),Q=QS();
  const jokes=(TEXT['npc.jokes.'+id]||{})[LANG]||[];
  if(jokes.length&&Math.random()<NPC.joke)return jokes[Math.floor(Math.random()*jokes.length)];
  const k=mine.some(q=>Q.active[q.id]&&qReady(q))?'ready':mine.some(qOpen)?'new':mine.some(q=>Q.active[q.id])?'busy':vLv('center')>=NPC.high?'high':'low';
  return T('npc.'+id+'.'+k);
}
function npcDialog(){
  const id=S.vil&&S.vil.dlg,el=$('npcDlg');if(!id){el.hidden=true;return}
  const Q=QS(),[name,role]=T('npc.'+id);
  const mine=QUESTS.list.filter(q=>q.giver===id&&npcHere(id));
  const ready=mine.filter(q=>Q.active[q.id]&&qReady(q)),open=mine.filter(qOpen),on=mine.filter(q=>Q.active[q.id]&&!qReady(q));
  let h=winHead(name,role);   // ui.js
  h+='<p class="npcsay">'+S.vil.dlgLine+'</p>';
  h+=ready.map(q=>qCard(q,'claim')).join('')+open.map(q=>qCard(q,'accept')).join('')+on.map(q=>qCard(q,'track')).join('');
  if(!ready.length&&!open.length&&!on.length)h+='<p class="next">'+T('npc.noQuest')+'</p>';
  if(id===STATS.respec.npc)h+=statRespecHtml();   // איפוס נקודות הדמות (stats.js)
  el.innerHTML=h;el.hidden=false;
}
// פותח שיחה עם id, או סוגר עם null
function npcTalk(id){
  if(!S.vil)return;
  S.vil.dlg=id;S.vil.dlgStay=false;if(id){$('qLog').hidden=true;S.vil.dlgLine=npcLine(id);sfx('ui')}
  npcDialog();
}
$('talkBtn').addEventListener('click',()=>{const id=$('talkBtn').dataset.id;if(id&&S.vil)npcTalk(id)});
$('npcDlg').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||!S.vil)return;
  if(b.dataset.act==='close'){npcTalk(null);return}
  if(b.dataset.act==='respec'){statRespec();statBadge();npcDialog();return}
  questAct(b.dataset.act,b.dataset.q);   // quests.js
  npcDialog();
});
// יציאה מהכפר: סוגרים הכל
function npcHide(){$('talkBtn').hidden=true;$('talkBtn').dataset.id='';$('npcDlg').hidden=true}

/* ---- ציור ---- */
// דו-ממד: גוף פשוט בצבע שלו, ובפינה של מי שאין לו מבנה, הקישוטים. בתלת-ממד הם מצוירים בשכבה שמתחת (render3d.js)
function drawNpcs(){
  if(!S.vil||R3D.on)return;
  for(const id in NPC.list){const sp=NPC.list[id].spot;if(!sp)continue;
    sp.deco.forEach((d,i)=>{const [dx,dy]=VDECO[i%VDECO.length],px=sp.x+dx*40,py=sp.y+dy*40;
      if(d==='flag'){ctx.strokeStyle=C.chalk;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py-34);ctx.stroke();ctx.fillStyle=NPC.list[id].col;ctx.beginPath();ctx.moveTo(px,py-34);ctx.lineTo(px+16,py-28);ctx.lineTo(px,py-22);ctx.fill()}
      else{ctx.fillStyle=d==='crate'?'#9A6B3C':'#7A4E2A';ctx.fillRect(px-7,py-12,14,12)}})}
  const all=npcState();
  for(const id in all){if(!npcHere(id))continue;const n=all[id],N=NPC.list[id],bob=n.st==='walk'?Math.abs(Math.sin(fxNow()*9))*3:n.st==='cheer'?Math.abs(Math.sin(fxNow()*12))*8:0;
    ctx.fillStyle='rgba(5,7,13,0.4)';ctx.beginPath();ctx.ellipse(n.x,n.y+NPC.r,NPC.r,NPC.r*0.4,0,0,7);ctx.fill();
    ctx.fillStyle=N.col;ctx.beginPath();ctx.roundRect(n.x-10,n.y-18-bob,20,30,8);ctx.fill();
    ctx.fillStyle=C.chalk;ctx.beginPath();ctx.arc(n.x,n.y-26-bob,9,0,7);ctx.fill()}
}
// מעל הכל: אימוג'י של נפנוף או הרעה, השם כשעומדים לידו, ושלט לפינה של מי שאין לו מבנה
function drawNpcScreen(ox,oy){
  const all=npcState();if(!all)return;
  ctx.textAlign='center';ctx.direction=DIR;
  for(const id in NPC.list){const sp=NPC.list[id].spot;if(!sp)continue;
    ctx.font='800 13px Heebo, system-ui, sans-serif';const txt=T('npc.'+id+'.spot'),w=ctx.measureText(txt).width+16,x=sp.x+ox,y=sp.y+oy+40;
    ctx.fillStyle='rgba(18,22,36,0.78)';ctx.beginPath();ctx.roundRect(x-w/2,y-11,w,22,11);ctx.fill();ctx.fillStyle=C.chalk;ctx.fillText(txt,x,y+5)}
  for(const id in all){if(!npcHere(id))continue;const n=all[id],x=n.x+ox,y=n.y+oy;
    if(n.emote){ctx.font='26px system-ui, sans-serif';ctx.fillText(n.emote,x,y-NPC.markUp-14+Math.sin(fxNow()*8)*3)}
    if(S.vil.npcNear===id||S.vil.dlg===id){ctx.font='800 14px Heebo, system-ui, sans-serif';ctx.fillStyle='#0009';ctx.fillText(T('npc.'+id)[0],x+1,y+33);ctx.fillStyle=NPC.list[id].col;ctx.fillText(T('npc.'+id)[0],x,y+32)}}
}
