/* חלון הקרדיטים (W7, אוראל 8.11.2026): כפתור "Credits" בחלון ההגדרות, שפותח חלון בתבנית הרגילה (.win, .whd, ✕)
   עם כל מקור חיצוני שבשימוש במשחק: שם, רישיון וקישור. המקור המלא: CREDITS.md בשורש הריפו.
   המשחק רץ מ-file://, ולכן התוכן הוא מחרוזות ב-lang.js (cr.*) ולא קריאה של הקובץ. הקישורים כאן, כי הם לא טקסט.
   מקור חדש = שורה ב-CREDITS.items, מפתח cr.<id> ב-lang.js, ופסקה ב-CREDITS.md. העיצוב ב-css/credits.css */
const CREDITS={
  // id: מפתח הטקסט cr.<id>. url: הקישור שמוצג (רק המארח). lic: קישור לרישיון, כשיש אחד כללי
  items:[
    {id:'mochi',  url:'https://mochilab-studio.itch.io/'},
    {id:'gicons', url:'https://game-icons.net', lic:'https://creativecommons.org/licenses/by/3.0/'},
    {id:'kaykit', url:'https://kaylousberg.itch.io/', lic:'https://creativecommons.org/publicdomain/zero/1.0/'},
    {id:'quat',   url:'https://quaternius.com', lic:'https://creativecommons.org/publicdomain/zero/1.0/'},
    {id:'claw',   url:'https://creativeclaw.co'},
    {id:'kenney', url:'https://kenney.nl', lic:'https://creativecommons.org/publicdomain/zero/1.0/'},
    {id:'fonts',  url:'https://fonts.google.com', lic:'https://openfontlicense.org/'},
    {id:'three',  url:'https://threejs.org', lic:'https://github.com/mrdoob/three.js/blob/dev/LICENSE'},
    {id:'own'},
  ],
  host:u=>u.replace(/^https?:\/\//,'').replace(/\/$/,'')
};

function creditsBuild(){
  if($('ovCredits'))return;
  const ov=document.createElement('div');ov.className='ov';ov.id='ovCredits';ov.hidden=true;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const link=(u,t)=>'<a href="'+esc(u)+'" target="_blank" rel="noopener">'+esc(t)+'</a>';
  ov.innerHTML='<div class="panel win crpanel">'+
    '<div class="whd"><h2>'+esc(T('cr.title'))+'</h2><button class="wx" id="crClose" aria-label="'+esc(T('gear.close'))+'">✕</button></div>'+
    '<p class="sub">'+esc(T('cr.intro'))+'</p>'+
    '<div class="crlist">'+CREDITS.items.map(it=>'<div class="critem"><p>'+esc(T('cr.'+it.id))+'</p>'+
      (it.url?link(it.url,CREDITS.host(it.url)):'')+(it.lic?' '+link(it.lic,T('cr.license')):'')+'</div>').join('')+'</div></div>';
  document.body.appendChild(ov);
  $('crClose').addEventListener('click',e=>{e.stopPropagation();creditsOpen(false)});
  let down=false;ov.addEventListener('pointerdown',e=>{down=e.target===ov});
  ov.addEventListener('click',e=>{if(down&&e.target===ov)creditsOpen(false);down=false});   // נגיעה בחוץ סוגרת, כמו שאר החלונות (ui.js)
}
function creditsOpen(on){
  creditsBuild();
  // נרשם ב-WINS (ui.js) בפעם הראשונה: Esc וכפתור "חזור" סוגרים אותו כמו כל חלון. ui.js נטען אחרי הקובץ הזה, ולכן לא בטעינה
  if(typeof WINS!=='undefined'&&!WINS.some(w=>w.id==='ovCredits'))WINS.unshift({id:'ovCredits',close:()=>creditsOpen(false)});
  $('ovCredits').hidden=!on;if(on)$('ovCredits').querySelector('.crpanel').scrollTop=0;
  if(typeof sfx==='function')sfx('ui');
}
// הכפתור בחלון ההגדרות: אחרי שורת הקרדיטים של האייקונים (index.html, .sub.credits)
{const p=document.querySelector('#ovSound .credits');
  if(p){const b=document.createElement('button');b.className='lang';b.id='crBtn';b.textContent=T('cr.btn');
    b.addEventListener('click',e=>{e.stopPropagation();creditsOpen(true)});p.after(b)}}
