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
function statsReset(){gApply(statsGive(),1);gApply(treeGive(),1);P.tfx=treeFx()}   // וגם עץ הסקילים
// שמים נקודה: חל מיד, גם באמצע ריצה
function statAdd(k){
  if(!STATS.list[k]||stFree()<1)return false;
  const before=statsGive();stPts()[k]=(stPts()[k]||0)+1;
  gApply(before,-1);gApply(statsGive(),1);if(k==='vit')P.hp=Math.min(P.maxHp,P.hp+STATS.list.vit.give.hp);
  saveNow();sfx('tap');return true;
}
const statRespecCost=()=>SAVE.hero.respecs?STATS.respec.base+STATS.respec.per*heroLv():0;   // הפעם הראשונה חינם, כדי שינסו (המחקר: "בלי איפוס זול אף אחד לא ינסה")
function statRespec(){
  const c=statRespecCost();if(!stSpent()&&!trSpent()||c&&!bagHas('coins',c))return false;
  if(c)bagTake('coins',c);gApply(statsGive(),-1);gApply(treeGive(),-1);SAVE.hero.pts={};SAVE.hero.tree={};P.tfx={};SAVE.hero.respecs=(SAVE.hero.respecs||0)+1;P.hp=Math.min(P.hp,P.maxHp);
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
  const bn=buildName();
  let h='<div class="sthead"><b>'+T('gear.hero',heroLv())+(bn?' · '+T('st.build')+' <span class="bname">'+bn+'</span>':'')+'</b><span class="stxp"><i style="width:'+Math.round(x.have/x.need*100)+'%"></i><bdi>'+Math.floor(x.have)+' / '+x.need+' XP</bdi></span></div>';
  h+='<p class="stfree'+(free?' on':'')+'">'+(free?T('st.free',free):T('st.none'))+'</p>';
  h+='<div class="strows">'+Object.keys(STATS.list).map(k=>{const S_=STATS.list[k],[name,what]=T('st.'+k),n=p[k]||0;
    const val=[...new Set(Object.keys(S_.give).map(s=>'+'+(Math.round((g[s]||0)*10)/10)+(s==='hp'?'':'%')))].join(' / ');
    return '<div class="strow"><span class="sti">'+S_.icon+'</span><span class="stn"><b>'+name+' <bdi>'+n+'</bdi></b><small>'+what+(n?' · <bdi>'+val+'</bdi>':'')+'</small></span>'+
      '<button class="stplus" data-act="stat" data-k="'+k+'"'+(free?'':' disabled')+' aria-label="+ '+name+'">+</button></div>'}).join('')+'</div>';
  h+='<button class="vbtn" data-act="tree">🌳 '+T('tr.open')+(trFree()?' ('+trFree()+')':'')+'</button>';
  if(stSpent()||trSpent())h+='<p class="dim">'+T('st.respecWhere',T('npc.'+STATS.respec.npc)[0])+'</p>';
  return h;
}
// אצל הכוהנת: כפתור איפוס (npc.js)
function statRespecHtml(){
  if(!stSpent()&&!trSpent())return '';
  const c=statRespecCost();
  return '<button class="vbtn ghost" data-act="respec"'+(!c||bagHas('coins',c)?'':' disabled')+'>'+(c?T('st.respec',c)+' '+resPic('coins'):T('st.respecFree'))+'</button>';
}
// מספר על כפתור הציוד כשיש נקודות לשים
function statBadge(){const el=$('gBadge');if(!el)return;const n=stFree()+trFree(),t=n?String(n):'';if(el.textContent!==t){el.textContent=t;el.hidden=!n}}

/* ---- עץ סקילים (ניר, 31.10.2026), גרסה 2 לפי המחקר (docs/research-skills.md): שלושה ענפים לפי נשק, נקודת סקיל כל tree.every רמות.
   כל ענף הוא שלבים לפי הסדר. שלב הוא סקיל אחד, או צומת "אחד משניים" (pick): בוחרים אחד, והשני נסגר. key: סקיל מפתח, עם מחיר אמיתי, ורק אחד במשחק כולו.
   give: סטטים כמו ציוד (gApply ב-gear.js). fx: התנהגות שמופעלת לפי מצב (statTick וההוקים ב-combat.js), בלי כפתורים.
   מה שנלמד נשמר ב-SAVE.hero.tree ({war:['w1','wRoot']}). השמות ב-lang.js תחת 'tr.<id>' ---- */
