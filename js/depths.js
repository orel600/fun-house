/* עומק הצל (משימה י ב"התוכנית הבאה", 4.11.2026): מה עושים אחרי שששת הפנסים דולקים.
   אחרי הסוף (SAVE.story.end) נפתח בלב הצל שביל "לעומק הצל". מאחוריו קומה אחרי קומה, בלי סוף.
   - קומה = אזור קיים בעולם (WORLD.regions), עם אויבים מעורבבים מכל הפרקים במקומות של האויבים שלו. כל 5 קומות: הצל, הבוס שלומד (storyWarden ב-story.js).
     החוק היומי והאתגרים חלים כרגיל, כי הקומה נכנסת דרך enterWorld ו-wSpawn (world.js).
   - כל קומה קשה יותר (curve), והשלל טוב יותר: בסוף כל קומה תיבה עם חפצים בשכבה ובאיכות שעולות עם העומק (loot), ומהקומות הגבוהות אגדיים.
   - יוצאים בכל רגע דרך שער הבית, עם כל מה שנאסף. מוות מחזיר לכפר בלי לאבד כלום. השיא נשמר: SAVE.depths.best.
   כל קומה היא אזור 'dp_<בסיס>' ב-WORLD.regions, שנבנה כאן ומקבל את המראה של הבסיס (look). החיבורים: wGo, wPathOpen, worldUpdate, worldDeath ו-worldHud ב-world.js.
   לבדיקה: depthsEnter(n) נכנס ישר לקומה n, בלי העלילה. הטקסטים ב-lang.js ('dp.*') */
const DEPTHS={
  gate:{x:880,y:-200,r:44},             // השביל בלב הצל (בקצה המזרחי), אחרי הסוף
  deeper:{x:0,y:560,r:44},              // השער לקומה הבאה, בדרום. נפתח כשהקומה נוקתה
  bases:['meadow','lake','ridge','desert','storm','shadow'],   // מאיזה אזורים קומה נבנית
  // כמה קבוצות אויבים: groups ועוד grow לכל קומה, עד max. בכל קבוצה per, ועוד אחד כל perUp קומות. far: לא קרוב מזה לשער הבית
  foes:{groups:3,grow:0.25,max:7,per:2,perUp:8,far:330,mapNear:1500},   // mapNear: באזור עם מפה (האחו הגדול, terrain.js) רק קבוצות עד המרחק הזה מהשער, כדי שקומה לא תהיה הליכה של דקה
  // כמה קשה: פי base, כפול step בחזקת (קומה-1). קומה 10: חיים פי 3.1, נזק פי 1.6
  curve:{hp:{base:1.2,step:1.11},dmg:{base:0.85,step:1.07},speed:{base:1,step:1.006,max:1.3}},
  // הבוס: כל every קומות, בלב הצל, עם adds קבוצות לצידו. hp ו-dmg: על העקומה של הקומה
  boss:{every:5,base:'shadow',y:430,adds:2,hp:0.6,dmg:0.8},
  /* התיבה בסוף קומה: n חפצים (ועוד אחד כל nUp קומות, ועוד אחד בבוס). tier: מאיזו קומה כל שכבה (עץ, ברזל, כסף, זהב, אגדי).
     legend: מקומה from, סיכוי per לכל קומה (עד max) שחפץ יהיה אגדי. q: איכות (itemroll.js), עולה ב-per לכל קומה, עד cap. res: משאבים [כמה, ועוד אחד כל כמה קומות] */
  loot:{n:1,nUp:10,tier:[0,2,6,12,20],legend:{from:12,per:0.04,max:0.5},q:{min:95,max:112,per:1,cap:140},res:{gem:[1,5]}},
  leash:600,                             // כמה רחוק מהבית אויב רודף
  // המראה של הבסיס: אותן שורות בטבלאות של הציור (render3d.js, ground.js, ambient3d.js, vfx.js)
  look:()=>[typeof W3D!=='undefined'&&W3D.regions,typeof W3D!=='undefined'&&W3D.decor,typeof W3D!=='undefined'&&W3D.water,
    typeof GROUND!=='undefined'&&GROUND.pal,typeof AMBIENT!=='undefined'&&AMBIENT.reg,typeof VFX!=='undefined'&&VFX.mood]
};
const DP=()=>SAVE.depths||(SAVE.depths={best:0});
const depthsBest=()=>DP().best||0;
const dpBase=b=>b==='meadow'?WORLD:WORLD.regions[b];

