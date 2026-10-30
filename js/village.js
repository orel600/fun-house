/* הכפר: הבית. ממנו יוצאים לזירה דרך השער, ואליו חוזרים בסוף ריצה עם השלל.
   הכפר הוא מקום, כמו חדר הבונוס: S.vil קיים רק כשנמצאים בכפר, ו-main.js מעדכן רק את המקום הנוכחי.
   מה שנשאר בין ריצות (רמות המבנים, התרמיל, הייצור) נקרא ונכתב רק דרך SAVE (save.js), ונשמר אחרי כל שינוי.
   כל המספרים באובייקט VILLAGE. השמות והתיאורים ב-lang.js ('vil.mill' וכו'). המודלים בתלת-ממד: VIL3D ב-render3d.js
   המשחק לרוחב (ניר, 30.10.2026): הכפר פרוש לרוחב, התרמיל למעלה, הפאנל בצד, והפינה הימנית למטה נשארת פנויה לכפתורי כישורים */

const VILLAGE={
  radius:480,                     // גבול הכפר: עד כאן אפשר ללכת. השער יושב על הגבול, למטה
  spawn:{x:0,y:60},              // איפה עומדים כשנכנסים בפעם הראשונה. חוזרים מהזירה ליד השער
  near:55,                        // כמה פיקסלים מקצה מבנה נחשב "לידו": נפתח הפאנל שלו ונאספת התוצרת
  max:5,                          // הרמה הכי גבוהה. מבנה לא עולה מעל מרכז הכפר
  gift:{coins:25,wood:20,stone:12},   // מתנת פתיחה, פעם אחת: מספיק לבנות מנסרה ומכרה
  icon:{coins:'🪙',wood:'🪵',stone:'🪨',ore:'⛏️',bone:'🦴',gem:'💎'},   // gem: אבן חן נדירה, מגינה ב-Aging (aging.js)   // סדר המשאבים בממשק הוא הסדר כאן
  gate:{x:0,y:480,r:44},
  /* איך מבנה נראה לפי רמה, כדי שכל שדרוג ייראה (ניר: "שידרגתי בניין בכפר גם צריך להיות אפקט").
     look: רצועות רמה. at: מאיזו רמה. model: איזה מודל (השמות ב-VIL3D.models). scale: גודל. deco: קישוטים סביב (VIL3D.deco). glow: זוהר.
     בתוך רצועה המבנה גדל עוד grow בכל רמה, ובכל שדרוג יש חגיגה (celebrate ב-fx.js) */
  grow:0.05,
  // cost[L]: מה עולה להגיע לרמה L. make: ייצור בשעה לפי רמה. cap: כמה נאגר לכל משאב עד שאוספים
  b:{
    center:{x:0,y:-190,r:92,
      look:[{at:1,model:'castle',scale:0.85,deco:[]},{at:3,model:'castle',scale:1,deco:['flag','flag']},{at:5,model:'castle',scale:1.1,deco:['flag','flag','flag','flag'],glow:C.gold}],
      cost:[null,null,{coins:40,wood:30,stone:20},{coins:90,wood:60,stone:50,ore:10},{coins:180,wood:120,stone:100,ore:30},{coins:350,wood:220,stone:200,ore:60}]},
    forge:{x:-300,y:-30,r:66,     // נפחייה: Aging לציוד (aging.js). הרמה קובעת עד איזה + אפשר לשדרג
      look:[{at:1,model:'tent',scale:1,deco:['barrel']},{at:3,model:'forge',scale:1,deco:['crate','barrel']},{at:5,model:'forge',scale:1.12,deco:['flag','flag','crate','barrel'],glow:C.ember}],
      cost:[null,{coins:20,wood:15,stone:10},{coins:50,wood:35,stone:25,ore:5},{coins:110,wood:70,stone:60,ore:15},{coins:220,wood:140,stone:120,ore:35},{coins:400,wood:250,stone:220,ore:70}]},
    mill:{x:300,y:-30,r:66,
      look:[{at:1,model:'mill',scale:0.85,deco:[]},{at:3,model:'mill',scale:1,deco:['crate']},{at:5,model:'mill',scale:1.12,deco:['flag','flag','crate'],glow:C.gold}],
      cost:[null,{coins:10,stone:5},{coins:30,wood:15,stone:20},{coins:70,wood:30,stone:50},{coins:140,wood:60,stone:100,ore:10},{coins:260,wood:120,stone:180,ore:25}],
      make:{wood:[0,30,50,80,120,180]},cap:[0,60,120,200,320,500]},
    mine:{x:-300,y:190,r:66,
      look:[{at:1,model:'mine',scale:0.85,deco:[]},{at:3,model:'mine',scale:1,deco:['barrel']},{at:5,model:'mine',scale:1.12,deco:['flag','flag','barrel'],glow:C.gold}],
      cost:[null,{coins:10,wood:10},{coins:30,wood:25,stone:10},{coins:70,wood:55,stone:25},{coins:140,wood:110,stone:50},{coins:260,wood:200,stone:90}],
      make:{stone:[0,20,35,55,80,120],ore:[0,4,8,14,22,32]},cap:[0,40,80,140,220,350]},
    market:{x:300,y:190,r:66,     // sell/buy: מטבעות ליחידה ברמה 1. כל רמה נוספת: bonus יותר טוב. lot: כמה יחידות בכל לחיצה
      cost:[null,{coins:15,wood:15},{coins:40,wood:30,stone:20},{coins:90,wood:60,stone:50},{coins:180,wood:120,stone:100,ore:20},{coins:320,wood:220,stone:180,ore:50}],
      sell:{wood:1,stone:1,ore:4,bone:2},buy:{wood:3,stone:3},lot:5,bonus:0.2,
      look:[{at:1,model:'tent',scale:1,deco:['crate','crate']},{at:3,model:'market',scale:1,deco:['crate','barrel']},{at:5,model:'market',scale:1.1,deco:['flag','flag','crate','barrel'],glow:C.gold}]},
    stash:{x:-170,y:330,r:60,     // מחסן: המקום הבטוח לשלל (stash.js). cap[L]: כמה יחידות הוא מחזיק ברמה L
      cost:[null,{coins:15,wood:10},{coins:40,wood:30,stone:15},{coins:90,wood:60,stone:45},{coins:180,wood:120,stone:90,ore:15},{coins:320,wood:220,stone:160,ore:40}],
      cap:[0,150,400,900,2000,5000],
      look:[{at:1,model:'tent',scale:0.9,deco:['crate']},{at:3,model:'market',scale:0.95,deco:['crate','crate','barrel']},{at:5,model:'market',scale:1.05,deco:['flag','flag','crate','barrel'],glow:C.tide}]}
  },
  // שלל בזירה מכל אויב שנופל: {משאב:[סיכוי, כמה]}. מגיע לתרמיל בסוף הריצה, גם אם נפלת
  drops:{
    grunt:{coins:[0.6,1],bone:[0.15,1]},
    shield:{coins:[0.8,2],ore:[0.12,1],bone:[0.2,1]},
    wisp:{coins:[0.8,2],bone:[0.3,1]},
    wanted:{coins:[1,15],gem:[0.3,1]},
    boss:{coins:[1,40],ore:[1,6],bone:[1,8],gem:[0.5,1]}
  },
  winDelay:2.5                    // שניות אחרי שהבוס נופל, עד שחוזרים הביתה
};

