/* העלילה, פרק 1: פנס האדמה (docs/story.md). ניר נתן ל-Claude להוביל (31.10.2026).
   הסיפור עובר דרך ראש הכפר ושרשרת קווסטים ⭐ (kind:'story' ב-quests.js), ולא חוסם את המשחק:
   1. הקדמה: בכניסה הראשונה לכפר ראש הכפר פונה לגיבור.
   2. פיוחו מוצאת רסיס של פנס כשהיא חופרת בעולם.
   3. השומר האבן מחכה ליד הפנס הכבוי בקצה המחצבה. כשהוא נופל ולוקחים את הפרס, הפנס נדלק והאחו בטוח יותר.
   מה נשמר: SAVE.story ({intro, shard, earth}). המספרים באובייקט STORY. הטקסטים ב-lang.js תחת 'story.' ו-'q.s1*' */

const STORY={
  lantern:{x:880,y:-560},                  // פנס האדמה: בפינת המחצבה, הכי רחוק מהשער
  warden:{type:'golem',hp:30,dmg:1.6,r:1.7,speed:0.8,wake:520,leash:420},   // השומר האבן: פי כמה מגולם רגיל. wake: מאיזה מרחק מהפנס הוא קם
  introDelay:0.9,                          // שניות אחרי הכניסה הראשונה לכפר עד שראש הכפר מדבר
  lit:{dmg:0.75},                          // אחרי שהפנס נדלק: האויבים בעולם פוגעים פחות
  glow:'#FFD36B'
};
const STO=()=>SAVE.story||(SAVE.story={intro:false,shard:false,earth:false});
const qOn=id=>!!(QS().active[id]&&!qReady(QBY[id]));

/* ---- בכפר: ההקדמה, פעם אחת ---- */
function storyVillage(){
  if(STO().intro)return;
  // מחכים שלא יהיה חלון פתוח (יומן, ציוד, שיחה), כדי לא לסגור לשחקן משהו באמצע
  setTimeout(function go(){if(!S.vil||STO().intro)return;
    if(S.mode!=='play'||!$('qLog').hidden||!$('npcDlg').hidden||!$('ovGear').hidden){setTimeout(go,1000);return}
    STO().intro=true;saveNow();npcTalk('head');S.vil.dlgLine=T('story.intro');npcDialog()},STORY.introDelay*1000);
}

/* ---- בעולם, כל פריים (world.js) ---- */
function storyUpdate(dt){
  const w=S.wd;if(!w)return;
  // פיוחו מוצאת רסיס: החפירה הבאה שלה כשהקווסט פעיל
  const p=S.pet;
  if(p&&qOn('s1Shard')&&!STO().shard){if(w.digs0==null)w.digs0=p.digs;
    if(p.digs>w.digs0){STO().shard=true;questEvent('story','shard');celebrate(p.x,p.y,'rank',T('story.shard'));sfx('celebrate');saveNow()}}
  // השומר האבן קם כשמתקרבים לפנס, רק כשהקווסט שלו פעיל
  const L=STORY.lantern;
  if(qOn('s1Warden')&&!w.warden&&Math.hypot(P.x-L.x,P.y-L.y)<STORY.warden.wake){
    const W=STORY.warden,e=addEnemy(W.type,L.x,L.y+70,W.hp);
    e.warden=true;e.elite=false;e.dmg*=W.dmg;e.r*=W.r;e.speed*=W.speed;e.xp=0;e.big=W.r;w.warden=e;
    banner(T('story.warden'),C.ember);S.shake=Math.max(S.shake,8)}
  if(w.warden&&w.warden.dead)w.warden=null;
}
// השומר: רודף את השחקן, אבל לא מתרחק מהפנס (wFoes ב-world.js)
function storyWardenMove(e,dt){
  const L=STORY.lantern,dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1,far=Math.hypot(P.x-L.x,P.y-L.y)>STORY.warden.leash;
  let tx=far?L.x-e.x:dx,ty=far?L.y+70-e.y:dy;const td=Math.hypot(tx,ty)||1;
  if(td>6){e.x+=tx/td*e.speed*slowK(e)*dt;e.y+=ty/td*e.speed*slowK(e)*dt}
  e.x+=e.kx*dt;e.y+=e.ky*dt;const f=Math.max(0,1-dt*9);e.kx*=f;e.ky*=f;e.ph+=dt*e.speed*0.08;e.flash-=dt;
  if(d<e.r+P.r-3)hurt(e.dmg);
}
// פרס של קווסט עלילה: הפנס נדלק (questClaim ב-quests.js)
function storyReward(what){
  if(what==='earth'){STO().earth=true;saveNow();banner(T('story.lit'),STORY.glow);if(P)celebrate(P.x,P.y-20,'rank',T('story.litShort'))}
}
const storySafe=()=>STO().earth?STORY.lit.dmg:1;   // האויבים בעולם פוגעים פחות אחרי שהפנס נדלק (wSpawn)

/* ---- ציור: הפנס (דלוק או כבוי), ושם וחיים מעל השומר ---- */
function storyDraw(){
  if(!S.wd)return;
  const L=STORY.lantern,lit=STO().earth,t=fxNow();
  ctx.fillStyle='rgba(5,7,13,0.35)';ctx.beginPath();ctx.ellipse(L.x,L.y+6,22,8,0,0,7);ctx.fill();
  ctx.fillStyle='#4A3A2A';ctx.fillRect(L.x-4,L.y-70,8,76);
  if(lit){const g=ctx.createRadialGradient(L.x,L.y-80,4,L.x,L.y-80,90+Math.sin(t*2)*8);g.addColorStop(0,'rgba(255,211,107,0.55)');g.addColorStop(1,'rgba(255,211,107,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(L.x,L.y-80,100,0,7);ctx.fill()}
  ctx.fillStyle=lit?STORY.glow:'#3A3F52';ctx.strokeStyle='#2A2018';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(L.x-14,L.y-98,28,32,6);ctx.fill();ctx.stroke();
  const e=S.wd.warden;
  if(e&&!e.dead){const bw=90,x=e.x,y=e.y-e.r-48;
    ctx.fillStyle='rgba(5,7,13,0.7)';ctx.fillRect(x-bw/2,y,bw,7);ctx.fillStyle=C.ember;ctx.fillRect(x-bw/2,y,bw*Math.max(0,e.hp/e.max),7)}
}
function storyScreen(ox,oy){
  if(!S.wd)return;const L=STORY.lantern,e=S.wd.warden;
  if(qOn('s1Warden'))edgeArrow(L.x+ox,L.y+oy,C.ember,1.2);   // חץ לפנס כשהקווסט פעיל
  if(e&&!e.dead){ctx.textAlign='center';ctx.direction=DIR;ctx.font='800 14px Heebo, system-ui, sans-serif';ctx.fillStyle=C.ember;ctx.fillText(T('story.wardenName'),e.x+ox,e.y+oy-e.r-56)}
}
