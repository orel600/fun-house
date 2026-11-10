# פיילוט Hunyuan3D (10.11.2026): תמונה -> מודל תלת-ממד גולמי דרך ה-Space החינמי ב-Hugging Face (ZeroGPU, מכסה יומית).
# שימוש: HF=<טוקן בסביבה> python3 -I hy_shape.py tencent/Hunyuan3D-2 shape_generation <out.glb> <תמונה.png>
# 2.1 שבור (מחזיר קופסה), טקסטורה (generation_all) נכשלת ב-NameError, ו-text-to-3D כבוי. ראה docs/concept/hunyuan-pilot.md
import os,sys,json,shutil,time
from gradio_client import Client,handle_file
space,mode,out=sys.argv[1:4];img=sys.argv[4] if len(sys.argv)>4 else None
c=Client(space,token=os.environ['HF'],verbose=False);t=time.time()
if space.endswith('2.1'):
    r=c.predict(handle_file(img),None,None,None,None,30,5.0,1234,256,True,8000,False,api_name='/'+mode)
else:
    cap=None if img else 'a royal crown, a closed ring band with five tall spikes, each topped with a flame, gems on the band'
    r=c.predict(cap,handle_file(img) if img else None,None,None,None,None,30,5.0,1234,256,True,8000,False,api_name='/'+mode)
p=r[0]['value'] if isinstance(r[0],dict) else r[0];shutil.copy(p,out)
st=[x for x in r if isinstance(x,dict) and 'number_of_faces' in x]
print(out,'wall',round(time.time()-t,1),json.dumps(st[0] if st else '')[:300])
