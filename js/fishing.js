/* דיג: פעילות רגועה בין הקרבות, בעולם הפתוח (משימה של המתאם, 31.10.2026: "מגוון פעילויות בעולם פתוח עדיף על עוד מאותו דבר").
   איך זה עובד אצל הטובים: ב-Animal Crossing מטילים, מחכים, ולוחצים פעם אחת כשהמצוף שוקע (פשוט ומרגיע). ב-Stardew Valley מחזיקים דג בתוך פס שזז (קשה מדי לאגודל).
   ב-Genshin מחכים לנשיכה ואז שומרים על מחוג באזור. כאן: הכי פשוט שעדיין מרגיש כמו מיומנות, לאגודל אחד:
     1. עומדים ליד מים ולוחצים "לדוג": החכה נזרקת והמצוף צף.
     2. מחכים. כשהמצוף שוקע מופיע "!" (ורטט באנדרואיד), ויש FISH.bite שניות ללחוץ. מוקדם מדי: הדג נבהל.
     3. מחוג נע הלוך וחזור על פס, ולוחצים כשהוא באזור הירוק. דג נדיר: מחוג מהיר יותר, אזור צר יותר, ויותר לחיצות.
   כל הלחיצות באותו כפתור (#fishBtn בסרגל התחתון, בצד של האגודל הימני). זזים: החכה חוזרת.
   איפה: הבריכה של הדייג באחו (WNPC.list.fisher.pond ב-worldnpc.js), והמים באגם הערפל (WORLD.regions.lake.ponds). לכל מקום מאגר דגים משלו (pools).
   הדגים הם משאבים (RES ב-resources.js, המשפחה fish), אז הם נכנסים לתרמיל ולספר ההרפתקאות (bookSee דרך bagAdd) לבד, ונמכרים בשוק.
   בישול: אצל הפונדקאית (npc.js), ארוחה נותנת חיזוק בעולם הפתוח לכמה דקות משחק בו (meals). ארוחה אחת בכל פעם. נשמר ב-SAVE.fish.
   הקווסט של הדייג: wCatch ב-quests.js, דרך questEvent('fish',<דג>). הטקסט ב-lang.js תחת 'fish.' ו-'meal.' */

const FISH={
  near:60,                 // כמה פיקסלים מקצה המים מופיע הכפתור
  cast:0.5,                // שניות עד שהמצוף נוחת
  wait:[1.6,3.8],          // כמה מחכים לנשיכה (אקראי בטווח)
  bite:1.1,                // כמה זמן יש ללחוץ אחרי ה-"!"
  reelTime:5,              // כמה זמן יש לתפוס את הדג בפס, לפני שהוא בורח
  into:28,                 // כמה פנימה מקצה המים המצוף נוחת
  rest:0.7,                // הפסקה אחרי דג או פספוס, לפני שאפשר להטיל שוב
  // לפי הנדירות (rar ב-RES): כמה מהר המחוג (מעברים בשנייה), כמה רחב האזור הירוק (חלק מהפס), וכמה לחיצות צריך
  reel:{speed:[1.1,1.3,1.5,1.8,2.1],zone:[0.36,0.32,0.27,0.22,0.18],taps:[1,1,2,2,3]},
  // המאגרים: איזה דג ובאיזה משקל. pond: הבריכה של הדייג באחו. lake: האגם בערפל
  pools:{
    pond:{minnow:40,perch:35,crab:15,puffer:9,koi:1},
    lake:{perch:30,crab:20,puffer:20,eel:17,mistfin:10,koi:3}
  },
  regions:{lake:'lake'},   // באילו אזורים המים (ponds ב-WORLD.regions) הם מקום לדוג, ובאיזה מאגר. הסדקים ברכס הקפוא לא
  // בישול אצל הפונדקאית. need: מה צריך. buff: סטטים כמו בציוד (gApply ב-gear.js). t: כמה שניות של משחק בעולם
  cookAt:'inn',
  meals:{
    stew: {icon:'🍲',need:{minnow:2,perch:1},buff:{hp:40},t:240},
    grill:{icon:'🍢',need:{crab:1,puffer:1},buff:{speed:12},t:240},
    feast:{icon:'🍱',need:{eel:1,mistfin:1},buff:{sdmg:15,gdmg:15},t:240},
    gold: {icon:'🍣',need:{koi:1},buff:{hp:30,speed:8,sdmg:10,gdmg:10},t:360}
  },
  line:'rgba(236,231,220,0.7)',bob:['#E8453C','#F4F1EA']   // החוט והמצוף
};

