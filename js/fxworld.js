/* שכבת אפקטים לכפר ולעולם (FXW, אוראל 7.11.2026): רק אפקטים מספריית Mochi Lab (fxlib.js) מעל מה שכבר קיים.
   לא משנה מפה, לוגיקה, קווסטים או איזון. אם מוחקים את הקובץ ואת השורות שקוראות לו, הכל עובד כמו קודם.
   מה יש כאן:
   - הסימנים מעל דמויות (קווסט, מסירה, חנות, שיחה): ב-fxvil.js, סימן אחד לכל דמות
   - emote_* כשפותחים שיחה, stamp_done כשמוסרים קווסט, hearts כשפיוחו אוכלת, קונפטי ובלונים בחגיגות (celebrate ב-fx.js)
   - אווירה בכפר: עלי כותרת ופרחים ביום, גחליליות בלילה. כוכבים בלב הצל, ואדוות ובועות על קו המים באגם
   - בעולם: מזג אוויר לפי אזור (שכבה עדינה מעל הקנבס של world.js), צעדים לפי הקרקע, אדוות במים רדודים, בועות בבורות הלבה,
     אובך במדבר, waypoint ו-quest_mark על מקום של קווסט צדדי, pickup_* באיסוף, ו-mm_ping במפה הקטנה כשמשהו חדש מופיע
   7.11 (הבאנדל): שובל על כל הנפה בצבע סוג הנזק, אווירה לפי אזור (FXW.scene), התזות, גלים ודג באגם, צמיחה מחדש ומצבים על הגיבור (fxwMore, fxwSlow).
   חיבורים: fxwUpdate ב-villageUpdate וב-worldUpdate, fxwMarks ב-drawQuestMarks (quests.js) וב-drawWnpcScreen (worldnpc.js),
   fxwCelebrate ב-celebrate (fx.js). ועוטף מבחוץ: wsbCast, npcTalk, wnpcTalk, questClaim, dropTake, nodeDown, mmDraw. פיוחו אוכלת: לפי SAVE.pet.fed.
   ביצועים: עד FXW.cap אפקטים משלנו בבת אחת, בתוך FXLIB.max של כל המשחק. סנכרון של אפקטים קבועים פעמיים-שלוש בשנייה, לא בכל פריים */
