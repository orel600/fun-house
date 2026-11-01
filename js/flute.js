/* החליל (הרעיון של אוראל, 31.10.2026): ערכת מראה לדמות האישית של אוראל, "הנודד עם החליל" (theme:'flute' ב-HEROES.skins).
   רק מראה: הנזק, הטווח והסקילים לא משתנים, והצבע תמיד של סוג הנזק, כמו בכל המשחק.
   ביד: חליל במקום הנשק (fluteGrip, נקרא מ-heroLook ב-render3d.js). חצים: חלילים קטנים שעפים. קסם: תווים. מכת חרב: חמשה עם תווים.
   סקילים: טבעת של חלילים מסתובבים ותווים, וברק כחמשה שהתווים קופצים עליה. נקודות החיבור: render.js ו-drawSkills ב-skills.js */
/* ערכות מראה למתקפות של דמות אישית: theme ב-HEROES.skins בוחר שורה ב-THEMES. כל ערכה: shot, swing, ring, line, grip (לא חובה) ו-slow.
   render.js, skills.js ו-render3d.js מציירים דרך heroTheme(), אז ערכה חדשה (הניצוץ של ניר, spark.js) לא צריכה חיבורים משלה */
const THEMES={};
const heroTheme=()=>{const sk=heroSkin();return sk&&THEMES[HEROES.skins[sk].theme]||null};
const themeK=()=>{const t=heroTheme();return t&&t.slow||1};   // skills.js: כמה זמן אפקט של סקיל נשאר על המסך
const FLUTE={
  notes:['♪','♫','♬','♩'],
  wood:'#B98552',dark:'#4A2E1A',   // החליל: עץ, וחורים כהים
  shot:{len:26,note:20,trail:3},   // חץ: אורך החליל העף. קסם: גודל התו, וכמה תווים קטנים בשובל
  swing:{lines:5,gap:3.5,notes:3}, // מכת חרב: קווי החמשה, המרווח ביניהם, וכמה תווים רצים לאורכה
  ring:{n:8,spin:2.5,len:22},      // טבעת סקיל: כמה חלילים, כמה סיבובים עד שהיא נעלמת, ואורך כל חליל
  line:{gap:3,notes:4},            // ברק: מרווח קווי החמשה, וכמה תווים קופצים עליה
  prop:{len:0.5,r:0.05,holes:5},  // החליל ביד בתלת-ממד: אורך ביחס לחרב של KayKit, עובי ומספר חורים
  slow:2                           // אפקט של סקיל נשאר על המסך פי כמה, כדי שיספיקו לראות את התווים
};
const fluteOn=()=>{const sk=heroSkin();return !!sk&&HEROES.skins[sk].theme==='flute'};
const fluteK=()=>fluteOn()?FLUTE.slow:1;   // skills.js: כמה זמן אפקט של סקיל נשאר על המסך

