# Look v2, phase 4 (Nir approved the "toy" style and asked to keep going, 11.11.2026): the rest of the village's buildings, every level,
# and the open world's trees and rocks. Same language as stage 2 (build_village.py): rounder blocks, broad flat colour blocks, matte, few big shapes.
# Usage (from the repo root): blender -b --python tools/blender/build_village4.py -- tools/blender art/village-v2/raw [only these names]
#   then: node tools/blender/village_v2.js pack
# Levels must read apart at the phone camera (docs/concept-village-growth-2.md §2): L3 plain wood + green roof, L4 stone base + blue roof + lit windows
#   + a chimney or tower, L5 bigger + red (center: gold) roof + gold trim + a banner. L1/L2 stay a camp and a timber frame.
# Every piece keeps the footprint ratio (x:z) of the KayKit model it replaces, so vPut's width keeps it on its plot (collision is not the model).
import sys,os,math,random
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import build_village as bv
from build_village import Vector,Matrix,bmesh,rbox,ball,cyl,tri_prism,fresh
ONLY=set((sys.argv[sys.argv.index('--')+3:]) if '--' in sys.argv else [])
# new palette columns (appended: stage 2's columns keep their place, so its pieces are unchanged)
bv.COLS+=[('roofG',(140,206,112),(92,166,84),(56,116,60),0),('roofB',(128,180,246),(74,128,214),(44,82,160),0),
  ('win',(255,244,190),(255,216,120),(240,170,70),1),('winD',(96,116,146),(62,78,108),(40,50,74),0),
  ('leaf',(156,218,104),(104,180,72),(62,128,50),0),('leafD',(112,184,84),(72,142,62),(44,98,44),0),
  ('rock',(206,208,214),(162,166,176),(112,116,130),0),('moss',(168,206,104),(126,172,80),(86,124,60),0)]
bv.COL.update({c[0]:i for i,c in enumerate(bv.COLS)})
assert len(bv.COLS)<=bv.NC

V=Vector
def rot(bm,axis,ang,piv=V((0,0,0))):
    bmesh.ops.rotate(bm,verts=bm.verts,cent=piv,matrix=Matrix.Rotation(ang,3,axis));return bm
def blob(c,r,sc=(1,1,1),seed=0,j=0.12,seg=10,ring=7):
    # a lumpy round shape (rock, leaf ball): a ball with soft random bumps, smooth shaded
    rnd=random.Random(seed);bm=ball(c,r,sc,seg=seg,ring=ring)
    for v in bm.verts:
        d=v.co-c;v.co=c+d*(1+rnd.uniform(-j,j))
    return bm
# ---------- building kit ----------
def gable(m,cx,cy,w,d,z,h,col,o=0.09,ridge=None,end=None):
    # a gable roof, ridge along x: two thick rounded slabs and a round ridge. end: colour of the triangle under it (the wall)
    a=math.atan2(h,d/2);L=math.hypot(d/2,h)+o;t=0.08
    for s in (-1,1):
        bm=rbox(V((0,0,0)),(w+2*o,L,t),r=0.6,seg=2);rot(bm,'X',s*a)
        bmesh.ops.translate(bm,vec=V((cx,cy+s*(d/4+o*0.3),z+h/2+0.02)),verts=bm.verts);m.part(bm,col,'roof')
    m.part(cyl(V((cx-w/2-o,cy,z+h+0.03)),V((cx+w/2+o,cy,z+h+0.03)),0.06,sides=8,bev=0.3),ridge or col,'ridge')
    if end:
        for x in (cx-w/2+0.02,cx+w/2-0.02):m.part(tri_prism([V((x,cy-d/2,z)),V((x,cy+d/2,z)),V((x,cy,z+h))],V((1,0,0)),0.04),end,'gableEnd',smooth=False)
def cone(m,c,r,h,col,sides=12):m.part(cyl(c,c+V((0,0,h)),r,0.03,sides=sides,bev=0.2),col,'cone')
def door(m,x,y,w,h,col='woodD',arch=True,z=0):
    m.part(rbox(V((x,y-0.02,z+h/2)),(w,0.06,h),r=0.4,seg=2),col,'door')
    if arch:m.part(cyl(V((x,y-0.03,z+h-0.01)),V((x,y+0.02,z+h-0.01)),w/2,sides=10),col,'arch')
    m.part(ball(V((x+w*0.28,y-0.06,z+h*0.5)),0.025,seg=6,ring=4),'gold','knob')
def window(m,x,y,z,s,lit,frame='woodD',side=False):
    # a square window with a frame. side: on a wall facing +-x (y is the wall's x then)
    if side:
        m.part(rbox(V((y,x,z)),(0.05,s+0.06,s+0.06),r=0.5,seg=1),frame,'wframe');m.part(rbox(V((y-0.02*(1 if y<0 else -1),x,z)),(0.04,s,s),r=0.4,seg=1),'win' if lit else 'winD','pane')
    else:
        m.part(rbox(V((x,y,z)),(s+0.06,0.05,s+0.06),r=0.5,seg=1),frame,'wframe');m.part(rbox(V((x,y-0.02,z)),(s,0.04,s),r=0.4,seg=1),'win' if lit else 'winD','pane')
