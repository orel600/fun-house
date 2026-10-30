# שלב 3: מנקה ומכווץ את הצורה. יוצא gen/dec.ply. python decimate.py [משולשים, ברירת מחדל 4000]
import sys,trimesh,numpy as np,fast_simplification as fs
s=trimesh.load('gen/mv_white.glb',force='mesh',process=False);s.merge_vertices()
big=max(s.split(only_watertight=False),key=lambda p:len(p.faces))   # Hunyuan משאיר הרבה חלקים קטנים צפים
v,f=fs.simplify(big.vertices.astype(np.float32),big.faces.astype(np.int32),target_count=int(sys.argv[1]) if len(sys.argv)>1 else 4000)
m=trimesh.Trimesh(v,f,process=True);m.export('gen/dec.ply');print('tris',len(m.faces),'bounds',m.bounds.round(3).tolist())
