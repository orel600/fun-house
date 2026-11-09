/* יעד ליד המשאבים (GOAL, ניר 9.11.2026, docs/concept-village-loop.md פרק 4): "🪨 12/40 · Market".
   בכפר מסמנים יעד אחד (📌 בחלון השדרוג של מבנה, או בלשונית הכלים בנפחייה). בלי סימון: השדרוג שהכי קרוב, מבין אלה שאפשר.
   בעולם, בפס העליון ליד המשאבים: שבב קטן עם המשאב שהכי חסר ליעד (רק משאבים שאוספים מהעולם), כמה יש וכמה צריך, ושם היעד.
   השבב פועם כשאוספים מהמשאב הזה. כשיש הכל: ⌂ ו-✓, וחגיגה פעם אחת ליעד, כדי לדעת שאפשר לחזור לבנות.
   המספרים כאן. טקסט ב-lang.js תחת 'goal.'. נשמר ב-SAVE.goal ({pin:{k:'market'} או {t:'axe'}, hit: היעד האחרון שנחגג}).
   חיבורים: goalUpdate מ-worldUpdate (world.js), goalPinBtn מ-bwUpgrade (bwin.js), goalAct מהלחיצות בכפר (village.js) ובנפחייה (gtClick) */
const GOAL={
  every:0.5,   // כל כמה שניות השבב מתעדכן
  // משאבים שאוספים ממקורות בעולם: רק הם מופיעים בשבב (מטבעות, חומרים מיצורים ואבנים יקרות לא)
  res:['wood','stone','herb','copper','iron','silver','gold','mythril'],
  stat:{show:0,pulse:0,done:0}
};
const goalS=()=>SAVE.goal||(SAVE.goal={pin:null,hit:null});
const goalKey=g=>g?(g.k?'b:'+g.k:g.p?'p:'+g.p:'t:'+g.t):'';
const goalLv=g=>goalKey(g)+':'+(g.k?vLv(g.k):g.p?vpStage(g.p):gtTier(g.t));   // היעד ברמה הבאה שלו: חגיגה אחת לכל שדרוג
const goalName=g=>g.k?T('vil.'+g.k):g.p?vpName(g.p):T('gt.'+g.t);
// המחיר של היעד, או null אם הוא כבר לא אפשרי (מקסימום, או כלי שכבר בשעון)
function goalCost(g){
  if(!g)return null;
  if(g.k)return VILLAGE.b[g.k]&&vBlock(g.k)!=='max'?vCost(g.k):null;
  if(g.p&&VPROJ.list[g.p])return vpHere(g.p)?vpCost(g.p):null;   // פרויקט בכפר (vproj.js)
  if(g.t&&GTOOL.tools[g.t]){const w=gtBlock(g.t);return w==='max'||w==='job'?null:GTOOL.cost[gtTier(g.t)+1]}
  return null;
}
// כמה מהמשאבים מהעולם כבר יש (0 עד 1). null: אין ביעד משאבים מהעולם
function goalFrac(c){let h=0,n=0;for(const r of GOAL.res)if(c[r]){n+=c[r];h+=Math.min(c[r],SAVE.bag[r]||0)}return n?h/n:null}
// היעד: המסומן אם הוא עדיין אפשרי, אחרת המבנה הכי קרוב מבין אלה שאפשר לשדרג (לא חסום במרכז הכפר)
function goalNow(){
  const s=goalS();if(s.pin&&goalCost(s.pin))return s.pin;
  if(s.pin)s.pin=null;
  let best=null,bf=-1;
  for(const k in VILLAGE.b){const w=vBlock(k);if(w&&w!=='cost')continue;const f=goalFrac(vCost(k)||{});if(f!=null&&f<1&&f>bf){bf=f;best={k}}}
  for(const p in VPROJ.list){const c=goalCost({p});const f=c&&goalFrac(c);if(f!=null&&f<1&&f>bf){bf=f;best={p}}}   // פרויקט בכפר
  return best;
}
// מה להראות: המשאב מהעולם שהכי חסר ליעד {g,r,have,need}, או {g,done:true} כשיש הכל
function goalShow(){
  const g=goalNow(),c=goalCost(g);if(!c)return null;let r=null,low=2;
  // נשארים על המשאב שכבר מוצג כל עוד הוא חסר, כדי שהשבב לא יקפוץ בין עץ לאבן באמצע האיסוף
  const k=GOALW.r;if(k&&GOALW.g===goalKey(g)&&c[k]&&(SAVE.bag[k]||0)<c[k])r=k;
  else for(const x of GOAL.res)if(c[x]){const f=(SAVE.bag[x]||0)/c[x];if(f<1&&f<low){low=f;r=x}}
  if(!r)return goalFrac(c)==null?null:{g,done:true};
  return {g,r,have:SAVE.bag[r]||0,need:c[r]};
}
function goalPin(g){const s=goalS();s.pin=goalKey(s.pin)===goalKey(g)?null:g;saveNow();sfx('ui')}
const goalPinned=g=>goalKey(goalS().pin)===goalKey(g);
// הכפתור 📌 בחלון השדרוג (bwUpgrade) ובלשונית הכלים (gtDraw)
const goalPinBtn=(g,act)=>'<button class="goalpin" data-act="'+act+'"'+(g.t||g.p?' data-k="'+(g.t||g.p)+'"':'')+' aria-pressed="'+goalPinned(g)+'" aria-label="'+T(goalPinned(g)?'goal.pinned':'goal.pin')+'">📌<span>'+T(goalPinned(g)?'goal.pinned':'goal.pin')+'</span></button>';

