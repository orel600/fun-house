# Look v2, village stage 2 (Nir approved the "toy" style, 11.11.2026): the smith's and innkeeper's bodies, and the forge yard, market row and gate pieces.
# Usage (from the repo root): blender -b --python tools/blender/build_village.py -- tools/blender art/village-v2/raw
#   needs art/village-v2/raw/rig.json first (node tools/blender/village_v2.js rig), then: node tools/blender/village_v2.js pack
# Style (docs/concept-visual-language.md §1): rounder blocks, not cubes; flat colour blocks with one soft gradient (a palette strip, like KayKit); matte; few big shapes.
# Bodies: every part is rigid on one bone (a toy figure). The object name is "<bone>__<part>" and village_v2.js skins it to that bone of the KayKit skeleton,
#   so all the game's animations play on it. Coordinates below are glTF (y up, the figure faces +z), converted by G().
# Props: built on the ground (z=0 in Blender), the same shape ratios as the KayKit pieces they replace (vPut scales by width), the front faces the camera (glTF +z).
import bpy,bmesh,sys,math,json
from mathutils import Vector,Matrix
pdir,out=sys.argv[-2:]
# ---------- palette: 32 columns of 2 px (tiny file, read with nearest filtering), light at the top, dark at the bottom. Glow columns also go to the glow map ----------
COLS=[  # name, top, middle, bottom, glow
 ('skin',(255,214,170),(240,180,135),(196,130,92),0),('beard',(150,96,60),(112,68,40),(70,42,26),0),
 ('shirtR',(240,110,80),(206,72,56),(150,46,40),0),('leather',(150,104,70),(112,74,48),(70,46,32),0),
 ('soot',(120,118,124),(86,84,92),(52,50,58),0),('boot',(86,64,52),(58,42,36),(34,26,24),0),
 ('iron',(200,208,220),(150,158,172),(96,102,118),0),('gold',(255,226,120),(236,180,70),(196,126,36),0),
 ('cream',(255,250,236),(240,230,206),(204,190,160),0),('green',(130,196,104),(84,158,74),(52,110,52),0),
 ('wood',(222,168,108),(186,128,78),(132,86,52),0),('woodD',(150,100,64),(116,74,46),(78,48,30),0),
 ('stone',(222,220,212),(178,176,170),(126,124,122),0),('roofR',(236,96,82),(200,64,56),(146,40,40),0),
 ('yellow',(255,232,110),(246,200,60),(214,156,30),0),('blue',(120,190,250),(70,140,220),(40,90,170),0),
 ('ember',(255,240,170),(255,170,60),(230,90,30),1),('coal',(70,66,70),(46,44,48),(26,24,28),0),
 ('apple',(250,110,90),(220,60,56),(160,36,40),0),('straw',(242,214,150),(214,180,112),(170,134,76),0),
 ('eye',(40,32,30),(30,24,24),(20,16,16),0),('rosy',(255,170,150),(236,130,120),(206,100,96),0),
 ('lamp',(255,250,220),(255,226,140),(250,186,70),1),('brownH',(196,122,70),(160,90,50),(118,62,36),0)]
NC=32;CW=2;PH=16;COL={c[0]:i for i,c in enumerate(COLS)}
def palette():
    W,H=NC*CW,PH
    for name,glow in (('palette_village.png',0),('palette_village_glow.png',1)):
        im=bpy.data.images.new(name,W,H,alpha=False);px=[0.0]*(W*H*4)
        for c,(n,top,mid,bot,g) in enumerate(COLS):
            for y in range(H):
                t=y/(H-1);a,b,k=(top,mid,t*2) if t<0.5 else (mid,bot,(t-0.5)*2)
                p=[(a[i]+(b[i]-a[i])*k)/255 for i in range(3)]
                if glow and not g:p=[0,0,0]
                # Blender image rows go bottom-up: the top of the column (light) is the last row
                for x in range(c*CW,(c+1)*CW):o=((H-1-y)*W+x)*4;px[o:o+4]=[*p,1]
        im.pixels=px;im.filepath_raw=pdir+'/'+name;im.file_format='PNG';im.save()
