/* משחקי השאול בתלת-ממד (moba.js): המגדלים והבסיסים כמודלים, במקום ציור שטוח בקנבס.
   נבנים מצורות פשוטות, באותו סגנון של props3d.js (משתמש בעזרים שלו: p3Mat, p3Cyl, p3Box, p3Mesh, p3Halo, p3At).
   מגדל: בסיס אבן, עמוד, במה וגביש מסתובב בצבע הקבוצה. בסיס: מבצר עם ארבעה עמודים, גג בצבע הקבוצה וגביש גדול.
   מבנה שנפל: ערימת אבנים. מבנה מוגן (קודם המגדל שלפניו): הגביש עמום. פגיעה: הבזק לבן קצר.
   מתחבר בלי לגעת ב-render3d.js: עוטף את render3d מבחוץ, כמו look-hd.js. בקנבס נשארים רק החיים, הטווח וטבעת ההגנה (mbDrawBuild ב-moba.js) */
const MB3D={
  tower:{h:78,r:24,cry:11,halo:60},   // h: הגובה על המסך, כמו הציור בקנבס
  base:{h:100,r:50,cry:17,halo:95},
  col:{stone:'#9A93A8',dark:'#5E586C',iron:'#3E4250'},
  spin:1.3,     // כמה מהר הגביש מסתובב
  // הקישוטים: איזה מודל של KayKit, באיזה גוון (k: יחס לגודל בדו-ממד). השיחים זוהרים קצת מבפנים, כמו צמחי שאול
  decor:{bush:{pick:[{model:'n_bush',k:1.5,tint:'#5c8a9a',glow:'#0c2a2a'},{model:'n_bush',k:1.3,tint:'#6d7aa6',glow:'#1a1438'}]},
    rock:{pick:[{model:'n_round',k:1.25,tint:'#7a6a90'},{model:'n_crag',k:1.2,tint:'#6a5a80'},{model:'n_block',k:1.1,tint:'#83708f'}]},fireHalo:70},
  dim:0.35,     // כמה צבע נשאר בגביש של מבנה מוגן
};
const M3={g:null,map:new Map(),mb:null,floor:null};
// הרצפה של משחקי השאול (moba-look.js מצייר אותה פעם אחת לקנבס): הנתיב מוגבה, ומתחתיו צוק אל תהום עם לבה, כדי שתהיה עומק.
// הנתיב והתהום משתמשים באותה טקסטורה: הנתיב רק בחלק שלו (repeat/offset), והתהום כולה, נמוך יותר (MBLOOK.floor.drop).
// מעל הרצפה: השיחים והאבנים (KayKit, n_bush/n_round/n_crag בגוון של השאול), לפידים ודגלים בצבע הקבוצה
function mb3dFloor(){
  const F=MBLOOK.floor,fl=mbFloorCanvas(),sn=SIN(),w=F.x1-F.x0,h=F.y1-F.y0,A=MOBA.lane.half+F.rim,lx=MOBA.lane.len+F.rim,g=new THREE.Group(),D=F.drop;
  const tex=(c,crop)=>{const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
    if(crop){t.repeat.set(lx*2/w,A*2/h);t.offset.set((lx*-1-F.x0)/w,(F.y1-A)/h)}return t};
  const plane=(mat,y,ww,dd)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(ww,dd),mat);m.rotation.x=-Math.PI/2;m.position.set(0,y,0);g.add(m);return m};
  const abyss=new THREE.Mesh(new THREE.PlaneGeometry(9000,9000),new THREE.MeshBasicMaterial({color:F.abyss}));abyss.rotation.x=-Math.PI/2;abyss.position.y=-D-2;g.add(abyss);
  const add=c=>({map:c,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
  plane(new THREE.MeshLambertMaterial({map:tex(fl.stone)}),-D,w,h/sn);                         // התהום, נמוך
  const glowLo=plane(new THREE.MeshBasicMaterial(add(tex(fl.glow))),-D+0.3,w,h/sn);
  // הנתיב, למעלה (W5): רצפת האבן של הזירה (arena-look.js) בפלטה של השאול, ומעליה שכבה שקופה עם הסימנים (צבע הקבוצות, השביל, הבסיסים, השפה).
  // בלי arena-look (look=classic): הטקסטורה של הדו-ממד, כמו קודם
  const flat=typeof aLookFlatMat==='function'&&MBLOOK.floor3d&&aLookFlatMat(MBLOOK.floor3d,sn);
  if(flat){plane(flat,0,lx*2,A*2/sn);const ov=mbFloorCanvas(true);plane(new THREE.MeshBasicMaterial({map:tex(ov.stone,1),transparent:true,depthWrite:false,toneMapped:false}),0.15,lx*2,A*2/sn)}
  else plane(new THREE.MeshLambertMaterial({map:tex(fl.stone,1)}),0,lx*2,A*2/sn);
  const glow=plane(new THREE.MeshBasicMaterial(add(tex(fl.glow,1))),0.3,lx*2,A*2/sn);
  // הצוק: קיר אבן מתחת לשפה הקרובה (הרחוקה פונה הלאה מהמצלמה ולא נראית), מתכהה כלפי מטה, עם קו אור בראש
  const cc=document.createElement('canvas');cc.width=256;cc.height=64;const q=cc.getContext('2d'),gr=q.createLinearGradient(0,0,0,64);
  gr.addColorStop(0,F.cliff[0]);gr.addColorStop(1,F.cliff[1]);q.fillStyle=gr;q.fillRect(0,0,256,64);
  for(let i=0;i<40;i++){q.fillStyle='rgba(0,0,0,'+(0.15+0.25*hash(i,3))+')';q.fillRect(hash(i,1)*256,hash(i,2)*30,2+hash(i,4)*5,20+hash(i,5)*40)}
  q.fillStyle='rgba(255,220,210,0.18)';q.fillRect(0,0,256,3);
  const ct=new THREE.CanvasTexture(cc);ct.colorSpace=THREE.SRGBColorSpace;ct.wrapS=THREE.RepeatWrapping;ct.repeat.set(lx*2/180,1);
  const cliff=new THREE.Mesh(new THREE.PlaneGeometry(lx*2,D),new THREE.MeshLambertMaterial({map:ct}));cliff.position.set(0,-D/2,A/sn);g.add(cliff);
  for(const sx of [-1,1]){const e=new THREE.Mesh(new THREE.PlaneGeometry(A*2/sn,D),cliff.material);e.rotation.y=sx*Math.PI/2;e.position.set(sx*lx,-D/2,0);g.add(e)}   // הקצוות בצדדים
  g.userData={glow,glowLo,sn};R3D.scene.add(g);mb3dDecor(g);return g;
}
// הקישוטים מ-mbDecor (moba-look.js): אותם מקומות כמו בדו-ממד ובמפה הקטנה. המודלים של KayKit כבר נטענו (R3D.props)
function mb3dDecor(g){
  const K=MB3D.decor,glows=[];
  for(const d of mbDecor()){
    if(d.k==='bush'||d.k==='rock'){const sp=K[d.k],pick=sp.pick[Math.floor(d.v*sp.pick.length)%sp.pick.length];
      if(!R3D.props[pick.model])continue;try{wPut({model:pick.model,w:d.r*2*pick.k,tint:pick.tint,glow:pick.glow},d.x,d.y,d.v,1,g)}catch(e){}}
    else if(d.k==='fire'){const f=new THREE.Group(),col=MOBA.team[d.team];
      p3Mesh(p3Cyl(13,16,8,8),p3Mat(MB3D.col.dark),0,4,0,f);p3Mesh(p3Cyl(6,8,40,6),p3Mat(MB3D.col.stone),0,28,0,f);p3Mesh(p3Cyl(15,9,10,8),p3Mat(MB3D.col.iron),0,52,0,f);
      const fl=p3Mesh(new THREE.ConeGeometry(9,24,6),new THREE.MeshBasicMaterial({color:C.ember,toneMapped:false}),0,68,0,f),halo=p3Halo(col,K.fireHalo,66,f);glows.push([fl,halo,d.v]);p3At(f,d.x,d.y,g)}
    else if(d.k==='flag'){const f=new THREE.Group(),col=MOBA.team[d.team],sx=d.team?-1:1;
      p3Mesh(p3Cyl(2.5,3,100,6),p3Mat(MB3D.col.iron),0,50,0,f);p3Mesh(new THREE.SphereGeometry(4.5,8,6),p3Mat(C.gold),0,102,0,f);
      const cl=p3Mesh(new THREE.PlaneGeometry(34,30),new THREE.MeshLambertMaterial({color:col,side:THREE.DoubleSide,emissive:new THREE.Color(col).multiplyScalar(0.25)}),sx*18,82,0,f);glows.push([cl,null,d.v]);p3At(f,d.x,d.y,g)}
  }
  g.userData.fires=glows;
}
const mb3dOn=()=>typeof R3D!=='undefined'&&R3D.on&&R3D.ready&&typeof THREE!=='undefined'&&typeof p3Mesh==='function';
function mb3dBuild(b){
  const g=new THREE.Group(),isBase=b.k==='base',T=isBase?MB3D.base:MB3D.tower,k=1/COS(),c=MB3D.col,team=MOBA.team[b.team],H=T.h*k,parts=new THREE.Group();g.add(parts);
  const glow=p3Mat(team,true),gold=p3Mat(C.gold);
  if(isBase){   // מבצר: במה בשלוש מדרגות עם טבעת זוהרת, מגדל מרכזי, ארבעה עמודים עם אבני אור, גג בצבע הקבוצה וגביש גדול
    p3Mesh(p3Cyl(T.r*1.5,T.r*1.65,H*0.08,12),p3Mat(c.dark),0,H*0.04,0,parts);
    p3Mesh(p3Cyl(T.r*1.53,T.r*1.53,H*0.025,12),glow,0,H*0.09,0,parts);
    p3Mesh(p3Cyl(T.r*1.25,T.r*1.4,H*0.1,12),p3Mat(c.stone),0,H*0.15,0,parts);
    p3Mesh(p3Box(T.r*1.25,H*0.46,T.r*1.25),p3Mat(c.stone),0,H*0.2+H*0.23,0,parts);
    p3Mesh(p3Box(T.r*1.32,H*0.05,T.r*1.32),p3Mat(c.iron),0,H*0.66,0,parts);
    for(const sd of [-1,1]){p3Mesh(p3Box(T.r*0.5,H*0.2,2),glow,0,H*0.42,sd*T.r*0.63,parts);p3Mesh(p3Box(2,H*0.2,T.r*0.5),glow,sd*T.r*0.63,H*0.42,0,parts)}   // רונות זוהרות על הקירות
    for(const [sx,sz] of [[1,1],[1,-1],[-1,1],[-1,-1]]){p3Mesh(p3Cyl(7,10,H*0.7,6),p3Mat(c.dark),sx*T.r*0.75,H*0.35,sz*T.r*0.75,parts);
      p3Mesh(p3Cyl(10,8,H*0.05,6),p3Mat(c.iron),sx*T.r*0.75,H*0.72,sz*T.r*0.75,parts);p3Mesh(new THREE.OctahedronGeometry(6,0),glow,sx*T.r*0.75,H*0.78,sz*T.r*0.75,parts)}
    p3Mesh(new THREE.ConeGeometry(T.r*0.98,H*0.3,4),p3Mat(team),0,H*0.69+H*0.15,0,parts).rotation.y=Math.PI/4;
    p3Mesh(new THREE.SphereGeometry(5,8,6),gold,0,H*0.99,0,parts);
  }else{   // מגדל: במה עם טבעת זוהרת, עמוד עם פסי רונות בצבע הקבוצה, כתר ברזל עם קוצים, וגביש
    p3Mesh(p3Cyl(T.r*1.05,T.r*1.3,H*0.12,8),p3Mat(c.dark),0,H*0.06,0,parts);
    p3Mesh(p3Cyl(T.r*1.08,T.r*1.08,H*0.025,8),glow,0,H*0.13,0,parts);
    p3Mesh(p3Cyl(T.r*0.56,T.r*0.82,H*0.64,8),p3Mat(c.stone),0,H*0.14+H*0.32,0,parts);
    for(let i=0;i<4;i++){const a=i/4*Math.PI*2+Math.PI/8,m=p3Mesh(p3Box(3,H*0.42,3),glow,Math.cos(a)*T.r*0.7,H*0.46,Math.sin(a)*T.r*0.7,parts);m.rotation.z=-Math.cos(a)*0.08;m.rotation.x=Math.sin(a)*0.08}
    p3Mesh(p3Cyl(T.r*1.0,T.r*0.66,H*0.1,8),p3Mat(c.iron),0,H*0.78+H*0.05,0,parts);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2,m=p3Mesh(new THREE.ConeGeometry(3.5,H*0.16,4),p3Mat(c.iron),Math.cos(a)*T.r*0.9,H*0.95,Math.sin(a)*T.r*0.9,parts);m.rotation.z=-Math.cos(a)*0.35;m.rotation.x=Math.sin(a)*0.35}
    p3Mesh(p3Cyl(T.r*0.3,T.r*0.3,H*0.06,8),gold,0,H*0.91,0,parts);
  }
  if(typeof p3Pool==='function')p3Pool(team,T.halo*0.9,parts);   // זוהר בצבע הקבוצה על הרצפה
  const cy=H+T.cry*1.6*k,cry=p3Mesh(new THREE.OctahedronGeometry(T.cry,0),new THREE.MeshBasicMaterial({color:team,toneMapped:false}),0,cy,0,g);cry.scale.y=1.5;
  const halo=p3Halo(team,T.halo,cy,g);
  const rubble=new THREE.Group();g.add(rubble);rubble.visible=false;   // אחרי שנפל: אבנים על הקרקע
  for(let i=0;i<7;i++){const a=i/7*6.28,d=T.r*(0.3+0.5*hash(i,b.x)),s=T.r*(0.25+0.2*hash(b.x,i));
    p3Mesh(p3Box(s,s*0.7,s),p3Mat(i%2?c.stone:c.dark),Math.cos(a)*d,s*0.35,Math.sin(a)*d,rubble).rotation.y=a}
  g.userData={parts,cry,halo,rubble,team:new THREE.Color(team),dark:new THREE.Color(team).multiplyScalar(MB3D.dim),white:new THREE.Color('#ffffff')};
  return p3At(g,b.x,b.y,M3.g);
}
function mb3dSync(){
  const on=mb3dOn()&&S&&S.mb;
  if(R3D.ground)R3D.ground.visible=!on;   // הרצפה הכללית של הזירה: רק מחוץ למשחקי השאול
  if(!on){if(M3.g)M3.g.visible=false;if(M3.floor)M3.floor.visible=false;return}
  if(!M3.floor||M3.floor.userData.sn!==SIN()){if(M3.floor)R3D.scene.remove(M3.floor);M3.floor=mb3dFloor()}   // זווית מצלמה אחרת: בונים מחדש
  M3.floor.visible=true;{const u=M3.floor.userData,p=mbPulse(),tt=performance.now()/1000;u.glow.material.opacity=p;u.glowLo.material.opacity=p;
    for(const [fl,halo,v] of u.fires){const f=0.85+0.15*Math.sin(tt*9+v*20);fl.scale.set(1,f,1);if(halo)halo.material.opacity=0.6+0.4*f;else fl.rotation.y=Math.sin(tt*2+v*9)*0.25}}
  if(!M3.g){M3.g=new THREE.Group();R3D.scene.add(M3.g)}
  if(M3.mb!==S.mb){for(const g of M3.map.values())M3.g.remove(g);M3.map.clear();M3.mb=S.mb}   // משחק חדש: בונים מחדש
  M3.g.visible=true;const t=performance.now()/1000;
  for(const b of S.mb.u){if(b.k!=='tower'&&b.k!=='base')continue;
    let g=M3.map.get(b);if(!g){g=mb3dBuild(b);M3.map.set(b,g)}
    const u=g.userData;u.parts.visible=!b.dead;u.cry.visible=u.halo.visible=!b.dead;u.rubble.visible=b.dead;if(b.dead)continue;
    u.parts.position.x=b.flash>0?Math.sin(t*90)*2.5:0;   // פגיעה: המבנה רועד לרגע
    u.cry.rotation.y=t*MB3D.spin;u.cry.material.color.copy(b.flash>0?u.white:mbHittable(b)?u.team:u.dark);u.halo.visible=mbHittable(b);
  }
}
const mb3dHere=()=>mb3dOn()&&!!(S&&S.mb);   // moba.js שואל: האם המגדלים מצוירים בתלת-ממד (ואז הקנבס מצייר רק חיים וטווח)
(function(){const base=window.render3d;window.render3d=function(...a){try{mb3dSync()}catch(e){console.error(e)}return base.apply(this,a)}})();