const vLv=k=>SAVE.village[k]||0;
// המראה של מבנה עכשיו: הרצועה לפי הרמה, והגודל שגדל בתוכה. null: עוד לא נבנה, או שבונים אותו ממש עכשיו (פיגום)
function vLook(k){
  const L=vLv(k);if(!L||S.vil&&S.vil.raise[k]>fxNow())return null;
  const look=VILLAGE.b[k].look;let band=look[0];for(const b of look)if(L>=b.at)band=b;
  return{...band,size:band.scale*(1+VILLAGE.grow*(L-band.at)),L};
}

/* ---- ייצור לפי זמן אמיתי, גם כשהמשחק סגור ---- */
function vProd(k){return SAVE.prod[k]||(SAVE.prod[k]={t:0,have:{}})}
// מעדכן את מה שהצטבר מאז הפעם הקודמת, עד המחסן. לפני כל שינוי רמה, כדי שהקצב הישן יחול עד עכשיו
function vSettle(k){
  const B=VILLAGE.b[k];if(!B.make)return null;
  const p=vProd(k),now=Date.now(),L=vLv(k);
  if(p.t&&L>0){const h=Math.max(0,now-p.t)/3600e3;for(const r in B.make)p.have[r]=Math.min(B.cap[L],(p.have[r]||0)+B.make[r][L]*h)}
  p.t=now;return p;
}
function vCollect(k){
  const p=vSettle(k);if(!p)return 0;let n=0,y=P.y-50;
  for(const r in p.have){const w=Math.floor(p.have[r]);if(w>0){bagAdd(r,w);questEvent('collect',r,w);p.have[r]-=w;n+=w;floatText(P.x,y,'+'+w+' '+VILLAGE.icon[r],C.gold,17);y-=20}}
  if(n)saveNow();
  return n;
}
const vStock=k=>{const p=SAVE.prod[k];if(!p)return 0;let n=0;for(const r in p.have)n+=Math.floor(p.have[r]);return n};

