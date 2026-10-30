/* ציוד ותרמיל: משבצת לנשק, משבצות לאקססוריז, ו-5 משבצות לחפצים המסתובבים (נפתחות עם רמת הדמות).
   כל פריט הוא שורה ב-GEAR.items. בתרמיל פריט נשמר לפי ה-id שלו, כמו משאב (SAVE.bag.oakSword=1), ומה שלבוש נשמר ב-SAVE.gear.
   הסטטים של מה שלבוש חלים על השחקן בתחילת כל ריצה: gearReset, נקרא מ-reset.
   שלל: בסוף ריצה נופלים לפעמים פריטים לתרמיל (gearLoot, נקרא מ-gameOver), ליד המשאבים שהכפר מטפל בהם.
   המסך נפתח מכל מקום (כפתור בכפר ובזירה), ובזירה הריצה עוצרת. השמות והטקסטים ב-lang.js: 'it.<id>' לפריטים, 'st.<סטט>', 'orb.<סוג>' ו-'gear.*' */

const GEAR={
  slots:{acc:2,boots:1,orbit:[1,1,5,10,15]},   // boots: משבצת לנעליים, מתחת לאקססוריז בבובה   // orbit: מאיזו רמת דמות נפתחת כל משבצת. 2 פתוחות בהתחלה
  // החומרים, מהחלש לחזק. col: הצבע של הפריט (tint), אלא אם ב-look כתוב אחרת. w: כמה נפוץ בשלל.
  // metal: המשאב (RES) של השכבה. כל מתכון בשכבה צריך אותו, ובנפחייה ברמה L יוצרים עד שכבה L-1
  tiers:[{id:'wood',col:'#B07A45',w:50,metal:'wood'},{id:'iron',col:'#9AA3AD',w:30,metal:'iron'},{id:'silver',col:'#DCE3EA',w:14,metal:'silver'},{id:'gold',col:C.gold,w:5,metal:'gold'},{id:'legend',col:'#FF6FB5',w:1,metal:'mythril'}],
  // הסטטים. איך כל אחד חל על השחקן: gearReset. unit: מה מוצג אחרי המספר. w: משקל בהשוואה "מה יותר טוב"
  stats:{sdmg:{unit:'%',w:1},gdmg:{unit:'%',w:1},hp:{unit:'',w:0.4},speed:{unit:'%',w:1.5},magnet:{unit:'%',w:0.3},regen:{unit:'',w:8}},
  // חפצים מסתובבים: בינתיים רק סוג וצורה. ההתנהגות שלהם תגיע במשימה "חפצים מסתובבים" (orbit.js)
  orbit:{attack:'🔥',defense:'🛡️',control:'❄️',support:'💚',luck:'🍀'},
  /* הפריטים. slot: weapon / acc / boots / orbit. נעליים נותנות מהירות (speed). tier: מספר ב-tiers. w: סוג הנשק ב-WEAPONS (weapons.js): איך הוא תוקף. איתו מתחילים את הריצה.
     look: איך הפריט נראה, כדי שכל שדרוג ייראה. tint צבע, glow זוהר, model המודל בתלת-ממד (w_<שם> מ-Fantasy Weapons, והחומר לפי tier) */
  items:{
    oakSword:   {slot:'weapon',tier:0,w:'sword',icon:'🗡️',stats:{sdmg:10},look:{model:'w_sword_A'}},
    ironSword:  {slot:'weapon',tier:1,w:'sword',icon:'🗡️',stats:{sdmg:25},look:{model:'w_sword_B'}},
    silverBlade:{slot:'weapon',tier:2,w:'sword',icon:'⚔️',stats:{sdmg:40,speed:5},look:{model:'w_sword_D',glow:'#DCE3EA'}},
    oakBow:     {slot:'weapon',tier:0,w:'bow',icon:'🏹',stats:{gdmg:10},look:{model:'w_bow_A_withString'}},
    ironBow:    {slot:'weapon',tier:1,w:'bow',icon:'🏹',stats:{gdmg:25},look:{model:'w_bow_A_withString'}},
    goldBow:    {slot:'weapon',tier:3,w:'bow',icon:'🏹',stats:{gdmg:60,magnet:20},look:{model:'w_bow_B_withString',glow:C.gold}},
    oakStaff:   {slot:'weapon',tier:0,w:'staff',icon:'🪄',stats:{gdmg:5,magnet:15},look:{model:'w_staff_B'}},   // הנשק של הקוסם: קסם שמתביית
    boneCharm:  {slot:'acc',tier:0,icon:'🦴',stats:{hp:15}},
    ironRing:   {slot:'acc',tier:1,icon:'💍',stats:{regen:0.5}},
    starterBoots:{slot:'boots',tier:0,type:'boots',icon:'👟',stats:{speed:10}},   // הפרס של הקווסט הראשון של ראש הכפר (quests.js)
    swiftBoots: {slot:'boots',tier:2,type:'boots',icon:'👢',stats:{speed:8}},
    goldAmulet: {slot:'acc',tier:3,icon:'📿',stats:{hp:30,magnet:30},look:{glow:C.gold}},
    crown:      {slot:'acc',tier:4,icon:'👑',stats:{hp:40,sdmg:15,gdmg:15},look:{glow:'#FF6FB5'}},
    emberOrb:   {slot:'orbit',tier:0,type:'attack'},
    stoneOrb:   {slot:'orbit',tier:0,type:'defense'},
    frostOrb:   {slot:'orbit',tier:0,type:'control'},
    leafOrb:    {slot:'orbit',tier:0,type:'support'},
    cloverOrb:  {slot:'orbit',tier:0,type:'luck'}
  },
  gift:['oakSword','oakBow','boneCharm'],   // פעם אחת, בביקור הראשון בכפר
  /* יצירה בנפחייה: מה עולה כל פריט. המתכת של השכבה, וחומרים מיצורים, מבוסים ואבנים, כדי שלכל משאב יהיה שימוש.
     חרבות צריכות עצמות, קשתות עור או ארס, תכשיטים תמצית. האבנים לפי סוג הנזק: אודם לחרב, ספיר למגפיים, ברקית לקשת */
  recipes:{
    oakSword:   {wood:12,bone:4,coins:15},
    oakBow:     {wood:12,cloth:4,resin:2,coins:15},
    boneCharm:  {wood:4,bone:10,dust:2,cloth:2,coins:10},
    ironSword:  {iron:10,copper:4,bone:8,plate:2,rubyC:1,coins:40},
    ironBow:    {iron:6,wood:10,hide:6,resin:4,boltC:1,coins:40},
    ironRing:   {iron:6,copper:6,essence:4,sapphireC:1,coins:40},
    silverBlade:{silver:8,iron:6,hide:6,ruby:1,coins:90},
    swiftBoots: {silver:4,hide:10,cloth:6,sapphire:1,coins:90},
    goldBow:    {gold:6,silver:4,venom:8,bolt:1,coins:160},
    goldAmulet: {gold:8,essence:10,shadow:2,venom:4,aqua:1,horn:1,coins:160},
    crown:      {mythril:6,gold:6,horn:3,star:1,shadow:4,amberF:1,coins:300},
    // חפצים מסתובבים: עשבים, אבק וקליפות, ואבן שבורה לפי הסוג
    emberOrb:   {wood:6,dust:4,rubyC:1,coins:20},
    stoneOrb:   {wood:6,stone:10,plate:3,amberC:1,coins:20},
    frostOrb:   {wood:6,mushroom:4,aquaC:1,coins:20},
    leafOrb:    {wood:6,herb:8,flower:2,coins:20},
    cloverOrb:  {wood:6,flower:4,mushroom:2,coins:20}
  },
  // שלל בסוף ריצה. run: סיכוי לפריט אחד בכל ריצה. boss: סיכוי לפריט על כל בוס שהובס.
  // slots: מה יכול ליפול. החפצים המסתובבים יצטרפו כשתהיה להם התנהגות
  loot:{run:0.35,boss:1,slots:['weapon','acc','boots']},
  /* מסך הציוד: הבובה באמצע, ומשבצות מסביב. start/end: הצדדים (מתהפכים לפי השפה), under: שורה מתחת לבובה.
     משבצת חדשה (למשל מגפיים) נכנסת לאחת הרשימות. drag: כמה פיקסלים זזים לפני שלחיצה הופכת לגרירה */
  doll:{start:['weapon'],end:['acc','boots'],under:['orbit']},
  drag:8
};