const FS=()=>SAVE.fish||(SAVE.fish={caught:{},meal:null});   // נוצר בפעם הראשונה, כדי ששמירה ישנה תעבוד
const fishList=()=>Object.keys(RES.list).filter(r=>RES.list[r].fam==='fish');

/* ---- איפה המים: הקרובים לשחקן, עם המרחק מהקצה (שלילי = בתוך המים) ---- */
function fishSpot(){
  const R=WR();let best=null;
  const try_=(pool,cx,cy,e)=>{if(!best||e<best.e)best={pool,cx,cy,e}};
  if(!R.noNpc){const F=WNPC.list.fisher,p=F&&F.pond;   // אליפסה: המרחק לאורך הקו למרכז
    if(p){const cx=F.at.x+p.dx,cy=F.at.y+p.dy,d=Math.hypot((P.x-cx)/p.rx,(P.y-cy)/p.ry)||1e-3;try_('pond',cx,cy,Math.hypot(P.x-cx,P.y-cy)*(1-1/d))}}
  const pool=FISH.regions[S.wd.reg];
  if(pool)for(const p of R.ponds||[])try_(pool,p.x,p.y,Math.hypot(P.x-p.x,P.y-p.y)-p.r);
  return best&&best.e<FISH.near?best:null;
}
// דג אקראי מהמאגר, לפי המשקלים
function fishPick(pool){
  const w=FISH.pools[pool];let n=Math.random()*Object.values(w).reduce((a,b)=>a+b,0);
  for(const k in w)if((n-=w[k])<=0)return k;
  return Object.keys(w)[0];
}
const fishRar=id=>(RES.list[id]||{}).rar||0;
const fishTri=ph=>{const x=ph%2;return x<1?x:2-x};   // המחוג: 0 עד 1 וחזרה
// המחוג עכשיו באזור הירוק? (גם לבוט ב-tools/check.js)
function fishNeedleIn(){const f=S.wd&&S.wd.fish;if(!f||f.st!=='reel')return false;const x=fishTri(f.ph);return Math.abs(x-f.zc)<=f.zw/2}

/* ---- לחיצה על הכפתור: לפי השלב ---- */
function fishTap(){
  const w=S.wd;if(!w||S.mode!=='play')return;
  const f=w.fish;
  if(!f){   // להטיל
    const sp=fishSpot();if(!sp||w.fishRest>0)return;
    const a=Math.atan2(sp.cy-P.y,sp.cx-P.x),d=Math.max(0,sp.e)+FISH.into;
    w.fish={st:'cast',t:0,pool:sp.pool,bx:P.x+Math.cos(a)*d,by:P.y+Math.sin(a)*d};P.aim=P.face=a;sfx('tap');return}
  if(f.st==='cast'||f.st==='wait'){fishEnd(false,'fish.early');return}   // מוקדם מדי: הדג נבהל
  if(f.st==='bite'){   // נשיכה! עכשיו הפס
    const r=fishRar(f.id),R=FISH.reel;
    Object.assign(f,{st:'reel',t:0,ph:Math.random(),sp:R.speed[r],zw:R.zone[r],need:R.taps[r],taps:0});fishZone(f);sfx('tap');return}
  if(f.st==='reel'){
    if(!fishNeedleIn()){fishEnd(false,'fish.miss');return}
    f.taps++;sfx('xp');if(f.taps>=f.need){fishCatch(f);return}
    fishZone(f);   // עוד לחיצה: האזור קופץ למקום אחר
  }
}
function fishZone(f){f.zc=f.zw/2+Math.random()*(1-f.zw)}
function fishCatch(f){
  const id=f.id,r=fishRar(id),F=FS();
  bagAdd(id,1);F.caught[id]=(F.caught[id]||0)+1;   // bagAdd: גם לספר ההרפתקאות (book.js)
  questEvent('fish',id,1);saveNow();
  celebrate(f.bx,f.by,r>=2?'loot'+Math.min(4,r):'quest',RES.list[id].icon);
  floatText(P.x,P.y-46,RES.list[id].icon+' '+resName(id),RES.rarity[r].col,16);
  fishEnd(true);
}
function fishEnd(ok,msg){
  const w=S.wd;if(!w||!w.fish)return;
  if(msg)floatText(P.x,P.y-46,T(msg),C.dim||'#A9AFC0',14);
  w.fish=null;w.fishRest=FISH.rest;fishBtn(true);
}

