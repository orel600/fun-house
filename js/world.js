/* העולם הפתוח: האזור הראשון, "האחו והמחצבה" (game-design.md, "מבנה העולם", אפשרות ג: עולם פתוח עם זירות בתוכו).
   יוצאים אליו משער הכפר, ובתוכו שני שערים לזירה. ריצה שמתחילה בשער נגמרת באותו שער.
   העולם הוא מקום, כמו הכפר וחדר הבונוס: S.wd קיים רק כשנמצאים בו, ו-main.js מעדכן רק את המקום הנוכחי.
   מה יש בו: מקורות משאבים שההתקפה האוטומטית מכה בהם כשעומדים לידם, אויבים מעטים שמסתובבים ליד הבית שלהם (לא גושים כמו בזירה),
   יצורי משאבים, ושמועות על המבוקש (wanted.js).
   מה שנאסף נכנס ישר לתרמיל, ובו מסתכנים: מוות בעולם מאבד חצי מכל משאב בתרמיל, הפריטים נשארים, וקמים בכפר. המחסן בכפר בטוח ("החלטות של ניר").
   כל המספרים באובייקט WORLD. השמות ב-lang.js ('w.*'). בתלת-ממד: W3D ב-render3d.js */

const WORLD={
  region:'meadow',                       // השם ב-lang.js: 'w.region.meadow'
  size:{w:2600,h:1700},                  // גבולות האזור, סביב (0,0). הכפר כולו ברדיוס 480
  home:{x:0,y:-760,r:44},                // השער חזרה לכפר. יוצאים מהכפר ומגיעים לכאן
  gates:{grove:{x:-1050,y:560,r:44},pit:{x:1050,y:560,r:44}},   // שערים לזירה. השמות ב-lang.js ('w.gate.<id>')
  arrive:130,                            // כמה פיקסלים מתחת לשער עומדים כשמגיעים אליו
  near:55,                               // כמה פיקסלים מקצה שער נחשב "לידו": נפתח הפאנל עם הכפתור
  /* מקורות משאבים בשדות: kind, כמה, מרכז ורדיוס. המקומות קבועים, כך שהיער תמיד באותו מקום.
     kinds: עד שהכלכלה (#27) תגיע. אז השמות האלה עוברים ל-NODES.kinds (nodes.js), ו-kinds כאן נמחק */
  fields:[{kind:'tree',n:14,x:-760,y:-260,r:300},{kind:'tree',n:5,x:180,y:260,r:200},
          {kind:'rock',n:9,x:760,y:-240,r:260},{kind:'copper',n:4,x:980,y:-500,r:150},{kind:'rock',n:3,x:-260,y:300,r:140}],
  kinds:{
    tree:  {hp:40,r:20,shape:'tree',col:'#3E7A4A',drop:{wood:[1,3]}},
    rock:  {hp:55,r:17,shape:'rock',col:'#7A8094',drop:{stone:[1,2],gem:[0.02,1]}},
    copper:{hp:80,r:17,shape:'vein',col:'#C87533',drop:{ore:[1,1],stone:[0.5,1]}}
  },
  gather:{reach:65,cd:0.5,dmg:20,calm:120},   // מכה במקור: מאיזה מרחק, כל כמה שניות, כמה נזק. calm: אויב קרוב מזה, וקודם נלחמים
  regrow:45,                             // שניות עד שמקור שנשבר צומח מחדש
  /* אויבים: קבוצות שמסתובבות ליד הבית שלהן. type: מ-ETYPES. creature: יצור משאב.
     יצורי המשאבים מגיעים עם הכלכלה (#27). עד אז אין להם שורה ב-ETYPES, והקבוצה שלהם פשוט לא מופיעה */
  foes:[
    {type:'grunt',n:3,x:-120,y:-220,r:160},{type:'grunt',n:3,x:380,y:280,r:160},
    {type:'wisp',n:2,x:-640,y:120,r:180},{type:'shield',n:2,x:560,y:60,r:150},
    {type:'treant',creature:true,n:2,x:-860,y:-380,r:200},{type:'golem',creature:true,n:2,x:820,y:-260,r:180},
    {type:'crawler',creature:true,n:2,x:980,y:-480,r:120}
  ],
  aggro:240, leash:560,                  // מאיזה מרחק אויב רודף, וכמה רחוק מהבית שלו הוא מוכן ללכת
  wander:0.4,                            // מהירות ההסתובבות ליד הבית, יחסית לרדיפה
  back:40,                               // שניות עד שקבוצה שנוקתה חוזרת (רק כשהשחקן רחוק ממנה)
  regen:4,                               // חיים לשנייה כשאין אויב קרוב
  deathLoss:{resources:0.5},             // מוות: איזה חלק מכל משאב בתרמיל הולך. פריטים לא. RES.deathLoss כשהכלכלה תגיע
  decor:{trees:90,hills:16}              // קישוטים מחוץ לגבול
};

