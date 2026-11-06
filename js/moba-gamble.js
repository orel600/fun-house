/* משחקי השאול: חדר ההימור (אוראל, 6.11.2026, במקום זהב הקאמבק ×1.4. התוכנית: docs/moba-plan.md פרק 1)
   קשת עם טבעת על הרצפה, באמצע שביל העקיפה העליון (x=0: אותו מרחק משני הבסיסים). סגור עד unlock, ואחר כך פעם אחת לכל קבוצה.
   נכנס רק הגיבור עם הכי מעט שווי (זהב + מחיר החפצים) בקבוצה שיש לה פחות שווי. בשוויון בין הקבוצות: אף אחד. כל השאר נדחפים החוצה.
   הכניסה: roll שניות של מתח (גלגל מעל הראש, הגיבור לא זז), ואז 50/50:
   ניצחון: בדיוק מספיק זהב כדי להשתוות לעשיר ביותר במשחק. הפסד: החדר הורג אותו, בלי זהב, XP או נקודה לאויב, וחוזר בזמן הרגיל.
   מת באמצע? ההטלה עדיין קובעת: זוכה מקבל את הזהב, מפסיד נשאר מת. משחק שנגמר באמצע: ההטלה לא נגמרת (mobaUpdate נעצר).
   החיבור: mbGambleTick ב-mobaUpdate, mbGambleDraw ו-mbGambleTop ב-mobaDraw, mbGambleMini במפה הקטנה, mbGambleBot ב-mbThink.
   בתלת-ממד: הקשת נבנית כאן (עוטף את render3d, כמו moba3d.js) */
