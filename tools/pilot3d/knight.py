# כלי עזר: האביר של KayKit, עם המשקלים של כל נקודה
import sys;sys.path.insert(0,__import__('os').path.dirname(__file__))
from gl import *
def knight_samples():
    g=pygltflib.GLTF2().load('C:/kk/adv/addons/kaykit_character_pack_adventures/Characters/gltf/Knight.glb')
    W,par=worlds(g);sk=g.skins[0];jn={ni:j for j,ni in enumerate(sk.joints)}
    out=[]
    for i,n in enumerate(g.nodes):
        if n.mesh is None or not n.name.startswith('Knight_'):continue
        for p in g.meshes[n.mesh].primitives:
            P=acc(g,p.attributes.POSITION);Fi=acc(g,p.indices).reshape(-1,3)
            if n.skin is not None:
                J=acc(g,p.attributes.JOINTS_0).astype(int);Wt=acc(g,p.attributes.WEIGHTS_0)
                # skinned: bind-space positions = mesh positions (node at origin)
            else:
                Mw=W[i];P=(Mw[:3,:3]@P.T).T+Mw[:3,3]
                pj=jn[par[i]] if par[i] in jn else 0
                J=np.zeros((len(P),4),int);J[:,0]=pj;Wt=np.zeros((len(P),4));Wt[:,0]=1
                print('rigid',n.name,'-> bone',g.nodes[sk.joints[pj]].name)
            out.append((n.name,P,Fi,J,Wt))
    return g,out
if __name__=='__main__':
    g,o=knight_samples()
    for name,P,Fi,J,Wt in o:print(name,len(P),np.round(P.min(0),3),np.round(P.max(0),3))
    allP=np.concatenate([x[1] for x in o if x[0] not in('Knight_Helmet',)])
    print('no helmet bounds',allP.min(0),allP.max(0))
