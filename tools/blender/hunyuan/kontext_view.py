# פיילוט Hunyuan3D: הופך תמונת פריט (חזית שטוחה) לתמונה מזווית של כ-20 מעלות מלמעלה, דרך ה-Space החינמי של FLUX.1-Kontext.
# בלי זה Hunyuan בונה לוח שטוח. שימוש: python3 -I kontext_view.py <in.png> "<הנחיה>" <out.png>
import os,sys,shutil
from gradio_client import Client,handle_file
src,prompt,out=sys.argv[1:4]
c=Client('black-forest-labs/FLUX.1-Kontext-Dev',token=os.environ['HF'],verbose=False)
r=c.predict(handle_file(src),prompt,42,False,2.5,28,api_name='/infer')
p=r[0]['path'] if isinstance(r[0],dict) else r[0];shutil.copy(p,out);print('ok',out)
