/* אנימציות אמיתיות לסקילי הזירה מגיליונות Mochi (אוראל, סבב גרפיקה 8.11.2026, W1).
   רק בזירה (skArena). העולם, הכפר ומשחקי השאול לא משתנים. בלי הקבצים ב-fx/ המשחק רץ כרגיל (fxlib מדלג בשקט),
   והציור הפרוצדורלי של skill-fx.js חוזר להיות מלא (skAnimLite). ארבעה שלבים לכל סקיל:
     (a) הבזק הטלה על הגיבור: מעגל קסם בצבע סוג הנזק מתחתיו (wcirc_<סוג>) והבזק משלו לכל סקיל.
     (b) האפקט הראשי בצורת הסקיל: רעידה = סדקים, טבעת הדף ואבנים. התזה = התזה גדולה, טבעת טיפות וארבעה פרצי מים לצדדים.
         כפור = סופת קרח מסתובבת, סדקי זכוכית ורסיסים. להבה = אש מקרינה, גחלים עולות וניצוצות בקצה.
         ברק = ברק שרץ מחוליה לחוליה (sk_pierce) והבזק בכל מטרה. שביט = פיצוץ גדול כשנופל. חנית = קרן לאורך הקו. פריחה = מעגל מים ואדוות כל זמן הבריכה.
     (c) פיצוץ פגיעה על כל אויב שהסקיל פגע בו: whit_<סוג> באויב גדול, hit_<סוג> בקטן, עם תקרה לפריים (הסקיל פוגע בכולם באותו פריים).
     (d) מצב מתמשך על האויב: רטוב (מים) ושריפה (אש) מכל פגיעת סקיל, וקפוא/הלם/חשמול כשהקומבו ניתן (comboShow), עם follow ו-dur לפי SKILLS.combo.
     וגם: מילת הקומבו קופצת על כרטיס זהב (ui_juice) ועם רעידה קטנה.
   החיבור: arena-fx.js קורא ל-skAnimCast מ-skillUse, ל-skAnimLand כשהשביט נופל, ול-skAnimHit מכל פגיעת סקיל. skill-fx.js שואל את skAnimLite מה להוריד.
   "פחות אפקטים": בלי (c) ו-(d) ובלי כרטיס, ו-(a)+(b) קטנים ועם פחות עותקים. תקרות: FXLIB.max לכולם, perCast להטלה אחת, hit.perFrame לפגיעות.
   כל המספרים ב-SKANIM, והספירה לבוט ב-SKANIMS.stat */