const TREE={
  every:2,
  branches:{
    war: {icon:'⚔️',col:'#FF8A3D',steps:[   // "הסלע שלא זז": עומד, סופג ומחזיר
      {id:'w1',icon:'🪨',give:{hpPct:10}},
      {pick:[{id:'wRoot',icon:'🌳',fx:'rooted'},{id:'wCounter',icon:'🔁',fx:'counter'}]},
      {id:'w3',icon:'🗡️',give:{sdmg:15}},
      {pick:[{id:'wBlood',icon:'🩸',fx:'blood'},{id:'wQuake',icon:'💥',fx:'quake'}]},
      {id:'w5',icon:'🛡️',fx:'lockArmor'},
      {key:true,cost:2,pick:[{id:'wMountain',icon:'⛰️',give:{hpPct:50,sdmg:40,speed:-35}},{id:'wBerserk',icon:'😡',fx:'berserk'}]}]},
    hunt:{icon:'🏹',col:'#A8D08D',steps:[   // "תמיד בתנועה": זז, מסמן ופוגע ראשון
      {id:'h1',icon:'🎯',give:{gdmg:10}},
      {pick:[{id:'hMomentum',icon:'🏃',fx:'momentum'},{id:'hFirst',icon:'🥇',fx:'first'}]},
      {id:'h3',icon:'👟',give:{speed:8}},
      {pick:[{id:'hMark',icon:'🎯',fx:'mark'},{id:'hHop',icon:'🦘',fx:'hop'}]},
      {id:'h5',icon:'🏹',give:{multi:1}},
      {key:true,cost:2,pick:[{id:'hSniper',icon:'🔭',give:{gdmg:120,pierce:3,aspd:-45}},{id:'hWind',icon:'🌪️',fx:'wind',give:{hpPct:-40}}]}]},
    mage:{icon:'🪄',col:'#C7A6FF',steps:[   // "אדון היסודות": מערבב יסודות ומפיץ מצבים
      {id:'m1',icon:'✨',give:{gdmg:8,magnet:15}},
      {pick:[{id:'mRotate',icon:'🌈',fx:'rotate'},{id:'mFocus',icon:'🔍',fx:'focus'}]},
      {id:'m3',icon:'💚',give:{regen:0.6}},
      {pick:[{id:'mSpread',icon:'💫',fx:'spread'},{id:'mCircle',icon:'⭕',fx:'circle'}]},
      {id:'m5',icon:'🌟',give:{gdmg:15}},
      {key:true,cost:2,pick:[{id:'mStorm',icon:'⛈️',fx:'storm',give:{gdmg:-40}},{id:'mGlass',icon:'💎',give:{gdmg:60,crit:15,hpPct:-35}}]}]}
  },
  // המספרים של ההתנהגויות (fx)
  fx:{
    rooted:{after:1,def:30,dmg:20},          // עומדים שנייה: 30% פחות נזק, 20% יותר נזק מקרוב
    counter:{hits:3,mul:3},                  // 3 מכות שחטפת: המכה הבאה פי 3
    blood:{below:0.5,aspd:30,leech:0.05},    // מתחת לחצי חיים: מהיר יותר, ומחזיר 5% מהנזק כחיים
    quake:{every:4,dmg:1.2},                 // כל הנפה רביעית: אדמה מסביב (קפוא + אדמה = הלם, dmg.js)
    lockArmor:{range:110,per:3,max:12},      // כל אויב קרוב: עוד 3% הגנה
    momentum:{full:2,max:30},                // צייד: בתנועה הנזק מרחוק עולה, עד 30% אחרי 2 שניות. עוצרים: מתאפס
    first:{mul:2},                           // צייד: מכה ראשונה באויב שלם, פי 2
    mark:{every:0.5,range:420,dmg:25},       // צייד: האויב החזק בטווח מסומן, וכל נזק אליו +25% (גם של החפצים והכלבה)
    hop:{dist:70,inv:1.1,cd:4},              // צייד: כשחוטפים, קפיצה אחורה ורגע של חסינות. פעם ב-4 שניות
    wind:{dodge:25},                         // צייד: 25% להתחמק לגמרי ממכה. המחיר: 40% פחות חיים
    rotate:['fire','water','ice','lightning','earth'],   // קוסם: כל פגיעה בסוג הבא, אז הקומבו קורה לבד והבוס הלומד מתבלבל
    focus:{per:8,max:5},                     // קוסם: כל פגיעה באותו אויב +8%, עד 5 פעמים
    spread:{r:95,k:0.5},                     // קוסם: אויב שמת כשהוא רטוב, קפוא או בוער מתפוצץ ומעביר את זה לשכנים
    circle:{after:1,r:105,every:0.5,k:0.5},  // קוסם: עומדים שנייה, ומעגל קסם מסביב פוגע כל חצי שנייה
    storm:{dmg:60},                          // קוסם: +60% נזק לאויב עם מצב (רטוב, קפוא, בוער). המחיר: 40% פחות נזק בסיסי
    berserk:{per:6,max:10,decay:3,drain:0.02,calm:320}   // כל הריגה +6% נזק (עד 10), יורד אחד כל 3 שניות. אין ריפוי בעולם, ובלי אויב קרוב החיים יורדים 2% בשנייה
  }
};
const trHave=()=>{const t=SAVE.hero.tree||(SAVE.hero.tree={});for(const b in t)if(!Array.isArray(t[b]))t[b]=[];return t};   // שמירה מגרסה 1 (מספרים): מתחילים מחדש, והנקודות חוזרות
const trOpts=st=>st.pick||[st];
const trNode=id=>{for(const b in TREE.branches)for(const st of TREE.branches[b].steps)for(const n of trOpts(st))if(n.id===id)return{n,st,b};return null};
const trCost=st=>st.cost||1;
const trSpent=()=>{let s=0;const H=trHave();for(const b in H)for(const id of H[b]){const x=trNode(id);if(x)s+=trCost(x.st)}return s};
const trFree=()=>Math.max(0,Math.floor((heroLv()-1)/TREE.every)-trSpent());
const trKeyTaken=()=>{const H=trHave();for(const b in H)for(const id of H[b]){const x=trNode(id);if(x&&x.st.key)return id}return null};
const trLearned=()=>{const out=[],H=trHave();for(const b in H)for(const id of H[b]){const x=trNode(id);if(x)out.push(x.n)}return out};
function treeGive(){const t={};for(const n of trLearned())for(const s in n.give||{})t[s]=(t[s]||0)+n.give[s];return t}
const treeFx=()=>{const f={};for(const n of trLearned())if(n.fx)f[n.fx]=true;return f};
// אפשר ללמוד את id עכשיו? מחזיר סיבה, או null
function trWhy(b,id){
  const B=TREE.branches[b],i=(trHave()[b]||[]).length,st=B&&B.steps[i];
  if(!st||!trOpts(st).some(n=>n.id===id))return 'order';
  if(st.key&&trKeyTaken())return 'key';
  if(trFree()<trCost(st))return 'points';
  return null;
}
function treeLearn(b,id){
  if(!id){const st=TREE.branches[b].steps[(trHave()[b]||[]).length];id=st&&trOpts(st)[0].id}   // בלי בחירה: האפשרות הראשונה
  if(trWhy(b,id))return false;
  const before=treeGive();(trHave()[b]=trHave()[b]||[]).push(id);gApply(before,-1);gApply(treeGive(),1);P.tfx=treeFx();
  saveNow();celebrate(P.x,P.y-20,'gear',trNode(id).n.icon);return true;
}

