/* חלקיקים לכל אזור (שלב 4 ב-docs/visual-plan.md, "עולם חי"): אבקנים וגחליליות באחו ובכפר, נצנוצים מעל האגם, נצנוצי קרח ברכס,
   גחלים שעולות במדבר, עלים שעפים בסערה, ושביבים סגולים בלב הצל. משלים את מזג האוויר שבקנבס (ערפל, שלג, גשם ב-world.js) ולא מחליף אותו.
   איך: ענן נקודות אחד סביב השחקן (ציור אחד). כל התנועה בשיידר לפי הזמן: נקודה שיוצאת מהקופסה חוזרת מהצד השני, אז המעבד לא עושה כלום.
   רק בתלת-ממד, בכפר ובעולם, במראה החדש (look-hd.js). לא בזירה. ?amb=0 מכבה. אזור חדש: שורה ב-AMBIENT.reg (בלי שורה: בלי חלקיקים).
   לכל אזור: n כמה, col צבעים, size גודל (פיקסלים של המשחק), h גובה מעל הקרקע [מ, עד], v מהירות [x, למעלה, y], sway כמה מתנדנד,
   tw כמה מהבהב (0 קבוע, 1 נדלק ונכבה), glow אור (מתחבר לצבעים שמתחת, כמו גחלילית), a שקיפות */
const AMBIENT={
  on:!/[?&]amb=0\b/.test(location.search),
  box:{w:1500,h:1100},   // גודל הקופסה סביב השחקן (פיקסלים של המשחק). גדולה מהמסך בזום הרחוק
  fade:0.12,             // קצה הקופסה: הנקודות נעלמות בהדרגה, בלי לקפוץ
  reg:{
    meadow: {n:90,col:['#fff6b0','#ffe66b','#ffffff'],size:9,h:[6,60],v:[6,3,-4],sway:14,tw:0.6,glow:1,a:0.85},
    village:{n:70,col:['#fff6b0','#ffe66b','#ffffff'],size:8,h:[6,55],v:[5,2,-3],sway:12,tw:0.6,glow:1,a:0.8},
    lake:   {n:80,col:['#d8f6ff','#9fe8ff','#ffffff'],size:7,h:[2,30],v:[4,1,2],sway:8,tw:1,glow:1,a:0.8},
    ridge:  {n:70,col:['#ffffff','#dff4ff'],size:6,h:[4,80],v:[-14,-4,6],sway:20,tw:1,glow:1,a:0.9},
    desert: {n:80,col:['#ff9a2a','#ff5a10','#ffc04a'],size:9,h:[0,90],v:[8,22,-3],sway:10,tw:0.7,glow:1,a:0.9},
    storm:  {n:50,col:['#8a9a6a','#a08a5a','#6f7a5a'],size:11,h:[8,70],v:[-70,-6,24],sway:30,tw:0,glow:0,a:0.9},
    shadow: {n:90,col:['#d2b0ff','#a580ff','#f2e6ff'],size:11,h:[0,70],v:[0,12,0],sway:16,tw:0.8,glow:1,a:0.85}
  }
};

