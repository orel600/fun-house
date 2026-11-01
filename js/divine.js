/* ברק אלוהי (הרעיון של אוראל, ניר אישר, 30.10.2026): אחרי שני אויבי-על בריצה (בקרוב: הבוס) נשמר כפתור אחד, ומפעילים אותו מתי שרוצים.
   5 שניות: כל חמשת החפצים המסתובבים בכוח מלא (orbit.js, orbitTypes), וברקים קלים שנופלים על אויבים קרובים.
   הברקים הם אותו ציור של סקיל הברק (skLine ב-skills.js), ולכן אצל הנודד עם החליל הם חמשה עם תווים (flute.js).
   נעלם בסוף הריצה. הצבע תמיד של סוג הנזק: ברק. השמות ב-lang.js: 'dv.<מפתח>' */
const DIVINE={
  need:2,          // כמה אויבי-על צריך להפיל בריצה כדי לקבל אותו
  dur:5,           // כמה שניות
  strike:{every:0.45,dmg:2,range:340,pool:3},   // ברק כל כמה שניות, כמה נזק (כפול הנשק), טווח, ומתוך כמה האויבים הקרובים בוחרים
  ring:{gap:3,lines:5}   // טבעת דקה סביב הדמות בזמן הפעולה (אצל החליל: חמשה)
};
const divineOn=()=>!!S.dv&&S.dv.t>0&&skArena();
function divineReset(){S.dv={downs:0,ready:false,t:0,next:0,used:0,strikes:0}}
// נקרא מ-eliteDown (run.js)
function divineElite(){
  const d=S.dv;if(!d||++d.downs<DIVINE.need||d.ready||d.t>0||d.used)return;
  d.ready=true;floatText(P.x,P.y-50,T('dv.ready'),dtCol('lightning'),18,true);sfx('celebrate');
}
function divineUse(){
  const d=S.dv;if(!d||!d.ready||S.mode!=='play'||!skArena())return false;
  d.ready=false;d.t=DIVINE.dur;d.next=0;d.used++;S.shake=Math.max(S.shake,6);sfx('bossDown');
  floatText(P.x,P.y-50,T('dv.name'),dtCol('lightning'),22,false,true);return true;
}
function divineUpdate(dt){
  const d=S.dv;if(!d||d.t<=0)return;
  if(!skArena()){d.t=0;return}
  d.t=Math.max(0,d.t-dt);d.next-=dt;
  if(d.next>0)return;d.next=DIVINE.strike.every;
  const D=DIVINE.strike,near=enemies.filter(e=>!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<D.range)
    .sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y)).slice(0,D.pool);
  if(!near.length)return;
  const e=near[Math.floor(Math.random()*near.length)];
  skLine(P,e,dtCol('lightning'));d.strikes++;
  damage(e,skBase()*D.dmg,'skill',Math.atan2(e.y-P.y,e.x-P.x),'lightning');
}
// ציור: טבעת דקה ורכה סביב הדמות, שנעלמת בהדרגה. אצל החליל: חמישה קווים דקים
function drawDivine(){
  if(!divineOn())return;
  const R=DIVINE.ring,r=ORBIT.r+20,fl=fluteOn(),n=fl?R.lines:1,pulse=RM?0:Math.sin(S.t*6)*2;
  ctx.strokeStyle=dtCol('lightning');ctx.lineWidth=1.5;ctx.globalAlpha=Math.min(0.45,S.dv.t*0.45);
  for(let j=0;j<n;j++){ctx.beginPath();ctx.arc(P.x,P.y-8,r+pulse+(j-(n-1)/2)*R.gap,0,7);ctx.stroke()}
  ctx.globalAlpha=1;
}
/* ---- הכפתור: מעל הסקילים בצד ימין, רק כשמוכן או פועל. הטבעת שלו מתרוקנת בזמן הפעולה ---- */
function divineHud(){
  const b=$('divine'),d=S.dv,on=!!d&&skArena()&&S.mode==='play'&&(d.ready||d.t>0);
  b.hidden=!on;if(!on)return;
  if(!b.firstChild){b.innerHTML=dtSvg('lightning')+'<i></i>'}
  b.setAttribute('aria-label',T('dv.name'));
  const v=String(Math.round(20*(d.t>0?1-d.t/DIVINE.dur:0))/20);
  if(b.dataset.cd!==v){b.dataset.cd=v;b.style.setProperty('--cd',v)}
  b.classList.toggle('ready',d.ready);
}
$('divine').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();divineUse()});
$('divine').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();divineUse()}});
addEventListener('keydown',e=>{if(e.code==='Digit4'&&S&&S.dv&&e.target===document.body)divineUse()});