const FXW={
  on:true,
  cap:24,              // כמה אפקטים של השכבה הזו בבת אחת (מתוך FXLIB.max=70)
  sync:0.3,            // כל כמה שניות מסנכרנים את האפקטים הקבועים (סימנים, מזג אוויר, מקום הקווסט)
  emote:{ready:'emote_heart',open:'emote_idea',idle:'emote_dots',size:54,dur:1.7,up:64,dx:26},
  stamp:{size:96,up:70},
  hearts:{size:84},
  // חגיגות (fx.js): איזה אפקט נוסף לכל סוג, וגודל
  party:{upgrade:['win_confetti',190],rank:['balloons',130],travel:['win_confetti',170],loot4:['win_confetti',150]},
  // אווירה: כל כמה שניות אפקט רך אחד, עד amb.max בבת אחת. night: לפי השעה (VFX.hour, vfx.js)
  amb:{every:[3,6],max:2,size:170,alpha:0.7,night:[20,6],
    village:{day:['petals','bloom'],night:['fireflies']},
    meadow:{day:['leaves'],night:['fireflies']},
    lake:{day:['fireflies'],night:['fireflies']},
    shadow:{day:['stars'],night:['stars']}},   // לב הצל: נצנוצים עדינים בחושך (ניר 7.11, #430)
  glow:{fireflies:1,stars:1},   // אפקטים שמוסיפים אור
  dim:{stars:0.4},              // שקיפות משלו (ברירת המחדל amb.alpha)
  // מזג אוויר לפי אזור: [אפקט, שקיפות, איפה]. full: אריחים על כל המסך, sky: פס למעלה, low: חלק תחתון. עובר מעל הקנבס הקיים
  weather:{
    ridge:[['snow',0.45,'full'],['aurora',0.45,'sky','night']],   // זוהר צפוני רק בלילה: כל שכבה כאן היא כמעט מסך שלם לצייר (7.11)
    storm:[['wx_rainheavy',0.5,'full']],   // גשם כבד מהבאנדל (7.11) במקום rain
    desert:[['haze',0.4,'low']]
  },
  // צעדים: כל step פיקסלים של הליכה. ground: לפי אזור. במים רדודים (tSlow<1): אדווה
  step:{dist:42,size:36,alpha:0.75,ground:{desert:'step_sand',ridge:'step_snow',storm:'water_ripple'},def:'step_dust',water:'water_ripple',waterSize:62},
  lava:{every:[1.1,2.2],size:80,range:520},           // בועות בבורות הלבה במדבר (ponds של אזור עם heat)
  shore:{reg:{lake:1},every:[1,1.8],ids:['water_ripple','water_ripple','bubbles_bg'],size:{water_ripple:84,bubbles_bg:130},alpha:0.7},   // אגם: אדוות ובועות על קו המים שבמסך (tWaterNear, terrain.js), ניר 7.11 (#430)
  quest:{way:120,mark:56,up:170},                      // מקום של קווסט צדדי (sqTargets ב-questboard.js): טבעת על הרצפה וסימן מעל העמוד
  pick:{size:58,gap:0.15},                             // איסוף: coins → pickup_coin, ציוד ומשאב נדיר → pickup_gem, תיבה → pickup_chest
  ping:{dur:0.7,size:0.95},                            // מפה קטנה: כמה זמן, וגודל ביחס למפה
  /* ---- 7.11 (באנדל Mochi Lab, PR #433): שובלי חרב, מזג אוויר, מים, טבע ומצבים על הגיבור ---- */
  // שובל על כל הנפה של הגיבור (P.sw.anim עולה, combat.js). צבע = סוג הנזק (CLAUDE.md): 5 צבעים ל-6 סוגים.
  // פיזי (לבן) אין לו צבע ניטרלי, אז כחול-פלדה חלש יותר (alpha.physical). emerald שמור לצמח/רעל אם יתווספו
  trail:{col:{physical:'sapphire',fire:'crimson',water:'sapphire',ice:'sapphire',lightning:'amethyst',earth:'amber',plant:'emerald',poison:'emerald'},
    alpha:{physical:0.7},a:0.95,add:false,   // add (אור) עולה פי 2 בציור, והגיליון כבר זוהר בעצמו
    kind:{sword:'slash',axe:'axe',hammer:'smash'},   // P.wt → סוג השובל. פטיש יש רק ב-amber/crimson (smashCol)
    smashCol:{crimson:'crimson'},smashDef:'amber',
    size:1.7,fps:60,dy:-12,   // גודל: פי size מטווח המכה. fps 60: 0.4 שנ'. הציור עולה לפי השטח, ראו docs/fx.md. 
    rot:{slash:Math.PI,axe:Math.PI,smash:-Math.PI/2},   // לאן הגיליון פונה (שמאלה / למעלה), כדי לסובב לכיוון ההנפה
    spin:{whirl:1},spinSize:2.6},                       // סקילים מסתובבים (wskbook.js): tr_spin בצבע הסקיל כל זמן שהם פועלים
  /* אווירה לפי אזור: כל every שניות אפקט אחד מהרשימה (לפי w), עד max בבת אחת. רק במסך, ליד המצלמה.
     size: פיקסלים, או חלק מרוחב המסך (≤3). at: any במסך, sky למעלה, low למטה, scr כל המסך, pond ליד בור לבה, forest בשולי יער.
     when: day/night. dawn: [שקיפות בבוקר ובערב, שקיפות בשאר היום]. flash: הבזק מסך עם הברק (לא ב-RM ולא ב"פחות אפקטים") */
  scene:{every:[3.5,7],max:1,   // אחד בבת אחת: כל אפקט כאן הוא שטח גדול לצייר
    dawn:[[5,9],[17,21]],
    meadow:[{id:'wx_petals',w:3,size:0.30,a:0.75,dur:3,fps:20,when:'day'},{id:'pl_pollen',w:2,size:130,a:0.85,add:1,dur:2.4,fps:20,when:'day'}],   // wx_sunrays לא כאן: הרקע שלו אפור כמעט אטום, ובגודל חלקי רואים מלבן. קרני אור יש ליד היער (lr_forest)
    desert:[{id:'wx_dust',w:4,size:0.28,a:0.7,at:'low',dur:2.6,fps:22},{id:'wx_devil',w:1,size:150,a:0.85,dur:2.2,fps:22,vx:60},
            {id:'sf_embers',w:2,size:120,a:0.9,add:1,at:'pond',dur:2,fps:24}],
    storm:[{id:'wx_flash',w:1,a:0.32,add:1,fps:60,layer:1,calm:1}],   // הבזק ברק על כל המסך (layer). calm: לא כשביקשו פחות תנועה או 'פחות אפקטים'. wx_bolt לא: הרקע האפור שלו נראה כמלבן
    ridge:[],   // סופת השלג היא משב: אריחי השלג מתחלפים לרגע (FXW.gust), בלי שטח נוסף לצייר
    lake:[{id:'wx_fog',w:1,size:0.32,dawn:[0.5,0.24],at:'low',dur:4,fps:10,vx:18}],
    shadow:[{id:'sf_fog',w:2,size:0.30,a:0.6,at:'low',dur:3.5,fps:14},{id:'lr_moon',w:1,size:0.26,a:0.25,add:1,at:'sky',dur:3,fps:12}],
    forest:[{id:'lr_forest',w:2,size:0.30,a:0.35,add:1,at:'forest',dur:3,fps:12,when:'day'},{id:'pl_shroom',w:2,size:60,a:1,add:1,at:'forest',dur:3,fps:16,when:'night'}],
    forestNear:520},
  // משב: אריחי מזג האוויר של האזור מתחלפים לרגע לגיליון אחר, באותו שטח (אז בלי עלות נוספת). add: הגיליון עם רקע אפור
  gust:{ridge:{from:'snow',to:'wx_blizzard',every:[6,12],dur:2.6,a:0.5,add:1}},gustT:4,gustEnd:0,   // יער (TR.map.forests) במרחק הזה מהמצלמה: מוסיפים את רשימת forest לאזור
  // הגיבור במים: התזה (hit_water) כשהולכים במים רדודים, טיפות כשהולכים לאורך המים
  wet:{splash:'hit_water',splashSize:58,drop:'wt_droplet',dropSize:44,near:70},
  // גל על החוף (כל אזור עם מים במסך), ודג קופץ באגם
  wave:{every:[2.4,4.6],size:110,a:0.85},jump:{reg:{lake:1},every:[7,13],size:96,a:0.95,edge:60},
  regrow:{size:110},   // עץ או מקור שצומחים מחדש (world.js, n.back)
  // מצבים על הגיבור: קטן וקצר, לכל היותר פעם ב-gap שניות לכל אחד
  status:{size:54,up:58,a:0.85,gap:3.5,heal:0.5},   // heal: כמה חיים צריך לעלות בין סנכרונים כדי שזה ייחשב ריפוי
  // ---- מצב חי ----
  // גיליונות שהתוכן שלהם נחתך בשולי הפריים (ערפל שזז, אובך): מרככים את השוליים פעם אחת בטעינה (fxwSoft), אחרת רואים מלבן. inner: עד איפה אטום (חלק מחצי הפריים)
  soft:{ids:['haze','wx_fog','sf_fog','wx_dust','wx_petals','lr_forest','lr_moon','pl_pollen'],inner:0.45},softDone:{},
  sceneT:1.5,trailH:null,wxl:new Map(),wxc:null,wxK:0.5,waveT:2,jumpT:5,swA:0,stT:{},hp:null,dead:new Set(),forest:false,
  live:new Map(),once:[],cam:{x:0,y:0},t:0,ambT:2,lavaT:1,pickT:0,lx:null,ly:null,shoreT:1,reg:'',pingT:0,seen:null,fed:null,marks:{v:null,w:null},n:0
};
const fxwOn=()=>FXW.on&&typeof fxPlay==='function'&&!!S&&!S.mb&&!!(S.vil||S.wd)&&!!P;
const fxwReg=()=>S.wd?String(S.wd.reg||'meadow').replace(/^dp_/,''):'village';   // עומק הצל: כמו האזור שהקומה בנויה ממנו
const fxwNight=()=>{const h=typeof VFX!=='undefined'&&VFX.hour?VFX.hour():new Date().getHours(),N=FXW.amb.night;return h>=N[0]||h<N[1]};
const fxwAlive=h=>!!h&&h.on&&FXLIB.list.includes(h);
const fxwMine=()=>{let n=0;for(const h of FXW.live.values())if(fxwAlive(h))n++;return n};
// אפקט חד-פעמי של השכבה: רק כשיש מקום (cap), כדי לא להעמיס
function fxwPlay(id,x,y,o){if(!fxwOn()||FXW.n>=FXW.cap)return null;const h=fxPlay(id,x,y,o);if(h){FXW.once.push(h);FXW.n++}return h}