const SKANIM={
  on:true,
  perCast:8,          // כמה אפקטים לכל היותר להטלה אחת ב-(a)+(b). עם hit.perFrame ביחד: לא יותר מ-12 לסקיל בבת אחת
  room:6,             // לא פותחים אפקט חדש כש-FXLIB.list קרובה לתקרה בפחות מזה
  less:{k:0.7,copies:1},   // "פחות אפקטים": גודל, וכמה עותקים במקום כמה
  circ:{size:150,dur:0.5,alpha:0.75},   // (a) מעגל הקסם מתחת לגיבור
  circOf:{earth:'wcirc_earth',fire:'wcirc_fire',ice:'wcirc_ice',lightning:'wcirc_lightning',water:'wcirc_water',physical:'wcirc_phys'},
  // (a)+(b) לכל סקיל. k: גודל ביחס לרדיוס הטבעת. n: כמה עותקים סביב הטבעת
  quake:{flash:'hit_heavy',flashSize:110,cracks:'sk_anvil',cracksK:1.9,wave:'sk_anvil_wave',waveK:2.5,rocks:'debris',rocksN:1,rocksSize:76,rocksUp:-26},   // rocksN 1 (היה 3): מקום לאבק ולגל השני בתוך perCast
  splash:{flash:'wt_jump',flashK:1,ring:'whit_water',ringK:2.5,blast:'sk_wave',blastN:4,blastK:1.1,blastAt:0.5},
  frost:{flash:'sk_blizzard_ice',flashSize:120,storm:'sk_blizzard',stormK:1.5,stormAlpha:0.6,stormDur:0.45,cracks:'whit_ice',cracksK:2.2,shards:'hit_ice',shardsN:4,shardsSize:72},   // הסופה היא דיסק מלא שחוזר: קטנה, שקופה וקצרה, והטבעת היא סדקי הזכוכית
  flame:{flash:'hit_fire',flashSize:100,fire:'sk_rage',fireK:2.1,fireDur:0.45,fireAlpha:0.85,embers:'sf_embers',embersN:2,embersK:1,sparks:'hit_fire',sparksN:3,sparksSize:70},
  zap:{flash:'st_shock',flashSize:110,link:'sk_pierce',linkT:0.22,linkW:1.25,first:'whit_lightning',firstK:3.2},   // link: הברק שרץ מחוליה לחוליה. linkW: אורך התמונה ביחס לחוליה
  comet:{flash:'hit_fire',flashSize:80,boom:'tower_fall',boomK:2.6,cracks:'whit_fire',cracksK:2.2,embers:'sf_embers',embersK:1.4,rocks:'debris',rocksK:1.2},
  lance:{flash:'sk_blizzard_ice',flashSize:130,ray:'sk_pierce_ray',rayW:5,rayDur:0.35,tip:'hit_ice',tipSize:80},   // rayW: עובי הקרן ביחס לרוחב החנית
  bloom:{flash:'wt_jump',flashK:1,circ:'wcirc_water',circK:2.3,circAlpha:0.7,ripple:'water_ripple',rippleK:2.2},
  // (c) פגיעות: perFrame בפריים אחד (הסקיל פוגע בכולם ביחד). big: אויב-על ובוס מקבלים whit גדול. גודל לפי רדיוס האויב, בין min ל-max
  hit:{perFrame:4,k:3.2,min:56,max:130,bigK:4.5,bigMax:260},
  /* MLBB 1.1 (טבלת הפערים #528): רק מה שהיה חסר. hold: סימן שנשאר ברצפה ונמוג (fxlib.js). הכל בתוך perCast, ובלי בפחות אפקטים.
     quake: גל שני wave2 שניות אחרי, אבק, הסדקים נשארים, ורעידה לפי כמה נפגעו (base+per לכל אחד, עד ARFEEL.shake.big). splash: טבעת גל, וטיפה על כל אויב.
     frost: הסדקים נשארים. comet: שובל אש שנופל בזמן ההמתנה, ומכתש שנשאר. lance: פס קרח שנשאר לאורך הקרן. bloom: עלי כותרת, ומספר ירוק בכל ריפוי */
  mo:{quake:{wave2:0.15,dust:'step_dust',dustN:2,dustSize:70,hold:2,holdAlpha:0.55,shake:{base:2,per:0.5}},
    splash:{ring:'wt_wave',ringK:2.4,drop:'wt_droplet',dropSize:52},
    frost:{hold:2,holdAlpha:0.4},
    comet:{streak:'hit_fire',streakSize:44,streakSx:3.2,streakUp:260,hold:2,holdAlpha:0.45},
    lance:{hold:1.5,holdAlpha:0.3},
    bloom:{petals:'petals',petalsK:1.7,petalsAlpha:0.75,healCol:'#7BE38F'}},
  hitFx:{physical:'hit',fire:'hit_fire',water:'hit_water',ice:'hit_ice',lightning:'hit_light',earth:'hit_earth'},
  bigFx:{physical:'whit_phys',fire:'whit_fire',water:'whit_water',ice:'whit_ice',lightning:'whit_lightning',earth:'whit_earth'},
  // (d) מצבים: עד max בבת אחת על כל האויבים. dur: לפי המצב (רטוב ושריפה מ-DMG, קפוא והלם מ-SKILLS.combo)
  status:{max:10,k:2.6,min:44,max_:110,shock:0.7,fx:{wet:'st_wet',burn:'st_burn',freeze:'st_freeze',shock:'st_shock',stun:'st_stun'},add:{shock:1,burn:1}},
  word:{fx:'ui_juice',size:72,sx:1.9,alpha:0.85,vy:-55,shake:2,stop:0.02}   // כרטיס מאחורי מילת הקומבו (floatText עולה ב-55 בשנייה), רעידה ועצירה קצרה
};
const SKANIMS={n:0,f:-1,hn:0,zapFrom:null,st:[],stat:{cast:{},fx:0,hits:0,big:0,status:0,words:0,skip:0}};

