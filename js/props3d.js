/* חפצי העולם בתלת-ממד (ניר, 1.11.2026: "חייבים לשפר את הגרפיקה של הפנסים... אני רוצה משחק פרימיום").
   עד עכשיו הפנס, המקדש, מגדל התצפית והתיבה היו ציור שטוח בקנבס מעל התלת-ממד, ונראו כמו מקל וקופסה וערימת אבנים.
   כאן הם נבנים מצורות פשוטות (בלי קבצים חדשים, קל לטלפון), באותו סגנון low-poly של KayKit: אבן, ברזל כהה, עץ וזהב.
   - פנס (STORY.lanterns ב-story.js, ושישת העמודים בכפר ב-homecoming.js): בסיס אבן, עמוד ברזל, כלוב עם גביש בצבע היסוד.
     כבוי: גביש כהה עם ניצוץ חלש. דולק: גביש זוהר, הילה, ושלולית אור על הקרקע שמהבהבת.
     טקס הדלקה: כשפנס עובר מכבוי לדולק מול השחקן, עמוד אור עולה לשמיים, טבעת מתפשטת על הקרקע והגביש קופץ.
   - מקדש (סוד shrine): בסיס, שני עמודים ומשקוף, וכדור אור בצבע הברכה. מוכן: בהיר ומרחף. בהמתנה: עמום.
   - מגדל תצפית (סוד lookout): מגדל עץ עם רגליים, במה, גג ודגל. רואים אותו מרחוק.
   - תיבה (סוד chest): תיבת עץ עם פסי זהב, כשהיא נחשפת.
   כל המספרים ב-PROPS3D. החיבור: שתי שורות ב-render3d.js (syncWorld, syncVillage). בדו-ממד לא משתנה כלום (הקנבס מצייר כמו קודם). */
const PROPS3D={
  col:{stone:'#b9bfc9',stoneDark:'#868d99',iron:'#555a68',gold:'#f0c35a',wood:'#7a5532',woodDark:'#5a3d24',roof:'#b24a32',off:'#56607a'},
  lantern:{h:118,world:1.8,village:0.9,   // גובה המודל, ופי כמה בעולם ובכפר
    pool:{r:150,a:0.55,flick:0.12},   // שלולית האור על הקרקע: רדיוס, כמה חזקה, וכמה מהבהבת
    halo:{size:110,a:0.9},             // ההילה סביב הגביש
    off:{glow:0.28,pulse:0.18},        // כבוי: כמה מצבע היסוד נשאר בגביש, ופעימה חלשה
    ignite:{dur:1.8,beam:520,ring:220}},   // טקס ההדלקה: כמה שניות, גובה עמוד האור, רדיוס הטבעת
  shrine:{w:48,orb:9,halo:70},
  lookout:{h:150,w:38},
  chest:{w:30,dx:18}   // dx: התיבה זזה הצידה מהסלע שמסתיר אותה, כמו בקנבס
};
const P3={mats:{},tex:null,t0:performance.now()};
function p3Mat(c,glow){const k=c+(glow?'g':'');return P3.mats[k]||(P3.mats[k]=glow?new THREE.MeshBasicMaterial({color:c,toneMapped:false,fog:false}):new THREE.MeshLambertMaterial({color:c,flatShading:true}))}
// עיגול רך לבן: להילות ולשלולית האור
function p3Soft(){
  if(P3.tex)return P3.tex;const T=128,c=document.createElement('canvas');c.width=c.height=T;const g=c.getContext('2d'),gr=g.createRadialGradient(T/2,T/2,0,T/2,T/2,T/2);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.35,'rgba(255,255,255,0.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,T,T);
  return P3.tex=new THREE.CanvasTexture(c);
}
const p3Add=c=>({color:c,map:p3Soft(),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,fog:false});
function p3Mesh(geo,mat,x,y,z,g){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);g.add(m);return m}
const p3Cyl=(rt,rb,h,n=8)=>new THREE.CylinderGeometry(rt,rb,h,n);
const p3Box=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
// שלולית אור על הקרקע, עגולה על המסך (כמו המים ב-render3d.js)
function p3Pool(col,r,g){const m=new THREE.Mesh(new THREE.PlaneGeometry(r*2,r*2),new THREE.MeshBasicMaterial(p3Add(col)));m.rotation.x=-Math.PI/2;m.scale.set(1,1/SIN(),1);m.position.y=0.9;g.add(m);return m}
function p3Halo(col,size,y,g){const s=new THREE.Sprite(new THREE.SpriteMaterial(p3Add(col)));s.scale.set(size,size,1);s.position.y=y;g.add(s);return s}
function p3At(o,x,y,g){o.position.set(x,0,y/SIN());g.add(o);return o}

