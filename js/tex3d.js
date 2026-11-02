/* טקסטורה למבנים בתלת-ממד: פיילוט (ניר, 2.11.2026: "טקסטורה למבנים, כדי לגרום להם להיראות טוב יותר"). המסמך והצילומים: docs/plan-building-textures.md.
   כבוי לגמרי בלי ?tex=1 בכתובת: הקובץ לא נוגע בכלום.
   איך זה עובד: כל מבני KayKit צבועים מתמונה אחת קטנה של 8×4 משבצות צבע (palette). המשבצת שכל משטח לוקח אומרת מה הוא:
   אבן, עץ או גג. השיידר מזהה את המשבצת ומוסיף לה דוגמה באפור (אבנים, קרשים, רעפים) שמכפילה את הצבע, כך שהצבעים של KayKit נשארים.
   ובנוסף: צל רך בתחתית כל מבנה (כאילו האדמה מחשיכה אותו), שנותן לו משקל.
   הדוגמאות מצוירות כאן בקנבס (0 KB הורדה). אפשר להחליף אותן בתמונות CC0 או מ-Creative Claw בלי לגעת בשיידר: TEX3D.src.
   לא נוגע ב-render3d.js: מסמן את החומרים של המבנים (userData.tx) ומשנה את השיידר של Lambert רק לחומרים המסומנים. */
const TEX3D={
  on:/[?&]tex=1\b/.test(location.search),
  models:['v_castle','v_forge','v_mill','v_mine','v_market','v_gate','v_site','v_tent'],   // מי מקבל דוגמה. היום: מבני הכפר והשער
  // משבצת בתמונת הצבעים (עמודה,שורה) -> סוג: 1 אבן, 2 עץ, 3 רעפים. נמדד לפי השטח של כל משבצת במבנים (docs/plan-building-textures.md)
  cells:{'2,0':1,'3,0':1,'4,0':1,'6,0':2,'5,0':2,'7,0':2,'0,3':3,'1,3':3},
  size:{stone:0.42,wood:0.36,roof:0.30},   // כמה יחידות של המודל אריח אחד מכסה. קטן יותר = פרטים קטנים יותר
  strength:0.6,   // כמה חזקה הדוגמה (0: בלי, 1: מלא)
  ao:{h:0.28,k:0.32},   // הצל בתחתית: עד איזה גובה (חלק מגובה המבנה), וכמה כהה בתחתית
  src:null   // {stone,wood,roof}: כתובות data: של תמונות במקום הציור בקנבס (ראו המסמך)
};