/* ---- ההתנהגויות (fx): כל פריים, בכל מקום (main.js), וההוקים ב-combat.js ---- */
const TF=k=>!!(P&&P.tfx&&P.tfx[k]);
function statTick(dt){
  if(!P||!S||S.mode!=='play')return;
  const F=TREE.fx;
  P.stillT=P.moving?0:(P.stillT||0)+dt;
  P.rooted=TF('rooted')&&P.stillT>=F.rooted.after&&!S.vil;
  P.raging=TF('blood')&&P.hp<P.maxHp*F.blood.below;
  if(TF('lockArmor')&&!S.vil){let n=0;for(const e of enemies)if(!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<F.lockArmor.range)n++;P.lockDef=Math.min(F.lockArmor.max,n*F.lockArmor.per)}else P.lockDef=0;
  P.momT=TF('momentum')&&P.moving?Math.min(F.momentum.full,(P.momT||0)+dt):0;
  if(P.hopCd>0)P.hopCd-=dt;
  if(TF('mark')&&!S.vil){P.markT=(P.markT||0)-dt;if(P.markT<=0){P.markT=F.mark.every;let b=null;for(const e of enemies)if(!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<F.mark.range&&(!b||e.max>b.max))b=e;P.markE=b}}else P.markE=null;
  if(TF('circle')&&!S.vil&&P.stillT>=F.circle.after){P.circT=(P.circT||0)-dt;if(P.circT<=0){P.circT=F.circle.every;const C_=F.circle,t=P.dt.gun||'physical';
    for(const e of enemies.slice())if(!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)-e.r<C_.r)damage(e,P.gn.dmg*C_.k,'gun',Math.atan2(e.y-P.y,e.x-P.x),t)}}
  if(TF('berserk')){const B=F.berserk;
    if(P.fury>0){P.furyT=(P.furyT||0)+dt;if(P.furyT>=B.decay){P.furyT=0;P.fury--}}
    if(!S.vil&&!nearest(B.calm))P.hp=Math.max(1,P.hp-P.maxHp*B.drain*dt)}
}
// כמה פחות נזק נכנס מההתנהגויות (hurt ב-combat.js)
const statDefFx=()=>(P.rooted?TREE.fx.rooted.def:0)+(P.lockDef||0);
// מכפיל נזק מקרוב מההתנהגויות (damage ב-combat.js)
function statDmgFx(w,e){
  const F=TREE.fx;let k=(w==='sword'&&P.rooted?1+F.rooted.dmg/100:1)*(TF('berserk')?1+(P.fury||0)*F.berserk.per/100:1);
  if(!e||e.node)return k;
  if(w==='gun'&&P.momT)k*=1+F.momentum.max/100*P.momT/F.momentum.full;
  if(TF('first')&&e.hp>=e.max)k*=F.first.mul;
  if(e===P.markE)k*=1+F.mark.dmg/100;
  if(TF('focus')&&w==='gun'){if(P.focusE===e)P.focusN=Math.min(F.focus.max,(P.focusN||0)+1);else{P.focusE=e;P.focusN=0}k*=1+F.focus.per/100*P.focusN}
  if(TF('storm')&&(e.wet>0||e.frozen>0||e.burn))k*=1+F.storm.dmg/100;
  return k;
}
// סוג הנזק של פגיעה מרחוק, עם "גלגל היסודות" של הקוסם (damage ב-combat.js)
function statDmgType(w,t){if(w!=='gun'||!TF('rotate')||t!==P.dt.gun)return t;const R=TREE.fx.rotate;P.rot=((P.rot||0)+1)%R.length;return R[P.rot]}
// התחמקות של "רוח": לפני שהמכה נספרת (hurt ב-combat.js)
function statDodge(){if(TF('wind')&&Math.random()*100<TREE.fx.wind.dodge){floatText(P.x,P.y-36,T('st.dodge'),C.tide,15);P.inv=0.25;return true}return false}
function statOnHurt(){
  if(TF('counter'))P.cnt=Math.min(TREE.fx.counter.hits,(P.cnt||0)+1);
  if(TF('hop')&&!(P.hopCd>0)){const H=TREE.fx.hop,e=nearest(300);if(e){const a=Math.atan2(P.y-e.y,P.x-e.x);P.x+=Math.cos(a)*H.dist;P.y+=Math.sin(a)*H.dist}P.hopCd=H.cd;P.inv=Math.max(P.inv,H.inv);sparks(P.x,P.y,C.tide,8,160)}
}
function statOnKill(e){
  if(TF('berserk')){P.fury=Math.min(TREE.fx.berserk.max,(P.fury||0)+1);P.furyT=0}
  // התפשטות: אויב שמת עם מצב מעביר אותו לשכנים. בלי שרשרת אינסופית: פעם אחת בכל פעם
  if(TF('spread')&&e&&!P.spreading&&(e.wet>0||e.frozen>0||e.burn)){const F=TREE.fx.spread,t=e.frozen>0?'ice':e.wet>0?'water':'fire';P.spreading=true;
    sparks(e.x,e.y,dtCol(t),12,220);
    for(const o of enemies.slice())if(o!==e&&!o.dead&&Math.hypot(o.x-e.x,o.y-e.y)<F.r)damage(o,P.gn.dmg*F.k,'gun',Math.atan2(o.y-e.y,o.x-e.x),t);
    P.spreading=false}
}
function statOnDamage(d){if(P.raging&&d>0)P.hp=Math.min(P.maxHp,P.hp+d*TREE.fx.blood.leech)}
// סימן קטן מעל הדמות כשהתנהגות פעילה, כדי שהשחקן יבין מה קורה
function statDraw(ox,oy){
  if(!P||!P.tfx||S.vil)return;
  const ic=[];if(P.rooted)ic.push('🌳');if(P.cnt>=TREE.fx.counter.hits)ic.push('🔁');if(P.raging)ic.push('🩸');if(P.lockDef)ic.push('🛡️');if(P.fury)ic.push('😡'+P.fury);if(P.momT>=TREE.fx.momentum.full)ic.push('🏃');if(TF('focus')&&P.focusN)ic.push('🔍'+P.focusN);if(TF('circle')&&P.stillT>=TREE.fx.circle.after)ic.push('⭕');
  if(!ic.length)return;
  ctx.font='700 15px Heebo, system-ui, sans-serif';ctx.textAlign='center';ctx.direction='ltr';ctx.fillText(ic.join(' '),P.x+ox,P.y+oy-58);ctx.direction=DIR;
}

