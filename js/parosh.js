/* פרעוש: חיית המחמד של אוראל (1.11.2026). כדור פרווה סגול-שזיף ופרוע עם מסכת גנב, עיניים גדולות וחיוך עקום.
   בהשראת יצור פרוותי ושובב מסרט מצויר, אבל בעיצוב שלנו: צבע אחר, מסכה, בלי מחושים, רגליים קטנות במקום ידיים ארוכות.
   היכולת שלו, "פרעוש גונב", במקום החפירה של פיוחו: כל כמה שניות הוא מתגנב לאויב שליד השחקן, חוטף ממנו שלל ורץ חזרה.
   השלל נופל ליד השחקן (runGive ב-loot.js), דרך אותה טבלה של החפירה (stages[].dig.loot), אז הבדיקה של המשאבים רואה אותו.
   בזירה ובעולם, לא בכפר. בעולם הוא גם נושך כמו כל חיה (pet.js). גזר, שלבים ו-XP כמו אצל פיוחו.
   החיבור: ב-pet.js (steal במקום חפירה, sneak/flee, ציור), ב-render3d.js (sneak/flee רצים), וב-heroes.js (pet של הסקין).
   המודל בתלת-ממד: Parosh1 מהדף של ג'מיני (art/pets/parosh-sheet.jpg), על השלד של ההאסקי כמו פיוחו (tools/pet3d), אז כל האנימציות שלה עובדות.
   אותו מודל לשלושת השלבים (LOOK3D.pet_parosh1-3 ב-render3d.js), והגודל מ-stages[].h. נשמר: SAVE.pet.kind='parosh' */
const PAROSH={
  col:'#7B3F6E',dark:'#5A2A52',mask:'#221A28',eye:'#FFF8EC',pupil:'#1A1420',grin:'#2A1225',coin:'#F2C14E',   // צבעים
  speed:360,        // מהירות ההתגנבות והבריחה
  reach:10,         // כמה קרוב לאויב כדי לחטוף
  grab:0.35,        // כמה שניות החטיפה עצמה
  leash:240,        // רק אויב שקרוב לשחקן עד כאן. השחקן התרחק פי 1.6 מזה: חוזר בידיים ריקות
  retry:2,          // אין אויב קרוב: מנסים שוב בעוד כמה שניות
  give:34,          // מאיזה מרחק מהשחקן השלל "נמסר"
  hop:{walk:8,run:13}   // קפיצות בדו-ממד: קצב בהליכה ובריצה
};

// השלבים, כמו של פיוחו (pet.js). dig.every: כל כמה שניות גונב (בזירה פי PET.dig.arena). dig.loot: מה יוצא, בפורמט של runGive
PET.kinds.parosh={
  owner:'orel',col:PAROSH.col,steal:true,
  rescue:{item:'pouch',col:'#8A5A2B',glow:PAROSH.coin},   // פריט ההצלה שלו (rescue.js): שק שלל חום עם זוהר זהב
  stages:[
    {xp:0,   h:34,bite:4, dig:{every:22,loot:{coins:[0.85,3],copper:[0.3,1],rubyC:[0.05,1],sapphireC:[0.05,1]}}},
    {xp:720, h:40,bite:7, dig:{every:17,loot:{coins:[0.85,6],copper:[0.35,1],iron:[0.2,1],rubyC:[0.12,1],sapphireC:[0.12,1],ruby:[0.03,1]}}},
    {xp:2700,h:46,bite:11,dig:{every:13,loot:{coins:[0.9,12],silver:[0.25,1],gold:[0.08,1],ruby:[0.1,1],sapphire:[0.1,1],amber:[0.08,1],star:[0.015,1]}}}
  ],
  draw:paroshDraw
};

/* ---- הגניבה ---- */
// הטיימר של החפירה נגמר (pet.js): בוחרים את האויב הכי קרוב לשחקן, ויוצאים להתגנב
function paroshStart(p){
  p.digT=petStage().dig.every;
  let b=null,bd=PAROSH.leash;
  for(const e of enemies){if(e.dead||e.node)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;b=e}}
  if(!b){p.digT=PAROSH.retry;return false}
  p.st='sneak';p.foe=b;p.t=0;p.bag=false;return true}
