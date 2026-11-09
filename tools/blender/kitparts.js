// חלקים קטנים בקוד לדמויות KayKit (ARI, 9.11.2026): מסכה, עטרה, גביש, ציצית וכתפית. כל חלק: משולשים עם צבע לכל משולש, נכתב כ-GLB בפורמט own_palette
// (פלטה 64x64 ו-emissiveMap, נורמלים שטוחים, doubleSided), כמו tools/blender/vc2palette.js. בלי גיאומטריה חדשה לזוהר: הזוהר הוא צבע הפלטה.
// שימוש: node tools/blender/kitparts.js <תיקיית פלט> [שם חלק...]    דורש את החבילות של build3d.js (NODE_PATH)
// צירים: מרחב עצם הראש של KayKit (y למעלה, הפנים ב-+z, קוטר הראש כ-1.1, שיא הגולגולת סביב y=1.0). חלק לעצם יד: הידית/הציר בראשית.
const {NodeIO,Document}=require('@gltf-transform/core'),sharp=require('sharp'),fs=require('fs'),path=require('path');
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
// ---------- צורות (כל אחת מחזירה רשימת משולשים [[a,b,c],...] במיקום מקומי) ----------
const rotY=(p,a)=>[p[0]*Math.cos(a)+p[2]*Math.sin(a),p[1],-p[0]*Math.sin(a)+p[2]*Math.cos(a)];
const rotX=(p,a)=>[p[0],p[1]*Math.cos(a)-p[2]*Math.sin(a),p[1]*Math.sin(a)+p[2]*Math.cos(a)];
const rotZ=(p,a)=>[p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a),p[2]];
const quad=(a,b,c,d)=>[[a,b,c],[a,c,d]];
function arc({r,t,h,a0,a1,seg,y0=0}){   // רצועה מעוקלת סביב ציר y, מ-a0 עד a1 (רדיאנים, 0 = +z)
  const T=[],pt=(R,a,y)=>[R*Math.sin(a),y,R*Math.cos(a)];
  for(let i=0;i<seg;i++){const p=a0+(a1-a0)*i/seg,q=a0+(a1-a0)*(i+1)/seg,R=r+t;
    T.push(...quad(pt(R,p,y0),pt(R,q,y0),pt(R,q,y0+h),pt(R,p,y0+h)),...quad(pt(r,q,y0),pt(r,p,y0),pt(r,p,y0+h),pt(r,q,y0+h)),
      ...quad(pt(r,p,y0+h),pt(r,q,y0+h),pt(R,q,y0+h),pt(R,p,y0+h)),...quad(pt(R,p,y0),pt(R,q,y0),pt(r,q,y0),pt(r,p,y0)))}
  return T}
function torus({R,rt,seg,tseg}){const T=[],P=(i,j)=>{const a=i/seg*Math.PI*2,b=j/tseg*Math.PI*2,rr=R+rt*Math.cos(b);return [rr*Math.sin(a),rt*Math.sin(b),rr*Math.cos(a)]};
  for(let i=0;i<seg;i++)for(let j=0;j<tseg;j++)T.push(...quad(P(i,j),P(i+1,j),P(i+1,j+1),P(i,j+1)));return T}
function oct({r,sy=1}){const v=[[r,0,0],[-r,0,0],[0,r*sy,0],[0,-r*sy,0],[0,0,r],[0,0,-r]],f=[[0,2,4],[4,2,1],[1,2,5],[5,2,0],[4,3,0],[1,3,4],[5,3,1],[0,3,5]];return f.map(t=>t.map(i=>v[i]))}
function cone({r,h,seg=5}){const T=[],b=i=>[r*Math.sin(i/seg*Math.PI*2),0,r*Math.cos(i/seg*Math.PI*2)];for(let i=0;i<seg;i++){T.push([b(i),[0,h,0],b(i+1)]);T.push([b(i),b(i+1),[0,0,0]])}return T}
function box({w,h,d}){const x=w/2,y=h/2,z=d/2,v=[[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]];
  return [...quad(v[4],v[5],v[6],v[7]),...quad(v[1],v[0],v[3],v[2]),...quad(v[0],v[4],v[7],v[3]),...quad(v[5],v[1],v[2],v[6]),...quad(v[3],v[7],v[6],v[2]),...quad(v[0],v[1],v[5],v[4])]}
