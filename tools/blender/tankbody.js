// גוף חדש לטנק (ARI, 9.11.2026): "גולם אובסידיאן עם שריון זהב וסדקי לבה", מ-D:\morning-package\concepts\hero-concept-tank.png.
// בלי Blender ובלי AI: הגוף של ה-Barbarian של KayKit (אותו שלד Rig_Medium, אותם משקלים, כך שכל האנימציות עובדות) מנופח לרחב,
// נצבע בפלטה של אובסידיאן (שלושה גוונים, נורמלים שטוחים כמו כל חלקי own), ועליו חלקים קשיחים שקשורים לעצם אחת: כתפיות, פלטת חזה עם ליבת שמש
// זוהרת, חגורה ושמלה אדומה, ברכיים, מגפיים, שריוני יד, קסדה עם חריצי עיניים זוהרים, וסדקי לבה שנצמדים למשטח של הגוף.
// שימוש: node tools/blender/tankbody.js <Barbarian.glb> <TankHF.glb>      דורש את החבילות של build3d.js (NODE_PATH)
const {NodeIO,Document}=require('@gltf-transform/core'),{ALL_EXTENSIONS}=require('@gltf-transform/extensions'),{prune}=require('@gltf-transform/functions'),sharp=require('sharp');
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
const rotY=(p,a)=>[p[0]*Math.cos(a)+p[2]*Math.sin(a),p[1],-p[0]*Math.sin(a)+p[2]*Math.cos(a)];
const rotX=(p,a)=>[p[0],p[1]*Math.cos(a)-p[2]*Math.sin(a),p[1]*Math.sin(a)+p[2]*Math.cos(a)];
const rotZ=(p,a)=>[p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a),p[2]];
const quad=(a,b,c,d)=>[[a,b,c],[a,c,d]];
function box({w,h,d}){const x=w/2,y=h/2,z=d/2,v=[[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]];
  return [...quad(v[4],v[5],v[6],v[7]),...quad(v[1],v[0],v[3],v[2]),...quad(v[0],v[4],v[7],v[3]),...quad(v[5],v[1],v[2],v[6]),...quad(v[3],v[7],v[6],v[2]),...quad(v[0],v[1],v[5],v[4])]}
function cone({r,h,seg=5}){const T=[],b=i=>[r*Math.sin(i/seg*Math.PI*2),0,r*Math.cos(i/seg*Math.PI*2)];for(let i=0;i<seg;i++){T.push([b(i),[0,h,0],b(i+1)]);T.push([b(i),b(i+1),[0,0,0]])}return T}
function oct({r,sy=1}){const v=[[r,0,0],[-r,0,0],[0,r*sy,0],[0,-r*sy,0],[0,0,r],[0,0,-r]],f=[[0,2,4],[4,2,1],[1,2,5],[5,2,0],[4,3,0],[1,3,4],[5,3,1],[0,3,5]];return f.map(t=>t.map(i=>v[i]))}
function torus({R,rt,seg,tseg}){const T=[],P=(i,j)=>{const a=i/seg*Math.PI*2,b=j/tseg*Math.PI*2,rr=R+rt*Math.cos(b);return [rr*Math.sin(a),rt*Math.sin(b),rr*Math.cos(a)]};
  for(let i=0;i<seg;i++)for(let j=0;j<tseg;j++)T.push(...quad(P(i,j),P(i+1,j),P(i+1,j+1),P(i,j+1)));return T}
// טבעת מלבנית-אליפטית שטוחה סביב ציר y: רצועה (בשביל חגורה וצווארון), a מלא
function band({rx,rz,t,h,seg=12,y0=0}){const T=[],pt=(k,a,y)=>[(rx+k)*Math.sin(a),y,(rz+k)*Math.cos(a)];
  for(let i=0;i<seg;i++){const p=i/seg*Math.PI*2,q=(i+1)/seg*Math.PI*2;
    T.push(...quad(pt(t,p,y0),pt(t,q,y0),pt(t,q,y0+h),pt(t,p,y0+h)),...quad(pt(0,q,y0),pt(0,p,y0),pt(0,p,y0+h),pt(0,q,y0+h)),
      ...quad(pt(0,p,y0+h),pt(0,q,y0+h),pt(t,q,y0+h),pt(t,p,y0+h)),...quad(pt(t,p,y0),pt(t,q,y0),pt(0,q,y0),pt(0,p,y0)))}return T}
