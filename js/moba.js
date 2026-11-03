/* משחקי השאול: מוד מובה 3 על 3 עם בוטים (אוראל, 1.11.2026). התוכנית: docs/moba.md
   נתיב אחד לרוחב. לכל צד בסיס ושני מגדלים, וגלי חיילים. מנצח מי שהורס את הבסיס של השני (קודם המגדל הקרוב, אחריו הרחוק, ואז הבסיס).
   כוח שוויוני: שום דבר מהשמירה לא נכנס (ציוד, דרגות, חפצים, כפר). הכוח בא רק מהערכה (MBKIT ב-moba-kits.js) ומהרמה בתוך המשחק, שמתאפסת בסוף.
   מקום משלו: S.mb. מתחבר בשורה ב-main.js (עדכון), בשורה ב-render.js (ציור) ובשורה ב-render3d.js (בלי חיית המחמד).
   הגיבורים והחיילים נכנסים ל-enemies רק כדי שהתלת-ממד יצייר אותם (LOOK3D.mb_*). צד 0 כחול (השחקן) משמאל, צד 1 אדום מימין.
   הבוטים ב-moba-bot.js */
const MOBA={
  lane:{len:1500,half:250},   // הנתיב: x מ--len עד len, y מ--half עד half
  base:{x:1360,hp:1500,r:58,range:270,dmg:70,cd:1.1,heal:0.2,healR:240,minK:0.3},   // minK: חיילים מכים בבסיס רק 30% (הבודק, 3.11: בלי זה הבסיס נמס בפחות מ-7 שניות)   // heal: חלק מהחיים בשנייה לגיבורים ליד הבסיס שלהם
  towers:[560,1000],          // המגדל הקרוב למרכז קודם. אי אפשר לפגוע במגדל הרחוק לפני שהקרוב נפל, ובבסיס לפני שניהם
  tower:{hp:700,r:30,range:290,dmg:45,cd:1.2,hero:1.5,shot:620},   // hero: מכפיל נזק מול גיבור
  minion:{every:22,first:3,count:4,gap:0.8,hp:260,dmg:18,cd:1,range:36,aggro:180,speed:80,r:12,xp:22,
    ranged:{hp:180,dmg:22,range:190},build:1.8,
    grow:0.1,push:0.5},   // grow: כל דקה החיילים חזקים ב-10%. push: כל מגדל של האויב שנפל, החיילים שלנו חזקים ב-50%   // החייל האחרון בכל גל יורה מרחוק
  xp:{need:[0,80,190,320,470,640],kill:150,share:560,assist:0.5,tower:60},   // need: XP מצטבר לרמה הבאה. share: מי שקרוב מקבל XP מחייל שמת
  ultAt:6,
  grow:0.09,                  // כל רמה: 9% יותר חיים ונזק
  respawn:{base:4,lvl:2,min:2.5},   // שניות עד שגיבור חוזר: 4, ועוד 2 לכל רמה, ועוד 2.5 לכל דקה במשחק (סוף משחק מכריע)
  order:{attack:8,back:6},   // פקודה לבוטים החברים: כמה שניות היא נמשכת
  warnR:160,                  // מאיזה מרחק מטווח מגדל של האויב רואים את הטבעת האדומה שלו
  tips:3,                     // בכמה משחקים ראשונים מופיע הטיפ "הישארו מאחורי החיילים"
  ccImmune:1,                 // אחרי הלם או הכרחה: שנייה של חסינות לשליטה נוספת (אוראל: 3 שניות זה הרבה)
  combo:{shock:1.35,freeze:1.25},   // רטוב + ברק: נזק ×1.35. רטוב + קרח: הקפאה ארוכה ×1.25 (באיזון: ×1.6 נתן להרכב צייד+קוסמת+נפח 94% ניצחונות)
  team:['#4C8DFF','#FF5A5A'],
  shot:650,
  maxT:720,
  msgMin:1.2,                 // הודעה למעלה מוצגת לפחות 1.2 שניות לפני שהבאה מחליפה אותה (הבודק, 3.11: שתי הודעות נערמו)
  feed:{max:3,t:4,src:['tower','base','minion']},   // הודעות הריגה: עד 3 שורות, 4 שניות כל אחת (ה-CSS מעלים אותן ב-3.6)                   // אחרי 12 דקות מנצח מי שנשאר לו יותר מהמבנים
};
let MB=null;

/* ---- יחידות ---- */
let mbN=0;
function mbUnit(o){return Object.assign({id:++mbN,x:0,y:0,r:16,hp:100,max:100,dead:false,flash:0,kx:0,ky:0,ph:0,speed:0,aim:0,face:0,moving:false,atkT:0,aggro:0,
  st:{stun:0,taunt:0,tBy:null,slow:0,slowK:0,wet:0,armor:0,armorK:0,burnBack:0,burn:0,burnD:0,burnBy:null,rage:0,imm:0,ice:0,dash:null}},o)}
function mbHero(kit,team,me,i){
  const K=MBKIT[kit],hx=(team?1:-1)*(MOBA.base.x-110),hy=(i-1)*70;
  return mbUnit({k:'hero',kit,team,me,bot:me?null:{t:0,mode:'push'},type:'mb_'+kit,x:hx,y:hy,home:{x:hx,y:hy},face:team?Math.PI:0,
    hp:K.hp,max:K.hp,speed:K.speed,lvl:1,xp:0,cd:{s1:0,s2:0,ult:0},kills:0,deaths:0,resp:0,hitBy:new Map()});
}
function mbBuild(team,k,x){const B=k==='base'?MOBA.base:MOBA.tower;return mbUnit({k,team,x:(team?1:-1)*x,y:0,r:B.r,hp:B.hp,max:B.hp,shotT:0,tgt:null})}
const mbK=u=>1+MOBA.grow*((u.lvl||1)-1);
const mbDist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const mbHeroes=team=>MB.u.filter(o=>o.k==='hero'&&o.team===team);
const mbMe=()=>MB&&MB.me;
function mbNearest(u,list,maxd){let b=null,bd=maxd||1e9;for(const o of list){const d=mbDist(u,o);if(d<bd){bd=d;b=o}}return b}
// מבנה שאפשר לפגוע בו: מגדל רק אחרי שהמגדל שלפניו נפל, בסיס רק אחרי ששני המגדלים נפלו
function mbHittable(b){
  if(b.dead)return false;
  if(b.k==='tower')return !MB.u.some(o=>o.k==='tower'&&o.team===b.team&&!o.dead&&Math.abs(o.x)<Math.abs(b.x));
  if(b.k==='base')return !MB.u.some(o=>o.k==='tower'&&o.team===b.team&&!o.dead);
  return true;
}
const mbSpeed=u=>u.speed*(u.st.slow>0?1-u.st.slowK:1)*(u.st.rage>0?u.st.rageSp:1);

