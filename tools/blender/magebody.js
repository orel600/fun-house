// גוף חדש לקוסמת (ARI, 9.11.2026; אותה שיטה כמו tankbody.js, עותק עם צבעים וחלקים אחרים): "גולם אובסידיאן עם שריון זהב וסדקי לבה", מ-D:\morning-package\concepts\hero-concept-tank.png.
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
// חרוט קטום סגור למעלה (שמלה)
function frustum({rb,rt,h,seg=12,y0=0}){const T=[],P=(r,a,y)=>[r*Math.sin(a),y,r*Math.cos(a)];for(let i=0;i<seg;i++){const p=i/seg*Math.PI*2,q=(i+1)/seg*Math.PI*2;T.push(...quad(P(rb,p,y0),P(rb,q,y0),P(rt,q,y0+h),P(rt,p,y0+h)),...quad(P(rt,p,y0+h),P(rt,q,y0+h),[0,y0+h,0],[0,y0+h,0]))}return T}
const place=(tris,{at=[0,0,0],ry=0,rx=0,rz=0,s=[1,1,1]})=>tris.map(t=>t.map(p=>{let q=[p[0]*s[0],p[1]*s[1],p[2]*s[2]];q=rotZ(q,rz);q=rotX(q,rx);q=rotY(q,ry);return [q[0]+at[0],q[1]+at[1],q[2]+at[2]]}));
const C={navy:'#1C2260',navy2:'#262E80',navy3:'#141848',pale:'#C4D8F4',pale2:'#9FC0EE',silver:'#CBD3E6',blueglow:'#3F7BF5',blueglow2:'#46D3E6',skin:'#EAC8B2',hair:'#C9C0EA',hair2:'#A596DE',eyeD:'#2A2447',lip:'#B0506A'};
// ---------- איך הגוף מנופח ----------
// כל קודקוד מקבל את הממוצע המשוקלל של הגדלה לפי העצמות שמשפיעות עליו (אותם משקלים כמו הסקין), כדי שבמעברים לא יהיו חורים
const JIDX={};let J=[];
const radial=(v,cx,cy,cz,fx,fy,fz)=>[cx+(v[0]-cx)*fx,cy+(v[1]-cy)*fy,cz+(v[2]-cz)*fz];
function inflate(v,name){
  if(/^(hips|spine|chest)$/.test(name))return radial(v,0,v[1],0,1.0,1,1.0);
  const arm=name.match(/^(upperarm|lowerarm|wrist|hand)\.(l|r)$/);if(arm){const f=arm[1]==='hand'?1.05:arm[1]==='wrist'?1.05:1.05;return radial(v,v[0],1.107,0,1,f,f)}
  const leg=name.match(/^(upperleg|lowerleg|foot|toes)\.(l|r)$/);if(leg){const cx=leg[2]==='l'?0.171:-0.171,f=leg[1]==='foot'||leg[1]==='toes'?1.05:1.05;return radial(v,cx,v[1],0,f,1,f)}
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
    for(let t=0;t<ix.getCount();t+=3){const tri=[0,1,2].map(o=>ix.getScalar(t+o));const shade=[C.navy,C.navy2,C.navy3,C.navy,C.navy2,C.navy][(Math.imul(k++,2654435761)>>>8)%6];
      for(const i of tri){V.push(pos[i]);Cl.push(shade);Gl.push(0);Jn.push(jw[i][0]);Wt.push(jw[i][1])}}}
  const bodyTris=V.length/3;
  // ---------- חלקים קשיחים ----------
  const add=(jname,shape,o,color,glow=0)=>{for(const t of place(shape,o))for(const pt of t){V.push(pt);Cl.push(color);Gl.push(glow);Jn.push([JIDX[jname],0,0,0]);Wt.push([1,0,0,0])}};
  const mirror=(fn)=>{fn(1,'l');fn(-1,'r')};
  const surfZ=(x,y,r=0.07)=>{let m=-9;for(const v of body)if(Math.abs(v[0]-x)<r&&Math.abs(v[1]-y)<r&&v[2]>m)m=v[2];return m};
  const zc=surfZ(0,1.15,0.1);
  // --- שמלה ארוכה: חרוט קטום כחול כהה עד הרצפה, שוליים בהירים, פתח קדמי בהיר
  add('hips',frustum({rb:0.66,rt:0.42,h:0.62,seg:12,y0:0.0}),{},C.navy);
  add('hips',frustum({rb:0.69,rt:0.665,h:0.1,seg:12,y0:0.0}),{},C.pale);
  add('hips',frustum({rb:0.6,rt:0.58,h:0.04,seg:12,y0:0.26}),{},C.navy3);
  add('hips',box({w:0.24,h:0.58,d:0.03}),{at:[0,0.3,0.55],rx:0.34},C.pale2);
  add('hips',box({w:0.06,h:0.58,d:0.04}),{at:[0.13,0.3,0.55],rx:0.34},C.silver);add('hips',box({w:0.06,h:0.58,d:0.04}),{at:[-0.13,0.3,0.55],rx:0.34},C.silver);
  for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2+0.3;add('hips',cone({r:0.07,h:0.22,seg:3}),{at:[Math.sin(a)*0.66,0.1,Math.cos(a)*0.66],rx:Math.PI,s:[1,1,0.3],ry:a},i%2?C.pale:C.blueglow2)}
  // --- חזייה: צווארון גבוה בהיר, אבזם גביש כחול זוהר, חגורת כסף
  add('chest',band({rx:0.3,rz:0.26,t:0.05,h:0.12,y0:1.3}),{},C.pale);
  add('chest',oct({r:0.07,sy:1.4}),{at:[0,1.16,zc+0.03],s:[1,1,0.6]},C.blueglow,1);
  add('chest',torus({R:0.1,rt:0.015,seg:10,tseg:3}),{at:[0,1.16,zc+0.03],rx:Math.PI/2},C.silver);
  add('chest',box({w:0.05,h:0.4,d:0.03}),{at:[0.14,1.14,zc+0.01],rz:0.18},C.silver);add('chest',box({w:0.05,h:0.4,d:0.03}),{at:[-0.14,1.14,zc+0.01],rz:-0.18},C.silver);
  add('spine',band({rx:0.43,rz:0.38,t:0.04,h:0.1,y0:0.62}),{},C.silver);
  add('spine',oct({r:0.06,sy:1.3}),{at:[0,0.67,0.44],s:[1,1,0.6]},C.blueglow,1);
  add('spine',box({w:0.08,h:0.5,d:0.03}),{at:[0.08,0.28,0.5],rz:0.05},C.blueglow2);
  // --- שרוולים רחבים: צינור כחול עם שולי שרוול בהירים רחבים
  mirror((s,l)=>{const L='lowerarm.'+l,U='upperarm.'+l;
    add(L,box({w:0.36,h:0.34,d:0.34}),{at:[s*0.55,1.107,0]},C.navy2);
    add(L,box({w:0.14,h:0.56,d:0.56}),{at:[s*0.72,1.107,0]},C.pale);add(L,box({w:0.1,h:0.5,d:0.5}),{at:[s*0.8,1.107,0]},C.blueglow2);
    add('hand.'+l,box({w:0.2,h:0.2,d:0.2}),{at:[s*0.9,1.107,0]},C.skin);
    add(U,box({w:0.22,h:0.14,d:0.38}),{at:[s*0.28,1.35,0]},C.silver)});
  // --- גלימת סרטים בהירה מאחור
  mirror((s)=>{add('chest',box({w:0.14,h:0.9,d:0.03}),{at:[s*0.28,0.85,-0.38],rz:s*0.1},C.pale);add('chest',cone({r:0.07,h:0.3,seg:3}),{at:[s*0.29,0.4,-0.38],rx:Math.PI,s:[1,1,0.3]},C.blueglow2)});
  add('chest',box({w:0.5,h:0.8,d:0.04}),{at:[0,0.9,-0.4]},C.navy3);
  // --- ראש: עור, שיער כסוף-סגול ארוך, עטרה עם גביש, עיניים
  add('head',box({w:0.6,h:0.56,d:0.56}),{at:[0,1.58,0.02]},C.skin);
  add('head',box({w:0.68,h:0.18,d:0.64}),{at:[0,1.93,-0.02]},C.hair);add('head',box({w:0.72,h:0.9,d:0.12}),{at:[0,1.4,-0.36]},C.hair);add('head',box({w:0.1,h:0.8,d:0.36}),{at:[0.36,1.5,-0.1]},C.hair2);add('head',box({w:0.1,h:0.8,d:0.36}),{at:[-0.36,1.5,-0.1]},C.hair2);
  add('head',box({w:0.14,h:0.5,d:0.1}),{at:[0.28,1.2,0.14]},C.hair);add('head',box({w:0.14,h:0.5,d:0.1}),{at:[-0.28,1.2,0.14]},C.hair);
  add('head',box({w:0.08,h:0.05,d:0.03}),{at:[0.14,1.62,0.3]},C.eyeD);add('head',box({w:0.08,h:0.05,d:0.03}),{at:[-0.14,1.62,0.3]},C.eyeD);add('head',box({w:0.1,h:0.03,d:0.03}),{at:[0,1.44,0.3]},C.lip);
  add('head',torus({R:0.36,rt:0.025,seg:14,tseg:3}),{at:[0,1.9,0],rx:0.05},C.silver);
  add('head',oct({r:0.06,sy:2.2}),{at:[0,2.02,0.34]},C.blueglow,1);add('head',oct({r:0.035,sy:1.8}),{at:[0.2,1.96,0.3]},C.blueglow2,1);add('head',oct({r:0.035,sy:1.8}),{at:[-0.2,1.96,0.3]},C.blueglow2,1);
  mirror((s,l)=>{add('foot.'+l,box({w:0.26,h:0.06,d:0.34}),{at:[s*0.171,0.02,0.05]},C.silver)});
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
