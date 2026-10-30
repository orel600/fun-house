/* Aging בנפחייה: משדרגים פריט מ-‎+0 עד ‎+10, עם סיכוי גלוי להצליח (החלטות של ניר ב-game-design.md).
   כישלון מוריד את הפריט רמה אחת, ולא מוחק אותו. אבן חן (💎, משאב בתרמיל) מגינה מהירידה.
   מזל רך (pity): כל כישלון ברצף מוסיף קצת סיכוי לניסיון הבא, ומתאפס בהצלחה. נשמר ב-SAVE.agePity.
   הרמה כתובה על הפריט עצמו: 'oakBow+3' בתרמיל או במשבצת (gPlus ב-gear.js), ולכן נשמרת יחד איתו.
   הנפחייה קובעת עד איזו רמה אפשר להגיע, ומוסיפה סיכוי בכל רמה שלה.
   הזוהר על הנשק לפי הרמה (look): ‎+3 זוהר עדין, ‎+7 שובל, ‎+10 חלקיקים, כמו ב-PristonTale.
   הוא מצויר בקנבס מעל הדמות, גם בתלת-ממד: עיגולים בחיבור אור ('lighter'), בלי bloom.
   השמות והטקסטים ב-lang.js: 'age.*' */

const AGING={
  max:10,
  // chance[L]: הסיכוי להצליח לעלות ל-‎+L. cost[L]: מה זה עולה, לפריט מעץ
  chance:[null,1,0.95,0.85,0.75,0.65,0.55,0.45,0.35,0.25,0.15],
  cost:[null,{coins:10,stone:5},{coins:20,stone:10},{coins:35,ore:3},{coins:55,ore:5},{coins:80,ore:8},
    {coins:120,ore:12},{coins:170,ore:18},{coins:240,ore:26},{coins:330,ore:36},{coins:450,ore:50}],
  tierCost:0.5,           // כל חומר מעל עץ מייקר ב-50%
  scale:0.1,              // כל ‎+1 מוסיף 10% לכל הסטטים של הפריט. ב-‎+10 הוא כפול
  // רמת הנפחייה: עד איזה ‎+ אפשר להגיע (byForge[רמת נפחייה]), וכמה סיכוי מוסיפה כל רמה מעל 1
  byForge:[0,4,6,8,9,10],forgeBonus:0.03,
  drop:1,                 // כמה רמות יורדים בכישלון
  gem:'gem',              // המשאב שמגן מירידה. נופל מהמבוקש ומבוסים (VILLAGE.drops)
  pity:{step:0.05,max:0.25},
  slots:['weapon','acc'], // מה אפשר לשדרג. החפצים המסתובבים יצטרפו כשיהיו להם סטטים
  /* המראה על הנשק. at: מאיזו רמה. glow: זוהר סביב הנשק (r רדיוס, a שקיפות). trail: שובל (n נקודות).
     parts: חלקיקים שעולים מהנשק (rate בשנייה, life שניות). grow: כמה הזוהר גדל בכל רמה בתוך רצועה */
  look:[
    {at:3,glow:{r:15,a:0.4}},
    {at:7,glow:{r:19,a:0.5},trail:{n:8}},
    {at:10,glow:{r:24,a:0.65},trail:{n:11},parts:{rate:22,life:0.7}}
  ],
  grow:0.08
};

const ageMult=n=>1+(n||0)*AGING.scale;
const ageCap=()=>AGING.byForge[vLv('forge')]||0;
// הסיכוי לעלות מ-‎+n, כולל הנפחייה והמזל הרך. אף פעם לא מעל 100%
function ageOdds(n){
  const base=AGING.chance[n+1]||0,forge=AGING.forgeBonus*Math.max(0,vLv('forge')-1),luck=agePityBonus();
  return{base,forge,luck,total:Math.min(1,base+forge+luck)};
}
const agePityBonus=()=>Math.min(AGING.pity.max,(SAVE.agePity||0)*AGING.pity.step);
function ageCost(id){
  const c=AGING.cost[gPlus(id)+1];if(!c)return null;
  const k=1+gItem(id).tier*AGING.tierCost,o={};for(const r in c)o[r]=Math.round(c[r]*k);return o;
}
// למה אי אפשר לנסות עכשיו: 'max', 'forge' (צריך נפחייה גבוהה יותר), 'cost', או null אם אפשר
function ageBlock(id){
  const n=gPlus(id);if(n>=AGING.max)return 'max';
  if(n>=ageCap())return 'forge';
  const c=ageCost(id);for(const r in c)if(!bagHas(r,c[r]))return 'cost';
  return null;
}
const ageId=(id,n)=>gBase(id)+(n>0?'+'+n:'');

