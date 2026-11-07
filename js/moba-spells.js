/* משחקי השאול: ריפוי, לחשים ומסך בנייה לפני המשחק (אוראל, 6.11.2026. התוכנית: docs/moba-plan.md, סשן 5)
   - ריפוי: כפתור קטן לכל גיבור, נפרד מהסקילים. 15% מהחיים לעצמך, טעינה 60 שניות.
   - לחש: אחד לכל גיבור, נבחר לפני המשחק במסך הבנייה (שלב אחרי בחירת הגיבור בחלון #mbWin). נשמר לכל גיבור, ברירת המחדל זינוק.
   - בוטים: בוחרים לחש לפי תפקיד (MBSPELL.bot), מתרפאים בחיים נמוכים, ומשתמשים בלחש כשיש בו טעם.
   שני הכפתורים יושבים בתוך #mbSk עם data-sk="heal" ו-"spell", ולכן הכיוון בגרירה, הביטול והשניות של moba-aim.js עובדים גם עליהם.
   הטעינה ב-u.cd.heal ו-u.cd.spell. מצבים חדשים ב-u.st: haste, exh (תשישות), pure (אחרי ניקוי: שום האטה או לכידה לא תופסות).
   החיבור: mbSpellTick ב-mobaUpdate, mbSpellDraw ב-mobaDraw, mbSpellHud ב-mobaHud, mbSpellBot ב-mbBot, mbSpellSpd ב-mbSpeed,
   mbSpellDmgK ב-mbDmg, mbSpellBtns ב-mbUi, mbBuildOpen בלחיצה על גיבור בחלון הבחירה */
const MBSPELL={
  heal:{id:'heal',k:0.15,cd:60,kind:'self',r:60,col:'#7BD88F',pic:'m3',sfx:'xp'},
  list:{   // pic: אייקון מצויר (icons/ui/skills). col: צבע האפקט והסימון. sfx: צליל
    dash:   {cd:90,kind:'line',range:220,sp:1500,col:'#E8E2D0',pic:'agi',sfx:'shoot'},                  // זינוק קצר לכיוון הג'ויסטיק (או הגרירה, או הפנים)
    haste:  {cd:75,t:4,k:0.5,col:'#F4C74F',pic:'hMomentum',sfx:'xp'},                                    // +50% מהירות ל-4 שניות
    barrier:{cd:75,t:3,k:0.2,col:'#8FD3FF',pic:'shield',sfx:'creak'},                                    // מגן של 20% מהחיים ל-3 שניות
    reveal: {cd:60,kind:'point',range:650,r:350,t:4,col:'#C9A8FF',pic:'mFocus',sfx:'bell',vol:0.4},      // חושף אזור (גם שיחים) ל-4 שניות. הראייה עצמה: mbVisReveal (moba-vision.js)
    exhaust:{cd:80,range:400,t:3,slow:0.4,dmg:0.3,col:'#B07AD9',pic:'petrify',sfx:'creak'},             // גיבור האויב הקרוב: איטי ב-40% ופוגע 30% פחות
    cleanse:{cd:90,pure:1,col:'#FFFFFF',pic:'m1',sfx:'celebrate',vol:0.5},                          // מסיר הלם, הכרחה, האטה ולכידה, ושנייה של חסינות
  },
  def:'dash',key:'fh-mb-spell',hold:0.5,   // hold: לחיצה ארוכה על הכפתור (שניות) מראה הסבר, בלי להטיל
  bot:{tank:['barrier','haste'],warrior:['dash','exhaust'],hunter:['dash'],mage:['reveal','cleanse']},   // הבוטים בוחרים לפי תפקיד
  botHeal:0.35,                             // בוט מתרפא מתחת ל-35% חיים
};
// אייקוני SVG לכשהתמונה לא נטענה, באותו סגנון של הסקילים (MB_SVG ב-moba-look.js)
Object.assign(MB_SVG,{
  sp_heal:{f:'M9 2.5h6v6.5h6.5v6H15v6.5H9V15H2.5V9H9z'},
  sp_dash:{f:'M9 5.5 18 12l-9 6.5z',s:'M2 8.5h4M1.5 12h4.5M2 15.5h4M20.5 5v14'},
  sp_haste:{f:'M13.5 1.5 4 13.5h6.5L9 22.5 20 10h-6.5z'},
  sp_barrier:{f:'M12 2l8.5 3v6.5c0 5-3.6 9-8.5 11-4.9-2-8.5-6-8.5-11V5z',s:'M12 7v9M7.5 11.5h9'},
  sp_reveal:{eo:1,f:'M1.5 12C4 7 8 4.5 12 4.5S20 7 22.5 12C20 17 16 19.5 12 19.5S4 17 1.5 12zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z'},
  sp_exhaust:{s:'M12 2.5v13M6.5 10.5l5.5 5.5 5.5-5.5',f:'M4 19.5h16V22H4z'},
  sp_cleanse:{f:'M11 2l2.2 7 7 2.2-7 2.2-2.2 7-2.2-7-7-2.2 7-2.2z',s:'M19.5 2.5v5M17 5h5'},
});
/* מסך הבנייה: מערך של לשוניות. היום רק "לחש", ובהמשך חפצים או רונות: לשונית חדשה = עוד שורה כאן.
   כל לשונית: id, html(kit) לתוכן, ו-pick(kit,el) כשנוגעים במשהו עם data-b בתוכה */
