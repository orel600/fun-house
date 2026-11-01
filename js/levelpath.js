/* מסלול רמות (docs/plan-progression.md, עמוד 2): מה נפתח בכל רמה, "הבא בתור", ורגע גדול כשעולים רמה.
   לא מחזיק נתונים משלו על מה נפתח: קורא מהטבלאות שכבר קיימות, כדי שכל שינוי שם יופיע כאן לבד:
     משבצות לחפצים מסתובבים: GEAR.slots.orbit (gear.js). נקודת סקיל: TREE.every (stats.js). קווסט דרגה: RANKS.every (ranks.js).
     ונקודת דמות בכל רמה (STATS.perLevel), שמופיעה רק בכרטיס ולא ב"הבא", כי היא תמיד.
   extra: אבני דרך נוספות לפי רמה, אם יהיו (רמה: [{icon,t:'מפתח ב-lang.js'}]). כרגע ריק.
   big: אילו סוגים הם "יעד גדול" (שורה שנייה בחלון הדמות). card: כמה שניות הכרטיס נשאר. flash: ההבזק במסך. cheer: כמה שניות הגיבור מריע.
   החיבור: lpLevelUp מ-rankSync (ranks.js), ו-lpHtml בחלון הדמות (statsHtml ב-stats.js). השמות ב-lang.js תחת 'lp.' */
const LEVELPATH={
  extra:{},
  big:['orbit','rank'],
  look:40,            // עד כמה רמות קדימה מחפשים
  card:{t:4.5},
  flash:{t:0.9,less:0.4},   // less: כמה חזק ההבזק כשבחרו "פחות אפקטים"
  cheer:1.3
};

// מה נפתח בדיוק ברמה lv (בלי נקודת הדמות שמגיעה בכל רמה)
function lpAt(lv){
  const out=[];
  GEAR.slots.orbit.forEach((l,i)=>{if(l===lv&&l>1)out.push({k:'orbit',icon:'🔮',txt:T('lp.orbit',i+1)})});
  if(lv>1&&(lv-1)%TREE.every===0)out.push({k:'tree',icon:'🌳',txt:T('lp.tree')});
  if(lv%RANKS.every===0)out.push({k:'rank',icon:'🎖️',txt:T('lp.rank')});
  for(const x of LEVELPATH.extra[lv]||[])out.push({k:'extra',icon:x.icon,txt:T(x.t)});
  return out;
}
// הרמה הבאה אחרי lv שבה נפתח משהו. big: רק יעד גדול
function lpNext(lv,big){
  for(let l=lv+1;l<=lv+LEVELPATH.look;l++){const it=lpAt(l).filter(x=>!big||LEVELPATH.big.includes(x.k));if(it.length)return {lv:l,items:it}}
  return null;
}
const lpLine=n=>T('lp.at',n.lv)+' '+n.items.map(x=>x.icon+' '+x.txt).join(' · ');

// בחלון הדמות, בתוך פס ה-XP (החלון בלי גלילה, אז בלי שורה נוספת): "הבא: רמה 5 🔮🌳", ויעד גדול אם הוא רחוק יותר.
// ההסבר המלא במילים ב-title של הפס (lpTitle)
function lpHtml(){
  const lv=heroLv(),n=lpNext(lv);if(!n)return '';
  const b=lpNext(lv,true),far=b&&b.lv!==n.lv,ic=x=>x.items.map(i=>i.icon).join('');
  return ' · <span class="lpnext"><b>'+T('lp.next')+'</b> '+T('lp.at',n.lv)+' '+ic(n)+(far?' <span class="lpbig">· '+T('lp.at',b.lv)+' '+ic(b)+'</span>':'')+'</span>';
}
function lpTitle(){const lv=heroLv(),n=lpNext(lv),b=lpNext(lv,true);if(!n)return '';
  return ' title="'+T('lp.next')+' '+lpLine(n)+(b&&b.lv!==n.lv?' · '+lpLine(b):'')+'"'}

/* ---- הרגע הגדול: הבזק, הגיבור מריע, וכרטיס של מה שנפתח ומה הבא ---- */
function lpLevelUp(from,lv){
  const got=[{icon:'⭐',txt:T('lp.pts',(lv-from)*STATS.perLevel)}];
  for(let l=from+1;l<=lv;l++)got.push(...lpAt(l));
  lpFlash();
  if(typeof R3D!=='undefined'&&R3D.on&&R3D.player&&(S.wd||S.vil))once(R3D.player,LOOK3D.player.anim.win,LEVELPATH.cheer);   // Cheering (render3d.js)
  sfx('levelup');
  let c=$('lpCard');
  if(!c){c=document.createElement('div');c.id='lpCard';c.className='lpcard';c.setAttribute('role','status');c.onclick=()=>{c.classList.remove('on')};document.body.appendChild(c)}
  const n=lpNext(lv);
  c.innerHTML='<h3>'+T('lp.up',lv)+'</h3><ul>'+got.map(x=>'<li><span>'+x.icon+'</span><bdi>'+x.txt+'</bdi></li>').join('')+'</ul>'+(n?'<p><b>'+T('lp.next')+'</b> <bdi>'+lpLine(n)+'</bdi></p>':'');
  c.classList.add('on');clearTimeout(lpLevelUp.t);lpLevelUp.t=setTimeout(()=>c.classList.remove('on'),LEVELPATH.card.t*1000);
}
function lpFlash(){
  let f=$('lpFlash');if(!f){f=document.createElement('div');f.id='lpFlash';f.className='lpflash';f.setAttribute('aria-hidden','true');document.body.appendChild(f)}
  f.style.setProperty('--k',fxLess()?LEVELPATH.flash.less:1);f.style.animationDuration=LEVELPATH.flash.t+'s';
  f.classList.remove('on');void f.offsetWidth;f.classList.add('on');
}