/* ניסיון אחד. ref: {id} פריט בתרמיל, או {slot,i} משבצת. gem: להשתמש באבן חן.
   roll: מספר בין 0 ל-1 (ברירת מחדל: אקראי). מחזיר {ok,from,to,id,saved} או null אם אי אפשר */
function ageTry(ref,gem,roll=Math.random()){
  const id=ref.id||gGet(ref.slot,ref.i);if(!gItem(id)||ageBlock(id))return null;
  if(ref.id&&!bagHas(id))return null;
  gem=gem&&bagHas(AGING.gem);
  const from=gPlus(id),c=ageCost(id),ok=roll<ageOdds(from).total;
  for(const r in c)bagTake(r,c[r]);
  if(gem)bagTake(AGING.gem);
  const to=ok?from+1:gem?from:Math.max(0,from-AGING.drop),nid=ageId(id,to);
  SAVE.agePity=ok?0:(SAVE.agePity||0)+1;
  if(ref.id){bagTake(id);bagAdd(nid)}else gSet(ref.slot,ref.i,nid);
  saveNow();
  return{ok,from,to,id:nid,saved:!ok&&gem};
}

/* ---- המראה על הנשק: זוהר, שובל וחלקיקים ---- */
function ageLook(n){
  let band=null;for(const b of AGING.look)if(n>=b.at)band=b;
  return band&&{...band,k:1+AGING.grow*(n-band.at)};
}
// איפה הנשק על המסך, בקואורדינטות המשחק. render.js (דו-ממד) ו-render3d.js (תלת-ממד) מעדכנים כל פריים
const AGE_FX={hand:null,trail:[],parts:[],t:0,spr:{}};
// עיגול זוהר מוכן מראש לכל צבע, כדי שכל פריים יהיה רק drawImage אחד
function ageSprite(col){
  if(AGE_FX.spr[col])return AGE_FX.spr[col];
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'#fff');gr.addColorStop(0.25,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);
  return AGE_FX.spr[col]=c;
}
// נקרא מ-render() בקואורדינטות העולם, אחרי הדמויות
function drawAgeFx(){
  const now=fxNow(),dt=Math.min(0.05,now-(AGE_FX.t||now));AGE_FX.t=now;
  const id=SAVE.gear.weapon,it=gItem(id),lk=it&&ageLook(gPlus(id)),h=AGE_FX.hand,F=AGE_FX;
  if(!lk||!h||!P||P.weapon!==wUse(id)){F.trail.length=0;F.parts.length=0;return}
  const col=(it.look||{}).glow||gTint(id),spr=ageSprite(col),pulse=1+0.08*Math.sin(now*5);
  ctx.save();ctx.globalCompositeOperation='lighter';
  if(lk.trail){F.trail.unshift({x:h.x,y:h.y});F.trail.length=Math.min(F.trail.length,lk.trail.n);
    F.trail.forEach((p,i)=>{if(!i)return;const k=1-i/lk.trail.n,r=lk.glow.r*lk.k*0.7*k;ctx.globalAlpha=lk.glow.a*k;ctx.drawImage(spr,p.x-r,p.y-r,r*2,r*2)})}
  if(lk.parts){
    if(Math.random()<lk.parts.rate*dt)F.parts.push({x:h.x+rand(-6,6),y:h.y+rand(-6,6),vx:rand(-12,12),vy:rand(-50,-25),life:lk.parts.life});
    for(const p of F.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;const k=p.life/lk.parts.life,r=4*k+2;ctx.globalAlpha=k;ctx.drawImage(spr,p.x-r,p.y-r,r*2,r*2)}
    F.parts=F.parts.filter(p=>p.life>0)}
  const r=lk.glow.r*lk.k*pulse;ctx.globalAlpha=lk.glow.a;ctx.drawImage(spr,h.x-r,h.y-r,r*2,r*2);
  ctx.restore();
}

/* ---- המסך: נפתח מהפאנל של הנפחייה. למעלה מה שלבוש ומה שבתרמיל, ולמטה הסיכוי, המחיר והכפתור.
   לרוחב הוא בצד ימין, כמו מסך הציוד, כדי שהחגיגה על הדמות תיראה ---- */
