// node reskin.js tank_rigged.raw.json basecolor.jpg outdir
// Mixamo-named tank (Tripo auto-rig) -> KayKit Rig_Medium names. Steps: face +Z, cut the hammer out by an axis line, straighten the pose to the KayKit
// T-pose with per-bone rotations (lengths = the tank's own), skin to KayKit-named joints (merged weights), write TankKK.glb (+ TankHammer.glb prop, grip at origin, y along the handle).
const fs=require('fs'),path=require('path'),sharp=require('sharp');
const {NodeIO,Document}=require('@gltf-transform/core'),{ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const [rawF,texF,outDir]=process.argv.slice(2);const RAW=JSON.parse(fs.readFileSync(rawF)),m=RAW.meshes[0];
const KK='C:/kk/adv/addons/kaykit_character_pack_adventures/Characters/gltf/Barbarian.glb';
const rot=p=>[-p[2],p[1],p[0]];                       // Ry(-90): tank faces +X -> +Z, its left (-Z) -> +X
const sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],len=a=>Math.hypot(...a),nrm=a=>mul(a,1/(len(a)||1));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function rotFromTo(a,b){a=nrm(a);b=nrm(b);const v=cross(a,b),c=dot(a,b);if(c<-0.9999){const ax=Math.abs(a[0])<0.9?[1,0,0]:[0,1,0],u=nrm(cross(a,ax));return [[2*u[0]*u[0]-1,2*u[0]*u[1],2*u[0]*u[2]],[2*u[1]*u[0],2*u[1]*u[1]-1,2*u[1]*u[2]],[2*u[2]*u[0],2*u[2]*u[1],2*u[2]*u[2]-1]]}
  const k=1/(1+c);return [[v[0]*v[0]*k+c,v[0]*v[1]*k-v[2],v[0]*v[2]*k+v[1]],[v[1]*v[0]*k+v[2],v[1]*v[1]*k+c,v[1]*v[2]*k-v[0]],[v[2]*v[0]*k-v[1],v[2]*v[1]*k+v[0],v[2]*v[2]*k+c]]}
const mv=(M,p)=>[dot(M[0],p),dot(M[1],p),dot(M[2],p)];
const B={};for(const [k,v] of Object.entries(RAW.bones))B[k.replace('mixamorig','')]=rot(v.pos);
const hy=B.Hips[1];
// ---- skin joint table: KayKit joint -> [tank source joint, tank child (direction), target pos, target dir]
const mid=(a,b)=>mul(add(a,b),0.5);
const avg=(f)=>(f('Left')+f('Right'))/2;
const lat=avg(s=>Math.abs(B[s+'Arm'][0]-B.Spine2[0])),legLat=avg(s=>Math.abs(B[s+'UpLeg'][0]-B.Hips[0]));
const L={arm:avg(s=>len(sub(B[s+'ForeArm'],B[s+'Arm']))),fore:avg(s=>len(sub(B[s+'Hand'],B[s+'ForeArm']))),up:avg(s=>len(sub(B[s+'Leg'],B[s+'UpLeg']))),low:avg(s=>len(sub(B[s+'Foot'],B[s+'Leg']))),toe:avg(s=>len(sub(B[s+'ToeBase'],B[s+'Foot'])))};
const armY=avg(s=>B[s+'Arm'][1]),upLegY=avg(s=>B[s+'UpLeg'][1]);
const T={hips:[0,hy,0],spine:[0,B.Spine[1],0],chest:[0,B.Spine2[1],0],head:[0,B.Neck[1],0]};
const J=[ // [kk, src, srcChild, tgt, tgtDir]
 ['hips','Hips','Spine',T.hips,[0,1,0]],['spine','Spine','Spine2',T.spine,[0,1,0]],['chest','Spine2','Neck',T.chest,[0,1,0]],['head','Neck','Head',T.head,[0,1,0]]];
