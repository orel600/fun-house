/* דרגות: כל 20 רמות דמות נפתח קווסט עלייה בדרגה (game-design.md, "דרגה (כל 20 רמות)").
   איזו דרגה נפתחת תלוי באיך ששיחקת (SAVE.hero.style מ-heroes.js): בעיקר חרב פותחת אביר, בעיקר קשת או קסם סייר, ערבוב לוחם-קשת, והרבה חפצי הגנה שומר.
   העלייה עצמה היא קווסט בטבלה QUESTS (quests.js, kind:'rank', הפרס rank:<שלב>), ולא באמצע קרב. כשלוקחים את הפרס: הדרגה נשמרת ב-SAVE.hero,
   הבונוס הקבוע שלה חל מעכשיו בכל ריצה (rankReset, מ-heroReset), ו-celebrate (fx.js) הוא הטקס.
   כאן גם רמת הדמות הקבועה: SAVE.hero.xp הוא כל ה-XP שנאסף אי פעם (פרסי קווסטים וחלק מה-XP של כל ריצה), והרמה נגזרת ממנו.
   השמות ב-lang.js תחת 'rank.<id>'. שלב 2: look (חלקי שריון וצבע, rankArmor3d ב-render3d.js) כבר פעיל. skill: סקיל החתימה של הדרגה (sigskill.js), כפתור משלו בעולם ובכפר */

const RANKS={
  every:20,                 // כל כמה רמות דמות נפתחת עלייה בדרגה
  /* XP לרמה הבאה: base+per*רמה, ומרמה late.from עוד late.k*(רמה-from)^late.pow, כדי שהרמות הגבוהות ייקחו זמן (ת11, docs/plan-longevity.md).
     max: הרמה הכי גבוהה. run: איזה חלק מה-XP של ריצה בזירה נשאר לדמות */
  xp:{base:80,per:24,run:0.5,max:100,late:{from:40,k:1.6,pow:2}},   // כוונון קצב 6.11: פי 1.6 (היו 50/15/1), כדי שהריגה בלבד תיקח כ-45-50 שעות. סך הכל: כ-22 אלף XP עד רמה 40, וכ-240 אלף עד 100. ת12 (tools/playtime.js) מכוונן
  pick:{mix:0.35,guard:0.5},     // mix: מאיזה חלק מהנזק הנשק השני נחשב ערבוב. guard: מאיזה חלק מזמן הריצות עם חפץ הגנה זה שומר
  /* מראה בתלת-ממד: חלקים שכבר יש במודלים של KayKit (Knight_Cape, Mage_Hat...), לפי הסוף של השם. חלק שאין במודל (למשל בדמות של ניר) פשוט לא נוגעים בו.
     bare: מה מוסתר לפני הדרגה הראשונה. look.show: מה נדלק בדרגה. look.glow: זוהר בצבע הדרגה על החלקים האלה (0 עד 1).
     דרגה הבאה = שורה חדשה עם עוד חלקים או זוהר חזק יותר */
  bare:['Cape','HelmetVisor'],
  /* tier: באיזה שלב (1 = רמה 20, 2 = רמה 40). when: איזה סגנון פותח אותה (rankStyle). bonus: סטטים כמו של ציוד (GEAR.stats), בכל ריצה.
     icon, col: בממשק ובטקס, ו-col גם הזוהר של השריון. look: ראו bare למעלה. skill: סקיל החתימה (SIGSKILL.list ב-sigskill.js) */
  list:{
    guardian:{tier:1,when:s=>s.guard>=RANKS.pick.guard,bonus:{hp:50,regen:0.5},icon:'🛡️',col:'#7FB2FF',look:{show:['Cape','HelmetVisor'],glow:0.4},skill:'bastion'},
    knight:  {tier:1,when:s=>s.sword>=1-RANKS.pick.mix,bonus:{hp:20,sdmg:15},icon:'⚔️',col:'#D9DEE6',look:{show:['Cape','HelmetVisor'],glow:0.3},skill:'dawnblade'},
    ranger:  {tier:1,when:s=>s.sword<=RANKS.pick.mix,bonus:{gdmg:15,speed:5},icon:'🏹',col:'#A8D08D',look:{show:['Cape'],glow:0.35},skill:'starfall'},
    hybrid:  {tier:1,when:()=>true,bonus:{sdmg:10,gdmg:10},icon:'🗡️',col:'#F4C74F',look:{show:['Cape','HelmetVisor'],glow:0.3},skill:'emberstorm'}
  }
};

const rankId=()=>RANKS.list[SAVE.hero.rankId]?SAVE.hero.rankId:null;
const rankName=id=>T('rank.'+id);

