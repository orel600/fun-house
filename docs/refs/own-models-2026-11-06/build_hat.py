# שימוש: blender -b --python build.py -- <knight_raw.glb> <palette.png> <item:horned|wizard|none> <out_prefix>
import bpy,bmesh,sys,math
from mathutils import Vector,Matrix
glb,pal,item,out=sys.argv[-4:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
for o in list(bpy.data.objects):
    if o.name=='Icosphere' or (item!='none' and o.name in('Knight_Helmet','Knight_HelmetVisor')): bpy.data.objects.remove(o)
arm=[o for o in bpy.data.objects if o.type=='ARMATURE'][0]
COL={'iron':0,'darkiron':1,'bone':2,'gold':3,'leather':4,'purple':5,'blue':6,'red':7}; NC=8
img=bpy.data.images.load(pal)
mat=bpy.data.materials.new('own_palette');mat.use_nodes=True
nt=mat.node_tree;bsdf=nt.nodes['Principled BSDF'];bsdf.inputs['Roughness'].default_value=0.9
tx=nt.nodes.new('ShaderNodeTexImage');tx.image=img;tx.interpolation='Closest';nt.links.new(tx.outputs[0],bsdf.inputs['Base Color'])
parts=[]
def part(bm,name,color,smooth=True):
    me=bpy.data.meshes.new(name);bm.to_mesh(me);bm.free()
    o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);me.materials.append(mat)
    zs=[v.co.z for v in me.vertices];z0,z1=min(zs),max(zs)
    uv=me.uv_layers.new();u=(COL[color]+0.5)/NC
    for l in me.loops:
        z=me.vertices[l.vertex_index].co.z;uv.data[l.index].uv=(u,0.08+0.84*(z-z0)/max(z1-z0,1e-4))
    for p in me.polygons:p.use_smooth=smooth
    me.use_auto_smooth=True;me.auto_smooth_angle=math.radians(40)
    parts.append(o);return o
def tube(path,radii,sides=8,cap=True,REF=Vector((0,1,0))):
    bm=bmesh.new();rings=[]
    for i,(p,r) in enumerate(zip(path,radii)):
        d=(path[min(i+1,len(path)-1)]-path[max(i-1,0)]).normalized()
        a=REF;x=d.cross(a).normalized();y=d.cross(x)
        rings.append([bm.verts.new(p+r*(math.cos(2*math.pi*k/sides)*x+math.sin(2*math.pi*k/sides)*y)) for k in range(sides)])
    for a,b in zip(rings,rings[1:]):
        for k in range(sides):bm.faces.new((a[k],a[(k+1)%sides],b[(k+1)%sides],b[k]))
    if cap:bm.faces.new(rings[0][::-1]);bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces);return bm
def cyl(r,depth,z,sides=12,r2=None):
    bm=bmesh.new();bmesh.ops.create_cone(bm,cap_ends=True,segments=sides,radius1=r,radius2=r2 if r2 else r,depth=depth,matrix=Matrix.Translation((0,0,z)));return bm
def box(sx,sy,sz,c):
    bm=bmesh.new();bmesh.ops.create_cube(bm,size=1,matrix=Matrix.Translation(c)@Matrix.Diagonal((sx,sy,sz,1)));return bm
HZ=1.80  # גובה מרכז הראש של האביר (נמדד: ראש 1.216 עד 2.284)
if item=='horned':
    bm=bmesh.new();bmesh.ops.create_uvsphere(bm,u_segments=12,v_segments=8,radius=0.62)
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if v.co.z<-0.01],context='VERTS')
    bmesh.ops.scale(bm,vec=(1,1.02,0.95),verts=bm.verts);bmesh.ops.translate(bm,vec=(0,0.0,HZ),verts=bm.verts)
    part(bm,'Helmet_dome','iron')
    part(cyl(0.655,0.16,HZ+0.02,12),'Helmet_rim','darkiron',False)
    part(tube([Vector((0,0.645*math.sin(a),HZ+0.02+0.60*math.cos(a))) for a in [math.radians(x) for x in range(-80,81,20)]],[0.05]*9,6,REF=Vector((1,0,0))),'Helmet_ridge','gold',False)
    part(box(0.10,0.07,0.42,(0,-0.66,HZ-0.12)),'Helmet_nose','darkiron',False)
    for s in(1,-1):
        pts=[];N=7
        for i in range(N):
            t=i/(N-1);pts.append(Vector((s*(0.52+0.42*t),-0.04-0.06*t,HZ+0.18+0.05*t+0.55*t*t)))
        part(tube(pts,[0.15*(1-t/(N-1))**0.8+0.012 for t in range(N)],8),'Helmet_horn_'+('L' if s>0 else 'R'),'bone')
