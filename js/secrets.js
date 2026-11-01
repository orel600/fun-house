/* סודות בעולם הפתוח (המחקר, 31.10.2026: "צפיפות עדיפה על גודל", מגוון סוגי מקומות, ציוני דרך שמושכים את העין, והתגלית עצמה היא הפרס).
   בכל אזור כמה מקומות קטנים וקבועים, בלי חץ ובלי סימון במפה. רק רמז עדין: ניצוץ קטן, או משהו גבוה שרואים מרחוק.
   ארבעה סוגים:
   chest:   תיבה מוסתרת מאחורי סלע או שיח. נחשפת כשמתקרבים, ונפתחת פעם אחת לתמיד.
   shrine:  מקדש קטן. נותן ברכה לדקה (speed: מהירות, loot: שלל), שוב ושוב, עם המתנה בין ברכה לברכה.
   lookout: נקודת תצפית גבוהה. מי שעולה אליה רואה לרגע את כל מקורות המשאבים באזור, עם חץ לכל סוג.
   carving: סימן חרוט על עץ, חץ שמצביע לאוצר קבור (to). כשמגיעים לשם, פיוחו (pet.js) חופרת ומוציאה אותו. פעם אחת לתמיד.
   סוד נחשב "נמצא" בפעם הראשונה: תיבה שנפתחה, ברכה ראשונה, תצפית ראשונה, אוצר שנחפר. חגיגה, ומונה x/y לאזור בפס העליון.
   אזור חדש = שורה ב-SECRETS.regions, בלי לגעת בלוגיקה. נשמר ב-SAVE.secrets ({found:{id:1}, read:{id:1}}).
   הטקסטים ב-lang.js תחת 'sc.'. החיבורים: worldUpdate, drawWorld ו-drawWorldScreen ב-world.js, ו-syncWorld ב-render3d.js */

