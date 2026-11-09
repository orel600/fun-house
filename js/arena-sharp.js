/* הזירה: שפת אפקטים חדה לשנים עשר הסקילים הקיימים (ARSH, השיפוץ, ARENA-A, 10.11.2026). רק מראה, ורק ב-overhaul/preview. ?arsharp=0 מחזיר את הקודם.
   הכלל (התדריך): צורות חדות עם כיוון, שובל ברור, פיצוץ מגע אחד קצר ודעיכה מהירה, וסוף ברור לכל אפקט. בלי עיגולים וסיגילים שנערמים,
   בלי הבזק ובלי רעידה. הנזק, התזמון, הרדיוס, המטרות וההמתנה לא משתנים: כל אפקט נולד מהרשומות שהמשחק כבר יוצר (S.sk.fx, S.skm) ורק מצויר אחרת.
   מה כבוי כשהקובץ פעיל: טבעות הדף ומילוי של skills.js/skill-fx.js, מעגל הקסם והגיליונות הראשיים של skill-anim.js (נשארים: פגיעה לכל אויב ומצבים),
   הציור הישן של שביט, חנית ופריחה (skills-more.js), והרעידה של הסקילים (skillUse, שביט, אולטימייט).
   האולטימייט: הפנסים הם p3LanternOrb ב-ult-lantern3d.js (תלת-ממד). כאן: בלי טבעת, פיצוץ קטן בסוף כל פנס, ובדו-ממד (כשאין תלת-ממד) פנס מצויר בקנבס.
   הכל בקנבס מעל התלת-ממד, בקואורדינטות העולם, בזמן המשחק (S.t). המספרים ב-ARSHC. מחיקה: הקובץ, השורה ב-index.html, ו-ARSHC.ring ב-ult-lantern3d.js */
const ARSHC={
  shade:'rgba(12,10,18,0.55)',
  max:14,                      // כמה אפקטים חיים בבת אחת, לכל היותר (הוותיק נעצר)
  noShake:true,shakeCap:3,                // בלי רעידת מסך מהסקילים (skills.js, skills-more.js, ult.js, והרעידה הנוספת של skill-anim.js)
  quake:{rows:[[0.35,6],[0.65,9],[0.95,12]],travel:0.18,rise:0.1,hold:0.28,sink:0.24,h:[36,58],w:[7,11],cracks:8,crackT:0.2,dur:1.0,snd:{t:0.08,id:'imp_wall',k:0.8}},
  frost:{n:11,rain:0.28,fall:0.16,high:230,slant:44,hold:0.35,shatter:0.28,dur:1.1,snd:{t:0.2,id:'cast_ice',k:0.8}},
  flame:{n:20,front:0.22,burn:0.45,h:34,dur:0.62},
  splash:{n:7,travel:0.2,rise:0.12,hold:0.14,fall:0.34,h:[62,92],w:9,drops:5,dur:0.9},
  zap:{sky:330,skyT:0.26,arc:0.16,gap:0.07,jit:9,seg:6,star:16},
  lance:{run:0.14,shaft:170,lift:80,gouge:0.5,star:28,dur:0.55},
  comet:{start:0.2,sx:-110,sy:300,tail:150,dur:1.4,star:92,fwd:1.4,cracks:7,embers:6,snd:{id:'tower_fall',k:0.9}},
  bloom:{seed:0.3,open:0.35,petals:7,pr:36,motes:8,leave:0.7},
  dash:{dur:0.3,ghosts:3,bars:3},
  heal:{dur:0.8,h:220,motes:9},
  smite:{sky:360,dur:0.3,star:42,jit:10,seg:7},
  ult:{dur:0.6,start:40,star:26,starT:0.2,lift:[54,90],n2d:6}
};
const ARSH={on:!/[?&]arsharp=0(&|$)/.test(location.search),list:[],zi:0,zt:-1,stat:{spawn:{},drawn:0,peak:0,skip:0,arcs:0}};
// זה אותו תנאי של skill-fx.js: דמות אישית (חליל, ניצוץ) ומשחקי השאול נשארים כמו שהיו
const arshOn=()=>ARSH.on&&typeof skArena==='function'&&!!S&&!!S.sk&&skArena()&&!(typeof MB!=='undefined'&&MB)&&!(typeof heroTheme==='function'&&heroTheme());
const arshLess=()=>typeof fxLess==='function'&&fxLess();
const arshR=(s,i)=>{const x=Math.sin(s*12.9898+i*78.233)*43758.5453;return x-Math.floor(x)};   // מספר קבוע לפי זרע (אותו דבר כמו skRnd)
let arshSeed=0;const arshSd=()=>((++arshSeed)*7.31)%1000;
const arshE=k=>1-(1-k)*(1-k);
const arshC=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const arshLerp=(a,b,t)=>a+(b-a)*t;
function arshSpawn(kind,o){
  const st=ARSH.stat.spawn;st[kind]=(st[kind]||0)+1;
  const e=Object.assign({kind,t0:S.t,seed:arshSd(),snd:null,sndDone:false},o);
  while(ARSH.list.length>=ARSHC.max){ARSH.list.shift();ARSH.stat.skip++}
  ARSH.list.push(e);
  if(typeof SKANIMS!=='undefined')SKANIMS.stat.fx++;   // הספירה של הבוט
  return e;
}

