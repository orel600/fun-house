/* פיילוט אפקטים (מחקר, docs/plan-fx.md). לא חלק מהמשחק ולא נטען ב-index.html: tools/fxlab/shoot.js מזריק אותו לצילומים.
   בכתובת: ?fx=wisps:a | wisps:b | wisps:c   (אורות מרחפים, שלושה סגנונות)
           ?fx=...,drops:1 | drops:2          (שלל על הרצפה, שני כיוונים)
           ?fx=...,msg:1 | msg:2              (הודעות צפות, שני כיוונים)
   הכל עוטף פונקציות קיימות מבחוץ (drawOrbits, drawDrops, banner, floatText, render3d), אז כדי לחבר למשחק מספיקה שורה אחת ב-index.html.
   a: "גחלילית" בקנבס: ליבה לבנה, הילה בצבע הסוג (ספרייט מוכן מראש, drawImage עם 'lighter'), שובל קצר, תנועה אורגנית.
   b: "נחיל": 3 נקודות אור קטנות לכל סוג, מהבהבות כמו גחליליות. בקנבס.
   c: תלת-ממד: THREE.Sprite עם AdditiveBlending בתוך הסצנה, אז האור עובר מאחורי הדמות ולפניה. השובל והחלקיקים בקנבס כמו a */
