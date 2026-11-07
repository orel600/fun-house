/* שכבת אפקטים לכפר ולעולם (FXW, אוראל 7.11.2026): רק אפקטים מספריית Mochi Lab (fxlib.js) מעל מה שכבר קיים.
   לא משנה מפה, לוגיקה, קווסטים או איזון. אם מוחקים את הקובץ ואת השורות שקוראות לו, הכל עובד כמו קודם.
   מה יש כאן:
   - סימנים מעל דמויות: זוהר npc_quest/npc_turnin מאחורי ה-! וה-✓ הקיימים (לא במקומם), npc_shop מעל הסוחרת, npc_talk מעל מי שקרוב
   - emote_* כשפותחים שיחה, stamp_done כשמוסרים קווסט, hearts כשפיוחו אוכלת, קונפטי ובלונים בחגיגות (celebrate ב-fx.js)
   - אווירה בכפר: עלי כותרת ופרחים ביום, גחליליות בלילה
   - בעולם: מזג אוויר לפי אזור (שכבה עדינה מעל הקנבס של world.js), צעדים לפי הקרקע, אדוות במים רדודים, בועות בבורות הלבה,
     אובך במדבר, waypoint ו-quest_mark על מקום של קווסט צדדי, pickup_* באיסוף, ו-mm_ping במפה הקטנה כשמשהו חדש מופיע
   חיבורים: fxwUpdate ב-villageUpdate וב-worldUpdate, fxwMarks ב-drawQuestMarks (quests.js) וב-drawWnpcScreen (worldnpc.js),
   fxwCelebrate ב-celebrate (fx.js). ועוטף מבחוץ: npcTalk, wnpcTalk, questClaim, dropTake, nodeDown, mmDraw. פיוחו אוכלת: לפי SAVE.pet.fed.
   ביצועים: עד FXW.cap אפקטים משלנו בבת אחת, בתוך FXLIB.max של כל המשחק. סנכרון של אפקטים קבועים פעמיים-שלוש בשנייה, לא בכל פריים */
