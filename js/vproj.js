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
    cutterShop:{who:'cutter',icon:'🏗️',stages:[{stone:20},{stone:40,wood:15},{copper:6,coins:30}],get:{iron:3},opens:'deepQuarry'},
    // צוות הכורתים (ניר אישר 11.11, docs/concept-village-region.md): של מבנה ולא של תושבת. bld/lv: נפתח כשהמבנה ברמה הזו.
    // spot: איפה המחנה בכפר (ליד המנסרה). make: אחרי שנגמר, המבנה מייצר יותר (vpMake ← vSettle ב-village.js)
    roadCrew:{bld:'mill',lv:3,icon:'🪓',stages:[{wood:40},{wood:80,stone:30},{wood:120,copper:8,coins:60}],opens:'lakeRoad',spot:{x:-420,y:190},make:{mill:{wood:1.1}}}
  },
  // reg: באיזה אזור. lv: נפתח גם מהרמה הזו. rubble: איפה המפולת עד שנפתח. fields: כמו WORLD.regions[..].fields, עם regrow מהיר
  places:{
    deepQuarry:{reg:'meadow',lv:10,rubble:{x:2560,y:-980},
      fields:[{kind:'rock',n:5,x:2720,y:-860,r:150,regrow:30},{kind:'iron',n:2,x:2620,y:-760,r:90,regrow:30},{kind:'silver',n:1,x:2840,y:-760,r:60,regrow:30}]},
    // path: הדרך לאזור (WORLD.paths) שנפתחת גם מהפרויקט (open ב-world.js). בלי lv: רק הפרויקט או העלילה.
    // near: הרגע ("הדרך פתוחה!") קורה בפעם הראשונה שמגיעים עד כאן מהדרך, כדי שהשחקן יראה את המקום
    lakeRoad:{reg:'meadow',path:'lake',near:560}
  },
  // הסדנה בכפר, ליד הבית של התושבת: dx/dy מהבית. בתלת-ממד: ערימת אבן, פיגום, ואז מבנה המכרה עם דגל
  look:{dx:115,dy:-25,w3d:[60,120,110]},   // בצד המזרחי של האוהל, רחוק מהמכרה האמיתי ומהדרך
  stat:{build:0,open:0,nodes:0,out:0}
};
const VPS=()=>SAVE.vproj||(SAVE.vproj={st:{},seen:{}});
const vpStage=id=>VPS().st[id]||0;                       // כמה שלבים כבר נבנו
const vpDone=id=>vpStage(id)>=VPROJ.list[id].stages.length;
const vpCost=id=>vpDone(id)?null:VPROJ.list[id].stages[vpStage(id)];
const vpName=id=>T('vp.'+id);
// אפשר לבנות רק כשהתושבת בכפר, או כשהמבנה ברמה (צוות הכורתים)
const vpHere=id=>{const P0=VPROJ.list[id];return P0.bld?vLv(P0.bld)>=P0.lv:typeof resMoved==='function'&&resMoved(P0.who)};
// איפה הפרויקט בכפר: ליד הבית של התושבת, או במקום משלו
function vpSpot(id){const P0=VPROJ.list[id];if(P0.spot)return P0.spot;const R=RESID.list[P0.who],L=VPROJ.look;return {x:R.house.x+L.dx,y:R.house.y+L.dy}}
// כמה המבנה מייצר מהמשאב אחרי שהפרויקט שלו נגמר (vSettle ב-village.js)
function vpMake(k,r){let m=1;for(const id in VPROJ.list){const M=VPROJ.list[id].make;if(M&&M[k]&&M[k][r]&&vpDone(id))m*=M[k][r]}return m}
// הפרויקט של תושבת (לפי id ב-RESID.list), או null
function vpOf(who){for(const id in VPROJ.list)if(VPROJ.list[id].who===who)return id;return null}
// ההחלפה של התושבת אחרי שהסדנה נגמרה (resGet ב-residents.js), או null
function vpGet(who){const id=vpOf(who);return id&&vpDone(id)?VPROJ.list[id].get:null}
// הפרויקט שפותח דרך לאזור k (WORLD.paths), או null. לשלט של curiosity.js
function vpForPath(k){for(const pl in VPROJ.places)if(VPROJ.places[pl].path===k)for(const id in VPROJ.list)if(VPROJ.list[id].opens===pl)return id;return null}
// מקום פתוח: הפרויקט נגמר או שהרמה מספיקה
function vpOpen(pl){const P0=VPROJ.places[pl];if(!P0)return false;
  for(const id in VPROJ.list)if(VPROJ.list[id].opens===pl&&vpDone(id))return true;
  return P0.lv!=null&&heroLv()>=P0.lv}

