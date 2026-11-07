/* ערכת אפקטים בתלת-ממד (VFX3D): חלקיקים זוהרים, עשן, גחלים, שובל, גל הדף וסימנים על הקרקע, הבזק, אור נקודתי קצר וזוהר (bloom).
   ניר, 3.11.2026: "שהמטאור באמת ייראה כאילו נופל מטאור מהשמיים ומפוצץ על האויבים". הערכה משותפת לכל הסקילים:
   כל סקיל מקבל "מתכון" בקובץ נפרד (SKFX3D.register ב-js/skfx3d.js), והערכה עצמה לא יודעת על אף סקיל.
   הכל מוכן מראש במאגרים (pool), כך שאין הקצאות בכל פריים: חלקיקים, מדבקות קרקע, כדורים ואורות.
   קואורדינטות: נקודה (x,y) במשחק בגובה h יושבת ב-(x, h, y/sin(tilt)), כמו כל השכבה בתלת-ממד (render3d.js).
   API (x,y במשחק, h גובה):
     VFX3D.on()                          האם האפקטים בתלת-ממד פעילים עכשיו (תלת-ממד דלוק, בעולם)
     VFX3D.emit(kind,x,y,h,o)            חלקיקים מסוג kind (מתוך VFX3D_CFG.kinds), o משנה: n,col,col2,size,size2,life,spd,up,spread,grav,drag
     VFX3D.trail(st,x,y,h,kind,o)        שובל: חלקיקים לאורך הדרך מהמיקום הקודם (נשמר ב-st) לנוכחי
     VFX3D.burst(kind,x,y,o)             מתכון מוכן: 'explode' (הבזק, גל הדף, ניצוצות, גחלים, עשן, אור), 'ring', 'flash'
     VFX3D.decal(kind,x,y,r,o)           סימן על הקרקע: 'ring' גל הדף, 'mark' סימון מטרה, 'scorch' חרוך, 'cracks' סדקים זוהרים, 'glow' הבזק, 'rune' עיגול רונות (spin על הידית מסובב, p:1 טבעת סימנים חיצונית)
                                         o: life (שניות, Infinity = ידני), col, a, grow:[r0,r1], fade (חלק מהזמן בסוף), w (עובי טבעת), p
     VFX3D.pillar(x,y,r,h,col,o)         עמוד אור אנכי (o: life, hdr, a), נעלם לבד
     VFX3D.light(x,y,h,col,i,life)       אור נקודתי (רק באיכות גבוהה), מחזיר ידית או null
     VFX3D.orb(col,size)                 כדור זוהר (גוף של מטאור, קליע). ידית עם .set(x,y,h,size)
     VFX3D.free(handle)                  משחרר ידית (מדבקה, אור או כדור)
   איכות: "איכות אפקטים" בהגדרות (גבוהה/נמוכה, SAVE.vfxQ). ברירת המחדל לפי המכשיר. נמוכה: בלי זוהר, בלי אורות ופחות חלקיקים.
   "פחות אפקטים" (juice.js) מוריד עוד חצי מהחלקיקים. ?bloom=0 מכבה רק את הזוהר. בזירה (של אוראל) אין זוהר ואין אפקטים */
const VFX3D_CFG={
  pool:{glow:{hi:900,lo:260},smoke:{hi:260,lo:80}},   // כמה חלקיקים לכל היותר
  decals:16,orbs:4,lights:2,pillars:2,
  lo:0.4,less:0.5,           // כמה חלקיקים באיכות נמוכה, וב"פחות אפקטים"
  hdr:5,                   // כמה בהיר חלקיק זוהר (מעל 1 = זוהר ב-bloom)
  y:0.8,                     // גובה המדבקות מעל הקרקע
  bloom:{th:1.0,knee:0.15,str:0.65,wide:1.0,res:4},   // th: רק מה שבהיר מזה זוהר. str: כמה זוהר. wide: הזוהר הרחב (חצי רזולוציה נוספת)
  auto:{minFps:40,warm:3,secs:5,key:'zm-vfxq-slow'},     // ברירת מחדל: מודדים כמה שניות בעולם, ומתחת ל-minFps עוברים לאיכות נמוכה
  // סוגי חלקיקים. col/col2: צבע בהתחלה ובסוף. size/size2: גודל (פיקסלים של המשחק). life: [מינימום,מקסימום]. spd: מהירות לצדדים, up: למעלה
  // grav: כוח משיכה (שלילי = נופל), drag: האטה בשנייה. glow: זוהר (חיבור אור). smoke: עשן (רגיל)
  kinds:{
    fire:  {pool:'glow', col:'#ffd27a',col2:'#ff3c0a',size:30,size2:6, life:[0.3,0.55],spd:40, up:30, grav:0,   drag:2},
    spark: {pool:'glow', col:'#fff4d0',col2:'#ff7a1a',size:12,size2:3, life:[0.35,0.8],spd:420,up:380,grav:-1100,drag:1.2},
    ember: {pool:'glow', col:'#ffb347',col2:'#ff4a10',size:7, size2:4, life:[1.0,2.0], spd:160,up:420,grav:-520,drag:0.6,flick:1},
    glow:  {pool:'glow', col:'#ffffff',col2:'#ffb060',size:90,size2:140,life:[0.12,0.2],spd:0, up:0,  grav:0,   drag:0},
    coal:  {pool:'glow', col:'#ff7a20',col2:'#7a1a04',size:9, size2:5, life:[1.6,2.8], spd:60, up:0,  grav:0,   drag:6,flick:1},   // גחלים שנשארות על הקרקע
    smoke: {pool:'smoke',col:'#4a3f3a',col2:'#2a2522',size:26,size2:80,life:[1.2,2.2], spd:40, up:70, grav:0,   drag:0.8,a:0.55},
    puff:  {pool:'smoke',col:'#6a5d55',col2:'#3a3330',size:18,size2:44,life:[0.6,1.0], spd:20, up:40, grav:0,   drag:1.5,a:0.45}
  },
  // explode: מה יוצא בפיצוץ (מספרים לאיכות גבוהה, וקטנים לבד באיכות נמוכה)
  explode:{spark:70,ember:34,smoke:18,fire:26,glow:3,flash:0.28,ring:0.5,ring2:0.8,light:16,lightT:0.55}
};

