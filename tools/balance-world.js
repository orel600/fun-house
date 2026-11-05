/* איזון בעולם (משימה ז ב"התוכנית הבאה", 4.11.2026): שחקן מדומה לכל אחת משלוש המחלקות עובר את ששת הפרקים בעולם.
   בכל פרק: מטפס לרמה המומלצת של הדרך הבאה (CURIO.paths), ואז הולך לפנס ומפיל את השומר. בדרך לובש את מה שנופל (אם עומד בדרישות),
   שם נקודות, מחליף סקילים בספר כדי למדוד את כולם, ובכל חזרה לכפר משדרג סקילים אצל הכוהנת כשיש לו במה.
   בלי חסינות: הוא יכול למות, וקם בכפר כמו שחקן. מודד: זמן לכל פרק, מוות, נזק לכל סקיל (ולהטלה), ומה תקע אותו.
   הרצה: node tools/balance-world.js [--cls warrior,hunter,mage] [--seed 7] [--cap 900] [--json out.json] [--set "<js>"]
   --cap: כמה שניות משחק לכל היותר לפרק (טיפוס + שומר). פרק שלא נגמר בזמן נרשם "תקוע", והבוט ממשיך לפרק הבא כדי למדוד אותו.
   לא רץ ב-GitHub. דו-ממד בלבד. הזמן מואץ בשעון מזויף, ושלוש המחלקות רצות במקביל
   tools/playtime.js משתמש בבוט הזה (install), עם שלוש תוספות שכבויות כברירת מחדל: פרק עם tier (דרגת עולם) ו-kills
   (כמה הריגות באזור לפני השומר, במקום הרמה המומלצת), ו-B.trip (חזרה לכפר כל כך שניות, כמו שחקן אמיתי) */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const args=process.argv.slice(2);
const opt=k=>{const i=args.indexOf('--'+k);if(i<0)return null;const v=args[i+1];return v&&!v.startsWith('--')?v:true};
const BAL={
  cls:(opt('cls')||'warrior,hunter,mage').split(','),
  seed:+(opt('seed')||7),
  cap:+(opt('cap')||2400),        // מאז רמה 100 (#356) הטיפוס לרמה המומלצת ארוך יותר. עם 1200 הבוט נלחם בשומרים 2-5 רמות מתחת          // שניות משחק לפרק
  wardenCap:600,
  only:+(opt('chapters')||0),      // רק הפרקים הראשונים (--chapters 1: רק האחו ושומר האדמה)
  travel:60,                       // שניות בשלב השומר בלי להגיע למאורה, ואז קופצים אליה (ראה למטה)                   // מתוכן, לכל היותר לקרב בשומר
  fights:+(opt('fights')||1),      // כמה פעמים להפיל כל שומר, כדי להוריד את הרעש (--fights 10). אחרי כל ניצחון: חיים מלאים, והשומר קם שוב
  dodge:opt('nododge')?0:1,
  smart:opt('blind')?0:1,          // מול שומר בוחרים את הסקילים שהוא חלש להם (--blind: סבב רגיל, כמו קודם)        // הבוט יוצא מעיגולי ברק ומעיגול רקיעה, כמו שחקן שרואה את הסימן (--nododge: עומד במקום)
  step:250,                        // כל כמה מילישניות משחק הבוט מחליט
  swapEvery:75,                    // כל כמה שניות מחליפים סקיל אחד בספר, כדי שכל הסקילים הפתוחים יימדדו
  flee:0.3,
  // --quests: "בעיקר קווסטים" (ניר, 5.11: הקווסטים הם הדרך היעילה והכיפית, וההריגה החלופה האיטית). הבוט לוקח קווסטים מהדמויות ומהלוח באזור,
  // עושה אותם (הריגה, מקום, להגן, לפגוש, לאסוף ממקור) ומוסר. קווסט שלא נגמר תוך qGiveUp שניות נזנח. דיג ו"תביא לי" שאין בתרמיל: לא
  quests:opt('quests')?1:0,
  qGiveUp:600,                        // מתחת לחלק הזה מהחיים בורחים עד שמתרפאים
  // התוכנית לנקודות: לפי הסדר, שוב ושוב. התכונה הראשונה היא זו שהנשק של המחלקה דורש (ITEMROLL.stat)
  pts:{warrior:['str','vit','str','def'],hunter:['agi','str','agi','vit'],mage:['haste','str','haste','vit']},
  chapters:[{reg:'meadow',k:'earth',to:'lake'},{reg:'lake',k:'water',to:'ridge'},{reg:'ridge',k:'ice',to:'desert'},
            {reg:'desert',k:'fire',to:'storm'},{reg:'storm',k:'bolt',to:'shadow'},{reg:'shadow',k:'light',to:null}],
  phone:{width:844,height:390}
};

