/* משחקי השאול: ניסוי של הטנק החדש של אוראל (Tripo, גוף TankKK של ARI), כבוי כברירת מחדל. MAX ל-BOB, 9.11.2026.
   ?tankx=1 (או MBTANKX.on=true תוך כדי משחק) מחליף את הגוף של הטנק בגוף החדש, עם הפטיש ביד ימין: לבוטים, וגם לך כשאתה משחק טנק.
   הטנק הנוכחי (ולך: הדמות שלך) הוא ברירת המחדל, וגם הגיבוי כל עוד הקובץ של הגוף או של הפטיש לא נטען.
   רק מראה: הטווח, ה-hitbox, רגע הנזק וההבהוב לא משתנים (מחזירים מראה, ולא נוגעים ביחידה).
   - אורך העצמות (ARI): כל ערוץ מיקום באנימציה מוכפל ביחס בין העצמה בגוף החדש לזו של הברברי של KayKit. ערוצי סיבוב לא משתנים.
   - ריצה: צעד מוקטן (RETARGET.dampen, TANKX.gait) ומהירות האנימציה לפי הטבלה speed, כדי שהרגל על הרצפה תזוז כמו הקרקע (בלי החלקה).
   - גובה: הגוף החדש מוצג בגובה size מהטנק הישן, בתנוחת העמידה (נמדד פעם אחת כשהגוף נטען).
   - קריאות על הרצפה הכהה: הבהרה וקו אור בשוליים (rim), לפי look. זוהר קבוע בסדקים כבוי (emK 0), והבהוב פגיעה על כל הגוף ולא רק על הסדקים.
   - השוואה: ?txdiag=neutral (diags), הצורה בלי צבע, לצילומים של QUINN ו-ARI באותה מצלמה.
   - הפטיש: על handslotr, בתנוחה לפי סוג האנימציה (carry, מ-ARI), ובגודל hammer.s.
   מחיקה: הקובץ והשורה ב-index.html */
