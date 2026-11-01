# מלביש מודל חדש מ-TRELLIS (בלי שלד) על השלד של מודל קיים שכבר עובד במשחק.
# כל נקודה במודל החדש מקבלת את המשקלים (איזו עצם מזיזה אותה) מארבע הנקודות הקרובות במודל הישן, ולכן כל האנימציות שעבדו ממשיכות לעבוד.
# שימוש: python reskin.py <ישן.glb> <חדש-מ-TRELLIS.glb> <יוצא.glb> [סיבוב]
#   --color: TRELLIS יוצא לפעמים כהה מהציור (הפרעוש: פי 2). מתקן את הטקסטורה כך שהצבע האמצעי שלה יהיה כמו של הישן, בעקומה (גמא) ולא בהכפלה, אז הלבן של העיניים נשאר לבן
#   סיבוב (0/90/180/270) קובע את הכיוון ביד. ליצור עגול (הפרעוש) הצבעים דומים מכל צד, ו-TRELLIS תמיד מוציא פנים קדימה, אז 0
#   הגודל: המודל החדש נמתח לקופסה של הישן בכל ציר בנפרד (TRELLIS רואה רק מלפנים, ולכן לפעמים יוצא שטוח מהצד).
#   הכיוון: מנסים ארבעה סיבובים, ובוחרים את זה שהצבעים שלו הכי דומים לישן (פנים מול פנים).
#   השם של הגוף והחומר נשארים של הישן, כך ש-build3d.js מוצא אותו לפי keep.
import sys, io, struct, numpy as np, pygltflib
from PIL import Image
from scipy.spatial import cKDTree

def acc(g, i):
    a = g.accessors[i]; bv = g.bufferViews[a.bufferView]; blob = g.binary_blob()
    dt = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}[a.componentType]
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a.type]
    st = bv.byteStride or n * np.dtype(dt).itemsize
    off = (bv.byteOffset or 0) + (a.byteOffset or 0)
    raw = np.frombuffer(blob, np.uint8, count=st * (a.count - 1) + n * np.dtype(dt).itemsize, offset=off)
    out = np.lib.stride_tricks.as_strided(raw, (a.count, n * np.dtype(dt).itemsize), (st, 1)).copy().view(dt).reshape(a.count, n)
    if a.normalized and dt != np.float32: out = out.astype(np.float32) / np.iinfo(dt).max
    return out

def image(g, prim):
    m = g.materials[prim.material]; t = g.textures[m.pbrMetallicRoughness.baseColorTexture.index]
    im = g.images[t.source]; bv = g.bufferViews[im.bufferView]; o = bv.byteOffset or 0
    return Image.open(io.BytesIO(g.binary_blob()[o:o + bv.byteLength])).convert('RGB'), t.source

def sample(img, uv):
    a = np.asarray(img, np.float32); h, w = a.shape[:2]
    x = np.clip((uv[:, 0] % 1) * (w - 1), 0, w - 1).astype(int); y = np.clip((uv[:, 1] % 1) * (h - 1), 0, h - 1).astype(int)
    return a[y, x]

fix = '--color' in sys.argv; sys.argv = [a for a in sys.argv if a != '--color']
old_f, new_f, out_f = sys.argv[1:4]
G = pygltflib.GLTF2().load(old_f); N = pygltflib.GLTF2().load(new_f)
gp = G.meshes[0].primitives[0]; npm = N.meshes[0].primitives[0]
oP = acc(G, gp.attributes.POSITION); oJ = acc(G, gp.attributes.JOINTS_0); oW = acc(G, gp.attributes.WEIGHTS_0)
oC = sample(image(G, gp)[0], acc(G, gp.attributes.TEXCOORD_0))
nP = acc(N, npm.attributes.POSITION); nUV = acc(N, npm.attributes.TEXCOORD_0); nI = acc(N, npm.indices).reshape(-1, 3)
nImg = image(N, npm)[0]; nC = sample(nImg, nUV)
if fix:
    om, nm = np.median(oC, 0) / 255, np.median(nC, 0) / 255; gam = np.log(om) / np.log(nm)
    print('color fix, gamma per channel', gam.round(2))
    a = np.asarray(nImg, np.float32) / 255; nImg = Image.fromarray((255 * a ** gam).clip(0, 255).astype(np.uint8)); nC = sample(nImg, nUV)