def material():
    m=bpy.data.materials.new('lv2_palette');m.use_nodes=True;nt=m.node_tree;b=nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value=1.0;b.inputs['Metallic'].default_value=0.0
    for name,inp in (('palette_village.png','Base Color'),('palette_village_glow.png','Emission Color')):
        tx=nt.nodes.new('ShaderNodeTexImage');tx.image=bpy.data.images.load(pdir+'/'+name);tx.interpolation='Closest'
        nt.links.new(tx.outputs[0],b.inputs[inp])
    b.inputs['Emission Strength'].default_value=1.0
    return m

# ---------- shapes (bmesh, Blender coordinates) ----------
G=lambda x,y,z:Vector((x,-z,y))   # glTF -> Blender
def rbox(c,s,r=0.3,seg=2):
    # rounded box: c centre, s full size (x,y,z), r: how round (part of the smallest side)
    bm=bmesh.new();bmesh.ops.create_cube(bm,size=1.0)
    for v in bm.verts:v.co=Vector((v.co.x*s[0],v.co.y*s[1],v.co.z*s[2]))+c
    bmesh.ops.bevel(bm,geom=list(bm.edges)+list(bm.verts),offset=r*min(s)/2,segments=seg,affect='EDGES',profile=0.5,clamp_overlap=True)
    return bm
def ball(c,r,sc=(1,1,1),seg=6,ring=4):
    bm=bmesh.new();bmesh.ops.create_uvsphere(bm,u_segments=seg,v_segments=ring,radius=1)
    for v in bm.verts:v.co=Vector((v.co.x*r*sc[0],v.co.y*r*sc[1],v.co.z*r*sc[2]))+c
    return bm
def cyl(a,b,r,r2=None,sides=8,bev=0.0):
    # a cylinder from a to b (Blender points), optionally tapered (r2) and with rounded rims (bev: part of r)
    d=b-a;L=d.length;bm=bmesh.new()
    bmesh.ops.create_cone(bm,cap_ends=True,segments=sides,radius1=r,radius2=r if r2 is None else r2,depth=L)
    if bev>0:bmesh.ops.bevel(bm,geom=[e for e in bm.edges if not e.is_wire and len(e.link_faces)==2 and abs(e.calc_face_angle(0))>0.6],offset=bev*min(r,r2 or r),segments=2,affect='EDGES',profile=0.5)
    q=Vector((0,0,1)).rotation_difference(d.normalized());M=Matrix.Translation((a+b)/2)@q.to_matrix().to_4x4()
    bmesh.ops.transform(bm,matrix=M,verts=bm.verts);return bm
def tube(path,r,sides=8):
    bm=bmesh.new();rings=[]
    for i,p in enumerate(path):
        d=(path[min(i+1,len(path)-1)]-path[max(i-1,0)]).normalized();x=d.cross(Vector((0,0,1)) if abs(d.z)<0.9 else Vector((1,0,0))).normalized();y=d.cross(x)
        rings.append([bm.verts.new(p+r*(math.cos(2*math.pi*k/sides)*x+math.sin(2*math.pi*k/sides)*y)) for k in range(sides)])
    for a,b in zip(rings,rings[1:]):
        for k in range(sides):bm.faces.new((a[k],a[(k+1)%sides],b[(k+1)%sides],b[k]))
    bm.faces.new(rings[0][::-1]);bm.faces.new(rings[-1]);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);return bm
def tri_prism(pts,depth_axis,depth):
    # flat triangle (pennant), pts in Blender, thickness along depth_axis
    bm=bmesh.new();h=depth_axis.normalized()*depth/2
    f=[bm.verts.new(p+h) for p in pts];b=[bm.verts.new(p-h) for p in pts]
    bm.faces.new(f);bm.faces.new(b[::-1])
    for i in range(3):j=(i+1)%3;bm.faces.new((f[i],b[i],b[j],f[j]))
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces);return bm

