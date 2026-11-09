/* חלונות המבנים והשירותים בכפר: תבנית אחת לכולם (ניר, 2.11.2026: "כל החנויות לא נוחות... לא ברור איך מתנהלים").
   כל חלון בנוי אותו דבר:
   - כותרת: שם ורמה, ושורה אחת שאומרת מה עושים כאן. ✕ אחד בסוף.
   - לשוניות: מה שעושים במקום (אחסון, מסחר, יצירה, תוצרת, בישול) ו"שדרוג". לשונית אחת = בלי שורת לשוניות.
   - שדרוג תמיד באותה צורה: "שדרוג: רמה X → Y", מה יש עכשיו ומה יהיה, "מחיר:" עם ✓ או כמה חסר באדום, וכפתור אחד.
   המבנים: villageHud ב-village.js קורא ל-bwBuilding. התושבים: npcDialog ב-npc.js קורא ל-npcSvcs ול-bwHead.
   המספרים ב-BWIN, הטקסטים ב-lang.js תחת 'bw.', והעיצוב ב-css/bwin.css */

const BWIN={
  move:10,     // נגיעה בכרטיס במחסן מעבירה כך הרבה לצד השני
  hold:450,    // לחיצה ארוכה (אלפיות שנייה) מעבירה הכל
  sel:{}       // מה נבחר בכל חלון קנייה (forge: איזה חפץ). לא נשמר: בכל כניסה בוחרים מחדש את הכי משתלם, אם הקודם כבר לא שם
};

const bwRar=k=>{const R=resOf(k),c=R?RES.rarity[R.rar||0].col:gItem(k)?gTint(k):'';return c?' style="--rar:'+c+'"':''};
const bwNum=n=>Math.floor(n||0).toLocaleString('en');

// הכותרת. tabs: [{id,label,dot}], cur: הלשונית הפתוחה. chip: משהו קטן ליד ה-✕ (כמה מטבעות יש, בשוק ובנפחייה)
function bwHead(title,sub,tabs,cur,chip){
  const tb=tabs&&tabs.length>1?'<div class="bwtabs" role="tablist">'+tabs.map(t=>'<button role="tab" data-act="tab" data-tab="'+t.id+'" aria-selected="'+(t.id===cur)+'">'+t.label+(t.dot?'<i class="bwdot"></i>':'')+'</button>').join('')+'</div>':'';
  return '<div class="whd bwhd"><div class="bwt"><h3>'+title+'</h3>'+(sub?'<p>'+sub+'</p>':'')+'</div>'+tb+(chip||'')+
    '<button class="wx" data-act="close" aria-label="'+T('q.close')+'">✕</button></div>';
}
const bwCoins=()=>'<span class="res bwcoin" data-tip="coins">'+resPic('coins')+' '+bwNum(SAVE.bag.coins)+'</span>';

/* ---- שדרוג ---- */
// המחיר: לכל משאב כמה צריך, ומתחת ✓ אם יש מספיק, או כמה חסר באדום. נגיעה במשאב אומרת את השם (data-tip, resources.js)
const bwCost=c=>'<div class="bwprice">'+Object.keys(c).map(r=>{const have=SAVE.bag[r]||0,ok=have>=c[r];
  return '<span class="bwpc'+(ok?'':' miss')+'" data-tip="'+r+'"'+bwRar(r)+' aria-label="'+resName(r)+'"><span class="ic">'+resPic(r)+'</span><b>'+shortN(c[r])+'</b><small>'+(ok?'✓':T('bw.short',shortN(c[r]-have)))+'</small></span>'}).join('')+'</div>';
function bwUpgrade(k,L){
  const why=vBlock(k);
  if(why==='max')return '<p class="bwlead">⭐ '+T('vil.max')+'</p><p>'+vInfo(k,L)+'</p>';
  let h='<h4 class="bwup">'+(L?T('bw.upTo',L,L+1):T('bw.buildT'))+'</h4>';
  h+='<div class="bwcmp">'+(L?'<div><span class="sk">'+T('bw.now')+'</span><p>'+vInfo(k,L)+'</p></div><span class="bwarr" aria-hidden="true">➜</span>':'')+
    '<div class="nxt"><span class="sk">'+T(L?'bw.after':'bw.gives')+'</span><p>'+vInfo(k,L+1)+'</p></div></div>';
  h+='<div class="bwpay"><span class="sk">'+T('bw.price')+'</span>'+bwCost(vCost(k))+'</div>';
  h+=!why?'<button class="vbtn vmain" data-act="up">'+(L?T('vil.up',L+1):T('vil.build'))+'</button>'
    :'<p class="bwbad">'+(why==='center'?T('bw.needCenter',L+1):T('bw.missing'))+'</p>';
  return h+goalPinBtn({k},'pinB');   // 📌 יעד בעולם (goal.js)
}

