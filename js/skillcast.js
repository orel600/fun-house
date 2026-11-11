/* הגיבור מטיל כל סקיל (ניר, 7.11.2026: "כשעושים סקיל, הדמות לא עושה אנימציה... גם יהיה נחמד אם מתחתיה יהיה עיגול קסם").
   בכל שימוש בסקיל (wskUse ב-wskill.js, sigUse ב-sigskill.js): תנועה קצרה של פלג הגוף העליון (render3d.js), ועיגול רונות
   בצבע סוג הנזק מתחת לגיבור, שמופיע, מסתובב לאט ונעלם. רק מראה: הנזק, הקירור והתזמון של הסקילים לא משתנים.
   התנועה לפי סוג הסקיל (kind), לא סקיל-סקיל, אז סקיל חדש מקבל אותה לבד. 'shot': משיכת קשת כשיש קשת ביד, אחרת יריית קסם.
   בעולם ובכפר בלבד. הזירה והמובה של אוראל לא משתנים (להדליק שם: SKCAST.where).
   חיבור: skCast(id) מ-wskUse ומ-sigUse, skcClip(L) ב-syncPlayer (render3d.js), skcDraw() ב-render.js (רק בדו-ממד), skcZoom() ב-camZoom (camera.js).
   האפקטים מ-VFX3D (vfx3d.js). מתחת לרונות: מעגל קסם מספריית הגיליונות לפי סוג הנזק (SKCAST.sprite, 7.11), כשכבת בסיס עדינה */
