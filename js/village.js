/* הכפר: הבית. ממנו יוצאים לעולם הפתוח דרך השער (world.js), ואליו חוזרים עם השלל.
   הכפר הוא מקום, כמו חדר הבונוס: S.vil קיים רק כשנמצאים בכפר, ו-main.js מעדכן רק את המקום הנוכחי.
   מה שנשאר בין ריצות (רמות המבנים, התרמיל, הייצור) נקרא ונכתב רק דרך SAVE (save.js), ונשמר אחרי כל שינוי.
   כל המספרים באובייקט VILLAGE. השמות והתיאורים ב-lang.js ('vil.mill' וכו'). המודלים בתלת-ממד: VIL3D ב-render3d.js
   המשחק לרוחב (ניר, 30.10.2026): הכפר פרוש לרוחב, התרמיל למעלה, הפאנל בצד, והפינה הימנית למטה נשארת פנויה לכפתורי כישורים */

const VILLAGE={
  get radius(){return typeof vgLv==='function'?VGROW.radius[vgLv()]:700},   // גבול הכפר לפי רמת המרכז (vgrowth.js, ניר 10.11.2026): 620 במחנה עד 800 בעיירה עם חומה. היה 700 קבוע.                     // גבול הכפר: עד כאן אפשר ללכת. השער יושב על הגבול, למטה. גדל מ-410 (ניר, 2.11: "צריך להגדיל את הכפר, הכל צפוף ועולה אחד על השני")
  spawn:{x:0,y:330},             // איפה עומדים כשנכנסים בפעם הראשונה: על הדרך, בין השער לכיכר. חוזרים מהעולם ליד השער
  near:55,                        // כמה פיקסלים מקצה מבנה נחשב "לידו": מופיע כפתור "להיכנס" בסרגל (הפאנל נפתח רק בנגיעה)
  tap:{move:14,ms:400},           // נגיעה במבנה פותחת את הפאנל שלו: עד כמה פיקסלים זזה האצבע ועד כמה אלפיות שנייה, כדי שזה לא ייחשב תזוזה
  max:5,                          // הרמה הכי גבוהה. מבנה לא עולה מעל מרכז הכפר
  late:{from:4,k:1.3,res:['wood','stone']},   // רמות 4-5 עולות יותר עץ ואבן, כי הכלי נותן יותר מכל מקור (ניר 9.11, docs/concept-village-loop.md). רמות שכבר נבנו לא משתנות
  gift:{coins:25,wood:20,stone:12},   // מתנת פתיחה, פעם אחת: מספיק לבנות מנסרה ומכרה
  gate:{x:0,get y(){return VILLAGE.radius},r:44},   // השער על הגבול, וזז איתו כשהכפר גדל
  /* איך מבנה נראה לפי רמה, כדי שכל שדרוג ייראה (ניר: "שידרגתי בניין בכפר גם צריך להיות אפקט").
     look: רצועות רמה. at: מאיזו רמה. model: איזה מודל (השמות ב-VIL3D.models). scale: גודל. deco: קישוטים סביב (VIL3D.deco). glow: זוהר.
     בתוך רצועה המבנה גדל עוד grow בכל רמה, ובכל שדרוג יש חגיגה (celebrate ב-fx.js).
     הכפר גדל איתך (ניר, 9.11.2026, docs/concept-village-growth.md): רצועה לכל רמה, ורמה 1 ענייה באמת (אוהל, חורבה, ערימה) */
  grow:0.02,
  // cost[L]: מה עולה להגיע לרמה L. make: ייצור בשעה לפי רמה. cap: כמה נאגר לכל משאב עד שאוספים. המשאבים עצמם ב-RES (resources.js)
  // ברמות גבוהות מבנים צריכים מתכות טובות יותר וחומרים מיצורים, כדי שלכל משאב יהיה שימוש
  /* הרובעים (ניר, 2.11): מרכז למעלה (ראש הכפר ועמודי הפנסים, הכיכר מתחתיו), מלאכה במערב (נפחייה, מנסרה, מכרה),
     מסחר במזרח (שוק, מחסן), ומגורים בדרום משני צידי הדרך לשער (האוהלים של התושבים, residents.js, והפונדק, npc.js).
     מבנה חדש: מקום פנוי ברובע שלו, לפחות 200 פיקסלים ממבנה אחר, ולא על הדרך מהשער לכיכר (x בין -60 ל-60) */
  b:{
    center:{x:0,y:-330,r:92,
      look:[{at:1,model:'ruin',scale:1,deco:['tent','barrel']},{at:2,model:'stageB',scale:1,deco:['lumber','stone','wbarrow']},{at:3,model:'stageC',scale:1,deco:['flag','lumber','fenceW']},{at:4,model:'castle',scale:0.9,deco:['flag','flag','fenceS']},{at:5,model:'castleY',scale:1.08,deco:['flagY','flagY','towerA','towerA'],glow:C.gold}],   // שיקום (ניר, 9.11): חורבה, שלד, קירות, טירה
      cost:[null,null,{coins:40,wood:30,stone:20},{coins:90,wood:60,stone:50,copper:10,cloth:5},{coins:180,wood:120,stone:100,iron:20,cloth:15},{coins:350,wood:220,stone:200,silver:15,gold:5,horn:1,star:1}]},
    forge:{x:-450,y:-230,r:66,     // נפחייה: כל רמה פותחת עוד שכבת ציוד ליצירה (GEAR.recipes ב-gear.js), ו-Aging לציוד (aging.js) עד ה-+ של הרמה
      look:[{at:1,model:'tent',scale:1,deco:['barrel']},{at:2,model:'stageA',scale:1,deco:['rack','bucket','lumber']},{at:3,model:'forgeG',scale:0.88,deco:['crate','barrel']},{at:4,model:'forge',scale:1,deco:['rack','fenceS','barrel']},{at:5,model:'forgeR',scale:1.12,deco:['flagR','flagR','rack','towerA'],glow:C.ember}],
      // רמה 1: מתנת הפתיחה לא מספיקה במטבעות, יציאה אחת לעולם כן. זה השדרוג הראשון שמרגישים (firstup.js)
      cost:[null,{coins:45,wood:15,stone:8},{coins:50,wood:35,stone:25,copper:8},{coins:110,wood:70,stone:60,iron:15,bone:10},{coins:220,wood:140,stone:120,silver:12,hide:15},{coins:400,wood:250,stone:220,gold:10,essence:15,rubyF:1}]},
    mill:{x:-560,y:80,r:66,
      look:[{at:1,model:'pile',scale:1,deco:['pallet','ladder']},{at:2,model:'stageB',scale:0.95,deco:['wbarrow','lumber','pallet']},{at:3,model:'millG',scale:0.88,deco:['crate']},{at:4,model:'mill',scale:1,deco:['wbarrow','crate','fenceW']},{at:5,model:'millR',scale:1.12,deco:['flagR','flagR','crate','lumber'],glow:C.gold}],
      cost:[null,{coins:10,stone:5},{coins:30,wood:15,stone:20},{coins:70,wood:30,stone:50,copper:5},{coins:140,wood:60,stone:100,iron:10},{coins:260,wood:120,stone:180,silver:8,aquaF:1}],
      make:{wood:[0,30,50,80,120,180],cloth:[0,0,0,4,8,12]},cap:[0,60,120,200,320,500]},   // מרמה 3 גם אורגת בד
    mine:{x:-380,y:350,r:66,
      look:[{at:1,model:'boulder',scale:1,deco:['ladder','bucket']},{at:2,model:'stageA',scale:0.9,deco:['stone','wbarrow','ladder','tent']},{at:3,model:'mineG',scale:0.88,deco:['barrel']},{at:4,model:'mine',scale:1,deco:['stone','wbarrow','fenceS']},{at:5,model:'mineR',scale:1.12,deco:['flagR','flagR','stone','towerA'],glow:C.gold}],
      cost:[null,{coins:10,wood:10},{coins:30,wood:25,stone:10},{coins:70,wood:55,stone:25,copper:8},{coins:140,wood:110,stone:50,iron:12},{coins:260,wood:200,stone:90,silver:10,amber:1}],
      // מכרה עמוק יותר, מתכת טובה יותר: נחושת מההתחלה, ברזל מרמה 2, כסף מ-4, זהב ב-5
      // ניר, 10.11: "מכרה לאט, סלעים מהר". ברזל, כסף וזהב באים בעיקר מסלעים קשים בעולם. המכרה מחזיר מעט: תקרה קטנה לכל אחד (capR), כ-25-30% ממחיר דרגת כלי בסשן
      make:{stone:[0,20,35,55,80,120],copper:[0,4,6,8,10,12],iron:[0,0,0.5,0.5,0.75,1],silver:[0,0,0,0,0.5,0.75],gold:[0,0,0,0,0,0.25]},cap:[0,40,80,140,220,350],
      capR:{iron:[0,0,1,2,2,2],silver:[0,0,0,0,1,1],gold:[0,0,0,0,0,1]}},
    market:{x:450,y:-230,r:66,     // המחירים והכמות בכל לחיצה ב-RES (resources.js). כל רמה נוספת: bonus יותר טוב, ועוד נדירות שאפשר לקנות
      cost:[null,{coins:15,wood:15},{coins:40,wood:30,stone:20,cloth:4},{coins:90,wood:60,stone:50,cloth:10,copper:6},{coins:180,wood:120,stone:100,iron:15,venom:6},{coins:320,wood:220,stone:180,silver:10,essence:10,sapphireF:1}],
      bonus:0.2,
      look:[{at:1,model:'stall',scale:1,deco:['crateS','sack','barrel']},{at:2,model:'tent',scale:1,deco:['sack','crate','crateS']},{at:3,model:'marketG',scale:0.88,deco:['crate','barrel']},{at:4,model:'market',scale:1,deco:['tent','sack','crate']},{at:5,model:'marketR',scale:1.1,deco:['flagY','flagY','tent','tent'],glow:C.gold}]},
    stash:{x:540,y:80,r:60,     // מחסן: המקום הבטוח לשלל (stash.js). cap[L]: כמה יחידות הוא מחזיק ברמה L
      cost:[null,{coins:15,wood:10},{coins:40,wood:30,stone:15,cloth:6},{coins:90,wood:60,stone:45,copper:10,hide:8},{coins:180,wood:120,stone:90,iron:15,bone:15},{coins:320,wood:220,stone:160,silver:10,venom:8,boltF:1}],
      cap:[0,150,400,900,2000,5000],
      look:[{at:1,model:'tent',scale:0.9,deco:['crate']},{at:2,model:'tent',scale:0.95,deco:['crate','crateS','pallet','sack']},{at:3,model:'homeG',scale:0.9,deco:['crate','barrel']},{at:4,model:'home',scale:1,deco:['crate','fenceW','barrel']},{at:5,model:'homeR',scale:1.12,deco:['flagR','flagR','crate','barrel'],glow:C.tide}]},
    inn:{x:300,y:300,r:62,     // הפונדק של דודה פלפל (inn.js): לוח משימות, שמועות ומנוחה. כל רמה: מנוחה שנותנת יותר XP (INN.rest)
      cost:[null,{coins:15,wood:15},{coins:40,wood:30,stone:15,cloth:4},{coins:90,wood:60,stone:45,copper:8,herb:6},{coins:180,wood:120,stone:90,iron:12,hide:10},{coins:320,wood:220,stone:160,silver:10,mushroom:10,amberF:1}],
      look:[{at:1,model:'tent',scale:1,deco:['barrel','crate','barrel']},{at:2,model:'stageB',scale:0.95,deco:['barrel','lumber','tent']},{at:3,model:'tavernG',scale:0.88,deco:['barrel','barrel','crate']},{at:4,model:'tavern',scale:1,deco:['barrel','fenceW','crate']},{at:5,model:'tavernR',scale:1.12,deco:['flagR','flagR','barrel','barrel'],glow:'#C08A52'}]}
  },
  settleEvery:2,                  // כל כמה שניות מתעדכן המלאי שהצטבר במנסרה ובמכרה (המספר מעל המבנה ובפאנל)
  winDelay:2.5,                   // שניות אחרי שהבוס נופל, עד שחוזרים הביתה
  /* קישוטים בתוך הכפר, כדי שהמרחב לא ירגיש ריק. לא חוסמים, ולא עומדים על השבילים (ground.js) או על מבנים.
     k: tree/pine/bush (עצים), lamp (פנס רחוב), fence (גדר מ-x,y עד x2,y2), crate/barrel. בתלת-ממד: props3dVillage ב-props3d.js */
  // at: מאיזו רמת מרכז הקישוט מופיע (vgrowth.js, ניר 10.11.2026): במחנה 4 פנסים, בעיירה 16. props מחזיר רק את מה שמופיע עכשיו
  get props(){const L=typeof vgLv==='function'?vgLv():5;return this.propsAt[L]||(this.propsAt[L]=this.propsAll.filter(d=>(!d.at||d.at<=L)&&(!d.to||L<=d.to)))},propsAt:{},
  propsAll:[
    {k:'lamp',x:-80,y:180},{k:'lamp',x:80,y:180},{k:'lamp',x:-80,y:480,at:2},{k:'lamp',x:80,y:480,at:2},{k:'lamp',x:-130,y:-40},{k:'lamp',x:130,y:-40},
    {k:'lamp',x:-300,y:-120,at:3},{k:'lamp',x:300,y:-120,at:3},{k:'lamp',x:-330,y:170,at:3},{k:'lamp',x:330,y:170,at:3},
    {k:'lamp',x:-470,y:-60,at:4},{k:'lamp',x:470,y:-60,at:4},{k:'lamp',x:-80,y:680,at:5},{k:'lamp',x:80,y:680,at:5},{k:'lamp',x:-190,y:-520,at:5},{k:'lamp',x:190,y:-520,at:5},
    {k:'tree',x:-190,y:-470},{k:'pine',x:-120,y:-540},{k:'tree',x:200,y:-470},{k:'pine',x:130,y:-545},{k:'bush',x:250,y:-520},
    {k:'pine',x:-640,y:-140},{k:'tree',x:-610,y:-260},{k:'pine',x:640,y:-140},{k:'tree',x:610,y:-260},
    {k:'tree',x:-170,y:640},{k:'bush',x:-110,y:600},{k:'tree',x:170,y:640},{k:'bush',x:110,y:600},
    {k:'tree',x:-560,y:330},{k:'bush',x:-600,y:250},{k:'tree',x:600,y:300},{k:'pine',x:410,y:560},
    {k:'bush',x:-200,y:80},{k:'bush',x:220,y:60},
    {k:'fence',x:-560,y:-360,x2:-420,y2:-400},{k:'fence',x:560,y:-360,x2:420,y2:-400},
    {k:'fence',x:-650,y:-20,x2:-640,y2:150,at:2,to:2},{k:'fence',x:650,y:-20,x2:640,y2:150,at:2,to:2},
    {k:'fence',x:-80,y:650,x2:-230,y2:590},{k:'fence',x:80,y:650,x2:230,y2:590},
    {k:'crate',x:380,y:-90},{k:'barrel',x:405,y:-80},{k:'crate',x:-470,y:-110},{k:'barrel',x:-500,y:-100}
  ],
  /* השלטים על המבנים (ניר, 2.11: השלטים "נדחסים זה על זה ועל הממשק העליון").
     near: שם של מבנה מופיע רק כשמתקרבים אליו עד כאן (פיקסלים במשחק). תג "יש לאסוף/לשדרג" מופיע מכל מרחק שעל המסך.
     שלט שחופף לשלט חשוב ממנו זז קצת למטה או למעלה (nudge), ואם אין מקום הוא לא מצויר. avoid: הממשק שהשלטים לא נכנסים מתחתיו */
  signs:{near:330,nudge:[0,24,-24,48],pad:4,avoid:'#vBag,#who,#menuBtn,#nav,.dgift,#vTop,#qRail,#updBtn,#vEnter'}
};