def walls(m,cx,cy,w,d,h,col,z=0,posts=None):
    m.part(rbox(V((cx,cy,z+h/2)),(w,d,h),r=0.18,seg=2),col,'wall')
    if posts:
        for x in (cx-w/2,cx+w/2):
            for y in (cy-d/2,cy+d/2):m.part(cyl(V((x,y,z)),V((x,y,z+h)),0.045,sides=6,bev=0.3),posts,'post')
def plinth(m,cx,cy,w,d,h,col='stone'):m.part(rbox(V((cx,cy,h/2)),(w,d,h),r=0.4,seg=2),col,'plinth')
def chimney(m,x,y,z,h,col='stone'):
    m.part(rbox(V((x,y,z+h/2)),(0.16,0.16,h),r=0.4,seg=2),col,'chimney');m.part(rbox(V((x,y,z+h)),(0.2,0.2,0.05),r=0.5,seg=1),'soot','cap')
def flag(m,x,y,z,col,h=0.45):
    m.part(cyl(V((x,y,z)),V((x,y,z+h)),0.018,sides=6),'woodD','pole');m.part(ball(V((x,y,z+h+0.02)),0.03,seg=6,ring=4),'gold','knob')
    m.part(tri_prism([V((x,y,z+h-0.02)),V((x,y,z+h-0.2)),V((x+0.24,y,z+h-0.11))],V((0,1,0)),0.02),col,'flag',smooth=False)
def crenel(m,cx,cy,r,z,n,col='stone',s=0.11):
    for i in range(n):a=2*math.pi*i/n;m.part(rbox(V((cx+math.cos(a)*r,cy+math.sin(a)*r,z+s/2)),(s,s,s),r=0.5,seg=1),col,'cren')
def barrel(m,x,y,s=0.14):
    m.part(cyl(V((x,y,0)),V((x,y,s*2)),s,sides=10,bev=0.3),'wood','barrel')
    for z in (s*0.4,s*1.6):m.part(cyl(V((x,y,z-0.012)),V((x,y,z+0.012)),s*1.03,sides=10),'iron','band')
def logs(m,x,y,n=3,L=0.5,r=0.06):
    for i in range(n):m.part(cyl(V((x-L/2,y+(i-(n-1)/2)*r*2.05,r)),V((x+L/2,y+(i-(n-1)/2)*r*2.05,r)),r,sides=8,bev=0.25),'wood' if i%2 else 'woodD','log')
TIER={3:dict(roof='roofG',lit=False),4:dict(roof='roofB',lit=True),5:dict(roof='roofR',lit=True)}

# ---------- L1 / L2: the camp and the timber frame (shared by every building) ----------
def p_ruin():
    # center L1: what is left of the old hall. Low broken stone walls, fallen blocks, a burnt beam
    m=fresh('ruin');rnd=random.Random(3)
    m.part(rbox(V((0,0,0.03)),(1.45,1.2,0.06),r=0.5,seg=1),'stone','floor')
    for x,h in ((-0.55,0.75),(-0.2,0.95),(0.15,0.55),(0.5,0.35)):m.part(rbox(V((x,0.5,h/2)),(0.36,0.2,h),r=0.35),'stone','wall')
    for y,h in ((0.15,0.6),(-0.25,0.35)):m.part(rbox(V((-0.66,y,h/2)),(0.2,0.38,h),r=0.35),'stone','wall')
    m.part(rbox(V((0.66,0.2,0.12)),(0.2,0.4,0.24),r=0.4),'stone','wall')
    for i,(x,y) in enumerate(((0.3,-0.3),(0.05,-0.45),(0.45,0.0),(-0.3,-0.4))):
        bm=rbox(V((x,y,0.08)),(0.2,0.16,0.14),r=0.5);rot(bm,'Z',rnd.uniform(0,1),V((x,y,0)));m.part(bm,'stone','block')
    bm=cyl(V((-0.3,0.1,0.08)),V((0.35,0.3,0.32)),0.06,sides=8,bev=0.3);m.part(bm,'coal','beam')
    m.part(blob(V((-0.1,0.05,0.04)),0.16,(1.4,1,0.35),seed=2),'moss','moss')
    return m
def p_stageA():
    # a low wooden floor with stubs of posts and stacked planks: "something is being built here"
    m=fresh('stageA')
    m.part(rbox(V((0,0,0.06)),(1.0,0.84,0.12),r=0.35),'wood','floor')
    for x in (-0.45,0.45):
        for y in (-0.37,0.37):m.part(cyl(V((x,y,0.1)),V((x,y,0.28)),0.045,sides=8,bev=0.3),'woodD','stub')
    for i in range(3):m.part(rbox(V((0.1,0.05,0.15+i*0.045)),(0.6-i*0.05,0.16,0.04),r=0.5,seg=1),'woodD' if i%2 else 'wood','plank')
    m.part(rbox(V((-0.25,-0.2,0.16)),(0.16,0.16,0.08),r=0.6),'stone','block')
    return m