/* ---- הפנס ---- */
function p3Lantern(col,mul){
  const C=PROPS3D.col,L=PROPS3D.lantern,h=L.h,g=new THREE.Group(),st=p3Mat(C.stone),sd=p3Mat(C.stoneDark),ir=p3Mat(C.iron),au=p3Mat(C.gold);
  p3Mesh(p3Cyl(22,26,8),sd,0,4,0,g);p3Mesh(p3Cyl(16,20,10),st,0,13,0,g);   // בסיס אבן בשתי מדרגות
  p3Mesh(p3Cyl(3.2,4.2,h*0.62,6),ir,0,18+h*0.31,0,g);                     // העמוד
  p3Mesh(p3Cyl(5.5,5.5,3,8),au,0,24,0,g);p3Mesh(p3Cyl(5,5,3,8),au,0,18+h*0.62,0,g);   // טבעות זהב
  const cy=h*0.62+34;                                                     // מרכז הכלוב
  p3Mesh(p3Cyl(12,9,4,6),ir,0,cy-15,0,g);                                 // רצפת הכלוב
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;p3Mesh(p3Box(1.8,26,1.8),ir,Math.cos(a)*11,cy,Math.sin(a)*11,g)}   // שישה מוטות
  p3Mesh(new THREE.ConeGeometry(15,14,6),ir,0,cy+20,0,g);                 // גג
  p3Mesh(new THREE.SphereGeometry(3.2,6,4),au,0,cy+29,0,g);               // כדור זהב בראש
  const cr=p3Mesh(new THREE.OctahedronGeometry(10,0),new THREE.MeshBasicMaterial({color:C.off,toneMapped:false}),0,cy,0,g);cr.scale.y=1.45;   // הגביש
  const halo=p3Halo(col,L.halo.size,cy,g),pool=p3Pool(col,L.pool.r,g);
  const beam=p3Mesh(p3Cyl(16,26,1,10),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,fog:false,side:THREE.DoubleSide}),0,0,0,g);
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.82,1,48),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,fog:false}));
  ring.rotation.x=-Math.PI/2;ring.position.y=1.2;g.add(ring);
  g.scale.setScalar(mul);
  g.userData.L={col:new THREE.Color(col),off:new THREE.Color(C.off),cr,halo,pool,beam,ring,cy,lit:null,ign:0,seed:Math.random()*9};
  return g;
}
// כל פריים: דולק או כבוי, הבהוב, וטקס ההדלקה. live: הפנס נראה כבר כבוי, אז מעבר לדולק הוא רגע שהשחקן רואה
function p3LanternTick(g,lit,t,dt,onIgnite){
  const D=g.userData.L,L=PROPS3D.lantern;
  if(D.lit===false&&lit){D.ign=L.ignite.dur;if(onIgnite)onIgnite()}
  D.lit=lit;
  const f=1+Math.sin(t*7.3+D.seed)*0.5*L.pool.flick+Math.sin(t*13.1+D.seed*2)*0.5*L.pool.flick,ig=D.ign>0?1-D.ign/L.ignite.dur:1;
  if(D.ign>0)D.ign=Math.max(0,D.ign-dt);
  if(lit){
    const pop=D.ign>0?1+Math.sin(Math.min(1,ig*2.2)*Math.PI)*0.7:1;   // הגביש קופץ בהדלקה
    D.cr.material.color.copy(D.col);D.cr.scale.set(pop,1.45*pop,pop);D.cr.rotation.y=t*0.9;D.cr.position.y=D.cy+Math.sin(t*2+D.seed)*1.5;
    D.halo.visible=D.pool.visible=true;D.halo.material.opacity=L.halo.a*f*Math.min(1,ig*3);D.halo.scale.setScalar(L.halo.size*(0.92+0.08*f)*pop);
    D.pool.material.opacity=L.pool.a*f*Math.min(1,ig*1.5);
  }else{
    const p=L.off.glow+Math.max(0,Math.sin(t*1.3+D.seed))*L.off.pulse;
    D.cr.material.color.copy(D.off).lerp(D.col,p);D.cr.scale.set(1,1.45,1);D.cr.rotation.y=0;D.cr.position.y=D.cy;
    D.halo.visible=D.pool.visible=false;
  }
  const on=D.ign>0;D.beam.visible=D.ring.visible=on;
  if(on){const bh=L.ignite.beam*Math.min(1,ig*3);D.beam.scale.set(1,bh,1);D.beam.position.y=bh/2;D.beam.material.opacity=0.55*(1-ig);
    const rr=L.ignite.ring*ig;D.ring.scale.set(rr,rr/SIN(),1);D.ring.material.opacity=0.9*(1-ig)}
}