class Model:
    def __init__(s,name,mat):s.name=name;s.mat=mat;s.parts=[]
    def part(s,bm,color,pname='p',vf=None,smooth=True,bone=None):
        nm=(bone+'__' if bone else '')+pname+str(len(s.parts))
        me=bpy.data.meshes.new(nm);bm.to_mesh(me);bm.free()
        o=bpy.data.objects.new(nm,me);bpy.context.collection.objects.link(o);me.materials.append(s.mat)
        zs=[v.co.z for v in me.vertices];z0,z1=min(zs),max(zs)
        f=vf or (lambda co:0.25+0.6*(co.z-z0)/max(z1-z0,1e-4))   # one soft gradient: a bit darker at the bottom of each part
        uv=me.uv_layers.new();u=(COL[color]+0.5)/NC
        for l in me.loops:uv.data[l.index].uv=(u,0.06+0.88*min(1,max(0,f(me.vertices[l.vertex_index].co))))
        for p in me.polygons:p.use_smooth=smooth
        if smooth:
            # smooth only across soft angles: rounded blocks stay rounded, flat faces stay flat
            me.set_sharp_from_angle(angle=math.radians(50)) if hasattr(me,'set_sharp_from_angle') else None
            if hasattr(me,'use_auto_smooth'):me.use_auto_smooth=True;me.auto_smooth_angle=math.radians(50)
        s.parts.append(o);return o
    def export(s,join):
        tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in s.parts)
        bpy.ops.object.select_all(action='DESELECT')
        for o in s.parts:o.select_set(True)
        bpy.context.view_layer.objects.active=s.parts[0]
        if join:bpy.ops.object.join();bpy.context.active_object.name=s.name
        bpy.ops.export_scene.gltf(filepath=f'{out}/{s.name}.glb',use_selection=True,export_format='GLB',export_yup=True,export_apply=True,export_normals=True,export_texcoords=True,export_materials='EXPORT')
        print('BUILT',s.name,'tris',tris)
def fresh(name):
    bpy.ops.wm.read_factory_settings(use_empty=True);return Model(name,material())

# ---------- bodies ----------
RIG=json.load(open(out+'/rig.json'))
H=lambda b:Vector(RIG[b]['head']);T=lambda b:Vector(RIG[b]['tail'])
B=lambda v:G(*v)   # a rig point (glTF) in Blender
def limb(m,bone,r,col,r2=None,start=0.0,end=1.0,sides=8,pname='limb'):
    a,b=H(bone),T(bone);p=a+(b-a)*start;q=a+(b-a)*end
    m.part(cyl(B(p),B(q),r,r2,sides=sides,bev=0.35),col,pname,bone=bone)
def body(name,o):
    # o: the look of one villager. Everything else is the shared toy figure
    m=fresh('npc_'+name);w=o['w']   # w: how broad (1 = normal)
    # legs and boots
    for s in 'lr':
        limb(m,'upperleg.'+s,0.085*w,o['pants'],start=-0.1,end=1.05)
        limb(m,'lowerleg.'+s,0.078*w,o['pants'],0.072*w,start=0.0,end=1.0)
        f=H('foot.'+s);m.part(rbox(G(f.x,0.075,0.03),(0.17*w,0.25,0.15),r=0.7),'boot','boot',bone='foot.'+s)
    # pelvis, belly, chest
    hp=H('hips');m.part(rbox(G(0,0.53,0),(0.42*w,0.30*o['belly'],0.22),r=0.6),o['pants'],'pelvis',bone='hips')
    m.part(rbox(G(0,0.80,0.01*o['belly']),(0.46*w*o['belly'],0.36,0.30*o['belly']),r=0.75),o['shirt'],'belly',bone='spine')
    m.part(rbox(G(0,1.08,0),(0.50*w,0.34,0.30),r=0.7),o['shirt'],'chest',bone='chest')
    # arms: shirt on top, skin (or sleeve) below, mitten hands
    for s,sg in (('l',1),('r',-1)):
        limb(m,'upperarm.'+s,0.078*w,o['sleeve'],0.07*w,start=-0.15,end=1.0)
        limb(m,'lowerarm.'+s,0.07*w,o['fore'],0.064*w,start=0.0,end=1.0)
        if o.get('bracer'):limb(m,'lowerarm.'+s,0.078*w,o['bracer'],start=0.55,end=0.95,pname='bracer')
        h=H('hand.'+s);m.part(ball(B(h+Vector((0.03*sg,-0.02,0))),0.085,(1.0,1.0,0.95)),'skin','hand',bone='hand.'+s)
    # head: a rounded block with dot eyes, a small nose and rosy cheeks
    hy=1.255;hs=o['head']
    m.part(rbox(G(0,hy+hs[1]/2,0),hs,r=0.8,seg=3),'skin','head',bone='head')
    fz=hs[2]/2
    for sx in (-1,1):
        m.part(ball(G(0.075*sx,hy+hs[1]*0.56,fz-0.005),0.03,(1,0.6,1.3),seg=6,ring=4),'eye','eye',bone='head')
        m.part(ball(G(0.13*sx,hy+hs[1]*0.38,fz-0.03),0.04,(1,0.4,0.8),seg=6,ring=4),'rosy','cheek',bone='head')
    m.part(ball(G(0,hy+hs[1]*0.43,fz+0.01),0.04,(1,1,0.9),seg=6,ring=4),'skin','nose',bone='head')
    for f in o['extra']:f(m,hy,hs)
    return m