const MBTANKX={
  on:/[?&]tankx=1(&|$)/.test(location.search),
  kit:'tank',model:'tankX',ref:'barbarian',
  hammer:{prop:'w_item_tankXHammer',bone:'handslotr',pos:[0,0,0],rot:[0,-1,0,0],s:0.9},
  shield:false,   // הגוף החדש מחזיק פטיש בשתי ידיים: בלי המגן של הטנק הרגיל
  // תנוחת הפטיש ביד לפי מה שמנגן (ARI, #586, נפתרה לכל אנימציה): idle רק ל-Idle_*, run לריצה, וכל השאר (תקיפה, פגיעה, מוות) בתנוחה הרגילה.
  // s: גודל לתנוחה. בעמידה הראש של הפטיש מורם ליד הגוף ונראה ענק (MAX, 9.11), אז 0.8
  carry:{idle:{pos:[0,0,0],rot:[-0.5998,0.4684,0.6176,0.1985],s:0.8},run:{pos:[0,0,0],rot:[-0.6369,0.2983,0.6826,0.1987]},attack:{pos:[0,0,0],rot:[0,-1,0,0]}},
  gait:true,      // צעד מוקטן בריצה לפי TANKX.gait (js/retarget-tracks.js). false: האנימציה כמו שהיא
  speed:{Running_B:1.2},   // מהירות האנימציה לכל אנימציה (1: כמו המקור). 1.2: הרגל על הרצפה זזה כ-0.83 ממהירות הקרקע (הטנק הישן 0.49, 1 = בלי החלקה)
  size:1.25,      // הגובה המוצג בעמידה, ביחס לטנק הישן (ה-hitbox לא משתנה). ARI, 9.11: הגוף צר (41 פיקסלים מול 56 של הברברי עם המגן), אז 1.25 כדי שהשטח על הרצפה יהיה דומה
  // הרגליים על הרצפה: בעמידה של הברברי הגוף הזה ריחף כ-4.5 יחידות (הירכיים גבוהות פי 1.48). 1: יורד בכל הפער שנמדד, 0: כמו קודם
  ground:1,
  // בלי ריחוף באנימציות האלה (tankxClamp): במוות הגוף עלה 28 יחידות באוויר באמצע הנפילה (הטנק הישן 3.6), כי גוף ארוך מסתובב סביב ירכיים גבוהות.
  // clampTo: כמה מעל הרצפה מותר, ביחידות של המודל (0.04 = כ-3.5 יחידות במשחק, כמו הקפיצה הקטנה של הטנק הישן)
  // ריצה (QUINN, 9.11): בפריים הנמוך הקרסול ירד 4.7 יחידות מתחת לגובה העמידה (הטנק הישן 0.6). lo: כמה מתחת לרצפה מותר, ואם יותר, הירכיים עולות רק בפריימים האלה
  // hi: כמה מעל הרצפה מותר (0.04 = כ-3.5 יחידות במשחק), ואם יותר, הירכיים יורדות. ביחידות של המודל (0.01 = כ-1 יחידה במשחק)
  clamp:{Death_A:{hi:0.04},Running_B:{lo:0.004}},
  // הפטיש בין תנוחות (QUINN, 9.11: הגודל קפץ בין עמידה לריצה, ופעם בתקיפה רצופה): מעבר רך בזמן blend (שניות, קבוע זמן; 95% אחרי פי 3),
  // ואחרי תקיפה הפטיש נשאר בתנוחת התקיפה hold שניות, כדי שבקרב רצוף (תקיפה כל שנייה) הוא לא יקפוץ בין תקיפה לעמידה
  carryBlend:0.05,carryHold:1.2,
  // אוראל דחה את המראה (9.11: "ג'לי"). המספרים של ARI, נמדדו במשחק (art/tankx-look): הצבע כבר בגוף (אטלס צבע לכל משולש, אובסידיאן וזהב), אז החומר לא נוגע בו.
  // emK/emMax 0: בלי זוהר קבוע. rimK 0: קו האור בשוליים צבע את כל הגוף, כי מהמצלמה של המשחק (מלמעלה) רוב המשטחים בזווית. ההבהוב בפגיעה נשאר (txF בחומר)
  // השיפוץ (overhaul/preview בלבד, BOB 10.11): gain 1.25 (ARI: גם עובד). נמדד: ΔL* מול הרצפה 17.4 ב-1, 20.4 ב-1.25 (כמו הצייד), 23 ב-1.5
  look:{gain:1.25,lift:0,rim:'#FF9A50',rimK:0,rimP:2.5,emK:0,emMax:0},
  // השוואה בלבד (MAX ל-BOB, 9.11, ל-QUINN ול-ARI): ?tankx=1&txdiag=neutral, אותה מצלמה ואותו מצב. neutral: חומר אפור אחיד, בלי טקסטורה (הצורה בלבד).
  // 512 ו-1024 של הטקסטורה הישנה הושוו (ARI, 9.11: בכל גודל, גם 1024, האיים הקטנים שלה מתמצעים לחום-כתום) והוחלפו באטלס, אז אין להם מצב כאן
  diag:(location.search.match(/[?&]txdiag=(neutral)(&|$)/)||[])[1]||'',
  diags:{neutral:{color:'#A09A90',rough:0.85,look:{gain:1,lift:0,rimK:0,emK:0}}},
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
  if(X._t!==t){const idle=B.anim.idle,o=tankxStand(B,R3D.clips[idle]),g={},n=tankxStand(Object.assign({},B,{model:X.model}),tankxClip(idle),g);X._k=o/n;X._lo=g.lo;X.stat.h={old:Math.round(o),raw:Math.round(n),lo:+g.lo.toFixed(4)}
    if(X.clamp)for(const c in X.clamp)if(R3D.clips[c])tankxClip(c)}   // מחושב כאן, ולא במוות הראשון (חצי מיליון קודקודים פעם אחת)
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
// בלי ריחוף באנימציה (clamp): בכל פריים של הירכיים מודדים את הנקודה הנמוכה של הגוף (אחרי ההורדה לרצפה, ground),
// ואם היא מעל הרצפה ביותר מ-clampTo, הירכיים יורדות בדיוק בהפרש. רק מורידים, לא מרימים. רק ציור, פעם אחת לכל אנימציה
function tankxClamp(c,C){
  const X=MBTANKX,tr=c.tracks.find(q=>q.name==='hips.position');if(!tr)return c;
  const r=THREE.SkeletonUtils.clone(R3D.tmpl[X.model]);r.scale.setScalar(1);
  const mx=new THREE.AnimationMixer(r),ac=mx.clipAction(c);ac.setLoop(THREE.LoopOnce,1);ac.clampWhenFinished=true;ac.play();
  const sk=[];let hips=null;r.traverse(o=>{if(o.isSkinnedMesh)sk.push(o);if(o.isBone&&o.name==='hips')hips=o});if(!hips)return c;
  const v=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),inv=new THREE.Matrix4(),q=tr.clone(),g=(X._lo||0)*(X.ground||0);let n=0,top=0;
  for(let i=0;i<tr.times.length;i++){ac.time=tr.times[i];mx.update(0);r.updateMatrixWorld(true);
    let lo=1e9;for(const m of sk){const pa=m.geometry.attributes.position;for(let j=0;j<pa.count;j+=4){v.fromBufferAttribute(pa,j);m.applyBoneTransform(j,v);v.applyMatrix4(m.matrixWorld);if(v.y<lo)lo=v.y}}
    const y=lo-g;let d=0;if(C.hi!=null&&y>C.hi)d=y-C.hi;else if(C.lo!=null&&y<-C.lo)d=y+C.lo;if(!d)continue;top=Math.max(top,Math.abs(d));n++;   // d>0: יורד, d<0: עולה
    inv.copy(hips.parent.matrixWorld).invert();a.set(0,0,0).applyMatrix4(inv);b.set(0,-d,0).applyMatrix4(inv);   // ירידה בעולם, ביחידות של ההורה של הירכיים
    q.values[i*3]+=b.x-a.x;q.values[i*3+1]+=b.y-a.y;q.values[i*3+2]+=b.z-a.z}
  mx.stopAllAction();(X.stat.clamp||(X.stat.clamp={}))[c.name.split('@')[0]]={keys:n,of:tr.times.length,top:+top.toFixed(4)};
  return n?new THREE.AnimationClip(c.name,c.duration,c.tracks.map(x=>x===tr?q:x)):c;
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
  if(X.clamp&&X.clamp[nm])k=tankxClamp(k,X.clamp[nm]);   // אחרי הצעד המוקטן, כי הוא משנה את הסיבובים
  const sp=X.speed&&X.speed[nm];if(sp&&sp!==1)k=tankxFast(k,sp);
  return X._c[name]=k;
}
// סוג האנימציה בשביל הפטיש: אנימציה חד-פעמית (תקיפה, פגיעה, מוות, הופעה) גוברת, ואז הבסיס. רק Idle_* ו-Running/Walking מקבלים תנוחה משלהם
const tankxFam=(one,base)=>{const n=(one||base||'').split('@')[0];return /^Idle_/.test(n)?'idle':/^(Running|Walking)_/.test(n)?'run':'attack'};
// תנוחת הפטיש לפי מה שמנגן עכשיו. בבוט החפץ נקרא hammer, אצלך sword (כדי שיוצג כשהנשק ביד הוא תקיפה מקרוב)
// dt: בלולאת המשחק בלבד. בלי dt (בדיקה, צילום) התנוחה מתחלפת מיד, כמו קודם. a.fam: מה שמנגן באמת, a.cfam: התנוחה שהפטיש הולך אליה
const MBTX_V=new THREE.Vector3(),MBTX_Q=new THREE.Quaternion();
function tankxCarry(a,dt){
  const X=MBTANKX,C=X.carry,m=a.props&&(a.props.hammer||a.L.tx&&a.props.sword);if(!C||!m)return;
  const one=a.one&&a.one.isRunning()?a.one.getClip().name:'';
  let fam=tankxFam(one,a.base);a.fam=fam;a.txT=(a.txT||0)+(dt||0);
  if(fam==='attack')a.txAtk=a.txT;else if(dt&&a.txAtk!=null&&a.txT-a.txAtk<X.carryHold)fam='attack';
  const p=C[fam]||C.attack;if(!p)return;a.cfam=fam;
  const ts=(p.s||1)*(X.hammer.s||1),k=dt&&X.carryBlend>0&&a.carry?1-Math.exp(-dt/X.carryBlend):1;a.carry=p;   // p.s: גודל לתנוחה, כפול הגודל הכללי
  if(k>=1){if(p.pos)m.position.fromArray(p.pos);if(p.rot)m.quaternion.fromArray(p.rot);m.scale.setScalar(ts);return}
  if(p.pos)m.position.lerp(MBTX_V.fromArray(p.pos),k);if(p.rot)m.quaternion.slerp(MBTX_Q.fromArray(p.rot),k);m.scale.setScalar(m.scale.x+(ts-m.scale.x)*k);
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
// השוואה: על הגוף בלבד (לא על הפטיש), פעם אחת לכל דמות. a.txDiag: מה הוחל, ורוחב הטקסטורה בפועל (לבדיקה)
function tankxDiag(a){
  const X=MBTANKX,D=X.diags[X.diag];if(!D||a.txDiag)return;
  const body=[];a.root.traverse(o=>{if(o.isSkinnedMesh&&!body.includes(o.material))body.push(o.material)});
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
    if(isTank(e)){const a=R3D.actors.get(e);if(a&&a.L&&a.L.tx){if(!a.txSeen){a.txSeen=1;MBTANKX.stat.actors++}tankxCarry(a,dt);tankxDiag(a)}}
    return r};
  const bp=syncPlayer;syncPlayer=function(){if(MBTANKX.on)tankxUniforms();const r=bp.apply(this,arguments),a=R3D.player;if(a&&a.L&&a.L.tx){tankxCarry(a,arguments[0]);tankxDiag(a)}return r};
})();
