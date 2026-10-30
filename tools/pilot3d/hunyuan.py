# שלב 2: שלוש הזוויות -> צורה (בלי צבע) מ-Hunyuan3D-2mv בחינם ב-Hugging Face. בלי חשבון, כ-10 שניות. יוצא gen/mv_white.glb
import shutil
from gradio_client import Client,handle_file
c=Client('tencent/Hunyuan3D-2mv')
r=c.predict(caption=None,image=None,mv_image_front=handle_file('crops/front.png'),mv_image_back=handle_file('crops/back.png'),mv_image_left=handle_file('crops/side.png'),mv_image_right=None,steps=30,guidance_scale=5.0,seed=1234,octree_resolution=380,check_box_rembg=True,num_chunks=8000,randomize_seed=False,api_name='/shape_generation')
shutil.copy(r[0]['value'],'gen/mv_white.glb');print('saved gen/mv_white.glb',r[2].get('number_of_faces'))
