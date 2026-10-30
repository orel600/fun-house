# כלי עזר: ציור משולשים למסך (עומק), בשביל הצבע והתמונות
import numpy as np
def raster(P2,depth,F,W,H,vals=None):
    """P2: (n,2) pixel coords, depth (n,) bigger=closer. returns zbuf (H,W), and face id buf"""
    Z=np.full((H,W),-1e9);I=np.full((H,W),-1,int)
    for fi,(a,b,c) in enumerate(F):
        p=P2[[a,b,c]];x0=max(int(np.floor(p[:,0].min())),0);x1=min(int(np.ceil(p[:,0].max())),W-1)
        y0=max(int(np.floor(p[:,1].min())),0);y1=min(int(np.ceil(p[:,1].max())),H-1)
        if x1<x0 or y1<y0:continue
        xs,ys=np.meshgrid(np.arange(x0,x1+1)+0.5,np.arange(y0,y1+1)+0.5)
        v0=p[1]-p[0];v1=p[2]-p[0];d=v0[0]*v1[1]-v1[0]*v0[1]
        if abs(d)<1e-12:continue
        wx=xs-p[0,0];wy=ys-p[0,1]
        l1=(wx*v1[1]-v1[0]*wy)/d;l2=(v0[0]*wy-wx*v0[1])/d;l0=1-l1-l2
        ins=(l0>=-1e-3)&(l1>=-1e-3)&(l2>=-1e-3)
        if not ins.any():continue
        z=l0*depth[a]+l1*depth[b]+l2*depth[c]
        sub=Z[y0:y1+1,x0:x1+1];si=I[y0:y1+1,x0:x1+1]
        upd=ins&(z>sub);sub[upd]=z[upd];si[upd]=fi
    return Z,I