(()=>{
const Q=(location.search.match(/[?&]fx=([\w:,]+)/)||[])[1];if(!Q)return;
const opt={};for(const p of Q.split(',')){const [k,v]=p.split(':');opt[k]=v||'1'}
window.FXLAB={opt,stats:{draw:0,n:0}};const WL={list:[],parts:[]};FXLAB.W=WL;

let TT=0;const LAB={
  // צבע הליבה (כמעט לבן) וההילה לכל סוג. אש ממשיכה את C.ember, קרח את C.tide (סוגי הנזק, dmg.js)
  col:{attack:['#FFF4D6','#FF7A2E'],control:['#F2FDFF','#5FD2FF'],defense:['#FFFBEF','#E8D9B0'],support:['#F2FFE8','#5BD46B'],luck:['#FFFDE6','#FFD23F']},
  r:58, rVar:0.16, h2d:26, h3d:34,   // רדיוס, כמה הוא נושם, גובה מעל הקרקע
  core:4.6, halo:24, trail:9,         // גודל ליבה, הילה, ואורך השובל (נקודות)
  lag:7                               // כמה מהר האור משיג את הדמות כשהיא זזה (קפיץ). קטן = נגרר יותר
};
// ספרייט זוהר מוכן מראש לכל צבע: מעגל רך מלבן במרכז לצבע ושקוף בקצה. drawImage של תמונה מוכנה זול בהרבה מגרדיאנט בכל פריים
const SPR={};
function glow(col,hot){const k=col+(hot||'');if(SPR[k])return SPR[k];
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
  if(hot){gr.addColorStop(0,'#fff');gr.addColorStop(0.18,hot);gr.addColorStop(0.45,col+'88');}else{gr.addColorStop(0,col+'cc');gr.addColorStop(0.4,col+'44')}
  gr.addColorStop(1,col+'00');g.fillStyle=gr;g.fillRect(0,0,64,64);return SPR[k]=c}
const blit=(img,x,y,s,a)=>{ctx.globalAlpha=a;ctx.drawImage(img,x-s,y-s,s*2,s*2)};

/* ---- תנועה: כל אור במסלול משלו (ליסאז'ו: רדיוס שנושם, מהירות שונה, גובה שעולה ויורד), וקפיץ שמושך אותו אחרי הדמות ---- */

function wispsUpdate(dt){
  const o=S.orb,types=(o&&skHere()&&o.types)||[];
  while(WL.list.length<types.length)WL.list.push({x:P.x,y:P.y,h:LAB.h2d,tr:[],ph:Math.random()*6.28,sp:0.8+Math.random()*0.5,last:0});
  WL.list.length=types.length;
  const n=types.length,t=TT;
  types.forEach((ty,i)=>{const w=WL.list[i];w.ty=ty;
    const a=(TT*1.3)+i*6.283/n+0.35*Math.sin(t*0.7*w.sp+w.ph),R=LAB.r*(1+LAB.rVar*Math.sin(t*1.3*w.sp+w.ph*2));
    const tx=P.x+Math.cos(a)*R,ty_=P.y+Math.sin(a)*R*0.85,k=1-Math.exp(-LAB.lag*dt);
    w.x+=(tx-w.x)*k;w.y+=(ty_-w.y)*k;w.h=LAB.h2d+6*Math.sin(t*2.1*w.sp+w.ph)+3*Math.sin(t*5.3+w.ph);
    w.tr.unshift({x:w.x,y:w.y-w.h});if(w.tr.length>LAB.trail)w.tr.pop();
    // חלקיקים שמספרים מה הוא עושה, בלי אייקון: אש גחלים עולות, קרח פתיתים נופלים, עלה ניצוצות ירוקים עולים לאט, מזל נצנוץ כוכב
    const rate={attack:22,control:9,support:6,luck:3,defense:0}[ty];
    w.last+=dt*rate;while(w.last>=1){w.last--;WL.parts.push(part(ty,w))}
  });
  for(const p of WL.parts){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.97}
  WL.parts=WL.parts.filter(p=>p.t<p.life).slice(-160);
}
function part(ty,w){const x=w.x+(Math.random()-0.5)*6,y=w.y-w.h+(Math.random()-0.5)*6,c=LAB.col[ty][1];
  if(ty==='attack')return{x,y,vx:(Math.random()-0.5)*14,vy:-28-Math.random()*26,t:0,life:0.45+Math.random()*0.3,s:1.6,c,k:'ember'};
  if(ty==='control')return{x,y,vx:(Math.random()-0.5)*10,vy:14+Math.random()*10,t:0,life:0.7+Math.random()*0.4,s:1.3,c:'#DFF8FF',k:'flake'};
  if(ty==='support')return{x,y,vx:(Math.random()-0.5)*8,vy:-12-Math.random()*8,t:0,life:0.9,s:1.4,c,k:'mote'};
  return{x:x+(Math.random()-0.5)*14,y:y+(Math.random()-0.5)*14,vx:0,vy:0,t:0,life:0.5,s:4,c:'#FFF6C2',k:'star'}}

// מצב של כל אור: מוכן (בהיר) או בטעינה (עמום). מגן שבולע מכה, וריפוי שמהבהב כשהוא קורה
function bright(w,i){const o=S.orb;
  if(w.ty==='defense')return (o.sh[i]||0)>S.t?0.28:0.9+0.1*Math.sin(TT*3);
  if(w.ty==='support'){const left=(o.hl[i]||0)-S.t;return left<0.35&&left>0?1.6:0.85}
  if(w.ty==='attack')return 0.85+0.15*Math.sin(TT*23+w.ph)*Math.sin(TT*7.1);   // הבהוב של להבה
  return 0.9}

function drawWispsA(three){
  const o=S.orb;ctx.save();ctx.globalCompositeOperation='lighter';
  WL.list.forEach((w,i)=>{const [hot,col]=LAB.col[w.ty],b=bright(w,i),g=glow(col),gh=glow(col,hot);
    // צל רך על הרצפה: מחבר את האור לעולם
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=0.18*b;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(w.x,w.y,7,2.6,0,0,7);ctx.fill();
    // גוון רגיל (לא חיבור אור) מתחת: על דשא בהיר אור לבד נשטף, אז שכבה דקה בצבע הסוג נותנת לו צבע
    if(!three){ctx.globalAlpha=0.35*Math.min(1,b);ctx.drawImage(glow(col),w.tr[0].x-11,w.tr[0].y-11,22,22)}
    ctx.globalCompositeOperation='lighter';
    // אור על הקרקע בצבע הסוג
    blit(g,w.x,w.y,22,0.22*b);
    // שובל: נקודות שמתכווצות ונמוגות
    for(let k=1;k<w.tr.length;k++){const p=w.tr[k],f=1-k/w.tr.length;blit(g,p.x,p.y,LAB.halo*0.55*f+2,0.45*f*b)}
    if(three)return;   // c: הליבה וההילה בתלת-ממד
    blit(g,w.tr[0].x,w.tr[0].y,LAB.halo*(0.9+0.1*b),0.75*b);
    blit(gh,w.tr[0].x,w.tr[0].y,LAB.core*2.4,Math.min(1,b));
    if(w.ty==='defense'&&(o.sh[i]||0)<=S.t){ctx.globalAlpha=0.25+0.1*Math.sin(TT*3);ctx.strokeStyle=col;ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(P.x,P.y,22,9,0,0,7);ctx.stroke()}   // מגן מוכן: טבעת דקה ברגלי הדמות
  });
  drawParts();ctx.restore();
}
function drawParts(){for(const p of WL.parts){const f=1-p.t/p.life;
  if(p.k==='star'){ctx.globalAlpha=Math.sin(f*3.14);ctx.strokeStyle=p.c;ctx.lineWidth=1;const s=p.s*Math.sin(f*3.14);ctx.beginPath();ctx.moveTo(p.x-s,p.y);ctx.lineTo(p.x+s,p.y);ctx.moveTo(p.x,p.y-s);ctx.lineTo(p.x,p.y+s);ctx.stroke();continue}
  blit(glow(p.c),p.x,p.y,p.s*2.6*(p.k==='ember'?f:1),0.9*f)}}

// b: נחיל של שלוש נקודות קטנות לכל סוג, כל אחת מהבהבת בקצב משלה (גחליליות)
function drawWispsB(){ctx.save();ctx.globalCompositeOperation='lighter';
  WL.list.forEach((w,i)=>{const [hot,col]=LAB.col[w.ty],b=bright(w,i),g=glow(col),gh=glow(col,hot),c=w.tr[0];
    blit(g,w.x,w.y,16,0.14*b);
    for(let j=0;j<3;j++){const a=TT*(2.2+j*0.7)+j*2.1+w.ph,x=c.x+Math.cos(a)*(5+j*3),y=c.y+Math.sin(a*1.3)*(4+j*2),bl=Math.max(0,Math.sin(TT*(3+j)+w.ph*j))*0.7+0.3;
      blit(g,x,y,8,0.5*bl*b);blit(gh,x,y,2.6,bl*Math.min(1,b))}});
  drawParts();ctx.restore()}

/* ---- c: תלת-ממד. ספרייט לכל אור בתוך הסצנה, עם AdditiveBlending ו-depthWrite כבוי ---- */
const T3={sp:[]};
function sync3d(){if(!R3D.ready||!R3D.scene)return;
  while(T3.sp.length<WL.list.length){const m=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glow('#ffffff','#ffffff')),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true});
    const halo=new THREE.Sprite(m);const core=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glow('#ffffff','#ffffff')),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
    R3D.scene.add(halo);R3D.scene.add(core);T3.sp.push({halo,core})}
  const s=Math.sin(camTilt());
  T3.sp.forEach((o,i)=>{const w=WL.list[i];o.halo.visible=o.core.visible=!!w&&opt.wisps==='c'&&!!S.orb&&skHere();if(!o.halo.visible)return;
    const b=bright(w,i),[hot,col]=LAB.col[w.ty],y=LAB.h3d+(w.h-LAB.h2d);
    o.halo.position.set(w.x,y,w.y/s);o.core.position.set(w.x,y,w.y/s);
    o.halo.material.color.set(col);o.halo.material.opacity=0.8*b;o.halo.scale.setScalar(LAB.halo*2.2*(0.9+0.1*b));
    o.core.material.color.set(hot);o.core.material.opacity=Math.min(1,b);o.core.scale.setScalar(LAB.core*3)})}