/* ---- כל פריים בעולם (נקרא מ-worldUpdate) ---- */
function fishUpdate(dt){
  const w=S.wd;if(!w)return;
  fishMealTick(dt);
  w.fishRest=(w.fishRest||0)-dt;
  const f=w.fish;
  if(f){
    if(P.moving){fishEnd(false);return}   // זזים: החכה חוזרת
    f.t+=dt;
    if(f.st==='cast'&&f.t>=FISH.cast){f.st='wait';f.t=0;f.wt=FISH.wait[0]+Math.random()*(FISH.wait[1]-FISH.wait[0])}
    else if(f.st==='wait'&&f.t>=f.wt){f.st='bite';f.t=0;f.id=fishPick(f.pool);sfx('coin');try{navigator.vibrate&&navigator.vibrate(120)}catch(e){}}
    else if(f.st==='bite'&&f.t>=FISH.bite)fishEnd(false,'fish.away');
    else if(f.st==='reel'){f.ph+=dt*f.sp;if(f.t>=FISH.reelTime)fishEnd(false,'fish.away')}
  }
  fishBtn();
}
// הכפתור: מופיע רק ליד מים (או באמצע דיג), והטקסט לפי השלב
function fishBtn(force){
  const b=$('fishBtn'),w=S.wd,f=w&&w.fish;
  const show=!!w&&S.mode==='play'&&(!!f||!!fishSpot()&&!(w.fishRest>0)&&!w.dlg);
  const k=!show?'':!f?'fish.btn':f.st==='bite'?'fish.bite':f.st==='reel'?'fish.reel':'fish.wait';
  if(!force&&b.dataset.k===k+LANG)return;
  b.dataset.k=k+LANG;b.hidden=!show;if(show){const c={'fish.btn':['🎣','fish'],'fish.wait':['⏳','wait'],'fish.bite':['❗','pull'],'fish.reel':['🎯','now']}[k];b.innerHTML='<span class="ni" aria-hidden="true">'+c[0]+'</span>'+T('ctx.'+c[1]);b.setAttribute('aria-label',T(k))}
  b.classList.toggle('fishbite',!!f&&(f.st==='bite'||f.st==='reel'));
}
$('fishBtn').addEventListener('pointerdown',e=>{e.preventDefault();fishTap()});   // בלחיצה ולא בהרמה: תזמון (docs/ui-guide.md, "בסקיל כשלוחצים")
// יציאה מהעולם
function fishOff(){const b=$('fishBtn');b.hidden=true;b.dataset.k=''}

/* ---- ארוחה: חיזוק בעולם הפתוח ---- */
// כניסה לעולם (אחרי reset ב-enterWorld): אם יש ארוחה, הסטטים שלה חלים
function fishMealOn(){
  const m=FS().meal,M=m&&FISH.meals[m.id];if(!M||!S.wd)return;
  gApply(M.buff,1);P.hp=P.maxHp;S.wd.meal=m.id;
  floatText(P.x,P.y-60,M.icon+' '+T('meal.'+m.id)[0],C.gold,15);
}
function fishMealTick(dt){
  const w=S.wd,m=FS().meal;if(!w.meal||!m)return;
  if((m.t-=dt)>0)return;
  gApply(FISH.meals[w.meal].buff,-1);P.hp=Math.min(P.hp,P.maxHp);
  floatText(P.x,P.y-60,T('fish.mealEnd'),C.dim||'#A9AFC0',14);
  w.meal=null;FS().meal=null;saveNow();
}
const fishCanCook=id=>{const M=FISH.meals[id];return !!M&&Object.keys(M.need).every(r=>bagHas(r,M.need[r]))};
function fishCook(id){
  if(!fishCanCook(id))return false;const M=FISH.meals[id];
  for(const r in M.need)bagTake(r,M.need[r]);
  FS().meal={id,t:M.t};saveNow();sfx('celebrate');
  if(typeof P!=='undefined'&&S.vil)celebrate(P.x,P.y-20,'quest',M.icon);
  return true;
}
// בשיחה עם הפונדקאית (npcDialog ב-npc.js): מה אפשר לבשל, ומה הארוחה שעכשיו
function fishCookHtml(){
  const m=FS().meal;
  let h='<div class="fcook"><b>'+T('fish.cookT')+'</b>';
  if(m&&FISH.meals[m.id])h+='<p class="next">'+T('fish.mealNow',FISH.meals[m.id].icon+' '+T('meal.'+m.id)[0],Math.ceil(m.t/60))+'</p>';
  for(const id in FISH.meals){const M=FISH.meals[id],[name,desc]=T('meal.'+id);
    const need=Object.keys(M.need).map(r=>'<span class="res'+(bagHas(r,M.need[r])?'':' short')+'">'+resIcon(r)+' '+(SAVE.bag[r]||0)+'/'+M.need[r]+'</span>').join('');
    h+='<div class="fmeal"><span class="fmi">'+M.icon+'</span><span class="fmt"><b>'+name+'</b><small>'+desc+'</small><span>'+need+'</span></span>'+
      '<button class="vbtn" data-act="cook" data-m="'+id+'"'+(fishCanCook(id)?'':' disabled')+'>'+T('fish.cook')+'</button></div>'}
  return h+'</div>';
}

