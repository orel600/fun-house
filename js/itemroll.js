/* חפצים כמו ב-Priston Tale (ניר, 4.11.2026, משימה א ב"התוכנית הבאה"): דרישות, ערכים אקראיים ובונוס מחלקה.
   1. דרישות: רמת דמות ונקודות בתכונה (stats.js). נגזרות מהשכבה ומסוג החפץ (req ו-stat למטה), לא נכתבות ביד לכל חפץ.
      חפץ שלא עומדים בדרישה לא נלבש (gearEquip ב-gear.js), ומוצג באדום. מה שכבר לבוש נשאר לבוש. רק בכפר ובעולם: בזירה אין דרישות.
   2. איכות: כל חפץ שנופל בעולם (lootRoll ב-loot.js) מקבל אחוז אקראי מהסטטים, שנשמר במזהה: 'ironSword+3#keen~104'.
      חפץ בלי ~ (שמירה ישנה, נפחייה, שלל הזירה) הוא 100%, ולכן שום דבר קיים לא משתנה.
   3. בונוס מחלקה: לחפץ שנפל בעולם (עם ~) יש מחלקה, לפי סוג הנשק (arms ב-HEROES) או השריון (cls ב-armor.js).
      כשהמחלקה שלו לובשת אותו, הסטטים שלו עולים ב-cls.bonus. נכנס ל-gStats, ולכן גם ל-gScore ולהשוואה.
   הטקסטים ב-lang.js ('ir.*') */
const ITEMROLL={
  q:{min:90,max:110},   // איכות באחוזים, בהתפלגות שווה
  // הדרישות לפי שכבה (עץ, ברזל, כסף, זהב, אגדי): lv רמת דמות, pt נקודות בתכונה. עץ בלי דרישה. מתחת לרמה שבה השכבה מתחילה ליפול (LOOT.gear.tier)
  req:{lv:[0,3,7,12,17],pt:[0,1,3,6,9]},
  // איזו תכונה כל חפץ דורש: לפי סוג הנשק, המחלקה של השריון, או המשבצת. מה שלא כאן (תכשיטים) דורש רק רמה. חפצים מסתובבים: בלי דרישה
  stat:{sword:'str',axe:'str',hammer:'str',bow:'agi',staff:'haste',wand:'haste',warrior:'str',hunter:'agi',mage:'haste',shield:'def'},   // מגפיים: רק רמה (איזון 4.11: עם זריזות, לוחם וקוסם לא החליפו מגפיים כל המשחק)
  // בונוס מחלקה: כמה הסטטים עולים (0.08 = ‎+8%). shield: המגן שייך ללוחם
  cls:{bonus:0.08,shield:'warrior'},
  skip:false   // לבדיקה (tools/check.js): הבוט לובש חפצים בלי לצבור נקודות
};

// האיכות מהמזהה: 104, או 100 בלי ~
const gQ=id=>{const m=/~(\d+)/.exec(id||'');return m?+m[1]:100};
const gQtag=id=>/~\d+/.test(id||'')?'~'+gQ(id):'';   // ageId ו-powId (aging.js, powers.js) משאירים אותו על החפץ
// חפץ שנופל בעולם: מוסיף איכות אקראית. משאבים וחפצים מסתובבים נשארים כמו שהם
function irRoll(id){const it=gItem(id);if(!it||it.slot==='orbit'||gQtag(id))return id;
  const Q=ITEMROLL.q;return id+'~'+(Q.min+Math.floor(Math.random()*(Q.max-Q.min+1)))}

/* ---- דרישות ---- */
function irReq(id){const it=gItem(id);if(!it||it.slot==='orbit')return null;const R=ITEMROLL.req,lv=R.lv[it.tier]||0;if(!lv)return null;
  const st=ITEMROLL.stat[it.w]||ITEMROLL.stat[it.cls]||ITEMROLL.stat[it.slot]||null;return{lv,st,n:st?R.pt[it.tier]||0:0}}
