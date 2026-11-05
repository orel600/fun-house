/* מנוע המפה: צורה לאזור בעולם הפתוח (docs/plan-world-terrain.md שלבים 3-4, והשרטוט ב-docs/concept-meadow.md).
   ניר, 5.11.2026: "טופוגרפיה: גבעות, נחלים, יערות... ולא סתם אזור בצורת ריבוע".
   אזור עם map (ב-WORLD או ב-WORLD.regions, world.js) מקבל: קו גבול כפוליגון, נהרות כקווים עם רוחב, מים עמוקים ורדודים, יער סבוך,
   שבילים וקרחות שחותכים בו, גשרים ומעברים רדודים בנהר, ורכס שעולים עליו רק ממקום אחד. אזור בלי map נשאר מלבן, כמו קודם.
   איך: בכניסה לאזור המפה "מצוירת" פעם אחת לרשת של משבצות (cell). מאז כל שאלה היא קריאה ממערך:
     tBlocked(x,y)  חסום? (מים, יער, צוק, מחוץ לגבול)
     tSlow(x,y)     פי כמה מהירות (מעבר רדוד, שולי ביצה)
     tFree(o)       מזיז לנקודה הפנויה הקרובה (שמירה ישנה, אויב שנולד בנהר, שלל)
     tStep(o)       אחרי שמשהו זז: מאט, ואם נכנס למקום חסום מחליק לאורך הקצה במקום לעבור
     tDir(o,x,y)    לאן ללכת כדי להגיע ל-(x,y) בלי להיתקע מול הנהר (חיפוש דרך A* על רשת nav, או מפת מרחקים אל השחקן)
     hAt(x,y)       גובה הציור (הרכס). לוגיקה תמיד דו-ממדית: הגובה רק מזיז את הציור למעלה, בתלת-ממד ובקנבס
   החיבורים: placeClamp ו-wPonds ב-world.js קוראים ל-tStep, ולולאה אחת בסוף worldUpdate מעבירה את כל האויבים ואת פיוחו.
   הציור: terrain2d (דו-ממד), terrain3d (תלת-ממד: מים זורמים, גשרים, יער במופע אחד, צוקים ורכס), ומסכה לקרקע האפויה (ground.js).
   כל המספרים ב-TERRAIN. בלי טקסט לשחקן. */

const TERRAIN={
  cell:20,                 // משבצת של רשת החסימה, בפיקסלים של המשחק
  nav:40,                  // משבצת של רשת חיפוש הדרך (A*): כ-16 אלף משבצות באחו הגדול
  pad:16,                  // כמה רחוק ממכשול נעצרים (בערך רדיוס של דמות)
  slow:{ford:0.5,shallow:0.55,dune:0.6},   // פי כמה מהירות במעבר הרדוד, בשולי הביצה ובים הדיונות (המדבר)
  teleport:140,            // קפיצה גדולה מזו בין שני צעדים היא העברה (שער, אבן מסע), לא הליכה: מחפשים נקודה פנויה במקום להחליק
  field:{every:0.25,r:70}, // מפת המרחקים אל השחקן: לכל היותר פעם ב-every שניות, ועד r משבצות ממנו
  path:{every:0.9,look:7,max:20000},   // דרך לבוט ולמי שהולך ליעד: מחשבים מחדש כל every שניות, look נקודות קדימה, ולכל היותר max משבצות בחיפוש
  wake:1500,               // קבוצת אויבים רחוקה נוצרת רק כשהשחקן מתקרב עד כאן (world.js)
  sleep:1900,              // אויב רחוק מזה מהשחקן לא חושב ולא זז
  room:10,                 // קבוצה מתעוררת רק אם נשאר מקום גם ללהקות (PACE.cap ב-pacing.js), כדי שהשיטוט במפה לא ימלא את המגבלה
  forget:2000,             // קבוצה רחוקה מזה מהשחקן נעלמת וחוזרת לישון (נוצרת שוב כשמתקרבים), כדי שבמפה גדולה לא יצטברו אויבים
  ridge:{h:24,edge:30,soft:40},   // הרכס: גובה הציור בפיקסלים של המסך (פחות מחצי דמות), רוחב השפה החוסמת, ורוחב השיפוע בקצה
  cull:1800,               // בתלת-ממד: חפצים רחוקים מהמצלמה יותר מזה לא מצוירים
  chunk:1100,              // גודל אריח של עצים וסלעים במופע אחד: כל אריח נחתך לבד כשהוא מחוץ למסך
  // יער: עץ כל gap פיקסלים בערך. pick: אילו עצים (כמו W3D.decor ב-render3d.js). edge: בשולי היער עצים נמוכים יותר
  forest:{gap:74,jit:0.45,edge:90,pick:[{model:'n_tree',h:150,tint:'#cfe6bf'},{model:'n_pine',h:165},{model:'v_treeA',w:118},{model:'n_pine',h:135}]},
  cliff:{gap:62,out:[20,120],pick:[{model:'n_crag',w:150,tint:'#b8a890'},{model:'n_block',w:130,tint:'#a89c88'},{model:'n_crag',w:110,tint:'#c9bba2'}]},   // צוקים לאורך הגבול: סלע כל gap, ובין out[0] ל-out[1] מחוץ לקו
  reeds:{gap:46,model:'n_reeds',h:58},
  crag:{gap:170,deep:300,mul:[1.1,2]},   // גושי צוקים (map.crags): סלע כל gap, ובעומק deep מהשפה הם בגודל mul[1]   // קני סוף לאורך הביצה
  // מים בתלת-ממד: deep עמוק, shallow רדוד, foam קצף בנהר, flow מהירות הזרימה (פיקסלים לשנייה)
  water:{deep:'#2f7fa6',dark:'#1e5a80',shallow:'#6fb7c9',foam:'#d8f0ff',flow:70,alpha:0.92},
  bridge:{wood:'#8a5a32',dark:'#5e3b20',plank:16,rail:10},
  // בקרקע האפויה (ground.js): צבעים לפי האזור
  // mesa: הצבע של רמת סלע (map.mesas), dune: ים הדיונות (map.dunes), cliffPick: הסלעים לאורך הגבול ובשולי המסות, במקום cliff.pick
  pal:{meadow:{forest:'#2d4f27',rock:'#8d8a7c',bank:'#6b6a3c',ridge:'#7f9a4a',cliff:'#6d6458'},
    desert:{forest:'#5f7a32',rock:'#b07a4a',bank:'#8a5a32',ridge:'#c08a50',cliff:'#7a4426',mesa:'#9a5a33',mesaTop:'#b9774a',dune:'#ecd49a',duneDark:'#cfae6e',
      cliffPick:[{model:'n_crag',w:150,tint:'#d29a62'},{model:'n_block',w:130,tint:'#b9784a'},{model:'n_crag',w:110,tint:'#e0ac72'}]}},
  mesa:{h:34,gap:58,inner:150},   // רמת סלע בתלת-ממד: גובה הגג (נמוך, כדי שלא תסתיר את הדמות מהמצלמה), סלע כל gap לאורך השפה, ופיזור סלעים בגג כל inner
  mask:10,                 // כמה פיקסלים של המשחק לכל נקודה במסכה של הקרקע
  seaPad:2500,             // אזור עם sea (האגם): כמה רחוק מהמלבן של האזור הים ממשיך בתלת-ממד
  wall:{gap:44,skip:0.12,pick:[{model:'n_block',w:66},{model:'n_block',w:56},{model:'n_block',w:74}]}   // חומה (walls, הסערה): אבן כל gap, ו-skip מהאבנים חסרות (חומה שבורה). הצבע: TERRAIN.pal.<אזור>.wall
};

let TR=null;               // המפה של האזור הנוכחי (או null: מלבן רגיל)
const TRC={};              // מפות שכבר נבנו, לפי אזור

