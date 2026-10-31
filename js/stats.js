/* נקודות דמות (ניר, 31.10.2026: "מערכת של עליית רמות, xp, לשים נקודות לשיפור הדמות").
   רמת הדמות הקבועה באה מ-SAVE.hero.xp (ranks.js). בכל רמה מקבלים נקודות, ושמים אותן באחד משישה סטטים.
   מה שמו נשמר ב-SAVE.hero.pts ({str:2,vit:1}), וחל על השחקן בתחילת כל ריצה ובכפר ובעולם (statsReset, מ-heroReset), כמו ציוד.
   איפוס הנקודות עולה מטבעות, אצל הכוהנת בכפר (npc.js). XP לדמות: הריגות בעולם הפתוח (statKillXp, מ-kill ב-combat.js),
   ומה שכבר היה: חלק מה-XP של ריצה בזירה ופרסי קווסטים.
   המסך: בחלון הציוד, כשלא נבחר פריט (gear.js). השמות ב-lang.js תחת 'st.' */

const STATS={
  perLevel:1,                 // כמה נקודות בכל רמה
  /* לכל נקודה: מה היא נותנת, באותן יחידות של הציוד (gApply ב-gear.js). sdmg/gdmg/speed/aspd/def/crit/loot באחוזים, hp בחיים */
  list:{
    str:  {icon:'💪',give:{sdmg:3,gdmg:3}},     // כוח: נזק מקרוב ומרחוק
    vit:  {icon:'❤️',give:{hp:8}},              // חיוניות: חיים
    agi:  {icon:'👟',give:{speed:1.5}},          // זריזות: מהירות הליכה
    haste:{icon:'⚡',give:{aspd:2.5}},           // קצב: מהירות התקפה
    def:  {icon:'🛡️',give:{def:1.5}},            // הגנה: פחות נזק מכל מכה
    luck: {icon:'🍀',give:{crit:0.5,loot:2}}     // מזל: מכה קריטית ושלל
  },
  cap:{def:60,crit:30},       // תקרה באחוזים, כדי שאי אפשר יהיה להיות חסין
  respec:{npc:'priest',base:30,per:10},   // איפוס: מטבעות = base + per*רמה, אצל הכוהנת
  xp:{kill:2}                 // XP לדמות על כל אויב שנופל בעולם הפתוח, כפול ה-XP שלו
};

const stPts=()=>SAVE.hero.pts||(SAVE.hero.pts={});
const stSpent=()=>Object.values(stPts()).reduce((a,b)=>a+b,0);
const stFree=()=>Math.max(0,(heroLv()-1)*STATS.perLevel-stSpent());
// כל מה שהנקודות נותנות יחד, בפורמט של סטטי ציוד
function statsGive(){const t={},p=stPts();for(const k in STATS.list){const n=p[k]||0;if(!n)continue;const g=STATS.list[k].give;for(const s in g)t[s]=(t[s]||0)+g[s]*n}return t}
// בתחילת כל ריצה, בכפר ובעולם (heroReset ב-heroes.js)
function statsReset(){gApply(statsGive(),1)}
// שמים נקודה: חל מיד, גם באמצע ריצה
function statAdd(k){
  if(!STATS.list[k]||stFree()<1)return false;
  const before=statsGive();stPts()[k]=(stPts()[k]||0)+1;
  gApply(before,-1);gApply(statsGive(),1);if(k==='vit')P.hp=Math.min(P.maxHp,P.hp+STATS.list.vit.give.hp);
  saveNow();sfx('tap');return true;
}
const statRespecCost=()=>STATS.respec.base+STATS.respec.per*heroLv();
function statRespec(){
  const c=statRespecCost();if(!stSpent()||!bagHas('coins',c))return false;
  bagTake('coins',c);gApply(statsGive(),-1);SAVE.hero.pts={};P.hp=Math.min(P.hp,P.maxHp);
  saveNow();celebrate(P.x,P.y-20,'quest');return true;
}
// XP לדמות מאויב שנפל בעולם הפתוח
function statKillXp(e){if(!S.wd||e.node)return;SAVE.hero.xp=(SAVE.hero.xp||0)+(e.xp||1)*STATS.xp.kill;rankSync()}
// כמה XP יש בתוך הרמה הנוכחית, ממה שצריך לבאה (לפס)
function heroXpNow(){let xp=SAVE.hero.xp||0,lv=1;while(xp>=rankNeed(lv)){xp-=rankNeed(lv);lv++}return{have:xp,need:rankNeed(lv)}}
// כמה מזל הנקודות נותנות לשלל (loot.js)
const statLoot=()=>1+(P.loot||0)/100;

/* ---- המסך: בחלון הציוד, כשלא נבחר פריט ---- */
function statsHtml(){
  const x=heroXpNow(),free=stFree(),p=stPts(),g=statsGive();
  let h='<div class="sthead"><b>'+T('gear.hero',heroLv())+'</b><span class="stxp"><i style="width:'+Math.round(x.have/x.need*100)+'%"></i><bdi>'+Math.floor(x.have)+' / '+x.need+' XP</bdi></span></div>';
  h+='<p class="stfree'+(free?' on':'')+'">'+(free?T('st.free',free):T('st.none'))+'</p>';
  h+='<div class="strows">'+Object.keys(STATS.list).map(k=>{const S_=STATS.list[k],[name,what]=T('st.'+k),n=p[k]||0;
    const val=[...new Set(Object.keys(S_.give).map(s=>'+'+(Math.round((g[s]||0)*10)/10)+(s==='hp'?'':'%')))].join(' / ');
    return '<div class="strow"><span class="sti">'+S_.icon+'</span><span class="stn"><b>'+name+' <bdi>'+n+'</bdi></b><small>'+what+(n?' · <bdi>'+val+'</bdi>':'')+'</small></span>'+
      '<button class="stplus" data-act="stat" data-k="'+k+'"'+(free?'':' disabled')+' aria-label="+ '+name+'">+</button></div>'}).join('')+'</div>';
  if(stSpent())h+='<p class="dim">'+T('st.respecWhere',T('npc.'+STATS.respec.npc)[0])+'</p>';
  return h;
}
// אצל הכוהנת: כפתור איפוס (npc.js)
function statRespecHtml(){
  if(!stSpent())return '';
  const c=statRespecCost();
  return '<button class="vbtn ghost" data-act="respec"'+(bagHas('coins',c)?'':' disabled')+'>'+T('st.respec',c)+' '+resIcon('coins')+'</button>';
}
// מספר על כפתור הציוד כשיש נקודות לשים
function statBadge(){const el=$('gBadge');if(!el)return;const n=stFree(),t=n?String(n):'';if(el.textContent!==t){el.textContent=t;el.hidden=!n}}
