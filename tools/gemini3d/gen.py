import sys,shutil,json
from gradio_client import Client,handle_file
space=sys.argv[1];mode=sys.argv[2]
c=Client(space,verbose=False,httpx_kwargs={'timeout':120})
kw=dict(caption=None,steps=int(__import__('os').environ.get('STEPS','30')),guidance_scale=5.0,seed=1234,octree_resolution=256,check_box_rembg=True,num_chunks=8000,randomize_seed=False)
if mode=='single': kw['image']=handle_file('front.png')
else: kw.update(mv_image_front=handle_file('front.png'),mv_image_back=handle_file('back.png'),mv_image_right=handle_file('right.png'))
api='/generation_all' if 'tex' in sys.argv else '/shape_generation'
r=c.predict(api_name=api,**kw)
print(r if not isinstance(r,(list,tuple)) else [x if not isinstance(x,str) or len(x)<300 else x[:100] for x in r])
for i,x in enumerate(r):
    if isinstance(x,str) and x.endswith(('.glb','.obj','.ply')): shutil.copy(x,f'out_{mode}_{i}'+x[x.rfind('.'):])
    if isinstance(x,dict) and 'value' in x and str(x['value']).endswith('.glb'): shutil.copy(x['value'],f'out_{mode}_{i}.glb')
