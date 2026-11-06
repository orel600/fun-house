/* משחקי השאול: המראה (אוראל, 2.11.2026). הלוגיקה ב-moba.js לא יודעת מה כתוב כאן.
   1. אייקונים: לכל סקיל, ערכה ופקודה צורה פשוטה ב-SVG (24×24), כמו DMG.types[...].icon. אותה צורה בכפתור (mbSvg) ועל הקנבס (mbIcon, דרך Path2D).
      f: צורות מלאות. s: קווים. הצבע הוא תמיד סוג הנזק של הסקיל (או צבע הקבוצה), לא צבע משלו.
   2. הרצפה: אבן כהה סגולה-אדומה, שביל באמצע הנתיב, סדקי לבה לאורך הקצוות, ועיגול כחול/אדום בבסיס של כל קבוצה.
      מצוירת פעם אחת לקנבס נסתר (mbFloorCanvas), ומשמשת גם בדו-ממד (mbFloor2d) וגם כטקסטורה בתלת-ממד (moba3d.js). הלבה בשכבה נפרדת שפועמת.
   המספרים ב-MBLOOK */
const MBLOOK={
  // המצלמה במוד (אוראל, 3.11: "כיוון המצלמה קרוב מדי", כמו ב-MLBB): רחוקה וגבוהה יותר. zoom: מתחת ל-1 רואים יותר (0.58 = פי 1.7 לרוחב). tilt: מעלות מעל הקרקע.
  // ui: פסי החיים, התגים והמספרים מעל הדמויות גדלים בחזרה חלקית, כדי שיהיו קריאים גם כשהמצלמה רחוקה
  cam:{zoom:0.58,tilt:52,ui:0.8},
  floor:{x0:-2200,x1:2200,y0:-940,y1:940,px:0.9,rim:34,   // השטח שמצויר (יחידות משחק), ופיקסלים לכל יחידה (עד 4096 לצד). rim: שפת אבן מחוץ לנתיב
    abyss:'#0e070d',stone:['#4a3040','#432a3a','#503448','#3d2634','#56364a'],side:['#352536','#302231','#3b293d','#2d1e2a'],mortar:'#170c14',path:'#7a585a',
    rimCol:'#4a3646',cliff:['#3a2833','#1a0f16'],lava:'#FF6A2A',lavaHot:'#FFC861',rune:'#8C5A7A',moss:'#24302c',tint:0.13,drop:90},   // tint: כמה צבע הקבוצה צובע את החצי שלה. drop: כמה עמוקה התהום בתלת-ממד
  // המפה (רק מראה, בלי השפעה על המשחק): נתיב ראשי באמצע (|y|<mid), שבילי עקיפה בצדדים (side), ורצועות שיחים ביניהם עם פתחים (bush)
  map:{mid:190,side:[310,650],bush:{y:250,seg:[[-1620,-1020],[-470,470],[1020,1620]],gap:50,r:[26,40]},
    patch:{y:[440,560],xs:[150,750,1350],n:5},   // שיחים בשטח הפתוח בצדדים
    rocks:{every:150,r:[22,46]},braziers:[[420,470],[1150,470],[1600,150]],banners:[[1700,190],[1700,-190]],
    bushCol:['#2e5a5e','#3a5f7a','#2b4658'],bushLit:'#7FE0B8',rockCol:['#5b4c66','#4b3e57','#6a5a72']},
  pulse:{speed:1.6,lo:0.55,hi:1},   // הלבה פועמת: כמה מהר, ובין איזו בהירות לאיזו
  mini:{w:300,vw:0.36,h:46,top:36,fade:0.3},   // המפה הקטנה (פיקסלים של המסך): רוחב מקסימלי, חלק מרוחב המסך, גובה, מרחק מלמעלה. fade: כמה היא שקופה כשיש מתחתיה פס חיים
};
// המצלמה: רק במשחקי השאול. עוטף את camera.js מבחוץ, כך שהזירה, הכפר והעולם לא משתנים
(function(){const z=camZoom,t=camTilt,on=()=>typeof S!=='undefined'&&S&&!!S.mb;
  camZoom=function(){return on()?MBLOOK.cam.zoom:z()};
  camTilt=function(){return on()?MBLOOK.cam.tilt*Math.PI/180:t()}})();
// כמה מגדילים את מה שמצויר מעל הדמויות (פסי חיים, תגים, מספרים), כדי שהמצלמה הרחוקה לא תהפוך אותם לזעירים
const mbUiK=()=>Math.max(1,Math.pow(1/ZOOM,MBLOOK.cam.ui));

