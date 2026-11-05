/* קווסטים צדדיים ולוח מודעות בעולם (משימה ת15. ניר, 5.11.2026: "זה לא סתם grind של XP, זה grind של התקדמות.
   אתה יכול להרוג מפלצות ובוסים, או פשוט להשקיע בהרבה קווסטים").
   1. המקומות (SIDEQ.places): לכל אזור מקומות לחקור ולהגן עליהם. קווסט עם יעד visit או hold (quests.js) מצביע לכאן ב-'<אזור>:<מקום>'.
      באחו המקומות הם ציוני הדרך מהשרטוט (WORLD.map.marks ב-world.js). בשאר האזורים לפי המפה הנוכחית, ואפשר להזיז כאן כשיגדלו.
      מקום של קווסט פעיל מסומן בעולם בעמוד אור, עם שם וחץ בקצה המסך. visit: מגיעים ונספר. hold: עומדים בתוכו n שניות, ולהקות מגיעות (paceSpawn ב-pacing.js).
   2. הדמויות של הקווסטים הצדדיים: שורות ב-WNPC.list (worldnpc.js) עם reg. כאן רק המראה שלהן בתלת-ממד (LOOK3D), מהמודלים של KayKit.
   3. לוח מודעות בכל אזור, ליד השער (QBOARD): 3 משימות מתבנית לפי האזור והרמה. משימה שלקחת מתחלפת מיד בחדשה, ומה שלא נלקח מתחלף ביום חדש.
      כל 5 משימות מהלוח: בונוס. כל משימה היא קווסט רגיל 'qb_<אזור>_<תבנית>' מסוג 'wboard', ולכן נספרת ומקבלת "!" (questmark.js) לבד.
   4. שחקן חלש מדי לפרק הבא: השלט "רמה מומלצת" (curiosity.js) שואל כאן כמה קווסטים פתוחים באזור (sqOpenCount) ואיפה הקרוב (sqNearest).
   החיבור: sqUpdate ב-wnpcUpdate, sqDraw ו-qbDrawBoard ב-drawWnpcs, sqScreen ב-drawWnpcScreen (worldnpc.js). נשמר ב-SAVE.qboard.
   הטקסטים ב-lang.js תחת 'sq.' ו-'q.qb*'. נטען אחרי render3d.js, כי הוא מוסיף ל-LOOK3D */

const SIDEQ={
  visitR:120,        // כמה קרוב למקום זה "הגעת"
  hold:{r:170,every:7,n:[2,3],dist:300},   // להגן: רדיוס, כל כמה שניות להקה, כמה בכל להקה, ומאיזה מרחק היא מגיעה
  col:'#7FE0C2',     // עמוד האור והחץ למקום
  // המקומות. באחו: כל ציוני הדרך מהשרטוט (נוספים לבד למטה), ועוד כמה
  places:{
    meadow:{},
    lake:  {},   // האגם הגדול (map-lake.js): ציוני הדרך שלו נוספים לבד למטה
    ridge: {crevasse:{x:-120,y:-160},camp:{x:620,y:300},pines:{x:-560,y:-260},cliff:{x:-300,y:520}},
    desert:{bones:{x:-120,y:420},cacti:{x:-560,y:-300},nest:{x:700,y:460},lava:{x:140,y:-170}},
    storm: {twrW:{x:-620,y:-230},twrS:{x:-380,y:430},twrE:{x:300,y:-230},rocks:{x:640,y:120},dead:{x:-560,y:-80}},
    shadow:{hall:{x:-640,y:200},abyss:{x:-460,y:-200},groveW:{x:-560,y:-300},groveE:{x:560,y:-320},void:{x:700,y:240}}
  },
  // המראה בתלת-ממד לפי המודל (look ב-WNPC.list)
  looks:{knight:{h:64,foot:14},ranger:{h:58,foot:13,own:false},barbarian:{h:62,foot:14,own:false},mage:{h:60,foot:13},rogue:{h:58,foot:13}}
};
// אזור עם מפה גדולה (האחו, האגם): המקומות הם ציוני הדרך שלה (marks), בשמות קבועים
for(const reg of ['meadow',...Object.keys(WORLD.regions)]){const R=reg==='meadow'?WORLD:WORLD.regions[reg],M=R&&R.map;
  if(M&&M.marks&&SIDEQ.places[reg])for(const m of M.marks)SIDEQ.places[reg][m.id]=SIDEQ.places[reg][m.id]||{x:m.x,y:m.y}}