/* ---- שדרוג ---- */
const vCost=k=>VILLAGE.b[k].cost[vLv(k)+1]||null;
// למה אי אפשר לשדרג עכשיו: 'max', 'center' (מרכז הכפר נמוך מדי), 'cost', או null אם אפשר
function vBlock(k){
  const L=vLv(k);if(L>=VILLAGE.max)return 'max';
  if(k!=='center'&&L>=vLv('center'))return 'center';
  const c=vCost(k);for(const r in c)if(!bagHas(r,c[r]))return 'cost';
  return null;
}
function vUpgrade(k){
  if(vBlock(k))return false;
  vSettle(k);const c=vCost(k);for(const r in c)bagTake(r,c[r]);
  SAVE.village[k]=vLv(k)+1;questEvent('upgrade',k);saveNow();
  // חגיגה: אבק ופיגום, ואז פרץ, עמוד אור ו-+1. בזמן האבק המבנה מוצג כפיגום
  const B=VILLAGE.b[k],dust=celebrate(B.x,B.y,'upgrade','+1');S.vil.raise[k]=fxNow()+dust;
  setTimeout(()=>{if(S.vil)S.shake=Math.max(S.shake,6)},dust*1000);
  banner(T('vil.'+k)+' · '+T('level',vLv(k)),C.gold);
  return true;
}

/* ---- שוק ---- */
function vPrice(r,kind){
  const M=VILLAGE.b.market,k=1+M.bonus*Math.max(0,vLv('market')-1);
  return kind==='sell'?Math.round(M.sell[r]*k):Math.max(1,Math.round(M.buy[r]/k));
}
function vTrade(kind,r){
  const M=VILLAGE.b.market,n=M.lot;if(!vLv('market'))return false;
  if(kind==='sell'){if(!bagTake(r,n))return false;bagAdd('coins',vPrice(r,'sell')*n)}
  else{if(!bagTake('coins',vPrice(r,'buy')*n))return false;bagAdd(r,n)}
  saveNow();return true;
}

/* ---- מעבר בין הכפר לזירה ---- */
function villageUi(on){document.body.classList.toggle('vil',on);$('vhud').hidden=!on;if(!on)$('vPanel').hidden=true}
function enterVillage(){
  const back=S&&S.mode==='over';
  reset();S.mode='play';S.vil={near:null,ui:'',raise:{}};
  const at=back?{x:VILLAGE.gate.x,y:VILLAGE.gate.y-110}:VILLAGE.spawn;
  P.x=at.x;P.y=at.y;P.aim=-Math.PI/2;S.cam.x=P.x;S.cam.y=P.y;
  ['ovStart','ovOver','ovLevel','ovBoss'].forEach(id=>$(id).hidden=true);
  for(const k in VILLAGE.b)vSettle(k);   // הייצור מאז הביקור הקודם
  if(!SAVE.gift){for(const r in VILLAGE.gift)bagAdd(r,VILLAGE.gift[r]);SAVE.gift=true;banner(T('vil.gift'),C.gold)}
  else banner(T('vil.home'),C.gold);
  questsRefresh();   // יום חדש וקווסטים שנפתחו (quests.js)
  saveNow();
  villageUi(true);
}
function leaveVillage(){villageUi(false);startRun();questEvent('reach','arena')}