const place=(tris,{at=[0,0,0],ry=0,rx=0,rz=0,s=[1,1,1]})=>tris.map(t=>t.map(p=>{let q=[p[0]*s[0],p[1]*s[1],p[2]*s[2]];q=rotZ(q,rz);q=rotX(q,rx);q=rotY(q,ry);return [q[0]+at[0],q[1]+at[1],q[2]+at[2]]}));
const C={ob1:'#241F2A',ob2:'#2F2936',ob3:'#1A1620',ob4:'#3A3340',gold:'#D8A640',gold2:'#F0C65A',gold3:'#8F6522',lava:'#FF8A1F',hot:'#FFD36A',red:'#8A1F27',red2:'#B03038',belt:'#3A2318',eye:'#FFB23A'};
// ---------- איך הגוף מנופח ----------
// כל קודקוד מקבל את הממוצע המשוקלל של הגדלה לפי העצמות שמשפיעות עליו (אותם משקלים כמו הסקין), כדי שבמעברים לא יהיו חורים
const JIDX={};let J=[];
const radial=(v,cx,cy,cz,fx,fy,fz)=>[cx+(v[0]-cx)*fx,cy+(v[1]-cy)*fy,cz+(v[2]-cz)*fz];
function inflate(v,name){
  if(/^(hips|spine|chest)$/.test(name))return radial(v,0,v[1],0,1.32,1,1.3);
  const arm=name.match(/^(upperarm|lowerarm|wrist|hand)\.(l|r)$/);if(arm){const f=arm[1]==='hand'?1.6:arm[1]==='wrist'?1.4:1.5;return radial(v,v[0],1.107,0,1,f,f)}
  const leg=name.match(/^(upperleg|lowerleg|foot|toes)\.(l|r)$/);if(leg){const cx=leg[2]==='l'?0.171:-0.171,f=leg[1]==='foot'||leg[1]==='toes'?1.45:1.4;return radial(v,cx,v[1],0,f,1,f)}
  return v}
