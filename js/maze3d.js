/* קירות הזירה בתלת-ממד (maze.js, גלים 5-6). בקנבס הקיר מצויר מעל הכל, ולכן קיר שעובר ליד הגיבור נצבע על הגוף שלו (QUINN, 8.11).
   כאן כל קיר הוא קופסה אמיתית בסצנה: דמות שעומדת לפניו מסתירה אותו, וקיר שלפני דמות מסתיר את הרגליים שלה.
   כל הקירות בציור אחד (InstancedMesh), וקו עליון דק בתכלת בציור שני. השקיפות לפי mazeFade (צמיחה, החלפה ונעלמות).
   הלוגיקה (חסימה, מיקום, מחזור) נשארת ב-maze.js. בדו-ממד הקנבס ממשיך לצייר כמו קודם (mazeDraw).
   חיבור: maze3d() ב-render3d.js אחרי הדמויות בזירה, ו-mazeDraw לא מצייר כשהתלת-ממד דלוק */
const MAZE3D={
  h:30,        // גובה הקיר על המסך (פיקסלים של המשחק, לפני הזווית)
  edge:2.5,    // עובי הקו העליון
  ridge:4,     // רוחב הקו העליון (לאורך הקיר הוא באורך הקיר)
  max:64,      // הכי הרבה קירות בבת אחת (mazeWalls מחזיר בערך 30-40)
};
const MZ3={m:null,top:null};
function maze3dInit(){
  const mk=(col,op)=>{const g=new THREE.BoxGeometry(1,1,1).translate(0,0.5,0),mat=new THREE.MeshLambertMaterial({color:col,transparent:true,opacity:op});
    const m=new THREE.InstancedMesh(g,mat,MAZE3D.max);m.count=0;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;m.visible=false;R3D.scene.add(m);return m};
  MZ3.m=mk(MAZE.col.fill,1);MZ3.top=mk(MAZE.col.edge,1);MZ3.mx=new THREE.Matrix4();MZ3.p=new THREE.Vector3();MZ3.q=new THREE.Quaternion();MZ3.s=new THREE.Vector3();
}
const maze3dOn=()=>R3D.on&&R3D.ready&&S&&S.arena==='gauntlet'&&!!S.wv&&!S.wd&&!S.vil&&!S.room&&!S.mb&&S.mode!=='over';
// כל פריים בזירה (render3d.js): הקירות לפי המצב של maze.js
function maze3d(){
  if(!R3D.ready)return;if(!MZ3.m)maze3dInit();
  const a=maze3dOn()?mazeFade():0;
  if(a<=0.02){MZ3.m.visible=MZ3.top.visible=false;return}
  const ws=mazeWalls(),n=Math.min(ws.length,MAZE3D.max),sn=SIN(),hh=MAZE3D.h/COS(),{mx,p,q,s}=MZ3;
  for(let i=0;i<n;i++){const w=ws[i];
    p.set(w.x+w.w/2,0,(w.y+w.h/2)/sn);s.set(w.w,hh,w.h/sn);mx.compose(p,q,s);MZ3.m.setMatrixAt(i,mx);
    const L=w.w>=w.h;p.y=hh;s.set(L?w.w:MAZE3D.ridge,MAZE3D.edge/COS(),(L?MAZE3D.ridge:w.h)/sn);mx.compose(p,q,s);MZ3.top.setMatrixAt(i,mx)}   // קו דק לאורך הקיר, לא כל הגג
  for(const m of [MZ3.m,MZ3.top]){m.count=n;m.instanceMatrix.needsUpdate=true;m.visible=n>0;m.material.opacity=a;m.material.depthWrite=a>=MAZE.solidAt}
}
