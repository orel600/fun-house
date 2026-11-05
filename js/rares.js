/* מפלצות נדירות (ניר, 5.11.2026: "הייתי שמח אם הדרישות זה לצוד מפלצות נדירות שקשה למצוא"). משימה ת8 ב-roadmap.md.
   לכל אזור בעולם 1-2 מפלצות נדירות: גרסה זוהרת של אויב קיים, עם שם, חומרים (tags) ושלל משלה.
   בכל כניסה לאזור יש סיכוי נמוך שאחת מהן שם, באחד מ-2-3 מקומות נסתרים (spots), לזמן מוגבל. בלי חץ. הרמזים:
     ניצוצות על הקרקע סביב המקום, שמועה קצרה בכניסה ("ראו משהו זוהר ליד המחצבה"), ופיוחו יכולה להריח אותה (petscent.js).
   הריגה: שלל מיוחד, נרשמת בספר ההרפתקאות (כל נדירה היא סוג ב-ETYPES, אז book.js רושם אותה לבד) ובשם ובמשפט שלה (FOELORE, foelore.js).
   קווסט הדרגה (rank1 ב-quests.js) סופר כמה נדירות שונות כבר צדת (rareKinds).
   המקומות לפי אזור, בנתונים: כשהעולם גדל (docs/plan-world-terrain.md) מזיזים רק את spots כאן.
   החיבור: rareEnter ב-enterWorld, rareUpdate ב-worldUpdate, rareMove ב-wFoes ו-rareDraw בציור העולם (world.js).
   נשמר ב-SAVE.rares: {got:{id:כמה}, miss}. הטקסטים ב-lang.js: 'fl.<id>' (שם ומשפט), 'rare.at.<מקום>' ו-'rare.*' */
const RARES={
  chance:0.22,          // הסיכוי שנדירה מחכה באזור, בכל כניסה
  pity:0.08,            // ועוד כך בכל כניסה בלי נדירה, כדי שלא יעבור יותר מדי זמן (מתאפס כשאחת מופיעה)
  life:150,             // כמה שניות היא נשארת לפני שהיא נעלמת (אלא אם כבר נלחמים בה)
  roam:70,              // כמה רחוק מהמקום שלה היא מסתובבת
  leash:300,            // כמה רחוק מהמקום שלה היא רודפת
  hp:6, dmg:1.4, size:1.3,   // פי כמה מהאויב שהיא מבוססת עליו (גם hp של האזור)
  sparkle:{r:150,n:9},  // הניצוצות על הקרקע: ברדיוס הזה סביב המקום (לא בדיוק עליו), וכמה
  rumorAt:7,            // שניות אחרי הכניסה עד השמועה. אחרי PACE.hush (pacing.js), אחרת היא נבלעת בהודעות של הכניסה
  sniff:25,             // פיוחו מריחה אותה אחרי לכל היותר כך שניות באזור (petscent.js)
  icon:'✨', col:'#F7E27A',
  /* reg: האזור. base: האויב שהיא גרסה שלו (ETYPES ו-LOOK3D). tags: החומרים, ומהם החולשה וצבע הטבעת (DMG.chart).
     col: הזוהר בתלת-ממד. spots: המקומות הנסתרים, at: השם שלהם בשמועה ('rare.at.<at>'). loot: בפורמט של טבלאות השלל (runGive) */
  list:{
    mossback:{reg:'meadow',base:'golem',icon:'🪨',tags:['stone','plant'],col:'#8FE36B',
      spots:[{x:2490,y:-1680,at:'quarry'},{x:-2600,y:-1300,at:'grove'},{x:230,y:1140,at:'south'},{x:-2730,y:1640,at:'grove'}],   // האחו הגדול: המאורות ◆ בשרטוט (WORLD.map.dens, docs/concept-meadow.md)
      loot:{coins:[1,60],amberF:[1,1],amber:[0.6,1],star:[0.3,1]}},
    glimmer:{reg:'meadow',base:'sprite',icon:'🧚',tags:['plant','magic','flying'],col:'#FFE680',
      spots:[{x:1240,y:-590,at:'bushes'},{x:-2000,y:1100,at:'copse'},{x:2850,y:250,at:'east'},{x:2240,y:1140,at:'east'},{x:-670,y:1830,at:'south'}],
      loot:{coins:[1,50],flower:[1,3],aquaF:[0.7,1],star:[0.3,1]}},
    pearl:{reg:'lake',base:'drowned',icon:'🦪',tags:['water','metal'],col:'#BDF4FF',
      spots:[{x:-1350,y:1820,at:'reeds'},{x:2600,y:-1050,at:'creek'},{x:-450,y:1780,at:'shore'}],   // האגם הגדול: 25-27 בשרטוט (map.dens ב-js/map-lake.js)
      loot:{coins:[1,80],aquaF:[1,1],aqua:[0.6,1],star:[0.4,1]}},
    hoarfrost:{reg:'ridge',base:'rimeknight',icon:'🧊',tags:['ice','metal'],col:'#E6FBFF',
      spots:[{x:2510,y:950,at:'crevasse'},{x:-2560,y:-1250,at:'pines'},{x:1330,y:1700,at:'drift'}],   // הרכס הגדול: 26-28 בשרטוט (map.dens ב-js/map-ridge.js)
      loot:{coins:[1,90],sapphireF:[1,1],sapphire:[0.6,1],star:[0.4,1]}},
    ashmaw:{reg:'desert',base:'cinderscorp',icon:'🦂',tags:['fire','stone'],col:'#FFB347',
      spots:[{x:-920,y:-460,at:'cacti'},{x:930,y:120,at:'embers'},{x:-300,y:600,at:'dunes'}],
      loot:{coins:[1,100],rubyF:[1,1],ruby:[0.6,1],star:[0.5,1]}},
    stormhide:{reg:'storm',base:'stormknight',icon:'⚡',tags:['lightning','metal'],col:'#D9C2FF',
      spots:[{x:920,y:-460,at:'spire'},{x:-150,y:600,at:'ruins'},{x:-920,y:-480,at:'deadwood'}],
      loot:{coins:[1,110],boltF:[1,1],bolt:[0.6,1],star:[0.5,1]}},
    hollow:{reg:'shadow',base:'shadewisp',icon:'🕯️',tags:['flying','fire'],col:'#B69CFF',
      spots:[{x:920,y:520,at:'pit'},{x:-950,y:-450,at:'shadegrove'},{x:260,y:600,at:'void'}],
      loot:{coins:[1,120],mythril:[1,1],star:[1,1]}}
  }
};
const RS=()=>SAVE.rares||(SAVE.rares={got:{},miss:0});
const rareKinds=()=>Object.keys(RS().got).filter(k=>RARES.list[k]&&RS().got[k]>0).length;   // כמה נדירות שונות צדת (קווסט הדרגה)
const rareName=id=>flName(id)||id;
const rareAt=s=>T('rare.at.'+s.at);

