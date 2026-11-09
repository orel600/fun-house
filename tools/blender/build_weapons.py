# קשת השמיים, מטה הכוכבים, להב הכסף, מטה האלון ופטיש השומר מצורות פשוטות, בסגנון KayKit (ניר אישר, 6.11.2026). דוגמה לפריט חדש: פונקציה שבונה צורות, ושורה build() בסוף.
# שימוש (מהשורש): blender -b --python tools/blender/build_weapons.py -- tools/blender art/weapons/raw
# ואז: node tools/build3d.js - --only items --items=skyBow,starStaff (ITEMS עם ready:true)
# יוצא: skyBow.glb ו-starStaff.glb, באותה מערכת צירים כמו נשקי KayKit, כך שהחלפה היא רק החלפת מודל:
#   קשת (כמו w_bow_B_withString): האורך על x, הקשת במישור xy (המיתר לכיוון +y של Blender), דקה ב-z, הידית בראשית.
#   מטה (כמו w_staff_B): זקוף על z של Blender (y ב-glTF), מ-0.86- עד הראש, הידית בראשית (37% מלמטה).
# צבע: כל חלק בוחר עמודה בפלטה (palette_weapons.png), והגובה בתוך העמודה הוא בהיר-כהה. עמודות glowc, glowy ו-pink זוהרות (palette_weapons_glow.png).
import bpy,bmesh,sys,math
from mathutils import Vector,Matrix
pdir,out=sys.argv[-2:]
COL={n:i for i,n in enumerate('iron darkiron bone gold leather purple blue red sky navy violet glowc glowy white pink deep oak leaf stone moss rune'.split())};NC=32   # כמו W/8 ב-make_palette.py

def material():
    m=bpy.data.materials.new('own_palette');m.use_nodes=True;nt=m.node_tree;b=nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value=0.9
    for name,inp in (('palette_weapons.png','Base Color'),('palette_weapons_glow.png','Emission Color')):
        tx=nt.nodes.new('ShaderNodeTexImage');tx.image=bpy.data.images.load(pdir+'/'+name);tx.interpolation='Closest'
        nt.links.new(tx.outputs[0],b.inputs[inp])
    b.inputs['Emission Strength'].default_value=1.0
    return m

def build(name,fn,scale=1.0):   # scale: הגודל הסופי (הידית נשארת בראשית)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mat=material();parts=[]
    def part(bm,pname,color,vf=None,smooth=False):
        # vf(co)->0..1: איפה בעמודה (1 = בהיר). ברירת מחדל: לפי הגובה (z) של החלק
        me=bpy.data.meshes.new(pname);bm.to_mesh(me);bm.free()
        o=bpy.data.objects.new(pname,me);bpy.context.collection.objects.link(o);me.materials.append(mat)
        zs=[v.co.z for v in me.vertices];z0,z1=min(zs),max(zs)
        f=vf or (lambda c:(c.z-z0)/max(z1-z0,1e-4))
        uv=me.uv_layers.new();u=(COL[color]+0.5)/NC
        for l in me.loops:uv.data[l.index].uv=(u,0.08+0.84*min(1,max(0,f(me.vertices[l.vertex_index].co))))
        for p in me.polygons:p.use_smooth=smooth
        parts.append(o);return o
    fn(part)
    tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in parts)
    for o in parts:o.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();ob=bpy.context.active_object;ob.name=name
    ob.scale=(scale,)*3;bpy.ops.object.transform_apply(scale=True)
    bpy.ops.export_scene.gltf(filepath=f'{out}/{name}.glb',use_selection=True,export_format='GLB')
    d=ob.dimensions;print('BUILT',name,'tris',tris,'size',[round(x,2) for x in d])

# ---------- צורות ----------
def frame(d,ref):
    x=d.cross(ref)
    if x.length<1e-4:x=d.cross(Vector((1,0,0)))
    x.normalize();return x,d.cross(x)