const vLv=k=>SAVE.village[k]||0;
// המראה של מבנה עכשיו: הרצועה לפי הרמה, והגודל שגדל בתוכה. null: עוד לא נבנה, או שבונים אותו ממש עכשיו (פיגום)
function vLook(k){
  const L=vLv(k);if(!L||S.vil&&S.vil.raise[k]>fxNow())return null;
  const look=VILLAGE.b[k].look;let band=look[0];for(const b of look)if(L>=b.at)band=b;
  return{...band,size:band.scale*(1+VILLAGE.grow*(L-band.at)),L};
}

/* ---- ייצור לפי זמן אמיתי, גם כשהמשחק סגור ---- */
// תקרת המחסן למשאב r: capR אם יש למשאב תקרה משלו, אחרת cap
const vCapOf=(B,r,L)=>(B.capR&&B.capR[r]||B.cap)[L];
function vProd(k){return SAVE.prod[k]||(SAVE.prod[k]={t:0,have:{}})}
// מעדכן את מה שהצטבר מאז הפעם הקודמת, עד המחסן. לפני כל שינוי רמה, כדי שהקצב הישן יחול עד עכשיו
function vSettle(k){
  const B=VILLAGE.b[k];if(!B.make)return null;
  const p=vProd(k),now=Date.now(),L=vLv(k);
  if(p.t&&L>0){const h=Math.max(0,now-p.t)/3600e3;for(const r in B.make)p.have[r]=Math.min(vCapOf(B,r,L),(p.have[r]||0)+B.make[r][L]*h)}
  p.t=now;return p;
}
function vCollect(k){
  const p=vSettle(k);if(!p)return 0;let n=0,y=P.y-50;
  for(const r in p.have){const w=Math.floor(p.have[r]);if(w>0){bagAdd(r,w);questEvent('collect',r,w);p.have[r]-=w;n+=w;floatText(P.x,y,'+'+w+' '+resIcon(r),C.gold,17);y-=20}}
  if(n)saveNow();
  return n;
}
const vStock=k=>{const p=SAVE.prod[k];if(!p)return 0;let n=0;for(const r in p.have)n+=Math.floor(p.have[r]);return n};

