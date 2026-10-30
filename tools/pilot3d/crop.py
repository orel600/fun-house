# שלב 1: חותך את שלוש הזוויות מדף הדמות לריבועים לבנים של 768
import sys
from PIL import Image
import numpy as np
im=Image.open(sys.argv[1]).convert('RGB'); a=np.asarray(im).astype(int)
mask=(a.min(axis=2)<235)
mask[985:1000,:]=False  # ground line
cols=mask.any(axis=0)
# find column runs
runs=[];start=None
for x,v in enumerate(cols):
    if v and start is None:start=x
    if not v and start is not None:
        runs.append((start,x));start=None
if start is not None:runs.append((start,len(cols)))
runs=[r for r in runs if r[1]-r[0]>20]
print(runs)
# merge runs with gaps<40
m=[]
for r in runs:
    if m and r[0]-m[-1][1]<5:m[-1]=(m[-1][0],r[1])
    else:m.append(r)
print(m)
names=['front','side','back']
for n,(x0,x1) in zip(names,m):
    sub=mask[:,x0:x1];rows=np.where(sub.any(axis=1))[0];y0,y1=rows[0],rows[-1]+1
    w,h=x1-x0,y1-y0;s=max(w,h)+80
    c=Image.new('RGB',(s,s),(255,255,255));c.paste(im.crop((x0,y0,x1,y1)),((s-w)//2,(s-h)//2))
    c.resize((768,768),Image.LANCZOS).save(sys.argv[2]+'/'+n+'.png');print(n,x0,x1,y0,y1)