/* ---- נזק, שליטה בקהל ומוות ---- */
function mbDmg(src,t,d,dt,o={}){
  if(!t||t.dead||!mbHittable(t))return 0;
  if(src&&src.k==='hero'&&src.st.rage>0)d*=src.st.rageK;
  if(t.st.wet>0&&dt==='lightning'){d*=MOBA.combo.shock;t.st.wet=0;mbWord(t,'shock')}   // קומבו: רטוב + ברק
  if(t.k==='hero')d*=1-(MBKIT[t.kit].def||0);   // הנפח והלוחם נלחמים מקרוב, וסופגים קצת פחות
  if(t.st.rage>0)d*=1-(t.st.rageDef||0);   // זעם של הלוחם: סופג פחות
  if(t.st.armor>0){d*=1-t.st.armorK;   // קריאת קרב: הנפח סופג, ומי שמכה בו מקרוב נשרף
    if(src&&src.k!=='tower'&&src.k!=='base'&&mbDist(src,t)<140){src.st.burn=2;src.st.burnD=t.st.burnBack;src.st.burnBy=t}}
  t.hp-=d;t.flash=0.12;
  if(!o.quiet&&(t.k==='hero'||t.k==='tower'||t.k==='base'||src&&src.me))mbFloat(t.x+rand(-8,8),t.y-t.r-18,Math.round(d),t.me?C.blood:dtCol(dt));
  if(src&&src.k==='hero'&&t.k==='hero'){src.aggro=2;t.hitBy.set(src,MB.t)}   // מגדל מכה במי שתוקף גיבור מתחתיו
  if(t.hp<=0)mbDie(t,src);
  return d;
}
// הלם או הכרחה. גיבור שיצא עכשיו משליטה חסין לרגע (MOBA.ccImmune). מבנים חסינים תמיד
function mbCC(t,kind,dur,by){
  if(!t||t.dead||t.k==='tower'||t.k==='base')return false;
  const s=t.st;if(s.imm>0)return false;
  if(kind==='stun'){s.stun=Math.max(s.stun,dur);s.taunt=0;s.dash=null}
  else if(!(s.stun>0)){s.taunt=Math.max(s.taunt,dur);s.tBy=by}
  return true;
}
function mbSlow(t,k,dur){if(t.dead||t.k==='tower'||t.k==='base')return;t.st.slow=Math.max(t.st.slow,dur);t.st.slowK=Math.max(t.st.slow>dur?t.st.slowK:0,k)}
function mbPush(o,ang,d){if(o.k==='tower'||o.k==='base')return;mbStep(o,Math.cos(ang)*d,Math.sin(ang)*d)}
function mbXp(h,v){
  if(h.dead||h.lvl>=MOBA.ultAt)return;h.xp+=v;const N=MOBA.xp.need;
  while(h.lvl<MOBA.ultAt&&h.xp>=N[h.lvl]){h.lvl++;const old=h.max;h.max=Math.round(MBKIT[h.kit].hp*mbK(h));h.hp+=h.max-old;
    if(h.me){celebrate(h.x,h.y,'gear');mbBanner(h.lvl>=MOBA.ultAt?T('mb.ultReady'):T('mb.lvup',h.lvl),C.gold)}}
}
function mbDie(t,src){
  t.hp=0;t.dead=true;const foe=1-t.team;
  if(t.k==='minion'){for(const h of mbHeroes(foe))if(mbDist(h,t)<MOBA.xp.share)mbXp(h,MOBA.minion.xp)}
  else if(t.k==='hero'){
    t.deaths++;t.resp=MOBA.respawn.base+MOBA.respawn.lvl*t.lvl+MOBA.respawn.min*MB.t/60;MB.score[foe]++;
    const killer=src&&src.k==='hero'?src:t.st.burnBy&&t.st.burnBy.k==='hero'?t.st.burnBy:null;
    if(killer){killer.kills++;mbXp(killer,MOBA.xp.kill)}
    for(const [h,at] of t.hitBy)if(h!==killer&&MB.t-at<8)mbXp(h,MOBA.xp.kill*MOBA.xp.assist);
    t.hitBy.clear();Object.assign(t.st,{stun:0,taunt:0,slow:0,wet:0,armor:0,burn:0,rage:0,imm:0,ice:0,dash:null});
    if(t.me){mbBanner(T('mb.died'),C.blood);sfx('hurt')}
    else if(killer&&killer.me){mbBanner(T('mb.kill'),C.gold);sfx('bossDown')}
    mbKillFeed(killer||src,t);   // "X הפיל את Y" מתחת לדמות שלי (במקום ההודעה "חבר נפל")
    mbBoom(t.x,t.y,60,t.team?'red':'blue');
  }else{
    sfx('bossDown');S.shake=Math.max(S.shake,8);mbBoom(t.x,t.y,120,'fire');
    if(t.k==='base'){mbEnd(t.team===1);return}
    mbBanner(T(t.team?'mb.tower1':'mb.tower0'),t.team?C.gold:C.blood);
    for(const h of mbHeroes(foe))mbXp(h,MOBA.xp.tower);
  }
}

