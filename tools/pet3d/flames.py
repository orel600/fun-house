# שלב 0 לשלב 3 של החיה: מוחק מהדף את הלהבות שלא שייכות לגוף (קצה הזנב, הלהבות ליד הכפות). המשחק מצייר אותן חיות
# python flames.py <דף.jpg> <יוצא.png> x0,y0,x1,y1 [...]: בתוך כל מלבן, פיקסל כתום (לא זהב, לא חום) והילה סביבו מקבלים את צבע השכן הקרוב
#   מלבן שמתחיל ב-! מלבין כל פיקסל חם בתוכו, גם צהוב ובהיר (להבה שיושבת על הגוף, כמו הזנב מאחור)
import sys,numpy as np
from PIL import Image
from scipy import ndimage
a=np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(float);r,g,b=a[...,0],a[...,1],a[...,2]
fire=(r>200)&(g<0.78*r)&(b<0.62*r)   # כתום. זהב צהוב יותר (g/r גבוה), וחום כהה יותר
box=np.zeros(fire.shape,bool);hard=box.copy()
for s in sys.argv[3:]:
    x0,y0,x1,y1=map(int,s.lstrip('!').split(','));box[y0:y1,x0:x1]=True
    if s[0]=='!':hard[y0:y1,x0:x1]=True
# כל כתם חם (כתום, צהוב או הלב הלבן-צהוב של הלהבה) שיש בו כתום ושלם בתוך המלבן
warm=(r>190)&(r-b>25);lab,_=ndimage.label(warm);hit=np.unique(lab[fire&box]);hit=hit[hit>0]
out=np.unique(lab[warm&~box]);m=np.isin(lab,np.setdiff1d(hit,out))|(fire&box)|(hard&(r>200)&(r-b>25));halo=ndimage.binary_dilation(m,iterations=6)&box&(a.min(2)>150)&(r-b>12)
M=m|halo;_,(iy,ix)=ndimage.distance_transform_edt(M,return_indices=True);a=a[iy,ix]   # כל פיקסל מוחק מקבל את הצבע של השכן הקרוב שנשאר: רקע לבן בחוץ, פרווה על הגוף
Image.fromarray(a.astype(np.uint8)).save(sys.argv[2]);print('cleaned',int(M.sum()))
