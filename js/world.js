/* העולם הפתוח: האזור הראשון, "האחו והמחצבה" (game-design.md, "מבנה העולם", אפשרות ג: עולם פתוח עם זירות בתוכו).
   יוצאים אליו משער הכפר, ובתוכו שני שערים לזירה. ריצה שמתחילה בשער נגמרת באותו שער.
   העולם הוא מקום, כמו הכפר וחדר הבונוס: S.wd קיים רק כשנמצאים בו, ו-main.js מעדכן רק את המקום הנוכחי.
   מה יש בו: מקורות משאבים שההתקפה האוטומטית מכה בהם כשעומדים לידם, אויבים מעטים שמסתובבים ליד הבית שלהם (לא גושים כמו בזירה),
   יצורי משאבים, ושמועות על המבוקש (wanted.js).
   מה שנאסף נכנס ישר לתרמיל, ובו מסתכנים: מוות בעולם מאבד חצי מכל משאב בתרמיל, הפריטים נשארים, וקמים בכפר. המחסן בכפר בטוח ("החלטות של ניר").
   כל המספרים באובייקט WORLD. השמות ב-lang.js ('w.*'). בתלת-ממד: W3D ב-render3d.js */

const WORLD={
  region:'meadow',                       // השם ב-lang.js: 'w.region.meadow'
  size:{w:2100,h:1400},                  // גבולות האזור, סביב (0,0). צפוף, כדי שלא ילכו הרבה בשביל כלום (ניר, משחק ראשון בטלפון)
  edge:20,                               // כמה מהקצה השחקן, המבוקש והשלל עוצרים (placeBox)
  home:{x:0,y:-600,r:44},                // השער חזרה לכפר. יוצאים מהכפר ומגיעים לכאן
  gates:{grove:{x:-840,y:450,r:44},pit:{x:840,y:450,r:44}},   // שערים לזירה. השמות ב-lang.js ('w.gate.<id>')
  arrive:130,                            // כמה פיקסלים מתחת לשער עומדים כשמגיעים אליו
  near:55,                               // כמה פיקסלים מקצה שער נחשב "לידו": נפתח הפאנל עם הכפתור
  /* מקורות משאבים בשדות: kind (מ-NODES.kinds ב-nodes.js), כמה, מרכז ורדיוס. המקומות קבועים, כך שהיער תמיד באותו מקום.
     ההתקפה האוטומטית מכה בהם כמו בזירה (aimTarget ב-combat.js), והשלל בדרגות כמו בזירה (runGive ב-loot.js) */
  fields:[{kind:'tree',n:14,x:-610,y:-210,r:260},{kind:'tree',n:5,x:145,y:210,r:170},{kind:'bush',n:5,x:-335,y:65,r:130},
          {kind:'rock',n:9,x:610,y:-190,r:230},{kind:'copper',n:4,x:785,y:-400,r:135},{kind:'iron',n:2,x:880,y:-240,r:75},{kind:'rock',n:3,x:-210,y:240,r:125}],
  regrow:45,                             // שניות עד שמקור שנשבר צומח מחדש
  /* אויבים: קבוצות שמסתובבות ליד הבית שלהן. type: מ-ETYPES. creature: יצור משאב (data.js), ליד המקור שלו.
     ראשונות: מפלצות קלות ממש מחוץ לשער, הדבר הראשון ששחקן חדש פוגש. מהן לומדים איך נראים קרב, מספרי נזק ושלל (ניר) */
  foes:[
    {type:'grunt',n:2,x:-185,y:-450,r:95},{type:'grunt',n:2,x:190,y:-430,r:95},{type:'grunt',n:3,x:0,y:-320,r:100},
    {type:'grunt',n:3,x:-100,y:-180,r:140},{type:'grunt',n:3,x:305,y:225,r:140},
    {type:'wisp',n:2,x:-510,y:95,r:150},{type:'shield',n:2,x:450,y:50,r:130},
    {type:'treant',creature:true,n:2,x:-690,y:-305,r:170},{type:'golem',creature:true,n:2,x:655,y:-210,r:150},
    {type:'crawler',creature:true,n:2,x:785,y:-385,r:105},{type:'sprite',creature:true,n:2,x:-335,y:65,r:115}
  ],
  aggro:240,                             // מאיזה מרחק אויב רודף
  attackRange:260,                       // ההתקפה האוטומטית בוחרת רק מטרות עד המרחק הזה, וחץ או קסם לא פוגעים במה שרחוק ממנו (ניר, 31.10.2026: "בעולם הפתוח טווח ההתקפה צריך להיות מוגבל יותר"). בזירה הטווח של הנשק עצמו (אוראל)
  wander:0.4,                            // מהירות ההסתובבות ליד הבית, יחסית לרדיפה
  far:300,                               // קבוצה שנוקתה חוזרת רק כשהשחקן רחוק ממנה לפחות כך, כדי שלא תצוץ מול העיניים
  /* כמה קשה, לפי המרחק של בית הקבוצה מהשער לכפר: ככל שמתרחקים, קשה יותר. to: עד איזה מרחק. hp, dmg, speed: פי כמה מהרגיל (ETYPES).
     leash: כמה רחוק מהבית האויב מוכן לרדוף לפני שהוא חוזר. back: שניות עד שקבוצה שנוקתה חוזרת */
  zones:[
    {id:'start',to:360, hp:0.35,dmg:0.25,speed:0.6, leash:240,back:20},
    {id:'near', to:800, hp:0.7, dmg:0.6, speed:0.85,leash:360,back:35},
    {id:'far',  to:1e9, hp:1,   dmg:1,   speed:1,   leash:480,back:45}
  ],
  regen:4,                               // חיים לשנייה כשאין אויב קרוב
  decor:{trees:74,hills:14,rocks:0.15},  // קישוטים מחוץ לגבול. rocks: איזה חלק מהם סלעים
  ground:'#1B2A1E',                      // צבע הקרקע בדו-ממד. בתלת-ממד: W3D.regions ב-render3d.js
  /* דרכים לאזורים אחרים: שער שמופיע רק כשהעלילה פותחת אותו (need: מה ב-SAVE.story, story.js). המפתח הוא שם האזור שאליו הדרך מובילה */
  paths:{lake:{x:-760,y:-590,r:44,need:'earth'}},   // פרק 2: אחרי שפנס האדמה נדלק, דרך ביער בצפון-מערב לאגם הערפל
  /* אזורים נוספים. כל אזור כותב רק מה ששונה מהאחו, והשאר נלקח מ-WORLD. האחו הוא WORLD עצמו.
     back: לאן השער 'home' של האזור מוביל (באחו: לכפר). ponds: מים שאי אפשר ללכת בהם. fog: ערפל בקנבס. noNpc: בלי הדמויות של האחו (worldnpc.js) */
  regions:{
    // פרק 2: אגם הערפל (docs/story.md). אויבים רטובים (ברק!), אבני גאות עם מים זוהרים, ופנס המים בפינה הדרום-מערבית (STORY.lanterns.water)
    lake:{
      region:'lake',back:'meadow',enter:'w.enter.lake',noNpc:true,fog:true,ground:'#16252C',
      home:{x:0,y:-600,r:44},gates:{},
      paths:{ridge:{x:860,y:-590,r:44,need:'water'}},   // פרק 3: אחרי שפנס המים נדלק, שביל בצפון-מזרח שעולה לרכס הקפוא
      ponds:[{x:60,y:60,r:230},{x:-480,y:-120,r:120},{x:560,y:330,r:140},{x:-260,y:420,r:80}],
      fields:[{kind:'reeds',n:8,x:-220,y:-180,r:200},{kind:'reeds',n:6,x:330,y:-90,r:170},{kind:'reeds',n:5,x:-640,y:240,r:150},
              {kind:'tideRock',n:6,x:640,y:-330,r:190},{kind:'tideRock',n:4,x:-760,y:-330,r:150},{kind:'tree',n:5,x:820,y:120,r:160},{kind:'rock',n:3,x:250,y:500,r:120}],
      foes:[
        {type:'mistling',n:2,x:-160,y:-420,r:110},{type:'mistling',n:2,x:200,y:-400,r:110},
        {type:'drowned',n:2,x:-380,y:-250,r:130},{type:'mistling',n:3,x:330,y:-150,r:140},{type:'drowned',n:3,x:640,y:-300,r:150},
        {type:'drowned',n:3,x:-650,y:180,r:150},{type:'mistling',n:3,x:-130,y:330,r:140},{type:'drowned',n:2,x:820,y:160,r:140},
        {type:'drowned',creature:true,n:2,x:-760,y:-330,r:120},{type:'mistling',creature:true,n:2,x:-220,y:-180,r:120}
      ],
      // קשה מהאחו: מי שהגיע לכאן כבר הדליק פנס אחד
      zones:[
        {id:'start',to:360, hp:0.6,dmg:0.5,speed:0.75,leash:260,back:25},
        {id:'near', to:800, hp:1,  dmg:0.9,speed:0.95,leash:380,back:35},
        {id:'far',  to:1e9, hp:1.4,dmg:1.2,speed:1.05,leash:480,back:45}
      ],
      decor:{trees:60,hills:14,rocks:0.45}
    },
    // פרק 3: הרכס הקפוא (docs/story.md). שלג, אויבים קפואים (אש!), גבישי קרח עם ספיר, ופנס הקרח בפינה הדרום-מזרחית (STORY.lanterns.ice).
    // snow: פתיתי שלג בקנבס (wSnow). ponds כאן הם סדקים בקרח שאי אפשר לעבור
    ridge:{
      region:'ridge',back:'lake',enter:'w.enter.ridge',noNpc:true,snow:true,ground:'#33404E',pondCol:['#1C2A3A','#9FD8F0'],
      home:{x:0,y:-600,r:44},gates:{},paths:{},
      ponds:[{x:-120,y:40,r:150},{x:420,y:-160,r:90},{x:-560,y:300,r:110}],
      fields:[{kind:'pine',n:10,x:-560,y:-260,r:230},{kind:'pine',n:6,x:250,y:280,r:180},{kind:'pine',n:4,x:-820,y:80,r:120},
              {kind:'iceRock',n:6,x:620,y:-330,r:190},{kind:'iceRock',n:4,x:-300,y:480,r:140},{kind:'rock',n:4,x:180,y:-260,r:130}],
      foes:[
        {type:'frostwraith',n:2,x:-180,y:-430,r:110},{type:'frostwraith',n:2,x:210,y:-410,r:110},
        {type:'rimeknight',n:2,x:-420,y:-200,r:130},{type:'frostwraith',n:3,x:330,y:-60,r:140},{type:'rimeknight',n:3,x:640,y:-280,r:150},
        {type:'rimeknight',n:3,x:-700,y:200,r:150},{type:'frostwraith',n:3,x:120,y:360,r:140},{type:'rimeknight',n:3,x:620,y:300,r:150},
        {type:'rimeknight',creature:true,n:2,x:620,y:-330,r:120},{type:'frostwraith',creature:true,n:2,x:-560,y:-260,r:130}
      ],
      // קשה מהאגם: מי שהגיע לכאן כבר הדליק שני פנסים
      zones:[
        {id:'start',to:360, hp:0.8,dmg:0.6,speed:0.8, leash:260,back:25},
        {id:'near', to:800, hp:1.3,dmg:1.05,speed:1,  leash:380,back:35},
        {id:'far',  to:1e9, hp:1.8,dmg:1.35,speed:1.08,leash:480,back:45}
      ],
      decor:{trees:66,hills:16,rocks:0.35}
    }
  }
};
for(const k in WORLD.regions)WORLD.regions[k]=Object.assign({},WORLD,{regions:null},WORLD.regions[k]);
// האזור שבו נמצאים עכשיו: WORLD (האחו) או אחד מ-WORLD.regions
const WR=()=>S&&S.wd&&WORLD.regions[S.wd.reg]||WORLD;