/* ---- בנייה: מציירים את המפה לרשת ---- */
function terrainEnter(R,reg){
  TR=null;if(!R||!R.map)return null;
  if(TRC[reg])return TR=TRC[reg];
  const t0=performance.now(),M=R.map,c=TERRAIN.cell,w=R.size.w,h=R.size.h,gw=Math.ceil(w/c),gh=Math.ceil(h/c);
  const T={reg,map:M,R,c,gw,gh,x0:-w/2,y0:-h/2,blk:new Uint8Array(gw*gh),slw:new Uint8Array(gw*gh),hgt:new Float32Array(gw*gh)};
  const cv=document.createElement('canvas');cv.width=gw;cv.height=gh;const g=cv.getContext('2d',{willReadFrequently:true});
  const tf=()=>{g.setTransform(1/c,0,0,1/c,w/2/c,h/2/c)};
  const poly=(pts)=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath()};
  const line=(pts)=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]))};
  const pad=TERRAIN.pad;g.lineCap=g.lineJoin='round';
  // 1. חסימה: הכל חסום, הפנים של הגבול פנוי, ואז כל מכשול (מנופח ב-pad), ובסוף מה שחותך בו (שבילים, גשרים, מעברים)
  tf();g.fillStyle=g.strokeStyle='#000';g.fillRect(-w,-h,w*2,h*2);
  g.globalCompositeOperation='destination-out';for(const B of tB(M)){poly(B);g.fill()}
  g.globalCompositeOperation='source-over';g.lineWidth=pad*2;for(const B of tB(M)){poly(B);g.stroke()}
  for(const W_ of M.water||[]){poly(W_);g.fill();g.stroke()}
  if(M.islands){g.globalCompositeOperation='destination-out';for(const I of M.islands){poly(I);g.fill()}g.globalCompositeOperation='source-over';for(const I of M.islands){poly(I);g.stroke()}}   // איים: יבשה בתוך המים, עם שפה חוסמת
  for(const F of M.forests||[]){poly(F);g.fill();g.stroke()}
  for(const F of M.crags||[]){poly(F);g.fill();g.stroke()}   // גושי צוקים: חוסמים כמו יער
  for(const r of M.rivers||[]){line(r.pts);g.lineWidth=r.w+pad*2;g.stroke()}
  for(const L of M.walls||[]){line(L.pts);g.lineWidth=L.w+pad*2;g.stroke()}   // חומה (הסערה)
  for(const t of R.towers||[]){g.beginPath();g.arc(t.x,t.y,t.r+pad,0,7);g.fill()}   // מגדלים הרוסים (הסערה): חוסמים גם בחיפוש הדרך
  for(const s of M.springs||[]){g.beginPath();g.arc(s.x,s.y,s.r+pad,0,7);g.fill()}
  if(M.ridge){poly(M.ridge.poly);g.lineWidth=TERRAIN.ridge.edge+pad*2;g.stroke()}
  for(const Q of M.mesas||[]){poly(Q);g.lineWidth=pad*2;g.fill();g.stroke()}   // רמות סלע (המדבר): חוסמות כמו צוק
  for(const p of R.ponds||[]){g.beginPath();g.arc(p.x,p.y,p.r+pad,0,7);g.fill()}   // בורות (לבה במדבר): גם חיפוש הדרך יודע עליהם, ולא רק wPonds
  g.globalCompositeOperation='destination-out';
  for(const t of M.trails||[])if(t.cut){line(t.pts);g.lineWidth=t.w;g.stroke()}
  for(const k of M.clearings||[]){g.beginPath();g.arc(k.x,k.y,k.r,0,7);g.fill()}
  for(const b of M.bridges||[]){g.save();g.translate(b.x,b.y);g.rotate(b.a);g.fillRect(-b.len/2,-b.w/2,b.len,b.w);g.restore()}
  for(const f of M.fords||[]){g.beginPath();g.ellipse(f.x,f.y,f.r,f.r*0.8,f.a||0,0,7);g.fill()}
  if(M.ridge&&M.ridge.ramp){poly(M.ridge.ramp);g.fill()}
  g.globalCompositeOperation='source-over';
  let d=g.getImageData(0,0,gw,gh).data;for(let i=0;i<gw*gh;i++)T.blk[i]=d[i*4+3]>127?1:0;
  // 2. האטה: מעבר רדוד ושולי ביצה. 255 = מהירות מלאה
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,gw,gh);tf();
  const slowFill=k=>{g.fillStyle='rgba(0,0,0,'+(1-k)+')'};
  for(const f of M.fords||[]){slowFill(TERRAIN.slow.ford);g.beginPath();g.ellipse(f.x,f.y,f.r,f.r*0.8,f.a||0,0,7);g.fill()}
  for(const s of M.shallow||[]){slowFill(TERRAIN.slow.shallow);poly(s);g.fill()}
  for(const s of M.dunes||[]){slowFill(TERRAIN.slow.dune);poly(s);g.fill()}   // ים הדיונות (המדבר)
  d=g.getImageData(0,0,gw,gh).data;for(let i=0;i<gw*gh;i++)T.slw[i]=255-d[i*4+3];
  // 3. גובה: הרכס, עם שיפוע רך בקצה ועלייה אחת (ramp) מהצד המזרחי
  const RG=M.ridge;
  if(RG){const H=TERRAIN.ridge.h,soft=TERRAIN.ridge.soft,bb=bbox(RG.poly.concat(RG.ramp||[])),rp=RG.ramp,ax=RG.up;
    for(let j=Math.max(0,Math.floor((bb.y0-T.y0)/c)-1);j<=Math.min(gh-1,Math.ceil((bb.y1-T.y0)/c)+1);j++)
      for(let i=Math.max(0,Math.floor((bb.x0-T.x0)/c)-1);i<=Math.min(gw-1,Math.ceil((bb.x1-T.x0)/c)+1);i++){
        const x=T.x0+(i+0.5)*c,y=T.y0+(j+0.5)*c;let v=0;
        if(inPoly(x,y,RG.poly))v=Math.min(1,polyDist(x,y,RG.poly)/soft+0.5);
        if(rp&&inPoly(x,y,rp)){const k=Math.max(0,Math.min(1,((x-ax[0][0])*(ax[1][0]-ax[0][0])+(y-ax[0][1])*(ax[1][1]-ax[0][1]))/((ax[1][0]-ax[0][0])**2+(ax[1][1]-ax[0][1])**2)));v=Math.max(v,k)}
        T.hgt[j*gw+i]=v*H}}
  // 4. רשת חיפוש הדרך: משבצת פנויה אם לפחות משבצת חסימה אחת בה פנויה. הנקודה שלה: המשבצת הפנויה הכי קרובה למרכז
  const n=TERRAIN.nav,k=Math.round(n/c),nw=Math.ceil(gw/k),nh=Math.ceil(gh/k);
  T.nw=nw;T.nh=nh;T.nk=k;T.nav=new Uint8Array(nw*nh);T.npx=new Float32Array(nw*nh);T.npy=new Float32Array(nw*nh);
  for(let j=0;j<nh;j++)for(let i=0;i<nw;i++){let best=1e9;
    for(let b=0;b<k;b++)for(let a=0;a<k;a++){const fi=i*k+a,fj=j*k+b;if(fi>=gw||fj>=gh||T.blk[fj*gw+fi])continue;
      const dd=(a+0.5-k/2)**2+(b+0.5-k/2)**2;if(dd<best){best=dd;T.npx[j*nw+i]=T.x0+(fi+0.5)*c;T.npy[j*nw+i]=T.y0+(fj+0.5)*c}}
    T.nav[j*nw+i]=best<1e9?1:0}
  T.fld=new Int16Array(nw*nh);T.fAt=-1;T.fT=-9;
  T.ms=Math.round(performance.now()-t0);
  return TR=TRC[reg]=T;
}
// border: פוליגון אחד, או כמה (לב הצל: ארבעה חלקים סביב התהום). waterCol: צבעי מים משלו (התהום הסגולה)
const tB=M=>Array.isArray(M.border[0][0])?M.border:[M.border];
const tWC=M=>M&&M.waterCol?Object.assign({},TERRAIN.water,M.waterCol):TERRAIN.water;
const bbox=pts=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const [x,y] of pts){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}return{x0,y0,x1,y1}};
function inPoly(x,y,P_){let o=false;for(let i=0,j=P_.length-1;i<P_.length;j=i++){const [xi,yi]=P_[i],[xj,yj]=P_[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)o=!o}return o}
const segD=(x,y,ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-ax-dx*t,y-ay-dy*t)};
function polyDist(x,y,P_){let m=1e9;for(let i=0,j=P_.length-1;i<P_.length;j=i++)m=Math.min(m,segD(x,y,P_[j][0],P_[j][1],P_[i][0],P_[i][1]));return m}
function lineDist(x,y,pts){let m=1e9;for(let i=1;i<pts.length;i++)m=Math.min(m,segD(x,y,pts[i-1][0],pts[i-1][1],pts[i][0],pts[i][1]));return m}
// המים הקרובים (לדיג, fishing.js): הנקודה הקרובה על שפת המים העמוקים, והמרחק אליה. sea: גם הגבול הוא שפת מים
function tWaterNear(x,y){const M=TR&&TR.map;if(!M)return null;let b=null;
  const edge=P_=>{for(let i=0,j=P_.length-1;i<P_.length;j=i++){const [ax,ay]=P_[j],[bx,by]=P_[i],dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1))),px=ax+dx*t,py=ay+dy*t,e=Math.hypot(x-px,y-py);if(!b||e<b.e)b={x:px,y:py,e}}};
  for(const W_ of M.water||[])edge(W_);if(M.sea)for(const B of tB(M))edge(B);return b}

