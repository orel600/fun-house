/* חנות הריצה (אוראל, 1.11.2026, בהשראת MLBB): זהב שנאסף מהריגות בזירה קונה ציוד לריצה הזו בלבד.
   הזהב והציוד מתאפסים בכל ריצה (S.shop), ולא נוגעים בתרמיל, במטבעות או בציוד של הכפר.
   כפתור עם הסכום בפס העליון, ליד התרמיל. החלון עוצר את המשחק כמו חלון הציוד, ויוצא ב-✕, Esc ולחיצה בחוץ (WINS ב-ui.js).
   לכל פריט עד max רמות, והמחיר עולה בכל רמה. נקרא מ-kill (combat.js) ומ-render.js. הטקסטים ב-lang.js תחת 'shop.' */
const SHOP={
  gold:{kill:1,elite:12,boss:30},   // כמה זהב כל הריגה: רגיל, אויב-על או מבוקש, ובוס
  items:{
    blade:{price:[20,45,80],k:0.15,icon:'M14.5 4.5 20 4l-.5 5.5-9 9-5-5zM4 20l3.5-3.5'},            // נזק, לחרב ולקשת
    boots:{price:[15,30,55],k:0.08,icon:'M7 4v9l-3 4v3h16v-2l-6-2-3-3V4z'},                      // מהירות תנועה
    armor:{price:[20,40,70],k:4,icon:'M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6z'},                  // הגנה (P.def)
    charm:{price:[25,50,90],k:5,icon:'M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z'},       // סיכוי למכה קריטית (P.crit)
    heart:{price:[15,35,60],k:25,icon:'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z'}   // חיים מלאים, ומתמלא מיד
  },
  col:'#F2C14E'   // זהב: השלל של הריצה
};
const shopArena=()=>!!S&&skArena();
function shopState(){return S.shop||(S.shop={gold:0,lv:{},spent:0})}
// הריגה בזירה: זהב לריצה
function shopKill(e){
  if(!shopArena())return;const G=SHOP.gold;
  shopState().gold+=e&&e.isBoss?G.boss:e&&(e.elite||e.champ||e.wanted)?G.elite:G.kill;
}
const shopPrice=id=>{const it=SHOP.items[id],l=shopState().lv[id]||0;return l<it.price.length?it.price[l]:null};
function shopBuy(id){
  const s=shopState(),p=shopPrice(id),k=SHOP.items[id].k;if(p==null||s.gold<p)return false;
  s.gold-=p;s.spent+=p;s.lv[id]=(s.lv[id]||0)+1;
  if(id==='blade'){P.sw.dmg*=1+k;P.gn.dmg*=1+k}
  else if(id==='boots')P.speed*=1+k;
  else if(id==='armor')P.def+=k;
  else if(id==='charm')P.crit+=k;
  else if(id==='heart'){P.maxHp+=k;P.hp=Math.min(P.maxHp,P.hp+k)}
  sfx('coin');shopDraw();return true;
}
function shopOpen(){if(S.mode!=='play'||!shopArena())return;S.mode='shop';joy=null;$('ovShop').hidden=false;shopDraw();sfx('ui')}
function shopClose(){$('ovShop').hidden=true;if(S.mode==='shop')S.mode='play'}
const shopSvg=id=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" d="'+SHOP.items[id].icon+'"/></svg>';
function shopDraw(){
  const s=shopState(),box=$('ovShop').querySelector('.win');
  box.innerHTML=winHead(T('shop.title'),'<b class="shopg">'+s.gold+'</b>')+'<div class="shopgrid">'+Object.keys(SHOP.items).map(id=>{
    const l=s.lv[id]||0,it=SHOP.items[id],p=shopPrice(id),dots=it.price.map((_,i)=>'<i class="'+(i<l?'on':'')+'"></i>').join('');
    return '<div class="shopit"><span class="shopic">'+shopSvg(id)+'</span><b>'+T('shop.'+id)+'</b><small>'+T('shop.'+id+'.d')+'</small><span class="shopdots">'+dots+'</span>'
      +(p==null?'<span class="shopmax">'+T('shop.max')+'</span>':'<button type="button" data-buy="'+id+'"'+(s.gold<p?' disabled':'')+'>'+p+'</button>')+'</div>'}).join('')+'</div>';
}
// הכפתור בפס העליון: רק בזירה, עם הסכום. מתעדכן רק כשהסכום משתנה
let shopShown='';
function shopHud(){
  const b=$('shopBtn'),on=shopArena()&&(S.mode==='play'||S.mode==='shop');if(b.hidden===on)b.hidden=!on;if(!on)return;
  const v=String(shopState().gold);if(v!==shopShown){shopShown=v;b.querySelector('b').textContent=v}
}
$('shopBtn').addEventListener('click',e=>{e.stopPropagation();shopOpen()});
$('ovShop').addEventListener('click',e=>{const b=e.target.closest('[data-buy]');if(b)shopBuy(b.dataset.buy);else if(e.target.closest('[data-act="close"]'))shopClose()});