// מקום חלק: {shape,color,glow,at:[x,y,z],ry,rx,rz,s:[sx,sy,sz]}
const place=(tris,{at=[0,0,0],ry=0,rx=0,rz=0,s=[1,1,1]})=>tris.map(t=>t.map(p=>{let q=[p[0]*s[0],p[1]*s[1],p[2]*s[2]];q=rotZ(q,rz);q=rotX(q,rx);q=rotY(q,ry);return [q[0]+at[0],q[1]+at[1],q[2]+at[2]]}));
// ---------- החלקים ----------
const PARTS={
  // מסכת חצי פנים של המתנקש: רצועה שחורה על העיניים, עם שני חריצי עיניים סגולים-לילך זוהרים. הפנים ב-+z
  assassinMask:[{shape:arc({r:0.49,t:0.03,h:0.16,a0:-0.6,a1:0.6,seg:8,y0:0.34}),color:'#1B1426'},
                {shape:box({w:0.10,h:0.03,d:0.02}),color:'#C7A6FF',glow:1,at:[-0.13,0.41,0.512],ry:-0.26},{shape:box({w:0.10,h:0.03,d:0.02}),color:'#C7A6FF',glow:1,at:[0.13,0.41,0.512],ry:0.26}],
  // עטרה לקוסמת: טבעת כסף דקה סביב הראש עם שלושה גבישים כחולים (#3F7BF5, זוהרים) מלפנים
  mageCirclet:[{shape:torus({R:0.47,rt:0.028,seg:20,tseg:4}),color:'#C9D2E3',at:[0,0.675,-0.01],rx:0.05},
               {shape:oct({r:0.075,sy:1.7}),color:'#3F7BF5',glow:1,at:[0,0.70,0.49]},{shape:oct({r:0.045,sy:1.5}),color:'#3F7BF5',glow:1,at:[-0.2,0.67,0.44],ry:-0.5},{shape:oct({r:0.045,sy:1.5}),color:'#3F7BF5',glow:1,at:[0.2,0.67,0.44],ry:0.5}],
  // גביש צף של הקוסמת (חלק שמרחף ליד היד השנייה, הקוד מניע אותו למעלה ולמטה): אוקטהדרון כחול זוהר עם שני גבישים קטנים מסביב
  mageCrystal:[{shape:oct({r:0.17,sy:1.6}),color:'#3F7BF5',glow:1},{shape:oct({r:0.05,sy:1.5}),color:'#46D3E6',glow:1,at:[0.2,0.08,0.05]},{shape:oct({r:0.04,sy:1.5}),color:'#46D3E6',glow:1,at:[-0.18,-0.1,-0.04]}],
  // ציצית אדומה לקסדה של הלוחם (על עצם הראש): שלוש חרוטים אדומים נטויים לאחור, וטבעת קטנה בבסיס
  warriorPlume:[{shape:cone({r:0.09,h:0.55,seg:5}),color:'#B3262E',at:[0,1.14,-0.05],rx:-0.55},{shape:cone({r:0.08,h:0.45,seg:5}),color:'#C93A41',at:[0.1,1.14,-0.02],rx:-0.55,rz:-0.2},{shape:cone({r:0.08,h:0.45,seg:5}),color:'#C93A41',at:[-0.1,1.14,-0.02],rx:-0.55,rz:0.2},
                {shape:box({w:0.22,h:0.07,d:0.2}),color:'#8D94A8',at:[0,1.12,-0.02]}]
};
async function write(name,items,out){
  const keys=[],ci=h=>{let i=keys.indexOf(h);if(i<0){i=keys.length;keys.push(h)}return i};
  const V=[],C=[],G=[];
  for(const it of items)for(const t of place(it.shape,it))for(const p of t){V.push(p);C.push(ci(it.color));G.push(it.glow?1:0)}
  if(keys.length>64)throw new Error('יותר מ-64 צבעים');
  const pal=Buffer.alloc(64*64*4),em=Buffer.alloc(64*64*4);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const cell=Math.min((y>>3)*8+(x>>3),keys.length-1),v=hex(keys[cell]).map(q=>Math.round(q*255)),o=(y*64+x)*4,glow=items.some(i=>i.glow&&i.color===keys[cell]);
    for(let i=0;i<3;i++){pal[o+i]=v[i];em[o+i]=glow?v[i]:0}pal[o+3]=255;em[o+3]=255}
  const UV=C.map(c=>[((c%8)*8+4)/64,((c>>3)*8+4)/64]),N=[];
  for(let i=0;i<V.length;i+=3){const [a,b,c]=[V[i],V[i+1],V[i+2]],u=b.map((q,k)=>q-a[k]),w=c.map((q,k)=>q-a[k]);let n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];const l=Math.hypot(...n)||1;n=n.map(q=>q/l);N.push(n,n,n)}
  const doc=new Document(),buf=doc.createBuffer(),A=(arr,type,Cl)=>doc.createAccessor().setType(type).setArray(Cl.from(arr.flat())).setBuffer(buf);
  const tex=async b=>doc.createTexture().setImage(new Uint8Array(await sharp(b,{raw:{width:64,height:64,channels:4}}).png().toBuffer())).setMimeType('image/png');
  const mat=doc.createMaterial('own_palette').setBaseColorTexture(await tex(pal)).setEmissiveTexture(await tex(em)).setEmissiveFactor([1,1,1]).setMetallicFactor(0).setRoughnessFactor(0.9).setDoubleSided(true);
  const prim=doc.createPrimitive().setAttribute('POSITION',A(V,'VEC3',Float32Array)).setAttribute('NORMAL',A(N,'VEC3',Float32Array)).setAttribute('TEXCOORD_0',A(UV,'VEC2',Float32Array)).setMaterial(mat);
  doc.createScene().addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)));
  await new NodeIO().write(path.join(out,name+'.glb'),doc);console.log(name,'tris',V.length/3,'colors',keys.length)}
(async()=>{const out=process.argv[2],only=process.argv.slice(3);fs.mkdirSync(out,{recursive:true});for(const [n,items] of Object.entries(PARTS))if(!only.length||only.includes(n))await write(n,items,out)})();