for(const [sd,s,sx] of [['l','Left',1],['r','Right',-1]]){
  const ua=[sx*lat,armY,0],la=add(ua,[sx*L.arm,0,0]),hd=add(la,[sx*L.fore,0,0]);
  J.push(['upperarm.'+sd,s+'Arm',s+'ForeArm',ua,[sx,0,0]],['lowerarm.'+sd,s+'ForeArm',s+'Hand',la,[sx,0,0]],['hand.'+sd,s+'Hand',s+'HandMiddle1',hd,[sx,0,0]]);
  const ul=[sx*legLat,upLegY,0],ll=add(ul,[0,-L.up,0]),ft=add(ll,[0,-L.low,0]),td=nrm([0,-0.72,0.69]),tp=add(ft,mul(td,L.toe));
  J.push(['upperleg.'+sd,s+'UpLeg',s+'Leg',ul,[0,-1,0]],['lowerleg.'+sd,s+'Leg',s+'Foot',ll,[0,-1,0]],['foot.'+sd,s+'Foot',s+'ToeBase',ft,td],['toes.'+sd,s+'ToeBase',s+'Toe_End',tp,td]);}
const PN=n=>n.getParentNode?n.getParentNode():null;const kkIdx={};J.forEach((j,i)=>kkIdx[j[0]]=i);
// tank bone -> KayKit joint (weights merge)
const MAP=n=>{n=n.replace('mixamorig','');if(n==='Hips')return 'hips';if(n==='Spine'||n==='Spine1')return 'spine';if(n==='Spine2'||/Shoulder$/.test(n))return 'chest';if(n==='Neck'||n==='Head'||n==='HeadTop_End')return 'head';
  const s=n.startsWith('Left')?'l':n.startsWith('Right')?'r':null;if(!s)return 'hips';n=n.replace(/^(Left|Right)/,'');
  if(n==='Arm')return 'upperarm.'+s;if(n==='ForeArm')return 'lowerarm.'+s;if(/^Hand/.test(n))return 'hand.'+s;if(n==='UpLeg')return 'upperleg.'+s;if(n==='Leg')return 'lowerleg.'+s;if(n==='Foot')return 'foot.'+s;if(/^Toe/.test(n))return 'toes.'+s;return 'hips'};
