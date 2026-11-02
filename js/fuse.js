/* התכת חפצים בנפחייה (חפצים משולבים, שלב 2. הרעיון של אוראל, ניר אישר).
   בוחרים שני חפצים מסתובבים (בסיס או משולבים) ומשאב נדיר, ורואים את הסיכוי ומה ייצא.
   מה שיוצא: כל החלקים של שניהם יחד, בלי כפילויות. מותר עד 3 חלקים, וצריך לצאת משהו חדש (לא אחד מהשניים).
   כל חלק עובד ב-60% (שניים) או 45% (שלושה), לפי ORBIT.combo.share (orbit.js), כמו בשלב 1.
   כישלון: המשאב והמטבעות הולכים תמיד. בהתכה לשלושה חלקים הולך גם החפץ השני שנבחר (lose), ואבן חן (💎) מגינה עליו.
   הלשונית בחלון הנפחייה (aging.js קורא ל-fuseDraw ול-fuseClick, כמו לכוחות). הטקסטים ב-lang.js: 'fuse.*' */
const FUSE={
  chance:{2:0.7,3:0.45},          // הסיכוי להצליח, לפי כמה חלקים יהיו בחפץ שיוצא
  forgeBonus:0.03,                // כל רמת נפחייה מעל 1 מוסיפה סיכוי
  cost:{2:{star:1,coins:60},3:{star:2,coins:150}},   // star: המשאב הנדיר (🌟, RES ב-resources.js)
  lose:{2:false,3:true},          // בכישלון: האם החפץ השני הולך
  gem:'gem'                       // מגן על החפץ השני בכישלון
};

// החלקים של חפץ, לפי הסדר הקבוע של ORBIT.types
const fuseOrder=ts=>Object.keys(ORBIT.types).filter(t=>ts.includes(t));
const fuseParts=id=>{const it=gItem(id);return it&&it.slot==='orbit'?(it.types||[it.type]):null};
const fuseIdOf=ref=>ref&&(ref.id||gGet(ref.slot,ref.i));
// האם הבחירה עוד קיימת (אחרי מכירה, לבישה או התכה)
const fuseHas=ref=>!!ref&&(ref.id?bagHas(ref.id):!!gItem(gGet(ref.slot,ref.i)));
const fuseSame=(a,b)=>!!a&&!!b&&(a.id?a.id===b.id:a.slot===b.slot&&a.i===b.i);

/* מה ייצא משני חפצים: {id,n} או {why}. why: 'pick' (חסר חפץ), 'same' (לא יוצא משהו חדש), 'big' (יותר מ-3 חלקים) */
function fuseOut(a,b){
  const pa=fuseParts(a),pb=fuseParts(b);if(!pa||!pb)return{why:'pick'};
  const ts=fuseOrder([...pa,...pb]);
  if(ts.length>3)return{why:'big'};
  if(ts.length<2||ts.length===pa.length||ts.length===pb.length)return{why:'same'};
  const key=ts.join(),id=Object.keys(GEAR.items).find(k=>{const t=GEAR.items[k].types;return t&&fuseOrder(t).join()===key});
  return id?{id,n:ts.length}:{why:'same'};
}
const fuseOdds=n=>Math.min(1,(FUSE.chance[n]||0)+FUSE.forgeBonus*Math.max(0,vLv('forge')-1));
// למה אי אפשר: 'pick', 'same', 'big', 'cost', או null
function fuseBlock(a,b){
  if(!fuseHas(a)||!fuseHas(b)||fuseSame(a,b))return 'pick';
  const o=fuseOut(fuseIdOf(a),fuseIdOf(b));if(o.why)return o.why;
  const c=FUSE.cost[o.n];for(const r in c)if(!bagHas(r,c[r]))return 'cost';
  return null;
}
const fuseTake=ref=>ref.id?bagTake(ref.id):gSet(ref.slot,ref.i,null);

/* ניסיון אחד. a, b: {id} מהתרמיל או {slot,i} ממשבצת. gem: להגן על b. roll: 0 עד 1 (ברירת מחדל: אקראי).
   הצלחה: שניהם יוצאים, והחדש נכנס למקום של a (משבצת או תרמיל). מחזיר {ok,id,n,lost,saved} או null */
function fuseTry(a,b,gem,roll=Math.random()){
  if(fuseBlock(a,b))return null;
  const o=fuseOut(fuseIdOf(a),fuseIdOf(b)),c=FUSE.cost[o.n],ok=roll<fuseOdds(o.n);
  for(const r in c)bagTake(r,c[r]);
  const risk=!ok&&FUSE.lose[o.n],saved=risk&&gem&&bagTake(FUSE.gem),bid=fuseIdOf(b);
  if(ok){fuseTake(b);if(a.id){fuseTake(a);bagAdd(o.id)}else gSet(a.slot,a.i,o.id)}
  else if(risk&&!saved)fuseTake(b);
  saveNow();
  return{ok,id:o.id,n:o.n,lost:risk&&!saved?bid:null,saved:!!saved};
}