// פריט ששודרג בנפחייה נשמר עם הרמה שלו: 'oakBow+3' (aging.js). gBase: בלי הרמה, gPlus: הרמה
const gBase=id=>String(id).split('+')[0];
const gPlus=id=>id?+(String(id).split('+')[1]||0):0;
const gItem=id=>id&&GEAR.items[gBase(id)]||null;
// ה-+3 נכתב משמאל לימין גם בעברית (\u2066...\u2069), אחרת הסימן קופץ לצד השני
const gName=id=>T('it.'+gBase(id))+(gPlus(id)?' \u2066+'+gPlus(id)+'\u2069':'');
// הסטטים של הפריט, כולל השדרוג בנפחייה
function gStats(id){const s=(gItem(id)||{}).stats||{},k=ageMult(gPlus(id)),o={};for(const x in s)o[x]=Math.round(s[x]*k*10)/10;return o}
const gTint=id=>(gItem(id).look||{}).tint||GEAR.tiers[gItem(id).tier].col;
const gIcon=id=>{const it=gItem(id);return it.icon||GEAR.orbit[it.type]};
// כמה הפריט שווה, כדי לדעת אם החלפה היא שיפור. חומר טוב יותר שובר שוויון
function gScore(id){const it=gItem(id);if(!it)return 0;let n=it.tier*0.01;const s=gStats(id);for(const k in s)n+=s[k]*GEAR.stats[k].w;return n}
const heroLv=()=>SAVE.hero.level||1;
const gOrbOpen=()=>GEAR.slots.orbit.filter(l=>heroLv()>=l).length;
const gOpen=slot=>slot==='weapon'?1:slot==='orbit'?gOrbOpen():GEAR.slots[slot];
const gGet=(slot,i)=>slot==='weapon'?SAVE.gear.weapon:SAVE.gear[slot][i]||null;
function gSet(slot,i,id){if(slot==='weapon')SAVE.gear.weapon=id;else SAVE.gear[slot][i]=id}
// לאיזו משבצת ייכנס פריט: הראשונה הריקה, ואם הכל מלא, זו עם הפריט הכי חלש
function gTarget(it){
  const n=gOpen(it.slot);let best=0;
  for(let i=0;i<n;i++){if(!gGet(it.slot,i))return i;if(gScore(gGet(it.slot,i))<gScore(gGet(it.slot,best)))best=i}
  return best;
}
// כל מה שלבוש עכשיו, בלי משבצות נעולות
function gearWorn(){const out=[];for(const s of ['weapon','acc','boots','orbit'])for(let i=0;i<gOpen(s);i++){const id=gGet(s,i);if(gItem(id))out.push(id)}return out}
function gearStats(ids=gearWorn()){const t={};for(const id of ids){const s=gStats(id);for(const k in s)t[k]=(t[k]||0)+s[k]}return t}

