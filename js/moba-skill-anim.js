/* משחקי השאול: אנימציה מלאה לכל סקיל מגיליונות Mochi (אוראל, סבב גרפיקה 8.11.2026, W2).
   משלים את #423 (mbfxSk ב-moba-fx.js, שנותן לכל סקיל את האפקט הראשי בצורתו) בשלבים שחסרו, כמו בזירה (js/skill-anim.js, W1), אבל בקובץ של המובה:
     (a) הבזק הטלה על הגיבור: מעגל קסם בצבע סוג הנזק מתחתיו (wcirc_<סוג>) והבזק משלו לכל סקיל (לסקיל-על: ult_cast ו-ult_ray כבר ב-mbfxUltLib).
     (b) השלמות לאפקט הראשי: סדקים וטבעת הדף בנקודת המשיכה של החומה, אבנים בנחיתת הסדן, חיתוך שעף עם גל החרב, שובל סיבוב,
         פיצוץ גדול בתחילת הזעם, התזה כשהבועה עולה, סדקי קרח כשהסופה נוחתת, חץ שנוחת על כל מי שבגשם, ומטח אחרון כבד.
     (c) פגיעה על כל יחידה שהסקיל פגע בה: whit_<סוג> על גיבור, hit_<סוג> על חייל, עם תקרה לפריים (הסקיל פוגע בכולם באותו פריים).
     (d) מצב מתמשך: על אויבים MBLIB.stOrder כבר מראה הלם, לכוד, רטוב, בוער, איטי וקפוא (moba-fx.js). כאן נוסף מה שחסר: סימן מטרה על מי שהוכרח
         (קריאת קרב), ומצבים על המטיל עצמו: הגנה עולה כל זמן המגן של קריאת הקרב, התקפה עולה כל זמן הזעם, וריפוי כשהסיבוב החזיר חיים. הם ב-FXLIB.list (ולא ב-MB.fxs.top), כדי שהערפל יכבד אותם.
   החיבור: moba-kits.js קורא ל-mbAnimCast בתחילת כל הטלה, ל-mbAnimLand כשסקיל נוחת (סדן, חומה, בועה, סופה, מטח אחרון), ל-mbAnimHit ליד כל mbDmg של סקיל,
   ל-mbAnimTick ול-mbAnimRain בכל טיק של גשם החצים, ול-mbAnimHeal כשהסיבוב ריפא. רק מראה: הנזק, הטווחים והבוטים לא משתנים.
   ערפל: אפקט נוצר רק במקום שהקבוצה שלי רואה ושעל המסך (mbfxOn), וגם בציור fxlib לא מצייר בערפל (fxSeen). בלי הקבצים ב-fx/ הכל כמו קודם.
   תקרות: perCast אפקטים ל-(a)+(b) בהטלה אחת, hit.perFrame פגיעות בפריים, וביחד לא יותר מ-12 לסקיל. אין חדשים כש-FXLIB.list קרובה לתקרה (room).
   "פחות אפקטים": (a)+(b) ב-70% ובלי עותקים נוספים, בלי (c) ו-(d). כל המספרים ב-MBANIM, והספירה לבוט ב-MBANIMS.stat */
