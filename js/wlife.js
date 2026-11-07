/* עולם שיש בו חיים (docs/concept-world-life.md, ניר אישר 7.11.2026 את שלושת הרעיונות הראשונים). שלושה חלקים, מודול אחד:
   1. מחנות חיים: כל ציון דרך מסוג camp (map.marks) מקבל עמוד עשן שרואים מרחוק, גחלים, ודמות שיושבת ליד האש.
      בביקור הראשון היא אומרת שורה ונותנת מתנה קטנה (פעם אחת לתמיד, SAVE.wlife.met). אחר כך האש מרפאת מי שעומד לידה.
   2. שרידים: האזור מחולק למשבצות של rem.cell. משבצת שאין בה שום דבר מעניין במרחק rem.clear, ושהיא קרקע פתוחה (לא מים, יער או צוק),
      מקבלת שריד: עגלה הפוכה, תרמיל ישן, ארגז שבור או אוהל קרוע. שלל קטן פעם אחת (SAVE.wlife.got), והשריד נשאר כקישוט.
      המזהה קבוע לפי המשבצת (rm_<אזור>_<i>_<j>), ולכן שריד שנלקח לא חוזר אחרי עדכון.
   3. חיות שבורחות: להקות קטנות לפי אזור. כשמתקרבים הן בורחות (ציפורים עפות). לפעמים חיה זהובה שמשאירה מטבעות.
      זזות רק ליד השחקן, ובתלת-ממד מצוירות במופע אחד לכל חלק (InstancedMesh), מצורות פשוטות.
   לא כופלים: הסודות (secrets.js) נשארים מוסתרים, העגלה ההפוכה (events.js) היא אירוע, והרחה של פיוחו (petscent.js) לא נוגעת כאן.
   החיבורים: worldUpdate ו-drawWorld ב-world.js, ו-props3dWorldTick ב-props3d.js (תלת-ממד). הטקסטים ב-lang.js תחת 'wl.' */
const WLIFE={
  on:{meadow:1,lake:1,ridge:1,desert:1,storm:1,shadow:1},   // באילו אזורים זה פועל (ניר אישר את המראה ב-7.11, ואז כל השישה)
  camp:{
    smoke:{h:660,puffs:24,rise:52,r:[22,92],a:0.7,col:'#E4DFD6',edge:'#9E978C',wind:80},   // עמוד העשן: גובה, כמה עננים, מהירות עלייה, גודל, שקיפות, נטייה ברוח
    npc:{dx:46,dy:16},       // איפה הדמות יושבת ביחס לאש
    talk:120,                // מאיזה מרחק הדמות מדברת ונותנת מתנה
    bubble:4.5,              // כמה שניות הבועה נשארת
    say:{size:13,w:210,up:92},   // הבועה: גודל טקסט ורוחב על המסך, וכמה מעל הרגליים של הדמות הזנב (מעל הראש)
    heal:{r:130,rate:0.06},  // ריפוי ליד האש: רדיוס, וחלק מהחיים בשנייה
    gift:{coins:[1,25],wood:[0.6,4],stone:[0.6,4],herb:[0.5,2],iron:[0.3,1]},
    embers:900               // מאיזה מרחק הגחלים (sf_embers) מנגנות
  },
  rem:{
    cell:750,clear:550,near:260,jit:170,tries:7,gap:520,   // משבצת, מרחק ממשהו מעניין, וכמה השריד זז ממרכז המשבצת
    edge:260,                     // לא קרוב לגבול האזור
    touch:56,size:1.9,           // כמה קרוב כדי לקחת, ופי כמה המודל בתלת-ממד
    hint:2.8,                     // כל כמה שניות ניצוץ מעל שריד שעוד לא נלקח
    loot:{coins:[1,12],wood:[0.5,3],stone:[0.5,3],iron:[0.25,1],silver:[0.08,1]},
    chest:{coins:[1,20],iron:[0.5,1],silver:[0.2,1],ruby:[0.05,1],sapphire:[0.05,1]}   // ארגז שבור: קצת יותר
  },
  herd:{
    wake:1700,        // רק להקה בטווח הזה מהשחקן זזה
    reset:1500,       // להקה שברחה חוזרת הביתה כשהשחקן רחוק ממנה כל כך, והיא לא על המסך
    gold:0.12,        // הסיכוי שבלהקה יש חיה זהובה (בכל כניסה לאזור)
    goldLoot:{coins:[1,8]},
    space:780         // מרחק מינימלי בין להקות
  },
  /* החיות: body צורת הגוף (WL_PARTS), גודל, כמה בלהקה, מרחק בהלה, מהירות בריחה, כמה זמן בורחות, וצבעים.
     hop קופצת, swim שוחה (גם על המים), fly עפה כשבורחת, circle חגה באוויר מעל שריד (נשרים במדבר), float מרחפת ויכולה להיות גם מעל תהום, glow זוהרת */
  beasts:{
    deer:{body:'deer',n:[3,5],scare:300,run:420,flee:2.6,s:1.15,col:'#A87442',col2:'#6B4426'},
    rabbit:{body:'rabbit',n:[2,4],scare:210,run:460,flee:1.8,s:2.2,col:'#B79C7B',col2:'#F2EBDD',hop:1},
    bird:{body:'bird',n:[4,6],scare:240,run:360,flee:3.5,s:1.7,col:'#7A5A3E',col2:'#E2A13A',fly:1},
    duck:{body:'duck',n:[3,5],scare:230,run:300,flee:2.2,s:2.4,col:'#8A6A48',col2:'#2F7A4E',swim:1},
    gull:{body:'bird',n:[3,5],scare:260,run:380,flee:3.5,s:1.8,col:'#ECEFF2',col2:'#E2A13A',fly:1},
    goat:{body:'goat',n:[2,4],scare:280,run:400,flee:2.4,s:1.1,col:'#E6E1D6',col2:'#5A5048'},
    hare:{body:'rabbit',n:[2,3],scare:220,run:470,flee:1.8,s:2.2,col:'#F1F3F6',col2:'#C9CED8',hop:1},
    lizard:{body:'lizard',n:[2,4],scare:200,run:520,flee:1.4,s:1.8,col:'#C9A35A',col2:'#7E5E2E'},
    vulture:{body:'bird',n:[3,4],scare:260,run:330,flee:4,s:3.2,col:'#3B302A',col2:'#D9C9A8',fly:1,circle:1},
    crow:{body:'bird',n:[4,6],scare:250,run:380,flee:3.5,s:2.3,col:'#26262F',col2:'#4B4B58',fly:1},
    wisp:{body:'wisp',n:[3,5],scare:240,run:300,flee:3,s:2.8,col:'#B89CFF',col2:'#F4EEFF',float:1,glow:1}
  },
  /* לכל אזור: אילו חיות (ובאיזה משקל), כמה להקות, אילו שרידים, ו-clear משלו (בלי: WLIFE.rem.clear).
     glow: בלב הצל הכל זוהר קצת, אחרת לא רואים. circle: כמה להקות של נשרים מעל שרידים */
  regions:{
    meadow:{beasts:['deer','deer','rabbit','bird'],herds:21,rem:['cart','pack','chest','tent'],clear:500},
    lake:{beasts:['duck','duck','gull','deer'],herds:17,rem:['pack','chest','cart','tent'],clear:500},
    ridge:{beasts:['goat','goat','hare','bird'],herds:13,rem:['tent','pack','chest','cart'],clear:500},
    desert:{beasts:['lizard','lizard','lizard'],herds:18,circle:2,rem:['cart','pack','chest','tent'],clear:500},
    storm:{beasts:['crow','crow','rabbit'],herds:13,rem:['cart','chest','pack','tent']},
    shadow:{beasts:['wisp','wisp','wisp','crow'],herds:26,rem:['chest','pack','tent','cart'],clear:480,glow:'#8E6CF0'}
  }
};

