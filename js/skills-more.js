/* סקילים נוספים לזירה (אוראל, 5.11.2026: "סקילים יותר מעניינים ואפקטים"). בזירה בלבד: skillUse נעטף ומטפל רק במזהים שכאן.
   שלושה סקילים שלא דומים לטבעת או לברק:
     שביט (אש): מסמן את הצביר הצפוף של אויבים, ואחרי רגע נופל עליו ומתפוצץ. אפשר לברוח מהסימן, אז כדאי לכוון.
     חנית קרח (קרח): קרן דקה שעוברת דרך כל האויבים בקו מהקרוב. קרח מאט, ועל רטוב מקפיא.
     פריחה (מים): בריכה על הרצפה לכמה שניות. מרטיבה את מי שבתוכה ומרפאת אותך כשאתה עומד בה (רטוב + ברק או קרח = קומבו).
   המצב ב-S.skm (חדש בכל ריצה). הכפתורים, הטעינה והכרטיסים הם של skills.js, והציור כאן. כל המספרים ב-SKMORE.
   ציור: קווים דקים ושקופים, בלי חלקיקים בכלל פרט לכמה גחלים בשביט. "פחות אפקטים": בלי גחלים */
const SKMORE={
  list:{
    comet:{dt:'fire',cd:9,dmg:3,r:95,range:460,delay:0.8,embers:6},
    lance:{dt:'ice',cd:7,dmg:2.2,len:440,w:22,range:520},
    bloom:{dt:'water',cd:14,dmg:0.3,r:120,t:4.5,tick:0.5,heal:0.03}   // heal: חלק מהחיים המלאים בכל פעימה שאתה בתוך הבריכה
  },
  life:{boom:0.45,beam:0.35,ripple:1.6},   // כמה שניות כל אפקט נשאר על המסך
  shade:'rgba(12,10,18,0.5)'
};
for(const id in SKMORE.list)SKILLS.list[id]=SKMORE.list[id];

const skmState=()=>S.skm||(S.skm={fx:[],pend:[],pools:[],cast:0,hits:0});
{const old=skillsReset;skillsReset=function(){old.apply(this,arguments);S.skm={fx:[],pend:[],pools:[],cast:0,hits:0}}}

// הצביר הצפוף: האויב בטווח שיש הכי הרבה אויבים סביבו (עד 60 הראשונים, כדי שלא יכבד)
function skmDense(range,r){
  const pool=enemies.filter(e=>!e.dead&&!e.node&&Math.hypot(e.x-P.x,e.y-P.y)<range).slice(0,60);let best=null,bn=-1;
  for(const e of pool){let n=0;for(const o of pool)if(Math.hypot(o.x-e.x,o.y-e.y)<r)n++;if(n>bn){bn=n;best=e}}
  return best;
}
// מרחק נקודה מקטע
function skmSeg(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l));return Math.hypot(px-(ax+dx*t),py-(ay+dy*t))}

{const old=skillUse;skillUse=function(id){
  const D=SKMORE.list[id];if(!D)return old.apply(this,arguments);
  const k=S.sk,i=k?k.ids.indexOf(id):-1;
  if(i<0||k.cd[i]>0||S.mode!=='play'||!skArena())return false;
  const m=skmState(),col=dtCol(D.dt);
  if(id==='comet'){const t=skmDense(D.range,D.r);if(!t)return false;
    m.pend.push({x:t.x,y:t.y,t:0,max:D.delay,col})}
  else if(id==='lance'){const t=nearest(D.range);if(!t)return false;
    const a=Math.atan2(t.y-P.y,t.x-P.x),bx=P.x+Math.cos(a)*D.len,by=P.y+Math.sin(a)*D.len,base=skBase()*D.dmg;
    for(const e of enemies){if(e.dead||skmSeg(e.x,e.y,P.x,P.y,bx,by)>D.w+e.r)continue;damage(e,base,'skill',a,D.dt)}
    m.fx.push({k:'beam',ax:P.x,ay:P.y-6,bx,by,t:0,max:SKMORE.life.beam*themeK(),col});P.aim=a}
  else if(id==='bloom'){m.pools.push({x:P.x,y:P.y,t:0,max:D.t,tick:0,col})}
  k.cd[i]=D.cd;k.used++;m.cast++;sfxCast(D.dt);S.shake=Math.max(S.shake,2);   // הצליל של סוג הנזק (audio.js)
  return true}}

