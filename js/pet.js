/* חיית המחמד: הולכת אחרי השחקן בכפר, בעולם ובזירה, וגדלה איתו בשלושה שלבים.
   הראשונה היא פיוחו (פיוחו), הכלבה של ניר: לבנה ורזה, קצות אוזניים בצבע חול, כתם עגול על הראש, וזנב מתולתל. היא אוהבת לחפור בחול.
   היכולת שלה, "פיוחו חופרת": כל כמה זמן היא רצה לנקודה, חופרת, ומוציאה שלל. טבלת השלל בפורמט של הכלכלה (runGive ב-loot.js):
   דרגות, עמודי אור, חגיגה לנדיר ומזל עם הגנה. השלל נופל לרצפה (drops.js) ונאסף כרגיל.
   שלב 3 (אגדית) מקבל אפקטים חיים, מצוירים בקנבס כדי שיהיו זולים בטלפון: הסימנים על הגוף פועמים, להבה בקצה הזנב, ולהבונים ליד הכפות.
   כל חיה היא שורה ב-PET.kinds. חיה של אוראל = שורה חדשה (ומודל ב-LOOK3D, render3d.js), בלי לגעת בלוגיקה.
   מה נשמר: איזו חיה, שלב ו-XP, ב-SAVE.pet דרך save.js. המצב הרגעי (איפה היא, מה היא עושה) ב-S.pet, וחדש בכל מקום.
   השמות והטקסטים ב-lang.js תחת 'pet.'. המראה בתלת-ממד: LOOK3D.pet_<חיה><שלב> ו-syncPet ב-render3d.js */

const PET={
  default:'piocho',                          // החיה שכל שמירה חדשה מקבלת
  kinds:{
    piocho:{
      owner:'nir',                           // של מי היא. היום רק לתיעוד: השמירה היא בטלפון של מי שמשחק
      col:'#F2D3A0',                         // צבע הנקודה בדו-ממד ובמפה (חול)
      /* השלבים: מאיזה XP מגיעים אליו, גודל על המסך (h בפיקסלים), וכל כמה שניות היא חופרת (every).
         loot: {משאב:[סיכוי, כמה]}, כמו טבלאות השלל של האויבים (data.js). כל שורה מוגרלת לבד. לא יצא כלום: miss */
      stages:[
        {xp:0,   h:36, dig:{every:26,loot:{stone:[0.55,1],wood:[0.45,1],herb:[0.4,1],copper:[0.25,1],rubyC:[0.05,1],amberC:[0.05,1]}}},
        {xp:720, h:46, dig:{every:20,loot:{stone:[0.5,2],copper:[0.45,1],iron:[0.25,1],mushroom:[0.3,1],rubyC:[0.12,1],sapphireC:[0.12,1],ruby:[0.03,1]}}},
        {xp:2700,h:54, dig:{every:15,loot:{coins:[0.6,8],iron:[0.45,2],silver:[0.25,1],gold:[0.08,1],ruby:[0.1,1],sapphire:[0.1,1],amber:[0.08,1],star:[0.015,1]}},fx:true}   // fx: הלהבות והזוהר
      ]
    }
  },
  // XP של החיה: ממשחק משותף. sec: לכל שנייה שמשחקים (לא בכפר), kill: לכל אויב שנפל, dig: לכל חפירה.
  // arena: כמה שווה הריגה בזירה, כי שם נופלים אלפי אויבים בריצה (ניר, 31.10.2026: "שתגדל לאט יותר". קודם ריצה אחת הקפיצה אותה לשלב 3)
  xp:{sec:0.5,kill:1,dig:6,arena:0.05},
  // הליכה אחרי השחקן: trail מאחוריו, run: מרחק שממנו היא רצה, jump: מרחק שממנו היא פשוט מופיעה לידו (מעבר מקום, שער)
  follow:{trail:46,side:26,walk:150,run:330,runFrom:170,jump:700,sitAfter:1.4},
  // החפירה: arena: כמה פחות בזירה (פי כמה זמן בין חפירות), spot: כמה רחוק מהשחקן היא רצה לחפור, dur: כמה שניות חופרת
  dig:{arena:2.2,spot:[70,150],dur:1.7,miss:{stone:1},sand:'#D9B87A',grains:5},   // miss: מה יוצא כשההגרלה לא הוציאה כלום
  bark:{range:90,cd:2.5},                    // מתלהבת מאויב קרוב: אנימציית תקיפה (רק מראה, בלי נזק)
  fx:{pulse:1.8,ember:'#FF8A3D',core:'#FFE08A'}   // שלב 3: קצב הפעימה וצבעי הלהבה
};