/* ---- שדרוג ---- */
// המחיר לרמה L של המבנה k, עם התוספת של late ברמות הגבוהות
function vCostAt(k,L){const c=VILLAGE.b[k].cost[L];if(!c)return null;const A=VILLAGE.late;if(L<A.from)return c;
  const o=Object.assign({},c);for(const r of A.res)if(o[r])o[r]=Math.ceil(o[r]*A.k);return o}
const vCost=k=>vCostAt(k,vLv(k)+1);
// למה אי אפשר לשדרג עכשיו: 'max', 'center' (מרכז הכפר נמוך מדי), 'cost', או null אם אפשר
function vBlock(k){
  const L=vLv(k);if(L>=VILLAGE.max)return 'max';
  if(k!=='center'&&L>=vLv('center'))return 'center';
  const c=vCost(k);for(const r in c)if(!bagHas(r,c[r]))return 'cost';
  return null;
}
function vUpgrade(k){
  if(vBlock(k))return false;
  vSettle(k);const c=vCost(k);for(const r in c)bagTake(r,c[r]);
  const from=vLv(k);SAVE.village[k]=from+1;questEvent('upgrade',k);saveNow();
  // רגע הבנייה: המצלמה אל המבנה, הישן שוקע, פיגום ואבק, החדש קופץ, "לפני → אחרי" (buildmoment.js)
  bmStart(k,from);
  fuBuilt(k);   // הנפחייה הראשונה משחיזה את הנשק (firstup.js)
  return true;
}

