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
    {id:'def',icon:'🛡️',v:()=>P.def>0||defFx()?T('gui.defV',Math.round(P.def||0),Math.round(defNow())):'0'},   // נקודות הגנה, וכמה הן בולעות מול המפלצות כאן (defense.js)
    {id:'regen',icon:'💚',v:()=>P.regen>0?T('gui.ps','+'+Math.round(P.regen*10)/10):null,opt:1},
    {id:'loot',icon:'🍀',v:()=>P.loot>0?gPct(P.loot):null,opt:1}
  ],
  // צללית במשבצת ריקה: מה נכנס אליה
  empty:{weapon:'⚔️',shield:'🛡️',head:'🪖',body:'🧥',acc:'💍',boots:'👢',orbit:'✨'}
};
const gPct=n=>(n>0?'+':'')+Math.round(n)+'%';
// עמידות לסוג נזק: ההגנה הכללית חלה על כל מכה, ועמידות לסוג מסוים (P.res, כשתהיה) נוספת לה. עד התקרה (defense.js)
const gResist=t=>Math.round(Math.min(defWorld()?DEFENSE.cap:STATS.cap.def,defNow()+((P.res||{})[t]||0)));   // defense.js
const gDtPic=t=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+DMG.types[t].icon+'" fill="currentColor"/></svg>';

// ערך שהוא 0 ("0%", "+0%", "0"): השורה לא מוצגת (ניר, 2.11: "טבלה עם הרבה 0%")
const gZero=v=>v==null||/^[+-]?0(\.0)?%?$/.test(String(v));
// הטור כשלא נבחר פריט: מספר הכוח של הגיבור (power.js), הסטטים בלי שורות 0, ואחריהם העמידויות שאינן 0. בלי גלילה ב-844×390
function gStatPanel(){
  const rows=GEARUI.rows.map(r=>{const v=r.v();if(gZero(v))return '';
    return '<li><span class="gsi" aria-hidden="true">'+r.icon+'</span><span class="gsn">'+T('gui.'+r.id)+'</span><b'+(r.col?' style="color:'+r.col()+'"':'')+'><bdi>'+v+'</bdi></b></li>'}).join('');
  const res=Object.keys(DMG.types).filter(t=>gResist(t)>0).map(t=>'<li style="--dt:'+dtCol(t)+'" title="'+T('dt.'+t)+'" aria-label="'+T('dt.'+t)+'">'+gDtPic(t)+'<bdi>'+gResist(t)+'%</bdi></li>').join('');
  return powHeroHtml()+'<h3>'+T('gui.stats')+'</h3><ul class="gsrows">'+rows+'</ul>'+(res?'<h4>'+T('gui.res')+'</h4><ul class="gres">'+res+'</ul>':'')+heroSkinRow();
}
// מעל הדמות: סט פעיל, בצבע שלו, עם כמה חלקים לבושים
function gSetBadge(){
  const c=setCounts(gearWorn());
  return Object.keys(c).filter(s=>c[s]>=2).map(s=>'<i class="gsetb" style="--set:'+SETS[s].col+'">'+T('set.'+s)+' <bdi>'+c[s]+'/'+setItems(s).length+'</bdi></i>').join('');
}

// בועת הפריט (itemtip.js): כשנבחר פריט, הפרטים צפים ליד המשבצת שלו, והטור מציג בינתיים את הסטטים. לא במצב מכירה
const gTipTile=()=>GUI.sell?null:document.querySelector('#gItems [data-id][aria-pressed="true"],#gSlots [data-slot][aria-pressed="true"],#gStash [data-sid][aria-pressed="true"]');
const gTipAgain=b=>b.getAttribute('aria-pressed')==='true'&&!GUI.sell;   // נגיעה בפריט שכבר פתוח
function gTipSync(){
  const d=$('gDetail'),a=d.querySelector('.gdhead,.icard')&&gTipTile();
  let s=$('gStatAlt');if(!s){s=document.createElement('div');s.id='gStatAlt';s.className='gdetail gstatp';d.after(s)}
  s.hidden=!a;if(a)s.innerHTML=gStatPanel();
  itemTip(d,a);
}

