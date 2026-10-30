# שלב 5 לחיה: השלד של ההאסקי (Quaternius, CC0) מותאם לגוף של החיה, והמשקלים מועתקים ממנו. לכן כל האנימציות של ההאסקי עובדות
# python rig.py <Out.glb> [--glow]
#   השלד: אותן עצמות ואותם סיבובים, רק המיקומים זזים. "עיוות" ממפה את ההאסקי לחיה לפי נקודות ציון (זנב, כפות אחוריות וקדמיות, חוטם,
#         בטן, גב וגובה), ורוחב לפי האורך, כך שראש גדול של גור מקבל את עצם הראש ולא את הצוואר. Body (השורש) לא זז, כי האנימציות מזיזות אותו
#   המשקלים: מהנקודה הקרובה על ההאסקי המעוות. עצמות העזר של הכפות (IK, FF) עוברות לעצם התחתונה של הרגל, והאוזניים לראש,
#             כי המשחק מנגן רק סיבובים (בלי עצמות עזר), ואוזניים של גור תלויות ולא זקופות כמו של האסקי
#   --glow: הסימנים הכתומים בטקסטורה נשמרים גם כטקסטורת זוהר (emissive). המשחק מפעים אותם (pet.js, render3d.js)
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..','pilot3d'))
import numpy as np,trimesh,pygltflib,io
from scipy.spatial import cKDTree
from PIL import Image
from gl import acc,local,worlds
HUSKY='C:/kk/dog/Husky.glb'
GLOW='--glow' in sys.argv;NAME=os.path.splitext(os.path.basename(sys.argv[1]))[0]
g=pygltflib.GLTF2().load(HUSKY);sk=g.skins[0];W0,par=worlds(g)
jn=[g.nodes[j].name for j in sk.joints];NJ=len(jn);ibm0=acc(g,sk.inverseBindMatrices).reshape(-1,4,4).transpose(0,2,1)
M0=np.array([W0[j]@ibm0[k] for k,j in enumerate(sk.joints)])
# לאן עוברים משקלים של עצמות שהמשחק לא מזיז
def target(n):
    if n.startswith(('FF.','IKFrontLeg.')):return 'FrontLowerLeg.'+n[-1]
    if n.startswith(('FFB.','IKBackLeg.')):return 'BackLowerLeg.'+n[-1]
    if n.startswith('Ear'):return 'Head'
    return n
remap=np.array([jn.index(target(n)) for n in jn])
# ההאסקי: נקודות צפופות על הגוף בתנוחת הבסיס, עם משקלים
SP=[];SW=[];rng=np.random.default_rng(1)
for p in g.meshes[0].primitives:
    P=acc(g,p.attributes.POSITION);Fi=acc(g,p.indices).reshape(-1,3);J=acc(g,p.attributes.JOINTS_0).astype(int);Wt=acc(g,p.attributes.WEIGHTS_0)
    Ph=np.c_[P,np.ones(len(P))];X=np.zeros((len(P),3))
    for k in range(4):X+=Wt[:,k:k+1]*np.einsum('nij,nj->ni',M0[J[:,k]],Ph)[:,:3]
    D=np.zeros((len(P),NJ));np.add.at(D,(np.repeat(np.arange(len(P)),4),remap[J].ravel()),Wt.ravel())
    area=np.linalg.norm(np.cross(X[Fi[:,1]]-X[Fi[:,0]],X[Fi[:,2]]-X[Fi[:,0]]),axis=1)/2
    n=max(1500,int(area.sum()*4000));fi=rng.choice(len(Fi),n,p=area/area.sum())
    r=rng.random((n,2));m=r.sum(1)>1;r[m]=1-r[m];b=np.c_[1-r.sum(1),r]
    SP+=[(X[Fi[fi]]*b[:,:,None]).sum(1),X];SW+=[(D[Fi[fi]]*b[:,:,None]).sum(1),D]
