/* XP, שדרוגים, מסכי בוס וסוף */
function gainXP(v){P.xp+=v;S.xpRun=(S.xpRun||0)+v;sfx('xp');showGain(v);while(P.xp>=P.next){P.xp-=P.next;P.level++;P.next=Math.round(6+P.level*4.5);S.pendingLv++}}
/* כמה אספת: מספר אחד מעל הראש שגדל כל עוד אוספים ברצף, במקום מספר לכל יהלום */
function showGain(v){
  let f=S.gain;
  if(!f||f.life<0.2||!floats.includes(f)){f=S.gain={x:0,y:0,txt:'',col:C.gold,size:17,life:0,vy:-30,n:0};floats.push(f)}
  f.n+=v;f.txt='+'+f.n;f.life=0.9;f.x=P.x;f.y=P.y-46;
}
function openLevelUp(){
  S.mode='level';S.pendingLv--;joy=null;sfx('levelup');
  // שדרוג של סוג נזק לא מוצע אם לנשק כבר יש את הסוג הזה. שדרוג לנשק מוצע רק אם הוא ביד, והחלפה זריזה רק כשיש מה להחליף
  const uses=wHeld().map(wUse).concat(P.weapon);
  const pool=UPS.filter(u=>!(u.max&&(S.picks[u.id]||0)>=u.max)&&!(u.el&&P.dt[u.w]===u.el)&&(u.w==='any'||uses.includes(u.w))&&!(u.id==='swap'&&wHeld().length<2)&&!(u.sk&&!skillCan(u.sk))).sort(()=>Math.random()-.5).slice(0,3);
  $('lvTitle').textContent=T('level',P.level);
  const box=$('cards');box.innerHTML='';
  pool.forEach(u=>{
    const b=document.createElement('button');b.className='card upc rar rar-'+(u.rar||'wood');   // upc: כרטיס שדרוג עם אייקון ומסגרת נדירות (css/rarity.css)
    // הצבע של הכרטיס: סוג הנזק שהוא נותן, או סוג הנזק של הנשק שהוא משפר
    if(u.w!=='any')b.style.setProperty('--dt',dtCol(u.el||P.dt[u.w]));if(u.el){b.dataset.el=u.el;b.dataset.w=u.w}
    const sk=u.sk&&SKILLS.list[u.sk].dt;if(sk){b.style.setProperty('--dt',dtCol(sk));b.dataset.sk=u.sk}   // סקיל: בצבע סוג הנזק שלו
    // לקסם יש טקסט משלו ('up.gdmg.bolt'), כדי שהקוסם לא יקרא על חצים
    const shot=u.w==='gun'&&wNow().shot,[name,desc]=T(TEXT['up.'+u.id+'.'+shot]?'up.'+u.id+'.'+shot:'up.'+u.id);
    // אייקון (gicons.js, GICO.up) בצבע סוג הנזק של הכרטיס, ובלי סוג: בצבע הנדירות. הטקסט בטור משלו
    const ico=typeof gUp==='function'?gUp(u):'';
    b.innerHTML=(ico?'<span class="uico">'+ico+'</span>':'')+'<span class="utxt"><span class="tag">'+(sk?T('sk.tag'):u.w==='any'?T('w.any'):wLabel(u.w))+(u.el||sk?' '+dtSvg(u.el||sk):'')+'</span><b>'+name+'</b><span>'+desc+'</span></span>';
    b.onclick=()=>{if(u.el){P.dt[u.w]=u.el;updateSwapBtn()}else u.f();sfx('celebrate');S.picks[u.id]=(S.picks[u.id]||0)+1;upCelebrate(b,u);$('ovLevel').hidden=true;S.mode='play';if(S.pendingLv>0)openLevelUp()};
    box.appendChild(b);
  });
  $('ovLevel').hidden=false;
}
// חגיגה קטנה במקום הכרטיס שנבחר (fxui.js, מעל החלונות): לפי הנדירות. "פחות אפקטים" מכבה אותה. UP_FX: נדירות -> גיליון
const UP_FX={gold:'ui_epic',legend:'ui_legend',other:'ui_juice',size:150};
function upCelebrate(b,u){
  if(typeof fxDom!=='function'||(typeof SAVE==='object'&&SAVE.fxLess))return;
  const r=b.getBoundingClientRect(),id=UP_FX[u.rar]||UP_FX.other;
  fxDom(id,r.left+r.width/2,r.top+r.height/2,{tap:true,size:UP_FX.size,add:true});   // tap: מנגן גם כשחלון פתוח (החלון נסגר מיד אחרי)
  UP_FX.last=id;   // לבוט (check.js)
}
function showIntro(b){
  S.mode='intro';joy=null;sfx('bossIn');
  $('bTitle').innerHTML=b.name+'<br><span style="font-size:20px;color:var(--lilac)">'+b.title+'</span>';
  $('bLearned').innerHTML=b.learned.map(s=>'<span>'+s+'</span>').join('');
  $('bPats').innerHTML=b.pats.map(k=>'<span class="chip">'+T('pat.'+k)+'</span>').join('')+'<span class="chip" style="color:var(--dim)">'+T('secretAttack')+'</span><span class="chip" style="color:var(--blood)">'+T('hatesRunning')+'</span>';
  $('bWeak').innerHTML=T('weakSpot',dtCol(b.weak),dtSvg(b.weak)+T('dt.'+b.weak));
  $('ovBoss').hidden=false;
}
function gameOver(){
  if(S.wd){worldDeath();return}   // מוות בעולם הפתוח: מאבדים חצי מהמשאבים וקמים בכפר (world.js)
  S.mode='over';joy=null;
  runEnd();   // השלל עובר לתרמיל (village.js)
  gearLoot();   // לפעמים גם פריט ציוד (gear.js)
  if(S.t>best){best=S.t;try{localStorage.setItem('zm-best',String(best))}catch(e){}}
  $('sTime').textContent=fmt(S.t);$('sLvl').textContent=P.level;$('sBoss').textContent=S.bossCount;$('sBest').textContent=fmt(best);$('sCoins').textContent=S.bn.coins;$('sPicks').textContent=S.bn.taken;
  $('ovOver').classList.toggle('won',!!S.won);   // סמל הכותרת: 🏆 או 💀 (style.css)
  setTimeout(()=>{$('ovOver').hidden=false},700);
}
let banT=null;
// בזירה (לא בכפר, בעולם או במשחקי השאול) ההודעה עולה לפס קטן מתחת ל-HUD, כדי לא לכסות את הגיבור (.banner.artop ב-style.css)
// בזירה ההודעה יושבת מתחת לפס הכי נמוך ב-HUD (גם פס הבוס). נקרא גם מ-hud() בכל פריים, כי פס הבוס מופיע רגע אחרי ההודעה "הבוס הגיע"
function banTop(){const b=$('banner');if(!b.classList.contains('artop'))return;
  const bot=[document.querySelector('.hud'),$('bossbar'),$('runbar')].filter(e=>e&&!e.closest('[hidden]')&&e.getBoundingClientRect().height>0).reduce((m,e)=>Math.max(m,e.getBoundingClientRect().bottom),48),t=Math.round(bot+6)+'px';
  if(b.style.top!==t)b.style.top=t}
function banner(txt,col){if(typeof msgOn==='function'&&msgOn())return msgSay(txt,col);   // בעולם ובכפר: עמודת ההודעות (msglane.js)
  const b=$('banner'),bc=document.body.classList,ar=!['vil','world','mb'].some(c=>bc.contains(c));
  b.classList.toggle('artop',ar);if(ar)banTop();else b.style.top='';
  b.textContent=txt;b.style.color=col||C.chalk;b.classList.add('on');clearTimeout(banT);banT=setTimeout(()=>b.classList.remove('on'),1600)}