/* ---- הרכבה: עוטפים מבחוץ ---- */
let lastT=0;
if(opt.wisps){
  const d0=window.drawOrbits;
  window.drawOrbits=function(){const s=performance.now(),dt=lastT?Math.min(0.05,(s-lastT)/1000):0;lastT=s;TT+=dt;
    if(!S.orb||!skHere()){WL.list.length=0;return}
    wispsUpdate(dt);
    if(opt.wisps==='b')drawWispsB();else drawWispsA(opt.wisps==='c'&&R3D.on);
    FXLAB.stats.draw+=performance.now()-s;FXLAB.stats.n++};
  if(opt.wisps==='c'){const r0=window.render3d;window.render3d=function(...a){sync3d();return r0.apply(this,a)}}
}

/* ---- שלל על הרצפה ----
   1: "נצנוץ": בלי טבעת ובלי מספר. אור רך על הקרקע בצבע הדרגה, אייקון קטן שמרחף, ונצנוץ כוכב שעובר מדי פעם. נדיר ומעלה: קרן אור דקה ב-'lighter'.
   2: "אבן חן": משאב רגיל הוא נקודת אור קטנה בצבע המשפחה (כמו יהלומי XP), ורק ציוד ונדיר מקבלים אייקון וקרן. הכמות לא מוצגת על הרצפה, רק בהודעת האיסוף */
