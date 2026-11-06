/* קפיצה בין פנסים (ניר, 1.11.2026: "פנס דולק = נקודת קפיצה, כדי שלא צריך לחצות את כל האזורים כל פעם").
   רק לפנסים דולקים (STORY.lanterns ו-SAVE.story), כי המחקר אמר שמסע מהיר לכל נקודה מוריד מהחקירה: קופצים רק למה שכבר חקרת.
   חלון קפיצה אחד (ניר, 6.11: "חלק מחזירים אותך רק הביתה, חלק נותנים לך אופציות וחלק רק אופציות ספציפיות"):
   כל נקודת קפיצה פותחת את אותו חלון "לאן?" (travelWin), עם אותה רשימה: הכפר, הכניסה לאחו, וכל פנס דולק ואבן מסע פתוחה (waystones.js),
   מקובצים לפי אזור. המקום שעומדים בו לא מופיע. נפתח מ: השער בכפר (vOpen ב-village.js), השער הביתה באחו (wGoEl ב-world.js),
   כפתור 🏮 ליד פנס דולק (#trBtn), כפתור 🗿 ליד אבן פתוחה (#wsBtn), וכפתור במפת העולם (travelMapRow, מ-worldmap.js).
   אין לאן לקפוץ חוץ מהיציאה הרגילה: הכפתור יוצא ישר, בלי חלון.
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

/* ---- החלון האחד: "לאן?" ---- */
// היעדים, מקובצים לפי אזור: [{r,items:[{k,ico,name,col}]}]. k: 'home', 'meadow', מזהה פנס, או 'ws:<אזור>.<id>' (אבן מסע)
function travelDests(){
  const G=[{r:'village',items:[{k:'home',ico:'🏠',name:T('tr.village'),col:C.gold}]}],lit=travelLit(),ws=wsOpenAll();
  for(const r of ['meadow',...Object.keys(WORLD.regions)]){
    const it=r==='meadow'?[{k:'meadow',ico:'🌿',name:T('tr.entry'),col:'#9BD86A'}]:[];
    for(const o of lit)if(o.L.reg===r)it.push({k:o.k,ico:'🏮',name:T('tr.lantern'),col:o.L.glow});
    for(const o of ws)if(o.r===r)it.push({k:'ws:'+o.k,ico:'🗿',name:T('ws.'+o.s.id),col:WAYSTONES.col});
    if(it.length)G.push({r,items:it});
  }
  return G;
}
// איפה עומדים עכשיו (לא מוצג ברשימה): הכפר, אבן או פנס שלידם, או השער הביתה באחו
function travelHere(){
  if(!S)return '';if(S.vil)return 'home';if(!S.wd)return '';
  const s=wsHere();if(s)return 'ws:'+wsKey(S.wd.reg,s);
  const o=travelOf(S.wd.reg);if(o&&Math.hypot(P.x-o.L.x,P.y-o.L.y)<TRAVEL.near+P.r)return o.k;
  return S.wd.reg==='meadow'&&S.wd.near==='home'?'meadow':'';
}
// יש לאן לקפוץ חוץ מהיציאה הרגילה (הכפר לאחו, או האחו לכפר)? אם לא, השער יוצא ישר
const travelAny=()=>travelLit().length>0||wsOpenAll().length>0;
function travelHtml(){
  const here=travelHere(),why=travelBlock();
  const gs=travelDests().map(g=>({r:g.r,items:g.items.filter(i=>i.k!==here)})).filter(g=>g.items.length);
  return winHead(T('tr.where'))+(why?'<p class="trwhy">'+T('tr.no.'+why)+'</p>':'')+'<div class="trgroups">'+gs.map(g=>
    '<div class="trgrp"><h4>'+(g.r==='village'?T('tr.village'):T('w.region.'+g.r))+'</h4><div class="trlist">'+g.items.map(i=>
      '<button class="vbtn trgo" data-act="tjump" data-k="'+i.k+'" style="--trc:'+i.col+'"'+(why?' disabled':'')+'>'+i.ico+' '+i.name+'</button>').join('')+'</div></div>').join('')+'</div>';
}
const trWin=(()=>{const w=document.createElement('div');w.id='trWin';w.className='qlog win trwin';w.hidden=true;$('wMap').after(w);return w})();
WINS.unshift({id:'trWin',close:()=>travelWin(false)});   // Esc סוגר (ui.js)
let trMode='';
// פתיחה וסגירה. בעולם המשחק עוצר בזמן הבחירה, כמו במפה
function travelWin(on){
  if(on){if(!S||S.mode!=='play'&&S.mode!=='map')return false;if(!$('wMap').hidden)wmapOpen(false);if(S.vil&&S.vil.open)vShut();if(S.wd)wShut();
    trMode=S.mode;S.mode='travel';joy=null;trWin.innerHTML=travelHtml();trWin.hidden=false;sfx('ui');return true}
  if(trWin.hidden)return false;trWin.hidden=true;if(S&&S.mode==='travel')S.mode='play';return true;
}
// מנקודת קפיצה: אם יש לאן לבחור, החלון. אחרת היציאה הרגילה (go), אם יש
function travelOpen(go){if(travelAny())return travelWin(true);if(go)go();return false}
// קפיצה ליעד מהרשימה
function travelJump(k){
  const why=travelBlock();if(why){banner(T('tr.no.'+why),C.ember);sfx('ui');return false}
  travelWin(false);
  if(k==='meadow'&&S.vil){leaveVillage();return true}   // מהכפר לאחו: היציאה הרגילה, בלי הבזק
  return k.startsWith('ws:')?wsGo(k.slice(3)):travelGo(k);
}
trWin.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.act==='close'){travelWin(false);sfx('ui')}else if(b.dataset.act==='tjump')travelJump(b.dataset.k)});

/* ---- במפת העולם (worldmap.js): כפתור אחד שפותח את החלון ---- */
function travelMapSpots(){}   // פעם נגיעה באי קפצה לפנס. עכשיו הכל דרך החלון
function travelMapRow(){return travelAny()?'<div class="trrow"><button class="vbtn trgo" data-act="trwin" style="--trc:'+C.gold+'">✨ '+T('tr.where')+'</button></div>':''}
$('wMap').addEventListener('click',e=>{const b=e.target.closest('[data-act="trwin"]');if(b)travelWin(true)});

/* ---- ליד פנס דולק בעולם: כפתור 🏮 שפותח את החלון ---- */
function travelUpdate(){
  const b=$('trBtn'),o=S.wd&&travelOf(S.wd.reg),on=!!o&&Math.hypot(P.x-o.L.x,P.y-o.L.y)<TRAVEL.near+P.r&&S.mode==='play';
  if(b.hidden===!on&&b.dataset.lang===LANG)return;
  b.hidden=!on;b.dataset.lang=LANG;if(on){b.style.setProperty('--trc',o.L.glow);b.innerHTML='<span class="ni" aria-hidden="true">🏮</span>'+T('ws.btn');b.setAttribute('aria-label',T('tr.where'))}
}
function travelOff(){$('trBtn').hidden=true;travelWin(false)}
$('trBtn').addEventListener('click',()=>{if(S.wd)travelWin(true)});