def p_stageB():
    # a timber frame: floor, posts, beams on top, one wall of planks at the back, a ladder
    m=fresh('stageB');w,d,h=0.96,1.06,0.6
    m.part(rbox(V((0,0,0.05)),(w,d,0.1),r=0.35),'wood','floor')
    for x in (-w/2+0.05,w/2-0.05):
        for y in (-d/2+0.05,d/2-0.05):m.part(cyl(V((x,y,0.1)),V((x,y,h)),0.045,sides=8,bev=0.3),'woodD','post')
        m.part(cyl(V((x,-d/2+0.05,h)),V((x,d/2-0.05,h)),0.04,sides=8,bev=0.3),'woodD','beam')
    for y in (-d/2+0.05,d/2-0.05):m.part(cyl(V((-w/2+0.05,y,h)),V((w/2-0.05,y,h)),0.04,sides=8,bev=0.3),'woodD','beam')
    for i in range(4):m.part(rbox(V((0,d/2-0.05,0.17+i*0.1)),(w-0.1,0.04,0.08),r=0.5,seg=1),'wood','plank')
    m.part(cyl(V((-w/2+0.05,-d/2+0.05,0.12)),V((w/2-0.05,-d/2+0.05,h-0.04)),0.03,sides=6),'wood','brace')
    for s in (-1,1):m.part(cyl(V((w/2+0.08,-0.2+s*0.08,0)),V((w/2-0.02,-0.2+s*0.08,h+0.05)),0.02,sides=6),'wood','rail')
    for i in range(4):z=0.12+i*0.14;m.part(cyl(V((w/2+0.08-0.1*z/h,-0.28,z)),V((w/2+0.08-0.1*z/h,-0.12,z)),0.015,sides=5),'wood','rung')
    return m
def p_tent():
    # a toy tent: a round canvas cone with a red top and a dark door flap
    m=fresh('tent')
    m.part(cyl(V((0,0,0)),V((0,0,0.12)),0.5,0.47,sides=14,bev=0.2),'cream','skirt')
    m.part(cyl(V((0,0,0.12)),V((0,0,0.62)),0.47,0.12,sides=14,bev=0.15),'cream','canvas')
    m.part(cyl(V((0,0,0.58)),V((0,0,0.8)),0.16,0.03,sides=14,bev=0.2),'roofR','top')
    m.part(cyl(V((0,0,0.8)),V((0,0,0.95)),0.02,sides=6),'woodD','pole');m.part(ball(V((0,0,0.96)),0.04,seg=6,ring=4),'gold','knob')
    m.part(tri_prism([V((-0.17,-0.44,0.0)),V((0.17,-0.44,0.0)),V((0,-0.3,0.42))],V((0,1,0.3)),0.05),'leather','flap',smooth=False)
    return m

# ---------- the village center ----------
def p_hall():
    # L3: a wooden hall on a stone base, green roof, a bell turret
    m=fresh('hallG');w,d=1.3,1.4
    plinth(m,0,0,w+0.1,d+0.1,0.14);walls(m,0,0,w,d,0.62,'wood',z=0.14,posts='woodD')
    gable(m,0,0,w,d,0.76,0.56,'roofG',end='wood')
    door(m,0,-d/2,0.3,0.4,z=0.14)
    for x in (-0.42,0.42):window(m,x,-d/2-0.01,0.5,0.16,False)
    m.part(rbox(V((0,0,1.36)),(0.22,0.22,0.2),r=0.4),'wood','turret');cone(m,V((0,0,1.45)),0.2,0.22,'roofG')
    m.part(ball(V((0,0,1.68)),0.04,seg=6,ring=4),'gold','knob')
    return m
def p_keep():
    # L4: a round stone keep, blue cone roof, lit windows, a blue banner
    m=fresh('keepB')
    m.part(cyl(V((0,0,0)),V((0,0,0.22)),0.52,0.5,sides=16,bev=0.3),'stone','base')
    m.part(cyl(V((0,0,0.2)),V((0,0,1.35)),0.45,sides=16,bev=0.2),'stone','tower')
    m.part(cyl(V((0,0,1.32)),V((0,0,1.42)),0.5,sides=16,bev=0.3),'stone','ledge');crenel(m,0,0,0.44,1.42,10)
    cone(m,V((0,0,1.5)),0.5,0.62,'roofB',sides=16);m.part(ball(V((0,0,2.13)),0.05,seg=6,ring=4),'gold','knob')
    door(m,0,-0.45,0.26,0.4,z=0.2)
    for z,x in ((0.85,-0.17),(0.85,0.17),(1.15,0)):
        a=math.asin(x/0.45);y=-math.cos(a)*0.45
        window(m,x,y-0.005,z,0.12,True)
    m.part(rbox(V((0.25,-0.38,0.78)),(0.18,0.03,0.4),r=0.5,seg=1),'blue','banner');m.part(ball(V((0.25,-0.4,0.78)),0.05,(1,0.3,1)),'gold','badge')
    return m
