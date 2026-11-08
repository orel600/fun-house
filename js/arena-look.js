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
    classic:{stone:'#aaa395',stone2:'#948d7f',dark:'#5f5a52',mortar:'#4a453d',crack:'#2a2622',rune:'#e8d9a8',ember:'#ff7a2a',out:'#2a2733',bg:'#3c3a44',fog:'#6e6a66'},
    waves:{stone:'#8a7fa6',stone2:'#746a92',dark:'#4a4066',mortar:'#352c4c',crack:'#221a33',rune:'#c9b6ff',ember:'#b06bff',out:'#1c1628',bg:'#33284D',fog:'#5a4f78'},   // זירת הגלים (arenas.js): אבן סגולה, כמו הרצפה שלה
    maze:{stone:'#7E9A9C',stone2:'#688588',dark:'#3A5558',mortar:'#283c3e',crack:'#142226',rune:'#B8F0E6',ember:'#4FD6C0',out:'#101C1F',bg:'#23424A',fog:'#47727A'},   // זירת המבוך: אבן כחולה-ירקרקה
    boss:{stone:'#a07c88',stone2:'#8a6874',dark:'#5e3f4a',mortar:'#412830',crack:'#2a141c',rune:'#ffb3a0',ember:'#ff6a4a',out:'#241218',bg:'#432A35',fog:'#6e4452'}   // זירת הבוסים: אבן בורדו
  },
  // הקו האמנותי המשותף לכל הזירות (icons/ui/res: עץ, פליז, אבן כהה). רק האבן עצמה משתנה בין זירות
  line:{brass:'#D9A85B',brassHi:'#F6D38A',wood:'#5A3A1E',wood2:'#3B2414',curb:'#2B2622'},
  // אבני ריצוף (W4, 8.11, במקום לבנים חוזרות): תאים לא סדירים (Worley), גודל ממוצע בפיקסלים, עיוות הרשת, רוחב התפר, כמה כל אבן שונה
  flag:{size:76,warp:0.35,mortar:0.09,tint:0.14,bevel:0.18,wear:0.35,grit:0.05},
  macro:620,                                // גודל הכתמים הגדולים, שמסתירים את החזרה
  rings:[150,320,430,462],                  // טבעות שיבוץ הפליז סביב מרכז הזירה (0,0). האחרונות: הטבעת הכפולה שעליה החותמות
  runes:{r:446,n:48,a:0.55},                // הרונות: על איזה רדיוס, כמה סביב, כמה בולטות
  sigil:{r:446,size:38,dim:0.18,lit:1.6,min:0.12,ease:1.5},   // החותמות: רדיוס, גודל, כמה דולקות בלי שימוש ובשימוש מלא, מאיזה חלק מהמכות נדלקות, וכמה מהר
  // הגבול (W4): שפת אבן כהה עם מסמרות פליז, ומסביבה טבעת קרשי עץ (רצפה, לא קיר: אפשר ללכת עליה). studs: כמה מסמרות סביב, planks: כמה קרשים
  border:{curb:[880,930],studs:60,planks:[930,1030],plankN:72,torches:12},
  edge:{from:1030,to:2200,dark:0.62},        // הקצה: מחוץ לעץ, אבן גסה שמחשיכה מ-from עד to, ועד כמה (0 = שחור). נשאר שקוף מספיק כדי לשחק שם
  crack:{scale:170,w0:0.006,w1:0.022,glowAt:0.85},   // סדקים: גודל, רוחב בהתחלה ובבוס, ומאיזה חלק של הריצה הם זוהרים
  pulse:{combo:0.35,swarm:1,fade:1.6},      // כמה חזק כל פעימה, ותוך כמה שניות היא דועכת
  boss:{t:3,r:150,beam:{r:46,h:900}},       // כניסת הבוס: כמה שניות, רדיוס הזוהר ברצפה, ועמוד האור
  shadow:{maxFoes:0},   // צללים בזירה: רק כשיש עד כך אויבים. 0 = אף פעם (נמדד 2.11: עם 30 אויבים הציור פי 4 איטי יותר עם צללים, אז כבוי. נשאר הצל העגול)
  // דו-ממד (W4): הרצפה נאפית פעם אחת לאריח גדול (tile פיקסלים, חלק בקצוות) ומצוירת כדוגמה; הגבול, הלפידים והקהל מצוירים כווקטורים.
  // crowd: הקהל מעבר לעץ, radius, כמה ראשים, וכמה הם זזים. fx: אפקטים מהספרייה (fxlib.js) באווירה
  map2d:{tile:768,shade:0.8,crowd:{r:[1060,1140],n:140,bob:3},torchR:905,fx:{fireflies:6,embers:4,haze:4,stars:0}}
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
  // תאי Worley (אבני ריצוף): המרחק לנקודה הקרובה (f1) והשנייה (f2), ומזהה התא. ההפרש f2-f1 קטן = תפר
  const WORLEY=`
    vec2 wH2(vec2 p){vec3 q=fract(vec3(p.xyx)*vec3(0.1031,0.1030,0.0973));q+=dot(q,q.yzx+33.33);return fract((q.xx+q.yz)*q.zy);}   // hash אחד לשתי הקואורדינטות, בלי sin (יקר על המעבד)
    void worley(vec2 p,out float f1,out float f2,out vec2 id){vec2 i=floor(p-0.5),f=p-i;f1=8.0;f2=8.0;id=i;   // 2x2: הנקודה של כל תא בתוך הרבע האמצעי שלו, אז ארבעת השכנים מספיקים (חצי מהעבודה של 3x3)
      for(int y=0;y<=1;y++)for(int x=0;x<=1;x++){vec2 g=vec2(float(x),float(y));vec2 r=g+0.25+0.5*wH2(i+g)-f;float d=dot(r,r);if(d<f1){f2=f1;f1=d;id=i+g;}else if(d<f2){f2=d;}}
      f1=sqrt(f1);f2=sqrt(f2);}`;
  function makeMat(){
    const m=new THREE.MeshLambertMaterial({color:0xffffff}),Z=()=>new THREE.Vector3();
    const U=m.userData.u={aSin:{value:1},aT:{value:0},aProg:{value:0},aPulse:{value:0},aBoss:{value:new THREE.Vector3(9e4,9e4,0)},
      cStone:{value:Z()},cStone2:{value:Z()},cDark:{value:Z()},cMortar:{value:Z()},cCrack:{value:Z()},cRune:{value:Z()},cEmber:{value:Z()},cOut:{value:Z()},cBrass:{value:Z()},cWood:{value:Z()},cWood2:{value:Z()},cCurb:{value:Z()},
      sCol:{value:Array.from({length:6},Z)},sLit:{value:new Array(6).fill(0)}};
    const R=A.rings.map(r=>r.toFixed(1)),f=x=>(+x).toFixed(4);
    m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
      sh.vertexShader='varying vec2 vAp;uniform float aSin;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 aW=modelMatrix*vec4(transformed,1.0);vAp=vec2(aW.x,aW.z*aSin);');
      sh.fragmentShader=`varying vec2 vAp;uniform float aT,aProg,aPulse;uniform vec3 aBoss,cStone,cStone2,cDark,cMortar,cCrack,cRune,cEmber,cOut,cBrass,cWood,cWood2,cCurb;uniform vec3 sCol[6];uniform float sLit[6];${NOISE}${WORLEY}
        float aRing(float d,float r,float w){return 1.0-smoothstep(w*0.5,w,abs(d-r));}
        `+sh.fragmentShader.replace('#include <map_fragment>',`
        vec2 p=vAp;float d=length(p),ang=atan(p.y,p.x);vec3 glow=vec3(0.0);
        // אבני ריצוף לא סדירות: תאי Worley על רשת מעוותת ברעש, כל אבן בגוון משלה, שחיקה בקצוות ותפר כהה
        vec2 wp=p/${f(A.flag.size)}+vec2(sin(p.y*0.0131)+sin(p.x*0.0071+1.7),cos(p.x*0.0113)+sin(p.y*0.0089+4.2))*${f(A.flag.warp*0.25)};   // עיוות הרשת בסינוסים: זול, ובלי חזרה נראית
        float f1,f2;vec2 sid;worley(wp,f1,f2,sid);float edge=f2-f1;
        vec2 mq=p/${f(A.macro)};float mac=0.62*gN(mq)+0.38*gN(mq*2.03+vec2(1.7,9.2)),grain=gH(floor(p/3.5)),wearN=gN(p/23.0);   // שתי אוקטבות לכתמים הגדולים (במקום שלוש)
        vec2 sh2=wH2(sid);vec3 c=mix(cStone,cStone2,sh2.x)*(1.0-${f(A.flag.tint)}+${f(A.flag.tint*2)}*sh2.y);   // גוון וגובה של האבן מ-hash אחד
        c=mix(c,cDark,smoothstep(0.35,0.75,mac)*0.6);
        c*=1.0+${f(A.flag.bevel)}*(0.5-f1);                                   // מרכז האבן בולט, הקצה שוקע
        c*=1.0-${f(A.flag.wear)}*smoothstep(0.35,0.05,edge)*wearN;              // שחיקה וכתמים ליד התפרים
        c*=0.93+0.14*wearN+${f(A.flag.grit)}*(step(0.86,grain)-0.5);          // גרגור עדין
        float mort=smoothstep(${f(A.flag.mortar*0.5)},${f(A.flag.mortar*1.4)},edge+0.02*(grain-0.5));
        c=mix(mix(cMortar,cStone2*0.55,step(0.985,grain)),c,mort);            // תפר כהה עם חצץ בהיר בודד
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
        c=mix(c,cBrass*(0.8+0.3*gH(floor(p/5.0))),rune*0.75);                      // שיבוץ פליז ברצפה, עם ברק קל
        glow+=cRune*rune*aPulse*0.9;
        // שש החותמות: עיגול עם כוכב, לכל סוג נזק, דולקות לפי השימוש
        for(int i=0;i<6;i++){float a=float(i)*1.0472+0.5236;vec2 sp=vec2(cos(a),sin(a))*${f(A.sigil.r)};vec2 q=p-sp;float sd=length(q),sa=atan(q.y,q.x);
          float star=abs(cos(3.0*sa))*0.35+0.45;
          float s=aRing(sd,${f(A.sigil.size)},5.0)+aRing(sd,${f(A.sigil.size*0.62)},3.0)+(1.0-smoothstep(${f(A.sigil.size)}*star-3.0,${f(A.sigil.size)}*star,sd))*0.35;
          s*=step(sd,${f(A.sigil.size+6)});
          c=mix(c,sCol[i]*0.6,s*0.45);glow+=sCol[i]*s*(sLit[i]+aPulse*0.3);}
        // הבוס נכנס: זוהר ברצפה סביבו
        float bd=length(p-aBoss.xy);glow+=cRune*aBoss.z*(1.0-smoothstep(0.0,${f(A.boss.r)},bd))*1.4+cEmber*aBoss.z*aRing(bd,${f(A.boss.r*0.8)},8.0);
        // הגבול והקצה: רק מעבר לרדיוס הזה (רוב המסך בפנים, וחוסך את כל החישוב שם)
        if(d>${f(A.border.curb[0]-40)}){
        // שפת אבן כהה עם מסמרות פליז, ומסביבה טבעת קרשי עץ (גם היא רצפה: הולכים עליה)
        float dw=d+(gN(p/70.0)-0.5)*14.0;
        float curb=smoothstep(${f(A.border.curb[0]-6)},${f(A.border.curb[0])},dw)*(1.0-smoothstep(${f(A.border.curb[1])},${f(A.border.curb[1]+6)},dw));
        c=mix(c,cCurb*(0.9+0.25*gN(p/12.0)),curb);
        vec2 sq2=vec2((fract(ang/6.2832*${f(A.border.studs)}+0.5)-0.5)*${f(2*Math.PI*(A.border.curb[0]+A.border.curb[1])/2/A.border.studs)},d-${f((A.border.curb[0]+A.border.curb[1])/2)});
        float stud=curb*(1.0-smoothstep(5.0,7.5,length(sq2)));c=mix(c,cBrass*(1.1-0.6*smoothstep(-2.0,5.0,sq2.y)),stud);
        float wood=smoothstep(${f(A.border.planks[0])},${f(A.border.planks[0]+4)},d)*(1.0-smoothstep(${f(A.border.planks[1]-4)},${f(A.border.planks[1])},d));
        float pk=fract(ang/6.2832*${f(A.border.plankN)}),seam=1.0-smoothstep(0.0,0.06,min(pk,1.0-pk));
        float pid=gH(vec2(floor(ang/6.2832*${f(A.border.plankN)}),2.0));vec3 wc=mix(cWood,cWood2,0.25+0.5*pid)*(0.88+0.24*gN(vec2(ang*260.0+pid*40.0,d/36.0)));   // כל קרש בגוון משלו, וסיבים דקים לאורכו
        wc=mix(wc,cWood2*0.6,seam);wc=mix(wc,cBrass,step(0.995,gH(floor(vec2(ang*120.0,d/6.0)))));   // תפר כהה בין קרשים, ומסמר פה ושם
        c=mix(c,wc,wood);
        float rim=aRing(d,${f(A.border.planks[0])},3.0)+aRing(d,${f(A.border.planks[1])},3.0);c=mix(c,cBrass*0.7,rim*0.6);   // קו פליז דק בשתי שפות העץ
        // מחוץ לעץ: אבן גסה וכהה שמחשיכה ככל שמתרחקים
        float outer=smoothstep(${f(A.border.planks[1])},${f(A.border.planks[1]+30)},d);
        c=mix(c,mix(cDark,cOut,0.4)*(0.8+0.3*gN(p/16.0)),outer*0.7);
        float ed=smoothstep(${f(A.edge.from)},${f(A.edge.to)},d+(gN(p/120.0)-0.5)*160.0);
        c=mix(c,cOut,ed*${f(1-A.edge.dark)});glow*=(1.0-ed*0.7)*(1.0-curb-wood);
        }
        diffuseColor.rgb=pow(c,vec3(2.2));vec3 aGlow=pow(glow,vec3(2.2));`).replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=aGlow;')};
    return m;
  }
  function setPal(){
    const u=ALOOK.mat.userData.u,p=aLookPal();
    for(const k of ['stone','stone2','dark','mortar','crack','rune','ember','out'])u['c'+k[0].toUpperCase()+k.slice(1)].value.copy(v3(p[k]));
    // צבעי הקו המשותף נכנסים כ-sRGB ממש (THREE.Color ממיר ללינארי, והרצפה עושה pow 2.2 בעצמה: פעמיים = עץ שחור)
    const L=A.line,sr=h=>new THREE.Vector3(parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255);
    u.cBrass.value.copy(sr(L.brass));u.cWood.value.copy(sr(L.wood));u.cWood2.value.copy(sr(L.wood2));u.cCurb.value.copy(sr(L.curb));
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

/* ---- דו-ממד (render.js), W4 8.11: אותה רצפה כמו בתלת-ממד, בלי כרטיס גרפי ----
   הרצפה נאפית פעם אחת (לכל זירה) לאריח גדול וחלק בקצוות, ומצוירת בכל פריים כדוגמה (fillRect אחד). השיבוץ, הגבול, הלפידים
   והקהל הם כמה עשרות קווים ועיגולים, רק מה שעל המסך. הרבה שחקנים רואים את הדו-ממד כי המשחק יורד אליו כשהטלפון איטי */
const ALOOK2={tile:null,pat:null,key:'',fx:[],fxRun:null,stat:{bakeMs:0,drawMs:0,torches:0,crowd:0}};
const aHex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
// האריח: תאי Worley על טורוס (חלק בקצוות), כל אבן בגוון משלה, קצה שוקע, שחיקה ליד התפרים ותפר כהה
function aLook2dTile(budgetMs){
  const A=ARENA_LOOK,M2=A.map2d,T=M2.tile,key=S.arena||'classic';
  if(ALOOK2.tile&&ALOOK2.key===key)return ALOOK2.tile;
  let K=ALOOK2.bake;
  if(!K||K.key!==key){   // מתחילים אפייה חדשה: הנקודות של התאים, הצבעים, והקנבס
    const p=aLookPal(),F=A.flag,n=Math.max(4,Math.round(T/F.size)),cs=T/n;
    const h2=(a,b)=>{const x=Math.sin(a*127.1+b*311.7+(key.length*13))*43758.5453;return x-Math.floor(x)};
    const px=new Float32Array(n*n),py=new Float32Array(n*n),ht=new Float32Array(n*n);
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){const k=j*n+i;px[k]=(i+0.15+0.7*h2(i,j))*cs;py[k]=(j+0.15+0.7*h2(j+9,i))*cs;ht[k]=h2(i*3,j*7)}
    const c=document.createElement('canvas');c.width=c.height=T;const g=c.getContext('2d');
    K=ALOOK2.bake={key,y:0,n,cs,px,py,ht,h2,c,g,img:g.createImageData(T,T),st:aHex(p.stone),st2:aHex(p.stone2),dk:aHex(p.dark),mo:aHex(p.mortar),t:0};
  }
  const t0=performance.now(),{n,cs,px,py,ht,h2,st,st2,dk,mo}=K,d=K.img.data,F=A.flag,TAU=Math.PI*2;
  // רעש מחזורי (חלק בקצוות): סכום סינוסים בתדרים שלמים של האריח. מקדמים שלמים בלבד, אחרת רואים תפר בקצה
  const pn=(x,y,a,b)=>0.5+0.25*(Math.sin((x*a+y*b)*TAU/T+1.3)+Math.sin((y*a-x*b)*TAU/T+4.1));
  for(;K.y<T&&(budgetMs==null||performance.now()-t0<budgetMs);K.y++){const y=K.y;
    for(let x=0;x<T;x++){
    const wx=x+(pn(x,y,3,5)-0.5)*F.warp*cs*1.6,wy=y+(pn(x,y,4,2)-0.5)*F.warp*cs*1.6;
    const ci=Math.floor(wx/cs),cj=Math.floor(wy/cs);let f1=1e9,f2=1e9,id=0;
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ii=(ci+di+n)%n,jj=(cj+dj+n)%n,k=jj*n+ii;
      let ddx=px[k]-wx,ddy=py[k]-wy;if(ddx>T/2)ddx-=T;if(ddx<-T/2)ddx+=T;if(ddy>T/2)ddy-=T;if(ddy<-T/2)ddy+=T;
      const dd=ddx*ddx+ddy*ddy;if(dd<f1){f2=f1;f1=dd;id=k}else if(dd<f2)f2=dd}
    f1=Math.sqrt(f1)/cs;f2=Math.sqrt(f2)/cs;const edge=f2-f1;
    const hcell=ht[id],mac=pn(x,y,1,2),grit=h2(x,y);
    let k0=hcell,r=st[0]+(st2[0]-st[0])*k0,gg=st[1]+(st2[1]-st[1])*k0,b=st[2]+(st2[2]-st[2])*k0;
    let m=1-F.tint*1.5+F.tint*3*h2(id,3);m*=1+F.bevel*1.4*(0.5-f1);   // בדו-ממד אין תאורה, אז קצת יותר ניגודיות
    const macK=Math.max(0,Math.min(1,(mac-0.35)/0.4))*0.6;r+=(dk[0]-r)*macK;gg+=(dk[1]-gg)*macK;b+=(dk[2]-b)*macK;
    const wear=Math.max(0,Math.min(1,(0.35-edge)/0.3))*F.wear*pn(x,y,9,13);m*=1-wear;
    m*=0.93+0.14*pn(x,y,21,17)+F.grit*((grit>0.86?1:0)-0.5);
    const mort=Math.max(0,Math.min(1,(edge+0.02*(pn(x,y,31,29)-0.5)-F.mortar*0.5)/(F.mortar*0.9)));
    r=r*m*mort+mo[0]*(1-mort);gg=gg*m*mort+mo[1]*(1-mort);b=b*m*mort+mo[2]*(1-mort);
    if(mort<0.5&&grit>0.985){r=st2[0]*0.6;gg=st2[1]*0.6;b=st2[2]*0.6}   // חצץ בהיר בודד בתפר
    const o=(y*T+x)*4,sh=M2.shade;d[o]=r*sh;d[o+1]=gg*sh*0.98;d[o+2]=b*sh*0.94;d[o+3]=255;   // קצת כהה וחם יותר, כמו הרצפה בתלת-ממד אחרי התאורה
  }}
  K.t+=performance.now()-t0;
  if(K.y<T)return null;   // עוד לא גמור: בינתיים הרצפה חלקה בצבע הזירה
  K.g.putImageData(K.img,0,0);ALOOK2.tile=K.c;ALOOK2.key=key;ALOOK2.pat=null;ALOOK2.stat.bakeMs=Math.round(K.t);ALOOK2.bake=null;
  return K.c;
}
// בפתיחה: אופים את האריח של הזירה הרגילה ברקע, בפרוסות קטנות, כדי שבכניסה לזירה הוא כבר מוכן
if(ARENA_LOOK.on)setTimeout(function warm(){if(typeof S==='undefined'||!S||S.vil===undefined&&!S.mode)return setTimeout(warm,300);if(!ALOOK2.tile&&!aLook2dTile(4))setTimeout(warm,24)},600);
// להבה של לפיד: שלוש טיפות בגוונים, מרצדות לפי הזמן
function aTorch2d(x,y,t,i){
  const L=ARENA_LOOK.line,fl=Math.sin(t*9+i*1.7)*0.5+0.5,fl2=Math.sin(t*13+i*2.3);
  ctx.fillStyle=L.wood2;ctx.fillRect(x-3,y-30,6,30);ctx.fillStyle=L.brass;ctx.fillRect(x-4,y-33,8,4);   // מוט עץ וטבעת פליז
  ctx.save();ctx.globalCompositeOperation='lighter';
  const gr=ctx.createRadialGradient(x,y-40,2,x,y-40,34+6*fl);gr.addColorStop(0,'rgba(255,170,70,0.35)');gr.addColorStop(1,'rgba(255,120,40,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y-40,40,0,7);ctx.fill();
  ctx.fillStyle='rgba(255,110,40,0.85)';ctx.beginPath();ctx.ellipse(x+fl2*1.5,y-42,5.5,9+3*fl,0,0,7);ctx.fill();
  ctx.fillStyle='rgba(255,200,90,0.9)';ctx.beginPath();ctx.ellipse(x-fl2,y-41,3.2,6+2*fl,0,0,7);ctx.fill();
  ctx.fillStyle='rgba(255,245,200,0.9)';ctx.beginPath();ctx.ellipse(x,y-39,1.6,3,0,0,7);ctx.fill();
  ctx.restore();
}
// אווירה מהספרייה (fxlib.js): גחליליות בזירה, גחלים ליד לפידים, אובך בקצה. פעם אחת לריצה (reset מנקה הכל)
function aLook2dFx(){
  const M=ARENA_LOOK.map2d,F=M.fx;if(typeof fxPlay!=='function'||ALOOK2.fxRun===S.run)return;ALOOK2.fxRun=S.run;ALOOK2.fx=[];
  const h=(i,j)=>{const x=Math.sin(i*91.7+j*17.3)*4375.5;return x-Math.floor(x)};
  for(let i=0;i<F.fireflies;i++){const a=h(i,1)*6.283,r=120+h(i,2)*700;ALOOK2.fx.push(fxPlay('fireflies',Math.cos(a)*r,Math.sin(a)*r,{loop:true,size:170,alpha:0.7,add:true}))}
  for(let i=0;i<F.embers;i++){const a=(i/F.embers)*6.283+0.26;ALOOK2.fx.push(fxPlay('sf_embers',Math.cos(a)*M.torchR,Math.sin(a)*M.torchR-40,{loop:true,size:120,alpha:0.8,add:true}))}
  for(let i=0;i<F.haze;i++){const a=(i/F.haze)*6.283+1.1;ALOOK2.fx.push(fxPlay('haze',Math.cos(a)*1000,Math.sin(a)*1000,{loop:true,size:260,alpha:0.35,under:true}))}
  for(let i=0;i<F.stars;i++){const a=h(i,5)*6.283,r=1150+h(i,6)*400;ALOOK2.fx.push(fxPlay('stars',Math.cos(a)*r,Math.sin(a)*r,{loop:true,size:60,alpha:0.6,add:true}))}
}
// render.js קורא בכל פריים בדו-ממד, אחרי translate(ox,oy). מחזיר true כשצייר (אחרת render.js מצייר את הסימנים הישנים)
function aLook2d(ox,oy){
  if(!ARENA_LOOK.on||!S||S.vil||S.wd||S.room||S.mb)return false;
  const t0=performance.now(),A=ARENA_LOOK,L=A.line,M=A.map2d,p=aLookPal(),tile=aLook2dTile(5),B=A.border;   // 5: עד כמה מילישניות של אפייה בפריים, אם האריח עוד לא מוכן
  const x0=-ox,y0=-oy,x1=x0+W,y1=y0+H,vis=(x,y,m)=>x>x0-m&&x<x1+m&&y>y0-m&&y<y1+m;
  // 1. הרצפה: דוגמה מהאריח, מיושרת לעולם (הקנבס כבר מוזז ל-ox,oy)
  if(tile){if(!ALOOK2.pat)ALOOK2.pat=ctx.createPattern(tile,'repeat');ctx.fillStyle=ALOOK2.pat;ctx.fillRect(x0,y0,W,H)}
  const dc=Math.hypot(Math.max(0,Math.max(x0,-x1)),Math.max(0,Math.max(y0,-y1))),dfar=Math.max(Math.hypot(x0,y0),Math.hypot(x1,y0),Math.hypot(x0,y1),Math.hypot(x1,y1));   // טווח המרחקים מהמרכז שעל המסך
  const ring=(r,w,col,al,dash)=>{if(r+w<dc||r-w>dfar)return;ctx.globalAlpha=al;ctx.strokeStyle=col;ctx.lineWidth=w;if(dash)ctx.setLineDash(dash);ctx.beginPath();ctx.arc(0,0,r,0,6.2832);ctx.stroke();if(dash)ctx.setLineDash([])};
  // 2. שיבוץ פליז במרכז: טבעות, רונות (קטעים על הטבעת החיצונית) ושש חותמות של סוגי הנזק, דולקות לפי השימוש
  for(const r of A.rings)ring(r,3,L.brass,0.32);
  const seg=6.2832*A.runes.r/A.runes.n;ring(A.runes.r,9,L.brass,0.16,[seg*0.55,seg*0.45]);
  if(A.sigil.r+60>dc&&A.sigil.r-60<dfar){const types=Object.keys(DMG.types).slice(0,6),hits=S.hits||{},tot=types.reduce((a,t)=>a+(hits[t]||0),0)||1,G=A.sigil;
    types.forEach((t,i)=>{const a=i*1.0472+0.5236,sx=Math.cos(a)*G.r,sy=Math.sin(a)*G.r;if(!vis(sx,sy,G.size+8))return;const sh=(hits[t]||0)/tot,lit=sh<G.min?0:Math.min(1,(sh-G.min)/(0.5-G.min));
      ctx.globalAlpha=0.22+0.5*lit;ctx.strokeStyle=DMG.types[t].col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,sy,G.size,0,7);ctx.moveTo(sx+G.size*0.62,sy);ctx.arc(sx,sy,G.size*0.62,0,7);ctx.stroke();
      if(lit>0){ctx.globalAlpha=0.18*lit;ctx.fillStyle=DMG.types[t].col;ctx.beginPath();ctx.arc(sx,sy,G.size,0,7);ctx.fill()}})}
  // 3. הגבול: שפת אבן כהה עם מסמרות פליז, טבעת קרשי עץ עם תפרים, קו פליז דק בשתי שפות העץ, וחושך מעבר
  const cm=(B.curb[0]+B.curb[1])/2,cw=B.curb[1]-B.curb[0],pm=(B.planks[0]+B.planks[1])/2,pw=B.planks[1]-B.planks[0];
  ring(cm,cw,L.curb,0.92);ring(pm,pw,L.wood,0.95);
  if(pm+pw>dc&&pm-pw<dfar){ctx.globalAlpha=0.6;ctx.strokeStyle=L.wood2;ctx.lineWidth=2;ctx.beginPath();
    for(let i=0;i<B.plankN;i++){const a=i/B.plankN*6.2832,ca=Math.cos(a),sa=Math.sin(a);if(!vis(ca*pm,sa*pm,pw))continue;ctx.moveTo(ca*B.planks[0],sa*B.planks[0]);ctx.lineTo(ca*B.planks[1],sa*B.planks[1])}ctx.stroke();
    ring(pm-pw*0.22,1.2,L.wood2,0.35);ring(pm+pw*0.2,1.2,L.wood2,0.3);   // סיבי עץ: שני קווים דקים לאורך הקרשים
    ring(B.planks[0],2,L.brass,0.55);ring(B.planks[1],2,L.brass,0.55)}
  if(cm+cw>dc&&cm-cw<dfar){ctx.globalAlpha=1;for(let i=0;i<B.studs;i++){const a=i/B.studs*6.2832,sx=Math.cos(a)*cm,sy=Math.sin(a)*cm;if(!vis(sx,sy,8))continue;
      ctx.fillStyle=L.brass;ctx.beginPath();ctx.arc(sx,sy,4,0,7);ctx.fill();ctx.fillStyle=L.brassHi;ctx.beginPath();ctx.arc(sx-1,sy-1.2,1.6,0,7);ctx.fill()}}
  if(dfar>B.planks[1]){const gr=ctx.createRadialGradient(0,0,B.planks[1],0,0,A.edge.to);gr.addColorStop(0,p.out+'99');gr.addColorStop(0.1,p.out+'c0');gr.addColorStop(1,p.out+'f4');ctx.globalAlpha=1;ctx.fillStyle=gr;ctx.fillRect(x0,y0,W,H)}
  // 4. הקהל בחושך מעבר לעץ: צלליות של ראשים וכתפיים שמתנדנדות, וקצת מהם עם עיניים שזוהרות בצבע הזירה
  const C2=M.crowd;ALOOK2.stat.crowd=0;
  if(C2.r[1]>dc&&C2.r[0]<dfar){const h=(i,j)=>{const x=Math.sin(i*91.7+j*17.3)*4375.5;return x-Math.floor(x)};
    for(let i=0;i<C2.n;i++){const a=i/C2.n*6.2832+h(i,1)*0.03,r=C2.r[0]+h(i,2)*(C2.r[1]-C2.r[0]),x=Math.cos(a)*r,y=Math.sin(a)*r+Math.sin(S.t*2.2+i*1.3)*C2.bob;if(!vis(x,y,30))continue;ALOOK2.stat.crowd++;
      const hr=7+h(i,3)*4,near=(r-C2.r[0])/(C2.r[1]-C2.r[0]);ctx.globalAlpha=0.75-0.35*near;ctx.fillStyle=L.curb;
      ctx.beginPath();ctx.ellipse(x,y+hr*1.9,hr*1.9,hr*1.2,0,0,7);ctx.fill();ctx.beginPath();ctx.arc(x,y,hr,0,7);ctx.fill();
      if(h(i,4)>0.7){ctx.globalAlpha=0.5+0.3*Math.sin(S.t*3+i);ctx.fillStyle=p.rune;ctx.fillRect(x-3,y-1,2,1.5);ctx.fillRect(x+1.5,y-1,2,1.5)}}}
  // 5. לפידים על השפה
  ALOOK2.stat.torches=0;ctx.globalAlpha=1;
  if(M.torchR+60>dc&&M.torchR-60<dfar)for(let i=0;i<B.torches;i++){const a=i/B.torches*6.2832+0.26,x=Math.cos(a)*M.torchR,y=Math.sin(a)*M.torchR;if(!vis(x,y,60))continue;ALOOK2.stat.torches++;aTorch2d(x,y,S.t,i)}
  ctx.globalAlpha=1;aLook2dFx();
  ALOOK2.stat.drawMs=performance.now()-t0;return true;
}
