/* סוגי נשק: מה התקיפה האוטומטית עושה, לפי הנשק שלבוש. כל פריט נשק ב-GEAR.items (gear.js) מצביע על סוג כאן, בשדה w.
   כך הלוחם מניף חרב, הצייד יורה חצים מקשת, והקוסם יורה קסם מהמטה. נשק חדש = שורה כאן ופריט ב-gear.js.
   use: באיזה חלק בקוד הוא תוקף. 'sword' מקרוב, הנפה בקשת (המספרים ב-P.sw), ו-'gun' מרחוק, משהו שעף (P.gn).
     השמות sword ו-gun נשארו בקוד מימי ההחלפה בין חרב לקשת, כי הם בכל מקום: שדרוגים, סוגי נזק לכל צד (P.dt), והבוס שלומד מקרוב או מרחוק.
     השחקן לא רואה אותם: הוא רואה את שם הסוג ('wt.<סוג>' ב-lang.js).
   k: מכפילים על המספרים של P.sw / P.gn. dmg נזק, cd זמן בין מכות, speed מהירות הקליע.
   shot: מה עף. arrow חץ, bolt קליע קסם (עיגול זוהר בצבע סוג הנזק, ופרץ ניצוצות בפגיעה).
   spread: טווח הנזק (ניר, 1.11.2026, כמו ב-Diablo): כל מכה מגרילה נזק בין ממוצע×(1-spread) לממוצע×(1+spread), בהתפלגות שווה.
     לכן הממוצע הוא בדיוק הנזק של לפני הטווח, והאיזון בזירה ובעולם לא זז. חרב ושרביט צר, קשת ומטה בינוני, גרזן ופטיש רחב.
     Aging, נקודות דמות, סטים וכוחות מכפילים את הממוצע, אז הם מזיזים את שני הקצוות יחד.
   home: כמה מהר הקליע מסתובב לעבר האויב הקרוב, ברדיאנים לשנייה (0: ישר). life: כמה שניות הוא עף.
   ההנפשה בתלת-ממד לפי המודל של הפריט: GRIP3D ב-render3d.js */
const WEAPONS={
  sword: {use:'sword',spread:0.25},
  axe:   {use:'sword',spread:0.5,k:{dmg:1.25,cd:1.2}},
  hammer:{use:'sword',spread:0.6,k:{dmg:1.6,cd:1.5}},
  bow:   {use:'gun',spread:0.35,shot:'arrow',life:0.9},
  staff: {use:'gun',spread:0.3,shot:'bolt',home:5,life:1.2,k:{dmg:1.15,cd:1.1,speed:0.7}},
  wand:  {use:'gun',spread:0.2,shot:'bolt',home:7,life:1,k:{dmg:0.7,cd:0.75,speed:0.8}},
  base:{sword:20,gun:9},   // הנזק הבסיסי של דמות בלי כלום, מקרוב ומרחוק (P.sw.dmg / P.gn.dmg ב-reset, state.js)
  bolt:{r:6,burst:7,find:260},   // קליע קסם: גודל, כמה ניצוצות בפגיעה, ומאיזה מרחק הוא מרגיש אויב
  /* כוח שרואים (docs/plan-combat.md שינוי 4): רק מראה וצליל, לא נזק. ככל שהנשק משודרג (‎+N ב-Aging, כוח מוטבע) והדמות ברמה גבוהה,
     שובל ההנפה רחב יותר, החץ והקסם גדולים יותר וצליל הפגיעה חזק יותר. plus: לכל ‎+1, power: לנשק עם כוח, lvl: לכל רמת דמות, max: תקרה.
     step: כל כמה ‎+ נוסף הד לשובל (‎+3, ‎+6, ‎+9). בעולם ובכפר בלבד (juiceOn ב-juice.js) */
  grow:{plus:0.06,power:0.12,lvl:0.012,max:1.7,step:3}
};

// הנשקים שלבושים עכשיו. היום יש משבצת נשק אחת, אז כפתור ההחלפה מוסתר. משבצת שנייה תיכנס כאן
// מה שביד, והנשק הכי חזק בתרמיל מהצד השני (מקרוב <-> מרחוק). כפתור ההחלפה עובר ביניהם (swapWeapon ב-combat.js)
const wHeld=()=>[SAVE.gear.weapon,wBestOther()].filter(gItem);
// החלפה מהירה (אוראל, 1.11.2026: "אופציה מהירה להחלפה בין חץ וקשת הכי חזקים שיש לי בתיק ובין החרב הכי חזקה"). הכי חזק: gScore (gear.js)
function wBestOther(){
  const cur=SAVE.gear.weapon,use=gItem(cur)?wUse(cur):'sword';let b=null,bs=-1;
  for(const id in SAVE.bag){if(!(SAVE.bag[id]>0))continue;const it=gItem(id);if(!it||it.slot!=='weapon'||wUse(id)===use)continue;const s=gScore(id);if(s>bs){bs=s;b=id}}
  return b}