/* ---- תנועה ---- */
function mbStep(u,mx,my){
  const ox=u.x;u.x+=mx;u.y+=my;
  for(const w of MB.walls){   // חומת ברזל: האויבים של מי שבנה אותה לא עוברים
    if(w.team===u.team)continue;const side=Math.sign(ox-w.x)||1;
    if(Math.sign(u.x-w.x)!==side||Math.abs(u.x-w.x)<u.r)u.x=w.x+side*u.r;
  }
  for(const b of MB.u){if(b.dead||(b.k!=='tower'&&b.k!=='base'))continue;   // לא עוברים דרך מבנים, אלא מחליקים מסביב להם
    const dx=u.x-b.x,dy=u.y-b.y,d=Math.hypot(dx,dy)||0.01,rr=b.r+u.r;if(d>=rr)continue;
    const nx=dx/d,ny=dy/d,m=Math.hypot(mx,my);u.x=b.x+nx*rr;u.y=b.y+ny*rr;
    // מי שהולך ישר אל המבנה (המגדלים באמצע הנתיב) נדחף בדיוק למקום שממנו בא ונתקע (אוראל, 3.11: "המוד תקוע לגמרי"). לכן ממשיכים לאורך הדופן
    if(m>0.01){const tx=-ny,ty=nx,dot=(mx*tx+my*ty)/m,sd=Math.abs(dot)>0.05?Math.sign(dot):Math.sign(u.y-b.y||1)*Math.sign(nx||1),k=m*Math.max(0.6,Math.abs(dot));
      u.x+=tx*sd*k;u.y+=ty*sd*k;const ex=u.x-b.x,ey=u.y-b.y,e=Math.hypot(ex,ey)||0.01;if(e<rr){u.x=b.x+ex/e*rr;u.y=b.y+ey/e*rr}}}
  const L=MOBA.lane;u.x=Math.max(-L.len,Math.min(L.len,u.x));u.y=Math.max(-L.half,Math.min(L.half,u.y));
}
function mbMove(u,tx,ty,dt,stop=4){
  if(u.st.stun>0){u.moving=false;return}
  const dx=tx-u.x,dy=ty-u.y,d=Math.hypot(dx,dy);if(d<stop){u.moving=false;return}
  // מאטים לקראת היעד במקום לעצור בבת אחת: בוט שהולך אחרי החיילים (איטיים ממנו פי 2) רץ-עוצר-רץ בלי זה (MBMOVE.arrive ב-moba-move.js)
  const v=Math.min(mbSpeed(u),d/MBMOVE.arrive),k=Math.min(1,v*dt/d);mbStep(u,dx*k,dy*k);u.moving=v>MBMOVE.creep;u.face=Math.atan2(dy,dx);
}
// תקיפה אוטומטית: A הוא atk של הערכה, או של החייל
function mbAttack(u,dt,t,A){
  if(!t||u.st.stun>0||t.dead)return false;
  if(mbDist(u,t)-t.r-u.r>A.range)return false;
  u.aim=Math.atan2(t.y-u.y,t.x-u.x);if(!u.moving)u.face=u.aim;
  if(u.atkT>0)return true;
  u.atkT=A.cd*(u.st.rage>0?u.st.rageCd:1);
  const d=A.dmg*(u.k==='hero'?mbK(u):1)*(u.k==='minion'&&(t.k==='tower'||t.k==='base')?MOBA.minion.build*(t.k==='base'?MOBA.base.minK:1):1);   // build: חיילים מכים חזק במבנים. בבסיס פחות (minK)
  if(A.shot)MB.shots.push({kind:'home',x:u.x,y:u.y-14,tgt:t,team:u.team,src:u,dmg:d,dt:A.dt,sp:MOBA.shot});
  else{const got=mbDmg(u,t,d,A.dt);if(A.leech)u.hp=Math.min(u.max,u.hp+got*A.leech);if(A.slow)mbSlow(t,A.slow.k,A.slow.t)}
  if(u.me){if(A.shot){P.gn.t=0.3;sfx('shoot')}else{P.sw.anim=0.2;P.sw.ang=u.aim;sfx('hit')}}
  return true;
}
// על מי תוקפים אוטומטית: הקרוב בטווח, גיבור קצת לפני חייל, ומבנה רק כשאין אחר. מי שהוכרח תוקף רק את הנפח
function mbAutoTarget(u,range){
  if(u.st.taunt>0&&u.st.tBy&&!u.st.tBy.dead)return u.st.tBy;
  let best=null,bs=1e9;
  for(const o of MB.u){if(o.team===u.team||o.dead||!mbHittable(o))continue;
    const d=mbDist(u,o)-o.r-u.r;if(d>range)continue;
    const s=d+(o.k==='tower'||o.k==='base'?400:0)-(o.k==='hero'?30:0);if(s<bs){bs=s;best=o}}
  return best;
}

/* ---- אזורים מסומנים, חומות, יריות ואפקטים ---- */
// אזור שמסומן על הרצפה delay שניות לפני שהוא פוגע, כדי שאפשר לצאת ממנו. o.t: כמה זמן הוא נשאר אחרי (גשם חצים)
function mbZone(u,x,y,r,delay,fire,look,o={}){MB.zones.push({x,y,r,delay,t0:delay,team:u.team,src:u,fire,look,dur:o.t||0,tick:o.tick,left:o.t||0})}
function mbWall(u,x,s){
  const w={x,team:u.team,t:s.t};MB.walls.push(w);
  for(const o of MB.u)if(o.team!==u.team&&!o.dead&&(o.k==='hero'||o.k==='minion')&&Math.abs(o.x-x)<70){
    const side=Math.sign(o.x-u.x)||1;o.x=x+side*(o.r+4);mbPush(o,side>0?0:Math.PI,s.push);mbCC(o,'stun',s.stun,u)}
  mbBoom(x,0,90,'earth');S.shake=Math.max(S.shake,6);
}
// הודעה של המובה: למעלה (CSS תחת .mb), ואותה הודעה לא חוזרת תוך שנייה וחצי
// הודעה חדשה לא קוטעת את הקודמת לפני MOBA.msgMin שניות: מחכה בתור (עד 2), ואז מחליפה אותה
function mbBanner(txt,col){const now=performance.now(),Q=mbBanner.q||(mbBanner.q=[]);if(mbBanner.t===txt&&now-mbBanner.at<1500||Q.some(m=>m.txt===txt))return;
  const wait=mbBanner.at?mbBanner.at+MOBA.msgMin*1000-now:0;
  if(wait<=0&&!Q.length){mbBanner.t=txt;mbBanner.at=now;banner(txt,col);return}
  Q.push({txt,col});if(Q.length>2)Q.shift();if(!mbBanner.tm)mbBanner.tm=setTimeout(mbBannerNext,Math.max(0,wait))}
function mbBannerNext(){mbBanner.tm=null;const m=(mbBanner.q||[]).shift();if(!m||!S.mb)return(mbBanner.q=[]);mbBanner.t=m.txt;mbBanner.at=performance.now();banner(m.txt,m.col);
  if(mbBanner.q.length)mbBanner.tm=setTimeout(mbBannerNext,MOBA.msgMin*1000)}
