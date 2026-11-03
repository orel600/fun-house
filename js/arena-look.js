/* מראה הזירה (אוראל, 2.11.2026: "שהזירה תיראה כמו העולם הפתוח, ונוסיף טוויסטים משלנו"). הזירה של אוראל.
   מה דלוק: אותה תאורה, אובך ומסגרת כהה כמו בעולם (look-hd.js), ורצפת אבן מצוירת בסגנון ground.js:
   אבנים לא אחידות, כתמים גדולים, סדקים, טבעות רונות סביב מרכז הזירה, וקצה שמחשיך ככל שמתרחקים.
   הזירה בלי גבול, אז אין אפייה: הרצפה מחושבת בכרטיס הגרפי ישר מהמקום בעולם, בלי טקסטורות נוספות.
   הטוויסטים (הכל בתוך הרצפה, בלי דמויות ובלי אורות נוספים, כדי לא להכביד כשיש מאות אויבים):
   - שש חותמות: עיגול לכל סוג נזק (DMG.types) על הטבעת החיצונית. ככל שמשתמשים בסוג (S.hits), החותמת שלו דולקת יותר
   - הרונות פועמות: בקומבו (skills.js, S.sk.combos) פעימה קטנה, ובגל הענק (run.js, swarm) פעימה גדולה
   - הרצפה נסדקת עם הריצה: הסדקים מתרחבים ככל שהבוס קרב (RUN.bossAt), ובסוף זוהרים מבפנים
   - הבוס נכנס: עמוד אור על המקום שלו וזוהר על הרצפה, לכמה שניות
   צללים: כבויים בזירה (shadow למטה, נמדד פי 4 איטי). בלי תלת-ממד: טבעות עדינות ברצפה (aLook2d).
   סוגי זירות (arenas.js, S.arena): פלטה לכל סוג ב-pal. בלי שורה: classic.
   מתחבר בשורה אחת בכל אחד: look-hd.js (מתי, איזו קרקע, צללים), render3d.js (צבעי הרקע), render.js (דו-ממד). לא בחדר הבונוס ולא במשחקי השאול */
const ARENA_LOOK={
  on:!/[?&]look=classic\b/.test(location.search),
  // פלטה לכל סוג זירה: stone/stone2 אבנים, dark כתמים כהים, mortar תפרים, crack סדקים, rune טבעות, ember זוהר הסדקים בסוף,
  // out מה שמעבר לקצה, bg השמיים מאחור, fog צבע האובך (לפני שמערבבים אותו עם השמיים של look-hd.js)
  pal:{
    classic:{stone:'#aaa395',stone2:'#948d7f',dark:'#5f5a52',mortar:'#5a554c',crack:'#2a2622',rune:'#e8d9a8',ember:'#ff7a2a',out:'#2a2733',bg:'#3c3a44',fog:'#6e6a66'},
    waves:{stone:'#8a7fa6',stone2:'#746a92',dark:'#4a4066',mortar:'#3f3658',crack:'#221a33',rune:'#c9b6ff',ember:'#b06bff',out:'#1c1628',bg:'#33284D',fog:'#5a4f78'},   // זירת הגלים (arenas.js): אבן סגולה, כמו הרצפה שלה
    boss:{stone:'#a07c88',stone2:'#8a6874',dark:'#5e3f4a',mortar:'#4d3039',crack:'#2a141c',rune:'#ffb3a0',ember:'#ff6a4a',out:'#241218',bg:'#432A35',fog:'#6e4452'}   // זירת הבוסים: אבן בורדו
  },
  stone:{w:58,h:40,mortar:1.6,tint:0.12},   // גודל האבנים (פיקסלים של המשחק), עובי התפר, וכמה כל אבן שונה מהשכנה
  macro:620,                                // גודל הכתמים הגדולים, שמסתירים את החזרה
  rings:[150,320,430,462],                  // טבעות הרונות סביב מרכז הזירה (0,0). האחרונות: הטבעת הכפולה שעליה החותמות
  runes:{r:446,n:48,a:0.55},                // הרונות: על איזה רדיוס, כמה סביב, כמה בולטות
  sigil:{r:446,size:38,dim:0.18,lit:1.6,min:0.12,ease:1.5},   // החותמות: רדיוס, גודל, כמה דולקות בלי שימוש ובשימוש מלא, מאיזה חלק מהמכות נדלקות, וכמה מהר
  edge:{from:900,to:2200,dark:0.62},        // הקצה: מתחיל להחשיך ב-from, מלא ב-to, ועד כמה (0 = שחור). נשאר שקוף מספיק כדי לשחק שם
  crack:{scale:170,w0:0.006,w1:0.022,glowAt:0.85},   // סדקים: גודל, רוחב בהתחלה ובבוס, ומאיזה חלק של הריצה הם זוהרים
  pulse:{combo:0.35,swarm:1,fade:1.6},      // כמה חזק כל פעימה, ותוך כמה שניות היא דועכת
  boss:{t:3,r:150,beam:{r:46,h:900}},       // כניסת הבוס: כמה שניות, רדיוס הזוהר ברצפה, ועמוד האור
  shadow:{maxFoes:0},   // צללים בזירה: רק כשיש עד כך אויבים. 0 = אף פעם (נמדד 2.11: עם 30 אויבים הציור פי 4 איטי יותר עם צללים, אז כבוי. נשאר הצל העגול)
  map2d:{rings:'rgba(232,217,168,0.10)',w:2}   // דו-ממד: טבעות עדינות
};

