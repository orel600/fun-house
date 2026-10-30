# כלי עזר: מוצא בדף הדמות את שלוש הזוויות (עמודות) ואת הגובה, בלי מספרים קבועים. קו קרקע (שורה שמכסה כמעט את כל הרוחב) נמחק
import numpy as np
from PIL import Image
def layout(path):
    im=Image.open(path).convert('RGB');a=np.asarray(im).astype(float)
    fg=a.min(axis=2)<235
    fg[fg.sum(1)>fg.shape[1]*0.8]=False
    cols=fg.any(axis=0);runs=[];s=None
    for x,v in enumerate(list(cols)+[False]):
        if v and s is None:s=x
        if not v and s is not None:
            if x-s>20:runs.append((s,x))
            s=None
    rows=np.where(fg.any(axis=1))[0]
    return im,a,fg,runs[:3],int(rows[0]),int(rows[-1])+1