const wKind=k=>NODES.kinds[k];
/* הגבולות של המקום הנוכחי, שאפשר ללכת בהם: {x0,x1,y0,y1}, או null כשאין גבול (הזירה פתוחה לכל הכיוונים).
   השחקן, המבוקש והשלל על הרצפה נשארים בתוכם, כדי ששלל תמיד ינחת איפה שאפשר להגיע (ניר: "הרגתי את המבוקש מחוץ לגבולות, והשלל לא נאסף") */
function placeBox(){if(!S.wd)return null;const {w,h}=WR().size,m=WORLD.edge;return{x0:-w/2+m,x1:w/2-m,y0:-h/2+m,y1:h/2-m}}
function placeClamp(o){const B=placeBox();if(!B)return o;o.x=Math.max(B.x0,Math.min(B.x1,o.x));o.y=Math.max(B.y0,Math.min(B.y1,o.y));return o}
// השערים של האזור: הבית, שערי הזירה, והדרכים שהעלילה כבר פתחה (storyOpen ב-story.js)
const wPathOpen=p=>!p.need||storyOpen(p.need);
function wGates(all){const R=WR(),o=Object.assign({home:R.home},R.gates);for(const k in R.paths)if(all||wPathOpen(R.paths[k]))o[k]=R.paths[k];return o}
const wIsPath=k=>k!=='home'&&!!WR().paths[k];
// השם של שער: לכפר, לאזור אחר, או זירה
const wGateName=k=>k==='home'?(WR().back?T('w.path.'+WR().back):T('w.home')):wIsPath(k)?T('w.path.'+k):T('w.gate.'+k);
const wGateCol=k=>k==='home'?C.chalk:wIsPath(k)?C.tide:C.lilac;
let wRet=null;   // השער שממנו נכנסו לזירה: בסוף הריצה חוזרים אליו (againBtn ב-input.js)