/* ---- אפקטים קבועים: רשימה של מה שצריך להיות עכשיו, והסנכרון מוסיף ומוריד רק מה שהשתנה ---- */
function fxwWant(){
  const want=new Map(),cam=FXW.cam,cw=W_(),ch=H_();
  // הסימנים מעל דמויות (קווסט, מסירה, חנות, שיחה) עברו ל-fxvil.js: סימן אחד לכל דמות, במקום העיגול ולא מאחוריו
  {
    // מזג אוויר: אריחים שעוקבים אחרי המצלמה. 7.11 (WXW, wxworld.js): עם ליבת מזג האוויר (weather.js) היא מציירת והאריחים לא נוצרים,
    // ובלעדיה נוספים כאן אריחים לפי מצב הסערה (wxwTiles), גם בכפר
    const Gu=FXW.gust[fxwReg()],gu=Gu&&fxNowT()<FXW.gustEnd,core=typeof wxwCore==='function'&&wxwCore();
    for(const [id0,a0,kind,when] of core?[]:[...(S.wd&&FXW.weather[fxwReg()]||[]),...(typeof wxwTiles==='function'?wxwTiles():[])]){if(when==='night'&&!fxwNight())continue;const g=gu&&id0===Gu.from,id=g?Gu.to:id0,a=g?Gu.a:a0,add=g&&!!Gu.add;
      if(kind==='sky'){const s=cw/2;for(let i=0;i<2;i++)want.set('w:'+id+i,{id,o:cam,size:s,alpha:a,dx:(i-0.5)*s,dy:-ch/2+s*0.1,flip:i===1})}   // flip: החצי השני במראה, כדי שהתפר באמצע יתחבר
      else if(kind==='low'){const s=cw/2.2;for(let i=0;i<2;i++)want.set('w:'+id+i,{id,o:cam,size:s,alpha:a,dx:(i-0.5)*s*1.1,dy:ch*0.18})}
      else{const s=Math.max(cw/2,ch),c=Math.ceil(cw/s),r=Math.ceil(ch/s);for(let i=0;i<c;i++)for(let j=0;j<r;j++)want.set('w:'+id+i+'_'+j,{id,o:cam,size:s,alpha:a,add,dx:(i-(c-1)/2)*s,dy:(j-(r-1)/2)*s})}}
  }
  if(S.wd){
    // מקום של קווסט צדדי פעיל: טבעת על הרצפה וסימן מעל עמוד האור הקיים
    const Q=FXW.quest;for(const t of typeof sqTargets==='function'?sqTargets():[]){const k=Math.round(t.p.x)+'_'+Math.round(t.p.y);
      want.set('q:'+k,{id:'waypoint',o:t.p,size:Q.way,alpha:0.8,under:true});want.set('qm:'+k,{id:'quest_mark',o:t.p,size:Q.mark,alpha:0.9,dy:-Q.up})}}
  return want;
}
const W_=()=>typeof W!=='undefined'?W:900,H_=()=>typeof H!=='undefined'?H:420;
function fxwSync(){
  const want=fxwWant();
  for(const [k,h] of FXW.live)if(!want.has(k)||!fxwAlive(h)||h.id!==want.get(k).id){fxStop(h);FXW.live.delete(k)}
  // מזג אוויר (w:) בשכבה משלו (fxwWxDraw), לא ברשימה הכללית
  for(const [k,h] of FXW.wxl)if(k!=='flash'&&k!=='gust'&&(!want.has(k)||!h.on||h.id!==want.get(k).id))FXW.wxl.delete(k);
  for(const [k,w] of want){if(FXW.live.has(k)||FXW.wxl.has(k))continue;
    if(k.startsWith('w:')){const h=fxMake(w.id,w.o.x,w.o.y,{follow:w.o,loop:true,size:w.size,alpha:w.alpha,dx:w.dx||0,dy:w.dy||0,flip:!!w.flip,add:!!w.add,fps:w.add?24:0});if(h)FXW.wxl.set(k,h);continue}
    const h=fxPlay(w.id,w.o.x,w.o.y,{follow:w.o,loop:true,size:w.size,alpha:w.alpha,dx:w.dx||0,dy:w.dy||0,add:!!w.add,under:!!w.under,flip:!!w.flip});if(h)FXW.live.set(k,h)}
}
function fxwStopAll(){for(const h of FXW.live.values())fxStop(h);FXW.live.clear();FXW.wxl.clear()}