const MBANIM={
  on:true,
  perCast:8,          // (a)+(b) להטלה אחת (הנחיתה נספרת כהטלה משלה)
  room:6,             // לא פותחים אפקט חדש כש-FXLIB.list קרובה לתקרה בפחות מזה
  less:{k:0.7},       // "פחות אפקטים": גודל
  circ:{size:170,dur:0.45,alpha:0.8,sy:0.5,dy:2},   // (a) מעגל הקסם מתחת למטיל. sy: שוכב על הרצפה
  circOf:{earth:'wcirc_earth',fire:'wcirc_fire',ice:'wcirc_ice',lightning:'wcirc_lightning',water:'wcirc_water',physical:'wcirc_phys'},
  // (a) הבזק משלו לכל סקיל, על המטיל. hand: ביד (קדימה לכיוון ההטלה) במקום על הגוף. לסקילי-על אין: ult_cast ו-ult_ray כבר שם
  flash:{
    anvil:{fx:'hit_heavy',size:100,dy:-22,add:true},
    taunt:{fx:'hit_fire',size:110,dy:-26,add:true},
    cleave:{fx:'hit',size:80,dy:-14,add:true,hand:1},
    spin:{fx:'hit',size:90,dy:-20,add:true},
    pierce:{fx:'st_shock',size:90,dy:-16,add:true,hand:1},
    net:{fx:'hit',size:70,dy:-14,add:true,hand:1},
    wave:{fx:'hit_water',size:90,dy:-16,add:true,hand:1},
    bubble:{fx:'hit_water',size:90,dy:-16,add:true,hand:1},
  },
  hand:34,            // כמה קדימה היד
  // (b) השלמות לאפקט הראשי. k: כפול רדיוס הסקיל. n: עותקים (ב"פחות אפקטים" אחד)
  anvil:{rocks:'debris',rocksN:2,rocksSize:70,rocksUp:-24},                                   // אבנים שעפות בנחיתה
  wall:{cracks:'sk_anvil',cracksK:1.5,wave:'sk_anvil_wave',waveK:2.1,waveAlpha:0.9},           // בנקודת המשיכה: סדקים וטבעת הדף
  cleave:{trail:'slash',trailK:1.7,trailAlpha:0.9},                                            // חיתוך שעף עם הקשת (k כפול רוחב הגל)
  spin:{trail:'tr_spin_sapphire',trailK:2.2,trailDur:0.5,trailAlpha:0.85},                      // שובל סיבוב (לפיזי אין צבע ניטרלי: ספיר, כמו פלדה)
  rage:{burst:'whit_phys',burstK:2.4,burstAlpha:0.9},                                           // פיצוץ גדול בתחילת הזעם
  rain:{arrow:'hit',arrowSize:52,every:0.35,end:'hit_heavy',endK:1.6,endAlpha:0.95,              // חץ נוחת על כל מי שבגשם פעם ב-every שניות, ומטח אחרון כבד במרכז
    drop:'shot_arrow',dropEvery:0.12,dropSize:60,dropH:110,dropFall:420,dropT:0.27},               // וחצים שנופלים מהשמיים בתוך האזור כל זמן הגשם (הגיליון sk_rain עדין מדי לבד)
  bubble:{splash:'wt_jump',splashK:1.4},                                                        // התזה כשהבועה עולה
  blizzard:{cracks:'whit_ice',cracksK:2.1,cracksSy:0.6,cracksAlpha:0.85},                        // סדקי קרח על הרצפה כשהסופה נוחתת
  // (c) פגיעות: perFrame בפריים אחד. גיבור מקבל whit גדול, חייל hit קטן. גודל לפי רדיוס היחידה, בין min ל-max
  hit:{perFrame:4,k:3,min:50,max:90,heroK:4,heroMin:100,heroMax:150,dyK:0.6},
  hitFx:{physical:'hit',fire:'hit_fire',water:'hit_water',ice:'hit_ice',lightning:'hit_light',earth:'hit_earth'},
  heroFx:{physical:'whit_phys',fire:'whit_fire',water:'whit_water',ice:'whit_ice',lightning:'whit_lightning',earth:'whit_earth'},
  // (d) מצבים: על המטיל (self) וסימן על מי שהוכרח (taunt). dy כפול mbUiK, מעל תג הערכה
  self:{taunt:{fx:'st_defup',size:60,dy:-96},rage:{fx:'st_atkup',size:60,dy:-96},heal:{fx:'st_regen',size:70,dy:-30,dur:0.8}},
  taunt:{fx:'tg_target',size:54,alpha:0.85,dy:-40},
};
const MBANIMS={n:0,f:-1,hn:0,stat:{cast:{},land:{},fx:0,hits:0,hero:0,status:0,skip:0}};

const mbaOn=()=>MBANIM.on&&typeof MB!=='undefined'&&!!MB&&typeof FXDATA!=='undefined'&&typeof fxPlay==='function';
const mbaRoom=()=>FXLIB.list.length<FXLIB.max-MBANIM.room;
const mbaLessK=()=>fxLess()?MBANIM.less.k:1;
const mbaLessN=n=>fxLess()?1:n;
// נגינה עם תקרה להטלה ובלי ערפל: מחזיר את האפקט, או null כשהתקציב נגמר או כשלא רואים את המקום
function mbaPlay(id,x,y,o){
  if(MBANIMS.n>=MBANIM.perCast||!mbaRoom()||!mbfxOn(x,y)){MBANIMS.stat.skip++;return null}
  const h=fxPlay(id,x,y,o);if(h){MBANIMS.n++;MBANIMS.stat.fx++;if(MBFX.log)MBFX.log[id]=(MBFX.log[id]||0)+1}return h;
}
const mbaClamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
let mbaSeedN=0;const mbaRnd=()=>{mbaSeedN=(mbaSeedN*9301+49297)%233280;return mbaSeedN/233280};   // בלי Math.random: שהמשחק עם seed (check.js, moba-balance.js) יישאר אותה ריצה בדיוק

