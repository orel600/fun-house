/* משחקי השאול: אזור הבית (חבילת הבוקר של אוראל, 9.11.2026, משימה 6).
   העיגול סביב כל בסיס (רדיוס MOBA.base.healR, 240) כבר מצויר ברצפה (moba-look.js), והריפוי של החברים בתוכו (20% מהחיים בשנייה, mbTower ב-moba.js) לא משתנה.
   מה נוסף:
   - עונש לאויב: גיבור של הקבוצה השנייה בתוך העיגול שלך מאבד 10% מהחיים המקסימליים בשנייה, בתקתוק כל חצי שנייה, תמיד פעיל (אוראל).
     דרך mbDmg הרגיל, כך שמגן והגנה עובדים עליו כמו על כל נזק. חיילים לא נענשים (הם אלה שמפילים את הבסיס).
   - אזהרה: כשגיבור שלך מתקרב לעיגול של האויב, או בתוכו, העיגול זוהר אדום ופועם.
   - ניצנוץ ריפוי עדין על חברים שמתרפאים בתוך העיגול.
   - חזרה לבסיס (moba-recall.js): העיגול שלך מהבהב בזהב ברגע הנחיתה.
   - במפה הקטנה: שני העיגולים מוצללים בצבע הקבוצה.
   כל המספרים ב-MOBA.zone. **ערכים התחלתיים, לא נבדקו במשחק אמיתי.** חיבור: עוטף את mobaUpdate ואת mobaDraw (moba.js) ואת mbRecallTick */
MOBA.zone={
  hurt:{on:true,k:0.10,every:0.5,heroes:true,minions:false},   // עונש לאויב: חלק מהחיים המקסימליים בשנייה, כל כמה שניות מתקתק
  warn:{pad:70,a:0.55,rate:5},          // אזהרה: כמה לפני העיגול מתחילה, כמה חזקה, וכמה מהר פועמת
  shimmer:{every:0.7,size:60},          // ניצנוץ ריפוי: כל כמה שניות על כל חבר שמתרפא
  recall:{t:0.6,col:'#FFD34D'},         // הבהוב הזהב בחזרה לבסיס
  mini:{a:0.22},                        // הצללה במפה הקטנה
  stat:{ticks:0,dmg:0,warn:0,shimmer:0,flash:0}
};
const MBZ={acc:0,flash:[null,null],warnT:0};
const mbZoneBase=tm=>MB&&MB.u&&MB.u.find(b=>b.k==='base'&&b.team===tm);
// מי בתוך העיגול של הקבוצה tm (רדיוס הריפוי, כמו ב-mbTickBase)
const mbZoneIn=(u,b)=>b&&!b.dead&&mbDist(u,b)<MOBA.base.healR;
function mbZoneTick(dt){
  const Z=MOBA.zone,H=Z.hurt;if(!MB||MB.over)return;
  MBZ.acc+=dt;const tick=MBZ.acc>=H.every;if(tick)MBZ.acc-=H.every;
  for(const tm of [0,1]){const b=mbZoneBase(tm);if(!b||b.dead)continue;
    for(const u of MB.u){if(u.dead||u.team===tm||!mbZoneIn(u,b))continue;
      if(!H.on||!tick||!(u.k==='hero'?H.heroes:u.k==='minion'?H.minions:false))continue;
      const d=mbDmg(b,u,u.max*H.k*H.every,'physical');if(d>0){Z.stat.ticks++;Z.stat.dmg+=d}}
    // ניצנוץ על חברים שמתרפאים (רק מראה)
    for(const u of MB.u){if(u.dead||u.k!=='hero'||u.team!==tm||!mbZoneIn(u,b)||u.hp>=u.max)continue;
      u.zShT=(u.zShT||0)-dt;if(u.zShT>0)continue;u.zShT=Z.shimmer.every;
      if(typeof fxLess==='function'&&fxLess()||!mbShow(u))continue;
      if(typeof mbfxLib==='function'&&mbfxLib('sp_heal',u.x,u.y-20,{follow:u,dy:-20,size:Z.shimmer.size,add:true}))Z.stat.shimmer++}
  }
  for(const f of MBZ.flash)if(f)f.t-=dt;
}
// כמה קרוב אני לעיגול של האויב: 0 רחוק, 1 בפנים
function mbZoneWarnK(){
  const me=MB&&MB.me;if(!me||me.dead)return 0;const b=mbZoneBase(1-me.team);if(!b||b.dead)return 0;
  const d=mbDist(me,b)-MOBA.base.healR,p=MOBA.zone.warn.pad;return d<=0?1:d<p?1-d/p:0;
}
// הציור בקנבס, מעל הרצפה: האזהרה האדומה על העיגול של האויב, והבהוב הזהב על העיגול שלי
function mbZoneDraw(){
  const Z=MOBA.zone,r=MOBA.base.healR,me=MB.me;if(!me)return;
  const ring=(tm,col,a,w)=>{const b=mbZoneBase(tm);if(!b)return;ctx.save();ctx.translate(b.x,b.y);ctx.scale(1,0.9);ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.shadowColor=col;ctx.shadowBlur=14;ctx.beginPath();ctx.arc(0,0,r-6,0,7);ctx.stroke();ctx.restore()};
  const k=mbZoneWarnK();
  if(k>0){const calm=typeof calmOn==='function'?calmOn():typeof RM!=='undefined'&&RM,pulse=calm?1:0.65+0.35*Math.sin(MB.t*Z.warn.rate*Math.PI);
    ring(1-me.team,C.blood||'#FF4D4D',Z.warn.a*k*pulse,6+4*k);Z.stat.warn++}
  const f=MBZ.flash[me.team];if(f&&f.t>0){const q=f.t/Z.recall.t;ring(me.team,Z.recall.col,q,10*q+3)}
}
(function(){
  if(typeof mobaUpdate!=='function')return;
  const bu=mobaUpdate;mobaUpdate=function(dt){const r=bu.apply(this,arguments);try{if(S.mb&&MB)mbZoneTick(dt)}catch(e){console.warn('mb-zone',e)}return r};
  if(typeof mobaDraw==='function'){const bd=mobaDraw;mobaDraw=function(){const r=bd.apply(this,arguments);try{if(MB)mbZoneDraw()}catch(e){console.warn('mb-zone',e)}return r}}
  if(typeof mbRecallTick==='function'){const br=mbRecallTick;mbRecallTick=function(M,dt){const was=MB.me&&MB.me.recall;const r=br.apply(this,arguments);
    if(was&&MB.me&&!MB.me.recall&&mbDist(MB.me,MB.me.home)<1){MBZ.flash[MB.me.team]={t:MOBA.zone.recall.t};MOBA.zone.stat.flash++}return r}}
  if(typeof MBLOOK!=='undefined'&&MBLOOK.miniMarks)MBLOOK.miniMarks.push((c,X,Y,k)=>{if(!MB||!MB.u)return;
    for(const tm of [0,1]){const b=mbZoneBase(tm);if(!b)continue;c.save();c.globalAlpha=MOBA.zone.mini.a;c.fillStyle=MOBA.team[tm];c.beginPath();c.arc(X(b.x),Y(b.y),MOBA.base.healR*k,0,7);c.fill();c.restore()}});
  if(typeof reset==='function'){const rs=reset;reset=function(){MBZ.acc=0;MBZ.flash=[null,null];return rs.apply(this,arguments)}}
})();
