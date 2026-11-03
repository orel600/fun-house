/* מתכון הסופה (🌀 whirl) בתלת-ממד: מערבולת להבות שמסתובבת סביב הגיבור כל זמן הסקיל, וזזה איתו.
   שתי שכבות של גליל להבות שמסתובבות לכיוונים מנוגדים (צורה שנבנית כאן, לא בערכה), להבות שרצות על טבעת,
   גחלים שעפות החוצה, טבעת זוהרת על הקרקע, עקבות חרוכות מתחת לרגליים, ואור כתום מהבהב.
   רק ציור: הנזק, הטווח והזמן ב-wskbook.js. כל המספרים ב-WHL3D */
const WHL3D={
  r:0.6,h:74,                       // רדיוס המערבולת (חלק מרדיוס הסקיל) וגובה
  layers:[{r:1,h:1,spin:2.4,op:1.25},{r:0.66,h:0.74,spin:-3.6,op:0.9}],
  grow:0.22,                         // כמה זמן היא מתגבשת בהתחלה
  flame:{every:0.022,n:2,spd:150,up:60,h:20,hJ:46,hdr:1.45},   // להבות: כמה נקודות על הטבעת בכל פריים, מהירות סביב, למעלה, גובה ופיזור
  fspin:6.5,                         // כמה מהר הלהבות מקיפות
  ember:{every:0.1,n:2,out:170,hdr:2.2},    // גחלים שעפות החוצה
  ring:{r:1.5,a:0.34,w:0.4},          // טבעת זוהרת על הקרקע
  scorch:{every:0.5,r:0.42,life:1.6,a:0.55},   // עקבות חרוכות
  light:{i:2.2,h:34},
  end:{ember:14,spark:20,scorch:1.1,hdr:2},
  pal:{fire:{core:'#fff0c0',glow:'#ff8a2a',deep:'#e03205',scorch:'#1a0c04'},
       ice: {core:'#f2ffff',glow:'#7fdcff',deep:'#2a7dff',scorch:'#1b2a36'}}
};
(()=>{
  const sn=()=>Math.sin(camTilt());
  // גליל להבות: צורה פתוחה עם פתח רחב למעלה, ועליה רעש שזורם למעלה כמו אש. נבנית כאן ולא בערכה, כדי לא להתנגש
  const VS=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  const FS=`varying vec2 vUv;uniform float uT,uO;uniform vec3 uA,uB;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}
    void main(){float y=vUv.y;
      float nn=n(vec2(vUv.x*9.+uT*.7,y*3.5-uT*2.4))*.62+n(vec2(vUv.x*19.-uT*1.1,y*7.-uT*4.2))*.38;
      float a=smoothstep(.22,.72,nn)*(1.-y*.85)*smoothstep(0.,.18,y);
      vec3 c=mix(uB,uA,clamp(nn*1.5-y*.5,0.,1.));
      gl_FragColor=vec4(c*a*uO*3.,a*uO);
      #include <colorspace_fragment>
    }`;
  let geo=null;
  function mkLayer(L,c){
    if(!geo)geo=new THREE.CylinderGeometry(1,0.42,1,24,1,true);
    const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:{uT:{value:0},uO:{value:0},uA:{value:new THREE.Color(c.core)},uB:{value:new THREE.Color(c.deep)}},
      vertexShader:VS,fragmentShader:FS,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
    m.frustumCulled=false;m.renderOrder=4;m.userData.L=L;return m;
  }
  SKFX3D.register('whirl',{
    start(o,st){
      const c=WHL3D.pal[o.dt]||{core:'#ffffff',glow:o.col,deep:o.col,scorch:'#141414'};st.c=c;
      st.R=o.r*WHL3D.r;st.sc=0;
      if(window.THREE&&R3D.scene){st.g=new THREE.Group();st.g.renderOrder=4;R3D.scene.add(st.g);
        const hi=VFX3D.quality()==='hi';
        for(const L of (hi?WHL3D.layers:WHL3D.layers.slice(0,1)))st.g.add(mkLayer(L,c));}
      st.ring=VFX3D.decal('ring',o.x,o.y,st.R*WHL3D.ring.r,{life:Infinity,col:c.glow,a:WHL3D.ring.a,w:WHL3D.ring.w});
      st.light=VFX3D.light(o.x,o.y,WHL3D.light.h,c.glow,WHL3D.light.i,Infinity);
      st.em=0;st.scr=0;st.fl=0;
    },
    frame(o,st,dt){
      const c=st.c,x=o.x,y=o.y,R=st.R,S_=sn(),f=Math.min(1,o.t/WHL3D.grow),k=1-Math.pow(1-f,3);
      // הצורה: סביב הגיבור, מסתובבת, ומתגבשת בהתחלה. היסט z חלקי sin כדי שעיגול במשחק יישאר עיגול על המסך
      if(st.g){st.g.position.set(x,0,y/S_);st.g.scale.set(1,1,1/S_);
        const fade=Math.min(1,(o.dur-o.t)/0.3);
        for(const m of st.g.children){const L=m.userData.L;m.rotation.y+=L.spin*dt;
          m.scale.set(R*L.r*k,WHL3D.h*L.h*k,R*L.r*k);m.position.y=WHL3D.h*L.h*k/2;
          m.material.uniforms.uT.value=o.t;m.material.uniforms.uO.value=L.op*k*Math.max(0,fade)}}
      // להבות שרצות על הטבעת: מהירות משיקית אמיתית, כך שהן מקיפות את הגיבור
      const a0=o.t*WHL3D.fspin;
      if((st.fl-=dt)<=0){st.fl=WHL3D.flame.every;
      for(let i=0;i<WHL3D.flame.n;i++){
        const a=a0+i*6.283/WHL3D.flame.n,rr=R*(0.86+0.14*Math.sin(o.t*5+i*2));
        VFX3D.emit('fire',x+Math.cos(a)*rr,y+Math.sin(a)*rr,WHL3D.flame.h,
          {n:1,col:c.glow,col2:c.deep,size:16,size2:4,spd:16,up:WHL3D.flame.up,hJ:WHL3D.flame.hJ,life:[0.32,0.6],
           hdr:WHL3D.flame.hdr,vx:-Math.sin(a)*WHL3D.flame.spd,vz:Math.cos(a)*WHL3D.flame.spd/S_});
      }}
      // גחלים שעפות החוצה
      if((st.em-=dt)<=0){st.em=WHL3D.ember.every;const a=Math.random()*6.283;
        VFX3D.emit('ember',x+Math.cos(a)*R*0.9,y+Math.sin(a)*R*0.9,18,
          {n:WHL3D.ember.n,col:c.glow,col2:c.deep,spd:40,up:120,hdr:WHL3D.ember.hdr,vx:Math.cos(a)*WHL3D.ember.out,vz:Math.sin(a)*WHL3D.ember.out/S_});}
      // עקבות חרוכות מתחת לרגליים
      if((st.scr-=dt)<=0){st.scr=WHL3D.scorch.every;
        VFX3D.decal('scorch',x,y,R*WHL3D.scorch.r,{life:WHL3D.scorch.life,col:c.scorch,a:WHL3D.scorch.a,fade:0.5})}
      if(st.ring){st.ring.x=x;st.ring.y=y;st.ring.r=R*WHL3D.ring.r*k;st.ring.a=WHL3D.ring.a*k*(0.75+0.25*Math.sin(o.t*13))}
      if(st.light)st.light.set(x,y,WHL3D.light.h,WHL3D.light.i*k*(0.65+0.35*Math.sin(o.t*17)));
    },
    end(o,st){
      const c=st.c,E=WHL3D.end,x=o.x,y=o.y,R=st.R;
      VFX3D.emit('ember',x,y,16,{n:E.ember,col:c.glow,col2:c.deep,spread:R*0.8,spd:120,up:260,hdr:E.hdr});
      VFX3D.emit('spark',x,y,14,{n:E.spark,col:c.core,col2:c.glow,spd:R*3.2,spread:R*0.4,hdr:E.hdr});
      VFX3D.decal('scorch',x,y,R*0.95,{life:E.scorch*2,col:c.scorch,a:0.6,fade:0.6});
      if(st.g){for(const m of st.g.children)m.material.dispose();R3D.scene.remove(st.g);st.g=null}
      for(const k of ['ring','light'])if(st[k]){VFX3D.free(st[k]);st[k]=null}
    }
  });
})();