/* ---- הלשונית בחלון הנפחייה ---- */
const FUI={a:null,b:null,gem:false};
// מה מוצג בפס העליון בלשונית: רק מה שהתכה צריכה (🌟, 💎 ומטבעות), גם כשיש 0. aging.js מציג את זה במקום המתכות והאבנים
const fuseRes=()=>{const ks=[...new Set(Object.values(FUSE.cost).flatMap(Object.keys))];return[...ks.filter(k=>k!=='coins'),FUSE.gem,...ks.filter(k=>k==='coins')]};
function fuseDraw(){
  if(!fuseHas(FUI.a))FUI.a=null;if(!fuseHas(FUI.b))FUI.b=null;
  if(!FUI.a&&FUI.b){FUI.a=FUI.b;FUI.b=null}
  const on=r=>fuseSame(r,FUI.a)?'<small>1</small>':fuseSame(r,FUI.b)?'<small>2</small>':'',pr=r=>(fuseSame(r,FUI.a)||fuseSame(r,FUI.b))?' aria-pressed="true"':'';
  let h='';
  for(let i=0;i<gOpen('orbit');i++){const id=gGet('orbit',i),r={slot:'orbit',i};if(gItem(id))h+=gTile(id,'data-slot="orbit" data-i="'+i+'"'+pr(r),'<small>✓</small>'+on(r))}
  h+=Object.keys(SAVE.bag).filter(id=>gItem(id)&&gItem(id).slot==='orbit').map(id=>{const r={id};return gTile(id,'data-id="'+id+'"'+pr(r),on(r)||(SAVE.bag[id]>1?'<small>'+SAVE.bag[id]+'</small>':''))}).join('');
  $('fItems').innerHTML=h||'<p class="dim">'+T('fuse.noItems')+'</p>';
  const nm=r=>r?gIcon(fuseIdOf(r))+' '+gName(fuseIdOf(r)):'<span class="dim">?</span>';
  let d='<p class="dim">'+T('fuse.hint')+'</p><p class="fuse">'+nm(FUI.a)+' + '+nm(FUI.b)+'</p>';
  if(FUI.a&&FUI.b){
    const why=fuseBlock(FUI.a,FUI.b),o=fuseOut(fuseIdOf(FUI.a),fuseIdOf(FUI.b));
    if(o.id){
      const gems=SAVE.bag[FUSE.gem]||0,risk=FUSE.lose[o.n];
      d+='<h3 style="color:'+gTint(o.id)+'">→ '+gIcon(o.id)+' '+gName(o.id)+'</h3>'+gStatsHtml(o.id);
      d+='<p class="odds">'+T('fuse.odds',aPct(fuseOdds(o.n)))+'</p><div class="cost">'+costLine(FUSE.cost[o.n])+'</div>';
      d+='<p class="dim">'+(!risk?T('fuse.fail2'):FUI.gem&&gems?T('fuse.failSafe'):T('fuse.fail3',gName(fuseIdOf(FUI.b))))+'</p>';
      if(risk)d+='<button class="vbtn ghost" data-act="fgem" aria-pressed="'+(FUI.gem&&gems>0)+'"'+(gems?'':' disabled')+'>'+T('age.gem',gems)+'</button>';
    }else d+='<p>'+T('fuse.why.'+o.why)+'</p>';
    d+='<button class="vbtn" data-act="fuse"'+(why?' disabled':'')+'>'+(why==='cost'?T('age.needCost'):T('fuse.go'))+'</button>';
  }
  $('fDetail').innerHTML=d;
}
// לחיצה בלשונית. מחזיר true אם טיפל בה (aging.js)
function fuseClick(b){
  const r=b.dataset.id?{id:b.dataset.id}:b.dataset.slot?{slot:b.dataset.slot,i:+b.dataset.i}:null;
  if(r){
    if(fuseSame(r,FUI.a)){FUI.a=FUI.b;FUI.b=null}
    else if(fuseSame(r,FUI.b))FUI.b=null;
    else if(!FUI.a)FUI.a=r;else FUI.b=r;
    return true}
  if(b.dataset.act==='fgem'){FUI.gem=!FUI.gem;return true}
  if(b.dataset.act==='fuse'){
    const x=fuseTry(FUI.a,FUI.b,FUI.gem);if(!x)return true;
    if(x.ok){celebrate(P.x,P.y-20,'aging','✦');banner(T('fuse.done',gName(x.id)),C.gold);FUI.a=FUI.a.id?{id:x.id}:FUI.a;FUI.b=null}
    else{celebrate(P.x,P.y-20,'agingFail',x.lost?'✕':'');S.shake=Math.max(S.shake,5);banner(x.lost?T('fuse.lost',gName(x.lost)):T('fuse.failed'),C.dim);if(x.lost)FUI.b=null}
    return true}
  return false;
}