/* ---- שוק ---- */
// מחיר ליחידה. רמת שוק גבוהה משלמת יותר וגובה פחות, אבל קנייה תמיד יקרה ממכירה, אחרת אפשר להרוויח בלי לשחק
function vPrice(r,kind){
  const R=resOf(r),k=1+VILLAGE.b.market.bonus*Math.max(0,vLv('market')-1),sell=Math.round(R.sell*k);
  const buy=Math.max(sell+1,Math.round(R.buy/k));
  return kind==='sell'?svcSell(r,sell,buy):buy;   // svcSell: המשפחה של היום נמכרת ביותר (services.js)
}
const vLot=r=>RES.rarity[resOf(r).rar].lot;
// מה השוק מוכן לעשות עם משאב עכשיו: למכור צריך מחיר מכירה, ולקנות צריך מחיר קנייה ורמת שוק לפי הנדירות
function vCanTrade(kind,r){
  const R=resOf(r),L=vLv('market');if(!R||!L)return false;
  return kind==='sell'?!!R.sell:!!R.buy&&L>=RES.rarity[R.rar].market;
}
function vTrade(kind,r){
  if(!vCanTrade(kind,r))return false;const n=vLot(r);
  if(kind==='sell'){if(!bagTake(r,n))return false;bagAdd('coins',vPrice(r,'sell')*n)}
  else{if(!bagTake('coins',vPrice(r,'buy')*n))return false;bagAdd(r,n)}
  saveNow();return true;
}

/* ---- מעבר בין הכפר לזירה ---- */
function villageUi(on){document.body.classList.toggle('vil',on);if(!on)document.body.classList.remove('vpan');$('vhud').hidden=!on;if(!on){$('vPanel').hidden=true;$('vEnter').hidden=true;npcHide()}if(typeof visitBtn==='function')visitBtn()}
// מתנת הפתיחה: ההודעה מחכה שהשיחה הראשונה עם ראש הכפר תיפתח ותיסגר, ולא נכתבת עליה (המבקר, 2.11)
function vGiftNote(){
  (function go(){if(!S.vil)return;
    if(!(SAVE.story&&SAVE.story.intro)||!$('npcDlg').hidden||S.mode!=='play'){setTimeout(go,700);return}
    banner(T('vil.gift'),C.gold)})();
}
function enterVillage(){
  const back=S&&(S.mode==='over'||S.wd);   // חוזרים מהעולם (או מריצה): ליד השער
  if(typeof worldUi==='function'&&!$('whud').hidden)worldUi(false);   // פס המשאבים של העולם לא נשאר מתחת לזה של הכפר (שורות שעולות אחת על השנייה)
  reset();S.mode='play';S.vil={near:null,open:null,ui:'',raise:{}};
  const at=back?{x:VILLAGE.gate.x,y:VILLAGE.gate.y-110}:VILLAGE.spawn;
  P.x=at.x;P.y=at.y;P.aim=P.face=-Math.PI/2;S.cam.x=P.x;S.cam.y=P.y;
  ['ovStart','ovOver','ovLevel','ovBoss'].forEach(id=>$(id).hidden=true);
  for(const k in VILLAGE.b)vSettle(k);   // הייצור מאז הביקור הקודם
  if(!SAVE.gift){for(const r in VILLAGE.gift)bagAdd(r,VILLAGE.gift[r]);SAVE.gift=true;vGiftNote()}
  else banner(T('vil.home'),C.gold);
  rankSync();questsRefresh();   // רמת הדמות (ranks.js), יום חדש וקווסטים שנפתחו (quests.js)
  saveNow();
  villageUi(true);
  storyVillage();   // ההקדמה של העלילה, פעם אחת (story.js)
  homeVillage();   // פנס שנדלק: תושב חוזר וראש הכפר מספר (homecoming.js)
  resVillage();   // דמות מהעולם שעברה לגור בכפר (residents.js)
  dailyVillage();   // המתנה היומית (daily.js)
  visitVillage();   // ביקור אצל חבר: פרופיל ציבורי ומתנות שמחכות (visit.js)
  welcomeVillage();   // "בזמן שלא היית": חלון אחד שאוסף הכל (welcome.js)
}
function leaveVillage(){villageUi(false);enterWorld('home');questEvent('reach','world')}   // השער מוביל לעולם הפתוח (world.js), והזירות בתוכו