{const old=skillsUpdate;skillsUpdate=function(dt){
  old.apply(this,arguments);const m=S.skm;if(!m||!skArena())return;const D=SKMORE.list;
  for(const p of m.pend){p.t+=dt;if(p.t<p.max)continue;p.done=1;
    const d=D.comet,base=skBase()*d.dmg;
    for(const e of enemies){if(e.dead||Math.hypot(e.x-p.x,e.y-p.y)-e.r>d.r)continue;damage(e,base,'skill',Math.atan2(e.y-p.y,e.x-p.x),d.dt);m.hits++}
    m.fx.push({k:'boom',x:p.x,y:p.y,r:d.r,t:0,max:SKMORE.life.boom,col:p.col,seed:p.x*0.37+p.y*0.11});S.shake=Math.max(S.shake,5);sfx('shoot')}
  m.pend=m.pend.filter(p=>!p.done);
  const b=D.bloom;
  for(const o of m.pools){o.t+=dt;o.tick-=dt;if(o.tick>0)continue;o.tick=b.tick;const base=skBase()*b.dmg;
    for(const e of enemies){if(e.dead||Math.hypot(e.x-o.x,e.y-o.y)-e.r>b.r)continue;damage(e,base,'skill',0,b.dt);m.hits++}
    if(Math.hypot(P.x-o.x,P.y-o.y)<b.r&&P.hp<P.maxHp){const h0=P.hp;P.hp=Math.min(P.maxHp,P.hp+P.maxHp*b.heal);if(typeof SKANIM!=='undefined')floatText(P.x,P.y-P.r-24,'+'+Math.round(P.hp-h0),SKANIM.mo.bloom.healCol,15,true)}}   // מספר ירוק בכל ריפוי (MLBB 1.1)
  m.pools=m.pools.filter(o=>o.t<o.max);
  for(const f of m.fx)f.t+=dt;m.fx=m.fx.filter(f=>f.t<f.max)}}

