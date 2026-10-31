/* העלילה (docs/story.md). ניר נתן ל-Claude להוביל (31.10.2026).
   הסיפור עובר דרך ראש הכפר ושרשרת קווסטים ⭐ (kind:'story' ב-quests.js), ולא חוסם את המשחק.
   פרק 1, פנס האדמה (האחו):
   1. הקדמה: בכניסה הראשונה לכפר ראש הכפר פונה לגיבור.
   2. פיוחו מוצאת רסיס של פנס כשהיא חופרת בעולם.
   3. השומר האבן מחכה ליד הפנס הכבוי בקצה המחצבה. כשהוא נופל ולוקחים את הפרס, הפנס נדלק והאחו בטוח יותר.
   פרק 2, פנס המים (אגם הערפל, WORLD.regions.lake ב-world.js):
   1. כשפנס האדמה דולק, נפתחת דרך מהאחו לאגם (WORLD.paths). מגיעים אליו.
   2. אויבים רטובים ואבני גאות: מביאים מים זוהרים (aquaC).
   3. שומר המים קם ליד פנס המים. נופל, הפנס נדלק, והאגם בטוח יותר. ראש הכפר אומר משפט.
   כל פנס הוא שורה ב-STORY.lanterns: באיזה אזור, איפה, איזה קווסט מעיר את השומר, והשומר עצמו.
   מה נשמר: SAVE.story ({intro, shard, earth, water}). הטקסטים ב-lang.js תחת 'story.' ו-'q.s1*', 'q.s2*' */

const STORY={
  lanterns:{
    // פנס האדמה: בפינת המחצבה, הכי רחוק מהשער. השומר האבן: פי כמה מגולם רגיל. wake: מאיזה מרחק מהפנס הוא קם
    earth:{reg:'meadow',x:880,y:-560,quest:'s1Warden',glow:'#FFD36B',col:C.ember,
      warden:{type:'golem',hp:30,dmg:1.6,r:1.7,speed:0.8,wake:520,leash:420}},
    // פנס המים: בפינה הדרום-מערבית של האגם. שומר המים גם יורה מים בשלושה כיוונים (shoot)
    water:{reg:'lake',x:-860,y:470,quest:'s2Warden',glow:'#6FD3FF',col:'#3F7BF5',
      warden:{type:'tidewarden',hp:26,dmg:1.3,r:1.6,speed:0.9,wake:520,leash:420,shoot:{every:2.4,n:3,spread:0.32,speed:190,r:7,dmg:11}}}
  },
  introDelay:0.9,                          // שניות אחרי הכניסה הראשונה לכפר עד שראש הכפר מדבר
  headDelay:1.4,                           // אחרי שפנס נדלק (הפרס נלקח בכפר): ראש הכפר אומר משפט
  lit:{dmg:0.75}                           // אחרי שהפנס של אזור נדלק: האויבים באזור פוגעים פחות
};
const STO=()=>SAVE.story||(SAVE.story={intro:false,shard:false,earth:false});
const qOn=id=>!!(QS().active[id]&&!qReady(QBY[id]));
const storyOpen=k=>!!STO()[k];   // דרך שנפתחת בעלילה (WORLD.paths ב-world.js)
// הפנס של האזור שבו נמצאים, או null
function storyLantern(){if(!S.wd)return null;for(const k in STORY.lanterns)if(STORY.lanterns[k].reg===S.wd.reg)return k;return null}

/* ---- בכפר: ההקדמה, פעם אחת ---- */
function storyVillage(){
  if(STO().intro)return;
  storySay('story.intro',STORY.introDelay,()=>{STO().intro=true;saveNow()});
}
// ראש הכפר אומר משפט, כשאין חלון פתוח (יומן, ציוד, שיחה), כדי לא לסגור לשחקן משהו באמצע
function storySay(key,delay,first){
  setTimeout(function go(){if(!S.vil)return;
    if(S.mode!=='play'||!$('qLog').hidden||!$('npcDlg').hidden||!$('ovGear').hidden){setTimeout(go,1000);return}
    if(first)first();npcTalk('head');S.vil.dlgStay=true;S.vil.dlgLine=T(key);npcDialog()},delay*1000);
}