lo, hi = oP.min(0), oP.max(0); tree = cKDTree(oP)

def fit(rot):
    c, s = np.cos(rot), np.sin(rot)
    p = nP @ np.array([[c, 0, -s], [0, 1, 0], [s, 0, c]], np.float32).T
    a, b = p.min(0), p.max(0)
    return lo + (p - a) / (b - a) * (hi - lo)

best = None
for k in range(4):
    p = fit(k * np.pi / 2); d, i = tree.query(p)
    score = np.abs(oC[i] - nC).mean()
    print('rotation', k * 90, 'color diff', round(float(score), 1))
    if best is None or score < best[0]: best = (score, k, p)
_, k, P = best
if len(sys.argv) > 4: k = int(sys.argv[4]) // 90; P = fit(k * np.pi / 2)
print('chosen', k * 90)

# משקלים: ארבע השכנות הקרובות, לפי מרחק. מאחדים לפי עצם ומשאירים את ארבע החזקות
d, idx = tree.query(P, k=4); w = 1 / (d + 1e-4); w /= w.sum(1, keepdims=True)
J = np.zeros((len(P), 4), np.uint16); W = np.zeros((len(P), 4), np.float32)
for v in range(len(P)):
    acc_ = {}
    for n in range(4):
        for j, ww in zip(oJ[idx[v, n]], oW[idx[v, n]]):
            if ww > 0: acc_[int(j)] = acc_.get(int(j), 0) + ww * w[v, n]
    top = sorted(acc_.items(), key=lambda t: -t[1])[:4]; s = sum(t[1] for t in top)
    for n, (j, ww) in enumerate(top): J[v, n] = j; W[v, n] = ww / s

# נורמלים חלקים
f = nI; fn = np.cross(P[f[:, 1]] - P[f[:, 0]], P[f[:, 2]] - P[f[:, 0]])
Nm = np.zeros_like(P)
for c in range(3): np.add.at(Nm, f[:, c], fn)
Nm /= np.linalg.norm(Nm, axis=1, keepdims=True) + 1e-9

# כותבים: אותו קובץ ישן, עם גוף וטקסטורה חדשים בסוף ה-buffer
blob = bytearray(G.binary_blob())
def add(arr, ctype, typ, target=None, minmax=False):
    while len(blob) % 4: blob.append(0)
    off = len(blob); b = arr.tobytes(); blob.extend(b)
    G.bufferViews.append(pygltflib.BufferView(buffer=0, byteOffset=off, byteLength=len(b), target=target))
    a = pygltflib.Accessor(bufferView=len(G.bufferViews) - 1, componentType=ctype, count=len(arr), type=typ)
    if minmax: a.min = arr.min(0).tolist(); a.max = arr.max(0).tolist()
    G.accessors.append(a); return len(G.accessors) - 1
gp.attributes.POSITION = add(P.astype(np.float32), 5126, 'VEC3', 34962, True)
gp.attributes.NORMAL = add(Nm.astype(np.float32), 5126, 'VEC3', 34962)
gp.attributes.TEXCOORD_0 = add(nUV.astype(np.float32), 5126, 'VEC2', 34962)
gp.attributes.JOINTS_0 = add(J, 5123, 'VEC4', 34962)
gp.attributes.WEIGHTS_0 = add(W, 5126, 'VEC4', 34962)
gp.indices = add(nI.reshape(-1).astype(np.uint32), 5125, 'SCALAR', 34963)
png = io.BytesIO(); nImg.save(png, 'PNG'); png = png.getvalue()
while len(blob) % 4: blob.append(0)
off = len(blob); blob.extend(png)
G.bufferViews.append(pygltflib.BufferView(buffer=0, byteOffset=off, byteLength=len(png)))
src = image(G, gp)[1]; G.images[src].bufferView = len(G.bufferViews) - 1; G.images[src].mimeType = 'image/png'
G.materials[gp.material].doubleSided = True   # המצלמה מלמעלה רואה לתוך הברדס: בלי זה רואים דרכו את הדשא
G.buffers[0].byteLength = len(blob); G.set_binary_blob(bytes(blob)); G.save_binary(out_f)
print('saved', out_f, len(P), 'verts', len(nI), 'tris')