/* ---- שאלות ---- */
const tCell=(x,y)=>{const T=TR,i=Math.floor((x-T.x0)/T.c),j=Math.floor((y-T.y0)/T.c);return i<0||j<0||i>=T.gw||j>=T.gh?-1:j*T.gw+i};
function tBlocked(x,y){if(!TR||!S.wd)return false;const i=tCell(x,y);return i<0||TR.blk[i]===1}
function tSlow(x,y){if(!TR)return 1;const i=tCell(x,y);return i<0?1:TR.slw[i]/255}
function hAt(x,y){
  const T=TR;if(!T||!T.map.ridge)return 0;
  const fx=(x-T.x0)/T.c-0.5,fy=(y-T.y0)/T.c-0.5,i=Math.floor(fx),j=Math.floor(fy);if(i<0||j<0||i>=T.gw-1||j>=T.gh-1)return 0;
  const a=fx-i,b=fy-j,H=T.hgt,w=T.gw,p=j*w+i;return(H[p]*(1-a)+H[p+1]*a)*(1-b)+(H[p+w]*(1-a)+H[p+w+1]*a)*b;
}
// הנקודה הפנויה הקרובה: מחפשים בטבעות שהולכות וגדלות סביב המשבצת
function tFree(o){
  if(!TR||!tBlocked(o.x,o.y))return o;
  const T=TR,ci=Math.floor((o.x-T.x0)/T.c),cj=Math.floor((o.y-T.y0)/T.c);
  for(let r=1;r<160;r++){let best=null,bd=1e18;
    for(let j=cj-r;j<=cj+r;j++)for(let i=ci-r;i<=ci+r;i++){
      if(Math.max(Math.abs(i-ci),Math.abs(j-cj))!==r||i<0||j<0||i>=T.gw||j>=T.gh||T.blk[j*T.gw+i])continue;
      const x=T.x0+(i+0.5)*T.c,y=T.y0+(j+0.5)*T.c,dd=(x-o.x)**2+(y-o.y)**2;if(dd<bd){bd=dd;best=[x,y]}}
    if(best){o.x=best[0];o.y=best[1];break}}
  if('_tx' in o||o===P){o._tx=o.x;o._ty=o.y}
  return o;
}
/* צעד: מה שזז מאז הפעם הקודמת. האטה במקום רדוד, וגלישה לאורך הקצה כשנכנסים למקום חסום (קודם ציר אחד, אחר כך השני) */
function tStep(o){
  if(!TR||!o||!S.wd)return o;   // רק בעולם: בזירה ובכפר אין מפה
  const lx=o._tx,ly=o._ty;
  if(lx==null||Math.abs(o.x-lx)+Math.abs(o.y-ly)>TERRAIN.teleport){tFree(o);o._tx=o.x;o._ty=o.y;return o}
  if(o.x===lx&&o.y===ly)return o;
  const k=tSlow(o.x,o.y);if(k<1){o.x=lx+(o.x-lx)*k;o.y=ly+(o.y-ly)*k}
  if(tBlocked(o.x,o.y)){if(!tBlocked(o.x,ly))o.y=ly;else if(!tBlocked(lx,o.y))o.x=lx;else{o.x=lx;o.y=ly}
    if(tBlocked(o.x,o.y))tFree(o)}
  o._tx=o.x;o._ty=o.y;return o;
}
// קו ראייה: אין שום משבצת חסומה על הקו
function tLOS(ax,ay,bx,by){
  if(!TR)return true;const d=Math.hypot(bx-ax,by-ay),n=Math.ceil(d/(TR.c*0.5));
  for(let s=1;s<=n;s++){const t=s/n;if(tBlocked(ax+(bx-ax)*t,ay+(by-ay)*t))return false}return true;
}

/* ---- חיפוש דרך ---- */
const tNav=(x,y)=>{const T=TR,i=Math.floor((x-T.x0)/(T.c*T.nk)),j=Math.floor((y-T.y0)/(T.c*T.nk));return i<0||j<0||i>=T.nw||j>=T.nh?-1:j*T.nw+i};
// משבצת ניווט פנויה קרובה (למי שעומד על הקצה)
function tNavFree(x,y){const T=TR;let i0=tNav(x,y);if(i0>=0&&T.nav[i0])return i0;
  const ci=Math.floor((x-T.x0)/(T.c*T.nk)),cj=Math.floor((y-T.y0)/(T.c*T.nk));
  for(let r=1;r<6;r++)for(let j=cj-r;j<=cj+r;j++)for(let i=ci-r;i<=ci+r;i++){if(i<0||j<0||i>=T.nw||j>=T.nh)continue;const q=j*T.nw+i;if(T.nav[q])return q}
  return -1}