const FXW={
  on:true,
  cap:24,              // כמה אפקטים של השכבה הזו בבת אחת (מתוך FXLIB.max=70)
  sync:0.3,            // כל כמה שניות מסנכרנים את האפקטים הקבועים (סימנים, מזג אוויר, מקום הקווסט)
  // סימנים מעל דמויות. הסימן הקיים (! או ✓ בעיגול כהה) נשאר, והאפקט זוהר מאחוריו
  mark:{'!':'npc_quest','!!':'npc_quest','✓':'npc_turnin',size:62,alpha:0.8,up:85},
  shop:{ids:['merchant'],near:420,size:46,alpha:0.85,up:70},   // סוחרים בלי קווסט: מטבע קטן מעליהם כשמתקרבים
  talk:{size:42,alpha:0.85,up:62,dx:20},                         // מי שאפשר לדבר איתו עכשיו (כפתור "לדבר" מופיע)
  emote:{ready:'emote_heart',open:'emote_idea',idle:'emote_dots',size:54,dur:1.7,up:64,dx:26},
  stamp:{size:96,up:70},
  hearts:{size:84},
  // חגיגות (fx.js): איזה אפקט נוסף לכל סוג, וגודל
  party:{upgrade:['win_confetti',190],rank:['balloons',130],travel:['win_confetti',170],loot4:['win_confetti',150]},
  // אווירה: כל כמה שניות אפקט רך אחד, עד amb.max בבת אחת. night: לפי השעה (VFX.hour, vfx.js)
  amb:{every:[3,6],max:2,size:170,alpha:0.7,night:[20,6],
    village:{day:['petals','bloom'],night:['fireflies']},
    meadow:{day:['leaves'],night:['fireflies']},
    lake:{day:['fireflies'],night:['fireflies']}},
  // מזג אוויר לפי אזור: [אפקט, שקיפות, איפה]. full: אריחים על כל המסך, sky: פס למעלה, low: חלק תחתון. עובר מעל הקנבס הקיים
  weather:{
    ridge:[['snow',0.45,'full'],['aurora',0.45,'sky']],
    storm:[['rain',0.5,'full']],
    desert:[['haze',0.4,'low']]
  },
  // צעדים: כל step פיקסלים של הליכה. ground: לפי אזור. במים רדודים (tSlow<1): אדווה
  step:{dist:42,size:36,alpha:0.75,ground:{desert:'step_sand',ridge:'step_snow',storm:'water_ripple'},def:'step_dust',water:'water_ripple',waterSize:62},
  lava:{every:[1.1,2.2],size:80,range:520},           // בועות בבורות הלבה במדבר (ponds של אזור עם heat)
  quest:{way:120,mark:56,up:170},                      // מקום של קווסט צדדי (sqTargets ב-questboard.js): טבעת על הרצפה וסימן מעל העמוד
  pick:{size:58,gap:0.15},                             // איסוף: coins → pickup_coin, ציוד ומשאב נדיר → pickup_gem, תיבה → pickup_chest
  ping:{dur:0.7,size:0.95},                            // מפה קטנה: כמה זמן, וגודל ביחס למפה
  // ---- מצב חי ----
  live:new Map(),once:[],cam:{x:0,y:0},t:0,ambT:2,lavaT:1,pickT:0,lx:null,ly:null,reg:'',pingT:0,seen:null,fed:null,marks:{v:null,w:null},n:0
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
  const want=new Map(),M=FXW.mark,cam=FXW.cam,cw=W_(),ch=H_();
  // סימני קווסט: מהסימנים שהציור הקיים חישב (fxwMarks)
  const where=S.vil?'v':'w',marks=FXW.marks[where]||{};
  const at=id=>S.vil?(typeof npcAt==='function'?npcAt(id):null):(S.wd.npc||{})[id];
  for(const id in marks){const n=at(id),fx=M[marks[id]];if(n&&fx)want.set('m:'+id+fx,{id:fx,o:n,size:M.size*(marks[id]==='!!'?1.25:1),alpha:M.alpha,dy:-M.up,add:true})}
  const dlg=S.vil?S.vil.dlg:S.wd.dlg,near=S.vil?S.vil.npcNear:S.wd.npcNear,all=S.vil?(typeof npcState==='function'?npcState():null):S.wd.npc;
  if(all){
    if(S.vil)for(const id of FXW.shop.ids.concat(Object.keys(all).filter(k=>/^v/.test(k)))){const n=typeof npcHere==='function'&&npcHere(id)&&all[id];   // הסוחרת, ומי שעברה לגור בכפר וקונה (residents.js)
      if(n&&!marks[id]&&dlg!==id&&Math.hypot(P.x-n.x,P.y-n.y)<FXW.shop.near)want.set('s:'+id,{id:'npc_shop',o:n,size:FXW.shop.size,alpha:FXW.shop.alpha,dy:-FXW.shop.up})}
    const T_=FXW.talk;if(near&&all[near]&&!marks[near]&&dlg!==near&&!want.has('s:'+near))want.set('t:'+near,{id:'npc_talk',o:all[near],size:T_.size,alpha:T_.alpha,dy:-T_.up,dx:T_.dx})}
  if(S.wd){
    // מזג אוויר: אריחים שעוקבים אחרי המצלמה
    for(const [id,a,kind] of FXW.weather[fxwReg()]||[]){
      if(kind==='sky'){const s=cw/2;for(let i=0;i<2;i++)want.set('w:'+id+i,{id,o:cam,size:s,alpha:a,dx:(i-0.5)*s,dy:-ch/2+s*0.1,flip:i===1})}   // flip: החצי השני במראה, כדי שהתפר באמצע יתחבר
      else if(kind==='low'){const s=cw/2.2;for(let i=0;i<2;i++)want.set('w:'+id+i,{id,o:cam,size:s,alpha:a,dx:(i-0.5)*s*1.1,dy:ch*0.18})}
      else{const s=Math.max(cw/2,ch),c=Math.ceil(cw/s),r=Math.ceil(ch/s);for(let i=0;i<c;i++)for(let j=0;j<r;j++)want.set('w:'+id+i+'_'+j,{id,o:cam,size:s,alpha:a,dx:(i-(c-1)/2)*s,dy:(j-(r-1)/2)*s})}}
    // מקום של קווסט צדדי פעיל: טבעת על הרצפה וסימן מעל עמוד האור הקיים
    const Q=FXW.quest;for(const t of typeof sqTargets==='function'?sqTargets():[]){const k=Math.round(t.p.x)+'_'+Math.round(t.p.y);
      want.set('q:'+k,{id:'waypoint',o:t.p,size:Q.way,alpha:0.8,under:true});want.set('qm:'+k,{id:'quest_mark',o:t.p,size:Q.mark,alpha:0.9,dy:-Q.up})}}
  return want;
}
const W_=()=>typeof W!=='undefined'?W:900,H_=()=>typeof H!=='undefined'?H:420;
function fxwSync(){
  const want=fxwWant();
  for(const [k,h] of FXW.live)if(!want.has(k)||!fxwAlive(h)||h.id!==want.get(k).id){fxStop(h);FXW.live.delete(k)}
  for(const [k,w] of want){if(FXW.live.has(k))continue;
    const h=fxPlay(w.id,w.o.x,w.o.y,{follow:w.o,loop:true,size:w.size,alpha:w.alpha,dx:w.dx||0,dy:w.dy||0,add:!!w.add,under:!!w.under,flip:!!w.flip});if(h)FXW.live.set(k,h)}
}
function fxwStopAll(){for(const h of FXW.live.values())fxStop(h);FXW.live.clear()}