def p_castle():
    # L5: a golden castle. A keep with a gold roof between two round towers with gold cones, a gate, crenellations and flags
    m=fresh('castleY');W=1.9
    m.part(rbox(V((0,0.1,0.55)),(1.2,0.9,1.1),r=0.2),'stone','keep')
    gable(m,0,0.1,1.2,0.9,1.1,0.55,'yellow',ridge='gold',end='stone')
    m.part(rbox(V((0,-0.48,0.3)),(1.3,0.24,0.6),r=0.3),'stone','frontwall')
    for i in range(7):m.part(rbox(V((-0.6+i*0.2,-0.48,0.66)),(0.11,0.24,0.12),r=0.5,seg=1),'stone','cren')
    door(m,0,-0.6,0.34,0.42,col='woodD')
    for x in (-0.38,0.38):window(m,x,-0.36,0.85,0.12,True)
    window(m,0,-0.36,1.15,0.14,True)
    for sx in (-1,1):
        x=sx*(W/2-0.3);y=-0.35
        m.part(cyl(V((x,y,0)),V((x,y,1.85)),0.3,sides=14,bev=0.2),'stone','tower')
        m.part(cyl(V((x,y,1.8)),V((x,y,1.9)),0.34,sides=14,bev=0.3),'stone','ledge')
        cone(m,V((x,y,1.9)),0.36,0.8,'yellow',sides=14);m.part(ball(V((x,y,2.72)),0.05,seg=6,ring=4),'gold','knob')
        for z in (0.9,1.4):window(m,x,y-0.3,z,0.1,True)
        flag(m,x,y,2.75,'roofR',h=0.42)
    m.part(cyl(V((0,0.1,1.66)),V((0,0.1,1.75)),0.06,sides=8),'gold','spire');flag(m,0,0.1,1.7,'yellow',h=0.5)
    return m

# ---------- sawmill, mine, inn, storehouse, forge, market: L3 / L4 / L5 ----------
def saw(m,x,y,r,z):
    m.part(cyl(V((x,y-0.012,z)),V((x,y+0.012,z)),r,sides=16),'iron','blade');m.part(cyl(V((x,y-0.03,z)),V((x,y+0.03,z)),r*0.22,sides=8),'woodD','hub')
def wheel(m,x,y,z,r):
    # a water wheel on the side of the mill (turned to face x)
    for dx in (-0.06,0.06):m.part(cyl(V((x+dx-0.015,y,z)),V((x+dx+0.015,y,z)),r,sides=16),'woodD','rim')
    for i in range(8):m.part(_paddle(x,y,z,r,i*math.pi/4),'wood','paddle')
    m.part(cyl(V((x-0.1,y,z)),V((x+0.1,y,z)),0.06,sides=8),'iron','axle')
def _paddle(x,y,z,r,a):
    bm=rbox(V((0,0,r*0.55)),(0.15,0.035,r*0.9),r=0.4,seg=1);rot(bm,'X',a);bmesh.ops.translate(bm,vec=V((x,y,z)),verts=bm.verts);return bm
def p_mill(t):
    # the sawmill: a house, a saw bench with a log and a round blade, logs. L4 + chimney and a water wheel, L5 two floors and a big wheel
    T=TIER[t];m=fresh('mill'+'GBR'[t-3]);w,d=0.82,0.82;hx=-0.18;wh=0.5 if t<5 else 0.8
    if t>=4:plinth(m,hx,0.1,w+0.08,d+0.08,0.12)
    z0=0.12 if t>=4 else 0
    walls(m,hx,0.1,w,d,wh,'wood',z=z0,posts='woodD')
    gable(m,hx,0.1,w,d,z0+wh,0.42 if t<5 else 0.5,T['roof'],ridge='gold' if t==5 else None,end='wood')
    door(m,hx,0.1-d/2,0.24,0.34,z=z0)
    window(m,hx+0.25,0.1-d/2-0.01,z0+0.3,0.13,T['lit']);window(m,hx-0.25,0.1-d/2-0.01,z0+0.3,0.13,T['lit'])
    if t==5:
        for x in (hx-0.22,hx+0.22):window(m,x,0.1-d/2-0.01,z0+0.62,0.13,True)
    # the saw bench in front of the right side
    bx=0.42;m.part(rbox(V((bx,-0.25,0.18)),(0.22,0.6,0.08),r=0.4),'woodD','bench')
    for y in (-0.5,0.0):
        for x in (bx-0.08,bx+0.08):m.part(cyl(V((x,y,0)),V((x,y,0.16)),0.025,sides=6),'woodD','leg')
    m.part(cyl(V((bx,-0.5,0.27)),V((bx,0.05,0.27)),0.07,sides=10,bev=0.3),'wood','log')
    saw(m,bx,-0.2,0.15+0.03*(t-3),0.28)
    logs(m,0.45,0.35,n=3 if t<5 else 4,L=0.4)
    if t>=4:
        chimney(m,hx+0.2,0.25,z0+wh+0.1,0.45 if t==4 else 0.6)
        wheel(m,hx-w/2-0.1,0.1,0.32 if t==4 else 0.45,0.28 if t==4 else 0.4)
    if t==5:flag(m,hx+w/2,0.1-d/2,z0+wh+0.45,'roofR')
    return m