const WLS=()=>SAVE.wlife||(SAVE.wlife={met:{},got:{}});
const wlOn=()=>S&&S.wd&&WLIFE.on[S.wd.reg]&&!WR().dpBase;
const wlReg=()=>WLIFE.regions[S.wd.reg]||WLIFE.regions.meadow;
// המצב באזור: נבנה פעם אחת בכל כניסה (S.wd חדש בכל כניסה)
function wlState(){
  const W=S.wd;if(W.wl)return W.wl;const reg=W.reg,R=WR();
  const camps=((R.map&&R.map.marks)||[]).filter(m=>m.kind==='camp').map((m,i)=>({id:'cp_'+reg+'_'+m.id,x:m.x,y:m.y,i,bub:0,fx:null,near:false}));
  const st=W.wl={camps,rems:wlRemnants(reg,R,camps),herds:[],hint:0,lastT:0};
  st.herds=wlHerds(reg,R,st);
  return st;
}

/* ---- איפה יש כבר משהו מעניין: לפיהם ממלאים את הריק. r: מאיזה מרחק הוא "ממלא" את המקום.
   מה שרואים (שער, ציון דרך, אבן מסע, פנס, דמות) ממלא עד rem.clear. מה שמוסתר בכוונה (סודות, מאורות נדירות) לא ממלא, רק לא נדחסים עליו ---- */
