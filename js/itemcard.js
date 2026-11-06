/* כרטיס חפץ: תבנית אחת לחלונות הקנייה בכפר (bwin.js), ובהמשך גם לחלון הציוד (ניר, 3.11.2026: "בחירת נשק לקנייה לא ברורה, והנשקים מוצגים בצורה מעפנה").
   שני חלקים:
   - itemTile: אריח קטן ברשימה. תמונה במסגרת הנדירות (css/rarity.css), שם קצר, ▲ כשהוא חזק ממה שלבוש, ודהוי כשאין מספיק.
   - itemCard: הכרטיס הגדול של מה שנבחר. תמונה גדולה, שם בצבע הנדירות, מספר כוח ענק (powItem ב-power.js), ▲/▼ מול מה שלבוש,
     רק השורות שיש בהן משהו, מחיר, וכפתור "קנה" גדול. כשאין מספיק: הכפתור אפור ואומר מה חסר.
   רק הצגה: לא קונה ולא משנה כלום. מי שקורא מעביר את המחיר ואת הפעולה של הכפתור (data-act).
   המספרים ב-ICARD, הטקסטים ב-lang.js תחת 'ic.', והעיצוב ב-css/itemcard.css */

// מספר הכוח של חפץ, כמו שמוצג (power.js: לפי הסטטים, וסטט של המחלקה שווה יותר)
const icPow=id=>powItem(id);
// מה לבוש עכשיו במשבצת שהחפץ ייכנס אליה (המשבצת הריקה, או זו עם החלש ביותר), או null
const icWorn=id=>{const it=gItem(id);return it?gGet(it.slot,gTarget(it)):null};
// כמה החפץ חזק (או חלש) ממה שלבוש, במספר הכוח
const icDelta=id=>icPow(id)-icPow(icWorn(id));
// מה חסר מהמחיר: {משאב: כמה חסר}
const icMiss=c=>{const m={};for(const r in c||{}){const d=c[r]-(SAVE.bag[r]||0);if(d>0)m[r]=d}return m};

// אריח ברשימה. o: {act, on (נבחר), cost (מחיר, כדי לדעת אם יש מספיק)}
function itemTile(id,o={}){
  const d=icDelta(id),poor=Object.keys(icMiss(o.cost)).length>0;
  return '<button class="ictile'+gRarCls(id)+(poor?' poor':'')+'" data-act="'+(o.act||'pick')+'" data-id="'+id+'" aria-pressed="'+!!o.on+'" style="--rar:'+gRarCol(id)+'" aria-label="'+gName(id)+'">'+
    '<span class="icp rpic'+gRarCls(id)+'">'+gPic(id)+'</span><span class="icn">'+gName(id)+'</span>'+
    (d>0?'<i class="icup" aria-hidden="true">▲</i>':'')+(icReqOk(id)?'':'<i class="iclock" aria-hidden="true">🔒</i>')+'</button>';
}

/* ---- דרישות ובונוס מחלקה (itemroll.js, של סשן אחר: רק קוראים משם) ---- */
const icReqOk=id=>typeof irCanWear!=='function'||irCanWear(id);
// הדרישות, באדום כשלא עומדים בהן. חפץ בלי דרישה: כלום
const icReq=id=>typeof irReqHtml==='function'?irReqHtml(id):'';
// בונוס מחלקה: חפץ עם איכות (שנפל בעולם) מקבל את השורה של itemroll.js. חפץ מהחנות (בלי איכות, ולכן בלי בונוס): למי הוא מתאים, בסגול כשזו המחלקה שלך
function icCls(id){
  if(typeof irClsOf!=='function')return '';
  if(gQtag(id))return irClsHtml(id);
  const c=irClsOf(id);return c?'<p class="icls'+(c===heroId()?' on':'')+'">'+T('ic.for',T('hero.'+c))+'</p>':'';
}

