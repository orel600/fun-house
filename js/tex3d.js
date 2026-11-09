/* טקסטורה למבנים ולטבע בתלת-ממד (ניר, 2.11.2026: "טקסטורה למבנים... ובכללי"). המחקר והפיילוט: docs/plan-building-textures.md.
   דלוק לכולם בכפר ובעולם הפתוח, כחלק מהמראה (look-hd.js): ?look=classic מכבה, וגם ?tex=0. בזירה ובמשחקי השאול: כבוי (txOn), לא נוגע בהם.
   איך זה עובד: מודלי KayKit צבועים מתמונה קטנה של 8×4 משבצות צבע. המשבצת שכל משטח לוקח אומרת מה הוא (אבן, עץ, גג, סלע, עלים...).
   השיידר מזהה את המשבצת ומכפיל את הצבע בדוגמה אפורה (אבנים, קרשים, רעפים, סדקים, עלים, בד, קליפה), כך שהצבעים של KayKit נשארים.
   חפצים שנבנים בקוד בלי תמונה (הגדר והפנסים ב-props3d.js) מקבלים סוג לפי הצבע שלהם (TEX3D.colors).
   הדוגמה נמדדת ביחידות של העולם (פיקסלים של המשחק), כך שאבן נראית באותו גודל בטירה ובסלע קטן, וגדולה מספיק לזום הרגיל בטלפון.
   ובנוסף: צל רך בתחתית כל מבנה (כאילו האדמה מחשיכה אותו), שנותן לו משקל.
   מהירות: אפס ציורים נוספים, ושלוש תמונות של 256 (כל דוגמה בערוץ צבע אחד). קריאת טקסטורה אחת לפיקסל. הדוגמאות מצוירות כאן בקנבס (0 KB הורדה).
   לא נוגע ב-render3d.js: מסמן את החומרים (userData.tx) ומשנה את השיידר של Lambert רק לחומרים המסומנים. */
const TEX3D={
  on:!/[?&]tex=0\b/.test(location.search)&&(typeof HD==='undefined'||HD.on),
  // סוגים: 1 אבן בנויה, 2 קרשים, 3 רעפים, 4 סלע טבעי, 5 עלים, 6 בד, 7 קליפת עץ
  // set 0: חבילת הכפר (KayKit Medieval Hexagon). משבצת (עמודה,שורה) -> סוג. נמדד לפי השטח של כל משבצת במודלים
  cells:{'2,0':1,'3,0':1,'4,0':1,'5,0':2,'6,0':2,'7,0':2,'2,1':2,'0,3':3,'1,3':3,'2,2':4,'1,2':5,'0,2':5,'3,3':5,'1,0':6,'5,1':6},
  // set 1: חבילת היער (KayKit Forest Nature, n_): עלים, גזע, סלע
  cellsN:{'0,0':5,'0,1':7,'0,2':4},
  // חריגים לפי מודל: הסוכך של השוק והדגל הם בד ולא רעפים, הגזע של עצי הכפר הוא קליפה ולא קרשים, והגבעה היא סלע
  over:{v_market:{'0,3':6},v_flag:{'0,3':6},v_treeA:{'6,0':7},v_treeB:{'6,0':7},v_hills:{'2,1':4}},
  ao:['v_castle','v_forge','v_mill','v_mine','v_market','v_gate','v_site','v_tent','vx_ruin','vx_stageA','vx_stageB','vx_stageC','vx_towerB'],   // מי מקבל צל בתחתית (המבנים)
  colors:{'#7a5532':2,'#5a3d24':2,'#b9bfc9':1,'#868d99':1,'#b24a32':3},   // חפצים בלי תמונה (PROPS3D.col): צבע -> סוג
  size:[0,56,30,30,64,38,20,24],   // כמה פיקסלים של העולם אריח אחד מכסה, לכל סוג. גדול יותר = אבנים/קרשים גדולים יותר
  strength:[0,0.85,0.7,0.7,0.75,0.6,0.35,0.6],   // כמה חזקה הדוגמה לכל סוג (0: בלי, 1: מלא)
  aoK:{h:0.28,k:0.34},
  // רוח בעצים (שלב 3 ב-docs/visual-plan.md): הצמרת זזה קלות, הבסיס במקום. הכל בשיידר, בלי עבודה במעבד.
  // amp: כמה רחוק הקצה זז (חלק מגובה העץ). speed: כמה מהר. trees: מי מתנועע
  wind:{amp:0.035,speed:1.5,trees:['n_tree','n_pine','n_acacia','n_bare','n_dead','n_bush','v_treeA','v_treeB']},   // הצל בתחתית: עד איזה גובה (חלק מגובה המבנה), וכמה כהה בתחתית
  src:null   // תמונה (data:) במקום הציור בקנבס: [A,B,C], כל אחת עם שלוש דוגמאות בערוצי R,G,B (ראו pack למטה)
};

