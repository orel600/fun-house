# קשת השמיים ומטה הכוכבים מצורות פשוטות, בסגנון KayKit (ניר אישר, 6.11.2026). דוגמה לפריט חדש: פונקציה שבונה צורות, ושורה build() בסוף.
# שימוש (מהשורש): blender -b --python tools/blender/build_weapons.py -- tools/blender art/weapons/raw
# ואז: node tools/build3d.js - --only items --items=skyBow,starStaff (ITEMS עם ready:true)
# יוצא: skyBow.glb ו-starStaff.glb, באותה מערכת צירים כמו נשקי KayKit, כך שהחלפה היא רק החלפת מודל:
#   קשת (כמו w_bow_B_withString): האורך על x, הקשת במישור xy (המיתר לכיוון +y של Blender), דקה ב-z, הידית בראשית.
#   מטה (כמו w_staff_B): זקוף על z של Blender (y ב-glTF), מ-0.86- עד הראש, הידית בראשית (37% מלמטה).
# צבע: כל חלק בוחר עמודה בפלטה (palette_weapons.png), והגובה בתוך העמודה הוא בהיר-כהה. עמודות glowc, glowy ו-pink זוהרות (palette_weapons_glow.png).
import bpy,bmesh,sys,math
from mathutils import Vector,Matrix
pdir,out=sys.argv[-2:]
COL={n:i for i,n in enumerate('iron darkiron bone gold leather purple blue red sky navy violet glowc glowy white pink deep'.split())};NC=16

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

build('skyBow',sky_bow,0.9)   # כמו קשת KayKit (1.9) ועוד קצת, כי היא אגדית
build('starStaff',star_staff)
