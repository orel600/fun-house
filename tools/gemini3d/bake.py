"""Bake the 3-view turnaround sheet onto the low-poly mesh as a texture.
Each view is an orthographic projection; per texel we pick views by surface normal and visibility (depth maps)."""
import numpy as np, trimesh, xatlas
from PIL import Image

TEX = 1024
sheet = np.asarray(Image.open('sheet.jpg').convert('RGB')).astype(np.float32)
CROPS = {'front': (68, 992), 'right': (1130, 1555), 'back': (1622, 2544)}

m = trimesh.load('lo.obj', force='mesh')
V, F = m.vertices.astype(np.float64), m.faces
lo, hi = V.min(0), V.max(0)

# per-view: image crop, mask bbox, scale (px per unit)
views = {}
for k, (x0, x1) in CROPS.items():
    img = sheet[:, x0:x1]
    mask = (img.min(2) < 236)
    ys, xs = np.where(mask)
    top, bot, left, right = ys.min(), ys.max(), xs.min(), xs.max()
    s = (bot - top) / (hi[1] - lo[1])
    views[k] = dict(img=img, top=top, s=s, cx=(left + right) / 2)

def to_px(view, P):
    """world points -> (u,v) pixel coords in that view's crop, plus depth toward camera"""
    v = views['right' if view == 'left' else view]
    py = v['top'] + (hi[1] - P[:, 1]) * v['s']
    if view == 'front': h, d = P[:, 0] - (lo[0] + hi[0]) / 2, P[:, 2]
    elif view == 'back': h, d = -(P[:, 0] - (lo[0] + hi[0]) / 2), -P[:, 2]
    elif view == 'right': h, d = P[:, 2] - (lo[2] + hi[2]) / 2, -P[:, 0]     # camera at -x looking +x, screen right = +z
    else: h, d = P[:, 2] - (lo[2] + hi[2]) / 2, P[:, 0]                       # left side: mirrored right image
    px = v['cx'] + h * v['s']
    return px, py, d

# depth maps per view (rasterize the mesh, keep the nearest-to-camera depth per pixel)
DS = 4  # depth map at 1/4 of image resolution
def depth_map(view):
    v = views['right' if view == 'left' else view]
    H, W = v['img'].shape[0] // DS + 2, v['img'].shape[1] // DS + 2
    Z = np.full((H, W), -1e9)
    px, py, d = to_px(view, V); px /= DS; py /= DS
    for f in F:
        x, y, z = px[f], py[f], d[f]
        xa, xb = int(np.floor(x.min())), int(np.ceil(x.max())); ya, yb = int(np.floor(y.min())), int(np.ceil(y.max()))
        if xb < 0 or yb < 0 or xa >= W or ya >= H: continue
        gx, gy = np.meshgrid(np.arange(max(xa, 0), min(xb, W - 1) + 1), np.arange(max(ya, 0), min(yb, H - 1) + 1))
        den = (y[1] - y[2]) * (x[0] - x[2]) + (x[2] - x[1]) * (y[0] - y[2])
        if abs(den) < 1e-9: continue
        a = ((y[1] - y[2]) * (gx - x[2]) + (x[2] - x[1]) * (gy - y[2])) / den
        b = ((y[2] - y[0]) * (gx - x[2]) + (x[0] - x[2]) * (gy - y[2])) / den
        c = 1 - a - b
        ins = (a >= -0.01) & (b >= -0.01) & (c >= -0.01)
        zz = a * z[0] + b * z[1] + c * z[2]
        sub = Z[gy[ins], gx[ins]]
        Z[gy[ins], gx[ins]] = np.maximum(sub, zz[ins])
    return Z
DEPTH = {k: depth_map(k) for k in ['front', 'back', 'right', 'left']}

# UV unwrap
vmap, idx, uvs = xatlas.parametrize(V.astype(np.float32), F.astype(np.uint32))
V2, N2 = V[vmap], m.vertex_normals[vmap]

