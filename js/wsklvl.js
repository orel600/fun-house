/* שדרוג סקילים אצל הכוהנת (ניר, 4.11.2026, "התוכנית הבאה" ב-roadmap.md). בעולם בלבד, הזירה של אוראל לא משתנה.
   כל סקיל מהספר (WSKBOOK.list, wskbook.js) שכבר פתוח עולה מ-+0 עד +5. כל רמה עולה מטבעות ומשאב לפי סוג הנזק של הסקיל,
   וברמות הגבוהות גם אבן חן. המחיר עולה בכל רמה. כל רמה נותנת יותר נזק, וברמות 3 ו-5 גם פחות זמן טעינה. בלי סיכוי כישלון.
   איפה: לשונית "סקילים" בחלון של הכוהנת (npcDialog ב-npc.js, בתבנית של bwin.js), ו-+N על הכרטיס בספר ועל כפתור הסקיל בקרב.
   החיבור: wsbCast ב-wskbook.js מכפיל את הנזק ב-wslK(id), וזמן הטעינה של הסקיל (D.cd) מחושב כאן לפי הרמה.
   סקיל חדש ב-WSKBOOK.list משתדרג לבד, בלי שורה נוספת. נשמר ב-SAVE.sklv ({meteor:2}), נוצר בפעם הראשונה. הטקסטים תחת 'wsl.' ב-lang.js */

const WSKLVL={
  npc:'priest',   // אצל מי משדרגים
  max:5,          // הרמה הגבוהה
  dmg:0.12,       // כמה נזק כל רמה מוסיפה (0.12 = +12% לרמה, ×1.6 ב-+5)
  cd:{3:0.9,5:0.8},   // זמן הטעינה מהרמה הזו ומעלה: כפול כמה מהזמן הרגיל
  coins:[60,150,320,650,1200],   // מטבעות לרמה 1..5
  matN:[4,8,14,22,32],           // כמה מהמשאב של סוג הנזק לרמה 1..5 (איזון 4.11: היה 6/12/20/30/45, ושדרוגים נתקעו על לוחות, אבק ועור)
  // המשאב לכל סוג נזק, ואבן החן לרמות הגבוהות (gemAt): [מאיזו רמה, איזו אבן, כמה]
  mat:{fire:'bone',ice:'essence',water:'essence',lightning:'dust',earth:'hide',physical:'plate'},
  gem:{fire:['rubyC','ruby'],ice:['sapphireC','sapphire'],water:['aquaC','aqua'],lightning:['boltC','bolt'],earth:['amberC','amber'],physical:['gem','gem']},
  gemAt:{4:[0,2],5:[1,1]}   // רמה 4: שתי אבנים שבורות. רמה 5: אבן אחת רגילה
};

const wslSave=()=>SAVE.sklv||(SAVE.sklv={});
const wslLv=id=>Math.min(WSKLVL.max,Math.max(0,wslSave()[id]|0));
const wslDmgK=lv=>1+lv*WSKLVL.dmg;
function wslCdK(lv){let k=1;for(const L in WSKLVL.cd)if(lv>=+L)k=Math.min(k,WSKLVL.cd[L]);return k}
// זמן הטעינה לפי הרמה: D.cd נקרא דרך כאן (wskUse ב-wskill.js, הכפתורים ב-skills.js), והזמן הרגיל נשמר ב-D.cd0
function wslWrap(id){
  const D=WSKBOOK.list[id];if(!D||'cd0' in D)return;
  D.cd0=D.cd;Object.defineProperty(D,'cd',{get(){return D.cd0*wslCdK(wslLv(id))},set(v){D.cd0=v},enumerable:true,configurable:true});
}
const wslAll=()=>{for(const id in WSKBOOK.list)wslWrap(id)};
// החיבור מ-wsbCast: כפול כמה נזק. גם עוטף סקיל שנוסף אחרי הטעינה
function wslK(id){wslWrap(id);return wslDmgK(wslLv(id))}
const wslIds=()=>{wslAll();return Object.keys(WSKBOOK.list).filter(id=>wsbOpen(id))};

