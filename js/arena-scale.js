/* קושי לפי הכוח שלך בזירה (אוראל, 2.11: "האיזון בזירה ממש לא טוב, אני הרבה יותר חזק מהאויבים").
   בתחילת ריצה מודדים את השחקן אחרי הציוד, הדמות, הדרגה והנקודות: נזק לשנייה ועמידות, מול שחקן חדש.
   מי שחזק פי כמה מקבל אויבים חזקים בהתאם, כדי שהאתגר יהיה בערך אותו דבר. שחקן חדש לא משתנה (×1).
   זה מכפיל מעל ההתחלה הרכה (RUN.ease) ומעל הגדילה עם הזמן (runK), לא במקומם.
   מתחבר: runUpdate (מדידה), addEnemy (חיים), makeBoss (חיי הבוס), hurt ב-combat.js (נזק לשחקן) */
const ARENA_SCALE={
  arenas:['classic','waves'],    // באילו זירות. לא בעולם, לא בכפר ולא במשחקי השאול
  base:{dps:47.2,ehp:125,wdmg:22}, // שחקן חדש: לוחם עם חרב עץ בלי שום ציוד. 22 נזק כל 0.55 שנייה עם 12% קריטי ×2.5, ו-125 חיים
  hpExp:1,                       // חיי האויבים: פי (הנזק שלך יחסית לחדש) בחזקת זה
  dmgExp:0.7,                    // נזק האויבים: פי (העמידות שלך יחסית לחדש) בחזקת זה. עדין יותר, כדי שציוד הגנה עדיין ירגיש
  multi:0.5,                     // כל חץ נוסף בקשת שווה חצי חץ (לא כולם פוגעים)
  max:{hp:20,dmg:8},             // תקרה
  free:1.1,                      // עד כאן לא משנים כלום, שלא יופיע "×1.0" על שינוי קטן
  show:3,                        // כמה שניות השורה "הזירה מתאימה את עצמה" נשארת
  tip:{runs:2,key:'fh-arena-tip',show:4}   // טיפ לשחקן חדש: בכמה ריצות ראשונות, איפה נספר, וכמה שניות
};

const ascOn=()=>!!(S&&S.run&&!S.wd&&!S.mb&&!S.vil&&ARENA_SCALE.arenas.includes(S.arena||'classic'));
// הכוח של השחקן עכשיו: נזק לשנייה של הנשק שביד, ועמידות (חיים אחרי הגנה)
function arenaPower(){
  const sw=P.weapon==='sword',s=sw?P.sw:P.gn,A=ARENA_SCALE;
  const crit=Math.min(1,HITFX.crit+Math.min(STATS.cap.crit,P.crit||0)/100);
  const dps=s.dmg*wK('dmg')/(s.cd*wK('cd'))*(1+crit*(HITFX.critMul-1))*(sw?1:1+(Math.max(1,P.gn.multi)-1)*A.multi);
  const def=Math.min(STATS.cap.def,(P.def||0)+(typeof statDefFx==='function'?statDefFx():0));
  return{dps,ehp:P.maxHp/(1-def/100),wdmg:Math.max(P.sw.dmg,P.gn.dmg)};
}
// המכפילים: נמדד פעם אחת בתחילת הריצה ונשמר ב-S.run.sc. שינוי באמצע הריצה (רמות, קלפים) הוא ההתקדמות של הריצה, ולא נספר
function arenaScaleCalc(pw=arenaPower()){
  const A=ARENA_SCALE,B=A.base,k=(r,e,m)=>{const v=Math.pow(Math.max(1,r),e);return v<A.free?1:Math.min(m,v)};
  const hp=k(pw.dps/B.dps,A.hpExp,A.max.hp),dmg=k(pw.ehp/B.ehp,A.dmgExp,A.max.dmg);
  // חיי הבוס כבר נמדדים מול הנשק שלך (RUN.bossHits ב-boss.js), אז מוסיפים רק את מה שהנשק לבד לא מראה (קצב, קריטי, חצים)
  const boss=Math.max(1,Math.min(A.max.hp,hp*B.wdmg/Math.max(B.wdmg,pw.wdmg)));
  return{hp,dmg,boss,pw};
}
function arenaScaleStart(){
  const r=S.run;if(r.sc)return;
  r.sc=ascOn()?arenaScaleCalc():{hp:1,dmg:1,boss:1};
  const m=Math.max(r.sc.hp,r.sc.dmg);
  if(m>1){floatText(P.x,P.y-58,T('ascale',m.toFixed(1)),C.gold,14,false);const f=floats[floats.length-1];if(f){f.life=ARENA_SCALE.show;f.vy=-10}}
  arenaTip();
}
// טיפ בשתי הריצות הראשונות בזירה: מתחת לגיבור, כדי לא להתנגש בבאנר של הגל או בשורת הקושי שמעליו
function arenaTip(){
  const A=ARENA_SCALE.tip;if(!ascOn())return;
  let n=0;try{n=+localStorage.getItem(A.key)||0}catch(e){}
  S.run.tip=n<A.runs;try{localStorage.setItem(A.key,n+1)}catch(e){}
  if(!S.run.tip)return;
  floatText(P.x,P.y+46,T('arena.tip'),C.chalk,13,false);const f=floats[floats.length-1];if(f){f.life=A.show;f.vy=-4}
}
// התג ליד הרמה (render.js, drawRunBar): המכפיל, רק כשהוא מעל 1
function ascHud(){
  const b=$('ascB'),s=ascOn()&&S.run.sc,m=s?Math.max(s.hp,s.dmg):1,on=m>1;
  if(b.hidden===on)b.hidden=!on;if(!on)return;
  const v='×'+m.toFixed(1)+LANG;if(b.dataset.v!==v){b.dataset.v=v;b.textContent='×'+m.toFixed(1);b.title=T('ascale.tip');b.setAttribute('aria-label',T('ascale.tip')+': ×'+m.toFixed(1))}
}
const asc=()=>{if(!ascOn())return null;if(!S.run.sc)arenaScaleStart();return S.run.sc};
const ascHp=()=>{const s=asc();return s?s.hp:1};
const ascDmg=()=>{const s=asc();return s?s.dmg:1};
const ascBoss=()=>{const s=asc();return s?s.boss:1};