// ---- geometry
const nV=m.verts,P0=[],N0=[];for(let i=0;i<nV;i++){P0.push(rot(m.P.slice(i*3,i*3+3)));N0.push(rot(m.N.slice(i*3,i*3+3)))}
const idx=m.idx,nT=idx.length/3;
// hammer axis (found from the hand lying on it): head end A -> pommel end B
const AX=JSON.parse(process.env.AX||'{"c":[-0.118,0.712,0.063],"d":[-0.686,-0.224,0.693]}');   // handle axis fitted on thin handle triangles (point + direction pommel-ward)
const ax=nrm(AX.d),A=AX.c,Bp=add(A,ax);
const HAM=JSON.parse(process.env.HAM||'{"t0":-0.5,"t1":-0.2,"rh":0.19,"rhandle":0.04,"t2":0.3,"pommelT":0.16,"pommelR":0.075}');
const axisT=p=>dot(sub(p,A),ax),axisR=p=>len(sub(sub(p,A),mul(ax,axisT(p))));
const isHam=(c,n)=>{const t=axisT(c),r=axisR(c);if(t>=HAM.t0&&t<=HAM.t1)return r<HAM.rh?true:false;if(t>HAM.t1&&t<=HAM.t2){const lim=(t>HAM.pommelT?HAM.pommelR:HAM.rhandle);if(r>=lim)return false;const rad=nrm(sub(sub(c,A),mul(ax,t)));return (r<(HAM.cut1||0.045)||Math.abs(dot(n,rad))>0.7||Math.abs(dot(n,ax))>0.85)?'cut':false}return false};
const triHam=[];let nh=0;for(let t=0;t<nT;t++){const c=[0,1,2].reduce((s,k)=>add(s,mul(P0[idx[t*3+k]],1/3)),[0,0,0]);const nn=nrm([0,1,2].reduce((s,k)=>add(s,N0[idx[t*3+k]]),[0,0,0]));const h=isHam(c,nn);triHam.push(h);if(h)nh++}
// leftover shards: connected components (position-welded) of the non-hammer triangles that are tiny -> hammer if on the axis, else dropped
{const key=new Map(),vid=P0.map(p=>{const k=p.map(v=>Math.round(v*1e4)).join(',');if(!key.has(k))key.set(k,key.size);return key.get(k)}),par=[...key.values()].map((_,i)=>i);const f=x=>{while(par[x]!==x){par[x]=par[par[x]];x=par[x]}return x};
 for(let t=0;t<nT;t++)if(!triHam[t]){const a=f(vid[idx[t*3]]),b=f(vid[idx[t*3+1]]),c=f(vid[idx[t*3+2]]);par[b]=a;par[c]=a}
 const cnt=new Map();for(let t=0;t<nT;t++)if(!triHam[t]){const r=f(vid[idx[t*3]]);cnt.set(r,(cnt.get(r)||0)+1)}
 let moved=0,dropped=0;for(let t=0;t<nT;t++)if(!triHam[t]){const r=f(vid[idx[t*3]]);if(cnt.get(r)<1500){const c=[0,1,2].reduce((s,k)=>add(s,mul(P0[idx[t*3+k]],1/3)),[0,0,0]);if(axisT(c)>0.1&&axisR(c)<0.2){triHam[t]=true;moved++}else{triHam[t]='drop';dropped++}}}
 console.log('shard tris moved to hammer',moved,'dropped',dropped,'components',cnt.size)}
// hammer components: keep only big ones (head+handle); small ones (fist fragment, cloth strip) go back to the body
{const key=new Map(),vid=P0.map(p=>{const k=p.map(v=>Math.round(v*1e4)).join(',');if(!key.has(k))key.set(k,key.size);return key.get(k)}),par=[...key.values()].map((_,i)=>i);const f=x=>{while(par[x]!==x){par[x]=par[par[x]];x=par[x]}return x};
 for(let t=0;t<nT;t++)if(triHam[t]===true){const a=f(vid[idx[t*3]]),b=f(vid[idx[t*3+1]]),c=f(vid[idx[t*3+2]]);par[b]=a;par[c]=a}
 const cnt=new Map();for(let t=0;t<nT;t++)if(triHam[t]===true){const r=f(vid[idx[t*3]]);cnt.set(r,(cnt.get(r)||0)+1)}
 console.log('hammer components',[...cnt.values()].sort((a,b)=>b-a).slice(0,12).join(','));const MINC=+process.env.MINC||600;let back=0;
 for(let t=0;t<nT;t++)if(triHam[t]===true&&cnt.get(f(vid[idx[t*3]]))<MINC){triHam[t]=false;back++}console.log('returned to body',back)}
