/* אופי ויזואלי: אווירה לכל אזור, שעה ביום, ואור סביב הגיבור (ניר, 2.11.2026: "צריך יותר אופי ופחות גנרי").
   מה שכבר היה (look-hd.js: תאורה, קרקע, אובך, צללים. juice.js: הבזק, עצירה, רעידה וניצוצות במכה) נשאר. כאן ארבעה דברים מעליו:
   - mood: לכל אזור שמש, שמיים, אובך וחשיכת פינות משלו. מדבר חם וכתום, אגם ירקרק וערפילי, רכס קר ובהיר, סערה סגולה וכהה
   - tod:  שעה ביום לפי השעון האמיתי של הטלפון: בוקר ורדרד, צהריים, שקיעה זהובה, ולילה כחול (לא חשוך מדי).
           בלילה הפנסים והאור של הגיבור בולטים, וזה בדיוק הסיפור: שישה פנסים מול החושך
   - lamp: כתם אור חם על הקרקע סביב הגיבור, כאילו הוא נושא פנס. עדין ביום, חזק בלילה. נותן לעין נקודה לחזור אליה
   - rim:  קו אור דק בקצוות של הגיבור (fresnel בשיידר), כדי שיבלוט מהקרקע ומהאויבים. רק על הגיבור
   איפה: הכפר והעולם, בתלת-ממד. הזירה, חדר הבונוס והמובה (של אוראל) לא משתנים.
   כיבוי: VFX.on=false, או להוציא שם מ-VFX.parts. בכתובת: ?vfx=off, ?vfx=mood,lamp (בדיוק מה שדולק), ?tod=night|dawn|day|dusk (שעה קבועה, לצילומים).
   ?look=classic מכבה גם את זה. עוטף את render3d מבחוץ, כמו look-hd.js: לא נוגע ב-render3d.js.
   עלות: mood ו-tod חינם (רק צבעים). lamp: ציור אחד. rim: כמה פקודות בשיידר של הגיבור בלבד */
