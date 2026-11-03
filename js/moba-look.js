/* משחקי השאול: המראה (אוראל, 2.11.2026). הלוגיקה ב-moba.js לא יודעת מה כתוב כאן.
   1. אייקונים: לכל סקיל, ערכה ופקודה צורה פשוטה ב-SVG (24×24), כמו DMG.types[...].icon. אותה צורה בכפתור (mbSvg) ועל הקנבס (mbIcon, דרך Path2D).
      f: צורות מלאות. s: קווים. הצבע הוא תמיד סוג הנזק של הסקיל (או צבע הקבוצה), לא צבע משלו.
   2. הרצפה: אבן כהה סגולה-אדומה, שביל באמצע הנתיב, סדקי לבה לאורך הקצוות, ועיגול כחול/אדום בבסיס של כל קבוצה.
      מצוירת פעם אחת לקנבס נסתר (mbFloorCanvas), ומשמשת גם בדו-ממד (mbFloor2d) וגם כטקסטורה בתלת-ממד (moba3d.js). הלבה בשכבה נפרדת שפועמת.
   המספרים ב-MBLOOK */
const MBLOOK={
  floor:{x0:-1700,x1:1700,y0:-440,y1:440,px:1.2,   // השטח שמצויר (יחידות משחק), ופיקסלים לכל יחידה
    abyss:'#120910',stone:['#3a2531','#34202c','#40293a','#2f1c28','#45293a'],mortar:'#1b0f17',path:'#6a4a4e',lava:'#FF6A2A',lavaHot:'#FFC861',rune:'#8C5A7A'},
  pulse:{speed:1.6,lo:0.55,hi:1},   // הלבה פועמת: כמה מהר, ובין איזו בהירות לאיזו
  mini:{w:300,vw:0.36,h:22,fade:0.3},   // המפה הקטנה: רוחב מקסימלי, חלק מרוחב המסך, גובה. fade: כמה היא שקופה כשיש מתחתיה פס חיים
};

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