const MB_BUILD=[
  {id:'spell',html:kit=>mbBuildSpell(kit),pick:(kit,el)=>{mbSpellSet(kit,el.dataset.b);return true}},
];

/* ---- מה כל גיבור בחר ---- */
function mbSpellAll(){let o={};try{o=JSON.parse(localStorage.getItem(MBSPELL.key))||{}}catch(e){}return o&&typeof o==='object'?o:{}}
function mbSpellGet(kit){const v=mbSpellAll()[kit];return MBSPELL.list[v]?v:MBSPELL.def}
function mbSpellSet(kit,id){if(!MBSPELL.list[id])return;const o=mbSpellAll();o[kit]=id;try{localStorage.setItem(MBSPELL.key,JSON.stringify(o))}catch(e){}}
// לחש וטעינה לגיבור, פעם אחת בתחילת המשחק: השחקן לפי מה שבחר, בוט לפי התפקיד
function mbSpellInit(u){
  if(u.spell)return;u.spell=u.me&&!u.bot?mbSpellGet(u.kit):pick(MBSPELL.bot[u.kit]||[MBSPELL.def]);
  u.cd.heal=u.cd.heal||0;u.cd.spell=u.cd.spell||0;
}
// ההגדרה של הכפתור, בשביל הכיוון בגרירה (moba-aim.js): kind, range, r, col
const mbSpellS=(u,slot)=>slot==='heal'?MBSPELL.heal:Object.assign({id:u.spell},MBSPELL.list[u.spell||MBSPELL.def]);

