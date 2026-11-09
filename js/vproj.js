/* פרויקטים בכפר (VPROJ, ניר 9.11.2026, docs/concept-village-loop.md פרק 2): לולאה ראשונה, אבן.
   החוצבת (residents.js) עברה לגור בכפר → בונים איתה "סדנת החוצבת" בשלושה שלבים שרואים (ערימת אבן, פיגום, מבנה) →
   הצוות שלה מפנה את המפולת במחצבה, ונפתחת "המחצבה העמוקה" באחו: שדה צפוף של סלעים, ברזל ועורק כסף, שצומח מחדש מהר יותר.
   המחצבה העמוקה נפתחת גם ברמה lv, מה שקודם (ליד הרמה והעלילה, כמו ב-curiosity.js). השערים של האזורים לא משתנים.
   גם ההחלפה של החוצבת משתפרת (get). פרויקט חדש = שורה ב-list, ומקום חדש = שורה ב-places, בלי לגעת בלוגיקה.
   הטקסטים ב-lang.js תחת 'vp.'. נשמר ב-SAVE.vproj ({st:{cutterShop:2}, seen:{deepQuarry:1}}).
   חיבורים: vpTab מ-npcSvcs (bwin.js), vpAct מהשיחה (npc.js), vpGet מ-residents.js, vpUpdate (מוסיף את המקורות דרך wNodes) ו-vpDraw מ-world.js,
   vpDraw2d/vpSync3d בכפר (residents.js), vpCost/vpName ליעד (goal.js) */
const VPROJ={
  list:{
    // who: התושבת שבונים איתה (RESID.list). stages: המחיר של כל שלב. get: ההחלפה שלה אחרי הסדנה. opens: איזה מקום נפתח
    cutterShop:{who:'cutter',icon:'🏗️',stages:[{stone:20},{stone:40,wood:15},{copper:6,coins:30}],get:{iron:3},opens:'deepQuarry'}
  },
  // reg: באיזה אזור. lv: נפתח גם מהרמה הזו. rubble: איפה המפולת עד שנפתח. fields: כמו WORLD.regions[..].fields, עם regrow מהיר
  places:{
    deepQuarry:{reg:'meadow',lv:10,rubble:{x:2560,y:-980},
      fields:[{kind:'rock',n:5,x:2720,y:-860,r:150,regrow:30},{kind:'iron',n:2,x:2620,y:-760,r:90,regrow:30},{kind:'silver',n:1,x:2840,y:-760,r:60,regrow:30}]}
  },
  // הסדנה בכפר, ליד הבית של התושבת: dx/dy מהבית. בתלת-ממד: ערימת אבן, פיגום, ואז מבנה המכרה עם דגל
  look:{dx:115,dy:-25,w3d:[60,120,110]},   // בצד המזרחי של האוהל, רחוק מהמכרה האמיתי ומהדרך
  stat:{build:0,open:0,nodes:0}
};
const VPS=()=>SAVE.vproj||(SAVE.vproj={st:{},seen:{}});
const vpStage=id=>VPS().st[id]||0;                       // כמה שלבים כבר נבנו
const vpDone=id=>vpStage(id)>=VPROJ.list[id].stages.length;
const vpCost=id=>vpDone(id)?null:VPROJ.list[id].stages[vpStage(id)];
const vpName=id=>T('vp.'+id);
const vpHere=id=>typeof resMoved==='function'&&resMoved(VPROJ.list[id].who);   // אפשר לבנות רק כשהתושבת בכפר
// הפרויקט של תושבת (לפי id ב-RESID.list), או null
function vpOf(who){for(const id in VPROJ.list)if(VPROJ.list[id].who===who)return id;return null}
// ההחלפה של התושבת אחרי שהסדנה נגמרה (resGet ב-residents.js), או null
function vpGet(who){const id=vpOf(who);return id&&vpDone(id)?VPROJ.list[id].get:null}
// מקום פתוח: הפרויקט נגמר או שהרמה מספיקה
function vpOpen(pl){const P0=VPROJ.places[pl];if(!P0)return false;
  for(const id in VPROJ.list)if(VPROJ.list[id].opens===pl&&vpDone(id))return true;
  return heroLv()>=P0.lv}