function mbShake(slot){const b=document.querySelector('#mbSk [data-sk="'+slot+'"]');if(!b)return;b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');sfx('tap')}
const mbFloat=(x,y,txt,col)=>{if(MB.floats.length<60)MB.floats.push({x,y,txt:String(txt),col,life:0.9})};
function mbWord(u,w){mbFloat(u.x,u.y-u.r-34,T('mb.w.'+w),w==='shock'?'#D46BFF':w==='freeze'?C.tide:w==='taunt'?C.ember:C.blood)}
function mbBoom(x,y,r,t){if(MB.fx.length<40)MB.fx.push({x,y,r,col:t==='heal'?'#7BD88F':t==='blue'?MOBA.team[0]:t==='red'?MOBA.team[1]:dtCol(t),life:0.45})}

/* ---- המשחק ---- */
function mobaStart(kit){
  if(typeof menuEnd==='function')menuEnd();
  $('ovMoba').hidden=true;
  if(typeof villageUi==='function')villageUi(false);if(typeof worldUi==='function')worldUi(false);
  reset();S.mode='play';
  MB=S.mb={t:0,u:[],shots:[],zones:[],walls:[],fx:[],floats:[],queue:[],waveT:MOBA.minion.first,score:[0,0],over:false,keys:{},order:null};
  // הקבוצות: השחקן ושני בוטים מול שלושה. בכל קבוצה מישהו מקדימה (נפח או לוחם)
  const all=Object.keys(MBKIT),team=(first)=>{
    let t=first?[first]:[];const rest=all.filter(k=>!t.includes(k)).sort(()=>Math.random()-0.5);
    while(t.length<3)t.push(rest.shift());
    if(!t.some(k=>MBKIT[k].front)){const f=all.filter(k=>MBKIT[k].front&&!t.includes(k));t[2]=pick(f)}
    return t};
  const blue=team(kit),red=team(null);
  blue.forEach((k,i)=>MB.u.push(mbHero(k,0,i===0,i)));
  red.forEach((k,i)=>MB.u.push(mbHero(k,1,false,i)));
  MB.me=MB.u[0];$('mbFeed').innerHTML='';
  for(const tm of [0,1]){for(const x of MOBA.towers)MB.u.push(mbBuild(tm,'tower',x));MB.u.push(mbBuild(tm,'base',MOBA.base.x))}
  const me=MB.me;P.weapon=MBKIT[me.kit].atk.shot?'gun':'sword';P.x=me.x;P.y=me.y;P.face=P.aim=0;S.cam.x=P.x;S.cam.y=P.y;
  ['ovStart','ovOver','ovLevel','ovBoss'].forEach(id=>{const e=$(id);if(e)e.hidden=true});
  mbUi(true);mbBanner(T('mb.start'),C.gold);
  let n=0;try{n=+localStorage.getItem('fh-mb-tips')||0;localStorage.setItem('fh-mb-tips',n+1)}catch(e){}
  if(n<MOBA.tips){const m=MB;setTimeout(()=>{if(S.mb===m)mbBanner(T('mb.tip'),C.chalk)},2200)}   // טיפ לשחקן חדש: בשלושת המשחקים הראשונים
}
function mobaUpdate(dt){
  const M=MB;if(!M||M.over)return;
  M.t+=dt;S.t=M.t;S.shake=Math.max(0,S.shake-dt*30);
  if(M.order){M.order.t-=dt;if(M.order.t<=0)M.order=null}
  // גלי חיילים
  M.waveT-=dt;if(M.waveT<=0){M.waveT=MOBA.minion.every;for(const tm of [0,1])for(let i=0;i<MOBA.minion.count;i++)M.queue.push({team:tm,ranged:i===MOBA.minion.count-1,at:M.t+i*MOBA.minion.gap,k:1+MOBA.minion.grow*M.t/60+MOBA.minion.push*M.u.filter(o=>o.k==='tower'&&o.team!==tm&&o.dead).length})}
  for(const q of M.queue)if(q.at<=M.t){q.done=true;const N=MOBA.minion,R=q.ranged?N.ranged:N;
    M.u.push(mbUnit({k:'minion',team:q.team,ranged:q.ranged,type:'mb_m'+q.team,x:(q.team?1:-1)*(MOBA.base.x-70),y:rand(-25,25),lane:rand(-70,70),r:N.r,hp:R.hp*q.k,max:R.hp*q.k,pow:q.k,speed:N.speed,face:q.team?Math.PI:0}))}
  M.queue=M.queue.filter(q=>!q.done);
  for(const u of M.u){
    if(u.dead){if(u.k==='hero'){u.resp-=dt;if(u.resp<=0){u.dead=false;u.hp=u.max;u.x=u.home.x;u.y=u.home.y;u.cd.s1=u.cd.s2=0;mbFeelReset(u)}}continue}
    mbTick(u,dt);if(u.dead)continue;
    if(u.st.dash){const D=u.st.dash,s=Math.min(D.left,D.sp*dt);mbStep(u,D.vx*s,D.vy*s);D.left-=s;u.moving=true;if(D.left<=0.5){u.st.dash=null;D.end()}continue}
    if(u.k==='hero'){for(const k of MB_SLOTS)if(u.cd[k]>0)u.cd[k]-=dt;u.atkT-=dt;u.aggro-=dt;u.me&&!u.bot?mbPlayer(u,dt):mbBot(u,dt)}
    else if(u.k==='minion'){u.atkT-=dt;mbMinion(u,dt)}
    else mbTower(u,dt);
  }
  mbFeel(M,dt);   // גיבורים וחיילים לא עומדים אחד בתוך השני, וסיבוב ואנימציה רכים (moba-move.js)
  mbShots(dt);
  for(const z of M.zones){
    if(z.delay>0){z.delay-=dt;if(z.delay<=0&&z.fire)z.fire(z)}
    else if(z.tick){z.tick(z,dt);z.left-=dt}
  }
  M.zones=M.zones.filter(z=>z.delay>0||(z.tick&&z.left>0));
  for(const w of M.walls)w.t-=dt;M.walls=M.walls.filter(w=>w.t>0);
  for(const f of M.fx)f.life-=dt;M.fx=M.fx.filter(f=>f.life>0);
  for(const f of M.floats){f.life-=dt;f.y-=dt*28}M.floats=M.floats.filter(f=>f.life>0);
  M.u=M.u.filter(u=>!(u.dead&&u.k==='minion'));
  enemies=M.u.filter(u=>!u.me&&(u.k==='hero'||u.k==='minion'));   // רק בשביל התלת-ממד
  // השחקן P עוקב אחרי הגיבור שלו, בשביל המצלמה והמודל בתלת-ממד
  const me=M.me;P.x=me.x;P.y=me.y;P.hp=me.hp;P.maxHp=me.max;P.moving=mbMoving(me);P.face=mbRot(me);P.aim=me.aim;
  if(P.moving)P.walk+=dt*(me.vs||0)*0.07;P.sw.anim=Math.max(0,P.sw.anim-dt);P.gn.t=Math.max(0,P.gn.t-dt);P.inv=me.dead?1:0;
  if(M.t>=MOBA.maxT){const left=tm=>M.u.filter(o=>o.team===tm&&(o.k==='tower'||o.k==='base')).reduce((s,o)=>s+o.hp/o.max,0);mbEnd(left(0)>=left(1))}
}
function mbTick(u,dt){
  const s=u.st,hero=u.k==='hero';
  if(s.stun>0){s.stun-=dt;if(s.stun<=0){s.ice=0;if(hero)s.imm=MOBA.ccImmune}}
  else if(s.taunt>0){s.taunt-=dt;if(s.taunt<=0||!s.tBy||s.tBy.dead){s.taunt=0;if(hero)s.imm=MOBA.ccImmune}}
  else if(s.imm>0)s.imm-=dt;
  for(const k of ['slow','wet','armor','rage'])if(s[k]>0)s[k]-=dt;
  if(s.burn>0){s.burn-=dt;u.hp-=s.burnD*dt;if(u.hp<=0)mbDie(u,s.burnBy)}
  u.flash-=dt;
}
function mbPlayer(u,dt){
  let ix=0,iy=0;if(joy){ix=joy.dx;iy=joy.dy}
  if(keys.KeyA||keys.ArrowLeft)ix-=1;if(keys.KeyD||keys.ArrowRight)ix+=1;if(keys.KeyW||keys.ArrowUp)iy-=1;if(keys.KeyS||keys.ArrowDown)iy+=1;
  const m=Math.hypot(ix,iy);if(m>1){ix/=m;iy/=m}
  if(u.st.taunt>0&&u.st.tBy)mbMove(u,u.st.tBy.x,u.st.tBy.y,dt,u.r+u.st.tBy.r);
  else if(u.st.stun>0)u.moving=false;
  else if(m>0.12){const sp=mbSpeed(u)*dt;mbStep(u,ix*sp,iy*sp);u.moving=true;u.face=Math.atan2(iy,ix)}
  else u.moving=false;
  const A=MBKIT[u.kit].atk;mbAttack(u,dt,mbAutoTarget(u,A.range),A);
  // מקלדת: 1/2/3 או Q/E/R
  [['Digit1','KeyQ'],['Digit2','KeyE'],['Digit3','KeyR']].forEach((ks,i)=>{const on=ks.some(k=>keys[k]);if(on&&!MB.keys[i])mbPress(MB_SLOTS[i]);MB.keys[i]=on});
  [['KeyF','attack'],['KeyG','back']].forEach(([k,o])=>{if(keys[k]&&!MB.keys[k])mbOrder(o);MB.keys[k]=keys[k]});   // F: התקפה, G: נסיגה
}
// כפתור סקיל של השחקן: מכוון לבד. אל הגיבור הקרוב בטווח, אחרת חייל, אחרת קדימה
function mbAimFor(u,s){
  const foes=MB.u.filter(o=>o.team!==u.team&&!o.dead&&(o.k==='hero'||o.k==='minion'));
  const range=(s.range||200)*1.15;
  return mbNearest(u,foes.filter(o=>o.k==='hero'),range)||mbNearest(u,foes,range)||null;
}
function mbPress(slot,pt){   // pt: נקודה או יחידה מהכיוון בגרירה (moba-aim.js). בלי pt: כיוון אוטומטי
  const u=mbMe();if(!u||u.dead||MB.over)return;
  const s=MBKIT[u.kit][slot];
  if(slot==='ult'&&u.lvl<MOBA.ultAt){mbShake(slot);return}   // נעול: הכפתור רועד, בלי הודעה באמצע המסך (הבודק, 2.11)
  if(u.cd[slot]>0)return;
  const aim=pt!==undefined?pt:s.kind==='self'||s.kind==='away'?null:mbAimFor(u,s)||(s.kind==='point'?{x:u.x+Math.cos(u.face)*(s.range||200)*0.6,y:u.y+Math.sin(u.face)*(s.range||200)*0.6}:null);
  mbCast(u,slot,aim);
}
// פקודה לשני הבוטים החברים (אוראל, docs/moba.md שלב 4): "התקפה" אל המקום שלך, או "נסיגה" אל המגדל. נמשכת MOBA.order שניות
function mbOrder(kind){
  const me=mbMe();if(!me||MB.over||!MOBA.order[kind])return;
  MB.order={kind,t:MOBA.order[kind],x:me.x,y:me.y};sfx('tap');
  for(const h of mbHeroes(0))if(h!==me&&!h.dead){h.bot.t=0;mbWord(h,kind==='attack'?'go':'back')}
  mbBoom(me.x,me.y,80,kind==='attack'?'red':'blue');
  for(const b of document.querySelectorAll('#mbPing [data-o]'))b.classList.toggle('on',b.dataset.o===kind);
}
function mbMinion(m,dt){
  if(m.st.stun>0){m.moving=false;return}
  const N=MOBA.minion,A={dmg:(m.ranged?N.ranged.dmg:N.dmg)*(m.pow||1),range:m.ranged?N.ranged.range:N.range,cd:N.cd,dt:'physical',shot:m.ranged};
  let t=m.st.taunt>0?m.st.tBy:m.tgt;
  if(!(m.st.taunt>0)){m.retT=(m.retT||0)-dt;
    if(!t||t.dead||!mbHittable(t)||mbDist(m,t)>N.aggro+120||m.retT<=0){m.retT=0.5;t=null;let bd=1e9;
      for(const o of MB.u){if(o.team===m.team||o.dead||!mbHittable(o))continue;const d=mbDist(m,o)-o.r;if(d>N.aggro)continue;
        const s=d+(o.k==='hero'?60:0)+(o.k==='tower'||o.k==='base'?120:0);if(s<bd){bd=s;t=o}}
      m.tgt=t}}
  if(t){if(mbDist(m,t)-t.r-m.r>A.range)mbMove(m,t.x,t.y,dt);else{m.moving=false;mbAttack(m,dt,t,A)}}
  else mbMove(m,(m.team?-1:1)*MOBA.base.x,m.lane,dt);
}
function mbTower(b,dt){
  const B=b.k==='base'?MOBA.base:MOBA.tower;b.shotT-=dt;
  const ok=o=>o&&!o.dead&&o.team!==b.team&&(o.k==='hero'||o.k==='minion')&&mbDist(o,b)<B.range+o.r;
  let t=b.tgt;
  const ag=MB.u.find(o=>o.k==='hero'&&o.aggro>0&&ok(o)&&MB.u.some(h=>h.k==='hero'&&h.team===b.team&&!h.dead&&mbDist(h,b)<B.range+60));
  if(ag)t=ag;
  if(!ok(t)){t=null;let bd=1e9;for(const o of MB.u){if(!ok(o))continue;const d=mbDist(o,b)+(o.k==='hero'?300:0);if(d<bd){bd=d;t=o}}}
  b.tgt=t;
  if(t&&b.shotT<=0){b.shotT=B.cd;MB.shots.push({kind:'home',x:b.x,y:b.y-60,tgt:t,team:b.team,src:b,dmg:B.dmg*(t.k==='hero'?MOBA.tower.hero:1),dt:'physical',sp:MOBA.tower.shot,big:true})}
  if(b.k==='base')for(const h of MB.u)if(h.k==='hero'&&h.team===b.team&&!h.dead&&mbDist(h,b)<B.healR)h.hp=Math.min(h.max,h.hp+h.max*B.heal*dt);
}
function mbShots(dt){
  for(const s of MB.shots){
    if(s.kind==='home'){const t=s.tgt;if(!t||t.dead){s.gone=true;continue}
      const dx=t.x-s.x,dy=t.y-14-s.y,d=Math.hypot(dx,dy)||1,st=s.sp*dt;
      if(d<st+t.r*0.6){s.gone=true;mbDmg(s.src,t,s.dmg,s.dt);continue}
      s.vx=dx/d*s.sp;s.vy=dy/d*s.sp;s.x+=dx/d*st;s.y+=dy/d*st;
    }else{const ox=s.x;s.x+=s.vx*dt;s.y+=s.vy*dt;s.left-=Math.hypot(s.vx,s.vy)*dt;if(s.left<=0)s.gone=true;
      for(const w of MB.walls)if(w.team!==s.team&&(ox-w.x)*(s.x-w.x)<=0)s.gone=true;   // החומה עוצרת חצים
      for(const o of MB.u){if(o.team===s.team||o.dead||s.hit.has(o)||(o.k!=='hero'&&o.k!=='minion'))continue;
        if(Math.hypot(o.x-s.x,o.y-s.y)<s.w/2+o.r){s.hit.add(o);s.on(o)}}}
  }
  MB.shots=MB.shots.filter(s=>!s.gone);
}
function mbEnd(won){
  if(MB.over)return;MB.over=true;S.mode='over';S.won=won;
  sfx(won?'celebrate':'hurt');if(won)celebrate(P.x,P.y,'rank');
  const m=MB;setTimeout(()=>{if(S.mb===m)mbEndShow(won)},1400);
}
function mobaExit(){
  $('ovMoba').hidden=true;mbUi(false);MB=null;
  if(typeof heroId==='function'&&heroId())enterVillage();
  else{reset();$('ovStart').hidden=false}
}

/* ---- ממשק ---- */
function mbUi(on){
  document.body.classList.toggle('mb',on);$('mbHud').hidden=!on;$('mbSk').hidden=!on;
  if(on){const u=mbMe();$('mbSk').innerHTML=MB_SLOTS.map(k=>{const s=MBKIT[u.kit][k],col=dtCol(s.dt||MBKIT[u.kit].dt);
    return '<button class="skb mbskb" data-sk="'+k+'" style="--dt:'+col+'" aria-label="'+T('mb.s.'+s.id)+'">'+mbSvg(s.id)+'<i></i><b class="mblock" hidden>'+MOBA.ultAt+'</b></button>'}).join('');
    for(const b of document.querySelectorAll('#mbPing [data-o] b'))b.innerHTML=mbSvg(b.parentNode.dataset.o,'mbpi');   // פקודות: אייקונים במקום אימוג'י
    mbAimInit($('mbSk'))}   // נגיעה, גרירה לכיוון וביטול (moba-aim.js)
}
// הודעת הריגה: מי הפיל את מי, בצבעי הקבוצות. עד MOBA.feed.max שורות, וכל אחת נעלמת אחרי MOBA.feed.t שניות
function mbKillFeed(by,t){
  const f=$('mbFeed');if(!f||!t)return;
  const who=(u,team)=>u&&u.k==='hero'?'<span class="mbfh t'+u.team+'">'+mbSvg('k_'+u.kit)+'<em>'+(u.me?T('mb.you'):T('mb.k.'+u.kit))+'</em></span>'
    :'<span class="mbfh t'+team+'"><em>'+T('mb.f.'+(u&&MOBA.feed.src.includes(u.k)?u.k:'minion'))+'</em></span>';
  const row=document.createElement('p');row.className='mbfr'+(t.me||by&&by.me?' mine':'');row.innerHTML=who(by,1-t.team)+mbSvg('k_warrior','mbfx')+who(t,t.team).replace('mbfh','mbfh v');
  f.appendChild(row);while(f.children.length>MOBA.feed.max)f.firstChild.remove();
  setTimeout(()=>row.remove(),MOBA.feed.t*1000);
}
let mbHudKey='',mbOrdKey=null,mbRespT=0;
function mobaHud(){
  const M=MB,u=M&&M.me;if(!u)return;
  const hp=Math.max(0,u.hp)/u.max;$('mbHp').style.width=(100*hp)+'%';
  const N=MOBA.xp.need,lo=N[u.lvl-1]||0,hi=N[u.lvl];$('mbXp').style.width=(u.lvl>=MOBA.ultAt?100:100*(u.xp-lo)/(hi-lo))+'%';
  if(u.dead){mbRespT=Math.max(mbRespT,u.resp);$('mbRespBar').style.width=(100*Math.max(0,u.resp)/(mbRespT||1))+'%'}else mbRespT=0;   // הפס מתרוקן עד שחוזרים
  const key=LANG+'|'+u.kit+'|'+u.lvl+'|'+M.score+'|'+fmt(M.t)+'|'+(u.dead?Math.ceil(u.resp):'')+'|'+Math.ceil(u.hp);
  if(key!==mbHudKey){mbHudKey=key;$('mbLv').textContent=u.lvl;$('mbS0').textContent=M.score[0];$('mbS1').textContent=M.score[1];$('mbClock').textContent=fmt(M.t);
    $('mbHpN').textContent=Math.ceil(Math.max(0,u.hp))+' / '+u.max;$('mbHpBar').classList.toggle('low',hp<0.3);
    const p=$('mbPor');if(p.dataset.kit!==u.kit){p.dataset.kit=u.kit;p.innerHTML=mbSvg('k_'+u.kit)}   // הדמות שלי: האייקון של הערכה
    const r=$('mbResp');r.hidden=!u.dead;if(u.dead)$('mbRespN').textContent=Math.ceil(u.resp)}
  const ok=M.order?M.order.kind:'';if(mbOrdKey!==ok){mbOrdKey=ok;for(const b of document.querySelectorAll('#mbPing [data-o]'))b.classList.toggle('on',b.dataset.o===ok)}
  for(const b of $('mbSk').querySelectorAll('[data-sk]')){const k=b.dataset.sk,s=MBKIT[u.kit][k],lock=k==='ult'&&u.lvl<MOBA.ultAt;
    b.style.setProperty('--cd',lock?1:Math.max(0,u.cd[k])/s.cd);const l=b.querySelector('.mblock');if(l.hidden===lock)l.hidden=!lock}
}
// חלון הבחירה: ארבע הערכות, בשני טורים לרוחב
function mobaOpen(){
  const w=$('mbWin');
  w.innerHTML=winHead(T('mb.title'),T('mb.sub'))+'<p class="mbgoal">'+T('mb.goal')+'</p><div class="mbkits">'+
    Object.keys(MBKIT).map(k=>{const K=MBKIT[k];return '<button class="mbkit" data-kit="'+k+'" style="--dt:'+dtCol(K.dt)+'"><span class="mbmed">'+mbSvg('k_'+k,'mbki')+'</span><span class="mbkn">'+T('mb.k.'+k)+'</span><small>'+T('mb.r.'+k)+'</small>'+
      '<ul>'+MB_SLOTS.map(s=>'<li style="--dt:'+dtCol(K[s].dt||K.dt)+'">'+mbSvg(K[s].id,'mbli')+'<span>'+T('mb.s.'+K[s].id)+(s==='ult'?' <em>'+T('mb.ult')+'</em>':'')+'</span></li>').join('')+'</ul></button>'}).join('')+'</div>';
  w.dataset.from=$('ovStart').hidden?'':'start';$('ovStart').hidden=true;   // ממסך הפתיחה: חוזרים אליו בסגירה
  $('ovMoba').hidden=false;w.dataset.mode='pick';
}
function mbEndShow(won){
  const w=$('mbWin'),row=u=>'<li class="'+(u.me?'me':'')+'" style="--dt:'+dtCol(MBKIT[u.kit].dt)+'">'+mbSvg('k_'+u.kit,'mbli')+' '+T('mb.k.'+u.kit)+' <small>'+(u.me?T('mb.you'):T('mb.bot'))+'</small><span dir="ltr">'+u.kills+' / '+u.deaths+'</span><span>'+T('mb.lvl',u.lvl)+'</span></li>';
  w.innerHTML=winHead(T(won?'mb.win':'mb.lose'),fmt(MB.t))+'<div class="mbend"><section class="t0"><h4>'+T('mb.blue')+'<b>'+MB.score[0]+'</b></h4><ul>'+mbHeroes(0).map(row).join('')+'</ul></section>'+
    '<section class="t1"><h4>'+T('mb.red')+'<b>'+MB.score[1]+'</b></h4><ul>'+mbHeroes(1).map(row).join('')+'</ul></section></div>'+
    '<p class="mbkd">'+T('mb.kdH')+'</p><div class="mbbtns"><button class="go" data-act="again">'+T('mb.again')+'</button><button class="lang" data-act="home">'+T('mb.home')+'</button></div>';
  $('ovMoba').hidden=false;w.dataset.mode='end';
}
function mobaPickClose(){const w=$('mbWin');if(w.dataset.mode==='end'||S.mb)mobaExit();else{$('ovMoba').hidden=true;if(w.dataset.from==='start')$('ovStart').hidden=false}}
$('mbWin').addEventListener('click',e=>{
  const k=e.target.closest('[data-kit]'),a=e.target.closest('[data-act]');
  if(k){sfx('tap');mobaStart(k.dataset.kit);return}
  if(!a)return;sfx('ui');
  if(a.dataset.act==='close')mobaPickClose();
  else if(a.dataset.act==='again'){mbUi(false);S.mb=MB=null;mobaOpen()}
  else if(a.dataset.act==='home')mobaExit();
});
$('mbExit').onclick=()=>{sfx('ui');mobaExit()};
for(const b of document.querySelectorAll('#mbPing [data-o]'))b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();mbOrder(b.dataset.o)});
$('mbBtn').onclick=()=>{sfx('ui');mobaOpen()};

