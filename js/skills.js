/* סקילים וקומבו (הרעיון של אוראל, 30.10.2026): עד 3 כפתורי סקיל בצד ימין, ולכל סקיל סוג נזק.
   הסקיל הראשון מגיע מהנשק, והשאר משדרוגים בזירה (UPS ב-data.js). כל סקיל נטען מחדש אחרי שימוש.
   קומבו: אויב שכבר נפגע מסוג אחד ונפגע עכשיו מסוג אחר. עובד גם עם המכות של הנשק. נקרא מ-onHit (dmg.js):
     רטוב ואז ברק = חשמול: הברק קופץ לכל הרטובים מסביב.  רטוב ואז קרח = קפוא: עומד במקום.
     אש ואז קרח, או קפוא/מואט ואז אש = נמס: נזק כפול.     קפוא ואז אדמה = הלם. גם בוס, אבל אז הוא חסין להלם לזמן מה.
   כך ההלם הוא שלושה שלבים בסדר נכון (מים, קרח, אדמה) לפני שהקיפאון נגמר. רק בזירה.
   השמות ב-lang.js: 'sk.<id>' לסקילים, 'combo.<סוג>' למילה שקופצת, 'up.k_<id>' לכרטיס השדרוג */
const SKILLS={
  max:3,
  // הסקיל שכל סוג נשק נותן (WEAPONS ב-weapons.js)
  weapon:{sword:'quake',axe:'quake',hammer:'quake',bow:'zap',staff:'splash',wand:'splash'},
  /* הסקילים. dt: סוג הנזק. cd: שניות עד שאפשר שוב. dmg: כמה נזק, כפול הנזק של הנשק שביד.
     r: טבעת סביב הדמות שפוגעת בכל מי שבתוכה. zap: פוגע באויב הקרוב (עד range) ובעוד n אויבים לידו (עד hop) */
  list:{
    quake: {dt:'earth',cd:7,dmg:2,r:130},
    splash:{dt:'water',cd:6,dmg:0.6,r:170},
    frost: {dt:'ice',cd:8,dmg:1,r:150},
    flame: {dt:'fire',cd:6,dmg:1.4,r:120},
    zap:   {dt:'lightning',cd:5,dmg:2.5,range:380,n:3,hop:200}
  },
  /* הקומבו. shock: חלק מהנזק לכל רטוב עד r. freeze: שניות קפוא (לבוס: כפול boss, והוא לא נעצר, רק מסומן).
     melt: מכפיל הנזק. stun: שניות הלם, לבוס boss שניות ואז bossCd שניות חסין. gap: לא מציגים את אותה מילה פעמיים בפחות מזה */
  combo:{
    shock:{k:0.8,r:260,col:'#D46BFF'},
    freeze:{t:2,boss:0.5,col:'#7FE3FF'},
    melt:{k:2,col:'#FF8A3D'},
    stun:{t:2.5,boss:1.5,bossCd:20,col:'#FFD84D'},
    gap:0.35
  }
};

const skArena=()=>S&&!S.vil&&!S.wd&&!S.room;
const skHere=()=>skArena()||!!(S&&S.wd&&!S.room);   // איפה הכפתורים והחפצים המסתובבים פועלים: בזירה, וגם בעולם הפתוח (wskill.js)
const skDef=id=>SKILLS.list[id];
// הנזק שסקיל מתחיל ממנו: הנזק של הנשק שביד, עם השדרוגים והרמה של הריצה
const skBase=()=>(P.weapon==='sword'?P.sw.dmg:P.gn.dmg)*wK('dmg')*dmgK();
// אפשר לקבל את הסקיל הזה משדרוג? רק אם עוד אין אותו ויש משבצת פנויה
const skillCan=id=>!!S.sk&&!S.sk.ids.includes(id)&&S.sk.ids.length<SKILLS.max;
function skillAdd(id){if(!skillCan(id))return;S.sk.ids.push(id);S.sk.cd.push(0)}

