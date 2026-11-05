/* ליווי דמות (המתאם, 5.11.2026, אחרי ת15: "דמות שהולכת בדרך, אויבים שתוקפים אותה, והקווסט נכשל אם היא נופלת").
   קווסט עם יעד {type:'escort',what:'<אזור>:<מקום>'} (quests.js): הדמות שנתנה אותו (WNPC ב-worldnpc.js) הולכת למקום מ-SIDEQ.places (questboard.js).
   - מתחיל כשהקווסט פעיל ואתה לידה. היא הולכת בדרך שמוצאת מפת המכשולים (tPath ב-terrain.js), ומחכה כשאתה מתרחק.
   - כל כמה שניות להקה מגיעה מהצד (paceSpawn ב-pacing.js) והולכת אליה ולא אליך. מי שמגיעה אליה מכה בה.
   - היא נופלת (חיים 0): הקווסט נכשל. היא חוזרת הביתה, ומדברים איתה כדי לנסות שוב. ההתקדמות לא נשמרת.
   - הגיעה: היעד הושלם, והיא נשארת שם עד הכניסה הבאה לאזור. את הפרס לוקחים ממנה, שם.
   כל המספרים ב-ESCORT. הטקסטים ב-lang.js תחת 'esc.'. המצב חי רק ב-S.wd.esc, ולכן יציאה מהעולם מבטלת ליווי באמצע.
   החיבור: escUpdate ב-sqUpdate, escScreen ב-sqScreen (questboard.js), escTalk ב-wnpcTalk, והליכה ב-syncWnpcs (worldnpc.js) */

const ESCORT={
  start:110,         // כמה קרוב אליה צריך להיות כדי שתצא לדרך
  speed:95,          // מהירות ההליכה שלה (השחקן: 185)
  wait:260,          // אתה רחוק יותר מזה: היא מחכה לך
  hp:260,            // החיים שלה
  every:8,first:3,   // כל כמה שניות להקה, ומתי הראשונה
  n:[2,3],dist:320,  // כמה בלהקה, ומאיזה מרחק ממנה היא מגיעה
  reach:34,          // כמה קרוב אויב צריך להיות כדי להכות בה
  hitEvery:1.1,hitK:1,   // כל כמה שניות אויב מכה, וכמה מהנזק שלו
  hide:110,          // אויב קרוב יותר מזה: היא עוצרת ומחכה שתטפל בו
  arrive:40,         // כמה קרוב ליעד זה "הגיעה"
  col:'#7FE0C2',bar:{w:46,h:6,up:96}
};

// הליווי שהקווסט הזה מבקש, אם יש: {q,i,o,id,p}
function escFind(id){
  const Q=QS();
  for(const qid in Q.active){const q=QBY[qid];if(!q||q.giver!==id)continue;
    const i=q.obj.findIndex(o=>o.type==='escort');if(i<0||qProg(q,i)>=q.obj[i].n)continue;
    const p=sqPlace(q.obj[i].what);if(p&&p.reg===S.wd.reg)return{q,i,o:q.obj[i],id,p}}
  return null;
}
// מדברים איתה אחרי שנפלה: אפשר לנסות שוב
function escTalk(id){const W=S.wd;if(W&&W.escFail)delete W.escFail[id]}