function treeHtml(){
  const free=trFree(),H=trHave(),key=trKeyTaken();
  let h='<div class="trtop"><button class="vbtn ghost" data-act="back">'+T('tr.back')+'</button><p class="stfree'+(free?' on':'')+'">'+(free?T('tr.free',free):T('tr.none',TREE.every))+'</p></div><div class="trcols">';
  for(const b in TREE.branches){const B=TREE.branches[b],have=H[b]||[];
    h+='<section class="trb" style="--br:'+B.col+'"><h4>'+B.icon+' '+T('tr.'+b)+' <bdi>'+have.length+'/'+B.steps.length+'</bdi></h4>';
    B.steps.forEach((st,i)=>{const os=trOpts(st);
      if(st.key)h+='<p class="trkey">'+T('tr.key')+'</p>';
      os.forEach((n,k)=>{const [name,what]=T('tr.'+n.id),got=have[i]===n.id,gone=i<have.length&&!got,next=i===have.length,why=next?trWhy(b,n.id):'order',c=trCost(st);
        if(k)h+='<p class="tror">'+T('tr.or')+'</p>';
        h+='<div class="trn '+(got?'got':next&&why!=='key'?'next':'lock')+(gone?' gone':'')+'"><span class="sti">'+n.icon+'</span><span class="stn"><b>'+name+'</b><small>'+what+'</small></span>'+
          (got?'<span class="trok">✓</span>':next&&why!=='key'?'<button class="stplus" data-act="learn" data-b="'+b+'" data-id="'+n.id+'"'+(why?' disabled':'')+'>'+(c>1?c:'+')+'</button>':'<span class="trok">'+(gone?'✗':'🔒')+'</span>')+'</div>'});
    });
    h+='</section>'}
  return h+'</div>';
}
// שם לבנייה (המחקר: "בילד עם שם מרגיש מכוון"): לפי סקיל המפתח, ואם אין, לפי הענף שהשקעת בו הכי הרבה
const BUILDS={key:{wMountain:'mountain',wBerserk:'berserk',hSniper:'sniper',hWind:'gale',mStorm:'tempest',mGlass:'glass'},branch:{war:'rock',hunt:'wind',mage:'elements'}};
function buildName(){
  const k=trKeyTaken();if(k&&BUILDS.key[k])return T('bn.'+BUILDS.key[k]);
  const H=trHave(),bs=Object.keys(H).filter(b=>(H[b]||[]).length).sort((a,b)=>H[b].length-H[a].length);
  if(!bs.length)return '';
  if(bs.length>1&&H[bs[0]].length===H[bs[1]].length)return T('bn.mixed');
  return T('bn.'+BUILDS.branch[bs[0]]);
}
