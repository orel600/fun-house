# Arena backdrops (ARI, 9.11.2026)

Three painted skies from Orel's correction pack, downscaled to 1024x439 webp (the originals are 1916x821, not 1638x701 as the brief said):

| File | Bytes | Mean brightness (0-1) |
|---|---|---|
| arena-backdrop-sky-classic.webp | 14,550 | 0.171 |
| arena-backdrop-sky-waves.webp | 9,998 | 0.145 |
| arena-backdrop-sky-dimension.webp | 29,818 | 0.382 |

**Dim multiplier:** `dimension` is about 2.5x brighter than the other two. A multiplier of **0.5** brings it to the same level (0.19); the brief's 0.6 gives 0.23, still clearly brighter. Suggest 0.5-0.55, then judge in a 3D shot.

**file:// finding (important for wiring):** a WebGL texture made from an image **file** fails from `file://` with `SecurityError` (tested in headless Chromium, both the image and a canvas it was drawn on). A `data:` URL works. So `THREE.TextureLoader().load('art/backdrop/x.png')` from the brief's snippet would fail when the game is opened from a file. `js/backdrop-data.js` (built by `tools/backdrop-build.py`, 71 KB) holds `BACKDROP = {classic, waves, dimension}` as data URLs: load them with `new Image()` or `TextureLoader.load(BACKDROP.classic)`. Not added to `index.html` (BOB wires it, with the preload and the fxLess skip).