def smith_extra(m,hy,hs):
    fz=hs[2]/2
    # big square beard and moustache, short dark hair, goggles pushed up on the forehead
    m.part(rbox(G(0,hy+0.07,fz-0.04),(0.36,0.24,0.16),r=0.8),'beard','beard',bone='head')
    m.part(rbox(G(0,hy+hs[1]*0.34,fz+0.02),(0.22,0.06,0.07),r=0.9),'beard','stache',bone='head')
    m.part(rbox(G(0,hy+hs[1]*0.86,-0.02),(hs[0]+0.03,hs[1]*0.32,hs[2]+0.02),r=0.9),'beard','hair',bone='head')
    m.part(rbox(G(0,hy+hs[1]*0.76,0),(hs[0]+0.035,0.045,hs[2]+0.035),r=0.5,seg=1),'leather','band',bone='head')
    for sx in (-1,1):m.part(cyl(G(0.08*sx,hy+hs[1]*0.77,fz),G(0.08*sx,hy+hs[1]*0.77,fz+0.04),0.045,sides=10,bev=0.3),'iron','goggle',bone='head')
    # heavy leather apron over chest and belly, with a pocket
    m.part(rbox(G(0,1.02,0.155),(0.40,0.32,0.05),r=0.5,seg=1),'leather','bib',bone='chest')
    m.part(rbox(G(0,0.70,0.175),(0.44,0.50,0.05),r=0.5,seg=1),'leather','apron',bone='spine')
    m.part(rbox(G(0,0.66,0.205),(0.16,0.10,0.02),r=0.5,seg=1),'woodD','pocket',bone='spine')
    m.part(rbox(G(0,0.955,0),(0.52,0.05,0.32),r=0.5,seg=1),'woodD','belt',bone='spine')
def inn_extra(m,hy,hs):
    fz=hs[2]/2
    # ginger hair with a bun, curled moustache, white apron, green vest, a tankard in the left hand
    m.part(rbox(G(0,hy+hs[1]*0.85,-0.02),(hs[0]+0.03,hs[1]*0.36,hs[2]+0.02),r=0.9),'brownH','hair',bone='head')
    m.part(ball(G(0,hy+hs[1]+0.04,-0.06),0.08,(1,0.8,1)),'brownH','bun',bone='head')
    for sx in (-1,1):m.part(ball(G(0.07*sx,hy+hs[1]*0.33,fz+0.01),0.05,(1.4,0.55,0.7),seg=6,ring=4),'brownH','stache',bone='head')
    for s,x in (('l',1),('r',-1)):m.part(rbox(G(0.16*x,1.06,0.02),(0.13,0.34,0.33),r=0.5,seg=1),'green','vest',bone='chest')
    m.part(rbox(G(0,0.74,0.235),(0.46,0.46,0.05),r=0.5,seg=1),'cream','apron',bone='spine')
    m.part(rbox(G(0,0.97,0.0),(0.60,0.05,0.44),r=0.5,seg=1),'woodD','belt',bone='spine')
    h=H('hand.l');c=G(h.x+0.06,h.y+0.02,h.z+0.13)
    m.part(cyl(c-Vector((0,0,0.08)),c+Vector((0,0,0.09)),0.065,sides=12,bev=0.2),'wood','mug',bone='hand.l')
    m.part(cyl(c+Vector((0,0,0.07)),c+Vector((0,0,0.11)),0.06,sides=12,bev=0.3),'cream','foam',bone='hand.l')
    m.part(cyl(c-Vector((0,0,0.04)),c-Vector((0,0,0.02)),0.07,sides=12),'iron','band',bone='hand.l')

