# fit hero to KayKit Knight skeleton, transfer skin weights by nearest knight surface points, write glb
# python rig.py <Out.glb> [--apose] [--pack]
#   --apose: הידיים בדף יורדות באלכסון (לא תנוחת T). מסובבים את עצמות הזרוע של האביר לאותה זווית לפני ההעתקה,
#            כך שתנוחת הבסיס של השלד = התנוחה של הדמות. האנימציות של KayKit קובעות את הסיבוב המלא של כל עצם, אז הן לא משתנות
#   --pack:  תרמיל גדול על הגב: מכווץ אותו קצת, וכולו זז עם החזה (בלי משקלים מהזרועות)
import sys,os;sys.path.insert(0,os.path.dirname(__file__))
import numpy as np,trimesh,pygltflib,io
from scipy.spatial import cKDTree
from knight import knight_samples
from gl import acc,local,worlds
APOSE='--apose' in sys.argv;PACK='--pack' in sys.argv;NAME=os.path.splitext(os.path.basename(sys.argv[1]))[0]
d=np.load('gen/paint.npy',allow_pickle=True).item();V,F,NV,NF,UV=d['V'],d['F'],d['NV'],d['NF'],d['UV']
y0=V[:,1].min();V=V-[0,y0,0]
if PACK:   # התרמיל: מה שמאחורי הגב (z<-0.1) בגובה הגוף. נדחס 20% לכיוון הגב, ו-10% ברוחב
    bag=(V[:,2]<-0.10)&(V[:,1]>0.45)&(V[:,1]<1.5);t=np.clip((-0.10-V[:,2])/0.15,0,1)*bag
    V[:,2]=np.where(bag,-0.10+(V[:,2]+0.10)*0.8,V[:,2]);V[:,0]*=1-0.1*t
if APOSE:s=2.09/V[:,1].max()    # הגובה של גיבור הפיילוט, שהתאים לאביר
else:a=V[np.abs(V[:,0])>0.55];armc=(a[:,1].min()+a[:,1].max())/2;s=1.107/armc
V=V*s
V[:,0]-=(V[:,0].max()+V[:,0].min())/2
print('scale',s,'height',V[:,1].max())
g,parts=knight_samples()
sk=g.skins[0];ibm=acc(g,sk.inverseBindMatrices).reshape(-1,4,4).transpose(0,2,1)
if APOSE:
    W0,par=worlds(g);ix={g.nodes[j].name:j for j in sk.joints};sh=W0[ix['upperarm.l']][:3,3]
    arm=V[np.abs(V[:,0])>sh[0]+0.27]   # הזרועות, מחוץ לגוף ולתרמיל
    def err(th):
        u=np.array([np.cos(th),-np.sin(th)]);q=np.c_[np.abs(arm[:,0])-sh[0],arm[:,1]-sh[1]]
        return np.median(np.abs(q[:,0]*u[1]-q[:,1]*u[0]))
    TH=min(np.radians(np.arange(0,70,0.5)),key=err);print('arm angle',round(np.degrees(TH),1),'deg')
    def rz(a):c,s_=np.cos(a),np.sin(a);M=np.eye(4);M[:2,:2]=[[c,-s_],[s_,c]];return M
    for side,sg in (('l',-1),('r',1)):
        j=ix['upperarm.'+side];p=W0[j][:3,3];T=np.eye(4);T[:3,3]=p;Ti=np.eye(4);Ti[:3,3]=-p
        Wn=T@rz(sg*TH)@Ti@W0[j];L=np.linalg.inv(W0[par[j]])@Wn
        import scipy.spatial.transform as st
        g.nodes[j].rotation=st.Rotation.from_matrix(L[:3,:3]).as_quat().tolist()
    W1,_=worlds(g);ibm1=np.array([np.linalg.inv(W1[j]) for j in sk.joints])
    Mk=np.array([W1[j]@ibm[k] for k,j in enumerate(sk.joints)])   # תנוחת T -> התנוחה החדשה
    def pose(P,J,Wt):
        Ph=np.c_[P,np.ones(len(P))];X=np.zeros((len(P),3))
        for k in range(4):X+=Wt[:,k:k+1]*np.einsum('nij,nj->ni',Mk[J[:,k]],Ph)[:,:3]
        return X
    parts=[(n,pose(P,J,Wt),Fi,J,Wt) for n,P,Fi,J,Wt in parts];ibm=ibm1
# dense samples on knight surfaces with interpolated weights (dense per-joint vectors)
NJ=len(g.skins[0].joints);SP=[];SW=[]
rng=np.random.default_rng(1)
for name,P,Fi,J,Wt in parts:
    if name=='Knight_Helmet':continue
    D=np.zeros((len(P),NJ));np.add.at(D,(np.repeat(np.arange(len(P)),4),J.ravel()),Wt.ravel())
    area=np.linalg.norm(np.cross(P[Fi[:,1]]-P[Fi[:,0]],P[Fi[:,2]]-P[Fi[:,0]]),axis=1)/2
    n=max(2000,int(area.sum()*60000));fi=rng.choice(len(Fi),n,p=area/area.sum())
    r=rng.random((n,2));m=r.sum(1)>1;r[m]=1-r[m];b=np.c_[1-r.sum(1),r]
    SP.append((P[Fi[fi]]*b[:,:,None]).sum(1));SW.append((D[Fi[fi]]*b[:,:,None]).sum(1))
    SP.append(P);SW.append(D)