// השורות של החפץ: טווח הנזק לנשק, וכל סטט שאינו 0. לכל שורה ▲/▼ מול מה שלבוש
function icLines(id,old,noQ){
  const it=gItem(id);
  if(it.slot==='orbit')return gStatsHtml(id);   // חפץ מסתובב: מה שהוא עושה בזירה (gear.js)
  const s=gStats(id),b=old?gearStats([old]):{},arr=d=>d>0.05?'<i class="up">▲</i>':d<-0.05?'<i class="down">▼</i>':'';
  let h='';
  if(it.w)h+='<li class="icdmg">'+arr(wItemAvg(id)-wItemAvg(old))+wRangeTxt(wItemAvg(id),it.w)+'</li>';   // weapons.js
  for(const k in s)if(Math.abs(s[k])>=0.05)h+='<li>'+arr(s[k]-(b[k]||0))+gSign(k,s[k])+(typeof irRange==='function'?irRange(id,k):'')+'</li>';   // הטווח האפשרי לחפץ עם איכות
  return (h?'<ul class="iclines">'+h+'</ul>':'')+(!noQ&&typeof irQHtml==='function'?irQHtml(id):'');
}

// המחיר: כל משאב עם כמה צריך, ירוק אם יש ואדום אם חסר
const icCost=c=>'<span class="iccost">'+Object.keys(c).map(r=>{const ok=(SAVE.bag[r]||0)>=c[r];
  return '<span class="icc'+(ok?'':' miss')+'" data-tip="'+r+'" aria-label="'+resName(r)+'">'+resPic(r)+'<b>'+shortN(c[r])+'</b></span>'}).join('')+'</span>';

// הכרטיס הגדול. o: {cost, act (הפעולה של הכפתור, למשל 'craft'), label (מה כתוב על הכפתור), extra (HTML מתחת לשורות),
//   pre (HTML מיד אחרי השורות, ובמקום שורת האיכות), worn (החפץ כבר לבוש: בלי השוואה), n (כמה יש)}. pre, worn ו-n: חלון הציוד (gearui.js)
function itemCard(id,o={}){
  const it=gItem(id);if(!it)return '';
  if(typeof tipItem==='function')tipItem(id);   // טיפ ראשון: דרישה או איכות (firsttips.js)
  const col=gRarCol(id),old=o.worn?null:icWorn(id),d=icDelta(id),miss=icMiss(o.cost),poor=Object.keys(miss).length>0;
  const cmp=o.worn?'':!old?'<span class="icd new">'+T('ic.new')+'</span>':d>0?'<span class="icd up">▲ '+d+'</span>':d<0?'<span class="icd down">▼ '+(-d)+'</span>':'<span class="icd">'+T('gear.same')+'</span>';
  let h='<div class="icard'+gRarCls(id)+'" style="--rar:'+col+'">'+
    '<div class="ichead"><span class="icbig rpic'+gRarCls(id)+'">'+gPic(id)+'</span><div class="ictitle">'+
      '<h4 style="color:'+col+'">'+gName(id)+'</h4><small><b class="rbadge">'+T('tier')[it.tier]+'</b> '+T('gear.slot.'+it.slot)+(o.n>1?' · <bdi>×'+o.n+'</bdi>':'')+'</small>'+
      '<div class="icpow"><b><bdi>'+icPow(id)+'</bdi></b><span>'+T('ic.pow')+'</span>'+cmp+'</div>'+
      (old?'<small class="icvs">'+T('gear.vs',gName(old))+' · <bdi>'+icPow(old)+'</bdi></small>':'')+'</div></div>';
  h+='<div class="icbody">'+icReq(id)+icLines(id,o.worn?id:old,!!o.pre)+(o.pre||'')+icCls(id)+(typeof setHtml==='function'&&it.set?setHtml(id):'')+gFlavHtml(id)+(o.extra||'')+'</div>';
  if(o.act){
    const lack=Object.keys(miss).map(r=>'<bdi>'+shortN(miss[r])+'</bdi>'+resPic(r)).join(' ');
    h+='<div class="icfoot">'+(o.cost?icCost(o.cost):'')+
      '<button class="vbtn icbuy" data-act="'+o.act+'" data-r="'+id+'"'+(poor?' disabled':'')+'>'+(poor?T('ic.lack')+' '+lack:(o.label||T('ic.buy')))+'</button></div>';
  }
  return h+'</div>';
}
