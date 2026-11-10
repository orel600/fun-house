import importlib.util, pathlib
_spec=importlib.util.spec_from_file_location('compact_glb',pathlib.Path(__file__).with_name('compact-glb.py'));_mod=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(_mod);GLB=_mod.GLB
import numpy as np,json
from pathlib import Path
import argparse
ap=argparse.ArgumentParser();ap.add_argument('--input',default='/downloads');ap.add_argument('--output',default='art/compact');args=ap.parse_args();Path(args.output).mkdir(parents=True,exist_ok=True)
scales={'Tank':1.107/1.94,'Warrior':1.107/1.48,'Hunter':1.107/1.615,'Mage':1.107/1.84,'Assassin':1.107/1.207}
report=[]
for name,scale in scales.items():
 g=GLB(str(Path(args.input)/(name+'Hero-draft.glb')));a=g.j['meshes'][0]['primitives'][0]['attributes'];P=g.acc(a['POSITION']);P[:]*=scale;J=g.acc(a['JOINTS_0']);W=g.acc(a['WEIGHTS_0']);
 ib=g.acc(g.j['skins'][0]['inverseBindMatrices']).reshape(-1,4,4).transpose(0,2,1);bp=np.linalg.inv(ib)[:,:3,3];names=[g.j['nodes'][n]['name'] for n in g.j['skins'][0]['joints']]
 # Segments in bind space; no helper joints. Major anatomy groups prevent head/arm contamination.
 segs=[(1,2),(2,3),(3,14),(14,14),(4,5),(5,6),(6,7),(7,8),(9,10),(10,11),(11,12),(12,13),(15,16),(16,17),(17,18),(19,20),(20,21),(21,22)]
 D=[];kinds=[]
 for k,end in segs:
  v=bp[end]-bp[k];t=np.clip(((P-bp[k])*v).sum(1)/(v@v+1e-12),0,1);d=np.linalg.norm(P-bp[k]-t[:,None]*v,axis=1)
  D.append(d);kinds.append(k)
 D=np.array(D).T;K=np.array(kinds);x=np.abs(P[:,0]);y=P[:,1]
 # Head/hair above neckline excludes ALL arm joints. Shoulders remain outside center region.
 head=(y>1.24)&((x<.31)|(y>1.42))
 # The compact mage's hanging sleeves are a continuous arm accessory, not head geometry.
 arm=(x>.34)&(y>.62)&~head
 if name=='Mage':arm=(x>.33)&(y>.30)&(y<1.24)&~head
 for i,k in enumerate(K):
  armk=k in [4,5,6,7,9,10,11,12]
  if armk:D[head,i]=100;D[~arm,i]+=1.2
  elif k==14:D[~head,i]+=2;D[arm,i]=100
  elif k in [15,16,17,19,20,21]:D[y>.65,i]+=2;D[head|arm,i]=100
  else:D[head|arm,i]+=2
 # Pure rigid head preserves face/hair shape through attack, without freezing shoulders.
 inds=np.argsort(D,axis=1)[:,:4];tw=1/(np.take_along_axis(D,inds,axis=1)+.025)**4;tw/=tw.sum(1,keepdims=True)
 J[:]=K[inds];W[:]=tw;J[head]=14;W[head]=[1,0,0,0]
 # Geometry bounds updated, texture and topology unchanged.
 ac=g.j['accessors'][a['POSITION']];ac['min']=P.min(0).tolist();ac['max']=P.max(0).tolist();g.j['asset']['generator']='fun-house compact anatomy rebind v1, original texture/topology preserved'
 N=g.acc(a['NORMAL']);ln=np.linalg.norm(N,axis=1);bad=ln<1e-8;N[~bad]/=ln[~bad,None];N[bad]=[0,1,0];J[W==0]=0
 p=str(Path(args.output)/(name+'Hero.glb'));g.save(p)
 assert np.isfinite(W).all() and np.max(abs(W.sum(1)-1))<1e-5
 report.append({'hero':name,'rest_scale':scale,'vertices':len(P),'rigid_head_vertices':int(head.sum()),'arm_region_vertices':int(arm.sum()),'max_weight_sum_error':float(np.max(abs(W.sum(1)-1)))})
(Path(args.output)/'repair-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