/* ---- ציור: אבני בניין חדות ---- */
// עקרון: קו כהה מתחת, ואז הצבע, ולב לבן, כדי שייראה גם על רצפה בהירה וגם על כהה
function arshShadeStroke(w,col,a){ctx.globalAlpha=a*0.8;ctx.strokeStyle=ARSHC.shade;ctx.lineWidth=w+2.5;ctx.stroke();ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.stroke()}
// פס מחודד: דק בקצה האחורי, רחב בראש. ראש (x1,y1)
function arshStreak(x0,y0,x1,y1,w,col,a,core){
  const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy)||1,nx=-dy/L*w*0.5,ny=dx/L*w*0.5;
  ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1+nx,y1+ny);ctx.lineTo(x1+dx/L*w*0.6,y1+dy/L*w*0.6);ctx.lineTo(x1-nx,y1-ny);ctx.closePath();
  ctx.globalAlpha=a*0.9;ctx.fillStyle=ARSHC.shade;ctx.fill();   // צל כהה: רחב מעט
  ctx.globalAlpha=a;ctx.fillStyle=col;ctx.fill();
  if(core){ctx.beginPath();ctx.moveTo(x0+dx*0.25,y0+dy*0.25);ctx.lineTo(x1+nx*0.4,y1+ny*0.4);ctx.lineTo(x1+dx/L*w*0.35,y1+dy/L*w*0.35);ctx.lineTo(x1-nx*0.4,y1-ny*0.4);ctx.closePath();ctx.fillStyle=core;ctx.fill()}
}
// כוכב פגיעה: קוצים דקים עם כיוון (bias: כמה יותר ארוכים לכיוון ang). נבנה כנתיב אחד
function arshStar(x,y,r,n,seed,col,a,ang,bias){
  ctx.beginPath();
  for(let i=0;i<n;i++){const an=i/n*6.283+arshR(seed,i)*0.5,fw=ang===undefined?1:1+bias*Math.cos(an-ang)*0.5,L=r*(0.55+0.45*arshR(seed,i+9))*Math.max(0.25,fw),w=Math.max(0.8,r*0.075);
    const c=Math.cos(an),s=Math.sin(an);ctx.moveTo(x-s*w,y*1+c*w*0.85);ctx.lineTo(x+c*L,y+s*L*0.85);ctx.lineTo(x+s*w,y-c*w*0.85);ctx.closePath()}
  ctx.globalAlpha=a*0.85;ctx.fillStyle=ARSHC.shade;ctx.fill();
  ctx.globalAlpha=a;ctx.fillStyle=col;ctx.fill();
  ctx.beginPath();ctx.arc(x,y,Math.max(0.5,r*0.14*a),0,7);ctx.fillStyle='#fff';ctx.fill();
}
function arshPoly(pts){ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath()}
function arshLine(pts){ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y))}
// קו שבור (ברק): משתמש ב-skBolt של skill-fx.js
const arshBolt=(ax,ay,bx,by,seed,n,jit)=>typeof skBolt==='function'?skBolt(ax,ay,bx,by,seed,n,jit):[[ax,ay],[bx,by]];
function arshBoltDraw(pts,col,a,w){arshLine(pts);for(const [ww,c,al] of [[w+3,ARSHC.shade,0.7],[w,col,1],[Math.max(1,w*0.4),'#fff',0.95]]){ctx.globalAlpha=a*al;ctx.strokeStyle=c;ctx.lineWidth=ww;ctx.stroke()}}
// פנס צף בקנבס (דו-ממד בלבד): כובע, כלוב וגביש זוהר
function arshLantern(x,y,col,a,s,pulse){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.globalAlpha=a*0.55;const g=ctx.createRadialGradient(0,0,2,0,0,26);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,26,0,7);ctx.fill();
  ctx.globalAlpha=a;ctx.lineJoin='round';
  arshPoly([[-8,-14],[8,-14],[11,-6],[-11,-6]]);ctx.fillStyle='#3b3128';ctx.fill();ctx.strokeStyle='#C9B28A';ctx.lineWidth=1.2;ctx.stroke();   // כובע
  arshPoly([[-10,-6],[10,-6],[10,12],[-10,12]]);ctx.fillStyle='rgba(20,16,12,0.5)';ctx.fill();ctx.strokeStyle='#C9B28A';ctx.lineWidth=1.4;ctx.stroke();   // כלוב
  ctx.beginPath();ctx.moveTo(-3.3,-6);ctx.lineTo(-3.3,12);ctx.moveTo(3.3,-6);ctx.lineTo(3.3,12);ctx.stroke();
  arshPoly([[0,-8*pulse],[6*pulse,2],[0,11*pulse],[-6*pulse,2]]);ctx.fillStyle='#fff';ctx.globalAlpha=a;ctx.fill();ctx.fillStyle=col;ctx.globalAlpha=a*0.7;ctx.fill();   // גביש
  ctx.restore();
}

