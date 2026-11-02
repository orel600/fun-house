/* מראה: שיפור ויזואלי בכפר ובעולם (ניר, 1.11.2026, "עולם חי בשלבים"). התוכנית, השלבים והצילומים ב-docs/visual-plan.md.
   שלב 1 דלוק לכולם: תאורה, קרקע מצוירת ואובך (STAGE). רק בכפר ובעולם הפתוח, ורק בתלת-ממד.
   בזירה (של אוראל) ובחדר הבונוס הכל חוזר למקור. אוראל רוצה גם בזירה? מרחיבים את התנאי want בסוף הקובץ.
   לא נוגע ב-render3d.js: עוטף את render3d ואת makeActor/vPut מבחוץ, כמו perf.js.
   בכתובת: ?look=classic מכבה הכל (כמו לפני). ?look=hd מוסיף את מה שעוד בניסוי (צללים). ?hd=light,ground בוחר בדיוק מה דולק.
   - light:  תאורה חמה של שמש ושמיים, ומיפוי צבעים של קולנוע (tone mapping). כמעט חינם
   - ground: קרקע מצוירת עם עשב, כתמים ואבנים, שלא חוזרת על עצמה. כמעט חינם
   - air:    אובך באופק (fog) ומסגרת כהה רכה בפינות (vignette). כמעט חינם
   - shadow: צללים רכים מהשמש (שלב 2). רק דמויות ומבנים מטילים צל, והקרקע והמבנים מקבלים. מפת הצללים מצוירת פעם בכמה פריימים,
             ומתרכזת מחדש רק כשהמצלמה זזה רחוק. נדלק לבד, ונכבה לבד (ונזכר) אם הטלפון איטי איתם בשניות הראשונות.
             ⚙️ הגדרות ← צללים: בחירה של השחקן ('zm-shadow') מנצחת את האוטומטי */
const HD={
  on:!/[?&]look=classic\b/.test(location.search),
  stage:['light','ground','air','shadow'],   // מה דלוק לכולם. שלב חדש שמוכן = שם נוסף כאן
  lab:[],   // בניסוי: רק עם ?look=hd
  light:{exposure:1.12,hemiSky:0xcfe3ff,hemiGround:0x6b5a44,hemi:1.25,sun:0xffe0b0,sunI:2.9},
  ground:{tile:520,macro:2600,grade:1.2,sat:1.22},   // tile: גודל אריח העשב בעולם. macro: כתמים גדולים שמסתירים את החזרה
  shadow:{map:1024,soft:2,dir:[-0.75,0.85,0.45],bias:-0.0004,normal:1.2,blob:0.22,   // dir: מאיפה השמש, נמוכה יותר מהמקור כדי שהצללים יהיו ארוכים. blob: הצל העגול מתחת לדמויות נשאר עדין (צל מגע)
    every:2,step:96,   // every: מפת הצללים מצוירת פעם ב-every פריימים (הדמויות זזות). step: כמה פיקסלים המצלמה זזה לפני שהמפה מתרכזת מחדש
    cast:['castle','forge','mill','mine','market','tent','site','gate'],   // מה מטיל צל מלבד הדמויות: מבני הכפר (VIL3D.models), הפיגום והשערים. לא עצים, סלעים ועשב
    minFps:40,warm:1.5,secs:2.5,key:'zm-shadow',slow:'zm-shadow-slow'},   // בפתיחה: אחרי warm שניות מודדים secs שניות, ומתחת ל-minFps מכבים ונזכרים (slow). key: בחירה של השחקן
  air:{haze:0.45,sky:0xbfd6e6,near:-0.15,far:1.5,vig:0.38}   // haze: כמה צבע שמיים באובך. near/far: לפי גובה המסך
};
HD.parts=(()=>{const q=location.search,m=q.match(/[?&]hd=([\w,]+)/),all=[...HD.stage,...HD.lab];
  return new Set(m?m[1].split(',').filter(p=>all.includes(p)):/[?&]look=hd\b/.test(q)?all:HD.stage)})();
HD.has=p=>HD.parts.has(p);
// צללים: דלוקים? בחירה של השחקן מנצחת. בלעדיה: דלוק, אלא אם הטלפון כבר נמדד כאיטי איתם
HD.sh={user:null,slow:false};
try{HD.sh.user=localStorage.getItem(HD.shadow.key);HD.sh.slow=localStorage.getItem(HD.shadow.slow)==='1'}catch(e){}
HD.shadowOn=()=>HD.on&&HD.has('shadow')&&(HD.sh.user?HD.sh.user==='1':!HD.sh.slow);
function setShadow(on){HD.sh.user=on?'1':'0';try{localStorage.setItem(HD.shadow.key,HD.sh.user)}catch(e){}showShadow()}
function showShadow(){for(const b of document.querySelectorAll('[data-shadow]'))b.setAttribute('aria-pressed',String((b.dataset.shadow==='1')===HD.shadowOn()));
  const row=document.querySelector('.shd');if(row)row.hidden=!(HD.on&&HD.has('shadow'))}
