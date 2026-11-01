# שולח ציורים ל-TRELLIS ב-Hugging Face ושומר מודל תלת-ממד צבוע + סרטון סיבוב.
# רץ ב-GitHub (.github/workflows/trellis.yml), כי לסשנים של Claude אין גישה ל-huggingface.co.
# שימוש: python run.py <שם> [multi]   -> קורא in/<שם>-front.png (ועם multi גם side/back), כותב out/<שם>.glb ו-out/<שם>.mp4
import os, sys, shutil
from gradio_client import Client, handle_file
name = sys.argv[1]; multi = len(sys.argv) > 2
here = os.path.dirname(os.path.abspath(__file__))
inp = lambda v: os.path.join(here, 'in', f'{name}-{v}.png')
out = os.path.join(here, 'out'); os.makedirs(out, exist_ok=True)
tag = name + ('-multi' if multi else '')
c = Client("trellis-community/TRELLIS")
try: c.view_api()
except Exception as e: print('view_api:', e)
try: c.predict(api_name="/start_session")
except Exception as e: print('start_session:', e)
if multi:
    pre = c.predict(images=[handle_file(inp(v)) for v in ('front', 'side', 'back')], api_name="/preprocess_images")
    print('pre', pre)
    imgs = [{"image": handle_file(x['image'] if isinstance(x, dict) else x[0] if isinstance(x, (list, tuple)) else x), "caption": None} for x in pre]
    r = c.predict(image=handle_file(inp('front')), multiimages=imgs, seed=1, mesh_simplify=0.95, texture_size=1024, multiimage_algo="stochastic", api_name="/generate_and_extract_glb")
else:
    pre = c.predict(image=handle_file(inp('front')), api_name="/preprocess_image")
    r = c.predict(image=handle_file(pre), multiimages=[], seed=1, mesh_simplify=0.95, texture_size=1024, multiimage_algo="stochastic", api_name="/generate_and_extract_glb")
print('result', r)
info, video, glb, glb2 = r
v = video['video'] if isinstance(video, dict) else video
shutil.copy(v, os.path.join(out, tag + '.mp4'))
shutil.copy(glb if isinstance(glb, str) else glb2, os.path.join(out, tag + '.glb'))
print('saved', tag)