/* ---- הטלה ---- */
// הכפתור של השחקן (mbPress ב-moba.js מעביר לכאן). pt: נקודה מהגרירה. בלי pt: כיוון אוטומטי
function mbSpellPress(slot,pt){
  const u=mbMe();if(!u||u.dead||MB.over)return;mbSpellInit(u);
  if(u.cd[slot]>0)return;
  if(!(slot==='heal'?mbHealCast(u):mbSpellCast(u,pt)))mbShake(slot);   // אין על מי (תשישות בלי אויב בטווח): הכפתור רועד, בלי טעינה
}
function mbHealCast(u){
  const H=MBSPELL.heal;if(!u||u.dead||u.cd.heal>0||u.hp>=u.max)return false;
  const v=Math.min(u.max-u.hp,u.max*H.k);u.hp+=v;u.cd.heal=H.cd;u.actT=MB.t;
  mbFloat(u.x,u.y-u.r-16,'+'+Math.round(v),H.col);mbBoom(u.x,u.y,70,'heal');mbSpellFx(u,H.col,'up');
  if(u.me)sfx(H.sfx);return true;
}
// aim: נקודה {x,y} (זינוק, חשיפה). מחזיר אם הוטל
function mbSpellCast(u,aim){
  mbSpellInit(u);const id=u.spell,L=MBSPELL.list[id],s=u.st;
  if(!L||u.dead||u.cd.spell>0||u.st.dash)return false;
  if(id!=='cleanse'&&(s.stun>0||s.taunt>0))return false;   // בהלם רק ניקוי עובד
  if(id==='dash'&&(s.root>0||typeof mbGbBusy==='function'&&mbGbBusy(u)))return false;   // לכוד, או בהטלה בחדר ההימור                    // לכוד ברשת: לא זז, כמו סקילים שמזיזים (MB_MOVES ב-moba-kits.js)
  switch(id){
    case 'dash':{let a=u.face;
      if(aim)a=Math.atan2(aim.y-u.y,aim.x-u.x);else if(u.me&&joy&&Math.hypot(joy.dx,joy.dy)>0.12)a=Math.atan2(joy.dy,joy.dx);
      if(typeof mbRecallStop==='function')mbRecallStop(u,false);
      mbSpellFx(u,L.col,'puff');s.dash={vx:Math.cos(a),vy:Math.sin(a),sp:L.sp,left:L.range,end:()=>mbSpellFx(u,L.col,'puff')};u.face=u.aim=a;break}
    case 'haste':s.haste=L.t;mbSpellFx(u,L.col,'ring');break;
    case 'barrier':mbShield(u,u.max*L.k,L.t);mbSpellFx(u,L.col,'ring');break;
    case 'reveal':{const p=aim||{x:u.x+Math.cos(u.face)*L.range*0.6,y:u.y+Math.sin(u.face)*L.range*0.6},d=Math.hypot(p.x-u.x,p.y-u.y),k=d>L.range?L.range/d:1;
      const x=u.x+(p.x-u.x)*k,y=u.y+(p.y-u.y)*k;
      typeof mbVisReveal==='function'&&mbVisReveal(x,y,L.r,L.t,u.team);
      MB.spellZ=(MB.spellZ||[]).concat({x,y,r:L.r,t:L.t,t0:L.t,team:u.team,col:L.col});break}
    case 'exhaust':{const t=mbNearest(u,MB.u.filter(o=>o.k==='hero'&&o.team!==u.team&&!o.dead&&(typeof mbSeen!=='function'||mbSeen(o,u.team))),L.range+20);
      if(!t)return false;
      t.st.exh=L.t;if(!(t.st.pure>0))mbSlow(t,L.slow,L.t);mbSpellFx(t,L.col,'down');mbBoom(t.x,t.y,50,'blue');break}
    case 'cleanse':Object.assign(s,{stun:0,taunt:0,tBy:null,slow:0,slowK:0,root:0,bub:0,ice:0,imm:L.pure,pure:L.pure});mbSpellFx(u,L.col,'up');break;
  }
  u.cd.spell=L.cd;u.actT=MB.t;if(u.me)sfx(L.sfx,L.vol||1);   // actT: לחש מתוך שיח חושף, כמו תקיפה וסקיל (moba-vision.js)MB.spellN=(MB.spellN||0)+1;
  return true;
}

/* ---- כל פריים ---- */
function mbSpellTick(M,dt){
  for(const u of M.u){if(u.k!=='hero')continue;mbSpellInit(u);const s=u.st;
    for(const k of ['heal','spell'])if(u.cd[k]>0)u.cd[k]-=dt;
    if(u.dead){s.haste=s.exh=s.pure=0;continue}
    for(const k of ['haste','exh'])if(s[k]>0)s[k]-=dt;
    if(s.pure>0){s.pure-=dt;s.slow=0;s.root=0;s.bub=0}}   // אחרי ניקוי: שום האטה, לכידה או בועה לא תופסות
  if(M.spellZ){for(const z of M.spellZ)z.t-=dt;M.spellZ=M.spellZ.filter(z=>z.t>0)}
}
const mbSpellSpd=u=>u.st&&u.st.haste>0?1+MBSPELL.list.haste.k:1;                       // מהירות (mbSpeed ב-moba.js)
const mbSpellDmgK=src=>src&&src.st&&src.st.exh>0?1-MBSPELL.list.exhaust.dmg:1;          // תשישות: פוגע פחות (mbDmg ב-moba.js)