// המחיר של הרמה הבאה
function wslCost(id){
  const lv=wslLv(id);if(lv>=WSKLVL.max)return null;
  const dt=WSKBOOK.list[id].dt,c={coins:WSKLVL.coins[lv],[WSKLVL.mat[dt]||'essence']:WSKLVL.matN[lv]},g=WSKLVL.gemAt[lv+1];
  if(g){const k=(WSKLVL.gem[dt]||WSKLVL.gem.physical)[g[0]];c[k]=(c[k]||0)+g[1]}
  return c;
}
const wslPay=c=>!!c&&Object.keys(c).every(r=>bagHas(r,c[r]));
const wslCan=id=>!!WSKBOOK.list[id]&&wsbOpen(id)&&wslPay(wslCost(id));
const wslStat={ups:0};   // בשביל הבוט
function wslUp(id){
  if(!wslCan(id))return false;
  const c=wslCost(id);for(const r in c)bagTake(r,c[r]);
  const lv=wslLv(id)+1;wslSave()[id]=lv;wslStat.ups++;questEvent('sklv');saveNow();   // הלוח בפונדק (inn.js)
  celebrate(P.x,P.y-20,'upgrade','+'+lv);sfx('ui');wslBadges();return true;
}

/* ---- הלשונית אצל הכוהנת (npcSvcs/npcDialog ב-npc.js) ---- */
const wslSvc=id=>id===WSKLVL.npc?[{id:'sklv',label:'📈 '+T('wsl.tab'),dot:wslIds().some(wslCan),html:wslHtml}]:[];
// מה הרמה הבאה נותנת: נזק, ואם יש, פחות טעינה
function wslNext(id){
  const lv=wslLv(id),a=wslCdK(lv),b=wslCdK(lv+1);
  return T('wsl.dmg',Math.round(wslDmgK(lv+1)*100-100))+(b<a?' · '+T('wsl.cd',Math.round((1-b)*100)):'');
}
function wslRow(id){
  const D=WSKBOOK.list[id],lv=wslLv(id),c=wslCost(id);
  return '<div class="wslr" style="--dt:'+dtCol(D.dt)+'">'+wsbIcon(id)+'<div class="wsln"><b>'+T('sk.'+id)+' <span class="wslv">+'+lv+'</span></b>'+
    (c?'<small>'+T('wsl.next',lv+1)+': '+wslNext(id)+'</small>'+bwCost(c):'<small>⭐ '+T('wsl.max')+'</small>')+'</div>'+
    (c?'<button class="vbtn vmain" data-act="sklv" data-id="'+id+'"'+(wslPay(c)?'':' disabled')+'>'+T('wsl.up',lv+1)+'</button>':'')+'</div>';
}
function wslHtml(){
  const ids=wslIds();
  return '<p class="bwlead">'+T('wsl.lead')+'</p>'+(ids.length?'<div class="wsllist">'+ids.map(wslRow).join('')+'</div>':'<p class="next">'+T('wsl.none')+'</p>');
}

/* ---- +N על הכרטיס בספר (.wsbc) ועל כפתור הסקיל בעולם (.skb) ---- */
function wslBadges(){
  const put=(el,id)=>{const lv=WSKBOOK.list[id]?wslLv(id):0;let b=el.querySelector(':scope>.wslb');
    if(!lv){if(b)b.remove();return}if(!b){b=document.createElement('b');b.className='wslb';el.appendChild(b)}const t='+'+lv;if(b.textContent!==t)b.textContent=t};
  const sk=$('skills');if(sk&&S.wd)for(const el of sk.querySelectorAll('.skb[data-sk]'))put(el,el.dataset.sk);
  const bk=$('ovBook');if(bk&&!bk.hidden)for(const el of bk.querySelectorAll('.wsbc[data-wsbid]'))put(el,el.dataset.wsbid);
}
(()=>{
  wslAll();
  const st=document.createElement('style');
  st.textContent='.wslb{position:absolute;top:-6px;inset-inline-start:-6px;min-width:22px;padding:1px 5px;border-radius:10px;background:'+C.gold+';color:#1a1206;font:800 12px Heebo,system-ui,sans-serif;line-height:18px;text-align:center;pointer-events:none;z-index:3}'+
    '.wsbc{position:relative}.wsllist{display:flex;flex-direction:column;gap:8px}.wslr{display:flex;align-items:center;gap:10px;padding:8px;border-radius:12px;background:#0003;border-inline-start:4px solid var(--dt)}'+
    '.wslr .wsln{flex:1;min-width:0}.wslr .wsln small{display:block;opacity:.85}.wslv{color:'+C.gold+'}.wslr .vbtn{min-height:44px;min-width:96px}';
  document.head.appendChild(st);
  // כשהכפתורים או הספר מצוירים מחדש: מוסיפים את ה-+N
  let q=0;const later=()=>{if(!q)q=requestAnimationFrame(()=>{q=0;wslBadges()})};
  const obs=new MutationObserver(later);const sk=$('skills');if(sk)obs.observe(sk,{childList:true});
  new MutationObserver(()=>{const bk=$('ovBook');if(bk&&!bk.dataset.wsl){bk.dataset.wsl=1;obs.observe(bk,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']})}}).observe(document.body,{childList:true});
})();
