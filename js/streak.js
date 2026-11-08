/* רצף הריגות (אוראל, 1.11.2026, בהשראת MLBB): כשהורגים הרבה ברצף, מילה גדולה וקצרה מופיעה למעלה, עם צליל.
   רצף: כל הריגה בתוך gap שניות מהקודמת ממשיכה אותו. בזירה נופלים הרבה אויבים, ולכן המדרגות גבוהות, כדי שזה יהיה רגע ולא רעש.
   המילים משלנו (lang.js, 'st.<n>'), לא של MLBB. רק בזירה. המצב ב-S.st, חדש בכל ריצה. נקרא מ-kill (combat.js) ומ-render.js */
const STREAK={
  gap:1.2,                  // כמה שניות מותר בין הריגה להריגה בלי שהרצף נשבר
  steps:[10,25,50,100],     // באילו מספרים מופיעה מילה (ואחרי 100: כל 100)
  life:1.3,                 // כמה שניות המילה על המסך
  y:0.24,                   // באיזה גובה (חלק מגובה המסך)
  col:'#F4F2EC',ring:'#FFB347',  // לבן חם, וקו כתום דק מתחת
  // MLBB 3.3 (ה5 ב-docs/concept/mlbb-fx-plan.md): אירוע אחד = רגע אחד. גם "Rampage!" של arena-feel.js וגם המדרגות כאן
  // מופיעים באותו מקום, על כרטיס הזהב הקיים (ui_juice, כמו מילות הקומבו), ולא כמילה צפה נוספת מעל הגיבור.
  // הכרטיס על הקנבס (fxUi), ולכן תמיד מתחת למילה (fxDrawUi לפני streakDraw ב-render.js), ולא בנגן של התפריטים (fxui.js).
  // הגלולה בגיליון היא כשליש מרוחב התא וכשישית מגובהו: size ו-sx מכסים מילה של 30px. קצר (dur). "פחות אפקטים" והפחתת תנועה: בלי הכרטיס
  card:{fx:'ui_juice',size:235,sx:2.3,alpha:0.6,dy:-9,dur:0.9}
};
function streakKill(){
  if(!skArena())return;
  const s=S.st&&S.t-S.st.last<=STREAK.gap?S.st:(S.st={n:0,last:0,show:null,best:(S.st&&S.st.best)||0});
  s.n++;s.last=S.t;s.best=Math.max(s.best,s.n);
  const top=STREAK.steps[STREAK.steps.length-1],i=STREAK.steps.indexOf(s.n);
  if(i>=0||s.n>top&&s.n%top===0){const k=i>=0?i:STREAK.steps.length-1;streakShow('st.'+k,s.n,STREAK.ring);sfx(k>=2?'streak3':k>=1?'streak2':'streak1')}   // שלוש דרגות שעולות בגובה (audio.js)
}
// הרגע של הרצף: המילה (מפתח ב-lang.js) למעלה, וכרטיס הזהב מאחוריה. רגע חדש מחליף את הקודם, כך שאף פעם אין שניים
function streakShow(key,n,col){
  const s=S.st;if(!s)return;const C=STREAK.card;
  if(s.show&&s.show.card)fxStop(s.show.card);
  s.show={key,n,col:col||STREAK.ring,t0:S.t,card:null};
  const quiet=(typeof fxLess==='function'&&fxLess())||(typeof calmOn==='function'?calmOn():RM);
  if(!quiet&&typeof fxUi==='function')s.show.card=fxUi(C.fx,W/2,H*STREAK.y+C.dy,{size:C.size,sx:C.sx,alpha:C.alpha,dur:C.dur});
  STREAK.shown=(STREAK.shown||0)+1;
}
// המילה: קופצת לרגע, ונעלמת בהדרגה. מספר ההריגות קטן מתחתיה
function streakDraw(){
  const s=S&&S.st,w=s&&s.show;if(!w)return;
  w.t=S.t-w.t0;if(w.t>=STREAK.life||w.t<0){s.show=null;return}
  const calm=typeof calmOn==='function'?calmOn():RM,k=w.t/STREAK.life,pop=calm?1:1+Math.max(0,0.25-w.t)*1.6,a=Math.min(1,(1-k)*3),x=W/2,y=H*STREAK.y;
  ctx.save();ctx.globalAlpha=a;ctx.textAlign='center';ctx.direction=DIR;ctx.lineJoin='round';
  ctx.font='900 '+Math.round(30*pop)+'px Heebo, system-ui, sans-serif';
  const txt=T(w.key);ctx.lineWidth=5;ctx.strokeStyle='#0008';ctx.strokeText(txt,x,y);ctx.fillStyle=STREAK.col;ctx.fillText(txt,x,y);
  ctx.strokeStyle=w.col;ctx.lineWidth=2;ctx.beginPath();const hw=60*(0.6+0.4*Math.min(1,w.t*5));ctx.moveTo(x-hw,y+10);ctx.lineTo(x+hw,y+10);ctx.stroke();
  ctx.font='800 13px Heebo, system-ui, sans-serif';ctx.direction='ltr';ctx.fillStyle=w.col;ctx.fillText('×'+w.n,x,y+28);
  ctx.restore();
}