const skAnimOn=()=>SKANIM.on&&!!S&&!!S.sk&&skArena()&&S.mode==='play'&&!(typeof MB!=='undefined'&&MB)&&typeof FXDATA!=='undefined';
// skill-fx.js מוריד מהציור הפרוצדורלי רק כשהגיליונות באמת נטענו (בלי הקבצים: הכל כמו קודם)
const skAnimLite=()=>skAnimOn()&&!!fxImg('wcirc_fire');
const skAnimRoom=()=>FXLIB.list.length<FXLIB.max-SKANIM.room;
// נגינה עם תקרה להטלה: מחזיר את האפקט, או null כשהתקציב נגמר
function skaPlay(id,x,y,o){
  if(SKANIMS.n>=SKANIM.perCast||!skAnimRoom()){SKANIMS.stat.skip++;return null}
  const h=fxPlay(id,x,y,o);if(h){SKANIMS.n++;SKANIMS.stat.fx++}return h;
}
const skaK=()=>fxLess()?SKANIM.less.k:1;                 // "פחות אפקטים": קטן יותר
const skaN=n=>fxLess()?Math.min(n,SKANIM.less.copies):n;   // ופחות עותקים
let skaSeedN=0;const skaRnd=()=>{skaSeedN=(skaSeedN*9301+49297)%233280;return skaSeedN/233280};   // בלי Math.random, שהבדיקה עם seed תישאר אותה ריצה
const skaHand=()=>{const h=AGE_FX&&(AGE_FX.tip||AGE_FX.hand);return h?[h.x,h.y]:[P.x+Math.cos(P.aim)*24,P.y-10+Math.sin(P.aim)*24]};

