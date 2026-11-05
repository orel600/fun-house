# מודלים לנשקים ולמגנים מתמונת מקור (משימה נ, 5.11.2026). רץ ב-GitHub (trellis.yml).
# שימוש: python weapons.py <id> -> מוריד את התמונה מהאתר, וכותב out/weapons/<id>.glb ו-<id>.mp4. אותם פרמטרים כמו בלהב הדרקון (#357).
import os, sys, shutil, urllib.request
from gradio_client import Client, handle_file
wid = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, 'out', 'weapons'); os.makedirs(out, exist_ok=True)
src = os.path.join(out, wid + '.png')
urllib.request.urlretrieve(f'https://fun-house-zeta.vercel.app/art/weapons/src/{wid}.png', src)
c = Client("trellis-community/TRELLIS", token=os.environ.get("HF_TOKEN") or None)
try: c.predict(api_name="/start_session")
except Exception as e: print('start_session:', e)
pre = c.predict(image=handle_file(src), api_name="/preprocess_image")
r = None
for t in range(3):
    try:
        r = c.predict(image=handle_file(pre), multiimages=[], seed=1, ss_guidance_strength=7.5, ss_sampling_steps=12,
                      slat_guidance_strength=3.0, slat_sampling_steps=12, mesh_simplify=0.95, texture_size=1024,
                      multiimage_algo="stochastic", api_name="/generate_and_extract_glb"); break
    except Exception as e: print('try', t, e)
print('result', r)
video, glb = r[0], r[-1]
v = video['video'] if isinstance(video, dict) else video
shutil.copy(v, os.path.join(out, wid + '.mp4'))
shutil.copy(glb, os.path.join(out, wid + '.glb'))
print('saved', wid)