const VFX3D={built:false,q:null,stat:{emits:0,peak:0,bloomFrames:0,frames:0}};
(()=>{
  const CF=VFX3D_CFG;let B=null;   // B: כל האובייקטים בתלת-ממד, נבנים בפעם הראשונה שצריך
  const col=new (window.THREE?THREE.Color:Object)(),col2=window.THREE?new THREE.Color():null,v2=window.THREE?new THREE.Vector2():null;
  const sin=()=>Math.sin(camTilt());
  const lin=c=>{col.set(c);return col};

  /* ---- איכות ---- */
  function qAuto(){try{if(+localStorage.getItem(CF.auto.key))return 'lo'}catch(e){}
    if(navigator.deviceMemory&&navigator.deviceMemory<4)return 'lo';return 'hi'}
  VFX3D.quality=()=>{const s=typeof SAVE!=='undefined'&&SAVE&&SAVE.vfxQ;return s==='hi'||s==='lo'?s:(VFX3D.q||(VFX3D.q=qAuto()))};
  VFX3D.setQuality=q=>{SAVE.vfxQ=q;if(typeof saveNow==='function')saveNow();showQ()};
  function showQ(){for(const b of document.querySelectorAll('[data-vfxq]'))b.setAttribute('aria-pressed',String(b.dataset.vfxq===VFX3D.quality()))}
  VFX3D.showQ=showQ;
  // מדידה: רק כשלא בחרו בעצמם, בעולם, אחרי כמה שניות. איטי: נמוכה מעכשיו (ונשמר למכשיר)
  const M={t:0,n:0,done:false};
  function measure(dt){if(M.done||VFX3D.quality()!=='hi'||(SAVE&&SAVE.vfxQ)||R3D.drawEvery||!(dt>0)||dt>0.25)return;
    M.t+=dt;if(M.t<CF.auto.warm)return;M.n++;if(M.t<CF.auto.warm+CF.auto.secs)return;M.done=true;
    const fps=M.n/CF.auto.secs;VFX3D.stat.fps=Math.round(fps);if(fps<CF.auto.minFps){VFX3D.q='lo';try{localStorage.setItem(CF.auto.key,'1')}catch(e){}showQ()}}
  const hi=()=>VFX3D.quality()==='hi';
  const many=n=>{const k=(hi()?1:CF.lo)*(typeof fxLess==='function'&&fxLess()?CF.less:1);return Math.max(n>0?1:0,Math.round(n*k))};
  VFX3D.many=many;

  const base=()=>!!(R3D.on&&R3D.ready&&window.THREE&&S&&!S.room&&!S.mb);
  VFX3D.on=()=>base()&&!!S.wd;
  // האש של פיוחו (petfx3d.js) פעילה גם בכפר. רק היא: היא מדליקה את VFX3D.pet סביב הקריאות שלה, וכל שאר האפקטים נשארים בעולם בלבד
  VFX3D.pet=false;
  VFX3D.petOn=()=>base()&&!!(S.wd||S.vil);
  const live=()=>VFX3D.on()||VFX3D.pet&&VFX3D.petOn();

  /* ---- בנייה ---- */
  const PV=`attribute float size;attribute vec4 rgba;uniform float uK;varying vec4 vC;
    void main(){vC=rgba;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size*uK;}`;
  const PF_GLOW=`varying vec4 vC;void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d)*4.;if(r>1.)discard;float a=1.-r;a*=a;
    gl_FragColor=vec4(vC.rgb,a*vC.a);
    #include <colorspace_fragment>
    }`;
  const PF_SMOKE=`varying vec4 vC;void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d)*4.;if(r>1.)discard;float a=1.-r;
    gl_FragColor=vec4(vC.rgb*(.8+.4*(.5-d.y)),a*a*vC.a);
    #include <colorspace_fragment>
    }`;
  function mkPool(name){
    const n=CF.pool[name].hi,g=new THREE.BufferGeometry();
    const P_={n:0,max:n,pos:new Float32Array(n*3),rgba:new Float32Array(n*4),size:new Float32Array(n),
      v:new Float32Array(n*3),t:new Float32Array(n),T:new Float32Array(n),s0:new Float32Array(n),s1:new Float32Array(n),
      c0:new Float32Array(n*3),c1:new Float32Array(n*3),a:new Float32Array(n),gr:new Float32Array(n),dr:new Float32Array(n),fl:new Uint8Array(n)};
    const at=(k,w)=>{const b=new THREE.BufferAttribute(P_[k],w);b.setUsage(THREE.DynamicDrawUsage);g.setAttribute(k==='pos'?'position':k,b);return b};
    P_.aPos=at('pos',3);P_.aRgba=at('rgba',4);P_.aSize=at('size',1);g.setDrawRange(0,0);
    P_.mat=new THREE.ShaderMaterial({uniforms:{uK:{value:1}},vertexShader:PV,fragmentShader:name==='glow'?PF_GLOW:PF_SMOKE,transparent:true,depthWrite:false,
      blending:name==='glow'?THREE.AdditiveBlending:THREE.NormalBlending});
    P_.pts=new THREE.Points(g,P_.mat);P_.pts.frustumCulled=false;P_.pts.renderOrder=name==='glow'?6:5;P_.g=g;
    return P_;
  }
  const DV=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  const DF=`varying vec2 vUv;uniform vec3 uC;uniform float uA,uK,uP,uS,uW;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}
    void main(){vec2 q=vUv*2.-1.;float d=length(q);if(d>1.)discard;float a=0.;vec3 c=uC;
      if(uK<.5){a=smoothstep(1.,1.-uW*.35,d)*smoothstep(1.-uW,1.-uW*.35,d);}
      else if(uK<1.5){float e=smoothstep(1.,.95,d)*smoothstep(.88,.95,d);float r=smoothstep(.05,0.,abs(d-(1.-uP)));
        float sp=step(.5,fract(atan(q.y,q.x)*1.909+uS));a=e*(.7+.3*sp)+r*.9+.18*uP*(1.-d);}
      else if(uK<2.5){float nn=n(q*3.+uS)*.5+n(q*7.+uS)*.25;a=smoothstep(1.,.55,d+nn*.45-.15)*.92;c=uC*(.6+.7*d);}
      else if(uK<3.5){float l=abs(n(q*5.+uS)-.5)*2.;a=pow(1.-l,10.)*smoothstep(.95,.25,d)+.35*smoothstep(.5,0.,d);}
      else if(uK<4.5){a=pow(1.-d,2.2);}
      else if(uP>.5){float an=atan(q.y,q.x)+uS,sg=floor(an*3.8197186),g=h(vec2(sg,7.)),f=fract(an*3.8197186);   // rune עם p=1: טבעת חיצונית של סימנים (skillcast.js)
        float bar=step(.18+.25*g,f)*step(f,.82-.25*g)*smoothstep(.035+.025*g,.0,abs(d-.875));
        a=smoothstep(.05,0.,abs(d-.97))+.3*smoothstep(.2,0.,abs(d-.97))+.9*smoothstep(.035,0.,abs(d-.78))+bar*.95+.06*smoothstep(.75,1.,d);a=min(a,1.);}
      else{float an=atan(q.y,q.x)+uS,sx=2.0943951;   // rune: עיגול רונות שמסתובב (uS = זווית). שתי טבעות, משולש כפול וסימנים ביניהן (skillcast.js)
        float l1=smoothstep(.045,0.,abs(d*cos(mod(an+1.0471976,sx)-1.0471976)-.37)),l2=smoothstep(.045,0.,abs(d*cos(mod(an,sx)-1.0471976)-.37));
        float tk=step(.82,fract(an*1.9098593))*step(.81,d)*step(d,.92);
        a=smoothstep(.06,0.,abs(d-.94))+.35*smoothstep(.22,0.,abs(d-.94))+.8*smoothstep(.04,0.,abs(d-.79))+(l1+l2)*.85*step(d,.76)+tk*.7+.08*(1.-d);a=min(a,1.);}
      gl_FragColor=vec4(c,a*uA);
      #include <colorspace_fragment>
    }`;
  const DK={ring:0,mark:1,scorch:2,cracks:3,glow:4,rune:5};
  function build(){
    if(B||!R3D.ready)return B;
    B={sc:R3D.scene};
    B.glow=mkPool('glow');B.smoke=mkPool('smoke');B.sc.add(B.smoke.pts);B.sc.add(B.glow.pts);
    const dg=new THREE.PlaneGeometry(2,2).rotateX(-Math.PI/2);
    B.decals=[];for(let i=0;i<CF.decals;i++){const m=new THREE.Mesh(dg,new THREE.ShaderMaterial({uniforms:{uC:{value:new THREE.Color()},uA:{value:1},uK:{value:0},uP:{value:0},uS:{value:0},uW:{value:0.3}},
        vertexShader:DV,fragmentShader:DF,transparent:true,depthWrite:false}));m.visible=false;m.frustumCulled=false;m.renderOrder=3;B.sc.add(m);B.decals.push({m,on:false,h:1})}
    const og=new THREE.IcosahedronGeometry(1,2);
    B.orbs=[];for(let i=0;i<CF.orbs;i++){const m=new THREE.Mesh(og,new THREE.MeshBasicMaterial({color:0xffffff,fog:false}));m.visible=false;m.frustumCulled=false;m.renderOrder=4;B.sc.add(m);B.orbs.push({m,on:false,h:2})}
    // עמוד אור (skillcast.js): גליל פתוח בלי מכסים, בהיר באמצע ובבסיס ודוהה למעלה ובשוליים
    const pg=new THREE.CylinderGeometry(1,1,1,20,1,true).translate(0,0.5,0);
    B.pillars=[];for(let i=0;i<CF.pillars;i++){const m=new THREE.Mesh(pg,new THREE.ShaderMaterial({uniforms:{uC:{value:new THREE.Color()},uA:{value:1}},
        vertexShader:`varying float vY,vF;void main(){vY=uv.y;vec3 n=normalize(normalMatrix*normal);vF=abs(n.z);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`varying float vY,vF;uniform vec3 uC;uniform float uA;void main(){float a=pow(1.-vY,1.6)*pow(vF,1.5)*uA;gl_FragColor=vec4(uC*(1.+vF),a);
          #include <colorspace_fragment>
          }`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));m.visible=false;m.frustumCulled=false;m.renderOrder=6;B.sc.add(m);B.pillars.push({m,on:false,h:4})}
    B.lights=[];lightsSync();
    VFX3D.built=true;return B;
  }
  // אורות רק באיכות גבוהה. מספר האורות בסצנה קבוע (גם כבוי הוא נשאר עם עוצמה 0), כי שינוי שלו מכין מחדש את כל החומרים
  function lightsSync(){
    const want=hi()?CF.lights:0;
    while(B.lights.length<want){const l=new THREE.PointLight(0xffffff,0,320,0);l.visible=true;B.sc.add(l);B.lights.push({l,on:false,h:3})}
    while(B.lights.length>want){const L=B.lights.pop();B.sc.remove(L.l)}
  }

  /* ---- חלקיקים ---- */
  VFX3D.emit=function(kind,x,y,h,o){
    if(!live()||!build())return 0;o=o||{};const K=CF.kinds[kind]||CF.kinds.fire,P_=B[K.pool];
    const n=o.raw?o.n:many(o.n==null?1:o.n),cap=K.pool==='glow'?CF.pool.glow[hi()?'hi':'lo']:CF.pool.smoke[hi()?'hi':'lo'];
    const S_=sin(),z=y/S_,spd=o.spd!=null?o.spd:K.spd,up=o.up!=null?o.up:K.up,L=o.life||K.life,sp=o.spread||0;
    const c0=o.col||K.col,c1=o.col2||K.col2,a=o.a!=null?o.a:K.a!=null?K.a:1,hdr=K.pool==='glow'?(o.hdr||CF.hdr):1;
    lin(c0);const r0=col.r*hdr,g0=col.g*hdr,b0=col.b*hdr;lin(c1);const r1=col.r*hdr,g1=col.g*hdr,b1=col.b*hdr;
    let made=0;
    for(let k=0;k<n;k++){
      if(P_.n>=Math.min(cap,P_.max))break;const i=P_.n++;made++;
      const an=Math.random()*6.283,rr=Math.random(),dx=Math.cos(an)*sp*rr,dz=Math.sin(an)*sp*rr/S_;
      P_.pos[i*3]=x+dx;P_.pos[i*3+1]=h+(o.hJ?(Math.random()-0.5)*o.hJ:0);P_.pos[i*3+2]=z+dz;
      const sa=Math.random()*6.283,ss=spd*(0.35+0.65*Math.random());
      P_.v[i*3]=Math.cos(sa)*ss+(o.vx||0);P_.v[i*3+1]=up*(0.5+0.5*Math.random())+(o.vy||0);P_.v[i*3+2]=Math.sin(sa)*ss/S_+(o.vz||0);
      P_.t[i]=0;P_.T[i]=L[0]+(L[1]-L[0])*Math.random();
      const sz=o.size||K.size,sz2=o.size2!=null?o.size2:K.size2,j=0.75+0.5*Math.random();P_.s0[i]=sz*j;P_.s1[i]=sz2*j;
      P_.c0[i*3]=r0;P_.c0[i*3+1]=g0;P_.c0[i*3+2]=b0;P_.c1[i*3]=r1;P_.c1[i*3+1]=g1;P_.c1[i*3+2]=b1;
      P_.a[i]=a;P_.gr[i]=o.grav!=null?o.grav:K.grav;P_.dr[i]=o.drag!=null?o.drag:K.drag;P_.fl[i]=K.flick?1:0;
    }
    VFX3D.stat.emits+=made;return made;
  };
  // שובל: מהמיקום הקודם (st.lx...) לנוכחי, בערך חלקיק כל every פיקסלים
  const TR={};   // אובייקט אחד לשובל, בלי הקצאה לכל חלקיק
  VFX3D.trail=function(st,x,y,h,kind,o){
    o=o||{};const ev=o.every||10;
    if(st.lx==null){st.lx=x;st.ly=y;st.lh=h}
    const d=Math.hypot(x-st.lx,y-st.ly,h-st.lh),n=Math.min(o.max||12,Math.ceil(d/ev));let m=0;
    const keep=many(1000)/1000;for(const k in TR)delete TR[k];Object.assign(TR,o);TR.n=1;TR.raw=1;
    for(let k=1;k<=n;k++){if(Math.random()>keep)continue;const f=k/n;m+=VFX3D.emit(kind,st.lx+(x-st.lx)*f,st.ly+(y-st.ly)*f,st.lh+(h-st.lh)*f,TR)}
    st.lx=x;st.ly=y;st.lh=h;return m;
  };
  function stepPool(P_,dt){
    let i=0;
    while(i<P_.n){
      P_.t[i]+=dt;
      if(P_.t[i]>=P_.T[i]){const j=--P_.n;if(i!==j)swap(P_,i,j);continue}
      const dr=Math.max(0,1-P_.dr[i]*dt);P_.v[i*3]*=dr;P_.v[i*3+1]=P_.v[i*3+1]*dr+P_.gr[i]*dt;P_.v[i*3+2]*=dr;
      P_.pos[i*3]+=P_.v[i*3]*dt;P_.pos[i*3+1]+=P_.v[i*3+1]*dt;P_.pos[i*3+2]+=P_.v[i*3+2]*dt;
      if(P_.pos[i*3+1]<1&&P_.gr[i]<0){P_.pos[i*3+1]=1;P_.v[i*3+1]*=-0.3;P_.v[i*3]*=0.6;P_.v[i*3+2]*=0.6}   // קופץ קצת מהקרקע
      i++;
    }
    for(let k=0;k<P_.n;k++){
      const f=P_.t[k]/P_.T[k],g=1-f;
      P_.size[k]=P_.s0[k]+(P_.s1[k]-P_.s0[k])*f;
      let fade=f<0.12?f/0.12:g<0.4?g/0.4:1;if(P_.fl[k])fade*=0.65+0.35*Math.sin(P_.t[k]*31+k);
      P_.rgba[k*4]=P_.c0[k*3]*g+P_.c1[k*3]*f;P_.rgba[k*4+1]=P_.c0[k*3+1]*g+P_.c1[k*3+1]*f;P_.rgba[k*4+2]=P_.c0[k*3+2]*g+P_.c1[k*3+2]*f;P_.rgba[k*4+3]=P_.a[k]*fade;
    }
    P_.g.setDrawRange(0,P_.n);P_.pts.visible=P_.n>0;
    if(P_.n){for(const b of [P_.aPos,P_.aRgba,P_.aSize]){b.clearUpdateRanges();b.addUpdateRange(0,P_.n*b.itemSize);b.needsUpdate=true}}
  }
  function swap(P_,i,j){
    for(const [k,w] of [['pos',3],['v',3],['c0',3],['c1',3]])for(let q=0;q<w;q++)P_[k][i*w+q]=P_[k][j*w+q];
    for(const k of ['t','T','s0','s1','a','gr','dr','fl'])P_[k][i]=P_[k][j];
  }

  /* ---- מדבקות קרקע, כדורים ואורות ---- */
  function take(L){for(const d of L)if(!d.on){d.on=true;return d}return null}
  VFX3D.decal=function(kind,x,y,r,o){
    if(!live()||!build())return null;o=o||{};const d=take(B.decals);if(!d)return null;
    const u=d.m.material.uniforms;d.spin=0;d.kind=kind;d.x=x;d.y=y;d.r=r;d.t=0;d.life=o.life==null?1:o.life;d.grow=o.grow||null;d.fade=o.fade==null?0.5:o.fade;d.a=o.a==null?1:o.a;d.fin=o.fin||0;d.p=o.p==null?null:o.p;
    const add=kind!=='scorch'&&kind!=='rune',k=kind==='scorch'?1:(o.hdr||CF.hdr);   // rune: בלי חיבור אור, כי סגול על דשא ירוק נהיה לבן. הצבע נשאר הצבע של סוג הנזק
    d.m.material.blending=add?THREE.AdditiveBlending:THREE.NormalBlending;d.m.renderOrder=add?3:2;
    lin(o.col||'#ffffff');u.uC.value.setRGB(col.r*k,col.g*k,col.b*k);
    u.uK.value=DK[kind]||0;u.uP.value=o.p||0;u.uS.value=Math.random()*40;u.uW.value=o.w||0.3;d.m.visible=true;place(d);return d;
  };
  function place(d){const S_=sin(),r=d.r;d.m.position.set(d.x,CF.y+(d.kind==='scorch'?0:0.2),d.y/S_);d.m.scale.set(r,1,r/S_);d.m.material.uniforms.uA.value=d.a}
  VFX3D.orb=function(c,size){
    if(!VFX3D.on()||!build())return null;const d=take(B.orbs);if(!d)return null;lin(c||'#ffffff');d.m.material.color.setRGB(col.r*CF.hdr,col.g*CF.hdr,col.b*CF.hdr);
    d.m.scale.setScalar(size||12);d.m.visible=true;
    d.set=(x,y,h,s)=>{d.m.position.set(x,h,y/sin());if(s)d.m.scale.setScalar(s);d.m.rotation.x+=0.13;d.m.rotation.y+=0.21};return d;
  };
  // עמוד אור: VFX3D.pillar(x,y,r,h,col,{life,hdr}). רוחב r, גובה h. ידית: x,y,r,a ניתנים לשינוי (כמו מדבקה). life: Infinity = ידני
  VFX3D.pillar=function(x,y,r,h,c,o){
    if(!live()||!build())return null;o=o||{};const d=take(B.pillars);if(!d)return null;const k=o.hdr||CF.hdr;
    lin(c||'#ffffff');d.m.material.uniforms.uC.value.setRGB(col.r*k,col.g*k,col.b*k);
    d.x=x;d.y=y;d.r=r;d.hh=h;d.a=o.a==null?1:o.a;d.t=0;d.life=o.life==null?0.6:o.life;d.m.visible=true;return d;
  };
  VFX3D.light=function(x,y,h,c,i,life){
    if(!live()||!build()||!hi())return null;const d=take(B.lights);if(!d)return null;
    d.l.color.set(c||'#ffffff');d.i0=i;d.l.intensity=i;d.t=0;d.life=life==null?Infinity:life;d.l.position.set(x,h,y/sin());
    d.set=(x,y,h,i)=>{d.l.position.set(x,h,y/sin());if(i!=null){d.i0=i;d.l.intensity=i}};return d;
  };
  VFX3D.free=function(d){if(!d||!d.on)return;d.on=false;if(d.m)d.m.visible=false;if(d.l)d.l.intensity=0};
  function stepHandles(dt){
    for(const d of B.decals){if(!d.on)continue;d.t+=dt;
      if(d.t>=d.life){VFX3D.free(d);continue}
      if(d.life<Infinity){const f=d.t/d.life;if(d.grow){const e=1-Math.pow(1-f,2.4);d.r=d.grow[0]+(d.grow[1]-d.grow[0])*e}
        const fa=d.fade>0&&f>1-d.fade?(1-f)/d.fade:1,fi=d.fin>0&&f<d.fin?f/d.fin:1;d.m.material.uniforms.uA.value=d.a*fa*fi}
      else d.m.material.uniforms.uA.value=d.a;
      if(d.p!=null)d.m.material.uniforms.uP.value=d.p;
      if(d.spin)d.m.material.uniforms.uS.value+=d.spin*dt;   // rune מסתובב
      const S_=sin();d.m.position.set(d.x,d.m.position.y,d.y/S_);d.m.scale.set(d.r,1,d.r/S_)}
    for(const d of B.pillars){if(!d.on)continue;d.t+=dt;if(d.t>=d.life){VFX3D.free(d);continue}
      const f=d.life<Infinity?d.t/d.life:0;d.m.material.uniforms.uA.value=d.a*(1-f)*(1-f);d.m.position.set(d.x,0,d.y/sin());d.m.scale.set(d.r,d.hh,d.r)}
    for(const d of B.lights){if(!d.on||d.life===Infinity)continue;d.t+=dt;if(d.t>=d.life){VFX3D.free(d);continue}const f=d.t/d.life;d.l.intensity=d.i0*(1-f)*(1-f)}
  }

  /* ---- מתכונים מוכנים ---- */
  VFX3D.burst=function(kind,x,y,o){
    if(!live()||!build())return;o=o||{};const E=CF.explode,r=o.r||100,c=o.col||'#ff8a2a',c2=o.col2||'#ff3c0a',core=o.core||'#fff4d0';
    if(kind==='ring'){VFX3D.decal('ring',x,y,r,{life:o.life||E.ring,grow:[r*0.15,r],col:c,w:o.w||0.28,fade:0.6});return}
    if(kind==='flash'){VFX3D.decal('glow',x,y,r,{life:o.life||E.flash,col:core,fade:0.9,a:1.2});return}
    if(kind==='explode'){
      VFX3D.decal('glow',x,y,r*1.3,{life:E.flash,col:core,fade:0.9,a:0.3});
      VFX3D.decal('ring',x,y,r*1.25,{life:E.ring,grow:[r*0.2,r*1.25],col:c,w:0.22,fade:0.7,a:0.7});
      if(hi())VFX3D.decal('ring',x,y,r*1.6,{life:E.ring2,grow:[r*0.3,r*1.6],col:c,w:0.4,fade:0.8,a:0.7});
      VFX3D.emit('glow',x,y,24,{n:E.glow,col:core,col2:c,size:r*0.5,size2:r*0.8,a:0.6});
      VFX3D.emit('fire',x,y,14,{n:E.fire,col:core,col2:c2,spd:r*2.2,up:160,spread:r*0.3,size:38,size2:8,life:[0.35,0.7]});
      VFX3D.emit('spark',x,y,10,{n:E.spark,col:core,col2:c,spd:r*4,spread:r*0.2});
      VFX3D.emit('ember',x,y,12,{n:E.ember,col:c,col2:c2,spread:r*0.4});
      VFX3D.emit('smoke',x,y,20,{n:E.smoke,col:o.smoke||CF.kinds.smoke.col,col2:o.smoke2||CF.kinds.smoke.col2,spread:r*0.5,spd:r*0.9,up:90,size:40,size2:o.smokeSize||120});
      VFX3D.light(x,y,70,c,o.light||E.light,E.lightT);
    }
  };

  /* ---- כל פריים: מתכונים (skfx3d.js), חלקיקים ומדבקות. נקרא מ-render3d לפני הציור, גם בפריימים שלא מצוירים ---- */
  VFX3D.step=function(dt){
    if(!B){if(!VFX3D.on()||typeof SKFX3D==='undefined'||!SKFX3D.wants())return;build()}
    if(!B)return;
    if(B.lights.length!==(hi()?CF.lights:0))lightsSync();
    if(typeof SKFX3D!=='undefined')SKFX3D.step(dt);
    stepPool(B.glow,dt);stepPool(B.smoke,dt);stepHandles(dt);
    VFX3D.stat.peak=Math.max(VFX3D.stat.peak,B.glow.n+B.smoke.n);
  };
  // כמה דברים חיים עכשיו (בשביל הבוט): חלקיקים, מדבקות, כדורים ואורות
  VFX3D.n=()=>B?B.glow.n+B.smoke.n+B.decals.filter(d=>d.on).length+B.orbs.filter(d=>d.on).length+B.lights.filter(d=>d.on).length+B.pillars.filter(d=>d.on).length:0;
  VFX3D.parts=()=>B?B.glow.n+B.smoke.n:0;
  // יציאה מהעולם: הכל נעלם מיד
  VFX3D.clear=function(){if(!B)return;B.glow.n=B.smoke.n=0;for(const P_ of [B.glow,B.smoke]){P_.g.setDrawRange(0,0);P_.pts.visible=false}
    for(const L of [B.decals,B.orbs,B.lights,B.pillars])for(const d of L)VFX3D.free(d);if(typeof SKFX3D!=='undefined')SKFX3D.clear()};

  /* ---- זוהר (bloom): מציירים את הסצנה לתמונה, לוקחים רק את מה שבהיר, מטשטשים ברזולוציה נמוכה ומוסיפים בחזרה ---- */
  const QV=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
  const BL={};
  function bloomBuild(r){
    if(BL.ok!=null)return BL.ok;
    try{
      const hf=r.extensions.has('EXT_color_buffer_float')||r.extensions.has('EXT_color_buffer_half_float');
      if(!hf)throw new Error('אין תמונה בטווח גבוה (EXT_color_buffer_float)');   // בלי זה אי אפשר להבדיל בין בהיר לבהיר מאוד, אז בלי זוהר
      const type=THREE.HalfFloatType,o={type,depthBuffer:false};
      // התמונה של הסצנה מצוירת בדיוק כמו למסך (tone mapping ו-sRGB, וחיבור אור באותו מרחב), אבל בטווח גבוה: רק מה שמעל 1 (חלקיקים זוהרים) נשאר בהיר מ-1.
      // isXRRenderTarget הוא הדרך של three.js להחיל tone mapping וצבעי מסך גם כשמציירים לתמונה
      BL.rt=new THREE.WebGLRenderTarget(1,1,{type,samples:DPR<2?4:0});BL.rt.isXRRenderTarget=true;BL.rt.texture.colorSpace=THREE.SRGBColorSpace;BL.a=new THREE.WebGLRenderTarget(1,1,o);BL.b=new THREE.WebGLRenderTarget(1,1,o);
      BL.c=new THREE.WebGLRenderTarget(1,1,o);BL.d=new THREE.WebGLRenderTarget(1,1,o);
      BL.cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);BL.q=new THREE.Mesh(new THREE.PlaneGeometry(2,2));BL.q.frustumCulled=false;BL.sc=new THREE.Scene();BL.sc.add(BL.q);
      const U=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,{value:v}]));
      BL.bright=new THREE.ShaderMaterial({uniforms:U({t:null,px:new THREE.Vector2(),th:1,kn:0.3}),vertexShader:QV,depthTest:false,depthWrite:false,
        fragmentShader:`varying vec2 vUv;uniform sampler2D t;uniform vec2 px;uniform float th,kn;
          vec3 f(vec2 o){vec3 c=texture2D(t,vUv+o*px).rgb;float l=max(c.r,max(c.g,c.b));float s=clamp(l-th+kn,0.,2.*kn);s=s*s/(4.*kn+1e-4);return c*max(s,l-th)/max(l,1e-4);}
          void main(){gl_FragColor=vec4((f(vec2(-1.,-1.))+f(vec2(1.,-1.))+f(vec2(-1.,1.))+f(vec2(1.,1.)))*.25,1.);}`});
      BL.blur=new THREE.ShaderMaterial({uniforms:U({t:null,dir:new THREE.Vector2()}),vertexShader:QV,depthTest:false,depthWrite:false,
        fragmentShader:`varying vec2 vUv;uniform sampler2D t;uniform vec2 dir;
          void main(){vec3 c=texture2D(t,vUv).rgb*.227;c+=(texture2D(t,vUv+dir*1.385).rgb+texture2D(t,vUv-dir*1.385).rgb)*.316;c+=(texture2D(t,vUv+dir*3.231).rgb+texture2D(t,vUv-dir*3.231).rgb)*.07;gl_FragColor=vec4(c,1.);}`});
      BL.comp=new THREE.ShaderMaterial({uniforms:U({t:null,b1:null,b2:null,str:1,wide:1}),vertexShader:QV,depthTest:false,depthWrite:false,toneMapped:false,
        fragmentShader:`varying vec2 vUv;uniform sampler2D t,b1,b2;uniform float str,wide;
          void main(){vec3 c=texture2D(t,vUv).rgb+(texture2D(b1,vUv).rgb+texture2D(b2,vUv).rgb*wide)*str;gl_FragColor=vec4(c,1.);}`});
      BL.ok=true;
    }catch(e){console.warn('bloom לא זמין:',e&&e.message);BL.ok=false}
    return BL.ok;
  }
  function pass(r,mat,src,dst){mat.uniforms.t.value=src.texture;BL.q.material=mat;r.setRenderTarget(dst);r.render(BL.sc,BL.cam)}
  const bloomWant=()=>hi()&&!/[?&]bloom=0/.test(location.search)&&S&&(S.wd||S.vil)&&!S.room&&!S.mb;
  // נקרא מ-render3d במקום r.render. מחזיר false כשאין זוהר (ואז render3d מצייר רגיל)
  VFX3D.render=function(r,sc,cam){
    if(B){r.getDrawingBufferSize(v2);const k=v2.x/Math.max(1,W);B.glow.mat.uniforms.uK.value=k;B.smoke.mat.uniforms.uK.value=k}
    if(!bloomWant()||!bloomBuild(r))return false;
    r.getDrawingBufferSize(v2);const w=Math.max(1,v2.x|0),h=Math.max(1,v2.y|0),R=VFX3D_CFG.bloom,w4=Math.max(1,w/R.res|0),h4=Math.max(1,h/R.res|0),w8=Math.max(1,w4>>1),h8=Math.max(1,h4>>1);
    if(BL.w!==w||BL.h!==h){BL.w=w;BL.h=h;BL.rt.setSize(w,h);BL.a.setSize(w4,h4);BL.b.setSize(w4,h4);BL.c.setSize(w8,h8);BL.d.setSize(w8,h8)}
    const prev=r.getRenderTarget();
    r.setRenderTarget(BL.rt);r.render(sc,cam);
    BL.bright.uniforms.th.value=R.th;BL.bright.uniforms.kn.value=R.knee;BL.bright.uniforms.px.value.set(1/w,1/h);
    pass(r,BL.bright,BL.rt,BL.a);
    BL.blur.uniforms.dir.value.set(1/w4,0);pass(r,BL.blur,BL.a,BL.b);BL.blur.uniforms.dir.value.set(0,1/h4);pass(r,BL.blur,BL.b,BL.a);
    BL.blur.uniforms.dir.value.set(2/w4,0);pass(r,BL.blur,BL.a,BL.d);BL.blur.uniforms.dir.value.set(0,1/h8);pass(r,BL.blur,BL.d,BL.c);
    const C=BL.comp.uniforms;C.t.value=BL.rt.texture;C.b1.value=BL.a.texture;C.b2.value=BL.c.texture;C.str.value=R.str;C.wide.value=R.wide;BL.q.material=BL.comp;
    r.setRenderTarget(prev);r.render(BL.sc,BL.cam);
    VFX3D.stat.bloomFrames++;return true;
  };
  VFX3D._bl=BL;   // לבדיקות
  VFX3D.bloomOn=()=>!!(bloomWant()&&BL.ok);
  // נקרא מ-render3d בכל פריים (גם כשהבדיקה מדלגת על הציור): זמן לפי השעון של המשחק, ועוצר ב-hit-stop ובהפסקה
  let last=0;
  VFX3D.frame=function(){
    const now=typeof FRAME_T==='number'?FRAME_T:performance.now(),raw=last?Math.min(0.1,(now-last)/1000):0;last=now;
    const dt=S&&S.mode==='play'&&!(S.hitstop>0)?raw*(S.slow>0?0.35:1):0;VFX3D.stat.frames++;
    if(S&&S.wd&&dt>0)measure(raw);
    if(!VFX3D.petOn()){if(B&&VFX3D.n())VFX3D.clear();return}   // בכפר ממשיכים לקדם רק את מה שיש (האש של פיוחו)
    VFX3D.step(dt);
  };

  for(const b of document.querySelectorAll('[data-vfxq]'))b.onclick=()=>{VFX3D.setQuality(b.dataset.vfxq);if(typeof sfx==='function')sfx('ui')};
  showQ();
})();