/* ---- ללבוש ולהוריד: מהתרמיל למשבצת ובחזרה. מה שהיה במשבצת חוזר לתרמיל ---- */
// i: לאיזו משבצת (בגרירה). בלי i: המשבצת שמתאימה הכי (gTarget). משבצת מסוג אחר או נעולה: לא לובשים
function gearEquip(id,slot,i){
  const it=gItem(id);if(!it||slot&&slot!==it.slot)return null;
  if(i==null)i=gTarget(it);if(i>=gOpen(it.slot)||!bagTake(id))return null;
  const old=gGet(it.slot,i);
  gSet(it.slot,i,id);if(old)bagAdd(old);
  saveNow();
  return{slot:it.slot,i,old,better:gScore(id)>gScore(old)};
}
// מחליף בין שתי משבצות מאותו סוג (גרירה ממשבצת למשבצת)
function gearSwap(slot,a,b){if(a===b||b>=gOpen(slot))return false;const x=gGet(slot,a);gSet(slot,a,gGet(slot,b));gSet(slot,b,x);saveNow();return true}
function gearUnequip(slot,i){const id=gGet(slot,i);if(!id)return false;gSet(slot,i,null);bagAdd(id);saveNow();return true}

/* ---- בתחילת כל ריצה (ובכפר): מתנת פתיחה פעם אחת, והסטטים של הציוד חלים על השחקן ---- */
function gearReset(){
  if(!SAVE.gearGift){GEAR.gift.forEach(id=>bagAdd(id));SAVE.gearGift=true;saveNow()}
  gApply(gearStats(),1);P.hp=P.maxHp;
  wEquip(SAVE.gear.weapon);   // הנשק שלבוש ביד, ואיתו איך תוקפים (weapons.js)
}
// מלביש סטטים על השחקן (k=1) או מוריד אותם (k=-1). כך ציוד שמחליפים באמצע ריצה שומר על השדרוגים של הריצה
function gApply(s,k){
  const m=x=>Math.pow(1+(s[x]||0)/100,k);
  P.sw.dmg*=m('sdmg');P.gn.dmg*=m('gdmg');P.speed*=m('speed');P.magnet*=m('magnet');
  P.maxHp+=k*(s.hp||0);P.regen+=k*(s.regen||0);
}
// אחרי שינוי בציוד: מורידים את מה שהיה ומלבישים את החדש, מיד. חיים שנוספו מתמלאים, ונשק חדש נכנס ליד
function gearLive(before,id){
  const max0=P.maxHp;gApply(before,-1);gApply(gearStats(),1);
  P.hp=Math.max(1,Math.min(P.maxHp,P.hp+Math.max(0,P.maxHp-max0)));
  if(P.wid!==SAVE.gear.weapon)wEquip(SAVE.gear.weapon);
}