def tube(path,rad,sides=8,cap=True,ref=Vector((0,0,1)),closed=False):
    # rad: מספר או זוג (רדיוס בכיוון הנורמל, רדיוס בכיוון ref), כדי לקבל חתך שטוח כמו גפה של קשת
    bm=bmesh.new();rings=[];n=len(path)
    for i,p in enumerate(path):
        if closed:d=(path[(i+1)%n]-path[i-1]).normalized()
        else:d=(path[min(i+1,n-1)]-path[max(i-1,0)]).normalized()
        x,y=frame(d,ref);r=rad[i];ra,rb=(r,r) if not isinstance(r,tuple) else r
        rings.append([bm.verts.new(p+ra*math.cos(2*math.pi*k/sides+math.pi/sides)*x+rb*math.sin(2*math.pi*k/sides+math.pi/sides)*y) for k in range(sides)])
    pairs=list(zip(rings,rings[1:]))+([(rings[-1],rings[0])] if closed else [])
    for a,b in pairs:
        for k in range(sides):bm.faces.new((a[k],a[(k+1)%sides],b[(k+1)%sides],b[k]))
    if cap and not closed:bm.faces.new(rings[0][::-1]);bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces);return bm
def cyl(r,depth,c,sides=8,r2=None,rot=None):
    bm=bmesh.new();M=Matrix.Translation(c)@(rot or Matrix())
    bmesh.ops.create_cone(bm,cap_ends=True,segments=sides,radius1=r,radius2=r if r2 is None else r2,depth=depth,matrix=M);return bm
def gem(c,axis,length,width,sides=4,mid=0.5):
    # גביש: שתי פירמידות גב אל גב, לאורך axis. mid: איפה החלק הרחב (0.5 = באמצע)
    bm=bmesh.new();a=axis.normalized();x,y=frame(a,Vector((0,0,1)) if abs(a.z)<0.9 else Vector((1,0,0)))
    b=bm.verts.new(c-a*length*mid);t=bm.verts.new(c+a*length*(1-mid))
    ring=[bm.verts.new(c+width*(math.cos(2*math.pi*k/sides)*x+math.sin(2*math.pi*k/sides)*y)) for k in range(sides)]
    for k in range(sides):bm.faces.new((ring[k],ring[(k+1)%sides],t));bm.faces.new((ring[(k+1)%sides],ring[k],b))
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces);return bm
def star(c,ro,ri,depth,pts=5,normal_axis='Y'):
    # כוכב שטוח עם בליטה: מרכז קדמי ואחורי, כך שהפאות נשברות כמו ב-KayKit
    bm=bmesh.new();R=Matrix.Rotation(math.pi/2,4,'X') if normal_axis=='Y' else Matrix()
    rim=[]
    for k in range(pts*2):
        a=math.pi/2+math.pi*k/pts;r=ro if k%2==0 else ri
        rim.append(bm.verts.new(c+R@Vector((r*math.cos(a),r*math.sin(a),0))))
    f=bm.verts.new(c+R@Vector((0,0,depth)));b=bm.verts.new(c+R@Vector((0,0,-depth)))
    n=len(rim)
    for k in range(n):bm.faces.new((rim[k],rim[(k+1)%n],f));bm.faces.new((rim[(k+1)%n],rim[k],b))
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces);return bm

