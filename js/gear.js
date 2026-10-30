/* ציוד ותרמיל: משבצת לנשק, משבצות לאקססוריז, ו-5 משבצות לחפצים המסתובבים (נפתחות עם רמת הדמות).
   כל פריט הוא שורה ב-GEAR.items. בתרמיל פריט נשמר לפי ה-id שלו, כמו משאב (SAVE.bag.oakSword=1), ומה שלבוש נשמר ב-SAVE.gear.
   הסטטים של מה שלבוש חלים על השחקן בתחילת כל ריצה: gearReset, נקרא מ-reset.
   שלל: בסוף ריצה נופלים לפעמים פריטים לתרמיל (gearLoot, נקרא מ-gameOver), ליד המשאבים שהכפר מטפל בהם.
   המסך נפתח מכל מקום (כפתור בכפר ובזירה), ובזירה הריצה עוצרת. השמות והטקסטים ב-lang.js: 'it.<id>' לפריטים, 'st.<סטט>', 'orb.<סוג>' ו-'gear.*' */

const GEAR={
  slots:{acc:2,orbit:[1,1,5,10,15]},   // orbit: מאיזו רמת דמות נפתחת כל משבצת. 2 פתוחות בהתחלה
  // החומרים, מהחלש לחזק. col: הצבע של הפריט (tint), אלא אם ב-look כתוב אחרת. w: כמה נפוץ בשלל
  tiers:[{id:'wood',col:'#B07A45',w:50},{id:'iron',col:'#9AA3AD',w:30},{id:'silver',col:'#DCE3EA',w:14},{id:'gold',col:C.gold,w:5},{id:'legend',col:'#FF6FB5',w:1}],
  // הסטטים. איך כל אחד חל על השחקן: gearReset. unit: מה מוצג אחרי המספר. w: משקל בהשוואה "מה יותר טוב"
  stats:{sdmg:{unit:'%',w:1},gdmg:{unit:'%',w:1},hp:{unit:'',w:0.4},speed:{unit:'%',w:1.5},magnet:{unit:'%',w:0.3},regen:{unit:'',w:8}},
  // חפצים מסתובבים: בינתיים רק סוג וצורה. ההתנהגות שלהם תגיע במשימה "חפצים מסתובבים" (orbit.js)
  orbit:{attack:'🔥',defense:'🛡️',control:'❄️',support:'💚',luck:'🍀'},
  /* הפריטים. slot: weapon / acc / orbit. נעליים (type:'boots') הן אקססורי שנותן מהירות (speed). tier: מספר ב-tiers. w: סוג הנשק ב-WEAPONS (weapons.js): איך הוא תוקף. איתו מתחילים את הריצה.
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
    starterBoots:{slot:'acc',tier:0,type:'boots',icon:'👟',stats:{speed:10}},   // הפרס של הקווסט הראשון של ראש הכפר (quests.js)
    swiftBoots: {slot:'acc',tier:2,type:'boots',icon:'👢',stats:{speed:8}},
    goldAmulet: {slot:'acc',tier:3,icon:'📿',stats:{hp:30,magnet:30},look:{glow:C.gold}},
    crown:      {slot:'acc',tier:4,icon:'👑',stats:{hp:40,sdmg:15,gdmg:15},look:{glow:'#FF6FB5'}},
    emberOrb:   {slot:'orbit',tier:0,type:'attack'},
    stoneOrb:   {slot:'orbit',tier:0,type:'defense'},
    frostOrb:   {slot:'orbit',tier:0,type:'control'},
    leafOrb:    {slot:'orbit',tier:0,type:'support'},
    cloverOrb:  {slot:'orbit',tier:0,type:'luck'}
  },
  gift:['oakSword','oakBow','boneCharm'],   // פעם אחת, בביקור הראשון בכפר
  // שלל בסוף ריצה. run: סיכוי לפריט אחד בכל ריצה. boss: סיכוי לפריט על כל בוס שהובס.
  // slots: מה יכול ליפול. החפצים המסתובבים יצטרפו כשתהיה להם התנהגות
  loot:{run:0.35,boss:1,slots:['weapon','acc']}
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
const gOpen=slot=>slot==='weapon'?1:slot==='acc'?GEAR.slots.acc:gOrbOpen();
const gGet=(slot,i)=>slot==='weapon'?SAVE.gear.weapon:SAVE.gear[slot][i]||null;
function gSet(slot,i,id){if(slot==='weapon')SAVE.gear.weapon=id;else SAVE.gear[slot][i]=id}
// לאיזו משבצת ייכנס פריט: הראשונה הריקה, ואם הכל מלא, זו עם הפריט הכי חלש
function gTarget(it){
  const n=gOpen(it.slot);let best=0;
  for(let i=0;i<n;i++){if(!gGet(it.slot,i))return i;if(gScore(gGet(it.slot,i))<gScore(gGet(it.slot,best)))best=i}
  return best;
}
// כל מה שלבוש עכשיו, בלי משבצות נעולות
function gearWorn(){const out=[];for(const s of ['weapon','acc','orbit'])for(let i=0;i<gOpen(s);i++){const id=gGet(s,i);if(gItem(id))out.push(id)}return out}
function gearStats(ids=gearWorn()){const t={};for(const id of ids){const s=gStats(id);for(const k in s)t[k]=(t[k]||0)+s[k]}return t}

/* ---- ללבוש ולהוריד: מהתרמיל למשבצת ובחזרה. מה שהיה במשבצת חוזר לתרמיל ---- */
function gearEquip(id){
  const it=gItem(id);if(!it||!bagTake(id))return null;
  const i=gTarget(it),old=gGet(it.slot,i);
  gSet(it.slot,i,id);if(old)bagAdd(old);
  saveNow();
  return{slot:it.slot,i,old,better:gScore(id)>gScore(old)};
}
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

/* ---- המסך: המשבצות למעלה, התרמיל באמצע, וההשוואה למטה. נפתח מכפתור 🎒 בכפר ובזירה.
   לרוחב הוא בצד ימין של המסך, כדי שהדמות במרכז והחגיגה שלה ייראו ---- */
const GUI={sel:null};   // מה נבחר: {id} מהתרמיל, או {slot,i} ממשבצת
// נפתח מכל מקום: מהכפר ומהזירה. בזירה הריצה עוצרת, כמו במסך השדרוג
function gearOpen(){if(S.mode!=='play')return;S.mode='gear';joy=null;GUI.sel=null;$('ovGear').hidden=false;gearDraw()}
function gearClose(){$('ovGear').hidden=true;if(S.mode==='gear')S.mode='play'}

const gSign=(k,v)=>'<bdi>'+(v>0?'+':'')+Math.round(v*10)/10+GEAR.stats[k].unit+'</bdi> '+T('st.'+k);
function gStatsHtml(id){const it=gItem(id),s=gStats(id);
  if(it.slot==='orbit')return '<p>'+T('orb.'+it.type)+' · '+T('gear.soon')+'</p>';
  return '<p>'+Object.keys(s).map(k=>gSign(k,s[k])).join(' · ')+'</p>'}
// מה ישתנה אם לובשים: לכל סטט, ההפרש מול מה שיוצא מהמשבצת
function gCompare(id,old){
  const a=gearStats([id]),b=gearStats(old?[old]:[]),ks=[...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>(a[k]||0)!==(b[k]||0));
  if(!ks.length)return '<p class="dim">'+T('gear.same')+'</p>';
  return '<p class="cmp">'+ks.map(k=>{const d=(a[k]||0)-(b[k]||0);return '<span class="'+(d>0?'up':'down')+'">'+gSign(k,d)+'</span>'}).join('')+'</p>';
}
function gTile(id,attrs,extra){
  const it=gItem(id),cls='gtile'+(it&&it.w?' '+WEAPONS[it.w].use:'');
  if(!it)return '<button class="'+cls+' empty" '+attrs+'>'+extra+'</button>';
  const glow=(it.look||{}).glow;
  return '<button class="'+cls+'" '+attrs+' style="--tint:'+gTint(id)+(glow?';--glow:'+glow:'')+'" aria-label="'+gName(id)+'">'+gIcon(id)+(gPlus(id)?'<b class="gplus">+'+gPlus(id)+'</b>':'')+extra+'</button>';
}
function gearDraw(){
  const sel=GUI.sel,isSel=(s,i)=>sel&&sel.slot===s&&sel.i===i;
  $('gHero').textContent=T('gear.hero',heroLv());
  let h='';
  for(const s of ['weapon','acc','orbit']){
    const n=s==='weapon'?1:s==='acc'?GEAR.slots.acc:GEAR.slots.orbit.length;
    h+='<div class="gslot"><span class="k">'+T('gear.slot.'+s)+'</span><div class="grow">';
    for(let i=0;i<n;i++){
      if(i>=gOpen(s)){h+='<button class="gtile locked" disabled aria-label="'+T('gear.locked',GEAR.slots.orbit[i])+'">🔒<small>'+GEAR.slots.orbit[i]+'</small></button>';continue}
      h+=gTile(gGet(s,i),'data-slot="'+s+'" data-i="'+i+'"'+(isSel(s,i)?' aria-pressed="true"':''),'');
    }
    h+='</div></div>';
  }
  $('gSlots').innerHTML=h;
  $('gRes').innerHTML=bagLine(SAVE.bag,true);
  const order=['weapon','acc','orbit'],ids=Object.keys(SAVE.bag).filter(gItem)
    .sort((a,b)=>order.indexOf(gItem(a).slot)-order.indexOf(gItem(b).slot)||gItem(b).tier-gItem(a).tier);
  $('gItems').innerHTML=ids.length?ids.map(id=>gTile(id,'data-id="'+id+'"'+(sel&&sel.id===id?' aria-pressed="true"':''),SAVE.bag[id]>1?'<small>'+SAVE.bag[id]+'</small>':'')).join(''):'<p class="dim">'+T('gear.noItems')+'</p>';
  // ההשוואה: מה נבחר, מה הוא נותן, ומה ישתנה
  let d='<p class="dim">'+T('gear.hint')+'</p>';
  const id=sel&&(sel.id||gGet(sel.slot,sel.i));
  if(gItem(id)){
    const it=gItem(id);
    d='<h3 style="color:'+gTint(id)+'">'+gIcon(id)+' '+gName(id)+' <small>'+T('vil.tiers')[it.tier]+' · '+T('gear.slot.'+it.slot)+'</small></h3>'+gStatsHtml(id);
    if(sel.id){const old=gGet(it.slot,gTarget(it));
      d+=(old?'<p class="dim">'+T('gear.vs',gIcon(old)+' '+gName(old))+'</p>':'')+gCompare(id,old)+'<button class="vbtn" data-act="equip">'+T('gear.equip')+'</button>'}
    else d+='<button class="vbtn ghost" data-act="unequip">'+T('gear.unequip')+'</button>';
  }
  $('gDetail').innerHTML=d;
}
$('ovGear').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.id==='gearClose'){gearClose();return}
  if(b.dataset.id)GUI.sel={id:b.dataset.id};
  else if(b.dataset.slot)GUI.sel=gGet(b.dataset.slot,+b.dataset.i)?{slot:b.dataset.slot,i:+b.dataset.i}:null;
  else if(b.dataset.act==='equip'){
    const before=gearStats(),r=gearEquip(GUI.sel.id);
    if(r)gearLive(before,GUI.sel.id);
    if(r){GUI.sel={slot:r.slot,i:r.i};
      // שיפור נראה: חגיגה על הדמות, והמשבצת קופצת
      if(r.better){celebrate(P.x,P.y-20,'gear',gIcon(gGet(r.slot,r.i)));GUI.pop=r}}
  }
  else if(b.dataset.act==='unequip'){const before=gearStats();gearUnequip(GUI.sel.slot,GUI.sel.i);gearLive(before);GUI.sel=null}
  gearDraw();
  if(GUI.pop){const t=document.querySelector('#gSlots [data-slot="'+GUI.pop.slot+'"][data-i="'+GUI.pop.i+'"]');if(t)t.classList.add('pop');GUI.pop=null}
});
$('gearBtn').addEventListener('click',gearOpen);$('gearBtnRun').addEventListener('click',gearOpen);
addEventListener('keydown',e=>{if(e.code==='Escape'&&!$('ovGear').hidden)gearClose()});
