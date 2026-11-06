/* מספר כוח (ניר, 2.11.2026, בהשראת XP Hero: "חלון הציוד הוא טבלה עם הרבה 0%"). מספר אחד לכל חפץ ולגיבור, שמסכם את כל הסטטים,
   כדי שאפשר יהיה להשוות שני חפצים במבט.
   - חפץ: כל סטט שלו (gStats ב-gear.js: איכות, Aging, בונוס מחלקה וכוח) כפול המשקל שלו ב-GEAR.stats, וסטט של המחלקה שלך שווה יותר (cls).
   - גיבור: כל מה שלבוש, ועוד בונוס הסטים, הנקודות, עץ הסקילים והפסיבית של המחלקה (stats.js, sets.js, heroes.js).
   כשהמספר של הגיבור עולה, חלון הציוד חוגג (powSync, מ-gearDraw). מה שלבוש עכשיו נזכר ב-SAVE.hero.powSeen.
   ההצגה: כרטיס החפץ (itemcard.js), התרמיל (gBagTile ב-gear.js), טור הסטטים (gearui.js) והשלל בפיד (feed.js). הטקסטים ב-lang.js תחת 'pow.' */
const POWER={
  mult:10,            // המספר שמוצג: הציון כפול זה (חרב עץ 100, חרב ברזל 250), כדי שיהיה מספר גדול ועגול
  tier:0.01,          // תוספת קטנה לכל שכבה, כדי ששני חפצים זהים בשכבות שונות לא ייצאו שווים
  // כמה שווה סטט של המחלקה, ביחס למשקל הרגיל (כמו בונוס המחלקה, #313). מחלקה שלא כתובה כאן: הכל ×1
  cls:{
    warrior:{sdmg:1.25,hp:1.25,def:1.2},
    hunter: {gdmg:1.25,speed:1.2,crit:1.2,aspd:1.2},
    mage:   {gdmg:1.25,regen:1.25,magnet:1.2}
  },
  same:0.05           // הפרש קטן מזה (בציון, לפני mult) נחשב "אותו דבר": בלי ▲/▼
};

const powW=k=>((GEAR.stats[k]||{}).w||0)*(((POWER.cls[typeof heroId==='function'&&heroId()]||{})[k])||1);
// ציון של אוסף סטטים, בפורמט של GEAR.stats
function powStats(s){let n=0;for(const k in s||{})n+=s[k]*powW(k);return n}
// ציון של חפץ, לפני mult. במקום gScore בכל מה שהשחקן רואה (▲/▼, "הכי טוב"), כדי שהכל יסכים עם המספר שעל הכרטיס
const pScore=id=>{const it=gItem(id);return it?it.tier*POWER.tier+powStats(gStats(id)):0};
// המספר שמוצג על חפץ
const powItem=id=>id&&gItem(id)?Math.round(pScore(id)*POWER.mult):0;
// המספר של הגיבור: כל מה שלבוש, הסטים, הנקודות, העץ והפסיבית
function powHero(){
  const w=gearWorn(),h=HEROES.list[heroId()]||{};
  let n=w.reduce((a,id)=>a+pScore(id),0)+powStats(setStats(w))+powStats(statsGive())+powStats(treeGive())+powStats(h.passive);
  return Math.round(n*POWER.mult);
}
// ההפרש מול מה שלבוש באותה משבצת, במספר שמוצג. אין מה שלבוש: null
function powVs(id){const it=gItem(id);if(!it||it.slot==='orbit')return null;const o=gGet(it.slot,gTarget(it));return gItem(o)?powItem(id)-powItem(o):null}
// ▲/▼ קטן עם ההפרש, לשלל בפיד. אין השוואה או אותו דבר: ריק
const powTag=id=>{const d=powVs(id);return d?' '+(d>0?'▲':'▼')+Math.abs(d):''};

// חלון הציוד: עלה המספר מאז הפעם הקודמת? חגיגה, ו-+N שעולה מהמספר בטור (gStatPanel). נקרא מ-gearDraw
let powUp=null;
function powSync(){
  const n=powHero(),was=SAVE.hero.powSeen;SAVE.hero.powSeen=n;
  if(was==null||n<=was)return;
  powUp={d:n-was,t:performance.now()};
  if(typeof celebrate==='function'&&typeof P!=='undefined'&&P)celebrate(P.x,P.y,'upgrade','✦ +'+(n-was));
}
// הראש של טור הסטטים: המספר הגדול של הגיבור
function powHeroHtml(){
  const n=powHero(),up=powUp&&performance.now()-powUp.t<1500?powUp:null;
  return '<div class="gpow'+(up?' gpup':'')+'"><span class="gpowi" aria-hidden="true">✦</span><b><bdi>'+n+'</bdi></b><span>'+T('pow.hero')+'</span>'+(up?'<i class="gpowd"><bdi>+'+up.d+'</bdi></i>':'')+'</div>';
}
