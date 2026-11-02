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
  dim:0.35,     // כמה צבע נשאר בגביש של מבנה מוגן
};
const M3={g:null,map:new Map(),mb:null};
const mb3dOn=()=>typeof R3D!=='undefined'&&R3D.on&&R3D.ready&&typeof THREE!=='undefined'&&typeof p3Mesh==='function';
function mb3dBuild(b){
  const g=new THREE.Group(),isBase=b.k==='base',T=isBase?MB3D.base:MB3D.tower,k=1/COS(),c=MB3D.col,team=MOBA.team[b.team],H=T.h*k,parts=new THREE.Group();g.add(parts);
  if(isBase){
    p3Mesh(p3Cyl(T.r*1.15,T.r*1.3,H*0.16,10),p3Mat(c.dark),0,H*0.08,0,parts);
    p3Mesh(p3Box(T.r*1.3,H*0.5,T.r*1.3),p3Mat(c.stone),0,H*0.16+H*0.25,0,parts);
    for(const [sx,sz] of [[1,1],[1,-1],[-1,1],[-1,-1]])p3Mesh(p3Cyl(7,9,H*0.66,6),p3Mat(c.dark),sx*T.r*0.68,H*0.33,sz*T.r*0.68,parts);
    p3Mesh(new THREE.ConeGeometry(T.r*1.0,H*0.26,4),p3Mat(team),0,H*0.66+H*0.13,0,parts).rotation.y=Math.PI/4;
  }else{
    p3Mesh(p3Cyl(T.r,T.r*1.2,H*0.14,8),p3Mat(c.dark),0,H*0.07,0,parts);
    p3Mesh(p3Cyl(T.r*0.58,T.r*0.82,H*0.66,8),p3Mat(c.stone),0,H*0.14+H*0.33,0,parts);
    p3Mesh(p3Cyl(T.r*0.95,T.r*0.7,H*0.1,8),p3Mat(c.iron),0,H*0.8+H*0.05,0,parts);
  }
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
  if(!on){if(M3.g)M3.g.visible=false;return}
  if(!M3.g){M3.g=new THREE.Group();R3D.scene.add(M3.g)}
  if(M3.mb!==S.mb){for(const g of M3.map.values())M3.g.remove(g);M3.map.clear();M3.mb=S.mb}   // משחק חדש: בונים מחדש
  M3.g.visible=true;const t=performance.now()/1000;
  for(const b of S.mb.u){if(b.k!=='tower'&&b.k!=='base')continue;
    let g=M3.map.get(b);if(!g){g=mb3dBuild(b);M3.map.set(b,g)}
    const u=g.userData;u.parts.visible=!b.dead;u.cry.visible=u.halo.visible=!b.dead;u.rubble.visible=b.dead;if(b.dead)continue;
    u.cry.rotation.y=t*MB3D.spin;u.cry.material.color.copy(b.flash>0?u.white:mbHittable(b)?u.team:u.dark);u.halo.visible=mbHittable(b);
  }
}
const mb3dHere=()=>mb3dOn()&&!!(S&&S.mb);   // moba.js שואל: האם המגדלים מצוירים בתלת-ממד (ואז הקנבס מצייר רק חיים וטווח)
(function(){const base=window.render3d;window.render3d=function(...a){try{mb3dSync()}catch(e){console.error(e)}return base.apply(this,a)}})();