# ---------- קשת השמיים ----------
def sky_bow(part):
    G=0.13  # חצי אורך הידית
    def limb(t,s):  # t: 0 בידית, 1 בקצה. s: צד (+1 ימין, -1 שמאל)
        x=G+0.84*t;y=-0.17*math.sin(math.pi*t*0.92)+0.30*t**3   # כפיפה החוצה, והקצה חוזר אל המיתר (recurve)
        return Vector((s*x,y,0))
    N=10
    for s in(1,-1):
        pts=[limb(i/(N-1),s) for i in range(N)]
        rad=[(0.11-0.06*(i/(N-1)),0.14-0.07*(i/(N-1))) for i in range(N)]   # שטוח: רחב ב-z, דק בכיוון הכפיפה
        part(tube(pts,rad,8),'limb','sky',vf=lambda c:(abs(c.x)-G)/0.84)    # כהה ליד הידית, לבן בקצה
        # כנף זהב בבסיס הגפה: משולש שטוח שבולט החוצה (לצד המטרה)
        p0=limb(0.10,s);p1=limb(0.34,s)
        bm=bmesh.new();v=[bm.verts.new(q) for q in (p0+Vector((0,-0.08,0.04)),p1+Vector((0,-0.06,0.04)),p0+Vector((s*0.08,-0.32,0.03)),
                                                      p0+Vector((0,-0.08,-0.04)),p1+Vector((0,-0.06,-0.04)),p0+Vector((s*0.08,-0.32,-0.03)))]
        bm.faces.new(v[0:3]);bm.faces.new(v[3:6][::-1])
        for a,b in((0,1),(1,2),(2,0)):bm.faces.new((v[a],v[b],v[b+3],v[a+3]))
        bmesh.ops.recalc_face_normals(bm,faces=bm.faces);part(bm,'wing','gold')
        # כובע זהב וגביש זוהר בקצה, לאורך הכיוון של הקצה
        tip=limb(1,s);d=(limb(1,s)-limb(0.93,s)).normalized()
        part(cyl(0.065,0.09,tip-d*0.02,8,0.045,rot=d.to_track_quat('Z','Y').to_matrix().to_4x4()),'tipcap','gold')
        part(gem(tip+d*0.12,d,0.34,0.11,4,0.35),'tipgem','glowc')
    # ידית: עטיפה כחולה, טבעות זהב, וגביש שמש באמצע (לצד המטרה)
    rx=Matrix.Rotation(math.pi/2,4,'Y')
    part(cyl(0.115,2*G,Vector((0,0,0)),8,rot=rx),'grip','navy')
    for s in(1,-1):part(cyl(0.135,0.06,Vector((s*G,0,0)),8,rot=rx),'band','gold')
    part(gem(Vector((0,-0.13,0)),Vector((0,-1,0)),0.26,0.13,4,0.3),'heart','glowc')
    # מיתר של אור: דק וזוהר, מקצה לקצה
    a,b=limb(1,1),limb(1,-1)
    part(tube([b,(a+b)/2,a],[0.024]*3,4,ref=Vector((0,1,0))),'string','glowc')

# ---------- מטה הכוכבים ----------
def star_staff(part):
    B,T=-0.86,1.0   # תחתית המוט, וראש המוט (כמו w_staff_B: ‎-0.862 עד 1.454)
    N=6;pts=[Vector((0.012*math.sin(i*1.7),0,B+(T-B)*i/(N-1))) for i in range(N)]
    part(tube(pts,[0.05+0.012*i/(N-1) for i in range(N)],8,ref=Vector((0,1,0))),'shaft','navy')
    for z in(-0.13,0.13,0.88):part(cyl(0.075,0.05,Vector((0,0,z)),8),'band','gold')
    part(cyl(0.065,0.16,Vector((0,0,B-0.04)),8,0.0),'foot','gold')               # עוקץ זהב למטה
    part(cyl(0.07,0.14,Vector((0,0,T+0.03)),8,0.11),'neck','gold')               # צוואר שנפתח אל הראש
    C=Vector((0,0,1.34))   # מרכז הכוכב
    # עריסה: חצי-ירח מזהב שמחזיק את הכוכב מלמטה, עם שני קרניים למעלה
    arc=[C+Vector((0.25*math.cos(a),0,0.25*math.sin(a))) for a in [math.radians(x) for x in range(200,341,20)]]
    arc=[arc[0]+Vector((-0.04,0,0.16))]+arc+[arc[-1]+Vector((0.04,0,0.16))]
    part(tube(arc,[0.022]+[0.04]*(len(arc)-2)+[0.022],6,ref=Vector((0,1,0))),'cradle','gold')
    part(star(C,0.24,0.105,0.08),'star','glowy',vf=lambda c:0.55+0.45*max(0,(c.z-C.z)/0.24))   # הכוכב: זוהר צהוב-לבן
    part(gem(C+Vector((0,-0.075,0)),Vector((0,-1,0)),0.06,0.05,4,0.2),'core','white')
    # טבעת מסלול זוהרת, נטויה, ושלושה שביבים עליה
    Rm=Matrix.Rotation(math.radians(20),3,'Y')@Matrix.Rotation(math.radians(68),3,'X')
    ring=[C+Rm@Vector((0.38*math.cos(2*math.pi*k/20),0.38*math.sin(2*math.pi*k/20),0)) for k in range(20)]
    part(tube(ring,[0.016]*20,4,closed=True,ref=Rm@Vector((0,0,1))),'orbit','glowc',vf=lambda c:0.7)
    for k,sz in((3,0.07),(10,0.055),(15,0.045)):
        p=ring[k];part(gem(p,Vector((0,0,1)),sz*2,sz*0.6,4),'spark','glowy')