/* ---- בעולם: השבב בפס העליון ---- */
const GOALW={t:0,key:'',r:null,have:0,g:''};
function goalUpdate(dt){
  if(!S.wd||S.room)return;
  if((GOALW.t-=dt)>0)return;GOALW.t=GOAL.every;
  const o=goalShow();let b=$('goalChip');
  if(!b){if(!o)return;b=document.createElement('span');b.id='goalChip';b.className='goalchip';const hud=$('whud'),bag=$('wBag');if(!hud)return;hud.insertBefore(b,bag||null)}
  b.hidden=!o;if(!o)return;
  const key=goalKey(o.g)+'|'+(o.done?'done':o.r+'|'+o.have+'|'+o.need)+'|'+LANG;
  if(o.r&&o.r===GOALW.r&&o.have>GOALW.have&&goalKey(o.g)===GOALW.g){b.classList.remove('gpulse');void b.offsetWidth;b.classList.add('gpulse');GOAL.stat.pulse++}
  GOALW.r=o.r;GOALW.have=o.have||0;GOALW.g=goalKey(o.g);
  if(o.done&&goalS().hit!==goalLv(o.g)){goalS().hit=goalLv(o.g);saveNow();GOAL.stat.done++;celebrate(P.x,P.y-20,'gear','⌂');banner(T('goal.ready',goalName(o.g)),C.gold)}
  if(key===GOALW.key)return;GOALW.key=key;GOAL.stat.show++;
  // span ולא b: ‎.whud b‎ הוא שם האזור, שנעלם אחרי 5 שניות (style.css), והמספר היה נעלם איתו
  b.innerHTML=o.done?'⌂ <span class="gnum">'+goalName(o.g)+'</span> ✓':resPic(o.r)+'<span class="gnum">'+shortN(o.have)+'/'+shortN(o.need)+'</span><small>'+goalName(o.g)+'</small>';
  b.setAttribute('aria-label',o.done?T('goal.ready',goalName(o.g)):T('goal.aria',resName(o.r),o.have,o.need,goalName(o.g)));
}
// לחיצה בכפר (village.js) או בנפחייה (gtClick): true אם זו הייתה לחיצה על 📌
function goalAct(b){
  const a=b.dataset.act;
  if(a==='pinB'&&S.vil&&S.vil.near){goalPin({k:S.vil.near});return true}
  if(a==='pinT'&&b.dataset.k){goalPin({t:b.dataset.k});return true}
  return false;
}
