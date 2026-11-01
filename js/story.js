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
   פרק 3, פנס הקרח (הרכס הקפוא, WORLD.regions.ridge ב-world.js):
   1. כשפנס המים דולק, נפתח שביל מהאגם לרכס (paths של האגם). מגיעים אליו, בשלג.
   2. אבירי כפור (חלשים לאש) וגבישי קרח: מביאים ספיר גולמי (sapphireC).
   3. שומר הקרח קם ליד פנס הקרח, ויורה מניפה של רסיסי קרח. נופל, הפנס נדלק, והרכס בטוח יותר.
   פרק 4, פנס האש (המדבר הבוער, WORLD.regions.desert ב-world.js):
   1. כשפנס הקרח דולק, נפתח מעבר מהרכס למדבר (paths של הרכס). מגיעים אליו, בחום וברוח חול.
   2. עקרבי אבן-אש (חלשים למים) וסלעי להבה: מביאים אודם גולמי (rubyC).
   3. שומר האש קם ליד פנס האש, ושולח טבעות אש שמתרחבות, עם פתח אחד שאפשר לעבור בו (ring). נופל, הפנס נדלק, והמדבר בטוח יותר.
   פרק 5, פנס הברק (מגדלי הסערה, WORLD.regions.storm ב-world.js):
   1. כשפנס האש דולק, נפתח שביל מהמדבר למגדלים (paths של המדבר). מגיעים אליו, בגשם ובברקים.
   2. אבירי סערה (חלשים לאדמה) וגבישי סערה: מביאים ברק גולמי (boltC).
   3. שומר הסערה קם ליד פנס הברק, ומסמן על הרצפה עיגולי ברק שמתפוצצים אחרי שנייה (marks): יוצאים מהעיגול. נופל, הפנס נדלק, והמגדלים בטוחים יותר.
   פרק 6 והאחרון, הפנס הלבן (לב הצל, WORLD.regions.shadow ב-world.js):
   1. כשכל חמשת הפנסים דולקים, נפתח שביל מהמגדלים ללב הצל. חושך, ואור רק סביב הגיבור ופיוחו.
   2. צללים של אויבים מכל האזורים, עם חומרים מעורבבים: מחליפים סוג נזק.
   3. הצל קם ליד הפנס הלבן. הוא לומד: עמיד לסוג הנזק שהכי השתמשת בו בעולם (SAVE.story.use, נספר ב-onHit ב-dmg.js),
      ועובר בחמישה שלבים, אחד לכל שומר, עם ההתקפה והחולשה שלו (phases, storyShade). נופל, והפרס בכפר: הפנס הלבן נדלק,
      כל התושבים מריעים, ראש הכפר מדבר, ומסך "תודה ששיחקת" עם סיכום (storyFinale). המשחק ממשיך.
   כל פנס הוא שורה ב-STORY.lanterns: באיזה אזור, איפה, איזה קווסט מעיר את השומר, והשומר עצמו.
   מה נשמר: SAVE.story ({intro, shard, earth, water, ice, fire, bolt, light, use, time, end}). הטקסטים ב-lang.js תחת 'story.', 'end.' ו-'q.s1*' עד 'q.s6*' */

