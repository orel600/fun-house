/* משחקי השאול: זהב וחנות חפצים, כמו ב-MLBB (אוראל, 3.11.2026: "אין חפצים"). התוכנית: docs/moba.md
   כולם מתחילים ב-0 זהב. זהב מחיילים (מי שקרוב), מהריגה ומעזרה, ממגדלים, וקצת עם הזמן. בסוף המשחק הכל מתאפס.
   כוח שוויוני: אותם 12 חפצים לכולם, והבוטים קונים לפי מסלול קבוע לכל ערכה (build). אותו מחיר כולל בערך לכל מסלול.
   החיבור ל-moba.js: mbIb(u) מחזיר את סכום החפצים (נזק, מהירות, הגנה...), mbItDie במוות, mbItTick בכל פריים, mbItHit אחרי פגיעה, mbItHud ב-HUD.
   החנות עוצרת את המשחק (S.mode='mbshop'), כמו כל חלון. קנייה מהירה: כפתור קטן ליד הזהב עם החפץ הבא שמומלץ לערכה, בלי לפתוח את החנות */
const MBITEM={
  gold:{tick:2,minion:16,ranged:24,kill:160,assist:60,tower:120,share:560},   // tick: זהב לשנייה לכל אחד. share: מאיזה מרחק מקבלים זהב מחייל שמת
  sell:0.6,slots:6,                  // מכירה מחזירה 60%. עד 6 חפצים, ורק זוג מגפיים אחד
  botEvery:6,                        // בוט בודק כל 6 שניות אם אפשר לקנות (ותמיד כשהוא בבסיס)
  cap:{def:0.5,cdr:0.35},            // הגנה עד 50%, טעינה מהירה עד 35%
  cats:['atk','def','mag','move'],
  // הסטטים: atk נזק בתקיפה, aspd מהירות תקיפה, leech חיים מהנזק, hp חיים, def פחות נזק, sk כוח סקילים (נזק, ריפוי ומגן), cdr טעינה, spd מהירות. התמונות: icons/ui/gear
  items:{
    sword:{cat:'atk',img:'ironSword',cost:450,atk:0.15},
    bow:{cat:'atk',img:'stormBow',cost:500,aspd:0.25},
    dragon:{cat:'atk',img:'dragonBlade',cost:900,atk:0.25,leech:0.1},
    armor:{cat:'def',img:'shield1',cost:450,hp:250},
    charm:{cat:'def',img:'wardenCharm',cost:550,def:0.12,thorns:0.15},   // thorns: מי שמכה בך מקרוב חוטף 15% מהנזק
    aegis:{cat:'def',img:'bastionOrb',cost:850,hp:200,guard:{at:0.3,k:0.25,t:3,cd:30}},   // guard: מתחת ל-30% חיים, מגן של 25% מהחיים ל-3 שניות, פעם ב-30 שניות
    staff:{cat:'mag',img:'ironStaff',cost:450,sk:0.15},
    moon:{cat:'mag',img:'moonOrb',cost:600,cdr:0.15},
    star:{cat:'mag',img:'starStaff',cost:900,sk:0.25,frost:{k:0.15,t:1}},   // frost: כל פגיעה שלך מאטה 15% לשנייה
    boots:{cat:'move',img:'starterBoots',cost:300,spd:0.1},
    swift:{cat:'move',img:'swiftBoots',cost:550,spd:0.12,aspd:0.12},
    warden:{cat:'move',img:'wardenBoots',cost:550,spd:0.1,def:0.08},
  },
  // המסלול לכל ערכה: הקנייה המהירה מציעה את הבא בתור, והבוטים קונים לפי הסדר
  build:{tank:['warden','armor','charm','moon','aegis','staff'],warrior:['swift','sword','armor','dragon','aegis','charm'],
    hunter:['swift','bow','sword','dragon','aegis','armor'],mage:['boots','staff','moon','star','aegis','armor']},
  stats:['atk','aspd','leech','hp','def','sk','cdr','spd'],
};
MBITEM.zero=Object.fromEntries(MBITEM.stats.map(k=>[k,0]));
const mbIb=u=>u&&u.ib||MBITEM.zero;
const mbMaxHp=u=>Math.round(MBKIT[u.kit].hp*mbK(u)+mbIb(u).hp);
function mbItCalc(u){
  const b=Object.assign({},MBITEM.zero);
  for(const id of u.it||[]){const I=MBITEM.items[id];for(const k of MBITEM.stats)if(I[k])b[k]+=I[k];for(const p of ['thorns','guard','frost'])if(I[p])b[p]=I[p]}
  b.def=Math.min(MBITEM.cap.def,b.def);b.cdr=Math.min(MBITEM.cap.cdr,b.cdr);u.ib=b;
  const old=u.max;u.max=mbMaxHp(u);if(!u.dead)u.hp=Math.max(1,Math.min(u.max,u.hp+u.max-old));
}
function mbGold(u,v){if(!u||u.k!=='hero')return;u.gold=(u.gold||0)+v;if(u.me&&v>=10)mbFloat(u.x+14,u.y-u.r-40,'+'+Math.round(v),C.gold)}
// למה אי אפשר לקנות: null = אפשר
function mbCant(u,id){
  const I=MBITEM.items[id],it=u.it||[];
  if(it.includes(id))return 'owned';
  if(it.length>=MBITEM.slots)return 'full';
  if(I.cat==='move'&&it.some(x=>MBITEM.items[x].cat==='move'))return 'boots';
  if((u.gold||0)<I.cost)return 'gold';
  return null;
}
function mbBuy(u,id){
  if(!u||mbCant(u,id))return false;
  u.gold-=MBITEM.items[id].cost;(u.it||(u.it=[])).push(id);mbItCalc(u);
  if(u.me){sfx('celebrate');celebrate(u.x,u.y,'gear')}
  return true;
}
function mbSell(u,id){
  const i=(u.it||[]).indexOf(id);if(i<0)return false;
  u.it.splice(i,1);u.gold=(u.gold||0)+Math.floor(MBITEM.items[id].cost*MBITEM.sell);mbItCalc(u);if(u.me)sfx('tap');return true;
}
// הבא בתור במסלול של הערכה: הראשון שעוד אין לו ושאפשר להחזיק (בלי להסתכל על הזהב)
function mbNext(u){for(const id of MBITEM.build[u.kit]){const c=mbCant(u,id);if(!c||c==='gold')return id}return null}

