/* הקרקע בעולם: מפה מצוירת לכל אזור (ניר, 1.11.2026, בחר "רך ומצויר" ושבילים בין השערים). התוכנית: docs/plan-ground.md (ענף research/ground-plan).
   מה יש בה: כתמים גדולים של עשב עשיר ויבש, שבילים שמחברים את השערים (מחושבים לבד מהשערים של האזור), חוף סביב המים,
   קצה כהה מחוץ לגבול, וצל מגע מתחת לעצים, סלעים ומקורות, כדי שלא ירחפו.
   איך: כשנכנסים לאזור, הכרטיס הגרפי מצייר את המפה פעם אחת לתמונה (bake, כמה אלפיות שנייה). בכל פריים הקרקע רק קוראת ממנה,
   אז המהירות כמו קודם. רק בעולם, רק בתלת-ממד. לא בכפר ולא בזירה. ?look=classic מכבה (כמו כל look-hd.js).
   אזור חדש: שורה ב-GROUND.pal. בלי שורה הוא מקבל את האחו. המים עצמם (צבע, זוהר לבה): W3D.regions ב-render3d.js */
const GROUND={
  // פלטה לכל אזור: base בסיס, lush כתמים עשירים, dry כתמים יבשים, path שביל, shore חוף סביב המים, out מחוץ לגבול.
  // rim: טבעת דקה ממש על שפת המים (קרח בהיר ברכס, זוהר לבה במדבר). shoreA: כמה חזק החוף
  pal:{
    meadow:{base:'#5f8f3e',lush:'#3f6e2e',dry:'#9aa64f',path:'#a88a5a',shore:'#6d6a3a',out:'#2d4a26'},
    lake:  {base:'#4c6f5a',lush:'#35564a',dry:'#7c8f6a',path:'#8a7f62',shore:'#8a8064',out:'#22362f'},
    ridge: {base:'#c9d6e2',lush:'#9fb2c6',dry:'#eef4fa',path:'#8c96a3',shore:'#7fb2d4',out:'#6f8197',rim:'#e6f8ff'},
    desert:{base:'#d2a463',lush:'#b98447',dry:'#e8c88c',path:'#9c6a3a',shore:'#4a2416',out:'#8a5a32',rim:'#ff8a2a'},
    storm: {base:'#5d5a6e',lush:'#454256',dry:'#7a7790',path:'#3a3846',shore:'#6e5fa6',out:'#2a2836'},
    shadow:{base:'#2a2140',lush:'#1b1430',dry:'#3c2f5a',path:'#4b3a70',shore:'#5b3f8c',out:'#0f0a18'}
  },
  res:4,                       // כמה פיקסלים של המשחק לכל נקודה בתמונה האפויה. פחות = חד יותר וכבד יותר
  margin:{w:1800,h:1600},      // כמה מעבר לגבול האזור אופים (שם הקצה הכהה). מעבר לזה: הצבע של out
  big:720,small:170,           // גודל הכתמים: הגדולים (עשיר מול בסיס) והקטנים (יבש)
  pathW:34,                    // רוחב השביל
  hub:{x:0,y:-120},            // הצומת שאליו מגיעים כל השבילים. אם הוא במים, הוא זז לשפה
  shoreW:46,shoreA:0.85,rimW:16,rimA:0.9,
  edge:{from:-40,to:90},       // הקצה הכהה: מתחיל 40 לפני הגבול ונגמר 90 אחריו
  shadow:{dark:0.42,size:1.5,dx:0.22,dy:-0.12,decor:{tree:40,rock:32},tower:1.2,gate:40},   // צל מגע: כמה כהה, פי כמה מהרדיוס, וקצת לכיוון שהשמש מטילה
  grain:{tile:240,lo:0.72,hi:0.42},   // גרגר עדין מעל המפה (קווי עשב ונקודות), כדי שמקרוב היא לא תיראה חלקה
  maxSeg:24,maxPond:10
};

