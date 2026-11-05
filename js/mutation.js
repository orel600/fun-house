/* מוטציה יומית: כל יום נכנס לעולם הפתוח חוק אחר (game-design.md, "עולם דינמי". roadmap, משימה ט, 4.11.2026).
   החוק נבחר לפי התאריך, ולכן ניר ואוראל מקבלים אותו חוק באותו יום. היום קשה יותר, ולכן גם משלם יותר: XP ושלל.
   כל חוק הוא שורה ב-MUTATION.rules, ומשתמש במה שכבר יש: מצבים מ-dmg.js (רטוב, בוער), שילובים (skills.js, wcombo.js), המבוקש (wanted.js).
   חוקים "רעים" רק בגרסה רכה. רק בעולם הפתוח: בכפר ובזירה כלום לא משתנה.
   איחוד (ניר, 5.11: "תאחד אותם"): כאן גם האתגר היומי, שהיה פעם challenge.js. דבר יומי אחד: החוק של היום ומשימה אחת שלו
   (להפיל MUTATION.goal אויבים בעולם תחת החוק), באותו שבב ובאותו פס, עם פרס אחד שנאסף בכפר ביומן הקווסטים.
   לא מענישים על פספוס: מי שהשלים ולא אסף, הפרס מחכה לו גם מחר. נשמר ב-SAVE.challenge (אותו מפתח כמו פעם, אז שמירה ישנה ממשיכה):
   {day, n:כמה הריגות היום, got:היום שבו נאסף הפרס, owed:פרס מיום קודם שמחכה}.
   השמות chOpen, chDay, chSave, chDone, chCan, challengeCard ו-challengeClaim נשארו, כי guide.js, quests.js ו-hunt.js קוראים להם.
   החיבורים: mutEnter ו-mutUpdate ב-worldUpdate/enterWorld, mutN ו-mutSpawn ב-wSpawn, mutK('regen') בריפוי, mutDraw ב-drawWorld (world.js),
   mutKill ב-kill (combat.js), mutSpawn גם באירועים (pacing.js), challengeCard ביומן (quests.js), mutLine בחלון "בזמן שלא היית" (welcome.js). שבב קבוע ליד המטבעות בפס העליון (#mutChip) מציג שוב את הפס בנגיעה.
   הטקסטים ב-lang.js תחת 'mut.', והמשימה תחת 'ch.' */
const MUTATION={
  after:'earth',            // נפתח אחרי פנס האדמה (SAVE.story). לפני זה העולם רגיל (המבקר, 2.11: "שחקן ברמה 1 רואה רק אויבים מיוחדים")
  goal:30,                  // המשימה של היום: כמה הריגות בעולם תחת החוק
  reward:{coins:60,iron:4,essence:2},   // הפרס האחד של היום, למשאבים ב-RES. נאסף בכפר
  bar:{delay:0.8,dur:4.5},  // הפס בכניסה לעולם: אחרי כמה שניות, וכמה זמן הוא נשאר
  rewet:1.2,                // גשם: כמה שניות אחרי שהרטיבות נוצלה (חשמול, קיפאון) האויב רטוב שוב
  ignite:{k:0.05,t:2},      // יום אש: כל מכה מדליקה. 5% מהחיים של האויב לאורך 2 שניות
  // ערפל: שקוף עד clear מחצי האלכסון של המסך, ומשם מתעבה בעדינות עד a בקצה. אפרפר-כחלחל ולא לבן, כדי שאויבים ייראו מתוכו
  // (ניר, 4.11: "כמו ערפל לבן במסך, לא ברור לי מה זה". היה רדיוס קבוע 250 ו-0.78 לבן, שכיסה כמעט את כל המסך בטלפון)
  fog:{clear:0.32,a:0.45,col:'118,134,156'},
  /* החוקים. בכל חוק: icon, xp (פי כמה XP מכל הריגה), loot (הסיכוי להגרלה נוספת של השלל בכל הריגה).
     האויב כשהוא מופיע: hp, dmg, speed, r פי כמה. n: פי כמה אויבים בכל להקה. mult: {סוג נזק: פי כמה}.
     split: אויב שנופל מתפצל ל-n קטנים (hp ו-r שלהם ביחס אליו). wet: כולם רטובים. ignite: כל מכה מדליקה.
     coins: מטבעות כפולים (עוד הגרלה של המטבעות בלבד). fog: רואים פחות רחוק. wanted: המבוקש מגיע פי כמה מהר. regen: פי כמה ריפוי.
     affix: כל אויב מקבל תכונה מיוחדת (affix.js) */
  rules:{
    split: {icon:'🧬',split:{n:2,hp:0.3,r:0.7},xp:1.5,loot:0.3},
    fire:  {icon:'🔥',mult:{fire:1.5},ignite:true,xp:1.3,loot:0.3},
    rain:  {icon:'🌧️',wet:true,mult:{lightning:1.3},xp:1.3,loot:0.3},
    giants:{icon:'🗿',n:0.6,hp:1.8,r:1.35,xp:1.6,loot:0.5},
    gold:  {icon:'💰',coins:true,speed:1.2,xp:1.3,loot:0.2},
    fog:   {icon:'🌫️',fog:true,xp:1.4,loot:0.4},
    wanted:{icon:'🎯',wanted:3,xp:1.3,loot:0.3},
    thirst:{icon:'🩸',regen:0.4,xp:1.5,loot:0.4},     // "אין ריפוי" בגרסה רכה: הריפוי בעולם איטי יותר, לא נעלם
    swarm: {icon:'🐜',n:1.5,hp:0.55,r:0.8,xp:1.3,loot:0.3},
    frost: {icon:'❄️',mult:{ice:1.5},speed:0.85,xp:1.2,loot:0.2},
    swift: {icon:'💨',speed:1.4,xp:1.3,loot:0.6},       // מהאתגר היומי: כולם מהירים, ושלל רב
    elite: {icon:'👑',affix:true,xp:1.4,loot:0.4},      // מהאתגר היומי: אויבים מיוחדים בכל מקום
    glass: {icon:'🔮',hp:0.5,dmg:1.8,xp:1.2,loot:0.3}   // מהאתגר היומי: נופלים מהר, אבל מכים חזק
  }
};
const MUT={force:null,xpAcc:0,bar:null,hide:0};   // force: חוק קבוע (לבוט). xpAcc: שברי XP שמצטברים. bar: החוק שהפס מציג עכשיו