/* ---- כל פריים בכפר ---- */
function villageUpdate(dt){
  const V=S.vil;
  P.inv-=dt;S.hurt-=dt;S.shake=Math.max(0,S.shake-dt*30);
  const {ix,iy}=movePlayer(dt);if(P.moving)P.aim=Math.atan2(iy,ix);
  // לא נכנסים לתוך מבנים, ולא יוצאים מהכפר
  for(const k in VILLAGE.b){const B=VILLAGE.b[k],dx=P.x-B.x,dy=P.y-B.y,d=Math.hypot(dx,dy)||1,min=B.r+P.r;if(d<min){P.x=B.x+dx/d*min;P.y=B.y+dy/d*min}}
  const R=VILLAGE.radius,d0=Math.hypot(P.x,P.y);if(d0>R){P.x*=R/d0;P.y*=R/d0}
  // ליד השער נפתח פאנל עם כפתור כניסה. הריצה מתחילה רק בלחיצה, לא כשעוברים לידו (ניר: "נכנסתי לזירה בלי כוונה")
  const g=VILLAGE.gate;V.gate=Math.hypot(P.x-g.x,P.y-g.y)<g.r+P.r+VILLAGE.near;
  // המבנה הכי קרוב: הפאנל שלו נפתח, והתוצרת שלו נאספת
  let near=null,best=VILLAGE.near;
  for(const k in VILLAGE.b){const B=VILLAGE.b[k],d=Math.hypot(P.x-B.x,P.y-B.y)-B.r-P.r;if(d<best){best=d;near=k}}
  V.near=near;if(near)vCollect(near);
  for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.9;p.vy*=0.9;p.life-=dt}
  parts=parts.filter(p=>p.life>0);
  for(const f of floats){f.y+=f.vy*dt;f.life-=dt}
  floats=floats.filter(f=>f.life>0);
  villageHud();
}

/* ---- שלל מהזירה ---- */
const runLoot=()=>S.loot||(S.loot={});
// נקרא מ-kill בכל אויב שנופל
function runDrop(e){
  const D=VILLAGE.drops[e.isBoss?'boss':e.wanted?'wanted':e.type];if(!D)return;
  const L=runLoot();let y=e.y-e.r-22;
  for(const r in D){const [ch,n]=D[r];if(Math.random()<ch){L[r]=(L[r]||0)+n;if(r!=='coins'){floatText(e.x,y,VILLAGE.icon[r],C.gold,16);y-=18}}}
}
// נקרא מ-bossDown: אחרי רגע של ניצחון חוזרים הביתה (מחכים אם פתוח מסך שדרוג או חדר בונוס)
function runWon(){
  const s=S;
  setTimeout(function w(){if(S!==s||S.mode==='over')return;if(S.mode!=='play'||S.room){setTimeout(w,400);return}S.won=true;gameOver()},VILLAGE.winDelay*1000);
}
// נקרא מ-gameOver, גם במוות וגם בניצחון: השלל עובר לתרמיל ונשמר
function runEnd(){
  if(S.lootDone)return;S.lootDone=true;
  const L=runLoot();if(S.bn&&S.bn.coins)L.coins=(L.coins||0)+S.bn.coins;
  for(const r in L){bagAdd(r,L[r]);questEvent('collect',r,L[r])}
  saveNow();
  $('overTitle').textContent=T(S.won?'vil.won':'fell');
  $('sLoot').innerHTML=bagLine(L)||T('vil.noLoot');
}