// הקומות: אזור לכל בסיס, עם השם, השערים והמראה שלו. בלי שערים לזירה, בלי דמויות, בלי חזרה לאזור קודם: הבית מוביל לכפר.
// ב-WORLD.regions אבל לא ברשימה שלו (enumerable:false): WR() ו-enterWorld מוצאים אותן, ומפת העולם, הסודות והעלילה לא רואים אותן
(function(){
  for(const b of DEPTHS.bases){const B=dpBase(b);if(!B)continue;
    Object.defineProperty(WORLD.regions,'dp_'+b,{enumerable:false,value:Object.assign({},WORLD,B,{regions:null,region:'depths',back:null,enter:'dp.enter',noNpc:true,gates:{},
      paths:{deeper:Object.assign({open:()=>!!(S.wd&&S.wd.dpClear)},DEPTHS.deeper,B.map&&B.map.deeper)},dpBase:b})})}   // B.map.deeper: באזור עם מפה (האחו הגדול) השער למטה קרוב לבית
  for(const T_ of DEPTHS.look())if(T_)for(const b of DEPTHS.bases)if(T_[b])T_['dp_'+b]=T_[b];
  // השביל לעומק בלב הצל, אחרי הסוף (storyOpen('end'))
  const SH=WORLD.regions.shadow;if(SH)SH.paths=Object.assign({},SH.paths,{depths:Object.assign({need:'end'},DEPTHS.gate)});
})();

const dpMul=(c,f)=>Math.min(c.max||1e9,c.base*Math.pow(c.step,f-1));
const dpIsBoss=f=>f%DEPTHS.boss.every===0;
// סוגי האויבים מכל הפרקים (לא יצורי משאבים)
const dpPool=()=>dpPool.c||(dpPool.c=[...new Set([WORLD].concat(Object.values(WORLD.regions)).filter(R=>R&&R.foes&&!R.dpBase).flatMap(R=>R.foes.filter(G=>!G.creature).map(G=>G.type)))].filter(t=>ETYPES[t]));

// בונה את הקומה: האויבים במקומות של האויבים באזור הבסיס, בסוגים מעורבבים, והקושי לפי העקומה
function dpBuild(f){
  const boss=dpIsBoss(f),b=boss?DEPTHS.boss.base:DEPTHS.bases[Math.floor(hash(f,91)*DEPTHS.bases.length)],R=WORLD.regions['dp_'+b],B=dpBase(b),F=DEPTHS.foes,pool=dpPool();
  const spots=B.foes.filter(G=>!G.creature&&Math.hypot(G.x-R.home.x,G.y-R.home.y)>F.far&&(!B.map||Math.hypot(G.x-R.home.x,G.y-R.home.y)<F.mapNear)).sort((p,q)=>hash(f*7+p.x,p.y)-hash(f*7+q.x,q.y));
  const n=Math.min(spots.length,boss?DEPTHS.boss.adds:Math.min(F.max,Math.floor(F.groups+F.grow*(f-1)))),per=F.per+Math.floor((f-1)/F.perUp);
  R.foes=spots.slice(0,n).map((G,i)=>({type:pool[Math.floor(hash(f*13+i,17)*pool.length)],n:per,x:G.x,y:G.y,r:G.r}));
  const C=DEPTHS.curve;R.zones=[{id:'far',to:1e9,hp:dpMul(C.hp,f),dmg:dpMul(C.dmg,f),speed:dpMul(C.speed,f),leash:DEPTHS.leash,back:1e9}];   // back: קבוצה שנוקתה לא חוזרת
  return'dp_'+b;
}
// נכנסים לקומה f (מהשביל בלב הצל, מהשער למטה, או מהבדיקה)
function depthsEnter(f){
  f=Math.max(1,f|0);const reg=dpBuild(f);
  if(S.wd)worldUi(false);enterWorld('home',reg);
  const w=S.wd;w.dp=f;w.dpClear=false;
  const nb=f>depthsBest();if(nb){DP().best=f;saveNow()}
  questEvent('depth',null,f);   // הלוח בפונדק (inn.js)
  if(dpIsBoss(f)){const BS=DEPTHS.boss,e=storyWarden('light',BS.y),Z=WR().zones[0];e.hp=e.max=e.max*Z.hp*BS.hp;e.dmg*=Z.dmg*BS.dmg;e.rematch=1+Math.min(2,Math.floor(f/10));e.dpBoss=true}   // rematch: שלל של קרב חוזר בניצחון (storyReWin)
  banner(T(dpIsBoss(f)?'dp.boss':'dp.floor',f,depthsBest()),dpIsBoss(f)?C.lilac:C.gold);
  if(nb&&f>1)feedTitle(T('dp.best',f),C.gold);
}
// wGo ב-world.js: השביל לעומק והשער לקומה הבאה. true אם טופל כאן
function depthsGo(to){if(to==='depths'){depthsEnter(1);return true}if(to==='deeper'&&S.wd&&S.wd.dp){depthsEnter(S.wd.dp+1);return true}return false}