const SKCAST={
  dur:0.42,        // שניות של התנועה (פלג הגוף העליון, הרגליים ממשיכות לרוץ)
  // בלי הכנה (ניר, 7.11): הגיבור קופץ ישר לתנוחת המכה. כמה מדלגים מכל אנימציה: HERO_SKIP ב-render3d.js. הסקיל יורה מיד בלחיצה
  where:()=>!!S&&(S.wd||S.vil)&&!S.room&&!S.mb,
  // kind (מהספר wskbook.js, ומסקיל החתימה sigskill.js) ← אנימציה. בלי kind: 'zap' לברק, 'ground' לאדמה, 'ring' לשאר
  anim:{
    dash:'Melee_1H_Attack_Chop', aura:'Melee_2H_Attack_Spin', guard:'Melee_Block', trap:'Throw',
    zone:'shot', chain:'shot', zap:'shot', ring:'Ranged_Magic_Shoot',
    pull:'Ranged_Magic_Summon', summon:'Ranged_Magic_Summon', storm:'Ranged_Magic_Raise', rain:'shotUp',
    meteor:'Ranged_Magic_Raise', vortex:'Ranged_Magic_Spellcasting',
    petrify:'Melee_2H_Attack_Chop', ground:'Melee_2H_Attack_Chop', nova:'Melee_2H_Attack_Chop', blade:'Melee_2H_Attack_Chop'
  },
  shot:{bow:'Ranged_Bow_Release',other:'Ranged_Magic_Shoot'},
  shotUp:{bow:'Ranged_Bow_Release_Up',other:'Ranged_Magic_Raise'},   // גשם חצים: ירייה לשמיים עם קשת, ידיים למעלה בלי קשת
  // קליפים נוספים מהענף של אוראל (overhaul/heroes, PR #604; ניר 11.11: "לעבור על מה שאוראל בונה ולהשתמש"): Throw, Ranged_Bow_Release_Up,
  // Ranged_Magic_Raise. לא בליבה: נטענים ברקע בכניסה לעולם (m3dWorld ב-m3d.js), ובכפר בהטלה הראשונה. עד שהם מוכנים: הקליפ הישן (old)
  pre:['anim_mbx_gen','anim_mbx_ranged'],
  old:{trap:'Melee_1H_Attack_Chop',storm:'Ranged_Magic_Summon',rain:'Ranged_Magic_Summon',meteor:'Ranged_Magic_Spellcasting'},
  fallback:'Ranged_Magic_Spellcasting',
  // עיגול הרונות (ניר, 7.11: "שהעיגול קסם יהיה יותר משמעותי ודרמטי"). הרגע החזק הוא הלחיצה עצמה, בלי הכנה: העיגול נכנס בקפיצה (pop) עם קצת
  // מעבר מעל הגודל, הבזק על הקרקע, גל הדף שמתרחב וניצוצות שעולים. שתי טבעות שמסתובבות הפוך: טבעת סימנים בחוץ (band) ועיגול הרונות בפנים (in).
  // מדרגה לפי משקל הסקיל, כדי שסקילים חוזרים לא ימלאו את המסך: רגיל (normal), וגדול (big) לסקיל החתימה, ל-bigKinds ולקירור של bigCd ומעלה.
  // life: כמה זמן הכל נשאר לכל היותר (הבוט מחכה לזה). r: רדיוס החיצוני. pop: שניות של הקפיצה, over: כמה מעבר. fade: חלק מהזמן בסוף לדעיכה
  rune:{life:1.15,a:1,fade:0.4,inner:0.74,spin:[1.6,-2.6]},
  bigKinds:['meteor','storm','nova','rain','blade'],bigCd:12,
  tier:{
    normal:{life:0.9, r:108,pop:0.14,over:1.14,hdr:1.8,flash:{r:0.9,life:0.2,a:0.28,hdr:1.3},wave:{r:1.7,life:0.45,w:0.2,a:0.6},motes:12,pillar:null,shake:0,zoom:0,light:4},
    big:   {life:1.15,r:140,pop:0.16,over:1.18,hdr:2.6,flash:{r:1.0,life:0.26,a:0.35,hdr:1.6}, wave:{r:2.1,life:0.6,w:0.24,a:0.6},  wave2:{r:2.4,life:0.75,w:0.3,a:0.3},motes:26,
            pillar:{r:20,h:360,life:0.6,hdr:1.4},shake:5,zoom:0.045,zoomT:0.4,light:7}
  },
  // בקרב (ניר, 7.11, מהסרטון: "העיגול הצהוב כיסה חצי מסך והסתיר אויבים"): כשיש אויב חי עד near מהגיבור ברגע ההטלה, העיגול קטן (r) ושקוף יותר (a),
  // פחות ניצוצות (motes), וגל ההדף נעצר gap לפני האויב הקרוב (ואם האויב כבר בתוך העיגול, אין גל). עמוד האור והרעד של סקיל גדול נשארים
  combat:{near:250,r:0.6,a:0.5,motes:0.5,light:0.6,gap:18},
  // הבזק בידיים ברגע ההטלה, בצבע סוג הנזק. h: הגובה של הידיים (פיקסלים של המשחק)
  flash:{h:34,size:46,size2:80,life:[0.16,0.22],spark:10,light:6,lightT:0.3},
  motes:{up:150,grav:90,drag:0.6,spd:28,size:9,size2:3,life:[0.55,1.0]},   // ניצוצות שעולים מהעיגול, בצבע סוג הנזק
  // העיגול הפנימי לפי סוג הנזק (7.11, סבב 2): מעגל קסם מספריית האפקטים (docs/fx.md) במקום המשולש הכפול המצויר, כי שניהם יחד נראו עמוסים בצילום.
  // טבעת הסימנים החיצונית, ההבזק, הגל, הניצוצות ועמוד האור נשארים.
  // אין גרסה ירוקה בחבילה: סוג בלי שורה כאן (צמח, רעל) נשאר רק עם הרונות המצוירות. scale: גודל הפריים ביחס לקוטר העיגול, a: שקיפות (כפול שקיפות הקרב)
  sprite:{ids:{fire:'wcirc_fire',ice:'wcirc_ice',lightning:'wcirc_lightning',earth:'wcirc_earth',water:'wcirc_water',physical:'wcirc_phys'},scale:1.22,a:0.9,fps:24,y:1.2}   // y: גובה מעל הקרקע (בתלת-ממד)
};
const skcStat={casts:0,runes:0,big:0,spr:null};   // בשביל הבוט. spr: מעגל הבסיס של ההטלה האחרונה
let skcRune=null;                   // {t,col,T,d3,d3b}: העיגול הנוכחי (גם לדו-ממד). T: המדרגה (SKCAST.tier)
const skcO={glow:{n:1,raw:1,col:'',col2:'',hdr:2,size:46,size2:80,life:null},spark:{n:10,col:'#ffffff',col2:'',spd:160,up:120,grav:-300,life:[0.2,0.4]},
  mote:{n:0,col:'#ffffff',col2:'',spread:0,spd:0,up:0,grav:0,drag:0,size:0,size2:0,life:null},
  d:{life:Infinity,col:'',a:0,hdr:1,p:0},fl:{life:0,col:'',fade:0.9,a:1,hdr:2},wv:{life:0,grow:[0,0],col:'',w:0.3,fade:0.7,a:1},pl:{life:0,hdr:3}};   // אובייקטים קבועים, בלי הקצאה בכל הטלה
