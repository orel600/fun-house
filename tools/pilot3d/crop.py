# שלב 1: חותך את שלוש הזוויות מדף הדמות לריבועים לבנים של 768
import sys;sys.path.insert(0,__import__('os').path.dirname(__file__))
from PIL import Image
import numpy as np
from sheet import layout
im,a,mask,m,_,_=layout(sys.argv[1]);print(m)
names=['front','side','back']
for n,(x0,x1) in zip(names,m):
    sub=mask[:,x0:x1];rows=np.where(sub.any(axis=1))[0];y0,y1=rows[0],rows[-1]+1
    w,h=x1-x0,y1-y0;s=max(w,h)+80
    c=Image.new('RGB',(s,s),(255,255,255));c.paste(im.crop((x0,y0,x1,y1)),((s-w)//2,(s-h)//2))
    c.resize((768,768),Image.LANCZOS).save(sys.argv[2]+'/'+n+'.png');print(n,x0,x1,y0,y1)
