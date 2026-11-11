/* כמה מכות למקור משאבים (GHITS, ניר 11.11.2026: "משאבים נעלמים במכה אחת, ומרגיש שלא מקבלים את הכסף").
   גיבור ברמה 37 שבר כל עץ וסלע במכה אחת (tools/gather-feel.js: 1.0 מכות למקור). עכשיו לכל מקור יש תקרה: מכה אחת מורידה לכל היותר
   max/hits מהחיים, בכל רמה ובכל סקיל. גיבור חלש עדיין צריך כמה מכות שהוא צריך היום (התקרה רק עוצרת למעלה).
   מכות שמגיעות ביחד (כמה חצים, סקיל שפוגע באזור, מכה צמודה של מומחיות) נספרות כמכה אחת: חלון win שניות לכל מקור.
   כלי איסוף טוב יותר = פחות מכות (tool), אבל אף פעם לא פחות מ-min. כלי חלש מדי למקור (gtWeak) = עוד weak מכות.
   כל מכה גם משלמת: החלק של החומר הראשי שכבר ירד מהחיים נופל מיד עם "+N" (pay), והשאר כשהמקור נשבר.
   הסך: ההגרלה של gtDrop (gtool.js) כפול yld, כי שבירה לוקחת יותר זמן.
   רק בעולם (gOn ב-gather.js). הזירה של אוראל לא משתנה.
   חיבור: ghCap מ-damage (combat.js) ומהמכה הצמודה (gmHit ב-gmastery.js), ghDrop מ-nodeDown (nodes.js) */
const GHITS={
  hits:{tree:3,rock:4,vein:4,crystal:4,bush:3,reed:3,chest:3},   // כמה מכות לפי הצורה (shape ב-NODES.kinds), עם כלי בדרגה 1
  def:4,
  tool:[0,0,0,1,1,1],     // כמה מכות פחות לפי דרגת הכלי (gtool.js): 3 ומעלה מכה אחת פחות
  min:3,                  // אף פעם לא פחות
  weak:1,                 // כלי חלש מדי למקור: עוד מכה (הכלי החלש כבר מאט בעצמו, GTOOL.slow)
  win:0.2,                // שניות: מכות על אותו מקור בתוך החלון נספרות כמכה אחת
  pay:true,               // החומר הראשי נופל בחלקים, בכל מכה
  yld:1.2,                // פי כמה החומר הראשי ממקור בעולם: שבירה לוקחת עכשיו יותר זמן, אז כל מקור נותן קצת יותר (מדידה: ±20% לדקה לפי אזור, tools/gather-feel.js)
  off:false,              // כבוי: כמו לפני 11.11 (מדידת "לפני" ב-tools/gather-feel.js --off)
  stat:{cap:0,pay:0,paid:0}
};
// כמה מכות המקור n צריך לכל הפחות
function ghHits(n){
  const sh=gShape(n),k=gtOf(n),G=GHITS;let h=G.hits[sh]||G.def;
  if(k){h-=G.tool[gtTier(k)]||0;if(gtWeak(n))h+=G.weak}
  return Math.max(G.min,h);
}
// אחרי שמכה ירדה מהמקור n. hp0: החיים לפני המכה. מגביל, ומשלם את החלק שירד
function ghCap(n,hp0){
  if(GHITS.off||!gOn()||!n||!n.node||n.dead||!n.max)return;
  const t=S.wd.t;if(n.ghT==null||t-n.ghT>GHITS.win){n.ghT=t;n.ghHp=hp0}
  const cap=n.max/ghHits(n)*1.001;   // קצת מעל, כדי שהמכה האחרונה באמת שוברת
  if(n.hp<n.ghHp-cap){n.hp=n.ghHp-cap;GHITS.stat.cap++}
  ghPay(n);
}
// החומר הראשי של המקור, מוגרל פעם אחת במכה הראשונה (אותה הגרלה כמו כשהוא נשבר)
function ghMain(n){
  if(n.ghR!==undefined)return n.ghR;
  const K=NODES.kinds[n.kind],r=gtMain(n.kind);n.ghR=null;n.ghPaid=0;if(!K||!r)return null;
  const D=gtDrop(n,K.drop),a=D[r][1]*GHITS.yld;n.ghR=r;n.ghTot=Math.floor(a)+(Math.random()<a%1?1:0);return r;
}
function ghPay(n){
  if(!GHITS.pay||n.hp<=0)return;   // ההכה שוברת: הכל ב-ghDrop
  const r=ghMain(n);if(!r)return;
  const due=Math.floor(n.ghTot*(1-n.hp/n.max)),k=due-n.ghPaid;if(k<=0)return;
  n.ghPaid=due;const got=runGive({[r]:[1,k]},n.x,n.y);if(S.nd)S.nd.got.push(...got);GHITS.stat.pay++;GHITS.stat.paid+=k;
}
// השלל כשהמקור נשבר (nodeDown): מה שנשאר מהחומר הראשי אחרי מה ששולם במכות
function ghDrop(n,D){
  if(!gOn()||n.ghR==null||n.ghR===undefined)return D;
  const r=n.ghR,o=Object.assign({},D),left=n.ghTot-(n.ghPaid||0);
  if(left>0)o[r]=[1,left].concat((D[r]||[]).slice(2));else delete o[r];
  n.ghR=undefined;n.ghPaid=0;n.ghT=null;   // מקור שצומח מחדש מתחיל מההתחלה
  return o;
}
