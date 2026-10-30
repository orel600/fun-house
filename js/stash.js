/* המחסן בכפר: המקום הבטוח לשלל. התרמיל הוא מה שסוחבים ומסתכנים בו (בעולם הפתוח מוות מאבד חלק ממנו, "החלטות של ניר"),
   ומה שבמחסן נשאר תמיד. מעבירים משאבים ופריטים בין התרמיל למחסן בפאנל של המבנה, כשעומדים לידו.
   התרמיל בלי הגבלה. המחסן מחזיק עד VILLAGE.b.stash.cap יחידות לפי רמת המבנה (פריט = יחידה אחת).
   נשמר ב-SAVE.stash, באותה צורה כמו התרמיל: {wood:40,oakSword:1}. השמות ב-lang.js ('stash.*') */

const stashCap=()=>VILLAGE.b.stash.cap[vLv('stash')]||0;
const stashUsed=()=>Object.values(SAVE.stash).reduce((n,v)=>n+v,0);
const stashIcon=k=>resIcon(k)||(gItem(k)?gIcon(k):'');
const stashName=k=>resOf(k)?resName(k):gName(k);

// מעביר לתוך המחסן (in) או בחזרה לתרמיל (out): משאב כולו, כמה שנכנס, ופריט אחד בכל לחיצה. מחזיר כמה עבר
function stashMove(dir,k){
  const have=dir==='in'?SAVE.bag[k]||0:SAVE.stash[k]||0;
  let n=Math.min(have,gItem(k)?1:have);
  if(dir==='in')n=Math.min(n,stashCap()-stashUsed());
  if(n<=0)return 0;
  if(dir==='in'){bagTake(k,n);SAVE.stash[k]=(SAVE.stash[k]||0)+n}
  else{SAVE.stash[k]-=n;if(!SAVE.stash[k])delete SAVE.stash[k];bagAdd(k,n)}
  saveNow();
  return n;
}

// החלק של המחסן בפאנל: כמה תפוס, מה בתרמיל (לחיצה מכניסה) ומה במחסן (לחיצה מוציאה)
function stashHtml(){
  const full=stashUsed()>=stashCap();
  const row=(src,dir)=>{const ks=Object.keys(src).filter(k=>src[k]>0&&stashIcon(k));
    return ks.length?'<div class="smove">'+ks.map(k=>'<button class="res" data-act="stash" data-dir="'+dir+'" data-r="'+k+'" aria-label="'+stashName(k)+'"'+(dir==='in'&&full?' disabled':'')+'>'+stashIcon(k)+' '+src[k]+'</button>').join('')+'</div>'
      :'<p class="next">'+T('stash.empty')+'</p>'};
  return '<p class="next">'+T('stash.space',stashUsed(),stashCap())+'</p>'+
    '<span class="sk">'+T('stash.bag')+'</span>'+row(SAVE.bag,'in')+
    '<span class="sk">'+T('stash.in')+'</span>'+row(SAVE.stash,'out');
}