SP=np.concatenate(SP);SW=np.concatenate(SW);HH=SP[:,1].max()
# החיה: רגליים על 0, באמצע, ובגובה של ההאסקי
d=np.load('gen/paint.npy',allow_pickle=True).item();V,F,NV,NF,UV=d['V'],d['F'],d['NV'],d['NF'],d['UV']
V=V-[0,V[:,1].min(),0];V*=HH/V[:,1].max();V[:,0]-=(V[:,0].max()+V[:,0].min())/2
# נקודות ציון: z של הזנב, הכפות האחוריות, הקדמיות והחוטם. y של הבטן, הגב והקודקוד
def marks(P):
    h=P[:,1].max();low=P[P[:,1]<0.06*h];mid=(low[:,2].min()+low[:,2].max())/2
    zh=np.median(low[low[:,2]<mid,2]);zf=np.median(low[low[:,2]>=mid,2])
    w=np.percentile(np.abs(P[:,0]),90);band=(P[:,2]>zh+0.3*(zf-zh))&(P[:,2]<zf-0.3*(zf-zh))&(np.abs(P[:,0])<0.35*w)
    return [P[:,2].min(),zh,zf,P[:,2].max()],[0,np.percentile(P[band,1],2),np.percentile(P[band,1],98),h]
zH,yH=marks(SP);zP,yP=marks(V);print('husky z',np.round(zH,2),'y',np.round(yH,2));print('pet   z',np.round(zP,2),'y',np.round(yP,2))
def lin(v,a,b):   # מיפוי ליניארי לפי קטעים, עם המשך ישר מעבר לקצוות
    v=np.asarray(v,float);out=np.interp(v,a,b);lo=v<a[0];hi=v>a[-1]
    out[lo]=b[0]+(v[lo]-a[0])*(b[1]-b[0])/(a[1]-a[0]);out[hi]=b[-1]+(v[hi]-a[-1])*(b[-1]-b[-2])/(a[-1]-a[-2]);return out
# רוחב לאורך הגוף (בגובה הגוף, בלי רגליים), כדי שראש רחב יקבל ראש רחב
def widths(P,zs):
    t=(P[:,2]-zs[0])/(zs[-1]-zs[0]);bins=np.linspace(0,1,13);out=[]
    for a,b in zip(bins[:-1],bins[1:]):
        s=np.abs(P[(t>=a)&(t<b),0]);out.append(np.percentile(s,95) if len(s)>20 else np.nan)
    out=np.array(out);ok=~np.isnan(out);return np.interp(np.arange(12),np.where(ok)[0],out[ok])
wH=widths(SP,zH);wP=widths(V,zP);ratio=np.convolve(np.pad(wP/wH,1,mode='edge'),[0.25,0.5,0.25],'valid')
def warp(Q):
    Q=np.atleast_2d(Q).astype(float);z=lin(Q[:,2],zH,zP);y=lin(Q[:,1],yH,yP)
    t=np.clip((z-zP[0])/(zP[-1]-zP[0])*12-0.5,0,11);x=Q[:,0]*np.interp(t,np.arange(12),ratio)
    return np.c_[x,y,z]
SPw=warp(SP);tree=cKDTree(SPw)
dist,idx=tree.query(V,k=12);w=1/(dist+1e-3)**2;Wd=(SW[idx]*w[:,:,None]).sum(1)/w.sum(1)[:,None]
mesh=trimesh.Trimesh(V,F,process=False);adj=mesh.vertex_neighbors
for it in range(2):Wd=0.5*Wd+0.5*np.array([Wd[n].mean(0) if len(n) else Wd[i] for i,n in enumerate(adj)])
top=np.argsort(-Wd,axis=1)[:,:4];tw=np.take_along_axis(Wd,top,1);tw/=tw.sum(1,keepdims=True)
from collections import Counter;print(Counter(jn[t] for t in top[:,0]).most_common(40))
# השלד החדש: כל צומת מתחת לשלד במקום המעוות, אותם סיבובים. Body נשאר
arm=[i for i,n in enumerate(g.nodes) if n.name=='AnimalArmature'][0]
under=lambda i:i!=arm and (i in par) and (par[i]==arm or under(par[i]))
newpos={i:warp(W0[i][:3,3])[0] for i in range(len(g.nodes)) if under(i) and g.nodes[i].name!='Body'}
W1={}
def w1(i):
    if i in W1:return W1[i]
    n=g.nodes[i]
    if i in newpos:
        Pw=w1(par[i]);t=np.linalg.inv(Pw)@np.r_[newpos[i],1];n.translation=t[:3].tolist()
    M=local(n);W1[i]=(w1(par[i])@M) if i in par else M;return W1[i]
