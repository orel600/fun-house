/* משחקי השאול: המראה (אוראל, 2.11.2026). הלוגיקה ב-moba.js לא יודעת מה כתוב כאן.
   1. אייקונים: לכל סקיל, ערכה ופקודה צורה פשוטה ב-SVG (24×24), כמו DMG.types[...].icon. אותה צורה בכפתור (mbSvg) ועל הקנבס (mbIcon, דרך Path2D).
      f: צורות מלאות. s: קווים. הצבע הוא תמיד סוג הנזק של הסקיל (או צבע הקבוצה), לא צבע משלו.
   2. הרצפה: אבן כהה סגולה-אדומה, שביל באמצע הנתיב, סדקי לבה לאורך הקצוות, ועיגול כחול/אדום בבסיס של כל קבוצה.
      מצוירת פעם אחת לקנבס נסתר (mbFloorCanvas), ומשמשת גם בדו-ממד (mbFloor2d) וגם כטקסטורה בתלת-ממד (moba3d.js). הלבה בשכבה נפרדת שפועמת.
   המספרים ב-MBLOOK */
const MBLOOK={
  baseRingA:0.38,   // the base heal circle in the floor: 0.38 of the old strength, quieter so heroes read; your own brightens while you heal in it (mbBaseGlow). ?mbbase=1 / 0.4 / 0.25 (outer ring only) / 0 for A/B. Visual only (healR 240 and the heal rule unchanged)
  // המצלמה במוד (אוראל, 3.11: "כיוון המצלמה קרוב מדי", כמו ב-MLBB): רחוקה וגבוהה יותר. zoom: מתחת ל-1 רואים יותר (0.58 = פי 1.7 לרוחב). tilt: מעלות מעל הקרקע.
  // ui: פסי החיים, התגים והמספרים מעל הדמויות גדלים בחזרה חלקית, כדי שיהיו קריאים גם כשהמצלמה רחוקה
  cam:{zoom:0.58,tilt:52,ui:0.8},
  // קריאות מרחוק (אוראל, 8.11): בדו-ממד גיבור גדול וחייל קטן (k של pose ב-rig.js), ולכל ערכה הנשק שלה ביד. חיילים בלי נשק.
  // lw: עובי הקו. len: אורך הנשק (יחידות משחק, לפני k)
  rig:{hero:1.15,minion:0.75,lw:{hero:3,minion:2},
    weapon:{tank:'sword',warrior:'sword',hunter:'bow',mage:'staff',assassin:'blades'},len:{sword:17,bow:10,staff:24,blades:10}},
  // טבעת הקבוצה מתחת לכל יחידה (גם בתלת-ממד, בקנבס מעל): pad מעבר לרדיוס, w עובי, fill שקיפות המילוי. me: טבעת זהב עבה לגיבור שלך
  ring:{hero:{pad:9,w:3.5,fill:0.2},minion:{pad:5,w:2.5,fill:0.14},me:{pad:15,w:4.5}},
  floor:{x0:-2200,x1:2200,y0:-940,y1:940,px:0.9,rim:34,   // השטח שמצויר (יחידות משחק), ופיקסלים לכל יחידה (עד 4096 לצד). rim: שפת אבן מחוץ לנתיב
    abyss:'#0e070d',stone:'#3b2d38',blot:['#2f232d','#463545','#35282f'],grain:0.06,side:'#2d2230',mortar:'#170c14',path:'#7a585a',   // W5 (8.11): אבן כהה אחידה (כתמים וגרגור), בלי לבנים. side: שבילי העקיפה כהים יותר
    rimCol:'#4a3646',cliff:['#3a2833','#1a0f16'],lava:'#FF6A2A',lavaHot:'#FFC861',rune:'#8C5A7A',moss:'#24302c',tint:0.13,drop:90},   // tint: כמה צבע הקבוצה צובע את החצי שלה. drop: כמה עמוקה התהום בתלת-ממד
  // תלת-ממד (W5): הנתיב מקבל את רצפת האבן של הזירה (arena-look.js, aLookFlatMat: אבני ריצוף לא סדירות בלי הטבעות והגבול העגול) בפלטה של השאול,
  // ומעליה שכבה שקופה עם הסימנים של הנתיב (צבע הקבוצות, השביל, הבסיסים, הלבה: mbFloorCanvas בלי האבן). בלי arena-look: הטקסטורה של הדו-ממד כמו קודם
  floor3d:{stone:'#6a4c60',stone2:'#56404f',dark:'#3a2634',mortar:'#221420',crack:'#160c12',rune:'#C9A23E',ember:'#ff6a2a',out:'#0e070d'},
  // המפה (רק מראה, בלי השפעה על המשחק): נתיב ראשי באמצע (|y|<mid), שבילי עקיפה בצדדים (side), ורצועות שיחים ביניהם עם פתחים (bush)
  map:{mid:190,side:[310,650],bush:{y:250,seg:[[-1620,-1020],[-470,470],[1020,1620]],gap:50,r:[26,40]},
    patch:{y:[440,560],xs:[150,750,1350],n:5},   // שיחים בשטח הפתוח בצדדים
    rocks:{every:150,r:[22,46]},braziers:[[420,470],[1150,470],[1600,150]],banners:[[1700,190],[1700,-190]],
    bushCol:['#3d5658','#46636a','#354b4e'],bushLit:'#A8DCC4',rockCol:['#5b4c66','#4b3e57','#6a5a72']},   // שיחים בגוון אפרפר-ירקרק שיושב על האבן הכהה (W5), לא טורקיז על סגול
  pulse:{speed:1.6,lo:0.55,hi:1},   // הלבה פועמת: כמה מהר, ובין איזו בהירות לאיזו
  // המפה הקטנה (פיקסלים של המסך), בפינה השמאלית העליונה: x/top מהפינה (מתחת לחיים ולחפצים), w רוחב מקסימלי, vw חלק מרוחב המסך (הגובה לפי צורת המפה).
  // gap: רווח ל-🎯 ולהודעות שמתחת. btn: גודל 🎯. pad: כמה מחוץ למפה עוד נחשב נגיעה. me: רדיוס הנגיעה בגיבור שלי. joy: כמה צריך להזיז את הג'ויסטיק כדי לחזור לגיבור. fade: כמה היא אטומה כשיש מאחוריה פס חיים (לפחות 0.6, שתמיד תהיה ברורה)
  mini:{x:10,top:84,w:230,vw:0.27,gap:8,btn:34,pad:8,me:12,joy:0.25,fade:0.75,
    // W5 (8.11): ניגודיות. צבע קבוע לכל צד: כחול לקבוצה שלי, אדום לאויב, אפור ליחידה שאינה של אף אחת (mbMiniCol). dot: גודל הנקודות בפיקסלים.
    // frame: מסגרת עץ עם קו זהב ומסמרות בפינות, כמו שאר החלונות (bwin). bg: האבן של המפה, בהירה מהרצפה כדי שהנקודות יבלטו
    col:{ally:'#58AEFF',foe:'#FF5C5C',neu:'#A6A6B4',dead:'#3a3340'},dot:{minion:4,hero:5.5,me:7,tower:9,base:12},
    bg:'#302536',lane:'rgba(236,210,200,0.32)',side:'rgba(236,210,200,0.13)',bush:'rgba(120,205,160,0.78)',tint:'70',
    frame:{w:7,wood:'#7A4E2A',wood2:'#45291A',gold:'#C9A23E',stud:'#F6D38A'}},
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
  cleave:{s:'M4 21C14 18 19 11 20 2M8 22c6-3 11-8 14-15M1 17c8-2 13-8 15-15'},
  spin:{f:'M11 7h2v10h-2zM8 16h8v2H8zM3 4.5l5.5 1-4 4z',s:'M7 6.5A8 8 0 1 1 4.6 10'},
  rage:{f:'M12 1.5l2.6 6 6.4-1.3-4 5.3 4 5.3-6.4-1.3L12 21.5l-2.6-6-6.4 1.3 4-5.3-4-5.3 6.4 1.3z'},
  pierce:{f:'M22 2l-2.2 7.8-5.6-5.6z',s:'M3 21 17 7M5 12.5l3 1.5-1.5 3 3 1.5'},
  net:{s:'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zM2 12h20M12 2v20M5 5l14 14M19 5 5 19'},
  rain:{f:'M3 13.5h6L6 19zM9 16h6l-3 5.5zM15 13.5h6L18 19z',s:'M6 2.5v11M12 4.5v11.5M18 2.5v11'},
  wave:{f:'M1.5 17c3-7 7.5-11 13-11 4 0 6 2 7.5 4.5-3.5-1-6.5 0-6.5 3 0 2 2 3.5 6.5 3.5v4.5h-20.5z'},
  bubble:{s:'M12 3a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM7.5 9a5 5 0 0 1 3-3M4 22.5h16'},
  blizzard:{s:'M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 3.5l3 3 3-3M9 20.5l3-3 3 3M2.5 10.5l4-1.2-1-4M21.5 13.5l-4 1.2 1 4M2.5 13.5l4 1.2-1 4M21.5 10.5l-4-1.2 1-4'},
  shadowstep:{f:'M14 2.5 21.5 10 11 20.5l-2-2L6 21.5 2.5 18 5.5 15l-2-2z',s:'M1.5 6.5h5M3 10h3.5'},   // המתנקש: פגיון, עשן וגולגולת
  vanish:{s:'M4 18c-2-3 0-7 4-7 0-4 5-6 8-3 3-1 6 1 5.5 4.5 2 1 1.5 5-1.5 5.5H6M8 21.5h9'},
  deathmark:{eo:1,f:'M12 1.5a8 8 0 0 0-8 8c0 2.8 1.4 4.8 3.3 5.8v3.7h9.4v-3.7c1.9-1 3.3-3 3.3-5.8a8 8 0 0 0-8-8zM8.7 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM15.3 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM12 12.5l1.3 2.5h-2.6z',s:'M9.5 22.5h5'},
  // פקודות לחברים
  attack:{f:'M2.5 2.5H7l9 9-2.5 2.5-9-9z M21.5 2.5V7l-9 9-2.5-2.5 9-9z',s:'M12.5 19.5l7-7M4.5 12.5l7 7M17.5 17.5l3 3M6.5 17.5l-3 3'},
  back:{f:'M12 2l8.5 3v6.5c0 5-3.6 9-8.5 11-4.9-2-8.5-6-8.5-11V5z'},
  // הערכות (מעל הראש, בחלון הבחירה ובסוף)
  k_tank:{f:'M3 3h12v7.5H3zM7.5 10.5h3V22h-3z',s:'M15 6.75h4'},
  k_warrior:{f:'M17 2h5v5L9.5 19.5l-5-5z M2.5 15l6.5 6.5-1.5 1.5L1 16.5z'},
  k_hunter:{s:'M6 2.5c9 3 9 16 0 19M6 2.5v19M3 12h17',f:'M22.5 12 18 9v6z'},
  k_mage:{f:'M12 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM7 19h10l1.5 3h-13z'},
  k_assassin:{eo:1,f:'M12 2C7 2 4 6.5 4 11v10.5h16V11c0-4.5-3-9-8-9zM8 11.5c1.2-1 2.5-1.3 4-1.3s2.8.3 4 1.3c-.4 2.4-2 3.8-4 3.8s-3.6-1.4-4-3.8z'},   // ברדס
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
let MB_FLOOR_OV=null;   // שכבת הסימנים בלי האבן, לתלת-ממד (W5)
// marksOnly: רק הסימנים (צבע הקבוצות, השביל, הצללים, השפה, הבסיסים והלבה) על קנבס שקוף, מעל רצפת האבן של הזירה בתלת-ממד
// the base heal circle's strength (visual only: MOBA.base.healR and the heal rule are untouched). ?mbbase=n overrides MBLOOK.baseRingA (default 1 if unset)
function mbBaseA(){const q=location.search.match(/[?&]mbbase=([0-9.]+)(&|$)/);return q?Math.max(0,Math.min(1,+q[1])):(typeof MBLOOK.baseRingA==='number'?MBLOOK.baseRingA:1)}
// your own base circle brightens (up to full) only while your hero stands inside its heal radius and is not at full health: a display signal of when it matters
function mbBaseGlow(){
  const me=MB&&MB.me,BA=mbBaseA();if(!me||BA>=1)return;const bx=(me.team?1:-1)*MOBA.base.x,r=MOBA.base.healR,col=MOBA.team[me.team];
  const want=!me.dead&&Math.hypot(me.x-bx,me.y)<r&&me.hp<me.max?1:0;mbBaseGlow.k=(mbBaseGlow.k||0)+(want-(mbBaseGlow.k||0))*0.12;const a=(1-BA)*mbBaseGlow.k;if(a<0.02)return;
  ctx.save();ctx.translate(bx,0);ctx.scale(1,0.9);ctx.globalAlpha=a;ctx.strokeStyle=col+'AA';ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,r-6,0,7);ctx.stroke();
  ctx.fillStyle=col+'88';for(let i=0;i<16;i++){const q=i/16*Math.PI*2;ctx.save();ctx.rotate(q);ctx.fillRect(r-19,-5,8,10);ctx.restore()}ctx.restore();ctx.globalAlpha=1;
}
function mbFloorCanvas(marksOnly){
  if(marksOnly?MB_FLOOR_OV:MB_FLOOR)return marksOnly?MB_FLOOR_OV:MB_FLOOR;
  const F=MBLOOK.floor,M=MBLOOK.map,L=MOBA.lane,s=F.px,Wd=Math.min(4096,Math.round((F.x1-F.x0)*s)),Ht=Math.min(4096,Math.round((F.y1-F.y0)*s));
  const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
  const st=mk(Wd,Ht),g=st.getContext('2d'),gl=mk(Math.round(Wd/2),Math.round(Ht/2)),q=gl.getContext('2d');
  g.setTransform(Wd/(F.x1-F.x0),0,0,Ht/(F.y1-F.y0),-F.x0*Wd/(F.x1-F.x0),-F.y0*Ht/(F.y1-F.y0));
  q.setTransform(gl.width/(F.x1-F.x0),0,0,gl.height/(F.y1-F.y0),-F.x0*gl.width/(F.x1-F.x0),-F.y0*gl.height/(F.y1-F.y0));
  const R=(a,b)=>hash(a*0.37+1.3,b*0.91+7.1);   // אקראי קבוע: אותה רצפה בכל פעם
  const A=L.half+F.rim,x0=-L.len-F.rim,x1=L.len+F.rim;   // A: הקצה של שפת האבן
  if(!marksOnly){
  // תהום מסביב, עם זוהר לבה עמום מתחת לשפה
  g.fillStyle=F.abyss;g.fillRect(F.x0,F.y0,F.x1-F.x0,F.y1-F.y0);
  for(const sg of [-1,1]){const gr=g.createLinearGradient(0,sg*A,0,sg*F.y1);
    gr.addColorStop(0,'#4a160e');gr.addColorStop(0.3,'#22090b');gr.addColorStop(1,F.abyss);g.fillStyle=gr;g.fillRect(F.x0,Math.min(sg*A,sg*F.y1),F.x1-F.x0,F.y1-A)}
  // אבן כהה אחידה (W5): בסיס אחד, כתמים רכים בגוונים קרובים, וגרגור עדין. שבילי העקיפה בצדדים כהים יותר. בלי לבנים: הן רבו עם השיחים ועם המגדלים
  g.fillStyle=F.stone;g.fillRect(x0,-A,x1-x0,A*2);
  for(const sg of [-1,1]){const a=sg*M.side[0],b=sg*A,gr=g.createLinearGradient(0,a,0,b);gr.addColorStop(0,F.side+'00');gr.addColorStop(0.35,F.side);gr.addColorStop(1,F.side);g.fillStyle=gr;g.fillRect(x0,Math.min(a,b),x1-x0,Math.abs(b-a))}
  for(let i=0;i<420;i++){const x=x0+R(i,11)*(x1-x0),y=-A+R(i,13)*A*2,r=60+R(i,17)*170,c=F.blot[Math.floor(R(i,19)*F.blot.length)];
    const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,c+'80');gr.addColorStop(1,c+'00');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}
  for(let i=0;i<2600;i++){const x=x0+R(i,23)*(x1-x0),y=-A+R(i,29)*A*2,k=R(i,31);g.fillStyle=k>0.5?'rgba(255,255,255,'+F.grain+')':'rgba(0,0,0,'+F.grain*1.6+')';g.fillRect(x,y,2+R(i,37)*4,1.5)}
  for(let i=0;i<70;i++){const x=x0+R(i,41)*(x1-x0),y=-A+R(i,43)*A*2;g.strokeStyle='rgba(10,4,8,0.4)';g.lineWidth=1.5;g.beginPath();g.moveTo(x,y);g.lineTo(x+(R(i,47)-0.5)*40,y+10+R(i,53)*30);g.lineTo(x+(R(i,59)-0.5)*60,y+30+R(i,61)*40);g.stroke()}   // סדקים בודדים
  }
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
  const BA=mbBaseA(),B6=BA===0.25;   // how strong the base circle is in the floor (MBLOOK.baseRingA, ?mbbase=n). 0.25: only the outer ring
  for(const tm of [0,1]){const bx=(tm?1:-1)*MOBA.base.x,r=MOBA.base.healR,col=MOBA.team[tm];
    g.save();g.translate(bx,0);g.scale(1,0.9);g.globalAlpha=BA;
    const rg=g.createRadialGradient(0,0,r*0.2,0,0,r);rg.addColorStop(0,col+'40');rg.addColorStop(1,col+'14');if(!B6){g.fillStyle=rg;g.beginPath();g.arc(0,0,r,0,7);g.fill()}
    g.strokeStyle=col+'AA';g.lineWidth=6;g.beginPath();g.arc(0,0,r-6,0,7);g.stroke();
    if(!B6){g.strokeStyle=col+'55';g.lineWidth=3;g.beginPath();g.arc(0,0,r-24,0,7);g.stroke()}
    if(!B6)g.fillStyle=col+'88';if(!B6)for(let i=0;i<16;i++){const a=i/16*Math.PI*2;g.save();g.rotate(a);g.fillRect(r-19,-5,8,10);g.restore()}
    g.restore();
    q.save();q.translate(bx,0);q.scale(1,0.9);q.strokeStyle=col;q.globalAlpha=0.5*BA;q.lineWidth=8;q.beginPath();q.arc(0,0,r-6,0,7);q.stroke();q.restore()}
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
  if(marksOnly)return MB_FLOOR_OV={stone:st,glow:gl};
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