const NB=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
// A*: רשימת נקודות מ-(ax,ay) אל (bx,by), או null כשאין דרך
function tPath(ax,ay,bx,by){
  const T=TR;if(!T)return[[bx,by]];
  const s=tNavFree(ax,ay),e=tNavFree(bx,by);if(s<0||e<0)return null;if(s===e)return[[bx,by]];
  const N=T.nw*T.nh,gS=T._g||(T._g=new Float32Array(N)),from=T._f||(T._f=new Int32Array(N)),mark=T._m||(T._m=new Uint32Array(N)),done=T._d||(T._d=new Uint32Array(N));
  T._run=(T._run||0)+1;const run=T._run,ex=e%T.nw,ey=Math.floor(e/T.nw);
  const hq=[],hf=[];const push=(i,f)=>{hq.push(i);hf.push(f);let k=hq.length-1;while(k>0){const p=(k-1)>>1;if(hf[p]<=hf[k])break;[hq[p],hq[k]]=[hq[k],hq[p]];[hf[p],hf[k]]=[hf[k],hf[p]];k=p}};
  const pop=()=>{const top=hq[0],li=hq.pop(),lf=hf.pop();if(hq.length){hq[0]=li;hf[0]=lf;let k=0;for(;;){const l=k*2+1,r=l+1;let m=k;if(l<hq.length&&hf[l]<hf[m])m=l;if(r<hq.length&&hf[r]<hf[m])m=r;if(m===k)break;[hq[m],hq[k]]=[hq[k],hq[m]];[hf[m],hf[k]]=[hf[k],hf[m]];k=m}}return top};
  const hh=i=>{const dx=Math.abs(i%T.nw-ex),dy=Math.abs(Math.floor(i/T.nw)-ey);return Math.max(dx,dy)+0.414*Math.min(dx,dy)};
  mark[s]=run;gS[s]=0;from[s]=-1;push(s,hh(s));let n=0,ok=false;
  while(hq.length&&n<TERRAIN.path.max){const c=pop();if(done[c]===run)continue;done[c]=run;n++;if(c===e){ok=true;break}
    const cx=c%T.nw,cy=Math.floor(c/T.nw);
    for(const [dx,dy,w] of NB){const x=cx+dx,y=cy+dy;if(x<0||y<0||x>=T.nw||y>=T.nh)continue;const q=y*T.nw+x;if(!T.nav[q])continue;
      if(dx&&dy&&(!T.nav[cy*T.nw+x]||!T.nav[y*T.nw+cx]))continue;   // לא חותכים פינה
      const g2=gS[c]+w;if(done[q]===run||mark[q]===run&&g2>=gS[q])continue;mark[q]=run;gS[q]=g2;from[q]=c;push(q,g2+hh(q))}}
  if(!ok)return null;
  const out=[[bx,by]];for(let c=from[e];c>=0&&c!==s;c=from[c])out.push([T.npx[c],T.npy[c]]);
  return out.reverse();
}
// מפת מרחקים אל השחקן (BFS ברדיוס מוגבל): כל מי שרודף אחריו הולך במורד
function tField(){
  const T=TR,F=TERRAIN.field,at=tNavFree(P.x,P.y),now=S.wd?S.wd.t:0;
  if(at<0||at===T.fAt||now-T.fT<F.every)return T.fld;T.fAt=at;T.fT=now;
  const D=T.fld;D.fill(-1);const q=new Int32Array(T.nw*T.nh);let h=0,t=0;q[t++]=at;D[at]=0;const ax=at%T.nw,ay=Math.floor(at/T.nw);
  while(h<t){const c=q[h++],cx=c%T.nw,cy=Math.floor(c/T.nw);if(D[c]>=F.r*2)continue;
    for(const [dx,dy] of NB){const x=cx+dx,y=cy+dy;if(x<0||y<0||x>=T.nw||y>=T.nh||Math.abs(x-ax)>F.r||Math.abs(y-ay)>F.r)continue;const i=y*T.nw+x;
      if(D[i]>=0||!T.nav[i])continue;if(dx&&dy&&(!T.nav[cy*T.nw+x]||!T.nav[y*T.nw+cx]))continue;D[i]=D[c]+1;q[t++]=i}}
  return D;
}
/* לאן ללכת: (x,y) עצמו כשרואים אותו. אחרת, אם היעד הוא השחקן: במורד מפת המרחקים. אחרת: דרך A* שנשמרת על o ומתחדשת לאט.
   תמיד מחזיר נקודה, כך שמי שקורא רק מחליף את היעד */
function tDir(o,x,y){
  if(!TR||tLOS(o.x,o.y,x,y))return{x,y};
  const T=TR;
  if(Math.hypot(x-P.x,y-P.y)<80&&o!==P){const D=tField(),c=tNavFree(o.x,o.y);
    if(c>=0&&D[c]>0){let cur=c,best=null;
      for(let s=0;s<TERRAIN.path.look;s++){const cx=cur%T.nw,cy=Math.floor(cur/T.nw);let nx=-1,nd=D[cur];
        for(const [dx,dy] of NB){const xx=cx+dx,yy=cy+dy;if(xx<0||yy<0||xx>=T.nw||yy>=T.nh)continue;const i=yy*T.nw+xx;if(D[i]>=0&&D[i]<nd){nd=D[i];nx=i}}
        if(nx<0)break;cur=nx;if(!best||tLOS(o.x,o.y,T.npx[cur],T.npy[cur]))best=[T.npx[cur],T.npy[cur]];else break;if(nd===0)break}
      if(best)return{x:best[0],y:best[1]}}}
  const now=S.wd?S.wd.t:0,c=o._tp;
  if(!c||now-c.t>TERRAIN.path.every||Math.hypot(c.x-x,c.y-y)>120){o._tp={t:now,x,y,pts:tPath(o.x,o.y,x,y)}}
  const pts=o._tp.pts;if(!pts||!pts.length)return{x,y};
  while(pts.length>1&&Math.hypot(pts[0][0]-o.x,pts[0][1]-o.y)<TERRAIN.nav*0.7)pts.shift();
  let pick=pts[0];for(let i=1;i<Math.min(pts.length,TERRAIN.path.look);i++){if(tLOS(o.x,o.y,pts[i][0],pts[i][1]))pick=pts[i];else break}
  return{x:pick[0],y:pick[1]};
}
// לכל מי שזז בעולם, פעם בפריים (סוף worldUpdate): האויבים ופיוחו. השחקן עובר ב-placeClamp
function terrainTick(){if(!TR)return;for(const e of enemies)if(!e.dead)tStep(e);if(S.pet)tStep(S.pet)}

/* ---- בדיקה: מקומות שנפלו בתוך מים, יער או צוק ---- */
function terrainBad(R,reg){
  const T=terrainEnter(R,reg);if(!T)return[];const out=[],chk=(name,o)=>{if(o&&tBlocked(o.x,o.y))out.push(name+' ('+Math.round(o.x)+','+Math.round(o.y)+')')};
  chk('home',R.home);for(const k in R.gates)chk('gate.'+k,R.gates[k]);for(const k in R.paths)chk('path.'+k,R.paths[k]);
  chk('arrive.home',{x:R.home.x,y:R.home.y+WORLD.arrive});for(const k in R.gates)chk('arrive.'+k,{x:R.gates[k].x,y:R.gates[k].y+WORLD.arrive});
  R.fields.forEach((f,i)=>chk('field'+i+'.'+f.kind,f));R.foes.forEach((f,i)=>chk('foe'+i+'.'+f.type,f));
  for(const s of (typeof SECRETS!=='undefined'&&SECRETS.regions[reg])||[]){chk('secret.'+s.id,s);if(s.to)chk('secret.'+s.id+'.to',s.to)}
  if(typeof WNPC!=='undefined')for(const id in WNPC.list)if((WNPC.list[id].reg||'meadow')===reg)chk('npc.'+id,WNPC.list[id].at);   // reg: הדמויות של הקווסטים הצדדיים
  if(typeof SIDEQ!=='undefined')for(const k in SIDEQ.places[reg]||{})chk('place.'+k,SIDEQ.places[reg][k]);   // מקומות לחקור ולהגן (questboard.js)
  if(typeof STORY!=='undefined')for(const k in STORY.lanterns){const L=STORY.lanterns[k];if(L.reg===reg)chk('lantern.'+k,L)}
  for(const d of R.map.dens||[])chk('den.'+d.id,d);for(const w of R.waystones||[])chk('waystone.'+w.id,w);
  for(const l of R.map.marks||[])chk('mark.'+l.id,l);
  if(typeof RARES!=='undefined')for(const id in RARES.list){const Q=RARES.list[id];if(Q.reg===reg)Q.spots.forEach((p,i)=>chk('rare.'+id+i,p))}
  return out;
}
// כמה רחוק אפשר ללכת: מהשער לכל מקום, בדרך (לבדיקה ולמדידה)
function terrainReach(R,reg){
  const T=terrainEnter(R,reg);if(!T)return null;const a={x:R.home.x,y:R.home.y+WORLD.arrive},out={};
  for(const k in R.gates)out['gate.'+k]=!!tPath(a.x,a.y,R.gates[k].x,R.gates[k].y+WORLD.arrive);
  for(const k in R.paths)out['path.'+k]=!!tPath(a.x,a.y,R.paths[k].x,R.paths[k].y+WORLD.arrive);
  for(const d of R.map.dens||[])out['den.'+d.id]=!!tPath(a.x,a.y,d.x,d.y);
  for(const w of R.waystones||[])out['waystone.'+w.id]=!!tPath(a.x,a.y,w.x,w.y);
  for(const s of (typeof SECRETS!=='undefined'&&SECRETS.regions[reg])||[])out['secret.'+s.id]=!!tPath(a.x,a.y,s.x,s.y);
  return out;
}