/* ---- כל פריים בכפר ובעולם (villageUpdate, worldUpdate) ---- */
function fxwUpdate(dt){
  if(!fxwOn()){if(FXW.live.size)fxwStopAll();return}
  FXW.cam.x=S.cam.x;FXW.cam.y=S.cam.y;
  if(typeof wxwUpdate==='function')wxwUpdate(dt);   // מצב מזג האוויר (wxworld.js, 7.11)
  FXW.once=FXW.once.filter(fxwAlive);{const now=fxNowT();for(const [k,f] of FXW.wxl)if(fxFrame(f,now)<0)FXW.wxl.delete(k)}FXW.n=FXW.once.length+FXW.live.size+FXW.wxl.size;
  const reg=fxwReg();if(reg!==FXW.reg){FXW.reg=reg;FXW.forest=false;fxwStopAll();FXW.lx=null;FXW.dead.clear();FXW.hp=null;if(S.wd)fxwPingNow();fxwPreload(reg)}   // אזור חדש: מנקים ומתחילים מחדש, טוענים מראש, ופינג במפה
  if((FXW.t-=dt)<=0){FXW.t=FXW.sync;fxwSoft();fxwSync();fxwNews();fxwSlow()}
  // צעדים לפי הקרקע
  if(FXW.lx===null){FXW.lx=P.x;FXW.ly=P.y}
  const St=FXW.step,d=Math.hypot(P.x-FXW.lx,P.y-FXW.ly);
  if(d>St.dist*2.5){FXW.lx=P.x;FXW.ly=P.y}   // קפיצה (אבן מסע, מעבר): בלי צעד
  else if(d>=St.dist){FXW.lx=P.x;FXW.ly=P.y;
    const wet=S.wd&&typeof tSlow==='function'&&tSlow(P.x,P.y)<1,id=wet?St.water:S.wd?(St.ground[reg]||St.def):St.def;
    fxwPlay(id,P.x,P.y+P.r*0.7,{size:wet||id==='water_ripple'?St.waterSize*(wet?1:0.6):St.size,alpha:St.alpha,under:true});fxwWet(wet)}
  // אווירה רכה
  const A=FXW.amb[reg];
  if(A&&(FXW.ambT-=dt)<=0){FXW.ambT=rand(...FXW.amb.every);
    const mine=FXW.once.filter(h=>h.amb).length;
    if(mine<FXW.amb.max){const L=fxwNight()?A.night:A.day,id=L[Math.floor(Math.random()*L.length)],cw=W_(),ch=H_();
      const x=S.cam.x+rand(-cw*0.4,cw*0.4),y=S.cam.y+rand(-ch*0.35,ch*0.35),big=id!=='bloom';
      const h=fxwPlay(id,x,y,{size:big?FXW.amb.size:44,alpha:big?(FXW.dim[id]||FXW.amb.alpha):0.9,add:!!FXW.glow[id],dur:big?2.4:0});if(h)h.amb=1}}
  // קו המים באגם: נקודה אקראית במסך, והמים הכי קרובים אליה. רק אם גם הם במסך
  const Sh=FXW.shore;if(S.wd&&Sh.reg[reg]&&typeof tWaterNear==='function'&&(FXW.shoreT-=dt)<=0){FXW.shoreT=rand(...Sh.every);const cw=W_(),ch=H_();
    for(let i=0;i<3;i++){const b=tWaterNear(P.x+rand(-cw*0.45,cw*0.45),P.y+rand(-ch*0.45,ch*0.45));
      if(b&&Math.abs(b.x-P.x)<cw/2&&Math.abs(b.y-P.y)<ch/2){const id=Sh.ids[Math.floor(Math.random()*Sh.ids.length)];fxwPlay(id,b.x,b.y,{size:Sh.size[id],alpha:Sh.alpha,under:true});break}}}
  fxwMore(dt,reg);   // 7.11: שובלים, אווירה לפי אזור, גלים, צמיחה ומצבים
  // בועות בבורות הלבה (המדבר)
  if(S.wd&&WR().heat&&(FXW.lavaT-=dt)<=0){FXW.lavaT=rand(...FXW.lava.every);
    const ps=(WR().ponds||[]).filter(p=>Math.hypot(p.x-P.x,p.y-P.y)<FXW.lava.range+p.r);
    if(ps.length){const p=ps[Math.floor(Math.random()*ps.length)],a=rand(0,6.28),r=rand(0,p.r*0.55);fxwPlay('lava_bubble',p.x+Math.cos(a)*r,p.y+Math.sin(a)*r*0.6,{size:Math.min(FXW.lava.size,p.r*1.4),alpha:0.9,add:true,under:true})}}
  // פיוחו אכלה (petFeed ב-pet.js): לבבות. לפי המונה, כי הכפתור מחובר לפונקציה ישירות
  const fed=SAVE.pet&&SAVE.pet.fed||0,p=S.pet;if(FXW.fed!==null&&fed>FXW.fed&&p)fxwPlay('hearts',p.x,p.y,{follow:p,dy:-(typeof petStage==='function'?petStage().h:30),size:FXW.hearts.size});FXW.fed=fed;
  if(FXW.pingT&&fxNowT()-FXW.pingT<FXW.ping.dur&&typeof MM!=='undefined')MM.t=0;   // בזמן הפינג המפה הקטנה מצוירת בכל פריים
}

