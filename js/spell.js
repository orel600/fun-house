/* כישוף מיוחד (אוראל, 1.11.2026, בהשראת MLBB): כפתור קטן ליד הסקילים, עם כישוף אחד שבוחרים בתחילת ריצה.
   בתחילת כל ריצה בזירה, לכמה שניות, מעל הכפתור מופיעים שלושה סמלים. נגיעה בוחרת, והבחירה נזכרת לריצה הבאה (בטלפון, fh-spell).
   קפיצה: מזנקים לכיוון התנועה (או המבט) עם הגנה קצרה. ריפוי: מחזיר חלק מהחיים. מכה: נזק כבד לאויב-העל או לבוס הקרוב.
   רק בזירה. המצב ב-S.spl, חדש בכל ריצה. נקרא מ-render.js (spellHud). מקלדת: 5. הטקסטים ב-lang.js תחת 'sp.' */
const SPELL={
  list:{
    dash:{cd:10,dist:150,inv:0.45,icon:'M4 12h11M11 6l6 6-6 6M19 5v14'},             // קפיצה: כמה רחוק, וכמה שניות הגנה
    heal:{cd:40,k:0.35,icon:'M12 5v14M5 12h14'},                                       // ריפוי: חלק מהחיים המלאים
    smite:{cd:30,pct:0.12,dmg:4,range:420,icon:'M13 2 5 14h6l-1 8 8-12h-6z'}            // מכה: חלק מהחיים המלאים של המטרה, ועוד כפול הנזק של הנשק
  },
  pick:4,          // כמה שניות בתחילת ריצה אפשר לבחור
  col:'#E9D8A6',   // צבע הכפתור: קלף בהיר, כי כישוף הוא לא סוג נזק
  key:'fh-spell'
};
const spellArena=()=>!!S&&skArena()&&S.mode==='play';
const spellId=()=>{let v=null;try{v=localStorage.getItem(SPELL.key)}catch(e){}return SPELL.list[v]?v:'dash'};
function spellState(){return S.spl||(S.spl={id:spellId(),until:0,t0:S.t,used:0})}
const spellCd=()=>Math.max(0,spellState().until-S.t);   // כמה שניות עד שאפשר שוב (זמן המשחק, אז עוצר בהפסקה)
function spellPick(id){if(!SPELL.list[id])return;try{localStorage.setItem(SPELL.key,id)}catch(e){}const s=spellState();s.id=id;s.t0=-99;spellKey='';sfx('tap')}
function spellUse(){
  const s=spellState(),D=SPELL.list[s.id];if(!spellArena()||spellCd()>0)return false;
  if(s.id==='dash'){const m=Math.hypot(P.vx||0,P.vy||0),a=m>1?Math.atan2(P.vy,P.vx):P.aim||0;
    sparks(P.x,P.y-8,SPELL.col,8,160);P.x+=Math.cos(a)*D.dist;P.y+=Math.sin(a)*D.dist;P.inv=Math.max(P.inv,D.inv);sparks(P.x,P.y-8,SPELL.col,8,160)}
  else if(s.id==='heal'){if(P.hp>=P.maxHp)return false;const n=Math.round(P.maxHp*D.k);P.hp=Math.min(P.maxHp,P.hp+n);floatText(P.x,P.y-46,'+'+n,'#7BE38F',18,true)}
  else{let b=null,bd=D.range;for(const e of enemies){if(e.dead||e.node||!(e.isBoss||e.elite||e.champ||e.wanted))continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;b=e}}
    if(!b){b=nearest(D.range);if(!b)return false}
    const t=P.dt[P.weapon]||'physical';damage(b,b.max*D.pct+skBase()*D.dmg,'skill',Math.atan2(b.y-P.y,b.x-P.x),t);
    if(S.sk)S.sk.fx.push({line:1,ax:P.x,ay:P.y-6,bx:b.x,by:b.y-6,t:0,max:0.25*themeK(),col:dtCol(t)})}
  s.until=S.t+D.cd;s.used++;sfx('xp');return true;
}
// כל פריים בזירה: ההמתנה יורדת, הכפתור והבחירה מתעדכנים
let spellKey='';
function spellHud(){
  const b=$('spell'),on=spellArena();if(b.hidden===on)b.hidden=!on;$('spellPick').hidden=!on||S.t-spellState().t0>SPELL.pick;if(!on)return;
  const s=spellState(),cd=spellCd();
  if(spellKey!==s.id+LANG){spellKey=s.id+LANG;b.innerHTML=spellSvg(s.id)+'<i></i>';b.setAttribute('aria-label',T('sp.'+s.id));
    $('spellPick').innerHTML=Object.keys(SPELL.list).map(k=>'<button type="button" data-sp="'+k+'" aria-label="'+T('sp.'+k)+'" class="'+(k===s.id?'on':'')+'">'+spellSvg(k)+'</button>').join('')}
  const v=String(Math.round(20*cd/SPELL.list[s.id].cd)/20);if(b.dataset.cd!==v){b.dataset.cd=v;b.style.setProperty('--cd',v);b.classList.toggle('ready',v==='0')}
  const sec=cd>0?String(Math.ceil(cd)):'';if(b.dataset.sec!==sec)b.dataset.sec=sec;
}
const spellSvg=id=>'<svg class="dti" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="'+SPELL.list[id].icon+'"/></svg>';
$('spell').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();spellUse()});
$('spellPick').addEventListener('pointerdown',e=>{const b=e.target.closest('[data-sp]');if(!b)return;e.preventDefault();e.stopPropagation();spellPick(b.dataset.sp)});
addEventListener('keydown',e=>{if(e.code==='Digit5'&&S&&e.target===document.body)spellUse()});
