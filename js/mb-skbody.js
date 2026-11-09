/* משחקי השאול: הגוף בסקילים של הלוחם, הצייד, הקוסמת והמתנקש (MBSKBODY, השיפוץ, roster 4.1 ומפרט DANA, MAX ל-BOB, 10.11.2026). רק מראה.
   כל הסקילים פוגעים ברגע ההטלה או לפי הזמנים שלהם ב-moba-kits.js. הגוף מתחיל באותו פריים (mbCast) ולא מעכב ולא מזיז כלום.
   בפלג הגוף העליון (@up): הרגליים ממשיכות לרוץ, ואף פעם לא נעול. clip: הקליפ. from/to: איזה קטע (חלק מהאורך). dur: בכמה שניות.
   הקליפים נבדקו על השלד האמיתי (Rig_Medium). Throw, Ranged_Bow_Release_Up ו-Ranged_Magic_Raise מקבצי anim_mbx_* (נטענים כשנכנסים למשחקי השאול).
   הטנק לא כאן (mb-anvil3d.js, mb-tankskill3d.js). קליפ חסר: בלי גוף, הסקיל עובד כרגיל. מחיקה: הקובץ והשורה ב-index.html */
const MBSKBODY={
  on:true,
  pre:['anim_mbx_gen','anim_mbx_ranged','anim_mbx_move'],
  wait:1.5,   // סקיל בתחילת המשחק, לפני שקובץ הקליפים נטען: מחכים עד כאן ואז בלי גוף   // מורידים כשנכנסים למשחקי השאול (בתלת-ממד)
  kit:{
    // הלוחם: גל חרב מחיתוך רוחבי (העיצוב המאושר, נשאר), סיבוב מלא, ושאגה. התקיפה הרגילה היא החיתוך היורד (mb-atk3d.js), לפי MAX ו-DANA 10.11
    warrior:{s1:{clip:'Melee_1H_Attack_Slice_Horizontal',from:0.06,to:0.3,dur:0.22},s2:{clip:'Melee_2H_Attack_Spin',from:0,to:1,dur:0.45},ult:{clip:'Taunt',from:0,to:0.55,dur:0.6}},
    // הצייד: חץ ברק במשיכה מלאה ושחרור, זריקת רשת (Throw), וירייה לשמיים (Release_Up)
    hunter:{s1:{clip:'Ranged_Bow_Release',from:0,to:0.45,dur:0.32},s2:{clip:'Throw',from:0.25,to:0.6,dur:0.3},ult:{clip:'Ranged_Bow_Release_Up',from:0,to:0.45,dur:0.4}},
    // הקוסמת: גל קדימה (שליחה מלאה), זימון הכלא, וידיים למעלה לסופה
    mage:{s1:{clip:'Ranged_Magic_Shoot',from:0,to:0.7,dur:0.38},s2:{clip:'Ranged_Magic_Summon',from:0,to:0.6,dur:0.45},ult:{clip:'Ranged_Magic_Raise',from:0,to:0.5,dur:0.55}},
    // המתנקש: צעד צל ומכה מיד בהופעה, התחמקות לאחור (במקום סלטה, שאין לה קליפ), ואצבע שמסמנת את המטרה
    assassin:{s1:{clip:'Melee_1H_Attack_Slice_Horizontal',from:0.08,to:0.26,dur:0.16},s2:{clip:'Dodge_Backward',from:0,to:0.55,dur:0.3},ult:{clip:'Ranged_Magic_Shoot',from:0,to:0.3,dur:0.25}}
  },
  stat:{casts:0,played:0,miss:0}
};
function mbSkBodyTick(u,a){
  const T=u.skb,st=a.skbN;if(!T||T.n===st)return;a.skbN=T.n;
  const C=MBSKBODY.kit[u.kit]&&MBSKBODY.kit[u.kit][T.slot];if(!C)return;
  const n=R3D.clips[C.clip+'@up']?C.clip+'@up':C.clip;
  if(!R3D.clips[n]){T.t0=T.t0||performance.now();if(performance.now()-T.t0<MBSKBODY.wait*1000){a.skbN=st;return}MBSKBODY.stat.miss++;return}   // קובץ הקליפים עוד נטען: מנסים שוב, עד wait שניות
  once(a,n,C.dur,false,C.from);const x=act(a,n);if(x){const D=x.getClip().duration;x.timeScale=D*(C.to-C.from)/C.dur}MBSKBODY.stat.played++;
}
(function(){
  if(!MBSKBODY.on||typeof mbCast!=='function')return;
  const bc=mbCast;mbCast=function(u,slot){const r=bc.apply(this,arguments);
    if(r&&u&&u.k==='hero'&&MBSKBODY.kit[u.kit]&&MBSKBODY.kit[u.kit][slot]){u.skb={slot,n:((u.skb&&u.skb.n)||0)+1};MBSKBODY.stat.casts++}return r};
  const bs=mobaStart;mobaStart=function(){const r=bs.apply(this,arguments);if(typeof R3D!=='undefined'&&R3D.on&&typeof m3dGo==='function')for(const k of MBSKBODY.pre)m3dGo(k).catch(()=>{});return r};
  const bu=mb3dUnit;mb3dUnit=function(e){const r=bu.apply(this,arguments);if(e&&e.k==='hero'&&e.skb){const a=R3D.actors.get(e);if(a)mbSkBodyTick(e,a)}return r};
  const bp=syncPlayer;syncPlayer=function(){const r=bp.apply(this,arguments);const u=S.mb&&MB&&MB.me;if(u&&u.skb&&R3D.player)mbSkBodyTick(u,R3D.player);return r};
})();