/* ---- אפקטים: חלקיקים (moba-fx.js), וטבעות על הרצפה (mbSpellDraw) ---- */
function mbSpellFx(u,col,how){
  if(typeof mbfxPart!=='function')return;
  for(let i=0;i<14;i++){const a=i/14*6.283,r=u.r+6;
    if(how==='up')mbfxPart(u.x+Math.cos(a)*r,u.y+Math.sin(a)*r*0.5,4,0,0,90+Math.random()*60,col,0.7,4,1,-0.2);
    else if(how==='down')mbfxPart(u.x+Math.cos(a)*r,u.y+Math.sin(a)*r*0.5,70,0,0,-40,col,0.6,4,1,0.5);
    else if(how==='ring'){if(i===0&&MB.fx.length<40)MB.fx.push({x:u.x,y:u.y,r:90,col,life:0.45});mbfxPart(u.x,u.y,8,Math.cos(a)*160,Math.sin(a)*80,30,col,0.5,4,0.9,0.3)}
    else mbfxPart(u.x+rand(-10,10),u.y+rand(-6,6),6,rand(-50,50),rand(-30,30),40+Math.random()*50,col,0.45,5,0.8,0.6)}
}
// בקנבס מעל התלת-ממד, בקואורדינטות של העולם: טבעת סביב מי שמואץ, מוגן או מותש, והאזור החשוף
function mbSpellDraw(){
  const now=MB.t;ctx.save();
  for(const z of MB.spellZ||[]){if(z.team!==MB.me.team)continue;const k=Math.min(1,z.t/0.4,(z.t0-z.t)/0.25+0.2);
    ctx.globalAlpha=0.5*k;ctx.strokeStyle=z.col;ctx.lineWidth=3;ctx.setLineDash([14,10]);ctx.lineDashOffset=-now*30;
    ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,7);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=0.08*k;ctx.fillStyle=z.col;ctx.fill()}
  for(const u of MB.u){if(u.k!=='hero'||u.dead||typeof mbSeen==='function'&&u.team!==MB.me.team&&!mbSeen(u,MB.me.team))continue;const s=u.st,L=MBSPELL.list;
    const ring=(col,r,a)=>{ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(u.x,u.y+2,r,r*0.5,0,0,7);ctx.stroke()};
    if(s.haste>0)ring(L.haste.col,u.r+12+Math.sin(now*12)*2,0.75);
    if(s.exh>0)ring(L.exhaust.col,u.r+8,0.55+0.25*Math.sin(now*6));
    if(s.pure>0)ring(L.cleanse.col,u.r+16,0.8*s.pure);
    if(s.shield>0&&s.shieldEnd>now){ctx.globalAlpha=0.22;ctx.fillStyle=L.barrier.col;ctx.beginPath();ctx.arc(u.x,u.y-u.r,u.r+10,0,7);ctx.fill()}}
  ctx.restore();
}