/* ---- כרטיס החפץ שנבחר (ניר, 4.11.2026, בהשראת XP Hero: docs/refs/xphero/item-card.jpg) ----
   אותו כרטיס של חלונות הקנייה (itemCard ב-itemcard.js): תמונה, שם בצבע הנדירות, מספר כוח ענק, ▲/▼ מול מה שלבוש,
   ורק השורות שיש בהן משהו. מתחת: האיכות, בונוס המחלקה, הדרישות (באדום כשלא עומדים בהן), הכוח והסט.
   ולמטה שני כפתורים גדולים: ללבוש (או להוריד) ולשדרג, שעובר לנפחייה (forgeOpen ב-aging.js). משאב נשאר בתצוגה הישנה (gDetailHtml) */
// האיכות כמספר כוח: מה יצא, מתוך הטווח שיכול היה לצאת ("260 מתוך 225–275"). חפץ בלי איכות: כלום
function gQLine(id){if(!gQtag(id))return '';const p=q=>icPow(id.replace(/~\d+/,'~'+q));
  return '<p class="iq">'+T('gui.q','<bdi>'+icPow(id)+'</bdi>','<bdi dir="ltr">'+p(ITEMROLL.q.min)+'–'+p(ITEMROLL.q.max)+'</bdi>')+'</p>'}
// אפשר לשדרג מכאן: בכפר עם נפחייה, וחפץ שאינו מסתובב (לאלה יש התכה). מהמחסן מוציאים קודם
const gUpOk=(k,sel)=>!sel.sid&&gItem(k).slot!=='orbit';
const gUpHere=()=>!!(S.vil&&vLv('forge')>0);
function gCardHtml(k,sel,n){
  const it=gItem(k),btn=(act,txt,cls,off)=>'<button class="vbtn'+(cls?' '+cls:'')+'" data-act="'+act+'"'+(off?' disabled':'')+'>'+txt+'</button>';
  const orb=it.slot==='orbit'&&sel.id?gOrbCompare(k,gGet('orbit',gTarget(it))):'';   // חפץ מסתובב: מה מתווסף ומה הולך (gear.js)
  const pre=orb+(gPlus(k)?'<p class="gage">'+T('gear.aged',gPlus(k))+'</p>':'')+gQLine(k)+powLine(k);   // הדרישות ובונוס המחלקה: בכרטיס עצמו (itemcard.js)
  let b='';
  if(sel.id)b+=irCanWear(k)?btn('equip',T('gear.equip'),'gcequip'):btn('equip',T('ir.cant'),'gcequip',1);
  if(sel.slot)b+=gCanOff(k)?btn('unequip',T('gear.unequip'),'ghost'):btn('unequip',T('gear.keepOn'),'ghost',1);   // אי אפשר ללבוש בחזרה: לא מורידים (gear.js)
  if(sel.sid)b+=btn('take',T('gear.take'),'gcequip');
  if(gUpOk(k,sel))b+=gUpHere()?btn('gup','⬆️ '+T('gui.up'),'gcup'):btn('gup',T('gui.upVil'),'gcup',1);
  b+='<button class="vbtn ghost glock" data-act="lock" aria-pressed="'+gLocked(k)+'" aria-label="'+T(gLocked(k)?'gear.unlock':'gear.lock')+'" title="'+T(gLocked(k)?'gear.unlock':'gear.lock')+'">'+(gLocked(k)?'🔒':'🔓')+'</button>';   // נעול: לא נמכר
  if(sel.id&&gStashOn())b+='<button class="vbtn ghost glock" data-act="store" aria-label="'+T('gear.store')+'" title="'+T('gear.store')+'">📦</button>';
  return '<button class="gdx" data-act="desel" aria-label="'+T('gear.close')+'">✕</button>'+itemCard(k,{worn:!!sel.slot,n,pre})+'<div class="gbtns gcbtns">'+b+'</div>';
}
// לשדרג: סוגרים את הציוד ופותחים את הנפחייה, עם החפץ כבר בחור
function gUpgrade(sel){
  if(!gUpHere())return false;
  const pick=sel.id?{id:sel.id}:{slot:sel.slot,i:sel.i};
  gearClose();forgeOpen();if(S.mode!=='forge')return false;
  AUI.sel=pick;forgeDraw();sfx('ui');return true;
}