const MBGAMBLE={
  unlock:380,          // שניות: כ-60% ממשחק ממוצע (כ-10:30)
  uses:1,              // כמה פעמים לכל קבוצה במשחק
  win:0.5,             // הסיכוי לנצח
  at:{x:0,y:-480},r:56,// המקום והרדיוס של הטבעת
  roll:2,              // שניות של מתח
  push:30,             // כמה רחוק מעבר לטבעת נדחף מי שאסור לו
  say:2.5,             // שניות בין הודעות "אסור" לשחקן
  bot:{p:0.5,gap:300,every:20},   // בוט זכאי: אם הקבוצה שלו מאחור לפחות gap, בסיכוי p הולך לחדר. מחליט מחדש כל every שניות
};
MOBA.feed.src.push('gamble');
MB_SVG.dice={f:'M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM6.4 8a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0zM14.4 8a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0zM10.4 12a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0zM6.4 16a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0zM14.4 16a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0z',eo:1};MB_SVG.coin={f:'M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0z M7 12a5 5 0 1 0 10 0a5 5 0 1 0 -10 0z',eo:1};   // האייקונים של החדר (mbIcon ב-moba-look.js)   // הודעת ההריגה: "חדר ההימור" כמי שהפיל
const mbWorth=u=>(u.gold||0)+(u.it||[]).reduce((s,id)=>s+MBITEM.items[id].cost,0);
const mbTeamWorth=tm=>mbHeroes(tm).reduce((s,h)=>s+mbWorth(h),0);
const mbGb=()=>MB.gb||(MB.gb={open:false,used:[0,0],roll:null,say:0});
const mbGbOpen=()=>MB.t>=MBGAMBLE.unlock;
// הקבוצה שמאחור (null בשוויון), והגיבור הזכאי בה (null אם אין, או שהקבוצה כבר השתמשה)
function mbGbTeam(){const a=mbTeamWorth(0),b=mbTeamWorth(1);return Math.abs(a-b)<1?null:a<b?0:1}
function mbGbWho(){
  const G=mbGb(),tm=mbGbTeam();if(tm===null||G.used[tm]>=MBGAMBLE.uses)return null;
  return mbHeroes(tm).reduce((a,h)=>!a||mbWorth(h)<mbWorth(a)?h:a,null);
}
const mbGbName=u=>u.me?T('mb.you'):T(u.team===MB.me.team?'mb.gb.ally':'mb.gb.foe',T('mb.k.'+u.kit));
function mbGbFeed(u,txt){   // שורה בהודעות ההריגה: הגיבור ומה קרה לו
  const f=$('mbFeed');if(!f)return;const row=document.createElement('p');row.className='mbfr'+(u.me?' mine':'');
  row.innerHTML='<span class="mbfh t'+u.team+'">'+mbSvg('k_'+u.kit)+'<em>'+mbGbName(u)+'</em></span><span class="mbfh"><em>'+txt+'</em></span>';
  f.appendChild(row);while(f.children.length>MOBA.feed.max)f.firstChild.remove();setTimeout(()=>row.remove(),MOBA.feed.t*1000);
}
function mbGambleTick(M,dt){
  const G=mbGb(),A=MBGAMBLE,c=A.at;G.say-=dt;
  if(!G.open&&mbGbOpen()){G.open=true;mbBanner(T('mb.gb.open'),C.gold);sfx('bell');const w=mbGbWho();if(w&&w.me)setTimeout(()=>{if(S.mb===M)mbBanner(T('mb.gb.you'),C.gold)},1600)}
  // הטלה: הגיבור מקובע במקום, ובסוף מתגלה התוצאה (שנקבעה בכניסה)
  const R=G.roll;
  if(R){const u=R.u;R.t-=dt;
    if(!u.dead){u.x=R.x;u.y=R.y;u.moving=false;u.st.dash=null;u.recall=null}
    const tick=Math.floor((A.roll-R.t)*(6-2*(A.roll-R.t)/A.roll));if(tick!==R.tick){R.tick=tick;if(R.t>0.15)sfx('tap')}   // תקתוק שמאט
    if(R.t<=0){G.roll=null;mbGbDone(u,R.win)}}
  // מי שבתוך הטבעת: הזכאי נכנס, כל השאר נדחפים
  for(const u of M.u){if(u.k!=='hero'||u.dead||G.roll&&G.roll.u===u)continue;
    const dx=u.x-c.x,dy=u.y-c.y,d=Math.hypot(dx,dy);if(d>=A.r+u.r*0.5)continue;
    const open=mbGbOpen(),who=open&&!G.roll?mbGbWho():null;
    if(who===u){G.used[u.team]++;G.roll={u,t:A.roll,x:u.x,y:u.y,win:Math.random()<A.win,tick:-1};
      if(u.bot)u.bot.gb=0;mbBanner(u.me?T('mb.gb.rollMe'):T('mb.gb.roll',mbGbName(u)),u.team===M.me.team?C.gold:C.blood);mbGbFeed(u,T('mb.gb.in'));continue}
    const a=d>0.5?Math.atan2(dy,dx):Math.PI/2,k=A.r+u.r+A.push-d;mbStep(u,Math.cos(a)*k,Math.sin(a)*k);
    if(u.me&&G.say<=0){G.say=A.say;sfx('tap');
      mbBanner(!open?T('mb.gb.locked',fmt(A.unlock)):G.roll?T('mb.gb.busy'):G.used[u.team]>=A.uses?T('mb.gb.used'):T('mb.gb.no'),C.dim)}}
}
// התוצאה: ניצחון = זהב עד העשיר ביותר במשחק. הפסד = מוות בלי פרס לאויב
function mbGbDone(u,win){
  const col=u.team===MB.me.team?C.gold:C.blood;
  if(win){const top=Math.max(...MB.u.filter(o=>o.k==='hero').map(mbWorth)),g=Math.max(0,top-mbWorth(u));
    mbGold(u,g);mbBoom(u.x,u.y,90,'fire');if(u.me){sfx('celebrate');celebrate(u.x,u.y,'gear')}else sfx('coin');
    mbBanner(u.me?T('mb.gb.winMe',Math.round(g)):T('mb.gb.win',mbGbName(u),Math.round(g)),col);mbGbFeed(u,T('mb.gb.won',Math.round(g)));return}
  mbBanner(u.me?T('mb.gb.loseMe'):T('mb.gb.lose',mbGbName(u)),u.team===MB.me.team?C.blood:C.gold);
  if(u.dead){mbGbFeed(u,T('mb.gb.lost'));return}   // כבר מת באמצע: נשאר מת
  // מוות כמו ב-mbDie, אבל בלי mbItDie, בלי XP, בלי נקודה ובלי הריגה לאף אחד
  u.hp=0;u.dead=true;u.deaths++;u.resp=mbResp(u);u.hitBy.clear();
  Object.assign(u.st,{stun:0,taunt:0,slow:0,wet:0,armor:0,burn:0,rage:0,imm:0,ice:0,dash:null,shield:0});
  if(u.me)sfx('hurt');mbKillFeed({k:'gamble'},u);mbBoom(u.x,u.y,80,'red');
}
// בוט זכאי שהקבוצה שלו מאחור הרבה: הולך לחדר בסיכוי p (מחליט פעם ב-every שניות). מחזיר true כשהבוט בדרך
function mbGambleBot(u){
  const G=mbGb(),B=u.bot,A=MBGAMBLE.bot;if(!mbGbOpen()||G.roll||mbGbWho()!==u){B.gb=0;return false}
  if(!B.gb||MB.t>=B.gbT){B.gbT=MB.t+A.every;B.gb=mbTeamWorth(1-u.team)-mbTeamWorth(u.team)>=A.gap&&Math.random()<A.p?1:-1}
  if(B.gb<0)return false;B.mode='gamble';B.focus=null;B.goal={x:MBGAMBLE.at.x,y:MBGAMBLE.at.y};B.stop=4;return true;
}

