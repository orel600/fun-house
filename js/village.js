/* הכפר: הבית. ממנו יוצאים לעולם הפתוח דרך השער (world.js), ואליו חוזרים עם השלל.
   הכפר הוא מקום, כמו חדר הבונוס: S.vil קיים רק כשנמצאים בכפר, ו-main.js מעדכן רק את המקום הנוכחי.
   מה שנשאר בין ריצות (רמות המבנים, התרמיל, הייצור) נקרא ונכתב רק דרך SAVE (save.js), ונשמר אחרי כל שינוי.
   כל המספרים באובייקט VILLAGE. השמות והתיאורים ב-lang.js ('vil.mill' וכו'). המודלים בתלת-ממד: VIL3D ב-render3d.js
   המשחק לרוחב (ניר, 30.10.2026): הכפר פרוש לרוחב, התרמיל למעלה, הפאנל בצד, והפינה הימנית למטה נשארת פנויה לכפתורי כישורים */

const VILLAGE={
  radius:410,                     // גבול הכפר: עד כאן אפשר ללכת. השער יושב על הגבול, למטה. הכל קרוב, בלי הליכה ריקה (ניר: "אתה הולך הרבה")
  spawn:{x:0,y:50},              // איפה עומדים כשנכנסים בפעם הראשונה. חוזרים מהזירה ליד השער
  near:55,                        // כמה פיקסלים מקצה מבנה נחשב "לידו": נפתח הפאנל שלו ונאספת התוצרת
  max:5,                          // הרמה הכי גבוהה. מבנה לא עולה מעל מרכז הכפר
  gift:{coins:25,wood:20,stone:12},   // מתנת פתיחה, פעם אחת: מספיק לבנות מנסרה ומכרה
  gate:{x:0,y:410,r:44},
  /* איך מבנה נראה לפי רמה, כדי שכל שדרוג ייראה (ניר: "שידרגתי בניין בכפר גם צריך להיות אפקט").
     look: רצועות רמה. at: מאיזו רמה. model: איזה מודל (השמות ב-VIL3D.models). scale: גודל. deco: קישוטים סביב (VIL3D.deco). glow: זוהר.
     בתוך רצועה המבנה גדל עוד grow בכל רמה, ובכל שדרוג יש חגיגה (celebrate ב-fx.js) */
  grow:0.05,
  // cost[L]: מה עולה להגיע לרמה L. make: ייצור בשעה לפי רמה. cap: כמה נאגר לכל משאב עד שאוספים. המשאבים עצמם ב-RES (resources.js)
  // ברמות גבוהות מבנים צריכים מתכות טובות יותר וחומרים מיצורים, כדי שלכל משאב יהיה שימוש
  b:{
    center:{x:0,y:-162,r:92,
      look:[{at:1,model:'castle',scale:0.85,deco:[]},{at:3,model:'castle',scale:1,deco:['flag','flag']},{at:5,model:'castle',scale:1.1,deco:['flag','flag','flag','flag'],glow:C.gold}],
      cost:[null,null,{coins:40,wood:30,stone:20},{coins:90,wood:60,stone:50,copper:10,cloth:5},{coins:180,wood:120,stone:100,iron:20,cloth:15},{coins:350,wood:220,stone:200,silver:15,gold:5,horn:1,star:1}]},
    forge:{x:-255,y:-26,r:66,     // נפחייה: כל רמה פותחת עוד שכבת ציוד ליצירה (GEAR.recipes ב-gear.js), ו-Aging לציוד (aging.js) עד ה-+ של הרמה
      look:[{at:1,model:'tent',scale:1,deco:['barrel']},{at:3,model:'forge',scale:1,deco:['crate','barrel']},{at:5,model:'forge',scale:1.12,deco:['flag','flag','crate','barrel'],glow:C.ember}],
      cost:[null,{coins:20,wood:15,stone:10},{coins:50,wood:35,stone:25,copper:8},{coins:110,wood:70,stone:60,iron:15,bone:10},{coins:220,wood:140,stone:120,silver:12,hide:15},{coins:400,wood:250,stone:220,gold:10,essence:15,rubyF:1}]},
    mill:{x:255,y:-26,r:66,
      look:[{at:1,model:'mill',scale:0.85,deco:[]},{at:3,model:'mill',scale:1,deco:['crate']},{at:5,model:'mill',scale:1.12,deco:['flag','flag','crate'],glow:C.gold}],
      cost:[null,{coins:10,stone:5},{coins:30,wood:15,stone:20},{coins:70,wood:30,stone:50,copper:5},{coins:140,wood:60,stone:100,iron:10},{coins:260,wood:120,stone:180,silver:8,aquaF:1}],
      make:{wood:[0,30,50,80,120,180],cloth:[0,0,0,4,8,12]},cap:[0,60,120,200,320,500]},   // מרמה 3 גם אורגת בד
    mine:{x:-255,y:162,r:66,
      look:[{at:1,model:'mine',scale:0.85,deco:[]},{at:3,model:'mine',scale:1,deco:['barrel']},{at:5,model:'mine',scale:1.12,deco:['flag','flag','barrel'],glow:C.gold}],
      cost:[null,{coins:10,wood:10},{coins:30,wood:25,stone:10},{coins:70,wood:55,stone:25,copper:8},{coins:140,wood:110,stone:50,iron:12},{coins:260,wood:200,stone:90,silver:10,amber:1}],
      // מכרה עמוק יותר, מתכת טובה יותר: נחושת מההתחלה, ברזל מרמה 2, כסף מ-4, זהב ב-5
      make:{stone:[0,20,35,55,80,120],copper:[0,4,6,8,10,12],iron:[0,0,3,6,9,12],silver:[0,0,0,0,2,4],gold:[0,0,0,0,0,1.5]},cap:[0,40,80,140,220,350]},
    market:{x:255,y:162,r:66,     // המחירים והכמות בכל לחיצה ב-RES (resources.js). כל רמה נוספת: bonus יותר טוב, ועוד נדירות שאפשר לקנות
      cost:[null,{coins:15,wood:15},{coins:40,wood:30,stone:20,cloth:4},{coins:90,wood:60,stone:50,cloth:10,copper:6},{coins:180,wood:120,stone:100,iron:15,venom:6},{coins:320,wood:220,stone:180,silver:10,essence:10,sapphireF:1}],
      bonus:0.2,
      look:[{at:1,model:'tent',scale:1,deco:['crate','crate']},{at:3,model:'market',scale:1,deco:['crate','barrel']},{at:5,model:'market',scale:1.1,deco:['flag','flag','crate','barrel'],glow:C.gold}]},
    stash:{x:-145,y:280,r:60,     // מחסן: המקום הבטוח לשלל (stash.js). cap[L]: כמה יחידות הוא מחזיק ברמה L
      cost:[null,{coins:15,wood:10},{coins:40,wood:30,stone:15,cloth:6},{coins:90,wood:60,stone:45,copper:10,hide:8},{coins:180,wood:120,stone:90,iron:15,bone:15},{coins:320,wood:220,stone:160,silver:10,venom:8,boltF:1}],
      cap:[0,150,400,900,2000,5000],
      look:[{at:1,model:'tent',scale:0.9,deco:['crate']},{at:3,model:'market',scale:0.95,deco:['crate','crate','barrel']},{at:5,model:'market',scale:1.05,deco:['flag','flag','crate','barrel'],glow:C.tide}]}
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
  for(const r in p.have){const w=Math.floor(p.have[r]);if(w>0){bagAdd(r,w);questEvent('collect',r,w);p.have[r]-=w;n+=w;floatText(P.x,y,'+'+w+' '+resIcon(r),C.gold,17);y-=20}}
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
// מחיר ליחידה. רמת שוק גבוהה משלמת יותר וגובה פחות, אבל קנייה תמיד יקרה ממכירה, אחרת אפשר להרוויח בלי לשחק
function vPrice(r,kind){
  const R=resOf(r),k=1+VILLAGE.b.market.bonus*Math.max(0,vLv('market')-1),sell=Math.round(R.sell*k);
  return kind==='sell'?sell:Math.max(sell+1,Math.round(R.buy/k));
}
const vLot=r=>RES.rarity[resOf(r).rar].lot;
// מה השוק מוכן לעשות עם משאב עכשיו: למכור צריך מחיר מכירה, ולקנות צריך מחיר קנייה ורמת שוק לפי הנדירות
function vCanTrade(kind,r){
  const R=resOf(r),L=vLv('market');if(!R||!L)return false;
  return kind==='sell'?!!R.sell:!!R.buy&&L>=RES.rarity[R.rar].market;
}
function vTrade(kind,r){
  if(!vCanTrade(kind,r))return false;const n=vLot(r);
  if(kind==='sell'){if(!bagTake(r,n))return false;bagAdd('coins',vPrice(r,'sell')*n)}
  else{if(!bagTake('coins',vPrice(r,'buy')*n))return false;bagAdd(r,n)}
  saveNow();return true;
}

/* ---- מעבר בין הכפר לזירה ---- */
function villageUi(on){document.body.classList.toggle('vil',on);$('vhud').hidden=!on;if(!on){$('vPanel').hidden=true;npcHide()}}
function enterVillage(){
  const back=S&&(S.mode==='over'||S.wd);   // חוזרים מהעולם (או מריצה): ליד השער
  reset();S.mode='play';S.vil={near:null,ui:'',raise:{}};
  const at=back?{x:VILLAGE.gate.x,y:VILLAGE.gate.y-110}:VILLAGE.spawn;
  P.x=at.x;P.y=at.y;P.aim=P.face=-Math.PI/2;S.cam.x=P.x;S.cam.y=P.y;
  ['ovStart','ovOver','ovLevel','ovBoss'].forEach(id=>$(id).hidden=true);
  for(const k in VILLAGE.b)vSettle(k);   // הייצור מאז הביקור הקודם
  if(!SAVE.gift){for(const r in VILLAGE.gift)bagAdd(r,VILLAGE.gift[r]);SAVE.gift=true;banner(T('vil.gift'),C.gold)}
  else banner(T('vil.home'),C.gold);
  rankSync();questsRefresh();   // רמת הדמות (ranks.js), יום חדש וקווסטים שנפתחו (quests.js)
  saveNow();
  villageUi(true);
}
function leaveVillage(){villageUi(false);enterWorld('home');questEvent('reach','world')}   // השער מוביל לעולם הפתוח (world.js), והזירות בתוכו

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
  npcUpdate(dt);   // התושבים: הולכים, מנופפים, וכפתור "לדבר" (npc.js)
  for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.9;p.vy*=0.9;p.life-=dt}
  parts=parts.filter(p=>p.life>0);
  for(const f of floats){f.y+=f.vy*dt;f.life-=dt}
  floats=floats.filter(f=>f.life>0);
  villageHud();
}