/* כל נדירה היא סוג אויב משלה: גרסה של האויב שהיא מבוססת עליו, עם החומרים שלה, בלי XP, וגדולה יותר.
   ככה הספר (book.js), השם מעל הראש (foelore.js) והקווסטים (kill) עובדים בלי שום שינוי שם */
for(const id in RARES.list){const R=RARES.list[id],B=ETYPES[R.base];if(!B)continue;
  const d=Object.assign({},B,{tags:R.tags,r:B.r*RARES.size,xp:0,rare:true,elite:null});delete d.mult;
  ETYPES[id]=d;FOELORE.list[id]=R.icon;BOOK.icon[id]=R.icon}
// המראה בתלת-ממד: אותו מודל, זוהר בצבע שלה וגדול יותר. נקרא מ-rareEnter, כי render3d.js נטען אחרי הקובץ הזה
function rareLooks(){if(typeof LOOK3D==='undefined')return;for(const id in RARES.list){const R=RARES.list[id],L=LOOK3D[R.base];
  if(L&&!LOOK3D[id])LOOK3D[id]=Object.assign({},L,{tint:R.col,h:Math.round(L.h*RARES.size)})}}

/* ---- כניסה לאזור: אולי נדירה מחכה באחד המקומות ---- */
function rareEnter(force){
  const w=S.wd;if(!w)return null;rareLooks();
  const reg=w.reg||'meadow',ids=Object.keys(RARES.list).filter(id=>RARES.list[id].reg===reg&&ETYPES[id]);
  if(!ids.length)return null;
  const s=RS();
  if(!force){if(Math.random()>=RARES.chance+(s.miss||0)*RARES.pity){s.miss=(s.miss||0)+1;return null}}
  s.miss=0;
  const fresh=ids.filter(id=>!s.got[id]),pool=fresh.length?fresh:ids;   // קודם אלה שעוד לא צדת
  const id=typeof force==='string'&&RARES.list[force]?force:pool[Math.floor(Math.random()*pool.length)];
  return rareSpawn(id);
}
function rareSpawn(id,si){
  const w=S.wd,R=RARES.list[id];if(!w||!R)return null;
  const sp=R.spots[si!=null?si:Math.floor(Math.random()*R.spots.length)],Z=typeof wZone==='function'?wZone(sp):{hp:1,dmg:1};
  const e=addEnemy(id,sp.x,sp.y,RARES.hp*Z.hp*(WORLD.foeHp||1));
  e.dmg*=RARES.dmg*(Z.dmg||1);e.xp=0;e.elite=false;e.rare=id;e.home=null;e.pname=R.icon+' '+rareName(id);
  if(typeof tierSpawn==='function')tierSpawn(e);
  w.rare={id,e,sp,t:RARES.life,rumor:RARES.rumorAt};
  return e;
}

