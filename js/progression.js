/* XP, שדרוגים, מסכי בוס וסוף */
function gainXP(v){P.xp+=v;while(P.xp>=P.next){P.xp-=P.next;P.level++;P.next=Math.round(6+P.level*4.5);S.pendingLv++}}
function openLevelUp(){
  S.mode='level';S.pendingLv--;joy=null;
  const pool=UPS.filter(u=>!(u.max&&(S.picks[u.id]||0)>=u.max)).sort(()=>Math.random()-.5).slice(0,3);
  $('lvTitle').textContent='רמה '+P.level;
  const box=$('cards');box.innerHTML='';
  pool.forEach(u=>{
    const b=document.createElement('button');b.className='card '+(u.w==='any'?'':u.w);
    b.innerHTML='<span class="tag">'+(u.w==='sword'?'חרב':u.w==='gun'?'קשת':'כללי')+'</span><b>'+u.name+'</b><span>'+u.desc+'</span>';
    b.onclick=()=>{u.f();S.picks[u.id]=(S.picks[u.id]||0)+1;$('ovLevel').hidden=true;S.mode='play';if(S.pendingLv>0)openLevelUp()};
    box.appendChild(b);
  });
  $('ovLevel').hidden=false;
}
function showIntro(b){
  S.mode='intro';joy=null;
  $('bTitle').innerHTML=b.name+'<br><span style="font-size:20px;color:var(--lilac)">'+b.title+'</span>';
  $('bLearned').innerHTML=b.learned.map(s=>'<span>'+s+'</span>').join('');
  $('bPats').innerHTML=b.pats.map(k=>'<span class="chip">'+PNAME[k]+'</span>').join('')+'<span class="chip" style="color:var(--dim)">+ אחת סודית בשלב 2</span><span class="chip" style="color:var(--blood)">שונא שבורחים ממנו</span>';
  $('bWeak').innerHTML='נקודת התורפה: <span class="'+(b.weak==='sword'?'e':'t')+'">'+(b.weak==='sword'?'חרב':'קשת')+'</span>. הזוהר סביבו בצבע הזה.';
  $('ovBoss').hidden=false;
}
function gameOver(){
  S.mode='over';joy=null;
  if(S.t>best){best=S.t;try{localStorage.setItem('zm-best',String(best))}catch(e){}}
  $('sTime').textContent=fmt(S.t);$('sLvl').textContent=P.level;$('sBoss').textContent=S.bossCount;$('sBest').textContent=fmt(best);$('sCoins').textContent=S.bn.coins;$('sPicks').textContent=S.bn.taken;
  setTimeout(()=>{$('ovOver').hidden=false},700);
}
let banT=null;
function banner(txt,col){const b=$('banner');b.textContent=txt;b.style.color=col||C.chalk;b.classList.add('on');clearTimeout(banT);banT=setTimeout(()=>b.classList.remove('on'),1600)}
