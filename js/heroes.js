/* דמויות התחלה: לוחם, צייד וקוסם. כל דמות היא רק נקודת פתיחה: נשק התחלתי ויכולת פסיבית אחת.
   היא לא נועלת כלום: כל דמות יכולה להחזיק כל נשק (ההחלטה ב-game-design.md, "החלטות של ניר").
   הבחירה פעם אחת, במשחק הראשון (אין עוד SAVE.hero.start), ואחריה נכנסים לכפר.
   הפסיבית חלה בתחילת כל ריצה: heroReset, נקרא מ-reset אחרי הציוד.
   כאן גם סגנון המשחק (SAVE.hero.style), שקווסטי הדרגה יקראו בהמשך.
   השמות והטקסטים ב-lang.js: 'hero.<id>', 'hero.<id>.line' ו-'hero.*'. המודל בתלת-ממד: LOOK3D['hero_<id>'] ב-render3d.js */

const HEROES={
  /* weapon: פריט מ-GEAR.items שנלבש בבחירה. passive: סטטים כמו של ציוד (GEAR.stats), שחלים בכל ריצה.
     icon: על הכרטיס במסך הבחירה. col: צבע הדמות בדו-ממד */
  list:{
    warrior:{weapon:'oakSword',passive:{hp:25},icon:'🛡️',col:'#D9DEE6'},
    hunter: {weapon:'oakBow',passive:{speed:10},icon:'🏹',col:'#A8D08D'},
    mage:   {weapon:'oakStaff',passive:{regen:1},icon:'🔮',col:'#C7A6FF'}
  },
  /* סגנון המשחק, לקווסטי הדרגה. כל מונה נשמר ב-SAVE.hero.style.
     sec: כמה שניות בזירה התנאי היה נכון (heroTick, כל פריים). המפתח נשמר עם t_ לפניו.
     on: אירועים שנקודת חיבור בקוד מדווחת עליהם עם heroCount: נזק לפי נשק (combat.js), הריגות ובוסים */
  style:{
    sec:{
      run:()=>true,
      sword:()=>P.weapon==='sword',
      gun:()=>P.weapon==='gun',
      moving:()=>P.moving,
      defense:()=>gearWorn().some(id=>gItem(id).type==='defense'||(gItem(id).stats||{}).hp>0)   // חפץ הגנה או אקססוריז שנותן חיים
    },
    on:['dmg_sword','dmg_gun','kills','bosses']
  }
};

const heroId=()=>HEROES.list[SAVE.hero.start]?SAVE.hero.start:null;

/* ---- בתחילת כל ריצה (ובכפר): הפסיבית של הדמות ---- */
function heroReset(){const h=HEROES.list[heroId()];if(h)gApply(h.passive,1);rankReset();P.hp=P.maxHp}   // אותם סטטים כמו ציוד (gApply ב-gear.js), ואחריהם הבונוס של הדרגה (ranks.js)

/* ---- סגנון המשחק ---- */
function heroCount(k,n=1){if(HEROES.style.on.includes(k))SAVE.hero.style[k]=(SAVE.hero.style[k]||0)+n}
function heroTick(dt){const st=SAVE.hero.style,sec=HEROES.style.sec;for(const k in sec)if(sec[k]())st['t_'+k]=(st['t_'+k]||0)+dt}

/* ---- מסך הבחירה: שלושה כרטיסים בשורה, לרוחב ---- */
function heroOpen(){
  $('ovStart').hidden=true;
  $('heroCards').innerHTML=Object.keys(HEROES.list).map(id=>{const h=HEROES.list[id],w=gItem(h.weapon);
    return '<button class="card hero '+w.w+'" data-hero="'+id+'" style="--hero:'+h.col+'"><span class="hicon">'+h.icon+'</span><b>'+T('hero.'+id)+'</b>'+
      '<span class="hline">'+T('hero.'+id+'.line')+'</span>'+
      '<span class="tag">'+gIcon(h.weapon)+' '+T('it.'+h.weapon)+'</span>'+
      '<span class="tag">'+Object.keys(h.passive).map(k=>gSign(k,h.passive[k])).join(' · ')+'</span></button>'}).join('');
  $('ovHero').hidden=false;
}
function heroPick(id){
  const h=HEROES.list[id];if(!h)return;
  SAVE.hero.start=id;
  if(SAVE.gear.weapon!==h.weapon){if(!bagHas(h.weapon))bagAdd(h.weapon);gearEquip(h.weapon)}
  saveNow();
  $('ovHero').hidden=true;
  enterVillage();
}
$('ovHero').addEventListener('click',e=>{const b=e.target.closest('[data-hero]');if(b)heroPick(b.dataset.hero)});