/* ---- כל פריים בעולם ---- */
function rareUpdate(dt){
  const w=S.wd,r=w&&w.rare;if(!r||r.done)return;
  if(r.rumor>0&&(r.rumor-=dt)<=0)banner(RARES.icon+' '+T('rare.rumor',rareAt(r.sp)),RARES.col);   // שמועה: איפה, לא מה ולא חץ
  if(r.e.dead){if(!r.gone)rareGot(r);r.done=true;return}
  const fight=r.e.hp<r.e.max&&Math.hypot(P.x-r.e.x,P.y-r.e.y)<WORLD.aggro*1.5;
  if((r.t-=dt)<=0&&!fight){r.gone=true;r.e.dead=true;r.done=true;sparks(r.e.x,r.e.y,RARES.col,14,160)}   // נעלמה. אולי בפעם הבאה
}
function rareGot(r){
  const s=RS(),R=RARES.list[r.id],first=!s.got[r.id];
  s.got[r.id]=(s.got[r.id]||0)+1;
  runGive(R.loot,r.e.x,r.e.y);celebrate(r.e.x,r.e.y,'quest',R.icon);
  banner(T(first?'rare.first':'rare.down',rareName(r.id),rareKinds()),RARES.col);
  questEvent('rare',r.id,1);   // קווסט הדרגה (quests.js)
  saveNow();
}
// תנועה (wFoes ב-world.js): מסתובבת ליד המקום שלה, ורודפת רק קרוב אליו
function rareMove(e,dt){
  const r=S.wd.rare,sp=r&&r.e===e?r.sp:{x:e.x,y:e.y},dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1;
  let mx=0,my=0,v=e.speed*slowK(e);
  if(d<WORLD.aggro&&Math.hypot(P.x-sp.x,P.y-sp.y)<RARES.leash){
    if(foeAi(e,dt,d)){foeAiTail(e,dt);return}
    mx=dx/d;my=dy/d}
  else{if(e.wx==null||Math.hypot(e.wx-e.x,e.wy-e.y)<12){const a=rand(0,6.28),q=rand(0,RARES.roam);e.wx=sp.x+Math.cos(a)*q;e.wy=sp.y+Math.sin(a)*q}
    const wx=e.wx-e.x,wy=e.wy-e.y,wd=Math.hypot(wx,wy)||1;mx=wx/wd;my=wy/wd;v*=WORLD.wander}
  if(strikeTick(e,dt,d)){mx=my=0}
  e.x+=mx*v*dt+e.kx*dt;e.y+=my*v*dt+e.ky*dt;
  const f=Math.max(0,1-dt*9);e.kx*=f;e.ky*=f;e.ph+=dt*v*0.08;e.flash-=dt;
}
// ניצוצות על הקרקע סביב המקום (לא עליה בדיוק), והילה סביבה. לפני הדמויות
function rareDraw(){
  const r=S.wd&&S.wd.rare;if(!r||r.done)return;const t=fxNow(),K=RARES.sparkle,sp=r.sp;
  ctx.save();ctx.fillStyle=RARES.col;
  for(let i=0;i<K.n;i++){const a=i*2.4+sp.x*0.01,q=K.r*(0.35+((i*37)%60)/100),tw=Math.max(0,Math.sin(t*2.2+i*1.7));
    if(tw<0.15)continue;const x=sp.x+Math.cos(a)*q,y=sp.y+Math.sin(a)*q*0.7,s=1.5+tw*2.5;
    ctx.globalAlpha=tw*0.85;ctx.beginPath();ctx.moveTo(x,y-s*2);ctx.lineTo(x+s*0.6,y);ctx.lineTo(x,y+s*2);ctx.lineTo(x-s*0.6,y);ctx.closePath();ctx.fill()}
  const e=r.e;if(!e.dead){ctx.globalAlpha=0.22+Math.sin(t*3)*0.08;ctx.beginPath();ctx.ellipse(e.x,e.y+e.r*0.6,e.r*1.9,e.r*0.9,0,0,7);ctx.fill()}
  ctx.restore();
}
// פיוחו (petscent.js): נדירה חיה באזור שעוד לא הריחה
const rareScent=()=>{const r=S.wd&&S.wd.rare;return r&&!r.done&&!r.e.dead&&!r.sniffed?r:null};