(()=>{
  if(!AMBIENT.on||typeof THREE==='undefined')return;
  const clouds={};let cur=null,disc=null;
  // נקודה רכה: עיגול לבן שדועך לשוליים. ציור אחד לכל האזורים
  function discTex(){if(disc)return disc;const T=64,c=document.createElement('canvas');c.width=c.height=T;const g=c.getContext('2d'),gr=g.createRadialGradient(T/2,T/2,0,T/2,T/2,T/2);
    gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.35,'rgba(255,255,255,0.8)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,T,T);return disc=new THREE.CanvasTexture(c)}
  function build(k){
    const R=AMBIENT.reg[k];let s=11;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
    const pos=new Float32Array(R.n*3),sd=new Float32Array(R.n*4),col=new Float32Array(R.n*3),c=new THREE.Color();
    for(let i=0;i<R.n;i++){sd.set([rnd(),rnd(),rnd(),rnd()],i*4);c.set(R.col[Math.floor(rnd()*R.col.length)]);col.set([c.r,c.g,c.b],i*3)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('sd',new THREE.BufferAttribute(sd,4));g.setAttribute('col',new THREE.BufferAttribute(col,3));
    const U={uT:{value:0},uC:{value:new THREE.Vector2()},uBox:{value:new THREE.Vector2()},uSin:{value:1},uCos:{value:1},uPx:{value:1},
      uH:{value:new THREE.Vector2(...R.h)},uV:{value:new THREE.Vector3(...R.v)},uSway:{value:R.sway},uTw:{value:R.tw},uSize:{value:R.size},uA:{value:R.a},uFade:{value:AMBIENT.fade},uTex:{value:discTex()}};
    const m=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:R.glow?THREE.AdditiveBlending:THREE.NormalBlending,
      vertexShader:`attribute vec4 sd;attribute vec3 col;uniform float uT,uSin,uCos,uPx,uSway,uTw,uSize,uFade;uniform vec2 uC,uBox,uH;uniform vec3 uV;varying vec3 vC;varying float vA;
        void main(){
          // מיקום במשחק (x,y) וגובה: מתחיל אקראי, זז לפי הזמן, ועוטף סביב השחקן
          vec2 q=sd.xy*uBox+uV.xz*uT+uSway*vec2(sin(uT*0.7+sd.z*40.0),cos(uT*0.5+sd.w*40.0));
          vec2 rel=mod(q-uC+uBox*0.5,uBox)-uBox*0.5;
          float span=uH.y-uH.x,h=uH.x+mod(sd.z*span+uV.y*uT+sin(uT*0.9+sd.w*30.0)*uSway*0.3,span);
          vec2 e=abs(rel)/(uBox*0.5);float f=1.0-smoothstep(1.0-uFade*2.0,1.0,max(e.x,e.y));
          float hf=smoothstep(0.0,0.15,(h-uH.x)/span)*(1.0-smoothstep(0.85,1.0,(h-uH.x)/span));
          float tw=mix(1.0,0.5+0.5*sin(uT*(1.5+sd.w*2.5)+sd.z*60.0),uTw);
          vC=col;vA=f*hf*tw;
          vec2 g=uC+rel;
          gl_Position=projectionMatrix*viewMatrix*vec4(g.x,h/uCos,g.y/uSin,1.0);   // כמו הדמויות: גובה מחולק ב-cos, y ב-sin
          gl_PointSize=uSize*uPx*(0.7+0.6*sd.w);}`,
      fragmentShader:`uniform sampler2D uTex;uniform float uA;varying vec3 vC;varying float vA;
        void main(){float d=texture2D(uTex,gl_PointCoord).a;if(d*vA<0.01)discard;gl_FragColor=vec4(vC,d*vA*uA);}`});
    const p=new THREE.Points(g,m);p.frustumCulled=false;p.renderOrder=5;p.visible=false;R3D.scene.add(p);
    return clouds[k]={p,U};
  }
  function tick(){
    if(!AMBIENT.on)return;
    const ok=R3D.on&&R3D.ready&&R3D.scene&&S&&!S.room&&(S.vil||S.wd)&&(typeof HD==='undefined'||HD.on);
    const k=ok?(S.vil?'village':(S.wd.reg||'meadow')):null;
    if(cur&&cur!==k){clouds[cur].p.visible=false;cur=null}
    if(!k||!AMBIENT.reg[k])return;
    const C=clouds[k]||build(k);cur=k;C.p.visible=true;
    const U=C.U,c=R3D.cam,hpx=R3D.r.getContext().drawingBufferHeight;
    U.uT.value=performance.now()/1000%3600;U.uC.value.set(P.x,P.y);U.uBox.value.set(AMBIENT.box.w,AMBIENT.box.h);
    U.uSin.value=SIN();U.uCos.value=COS();
    U.uPx.value=hpx/((c.top-c.bottom)/c.zoom);   // כמה פיקסלים במסך ליחידה אחת של המשחק (המצלמה אורתוגרפית)
  }
  const base=window.render3d;
  window.render3d=function(...a){try{tick()}catch(e){AMBIENT.failed=e.message;AMBIENT.on=false;for(const k in clouds)clouds[k].p.visible=false}return base.apply(this,a)};
})();
