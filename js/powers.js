/* כוחות על ציוד (roadmap.md, "Claude מוביל"), כמו ב-Diablo 4.
   חלק מהפריטים שנופלים כשלל מגיעים עם כוח אחד (powRoll, נקרא מ-gRoll ב-gear.js).
   בנפחייה, בלשונית "כוחות": "להוציא" כוח מפריט שבתרמיל (הפריט נהרס, והכוח נכנס לאוסף),
   ו"להטביע" כוח מהאוסף על פריט אחר מאותו סוג (weapon / acc / boots), תמורת משאבים ומטבעות. כוח קודם על הפריט מוחלף.
   הכוח כתוב על הפריט עצמו, אחרי הרמה: 'oakBow+3#keen' (gPow ב-gear.js). שמירה ישנה בלי '#' ממשיכה לעבוד.
   האוסף: SAVE.powers = {keen:2}. נוצר בפעם הראשונה שצריך אותו, ולכן שמירה ישנה מקבלת אותו לבד.
   give: הסטטים שהכוח מוסיף לפריט, באותן יחידות של GEAR.stats (gApply ב-gear.js). כוח בלי מנגנון במשחק לא נכנס לכאן.
   הסטטים נכנסים ל-gStats, ולכן חלים על השחקן כמו כל סטט של ציוד. השמות ב-lang.js: 'pw.<id>' ו-'pw.*' */
const POWERS={
  chance:0.2,              // הסיכוי שפריט שנופל כשלל מגיע עם כוח
  extract:{coins:15},      // מה עולה להוציא כוח מפריט
  col:'#F4C74F',           // הצבע של שורת הכוח (זהב)
  list:{
    fury:   {slot:'weapon',icon:'🔥',give:{sdmg:15},  cost:{coins:60,iron:3}},
    hunt:   {slot:'weapon',icon:'🎯',give:{gdmg:15},  cost:{coins:60,iron:3}},
    haste:  {slot:'weapon',icon:'⚡',give:{aspd:8},   cost:{coins:80,silver:2}},
    keen:   {slot:'acc',   icon:'💥',give:{crit:5},   cost:{coins:70,silver:2}},
    fortune:{slot:'acc',   icon:'🍀',give:{loot:12},  cost:{coins:70,gold:1}},
    mend:   {slot:'acc',   icon:'💚',give:{regen:1},  cost:{coins:50,stone:10}},
    wind:   {slot:'boots', icon:'🌬️',give:{speed:8},  cost:{coins:50,wood:10}},
    stone:  {slot:'boots', icon:'🛡️',give:{def:5},    cost:{coins:60,stone:15}}
  }
};

const powOf=p=>p&&POWERS.list[p]||null;
const powGive=p=>(powOf(p)||{}).give||{};
const powBox=()=>SAVE.powers||(SAVE.powers={});
const powSlots=()=>[...new Set(Object.values(POWERS.list).map(p=>p.slot))];
const powFor=slot=>Object.keys(POWERS.list).filter(p=>POWERS.list[p].slot===slot);
// אותו פריט, עם כוח אחר (או בלי, p=null). הרמה מה-Aging נשמרת
const powId=(id,p)=>gBase(id)+(gPlus(id)?'+'+gPlus(id):'')+(p?'#'+p:'');
// "+5% מכה קריטית": מה הכוח נותן, בשורה אחת
const powDesc=p=>Object.keys(powGive(p)).map(k=>gSign(k,powGive(p)[k])).join(' · ');
const powName=p=>POWERS.list[p].icon+' '+T('pw.'+p);

// פריט חדש מהשלל: לפעמים מגיע עם כוח שמתאים לסוג שלו
function powRoll(id,roll=Math.random()){
  const it=gItem(id),ks=it?powFor(it.slot):[];
  if(!ks.length||gPow(id)||roll>=POWERS.chance)return id;
  return powId(id,ks[Math.floor(Math.random()*ks.length)]);
}

/* להוציא: רק מפריט בתרמיל, כדי שלא יהרסו בטעות משהו שלבוש. מחזיר את הכוח, או null */
function powExtract(id){
  const p=gPow(id),c=POWERS.extract;
  if(!powOf(p)||!bagHas(id)||Object.keys(c).some(r=>!bagHas(r,c[r])))return null;
  for(const r in c)bagTake(r,c[r]);
  bagTake(id);powBox()[p]=(powBox()[p]||0)+1;
  saveNow();return p;
}
// למה אי אפשר להטביע: 'slot', 'none' (אין באוסף), 'same' (כבר עליו), 'cost', או null אם אפשר
function powBlock(id,p){
  const P0=powOf(p),it=gItem(id);
  if(!P0||!it||it.slot!==P0.slot)return 'slot';
  if(!(powBox()[p]>0))return 'none';
  if(gPow(id)===p)return 'same';
  for(const r in P0.cost)if(!bagHas(r,P0.cost[r]))return 'cost';
  return null;
}
/* להטביע. ref: {id} פריט בתרמיל, או {slot,i} משבצת. מחזיר את הפריט החדש, או null */
function powImprint(ref,p){
  const id=ref.id||gGet(ref.slot,ref.i);
  if(!gItem(id)||powBlock(id,p)||ref.id&&!bagHas(id))return null;
  const nid=powId(id,p),c=POWERS.list[p].cost;
  for(const r in c)bagTake(r,c[r]);
  if(!--powBox()[p])delete powBox()[p];
  if(ref.id){bagTake(id);bagAdd(nid)}
  else{const before=gearStats();gSet(ref.slot,ref.i,nid);if(P)gearLive(before)}   // לבוש: הסטט החדש חל מיד
  saveNow();return nid;
}