SP=np.concatenate(SP);SW=np.concatenate(SW);tree=cKDTree(SP)
dist,idx=tree.query(V,k=12)
w=1/(dist+1e-3)**2;Wd=(SW[idx]*w[:,:,None]).sum(1)/w.sum(1)[:,None]
# smooth a little over the mesh
mesh=trimesh.Trimesh(V,F,process=False);adj=mesh.vertex_neighbors
for it in range(2):Wd=0.5*Wd+0.5*np.array([Wd[n].mean(0) if len(n) else Wd[i] for i,n in enumerate(adj)])
if PACK:   # התרמיל זז רק עם החזה
    ch=[g.nodes[j].name for j in sk.joints].index('chest');bagS=np.r_[bag]
    Wd[bagS]=0;Wd[bagS,ch]=1
top=np.argsort(-Wd,axis=1)[:,:4];tw=np.take_along_axis(Wd,top,1);tw/=tw.sum(1,keepdims=True)
jnames=[g.nodes[j].name for j in g.skins[0].joints]
from collections import Counter;print(Counter(jnames[t] for t in top[:,0]))
Nn=mesh.vertex_normals
np.save('gen/rig.npy',{'V':V,'F':F,'NV':NV,'NF':NF,'UV':UV,'J':top,'W':tw,'N':Nn,'IBM':ibm,'rot':{i:n.rotation for i,n in enumerate(g.nodes)}},allow_pickle=True)
# ---- write glb: knight nodes + skin, one new skinned mesh ----
X=V[NV].astype(np.float32);Nx=Nn[NV].astype(np.float32);U=UV.astype(np.float32)
Jx=top[NV].astype(np.uint16);Wx=tw[NV].astype(np.float32);I=NF.astype(np.uint16).ravel()
ibmx=ibm.transpose(0,2,1).astype(np.float32)
png=open('gen/hero_tex.png','rb').read()
blob=b'';views=[];accs=[]
def add(arr,target=None):
    global blob
    while len(blob)%4:blob+=b'\0'
    b=arr.tobytes();views.append(pygltflib.BufferView(buffer=0,byteOffset=len(blob),byteLength=len(b),target=target));blob+=b;return len(views)-1
def A(arr,typ,ct,target=None,mm=False):
    v=add(arr,target);a=pygltflib.Accessor(bufferView=v,componentType=ct,count=len(arr) if arr.ndim>1 or typ=='SCALAR' else 1,type=typ)
    if mm:a.min=arr.min(0).tolist();a.max=arr.max(0).tolist()
    accs.append(a);return len(accs)-1
aP=A(X,'VEC3',5126,34962,True);aN=A(Nx,'VEC3',5126,34962);aU=A(U,'VEC2',5126,34962)
aJ=A(Jx,'VEC4',5123,34962);aW=A(Wx,'VEC4',5126,34962);aI=A(I,'SCALAR',5123,34963)
aB=A(ibmx.reshape(-1,16),'MAT4',5126)
vimg=add(np.frombuffer(png,np.uint8))
nodes=[]
for i,n in enumerate(g.nodes):
    n2=pygltflib.Node(name=n.name,children=n.children,translation=n.translation,rotation=n.rotation,scale=n.scale,matrix=n.matrix)
    if n.name=='Knight_Body':n2.name=NAME+'_Body';n2.mesh=0;n2.skin=0
    nodes.append(n2)
out=pygltflib.GLTF2(asset=pygltflib.Asset(version='2.0',generator='fun-house pilot'),scene=0,
  scenes=[pygltflib.Scene(nodes=g.scenes[g.scene or 0].nodes)],nodes=nodes,
  meshes=[pygltflib.Mesh(name=NAME+'_Body',primitives=[pygltflib.Primitive(attributes=pygltflib.Attributes(POSITION=aP,NORMAL=aN,TEXCOORD_0=aU,JOINTS_0=aJ,WEIGHTS_0=aW),indices=aI,material=0)])],
  materials=[pygltflib.Material(name=NAME,pbrMetallicRoughness=pygltflib.PbrMetallicRoughness(baseColorTexture=pygltflib.TextureInfo(index=0),metallicFactor=0,roughnessFactor=1))],
  textures=[pygltflib.Texture(source=0,sampler=0)],samplers=[pygltflib.Sampler(magFilter=9729,minFilter=9987)],
  images=[pygltflib.Image(bufferView=vimg,mimeType='image/png')],
  skins=[pygltflib.Skin(joints=g.skins[0].joints,inverseBindMatrices=aB,skeleton=g.skins[0].skeleton)],
  accessors=accs,bufferViews=views,buffers=[pygltflib.Buffer(byteLength=len(blob))])
out.set_binary_blob(blob);out.save_binary(sys.argv[1]);print('wrote',sys.argv[1],len(blob)//1024,'KB','verts',len(X),'tris',len(NF))
