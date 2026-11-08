/* סקיל חתימה (ניר, 2.11.2026: "תבנה בעצמך את סקיל החתימה"; roadmap, גל 3: "כל דרגה נותנת טקס, חלקי שריון וסקיל חתימה").
   לכל דרגה (ranks.js, skill:<id>) סקיל-על אחד משלה, חזק ומרשים, עם טעינה ארוכה. הדרגה נקבעת לפי איך ששיחקת, אז גם הסקיל:
   שומר (הגנה) = מבצר אדמה סביבו, אביר (חרב) = להב ענק בקו, סייר (קשת) = גשם ברקים, לוחם-קשת (ערבוב) = שלושה גלי אש.
   בעולם ובכפר בלבד (בזירה ובמובה של אוראל אין אותו). כפתור משלו (#sig) משמאל לקשת של הסקילים, ומקלדת 4.
   בפעם הראשונה בעולם: רגע גילוי (skillreveal.js), וההטלה הראשונה גדולה. בספר הסקילים (wskbook.js) יש לו כרטיס בראש.
   נרשם ב-SKILLS.list (כמו הספר) רק כדי שרגע הגילוי והצבעים יכירו אותו. הקירור לא מתאפס במעבר בין העולם לכפר.
   נקודות החיבור: wskUpdate (wskill.js), villageUpdate (village.js), render.js (sigDraw). השמות ב-lang.js: 'sk.<id>', 'sig.d.<id>' */
const SIGSKILL={
  cd:40,          // שניות טעינה
  boss:0.5,       // לבוס: חלק מהנזק
  reach:1.6,      // טווח חיפוש מטרה: כפול WORLD.attackRange
  hitstop:0.12,shake:12,
  /* dt: סוג נזק. dmg: כפול הנזק של הנשק שביד (skBase). kind: מה הוא עושה */
  list:{
    bastion:   {ic:'🏰',dt:'earth',    kind:'nova', dmg:5,  r:280,waves:1,gap:0,  inv:3,heal:0.3,push:120},   // שומר: כיפת אבן, חסין ומתרפא, וגל שהודף
    dawnblade: {ic:'🗡️',dt:'physical', kind:'blade',dmg:8,  len:480,w:120,delay:0.35},                      // אביר: להב אור ענק נוחת בקו
    starfall:  {ic:'🌠',dt:'lightning',kind:'rain', dmg:2.6,r:230,n:10,t:1.5,hit:75},                       // סייר: עשרה ברקים מהשמיים על אזור
    emberstorm:{ic:'☄️',dt:'fire',     kind:'nova', dmg:2.6,r:250,waves:3,gap:0.3}                          // לוחם-קשת: שלושה גלי אש מהגיבור
  }
};
for(const id in SIGSKILL.list)SKILLS.list[id]={...SIGSKILL.list[id],cd:SIGSKILL.cd,sig:1};
let sigCd=0;   // שניות עד שמוכן. משותף לעולם ולכפר
const sigStat={casts:0,hits:0};   // בשביל הבוט
const sigOf=id=>!!SIGSKILL.list[id];
// הסקיל של הדרגה הנוכחית, או null
function sigId(){const r=typeof rankId==='function'&&rankId(),s=r&&RANKS.list[r].skill;return s&&SIGSKILL.list[s]?s:null}
const sigHere=()=>!!S&&(S.wd||S.vil)&&!S.room&&S.mode==='play';
const sigFx=()=>(S.sig||(S.sig={fx:[]})).fx;
const sigLess=()=>typeof fxLess==='function'&&fxLess();
// רגע הגילוי: skrCheck (skillreveal.js) שואל אם יש סקיל חתימה שעוד לא ראינו
function sigReveal(){const id=sigId();return id&&!(SAVE.hero.skSeen||[]).includes(id)?id:null}