const SECRETS={
  reveal:140,          // מאיזה מרחק תיבה מוסתרת נחשפת
  touch:46,            // כמה קרוב צריך להיות כדי לפתוח, להתפלל, לעלות או לקרוא
  hint:{every:2.6,col:'#FFE7A3'},   // הניצוץ העדין: כל כמה שניות, ובאיזה צבע
  // תיבה: השלל בפורמט של runGive (loot.js): {משאב:[סיכוי, כמה]}
  chest:{loot:{coins:[1,40],wood:[0.8,6],stone:[0.8,6],iron:[0.6,2],silver:[0.35,1],ruby:[0.12,1],sapphire:[0.12,1]}},
  // ברכה: dur שניות, cd שניות עד שאותו מקדש מברך שוב. speed: פי כמה מהר. loot: פי כמה שלל שנאסף (מעוגל למעלה)
  shrine:{dur:60,cd:90,speed:1.3,loot:1.5,col:{speed:'#7FE0FF',loot:'#F4C74F'}},
  lookout:{dur:7,cd:20,col:'#FFE08A'},   // כמה שניות רואים את המקורות, וכל כמה אפשר לעלות שוב
  // אוצר קבור: near מאיזה מרחק פיוחו רצה לחפור. loot כמו בתיבה, ויותר
  carving:{near:70,loot:{coins:[1,70],gold:[0.5,1],silver:[0.7,2],amber:[0.3,1],star:[0.05,1],ruby:[0.25,1]}},
  /* המקומות, לכל אזור (WORLD.regions ב-world.js. האחו הוא 'meadow', כולל המחצבה במזרח. האגם 'lake', הרכס הקפוא 'ridge', המדבר הבוער 'desert', מגדלי הסערה 'storm', לב הצל 'shadow').
     hide: מה מסתיר את התיבה (rock או bush). bless: איזו ברכה. to: איפה האוצר הקבור. כל מקום רחוק משערים, ממים ומהפנס */
  regions:{
    meadow:[
      {id:'m_chest',kind:'chest',x:-960,y:-60,hide:'rock'},          // בקצה היער המערבי
      {id:'m_chest2',kind:'chest',x:990,y:-40,hide:'bush'},          // מאחורי המחצבה
      {id:'m_shrine',kind:'shrine',x:430,y:590,bless:'speed'},       // בדרום, בין השדות לזירה
      {id:'m_look',kind:'lookout',x:420,y:-540},                     // בשולי המחצבה, רואים ממנה את הכל
      {id:'m_carve',kind:'carving',x:-470,y:520,to:{x:-90,y:610}}    // עץ בודד בדרום-מערב
    ],
    lake:[
      {id:'l_chest',kind:'chest',x:960,y:580,hide:'bush'},           // בפינה הדרום-מזרחית
      {id:'l_shrine',kind:'shrine',x:520,y:620,bless:'loot'},        // בדרום, מתחת לבריכה המזרחית
      {id:'l_look',kind:'lookout',x:-930,y:-620},                    // צפון-מערב
      {id:'l_carve',kind:'carving',x:40,y:430,to:{x:-520,y:620}}     // בין הבריכות, ומצביע אל הדרום
    ],
    ridge:[
      {id:'r_chest',kind:'chest',x:-960,y:-560,hide:'rock'},         // בפינה הצפון-מערבית, מאחורי סלע מושלג
      {id:'r_shrine',kind:'shrine',x:-900,y:560,bless:'speed'},      // דרום-מערב
      {id:'r_look',kind:'lookout',x:930,y:-120},                     // על השפה המזרחית של הרכס
      {id:'r_carve',kind:'carving',x:380,y:600,to:{x:-60,y:640}}     // אורן בודד בדרום, מצביע מערבה
    ],
    desert:[
      {id:'d_chest',kind:'chest',x:960,y:-560,hide:'rock'},          // בפינה הצפון-מזרחית, מאחורי סלע חרוך
      {id:'d_shrine',kind:'shrine',x:920,y:600,bless:'loot'},        // דרום-מזרח, רחוק מהלבה
      {id:'d_look',kind:'lookout',x:-940,y:-620},                    // צפון-מערב, על דיונה גבוהה
      {id:'d_carve',kind:'carving',x:300,y:620,to:{x:-380,y:630}}    // קקטוס בודד בדרום, מצביע מערבה
    ],
    storm:[
      {id:'t_chest',kind:'chest',x:-960,y:-560,hide:'rock'},          // בפינה הצפון-מערבית, מאחורי אבן שנפלה ממגדל
      {id:'t_shrine',kind:'shrine',x:940,y:-560,bless:'speed'},       // צפון-מזרח, מקדש שהברק לא נגע בו
      {id:'t_look',kind:'lookout',x:-940,y:580},                      // דרום-מערב, על שרידי חומה
      {id:'t_carve',kind:'carving',x:220,y:620,to:{x:-180,y:640}}     // עץ שרוף בדרום, מצביע מערבה
    ],
    shadow:[
      {id:'h_chest',kind:'chest',x:-960,y:-560,hide:'bush'},          // בפינה הצפון-מערבית, בתוך שיח צל
      {id:'h_shrine',kind:'shrine',x:940,y:-540,bless:'loot'},        // צפון-מזרח, מקדש שהחושך לא נגע בו
      {id:'h_look',kind:'lookout',x:940,y:600},                       // דרום-מזרח, על סלע גבוה מעל החושך
      {id:'h_carve',kind:'carving',x:-420,y:620,to:{x:-560,y:560}}    // עץ צל בדרום-מערב, מצביע מערבה
    ]
  }
};

const SC=()=>SAVE.secrets||(SAVE.secrets={found:{},read:{}});
const scList=()=>S&&S.wd&&SECRETS.regions[S.wd.reg]||[];
const scFound=id=>!!SC().found[id];
const scCount=reg=>(SECRETS.regions[reg]||[]).filter(s=>scFound(s.id)).length;
// המצב הרגעי באזור: ברכה, תצפית, חפירה, המתנות. חדש בכל כניסה לעולם
const scState=()=>S.wd.sc||(S.wd.sc={bless:null,look:0,dig:null,saw:false,cd:{},hint:0,ui:''});

// נמצא בפעם הראשונה: חגיגה, הודעה עם המונה, שמירה
function scFind(s,x,y){
  if(scFound(s.id))return false;
  SC().found[s.id]=1;saveNow();
  const n=scCount(S.wd.reg),of=scList().length;
  celebrate(x??s.x,y??s.y,'quest','🔍');
  banner(T('sc.found',n,of),C.gold);
  if(typeof questEvent==='function')questEvent('secret',s.kind,1);
  return true;
}