/* ---- ציור ---- */
// בעולם (נקרא מ-drawWorld): החוט והמצוף. בנשיכה המצוף שוקע ויש אדוות
function fishDraw(){
  const f=S.wd&&S.wd.fish;if(!f)return;
  const k=f.st==='cast'?Math.min(1,f.t/FISH.cast):1,bx=P.x+(f.bx-P.x)*k,by=P.y+(f.by-P.y)*k-(f.st==='cast'?Math.sin(k*Math.PI)*40:0);
  const dip=f.st==='bite'?4+Math.sin(fxNow()*30)*3:f.st==='reel'?3:Math.sin(fxNow()*3)*1.5;
  ctx.strokeStyle=FISH.line;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(P.x+8,P.y-22);ctx.quadraticCurveTo((P.x+bx)/2,Math.min(P.y,by)-30,bx,by+dip);ctx.stroke();
  if(f.st!=='cast'){const t=fxNow();ctx.strokeStyle='rgba(236,231,220,0.35)';ctx.lineWidth=1.5;
    for(let i=0;i<(f.st==='bite'?3:1);i++){const r=((t*(f.st==='bite'?1.6:0.5)+i/3)%1);ctx.globalAlpha=1-r;ctx.beginPath();ctx.ellipse(bx,by+4,6+r*22,3+r*9,0,0,7);ctx.stroke()}
    ctx.globalAlpha=1}
  ctx.fillStyle=FISH.bob[1];ctx.beginPath();ctx.arc(bx,by+dip,5,0,7);ctx.fill();
  ctx.fillStyle=FISH.bob[0];ctx.beginPath();ctx.arc(bx,by+dip,5,Math.PI,0);ctx.fill();
}
// מעל הכל (נקרא מ-drawWorldScreen): "!" בנשיכה, והפס עם המחוג
function fishScreen(ox,oy){
  const f=S.wd&&S.wd.fish;if(!f)return;
  ctx.textAlign='center';ctx.direction='ltr';
  if(f.st==='bite'){const s=1+Math.sin(fxNow()*14)*0.12;ctx.font='900 '+Math.round(34*s)+'px Heebo, system-ui, sans-serif';
    ctx.fillStyle='#0009';ctx.fillText('!',f.bx+ox+2,f.by+oy-22);ctx.fillStyle=C.gold;ctx.fillText('!',f.bx+ox,f.by+oy-24)}
  if(f.st!=='reel')return;
  const W=170,H=18,x=P.x+ox-W/2,y=P.y+oy-96,left=Math.max(0,1-f.t/FISH.reelTime),col=RES.rarity[fishRar(f.id)].col;
  ctx.fillStyle='rgba(18,22,36,0.85)';ctx.beginPath();ctx.roundRect(x-6,y-6,W+12,H+20,10);ctx.fill();
  ctx.fillStyle='#2A3046';ctx.fillRect(x,y,W,H);
  ctx.fillStyle='#6FD08C';ctx.fillRect(x+(f.zc-f.zw/2)*W,y,f.zw*W,H);
  ctx.strokeStyle=col;ctx.lineWidth=2;ctx.strokeRect(x,y,W,H);
  const nx=x+fishTri(f.ph)*W;ctx.fillStyle=C.chalk;ctx.fillRect(nx-2,y-4,4,H+8);
  ctx.fillStyle=C.gold;ctx.fillRect(x,y+H+4,W*left,3);   // הזמן שנשאר
  for(let i=0;i<f.need;i++){ctx.fillStyle=i<f.taps?C.gold:'rgba(236,231,220,0.3)';ctx.beginPath();ctx.arc(x+W+16,y+H/2-((f.need-1)/2-i)*10,3.5,0,7);ctx.fill()}
  ctx.direction=DIR;
}