/* ---- שלל מהזירה ---- */
const runLoot=()=>S.loot||(S.loot={});
// נקרא מ-bossDown: אחרי רגע של ניצחון חוזרים הביתה (מחכים אם פתוח מסך שדרוג או חדר בונוס)
function runWon(){
  const s=S;
  setTimeout(function w(){if(S!==s||S.mode==='over')return;if(S.mode!=='play'||S.room){setTimeout(w,400);return}S.won=true;gameOver()},VILLAGE.winDelay*1000);
}
// נקרא מ-gameOver, גם במוות וגם בניצחון: השלל עובר לתרמיל ונשמר
function runEnd(){
  if(S.lootDone)return;S.lootDone=true;
  dropsCollectAll();   // מה שנשאר על הרצפה (drops.js)
  const L=runLoot();if(S.bn&&S.bn.coins)L.coins=(L.coins||0)+S.bn.coins;
  for(const r in L){bagAdd(r,L[r]);questEvent('collect',r,L[r])}
  rankRunXp();   // חלק מה-XP של הריצה נשאר לדמות (ranks.js)
  saveNow();
  $('overTitle').textContent=T(S.won?'vil.won':'fell');
  $('sLoot').innerHTML=lootSummary(L)||T('vil.noLoot');   // מהנדיר לרגיל (loot.js)
}