/* ---- 7.11: הבאנדל של Mochi Lab בעולם ---- */
// השובל לנשק ולסוג הנזק שביד. kind: slash/axe/smash/spin
function fxwTrailId(kind,dt){const T=FXW.trail,c=T.col[dt]||T.col.physical;return kind==='smash'?'tr_smash_'+(T.smashCol[c]||T.smashDef):'tr_'+kind+'_'+c}
function fxwSwing(){
  const T=FXW.trail,s=P.sw,kind=T.kind[P.wt]||'slash',dt=P.dt&&P.dt.sword||'physical';
  const id=fxwTrailId(kind,dt),o={rot:s.ang+T.rot[kind],size:s.range*T.size,alpha:T.alpha[dt]||T.a},h=FXW.trailH;
  // אחד לכל הגיבור: הנפה חדשה מתחילה מחדש את אותו שובל, כך שאף פעם אין שניים בבת אחת (רק שטח הציור עולה)
  if(fxwAlive(h)&&FXDATA[id]){fxImg(id);Object.assign(h,o,{id,D:FXDATA[id],t0:fxNowT()});return h}
  const n=fxwPlay(id,P.x,P.y,Object.assign({follow:P,dy:T.dy,fps:T.fps,add:T.add},o));if(n)n.trail=1;return FXW.trailH=n;
}
// הגיבור במים: התזה כשהולכים במים רדודים, טיפה כשהולכים לאורך המים
function fxwWet(wet){
  if(!S.wd)return;const Wt=FXW.wet;
  if(wet){fxwPlay(Wt.splash,P.x,P.y+P.r*0.4,{size:Wt.splashSize,alpha:0.85,under:true});return}
  const b=typeof tWaterNear==='function'&&tWaterNear(P.x,P.y);if(b&&b.e<Wt.near&&Math.random()<0.5)fxwPlay(Wt.drop,(P.x+b.x)/2,(P.y+b.y)/2,{size:Wt.dropSize,alpha:0.9,under:true});
}
const fxwHr=()=>typeof VFX!=='undefined'&&VFX.hour?VFX.hour():new Date().getHours();
const fxwDawn=()=>{const h=fxwHr();return FXW.scene.dawn.some(r=>h>=r[0]&&h<r[1])};
// יער ליד המצלמה (בדיקה פעם בסנכרון, לא בכל פריים)
function fxwForestNear(){const M=typeof TR!=='undefined'&&TR&&TR.map;if(!S.wd||!M||!M.forests||!M.forests.length)return false;const c=S.cam,R=FXW.scene.forestNear;
  return M.forests.some(F=>inPoly(c.x,c.y,F)||polyDist(c.x,c.y,F)<R)}