if(opt.drops){
  window.drawDrops=function(){
    if(!S.gd||S.room)return;ctx.save();ctx.textAlign='center';ctx.direction='ltr';
    for(const d of S.gd){
      const tr=dropTier(d.r),col=tr?tr.col:'#F4C74F',rar=dropRar(d.r),y=d.y-d.z,bob=d.z>0?0:Math.sin(d.ph*2.4)*1.6,gear=dropGear(d.r);
      ctx.globalCompositeOperation='lighter';
      blit(glow(col),d.x,d.y,rar?18:11,(rar?0.45:0.25)*(0.8+0.2*Math.sin(d.ph*3)));   // אור על הקרקע
      if(rar>=2&&d.z===0){const h=40+rar*28,gr=ctx.createLinearGradient(0,d.y-h,0,d.y);gr.addColorStop(0,col+'00');gr.addColorStop(1,col+'aa');
        ctx.globalAlpha=0.55+0.15*Math.sin(d.ph*4);ctx.fillStyle=gr;ctx.fillRect(d.x-1.5,d.y-h,3,h);blit(glow(col),d.x,d.y-h*0.35,6,0.3)}
      if(opt.drops==='2'&&!gear&&rar<2){   // נקודת אור, בלי אייקון
        blit(glow(col,'#fff'),d.x,y-6+bob,5+Math.min(4,d.n*0.6),1);ctx.globalCompositeOperation='source-over';continue}
      // נצנוץ: כוכב ארבע קרניים שמופיע לרגע כל ~2 שניות
      const gl=(d.ph*0.5)%1;if(gl<0.12){const k=Math.sin(gl/0.12*3.14),s=7*k;ctx.globalAlpha=k;ctx.strokeStyle='#fff';ctx.lineWidth=1.2;
        ctx.beginPath();ctx.moveTo(d.x+6-s,y-14);ctx.lineTo(d.x+6+s,y-14);ctx.moveTo(d.x+6,y-14-s);ctx.lineTo(d.x+6,y-14+s);ctx.stroke()}
      ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
      ctx.font=(gear?15:13)+'px system-ui, sans-serif';ctx.fillText(dropIcon(d.r)||'?',d.x,y-4+bob);
    }
    ctx.restore()}
}

/* ---- הודעות ----
   1: "פיד איסוף" בצד המסך (כמו Diablo ו-Fortnite): שורות קטנות שמצטברות, אותו משאב מתאחד (+3 ← +5), ונעלמות אחרי 2.5 שניות. לא על הדמות.
   2: "תווית קטנה במקום": טקסט 11px שעולה מהמקום שבו נאסף, לא מעל הראש, ונעלם תוך 0.7 שניות. ציוד: שם קצר בצבע הדרגה */