/* ---- מה עושים בכל מבנה (הלשונית הראשונה) ---- */
// מנסרה ומכרה: מה מייצר בשעה, כמה מחכה מכל משאב (עם פס עד המקסימום), וכפתור לאסוף
function bwProd(k,L){
  const B=VILLAGE.b[k],p=vProd(k),rs=Object.keys(B.make).filter(r=>B.make[r][L]>0),n=vStock(k),full=rs.some(r=>(p.have[r]||0)>=B.cap[L]);
  return '<p class="bwlead">'+T('bw.perHour',makeLine(B,L))+'</p><div class="bwstock">'+rs.map(r=>{const v=Math.floor(p.have[r]||0);
      return '<div class="bwst"'+bwRar(r)+'><span class="ic">'+resPic(r)+'</span><span class="nm">'+resName(r)+'</span><b>'+v+' / '+B.cap[L]+'</b><i style="width:'+Math.min(100,v/B.cap[L]*100)+'%"></i></div>'}).join('')+'</div>'+
    (full?'<p class="bwbad">'+T('bw.fullProd')+'</p>':'')+
    (n?'<button class="vbtn vmain" data-act="collect">'+T('vil.collect',n)+'</button>':'<p class="vwhy">'+T('vil.nothing')+'</p>');
}
// השוק: מוכרים מהתרמיל בטור אחד, קונים בטור השני. כל כרטיס: שם, כמה בכל לחיצה, המחיר, וכמה יש לך. כרטיס נעול אומר למה
function bwTrade(L){
  const rs=Object.keys(RES.list),card=(kind,r,why,p)=>'<button class="tcard" data-act="'+kind+'" data-r="'+r+'"'+(why?' disabled':'')+bwRar(r)+' aria-label="'+T('vil.'+kind)+' '+resName(r)+'">'+
    '<span class="ic">'+resPic(r)+'</span><span class="nm">'+resName(r)+' <small>×'+vLot(r)+'</small></span><span class="pr"><bdi>'+p+'</bdi>'+resPic('coins')+'</span>'+
    '<small class="hv'+(why?' tw':'')+'">'+(why||T('bw.have',shortN(SAVE.bag[r])))+'</small></button>';
  const sell=rs.filter(r=>vCanTrade('sell',r)&&bagHas(r)),
    buy=rs.filter(r=>resOf(r).buy).map(r=>{const p=vPrice(r,'buy')*vLot(r);return[r,p,!vCanTrade('buy',r)?'🔒 '+T('vil.mkLv',RES.rarity[resOf(r).rar].market):bagHas('coins',p)?'':T('vil.noCoins')]})
      .sort((a,b)=>(!!a[2]-!!b[2]));   // מה שאפשר לקנות עכשיו קודם
  return '<div class="bwcols">'+
    '<section><div class="bwch"><b>'+T('bw.sellT')+'</b></div>'+(sell.length?'<div class="bwgrid trade">'+sell.map(r=>card('sell',r,bagHas(r,vLot(r))?'':T('vil.needN',vLot(r)),'+'+vPrice(r,'sell')*vLot(r))).join('')+'</div>':'<p class="next">'+T('bw.sellNone')+'</p>')+'</section>'+
    '<section><div class="bwch"><b>'+T('bw.buyT')+'</b></div><div class="bwgrid trade">'+buy.map(([r,p,why])=>card('buy',r,why,p)).join('')+'</div></section></div>';
}
// הנפחייה (ניר, 3.11.2026: "בחירת נשק לקנייה לא ברורה"): רשימה של אריחים קטנים בטור אחד, והכרטיס הגדול של מה שנבחר בטור השני (itemcard.js).
// בלי בחירה: הכי משתלם שאפשר ליצור עכשיו. היצירה עצמה: gearCraft ב-gear.js (data-act="craft", דרך village.js)
function bwForge(){
  const ids=Object.keys(GEAR.recipes).filter(gCanCraft),ok=id=>!Object.keys(icMiss(GEAR.recipes[id])).length;
  let sel=BWIN.sel.forge;
  if(!ids.includes(sel))sel=BWIN.sel.forge=ids.filter(ok).sort((a,b)=>icDelta(b)-icDelta(a))[0]||ids[0];
  const top='<div class="bwch"><b>'+T('forge.craft')+'</b><button class="vbtn bwall" data-act="forge">✨ '+T('age.open')+'</button></div>';
  if(!ids.length)return top+'<p class="next">'+T('ic.none')+'</p>';
  return '<div class="bwcols icols"><section>'+top+'<div class="bwgrid ictiles">'+ids.map(id=>itemTile(id,{on:id===sel,cost:GEAR.recipes[id]})).join('')+'</div></section>'+
    '<section class="icside">'+itemCard(sel,{cost:GEAR.recipes[sel],act:'craft'})+'</section></div>';
}
// נגיעה באריח (data-act="pick"): בוחרים אותו ומציירים מחדש. נתפס לפני village.js, שלא מכיר את הפעולה
$('vPanel').addEventListener('click',e=>{const b=e.target.closest('button[data-act="pick"]');if(!b||!S.vil)return;
  e.stopImmediatePropagation();BWIN.sel[S.vil.near]=b.dataset.id;S.vil.ui='';sfx('ui');villageHud()},true);   // ui='': villageHud בונה מחדש רק כשמשהו נשמר השתנה

