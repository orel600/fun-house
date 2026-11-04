/* מתכון המערבולת (vortex) בתלת-ממד: משפך מים שמסתובב מעל הנקודה, טיפות שנשאבות פנימה ומטה בספירלה,
   טבעת מים על הקרקע ורסס. בסוף המשפך קורס ומתיז מים לכל הכיוונים.
   רק ציור: המשיכה, הנזק והזמן ב-wskbook.js וב-wskx.js. כל המספרים ב-VTX3D. כל הטיפות ציור אחד (InstancedMesh).
   באיכות נמוכה: פחות טיפות, בלי רסס ובלי אור */
const VTX3D={
  drops:{n:64,lo:24,size:[3,6],spin:3.4,fall:0.7,h:90},   // כמה טיפות, גודל, מהירות סיבוב, כמה מהר נשאבות (מחזורים בשנייה), וגובה המשפך
  grow:0.25,                 // כמה זמן לוקח למשפך להתגבש
  ring:{a:0.5,w:0.25},spray:{every:0.08,n:2},
  end:{spark:18,puff:8},
  light:{i:2,h:30},
  pal:{core:'#e8fbff',glow:'#4fb4ff',deep:'#1d5fd6',mist:'#cfe9ff',mist2:'#7fa6c8'}
};
(()=>{
  const V=VTX3D,C=V.pal;let B=null;
  const SIN=()=>Math.sin(camTilt());
  function build(){
    if(B||!R3D.ready||!window.THREE)return B;
    const m=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshBasicMaterial({color:new THREE.Color(C.glow).multiplyScalar(1.8),fog:false,transparent:true,opacity:0.85}),V.drops.n);
    m.count=0;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;m.renderOrder=4;R3D.scene.add(m);
    B={m,dum:new THREE.Object3D()};return B;
  }
  SKFX3D.register('vortex',{
    start(o,st){
      build();st.seed=[];const D=V.drops;for(let i=0;i<D.n;i++)st.seed.push({p:Math.random(),a:Math.random()*6.283,s:rand(D.size[0],D.size[1])});
      st.ring=VFX3D.decal('ring',o.x,o.y,o.r,{life:Infinity,col:C.glow,a:0,w:V.ring.w});
      st.glow=VFX3D.decal('glow',o.x,o.y,o.r*0.5,{life:Infinity,col:C.deep,a:0});
      st.light=VFX3D.light(o.x,o.y,V.light.h,C.glow,V.light.i,Infinity);st.sp=0;
    },
    frame(o,st,dt){
      const D=V.drops,g=Math.min(1,o.t/V.grow),out=Math.min(1,Math.max(0,(o.dur-o.t)*4)),k=g*out,hiQ=VFX3D.quality()==='hi';
      if(st.ring){st.ring.a=V.ring.a*k*(0.8+0.2*Math.sin(o.t*9));st.ring.r=o.r*(0.9+0.1*Math.sin(o.t*5))}
      if(st.glow)st.glow.a=0.5*k;
      if(st.light)st.light.set(o.x,o.y,V.light.h,V.light.i*k);
      if(hiQ&&(st.sp-=dt)<=0){st.sp=V.spray.every;const a=Math.random()*6.283;
        VFX3D.emit('puff',o.x+Math.cos(a)*o.r*0.8,o.y+Math.sin(a)*o.r*0.5,6,{n:V.spray.n,col:C.mist,col2:C.mist2,size:14,size2:40,spd:30,up:50,a:0.35,life:[0.5,0.9]})}
      if(!B)return;const S_=SIN(),d=B.dum,n=hiQ?D.n:D.lo;
      for(let i=0;i<n;i++){const s=st.seed[i],f=(s.p+o.t*D.fall)%1,r=o.r*(1-f)*0.95+6,a=s.a+o.t*D.spin*(1+1.5*f),h=D.h*(1-f)*(0.4+0.6*(1-f))+4;
        d.position.set(o.x+Math.cos(a)*r,h*k,(o.y+Math.sin(a)*r*0.6)/S_);d.scale.setScalar(s.s*(0.6+0.6*(1-f))*k+0.01);d.updateMatrix();B.m.setMatrixAt(i,d.matrix)}
      B.m.count=n;B.m.instanceMatrix.needsUpdate=true;B.m.visible=true;
    },
    end(o,st){
      for(const h of ['ring','glow','light'])if(st[h]){VFX3D.free(st[h]);st[h]=null}
      if(B){B.m.count=0;B.m.visible=false}
      VFX3D.emit('spark',o.x,o.y,10,{n:V.end.spark,col:C.core,col2:C.glow,spd:o.r*2,up:260});
      VFX3D.emit('puff',o.x,o.y,10,{n:V.end.puff,col:C.mist,col2:C.mist2,size:24,size2:70,spd:o.r,up:50,a:0.4});
    }
  });
})();