/* ---- כל פריים בכפר ---- */
function villageUpdate(dt){
  const V=S.vil;
  P.inv-=dt;S.hurt-=dt;S.shake=Math.max(0,S.shake-dt*30);
  sigUpdate(dt);   // סקיל החתימה: גם בכפר אפשר להטיל (sigskill.js)
  if(typeof fxwUpdate==='function')fxwUpdate(dt);   // שכבת אפקטים: סימנים, אווירה וצעדים (fxworld.js)
  const {ix,iy}=movePlayer(dt);if(P.moving)P.aim=Math.atan2(iy,ix);
  // לא נכנסים לתוך מבנים, ולא יוצאים מהכפר
  for(const k in VILLAGE.b){const B=VILLAGE.b[k],dx=P.x-B.x,dy=P.y-B.y,d=Math.hypot(dx,dy)||1,min=B.r+P.r;if(d<min){P.x=B.x+dx/d*min;P.y=B.y+dy/d*min}}
  if(typeof vgBlock==='function')vgBlock(P);   // באר, דוכנים, מזרקה (vgrowth.js)
  const R=VILLAGE.radius,d0=Math.hypot(P.x,P.y);if(d0>R){P.x*=R/d0;P.y*=R/d0}
  // ליד השער או מבנה לא נפתח שום חלון (בדיקת החוויה, 1.11: "פאנל נפתח לבד כשעוברים לידו"). מופיע כפתור "להיכנס" בסרגל,
  // והפאנל נפתח בו או בנגיעה במבנה. הריצה מתחילה רק בלחיצה (ניר: "נכנסתי לזירה בלי כוונה")
  const g=VILLAGE.gate;V.gate=Math.hypot(P.x-g.x,P.y-g.y)<g.r+P.r+VILLAGE.near;
  let near=null,best=VILLAGE.near;
  for(const k in VILLAGE.b){const B=VILLAGE.b[k],d=Math.hypot(P.x-B.x,P.y-B.y)-B.r-P.r;if(d<best){best=d;near=k}}
  V.here=V.gate?'gate':near;
  // פאנל פתוח נסגר כשהולכים ממנו, או כשנפתחה שיחה (חלון אחד בכל רגע)
  if(V.open&&(P.moving&&V.open!==V.here||!$('npcDlg').hidden))V.open=null;
  V.near=V.open&&V.open!=='gate'?V.open:near;
  V.settle=(V.settle||0)-dt;if(V.settle<=0){V.settle=VILLAGE.settleEvery;for(const k in VILLAGE.b)vSettle(k)}   // המלאי על המבנים גדל גם בזמן שמסתובבים בכפר
  npcUpdate(dt);   // התושבים: הולכים, מנופפים, וכפתור "לדבר" (npc.js)
  for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.9;p.vy*=0.9;p.life-=dt}
  parts=parts.filter(p=>p.life>0);
  for(const f of floats){f.y+=f.vy*dt;f.life-=dt}
  floats=floats.filter(f=>f.life>0);
  villageHud();cornerHud();   // הפינות העליונות (minimap.js)
}

/* ---- שלל מהזירה ---- */
const runLoot=()=>S.loot||(S.loot={});
// נקרא מ-bossDown: אחרי רגע של ניצחון חוזרים הביתה (מחכים אם פתוח מסך שדרוג או חדר בונוס)
function runWon(){
  const s=S;
  setTimeout(function w(){if(S!==s||S.mode==='over')return;if(S.mode!=='play'||S.room){setTimeout(w,400);return}S.won=true;gameOver()},VILLAGE.winDelay*1000);
}
// נקרא מ-gameOver, גם במוות וגם בניצחון: השלל עובר לתרמיל ונשמר
function runEnd(){
  if(S.lootDone)return;S.lootDone=true;
  dropsCollectAll();   // מה שנשאר על הרצפה (drops.js)
  const L=runLoot();if(S.bn&&S.bn.coins)L.coins=(L.coins||0)+S.bn.coins;
  for(const r in L){bagAdd(r,L[r]);questEvent('collect',r,L[r])}
  rankRunXp();   // חלק מה-XP של הריצה נשאר לדמות (ranks.js)
  saveNow();
  $('overTitle').textContent=T(S.won?'vil.won':'fell');
  $('sLoot').innerHTML=lootSummary(L)||T('vil.noLoot');   // מהנדיר לרגיל (loot.js)
}

/* ---- ממשק: התרמיל למעלה, והפאנל של המבנה שלידו למטה ---- */
// משאב אחד כתג: אייקון ומספר. משאב נדיר מקבל מסגרת בצבע הנדירות שלו
const resChip=(r,n,cls='')=>{const R=resOf(r);return '<span class="res'+cls+(R&&R.rar?' rare" style="--tint:'+RES.rarity[R.rar].col:'')+'" data-tip="'+r+'" aria-label="'+resName(r)+'">'+resPic(r)+' '+n+'</span>'};
// list: אילו משאבים להראות, גם כשיש 0. בלי list: רק מה שיש
const bagLine=(bag,list)=>(list||Object.keys(RES.list).filter(r=>bag[r]>0)).map(r=>resChip(r,bag[r]||0)).join('');
// הפס העליון: שורה אחת, מספרים קצרים (1.3K), ולכל היותר UI.top משאבים. מה שלא נכנס: כפתור "+N" שפותח את התרמיל (ui.js)
const topLine=(bag,list)=>{const ks=list||Object.keys(RES.list).filter(r=>bag[r]>0),sh=ks.length>UI.top?ks.slice(0,UI.top-1):ks;
  return sh.map(r=>resChip(r,shortN(bag[r]))).join('')+(ks.length>sh.length?'<button class="resmore" aria-label="'+T('ui.more')+'">+'+(ks.length-sh.length)+'</button>':'')};
// התרמיל המלא לפי משפחות: טבע ובנייה, מתכות, יצורים, בוסים, נדיר. only: רק משפחה אחת (הסינון בתרמיל). משפחה ריקה לא מוצגת
const bagFams=(bag,only)=>Object.keys(RES.fams).filter(f=>!only||only==='all'||f===only).map(f=>{const rs=resFam(f).filter(r=>bag[r]>0);
  return rs.length?'<div class="fam"><span class="sk">'+T('fam.'+f)+'</span><div class="bag">'+bagLine(bag,rs)+'</div></div>':''}).join('');