def p_mine(t):
    # the mine: a rocky mound with a timber tunnel mouth under a small roof, rails and an ore cart in front.
    # L4: a stone arch and a lantern. L5: a winch over it, gold ore, a red banner
    T=TIER[t];m=fresh('mine'+'GBR'[t-3])
    m.part(blob(V((0,0.35,0.0)),0.75,(1.05,0.75,0.95),seed=1,j=0.1,seg=14,ring=9),'rock','mound')
    m.part(blob(V((-0.52,0.0,0.0)),0.38,(1,1,0.9),seed=2,j=0.12),'rock','rock')
    m.part(blob(V((0.55,0.1,0.0)),0.34,(1,1,0.95),seed=3,j=0.12),'rock','rock')
    m.part(blob(V((0.0,0.4,0.62)),0.4,(1.3,0.8,0.3),seed=4,j=0.08),'moss','moss')
    y0=-0.22;m.part(rbox(V((0,y0+0.02,0.22)),(0.34,0.06,0.4),r=0.4),'coal','mouth')
    fr='stone' if t>=4 else 'woodD'
    for x in (-0.22,0.22):m.part(rbox(V((x,y0-0.03,0.24)),(0.09,0.1,0.48),r=0.4),fr,'post')
    m.part(rbox(V((0,y0-0.03,0.5)),(0.56,0.12,0.09),r=0.4),fr,'lintel')
    gable(m,0,y0+0.05,0.62,0.4,0.55,0.2,T['roof'],ridge='gold' if t==5 else None)
    for x in (-0.09,0.09):m.part(rbox(V((x,-0.62,0.02)),(0.025,0.8,0.03),r=0.5,seg=1),'iron','rail')
    for i in range(5):m.part(rbox(V((0,-0.95+i*0.17,0.01)),(0.3,0.05,0.02),r=0.5,seg=1),'woodD','sleeper')
    cy=-0.72;m.part(rbox(V((0,cy,0.16)),(0.3,0.36,0.18),r=0.35),'woodD','cart')
    for x in (-0.14,0.14):
        for y in (cy-0.11,cy+0.11):m.part(cyl(V((x-0.02,y,0.05)),V((x+0.02,y,0.05)),0.05,sides=8),'iron','wheel')
    ore='gold' if t==5 else ('iron' if t==4 else 'stone')
    for i,(x,y) in enumerate(((-0.07,cy-0.07),(0.07,cy-0.05),(0,cy+0.07),(-0.06,cy+0.06),(0.07,cy+0.08))):m.part(blob(V((x,y,0.27)),0.07,seed=10+i,j=0.2,seg=6,ring=4),ore,'ore')
    if t>=4:m.part(rbox(V((0.3,y0-0.1,0.42)),(0.08,0.08,0.11),r=0.6),'lamp','lantern');m.part(cyl(V((0.22,y0-0.1,0.48)),V((0.3,y0-0.1,0.48)),0.012,sides=5),'woodD','arm')
    if t==5:
        for x in (-0.38,0.38):m.part(cyl(V((x,0.05,0.4)),V((x*0.4,0.15,1.05)),0.035,sides=6,bev=0.3),'woodD','crane')
        m.part(cyl(V((-0.2,0.15,1.03)),V((0.2,0.15,1.03)),0.06,sides=10),'woodD','winch');m.part(cyl(V((0,0.15,1.0)),V((0,0.15,0.6)),0.01,sides=4),'straw','rope')
        flag(m,0.6,0.15,0.3,'roofR')
    return m
def p_tavern(t):
    # the inn: L3 one floor of wood with a mug sign, L4 a stone ground floor + wooden upper floor + chimney, L5 bigger with a balcony and a gold sign
    T=TIER[t];m=fresh('tavern'+'GBR'[t-3]);w,d=1.05,0.95;cy=0.12
    if t==3:walls(m,0,cy,w,d,0.6,'wood',posts='woodD');zt=0.6
    else:
        walls(m,0,cy,w,d,0.42,'stone');walls(m,0,cy,w+0.06,d+0.06,0.4 if t==4 else 0.5,'cream',z=0.42,posts='woodD');zt=0.82 if t==4 else 0.92
        m.part(rbox(V((0,cy,0.43)),(w+0.1,d+0.1,0.05),r=0.5,seg=1),'woodD','floorbeam')
    gable(m,0,cy,w+(0.06 if t>3 else 0),d+(0.06 if t>3 else 0),zt,0.5,T['roof'],ridge='gold' if t==5 else None,end='cream' if t>3 else 'wood')
    door(m,-0.15,cy-d/2,0.26,0.36)
    window(m,0.25,cy-d/2-0.01,0.28,0.15,T['lit'])
    if t>3:
        for x in (-0.25,0.25):window(m,x,cy-d/2-0.04,0.62 if t==4 else 0.66,0.14,True)
        chimney(m,0.32,cy+0.2,zt+0.12,0.4)
    if t==5:
        m.part(rbox(V((0,cy-d/2-0.12,0.45)),(0.7,0.22,0.04),r=0.5,seg=1),'woodD','balcony')
        for x in (-0.32,-0.11,0.11,0.32):m.part(cyl(V((x,cy-d/2-0.21,0.45)),V((x,cy-d/2-0.21,0.58)),0.015,sides=5),'wood','baluster')
        m.part(rbox(V((0,cy-d/2-0.21,0.58)),(0.7,0.03,0.03),r=0.5,seg=1),'wood','rail')
        chimney(m,-0.32,cy+0.25,zt+0.1,0.35)
    # the sign: a board on an arm with a mug on it
    sx=-0.5;m.part(cyl(V((sx+0.05,cy-d/2-0.05,0.55)),V((sx-0.2,cy-d/2-0.05,0.55)),0.015,sides=5),'woodD','arm')
    m.part(rbox(V((sx-0.13,cy-d/2-0.05,0.43)),(0.18,0.03,0.16),r=0.5,seg=1),'gold' if t==5 else 'wood','sign')
    m.part(cyl(V((sx-0.13,cy-d/2-0.08,0.39)),V((sx-0.13,cy-d/2-0.08,0.47)),0.035,sides=8),'yellow','mug')
    barrel(m,0.42,cy-d/2-0.15,0.1)
    if t==5:m.part(rbox(V((0.5,cy-d/2-0.05,0.5)),(0.08,0.08,0.1),r=0.6),'lamp','lantern')
    return m