/* ---- ממשק: התרמיל למעלה, והפאנל של המבנה שלידו למטה ---- */
const bagLine=(bag,all)=>Object.keys(VILLAGE.icon).filter(r=>all||bag[r]>0).map(r=>'<span class="res" aria-label="'+T('res.'+r)+'">'+VILLAGE.icon[r]+' '+(bag[r]||0)+'</span>').join('');
function costLine(c){return Object.keys(c).map(r=>'<span class="res'+(bagHas(r,c[r])?'':' miss')+'" aria-label="'+T('res.'+r)+'">'+VILLAGE.icon[r]+' '+c[r]+'</span>').join('')}
function vInfo(k,L){
  const B=VILLAGE.b[k];if(L<1)return T('vil.notBuilt');
  if(k==='center')return T('vil.info.center',L);
  if(k==='forge')return T('vil.info.forge',AGING.byForge[L]);
  if(k==='mill')return T('vil.info.mill',B.make.wood[L],B.cap[L]);
  if(k==='mine')return T('vil.info.mine',B.make.stone[L],B.make.ore[L],B.cap[L]);
  if(k==='market')return T('vil.info.market',Math.round(B.bonus*(L-1)*100));
  if(k==='stash')return T('vil.info.stash',B.cap[L]);
}
function villageHud(){
  const k=S.vil.near,L=k?vLv(k):0;
  // בונים מחדש רק כשמשהו השתנה: מבנה אחר, רמות, תרמיל, מחסן או שפה
  const key=LANG+'|'+k+'|'+S.vil.gate+'|'+JSON.stringify(SAVE.village)+'|'+JSON.stringify(SAVE.bag)+'|'+JSON.stringify(SAVE.stash);
  if(key===S.vil.ui)return;S.vil.ui=key;
  $('vBag').innerHTML=bagLine(SAVE.bag,true);
  const pn=$('vPanel');pn.hidden=!k&&!S.vil.gate;
  if(S.vil.gate){pn.innerHTML='<h3>'+T('vil.arena')+'</h3><p>'+T('vil.arenaInfo')+'</p><button class="vbtn" data-act="go">'+T('vil.enter')+'</button>';return}
  if(!k)return;
  const why=vBlock(k),c=vCost(k);
  let h='<h3>'+T('vil.'+k)+' <small>'+(L?T('level',L):'')+'</small></h3><p>'+vInfo(k,L)+'</p>';
  if(why!=='max')h+='<p class="next">'+T('vil.next',vInfo(k,L+1))+'</p><div class="cost">'+costLine(c)+'</div>';
  h+='<button class="vbtn" data-act="up"'+(why?' disabled':'')+'>'+(why==='max'?T('vil.max'):why==='center'?T('vil.needCenter'):L?T('vil.up',L+1):T('vil.build'))+'</button>';
  if(k==='forge'&&L>0)h+='<button class="vbtn ghost" data-act="forge">⚒️ '+T('age.open')+'</button>';
  if(k==='market'&&L>0){
    const M=VILLAGE.b.market;h+='<div class="trade">';
    for(const r in M.sell)h+='<button data-act="sell" data-r="'+r+'"'+(bagHas(r,M.lot)?'':' disabled')+'>'+T('vil.sell')+' '+M.lot+VILLAGE.icon[r]+' · +'+vPrice(r,'sell')*M.lot+VILLAGE.icon.coins+'</button>';
    for(const r in M.buy)h+='<button data-act="buy" data-r="'+r+'"'+(bagHas('coins',vPrice(r,'buy')*M.lot)?'':' disabled')+'>'+T('vil.buy')+' '+M.lot+VILLAGE.icon[r]+' · '+vPrice(r,'buy')*M.lot+VILLAGE.icon.coins+'</button>';
    h+='</div>';
  }
  if(k==='stash'&&L>0)h+=stashHtml();   // stash.js
  pn.innerHTML=h;
}
$('vPanel').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled||!S.vil)return;
  if(b.dataset.act==='go'){leaveVillage();return}
  if(!S.vil.near)return;
  if(b.dataset.act==='forge'){forgeOpen();return}
  if(b.dataset.act==='up')vUpgrade(S.vil.near);else if(b.dataset.act==='stash')stashMove(b.dataset.dir,b.dataset.r);else vTrade(b.dataset.act,b.dataset.r);
  villageHud();
});