const AUI={sel:null,gem:false};   // sel: {id} מהתרמיל, או {slot,i} ממשבצת
function forgeOpen(){
  if(!S.vil||S.mode!=='play'||!vLv('forge'))return;
  wEquip(SAVE.gear.weapon);   // הדמות מחזיקה את הנשק שלבוש, כדי שהזוהר החדש ייראה עליו
  S.mode='forge';joy=null;AUI.sel=null;$('ovForge').hidden=false;forgeDraw();
}
function forgeClose(){$('ovForge').hidden=true;if(S.mode==='forge')S.mode='play'}
const aSelId=()=>AUI.sel&&(AUI.sel.id||gGet(AUI.sel.slot,AUI.sel.i));
const aPct=v=>'<bdi>'+Math.round(v*100)+'%</bdi>';

function forgeDraw(){
  const sel=AUI.sel;
  $('fLevel').textContent=T('age.cap',ageCap());
  $('fRes').innerHTML=bagLine(SAVE.bag,true);
  // מה לבוש קודם, ואז מה שבתרמיל
  let h='';
  for(const s of AGING.slots)for(let i=0;i<gOpen(s);i++){const id=gGet(s,i);if(gItem(id))h+=gTile(id,'data-slot="'+s+'" data-i="'+i+'"'+(sel&&sel.slot===s&&sel.i===i?' aria-pressed="true"':''),'<small>✓</small>')}
  const ids=Object.keys(SAVE.bag).filter(id=>gItem(id)&&AGING.slots.includes(gItem(id).slot)).sort((a,b)=>gPlus(b)-gPlus(a)||gItem(b).tier-gItem(a).tier);
  h+=ids.map(id=>gTile(id,'data-id="'+id+'"'+(sel&&sel.id===id?' aria-pressed="true"':''),SAVE.bag[id]>1?'<small>'+SAVE.bag[id]+'</small>':'')).join('');
  $('fItems').innerHTML=h||'<p class="dim">'+T('age.noItems')+'</p>';
  // הפרטים: מה ישתנה, הסיכוי, המחיר, ומה קורה בכישלון
  const id=aSelId();let d='<p class="dim">'+T('age.hint')+'</p>';
  if(gItem(id)){
    const n=gPlus(id),why=ageBlock(id),gems=SAVE.bag[AGING.gem]||0;
    d='<h3 style="color:'+gTint(id)+'">'+gIcon(id)+' '+gName(id)+'</h3>';
    if(why==='max')d+='<p>'+T('age.max')+'</p>';
    else{
      const o=ageOdds(n),nx=ageId(id,n+1);
      d+='<p class="dim">'+T('age.to',gName(nx))+'</p>'+gCompare(nx,id);
      d+='<p class="odds">'+T('age.odds',aPct(o.total))+'</p><p class="dim">'+T('age.oddsWhy',aPct(o.base),aPct(o.forge),aPct(o.luck))+'</p>';
      d+='<div class="cost">'+costLine(ageCost(id))+'</div>';
      d+='<p class="dim">'+(n===0?T('age.failZero'):AUI.gem&&gems?T('age.failSafe'):T('age.fail',gName(ageId(id,n-AGING.drop))))+'</p>';
      if(n>0)d+='<button class="vbtn ghost" data-act="gem" aria-pressed="'+(AUI.gem&&gems>0)+'"'+(gems?'':' disabled')+'>'+T('age.gem',gems)+'</button>';
      d+='<button class="vbtn" data-act="age"'+(why?' disabled':'')+'>'+(why==='forge'?T('age.needForge'):why==='cost'?T('age.needCost'):T('age.go',n+1))+'</button>';
    }
  }
  $('fDetail').innerHTML=d;
}
// הצלחה: חגיגה גדולה על הדמות. כישלון: אפקט עצוב משלו, רעידה קטנה, והפריט יורד (או נשמר באבן חן)
function forgeResult(r){
  if(r.ok){celebrate(P.x,P.y-20,'aging','+'+r.to);banner(gName(r.id),C.gold)}
  else{celebrate(P.x,P.y-20,'agingFail',r.saved?'💎':'-'+AGING.drop);S.shake=Math.max(S.shake,5);banner(r.saved?T('age.saved'):T('age.failed',gName(r.id)),C.dim)}
}
$('ovForge').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.id==='forgeClose'){forgeClose();return}
  if(b.dataset.id)AUI.sel={id:b.dataset.id};
  else if(b.dataset.slot)AUI.sel={slot:b.dataset.slot,i:+b.dataset.i};
  else if(b.dataset.act==='gem')AUI.gem=!AUI.gem;
  else if(b.dataset.act==='age'){
    const r=ageTry(AUI.sel,AUI.gem&&gPlus(aSelId())>0);
    if(r){if(AUI.sel.id)AUI.sel={id:r.id};forgeResult(r)}
  }
  forgeDraw();
});
addEventListener('keydown',e=>{if(e.code==='Escape'&&!$('ovForge').hidden)forgeClose()});