function wlBusy(reg,R){
  const Z=WLIFE.rem,pts=[{x:R.home.x,y:R.home.y,r:Z.clear}];const add=(o,r=Z.clear)=>{if(o&&o.x!=null)pts.push({x:o.x,y:o.y,r})};
  const gs=wGates(true);for(const k in gs)add(gs[k]);for(const k in R.paths||{})add(R.paths[k]);
  const M=R.map||{};(M.marks||[]).forEach(o=>add(o));(R.waystones||[]).forEach(o=>add(o));
  if(typeof STORY!=='undefined')for(const k in STORY.lanterns)if(STORY.lanterns[k].reg===reg)add(STORY.lanterns[k]);
  if(typeof WNPC!=='undefined')for(const id in WNPC.list)if((WNPC.list[id].reg||'meadow')===reg)add(WNPC.list[id].at);
  for(const s of (typeof SECRETS!=='undefined'&&SECRETS.regions[reg])||[]){add(s,Z.near);if(s.to)add(s.to,Z.near)}
  (M.dens||[]).forEach(o=>add(o,Z.near));
  if(typeof SIDEQ!=='undefined')for(const k in SIDEQ.places[reg]||{})add(SIDEQ.places[reg][k],Z.near);
  return pts;
}
// בתוך מים (נהר, אגם או בריכה): ברווזים שוחים שם
function wlWater(x,y){const M=typeof TR!=='undefined'&&TR&&TR.map;if(M&&(M.water||[]).some(W_=>inPoly(x,y,W_)&&tBlocked(x,y)&&polyDist(x,y,W_)>40))return true;return(WR().ponds||[]).some(p=>Math.hypot(p.x-x,p.y-y)<p.r-30)}
// קרקע פתוחה: לא חסום (מים, צוק, יער), לא מאט (שבילי יער, ביצה), ולא ליד מים. גם ארבע נקודות מסביב
function wlOpen(x,y,r=50){
  if(typeof tBlocked!=='function')return true;
  for(const [dx,dy] of [[0,0],[r,0],[-r,0],[0,r],[0,-r]]){const a=x+dx,b=y+dy;if(tBlocked(a,b)||tSlow(a,b)<0.99)return false}
  const w=typeof tWaterNear==='function'&&tWaterNear(x,y);if(w&&w.e<110)return false;
  return!(WR().ponds||[]).some(p=>Math.hypot(p.x-x,p.y-y)<p.r+80);
}
function wlRemnants(reg,R,camps){
  const Z=WLIFE.rem,{w,h}=R.size,busy=wlBusy(reg,R),kinds=wlReg().rem,clr=wlReg().clear||Z.clear,out=[];
  const nx=Math.floor(w/Z.cell),ny=Math.floor(h/Z.cell),x0=-nx*Z.cell/2,y0=-ny*Z.cell/2;
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const v=hash(i*7.13+reg.length,j*3.71);let at=null;
    for(let k=0;k<Z.tries&&!at;k++){   // כמה נקודות בתוך המשבצת, והראשונה שמתאימה. הראשונה קרובה למרכז
      const sp=k?Z.cell*0.42:Z.jit,x=x0+(i+0.5)*Z.cell+(hash(i+k*3.1,j+11)-0.5)*sp*2,y=y0+(j+0.5)*Z.cell+(hash(i+5,j+k*1.7)-0.5)*sp*2;
      if(Math.abs(x)>w/2-Z.edge||Math.abs(y)>h/2-Z.edge)continue;
      if(busy.some(p=>Math.hypot(p.x-x,p.y-y)<(p.r===Z.clear?clr:p.r))||out.some(p=>Math.hypot(p.x-x,p.y-y)<Z.gap))continue;
      if(wlOpen(x,y))at={x,y}}
    if(at)out.push({id:'rm_'+reg+'_'+i+'_'+j,x:at.x,y:at.y,kind:kinds[(i+j*3+Math.floor(v*2))%kinds.length],rot:hash(at.x,at.y)*6.28});
  }
  return out;
}
function wlHerds(reg,R,st){
  const Z=WLIFE.herd,D=wlReg(),{w,h}=R.size,busy=wlBusy(reg,R),out=[];
  const home={x:R.home.x,y:R.home.y},B0=placeBox();
  // נשרים: חגים מעל שרידים (החיות מצביעות על משהו)
  const circ=D.circle?Object.keys(WLIFE.beasts).find(k=>WLIFE.beasts[k].circle):null;
  if(circ)for(const r of st.rems.filter((r,i)=>i%3===1).slice(0,D.circle))out.push({id:'hd_'+reg+'_c'+out.length,x:r.x,y:r.y,sp:circ,a:[],scared:0,gone:false});
  const n0=out.length;
  for(let k=0;k<500&&out.length<D.herds+n0;k++){
    const x=(hash(k*1.7,reg.length*3.3)-0.5)*(w-700),y=(hash(k*2.9+4,reg.length)-0.5)*(h-700);
    const sp=D.beasts[Math.floor(hash(k,9.1)*D.beasts.length)%D.beasts.length],B=WLIFE.beasts[sp];
    if(Math.hypot(x-home.x,y-home.y)<700)continue;
    if(out.some(o=>Math.hypot(o.x-x,o.y-y)<(B.float||B.swim?Z.space*0.65:Z.space)))continue;
    if(busy.some(p=>Math.hypot(p.x-x,p.y-y)<Math.min(p.r,300))||st.rems.some(r=>Math.hypot(r.x-x,r.y-y)<220))continue;
    if(B.float?(B0&&(x<B0.x0||x>B0.x1||y<B0.y0||y>B0.y1)):B.swim?!(wlWater(x,y)||wlOpen(x,y,90)):!wlOpen(x,y,90))continue;   // מרחפות: גם מעל תהום. שוחות: גם במים
    out.push({id:'hd_'+reg+'_'+out.length,x,y,sp,a:[],scared:0,gone:false});
  }
  for(const H of out)wlHerdFill(H);
  return out;
}
// החיות בלהקה, במקום הבית. זהובה בסיכוי קטן (בכל כניסה)
function wlHerdFill(H){
  const B=WLIFE.beasts[H.sp],n=B.n[0]+Math.floor(Math.random()*(B.n[1]-B.n[0]+1)),gi=Math.random()<WLIFE.herd.gold?Math.floor(Math.random()*n):-1;
  H.a=[];H.scared=0;H.gone=false;H.paid=false;
  for(let i=0;i<n;i++){const a=i/n*6.28+Math.random(),r=30+Math.random()*70;
    H.a.push({x:H.x+Math.cos(a)*r,y:H.y+Math.sin(a)*r*0.7,face:Math.random()*6.28,z:B.circle?150+i*12:B.float?18:0,ang:a,vx:0,vy:0,t:Math.random()*4,ph:Math.random()*6.28,walk:0,gold:i===gi,tx:null,ty:null})}
}