/* ---- מעבר בין מקומות ---- */
function worldUi(on){document.body.classList.toggle('world',on);$('whud').hidden=!on;$('chTag').hidden=!on;if(!on){$('wPanel').hidden=true;wnpcOff();fishOff()}}   // wnpcOff: הדמויות בעולם (worldnpc.js)   // fishOff: הדיג (fishing.js)
// at: 'home' (מהכפר, או מהאזור הקודם), id של שער (חזרה מהזירה) או של דרך (חזרה מאזור אחר). reg: איזה אזור, ברירת המחדל האחו
function enterWorld(at,reg){
  wRet=null;reset();S.mode='play';
  reg=WORLD.regions[reg]?reg:'meadow';
  S.wd={reg,t:0,gt:0,near:null,ui:'',groups:WR().foes.map(()=>({t:0})),got:{}};
  const R=WR();
  S.nd={list:wNodes(),broken:0,got:[]};
  const g=wGates()[at]||R.home;
  P.x=g.x;P.y=g.y+WORLD.arrive;P.aim=P.face=Math.PI/2;S.cam.x=P.x;S.cam.y=P.y;
  ['ovStart','ovOver','ovLevel','ovBoss','ovWDeath'].forEach(id=>$(id).hidden=true);
  R.foes.forEach((G,i)=>wSpawn(G,i));
  banner(at==='home'?T(R.enter||'w.enter'):wGateName(at),C.gold);
  worldUi(true);
  fishMealOn();   // ארוחה מהפונדקאית: חיזוק בעולם (fishing.js)
  challengeEnter();   // אתגר יומי (challenge.js)
  if(reg!=='meadow')questEvent('story',reg);   // קווסט עלילה "להגיע לאגם" (quests.js)
}
// דרך לאזור אחר. חוזרים לאזור הקודם ליד הדרך שממנה יצאו
function wGo(to){const from=S.wd.reg;worldUi(false);enterWorld(WR().back===to?from:'home',to)}
function wArena(id){wRet=id;worldUi(false);startRun();questEvent('reach','arena')}
function wHome(){worldUi(false);enterVillage()}