/* ---- כל פריים בעולם (worldUpdate), אחרי שהשלל נאסף מהרצפה ולפני שהוא נכנס לתרמיל ---- */
function secretsUpdate(dt){
  if(!S.wd)return;const st=scState(),Z=SECRETS;
  for(const k in st.cd)st.cd[k]-=dt;
  // ברכה
  if(st.bless){st.bless.t-=dt;
    if(st.bless.k==='loot'&&S.loot)for(const r in S.loot)if(S.loot[r]>0)S.loot[r]=Math.ceil(S.loot[r]*Z.shrine.loot);
    if(st.bless.t<=0){if(st.bless.k==='speed')P.speed/=Z.shrine.speed;st.bless=null;banner(T('sc.blessEnd'),C.chalk)}}
  if(st.look>0)st.look-=dt;
  st.hint+=dt;
  for(const s of scList()){
    const d=Math.hypot(P.x-s.x,P.y-s.y);
    if(s.kind==='chest'){
      if(scFound(s.id))continue;
      if(d<Z.reveal&&!st['v'+s.id]){st['v'+s.id]=1;sfx('tap');sparks(s.x,s.y,Z.hint.col,10,120)}   // נחשפה
      if(d<Z.touch+10){runGive(Z.chest.loot,s.x,s.y);scFind(s)}}
    else if(s.kind==='shrine'){
      if(d<Z.touch&&!(st.cd[s.id]>0)&&!st.bless){
        st.bless={k:s.bless,t:Z.shrine.dur};st.cd[s.id]=Z.shrine.cd;if(s.bless==='speed')P.speed*=Z.shrine.speed;
        sparks(s.x,s.y,Z.shrine.col[s.bless],24,200);sfx('xp');
        if(!scFind(s))banner(T('sc.bless.'+s.bless),Z.shrine.col[s.bless]);else floatText(P.x,P.y-50,T('sc.bless.'+s.bless),Z.shrine.col[s.bless],15)}}
    else if(s.kind==='lookout'){
      if(d<Z.touch&&!(st.cd[s.id]>0)){st.look=Z.lookout.dur;st.cd[s.id]=Z.lookout.cd;sfx('xp');
        if(!scFind(s))banner(T('sc.look'),Z.lookout.col)}}
    else if(s.kind==='carving'){
      if(scFound(s.id))continue;
      if(d<Z.touch&&!SC().read[s.id]){SC().read[s.id]=1;saveNow();banner(T('sc.carve'),C.gold);sfx('tap')}
      if(SC().read[s.id]&&!st.dig&&Math.hypot(P.x-s.to.x,P.y-s.to.y)<Z.carving.near)scDig(s)}
  }
  // פיוחו חופרת את האוצר: רצה, חופרת, וכשסיימה האוצר יוצא. אם עזבה באמצע (השחקן התרחק), מנסים שוב כשחוזרים
  if(st.dig){const s=st.dig,p=S.pet;
    if(!p){scTreasure(s);return}
    if(p.st==='dig')st.saw=true;
    else if(st.saw){scTreasure(s)}
    else if(p.st!=='go'){st.dig=null}}
}
function scDig(s){
  const st=scState(),p=S.pet;st.dig=s;st.saw=false;
  floatText(P.x,P.y-50,T(petTx('sc.sniff'),T('pet.name.'+(SAVE.pet.kind||PET.default))),C.gold,15);
  if(p){p.spot={x:s.to.x,y:s.to.y};p.st='go';p.t=0;p.foe=null;p.digT=petStage().dig.every}
}
function scTreasure(s){
  const st=scState();st.dig=null;st.saw=false;
  runGive(SECRETS.carving.loot,s.to.x,s.to.y-10);scFind(s,s.to.x,s.to.y);
}