SMITH=dict(w=1.12,belly=1.0,head=(0.40,0.40,0.36),pants='soot',shirt='shirtR',sleeve='shirtR',fore='skin',bracer='leather',extra=[smith_extra])
INN=dict(w=1.05,belly=1.35,head=(0.40,0.40,0.36),pants='woodD',shirt='cream',sleeve='cream',fore='cream',extra=[inn_extra])

# ---------- props (Blender: ground at z=0, front = -y) ----------
def p_barrel():
    m=fresh('barrel');r=0.5;hgt=1.05
    m.part(cyl(Vector((0,0,0.02)),Vector((0,0,hgt)),r*0.88,sides=14,bev=0.3),'wood','staves')
    m.part(cyl(Vector((0,0,hgt*0.3)),Vector((0,0,hgt*0.7)),r,sides=14),'wood','belly')
    for z in (0.16,hgt-0.18):m.part(cyl(Vector((0,0,z-0.04)),Vector((0,0,z+0.04)),r*0.93,sides=14),'iron','band')
    m.part(cyl(Vector((0,0,hgt-0.01)),Vector((0,0,hgt+0.03)),r*0.78,sides=14,bev=0.3),'woodD','lid')
    return m
def p_crate(name='crate',apples=False):
    m=fresh(name);s=1.0
    m.part(rbox(Vector((0,0,s/2)),(s,s,s),r=0.18),'wood','box')
    for y in (-1,1):   # dark corner posts and a plank across the front and back
        for x in (-1,1):m.part(rbox(Vector((x*0.44,y*0.44,s/2)),(0.14,0.14,s+0.02),r=0.5),'woodD','post')
        m.part(rbox(Vector((0,y*0.5,s/2)),(0.8,0.04,0.16),r=0.5,seg=1),'woodD','plank')
    if apples:
        for i,(x,y) in enumerate(((-0.22,-0.2),(0.2,-0.18),(0,0.2),(-0.2,0.18),(0.22,0.2),(0,-0.02))):
            m.part(ball(Vector((x,y,s+0.12+(0.1 if i==5 else 0))),0.17,seg=7,ring=5),'apple' if i%3 else 'green','apple')
    return m
def p_sack():
    m=fresh('sack')
    m.part(ball(Vector((0,0,0.33)),0.5,(0.75,1.0,0.68),seg=12,ring=7),'straw','bag')
    m.part(cyl(Vector((0,0.0,0.6)),Vector((0,0,0.72)),0.13,0.1,sides=10,bev=0.3),'straw','neck')
    m.part(cyl(Vector((0,0,0.62)),Vector((0,0,0.67)),0.14,sides=10),'leather','tie')
    return m
def p_bucket():
    # the forge's coal bucket: glowing embers on top
    m=fresh('bucket')
    m.part(cyl(Vector((0,0,0)),Vector((0,0,0.72)),0.42,0.5,sides=14,bev=0.25),'woodD','pail')
    for z in (0.15,0.6):m.part(cyl(Vector((0,0,z-0.035)),Vector((0,0,z+0.035)),0.44+z*0.11,sides=14),'iron','band')
    for i in range(6):
        a=i*1.05;rr=0.0 if i==0 else 0.26
        m.part(ball(Vector((math.cos(a)*rr,math.sin(a)*rr,0.72)),0.15,(1,1,0.7),seg=6,ring=4),'coal' if i%2 else 'ember','lump',smooth=False)
    return m