// בתחילת כל ריצה: הסקיל של הנשק
function skillsReset(){
  S.sk={ids:[],cd:[],fx:[],combos:{},last:{},used:0};
  const w=SKILLS.weapon[P.wt];if(w){S.sk.ids.push(w);S.sk.cd.push(0)}
}
function skillsUpdate(dt){
  const k=S.sk;
  // נשק שהוחלף באמצע ריצה (מסך הציוד) מחליף גם את הסקיל שלו
  const w=SKILLS.weapon[P.wt];if(w&&k.ids[0]!==w&&!k.ids.includes(w)){k.ids[0]=w;k.cd[0]=0}
  for(let i=0;i<k.cd.length;i++)k.cd[i]=Math.max(0,k.cd[i]-dt);
  for(const f of k.fx)f.t+=dt;
  k.fx=k.fx.filter(f=>f.t<f.max);
}
function skillUse(id){
  const k=S.sk,i=k?k.ids.indexOf(id):-1;
  if(i<0||k.cd[i]>0||S.mode!=='play'||!skArena())return false;
  const D=skDef(id),base=skBase()*D.dmg,col=dtCol(D.dt);
  if(D.range){   // ברק: האויב הקרוב, וממנו קופץ הלאה
    const tgt=nearest(D.range);if(!tgt)return false;
    const hit=[tgt],near=enemies.filter(e=>!e.dead&&e!==tgt&&Math.hypot(e.x-tgt.x,e.y-tgt.y)<D.hop).sort((a,b)=>Math.hypot(a.x-tgt.x,a.y-tgt.y)-Math.hypot(b.x-tgt.x,b.y-tgt.y));
    hit.push(...near.slice(0,D.n));
    let from=P;for(const e of hit){skLine(from,e,col);damage(e,base,'skill',Math.atan2(e.y-from.y,e.x-from.x),D.dt);from=e}
  }else{   // טבעת סביב הדמות
    k.fx.push({ring:1,x:P.x,y:P.y,r:D.r,t:0,max:0.35*fluteK(),col});
    for(const e of enemies){if(e.dead)continue;const dx=e.x-P.x,dy=e.y-P.y;if(Math.hypot(dx,dy)-e.r>D.r)continue;damage(e,base,'skill',Math.atan2(dy,dx),D.dt)}
  }
  k.cd[i]=D.cd;k.used++;sfx('shoot');S.shake=Math.max(S.shake,3);
  return true;
}
const skLine=(a,b,col)=>S.sk.fx.push({line:1,ax:a.x,ay:a.y-6,bx:b.x,by:b.y-6,t:0,max:0.18*fluteK(),col});

/* ---- קומבו: נקרא מ-onHit לפני שסוג הנזק של המכה הזו משאיר את הסימן שלו ---- */
function comboHit(e,d,base,w,t,ang,chained){
  const K=SKILLS.combo;
  if(t==='lightning'&&e.wet>0&&!chained){
    e.wet=0;comboShow(e,'shock');
    for(const o of enemies){if(o===e||o.dead||!(o.wet>0)||Math.hypot(o.x-e.x,o.y-e.y)>K.shock.r)continue;
      o.wet=0;skLine(e,o,K.shock.col);damage(o,base*K.shock.k,w,ang,'lightning',true)}
  }
  if(t==='ice'&&e.wet>0){e.wet=0;e.frozen=K.freeze.t*(e.isBoss?K.freeze.boss:1);comboShow(e,'freeze')}
  else if((t==='ice'&&e.burn)||(t==='fire'&&(e.frozen>0||e.slow>0))){
    const extra=d*(K.melt.k-1);e.hp-=extra;e.burn=null;e.frozen=0;e.slow=0;
    floatText(e.x+rand(-8,8),e.y-e.r-8,big(extra),K.melt.col,18,true);comboShow(e,'melt');
  }
  if(t==='earth'&&e.frozen>0){
    e.frozen=0;
    if(e.isBoss){if(S.t<(e.stunReady||0))return;e.stun=K.stun.boss;e.stunReady=S.t+K.stun.bossCd}
    else e.stun=K.stun.t;
    comboShow(e,'stun');sfx('celebrate');
  }
}
// המילה הגדולה מעל האויב, וספירה (בשביל הבוט)
function comboShow(e,kind){
  const k=S.sk;if(!k)return;k.combos[kind]=(k.combos[kind]||0)+1;
  if(S.t-(k.last[kind]??-9)<SKILLS.combo.gap)return;k.last[kind]=S.t;
  floatText(e.x,e.y-e.r-30,T('combo.'+kind),SKILLS.combo[kind].col,20,false,true);
}