/* ---- מקורות משאבים: אותם מקורות כמו ב-nodes.js, במקומות קבועים. שבור צומח מחדש אחרי regrow (nodeDown) ---- */
function wNodes(){
  const R=WR(),out=[],block=Object.values(wGates(true)),wet=R.ponds||[];
  R.fields.forEach((F,fi)=>{const K=wKind(F.kind);
    for(let i=0,tries=0;i<F.n&&tries<F.n*12;tries++){
      const a=hash(fi*31+tries,7)*Math.PI*2,r=Math.sqrt(hash(tries,fi*17+3))*F.r,x=F.x+Math.cos(a)*r,y=F.y+Math.sin(a)*r;
      if(out.some(n=>Math.hypot(n.x-x,n.y-y)<n.r+K.r+24)||block.some(g=>Math.hypot(g.x-x,g.y-y)<g.r+WORLD.arrive)||wet.some(p=>Math.hypot(p.x-x,p.y-y)<p.r+K.r))continue;
      out.push({node:true,id:fi+'_'+i,kind:F.kind,x,y,r:K.r,hp:K.hp,max:K.hp,mult:multOf(K.tags),flash:0,back:0,regrow:WORLD.regrow});i++}});
  return out;
}
// מה שנאסף מהרצפה בעולם (drops.js) עובר מיד לתרמיל ונשמר. שם הוא בסיכון
function wLootIn(){
  const L=S.loot;if(!L)return;let any=false;
  for(const r in L)if(L[r]>0){bagAdd(r,L[r]);questEvent('gather',r,L[r]);S.wd.got[r]=(S.wd.got[r]||0)+L[r];any=true}
  S.loot={};if(any)saveNow();
}