/* ---- המקדש ---- */
function p3Shrine(col){
  const C=PROPS3D.col,w=PROPS3D.shrine.w,g=new THREE.Group(),st=p3Mat(C.stone),sd=p3Mat(C.stoneDark),au=p3Mat(C.gold);
  p3Mesh(p3Box(w+10,5,w*0.7),sd,0,2.5,0,g);p3Mesh(p3Box(w,5,w*0.55),st,0,7.5,0,g);   // שתי מדרגות
  for(const s of [-1,1]){p3Mesh(p3Cyl(3.6,4.4,40,6),st,s*w*0.36,30,0,g);p3Mesh(p3Box(10,4,10),sd,s*w*0.36,12,0,g)}   // עמודים
  p3Mesh(p3Box(w+8,6,14),sd,0,53,0,g);p3Mesh(new THREE.ConeGeometry(w*0.62,12,4),p3Mat(C.roof),0,62,0,g).rotation.y=Math.PI/4;   // משקוף וגג
  p3Mesh(p3Cyl(6,7,6,8),au,0,13,0,g);   // מזבח קטן מזהב
  const orb=p3Mesh(new THREE.IcosahedronGeometry(PROPS3D.shrine.orb,0),new THREE.MeshBasicMaterial({color:col,toneMapped:false}),0,30,0,g);
  const halo=p3Halo(col,PROPS3D.shrine.halo,30,g);
  g.userData.S={orb,halo,col:new THREE.Color(col),off:new THREE.Color(C.off),seed:Math.random()*9};
  return g;
}
function p3ShrineTick(g,ready,t){
  const D=g.userData.S;D.orb.rotation.y=t*1.2;D.orb.position.y=30+(ready?Math.sin(t*2.4+D.seed)*3:0);
  D.orb.material.color.copy(D.off).lerp(D.col,ready?1:0.25);D.halo.visible=ready;
  if(ready)D.halo.material.opacity=0.55+Math.sin(t*2.4+D.seed)*0.2;
}