const skcRuneObj={t:0,col:'',T:null,d3:null,d3b:null,big:false,k:1,a:1,fight:false,spr:null};   // k, a: גודל ושקיפות (קטנים בקרב, SKCAST.combat)
function skcKind(D){return D.kind||(D.range?'zap':D.dt==='earth'?'ground':'ring')}
const skcBig=D=>!!(D.sig||SKCAST.bigKinds.includes(skcKind(D))||D.cd>=SKCAST.bigCd);
// האויב החי הקרוב לגיבור, עד SKCAST.combat.near: המרחק עד הקצה שלו, או null כשאין קרב
function skcNear(){let m=null;if(typeof enemies==='undefined')return m;const N=SKCAST.combat.near;
  for(const e of enemies){if(e.dead||e.dummy)continue;const d=Math.hypot(e.x-P.x,e.y-P.y)-(e.r||0);if(d<N&&(m===null||d<m))m=Math.max(0,d)}return m}
function skcFree(){if(skcSpr.m)skcSpr.m.visible=false;if(!skcRune||typeof VFX3D==='undefined')return;VFX3D.free(skcRune.d3);VFX3D.free(skcRune.d3b)}
/* מעגל הבסיס בתלת-ממד: מישור אחד על הקרקע, מתחת למדבקות של הרונות (renderOrder), עם טקסטורה לכל סוג נזק שזזה בין הפריימים של הגיליון.
   אחד לכל המשחק, נבנה בפעם הראשונה. בדו-ממד מצויר בקנבס בתוך skcDraw */
const skcSpr={m:null,tex:{}};
function skcSprMesh(id){
  // מ-file:// הדפדפן לא נותן להעלות תמונה לתלת-ממד (cross-origin), והטקסטורה יוצאת ריקה. שם נשאר המשולש הכפול המצויר. ב-Vercel (https) זה עובד
  if(location.protocol==='file:'||typeof THREE==='undefined'||!R3D.ready||!R3D.scene||typeof fxImg!=='function')return null;
  const im=fxImg(id),D=im&&FXDATA[id];if(!D)return null;
  let t=skcSpr.tex[id];if(!t){t=skcSpr.tex[id]=new THREE.Texture(im);t.colorSpace=THREE.SRGBColorSpace;t.repeat.set(1/D.c,1/Math.ceil(D.n/D.c));t.needsUpdate=true}
  let m=skcSpr.m;if(!m){m=skcSpr.m=new THREE.Mesh(new THREE.PlaneGeometry(2,2).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,fog:false}));m.frustumCulled=false;m.renderOrder=1}
  if(m.parent!==R3D.scene)R3D.scene.add(m);
  m.material.map=t;m.material.needsUpdate=true;m.visible=true;m.userData.id=id;return m;
}
// הפריים של הגיליון לפי הזמן מאז ההטלה
const skcSprFrame=(D,t)=>Math.floor(t*SKCAST.sprite.fps)%D.n;
function skCast(id){
  if(!SKCAST.where())return;
  const D=SKILLS.list[id];if(!D)return;
  P.skCast={n:(P.skCast?P.skCast.n:0)+1,k:skcKind(D),at:performance.now()};skcStat.casts++;
  const col=typeof skCol==='function'?skCol(id):dtCol(D.dt),R=SKCAST.rune,big=skcBig(D),T=SKCAST.tier[big?'big':'normal'];
  skcFree();   // עיגול אחד בכל פעם
  const near=skcNear(),C=SKCAST.combat,fight=near!==null,K=fight?C.r:1,A=fight?C.a:1,rr=T.r*K;   // בקרב: קטן ושקוף יותר
  skcRune=skcRuneObj;skcRune.spr=SKCAST.sprite.ids[D.dt]||null;skcStat.spr=skcRune.spr;skcRune.t=0;skcRune.col=col;skcRune.T=T;skcRune.big=big;skcRune.k=K;skcRune.a=A;skcRune.fight=fight;skcRune.near=near;skcRune.d3=skcRune.d3b=null;skcStat.runes++;if(big)skcStat.big++;if(fight)skcStat.fight=(skcStat.fight||0)+1;
  if(T.shake&&S)S.shake=Math.max(S.shake||0,T.shake);   // רעד קטן (render.js, וכבוי ב"הפחתת תנועה")
  if(typeof VFX3D==='undefined'||!R3D.on)return;
  const sm=skcRune.spr&&skcSprMesh(skcRune.spr);   // מעגל הבסיס לפי סוג הנזק. כשיש אותו, הוא העיגול הפנימי, במקום המשולש הכפול
  // בכפר המדבקות כבויות (VFX3D.on רק בעולם). כמו האש של פיוחו (petfx3d.js), מדליקים לרגע את VFX3D.pet
  const was=VFX3D.pet,F=SKCAST.flash,O=skcO,M=SKCAST.motes;VFX3D.pet=true;
  // שתי הטבעות: הזמן לפי המשחק (skcUpdate), לא לפי הציור. מתחילות בגודל 0 וקופצות
  O.d.col=col;O.d.hdr=T.hdr;O.d.p=1;const b=skcRune.d3b=VFX3D.decal('rune',P.x,P.y,1,O.d);
  O.d.p=0;const d=skcRune.d3=sm?null:VFX3D.decal('rune',P.x,P.y,1,O.d);
  if(b)b.spin=R.spin[0];if(d)d.spin=R.spin[1];
  // הבזק על הקרקע וגל הדף (נשארים במקום ההטלה)
  O.fl.life=T.flash.life;O.fl.col=col;O.fl.a=T.flash.a*A;O.fl.hdr=T.flash.hdr;VFX3D.decal('glow',P.x,P.y,rr*T.flash.r,O.fl);
  for(const w of [T.wave,T.wave2]){const wr=skcWaveR(w);if(!wr)continue;O.wv.life=w.life;O.wv.grow[0]=rr*0.3;O.wv.grow[1]=wr;O.wv.col=col;O.wv.w=w.w;O.wv.a=w.a*A;VFX3D.decal('ring',P.x,P.y,wr,O.wv)}
  // הבזק בידיים
  O.glow.col=O.glow.col2=col;O.glow.size=F.size*(big?1.25:1);O.glow.size2=F.size2*(big?1.25:1);O.glow.life=F.life;VFX3D.emit('glow',P.x,P.y,F.h,O.glow);
  O.spark.col2=col;O.spark.n=F.spark*(big?2:1);VFX3D.emit('spark',P.x,P.y,F.h,O.spark);
  // ניצוצות שעולים מכל העיגול
  const m=O.mote;m.n=Math.round(T.motes*(fight?C.motes:1));m.col2=col;m.spread=rr*0.85;m.spd=M.spd;m.up=M.up;m.grav=M.grav;m.drag=M.drag;m.size=M.size;m.size2=M.size2;m.life=M.life;VFX3D.emit('ember',P.x,P.y,4,m);
  if(T.pillar){O.pl.life=T.pillar.life;O.pl.hdr=T.pillar.hdr;VFX3D.pillar(P.x,P.y,T.pillar.r,T.pillar.h,col,O.pl)}
  VFX3D.light(P.x,P.y,F.h,col,T.light*(fight?C.light:1),F.lightT*(big?1.6:1));
  VFX3D.pet=was;
}
// כמה רחוק גל ההדף מגיע (הרדיוס הסופי), או 0 כשאין גל: בקרב נעצר gap לפני האויב הקרוב, ולא מכסה אותו
function skcWaveR(w){const R=skcRune;if(!w||!R)return 0;const full=R.T.r*R.k*w.r;if(!R.fight)return full;
  const lim=R.near-SKCAST.combat.gap;return lim>R.T.r*R.k*1.05?Math.min(full,lim):0}