(()=>{
  if(!TEX3D.on||typeof THREE==='undefined')return;
  let s=7;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
  const canvas=(f)=>{const T=256,c=document.createElement('canvas');c.width=c.height=T;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,T,T);f(g,T);return c};
  const shade=v=>'rgb('+v+','+v+','+v+')';
  // אבנים: שורות מוזזות, כל אבן בגוון קצת אחר, טיט כהה ביניהן
  const stone=()=>canvas((g,T)=>{const rows=4,h=T/rows;for(let r=0;r<rows;r++){const n=3,w=T/n,off=r%2?w/2:0;
    for(let i=-1;i<=n;i++){const x=i*w+off,v=Math.round(222+rnd()*33);g.fillStyle=shade(v);g.fillRect(x+3,r*h+3,w-6,h-6);
      g.fillStyle='rgba(255,255,255,0.35)';g.fillRect(x+3,r*h+3,w-6,4);g.fillStyle='rgba(0,0,0,0.12)';g.fillRect(x+3,r*h+h-8,w-6,5)}
    g.fillStyle=shade(150);g.fillRect(0,r*h,T,3);for(let i=-1;i<=n;i++)g.fillRect(i*w+off-2,r*h,4,h)}});
  // קרשים: לאורך, חריץ כהה בין קרש לקרש, וסיבים עדינים
  const wood=()=>canvas((g,T)=>{const n=5,w=T/n;for(let i=0;i<n;i++){const v=Math.round(225+rnd()*30);g.fillStyle=shade(v);g.fillRect(i*w,0,w,T);
    for(let k=0;k<7;k++){g.strokeStyle='rgba(0,0,0,'+(0.05+rnd()*0.07)+')';g.lineWidth=1+rnd()*1.5;const x=i*w+4+rnd()*(w-8);g.beginPath();g.moveTo(x,0);g.bezierCurveTo(x+rnd()*6-3,T*0.3,x+rnd()*6-3,T*0.7,x,T);g.stroke()}
    g.fillStyle=shade(105);g.fillRect(i*w,0,5,T);const y=rnd()*T;g.fillRect(i*w,y,w,3)}});
  // רעפים: שורות מוזזות, קשת כהה בתחתית כל רעף
  const roof=()=>canvas((g,T)=>{const rows=5,h=T/rows,n=4,w=T/n;for(let r=0;r<rows;r++){const off=r%2?w/2:0;
    for(let i=-1;i<=n;i++){const x=i*w+off,v=Math.round(222+rnd()*33);g.fillStyle=shade(v);g.beginPath();g.moveTo(x+2,r*h);g.lineTo(x+w-2,r*h);g.lineTo(x+w-2,r*h+h*0.6);
      g.quadraticCurveTo(x+w/2,r*h+h*1.08,x+2,r*h+h*0.6);g.closePath();g.fill();g.strokeStyle=shade(140);g.lineWidth=3;g.stroke()}}});
  const tex=(c)=>{const t=c instanceof HTMLCanvasElement?new THREE.CanvasTexture(c):new THREE.TextureLoader().load(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};
  const src=TEX3D.src||{};
  const T3={stone:tex(src.stone||stone()),wood:tex(src.wood||wood()),roof:tex(src.roof||roof())};
  const kinds=new Array(32).fill(0);for(const k in TEX3D.cells){const [c,r]=k.split(',').map(Number);kinds[r*8+c]=TEX3D.cells[k]}

  // השיידר: רק לחומר Lambert שמסומן ב-userData.tx. מועתק לכל עותק (clone מעתיק userData), כולל מבנה שזוהר
  const P=THREE.MeshLambertMaterial.prototype,obc=P.onBeforeCompile,key=P.customProgramCacheKey;
  P.customProgramCacheKey=function(){return (this.userData&&this.userData.tx?'tx3d|':'')+key.call(this)};
  P.onBeforeCompile=function(sh,r){
    obc.call(this,sh,r);if(!(this.userData&&this.userData.tx))return;
    sh.uniforms.txStone={value:T3.stone};sh.uniforms.txWood={value:T3.wood};sh.uniforms.txRoof={value:T3.roof};
    sh.uniforms.txKind={value:kinds};sh.uniforms.txH={value:this.userData.txH||1};sh.uniforms.txAo={value:this.userData.txAo??1};sh.uniforms.txY0={value:this.userData.txY0||0};
    sh.vertexShader='varying vec3 vTxP;varying vec3 vTxN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTxP=position;vTxN=normal;');
    const S=TEX3D.size,A=TEX3D.ao;
    sh.fragmentShader='varying vec3 vTxP;varying vec3 vTxN;uniform sampler2D txStone,txWood,txRoof;uniform float txKind[32];uniform float txH,txY0,txAo;\n'+
      sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n'+
      'vec3 tn=abs(normalize(vTxN));float th=tn.x>tn.z?vTxP.z:vTxP.x;'+   // לאורך הקיר
      'vec2 tw=tn.y>0.75?vTxP.xz:vec2(th,vTxP.y);'+   // קיר: לאורך ולגובה. משטח שטוח (רצפה, גג שטוח): מלמעלה
      'int tc=int(clamp(floor(vMapUv.x*8.0),0.0,7.0)+clamp(floor(vMapUv.y*4.0),0.0,3.0)*8.0);float tk=txKind[tc];float td=1.0;'+
      'if(tk>0.5&&tk<1.5)td=texture2D(txStone,tw/'+S.stone.toFixed(3)+').r;'+
      'else if(tk>1.5&&tk<2.5)td=texture2D(txWood,tw/'+S.wood.toFixed(3)+').r;'+
      'else if(tk>2.5)td=texture2D(txRoof,vec2(th,vTxP.y)/'+S.roof.toFixed(3)+').r;'+   // רעפים תמיד בשורות לפי הגובה, גם על גג משופע
      'diffuseColor.rgb*=mix(1.0,td,'+TEX3D.strength.toFixed(2)+');'+
      'float ty=clamp((vTxP.y-txY0)/(txH*'+A.h.toFixed(2)+'),0.0,1.0);diffuseColor.rgb*=1.0-txAo*'+A.k.toFixed(2)+'*(1.0-smoothstep(0.0,1.0,ty));');
  };

  // מסמנים את החומרים של המבנים פעם אחת, אחרי שהמודלים נטענו ולפני שהכפר נבנה
  let done=false;
  const base=window.render3d;
  window.render3d=function(...a){
    if(!done&&R3D.ready&&R3D.props){done=true;
      for(const k of TEX3D.models){const t=R3D.props[k];if(!t)continue;
        const all=new THREE.Box3().setFromObject(t),H=all.max.y-all.min.y||1;t.updateMatrixWorld(true);
        t.traverse(o=>{if(!o.isMesh)return;o.geometry.computeBoundingBox();const b=o.geometry.boundingBox,w=b.clone().applyMatrix4(o.matrixWorld),u=o.material.userData;
          // צל בתחתית רק לחלק שנוגע בקרקע (לא לכנפי הטחנה). הגובה: של כל המבנה, ביחידות של החלק
          u.tx=1;u.txAo=w.min.y-all.min.y<H*0.1?1:0;u.txY0=b.min.y;u.txH=H*(b.max.y-b.min.y||1)/(w.max.y-w.min.y||1);o.material.needsUpdate=true})}}
    return base.apply(this,a);
  };
})();