/* ---- אייקונים ---- */
const MB_SVG={
  anvil:{f:'M2 6h14c0 2.5 2.5 4 6 4v3h-7l-1.5 2.5H17V19H5v-3.5h3.5L7 12.5C4 12 2 9.5 2 6z'},
  taunt:{f:'M2 9.5v5h3l9 5.5V4L5 9.5z',s:'M17.5 8.5 21 6M18 12h4M17.5 15.5 21 18'},
  wall:{f:'M2 4h9v4.5H2zM13 4h9v4.5h-9zM2 10h4v4.5H2zM8 10h8v4.5H8zM18 10h4v4.5h-4zM2 16h9v4.5H2zM13 16h9v4.5h-9z'},
  charge:{f:'M10 4.5 20 12l-10 7.5V15H5V9h5z',s:'M1.5 8.5h2M1 12h2M1.5 15.5h2'},
  spin:{f:'M11 7h2v10h-2zM8 16h8v2H8zM3 4.5l5.5 1-4 4z',s:'M7 6.5A8 8 0 1 1 4.6 10'},
  rage:{f:'M12 1.5l2.6 6 6.4-1.3-4 5.3 4 5.3-6.4-1.3L12 21.5l-2.6-6-6.4 1.3 4-5.3-4-5.3 6.4 1.3z'},
  pierce:{f:'M22 2l-2.2 7.8-5.6-5.6z',s:'M3 21 17 7M5 12.5l3 1.5-1.5 3 3 1.5'},
  leap:{f:'M22.5 9.5l-.8 6.5-5.5-3.6z',s:'M3 19C5 9 14 5 20 12M1.5 21.5h7'},
  rain:{f:'M3 13.5h6L6 19zM9 16h6l-3 5.5zM15 13.5h6L18 19z',s:'M6 2.5v11M12 4.5v11.5M18 2.5v11'},
  wave:{f:'M1.5 17c3-7 7.5-11 13-11 4 0 6 2 7.5 4.5-3.5-1-6.5 0-6.5 3 0 2 2 3.5 6.5 3.5v4.5h-20.5z'},
  heal:{f:'M9 2.5h6v6.5h6.5v6H15v6.5H9V15H2.5V9H9z'},
  blizzard:{s:'M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 3.5l3 3 3-3M9 20.5l3-3 3 3M2.5 10.5l4-1.2-1-4M21.5 13.5l-4 1.2 1 4M2.5 13.5l4 1.2-1 4M21.5 10.5l-4-1.2 1-4'},
  // פקודות לחברים
  attack:{f:'M2.5 2.5H7l9 9-2.5 2.5-9-9z M21.5 2.5V7l-9 9-2.5-2.5 9-9z',s:'M12.5 19.5l7-7M4.5 12.5l7 7M17.5 17.5l3 3M6.5 17.5l-3 3'},
  back:{f:'M12 2l8.5 3v6.5c0 5-3.6 9-8.5 11-4.9-2-8.5-6-8.5-11V5z'},
  // הערכות (מעל הראש, בחלון הבחירה ובסוף)
  k_tank:{f:'M3 3h12v7.5H3zM7.5 10.5h3V22h-3z',s:'M15 6.75h4'},
  k_warrior:{f:'M17 2h5v5L9.5 19.5l-5-5z M2.5 15l6.5 6.5-1.5 1.5L1 16.5z'},
  k_hunter:{s:'M6 2.5c9 3 9 16 0 19M6 2.5v19M3 12h17',f:'M22.5 12 18 9v6z'},
  k_mage:{f:'M12 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM7 19h10l1.5 3h-13z'},
  skull:{eo:1,f:'M12 2.5a8.5 8.5 0 0 0-8.5 8.5c0 3 1.5 5 3.5 6v4h10v-4c2-1 3.5-3 3.5-6A8.5 8.5 0 0 0 12 2.5zM8.5 9.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM15.5 9.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4z'},
};
// HTML: <svg> בצבע של currentColor, עם קו כהה מסביב כדי שיהיה קריא על כל רקע
function mbSvg(id,cls){
  const I=MB_SVG[id]||MB_SVG.k_tank;
  return '<svg class="'+(cls||'mbski')+'" viewBox="0 0 24 24" aria-hidden="true">'+
    (I.f?'<path d="'+I.f+'" fill="currentColor" fill-rule="'+(I.eo?'evenodd':'nonzero')+'" stroke="#0B0D14" stroke-width="1" stroke-linejoin="round" paint-order="stroke"/>':'')+
    (I.s?'<path d="'+I.s+'" fill="none" stroke="#0B0D14" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/><path d="'+I.s+'" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>':'')+'</svg>';
}
// קנבס: אותו אייקון במרכז (x,y), בגודל size
const MB_P2D={};
function mbIcon(id,x,y,size,col){
  const I=MB_SVG[id];if(!I||typeof Path2D==='undefined')return;
  const P=MB_P2D[id]||(MB_P2D[id]={f:I.f&&new Path2D(I.f),s:I.s&&new Path2D(I.s)}),k=size/24;
  ctx.save();ctx.translate(x-size/2,y-size/2);ctx.scale(k,k);ctx.lineCap=ctx.lineJoin='round';
  if(P.f){ctx.strokeStyle='#0B0D14';ctx.lineWidth=2;ctx.stroke(P.f);ctx.fillStyle=col;ctx.fill(P.f,I.eo?'evenodd':'nonzero')}
  if(P.s){ctx.strokeStyle='#0B0D14';ctx.lineWidth=4.4;ctx.stroke(P.s);ctx.strokeStyle=col;ctx.lineWidth=2.4;ctx.stroke(P.s)}
  ctx.restore();
}
// תג מעל הראש של גיבור: עיגול כהה עם טבעת בצבע הקבוצה, והאייקון של הערכה בצבע סוג הנזק שלה
function mbBadge(u,x,y){
  const r=11,col=MOBA.team[u.team];
  ctx.fillStyle='rgba(14,16,26,0.88)';ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();
  ctx.strokeStyle=u.me?C.gold:col;ctx.lineWidth=2;ctx.stroke();
  mbIcon('k_'+u.kit,x,y,15,dtCol(MBKIT[u.kit].dt));
}