/* ---- יצירה בנפחייה: משלמים לפי GEAR.recipes, והפריט נכנס לתרמיל ---- */
const gCanCraft=id=>gItem(id)&&GEAR.recipes[id]&&gItem(id).tier<vLv('forge');
function gearCraft(id){
  const c=GEAR.recipes[id];if(!gCanCraft(id)||Object.keys(c).some(r=>!bagHas(r,c[r])))return false;
  for(const r in c)bagTake(r,c[r]);bagAdd(id);saveNow();
  const B=VILLAGE.b.forge;celebrate(B.x,B.y,'gear',gIcon(id));banner(T('forge.made',T('it.'+id)),gTint(id));
  return true;
}
// החלק של היצירה בפאנל הנפחייה (village.js): כל פריט שהרמה פותחת, עם המחיר שלו
function forgeHtml(){
  const ids=Object.keys(GEAR.recipes).filter(gCanCraft);
  return '<span class="sk">'+T('forge.craft')+'</span>'+ids.map(id=>{const c=GEAR.recipes[id],ok=Object.keys(c).every(r=>bagHas(r,c[r]));
    return '<div class="craft"><button class="res item" data-act="craft" data-r="'+id+'" style="--tint:'+gTint(id)+'"'+(ok?'':' disabled')+'>'+gIcon(id)+' '+T('it.'+id)+'</button><div class="cost">'+costLine(c)+'</div></div>'}).join('');
}

/* ---- שלל בסוף ריצה ---- */
function gRoll(){
  const pool=Object.keys(GEAR.items).filter(id=>GEAR.loot.slots.includes(GEAR.items[id].slot));
  let r=Math.random()*pool.reduce((n,id)=>n+GEAR.tiers[GEAR.items[id].tier].w,0);
  for(const id of pool){r-=GEAR.tiers[GEAR.items[id].tier].w;if(r<0)return id}
  return pool[0];
}
function gearLoot(){
  if(S.gearLoot)return S.gearLoot;
  const got=S.gearLoot=[],rolls=[GEAR.loot.run];for(let i=0;i<S.bossCount;i++)rolls.push(GEAR.loot.boss);
  for(const ch of rolls)if(Math.random()<ch){const id=gRoll();bagAdd(id);got.push(id)}
  if(got.length){saveNow();const el=$('sLoot');el.innerHTML=(el.textContent===T('vil.noLoot')?'':el.innerHTML)+got.map(gChip).join('')}
  return got;
}
const gChip=id=>'<span class="res item" style="--tint:'+gTint(id)+'">'+gIcon(id)+' '+gName(id)+'</span>';

/* ---- המסך: התרמיל בצד אחד, הבובה עם המשבצות באמצע, והפרטים בצד השני. נפתח מכפתור 🎒 בכפר ובזירה.
   גוררים פריט מהתרמיל למשבצת כדי ללבוש, ממשבצת לתרמיל כדי להוריד, ובין התרמיל למחסן כשעומדים ליד המחסן.
   לחיצה בוחרת ומראה פרטים והשוואה, עם כפתור: הדרך החלופית לגרירה ---- */