// sneak: רץ לאויב וחוטף. flee: רץ חזרה לשחקן, ואם חטף משהו, מפיל אותו לידו
function paroshSteal(p,dt,dP){
  const A=PAROSH;
  if(p.st==='sneak'){const e=p.foe;
    if(!e||e.dead||dP>A.leash*1.6){p.st='flee';p.foe=null;return}
    const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1,gap=d-(e.r||0)-A.reach;p.face=Math.atan2(dy,dx);
    if(gap>0){const sp=Math.min(gap/dt+1,A.speed);p.x+=dx/d*sp*dt;p.y+=dy/d*sp*dt;p.run=true;p.t=0}
    else{p.run=false;if(p.t>=A.grab){p.bag=true;p.st='flee';p.foe=null;p.grabs=(p.grabs||0)+1;p.barkAt=p.t;sfx('tap')}}
    return}
  const dx=P.x-p.x,dy=P.y-p.y,d=Math.hypot(dx,dy)||1;
  if(d<A.give){p.st='follow';p.run=false;if(p.bag){p.bag=false;paroshGive(p)}return}
  const sp=Math.min(d/dt,A.speed);p.x+=dx/d*sp*dt;p.y+=dy/d*sp*dt;p.face=Math.atan2(dy,dx);p.run=true;
}
// השלל: כמו סוף החפירה של פיוחו (petDigEnd). נופל לרצפה ליד השחקן ונאסף כרגיל
function paroshGive(p){
  const x=p.x,y=p.y-10,n0=drops().length;
  const L=Object.assign({},petStage().dig.loot);if(!S.wd)for(const r of PET.dig.world)delete L[r];
  let got=runGive(L,x,y);
  if(!got.length){dropSpawn('coins',1,x,y+10);got=['coins']}
  for(const d of drops().slice(n0))d.pet=true;
  if(got.some(r=>lootTier(r)>=2))floatText(p.x,p.y-44,T(petTx('pet.found'),T('pet.name.parosh')),RES.rarity[2].col,15);
  p.digs++;p.dug.push(...got);petXP(PET.xp.dig);
  if(typeof questEvent==='function')questEvent('pet','dig',1);
}

/* ---- ציור בדו-ממד: כדור עם קצוות פרועים, מסכה, עיניים וחיוך. נקרא מ-drawPet (pet.js) ---- */
const PAROSH_FUR=[1,0.86,1.08,0.9,1.04,0.84,1.1,0.92,1,0.88,1.06,0.9,1.02,0.85];   // רדיוס הפרווה סביב, כדי שהקצה ייראה פרוע ולא עיגול
function paroshDraw(p,h){
  if(R3D.on){if(p.bag)paroshCoin(p.x,p.y-h*1.15,h*0.12,p.t);return}   // בתלת-ממד המודל מצויר שם, ומכאן רק המטבע שחטף
  const A=PAROSH,dir=Math.cos(p.face)<0?-1:1,moving=p.run||p.st==='follow'||p.st==='sneak'||p.st==='flee';
  const hop=moving?Math.abs(Math.sin(p.t*(p.run?A.hop.run:A.hop.walk)))*h*0.12:0,low=p.st==='sneak'?0.88:1,r=h*0.42;
  ctx.save();ctx.translate(p.x,p.y);
  ctx.fillStyle='rgba(5,7,13,0.35)';ctx.beginPath();ctx.ellipse(0,1,r*0.9,r*0.28,0,0,7);ctx.fill();
  ctx.translate(0,-hop);ctx.scale(dir,low);
  ctx.fillStyle=A.dark;for(const fx of [-0.4,0.4]){ctx.beginPath();ctx.ellipse(r*fx,-r*0.08,r*0.26,r*0.14,0,0,7);ctx.fill()}   // רגליים
  const cy=-r*1.05;ctx.fillStyle=A.col;ctx.beginPath();
  PAROSH_FUR.forEach((k,i)=>{const a=i/PAROSH_FUR.length*6.283,x=Math.cos(a)*r*k,y=cy+Math.sin(a)*r*k;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.fill();
  ctx.fillStyle=A.mask;ctx.beginPath();ctx.ellipse(r*0.22,cy-r*0.12,r*0.62,r*0.2,0,0,7);ctx.fill();   // מסכת הגנב
  for(const ex of [0.02,0.42]){ctx.fillStyle=A.eye;ctx.beginPath();ctx.arc(r*ex,cy-r*0.12,r*0.15,0,7);ctx.fill();
    ctx.fillStyle=A.pupil;ctx.beginPath();ctx.arc(r*ex+r*0.05,cy-r*0.14,r*0.07,0,7);ctx.fill()}
  ctx.strokeStyle=A.grin;ctx.lineWidth=Math.max(1.2,r*0.07);ctx.lineCap='round';ctx.beginPath();ctx.arc(r*0.26,cy+r*0.1,r*0.24,0.25,2.4);ctx.stroke();   // חיוך עקום
  ctx.restore();
  if(p.bag)paroshCoin(p.x,p.y-hop-h*1.15,r*0.18,p.t);
}
// המטבע שחטף, מסתובב מעל הראש בדרך חזרה
function paroshCoin(x,y,r,t){ctx.fillStyle=PAROSH.coin;ctx.beginPath();ctx.ellipse(x,y,r,r*Math.abs(Math.cos(t*6))+1,0,0,7);ctx.fill()}