def p_home(t):
    # the storehouse (stash): L3 a wooden shed with big barn doors, L4 stone walls + iron bands, L5 a red roof and a little round vault tower with a gold cone
    T=TIER[t];m=fresh('home'+'GBR'[t-3]);w,d=0.82,0.88;cy=0.08;wall='wood' if t==3 else 'stone'
    if t>=4:plinth(m,0,cy,w+0.08,d+0.08,0.1)
    z0=0.1 if t>=4 else 0
    walls(m,0,cy,w,d,0.55,wall,z=z0,posts='woodD' if t==3 else None)
    gable(m,0,cy,w,d,z0+0.55,0.42,T['roof'],ridge='gold' if t==5 else None,end=wall)
    for s in (-1,1):m.part(rbox(V((s*0.1,cy-d/2-0.02,z0+0.22)),(0.19,0.05,0.44),r=0.3),'woodD','barn')
    for z in (0.12,0.32):m.part(rbox(V((0,cy-d/2-0.05,z0+z)),(0.4,0.02,0.03),r=0.5,seg=1),'iron' if t>=4 else 'wood','band')
    if t==3:m.part(cyl(V((-0.18,cy-d/2-0.05,z0+0.04)),V((0.18,cy-d/2-0.05,z0+0.42)),0.015,sides=5),'wood','brace')
    if t>=4:m.part(rbox(V((0,cy-d/2-0.07,z0+0.22)),(0.07,0.03,0.08),r=0.5,seg=1),'gold','lock')
    window(m,0,cy-d/2-0.01,z0+0.64,0.12,T['lit'])
    if t>=4:chimney(m,0.22,cy+0.2,z0+0.62,0.32)
    if t==5:
        x,y=w/2+0.02,cy-d/2+0.12
        m.part(cyl(V((x,y,0)),V((x,y,0.95)),0.18,sides=12,bev=0.25),'stone','vault');cone(m,V((x,y,0.95)),0.22,0.4,'yellow');m.part(ball(V((x,y,1.37)),0.035,seg=6,ring=4),'gold','knob')
        window(m,x,y-0.18,0.65,0.08,True)
    m.part(rbox(V((-0.5,cy-0.2,0.1)),(0.18,0.18,0.2),r=0.25),'wood','crate')
    return m
def p_forge(t):
    # the smithy: a half-open workshop under a wide roof, a stone hearth with glowing coals and a big chimney.
    # L4: stone walls and a blue roof. L5: a red roof, a taller chimney with a gold band
    T=TIER[t];m=fresh('forge'+'GBR'[t-3]);w,d=1.15,1.1;wall='wood' if t==3 else 'stone'
    if t>=4:plinth(m,0,0.05,w+0.08,d+0.08,0.08)
    z0=0.08 if t>=4 else 0
    m.part(rbox(V((0,0.05+d/2-0.12,z0+0.28)),(w,0.24,0.56),r=0.25),wall,'backwall')
    m.part(rbox(V((-w/2+0.12,0.05,z0+0.28)),(0.24,d,0.56),r=0.25),wall,'sidewall')
    for x,y in ((w/2-0.05,0.05-d/2+0.05),(-w/2+0.05,0.05-d/2+0.05),(w/2-0.05,0.05+d/2-0.05)):m.part(cyl(V((x,y,z0)),V((x,y,z0+0.56)),0.05,sides=8,bev=0.3),'woodD','post')
    gable(m,0,0.05,w,d,z0+0.56,0.36,T['roof'],ridge='gold' if t==5 else None,end=wall)
    m.part(rbox(V((0.15,0.25,z0+0.12)),(0.42,0.32,0.24),r=0.3),'stone','hearth');m.part(rbox(V((0.15,0.24,z0+0.25)),(0.32,0.22,0.04),r=0.5),'ember','coals')
    ch=0.75 if t<5 else 0.95;m.part(rbox(V((0.15,0.38,z0+0.24+ch/2)),(0.22,0.2,ch),r=0.35),'stone','chimney')
    if t==5:m.part(rbox(V((0.15,0.38,z0+0.24+ch*0.8)),(0.25,0.23,0.05),r=0.5,seg=1),'gold','band')
    m.part(rbox(V((0.15,0.38,z0+0.24+ch)),(0.26,0.24,0.05),r=0.5,seg=1),'soot','cap')
    m.part(cyl(V((-0.2,-0.2,0)),V((-0.2,-0.2,0.18)),0.1,0.09,sides=10,bev=0.3),'wood','stump');m.part(rbox(V((-0.2,-0.2,0.23)),(0.24,0.1,0.07),r=0.4),'iron','anvil')
    if t>=4:m.part(cyl(V((0.42,-0.3,0)),V((0.42,-0.3,0.16)),0.09,sides=10,bev=0.3),'woodD','tub');m.part(cyl(V((0.42,-0.3,0.15)),V((0.42,-0.3,0.165)),0.075,sides=10),'blue','water')
    return m