/* ---- מגדל התצפית ---- */
function p3Lookout(col){
  const C=PROPS3D.col,{h,w}=PROPS3D.lookout,g=new THREE.Group(),wd=p3Mat(C.wood),wk=p3Mat(C.woodDark),ph=h*0.68;
  p3Mesh(p3Cyl(w*0.8,w*0.9,6,7),p3Mat(C.stoneDark),0,3,0,g);   // בסיס אבן
  for(const [sx,sz] of [[1,1],[1,-1],[-1,1],[-1,-1]]){const m=p3Mesh(p3Box(4.5,ph,4.5),wk,sx*w*0.42,ph/2,sz*w*0.42,g);m.rotation.z=-sx*0.07;m.rotation.x=sz*0.07}   // ארבע רגליים, צרות למעלה
  for(const y of [ph*0.35,ph*0.7])for(const s of [-1,1]){const e=w*0.42*(1-y/ph*0.12);p3Mesh(p3Box(w*0.85,2.5,2.5),wd,0,y,s*e,g);p3Mesh(p3Box(2.5,2.5,w*0.85),wd,s*e,y,0,g)}   // קורות רוחב בארבעת הצדדים
  p3Mesh(p3Box(w*1.05,5,w*1.05),wd,0,ph+2,0,g);   // הבמה
  for(const [sx,sz] of [[1,1],[1,-1],[-1,1],[-1,-1]])p3Mesh(p3Box(2.5,16,2.5),wk,sx*w*0.48,ph+12,sz*w*0.48,g);   // מעקה
  for(const s of [-1,1]){p3Mesh(p3Box(w,2,2),wd,0,ph+14,s*w*0.48,g);p3Mesh(p3Box(2,2,w),wd,s*w*0.48,ph+14,0,g)}   // מאחז היד
  p3Mesh(new THREE.ConeGeometry(w*0.85,h*0.17,4),p3Mat(C.roof),0,ph+22+h*0.085,0,g).rotation.y=Math.PI/4;   // גג
  const top=ph+22+h*0.17;p3Mesh(p3Cyl(1,1,30,4),p3Mat(C.iron),0,top+15,0,g);   // תורן
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(22,13),new THREE.MeshLambertMaterial({color:col,side:THREE.DoubleSide}));fl.position.set(11,top+23,0);g.add(fl);
  g.userData.flag=fl;return g;
}
/* ---- התיבה ---- */
function p3Chest(band){
  const C=PROPS3D.col,w=PROPS3D.chest.w,g=new THREE.Group(),wd=p3Mat(C.wood),au=p3Mat(band||C.gold);
  p3Mesh(p3Box(w,w*0.5,w*0.62),wd,0,w*0.25,0,g);
  const lid=p3Mesh(new THREE.CylinderGeometry(w*0.31,w*0.31,w,8,1,false,0,Math.PI),wd,0,w*0.5,0,g);lid.rotation.z=Math.PI/2;
  for(const s of [-0.3,0.3])p3Mesh(p3Box(w*0.1,w*0.82,w*0.66),au,s*w,w*0.4,0,g);   // פסי זהב
  p3Mesh(p3Box(w*0.18,w*0.2,w*0.08),au,0,w*0.45,w*0.33,g);   // מנעול
  return g;
}

/* ---- חיבור לעולם ולכפר (render3d.js) ---- */
// נבנה פעם אחת לכל אזור (syncWorld): הפנס של האזור והסודות
function props3dWorld(G,reg){
  for(const k in STORY.lanterns){const L=STORY.lanterns[k];if(L.reg!==reg)continue;(G.lan||(G.lan={}))[k]=p3At(p3Lantern(L.glow,PROPS3D.lantern.world),L.x,L.y,G.g)}
  for(const s of SECRETS.regions[reg]||[]){
    if(s.kind==='shrine')(G.shr||(G.shr={}))[s.id]=p3At(p3Shrine(SECRETS.shrine.col[s.bless]),s.x,s.y,G.g);
    else if(s.kind==='lookout'){const m=p3At(p3Lookout(SECRETS.lookout.col),s.x,s.y,G.g);m.rotation.y=hash(s.x,s.y)*0.6-0.3;(G.look||(G.look=[])).push(m)}
    else if(s.kind==='chest'){const m=p3At(p3Chest(),s.x+PROPS3D.chest.dx,s.y+4,G.g);m.rotation.y=-0.35;m.visible=false;(G.chest||(G.chest={}))[s.id]=m}
  }
}
// כל פריים בעולם
function props3dWorldTick(G){
  const t=(performance.now()-P3.t0)/1000,dt=Math.min(0.1,t-(P3.last||t));P3.last=t;
  for(const k in G.lan||{}){const L=STORY.lanterns[k];p3LanternTick(G.lan[k],storyOpen(k),t,dt,()=>{sparks(L.x,L.y-90,L.glow,26,260);S.shake=Math.max(S.shake||0,4);sfx('celebrate')})}
  if(G.shr||G.chest){const st=scState();
    for(const id in G.shr||{})p3ShrineTick(G.shr[id],!(st.cd[id]>0),t);
    for(const id in G.chest||{})G.chest[id].visible=!scFound(id)&&!!st['v'+id]}
  for(const m of G.look||[]){const f=m.userData.flag;f.rotation.y=Math.sin(t*3+m.position.x)*0.25}
}
// הכפר: שישה עמודים קטנים (HOME.posts), באותו עיצוב. נדלקים כשהתושב חוזר (homeBack)
function props3dVillage(V){
  if(typeof HOME==='undefined')return;
  if(!V.lan){V.lan={};for(const p of HOME.posts){const {x,y}=homePost(p);V.lan[p.k]=p3At(p3Lantern(homeCol(p.k),PROPS3D.lantern.village),x,y,V.g)}}
  const t=(performance.now()-P3.t0)/1000,dt=Math.min(0.1,t-(P3.lastV||t));P3.lastV=t;
  for(const p of HOME.posts){const {x,y}=homePost(p);p3LanternTick(V.lan[p.k],!!STO()[p.k]&&homeBack(p.k),t,dt,()=>sparks(x,y-60,homeCol(p.k),18,200))}
}

