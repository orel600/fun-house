# מחקר "מודלים משלנו" (6.11.2026): קסדת קרניים מתמונה ב-TRELLIS, כדי להשוות ל-Blender מקוד.
# שימוש: python hat.py <שם> -> קורא in/<שם>.jpg, וכותב out/<שם>.glb ו-<שם>.mp4. אותם פרמטרים כמו בנשקים (weapons.py).
import os, sys, shutil
from gradio_client import Client, handle_file
name = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, 'out'); os.makedirs(out, exist_ok=True)
c = Client("trellis-community/TRELLIS", token=os.environ.get("HF_TOKEN") or None)
try: c.predict(api_name="/start_session")
except Exception as e: print('start_session:', e)
pre = c.predict(image=handle_file(os.path.join(here, 'in', name + '.jpg')), api_name="/preprocess_image")
r = None
for t in range(3):
    try:
        r = c.predict(image=handle_file(pre), multiimages=[], seed=1, ss_guidance_strength=7.5, ss_sampling_steps=12,
                      slat_guidance_strength=3.0, slat_sampling_steps=12, mesh_simplify=0.95, texture_size=1024,
                      multiimage_algo="stochastic", api_name="/generate_and_extract_glb"); break
    except Exception as e: print('try', t, e)
video, glb = r[0], r[-1]
shutil.copy(video['video'] if isinstance(video, dict) else video, os.path.join(out, name + '.mp4'))
shutil.copy(glb, os.path.join(out, name + '.glb'))
print('saved', name)