const GUI={sel:null,tab:'items'};   // sel: מה נבחר: {id} מהתרמיל, {slot,i} ממשבצת, או {sid} מהמחסן. tab: הלשונית בתרמיל
// נפתח מכל מקום: מהכפר ומהזירה. בזירה הריצה עוצרת, כמו במסך השדרוג
function gearOpen(){if(S.mode!=='play')return;S.mode='gear';joy=null;GUI.sel=null;$('ovGear').hidden=false;gearDraw()}
function gearClose(){gDragEnd();$('ovGear').hidden=true;if(S.mode==='gear')S.mode='play'}
// המחסן פתוח במסך רק כשעומדים לידו בכפר, והוא בנוי
const gStashOn=()=>!!(S.vil&&S.vil.near==='stash'&&vLv('stash')>0);
// הנדירות של פריט היא השכבה שלו (עץ = רגיל ... אגדי), ושל משאב היא rar שלו. כך הצבעים זהים לשלל שנופל
const gRar=k=>gItem(k)?gItem(k).tier:(resOf(k)||{}).rar||0;
const gRarCol=k=>RES.rarity[Math.min(gRar(k),RES.rarity.length-1)].col;

const gSign=(k,v)=>'<bdi>'+(v>0?'+':'')+Math.round(v*10)/10+GEAR.stats[k].unit+'</bdi> '+T('st.'+k);
function gStatsHtml(id){const it=gItem(id),s=gStats(id);
  if(it.slot==='orbit')return '<p>'+T('orb.'+it.type)+' · '+T('gear.soon')+'</p>';
  return '<ul class="gstats">'+Object.keys(s).map(k=>'<li>'+gSign(k,s[k])+'</li>').join('')+'</ul>'}
// מה ישתנה אם לובשים: לכל סטט, ההפרש מול מה שיוצא מהמשבצת, עם חץ למעלה או למטה
function gCompare(id,old){
  const a=gearStats([id]),b=gearStats(old?[old]:[]),ks=[...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>(a[k]||0)!==(b[k]||0));
  if(!ks.length)return '<p class="dim">'+T('gear.same')+'</p>';
  return '<p class="cmp">'+ks.map(k=>{const d=(a[k]||0)-(b[k]||0);return '<span class="'+(d>0?'up':'down')+'">'+(d>0?'▲':'▼')+' '+gSign(k,d)+'</span>'}).join('')+'</p>';
}
// משבצת או תא בתרמיל: מסגרת בצבע הנדירות, ופס בצבע סוג הנזק לנשק
function gTile(id,attrs,extra){
  const it=gItem(id),cls='gtile'+(it&&it.w?' '+WEAPONS[it.w].use:'');
  if(!it)return '<button class="'+cls+' empty" '+attrs+'>'+extra+'</button>';
  const glow=(it.look||{}).glow;
  return '<button class="'+cls+'" '+attrs+' style="--tint:'+gTint(id)+';--rar:'+gRarCol(id)+(glow?';--glow:'+glow:'')+'" aria-label="'+gName(id)+'">'+gIcon(id)+(gPlus(id)?'<b class="gplus">+'+gPlus(id)+'</b>':'')+extra+'</button>';
}
// תא של משאב: אייקון, כמה יש, ומסגרת בצבע הנדירות
const gResTile=(r,n,attrs)=>'<button class="gtile res" '+attrs+' style="--rar:'+gRarCol(r)+'" aria-label="'+resName(r)+'">'+resIcon(r)+'<small>'+n+'</small></button>';
const gCell=(k,n,attrs)=>gItem(k)?gTile(k,attrs,n>1?'<small>'+n+'</small>':''):gResTile(k,n,attrs);
// מה בתרמיל בלשונית הנוכחית: items לפריטים, או משפחת משאבים (RES.fams)
function gBagKeys(tab){
  if(tab==='items'){const order=['weapon','acc','boots','orbit'];return Object.keys(SAVE.bag).filter(gItem)
    .sort((a,b)=>order.indexOf(gItem(a).slot)-order.indexOf(gItem(b).slot)||gItem(b).tier-gItem(a).tier)}
  return resFam(tab).filter(r=>SAVE.bag[r]>0);
}
// הלשוניות: פריטים תמיד, וכל משפחת משאבים שיש בה משהו. המטבעות למעלה, ליד הכותרת
const gTabs=()=>['items',...Object.keys(RES.fams).filter(f=>f!=='coins'&&resFam(f).some(r=>SAVE.bag[r]>0))];