/* ---- אויבים: קבוצה לכל שורה ב-WORLD.foes ---- */
// האזור של קבוצה, לפי המרחק של הבית שלה מהשער לכפר
const wZone=G=>{const R=WR();return R.zones.find(z=>Math.hypot(G.x-R.home.x,G.y-R.home.y)<z.to)};
function wSpawn(G,i){
  if(!ETYPES[G.type])return;const Z=wZone(G);
  for(let k=0;k<G.n;k++){const a=rand(0,6.28),r=rand(0,G.r),e=addEnemy(G.type,G.x+Math.cos(a)*r,G.y+Math.sin(a)*r,Z.hp);
    e.dmg*=Z.dmg*storySafe();e.speed*=Z.speed;e.zone=Z.id;affixRoll(e,Z.id);   // affixRoll: אולי אויב מיוחד (affix.js). storySafe: אחרי שפנס האדמה נדלק (story.js)
    e.xp=0;e.home=i;e.creature=!!G.creature;
    challengeSpawn(e)}   // החוק של היום (challenge.js)   // בלי XP: בעולם לא עולים רמה, זה שייך לריצה בזירה
}
function wFoes(dt){
  const FO=WR().foes,alive=FO.map(()=>0);
  for(const e of enemies){
    if(e.dead)continue;
    if(e.wanted){wantedMove(e,dt);continue}
    if(e.warden){storyWardenMove(e,dt);continue}
    if(e.evt){evFoeMove(e,dt);continue}   // גל של אירוע (events.js)   // השומר האבן (story.js)
    alive[e.home]++;
    const G=FO[e.home]||FO[0],dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1;
    let mx=0,my=0,sp=e.speed;
    if(d<WORLD.aggro&&Math.hypot(P.x-G.x,P.y-G.y)<wZone(G).leash){   // רודף, אבל לא רחוק מהבית. אחרת חוזר להסתובב שםmx=dx/d;my=dy/d;
      if(e.type==='wisp'){if(d<170){mx=-mx;my=-my}e.shoot-=dt;if(e.shoot<=0){e.shoot=rand(1.8,2.8);shootE(e.x,e.y,Math.atan2(dy,dx),175,6,8)}}}
    else{   // מסתובב ליד הבית
      if(e.wx==null||Math.hypot(e.wx-e.x,e.wy-e.y)<12){const a=rand(0,6.28),r=rand(0,G.r);e.wx=G.x+Math.cos(a)*r;e.wy=G.y+Math.sin(a)*r}
      const wx=e.wx-e.x,wy=e.wy-e.y,wd=Math.hypot(wx,wy)||1;mx=wx/wd;my=wy/wd;sp*=WORLD.wander}
    e.x+=mx*sp*dt+e.kx*dt;e.y+=my*sp*dt+e.ky*dt;
    const f=Math.max(0,1-dt*9);e.kx*=f;e.ky*=f;e.ph+=dt*sp*0.08;e.flash-=dt;
    if(d<e.r+P.r-3)hurt(e.dmg);
  }
  // קבוצה שנוקתה חוזרת אחרי זמן, כשהשחקן רחוק ממנה
  FO.forEach((G,i)=>{const g=S.wd.groups[i];if(alive[i]||!ETYPES[G.type])return;
    if(g.t<=0)g.t=wZone(G).back;else if((g.t-=dt)<=0&&Math.hypot(P.x-G.x,P.y-G.y)>G.r+WORLD.far){wSpawn(G,i);g.n=(g.n||0)+1}else g.t=Math.max(g.t,0.01)});
}

/* ---- כל פריים בעולם ---- */
function worldUpdate(dt){
  const w=S.wd;w.t+=dt;
  P.inv-=dt;P.swapBuff-=dt;S.hurt-=dt;S.shake=Math.max(0,S.shake-dt*30);
  const {ix,iy}=movePlayer(dt);if(P.moving&&!nearest(440))P.aim=Math.atan2(iy,ix);
  placeClamp(P);
  for(const n of S.nd.list){
    if(n.dead){if((n.back-=dt)<=0){n.dead=false;n.hp=n.max}continue}
    const dx=P.x-n.x,dy=P.y-n.y,d=Math.hypot(dx,dy)||1,min=n.r+P.r;if(d<min){P.x=n.x+dx/d*min;P.y=n.y+dy/d*min}   // לא עוברים דרך עץ
    n.flash-=dt;
  }
  wPonds(P);
  attack(dt);   // פוגעת גם במקורות משאבים (aimTarget ב-combat.js)
  wFoes(dt);if(S.mode!=='play')return;
  const hitable=S.nd.list.length?enemies.concat(S.nd.list):enemies;   // קליעים פוגעים גם במקורות משאבים (nodes.js), כמו בזירה
  for(const b of pb){shotFly(b,dt);
    for(const e of hitable){if(e.dead||b.hit.has(e)||b.life<=0||Math.hypot(e.x-P.x,e.y-P.y)-e.r>WORLD.attackRange)continue;
      if(Math.hypot(e.x-b.x,e.y-b.y)<e.r+4)shotHit(b,e)}}
  pb=pb.filter(b=>b.life>0);
  for(const b of eb){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(Math.hypot(P.x-b.x,P.y-b.y)<P.r+b.r-3){hurt(b.dmg);b.life=0}}
  eb=eb.filter(b=>b.life>0);if(S.mode!=='play')return;
  orbs=[];   // XP רק בזירה (גם מהמבוקש)
  wantedUpdate(dt);storyUpdate(dt);affixUpdate(dt);eventsUpdate(dt);   // העלילה (story.js), אויבים מיוחדים (affix.js)
  dropsUpdate(dt);secretsUpdate(dt);wLootIn();   // secretsUpdate: סודות (secrets.js), לפני שהשלל נכנס לתרמיל, בשביל ברכת השלל
  if(!nearest(WORLD.aggro)&&!TF('berserk'))P.hp=Math.min(P.maxHp,P.hp+WORLD.regen*dt);
  enemies=enemies.filter(e=>!e.dead);
  for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.9;p.vy*=0.9;p.life-=dt}
  parts=parts.filter(p=>p.life>0);
  for(const f of floats){f.y+=f.vy*dt;f.life-=dt}
  floats=floats.filter(f=>f.life>0);
  // ליד שער נפתח פאנל עם כפתור. נכנסים רק בלחיצה
  w.near=null;const gs=wGates();for(const k in gs){const g=gs[k];if(Math.hypot(P.x-g.x,P.y-g.y)<g.r+P.r+WORLD.near)w.near=k}
  worldHud();
  wnpcUpdate(dt);   // דמויות שמגלים בעולם, וכפתור "לדבר" (worldnpc.js)
  fishUpdate(dt);   // דיג ליד מים, וכפתור "לדוג" (fishing.js)
}

