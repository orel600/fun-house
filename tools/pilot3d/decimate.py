# שלב 3: מנקה ומכווץ את הצורה ל-5,600 משולשים. יוצא gen/dec.ply
import trimesh,numpy as np,fast_simplification as fs
s=trimesh.load('gen/mv_white.glb',force='mesh',process=False);s.merge_vertices()
big=max(s.split(only_watertight=False),key=lambda p:len(p.faces))   # Hunyuan משאיר הרבה משולשים בודדים
v,f=fs.simplify(big.vertices.astype(np.float32),big.faces.astype(np.int32),target_count=5600)
trimesh.Trimesh(v,f,process=True).export('gen/dec.ply')
