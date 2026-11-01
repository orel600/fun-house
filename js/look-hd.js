/* מראה HD: פיילוט של שיפור ויזואלי (ניר, 1.11.2026). התוכנית והצילומים ב-docs/visual-plan.md.
   כבוי כברירת מחדל: רק עם ?look=hd בכתובת. בלי זה הקובץ לא עושה כלום, והמשחק נשאר בדיוק כמו שהוא.
   רק בכפר ובעולם הפתוח. בזירה (של אוראל) ובחדר הבונוס הכל חוזר למקור.
   לא נוגע ב-render3d.js: עוטף את render3d ואת makeActor/vPut מבחוץ, כמו perf.js.
   ארבעה שיפורים, וכל אחד אפשר להדליק לבד לבדיקה: ?look=hd&hd=light,ground (בלי hd= הכל דלוק)
   - light:  תאורה חמה של שמש ושמיים, ומיפוי צבעים של קולנוע (tone mapping). כמעט חינם
   - ground: קרקע מצוירת עם עשב, כתמים ואבנים, שלא חוזרת על עצמה. כמעט חינם
   - shadow: צללים אמיתיים ורכים מהשמש לדמויות, לבתים ולעצים. הכי יקר: עוד מעבר ציור אחד
   - air:    אובך באופק (fog) ומסגרת כהה רכה בפינות (vignette). כמעט חינם */
const HD={
  on:/[?&]look=hd\b/.test(location.search),
  light:{exposure:1.12,hemiSky:0xcfe3ff,hemiGround:0x6b5a44,hemi:1.25,sun:0xffe0b0,sunI:2.9},
  ground:{tile:520,macro:2600,grade:1.2,sat:1.22},   // tile: גודל אריח העשב בעולם. macro: כתמים גדולים שמסתירים את החזרה
  shadow:{map:1024,soft:2,dir:[-0.75,0.85,0.45],bias:-0.0004,normal:1.2,blob:0.22},   // dir: מאיפה השמש, נמוכה יותר מהמקור כדי שהצללים יהיו ארוכים. blob: הצל העגול מתחת לדמויות נשאר עדין (צל מגע)
  air:{haze:0.45,sky:0xbfd6e6,near:-0.15,far:1.5,vig:0.38}   // haze: כמה צבע שמיים באובך. near/far: לפי גובה המסך
};
HD.parts=(()=>{const m=location.search.match(/[?&]hd=([\w,]+)/),all=['light','ground','shadow','air'];
  return new Set(m?m[1].split(',').filter(p=>all.includes(p)):all)})();
HD.has=p=>HD.parts.has(p);