// איפה אפקט אווירה מופיע. null = אין מקום מתאים עכשיו
function fxwAt(e){
  const c=S.cam,cw=W_(),ch=H_(),r=(a,b)=>rand(a,b);
  switch(e.at){
    case 'sky':return{x:c.x+r(-cw*0.3,cw*0.3),y:c.y-ch*0.22};
    case 'low':return{x:c.x+r(-cw*0.25,cw*0.25),y:c.y+ch*0.22};
    case 'scr':return{x:c.x,y:c.y};
    case 'pond':{const ps=(WR().ponds||[]).filter(p=>Math.abs(p.x-c.x)<cw/2&&Math.abs(p.y-c.y)<ch/2);if(!ps.length)return null;const p=ps[Math.floor(Math.random()*ps.length)];return{x:p.x+r(-p.r,p.r)*0.4,y:p.y-p.r*0.3}}
    case 'forest':{const M=TR.map;for(let i=0;i<4;i++){const x=c.x+r(-cw*0.42,cw*0.42),y=c.y+r(-ch*0.38,ch*0.38);
      if((M&&M.forests||[]).some(F=>polyDist(x,y,F)<90))return{x,y}}return null}   // 7.11: אזור בלי יערות (FXW.forest מהאזור הקודם, עד הסנכרון הבא)
    default:return{x:c.x+r(-cw*0.4,cw*0.4),y:c.y+r(-ch*0.35,ch*0.35)};
  }
}
function fxwScene(reg){
  const Sc=FXW.scene,night=fxwNight();
  const core=typeof wxwCore==='function'&&wxwCore();   // 7.11 (WXW): עם ליבת מזג האוויר, גיליונות wx_ (עלי כותרת, אבק, ערפל, הבזק) מגיעים ממנה, מתחת לקרב
  let L=(Sc[reg]||[]).concat(FXW.forest?Sc.forest:[]).filter(e=>(!e.when||(e.when==='night')===night)&&!(core&&/^wx_/.test(e.id)));
  if(!L.length||FXW.once.filter(h=>h.scene).length>=Sc.max)return;
  let w=L.reduce((a,e)=>a+e.w,0)*Math.random(),e=L[L.length-1];for(const x of L)if((w-=x.w)<0){e=x;break}
  // שכבת מזג האוויר: על כל המסך, עוקב אחרי המצלמה. עם השלג או הגשם זה עובר לקנבס הקטן, אז כמעט בחינם
  if(e.calm&&(RM||typeof fxLess==='function'&&fxLess()))return;
  if(e.layer){if(FXW.wxl.has('gust')||FXW.n>=FXW.cap)return;const f=fxMake(e.id,0,0,{follow:FXW.cam,size:Math.max(W_(),H_())*1.15,alpha:e.a,add:!!e.add,fps:e.fps,loop:!!e.dur,dur:e.dur||0});if(!f)return;FXW.wxl.set('gust',f);return}
  const p=fxwAt(e);if(!p)return;
  const size=e.size<=3?e.size*W_():e.size,a=e.dawn?e.dawn[fxwDawn()?0:1]:e.a;
  const h=fxwPlay(e.id,p.x,p.y,{size,alpha:a,add:!!e.add,dur:e.dur||0,loop:!!e.dur,fps:e.fps,vx:e.vx?e.vx*(Math.random()<0.5?-1:1):0});
  if(h)h.scene=1;
}
// מצב על הגיבור: קטן, מעל הראש, לכל היותר פעם ב-gap
function fxwStatus(id){const St=FXW.status,now=fxNowT();if(now-(FXW.stT[id]||-99)<St.gap)return;FXW.stT[id]=now;fxwPlay(id,P.x,P.y,{follow:P,dy:-St.up,size:St.size,alpha:St.a})}
function fxwMore(dt,reg){
  // שובל על הנפה: P.sw.anim קופץ ל-0.2 בכל מכה (combat.js), רק עם נשק קרוב
  const a=P.sw?P.sw.anim:0;if(P.weapon==='sword'&&a>FXW.swA+0.05&&S.mode==='play')fxwSwing();FXW.swA=a;
  if(!S.wd)return;
  if((FXW.sceneT-=dt)<=0){FXW.sceneT=rand(...FXW.scene.every);fxwScene(reg)}
  // עם הליבה (7.11): סופת השלג היא מצב storm שלה, בלי משב של FXW
  const Gu=!(typeof wxwCore==='function'&&wxwCore())&&FXW.gust[reg];if(Gu&&(FXW.gustT-=dt)<=0){FXW.gustT=rand(...Gu.every)+Gu.dur;FXW.gustEnd=fxNowT()+Gu.dur;FXW.t=0}   // משב: הסנכרון הבא מחליף את האריחים, ואחרי dur הם חוזרים
  if(FXW.gustEnd&&fxNowT()>FXW.gustEnd){FXW.gustEnd=0;FXW.t=0}
  const M=typeof TR!=='undefined'&&TR&&TR.map,cw=W_(),ch=H_();
  // גל על החוף: הנקודה הקרובה על שפת המים, אם היא במסך
  if(M&&(M.water&&M.water.length||M.sea)&&(FXW.waveT-=dt)<=0){FXW.waveT=rand(...FXW.wave.every);
    const b=tWaterNear(S.cam.x+rand(-cw*0.4,cw*0.4),S.cam.y+rand(-ch*0.4,ch*0.4));
    if(b&&Math.abs(b.x-S.cam.x)<cw/2&&Math.abs(b.y-S.cam.y)<ch/2)fxwPlay('wt_wave',b.x,b.y,{size:FXW.wave.size,alpha:FXW.wave.a,under:true})}
  // דג קופץ באגם: נקודה במים, רחוק מהשפה
  const J=FXW.jump;if(M&&J.reg[reg]&&(FXW.jumpT-=dt)<=0){FXW.jumpT=rand(...J.every);
    for(let i=0;i<4;i++){const x=S.cam.x+rand(-cw*0.42,cw*0.42),y=S.cam.y+rand(-ch*0.4,ch*0.4);
      if((M.water||[]).some(Wp=>inPoly(x,y,Wp)&&polyDist(x,y,Wp)>J.edge)||M.sea&&tB(M).every(B=>!inPoly(x,y,B)&&polyDist(x,y,B)>J.edge)){fxwPlay('wt_jump',x,y,{size:J.size,alpha:J.a,under:true});break}}}   // במים של האגם, או בים שמחוץ לגבול
}
// פעמיים-שלוש בשנייה (עם fxwSync): יער ליד המצלמה, מקורות שצמחו מחדש, ומצבים על הגיבור
function fxwSlow(){
  FXW.forest=fxwForestNear();
  if(S.wd&&S.nd){const cw=W_(),ch=H_();for(const n of S.nd.list){
    if(n.dead){FXW.dead.add(n);continue}
    if(FXW.dead.delete(n)&&Math.abs(n.x-S.cam.x)<cw/2&&Math.abs(n.y-S.cam.y)<ch/2)fxwPlay('pl_regrow',n.x,n.y-10,{size:FXW.regrow.size,alpha:0.95})}}
  const hp=P.hp;if(FXW.hp!==null&&hp>FXW.hp+FXW.status.heal&&hp<P.maxHp)fxwStatus('st_regen');FXW.hp=hp;
  if(P.raging||P.fury>0||P.swapBuff>0)fxwStatus('st_atkup');
  if(P.lockDef>0||P.rooted)fxwStatus('st_defup');
}