/* ---- כל פריים בעולם (worldUpdate) ---- */
function wlifeUpdate(dt){
  if(!wlOn())return;const st=wlState(),Z=WLIFE;st.hint+=dt;
  // מחנות: מתנה בביקור הראשון, בועה, ריפוי ליד האש, וגחלים כשקרובים
  for(const c of st.camps){
    const d=Math.hypot(P.x-c.x,P.y-c.y),nx=c.x+Z.camp.npc.dx,ny=c.y+Z.camp.npc.dy;
    if(c.bub>0)c.bub-=dt;
    if(d<Z.camp.talk&&!c.near){c.near=true;c.bub=Z.camp.bubble;
      if(!WLS().met[c.id]){WLS().met[c.id]=1;saveNow();runGive(Z.camp.gift,nx,ny-20);sfx('xp');c.first=true;sparks(nx,ny-30,C.gold,14,160)}else c.first=false}
    else if(d>Z.camp.talk+140)c.near=false;
    if(d<Z.camp.heal.r&&P.hp<P.maxHp&&P.hp>0){P.hp=Math.min(P.maxHp,P.hp+P.maxHp*Z.camp.heal.rate*dt);if(Math.random()<dt*3)sparks(P.x,P.y-20,'#7FE08A',2,60)}
    if(d<Z.camp.embers&&!c.fx&&typeof fxPlay==='function')c.fx=fxPlay('sf_embers',c.x,c.y-26,{loop:true,size:110,add:true,alpha:0.8});
    else if(d>Z.camp.embers+200&&c.fx){fxStop(c.fx);c.fx=null}
  }
  // שרידים: לוקחים פעם אחת
  for(const r of st.rems){
    if(WLS().got[r.id])continue;
    if(Math.abs(P.x-r.x)<Z.rem.touch+20&&Math.abs(P.y-r.y)<Z.rem.touch+20&&Math.hypot(P.x-r.x,P.y-r.y)<Z.rem.touch+14){
      WLS().got[r.id]=1;saveNow();runGive(r.kind==='chest'?Z.rem.chest:Z.rem.loot,r.x,r.y-10);sfx('tap');sparks(r.x,r.y-12,C.gold,12,150);
      floatText(r.x,r.y-46,T('wl.rem.'+r.kind),C.gold,14);if(typeof questEvent==='function')questEvent('remnant',r.kind,1)}
  }
  for(const H of st.herds)wlHerd(H,dt);
}
function wlHerd(H,dt){
  const Z=WLIFE.herd,B=WLIFE.beasts[H.sp],dh=Math.hypot(P.x-H.x,P.y-H.y);
  if(H.scared||H.gone){   // חוזרת הביתה כשאין מי שיראה
    const far=H.a.every(a=>Math.hypot(P.x-a.x,P.y-a.y)>Z.reset)&&dh>Z.reset;
    if(far&&!wlSeen(H.x,H.y)){wlHerdFill(H);return}}
  if(dh>Z.wake+600&&!H.scared)return;
  let fear=false;for(const a of H.a)if((a.z<1||B.circle||B.float)&&Math.hypot(P.x-a.x,P.y-a.y)<B.scare)fear=true;
  if(fear&&!H.gone){
    if(!H.scared)sfx('tap',0.4);H.scared=Math.max(H.scared,B.flee);
    for(const a of H.a){const dx=a.x-P.x,dy=a.y-P.y,dl=Math.hypot(dx,dy)||1,j=(Math.random()-0.5)*0.9,an=Math.atan2(dy/dl,dx/dl)+j;
      if(a.fl!==1){a.fl=1;a.vx=Math.cos(an)*B.run*(0.85+Math.random()*0.3);a.vy=Math.sin(an)*B.run*(0.85+Math.random()*0.3)}
      if(a.gold&&!H.paid){H.paid=true;runGive(Z.goldLoot,a.x,a.y-10);sparks(a.x,a.y-14,C.gold,16,170)}}}
  if(H.scared>0){H.scared-=dt;
    for(const a of H.a){
      if(B.fly||B.float){if(B.fly)a.z=Math.min(B.circle?260:160,a.z+dt*140);else a.z=18+Math.sin(a.walk*0.4)*6;a.x+=a.vx*dt;a.y+=a.vy*dt}
      else{const nx=a.x+a.vx*dt,ny=a.y+a.vy*dt;
        if(typeof tBlocked==='function'&&tBlocked(nx,ny)&&!(B.swim&&wlWater(nx,ny))){const an=Math.atan2(a.vy,a.vx)+(Math.random()<0.5?1:-1)*1.2,s=Math.hypot(a.vx,a.vy);a.vx=Math.cos(an)*s;a.vy=Math.sin(an)*s}
        else{a.x=nx;a.y=ny}}
      a.face=Math.atan2(a.vy,a.vx);a.walk+=dt*(B.hop?9:12)}
    if(H.scared<=0){H.scared=0;for(const a of H.a){a.fl=0;a.vx=a.vy=0}
      if(B.fly)H.gone=true;   // הציפורים עפו: לא נראות עד שהלהקה חוזרת
      else if(B.float){let sx=0,sy=0;for(const a of H.a){sx+=a.x;sy+=a.y}H.x=sx/H.a.length;H.y=sy/H.a.length}
      else{let sx=0,sy=0;for(const a of H.a){sx+=a.x;sy+=a.y}H.x=sx/H.a.length;H.y=sy/H.a.length}}   // רגועות במקום החדש, ואפשר להבהיל שוב
    return}
  if(B.circle){for(const a of H.a){a.ang+=dt*0.55;const r=70+(a.z-150)*1.4;a.x=H.x+Math.cos(a.ang)*r;a.y=H.y+Math.sin(a.ang)*r*0.6;a.face=a.ang+Math.PI/2;a.walk+=dt}return}   // נשרים חגים מעל השריד
  if(B.float){for(const a of H.a){a.walk+=dt*3;a.z=18+Math.sin(a.walk*0.4+a.ph)*6;a.x+=Math.sin(a.walk*0.13+a.ph)*10*dt;a.y+=Math.cos(a.walk*0.11+a.ph)*7*dt}return}   // רוחות מרחפות במקום
  // רועות: כל אחת הולכת לאט לנקודה קרובה, ועומדת
  for(const a of H.a){a.t-=dt;
    if(a.tx==null&&a.t<=0){const an=Math.random()*6.28,r=20+Math.random()*90;a.tx=H.x+Math.cos(an)*r;a.ty=H.y+Math.sin(an)*r*0.7}
    if(a.tx!=null){const dx=a.tx-a.x,dy=a.ty-a.y,dl=Math.hypot(dx,dy),s=B.hop?60:28;
      if(dl<4||(typeof tBlocked==='function'&&tBlocked(a.tx,a.ty)&&!(B.swim&&wlWater(a.tx,a.ty)))){a.tx=null;a.t=2+Math.random()*4}
      else{a.x+=dx/dl*s*dt;a.y+=dy/dl*s*dt;a.face=Math.atan2(dy,dx);a.walk+=dt*(B.hop?9:5)}}}
}
const wlSeen=(x,y)=>typeof onScreen!=='function'||onScreen(x-S.cam.x+W/2,y-S.cam.y+H/2,200);

