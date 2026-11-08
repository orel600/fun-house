/* מומחיות איסוף (GMASTERY, ניר 8.11.2026, docs/concept-gathering.md פרק 4): "כשאתה רק מתחיל, האיסוף איטי... אתה רוצה להרגיש שאתה מתפתח עם הדמות".
   מומחיות לכל משפחה: עצים, אבנים ומתכות, צמחים. כל מקור שנשבר בעולם מוסיף נקודה למשפחה שלו, וכמה נקודות פותחות דרגה.
   דרגה 1 = הקצב של היום. מה שמשתנה הוא רק הקצב: כמה שלל יוצא מכל מקור לא משתנה (drop ב-NODES).
   2: שלל של המשפחה (העץ, האבן או המתכת, העשב) נמשך אליך ממרחק גדול יותר, גם מאויבים. 3: מכה פוגעת גם במקור צמוד מאותה משפחה. 4: מכה חזקה יותר במקורות. 5: שלושה בבת אחת, ונצנוץ זהב בחתיכות.
   כל דרגה חדשה: celebrate ושורה מה נפתח. נראה בחלון הדמות (gmHtml מ-gStatPanel). נשמר ב-SAVE.gm.
   רק בעולם הפתוח (S.wd): הזירה של אוראל לא משתנה.
   חיבורים: gmGain מ-gDown, gmHit מ-gHit (gather.js), gmMagnet מ-dropsUpdate (drops.js), gmHtml מ-gStatPanel (gearui.js) */
const GMASTERY={
  // המשפחות: אילו צורות (shape ב-NODES.kinds) שייכות לכל אחת, ואייקון
  fams:{wood:{shapes:['tree'],icon:'🪓'},stone:{shapes:['rock','vein','crystal'],icon:'⛏️'},plant:{shapes:['bush','reed'],icon:'🌿'}},
  at:[0,12,40,100,200],   // כמה מקורות שבורים צריך לכל דרגה: 1 מההתחלה, 5 אחרי 200
  magnet:{from:2,k:1.8},  // מדרגה 2: השלל העיקרי של המשפחה נמשך אליך מפי k מרחק (DROPS.magnet)
  near:{from:3,r:70,n:{3:1,5:2}},   // מדרגה 3: עוד מקור צמוד (עד r מהקצה) נפגע מאותה מכה. n: כמה, לפי הדרגה
  power:{from:4,k:1.5},   // מדרגה 4: המכה במקור חזקה פי k
  glint:{from:5,col:'#FFE48A',every:3},   // דרגה 5: כל חתיכה שלישית בצבע זהב (רק מראה)
  stat:{gain:0,up:0,splash:0,boost:0}
};
const gmSave=()=>SAVE.gm||(SAVE.gm={wood:0,stone:0,plant:0});
// המשפחה של מקור, או null (תיבה)
function gmFam(n){const sh=gShape(n);for(const f in GMASTERY.fams)if(GMASTERY.fams[f].shapes.includes(sh))return f;return null}
// הדרגה (1 עד 5) לפי הנקודות
function gmTier(f){const p=gmSave()[f]||0,A=GMASTERY.at;let t=1;for(let i=1;i<A.length;i++)if(p>=A[i])t=i+1;return t}
const gmTierOf=n=>{const f=n&&gmFam(n);return f?gmTier(f):1};

// מקור נשבר בעולם: נקודה למשפחה, ובדרגה חדשה חגיגה ושורה מה נפתח
function gmGain(n){
  if(!gOn())return;const f=gmFam(n);if(!f)return;
  const t0=gmTier(f),s=gmSave();s[f]=(s[f]||0)+1;GMASTERY.stat.gain++;
  const t=gmTier(f);if(t<=t0)return;
  GMASTERY.stat.up++;saveNow();
  celebrate(P.x,P.y-20,'gear',GMASTERY.fams[f].icon);
  banner(T('gm.up',T('gm.'+f),t)+' · '+T('gm.u'+t),C.gold);
}
// המשפחה של משאב: המשאב הראשון בטבלת השלל של כל מקור (עץ, אבן, נחושת, עשב...). נבנה פעם אחת
let GM_RES=null;
function gmResFam(r){
  if(!GM_RES){GM_RES={};for(const k in NODES.kinds){const K=NODES.kinds[k],f=Object.keys(GMASTERY.fams).find(f=>GMASTERY.fams[f].shapes.includes(K.shape)),r0=Object.keys(K.drop)[0];if(f&&r0&&!GM_RES[r0])GM_RES[r0]=f}}
  return GM_RES[r]||null;
}
// פי כמה מרחוק נמשך שלל r (dropsUpdate ב-drops.js). 1 בזירה
function gmMagnet(r){if(!S||!S.wd)return 1;const f=gmResFam(r);return f&&gmTier(f)>=GMASTERY.magnet.from?GMASTERY.magnet.k:1}

// מכה במקור (gHit). d: הנזק שכבר ירד. דרגה 4: עוד נזק לאותו מקור. דרגה 3 ומעלה: גם מקור צמוד מאותה משפחה
function gmHit(n,d,ang){
  if(!gOn()||!d||n.gmSide)return;const f=gmFam(n);if(!f)return;const t=gmTier(f),G=GMASTERY;
  const k=t>=G.power.from?G.power.k:1;
  if(k>1){n.hp-=d*(k-1);G.stat.boost++}
  if(t<G.near.from)return;
  let left=G.near.n[t]||G.near.n[3];
  for(const o of S.nd.list){if(left<=0)break;if(o===n||o.dead||gmFam(o)!==f||Math.hypot(o.x-n.x,o.y-n.y)-o.r-n.r>G.near.r)continue;
    o.hp-=d*k;o.flash=0.09;o.gmSide=true;gHit(o,ang);o.gmSide=false;G.stat.splash++;left--;
    if(o.hp<=0&&!o.dead)nodeDown(o)}
}
// דרגה 5: חתיכה בצבע זהב מדי פעם (gHit). i: מספר החתיכה במכה
const gmGlint=(n,i)=>gmTierOf(n)>=GMASTERY.glint.from&&i%GMASTERY.glint.every===2?GMASTERY.glint.col:null;

// בחלון הדמות, שורה אחת בסוף הסטטים (בלי גלילה ב-844×390): הדרגה של כל משפחה, וכמה נשאר לדרגה הבאה בנגיעה (title)
function gmHtml(){
  const s=gmSave(),A=GMASTERY.at;
  const fam=Object.keys(GMASTERY.fams).map(f=>{const t=gmTier(f),p=s[f]||0,tip=T('gm.'+f)+': '+T('gm.lv',t)+(t<A.length?' · '+p+'/'+A[t]:' · '+T('gm.max'));
    return '<i title="'+tip+'" aria-label="'+tip+'">'+GMASTERY.fams[f].icon+'<bdi>'+t+'</bdi></i>'}).join(' ');
  return '<ul class="gsrows gmrow"><li><span class="gsi" aria-hidden="true">🧺</span><span class="gsn">'+T('gm.title')+'</span><b>'+fam+'</b></li></ul>';
}