/* ---- דו-ממד: צורות פשוטות, מוכנות מראש (Path2D) ---- */
// הצורות של המפה כ-Path2D, פעם אחת לאזור
function tPaths(T){const M=T.map;return T.p2||(T.p2=(()=>{const mk=(pts,close)=>{const p=new Path2D();pts.forEach((q,i)=>i?p.lineTo(q[0],q[1]):p.moveTo(q[0],q[1]));if(close)p.closePath();return p};
    const bd=new Path2D();for(const B of tB(M))bd.addPath(mk(B,1));
    return{border:bd,water:(M.water||[]).map(w=>mk(w,1)),forest:(M.forests||[]).map(f=>mk(f,1)),rivers:(M.rivers||[]).map(r=>({p:mk(r.pts),w:r.w})),
      trails:(M.trails||[]).map(t=>({p:mk(t.pts),w:t.w})),quarry:(M.rocky||[]).map(q=>mk(q,1)),crags:(M.crags||[]).map(q=>mk(q,1)),ice:(M.ice||[]).map(q=>({p:mk(q.pts,1),col:q.col})),ridge:M.ridge&&mk(M.ridge.poly,1),ramp:M.ridge&&M.ridge.ramp&&mk(M.ridge.ramp,1),shallow:(M.shallow||[]).map(s=>mk(s,1)),islands:(M.islands||[]).map(s=>mk(s,1)),
      mesas:(M.mesas||[]).map(q=>mk(q,1)),dunes:(M.dunes||[]).map(q=>mk(q,1))}})())}
function terrain2d(){
  if(!TR)return false;tDraw(ctx,TR,false);return true;
}
// הציור עצמו, על כל קנבס בקואורדינטות של המשחק: הקנבס של המשחק (דו-ממד) או המפה המלאה (worldmap.js, mini: בלי פרטים קטנים)
function tDraw(ctx,T,mini){
  const M=T.map,Pa=GROUND.pal[T.reg]||GROUND.pal.meadow,Q=TERRAIN.pal[T.reg]||TERRAIN.pal.meadow,p2=tPaths(T);
  const {w,h}=T.R.size;ctx.save();ctx.lineCap=ctx.lineJoin='round';if(mini){ctx.beginPath();ctx.rect(-w/2,-h/2,w,h);ctx.clip()}   // במפה: רק בתוך המלבן של האזור
  const Wc=tWC(M);ctx.fillStyle=M.sea?Wc.deep:Pa.out;ctx.fillRect(-w/2-400,-h/2-400,w+800,h+800);   // sea: מחוץ לגבול מים פתוחים (האגם)
  ctx.fillStyle=Pa.base;ctx.fill(p2.border);
  ctx.fillStyle=Q.rock;for(const q of p2.quarry)ctx.fill(q);
  if(Q.dune){ctx.fillStyle=Q.dune;ctx.globalAlpha=0.75;for(const q of p2.dunes)ctx.fill(q);ctx.globalAlpha=1}
  for(const q of p2.ice){ctx.fillStyle=q.col;ctx.globalAlpha=0.75;ctx.fill(q.p);ctx.globalAlpha=1}   // ice: משטח קרח או שלג, רק מראה
  for(const t of p2.trails){ctx.strokeStyle=Pa.path;ctx.lineWidth=t.w*0.6;ctx.stroke(t.p)}
  ctx.fillStyle=Wc.deep;for(const q of p2.water)ctx.fill(q);
  ctx.fillStyle=Pa.base;for(const q of p2.islands)ctx.fill(q);
  ctx.fillStyle=Wc.shallow;ctx.globalAlpha=0.5;for(const q of p2.shallow)ctx.fill(q);ctx.globalAlpha=1;
  for(const r of p2.rivers){ctx.strokeStyle=Q.bank;ctx.lineWidth=r.w+18;ctx.stroke(r.p);ctx.strokeStyle=Wc.deep;ctx.lineWidth=r.w;ctx.stroke(r.p)}
  for(const s of M.springs||[]){ctx.fillStyle=Wc.deep;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,7);ctx.fill()}
  for(const f of M.fords||[]){ctx.fillStyle=Wc.shallow;ctx.beginPath();ctx.ellipse(f.x,f.y,f.r,f.r*0.8,f.a||0,0,7);ctx.fill()}
  ctx.save();ctx.clip(p2.border);ctx.fillStyle=Q.forest;for(const q of p2.forest)ctx.fill(q);ctx.restore();   // יער רק על היבשה
  for(const q of p2.mesas){ctx.fillStyle=Q.mesa||Q.rock;ctx.fill(q);ctx.strokeStyle=Q.cliff;ctx.lineWidth=18;ctx.stroke(q)}
  for(const q of p2.crags){ctx.fillStyle=Q.cliff;ctx.fill(q);ctx.strokeStyle=Q.rock;ctx.lineWidth=18;ctx.stroke(q)}
  for(const t of p2.trails)if(t.w){ctx.strokeStyle=Pa.path;ctx.lineWidth=t.w*0.7;ctx.stroke(t.p)}
  for(const k of M.clearings||[]){ctx.fillStyle=Pa.lush;ctx.beginPath();ctx.arc(k.x,k.y,k.r,0,7);ctx.fill()}
  if(p2.ridge){ctx.fillStyle=Q.ridge;ctx.fill(p2.ridge);if(p2.ramp)ctx.fill(p2.ramp);ctx.strokeStyle=Q.cliff;ctx.lineWidth=TERRAIN.ridge.edge*0.6;ctx.stroke(p2.ridge)}
  for(const b of M.bridges||[]){if(mini)break;ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.a);ctx.fillStyle=TERRAIN.bridge.wood;ctx.fillRect(-b.len/2,-b.w/2,b.len,b.w);
    ctx.strokeStyle=TERRAIN.bridge.dark;ctx.lineWidth=3;for(let x=-b.len/2;x<b.len/2;x+=TERRAIN.bridge.plank){ctx.beginPath();ctx.moveTo(x,-b.w/2);ctx.lineTo(x,b.w/2);ctx.stroke()}ctx.restore()}
  for(const L of M.walls||[]){ctx.strokeStyle=Q.wall||Q.cliff;ctx.lineWidth=L.w;ctx.beginPath();L.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke()}   // חומה (הסערה)
  ctx.strokeStyle=Q.cliff;ctx.lineWidth=26;ctx.stroke(p2.border);
  ctx.restore();
}

/* ---- המסכה לקרקע האפויה (ground.js): R מים, G יער, B מחוץ לגבול, A סלעי (מחצבה, רכס) ---- */
function terrainMask(R,bw,bh){
  const M=R.map,k=TERRAIN.mask,mw=Math.ceil(bw/k),mh=Math.ceil(bh/k),one=(f,blur)=>{const c=document.createElement('canvas');c.width=mw;c.height=mh;const g=c.getContext('2d',{willReadFrequently:true});
    g.filter=blur?'blur('+blur+'px)':'none';g.setTransform(1/k,0,0,1/k,bw/2/k,bh/2/k);g.fillStyle=g.strokeStyle='#000';g.lineCap=g.lineJoin='round';f(g);return g.getImageData(0,0,mw,mh).data};
  const poly=(g,pts)=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath()};
  const line=(g,pts)=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]))};
  const wat=one(g=>{for(const r of M.rivers||[]){line(g,r.pts);g.lineWidth=r.w+70;g.stroke()}for(const w of M.water||[]){poly(g,w);g.fill();g.lineWidth=90;g.stroke()}
    for(const s of M.springs||[]){g.beginPath();g.arc(s.x,s.y,s.r+40,0,7);g.fill()}for(const s of M.shallow||[]){poly(g,s);g.fill()}if(M.islands){g.globalCompositeOperation='destination-out';for(const I of M.islands){poly(g,I);g.fill()}}},2);
  const fo=one(g=>{for(const f of M.forests||[]){poly(g,f);g.fill()}g.globalCompositeOperation='destination-out';
    for(const t of M.trails||[])if(t.cut){line(g,t.pts);g.lineWidth=t.w*1.2;g.stroke()}for(const c of M.clearings||[]){g.beginPath();g.arc(c.x,c.y,c.r,0,7);g.fill()}},3);
  const ou=one(g=>{g.fillRect(-bw,-bh,bw*2,bh*2);g.globalCompositeOperation='destination-out';for(const B of tB(M)){poly(g,B);g.fill()}},2);
  const ro=one(g=>{for(const q of (M.rocky||[]).concat(M.crags||[],M.mesas||[])){poly(g,q);g.fill()}for(const L of M.walls||[]){line(g,L.pts);g.lineWidth=L.w+60;g.stroke()}if(M.ridge){poly(g,M.ridge.poly);g.lineWidth=TERRAIN.ridge.edge*2;g.stroke()}},3);
  const out=new Uint8Array(mw*mh*4);for(let i=0;i<mw*mh;i++){out[i*4]=wat[i*4+3];out[i*4+1]=fo[i*4+3];out[i*4+2]=ou[i*4+3];out[i*4+3]=ro[i*4+3]}
  return{data:out,w:mw,h:mh};
}
// השבילים של המפה לקרקע האפויה: קטעים [x0,y0,x1,y1]
function terrainSegs(R){const o=[];for(const t of R.map.trails||[])if(t.draw!==false)for(let i=1;i<t.pts.length;i++)o.push([...t.pts[i-1],...t.pts[i]]);return o}