function sigHit(e,base,from,t){
  if(e.dead||e.node)return;damage(e,e.isBoss?base*SIGSKILL.boss:base,'skill',Math.atan2(e.y-from.y,e.x-from.x),t);sigStat.hits++;
}
function sigUse(){
  const id=sigId();if(!id||!sigHere()||sigCd>0)return false;
  const D=SIGSKILL.list[id],F=skrFirst(id),base=skBase()*D.dmg*(F?F.dmg:1),col=dtCol(D.dt),big=F?F.r:1,fx=sigFx();
  const reach=(typeof WORLD!=='undefined'?WORLD.attackRange:300)*SIGSKILL.reach,tg=nearest(reach);
  const a=tg?Math.atan2(tg.y-P.y,tg.x-P.x):(P.face||P.aim||0);P.aim=a;
  switch(D.kind){
    case 'nova':
      if(D.inv){P.inv=Math.max(P.inv,D.inv);P.hp=Math.min(P.maxHp,P.hp+P.maxHp*D.heal);fx.push({k:'dome',t:0,max:D.inv,col})}
      for(let i=0;i<D.waves;i++)fx.push({k:'wave',t:-i*D.gap,max:0.55,r:D.r*Math.min(big,1.4),col,base,dt:D.dt,push:D.push||0,done:false});
      break;
    case 'blade':fx.push({k:'blade',t:0,max:D.delay+0.6,a,len:D.len*Math.min(big,1.4),w:D.w,col,base,dt:D.dt,done:false});break;
    case 'rain':{const c=tg?{x:tg.x,y:tg.y}:{x:P.x+Math.cos(a)*160,y:P.y+Math.sin(a)*160};
      for(let i=0;i<D.n+(F?F.hops:0);i++)fx.push({k:'bolt',t:-i*D.t/D.n,max:0.45,cx:c.x,cy:c.y,R:D.r,hr:D.hit*Math.min(big,1.4),col,base,dt:D.dt,done:false});
      fx.push({k:'mark',t:0,max:D.t+0.4,x:c.x,y:c.y,r:D.r,col});break}
  }
  sigCd=SIGSKILL.cd;sigStat.casts++;skCast(id);   // הגיבור מטיל, ועיגול רונות (skillcast.js)
  S.hitstop=Math.max(S.hitstop||0,SIGSKILL.hitstop);S.shake=Math.max(S.shake||0,SIGSKILL.shake);
  sparks(P.x,P.y-20,col,sigLess()?16:40,340);sfx('celebrate');banner('⭐ '+T('sk.'+id),col);
  const b=$('sig');if(b){b.classList.remove('ping');void b.offsetWidth;b.classList.add('ping')}
  return true;
}