const wKind=k=>WORLD.kinds[k];
const wGates=()=>Object.assign({home:WORLD.home},WORLD.gates);
let wRet=null;   // השער שממנו נכנסו לזירה: בסוף הריצה חוזרים אליו (againBtn ב-input.js)

/* ---- מעבר בין מקומות ---- */
function worldUi(on){document.body.classList.toggle('world',on);$('whud').hidden=!on;if(!on)$('wPanel').hidden=true}
// at: 'home' (מהכפר) או id של שער (חזרה מהזירה)
function enterWorld(at){
  wRet=null;reset();S.mode='play';
  S.wd={t:0,gt:0,near:null,ui:'',groups:WORLD.foes.map(()=>({t:0})),got:{}};
  S.nd={list:wNodes()};
  const g=wGates()[at]||WORLD.home;
  P.x=g.x;P.y=g.y+WORLD.arrive;P.aim=Math.PI/2;S.cam.x=P.x;S.cam.y=P.y;
  ['ovStart','ovOver','ovLevel','ovBoss','ovWDeath'].forEach(id=>$(id).hidden=true);
  WORLD.foes.forEach((G,i)=>wSpawn(G,i));
  banner(at==='home'?T('w.enter'):T('w.gate.'+at),C.gold);
  worldUi(true);
}
function wArena(id){wRet=id;worldUi(false);startRun();questEvent('reach','arena')}
function wHome(){worldUi(false);enterVillage()}

/* ---- מקורות משאבים: באותה צורה כמו ב-nodes.js, כדי שיתחברו כשהכלכלה תגיע ---- */
function wNodes(){
  const out=[],block=Object.values(wGates());
  WORLD.fields.forEach((F,fi)=>{const K=wKind(F.kind);
    for(let i=0,tries=0;i<F.n&&tries<F.n*12;tries++){
      const a=hash(fi*31+tries,7)*Math.PI*2,r=Math.sqrt(hash(tries,fi*17+3))*F.r,x=F.x+Math.cos(a)*r,y=F.y+Math.sin(a)*r;
      if(out.some(n=>Math.hypot(n.x-x,n.y-y)<n.r+K.r+24)||block.some(g=>Math.hypot(g.x-x,g.y-y)<g.r+WORLD.arrive))continue;
      out.push({node:true,id:fi+'_'+i,kind:F.kind,x,y,r:K.r,hp:K.hp,max:K.hp,mult:{sword:1,gun:1},flash:0,back:0});i++}});
  return out;
}
// ההתקפה האוטומטית מכה במקור הכי קרוב, כשאין אויב קרוב. המשאבים נכנסים לשלל, ומשם לתרמיל (wLootIn)
function wGather(dt){
  const G=WORLD.gather,w=S.wd;w.gt-=dt;
  if(nearest(G.calm))return;
  let n=null,bd=G.reach;for(const k of S.nd.list){if(k.dead)continue;const d=Math.hypot(k.x-P.x,k.y-P.y)-k.r;if(d<bd){bd=d;n=k}}
  if(!n)return;
  P.aim=Math.atan2(n.y-P.y,n.x-P.x);
  if(w.gt>0)return;w.gt=G.cd;
  // מקרוב: מכה מיד. מרחוק: הנשק שביד יורה (wFire ב-weapons.js), והמקור נפגע כשהקליע מגיע אליו
  if(P.weapon==='sword'){P.sw.anim=0.2;P.sw.ang=P.aim;wNodeHit(n)}else wFire(1,{node:n,home:0,pierce:0});
}
function wNodeHit(n){
  const G=WORLD.gather;if(n.dead)return;
  n.hp-=G.dmg;n.flash=0.09;sfx('hit');sparks(n.x,n.y-n.r*0.5,wKind(n.kind).col,5,160);
  if(n.hp<=0)wNodeDown(n);
}
function wNodeDown(n){
  const K=wKind(n.kind),L=runLoot();let y=n.y-n.r-22;
  n.dead=true;n.back=WORLD.regrow;sfx('coin');sparks(n.x,n.y,K.col,14,200);
  for(const r in K.drop){const [ch,c]=K.drop[r];if(Math.random()<ch){L[r]=(L[r]||0)+c;floatText(n.x,y,'+'+c+' '+VILLAGE.icon[r],C.gold,16);y-=18}}
}
// מה שנפל בעולם (ממקור או מאויב, runDrop ב-village.js) עובר מיד לתרמיל ונשמר. שם הוא בסיכון
function wLootIn(){
  const L=S.loot;if(!L)return;let any=false;
  for(const r in L)if(L[r]>0){bagAdd(r,L[r]);questEvent('gather',r,L[r]);S.wd.got[r]=(S.wd.got[r]||0)+L[r];any=true}
  S.loot={};if(any)saveNow();
}