def p_marketH(t):
    # the market hall: a long open roof on posts over counters and goods, wide like the KayKit market (x:z 1 : 0.73).
    # L3 green roof, L4 blue roof + a stone back wall + lanterns, L5 red/cream stripes, gold knobs and a pennant
    T=TIER[t];m=fresh('market'+'GBR'[t-3]);w,d=1.7,1.2
    if t>=4:m.part(rbox(V((0,d/2-0.12,0.3)),(w-0.1,0.18,0.6),r=0.25),'stone','backwall')
    for x in (-w/2+0.08,0,w/2-0.08):
        for y in (-d/2+0.1,d/2-0.12):m.part(cyl(V((x,y,0)),V((x,y,0.6)),0.045,sides=8,bev=0.3),'woodD','post')
    if t<5:gable(m,0,0,w,d,0.6,0.32,T['roof'])
    else:
        a=math.atan2(0.32,d/2);L=math.hypot(d/2,0.32)+0.09;n=8
        for i in range(n):
            x0=-w/2-0.09+(w+0.18)*i/n;x1=x0+(w+0.18)/n
            for s in (-1,1):
                bm=rbox(V((0,0,0)),(x1-x0+0.002,L,0.08),r=0.3,seg=1);rot(bm,'X',s*a);bmesh.ops.translate(bm,vec=V(((x0+x1)/2,s*(d/4+0.03),0.6+0.16+0.02)),verts=bm.verts)
                m.part(bm,'roofR' if i%2==0 else 'cream','stripe')
        m.part(cyl(V((-w/2-0.09,0,0.95)),V((w/2+0.09,0,0.95)),0.06,sides=8,bev=0.3),'gold','ridge')
    for x,col in ((-0.5,'apple'),(0.0,'yellow'),(0.5,'green')):
        m.part(rbox(V((x,-0.1,0.18)),(0.42,0.36,0.36),r=0.25),'wood','counter')
        for k in range(4):m.part(ball(V((x-0.12+0.08*k,-0.12,0.4)),0.06,seg=6,ring=4),col,'goods')
    if t>=4:
        for x in (-w/2+0.08,w/2-0.08):m.part(rbox(V((x,-d/2+0.02,0.45)),(0.08,0.08,0.1),r=0.6),'lamp','lantern')
    if t==5:flag(m,w/2-0.08,-d/2+0.1,0.6,'yellow')
    return m

# ---------- yard pieces ----------
def p_wbarrow():
    m=fresh('wbarrow')   # long along y like vx_wbarrow (z/x about 2)
    m.part(rbox(V((0,0.05,0.18)),(0.22,0.3,0.12),r=0.35),'wood','tray');m.part(blob(V((0,0.05,0.26)),0.09,(1,1.4,0.5),seed=7),'stone','load')
    m.part(cyl(V((-0.03,-0.17,0.08)),V((0.03,-0.17,0.08)),0.08,sides=10),'woodD','wheel')
    for x in (-0.09,0.09):m.part(cyl(V((x,-0.12,0.14)),V((x,0.42,0.2)),0.018,sides=6),'woodD','handle');m.part(cyl(V((x,0.12,0)),V((x,0.12,0.13)),0.016,sides=5),'woodD','leg')
    return m
def p_ladder():
    m=fresh('ladder')   # upright, thin (like vx_ladder)
    for x in (-0.1,0.1):m.part(cyl(V((x,0,0)),V((x,0.04,0.78)),0.022,sides=6,bev=0.3),'wood','rail')
    for i in range(5):z=0.1+i*0.15;m.part(cyl(V((-0.1,z*0.05,z)),V((0.1,z*0.05,z)),0.016,sides=5),'woodD','rung')
    return m
def p_stone():
    m=fresh('stones')   # a pile of cut stone blocks (like v_stone, x:z 1 : 0.85)
    for i,(x,y,z,r) in enumerate(((-0.1,0,0.07,0.2),(0.12,0.02,0.07,-0.3),(0.0,-0.02,0.2,0.4),(0.0,0.12,0.06,0.1))):
        bm=rbox(V((x,y,z)),(0.2,0.15,0.13),r=0.45);rot(bm,'Z',r,V((x,y,z)));m.part(bm,'stone' if i%2==0 else 'rock','block')
    return m
