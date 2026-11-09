/* משחקי השאול: לוח התוצאות (MBSCORE, השיפוץ, underworld-scoreboard-design.md, MAX ל-BOB, 10.11.2026). רק ב-overhaul.
   נפתח בנגיעה בתוצאה שלמעלה (בלי כפתור חדש), ונסגר בנגיעה בתוצאה שוב, בנגיעה מחוץ ללוח, או ב"חזור". המשחק ממשיך מאחור.
   שורה לכל גיבור: הערכה, הריגות ומיתות, רמה, זהב ועד 6 חפצים (mbImg). השורה שלך במסגרת זהב, ופס אישי למעלה.
   בלי עזרות (assists): ברשימת המעוכבים של השיפוץ, ולכן גם לא סופרים אותן. מחיקה: הקובץ, השורה ב-index.html, החלק "mbboard" ב-css/style.css ומפתחות mb.sb ב-lang.js */
const MBSCORE={
  on:true,
  every:0.25,   // שניות בין עדכון לעדכון כשהלוח פתוח
  stat:{opens:0,draws:0},
  _t:0,_hist:false,_skip:false
};
function mbScoreRow(u,me){
  const g=Math.floor(u.gold||0),it=(u.it||[]).slice(0,MBITEM.slots),sl=[];for(let i=0;i<MBITEM.slots;i++)sl.push(it[i]?'<span class="mbbit">'+mbImg(it[i])+'</span>':'<span class="mbbit off"></span>');
  return '<div class="mbbrow'+(u===me?' me':'')+(u.dead?' dead':'')+'"><span class="mbbpor">'+mbPic('k_'+u.kit,'mbli')+'</span><span class="mbbname">'+T('mb.k.'+u.kit)+(u===me?' <small>'+T('mb.sb.you')+'</small>':'')+'</span>'+
    '<span class="mbbkd"><b>'+u.kills+'</b> / <b>'+u.deaths+'</b></span><span class="mbblv">'+T('mb.sb.lv')+' '+u.lvl+'</span><span class="mbbgold">'+g+'</span><span class="mbbits">'+sl.join('')+'</span></div>';
}
function mbScoreDraw(){
  const el=$('mbBoard');if(!el||el.hidden||!MB)return;const me=mbMe(),M=MB,hs=tm=>M.u.filter(u=>u.k==='hero'&&u.team===tm);
  const fmt=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
  el.querySelector('.mbbpanel').innerHTML=
    '<div class="mbbhead"><b class="mbs0">'+M.score[0]+'</b><span>'+fmt(M.t)+'</span><b class="mbs1">'+M.score[1]+'</b></div>'+
    (me?'<div class="mbbmine">'+mbScoreRow(me,me)+'</div>':'')+
    '<div class="mbbcols"><section class="t0"><h4>'+T('mb.sb.blue')+'</h4>'+hs(0).map(u=>mbScoreRow(u,me)).join('')+'</section>'+
    '<section class="t1"><h4>'+T('mb.sb.red')+'</h4>'+hs(1).map(u=>mbScoreRow(u,me)).join('')+'</section></div>'+
    '<div class="mbbhead2"><span>'+T('mb.sb.kd')+'</span></div>';
  MBSCORE.stat.draws++;
}
function mbScoreOpen(on){
  const el=$('mbBoard');if(!el)return;if(on===undefined)on=el.hidden;if(on&&!S.mb)return;
  el.hidden=!on;if(on){MBSCORE.stat.opens++;MBSCORE._t=performance.now();mbScoreDraw();if(!MBSCORE._hist){MBSCORE._hist=true;try{history.pushState({mbBoard:1},'')}catch(e){}}}
  else if(MBSCORE._hist){MBSCORE._hist=false;MBSCORE._skip=true;try{history.back()}catch(e){MBSCORE._skip=false}}
}
(function(){
  if(!MBSCORE.on||typeof mobaHud!=='function')return;
  const el=document.createElement('div');el.id='mbBoard';el.className='mbboard';el.hidden=true;el.innerHTML='<div class="mbbpanel"></div>';document.body.appendChild(el);
  el.addEventListener('click',e=>{if(e.target===el)mbScoreOpen(false)});   // נגיעה מחוץ ללוח
  const top=document.querySelector('#mbHud .mbtop');if(top){top.classList.add('mbtap');top.addEventListener('click',()=>{mbScoreOpen();sfx('ui')})}
  addEventListener('popstate',()=>{if(MBSCORE._skip){MBSCORE._skip=false;return}if(MBSCORE._hist){MBSCORE._hist=false;if(!el.hidden)el.hidden=true}});   // "חזור"
  const bh=mobaHud;mobaHud=function(){const r=bh.apply(this,arguments);if(!el.hidden){const n=performance.now();if(n-MBSCORE._t>=MBSCORE.every*1000){MBSCORE._t=n;mbScoreDraw()}}return r};
  const bx=mobaExit;mobaExit=function(){if(!el.hidden)mbScoreOpen(false);return bx.apply(this,arguments)};
})();