/* ---- תלת-ממד ---- */
// מופע אחד לכל חלק של מודל, בכל אריח: מאות עצים בכמה ציורים בלבד. list: [{sp,x,y,v,mul}] (sp כמו ב-W3D.decor)
function tInst(list,group){
  const S_=SIN(),ck=TERRAIN.chunk,by={},mx=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),s3=new THREE.Vector3(),v=new THREE.Vector3(),tmp=new THREE.Matrix4();
  for(const it of list){const sp=it.sp,md=Array.isArray(sp.model)?sp.model[it.v<0.5?0:1]:sp.model;if(md==='n_cactus'||md==='n_reeds')natureProp(md);
    const key=md+(sp.tint||'')+(sp.snow||'');
    if((sp.tint||sp.snow)&&!R3D.props[key]){const t=R3D.props[md].clone(true),c=new THREE.Color(sp.tint||'#fff'),wc=new THREE.Color('#f2f8fc');
      t.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.color.multiply(c);if(sp.snow)o.material.emissive.copy(wc).multiplyScalar(sp.snow)}});R3D.props[key]=t}
    const t=R3D.props[key];if(!t)continue;const bb=t.userData.bb||(t.userData.bb=new THREE.Box3().setFromObject(t));
    const wd=sp.h?sp.h*Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z,1e-3)/Math.max(bb.max.y-bb.min.y,1e-3):sp.w,s=wd*(it.mul||1)/Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z,1e-3);
    const c=Math.floor(it.x/ck)+','+Math.floor(it.y/ck),K=key+'|'+c;(by[K]||(by[K]={key,c,cx:(Math.floor(it.x/ck)+0.5)*ck,cy:(Math.floor(it.y/ck)+0.5)*ck,a:[]})).a.push([it.x,it.y,s,it.v*6.28,-bb.min.y*s+(it.lift||0),hAt(it.x,it.y)])}
  const chunks={};
  for(const K in by){const B=by[K],t=R3D.props[B.key];t.updateMatrixWorld(true);
    const parts=[];t.traverse(o=>{if(o.isMesh)parts.push(o)});
    let ch=chunks[B.c];if(!ch){ch=chunks[B.c]=new THREE.Group();ch.userData.cx=B.cx;ch.userData.cy=B.cy;group.add(ch)}
    for(const o of parts){const im=new THREE.InstancedMesh(o.geometry,o.material,B.a.length);
      B.a.forEach((a,i)=>{e.set(0,a[3],0);q.setFromEuler(e);s3.set(a[2],a[2],a[2]);v.set(a[0],a[4]+a[5]/COS(),a[1]/S_);mx.compose(v,q,s3);tmp.multiplyMatrices(mx,o.matrixWorld);im.setMatrixAt(i,tmp)});
      im.instanceMatrix.needsUpdate=true;im.computeBoundingSphere();ch.add(im)}}
  return Object.values(chunks);
}
// מים: רצועה לאורך הנהר (u לאורך, v לרוחב) או משטח (פוליגון). זורם לפי הזמן, שוליים רכים
function tWaterMat(flow,M){
  const W=tWC(M);return new THREE.ShaderMaterial({transparent:true,depthWrite:false,
    uniforms:{t:{value:0},cD:{value:new THREE.Color(W.deep)},cK:{value:new THREE.Color(W.dark)},cF:{value:new THREE.Color(W.foam)},a:{value:W.alpha},flow:{value:flow?1:0}},
    vertexShader:'varying vec2 vU;varying vec2 vW;void main(){vU=uv;vec4 w=modelMatrix*vec4(position,1.0);vW=w.xz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:`uniform float t,a,flow;uniform vec3 cD,cK,cF;varying vec2 vU;varying vec2 vW;
      float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
      void main(){
        vec2 q=flow>0.5?vec2(vU.x*0.02-t*${(W.flow*0.02).toFixed(3)},vU.y*3.0):vW/160.0+vec2(t*0.03,t*0.02);
        float s=n(q*vec2(1.0,1.0))*0.6+n(q*2.3+vec2(4.0,1.0))*0.4;
        vec3 c=mix(cK,cD,0.45+0.55*s);
        float st=flow>0.5?smoothstep(0.72,0.9,n(vec2(vU.x*0.035-t*${(W.flow*0.035).toFixed(3)},vU.y*6.0))):smoothstep(0.82,0.95,s);
        c=mix(c,cF,st*0.55);
        float e=flow>0.5?smoothstep(0.0,0.18,vU.y)*smoothstep(1.0,0.82,vU.y):1.0;
        gl_FragColor=vec4(c,a*e);
        #include <colorspace_fragment>
      }`});
}
function tRibbon(pts,w,y){   // רצועה חלקה לאורך קו: מחלקים כל קטע לכמה, וחושבים נורמל בכל נקודה
  const S_=SIN(),sm=[];for(let i=0;i<pts.length-1;i++){const [ax,ay]=pts[i],[bx,by]=pts[i+1],p0=pts[Math.max(0,i-1)],p3=pts[Math.min(pts.length-1,i+2)];
    for(let k=0;k<6;k++){const t=k/6,t2=t*t,t3=t2*t,cr=(a,b,c,d)=>0.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);sm.push([cr(p0[0],ax,bx,p3[0]),cr(p0[1],ay,by,p3[1])])}}
  sm.push(pts[pts.length-1]);
  const pos=[],uv=[],idx=[];let L=0;
  sm.forEach((p,i)=>{const a=sm[Math.max(0,i-1)],b=sm[Math.min(sm.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;
    if(i)L+=Math.hypot(p[0]-sm[i-1][0],p[1]-sm[i-1][1]);
    for(const s of [-1,1]){pos.push(p[0]+nx*w/2*s,y,(p[1]+ny*w/2*s)/S_);uv.push(L,s<0?0:1)}
    if(i){const o=(i-1)*2;idx.push(o,o+1,o+2,o+1,o+3,o+2)}});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeBoundingSphere();return g;
}
function tFlat(pts,y,holes){const S_=SIN(),v2=q=>q.map(p=>new THREE.Vector2(p[0],-p[1]/S_)),sh=new THREE.Shape(v2(pts));for(const h of holes||[])sh.holes.push(new THREE.Path(v2(h)));const g=new THREE.ShapeGeometry(sh);g.rotateX(-Math.PI/2);g.translate(0,y,0);g.computeBoundingSphere();return g}
// גשר עץ: קרשים לרוחב, שני מעקות ועמודים. a הכיוון שבו חוצים
function tBridge(b){
  const B=TERRAIN.bridge,S_=SIN(),grp=new THREE.Group(),wood=new THREE.MeshLambertMaterial({color:B.wood}),dark=new THREE.MeshLambertMaterial({color:B.dark});
  const box=(sx,sy,sz,x,y,z,m)=>{const ms=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),m);ms.position.set(x,y,z);grp.add(ms)};
  for(let x=-b.len/2;x<b.len/2-1;x+=B.plank)box(B.plank-3,5,b.w,x+B.plank/2,6+Math.sin((x/b.len+0.5)*Math.PI)*8,0,(x/B.plank|0)%3?wood:dark);
  for(const s of [-1,1]){box(b.len,5,5,0,26+4,s*(b.w/2-3),dark);for(let x=-b.len/2;x<=b.len/2;x+=b.len/4)box(7,30,7,x,15,s*(b.w/2-3),dark)}
  // הכיוון: על המסך a, ובעולם z מתוח פי 1/sin
  const dx=Math.cos(b.a),dy=Math.sin(b.a)/S_;grp.rotation.y=-Math.atan2(dy,dx);
  const k=Math.hypot(dx,dy);grp.scale.set(k,1,1);
  grp.position.set(b.x,0,b.y/S_);return grp;
}
// הרכס: רשת קטנה עם גובה מ-hAt, עם אותו חומר כמו הקרקע (מצויר לפי המקום בעולם), וסלעים לאורך השפה חוץ מהעלייה
function tRidge(RG){
  const S_=SIN(),bb=bbox(RG.poly.concat(RG.ramp||[])),st=24,nx=Math.ceil((bb.x1-bb.x0+120)/st),ny=Math.ceil((bb.y1-bb.y0+120)/st),pos=[],idx=[];
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const x=bb.x0-60+i*st,y=bb.y0-60+j*st;pos.push(x,hAt(x,y)/COS()-0.4,y/S_)}
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;idx.push(a,c,b,b,c,d)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:(TERRAIN.pal.meadow).ridge}));m.userData.ground=1;return m;
}
// חפץ שעומד על הרכס עולה איתו (פעם אחת, לפי המקום שלו)
function tLift(o){if(!o||o.userData.lift!=null||!TR)return;const S_=SIN(),h=hAt(o.position.x,o.position.z*S_);o.userData.lift=h;if(h)o.position.y+=h/COS()}
// כל הציור של המפה, פעם אחת לאזור (syncWorld ב-render3d.js)
function terrain3d(G,reg){
  const T=TR;if(!T||T.reg!==reg)return;const M=T.map,S_=SIN(),root=new THREE.Group();G.g.add(root);G.terr={root,chunks:[],water:[]};
  // נהרות, מעיינות, מעברים, ים וביצה
  const Qp=TERRAIN.pal[T.reg]||{};
  for(const r of M.rivers||[]){const m=new THREE.Mesh(tRibbon(r.pts,r.w+18,0.8),tWaterMat(true,M));m.renderOrder=2;root.add(m);G.terr.water.push(m.material)}
  const still=tWaterMat(false,M);G.terr.water.push(still);
  for(const w of M.water||[]){const m=new THREE.Mesh(tFlat(w,0.6,(M.islands||[]).filter(I=>inPoly(I[0][0],I[0][1],w))),still);m.renderOrder=2;root.add(m)}   // איים: חורים במים
  if(M.sea){const {w,h}=T.R.size,f=TERRAIN.seaPad,m=new THREE.Mesh(tFlat([[-w/2-f,-h/2-f],[w/2+f,-h/2-f],[w/2+f,h/2+f],[-w/2-f,h/2+f]],0.5,tB(M)),still);m.renderOrder=2;root.add(m)}   // הים מסביב, עם חור בצורת היבשה
  for(const s of M.springs||[]){const c=[];for(let i=0;i<24;i++){const a=i/24*6.283;c.push([s.x+Math.cos(a)*(s.r+10),s.y+Math.sin(a)*(s.r+10)])}const m=new THREE.Mesh(tFlat(c,0.9),still);m.renderOrder=2;root.add(m)}
  const sh=new THREE.MeshLambertMaterial({color:tWC(M).shallow,transparent:true,opacity:0.55,depthWrite:false});
  for(const s of M.shallow||[]){const m=new THREE.Mesh(tFlat(s,0.7),sh);m.renderOrder=2;root.add(m)}
  for(const f of M.fords||[]){const c=[];for(let i=0;i<24;i++){const a=i/24*6.283;c.push([f.x+Math.cos(a)*f.r,f.y+Math.sin(a)*f.r*0.8])}const m=new THREE.Mesh(tFlat(c,1.1),sh);m.renderOrder=3;root.add(m)}
  for(const b of M.bridges||[])root.add(tBridge(b));
  if(M.ridge)root.add(G.terr.ridge=tRidge(M.ridge));
  for(const q of M.ice||[]){const m=new THREE.Mesh(tFlat(q.pts,0.4),new THREE.MeshLambertMaterial({color:q.col,transparent:true,opacity:0.8,depthWrite:false}));m.renderOrder=1;root.add(m)}   // קרח ושלג: משטח שטוח
  // יער: עצים על רשת עם רעש, רק במקום חסום של יער (לא על שבילים וקרחות)
  const list=[],F=Object.assign({},TERRAIN.forest,M.forestPick&&{pick:M.forestPick}),BB=tB(M),bad=(x,y)=>!tBlocked(x,y)||!BB.some(B=>inPoly(x,y,B));   // forestPick: עצים משלו (לב הצל). רק על היבשה, לא מעל התהום
  for(const P_ of M.forests||[]){const b=bbox(P_);
    for(let y=b.y0;y<b.y1;y+=F.gap)for(let x=b.x0;x<b.x1;x+=F.gap){const v=hash(x*0.37,y*0.71),xx=x+(hash(x,y+3)-0.5)*F.gap*F.jit*2,yy=y+(hash(x+5,y)-0.5)*F.gap*F.jit*2;
      if(!inPoly(xx,yy,P_)||bad(xx,yy))continue;const ed=Math.min(polyDist(xx,yy,P_),lineDistAny(xx,yy,M));
      list.push({sp:F.pick[Math.floor(v*F.pick.length)%F.pick.length],x:xx,y:yy,v,mul:(ed<F.edge?0.75:1)*(0.8+hash(xx,yy)*0.45)})}}
  const Cg=TERRAIN.crag;for(const P_ of M.crags||[]){const b=bbox(P_);   // גושי צוקים: סלעים גדולים בתוך הגוש, גבוהים יותר באמצע
    for(let y=b.y0;y<b.y1;y+=Cg.gap)for(let x=b.x0;x<b.x1;x+=Cg.gap){const v=hash(x*0.53,y*0.29),xx=x+(hash(x,y+7)-0.5)*Cg.gap*0.8,yy=y+(hash(x+9,y)-0.5)*Cg.gap*0.8;
      if(!inPoly(xx,yy,P_))continue;const ed=polyDist(xx,yy,P_);list.push({sp:TERRAIN.cliff.pick[Math.floor(v*3)%3],x:xx,y:yy,v,mul:Cg.mul[0]+Math.min(1,ed/Cg.deep)*(Cg.mul[1]-Cg.mul[0])+v*0.3})}}
  // צוקים לאורך הגבול (cliffs) וקני סוף לאורך הביצה (reeds): מחוץ לקו, בשתי שורות
  const C=TERRAIN.cliff,Q=TERRAIN.pal[reg]||TERRAIN.pal.meadow,CP=Q.cliffPick||C.pick;
  for(const L of M.cliffs||[])walkLine(L,C.gap,(x,y,nx,ny,i)=>{for(const row of [0,1]){const v=hash(x+row*7,y*1.3),o=C.out[0]+(C.out[1]-C.out[0])*(row?0.85:0.25)+v*30;
    list.push({sp:CP[Math.floor(v*CP.length)%CP.length],x:x+nx*o,y:y+ny*o,v,mul:(row?1.25:0.9)+v*0.35})}});
  for(const Ms of M.mesas||[])tMesa(Ms,root,list,Q,CP,M);
  for(const D of M.dunes||[]){const m=new THREE.Mesh(tFlat(D,0.5),tDuneMat(Q));m.renderOrder=1;root.add(m)}
  const Rd=TERRAIN.reeds;for(const L of M.reeds||[])walkLine(L,Rd.gap,(x,y,nx,ny)=>{const v=hash(x,y);list.push({sp:{model:Rd.model,h:Rd.h},x:x+nx*(10+v*40),y:y+ny*(10+v*40),v,mul:0.8+v*0.5})});
  if(TR&&M.ridge){const ramp=M.ridge.ramp;walkLine(M.ridge.poly.concat([M.ridge.poly[0]]),C.gap*0.8,(x,y,nx,ny)=>{if(ramp&&(inPoly(x+nx*30,y+ny*30,ramp)||inPoly(x,y,ramp)||polyDist(x,y,ramp)<50))return;const v=hash(x*1.1,y);
    list.push({sp:C.pick[Math.floor(v*C.pick.length)%C.pick.length],x:x+nx*12,y:y+ny*12,v,mul:0.45+v*0.2})})}
  const Wl=TERRAIN.wall;for(const L of M.walls||[])walkLine(L.pts,Wl.gap,(x,y,nx,ny,i)=>{const v=hash(x*0.9,y*1.7);if(v<Wl.skip||!tB(M).some(B=>inPoly(x,y,B)))return;   // חומה: אבנים לאורך הקו, וחלק חסרות
    const sp=Wl.pick[i%Wl.pick.length];list.push({sp:Object.assign({tint:Qp.wall},sp),x:x+nx*(v-0.5)*10,y,v,mul:0.8+v*0.5})});
  for(const m of M.marks||[])tMark(m,root);
  G.terr.chunks=tInst(list,root);G.terr.n=list.length;
}
/* ציוני דרך (map.marks): מחנה (אוהלים ומדורה), חורבה (עמודים שבורים), מקדש (טבעת עמודים), מגדלור (מגדל עם אור). צורות פשוטות, ציור אחד לכל חלק */
const MARK3D={stone:'#9b9486',dark:'#6f685c',tent:['#b0874f','#8f5f3a','#c7a46a'],fire:'#ff9a3a',light:'#ffe9a0'};
function tMark(m,root){
  const S_=SIN(),g=new THREE.Group(),M_=MARK3D,mat=c=>new THREE.MeshLambertMaterial({color:c}),stone=mat(M_.stone),dark=mat(M_.dark);
  const add=(geo,ma,x,y,z,ry=0)=>{const o=new THREE.Mesh(geo,ma);o.position.set(x,y,z);o.rotation.y=ry;g.add(o);return o};
  const col=(r,h,ma,x,z)=>add(new THREE.CylinderGeometry(r*0.85,r,h,8),ma,x,h/2,z);
  if(m.kind==='camp'){for(let i=0;i<3;i++){const a=i*2.1+0.4;add(new THREE.ConeGeometry(34,52,4),mat(M_.tent[i]),Math.cos(a)*70,26,Math.sin(a)*70,a)}
    add(new THREE.CylinderGeometry(16,18,6,8),dark,0,3,0);const f=add(new THREE.ConeGeometry(9,20,6),new THREE.MeshLambertMaterial({color:M_.fire,emissive:M_.fire,emissiveIntensity:0.9}),0,14,0)}
  else if(m.kind==='ruin'){for(let i=0;i<5;i++){const a=i*1.26,h=40+hash(i,m.x)*90;col(14,h,i%2?stone:dark,Math.cos(a)*70,Math.sin(a)*70)}add(new THREE.BoxGeometry(110,14,40),stone,20,7,-30,0.4)}
  else if(m.kind==='temple'){add(new THREE.CylinderGeometry(110,118,10,16),dark,0,5,0);for(let i=0;i<6;i++){const a=i*1.047;col(11,i===2?45:85,stone,Math.cos(a)*88,Math.sin(a)*88)}}
  else if(m.kind==='lighthouse'){col(30,40,dark,0,0);add(new THREE.CylinderGeometry(16,26,150,10),stone,0,110,0);
    add(new THREE.SphereGeometry(16,10,8),new THREE.MeshLambertMaterial({color:M_.light,emissive:M_.light,emissiveIntensity:1}),0,195,0)}
  else return;
  g.position.set(m.x,hAt(m.x,m.y)/COS(),m.y/S_);g.scale.set(1,1,1/S_);root.add(g);
}
/* רמת סלע (map.mesas, המדבר): גג שטוח ונמוך באותו צבע כמו הצוק, סלעים לאורך השפה (לא בתוך נקיק שחותך אותה) ומעט סלעים על הגג.
   נמוכה בכוונה (TERRAIN.mesa.h): המצלמה מסתכלת מדרום, ורמה גבוהה מדרום לשחקן הייתה מסתירה אותו בקניון */
function tMesa(Ms,root,list,Q,CP,M){
  const S_=SIN(),Z=TERRAIN.mesa,sh=new THREE.Shape(Ms.map(p=>new THREE.Vector2(p[0],-p[1]/S_)));
  const g=new THREE.ExtrudeGeometry(sh,{depth:Z.h,bevelEnabled:false});g.rotateX(-Math.PI/2);g.computeBoundingSphere();
  root.add(new THREE.Mesh(g,[new THREE.MeshLambertMaterial({color:Q.mesaTop||Q.rock}),new THREE.MeshLambertMaterial({color:Q.mesa||Q.cliff})]));
  const cut=(x,y)=>lineDistAny(x,y,M)<40;
  walkLine(Ms.concat([Ms[0]]),Z.gap,(x,y,nx,ny)=>{if(cut(x,y))return;const v=hash(x*0.9,y*1.7);
    list.push({sp:CP[Math.floor(v*CP.length)%CP.length],x:x-nx*14,y:y-ny*14,v,mul:0.5+v*0.3})});
  const b=bbox(Ms);for(let y=b.y0;y<b.y1;y+=Z.inner)for(let x=b.x0;x<b.x1;x+=Z.inner){const v=hash(x*0.31,y*0.53),xx=x+(v-0.5)*Z.inner*0.8,yy=y+(hash(y,x)-0.5)*Z.inner*0.8;
    if(!inPoly(xx,yy,Ms)||polyDist(xx,yy,Ms)<60||cut(xx,yy)||v<0.45)continue;list.push({sp:CP[Math.floor(v*7)%CP.length],x:xx,y:yy,v,mul:0.35+v*0.3,lift:Z.h})}
}
// ים הדיונות: חול בהיר עם אדוות, ושקוף קצת כדי שהקרקע תיראה מתחת
function tDuneMat(Q){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,
  uniforms:{c1:{value:new THREE.Color(Q.dune)},c2:{value:new THREE.Color(Q.duneDark||Q.dune)}},
  vertexShader:'varying vec2 vW;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform vec3 c1,c2;varying vec2 vW;
    void main(){float r=sin(vW.x*0.035+sin(vW.y*0.012)*3.0+vW.y*0.018)*0.5+0.5;float big=sin(vW.x*0.006+vW.y*0.004)*0.5+0.5;
      gl_FragColor=vec4(mix(c2,c1,0.35+0.4*r*big+0.25*big),0.7);
      #include <colorspace_fragment>
    }`})}