function costLine(c){return Object.keys(c).map(r=>resChip(r,c[r],bagHas(r,c[r])?'':' miss')).join('')}
// מה מבנה מייצר בשעה ברמה L, למשל '30🪵 4🧵'
const makeLine=(B,L)=>Object.keys(B.make).filter(r=>B.make[r][L]>0).map(r=>'<bdi>'+B.make[r][L]+resIcon(r)+'</bdi>').join(' ');
function vInfo(k,L){
  const B=VILLAGE.b[k];if(L<1)return T('vil.notBuilt');
  if(k==='center')return T('vil.info.center',L);
  if(k==='forge')return T('vil.info.forge',T('vil.tiers')[L-1],AGING.byForge[L]);
  if(B.make)return T('vil.info.make',makeLine(B,L),B.cap[L]);
  if(k==='market')return T('vil.info.market',Math.round(B.bonus*(L-1)*100));
  if(k==='stash')return T('vil.info.stash',B.cap[L]);
  if(k==='inn')return T('vil.info.inn',Math.round((INN.rest.xp+INN.rest.perLv*(L-1))*100));
}
function villageHud(){
  const k=S.vil.near,L=k?vLv(k):0,cur=S.vil.open;
  vEnterBtn();
  // בונים מחדש רק כשמשהו השתנה: מבנה אחר, פאנל שנפתח או נסגר, לשונית, רמות, תרמיל, מחסן או שפה
  const key=LANG+'|'+k+'|'+cur+'|'+JSON.stringify(S.vil.tab||{})+'|'+(k?vStock(k):0)+'|'+JSON.stringify(SAVE.village)+'|'+JSON.stringify(SAVE.bag)+'|'+JSON.stringify(SAVE.stash)+'|'+JSON.stringify(SAVE.deco||0)+JSON.stringify(typeof DECO!=='undefined'?DECO.sel:0);
  if(key===S.vil.ui)return;S.vil.ui=key;
  $('vBag').innerHTML=cornerRes(resShown(k));   // עד 2 משאבים ליד ☰, מה שרלוונטי ליד המבנה הזה (RES.show), והשאר ב-"+N" (minimap.js)
  // כל מבנה: חלון גדול בתבנית אחת, עם לשוניות "מה עושים כאן" ו"שדרוג" (bwin.js). השער: חלון קטן משלו
  const pn=$('vPanel'),bw=!!cur&&cur!=='gate';
  pn.hidden=!cur;pn.classList.toggle('big',bw);pn.classList.toggle('bw',bw);document.body.classList.toggle('vpan',!pn.hidden);if(pn.hidden)return;
  if(cur==='gate'){pn.innerHTML=winHead(T('vil.out'))+'<p>'+T('vil.outInfo')+'</p><button class="vbtn" data-act="go">'+T('vil.leave')+'</button>';return}
  const keep=pn.querySelector('.bwbody')&&pn.dataset.k===k?[...pn.querySelectorAll('.bwbody,.bwgrid')].map(e=>e.scrollTop):null;
  pn.innerHTML=bwBuilding(k);pn.dataset.k=k;
  if(keep)[...pn.querySelectorAll('.bwbody,.bwgrid')].forEach((e,i)=>{if(keep[i])e.scrollTop=keep[i]});   // נגיעה בכרטיס לא קופצת לראש הרשימה
}
$('vPanel').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled||!S.vil)return;
  const a=b.dataset.act;
  if(a==='go'){leaveVillage();return}
  if(a==='close'){vShut();return}
  if(a==='tab'){(S.vil.tab||(S.vil.tab={}))[S.vil.near]=b.dataset.tab;sfx('ui');villageHud();return}   // לשונית בחלון המבנה (bwin.js)
  if(a&&a.startsWith('deco')){decoAct(a,b.dataset);villageHud();return}   // חנות הקישוטים בשוק (deco.js)
  if(!S.vil.near)return;
  if(goalAct(b)){villageHud();return}   // 📌 יעד בעולם (goal.js)
  if(a==='forge'){forgeOpen();return}
  if(a==='collect'){if(vCollect(S.vil.near))sfx('coin');villageHud();return}
  if(a==='up')vUpgrade(S.vil.near);else if(a==='stash'){if(stashMove(b.dataset.dir,b.dataset.r,b.dataset.n==='all'?0:BWIN.move))sfx('coin')}else if(a==='stashAll'){if(stashAll(b.dataset.dir))sfx('coin')}else if(a==='craft')gearCraft(b.dataset.r);else vTrade(a,b.dataset.r);
  villageHud();
});

// ✕ בפאנל: נסגר. נפתח שוב רק בנגיעה במבנה או בכפתור "להיכנס"
function vShut(){if(!S.vil)return;S.vil.open=null;villageHud()}

/* ---- פתיחת פאנל: בנגיעה, לא במעבר ---- */
// k: מבנה או 'gate'. לא נפתח מעל "בזמן שלא היית" (תור הקפיצות, welcome.js). שיחה פתוחה נסגרת: חלון אחד בכל רגע, והשחקן ביקש את המבנה
function vOpen(k){
  if(!S.vil||S.mode!=='play'||!k||!$('ovWelcome').hidden)return false;
  if(!$('npcDlg').hidden)npcTalk(null);
  // השער: חלון הקפיצה האחד (travel.js). בלי פנס דולק ובלי אבן מסע אין מה לבחור, אז הכפתור יוצא ישר לעולם
  if(k==='gate'){travelOpen(leaveVillage);return true}
  S.vil.open=k;if(k!=='gate')S.vil.near=k;sfx('ui');villageHud();return true;
}
// הכפתור הקבוע של המקום בסרגל: "להיכנס: מנסרה" ליד מבנה, "לעולם" ליד השער. נעלם כשהפאנל של המקום הזה פתוח
const vEnterEl=(()=>{const b=document.createElement('button');b.id='vEnter';b.className='nbtn talkbtn venter';b.hidden=true;
  $('talkBtn').before(b);b.addEventListener('click',()=>{if(S.vil)vOpen(b.dataset.k)});return b})();