// האם עכשיו בזירה, בתלת-ממד, עם המראה החדש
function aLookHere(){return ARENA_LOOK.on&&typeof R3D!=='undefined'&&R3D.on&&R3D.ready&&!!S&&!S.vil&&!S.wd&&!S.room&&!S.mb}
const aLookPal=()=>ARENA_LOOK.pal[S&&S.arena]||ARENA_LOOK.pal.classic;
const ALOOK={stat:{draws:0},mat:null,pulse:0,boss:0,bossAt:null,beam:null,lit:{},seen:{combos:0,swarms:0,boss:null,run:null}};

(()=>{
  if(!ARENA_LOOK.on)return;
  const A=ARENA_LOOK,types=()=>Object.keys(DMG.types).slice(0,6);
  const v3=h=>{const c=new THREE.Color(h);return new THREE.Vector3(c.r,c.g,c.b)};   // צבע כמו שהוא (sRGB). הרצפה ממירה בקריאה
  // אותו רעש כמו ב-ground.js (GROUND.noise), כדי שהרצפה תהיה מאותה משפחה
  const NOISE=(typeof GROUND!=='undefined'&&GROUND.noise)||`
    float gH(vec2 p){vec3 q=fract(vec3(p.xyx)*0.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
    float gN(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float a=gH(i),b=gH(i+vec2(1,0)),c=gH(i+vec2(0,1)),d=gH(i+vec2(1,1));return a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y;}
    float gF(vec2 p){return 0.5*gN(p)+0.3*gN(p*2.03+vec2(1.7,9.2))+0.2*gN(p*4.01+vec2(5.1,3.3));}`;
  function makeMat(){
    const m=new THREE.MeshLambertMaterial({color:0xffffff}),Z=()=>new THREE.Vector3();
    const U=m.userData.u={aSin:{value:1},aT:{value:0},aProg:{value:0},aPulse:{value:0},aBoss:{value:new THREE.Vector3(9e4,9e4,0)},
      cStone:{value:Z()},cStone2:{value:Z()},cDark:{value:Z()},cMortar:{value:Z()},cCrack:{value:Z()},cRune:{value:Z()},cEmber:{value:Z()},cOut:{value:Z()},
      sCol:{value:Array.from({length:6},Z)},sLit:{value:new Array(6).fill(0)}};
    const R=A.rings.map(r=>r.toFixed(1)),f=x=>(+x).toFixed(4);
    m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
      sh.vertexShader='varying vec2 vAp;uniform float aSin;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 aW=modelMatrix*vec4(transformed,1.0);vAp=vec2(aW.x,aW.z*aSin);');
      sh.fragmentShader=`varying vec2 vAp;uniform float aT,aProg,aPulse;uniform vec3 aBoss,cStone,cStone2,cDark,cMortar,cCrack,cRune,cEmber,cOut;uniform vec3 sCol[6];uniform float sLit[6];${NOISE}
        float aRing(float d,float r,float w){return 1.0-smoothstep(w*0.5,w,abs(d-r));}
        `+sh.fragmentShader.replace('#include <map_fragment>',`
        vec2 p=vAp;float d=length(p),ang=atan(p.y,p.x);vec3 glow=vec3(0.0);
        // אבנים בשורות מוזזות, כל אבן בגוון משלה, תפר כהה ביניהן
        vec2 sq=vec2(p.x/${f(A.stone.w)}+0.5*floor(p.y/${f(A.stone.h)})+0.3*gN(p/90.0),p.y/${f(A.stone.h)}),sf=fract(sq),sid=floor(sq);
        float mort=min(min(sf.x,1.0-sf.x)*${f(A.stone.w)},min(sf.y,1.0-sf.y)*${f(A.stone.h)});
        float mac=gF(p/${f(A.macro)});
        vec3 c=mix(cStone,cStone2,gH(sid))*(1.0-${f(A.stone.tint)}+${f(A.stone.tint*2)}*gH(sid+7.1));
        c=mix(c,cDark,smoothstep(0.35,0.75,mac)*0.6);
        c*=0.92+0.16*gN(p/9.0);
        c=mix(mix(c,cMortar,0.75),c,smoothstep(${f(A.stone.mortar*0.5)},${f(A.stone.mortar*1.6)},mort));
        // סדקים: קו לאורך החצי של רעש, שמתרחב עם הריצה, וזוהר בסוף
        float cn=abs(gN(p/${f(A.crack.scale)})-0.5)+0.18*abs(gN(p/${f(A.crack.scale*0.33)})-0.5);
        float cw=mix(${f(A.crack.w0)},${f(A.crack.w1)},aProg),ck=1.0-smoothstep(cw*0.4,cw,cn);
        c=mix(c,cCrack,ck*0.7);
        glow+=cEmber*ck*smoothstep(${f(A.crack.glowAt)},1.0,aProg)*(0.35+0.25*sin(aT*3.0+gN(p/40.0)*6.0));
        // טבעות הרונות סביב המרכז, ורונות על החיצונית. פועמות בקומבו ובגל הענק
        float rg=aRing(d,${R[0]},5.0)+aRing(d,${R[1]},6.0)+aRing(d,${R[2]},4.0)+aRing(d,${R[3]},4.0);
        float seg=fract(ang/6.2832*${f(A.runes.n)}),rr=abs(d-${f(A.runes.r)});
        float rn=step(rr,14.0)*step(0.2,seg)*step(seg,0.8)*step(0.35,gH(vec2(floor(ang/6.2832*${f(A.runes.n)}),3.0)))*(1.0-smoothstep(abs(seg-0.5)*28.0,abs(seg-0.5)*28.0+3.0,rr+gH(vec2(floor(ang*7.6),1.0))*10.0));
        float rune=clamp(rg+rn*${f(A.runes.a)},0.0,1.0);
        c=mix(c,cRune*0.75,rune*0.5);
        glow+=cRune*rune*aPulse*0.9;
        // שש החותמות: עיגול עם כוכב, לכל סוג נזק, דולקות לפי השימוש
        for(int i=0;i<6;i++){float a=float(i)*1.0472+0.5236;vec2 sp=vec2(cos(a),sin(a))*${f(A.sigil.r)};vec2 q=p-sp;float sd=length(q),sa=atan(q.y,q.x);
          float star=abs(cos(3.0*sa))*0.35+0.45;
          float s=aRing(sd,${f(A.sigil.size)},5.0)+aRing(sd,${f(A.sigil.size*0.62)},3.0)+(1.0-smoothstep(${f(A.sigil.size)}*star-3.0,${f(A.sigil.size)}*star,sd))*0.35;
          s*=step(sd,${f(A.sigil.size+6)});
          c=mix(c,sCol[i]*0.6,s*0.45);glow+=sCol[i]*s*(sLit[i]+aPulse*0.3);}
        // הבוס נכנס: זוהר ברצפה סביבו
        float bd=length(p-aBoss.xy);glow+=cRune*aBoss.z*(1.0-smoothstep(0.0,${f(A.boss.r)},bd))*1.4+cEmber*aBoss.z*aRing(bd,${f(A.boss.r*0.8)},8.0);
        // הקצה מחשיך ככל שמתרחקים מהמרכז
        float ed=smoothstep(${f(A.edge.from)},${f(A.edge.to)},d+(gN(p/120.0)-0.5)*160.0);
        c=mix(c,cOut,ed*${f(1-A.edge.dark)});glow*=1.0-ed*0.7;
        diffuseColor.rgb=pow(c,vec3(2.2));vec3 aGlow=pow(glow,vec3(2.2));`).replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=aGlow;')};
    return m;
  }
  function setPal(){
    const u=ALOOK.mat.userData.u,p=aLookPal();
    for(const k of ['stone','stone2','dark','mortar','crack','rune','ember','out'])u['c'+k[0].toUpperCase()+k.slice(1)].value.copy(v3(p[k]));
    types().forEach((t,i)=>u.sCol.value[i].copy(v3(DMG.types[t].col)));ALOOK.palKey=S.arena||'classic';
  }
  // עמוד האור של הבוס: גליל שקוף שמתחבר לאור, רק בזמן הכניסה
  function beam(){
    const B=A.boss.beam,g=new THREE.CylinderGeometry(B.r*0.6,B.r,B.h,20,1,true).translate(0,B.h/2,0);
    const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:new THREE.Color(aLookPal().rune),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,fog:false}));
    m.visible=false;m.frustumCulled=false;R3D.scene.add(m);return m;
  }
  // כל פריים בזירה: מה קרה בריצה (שימוש בסוגי נזק, קומבו, גל ענק, בוס) הופך לערכים של הרצפה
  function tick(){
    const u=ALOOK.mat.userData.u,L=ALOOK.seen,dt=Math.max(0,Math.min(0.1,S.t-(L.t??S.t)));L.t=S.t;
    if(L.run!==S.run){L.run=S.run;L.combos=0;L.swarms=0;L.boss=S.boss;ALOOK.pulse=0;ALOOK.boss=0;ALOOK.lit={}}   // ריצה חדשה
    if((S.arena||'classic')!==ALOOK.palKey)setPal();
    u.aSin.value=SIN();u.aT.value=S.t;
    u.aProg.value=typeof RUN!=='undefined'?Math.min(1,S.t/RUN.bossAt):0;
    // קומבו וגל ענק: פעימה
    const cb=S.sk?Object.values(S.sk.combos).reduce((a,b)=>a+b,0):0,sw=S.run?S.run.log.filter(s=>s.kind==='swarm').length:0;
    if(cb>L.combos)ALOOK.pulse=Math.max(ALOOK.pulse,A.pulse.combo);if(sw>L.swarms)ALOOK.pulse=A.pulse.swarm;L.combos=cb;L.swarms=sw;
    ALOOK.pulse=Math.max(0,ALOOK.pulse-dt/A.pulse.fade);u.aPulse.value=ALOOK.pulse*ALOOK.pulse;
    // החותמות: חלק מכל המכות, ומתקרבים אליו בהדרגה
    const hits=S.hits||{},tot=types().reduce((a,t)=>a+(hits[t]||0),0)||1,G=A.sigil;
    types().forEach((t,i)=>{const sh=(hits[t]||0)/tot,want=sh<G.min?G.dim:G.dim+(G.lit-G.dim)*Math.min(1,(sh-G.min)/(0.5-G.min));
      const l=ALOOK.lit[t]??G.dim;ALOOK.lit[t]=l+(want-l)*Math.min(1,dt*G.ease);u.sLit.value[i]=ALOOK.lit[t]});
    // הבוס נכנס
    if(S.boss&&S.boss!==L.boss){ALOOK.boss=A.boss.t}L.boss=S.boss;
    if(ALOOK.boss>0)ALOOK.boss=Math.max(0,ALOOK.boss-dt);
    const k=ALOOK.boss/A.boss.t,b=S.boss;
    if(b&&k>0)u.aBoss.value.set(b.x,b.y,Math.sin(Math.min(1,k*1.2)*Math.PI*0.5)*Math.min(1,(1-k)*6));else u.aBoss.value.set(9e4,9e4,0);
    if(!ALOOK.beam)ALOOK.beam=beam();
    ALOOK.beam.visible=!!(b&&k>0);if(ALOOK.beam.visible){ALOOK.beam.position.set(b.x,0,b.y/SIN());ALOOK.beam.material.opacity=u.aBoss.value.z*0.55;ALOOK.beam.scale.set(1+0.15*Math.sin(S.t*9),1,1+0.15*Math.sin(S.t*9))}
    ALOOK.stat.draws++;ALOOK.stat.prog=u.aProg.value;ALOOK.stat.pulse=ALOOK.pulse;
  }
  // look-hd.js שואל: איזו קרקע בזירה. null = לא בזירה
  window.aLookMat=()=>{
    if(!aLookHere())return null;
    try{if(!ALOOK.mat){ALOOK.mat=makeMat();setPal()}tick();return ALOOK.mat}catch(e){ALOOK.failed=String(e);ARENA_LOOK.on=false;console.warn('arena-look',e);return null}
  };
  // render3d.js: צבע השמיים והאובך בזירה (look-hd.js מערבב את האובך עם השמיים שלו)
  window.aLookColors=()=>{if(!aLookHere()||!ALOOK.mat)return;const p=aLookPal();R3D.scene.background.set(p.bg);R3D.ground.material.color.set(p.fog)};
  // look-hd.js: צללים בזירה רק כשמעט אויבים (מפת הצללים מציירת כל אויב פעם נוספת)
  window.aLookShadow=()=>!aLookHere()||(A.shadow.maxFoes>0&&enemies.length<=A.shadow.maxFoes);
  // מחוץ לזירה: עמוד האור מוסתר
  const base=window.render3d;
  window.render3d=function(...a){if(ALOOK.beam&&!aLookHere())ALOOK.beam.visible=false;return base.apply(this,a)};
})();

// דו-ממד (render.js): טבעות עדינות סביב מרכז הזירה, בלי רונות ובלי זוהר
function aLook2d(){
  if(!ARENA_LOOK.on||!S||S.vil||S.wd||S.room||S.mb)return;
  const M=ARENA_LOOK.map2d;ctx.strokeStyle=M.rings;ctx.lineWidth=M.w;ctx.beginPath();
  for(const r of ARENA_LOOK.rings){ctx.moveTo(r,0);ctx.arc(0,0,r,0,6.2832)}ctx.stroke();
}
