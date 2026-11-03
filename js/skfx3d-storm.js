/* מתכון ענן הסערה בתלת-ממד (ניר, 3.11.2026: "נעשה את כל הסקילים יפים ומגניבים").
   ענן כהה אמיתי מרחף מעל הגיבור (כמה גושים שמסתובבים לאט), גשם דק נושר ממנו, ובכל מכה ברק מתפצל יורד על האויב:
   קו שבור בשתי שכבות (הילה סגולה ולב לבן), שני פיצולים לאוויר, הבזק ואור סגול, ניצוצות וסימן חריכה על הקרקע.
   קווי הברק הם סרטים (ribbon) שנבנים כאן בתוך המתכון, כי לערכה (vfx3d.js) אין קווים: רק חלקיקים, מדבקות, כדורים ואורות.
   רק ציור: הנזק, הטווח והקצב ב-wskbook.js (kind 'storm'). את קו הברק הדו-ממדי שהלוגיקה מוסיפה (skLine) מכבים (t=max), כי הברק התלת-ממדי מחליף אותו.
   כל המספרים ב-STM3D */
const STM3D={
  cloud:{h:150,r:60,puffs:7,flat:0.5,spin:0.22,bob:7,bobSpd:1.3,col:'#453f63',dark:'#241f38'},
  grow:0.3,                                              // שניות של הופעה והיעלמות
  bolt:{pool:3,pts:13,w:4.5,jag:17,life:0.3,flick:70,branch:2,brPts:6,brW:2.2,brLen:0.45,halo:3.6,haloA:0.5},
  rain:{every:0.03,drops:2,h:[10,120],spd:620,size:3,life:[0.22,0.34],col:'#9fb6ff'},
  hit:{flash:34,light:6.5,lightT:0.26,spark:18,ember:6,scorch:{r:30,life:2.2},ring:34},
  pal:{core:'#ffffff',glow:'#D46BFF',deep:'#5B1FD6',scorch:'#1a0f26'},
  stat:{strikes:0,bolts:0}   // לבדיקה (check.js): כמה ברקים ירדו וכמה מהם קיבלו קו
};
(()=>{
  let B=null;const V=new THREE.Vector3(),D=new THREE.Vector3(),N=new THREE.Vector3();
  const sin=()=>Math.sin(camTilt());
  // סרט (ribbon): שני משולשים לכל קטע, מופנים למצלמה. pts: נקודות {x,y,h} בקואורדינטות המשחק
  function mkRibbon(n,c,a,w){
    const g=new THREE.BufferGeometry(),pos=new Float32Array(n*2*3),idx=[];
    for(let i=0;i<n-1;i++)idx.push(i*2,i*2+1,i*2+2,i*2+1,i*2+3,i*2+2);
    g.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));g.setIndex(idx);
    const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:new THREE.Color(c),transparent:true,opacity:a,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));
    m.frustumCulled=false;m.renderOrder=6;m.visible=false;m.userData={w,a0:a,max:n};R3D.scene.add(m);return m;
  }
  function setRibbon(m,pts,k){
    const n=pts.length,pos=m.geometry.attributes.position,S_=sin(),w=m.userData.w*(k||1);
    R3D.cam.getWorldDirection(V);
    for(let i=0;i<n;i++){const p=pts[i],q=pts[Math.min(n-1,i+1)],r=pts[Math.max(0,i-1)];
      D.set(q.x-r.x,q.h-r.h,(q.y-r.y)/S_);if(D.lengthSq()<1e-6)D.set(0,1,0);D.normalize();
      N.copy(D).cross(V);if(N.lengthSq()<1e-6)N.set(1,0,0);N.normalize().multiplyScalar(w*(1-0.55*i/(n-1))/2);
      const x=p.x,y=p.h,z=p.y/S_;
      pos.array[i*6]=x-N.x;pos.array[i*6+1]=y-N.y;pos.array[i*6+2]=z-N.z;
      pos.array[i*6+3]=x+N.x;pos.array[i*6+4]=y+N.y;pos.array[i*6+5]=z+N.z}
    m.geometry.setDrawRange(0,(n-1)*6);pos.clearUpdateRanges();pos.addUpdateRange(0,n*6);pos.needsUpdate=true;m.visible=true;
  }
  function build(){
    if(B)return B;
    const C=STM3D.cloud,g=new THREE.SphereGeometry(1,10,8);
    B={cloud:new THREE.Group(),bolts:[]};
    for(let i=0;i<C.puffs;i++){const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:new THREE.Color(i%2?C.col:C.dark),fog:false}));
      const a=i/C.puffs*6.283,r=i?C.r*0.62:0;m.position.set(Math.cos(a)*r,(i%3)*4-4,Math.sin(a)*r*0.8);
      m.scale.set(C.r*(i?0.52:0.72),C.r*C.flat*(i?0.5:0.7),C.r*(i?0.45:0.6));m.frustumCulled=false;B.cloud.add(m)}
    B.cloud.visible=false;R3D.scene.add(B.cloud);
    const Bo=STM3D.bolt,Pl=STM3D.pal;
    for(let i=0;i<Bo.pool;i++)B.bolts.push({t:9,halo:mkRibbon(Bo.pts,Pl.glow,Bo.haloA,Bo.w*Bo.halo),core:mkRibbon(Bo.pts,Pl.core,1,Bo.w),
      br:[mkRibbon(Bo.brPts,Pl.glow,0.85,Bo.brW),mkRibbon(Bo.brPts,Pl.glow,0.85,Bo.brW)],pts:[],brPts:[[],[]]});
    return B;
  }
  const hide=m=>{m.visible=false};
  // קו שבור מנקודה לנקודה, עם סטייה אקראית שגדלה באמצע
  function jag(ax,ay,ah,bx,by,bh,n,jg){
    const pts=[];for(let i=0;i<n;i++){const f=i/(n-1),s=Math.sin(f*Math.PI)*jg;
      pts.push({x:ax+(bx-ax)*f+rand(-s,s),y:ay+(by-ay)*f+rand(-s,s)*0.6,h:ah+(bh-ah)*f+rand(-s,s)*0.8})}
    return pts}

  SKFX3D.register('storm',{
    start(o,st){build();st.rain=0},
    frame(o,st,dt){
      const b=build(),C=STM3D.cloud,Pl=STM3D.pal,hi=VFX3D.quality()==='hi';
      const fin=Math.min(1,o.t/STM3D.grow),fout=Math.min(1,Math.max(0,o.dur-o.t)/STM3D.grow),g=fin*fout;
      // הענן: מעל הגיבור, מסתובב לאט ונדנד
      b.cloud.visible=g>0.03;b.cloud.position.set(P.x,C.h+Math.sin(o.t*C.bobSpd)*C.bob,P.y/sin());
      b.cloud.rotation.y+=dt*C.spin;b.cloud.scale.setScalar(g*(o.vis||1));
      // גשם דק בתוך הטווח
      const R=STM3D.rain;
      if(hi&&(st.rain-=dt)<=0){st.rain=R.every;
        for(let i=0;i<R.drops;i++){const a=rand(0,6.283),d=Math.sqrt(Math.random())*o.r*0.75;
          VFX3D.emit('spark',P.x+Math.cos(a)*d,P.y+Math.sin(a)*d,rand(R.h[0],R.h[1]),{n:1,col:R.col,col2:Pl.glow,size:R.size,size2:1.5,spd:4,up:-R.spd,grav:0,drag:0,life:R.life,a:0.75,hdr:2})}}
      // מכה: הלוגיקה מוסיפה קו (skLine) מהענן לאויב. משם לוקחים את המטרה, מכבים את הקו, ומורידים ברק תלת-ממדי
      const fx=S.sk&&S.sk.fx;
      if(fx)for(const f of fx){if(!f.line||f._s3||Math.abs(f.ay-o.y)>8||Math.abs(f.ax-o.x)>30)continue;f._s3=1;f.t=f.max;this.strike(f.bx,f.by,o)}
      // הברקים החיים: מהבהבים ונעלמים
      const Bo=STM3D.bolt;
      for(const bl of b.bolts){if(bl.t>=Bo.life){if(bl.core.visible){hide(bl.core);hide(bl.halo);for(const m of bl.br)hide(m)}continue}
        bl.t+=dt;const f=Math.min(1,bl.t/Bo.life),al=(1-f)*(0.55+0.45*Math.abs(Math.sin(bl.t*Bo.flick)));
        setRibbon(bl.halo,bl.pts,1);setRibbon(bl.core,bl.pts,1);
        bl.halo.material.opacity=Bo.haloA*al;bl.core.material.opacity=al;
        for(let i=0;i<bl.br.length;i++){const bp=bl.brPts[i];if(!bp.length){hide(bl.br[i]);continue}setRibbon(bl.br[i],bp,1);bl.br[i].material.opacity=0.85*al*(1-f*0.5)}}
    },
    // ברק אחד: קו ראשי מהענן לאויב, פיצולים לאוויר, הבזק, אור, ניצוצות וסימן חריכה
    strike(tx,ty,o){
      const b=build(),Bo=STM3D.bolt,Pl=STM3D.pal,H=STM3D.hit,hi=VFX3D.quality()==='hi';
      let bl=null;for(const x of b.bolts)if(x.t>=Bo.life&&(!bl||x.t>bl.t))bl=x;
      STM3D.stat.strikes++;
      if(bl){STM3D.stat.bolts++;
        bl.t=0;const cx=P.x+rand(-24,24),cy=P.y+rand(-16,16),ch=STM3D.cloud.h-14;
        bl.pts=jag(cx,cy,ch,tx,ty,8,Bo.pts,Bo.jag);
        for(let i=0;i<bl.br.length;i++){
          if(!hi||i>=Bo.branch){bl.brPts[i]=[];continue}
          const s=bl.pts[2+Math.floor(Math.random()*(Bo.pts-6))],a=rand(0,6.283),L=ch*Bo.brLen*rand(0.4,1);
          bl.brPts[i]=jag(s.x,s.y,s.h,s.x+Math.cos(a)*L*0.7,s.y+Math.sin(a)*L*0.4,s.h-L*0.5,Bo.brPts,Bo.jag*0.8)}
        // הענן נדלק מבפנים
        VFX3D.emit('glow',cx,cy,ch,{n:2,col:Pl.core,col2:Pl.glow,size:STM3D.cloud.r*0.9,size2:STM3D.cloud.r*1.3,life:[0.1,0.18],a:0.5,hdr:2.5});
      }
      VFX3D.burst('flash',tx,ty,{r:H.flash,core:Pl.core,life:0.14});
      VFX3D.burst('ring',tx,ty,{r:H.ring,col:Pl.glow,life:0.35,w:0.26});
      VFX3D.emit('spark',tx,ty,6,{n:H.spark,col:Pl.core,col2:Pl.glow,spd:380,up:300,spread:14});
      VFX3D.emit('ember',tx,ty,8,{n:H.ember,col:Pl.glow,col2:Pl.deep,spread:18});
      VFX3D.decal('cracks',tx,ty,H.scorch.r,{life:H.scorch.life*0.5,col:Pl.glow,fade:0.8,a:0.9});
      VFX3D.decal('scorch',tx,ty,H.scorch.r,{life:H.scorch.life,col:Pl.scorch,a:0.6,fade:0.5});
      VFX3D.light(tx,ty,60,Pl.glow,H.light,H.lightT);
    },
    end(o,st){const b=B;if(!b)return;b.cloud.visible=false;for(const bl of b.bolts){bl.t=9;hide(bl.core);hide(bl.halo);for(const m of bl.br)hide(m)}}
  });
})();