/* ---- המפה הקטנה (אוראל, 6.11: "מפה קטנה שאפשר לגעת בה"): בפינה השמאלית העליונה, מתחת לחיים, כמו ב-MLBB, ולא באמצע למעלה (קשה להגיע, docs/ui-guide.md).
   כל המפה בקנה מידה אחד: הקרקע, השבילים והשיחים, המגדלים והבסיסים (כהים כשנפלו), החברים, והאויבים רק כשרואים אותם (mbSeen, moba-vision.js).
   נגיעה מזיזה את המצלמה לשם, גרירה עוקבת אחרי האצבע, והמצלמה נשארת שם גם אחרי ששחררו.
   חוזרת לגיבור: נגיעה בגיבור שלי במפה, 🎯 ליד המפה, C, או תזוזה בג'ויסטיק (או במקשים). הג'ויסטיק והסקילים עובדים בזמן הגרירה: כל אצבע לפי pointerId.
   סימן של מערכת אחרת במפה (למשל חדר ההימור): MBLOOK.miniMarks.push((c,X,Y,k)=>{...}). X(x), Y(y): נקודה במשחק ← פיקסל במפה. k: פיקסלים ליחידת משחק */
MBLOOK.miniMarks=[];
const MBCAM={free:false,x:0,y:0,pid:null,mb:null};   // free: המצלמה לא על הגיבור, אלא ב-(x,y). pid: האצבע שגוררת על המפה
let MB_MINI_L=null,MB_MINI_BG=null;   // המיקום (לפי גודל המסך), והרקע הקבוע של המפה, שמצויר פעם אחת
function mbMiniLay(){
  const K=MBLOOK.mini,L=MOBA.lane,key=innerWidth+'x'+innerHeight+'x'+DPR;
  if(MB_MINI_L&&MB_MINI_L.key===key)return MB_MINI_L;
  // שוליים בטוחים (חריץ במסך): לפי המקום של פס החיים, שכבר מכבד אותם ב-CSS
  const el=document.querySelector('#mbHud .mbme'),r=el&&el.getBoundingClientRect(),ok=!!(r&&r.height);
  const mw=Math.round(Math.min(K.w,innerWidth*K.vw)),k=mw/(L.len*2),mh=Math.round(L.half*2*k),x0=(ok?r.left-10:0)+K.x,y0=(ok?r.top-6:0)+K.top;
  MB_MINI_L={key:ok?key:null,x0,y0,mw,mh,k,X:x=>x0+(x+L.len)*k,Y:y=>y0+(y+L.half)*k,bt:{x:x0+mw+K.gap,y:y0,s:K.btn}};MB_MINI_BG=null;
  const R=document.documentElement.style;R.setProperty('--mbmini-b',Math.round(y0+mh+K.gap)+'px');R.setProperty('--mbmini-r',Math.round(x0+mw+K.gap*2+K.btn)+'px');   // הודעות ההריגה (.mbfeed) יורדות אל מתחת למפה, וההודעה למעלה (.mb .banner) מתחילה מימין ל-🎯
  return MB_MINI_L;
}
function mbMiniBox(ox,oy){
  const K=MBLOOK.mini,l=mbMiniLay(),{x0,y0,mw,mh}=l;
  // מה מצויר מתחת: הפס והתג של גיבור או של מבנה (בפיקסלים של המסך, אחרי הזום). בזמן נגיעה במפה היא לא שקופה
  let under=false;const z=ZOOM,k=mbUiK();
  // רק כשהפס עצמו (רוחב כ-60, גובה כ-10) נמצא מאחורי המפה, ולא כשרק הגוף של היחידה שם
  if(MBCAM.pid===null)for(const u of MB.u){if(u.dead||u.k==='minion'||(typeof mbShow==='function'&&!mbShow(u)))continue;const sx=(u.x+ox)*z,sy=(u.y+oy)*z,top=sy-(u.k==='hero'?78*z+30*k:u.k==='base'?150*z:120*z),hw=(u.k==='base'?42:30)*k;
    if(sx+hw>x0-3&&sx-hw<x0+mw+3&&top+10>y0-3&&top-14<y0+mh+3){under=true;break}}
  return Object.assign({a:under?K.fade:1},l);
}
// הצבע של קבוצה במפה הקטנה: כחול לשלי, אדום לאויב, אפור ליחידה שאינה של אף קבוצה (W5). הקבוצה שלי קבועה לאורך המשחק, אז הרקע השמור נשאר נכון
const mbMiniCol=t=>{const K=MBLOOK.mini.col,my=MB&&MB.me?MB.me.team:0;return t===my?K.ally:t===0||t===1?K.foe:K.neu};
// הרקע הקבוע: אבן, צבע הקבוצות, הנתיב הראשי, שבילי העקיפה והשיחים (מ-mbDecor, אותם שיחים כמו על המפה)
function mbMiniBg(l){
  if(MB_MINI_BG)return MB_MINI_BG;
  const G=MBLOOK.map,L=MOBA.lane,c=document.createElement('canvas'),d=DPR,g=c.getContext('2d'),X=x=>(x+L.len)*l.k,Y=y=>(y+L.half)*l.k;
  c.width=Math.ceil(l.mw*d);c.height=Math.ceil(l.mh*d);g.scale(d,d);
  const K=MBLOOK.mini;
  g.fillStyle=K.bg;g.fillRect(0,0,l.mw,l.mh);
  const gr=g.createLinearGradient(0,0,l.mw,0);gr.addColorStop(0,mbMiniCol(0)+K.tint);gr.addColorStop(0.5,'rgba(120,90,100,0.12)');gr.addColorStop(1,mbMiniCol(1)+K.tint);g.fillStyle=gr;g.fillRect(0,0,l.mw,l.mh);   // הצד של כל קבוצה בצבע שלה
  g.fillStyle=K.side;for(const sg of [-1,1]){const a=Y(sg*G.side[0]),b=Y(sg*G.side[1]);g.fillRect(0,Math.min(a,b),l.mw,Math.abs(b-a))}   // שבילי העקיפה
  g.fillStyle=K.lane;g.fillRect(0,Y(-G.mid),l.mw,Y(G.mid)-Y(-G.mid));   // הנתיב הראשי
  g.fillStyle=K.bush;for(const b of mbDecor())if(b.k==='bush'){g.beginPath();g.arc(X(b.x),Y(b.y),Math.max(2,b.r*l.k),0,7);g.fill()}   // השיחים
  return MB_MINI_BG=c;
}
// המפה הקטנה עצמה. אויב (גיבור או חייל) מצויר רק אם הקבוצה שלי רואה אותו
function mbMini(ox,oy){
  const M=MB,K=MBLOOK.mini,l=mbMiniBox(ox,oy),{x0,y0,mw,mh,k,X,Y,a}=l,my=M.me?M.me.team:0,seen=u=>u.team===my||(typeof mbSeen==='function'?mbSeen(u,my):true);
  ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.globalAlpha=a;
  // המסגרת: עץ עם קו זהב דק ומסמרה בכל פינה, כמו שאר החלונות (W5). הגיאומטריה של הנגיעה (x0,y0,mw,mh) לא משתנה
  {const F=K.frame,w=F.w,wg=ctx.createLinearGradient(x0,y0-w,x0,y0+mh+w);wg.addColorStop(0,F.wood);wg.addColorStop(1,F.wood2);
    ctx.fillStyle=wg;ctx.fillRect(x0-w,y0-w,mw+w*2,mh+w*2);ctx.fillStyle='rgba(0,0,0,0.35)';ctx.fillRect(x0-w,y0+mh+w-2,mw+w*2,2);
    ctx.fillStyle='rgba(14,10,20,0.9)';ctx.fillRect(x0-1.5,y0-1.5,mw+3,mh+3);ctx.drawImage(mbMiniBg(l),x0,y0,mw,mh);
    ctx.strokeStyle=F.gold;ctx.lineWidth=1.5;ctx.strokeRect(x0-1.5,y0-1.5,mw+3,mh+3);
    ctx.fillStyle=F.stud;for(const [sx,sy] of [[x0-w/2,y0-w/2],[x0+mw+w/2,y0-w/2],[x0-w/2,y0+mh+w/2],[x0+mw+w/2,y0+mh+w/2]]){ctx.beginPath();ctx.arc(sx,sy,1.6,0,7);ctx.fill()}}
  ctx.save();ctx.beginPath();ctx.rect(x0,y0,mw,mh);ctx.clip();
  const D=K.dot;
  for(const u of M.u){if(u.k!=='tower'&&u.k!=='base')continue;const s=u.k==='base'?D.base:D.tower,c=mbMiniCol(u.team);   // מבנים: גם שנפלו, כהים ומחוקים
    if(typeof mbMiniBase==='function'&&mbMiniBase(u,X,Y,k,s,c,a))continue;   // השיפוץ (mb-mini.js): בסיס כיהלום ועיגול הבית
    ctx.globalAlpha=a*(u.dead?0.45:1);ctx.fillStyle=u.dead?K.col.dead:c;ctx.fillRect(X(u.x)-s/2,Y(u.y)-s/2,s,s);ctx.strokeStyle=u.dead?c:'#0B0D14';ctx.lineWidth=1;ctx.strokeRect(X(u.x)-s/2,Y(u.y)-s/2,s,s);
    if(u.dead){ctx.beginPath();ctx.moveTo(X(u.x)-s/2,Y(u.y)-s/2);ctx.lineTo(X(u.x)+s/2,Y(u.y)+s/2);ctx.stroke()}}
  ctx.globalAlpha=a;
  {const s=D.minion;ctx.strokeStyle='#0B0D14';ctx.lineWidth=1;for(const u of M.u)if(u.k==='minion'&&!u.dead&&seen(u)){ctx.fillStyle=mbMiniCol(u.team);ctx.fillRect(X(u.x)-s/2,Y(u.y)-s/2,s,s);ctx.strokeRect(X(u.x)-s/2,Y(u.y)-s/2,s,s)}}
  for(const f of MBLOOK.miniMarks)f(ctx,X,Y,k);   // סימנים של מערכות אחרות
  if(typeof mbGambleMini==='function')mbGambleMini(X,Y);   // חדר ההימור (moba-gamble.js)
  if(typeof MBMINI!=='undefined'&&MBMINI.on){ctx.globalAlpha=a*MBMINI.dead;for(const u of M.u)if(u.k==='hero'&&u.dead&&(u.me||seen(u))){ctx.fillStyle=mbMiniCol(u.team);ctx.beginPath();ctx.arc(X(u.x),Y(u.y),D.hero,0,7);ctx.fill()}ctx.globalAlpha=a}   // השיפוץ: גיבור מת, עמום
  for(const u of M.u)if(u.k==='hero'&&!u.dead&&!u.me&&seen(u)){ctx.fillStyle=mbMiniCol(u.team);ctx.beginPath();ctx.arc(X(u.x),Y(u.y),D.hero,0,7);ctx.fill();ctx.strokeStyle='#0B0D14';ctx.lineWidth=1.5;ctx.stroke()}
  const me=M.me;if(me&&!me.dead){ctx.fillStyle=mbMiniCol(me.team);ctx.beginPath();ctx.arc(X(me.x),Y(me.y),D.me,0,7);ctx.fill();ctx.strokeStyle=C.gold;ctx.lineWidth=2;ctx.stroke();if(typeof mbMiniArrow==='function')mbMiniArrow(me,X,Y,D.me)}   // אני: גדול, עם טבעת זהב (ובשיפוץ חץ לכיוון)
  if(M.order){ctx.strokeStyle=M.order.kind==='attack'?C.blood:mbMiniCol(me?me.team:0);ctx.lineWidth=2;ctx.beginPath();ctx.arc(X(M.order.x),Y(M.order.y),5+3*Math.sin(M.t*8),0,7);ctx.stroke()}
  {const vw=innerWidth/ZOOM*k,vh=innerHeight/ZOOM*k;ctx.strokeStyle=MBCAM.free?C.gold:'rgba(236,231,220,0.7)';ctx.lineWidth=1.5;MB_MINI_L.view={x:X(S.cam.x)-vw/2,y:Y(S.cam.y)-vh/2,w:vw,h:vh};ctx.strokeRect(X(S.cam.x)-vw/2,Y(S.cam.y)-vh/2,vw,vh)}   // מה שרואים על המסך (view: לבדיקה)
  ctx.restore();
  if(MBCAM.free){const b=l.bt;ctx.fillStyle='rgba(14,10,20,0.85)';ctx.beginPath();ctx.arc(b.x+b.s/2,b.y+b.s/2,b.s/2,0,7);ctx.fill();ctx.strokeStyle=C.gold;ctx.lineWidth=1.5;ctx.stroke();   // 🎯 חזרה לגיבור
    ctx.font=Math.round(b.s*0.55)+'px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🎯',b.x+b.s/2,b.y+b.s/2+1)}
  ctx.restore();
}
/* ---- נגיעה במפה: המצלמה ---- */
function mbCamBack(){MBCAM.free=false;MBCAM.pid=null}   // המצלמה חוזרת לגיבור (בהחלקה, דרך main.js)
function mbCamTo(cx,cy){   // נקודה במסך על המפה ← המצלמה מסתכלת לשם, מיד
  const l=MB_MINI_L,L=MOBA.lane,cl=(v,m)=>Math.max(-m,Math.min(m,v));
  MBCAM.mb=MB;MBCAM.free=true;MBCAM.x=cl((cx-l.x0)/l.k-L.len,L.len);MBCAM.y=cl((cy-l.y0)/l.k-L.half,L.half);S.cam.x=MBCAM.x;S.cam.y=MBCAM.y;
}
function mbMiniHit(cx,cy){   // 'btn' (🎯), 'me' (הגיבור שלי), 'map', או null
  if(!S||!S.mb||S.mode!=='play'||!MB||!MB_MINI_L)return null;
  const l=MB_MINI_L,K=MBLOOK.mini,p=K.pad,b=l.bt,me=MB.me;
  if(MBCAM.free&&cx>=b.x-p&&cx<=b.x+b.s+p&&cy>=b.y-p&&cy<=b.y+b.s+p)return 'btn';
  if(cx<l.x0-p||cx>l.x0+l.mw+p||cy<l.y0-p||cy>l.y0+l.mh+p)return null;
  return me&&!me.dead&&MBCAM.free&&Math.hypot(cx-l.X(me.x),cy-l.Y(me.y))<=K.me?'me':'map';
}
// לפני input.js (שלב ה-capture): אצבע שנוגעת במפה לא מפעילה את הג'ויסטיק. אצבע אחרת כן
addEventListener('pointerdown',e=>{if(e.target!==cvs)return;const h=mbMiniHit(e.clientX,e.clientY);if(!h)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(h!=='map'){mbCamBack();return}
  MBCAM.pid=e.pointerId;mbCamTo(e.clientX,e.clientY)},true);
