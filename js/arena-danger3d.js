/* רגע הסכנה של הבוס בתלת-ממד (arena-danger.js, MLBB 2.1). אוראל, 9.11: "רוב המשחק בתלת-ממד, לכן כל התאמה נבדקת קודם בתלת-ממד".
   הקנבס מצויר מעל כל הסצנה, ולכן מילוי שמצויר עליו צובע את הגוף של הבוס ושל הגיבור. כאן המילוי, הקו החיצוני וסימני החריכה
   הם צורות שוכבות על הרצפה בסצנה עצמה: דמות שעומדת עליהן מסתירה אותן, כמו בדו-ממד (שם הן מצוירות לפני הדמויות).
   הנתונים והמצב נשארים ב-arena-danger.js (ARDG, ARDGS, ardgPts). כאן רק הציור: מאגר קבוע של צורות, ובכל פריים רק מעדכנים
   את המיקומים במערכים שכבר קיימים, בלי הקצאות. הבזק הבוס נשאר בקנבס, כי הוא אמור להיות מעליו.
   חיבור: ardg3d() ב-render3d.js אחרי maze3d. כשהתלת-ממד דלוק, ardgDrawUnder בקנבס מדלג על המילוי ועל החריכה */
const ARDG3D={
  y:0.6,        // גובה מעל הרצפה (שלא יתערבב איתה)
  slots:12,     // כמה צורות בבת אחת: צורה לכל בוס, עיגול לכל נקודת זימון ולכל מוקש
  pts:64,       // נקודות לכל צורה לכל היותר
  edge:3        // עובי הקו החיצוני (יחידות משחק). בהבהוב: + ARDG.tickW
};
const AD3={on:false,sl:[],sc:[],pt:new Float32Array(ARDG3D.pts*2),n:0};
// מאגר: לכל משבצת מילוי (מניפה מנקודה 0) וקו (רצועה סביב), כל אחד עם מערך קבוע
function ardg3dInit(){
  const P_=ARDG3D.pts,col=new THREE.Color(ARDG.col);
  const mk=(n)=>{const g=new THREE.BufferGeometry(),a=new Float32Array(n*3);g.setAttribute('position',new THREE.BufferAttribute(a,3).setUsage(THREE.DynamicDrawUsage));g.setDrawRange(0,0);
    const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.2,depthWrite:false,side:THREE.DoubleSide}));m.frustumCulled=false;m.visible=false;m.renderOrder=2;R3D.scene.add(m);return m};
  for(let i=0;i<ARDG3D.slots;i++)AD3.sl.push({fill:mk((P_-2)*3),edge:mk(P_*6)});
  const tex=new THREE.CanvasTexture(ardgScorchImg());
  for(let i=0;i<ARDG.scorch.max;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));
    m.frustumCulled=false;m.visible=false;m.renderOrder=1;R3D.scene.add(m);AD3.sc.push(m)}
  AD3.on=true;
}
// הנקודות של הצורה (קמורה, במקום משחק) למערך AD3.pt. center: עיגול לכל נקודת זימון או מוקש
function ardg3dCircle(x,y,R){const n=48,pt=AD3.pt;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;pt[i*2]=x+Math.cos(a)*R;pt[i*2+1]=y+Math.sin(a)*R}AD3.n=n}
function ardg3dShapePts(b,st,s){
  const S_=ARDG.shape,k=st.k,pt=AD3.pt;
  if(k==='aimed'){const C=S_.cone,n=33;pt[0]=b.x;pt[1]=b.y;for(let i=0;i<n-1;i++){const a=st.a-C.half+2*C.half*i/(n-2);pt[2+i*2]=b.x+Math.cos(a)*C.len*s;pt[3+i*2]=b.y+Math.sin(a)*C.len*s}AD3.n=n}
  else if(k==='charge'){const L=(S_.charge.len+b.r)*s,w=b.r,ux=Math.cos(st.a),uy=Math.sin(st.a);
    pt[0]=b.x-uy*w;pt[1]=b.y+ux*w;pt[2]=b.x+ux*L-uy*w;pt[3]=b.y+uy*L+ux*w;pt[4]=b.x+ux*L+uy*w;pt[5]=b.y+uy*L-ux*w;pt[6]=b.x+uy*w;pt[7]=b.y-ux*w;AD3.n=4}
  else ardg3dCircle(b.x,b.y,ardgR(b,k)*s);
}
// מילוי: מניפה מנקודה 0 (הצורות קמורות). בתלת-ממד z=y/sin, כמו כל השכבות
function ardg3dFill(m,op){
  const pt=AD3.pt,n=AD3.n,a=m.geometry.attributes.position.array,sn=SIN(),y=ARDG3D.y;let j=0;
  for(let i=1;i<n-1;i++){a[j++]=pt[0];a[j++]=y;a[j++]=pt[1]/sn;a[j++]=pt[i*2];a[j++]=y;a[j++]=pt[i*2+1]/sn;a[j++]=pt[i*2+2];a[j++]=y;a[j++]=pt[i*2+3]/sn}
  m.geometry.setDrawRange(0,j/3);m.geometry.attributes.position.needsUpdate=true;m.material.opacity=op;m.visible=op>0.01&&j>0;
}
// קו: רצועה בעובי w, מהשפה החוצה (לפי המרכז של הצורה)
function ardg3dEdge(m,op,w){
  const pt=AD3.pt,n=AD3.n,a=m.geometry.attributes.position.array,sn=SIN(),y=ARDG3D.y+0.1;let cx=0,cy=0,j=0;
  for(let i=0;i<n;i++){cx+=pt[i*2];cy+=pt[i*2+1]}cx/=n;cy/=n;
  for(let i=0;i<n;i++){const i2=(i+1)%n,x1=pt[i*2],y1=pt[i*2+1],x2=pt[i2*2],y2=pt[i2*2+1],d1=Math.hypot(x1-cx,y1-cy)||1,d2=Math.hypot(x2-cx,y2-cy)||1;
    const X1=x1+(x1-cx)/d1*w,Y1=y1+(y1-cy)/d1*w,X2=x2+(x2-cx)/d2*w,Y2=y2+(y2-cy)/d2*w;
    a[j++]=x1;a[j++]=y;a[j++]=y1/sn;a[j++]=x2;a[j++]=y;a[j++]=y2/sn;a[j++]=X2;a[j++]=y;a[j++]=Y2/sn;
    a[j++]=x1;a[j++]=y;a[j++]=y1/sn;a[j++]=X2;a[j++]=y;a[j++]=Y2/sn;a[j++]=X1;a[j++]=y;a[j++]=Y1/sn}
  m.geometry.setDrawRange(0,j/3);m.geometry.attributes.position.needsUpdate=true;m.material.opacity=op;m.visible=op>0.01;
}
const ardg3dOn=()=>R3D.on&&R3D.ready&&typeof skArena==='function'&&skArena()&&!S.mb&&!S.wd&&!S.vil&&!S.room;
// צורה לבוס (forEach עם פונקציה קבועה: בלי closure חדש בכל פריים). AD3.k = המשבצת הבאה
function ardg3dBoss(st,b){
  const SL=AD3.sl;if(b.dead||AD3.k>=SL.length)return;
  const tk=AD3.calm?0:Math.max(0,1-(S.t-st.tk)/ARDG.tickT),fade=st.ph==='done'?Math.max(0,1-(S.t-st.d0)/ARDG.hold):1,eo=(ARDG.lineA+(1-ARDG.lineA)*tk)*fade,ew=ARDG3D.edge+ARDG.tickW*tk;
  if(st.k==='shields'||st.k==='wisps'){const n=2+b.phase;for(let i=0;i<n&&AD3.k<SL.length;i++){const a=i/n*Math.PI*2,x=b.x+Math.cos(a)*60,y=b.y+Math.sin(a)*60,s=SL[AD3.k++];
      ardg3dCircle(x,y,ARDG.shape.spawn*Math.min(1,st.p));ardg3dFill(s.fill,ARDG.fill*fade);ardg3dCircle(x,y,ARDG.shape.spawn);ardg3dEdge(s.edge,eo,ew)}}
  else{const s=SL[AD3.k++];ardg3dShapePts(b,st,Math.min(1,st.p));ardg3dFill(s.fill,ARDG.fill*fade);ardg3dShapePts(b,st,1);ardg3dEdge(s.edge,eo,ew)}
}
// הכל מוסתר (ardgClear ב-arena-danger.js: ריצה חדשה)
function ardg3dHide(){if(!AD3.on)return;for(const s of AD3.sl)s.fill.visible=s.edge.visible=false;for(const m of AD3.sc)m.visible=false}
// כל פריים (render3d.js)
function ardg3d(){
  if(!R3D.ready)return;
  ardgPrune();
  const live=ardg3dOn()&&ardgOn();
  if(!AD3.on){if(!live)return;ardg3dInit()}
  let k=0;const SL=AD3.sl;
  if(live){
    AD3.k=0;AD3.calm=ardgCalm();ARDGS.b.forEach(ardg3dBoss);k=AD3.k;
    for(let i=0;i<mines.length&&k<SL.length;i++){const m=mines[i];ardg3dCircle(m.x,m.y,ARDG.shape.mine*Math.min(1,1-Math.max(0,m.t)/(m.ardgT0||1.3)));ardg3dFill(SL[k].fill,ARDG.fill);SL[k].edge.visible=false;k++}
  }
  for(let i=k;i<SL.length;i++)SL[i].fill.visible=SL[i].edge.visible=false;
  // חריכה
  const L=ARDGS.sc,C=ARDG.scorch,sn=SIN();
  for(let i=0;i<AD3.sc.length;i++){const m=AD3.sc[i],s=live&&L[i];const age=s?S.t-s.t:-1;
    if(!s||age<0||age>=C.life){m.visible=false;continue}
    m.visible=true;m.position.set(s.x,ARDG3D.y-0.2,s.y/sn);m.rotation.y=s.rot;m.scale.set(2*s.r,1,2*s.r/sn);m.material.opacity=C.a*Math.min(1,(C.life-age)/C.fade)}
}
