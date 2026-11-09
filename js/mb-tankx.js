/* משחקי השאול: ניסוי של הטנק החדש של אוראל (Tripo, גוף TankKK של ARI), כבוי כברירת מחדל. MAX ל-BOB, 9.11.2026.
   ?tankx=1 (או MBTANKX.on=true תוך כדי משחק) מחליף את הגוף של הטנק בגוף החדש, עם הפטיש ביד ימין: לבוטים, וגם לך כשאתה משחק טנק.
   הטנק הנוכחי (ולך: הדמות שלך) הוא ברירת המחדל, וגם הגיבוי כל עוד הקובץ של הגוף או של הפטיש לא נטען.
   רק מראה: הטווח, ה-hitbox, רגע הנזק וההבהוב לא משתנים (מחזירים מראה, ולא נוגעים ביחידה).
   - אורך העצמות (ARI): כל ערוץ מיקום באנימציה מוכפל ביחס בין העצמה בגוף החדש לזו של הברברי של KayKit. ערוצי סיבוב לא משתנים.
   - ריצה: צעד מוקטן (RETARGET.dampen, TANKX.gait) ומהירות האנימציה לפי הטבלה speed, כדי שהרגל על הרצפה תזוז כמו הקרקע (בלי החלקה).
   - גובה: הגוף החדש מוצג בגובה size מהטנק הישן, בתנוחת העמידה (נמדד פעם אחת כשהגוף נטען).
   - קריאות על הרצפה הכהה: הבהרה וקו אור בשוליים (rim), לפי look. זוהר קבוע בסדקים כבוי (emK 0), והבהוב פגיעה על כל הגוף ולא רק על הסדקים.
   - השוואה: ?txdiag=512|1024|neutral (diags), לצילומים של QUINN ו-ARI באותה מצלמה.
   - הפטיש: על handslotr, בתנוחה לפי סוג האנימציה (carry, מ-ARI), ובגודל hammer.s.
   מחיקה: הקובץ והשורה ב-index.html */