(()=>{
  if(!HD.on)return;
  let ready=false,here=null,hemi,sun,orig,groundMat,vig;
  // אריח קרקע: אפור בהיר עם פרטים, שהצבע של כל אזור (VIEW, W3D.regions) צובע אותו. כך כל אזור שומר על הזהות שלו
  function groundTex(){
    const T=512,c=document.createElement('canvas');c.width=c.height=T;const g=c.getContext('2d');
    let s=11;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
    g.fillStyle='rgb(206,206,206)';g.fillRect(0,0,T,T);
    // מצייר גם בצד השני של האריח, כדי שהחיבור לא ייראה
    const wrap=f=>{for(const dx of [-T,0,T])for(const dy of [-T,0,T]){g.save();g.translate(dx,dy);f();g.restore()}};
    for(let i=0;i<26;i++){const x=rnd()*T,y=rnd()*T,r=30+rnd()*80,v=rnd()<0.5?175+rnd()*20:225+rnd()*20;
      wrap(()=>{const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba('+v+','+v+','+(v-8)+',0.55)');gr.addColorStop(1,'rgba('+v+','+v+','+v+',0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)})}
    for(let i=0;i<2600;i++){const x=rnd()*T,y=rnd()*T,l=3+rnd()*6,a=-1.2+rnd()*0.5,v=rnd()<0.55?240+rnd()*15:160+rnd()*25;
      wrap(()=>{g.strokeStyle='rgba('+v+','+(v+6)+','+(v-14)+',0.7)';g.lineWidth=1+rnd()*0.8;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()})}
    for(let i=0;i<70;i++){const x=rnd()*T,y=rnd()*T,r=1.5+rnd()*3,v=150+rnd()*40;
      wrap(()=>{g.fillStyle='rgba('+(v+12)+','+v+','+(v-10)+',0.9)';g.beginPath();g.ellipse(x,y,r*1.4,r,0,0,6.28);g.fill()})}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
  }
  // כתמים גדולים ורכים (בהיר-כהה), טקסטורה קטנה נפרדת: שכבה מעל העשב שמסתירה את החזרה של האריח
  function macroTex(){
    const T=128,c=document.createElement('canvas');c.width=c.height=T;const g=c.getContext('2d'),d=g.createImageData(T,T),px=d.data;
    for(let y=0;y<T;y++)for(let x=0;x<T;x++){const u=x/T*6.283,v=y/T*6.283,i=(y*T+x)*4;
      px[i]=px[i+1]=px[i+2]=Math.round(255*(0.5+0.22*Math.sin(u+1.3*Math.sin(v))+0.18*Math.sin(2*v+0.7*Math.cos(u*2))+0.1*Math.sin(3*u+2*v)));px[i+3]=255}
    g.putImageData(d,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
  }
  // הקרקע מקבלת את הצבע מהעולם עצמו (x,z), ולא מהמשטח שזז עם המצלמה. שתי שכבות: עשב, וכתמים גדולים מעליו
  function makeGroundMat(){
    const m=new THREE.MeshLambertMaterial({map:groundTex(),color:0xffffff});
    m.onBeforeCompile=sh=>{
      sh.uniforms.hdTile={value:HD.ground.tile};sh.uniforms.hdMac={value:macroTex()};sh.uniforms.hdMacro={value:HD.ground.macro};
      sh.vertexShader='varying vec2 vHdW;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvHdW=(modelMatrix*vec4(transformed,1.0)).xz;');
      sh.fragmentShader='varying vec2 vHdW;uniform float hdTile;uniform float hdMacro;uniform sampler2D hdMac;\n'+sh.fragmentShader.replace('#include <map_fragment>',
        'vec4 hdA=texture2D(map,vHdW/hdTile);float hdB=texture2D(hdMac,vHdW/hdMacro+vec2(0.37,0.11)).r;\n'+
        'diffuseColor.rgb*=hdA.rgb*(0.78+0.44*hdB);');
    };
    return m;
  }
  function setup(){
    ready=true;const sc=R3D.scene,r=R3D.r;
    for(const o of sc.children){if(o.isHemisphereLight)hemi=o;if(o.isDirectionalLight)sun=o}
    orig={hemiSky:hemi.color.clone(),hemiGround:hemi.groundColor.clone(),hemi:hemi.intensity,sun:sun.color.clone(),sunI:sun.intensity,sunPos:sun.position.clone(),
      tm:r.toneMapping,exp:r.toneMappingExposure,gmat:R3D.ground.material,blob:R3D.marks.shadow.material.opacity};
    if(HD.has('ground'))groundMat=makeGroundMat();
    if(HD.has('shadow')){
      r.shadowMap.type=THREE.PCFShadowMap;sun.shadow.mapSize.set(HD.shadow.map,HD.shadow.map);sun.shadow.bias=HD.shadow.bias;sun.shadow.normalBias=HD.shadow.normal;sun.shadow.radius=HD.shadow.soft;
      sc.add(sun.target);R3D.ground.receiveShadow=true;
      sc.traverse(o=>{if(o.isMesh&&o!==R3D.ground&&!(o.material&&o.material.isMeshBasicMaterial))o.castShadow=true});
      // דמויות ומבנים שנוצרים אחר כך (cast) מטילים צל. מבנים גם מקבלים צל (receive), כדי שעץ יטיל צל על בית
      const cast=(x,recv)=>{x.traverse(o=>{if(o.isMesh){o.castShadow=true;if(recv)o.receiveShadow=true}});return x};
      const mk=window.makeActor;window.makeActor=function(...a){const x=mk.apply(this,a);cast(x.root);return x};
      const vp=window.vPut;window.vPut=function(...a){return cast(vp.apply(this,a),true)};
    }
    if(HD.has('air')){
      vig=document.createElement('div');vig.setAttribute('aria-hidden','true');vig.hidden=true;
      vig.style.cssText='position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse at 50% 55%,transparent 52%,rgba(10,14,24,'+HD.air.vig+') 100%)';
      R3D.cvs.after(vig);
    }
    // בכל ציור, אחרי ש-render3d קבע את הצבעים של המקום: אובך, צבע הקרקע, והשמש שעוקבת אחרי המצלמה (בשביל הצללים)
    sc.onBeforeRender=(rr,s,cam)=>{
      if(!here)return;
      const S_=SIN(),C_=COS(),tx=cam.position.x,tz=cam.position.z-2000*C_;
      if(groundMat){const col=R3D.ground.material.color,hsl={};col.getHSL(hsl);col.setHSL(hsl.h,Math.min(1,hsl.s*HD.ground.sat),hsl.l).multiplyScalar(HD.ground.grade)}
      if(s.fog){s.fog.color.copy(R3D.ground.material.color).multiplyScalar(0.9).lerp(new THREE.Color(HD.air.sky),HD.air.haze);
        const hh=H/S_*C_;s.fog.near=2000+hh*HD.air.near;s.fog.far=2000+hh*HD.air.far}
      if(HD.has('shadow')){
        const rad=0.62*Math.hypot(W,H/S_),tex=2*rad/HD.shadow.map,sx=Math.round(tx/tex)*tex,sz=Math.round(tz/tex)*tex,sh=sun.shadow.camera;
        sun.target.position.set(sx,0,sz);const d=HD.shadow.dir;sun.position.set(sx+d[0]*1400,d[1]*1400,sz+d[2]*1400);sun.target.updateMatrixWorld();
        if(sh.right!==rad){sh.left=-rad;sh.right=rad;sh.top=rad;sh.bottom=-rad;sh.near=10;sh.far=4000;sh.updateProjectionMatrix()}
      }
    };
  }
  // נכנסים לכפר או לעולם: מדליקים. יוצאים לזירה: מחזירים הכל למקור
  function apply(on){
    here=on;const r=R3D.r,sc=R3D.scene,L=HD.light;
    if(HD.has('light')){
      hemi.color.set(on?L.hemiSky:orig.hemiSky);hemi.groundColor.set(on?L.hemiGround:orig.hemiGround);hemi.intensity=on?L.hemi*VIEW.light:orig.hemi;
      sun.color.set(on?L.sun:orig.sun);sun.intensity=on?L.sunI*VIEW.light:orig.sunI;
      r.toneMapping=on?THREE.ACESFilmicToneMapping:orig.tm;r.toneMappingExposure=on?L.exposure:orig.exp;
    }
    if(groundMat)R3D.ground.material=on?groundMat:orig.gmat;
    if(HD.has('shadow')){r.shadowMap.enabled=true;sun.castShadow=on;R3D.marks.shadow.material.opacity=on?HD.shadow.blob:orig.blob;if(!on){sun.position.copy(orig.sunPos);sun.target.position.set(0,0,0);sun.target.updateMatrixWorld()}}
    if(HD.has('air')){sc.fog=on?new THREE.Fog(HD.air.sky,1,2):null;vig.hidden=!on}
  }
  const base=window.render3d;
  window.render3d=function(...a){
    if(R3D.on&&R3D.ready){if(!ready)setup();const want=!!(S&&(S.vil||S.wd)&&!S.room);if(want!==here)apply(want);if(vig)vig.hidden=!here}
    else if(vig)vig.hidden=true;
    return base.apply(this,a);
  };
})();
