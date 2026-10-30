# שלב 0 (רק אם צריך): מוחק מהדף דברים שלא שייכים לגוף, כמו ניצוץ שמרחף ליד הדמות. כל פיקסל בהיר בתוך המלבנים נהיה לבן
# python clean.py <דף.jpg> <יוצא.png> x0,y0,x1,y1 [x0,y0,x1,y1 ...]
import sys,numpy as np
from PIL import Image
a=np.asarray(Image.open(sys.argv[1]).convert('RGB')).copy()
for box in sys.argv[3:]:
    x0,y0,x1,y1=map(int,box.split(','));sub=a[y0:y1,x0:x1];sub[sub[...,0]>190]=255
Image.fromarray(a).save(sys.argv[2])