/* ---- שורת הכוח בפרטי פריט (gDetailHtml ב-gear.js ובנפחייה): בזהב ---- */
const powLine=id=>{const p=gPow(id);return powOf(p)?'<p class="gpow">✦ '+powName(p)+' · '+powDesc(p)+'</p>':''};

/* ---- הלשונית בנפחייה (aging.js קורא ל-powDraw כש-AUI.tab==='pow') ---- */
function powDraw(){
  const sel=AUI.sel,id=aSelId(),box=powBox();
  $('fItems').innerHTML=forgeItemsHtml(powSlots())||'<p class="dim">'+T('age.noItems')+'</p>';
  const chip=p=>'<button class="vbtn ghost pwc" data-pw="'+p+'" aria-pressed="'+(AUI.pw===p)+'">'+powName(p)+' <bdi>×'+box[p]+'</bdi></button>';
  if(!gItem(id)){
    const own=Object.keys(box).filter(p=>powOf(p)&&box[p]>0);
    $('fDetail').innerHTML='<p class="dim">'+T('pw.hint')+'</p><span class="sk">'+T('pw.box')+'</span>'+
      (own.length?own.map(p=>'<p>'+powName(p)+' <bdi>×'+box[p]+'</bdi> · <span class="dim">'+powDesc(p)+'</span></p>').join(''):'<p class="dim">'+T('pw.empty')+'</p>');
    return}
  const it=gItem(id),cur=gPow(id);
  let d='<h3 style="color:'+gTint(id)+'">'+gIcon(id)+' '+gName(id)+'</h3>'+(powLine(id)||'<p class="dim">'+T('pw.noPow')+'</p>');
  // להוציא: רק מהתרמיל
  if(powOf(cur)){
    if(sel.id){const c=POWERS.extract,ok=Object.keys(c).every(r=>bagHas(r,c[r]));
      d+='<p class="dim">'+T('pw.extractWarn')+'</p><div class="cost">'+costLine(c)+'</div>'+
        '<button class="vbtn" data-act="extract"'+(ok?'':' disabled')+'>'+T('pw.extract')+'</button>'}
    else d+='<p class="dim">'+T('pw.wornNo')+'</p>'}
  // להטביע: הכוחות באוסף שמתאימים לסוג הפריט
  const ks=powFor(it.slot).filter(p=>box[p]>0);
  d+='<span class="sk">'+T('pw.imprintOn')+'</span>';
  if(!ks.length)d+='<p class="dim">'+T('pw.none')+'</p>';
  else{
    if(!ks.includes(AUI.pw))AUI.pw=ks[0];
    d+='<div class="pwrow">'+ks.map(chip).join('')+'</div>';
    const p=AUI.pw,why=powBlock(id,p);
    d+='<p>'+powDesc(p)+'</p>'+(powOf(cur)&&cur!==p?'<p class="dim">'+T('pw.replace',powName(cur))+'</p>':'')+'<div class="cost">'+costLine(POWERS.list[p].cost)+'</div>';
    d+='<button class="vbtn" data-act="imprint"'+(why?' disabled':'')+'>'+(why==='same'?T('pw.same'):why==='cost'?T('age.needCost'):T('pw.imprint'))+'</button>';
  }
  $('fDetail').innerHTML=d;
}
// לחיצה בלשונית הכוחות. מחזיר true אם טיפל בה (aging.js)
function powClick(b){
  if(b.dataset.pw){AUI.pw=b.dataset.pw;return true}
  if(b.dataset.act==='extract'){const p=powExtract(aSelId());
    if(p){AUI.sel=null;AUI.pw=p;celebrate(P.x,P.y-20,'aging',POWERS.list[p].icon);banner(T('pw.got',powName(p)),POWERS.col)}return true}
  if(b.dataset.act==='imprint'){const nid=powImprint(AUI.sel,AUI.pw);
    if(nid){if(AUI.sel.id)AUI.sel={id:nid};celebrate(P.x,P.y-20,'aging','✦');banner(T('pw.done',gName(nid),powName(gPow(nid))),POWERS.col)}return true}
  return false;
}
