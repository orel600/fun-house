/* קפיצה בין פנסים (ניר, 1.11.2026: "פנס דולק = נקודת קפיצה, כדי שלא צריך לחצות את כל האזורים כל פעם").
   רק לפנסים דולקים (STORY.lanterns ו-SAVE.story), כי המחקר אמר שמסע מהיר לכל נקודה מוריד מהחקירה: קופצים רק למה שכבר חקרת.
   שלושה מקומות:
   1. בשער בכפר: במקום כפתור אחד, "לאן?": האחו (תמיד) וכל פנס דולק (travelGateHtml, מ-villageHud ב-village.js).
   2. במפת העולם (worldmap.js): נגיעה באי עם פנס דולק, וכפתור "קפוץ לכאן" מתחת למפה (travelMapRow).
   3. ליד פנס דולק בעולם: כפתור "חזרה לכפר" בסרגל התחתון (#trBtn).
   הקפיצה: הבזק אור בצבע הפנס (celebrate ב-fx.js ושכבת אור על המסך), ומגיעים ליד הפנס. בלי מסך טעינה.
   אי אפשר לקפוץ מהעולם כשאויב קרוב, או כשהשומר של האזור קם ועוד חי. לא נשמר כלום משלו: הכל מ-SAVE.story */

const TRAVEL={
  arrive:120,        // כמה פיקסלים מתחת לפנס מגיעים
  near:110,          // מאיזה מרחק מהפנס מופיע הכפתור "חזרה לכפר"
  safe:260,          // אויב קרוב מזה: אי אפשר לקפוץ (באמצע קרב)
  flash:0.28,        // שניות של הבזק לפני המעבר ואחריו
  fx:{burst:40,speed:300,pillar:1.1,pillarW:56,pillarH:300}   // הבזק האור (CELEBRATE ב-fx.js), בצבע הפנס
};

// הפנסים הדולקים, לפי סדר העלילה: [{k,L}]
const travelLit=()=>Object.keys(STORY.lanterns).filter(storyOpen).map(k=>({k,L:STORY.lanterns[k]}));
const travelOf=r=>travelLit().find(o=>o.L.reg===r);
// למה אי אפשר לקפוץ עכשיו: '' (אפשר), 'fight' (אויב קרוב) או 'warden' (השומר של האזור חי). בכפר תמיד אפשר
function travelBlock(){
  if(!S||!S.wd)return '';
  const w=S.wd.warden;if(w&&!w.dead)return 'warden';
  return nearest(TRAVEL.safe)?'fight':'';
}
let trBusy=false;

/* ---- הקפיצה: הבזק, מעבר, הבזק ---- */
function travelFlash(col,x,y){
  const id='travel'+col;CELEBRATE[id]=CELEBRATE[id]||Object.assign({dust:0,col,label:''},TRAVEL.fx);
  celebrate(x,y,id);
  const f=$('trFlash');f.style.setProperty('--trc',col);f.hidden=false;f.classList.remove('out');void f.offsetWidth;f.classList.add('on');
}
function travelGo(to){   // to: 'home' (הכפר), 'meadow' (השער באחו) או מזהה פנס
  if(trBusy||!S||travelBlock())return false;
  const L=STORY.lanterns[to];if(L&&!storyOpen(to))return false;
  const col=L?L.glow:C.gold;trBusy=true;joy=null;
  travelFlash(col,P.x,P.y);
  setTimeout(()=>{
    trBusy=false;const f=$('trFlash');f.classList.remove('on');f.classList.add('out');setTimeout(()=>{f.hidden=true},TRAVEL.flash*1000);
    if(S.vil)villageUi(false);if(S.wd)worldUi(false);
    if(to==='home'){enterVillage();banner(T('tr.home'),col)}
    else if(to==='meadow'){enterWorld('home');questEvent('reach','world')}
    else{enterWorld('home',L.reg);P.x=L.x;P.y=L.y+TRAVEL.arrive;placeClamp(P);S.cam.x=P.x;S.cam.y=P.y;banner(T('tr.at',T('w.region.'+L.reg)),col)}
    celebrate(P.x,P.y,'travel'+col);sfx('celebrate');
  },TRAVEL.flash*1000);
  return true;
}

/* ---- 1. בשער בכפר: "לאן?" ---- */
function travelGateHtml(){
  const lit=travelLit();if(!lit.length)return '';   // עוד אין פנס דולק: הכפתור הרגיל
  return winHead(T('tr.where'))+'<p>'+T('vil.outInfo')+'</p><div class="trlist">'+
    '<button class="vbtn" data-act="go">🌿 '+T('w.region.meadow')+'</button>'+
    lit.map(o=>'<button class="vbtn trgo" data-act="jump" data-k="'+o.k+'" style="--trc:'+o.L.glow+'">🏮 '+T('w.region.'+o.L.reg)+'</button>').join('')+'</div>';
}

/* ---- 2. במפת העולם: נגיעה באי עם פנס דולק ---- */
let trSpots=[],trPick=null;
function travelMapSpots(list,rad){trSpots=list.map(s=>Object.assign({rad},s))}   // מ-wmDrawWorld: איפה כל אי בקנבס
function travelMapRow(){
  const o=trPick&&travelOf(trPick);
  if(!o)return travelLit().length?'<p class="wmkey trhint">🏮 '+T('tr.mapHint')+'</p>':'';
  const why=travelBlock();
  return '<div class="trrow"><button class="vbtn trgo" data-act="jump" data-k="'+o.k+'" style="--trc:'+o.L.glow+'"'+(why?' disabled':'')+'>✨ '+T('tr.jump',T('w.region.'+o.L.reg))+'</button>'+
    (why?'<small>'+T('tr.no.'+why)+'</small>':'')+'</div>';
}
function travelMapPick(r){trPick=travelOf(r)?r:null;wmDraw()}
$('wMap').addEventListener('pointerup',e=>{
  if(e.target.id!=='wmWorld')return;const b=e.target.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top;
  const s=trSpots.find(s=>Math.hypot(s.x-x,s.y-y)<s.rad*1.1);if(s){travelMapPick(s.r);sfx('ui')}
});
$('wMap').addEventListener('click',e=>{const b=e.target.closest('[data-act="jump"]');if(b&&!b.disabled){trPick=null;if(travelGo(b.dataset.k))wmapOpen(false)}});

/* ---- 3. ליד פנס דולק בעולם: "חזרה לכפר" ---- */
function travelUpdate(){
  const b=$('trBtn'),o=S.wd&&travelOf(S.wd.reg),on=!!o&&Math.hypot(P.x-o.L.x,P.y-o.L.y)<TRAVEL.near+P.r;
  if(b.hidden===!on&&b.dataset.lang===LANG)return;
  b.hidden=!on;b.dataset.lang=LANG;if(on){b.style.setProperty('--trc',o.L.glow);b.innerHTML='<span class="ni" aria-hidden="true">🏮</span>'+T('ctx.home');b.setAttribute('aria-label',T('tr.homeBtn'))}
}
function travelOff(){$('trBtn').hidden=true;trPick=null}
$('trBtn').addEventListener('click',()=>{if(!S.wd)return;const why=travelBlock();if(why){banner(T('tr.no.'+why),C.ember);sfx('ui');return}travelGo('home')});
