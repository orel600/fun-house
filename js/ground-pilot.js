/* פיילוט קרקע (מחקר בלבד, ענף research/ground-plan, לא נכנס למשחק). התוכנית: docs/plan-ground.md.
   נדלק רק עם ?ground=A / B / C בכתובת, ורק בעולם הפתוח בתלת-ממד. בלי הדגל הקובץ לא עושה כלום.
   A: קרקע מצוירת בשיידר: פלטה לכל אזור, כתמים גדולים מרעש (בלי חזרה בכלל), שבילים בין השערים, חוף סביב מים, וקצה כהה מחוץ לגבול. ציור אחד.
   B: רשת low-poly: משטח מפאות קטנות עם צבע בכל קודקוד ושיפוע קל, כמו הסגנון של KayKit ו-Dorfromantik. אותם צבעים ושבילים, נאפים פעם אחת.
   D: כמו A, אבל הצבעים נאפים פעם אחת לתמונה בכניסה לאזור (bake), והשיידר רק קורא אותה. אותו מראה, בלי החישוב בכל פיקסל.
   C: D ועוד פיזור: גושי עשב שזזים ברוח, פרחים ואבנים (באחו), אבנים ושיחים יבשים (במדבר), גושי שלג וקרח (ברכס). 3 ציורים נוספים (instancing). */
const GP={
  mode:(location.search.match(/[?&]ground=([ABCD])/)||[])[1]||null,
  // פלטה לכל אזור: base הבסיס, lush כתמים כהים/עשירים, dry כתמים בהירים/יבשים, path שביל, shore חוף סביב מים, out מחוץ לגבול
  pal:{
    meadow:{base:'#5f8f3e',lush:'#3f6e2e',dry:'#9aa64f',path:'#a88a5a',shore:'#6d6a3a',out:'#2d4a26'},
    lake:  {base:'#4c6f5a',lush:'#35564a',dry:'#7c8f6a',path:'#8a7f62',shore:'#9a9070',out:'#22362f'},
    ridge: {base:'#c9d6e2',lush:'#9fb2c6',dry:'#eef4fa',path:'#8c96a3',shore:'#7fb5d6',out:'#6f8197'},
    desert:{base:'#d2a463',lush:'#b98447',dry:'#e8c88c',path:'#9c6a3a',shore:'#5a2a18',out:'#8a5a32'},
    storm: {base:'#5d5a6e',lush:'#454256',dry:'#7a7790',path:'#3a3846',shore:'#6e5fa6',out:'#2a2836'},
    shadow:{base:'#2a2140',lush:'#1b1430',dry:'#3c2f5a',path:'#4b3a70',shore:'#5b3f8c',out:'#0f0a18'}
  },
  big:720,small:170,pathW:34,shoreW:46,
  // פיזור (C): כמה מכל סוג בכל אזור. col: צבעים אפשריים
  scatter:{
    meadow:{tuft:{n:2200,col:['#4f8a34','#5f9a3a','#6fa844','#3f7a2c']},flower:{n:320,col:['#ffffff','#ffd94a','#ff8fb0','#b58cff','#ffb347']},pebble:{n:160,col:['#9a9a92','#7d7f78','#b0aa9a']}},
    desert:{tuft:{n:380,col:['#a8925a','#8f7a44','#b9a46a']},flower:{n:0},pebble:{n:520,col:['#a0703f','#8a5a32','#c08d55','#6e4a2c']}},
    ridge: {tuft:{n:260,col:['#7f8f7a','#6a7a6c']},flower:{n:140,col:['#bfe8ff','#9fd8f0','#e6f7ff']},pebble:{n:420,col:['#f4f8fc','#dfe8f0','#c9d6e2']}}
  }
};