/* ---- ה-HUD: שני כפתורים קטנים בתוך #mbSk, ליד הסקילים ---- */
function mbSpellBtns(u){
  mbSpellInit(u);const L=MBSPELL.list[u.spell],H=MBSPELL.heal;
  const b=(k,pic,col,name)=>'<button class="skb mbskb mbsp mbsp-'+k+'" data-sk="'+k+'" style="--dt:'+col+'" aria-label="'+name+'">'+mbSpellPic(pic,k==='heal'?'heal':u.spell)+'<i></i></button>';
  return b('heal',H.pic,H.col,T('mb.heal'))+b('spell',L.pic,L.col,T('mb.sp.'+u.spell));
}
// אייקון מצויר, ואם לא נטען: SVG באותו סגנון של הסקילים
function mbSpellPic(pic,id){
  return '<img class="mbpic" src="icons/ui/skills/'+pic+'.png" alt="" draggable="false" onerror="this.remove()">'+mbSvg(MB_SVG['sp_'+id]?'sp_'+id:'heal');
}
function mbSpellHud(){
  const u=mbMe();if(!u)return;
  for(const k of ['heal','spell']){const b=document.querySelector('#mbSk [data-sk="'+k+'"]');if(!b)continue;
    const cd=k==='heal'?MBSPELL.heal.cd:MBSPELL.list[u.spell].cd;b.style.setProperty('--cd',Math.max(0,u.cd[k]||0)/cd);
    const off=u.dead||k==='heal'&&u.hp>=u.max;if(b.classList.contains('off')!==off)b.classList.toggle('off',off)}
}
// לחיצה ארוכה על אחד הכפתורים (moba-aim.js): בועה עם השם וההסבר מעל הכפתור, עד שעוזבים
function mbSpellTip(slot,b){
  let t=$('mbSpTip');const u=mbMe();
  if(!slot||!u){if(t)t.hidden=true;return}
  if(!t){t=document.createElement('div');t.id='mbSpTip';t.className='mbsptip';document.body.appendChild(t)}   // ב-body ומעל הכפתורים: הריפוי הסתיר את הכותרת (הבודק, 7.11)
  const id=slot==='heal'?'heal':u.spell,cd=slot==='heal'?MBSPELL.heal.cd:MBSPELL.list[id].cd;
  t.innerHTML='<b>'+T(slot==='heal'?'mb.heal':'mb.sp.'+id)+' <small>'+T('mb.spCd',cd)+'</small></b><span>'+T(slot==='heal'?'mb.healD':'mb.spD.'+id)+'</span>';
  const r=b.getBoundingClientRect();t.style.right=Math.max(8,innerWidth-r.right-40)+'px';t.style.bottom=(innerHeight-r.top+10)+'px';t.hidden=false;
}

/* ---- בוטים: ריפוי בחיים נמוכים, ולחש כשיש בו טעם. נקרא מ-mbBot בכל פריים, וחושב פעם ב-skill שניות של המוח ---- */
function mbSpellBot(u,dt){
  mbSpellInit(u);const B=u.bot;if(u.dead||MB.over)return;
  B.spT=(B.spT||0)-dt;if(B.spT>0)return;B.spT=Math.max(0.15,mbMind(u).skill*0.6);
  if(u.cd.heal<=0&&u.hp<u.max*MBSPELL.botHeal&&mbHealCast(u))return;
  if(u.cd.spell>0)return;
  const s=u.st,L=MBSPELL.list,id=u.spell,A=MBKIT[u.kit].atk;
  const foes=MB.u.filter(o=>o.k==='hero'&&o.team!==u.team&&!o.dead&&(typeof mbSeen!=='function'||mbSeen(o,u.team)));
  const near=r=>foes.filter(o=>mbDist(o,u)<r);
  const fight=B.mode==='fight'||B.mode==='defend'||B.mode==='order'&&B.focus&&B.focus.k==='hero';
  const f=B.focus&&B.focus.k==='hero'&&!B.focus.dead?B.focus:mbNearest(u,foes,500);
  const low=u.hp<u.max*0.4;
  switch(id){
    case 'cleanse':if((s.stun>0.4||s.taunt>0.4||s.root>0.4||s.bub>0.4||s.slow>0.8&&s.slowK>=0.3)&&near(500).length)mbSpellCast(u);break;
    case 'dash':
      if(B.mode==='retreat'&&low&&near(260).length)mbSpellCast(u,u.home);   // בורח הביתה
      else if(fight&&f&&f.hp<f.max*0.3&&u.hp>u.max*0.4){const g=mbDist(u,f)-f.r-u.r;if(g>A.range+40&&g<A.range+L.dash.range)mbSpellCast(u,f)}   // רודף אחרי מי שכמעט מת
      break;
    case 'haste':
      if(B.mode==='retreat'&&near(300).length||fight&&f&&mbDist(u,f)-f.r-u.r>A.range+80&&mbDist(u,f)<520)mbSpellCast(u);break;
    case 'barrier':if(near(320).length&&(fight||low)&&(u.hp<u.max*0.6||(u.hurtT||-9)>MB.t-0.6))mbSpellCast(u);break;
    case 'exhaust':{const t=mbNearest(u,foes,L.exhaust.range);if(t&&(fight||low)&&(u.hp<u.max*0.6||t.hp<t.max*0.5))mbSpellCast(u);break}
    case 'reveal':{   // נכנס לשיח מולי, או קרב: חושפים איפה שהוא, כדי שלא יברח לשיח
      const hid=typeof mbInBush==='function'&&foes.find(o=>mbDist(o,u)<L.reveal.range&&mbInBush(o));
      const t=hid||(fight&&f&&mbDist(u,f)<L.reveal.range&&f.hp<f.max*0.6?f:null);if(t)mbSpellCast(u,{x:t.x,y:t.y});break}
  }
}

