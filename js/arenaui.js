/* זירה נקייה (סקירת הזירה, אוראל 1.11.2026): ארבעה שיפורים קטנים שמורידים עומס מהמסך בזמן קרב.
   1. פס חיים מעל אויב רק לאויבי-על, למבוקש ולמי שנפגע בשנייה האחרונה (hpBarOn, render.js). לבוס יש פס משלו למעלה.
   2. מספרי נזק: מכות רצופות באותו אויב מתמזגות למספר אחד שגדל (dmgFloat, combat.js). מכה קריטית נשארת לבד, גדולה ועם מסגרת זהב.
   3. חץ בקצה המסך לאויב-על שמחוץ למסך (arenaArrows). למבוקש כבר יש חץ משלו (wanted.js).
   4. בזמן קרב הפס העליון (XP, זמן, רמה והתקדמות) שקוף יותר, ורק החיים בולטים (html.fight ב-style.css, docs/ui-guide.md) */
const ARENAUI={
  hpFor:1.2,   // כמה שניות פס החיים נשאר מעל אויב אחרי פגיעה
  merge:0.4,   // מכה באותו אויב בתוך כמה שניות מהקודמת מצטרפת למספר שלה
  grow:1.35,   // המספר המתמזג גדל עד פי כמה מהגודל הרגיל
  arrow:1      // גודל החץ לאויב-על
};
const hpBarOn=e=>e.elite||e.champ||e.wanted||S.t-(e.hitT??-99)<ARENAUI.hpFor;

// מספר נזק: מצטרף למספר הצף של אותו אויב אם הוא עוד צעיר, אחרת מספר חדש
function dmgFloat(e,d,col,size,crit){
  e.hitT=S.t;
  if(!crit){const f=floats.find(f=>f.e===e&&!f.crit&&f.life>0.75-ARENAUI.merge);
    if(f){f.n+=d;f.txt=big(f.n);f.life=0.75;f.size=Math.min(size*ARENAUI.grow,Math.max(f.size,size)+0.6);f.x=e.x;f.y=e.y-e.r-8;if(col!==C.chalk)f.col=col;return}}
  floatText(e.x+rand(-8,8),e.y-e.r-(crit?24:8),big(d)+(crit?'!':''),col,size,true,crit);   // קריטית קצת מעל, כדי לא לכסות את המספר המתמזג
  const f=floats[floats.length-1];if(f&&!crit){f.e=e;f.n=d}
}

// חץ בקצה המסך לכל אויב-על שלא רואים
function arenaArrows(ox,oy){
  if(!skArena()||S.mode!=='play')return;
  for(const e of enemies)if(!e.dead&&(e.elite||e.champ)&&!onScreen(e.x+ox,e.y+oy,0))edgeArrow(e.x+ox,e.y+oy,LOOT.elite.col,ARENAUI.arrow);
}

// הפס העליון שקט בקרב: מחליפים את המחלקה רק כשהמצב משתנה
let arenaFight=null;
function arenaQuiet(){const on=!!S&&skArena()&&S.mode==='play';if(on!==arenaFight){arenaFight=on;document.documentElement.classList.toggle('fight',on)}}
