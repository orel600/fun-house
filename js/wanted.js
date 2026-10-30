/* המבוקש: דמות שמופיעה אחרי שמועה, בורחת מהשחקן ומפילה שלל, מזבל ועד אוצר. אם לא מפילים אותו מהר, הוא בורח */

const WANTED={
  first:[30,50], every:[45,75],               // מתי מגיעה השמועה: הראשונה, ואחרי כל מבוקש
  rumor:[5,8], hint:0.5,                      // כמה שניות מהשמועה עד שהוא מופיע, וכמה הרמז לכיוון לא מדויק (רדיאנים)
  life:14, hp:70, speed:120, keep:170,        // שניות עד שהוא בורח, חיים (גדלים עם הזמן כמו אויב רגיל), מהירות, ומאיזה מרחק הוא בורח מהשחקן
  panic:3,                                    // בשניות האחרונות הוא רץ מהר יותר והטבעת מאדימה
  drop:{coins:[1,15],cloth:[0.5,2]},          // מה הוא מפיל תמיד לשלל של הריצה, {משאב:[סיכוי, כמה]} (המשאבים ב-RES)
  // הוא נושא האוצר של המשחק: התיבה שלו מפילה אבנים, והאוצר אבנים מושלמות.
  // הסיכויים אמיתיים ונסכמים ל-1. orbs: כמה XP נופל. heal: כמה חיים חוזרים. res: משאבים, בעיקר אבנים נדירות.
  // השמות ב-lang.js תחת 'loot.<key>', השמועות תחת 'wanted.rumors', ופריטי הזבל תחת 'loot.junkItems'
  loot:[
    {chance:0.5, key:'junk', items:true, orbs:2, heal:0, col:C.dim},
    {chance:0.3, key:'coins', orbs:12, heal:0, col:C.chalk},
    {chance:0.15, key:'chest', orbs:25, heal:40, col:C.gold, res:{gem:[0.4,1],ruby:[0.3,1],sapphire:[0.3,1],bolt:[0.3,1],aqua:[0.3,1],amber:[0.3,1],cloth:[1,3]}},
    {chance:0.05, key:'treasure', orbs:50, heal:999, col:C.gold, party:true, res:{rubyF:[0.3,1],sapphireF:[0.3,1],boltF:[0.3,1],aquaF:[0.3,1],amberF:[0.3,1],star:[0.5,1],gold:[1,3],mythril:[0.5,1]}}
  ]
};

function wantedReset(){
  S.wn={t:rand(...WANTED.first),rumor:null,e:null,seen:0,caught:0,escaped:0,got:[]};
}