/* ---- ציור: הטבעות והברקים של הסקילים, והסימן של מצב מעל אויב (רטוב, קפוא, הלם) ---- */
function drawSkills(ox,oy){
  if(!S.sk)return;
  const fl=fluteOn();
  for(const f of S.sk.fx){const k=f.t/f.max;ctx.globalAlpha=1-k;ctx.strokeStyle=f.col;
    if(fl){f.ring?fluteRing(f,k):fluteLine(f,k);continue}   // הנודד עם החליל: חלילים מסתובבים וחמשה (flute.js)
    if(f.ring){ctx.lineWidth=10*(1-k)+2;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(0.35+0.65*k),0,7);ctx.stroke()}
    else{ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(f.ax,f.ay);
      for(let i=1;i<6;i++){const p=i/6;ctx.lineTo(f.ax+(f.bx-f.ax)*p+rand(-7,7),f.ay+(f.by-f.ay)*p+rand(-7,7))}
      ctx.lineTo(f.bx,f.by);ctx.stroke()}}
  ctx.globalAlpha=1;
  for(const e of enemies){
    if(e.dead||!(e.wet>0||e.frozen>0||e.stun>0.3)||!onScreen(e.x+ox,e.y+oy))continue;
    const y=e.y-e.r-14;
    if(e.frozen>0){ctx.strokeStyle=SKILLS.combo.freeze.col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,e.r+5,0,7);ctx.stroke();dtIcon(e.x,y,'ice',13)}
    else if(e.wet>0)dtIcon(e.x,y,'water',11);
    if(e.stun>0.3){ctx.fillStyle=SKILLS.combo.stun.col;for(let i=0;i<3;i++){const a=S.t*6+i*2.09;ctx.beginPath();ctx.arc(e.x+Math.cos(a)*12,y-6+Math.sin(a)*4,3,0,7);ctx.fill()}}
  }
}

/* ---- הכפתורים: בצד ימין למטה, בזירה ובעולם (בעולם הם מכוונים ויורים, wskill.js). כל כפתור בצבע סוג הנזק, ומתמלא בזמן שהוא נטען ---- */
let skKey='';
function skillsHud(){
  const box=$('skills'),on=!!S.sk&&skHere()&&S.mode==='play'&&S.sk.ids.length>0;
  box.hidden=!on;if(!on)return;
  const key=LANG+'|'+S.sk.ids.join(',');
  if(key!==skKey){skKey=key;
    box.innerHTML=S.sk.ids.map(id=>'<button class="skb" data-sk="'+id+'" style="--dt:'+dtCol(skDef(id).dt)+'" aria-label="'+T('sk.'+id)+'">'+dtSvg(skDef(id).dt)+'<i></i></button>').join('')}
  S.sk.ids.forEach((id,i)=>{const b=box.children[i],v=String(Math.round(20*S.sk.cd[i]/skDef(id).cd)/20);
    if(b.dataset.cd!==v){b.dataset.cd=v;b.style.setProperty('--cd',v);b.classList.toggle('ready',v==='0')}});
}
$('skills').addEventListener('pointerdown',e=>{const b=e.target.closest('[data-sk]');if(!b)return;e.preventDefault();e.stopPropagation();skillUse(b.dataset.sk)});
$('skills').addEventListener('keydown',e=>{const b=e.target.closest('[data-sk]');if(b&&(e.key==='Enter'||e.key===' ')){e.preventDefault();skillUse(b.dataset.sk)}});
// במקלדת: 1, 2, 3
addEventListener('keydown',e=>{const n=/^Digit([1-3])$/.exec(e.code);if(n&&S&&S.sk&&e.target===document.body)skillUse(S.sk.ids[n[1]-1])});