/* ---- מוות בעולם: חצי מכל משאב בתרמיל הולך, הפריטים והמחסן נשארים. נקרא מ-gameOver ---- */
function worldDeath(){
  S.mode='over';joy=null;
  const lost={},k=RES.deathLoss.resources;   // resources.js
  for(const r in SAVE.bag){if(!resOf(r))continue;const n=Math.floor(SAVE.bag[r]*k);if(n>0){bagTake(r,n);lost[r]=n}}
  S.wd.lost=lost;saveNow();
  $('wPanel').hidden=true;
  $('wLost').innerHTML=bagLine(lost)||T('w.lostNone');
  setTimeout(()=>{if(S.wd)$('ovWDeath').hidden=false},700);
}
$('wRespawn').onclick=()=>{$('ovWDeath').hidden=true;wHome()};

/* ---- ממשק: שם האזור והתרמיל למעלה, ופאנל ליד שער ---- */
function worldHud(){
  const w=S.wd;if(w.shut&&w.shut!==w.near)w.shut=null;   // ✕ סוגר את הפאנל עד שמתרחקים מהשער
  const shut=!!w.near&&w.shut===w.near,key=LANG+'|'+w.near+'|'+shut+'|'+JSON.stringify(SAVE.bag);
  if(key===w.ui)return;w.ui=key;
  $('wName').textContent=T('w.region.'+WR().region);
  $('wBag').innerHTML=topLine(SAVE.bag,resShown('world'));   // שורה אחת, והשאר בתרמיל (village.js)
  const pn=$('wPanel'),k=w.near;pn.hidden=!k||shut;if(pn.hidden)return;
  const back=k==='home'&&WR().back,to=back||(wIsPath(k)&&k);
  pn.innerHTML=to?winHead(wGateName(k))+'<p>'+T('w.pathInfo.'+to)+'</p><button class="vbtn" data-act="path" data-g="'+to+'">'+T('w.goPath')+'</button>'
    :k==='home'?winHead(T('w.home'))+'<p>'+T('w.homeInfo')+'</p><button class="vbtn" data-act="home">'+T('w.goHome')+'</button>'
    :winHead(T('w.gate.'+k))+'<p>'+T('w.arenaInfo')+'</p><button class="vbtn" data-act="arena" data-g="'+k+'">'+T('w.enterArena')+'</button>';
}
$('wPanel').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||!S.wd||S.mode!=='play')return;
  if(b.dataset.act==='close')wShut();else if(b.dataset.act==='home')wHome();else if(b.dataset.act==='arena')wArena(b.dataset.g);else if(b.dataset.act==='path')wGo(b.dataset.g);
});

function wShut(){if(!S.wd)return;S.wd.shut=S.wd.near;worldHud()}

