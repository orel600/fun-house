/* בוס-נמסיס בעולם (משימה ח ב"התוכנית הבאה", 4.11.2026. מהחזון ב-game-design.md, "עולם דינמי": "בוס שהפיל אותך חוזר בריצה הבאה, חזק יותר וזוכר אותך").
   בעלילה (docs/story.md): כל אחד מהם הוא עוד חלק מהצל שלומד.
   1. אויב עלית (עם תכונה, מנהיג להקה, champ) או בוס שהרג אותך בעולם נהיה נמסיס: שם אישי (flPersonal ב-foelore.js), דרגה, ונשמר ב-SAVE.nem.
   2. בכניסה הבאה לאותו אזור הוא שם: חזק יותר בכל ניצחון שלו (עד rankMax), עם פס דק למעלה ושורה שזוכרת אותך:
      כמה חיים היו לך כשברחת ממנו, כמה פעמים הוא ניצח, או מה הפיל אותך (הפיצוץ שלו, המכות, הקליעים).
   3. מנצחים אותו: חגיגה, חפץ באיכות הכי גבוהה וקרן בוס, והוא עובר לרשימת "ניצחת" בספר ההרפתקאות.
   נמסיס אחד בכל אזור, ולכל היותר max בסך הכל. בלי עונש נוסף על המוות הרגיל.
   החיבור: nemOnDeath ב-worldDeath, nemEnter ב-enterWorld, nemUpdate ב-worldUpdate (world.js), ו-nemBookHtml ב-bookDraw (book.js).
   הבוס שלומד (boss.js) של הזירה לא משתנה. הטקסטים ב-lang.js תחת 'nem.' */
const NEMESIS={
  max:3, rankMax:5,                        // כמה נמסיסים פעילים לכל היותר, ועד איזו דרגה הוא עולה
  hp:4, dmg:1.2, r:1.35, speed:1.05,       // פי כמה מאויב רגיל באותה להקה, בדרגה 1
  grow:{hp:0.3, dmg:0.08},                 // כל דרגה נוספת: עוד 30% חיים ו-8% נזק (בדרגה 5: פי 8.8 חיים, פי 1.58 נזק)
  near:300,                                // כמה קרוב אויב צריך להיות כדי שייחשב מי שהפיל אותך
  melee:90,                                // קרוב מזה: "המכות שלי", רחוק מזה: "הקליעים שלי"
  meet:1.2,                                // מתקרבים עד WORLD.aggro כפול זה: הוא אומר את השורה שלו
  loot:{coins:[1,60], horn:[1,1]},         // שלל קבוע, ועוד coinsRank מטבעות לכל דרגה
  coinsRank:30,
  gear:{rolls:3, q:110},                   // חפץ אחד בשכבה טובה, באיכות הכי גבוהה (itemroll.js)
  won:12,                                  // כמה מנוצחים נשמרים לספר
  card:{dur:4.5},                          // שניות שהפס למעלה נשאר
  icon:'👁️', col:'#B48CFF'
};

const NS=()=>SAVE.nem||(SAVE.nem={list:[],won:[]});
const nemName=N=>flPersonal(N.n);
const nemOf=reg=>NS().list.find(N=>N.reg===reg);
const nemReg=()=>S.wd&&S.wd.reg||'meadow';
const nemElite=e=>!!(e.nem||e.isBoss||(typeof flElite==='function'&&flElite(e)));

// מי הפיל אותך: האויב העלית הקרוב ביותר. מבוקש, מבוקש היום, שומר ובובות אימון שייכים למערכות אחרות
function nemKiller(){
  let best=null,bd=NEMESIS.near;
  for(const e of enemies){
    if(e.dead||e.wanted||e.hunt||e.warden||e.dummy||e.evt||!ETYPES[e.type]||!nemElite(e))continue;
    const d=Math.hypot(P.x-e.x,P.y-e.y);if(d<bd){bd=d;best=e}
  }
  return best&&{e:best,d:bd};
}
const nemCause=(e,d)=>e.affix&&TEXT['nem.cause.'+e.affix]?e.affix:e.leader?'leader':d>NEMESIS.melee?'far':'near';