addEventListener('pointermove',e=>{if(MBCAM.pid===null||e.pointerId!==MBCAM.pid)return;e.stopImmediatePropagation();if(S&&S.mb&&MB_MINI_L)mbCamTo(e.clientX,e.clientY)},true);
{const up=e=>{if(MBCAM.pid!==null&&e.pointerId===MBCAM.pid){MBCAM.pid=null;e.stopImmediatePropagation()}};addEventListener('pointerup',up,true);addEventListener('pointercancel',up,true)}
addEventListener('keydown',e=>{if(e.code==='KeyC'&&S&&S.mb&&S.mode==='play')mbCamBack()});
// main.js מזיז את S.cam אל P + giantCam(). במוד: כשהמצלמה חופשית, היעד הוא הנקודה שבחרו. תזוזה בג'ויסטיק (לא בזמן גרירה) מחזירה לגיבור
(function(){const g=giantCam;giantCam=function(){
  if(!(typeof S!=='undefined'&&S&&S.mb))return g();
  if(MBCAM.mb!==MB){MBCAM.mb=MB;mbCamBack()}   // משחק חדש: על הגיבור
  if(!MBCAM.free)return g();
  const mv=(joy&&Math.hypot(joy.dx,joy.dy)>MBLOOK.mini.joy)||keys.KeyW||keys.KeyA||keys.KeyS||keys.KeyD||keys.ArrowUp||keys.ArrowDown||keys.ArrowLeft||keys.ArrowRight;
  if(mv&&MBCAM.pid===null){mbCamBack();return g()}
  return {x:MBCAM.x-P.x,y:MBCAM.y-P.y}}})();

