/* חלון הציוד, הצד המוצג (ניר, 2.11.2026, בהשראת מסך הציוד של משחקי RPG קלאסיים): דמות במרכז עם המשבצות סביבה, תרמיל ברשת,
   וטור סטטים: מה הגיבור שווה עכשיו, עם כל מה שלבוש, הנקודות, הדרגה והדמות. ועמידות לכל סוג נזק בצבעים של DMG (dmg.js).
   כאן רק הצגה: המספרים נקראים מ-P, שעליו כבר חלים הציוד והנקודות (gApply ב-gear.js). gearDraw קורא ל-gStatPanel כשלא נבחר פריט.
   שורה חדשה בטור = שורה ב-GEARUI.rows. הטקסטים ב-lang.js ('gui.*') */
const GEARUI={
  // הטור: id, אייקון, ואיך מחשבים את הערך. opt: מוצג רק כשיש בו משהו
  rows:[
    {id:'hp',icon:'❤️',v:()=>Math.round(P.maxHp)},
    {id:'dmg',icon:'⚔️',v:()=>{const r=wRange(wAvgNow(),P.wt);return r[0]+'–'+r[1]},col:()=>dtCol(P.dt[P.weapon])},
    {id:'aspd',icon:'⏱️',v:()=>{const g=P.weapon==='sword'?P.sw:P.gn;return T('gui.ps',(1/Math.max(0.05,g.cd*wK('cd'))).toFixed(1))}},
    {id:'speed',icon:'👟',v:()=>gPct(P.speed/MOVE.speed*100-100)},
    {id:'crit',icon:'💥',v:()=>Math.round(HITFX.crit*100+Math.min(STATS.cap.crit,P.crit||0))+'%'},
    {id:'def',icon:'🛡️',v:()=>Math.round(Math.min(STATS.cap.def,P.def||0))+'%'},
    {id:'regen',icon:'💚',v:()=>P.regen>0?T('gui.ps','+'+Math.round(P.regen*10)/10):null,opt:1},
    {id:'loot',icon:'🍀',v:()=>P.loot>0?gPct(P.loot):null,opt:1}
  ],
  // צללית במשבצת ריקה: מה נכנס אליה
  empty:{weapon:'⚔️',head:'🪖',body:'🧥',acc:'💍',boots:'👢',orbit:'✨'}
};
const gPct=n=>(n>0?'+':'')+Math.round(n)+'%';
// עמידות לסוג נזק: ההגנה הכללית חלה על כל מכה, ועמידות לסוג מסוים (P.res, כשתהיה) נוספת לה. עד התקרה של STATS.cap.def
const gResist=t=>Math.round(Math.min(STATS.cap.def,(P.def||0)+((P.res||{})[t]||0)));
const gDtPic=t=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+DMG.types[t].icon+'" fill="currentColor"/></svg>';

// הטור כשלא נבחר פריט: הסטטים, ואחריהם העמידויות. בלי גלילה ב-844×390
function gStatPanel(){
  const rows=GEARUI.rows.map(r=>{const v=r.v();if(r.opt&&v==null)return '';
    return '<li><span class="gsi" aria-hidden="true">'+r.icon+'</span><span class="gsn">'+T('gui.'+r.id)+'</span><b'+(r.col?' style="color:'+r.col()+'"':'')+'><bdi>'+v+'</bdi></b></li>'}).join('');
  const res=Object.keys(DMG.types).map(t=>'<li style="--dt:'+dtCol(t)+'" title="'+T('dt.'+t)+'" aria-label="'+T('dt.'+t)+'">'+gDtPic(t)+'<bdi>'+gResist(t)+'%</bdi></li>').join('');
  return '<h3>'+T('gui.stats')+'</h3><ul class="gsrows">'+rows+'</ul><h4>'+T('gui.res')+'</h4><ul class="gres">'+res+'</ul>';
}
// מעל הדמות: סט פעיל, בצבע שלו, עם כמה חלקים לבושים
function gSetBadge(){
  const c=setCounts(gearWorn());
  return Object.keys(c).filter(s=>c[s]>=2).map(s=>'<i class="gsetb" style="--set:'+SETS[s].col+'">'+T('set.'+s)+' <bdi>'+c[s]+'/'+setItems(s).length+'</bdi></i>').join('');
}
