/* מוטציה יומית: כל יום נכנס לעולם הפתוח חוק אחר (game-design.md, "עולם דינמי". roadmap, משימה ט, 4.11.2026).
   החוק נבחר לפי התאריך, ולכן ניר והאחיינים מקבלים אותו חוק באותו יום. היום קשה יותר, ולכן גם משלם יותר: XP ושלל.
   כל חוק הוא שורה ב-MUTATION.rules, ומשתמש במה שכבר יש: מצבים מ-dmg.js (רטוב, בוער), שילובים (skills.js, wcombo.js), המבוקש (wanted.js).
   חוקים "רעים" רק בגרסה רכה, כי ילדים משחקים. רק בעולם הפתוח: בכפר ובזירה כלום לא משתנה.
   שונה מהאתגר היומי (challenge.js): האתגר הוא מטרה עם פרס ביומן, והמוטציה היא מזג האוויר של העולם. ביום שהאתגר כבר עושה
   את אותו דבר (dup), המוטציה עוברת לחוק הבא, כדי ששני החוקים לא יוכפלו.
   החיבורים: mutEnter ו-mutUpdate ב-worldUpdate/enterWorld, mutN ו-mutSpawn ב-wSpawn, mutK('regen') בריפוי, mutDraw ב-drawWorld (world.js),
   mutKill ב-kill (combat.js), mutLine בחלון "בזמן שלא היית" (welcome.js). הטקסטים ב-lang.js תחת 'mut.' */
const MUTATION={
  after:'earth',            // נפתח עם האתגר היומי, אחרי פנס האדמה (SAVE.story). לפני זה העולם רגיל
  bar:{delay:0.8,dur:4.5},  // הפס בכניסה לעולם: אחרי כמה שניות, וכמה זמן הוא נשאר
  rewet:1.2,                // גשם: כמה שניות אחרי שהרטיבות נוצלה (חשמול, קיפאון) האויב רטוב שוב
  ignite:{k:0.05,t:2},      // יום אש: כל מכה מדליקה. 5% מהחיים של האויב לאורך 2 שניות
  fog:{r:250,a:0.78,col:'200,212,224'},   // ערפל: רדיוס הראייה סביב הגיבור, וכמה אטום מעבר לו
  /* החוקים. בכל חוק: icon, xp (פי כמה XP מכל הריגה), loot (הסיכוי להגרלה נוספת של השלל בכל הריגה).
     האויב כשהוא מופיע: hp, dmg, speed, r פי כמה. n: פי כמה אויבים בכל להקה. mult: {סוג נזק: פי כמה}.
     split: אויב שנופל מתפצל ל-n קטנים (hp ו-r שלהם ביחס אליו). wet: כולם רטובים. ignite: כל מכה מדליקה.
     coins: מטבעות כפולים (עוד הגרלה של המטבעות בלבד). fog: רואים פחות רחוק. wanted: המבוקש מגיע פי כמה מהר. regen: פי כמה ריפוי.
     dup: החוק של האתגר היומי שעושה אותו דבר */
  rules:{
    split: {icon:'🧬',split:{n:2,hp:0.3,r:0.7},xp:1.5,loot:0.3},
    fire:  {icon:'🔥',mult:{fire:1.5},ignite:true,xp:1.3,loot:0.3,dup:'fire'},
    rain:  {icon:'🌧️',wet:true,mult:{lightning:1.3},xp:1.3,loot:0.3,dup:'storm'},
    giants:{icon:'🗿',n:0.6,hp:1.8,r:1.35,xp:1.6,loot:0.5,dup:'giants'},
    gold:  {icon:'💰',coins:true,speed:1.2,xp:1.3,loot:0.2,dup:'gold'},
    fog:   {icon:'🌫️',fog:true,xp:1.4,loot:0.4},
    wanted:{icon:'🎯',wanted:3,xp:1.3,loot:0.3},
    thirst:{icon:'🩸',regen:0.4,xp:1.5,loot:0.4},     // "אין ריפוי" בגרסה רכה: הריפוי בעולם איטי יותר, לא נעלם
    swarm: {icon:'🐜',n:1.5,hp:0.55,r:0.8,xp:1.3,loot:0.3},
    frost: {icon:'❄️',mult:{ice:1.5},speed:0.85,xp:1.2,loot:0.2}
  }
};
const MUT={force:null,xpAcc:0,bar:null};   // force: חוק קבוע (לבוט). xpAcc: שברי XP שמצטברים. bar: החוק שהפס מציג עכשיו