/* ---- ציור ---- */
// קישוטים סביב הגבול: עצים, סלעים וגבעות. תמיד באותם מקומות, ופתוח מול השער
function villageDecor(){
  if(villageDecor.list)return villageDecor.list;
  const out=[],R=VILLAGE.radius;
  for(let i=0;i<54;i++){const a=i/54*Math.PI*2;if(Math.abs(angDiff(a,Math.PI/2))<0.2)continue;
    const r=R+50+hash(i,1)*90;out.push({kind:hash(i,2)<0.18?'rock':'tree',x:Math.cos(a)*r,y:Math.sin(a)*r,v:hash(i,3)})}
  for(let i=0;i<18;i++){const a=(i+0.5)/18*Math.PI*2;if(Math.abs(angDiff(a,Math.PI/2))<0.25)continue;
    const r=R+250+hash(i,4)*60;out.push({kind:'hills',x:Math.cos(a)*r,y:Math.sin(a)*r,v:hash(i,5)})}
  return villageDecor.list=out;
}
// איפה עומדים הקישוטים סביב מבנה, ביחס לרדיוס שלו (ראשונים: פינות קדמיות). משותף לדו-ממד ולתלת-ממד
const VDECO=[[-0.9,0.6],[0.9,0.6],[-1.05,-0.2],[-0.75,-0.8]];
const VCOL={center:C.lilac,forge:C.ember,mill:'#C08A52',mine:C.dim,market:C.gold,stash:C.tide};
// דו-ממד: צורות פשוטות. בתלת-ממד המבנים מצוירים בשכבה שמתחת (render3d.js)
function drawVillage(){
  if(!S.vil||R3D.on)return;
  const R=VILLAGE.radius,g=VILLAGE.gate;
  ctx.fillStyle='#1B2620';ctx.beginPath();ctx.arc(0,0,R+30,0,7);ctx.fill();
  ctx.strokeStyle='rgba(236,231,220,0.08)';ctx.lineWidth=40;ctx.beginPath();ctx.moveTo(0,VILLAGE.b.center.y);ctx.lineTo(g.x,g.y);ctx.stroke();
  for(const d of villageDecor()){
    if(d.kind==='tree'){ctx.fillStyle='#24452F';ctx.beginPath();ctx.arc(d.x,d.y,20+d.v*10,0,7);ctx.fill()}
    else if(d.kind==='rock'){ctx.fillStyle='#4A5064';ctx.beginPath();ctx.arc(d.x,d.y,12,0,7);ctx.fill()}
    else{ctx.fillStyle='#1E3526';ctx.beginPath();ctx.arc(d.x,d.y,70,0,7);ctx.fill()}
  }
  // השער: קשת, כמו דלת הזהב
  ctx.strokeStyle=C.chalk;ctx.lineWidth=4;ctx.fillStyle='rgba(236,231,220,0.12)';
  ctx.beginPath();ctx.moveTo(g.x-26,g.y+14);ctx.lineTo(g.x-26,g.y-14);ctx.arc(g.x,g.y-14,26,Math.PI,0);ctx.lineTo(g.x+26,g.y+14);ctx.closePath();ctx.fill();ctx.stroke();
  for(const k in VILLAGE.b){
    const B=VILLAGE.b[k],lk=vLook(k),s=lk?lk.size:1,w=B.r*1.5*s,h=B.r*0.75*s,x=B.x-w/2,y=B.y+B.r*0.4-h;
    ctx.fillStyle='rgba(5,7,13,0.4)';ctx.beginPath();ctx.ellipse(B.x,B.y+B.r*0.4,B.r,B.r*0.35,0,0,7);ctx.fill();
    ctx.strokeStyle=VCOL[k];ctx.lineWidth=3;
    if(!lk){ctx.setLineDash([8,8]);ctx.strokeRect(x,y,w,h);ctx.setLineDash([]);continue}
    if(lk.glow){ctx.shadowColor=lk.glow;ctx.shadowBlur=24}
    if(lk.model==='tent'){ctx.fillStyle=VCOL[k];ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(B.x,y-B.r*0.3);ctx.lineTo(x+w,y+h);ctx.closePath();ctx.fill()}
    else{ctx.fillStyle='#1A2033';ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);
      ctx.fillStyle=VCOL[k];ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(B.x,y-B.r*0.55*s);ctx.lineTo(x+w+8,y);ctx.closePath();ctx.fill()}
    ctx.shadowBlur=0;
    lk.deco.forEach((d,i)=>{const [dx,dy]=VDECO[i%VDECO.length],px=B.x+dx*B.r,py=B.y+dy*B.r;
      if(d==='flag'){ctx.strokeStyle=C.chalk;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py-34);ctx.stroke();ctx.fillStyle=C.tide;ctx.beginPath();ctx.moveTo(px,py-34);ctx.lineTo(px+16,py-28);ctx.lineTo(px,py-22);ctx.fill()}
      else{ctx.fillStyle=d==='crate'?'#9A6B3C':'#7A4E2A';ctx.fillRect(px-7,py-12,14,12)}});
  }
}
// שלטים מתחת למבנים, התוצרת שמחכה, וחץ לשער. מעל הכל, בשני המצבים
function drawVillageScreen(ox,oy){
  if(!S.vil)return;
  ctx.textAlign='center';ctx.direction=DIR;
  const sign=(x,y,txt,col)=>{ctx.font='800 13px Heebo, system-ui, sans-serif';const w=ctx.measureText(txt).width+16;
    ctx.fillStyle='rgba(18,22,36,0.78)';ctx.beginPath();ctx.roundRect(x-w/2,y-11,w,22,11);ctx.fill();ctx.fillStyle=col;ctx.fillText(txt,x,y+5)};
  for(const k in VILLAGE.b){
    const B=VILLAGE.b[k],L=vLv(k),x=B.x+ox,y=B.y+B.r*0.62+oy;
    sign(x,y,T('vil.'+k)+(L?' · '+L:''),L?C.chalk:C.dim);
    const n=vStock(k);if(n>0){const r=Object.keys(VILLAGE.b[k].make)[0];sign(x,y-B.r*1.6,VILLAGE.icon[r]+' '+n,C.gold)}
  }
  const g=VILLAGE.gate;sign(g.x+ox,g.y+oy+40,T('vil.gate'),C.chalk);
  edgeArrow(g.x+ox,g.y+oy,C.chalk);
}