/* ---- כל פריים בעולם ובכפר ---- */
function sigUpdate(dt){
  skcUpdate(dt);   // עיגול הרונות של ההטלה (skillcast.js). sigUpdate רץ גם בעולם וגם בכפר
  if(sigCd>0)sigCd=Math.max(0,sigCd-dt);
  sigHud();
  const L=S.sig&&S.sig.fx;if(!L||!L.length)return;
  for(const o of L){o.t+=dt;if(o.t<0)continue;
    if(o.k==='wave'&&!o.done){o.done=true;o.x=P.x;o.y=P.y;
      for(const e of enemies){if(Math.hypot(e.x-P.x,e.y-P.y)-e.r>o.r)continue;sigHit(e,o.base,P,o.dt);
        if(o.push&&!e.isBoss&&!e.node){const g=Math.atan2(e.y-P.y,e.x-P.x);e.x+=Math.cos(g)*o.push;e.y+=Math.sin(g)*o.push}}
      sparks(P.x,P.y,o.col,sigLess()?10:28,420)}
    if(o.k==='blade'&&!o.done&&o.t>=SIGSKILL.list.dawnblade.delay){o.done=true;o.x=P.x;o.y=P.y;
      const cx=Math.cos(o.a),cy=Math.sin(o.a);
      for(const e of enemies){const dx=e.x-o.x,dy=e.y-o.y,along=dx*cx+dy*cy,side=Math.abs(-dx*cy+dy*cx);
        if(along>=-20&&along<=o.len+e.r&&side<=o.w/2+e.r)sigHit(e,o.base,o,o.dt)}
      for(let i=1;i<=6;i++)sparks(o.x+cx*o.len*i/6,o.y+cy*o.len*i/6,o.col,sigLess()?3:8,260);
      S.shake=Math.max(S.shake||0,SIGSKILL.shake)}
    if(o.k==='bolt'&&!o.done){o.done=true;
      const near=enemies.filter(e=>!e.dead&&!e.node&&Math.hypot(e.x-o.cx,e.y-o.cy)<o.R);
      const e0=near.length?near[Math.floor(Math.random()*near.length)]:null,g=Math.random()*7,d=Math.random()*o.R;
      o.x=e0?e0.x:o.cx+Math.cos(g)*d;o.y=e0?e0.y:o.cy+Math.sin(g)*d;
      for(const e of enemies)if(Math.hypot(e.x-o.x,e.y-o.y)-e.r<=o.hr)sigHit(e,o.base,o,o.dt);
      sparks(o.x,o.y,o.col,sigLess()?5:14,260);S.shake=Math.max(S.shake||0,4)}
  }
  S.sig.fx=L.filter(o=>o.t<o.max);
}

/* ---- ציור (מ-render.js, בקואורדינטות העולם) ---- */
function sigDraw(){
  const L=S&&S.sig&&S.sig.fx;if(!L||!L.length)return;
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const o of L){if(o.t<0)continue;const k=o.t/o.max;ctx.strokeStyle=ctx.fillStyle=o.col;
    switch(o.k){
      case 'dome':{const f=Math.min(1,o.t/0.2),fade=k>0.8?(1-k)/0.2:1,r=70*f;
        ctx.globalAlpha=0.18*fade;ctx.beginPath();ctx.ellipse(P.x,P.y-r*0.4,r,r*0.9,0,Math.PI,0);ctx.fill();
        ctx.globalAlpha=0.85*fade;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(P.x,P.y-r*0.4,r,r*0.9,0,Math.PI,0);ctx.stroke();
        ctx.beginPath();ctx.ellipse(P.x,P.y,r,r*0.4,0,0,7);ctx.stroke();break}
      case 'wave':{const r=o.r*(0.25+0.75*Math.sqrt(k)),x=o.x??P.x,y=o.y??P.y;
        ctx.globalAlpha=0.5*(1-k);ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();
        ctx.globalAlpha=1-k;ctx.lineWidth=10*(1-k)+2;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.stroke();
        ctx.globalAlpha=0.7*(1-k);ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r*0.7,0,7);ctx.stroke();
        if(k<0.3){ctx.globalAlpha=0.25*(1-k/0.3);ctx.fillStyle='#fff';ctx.fillRect(x-1600,y-1600,3200,3200)}   // הבזק מסך קצר
        break}
      case 'blade':{const D=SIGSKILL.list.dawnblade,x=o.x??P.x,y=o.y??P.y;ctx.save();ctx.translate(x,y);ctx.rotate(o.a);
        if(o.t<D.delay){const f=o.t/D.delay;   // סימון: הקו מתמלא, והלהב יורד מלמעלה
          ctx.globalAlpha=0.25+0.3*f;ctx.fillRect(0,-o.w/2,o.len*f,o.w);ctx.globalAlpha=0.9;ctx.lineWidth=2;ctx.strokeRect(0,-o.w/2,o.len,o.w)}
        else{const f=(o.t-D.delay)/(o.max-D.delay);
          ctx.globalAlpha=0.9*(1-f);ctx.beginPath();ctx.moveTo(0,-o.w*0.5);ctx.lineTo(o.len,-o.w*0.12);ctx.lineTo(o.len+40,0);ctx.lineTo(o.len,o.w*0.12);ctx.lineTo(0,o.w*0.5);ctx.closePath();ctx.fill();
          ctx.fillStyle='#fff';ctx.globalAlpha=1-f;ctx.fillRect(0,-o.w*0.08,o.len,o.w*0.16)}
        ctx.restore();
        break}
      case 'bolt':{if(o.x==null)break;ctx.globalAlpha=1-k;ctx.lineWidth=5*(1-k)+1;ctx.beginPath();let y=o.y-420,x=o.x;ctx.moveTo(x,y);
        for(let i=0;i<7;i++){y+=60;x=o.x+(i<6?(Math.random()-0.5)*40:0);ctx.lineTo(x,i<6?y:o.y)}ctx.stroke();
        ctx.globalAlpha=0.4*(1-k);ctx.beginPath();ctx.arc(o.x,o.y,o.hr*(0.5+k),0,7);ctx.fill();break}
      case 'mark':ctx.globalAlpha=0.12*(1-k*0.5);ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,7);ctx.fill();
        ctx.globalAlpha=0.6*(1-k);ctx.lineWidth=2;ctx.setLineDash([12,10]);ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,7);ctx.stroke();ctx.setLineDash([]);break;
    }}
  ctx.restore();
}

