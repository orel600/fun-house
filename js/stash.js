/* המחסן בכפר: המקום הבטוח לשלל. התרמיל הוא מה שסוחבים ומסתכנים בו (בעולם הפתוח מוות מאבד חלק ממנו, "החלטות של ניר"),
   ומה שבמחסן נשאר תמיד. מעבירים משאבים ופריטים בין התרמיל למחסן בחלון של המבנה (bwin.js), כשעומדים לידו.
   התרמיל בלי הגבלה. המחסן מחזיק עד VILLAGE.b.stash.cap יחידות לפי רמת המבנה (פריט = יחידה אחת).
   נשמר ב-SAVE.stash, באותה צורה כמו התרמיל: {wood:40,oakSword:1}. השמות ב-lang.js ('stash.*') */

const stashCap=()=>VILLAGE.b.stash.cap[vLv('stash')]||0;
const stashUsed=()=>Object.values(SAVE.stash).reduce((n,v)=>n+v,0);
const stashIcon=k=>resIcon(k)||(gItem(k)?gIcon(k):'');
const stashName=k=>resOf(k)?resName(k):gName(k);

// מעביר לתוך המחסן (in) או בחזרה לתרמיל (out). want: כמה (בלי: הכל). פריט עובר אחד-אחד. מחזיר כמה עבר
function stashMove(dir,k,want){
  const have=dir==='in'?SAVE.bag[k]||0:SAVE.stash[k]||0;
  let n=Math.min(have,gItem(k)?1:want>0?want:have);
  if(dir==='in')n=Math.min(n,stashCap()-stashUsed());
  if(n<=0)return 0;
  if(dir==='in'){bagTake(k,n);SAVE.stash[k]=(SAVE.stash[k]||0)+n}
  else{SAVE.stash[k]-=n;if(!SAVE.stash[k])delete SAVE.stash[k];bagAdd(k,n)}
  saveNow();
  return n;
}
// הסדר בחלון: הכי נדיר קודם, כי אותו הכי חשוב לשמור. פריטים (ציוד) בסוף, כי הם לא אובדים בעולם
const stashRank=k=>{const R=resOf(k);return R?-(R.rar||0):1};
const stashKeys=src=>Object.keys(src).filter(k=>src[k]>0&&stashIcon(k)).sort((a,b)=>stashRank(a)-stashRank(b));
// "הכל למחסן" / "הכל לתרמיל": רק משאבים, הנדיר קודם, עד שהמחסן מלא. בלי ציוד (הוא לא אובד בעולם),
// ומטבעות רק בנגיעה, כי משלמים מהתרמיל ואחרת השוק והשדרוג פתאום "אין מטבעות"
const stashBulk=k=>!!resOf(k)&&k!=='coins';
function stashAll(dir){
  let n=0;for(const k of stashKeys(dir==='in'?SAVE.bag:SAVE.stash))if(stashBulk(k))n+=stashMove(dir,k);
  return n;
}

// החלק של המחסן בחלון המבנה (bwin.js): שורה למה זה חשוב, כמה תפוס, ושני טורים: מה בתרמיל ומה במחסן.
// נגיעה בכרטיס מעבירה BWIN.move לצד השני, ולחיצה ארוכה מעבירה הכל (ניר, 2.11: "לא ברור איך מתנהלים איתו")
function stashHtml(){
  const used=stashUsed(),cap=stashCap(),full=used>=cap;
  const card=(src,dir,k)=>'<button class="bwc" data-act="stash" data-dir="'+dir+'" data-r="'+k+'" data-hold'+(dir==='in'&&full?' disabled':'')+bwRar(k)+
    ' aria-label="'+stashName(k)+' '+src[k]+'"><span class="ic">'+(resOf(k)?resPic(k):stashIcon(k))+'</span><span class="nm">'+stashName(k)+'</span><b>'+shortN(src[k])+'</b></button>';
  // המקום קטן (טלפון שוכב, 350 גובה): כמה תפוס יושב בכותרת של טור המחסן, ואיך מעבירים מתחת לכותרת של התרמיל
  const col=(src,dir,title,all,none,extra)=>{const ks=stashKeys(src);
    return '<section><div class="bwch"><span><b>'+T(title)+'</b>'+extra+'</span><button class="vbtn ghost bwall" data-act="stashAll" data-dir="'+dir+'"'+(!ks.some(stashBulk)||dir==='in'&&full?' disabled':'')+'>'+T(all)+'</button></div>'+
      (ks.length?'<div class="bwgrid">'+ks.map(k=>card(src,dir,k)).join('')+'</div>':'<p class="next">'+T(none)+'</p>')+'</section>'};
  return (full?'<p class="bwbad">'+T('bw.full')+'</p>':'')+'<div class="bwcols">'+
    col(SAVE.bag,'in','bw.bag','bw.allIn','bw.emptyBag','<small class="bwhint">'+T('bw.hint',BWIN.move)+'</small>')+
    col(SAVE.stash,'out','bw.inStash','bw.allOut','bw.emptyStash','<span class="bwcap'+(full?' full':'')+'" role="meter" aria-valuenow="'+used+'" aria-valuemax="'+cap+'"><i style="width:'+Math.min(100,used/cap*100)+'%"></i><span>'+used.toLocaleString('en')+' / '+cap.toLocaleString('en')+'</span></span>')+'</div>';
}