const petKind=()=>PET.kinds[SAVE.pet.kind]||PET.kinds[PET.default];
const petStageOf=xp=>{const st=petKind().stages;let i=0;while(i+1<st.length&&xp>=st[i+1].xp)i++;return i};   // 0, 1 או 2
const petStage=()=>petKind().stages[SAVE.pet.stage]||petKind().stages[0];
const petHere=()=>!!(P&&S&&!S.room&&(S.vil||S.wd||S.mode==='play'||S.mode==='over'));   // בכל מקום חוץ מחדר הבונוס ומסך הפתיחה

// XP לחיה. כשעוברים שלב: חגיגה, צליל וקפיצת שמחה. נשמר מיד, כי זה רגע שלא רוצים לאבד
function petXP(n){
  const sv=SAVE.pet,was=sv.stage;sv.xp+=n;sv.stage=petStageOf(sv.xp);
  if(sv.stage>was){const p=S.pet;
    if(p){p.st='jump';p.t=0}
    celebrate(p?p.x:P.x,p?p.y:P.y,'rank',T('pet.up',T('pet.name.'+(sv.kind||PET.default)),sv.stage+1));sfx('levelup');
    if(typeof questEvent==='function')questEvent('pet','stage',1);
    saveNow()}
  return sv.stage}

function petMake(){
  const f=PET.follow,b=P.face+Math.PI;
  return S.pet={x:P.x+Math.cos(b)*f.trail,y:P.y+Math.sin(b)*f.trail,face:P.face,st:'idle',t:0,still:0,digT:petStage().dig.every*0.5,
    spot:null,sand:[],bark:0,kills:S.kills||0,fxT:0,digs:0,dug:[]}}

