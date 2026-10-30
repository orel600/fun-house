# fit hero to KayKit Knight skeleton (unchanged), transfer skin weights by nearest knight surface points, write glb
import sys;sys.path.insert(0,__import__('os').path.dirname(__file__))
import numpy as np,trimesh,pygltflib,io
from scipy.spatial import cKDTree
from knight import knight_samples
from gl import acc
d=np.load('gen/paint.npy',allow_pickle=True).item();V,F,NV,NF,UV=d['V'],d['F'],d['NV'],d['NF'],d['UV']
y0=V[:,1].min();a=V[np.abs(V[:,0])>0.55];armc=(a[:,1].min()+a[:,1].max())/2-y0
s=1.107/armc;V=(V-[0,y0,0])*s
V[:,0]-=(V[:,0].max()+V[:,0].min())/2
print('scale',s,'height',V[:,1].max())
g,parts=knight_samples()
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
top=np.argsort(-Wd,axis=1)[:,:4];tw=np.take_along_axis(Wd,top,1);tw/=tw.sum(1,keepdims=True)
jnames=[g.nodes[j].name for j in g.skins[0].joints]
from collections import Counter;print(Counter(jnames[t] for t in top[:,0]))
Nn=mesh.vertex_normals
np.save('gen/rig.npy',{'V':V,'F':F,'NV':NV,'NF':NF,'UV':UV,'J':top,'W':tw,'N':Nn},allow_pickle=True)
# ---- write glb: knight nodes + skin, one new skinned mesh ----
X=V[NV].astype(np.float32);Nx=Nn[NV].astype(np.float32);U=UV.astype(np.float32)
Jx=top[NV].astype(np.uint16);Wx=tw[NV].astype(np.float32);I=NF.astype(np.uint16).ravel()
ibm=acc(g,g.skins[0].inverseBindMatrices).astype(np.float32)
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
aB=A(ibm.reshape(-1,16),'MAT4',5126)
vimg=add(np.frombuffer(png,np.uint8))
nodes=[]
for i,n in enumerate(g.nodes):
    n2=pygltflib.Node(name=n.name,children=n.children,translation=n.translation,rotation=n.rotation,scale=n.scale,matrix=n.matrix)
    if n.name=='Knight_Body':n2.name='PilotHero_Body';n2.mesh=0;n2.skin=0
    nodes.append(n2)
out=pygltflib.GLTF2(asset=pygltflib.Asset(version='2.0',generator='fun-house pilot'),scene=0,
  scenes=[pygltflib.Scene(nodes=g.scenes[g.scene or 0].nodes)],nodes=nodes,
  meshes=[pygltflib.Mesh(name='PilotHero_Body',primitives=[pygltflib.Primitive(attributes=pygltflib.Attributes(POSITION=aP,NORMAL=aN,TEXCOORD_0=aU,JOINTS_0=aJ,WEIGHTS_0=aW),indices=aI,material=0)])],
  materials=[pygltflib.Material(name='PilotHero',pbrMetallicRoughness=pygltflib.PbrMetallicRoughness(baseColorTexture=pygltflib.TextureInfo(index=0),metallicFactor=0,roughnessFactor=1))],
  textures=[pygltflib.Texture(source=0,sampler=0)],samplers=[pygltflib.Sampler(magFilter=9729,minFilter=9987)],
  images=[pygltflib.Image(bufferView=vimg,mimeType='image/png')],
  skins=[pygltflib.Skin(joints=g.skins[0].joints,inverseBindMatrices=aB,skeleton=g.skins[0].skeleton)],
  accessors=accs,bufferViews=views,buffers=[pygltflib.Buffer(byteLength=len(blob))])
out.set_binary_blob(blob);out.save_binary(sys.argv[1]);print('wrote',sys.argv[1],len(blob)//1024,'KB','verts',len(X),'tris',len(NF))