/* ---- בעולם, כל פריים (world.js) ---- */
function storyUpdate(dt){
  const w=S.wd;if(!w)return;
  // פיוחו מוצאת רסיס: החפירה הבאה שלה כשהקווסט פעיל
  const p=S.pet;
  if(p&&qOn('s1Shard')&&!STO().shard){if(w.digs0==null)w.digs0=p.digs;
    if(p.digs>w.digs0){STO().shard=true;questEvent('story','shard');celebrate(p.x,p.y,'rank',T('story.shard'));sfx('celebrate');saveNow()}}
  // השומר קם כשמתקרבים לפנס של האזור, רק כשהקווסט שלו פעיל
  const k=storyLantern(),L=k&&STORY.lanterns[k];
  if(L&&qOn(L.quest)&&!w.warden&&Math.hypot(P.x-L.x,P.y-L.y)<L.warden.wake){
    const W=L.warden,e=addEnemy(W.type,L.x,L.y+70,W.hp);
    e.warden=k;e.elite=false;e.dmg*=W.dmg;e.r*=W.r;e.speed*=W.speed;e.xp=0;e.big=W.r;e.shoot=W.shoot?W.shoot.every:0;w.warden=e;
    banner(T('story.'+k+'.rise'),L.col);S.shake=Math.max(S.shake,8)}
  if(w.warden&&w.warden.dead){if(w.warden.warden==='water')questEvent('story','tide');w.warden=null}   // שומר המים: מטרה 'tide' (s2Warden)
}
// השומר: רודף את השחקן, אבל לא מתרחק מהפנס (wFoes ב-world.js). שומר המים גם יורה
function storyWardenMove(e,dt){
  const L=STORY.lanterns[e.warden]||STORY.lanterns.earth,W=L.warden,dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1,far=Math.hypot(P.x-L.x,P.y-L.y)>W.leash;
  let tx=far?L.x-e.x:dx,ty=far?L.y+70-e.y:dy;const td=Math.hypot(tx,ty)||1;
  if(td>6){e.x+=tx/td*e.speed*slowK(e)*dt;e.y+=ty/td*e.speed*slowK(e)*dt}
  e.x+=e.kx*dt;e.y+=e.ky*dt;const f=Math.max(0,1-dt*9);e.kx*=f;e.ky*=f;e.ph+=dt*e.speed*0.08;e.flash-=dt;
  if(d<e.r+P.r-3)hurt(e.dmg);
  const sh=W.shoot;
  if(sh&&!far&&d<WORLD.attackRange+120&&(e.shoot-=dt)<=0){e.shoot=sh.every;const a=Math.atan2(dy,dx);
    for(let i=0;i<sh.n;i++)shootE(e.x,e.y,a+(i-(sh.n-1)/2)*sh.spread,sh.speed,sh.r,sh.dmg*storySafe())}
}
// פרס של קווסט עלילה: הפנס נדלק (questClaim ב-quests.js)
function storyReward(what){
  const L=STORY.lanterns[what];if(!L)return;
  STO()[what]=true;saveNow();banner(T('story.'+what+'.lit'),L.glow);if(P)celebrate(P.x,P.y-20,'rank',T('story.litShort'));
  if(what==='water'&&S.vil)storySay('story.water.head',STORY.headDelay);   // ראש הכפר על הדרך הבאה (לא מגלים מה יש שם)
}
// האויבים פוגעים פחות אחרי שהפנס של האזור נדלק (wSpawn ב-world.js)
const storySafe=()=>{const k=storyLantern();return k&&STO()[k]?STORY.lit.dmg:1};

/* ---- ציור: הפנס של האזור (דלוק או כבוי), ושם וחיים מעל השומר ---- */
function storyDraw(){
  const k=storyLantern();if(!k)return;
  const L=STORY.lanterns[k],lit=STO()[k],t=fxNow(),gl=L.glow;
  ctx.fillStyle='rgba(5,7,13,0.35)';ctx.beginPath();ctx.ellipse(L.x,L.y+6,22,8,0,0,7);ctx.fill();
  ctx.fillStyle='#4A3A2A';ctx.fillRect(L.x-4,L.y-70,8,76);
  if(lit){const g=ctx.createRadialGradient(L.x,L.y-80,4,L.x,L.y-80,90+Math.sin(t*2)*8);g.addColorStop(0,gl+'8C');g.addColorStop(1,gl+'00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(L.x,L.y-80,100,0,7);ctx.fill()}
  ctx.fillStyle=lit?gl:'#3A3F52';ctx.strokeStyle='#2A2018';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(L.x-14,L.y-98,28,32,6);ctx.fill();ctx.stroke();
  const e=S.wd.warden;
  if(e&&!e.dead){const bw=90,x=e.x,y=e.y-e.r-48;
    ctx.fillStyle='rgba(5,7,13,0.7)';ctx.fillRect(x-bw/2,y,bw,7);ctx.fillStyle=L.col;ctx.fillRect(x-bw/2,y,bw*Math.max(0,e.hp/e.max),7)}
}
function storyScreen(ox,oy){
  const k=storyLantern();if(!k)return;const L=STORY.lanterns[k],e=S.wd.warden;
  if(qOn(L.quest))edgeArrow(L.x+ox,L.y+oy,L.col,1.2);   // חץ לפנס כשהקווסט פעיל
  if(e&&!e.dead){ctx.textAlign='center';ctx.direction=DIR;ctx.font='800 14px Heebo, system-ui, sans-serif';ctx.fillStyle=L.col;ctx.fillText(T('story.'+k+'.name'),e.x+ox,e.y+oy-e.r-56)}
}