# ---------- להב הכסף (קונספט 9.11.2026, docs/concept-weapon-models.md): עקום, שומר חצי-ירח בצורת S, אבן כחולה ---------
def silver_blade(part):
    B0,B1=0.16,1.72                       # הלהב מהשומר עד הקצה (z), הידית בראשית כמו w_sword_C (‎-0.43 עד 1.70)
    N=12
    def spine(t):return Vector((0.42*t**2.0,0,B0+(B1-B0)*t))
    def width(t):  # belly (convex, -x side) and back (+x side)
        belly=0.08+0.17*math.sin(math.pi*min(1,t/0.72)*0.5)**1.3*(1-max(0,(t-0.6)/0.4)**1.4)
        back=0.06*(1-t)+0.012
        return belly,back
    bm=bmesh.new();rings=[]
    for i in range(N):
        t=i/(N-1);p=spine(t);d=(spine(min(1,t+0.02))-spine(max(0,t-0.02))).normalized()
        n=Vector((-d.z,0,d.x))           # outward normal toward the belly (-x)
        if n.x>0:n=-n
        wf,wb=width(t);th=0.045*(1-0.85*t)+0.006
        if i==N-1:wf=wb=0.0;th=0.0
        rings.append([bm.verts.new(p+n*wf),bm.verts.new(p+Vector((0,th,0))),bm.verts.new(p-n*wb),bm.verts.new(p-Vector((0,th,0)))])
    for a,b in zip(rings,rings[1:]):
        for k in range(4):
            q=(a[k],a[(k+1)%4],b[(k+1)%4],b[k])
            if len(set(q))==4:bm.faces.new(q)
    bm.faces.new(rings[0][::-1])
    bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=1e-5);bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
    part(bm,'blade','white',vf=lambda c:0.25+0.75*min(1,max(0,(c.z-B0)/(B1-B0))))
    # fuller: thin dark line on both faces, along the spine
    for s in(1,-1):
        pts=[spine(t)+Vector((0,s*(0.045*(1-0.85*t)+0.004),0))*0.92 for t in [j/7*0.7 for j in range(8)]]
        pts=[Vector((p.x-0.02*(1-j/7),p.y,p.z)) for j,p in enumerate(pts)]
        part(tube(pts,[0.014]*8,4,ref=Vector((0,1,0))),'fuller','iron',vf=lambda c:0.35)
    # guard: centre block + crescent arms curling up toward the blade
    part(cyl(0.17,0.09,Vector((0,0,0.13)),4,rot=Matrix.Rotation(math.pi/2,4,'X')),'guardc','white',vf=lambda c:0.55)   # flat diamond plate facing front/back
    for s in(1,-1):
        arc=[Vector((s*(0.10+0.22*math.sin(a)),0,0.13+s*0.24*(1-math.cos(a)))) for a in [math.radians(x) for x in (0,30,60,90,120,145,165)]]
        part(tube(arc,[0.055,0.055,0.05,0.042,0.032,0.02,0.008],6,ref=Vector((0,1,0))),'arm','iron',vf=lambda c:0.55+0.35*min(1,(c.z-0.08)/0.3))
    # blue gem on both faces of the guard plate
    for s in(1,-1):
        part(gem(Vector((0,s*0.05,0.13)),Vector((0,s,0)),0.13,0.125,4,0.2),'gem','blue',vf=lambda c:0.9)
    # grip: navy wrap with three silver rings, silver pommel
    part(cyl(0.05,0.44,Vector((0,0,-0.16)),8,0.055),'grip','navy',vf=lambda c:0.55)
    for z in(-0.30,-0.15,0.0):part(cyl(0.062,0.03,Vector((0,0,z)),8),'ring','iron',vf=lambda c:0.75)
    part(cyl(0.085,0.08,Vector((0,0,-0.41)),8,0.06),'pommel','iron',vf=lambda c:0.6)
    part(cyl(0.09,0.05,Vector((0,0,-0.47)),8,0.07),'pcap','white',vf=lambda c:0.8)