function gSlotHtml(s){
  const n=s==='weapon'?1:s==='orbit'?GEAR.slots.orbit.length:GEAR.slots[s],sel=GUI.sel;let h='';
  for(let i=0;i<n;i++){
    if(i>=gOpen(s)){h+='<button class="gtile locked" disabled aria-label="'+T('gear.locked',GEAR.slots.orbit[i])+'">🔒<small>'+GEAR.slots.orbit[i]+'</small></button>';continue}
    h+=gTile(gGet(s,i),'data-slot="'+s+'" data-i="'+i+'"'+(sel&&sel.slot===s&&sel.i===i?' aria-pressed="true"':''),'');
  }
  return '<div class="gslot '+s+'"><span class="k">'+T('gear.slot.'+s)+'</span><div class="grow">'+h+'</div></div>';
}
function gearDraw(){
  const D=GEAR.doll,hero=HEROES.list[heroId()]||{},sel=GUI.sel;
  $('gHero').textContent=T('gear.hero',heroLv());
  $('gCoins').innerHTML=resChip('coins',SAVE.bag.coins||0);
  // הבובה: הדמות באמצע, והמשבצות בשני הצדדים ומתחתיה
  const side=k=>'<div class="gd-'+k+'">'+D[k].map(gSlotHtml).join('')+'</div>';
  $('gSlots').innerHTML=side('start')+'<div class="gfig" style="--hero:'+(hero.col||'#ECE7DC')+'"><span>🧍</span>'+(hero.icon?'<b>'+hero.icon+'</b>':'')+'</div>'+side('end')+side('under');
  // התרמיל: לשוניות ורשת
  const tabs=gTabs();if(!tabs.includes(GUI.tab))GUI.tab='items';
  $('gTabs').innerHTML=tabs.map(f=>'<button data-tab="'+f+'"'+(GUI.tab===f?' aria-pressed="true"':'')+'>'+T(f==='items'?'gear.tab.items':'fam.'+f)+'</button>').join('');
  const ks=gBagKeys(GUI.tab);
  $('gItems').innerHTML=ks.length?ks.map(k=>gCell(k,SAVE.bag[k],'data-id="'+k+'"'+(sel&&sel.id===k?' aria-pressed="true"':''))).join('')
    :'<p class="dim">'+T(GUI.tab==='items'?'gear.noItems':'gear.noRes')+'</p>';
  // המחסן: רק כשעומדים לידו
  const st=gStashOn(),sk=Object.keys(SAVE.stash).filter(k=>SAVE.stash[k]>0&&stashIcon(k));
  $('gStash').hidden=!st;
  if(st)$('gStash').innerHTML='<span class="k">'+T('gear.stash',stashUsed(),stashCap())+'</span><div class="ggrid">'+
    (sk.length?sk.map(k=>gCell(k,SAVE.stash[k],'data-sid="'+k+'"'+(sel&&sel.sid===k?' aria-pressed="true"':''))).join(''):'<p class="dim">'+T('stash.empty')+'</p>')+'</div>';
  $('gDetail').innerHTML=gDetailHtml();
}
// הפרטים: שם בצבע הנדירות, נדירות וחומר, רמת Aging, סטטים, השוואה למה שלבוש, וכפתורים
function gDetailHtml(){
  const sel=GUI.sel,k=sel&&(sel.id||sel.sid||gGet(sel.slot,sel.i)),n=!sel?0:sel.id?SAVE.bag[k]:sel.sid?SAVE.stash[k]:1;
  if(!k||!n)return '<p class="dim">'+T('gear.hint')+'</p>';
  const it=gItem(k),col=gRarCol(k);
  let d='<div class="gdhead" style="--rar:'+col+'"><span class="gdicon">'+(it?gIcon(k):resIcon(k))+'</span><div><h3 style="color:'+col+'">'+(it?gName(k):resName(k))+'</h3>'+
    '<small>'+T('tier')[gRar(k)]+' · '+(it?(it.tier<4?T('vil.tiers')[it.tier]+' · ':'')+T('gear.slot.'+it.slot):T('fam.'+resOf(k).fam))+(n>1?' · <bdi>×'+n+'</bdi>':'')+'</small></div></div>';
  if(it&&gPlus(k))d+='<p class="gage">'+T('gear.aged',gPlus(k))+'</p>';
  if(it)d+=gStatsHtml(k);
  const btn=(act,txt,ghost)=>'<button class="vbtn'+(ghost?' ghost':'')+'" data-act="'+act+'">'+txt+'</button>';
  let b='';
  if(sel.id&&it){const old=gGet(it.slot,gTarget(it));
    d+=(old?'<p class="dim">'+T('gear.vs',gIcon(old)+' '+gName(old))+'</p>':'')+gCompare(k,old);b+=btn('equip',T('gear.equip'))}
  if(sel.slot)b+=btn('unequip',T('gear.unequip'),1);
  if(sel.id&&gStashOn())b+=btn('store',T('gear.store'),1);
  if(sel.sid)b+=btn('take',T('gear.take'));
  return d+(b?'<div class="gbtns">'+b+'</div>':'');
}