const QBOARD={
  offers:3,          // כמה משימות על כל לוח
  maxActive:3,       // כמה משימות מלוח אחד אפשר להחזיק בבת אחת
  streak:5,          // כל כמה משימות מהלוח יש בונוס
  bonus:{gem:1,essence:3},
  // איפה הלוח: באחו ליד השער לכפר, ובשאר האזורים ליד השער שממנו נכנסים
  at:{meadow:{x:110,y:-1740},lake:{x:150,y:-1690},other:{x:-90,y:-520}},
  // מה האזור מציע: משאבים לאסוף (כמה בבסיס), ומשאב בפרס
  regs:{
    meadow:{res:{wood:15,stone:12,copper:5,herb:6},prize:'iron',fish:true},
    lake:  {res:{aquaC:4,herb:8},prize:'aquaC',fish:true},
    ridge: {res:{sapphireC:4,wood:12},prize:'sapphireC'},
    desert:{res:{rubyC:4,herb:8},prize:'rubyC'},
    storm: {res:{boltC:4,dust:5},prize:'boltC'},
    shadow:{res:{dust:5,essence:4},prize:'essence'}
  },
  /* התבניות. כל אחת בונה יעד לפי האזור (c) והרמה (lv). xp: איזה חלק מרמה שלמה (rankNeed ב-ranks.js) */
  tpl:{
    hunt: {xp:0.4,obj:(c,lv)=>[{type:'kill',what:pick(c.foes),n:Math.min(20,8+Math.floor(lv/4))}]},
    cull: {xp:0.45,obj:(c,lv)=>[{type:'kill',what:'any',n:Math.min(60,25+lv)}]},
    gather:{xp:0.35,obj:(c,lv)=>{const r=pick(Object.keys(c.res));return[{type:'gather',what:r,n:c.res[r]+Math.floor(lv/10)}]}},
    scout:{xp:0.4,obj:c=>{const p=Object.keys(c.places).sort(()=>Math.random()-0.5);return p.slice(0,2).map(id=>({type:'visit',what:c.reg+':'+id,n:1}))}},
    guard:{xp:0.55,obj:(c,lv)=>[{type:'hold',what:c.reg+':'+pick(Object.keys(c.places)),n:25+Math.min(15,Math.floor(lv/4))}]},
    fish: {xp:0.35,only:'fish',obj:()=>[{type:'fish',what:'any',n:3}]}
  }
};

/* ---- הדמויות: מראה בתלת-ממד, והלוחות כדמויות בלי גוף ---- */
for(const reg in QBOARD.regs)WNPC.list['qb_'+reg]={reg,at:QBOARD.at[reg]||QBOARD.at.other,col:'#C9A26B',board:true};
(function(){if(typeof LOOK3D==='undefined')return;
  for(const id in WNPC.list){const N=WNPC.list[id],B=SIDEQ.looks[N.look];if(!B||LOOK3D['npc_'+id])continue;
    LOOK3D['npc_'+id]=Object.assign({model:N.look,tint:N.col,anim:{...NPC_ANIM,idle:N.look==='knight'||N.look==='ranger'?'Idle_B':'Idle_A'}},B)}})();