/* ---- מקורות משאבים (nodes.js) שהיו סלע אחד צבוע: עורקי מתכת וגבישים נראים עכשיו כמו מה שהם.
   vein (נחושת, ברזל, כסף...): סלע אפור עם גושי מתכת בולטים בצבע המשאב. crystal (אבני גאות, קרח, להבה, סערה, חלל): אשכול גבישים זוהרים על סלע.
   chest: תיבת עץ עם פסים בצבע הדרגה (עץ, ברזל, זהב) ---- */
PROPS3D.node={rock:{model:'v_rock',w:58,tint:'#c9ccd4'},vein:{n:5,size:8,glow:0.4},crystal:{n:5,h:[22,40],glow:0.45},chest:{w:34}};
function p3Ore(n,K,shape,g){
  const N=PROPS3D.node,v=hash(n.x,n.y),grp=new THREE.Group(),col=new THREE.Color(K.col);
  p3At(grp,n.x,n.y,g);grp.rotation.y=v*6.28;
  if(R3D.props[N.rock.model]){const r=vPut(N.rock.model,0,0,N.rock.w*(shape==='crystal'?0.75:1),0,grp);r.position.z=0;
    r.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.color.multiply(new THREE.Color(N.rock.tint))}})}
  const m=new THREE.MeshLambertMaterial({color:col,flatShading:true,emissive:col.clone().multiplyScalar(shape==='crystal'?N.crystal.glow:N.vein.glow)});
  if(shape==='crystal'){const C=N.crystal;
    for(let i=0;i<C.n;i++){const a=i/C.n*6.28+v,h=C.h[0]+(C.h[1]-C.h[0])*hash(i,n.x),d=i?14:0,c=new THREE.Mesh(new THREE.OctahedronGeometry(1,0),m);
      c.scale.set(h*0.22,h*0.5,h*0.22);c.position.set(Math.cos(a)*d,h*0.32+(i?6:14),Math.sin(a)*d);c.rotation.set(i?Math.cos(a)*0.45:0,a,i?Math.sin(a)*0.45:0);grp.add(c)}}
  else{const V=N.vein;
    for(let i=0;i<V.n;i++){const a=i/V.n*6.28+v*3,c=new THREE.Mesh(new THREE.DodecahedronGeometry(V.size*(0.8+hash(i,n.y)*0.5),0),m);
      c.position.set(Math.cos(a)*13,16+hash(n.x,i)*16,Math.sin(a)*13);grp.add(c)}}
  return grp;
}
function props3dNode(n,g){
  const K=wKind(n.kind);
  if(K.shape==='vein'||K.shape==='crystal')return p3Ore(n,K,K.shape,g);
  if(K.shape==='chest'){const c=p3At(p3Chest(K.col),n.x,n.y,g);c.scale.setScalar(PROPS3D.node.chest.w/PROPS3D.chest.w);c.rotation.y=hash(n.x,n.y)*1.2-0.6;return c}
  return null;
}