// ---------- הדמות ----------
(async()=>{
  const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),d=await io.read(process.argv[2]),root=d.getRoot();
  const skin=root.listSkins()[0];J=skin.listJoints().map(j=>j.getName());J.forEach((n,i)=>JIDX[n]=i);
  const nodes=root.listNodes().filter(n=>n.getMesh()&&/^Barbarian_(Arm|Body|Leg)/.test(n.getName()));   // בלי הראש: הקסדה מכסה אותו
  const V=[],Cl=[],Gl=[],Jn=[],Wt=[];
  const body=[];   // המשטח המנופח, לצורך הצמדת הסדקים
  let k=0;
  for(const n of nodes){const p=n.getMesh().listPrimitives()[0],a=p.getAttribute('POSITION'),jj=p.getAttribute('JOINTS_0'),ww=p.getAttribute('WEIGHTS_0'),ix=p.getIndices(),
    pos=[],jw=[];
    for(let i=0;i<a.getCount();i++){const v=a.getElement(i,[]),j=jj.getElement(i,[]),w=ww.getElement(i,[]);let q=[0,0,0],tot=0;
      for(let m=0;m<4;m++){if(w[m]<=0)continue;const r=inflate(v,J[j[m]]);for(let c=0;c<3;c++)q[c]+=r[c]*w[m];tot+=w[m]}
      pos.push(q.map(x=>x/(tot||1)));jw.push([j,w]);body.push(pos[i])}
    for(let t=0;t<ix.getCount();t+=3){const tri=[0,1,2].map(o=>ix.getScalar(t+o));const shade=[C.ob1,C.ob2,C.ob3,C.ob1,C.ob2,C.ob4][(Math.imul(k++,2654435761)>>>8)%6];
      for(const i of tri){V.push(pos[i]);Cl.push(shade);Gl.push(0);Jn.push(jw[i][0]);Wt.push(jw[i][1])}}}
  const bodyTris=V.length/3;
  // ---------- חלקים קשיחים ----------
  const add=(jname,shape,o,color,glow=0)=>{for(const t of place(shape,o))for(const pt of t){V.push(pt);Cl.push(color);Gl.push(glow);Jn.push([JIDX[jname],0,0,0]);Wt.push([1,0,0,0])}};
  const mirror=(fn)=>{fn(1,'l');fn(-1,'r')};
  // נקודת משטח: ה-z הכי רחוק מקודקודי הגוף ליד (x,y) (לסדקים), או y עליון ליד (x,z)
  const surfZ=(x,y,r=0.07)=>{let m=-9;for(const v of body)if(Math.abs(v[0]-x)<r&&Math.abs(v[1]-y)<r&&v[2]>m)m=v[2];return m};
  const surfY=(x,z,r=0.07)=>{let m=-9;for(const v of body)if(Math.abs(v[0]-x)<r&&Math.abs(v[2]-z)<r&&v[1]>m)m=v[1];return m};
  // סדק לבה על חזית הגוף: שרשרת קטעים דקים (נקודות [x,y]) שמוצמדת למשטח
  const crackF=(jname,pts,w=0.028)=>{for(let i=0;i<pts.length-1;i++){const [x0,y0]=pts[i],[x1,y1]=pts[i+1],mx=(x0+x1)/2,my=(y0+y1)/2,len=Math.hypot(x1-x0,y1-y0),z=surfZ(mx,my);
    if(z<-1)continue;add(jname,box({w:len+0.01,h:w,d:0.025}),{at:[mx,my,z+0.004],rz:Math.atan2(y1-y0,x1-x0)},C.lava,1)}
    const [xe,ye]=pts[0];add(jname,box({w:w*1.7,h:w*1.7,d:0.03}),{at:[xe,ye,surfZ(xe,ye)+0.006]},C.hot,1)};
  // סדק בראש היד/הרגל: על החזית של איבר אופקי (זרוע) או אנכי (רגל), x,y הם נקודות החזית
  // --- חזה: צווארון, פלטת חזה וליבת שמש
  add('chest',band({rx:0.34,rz:0.30,t:0.05,h:0.1,y0:1.3}),{},C.gold);
  add('chest',band({rx:0.35,rz:0.31,t:0.03,h:0.05,y0:1.4}),{},C.gold2);
  const zc=surfZ(0,1.17,0.1);
  add('chest',torus({R:0.2,rt:0.045,seg:10,tseg:4}),{at:[0,1.17,zc+0.01],rx:Math.PI/2},C.gold);
  add('chest',torus({R:0.12,rt:0.02,seg:10,tseg:4}),{at:[0,1.17,zc+0.02],rx:Math.PI/2},C.gold3);
  add('chest',oct({r:0.1,sy:1}),{at:[0,1.17,zc+0.03],s:[1,1,0.7]},C.hot,1);
  add('chest',oct({r:0.06,sy:1}),{at:[0,1.17,zc+0.06],s:[1,1,0.7]},'#FFFFFF',1);
  for(const a of [0,1,2,3,4,5,6,7]){const an=a*Math.PI/4;add('chest',box({w:0.03,h:0.1,d:0.03}),{at:[Math.sin(an)*0.25,1.17+Math.cos(an)*0.25,zc+0.012],rz:-an},C.gold2)}   // קרניים סביב הליבה
  // סדקים בחזה
  crackF('chest',[[0.12,1.2],[0.24,1.26],[0.3,1.36]]);crackF('chest',[[-0.12,1.12],[-0.22,1.06],[-0.3,1.0]]);
  crackF('chest',[[0,1.1],[0.04,1.0],[-0.02,0.9]]);crackF('spine',[[0.22,0.9],[0.3,0.8],[0.38,0.74]]);
  // --- חגורה, אבזם ושמלה אדומה
  add('spine',band({rx:0.56,rz:0.5,t:0.05,h:0.17,y0:0.56}),{},C.belt);
  add('spine',box({w:0.2,h:0.2,d:0.05}),{at:[0,0.65,0.58]},C.gold);
  add('spine',oct({r:0.07,sy:1}),{at:[0,0.65,0.62],s:[1,1,0.5]},C.gold2);
  add('hips',box({w:0.3,h:0.6,d:0.035}),{at:[0,0.22,0.52]},C.red);
  add('hips',cone({r:0.15,h:0.18,seg:3}),{at:[0,-0.1,0.52],rx:Math.PI,s:[1,1,0.2]},C.red);
  add('hips',box({w:0.06,h:0.6,d:0.045}),{at:[0.1,0.22,0.53]},C.gold);add('hips',box({w:0.06,h:0.6,d:0.045}),{at:[-0.1,0.22,0.53]},C.gold);
  add('hips',box({w:0.2,h:0.05,d:0.05}),{at:[0,0.5,0.53]},C.gold2);
  mirror((s,l)=>{   // פלטות ירך (חצאית שריון) משני הצדדים של השמלה
    add('hips',box({w:0.2,h:0.42,d:0.05}),{at:[s*0.38,0.34,0.4],ry:s*0.45,rz:s*0.06},C.ob4);add('hips',box({w:0.2,h:0.05,d:0.07}),{at:[s*0.38,0.56,0.4],ry:s*0.45},C.gold);
    add('hips',cone({r:0.09,h:0.14,seg:4}),{at:[s*0.4,0.1,0.43],rx:Math.PI,ry:s*0.45},C.gold3)});
  // --- כתפיות: בלוק אובסידיאן גדול עם לוח זהב, על ימין חוד זהב גדול
  mirror((s,l)=>{const J_='upperarm.'+l;
    add(J_,box({w:0.44,h:0.34,d:0.54}),{at:[s*0.34,1.52,0]},C.ob4);
    add(J_,box({w:0.3,h:0.05,d:0.4}),{at:[s*0.3,1.71,0]},C.gold);
    add(J_,box({w:0.05,h:0.3,d:0.5}),{at:[s*0.57,1.52,0]},C.gold);
    add(J_,box({w:0.36,h:0.05,d:0.5}),{at:[s*0.34,1.37,0]},C.gold3);
    if(l==='r'){add(J_,cone({r:0.1,h:0.42,seg:4}),{at:[s*0.5,1.7,0.1],rz:s*0.5},C.gold2);add(J_,cone({r:0.08,h:0.34,seg:4}),{at:[s*0.46,1.7,-0.12],rz:s*0.5},C.gold)}
    else add(J_,cone({r:0.08,h:0.3,seg:4}),{at:[s*0.46,1.7,0],rz:s*0.5},C.gold)});
  // --- שריוני יד: טבעת זהב ולוח בגב היד, אגרופים כבדים
  mirror((s,l)=>{const L='lowerarm.'+l,H='hand.'+l;
    add(L,box({w:0.07,h:0.5,d:0.46}),{at:[s*0.5,1.107,0]},C.gold);add(L,box({w:0.07,h:0.5,d:0.46}),{at:[s*0.66,1.107,0]},C.gold3);
    add(L,box({w:0.3,h:0.06,d:0.34}),{at:[s*0.58,1.38,0]},C.gold2);
    add(H,box({w:0.04,h:0.5,d:0.5}),{at:[s*0.78,1.107,0]},C.gold3);
    // סדק על הזרוע העליונה והאמה (על הפן העליון)
    const yu=surfY(s*0.3,0,0.1),ye=surfY(s*0.58,0,0.06);
    if(yu>0)add('upperarm.'+l,box({w:0.22,h:0.025,d:0.03}),{at:[s*0.3,yu+0.003,0.05]},C.lava,1)});
  // --- ברכיים: מסגרת זהב ובלוק אובסידיאן, וכפות רגליים
  mirror((s,l)=>{const L='lowerleg.'+l,U='upperleg.'+l,F='foot.'+l,T='toes.'+l,cx=s*0.171;
    add(L,box({w:0.36,h:0.34,d:0.1}),{at:[cx,0.3,0.25]},C.gold);add(L,box({w:0.28,h:0.26,d:0.12}),{at:[cx,0.3,0.26]},C.ob4);
    add(L,oct({r:0.07,sy:1}),{at:[cx,0.3,0.34],s:[1,1,0.5]},C.gold2);
    add(U,box({w:0.4,h:0.07,d:0.4}),{at:[cx,0.5,0]},C.gold3);
    add(L,band({rx:0.2,rz:0.2,t:0.04,h:0.06,y0:0.2}),{at:[cx,0,0]},C.gold);
    add(T,box({w:0.4,h:0.16,d:0.12}),{at:[cx,0.075,0.2]},C.gold);add(T,cone({r:0.12,h:0.2,seg:4}),{at:[cx,0.08,0.3],rx:Math.PI/2},C.gold2);
    add(F,box({w:0.42,h:0.05,d:0.3}),{at:[cx,0.18,0.02]},C.gold3);
    // סדק בשוק
    const z=surfZ(cx,0.22,0.06);if(z>0)add(L,box({w:0.03,h:0.22,d:0.025}),{at:[cx+s*0.03,0.22,z+0.004],rz:s*0.2},C.lava,1)});
  // --- קסדה: תיבת זהב כהה, חריץ עיניים זוהר וגשר אף. הכתר הנפרד (hat_tankCrown) יושב עליה
  const hz=0.6;
  add('head',box({w:0.8,h:0.66,d:0.78}),{at:[0,1.66,0]},C.ob4);
  add('head',box({w:0.84,h:0.07,d:0.82}),{at:[0,2.0,0]},C.gold);add('head',box({w:0.84,h:0.07,d:0.82}),{at:[0,1.33,0]},C.gold);
  add('head',box({w:0.56,h:0.24,d:0.05}),{at:[0,1.64,0.4]},C.ob3);     // מסך כהה
  add('head',box({w:0.16,h:0.045,d:0.04}),{at:[0.14,1.65,0.43]},C.eye,1);add('head',box({w:0.16,h:0.045,d:0.04}),{at:[-0.14,1.65,0.43]},C.eye,1);   // העיניים
  add('head',box({w:0.08,h:0.55,d:0.05}),{at:[0,1.68,0.41]},C.gold);   // גשר
  add('head',box({w:0.05,h:0.1,d:0.7}),{at:[0,2.08,0]},C.gold2);       // רכס על הקדקוד
  mirror((s)=>add('head',box({w:0.05,h:0.4,d:0.56}),{at:[s*0.42,1.64,0]},C.gold));
  // ---------- פלטה ----------
  const keys=[],ci=h=>{let i=keys.indexOf(h);if(i<0){i=keys.length;keys.push(h)}return i};
  const cidx=Cl.map(ci);if(keys.length>64)throw new Error('יותר מ-64 צבעים');
  const pal=Buffer.alloc(64*64*4),em=Buffer.alloc(64*64*4),glowKey=new Set();Cl.forEach((c,i)=>{if(Gl[i])glowKey.add(c)});
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const cell=Math.min((y>>3)*8+(x>>3),keys.length-1),v=hex(keys[cell]).map(q=>Math.round(q*255)),o=(y*64+x)*4,g=glowKey.has(keys[cell]);
    for(let i=0;i<3;i++){pal[o+i]=v[i];em[o+i]=g?v[i]:0}pal[o+3]=255;em[o+3]=255}
  const UV=cidx.map(c=>[((c%8)*8+4)/64,((c>>3)*8+4)/64]),N=[];
  for(let i=0;i<V.length;i+=3){const [a,b,c]=[V[i],V[i+1],V[i+2]],u=b.map((q,m)=>q-a[m]),w=c.map((q,m)=>q-a[m]);let n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];const l=Math.hypot(...n)||1;n=n.map(q=>q/l);N.push(n,n,n)}
  const buf=root.listBuffers()[0],A=(arr,type,Cls)=>d.createAccessor().setType(type).setArray(Cls.from(arr.flat())).setBuffer(buf);
  const tex=async b=>d.createTexture().setImage(new Uint8Array(await sharp(b,{raw:{width:64,height:64,channels:4}}).png().toBuffer())).setMimeType('image/png');
  const mat=d.createMaterial('own_palette').setBaseColorTexture(await tex(pal)).setEmissiveTexture(await tex(em)).setEmissiveFactor([1,1,1]).setMetallicFactor(0).setRoughnessFactor(0.85).setDoubleSided(true);
  const prim=d.createPrimitive().setAttribute('POSITION',A(V,'VEC3',Float32Array)).setAttribute('NORMAL',A(N,'VEC3',Float32Array)).setAttribute('TEXCOORD_0',A(UV,'VEC2',Float32Array))
    .setAttribute('JOINTS_0',A(Jn,'VEC4',Uint16Array)).setAttribute('WEIGHTS_0',A(Wt,'VEC4',Float32Array)).setMaterial(mat);
  const mesh=d.createMesh('Barbarian_Body').addPrimitive(prim),first=nodes[0];
  for(const n of root.listNodes())if(n.getMesh())n.setMesh(null);
  first.setMesh(mesh).setSkin(skin);first.setName('Barbarian_Body');
  for(const m of root.listMeshes())if(m!==mesh)m.dispose();
  for(const a of root.listAnimations()){for(const c of a.listChannels())c.dispose();for(const sm of a.listSamplers())sm.dispose();a.dispose()}
  await d.transform(prune());await io.write(process.argv[3],d);console.log('tris',V.length/3,'(body',bodyTris,') colors',keys.length);
})();