/* ---- המפה: שיחים, אבנים, לפידים ודגלים (רק מראה). אותה רשימה לדו-ממד, לתלת-ממד ולמפה הקטנה ---- */
let MB_DECOR=null;
function mbDecor(){
  if(MB_DECOR)return MB_DECOR;
  const M=MBLOOK.map,L=MOBA.lane,F=MBLOOK.floor,out=[],R=(a,b)=>hash(a*0.53+2.1,b*0.77+5.3);
  // שיחים: רצועה בין הנתיב הראשי לשבילי העקיפה, עם פתחים לעבור בהם
  for(const sg of [-1,1])for(const [a,b] of M.bush.seg)for(let x=a,i=0;x<=b;x+=M.bush.gap,i++){
    if(i%5===2)continue;   // פתח
    const r=M.bush.r[0]+(M.bush.r[1]-M.bush.r[0])*R(x,sg);out.push({k:'bush',x:x+(R(sg,x)-0.5)*18,y:sg*(M.bush.y+(R(x,i)-0.5)*20),r,v:R(i,x)})}
  // כתמי שיחים בשטח הפתוח בצדדים (אותו דבר לשתי הקבוצות)
  for(const sg of [-1,1])for(const sx of [-1,1])for(const [xi,px] of M.patch.xs.entries())for(let i=0;i<M.patch.n;i++){const y0=M.patch.y[xi%2],a=i*2.4+xi;
    out.push({k:'bush',x:sx*px+Math.cos(a)*34*Math.sqrt(i),y:sg*(y0+Math.sin(a)*22*Math.sqrt(i)),r:M.bush.r[0]+(M.bush.r[1]-M.bush.r[0])*R(i,xi+sg),v:R(xi*7+i,sx*sg)})}
  // אבנים על השפה, חצי בחוץ: מסגרת לנתיב, בלי לחסום
  for(const sg of [-1,1])for(let x=-L.len,i=0;x<=L.len;x+=M.rocks.every,i++){const r=M.rocks.r[0]+(M.rocks.r[1]-M.rocks.r[0])*R(i,sg*3);
    out.push({k:'rock',x:x+(R(x,sg)-0.5)*60,y:sg*(L.half+F.rim*0.4+r*0.55),r,v:R(sg,i)})}
  // מאחורי הבסיסים: ערימות אבנים גדולות
  for(const sx of [-1,1])for(let i=0;i<7;i++){const r=30+R(i,sx)*22;out.push({k:'rock',x:sx*(L.len+20+R(sx,i)*40),y:(i-3)*115+(R(i,i)-0.5)*40,r,v:R(sx*2,i)})}
  // לפידים בשבילים, ודגלים ליד הבסיס. בצבע הקבוצה של החצי שבו הם עומדים
  for(const sx of [-1,1]){for(const [x,y] of M.braziers)for(const sy of [-1,1])out.push({k:'fire',x:sx*x,y:sy*y,r:18,team:sx>0?1:0,v:R(x,sy)});
    for(const [x,y] of M.banners)out.push({k:'flag',x:sx*x,y,r:16,team:sx>0?1:0,v:R(y,sx)})}
  return MB_DECOR=out;
}