const irMeets=id=>{const r=irReq(id);return !r||heroLv()>=r.lv&&(!r.st||(stPts()[r.st]||0)>=r.n)};
const irOn=()=>!ITEMROLL.skip&&typeof S!=='undefined'&&!!S&&!!(S.vil||S.wd);   // בכפר ובעולם. הזירה לא משתנה
const irCanWear=id=>!irOn()||irMeets(id);
// "דורש רמה X" (ניר, משימה 2ג): הרמה שעוד חסרה לחפץ, או 0. האריח מראה 🔒 עם המספר, והכפתור "🔒 Level 7" במקום "אי אפשר"
const irLv=id=>{const r=irReq(id);return r&&irOn()&&heroLv()<r.lv?r.lv:0};
const irLockTag=(id,cls)=>'<i class="'+cls+'" aria-hidden="true">🔒'+(irLv(id)?'<bdi>'+irLv(id)+'</bdi>':'')+'</i>';
const irCantTxt=id=>irLv(id)?'🔒 '+T('ir.lv',irLv(id)):T('ir.cant');
// בעלייה מרמה from ל-lv: חפצים בתרמיל שהרמה שלהם נפתחה עכשיו, לכרטיס העלייה (lpLevelUp ב-levelpath.js). אחד או שניים בשם, יותר במספר
function irUnlocked(from,lv){const ks=Object.keys(SAVE.bag||{}).filter(k=>SAVE.bag[k]>0&&gItem(k)&&(r=>r&&r.lv>from&&r.lv<=lv)(irReq(k)));
  if(!ks.length)return [];if(ks.length>2)return [{icon:'🔓',txt:T('ir.readyN',ks.length)}];
  return ks.map(k=>{const r=irReq(k),ok=!r.st||(stPts()[r.st]||0)>=r.n;   // רמה כבר יש, אבל חסרות נקודות בתכונה: אומרים כמה
    return {icon:'🔓',txt:ok?T('ir.ready',gName(k)):T('ir.readySt',gName(k),T('st.'+r.st)[0]+' '+r.n)}})}
function irReqHtml(id){const r=irReq(id);if(!r||!irOn())return '';const ok=irMeets(id),lvOk=heroLv()>=r.lv,stOk=!r.st||(stPts()[r.st]||0)>=r.n;
  const p='<span class="'+(lvOk?'':'bad')+'">'+T('ir.lv','<bdi>'+r.lv+'</bdi>')+'</span>'+(r.st&&r.n?', <span class="'+(stOk?'':'bad')+'">'+T('st.'+r.st)[0]+' <bdi>'+r.n+'</bdi></span>':'');
  return '<p class="ireq'+(ok?'':' no')+'">'+T('ir.req',p)+'</p>'}

/* ---- בונוס מחלקה ---- */
// המחלקה של החפץ: שריון לפי cls, נשק לפי arms ב-HEROES, מגן לפי cls.shield
function irClsOf(id){const it=gItem(id);if(!it)return null;if(it.cls)return it.cls;if(it.slot==='shield')return ITEMROLL.cls.shield;
  if(it.w)for(const h in HEROES.list)if((HEROES.list[h].arms||[]).includes(it.w))return h;return null}
const irClsOn=id=>!!gQtag(id)&&!!irClsOf(id)&&irClsOf(id)===heroId();
function irClsHtml(id){const c=gQtag(id)&&irClsOf(id);if(!c)return '';
  return '<p class="icls'+(irClsOn(id)?' on':'')+'">'+T('ir.cls',T('hero.'+c),Math.round(ITEMROLL.cls.bonus*100))+'</p>'}

/* ---- איכות בחלון: "+26% (23–28)", מה שיצא ואחריו הטווח האפשרי ---- */
function irRange(id,k){if(!gQtag(id))return '';const it=gItem(id),b=((it||{}).stats||{})[k];if(b==null)return '';
  const a=ageMult(gPlus(id)),f=q=>Math.round(b*a*q/10)/10;return ' <small class="irng"><bdi dir="ltr">('+f(ITEMROLL.q.min)+'–'+f(ITEMROLL.q.max)+')</bdi></small>'}
const irQHtml=id=>gQtag(id)?'<p class="iq">'+T('ir.q','<bdi>'+gQ(id)+'%</bdi>')+'</p>':'';