/* ---- הלוח: הקווסטים שלו נכנסים לטבלה, אחד לכל אזור ותבנית ---- */
QUESTS.kinds.wboard={talk:true,repeat:true,can:q=>qbCan(q),onClaim:q=>qbClaimed(q)};
const qbId=(reg,t)=>'qb_'+reg+'_'+t;
for(const reg in QBOARD.regs)for(const t in QBOARD.tpl){if(QBOARD.tpl[t].only&&!QBOARD.regs[reg][QBOARD.tpl[t].only])continue;
  const q={id:qbId(reg,t),giver:'qb_'+reg,kind:'wboard',reg,tpl:t,obj:[{type:'kill',what:'any',n:1}],reward:{xp:1}};QUESTS.list.push(q);QBY[q.id]=q}
// טקסטים: כל לוח מדבר כמו "לוח המודעות", וכל משימה לפי התבנית שלה
for(const reg in QBOARD.regs){for(const k of ['','.new','.ready','.busy','.idle'])TEXT['npc.qb_'+reg+k]=TEXT['npc.qboard'+k];
  for(const t in QBOARD.tpl)TEXT['q.'+qbId(reg,t)]=TEXT['q.qb.'+t]}

const QB=()=>{const s=SAVE.qboard&&typeof SAVE.qboard==='object'?SAVE.qboard:(SAVE.qboard={});s.r=s.r||{};s.n=s.n||0;return s};
const qbR=reg=>QB().r[reg]||(QB().r[reg]={offer:[],p:{},day:''});
// מה יש באזור: סוגי האויבים (בלי יצורי משאבים) והמקומות
function qbCtx(reg){
  const R=reg==='meadow'?WORLD:WORLD.regions[reg],foes=[];
  for(const G of R.foes)if(!G.creature&&!G.guard&&ETYPES[G.type]&&!foes.includes(G.type))foes.push(G.type);
  return Object.assign({reg,foes:foes.length?foes:['grunt'],places:SIDEQ.places[reg]},QBOARD.regs[reg]);
}
const qbLv=()=>Math.max(1,heroLv());
// משימה חדשה מתבנית: היעד, והפרס לפי הרמה
function qbMake(reg,t){
  const c=qbCtx(reg),lv=qbLv(),T0=QBOARD.tpl[t],need=rankNeed(Math.min(lv,RANKS.xp.max-1));
  return{obj:T0.obj(c,lv),reward:{xp:Math.round(need*T0.xp),coins:20+lv*2,[c.prize]:2+Math.floor(lv/15)}};
}
// הנתונים של היום נכנסים לשורות בטבלה (גם אחרי טעינה מחדש)
function qbApply(){if(typeof SAVE==='undefined'||!SAVE)return;for(const reg in QB().r){const P0=QB().r[reg].p;for(const t in P0){const q=QBY[qbId(reg,t)];if(q){q.obj=P0[t].obj.map(o=>({...o}));q.reward={...P0[t].reward}}}}}
const qbActive=reg=>Object.keys(QBOARD.tpl).filter(t=>QS().active[qbId(reg,t)]);
const qbCan=q=>qbR(q.reg).offer.includes(q.tpl)&&qbActive(q.reg).length<QBOARD.maxActive;
/* הלוח מתמלא: יום חדש מחליף את מה שלא נלקח, ומשימה שנלקחה יורדת מהלוח ובמקומה עולה חדשה */
function qbSync(reg){
  if(!QBOARD.regs[reg])return;const B=qbR(reg),day=qDay(),act=qbActive(reg);
  if(B.day!==day){B.day=day;for(const t of B.offer)if(!act.includes(t))delete B.p[t];B.offer=[]}
  B.offer=B.offer.filter(t=>!act.includes(t)&&QBY[qbId(reg,t)]);
  const free=Object.keys(QBOARD.tpl).filter(t=>QBY[qbId(reg,t)]&&!B.offer.includes(t)&&!act.includes(t)).sort(()=>Math.random()-0.5);
  free.sort((a,b)=>(a===B.last)-(b===B.last));   // מה שהרגע סיימת עולה אחרון, כדי שלא יחזור מיד
  while(B.offer.length<QBOARD.offers&&free.length){const t=free.shift();B.p[t]=qbMake(reg,t);B.offer.push(t)}
  qbApply();
}
// אחרי שלקחת פרס על משימה מהלוח: היא יורדת, וכל streak משימות בונוס
function qbClaimed(q){
  const B=qbR(q.reg),S0=QB();delete B.p[q.tpl];B.last=q.tpl;S0.n++;
  if(S0.n%QBOARD.streak===0){for(const k in QBOARD.bonus)bagAdd(k,QBOARD.bonus[k]);banner(T('sq.streak',S0.n),C.gold);celebrate(P.x,P.y-10,'rank')}
  qbSync(q.reg);saveNow();
}