const MBTANKX={
  on:/[?&]tankx=1(&|$)/.test(location.search),
  kit:'tank',model:'tankX',ref:'barbarian',
  hammer:{prop:'w_item_tankXHammer',bone:'handslotr',pos:[0,0,0],rot:[0,-1,0,0],s:0.9},
  shield:false,   // הגוף החדש מחזיק פטיש בשתי ידיים: בלי המגן של הטנק הרגיל
  // תנוחת הפטיש ביד לפי מה שמנגן (ARI, #586, נפתרה לכל אנימציה): idle רק ל-Idle_*, run לריצה, וכל השאר (תקיפה, פגיעה, מוות) בתנוחה הרגילה
  carry:{idle:{pos:[0,0,0],rot:[-0.5998,0.4684,0.6176,0.1985]},run:{pos:[0,0,0],rot:[-0.6369,0.2983,0.6826,0.1987]},attack:{pos:[0,0,0],rot:[0,-1,0,0]}},
  gait:true,      // צעד מוקטן בריצה לפי TANKX.gait (js/retarget-tracks.js). false: האנימציה כמו שהיא
  speed:{Running_B:1.2},   // מהירות האנימציה לכל אנימציה (1: כמו המקור). 1.2: הרגל על הרצפה זזה כ-0.83 ממהירות הקרקע (הטנק הישן 0.49, 1 = בלי החלקה)
  size:1.15,      // הגובה המוצג בעמידה, ביחס לטנק הישן (ה-hitbox לא משתנה)
  // הרגליים על הרצפה: בעמידה של הברברי הגוף הזה ריחף כ-4.5 יחידות (הירכיים גבוהות פי 1.48). 1: יורד בכל הפער שנמדד, 0: כמו קודם
  ground:1,
  // אוראל דחה את המראה (9.11: "ג'לי"). עכשיו הטקסטורה כמו שהיא, עד שהמספרים של ARI מגיעים:
  // emK 0: בלי זוהר קבוע בסדקים. rimK 0: קו האור בשוליים צבע את כל הגוף, כי מהמצלמה של המשחק (מלמעלה) רוב המשטחים בזווית. ההבהוב בפגיעה נשאר (txF בחומר)
  look:{gain:1,lift:0,rim:'#FF9A50',rimK:0,rimP:2.5,emK:0,emMax:1.2},
  // השוואה בלבד (MAX ל-BOB, 9.11, ל-QUINN ול-ARI): ?tankx=1&txdiag=512|1024|neutral, אותה מצלמה ואותו מצב.
  // 512: הגוף כמו שהוא. 1024: אותו גוף עם הטקסטורות המקוריות ב-1024 (קובץ נפרד, נטען רק עם הדגל). neutral: חומר אפור אחיד, בלי טקסטורה, בלי זוהר ובלי rim
  diag:(location.search.match(/[?&]txdiag=(512|1024|neutral)(&|$)/)||[])[1]||'',
  diags:{'512':{},'1024':{tex:'js/tankx-diag/tx1024.js'},neutral:{color:'#A09A90',rough:0.85,look:{gain:1,lift:0,rimK:0,emK:0}}},
  minLen:1e-4,    // עצמה שאורכה בברברי קטן מזה: בלי תיקון
  comp:null,      // אם ARI מספקת פונקציה משלה: (clip, tmpl, ref) => clip. אחרת tankxComp למטה
  stat:{looks:0,actors:0,rebuilt:0,clips:0,tracks:0,gait:0,fallback:0,fac:null,h:null,mats:0,player:0,diag:0,tex:0}
};
// הגובה בפיקסלים של המשחק בתנוחת העמידה (Idle_A), של הגוף בלבד (בלי חפצים), כשהמראה בגובה L.h
function tankxStand(L,clip,o){
  const t=R3D.tmpl[L.model],r=THREE.SkeletonUtils.clone(t);r.scale.setScalar(L.h/COSB()/t.userData.h);
  const mx=new THREE.AnimationMixer(r);if(clip){mx.clipAction(clip).play();mx.update(0)}
  r.updateMatrixWorld(true);const b=new THREE.Box3(),q=new THREE.Box3();
  r.traverse(o=>{if(o.isSkinnedMesh){o.computeBoundingBox();q.copy(o.boundingBox).applyMatrix4(o.matrixWorld);b.union(q)}});
  // o.lo: הנקודה הנמוכה של הגוף ביחידות של המודל (0 = הרצפה). נמדד לפי כל קודקוד בתנוחה, ולא לפי התיבה
  if(o){let lo=1e9;const v=new THREE.Vector3();r.traverse(m=>{if(m.isSkinnedMesh){const pa=m.geometry.attributes.position;for(let i=0;i<pa.count;i+=2){v.fromBufferAttribute(pa,i);m.applyBoneTransform(i,v);v.applyMatrix4(m.matrixWorld);if(v.y<lo)lo=v.y}}});o.lo=lo/r.scale.y}
  mx.stopAllAction();return (b.max.y-b.min.y)*COSB();
}
// על הרצפה: הגוף יורד במה שנמדד בעמידה (ground: כמה מהפער, 1 = כולו). דמות שחוזרת מהמאגר כבר הורדה
function tankxGround(a){
  const X=MBTANKX,d=X.ground&&X._lo>0?X._lo*X.ground:0;
  for(const c of a.root.children){const u=c.userData;if(u.txY0==null)u.txY0=c.position.y;c.position.y=u.txY0-d}
}
// המראה: כמו הטנק הרגיל, עם הגוף החדש והפטיש, בגובה שנמדד. null אם משהו עוד לא מוכן (ואז הטנק הרגיל)
function tankxLook(){
  const X=MBTANKX,B=typeof LOOK3D!=='undefined'&&LOOK3D.mb_tank;if(!B)return null;
  const hm=X.hammer&&X.hammer.prop,okM=m3dNeed(X.model),okH=!hm||m3dNeed(hm);
  if(!okM||!okH||!R3D.tmpl[X.model]){X.stat.fallback++;return null}
  const hasH=!!hm&&!!R3D.props[hm],t=R3D.tmpl[X.model];
  if(X._L&&X._L.base===B&&X._t===t&&X._h===hasH&&X._sz===X.size&&X._hs===X.hammer.s)return X._L;
  if(X._t!==t){const idle=B.anim.idle,o=tankxStand(B,R3D.clips[idle]),g={},n=tankxStand(Object.assign({},B,{model:X.model}),tankxClip(idle),g);X._k=o/n;X._lo=g.lo;X.stat.h={old:Math.round(o),raw:Math.round(n),lo:+g.lo.toFixed(4)}}
  const props={};if(X.shield&&B.props&&B.props.shield)props.shield=B.props.shield;
  if(hasH)props.hammer=Object.assign({},X.hammer);
  X._h=hasH;X._t=t;X._sz=X.size;X._hs=X.hammer.s;X.stat.looks++;X.stat.h.now=Math.round(X.stat.h.old*X.size);
  return X._L=Object.assign({},B,{model:X.model,h:+(B.h*X._k*X.size).toFixed(1),props,base:B,tx:1});
}
// אורך כל עצמה במנוחה (המיקום המקומי שלה), לפי שם
function tankxRest(t){const m={};t.traverse(o=>{if(o.isBone)m[o.name]=o.position.length()});return m}
// היחס לכל עצמה: אורך בגוף החדש / אורך בברברי. מחושב פעם אחת לכל תבנית
function tankxFactors(){
  const X=MBTANKX,t=R3D.tmpl[X.model],k=R3D.tmpl[X.ref];if(!t||!k)return null;
  if(X._f&&X._ft===t)return X._f;
  const a=tankxRest(t),b=tankxRest(k),f={};let lo=Infinity,hi=0,n=0;
  for(const nm in a)if(nm in b&&b[nm]>=X.minLen){f[nm]=a[nm]/b[nm];lo=Math.min(lo,f[nm]);hi=Math.max(hi,f[nm]);n++}
  X._f=f;X._ft=t;X._c={};X._rq=null;
  X.stat.fac={n,lo:+lo.toFixed(3),hi:+hi.toFixed(3),hips:f.hips!=null?+f.hips.toFixed(3):null};
  return f;
}
// האנימציה עם התיקון. ערוץ שלא השתנה נשאר אותו אובייקט, ואנימציה בלי ערוצי מיקום חוזרת כמו שהיא
function tankxComp(c,f){
  let n=0;const tr=c.tracks.map(t=>{
    const i=t.name.lastIndexOf('.');if(t.name.slice(i+1)!=='position')return t;
    const k=f[t.name.slice(0,i)];if(k==null||Math.abs(k-1)<1e-6)return t;
    const q=t.clone();for(let j=0;j<q.values.length;j++)q.values[j]*=k;n++;return q});
  if(!n)return c;
  MBTANKX.stat.tracks+=n;return new THREE.AnimationClip(c.name,c.duration,tr);
}
// מהירות: אותה אנימציה בזמן קצר יותר (k>1) או ארוך יותר, כך שכל מי שמנגן אותה (גם עם timeScale משלו) מקבל את המהירות החדשה
function tankxFast(c,k){return new THREE.AnimationClip(c.name,c.duration/k,c.tracks.map(t=>{const q=t.clone();for(let i=0;i<q.times.length;i++)q.times[i]/=k;return q}))}
function tankxClip(name){
  const X=MBTANKX,c=R3D.clips[name];if(!c)return null;
  const f=tankxFactors();if(!f)return c;
  if(name in X._c)return X._c[name];
  X.stat.clips++;const nm=name.split('@')[0];
  let k=typeof X.comp==='function'?X.comp(c,R3D.tmpl[X.model],R3D.tmpl[X.ref]):tankxComp(c,f);
  // ריצה: צעד קטן יותר (ARI, RETARGET.dampen): לגוף הזה רגליים ארוכות ביחס לגובה, ובאותן זוויות הרגל עפה רחוק ומחליקה. רק לאנימציות שבטבלה TANKX.gait
  const G=X.gait&&typeof TANKX!=='undefined'&&TANKX.gait&&TANKX.gait[nm];
  if(G&&typeof RETARGET!=='undefined'){if(!X._rq){X._rq={};R3D.tmpl[X.model].traverse(o=>{if(o.isBone)X._rq[o.name]=o.quaternion.toArray()})}k=RETARGET.dampen(k,X._rq,G.k,G.bones);X.stat.gait++}
  const sp=X.speed&&X.speed[nm];if(sp&&sp!==1)k=tankxFast(k,sp);
  return X._c[name]=k;
}
// סוג האנימציה בשביל הפטיש: אנימציה חד-פעמית (תקיפה, פגיעה, מוות, הופעה) גוברת, ואז הבסיס. רק Idle_* ו-Running/Walking מקבלים תנוחה משלהם
const tankxFam=(one,base)=>{const n=(one||base||'').split('@')[0];return /^Idle_/.test(n)?'idle':/^(Running|Walking)_/.test(n)?'run':'attack'};
// תנוחת הפטיש לפי מה שמנגן עכשיו. בבוט החפץ נקרא hammer, אצלך sword (כדי שיוצג כשהנשק ביד הוא תקיפה מקרוב)
function tankxCarry(a){
  const C=MBTANKX.carry,m=a.props&&(a.props.hammer||a.L.tx&&a.props.sword);if(!C||!m)return;
  const one=a.one&&a.one.isRunning()?a.one.getClip().name:'';
  const fam=tankxFam(one,a.base),p=C[fam]||C.attack;a.fam=fam;
  if(!p||a.carry===p)return;a.carry=p;
  if(p.pos)m.position.fromArray(p.pos);if(p.rot)m.quaternion.fromArray(p.rot);m.scale.setScalar((p.s||1)*(MBTANKX.hammer.s||1));
}
// החומר: הבהרה, קו אור בשוליים, זוהר הסדקים עד התקרה, והבהוב פגיעה אחיד (המפה של הזוהר לא מכפילה אותו)
const MBTX_U={txGain:{value:1},txLift:{value:0},txRim:{value:new THREE.Color()},txRimK:{value:0},txRimP:{value:2},txEmK:{value:1},txEmMax:{value:1.2}};
function tankxUniforms(){const X=MBTANKX,V=Object.assign({},X.look,(X.diags[X.diag]||{}).look),U=MBTX_U;U.txGain.value=V.gain;U.txLift.value=V.lift;U.txRim.value.set(V.rim);U.txRimK.value=V.rimK;U.txRimP.value=V.rimP;U.txEmK.value=V.emK;U.txEmMax.value=V.emMax}
function tankxMat(m){
  if(m.userData.txF)return;m.userData.txF={value:0};MBTANKX.stat.mats++;
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,MBTX_U,{txF:m.userData.txF});
    sh.fragmentShader='uniform float txGain,txLift,txRimK,txRimP,txEmK,txEmMax,txF;uniform vec3 txRim;\n'+sh.fragmentShader
      .replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=diffuseColor.rgb*txGain+txLift;')
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{vec3 txV=isOrthographic?vec3(0.0,0.0,1.0):normalize(vViewPosition);float txR=pow(1.0-clamp(dot(normal,txV),0.0,1.0),txRimP);\ntotalEmissiveRadiance=mix(min(totalEmissiveRadiance*txEmK,vec3(txEmMax))+txRim*txR*txRimK,emissive,txF);}');
  };
  m.customProgramCacheKey=()=>'mbTankX';m.needsUpdate=true;
}
// השוואה (txdiag): הטקסטורות ב-1024, נטענות פעם אחת מהקובץ הנפרד. null עד שהן מוכנות
function tankxTex1024(){
  const X=MBTANKX;if(X._t1)return X._t1.ready?X._t1:null;X._t1={};
  const s=document.createElement('script');s.src=X.diags['1024'].tex;
  s.onload=()=>{const T=window.TANKX_TEX1024;if(!T)return;const ld=new THREE.TextureLoader();let n=0;
    const fin=t=>{t.flipY=false;t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;if(++n===2)X._t1.ready=1};
    X._t1.map=ld.load(T.map,fin);X._t1.em=ld.load(T.em,fin)};
  document.head.appendChild(s);return null;
}
// השוואה: על הגוף בלבד (לא על הפטיש). פעם אחת לכל דמות, כשמה שצריך מוכן. a.txDiag: מה הוחל, ורוחב הטקסטורה בפועל (לבדיקה)
function tankxDiag(a){
  const X=MBTANKX,D=X.diags[X.diag];if(!D||a.txDiag)return;
  const body=[];a.root.traverse(o=>{if(o.isSkinnedMesh&&!body.includes(o.material))body.push(o.material)});
  if(X.diag==='1024'){const T=tankxTex1024();if(!T)return;
    for(const m of body){const o=m.map,c=t=>{if(o){t.wrapS=o.wrapS;t.wrapT=o.wrapT;t.anisotropy=o.anisotropy;t.minFilter=o.minFilter;t.magFilter=o.magFilter}return t};
      if(m.map)m.map=c(T.map);if(m.emissiveMap)m.emissiveMap=c(T.em);m.needsUpdate=true}}
  if(X.diag==='neutral')for(const m of body){m.map=null;m.emissiveMap=null;m.color.set(D.color);if('roughness' in m){m.roughness=D.rough;m.metalness=0}m.needsUpdate=true}
  const w=body[0]&&body[0].map&&body[0].map.image?body[0].map.image.width:0;
  a.txDiag={mode:X.diag,tex:w,mats:body.length};X.stat.diag++;X.stat.tex=w;
}
// המראה שלך כשאתה משחק טנק: הגוף החדש, הפטיש במקום הנשק מקרוב, והאנימציות של הטנק
function tankxPlayer(H){
  const X=MBTANKX,T=tankxLook();if(!T)return H;
  if(X._P&&X._Pb===H&&X._Pt===T)return X._P;
  // tier: רק סימן, כדי שהמפתח במאגר (lookKey) יהיה שונה מזה של הבוט. אחרת דמות של בוט שהשתחררה חוזרת אליך עם הפטיש בחריץ הלא נכון, ומוסתרת
  const props={};if(T.props.hammer)props.sword=Object.assign({},T.props.hammer,{tier:'txMe'});
  const anim=Object.assign({},H.anim,{idle:T.anim.idle,run:T.anim.run,die:T.anim.die,sword:MBMOVE.atk[X.kit]||H.anim.sword});
  X._Pb=H;X._Pt=T;X.stat.player++;
  return X._P=Object.assign({},H,{model:T.model,h:T.h,foot:T.foot,props,anim,tx:1,ck:(H.ck||'')+'|tx'});
}
(function(){
  if(typeof lookOf!=='function'||typeof mb3dUnit!=='function')return;
  const isTank=e=>!!e&&S.mb&&e!==P&&e.k==='hero'&&e.kit===MBTANKX.kit;
  const meTank=()=>MBTANKX.on&&S.mb&&typeof MB!=='undefined'&&MB&&MB.me&&MB.me.kit===MBTANKX.kit;
  const bl=lookOf;lookOf=function(e){if(MBTANKX.on&&isTank(e)){const L=tankxLook();if(L)return L}return bl.apply(this,arguments)};
  const bh=heroLook;heroLook=function(){const H=bh.apply(this,arguments);return meTank()&&H?tankxPlayer(H):H};
  // האנימציות של הגוף החדש עוברות דרך התיקון. כל המקומות שמנגנים (loop, once) עוברים דרך act
  const ba=act;act=function(a,name){if(a&&a.L&&a.L.tx){const c=tankxClip(name);return c?a.mixer.clipAction(c):null}return ba.apply(this,arguments)};
  // החומר החדש לכל דמות בגוף הזה (גם לפטיש). דמות שחוזרת מהמאגר כבר מוכנה
  const bm=makeActor;makeActor=function(L){const a=bm.apply(this,arguments);if(L&&L.tx){tankxUniforms();for(const m of a.mats)tankxMat(m);tankxGround(a)}return a};
  const bf=setFlash;setFlash=function(a,k){bf.apply(this,arguments);if(a&&a.L&&a.L.tx)for(const m of a.mats)if(m.userData.txF)m.userData.txF.value=k>0?1:0};
  // שריון, דרגה וציור הציוד מחפשים חלקים של KayKit בשם. לגוף הזה אין כאלה, ולא מלבישים עליו
  for(const n of ['armor3d','rankArmor3d','gear3dParts'])if(typeof window[n]==='function'){const b=window[n];window[n]=function(a){if(a&&a.L&&a.L.tx)return;return b.apply(this,arguments)}}
  // מתג תוך כדי משחק, או גוף שסיים להיטען: הדמות נבנית מחדש (עם אותו מצב תקיפה, כדי שלא תצא תקיפה מיותרת)
  const bu=mb3dUnit;mb3dUnit=function(e,dt){
    if(isTank(e)){const a=R3D.actors.get(e),L=lookOf(e);
      if(a&&L&&a.key!==lookKey(L)&&!a.dieT){const pv=a.prev;freeActor(a);R3D.actors.delete(e);MBTANKX.stat.rebuilt++;
        const n=makeActor(L);n.root.scale.setScalar(L.h/COSB()/R3D.tmpl[L.model].userData.h);n.sc0=n.root.scale.x;n.prev=pv;R3D.actors.set(e,n)}}
    const r=bu.apply(this,arguments);
    if(isTank(e)){const a=R3D.actors.get(e);if(a&&a.L&&a.L.tx){if(!a.txSeen){a.txSeen=1;MBTANKX.stat.actors++}tankxCarry(a);tankxDiag(a)}}
    return r};
  const bp=syncPlayer;syncPlayer=function(){if(MBTANKX.on)tankxUniforms();const r=bp.apply(this,arguments),a=R3D.player;if(a&&a.L&&a.L.tx){tankxCarry(a);tankxDiag(a)}return r};
})();