/* ---- ממשק: התרמיל למעלה, והפאנל של המבנה שלידו למטה ---- */
// משאב אחד כתג: אייקון ומספר. משאב נדיר מקבל מסגרת בצבע הנדירות שלו
const resChip=(r,n,cls='')=>{const R=resOf(r);return '<span class="res'+cls+(R&&R.rar?' rare" style="--tint:'+RES.rarity[R.rar].col:'')+'" data-tip="'+r+'" aria-label="'+resName(r)+'">'+resIcon(r)+' '+n+'</span>'};
// list: אילו משאבים להראות, גם כשיש 0. בלי list: רק מה שיש
const bagLine=(bag,list)=>(list||Object.keys(RES.list).filter(r=>bag[r]>0)).map(r=>resChip(r,bag[r]||0)).join('');
// הפס העליון: שורה אחת, מספרים קצרים (1.3K), ולכל היותר UI.top משאבים. מה שלא נכנס: כפתור "+N" שפותח את התרמיל (ui.js)
const topLine=(bag,list)=>{const ks=list||Object.keys(RES.list).filter(r=>bag[r]>0),sh=ks.length>UI.top?ks.slice(0,UI.top-1):ks;
  return sh.map(r=>resChip(r,shortN(bag[r]))).join('')+(ks.length>sh.length?'<button class="resmore" aria-label="'+T('ui.more')+'">+'+(ks.length-sh.length)+'</button>':'')};