/* ---- פעולות: הגרירה והכפתורים עוברים שניהם דרך כאן ---- */
// לובשים, ואם זה שיפור: חגיגה על הדמות (עם הצליל שלה) והמשבצת קופצת
function gDoEquip(id,slot,i){
  const before=gearStats(),r=gearEquip(id,slot,i);if(!r)return null;
  gearLive(before,id);GUI.sel={slot:r.slot,i:r.i};
  if(r.better){celebrate(P.x,P.y-20,'gear',gIcon(gGet(r.slot,r.i)));GUI.pop=r}else sfx('tap');
  return r;
}
function gDoUnequip(slot,i){const before=gearStats();if(!gearUnequip(slot,i))return false;gearLive(before);GUI.sel=null;sfx('tap');return true}
function gDoSwap(slot,a,b){if(!gearSwap(slot,a,b))return false;GUI.sel={slot,i:b};sfx('tap');return true}
function gDoStash(dir,k){const n=stashMove(dir,k);if(!n)return 0;GUI.sel=dir==='in'?(SAVE.stash[k]?{sid:k}:null):(SAVE.bag[k]?{id:k}:null);sfx('tap');return n}
function gRedraw(){
  gearDraw();
  if(GUI.pop){const t=document.querySelector('#gSlots [data-slot="'+GUI.pop.slot+'"][data-i="'+GUI.pop.i+'"]');if(t)t.classList.add('pop');GUI.pop=null}
}