const mutDay=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
const mutOpen=()=>!!(SAVE.story&&SAVE.story[MUTATION.after]);
// החוק של התאריך: אותו חוק לכולם. day: לבדיקה בבוט
function mutRule(day=mutDay()){
  if(MUT.force)return MUT.force;
  let h=0x9e37;for(const c of day)h=(h*37+c.charCodeAt(0))>>>0;
  const ids=Object.keys(MUTATION.rules);return ids[h%ids.length];
}

/* ---- המשימה של היום (היה challenge.js) ---- */
const chOpen=mutOpen,chDay=mutDay;
// השמירה. יום חדש מאפס את ההתקדמות, ופרס שהושלם ולא נאסף נשמר כ-owed
function chSave(day=mutDay()){
  const c=SAVE.challenge||(SAVE.challenge={day,n:0,got:'',owed:false});
  if(c.day!==day){if(c.n>=MUTATION.goal&&c.got!==c.day)c.owed=true;c.day=day;c.n=0}
  return c;
}
const chDone=()=>!mutOpen()||chSave().n>=MUTATION.goal;   // סגור או הושלם: אין מה להציע (guide.js)
const chCan=()=>{if(!mutOpen())return false;const c=chSave();return c.owed||c.n>=MUTATION.goal&&c.got!==c.day};
// לוקחים את הפרס (בכפר). מחזיר true אם נאסף
function challengeClaim(){
  if(!S.vil||!chCan())return false;
  const c=chSave();
  if(c.owed)c.owed=false;else c.got=c.day;
  for(const r in MUTATION.reward)bagAdd(r,MUTATION.reward[r]);
  saveNow();celebrate(P.x,P.y-10,'quest',MUTATION.rules[mutRule()].icon);
  banner(T('ch.claimed'),C.gold);return true;
}
// הכרטיס ביומן הקווסטים (questLog ב-quests.js): החוק, המשימה והפרס
function challengeCard(){
  if(!mutOpen())return'';
  const c=chSave(),id=mutRule(),R=MUTATION.rules[id],[name,say]=T('mut.r.'+id),can=chCan();
  let h='<h4>'+R.icon+' '+T('ch.title')+'</h4><div class="qc chc'+(can?' ready':'')+'"><b>'+name+'</b><small>'+T('ch.sub')+'</small><p class="say">'+say+' · '+T('mut.bonus',R.xp)+'</p>';
  h+='<ul><li>'+T('ch.goal',MUTATION.goal)+' <em>'+Math.min(c.n,MUTATION.goal)+'/'+MUTATION.goal+'</em></li></ul>';
  h+='<div class="qrow"><div class="cost">'+qRewardLine(MUTATION.reward)+'</div>';
  if(can)h+=S.vil?'<button class="vbtn" data-act="chClaim">'+T('q.claim')+'</button>':'<p class="next">'+T('ch.home')+'</p>';
  else if(c.got===c.day)h+='<p class="next">'+T('q.doneToday')+'</p>';
  return h+'</div></div>';
}
$('qLog').addEventListener('click',e=>{const b=e.target.closest('[data-act="chClaim"]');if(b&&challengeClaim())questLog()});
// ההתקדמות: מספר קטן על השבב, וטקסט ב-#chTag (מוסתר בפס העליון, ומוצג במפה ב-worldmap.js)
const mutProg=()=>{const c=chSave();return c.n>=MUTATION.goal?'✓':Math.min(c.n,MUTATION.goal)+'/'+MUTATION.goal};
function mutHud(){
  const R=mutNow(),tag=$('chTag'),b=$('mutChip');
  if(tag){tag.hidden=!R;if(R)tag.textContent=R.icon+' '+mutProg()}
  if(b&&R){const p=b.querySelector('.mprog');if(p)p.textContent=mutProg()}
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
  if(R.affix&&!e.affix){const ids=Object.keys(AFFIX.list);affixSet(e,ids[Math.floor(Math.random()*ids.length)])}
  if(R.mult){const m=Object.assign({},e.mult);for(const t in R.mult)m[t]=(m[t]??1)*R.mult[t];e.mult=m}   // עותק: המכפילים של הסוג משותפים לכל האויבים מהסוג
}
// אויב שנפל (kill ב-combat.js): נספר למשימה, פרס מוגדל, ומתפצלים
function mutKill(e){
  const R=mutNow();if(!R||e.node||e.isBoss||e.dummy)return;
  if(e.mut&&!e.mutKid){const c=chSave();if(c.n<MUTATION.goal){c.n++;if(c.n===MUTATION.goal){banner(T('ch.done'),C.gold);celebrate(P.x,P.y-10,'quest',R.icon);saveNow()}mutHud()}}
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
  if(R.fog){const F=MUTATION.fog,big=3000,cx=P.x,cy=P.y-20,hd=Math.hypot(W,H)/2;ctx.save();   // W,H: כמה מהעולם רואים (core.js), אז הערפל באותו גודל בכל מסך וזום
    const g=ctx.createRadialGradient(cx,cy,hd*F.clear,cx,cy,hd);g.addColorStop(0,'rgba('+F.col+',0)');g.addColorStop(0.5,'rgba('+F.col+','+F.a*0.45+')');g.addColorStop(1,'rgba('+F.col+','+F.a+')');
    ctx.fillStyle=g;ctx.fillRect(cx-big,cy-big,big*2,big*2);ctx.restore()}
}