/* ---- כל פריים, בכל מקום (main.js) ---- */
function petUpdate(dt){
  if(!petHere()){return}
  const p=S.pet||petMake(),f=PET.follow,stg=petStage();
  p.t+=dt;p.fxT+=dt;
  // XP: זמן משותף מחוץ לכפר, ואויבים שנפלו
  if(!S.vil&&S.mode==='play')petXP(PET.xp.sec*dt);
  if((S.kills||0)>p.kills){petXP(PET.xp.kill*(S.wd?1:PET.xp.arena)*(S.kills-p.kills));p.kills=S.kills}
  for(const g of p.sand){g.x+=g.vx*dt;g.y+=g.vy*dt;g.vy+=500*dt;g.life-=dt}
  p.sand=p.sand.filter(g=>g.life>0);
  if(S.mode!=='play')return;
  const dP=Math.hypot(P.x-p.x,P.y-p.y);
  if(dP>f.jump){Object.assign(p,petMake(),{digs:p.digs,dug:p.dug,sand:p.sand});return}   // רחוק מדי (שער, מעבר מקום): מופיעה לידו
  // חפירה: בעולם, ובזירה לעתים רחוקות יותר. לא בכפר
  if(!S.vil&&p.st!=='dig'&&p.st!=='go'&&p.st!=='jump'){p.digT-=dt/(S.wd?1:PET.dig.arena);if(p.digT<=0)petDigStart(p)}
  if(p.st==='jump'){if(p.t>0.9){p.st='idle';p.t=0}return}
  if(p.st==='go'){const s=p.spot,dx=s.x-p.x,dy=s.y-p.y,d=Math.hypot(dx,dy);
    if(d<8||dP>f.run*1.6){if(d<8){p.st='dig';p.t=0}else{p.st='follow';p.spot=null}}   // השחקן התרחק מאוד: עוזבת ורצה אחריו
    else{const sp=Math.min(d/dt,f.run);p.x+=dx/d*sp*dt;p.y+=dy/d*sp*dt;p.face=Math.atan2(dy,dx);p.run=true}
    return}
  if(p.st==='dig'){
    if(Math.random()<dt*24)for(let i=0;i<PET.dig.grains;i++)p.sand.push({x:p.x+Math.cos(p.face)*10,y:p.y+Math.sin(p.face)*10,vx:-Math.cos(p.face)*rand(40,140)+rand(-40,40),vy:-rand(80,190),life:rand(0.35,0.6)});
    if(p.t>=PET.dig.dur)petDigEnd(p);
    return}
  // הליכה אחרי השחקן: נקודה מאחוריו וקצת לצד, כדי שלא תסתיר אותו
  const b=P.face+Math.PI,tx=P.x+Math.cos(b)*f.trail+Math.cos(b+1.57)*f.side,ty=P.y+Math.sin(b)*f.trail+Math.sin(b+1.57)*f.side;
  const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy);
  p.still=P.moving?0:p.still+dt;
  if(d>10){const sp=Math.min(d/dt,dP>f.runFrom?f.run:Math.max(f.walk,P.moving?P.speed:0));p.x+=dx/d*sp*dt;p.y+=dy/d*sp*dt;p.face=Math.atan2(dy,dx);p.run=sp>f.walk*1.2;p.st='follow'}
  else{p.run=false;p.st=p.still>f.sitAfter?'sit':'idle';if(!P.moving)p.face+=angDiff(Math.atan2(P.y-p.y,P.x-p.x),p.face)*Math.min(1,dt*3)}
  // אויב קרוב: נובחת וקופצת עליו (רק מראה)
  p.bark-=dt;if(p.bark<=0&&!S.vil){const e=enemies.find(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<PET.bark.range);if(e){p.bark=PET.bark.cd;p.barkAt=p.t;p.face=Math.atan2(e.y-p.y,e.x-p.x)}}
}
// רצה לנקודה ליד השחקן, לא בתוך עץ, סלע או תיבה (nodes.js), ובעולם לא מחוץ לגבולות
function petDigStart(p){
  p.digT=petStage().dig.every;
  for(let i=0;i<8;i++){const a=rand(0,6.28),r=rand(...PET.dig.spot),x=P.x+Math.cos(a)*r,y=P.y+Math.sin(a)*r;
    if(S.nd&&S.nd.list.some(n=>!n.dead&&Math.hypot(n.x-x,n.y-y)<n.r+20))continue;
    if(S.wd){const B=WORLD.size;if(Math.abs(x)>B.w/2-40||Math.abs(y)>B.h/2-40)continue}
    p.spot={x,y};p.st='go';p.t=0;return true}
  return false}
// סוף החפירה: הטבלה של השלב, דרך runGive של הכלכלה (דרגות, עמוד אור, חגיגה לנדיר). נופל לרצפה ונאסף כמו כל שלל
function petDigEnd(p){
  const x=p.x+Math.cos(p.face)*12,y=p.y+Math.sin(p.face)*12-20,n0=drops().length;
  let got=runGive(petStage().dig.loot,x,y);
  if(!got.length){const [r,n]=Object.entries(PET.dig.miss)[0];dropSpawn(r,n,x,y+20);got=[r]}
  for(const d of drops().slice(n0))d.pet=true;   // pet: לבדיקה, מה היא הוציאה (מה שהצטרף לערימה קיימת לא מסומן)
  if(got.some(r=>lootTier(r)>=2))floatText(p.x,p.y-48,T('pet.found',T('pet.name.'+(SAVE.pet.kind||PET.default))),RES.rarity[2].col,15);else sfx('tap');
  p.digs++;p.dug.push(...got);p.st='idle';p.t=0;p.spot=null;petXP(PET.xp.dig);
  if(typeof questEvent==='function')questEvent('pet','dig',1);
}