/* ---- המקומות ---- */
const sqPlace=w=>{const [r,id]=String(w).split(':');const p=(SIDEQ.places[r]||{})[id];return p?{reg:r,id,x:p.x,y:p.y}:null};
const sqPlaceName=w=>T('sq.pl.'+String(w).replace(':','.'));
// היעדים הפעילים באזור הנוכחי שמחכים למקום: [{q,i,o,p}]
function sqTargets(){
  if(!S.wd)return[];const out=[],Q=QS();
  for(const id in Q.active){const q=QBY[id];if(!q)continue;
    q.obj.forEach((o,i)=>{if(o.type!=='visit'&&o.type!=='hold'&&o.type!=='escort')return;const p=sqPlace(o.what);if(o.type==='escort'&&!(S.wd.esc&&S.wd.esc.qid===q.id))return;if(p&&p.reg===S.wd.reg&&qProg(q,i)<o.n)out.push({q,i,o,p})})}   // ליווי: היעד מסומן רק כשהיא כבר בדרך
  return out;
}
/* ---- כל פריים בעולם (מ-wnpcUpdate) ---- */
function sqUpdate(dt){
  const W=S.wd;if(!W)return;
  if(QBOARD.regs[W.reg]&&((W.qbT=(W.qbT||0)-dt)<=0)){W.qbT=1;qbSync(W.reg)}   // פעם בשנייה: הלוח באזור מתמלא
  escUpdate(dt);   // ליווי דמות (escort.js)
  const H=W.sqHold||(W.sqHold={acc:0,spawn:0,key:null});let inHold=null;
  for(const t of sqTargets()){const d=Math.hypot(P.x-t.p.x,P.y-t.p.y);
    if(t.o.type==='visit'&&d<SIDEQ.visitR){questEvent('visit',t.o.what);sparks(t.p.x,t.p.y,SIDEQ.col,18,200);sfx('ui')}
    else if(t.o.type==='hold'&&d<SIDEQ.hold.r&&!inHold)inHold=t}
  if(!inHold){H.key=null;return}
  if(H.key!==inHold.o.what){H.key=inHold.o.what;H.spawn=1.2;H.acc=0;banner(T('sq.holdGo',sqPlaceName(H.key)),SIDEQ.col)}
  H.acc+=dt;while(H.acc>=1){H.acc-=1;questEvent('hold',H.key,1)}
  if((H.spawn-=dt)<=0&&W.pace!==undefined){H.spawn=SIDEQ.hold.every;   // להקה מקצה המקום (pacing.js)
    const a=rand(0,6.28),s=placeClamp({x:inHold.p.x+Math.cos(a)*SIDEQ.hold.dist,y:inHold.p.y+Math.sin(a)*SIDEQ.hold.dist});
    paceSpawn(Math.round(rand(...SIDEQ.hold.n)),s)}
}
/* ---- ציור: עמוד אור על המקום, ושלט לוח המודעות ---- */
function sqDraw(){
  const t0=fxNow();
  for(const t of sqTargets()){const {x,y}=t.p,r=t.o.type==='hold'?SIDEQ.hold.r:SIDEQ.visitR,pulse=0.5+Math.sin(t0*3)*0.2;
    ctx.save();ctx.globalAlpha=pulse*0.5;ctx.strokeStyle=SIDEQ.col;ctx.lineWidth=3;ctx.setLineDash(t.o.type==='hold'?[14,10]:[]);
    ctx.beginPath();ctx.ellipse(x,y,r,r*0.55,0,0,7);ctx.stroke();ctx.setLineDash([]);
    const g=ctx.createLinearGradient(x,y-150,x,y);g.addColorStop(0,'rgba(127,224,194,0)');g.addColorStop(1,'rgba(127,224,194,0.55)');
    ctx.globalAlpha=pulse;ctx.fillStyle=g;ctx.fillRect(x-10,y-150,20,150);ctx.restore()}
}
function qbDrawBoard(n){
  const x=n.x,y=n.y;ctx.save();ctx.strokeStyle=C.ink;ctx.lineWidth=2;
  ctx.fillStyle='rgba(5,7,13,0.35)';ctx.beginPath();ctx.ellipse(x,y+6,30,9,0,0,7);ctx.fill();
  ctx.fillStyle='#5A3E24';ctx.fillRect(x-22,y-40,6,46);ctx.fillRect(x+16,y-40,6,46);
  ctx.fillStyle='#8A6238';ctx.beginPath();ctx.roundRect(x-30,y-62,60,36,4);ctx.fill();ctx.stroke();
  const notes=['#F4F1EA','#F4E3B5','#E8D9C0'];for(let i=0;i<3;i++){ctx.save();ctx.translate(x-18+i*18,y-44);ctx.rotate((i-1)*0.12);ctx.fillStyle=notes[i];ctx.fillRect(-7,-9,14,17);ctx.fillStyle='#C0392B';ctx.fillRect(-1.5,-9,3,3);ctx.restore()}
  ctx.restore();
}
// מעל הכל: שם המקום, כמה נשאר להגן, וחץ בקצה המסך
function sqScreen(ox,oy){
  const L=sqTargets();if(!L.length)return;
  ctx.save();ctx.textAlign='center';ctx.direction=DIR;ctx.font='800 13px Heebo, system-ui, sans-serif';
  for(const t of L){const x=t.p.x+ox,y=t.p.y+oy;
    if(onScreen(x,y)){let s='📍 '+sqPlaceName(t.o.what);if(t.o.type==='hold')s+=' · 🛡️ '+qProg(t.q,t.i)+'/'+t.o.n;
      ctx.fillStyle='#000a';ctx.fillText(s,x+1,y-157);ctx.fillStyle=SIDEQ.col;ctx.fillText(s,x,y-158)}
    edgeArrow(x,y,SIDEQ.col)}
  ctx.restore();
  escScreen(ox,oy);   // פס החיים של מי שאתה מלווה (escort.js)
}