/* ---- ציור בקנבס ---- */
// חליל: צינור עץ עם פיה כהה וחורים, ומסביבו זוהר בצבע סוג הנזק
function fluteDraw(x,y,a,len,col){
  const w=Math.max(3,len*0.17);
  ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.lineCap='round';
  const al=ctx.globalAlpha;
  if(col){ctx.globalAlpha=al*0.45;ctx.strokeStyle=col;ctx.lineWidth=w+6;ctx.beginPath();ctx.moveTo(-len/2,0);ctx.lineTo(len/2,0);ctx.stroke();ctx.globalAlpha=al}
  ctx.strokeStyle=FLUTE.wood;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(-len/2,0);ctx.lineTo(len/2,0);ctx.stroke();
  ctx.strokeStyle=FLUTE.dark;ctx.beginPath();ctx.moveTo(len/2-w*0.6,0);ctx.lineTo(len/2,0);ctx.stroke();
  ctx.fillStyle=FLUTE.dark;for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(-len*0.3+i*len*0.16,0,w*0.22,0,7);ctx.fill()}
  ctx.restore();
}
// תו: צבע סוג הנזק עם קו כהה, כדי שייראה על כל רקע
function fluteNote(x,y,size,col,i){
  ctx.font='bold '+Math.round(size)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  const n=FLUTE.notes[((i|0)%4+4)%4];
  ctx.lineWidth=3;ctx.strokeStyle='rgba(20,14,10,0.75)';ctx.strokeText(n,x,y);ctx.fillStyle=col;ctx.fillText(n,x,y);
}
// יריות השחקן: קסם הוא תו שמתנדנד עם שובל של תווים קטנים, וחץ הוא חליל שעף
function fluteShot(b,col){
  const S_=FLUTE.shot,a=Math.atan2(b.vy,b.vx),i=b.fn??(b.fn=Math.floor(Math.random()*4));
  if(b.shot==='bolt'){
    for(let j=S_.trail;j>0;j--){ctx.globalAlpha=0.5-j*0.12;fluteNote(b.x-b.vx*0.03*j,b.y-b.vy*0.03*j+Math.sin(S.t*12+j)*3,S_.note*(1-j*0.18),col,i+j)}
    ctx.globalAlpha=1;fluteNote(b.x,b.y+(RM?0:Math.sin(S.t*14+i)*2),S_.note,col,i);return;
  }
  ctx.globalAlpha=0.6;fluteNote(b.x-Math.cos(a)*S_.len*0.8,b.y-Math.sin(a)*S_.len*0.8,S_.note*0.6,col,i);ctx.globalAlpha=1;
  fluteDraw(b.x-Math.cos(a)*S_.len*0.3,b.y-Math.sin(a)*S_.len*0.3,a,S_.len,col);
}
// מכת חרב: חמשה (חמישה קווים) לאורך הקשת, ותווים בקצה שלה. k: 1 בתחילת המכה, 0 בסוף
function fluteSwing(s,k,col){
  const W=FLUTE.swing,start=s.ang-s.arc/2,end=start+s.arc*(1-k),R=s.range*0.72;
  ctx.globalAlpha=0.55*k+0.2;ctx.strokeStyle=col;ctx.lineWidth=1.6;
  for(let j=0;j<W.lines;j++){ctx.beginPath();ctx.arc(P.x,P.y-8,R+(j-2)*W.gap,start,end);ctx.stroke()}
  for(let j=0;j<W.notes;j++){const t=end-j*0.22;if(t<start)break;
    fluteNote(P.x+Math.cos(t)*R,P.y-8+Math.sin(t)*R,18-j*3,col,j)}
  ctx.globalAlpha=1;
}
// סקיל טבעת: חלילים שמסתובבים החוצה, ותו בין כל שניים
function fluteRing(f,k){
  const R=FLUTE.ring,r=f.r*(0.35+0.65*k),rot=(RM?0:k*R.spin*Math.PI*2/R.n);
  ctx.globalAlpha=1-k;ctx.strokeStyle=f.col;ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y,r,0,7);ctx.stroke();
  for(let i=0;i<R.n;i++){const a=i*Math.PI*2/R.n+rot;
    fluteDraw(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r,a+Math.PI/2,R.len,f.col);
    const b=a+Math.PI/R.n;fluteNote(f.x+Math.cos(b)*r,f.y+Math.sin(b)*r-6*k,16,f.col,i)}
  ctx.globalAlpha=1;
}
// ברק: חמשה מהשחקן לאויב, ותווים שקופצים לאורכה
function fluteLine(f,k){
  const L=FLUTE.line,dx=f.bx-f.ax,dy=f.by-f.ay,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;
  ctx.globalAlpha=1-k;ctx.strokeStyle=f.col;ctx.lineWidth=1.4;
  for(let j=-2;j<=2;j++){ctx.beginPath();ctx.moveTo(f.ax+nx*j*L.gap,f.ay+ny*j*L.gap);ctx.lineTo(f.bx+nx*j*L.gap,f.by+ny*j*L.gap);ctx.stroke()}
  for(let i=0;i<L.notes;i++){const p=(i+0.5)/L.notes,h=Math.abs(Math.sin((p+k)*Math.PI*2))*10;
    fluteNote(f.ax+dx*p+nx*h,f.ay+dy*p+ny*h,16,f.col,i)}
  ctx.globalAlpha=1;
}

/* ---- תלת-ממד: החליל ביד. נבנה פעם אחת מגלילים, בגודל של החרב של KayKit, ונרשם ב-R3D.props כמו כל נשק ---- */
function fluteProp(){
  if(R3D.props.flute)return 'flute';
  const P_=FLUTE.prop,ref=R3D.props[GRIP3D.spare.sword],bb=new THREE.Box3().setFromObject(ref),len=(bb.max.y-bb.min.y)*P_.len,r=P_.r;
  const g=new THREE.Group(),wood=new THREE.MeshLambertMaterial({color:FLUTE.wood}),dark=new THREE.MeshLambertMaterial({color:FLUTE.dark});
  const body=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,10),wood);body.position.y=bb.min.y+len/2;g.add(body);
  const tip=new THREE.Mesh(new THREE.CylinderGeometry(r*1.15,r*1.15,len*0.1,10),dark);tip.position.y=bb.min.y+len*0.95;g.add(tip);
  for(let i=0;i<P_.holes;i++){const h=new THREE.Mesh(new THREE.SphereGeometry(r*0.4,6,4),dark);h.position.set(0,bb.min.y+len*(0.3+i*0.11),r*0.85);g.add(h)}
  return R3D.props.flute=g,'flute';
}
// בשני הצדדים (sword ו-gun) החליל ביד ימין. מרחוק תוקפים כמו בקסם, כי חליל לא נמתח כמו קשת
function fluteGrip(L){
  L.props.sword=Object.assign({},L.props.sword,{prop:fluteProp(),tier:null});
  L.props.gun=Object.assign({prop:'flute'},GRIP3D.magic);
  L.anim.gun=GRIP3D.magic.attack;delete L.anim.gunIdle;delete L.anim.gunDraw;
}

THEMES.flute={shot:fluteShot,swing:fluteSwing,ring:fluteRing,line:fluteLine,grip:fluteGrip,slow:FLUTE.slow};