def p_towerA():
    # a small round stone watchtower with a red cone (tall, like vx_towerA)
    m=fresh('towerA')
    m.part(cyl(V((0,0,0)),V((0,0,1.25)),0.36,0.32,sides=14,bev=0.2),'stone','tower');m.part(cyl(V((0,0,1.22)),V((0,0,1.32)),0.4,sides=14,bev=0.3),'stone','ledge')
    cone(m,V((0,0,1.32)),0.42,0.6,'roofR',sides=14);m.part(ball(V((0,0,1.95)),0.04,seg=6,ring=4),'gold','knob')
    window(m,0,-0.35,0.9,0.1,True);door(m,0,-0.34,0.18,0.3)
    return m
def p_towerB():
    # a wooden lookout: four legs, a railed platform, a little blue roof
    m=fresh('towerB');s=0.32
    for x in (-s,s):
        for y in (-s,s):m.part(cyl(V((x,y,0)),V((x*0.8,y*0.8,0.9)),0.04,sides=6,bev=0.3),'woodD','leg')
    m.part(rbox(V((0,0,0.9)),(0.7,0.7,0.07),r=0.4),'wood','deck');m.part(rbox(V((0,0,1.0)),(0.68,0.68,0.12),r=0.3),'wood','rail')
    m.part(rbox(V((0,0,1.0)),(0.56,0.56,0.14),r=0.3),'woodD','inside')
    for x in (-0.28,0.28):
        for y in (-0.28,0.28):m.part(cyl(V((x,y,1.0)),V((x,y,1.25)),0.025,sides=5),'woodD','post')
    cone(m,V((0,0,1.25)),0.46,0.3,'roofB',sides=8)
    return m
def p_pallet():
    m=fresh('pallet')
    for i in range(4):m.part(rbox(V((-0.12+i*0.08,0,0.06)),(0.06,0.3,0.03),r=0.4,seg=1),'wood','slat')
    for y in (-0.11,0.11):m.part(rbox(V((0,y,0.025)),(0.3,0.05,0.05),r=0.4,seg=1),'woodD','skid')
    return m

# ---------- the open world: trees and rocks you gather ----------
def p_tree(v):
    # A: a tall round crown in three leaf balls (like v_treeA, h:w about 2). B: a wider, lower, darker crown (like v_treeB, about 1.7)
    m=fresh('tree'+v);rnd=random.Random(11 if v=='A' else 22)
    th=0.55 if v=='A' else 0.45
    m.part(cyl(V((0,0,0)),V((0,0,th+0.2)),0.11,0.075,sides=10,bev=0.25),'woodD','trunk')
    for a in (0.3,2.4,4.4):m.part(cyl(V((0,0,0.06)),V((math.cos(a)*0.17,math.sin(a)*0.17,0)),0.06,0.03,sides=6),'woodD','root')
    if v=='A':balls=((0,0,th+0.27,0.29),(0.03,0.02,th+0.6,0.22),(-0.12,0.08,th+0.12,0.18),(0.13,-0.06,th+0.15,0.17))
    else:balls=((0,0,th+0.2,0.33),(-0.18,0.1,th+0.08,0.22),(0.19,0.04,th+0.1,0.21),(0.02,-0.05,th+0.42,0.22))
    for i,(x,y,z,r) in enumerate(balls):m.part(blob(V((x,y,z)),r,seed=rnd.randint(0,99),j=0.08,seg=12,ring=8),('leaf' if i%2==0 else 'leafD') if v=='A' else ('leafD' if i%2==0 else 'leaf'),'leaves')
    if v=='B':
        for i in range(3):a=rnd.uniform(0,6.28);m.part(ball(V((math.cos(a)*0.24,math.sin(a)*0.24-0.1,th+0.2+rnd.uniform(-0.05,0.1))),0.035,seg=6,ring=4),'apple','fruit')
    return m
def p_rock():
    # a toy boulder: one big round stone and two smaller ones, a mossy top (like v_rock, h:w about 0.57)
    m=fresh('rock')
    m.part(blob(V((0,0.02,0.0)),0.3,(1.05,0.95,0.9),seed=5,j=0.1,seg=12,ring=8),'rock','big')
    m.part(blob(V((0.22,-0.14,0.0)),0.15,(1,1,0.85),seed=6,j=0.14),'stone','small')
    m.part(blob(V((-0.24,-0.08,0.0)),0.12,(1,1,0.8),seed=8,j=0.14),'rock','small')
    m.part(blob(V((-0.04,0.06,0.24)),0.17,(1.1,0.95,0.35),seed=9,j=0.1),'moss','moss')
    return m

PIECES={'ruin':p_ruin,'stageA':p_stageA,'stageB':p_stageB,'tent':p_tent,'hallG':p_hall,'keepB':p_keep,'castleY':p_castle,
  'wbarrow':p_wbarrow,'ladder':p_ladder,'stones':p_stone,'towerA':p_towerA,'towerB':p_towerB,'pallet':p_pallet,'flagB':lambda:bv.p_flag('flagB','blue','gold'),
  'treeA':lambda:p_tree('A'),'treeB':lambda:p_tree('B'),'rock':p_rock}
for t in (3,4,5):
    for n,f in (('mill',p_mill),('mine',p_mine),('tavern',p_tavern),('home',p_home),('forge',p_forge),('market',p_marketH)):PIECES[n+'GBR'[t-3]]=(lambda f,t:lambda:f(t))(f,t)
bv.palette()
for k,f in PIECES.items():
    if not ONLY or k in ONLY:f().export(join=True)