/* ---- כל פריים בעולם (מ-sqUpdate) ---- */
function escUpdate(dt){
  const W=S.wd,all=wnpcState();if(!W||!all)return;
  let E=W.esc;
  if(!E){   // מתחילים: קווסט ליווי פעיל, היא בבית, ואתה לידה
    for(const id in all){const n=all[id],N=WNPC.list[id];if(N.board||(W.escFail&&W.escFail[id]))continue;
      if(Math.hypot(n.x-N.at.x,n.y-N.at.y)>30||Math.hypot(P.x-n.x,P.y-n.y)>ESCORT.start)continue;
      const f=escFind(id);if(!f)continue;
      const path=tPath(n.x,n.y,f.p.x,f.p.y);if(!path)continue;
      E=W.esc={id,qid:f.q.id,what:f.o.what,path:path.map(([x,y])=>({x,y})),hp:ESCORT.hp,spawn:ESCORT.first};
      if(W.dlg===id)wnpcTalk(null);
      banner(T('esc.go',T('npc.'+id)[0],sqPlaceName(f.o.what)),ESCORT.col);sfx('ui');break}
    if(!E)return;
  }
  const n=all[E.id];
  if(!n||!QS().active[E.qid]){escStop(n);return}   // הקווסט ירד באמצע
  // אויבים: מי שבלהקה של הליווי הולך אליה, ומי שהגיע מכה בה
  let near=false;
  for(const e of enemies){if(e.dead||!e.esc)continue;
    const dx=n.x-e.x,dy=n.y-e.y,d=Math.hypot(dx,dy)||1,px=P.x-e.x,py=P.y-e.y,pd=Math.hypot(px,py)||1,sp=e.speed*slowK(e)*dt;
    if(pd>e.r+40){e.x+=(dx/d-px/pd)*sp;e.y+=(dy/d-py/pd)*sp;tStep(e)}   // paceFoeMove הזיז אותו אליך: מתקנים אליה. לידך הוא נלחם בך
    if(d<ESCORT.hide)near=true;
    if(d<e.r+WNPC.r+ESCORT.reach&&(e.escCd=(e.escCd||0)-dt)<=0){e.escCd=ESCORT.hitEvery;const h=Math.max(1,Math.round(e.dmg*ESCORT.hitK));E.hp-=h;
      floatText(n.x,n.y-40,'-'+h,'#FF8A7A',14);n.flash=0.15}}
  if(E.hp<=0){escFail(n);return}
  // להקה
  if((E.spawn-=dt)<=0){E.spawn=ESCORT.every;const a=rand(0,6.28),s=placeClamp({x:n.x+Math.cos(a)*ESCORT.dist,y:n.y+Math.sin(a)*ESCORT.dist});
    if(W.pace!==undefined){const pk=paceSpawn(Math.round(rand(...ESCORT.n)),s);if(pk)for(const e of enemies)if(e.pack===pk)e.esc=true}}
  // ההליכה
  const far=Math.hypot(P.x-n.x,P.y-n.y)>ESCORT.wait;n.walk=!far&&!near&&E.path.length>0;
  if(n.walk){const t=E.path[0],dx=t.x-n.x,dy=t.y-n.y,d=Math.hypot(dx,dy),st=ESCORT.speed*dt;
    if(d<=st){n.x=t.x;n.y=t.y;E.path.shift()}else{n.x+=dx/d*st;n.y+=dy/d*st}n.face=Math.atan2(dy,dx)}
  const end=sqPlace(E.what);
  if(!E.path.length||Math.hypot(n.x-end.x,n.y-end.y)<ESCORT.arrive){   // הגיעה
    questEvent('escort',E.what);n.walk=false;W.esc=null;
    celebrate(n.x,n.y-10,'quest');banner(T('esc.done',T('npc.'+E.id)[0]),C.gold);saveNow()}
}
function escFail(n){
  const W=S.wd,E=W.esc;(W.escFail||(W.escFail={}))[E.id]=1;escStop(n);
  banner(T('esc.fail',T('npc.'+E.id)[0]),'#FF8A7A');sfx('hurt');
}
// הליווי נגמר בלי הצלחה: היא חוזרת הביתה, והלהקות שלו חוזרות להיות רגילות
function escStop(n){
  const W=S.wd,E=W.esc;W.esc=null;for(const e of enemies)e.esc=false;
  if(n&&E){const A=WNPC.list[E.id].at;n.x=A.x;n.y=A.y;n.walk=false}
}

/* ---- מעל הכל: פס החיים שלה, והיעד ---- */
function escScreen(ox,oy){
  const W=S.wd,E=W&&W.esc,n=E&&wnpcState()[E.id];if(!n)return;
  const B=ESCORT.bar,x=n.x+ox,y=n.y+oy-B.up,k=Math.max(0,E.hp/ESCORT.hp);
  ctx.save();ctx.fillStyle='rgba(5,7,13,0.75)';ctx.fillRect(x-B.w/2-1,y-1,B.w+2,B.h+2);
  ctx.fillStyle=k>0.35?ESCORT.col:'#FF8A7A';ctx.fillRect(x-B.w/2,y,B.w*k,B.h);
  if(Math.hypot(P.x-n.x,P.y-n.y)>ESCORT.wait){ctx.textAlign='center';ctx.direction=DIR;ctx.font='800 12px Heebo, system-ui, sans-serif';ctx.fillStyle='#000a';ctx.fillText(T('esc.wait'),x+1,y-7);ctx.fillStyle=ESCORT.col;ctx.fillText(T('esc.wait'),x,y-8)}
  ctx.restore();
  edgeArrow(x,y+B.up,ESCORT.col,1.1,true);   // היא מחוץ למסך: חץ אליה
}