/* ---- ציור ---- */
// הרצפה: טבעת (אפורה ונעולה, או זהב פועם כשפתוח), ובדו-ממד גם הקשת. לפני היחידות
function mbGambleDraw(){
  const G=mbGb(),A=MBGAMBLE,{x,y}=A.at,open=mbGbOpen(),done=G.used[0]>=A.uses&&G.used[1]>=A.uses,t=MB.t,col=open&&!done?C.gold:'#8A8296';
  ctx.save();ctx.translate(x,y);ctx.scale(1,0.5);
  ctx.fillStyle=open&&!done?'rgba(244,199,79,'+(0.12+0.06*Math.sin(t*3))+')':'rgba(20,16,30,0.45)';ctx.beginPath();ctx.arc(0,0,A.r,0,7);ctx.fill();
  ctx.strokeStyle=col;ctx.lineWidth=4;ctx.setLineDash(open?[]:[10,8]);ctx.beginPath();ctx.arc(0,0,A.r,0,7);ctx.stroke();ctx.setLineDash([]);
  ctx.lineWidth=2;ctx.globalAlpha=0.6;ctx.beginPath();ctx.arc(0,0,A.r*0.62,t*(open?1.2:0),t*(open?1.2:0)+5);ctx.stroke();ctx.restore();
  if(!(typeof mb3dHere==='function'&&mb3dHere())){   // הקשת: שני עמודים וקורה. סגור = סורג
    ctx.fillStyle='#4B4058';ctx.fillRect(x-A.r-4,y-A.r*0.5-70,14,70);ctx.fillRect(x+A.r-10,y-A.r*0.5-70,14,70);
    ctx.fillStyle='#5E586C';ctx.fillRect(x-A.r-10,y-A.r*0.5-82,A.r*2+20,14);
    if(!open||done){ctx.strokeStyle='#2E2838';ctx.lineWidth=3;for(let i=1;i<6;i++){const bx=x-A.r+i*A.r/3;ctx.beginPath();ctx.moveTo(bx,y-A.r*0.5-68);ctx.lineTo(bx,y-A.r*0.5);ctx.stroke()}}
  }
  mbIcon('dice',x,y-A.r*0.5-104,30,col);
}
// מעל הכל: הגלגל שמסתובב מעל הגיבור בזמן ההטלה, והתוצאה ברגע האחרון
function mbGambleTop(){
  const R=MB.gb&&MB.gb.roll;if(!R)return;const u=R.u,A=MBGAMBLE,k=1-R.t/A.roll,x=u.x+(DIR==="rtl"?-78:78),y=u.y-50,r=26;   // לצד הגיבור: מעליו מסתתר מאחורי ההודעה
  const spin=(A.roll-R.t)*(14-10*k),last=R.t<0.35;   // מאט לקראת הסוף
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='rgba(14,16,26,0.85)';ctx.beginPath();ctx.arc(0,0,r+5,0,7);ctx.fill();
  for(let i=0;i<8;i++){ctx.fillStyle=i%2?C.gold:C.blood;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,spin+i*Math.PI/4,spin+(i+1)*Math.PI/4);ctx.fill()}
  ctx.strokeStyle=C.chalk;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.stroke();
  ctx.fillStyle=C.chalk;ctx.beginPath();ctx.moveTo(0,-r-2);ctx.lineTo(-6,-r-12);ctx.lineTo(6,-r-12);ctx.fill();   // המחוג
  if(last){ctx.fillStyle=R.win?C.gold:C.blood;ctx.beginPath();ctx.arc(0,0,r*0.55,0,7);ctx.fill();mbIcon(R.win?'coin':'skull',0,0,22,'#fff')}
  ctx.restore();
}
// המפה הקטנה: קוביה (אפורה כשנעול או כשנגמר, זהב כשפתוח)
function mbGambleMini(sx,sy){
  const G=mbGb(),A=MBGAMBLE,live=mbGbOpen()&&!(G.used[0]>=A.uses&&G.used[1]>=A.uses),x=sx(A.at.x),y=sy(A.at.y);
  ctx.fillStyle=live?C.gold:'#6E6878';ctx.strokeStyle='#0B0D14';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(x,y-4.5);ctx.lineTo(x+4.5,y);ctx.lineTo(x,y+4.5);ctx.lineTo(x-4.5,y);ctx.closePath();ctx.fill();ctx.stroke();
  if(G.roll){ctx.strokeStyle=C.gold;ctx.beginPath();ctx.arc(x,y,6+2*Math.sin(MB.t*10),0,7);ctx.stroke()}
}