def p_rack():
    # the forge yard: an anvil on a stump, with a small rack of blades behind it
    m=fresh('rack')
    for x in (-0.38,0.38):m.part(cyl(Vector((x,0.22,0)),Vector((x,0.22,1.1)),0.06,sides=8,bev=0.3),'woodD','post')
    m.part(cyl(Vector((-0.45,0.22,1.0)),Vector((0.45,0.22,1.0)),0.05,sides=8,bev=0.3),'woodD','bar')
    for i,x in enumerate((-0.22,0.0,0.22)):
        m.part(rbox(Vector((x,0.24,0.55)),(0.09,0.04,0.7),r=0.5),'iron','blade')
        m.part(rbox(Vector((x,0.24,0.95)),(0.2,0.06,0.05),r=0.6),'gold','guard')
        m.part(cyl(Vector((x,0.24,0.97)),Vector((x,0.24,1.12)),0.03,sides=6),'leather','grip')
    m.part(cyl(Vector((0,-0.12,0)),Vector((0,-0.12,0.42)),0.26,0.24,sides=12,bev=0.3),'wood','stump')
    m.part(rbox(Vector((0,-0.12,0.5)),(0.22,0.18,0.16),r=0.4),'iron','waist')
    m.part(rbox(Vector((0.02,-0.12,0.62)),(0.5,0.22,0.12),r=0.4),'iron','face')
    m.part(cyl(Vector((0.26,-0.12,0.62)),Vector((0.42,-0.12,0.62)),0.06,0.015,sides=8),'iron','horn')
    return m
def p_lumber():
    m=fresh('lumber');L=1.0
    for i,(y,z) in enumerate(((-0.17,0.12),(0.0,0.12),(0.17,0.12),(-0.085,0.33),(0.085,0.33))):
        m.part(cyl(Vector((-L/2,y,z)),Vector((L/2,y,z)),0.105,sides=8,bev=0.25),'woodD' if i%2 else 'wood','log')
        for x in (-L/2-0.005,L/2+0.005):m.part(cyl(Vector((x-0.01,y,z)),Vector((x+0.01,y,z)),0.085,sides=8),'straw','ring')
    return m
def p_fence():
    # long along y (like vx_fenceS), height about a quarter of the length
    m=fresh('fence');L=1.15
    for y in (-L/2+0.07,0,L/2-0.07):
        m.part(cyl(Vector((0,y,0)),Vector((0,y,0.27)),0.05,sides=8,bev=0.3),'wood','post')
        m.part(ball(Vector((0,y,0.28)),0.055,seg=6,ring=4),'woodD','cap')
    for z in (0.1,0.2):m.part(rbox(Vector((0,0,z)),(0.045,L-0.06,0.05),r=0.6,seg=1),'wood','rail')
    return m
def p_flag(name,cloth,trim):
    # thin along x, the cloth along y (like vx_flagR/Y): height about the cloth's width
    m=fresh(name)
    m.part(cyl(Vector((0,-0.12,0)),Vector((0,-0.12,1.0)),0.025,sides=8),'woodD','pole')
    m.part(ball(Vector((0,-0.12,1.03)),0.045,seg=6,ring=4),'gold','knob')
    if name=='pennant':
        m.part(tri_prism([Vector((0,-0.1,0.95)),Vector((0,-0.1,0.6)),Vector((0,0.85,0.78))],Vector((1,0,0)),0.03),cloth,'cloth',smooth=False)
        m.part(tri_prism([Vector((0,-0.1,0.85)),Vector((0,-0.1,0.7)),Vector((0,0.4,0.78))],Vector((1,0,0)),0.04),trim,'stripe',smooth=False)
    else:
        m.part(rbox(Vector((0,0.3,0.68)),(0.03,0.78,0.5),r=0.5),cloth,'cloth')
        m.part(ball(Vector((0,0.3,0.68)),0.12,(0.35,1,1),seg=10,ring=7),trim,'badge')
        m.part(rbox(Vector((0,0.3,0.42)),(0.04,0.8,0.05),r=0.5),trim,'hem')
    return m