function vEnterBtn(){
  const V=S.vil,k=V&&V.here,show=!!k&&V.open!==k&&S.mode==='play',key=show?LANG+k:'';
  if(vEnterEl.dataset.key===key)return;vEnterEl.dataset.key=key;vEnterEl.hidden=!show;vEnterEl.dataset.k=k||'';
  if(show){const g=k==='gate';vEnterEl.innerHTML='<span class="ni" aria-hidden="true">'+(g?'🚪':'🏠')+'</span>'+T(g?'ctx.out':'ctx.enter');vEnterEl.setAttribute('aria-label',g?T('vil.gate'):T('vil.enter',T('vil.'+k)))}
}
// נגיעה קצרה בקנבס, בלי לגרור: איזה מבנה (או השער) נמצא שם. האזור כולל את הגג ואת השלט שמתחת
function vTapAt(cx,cy){
  const wx=cx/ZOOM-W/2+S.cam.x,wy=cy/ZOOM-H/2+S.cam.y,g=VILLAGE.gate;let best=null,bd=1e9;
  for(const k in VILLAGE.b){const B=VILLAGE.b[k],dx=Math.abs(wx-B.x);
    if(dx<B.r*1.1&&wy>B.y-B.r*1.4&&wy<B.y+B.r*0.95){const d=Math.hypot(wx-B.x,wy-B.y);if(d<bd){bd=d;best=k}}}
  if(!best&&Math.hypot(wx-g.x,wy-g.y)<g.r+20)best='gate';
  return best;
}
{let t0=null;
  cvs.addEventListener('pointerdown',e=>{t0=S&&S.vil&&S.mode==='play'?{x:e.clientX,y:e.clientY,t:performance.now(),id:e.pointerId}:null});
  cvs.addEventListener('pointerup',e=>{const d=t0;t0=null;if(!d||d.id!==e.pointerId||!S.vil||S.mode!=='play')return;
    if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>VILLAGE.tap.move||performance.now()-d.t>VILLAGE.tap.ms)return;
    const k=vTapAt(e.clientX,e.clientY);if(k){joy=null;vOpen(k)}});
}

/* ---- ציור ---- */
// קישוטים סביב הגבול: עצים, סלעים וגבעות. תמיד באותם מקומות, ופתוח מול השער
function villageDecor(){
  const R=VILLAGE.radius;if(villageDecor.list&&villageDecor.r===R)return villageDecor.list;villageDecor.r=R;   // הכפר גדל: העצים מסביב זזים החוצה
  const out=[];
  for(let i=0;i<84;i++){const a=i/84*Math.PI*2;if(Math.abs(angDiff(a,Math.PI/2))<0.13)continue;
    const r=R+50+hash(i,1)*90;out.push({kind:hash(i,2)<0.18?'rock':'tree',x:Math.cos(a)*r,y:Math.sin(a)*r,v:hash(i,3)})}
  for(let i=0;i<26;i++){const a=(i+0.5)/26*Math.PI*2;if(Math.abs(angDiff(a,Math.PI/2))<0.17)continue;
    const r=R+250+hash(i,4)*60;out.push({kind:'hills',x:Math.cos(a)*r,y:Math.sin(a)*r,v:hash(i,5)})}
  return villageDecor.list=out;
}
// איפה עומדים הקישוטים סביב מבנה, ביחס לרדיוס שלו (ראשונים: פינות קדמיות). משותף לדו-ממד ולתלת-ממד
const VDECO=[[-0.9,0.6],[0.9,0.6],[-1.05,-0.2],[-0.75,-0.8]];
const VCOL={center:C.lilac,forge:C.ember,mill:'#C08A52',mine:C.dim,market:C.gold,stash:C.tide,inn:'#D9925A'};
// דו-ממד: צורות פשוטות. בתלת-ממד המבנים מצוירים בשכבה שמתחת (render3d.js)
function drawVillage(){
  if(!S.vil||R3D.on)return;
  const R=VILLAGE.radius,g=VILLAGE.gate;
  ctx.fillStyle='#1B2620';ctx.beginPath();ctx.arc(0,0,R+30,0,7);ctx.fill();
  ctx.strokeStyle='rgba(236,231,220,0.08)';ctx.lineWidth=40;ctx.beginPath();ctx.moveTo(0,VILLAGE.b.center.y);ctx.lineTo(g.x,g.y);ctx.stroke();
  for(const d of villageDecor()){
    if(d.kind==='tree'){ctx.fillStyle='#24452F';ctx.beginPath();ctx.arc(d.x,d.y,20+d.v*10,0,7);ctx.fill()}
    else if(d.kind==='rock'){ctx.fillStyle='#4A5064';ctx.beginPath();ctx.arc(d.x,d.y,12,0,7);ctx.fill()}
    else{ctx.fillStyle='#1E3526';ctx.beginPath();ctx.arc(d.x,d.y,70,0,7);ctx.fill()}
  }
  for(const d of VILLAGE.props){   // הקישוטים בתוך הכפר
    if(d.k==='fence'){ctx.strokeStyle='#7A5532';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x2,d.y2);ctx.stroke()}
    else if(d.k==='lamp'){ctx.fillStyle='#4A3A2A';ctx.fillRect(d.x-2,d.y-34,4,36);ctx.fillStyle=C.gold;ctx.beginPath();ctx.arc(d.x,d.y-38,5,0,7);ctx.fill()}
    else if(d.k==='crate'||d.k==='barrel'){ctx.fillStyle=d.k==='crate'?'#9A6B3C':'#7A4E2A';ctx.fillRect(d.x-7,d.y-12,14,12)}
    else{ctx.fillStyle=d.k==='bush'?'#2F5A36':'#24452F';ctx.beginPath();ctx.arc(d.x,d.y,d.k==='bush'?13:22,0,7);ctx.fill()}
  }
  if(typeof decoDraw2d==='function')decoDraw2d();   // קישוטים שנקנו (deco.js)
  // השער: קשת, כמו דלת הזהב
  ctx.strokeStyle=C.chalk;ctx.lineWidth=4;ctx.fillStyle='rgba(236,231,220,0.12)';
  ctx.beginPath();ctx.moveTo(g.x-26,g.y+14);ctx.lineTo(g.x-26,g.y-14);ctx.arc(g.x,g.y-14,26,Math.PI,0);ctx.lineTo(g.x+26,g.y+14);ctx.closePath();ctx.fill();ctx.stroke();
  for(const k in VILLAGE.b){
    const B=VILLAGE.b[k],lk=vLook(k),s=lk?lk.size:1,w=B.r*1.5*s,h=B.r*0.75*s,x=B.x-w/2,y=B.y+B.r*0.4-h;
    ctx.fillStyle='rgba(5,7,13,0.4)';ctx.beginPath();ctx.ellipse(B.x,B.y+B.r*0.4,B.r,B.r*0.35,0,0,7);ctx.fill();
    ctx.strokeStyle=VCOL[k];ctx.lineWidth=3;
    if(!lk){ctx.setLineDash([8,8]);ctx.strokeRect(x,y,w,h);ctx.setLineDash([]);continue}
    if(lk.glow){ctx.shadowColor=lk.glow;ctx.shadowBlur=24}
    if(lk.model==='tent'){ctx.fillStyle=VCOL[k];ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(B.x,y-B.r*0.3);ctx.lineTo(x+w,y+h);ctx.closePath();ctx.fill()}
    else{ctx.fillStyle='#1A2033';ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);
      ctx.fillStyle=VCOL[k];ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(B.x,y-B.r*0.55*s);ctx.lineTo(x+w+8,y);ctx.closePath();ctx.fill()}
    ctx.shadowBlur=0;
    lk.deco.forEach((d,i)=>{const [dx,dy]=VDECO[i%VDECO.length],px=B.x+dx*B.r,py=B.y+dy*B.r;
      if(d==='flag'){ctx.strokeStyle=C.chalk;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py-34);ctx.stroke();ctx.fillStyle=C.tide;ctx.beginPath();ctx.moveTo(px,py-34);ctx.lineTo(px+16,py-28);ctx.lineTo(px,py-22);ctx.fill()}
      else{ctx.fillStyle=d==='crate'?'#9A6B3C':'#7A4E2A';ctx.fillRect(px-7,py-12,14,12)}});
  }
}
// שלטים מתחת למבנים והתוצרת שמחכה. מעל הכל, בשני המצבים. כל שלט נכנס לתור (vSign), ו-vSignsFlush מסדר אותם בלי חפיפה
function drawVillageScreen(ox,oy){
  if(!S.vil)return;
  const near=VILLAGE.signs.near;
  for(const k in VILLAGE.b){
    const B=VILLAGE.b[k],L=vLv(k),x=B.x+ox,y=B.y+B.r*0.62+oy,here=S.vil.here===k&&!S.vil.open,d=Math.hypot(P.x-B.x,P.y-B.y)-B.r;
    // השם: רק כשקרובים. המבנה שלידו: 👆 וזהב, אפשר לגעת
    if(here||d<near)vSign(x,y,(here?'👆 ':'')+T('vil.'+k)+(L?' · '+L:''),here?C.gold:L?C.chalk:C.dim,here?100:40-d/20);
    // תג מעליו: מה מחכה שם, מכל מרחק. תוצרת לאסוף קודמת לשדרוג אפשרי
    const n=vStock(k),gs=k==='forge'&&gtSign();   // שעון של כלי איסוף (gtool.js)
    if(gs)vSign(x,y-B.r*1.6,gs,C.gold,58);
    else if(n>0){const r=Object.keys(VILLAGE.b[k].make)[0];vSign(x,y-B.r*1.6,'✓ '+resIcon(r)+' '+n,C.gold,60)}
    else if(!vBlock(k))vSign(x,y-B.r*1.6,'⬆ '+T(L?'vil.tagUp':'vil.tagBuild'),C.gold,55);
  }
  const g=VILLAGE.gate,dg=Math.hypot(P.x-g.x,P.y-g.y);if(dg<near*1.4)vSign(g.x+ox,g.y+oy+40,T('vil.gate'),C.chalk,45-dg/20);
}
/* ---- השלטים: בלי חפיפה, ולא מתחת לממשק ----
   vSign(x,y,טקסט,צבע,חשיבות): במסך, ביחידות של המשחק. נקרא מהכפר, מהתושבים (npc.js) ומהבתים (residents.js).
   vSignsFlush (render.js, אחרי כולם): מהחשוב לפחות חשוב, כל שלט במקום הראשון מתוך nudge שלא חופף לשלט אחר או לממשק */