const VFX={
  on:!/[?&](vfx=off|look=classic)\b/.test(location.search),
  parts:['mood','tod','lamp','rim'],
  // לכל מקום: sun צבע השמש ו-sunK כמה חזקה, sky/gnd צבע השמיים והקרקע באור הסביבה ו-hemiK, fog צבע האובך ו-fogK כמה ממנו, exp חשיפה,
  // vig צבע הפינות ו-vigA כמה חשוכות. מקום שלא כתוב: meadow
  mood:{
    village:{sun:0xffd9a8,sunK:1.0,sky:0xd8e4ff,gnd:0x7a6046,hemiK:1.0,fog:0xf2dcb8,fogK:0.25,exp:1.0,vig:'40,24,10',vigA:0.33},   // חמים, ביתי
    meadow: {sun:0xfff0c8,sunK:1.0,sky:0xcfe6ff,gnd:0x5f6a3a,hemiK:1.0,fog:0xd8ecd0,fogK:0.2,exp:1.0,vig:'14,30,12',vigA:0.27},    // שמש רכה, ירוק
    lake:   {sun:0xd8f0f0,sunK:0.82,sky:0xbfe8e6,gnd:0x2e4a48,hemiK:1.05,fog:0xa8d0cc,fogK:0.55,exp:0.98,vig:'8,30,34',vigA:0.45},  // ערפל ירקרק, אור מפוזר
    ridge:  {sun:0xf0f6ff,sunK:1.08,sky:0xe6f2ff,gnd:0x8a9cb4,hemiK:1.08,fog:0xe8f2ff,fogK:0.5,exp:1.04,vig:'30,46,70',vigA:0.36},  // קר ובוהק, שלג
    desert: {sun:0xffb070,sunK:1.12,sky:0xffd8a8,gnd:0x9a5a2a,hemiK:0.95,fog:0xffc890,fogK:0.5,exp:1.03,vig:'70,24,0',vigA:0.45},    // חום כתום, אוויר רועד
    storm:  {sun:0xb8a8e8,sunK:0.7,sky:0xa8a0d0,gnd:0x3a3250,hemiK:0.9,fog:0x6e6890,fogK:0.55,exp:0.92,vig:'20,10,40',vigA:0.60},    // סגול כהה, לפני ברק
    shadow: {sun:0x9a80d0,sunK:0.6,sky:0x8070b0,gnd:0x201830,hemiK:0.85,fog:0x3a2a58,fogK:0.6,exp:0.9,vig:'12,4,24',vigA:0.60}       // כמעט לילה תמידי
  },
  // שעה ביום: נקודות על השעון (0 עד 24), וביניהן מעבר רך. tint נצבע על השמש והשמיים, k על החוזק, exp על החשיפה, lamp כמה האור של הגיבור חזק, vig כמה הפינות חשוכות
  tod:[
    {h:0,   tint:0x8ea8ff,k:0.55,exp:0.86,lamp:1,  vig:1.7},   // לילה: כחול, אבל רואים הכל
    {h:5,   tint:0x8ea8ff,k:0.55,exp:0.86,lamp:1,  vig:1.7},
    {h:6.5, tint:0xffc0b0,k:0.82,exp:0.95,lamp:0.5,vig:1.25},  // שחר ורדרד
    {h:8.5, tint:0xffffff,k:1,   exp:1,   lamp:0.45,vig:1},    // יום
    {h:16,  tint:0xffffff,k:1,   exp:1,   lamp:0.45,vig:1},
    {h:18.3,tint:0xffb468,k:0.9, exp:0.98,lamp:0.5,vig:1.3},   // שקיעה זהובה
    {h:20,  tint:0xb090e0,k:0.68,exp:0.9, lamp:0.85,vig:1.55}, // בין ערביים סגול
    {h:21.5,tint:0x8ea8ff,k:0.55,exp:0.86,lamp:1,  vig:1.7},
    {h:24,  tint:0x8ea8ff,k:0.55,exp:0.86,lamp:1,  vig:1.7}],
  fixed:{night:1,dawn:6.6,day:12,dusk:18.3},   // ?tod=<שם>: שעה קבועה
  lamp:{r:170,col:'255,206,130',a:0.6},       // r: רדיוס הכתם (פיקסלים של המשחק). a: שקיפות בשיא (בלילה). חיבורי (additive), כך שהוא מאיר ולא צובע
  rim:{col:0xffe2a8,k:1.2,pow:2.0},           // צבע הקו, חוזק, וכמה הוא דק (גבוה = דק יותר)
  // לילה בהיר יותר לפי מקום (ניר אישר, 9.11.2026, docs/concept-night-village.md): בשיא הלילה k, exp ו-vig מחליפים את הערכים של VFX.tod,
  // ו-gnd הוא "אור ירח" בצבע הקרקע. בשחר ובשקיעה המעבר הדרגתי. רק בכפר: בעולם החושך הוא חלק מהסיפור
  night:{village:{k:0.72,exp:0.96,vig:1.15,gnd:0x9a8466}},
  // כתמי אור חמים על הקרקע בכפר בלילה (כמו lamp של הגיבור, חיבורי): מתחת לכל פנס רחוב, וגדולים יותר בציוני הדרך. ביום כבויים
  pools:{col:'255,200,120',lamp:{r:90,a:0.35},mark:{r:190,a:0.4,dy:40,at:['gate','center','forge','market']}}
};
VFX.parts=(()=>{const m=location.search.match(/[?&]vfx=([\w,]+)/);return new Set(m&&m[1]!=='off'?m[1].split(',').filter(p=>VFX.parts.includes(p)):VFX.parts)})();
VFX.has=p=>VFX.on&&VFX.parts.has(p);
// השעה עכשיו (0 עד 24): מהשעון, או קבועה מהכתובת
VFX.hour=()=>{const m=location.search.match(/[?&]tod=(\w+)/);if(m&&VFX.fixed[m[1]]!=null)return VFX.fixed[m[1]];const d=new Date();return d.getHours()+d.getMinutes()/60};