/* ---- (a): הטלה. נקרא מ-mbCast אחרי שכל הבדיקות עברו, לפני הסקיל עצמו. s: הגדרת הסקיל, ang: כיוון ההטלה ---- */
function mbAnimCast(u,s,slot,ang){
  if(!mbaOn())return false;
  const A=MBANIM,k=mbaLessK(),dt=s.dt||MBKIT[u.kit].dt;MBANIMS.n=0;MBANIMS.stat.cast[s.id]=(MBANIMS.stat.cast[s.id]||0)+1;
  if(slot!=='ult'){const circ=A.circOf[dt],C_=A.circ;   // סקיל-על: ult_cast כבר מעגל קסם גדול (mbfxUltLib)
    if(circ)mbaPlay(circ,u.x,u.y,{follow:u,dy:C_.dy,size:C_.size*k,dur:C_.dur,alpha:C_.alpha,sy:C_.sy});
    const F=A.flash[s.id];if(F){const hx=F.hand?Math.cos(ang)*A.hand:0,hy=F.hand?Math.sin(ang)*A.hand*0.5:0;mbaPlay(F.fx,u.x+hx,u.y+hy+F.dy,{size:F.size*k,add:!!F.add,rot:F.hand?ang:0})}}
  // (b) מה שמתחיל ברגע ההטלה
  if(s.id==='spin'){const B=A.spin;mbaPlay(B.trail,u.x,u.y,{follow:u,loop:true,dur:B.trailDur,size:s.r*B.trailK*k,alpha:B.trailAlpha,add:true,dy:-8})}
  else if(s.id==='rage'){const B=A.rage;mbaPlay(B.burst,u.x,u.y-10,{size:s.r*B.burstK*k,alpha:B.burstAlpha,add:true})}
  // (d) מצב על המטיל עצמו
  if(!fxLess()){const S_=A.self[s.id];if(S_){const dur=s.id==='taunt'?s.shieldT:s.t;mbAnimSelf(u,S_,dur)}}
  return true;
}
// מצב מתמשך על המטיל: ב-FXLIB.list (ולא ב-MB.fxs.top כמו סימני MBLIB), כי רק שם fxlib מכבד את הערפל, וגיבור אויב שנכנס לשיח בזעם לא מוסגר
function mbAnimSelf(u,S_,dur){
  if(!(dur>0)||!mbfxOn(u.x,u.y)||!mbaRoom())return;
  const uk=mbUiK(),f=fxPlay(S_.fx,u.x,u.y,{follow:u,loop:true,dur,size:S_.size*uk,dy:S_.dy*uk,add:true});
  if(f){MBANIMS.stat.status++;if(MBFX.log)MBFX.log[S_.fx]=(MBFX.log[S_.fx]||0)+1}
}
// הסיבוב ריפא: רגע של ריפוי על הלוחם
function mbAnimHeal(u){if(!mbaOn()||fxLess())return;mbAnimSelf(u,MBANIM.self.heal,MBANIM.self.heal.dur)}

/* ---- (b): נחיתה. נקרא כשסקיל שנוחת מגיע: סדן (בנחיתה), חומה (בנקודה), בועה וסופה (כשהאזור עולה), גשם חצים (במטח האחרון) ---- */
function mbAnimLand(id,x,y,s){
  if(!mbaOn())return false;
  const A=MBANIM,k=mbaLessK(),r=s.r||80;MBANIMS.n=0;MBANIMS.stat.land[id]=(MBANIMS.stat.land[id]||0)+1;
  if(id==='anvil'){const B=A.anvil,n=mbaLessN(B.rocksN);for(let i=0;i<n;i++){const a=(i+0.3)/n*6.283;mbaPlay(B.rocks,x+Math.cos(a)*r*0.5,y+Math.sin(a)*r*0.4,{size:B.rocksSize*k,vy:B.rocksUp,rot:a})}}
  else if(id==='wall'){const B=A.wall;mbaPlay(B.cracks,x,y,{size:r*B.cracksK*k});mbaPlay(B.wave,x,y,{size:r*B.waveK*k,add:true,sy:0.5,alpha:B.waveAlpha})}
  else if(id==='bubble'){const B=A.bubble;mbaPlay(B.splash,x,y-r*0.2,{size:r*B.splashK*k,add:true})}
  else if(id==='blizzard'){const B=A.blizzard;mbaPlay(B.cracks,x,y,{size:r*B.cracksK*k,sy:B.cracksSy,alpha:B.cracksAlpha})}
  else if(id==='rain'){const B=A.rain;mbaPlay(B.end,x,y-r*0.15,{size:r*B.endK*k,add:true,alpha:B.endAlpha})}
  return true;
}
// גל חרב: החיתוך עף עם הקשת (follow על היריה, נעלם איתה)
function mbAnimShot(sh,s,ang){
  if(!mbaOn()||s.id!=='cleave')return;const B=MBANIM.cleave;
  mbaPlay(B.trail,sh.x,sh.y,{follow:sh,loop:true,rot:ang,size:s.w*B.trailK*mbaLessK(),alpha:B.trailAlpha,add:true,dy:-10});
}