/* ---- לשלט "רמה מומלצת" (curiosity.js): כמה קווסטים פתוחים באזור, ואיפה הקרוב ---- */
// של מי הקווסט באזור הנוכחי: דמות או לוח שעומדים כאן
const sqHere=q=>{const N=WNPC.list[q.giver];return !!N&&!!S.wd&&(N.reg||'meadow')===S.wd.reg&&!resGone(q.giver)};
// דמות שעוד לא נמצאה, ויש לה קווסט שמחכה לך
const sqWaits=id=>!SAVE.met[id]&&QUESTS.list.some(q=>q.giver===id&&!QS().done[q.id]&&(!q.req||!q.req.quest||QS().done[q.req.quest]));
function sqOpenCount(){
  if(!S.wd||qEarly())return 0;let n=0;const Q=QS();
  for(const q of QUESTS.list)if(sqHere(q)&&(Q.active[q.id]&&!qReady(q)||qOpen(q)))n++;
  for(const id in wnpcState()||{})if(sqWaits(id))n++;
  return n;
}
function sqNearest(){
  const all=wnpcState();if(!all)return null;const mark=wnpcMarks(),c=[];
  for(const id in all)if(mark[id]||sqWaits(id))c.push(all[id]);
  for(const t of sqTargets())c.push(t.p);
  let best=null,bd=1e9;for(const p of c){const d=Math.hypot(p.x-P.x,p.y-P.y);if(d<bd){bd=d;best=p}}
  return best;
}
qbApply();   // שמירה קיימת: המשימות שכבר לקחת מקבלות את היעד שלהן מיד