/* ---- כל פריים בכפר ובעולם (villageUpdate, worldUpdate) ---- */
function fxwUpdate(dt){
  if(!fxwOn()){if(FXW.live.size)fxwStopAll();return}
  FXW.cam.x=S.cam.x;FXW.cam.y=S.cam.y;
  FXW.once=FXW.once.filter(fxwAlive);FXW.n=FXW.once.length+FXW.live.size;
  const reg=fxwReg();if(reg!==FXW.reg){FXW.reg=reg;fxwStopAll();FXW.lx=null;if(S.wd)fxwPingNow();fxwPreload(reg)}   // אזור חדש: מנקים ומתחילים מחדש, טוענים מראש, ופינג במפה
  if((FXW.t-=dt)<=0){FXW.t=FXW.sync;fxwSync();fxwNews()}
  // צעדים לפי הקרקע
  if(FXW.lx===null){FXW.lx=P.x;FXW.ly=P.y}
  const St=FXW.step,d=Math.hypot(P.x-FXW.lx,P.y-FXW.ly);
  if(d>St.dist*2.5){FXW.lx=P.x;FXW.ly=P.y}   // קפיצה (אבן מסע, מעבר): בלי צעד
  else if(d>=St.dist){FXW.lx=P.x;FXW.ly=P.y;
    const wet=S.wd&&typeof tSlow==='function'&&tSlow(P.x,P.y)<1,id=wet?St.water:S.wd?(St.ground[reg]||St.def):St.def;
    fxwPlay(id,P.x,P.y+P.r*0.7,{size:wet||id==='water_ripple'?St.waterSize*(wet?1:0.6):St.size,alpha:St.alpha,under:true})}
  // אווירה רכה
  const A=FXW.amb[reg];
  if(A&&(FXW.ambT-=dt)<=0){FXW.ambT=rand(...FXW.amb.every);
    const mine=FXW.once.filter(h=>h.amb).length;
    if(mine<FXW.amb.max){const L=fxwNight()?A.night:A.day,id=L[Math.floor(Math.random()*L.length)],cw=W_(),ch=H_();
      const x=S.cam.x+rand(-cw*0.4,cw*0.4),y=S.cam.y+rand(-ch*0.35,ch*0.35),big=id!=='bloom';
      const h=fxwPlay(id,x,y,{size:big?FXW.amb.size:44,alpha:big?FXW.amb.alpha:0.9,add:id==='fireflies',dur:big?2.4:0});if(h)h.amb=1}}
  // בועות בבורות הלבה (המדבר)
  if(S.wd&&WR().heat&&(FXW.lavaT-=dt)<=0){FXW.lavaT=rand(...FXW.lava.every);
    const ps=(WR().ponds||[]).filter(p=>Math.hypot(p.x-P.x,p.y-P.y)<FXW.lava.range+p.r);
    if(ps.length){const p=ps[Math.floor(Math.random()*ps.length)],a=rand(0,6.28),r=rand(0,p.r*0.55);fxwPlay('lava_bubble',p.x+Math.cos(a)*r,p.y+Math.sin(a)*r*0.6,{size:Math.min(FXW.lava.size,p.r*1.4),alpha:0.9,add:true,under:true})}}
  // פיוחו אכלה (petFeed ב-pet.js): לבבות. לפי המונה, כי הכפתור מחובר לפונקציה ישירות
  const fed=SAVE.pet&&SAVE.pet.fed||0,p=S.pet;if(FXW.fed!==null&&fed>FXW.fed&&p)fxwPlay('hearts',p.x,p.y,{follow:p,dy:-(typeof petStage==='function'?petStage().h:30),size:FXW.hearts.size});FXW.fed=fed;
  if(FXW.pingT&&fxNowT()-FXW.pingT<FXW.ping.dur&&typeof MM!=='undefined')MM.t=0;   // בזמן הפינג המפה הקטנה מצוירת בכל פריים
}

// טעינה מראש של מה שיופיע במקום הזה, כדי שאפקט ראשון (קונפטי, חותמת) לא יפספס את תחילתו
function fxwPreload(reg){if(typeof fxPreload!=='function')return;const A=FXW.amb[reg]||{day:[],night:[]};
  fxPreload(['npc_quest','npc_turnin','npc_shop','npc_talk','emote_heart','emote_idea','emote_dots','stamp_done','hearts','win_confetti','balloons','pickup_coin','pickup_gem','pickup_chest','mm_ping',
    'waypoint','quest_mark',FXW.step.ground[reg]||FXW.step.def,FXW.step.water,'lava_bubble',...A.day,...A.night,...(FXW.weather[reg]||[]).map(w=>w[0])])}
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
  const talkFx=(r,id)=>{if(id&&fxwOn())fxwEmote(id)};
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