/* ---- ציור: נקרא אחרי drawSkills. הכל קווים דקים, קו כהה מתחת כדי שיראה גם על רצפה בהירה ---- */
const skmShade=(w,col,a)=>{ctx.globalAlpha=a*0.7;ctx.strokeStyle=SKMORE.shade;ctx.lineWidth=w+2.5;ctx.stroke();ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.stroke()};
const skmEll=(x,y,r)=>{ctx.beginPath();ctx.ellipse(x,y,Math.max(0.1,r),Math.max(0.1,r*0.85),0,0,7)};
{const old=drawSkills;drawSkills=function(){
  old.apply(this,arguments);const m=S.skm;if(!m||!skArena()||(!m.fx.length&&!m.pend.length&&!m.pools.length))return;
  const parts=typeof skfxParts==='function'?skfxParts():!fxLess();
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  // בריכה: מילוי רך, שפה דקה, ואדווה אחת שיוצאת מהמרכז. דועכת בשנייה האחרונה
  for(const o of m.pools){const b=SKMORE.list.bloom,a=Math.min(1,(o.max-o.t)/0.8,o.t/0.2),r=b.r*(0.6+0.4*Math.min(1,o.t/0.3));
    ctx.fillStyle=o.col;ctx.globalAlpha=a*0.13;skmEll(o.x,o.y,r);ctx.fill();skmShade(1.6,o.col,a*0.8);
    if(parts){const q=(o.t%SKMORE.life.ripple)/SKMORE.life.ripple;skmEll(o.x,o.y,r*(0.2+0.8*q));skmShade(1.2,'#DDF0FF',a*(1-q)*0.8)}}
  // שביט: טבעת דקה שמתכווצת אל המטרה, ובשבריר האחרון קו אש שיורד מלמעלה
  for(const p of m.pend){const d=SKMORE.list.comet,k=p.t/p.max,r=d.r*(1.5-0.5*k);
    skmEll(p.x,p.y,r);ctx.setLineDash([7,6]);skmShade(1.8,p.col,0.5+0.4*k);ctx.setLineDash([]);
    skmEll(p.x,p.y,d.r*k*0.9);ctx.fillStyle=p.col;ctx.globalAlpha=0.1+0.14*k;ctx.fill();
    if(k>0.65){const q=(k-0.65)/0.35,hy=p.y-260*(1-q);ctx.beginPath();ctx.moveTo(p.x+70*(1-q)+30,hy-70);ctx.lineTo(p.x+70*(1-q),hy);
      skmShade(3,'#FFD84D',0.9);ctx.beginPath();ctx.arc(p.x+70*(1-q),hy,4,0,7);ctx.fillStyle='#fff';ctx.globalAlpha=1;ctx.fill()}}
  for(const f of m.fx){const k=f.t/f.max,a=1-k;
    if(f.k==='boom'){const r=f.r*(0.3+0.7*(1-(1-k)*(1-k)));
      ctx.fillStyle='#fff';ctx.globalAlpha=a*a*0.55;skmEll(f.x,f.y,r*0.5*(1-k));ctx.fill();
      ctx.fillStyle=f.col;ctx.globalAlpha=a*0.2;skmEll(f.x,f.y,r);ctx.fill();skmEll(f.x,f.y,r);skmShade(2+3*a,f.col,a);
      if(parts){const n=SKMORE.list.comet.embers;ctx.beginPath();
        for(let i=0;i<n;i++){const an=skRnd(f.seed,i)*6.283,d=r*(0.4+0.6*skRnd(f.seed,i+9)),x=f.x+Math.cos(an)*d,y=f.y+Math.sin(an)*d*0.85-30*k*(0.5+skRnd(f.seed,i+3));ctx.moveTo(x+2,y);ctx.arc(x,y,2*a+0.4,0,7)}
        ctx.fillStyle='#FFD84D';ctx.globalAlpha=a;ctx.fill()}}
    else if(f.k==='beam'){const D=SKMORE.list.lance,dx=f.bx-f.ax,dy=f.by-f.ay,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,w=D.w*a;
      ctx.beginPath();ctx.moveTo(f.ax,f.ay);ctx.lineTo(f.ax+dx*0.5+nx*w*0.5,f.ay+dy*0.5+ny*w*0.5);ctx.lineTo(f.bx,f.by);ctx.lineTo(f.ax+dx*0.5-nx*w*0.5,f.ay+dy*0.5-ny*w*0.5);ctx.closePath();
      ctx.fillStyle=f.col;ctx.globalAlpha=a*0.28;ctx.fill();
      ctx.beginPath();ctx.moveTo(f.ax,f.ay);ctx.lineTo(f.bx,f.by);skmShade(2.2,'#E8FBFF',a);
      if(parts){ctx.beginPath();for(let i=1;i<=3;i++){const p=i/4,x=f.ax+dx*p,y=f.ay+dy*p,s=7*a;ctx.moveTo(x,y-s);ctx.lineTo(x+s*0.6,y);ctx.lineTo(x,y+s);ctx.lineTo(x-s*0.6,y);ctx.closePath()}
        ctx.fillStyle='#E8FBFF';ctx.globalAlpha=a;ctx.fill();ctx.strokeStyle=SKMORE.shade;ctx.lineWidth=1;ctx.stroke()}}}
  ctx.restore();ctx.globalAlpha=1}}