def p_stall():
    # a market stall: counter, four posts, a striped awning, and produce on the counter. Footprint square like v_tent
    m=fresh('stall');w,d=1.0,0.8
    m.part(rbox(Vector((0,0,0.22)),(w,d*0.7,0.44),r=0.2),'wood','counter')
    m.part(rbox(Vector((0,-0.01,0.46)),(w+0.06,d*0.74,0.05),r=0.5,seg=1),'woodD','top')
    for x in (-w/2+0.04,w/2-0.04):
        for y in (-d/2+0.05,d/2-0.05):m.part(cyl(Vector((x,y,0)),Vector((x,y,0.95 if y<0 else 1.05)),0.035,sides=8),'woodD','post')
    n=6
    for i in range(n):
        x0=-w/2-0.06+(w+0.12)*i/n;x1=x0+(w+0.12)/n
        m.part(rbox(Vector(((x0+x1)/2,0,1.0)),(x1-x0,d+0.16,0.04),r=0.5),'roofR' if i%2==0 else 'cream','stripe')
    for i in range(n):   # scalloped edge at the front
        x=-w/2-0.06+(w+0.12)*(i+0.5)/n;m.part(ball(Vector((x,-d/2-0.08,0.95)),(w+0.12)/n/2,(1,0.3,0.6),seg=6,ring=4),'roofR' if i%2==0 else 'cream','scallop')
    for x,col in ((-0.3,'apple'),(0.0,'yellow'),(0.3,'green')):
        m.part(rbox(Vector((x,-0.08,0.54)),(0.26,0.22,0.12),r=0.4),'woodD','box')
        for k in range(3):m.part(ball(Vector((x-0.07+0.07*k,-0.08,0.63)),0.06,seg=6,ring=4),col,'fruit')
    return m
def p_gate():
    # the village gate: two round stone-and-wood posts, a curved wooden arch with a sign, two warm lanterns. Open between the posts (VILLAGE.gate r)
    m=fresh('gate');X=0.86
    for sx in (-1,1):
        x=sx*X
        m.part(cyl(Vector((x,0,0)),Vector((x,0,0.28)),0.2,0.18,sides=12,bev=0.3),'stone','base')
        m.part(cyl(Vector((x,0,0.26)),Vector((x,0,1.12)),0.12,sides=12,bev=0.2),'wood','post')
        m.part(ball(Vector((x,0,1.18)),0.15,seg=12,ring=8),'roofR','cap')
        m.part(ball(Vector((x,0,1.34)),0.05,seg=6,ring=4),'gold','knob')
        # a lantern hanging from a little arm on the inside of each post
        m.part(cyl(Vector((x,0,0.95)),Vector((x-sx*0.2,0,0.95)),0.02,sides=6),'woodD','arm')
        m.part(rbox(Vector((x-sx*0.2,0,0.84)),(0.09,0.09,0.13),r=0.6),'lamp','lantern')
        m.part(cyl(Vector((x-sx*0.2,0,0.9)),Vector((x-sx*0.2,0,0.94)),0.06,0.03,sides=8),'roofR','lid')
    arc=[Vector((math.sin(t)*X*1.08,0,1.0+math.cos(t)*0.2)) for t in [-1.3+2.6*i/12 for i in range(13)]]
    m.part(tube(arc,0.07,sides=10),'woodD','arch')
    m.part(rbox(Vector((0,-0.03,1.02)),(0.62,0.05,0.2),r=0.5,seg=1),'wood','sign')
    for sx in (-1,1):m.part(cyl(Vector((sx*0.24,-0.03,1.12)),Vector((sx*0.24,-0.03,1.18)),0.012,sides=5),'woodD','rope')
    return m

palette()
for name,o in (('smith',SMITH),('inn',INN)):body(name,o).export(join=False)
for fn in (p_barrel,lambda:p_crate(),lambda:p_crate('crateS',True),p_sack,p_bucket,p_rack,p_lumber,p_fence,
           lambda:p_flag('banner','roofR','gold'),lambda:p_flag('pennant','yellow','roofR'),p_stall,p_gate):fn().export(join=True)