const lineDistAny=(x,y,M)=>{let m=1e9;for(const t of M.trails||[])if(t.cut)m=Math.min(m,lineDist(x,y,t.pts)-t.w/2);return m};
// הולך לאורך קו כל gap פיקסלים, עם הנורמל כלפי חוץ (שמאלה מכיוון ההליכה, כמו שהגבול מצויר: עם כיוון השעון)
function walkLine(L,gap,f){let rest=0,k=0;for(let i=1;i<L.length;i++){const [ax,ay]=L[i-1],[bx,by]=L[i],d=Math.hypot(bx-ax,by-ay)||1,nx=(by-ay)/d,ny=-(bx-ax)/d;
  for(let s=rest;s<d;s+=gap){const t=s/d;f(ax+(bx-ax)*t,ay+(by-ay)*t,nx,ny,k++);rest=s+gap-d}}}
// כל פריים: זרימת המים, ואריחים רחוקים לא מצוירים
function terrain3dTick(G){
  const Tr=G.terr;if(!Tr)return;const t=performance.now()/1000;for(const m of Tr.water)m.uniforms.t.value=t;
  const cx=S.cam?S.cam.x:P.x,cy=S.cam?S.cam.y:P.y,cl=TERRAIN.cull+TERRAIN.chunk*0.7;
  if(Tr.ridge&&typeof GROUND!=='undefined'&&GROUND.mat){const gm=GROUND.mat();if(gm&&Tr.ridge.material!==gm)Tr.ridge.material=gm}   // אותה קרקע אפויה כמו מסביב
  for(const ch of Tr.chunks)ch.visible=Math.abs(ch.userData.cx-cx)<cl&&Math.abs(ch.userData.cy-cy)<cl;
}
