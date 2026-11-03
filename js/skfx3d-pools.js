/* מתכון השלוליות של הרונות בתלת-ממד (ניר, 3.11.2026: "הגרסה שמשאירה אחרי המטאור לבה: האפקט של הלבה צריך שיפור").
   כל שלולית של רונה (S.wr.fx, k:'pool', ב-wrunes.js: לבה של המטאור, שובל האש של הדהירה, קוצי קרח ואדמה) מקבלת משטח חי על הקרקע לפי סוג הנזק:
   אש = לבה אמיתית: משטח זוהר כתום-אדום עם קרום כהה וסדקים שזורמים לאט, בועות שמתפוצצות, גחלים ועשן דק, ואור כתום על הקרקע והאויבים.
   בסוף נשארים קצוות חרוכים ועוד רגע סדקים שמתקררים. מים, קרח, אדמה וברק: אותו משטח בצבעים ובחלקיקים שלהם.
   המשטח נבנה כאן (shader משלו, מאגר קבוע של משטחים), והחלקיקים מהערכה (VFX3D). רק ציור: הנזק, הטווח והזמן ב-wrunes.js.
   חיבור: SKFX3D.sources (בלי לגעת ב-skfx3d.js), ושורה אחת ב-wrDraw שמדלגת על הציור הדו-ממדי. כל המספרים ב-POOL3D */