/* ---- בכפר: לשונית בשיחה עם התושבת ---- */
function vpBlock(id){if(!vpHere(id))return 'away';if(vpDone(id))return 'done';const c=vpCost(id);for(const r in c)if(!bagHas(r,c[r]))return 'cost';return null}
function vpBuild(id){
  if(vpBlock(id))return false;const c=vpCost(id);for(const r in c)bagTake(r,c[r]);
  VPS().st[id]=vpStage(id)+1;VPROJ.stat.build++;saveNow();
  const {x,y}=vpSpot(id);
  celebrate(x,y,'upgrade','+1');sfx('celebrate');if(S.vil&&R3D.vil)R3D.vil.vpAt=-1;   // בתלת-ממד: לבנות מחדש את הסדנה
  if(vpDone(id)){const pl=VPROJ.list[id].opens,P1=VPROJ.places[pl];
    if(P1.path&&wPathOpen(WORLD.paths[P1.path])&&storyOpen('earth'))VPS().seen[pl]=1;   // הדרך כבר פתוחה מהעלילה: אין רגע בעולם
    if(P1.path)VPROJ.stat.out++;   // הצוות יצא לדרך (לבדיקה)
    banner(T(P1.path?'vp.crewOut':'vp.done',vpName(id),T('vp.pl.'+pl)),C.gold);saveNow()}
  else banner(vpName(id)+' · '+T('vp.stage',vpStage(id),VPROJ.list[id].stages.length),C.gold);
  return true;
}
// הלשונית (npcSvcs ב-bwin.js): שלב, מחיר, כפתור, 📌 ומה זה פותח
function vpTab(who){const id=vpOf(who);return id&&vpHere(id)?vpTabOf(id):null}
// במבנה (bwBuilding ב-bwin.js): הלשונית מופיעה מרמה 1, ועד הרמה של הפרויקט היא אומרת מתי הוא נפתח
function vpBldTab(k){
  for(const id in VPROJ.list){const P0=VPROJ.list[id];if(P0.bld!==k||vLv(k)<1)continue;
    if(vpHere(id))return vpTabOf(id);
    return {id:'proj',label:'🔒 '+vpName(id),html:()=>'<div class="fcook rserve"><p class="bwlead">'+T('vp.'+id+'.d',T('vp.pl.'+P0.opens))+'</p><p class="bwbad">🔒 '+T('vp.atLv',T('vil.'+k),P0.lv)+'</p></div>'}}
  return null;
}
function vpTabOf(id){
  const P0=VPROJ.list[id],n=P0.stages.length;
  return {id:'proj',label:P0.icon+' '+vpName(id),dot:!vpDone(id)&&!vpBlock(id),html:()=>{
    let h='<div class="fcook rserve"><p class="bwlead">'+T('vp.'+id+'.d',T('vp.pl.'+P0.opens),VPROJ.places[P0.opens].lv)+'</p>';
    h+='<p class="vpst">'+Array.from({length:n},(_,i)=>'<i'+(i<vpStage(id)?' class="on"':'')+'></i>').join('')+' <b>'+T('vp.stage',vpStage(id),n)+'</b></p>';
    if(vpDone(id))return h+'<p class="next">✓ '+(P0.get?T('vp.isDone',T('vp.pl.'+P0.opens),Object.values(P0.get)[0]):T('vp.'+id+'.done',T('vp.pl.'+P0.opens)))+'</p></div>';
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
    if(P0.path){vpRoad(pl,P0);continue}
    if(!S.nd.list.some(n=>n.vp===pl)){const add=wNodes(P0.fields,'vp_'+pl+'_');add.forEach(n=>n.vp=pl);S.nd.list.push(...add);VPROJ.stat.nodes+=add.length}
    if(!VPS().seen[pl]){VPS().seen[pl]=1;VPROJ.stat.open++;saveNow();const r=P0.rubble;
      celebrate(r.x,r.y,'quest','⛏️');sparks(r.x,r.y,C.gold,24,220);banner(T('vp.open',T('vp.pl.'+pl)),C.gold)}}
}
// הדרך שהצוות פינה: בפעם הראשונה שמגיעים קרוב, חגיגה. אם העלילה כבר פתחה אותה, בשקט (נרשם ב-vpBuild)
function vpRoad(pl,P0){
  if(VPS().seen[pl])return;const p=WORLD.paths[P0.path];if(Math.hypot(P.x-p.x,P.y-p.y)>P0.near)return;
  VPS().seen[pl]=1;VPROJ.stat.open++;saveNow();
  celebrate(p.x,p.y,'quest','🪓');sparks(p.x,p.y,C.gold,24,220);sfx('celebrate');banner(T('vp.roadOpen',T('w.region.'+P0.path)),C.gold);
}
// המפולת, עד שנפתח (בשני המצבים: בתלת-ממד היא מעל השכבה, כמו המכשולים של curiosity.js)
function vpDraw(){
  if(!S.wd)return;
  for(const pl in VPROJ.places){const P0=VPROJ.places[pl];if(P0.reg!==S.wd.reg)continue;
    if(P0.path){if(vpOpen(pl))vpStump(WORLD.paths[P0.path]);continue}   // בול העץ (curiosity.js) נעלם עם הדרך, ובמקומו גדם
    if(vpOpen(pl))continue;const r=P0.rubble;
    cuObstacle('rock',r.x-26,r.y+8);cuObstacle('rock',r.x+30,r.y-6)}
}
// מה שהצוות השאיר: גדם עם טבעות, ושני חלקי הגזע בצד הדרך
function vpStump(p){
  const x=p.x+70,y=p.y+40,c=ctx;c.save();c.strokeStyle=C.ink;c.lineWidth=2;
  c.fillStyle='rgba(5,7,13,0.3)';c.beginPath();c.ellipse(x,y+8,26,8,0,0,7);c.fill();
  c.fillStyle='#6B4A2B';c.fillRect(x-16,y-12,32,18);c.strokeRect(x-16,y-12,32,18);
  c.fillStyle='#C9A26B';c.beginPath();c.ellipse(x,y-12,16,6,0,0,7);c.fill();c.stroke();
  c.strokeStyle='#8A6A44';c.beginPath();c.ellipse(x,y-12,7,2.6,0,0,7);c.stroke();
  c.strokeStyle=C.ink;for(const [dx,dy] of [[-58,18],[46,26]]){c.fillStyle='#6B4A2B';c.beginPath();c.roundRect(x+dx-22,y+dy-7,44,14,7);c.fill();c.stroke();
    c.fillStyle='#C9A26B';c.beginPath();c.ellipse(x+dx+22,y+dy,4,7,0,0,7);c.fill();c.stroke()}
  c.restore();
}

/* ---- בכפר: הסדנה ליד הבית, לפי השלב ---- */
function vpDraw2d(){
  if(!S.vil||R3D.on)return;const L=VPROJ.look;
  for(const id in VPROJ.list){const st=vpStage(id);if(!st||!vpHere(id))continue;const {x,y}=vpSpot(id);
    if(VPROJ.list[id].bld){vpCamp2d(x,y,st);continue}
    ctx.fillStyle='rgba(5,7,13,0.4)';ctx.beginPath();ctx.ellipse(x,y+6,34,10,0,0,7);ctx.fill();
    ctx.fillStyle='#8A8F9E';for(let i=0;i<3;i++)ctx.fillRect(x-22+i*15,y-8,13,12);   // שלב 1: אבני יסוד
    if(st>=2){ctx.strokeStyle='#7A5230';ctx.lineWidth=3;ctx.strokeRect(x-24,y-44,48,38)}   // שלב 2: פיגום
    if(st>=3){ctx.fillStyle='#9AA0B0';ctx.fillRect(x-24,y-40,48,34);ctx.strokeStyle='#4A3220';ctx.lineWidth=4;
      ctx.beginPath();ctx.moveTo(x+18,y-40);ctx.lineTo(x+18,y-74);ctx.lineTo(x-14,y-74);ctx.stroke()}}   // שלב 3: מבנה ומנוף
}
// מחנה הכורתים: 1 אוהל וערימת בולים, 2 עגלה עם חבלים, 3 דגל ועוד ערימה
function vpCamp2d(x,y,st){
  const c=ctx;c.save();c.strokeStyle=C.ink;c.lineWidth=2;
  c.fillStyle='rgba(5,7,13,0.4)';c.beginPath();c.ellipse(x,y+8,60,14,0,0,7);c.fill();
  c.fillStyle='#B89B6A';c.beginPath();c.moveTo(x-46,y+4);c.lineTo(x-24,y-30);c.lineTo(x-2,y+4);c.closePath();c.fill();c.stroke();   // אוהל
  const logs=(lx,ly)=>{c.fillStyle='#6B4A2B';for(let i=0;i<3;i++){c.beginPath();c.roundRect(lx-18+(i%2)*6,ly-i*7,36,7,3);c.fill();c.stroke()}};
  logs(x+28,y);
  if(st>=2){c.fillStyle='#8A5A30';c.fillRect(x-8,y+10,40,12);c.strokeRect(x-8,y+10,40,12);   // עגלה
    c.fillStyle='#3A2A1A';for(const wx of [x,x+26]){c.beginPath();c.arc(wx,y+24,6,0,7);c.fill()}}
  if(st>=3){logs(x+60,y+14);c.strokeStyle='#4A3220';c.lineWidth=3;c.beginPath();c.moveTo(x-50,y+6);c.lineTo(x-50,y-44);c.stroke();
    c.fillStyle=C.gold;c.beginPath();c.moveTo(x-50,y-44);c.lineTo(x-30,y-38);c.lineTo(x-50,y-32);c.closePath();c.fill()}
  c.restore();
}
function vpSync3d(){
  const V=R3D.vil;if(!V)return;const H=V.vpH||(V.vpH={});
  for(const id in VPROJ.list){const st=vpHere(id)?vpStage(id):0;if(H[id]&&H[id].st===st&&V.vpAt!==-1)continue;
    if(H[id])for(const o of H[id].obj)V.g.remove(o);H[id]={st,obj:[]};if(!st)continue;
    const {x,y}=vpSpot(id),L=VPROJ.look,w=L.w3d[st-1],o=H[id].obj,D=VIL3D.deco;
    if(VPROJ.list[id].bld){   // מחנה הכורתים
      o.push(vPut(D.tent.model,x-30,y,D.tent.w),vPut(D.lumber.model,x+30,y,D.lumber.w));
      if(st>=2)o.push(vPut(D.barrel.model,x-5,y+30,D.barrel.w),vPut(D.crate.model,x+20,y+35,D.crate.w),vPut(D.lumber.model,x+60,y+20,D.lumber.w,0.6));
      if(st>=3)o.push(vPut(D.flag.model,x-60,y-10,D.flag.w),vPut(D.lumber.model,x+40,y-30,D.lumber.w,1.2));
      continue}
    if(st===1)o.push(vPut(VIL3D.stock.mine.model,x,y,w));
    else if(st===2){o.push(vPut(VIL3D.site.model,x,y,w));o.push(vPut(VIL3D.stock.mine.model,x+60,y+20,50))}
    else{o.push(vPut(VIL3D.models.mine.model,x,y,w));o.push(vPut(VIL3D.deco.flag.model,x+50,y-30,VIL3D.deco.flag.w));o.push(vPut(VIL3D.stock.mine.model,x+60,y+30,50))}}
  V.vpAt=0;
}