const STORY={
  lanterns:{
    // פנס האדמה: בפינת המחצבה, הכי רחוק מהשער. השומר האבן: פי כמה מגולם רגיל. wake: מאיזה מרחק מהפנס הוא קם
    earth:{reg:'meadow',x:880,y:-560,quest:'s1Warden',glow:'#FFD36B',col:C.ember,
      warden:{type:'golem',hp:30,dmg:1.6,r:1.7,speed:0.8,wake:520,leash:420}},
    // פנס המים: בפינה הדרום-מערבית של האגם. שומר המים גם יורה מים בשלושה כיוונים (shoot)
    // ev: מה מדווחים לקווסט כשהשומר נופל (questEvent('story',ev)). head: ראש הכפר אומר משפט אחרי שהפנס נדלק
    water:{reg:'lake',x:-860,y:470,quest:'s2Warden',glow:'#6FD3FF',col:'#3F7BF5',ev:'tide',head:true,
      warden:{type:'tidewarden',hp:26,dmg:1.3,r:1.6,speed:0.9,wake:520,leash:420,shoot:{every:2.4,n:3,spread:0.32,speed:190,r:7,dmg:11}}},
    // פנס הקרח: בפינה הדרום-מזרחית של הרכס. שומר הקרח יורה מניפה רחבה של חמישה רסיסים, לאט יותר
    ice:{reg:'ridge',x:860,y:500,quest:'s3Warden',glow:'#CFF3FF',col:'#7FD4FF',ev:'frost',head:true,
      warden:{type:'frostwarden',hp:28,dmg:1.35,r:1.65,speed:0.85,wake:520,leash:420,shoot:{every:2.8,n:5,spread:0.24,speed:170,r:7,dmg:12}}},
    // פנס האש: בפינה הדרום-מערבית של המדבר. שומר האש שולח טבעת אש שמתרחבת ממנו (ring): speed פיקסלים לשנייה עד max,
    // w עובי הטבעת, gap רוחב הפתח (ברדיאנים) שבו עוברים בלי להיפגע. הטבעת פוגעת פעם אחת לכל היותר
    fire:{reg:'desert',x:-860,y:480,quest:'s4Warden',glow:'#FFB347',col:'#FF6A2A',ev:'blaze',head:true,
      warden:{type:'emberwarden',hp:30,dmg:1.4,r:1.7,speed:0.85,wake:520,leash:420,ring:{every:3.4,speed:165,max:340,w:14,gap:1.0,dmg:15}}},
    // פנס הברק: בפינה הדרום-מזרחית של מגדלי הסערה. שומר הסערה מסמן n עיגולי ברק (marks): אחד מתחת לשחקן והשאר עד spread ממנו.
    // כל עיגול ברדיוס r מתפוצץ אחרי fuse שניות. מי שעוד בתוכו נפגע. מספיק לזוז
    bolt:{reg:'storm',x:860,y:480,quest:'s5Warden',glow:'#E2CCFF',col:'#B07CFF',ev:'thunder',head:true,
      warden:{type:'stormwarden',hp:32,dmg:1.45,r:1.7,speed:0.85,wake:520,leash:420,marks:{every:2.8,n:4,spread:170,r:50,fuse:1.0,dmg:16,flash:0.25}}},
    // הפנס הלבן: באמצע הדרום של לב הצל. הצל עובר בשלבים לפי החיים שנשארו לו (phases, לפי הסדר): בכל שלב ההתקפה של השומר ההוא
    // (shoot, ring או marks מהשורה שלו כאן) והחולשה שלו. earth: אין לשומר האבן התקפה, אז הצל רץ מהר יותר (rush).
    // learn: המכפיל לסוג הנזק שהכי השתמשת בו בעולם, weak: המכפיל לחולשה של השלב. head:false: במקום משפט רגיל, הסוף (storyFinale)
    light:{reg:'shadow',x:0,y:470,quest:'s6Heart',glow:'#FFFFFF',col:'#9C6BFF',ev:'heart',head:false,
      warden:{type:'shade',hp:40,dmg:1.5,r:1.8,speed:0.9,wake:540,leash:460,phases:['earth','water','ice','fire','bolt'],rush:1.4,learn:0.4,weak:1.6}}
  },
  introDelay:0.9,                          // שניות אחרי הכניסה הראשונה לכפר עד שראש הכפר מדבר
  headDelay:1.4,                           // אחרי שפנס נדלק (הפרס נלקח בכפר): ראש הכפר אומר משפט
  lit:{dmg:0.75},                          // אחרי שהפנס של אזור נדלק: האויבים באזור פוגעים פחות
  end:{cheer:7,show:1.2}                   // הסוף: כמה שניות התושבים מריעים, וכמה אחרי שראש הכפר סיים מופיע מסך "תודה ששיחקת"
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
    if(S.mode!=='play'||!$('qLog').hidden||!$('npcDlg').hidden||!$('ovGear').hidden||!$('ovDaily').hidden){setTimeout(go,1000);return}
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
    e.warden=k;e.elite=false;e.dmg*=W.dmg;e.r*=W.r;e.speed*=W.speed;e.xp=0;e.big=W.r;e.shoot=W.shoot?W.shoot.every:0;e.ring=W.ring?W.ring.every*0.6:0;e.marks=W.marks?W.marks.every*0.5:0;w.warden=e;
    banner(T('story.'+k+'.rise'),L.col);S.shake=Math.max(S.shake,8);
    if(W.phases){e.base=e.speed;e.res=storyMost();e.phase=-1;storyShade(e)}}   // הצל: לומד את השחקן ולובש את השלב הראשון
  storyRings(dt);   // טבעות האש של שומר האש
  storyMarks(dt);   // עיגולי הברק של שומר הסערה
  if(w.warden&&w.warden.dead){const ev=(STORY.lanterns[w.warden.warden]||{}).ev;if(ev)questEvent('story',ev);w.warden=null}   // שומר המים: 'tide' (s2Warden), שומר הקרח: 'frost' (s3Warden)
}
// השומר: רודף את השחקן, אבל לא מתרחק מהפנס (wFoes ב-world.js). שומר המים גם יורה
function storyWardenMove(e,dt){
  if(e.phases)storyShade(e);
  const L=STORY.lanterns[e.warden]||STORY.lanterns.earth,W=e.pw||L.warden,K=e.pk||e.warden,dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1,far=Math.hypot(P.x-L.x,P.y-L.y)>W.leash;
  let tx=far?L.x-e.x:dx,ty=far?L.y+70-e.y:dy;const td=Math.hypot(tx,ty)||1;
  if(td>6){e.x+=tx/td*e.speed*slowK(e)*dt;e.y+=ty/td*e.speed*slowK(e)*dt}
  e.x+=e.kx*dt;e.y+=e.ky*dt;const f=Math.max(0,1-dt*9);e.kx*=f;e.ky*=f;e.ph+=dt*e.speed*0.08;e.flash-=dt;
  if(d<e.r+P.r-3)hurt(e.dmg);
  const sh=W.shoot;
  if(sh&&!far&&d<WORLD.attackRange+120&&(e.shoot-=dt)<=0){e.shoot=sh.every;const a=Math.atan2(dy,dx);
    for(let i=0;i<sh.n;i++)shootE(e.x,e.y,a+(i-(sh.n-1)/2)*sh.spread,sh.speed,sh.r,sh.dmg*storySafe())}
  const rg=W.ring;   // שומר האש: טבעת אש חדשה כל every שניות, כשהשחקן קרוב. הפתח בכיוון אקראי
  if(rg&&!far&&d<rg.max+80&&(e.ring-=dt)<=0){e.ring=rg.every;(S.wd.rings||(S.wd.rings=[])).push({x:e.x,y:e.y,rad:e.r,gap:Math.random()*Math.PI*2,hit:false,k:K});sfx('shoot');S.shake=Math.max(S.shake,4)}
  const mk=W.marks;   // שומר הסערה: עיגולי ברק על הרצפה. אחד בדיוק איפה שהשחקן עומד, כדי שתמיד צריך לזוז
  if(mk&&!far&&d<WORLD.attackRange+260&&(e.marks-=dt)<=0){e.marks=mk.every;const list=S.wd.marks||(S.wd.marks=[]);
    for(let i=0;i<mk.n;i++){const a=Math.random()*Math.PI*2,s=i?mk.spread*(0.35+Math.random()*0.65):0;list.push({x:P.x+Math.cos(a)*s,y:P.y+Math.sin(a)*s,t:mk.fuse,boom:0,k:K})}
    sfx('shoot')}
}
/* ---- הצל (פרק 6): הבוס שלומד, בעולם. הרעיון מ-makeBoss ב-boss.js (הזירה), בלי לגעת בו ----
   כמה נזק מכל סוג נתת בעולם: נספר ב-onHit (dmg.js) דרך storyUse, ונשמר עם השמירה הבאה */