/* ---- זהב במוות, ובוטים שקונים ---- */
function mbItDie(t,src){
  const G=MBITEM.gold,foe=1-t.team;
  if(t.k==='minion'){for(const h of mbHeroes(foe))if(!h.dead&&mbDist(h,t)<G.share)mbGold(h,t.ranged?G.ranged:G.minion);return}
  if(t.k==='hero'){const killer=src&&src.k==='hero'?src:t.st.burnBy&&t.st.burnBy.k==='hero'?t.st.burnBy:null;
    if(killer)mbGold(killer,G.kill);
    for(const [h,at] of t.hitBy)if(h!==killer&&h.team!==t.team&&MB.t-at<8)mbGold(h,G.assist);return}
  for(const h of mbHeroes(foe))mbGold(h,G.tower);   // מגדל או בסיס: כל הקבוצה
}
function mbItTick(M,dt){
  for(const u of M.u){if(u.k!=='hero')continue;u.gold=(u.gold||0)+MBITEM.gold.tick*dt;
    if(u.bot){u.buyT=(u.buyT??MBITEM.botEvery*Math.random())-dt;
      if(u.buyT<=0||u.dead||mbDist(u,u.home)<300){if(u.buyT<=0)u.buyT=MBITEM.botEvery;const n=mbNext(u);if(n)mbBuy(u,n)}}}
}
// אחרי פגיעה: קוצים (מי שמכה בך מקרוב), מגן בחיים נמוכים, והאטה מהפגיעות שלך
function mbItHit(src,t,d){
  if(t.k==='hero'&&!t.dead){const b=mbIb(t);
    if(b.thorns&&src&&(src.k==='hero'||src.k==='minion')&&!src.dead&&mbDist(src,t)<140){src.hp-=d*b.thorns;if(src.hp<=0)mbDie(src,t)}
    if(b.guard&&t.hp<t.max*b.guard.at&&(t.guardT||0)<=MB.t){t.guardT=MB.t+b.guard.cd;mbShield(t,t.max*b.guard.k,b.guard.t);mbWord(t,'guard')}}
  if(src&&src.k==='hero'){const f=mbIb(src).frost;if(f&&!t.dead)mbSlow(t,f.k,f.t)}
}

