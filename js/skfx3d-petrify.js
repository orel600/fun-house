/* מתכון קללת הגרניט (petrify) בתלת-ממד: גל אדמה שיוצא מהגיבור עם אבק וסדקים זוהרים בכתום,
   ועל כל אויב שהתאבן נסגר מעטה של סלעים. כשהאבן מתנפצת (ניפוץ אבן, wcombo.js) או נגמרת, הסלעים עפים לכל הכיוונים.
   רק ציור: הנזק, הטווח והזמן ב-wskbook.js וב-wskx.js. כל המספרים ב-PTR3D. כל הסלעים ציור אחד (InstancedMesh).
   באיכות נמוכה: פחות סלעים לכל אויב ופחות אבק, ובלי אור */
const PTR3D={
  max:72,                    // כמה סלעים לכל היותר על המסך
  rock:{n:6,lo:3,size:[9,15],grow:0.18,h:[6,34],out:0.85},   // לכל מאובן: כמה סלעים, גודל, כמה זמן נסגרים, גובה, ובאיזה מרחק מהמרכז (חלק מהרדיוס)
  wave:{life:0.55,dust:18,spark:16,cracks:1.6},
  shard:{n:10,spd:260},      // כשנשבר: רסיסים
  light:{i:3,t:0.4},
  pal:{rock:'#8a8378',dark:'#4a4238',glow:'#ffb347',dust:'#b9a483',dust2:'#6b5c48',core:'#ffe2a8'}
};
(()=>{
  const V=PTR3D,C=V.pal;let B=null;
  const SIN=()=>Math.sin(camTilt());
  function build(){
    if(B||!R3D.ready||!window.THREE)return B;
    const g=new THREE.DodecahedronGeometry(1,0);
    const m=new THREE.InstancedMesh(g,new THREE.MeshLambertMaterial({color:C.rock,flatShading:true}),V.max);
    m.count=0;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;m.renderOrder=4;R3D.scene.add(m);
    B={m,dum:new THREE.Object3D()};return B;
  }
  function shatter(x,y){
    VFX3D.emit('spark',x,y,18,{n:V.shard.n,col:C.core,col2:C.glow,spd:V.shard.spd,size:9,size2:3});
    VFX3D.emit('puff',x,y,16,{n:6,col:C.dust,col2:C.dust2,size:20,size2:54,spd:70,up:50,a:0.5});
  }
  SKFX3D.register('petrify',{
    start(o,st){
      build();st.rocks=new Map();
      const W=V.wave;
      VFX3D.burst('ring',o.x,o.y,{r:o.r,col:C.glow,life:W.life,w:0.3});
      VFX3D.decal('cracks',o.x,o.y,o.r*0.7,{life:W.cracks,col:C.glow,fade:0.6,a:0.9});
      VFX3D.emit('puff',o.x,o.y,8,{n:W.dust,col:C.dust,col2:C.dust2,size:26,size2:80,spd:o.r*1.6,up:40,spread:o.r*0.2,life:[0.6,1.1],a:0.55});
      VFX3D.emit('spark',o.x,o.y,8,{n:W.spark,col:C.core,col2:C.glow,spd:o.r*2.6,up:200,spread:o.r*0.2});
      VFX3D.light(o.x,o.y,40,C.glow,V.light.i,V.light.t);
    },
    frame(o,st,dt){
      const R=V.rock,hiQ=VFX3D.quality()==='hi',per=hiQ?R.n:R.lo;
      for(const e of o.foes||[]){let r=st.rocks.get(e);
        if(e.stone>0&&!e.dead){if(!r){r={t:0,s:[]};for(let i=0;i<per;i++)r.s.push({a:i/per*6.283+Math.random()*0.6,sz:rand(R.size[0],R.size[1]),h:rand(R.h[0],R.h[1]),ry:Math.random()*6});st.rocks.set(e,r)}r.t+=dt}
        else if(r){st.rocks.delete(e);shatter(e.x,e.y)}}
      if(!B)return;const S_=SIN(),d=B.dum;let n=0;
      for(const [e,r] of st.rocks){const k=Math.min(1,r.t/R.grow),ek=1-Math.pow(1-k,3);
        for(const s of r.s){if(n>=V.max)break;const out=e.r*R.out*(1.6-0.6*ek);
          d.position.set(e.x+Math.cos(s.a)*out,s.h*ek,(e.y+Math.sin(s.a)*out*0.6)/S_);d.rotation.set(s.ry,s.ry*1.7,0);d.scale.setScalar(s.sz*(e.r/18)*ek+0.01);d.updateMatrix();B.m.setMatrixAt(n++,d.matrix)}}
      B.m.count=n;B.m.instanceMatrix.needsUpdate=true;B.m.visible=n>0;
    },
    end(o,st){for(const [e] of st.rocks)shatter(e.x,e.y);st.rocks.clear();if(B){B.m.count=0;B.m.visible=false}}
  });
})();