build('skyBow',sky_bow,0.9)   # כמו קשת KayKit (1.9) ועוד קצת, כי היא אגדית
build('starStaff',star_staff)
build('silverBlade',silver_blade)

# ---------- מטה האלון: מוט עץ מפותל, ראש מסולסל ועלים (ניר אישר, 9.11.2026) ----------
def leaf(c,d,length,width,n=Vector((0,1,0)),bulge=0.025):
    # עלה שטוח: בסיס, קצה, שני צדדים, ובליטה קטנה בשני הפנים
    bm=bmesh.new();d=d.normalized();s=d.cross(n).normalized()
    b=bm.verts.new(c);t=bm.verts.new(c+d*length);l=bm.verts.new(c+d*length*0.45+s*width);r=bm.verts.new(c+d*length*0.45-s*width)
    f=bm.verts.new(c+d*length*0.45+n*bulge);k=bm.verts.new(c+d*length*0.45-n*bulge)
    for a,e in((b,l),(l,t),(t,r),(r,b)):bm.faces.new((a,e,f));bm.faces.new((e,a,k))
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces);return bm
def oak_staff(part):
    B=-1.07   # כמו w_staff_A: מ-1.07- עד 1.07, הידית באמצע
    N=9;sh=[Vector((-0.10*(i/(N-1))**1.5+0.018*math.sin(i*1.9),0.012*math.cos(i*1.3),B+(0.85-B)*i/(N-1))) for i in range(N)]
    part(tube(sh,[0.085-0.012*i/(N-1) for i in range(N)],7,ref=Vector((0,1,0))),'shaft','oak',vf=lambda c:0.25+0.5*(c.z-B)/(0.85-B))
    # הסלסול: ספירלה שטוחה במישור xz, מתחילה בראש המוט ומתעקלת ימינה ופנימה
    C=Vector((0.13,0,0.99));top=sh[-1];a0=math.atan2(top.z-C.z,top.x-C.x);r0=(top-C).length
    M=16;sp=[C+Vector(((r0*(1-0.78*k/(M-1)))*math.cos(a0-2*math.pi*1.45*k/(M-1)),0,(r0*(1-0.78*k/(M-1)))*math.sin(a0-2*math.pi*1.45*k/(M-1)))) for k in range(M)]
    part(tube([sh[-2]]+sp,[0.072]+[0.072-0.036*k/(M-1) for k in range(M)],7,ref=Vector((0,1,0))),'curl','oak',vf=lambda c:0.65+0.3*max(0,(c.z-0.8)/0.5))
    # גפן דקה שמתפתלת סביב המוט
    V=[Vector((sh[0].x,0,0))]
    V=[Vector((-0.10*t**1.5+0.085*math.cos(9*t),0.085*math.sin(9*t),-0.45+1.25*t)) for t in [j/17 for j in range(18)]]
    part(tube(V,[0.022]*18,4,ref=Vector((0,0,1))),'vine','oak',vf=lambda c:0.15)
    # עלים: שניים ליד הסלסול, אחד באמצע המוט
    for c,d,L,W in((Vector((-0.16,0,0.78)),Vector((-1,0,0.6)),0.34,0.13),(Vector((0.40,0,1.02)),Vector((1,0,-0.2)),0.30,0.12),(Vector((-0.05,0,0.05)),Vector((-1,0,0.35)),0.28,0.11)):
        part(leaf(c,d,L,W),'leaf','leaf',vf=lambda c,c0=c,d0=d.normalized():0.35+0.6*min(1,max(0,(c-c0).dot(d0)/L)))
    part(cyl(0.075,0.08,Vector((sh[0].x,0,B-0.01)),7,0.05),'foot','darkiron',vf=lambda c:0.5)   # כיפה קטנה בתחתית

