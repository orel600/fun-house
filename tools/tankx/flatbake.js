// node flatbake.js hi.glb(hires, UV into baseColor) baseColor.jpg run.glb(out of simp.js) out.glb [emisThr]
// ARI 9.11: מפת צבע לפי משולש. הטקסטורה של Tripo היא אטלס של אלפי איים זעירים, ובגודל המשחק (~110 פיקסל גובה) כל טקסטורה קטנה מטשטשת אותה לחום-כתום.
// כאן: לכל משולש של רשת הריצה צבע ממוצע (שטח המשולש, מהמקור 4096) לפי המשולש הקרוב ברשת המקור, בטקסל אחד באטלס קטן (NEAREST, בלי mip). אותו UV לשלושת הקודקודים, ולכן אין זליגה.
const sharp=require('sharp'),fs=require('fs'),{NodeIO,Document}=require('@gltf-transform/core'),{ALL_EXTENSIONS}=require('@gltf-transform/extensions');
(async()=>{const [hi,tex,run,out,thr]=process.argv.slice(2);const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
 const img=await sharp(tex).removeAlpha().raw().toBuffer({resolveWithObject:true});const IW=img.info.width,IH=img.info.height,px=img.data;
 const lin=c=>{c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4)},srgb=c=>{c=Math.max(0,Math.min(1,c));return Math.round(255*(c<=0.0031308?c*12.92:1.055*Math.pow(c,1/2.4)-0.055))};
 const tex1=(u,v)=>{const x=Math.min(IW-1,Math.max(0,Math.floor((u-Math.floor(u))*IW))),y=Math.min(IH-1,Math.max(0,Math.floor((v-Math.floor(v))*IH))),i=(y*IW+x)*3;return[lin(px[i]),lin(px[i+1]),lin(px[i+2])]};
 // מקור: צבע ממוצע לכל משולש (ליניארי) ומרכזו
 const dh=await io.read(hi);const H=[];// {c:[x,y,z],col:[r,g,b]}
 for(const m of dh.getRoot().listMeshes())for(const p of m.listPrimitives()){const P=p.getAttribute('POSITION'),T=p.getAttribute('TEXCOORD_0'),I=p.getIndices();const n=I.getCount()/3,a=[0,0,0],uv=[[0,0],[0,0],[0,0]],ps=[[0,0,0],[0,0,0],[0,0,0]];
  for(let t=0;t<n;t++){for(let k=0;k<3;k++){const i=I.getScalar(t*3+k);ps[k]=P.getElement(i,[0,0,0]).slice();uv[k]=T.getElement(i,[0,0]).slice()}
   const S=[[1/3,1/3,1/3],[.6,.2,.2],[.2,.6,.2],[.2,.2,.6],[.45,.45,.1],[.1,.45,.45],[.45,.1,.45]];let r=0,g=0,b=0;
   for(const w of S){const c=tex1(w[0]*uv[0][0]+w[1]*uv[1][0]+w[2]*uv[2][0],w[0]*uv[0][1]+w[1]*uv[1][1]+w[2]*uv[2][1]);r+=c[0];g+=c[1];b+=c[2]}
   H.push({c:[(ps[0][0]+ps[1][0]+ps[2][0])/3,(ps[0][1]+ps[1][1]+ps[2][1])/3,(ps[0][2]+ps[1][2]+ps[2][2])/3],col:[r/7,g/7,b/7]})}}
 // شبكة مكانية
 const cell=0.02,G=new Map(),key=(x,y,z)=>x+','+y+','+z;H.forEach((h,i)=>{const k=key(Math.floor(h.c[0]/cell),Math.floor(h.c[1]/cell),Math.floor(h.c[2]/cell));(G.get(k)||G.set(k,[]).get(k)).push(i)});
 const near=(c,R)=>{const cx=Math.floor(c[0]/cell),cy=Math.floor(c[1]/cell),cz=Math.floor(c[2]/cell);const out=[];for(let dx=-R;dx<=R;dx++)for(let dy=-R;dy<=R;dy++)for(let dz=-R;dz<=R;dz++){const l=G.get(key(cx+dx,cy+dy,cz+dz));if(l)for(const i of l)out.push(i)}return out};
 const d=await io.read(run);const root=d.getRoot();const cols=[];const prims=[];
 for(const m of root.listMeshes())for(const p of m.listPrimitives())prims.push(p);
 // מי: צבע לכל משולש רץ: ממוצע משוקלל של 3 משולשי מקור הקרובים ביותר (מרחק מרכז)
 let nT=0;for(const p of prims)nT+=p.getIndices().getCount()/3;
 const bake=[];for(const p of prims){const P=p.getAttribute('POSITION'),I=p.getIndices(),n=I.getCount()/3;for(let t=0;t<n;t++){const c=[0,0,0];for(let k=0;k<3;k++){const q=P.getElement(I.getScalar(t*3+k),[0,0,0]);c[0]+=q[0]/3;c[1]+=q[1]/3;c[2]+=q[2]/3}
   let L=near(c,1);if(L.length<3)L=near(c,3);if(L.length<3)L=near(c,8);const sc=L.map(i=>{const h=H[i].c;return[(h[0]-c[0])**2+(h[1]-c[1])**2+(h[2]-c[2])**2,i]}).sort((a,b)=>a[0]-b[0]).slice(0,4);
   let w=0,r=0,g=0,b=0;for(const [dd,i] of sc){const ww=1/(dd+1e-6);w+=ww;r+=ww*H[i].col[0];g+=ww*H[i].col[1];b+=ww*H[i].col[2]}bake.push([r/w,g/w,b/w])}}
 const lum=c=>0.2126*c[0]+0.7152*c[1]+0.0722*c[2];
 const GR=process.env.GRADE?JSON.parse(process.env.GRADE):null;if(GR)bake.forEach(c=>{const L=lum(c),ss=(a,b,x)=>{x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x)},a=ss(GR.a0,GR.a1,L),k=0.55+0.45*Math.min(1,L/GR.ok),m=(c[0]+c[1]+c[2])/3,g=c.map(v=>Math.min(1,Math.max(0,(m+(v-m)*GR.sat)*GR.gg)));for(let i=0;i<3;i++)c[i]=GR.ob[i]*k*(1-a)+g[i]*a});
 // אטלס
 const N=Math.ceil(Math.sqrt(nT)),A=Buffer.alloc(N*N*3),E=Buffer.alloc(N*N*3);bake.forEach((c,i)=>{A[i*3]=srgb(c[0]);A[i*3+1]=srgb(c[1]);A[i*3+2]=srgb(c[2])});
 const png=await sharp(A,{raw:{width:N,height:N,channels:3}}).png().toBuffer();
 // רשת חדשה: לכל משולש 3 קודקודים משלו (רק POSITION/NORMAL/UV/JOINTS/WEIGHTS), UV במרכז הטקסל
 let ti=0;for(const p of prims){const I=p.getIndices(),n=I.getCount()/3;const attrs={};for(const sem of p.listSemantics()){const a=p.getAttribute(sem);attrs[sem]={a,els:[]}}
  const idx=new Uint32Array(n*3);
  for(let t=0;t<n;t++){for(let k=0;k<3;k++){const i=I.getScalar(t*3+k);for(const sem in attrs){const at=attrs[sem].a;attrs[sem].els.push(at.getElement(i,new Array(at.getElementSize()).fill(0)).slice())}idx[t*3+k]=t*3+k}
   const tx=(ti%N+0.5)/N,ty=(Math.floor(ti/N)+0.5)/N;const uv=attrs.TEXCOORD_0.els;for(let k=0;k<3;k++)uv[t*3+k]=[tx,ty];ti++}
  for(const sem in attrs){const at=attrs[sem].a,sz=at.getElementSize(),arr=new (at.getArray().constructor)(attrs[sem].els.length*sz);attrs[sem].els.forEach((e,i)=>{for(let j=0;j<sz;j++)arr[i*sz+j]=e[j]});at.setArray(arr)}
  p.getIndices().setArray(idx)}
 // الخامة
 const mat=root.listMaterials()[0];const old=mat.getBaseColorTexture();const T=d.createTexture('flat').setImage(png).setMimeType('image/png');
 mat.setBaseColorTexture(T);mat.setBaseColorFactor([1,1,1,1]);const info=mat.getBaseColorTextureInfo();info.setMagFilter(9728).setMinFilter(9728).setWrapS(33071).setWrapT(33071);
 mat.setEmissiveTexture(null);mat.setEmissiveFactor([0,0,0]);mat.setMetallicFactor(0);mat.setRoughnessFactor(1);if(old&&old.getURI&&0){}
 await d.transform(require('@gltf-transform/functions').prune());
 await io.write(out,d);console.log(out,'tris',nT,'atlas',N);
 fs.writeFileSync(out+'.png',png);
})();