/* ---- אויבים: קבוצה לכל שורה ב-WORLD.foes ---- */
function wSpawn(G,i){
  if(!ETYPES[G.type])return;
  for(let k=0;k<G.n;k++){const a=rand(0,6.28),r=rand(0,G.r),e=addEnemy(G.type,G.x+Math.cos(a)*r,G.y+Math.sin(a)*r);
    e.xp=0;e.home=i;e.creature=!!G.creature}   // בלי XP: בעולם לא עולים רמה, זה שייך לריצה בזירה
}
function wFoes(dt){
  const alive=WORLD.foes.map(()=>0);
  for(const e of enemies){
    if(e.dead)continue;
    if(e.wanted){wantedMove(e,dt);continue}
    alive[e.home]++;
    const G=WORLD.foes[e.home],dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1;
    let mx=0,my=0,sp=e.speed;
    if(d<WORLD.aggro&&Math.hypot(P.x-G.x,P.y-G.y)<WORLD.leash){mx=dx/d;my=dy/d;
      if(e.type==='wisp'){if(d<170){mx=-mx;my=-my}e.shoot-=dt;if(e.shoot<=0){e.shoot=rand(1.8,2.8);shootE(e.x,e.y,Math.atan2(dy,dx),175,6,8)}}}
    else{   // מסתובב ליד הבית
      if(e.wx==null||Math.hypot(e.wx-e.x,e.wy-e.y)<12){const a=rand(0,6.28),r=rand(0,G.r);e.wx=G.x+Math.cos(a)*r;e.wy=G.y+Math.sin(a)*r}
      const wx=e.wx-e.x,wy=e.wy-e.y,wd=Math.hypot(wx,wy)||1;mx=wx/wd;my=wy/wd;sp*=WORLD.wander}
    e.x+=mx*sp*dt+e.kx*dt;e.y+=my*sp*dt+e.ky*dt;
    const f=Math.max(0,1-dt*9);e.kx*=f;e.ky*=f;e.ph+=dt*sp*0.08;e.flash-=dt;
    if(d<e.r+P.r-3)hurt(e.dmg);
  }
  // קבוצה שנוקתה חוזרת אחרי זמן, כשהשחקן רחוק ממנה
  WORLD.foes.forEach((G,i)=>{const g=S.wd.groups[i];if(alive[i]||!ETYPES[G.type])return;
    if(g.t<=0)g.t=WORLD.back;else if((g.t-=dt)<=0&&Math.hypot(P.x-G.x,P.y-G.y)>G.r+500)wSpawn(G,i);else g.t=Math.max(g.t,0.01)});
}

/* ---- כל פריים בעולם ---- */
function worldUpdate(dt){
  const w=S.wd,B=WORLD.size;w.t+=dt;
  P.inv-=dt;P.swapBuff-=dt;S.hurt-=dt;S.shake=Math.max(0,S.shake-dt*30);
  const {ix,iy}=movePlayer(dt);if(P.moving&&!nearest(440))P.aim=Math.atan2(iy,ix);
  P.x=Math.max(-B.w/2+20,Math.min(B.w/2-20,P.x));P.y=Math.max(-B.h/2+20,Math.min(B.h/2-20,P.y));
  for(const n of S.nd.list){
    if(n.dead){if((n.back-=dt)<=0){n.dead=false;n.hp=n.max}continue}
    const dx=P.x-n.x,dy=P.y-n.y,d=Math.hypot(dx,dy)||1,min=n.r+P.r;if(d<min){P.x=n.x+dx/d*min;P.y=n.y+dy/d*min}   // לא עוברים דרך עץ
    n.flash-=dt;
  }
  attack(dt);wGather(dt);
  wFoes(dt);if(S.mode!=='play')return;
  for(const b of pb){shotFly(b,dt);
    const n=b.node;if(n&&b.life>0&&Math.hypot(n.x-b.x,n.y-b.y)<n.r+4){b.life=0;wNodeHit(n);if(b.shot==='bolt')sparks(b.x,b.y,dtCol(P.dt.gun),WEAPONS.bolt.burst,140);continue}
    for(const e of enemies){if(e.dead||b.hit.has(e)||b.life<=0)continue;
      if(Math.hypot(e.x-b.x,e.y-b.y)<e.r+4)shotHit(b,e)}}
  pb=pb.filter(b=>b.life>0);
  for(const b of eb){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(Math.hypot(P.x-b.x,P.y-b.y)<P.r+b.r-3){hurt(b.dmg);b.life=0}}
  eb=eb.filter(b=>b.life>0);if(S.mode!=='play')return;
  orbs=[];   // XP רק בזירה (גם מהמבוקש)
  wantedUpdate(dt);
  wLootIn();
  if(!nearest(WORLD.aggro))P.hp=Math.min(P.maxHp,P.hp+WORLD.regen*dt);
  enemies=enemies.filter(e=>!e.dead);
  for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.9;p.vy*=0.9;p.life-=dt}
  parts=parts.filter(p=>p.life>0);
  for(const f of floats){f.y+=f.vy*dt;f.life-=dt}
  floats=floats.filter(f=>f.life>0);
  // ליד שער נפתח פאנל עם כפתור. נכנסים רק בלחיצה
  w.near=null;const gs=wGates();for(const k in gs){const g=gs[k];if(Math.hypot(P.x-g.x,P.y-g.y)<g.r+P.r+WORLD.near)w.near=k}
  worldHud();
}