// התרמיל המלא לפי משפחות: טבע ובנייה, מתכות, יצורים, בוסים, נדיר. only: רק משפחה אחת (הסינון בתרמיל). משפחה ריקה לא מוצגת
const bagFams=(bag,only)=>Object.keys(RES.fams).filter(f=>!only||only==='all'||f===only).map(f=>{const rs=resFam(f).filter(r=>bag[r]>0);
  return rs.length?'<div class="fam"><span class="sk">'+T('fam.'+f)+'</span><div class="bag">'+bagLine(bag,rs)+'</div></div>':''}).join('');
function costLine(c){return Object.keys(c).map(r=>resChip(r,c[r],bagHas(r,c[r])?'':' miss')).join('')}
// מה מבנה מייצר בשעה ברמה L, למשל '30🪵 4🧵'
const makeLine=(B,L)=>Object.keys(B.make).filter(r=>B.make[r][L]>0).map(r=>'<bdi>'+B.make[r][L]+resIcon(r)+'</bdi>').join(' ');
function vInfo(k,L){
  const B=VILLAGE.b[k];if(L<1)return T('vil.notBuilt');
  if(k==='center')return T('vil.info.center',L);
  if(k==='forge')return T('vil.info.forge',T('vil.tiers')[L-1],AGING.byForge[L]);
  if(B.make)return T('vil.info.make',makeLine(B,L),B.cap[L]);
  if(k==='market')return T('vil.info.market',Math.round(B.bonus*(L-1)*100));
  if(k==='stash')return T('vil.info.stash',B.cap[L]);
}
function villageHud(){
  const k=S.vil.near,L=k?vLv(k):0;
  // בונים מחדש רק כשמשהו השתנה: מבנה אחר, רמות, תרמיל, מחסן או שפה
  // ✕ סוגר את הפאנל עד שמתרחקים (shut). ליד מבנה אחר הוא נפתח שוב
  const cur=S.vil.gate?'gate':k;if(S.vil.shut&&S.vil.shut!==cur)S.vil.shut=null;const shut=!!cur&&S.vil.shut===cur;
  if(cur!=='market'||shut)S.vil.trade=false;   // חלון המסחר הגדול: רק ליד השוק
  const key=LANG+'|'+k+'|'+S.vil.gate+'|'+shut+'|'+S.vil.trade+'|'+JSON.stringify(SAVE.village)+'|'+JSON.stringify(SAVE.bag)+'|'+JSON.stringify(SAVE.stash);
  if(key===S.vil.ui)return;S.vil.ui=key;
  $('vBag').innerHTML=topLine(SAVE.bag,resShown(k));   // רק מה שרלוונטי ליד המבנה הזה (RES.show)
  const pn=$('vPanel');pn.hidden=!cur||shut;pn.classList.toggle('big',!!S.vil.trade);if(pn.hidden)return;
  if(S.vil.trade){pn.innerHTML=winHead(T('vil.market'),T('level',L))+tradeHtml(L);return}
  if(S.vil.gate){pn.innerHTML=winHead(T('vil.out'))+'<p>'+T('vil.outInfo')+'</p><button class="vbtn" data-act="go">'+T('vil.leave')+'</button>';return}
  const why=vBlock(k),c=vCost(k);
  let h=winHead(T('vil.'+k),L?T('level',L):'')+'<p>'+vInfo(k,L)+'</p>';
  if(why!=='max')h+='<p class="next">'+T('vil.next',vInfo(k,L+1))+'</p><div class="cost">'+costLine(c)+'</div>';
  h+='<button class="vbtn" data-act="up"'+(why?' disabled':'')+'>'+(why==='max'?T('vil.max'):why==='center'?T('vil.needCenter'):L?T('vil.up',L+1):T('vil.build'))+'</button>';
  if(k==='forge'&&L>0)h+='<button class="vbtn ghost" data-act="forge">⚒️ '+T('age.open')+'</button>';
  if(k==='market'&&L>0)h+='<button class="vbtn" data-act="trade">🛒 '+T('vil.trade')+'</button>';
  if(k==='forge'&&L>0)h+=forgeHtml();   // gear.js
  if(k==='stash'&&L>0)h+=stashHtml();   // stash.js
  pn.innerHTML=h;
}
// חלון המסחר: מסך כמעט מלא, מוכרים בטור אחד וקונים בטור השני (לרוחב), ורק הרשתות גוללות.
// מוכרים כל מה שיש בתרמיל, וקונים כל מה שהרמה של השוק מרשה. כרטיס שאי אפשר ללחוץ עליו אומר למה
function tradeHtml(L){
  let h='';{
    const rs=Object.keys(RES.list),card=(kind,r,why,p)=>'<button class="tcard" data-act="'+kind+'" data-r="'+r+'"'+(why?' disabled':'')+' aria-label="'+T('vil.'+kind)+' '+resName(r)+'" style="--rar:'+RES.rarity[resOf(r).rar||0].col+'">'+
      '<span class="ti">'+resIcon(r)+'<small>×'+vLot(r)+'</small></span><span class="tp"><bdi>'+p+'</bdi>'+resIcon('coins')+'</span>'+(why?'<span class="tw">'+why+'</span>':'')+'</button>';
    const sell=rs.filter(r=>vCanTrade('sell',r)&&bagHas(r)),buy=rs.filter(r=>resOf(r).buy);
    h+='<section><span class="sk">'+T('vil.sell')+'</span>'+(sell.length?'<div class="trade">'+sell.map(r=>card('sell',r,bagHas(r,vLot(r))?'':T('vil.needN',vLot(r)),'+'+vPrice(r,'sell')*vLot(r))).join('')+'</div>':'<p class="next">'+T('stash.empty')+'</p>')+'</section>';
    h+='<section><span class="sk">'+T('vil.buy')+'</span><div class="trade">'+buy.map(r=>{const p=vPrice(r,'buy')*vLot(r);
      return card('buy',r,!vCanTrade('buy',r)?'🔒 '+T('vil.mkLv',RES.rarity[resOf(r).rar].market):bagHas('coins',p)?'':T('vil.noCoins'),p)}).join('')+'</div></section>';
  }
  return '<div class="tcols">'+h+'</div>';
}
$('vPanel').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled||!S.vil)return;
  const a=b.dataset.act;
  if(a==='go'){leaveVillage();return}
  if(a==='close'){vShut();return}
  if(a==='trade'){S.vil.trade=true;villageHud();return}
  if(!S.vil.near)return;
  if(a==='forge'){forgeOpen();return}
  if(a==='bag'){gearOpen();return}   // מהמחסן: מסך הציוד, שם גוררים בין התרמיל למחסן (gear.js)
  if(a==='up')vUpgrade(S.vil.near);else if(a==='stash')stashMove(b.dataset.dir,b.dataset.r);else if(a==='craft')gearCraft(b.dataset.r);else vTrade(a,b.dataset.r);
  villageHud();
});

// ✕ בפאנל: נסגר עד שמתרחקים מהמבנה (או מהשער)
function vShut(){if(!S.vil)return;if(S.vil.trade){S.vil.trade=false;villageHud();return}   // מחלון המסחר חוזרים לפאנל של השוק
  S.vil.shut=S.vil.gate?'gate':S.vil.near;villageHud()}

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
    const n=vStock(k);if(n>0){const r=Object.keys(VILLAGE.b[k].make)[0];sign(x,y-B.r*1.6,resIcon(r)+' '+n,C.gold)}
  }
  const g=VILLAGE.gate;sign(g.x+ox,g.y+oy+40,T('vil.gate'),C.chalk);
  edgeArrow(g.x+ox,g.y+oy,C.chalk);
}