function storyUse(t,d){if(!S.wd)return;const u=STO().use||(STO().use={});u[t]=(u[t]||0)+d}
// הסוג שהכי השתמשת בו בעולם. מי שעוד לא פגע בכלום: פיזי
function storyMost(){const u=STO().use||{};let b='physical',m=0;for(const k in u)if(u[k]>m){m=u[k];b=k}return b}
// השלב לפי החיים שנשארו: חמישה שלבים שווים. בכל שלב חדש: ההתקפה של השומר ההוא, והחולשה שלו (מהחומרים שלו ב-data.js).
// הסוג שהכי השתמשת בו נשאר חלש נגדו בכל השלבים, גם כשזו החולשה של השלב: הצל לומד
function storyShade(e){
  const W=STORY.lanterns[e.warden].warden,ph=W.phases,i=Math.min(ph.length-1,Math.floor((1-Math.max(0,e.hp)/e.max)*ph.length));
  if(i===e.phase)return;e.phase=i;const k=ph[i],O=STORY.lanterns[k],OW=O.warden,weak=weakOf(multOf(ETYPES[OW.type].tags))||'physical';
  e.pk=k;e.pw=Object.assign({},W,{shoot:OW.shoot,ring:OW.ring,marks:OW.marks});e.phases=true;
  e.shoot=OW.shoot?OW.shoot.every*0.5:0;e.ring=OW.ring?OW.ring.every*0.5:0;e.marks=OW.marks?OW.marks.every*0.5:0;
  e.speed=e.base*(OW.shoot||OW.ring||OW.marks?1:W.rush);
  e.mult={[weak]:W.weak};e.mult[e.res]=W.learn;e.weak=weak===e.res?null:weak;
  banner(i?T('story.light.phase',T('story.'+k+'.name')):T('story.light.learn',T('dt.'+e.res)),O.col);
  if(i){S.shake=Math.max(S.shake,6);sparks(e.x,e.y,O.glow,16,240);sfx('shoot')}
}
// עיגולי ברק: סופרים לאחור, ובאפס מכה ברק. מי שבתוך העיגול נפגע. אחרי הפיצוץ נשאר הבזק קצר (boom)
function storyMarks(dt){
  const w=S.wd,list=w.marks;if(!list||!list.length)return;
  for(const M of list){const mk=STORY.lanterns[M.k].warden.marks;
    if(M.t>0){M.t-=dt;if(M.t<=0){M.boom=mk.flash;S.shake=Math.max(S.shake,5);sparks(M.x,M.y,STORY.lanterns[M.k].glow,8,220);
      if(Math.hypot(P.x-M.x,P.y-M.y)<mk.r+P.r*0.5){M.hit=true;hurt(mk.dmg*storySafe())}}}
    else M.boom-=dt}
  w.marks=list.filter(M=>M.t>0||M.boom>0);
}
function storyMarksDraw(){
  const list=S.wd.marks;if(!list||!list.length)return;ctx.save();
  for(const M of list){const L=STORY.lanterns[M.k],mk=L.warden.marks;
    if(M.t>0){const k=1-M.t/mk.fuse;   // העיגול מתמלא עד הפיצוץ, ומהבהב בסוף
      ctx.globalAlpha=0.25+k*0.35;ctx.fillStyle=L.col;ctx.beginPath();ctx.arc(M.x,M.y,mk.r*k,0,7);ctx.fill();
      ctx.globalAlpha=k>0.7&&Math.floor(M.t*20)%2?1:0.8;ctx.strokeStyle=L.glow;ctx.lineWidth=3;ctx.beginPath();ctx.arc(M.x,M.y,mk.r,0,7);ctx.stroke();
      ctx.globalAlpha=0.9;dtIcon(M.x,M.y,'lightning',22,L.glow)}
    else{const a=M.boom/mk.flash;ctx.globalAlpha=a;ctx.strokeStyle='#FFFFFF';ctx.lineWidth=4;ctx.lineJoin='round';   // הברק עצמו: קו שבור מלמעלה
      ctx.beginPath();let x=M.x,y=M.y-260;ctx.moveTo(x,y);for(let i=1;i<=6;i++){x=M.x+(i<6?(hash(i,M.x|0)-0.5)*40:0);y=M.y-260+i*260/6;ctx.lineTo(x,y)}ctx.stroke();
      ctx.fillStyle=L.glow;ctx.globalAlpha=a*0.6;ctx.beginPath();ctx.arc(M.x,M.y,mk.r,0,7);ctx.fill()}}
  ctx.restore();
}
// טבעות אש: מתרחבות, ופוגעות בשחקן כשהקצה עובר דרכו, חוץ מבפתח
function storyRings(dt){
  const w=S.wd,list=w.rings;if(!list||!list.length)return;
  for(const R of list){const rg=STORY.lanterns[R.k].warden.ring;R.rad+=rg.speed*dt;
    const d=Math.hypot(P.x-R.x,P.y-R.y);
    if(!R.hit&&Math.abs(d-R.rad)<rg.w+P.r*0.6){
      const a=Math.atan2(P.y-R.y,P.x-R.x),off=Math.abs(((a-R.gap)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI);
      if(off>rg.gap/2){R.hit=true;hurt(rg.dmg*storySafe())}}}
  w.rings=list.filter(R=>R.rad<STORY.lanterns[R.k].warden.ring.max);
}
function storyRingsDraw(){
  const list=S.wd.rings;if(!list||!list.length)return;ctx.save();
  for(const R of list){const rg=STORY.lanterns[R.k].warden.ring,fade=1-R.rad/rg.max,L=STORY.lanterns[R.k];
    ctx.globalAlpha=0.35+fade*0.55;ctx.lineWidth=rg.w*2;ctx.strokeStyle=L.col;ctx.lineCap='round';
    ctx.beginPath();ctx.arc(R.x,R.y,R.rad,R.gap+rg.gap/2,R.gap-rg.gap/2+Math.PI*2);ctx.stroke();
    ctx.lineWidth=rg.w*0.7;ctx.strokeStyle=L.glow;ctx.beginPath();ctx.arc(R.x,R.y,R.rad,R.gap+rg.gap/2,R.gap-rg.gap/2+Math.PI*2);ctx.stroke()}
  ctx.restore();
}
// פרס של קווסט עלילה: הפנס נדלק (questClaim ב-quests.js)
function storyReward(what){
  const L=STORY.lanterns[what];if(!L)return;
  STO()[what]=true;saveNow();banner(T('story.'+what+'.lit'),L.glow);if(P)celebrate(P.x,P.y-20,'rank',T('story.litShort'));
  if(L.head&&S.vil)storySay('story.'+what+'.head',STORY.headDelay);   // ראש הכפר על הדרך הבאה (לא מגלים מה יש שם)
  if(what==='light')storyFinale();
}
/* ---- הסוף (פרק 6): הפנס הלבן נדלק בכפר. כל התושבים מריעים, פיוחו חוגגת, ראש הכפר מדבר, ואחרי שהשיחה נסגרת: "תודה ששיחקת".
   סוגרים את המסך וממשיכים לשחק כרגיל. נשמר: SAVE.story.end ---- */
function storyFinale(){
  if(!S.vil){storyEndOpen();return}
  setTimeout(()=>{if(!S.vil)return;const all=npcState()||{};
    for(const id in all)if(npcHere(id)){const n=all[id];n.st='cheer';n.t=STORY.end.cheer;n.emote='🎉';celebrate(n.x,n.y-20,'loot2','🎉')}
    if(S.pet)celebrate(S.pet.x,S.pet.y-10,'rank','🐾');sfx('celebrate');S.shake=Math.max(S.shake,6)},500);
  storySay('story.light.head',STORY.headDelay,()=>{
    setTimeout(function wait(){if(!S.vil)return;if(!$('npcDlg').hidden||S.mode!=='play'){setTimeout(wait,500);return}storyEndOpen()},STORY.end.show*1000)});
}
// כמה זמן שיחקת (STO().time, נספר ב-main.js דרך storyTick), כמה הרגת (ספר ההרפתקאות), כמה סודות וכמה דגים
function storyTick(dt){if(S&&S.mode==='play')STO().time=(STO().time||0)+dt}
function storySummary(){
  const sum=o=>Object.values(o||{}).reduce((a,b)=>a+(+b||0),0),t=Math.floor(STO().time||0);
  const secrets=Object.keys(SC().found).length,all=Object.values(SECRETS.regions).reduce((a,l)=>a+l.length,0);
  return{time:Math.floor(t/3600)+':'+String(Math.floor(t/60)%60).padStart(2,'0'),kills:sum(SAVE.book&&SAVE.book.f),secrets:secrets+'/'+all,fish:sum(FS().caught)};
}
function storyEndOpen(){
  if(!S)return;STO().end=true;saveNow();const s=storySummary();
  if(S.mode==='play')S.mode='end';joy=null;
  $('endWin').innerHTML=winHead(T('end.title'))+'<p class="endtxt">'+T('end.text')+'</p><div class="endsum">'+
    [['⏳',T('end.time'),s.time],['⚔️',T('end.kills'),shortN(s.kills)],['🔍',T('end.secrets'),s.secrets],['🐟',T('end.fish'),shortN(s.fish)]]
      .map(([i,l,v])=>'<div class="endrow"><span>'+i+' '+l+'</span><b>'+v+'</b></div>').join('')+'</div>'+
    '<button class="vbtn" data-act="close">'+T('end.go')+'</button>';
  $('ovEnd').hidden=false;sfx('celebrate');
}
function storyEndClose(){$('ovEnd').hidden=true;if(S&&S.mode==='end')S.mode='play'}
$('endWin').addEventListener('click',e=>{const b=e.target.closest('[data-act="close"]');if(b)storyEndClose()});
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
  storyRingsDraw();storyMarksDraw();
  const e=S.wd.warden;
  if(e&&!e.dead&&e.pk){const O=STORY.lanterns[e.pk];ctx.save();ctx.globalAlpha=0.5+Math.sin(t*6)*0.2;ctx.strokeStyle=O.col;ctx.lineWidth=5;   // הצל: טבעת בצבע השומר של השלב
    ctx.beginPath();ctx.ellipse(e.x,e.y+4,e.r*1.6,e.r*0.7,0,0,7);ctx.stroke();
    if(!R3D.on){const r=e.r,y=e.y-r*0.9;ctx.globalAlpha=0.92;ctx.fillStyle=e.flash>0?'#fff':'#1A1226';ctx.strokeStyle=O.col;ctx.lineWidth=3;   // בדו-ממד: גוש צל עם עיניים בצבע השלב
      ctx.beginPath();ctx.moveTo(e.x-r,e.y);for(let i=0;i<=8;i++){const a=Math.PI+i/8*Math.PI;ctx.lineTo(e.x+Math.cos(a)*r,y+Math.sin(a)*r*1.2+Math.sin(t*5+i)*3)}ctx.lineTo(e.x+r,e.y);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.globalAlpha=1;ctx.fillStyle=O.glow;ctx.beginPath();ctx.arc(e.x-r*0.32,y-r*0.2,4,0,7);ctx.arc(e.x+r*0.32,y-r*0.2,4,0,7);ctx.fill()}
    ctx.restore()}
  if(e&&!e.dead){const bw=90,x=e.x,y=e.y-e.r-48;
    ctx.fillStyle='rgba(5,7,13,0.7)';ctx.fillRect(x-bw/2,y,bw,7);ctx.fillStyle=L.col;ctx.fillRect(x-bw/2,y,bw*Math.max(0,e.hp/e.max),7)}
}
function storyScreen(ox,oy){
  const k=storyLantern();if(!k)return;const L=STORY.lanterns[k],e=S.wd.warden;
  // החץ לפנס כשהקווסט פעיל: guide.js
  if(e&&!e.dead){ctx.textAlign='center';ctx.direction=DIR;ctx.font='800 14px Heebo, system-ui, sans-serif';ctx.fillStyle=L.col;ctx.fillText(T('story.'+k+'.name'),e.x+ox,e.y+oy-e.r-56)}
}