/* ---- מוות בעולם: חצי מכל משאב בתרמיל הולך, הפריטים והמחסן נשארים. נקרא מ-gameOver ---- */
function worldDeath(){
  S.mode='over';joy=null;
  const lost={},k=WORLD.deathLoss.resources;
  for(const r in SAVE.bag){if(!VILLAGE.icon[r])continue;const n=Math.floor(SAVE.bag[r]*k);if(n>0){bagTake(r,n);lost[r]=n}}
  S.wd.lost=lost;saveNow();
  $('wPanel').hidden=true;
  $('wLost').innerHTML=bagLine(lost)||T('w.lostNone');
  setTimeout(()=>{if(S.wd)$('ovWDeath').hidden=false},700);
}
$('wRespawn').onclick=()=>{$('ovWDeath').hidden=true;wHome()};

/* ---- ממשק: שם האזור והתרמיל למעלה, ופאנל ליד שער ---- */
function worldHud(){
  const w=S.wd,key=LANG+'|'+w.near+'|'+JSON.stringify(SAVE.bag);
  if(key===w.ui)return;w.ui=key;
  $('wName').textContent=T('w.region.'+WORLD.region);
  $('wBag').innerHTML=bagLine(SAVE.bag);
  const pn=$('wPanel'),k=w.near;pn.hidden=!k;if(!k)return;
  pn.innerHTML=k==='home'?'<h3>'+T('w.home')+'</h3><p>'+T('w.homeInfo')+'</p><button class="vbtn" data-act="home">'+T('w.goHome')+'</button>'
    :'<h3>'+T('w.gate.'+k)+'</h3><p>'+T('w.arenaInfo')+'</p><button class="vbtn" data-act="arena" data-g="'+k+'">'+T('w.enterArena')+'</button>';
}
$('wPanel').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||!S.wd||S.mode!=='play')return;
  if(b.dataset.act==='home')wHome();else if(b.dataset.act==='arena')wArena(b.dataset.g);
});