/* ---- ציור בקנבס: חול, להבות ואפקטים, ובדו-ממד גם הכלבה עצמה ---- */
function drawPet(){
  const p=S.pet;if(!p||!petHere())return;
  const stg=petStage(),k=petKind(),h=stg.h;
  if(!R3D.on){   // דו-ממד: גוף, ראש, אוזניים בצבע חול וזנב מתולתל
    const dir=Math.cos(p.face)<0?-1:1,sit=p.st==='sit',bob=p.st==='dig'?Math.sin(p.t*30)*1.5:p.run?Math.sin(p.t*18)*2:0;
    ctx.save();ctx.translate(p.x,p.y+bob);ctx.scale(dir*h/38,h/38);
    ctx.fillStyle='rgba(5,7,13,0.35)';ctx.beginPath();ctx.ellipse(0,2,16,4,0,0,7);ctx.fill();
    ctx.fillStyle='#F4F2EC';ctx.beginPath();ctx.ellipse(-2,sit?-12:-14,13,sit?9:7,sit?-0.5:0,0,7);ctx.fill();   // גוף
    ctx.fillRect(-11,-10,3,10);ctx.fillRect(5,-10,3,10);
    ctx.beginPath();ctx.arc(10,-24,8,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(16,-21,5,3.5,0,0,7);ctx.fill();   // ראש וחוטם
    ctx.fillStyle=k.col;ctx.beginPath();ctx.ellipse(6,-28,3,5,0.5,0,7);ctx.fill();ctx.beginPath();ctx.arc(10,-30,2.6,0,7);ctx.fill();   // אוזן וכתם
    ctx.fillStyle='#111';ctx.beginPath();ctx.arc(20.5,-21.5,1.6,0,7);ctx.fill();ctx.fillStyle='#5A3A22';ctx.beginPath();ctx.arc(13,-25,1.3,0,7);ctx.fill();
    ctx.strokeStyle='#8B5A3C';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(2,-20);ctx.lineTo(4,-9);ctx.stroke();   // רתמה
    ctx.strokeStyle='#F4F2EC';ctx.lineWidth=4;ctx.beginPath();ctx.arc(-15,-22,5,0.5,5.2);ctx.stroke();   // זנב
    ctx.restore()}
  // חול שעף מהחפירה
  ctx.fillStyle=PET.dig.sand;for(const g of p.sand){ctx.globalAlpha=Math.min(1,g.life*3);ctx.fillRect(g.x-1.5,g.y-1.5,3,3)}ctx.globalAlpha=1;
  if(p.st==='dig'){ctx.fillStyle='rgba(120,90,50,0.45)';ctx.beginPath();ctx.ellipse(p.x+Math.cos(p.face)*12,p.y+Math.sin(p.face)*12+2,10,4,0,0,7);ctx.fill()}
  if(stg.fx)petFlames(p,h);
}
// שלב 3: להבה בקצה הזנב (מהעצם בתלת-ממד), ולהבונים ליד ארבע הכפות. עיגולים בחיבור אור, בלי תמונות
function petFlames(p,h){
  const F=PET.fx,t=p.fxT,c=Math.cos(p.face),s=Math.sin(p.face);
  const tail=R3D.on&&PET_FX.tail?PET_FX.tail:{x:p.x-c*h*0.45,y:p.y-s*h*0.45-h*0.95};
  ctx.save();ctx.globalCompositeOperation='lighter';
  const flame=(x,y,r,ph)=>{for(let i=0;i<3;i++){const k=(t*2.2+ph+i/3)%1;ctx.globalAlpha=0.55*(1-k);ctx.fillStyle=i?F.ember:F.core;
    ctx.beginPath();ctx.arc(x+Math.sin(t*9+ph+i)*r*0.25,y-k*r*2.2,r*(1-k*0.6),0,7);ctx.fill()}};
  flame(tail.x,tail.y,h*0.16,0);
  if(p.st!=='sit')for(const [fx,fy] of [[0.23,0.1],[0.23,-0.1],[-0.22,0.1],[-0.22,-0.1]])flame(p.x+c*h*fx-s*h*fy,p.y+s*h*fx+c*h*fy,h*0.09,fx*7+fy*3);
  ctx.restore();
}
// איפה קצה הזנב על המסך, מתעדכן בתלת-ממד (render3d.js)
const PET_FX={tail:null};