// ריכוך שוליים: עותק של הגיליון בקנבס, וכל פריים מוכפל במסכה עגולה שדועכת לאפס בשוליים. fxImg מחזיר את הקנבס במקום התמונה
function fxwSoft(){
  for(const id of FXW.soft.ids){if(FXW.softDone[id])continue;const im=FXLIB.img[id],D=typeof FXDATA!=='undefined'&&FXDATA[id];
    if(!D||!im||!im.complete||!im.naturalWidth)continue;FXW.softDone[id]=1;
    const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.drawImage(im,0,0);
    g.globalCompositeOperation='destination-in';const h=D.s/2;
    for(let k=0;k<D.c*D.r;k++){const x=(k%D.c)*D.s+h,y=Math.floor(k/D.c)*D.s+h,gr=g.createRadialGradient(x,y,h*FXW.soft.inner,x,y,h);
      gr.addColorStop(0,'#000');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-h,y-h,D.s,D.s)}
    c.complete=true;c.naturalWidth=c.width;FXLIB.img[id]=c}
}

/* מזג אוויר על כל המסך (אריחי FXW.weather והבזק הברק): הציור עולה לפי השטח, ואריח כזה הוא כמעט מסך שלם.
   שכבה אחת: מצוירת ישר. שתיים או יותר (רכס בלילה: שלג וזוהר, סערה בזמן הבזק): לקנבס קטן (wxK מהרזולוציה, רבע מהפיקסלים)
   ומשם מתיחה אחת למסך, כך שכל השכבות יחד עולות קצת יותר ממסך אחד ולא מסך לכל שכבה */
function fxwWxOne(g,f,now){
  const i=fxFrame(f,now);if(i<0)return false;const im=fxImg(f.id);if(!im)return true;
  const D=f.D,age=now-f.t0,o=f.follow||f,x=o.x+f.dx+f.vx*age,y=o.y+f.dy+f.vy*age,z=f.size;
  g.globalAlpha=f.alpha;g.globalCompositeOperation=f.add?'lighter':'source-over';
  g.save();g.translate(x,y);if(f.flip)g.scale(-1,1);g.drawImage(im,(i%D.c)*D.s,Math.floor(i/D.c)*D.s,D.s,D.s,-z/2,-z/2,z,z);g.restore();return true;
}
function fxwWxDraw(){
  if(!FXW.wxl.size||!fxwOn())return;
  const now=fxNowT(),L=[...FXW.wxl];
  const ids=new Set();for(const [,f] of L)ids.add(f.id);
  if(ids.size<2){ctx.save();for(const [k,f] of L)if(!fxwWxOne(ctx,f,now))FXW.wxl.delete(k);ctx.restore();return}
  const cv=ctx.canvas,K=FXW.wxK,w=Math.max(1,Math.round(cv.width*K)),h=Math.max(1,Math.round(cv.height*K));
  let c=FXW.wxc;if(!c){c=FXW.wxc=document.createElement('canvas')}if(c.width!==w||c.height!==h){c.width=w;c.height=h}
  const g=c.getContext('2d'),m=ctx.getTransform();
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,h);g.setTransform(m.a*K,m.b*K,m.c*K,m.d*K,m.e*K,m.f*K);
  for(const [k,f] of L)if(!fxwWxOne(g,f,now))FXW.wxl.delete(k);
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.drawImage(c,0,0,cv.width,cv.height);ctx.restore();
}

// טעינה מראש של מה שיופיע במקום הזה, כדי שאפקט ראשון (קונפטי, חותמת) לא יפספס את תחילתו
function fxwPreload(reg){if(typeof fxPreload!=='function')return;const A=FXW.amb[reg]||{day:[],night:[]};
  fxPreload(['emote_heart','emote_idea','emote_dots','stamp_done','hearts','win_confetti','balloons','pickup_coin','pickup_gem','pickup_chest','mm_ping',
    'waypoint','quest_mark',...(FXW.shore.reg[reg]?FXW.shore.ids:[]),FXW.step.ground[reg]||FXW.step.def,FXW.step.water,'lava_bubble',...A.day,...A.night,...(FXW.scene[reg]||[]).map(e=>e.id),...FXW.scene.forest.map(e=>e.id),'wt_wave','wt_jump','wt_droplet','hit_water','pl_regrow','st_regen','st_atkup','st_defup','wx_flash',
    ...(P&&P.sw&&P.weapon==='sword'?[fxwTrailId(FXW.trail.kind[P.wt]||'slash',P.dt&&P.dt.sword)]:[]),...(FXW.weather[reg]||[]).map(w=>w[0])])}
// הסימנים שהציור הקיים כבר חישב: v בכפר (drawQuestMarks), w בעולם (drawWnpcScreen)
function fxwMarks(mark,where){FXW.marks[where]=mark}

