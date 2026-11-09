/* הכפר מחזיר (SVC, ניר 9.11.2026, docs/concept-village-loop.md פרק 3): שלושה שירותים שגדלים עם הכפר.
   1. הנפח: מנפחייה ברמה smith.forge, פריט שנוצר בנפחייה יוצא עם כוח (powers.js) בחינם, ובוחרים אחד מתוך שניים.
   2. הפונדקאית: מפונדק ברמה order.inn, משבצת רביעית בלוח: "הזמנה מהכפר". לאסוף בעולם חומר אחד, ופרס ×k שנוטה למה שחסר ליעד (goal.js).
   3. הסוחרת: המשפחה (עצים, אבנים ומתכות, צמחים) שממנה שברת הכי הרבה מקורות היום נמכרת בשוק ב-+trade.bonus, ולפחות מטבע אחד יותר.
   המספרים כאן. טקסט ב-lang.js תחת 'svc.' ו-'q.iOrder'. נשמר ב-SAVE.svc ({n: כמה פריטים נוצרו, day, fam:{wood:n}}).
   חיבורים: svcCraftId מ-gearCraft (gear.js), svcSmithHtml מ-bwForge (bwin.js), svcOrder מ-innApply ו-iOrder ב-INN.pool (inn.js),
   svcSell מ-vPrice (village.js), svcTradeLine מ-bwTrade (bwin.js), svcNode מ-nodeDown (nodes.js) */
const SVC={
  smith:{forge:3},
  // what: מה ההזמנה מבקשת (לפי היום), ומאיזו דרגת פטיש (tool). n: כמה. reward: הבסיס, ×k. tilt: כמה מהמשאב שהכי חסר ליעד נוסף לפרס
  order:{inn:2,k:1.25,
    what:{wood:{n:40},stone:{n:30},herb:{n:12},copper:{n:8},iron:{n:6,tool:2}},
    reward:{coins:50},tilt:{wood:25,stone:20,herb:8,copper:6,iron:5,silver:3,gold:1,mythril:1}},
  trade:{bonus:0.1},
  stat:{smith:0,order:0,node:0}
};
const SVS=()=>SAVE.svc||(SAVE.svc={n:0,day:'',fam:{}});

/* ---- 1. הנפח ---- */
const svcSmithOn=()=>vLv('forge')>=SVC.smith.forge;
// שני כוחות להציע לפריט: מתחלפים בכל יצירה (n), כדי שלא תמיד אותם שניים
function svcPicks(id){const it=gItem(id),ks=it?powFor(it.slot):[];if(!svcSmithOn()||ks.length<2)return[];const n=SVS().n%ks.length;return[ks[n],ks[(n+1)%ks.length]]}
let SVC_PICK=null;   // מה נבחר עכשיו בנפחייה (לא נשמר)
function svcCraftId(id){
  const ps=svcPicks(id);if(!ps.length)return id;
  const p=ps.includes(SVC_PICK)?SVC_PICK:ps[0];SVS().n++;SVC.stat.smith++;return powId(id,p);
}
// מתחת לכרטיס בנפחייה: שני כפתורים, ומה כל אחד נותן
function svcSmithHtml(id){
  const ps=svcPicks(id);if(!ps.length)return '';const cur=ps.includes(SVC_PICK)?SVC_PICK:ps[0];
  return '<div class="svsmith"><span class="sk">'+T('svc.smith')+'</span><div class="svpick">'+ps.map(p=>'<button class="goalpin" data-act="smithP" data-p="'+p+'" aria-pressed="'+(p===cur)+'">'+powName(p)+'<small>'+powDesc(p)+'</small></button>').join('')+'</div></div>';
}
$('vPanel').addEventListener('click',e=>{const b=e.target.closest('button[data-act="smithP"]');if(!b||!S.vil)return;
  e.stopImmediatePropagation();SVC_PICK=b.dataset.p;S.vil.ui='';sfx('ui');villageHud()},true);

/* ---- 2. הזמנה מהכפר (iOrder ב-INN.pool) ---- */
const svcOrderOn=()=>vLv('inn')>=SVC.order.inn;
// כל יום (innApply): מה מבקשים, כמה, והפרס. נוטה למשאב שהכי חסר ליעד שלך, אם יש
function svcOrder(q,day){
  const O=SVC.order,ws=Object.keys(O.what).filter(r=>!O.what[r].tool||gtTier('hammer')>=O.what[r].tool);
  const r=ws[innHash(day+'ord',11)%ws.length],o=q.obj[0];o.what=r;o.n=O.what[r].n;
  const rw={};for(const k in O.reward)rw[k]=Math.round(O.reward[k]*O.k);
  const g=typeof goalShow==='function'&&goalShow();if(g&&g.r&&O.tilt[g.r])rw[g.r]=Math.round(O.tilt[g.r]*O.k);
  q.reward=Object.assign(rw,q.reward.gem?{gem:q.reward.gem}:{});SVC.stat.order++;
}

/* ---- 3. השוק: המשפחה של היום ---- */
// המשאב הראשי של כל מקור בעולם, והמשפחה שלו (gtMain ב-gtool.js, gmFam ב-gmastery.js): עץ לעצים, אבן ומתכות לאבנים, עשב לצמחים
let SVC_FAM=null;
function svcFamOf(r){
  if(!SVC_FAM){SVC_FAM={};for(const k in NODES.kinds){const m=gtMain(k),f=gmFam({kind:k});if(m&&f&&!SVC_FAM[m])SVC_FAM[m]=f}}
  return SVC_FAM[r]||null;
}
// מקור שנשבר בעולם: נספר למשפחה שלו, היום
function svcNode(n){
  if(!S.wd||S.room)return;const f=gmFam(n);if(!f)return;const s=SVS(),d=qDay();
  if(s.day!==d){s.day=d;s.fam={}}s.fam[f]=(s.fam[f]||0)+1;SVC.stat.node++;
}
// המשפחה שהכי הרבה היום, או null
function svcFam(){const s=SVS();if(s.day!==qDay())return null;let b=null,n=0;for(const f in s.fam)if(s.fam[f]>n){n=s.fam[f];b=f}return b}
const svcSellK=r=>{const f=svcFam();return f&&svcFamOf(r)===f?1+SVC.trade.bonus:1};
// מחיר המכירה עם הבונוס: לפחות מטבע אחד יותר (10% מ-1 מעוגל לכלום), ותמיד פחות ממחיר הקנייה, כדי שלא יהיה רווח בלי לשחק
const svcSell=(r,sell,buy)=>svcSellK(r)===1?sell:Math.min(buy-1,Math.max(sell+1,Math.round(sell*svcSellK(r))));
const svcTradeLine=()=>{const f=svcFam();return f?'<p class="bwlead svtrade">'+T('svc.trade',T('gm.'+f),Math.round(SVC.trade.bonus*100))+'</p>':''};