/* ---- הרצפה ---- */
let MB_FLOOR=null;   // {stone, glow}: שני קנבסים, מצוירים פעם אחת
function mbFloorCanvas(){
  if(MB_FLOOR)return MB_FLOOR;
  const F=MBLOOK.floor,M=MBLOOK.map,L=MOBA.lane,s=F.px,Wd=Math.min(4096,Math.round((F.x1-F.x0)*s)),Ht=Math.min(4096,Math.round((F.y1-F.y0)*s));
  const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
  const st=mk(Wd,Ht),g=st.getContext('2d'),gl=mk(Math.round(Wd/2),Math.round(Ht/2)),q=gl.getContext('2d');
  g.setTransform(Wd/(F.x1-F.x0),0,0,Ht/(F.y1-F.y0),-F.x0*Wd/(F.x1-F.x0),-F.y0*Ht/(F.y1-F.y0));
  q.setTransform(gl.width/(F.x1-F.x0),0,0,gl.height/(F.y1-F.y0),-F.x0*gl.width/(F.x1-F.x0),-F.y0*gl.height/(F.y1-F.y0));
  const R=(a,b)=>hash(a*0.37+1.3,b*0.91+7.1);   // אקראי קבוע: אותה רצפה בכל פעם
  const A=L.half+F.rim,x0=-L.len-F.rim,x1=L.len+F.rim;   // A: הקצה של שפת האבן
  // תהום מסביב, עם זוהר לבה עמום מתחת לשפה
  g.fillStyle=F.abyss;g.fillRect(F.x0,F.y0,F.x1-F.x0,F.y1-F.y0);
  for(const sg of [-1,1]){const gr=g.createLinearGradient(0,sg*A,0,sg*F.y1);
    gr.addColorStop(0,'#4a160e');gr.addColorStop(0.3,'#22090b');gr.addColorStop(1,F.abyss);g.fillStyle=gr;g.fillRect(F.x0,Math.min(sg*A,sg*F.y1),F.x1-F.x0,F.y1-A)}
  // אבני ריצוף בשורות, באורכים שונים. שבילי העקיפה בצדדים: אבן כהה יותר
  const rowH=52;
  for(let r=0,y=-A;y<A;r++,y+=rowH){let x=x0-R(r,0)*80,i=0;const h=Math.min(rowH,A-y),yc=Math.abs(y+h/2),pal=yc>M.side[0]-20?F.side:F.stone;
    while(x<x1){const w=64+R(r,i)*86,c=pal[Math.floor(R(i,r)*pal.length)];
      g.fillStyle=F.mortar;g.fillRect(x,y,w,h);
      g.fillStyle=c;g.fillRect(x+2.5,y+2.5,w-5,h-5);
      g.fillStyle='rgba(255,255,255,0.05)';g.fillRect(x+2.5,y+2.5,w-5,3.5);   // אור על הקצה העליון
      g.fillStyle='rgba(0,0,0,0.18)';g.fillRect(x+2.5,y+h-6,w-5,3.5);         // צל על הקצה התחתון: עומק
      if(R(r*3,i)>0.82){g.strokeStyle='rgba(10,4,8,0.55)';g.lineWidth=1.5;g.beginPath();const cx=x+w*R(i,r*2);g.moveTo(cx,y+3);g.lineTo(cx+8,y+h*0.5);g.lineTo(cx-4,y+h-4);g.stroke()}   // סדק
      x+=w;i++}}
  // צבע הקבוצה: הצד הכחול קר והאדום חם, ומתערבבים באמצע
  {const gr=g.createLinearGradient(x0,0,x1,0),[b,rd]=MOBA.team,a=Math.round(F.tint*255).toString(16).padStart(2,'0');
    gr.addColorStop(0,b+a);gr.addColorStop(0.42,b+'00');gr.addColorStop(0.58,rd+'00');gr.addColorStop(1,rd+a);g.fillStyle=gr;g.fillRect(x0,-A,x1-x0,A*2)}
  // הנתיב הראשי: אבן שחוקה ובהירה יותר, עם קו גבול. ושבילי העקיפה: פס שחוק דק באמצע
  const pg=g.createLinearGradient(0,-M.mid,0,M.mid);
  pg.addColorStop(0,'rgba(122,88,90,0)');pg.addColorStop(0.25,'rgba(122,88,90,0.38)');pg.addColorStop(0.75,'rgba(122,88,90,0.38)');pg.addColorStop(1,'rgba(122,88,90,0)');
  g.fillStyle=pg;g.fillRect(x0,-M.mid,x1-x0,M.mid*2);
  g.setLineDash([26,30]);g.strokeStyle='rgba(236,210,200,0.12)';g.lineWidth=4;g.beginPath();g.moveTo(-L.len,0);g.lineTo(L.len,0);g.stroke();g.setLineDash([]);
  for(const sg of [-1,1]){const yc=sg*(M.side[0]+M.side[1])/2,sp=g.createLinearGradient(0,yc-50,0,yc+50);
    sp.addColorStop(0,'rgba(122,88,90,0)');sp.addColorStop(0.5,'rgba(122,88,90,0.26)');sp.addColorStop(1,'rgba(122,88,90,0)');g.fillStyle=sp;g.fillRect(-L.len+120,yc-50,(L.len-120)*2,100)}
  // אדמה עם טחב מתחת לרצועות השיחים
  for(const sg of [-1,1])for(const [a,b] of M.bush.seg){const y=sg*M.bush.y,gr=g.createLinearGradient(0,y-42,0,y+42);
    gr.addColorStop(0,F.moss+'00');gr.addColorStop(0.5,F.moss+'CC');gr.addColorStop(1,F.moss+'00');g.fillStyle=gr;g.fillRect(a-40,y-42,b-a+80,84)}
  // צללים רכים: מתחת לכל שיח, אבן, לפיד, מגדל ובסיס (האור בא מלמעלה-שמאלה, אז הצל זז קצת ימינה-למטה)
  const blob=(x,y,r,a)=>{const gr=g.createRadialGradient(x+r*0.25,y+r*0.2,0,x+r*0.25,y+r*0.2,r*1.35);gr.addColorStop(0,'rgba(0,0,0,'+a+')');gr.addColorStop(0.55,'rgba(0,0,0,'+a*0.55+')');gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gr;g.beginPath();g.ellipse(x+r*0.25,y+r*0.2,r*1.35,r*1.1,0,0,7);g.fill()};
  for(const d of mbDecor())if(Math.abs(d.y)<A+40)blob(d.x,d.y,d.r*(d.k==='bush'?1.1:1),d.k==='bush'?0.42:0.5);
  for(const tm of [0,1]){for(const x of MOBA.towers)blob((tm?1:-1)*x,0,MOBA.tower.r*1.6,0.55);blob((tm?1:-1)*MOBA.base.x,0,MOBA.base.r*1.5,0.5)}
  // עומק בשוליים: האבן מתכהה לאט לכיוון השפה
  for(const sg of [-1,1]){const gr=g.createLinearGradient(0,sg*(L.half-60),0,sg*A);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,0.45)');g.fillStyle=gr;g.fillRect(x0,Math.min(sg*(L.half-60),sg*A),x1-x0,F.rim+60)}
  // שפת האבן: אבני גבול בהירות עם קו אור, מחוץ לשטח שהולכים בו
  for(const sg of [-1,1]){const y=sg>0?L.half:-A;g.fillStyle=F.mortar;g.fillRect(x0,y,x1-x0,F.rim);
    for(let x=x0,i=0;x<x1;i++){const w=46+R(i,sg*5)*40;g.fillStyle=F.rimCol;g.fillRect(x+2,y+3,w-4,F.rim-6);g.fillStyle='rgba(255,230,220,0.09)';g.fillRect(x+2,sg>0?y+3:y+F.rim-7,w-4,4);x+=w}
    g.fillStyle='rgba(0,0,0,0.5)';g.fillRect(x0,sg>0?L.half:-L.half-3,x1-x0,3)}
  // עיגולי הבסיס: כחול ואדום, עם טבעת רונות וזוהר
  for(const tm of [0,1]){const bx=(tm?1:-1)*MOBA.base.x,r=MOBA.base.healR,col=MOBA.team[tm];
    g.save();g.translate(bx,0);g.scale(1,0.9);
    const rg=g.createRadialGradient(0,0,r*0.2,0,0,r);rg.addColorStop(0,col+'40');rg.addColorStop(1,col+'14');g.fillStyle=rg;g.beginPath();g.arc(0,0,r,0,7);g.fill();
    g.strokeStyle=col+'AA';g.lineWidth=6;g.beginPath();g.arc(0,0,r-6,0,7);g.stroke();
    g.strokeStyle=col+'55';g.lineWidth=3;g.beginPath();g.arc(0,0,r-24,0,7);g.stroke();
    g.fillStyle=col+'88';for(let i=0;i<16;i++){const a=i/16*Math.PI*2;g.save();g.rotate(a);g.fillRect(r-19,-5,8,10);g.restore()}
    g.restore();
    q.save();q.translate(bx,0);q.scale(1,0.9);q.strokeStyle=col;q.globalAlpha=0.5;q.lineWidth=8;q.beginPath();q.arc(0,0,r-6,0,7);q.stroke();q.restore()}
  // עיגול באמצע הנתיב
  g.strokeStyle=F.rune+'66';g.lineWidth=3;g.beginPath();g.ellipse(0,0,110,96,0,0,7);g.stroke();g.strokeStyle=F.rune+'33';g.lineWidth=2;g.beginPath();g.ellipse(0,0,140,122,0,0,7);g.stroke();
  // סדקי לבה: לאורך השפה, וכמה שנכנסים קצת פנימה. בקנבס האבן כהים-אדומים, ובשכבת הזוהר בוהקים
  const crack=(pts,w)=>{for(const [c,lw,a] of [[g,w+3,'#2a0805'],[g,w,'#a8341a']]){c.strokeStyle=a;c.lineWidth=lw;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke()}
    q.lineCap=q.lineJoin='round';for(const [lw,col,a] of [[w*4,F.lava,0.35],[w*1.6,F.lava,0.9],[w*0.6,F.lavaHot,1]]){q.globalAlpha=a;q.strokeStyle=col;q.lineWidth=lw;q.beginPath();pts.forEach((p,i)=>i?q.lineTo(p[0],p[1]):q.moveTo(p[0],p[1]));q.stroke()}q.globalAlpha=1};
  for(const sg of [-1,1]){
    const edge=[];for(let x=x0;x<=x1;x+=34)edge.push([x,sg*(A+4+R(x,sg)*8)]);crack(edge,3.5);   // הסדק הארוך לאורך השפה
    for(let i=0;i<30;i++){const cx=x0+(i+R(i,sg))*((x1-x0)/30);let x=cx,y=sg*(L.half-4);const pts=[[x,y]],n=2+Math.floor(R(sg,i)*2);
      for(let k=0;k<n;k++){x+=(R(i,k)-0.5)*40;y-=sg*(14+R(k,i)*26);pts.push([x,y])}crack(pts,1.8)}
    // לבה בתהום: נהר זוהר מעבר לשפה
    for(let x=F.x0;x<F.x1;x+=140){const y=sg*(A+90+R(x,1)*120),pts=[[x,y]];for(let k=1;k<5;k++)pts.push([x+k*35,y+(R(x,k)-0.5)*40]);crack(pts,2.5)}}
  // זוהר עדין מתחת ללפידים
  for(const d of mbDecor())if(d.k==='fire'){const gr=q.createRadialGradient(d.x,d.y,0,d.x,d.y,90);gr.addColorStop(0,'rgba(255,150,70,0.5)');gr.addColorStop(1,'rgba(255,150,70,0)');q.fillStyle=gr;q.fillRect(d.x-90,d.y-90,180,180)}
  return MB_FLOOR={stone:st,glow:gl};
}
const mbPulse=()=>{const P=MBLOOK.pulse;return P.lo+(P.hi-P.lo)*(0.5+0.5*Math.sin((MB?MB.t:0)*P.speed))};
// דו-ממד: הרצפה בקואורדינטות המשחק (הקנבס כבר מוזז למצלמה), מתחתיה צוק מתחת לשפה הקרובה, ומעליה השיחים, האבנים והלפידים
function mbFloor2d(){
  const F=MBLOOK.floor,fl=mbFloorCanvas(),w=F.x1-F.x0,h=F.y1-F.y0,A=MOBA.lane.half+F.rim,L=MOBA.lane;
  ctx.fillStyle=F.abyss;ctx.fillRect(F.x0-3000,F.y0-2000,w+6000,h+4000);   // תהום גם מעבר לקצה הקנבס, במסך רחב
  ctx.drawImage(fl.stone,F.x0,F.y0,w,h);
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=mbPulse()*0.8;ctx.drawImage(fl.glow,F.x0,F.y0,w,h);ctx.restore();
  const cl=ctx.createLinearGradient(0,A,0,A+56);cl.addColorStop(0,F.cliff[0]);cl.addColorStop(1,'rgba(14,7,13,0)');ctx.fillStyle=cl;ctx.fillRect(-L.len-F.rim,A,(L.len+F.rim)*2,56);   // הצוק: עומק מתחת לשפה
}
// הקישוטים בדו-ממד, רק מה שעל המסך. בתלת-ממד הם מודלים (moba3d.js)
function mbDecor2d(ox,oy){
  const M=MBLOOK.map,t=MB?MB.t:0;
  for(const d of mbDecor()){if(!onScreen(d.x+ox,d.y+oy,80))continue;const v=d.v;
    if(d.k==='bush'){for(let i=0;i<4;i++){const a=i*1.7+v*6,rr=d.r*(0.55+0.2*hash(i,v)),x=d.x+Math.cos(a)*d.r*0.45,y=d.y-d.r*0.25+Math.sin(a)*d.r*0.25;
        ctx.fillStyle=M.bushCol[(i+Math.floor(v*3))%M.bushCol.length];ctx.beginPath();ctx.arc(x,y,rr,0,7);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.07)';ctx.beginPath();ctx.arc(x-rr*0.3,y-rr*0.35,rr*0.45,0,7);ctx.fill()}
      ctx.fillStyle=M.bushLit;for(let i=0;i<3;i++){ctx.globalAlpha=0.5+0.4*Math.sin(t*2+i+v*9);ctx.beginPath();ctx.arc(d.x+(hash(v,i)-0.5)*d.r,d.y-d.r*0.5+(hash(i,v)-0.5)*d.r*0.5,2,0,7);ctx.fill()}ctx.globalAlpha=1}
    else if(d.k==='rock'){const c=M.rockCol[Math.floor(v*M.rockCol.length)%M.rockCol.length];
      ctx.fillStyle='#160d14';ctx.beginPath();ctx.ellipse(d.x,d.y,d.r,d.r*0.7,0,0,7);ctx.fill();
      ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(d.x-d.r*0.95,d.y);ctx.lineTo(d.x-d.r*0.6,d.y-d.r*0.9);ctx.lineTo(d.x+d.r*0.2,d.y-d.r*1.1);ctx.lineTo(d.x+d.r*0.9,d.y-d.r*0.4);ctx.lineTo(d.x+d.r*0.85,d.y+d.r*0.1);ctx.lineTo(d.x-d.r*0.3,d.y+d.r*0.3);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.12)';ctx.beginPath();ctx.moveTo(d.x-d.r*0.6,d.y-d.r*0.9);ctx.lineTo(d.x+d.r*0.2,d.y-d.r*1.1);ctx.lineTo(d.x,d.y-d.r*0.5);ctx.fill()}
    else if(d.k==='fire'){const col=MOBA.team[d.team];ctx.fillStyle='#2a2030';ctx.fillRect(d.x-7,d.y-34,14,34);ctx.fillStyle='#3e3346';ctx.fillRect(d.x-13,d.y-40,26,8);
      const f=0.8+0.2*Math.sin(t*9+v*20);ctx.fillStyle=col;ctx.globalAlpha=0.35;ctx.beginPath();ctx.arc(d.x,d.y-50,20*f,0,7);ctx.fill();ctx.globalAlpha=1;
      ctx.fillStyle=C.ember;ctx.beginPath();ctx.moveTo(d.x-9,d.y-40);ctx.quadraticCurveTo(d.x,d.y-72*f,d.x+9,d.y-40);ctx.fill();ctx.fillStyle=C.gold;ctx.beginPath();ctx.moveTo(d.x-4,d.y-40);ctx.quadraticCurveTo(d.x,d.y-58*f,d.x+4,d.y-40);ctx.fill()}
    else if(d.k==='flag'){const col=MOBA.team[d.team],sx=d.team?-1:1;ctx.fillStyle='#2a2030';ctx.fillRect(d.x-2,d.y-80,4,80);
      ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(d.x+sx*2,d.y-78);ctx.lineTo(d.x+sx*30,d.y-72+Math.sin(t*3+v*9)*3);ctx.lineTo(d.x+sx*26,d.y-52);ctx.lineTo(d.x+sx*2,d.y-50);ctx.fill()}
  }
}

