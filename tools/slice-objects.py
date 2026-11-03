# חותך דף אייקונים לפי צורות (לא לפי רשת קבועה): כל חלק שייך לתא שבו נמצא המרכז שלו, וכך פריט שגולש לתא השכן לא נחתך.
# שימוש: [SIZE=128] python3 tools/slice-objects.py <דף.png> <עמודות> <שורות> <תיקיית-יעד> שם1 שם2:holes ...  (דורש numpy ו-scipy)
import sys, os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
from scipy import ndimage
src, cols, rows, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
names = sys.argv[5:]; SIZE=int(os.environ.get('SIZE',128)); TOL=40
im = Image.open(src).convert('RGBA'); W,H = im.size
a = np.array(im).astype(int)
white = (a[:,:,:3].min(axis=2) > 255-TOL)
# background = white connected to border
lab, n = ndimage.label(white)
border = set(np.unique(np.concatenate([lab[0,:],lab[-1,:],lab[:,0],lab[:,-1]]))) - {0}
bg = np.isin(lab, list(border))
fg = ~bg
# group: dilate so sparkles join their item
grp = fg
glab, gn = ndimage.label(grp)
cw, ch = W/cols, H/rows
cells = {}
for g in range(1, gn+1):
    ys, xs = np.where((glab==g) & fg)
    if len(xs) < 50: continue
    cx, cy = xs.mean(), ys.mean()
    c, r = int(cx//cw), int(cy//ch)
    cells.setdefault(r*cols+c, []).append(g)
for i, nm in enumerate(names):
    nm, holes = nm.split(':')[0], nm.endswith(':holes')
    gs = cells.get(i)
    if not gs: print('EMPTY', nm); continue
    mask = np.isin(glab, gs) & fg
    if holes: mask &= ~white
    ys, xs = np.where(mask)
    x0,x1,y0,y1 = xs.min(), xs.max()+1, ys.min(), ys.max()+1
    rgba = a.copy(); rgba[:,:,3] = np.where(mask, rgba[:,:,3], 0)
    crop = Image.fromarray(rgba[y0:y1, x0:x1].astype('uint8'), 'RGBA')
    crop.thumbnail((SIZE,SIZE), Image.LANCZOS)
    crop.save(os.path.join(out, nm+'.png'))
    print(nm, crop.size, 'groups', len(gs))