(()=>{
  if(!GP.mode)return;
  let mat=null,regKey=null,scat={},lowp={},baked={},t0=performance.now();
  const col=h=>new THREE.Color(h);
  // אותו רעש בשיידר וב-JS (B צריך אותו ב-JS)
  const hash=(x,y)=>{const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s)};
  const vnoise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);
    const a=hash(ix,iy),b=hash(ix+1,iy),c=hash(ix,iy+1),d=hash(ix+1,iy+1);return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy};
  const fbm=(x,y)=>0.5*vnoise(x,y)+0.3*vnoise(x*2.03+1.7,y*2.03+9.2)+0.2*vnoise(x*4.01+5.1,y*4.01+3.3);
  const GLSL_NOISE=`
    float gpH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float gpN(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float a=gpH(i),b=gpH(i+vec2(1,0)),c=gpH(i+vec2(0,1)),d=gpH(i+vec2(1,1));return a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y;}
    float gpF(vec2 p){return 0.5*gpN(p)+0.3*gpN(p*2.03+vec2(1.7,9.2))+0.2*gpN(p*4.01+vec2(5.1,3.3));}`;

  // השבילים: מכל שער אל צומת אחד, בעיקול קל. מחושב מהשערים של האזור, אז אזור חדש מקבל שבילים לבד
  function segs(){
    const gs=wGates(true),hub={x:0,y:-120},out=[];
    const link=(a,b,k)=>{const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,o=(hash(k,3)-0.5)*0.35*L;
      const m={x:mx-dy/L*o,y:my+dx/L*o};out.push([a.x,a.y,m.x,m.y],[m.x,m.y,b.x,b.y])};
    let k=1;for(const id in gs)link(gs[id],hub,k++);
    return out.slice(0,16);
  }
  // מה מותר לפזר עליו: לא על שביל, לא במים, ולא על מקור משאבים
  const dSeg=(x,y,s)=>{const ax=s[0],ay=s[1],bx=s[2]-ax,by=s[3]-ay,t=Math.max(0,Math.min(1,((x-ax)*bx+(y-ay)*by)/(bx*bx+by*by||1)));return Math.hypot(x-ax-bx*t,y-ay-by*t)};
  function free(x,y,S_){const R=WR();
    for(const s of S_)if(dSeg(x,y,s)<GP.pathW*1.1)return false;
    for(const p of (R.ponds||[]).concat(R.towers||[]))if(Math.hypot(x-p.x,y-p.y)<p.r+14)return false;
    for(const n of S.nd.list)if(Math.hypot(x-n.x,y-n.y)<n.r+10)return false;
    return true}

  function detailTex(){   // אריח פרטים קטן, אפור (הצבע מהפלטה). כמו ב-look-hd: קווי עשב ונקודות
    const T=256,c=document.createElement('canvas');c.width=c.height=T;const g=c.getContext('2d');let s=5;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
    g.fillStyle='rgb(220,220,220)';g.fillRect(0,0,T,T);
    for(let i=0;i<1300;i++){const x=rnd()*T,y=rnd()*T,l=2+rnd()*5,a=-1.2+rnd()*0.5,v=rnd()<0.55?245:175+rnd()*25;
      for(const dx of [-T,0,T])for(const dy of [-T,0,T]){g.strokeStyle='rgba('+v+','+v+','+v+',0.6)';g.lineWidth=1;g.beginPath();g.moveTo(x+dx,y+dy);g.lineTo(x+dx+Math.cos(a)*l,y+dy+Math.sin(a)*l);g.stroke()}}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t}

  // A: החומר. הצבע נקבע לפי המקום בעולם (x,y של המשחק), אז הקרקע לא זזה עם המצלמה ולא חוזרת על עצמה
  function makeMat(){
    const m=new THREE.MeshLambertMaterial({map:detailTex(),color:0xffffff});
    const U=m.userData.u={gpSin:{value:SIN()},gpBase:{value:col('#fff')},gpLush:{value:col('#fff')},gpDry:{value:col('#fff')},gpPath:{value:col('#fff')},gpShore:{value:col('#fff')},gpOut:{value:col('#fff')},
      gpSeg:{value:Array.from({length:16},()=>new THREE.Vector4(9e4,9e4,9e4,9e4))},gpPond:{value:Array.from({length:8},()=>new THREE.Vector3(9e4,9e4,1))},gpSize:{value:new THREE.Vector2(2100,1400)},
      gpBig:{value:GP.big},gpSmall:{value:GP.small},gpPathW:{value:GP.pathW},gpShoreW:{value:GP.shoreW}};
    m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
      sh.vertexShader='varying vec2 vGp;uniform float gpSin;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 gpW=modelMatrix*vec4(transformed,1.0);vGp=vec2(gpW.x,gpW.z*gpSin);');
      sh.fragmentShader=`varying vec2 vGp;uniform vec3 gpBase,gpLush,gpDry,gpPath,gpShore,gpOut;uniform vec4 gpSeg[16];uniform vec3 gpPond[8];uniform vec2 gpSize;uniform float gpBig,gpSmall,gpPathW,gpShoreW;`+GLSL_NOISE+'\n'+
        sh.fragmentShader.replace('#include <map_fragment>',`
        vec2 p=vGp;float nb=gpF(p/gpBig),ns=gpF(p/gpSmall+vec2(3.1,7.7));
        vec3 c=mix(gpLush,gpBase,smoothstep(0.32,0.58,nb));
        c=mix(c,gpDry,smoothstep(0.6,0.82,ns)*0.5);
        float dp=1e5;for(int i=0;i<16;i++){vec2 a=gpSeg[i].xy,b=gpSeg[i].zw-a;float t=clamp(dot(p-a,b)/max(dot(b,b),1.0),0.0,1.0);dp=min(dp,length(p-a-b*t));}
        dp+= (gpN(p/38.0)-0.5)*26.0;
        float pm=1.0-smoothstep(gpPathW*0.55,gpPathW,dp);
        c=mix(c,c*0.82,(1.0-smoothstep(gpPathW,gpPathW*1.5,dp))*(1.0-pm));
        c=mix(c,gpPath*(0.9+0.2*gpN(p/12.0)),pm);
        float ds=1e5;for(int i=0;i<8;i++)ds=min(ds,length(p-gpPond[i].xy)-gpPond[i].z);
        ds+=(gpN(p/30.0)-0.5)*20.0;
        c=mix(c,gpShore,(1.0-smoothstep(0.0,gpShoreW,ds))*0.85);
        vec2 q=abs(p)-gpSize*0.5;float de=max(q.x,q.y)+(gpN(p/60.0)-0.5)*60.0;
        c=mix(c,gpOut,smoothstep(-40.0,90.0,de));
        vec4 td=texture2D(map,p/240.0);
        diffuseColor.rgb=c*(0.72+0.42*td.r);`)};
    return m}
  function setRegion(m,reg){
    const P_=GP.pal[reg]||GP.pal.meadow,U=m.userData.u,R=WR();
    for(const k of ['base','lush','dry','path','shore','out'])U['gp'+k[0].toUpperCase()+k.slice(1)].value.set(P_[k]);
    const sg=segs();U.gpSeg.value.forEach((v,i)=>sg[i]?v.set(...sg[i]):v.set(9e4,9e4,9e4,9e4));
    const ps=R.ponds||[];U.gpPond.value.forEach((v,i)=>ps[i]?v.set(ps[i].x,ps[i].y,ps[i].r):v.set(9e4,9e4,1));
    U.gpSize.value.set(R.size.w,R.size.h);U.gpSin.value=SIN();
  }
  // D: אופים את A לתמונה אחת לאזור (6 פיקסלים של המשחק לכל נקודה), ומחברים אליה את אריח הפרטים
  function makeBaked(reg){
    const R=WR(),P_=GP.pal[reg]||GP.pal.meadow,sg=segs(),k=6,bw=R.size.w+1800,bh=R.size.h+1600,cw=Math.ceil(bw/k),ch=Math.ceil(bh/k);
    const c=document.createElement('canvas');c.width=cw;c.height=ch;const g=c.getContext('2d'),d=g.createImageData(cw,ch),px=d.data;
    for(let j=0;j<ch;j++)for(let i=0;i<cw;i++){const x=-bw/2+(i+0.5)*k,y=-bh/2+(j+0.5)*k,q=colorAt(x,y,P_,sg,R).convertLinearToSRGB(),o=(j*cw+i)*4;
      px[o]=q.r*255;px[o+1]=q.g*255;px[o+2]=q.b*255;px[o+3]=255}
    g.putImageData(d,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.flipY=false;
    const m=new THREE.MeshLambertMaterial({map:detailTex(),color:0xffffff}),U={gpSin:{value:SIN()},gpBake:{value:t},gpBox:{value:new THREE.Vector4(-bw/2,-bh/2,bw,bh)}};
    m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
      sh.vertexShader='varying vec2 vGp;uniform float gpSin;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 gpW=modelMatrix*vec4(transformed,1.0);vGp=vec2(gpW.x,gpW.z*gpSin);');
      sh.fragmentShader='varying vec2 vGp;uniform sampler2D gpBake;uniform vec4 gpBox;\n'+sh.fragmentShader.replace('#include <map_fragment>',
        'vec3 c=texture2D(gpBake,clamp((vGp-gpBox.xy)/gpBox.zw,0.0,1.0)).rgb;vec4 td=texture2D(map,vGp/240.0);diffuseColor.rgb=c*(0.72+0.42*td.r);')};
    return m}
  // הצבע של נקודה, ב-JS (בשביל B): אותם חישובים כמו בשיידר, בלי הפרטים הקטנים
  function colorAt(x,y,P_,sg,R){
    const nb=fbm(x/GP.big,y/GP.big),ns=fbm(x/GP.small+3.1,y/GP.small+7.7),ss=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};
    const c=col(P_.lush).lerp(col(P_.base),ss(0.32,0.58,nb)).lerp(col(P_.dry),ss(0.6,0.82,ns)*0.5);
    let dp=1e5;for(const s of sg)dp=Math.min(dp,dSeg(x,y,s));dp+=(vnoise(x/38,y/38)-0.5)*26;
    const pm=1-ss(GP.pathW*0.55,GP.pathW,dp);c.lerp(col(P_.path),pm);
    let ds=1e5;for(const p of R.ponds||[])ds=Math.min(ds,Math.hypot(x-p.x,y-p.y)-p.r);c.lerp(col(P_.shore),(1-ss(0,GP.shoreW,ds))*0.85);
    const de=Math.max(Math.abs(x)-R.size.w/2,Math.abs(y)-R.size.h/2);c.lerp(col(P_.out),ss(-40,90,de));
    return c}
  // B: משטח low-poly. מפאות של בערך 55 פיקסלים, קודקודים מוזזים קצת, שיפוע קל, וכל מפאה בגוון שונה מעט
  function makeLowPoly(reg){
    const R=WR(),P_=GP.pal[reg]||GP.pal.meadow,sg=segs(),st=55,mw=R.size.w+1800,mh=R.size.h+1600,nx=Math.ceil(mw/st),ny=Math.ceil(mh/st),sin=SIN();
    const pts=[];for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const x=-mw/2+i*st+(i&&i<nx?(hash(i,j)-0.5)*st*0.6:0),y=-mh/2+j*st+(j&&j<ny?(hash(j,i+9)-0.5)*st*0.6:0);
      pts.push([x,y,-fbm(x/260,y/260)*10])}
    const pos=[],cols=[],id=(i,j)=>j*(nx+1)+i;
    const tri=(a,b,c)=>{const cx=(a[0]+b[0]+c[0])/3,cy=(a[1]+b[1]+c[1])/3,k=colorAt(cx,cy,P_,sg,R).multiplyScalar(0.96+hash(cx,cy)*0.08);
      for(const v of [a,b,c]){pos.push(v[0],v[2],v[1]/sin);cols.push(k.r,k.g,k.b)}};
    for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=pts[id(i,j)],b=pts[id(i+1,j)],c=pts[id(i,j+1)],d=pts[id(i+1,j+1)];
      if(hash(i,j+3)<0.5){tri(a,c,b);tri(b,c,d)}else{tri(a,c,d);tri(a,d,b)}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));g.computeVertexNormals();
    const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true}));
    return m}
  // C: פיזור. שלושה סוגים, כל סוג ציור אחד (InstancedMesh). העשב והפרחים זזים ברוח בשיידר
  function tuftGeo(){const pos=[];for(let k=0;k<3;k++){const a=k*2.1,c=Math.cos(a),s=Math.sin(a),w=0.35;pos.push(-c*w,0,-s*w, c*w,0,s*w, c*0.15,1,s*0.15)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();return g}
  function windMat(base){const m=new THREE.MeshLambertMaterial({side:THREE.DoubleSide});const U={gpT:{value:0}};m.userData.u=U;
    m.onBeforeCompile=sh=>{sh.uniforms.gpT=U.gpT;sh.vertexShader='uniform float gpT;\n'+sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvec4 gpI=instanceMatrix*vec4(0,0,0,1);float gpS=sin(gpT*1.7+gpI.x*0.013+gpI.z*0.009)*0.5+sin(gpT*3.1+gpI.x*0.03)*0.18;transformed.x+=gpS*0.35*position.y;transformed.z+=gpS*0.12*position.y;')};
    return m}
  function makeScatter(reg){
    const K=GP.scatter[reg]||GP.scatter.meadow,R=WR(),sg=segs(),sin=SIN(),grp=new THREE.Group(),P_=GP.pal[reg]||GP.pal.meadow;
    const mx=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),v=new THREE.Vector3(),sc=new THREE.Vector3();let seed=1;
    const geos={tuft:tuftGeo(),flower:new THREE.OctahedronGeometry(1,0).translate(0,1.2,0),pebble:new THREE.IcosahedronGeometry(1,0).scale(1,0.45,1)};
    const size={tuft:[15,26],flower:[3,4.5],pebble:[4,10]};
    for(const k in K){if(!K[k].n)continue;
      const m=new THREE.InstancedMesh(geos[k],k==='pebble'?new THREE.MeshLambertMaterial({flatShading:true}):windMat(),K[k].n);let n=0;
      for(let tries=0;n<K[k].n&&tries<K[k].n*12;tries++){
        const x=(hash(seed,1)-0.5)*(R.size.w+300),y=(hash(seed,2)-0.5)*(R.size.h+300),r=hash(seed,3),sz=size[k];seed++;
        // צפיפות לפי הרעש: עשב ופרחים בכתמים העשירים, אבנים בכתמים היבשים. וגושים, לא פיזור אחיד
        const nb=fbm(x/GP.big,y/GP.big),cl=fbm(x/90+4,y/90+2);
        const want=k==='pebble'?0.35+0.5*(1-nb):(k==='flower'?(cl>0.58?1:0.04):0.25+0.9*(1-nb)*(cl>0.45?1:0.35));
        if(hash(seed,4)>want||!free(x,y,sg))continue;
        const s=sz[0]+(sz[1]-sz[0])*r;e.set(0,hash(seed,5)*6.28,0);q.setFromEuler(e);sc.set(s*(k==='tuft'?1.2:1),s,s*(k==='tuft'?1.2:1));v.set(x,0,y/sin);
        mx.compose(v,q,sc);m.setMatrixAt(n,mx);m.setColorAt(n,col(K[k].col[Math.floor(hash(seed,6)*K[k].col.length)]).multiplyScalar(0.9+hash(seed,7)*0.2));n++}
      m.count=n;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.frustumCulled=false;grp.add(m)}
    return grp}

  function hook(rr,s,cam,...x){if(hook.prev)hook.prev.call(this,rr,s,cam,...x);
    const inW=!!(S&&S.wd&&!S.vil&&!S.room),reg=inW?S.wd.reg||'meadow':null,sc=R3D.scene;
    for(const k in scat)scat[k].visible=inW&&k===reg;for(const k in lowp)lowp[k].visible=inW&&k===reg;if(GP.mode==='B')R3D.ground.visible=!inW;
    if(!inW)return;
    if(GP.mode==='A'){if(!mat)mat=makeMat();if(regKey!==reg){setRegion(mat,reg);regKey=reg}R3D.ground.material=mat}
    if(GP.mode==='D'||GP.mode==='C'){let b=baked[reg];if(!b){const t=performance.now();b=baked[reg]=makeBaked(reg);GP.bakeMs=Math.round(performance.now()-t)}R3D.ground.material=b}
    if(GP.mode==='B'&&!lowp[reg]){lowp[reg]=makeLowPoly(reg);sc.add(lowp[reg])}
    if(GP.mode==='C'&&!scat[reg]){scat[reg]=makeScatter(reg);sc.add(scat[reg])}
    if(scat[reg]){const t=(performance.now()-t0)/1000;for(const m of scat[reg].children)if(m.material.userData.u)m.material.userData.u.gpT.value=t}
  }
  // look-hd קובע את onBeforeRender של הסצנה בפעם הראשונה שהוא מצייר, אז מתחברים אחריו, ועוטפים את מה שהוא שם
  const base=window.render3d;
  window.render3d=function(...a){
    const sc=R3D.ready&&R3D.scene;
    if(sc&&sc.onBeforeRender!==hook){hook.prev=sc.onBeforeRender;sc.onBeforeRender=hook}
    const r=base.apply(this,a);
    if(sc&&sc.onBeforeRender!==hook){hook.prev=sc.onBeforeRender;sc.onBeforeRender=hook}
    return r};
})();