/* ---- המפה הקטנה: למעלה, בפיקסלים של המסך, ונעשית שקופה כשיש מתחתיה פס חיים של גיבור או מבנה ---- */
function mbMiniBox(ox,oy){
  const K=MBLOOK.mini,sw=innerWidth,mw=Math.min(K.w,sw*K.vw),x0=sw/2-mw/2,y0=Math.max(K.top,innerHeight*0.1);
  // מה מצויר מתחת: הפס והתג של גיבור או של מבנה (בפיקסלים של המסך, אחרי הזום)
  let under=false;const z=ZOOM,k=mbUiK();
  for(const u of MB.u){if(u.dead||u.k==='minion')continue;const sx=(u.x+ox)*z,sy=(u.y+oy)*z,top=sy-(u.k==='hero'?78*z+30*k:u.k==='base'?150*z:120*z);
    if(sx>x0-30&&sx<x0+mw+30&&top<y0+K.h+6&&sy>y0-6){under=true;break}}
  return {x0,y0,mw,mh:K.h,a:under?K.fade:1};
}
// המפה הקטנה עצמה: הנתיב, השבילים והשיחים, המבנים, הגיבורים (נקודה גדולה), החיילים, והחלק שרואים על המסך
function mbMini(ox,oy){
  const M=MB,L=MOBA.lane,G=MBLOOK.map,{x0,y0,mw,mh,a}=mbMiniBox(ox,oy),sx=x=>x0+(x+L.len)/(L.len*2)*mw,sy=y=>y0+mh/2+y/L.half*(mh/2-3);
  ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.globalAlpha=a;
  ctx.fillStyle='rgba(14,10,20,0.82)';ctx.fillRect(x0-4,y0-4,mw+8,mh+8);ctx.strokeStyle='rgba(244,199,79,0.45)';ctx.lineWidth=1;ctx.strokeRect(x0-4.5,y0-4.5,mw+9,mh+9);
  const gr=ctx.createLinearGradient(x0,0,x0+mw,0);gr.addColorStop(0,MOBA.team[0]+'33');gr.addColorStop(0.5,'rgba(120,90,100,0.18)');gr.addColorStop(1,MOBA.team[1]+'33');ctx.fillStyle=gr;ctx.fillRect(x0,y0,mw,mh);
  ctx.fillStyle='rgba(236,210,200,0.14)';ctx.fillRect(x0,sy(-G.mid),mw,sy(G.mid)-sy(-G.mid));   // הנתיב הראשי
  ctx.fillStyle='rgba(127,224,184,0.35)';for(const sg of [-1,1])for(const [p,q] of G.bush.seg)ctx.fillRect(sx(p),sy(sg*G.bush.y)-1,sx(q)-sx(p),2);   // השיחים
  {const vw=innerWidth/ZOOM,l=Math.max(x0,sx(S.cam.x-vw/2)),r=Math.min(x0+mw,sx(S.cam.x+vw/2));ctx.strokeStyle='rgba(236,231,220,0.6)';ctx.strokeRect(l,y0-2,Math.max(2,r-l),mh+4)}   // מה שרואים על המסך
  if(M.order){ctx.strokeStyle=M.order.kind==='attack'?C.blood:MOBA.team[0];ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx(M.order.x),sy(M.order.y),5+3*Math.sin(M.t*8),0,7);ctx.stroke()}
  for(const u of M.u){if(u.dead||!mbShow(u))continue;const c=MOBA.team[u.team];   // בערפל: לא במפה (moba-vision.js)ctx.fillStyle=c;
    if(u.k==='tower'||u.k==='base'){const s=u.k==='base'?9:6;ctx.fillRect(sx(u.x)-s/2,sy(0)-s/2,s,s);ctx.strokeStyle='#0B0D14';ctx.lineWidth=1;ctx.strokeRect(sx(u.x)-s/2,sy(0)-s/2,s,s)}
    else if(u.k==='hero'){ctx.beginPath();ctx.arc(sx(u.x),sy(u.y),u.me?4.5:3.5,0,7);ctx.fill();ctx.strokeStyle=u.me?C.gold:'#0B0D14';ctx.lineWidth=u.me?1.5:1;ctx.stroke()}
    else ctx.fillRect(sx(u.x)-1,sy(u.y)-1,2,2)}
  ctx.restore();
}
