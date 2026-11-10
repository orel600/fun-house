# שימוש: blender -b --python to_game.py -- <raw.glb> tools/blender <out.glb> 600
# Hunyuan3D raw -> game budget: straighten, decimate, flat shade, colour from our palette by height zones, export glb
import bpy,bmesh,sys,math
import numpy as np
from mathutils import Vector,Matrix
src,pdir,out,target=sys.argv[-4:];target=int(target)
COL={n:i for i,n in enumerate('iron darkiron bone gold leather purple blue red sky navy violet glowc glowy white pink deep oak leaf stone moss rune'.split())};NC=32
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
ob=[o for o in bpy.context.scene.objects if o.type=='MESH'][0];bpy.context.view_layer.objects.active=ob;ob.select_set(True)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
me=ob.data;V=np.array([v.co[:] for v in me.vertices]);N=np.array([v.normal[:] for v in me.vertices])
# 1. straighten: the band's normals are perpendicular to the ring axis -> axis = least-variance direction of normals in the lower 40%
z=V[:,2];low=z<z.min()+0.4*(z.max()-z.min());w,e=np.linalg.eigh(np.cov(N[low].T));ax=Vector(e[:,0]).normalized()
if ax.z<0:ax=-ax
R=ax.rotation_difference(Vector((0,0,1))).to_matrix().to_4x4();me.transform(R)
V=np.array([v.co[:] for v in me.vertices]);c=(V.min(0)+V.max(0))/2;c[2]=V[:,2].min()
me.transform(Matrix.Translation(Vector(-c)));W=V.max(0)-V.min(0);me.transform(Matrix.Scale(1/max(W[0],W[1]),4))
print('AXIS',[round(x,3) for x in ax],'tilt deg',round(math.degrees(ax.angle(Vector((0,0,1)))),1))
# 2. decimate
raw=len(me.polygons);m=ob.modifiers.new('d','DECIMATE');m.ratio=min(1,target/raw);bpy.ops.object.modifier_apply(modifier='d')
bm=bmesh.new();bm.from_mesh(me);bmesh.ops.triangulate(bm,faces=bm.faces);bm.to_mesh(me);bm.free()
# 3. colour by height zones (fractions of total height, read off the 3/4 picture)
mat=bpy.data.materials.new('own_palette');mat.use_nodes=True;nt=mat.node_tree;b=nt.nodes['Principled BSDF'];b.inputs['Roughness'].default_value=0.9
for name,inp in (('palette_weapons.png','Base Color'),('palette_weapons_glow.png','Emission Color')):
    tx=nt.nodes.new('ShaderNodeTexImage');tx.image=bpy.data.images.load(pdir+'/'+name);tx.interpolation='Closest';nt.links.new(tx.outputs[0],b.inputs[inp])
b.inputs['Emission Strength'].default_value=1.0;me.materials.clear();me.materials.append(mat)
# zones relative to the local top (per angle bin around the ring), so a short spike still gets its own flame
NB=48;ang=lambda co:int((math.atan2(co.y,co.x)+math.pi)/(2*math.pi)*NB)%NB
top=[0.0]*NB
for v in me.vertices:
    k=ang(v.co);top[k]=max(top[k],v.co.z)
top=[max(top[(k+d)%NB] for d in (-1,0,1)) for k in range(NB)]
BAND=0.40*max(top);ZONES=[(0.42,'violet'),(0.62,'gold'),(1.01,'pink')]   # above the band: spike, cup, flame
uv=me.uv_layers.new();cnt={}
for p in me.polygons:
    z=p.center.z;t=top[ang(p.center)]
    col='purple' if z<BAND else next(cn for lim,cn in ZONES if (z-BAND)/max(t-BAND,1e-4)<lim)
    cnt[col]=cnt.get(col,0)+1;u=(COL[col]+0.5)/NC;p.use_smooth=False
    for li in p.loop_indices:
        vz=me.vertices[me.loops[li].vertex_index].co.z/max(top);uv.data[li].uv=(u,0.08+0.84*min(1,max(0,vz)))
print('COLOURS',cnt)
bpy.ops.export_scene.gltf(filepath=out,use_selection=True,export_format='GLB',export_normals=True)
print('DONE raw',raw,'tris',len(me.polygons),'size',[round(x,2) for x in ob.dimensions])