/* ---- (c): פגיעה של סקיל ביחידה. נקרא ליד כל mbDmg של סקיל ב-moba-kits.js ---- */
function mbaFrame(){if(MBANIMS.f===MB.t)return;MBANIMS.f=MB.t;MBANIMS.hn=0}
function mbAnimHit(o,dt){
  if(!mbaOn()||fxLess()||!o||o.dead||!(o.k==='hero'||o.k==='minion'))return false;
  mbaFrame();const H=MBANIM.hit;
  if(MBANIMS.hn>=H.perFrame||!mbaRoom()||!mbfxOn(o.x,o.y)){MBANIMS.stat.skip++;return false}
  MBANIMS.hn++;MBANIMS.stat.hits++;const hy=o.y-o.r*H.dyK;
  let f;if(o.k==='hero'){f=fxPlay(MBANIM.heroFx[dt]||'whit_phys',o.x,hy,{size:mbaClamp(o.r*H.heroK,H.heroMin,H.heroMax),add:true});MBANIMS.stat.hero++}
  else f=fxPlay(MBANIM.hitFx[dt]||'hit',o.x,hy,{size:mbaClamp(o.r*H.k,H.min,H.max),add:true});
  if(f){MBANIMS.stat.fx++;if(MBFX.log)MBFX.log[f.id]=(MBFX.log[f.id]||0)+1}
  return !!f;
}
// גשם חצים: חץ נוחת על כל מי שבאזור, לא יותר מפעם ב-every שניות ליחידה
function mbAnimTick(o){
  if(!mbaOn()||fxLess()||!o||o.dead)return;const B=MBANIM.rain,N=MBFX_N(o);
  if((N.rainT||-9)>MB.t-B.every||!mbaRoom()||!mbfxOn(o.x,o.y))return;N.rainT=MB.t;
  const f=fxPlay(B.arrow,o.x,o.y-o.r*0.5,{size:B.arrowSize*mbaLessK(),add:true,rot:mbaRnd()*6.283});if(f)MBANIMS.stat.fx++;
}

// גשם חצים: חץ נופל מהשמיים בנקודה אקראית באזור, פעם ב-dropEvery שניות (נקרא מכל טיק של האזור)
function mbAnimRain(z){
  if(!mbaOn()||fxLess())return;const B=MBANIM.rain;
  if((z.dropT||-9)>MB.t-B.dropEvery||!mbaRoom())return;z.dropT=MB.t;
  const a=mbaRnd()*6.283,d=Math.sqrt(mbaRnd())*z.r*0.9,x=z.x+Math.cos(a)*d,y=z.y+Math.sin(a)*d*0.8;
  if(!mbfxOn(x,y))return;
  const f=fxPlay(B.drop,x,y-B.dropH,{size:B.dropSize*mbaLessK(),rot:Math.PI/2,vy:B.dropFall,dur:B.dropT,add:true});if(f)MBANIMS.stat.fx++;
}

/* ---- (d): סימן מטרה על מי שהוכרח בקריאת הקרב, כל זמן ההכרחה ---- */
function mbAnimTaunt(o,dur){
  if(!mbaOn()||fxLess()||!o||o.dead||!(dur>0)||!mbfxOn(o.x,o.y))return;
  const T2=MBANIM.taunt,uk=mbUiK(),N=MBFX_N(o);
  if(N.tauntFx&&N.tauntFx.on&&FXLIB.list.includes(N.tauntFx)){N.tauntFx.t0=fxNowT();N.tauntFx.dur=dur;return}   // כבר יש: מאריכים
  if(!mbaRoom())return;
  N.tauntFx=fxPlay(T2.fx,o.x,o.y,{follow:o,loop:true,dur,size:T2.size*uk,alpha:T2.alpha,add:true,dy:T2.dy*uk});   // ב-FXLIB.list: מכבד ערפל
  if(N.tauntFx)MBANIMS.stat.status++;
}

// טעינה מראש: כל הגיליונות שבשימוש כאן, יחד עם אלה של mbfxPreload (moba-fx.js), בתחילת משחק
function mbAnimIds(){
  const A=MBANIM,ids=new Set(Object.values(A.circOf).concat(Object.values(A.hitFx),Object.values(A.heroFx),[A.taunt.fx]));
  for(const v of Object.values(A.flash))if(v)ids.add(v.fx);
  for(const v of Object.values(A.self))ids.add(v.fx);
  for(const id of ['anvil','wall','cleave','spin','rage','rain','bubble','blizzard'])for(const v of Object.values(A[id]))if(typeof v==='string')ids.add(v);
  return [...ids];
}
{const old=mbfxPreload;mbfxPreload=function(){old.apply(this,arguments);if(typeof fxPreload==='function'&&typeof FXDATA!=='undefined')fxPreload(mbAnimIds())}}