/* ---- אירועים ---- */
// חגיגה (celebrate ב-fx.js): קונפטי או בלונים, רק בכפר ובעולם
function fxwCelebrate(x,y,kind){
  const p=FXW.party[kind];if(!p||!fxwOn())return;
  if(kind==='rank'){fxwPlay('balloons',x,y-30,{size:p[1],vy:-45,dur:2});fxwPlay('win_confetti',x,y-60,{size:190});return}
  fxwPlay(p[0],x,y-60,{size:p[1]});
}
// מפה קטנה: פינג כשמשהו חדש מופיע (דמות שנמצאה, אבן מסע שנפתחה, מקום של קווסט)
function fxwPingNow(){FXW.pingT=fxNowT()}
function fxwNews(){
  if(!S.wd)return;
  const k=Object.keys(SAVE.met||{}).length+'|'+(typeof wsOpenAll==='function'?wsOpenAll().length:0)+'|'+(typeof sqTargets==='function'?sqTargets().length:0);
  const n=k.split('|').map(Number);if(FXW.seen&&n.some((v,i)=>v>FXW.seen[i]))fxwPingNow();FXW.seen=n;   // רק כשמשהו נוסף, לא כשנעלם
}
// הדמות שמדברת: בכפר או בעולם
const fxwNpc=id=>S.vil?(typeof npcAt==='function'?npcAt(id):null):S.wd&&S.wd.npc?S.wd.npc[id]:null;
function fxwEmote(id){
  const n=fxwNpc(id);if(!n)return;const E=FXW.emote,m=(FXW.marks[S.vil?'v':'w']||{})[id];
  fxwPlay(m==='✓'?E.ready:m?E.open:E.idle,n.x,n.y,{follow:n,dy:-E.up,dx:E.dx,size:E.size,dur:E.dur});
}

/* ---- עטיפות מבחוץ: הפונקציה המקורית רצה כמו שהיא, והאפקט אחריה ---- */
(()=>{
  const wrap=(name,after)=>{const old=window[name];if(typeof old!=='function')return;window[name]=function(){const r=old.apply(this,arguments);try{after(r,...arguments)}catch(e){}return r}};
  // מזג האוויר מצויר אחרי כל האפקטים של העולם (render.js קורא fxDraw() פעם אחת בעולם ובכפר)
  // 7.11 (WXW): מזג האוויר מתחת לאפקטים, לניצוצות ולמספרי הנזק (juiceDraw ב-render.js רץ לפניהם), ולא מעליהם. מחוץ לעולם ולכפר: wxwLeave
  {const old=window.juiceDraw;if(typeof old==='function')window.juiceDraw=function(){try{if(fxwOn())fxwWxDraw();else if(typeof wxwLeave==='function')wxwLeave()}catch(e){}return old.apply(this,arguments)}}
  const talkFx=(r,id)=>{if(id&&fxwOn())fxwEmote(id)};
  // סקיל מסתובב (מערבולת): tr_spin בצבע הסקיל כל זמן שהוא פועל. שריון קרח: הגנה עולה (wskbook.js)
  wrap('wsbCast',(r,id,D)=>{if(!D||!fxwOn())return;
    if(FXW.trail.spin[id]){const h=fxwPlay(fxwTrailId('spin',D.dt),P.x,P.y,{follow:P,dy:FXW.trail.dy,size:(D.r||80)*FXW.trail.spinSize,alpha:0.9,add:true,loop:true,dur:D.t||1});if(h)h.trail=1}
    if(D.kind==='guard')fxwStatus('st_defup')});
  wrap('npcTalk',talkFx);wrap('wnpcTalk',talkFx);
  // קווסט שנמסר: חותמת "בוצע" מעל מי שנתן אותו, או מעל הגיבור
  wrap('questClaim',(r,id)=>{if(r===false||!fxwOn())return;const q=typeof QBY!=='undefined'&&QBY[id],n=q&&q.giver&&fxwNpc(q.giver),o=n||P;
    fxwPlay('stamp_done',o.x,o.y,{follow:o,dy:-FXW.stamp.up,size:FXW.stamp.size})});
  // איסוף שלל ביד (לא איסוף אוטומטי): מטבע, אבן חן או ציוד
  wrap('dropTake',(r,d,auto)=>{if(auto||!d||!fxwOn())return;const now=fxNowT();if(now-FXW.pickT<FXW.pick.gap)return;
    const id=d.r==='coins'?'pickup_coin':(typeof dropGear==='function'&&dropGear(d.r))||(typeof dropRar==='function'&&dropRar(d.r)>=2)?'pickup_gem':null;
    if(id){FXW.pickT=now;fxwPlay(id,P.x,P.y,{follow:P,dy:-34,size:FXW.pick.size})}});
  // תיבה שנפתחה בעולם
  wrap('nodeDown',(r,n)=>{if(n&&S.wd&&typeof NODES!=='undefined'&&NODES.kinds[n.kind]&&NODES.kinds[n.kind].shape==='chest')fxwPlay('pickup_chest',n.x,n.y-20,{size:FXW.pick.size*1.6})});
  // הפינג במפה הקטנה: מצויר בתוך הקנבס שלה, מעל הנקודה של הגיבור (המפה הקטנה היא אלמנט נפרד מעל המשחק)
  wrap('mmDraw',()=>{if(!FXW.pingT)return;const age=fxNowT()-FXW.pingT;if(age>FXW.ping.dur||typeof fxImg!=='function')return;
    const im=fxImg('mm_ping'),D=typeof FXDATA!=='undefined'&&FXDATA.mm_ping;if(!im||!D)return;
    const c=$('mmC'),x=c.getContext('2d'),s=c.clientWidth||64,i=Math.min(D.n-1,Math.floor(age/FXW.ping.dur*D.n)),z=s*FXW.ping.size;
    x.save();x.globalCompositeOperation='lighter';x.drawImage(im,(i%D.c)*D.s,Math.floor(i/D.c)*D.s,D.s,D.s,s/2-z/2,s/2-z/2,z,z);x.restore()});
})();