/* ---- הכפתור: גלוי בעולם ובכפר רק כשיש דרגה (ה-CSS מסתיר אותו בכל מקום אחר) ---- */
function sigHud(){
  const b=$('sig');if(!b)return;const id=sigId(),on=!!id&&sigHere();
  if(b.hidden===on)b.hidden=!on;if(!on)return;
  const gk=id+'|'+gicoOn('sk');   // גם הסגנון (gicons.js): חדש = צללית בצבע סוג הנזק, קלאסי = האימוג'י
  if(b.dataset.id!==gk){b.dataset.id=gk;const D=SIGSKILL.list[id];b.style.setProperty('--dt',dtCol(D.dt));
    b.innerHTML=(gicoOn('sk')&&GICO.sk[id]?gIco(GICO.sk[id],'sigi',dtCol(D.dt)):'<span class="sigi">'+D.ic+'</span>')+'<i></i>';b.setAttribute('aria-label',T('sig.btn',T('sk.'+id)));b.dataset.sk=id}
  const v=String(Math.round(20*sigCd/SIGSKILL.cd)/20),n=sigCd>0?String(Math.ceil(sigCd)):'';
  if(b.dataset.cd!==v){const was=b.classList.contains('ready');b.dataset.cd=v;b.style.setProperty('--cd',v);b.classList.toggle('ready',v==='0');
    if(v==='0'&&!was){b.classList.remove('ping');void b.offsetWidth;b.classList.add('ping')}}
  if(b.dataset.sec!==n)b.dataset.sec=n;
}
// כרטיס בראש ספר הסקילים (wsbDrawUi ב-wskbook.js)
function sigBook(){
  const id=sigId();
  if(!id)return '<div class="sigc lock"><span class="wsbi">⭐</span><span class="wsbn"><b>'+T('sig.title')+'</b><small>🔒 '+T('sig.lock',RANKS.every)+'</small></span></div>';
  const D=SIGSKILL.list[id];
  return '<div class="sigc on" style="--dt:'+dtCol(D.dt)+'">'+(typeof gSk==='function'&&gSk(id)?'<span class="wsbi gif">'+gSk(id)+'</span>':'<span class="wsbi">'+D.ic+'</span>')+'<span class="wsbn"><b>⭐ '+T('sk.'+id)+'</b><small>'+T('sig.d.'+id)+'</small></span><span class="wsbk">4</span></div>';
}
$('sig').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();sigUse()});
$('sig').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();sigUse()}});
addEventListener('keydown',e=>{if(e.code==='Digit4'&&S&&(S.wd||S.vil)&&e.target===document.body)sigUse()});