/* ---- תלת-ממד: הקשת (עמודים, קורה, סורג שיורד כשנעול וגביש זהב) ---- */
const MBGB3={g:null,mb:null};
function mbGamble3d(){
  const on=typeof mb3dOn==='function'&&mb3dOn()&&S&&S.mb;
  if(!on){if(MBGB3.g)MBGB3.g.visible=false;return}
  if(!MBGB3.g){const A=MBGAMBLE,g=new THREE.Group(),k=1/COS(),c=MB3D.col,H=90*k,w=A.r;
    for(const sx of [-1,1]){p3Mesh(p3Cyl(9,12,H,6),p3Mat(c.dark),sx*w,H/2,-w*0.4,g);p3Mesh(p3Cyl(13,13,8,6),p3Mat(c.iron),sx*w,H,-w*0.4,g)}
    p3Mesh(p3Box(w*2+30,12,16),p3Mat(c.stone),0,H+8,-w*0.4,g);
    const bars=new THREE.Group();for(let i=1;i<6;i++)p3Mesh(p3Box(3,H,3),p3Mat(c.iron),-w+i*w/3,H/2,-w*0.4,bars);g.add(bars);
    const gem=p3Mesh(new THREE.OctahedronGeometry(12,0),new THREE.MeshBasicMaterial({color:C.gold,toneMapped:false}),0,H+34,-w*0.4,g),halo=p3Halo(C.gold,60,H+34,g);
    g.userData={bars,gem,halo,H};MBGB3.g=g;p3At(g,A.at.x,A.at.y,R3D.scene)}
  const g=MBGB3.g,u=g.userData,G=mbGb(),A=MBGAMBLE,open=mbGbOpen(),done=G.used[0]>=A.uses&&G.used[1]>=A.uses,t=performance.now()/1000;
  g.visible=true;u.bars.visible=!open||done;u.gem.rotation.y=t*1.5;u.gem.visible=u.halo.visible=open&&!done;
}
(function(){const base=window.render3d;window.render3d=function(...a){try{mbGamble3d()}catch(e){console.error(e)}return base.apply(this,a)}})();