elif item=='wizard':
    BZ=HZ+0.26
    bm=cyl(0.92,0.05,BZ,14);bmesh.ops.translate(bm,vec=(0,0,0),verts=bm.verts)
    for v in bm.verts:
        r=math.hypot(v.co.x,v.co.y);v.co.z-=0.10*max(0,r-0.55)/0.37*(1 if v.co.y<0.2 else 0.6)  # שוליים צונחים מעט
    part(bm,'Hat_brim','purple')
    pts=[];rad=[];N=9
    for i in range(N):
        t=i/(N-1);pts.append(Vector((0.04*math.sin(t*3),0.55*t**2.2,BZ+0.02+1.25*t-0.15*t**3)));rad.append(0.56*(1-t)**0.9+0.02)
    
    part(tube(pts,rad,12,REF=Vector((1,0,0))),'Hat_cone','purple')
    part(cyl(0.575,0.14,BZ+0.09,12,0.555),'Hat_band','gold',False)
    bm=bmesh.new();bmesh.ops.create_circle(bm,cap_ends=True,segments=5,radius=0.12,matrix=Matrix.Translation((0,-0.60,BZ+0.10))@Matrix.Rotation(math.pi/2,4,'X'))
    bmesh.ops.extrude_face_region(bm,geom=bm.faces[:]);bmesh.ops.translate(bm,vec=(0,0.03,0),verts=[v for v in bm.verts if v.co.y>-0.6+0.001 or True][:5])
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces);part(bm,'Hat_star','gold',False)
tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in parts)
print('TRIS',item,tris)
# הצמדה לעצם הראש, כדי שהכובע יזוז עם האנימציה
bpy.ops.object.select_all(action='DESELECT')
if parts:
    for o in parts:o.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();hat=bpy.context.active_object;hat.name=('Helmet' if item=='horned' else 'Hat')
    bpy.ops.object.select_all(action='DESELECT');hat.select_set(True);bpy.ops.export_scene.gltf(filepath=out+'_item.glb',use_selection=True,export_format='GLB')
    hb=arm.data.bones['head'];mw=hat.matrix_world.copy();hat.parent=arm;hat.parent_type='BONE';hat.parent_bone='head';hat.matrix_world=mw
# ידיים למטה במקום תנוחת T
bpy.context.view_layer.objects.active=arm;bpy.ops.object.mode_set(mode='POSE')
for n,ang in(('upperarm.l',-68),('upperarm.r',68)):
    pb=arm.pose.bones[n];pb.rotation_mode='XYZ';pb.rotation_euler=(math.radians(ang),0,0)
bpy.ops.object.mode_set(mode='OBJECT')
arm.rotation_euler.z=math.radians(-25)
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=48;sc.cycles.use_denoising=False;sc.cycles.device='CPU'
sc.render.resolution_x=sc.render.resolution_y=640;sc.view_settings.view_transform='Standard';sc.render.film_transparent=False
w=bpy.data.worlds.new('w');sc.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs[0].default_value=(0.62,0.74,0.58,1);w.node_tree.nodes['Background'].inputs[1].default_value=1.1
sun=bpy.data.objects.new('sun',bpy.data.lights.new('sun','SUN'));sun.data.energy=3.2;sun.rotation_euler=(math.radians(40),math.radians(15),math.radians(-30));sc.collection.objects.link(sun)
cam=bpy.data.objects.new('cam',bpy.data.cameras.new('cam'));sc.collection.objects.link(cam);sc.camera=cam
cam.data.type='ORTHO';cam.data.ortho_scale=3.6
cam.location=(0,-8,3.6);cam.rotation_euler=(math.radians(76),0,0)
if item=='none':pass
cam.location.z=3.35 if item!='wizard' else 3.6
sc.render.filepath=out+'.png';bpy.ops.render.render(write_still=True)