# rasterize UV triangles -> per-texel 3D position + normal
pos = np.zeros((TEX, TEX, 3)); nor = np.zeros((TEX, TEX, 3)); cov = np.zeros((TEX, TEX), bool)
U = uvs * (TEX - 1)
for f in idx:
    x, y = U[f, 0], (TEX - 1) - U[f, 1]
    xa, xb = int(np.floor(x.min())), int(np.ceil(x.max())); ya, yb = int(np.floor(y.min())), int(np.ceil(y.max()))
    gx, gy = np.meshgrid(np.arange(max(xa, 0), min(xb, TEX - 1) + 1), np.arange(max(ya, 0), min(yb, TEX - 1) + 1))
    den = (y[1] - y[2]) * (x[0] - x[2]) + (x[2] - x[1]) * (y[0] - y[2])
    if abs(den) < 1e-12: continue
    a = ((y[1] - y[2]) * (gx - x[2]) + (x[2] - x[1]) * (gy - y[2])) / den
    b = ((y[2] - y[0]) * (gx - x[2]) + (x[0] - x[2]) * (gy - y[2])) / den
    c = 1 - a - b
    ins = (a >= -0.02) & (b >= -0.02) & (c >= -0.02)
    w = np.stack([a[ins], b[ins], c[ins]], 1)
    pos[gy[ins], gx[ins]] = w @ V2[f]; nor[gy[ins], gx[ins]] = w @ N2[f]; cov[gy[ins], gx[ins]] = True

P = pos[cov]; Nn = nor[cov]; Nn /= np.linalg.norm(Nn, axis=1, keepdims=True) + 1e-9
DIRS = {'front': np.array([0, 0, 1]), 'back': np.array([0, 0, -1]), 'right': np.array([-1, 0, 0]), 'left': np.array([1, 0, 0])}
acc = np.zeros((len(P), 3)); wsum = np.zeros(len(P))
for k, dvec in DIRS.items():
    px, py, d = to_px(k, P)
    img = views['right' if k == 'left' else k]['img']
    Zm = DEPTH[k]
    zi = Zm[np.clip((py / DS).astype(int), 0, Zm.shape[0] - 1), np.clip((px / DS).astype(int), 0, Zm.shape[1] - 1)]
    vis = d >= zi - 0.03 * (hi[1] - lo[1])
    w = np.clip(Nn @ dvec, 0, 1) ** 4 * vis
    if k == 'left': w *= 0.9   # mirrored image: slightly less trusted
    col = img[np.clip(py.astype(int), 0, img.shape[0] - 1), np.clip(px.astype(int), 0, img.shape[1] - 1)]
    w = w * (col.min(1) < 232)   # a sample that hit the white background is not the character
    acc += col * w[:, None]; wsum += w
col = acc / np.maximum(wsum, 1e-6)[:, None]
# texels no view sees well: nearest-color fill from neighbours later; for now use front sample
miss = wsum < 1e-3
print('texels', len(P), 'unseen', int(miss.sum()))
# texels no view saw: take the colour of the nearest texel (in 3D) that a view did see
from scipy.spatial import cKDTree
from scipy import ndimage
seen = ~miss
col[miss] = col[seen][cKDTree(P[seen]).query(P[miss])[1]]
tex = np.zeros((TEX, TEX, 3)); tex[cov] = col
# bleed colours past the UV island edges so texture filtering never samples empty space
good = cov.copy()
for _ in range(16):
    blur = np.stack([ndimage.uniform_filter(tex[..., i] * good, 3) for i in range(3)], -1)
    cnt = ndimage.uniform_filter(good.astype(float), 3)
    upd = (~good) & (cnt > 0)
    tex[upd] = blur[upd] / cnt[upd, None]; good |= upd
Image.fromarray(np.clip(tex, 0, 255).astype(np.uint8)).save('tex.png')

out = trimesh.Trimesh(V2, idx, process=False, visual=trimesh.visual.TextureVisuals(uv=uvs, image=Image.open('tex.png')))
out.export('blacksmith_static.glb')
print('saved', len(idx), 'faces')