for i in range(len(g.nodes)):w1(i)
ibm=np.array([np.linalg.inv(W1[j]) for j in sk.joints])
Nn=mesh.vertex_normals
np.save('gen/rig.npy',{'V':V,'F':F,'NV':NV,'NF':NF,'UV':UV,'J':top,'W':tw,'N':Nn,'IBM':ibm,'T':{i:g.nodes[i].translation for i in range(len(g.nodes))}},allow_pickle=True)
# ---- glb: הצמתים של ההאסקי (בלי הגוף שלו) וגוף חדש אחד, בשורש הסצנה, בלי הזזה, כדי שתנוחת הבסיס תהיה בדיוק העולם ----
X=V[NV].astype(np.float32);Nx=Nn[NV].astype(np.float32);U=UV.astype(np.float32)
Jx=top[NV].astype(np.uint16);Wx=tw[NV].astype(np.float32);I=NF.astype(np.uint16).ravel()
png=open('gen/hero_tex.png','rb').read()
if GLOW:   # הסימנים הזוהרים: כתום-צהוב רווי. כל השאר שחור
    a=np.asarray(Image.open('gen/hero_tex.png').convert('RGB')).astype(float);r,gg,b=a[...,0],a[...,1],a[...,2]
    m=(r>200)&(r-b>90)&(gg<0.86*r)&(gg>0.45*r);e=np.zeros_like(a);e[m]=a[m]
    bio=io.BytesIO();Image.fromarray(e.astype(np.uint8)).save(bio,'PNG');glow=bio.getvalue();print('glow px',int(m.sum()))
blob=b'';views=[];accs=[]
def add(arr,target=None):
    global blob
    while len(blob)%4:blob+=b'\0'
    bb=arr.tobytes();views.append(pygltflib.BufferView(buffer=0,byteOffset=len(blob),byteLength=len(bb),target=target));blob+=bb;return len(views)-1
def A(arr,typ,ct,target=None,mm=False):
    v=add(arr,target);a=pygltflib.Accessor(bufferView=v,componentType=ct,count=len(arr),type=typ)
    if mm:a.min=arr.min(0).tolist();a.max=arr.max(0).tolist()
    accs.append(a);return len(accs)-1
aP=A(X,'VEC3',5126,34962,True);aN=A(Nx,'VEC3',5126,34962);aU=A(U,'VEC2',5126,34962)
aJ=A(Jx,'VEC4',5123,34962);aW=A(Wx,'VEC4',5126,34962);aI=A(I,'SCALAR',5123,34963)
aB=A(ibm.transpose(0,2,1).astype(np.float32).reshape(-1,16),'MAT4',5126)
imgs=[pygltflib.Image(bufferView=add(np.frombuffer(png,np.uint8)),mimeType='image/png')]
texs=[pygltflib.Texture(source=0,sampler=0)]
mat=pygltflib.Material(name=NAME,pbrMetallicRoughness=pygltflib.PbrMetallicRoughness(baseColorTexture=pygltflib.TextureInfo(index=0),metallicFactor=0,roughnessFactor=1))
if GLOW:
    imgs.append(pygltflib.Image(bufferView=add(np.frombuffer(glow,np.uint8)),mimeType='image/png'));texs.append(pygltflib.Texture(source=1,sampler=0))
    mat.emissiveTexture=pygltflib.TextureInfo(index=1);mat.emissiveFactor=[1,1,1]
nodes=[]
for i,n in enumerate(g.nodes):
    nodes.append(pygltflib.Node(name=n.name,children=n.children,translation=n.translation,rotation=n.rotation,scale=n.scale,matrix=n.matrix))
    if n.mesh is not None:nodes[-1].name=n.name+'_old'
nodes.append(pygltflib.Node(name=NAME+'_Body',mesh=0,skin=0))
out=pygltflib.GLTF2(asset=pygltflib.Asset(version='2.0',generator='fun-house pet3d'),scene=0,
  scenes=[pygltflib.Scene(nodes=g.scenes[g.scene or 0].nodes+[len(nodes)-1])],nodes=nodes,
  meshes=[pygltflib.Mesh(name=NAME+'_Body',primitives=[pygltflib.Primitive(attributes=pygltflib.Attributes(POSITION=aP,NORMAL=aN,TEXCOORD_0=aU,JOINTS_0=aJ,WEIGHTS_0=aW),indices=aI,material=0)])],
  materials=[mat],textures=texs,samplers=[pygltflib.Sampler(magFilter=9729,minFilter=9987)],images=imgs,
  skins=[pygltflib.Skin(joints=sk.joints,inverseBindMatrices=aB,skeleton=sk.skeleton)],
  accessors=accs,bufferViews=views,buffers=[pygltflib.Buffer(byteLength=len(blob))])
out.set_binary_blob(blob);out.save_binary(sys.argv[1]);print('wrote',sys.argv[1],len(blob)//1024,'KB','verts',len(X),'tris',len(NF))