# ---------- פטיש השומר: ראש אבן עם טחב, חישוקי ברזל ורונה ירוקה זוהרת ----------
def box(c,sx,sy,sz,bev=0.0):
    bm=bmesh.new();bmesh.ops.create_cube(bm,size=1.0,matrix=Matrix.Translation(c)@Matrix.Diagonal((sx,sy,sz,1)))
    if bev:bmesh.ops.bevel(bm,geom=list(bm.edges),offset=bev,segments=1,affect='EDGES')
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces);return bm
def warden_hammer(part):
    H=Vector((0,0,0.56));HX,HY,HZ=0.80,0.36,0.40   # ראש: האורך ב-x כמו w_hammer_A (‎-0.39 עד 0.75)
    part(box(H,HX,HY,HZ,0.05),'head','stone',vf=lambda c:0.3+0.6*(c.z-0.36)/0.40)
    for s in(1,-1):part(box(H+Vector((s*0.20,0,0)),0.07,HY+0.04,HZ+0.04,0.012),'band','darkiron',vf=lambda c:0.6)
    # רונה: ספירלה מרובעת זוהרת על הפנים הקדמיים והאחוריים
    sq=[(0,0),(0.07,0),(0.07,0.07),(-0.07,0.07),(-0.07,-0.07),(0.11,-0.07),(0.11,0.11),(-0.11,0.11)]
    for s in(1,-1):
        pts=[H+Vector((x,s*(HY/2+0.012),z)) for x,z in sq]
        part(tube(pts,[0.016]*len(pts),4,ref=Vector((0,1,0))),'rune','rune',vf=lambda c:0.75)
    # טחב: כתמים שטוחים על הראש ועל הפינות
    for p,r in((Vector((-0.22,0.03,0.765)),0.14),(Vector((0.14,-0.05,0.765)),0.11),(Vector((0.40,0.10,0.70)),0.09),(Vector((-0.40,-0.08,0.42)),0.09),(Vector((0.30,-0.18,0.40)),0.08)):
        part(cyl(r,0.035,p,6,r*0.7),'moss','moss',vf=lambda c:0.6)
    # ידית: עטיפת עור, צווארון ברזל מתחת לראש, וכיפת ברזל למטה
    part(cyl(0.05,0.92,Vector((0,0,-0.03)),8,0.056),'grip','leather',vf=lambda c:0.5)
    for z in(-0.28,-0.12,0.04,0.20):part(cyl(0.062,0.035,Vector((0,0,z)),8),'wrap','leather',vf=lambda c:0.2)
    part(cyl(0.08,0.07,Vector((0,0,0.36)),8,0.065),'collar','darkiron',vf=lambda c:0.6)
    part(cyl(0.075,0.08,Vector((0,0,-0.50)),8,0.06),'pommel','darkiron',vf=lambda c:0.6)
build('oakStaff',oak_staff)
build('wardenHammer',warden_hammer)