/* ---- כל סוג אפקט: זמן k מ-0 עד 1 לפי dur, ומחזיר false כשנגמר ---- */
const ARSHD={
  // רעידה: קוצי אדמה שפורצים מהמרכז החוצה לפי סדר (הגל נראה), וסדקים שנשארים ונמוגים
  quake(e,T){
    const Q=ARSHC.quake,t=T-e.t0,k=t/Q.dur;if(k>=1)return false;
    const g=arshC(t/Q.crackT),fa=arshC((Q.dur-t)/(Q.dur*0.45));
    ctx.beginPath();
    for(let c=0;c<Q.cracks;c++){const an=(c+arshR(e.seed,c)*0.6)/Q.cracks*6.283,L=e.R*0.95*(0.7+0.3*arshR(e.seed,c+40))*g;ctx.moveTo(e.x,e.y);
      for(let j=1;j<=4;j++){const d=L*j/4,b=an+(arshR(e.seed,c*9+j)-0.5)*0.7;ctx.lineTo(e.x+Math.cos(b)*d,e.y+Math.sin(b)*d*0.85)}}
    ctx.globalAlpha=fa;ctx.strokeStyle='#1E140C';ctx.lineWidth=3.2;ctx.stroke();ctx.globalAlpha=fa*0.85;ctx.strokeStyle='#E0B27A';ctx.lineWidth=1.1;ctx.stroke();
    const less=arshLess();let idx=0;
    for(const [f,n0] of Q.rows){const n=less?Math.ceil(n0/2):n0;
      for(let i=0;i<n;i++,idx++){
        const an=(i+arshR(e.seed,idx+100)*0.5)/n*6.283+f,dist=f*e.R*(0.92+0.12*arshR(e.seed,idx+101)),d=t-f*Q.travel;if(d<0)continue;
        const h0=Q.h[0]+(Q.h[1]-Q.h[0])*arshR(e.seed,idx+102),w=Q.w[0]+(Q.w[1]-Q.w[0])*arshR(e.seed,idx+103);
        const up=arshE(arshC(d/Q.rise)),dn=arshC((d-Q.rise-Q.hold)/Q.sink),h=h0*up*(1-dn*dn);if(h<1)continue;
        const px=e.x+Math.cos(an)*dist,py=e.y+Math.sin(an)*dist*0.85,lean=(px-e.x)/e.R*5,al=1-dn*0.6;
        arshPoly([[px-w,py],[px+lean,py-h],[px+w,py]]);ctx.globalAlpha=al;ctx.fillStyle='#3E2D1C';ctx.fill();
        arshPoly([[px-w*0.15,py],[px+lean,py-h],[px+w,py]]);ctx.fillStyle='#A07C52';ctx.fill();   // הפן המואר
        arshLine([[px-w,py],[px+lean,py-h],[px+w,py]]);ctx.strokeStyle='#F0D3A2';ctx.lineWidth=1;ctx.globalAlpha=al*0.9;ctx.stroke();
        if(dn>0&&!less){const q=dn;ctx.beginPath();for(let j=0;j<3;j++){const a2=an+j*2.1,dd=q*16,rx=px+Math.cos(a2)*dd,ry=py-h*0.4-q*10+q*q*26;ctx.moveTo(rx+2,ry);ctx.arc(rx,ry,1.8,0,7)}ctx.globalAlpha=(1-q)*0.9;ctx.fillStyle='#A07C52';ctx.fill()}   // אבנים קטנות נופלות
      }}
    return true;
  },
  // שביט: מסלול מלמעלה אל הנקודה. נמשך לפי ההמתנה של המשחק (p.t/p.max), ונגמר כשהוא נוחת
  cometFall(e,T){
    const p=e.p,C=ARSHC.comet;if(p.done||e.landed)return false;
    const k=arshC(p.t/p.max),q=arshC((k-C.start)/(1-C.start));
    // קו האזהרה: אליפסה דקה מקווקוות. הוא נשאר כמו שהיה (המקום שבו זה ינחת), בלי מילוי
    ctx.setLineDash([7,6]);ctx.beginPath();ctx.ellipse(p.x,p.y,e.R*(1.35-0.35*k),e.R*(1.35-0.35*k)*0.85,0,0,7);arshShadeStroke(1.6,p.col,0.45+0.4*k);ctx.setLineDash([]);
    if(q<=0)return true;
    const qq=Math.pow(q,1.5),sx=p.x+C.sx,sy=p.y-C.sy,hx=arshLerp(sx,p.x,qq),hy=arshLerp(sy,p.y,qq),dx=p.x-sx,dy=p.y-sy,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,tail=C.tail*Math.min(1,0.3+q);
    ctx.beginPath();ctx.ellipse(p.x,p.y,4+22*qq,(4+22*qq)*0.85,0,0,7);ctx.globalAlpha=0.1+0.3*qq;ctx.fillStyle='#000';ctx.fill();   // צל שגדל על הרצפה
    arshStreak(hx-ux*tail,hy-uy*tail,hx,hy,11,'#FF8A3D',0.95,'#FFE9A8');
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=0.55;ctx.fillStyle='#FF8A3D';ctx.beginPath();ctx.arc(hx,hy,13,0,7);ctx.fill();ctx.globalCompositeOperation='source-over';
    ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(hx,hy,5.5,0,7);ctx.fill();
    if(!arshLess()){ctx.beginPath();for(let i=0;i<5;i++){const b=(i+1)/6,x=hx-ux*tail*b+(arshR(e.seed,i)-0.5)*12,y=hy-uy*tail*b+(arshR(e.seed,i+7)-0.5)*12;ctx.moveTo(x+2,y);ctx.arc(x,y,2*(1-b)+0.6,0,7)}ctx.globalAlpha=0.9;ctx.fillStyle='#FFD84D';ctx.fill()}
    return true;
  },
  // נחיתה: כוכב אחד עם כיוון (קדימה לכיוון הנפילה ארוך יותר), חרך שנשאר והסדקים מתקררים, וגחלים
  cometHit(e,T){
    const C=ARSHC.comet,t=T-e.t0,k=t/C.dur;if(k>=1)return false;
    const cool=arshC(t/(C.dur*0.9)),a=1-k,R=e.R,ang=Math.atan2(C.sy,-C.sx);
    ctx.beginPath();ctx.ellipse(e.x,e.y,R*0.75*arshC(t/0.1),R*0.75*0.85*arshC(t/0.1),0,0,7);ctx.globalAlpha=0.38*(1-cool);ctx.fillStyle='#120A06';ctx.fill();   // חרך
    ctx.beginPath();
    for(let c=0;c<C.cracks;c++){const an=(c+arshR(e.seed,c)*0.5)/C.cracks*6.283,L=R*(0.55+0.4*arshR(e.seed,c+30))*arshE(arshC(t/0.12));ctx.moveTo(e.x,e.y);
      for(let j=1;j<=3;j++){const d=L*j/3,b=an+(arshR(e.seed,c*7+j)-0.5)*0.8;ctx.lineTo(e.x+Math.cos(b)*d,e.y+Math.sin(b)*d*0.85)}}
    ctx.globalAlpha=1-cool*0.7;ctx.strokeStyle=cool<0.35?'#FFD84D':cool<0.7?'#FF8A3D':'#5A2C1C';ctx.lineWidth=2.2;ctx.stroke();
    if(t<0.24){const q=t/0.24,r=C.star*(q<0.25?q/0.25:1-(q-0.25)/0.75*0.7);arshStar(e.x,e.y-6,r,9,e.seed,'#FFB347',1-q*q,ang,C.fwd);}   // מכה אחת, ודעיכה
    if(!arshLess()&&t<0.8){ctx.beginPath();for(let i=0;i<C.embers;i++){const an=arshR(e.seed,i+50)*6.283,sp=30+60*arshR(e.seed,i+51),tt=t,x=e.x+Math.cos(an)*sp*tt*2,y=e.y-8-(70+60*arshR(e.seed,i+52))*tt+260*tt*tt;ctx.moveTo(x+1.8,y);ctx.arc(x,y,1.8,0,7)}
      ctx.globalAlpha=1-t/0.8;ctx.fillStyle='#FFD84D';ctx.fill()}
    return true;
  },
  // כפור: רסיסים נופלים בזה אחר זה אל הטבעת, נעצרים כגבישים, ואז מתנפצים
  frost(e,T){
    const F=ARSHC.frost,t=T-e.t0,k=t/F.dur;if(k>=1)return false;
    const n=arshLess()?Math.ceil(F.n*0.6):F.n;
    for(let i=0;i<n;i++){
      const an=arshR(e.seed,i)*6.283,d=e.R*Math.sqrt(arshR(e.seed,i+20))*0.92,px=e.x+Math.cos(an)*d,py=e.y+Math.sin(an)*d*0.85,del=i/n*F.rain,tf=t-del;if(tf<0)continue;
      const q=tf/F.fall;
      if(q<1){const hx=px-F.slant*(1-q),hy=py-F.high*(1-q),tx=hx-F.slant*0.26,ty=hy-60;
        arshStreak(tx,ty,hx,hy,8,'#BFEFFF',0.95,'#fff');}
      else{const lt=tf-F.fall,sh=arshC((lt-F.hold)/F.shatter);
        if(lt<0.1){arshStar(px,py,15*(1-lt/0.1)+4,6,e.seed+i,'#E8FBFF',1-lt/0.1)}   // ניצוץ קצר בנחיתה
        if(sh<=0){const gr=arshE(arshC(lt/0.06));   // גביש: שלושה קוצים
          for(const [ox,h,w] of [[0,30,6],[-6,20,4.5],[6,16,4]]){const hh=h*gr;arshPoly([[px+ox-w,py],[px+ox*1.3,py-hh],[px+ox+w,py]]);ctx.globalAlpha=0.95;ctx.fillStyle='#7FD3EE';ctx.fill();
            arshPoly([[px+ox-w*0.1,py],[px+ox*1.3,py-hh],[px+ox+w,py]]);ctx.fillStyle='#E8FBFF';ctx.fill();arshLine([[px+ox-w,py],[px+ox*1.3,py-hh],[px+ox+w,py]]);ctx.strokeStyle=ARSHC.shade;ctx.lineWidth=1;ctx.stroke()}}
        else if(sh<1){ctx.beginPath();for(let j=0;j<4;j++){const a2=-1.2-j*0.55+(arshR(e.seed,i*4+j)-0.5)*0.4,sp=26+22*arshR(e.seed,i*4+j+9),x=px+Math.cos(a2)*sp*sh*1.1,y=py-14+Math.sin(a2)*sp*sh+90*sh*sh;
            const z=4*(1-sh)+1;ctx.moveTo(x-z,y);ctx.lineTo(x,y-z*1.6);ctx.lineTo(x+z,y);ctx.lineTo(x,y+z)}ctx.globalAlpha=1-sh;ctx.fillStyle='#E8FBFF';ctx.fill()}   // התנפצות
      }}
    return true;
  },
  // להבה: חזית אש שמתרחבת (לשונות חדות, בלי מילוי), גחלים, והיא דועכת מהר
  flame(e,T){
    const F=ARSHC.flame,t=T-e.t0,k=t/F.dur;if(k>=1)return false;
    const rr=e.R*arshE(arshC(t/F.front)),burn=1-arshC((t-F.front)/(F.burn-F.front)),n=arshLess()?Math.ceil(F.n*0.6):F.n,flick=t*30;
    if(burn<=0)return true;
    const T1=[],H=F.h*burn*(0.55+0.45*arshE(arshC(t/F.front)));
    for(let i=0;i<n;i++){const an=(i+arshR(e.seed,i)*0.5)/n*6.283,h=H*(0.7+0.3*arshR(e.seed,i+20))*(1+0.15*Math.sin(flick+i*1.7)),w=7+4*arshR(e.seed,i+21),c=Math.cos(an),s=Math.sin(an);
      T1.push({x:e.x+c*rr,y:e.y+s*rr*0.85,h,w,dx:c*h*0.6,dy:-h+s*h*0.2})}
    const draw=(kw,kh)=>{ctx.beginPath();for(const q of T1){const w=q.w*kw,h=q.h*kh;ctx.moveTo(q.x-w,q.y);ctx.quadraticCurveTo(q.x-w*0.7+q.dx*kh*0.3,q.y-h*0.6,q.x+q.dx*kh,q.y+q.dy*kh);ctx.quadraticCurveTo(q.x+w*0.7+q.dx*kh*0.3,q.y-h*0.6,q.x+w,q.y);ctx.closePath()}};
    ctx.globalAlpha=0.85*burn;ctx.fillStyle=ARSHC.shade;draw(1.2,1.1);ctx.fill();
    ctx.globalAlpha=burn;ctx.fillStyle='#FF6A2B';draw(1,1);ctx.fill();ctx.fillStyle='#FFB52E';draw(0.62,0.7);ctx.fill();ctx.fillStyle='#FFF3C4';draw(0.28,0.4);ctx.fill();
    if(!arshLess()){ctx.beginPath();for(let i=0;i<10;i++){const an=arshR(e.seed,i+60)*6.283,x=e.x+Math.cos(an)*rr*(0.8+0.2*arshR(e.seed,i+61)),y=e.y+Math.sin(an)*rr*0.85-30*k-40*k*arshR(e.seed,i+62)-4;ctx.moveTo(x+1.7,y);ctx.arc(x,y,1.7*(1-k)+0.4,0,7)}ctx.globalAlpha=1-k;ctx.fillStyle='#FFD84D';ctx.fill()}
    return true;
  },
  // התזה: עמודי מים שפורצים למעלה לפי סדר מהמרכז, וטיפות שנופלות חזרה
  splash(e,T){
    const S_=ARSHC.splash,t=T-e.t0,k=t/S_.dur;if(k>=1)return false;
    const n=arshLess()?4:S_.n,arr=[];
    for(let i=0;i<n;i++){const an=(i+arshR(e.seed,i)*0.6)/n*6.283,d=e.R*(0.25+0.6*arshR(e.seed,i+10));arr.push({i,an,d})}
    arr.sort((a,b)=>a.d-b.d);
    for(const g of arr){
      const px=e.x+Math.cos(g.an)*g.d,py=e.y+Math.sin(g.an)*g.d*0.85,tt=t-g.d/e.R*S_.travel;if(tt<0)continue;
      const H=S_.h[0]+(S_.h[1]-S_.h[0])*arshR(e.seed,g.i+11),up=arshE(arshC(tt/S_.rise)),dn=arshC((tt-S_.rise-S_.hold)/S_.fall),h=H*up*(1-dn*dn);
      if(h>2){const w=S_.w*(1-0.4*dn);
        ctx.beginPath();ctx.moveTo(px-w,py);ctx.quadraticCurveTo(px-w*0.6,py-h*0.6,px-w*0.25,py-h);ctx.lineTo(px+w*0.25,py-h);ctx.quadraticCurveTo(px+w*0.6,py-h*0.6,px+w,py);ctx.closePath();
        ctx.globalAlpha=0.9;ctx.fillStyle=ARSHC.shade;ctx.fill();ctx.globalAlpha=0.95;ctx.fillStyle='#4FB4F2';ctx.fill();
        ctx.beginPath();ctx.moveTo(px-w*0.1,py);ctx.quadraticCurveTo(px+w*0.1,py-h*0.6,px+w*0.15,py-h);ctx.lineTo(px+w*0.4,py-h);ctx.quadraticCurveTo(px+w*0.45,py-h*0.6,px+w*0.7,py);ctx.closePath();ctx.fillStyle='#DDF0FF';ctx.fill();
        ctx.beginPath();ctx.moveTo(px-w*1.6,py);ctx.quadraticCurveTo(px-w*0.9,py-5*up,px-w*0.5,py);ctx.moveTo(px+w*0.5,py);ctx.quadraticCurveTo(px+w*0.9,py-5*up,px+w*1.6,py);ctx.globalAlpha=0.9*(1-dn);ctx.strokeStyle='#DDF0FF';ctx.lineWidth=1.6;ctx.stroke()}   // שני קשתות קצף בבסיס
      if(!arshLess()&&tt>S_.rise*0.6&&dn<1){const q=arshC((tt-S_.rise*0.6)/(S_.rise+S_.hold+S_.fall));ctx.beginPath();
        for(let j=0;j<S_.drops;j++){const a2=g.an+(j/S_.drops-0.5)*2.2+arshR(e.seed,g.i*9+j)*0.5,sp=18+28*arshR(e.seed,g.i*9+j+3),x=px+Math.cos(a2)*sp*q*1.3,y=py-H*0.9*Math.sin(Math.PI*Math.min(1,q*1.0))*arshR(e.seed,g.i*9+j+5)*1.1+60*q*q*0.2;
          ctx.moveTo(x+2,y);ctx.arc(x,y,2,0,7)}ctx.globalAlpha=1-q;ctx.fillStyle='#DDF0FF';ctx.fill()}
    }
    return true;
  },
  // ברק: קרניים ישרות מהשמיים אל המטרה הראשונה (בהמשך), וקשתות משובצות מאויב לאויב
  bolt(e,T){
    const Z=ARSHC.zap,t=T-e.t0-e.delay,life=e.sky?Z.skyT:Z.arc;if(t<0)return true;if(t>=life)return false;
    const q=t/life,fr=Math.floor(t/0.045),sd=e.seed+fr*7.13,fl=fr%2?1:0.75,a=(1-q*q)*fl;
    if(e.sky){const pts=arshBolt(e.bx+34,e.by-Z.sky,e.bx,e.by,sd,Z.seg+2,Z.jit+4);arshBoltDraw(pts,e.col,a,4.5);
      if(q<0.7)arshStar(e.bx,e.by,Z.star*1.7*(1-q),6,e.seed,'#fff',1-q,Math.PI/2,0);
      return true}
    const pts=arshBolt(e.ax,e.ay,e.bx,e.by,sd,Z.seg,Z.jit);arshBoltDraw(pts,e.col,a,3);
    // קשת: ענף קטן אחד
    const m=pts[Math.round(Z.seg*0.5)],dx=e.bx-e.ax,dy=e.by-e.ay,side=arshR(sd,99)<0.5?-1:1;
    arshBoltDraw(arshBolt(m[0],m[1],m[0]+dx*0.28-dy*0.15*side,m[1]+dy*0.28+dx*0.15*side,sd+3,3,Z.jit*0.6),e.col,a*0.8,1.8);
    arshStar(e.bx,e.by,Z.star*(1-q*0.6),5,e.seed,'#fff',a,undefined);
    return true;
  },
  // חנית אור: קצה מהיר לאורך הקו, ידית מתעקלת למעלה (נכנסת מגבוה), חריץ זוהר שנמוג, וניצוץ בסוף
  lance(e,T){
    const L_=ARSHC.lance,t=T-e.t0,k=t/L_.dur;if(k>=1)return false;
    const dx=e.bx-e.ax,dy=e.by-e.ay,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,s=arshE(arshC(t/L_.run)),tx=e.ax+dx*s,ty=e.ay+dy*s,fade=arshC((L_.dur-t)/0.2);
    const gouge=arshC(1-t/L_.gouge);
    if(gouge>0){arshLine([[e.ax,e.ay],[tx,ty]]);ctx.lineCap='round';arshShadeStroke(1+3*gouge,'#7FE3FF',0.8*gouge);ctx.lineCap='butt'}   // חריץ זוהר לאורך הדרך
    const sh=Math.min(L_.shaft,L*0.7),ex=s<1?1:fade;
    if(ex>0){
      const p1=[tx-ux*sh*0.5,ty-uy*sh*0.5-L_.lift*0.28],p2=[tx-ux*sh,ty-uy*sh-L_.lift];   // הידית עולה אחורה למעלה, כאילו נכנסה מגבוה
      ctx.beginPath();ctx.moveTo(p2[0],p2[1]);ctx.quadraticCurveTo(p1[0],p1[1],tx,ty);ctx.lineCap='round';
      ctx.globalAlpha=0.8*ex;ctx.strokeStyle=ARSHC.shade;ctx.lineWidth=7;ctx.stroke();ctx.globalAlpha=ex;ctx.strokeStyle='#7FE3FF';ctx.lineWidth=4.5;ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=1.6;ctx.stroke();ctx.lineCap='butt';
      const nx=-uy,ny=ux;arshPoly([[tx+ux*14,ty+uy*14],[tx+nx*5,ty+ny*5],[tx-ux*7,ty-uy*7],[tx-nx*5,ty-ny*5]]);ctx.globalAlpha=ex;ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#7FE3FF';ctx.lineWidth=1.2;ctx.stroke()}   // ראש היהלום
    if(t>=L_.run&&t<L_.run+0.22){const q=(t-L_.run)/0.22;arshStar(e.bx,e.by,L_.star*(1-q*0.5),6,e.seed,'#E8FBFF',1-q,Math.atan2(dy,dx),1);}
    return true;
  },
  // פריחה: זרע יורד, פרח נפתח, אבקה עולה כל זמן הבריכה, ובסוף הוא נסגר ונמוג
  bloom(e,T){
    const B=ARSHC.bloom,o=e.o,t=o.t,left=o.max-o.t;if(t>=o.max-0.001&&left<=0)return false;
    const r=SKMORE.list.bloom.r,open=arshE(arshC((t-B.seed)/B.open)),leave=arshC(left/B.leave),pul=0.5+0.5*Math.sin(t*3);
    if(t<B.seed){const q=t/B.seed,y=o.y-180*(1-q*q);arshStreak(o.x-2,y-46,o.x,y,6,'#DFFFE8',0.9,'#fff');ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(o.x,y,4,0,7);ctx.fill();return true}
    if(t<B.seed+0.18){const q=(t-B.seed)/0.18;arshStar(o.x,o.y-2,22*(1-q*0.3),7,e.seed,'#DFFFE8',1-q,undefined)}   // אבקה נפרצת בפתיחה
    // הילה רכה אחת (בלי קו), רק כל זמן הפעילות
    ctx.globalAlpha=0.07*leave*(0.8+0.4*pul);ctx.fillStyle='#9FEFB8';ctx.beginPath();ctx.ellipse(o.x,o.y,r,r*0.85,0,0,7);ctx.fill();
    const pr=B.pr*open*leave;
    if(pr>1){for(let i=0;i<B.petals;i++){const an=i/B.petals*6.283+e.seed,c=Math.cos(an),s=Math.sin(an),bx=o.x+c*3,by=o.y+s*3*0.85,tx=o.x+c*pr,ty=o.y+s*pr*0.85-pr*0.22*open,nx=-s*pr*0.22,ny=c*pr*0.22*0.85;
        arshPoly([[bx,by],[(bx+tx)/2+nx,(by+ty)/2+ny],[tx,ty],[(bx+tx)/2-nx,(by+ty)/2-ny]]);ctx.globalAlpha=leave;ctx.fillStyle='#E4FBFF';ctx.fill();ctx.strokeStyle='#4FB4F2';ctx.lineWidth=1.3;ctx.stroke();
        arshLine([[bx,by],[tx,ty]]);ctx.strokeStyle='#8FDCA0';ctx.lineWidth=0.9;ctx.globalAlpha=leave*0.8;ctx.stroke()}
      ctx.globalAlpha=leave;ctx.fillStyle='#FFD84D';ctx.beginPath();ctx.arc(o.x,o.y-pr*0.12,Math.max(1.5,pr*0.14),0,7);ctx.fill()}
    if(!arshLess()&&leave>0){ctx.beginPath();for(let i=0;i<B.motes;i++){const ph=((t*0.5+arshR(e.seed,i))%1),an=arshR(e.seed,i+20)*6.283,d=r*0.8*Math.sqrt(arshR(e.seed,i+21)),x=o.x+Math.cos(an)*d+Math.sin(t*2+i)*4,y=o.y+Math.sin(an)*d*0.85-ph*60-6;
        const z=2.2*(1-ph);ctx.moveTo(x,y-z*1.5);ctx.lineTo(x+z,y);ctx.lineTo(x,y+z*1.5);ctx.lineTo(x-z,y)}ctx.globalAlpha=0.85*leave;ctx.fillStyle='#FFF3A8';ctx.fill()}
    return true;
  },
  // קפיצה: שאריות תנועה (שלושה פסים מחודדים, צללים בדרך), קו ברצפה, וקוצים אחורה בנקודת היציאה
  dash(e,T){
    const D=ARSHC.dash,t=T-e.t0,k=t/D.dur;if(k>=1)return false;
    const dx=e.x1-e.x0,dy=e.y1-e.y0,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,nx=-uy,ny=ux,a=1-k,head=arshE(arshC(t/0.08)),tailK=arshC((t-0.04)/(D.dur-0.04));
    arshLine([[e.x0+dx*tailK,e.y0+dy*tailK+6],[e.x0+dx*head,e.y0+dy*head+6]]);ctx.lineCap='round';arshShadeStroke(2.4,'#F5E8C8',0.7*a);ctx.lineCap='butt';   // קו ברצפה
    for(let i=0;i<D.bars;i++){const o=(i-1)*7,xa=e.x0+dx*tailK+nx*o,ya=e.y0+dy*tailK+ny*o-12,xb=e.x0+dx*head+nx*o,yb=e.y0+dy*head+ny*o-12;arshStreak(xa,ya,xb,yb,i===1?9:5,'#F5E8C8',a*(i===1?0.95:0.7),'#fff')}
    if(!arshLess())for(let i=1;i<=D.ghosts;i++){const f=i/(D.ghosts+1),gx=e.x0+dx*f,gy=e.y0+dy*f,ga=a*(0.4-0.09*i)*arshC((t-f*0.06)/0.04);if(ga<=0.01)continue;
      ctx.globalAlpha=ga;ctx.fillStyle='#F5E8C8';ctx.beginPath();ctx.ellipse(gx,gy-10,7,12,0,0,7);ctx.fill();ctx.beginPath();ctx.arc(gx,gy-26,5,0,7);ctx.fill()}   // צללית רפאים: גוף וראש
    if(t<0.14){const q=t/0.14;arshStar(e.x0,e.y0-6,30*(1-q*0.4),5,e.seed,'#F5E8C8',1-q,Math.atan2(-dy,-dx),1.6)}   // קוצים אחורה
    return true;
  },
  // ריפוי: עמוד אור חם יורד על הגיבור (קצוות חדים), ואבקות עולות
  heal(e,T){
    const H=ARSHC.heal,t=T-e.t0,k=t/H.dur;if(k>=1)return false;
    const x=P.x,y=P.y,down=arshE(arshC(t/0.14)),a=arshC((H.dur-t)/(H.dur*0.55)),h=H.h*down,w=15*(1-0.25*k);
    arshPoly([[x-w*0.5,y-h],[x+w*0.5,y-h],[x+w,y+2],[x-w,y+2]]);ctx.globalAlpha=0.35*a;ctx.fillStyle='#FFE9A8';ctx.fill();
    arshPoly([[x-w*0.18,y-h],[x+w*0.18,y-h],[x+w*0.4,y+2],[x-w*0.4,y+2]]);ctx.globalAlpha=0.95*a;ctx.fillStyle='#FFFBEA';ctx.fill();
    arshLine([[x-w*0.5,y-h],[x-w,y+2]]);ctx.strokeStyle='#FFD84D';ctx.lineWidth=1.3;ctx.globalAlpha=a;ctx.stroke();arshLine([[x+w*0.5,y-h],[x+w,y+2]]);ctx.stroke();
    if(t<0.18){const q=t/0.18;arshStar(x,y+2,26*(1-q*0.4),7,e.seed,'#FFFBEA',1-q,undefined)}
    ctx.beginPath();for(let i=0;i<H.motes;i++){const ph=((t*1.3+arshR(e.seed,i))%1),mx=x+(arshR(e.seed,i+20)-0.5)*44,my=y-ph*(60+30*arshR(e.seed,i+21))-2,z=2.6*(1-ph);ctx.moveTo(mx,my-z*1.6);ctx.lineTo(mx+z,my);ctx.lineTo(mx,my+z*1.6);ctx.lineTo(mx-z,my)}
    ctx.globalAlpha=0.95*a;ctx.fillStyle=arshR(e.seed,3)<0.5?'#FFD84D':'#B8F2A8';ctx.fill();
    return true;
  },
  // מכה: עמוד אחד ישר ומרוכז על המטרה, קוצים ועמוד אור שנמוג
  smite(e,T){
    const M=ARSHC.smite,t=T-e.t0,k=t/M.dur;if(k>=1)return false;
    const fr=Math.floor(t/0.05),sd=e.seed+fr*3.7,a=1-k*k,thick=t<0.1?6.5:3;
    arshBoltDraw(arshBolt(e.bx+5,e.by-M.sky,e.bx,e.by,sd,M.seg,M.jit),'#FFD84D',a,thick);
    ctx.beginPath();ctx.moveTo(e.bx-9,e.by-M.sky*0.7);ctx.lineTo(e.bx+9,e.by-M.sky*0.7);ctx.lineTo(e.bx+16,e.by);ctx.lineTo(e.bx-16,e.by);ctx.closePath();ctx.globalAlpha=0.22*(1-k);ctx.fillStyle='#FFE9A8';ctx.fill();
    if(t<0.2){const q=t/0.2;arshStar(e.bx,e.by,M.star*(q<0.3?q/0.3:1-(q-0.3)/0.7*0.7),9,e.seed,'#FFE9A8',1-q*q,Math.PI/2,0.6)}
    return true;
  },
  // אולטימייט: בדו-ממד, פנסים בקנבס שעפים החוצה עם שובל. בתלת-ממד, הפנסים של ult-lantern3d.js, וכאן רק פיצוץ קטן בסוף כל פנס
  ult(e,T){
    const U=ARSHC.ult,t=T-e.t0,k=t/(e.dur+U.starT);if(k>=1)return false;
    for(let i=0;i<e.n;i++){
      const a=e.angs[i],sp=e.sps[i],q=arshC(t*sp/e.dur),ee=arshE(q),d=U.start+(e.R*0.92-U.start)*ee,x=e.x+Math.cos(a)*d,y=e.y+Math.sin(a)*d*0.85;
      if(!e.d3&&q<1){const h=U.lift[0]+(U.lift[1]-U.lift[0])*Math.sin(Math.PI*q),d0=U.start+(e.R*0.92-U.start)*arshE(Math.max(0,q-0.14)),x0=e.x+Math.cos(a)*d0,y0=e.y+Math.sin(a)*d0*0.85;
        arshStreak(x0,y0-h*0.7,x,y-h*0.7,8,e.col,0.8*(q>0.8?(1-q)/0.2:1),'#fff');
        arshLantern(x,y-h*0.7-6,e.col,q>0.8?(1-q)/0.2:1,1.25+0.35*(t<0.12?Math.sin(t/0.12*Math.PI):0),0.9+0.15*Math.sin(t*30+i))}
      const tq=t-e.dur/sp;if(tq>=0&&tq<U.starT){const z=tq/U.starT;arshStar(e.x+Math.cos(a)*e.R*0.92,e.y+Math.sin(a)*e.R*0.92*0.85,U.star*(1-z*0.5),6,e.seed+i,e.col,1-z,a,1)}   // ההיצה בסוף: כוכב אחד קטן, בכיוון הפנס
    }
    return true;
  }
};

/* ---- מחזור: צייר הכל, ושחרר מה שנגמר ---- */
function arshSound(e,T){
  const s=e.snd;if(!s||e.sndDone||T-e.t0<s.t)return;e.sndDone=true;
  if(typeof sfx==='function'&&typeof SOUNDS!=='undefined'&&SOUNDS[s.id])sfx(s.id,s.k||1);   // צלילים קיימים בלבד (CC0 של ARI). אין צליל רשיון
}
function arshDrawAll(){
  const T=S.t;let n=0;ctx.save();ctx.lineJoin='round';
  const keep=[];
  for(const e of ARSH.list){const f=ARSHD[e.kind];ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    const alive=f?f(e,T):false;if(alive){arshSound(e,T);keep.push(e);n++}}
  ARSH.list=keep;ctx.restore();ctx.globalAlpha=1;
  ARSH.stat.drawn++;ARSH.stat.peak=Math.max(ARSH.stat.peak,n);
}

/* ---- אימוץ: כל רשומה ש-skills.js, skills-more.js ו-ult.js יוצרים הופכת לאפקט חד, ולא מצוירת בציור הישן ---- */
function arshAdopt(){
  const k=S.sk,m=S.skm;if(!k)return;
  if(S.t!==ARSH.zt){ARSH.zt=S.t;ARSH.zi=0}
  for(const f of k.fx){
    if(f.shp)continue;f.shp=1;
    if(f.ring){
      const id=f.sk,D=id&&skDef(id);
      if(id==='quake')arshSpawn('quake',{x:f.x,y:f.y,R:f.r,snd:ARSHC.quake.snd,dur:ARSHC.quake.dur});
      else if(id==='frost')arshSpawn('frost',{x:f.x,y:f.y,R:f.r,snd:ARSHC.frost.snd});
      else if(id==='flame')arshSpawn('flame',{x:f.x,y:f.y,R:f.r});
      else if(id==='splash')arshSpawn('splash',{x:f.x,y:f.y,R:f.r});
      else if(typeof ULT!=='undefined'&&f.r===ULT.r)arshUlt(f);
      else f.shpHide=0;   // טבעת לא מוכרת: נשארת בציור הישן
      if(id==='quake'||id==='frost'||id==='flame'||id==='splash'||(typeof ULT!=='undefined'&&f.r===ULT.r))f.shpHide=1;
    }else if(f.line){
      if(f.smite){arshSpawn('smite',{bx:f.bx,by:f.by});f.shpHide=1}
      else if(f.sk==='zap'||!f.sk){   // שרשרת הברק, וקשתות החשמול של הקומבו
        const first=f.sk==='zap'&&f.hand;
        if(first)arshSpawn('bolt',{sky:true,bx:f.bx,by:f.by,col:f.col,delay:0});
        else arshSpawn('bolt',{sky:false,ax:f.ax,ay:f.ay,bx:f.bx,by:f.by,col:f.col,delay:f.sk==='zap'?ARSHC.zap.gap*(ARSH.zi++):0});
        ARSH.stat.arcs++;f.shpHide=1}
    }
  }
  if(m){
    for(const f of m.fx){if(f.shp)continue;f.shp=1;
      if(f.k==='beam'){arshSpawn('lance',{ax:f.ax,ay:f.ay,bx:f.bx,by:f.by});f.shpHide=1}
      else if(f.k==='boom')f.shpHide=1;}   // הנחיתה מצוירת ב-skAnimLand
    for(const p of m.pend){if(p.shp)continue;p.shp=1;arshSpawn('cometFall',{p,R:SKMORE.list.comet.r,x:p.x,y:p.y})}
    for(const o of m.pools){if(o.shp)continue;o.shp=1;arshSpawn('bloom',{o})}
  }
}
function arshUlt(f){
  const d3=typeof ultl3dOn==='function'&&ultl3dOn()&&typeof ULTLS!=='undefined'&&ULTLS.on;
  const U=ARSHC.ult,n0=typeof ULTL!=='undefined'?ULTL.n:U.n2d,n=arshLess()?Math.min(4,n0):n0,angs=[],sps=[];
  // בתלת-ממד: הזוויות והמהירויות של הפנסים האמיתיים (ult-lantern3d.js כבר מילא אותן ב-ultUse)
  if(d3&&ULTLS.orbs.length){for(let i=0;i<ULTLS.n;i++){angs.push(ULTLS.orbs[i].a);sps.push(ULTLS.orbs[i].sp)}}
  else for(let i=0;i<n;i++){angs.push(arshR(arshSeed+1,i)*6.283+i/n*6.283);sps.push(0.95+0.1*arshR(arshSeed+2,i))}
  arshSpawn('ult',{x:f.x,y:f.y,R:f.r,n:angs.length,angs,sps,dur:d3?ULTL.dur:U.dur*(typeof themeK==='function'?themeK():1),col:f.col,d3});
}
// הרשומות הישנות מוסתרות בזמן הציור הישן: מחליפים את הרשימות, מציירים, ומחזירים
function arshHidden(){
  const k=S.sk,m=S.skm,hid={k:k.fx,m:m&&{fx:m.fx,pend:m.pend,pools:m.pools}};
  k.fx=k.fx.filter(f=>!f.shpHide);
  if(m){m.fx=m.fx.filter(f=>!f.shpHide);m.pend=[];m.pools=[]}
  return hid;
}
function arshRestore(h){S.sk.fx=h.k;if(h.m){S.skm.fx=h.m.fx;S.skm.pend=h.m.pend;S.skm.pools=h.m.pools}}
{const old=drawSkills;drawSkills=function(ox,oy){
  if(!arshOn()||!S.sk){return old.apply(this,arguments)}
  arshAdopt();
  const h=arshHidden();let r;try{r=old.apply(this,arguments)}finally{arshRestore(h)}
  arshDrawAll();return r}}

/* ---- חיבורים ---- */
// השביט נחת (skill-anim.js קורא מ-arena-fx.js): נחיתה חדה במקום הגיליון. הנזק כבר נחת ב-skillsUpdate
{const old=skAnimLand;skAnimLand=function(p){
  if(!arshOn())return old.apply(this,arguments);
  const R=SKMORE.list.comet.r;SKANIMS.n=0;SKANIMS.stat.cast.cometLand=(SKANIMS.stat.cast.cometLand||0)+1;
  for(const e of ARSH.list)if(e.kind==='cometFall'&&e.p===p)e.landed=1;
  arshSpawn('cometHit',{x:p.x,y:p.y,R,snd:Object.assign({t:0},ARSHC.comet.snd)});
  return true}}
// הטלה: בלי מעגל הקסם ובלי הגיליון הראשי של הסקילים שכאן. פגיעות ומצבים (skAnimHit) נשארים
{const old=skAnimCast;skAnimCast=function(id){
  if(!arshOn()||!skAnimOn()||!['quake','splash','frost','flame','zap','comet','lance','bloom'].includes(id))return old.apply(this,arguments);
  SKANIMS.n=0;SKANIMS.stat.cast[id]=(SKANIMS.stat.cast[id]||0)+1;return true}}
// ברק: הברק של skAnimHit (חוליה והבזק ראשון) כבוי. השרשרת מצוירת לפי הקווים של הסקיל
{const old=skAnimHit;skAnimHit=function(e,d,t){
  if(arshOn()&&t==='lightning'&&typeof SKANIMS!=='undefined'){skaFrame();if(!SKANIMS.zapFrom)SKANIMS.zapFrom=[e.x,e.y-e.r*0.6]}
  return old.apply(this,arguments)}}
// קפיצה, ריפוי ומכה: נולדים ב-spellUse. המכה כבר דוחפת קו ל-S.sk.fx ואנחנו מסמנים אותו
{const old=spellUse;spellUse=function(){
  const id=spellState().id,x0=P.x,y0=P.y,n0=S.sk?S.sk.fx.length:0,r=old.apply(this,arguments);
  if(!r||!arshOn())return r;
  if(id==='dash')arshSpawn('dash',{x0,y0,x1:P.x,y1:P.y});
  else if(id==='heal')arshSpawn('heal',{});
  else if(id==='smite'&&S.sk){const f=S.sk.fx[S.sk.fx.length-1];if(f&&S.sk.fx.length>n0&&f.line)f.smite=1}
  return r}}
// בלי רעידת מסך מהסקילים: מחזירים את הערך שהיה לפני הלחיצה
{const old=skillUse;skillUse=function(id){const s0=S.shake,r=old.apply(this,arguments);if(r&&ARSHC.noShake&&arshOn()&&S.shake<=ARSHC.shakeCap)S.shake=s0;return r}}
{const old=ultUse;ultUse=function(){const s0=S.shake,r=old.apply(this,arguments);if(r&&ARSHC.noShake&&arshOn())S.shake=s0;return r}}
{const old=skillsUpdate;skillsUpdate=function(dt){const m=S.skm,n0=m?m.pend.length:0,s0=S.shake;const r=old.apply(this,arguments);
  if(ARSHC.noShake&&arshOn()&&S.skm&&n0>S.skm.pend.length&&S.shake<=ARSHC.shakeCap+2)S.shake=s0;   // שביט נחת: בלי הרעידה
  return r}}
{const old=skillsReset;skillsReset=function(){ARSH.list.length=0;ARSH.zt=-1;return old.apply(this,arguments)}}
