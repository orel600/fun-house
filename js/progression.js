/* XP, שדרוגים, מסכי בוס וסוף */
function gainXP(v){P.xp+=v;showGain(v);while(P.xp>=P.next){P.xp-=P.next;P.level++;P.next=Math.round(6+P.level*4.5);S.pendingLv++}}
/* כמה אספת: מספר אחד מעל הראש שגדל כל עוד אוספים ברצף, במקום מספר לכל יהלום */
function showGain(v){
  let f=S.gain;
  if(!f||f.life<0.2||!floats.includes(f)){f=S.gain={x:0,y:0,txt:'',col:C.gold,size:17,life:0,vy:-30,n:0};floats.push(f)}
  f.n+=v;f.txt='+'+f.n;f.life=0.9;f.x=P.x;f.y=P.y-46;
}
function openLevelUp(){
  S.mode='level';S.pendingLv--;joy=null;
  const pool=UPS.filter(u=>!(u.max&&(S.picks[u.id]||0)>=u.max)).sort(()=>Math.random()-.5).slice(0,3);
  $('lvTitle').textContent=T('level',P.level);
  const box=$('cards');box.innerHTML='';
  pool.forEach(u=>{
    const b=document.createElement('button');b.className='card '+(u.w==='any'?'':u.w);
    const [name,desc]=T('up.'+u.id);
    b.innerHTML='<span class="tag">'+T('w.'+u.w)+'</span><b>'+name+'</b><span>'+desc+'</span>';
    b.onclick=()=>{u.f();S.picks[u.id]=(S.picks[u.id]||0)+1;$('ovLevel').hidden=true;S.mode='play';if(S.pendingLv>0)openLevelUp()};
    box.appendChild(b);
  });
  $('ovLevel').hidden=false;
}
function showIntro(b){
  S.mode='intro';joy=null;
  $('bTitle').innerHTML=b.name+'<br><span style="font-size:20px;color:var(--lilac)">'+b.title+'</span>';
  $('bLearned').innerHTML=b.learned.map(s=>'<span>'+s+'</span>').join('');
  $('bPats').innerHTML=b.pats.map(k=>'<span class="chip">'+T('pat.'+k)+'</span>').join('')+'<span class="chip" style="color:var(--dim)">'+T('secretAttack')+'</span><span class="chip" style="color:var(--blood)">'+T('hatesRunning')+'</span>';
  $('bWeak').innerHTML=T('weakSpot',b.weak==='sword'?'e':'t',T('w.'+b.weak));
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