/* ---- ציור בקנבס (drawWorld). בתלת-ממד החיות, השרידים והדמויות מודלים (wlife3d), וכאן רק עשן, בועה וניצוצות ---- */
function wlifeDraw(){
  if(!wlOn())return;const st=wlState(),Z=WLIFE,t=fxNow(),two=!R3D.on;
  for(const c of st.camps){
    if(!wlSeen(c.x,c.y-Z.camp.smoke.h*0.6)&&!wlSeen(c.x,c.y))continue;
    if(two)wlCamp2d(c,t);
    wlSmoke(c.x,c.y-24,t,c.i);
    // אור המדורה: הילה חמה על הקרקע
    const fl=0.75+Math.sin(t*9+c.i)*0.12+Math.sin(t*23)*0.06;ctx.save();ctx.globalCompositeOperation='lighter';
    const g=ctx.createRadialGradient(c.x,c.y-10,4,c.x,c.y-10,110);g.addColorStop(0,'rgba(255,170,70,'+(0.42*fl)+')');g.addColorStop(1,'rgba(255,120,40,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(c.x,c.y-6,110,70,0,0,7);ctx.fill();ctx.restore();
    // מפלצת שמדברת ליד המחנה (foelore.js): הבועה שלנו עולה מעליה, ולא עליה
    const fs=S.wd.flSay,nx=c.x+Z.camp.npc.dx,ny=c.y+Z.camp.npc.dy,up=fs&&fs.e&&!fs.e.dead&&Math.abs(fs.e.x-nx)<260&&Math.abs(fs.e.y-ny)<200?(Z.camp.say.size*2.6+14)/(typeof ZOOM==='number'&&ZOOM>0?ZOOM:1):0;
    if(c.bub>0)wlBubble(nx,Math.min(ny-Z.camp.say.up,fs&&up?fs.e.y-fs.e.r-50-up:1e9),T(c.first?'wl.say.'+S.wd.reg+'.'+(c.i%4):'wl.rest'),Math.min(1,c.bub*2,(Z.camp.bubble-c.bub)*4+0.2));
  }
  for(const r of st.rems){if(!wlSeen(r.x,r.y))continue;
    if(two)wlRem2d(r);
    if(!WLS().got[r.id]){const k=((st.hint+hash(r.x,r.y)*Z.rem.hint)%Z.rem.hint)/0.6;if(k<1&&typeof scTwinkle==='function'){ctx.save();ctx.translate(r.x+6,r.y-52);ctx.scale(2.2,2.2);scTwinkle(0,0,k);ctx.restore()}}}
  if(two)for(const H of st.herds)for(const a of H.a){if(H.gone||!wlSeen(a.x,a.y))continue;wlBeast2d(H.sp,a)}
  for(const H of st.herds)for(const a of H.a)if(a.gold&&!H.gone&&wlSeen(a.x,a.y)&&Math.sin(t*5+a.ph)>0.6)scTwinkle&&scTwinkle(a.x,a.y-28-a.z,(Math.sin(t*5+a.ph)-0.6)/0.4);
}
// עמוד העשן: עננים רכים שעולים, גדלים, מתפזרים ונעלמים, ונוטים ברוח. ענן = תמונה רכה אחת (wlPuff), מצוירת בגדלים שונים
function wlPuff(col){const k='puff'+col;if(WL3[k])return WL3[k];const T=64,c=document.createElement('canvas');c.width=c.height=T;const g=c.getContext('2d'),gr=g.createRadialGradient(T/2,T/2,0,T/2,T/2,T/2);
  gr.addColorStop(0,col);gr.addColorStop(0.45,col+'aa');gr.addColorStop(1,col+'00');g.fillStyle=gr;g.fillRect(0,0,T,T);return WL3[k]=c}
function wlSmoke(x,y,t,seed){
  const Z=WLIFE.camp.smoke,shadow=S.wd.reg==='shadow',im=wlPuff(shadow?'#C8B6F2':Z.col),dk=wlPuff(shadow?'#4A3A78':Z.edge);ctx.save();
  for(let k=0;k<Z.puffs;k++){
    const v=hash(k*3.1,seed+1),u=(t*Z.rise/Z.h*(0.85+v*0.3)+k/Z.puffs+seed*0.13)%1,py=y-u*Z.h,px=x+(v-0.5)*30*u+Math.sin(u*5+k*1.7+t*0.6)*18*u+Z.wind*u*u,r=(Z.r[0]+(Z.r[1]-Z.r[0])*u)*(0.8+v*0.45);
    const al=Z.a*(1-u)*Math.min(1,u/0.06);
    ctx.globalAlpha=al*0.45;ctx.drawImage(dk,px-r+r*0.15,py-r+r*0.2,r*2,r*2);   // צל עדין מתחת לענן: בולט גם על דשא בהיר
    ctx.globalAlpha=al;ctx.drawImage(im,px-r,py-r,r*2,r*2)}
  ctx.restore();
}
// בועת דיבור באותו סגנון כמו הבועה של המפלצות (foelore.js): רקע בהיר, טקסט כהה וזנב. (x,y) קצה הזנב, מעל הראש. גודל קבוע על המסך (/ZOOM)
function wlBubble(x,y,txt,a){
  const z=typeof ZOOM==='number'&&ZOOM>0?ZOOM:1,bf=WLIFE.camp.say.size/z,lh=bf*1.35,pad=8/z,tail=8/z;
  ctx.save();ctx.globalAlpha=Math.max(0,a);ctx.font='700 '+bf+'px Heebo, system-ui, sans-serif';ctx.direction=DIR;ctx.textAlign='center';
  const lines=wlWrap(txt,WLIFE.camp.say.w/z),w=Math.max(...lines.map(l=>ctx.measureText(l).width))+pad*2.4,h=lines.length*lh+pad*1.4,yy=y-tail-h;
  ctx.fillStyle='rgba(250,246,232,0.96)';ctx.strokeStyle='rgba(20,22,34,0.8)';ctx.lineWidth=1.5/z;
  ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x-w/2,yy,w,h,Math.min(h/2,12/z));else ctx.rect(x-w/2,yy,w,h);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-6/z,yy+h-1/z);ctx.lineTo(x,y);ctx.lineTo(x+6/z,yy+h-1/z);ctx.closePath();ctx.fill();
  ctx.fillStyle='#1A1C28';lines.forEach((l,i)=>ctx.fillText(l,x,yy+pad*0.7+lh*(i+0.78)));ctx.restore();
}
function wlWrap(s,max){const out=[];let cur='';for(const w of String(s).split(' ')){const n=cur?cur+' '+w:w;if(ctx.measureText(n).width>max&&cur){out.push(cur);cur=w}else cur=n}if(cur)out.push(cur);return out}
// דו-ממד: אוהלים, מדורה ודמות
function wlCamp2d(c,t){
  const x=c.x,y=c.y;ctx.strokeStyle=C.ink;ctx.lineWidth=2;
  for(let i=0;i<3;i++){const a=i*2.1+0.4,tx=x+Math.cos(a)*70,ty=y+Math.sin(a)*45;ctx.fillStyle=['#B0874F','#8F5F3A','#C7A46A'][i];ctx.beginPath();ctx.moveTo(tx-26,ty+12);ctx.lineTo(tx,ty-34);ctx.lineTo(tx+26,ty+12);ctx.closePath();ctx.fill();ctx.stroke()}
  ctx.fillStyle='#4A3A2A';ctx.fillRect(x-14,y-4,28,6);ctx.fillStyle='#FF9A3A';ctx.beginPath();ctx.moveTo(x-9,y);ctx.quadraticCurveTo(x,y-28-Math.sin(t*10)*4,x+9,y);ctx.fill();
  const nx=x+WLIFE.camp.npc.dx,ny=y+WLIFE.camp.npc.dy;ctx.fillStyle='#5C6F8A';ctx.beginPath();ctx.ellipse(nx,ny-12,9,13,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#E8C9A0';ctx.beginPath();ctx.arc(nx,ny-30,7,0,7);ctx.fill();ctx.stroke();
}
function wlRem2d(r){
  const x=r.x,y=r.y,got=WLS().got[r.id];ctx.strokeStyle=C.ink;ctx.lineWidth=2;
  ctx.fillStyle='rgba(5,7,13,0.3)';ctx.beginPath();ctx.ellipse(x,y+6,30,9,0,0,7);ctx.fill();
  if(r.kind==='cart'){ctx.fillStyle='#7A5532';ctx.save();ctx.translate(x,y-8);ctx.rotate(0.35);ctx.fillRect(-26,-10,52,18);ctx.strokeRect(-26,-10,52,18);ctx.restore();ctx.fillStyle='#5A3D24';ctx.beginPath();ctx.arc(x-20,y+2,11,0,7);ctx.fill();ctx.stroke()}
  else if(r.kind==='pack'){ctx.fillStyle='#8C7A55';ctx.beginPath();ctx.ellipse(x,y-8,14,12,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#E8E2D0';ctx.beginPath();ctx.arc(x+20,y-2,6,0,7);ctx.fill();ctx.stroke()}
  else if(r.kind==='chest'){ctx.fillStyle='#7A5230';ctx.fillRect(x-15,y-12,30,18);ctx.strokeRect(x-15,y-12,30,18);ctx.fillStyle=got?'#5A3D24':C.gold;ctx.fillRect(x-3,y-6,6,6);ctx.fillStyle='#5A3D24';ctx.save();ctx.translate(x-15,y-12);ctx.rotate(-0.5);ctx.fillRect(0,-8,30,8);ctx.restore()}
  else{ctx.fillStyle='#A88E62';ctx.beginPath();ctx.moveTo(x-28,y+8);ctx.lineTo(x-4,y-26);ctx.lineTo(x+10,y-6);ctx.lineTo(x+26,y+8);ctx.closePath();ctx.fill();ctx.stroke()}
}
function wlBeast2d(sp,a){
  const B=WLIFE.beasts[sp],x=a.x,y=a.y-a.z,col=a.gold?C.gold:B.col,f=Math.cos(a.face)>=0?1:-1,s=({deer:1,goat:0.85,rabbit:0.45,bird:0.4,duck:0.5,lizard:0.4,wisp:0.5}[B.body]||1)*B.s/({deer:1.15,goat:1.1}[B.body]||2),bob=Math.abs(Math.sin(a.walk))*(B.hop?6:1.5);
  ctx.fillStyle='rgba(5,7,13,0.25)';ctx.beginPath();ctx.ellipse(a.x,a.y+3,16*s,5*s,0,0,7);ctx.fill();
  ctx.fillStyle=col;ctx.strokeStyle=C.ink;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y-14*s-bob,18*s,9*s,0,0,7);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(x+f*16*s,y-24*s-bob,6*s+1,0,7);ctx.fill();ctx.stroke();
}

/* ---- תלת-ממד: נקרא מ-props3dWorldTick (props3d.js) כל פריים בעולם, עם הקבוצה של האזור ---- */
const WL3={geo:{},mat:{},t:0};
const wlMat=(c,glow)=>WL3.mat[c+(glow?'g':'')]||(WL3.mat[c+(glow?'g':'')]=glow?new THREE.MeshBasicMaterial({color:c,toneMapped:false}):new THREE.MeshLambertMaterial({color:c,flatShading:true}));
const wlGeo=(k,f)=>WL3.geo[k]||(WL3.geo[k]=f());
// החיות מחלקים: [צורה, צבע (1 או 2), x,y,z, sx,sy,sz, תנועה]. תנועה: legA/legB רגליים, wing כנף, ear אוזן. הגוף לאורך x
const WL_PARTS={
  deer:[['box',1,0,24,0,30,13,12],['box',1,15,33,0,6,14,6,'neck'],['box',2,20,40,0,11,7,7],['box',2,17,46,3,2,7,2],['box',2,17,46,-3,2,7,2],
    ['box',2,-11,10,4,3,20,3,'legA'],['box',2,-11,10,-4,3,20,3,'legB'],['box',2,11,10,4,3,20,3,'legB'],['box',2,11,10,-4,3,20,3,'legA'],['box',2,-16,28,0,4,5,3]],
  goat:[['box',1,0,20,0,26,13,12],['box',1,13,28,0,6,10,6,'neck'],['box',1,18,34,0,10,8,7],['cone',2,15,42,3,2.4,9,2.4],['cone',2,15,42,-3,2.4,9,2.4],['box',1,22,28,0,3,6,2],
    ['box',2,-9,8,4,3.4,16,3.4,'legA'],['box',2,-9,8,-4,3.4,16,3.4,'legB'],['box',2,9,8,4,3.4,16,3.4,'legB'],['box',2,9,8,-4,3.4,16,3.4,'legA']],
  rabbit:[['ball',1,0,6,0,12,9,9],['ball',1,6,11,0,6,6,6],['box',1,5,17,1.6,1.6,8,1.4,'ear'],['box',1,5,17,-1.6,1.6,8,1.4,'ear'],['ball',2,-6,7,0,4,4,4]],
  bird:[['ball',1,0,6,0,10,7,7],['ball',1,6,10,0,5,5,5],['box',2,10,10,0,4,1.6,2],['box',1,-1,8,5,7,1,9,'wing'],['box',1,-1,8,-5,7,1,9,'wingB'],['box',1,-8,7,0,6,1,4]],
  duck:[['ball',1,0,5,0,13,8,9],['ball',2,6,11,0,5,5,5],['box',3,10,10.5,0,4,1.4,3],['ball',1,-6,7,0,5,4,6],['box',1,0,7,4.4,7,3,1,'wing'],['box',1,0,7,-4.4,7,3,1,'wingB']],
  lizard:[['box',1,0,3,0,16,4,6],['box',1,10,3.5,0,6,3,5],['cone',1,-14,3,0,3,14,3,'tail'],['box',2,-5,1.5,4,2,2,4,'legA'],['box',2,-5,1.5,-4,2,2,4,'legB'],['box',2,5,1.5,4,2,2,4,'legB'],['box',2,5,1.5,-4,2,2,4,'legA']],
  wisp:[['ball',1,0,0,0,9,11,9],['ball',2,0,1,0,5,6,5],['ball',1,-3,-7,0,4,6,4,'tail'],['ball',1,0,0,0,26,26,26,'aura']]
};
const WL3D={cap:40,orange:'#E8902E'};
// מופע אחד לכל חלק בכל צורת גוף. הצבע לכל חיה (setColorAt): col, col2, או כתום (3, מקור). glow: זוהר עדין של האזור (לב הצל)
function wlBuildBeasts(g,glow){
  const out={},D=wlReg(),used=new Set(D.beasts.concat(D.circle?Object.keys(WLIFE.beasts).filter(k=>WLIFE.beasts[k].circle):[]).map(k=>WLIFE.beasts[k].body));
  for(const b of used){
    out[b]=WL_PARTS[b].map(p=>{
      const geo=wlGeo(p[0]+(b==='lizard'?'z':''),()=>p[0]==='ball'?new THREE.SphereGeometry(0.5,8,6):p[0]==='cone'?new THREE.ConeGeometry(0.5,1,5).rotateZ(b==='lizard'?Math.PI/2:0):new THREE.BoxGeometry(1,1,1));
      const mat=p[8]==='aura'?new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false,transparent:true,opacity:0.22,depthWrite:false,blending:THREE.AdditiveBlending}):b==='wisp'?new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false,transparent:true,opacity:p[1]===1?0.85:1}):new THREE.MeshLambertMaterial({color:'#ffffff',flatShading:true});
      if(glow&&mat.emissive){mat.emissive.set(glow);mat.emissiveIntensity=0.35}
      const m=new THREE.InstancedMesh(geo,mat,WL3D.cap);m.count=0;m.frustumCulled=false;m.userData.ci=p[1];g.add(m);return m})}
  return out;
}
function wlifeBeasts3d(G,st,t){
  const I=G.wlB||(G.wlB=wlBuildBeasts(G.g,wlReg().glow)),S_=SIN(),M=WL3.m||(WL3.m=new THREE.Matrix4()),Pm=WL3.p||(WL3.p=new THREE.Matrix4()),
    q=WL3.q||(WL3.q=new THREE.Quaternion()),e=WL3.e||(WL3.e=new THREE.Euler()),v=WL3.v||(WL3.v=new THREE.Vector3()),sc=WL3.s||(WL3.s=new THREE.Vector3()),gold=WL3.gc||(WL3.gc=new THREE.Color(C.gold));
  for(const sp in I)for(const m of I[sp])m.count=0;
  const cc=WL3.cc||(WL3.cc={}),col=c=>cc[c]||(cc[c]=new THREE.Color(c));
  for(const H of st.herds){if(H.gone)continue;const B=WLIFE.beasts[H.sp],parts=I[B.body],D=WL_PARTS[B.body];if(!parts)continue;const cs=[null,col(B.col),col(B.col2),col(WL3D.orange)];
    for(const a of H.a){if(!wlSeen(a.x,a.y-a.z))continue;if(parts[0].count>=WL3D.cap)break;
      const hop=B.hop?Math.abs(Math.sin(a.walk))*8:0,lift=(typeof hAt==='function'?hAt(a.x,a.y):0)/COS();
      const dz=Math.sin(a.face)/S_,yaw=-Math.atan2(dz,Math.cos(a.face));
      e.set(0,yaw,0);q.setFromEuler(e);v.set(a.x,lift+a.z+hop,a.y/S_);sc.setScalar(B.s);M.compose(v,q,sc);
      const sw=Math.sin(a.walk)*0.6;
      D.forEach((p,k)=>{const m=parts[k],i=m.count++;
        let rx=0,ry=0,rz=0,dy=0;
        if(p[8]==='legA')rz=sw;else if(p[8]==='legB')rz=-sw;
        else if(p[8]==='neck')rz=a.walk===0||!a.tx&&!a.fl?-0.6:-0.2;   // רועה: הראש למטה
        else if(p[8]==='wing'||p[8]==='wingB'){const f=a.z>1?Math.sin(t*22+a.ph)*0.9:0.1;rx=p[8]==='wing'?f:-f}
        else if(p[8]==='ear')rz=Math.sin(t*3+a.ph)*0.15;
        else if(p[8]==='tail')ry=Math.sin(t*(a.fl?14:3)+a.ph)*0.35;
        e.set(rx,ry,rz);q.setFromEuler(e);v.set(p[2],p[3]+dy,p[4]);
        if(p[8]==='legA'||p[8]==='legB'){v.y=p[3]+p[6]/2;Pm.compose(v,q,sc.set(1,1,1));   // הרגל מסתובבת סביב הירך
          const L=WL3.l||(WL3.l=new THREE.Matrix4());L.makeTranslation(0,-p[6]/2,0);Pm.multiply(L);L.makeScale(p[5],p[6],p[7]);Pm.multiply(L)}
        else Pm.compose(v,q,sc.set(p[5],p[6],p[7]));
        Pm.premultiply(M);m.setMatrixAt(i,Pm);m.setColorAt(i,a.gold?gold:cs[m.userData.ci])});
    }}
  for(const sp in I)for(const m of I[sp]){if(!m.count){m.visible=false;continue}m.visible=true;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}
}
// שרידים: עגלה הפוכה, תרמיל עם עצם, ארגז שבור, אוהל קרוע. מצורות פשוטות, באותו סגנון של props3d.js
function wlRem3d(r){
  const g=new THREE.Group(),C_=PROPS3D.col,wood=wlMat(C_.wood),dark=wlMat(C_.woodDark),add=(geo,ma,x,y,z,rx=0,ry=0,rz=0)=>{const o=new THREE.Mesh(geo,ma);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);g.add(o);return o};
  if(r.kind==='cart'){add(new THREE.BoxGeometry(56,18,30),wood,0,14,0,0,0,0.42);add(new THREE.BoxGeometry(58,3,32),dark,2,26,0,0,0,0.42);
    add(new THREE.CylinderGeometry(13,13,4,10),dark,-20,13,17,Math.PI/2);add(new THREE.CylinderGeometry(13,13,4,10),dark,24,6,-19,Math.PI/2.4,0,0.9);
    add(new THREE.BoxGeometry(46,3,3),wood,38,4,0,0,0.3,0);add(new THREE.BoxGeometry(8,6,6),wlMat('#9a8a6a'),-6,3,22)}
  else if(r.kind==='pack'){add(new THREE.SphereGeometry(13,8,6),wlMat('#8c7a55'),0,11,0).scale.set(1,1.15,0.9);add(new THREE.BoxGeometry(14,3,18),wlMat('#6b5a3a'),0,23,0);
    add(new THREE.BoxGeometry(24,4,4),wlMat('#e8e2d0'),22,3,6,0,0.6,0);add(new THREE.SphereGeometry(5,6,5),wlMat('#e8e2d0'),31,5,0);add(new THREE.CylinderGeometry(1.2,1.2,40,5),dark,-12,14,-10,0,0,0.9)}
  else if(r.kind==='chest'){add(new THREE.BoxGeometry(30,16,20),wood,0,8,0);add(new THREE.BoxGeometry(31,3,21),wlMat(C_.gold),0,6,0);
    const lid=add(new THREE.BoxGeometry(30,5,20),dark,-6,22,-6,-0.7,0,0.35);lid.userData.lid=1;add(new THREE.BoxGeometry(10,6,8),wood,24,3,10,0,0.8,0.3);
    const gl=add(new THREE.BoxGeometry(18,4,12),wlMat(C_.gold,true),0,15,0);gl.userData.loot=1}
  else{add(new THREE.ConeGeometry(34,48,4),wlMat('#a88e62'),0,20,0,0,0.6,0.28);add(new THREE.CylinderGeometry(1.4,1.4,62,5),dark,-14,26,10,0.2,0,-0.25);add(new THREE.BoxGeometry(30,2,26),wlMat('#8a6f4a'),26,1,8,0,0.4,0)}
  const glow=wlReg().glow;   // לב הצל: כל השריד זוהר קצת, והילה מעליו, אחרת לא רואים אותו בחושך
  if(glow){g.traverse(o=>{if(o.isMesh&&o.material.emissive){const k=o.material.color.getHexString()+'e';o.material=WL3.mat[k]||(WL3.mat[k]=Object.assign(o.material.clone(),{emissiveIntensity:0.45}));o.material.emissive.set(glow)}});
    if(typeof p3Halo==='function')p3Halo(glow,110,26,g)}
  g.rotation.y=r.rot;g.scale.setScalar(WLIFE.rem.size);return g;
}
function wlifeRems3d(G,st){
  if(!G.wlR){G.wlR={};for(const r of st.rems){const m=wlRem3d(r);m.position.set(r.x,(typeof hAt==='function'?hAt(r.x,r.y):0)/COS(),r.y/SIN());G.g.add(m);G.wlR[r.id]=m}}
  for(const r of st.rems){const m=G.wlR[r.id];if(!m)continue;m.visible=Math.abs(r.x-S.cam.x)+Math.abs(r.y-S.cam.y)<2600;
    if(WLS().got[r.id]&&!m.userData.empty){m.userData.empty=1;m.traverse(o=>{if(o.userData&&o.userData.loot)o.visible=false})}}
}
// הדמות ליד האש: דמות KayKit שיושבת (עומדת במקום) ומנופפת כשמגיעים
// לא knight, ranger או mage: אלה הגיבורים (LOOK3D.hero_*), ודמות במחנה צריכה להיראות מיד כמישהו אחר. נווד בברדס עם מקל, וברברי עם קסדה
const WL_LOOKS=()=>[{model:'rogue',tint:'#C98A3A',props:{staff:{prop:'w_staff_A',...HAND_R}}},{model:'barbarian',tint:'#6E8F5A'},{model:'rogue',tint:'#8A5AB0'},{model:'barbarian',tint:'#B05A3A',props:{hammer:{prop:'w_hammer_A',...HAND_R}}}];
function wlifeCampers3d(G,st,dt){
  if(typeof makeActor!=='function'||typeof LOOK3D==='undefined')return;const Z=WLIFE.camp.npc;
  const A=G.wlC||(G.wlC={});
  for(const c of st.camps){
    const nx=c.x+Z.dx,ny=c.y+Z.dy;
    if(!wlSeen(nx,ny)){if(A[c.id])A[c.id].root.visible=false;continue}
    let a=A[c.id];
    if(!a){const LK=WL_LOOKS(),L0=LK[c.i%LK.length],k='wl_camp'+(c.i%LK.length);
      if(!LOOK3D[k])LOOK3D[k]={model:L0.model,h:56,foot:13,tint:L0.tint,own:false,props:L0.props,anim:{...NPC_ANIM,idle:'Idle_B'}};
      if(typeof m3dNeed==='function'&&!m3dNeed(L0.model))continue;
      a=A[c.id]=makeActor(LOOK3D[k]);G.g.add(a.root);a.wave=false}
    a.root.visible=true;if(a.own)a.own.visible=false;
    if(c.bub>WLIFE.camp.bubble-0.1&&!a.wave){a.wave=true;once(a,NPC_ANIM.wave,1.4)}
    if(c.bub<=0)a.wave=false;
    loop(a,'Idle_B'+(a.one&&a.one.isRunning()?'@low':''));
    place(a,nx,ny,13,yawOf(c.x-nx,c.y-ny));a.mixer.update(dt);mark('shadow',a.root.position.x,a.root.position.z,15);
  }
}
function wlife3d(G){
  if(!wlOn())return;const now=performance.now()/1000,dt=Math.min(0.1,now-(WL3.t||now));WL3.t=now;const st=wlState();
  wlifeRems3d(G,st);wlifeBeasts3d(G,st,now);wlifeCampers3d(G,st,dt);
}