/* ---- בכפר: לשונית בשיחה עם התושבת ---- */
function vpBlock(id){if(!vpHere(id))return 'away';if(vpDone(id))return 'done';const c=vpCost(id);for(const r in c)if(!bagHas(r,c[r]))return 'cost';return null}
function vpBuild(id){
  if(vpBlock(id))return false;const c=vpCost(id);for(const r in c)bagTake(r,c[r]);
  VPS().st[id]=vpStage(id)+1;VPROJ.stat.build++;saveNow();
  const R=RESID.list[VPROJ.list[id].who],L=VPROJ.look,x=R.house.x+L.dx,y=R.house.y+L.dy;
  celebrate(x,y,'upgrade','+1');sfx('celebrate');if(S.vil&&R3D.vil)R3D.vil.vpAt=-1;   // בתלת-ממד: לבנות מחדש את הסדנה
  if(vpDone(id)){const pl=VPROJ.list[id].opens;banner(T('vp.done',vpName(id),T('vp.pl.'+pl)),C.gold)}
  else banner(vpName(id)+' · '+T('vp.stage',vpStage(id),VPROJ.list[id].stages.length),C.gold);
  return true;
}
// הלשונית (npcSvcs ב-bwin.js): שלב, מחיר, כפתור, 📌 ומה זה פותח
function vpTab(who){
  const id=vpOf(who);if(!id||!vpHere(id))return null;const P0=VPROJ.list[id],n=P0.stages.length;
  return {id:'proj',label:P0.icon+' '+vpName(id),html:()=>{
    let h='<div class="fcook rserve"><p class="bwlead">'+T('vp.'+id+'.d',T('vp.pl.'+P0.opens),VPROJ.places[P0.opens].lv)+'</p>';
    h+='<p class="vpst">'+Array.from({length:n},(_,i)=>'<i'+(i<vpStage(id)?' class="on"':'')+'></i>').join('')+' <b>'+T('vp.stage',vpStage(id),n)+'</b></p>';
    if(vpDone(id))return h+'<p class="next">✓ '+T('vp.isDone',T('vp.pl.'+P0.opens),Object.values(P0.get)[0])+'</p></div>';
    const why=vpBlock(id);
    h+='<div class="bwpay"><span class="sk">'+T('bw.price')+'</span>'+bwCost(vpCost(id))+'</div>';
    h+='<div class="gbtns"><button class="vbtn vmain" data-act="vp" data-k="'+id+'"'+(why?' disabled':'')+'>'+(why==='cost'?T('bw.missing'):T('vp.build',vpStage(id)+1))+'</button>'+goalPinBtn({p:id},'pinP')+'</div>';
    return h+'</div>'}};
}
function vpAct(b){
  if(b.dataset.act==='vp')return vpBuild(b.dataset.k)||true;
  if(b.dataset.act==='pinP'){goalPin({p:b.dataset.k});return true}
  return false;
}

/* ---- בעולם: המחצבה העמוקה ---- */
// כל חצי שנייה בעולם: מקום שנפתח עכשיו (רמה בזמן המשחק) מקבל את המקורות שלו מיד, ובפעם הראשונה חגיגה
const VPW={t:0};
function vpUpdate(dt){
  if(!S.wd||S.room||(VPW.t-=dt)>0)return;VPW.t=0.5;
  for(const pl in VPROJ.places){const P0=VPROJ.places[pl];if(P0.reg!==S.wd.reg||!vpOpen(pl))continue;
    if(!S.nd.list.some(n=>n.vp===pl)){const add=wNodes(P0.fields,'vp_'+pl+'_');add.forEach(n=>n.vp=pl);S.nd.list.push(...add);VPROJ.stat.nodes+=add.length}
    if(!VPS().seen[pl]){VPS().seen[pl]=1;VPROJ.stat.open++;saveNow();const r=P0.rubble;
      celebrate(r.x,r.y,'quest','⛏️');sparks(r.x,r.y,C.gold,24,220);banner(T('vp.open',T('vp.pl.'+pl)),C.gold)}}
}
// המפולת, עד שנפתח (בשני המצבים: בתלת-ממד היא מעל השכבה, כמו המכשולים של curiosity.js)
function vpDraw(){
  if(!S.wd)return;
  for(const pl in VPROJ.places){const P0=VPROJ.places[pl];if(P0.reg!==S.wd.reg||vpOpen(pl))continue;const r=P0.rubble;
    cuObstacle('rock',r.x-26,r.y+8);cuObstacle('rock',r.x+30,r.y-6)}
}

/* ---- בכפר: הסדנה ליד הבית, לפי השלב ---- */
function vpDraw2d(){
  if(!S.vil||R3D.on)return;const L=VPROJ.look;
  for(const id in VPROJ.list){const st=vpStage(id);if(!st||!vpHere(id))continue;const R=RESID.list[VPROJ.list[id].who],x=R.house.x+L.dx,y=R.house.y+L.dy;
    ctx.fillStyle='rgba(5,7,13,0.4)';ctx.beginPath();ctx.ellipse(x,y+6,34,10,0,0,7);ctx.fill();
    ctx.fillStyle='#8A8F9E';for(let i=0;i<3;i++)ctx.fillRect(x-22+i*15,y-8,13,12);   // שלב 1: אבני יסוד
    if(st>=2){ctx.strokeStyle='#7A5230';ctx.lineWidth=3;ctx.strokeRect(x-24,y-44,48,38)}   // שלב 2: פיגום
    if(st>=3){ctx.fillStyle='#9AA0B0';ctx.fillRect(x-24,y-40,48,34);ctx.strokeStyle='#4A3220';ctx.lineWidth=4;
      ctx.beginPath();ctx.moveTo(x+18,y-40);ctx.lineTo(x+18,y-74);ctx.lineTo(x-14,y-74);ctx.stroke()}}   // שלב 3: מבנה ומנוף
}
function vpSync3d(){
  const V=R3D.vil;if(!V)return;const H=V.vpH||(V.vpH={});
  for(const id in VPROJ.list){const st=vpHere(id)?vpStage(id):0;if(H[id]&&H[id].st===st&&V.vpAt!==-1)continue;
    if(H[id])for(const o of H[id].obj)V.g.remove(o);H[id]={st,obj:[]};if(!st)continue;
    const R=RESID.list[VPROJ.list[id].who],L=VPROJ.look,x=R.house.x+L.dx,y=R.house.y+L.dy,w=L.w3d[st-1],o=H[id].obj;
    if(st===1)o.push(vPut(VIL3D.stock.mine.model,x,y,w));
    else if(st===2){o.push(vPut(VIL3D.site.model,x,y,w));o.push(vPut(VIL3D.stock.mine.model,x+60,y+20,50))}
    else{o.push(vPut(VIL3D.models.mine.model,x,y,w));o.push(vPut(VIL3D.deco.flag.model,x+50,y-30,VIL3D.deco.flag.w));o.push(vPut(VIL3D.stock.mine.model,x+60,y+30,50))}}
  V.vpAt=0;
}
