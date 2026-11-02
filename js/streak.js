/* רצף הריגות (אוראל, 1.11.2026, בהשראת MLBB): כשהורגים הרבה ברצף, מילה גדולה וקצרה מופיעה למעלה, עם צליל.
   רצף: כל הריגה בתוך gap שניות מהקודמת ממשיכה אותו. בזירה נופלים הרבה אויבים, ולכן המדרגות גבוהות, כדי שזה יהיה רגע ולא רעש.
   המילים משלנו (lang.js, 'st.<n>'), לא של MLBB. רק בזירה. המצב ב-S.st, חדש בכל ריצה. נקרא מ-kill (combat.js) ומ-render.js */
const STREAK={
  gap:1.2,                  // כמה שניות מותר בין הריגה להריגה בלי שהרצף נשבר
  steps:[10,25,50,100],     // באילו מספרים מופיעה מילה (ואחרי 100: כל 100)
  life:1.3,                 // כמה שניות המילה על המסך
  y:0.24,                   // באיזה גובה (חלק מגובה המסך)
  col:'#F4F2EC',ring:'#FFB347'   // לבן חם, וקו כתום דק מתחת
};
function streakKill(){
  if(!skArena())return;
  const s=S.st&&S.t-S.st.last<=STREAK.gap?S.st:(S.st={n:0,last:0,show:null,best:(S.st&&S.st.best)||0});
  s.n++;s.last=S.t;s.best=Math.max(s.best,s.n);
  const top=STREAK.steps[STREAK.steps.length-1],i=STREAK.steps.indexOf(s.n);
  if(i>=0||s.n>top&&s.n%top===0){const k=i>=0?i:STREAK.steps.length-1;s.show={k,n:s.n,t0:S.t};sfx(k>=2?'celebrate':'xp')}
}
// המילה: קופצת לרגע, ונעלמת בהדרגה. מספר ההריגות קטן מתחתיה
function streakDraw(){
  const s=S&&S.st,w=s&&s.show;if(!w)return;
  w.t=S.t-w.t0;if(w.t>=STREAK.life||w.t<0){s.show=null;return}
  const k=w.t/STREAK.life,pop=RM?1:1+Math.max(0,0.25-w.t)*1.6,a=Math.min(1,(1-k)*3),x=W/2,y=H*STREAK.y;
  ctx.save();ctx.globalAlpha=a;ctx.textAlign='center';ctx.direction=DIR;ctx.lineJoin='round';
  ctx.font='900 '+Math.round(30*pop)+'px Heebo, system-ui, sans-serif';
  ctx.lineWidth=5;ctx.strokeStyle='#0008';ctx.strokeText(T('st.'+w.k),x,y);ctx.fillStyle=STREAK.col;ctx.fillText(T('st.'+w.k),x,y);
  ctx.strokeStyle=STREAK.ring;ctx.lineWidth=2;ctx.beginPath();const hw=60*(0.6+0.4*Math.min(1,w.t*5));ctx.moveTo(x-hw,y+10);ctx.lineTo(x+hw,y+10);ctx.stroke();
  ctx.font='800 13px Heebo, system-ui, sans-serif';ctx.direction='ltr';ctx.fillStyle=STREAK.ring;ctx.fillText('×'+w.n,x,y+28);
  ctx.restore();
}