/* ---- (a)+(b): הטלה. נקרא מ-arena-fx.js אחרי ש-skillUse הצליח. מחזיר true כשטופל כאן ---- */
function skAnimCast(id){
  if(!skAnimOn())return false;
  const A=SKANIM[id];if(!A)return false;
  const D=skDef(id)||{},R=D.r||60,k=skaK();SKANIMS.n=0;SKANIMS.stat.cast[id]=(SKANIMS.stat.cast[id]||0)+1;
  const circ=SKANIM.circOf[D.dt],C_=SKANIM.circ,[hx,hy]=skaHand();
  if(id==='bloom'){   // הבריכה: מעגל מים ואדוות לכל זמן הבריכה, והתזה בהתחלה
    const p=S.skm&&S.skm.pools[S.skm.pools.length-1];if(!p)return true;const t=SKMORE.list.bloom.t;
    skaPlay(A.circ,p.x,p.y,{size:R*A.circK*k,alpha:A.circAlpha,loop:true,dur:t,under:true});
    skaPlay(A.ripple,p.x,p.y,{size:R*A.rippleK*k,loop:true,dur:t,add:true,under:true});
    skaPlay(A.flash,p.x,p.y,{size:R*A.flashK*k,add:true});
    if(!fxLess()){const Mb=SKANIM.mo.bloom;skaPlay(Mb.petals,p.x,p.y,{size:R*Mb.petalsK*k,alpha:Mb.petalsAlpha,loop:true,dur:t})}   // עלי כותרת שנסחפים לכל זמן הבריכה
    return true}
  if(circ)skaPlay(circ,P.x,P.y+2,{size:C_.size*k,dur:C_.dur,alpha:C_.alpha,under:true});
  if(id==='quake'){
    skaPlay(A.flash,P.x,P.y-10,{size:A.flashSize*k,add:true});
    const Mq=SKANIM.mo.quake,lite=fxLess();
    skaPlay(A.cracks,P.x,P.y,{size:R*A.cracksK*k,under:true,hold:lite?0:Mq.hold,alpha:lite?1:Mq.holdAlpha});   // הסדקים נשארים ברצפה ונמוגים
    skaPlay(A.wave,P.x,P.y,{size:R*A.waveK*k,under:true});
    if(!lite){const x=P.x,y=P.y,s=R*A.waveK*k;setTimeout(()=>{if(skAnimOn())skaPlay(A.wave,x,y,{size:s*1.15,under:true,alpha:0.7})},Mq.wave2*1000);   // גל שני (לא tg_ring של הבוס, ההחלטה ה4)
      for(let i=0;i<skaN(Mq.dustN);i++){const a=skaRnd()*6.283;skaPlay(Mq.dust,P.x+Math.cos(a)*R*0.6,P.y+Math.sin(a)*R*0.5,{size:Mq.dustSize*k})}}
    if(typeof calmOn!=='function'||!calmOn()){let hit=0;for(const e of enemies)if(!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)-e.r<R)hit++;   // רעידה לפי כמה נפגעו (עד הרעידה הגדולה של arena-feel)
      const big=typeof ARFEEL!=='undefined'?ARFEEL.shake.big:8;S.shake=Math.max(S.shake,Math.min(big,Mq.shake.base+Mq.shake.per*hit))}
    const n=skaN(A.rocksN);for(let i=0;i<n;i++){const a=(i+skaRnd()*0.6)/n*6.283;skaPlay(A.rocks,P.x+Math.cos(a)*R*0.55,P.y+Math.sin(a)*R*0.45,{size:A.rocksSize*k,vy:A.rocksUp,rot:skaRnd()*6.283})}}
  else if(id==='splash'){
    skaPlay(A.flash,P.x,P.y-R*0.2,{size:R*A.flashK*k,add:true});
    skaPlay(A.ring,P.x,P.y,{size:R*A.ringK*k,under:true});
    if(!fxLess())skaPlay(SKANIM.mo.splash.ring,P.x,P.y,{size:R*SKANIM.mo.splash.ringK*k,under:true});   // טבעת גל שיוצאת החוצה
    const n=skaN(A.blastN),a0=skaRnd()*6.283;for(let i=0;i<n;i++){const a=a0+i/n*6.283;skaPlay(A.blast,P.x+Math.cos(a)*R*A.blastAt,P.y+Math.sin(a)*R*A.blastAt*0.85,{size:R*A.blastK*k,rot:a})}}
  else if(id==='frost'){
    skaPlay(A.storm,P.x,P.y,{size:R*A.stormK*k,add:true,under:true,alpha:A.stormAlpha,dur:A.stormDur});
    {const Mf=SKANIM.mo.frost,lite=fxLess();skaPlay(A.cracks,P.x,P.y,{size:R*A.cracksK*k,under:true,hold:lite?0:Mf.hold,alpha:lite?1:Mf.holdAlpha})}   // כפור שנשאר ברצפה
    skaPlay(A.flash,P.x,P.y-12,{size:A.flashSize*k,add:true});
    const n=skaN(A.shardsN),a0=skaRnd()*6.283;for(let i=0;i<n;i++){const a=a0+i/n*6.283;skaPlay(A.shards,P.x+Math.cos(a)*R*0.9,P.y+Math.sin(a)*R*0.75,{size:A.shardsSize*k,rot:skaRnd()*6.283})}}
  else if(id==='flame'){
    skaPlay(A.fire,P.x,P.y-6,{size:R*A.fireK*k,add:true,alpha:A.fireAlpha,dur:A.fireDur});
    skaPlay(A.flash,P.x,P.y-14,{size:A.flashSize*k,add:true});
    const ne=skaN(A.embersN);for(let i=0;i<ne;i++)skaPlay(A.embers,P.x+(i?R*0.45:-R*0.45),P.y-R*0.3,{size:R*A.embersK*k,add:true,vy:-20});
    const n=skaN(A.sparksN),a0=skaRnd()*6.283;for(let i=0;i<n;i++){const a=a0+i/n*6.283;skaPlay(A.sparks,P.x+Math.cos(a)*R*0.85,P.y+Math.sin(a)*R*0.7,{size:A.sparksSize*k,add:true})}}
  else if(id==='zap'||id==='lance'||id==='comet'){
    skaPlay(A.flash,hx,hy,{size:A.flashSize*k,add:true});
    if(id==='lance'){const f=S.skm&&S.skm.fx[S.skm.fx.length-1];
      if(f&&f.k==='beam'){const dx=f.bx-f.ax,dy=f.by-f.ay,L=Math.hypot(dx,dy)||1,w=SKMORE.list.lance.w*A.rayW*k;
        skaPlay(A.ray,(f.ax+f.bx)/2,(f.ay+f.by)/2,{size:w,sx:L/w,rot:Math.atan2(dy,dx),add:true,dur:A.rayDur,fps:24/A.rayDur});
        skaPlay(A.tip,f.bx,f.by,{size:A.tipSize*k,add:true});
        if(!fxLess()){const Ml=SKANIM.mo.lance;skaPlay(A.ray,(f.ax+f.bx)/2,(f.ay+f.by)/2,{size:w,sx:L/w,rot:Math.atan2(dy,dx),under:true,hold:Ml.hold,alpha:Ml.holdAlpha,fps:60})}}}   // פס קרח שנשאר לאורך הקרן
    if(id==='comet'&&!fxLess()){const p=S.skm&&S.skm.pend[S.skm.pend.length-1],Mc=SKANIM.mo.comet;   // שובל אש שנופל אל הנקודה בזמן ההמתנה (בלי tg_growing, ההחלטה ה4)
      if(p){const dl=Math.max(0.1,p.max-p.t);skaPlay(Mc.streak,p.x,p.y-Mc.streakUp,{size:Mc.streakSize*k,sx:Mc.streakSx,rot:Math.PI/2,vy:Mc.streakUp/dl,dur:dl,loop:true,add:true})}}}
  return true;
}
// השביט נפל (arena-fx.js קורא מ-skillsUpdate): פיצוץ גדול, סדקים, גחלים ואבנים
function skAnimLand(p){
  if(!skAnimOn())return false;
  const A=SKANIM.comet,R=SKMORE.list.comet.r,k=skaK();SKANIMS.n=0;SKANIMS.stat.cast.cometLand=(SKANIMS.stat.cast.cometLand||0)+1;
  {const Mc=SKANIM.mo.comet,lite=fxLess();skaPlay(A.cracks,p.x,p.y,{size:R*A.cracksK*k,under:true,hold:lite?0:Mc.hold,alpha:lite?1:Mc.holdAlpha})}   // מכתש שנשאר ברצפה
  skaPlay(A.boom,p.x,p.y-R*0.2,{size:R*A.boomK*k,add:true});
  if(!fxLess()){skaPlay(A.embers,p.x,p.y-R*0.3,{size:R*A.embersK,add:true,vy:-30});skaPlay(A.rocks,p.x,p.y,{size:R*A.rocksK,vy:-24})}
  return true;
}