/* ---- ציור בעולם (drawWorld). בתלת-ממד העץ, הסלעים והשיח מגיעים מ-scenery3D, וכאן רק מה שלא מודל: תיבה, מקדש, מגדל, חץ חרוט, אדמה ---- */
function secretsDraw(){
  if(!S.wd)return;const st=scState(),t=fxNow(),Z=SECRETS,two=!R3D.on;
  for(const s of scList()){const x=s.x,y=s.y,found=scFound(s.id);
    if(s.kind==='chest'){
      if(!found&&st['v'+s.id]){   // התיבה, שנחשפה
        ctx.fillStyle='#7A5230';ctx.strokeStyle='#3A2412';ctx.lineWidth=2;ctx.fillRect(x-14+18,y-10,28,18);ctx.strokeRect(x-14+18,y-10,28,18);
        ctx.fillStyle=C.gold;ctx.fillRect(x+16,y-3,4,6)}
      if(two)scHide(s.hide,x,y);
      if(!found&&(st.hint%Z.hint.every)<0.5)scTwinkle(x+8,y-26,(st.hint%Z.hint.every)/0.5);}   // ניצוץ קטן מעל הסלע
    else if(s.kind==='shrine'){const ready=!(st.cd[s.id]>0),col=Z.shrine.col[s.bless];
      ctx.fillStyle='rgba(5,7,13,0.35)';ctx.beginPath();ctx.ellipse(x,y+6,26,8,0,0,7);ctx.fill();
      ctx.fillStyle='#8E9AAE';ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.fillRect(x-20,y-6,40,10);ctx.strokeRect(x-20,y-6,40,10);   // בסיס
      ctx.fillRect(x-16,y-40,6,34);ctx.fillRect(x+10,y-40,6,34);ctx.fillRect(x-20,y-46,40,7);   // שני עמודים וגג
      if(ready){const a=0.35+Math.sin(t*2.4)*0.2;ctx.globalAlpha=a;ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y-20,9,14,0,0,7);ctx.fill();ctx.globalAlpha=1}}
    else if(s.kind==='lookout'){   // מגדל אבנים גבוה עם דגל: רואים אותו מרחוק
      ctx.fillStyle='rgba(5,7,13,0.35)';ctx.beginPath();ctx.ellipse(x,y+6,30,9,0,0,7);ctx.fill();
      ctx.strokeStyle=C.ink;ctx.lineWidth=2;
      for(let i=0;i<4;i++){const w=28-i*5;ctx.fillStyle=i%2?'#6C7488':'#7E8698';ctx.beginPath();ctx.ellipse(x,y-i*18,w,10,0,0,7);ctx.fill();ctx.stroke()}
      ctx.fillStyle='#4A3A2A';ctx.fillRect(x-1.5,y-120,3,62);
      ctx.fillStyle=Z.lookout.col;ctx.beginPath();ctx.moveTo(x+1.5,y-120);ctx.lineTo(x+26+Math.sin(t*3)*3,y-112);ctx.lineTo(x+1.5,y-104);ctx.fill()}
    else if(s.kind==='carving'){
      if(two){ctx.fillStyle='#6B4A2B';ctx.fillRect(x-6,y-30,12,36);ctx.fillStyle='#2F5E3A';ctx.beginPath();ctx.arc(x,y-46,28,0,7);ctx.fill();ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.stroke()}
      // החץ החרוט על הגזע: מצביע לאוצר
      const a=Math.atan2(s.to.y-y,s.to.x-x);ctx.save();ctx.translate(x,y-14);ctx.rotate(a);ctx.strokeStyle=found?'#8A6A44':'#F4E2B8';ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(8,0);ctx.moveTo(3,-5);ctx.lineTo(8,0);ctx.lineTo(3,5);ctx.stroke();ctx.restore();
      if(!found&&!SC().read[s.id]&&(st.hint%Z.hint.every)<0.5)scTwinkle(x+10,y-20,(st.hint%Z.hint.every)/0.5);
      if(!found){const tx=s.to.x,ty=s.to.y,rd=SC().read[s.id];   // אדמה תחוחה במקום האוצר: עדינה, וברורה יותר אחרי שקראו את הסימן
        ctx.fillStyle='rgba(120,90,50,'+(rd?0.55:0.22)+')';ctx.beginPath();ctx.ellipse(tx,ty,18,7,0,0,7);ctx.fill();
        if(rd){ctx.strokeStyle='rgba(244,226,184,0.7)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tx-6,ty-6);ctx.lineTo(tx+6,ty+6);ctx.moveTo(tx+6,ty-6);ctx.lineTo(tx-6,ty+6);ctx.stroke()}}}
  }
  // תצפית: טבעת זהב על כל מקור משאבים באזור
  if(st.look>0&&S.nd){const a=Math.min(1,st.look)*(0.6+Math.sin(t*6)*0.25);ctx.globalAlpha=a;ctx.strokeStyle=Z.lookout.col;ctx.lineWidth=3;
    for(const n of S.nd.list){if(n.dead)continue;ctx.beginPath();ctx.arc(n.x,n.y,n.r+10,0,7);ctx.stroke()}ctx.globalAlpha=1}
  // ברכה: הילה עדינה סביב השחקן
  if(st.bless){ctx.globalAlpha=0.25+Math.sin(t*5)*0.1;ctx.strokeStyle=Z.shrine.col[st.bless.k];ctx.lineWidth=3;ctx.beginPath();ctx.arc(P.x,P.y,P.r+12,0,7);ctx.stroke();ctx.globalAlpha=1}
}
// מה שמסתיר את התיבה, בדו-ממד
function scHide(kind,x,y){
  ctx.strokeStyle=C.ink;ctx.lineWidth=2;
  if(kind==='bush'){ctx.fillStyle='#3E7A45';for(const [dx,dy,r] of [[-10,-6,16],[8,-10,14],[0,2,15]]){ctx.beginPath();ctx.arc(x+dx,y+dy,r,0,7);ctx.fill();ctx.stroke()}}
  else{ctx.fillStyle='#5A6075';ctx.beginPath();ctx.moveTo(x-26,y+10);ctx.lineTo(x-18,y-14);ctx.lineTo(x,y-24);ctx.lineTo(x+20,y-12);ctx.lineTo(x+24,y+10);ctx.closePath();ctx.fill();ctx.stroke()}
}
// ניצוץ קטן בצורת כוכב, שגדל ונעלם (k מ-0 עד 1)
function scTwinkle(x,y,k){
  const s=Math.sin(k*Math.PI)*7;if(s<=0)return;ctx.fillStyle=SECRETS.hint.col;ctx.globalAlpha=Math.sin(k*Math.PI);
  ctx.beginPath();ctx.moveTo(x,y-s);ctx.lineTo(x+s*0.25,y-s*0.25);ctx.lineTo(x+s,y);ctx.lineTo(x+s*0.25,y+s*0.25);ctx.lineTo(x,y+s);ctx.lineTo(x-s*0.25,y+s*0.25);ctx.lineTo(x-s,y);ctx.lineTo(x-s*0.25,y-s*0.25);ctx.fill();
  ctx.globalAlpha=1;
}
// מעל הכל: בזמן תצפית, חץ בקצה המסך למקור הקרוב מכל סוג
function secretsScreen(ox,oy){
  if(!S.wd||!(scState().look>0)||!S.nd)return;const best={};
  for(const n of S.nd.list){if(n.dead)continue;const d=Math.hypot(n.x-P.x,n.y-P.y);if(!best[n.kind]||d<best[n.kind].d)best[n.kind]={n,d}}
  for(const k in best){const n=best[k].n;edgeArrow(n.x+ox,n.y+oy,wKind(k).col||SECRETS.lookout.col,0.9)}
}
// המונה בפס העליון: 🔍 x/y באזור הנוכחי
function secretsHud(){
  const el=$('wSec');if(!el||!S.wd)return;const of=scList().length,txt=of?'🔍 '+scCount(S.wd.reg)+'/'+of:'';
  if(el.textContent!==txt){el.textContent=txt;el.title=T('sc.hud')}
}
/* בתלת-ממד: המודלים הקיימים של הכפר (VIL3D.decor) לעץ החרוט ולמה שמסתיר תיבה. נקרא פעם אחת לכל אזור, מ-syncWorld */
function secrets3D(reg,put){
  for(const s of SECRETS.regions[reg]||[]){
    if(s.kind==='carving')put('v_treeA',s.x,s.y-6,70,hash(s.x,s.y)*6.28);
    else if(s.kind==='chest')put(s.hide==='bush'?'v_treeB':'v_rock',s.x,s.y,s.hide==='bush'?44:52,hash(s.x,s.y)*6.28);
  }
}