/* ---- ציור ---- */
// קישוטים מחוץ לגבול: עצים וגבעות. תמיד באותם מקומות, ופתוח מול השער לכפר
function worldDecor(){
  const R=WR(),C_=worldDecor.c||(worldDecor.c={});if(C_[R.region])return C_[R.region];
  const out=[],{w,h}=R.size,D=R.decor,per=2*(w+h);
  const edge=(t,off)=>{let s=t*per;if(s<w)return[-w/2+s,-h/2-off];s-=w;if(s<h)return[w/2+off,-h/2+s];s-=h;if(s<w)return[w/2-s,h/2+off];s-=w;return[-w/2-off,h/2-s]};
  for(let i=0;i<D.trees;i++){const [x,y]=edge((i+hash(i,8)*0.5)/D.trees,40+hash(i,1)*90);if(Math.abs(x-R.home.x)<130&&y<0)continue;
    out.push({kind:hash(i,2)<D.rocks?'rock':'tree',x,y,v:hash(i,3)})}
  for(let i=0;i<D.hills;i++){const [x,y]=edge((i+0.5)/D.hills,260+hash(i,4)*80);if(Math.abs(x-R.home.x)<200&&y<0)continue;out.push({kind:'hills',x,y,v:hash(i,5)})}
  return C_[R.region]=out;
}
function wArch(g,col){
  ctx.strokeStyle=col;ctx.lineWidth=4;ctx.fillStyle='rgba(236,231,220,0.12)';
  ctx.beginPath();ctx.moveTo(g.x-26,g.y+14);ctx.lineTo(g.x-26,g.y-14);ctx.arc(g.x,g.y-14,26,Math.PI,0);ctx.lineTo(g.x+26,g.y+14);ctx.closePath();ctx.fill();ctx.stroke();
}
// בעולם: בדו-ממד צורות פשוטות. בתלת-ממד הקישוטים, השערים והמקורות מצוירים בשכבה שמתחת (syncWorld ב-render3d.js), וכאן רק פס החיים של מקור
function drawWorld(){
  if(!S.wd)return;
  if(!R3D.on){
    const R=WR(),{w,h}=R.size;ctx.fillStyle=R.ground;ctx.fillRect(-w/2,-h/2,w,h);
    const pc=R.pondCol||['#1E4A63','#3F7BA0'];for(const p of R.ponds||[]){ctx.fillStyle=pc[0];ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();ctx.strokeStyle=pc[1];ctx.lineWidth=4;ctx.stroke()}
    for(const d of worldDecor()){
      if(d.kind==='tree'){ctx.fillStyle='#24452F';ctx.beginPath();ctx.arc(d.x,d.y,20+d.v*10,0,7);ctx.fill()}
      else if(d.kind==='rock'){ctx.fillStyle='#4A5064';ctx.beginPath();ctx.arc(d.x,d.y,12,0,7);ctx.fill()}
      else{ctx.fillStyle='#1E3526';ctx.beginPath();ctx.arc(d.x,d.y,70,0,7);ctx.fill()}
    }
    const gs=wGates();for(const k in gs)wArch(gs[k],wGateCol(k));
  }
  for(const n of S.nd.list){
    if(n.dead)continue;const K=wKind(n.kind),fl=n.flash>0,r=n.r,x=n.x,y=n.y;
    if(!R3D.on){
      ctx.fillStyle='rgba(5,7,13,0.35)';ctx.beginPath();ctx.ellipse(x,y+r*0.7,r*1.1,r*0.4,0,0,7);ctx.fill();ctx.strokeStyle=C.ink;ctx.lineWidth=2;
      if(K.shape==='tree'){ctx.fillStyle=fl?'#fff':'#6B4A2B';ctx.fillRect(x-4,y-4,8,r*0.9);ctx.fillStyle=fl?'#fff':K.col;ctx.beginPath();ctx.arc(x,y-r*0.6,r,0,7);ctx.fill();ctx.stroke()}
      else{ctx.beginPath();ctx.moveTo(x-r,y+r*0.5);ctx.lineTo(x-r*0.7,y-r*0.5);ctx.lineTo(x,y-r);ctx.lineTo(x+r*0.8,y-r*0.4);ctx.lineTo(x+r,y+r*0.5);ctx.closePath();
        ctx.fillStyle=fl?'#fff':K.shape==='vein'?'#5A6075':K.col;ctx.fill();ctx.stroke();
        if(K.shape==='vein'){ctx.fillStyle=K.col;for(let i=0;i<3;i++){const a=i*2.1;ctx.beginPath();ctx.arc(x+Math.cos(a)*r*0.45,y-r*0.1+Math.sin(a)*r*0.3,3.5,0,7);ctx.fill()}}}
    }
    if(n.hp<n.max){const bw=r*2;ctx.fillStyle='rgba(5,7,13,0.6)';ctx.fillRect(x-bw/2,y-r*2.2,bw,4);ctx.fillStyle=C.gold;ctx.fillRect(x-bw/2,y-r*2.2,bw*Math.max(0,n.hp/n.max),4)}
  }
  drawWnpcs();   // worldnpc.js
  fishDraw();   // החכה והמצוף (fishing.js)
  storyDraw();   // הפנס והשומר (story.js)
  affixDraw();   // פיצוצים של אויבים מיוחדים (affix.js)
  eventsDraw();   // אירועים (events.js)
  secretsDraw();   // סודות (secrets.js)
  if(WR().fog)wFog();
  if(WR().snow)wSnow();   // הרכס הקפוא
}
// מים שאי אפשר ללכת בהם: דוחפים החוצה, כמו מעץ
function wPonds(o){for(const p of WR().ponds||[]){const dx=o.x-p.x,dy=o.y-p.y,d=Math.hypot(dx,dy)||1,min=p.r+(o.r||12);if(d<min){o.x=p.x+dx/d*min;o.y=p.y+dy/d*min}}}
/* ערפל עדין: כמה כתמים לבנים שקופים שנעים לאט סביב השחקן. ציור אחד מוכן מראש לכל כתם, כדי שיהיה קל לטלפון */
const FOG={n:7,size:360,alpha:0.16,drift:9,spread:520};
function wFog(){
  let s=wFog.spr;if(!s){s=wFog.spr=document.createElement('canvas');s.width=s.height=128;const c=s.getContext('2d'),g=c.createRadialGradient(64,64,4,64,64,64);
    g.addColorStop(0,'rgba(220,235,245,1)');g.addColorStop(1,'rgba(220,235,245,0)');c.fillStyle=g;c.fillRect(0,0,128,128)}
  const t=fxNow(),F=FOG,W=F.spread*2;ctx.save();ctx.globalAlpha=F.alpha;
  for(let i=0;i<F.n;i++){
    const bx=hash(i,11)*W+t*F.drift*(0.5+hash(i,12)),by=hash(i,13)*W+Math.sin(t*0.2+i)*30;
    const x=P.x-F.spread+(((bx-P.x)%W)+W)%W,y=P.y-F.spread+(((by-P.y)%W)+W)%W,sz=F.size*(0.7+hash(i,14)*0.6);
    ctx.drawImage(s,x-sz/2,y-sz/2,sz,sz*0.6)}
  ctx.restore();
}
/* שלג: פתיתים לבנים שיורדים באלכסון סביב השחקן, ועוד שכבת קור כחלחלה עדינה. בלי מערך חי: כל פתית מחושב מהזמן, אז זול לטלפון */
const SNOW={n:70,spread:560,fall:46,sway:18,size:[1.5,3.6],alpha:0.75,chill:0.07};
function wSnow(){
  const t=fxNow(),F=SNOW,W=F.spread*2;ctx.save();
  ctx.fillStyle='rgba(170,210,255,'+F.chill+')';ctx.fillRect(P.x-F.spread*2,P.y-F.spread*2,W*2,W*2);
  ctx.fillStyle='#F4FAFF';
  for(let i=0;i<F.n;i++){
    const sp=0.6+hash(i,21)*0.8,bx=hash(i,22)*W+Math.sin(t*0.7+i)*F.sway+t*F.fall*0.35*sp,by=hash(i,23)*W+t*F.fall*sp;
    const x=P.x-F.spread+(((bx-P.x)%W)+W)%W,y=P.y-F.spread+(((by-P.y)%W)+W)%W,r=F.size[0]+hash(i,24)*(F.size[1]-F.size[0]);
    ctx.globalAlpha=F.alpha*(0.5+hash(i,25)*0.5);ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}
  ctx.restore();
}
// שלטים מתחת לשערים, וחצים בקצה המסך אל השערים ואל הכפר. מעל הכל, בשני המצבים
function drawWorldScreen(ox,oy){
  if(!S.wd)return;
  ctx.textAlign='center';ctx.direction=DIR;ctx.font='800 13px Heebo, system-ui, sans-serif';
  const gs=wGates();
  for(const k in gs){const g=gs[k],col=wGateCol(k),txt=wGateName(k),x=g.x+ox,y=g.y+oy+40,tw=ctx.measureText(txt).width+16;
    ctx.fillStyle='rgba(18,22,36,0.78)';ctx.beginPath();ctx.roundRect(x-tw/2,y-11,tw,22,11);ctx.fill();ctx.fillStyle=col;ctx.fillText(txt,x,y+5);
    edgeArrow(g.x+ox,g.y+oy,col)}
  drawWnpcScreen(ox,oy);   // worldnpc.js
  fishScreen(ox,oy);   // "!" והפס של הדיג (fishing.js)
  storyScreen(ox,oy);   // story.js
  affixScreen(ox,oy);   // affix.js
  eventsScreen(ox,oy);   // events.js
  secretsScreen(ox,oy);secretsHud();   // secrets.js
}