(()=>{
  if(!TEX3D.on||typeof THREE==='undefined')return;
  let s=7;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
  const T=256,canvas=(f)=>{const c=document.createElement('canvas');c.width=c.height=T;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,T,T);f(g);return c};
  const shade=v=>'rgb('+v+','+v+','+v+')';
  // ציור שחוזר על עצמו: מצייר שוב בהזזה של אריח שלם, כדי שהתפר לא ייראה
  const wrap=(g,f)=>{for(const dx of [-T,0,T])for(const dy of [-T,0,T]){g.save();g.translate(dx,dy);f(g);g.restore()}};
  // הדוגמאות "עבות": מעט אבנים גדולות ותפרים רחבים, כי בזום הרגיל בטלפון אריח שלם הוא 20-30 פיקסלים, וקו דק נמחק
  // 1 אבנים: שתי שורות מוזזות, כל אבן ברוחב ובגוון אחר, אור למעלה וצל למטה, טיט כהה ועבה
  const stone=()=>canvas(g=>{const rows=2,h=T/rows;g.fillStyle=shade(70);g.fillRect(0,0,T,T);
    for(let r=0;r<rows;r++){let x=r%2?-T/4:0;while(x<T){const w=T/2*(0.75+rnd()*0.5),v=Math.round(200+rnd()*55),X=x,Y=r*h;
      wrap(g,g=>{g.fillStyle=shade(v);g.beginPath();g.roundRect?g.roundRect(X+9,Y+9,w-18,h-18,14):g.rect(X+9,Y+9,w-18,h-18);g.fill();
        g.fillStyle='rgba(255,255,255,0.45)';g.fillRect(X+18,Y+11,w-36,10);g.fillStyle='rgba(0,0,0,0.2)';g.fillRect(X+18,Y+h-26,w-36,14);
        for(let k=0;k<5;k++){g.fillStyle='rgba(0,0,0,'+(0.06+rnd()*0.08)+')';g.beginPath();g.arc(X+18+rnd()*(w-36),Y+18+rnd()*(h-36),5+rnd()*8,0,7);g.fill()}});x+=w}}});
  // 2 קרשים: שלושה קרשים, חריץ עמוק ועבה בין קרש לקרש, סיבים, ענף, ומסמרים
  const wood=()=>canvas(g=>{const n=3,w=T/n;for(let i=0;i<n;i++){const v=Math.round(205+rnd()*50);g.fillStyle=shade(v);g.fillRect(i*w,0,w,T);
    for(let k=0;k<6;k++){g.strokeStyle='rgba(0,0,0,'+(0.1+rnd()*0.1)+')';g.lineWidth=3+rnd()*3;const x=i*w+14+rnd()*(w-28);g.beginPath();g.moveTo(x,0);g.bezierCurveTo(x+rnd()*12-6,T*0.3,x+rnd()*12-6,T*0.7,x,T);g.stroke()}
    g.fillStyle='rgba(0,0,0,0.3)';g.beginPath();g.ellipse(i*w+w/2,rnd()*T,8,13,0,0,7);g.fill();
    g.fillStyle=shade(60);g.fillRect(i*w,0,12,T);g.fillStyle='rgba(255,255,255,0.35)';g.fillRect(i*w+12,0,6,T);
    const y=rnd()*T;g.fillStyle=shade(70);g.fillRect(i*w,y,w,9);g.fillStyle=shade(90);for(const yy of [y-22,y+26]){g.fillRect(i*w+20,yy,9,9);g.fillRect(i*w+w-29,yy,9,9)}}});
  // 3 רעפים: שלוש שורות מוזזות, קשת כהה ועבה בתחתית כל רעף
  const roof=()=>canvas(g=>{const rows=3,h=T/rows,n=3,w=T/n;g.fillStyle=shade(80);g.fillRect(0,0,T,T);for(let r=0;r<rows;r++){const off=r%2?w/2:0;
    for(let i=-1;i<=n;i++){const x=i*w+off,v=Math.round(205+rnd()*50);g.fillStyle=shade(v);g.beginPath();g.moveTo(x+4,r*h);g.lineTo(x+w-4,r*h);g.lineTo(x+w-4,r*h+h*0.6);
      g.quadraticCurveTo(x+w/2,r*h+h*1.1,x+4,r*h+h*0.6);g.closePath();g.fill();g.strokeStyle=shade(75);g.lineWidth=9;g.stroke();
      g.fillStyle='rgba(255,255,255,0.35)';g.fillRect(x+12,r*h+6,w-24,8)}}});
  // 4 סלע טבעי: פאות גדולות בהירות וכהות, וסדקים עבים
  const rock=()=>canvas(g=>{g.fillStyle=shade(200);g.fillRect(0,0,T,T);for(let i=0;i<26;i++){const x=rnd()*T,y=rnd()*T,r=22+rnd()*40,v=Math.round(150+rnd()*105);
      wrap(g,g=>{g.fillStyle='rgba('+v+','+v+','+v+',0.75)';g.beginPath();const k=5+Math.floor(rnd()*3);for(let j=0;j<k;j++){const a=j/k*6.28+rnd()*0.5,d=r*(0.7+rnd()*0.4);g.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d)}g.closePath();g.fill()})}
    for(let i=0;i<6;i++){let x=rnd()*T,y=rnd()*T,a=rnd()*6.28;const pts=[[x,y]];for(let j=0;j<6;j++){a+=rnd()-0.5;x+=Math.cos(a)*22;y+=Math.sin(a)*22;pts.push([x,y])}
      wrap(g,g=>{g.strokeStyle=shade(60);g.lineWidth=7;g.lineJoin='round';g.beginPath();pts.forEach(p=>g.lineTo(p[0],p[1]));g.stroke();g.strokeStyle='rgba(255,255,255,0.5)';g.lineWidth=3;g.beginPath();pts.forEach(p=>g.lineTo(p[0]+5,p[1]+5));g.stroke()})}});
  // 5 עלים: אשכולות עגולים גדולים שחופפים, צל כהה בתחתית כל אשכול ונקודת אור למעלה
  const leaf=()=>canvas(g=>{g.fillStyle=shade(110);g.fillRect(0,0,T,T);for(let i=0;i<26;i++){const x=rnd()*T,y=rnd()*T,r=26+rnd()*18,v=Math.round(200+rnd()*55);
    wrap(g,g=>{g.fillStyle=shade(85);g.beginPath();g.arc(x,y+8,r,0,7);g.fill();g.fillStyle=shade(v);g.beginPath();g.arc(x,y,r,0,7);g.fill();
      g.fillStyle='rgba(255,255,255,0.4)';g.beginPath();g.arc(x-r*0.3,y-r*0.35,r*0.35,0,7);g.fill()})}});
  // 6 בד: אריג, פסים לשני הכיוונים
  const cloth=()=>canvas(g=>{for(let i=0;i<T;i+=16){g.fillStyle='rgba(0,0,0,0.16)';g.fillRect(i,0,6,T);g.fillStyle='rgba(0,0,0,0.1)';g.fillRect(0,i+8,T,6)}});
  // 7 קליפת עץ: קווים עבים מתפתלים לגובה
  const bark=()=>canvas(g=>{for(let i=0;i<10;i++){const x=rnd()*T,v=Math.round(60+rnd()*60);g.strokeStyle=shade(v);g.lineWidth=7+rnd()*8;g.lineCap='round';
    wrap(g,g=>{g.beginPath();g.moveTo(x,-10);for(let y=0;y<=T+10;y+=32)g.lineTo(x+Math.sin(y*0.05+i)*9,y);g.stroke()})}});
  // שלוש תמונות, כל אחת שלוש דוגמאות בערוצי R,G,B: [אבן,קרשים,רעפים] [סלע,עלים,בד] [קליפה]
  const pack=(a,b,c)=>{const o=document.createElement('canvas');o.width=o.height=T;const g=o.getContext('2d'),out=g.createImageData(T,T),D=[a,b,c].map(x=>x?x.getContext('2d').getImageData(0,0,T,T).data:null);
    for(let i=0;i<T*T*4;i+=4){out.data[i]=D[0]?D[0][i]:255;out.data[i+1]=D[1]?D[1][i]:255;out.data[i+2]=D[2]?D[2][i]:255;out.data[i+3]=255}g.putImageData(out,0,0);return o};
  const tex=(c)=>{const t=c instanceof HTMLCanvasElement?new THREE.CanvasTexture(c):new THREE.TextureLoader().load(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};
  const src=TEX3D.src||[];
  const TX=[tex(src[0]||pack(stone(),wood(),roof())),tex(src[1]||pack(rock(),leaf(),cloth())),tex(src[2]||pack(bark()))];
  const kindsOf=(set,over)=>{const k=new Array(32).fill(0),c=Object.assign({},set?TEX3D.cellsN:TEX3D.cells,over||{});for(const q in c){const [x,y]=q.split(',').map(Number);k[y*8+x]=c[q]}return k};
  const txOn={value:0},txTime={value:0};   // 1 רק בכפר ובעולם. בזירה ובשאול הדוגמה כבויה גם בחומרים המסומנים
  TEX3D.uOn=txOn;

  // השיידר: רק לחומר Lambert שמסומן ב-userData.tx. מועתק לכל עותק (clone מעתיק userData), כולל מבנה שזוהר וצבוע
  const PR=THREE.MeshLambertMaterial.prototype,obc=PR.onBeforeCompile,key=PR.customProgramCacheKey;
  PR.customProgramCacheKey=function(){return (this.userData&&this.userData.tx?'tx3d|':'')+key.call(this)};
  PR.onBeforeCompile=function(sh,r){
    obc.call(this,sh,r);const u=this.userData;if(!(u&&u.tx))return;
    sh.uniforms.txA={value:TX[0]};sh.uniforms.txB={value:TX[1]};sh.uniforms.txC={value:TX[2]};sh.uniforms.txOn=txOn;sh.uniforms.txTime=txTime;sh.uniforms.txWind={value:u.txWind||0};sh.uniforms.txWY0={value:u.txWY0||0};sh.uniforms.txWH={value:u.txWH||1};
    sh.uniforms.txKind={value:u.txKind||kindsOf(0)};sh.uniforms.txK={value:u.txK||0};
    sh.uniforms.txH={value:u.txH||1};sh.uniforms.txAo={value:u.txAo||0};sh.uniforms.txY0={value:u.txY0||0};
    sh.uniforms.txSize={value:TEX3D.size.map(x=>1/(x||1))};sh.uniforms.txStr={value:TEX3D.strength};
    sh.vertexShader='varying vec3 vTxP;varying vec3 vTxW;varying vec3 vTxN;uniform float txOn,txTime,txWind,txWY0,txWH;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTxP=position;vTxW=position*length(modelMatrix[0].xyz);vTxN=normal;'+
      // רוח: לפי הגובה בריבוע (הגזע כמעט לא זז), ושלב לפי המקום בעולם כדי שהעצים לא יזוזו יחד
      'if(txOn>0.5&&txWind>0.0){float wh=clamp((position.y-txWY0)/txWH,0.0,1.5);wh*=wh;vec3 wq=modelMatrix[3].xyz;float wt=txTime*'+TEX3D.wind.speed.toFixed(2)+'+wq.x*0.013+wq.z*0.017;'+
      'transformed.x+=(sin(wt)+0.35*sin(wt*2.3))*wh*txWind;transformed.z+=cos(wt*0.8)*wh*txWind*0.6;}');
    const A=TEX3D.aoK;
    sh.fragmentShader='varying vec3 vTxP;varying vec3 vTxW;varying vec3 vTxN;uniform sampler2D txA,txB,txC;uniform float txKind[32];uniform float txSize[8];uniform float txStr[8];uniform float txK,txH,txY0,txAo,txOn;\n'+
      sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nif(txOn>0.5){'+
      'vec3 tn=abs(normalize(vTxN));float th=tn.x>tn.z?vTxW.z:vTxW.x;'+   // לאורך הקיר
      'vec2 tw=tn.y>0.75?vTxW.xz:vec2(th,vTxW.y);'+   // קיר: לאורך ולגובה. משטח שטוח (רצפה, גג שטוח): מלמעלה
      'float tk=txK;\n#ifdef USE_MAP\nif(tk<0.5)tk=txKind[int(clamp(floor(vMapUv.x*8.0),0.0,7.0)+clamp(floor(vMapUv.y*4.0),0.0,3.0)*8.0)];\n#endif\n'+
      'int ki=int(tk+0.5);float td=1.0;'+
      'if(ki==3)tw=vec2(th,vTxW.y);'+   // רעפים תמיד בשורות לפי הגובה, גם על גג משופע
      'vec2 tq=tw*txSize[ki];'+
      'if(ki==1)td=texture2D(txA,tq,-0.6).r;else if(ki==2)td=texture2D(txA,tq,-0.6).g;else if(ki==3)td=texture2D(txA,tq,-0.6).b;'+
      'else if(ki==4)td=texture2D(txB,tq,-0.6).r;else if(ki==5)td=texture2D(txB,tq,-0.6).g;else if(ki==6)td=texture2D(txB,tq,-0.6).b;else if(ki==7)td=texture2D(txC,tq,-0.6).r;'+
      'diffuseColor.rgb*=mix(1.0,td,txStr[ki]);'+
      'float ty=clamp((vTxP.y-txY0)/(txH*'+A.h.toFixed(2)+'),0.0,1.0);diffuseColor.rgb*=1.0-txAo*'+A.k.toFixed(2)+'*(1.0-smoothstep(0.0,1.0,ty));}');
  };

  // מסמנים את החומרים של כל מודלי הכפר והטבע (v_, n_) פעם אחת, אחרי שהמודלים נטענו ולפני שהכפר נבנה
  let done=false;
  function mark(){for(const k in R3D.props)markOne(k)}
  // מודל אחד. גם למודל שמגיע אחר כך (vx_, שלבי הכפר שנטענים בכניסה לכפר, m3dDecode ב-m3d.js)
  function markOne(k){
    {if(!/^(v|n|vx)_/.test(k))return;const t=R3D.props[k],ao=TEX3D.ao.includes(k),kinds=kindsOf(k[0]==='n'?1:0,TEX3D.over[k]);
      const all=new THREE.Box3().setFromObject(t),H=all.max.y-all.min.y||1;t.updateMatrixWorld(true);
      t.traverse(o=>{if(!o.isMesh||!o.material.isMeshLambertMaterial)return;const m=o.material,u=m.userData;
        if(!m.map){const c='#'+m.color.getHexString();if(!TEX3D.colors[c])return;u.txK=TEX3D.colors[c]}   // בנוי בקוד (קקטוס, קני סוף): רק לפי הצבע
        u.tx=1;u.txKind=kinds;
        if(TEX3D.wind.trees.includes(k)){o.geometry.computeBoundingBox();const b=o.geometry.boundingBox,w=b.clone().applyMatrix4(o.matrixWorld),r=(b.max.y-b.min.y||1)/(w.max.y-w.min.y||1);
          u.txWY0=b.min.y-(w.min.y-all.min.y)*r;u.txWH=H*r;u.txWind=TEX3D.wind.amp*H*r}   // הגובה והבסיס של כל העץ, ביחידות של החלק
        if(ao){o.geometry.computeBoundingBox();const b=o.geometry.boundingBox,w=b.clone().applyMatrix4(o.matrixWorld);
          // צל בתחתית רק לחלק שנוגע בקרקע (לא לכנפי הטחנה). הגובה: של כל המבנה, ביחידות של החלק
          u.txAo=w.min.y-all.min.y<H*0.1?1:0;u.txY0=b.min.y;u.txH=H*(b.max.y-b.min.y||1)/(w.max.y-w.min.y||1)}
        m.needsUpdate=true})}
  }
  window.tx3dMark=k=>{if(done)markOne(k)};
  // חפצים מצורות פשוטות (props3d.js): הגדר והעמודים מעץ, האבן. לפי הצבע
  const pm=window.p3Mat;
  if(typeof pm==='function')window.p3Mat=function(c,glow){const m=pm(c,glow),k=!glow&&TEX3D.colors[String(c).toLowerCase()];if(k&&!m.userData.tx){m.userData.tx=1;m.userData.txK=k;m.needsUpdate=true}return m};
  const base=window.render3d;
  window.render3d=function(...a){
    if(!done&&R3D.ready&&R3D.props){done=true;mark()}
    txOn.value=S&&(S.vil||S.wd)&&!S.room?1:0;txTime.value=performance.now()/1000%1000;
    return base.apply(this,a);
  };
})();