for(const b of document.querySelectorAll('[data-shadow]'))b.onclick=()=>{setShadow(b.dataset.shadow==='1');if(typeof sfx==='function')sfx('ui')};
showShadow();

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
      r.shadowMap.type=THREE.PCFShadowMap;r.shadowMap.autoUpdate=false;sun.shadow.mapSize.set(HD.shadow.map,HD.shadow.map);sun.shadow.bias=HD.shadow.bias;sun.shadow.normalBias=HD.shadow.normal;sun.shadow.radius=HD.shadow.soft;
      sc.add(sun.target);R3D.ground.receiveShadow=true;
      // רק דמויות ומבנים מטילים צל. מבנים גם מקבלים צל (receive), כדי שבית יטיל צל על בית
      const cast=(x,recv)=>{x.traverse(o=>{if(o.isMesh){o.castShadow=true;if(recv)o.receiveShadow=true}});return x};
      if(R3D.player)cast(R3D.player.root);if(R3D.pet&&R3D.pet.root)cast(R3D.pet.root);for(const a of R3D.actors.values())cast(a.root);
      for(const k in R3D.crowd)if(R3D.crowd[k])for(const p of R3D.crowd[k])for(const m of p)m.castShadow=true;   // הקהל: אויבים בלי אנימציה מלאה
      const big=new Set(HD.shadow.cast.map(k=>(VIL3D.models[k]||VIL3D[k]||{}).model).filter(Boolean));
      const mk=window.makeActor;window.makeActor=function(...a){const x=mk.apply(this,a);cast(x.root);return x};
      const vp=window.vPut;window.vPut=function(...a){const m=vp.apply(this,a);if(big.has(a[0])){cast(m,true);HD.dirty=true}return m};
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
      if(sun.castShadow){
        // השמש עוקבת אחרי המצלמה בקפיצות של step, כך שמפת הצללים לא צריכה להתרכז מחדש בכל צעד
        const St=HD.shadow.step,rad=0.62*Math.hypot(W,H/S_)+St,sx=Math.round(tx/St)*St,sz=Math.round(tz/St)*St,sh=sun.shadow.camera;
        if(sun.target.position.x!==sx||sun.target.position.z!==sz){sun.target.position.set(sx,0,sz);const d=HD.shadow.dir;sun.position.set(sx+d[0]*1400,d[1]*1400,sz+d[2]*1400);sun.target.updateMatrixWorld();HD.dirty=true}
        if(sh.right!==rad){sh.left=-rad;sh.right=rad;sh.top=rad;sh.bottom=-rad;sh.near=10;sh.far=4000;sh.updateProjectionMatrix();HD.dirty=true}
        if(HD.dirty||++HD.shN%HD.shadow.every===0){rr.shadowMap.needsUpdate=true;HD.dirty=false}
      }
    };
  }
  // מדליקים או מכבים את הצללים (כניסה למקום, בחירה בהגדרות, או טלפון איטי)
  function shade(on){
    if(sun.castShadow===on&&R3D.r.shadowMap.enabled)return;
    R3D.r.shadowMap.enabled=true;sun.castShadow=on;R3D.marks.shadow.material.opacity=on?HD.shadow.blob:orig.blob;HD.dirty=true;
    if(!on){sun.position.copy(orig.sunPos);sun.target.position.set(0,0,0);sun.target.updateMatrixWorld()}
  }
  // מדידה אחת בפתיחה, כמו GFX_AUTO: איטי עם צללים? מכבים, נזכרים, ונותנים ל-GFX_AUTO למדוד מחדש בלעדיהם (שלא יעבור לדו-ממד בגללם)
  function measure(now){
    const m=HD.fm||(HD.fm={t:0,n:0,last:0}),gap=m.last?(now-m.last)/1000:0;m.last=now;
    if(HD.sh.user||HD.measured||R3D.drawEvery||S.mode!=='play'||!gap||gap>0.5)return;
    m.t+=gap;if(m.t<HD.shadow.warm)return;m.n++;if(m.t<HD.shadow.warm+HD.shadow.secs)return;
    HD.measured=true;HD.fps=Math.round(m.n/HD.shadow.secs);
    if(HD.fps<HD.shadow.minFps){HD.sh.slow=true;try{localStorage.setItem(HD.shadow.slow,'1')}catch(e){}shade(false);showShadow();if(!R3D.measured)R3D.fm=null}
  }
  HD.shN=0;
  // נכנסים לכפר או לעולם: מדליקים. יוצאים לזירה: מחזירים הכל למקור
  function apply(on){
    here=on;const r=R3D.r,sc=R3D.scene,L=HD.light;
    if(HD.has('light')){
      hemi.color.set(on?L.hemiSky:orig.hemiSky);hemi.groundColor.set(on?L.hemiGround:orig.hemiGround);hemi.intensity=on?L.hemi*VIEW.light:orig.hemi;
      sun.color.set(on?L.sun:orig.sun);sun.intensity=on?L.sunI*VIEW.light:orig.sunI;
      r.toneMapping=on?THREE.ACESFilmicToneMapping:orig.tm;r.toneMappingExposure=on?L.exposure:orig.exp;
    }
    if(groundMat)R3D.ground.material=on?groundMat:orig.gmat;
    if(HD.has('shadow'))shade(on&&HD.shadowOn());
    if(HD.has('air')){sc.fog=on?new THREE.Fog(HD.air.sky,1,2):null;vig.hidden=!on}
  }
  const base=window.render3d;
  window.render3d=function(...a){
    if(R3D.on&&R3D.ready){if(!ready)setup();const want=!!(S&&(S.vil||S.wd)&&!S.room);if(want!==here)apply(want);if(vig)vig.hidden=!here;
      if(here&&groundMat)R3D.ground.material=(typeof GROUND!=='undefined'&&GROUND.mat())||groundMat;   // בעולם: המפה המצוירת (ground.js). בכפר: הקרקע של שלב 1
      if(here&&HD.has('shadow')){shade(HD.shadowOn());if(sun.castShadow)measure(performance.now())}}   // צללים: לפי ההגדרה, ומדידה אחת בפתיחה
    else if(vig)vig.hidden=true;
    return base.apply(this,a);
  };
})();