/* ---- ציור ---- */
// קישוטים מחוץ לגבול: עצים וגבעות. תמיד באותם מקומות, ופתוח מול השער לכפר
function worldDecor(){
  if(worldDecor.list)return worldDecor.list;
  const out=[],{w,h}=WORLD.size,D=WORLD.decor,per=2*(w+h);
  const edge=(t,off)=>{let s=t*per;if(s<w)return[-w/2+s,-h/2-off];s-=w;if(s<h)return[w/2+off,-h/2+s];s-=h;if(s<w)return[w/2-s,h/2+off];s-=w;return[-w/2-off,h/2-s]};
  for(let i=0;i<D.trees;i++){const [x,y]=edge((i+hash(i,8)*0.5)/D.trees,40+hash(i,1)*90);if(Math.abs(x-WORLD.home.x)<130&&y<0)continue;
    out.push({kind:hash(i,2)<0.15?'rock':'tree',x,y,v:hash(i,3)})}
  for(let i=0;i<D.hills;i++){const [x,y]=edge((i+0.5)/D.hills,260+hash(i,4)*80);if(Math.abs(x-WORLD.home.x)<200&&y<0)continue;out.push({kind:'hills',x,y,v:hash(i,5)})}
  return worldDecor.list=out;
}
function wArch(g,col){
  ctx.strokeStyle=col;ctx.lineWidth=4;ctx.fillStyle='rgba(236,231,220,0.12)';
  ctx.beginPath();ctx.moveTo(g.x-26,g.y+14);ctx.lineTo(g.x-26,g.y-14);ctx.arc(g.x,g.y-14,26,Math.PI,0);ctx.lineTo(g.x+26,g.y+14);ctx.closePath();ctx.fill();ctx.stroke();
}
// בעולם: בדו-ממד צורות פשוטות. בתלת-ממד הקישוטים, השערים והמקורות מצוירים בשכבה שמתחת (syncWorld ב-render3d.js), וכאן רק פס החיים של מקור
function drawWorld(){
  if(!S.wd)return;
  if(!R3D.on){
    const {w,h}=WORLD.size;ctx.fillStyle='#1B2A1E';ctx.fillRect(-w/2,-h/2,w,h);
    for(const d of worldDecor()){
      if(d.kind==='tree'){ctx.fillStyle='#24452F';ctx.beginPath();ctx.arc(d.x,d.y,20+d.v*10,0,7);ctx.fill()}
      else if(d.kind==='rock'){ctx.fillStyle='#4A5064';ctx.beginPath();ctx.arc(d.x,d.y,12,0,7);ctx.fill()}
      else{ctx.fillStyle='#1E3526';ctx.beginPath();ctx.arc(d.x,d.y,70,0,7);ctx.fill()}
    }
    wArch(WORLD.home,C.chalk);for(const k in WORLD.gates)wArch(WORLD.gates[k],C.lilac);
  }
  for(const n of S.nd.list){
    if(n.dead)continue;const K=wKind(n.kind),fl=n.flash>0,r=n.r,x=n.x,y=n.y;
    if(!R3D.on){
      ctx.fillStyle='rgba(5,7,13,0.35)';ctx.beginPath();ctx.ellipse(x,y+r*0.7,r*1.1,r*0.4,0,0,7);ctx.fill();ctx.strokeStyle=C.ink;ctx.lineWidth=2;
      if(K.shape==='tree'){ctx.fillStyle=fl?'#fff':'#6B4A2B';ctx.fillRect(x-4,y-4,8,r*0.9);ctx.fillStyle=fl?'#fff':K.col;ctx.beginPath();ctx.arc(x,y-r*0.6,r,0,7);ctx.fill();ctx.stroke()}
      else{ctx.beginPath();ctx.moveTo(x-r,y+r*0.5);ctx.lineTo(x-r*0.7,y-r*0.5);ctx.lineTo(x,y-r);ctx.lineTo(x+r*0.8,y-r*0.4);ctx.lineTo(x+r,y+r*0.5);ctx.closePath();
        ctx.fillStyle=fl?'#fff':K.shape==='vein'?'#5A6075':K.col;ctx.fill();ctx.stroke();
        if(K.shape==='vein'){ctx.fillStyle=K.col;for(let i=0;i<3;i++){const a=i*2.1;ctx.beginPath();ctx.arc(x+Math.cos(a)*r*0.45,y-r*0.1+Math.sin(a)*r*0.3,3.5,0,7);ctx.fill()}}}
    }
    if(n.hp<n.max){const bw=r*2;ctx.fillStyle='rgba(5,7,13,0.6)';ctx.fillRect(x-bw/2,y-r*2.2,bw,4);ctx.fillStyle=C.gold;ctx.fillRect(x-bw/2,y-r*2.2,bw*Math.max(0,n.hp/n.max),4)}
  }
}
// שלטים מתחת לשערים, וחצים בקצה המסך אל השערים ואל הכפר. מעל הכל, בשני המצבים
function drawWorldScreen(ox,oy){
  if(!S.wd)return;
  ctx.textAlign='center';ctx.direction=DIR;ctx.font='800 13px Heebo, system-ui, sans-serif';
  const gs=wGates();
  for(const k in gs){const g=gs[k],col=k==='home'?C.chalk:C.lilac,txt=k==='home'?T('w.home'):T('w.gate.'+k),x=g.x+ox,y=g.y+oy+40,tw=ctx.measureText(txt).width+16;
    ctx.fillStyle='rgba(18,22,36,0.78)';ctx.beginPath();ctx.roundRect(x-tw/2,y-11,tw,22,11);ctx.fill();ctx.fillStyle=col;ctx.fillText(txt,x,y+5);
    edgeArrow(g.x+ox,g.y+oy,col)}
}