/* ---- הבוט, בתוך הדף ---- */
function install(B){
  const m=window.__bal={B,ch:0,ph:'grind',gt:0,chT:0,wT:0,rep:{ch:[],boss:{},hurtBy:{},dmg:{},casts:{},block:{},noPay:{},deaths:0,errors:[]},lastMg:0,lastSw:0,swI:0,dead:0};
  const R=m.rep;
  // נזק: כל מכה נמדדת לפי מקור. סקיל מהספר דרך wsbHit, סקיל של הזירה לפי סוג הנזק, והשאר לפי הנשק
  const OLD={earth:'quake',lightning:'zap',water:'splash',ice:'frost',fire:'flame'};
  const d0=damage;damage=function(e,base,w,ang,t){const h=e.hp;const r=d0.apply(this,arguments);
    if(S.wd&&!e.node){const got=Math.max(0,h-Math.max(0,e.hp)),src=window.__src||(w==='skill'?OLD[t]||'skill':w);
      const c=R.dmg[m.ch]||(R.dmg[m.ch]={});c[src]=(c[src]||0)+got;
      if(e.warden&&!e.dpBoss){const b=R.boss[m.ch]||(R.boss[m.ch]={}),k=src+':'+(t||'physical')+'×'+(((e.mult||{})[t||'physical'])??1);b[k]=(b[k]||0)+got}}return r};   // נזק לשומר: לפי מקור, סוג ומכפיל
  const h0=wsbHit;wsbHit=function(e,id){window.__src=id;try{return h0.apply(this,arguments)}finally{window.__src=null}};
  const u0=wskUse;wskUse=function(id){const ok=u0.apply(this,arguments);if(ok){const c=R.casts[m.ch]||(R.casts[m.ch]={});c[id]=(c[id]||0)+1}return ok};
  // הזמן: הבוט מריץ את הפריימים בעצמו (frameStep ב-main.js), 0.05 שניות כל אחד, בלי השעון המזויף שמאט פי מאה.
  // זמן המשחק נספר רק בעולם, כדי שההמתנה אחרי מוות (setTimeout אמיתי) לא תיספר
  frame=function(){};
  // מה פוגע בשחקן בקרב בשומר: לפי הפונקציה שקראה ל-hurt (יריות, טבעות, עיגולים, רקיעה, מגע)
  const hu=hurt;hurt=function(d){const h0=P.hp,r=hu.apply(this,arguments);if(m.ph==='warden'&&S.wd){const ln=(new Error().stack.split('\n')[2]||''),fn=(ln.match(/at (\w+)/)||[])[1]||'?';
    const c=R.hurtBy[m.ch]||(R.hurtBy[m.ch]={});c[fn]=(c[fn]||0)+Math.max(0,h0-P.hp)}return r};
  if(typeof giantLoot==='function')giantLoot=function(){};   // שלל של ניצחון חוזר: לא, כדי שהציוד לא ישתפר בין קרב לקרב
  window.__balRun=n=>{let r={};for(let i=0;i<n&&!r.done;i++){last=performance.now()-50;frameStep(performance.now());if(S.wd)m.gt+=0.05;if(i%5===0)r=step()}return r};
  function chap(){return B.chapters[m.ch]}
  // הריגות בפרק (ל-kills של playtime.js)
  const k0=kill;kill=function(e){const x0=S.wd&&!e.node&&m.ch<B.chapters.length?cumXp():null;const r=k0.apply(this,arguments);if(x0!==null){m.kc=(m.kc||0)+1;const c=cRep();c.kxp=(c.kxp||0)+cumXp()-x0}return r};
  function need(){const c=chap();return c.lv||(c.to?CURIO.paths[c.to].lv:0)}   // c.lv: רמת יעד לפרק (playtime.js, בדרגות 2-3)
  // XP מצטבר (לא מתאפס ברמה), ומה מתוכו מקווסטים: לדוח "בעיקר קווסטים" מול "בעיקר הריגה"
  const cumXp=()=>{let s=SAVE.hero.xp||0;for(let l=1;l<heroLv();l++)s+=rankNeed(l);return s};
  function cRep(){return R.ch[m.ch]||(R.ch[m.ch]={reg:chap().reg,deaths:0,lv0:heroLv(),xp0:cumXp(),qn:0,qxp:0})}
  const qc0=questClaim;questClaim=function(id){const q=QBY[id],had=!!QS().active[id];const r=qc0.apply(this,arguments);
    if(S.wd&&had&&!QS().active[id]&&q){const c=cRep();c.qn++;c.qxp+=q.reward.xp||0}return r};
  /* "בעיקר קווסטים": מה הבוט עושה עכשיו. {at:{x,y},near:פעולה כשמגיעים} או {e:אויב או מקור} או null (טיפוס רגיל) */
  m.qT={};m.qSkip={};
  const QK=q=>q.kind==='world'||q.kind==='wboard';
  const nodeFor=r=>enemies.filter(e=>e.node&&!e.dead&&(()=>{const K=NODES.kinds[e.kind]||{};return (K.drop&&K.drop[r])||(K.wdrop&&K.wdrop[r])})()).reduce((b,e)=>{const d=Math.hypot(e.x-P.x,e.y-P.y);return d<b.d?{e,d}:b},{e:null,d:1e9}).e;
  const qDo=q=>q.obj.every(o=>['kill','visit','hold','meet','gather','collect'].includes(o.type)&&(o.type!=='collect'||(SAVE.bag[o.what]||0)>=o.n)&&(o.type!=='gather'||nodeFor(o.what)));
  function qGoal(now){
    const N=wnpcState()||{},Q=QS(),reg=S.wd.reg;
    for(const id in Q.active){const q=QBY[id];if(q&&QK(q)&&N[q.giver]&&qReady(q))return{at:N[q.giver],near:()=>questAct('claim',id)}}
    for(const id in N)if(!SAVE.met[id]&&!m.qSkip['met:'+id]){const k='met:'+id;if(m.qT[k]===undefined)m.qT[k]=now;if(now-m.qT[k]>120){m.qSkip[k]=1;continue}return{at:N[id],near:()=>{}}}   // דמות שעוד לא נמצאה: הולכים אליה (WNPC.find)
    const act=Object.keys(Q.active).filter(id=>QBY[id]&&QK(QBY[id])&&N[QBY[id].giver]&&!m.qSkip[id]);
    if(act.length<4)for(const q of QUESTS.list)if(QK(q)&&N[q.giver]&&!m.qSkip[q.id]&&qOpen(q)&&qDo(q))return{at:N[q.giver],near:()=>{questAct('accept',q.id);m.qT[q.id]=now}};
    for(const id of act){const q=QBY[id];if(m.qT[id]===undefined)m.qT[id]=now;if(now-m.qT[id]>B.qGiveUp){m.qSkip[id]=1;R.qGiveUp=(R.qGiveUp||0)+1;continue}
      for(let i=0;i<q.obj.length;i++){const o=q.obj[i];if(qProg(q,i)>=o.n)continue;
        if(o.type==='visit'||o.type==='hold'){const p=sqPlace(o.what);if(p&&p.reg===reg)return{at:p,stay:1};break}
        if(o.type==='meet'){if(N[o.what])return{at:N[o.what],near:()=>questEvent('meet',o.what)};break}
        if(o.type==='gather'){const e=nodeFor(o.what);if(e)return{e};break}
        if(o.type==='kill'){if(o.what==='any')return null;const F=foes().filter(e=>e.type===o.what);
          const e=F.reduce((b,e)=>{const d=Math.hypot(e.x-P.x,e.y-P.y);return d<b.d?{e,d}:b},{e:null,d:1e9}).e;if(e)return{e};
          const G=(WR().foes||[]).find(f=>f.type===o.what);if(G)return{at:G,stay:1};break}
        break}}
    return null;
  }
  const foes=()=>enemies.filter(e=>!e.dead&&!e.node);
  function better(slot,id){let wi=-1,ws=1e9;for(let i=0;i<gOpen(slot);i++){const s=gScore(gGet(slot,i));if(s<ws){ws=s;wi=i}}return gScore(id)>ws+1e-9?wi:-1}
  // הציוד: כל מה שבתרמיל ועדיף על הגרוע שלבוש באותה משבצת. נשק רק של המחלקה. לא עומד בדרישות: נרשם
  function equip(){const arms=HEROES.list[heroId()].arms;
    for(const id of Object.keys(SAVE.bag)){const it=gItem(id);if(!it||!SAVE.bag[id])continue;if(it.slot==='weapon'&&!arms.includes(it.w))continue;
      const i=better(it.slot,id);if(i<0)continue;
      if(!irMeets(id)){const r=irReq(id),k=it.slot+':t'+it.tier;const b=R.block[k]||(R.block[k]={n:0,lv:r.lv,st:r.st,pt:r.n,at:[]});b.n++;if(b.at.length<4)b.at.push(heroLv()+'/'+(stPts()[r.st]||0));
        // נרשם פעם אחת לחפץ: מוציאים אותו לצד, כמו שחקן ששם במחסן עד שיגיע לרמה
        SAVE.stash[id]=(SAVE.stash[id]||0)+SAVE.bag[id];delete SAVE.bag[id];continue}
      gearEquip(id,it.slot,i)}
    // מה שבצד ועכשיו כבר עובר את הדרישות
    for(const id of Object.keys(SAVE.stash)){const it=gItem(id);if(!it||!SAVE.stash[id]||!irMeets(id))continue;if(better(it.slot,id)<0)continue;
      SAVE.stash[id]--;if(!SAVE.stash[id])delete SAVE.stash[id];bagAdd(id);gearEquip(id,it.slot,better(it.slot,id))}}
  function points(){const plan=B.pts[heroId()];let n=0;while(stFree()>0&&n++<99){const k=plan[stSpent()%plan.length];if(!statAdd(k))break}
    // עץ הסקילים: הצומת הראשון שאפשר בענף של המחלקה
    const br={warrior:'war',hunter:'hunt',mage:'mage'}[heroId()];for(let g=0;g<9&&trFree()>0;g++)if(!treeLearn(br))break}
  // בכפר: שדרוג סקילים אצל הכוהנת. קודם מה שעל הכפתורים
  function upgrade(){const ids=wslIds(),load=wsbLoad();ids.sort((a,b)=>(load.includes(b)?1:0)-(load.includes(a)?1:0));
    for(const id of ids){let n=0;while(wslCan(id)&&n++<5)wslUp(id);
      if(wslLv(id)<WSKLVL.max&&!wslCan(id)&&load.includes(id)){const c=wslCost(id),miss=Object.keys(c).filter(r=>(SAVE.bag[r]||0)<c[r]);
        const k=id+'+'+(wslLv(id)+1);R.noPay[k]=R.noPay[k]||{ch:m.ch,miss:miss.map(r=>r+' '+(SAVE.bag[r]||0)+'/'+c[r]).join(', ')}}}}
  // הספר: הסקילים הפתוחים מסתובבים על שתי המשבצות, כדי שכל אחד יימדד
  function swap(){const open=wsbIds().filter(id=>id!==wsbWeapon()&&wsbOpen(id)&&WSKBOOK.list[id]);if(!open.length)return;
    const L=wsbLoad(),mine=open.filter(id=>WSKBOOK.list[id].cls===heroId());const pool=mine.length>=2?mine:open;
    m.swI=(m.swI+1)%pool.length;const nx=pool[m.swI];if(L.includes(nx))return;L[m.swI%2]=nx;}
  function steer(tx,ty,flee,stop){let dx=0,dy=0;
    if(!flee&&S.wd&&typeof TR!=='undefined'&&TR&&Math.hypot(tx-P.x,ty-P.y)>stop){const t=tDir(P,tx,ty);if(t.x!==tx||t.y!==ty){tx=t.x;ty=t.y;stop=0}}   // דרך פתוחה: נשארים בטווח של הנשק (קשת ומטה לא נכנסים לתוך השומר)   // אזור עם מפה (terrain.js, האחו הגדול): מסביב לנהר וליער, כמו check.js
    const d=Math.hypot(tx-P.x,ty-P.y)||1;if(flee||d>stop){dx=(tx-P.x)/d;dy=(ty-P.y)/d;if(flee){dx=-dx;dy=-dy}}
    // תקוע באחו הגדול (קצה של נהר או צוק, דרך שלא נמצאה): 8 שניות בלי לזוז 40 פיקסלים, אז 2 שניות לכיוון אקראי, כמו שחקן שמסתובב. נספר ב-R.unstick
    if(S.wd&&typeof TR!=='undefined'&&TR){const k=m.stk;if(!k||Math.hypot(P.x-k.x,P.y-k.y)>40)m.stk={x:P.x,y:P.y,t:m.gt};
      else if(m.gt-k.t>8&&(dx||dy)){R.unstick=(R.unstick||0)+1;(R.stuckAt||(R.stuckAt=[])).push([Math.round(P.x),Math.round(P.y),flee?'flee':m.ph]);m.stk={x:P.x,y:P.y,t:m.gt};m.wig=m.gt+2;m.wa=Math.random()*6.283}
      if(m.wig>m.gt){dx=Math.cos(m.wa);dy=Math.sin(m.wa)}}
    joy={id:-1,ox:-999,oy:-999,dx,dy}}
  function finish(ok,why){const c=cRep();c.t=Math.round(m.gt-m.chT);c.lv1=heroLv();c.ok=ok;if(why)c.why=why;c.coins=SAVE.bag.coins||0;c.xp=Math.round(cumXp()-c.xp0);
    c.gear=[SAVE.gear.weapon].concat(SAVE.gear.acc||[],SAVE.gear.boots||[],SAVE.gear.body||[]).filter(Boolean).join(' ');
    c.sk=Object.entries(SAVE.sklv||{}).map(([k,v])=>k+'+'+v).join(' ');
    if(ok)STO()[chap().k]=true;saveNow();m.ch++;m.ph='grind';m.jumped=0;m.chT=m.gt;m.wT=0;m.kc=0;joy=null;
    if(S.wd){worldUi(false);enterVillage()}}
  function step(){
    if(m.ch>=B.chapters.length||B.only&&m.ch>=B.only)return{done:true,R};   // --chapters N: רק N הפרקים הראשונים (בדיקה מהירה)
    const now=m.gt,c=cRep(),vis=id=>!$(id).hidden;
    if(vis('ovWDeath')){$('wRespawn').click();return{}}
    if(S.wd&&S.mode==='over'){if(!m.dead){m.dead=1;R.deaths++;c.deaths++;if(m.ph==='warden')c.wDeaths=(c.wDeaths||0)+1}return{}}
    m.dead=0;
    if(now-m.chT>B.cap+(m.ph==='warden'?B.wardenCap*(B.fights-1):0)){const L0=STORY.lanterns[chap().k];finish(false,m.ph==='warden'?'שומר (במרחק '+Math.round(Math.hypot(P.x-L0.x,P.y-L0.y))+' מהפנס'+(S.wd.warden?', ער':'')+')':'רמה '+heroLv()+'/'+need());return{}}
    for(const id of ['npcDlg','qLog','ovGear','ovDaily','ovWelcome','ovBook'])if($(id)&&!$(id).hidden)$(id).hidden=true;
    if(S.vil||!S.wd||S.wd.reg!==chap().reg){if(S.vil){equip();points();upgrade()}
      worldUi(false);enterWorld('home',chap().reg);return{}}
    if(S.mode!=='play')return{};
    // דרגת עולם (playtime.js): עוברים לדרגה של הפרק כשהיא פתוחה. סגורה (דרגה 3 מחכה להריגות בדרגה 2): ממשיכים בדרגה הקודמת
    if(chap().tier&&typeof tierSet==='function'){if(!STO().end)STO().end=true;if(tierNow()!==chap().tier&&tierOpen(chap().tier))tierSet(chap().tier);c.gate=tierNow()!==chap().tier}
    // חזרה לכפר כל B.trip שניות (playtime.js), כמו שחקן שחוזר למכור, לשדרג ולנוח. רק בזמן טיפוס
    if(B.trip&&m.ph==='grind'&&now-(m.lastTrip||0)>B.trip){m.lastTrip=now;R.trips=(R.trips||0)+1;worldUi(false);enterVillage();return{}}
    if(now-m.lastMg>5){m.lastMg=now;equip();points();if(!foes().some(e=>Math.hypot(e.x-P.x,e.y-P.y)<260))dropsCollectAll()}
    // מול שומר: הסקילים שהוא הכי חלש להם (הטבעת מתחת לשומר מראה את החולשה, ושחקן בוחר לפיה). אחרת מחליפים בסבב כדי למדוד את כולם
    const bw=S.wd&&S.wd.warden&&!S.wd.warden.dead&&B.smart?S.wd.warden:null;
    if(bw&&now-(m.lastBest||0)>4){m.lastBest=now;const mu=bw.mult||{},L=wsbLoad();
      const open=wsbIds().filter(id=>id!==wsbWeapon()&&wsbOpen(id)&&WSKBOOK.list[id]),sc=id=>(mu[WSKBOOK.list[id].dt]??1)+(WSKBOOK.list[id].cls===heroId()?0.01:0);
      open.sort((a,b)=>sc(b)-sc(a));if(open[0])L[0]=open[0];if(open[1])L[1]=open[1]}
    else if(!bw&&now-m.lastSw>B.swapEvery){m.lastSw=now;swap()}
    // שלב: אחרי הרמה המומלצת, לפנס
    const ready=chap().kills?(m.kc||0)>=chap().kills&&!c.gate&&heroLv()>=need():heroLv()>=need();
    if(m.ph==='grind'&&ready&&now-m.chT<B.cap-30)m.ph='warden';
    if(m.ph==='grind'&&now-m.chT>=B.cap-B.wardenCap)m.ph='warden';   // לא הגיע לרמה בזמן: מנסה את השומר בכל זאת
    const L=STORY.lanterns[chap().k],w=S.wd;
    if(m.ph==='warden'){if(!m.wT)m.wT=now;
      if(m.wE&&m.wE.dead&&m.wE.hp<=0){const f=c.fights||(c.fights=[]);f.push(Math.round((now-m.wS)*10)/10);m.wE=null;
        if(f.length<B.fights){P.hp=P.maxHp;S.wd.marks=[];S.wd.rings=[];if(STO().bt)delete STO().bt[chap().k];P.x=L.x;P.y=L.y+GIANT.lair+700;return{}}   // שוב: מתרחקים, והשומר קם כשחוזרים
        c.wardenT=Math.round(now-m.wT);c.fightT=Math.round(f.reduce((a,b)=>a+b,0)/f.length*10)/10;c.wLv=heroLv();finish(true);return{}}
      // הענק קם לבד כשמתקרבים (giant.js). הטיימר מניצחון מקרי בזמן הטיפוס לא נספר: מאפסים אותו
      if(m.wE&&m.wE.gone)m.wE=null;
      // המדידה היא של הקרב, לא של הדרך: מי שלא הגיע למאורה תוך travel שניות (באחו הגדול הבוט נתקע בלהקות ובורח) קופץ ליד המאורה
      if(!w.warden&&now-m.wT>B.travel&&Math.hypot(P.x-L.x,P.y-L.y)>L.warden.wake&&!m.jumped){m.jumped=1;c.jump=1;const ly=L.y+(typeof GIANT!=='undefined'?GIANT.lair:70);
        for(const [ox,oy] of [[0,320],[320,0],[-320,0],[0,-320],[230,230],[-230,230],[230,-230],[-230,-230]])if(typeof tBlocked!=='function'||!tBlocked(L.x+ox,ly+oy)){P.x=L.x+ox;P.y=ly+oy;break}}if(STO().bt)delete STO().bt[chap().k];
      if(!w.warden&&typeof giantReady!=='function'&&Math.hypot(P.x-L.x,P.y-L.y)<L.warden.wake)storyWarden(chap().k,L.y+70);   // גרסה ישנה (לפני הטיימר): קם רק עם קווסט, אז מקימים ביד
      if(w.warden&&!w.warden.dead&&m.wE!==w.warden){m.wE=w.warden;m.wS=now;c.tries=(c.tries||0)+1}}
    // קרב: לחיים נמוכים בורחים. אחרת אל האויב הקרוב (או השומר), עד הטווח של הנשק
    const F=foes(),near=F.reduce((b,e)=>{const d=Math.hypot(e.x-P.x,e.y-P.y);return d<b.d?{e,d}:b},{e:null,d:1e9});
    const melee=P.weapon==='sword',stop=melee?28:150;
    const mk=B.dodge&&(w.marks||[]).find(M=>M.t>0&&Math.hypot(P.x-M.x,P.y-M.y)<(M.mk||STORY.lanterns[M.k].warden.marks).r+P.r+10),
      sl=B.dodge&&w.warden&&w.warden.tel&&w.warden.tel.kind==='slam'&&Math.hypot(P.x-w.warden.tel.x,P.y-w.warden.tel.y)<(w.warden.pw||L.warden).slam.r+P.r+10?w.warden.tel:null;
    // עיגול שמתקרב מכמה כיוונים: בורחים מכולם יחד (סכום הכיוונים), לא מאחד אל תוך אחר
    let vx=0,vy=0;if(B.dodge)for(const M of (w.marks||[])){if(M.t<=0)continue;const r=(M.mk||STORY.lanterns[M.k].warden.marks).r+P.r+30,dx=P.x-M.x,dy=P.y-M.y,d=Math.hypot(dx,dy)||1;
      if(d<r){const k=(r-d)/r+0.3;vx+=dx/d*k;vy+=dy/d*k}}
    // טבעת אש שמתקרבת: הולכים אל הפתח שלה, באותו מרחק מהמרכז
    const rg=B.dodge&&(w.rings||[]).find(R=>{const d=Math.hypot(P.x-R.x,P.y-R.y),rr=R.rg||STORY.lanterns[R.k].warden.ring;return !R.hit&&d>R.rad&&d-R.rad<90&&d<rr.max+20});
    if(vx||vy)steer(P.x+vx*100,P.y+vy*100,false,0);
    else if(sl)steer(sl.x,sl.y,true,0);   // יוצאים מעיגול הרקיעה
    else if(rg){const d=Math.hypot(P.x-rg.x,P.y-rg.y);steer(rg.x+Math.cos(rg.gap)*d,rg.y+Math.sin(rg.gap)*d,false,4)}
    else if(P.hp<P.maxHp*B.flee&&near.e&&near.d<320){steer(near.e.x,near.e.y,true,0);m.hurt=1}
    else if(m.hurt&&P.hp<P.maxHp*0.85&&near.d<320){steer(near.e.x,near.e.y,true,0)}
    else{m.hurt=0;
      // B.rares (playtime.js): אחרי השמועה, הולכים לנדירה, כמו שחקן ששמע עליה. אחרת היא נעלמת לפני שהבוט נתקל בה
      const rr=B.rares&&m.ph==='grind'&&w.rare&&!w.rare.done&&w.rare.rumor<=0&&w.rare.e&&!w.rare.e.dead&&(!near.e||near.d>200)?w.rare.e:null;
      // --quests: יעד של קווסט. אויב קרוב (140) קודם, כמו שחקן שלא עובר דרך להקה
      const qg=B.quests&&m.ph==='grind'&&!rr&&!(near.e&&near.d<140)?qGoal(now):null;
      if(qg&&qg.at){const d=Math.hypot(P.x-qg.at.x,P.y-qg.at.y);if(d<80&&qg.near)qg.near();steer(qg.at.x,qg.at.y,false,qg.stay?20:40)}
      else{
      const tg=m.ph==='warden'?(w.warden&&!w.warden.dead?w.warden:null):qg&&qg.e||rr||near.e;
      if(m.ph==='warden'&&!tg)steer(L.x,L.y,false,20);else if(tg)steer(tg.x,tg.y,false,stop+(tg.r||0));else joy=null}}
    if(near.e&&near.d<230&&S.sk)for(const id of S.sk.ids.slice())if(wskReady(id)>=0)wskUse(id);
    return{}
  }
}