if(opt.msg){
  const feed=[];window.FXLAB.feed=feed;
  const push=(icon,txt,col,key,n)=>{const f=key&&feed.find(f=>f.key===key);if(f){f.n+=n;f.t=0;f.txt='+'+f.n;return}feed.unshift({icon,txt,col,key,n,t:0});feed.length=Math.min(feed.length,5)};
  const ft0=window.floatText;
  window.floatText=function(x,y,txt,col,size,ltr,crit){
    // רק הודעות איסוף (מ-dropTake) עוברות לפיד. מספרי נזק נשארים כמו שהם
    const m=/^\+(\d+) (.+)$/.exec(txt);
    if(Math.abs(y-(P.y-40))<1&&Math.abs(x-P.x)<1&&(m||/ /.test(txt))){
      if(opt.msg==='1'){if(m)push(m[2],'+'+m[1],col,m[2],+m[1]);else push(txt.split(' ')[0],txt.split(' ').slice(1).join(' '),col)}
      else lbl.push({x:P.x+30,y:P.y-4,txt:m?'+'+m[1]+' '+m[2]:txt,col,t:0});
      return}
    return ft0.apply(this,arguments)};
  const lbl=[];
  const b0=window.banner;window.banner=function(txt,col){if(/^(ציוד!|Gear!)/.test(txt))return;return b0.apply(this,arguments)};   // "ציוד! חרב עץ" כבר מופיע בפיד
  const fx0=window.drawFx;
  window.drawFx=function(){fx0();const dt=1/60;
    if(opt.msg==='2'){ctx.save();ctx.textAlign='center';ctx.direction=DIR;ctx.font='700 '+Math.round(11/ZOOM)+'px Heebo, system-ui, sans-serif';
      for(const l of lbl){l.t+=dt;const a=Math.min(1,(0.7-l.t)*4);ctx.globalAlpha=Math.max(0,a);ctx.fillStyle='#000a';ctx.fillText(l.txt,l.x+1,l.y-l.t*24+1);ctx.fillStyle=l.col;ctx.fillText(l.txt,l.x,l.y-l.t*24)}
      for(let i=lbl.length-1;i>=0;i--)if(lbl[i].t>0.7)lbl.splice(i,1);ctx.restore();return}
    // פיד: במסך, בצד ההתחלה, מעל הג'ויסטיק
    ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.direction=DIR;ctx.font='700 12px Heebo, system-ui, sans-serif';   // בפיקסלים של המסך, לא ביחידות המשחק
    const rtl=DIR==='rtl',x0=rtl?innerWidth-14:14,H=innerHeight;
    feed.forEach((f,i)=>{f.t+=dt;const a=Math.min(1,(2.5-f.t)*3,f.t*8),y=H*0.42+i*22-Math.min(1,f.t*8)*4;if(a<=0)return;
      ctx.globalAlpha=a*0.55;ctx.fillStyle='#05070D';const w=ctx.measureText(f.txt).width+40;ctx.fillRect(rtl?x0-w:x0,y-14,w,19);
      ctx.globalAlpha=a;ctx.fillStyle=f.col||C.gold;ctx.fillRect(rtl?x0-2:x0,y-14,2,19);
      ctx.textAlign='start';ctx.font='13px system-ui';ctx.fillText(f.icon,rtl?x0-8:x0+8,y);ctx.font='700 12px Heebo, system-ui, sans-serif';ctx.fillStyle='#ECE7DC';ctx.direction=/^\+\d/.test(f.txt)?'ltr':DIR;ctx.textAlign=rtl?'right':'left';ctx.fillText(f.txt,rtl?x0-28:x0+28,y);ctx.direction=DIR});
    for(let i=feed.length-1;i>=0;i--)if(feed[i].t>2.5)feed.splice(i,1);
    ctx.restore()};
}
})();
