// node autoskin.js wanderer.raw.json wan_staff_axis.json basecolor.jpg outdir
// Wanderer (static Tripo mesh, no rig) -> KayKit Rig_Medium names: heuristic joints from the mesh, capsule weights (+ cloak/hat rules, Laplacian smoothing),
// bind pose = the mesh's own pose (arms rotated like rig.py --apose, no mesh deformation), staff cut out as a prop (grip frame, y along the staff).
const fs=require('fs'),path=require('path'),sharp=require('sharp');
const {NodeIO,Document}=require('@gltf-transform/core'),{ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const [rawF,axF,texF,outDir]=process.argv.slice(2);
const KK='C:/kk/adv/addons/kaykit_character_pack_adventures/Characters/gltf/Barbarian.glb';
const sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],len=a=>Math.hypot(...a),nrm=a=>mul(a,1/(len(a)||1));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const qmul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
const qinv=q=>[-q[0],-q[1],-q[2],q[3]];
const qrot=(q,v)=>{const t=mul(cross(q.slice(0,3),v),2);return add(add(v,mul(t,q[3])),cross(q.slice(0,3),t))};
function qFromTo(a,b){a=nrm(a);b=nrm(b);const c=dot(a,b);if(c<-0.9999){const ax=Math.abs(a[0])<0.9?[1,0,0]:[0,1,0],u=nrm(cross(a,ax));return [u[0],u[1],u[2],0]}const x=cross(a,b),q=[x[0],x[1],x[2],1+c],l=Math.hypot(...q);return q.map(v=>v/l)}
const mat4=(q,p)=>{const x=qrot(q,[1,0,0]),y=qrot(q,[0,1,0]),z=qrot(q,[0,0,1]);return [...x,0,...y,0,...z,0,...p,1]};
const invRigid=(q,p)=>{const qi=qinv(q),pi=mul(qrot(qi,p),-1);return mat4(qi,pi)};
(async()=>{
const R=JSON.parse(fs.readFileSync(rawF))[0],AX=JSON.parse(fs.readFileSync(axF));
const nV=R.verts;let P=[];for(let i=0;i<nV;i++)P.push(R.P.slice(i*3,i*3+3));const N=[];for(let i=0;i<nV;i++)N.push(R.N.slice(i*3,i*3+3));
const y0=Math.min(...P.map(p=>p[1]));P=P.map(p=>[p[0],p[1]-y0,p[2]]);const H=Math.max(...P.map(p=>p[1]));
const idx=R.idx,nT=idx.length/3;
// ---- staff cut
const SC=AX.c.slice(),SD=nrm(AX.d);SC[1]=SC[1];const sT=p=>dot(sub(p,SC),SD),sR=p=>len(sub(sub(p,SC),mul(SD,sT(p))));
const RS=+process.env.RS||0.03;const cls=new Array(nT).fill(0);let ns=0;
for(let t=0;t<nT;t++){const c=[0,1,2].reduce((s,k)=>add(s,mul(P[idx[t*3+k]],1/3)),[0,0,0]);if(c[1]>0.085&&sR(c)<RS&&c[2]>0.1){cls[t]=1;ns++}}
console.log('staff tris',ns,'of',nT);
// ---- joints (world, feet at y=0, facing +z, KayKit .l = +x)
const ys=y=>y*H;
const body=P.filter((p,i)=>true);
const cxz=(lo,hi)=>{const q=P.filter(p=>p[1]>lo*H&&p[1]<hi*H);return [q.reduce((s,p)=>s+p[0],0)/q.length,q.reduce((s,p)=>s+p[2],0)/q.length]};
const [cx,cz]=cxz(0.45,0.7);
const feet=P.filter(p=>p[1]<0.09*H);const fl=feet.filter(p=>p[0]>cx),fr=feet.filter(p=>p[0]<=cx);const cen=a=>[a.reduce((s,p)=>s+p[0],0)/a.length,a.reduce((s,p)=>s+p[2],0)/a.length];
const [flx,flz]=cen(fl),[frx,frz]=cen(fr);console.log('torso axis',cx.toFixed(3),cz.toFixed(3),'feet l',flx.toFixed(3),flz.toFixed(3),'r',frx.toFixed(3),frz.toFixed(3));
const W={};
W.hips=[cx,0.50*H,cz];W.spine=[cx,0.60*H,cz];W.chest=[cx,0.71*H,cz+0.02];W.head=[cx,0.795*H,cz+0.03];
const hipX=0.055;
for(const [s,sd,fx,fz] of [[1,'l',flx,flz],[-1,'r',frx,frz]]){
  W['upperleg.'+sd]=[cx+s*hipX,0.49*H,cz];W['foot.'+sd]=[fx,0.075*H,fz];W['toes.'+sd]=[fx,0.03*H,fz+0.08];
  const k=mul(add(W['upperleg.'+sd],W['foot.'+sd]),0.5);W['lowerleg.'+sd]=[k[0],0.28*H,k[2]+0.02];
}
// arms: right (-x) hangs at the side; left (+x) goes forward to the staff hand
const HAND_Y=+process.env.HAND_Y||0.52;
W['upperarm.r']=[cx-0.15,0.765*H,cz];W['lowerarm.r']=[cx-0.17,0.60*H,cz+0.03];W['wrist.r']=[cx-0.17,0.47*H,cz+0.09];W['hand.r']=[cx-0.17,0.435*H,cz+0.10];
const sa=(y)=>add(SC,mul(SD,(y-SC[1])/SD[1]));const hp=sa(HAND_Y);
W['upperarm.l']=[cx+0.15,0.765*H,cz];W['lowerarm.l']=[cx+0.16,0.62*H,cz+0.09];W['wrist.l']=[hp[0],HAND_Y*H+0.03,hp[2]];W['hand.l']=[hp[0],HAND_Y*H-0.01,hp[2]];
const HEADTOP=[cx,0.98*H,cz+0.04];
// ---- weights: capsules
const SEG=[['hips',W.hips,W.spine],['spine',W.spine,W.chest],['chest',W.chest,W.head],['head',W.head,HEADTOP],
 ['upperleg.l',W['upperleg.l'],W['lowerleg.l']],['lowerleg.l',W['lowerleg.l'],W['foot.l']],['foot.l',W['foot.l'],W['toes.l']],
 ['upperleg.r',W['upperleg.r'],W['lowerleg.r']],['lowerleg.r',W['lowerleg.r'],W['foot.r']],['foot.r',W['foot.r'],W['toes.r']],
 ['upperarm.l',W['upperarm.l'],W['lowerarm.l']],['lowerarm.l',W['lowerarm.l'],W['wrist.l']],['hand.l',W['wrist.l'],W['hand.l']],
 ['upperarm.r',W['upperarm.r'],W['lowerarm.r']],['lowerarm.r',W['lowerarm.r'],W['wrist.r']],['hand.r',W['wrist.r'],W['hand.r']],
 ['hips',[cx,0.46*H,cz],[cx,0.50*H,cz]]];
const segD=(p,a,b)=>{const ab=sub(b,a),t=Math.max(0,Math.min(1,dot(sub(p,a),ab)/dot(ab,ab)));return len(sub(p,add(a,mul(ab,t))))};
const names=[...new Set(SEG.map(s=>s[0]))],ni={};names.forEach((n,i)=>ni[n]=i);const nJ=names.length;
const WD=[];
for(let i=0;i<nV;i++){const p=P[i],d=new Float32Array(nJ).fill(9);for(const [n,a,b] of SEG)d[ni[n]]=Math.min(d[ni[n]],segD(p,a,b));
  let w=new Float32Array(nJ);
  // special regions: hat/head, cloak/back
  if(p[1]>0.83*H){w[ni.head]=1}
  else if(p[2]<cz-0.08&&p[1]>0.12*H&&p[1]<0.78*H){const y=p[1]/H;if(y>0.62)w[ni.chest]=1;else if(y>0.48)w[ni.spine]=1;else w[ni.hips]=1}
  else{const lim=names.map(n=>/arm|hand/.test(n)?(+process.env.ARMR||0.06):/leg|foot/.test(n)?(+process.env.LEGR||0.1):9);
    // side cloak (far from the body axis, low) belongs to the torso unless it is close to an arm
    if(Math.abs(p[0]-cx)>0.17&&p[1]<0.62*H){for(const n of names)if(/arm|hand/.test(n)&&d[ni[n]]>lim[ni[n]])d[ni[n]]=9}
    for(let j=0;j<nJ;j++)if(d[j]>lim[j])d[j]=9;
    const dm=Math.min(...d);if(dm>=9){w[ni.hips]=1}else{let s=0;for(let j=0;j<nJ;j++){w[j]=Math.exp(-(d[j]-dm)/0.02);s+=w[j]}for(let j=0;j<nJ;j++)w[j]/=s}}
  WD.push(w)}
// smoothing on the position-welded mesh
{const key=new Map(),vid=P.map(p=>{const k=p.map(v=>Math.round(v*1e4)).join(',');if(!key.has(k))key.set(k,key.size);return key.get(k)}),nb=[...key.values()].map(()=>new Set());
 for(let t=0;t<nT;t++)for(let k=0;k<3;k++){const a=vid[idx[t*3+k]],b=vid[idx[t*3+(k+1)%3]];nb[a].add(b);nb[b].add(a)}const rep=new Array(nb.length);for(let i=0;i<nV;i++)rep[vid[i]]=i;
 for(let it=0;it<(+process.env.SMOOTH||3);it++){const NW=WD.map(a=>Float32Array.from(a));for(let i=0;i<nV;i++){const set=[...nb[vid[i]]];if(!set.length)continue;const mean=new Float32Array(nJ);for(const q of set){const w=WD[rep[q]];for(let j=0;j<nJ;j++)mean[j]+=w[j]/set.length}for(let j=0;j<nJ;j++)NW[i][j]=0.5*WD[i][j]+0.5*mean[j]}for(let i=0;i<nV;i++)WD[i]=NW[i]}}
const SI=[],SW=[];for(let i=0;i<nV;i++){let e=[...WD[i]].map((w,j)=>[j,w]).sort((a,b)=>b[1]-a[1]).slice(0,4);const tot=e.reduce((s,x)=>s+x[1],0)||1;SI.push(e.map(x=>x[0]));SW.push(e.map(x=>x[1]/tot))}
// ---- split staff / body
const remap=sel=>{const map=new Map(),V=[],tri=[];for(let t=0;t<nT;t++)if(sel(t))for(let k=0;k<3;k++){const o=idx[t*3+k];if(!map.has(o)){map.set(o,V.length);V.push(o)}tri.push(map.get(o))}return {V,tri}};
const bodyS=remap(t=>!cls[t]),staffS=remap(t=>cls[t]===1);
// ---- skeleton on the KayKit Barbarian doc
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),d=await io.read(KK),root=d.getRoot(),skin=root.listSkins()[0],joints=skin.listJoints();
const PN=n=>n.getParentNode?n.getParentNode():null;const depth=j=>{let k=0,p=PN(j);while(p){k++;p=PN(p)}return k};const order=[...joints].sort((a,b)=>depth(a)-depth(b));
const kkLocalT={},kkLocalQ={};for(const j of joints){kkLocalT[j.getName()]=j.getTranslation();kkLocalQ[j.getName()]=j.getRotation()}
const kkWQ={},kkWP={};for(const j of order){const n=j.getName(),p=PN(j),pn=p&&joints.includes(p)?p.getName():null;kkWQ[n]=pn?qmul(kkWQ[pn],kkLocalQ[n]):kkLocalQ[n];kkWP[n]=pn?add(kkWP[pn],qrot(kkWQ[pn],kkLocalT[n])):kkLocalT[n]}
// arm bind rotations: align the KayKit limb direction (+-x) to the mesh's limb direction
const BQ={},BP={};
const armDir=(a,b)=>nrm(sub(W[b],W[a]));
const OV={};for(const [s,sd] of [[1,'l'],[-1,'r']]){const kkDir=[s,0,0];
  OV['upperarm.'+sd]=qmul(qFromTo(kkDir,armDir('upperarm.'+sd,'lowerarm.'+sd)),kkWQ['upperarm.'+sd]);
  OV['lowerarm.'+sd]=qmul(qFromTo(kkDir,armDir('lowerarm.'+sd,'wrist.'+sd)),kkWQ['lowerarm.'+sd])}
const ratio=(n)=>1;
const outT={},outQ={};
for(const j of order){const n=j.getName(),p=PN(j),pn=p&&joints.includes(p)?p.getName():null;
  if(!pn){BQ[n]=kkLocalQ[n];BP[n]=kkLocalT[n];outT[n]=kkLocalT[n];outQ[n]=kkLocalQ[n];continue}
  const targetQ=OV[n]||qmul(BQ[pn],kkLocalQ[n]);
  const lq=qmul(qinv(BQ[pn]),targetQ);
  let lt;
  if(W[n]){lt=qrot(qinv(BQ[pn]),sub(W[n],BP[pn]))}
  else{ // unlisted joint: KayKit local offset scaled by the nearest limb's length ratio
    const kl=len(kkLocalT[n]);let r=1;const group=/hand|wrist|handslot|elbow/.test(n)?(n.endsWith('.l')?'l':'r'):null;
    if(group){const a=W['wrist.'+group],b=W['lowerarm.'+group];r=len(sub(a,b))/0.26}else if(/IK|control|toe|heel|knee/.test(n)){r=0.9}
    lt=mul(kkLocalT[n],r)}
  outT[n]=lt;outQ[n]=lq;BQ[n]=targetQ;BP[n]=add(BP[pn],qrot(BQ[pn],lt))}
for(const j of joints){j.setTranslation(outT[j.getName()]);j.setRotation(outQ[j.getName()])}
const jidx={};joints.forEach((j,i)=>jidx[j.getName()]=i);
const ibm=joints.map(j=>invRigid(BQ[j.getName()],BP[j.getName()]));
const buf=root.listBuffers()[0];skin.setInverseBindMatrices(d.createAccessor().setType('MAT4').setArray(Float32Array.from(ibm.flat())).setBuffer(buf));
const emj=await require('./emis.js').makeEmissive(texF,1024,{gain:+process.env.EGAIN||1.0});const jpg=await require('./emis.js').liftTexture(texF,1024,{gamma:+process.env.GAMMA||1,bright:+process.env.BRIGHT||1}),uv=R.uv.map((v,i)=>i%2?1-v:v);
const A_=(a,t,C)=>d.createAccessor().setType(t).setArray(C.from(a.flat?a.flat():a)).setBuffer(buf);
const mat=d.createMaterial('wanderer').setRoughnessFactor(0.9).setMetallicFactor(0).setDoubleSided(true).setBaseColorTexture(d.createTexture().setImage(new Uint8Array(jpg)).setMimeType('image/jpeg')).setEmissiveTexture(d.createTexture().setImage(new Uint8Array(emj)).setMimeType('image/jpeg')).setEmissiveFactor([1,1,1]);
const sel=bodyS;
const prim=d.createPrimitive().setAttribute('POSITION',A_(sel.V.map(o=>P[o]),'VEC3',Float32Array)).setAttribute('NORMAL',A_(sel.V.map(o=>N[o]),'VEC3',Float32Array)).setAttribute('TEXCOORD_0',A_(sel.V.map(o=>[uv[o*2],uv[o*2+1]]),'VEC2',Float32Array))
 .setAttribute('JOINTS_0',A_(sel.V.map(o=>{const a=SI[o].map(j=>jidx[names[j]]);while(a.length<4)a.push(0);return a}),'VEC4',Uint16Array)).setAttribute('WEIGHTS_0',A_(sel.V.map(o=>{const a=SW[o].slice();while(a.length<4)a.push(0);return a}),'VEC4',Float32Array)).setIndices(A_(sel.tri,'SCALAR',Uint32Array)).setMaterial(mat);
const rm=root.listNodes().filter(n=>n.getMesh());const first=rm[0];for(const n of rm)n.setMesh(null);
first.setMesh(d.createMesh('WandererBody').addPrimitive(prim)).setSkin(skin).setName('Barbarian_Body');
for(const mm of root.listMeshes())if(mm.listParents().filter(p=>p.propertyType==='Node').length===0)mm.dispose();
for(const a of root.listAnimations()){for(const c of a.listChannels())c.dispose();for(const s of a.listSamplers())s.dispose();a.dispose()}
await d.transform(require('@gltf-transform/functions').prune());fs.mkdirSync(outDir,{recursive:true});
await io.write(path.join(outDir,'WandererKK.glb'),d);
// ---- staff prop: grip frame (origin = staff axis at the hand height, y = staff axis, x = world +x projected)
const G=sa(HAND_Y),ya=SD,xa=nrm(sub([1,0,0],mul(ya,ya[0]))),za=cross(xa,ya);
const toG=p=>{const q=sub(p,G);return [dot(q,xa),dot(q,ya),dot(q,za)]},toGN=n=>[dot(n,xa),dot(n,ya),dot(n,za)];
const d2=new Document(),b2=d2.createBuffer(),m2=d2.createMaterial('wanderer').setRoughnessFactor(0.9).setMetallicFactor(0).setDoubleSided(true).setBaseColorTexture(d2.createTexture().setImage(new Uint8Array(jpg)).setMimeType('image/jpeg')).setEmissiveTexture(d2.createTexture().setImage(new Uint8Array(emj)).setMimeType('image/jpeg')).setEmissiveFactor([1,1,1]);
const A2=(a,t,C)=>d2.createAccessor().setType(t).setArray(C.from(a.flat?a.flat():a)).setBuffer(b2);
const pr=d2.createPrimitive().setAttribute('POSITION',A2(staffS.V.map(o=>toG(P[o])),'VEC3',Float32Array)).setAttribute('NORMAL',A2(staffS.V.map(o=>toGN(N[o])),'VEC3',Float32Array)).setAttribute('TEXCOORD_0',A2(staffS.V.map(o=>[uv[o*2],uv[o*2+1]]),'VEC2',Float32Array)).setIndices(A2(staffS.tri,'SCALAR',Uint32Array)).setMaterial(m2);
d2.createScene().addChild(d2.createNode('WandererStaff').setMesh(d2.createMesh('WandererStaff').addPrimitive(pr)));await io.write(path.join(outDir,'WandererStaff.glb'),d2);
// mount at bind: handslot.l local so that the staff lands where it was
const hs='handslot.l',Rhs=BQ[hs],Php=BP[hs];const mountPos=qrot(qinv(Rhs),sub(G,Php));
// prop axes in world: x=xa,y=ya,z=za -> quaternion
const toQ=(x,y,z)=>{const m=[[x[0],y[0],z[0]],[x[1],y[1],z[1]],[x[2],y[2],z[2]]],tr=m[0][0]+m[1][1]+m[2][2];let q;if(tr>0){const S=Math.sqrt(tr+1)*2;q=[(m[2][1]-m[1][2])/S,(m[0][2]-m[2][0])/S,(m[1][0]-m[0][1])/S,0.25*S]}else if(m[0][0]>m[1][1]&&m[0][0]>m[2][2]){const S=Math.sqrt(1+m[0][0]-m[1][1]-m[2][2])*2;q=[0.25*S,(m[0][1]+m[1][0])/S,(m[0][2]+m[2][0])/S,(m[2][1]-m[1][2])/S]}else if(m[1][1]>m[2][2]){const S=Math.sqrt(1+m[1][1]-m[0][0]-m[2][2])*2;q=[(m[0][1]+m[1][0])/S,0.25*S,(m[1][2]+m[2][1])/S,(m[0][2]-m[2][0])/S]}else{const S=Math.sqrt(1+m[2][2]-m[0][0]-m[1][1])*2;q=[(m[0][2]+m[2][0])/S,(m[1][2]+m[2][1])/S,0.25*S,(m[1][0]-m[0][1])/S]}return q};
const propWorldQ=toQ(xa,ya,za),mountRot=qmul(qinv(Rhs),propWorldQ);
fs.writeFileSync(path.join(outDir,'wanderer-info.json'),JSON.stringify({H,cx,cz,W,staffAxis:{c:SC,d:SD},grip:G,mount:{bone:hs,pos:mountPos.map(v=>+v.toFixed(4)),rot:mountRot.map(v=>+v.toFixed(4))},bodyTris:bodyS.tri.length/3,staffTris:staffS.tri.length/3},null,1));
console.log('body tris',bodyS.tri.length/3,'staff tris',staffS.tri.length/3,'mount',JSON.stringify({pos:mountPos.map(v=>+v.toFixed(3)),rot:mountRot.map(v=>+v.toFixed(3))}));
})();