const mutDay=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
const mutOpen=()=>!!(SAVE.story&&SAVE.story[MUTATION.after]);
// החוק של התאריך: אותו חוק לכולם. day: לבדיקה בבוט. ביום שהאתגר עושה אותו דבר, החוק הבא ברשימה
function mutRule(day=mutDay()){
  if(MUT.force)return MUT.force;
  let h=0x9e37;for(const c of day)h=(h*37+c.charCodeAt(0))>>>0;
  const ids=Object.keys(MUTATION.rules);let i=h%ids.length;
  const ch=typeof chRule==='function'&&typeof chOpen==='function'&&chOpen()?chRule(day):null;
  if(ch&&MUTATION.rules[ids[i]].dup===ch)i=(i+1)%ids.length;
  return ids[i];
}
// החוק שפועל עכשיו, או null: רק בעולם, לא בחדר בונוס, ורק אחרי שנפתח
const mutNow=()=>S&&S.wd&&!S.room&&mutOpen()?MUTATION.rules[mutRule()]:null;
// מכפיל של שדה בחוק של היום (1 אם אין). למשל mutK('regen')
const mutK=k=>{const R=mutNow();return R&&R[k]!=null?R[k]:1};
// כמה אויבים בלהקה (wSpawn): לפחות אחד
const mutN=n=>{const R=mutNow();return R&&R.n?Math.max(1,Math.round(n*R.n)):n};

// אויב שמופיע בעולם (wSpawn ב-world.js)
function mutSpawn(e){
  const R=mutNow();if(!R||e.creature)return;e.mut=1;
  if(R.hp){e.hp*=R.hp;e.max*=R.hp}
  if(R.speed)e.speed*=R.speed;
  if(R.r)e.r*=R.r;
  if(R.dmg)e.dmg*=R.dmg;
  if(R.mult){const m=Object.assign({},e.mult);for(const t in R.mult)m[t]=(m[t]??1)*R.mult[t];e.mult=m}   // עותק: המכפילים של הסוג משותפים לכל האויבים מהסוג
}
// אויב שנפל (kill ב-combat.js): פרס מוגדל, ומתפצלים
function mutKill(e){
  const R=mutNow();if(!R||e.node||e.isBoss||e.dummy)return;
  if(R.xp>1&&SAVE.hero){MUT.xpAcc+=(e.xp||1)*STATS.xp.kill*(R.xp-1);const n=Math.floor(MUT.xpAcc);if(n>0){MUT.xpAcc-=n;SAVE.hero.xp=(SAVE.hero.xp||0)+n;rankSync()}}
  if(R.loot&&Math.random()<R.loot)runGive(dropTable(e),e.x,e.y);
  if(R.coins){const D=dropTable(e);if(D&&D.coins)runGive({coins:D.coins},e.x,e.y)}
  if(R.split&&e.mut&&!e.mutKid&&!e.wanted&&!e.hunt&&ETYPES[e.type]){
    const sp=R.split;
    for(let i=0;i<sp.n;i++){const a=i/sp.n*Math.PI*2+rand(-0.4,0.4),k=addEnemy(e.type,e.x+Math.cos(a)*e.r,e.y+Math.sin(a)*e.r,1);
      k.hp=k.max=Math.max(1,e.max*sp.hp);k.r=e.r*sp.r;k.dmg=e.dmg*0.6;k.speed=e.speed;k.home=e.home;k.zone=e.zone;k.xp=0;k.elite=false;
      k.mut=1;k.mutKid=1;k.kx=Math.cos(a)*160;k.ky=Math.sin(a)*160;MUT.splits=(MUT.splits||0)+1}
    sparks(e.x,e.y,'#9BE37A',14,200);
  }
}
// כל פריים בעולם (worldUpdate)
function mutUpdate(dt){
  const R=mutNow();if(!R)return;
  if(R.wet||R.ignite)for(const e of enemies){if(e.dead||!e.mut)continue;
    if(R.wet&&!(e.wet>0)){e.mw=(e.mw??0)-dt;if(e.mw<=0){e.wet=3;e.mw=MUTATION.rewet}}
    if(R.ignite&&e.flash>0.06&&!e.burn){const I=MUTATION.ignite;e.burn={dps:e.max*I.k/I.t,t:I.t,tick:0.5,acc:0}}}
  if(R.wanted&&S.wn&&!S.wn.e&&!S.wn.rumor)S.wn.t-=dt*(R.wanted-1);
}
// מעל העולם (drawWorld): גשם וערפל
function mutDraw(){
  const R=mutNow();if(!R)return;
  if(R.wet&&!WR().storm&&typeof wStorm==='function')wStorm();   // אותו גשם של מגדלי הסערה
  if(R.fog){const F=MUTATION.fog,big=3000,cx=P.x,cy=P.y-20;ctx.save();
    const g=ctx.createRadialGradient(cx,cy,F.r*0.4,cx,cy,F.r);g.addColorStop(0,'rgba('+F.col+',0)');g.addColorStop(1,'rgba('+F.col+','+F.a+')');
    ctx.fillStyle=g;ctx.fillRect(cx-big,cy-big,big*2,big*2);ctx.restore()}
}