/* ---- מוות בעולם (worldDeath ב-world.js) ---- */
function nemOnDeath(){
  if(!S.wd||S.wd.dp)return;const k=nemKiller();if(!k)return;const e=k.e,reg=nemReg(),L=NS();
  let N=e.nem&&L.list.find(x=>x.id===e.nem);
  if(N){N.wins++;N.rank=Math.min(NEMESIS.rankMax,N.rank+1);N.esc=null;N.cause=nemCause(e,k.d)}
  else{
    if(nemOf(reg)||L.list.length>=NEMESIS.max)return;
    N={id:'n'+Date.now().toString(36)+flRnd(),reg,type:e.type,n:flRnd(),rank:1,wins:1,esc:null,cause:nemCause(e,k.d),aff:e.affix||null};
    L.list.push(N);
  }
  saveNow();
  setTimeout(()=>banner(NEMESIS.icon+' '+T(N.wins>1?'nem.up':'nem.born',nemName(N),N.rank),NEMESIS.col),300);
}

/* ---- כניסה לאזור (enterWorld): אם יש כאן נמסיס, הוא מחכה ליד הלהקה שלו ---- */
function nemEnter(){
  if(!S.wd)return;S.wd.nemE=null;if(S.wd.dp)return;   // עומק הצל (depths.js) שייך לכללים משלו
 const N=nemOf(nemReg());if(!N||!ETYPES[N.type])return;
  const FO=WR().foes||[];let i=FO.findIndex(G=>G.type===N.type&&!G.creature);
  if(i<0)i=FO.findIndex(G=>ETYPES[G.type]&&!G.creature);if(i<0)return;
  const G=FO[i],Z=typeof wZone==='function'&&wZone(G)||{hp:1,dmg:1,speed:1},F=NEMESIS,up=N.rank-1;
  const e=addEnemy(N.type,G.x+rand(-30,30),G.y+rand(-30,30),F.hp*(1+F.grow.hp*up)*(Z.hp||1)*(WORLD.foeHp||1));
  e.dmg*=F.dmg*(1+F.grow.dmg*up)*(Z.dmg||1);e.r*=F.r;e.speed*=F.speed*(Z.speed||1);
  e.home=i;e.xp=0;e.elite=false;e.champ=false;e.nem=N.id;e.pname=nemName(N);e.zone=Z.id;
  if(N.aff&&typeof affixSet==='function'){const h=e.max;affixSet(e,N.aff);if(e.max!==h)e.hp=e.max;}   // אותה תכונה כמו כשהפיל אותך
  if(typeof tierSpawn==='function')tierSpawn(e);
  S.wd.nemE=e;
  setTimeout(()=>{if(S.wd&&S.wd.nemE===e&&!e.dead)nemCard(N)},1800);
}
// השורה שזוכרת אותך
function nemLine(N){
  if(N.esc!=null)return T('nem.say.esc',N.esc);
  if(N.wins>1)return T('nem.say.wins',N.wins);
  return T('nem.say.by',T('nem.cause.'+(N.cause||'near')));
}

/* ---- כל פריים בעולם (worldUpdate) ---- */
function nemUpdate(dt){
  const w=S.wd,e=w&&w.nemE;if(!e)return;const N=NS().list.find(x=>x.id===e.nem);
  if(!N){w.nemE=null;return}
  if(e.dead){if(e.hp<=0)nemBeat(e,N);w.nemE=null;return}
  const d=Math.hypot(P.x-e.x,P.y-e.y);
  if(d<WORLD.aggro*NEMESIS.meet){
    if(!e.nemSaid){e.nemSaid=1;e.flSeen=1;if(typeof flSay==='function')flSay(e,nemLine(N),true)}
    N.esc=Math.max(1,Math.round(P.hp));   // אם תברח עכשיו, הוא יזכור עם כמה חיים
    if((w.nemSv=(w.nemSv||0)-dt)<=0){w.nemSv=5;saveNow()}
  }
  nemCardTick(dt);
}

