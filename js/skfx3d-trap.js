/* מתכון המלכודת (trap) בתלת-ממד (ניר, 3.11.2026: "נעשה את כל הסקילים יפים ומגניבים").
   מלכודת שיניים קטנה יושבת פתוחה על הקרקע, עם אור כחול שמהבהב ונצנוצי כפור כל עוד היא דרוכה.
   כשאויב דורך: הלסתות נסגרות בטריקה, פיצוץ כפור, וגבישי קרח צומחים מהקרקע סביבה ועל כל אויב שנתפס, ואחר כך נמסים.
   רק ציור: הנזק, הטווח והזמן ב-wskbook.js (kind 'trap'). כל המספרים ב-TRP3D.
   כל הגבישים הם ציור אחד (InstancedMesh). באיכות נמוכה: פחות גבישים וחלקיקים, בלי אור */
const TRP3D={
  pool:3,                    // כמה מלכודות יכולות להיות על הקרקע יחד (רונה מוסיפה עוד אחת)
  jaw:{r:38,tube:3.2,teeth:7,tw:4.2,th:17,open:-0.14,shut:1.5},   // הלסתות: רדיוס, עובי, שיניים, וזוויות פתוח/סגור
  snap:0.11,                 // כמה זמן לוקחת הטריקה
  arm:{glow:0.5,beat:3.2,light:3.4,spark:0.5},                   // דרוכה: עוצמת ההבהוב, מהירותו, האור, וכל כמה זמן נצנוץ
  crystal:{n:10,max:44,r:[7,15],h:[30,78],life:1.9,grow:0.16,melt:0.45,onFoe:3,tilt:0.3},
  frost:{puff:14,spark:26,ring:0.55,cracks:2.2,patch:{life:3.2,a:0.45}},
  pal:{ice:{metal:'#6e7d92',glow:'#9fe8ff',core:'#f2ffff',deep:'#2a7dff',crys:'#9fdcff',patch:'#cfe9ff',smoke:'#cfe0ee',smoke2:'#8ea7bb'}}
};
(()=>{
  const V=TRP3D;let B=null;
  const SIN=()=>Math.sin(camTilt());
  const hiQ=()=>VFX3D.quality()==='hi';
  // גבישי קרח ממשיכים לחיות אחרי שהסקיל נגמר: רשימה משלנו שנרשמת כמקור ב-SKFX3D
  const CRY=[],LIVE=[],AFTER={id:'trap$after'};
  SKFX3D.sources.push(()=>LIVE);
  const flat=g=>g.index?g.toNonIndexed():g;
  // חיבור גיאומטריות, עם צבע לכל קודקוד (k: כמה בהיר, מעל 1 זוהר ב-bloom)
  function join(parts){
    let n=0;for(const p of parts)n+=p.g.attributes.position.array.length;
    const pos=new Float32Array(n),cl=new Float32Array(n);let i=0;
    for(const p of parts){const a=p.g.attributes.position.array;pos.set(a,i);for(let k=0;k<a.length;k++)cl[i+k]=p.k;i+=a.length}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(cl,3));return g;
  }
  // לסת: קשת שיניים בחצי עיגול, הציר שלה בראשית הצירים (הסיבוב סביב X מרים אותה וסוגר)
  function jawGeo(){
    const J=V.jaw,parts=[{g:flat(new THREE.TorusGeometry(J.r,J.tube,5,12,Math.PI).rotateX(-Math.PI/2)),k:1}];
    for(let i=0;i<J.teeth;i++){const t=0.12+0.76*(i/(J.teeth-1)),a=t*Math.PI;
      parts.push({g:flat(new THREE.ConeGeometry(J.tw,J.th,4).translate(J.r*Math.cos(a),J.th/2,-J.r*Math.sin(a))),k:2.4})}
    return join(parts);
  }
  function build(){
    if(B||!R3D.ready||!window.THREE)return B;
    const jg=jawGeo(),bg=flat(new THREE.TorusGeometry(V.jaw.r*0.72,2,4,16).rotateX(-Math.PI/2));
    const traps=[];
    for(let i=0;i<V.pool;i++){
      const g=new THREE.Group();g.visible=false;
      const base=new THREE.Mesh(bg,new THREE.MeshBasicMaterial({fog:false}));base.renderOrder=4;g.add(base);
      const jaws=[];
      for(let s=0;s<2;s++){const h=new THREE.Group();h.rotation.y=s?Math.PI:0;
        const m=new THREE.Mesh(jg,new THREE.MeshBasicMaterial({vertexColors:true,fog:false}));m.renderOrder=4;h.add(m);g.add(h);jaws.push(m)}
      g.traverse(o=>{o.frustumCulled=false});R3D.scene.add(g);traps.push({g,base,jaws,on:false});
    }
    const cg=flat(new THREE.ConeGeometry(1,1,5).translate(0,0.5,0));
    const cl=new Float32Array(cg.attributes.position.array.length);
    for(let i=0;i<cl.length/3;i++){const y=cg.attributes.position.array[i*3+1],k=1+1.1*y;cl[i*3]=cl[i*3+1]=cl[i*3+2]=k}   // החוד בהיר יותר מהבסיס
    cg.setAttribute('color',new THREE.BufferAttribute(cl,3));
    const cm=new THREE.InstancedMesh(cg,new THREE.MeshBasicMaterial({vertexColors:true,fog:false}),V.crystal.max);
    cm.count=0;cm.instanceMatrix.setUsage(THREE.DynamicDrawUsage);cm.frustumCulled=false;cm.renderOrder=4;R3D.scene.add(cm);
    B={traps,cm,dum:new THREE.Object3D()};return B;
  }
  const pal=o=>V.pal[o.dt]||Object.assign({},V.pal.ice,{glow:o.col,crys:o.col});
  const take=()=>{if(!B)return null;for(const t of B.traps)if(!t.on){t.on=true;t.g.visible=true;return t}return null};

  /* ---- גבישי קרח ---- */
  function crystal(x,y,r,h,life){
    if(CRY.length>=V.crystal.max)return;
    CRY.push({x,y,r,h,rot:Math.random()*6.283,tilt:(Math.random()-0.5)*V.crystal.tilt,t:0,life});
    if(!LIVE.length)LIVE.push(AFTER);
  }
  let lastF=0;
  function stepCrystals(dt){
    if(lastF===SKFX3D.f)return;lastF=SKFX3D.f;
    const C=V.crystal;
    for(let i=CRY.length-1;i>=0;i--){const c=CRY[i];c.t+=dt;if(c.t>=c.life){CRY.splice(i,1);continue}
      const up=Math.min(1,c.t/C.grow),down=Math.min(1,Math.max(0,(c.t-(c.life-C.melt))/C.melt));
      c.k=(1-Math.pow(1-up,3))*(1+0.18*Math.sin(up*Math.PI))*(1-down);
    }
    if(!B)return;const S_=SIN(),d=B.dum;
    for(let i=0;i<CRY.length;i++){const c=CRY[i];
      d.position.set(c.x,0,c.y/S_);d.rotation.set(0,c.rot,c.tilt);d.scale.set(c.r*(0.6+0.4*c.k),c.h*c.k,c.r*(0.6+0.4*c.k));d.updateMatrix();B.cm.setMatrixAt(i,d.matrix)}
    B.cm.count=CRY.length;B.cm.instanceMatrix.needsUpdate=true;B.cm.visible=CRY.length>0;
  }
  // פיצוץ הכפור: גבישים סביב המרכז, ועוד גביש גדול על כל אויב שנתפס
  function freeze(o,c){
    const C=V.crystal,n=VFX3D.many(C.n);
    for(let i=0;i<n;i++){const a=Math.random()*6.283,rr=Math.sqrt(Math.random())*o.r*0.8;
      crystal(o.x+Math.cos(a)*rr,o.y+Math.sin(a)*rr,rand(C.r[0],C.r[1]),rand(C.h[0],C.h[1]),C.life*rand(0.7,1.1))}
    for(const e of enemies){if(e.dead||Math.hypot(e.x-o.x,e.y-o.y)-e.r>o.r)continue;
      for(let i=0;i<C.onFoe;i++){const a=Math.random()*6.283,rr=e.r*rand(0.3,0.9);
        crystal(e.x+Math.cos(a)*rr,e.y+Math.sin(a)*rr,rand(C.r[1]*0.8,C.r[1]*1.3),rand(C.h[1]*0.8,C.h[1]*1.25),C.life*1.15)}}
    const F=V.frost;
    VFX3D.burst('explode',o.x,o.y,{r:o.r*0.8,col:c.glow,col2:c.deep,core:c.core,smoke:c.smoke,smoke2:c.smoke2,smokeSize:90});
    VFX3D.decal('cracks',o.x,o.y,o.r*0.8,{life:F.cracks,col:c.glow,fade:0.7,a:0.9});
    VFX3D.decal('scorch',o.x,o.y,o.r*0.7,{life:F.patch.life,col:c.patch,a:F.patch.a,fade:0.5});
    VFX3D.emit('puff',o.x,o.y,10,{n:F.puff,col:c.core,col2:c.glow,size:26,size2:80,spd:o.r*1.4,up:60,life:[0.6,1.2],a:0.5});
    VFX3D.emit('spark',o.x,o.y,10,{n:F.spark,col:c.core,col2:c.glow,spd:o.r*3,spread:o.r*0.2});
  }

  SKFX3D.register('trap',{
    start(o,st){
      build();const c=st.c=pal(o);st.t=take();
      if(st.t){st.t.base.material.color.set(c.glow).multiplyScalar(2.2);
        for(const m of st.t.jaws)m.material.color.set(c.metal);
        st.t.g.position.set(o.x,1,o.y/SIN());for(const m of st.t.jaws)m.rotation.x=V.jaw.open}
      st.glow=VFX3D.decal('glow',o.x,o.y,V.jaw.r*1.8,{life:Infinity,col:c.glow,a:V.arm.glow,hdr:1.2});
      st.light=VFX3D.light(o.x,o.y,26,c.glow,V.arm.light,Infinity);
      st.spark=0;
    },
    frame(o,st,dt){
      const c=st.c,J=V.jaw;
      if(!o.boom){
        const b=0.5+0.5*Math.sin(o.t*V.arm.beat);
        if(st.glow){st.glow.a=V.arm.glow*(0.35+0.65*b);st.glow.r=J.r*(1.6+0.35*b)}
        if(st.light)st.light.set(o.x,o.y,26,V.arm.light*(0.3+0.7*b));
        if(st.t)for(const m of st.t.jaws)m.rotation.x=J.open-0.03*b;
        if((st.spark-=dt)<=0){st.spark=V.arm.spark;VFX3D.emit('spark',o.x,o.y,6,{n:2,col:c.core,col2:c.glow,spd:40,up:70,grav:-200,life:[0.4,0.8],size:7,size2:2})}
      }else{
        if(!st.boom){st.boom=o.t;freeze(o,c);if(st.glow){VFX3D.free(st.glow);st.glow=null}
          if(st.light)st.light.set(o.x,o.y,40,V.arm.light*5)}
        const f=Math.min(1,(o.t-st.boom)/V.snap),e=1-Math.pow(1-f,3);
        if(st.t)for(const m of st.t.jaws)m.rotation.x=J.shut*e+0.1*Math.sin(f*12)*(1-f);
        if(st.light)st.light.set(o.x,o.y,40,V.arm.light*5*Math.max(0,1-(o.t-st.boom)*3));
      }
      stepCrystals(dt);
    },
    end(o,st){
      if(st.t){st.t.on=false;st.t.g.visible=false;st.t=null}
      for(const k of ['glow','light'])if(st[k]){VFX3D.free(st[k]);st[k]=null}
    }
  });
  // אחרי שהסקיל נגמר: הגבישים נמסים לבד
  SKFX3D.register('trap$after',{
    frame(o,st,dt){stepCrystals(dt);if(!CRY.length)LIVE.length=0},
    end(){CRY.length=0;LIVE.length=0;if(B){B.cm.count=0;B.cm.visible=false}}
  });
})();