/* ---- ציור (בקנבס, מעל התלת-ממד). בתלת-ממד הגוף של הגיבורים והחיילים מצויר שם, וכאן רק טבעת, חיים וסימנים ---- */
function mobaDraw(ox,oy){
  const M=MB,L=MOBA.lane,me=M.me,ally=t=>t===me.team;
  // הנתיב
  if(!(typeof mb3dHere==='function'&&mb3dHere()))mbFloor2d();   // הרצפה (moba-look.js). בתלת-ממד היא שם, כטקסטורה (moba3d.js)
  // גיבור מת: גולגולת במקום שבו נפל, עם השניות עד שהוא חוזר
  for(const u of M.u)if(u.k==='hero'&&u.dead&&u.resp>0&&onScreen(u.x+ox,u.y+oy)){const col=MOBA.team[u.team];
    ctx.globalAlpha=0.85;ctx.fillStyle='rgba(14,16,26,0.7)';ctx.beginPath();ctx.ellipse(u.x,u.y,22,10,0,0,7);ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=2;ctx.stroke();
    mbIcon('skull',u.x,u.y-16,24,col);ctx.font='800 13px Heebo, system-ui, sans-serif';ctx.textAlign='center';ctx.direction='ltr';ctx.fillStyle=C.chalk;ctx.fillText(Math.ceil(u.resp),u.x,u.y-34);ctx.direction=DIR;ctx.globalAlpha=1}
  // אזורים מסומנים: שלנו בכחול, של האויב באדום
  for(const z of M.zones){const col=ally(z.team)?MOBA.team[0]:C.blood;
    if(z.delay>0){const k=1-z.delay/z.t0;ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,7);ctx.stroke();
      ctx.globalAlpha=0.28;ctx.fillStyle=col;ctx.beginPath();ctx.arc(z.x,z.y,z.r*k,0,7);ctx.fill();ctx.globalAlpha=1}
    else{ctx.globalAlpha=0.22;ctx.fillStyle=col;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,7);ctx.fill();ctx.globalAlpha=0.8;ctx.strokeStyle=C.chalk;ctx.lineWidth=2;ctx.beginPath();
      for(let i=0;i<8;i++){const a=hash(i,Math.floor(M.t*6))*7,d=hash(Math.floor(M.t*6),i)*z.r,x=z.x+Math.cos(a)*d,y=z.y+Math.sin(a)*d;ctx.moveTo(x,y-14);ctx.lineTo(x,y)}ctx.stroke();ctx.globalAlpha=1}}
  mbAimDraw();   // סימון הכיוון של סקיל בגרירה (moba-aim.js)
  for(const w of M.walls){ctx.fillStyle='#5A5F6E';ctx.fillRect(w.x-10,-L.half,20,L.half*2);ctx.fillStyle=MOBA.team[w.team];ctx.fillRect(w.x-10,-L.half,4,L.half*2);ctx.fillRect(w.x+6,-L.half,4,L.half*2)}
  // יחידות לפי עומק
  const list=M.u.filter(u=>!u.dead&&onScreen(u.x+ox,u.y+oy)).sort((a,b)=>a.y-b.y);
  for(const u of list){
    const col=MOBA.team[u.team];
    if(u.k==='tower'||u.k==='base'){mbDrawBuild(u,col);continue}
    ctx.strokeStyle=col;ctx.lineWidth=u.k==='hero'?3:2;ctx.globalAlpha=0.9;ctx.beginPath();ctx.ellipse(u.x,u.y+2,u.r+4,(u.r+4)*0.45,0,0,7);ctx.stroke();ctx.globalAlpha=1;
    if(u.me){ctx.strokeStyle=C.gold;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(u.x,u.y+2,u.r+9,(u.r+9)*0.45,0,0,7);ctx.stroke()}
    if(!R3D.on||u.me&&!R3D.player){const p=pose(u.x,u.y,u.ph,mbMoving(u),u.aim,10,mbRot(u));drawRig(p,{skin:LOOK.player,col:u.flash>0?'#fff':u.k==='hero'?col:col+'AA',lw:u.k==='hero'?3:2})}
    const s=u.st,top=u.y-(u.k==='hero'?78:52);
    if(s.armor>0){ctx.strokeStyle=C.ember;ctx.lineWidth=3;ctx.globalAlpha=0.6;ctx.beginPath();ctx.arc(u.x,u.y-24,30,0,7);ctx.stroke();ctx.globalAlpha=1}
    if(s.rage>0){ctx.fillStyle='rgba(239,78,87,0.18)';ctx.beginPath();ctx.arc(u.x,u.y-24,28,0,7);ctx.fill()}
    if(s.ice>0){ctx.fillStyle='rgba(70,211,230,0.35)';ctx.beginPath();ctx.arc(u.x,u.y-22,24,0,7);ctx.fill()}
    // חיים, ולגיבור גם הרמה והסמל של הערכה
    const bw=u.k==='hero'?46:24;ctx.fillStyle='#000a';ctx.fillRect(u.x-bw/2-1,top-1,bw+2,u.k==='hero'?7:5);ctx.fillStyle=u.me?'#7BD88F':col;ctx.fillRect(u.x-bw/2,top,bw*Math.max(0,u.hp)/u.max,u.k==='hero'?5:3);
    if(u.k==='hero'){ctx.font='800 12px Heebo, system-ui, sans-serif';ctx.textAlign='center';ctx.direction='ltr';ctx.fillStyle=C.chalk;ctx.fillText(u.lvl,u.x-bw/2-9,top+6);ctx.direction=DIR;mbBadge(u,u.x,top-14)}   // תג הערכה מעל הראש: רואים מי זה (הבודק, 2.11). moba-look.js
    let ic=top-(u.k==='hero'?30:10);   // סימנים מעל הראש: הלם, הכרחה, רטוב (לגיבור מעל הסמל)
    if(s.stun>0&&!s.ice){ctx.fillStyle=C.gold;for(let i=0;i<3;i++){const a=M.t*5+i*2.1;ctx.beginPath();ctx.arc(u.x+Math.cos(a)*12,ic+Math.sin(a)*4,3,0,7);ctx.fill()}ic-=12}
    if(s.taunt>0){ctx.fillStyle=C.ember;ctx.font='900 16px Heebo, system-ui, sans-serif';ctx.textAlign='center';ctx.fillText('!',u.x,ic);ic-=14}
    if(s.wet>0){ctx.fillStyle=dtCol('water');ctx.beginPath();ctx.arc(u.x+16,top-6,4,0,7);ctx.fill()}
  }
  for(const s of M.shots){
    if(s.kind==='home'){const c=s.big?MOBA.team[s.team]:dtCol(s.dt);ctx.fillStyle=c;ctx.globalAlpha=0.35;ctx.beginPath();ctx.arc(s.x,s.y,s.big?11:7,0,7);ctx.fill();ctx.globalAlpha=1;ctx.beginPath();ctx.arc(s.x,s.y,s.big?6:3.5,0,7);ctx.fill()}
    else{const a=Math.atan2(s.vy,s.vx);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(a);ctx.fillStyle=dtCol(s.dt);ctx.globalAlpha=0.75;
      if(s.dt==='water'){ctx.beginPath();ctx.ellipse(0,0,12,s.w/2,0,0,7);ctx.fill()}else{ctx.fillRect(-26,-3,34,6);ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(4,-7);ctx.lineTo(4,7);ctx.fill()}
      ctx.restore();ctx.globalAlpha=1}
  }
  for(const f of M.fx){const k=f.life/0.45;ctx.strokeStyle=f.col;ctx.globalAlpha=k;ctx.lineWidth=6*k+1;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(1.1-k*0.4),0,7);ctx.stroke()}ctx.globalAlpha=1;
  ctx.textAlign='center';ctx.font='800 15px Heebo, system-ui, sans-serif';
  for(const f of M.floats){ctx.globalAlpha=Math.min(1,f.life*2);ctx.direction=/^[+\-]?\d/.test(f.txt)?'ltr':DIR;ctx.fillStyle='#0009';ctx.fillText(f.txt,f.x+1,f.y+1);ctx.fillStyle=f.col;ctx.fillText(f.txt,f.x,f.y)}
  ctx.globalAlpha=1;ctx.direction=DIR;
  drawFx();   // חגיגת רמה (fx.js)
  ctx.setTransform(DPR*ZOOM,0,0,DPR*ZOOM,0,0);
  mbMini(ox,oy);
  if(joy){ctx.strokeStyle='rgba(236,231,220,0.22)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(joy.ox,joy.oy,55,0,7);ctx.stroke();
    ctx.fillStyle='rgba(236,231,220,0.3)';ctx.beginPath();ctx.arc(joy.ox+joy.dx*55,joy.oy+joy.dy*55,22,0,7);ctx.fill()}
}
function mbDrawBuild(b,col){
  const base=b.k==='base',h=base?96:74,w=base?54:30,open=mbHittable(b);
  if(typeof mb3dHere!=='function'||!mb3dHere()){   // בתלת-ממד הגוף מצויר שם (moba3d.js)
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(b.x,b.y+4,w,w*0.4,0,0,7);ctx.fill();
  ctx.fillStyle=b.flash>0?'#fff':'#4A4458';ctx.beginPath();ctx.moveTo(b.x-w*0.7,b.y);ctx.lineTo(b.x-w*0.45,b.y-h);ctx.lineTo(b.x+w*0.45,b.y-h);ctx.lineTo(b.x+w*0.7,b.y);ctx.fill();
  ctx.strokeStyle='#2A2436';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(b.x,b.y-h-(base?34:24));ctx.lineTo(b.x+(base?14:9),b.y-h-6);ctx.lineTo(b.x,b.y-h+4);ctx.lineTo(b.x-(base?14:9),b.y-h-6);ctx.fill();}
  if(!open){ctx.strokeStyle=col+'88';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(b.x,b.y-h/2,w+8,0,7);ctx.stroke();ctx.setLineDash([])}   // מוגן: קודם המגדל שלפניו
  const B=base?MOBA.base:MOBA.tower;
  const me=MB.me,foe=me&&b.team!==me.team&&!me.dead,near=foe&&mbDist(me,b)<B.range+MOBA.warnR;   // מגדל של האויב: טבעת אדומה כשמתקרבים, מלאה כשהוא מכוון אליך (הבודק, 2.11)
  if(near){ctx.strokeStyle=b.tgt===me?C.blood:'rgba(239,78,87,0.55)';ctx.lineWidth=b.tgt===me?3:2;ctx.setLineDash(b.tgt===me?[]:[8,8]);ctx.beginPath();ctx.arc(b.x,b.y,B.range,0,7);ctx.stroke();ctx.setLineDash([])}
  else if(b.tgt&&!b.tgt.dead){ctx.strokeStyle=col+'55';ctx.lineWidth=1.5;ctx.setLineDash([4,6]);ctx.beginPath();ctx.arc(b.x,b.y,B.range,0,7);ctx.stroke();ctx.setLineDash([])}
  const bw=base?84:60,top=b.y-h-(base?48:38);ctx.fillStyle='#000a';ctx.fillRect(b.x-bw/2-1,top-1,bw+2,8);ctx.fillStyle=col;ctx.fillRect(b.x-bw/2,top,bw*b.hp/b.max,6);
}
// מפה קטנה למעלה: כל הנתיב, המבנים, הגיבורים (נקודה גדולה) והחיילים
function mbMini(ox,oy){
  const M=MB,L=MOBA.lane,{x0,y0,mw,mh,a}=mbMiniBox(ox,oy),sx=x=>x0+(x+L.len)/(L.len*2)*mw,sy=y=>y0+mh/2+y/L.half*(mh/2-4);
  ctx.globalAlpha=a;ctx.fillStyle='rgba(18,22,36,0.78)';ctx.fillRect(x0-4,y0-4,mw+8,mh+8);ctx.strokeStyle='rgba(236,231,220,0.25)';ctx.lineWidth=1;ctx.strokeRect(x0-4,y0-4,mw+8,mh+8);
  ctx.strokeStyle='rgba(236,231,220,0.5)';ctx.strokeRect(sx(P.x-W/2),y0-2,(W/(L.len*2))*mw,mh+4);
  if(M.order){ctx.strokeStyle=M.order.kind==='attack'?C.blood:MOBA.team[0];ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx(M.order.x),sy(M.order.y),5+3*Math.sin(M.t*8),0,7);ctx.stroke()}
  for(const u of M.u){if(u.dead)continue;const c=MOBA.team[u.team];ctx.fillStyle=c;
    if(u.k==='tower'||u.k==='base'){const s=u.k==='base'?8:6;ctx.fillRect(sx(u.x)-s/2,sy(0)-s/2,s,s)}
    else if(u.k==='hero'){ctx.beginPath();ctx.arc(sx(u.x),sy(u.y),u.me?4.5:3.5,0,7);ctx.fill();if(u.me){ctx.strokeStyle=C.gold;ctx.lineWidth=1.5;ctx.stroke()}}
    else ctx.fillRect(sx(u.x)-1,sy(u.y)-1,2,2)}
  ctx.globalAlpha=1;
}
