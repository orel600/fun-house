# בדיקה בלי המשחק: מלביש על החיה את האנימציות (רק סיבובים, ו-Body זז, כמו במשחק) ושומר תמונה ב-gen/anims.png
# python animtest.py [קובץ אנימציות, ברירת מחדל ההאסקי] [שמות אנימציות מופרדים בפסיק]. ANG=זווית המצלמה, FRAMES=כמה תמונות לכל אנימציה
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..','pilot3d'))
import numpy as np,pygltflib
from PIL import Image
from gl import acc
from rast import raster
g=pygltflib.GLTF2().load(sys.argv[1] if len(sys.argv)>1 else 'C:/kk/dog/Husky.glb')
CLIPS=sys.argv[2].split(',') if len(sys.argv)>2 else ['Idle','Walk','Gallop','Attack','Eating','Gallop_Jump']
r=np.load('gen/rig.npy',allow_pickle=True).item();V,NV,NF,UV,J,Wt,IBM,TR=r['V'],r['NV'],r['NF'],r['UV'],r['J'],r['W'],r['IBM'],r['T']
T=np.asarray(Image.open('gen/hero_tex.png').convert('RGB')).astype(float)
sk=g.skins[0];par={c:i for i,n in enumerate(g.nodes) for c in (n.children or [])}
def qm(q):
    x,y,z,w=q;return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
def clip(name):
    for a in g.animations:
        if a.name in(name,'dog_'+name):return a
def pose(an,t):
    tr={i:{'t':np.array(TR[i] or [0,0,0],float),'r':np.array(n.rotation or [0,0,0,1],float),'s':np.array(n.scale or [1,1,1],float)} for i,n in enumerate(g.nodes)}
    for ch in an.channels:
        nm=g.nodes[ch.target.node].name
        if ch.target.path=='translation' and nm!='Body':continue   # כמו במשחק
        if ch.target.path=='scale' or nm.startswith(('IK','FF','Pole')):continue
        s=an.samplers[ch.sampler];ti=acc(g,s.input)[:,0];vo=acc(g,s.output)
        k=np.searchsorted(ti,t)
        if k<=0:v=vo[0]
        elif k>=len(ti):v=vo[-1]
        else:
            f=(t-ti[k-1])/(ti[k]-ti[k-1]);v=vo[k-1]*(1-f)+vo[k]*f
            if ch.target.path=='rotation':v=v/np.linalg.norm(v)
        tr[ch.target.node]['t' if ch.target.path=='translation' else 'r']=v
    Wm={}
    def w(i):
        if i in Wm:return Wm[i]
        M=np.eye(4);M[:3,:3]=qm(tr[i]['r'])*tr[i]['s'];M[:3,3]=tr[i]['t']
        Wm[i]=(w(par[i])@M) if i in par else M;return Wm[i]
    return np.array([w(j)@IBM[k] for k,j in enumerate(sk.joints)])
def render(X,ang=float(os.environ.get('ANG',70)),W=260,H=230,s=52):
    a=np.radians(ang);R=np.array([[np.cos(a),0,np.sin(a)],[0,1,0],[-np.sin(a),0,np.cos(a)]])
    P=X@R.T;p2=np.c_[P[:,0]*s+W/2,(3.9-P[:,1])*s]
    Z,I=raster(p2,P[:,2],NF,W,H);out=np.full((H,W,3),255.0);ys,xs=np.where(I>=0);fi=I[ys,xs]
    a_,b_,c_=p2[NF[fi,0]],p2[NF[fi,1]],p2[NF[fi,2]];q=np.c_[xs+0.5,ys+0.5]
    v0=b_-a_;v1=c_-a_;ww=q-a_;dd=v0[:,0]*v1[:,1]-v1[:,0]*v0[:,1]+1e-12
    l1=(ww[:,0]*v1[:,1]-v1[:,0]*ww[:,1])/dd;l2=(v0[:,0]*ww[:,1]-ww[:,0]*v0[:,1])/dd;l0=1-l1-l2
    uv=l0[:,None]*UV[NF[fi,0]]+l1[:,None]*UV[NF[fi,1]]+l2[:,None]*UV[NF[fi,2]]
    c=T[np.clip((uv[:,1]*512).astype(int),0,511),np.clip((uv[:,0]*512).astype(int),0,511)]
    fn=np.cross(P[NF[:,1]]-P[NF[:,0]],P[NF[:,2]]-P[NF[:,0]]);fn/=np.linalg.norm(fn,axis=1,keepdims=True)+1e-12
    L=np.array([-0.4,0.6,0.7]);L/=np.linalg.norm(L);sh=np.clip(0.75+0.35*(fn[fi]@L),0.4,1.15)
    out[ys,xs]=c*sh[:,None];out[int(3.9*s):int(3.9*s)+1,:]=150;return out
rows=[];Vh=np.c_[V,np.ones(len(V))]
for name in CLIPS:
    an=clip(name);dur=max(acc(g,an.samplers[c.sampler].input).max() for c in an.channels);fr=[]
    for t in np.linspace(0,dur*0.95,int(os.environ.get('FRAMES',5))):
        M=pose(an,t);X=np.zeros((len(V),3))
        for k in range(4):X+=Wt[:,k:k+1]*np.einsum('nij,nj->ni',M[J[:,k]],Vh)[:,:3]
        fr.append(render(X[NV]))
    rows.append(np.concatenate(fr,1));print(name,round(dur,2))
Image.fromarray(np.clip(np.concatenate(rows,0),0,255).astype(np.uint8)).save('gen/anims.png')