(()=>{
  const on=()=>typeof HD!=='undefined'&&HD.on&&R3D.on&&R3D.ready;
  let mat=null,bk=null,key=null,box=null;
  const rgb=h=>{const n=parseInt(h.slice(1),16);return new THREE.Vector3((n>>16&255)/255,(n>>8&255)/255,(n&255)/255)};   // צבע כמו שהוא (sRGB), בלי המרה
  const NOISE=`
    float gH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float gN(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float a=gH(i),b=gH(i+vec2(1,0)),c=gH(i+vec2(0,1)),d=gH(i+vec2(1,1));return a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y;}
    float gF(vec2 p){return 0.5*gN(p)+0.3*gN(p*2.03+vec2(1.7,9.2))+0.2*gN(p*4.01+vec2(5.1,3.3));}`;

  // השבילים: מכל שער אל הצומת, בעיקול קל. מהשערים של האזור, אז אזור חדש מקבל שבילים לבד
  function segs(R){
    const gs=wGates(true),out=[],hub={x:GROUND.hub.x,y:GROUND.hub.y};
    for(const p of R.ponds||[]){const dx=hub.x-p.x,dy=hub.y-p.y,d=Math.hypot(dx,dy)||1,m=p.r+GROUND.pathW*1.6;if(d<m){hub.x=p.x+dx/d*m;hub.y=p.y+dy/d*m}}
    let k=1;
    for(const id in gs){const a=gs[id],mx=(a.x+hub.x)/2,my=(a.y+hub.y)/2,dx=hub.x-a.x,dy=hub.y-a.y,L=Math.hypot(dx,dy)||1,o=(hash(k++,3)-0.5)*0.35*L,m={x:mx-dy/L*o,y:my+dx/L*o};
      out.push([a.x,a.y,m.x,m.y],[m.x,m.y,hub.x,hub.y])}
    return out.slice(0,GROUND.maxSeg);
  }
  // צל מגע: מקורות, קישוטים מסביב, מגדלים ושערים
  function shadows(R){
    const D=GROUND.shadow,o=[];
    for(const n of S.nd.list)o.push([n.x,n.y,n.r*D.size]);
    for(const d of worldDecor())if(D.decor[d.kind])o.push([d.x,d.y,D.decor[d.kind]*(0.8+d.v*0.4)*D.size]);
    for(const t of R.towers||[])o.push([t.x,t.y,t.r*D.tower*D.size]);
    const gs=wGates(true);for(const k in gs)o.push([gs[k].x,gs[k].y,D.gate*D.size]);
    return o;
  }

  // האפייה: ריבוע אחד על כל התמונה, ואחריו כתמי הצל. הצבעים נשמרים כ-sRGB, והקרקע ממירה בקריאה
  let bakeScene,bakeCam,baseMat,shMesh;
  function bakeSetup(){
    bakeScene=new THREE.Scene();bakeCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    const v3=()=>new THREE.Vector3(),U={box:{value:new THREE.Vector4()},size:{value:new THREE.Vector2()},
      cBase:{value:v3()},cLush:{value:v3()},cDry:{value:v3()},cPath:{value:v3()},cShore:{value:v3()},cOut:{value:v3()},cRim:{value:v3()},
      seg:{value:Array.from({length:GROUND.maxSeg},()=>new THREE.Vector4())},pond:{value:Array.from({length:GROUND.maxPond},()=>new THREE.Vector3())},
      big:{value:0},small:{value:0},pathW:{value:0},shoreW:{value:0},shoreA:{value:0},rimW:{value:0},rimA:{value:0},eFrom:{value:0},eTo:{value:0}};
    baseMat=new THREE.ShaderMaterial({uniforms:U,depthTest:false,depthWrite:false,
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
      fragmentShader:`precision highp float;varying vec2 vUv;uniform vec4 box;uniform vec2 size;uniform vec3 cBase,cLush,cDry,cPath,cShore,cOut,cRim;
        uniform vec4 seg[${GROUND.maxSeg}];uniform vec3 pond[${GROUND.maxPond}];uniform float big,small,pathW,shoreW,shoreA,rimW,rimA,eFrom,eTo;${NOISE}
        void main(){
          vec2 p=box.xy+vUv*box.zw;float nb=gF(p/big),ns=gF(p/small+vec2(3.1,7.7));
          vec3 c=mix(cLush,cBase,smoothstep(0.32,0.58,nb));
          c=mix(c,cDry,smoothstep(0.6,0.82,ns)*0.5);
          float dp=1e5;for(int i=0;i<${GROUND.maxSeg};i++){vec2 a=seg[i].xy,b=seg[i].zw-a;float t=clamp(dot(p-a,b)/max(dot(b,b),1.0),0.0,1.0);dp=min(dp,length(p-a-b*t));}
          dp+=(gN(p/38.0)-0.5)*26.0;
          float pm=1.0-smoothstep(pathW*0.55,pathW,dp);
          c=mix(c,c*0.82,(1.0-smoothstep(pathW,pathW*1.5,dp))*(1.0-pm));
          c=mix(c,cPath*(0.9+0.2*gN(p/12.0)),pm);
          float ds=1e5;for(int i=0;i<${GROUND.maxPond};i++)ds=min(ds,length(p-pond[i].xy)-pond[i].z);
          float dn=ds+(gN(p/30.0)-0.5)*20.0;
          c=mix(c,cShore,(1.0-smoothstep(0.0,shoreW,dn))*shoreA);
          c=mix(c,cRim,(1.0-smoothstep(0.0,rimW,ds+(gN(p/14.0)-0.5)*6.0))*rimA);
          vec2 q=abs(p)-size*0.5;float de=max(q.x,q.y)+(gN(p/60.0)-0.5)*60.0;
          c=mix(c,cOut,smoothstep(eFrom,eTo,de));
          gl_FragColor=vec4(c,1.0);}`});
    const q=new THREE.Mesh(new THREE.PlaneGeometry(2,2),baseMat);q.frustumCulled=false;bakeScene.add(q);
  }
  function shadowMesh(list){
    if(shMesh){bakeScene.remove(shMesh);shMesh.geometry.dispose()}
    const g=new THREE.InstancedBufferGeometry(),pl=new THREE.PlaneGeometry(2,2);g.index=pl.index;g.setAttribute('position',pl.getAttribute('position'));
    g.setAttribute('sh',new THREE.InstancedBufferAttribute(new Float32Array(list.flat()),3));g.instanceCount=list.length;
    if(!shMesh||!shMesh.material.isShaderMaterial)shMesh={material:new THREE.ShaderMaterial({uniforms:{box:baseMat.uniforms.box,dark:{value:GROUND.shadow.dark},off:{value:new THREE.Vector2(GROUND.shadow.dx,GROUND.shadow.dy)}},
      transparent:true,depthTest:false,depthWrite:false,
      vertexShader:'attribute vec3 sh;uniform vec4 box;uniform vec2 off;varying vec2 vQ;void main(){vQ=position.xy;vec2 c=sh.xy+(position.xy+off)*sh.z;gl_Position=vec4((c-box.xy)/box.zw*2.0-1.0,0.0,1.0);}',
      fragmentShader:'precision highp float;uniform float dark;varying vec2 vQ;void main(){float d=length(vQ);gl_FragColor=vec4(0.0,0.0,0.0,(1.0-smoothstep(0.2,1.0,d))*dark);}'})};
    const m=new THREE.Mesh(g,shMesh.material);m.frustumCulled=false;m.renderOrder=1;bakeScene.add(m);shMesh=m;
  }
  function bake(reg){
    const t0=performance.now(),R=WR(),P_=GROUND.pal[reg]||GROUND.pal.meadow;
    if(!bakeScene)bakeSetup();
    const u=baseMat.uniforms,bw=R.size.w+GROUND.margin.w,bh=R.size.h+GROUND.margin.h,cw=Math.ceil(bw/GROUND.res),ch=Math.ceil(bh/GROUND.res);
    box=new THREE.Vector4(-bw/2,-bh/2,bw,bh);u.box.value.copy(box);u.size.value.set(R.size.w,R.size.h);
    for(const k of ['base','lush','dry','path','shore','out'])u['c'+k[0].toUpperCase()+k.slice(1)].value.copy(rgb(P_[k]));
    u.cRim.value.copy(rgb(P_.rim||P_.shore));u.rimA.value=P_.rim?GROUND.rimA:0;
    for(const k of ['big','small','pathW','shoreW','shoreA','rimW'])u[k].value=GROUND[k];u.eFrom.value=GROUND.edge.from;u.eTo.value=GROUND.edge.to;
    const sg=segs(R);u.seg.value.forEach((v,i)=>sg[i]?v.set(...sg[i]):v.set(9e4,9e4,9e4,9e4));
    const ps=R.ponds||[];u.pond.value.forEach((v,i)=>ps[i]?v.set(ps[i].x,ps[i].y,ps[i].r):v.set(9e4,9e4,1));
    shadowMesh(shadows(R));
    if(bk)bk.dispose();   // רק האזור הנוכחי שמור בזיכרון. חזרה לאזור אופה מחדש (אלפיות שנייה)
    bk=new THREE.WebGLRenderTarget(cw,ch,{depthBuffer:false,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,generateMipmaps:false});
    const r=R3D.r,prev=r.getRenderTarget(),ac=r.autoClear;r.autoClear=true;
    r.setRenderTarget(bk);r.render(bakeScene,bakeCam);r.setRenderTarget(prev);r.autoClear=ac;
    GROUND.bakeMs=Math.round(performance.now()-t0);
  }
  // הקרקע עצמה: קוראת את התמונה האפויה לפי המקום בעולם (לא לפי המשטח שזז עם המצלמה), ומוסיפה גרגר עדין
  function grainTex(){
    const T=256,c=document.createElement('canvas');c.width=c.height=T;const g=c.getContext('2d');let s=5;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
    g.fillStyle='rgb(220,220,220)';g.fillRect(0,0,T,T);
    for(let i=0;i<1300;i++){const x=rnd()*T,y=rnd()*T,l=2+rnd()*5,a=-1.2+rnd()*0.5,v=rnd()<0.55?245:175+rnd()*25;
      for(const dx of [-T,0,T])for(const dy of [-T,0,T]){g.strokeStyle='rgba('+v+','+v+','+v+',0.6)';g.lineWidth=1;g.beginPath();g.moveTo(x+dx,y+dy);g.lineTo(x+dx+Math.cos(a)*l,y+dy+Math.sin(a)*l);g.stroke()}}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;
  }
  function makeMat(){
    const m=new THREE.MeshLambertMaterial({map:grainTex(),color:0xffffff}),G=GROUND.grain;
    const U=m.userData.u={gSin:{value:1},gBake:{value:null},gBox:{value:new THREE.Vector4(0,0,1,1)},gTile:{value:G.tile},gLo:{value:G.lo},gHi:{value:G.hi}};
    m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
      sh.vertexShader='varying vec2 vGp;uniform float gSin;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 gW=modelMatrix*vec4(transformed,1.0);vGp=vec2(gW.x,gW.z*gSin);');
      sh.fragmentShader='varying vec2 vGp;uniform sampler2D gBake;uniform vec4 gBox;uniform float gTile,gLo,gHi;\n'+sh.fragmentShader.replace('#include <map_fragment>',
        'vec3 gC=pow(texture2D(gBake,clamp((vGp-gBox.xy)/gBox.zw,0.0,1.0)).rgb,vec3(2.2));vec4 gT=texture2D(map,vGp/gTile);diffuseColor.rgb=gC*(gLo+gHi*gT.r);')};
    return m;
  }
  // look-hd.js שואל בכל פריים: בעולם מקבל את החומר הזה, ובכל מקום אחר null (נשארת הקרקע של שלב 1)
  GROUND.mat=()=>{
    if(GROUND.failed||!on()||!(S&&S.wd&&!S.vil&&!S.room))return null;
    const reg=S.wd.reg||'meadow',k=reg+':'+S.nd.list.length;   // אם המקורות עוד לא היו כשנאפה, אופים שוב עם הצללים שלהם
    try{if(k!==key){key=k;bake(reg)}}catch(e){GROUND.failed=e.message;console.warn('ground',e);return null}   // תקלה: נשארת הקרקע של שלב 1
    if(!mat)mat=makeMat();
    const u=mat.userData.u;u.gBake.value=bk.texture;u.gBox.value.copy(box);u.gSin.value=SIN();
    return mat;
  };
})();