console.log('hammer tris',nh,'of',nT);
// ---- deformation to the straightened T-pose
const Rm=J.map(j=>rotFromTo(sub(B[j[2]]||sub(B[j[1]],[0,-1,0]),B[j[1]]),j[4]));
const jointOfBone=RAW.meshes[0].bones.map(n=>kkIdx[MAP(n)]);
// skin weight smoothing (Laplacian on the position-welded mesh) to soften shoulder/elbow stretch; SMOOTH iterations, default 4
const nJ=J.length,WD=[];for(let i=0;i<nV;i++){const a=new Float32Array(nJ);for(let k=0;k<4;k++){const w=m.sw[i*4+k];if(w>0)a[jointOfBone[m.si[i*4+k]]]+=w}WD.push(a)}
{const key=new Map(),vid=P0.map(p=>{const k=p.map(v=>Math.round(v*1e4)).join(',');if(!key.has(k))key.set(k,key.size);return key.get(k)}),nb=[...key.values()].map(()=>new Set());
 for(let t=0;t<nT;t++)for(let k=0;k<3;k++){const a=vid[idx[t*3+k]],b=vid[idx[t*3+(k+1)%3]];nb[a].add(b);nb[b].add(a)}
 const rep=new Array(nb.length);for(let i=0;i<nV;i++)rep[vid[i]]=i;
 for(let it=0;it<(+process.env.SMOOTH||4);it++){const NW=WD.map(a=>Float32Array.from(a));for(let i=0;i<nV;i++){const set=[...nb[vid[i]]];if(!set.length)continue;const mean=new Float32Array(nJ);for(const q of set){const w=WD[rep[q]];for(let j=0;j<nJ;j++)mean[j]+=w[j]/set.length}for(let j=0;j<nJ;j++)NW[i][j]=0.5*WD[i][j]+0.5*mean[j]}for(let i=0;i<nV;i++)WD[i]=NW[i]}}
const P1=[],N1=[],SI=[],SW=[];
for(let i=0;i<nV;i++){const acc={};for(let j=0;j<nJ;j++)if(WD[i][j]>0.02)acc[j]=WD[i][j];
  let ent=Object.entries(acc).sort((a,b)=>b[1]-a[1]).slice(0,4);const tot=ent.reduce((s,e)=>s+e[1],0);let p=[0,0,0],n=[0,0,0];
  for(const [j,w] of ent){const [kk,src,ch,tg]=J[j],q=add(mv(Rm[j],sub(P0[i],B[src])),tg);p=add(p,mul(q,w/tot));n=add(n,mul(mv(Rm[j],N0[i]),w/tot))}
  P1.push(p);N1.push(nrm(n));SI.push(ent.map(e=>+e[0]));SW.push(ent.map(e=>e[1]/tot));while(SI[i].length<4){SI[i].push(0);SW[i].push(0)}}