/* ---- רמת הדמות ---- */
// כמה XP מרמה lv לרמה הבאה. ברמה המקסימלית: אין רמה הבאה (Infinity, וגם הלולאות כאן וב-stats.js נעצרות שם)
function rankNeed(lv){const X=RANKS.xp,L=X.late;if(lv>=X.max)return Infinity;
  return X.base+X.per*lv+(lv>L.from?Math.round(L.k*Math.pow(lv-L.from,L.pow)):0)}
// כמה XP בסך הכל צריך כדי להגיע לרמה lv
function rankXpAt(lv){let x=0;for(let l=1;l<lv;l++)x+=rankNeed(l);return x}
function rankLevelOf(xp){let lv=1;while(xp>=rankNeed(lv)){xp-=rankNeed(lv);lv++}return lv}
// אחרי כל שינוי ב-SAVE.hero.xp: הרמה מתעדכנת, ועלייה מקבלת באנר
function rankSync(){
  rankFix();const lv=rankLevelOf(SAVE.hero.xp||0);
  if(lv>SAVE.hero.level){const from=SAVE.hero.level;SAVE.hero.level=lv;lpLevelUp(from,lv);   // הרגע הגדול וכרטיס של מה שנפתח (levelpath.js)
    statBadge();if(P&&S&&S.mode==='play')celebrate(P.x,P.y-20,'rank');const E=RANKS.every;if(Math.floor(lv/E)>Math.floor(from/E))rankCall(Math.floor(lv/E)*E)}   // גם כשקפצת כמה רמות בבת אחת
}
/* רמה 20, 40...: הכוהנת קוראת לך (ניר, 5.11.2026: "לא ברור איפה לוקחים אותו ואם בכלל קיים").
   הודעה גדולה וחגיגה, ובכפר: סימן ! גדול וסגול מעליה וחץ אליה (drawQuestMarks ב-quests.js). רק אם יש קווסט דרגה לשלב הזה */
function rankCall(lv){
  const q=QUESTS.list.find(q=>q.kind==='rank'&&q.reward.rank===lv/RANKS.every);
  if(!q||QS().done[q.id])return false;
  const txt=T('rank.call',T('npc.'+q.giver)[0]);
  banner(txt,C.lilac);if(typeof feedTitle==='function')feedTitle(txt,C.lilac);
  if(P)celebrate(P.x,P.y-20,'rank','🎖️');
  return true;
}
// שחקן קיים לא מאבד רמות כשהעקומה משתנה: ה-XP שלו עולה לתחילת הרמה שכבר יש לו, והעקומה החדשה חלה מכאן. מ-rankSync ו-rankReset, פעם אחת
function rankFix(){const h=SAVE.hero;if(!h||h.xpv>=2)return;h.xpv=2;   // xpv: פעם אחת, במעבר לעקומה של ת11
  if(rankLevelOf(h.xp||0)<(h.level||1)){h.level=Math.min(h.level,RANKS.xp.max);h.xp=Math.max(h.xp||0,rankXpAt(h.level))}}
// בסוף ריצה (runEnd ב-village.js): חלק מה-XP של הריצה נשאר
function rankRunXp(){const v=Math.round((S.xpRun||0)*RANKS.xp.run);if(v>0){SAVE.hero.xp=(SAVE.hero.xp||0)+v;rankSync()}}

/* ---- איזו דרגה נפתחת: לפי סגנון המשחק ---- */
function rankStyle(){
  const st=SAVE.hero.style||{},sw=st.dmg_sword||0,gn=st.dmg_gun||0;
  return{sword:sw+gn?sw/(sw+gn):0.5,guard:st.t_run?(st.t_defense||0)/st.t_run:0};
}
function rankFor(tier){const s=rankStyle();return Object.keys(RANKS.list).find(id=>RANKS.list[id].tier===tier&&RANKS.list[id].when(s))||null}

/* ---- עלייה: נקרא מ-questClaim כשהפרס הוא rank ---- */
function rankUp(tier){
  const id=rankFor(tier);if(!id)return null;
  const R=RANKS.list[id],old=RANKS.list[rankId()];
  if(old)gApply(old.bonus,-1);
  SAVE.hero.rank=tier;SAVE.hero.rankId=id;
  gApply(R.bonus,1);P.hp=P.maxHp;   // הבונוס חל מיד, וגם בכל ריצה מעכשיו
  saveNow();
  celebrate(P.x,P.y-10,'rank',R.icon);   // הטקס: עמוד אור, ניצוצות וצליל (fx.js)
  banner(T('rank.up',rankName(id)),R.col);
  return id;
}
// בתחילת כל ריצה (ובכפר): הבונוס של הדרגה. נקרא מ-heroReset
function rankReset(){rankFix();const R=RANKS.list[rankId()];if(R)gApply(R.bonus,1)}

// בממשק: הדרגה הנוכחית, למשל "⚔️ אביר"
const rankLabel=()=>{const id=rankId();return id?RANKS.list[id].icon+' '+rankName(id):''};