async function runCls(browser,cls){
  const page=await browser.newPage({viewport:BAL.phone,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(seed=>{let a=seed>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}},BAL.seed);
  await page.addInitScript(()=>{try{localStorage.setItem('zm-gfx','2d')}catch(e){}});
  await page.goto('file://'+path.resolve(__dirname,'..','index.html'));
  await page.waitForTimeout(500);
  if(opt('set'))await page.evaluate(js=>{(0,eval)(js)},opt('set'));   // לנסות מספרים בלי לשנות קבצים: --set "HEROES.list.mage.passive.hp=30"
  await page.evaluate(c=>{$('ovStart').hidden=true;heroPick(c)},cls);
  await page.waitForTimeout(300);
  await page.evaluate(install,BAL);
  const t0=Date.now();let r={},n=0;
  while(!r.done){r=await page.evaluate(()=>__balRun(40));
    if(++n%150===0){const s=await page.evaluate(()=>({ch:__bal.ch,lv:heroLv(),ph:__bal.ph,gt:Math.round(__bal.gt)}));console.log(cls,'פרק',s.ch+1,'רמה',s.lv,s.ph,s.gt+'s משחק',Math.round((Date.now()-t0)/1000)+'s')}}
  r.R.ladder=await page.evaluate(()=>typeof GIANT!=='undefined'&&GIANT.ladder||null);
  r.R.errors=[...new Set(errors)].slice(0,8);r.R.real=Math.round((Date.now()-t0)/1000);
  await page.close();return r.R;
}

module.exports={BAL,install};
if(require.main===module)(async()=>{
  const browser=await chromium.launch();
  const out={};await Promise.all(BAL.cls.map(async c=>{out[c]=await runCls(browser,c)}));
  await browser.close();
  // הדוח
  const row=(c,R)=>R.ch.map((h,i)=>{const d=R.dmg[i]||{},cs=R.casts[i]||{},tot=Object.values(d).reduce((a,b)=>a+b,0)||1;
    const sk=Object.keys(d).sort((a,b)=>d[b]-d[a]).map(k=>k+' '+Math.round(d[k]/tot*100)+'%'+(cs[k]?' ('+Math.round(d[k]/cs[k])+'/הטלה)':'')).join(', ');
    return `  ${i+1}. ${h.reg}: ${h.ok?'✓':'✗ תקוע ('+h.why+')'} ${h.t}s, רמה ${h.lv0}→${h.lv1}, מוות ${h.deaths}${h.wardenT!=null?', שומר '+h.wardenT+'s (קרב '+h.fightT+'s) ברמה '+h.wLv+' ('+h.tries+' ניסיונות)':''}, מטבעות ${h.coins}\n     נזק: ${sk}\n     ציוד: ${h.gear} · סקילים: ${h.sk||'-'}`}).join('\n');
  for(const c of BAL.cls){const R=out[c];console.log(`\n${c} (${R.real}s אמיתיות, ${R.deaths} מוות)\n`+row(c,R));
    if(Object.keys(R.block).length)console.log('  נחסם בדרישות: '+Object.entries(R.block).map(([k,b])=>`${k} ×${b.n} (צריך רמה ${b.lv}, ${b.st} ${b.pt}; היה ${b.at.join(' ')})`).join('; '));
    if(Object.keys(R.noPay).length)console.log('  אין במה לשדרג: '+Object.entries(R.noPay).map(([k,v])=>`${k} בפרק ${v.ch+1}: ${v.miss}`).join('; '));
    if(R.errors.length)console.log('  שגיאות: '+R.errors.join(' | '))}
  // סולם הבוסים (GIANT.ladder.ratio, ניר 5.11): כמה זמן לוקח להפיל כל שומר, בממוצע על המחלקות, ופי כמה מהקודם
  const ft=BAL.chapters.map((_,i)=>{const v=BAL.cls.map(c=>(out[c].ch[i]||{}).fightT).filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null});
  for(const c of BAL.cls){const hb=out[c].hurtBy||{};console.log('  נזק לשחקן בקרב בשומר, '+c+': '+Object.keys(hb).map(i=>BAL.chapters[i].k+' '+Object.entries(hb[i]).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k+' '+Math.round(v)).join('/')).join(' | '))}
  for(const c of BAL.cls){const bb=out[c].boss||{};console.log('  נזק לשומר, '+c+': '+Object.keys(bb).map(i=>{const t=Object.values(bb[i]).reduce((a,b)=>a+b,0)||1;
    return BAL.chapters[i].k+' '+Object.entries(bb[i]).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k+' '+Math.round(v/t*100)+'%').join('/')}).join(' | '))}
  console.log('\nלכל מחלקה (ממוצע '+BAL.fights+' קרבות, מוות בקרבות בשומר):');
  for(const c of BAL.cls)console.log('  '+c+': '+out[c].ch.map((h,i)=>BAL.chapters[i].k+' '+(h.fightT??'-')+'s/'+(h.wDeaths||0)+'💀').join(', '));
  console.log('\nזמן להפיל כל שומר (ממוצע, שניות): '+ft.map((t,i)=>BAL.chapters[i].k+' '+(t==null?'-':t.toFixed(1))+(i&&t&&ft[i-1]?' (×'+(t/ft[i-1]).toFixed(2)+')':'')).join(', '));
  const j=opt('json');if(j)fs.writeFileSync(j,JSON.stringify(out,null,1));
  // היעד (GIANT.ladder.t0, time): כמה שניות לכל שומר, ופי כמה המדידה ממנו
  const LD=out[BAL.cls[0]].ladder;if(LD&&LD.t0)console.log('יעד: '+ft.map((t,i)=>{const g=LD.t0*Math.pow(LD.time,i);return BAL.chapters[i].k+' '+Math.round(g)+(t?' ('+(t/g).toFixed(2)+')':'')}).join(', '));
  const bad=BAL.cls.filter(c=>out[c].ch.some(h=>(h.wDeaths||0)>2||!h.ok));if(bad.length)console.log('⚠️ נתקע או מת יותר מפעמיים בשומר: '+bad.join(', '));
})();