const POOL3D={
  meshes:8,y:0.6,                    // כמה משטחים לכל היותר בבת אחת, וגובה מעל הקרקע (מתחת למדבקות של הערכה)
  grow:0.35,fade:0.5,spread:0.65,    // שניות של התפשטות, שניות של דעיכה בסוף, ומאיזה גודל מתחילים
  // לכל סוג נזק: צבעי המשטח (dark: קרום, mid, hot: סדקים), hdr: כמה הסדקים זוהרים, spd: כמה מהר זורם, after: מה נשאר על הקרקע,
  // fx: חלקיקים [סוג, כל כמה שניות, אפשרויות], light: אור על הקרקע (רק באיכות גבוהה)
  pal:{
    fire:     {dark:'#1c0703',mid:'#b8290a',hot:'#ffb347',hdr:2.6,spd:1,  light:'#ff7a2a',li:3.2,
               after:{col:'#140603',a:0.72,life:2.6,cracks:'#ff6a1a'},
               fx:[['bub',0.16],['ember',0.32],['smoke',0.5]]},
    water:    {dark:'#0b2442',mid:'#2a78d0',hot:'#bfefff',hdr:1.6,spd:0.8,light:'#4aa8ff',li:1.4,
               after:{col:'#10314f',a:0.45,life:1.6},fx:[['wbub',0.2]]},
    ice:      {dark:'#5d86a3',mid:'#a9dcf2',hot:'#ffffff',hdr:1.5,spd:0.25,light:'#bfefff',li:1.2,
               after:{col:'#d6eefa',a:0.35,life:1.8},fx:[['frost',0.18]]},
    earth:    {dark:'#24160a',mid:'#6b4a2a',hot:'#d2a26a',hdr:1.1,spd:0.35,light:null,
               after:{col:'#1e140a',a:0.5,life:2},fx:[['dust',0.22]]},
    lightning:{dark:'#160826',mid:'#6d34c9',hot:'#f3d6ff',hdr:2.4,spd:2.2,light:'#c77dff',li:2,
               after:{col:'#140a20',a:0.45,life:1.4,cracks:'#d46bff'},fx:[['zap',0.12]]},
    physical: {dark:'#2a2a2e',mid:'#8a8a92',hot:'#f2f2f2',hdr:1.2,spd:0.5,light:null,
               after:{col:'#1a1a1e',a:0.4,life:1.4},fx:[['dust',0.3]]}
  },
  stat:{start:0,end:0,after:0}       // לבדיקה (check.js): כמה שלוליות קיבלו משטח, נגמרו, והשאירו סימן
};
(()=>{
  let B=null;const W=new WeakMap(),C=new (window.THREE?THREE.Color:Object)();
  const sin=()=>Math.sin(camTilt()),hi=()=>VFX3D.quality()==='hi';
  const V=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  // הלבה: רעש מעוות (domain warp) שזורם לאט. איפה שהרעש קרוב לאמצע = סדק זוהר, איפה שגבוה = קרום כהה. הקצה לא עגול, והוא מתקרר
  const F=`varying vec2 vUv;uniform vec3 uD,uM,uH;uniform float uT,uA,uS,uG;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}
    float fb(vec2 p){return n(p)*.55+n(p*2.03+7.1)*.3+n(p*4.01+3.3)*.15;}
    void main(){vec2 q=vUv*2.-1.;float d=length(q);
      float e=d+(n(q*3.2+uS)-.5)*.35;float m=smoothstep(1.,.86,e);if(m<=.001)discard;
      vec2 p=q*2.4+uS;float w=fb(p+vec2(uT*.07,uT*.05));
      float v=fb(p*1.35+vec2(w*1.7,-w*1.2)+vec2(uT*.045,-uT*.035));
      float seam=1.-smoothstep(.0,.11,abs(v-.5));
      float crust=smoothstep(.42,.78,v);
      float rim=smoothstep(.45,1.,e);
      float pulse=.88+.12*sin(uT*2.1+v*9.);
      float heat=clamp((seam*1.15+(1.-crust)*.6)*pulse-rim*.65,0.,1.4);
      vec3 c=mix(uD,uM,smoothstep(.05,.6,heat));c=mix(c,uH*uG,smoothstep(.62,1.25,heat));
      gl_FragColor=vec4(c,m*uA*(.82+.18*(1.-rim)));
      #include <colorspace_fragment>
    }`;
  function build(){
    if(B)return B;B={list:[]};
    const g=new THREE.PlaneGeometry(2,2).rotateX(-Math.PI/2);
    for(let i=0;i<POOL3D.meshes;i++){
      const m=new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:{uD:{value:new THREE.Color()},uM:{value:new THREE.Color()},uH:{value:new THREE.Color()},
        uT:{value:0},uA:{value:0},uS:{value:0},uG:{value:1}},vertexShader:V,fragmentShader:F,transparent:true,depthWrite:false}));
      m.visible=false;m.frustumCulled=false;m.renderOrder=2;R3D.scene.add(m);B.list.push({m,on:false})}
    return B;
  }
  const take=()=>{for(const d of build().list)if(!d.on){d.on=true;return d}return null};
  const free=d=>{if(d){d.on=false;d.m.visible=false}};
  const palOf=dt=>POOL3D.pal[dt]||POOL3D.pal.physical;
  // חלקיקים לכל סוג: בועה שמתפוצצת, גחלת, עשן דק, בועת מים, נצנוץ קרח, אבק, ניצוץ ברק
  function puff(kind,f,P0){
    const a=Math.random()*6.283,rr=Math.sqrt(Math.random())*f.r*0.7,x=f.x+Math.cos(a)*rr,y=f.y+Math.sin(a)*rr*0.6;
    switch(kind){
      case 'bub':VFX3D.emit('glow',x,y,3,{n:1,raw:1,col:P0.hot,col2:P0.mid,size:9,size2:16,life:[0.18,0.3],a:0.8,hdr:2.4,spd:0,up:6});
        VFX3D.emit('spark',x,y,4,{n:3,col:P0.hot,col2:P0.mid,spd:70,up:120,size:4,size2:2,life:[0.25,0.45],hdr:2.6});break;
      case 'ember':VFX3D.emit('ember',x,y,4,{n:1,col:P0.light,col2:P0.mid,spd:30,up:150});break;
      case 'smoke':VFX3D.emit('smoke',x,y,10,{n:1,col:'#3a302b',col2:'#1e1a18',size:22,size2:60,spd:12,up:40,life:[1.2,1.8],a:0.28});break;
      case 'wbub':VFX3D.emit('spark',x,y,3,{n:1,col:P0.hot,col2:P0.mid,size:5,size2:2,spd:10,up:60,grav:-80,life:[0.4,0.7],hdr:2});break;
      case 'frost':VFX3D.emit('glow',x,y,4,{n:1,raw:1,col:'#ffffff',col2:P0.hot,size:6,size2:2,life:[0.3,0.6],spd:4,up:16,hdr:2});break;
      case 'dust':VFX3D.emit('puff',x,y,4,{n:1,col:P0.mid,col2:P0.dark,size:12,size2:34,spd:16,up:18,a:0.3});break;
      case 'zap':VFX3D.emit('spark',x,y,4,{n:2,col:'#ffffff',col2:P0.mid,spd:160,up:90,size:4,size2:1.5,life:[0.12,0.25],hdr:3});break;
    }
  }
  SKFX3D.sources.push(()=>{const L=S&&S.wr&&S.wr.fx;if(!L||!L.length)return null;const out=[];
    for(const f of L)if(f.k==='pool'){let w=W.get(f);if(!w){w={id:'wrpool',f};W.set(f,w)}out.push(w)}return out});

  SKFX3D.register('wrpool',{
    start(w,st){st.T=[];st.s=Math.random()*40},
    frame(w,st,dt){
      const f=w.f,P0=palOf(f.dt);
      if(f.t<f.wait){if(st.d){free(st.d);st.d=null}return}   // לבה של המטאור: מחכה שהוא ינחת
      if(!st.d){st.d=take();st.since=f.t;POOL3D.stat.start++;
        if(st.d){const u=st.d.m.material.uniforms;C.set(P0.dark);u.uD.value.copy(C);C.set(P0.mid);u.uM.value.copy(C);C.set(P0.hot);u.uH.value.copy(C);u.uG.value=P0.hdr;u.uS.value=st.s}
        if(P0.light)st.light=VFX3D.light(f.x,f.y,34,P0.light,0,Infinity)}
      const age=f.t-st.since,left=f.dur-f.t,gi=Math.min(1,age/POOL3D.grow),go=Math.min(1,Math.max(0,left)/POOL3D.fade);
      const e=1-Math.pow(1-gi,2.2),r=f.r*(POOL3D.spread+(1-POOL3D.spread)*e),S_=sin();
      if(st.d){const m=st.d.m,u=m.material.uniforms;m.visible=true;m.position.set(f.x,POOL3D.y,f.y/S_);m.scale.set(r,1,r/S_);
        u.uT.value+=dt*P0.spd;u.uA.value=gi*go}
      if(st.light)st.light.set(f.x,f.y,34,P0.li*gi*go*(0.85+0.15*Math.sin(f.t*7)));
      // חלקיקים, כל סוג בקצב שלו. באיכות נמוכה לאט יותר
      const q=hi()?1:2.5;
      P0.fx.forEach(([k,ev],i)=>{if((st.T[i]=(st.T[i]||0)-dt)<=0){st.T[i]=ev*q*(0.6+0.8*Math.random());if(go>0.2)puff(k,f,P0)}});
      st.last={x:f.x,y:f.y,r:f.r,dt:f.dt};
    },
    // סוף: מה שנשאר על הקרקע. לבה: קצוות חרוכים, וסדקים זוהרים שמתקררים עוד רגע
    end(w,st){
      if(st.d){free(st.d);st.d=null}if(st.light){VFX3D.free(st.light);st.light=null}
      POOL3D.stat.end++;const L=st.last;if(!L||!VFX3D.on())return;
      const A=palOf(L.dt).after;POOL3D.stat.after++;
      VFX3D.decal('scorch',L.x,L.y,L.r*1.05,{life:A.life,col:A.col,a:A.a,fade:0.6});
      if(A.cracks)VFX3D.decal('cracks',L.x,L.y,L.r*0.85,{life:A.life*0.45,col:A.cracks,a:0.7,fade:0.8});
    }
  });
  // האם הציור הדו-ממדי של השלוליות מדלג (wrDraw ב-wrunes.js): כשהאפקטים בתלת-ממד פעילים
  POOL3D.owns=()=>VFX3D.on();
  POOL3D.n=()=>B?B.list.filter(d=>d.on).length:0;
})();
