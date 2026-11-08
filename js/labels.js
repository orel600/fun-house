/* שמות מעל אויבים בעולם, בלי עומס (ניר, סרטון 7.11.2026: "דרדק אימת הברווזים", "מנהיג הלהקה", "משוריין", "מגן יסודות"
   ו"ברוזה האמיץ-כמעט" עולים אחד על השני ועל כפתורי הסקילים).
   כל מי שמצייר שם מעל אויב (foelore.js, affix.js, hunt.js, foeai.js) לא מצייר ישר, אלא מוסיף לרשימה (lblAdd), ובסוף lblFlush מחליט:
   - עד LABELS.max שמות מלאים: החשובים קודם (pri: נדירה ומבוקש, אחר כך עלית עם שם, מנהיג, תכונה, ושם רגיל), ובין שווים הקרוב קודם.
   - השאר מתכווצים לאייקון קטן בלבד.
   - שם שעולה על שם אחר זז למעלה (עד LABELS.nudge פעמים), ואם עדיין עולה, לא מצויר.
   - שם שהיה נופל על כפתור (סקילים, אולטימייט, סרגל, מפה, קווסט) לא מצויר. הכפתורים נמדדים מהמסך (getBoundingClientRect).
   רק בעולם (world.js עוטף את הציור ב-lblBegin/lblFlush). בלי lblBegin, כל אחד מצייר כמו קודם */
const LABELS={
  max:3,        // כמה שמות מלאים לכל היותר
  nudge:3,      // כמה פעמים מזיזים למעלה שם שעולה על שם אחר
  gap:3,        // רווח בין שמות (פיקסלים של מסך)
  hudPad:6,     // רווח מכפתור
  bg:'rgba(10,12,20,0.7)',
  hud:'#skills>*,#ult,#sig,#spell,#divine,#swap,#nav>*,#miniMap,#menuBtn,#qRail>*,#qTrack,#guide,#who,#whud,#feedCol .frow,#msgLane>*',
  // בקרב (אויב קרוב, msgFight ב-msglane.js. ניר 8.11, docs/combat-feel-2026-11-08.md פרק 3): השמות עמדו בדיוק על מרכז הקרב ועל האזהרות.
  // עכשיו: שם מלא אחד לכל היותר (החשוב), כולם עמומים, ובלי בועות דיבור. גם שמות הדמויות והשלטים (worldnpc.js) עמומים
  fight:{max:1,a:0.45,npcA:0.4,bubA:0},   // bubA: בועות הדיבור של דמויות המחנה (wlife.js). 0 = לא מצוירות בקרב
  stat:{full:0,icon:0,nudged:0,hidden:0,hud:0,bubble:0,fight:0}   // לבדיקה (tools/check.js)
};
let LBQ=null,LBHUD=null,LBHUDT=0;addEventListener('resize',()=>{LBHUD=null});
function lblBegin(){LBQ=[]}
const lblFight=()=>!!S&&!!S.wd&&typeof msgFight==='function'&&msgFight();
// כמה שקוף לצייר שמות של דמויות ושלטים בעולם עכשיו (world.js)
const lblFightA=()=>lblFight()?LABELS.fight.npcA:1;
// t: הטקסט המלא. icon: מה שנשאר כשמתכווץ (או '' = לא מצויר בכלל). x,y: בקואורדינטות הציור (כמו fillText). pri: חשיבות. d: מרחק מהגיבור
function lblAdd(o){if(!LBQ)return false;if(o.t||o.paint)LBQ.push(o);return true}
// הכפתורים על המסך, פעם ב-0.25 שניות
function lblHud(){const now=performance.now();if(LBHUD&&now-LBHUDT<250)return LBHUD;LBHUDT=now;LBHUD=[];
  for(const e of document.querySelectorAll(LABELS.hud)){if(e.hidden||e.closest('[hidden]'))continue;const r=e.getBoundingClientRect();if(r.width<2||r.height<2)continue;
    const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity<0.05)continue;LBHUD.push(r)}
  return LBHUD}
function lblFlush(){
  const q=LBQ;LBQ=null;if(!q||!q.length)return;
  const Z=ZOOM||1,P_=LABELS.hudPad,hud=lblHud(),st=LABELS.stat,placed=[];
  q.sort((a,b)=>(b.pri||0)-(a.pri||0)||(a.d||0)-(b.d||0));
  const hit=(a,b,p)=>a.l<b.r+p&&b.l<a.r+p&&a.t<b.b+p&&b.t<a.b+p;
  const fight=lblFight(),mx=fight?LABELS.fight.max:LABELS.max;if(fight)st.fight++;
  ctx.save();ctx.textAlign='center';ctx.direction=DIR;let full=0;if(fight)ctx.globalAlpha=LABELS.fight.a;
  for(const o of q){
    if(fight&&o.paint){st.hidden++;continue}   // בקרב: בלי בועות דיבור
    // בועת דיבור (foelore.js, ביקורת 7.11.2026): עוברת באותו סידור, אחרונה (pri -1): השמות נשארים ליד הראש, והבועה עולה מעליהם. bw,bh: הגודל, paint(y): מציירת
    if(o.paint){let y=o.y,ok=false;
      for(let i=0;i<=LABELS.nudge;i++){const r={l:(o.x-o.bw/2)*Z,r:(o.x+o.bw/2)*Z,t:(y-o.bh*0.75)*Z,b:(y+o.bh*0.25+7/Z)*Z};
        if(hud.some(b=>hit(r,{l:b.left,r:b.right,t:b.top,b:b.bottom},P_))){st.hud++;break}
        if(!placed.some(p=>hit(r,p,LABELS.gap))){placed.push(r);ok=true;if(i)st.nudged++;break}
        y-=o.bh+LABELS.gap/Z}
      if(ok){st.bubble++;o.paint(y);ctx.textAlign='center'}else st.hidden++;continue}
    const big=full<mx,t=big?o.t:o.icon;if(!t){st.hidden++;continue}
    const fs=big?o.fs:o.fs*0.85;ctx.font=(o.w||'800')+' '+fs+'px Heebo, system-ui, sans-serif';
    const tw=ctx.measureText(t).width+10/Z,h=fs*1.25;let y=o.y,ok=false;
    for(let i=0;i<=LABELS.nudge;i++){
      const r={l:(o.x-tw/2)*Z,r:(o.x+tw/2)*Z,t:(y-fs*0.92)*Z,b:(y-fs*0.92+h)*Z};
      if(hud.some(b=>hit(r,{l:b.left,r:b.right,t:b.top,b:b.bottom},P_))){st.hud++;break}   // על כפתור: לא מציירים
      if(!placed.some(p=>hit(r,p,LABELS.gap))){placed.push(r);ok=true;if(i)st.nudged++;break}
      y-=h+LABELS.gap/Z}
    if(!ok){st.hidden++;continue}
    if(big)full++;st[big?'full':'icon']++;
    ctx.fillStyle=o.bg||LABELS.bg;ctx.fillRect(o.x-tw/2,y-fs*0.92,tw,h);ctx.fillStyle=o.col;ctx.fillText(t,o.x,y)}
  ctx.restore();ctx.direction=DIR;
}