/* ---- גרירה, באצבע ובעכבר (pointer events): מה נגרר (gSrcOf), לאן נופלים ואם מותר (gDropAt), ומה קורה (gDrop) ---- */
const GDRAG={src:null};
function gSrcOf(el){
  const b=el&&el.closest&&el.closest('#ovGear .gtile');if(!b||b.disabled)return null;
  if(b.dataset.id)return{id:b.dataset.id,el:b};
  if(b.dataset.sid)return{sid:b.dataset.sid,el:b};
  if(b.dataset.slot&&gGet(b.dataset.slot,+b.dataset.i))return{slot:b.dataset.slot,i:+b.dataset.i,el:b};
  return null;
}
// משבצת: רק פריט מהסוג שלה. התרמיל: ממשבצת או מהמחסן. המחסן: מהתרמיל, כשיש מקום
function gDropAt(src,el){
  const c=s=>el&&el.closest&&el.closest(s),s=c('#gSlots [data-slot]');
  if(s){const slot=s.dataset.slot,i=+s.dataset.i,it=gItem(src.id||(src.slot&&gGet(src.slot,src.i)));
    return{kind:'slot',slot,i,el:s,ok:!!it&&it.slot===slot&&!src.sid&&!(src.slot&&src.i===i)}}
  const bag=c('#gBag');if(bag)return{kind:'bag',el:bag,ok:!src.id};
  const st=c('#gStash');if(st&&!st.hidden)return{kind:'stash',el:st,ok:!!src.id&&stashUsed()<stashCap()};
  return null;
}
function gDrop(src,t){
  if(t.kind==='slot')return src.id?gDoEquip(src.id,t.slot,t.i):gDoSwap(t.slot,src.i,t.i);
  if(t.kind==='bag')return src.slot?gDoUnequip(src.slot,src.i):gDoStash('out',src.sid);
  return gDoStash('in',src.id);
}
// לא מותר: המקום רועד קצת, ושום דבר לא זז
function gShake(el){el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake');setTimeout(()=>el.classList.remove('shake'),400)}
// בזמן גרירה: כל משבצת שמותר להניח בה מוארת, ואלה שלא מתעמעמות
function gMarkTargets(src){
  document.querySelectorAll('#gSlots [data-slot]').forEach(s=>s.classList.add(gDropAt(src,s).ok?'ok':'no'));
  for(const id of ['gBag','gStash']){const z=$(id);if(!z.hidden&&gDropAt(src,z).ok)z.classList.add('ok')}
}
function gDragEnd(){
  if(GDRAG.ghost)GDRAG.ghost.remove();
  document.querySelectorAll('#ovGear .ok,#ovGear .no,#ovGear .over,#ovGear .lift').forEach(e=>e.classList.remove('ok','no','over','lift'));
  GDRAG.src=GDRAG.ghost=null;GDRAG.on=false;
}
$('ovGear').addEventListener('pointerdown',e=>{
  if(e.button>0)return;const src=gSrcOf(e.target);if(!src)return;
  Object.assign(GDRAG,{src,pid:e.pointerId,x:e.clientX,y:e.clientY,on:false});
});
addEventListener('pointermove',e=>{
  const src=GDRAG.src;if(!src||e.pointerId!==GDRAG.pid)return;
  if(!GDRAG.on){
    if(Math.hypot(e.clientX-GDRAG.x,e.clientY-GDRAG.y)<GEAR.drag)return;
    GDRAG.on=true;const g=GDRAG.ghost=src.el.cloneNode(true);g.classList.add('gghost');g.removeAttribute('aria-pressed');
    $('ovGear').appendChild(g);src.el.classList.add('lift');gMarkTargets(src);
  }
  e.preventDefault();
  GDRAG.ghost.style.transform='translate('+e.clientX+'px,'+e.clientY+'px) translate(-50%,-50%)';
  const t=gDropAt(src,document.elementFromPoint(e.clientX,e.clientY));
  document.querySelectorAll('#ovGear .over').forEach(x=>x.classList.remove('over'));
  if(t&&t.ok)t.el.classList.add('over');
},{passive:false});
addEventListener('pointerup',e=>{
  const src=GDRAG.src;if(!src||e.pointerId!==GDRAG.pid)return;
  if(!GDRAG.on){GDRAG.src=null;return}   // לא זז: זו לחיצה, וה-click מטפל בה
  const t=gDropAt(src,document.elementFromPoint(e.clientX,e.clientY));
  gDragEnd();
  if(!t)return;   // שוחרר באמצע שום מקום: הפריט חוזר למקומו
  if(!t.ok||!gDrop(src,t)){gShake(t.el);return}
  gRedraw();
});
addEventListener('pointercancel',e=>{if(GDRAG.src&&e.pointerId===GDRAG.pid)gDragEnd()});

$('ovGear').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.id==='gearClose'){gearClose();return}
  const a=b.dataset.act,sel=GUI.sel;
  if(b.dataset.tab){GUI.tab=b.dataset.tab;GUI.sel=null}
  else if(b.dataset.id)GUI.sel={id:b.dataset.id};
  else if(b.dataset.sid)GUI.sel={sid:b.dataset.sid};
  else if(b.dataset.slot)GUI.sel=gGet(b.dataset.slot,+b.dataset.i)?{slot:b.dataset.slot,i:+b.dataset.i}:null;
  else if(a==='equip')gDoEquip(sel.id);
  else if(a==='unequip')gDoUnequip(sel.slot,sel.i);
  else if(a==='store'){if(!gDoStash('in',sel.id)){gShake($('gStash'));return}}
  else if(a==='take')gDoStash('out',sel.sid);
  gRedraw();
});
$('gearBtn').addEventListener('click',gearOpen);$('gearBtnRun').addEventListener('click',gearOpen);
addEventListener('keydown',e=>{if(e.code==='Escape'&&!$('ovGear').hidden)gearClose()});