const wTypeOf=id=>{const it=gItem(id);return it&&WEAPONS[it.w]&&it.w||'sword'};
const wUse=id=>WEAPONS[wTypeOf(id)].use;
const wNow=()=>WEAPONS[P.wt]||WEAPONS.sword;
const wK=k=>(wNow().k||{})[k]||1;
/* ---- טווח נזק: כל מכה של הנשק מגרילה בטווח (spread למעלה) ----
   wRoll: נזק של מכה אחת סביב הממוצע. wRange: [מינימום, מקסימום] להצגה. wAvgNow: הממוצע של הנשק שביד עכשיו, עם כל השדרוגים.
   wItemAvg: הממוצע של פריט לבד, על דמות בלי כלום, למה שכתוב בכרטיס ובהשוואה */
const wSpread=t=>(WEAPONS[t]||WEAPONS.sword).spread||0;
const wRoll=(avg,t=P.wt)=>avg*(1+wSpread(t)*(Math.random()*2-1));
const wRange=(avg,t)=>{const s=wSpread(t);return[Math.max(1,Math.round(avg*(1-s))),Math.max(1,Math.round(avg*(1+s)))]};
const wAvgNow=()=>(P.weapon==='sword'?P.sw.dmg:P.gn.dmg)*wK('dmg')*dmgK();
function wItemAvg(id){const it=gItem(id);if(!it||!WEAPONS[it.w])return 0;const W=WEAPONS[it.w],s=gStats(id);
  return WEAPONS.base[W.use]*((W.k||{}).dmg||1)*(1+(s[W.use==='sword'?'sdmg':'gdmg']||0)/100)}
// "נזק 17–28": השורה בכרטיס הפריט, בהשוואה ובחלון הדמות
const wRangeTxt=(avg,t)=>{const r=wRange(avg,t);return T('gear.dmg','<bdi>'+r[0]+'–'+r[1]+'</bdi>')};
// השם שהשחקן רואה לצד (sword / gun): הנשק שביד, או נשק לבוש מאותו צד, ואם אין, שם כללי
function wLabel(use){
  if(P.weapon===use)return T('wt.'+P.wt);
  const id=wHeld().find(i=>wUse(i)===use);return id?T('wt.'+wTypeOf(id)):T('w.'+use);
}
// כמה הנשק שביד "גדל": 1 בנשק רגיל ברמה 1, עד grow.max. wSteps: כמה הדים לשובל
function wGrow(){const G=WEAPONS.grow,id=typeof P!=='undefined'&&P&&P.wid,lv=(typeof SAVE!=='undefined'&&SAVE.hero&&SAVE.hero.level)||1;
  return Math.min(G.max,1+gPlus(id)*G.plus+(gPow(id)?G.power:0)+(lv-1)*G.lvl)}
const wSteps=()=>Math.floor(gPlus(typeof P!=='undefined'&&P&&P.wid)/WEAPONS.grow.step);
// הנשק הזה נכנס ליד: מאיזה צד תוקפים, ואיך
function wEquip(id){P.wid=id||null;P.wt=wTypeOf(id);P.weapon=WEAPONS[P.wt].use;updateSwapBtn()}

/* ---- קליעים: המקום היחיד שיוצר אותם, כל פריים, ובפגיעה. נקרא מהזירה (update.js, combat.js) ומהעולם (world.js) ----
   wFire: יורה לכיוון P.aim לפי הנשק שביד. n: כמה קליעים במניפה. extra: שדות לקליע, כמו node, מקור משאבים שהוא בדרך אליו */
function wFire(n=1,extra){
  const g=P.gn,W=wNow(),sp=g.speed*wK('speed');
  g.t=g.cd*wK('cd');g.recoil=1;sfx('shoot');
  for(let i=0;i<n;i++){
    const a=P.aim+(i-(n-1)/2)*0.14,hx=P.x+Math.cos(a)*22,hy=P.y-6+Math.sin(a)*22;
    pb.push(Object.assign({x:hx,y:hy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:W.life||0.9,pierce:g.pierce,hit:new Set(),shot:W.shot||'arrow',home:W.home||0},extra));
  }
  parts.push({x:P.x+Math.cos(P.aim)*24,y:P.y-6+Math.sin(P.aim)*24,vx:0,vy:0,life:.06,max:.06,col:dtCol(P.dt.gun),size:3});
}
function shotFly(b,dt){
  if(b.home){
    let t=null,bd=WEAPONS.bolt.find;
    for(const e of enemies){if(e.dead||b.hit.has(e))continue;const d=Math.hypot(e.x-b.x,e.y-b.y);if(d<bd){bd=d;t=e}}
    if(t){const a=Math.atan2(b.vy,b.vx),turn=Math.max(-b.home*dt,Math.min(b.home*dt,angDiff(Math.atan2(t.y-b.y,t.x-b.x),a))),sp=Math.hypot(b.vx,b.vy);
      b.vx=Math.cos(a+turn)*sp;b.vy=Math.sin(a+turn)*sp}
  }
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
}
function shotHit(b,e){
  b.hit.add(e);damage(e,wRoll(P.gn.dmg*wK('dmg')*dmgK()),'gun',Math.atan2(b.vy,b.vx));
  if(b.shot==='bolt')sparks(b.x,b.y,dtCol(P.dt.gun),WEAPONS.bolt.burst,140);
  if(b.pierce--<=0)b.life=0;
}
