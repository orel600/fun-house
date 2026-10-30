# כלי עזר: תמונה מהירה של gen/dec.ply משלוש זוויות (בלי צבע), לבדוק את הצורה. יוצא gen/look.png
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..','pilot3d'))
import numpy as np,trimesh
from PIL import Image
from rast import raster
m=trimesh.load(sys.argv[1] if len(sys.argv)>1 else 'gen/dec.ply',process=False);V=m.vertices;F=m.faces
fn=m.face_normals;outs=[]
for ang in (0,90,180,35):
    a=np.radians(ang);R=np.array([[np.cos(a),0,np.sin(a)],[0,1,0],[-np.sin(a),0,np.cos(a)]]);P=V@R.T;Nr=fn@R.T
    c=(P.max(0)+P.min(0))/2;s=260/max(np.ptp(P[:,0]),np.ptp(P[:,1]))
    p2=np.c_[(P[:,0]-c[0])*s+150,(c[1]-P[:,1])*s+150];Z,I=raster(p2,P[:,2],F,300,300)
    L=np.array([-0.4,0.6,0.7]);L/=np.linalg.norm(L);sh=np.clip(0.3+0.7*(Nr@L),0.15,1)
    img=np.full((300,300),255.0);ys,xs=np.where(I>=0);img[ys,xs]=sh[I[ys,xs]]*230;outs.append(img)
Image.fromarray(np.concatenate(outs,1).astype(np.uint8)).save('gen/look.png')