/* ---- הפס בכניסה לעולם: אותו פס דק של פגישה ראשונה (foelore.js), מתחתיו ---- */
const mutName=(id=mutRule())=>T('mut.r.'+id)[0];
const mutText=(id=mutRule())=>{const R=MUTATION.rules[id];return R.icon+' '+mutName(id)+' · '+T('mut.r.'+id)[1]};
function mutBarEl(){let el=$('mutBar');if(!el){el=document.createElement('div');el.id='mutBar';el.className='mutbar';el.hidden=true;document.body.appendChild(el)}return el}
function mutEnter(){
  MUT.bar=null;const el=mutBarEl();el.classList.remove('on');el.hidden=true;
  if(!mutNow())return;
  const id=mutRule(),R=MUTATION.rules[id];
  setTimeout(()=>{if(!S.wd||S.mode!=='play'||mutRule()!==id)return;
    el.innerHTML='<span class="mpic">'+R.icon+'</span><div><b><small>'+T('mut.today')+'</small> '+mutName(id)+'</b><p>'+T('mut.r.'+id)[1]+' · '+T('mut.bonus',R.xp)+'</p></div>';
    el.hidden=false;void el.offsetWidth;el.classList.add('on');MUT.bar=id;
    setTimeout(()=>{el.classList.remove('on');MUT.bar=null},MUTATION.bar.dur*1000)},MUTATION.bar.delay*1000);
}
// שורה בחלון "בזמן שלא היית" (welcome.js): מה מחכה היום בעולם
const mutLine=()=>mutOpen()?'<p class="welmut">'+T('mut.wel')+' '+mutText()+' · '+T('mut.bonus',MUTATION.rules[mutRule()].xp)+'</p>':'';

(function(){const st=document.createElement('style');st.textContent=
  '.mutbar{position:fixed;top:calc(env(safe-area-inset-top,0px) + 92px);left:50%;transform:translate(-50%,-10px);opacity:0;transition:opacity .25s,transform .25s;z-index:40;pointer-events:none;'+
  'display:flex;gap:8px;align-items:center;width:max-content;max-width:min(340px,40vw);padding:3px 12px 3px 10px;border-radius:10px;'+
  'background:linear-gradient(#4A3322e6,#2C1E14e6);border:1.5px solid #C9A24A;box-shadow:inset 0 1px 0 #ffffff1a,0 3px 8px #0008;color:#EDE8DA;font:400 11px Heebo,system-ui,sans-serif;text-align:start}'+
  '.mutbar.on{opacity:1;transform:translate(-50%,0)}.mutbar .mpic{font-size:20px;line-height:1;flex:none}.mutbar div{min-width:0}'+
  '.mutbar b{display:block;font-size:13px;color:#F4C74F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mutbar small{color:#C9A24A;font-weight:700;font-size:10px}'+
  '.mutbar p{margin:0;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
  '.welmut{margin:6px 0 0;font-size:12px;color:#C9A24A;text-align:center}';
  document.head.appendChild(st)})();
