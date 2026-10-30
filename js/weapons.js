/* סוגי נשק: מה התקיפה האוטומטית עושה, לפי הנשק שלבוש. כל פריט נשק ב-GEAR.items (gear.js) מצביע על סוג כאן, בשדה w.
   כך הלוחם מניף חרב, הצייד יורה חצים מקשת, והקוסם יורה קסם מהמטה. נשק חדש = שורה כאן ופריט ב-gear.js.
   use: באיזה חלק בקוד הוא תוקף. 'sword' מקרוב, הנפה בקשת (המספרים ב-P.sw), ו-'gun' מרחוק, משהו שעף (P.gn).
     השמות sword ו-gun נשארו בקוד מימי ההחלפה בין חרב לקשת, כי הם בכל מקום: שדרוגים, סוגי נזק לכל צד (P.dt), והבוס שלומד מקרוב או מרחוק.
     השחקן לא רואה אותם: הוא רואה את שם הסוג ('wt.<סוג>' ב-lang.js).
   k: מכפילים על המספרים של P.sw / P.gn. dmg נזק, cd זמן בין מכות, speed מהירות הקליע.
   shot: מה עף. arrow חץ, bolt קליע קסם (עיגול זוהר בצבע סוג הנזק, ופרץ ניצוצות בפגיעה).
   home: כמה מהר הקליע מסתובב לעבר האויב הקרוב, ברדיאנים לשנייה (0: ישר). life: כמה שניות הוא עף.
   ההנפשה בתלת-ממד לפי המודל של הפריט: GRIP3D ב-render3d.js */
const WEAPONS={
  sword: {use:'sword'},
  axe:   {use:'sword',k:{dmg:1.25,cd:1.2}},
  hammer:{use:'sword',k:{dmg:1.6,cd:1.5}},
  bow:   {use:'gun',shot:'arrow',life:0.9},
  staff: {use:'gun',shot:'bolt',home:5,life:1.2,k:{dmg:1.15,cd:1.1,speed:0.7}},
  wand:  {use:'gun',shot:'bolt',home:7,life:1,k:{dmg:0.7,cd:0.75,speed:0.8}},
  bolt:{r:6,burst:7,find:260}   // קליע קסם: גודל, כמה ניצוצות בפגיעה, ומאיזה מרחק הוא מרגיש אויב
};

// הנשקים שלבושים עכשיו. היום יש משבצת נשק אחת, אז כפתור ההחלפה מוסתר. משבצת שנייה תיכנס כאן
const wHeld=()=>[SAVE.gear.weapon].filter(gItem);
const wTypeOf=id=>{const it=gItem(id);return it&&WEAPONS[it.w]&&it.w||'sword'};
const wUse=id=>WEAPONS[wTypeOf(id)].use;
const wNow=()=>WEAPONS[P.wt]||WEAPONS.sword;
const wK=k=>(wNow().k||{})[k]||1;
// השם שהשחקן רואה לצד (sword / gun): הנשק שביד, או נשק לבוש מאותו צד, ואם אין, שם כללי
function wLabel(use){
  if(P.weapon===use)return T('wt.'+P.wt);
  const id=wHeld().find(i=>wUse(i)===use);return id?T('wt.'+wTypeOf(id)):T('w.'+use);
}
// הנשק הזה נכנס ליד: מאיזה צד תוקפים, ואיך
function wEquip(id){P.wid=id||null;P.wt=wTypeOf(id);P.weapon=WEAPONS[P.wt].use;updateSwapBtn()}

/* ---- קליעים: כל פריים, ובפגיעה. נקרא מהזירה (update.js) ומהעולם (world.js) ---- */
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
  b.hit.add(e);damage(e,P.gn.dmg*wK('dmg')*dmgK(),'gun',Math.atan2(b.vy,b.vx));
  if(b.shot==='bolt')sparks(b.x,b.y,dtCol(P.dt.gun),WEAPONS.bolt.burst,140);
  if(b.pierce--<=0)b.life=0;
}
