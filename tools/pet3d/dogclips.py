# האנימציות של החיה: כל האנימציות של ההאסקי (Quaternius, CC0) בשמות dog_*, ועוד שתיים שאין בחבילה: ישיבה (Sit) וחפירה (Dig)
# python dogclips.py   (קורא את C:/kk/dog/Husky.glb, כותב את C:/kk/dog/DogAnims.glb, ש-tools/build3d.js אורז)
# הישיבה והחפירה בנויות מתנוחת הבסיס: לכל עצם סיבוב בעולם (סביב x: קדימה-אחורה, סביב y: ימינה-שמאלה), שמתורגם לסיבוב המקומי שלה.
# הסיבוב של עצם מצטרף לסיבוב של ההורה, כמו בגוף: הגב מתרומם, ורגל קדמית שמסתובבת בחזרה נשארת זקופה
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..','pilot3d'))
import numpy as np,pygltflib
from scipy.spatial.transform import Rotation as Rot
from gl import acc,worlds
SRC='C:/kk/dog/Husky.glb';OUT='C:/kk/dog/DogAnims.glb'
g=pygltflib.GLTF2().load(SRC);W0,par=worlds(g);ix={n.name:i for i,n in enumerate(g.nodes)}
def rest_world_rot(i):R=W0[i][:3,:3];return R/np.linalg.norm(R[:,0])
def local_q(name,deg_x=0,deg_y=0,deg_z=0):
    i=ix[name];Rw=rest_world_rot(i);D=Rot.from_euler('xyz',[deg_x,deg_y,deg_z],degrees=True).as_matrix()
    Lr=Rot.from_quat(g.nodes[i].rotation or [0,0,0,1]).as_matrix()
    return Rot.from_matrix(Lr@np.linalg.inv(Rw)@D@Rw).as_quat()
BODY=np.array(g.nodes[ix['Body']].translation)
def body_t(down):   # Body נע מטה בעולם: בשלד (מסובב ובקנה מידה 100) זה ציר z המקומי של ההורה
    t=BODY.copy();t[2]-=down/100;return t
# תנוחות: {עצם:(x,y,z) במעלות}. 'down': כמה Body יורד
SIT={'down':1.05,'Back':(-36,0,0),'Torso':(0,0,0),'FrontShoulder.L':(30,0,0),'FrontShoulder.R':(30,0,0),'FrontLowerLeg.L':(6,0,0),'FrontLowerLeg.R':(6,0,0),
     'Neck1':(14,0,0),'Head':(10,0,0),'BackLeg.L':(-40,0,0),'BackLeg.R':(-40,0,0),'BackUpperLeg.L':(0,0,0),'BackUpperLeg.R':(0,0,0),'BackLowerLeg.L':(0,0,0),'BackLowerLeg.R':(0,0,0),
     'Tail1':(0,0,0)}
def sit(t):   # כשכשת זנב קלה וראש שזז קצת
    p=dict(SIT);w=np.sin(t*2*np.pi*1.5)
    p['Tail2']=(0,22*w,0);p['Tail3']=(0,14*w,0);p['Head']=(10+3*np.sin(t*2*np.pi*0.5),0,0);return p
def dig(t):   # הרגליים הקדמיות חופרות לסירוגין, הראש נמוך, הזנב מכשכש מהר
    a=np.sin(t*2*np.pi*3.3);b=np.sin(t*2*np.pi*3.3+np.pi);w=np.sin(t*2*np.pi*4)
    return {'down':0.25,'Back':(12,0,0),'Neck1':(22,0,0),'Head':(18,0,0),
            'FrontUpperLeg.L':(-28+38*a,0,0),'FrontUpperLeg.R':(-28+38*b,0,0),'FrontLowerLeg.L':(30+30*max(0,a),0,0),'FrontLowerLeg.R':(30+30*max(0,b),0,0),
            'BackLeg.L':(-10,0,0),'BackLeg.R':(-10,0,0),'BackUpperLeg.L':(18,0,0),'BackUpperLeg.R':(18,0,0),'Tail2':(0,25*w,0),'Tail3':(0,18*w,0)}
BONES=sorted({k for p in (sit(0),dig(0)) for k in p if k!='down'})
blob=bytearray(g.binary_blob())
def push(arr):
    while len(blob)%4:blob.append(0)
    off=len(blob);blob.extend(arr.tobytes());g.bufferViews.append(pygltflib.BufferView(buffer=0,byteOffset=off,byteLength=arr.nbytes));return len(g.bufferViews)-1
def accessor(arr,typ,mm=False):
    a=pygltflib.Accessor(bufferView=push(arr),componentType=5126,count=len(arr),type=typ)
    if mm:a.min=[float(arr.min())];a.max=[float(arr.max())]
    g.accessors.append(a);return len(g.accessors)-1
def make(name,fn,dur,n):
    ts=np.linspace(0,dur,n).astype(np.float32);an=pygltflib.Animation(name=name,channels=[],samplers=[]);ti=accessor(ts.reshape(-1,1),'SCALAR',True)
    poses=[fn(t) for t in ts]
    for b in BONES:
        q=np.array([local_q(b,*p.get(b,(0,0,0))) for p in poses],np.float32)
        an.samplers.append(pygltflib.AnimationSampler(input=ti,output=accessor(q,'VEC4')));an.channels.append(pygltflib.AnimationChannel(sampler=len(an.samplers)-1,target=pygltflib.AnimationChannelTarget(node=ix[b],path='rotation')))
    tr=np.array([body_t(p['down']) for p in poses],np.float32)
    an.samplers.append(pygltflib.AnimationSampler(input=ti,output=accessor(tr,'VEC3')));an.channels.append(pygltflib.AnimationChannel(sampler=len(an.samplers)-1,target=pygltflib.AnimationChannelTarget(node=ix['Body'],path='translation')))
    g.animations.append(an)
g.animations=[a for a in g.animations if '|' not in a.name]   # כפילויות בשם AnimalArmature|...
for a in g.animations:a.name='dog_'+a.name
make('dog_Sit',sit,2.0,21);make('dog_Dig',dig,0.9,19)
g.buffers[0].byteLength=len(blob);g.set_binary_blob(bytes(blob));g.save_binary(OUT);print('wrote',OUT,[a.name for a in g.animations])
