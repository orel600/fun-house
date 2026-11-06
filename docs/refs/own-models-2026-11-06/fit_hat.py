# שימוש: blender -b --python fit.py -- <char_raw.glb> <item.glb> <out.png>
# מתאים פריט לראש של כל דמות: מודד את הקודקודים שמחוברים לעצם head, ומזיז ומגדיל את הפריט לפיהם
import bpy,sys,math
from mathutils import Vector
ch,item,out=sys.argv[-3:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=ch)
for o in list(bpy.data.objects):
    if o.name=='Icosphere' or any(k in o.name for k in('Hat','Helmet','Hood')):bpy.data.objects.remove(o)
arm=[o for o in bpy.data.objects if o.type=='ARMATURE'][0]
pts=[]
for o in bpy.data.objects:
    if o.type!='MESH':continue
    g=o.vertex_groups.get('head')
    if o.parent_type=='BONE' and o.parent_bone=='head': pts+=[o.matrix_world@v.co for v in o.data.vertices];continue
    if not g:continue
    for v in o.data.vertices:
        w=[x for x in v.groups if x.group==g.index and x.weight>0.5]
        if w:pts.append(o.matrix_world@v.co)
xs=[p.x for p in pts];ys=[p.y for p in pts];zs=[p.z for p in pts]
W=max(xs)-min(xs);top=max(zs);cx=(max(xs)+min(xs))/2;cy=(max(ys)+min(ys))/2
print('HEAD',ch.split('/')[-1],'w',round(W,3),'top',round(top,3),'n',len(pts))
before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=item);hat=[o for o in bpy.data.objects if o not in before and o.type=='MESH'][0]
s=W/1.086*1.06;sz=s*1.28  # האביר: ראש ברוחב 1.086. הכיפה גבוהה יותר מהאביר, כדי שהשיער לא יבצבץ
hat.scale=(s,s,sz);hat.location=(cx,cy,top-0.43*s-1.82*sz)  # השוליים (1.82 באביר) נשארים במצח
bpy.context.view_layer.update();mw=hat.matrix_world.copy();hat.parent=arm;hat.parent_type='BONE';hat.parent_bone='head';hat.matrix_world=mw
bpy.context.view_layer.objects.active=arm;bpy.ops.object.mode_set(mode='POSE')
for n,ang in(('upperarm.l',-68),('upperarm.r',68)):
    if n in arm.pose.bones:pb=arm.pose.bones[n];pb.rotation_mode='XYZ';pb.rotation_euler=(math.radians(ang),0,0)
bpy.ops.object.mode_set(mode='OBJECT')
ms=[o for o in bpy.data.objects if o.type=='MESH'];bpy.context.view_layer.update()
allz=[(o.matrix_world@Vector(c)).z for o in ms for c in o.bound_box];z0,z1=min(allz),max(allz)
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=48;sc.cycles.use_denoising=False
sc.render.resolution_x=sc.render.resolution_y=480;sc.view_settings.view_transform='Standard'
w=bpy.data.worlds.new('w');sc.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs[0].default_value=(0.62,0.74,0.58,1);w.node_tree.nodes['Background'].inputs[1].default_value=1.1
sun=bpy.data.objects.new('sun',bpy.data.lights.new('sun','SUN'));sun.data.energy=3.2;sun.rotation_euler=(math.radians(40),math.radians(15),math.radians(-30));sc.collection.objects.link(sun)
cam=bpy.data.objects.new('cam',bpy.data.cameras.new('cam'));sc.collection.objects.link(cam);sc.camera=cam
cam.data.type='ORTHO';cam.data.ortho_scale=(z1-z0)*1.12;cam.location=(0,-10,(z0+z1)/2);cam.rotation_euler=(math.radians(90),0,0)
sc.render.filepath=out;bpy.ops.render.render(write_still=True)