let minY=1e9;for(const p of P1)minY=Math.min(minY,p[1]);console.log('sole y before shift',minY.toFixed(3));for(const p of P1)p[1]-=minY;const SH=[0,-minY,0];
// ---- body mesh (non-hammer triangles) & hammer prop (rest-frame -> grip frame)
const G=B.RightHand;const u=nrm(sub(A,Bp));const xa=nrm(cross(u,[0,1,0]));const za=cross(xa,u);
const toGrip=p=>{const d=sub(p,G);return [dot(d,xa),dot(d,u),dot(d,za)]};
const toGripN=n=>[dot(n,xa),dot(n,u),dot(n,za)];
function remap(sel){const map=new Map(),V=[];const tri=[];for(let t=0;t<nT;t++){if(sel(t)){for(let k=0;k<3;k++){const o=idx[t*3+k];if(!map.has(o)){map.set(o,V.length);V.push(o)}tri.push(map.get(o))}}}return {V,tri}}
const body=remap(t=>!triHam[t]),ham=remap(t=>triHam[t]===true);
globalThis.DBG={body,ham};
(async()=>{
 if(process.env.DEBUG_SPLIT){const io=new NodeIO(),uv=m.uv.map((v,i)=>i%2?1-v:v),jpg=await sharp(texF).resize(512,512).jpeg({quality:80}).toBuffer();for(const [nm,sel] of [['DbgBody',body],['DbgHam',ham]]){const d=new Document(),b=d.createBuffer(),A=(a,t,C)=>d.createAccessor().setType(t).setArray(C.from(a.flat?a.flat():a)).setBuffer(b);const mt=d.createMaterial('m').setDoubleSided(true).setBaseColorTexture(d.createTexture().setImage(new Uint8Array(jpg)).setMimeType('image/jpeg'));const pr=d.createPrimitive().setAttribute('POSITION',A(sel.V.map(o=>P0[o]),'VEC3',Float32Array)).setAttribute('NORMAL',A(sel.V.map(o=>N0[o]),'VEC3',Float32Array)).setAttribute('TEXCOORD_0',A(sel.V.map(o=>[uv[o*2],uv[o*2+1]]),'VEC2',Float32Array)).setIndices(A(sel.tri,'SCALAR',Uint32Array)).setMaterial(mt);d.createScene().addChild(d.createNode(nm).setMesh(d.createMesh(nm).addPrimitive(pr)));await io.write(path.join(outDir,nm+'.glb'),d)}console.log('debug split written');return}
 const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);fs.mkdirSync(outDir,{recursive:true});
 const jpg=await require('./emis.js').liftTexture(texF,1024,{gamma:+process.env.GAMMA||1,bright:+process.env.BRIGHT||1});
 const uv=m.uv.map((v,i)=>i%2?1-v:v);const emj=await require('./emis.js').makeEmissive(texF,1024,{gain:+process.env.EGAIN||0.8});
 // body on the KayKit Barbarian skeleton, bone translations rewritten to the tank's lengths
 const d=await io.read(KK),root=d.getRoot(),skin=root.listSkins()[0],joints=skin.listJoints();
 const rm=new Set(root.listNodes().filter(n=>n.getMesh()));
 const rw=n=>{const M=n.getWorldMatrix();return [[M[0],M[4],M[8]],[M[1],M[5],M[9]],[M[2],M[6],M[10]]]};   // world rotation (column-major -> rows)
 const kkW={};for(const j of joints)kkW[j.getName()]=j.getWorldTranslation();
 const jn={};for(const j of joints)jn[j.getName()]=j;
 const newW={};for(const [kk,src,ch,tg] of J)newW[kk]=tg;
 // KayKit chain offsets scaled for the joints we do not skin (wrist, handslot, IK, controls): parent-relative KayKit offset * ratio
 const ratio={arm:L.arm/0.242,fore:L.fore/0.26,up:L.up/0.227,low:L.low/0.149};
 for(const j of joints){const n=j.getName();if(newW[n])continue;const par=PN(j);const pn=par&&joints.includes(par)?par.getName():null;if(!pn)continue;
   const off=sub(kkW[n],kkW[pn]);let r=1;if(/wrist|handslot|handIK/.test(n))r=ratio.fore;else if(/toes|foot|IK|control|heel|knee/.test(n))r=ratio.low;else if(/elbow/.test(n))r=ratio.arm;
   newW[n]=null;newW['__off_'+n]=mul(off,r)}
 // resolve unskinned joint world positions in parent order
 const depth=j=>{let d=0,p=PN(j);while(p){d++;p=PN(p)}return d};const order=[...joints].sort((x,y)=>depth(x)-depth(y));
 const W={};for(const j of order){const n=j.getName();if(newW[n])W[n]=newW[n];else if(newW['__off_'+n]){const pn=PN(j).getName();W[n]=add(W[pn]||kkW[pn],newW['__off_'+n])}else W[n]=kkW[n]}
 for(const n of Object.keys(W))if(n!=='root')W[n]=add(W[n],SH);
 const shift=-minY;
 // local translation = parentWorldRot^-1 * (childWorld - parentWorld); rotations are the KayKit rest rotations (so KayKit clips apply unchanged)
 const lastShift=[0,0,0];
 for(const j of order){const n=j.getName(),par=PN(j);const pn=par&&joints.includes(par)?par.getName():null;const w=W[n];
   if(!pn){j.setTranslation(w);continue}
   const Rp=rw(par),Rinv=[[Rp[0][0],Rp[1][0],Rp[2][0]],[Rp[0][1],Rp[1][1],Rp[2][1]],[Rp[0][2],Rp[1][2],Rp[2][2]]];j.setTranslation(mv(Rinv,sub(w,W[pn])))}
 // inverse binds from world rest (rotation = KayKit world rotation)
 const mat4=(Rr,p)=>[Rr[0][0],Rr[1][0],Rr[2][0],0,Rr[0][1],Rr[1][1],Rr[2][1],0,Rr[0][2],Rr[1][2],Rr[2][2],0,p[0],p[1],p[2],1];
 const inv=(M)=>{const R=[[M[0],M[4],M[8]],[M[1],M[5],M[9]],[M[2],M[6],M[10]]],Ri=[[R[0][0],R[1][0],R[2][0]],[R[0][1],R[1][1],R[2][1]],[R[0][2],R[1][2],R[2][2]]];const t=mv(Ri,[M[12],M[13],M[14]]);return mat4(Ri,mul(t,-1))};
 // mesh vertices & skin indices in KayKit joint order: joints[] order of the skin
 const jidx={};joints.forEach((j,i)=>jidx[j.getName()]=i);
 const ibm=joints.map(j=>{const w=j.getWorldMatrix();return inv(w)});   // after translations changed (gltf-transform recomputes world matrices)
 skin.setInverseBindMatrices(d.createAccessor().setType('MAT4').setArray(Float32Array.from(ibm.flat())).setBuffer(root.listBuffers()[0]));
 const buf=root.listBuffers()[0],A_=(a,t,C)=>d.createAccessor().setType(t).setArray(C.from(a.flat?a.flat():a)).setBuffer(buf);
 const mat=d.createMaterial('tank').setRoughnessFactor(0.9).setMetallicFactor(0).setDoubleSided(true).setBaseColorTexture(d.createTexture().setImage(new Uint8Array(jpg)).setMimeType('image/jpeg')).setEmissiveTexture(d.createTexture().setImage(new Uint8Array(emj)).setMimeType('image/jpeg')).setEmissiveFactor([1,1,1]);
 const mk=(sel,name,jointsFor)=>{const P=sel.V.map(o=>P1[o]),N=sel.V.map(o=>N1[o]),U=sel.V.map(o=>[uv[o*2],uv[o*2+1]]);
   const J_=sel.V.map(o=>SI[o].map(j=>jidx[J[j][0]])),W_=sel.V.map(o=>SW[o]);
   return d.createPrimitive().setAttribute('POSITION',A_(P,'VEC3',Float32Array)).setAttribute('NORMAL',A_(N,'VEC3',Float32Array)).setAttribute('TEXCOORD_0',A_(U,'VEC2',Float32Array)).setAttribute('JOINTS_0',A_(J_,'VEC4',Uint16Array)).setAttribute('WEIGHTS_0',A_(W_,'VEC4',Float32Array)).setIndices(A_(sel.tri,'SCALAR',Uint32Array)).setMaterial(mat)};
 // verts are in tank space: apply nothing here (posed already); skeleton world rest == tank straightened joints
 const first=[...rm][0];for(const n of rm)n.setMesh(null);
 first.setMesh(d.createMesh('TankBody').addPrimitive(mk(body))).setSkin(skin).setName('Barbarian_Body');
 for(const mm of root.listMeshes())if(mm.listParents().filter(p=>p.propertyType==='Node').length===0)mm.dispose();
 for(const a of root.listAnimations()){for(const c of a.listChannels())c.dispose();for(const s of a.listSamplers())s.dispose();a.dispose()}
 const {prune}=require('@gltf-transform/functions');await d.transform(prune());
 await io.write(path.join(outDir,'TankKK.glb'),d);
 // hammer prop
 const d2=new Document(),b2=d2.createBuffer(),mat2=d2.createMaterial('tank').setRoughnessFactor(0.9).setMetallicFactor(0).setDoubleSided(true).setBaseColorTexture(d2.createTexture().setImage(new Uint8Array(jpg)).setMimeType('image/jpeg')).setEmissiveTexture(d2.createTexture().setImage(new Uint8Array(emj)).setMimeType('image/jpeg')).setEmissiveFactor([1,1,1]);
 let hp=ham.V.map(o=>toGrip(P0[o])),hn=ham.V.map(o=>toGripN(N0[o])),hu=ham.V.map(o=>[uv[o*2],uv[o*2+1]]);
 // longer handle: the Tripo head block is lifted by DY and the handle is rebuilt as a clean 10-sided tube (+ bands, pommel) coloured from the original handle texels
 const DY=process.env.DY!==undefined?+process.env.DY:0.10;const headMin=Math.min(...hp.map(p=>p[1]));hp=hp.map(p=>[p[0],p[1]+DY,p[2]]);
 const med=a=>{a.sort((x,y)=>x-y);return a[a.length>>1]};
 const uvs=(sel)=>{const U=[],V=[];for(let t=0;t<nT;t++)if(triHam[t]==='cut'){const c=[0,1,2].reduce((q,k)=>add(q,mul(P0[idx[t*3+k]],1/3)),[0,0,0]);if(sel(axisT(c),axisR(c))){for(let k=0;k<3;k++){U.push(uv[idx[t*3+k]*2]);V.push(uv[idx[t*3+k]*2+1])}}}return U.length?[med(U),med(V)]:[0.5,0.5]};
 const uvH=uvs((t,r)=>r<0.03&&t<0.1),uvB=uvs((t,r)=>t>0.12);console.log('handle uv',uvH.map(v=>+v.toFixed(3)),'band uv',uvB.map(v=>+v.toFixed(3)));
 const tube=(y0,y1,R,seg,uvv)=>{const P=[],N=[],U=[],I=[];for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2,x=Math.cos(a),z=Math.sin(a);for(const y of [y0,y1]){P.push([x*R,y,z*R]);N.push([x,0,z]);U.push(uvv)}}
   for(let i=0;i<seg;i++){const b=i*2;I.push(b,b+1,b+3,b,b+3,b+2)}return {P,N,U,I}};
 const parts=[tube(-0.10,headMin+DY+0.06,0.03,10,uvB),tube(-0.06,-0.01,0.042,10,uvH),tube(0.05,0.09,0.042,10,uvH),tube(0.28,0.32,0.042,10,uvH),tube(-0.14,-0.10,0.05,10,uvH)];
 const base0=hp.length;let off=hp.length;const addI=[];for(const q of parts){hp.push(...q.P);hn.push(...q.N);hu.push(...q.U);for(const i of q.I)addI.push(i+off);off+=q.P.length}
 ham.tri=[...ham.tri,...addI];
 const A2=(a,t,C)=>d2.createAccessor().setType(t).setArray(C.from(a.flat?a.flat():a)).setBuffer(b2);
 const pr=d2.createPrimitive().setAttribute('POSITION',A2(hp,'VEC3',Float32Array)).setAttribute('NORMAL',A2(hn,'VEC3',Float32Array)).setAttribute('TEXCOORD_0',A2(hu,'VEC2',Float32Array)).setIndices(A2(ham.tri,'SCALAR',Uint32Array)).setMaterial(mat2);
 d2.createScene().addChild(d2.createNode('TankHammer').setMesh(d2.createMesh('TankHammer').addPrimitive(pr)));await io.write(path.join(outDir,'TankHammer.glb'),d2);
 const hb=[0,1,2].map(k=>[Math.min(...hp.map(p=>p[k])),Math.max(...hp.map(p=>p[k]))]);console.log('hammer grip-frame bbox',JSON.stringify(hb.map(a=>a.map(v=>+v.toFixed(3)))),'body tris',body.tri.length/3,'hammer tris',ham.tri.length/3);
 fs.writeFileSync(path.join(outDir,'reskin-info.json'),JSON.stringify({shift,L,lat,legLat,hammerAxis:{A,B:Bp},grip:G,HAM,hammerBBox:hb,bodyTris:body.tri.length/3,hammerTris:ham.tri.length/3,minY},null,1));
})();