// קפיצה עם מעבר מעל הגודל (easeOutBack), ואחר כך מתייצב
function skcScale(T,t){if(t>=T.pop*2)return 1;if(t<T.pop){const f=t/T.pop;return T.over*(1-Math.pow(1-f,3))}return T.over+(1-T.over)*((t-T.pop)/T.pop)}
// זום קטן ברגע ההטלה של סקיל גדול (camera.js): מקרב מעט ומתרחק חזרה
function skcZoom(){const R=skcRune;if(typeof RM!=='undefined'&&RM||!R||!R.T||!R.T.zoom||R.t>R.T.zoomT||!SKCAST.where())return 1;const f=R.t/R.T.zoomT;return 1+R.T.zoom*Math.sin(Math.PI*Math.min(1,f*2.5))*(1-f)}
// איזו אנימציה לנגן (render3d.js). L: המראה של הגיבור (heroLook)
function skcClip(L){
  const k=P.skCast&&P.skCast.k;let c=SKCAST.anim[k]||SKCAST.fallback;
  if(c==='shot'||c==='shotUp')c=SKCAST[c][L.anim.gunDraw&&P.weapon!=='sword'?'bow':'other'];
  if(R3D.clips[c+'@up'])return c;
  if(typeof m3dHint==='function')m3dHint(SKCAST.pre);   // קליפ מבחוץ שעוד לא נטען: ברקע, ובינתיים הקליפ הישן
  const o=SKCAST.old[k];return o&&R3D.clips[o+'@up']?o:SKCAST.fallback;
}
// העיגול הולך עם הגיבור. בתלת-ממד מזיזים את המדבקות, ובדו-ממד מציירים בקנבס, מתחת לדמויות
const skcAlpha=f=>{const R=SKCAST.rune;return R.a*(skcRune?skcRune.a:1)*(f>1-R.fade?Math.max(0,(1-f)/R.fade):1)};
function skcUpdate(dt){
  if(!skcRune)return;skcRune.t+=dt;
  const T=skcRune.T,f=skcRune.t/T.life,a=skcAlpha(Math.min(1,f)),k=skcScale(T,skcRune.t),d=skcRune.d3,b=skcRune.d3b;
  const r=T.r*skcRune.k;
  if(b&&b.on){b.x=P.x;b.y=P.y;b.a=a;b.r=r*k}
  if(d&&d.on){d.x=P.x;d.y=P.y;d.a=a;d.r=r*SKCAST.rune.inner*k}
  const m=skcSpr.m;if(m&&m.visible){const Sp=SKCAST.sprite,D=FXDATA[m.userData.id],i=skcSprFrame(D,skcRune.t),rows=Math.ceil(D.n/D.c),sn=Math.sin(camTilt()),rr=r*k*Sp.scale;
    m.material.map.offset.set((i%D.c)/D.c,1-(Math.floor(i/D.c)+1)/rows);m.material.opacity=a*Sp.a;m.position.set(P.x,Sp.y,P.y/sn);m.scale.set(rr,1,rr/sn)}
  if(f>=1){skcFree();skcRune=null}
}
function skcDraw(){
  if(!skcRune||R3D.on&&(skcRune.d3||skcRune.d3b))return;
  const T=skcRune.T,R=SKCAST.rune,t=skcRune.t,f=t/T.life,a=skcAlpha(Math.min(1,f)),r0=T.r*skcRune.k,r=r0*skcScale(T,t),ri=r*R.inner,c=skcRune.col,A=skcRune.a,wr=skcWaveR(T.wave);
  ctx.save();ctx.translate(P.x,P.y+6);ctx.scale(1,0.5);
  {const Sp=SKCAST.sprite,id=skcRune.spr,im=id&&typeof fxImg==='function'&&fxImg(id),D=im&&FXDATA[id];   // מעגל הבסיס מהספרייה, מתחת לרונות
    var sprOn=D&&!(R3D.on&&skcSpr.m&&skcSpr.m.visible);if(sprOn){const i=skcSprFrame(D,t),z=r*Sp.scale;ctx.globalAlpha=a*Sp.a;ctx.drawImage(im,(i%D.c)*D.s,Math.floor(i/D.c)*D.s,D.s,D.s,-z,-z,z*2,z*2)}}
  ctx.strokeStyle=c;ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=14;
  if(t<T.flash.life){ctx.globalAlpha=0.5*A*(1-t/T.flash.life);ctx.beginPath();ctx.arc(0,0,r0*T.flash.r,0,7);ctx.fill()}   // הבזק
  if(wr&&t<T.wave.life){const w=t/T.wave.life;ctx.globalAlpha=(1-w)*0.9*A;ctx.lineWidth=4*(1-w)+1;ctx.beginPath();ctx.arc(0,0,r0*0.3+(wr-r0*0.3)*(1-Math.pow(1-w,2.4)),0,7);ctx.stroke()}   // גל הדף
  ctx.globalAlpha=a;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,r*0.97,0,7);ctx.stroke();ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,0,r*0.78,0,7);ctx.stroke();
  ctx.save();ctx.rotate(t*R.spin[0]);ctx.beginPath();for(let i=0;i<24;i++){const q=i*Math.PI/12;ctx.moveTo(Math.cos(q)*r*0.82,Math.sin(q)*r*0.82);ctx.lineTo(Math.cos(q)*r*(i%3?0.9:0.94),Math.sin(q)*r*(i%3?0.9:0.94))}ctx.stroke();ctx.restore();   // טבעת סימנים
  if(sprOn){ctx.restore();return}   // המעגל מהספרייה הוא העיגול הפנימי
  ctx.rotate(t*R.spin[1]);ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,ri*0.94,0,7);   // בפנים: משולש כפול (מגן דוד של קווים)
  for(let j=0;j<2;j++)for(let i=0;i<=3;i++){const q=j*Math.PI/3+i*Math.PI*2/3;i?ctx.lineTo(Math.cos(q)*ri*0.74,Math.sin(q)*ri*0.74):ctx.moveTo(Math.cos(q)*ri*0.74,Math.sin(q)*ri*0.74)}
  ctx.stroke();ctx.restore();
}
