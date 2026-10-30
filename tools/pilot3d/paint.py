# projection texture: each face takes UVs from the sheet view that sees it best; hidden faces get a flat palette cell
import sys;sys.path.insert(0,__import__('os').path.dirname(__file__))
import numpy as np,trimesh
from PIL import Image
from scipy import ndimage
from scipy.cluster.vq import kmeans2
from rast import raster
m=trimesh.load('gen/dec.ply',process=False);V=m.vertices.copy();F=m.faces;Pt=m.triangles_center;N=m.face_normals
img=Image.open(sys.argv[1]).convert('RGB');sheet=np.asarray(img).astype(float)
fg=sheet.min(axis=2)<235;fg[985:1000,:]=False;fg=ndimage.binary_erosion(fg,iterations=4)
_,(iy,ix)=ndimage.distance_transform_edt(~fg,return_indices=True);sheet=sheet[iy,ix]
lo,hi=V.min(0),V.max(0);Y0,Y1=110,985
views=[('front',np.array([1,0,0]),np.array([0,0,1]),35,813),
       ('back',np.array([-1,0,0]),np.array([0,0,-1]),1211,1989),
       ('right',np.array([0,0,1]),np.array([-1,0,0]),827,1185),
       ('left',np.array([0,0,1]),np.array([1,0,0]),827,1185)]
best=np.full(len(F),-1.0);who=np.full(len(F),-1);PX=[];samp=np.zeros((len(F),3))
for k,(name,u,d,x0,x1) in enumerate(views):
    uu=V@u;umin,umax=uu.min(),uu.max()
    pr=lambda Q:(x0+(Q@u-umin)/(umax-umin)*(x1-x0),Y0+(hi[1]-Q[:,1])/(hi[1]-lo[1])*(Y1-Y0))
    px,py=pr(V);PX.append(np.c_[px,py])
    sc=0.5;Z,_=raster(np.c_[px*sc,py*sc],V@d,F,int(2000*sc),int(1125*sc))
    Zm=ndimage.maximum_filter(Z,3)
    cx,cy=pr(Pt);zi=Zm[np.clip((cy*sc).astype(int),0,Z.shape[0]-1),np.clip((cx*sc).astype(int),0,Z.shape[1]-1)]
    vis=(Pt@d)>=zi-0.02
    score=np.where(vis,N@d,-2)*(0.72 if name in('left','right') else 1)
    c=sheet[np.clip(cy.astype(int),0,1124),np.clip(cx.astype(int),0,1999)]
    upd=score>best;best[upd]=score[upd];who[upd]=k;samp[upd]=c[upd]
hidden=best<0.12;print('hidden',hidden.sum(),'of',len(F))
adj=[[] for _ in F]
for a,b in m.face_adjacency:adj[a].append(b);adj[b].append(a)
bad=hidden.copy()
for it in range(80):
    if not bad.any():break
    nb=bad.copy()
    for i in np.where(bad)[0]:
        g=[j for j in adj[i] if not bad[j]]
        if g:samp[i]=samp[g].mean(0);nb[i]=False
    bad=nb
# atlas 512: front+back on top row, side + palette cells below
S=0.29;A=np.full((512,512,3),128.0)
crop=lambda x0,x1:np.asarray(Image.fromarray(sheet[Y0:Y1,x0:x1].astype(np.uint8)).resize((round((x1-x0)*S),round((Y1-Y0)*S)),Image.LANCZOS)).astype(float)
place={0:(0,0),1:(226,0),2:(0,256)}
for k,(ox,oy) in place.items():
    _,_,_,x0,x1=views[k];c=crop(x0,x1);A[oy:oy+c.shape[0],ox:ox+c.shape[1]]=c
pal,lab=kmeans2(samp[hidden],48,minit='++',seed=1) if hidden.sum()>48 else (samp[hidden],np.arange(hidden.sum()))
cell=12;cols=(512-110)//cell
for i,p in enumerate(pal):A[256+(i//cols)*cell:256+(i//cols+1)*cell,110+(i%cols)*cell:110+(i%cols+1)*cell]=p
Image.fromarray(np.clip(A,0,255).astype(np.uint8)).save('gen/hero_tex.png')
# split vertices per (vertex, uv source)
keys={};NV=[];UV=[];SRC=[];NF=np.zeros_like(F)
hid_idx=np.where(hidden)[0];hl=dict(zip(hid_idx,lab))
for fi,f in enumerate(F):
    for j,v in enumerate(f):
        if hidden[fi]:
            l=hl[fi];key=(v,'p',l);uv=((110+(l%cols+0.5)*cell)/512,(256+(l//cols+0.5)*cell)/512)
        else:
            k=who[fi];k2=2 if k==3 else k;key=(v,k2)
            ox,oy=place[k2];_,_,_,x0,x1=views[k2];p=PX[k][v]
            uv=((ox+(p[0]-x0)*S)/512,(oy+(p[1]-Y0)*S)/512)
        if key not in keys:keys[key]=len(NV);NV.append(v);UV.append(uv)
        NF[fi,j]=keys[key]
NV=np.array(NV);UV=np.clip(np.array(UV),0,1)
print('verts',len(NV),'faces',len(F))
np.save('gen/paint.npy',{'V':V,'F':F,'NV':NV,'NF':NF,'UV':UV},allow_pickle=True)