/* ---- ממשק: זהב, קנייה מהירה, תרמיל קטן וחלון החנות ---- */
const mbImg=id=>'<img src="icons/ui/gear/'+MBITEM.items[id].img+'.png" alt="" draggable="false">';
let mbItKey='',mbShopSel=null;
function mbItHud(){
  const u=mbMe();if(!u)return;const g=Math.floor(u.gold||0),n=mbNext(u),inv=(u.it||[]).join();
  const key=g+'|'+n+'|'+inv+'|'+LANG;if(key===mbItKey)return;mbItKey=key;
  $('mbGold').textContent=g;
  const q=$('mbQuick');q.hidden=!n;
  if(n){const c=MBITEM.items[n].cost;q.classList.toggle('ok',g>=c);q.style.setProperty('--p',Math.min(1,g/c));
    if(q.dataset.id!==n){q.dataset.id=n;q.innerHTML=mbImg(n)+'<span></span>'}
    const sp=q.querySelector('span');sp.textContent=g>=c?c:'−'+(c-g);sp.classList.toggle('miss',g<c);   /* כמה זהב חסר (הבודק, 4.11) */q.setAttribute('aria-label',T('mb.quick',T('mb.i.'+n),c))}
  if($('mbInv').dataset.k!==inv){$('mbInv').dataset.k=inv;$('mbInv').innerHTML=(u.it||[]).map(mbImg).join('')}
  if(!$('ovMbShop').hidden)mbShopDraw();
}
function mbQuickBuy(){const u=mbMe();if(!u||MB.over)return;const n=mbNext(u);if(!n)return;
  if(!mbBuy(u,n)){const q=$('mbQuick');q.classList.remove('shake');void q.offsetWidth;q.classList.add('shake');sfx('tap')}mbItKey=''}
const mbStatLines=I=>MBITEM.stats.filter(k=>I[k]).map(k=>'<li>'+T('mb.st.'+k,k==='hp'?I[k]:Math.round(I[k]*100))+'</li>').join('')+
  ['thorns','guard','frost'].filter(k=>I[k]).map(k=>'<li class="mbpas">'+T('mb.p.'+k)+'</li>').join('');
function mbShopOpen(){
  if(!MB||MB.over)return;const u=mbMe();if(S.mode==='play')S.mode='mbshop';
  mbShopSel=mbShopSel&&MBITEM.items[mbShopSel]?mbShopSel:mbNext(u)||Object.keys(MBITEM.items)[0];
  $('ovMbShop').hidden=false;mbShopDraw();
}
function mbShopClose(){$('ovMbShop').hidden=true;if(S.mode==='mbshop')S.mode='play';mbItKey=''}
function mbShopDraw(){
  const u=mbMe();if(!u)return;const w=$('mbShop'),g=Math.floor(u.gold||0),id=mbShopSel,I=MBITEM.items[id],own=(u.it||[]).includes(id),why=own?null:mbCant(u,id),rec=mbNext(u);
  const card=k=>{const J=MBITEM.items[k],o=(u.it||[]).includes(k);return '<button class="mbic'+(k===id?' sel':'')+(o?' own':'')+(k===rec?' rec':'')+((u.gold||0)>=J.cost?' ok':'')+'" data-it="'+k+'">'+mbImg(k)+'<span>'+J.cost+'</span></button>'};
  w.innerHTML=winHead(T('mb.shop'),'<b class="mbgold">'+g+'</b>')+'<div class="mbshopin"><div class="mbcats">'+
    MBITEM.cats.map(c=>'<div class="mbcat"><h5>'+T('mb.cat.'+c)+'</h5><div>'+Object.keys(MBITEM.items).filter(k=>MBITEM.items[k].cat===c).map(card).join('')+'</div></div>').join('')+
    '</div><div class="mbdet"><div class="mbdh">'+mbImg(id)+'<div><b>'+T('mb.i.'+id)+'</b><small>'+T('mb.cat.'+I.cat)+(id===rec?' · '+T('mb.rec'):'')+'</small></div></div><ul>'+mbStatLines(I)+'</ul>'+
    (own?'<button class="lang mbsell" data-act="sell">'+T('mb.sell',Math.floor(I.cost*MBITEM.sell))+'</button>'
      :'<button class="go mbbuy" data-act="buy"'+(why?' disabled':'')+'>'+(why==='gold'?T('mb.need',I.cost-g):why?T('mb.why.'+why):T('mb.buy',I.cost))+'</button>')+
    '<div class="mbslots">'+Array.from({length:MBITEM.slots},(_,i)=>{const k=(u.it||[])[i];return k?'<button class="mbslot" data-it="'+k+'">'+mbImg(k)+'</button>':'<span class="mbslot"></span>'}).join('')+'</div></div></div>';
}
$('mbShop').addEventListener('click',e=>{
  const it=e.target.closest('[data-it]'),a=e.target.closest('[data-act]'),u=mbMe();
  if(it){mbShopSel=it.dataset.it;sfx('tap');mbShopDraw();return}
  if(!a)return;
  if(a.dataset.act==='close'){sfx('ui');mbShopClose()}
  else if(a.dataset.act==='buy'){if(mbBuy(u,mbShopSel)){const n=mbNext(u);if(n)mbShopSel=n}mbShopDraw()}
  else if(a.dataset.act==='sell'){mbSell(u,mbShopSel);mbShopDraw()}
});
$('mbQuick').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();mbQuickBuy()});
$('mbShopB').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();sfx('ui');mbShopOpen()});