/* ---- הפס בכניסה לעולם: אותו פס דק של פגישה ראשונה (foelore.js), מתחתיו ---- */
const mutName=(id=mutRule())=>T('mut.r.'+id)[0];
const mutText=(id=mutRule())=>{const R=MUTATION.rules[id];return R.icon+' '+mutName(id)+' · '+T('mut.r.'+id)[1]};
function mutBarEl(){let el=$('mutBar');if(!el){el=document.createElement('div');el.id='mutBar';el.className='mutbar';el.hidden=true;document.body.appendChild(el)}return el}
// הפס: שם החוק, מה הוא עושה והבונוס. בכניסה לעולם, ושוב בכל נגיעה בשבב (mutChip)
function mutShowBar(){
  if(!S.wd||!mutNow())return;
  const id=mutRule(),R=MUTATION.rules[id],el=mutBarEl();clearTimeout(MUT.hide);
  el.innerHTML='<span class="mpic">'+R.icon+'</span><div><b><small>'+T('mut.today')+'</small> '+mutName(id)+' · 🎯 '+mutProg()+'</b><p>'+T('mut.r.'+id)[1]+' · '+T('mut.bonus',R.xp)+'</p></div>';
  el.hidden=false;void el.offsetWidth;el.classList.add('on');MUT.bar=id;
  MUT.hide=setTimeout(()=>{el.classList.remove('on');MUT.bar=null},MUTATION.bar.dur*1000);
}
/* השבב הקבוע בפס העליון של העולם, ליד המטבעות: אייקון החוק של היום. נגיעה מציגה שוב את הפס (ניר, 4.11: בלי זה לא ברור מה קורה) */
function mutChipEl(){
  let b=$('mutChip');if(b)return b;
  b=document.createElement('button');b.id='mutChip';b.className='mutchip';b.hidden=true;
  b.onclick=e=>{e.stopPropagation();mutShowBar();if(typeof sfx==='function')sfx('ui')};
  const hud=$('whud'),bag=$('wBag');if(hud)hud.insertBefore(b,bag||null);return b;
}
function mutEnter(){
  MUT.bar=null;clearTimeout(MUT.hide);const el=mutBarEl();el.classList.remove('on');el.hidden=true;
  const R=mutNow(),b=mutChipEl();b.hidden=!R;
  if(!R){mutHud();return}
  const id=mutRule();b.innerHTML=R.icon+'<span class="mprog"></span>';mutHud();b.setAttribute('aria-label',T('mut.today')+' '+mutName(id));
  setTimeout(()=>{if(S.wd&&S.mode==='play'&&mutRule()===id)mutShowBar()},MUTATION.bar.delay*1000);
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
  '.mutchip{pointer-events:auto;cursor:pointer;flex:none;width:30px;height:30px;padding:0;border-radius:50%;font-size:17px;line-height:1;'+
  'background:linear-gradient(#4A3322,#2C1E14);border:1.5px solid #C9A24A;box-shadow:0 2px 5px #0008;display:flex;align-items:center;justify-content:center;position:relative}'+
  '.mutchip .mprog{position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);padding:0 3px;border-radius:6px;background:#2C1E14;border:1px solid #C9A24A;color:#F4C74F;font:700 8px Heebo,system-ui,sans-serif;line-height:11px;white-space:nowrap}'+
  '.mutchip[hidden]{display:none}'+
  '.welmut{margin:6px 0 0;font-size:12px;color:#C9A24A;text-align:center}';
  document.head.appendChild(st)})();