// לכל מבנה: הלשונית הראשונה (שם וגוף), או null כשאין בו מה לעשות חוץ משדרוג (מרכז הכפר, ומבנה שעוד לא נבנה)
function bwMain(k,L){
  if(L<1)return null;
  if(k==='stash')return{label:'📦 '+T('bw.tab.stash'),html:()=>stashHtml()};   // stash.js
  if(k==='market')return{label:'🛒 '+T('vil.trade'),html:()=>bwTrade(L)};
  if(k==='forge')return{label:'⚒️ '+T('bw.tab.craft'),html:bwForge};
  if(k==='inn'){const s=innSvcs('inn')[0];return{label:s.label,html:s.html,dot:s.dot}}   // הלוח בפונדק (inn.js)
  if(VILLAGE.b[k].make)return{label:'📦 '+T('bw.tab.collect'),html:()=>bwProd(k,L),dot:vStock(k)>0};
  return null;
}
// כל החלון של מבנה. הלשונית נשמרת לכל מבנה בנפרד (S.vil.tab), כדי שחזרה למבנה תפתח איפה שהיית
function bwBuilding(k){
  const L=vLv(k),main=bwMain(k,L),tabs=[];
  if(main)tabs.push({id:'main',label:main.label,dot:main.dot});
  if(k==='market'&&L&&typeof decoTab==='function')tabs.push(decoTab());   // חנות קישוטים (deco.js)
  if(k==='inn'&&L)tabs.push(innSvcs('inn')[1]);   // מנוחה (inn.js)
  if(!main||vBlock(k)!=='max')tabs.push({id:'up',label:L?'⬆️ '+T('bw.tab.up'):'🔨 '+T('bw.tab.build'),dot:!!main&&!vBlock(k)});
  const TB=S.vil.tab||(S.vil.tab={});let cur=TB[k];if(!tabs.some(t=>t.id===cur))cur=tabs[0].id;
  return bwHead(T('vil.'+k)+(L?' <small>'+T('level',L)+'</small>':''),T(k==='stash'&&L?'bw.why':'bw.do.'+k),tabs,cur,k==='market'||k==='forge'?bwCoins():'')+
    '<div class="bwbody bw-'+k+' bw-'+cur+'">'+(cur==='main'?main.html():cur==='up'?bwUpgrade(k,L):tabs.find(t=>t.id===cur).html())+'</div>';
}

/* ---- תושבים עם שירות: הפונדקאית מבשלת, ומי שעברה מהעולם קונה או מחליפה ---- */
// השירותים של תושב, כלשוניות ליד "שיחה". השיחה והקווסטים נשארים בלשונית הראשונה, כדי שהשירות לא יתערבב בהם
function npcSvcs(id){
  const s=innSvcs(id);   // הפונדקאית: הלוח והמנוחה (inn.js)
  if(id===FISH.cookAt)s.push({id:'cook',label:'🍳 '+T('bw.cook'),html:()=>'<p class="bwlead">'+T('bw.cookWhy')+'</p>'+fishCookHtml()});   // fishing.js
  const R=NPC.list[id]&&NPC.list[id].serve&&RESID.list[NPC.list[id].serve];
  if(R)s.push({id:'serve',label:R.sign+' '+T('rsd.'+NPC.list[id].serve+'.t'),html:()=>resHtml(id)});   // residents.js
  const pj=R&&vpTab(NPC.list[id].serve);if(pj)s.push(pj);   // פרויקט בכפר (vproj.js)
  return s;
}

/* ---- לחיצה ארוכה: על כפתור עם data-hold, אחרי BWIN.hold היא לוחצת עליו עם data-n="all" (הכל במקום BWIN.move).
   הנגיעה הרגילה שמגיעה אחר כך נבלעת, כדי שלא תעביר עוד 10 ---- */
for(const id of ['vPanel','npcDlg']){const el=$(id);let tm=0,held=false;
  const stop=()=>{clearTimeout(tm);tm=0};
  el.addEventListener('pointerdown',e=>{const b=e.target.closest('button[data-hold]');held=false;stop();if(!b||b.disabled)return;
    tm=setTimeout(()=>{tm=0;held=true;b.dataset.n='all';b.click();if(navigator.vibrate)navigator.vibrate(15)},BWIN.hold)});
  for(const t of ['pointerup','pointercancel','pointerleave'])el.addEventListener(t,stop);
  el.addEventListener('click',e=>{if(held&&e.isTrusted){held=false;e.stopImmediatePropagation();e.preventDefault()}},true);
  el.addEventListener('contextmenu',e=>{if(e.target.closest('button[data-hold]'))e.preventDefault()});
}