/* ---- קריאות מרחוק בדו-ממד (MBLOOK.rig, MBLOOK.ring) ---- */
// טבעת הקבוצה מתחת ליחידה: מילוי שקוף וקו בצבע הקבוצה, ולגיבור שלך עוד טבעת זהב עבה. נקרא מ-mobaDraw לפני הדמות
function mbRing(u,col){
  const R=MBLOOK.ring,g=u.k==='hero'?R.hero:R.minion,r=u.r+g.pad;
  ctx.globalAlpha=g.fill;ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(u.x,u.y+2,r,r*0.45,0,0,7);ctx.fill();
  ctx.globalAlpha=0.95;ctx.strokeStyle=col;ctx.lineWidth=g.w;ctx.stroke();
  if(u.me){const m=R.me,rm=u.r+m.pad;ctx.strokeStyle=C.gold;ctx.lineWidth=m.w;ctx.beginPath();ctx.ellipse(u.x,u.y+2,rm,rm*0.45,0,0,7);ctx.stroke()}
  ctx.globalAlpha=1;
}
// הנשק של הערכה ביד הקדמית (pose ב-rig.js): חרב, קשת, מטה או שני להבים. צורה ולא תמונה, באותו צבע כמו הדמות
function mbWeapon2d(p,kit,col){
  const w=MBLOOK.rig.weapon[kit];if(!w||!p.armF)return;
  const h=p.armF[1],a=p.aim,k=p.k||1,L=MBLOOK.rig.len[w]*k,c=Math.cos(a),s=Math.sin(a);
  ctx.strokeStyle=col;ctx.lineWidth=2.5*k;ctx.lineCap='round';ctx.beginPath();
  if(w==='sword'){ctx.moveTo(h.x,h.y);ctx.lineTo(h.x+c*L,h.y+s*L);const g=4*k;ctx.moveTo(h.x+c*3*k-s*g,h.y+s*3*k+c*g);ctx.lineTo(h.x+c*3*k+s*g,h.y+s*3*k-c*g)}   // להב ומגן יד
  else if(w==='bow'){ctx.arc(h.x,h.y,L,a-1.1,a+1.1);ctx.moveTo(h.x+Math.cos(a-1.1)*L,h.y+Math.sin(a-1.1)*L);ctx.lineTo(h.x+Math.cos(a+1.1)*L,h.y+Math.sin(a+1.1)*L)}   // קשת ומיתר
  else if(w==='staff'){ctx.moveTo(h.x-c*L*0.35,h.y-s*L*0.35);ctx.lineTo(h.x+c*L*0.65,h.y+s*L*0.65);ctx.stroke();ctx.beginPath();ctx.arc(h.x+c*L*0.65,h.y+s*L*0.65,3.2*k,0,7);ctx.fillStyle=col;ctx.fill()}   // מטה עם כדור בקצה
  else if(w==='blades'){for(const d of [-0.4,0.4]){const e=a+d;ctx.moveTo(h.x,h.y);ctx.lineTo(h.x+Math.cos(e)*L,h.y+Math.sin(e)*L)}}   // שני להבים קצרים
  ctx.stroke();
}