/* ---- מסך הבנייה: אחרי בחירת הגיבור בחלון #mbWin (mobaOpen ב-moba.js) ---- */
function mbBuildOpen(kit,tab){
  const w=$('mbWin'),K=MBKIT[kit];if(!K)return;tab=tab||w.dataset.tab||MB_BUILD[0].id;if(!MB_BUILD.some(b=>b.id===tab))tab=MB_BUILD[0].id;
  w.dataset.mode='build';w.dataset.bkit=kit;w.dataset.tab=tab;   // bkit ולא kit: [data-kit] על החלון עצמו נתפס כבחירת גיבור (הבודק, 7.11)
  w.innerHTML=winHead(T('mb.build'),T('mb.k.'+kit)+(MB_BUILD.length>1?'':' · '+T('mb.bt.'+tab)))+
    (MB_BUILD.length>1?'<div class="mbbtabs" role="tablist">'+MB_BUILD.map(b=>'<button role="tab" data-btab="'+b.id+'" aria-selected="'+(b.id===tab)+'">'+T('mb.bt.'+b.id)+'</button>').join('')+'</div>':
      '')+
    '<div class="mbbody" style="--dt:'+dtCol(K.dt)+'">'+MB_BUILD.find(b=>b.id===tab).html(kit)+'</div>'+
    '<div class="mbbtns"><button class="lang" data-bact="back">'+T('mb.bBack')+'</button><button class="go" data-bact="go">'+T('mb.bGo')+'</button></div>';
}
// לשונית הלחש: שישה כפתורים בטור אחד, וההסבר של הנבחר בטור השני
function mbBuildSpell(kit){
  const cur=mbSpellGet(kit),L=MBSPELL.list;
  return '<div class="mbsps">'+Object.keys(L).map(id=>'<button data-b="'+id+'" class="'+(id===cur?'on':'')+'" aria-pressed="'+(id===cur)+'" style="--dt:'+L[id].col+'">'+mbSpellPic(L[id].pic,id)+'<span>'+T('mb.sp.'+id)+'</span></button>').join('')+'</div>'+
    '<div class="mbspd" style="--dt:'+L[cur].col+'"><span class="mbspi">'+mbSpellPic(L[cur].pic,cur)+'</span><h4>'+T('mb.sp.'+cur)+'</h4><p>'+T('mb.spD.'+cur)+'</p><small>'+T('mb.spCd',L[cur].cd)+'</small>'+
    '<p class="mbsph"><b>'+mbSpellPic(MBSPELL.heal.pic,'heal')+'</b>'+T('mb.healD')+'</p></div>';
}
$('mbWin').addEventListener('click',e=>{
  const w=$('mbWin');if(w.dataset.mode!=='build')return;const kit=w.dataset.bkit;
  const b=e.target.closest('[data-b]'),t=e.target.closest('[data-btab]'),a=e.target.closest('[data-bact]');
  if(t){sfx('tap');mbBuildOpen(kit,t.dataset.btab);return}
  if(b){const T0=MB_BUILD.find(x=>x.id===w.dataset.tab);if(T0&&T0.pick(kit,b)){sfx('tap');mbBuildOpen(kit)}return}
  if(!a)return;sfx('ui');
  if(a.dataset.bact==='go')mobaStart(kit);else mobaOpen();
});