function wantedUpdate(dt){
  const wn=S.wn;
  if(wn.e){
    const e=wn.e;
    if(e.dead){wn.e=null;wn.t=rand(...WANTED.every);return}   // נתפס, והשלל כבר נפל ב-wantedDown
    e.life-=dt;
    if(e.life<=0){e.dead=true;wn.e=null;wn.escaped++;wn.t=rand(...WANTED.every);sparks(e.x,e.y,C.dim,16,260);banner(T('wanted.gone'),C.dim)}
    return;
  }
  if(wn.rumor){
    wn.rumor.t-=dt;
    if(wn.rumor.t<=0){wantedAppear(wn.rumor.a);wn.rumor=null}
    return;
  }
  if(S.boss)return;
  wn.t-=dt;
  if(wn.t<=0){wn.rumor={a:rand(0,6.28),t:rand(...WANTED.rumor)};banner(pick(T('wanted.rumors')),C.gold)}
}
function wantedAppear(a){
  const d=rand(220,300),aa=a+rand(-WANTED.hint,WANTED.hint),k=runK();
  const e={type:'wanted',wanted:true,x:P.x+Math.cos(aa)*d,y:P.y+Math.sin(aa)*d,hp:WANTED.hp*k,max:WANTED.hp*k,r:13,speed:WANTED.speed,
    mult:{},xp:0,dmg:0,flash:0,kx:0,ky:0,ph:0,told:false,life:WANTED.life,turn:0,side:1};
  enemies.push(e);S.wn.e=e;S.wn.seen++;
  sparks(e.x,e.y,C.gold,16,220);banner(T('wanted.here'),C.gold);
}
/* בורח כשמתקרבים אליו, אבל לא מתרחק יותר מדי, כדי שאפשר יהיה לרדוף. מחליף צד בלי התראה, כדי שלא יהיה צפוי */
function wantedMove(e,dt){
  const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;
  e.turn-=dt;if(e.turn<=0){e.turn=rand(0.8,2);e.side=Math.random()<0.5?-1:1}
  const out=d<WANTED.keep?1:d>WANTED.keep*1.8?-0.6:0.2;
  const mx=dx/d*out-dy/d*e.side,my=dy/d*out+dx/d*e.side,m=Math.hypot(mx,my)||1,sp=e.speed*(e.life<WANTED.panic?1.5:1);
  e.x+=mx/m*sp*dt+e.kx*dt;e.y+=my/m*sp*dt+e.ky*dt;
  const f=Math.max(0,1-dt*9);e.kx*=f;e.ky*=f;e.ph+=dt*sp*0.08;e.flash-=dt;
}
function wantedDown(e){
  const wn=S.wn;wn.caught++;
  let r=Math.random(),L=WANTED.loot[WANTED.loot.length-1];
  for(const l of WANTED.loot){r-=l.chance;if(r<=0){L=l;break}}
  const name=T('loot.'+L.key)+(L.items?': '+pick(T('loot.'+L.key+'Items')):'');wn.got.push(name);
  for(let i=0;i<L.orbs;i++){const a=rand(0,6.28),rr=rand(8,60);orbs.push({x:e.x+Math.cos(a)*rr,y:e.y+Math.sin(a)*rr,v:1})}
  if(L.heal)P.hp=Math.min(P.maxHp,P.hp+L.heal);
  if(L.res)runGive(L.res,e.x,e.y-e.r-20);   // לשלל של הריצה (village.js)
  banner(name,L.col);
  sfx(L.party||L.heal?'celebrate':'coin');
  if(L.party){sparks(e.x,e.y,C.gold,40,320);S.shake=Math.max(S.shake,12);S.slow=0.7}
  else sparks(e.x,e.y,L.col,14,240);
}

/* ---- ציור ---- */
function drawWanted(e){
  const fl=e.flash>0,p=pose(e.x,e.y,e.ph,true,null),k=Math.max(0,e.life/WANTED.life);
  // טבעת הזמן מתחת לרגליים: כמה נשאר עד שהוא בורח
  ctx.strokeStyle=e.life<WANTED.panic?C.blood:'rgba(244,199,79,0.45)';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(e.x,e.y+19,20,7,0,-Math.PI/2,-Math.PI/2+Math.PI*2*k);ctx.stroke();
  if(R3D.on)return;   // בתלת-ממד השודד עצמו מצויר בשכבה שמתחת
  drawRig(p,{skin:LOOK.wanted,col:fl?'#fff':C.gold,lw:fl?3.5:2.5});
  // מסכת שודד ושק שלל על הגב
  const h=p.head,s=p.body[0];
  ctx.strokeStyle=C.ink;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(h.x-6,h.y-1);ctx.lineTo(h.x+6,h.y-1);ctx.stroke();
  ctx.fillStyle='#8A6A17';ctx.strokeStyle=fl?'#fff':C.gold;ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x-9,s.y+4,7,0,7);ctx.fill();ctx.stroke();
}
function drawWantedScreen(ox,oy){
  const wn=S.wn;if(S.room)return;
  if(wn.e)edgeArrow(wn.e.x+ox,wn.e.y+oy,C.gold,1.4);
  else if(wn.rumor){   // הרמז: חץ מהבהב לכיוון בערך
    ctx.globalAlpha=Math.floor(S.t*4)%2?0.85:0.3;
    edgeArrow(P.x+Math.cos(wn.rumor.a)*3000+ox,P.y+Math.sin(wn.rumor.a)*3000+oy,C.gold,1.4);
    ctx.globalAlpha=1;
  }
}
