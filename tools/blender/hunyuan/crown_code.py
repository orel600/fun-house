# כתר מקוד (להשוואה בפיילוט Hunyuan3D). שימוש: blender -b --python crown_code.py -- tools/blender <תיקיית יציאה>
# Blender-from-code crown, using the helpers in tools/blender/build_weapons.py (exec'd up to the first item)
import sys,math
import os;src=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','build_weapons.py')).read();exec(src[:src.index('def sky_bow')])
from mathutils import Vector,Matrix
def crown(part):
    N=8;R=0.5
    ring=[Vector((R*math.cos(2*math.pi*k/24),R*math.sin(2*math.pi*k/24),0.1)) for k in range(24)]
    part(tube(ring,[(0.05,0.11)]*24,sides=4,closed=True,ref=Vector((0,0,1))),'band','purple')
    for k in range(N):
        a=2*math.pi*k/N;d=Vector((math.cos(a),math.sin(a),0));p=d*R;front=k==N//4*3
        h=0.26 if front else 0.18
        part(gem(p+Vector((0,0,0.2)),d,0.06,0.13 if front else 0.09,sides=4,mid=0.5),f'plate{k}','pink')   # diamond plate on the band
        part(cyl(0.05,h,p+Vector((0,0,0.2+h/2)),sides=5,r2=0.04),f'spike{k}','violet')
        part(cyl(0.05,0.08,p+Vector((0,0,0.2+h+0.04)),sides=6,r2=0.09),f'cup{k}','gold')
        part(gem(p+Vector((0,0,0.2+h+0.17)),Vector((0,0,1)),0.26,0.085,sides=5,mid=0.35),f'flame{k}','pink')
        part(gem(p*1.12+Vector((0,0,0.2)),d,0.05,0.07 if front else 0.045,sides=4),f'gem{k}','violet')
build('crown',crown)