(()=>{
  if(!VFX.on||typeof THREE==='undefined')return;
  let sun,hemi,lamp,vig,base=null,set=null,hooked=null,rimAt=0;
  const cA=new THREE.Color(),cB=new THREE.Color(),cT=new THREE.Color();
  // נקודת השעה: מעבר רך בין שתי נקודות על השעון
  function todNow(at){return VFX.todAt(VFX.hour(),at)}
  VFX.todAt=(h,at)=>{const T=VFX.tod;let i=0;while(i<T.length-2&&T[i+1].h<=h)i++;const a=T[i],b=T[i+1],f=Math.min(1,Math.max(0,(h-a.h)/((b.h-a.h)||1)));
    const s=f*f*(3-2*f),L=(x,y)=>x+(y-x)*s;cA.set(a.tint).lerp(cB.set(b.tint),s);const D={tint:cA.clone(),k:L(a.k,b.k),exp:L(a.exp,b.exp),lamp:L(a.lamp,b.lamp),vig:L(a.vig,b.vig),n:0},N=VFX.night[at];
    // n: כמה לילה עכשיו (0 ביום, 1 בשיא הלילה), לפי חוזק השמש
    D.n=Math.min(1,Math.max(0,(1-D.k)/(1-T[0].k)));if(N){const z=T[0];D.k+=D.n*(N.k-z.k);D.exp+=D.n*(N.exp-z.exp);D.vig+=D.n*(N.vig-z.vig)}return D};
  function where(){if(!S||S.room||(typeof aLookHere==='function'&&aLookHere()))return null;return S.vil?'village':S.wd?(VFX.mood[S.wd.reg]?S.wd.reg:'meadow'):null}
  // כתם אור: עיגול רך על הקרקע, חיבורי
  function makeLamp(){
    const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);
    gr.addColorStop(0,'rgba('+VFX.lamp.col+',1)');gr.addColorStop(0.45,'rgba('+VFX.lamp.col+',0.45)');gr.addColorStop(1,'rgba('+VFX.lamp.col+',0)');g.fillStyle=gr;g.fillRect(0,0,128,128);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));
    m.rotation.x=-Math.PI/2;m.renderOrder=1;m.frustumCulled=false;m.visible=false;R3D.scene.add(m);return m;
  }
  // כתמי האור בכפר (VFX.pools): נבנים פעם אחת, מרקם אחד לכולם. n: כמה לילה (0 = מוסתרים)
  let pools=null;
  VFX.poolsSync=n=>{
    if(!pools){if(!(n>0.02)||typeof VILLAGE==='undefined'||!R3D.scene)return;const Q=VFX.pools,c=document.createElement('canvas');c.width=c.height=128;
      const g=c.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba('+Q.col+',1)');gr.addColorStop(0.5,'rgba('+Q.col+',0.4)');gr.addColorStop(1,'rgba('+Q.col+',0)');g.fillStyle=gr;g.fillRect(0,0,128,128);
      const tex=new THREE.CanvasTexture(c),geo=new THREE.PlaneGeometry(2,2),s=SIN();pools=[];
      const add=(x,y,P)=>{const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));
        m.rotation.x=-Math.PI/2;m.position.set(x,0.9,y/s);m.scale.set(P.r,P.r/s,1);m.renderOrder=1;m.visible=false;m.userData.a=P.a;R3D.scene.add(m);pools.push(m)};
      for(const d of VILLAGE.props)if(d.k==='lamp')add(d.x,d.y,Q.lamp);
      for(const k of Q.mark.at){const b=k==='gate'?VILLAGE.gate:VILLAGE.b[k];if(b)add(b.x,b.y+(k==='gate'?0:Q.mark.dy),Q.mark)}}
    if(!pools)return;const on=n>0.02;for(const m of pools){m.visible=on;m.material.opacity=on?m.userData.a*n:0}};
  VFX.poolList=()=>pools||[];
  // קו אור בקצוות: fresnel. במצלמה אורתוגרפית הכיוון למצלמה קבוע (0,0,1) במרחב המבט
  function rimOn(m){
    if(m.userData.vfxRim||!m.isMeshLambertMaterial&&!m.isMeshStandardMaterial&&!m.isMeshPhongMaterial)return;
    m.userData.vfxRim=1;const R=VFX.rim,prev=m.onBeforeCompile;
    m.onBeforeCompile=(sh,rr)=>{if(prev)prev.call(m,sh,rr);
      sh.uniforms.vfxRimC={value:new THREE.Color(R.col).multiplyScalar(R.k)};
      sh.fragmentShader='uniform vec3 vfxRimC;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\nvec3 vfxV=isOrthographic?vec3(0.0,0.0,1.0):normalize(vViewPosition);\n'+
        'totalEmissiveRadiance+=vfxRimC*pow(1.0-clamp(abs(dot(normalize(normal),vfxV)),0.0,1.0),'+R.pow.toFixed(2)+');')};
    const ck=m.customProgramCacheKey;m.customProgramCacheKey=()=>(ck?ck.call(m):'')+'|vfxRim';m.needsUpdate=true;
  }
  // הצבעים של look-hd/render3d הם הבסיס: אם מישהו שינה אותם (כניסה למקום), הם הבסיס החדש. אחרת חוזרים לבסיס, כדי לא להכפיל כל פריים
  function grab(r){const now={sun:sun.color.getHex(),sunI:sun.intensity,sky:hemi.color.getHex(),gnd:hemi.groundColor.getHex(),hemiI:hemi.intensity,exp:r.toneMappingExposure};
    if(!set||now.sun!==set.sun||now.sunI!==set.sunI||now.sky!==set.sky||now.gnd!==set.gnd||now.hemiI!==set.hemiI||now.exp!==set.exp)base=now}
  function hook(rr,sc){
    const at=where();
    if(!at){if(base&&set&&sun.color.getHex()===set.sun&&sun.intensity===set.sunI&&rr.toneMappingExposure===set.exp){sun.color.setHex(base.sun);sun.intensity=base.sunI;hemi.color.setHex(base.sky);hemi.groundColor.setHex(base.gnd);hemi.intensity=base.hemiI;rr.toneMappingExposure=base.exp}
      set=null;base=null;if(lamp)lamp.visible=false;VFX.poolsSync(0);if(vig)vig.hidden=true;return}
    grab(rr);
    const M=VFX.has('mood')?VFX.mood[at]:null,D=VFX.has('tod')?todNow(at):null,N=D&&VFX.night[at],tk=D?D.k:1,tint=D?D.tint:cT.set(0xffffff);
    cA.setHex(base.sun);if(M)cA.lerp(cB.set(M.sun),0.85);cA.multiply(tint);sun.color.copy(cA);sun.intensity=base.sunI*(M?M.sunK:1)*tk;
    cA.setHex(base.sky);if(M)cA.lerp(cB.set(M.sky),0.7);cA.multiply(tint);hemi.color.copy(cA);
    cA.setHex(base.gnd);if(M)cA.lerp(cB.set(M.gnd),0.6);if(N&&N.gnd!=null)cA.lerp(cB.set(N.gnd),D.n);hemi.groundColor.copy(cA);hemi.intensity=base.hemiI*(M?M.hemiK:1)*(0.35+0.65*tk);
    rr.toneMappingExposure=base.exp*(M?M.exp:1)*(D?D.exp:1);
    if(sc.fog&&M)sc.fog.color.lerp(cB.set(M.fog),M.fogK).multiply(tint);else if(sc.fog&&D)sc.fog.color.multiply(tint);
    if(sc.background&&sc.background.isColor&&D)sc.background.multiply(tint);
    set={sun:sun.color.getHex(),sunI:sun.intensity,sky:hemi.color.getHex(),gnd:hemi.groundColor.getHex(),hemiI:hemi.intensity,exp:rr.toneMappingExposure};
    // אור הגיבור
    if(VFX.has('lamp')){if(!lamp)lamp=makeLamp();const k=D?D.lamp:0.45,r=VFX.lamp.r,s=SIN();
      lamp.visible=true;lamp.position.set(P.x,0.8,P.y/s);lamp.scale.set(r,r/s,1);lamp.material.opacity=VFX.lamp.a*k}
    // כתמי האור בכפר: בלילה בלבד
    VFX.poolsSync(at==='village'&&D?D.n:0);
    // פינות בצבע המקום
    if(M&&vig){vig.hidden=false;const a=Math.min(0.7,M.vigA*(D?D.vig:1));vig.style.background='radial-gradient(ellipse at 50% 55%,transparent 55%,rgba('+M.vig+','+a.toFixed(3)+') 100%)'}
    // קו האור על הגיבור: בודקים פעם בחצי שנייה, כי ציוד חדש מחליף חומרים
    if(VFX.has('rim')&&R3D.player&&rr.info.render.frame-rimAt>30){rimAt=rr.info.render.frame;R3D.player.root.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))rimOn(m)})}
  }
  const inner=window.render3d;
  window.render3d=function(...a){
    if(R3D.on&&R3D.ready){
      if(!sun){for(const o of R3D.scene.children){if(o.isHemisphereLight)hemi=o;if(o.isDirectionalLight)sun=o}
        if(VFX.has('mood')){vig=document.createElement('div');vig.setAttribute('aria-hidden','true');vig.hidden=true;vig.style.cssText='position:fixed;inset:0;z-index:0;pointer-events:none';R3D.cvs.after(vig)}}
      // נכנסים אחרי look-hd.js, שמגדיר את onBeforeRender רק בציור הראשון
      const sc=R3D.scene;if(sun&&hemi&&sc.onBeforeRender!==hooked){const prev=sc.onBeforeRender;hooked=function(rr,s,cam,...x){if(prev)prev.call(this,rr,s,cam,...x);hook(rr,s)};sc.onBeforeRender=hooked}
    }else if(vig)vig.hidden=true;
    return inner.apply(this,a);
  };
})();