// כל פריים בעולם: הקומה נוקתה כשכל האויבים שלה מתו (בלי להקות ואירועים שבאים מבחוץ). אז תיבה, והשער למטה נפתח
function depthsUpdate(dt){
  const w=S.wd;if(!w||!w.dp||w.dpClear)return;
  if(w.warden||enemies.some(e=>!e.dead&&e.home!=null&&!e.pack&&!e.evt&&!e.wanted&&!e.warden))return;
  w.dpClear=true;depthsReward(w.dp);
  banner(T('dp.clear',w.dp),C.gold);celebrate(P.x,P.y-30,'loot2','🗝️');sfx('celebrate');
}
// השכבה של חפץ בקומה f, ולפעמים אגדי
function dpTier(f){const L=DEPTHS.loot;let t=0;L.tier.forEach((v,i)=>{if(f>=v)t=i});
  if(t<4&&f>=L.legend.from&&Math.random()<Math.min(L.legend.max,(f-L.legend.from+1)*L.legend.per))t=4;return t}
// התיבה: חפצים בשכבה ובאיכות של הקומה, ומשאבים. נופל לרצפה ליד השחקן (drops.js)
function depthsReward(f){
  const L=DEPTHS.loot,n=L.n+Math.floor(f/L.nUp)+(dpIsBoss(f)?1:0),got=[];
  for(let i=0;i<n;i++){const t=dpTier(f),pool=Object.keys(GEAR.items).filter(id=>{const it=GEAR.items[id];return it.tier===t&&it.slot!=='orbit'&&!it.types});if(!pool.length)continue;
    const Q=L.q,lo=Math.min(Q.cap,Q.min+Q.per*f),hi=Math.min(Q.cap,Q.max+Q.per*f),id=pool[Math.floor(Math.random()*pool.length)]+'~'+Math.round(lo+Math.random()*(hi-lo));
    dropSpawn(id,1,P.x+(Math.random()-0.5)*80,P.y+40);got.push(id)}
  for(const r in L.res){const [a,every]=L.res[r];dropSpawn(r,a+Math.floor(f/every),P.x,P.y+50)}
  S.wd.dpGot=got;   // לבדיקה (check.js)
}
// worldDeath: בעומק לא מאבדים כלום. ההודעה אומרת לאיזו קומה הגעת
function depthsDied(){const w=S.wd;$('wLost').innerHTML=T('dp.died',w.dp,depthsBest())}
// השם למעלה: "עומק הצל · קומה 7"
const depthsName=()=>S.wd&&S.wd.dp?T('dp.name',S.wd.dp):null;
