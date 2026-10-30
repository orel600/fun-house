# כלי עזר: קריאת glb (נתונים ומיקומי צמתים)
# shared helpers: read glb skinned meshes with world-space bind data
import numpy as np, pygltflib, struct
def acc(g,i):
    a=g.accessors[i];bv=g.bufferViews[a.bufferView];blob=g.binary_blob()
    dt={5126:np.float32,5123:np.uint16,5121:np.uint8,5125:np.uint32,5122:np.int16,5120:np.int8}[a.componentType]
    n={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a.type]
    itemsize=np.dtype(dt).itemsize*n;stride=bv.byteStride or itemsize
    off=(bv.byteOffset or 0)+(a.byteOffset or 0)
    raw=np.frombuffer(blob,dtype=np.uint8,count=stride*(a.count-1)+itemsize,offset=off)
    out=np.lib.stride_tricks.as_strided(raw,shape=(a.count,itemsize),strides=(stride,1)).copy().view(dt).reshape(a.count,n)
    if a.normalized and dt!=np.float32: out=out.astype(np.float32)/np.iinfo(dt).max
    return out
def local(n):
    if n.matrix: return np.array(n.matrix).reshape(4,4).T
    t=np.array(n.translation or [0,0,0]);r=n.rotation or [0,0,0,1];s=np.array(n.scale or [1,1,1])
    x,y,z,w=r
    R=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
    M=np.eye(4);M[:3,:3]=R*s;M[:3,3]=t;return M
def worlds(g):
    par={c:i for i,n in enumerate(g.nodes) for c in (n.children or [])}
    W={}
    def w(i):
        if i in W:return W[i]
        M=local(g.nodes[i]);W[i]=(w(par[i])@M) if i in par else M;return W[i]
    for i in range(len(g.nodes)):w(i)
    return W,par