const VSIGN={list:[],avoid:[],t:0};
function vSign(x,y,txt,col,prio){VSIGN.list.push({x,y,txt,col,prio})}
// המלבנים של הממשק (פס המשאבים, ☰, הדמות, הסרגל), ביחידות של המשחק. נמדד מחדש פעם ב-30 פריימים
function vAvoid(){
  if(VSIGN.t-->0)return VSIGN.avoid;VSIGN.t=30;
  return VSIGN.avoid=[...document.querySelectorAll(VILLAGE.signs.avoid)].filter(e=>!e.hidden&&e.offsetParent!==null).map(e=>{const r=e.getBoundingClientRect();return{x:r.left/ZOOM,y:r.top/ZOOM,w:r.width/ZOOM,h:r.height/ZOOM}}).filter(r=>r.w>0&&r.h>0);
}
function vSignsFlush(){
  const list=VSIGN.list;VSIGN.list=[];VSIGN.shown=[];if(!S||!S.vil||!list.length)return;
  const G=VILLAGE.signs,used=vAvoid().slice(),hit=r=>used.some(o=>r.x<o.x+o.w&&o.x<r.x+r.w&&r.y<o.y+o.h&&o.y<r.y+r.h);
  ctx.textAlign='center';ctx.direction=DIR;ctx.font='800 13px Heebo, system-ui, sans-serif';
  list.sort((a,b)=>b.prio-a.prio);
  for(const s of list){const w=ctx.measureText(s.txt).width+16;
    for(const dy of G.nudge){const y=s.y+dy,r={x:s.x-w/2-G.pad,y:y-11-G.pad,w:w+G.pad*2,h:22+G.pad*2};
      if(r.x<0||r.y<0||r.x+r.w>W||r.y+r.h>H||hit(r))continue;
      used.push(r);VSIGN.shown.push(s.txt);ctx.fillStyle='rgba(18,22,36,0.78)';ctx.beginPath();ctx.roundRect(s.x-w/2,y-11,w,22,11);ctx.fill();ctx.fillStyle=s.col;ctx.fillText(s.txt,s.x,y+5);break}}
}