/* ---- הרצפה ---- */
let MB_FLOOR=null;   // {stone, glow}: שני קנבסים, מצוירים פעם אחת
function mbFloorCanvas(){
  if(MB_FLOOR)return MB_FLOOR;
  const F=MBLOOK.floor,L=MOBA.lane,s=F.px,Wd=Math.round((F.x1-F.x0)*s),Ht=Math.round((F.y1-F.y0)*s);
  const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
  const st=mk(Wd,Ht),g=st.getContext('2d'),gl=mk(Math.round(Wd/2),Math.round(Ht/2)),q=gl.getContext('2d');
  g.setTransform(s,0,0,s,-F.x0*s,-F.y0*s);q.setTransform(s/2,0,0,s/2,-F.x0*s/2,-F.y0*s/2);
  const R=(a,b)=>hash(a*0.37+1.3,b*0.91+7.1);   // אקראי קבוע: אותה רצפה בכל פעם
  // תהום מסביב, עם זוהר לבה עמום ליד הנתיב
  g.fillStyle=F.abyss;g.fillRect(F.x0,F.y0,F.x1-F.x0,F.y1-F.y0);
  for(const sg of [-1,1]){const y=sg*L.half,gr=g.createLinearGradient(0,y,0,y+sg*(F.y1-L.half));
    gr.addColorStop(0,'#5a1a10');gr.addColorStop(0.35,'#2a0c0c');gr.addColorStop(1,F.abyss);g.fillStyle=gr;g.fillRect(F.x0,Math.min(y,y+sg*(F.y1-L.half)),F.x1-F.x0,F.y1-L.half)}
  // אבני ריצוף בשורות, באורכים שונים
  const rowH=56,x0=-L.len-40,x1=L.len+40;
  for(let r=0,y=-L.half;y<L.half;r++,y+=rowH){let x=x0-R(r,0)*80,i=0;
    while(x<x1){const w=70+R(r,i)*90,c=F.stone[Math.floor(R(i,r)*F.stone.length)];
      g.fillStyle=F.mortar;g.fillRect(x,y,w,Math.min(rowH,L.half-y));
      g.fillStyle=c;g.fillRect(x+2.5,y+2.5,w-5,Math.min(rowH,L.half-y)-5);
      g.fillStyle='rgba(255,255,255,0.04)';g.fillRect(x+2.5,y+2.5,w-5,4);   // אור על הקצה העליון
      if(R(r*3,i)>0.82){g.strokeStyle='rgba(10,4,8,0.55)';g.lineWidth=1.5;g.beginPath();const cx=x+w*R(i,r*2);g.moveTo(cx,y+3);g.lineTo(cx+8,y+rowH*0.5);g.lineTo(cx-4,y+rowH-4);g.stroke()}   // סדק
      x+=w;i++}}
  // השביל באמצע הנתיב: אבן שחוקה ובהירה יותר
  const pg=g.createLinearGradient(0,-L.half*0.5,0,L.half*0.5);
  pg.addColorStop(0,'rgba(106,74,78,0)');pg.addColorStop(0.3,'rgba(106,74,78,0.42)');pg.addColorStop(0.7,'rgba(106,74,78,0.42)');pg.addColorStop(1,'rgba(106,74,78,0)');
  g.fillStyle=pg;g.fillRect(x0,-L.half*0.5,x1-x0,L.half);
  g.setLineDash([26,30]);g.strokeStyle='rgba(236,210,200,0.12)';g.lineWidth=4;g.beginPath();g.moveTo(-L.len,0);g.lineTo(L.len,0);g.stroke();g.setLineDash([]);
  // שפת הנתיב: אבני גבול כהות
  for(const sg of [-1,1]){g.fillStyle='#1f121a';g.fillRect(x0,sg>0?L.half-10:-L.half,x1-x0,10)}
  // עיגולי הבסיס: כחול ואדום, עם טבעת רונות
  for(const tm of [0,1]){const bx=(tm?1:-1)*MOBA.base.x,r=MOBA.base.healR,col=MOBA.team[tm];
    g.save();g.translate(bx,0);g.scale(1,0.9);
    g.fillStyle=col+'26';g.beginPath();g.arc(0,0,r,0,7);g.fill();
    g.strokeStyle=col+'AA';g.lineWidth=6;g.beginPath();g.arc(0,0,r-6,0,7);g.stroke();
    g.strokeStyle=col+'55';g.lineWidth=3;g.beginPath();g.arc(0,0,r-24,0,7);g.stroke();
    g.fillStyle=col+'88';for(let i=0;i<16;i++){const a=i/16*Math.PI*2;g.save();g.rotate(a);g.fillRect(r-19,-5,8,10);g.restore()}
    g.restore();
    q.save();q.translate(bx,0);q.scale(1,0.9);q.strokeStyle=col;q.globalAlpha=0.5;q.lineWidth=8;q.beginPath();q.arc(0,0,r-6,0,7);q.stroke();q.restore()}
  // עיגול באמצע הנתיב
  g.strokeStyle=F.rune+'66';g.lineWidth=3;g.beginPath();g.ellipse(0,0,90,80,0,0,7);g.stroke();
  // סדקי לבה: לאורך הקצוות, וכמה שנכנסים קצת פנימה. בקנבס האבן כהים-אדומים, ובשכבת הזוהר בוהקים
  const crack=(pts,w)=>{for(const [c,lw,a] of [[g,w+3,'#2a0805'],[g,w,'#a8341a']]){c.strokeStyle=a;c.lineWidth=lw;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke()}
    q.lineCap=q.lineJoin='round';for(const [lw,col,a] of [[w*4,F.lava,0.35],[w*1.6,F.lava,0.9],[w*0.6,F.lavaHot,1]]){q.globalAlpha=a;q.strokeStyle=col;q.lineWidth=lw;q.beginPath();pts.forEach((p,i)=>i?q.lineTo(p[0],p[1]):q.moveTo(p[0],p[1]));q.stroke()}q.globalAlpha=1};
  for(const sg of [-1,1]){
    const edge=[];for(let x=x0;x<=x1;x+=34)edge.push([x,sg*(L.half+6+R(x,sg)*10)]);crack(edge,3.5);   // הסדק הארוך לאורך השפה
    for(let i=0;i<26;i++){const cx=x0+(i+R(i,sg))*((x1-x0)/26);let x=cx,y=sg*(L.half-4);const pts=[[x,y]],n=2+Math.floor(R(sg,i)*2);
      for(let k=0;k<n;k++){x+=(R(i,k)-0.5)*40;y-=sg*(14+R(k,i)*26);pts.push([x,y])}crack(pts,1.8)}
    // לבה בתהום: נהר זוהר מעבר לשפה
    for(let x=x0;x<x1;x+=140){const y=sg*(L.half+60+R(x,1)*90),pts=[[x,y]];for(let k=1;k<5;k++)pts.push([x+k*35,y+(R(x,k)-0.5)*40]);crack(pts,2.5)}}
  return MB_FLOOR={stone:st,glow:gl};
}
const mbPulse=()=>{const P=MBLOOK.pulse;return P.lo+(P.hi-P.lo)*(0.5+0.5*Math.sin((MB?MB.t:0)*P.speed))};
// דו-ממד: הרצפה בקואורדינטות המשחק (הקנבס כבר מוזז למצלמה)
function mbFloor2d(){
  const F=MBLOOK.floor,fl=mbFloorCanvas(),w=F.x1-F.x0,h=F.y1-F.y0;
  ctx.fillStyle=F.abyss;ctx.fillRect(F.x0-3000,F.y0-2000,w+6000,h+4000);   // תהום גם מעבר לקצה הקנבס, במסך רחב
  ctx.drawImage(fl.stone,F.x0,F.y0,w,h);
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=mbPulse()*0.8;ctx.drawImage(fl.glow,F.x0,F.y0,w,h);ctx.restore();
}

/* ---- המפה הקטנה: למעלה, צרה, ונעשית שקופה כשיש מתחתיה פס חיים של גיבור או מבנה ---- */
function mbMiniBox(ox,oy){
  const K=MBLOOK.mini,mw=Math.min(K.w,W*K.vw),x0=W/2-mw/2,y0=Math.max(40,H*0.1);
  // מה מצויר מתחת: הפס והתג של גיבור (עד 100 פיקסלים מעל הרגליים) או של מבנה (עד 150)
  let under=false;
  for(const u of MB.u){if(u.dead||u.k==='minion')continue;const sx=u.x+ox,sy=u.y+oy,top=sy-(u.k==='hero'?108:u.k==='base'?150:120);
    if(sx>x0-30&&sx<x0+mw+30&&top<y0+K.h+6&&sy>y0-6){under=true;break}}
  return {x0,y0,mw,mh:K.h,a:under?K.fade:1};
}