/* ---- ניצחון: חגיגה, שלל מיוחד, ולספר ---- */
function nemBeat(e,N){
  const L=NS(),F=NEMESIS;L.list=L.list.filter(x=>x.id!==N.id);
  L.won.unshift({type:N.type,n:N.n,rank:N.rank,reg:N.reg,wins:N.wins});L.won.length=Math.min(L.won.length,F.won);
  const D=Object.assign({},F.loot,{coins:[1,F.loot.coins[1]+F.coinsRank*N.rank]});runGive(D,e.x,e.y);
  let id=typeof lootRoll==='function'?lootRoll(F.gear.rolls,true):null;
  if(id){id=String(id).replace(/~\d+/,'~'+F.gear.q);dropSpawn(id,1,e.x+rand(-16,16),e.y+rand(-16,16))}
  celebrate(e.x,e.y,'loot4',F.icon);
  banner(F.icon+' '+T('nem.down',nemName(N)),C.gold);
  if(typeof wsbTome==='function')setTimeout(()=>wsbTome('nemesis',e.x,e.y),900);   // ספר קדום (wskbook.js)
  nemCardOff();questEvent('nemesis');saveNow();   // הלוח בפונדק (inn.js)
}

/* ---- פס דק למעלה (כמו הפגישה הראשונה ב-foelore.js), מתחת לפס ההוא כדי לא להתנגש בו ---- */
const NMC={t:0};
function nemCardEl(){
  let el=document.getElementById('nemCard');if(el)return el;
  el=document.createElement('div');el.id='nemCard';el.className='flcard nemcard';el.setAttribute('role','status');el.hidden=true;
  document.body.appendChild(el);return el;
}
function nemCard(N){
  const el=nemCardEl();NMC.t=NEMESIS.card.dur;
  el.innerHTML='<span class="flpic">'+NEMESIS.icon+'</span><div><b><small>'+T('nem.tag',N.rank)+'</small> '+nemName(N)+'</b><p>'+nemLine(N)+'</p></div>';
  el.hidden=false;void el.offsetWidth;el.classList.add('on');
  if(typeof sfx==='function')sfx('ui');
}
function nemCardTick(dt){if(NMC.t>0&&(NMC.t-=dt)<=0)nemCardOff()}
function nemCardOff(){NMC.t=0;const el=document.getElementById('nemCard');if(el){el.classList.remove('on');el.hidden=true}}
setInterval(()=>{if(NMC.t>0&&(!S||!S.wd))nemCardOff()},1000);   // יציאה מהעולם: לא משאירים פס תקוע
const nemCardOn=()=>NMC.t>0;

/* ---- ספר ההרפתקאות (book.js), בלשונית היצורים: הנמסיסים שלך, ומי שניצחת ---- */
function nemBookHtml(){
  const L=NS();if(!L.list.length&&!L.won.length)return '';
  const pic=k=>(typeof FOELORE!=='undefined'&&FOELORE.list[k])||NEMESIS.icon;
  let h='<h4 class="bkgrp nemgrp">'+NEMESIS.icon+' '+T('nem.book')+'<small>'+L.list.length+'/'+NEMESIS.max+'</small></h4><div class="nemlist">';
  for(const N of L.list)h+='<p class="nemrow"><span>'+pic(N.type)+'</span><b>'+nemName(N)+'</b> <small>'+T('nem.tag',N.rank)+' · '+T('w.region.'+N.reg)+' · '+T('nem.beatYou',N.wins)+'</small></p>';
  for(const N of L.won)h+='<p class="nemrow won"><span>✓</span><b>'+flPersonal(N.n)+'</b> <small>'+T('nem.tag',N.rank)+' · '+T('nem.wonIt')+'</small></p>';
  return h+'</div>';
}

(function(){const st=document.createElement('style');st.textContent=
  '#nemCard{top:calc(env(safe-area-inset-top,0px) + 96px);border-color:#B48CFF;background:linear-gradient(#3A2A4Ae6,#20162Ce6)}#nemCard b{color:#D9C2FF}#nemCard small{color:#B48CFF}'+
  '.nemlist{grid-column:1/-1;display:flex;flex-direction:column;gap:4px;margin:0 0 8px}.nemrow{margin:0;padding:4px 8px;border-radius:8px;background:#2A1E36;border:1px solid #B48CFF66;display:flex;gap:6px;align-items:center;flex-wrap:wrap}'+
  '.nemrow b{color:#D9C2FF}.nemrow small{opacity:.8}.nemrow.won{background:#1E2A1E;border-color:#7FE08A66}.nemrow.won b{color:#BFEBC4}';
  document.head.appendChild(st)})();
