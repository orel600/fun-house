/* מתכון המגן (🛡️ shield) בתלת-ממד: כיפת קרח שקופה מתגבשת סביב הגיבור, עם רסיסים שעפים ומסגרת גבישים.
   בהתחלה גל קור הודף: טבעת כפור שמתפשטת, כפור על הקרקע וסדקים. אויב שקפא מקבל גבישים שצומחים עליו,
   ובסוף הכיפה מתנפצת לרסיסים. הצורות (כיפה וגבישים) נבנות כאן, לא בערכה.
   רק ציור: הנזק, ההדיפה וההקפאה ב-wskbook.js. כל המספרים ב-SHL3D */
const SHL3D={
  r:0.58,max:92,hk:0.82,            // רדיוס הכיפה (חלק מרדיוס הסקיל, עד max) וכמה היא שטוחה
  grow:0.26,over:1.1,               // זמן ההתגבשות, וקפיצה קטנה מעל הגודל
  op:[0.26,0.5],                    // שקיפות הכיפה והמסגרת
  spin:0.35,
  ring:{life:0.8,w:0.24},frost:{r:0.92,life:3.4,a:0.4},cracks:{r:0.68,life:2.4},
  burst:{spark:30,glow:3,hdr:2},          // ברגע ההפעלה
  mote:{every:0.1,n:2,hdr:1.8},             // רסיסים שמרחפים סביב הכיפה
  light:{i:1.8,h:40},
  crystals:4,cr:{n:4,h:1.7,w:0.45,r:0.62,a:0.8},   // גבישים על אויבים קפואים
  boom:{spark:42,glow:4,ring:0.55,hdr:2.2},  // הניפוץ בסוף
  pal:{ice:{core:'#f4ffff',glow:'#9fe8ff',deep:'#2f7dff',frost:'#cfeeff'}}
};
(()=>{
  const sn=()=>Math.sin(camTilt());
  let dome=null,shard=null;
  const geoDome=()=>dome||(dome=new THREE.IcosahedronGeometry(1,1));
  const geoShard=()=>shard||(shard=new THREE.OctahedronGeometry(1,0));
  function mkDome(c,hi){
    const g=new THREE.Group();
    const m=new THREE.Mesh(geoDome(),new THREE.MeshBasicMaterial({color:new THREE.Color(c.glow),transparent:true,opacity:SHL3D.op[0],
      depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false}));
    m.frustumCulled=false;m.renderOrder=4;g.add(m);g.userData.skin=m;
    if(hi){const w=new THREE.Mesh(geoDome(),new THREE.MeshBasicMaterial({color:new THREE.Color(c.core),transparent:true,opacity:SHL3D.op[1],
        wireframe:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
      w.frustumCulled=false;w.renderOrder=5;g.add(w);g.userData.wire=w}
    return g;
  }
  // גבישים על אויב קפוא: כמה רסיסים שצומחים ממנו, ונשארים כל זמן שהוא קפוא
  function mkCrys(e,c){
    const g=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:new THREE.Color(c.core),transparent:true,opacity:SHL3D.cr.a,depthWrite:false,blending:THREE.AdditiveBlending,fog:false});
    for(let i=0;i<SHL3D.cr.n;i++){const m=new THREE.Mesh(geoShard(),mat),a=i*1.7+Math.random();
      m.position.set(Math.cos(a)*e.r*SHL3D.cr.r,e.r*0.55,Math.sin(a)*e.r*SHL3D.cr.r);m.rotation.set((Math.random()-0.5)*0.5,Math.random()*3,(Math.random()-0.5)*0.5);
      m.scale.set(e.r*SHL3D.cr.w,e.r*SHL3D.cr.h*(0.7+Math.random()*0.6),e.r*SHL3D.cr.w);
      m.frustumCulled=false;m.renderOrder=4;g.add(m)}
    g.userData.mat=mat;return g;
  }
  SKFX3D.register('shield',{
    start(o,st){
      const ox=P.x,oy=P.y;   // ל-guard אין o.x/o.y (wskbook.js): הכיפה תמיד על הגיבור
      const c=SHL3D.pal[o.dt]||{core:'#ffffff',glow:o.col,deep:o.col,frost:'#dddddd'};st.c=c;
      st.R=Math.min(o.r*SHL3D.r,SHL3D.max);st.mo=0;st.cr=[];
      const hi=VFX3D.quality()==='hi';
      if(window.THREE&&R3D.scene){st.g=mkDome(c,hi);R3D.scene.add(st.g)}
      // גל הקור: טבעת שמתפשטת, כפור על הקרקע, סדקים ורסיסים
      VFX3D.decal('ring',ox,oy,o.r,{life:SHL3D.ring.life,grow:[o.r*0.25,o.r],col:c.glow,w:SHL3D.ring.w,fade:0.7});
      VFX3D.decal('scorch',ox,oy,o.r*SHL3D.frost.r,{life:SHL3D.frost.life,col:c.frost,a:SHL3D.frost.a,fade:0.5});
      VFX3D.decal('cracks',ox,oy,o.r*SHL3D.cracks.r,{life:SHL3D.cracks.life,col:c.glow,a:0.85,fade:0.7});
      VFX3D.emit('spark',ox,oy,16,{n:SHL3D.burst.spark,col:c.core,col2:c.deep,spd:o.r*2.6,spread:o.r*0.3,grav:-700,hdr:SHL3D.burst.hdr});
      VFX3D.emit('glow',ox,oy,20,{n:SHL3D.burst.glow,col:c.core,col2:c.glow,size:st.R*1.1,size2:st.R*1.7,a:0.35,hdr:1.3});
      st.light=VFX3D.light(ox,oy,SHL3D.light.h,c.glow,SHL3D.light.i,Infinity);
      // גבישים על מי שקפא עכשיו
      if(window.THREE&&R3D.scene&&typeof enemies!=='undefined')
        for(const e of enemies){if(st.cr.length>=SHL3D.crystals)break;
          if(e.dead||!(e.frozen>0)||Math.hypot(e.x-ox,e.y-oy)>o.r+e.r)continue;
          const g=mkCrys(e,c);R3D.scene.add(g);st.cr.push({e,g});
          VFX3D.emit('spark',e.x,e.y,14,{n:10,col:c.core,col2:c.glow,spd:140,up:200,grav:-800,hdr:2})}
    },
    frame(o,st,dt){
      const c=st.c,x=P.x,y=P.y,S_=sn(),f=Math.min(1,o.t/SHL3D.grow);
      const k=f<1?(1-Math.pow(1-f,3))*(1+(SHL3D.over-1)*Math.sin(f*Math.PI)):1;
      if(st.g){st.g.position.set(x,0,y/S_);st.g.scale.set(1,1,1/S_);st.g.rotation.y+=SHL3D.spin*dt;
        const sk=st.g.userData.skin,wi=st.g.userData.wire,pulse=0.85+0.15*Math.sin(o.t*8);
        for(const m of st.g.children)m.scale.set(st.R*k,st.R*SHL3D.hk*k,st.R*k);
        sk.material.opacity=SHL3D.op[0]*pulse;if(wi)wi.material.opacity=SHL3D.op[1]*pulse;}
      // רסיסים שמרחפים סביב הכיפה
      if((st.mo-=dt)<=0){st.mo=SHL3D.mote.every;const a=Math.random()*6.283;
        VFX3D.emit('fire',x+Math.cos(a)*st.R*0.95,y+Math.sin(a)*st.R*0.95,8+Math.random()*st.R,
          {n:SHL3D.mote.n,col:c.core,col2:c.glow,size:10,size2:3,spd:18,up:34,life:[0.4,0.8],hdr:SHL3D.mote.hdr})}
      if(st.light)st.light.set(x,y,SHL3D.light.h,SHL3D.light.i*(0.8+0.2*Math.sin(o.t*11)));
      // גבישים: עוקבים אחרי האויב, ונעלמים כשהוא הפשיר או מת
      for(const q of st.cr){if(!q.g)continue;
        if(q.e.dead||!(q.e.frozen>0)){VFX3D.emit('spark',q.e.x,q.e.y,12,{n:8,col:c.core,col2:c.glow,spd:160,up:140,grav:-700,hdr:2});
          R3D.scene.remove(q.g);q.g.userData.mat.dispose();q.g=null;continue}
        q.g.position.set(q.e.x,0,q.e.y/S_);q.g.scale.set(1,1,1/S_)}
    },
    end(o,st){
      const c=st.c,B=SHL3D.boom,x=P.x,y=P.y,R=st.R;
      // הכיפה מתנפצת: רסיסים לכל הכיוונים, הבזק וטבעת
      VFX3D.emit('spark',x,y,R*0.6,{n:B.spark,col:c.core,col2:c.deep,spd:R*4,spread:R*0.6,up:260,grav:-900,hJ:R,hdr:B.hdr});
      VFX3D.emit('glow',x,y,R*0.5,{n:B.glow,col:c.core,col2:c.glow,size:R*0.9,size2:R*1.6,a:0.4,hdr:1.4});
      VFX3D.decal('ring',x,y,R*2,{life:B.ring,grow:[R*0.6,R*2],col:c.glow,w:0.3,fade:0.7,a:0.8});
      if(st.g){for(const m of st.g.children)m.material.dispose();R3D.scene.remove(st.g);st.g=null}
      for(const q of st.cr)if(q.g){R3D.scene.remove(q.g);q.g.userData.mat.dispose();q.g=null}
      st.cr.length=0;
      if(st.light){VFX3D.free(st.light);st.light=null}
    }
  });
})();