/* ---- (c)+(d): פגיעה של סקיל באויב. נקרא מ-arena-fx.js (juiceHit) כש-AJ.src.w==='skill'. מחזיר true כשטופל כאן ---- */
function skaFrame(){if(SKANIMS.f===S.t)return;SKANIMS.f=S.t;SKANIMS.hn=0;SKANIMS.zapFrom=null}
function skAnimHit(e,d,t){
  if(!skAnimOn()||fxLess())return false;
  skaFrame();const H=SKANIM.hit;
  if(SKANIMS.hn>=H.perFrame||!skAnimRoom()){SKANIMS.stat.skip++;return true}
  SKANIMS.hn++;SKANIMS.stat.hits++;
  const big=typeof ajBig==='function'&&ajBig(e),hy=e.y-e.r*0.6,r=e.r*(e.big||1);
  if(t==='lightning'){   // ברק: חוליה שרצה מהמקום הקודם (היד, או האויב הקודם) אל האויב הזה
    const Z=SKANIM.zap,from=SKANIMS.zapFrom||skaHand(),dx=e.x-from[0],dy=hy-from[1],L=Math.hypot(dx,dy);
    if(L>20&&skAnimRoom()){fxPlay(Z.link,from[0]+dx/2,from[1]+dy/2,{size:L*Z.linkW,rot:Math.atan2(dy,dx),add:true,dur:Z.linkT,fps:24/Z.linkT});SKANIMS.stat.fx++}
    if(!SKANIMS.zapFrom&&skAnimRoom()){fxPlay(Z.first,e.x,hy,{size:Math.min(H.bigMax,Math.max(H.min,r*Z.firstK)),add:true});SKANIMS.stat.fx++}
    SKANIMS.zapFrom=[e.x,hy];
  }
  if(big){fxPlay(SKANIM.bigFx[t]||'whit_phys',e.x,hy,{size:Math.min(H.bigMax,Math.max(H.min,r*H.bigK)),add:true});SKANIMS.stat.big++}
  else fxPlay(SKANIM.hitFx[t]||'hit',e.x,hy,{size:Math.min(H.max,Math.max(H.min,r*H.k)),add:true,rot:skaRnd()*6.283});
  SKANIMS.stat.fx++;
  if(t==='water'&&DMG.types.water.wet)skaStatus(e,'wet',DMG.types.water.wet.t);
  else if(t==='fire'&&DMG.types.fire.burn)skaStatus(e,'burn',DMG.types.fire.burn.t);
  return true;
}
// מצב על אויב: עוקב אחריו ונגמר עם המצב. אחד מכל סוג לאויב, ועד status.max בבת אחת (הוותיק נעצר)
function skaStatus(e,kind,dur){
  const ST=SKANIM.status,id=ST.fx[kind];if(!id||!(dur>0)||!skAnimRoom())return;
  const st=e.skSt||(e.skSt={}),cur=st[kind];
  if(cur&&cur.on&&FXLIB.list.includes(cur)){cur.t0=fxNowT();cur.dur=dur;return}   // כבר יש: מאריכים
  const L=SKANIMS.st;let j=0;for(const h of L)if(h.on&&FXLIB.list.includes(h))L[j++]=h;L.length=j;
  while(L.length>=ST.max)fxStop(L.shift());
  const r=e.r*(e.big||1),h=fxPlay(id,e.x,e.y,{follow:e,dur,loop:true,size:Math.min(ST.max_,Math.max(ST.min,r*ST.k)),dy:-r*0.55,add:!!ST.add[kind]});
  if(h){L.push(h);st[kind]=h;SKANIMS.stat.status++}
}
// קומבו (comboShow ב-skills.js): המצב מהגיליון, כרטיס זהב מאחורי המילה, רעידה קטנה
{const old=comboShow;comboShow=function(e,kind){
  const k=S.sk,l0=k&&k.last[kind];old.apply(this,arguments);
  if(!k||k.last[kind]===l0||!skAnimOn()||fxLess())return;   // המילה לא קפצה (בתוך gap): גם כאן שקט
  const K=SKILLS.combo,Wd=SKANIM.word;
  if(kind==='freeze')skaStatus(e,'freeze',K.freeze.t*(e.isBoss?K.freeze.boss:1));
  else if(kind==='stun')skaStatus(e,'stun',e.isBoss?K.stun.boss:K.stun.t);
  else if(kind==='shock')skaStatus(e,'shock',SKANIM.status.shock);
  else if(kind==='melt'&&skAnimRoom()){fxPlay(SKANIM.bigFx.fire,e.x,e.y-e.r*0.6,{size:Math.min(SKANIM.hit.bigMax,Math.max(80,e.r*(e.big||1)*3.4)),add:true});SKANIMS.stat.fx++}
  if(skAnimRoom()){fxPlay(Wd.fx,e.x,e.y-e.r-30-6,{size:Wd.size,sx:Wd.sx,alpha:Wd.alpha,vy:Wd.vy});SKANIMS.stat.words++}
  S.shake=Math.max(S.shake,Wd.shake);if(typeof jStop==='function'&&!RM)jStop(Wd.stop,false,true);
}}

// בתחילת ריצה בזירה: טוענים מראש את כל הגיליונות שבשימוש כאן, ומנקים את רשימת המצבים
function skAnimIds(){
  const ids=new Set(Object.values(SKANIM.circOf).concat(Object.values(SKANIM.hitFx),Object.values(SKANIM.bigFx),Object.values(SKANIM.status.fx),[SKANIM.word.fx]));
  for(const id of ['quake','splash','frost','flame','zap','comet','lance','bloom'])for(const v of Object.values(SKANIM[id]))if(typeof v==='string')ids.add(v);
  return [...ids];
}
{const old=skillsReset;skillsReset=function(){const r=old.apply(this,arguments);SKANIMS.st.length=0;SKANIMS.zapFrom=null;if(skArena()&&typeof FXDATA!=='undefined')fxPreload(skAnimIds());return r}}
