# Research: glowing orbit wisps, ground loot, floating text (mobile HTML5, three.js + 2D canvas)

Date: 2026-11-01. Claims carry a source URL. Lines marked **(synthesis)** are our own conclusions from the sources plus common VFX practice, not a quote.
Caveat: developers have published little about how specific games build their wisps (Ori, Hollow Knight, Hades). Most game references below come from wikis or press, so they describe **what** players see, not **how** it was built.

## 1. Glowing orbiting wisps: techniques

### Glow = additive sprite with a soft radial gradient
- Standard three.js recipe: `THREE.Sprite` + `SpriteMaterial` with a soft radial-gradient map, `transparent:true`, `blending:THREE.AdditiveBlending`, `depthWrite:false`. Additive adds light to the scene behind instead of covering it. https://ics.media/en/entry/11401/ , https://deepwiki.com/stemkoski/stemkoski.github.com/2.8-visual-effects
- `depthWrite:false` keeps depth testing on but stops the sprite writing depth, so things behind still show through its transparent edge. https://ics.media/en/entry/11401/
- "Glow without BloomPass" (three.js forum): a camera-facing plane with a radial gradient (texture, SDF or shader), additive, depthTest off. https://discourse.threejs.org/t/glow-without-bloompass/88503
- Use a grayscale, soft, semi-transparent texture and tint it with the material color, so one texture serves all five elements. https://discourse.threejs.org/t/how-to-make-transparent-texture-light-effect/37067.md
- Defaults to override: `blending` is `NormalBlending`, and `depthWrite`/`depthTest` are true. `sizeAttenuation` (Sprite/Points) defaults to true, so sprites shrink with distance. https://threejs.org/docs/#api/en/materials/SpriteMaterial

### Bloom: fake it, avoid UnrealBloomPass on phones
- UnrealBloomPass reports: about 20 fps in the official example on desktop Safari unless the canvas is shrunk https://discourse.threejs.org/t/unrealbloompass-poor-performance-on-macos-safari-with-intel/42606 ; "bloom on one object killed the performance" https://discourse.threejs.org/t/unreal-bloom-optimize/35476 ; selective bloom drops frames, and the suggested workaround is emissive or per-material glow https://discourse.threejs.org/t/bloom-selective-animate-performance/34783.md
- **(synthesis)** For our mobile 3D layer: no post-processing. The "HDR" look comes from 2 to 3 stacked additive sprites per orb: a small near-white core, a mid halo in the element color, and a large faint halo. Overlapping additive sprites push toward white the way bloom does.

### Hot white core + saturated colored edge
- Fire ramp: a near-white core, then yellow, orange and deep red at the edge. Without the near-white center, fire "reads as an orange blob". https://realtimevfx.com/t/about-fire-from-infernal-velkoz/13491 , https://help.autodesk.com/cloudhelp/2015/ENU/MAXScript-Help/files/GUID-B5EAA194-68BB-4E34-9350-9A3073A486D3.htm
- Values pushed too far converge to white and wash out the color. Keep saturation in the outer halo. https://realtimevfx.com/t/vfx-graph-color-intensity-become-white-only/21679
- Orb critiques on RealtimeVFX: an off-center core, jagged smoke that dies too quickly, and a static core all read as bad. Animate the core. https://realtimevfx.com/t/overwatch-moira-biotic-orb-recreation-attempt/4640
- Wisp sketch (blue wisp with trail and impact flare): https://realtimevfx.com/t/chris-nordgren-sketch-2-wip-wisp-portal/1248

### Trails
- A ribbon trail is a strip of camera-facing triangles (MeshLine). The simplest "follow" trail keeps a short array of points, lerps each toward the previous point every frame, then calls `setPositions`. https://github.com/spite/THREE.MeshLine , https://meshlines-docs.netlify.app/examples/follow
- Taper the width with an attenuation function (drei `<Trail>` exposes width, stride and attenuation). https://drei.docs.pmnd.rs/abstractions/trail
- Trail look: a gradient along the length plus some size variation. https://realtimevfx.com/t/orson-favrel-vfx-sketchbook/22082
- **(synthesis)** At wisp scale on a phone, draw the trail in the 2D canvas as 5 to 8 fading copies of the cached glow sprite at past positions. That is cheaper than MeshLine and needs no new library.

### Organic motion
- Noise-driven heading: sample Perlin noise at the position, turn it into an angle, step along cos/sin. Continuous noise makes paths converge, so give each agent its own seed or offset. https://gist.github.com/erlenstar/4b8689c9df275885a6c8
- **(synthesis)** Per orb: a base angle `a += w_i*dt` with a different `w_i` for each orb, radius `r_i + A*sin(t*f_i)` (breathing), height bob `h + B*sin(t*g_i + phase_i)`, and a small noise jitter. The position spring-follows the hero with a lag of about 0.1 to 0.2 s, so the orbs trail behind when the hero runs. Flicker = alpha/scale `1 + 0.08*noise(t*6)`. Mixing incommensurate frequencies (Lissajous) keeps the pattern from visibly repeating.

## 2. Game references: how effect is communicated without icons
- **Ori, Sein:** a small creature of "blue and white light" that is both guide and weapon. Its shots are light-based, and Ori moves with "a trail of light". It reads as white core plus blue tint plus trail. https://www.cubed3.com/games/reviews/nintendo-switch/ori-and-the-blind-forest-definitive-edition , https://www.thesixthaxis.com/2014/10/22/deep-into-the-woods-with-ori-and-the-blind-forest/ . Moon Studios hand-painted light masks on every asset: https://www.thegamer.com/ori-and-the-will-of-the-wisps-artists-hand-painted-30000-light-maps/ . Their GDC art talk: https://gdcvault.com/play/1027035/The-Art-of-Ori-and
- **Hollow Knight:** the Lumafly Lantern is a cluster of glowing flies that lights the area around the Knight https://hollowknight.wiki/w/Lumafly_Lantern . Its particles are random and rotate freely as they fall, layered over hand-drawn art https://pcgamer.com/hollow-knights-charming-art-sets-the-bar-for-hand-drawn-games
- **Vampire Survivors:** King Bible orbits the player, and more levels add more bibles https://vampire.survivors.wiki/w/King_Bible . Peachone "bombards in a circling zone" https://vampire.survivors.wiki/w/Peachone . Counter-lesson: the screen gets so busy that players ask to hide weapon VFX, and a community "No Particles" mod exists https://steamcommunity.com/app/1794680/discussions/0/4631482569784862180 , https://www.familygamingdatabase.com/accessibility/Vampire+Survivors
- **Brotato:** offers a particle quality setting and a toggle for damage numbers, because numbers add a lot of clutter https://www.ludo.guide/guide/brotato/getting-started/controls-keybindings/accessibility-options ; **Halls of Torment / Soulstone Survivors:** players ask for, or cite, an effect-opacity slider https://steamcommunity.com/app/2218750/discussions/0/3801652929323026410
- **Genshin Impact:** element = color. Particles and orbs are tinted the element's color, and size encodes value (an orb is worth about 3 particles). https://genshin-impact.fandom.com/wiki/Elemental_Particles
- **Hades:** each god's boon gives a distinct visual signature (Zeus lightning, Poseidon waves). https://80.lv/articles/a-behind-the-scenes-look-at-the-effects-in-hades/ . No primary Supergiant readability talk was found. A general GDC talk on stylized VFX art direction: https://gdcvault.com/play/1023999/Art-Directing-VFX-for-Stylized . Artistic principles bootcamp: https://www.gdcvault.com/play/1024439/Visual-Effects-Bootcamp-Artistic-Principles
- No usable sources were found for Diablo Immortal/D4 orbit effects, PoE orbits or Soulstone orbit visuals.
- **(synthesis) Mapping for our 5 orbs, no icons:**
  - Fire: orange halo, white-yellow core, embers that rise and drift up. Flares on hit.
  - Ice: pale cyan, a crisper and smaller halo, slower motion, tiny flakes that fall. Frost puff on slow.
  - Stone: earth-amber, dense with a slow pulse. Ready = full brightness with a faint ring. Spent = dim and small, no halo, and it refills to brightness over 8 s. Break burst on block.
  - Leaf: green, a soft "breath" pulse on the 4 s cycle. At heal, a green ring expands from the hero, and 1 to 2 small leaves fall.
  - Clover: gold-green with an occasional twinkle star glint. On a crit or bonus loot, a gold sparkle burst.
  - Rule: shape of the shed particle plus its motion direction (up / down / still / falling-leaf / twinkle) separates elements even for colorblind players.

## 3. Loot on the ground
- Beams by rarity are a quick read of value at a distance (Diablo, Borderlands). https://www.minecraft-guides.com/mod/loot-beams/ . Borderlands tiers: white, green, blue, purple, orange https://twinfinite.net/guides/borderlands-3-tips-and-tricks-for-beginners/2/ . Borderlands 2 added a colorblind beam palette https://www.shacknews.com/article/82849/borderlands-2-recieving-a-colorblind-mode . Rarity colors trace back to Diablo https://gameinformer.com/2019/05/18/the-surprising-origins-of-loot-rarity-colors
- D4: a light pillar plus a sound cue for uniques creates a "Pavlovian" response, and Uber Uniques got their own purple beam plus a unique sound so they are never missed. https://www.icy-veins.com/d4/news/uber-uniques-need-far-more-distinction-in-diablo-4/
- PoE filter practice: restraint. "Save large text, bright colors, and loud sounds for drops that change your next action." Beam, minimap icon and sound are layered by tier. https://jeu.video/en/guide/path-of-exile-2-loot-filter-visibility-performance-controller , https://www.poewiki.net/wiki/Loot_filter
- Magnet/vacuum: Vampire Survivors has a pickup-radius stat (Magnet) and the Attractorb. Past 400 gems on the floor, extra XP merges into one red gem. https://vampire.survivors.wiki/w/Magnet , https://vampire-survivors.fandom.com/wiki/Experience_Gem . Starship Survivors uses a layered pull: snap at about 20 px, quadratic pull inside the magnet range https://starship-survivors-wiki.pages.dev/gameplay/concepts/xp-orbs-mechanics
- "Loot piñata" design article: https://www.gamedeveloper.com/design/loot-pinata-making-101
- **(synthesis)** On a phone: common drops = small item icon, a soft glow underneath and an occasional glint, no number and no ring. Rare and up = a thin vertical beam in the rarity color, plus a sound. Auto-magnet within about 1.5 hero widths, accelerating, then a small "pop" into the bag.

## 4. Floating text and notifications
- Short lifetime: about 600 to 800 ms, fading over the last 200 ms. Lingering numbers clog the view. https://gamejuice.pages.dev/articles/ui-feedback-design
- Merge rapid hits into one ticking number instead of spawning one per hit. https://bugnet.io/blog/how-to-fix-floating-damage-numbers-overlapping-into-an-unreadable-blob . Use a random spawn offset so numbers don't overlap. https://www.wayline.io/blog/unity-floating-combat-text
- Neverwinter readability fix: sans-serif font and damage numbers 23 to 50% smaller, grouped tighter per target. https://forum.arcgames.com/neverwinter/roletracker/jump/1266779
- Tim Cain: numbers for different damage types placed side by side merge into one ("12" + "4" reads "124"). He also says size, color and motion direction all need deliberate design. https://turbo-wiki.pages.dev/tim-cain/ux-design/damage-numbers (mirror, behind a login now)
- Players ask to turn off floating words while keeping damage numbers: https://us.forums.blizzard.com/en/d4/t/please-please-remove-the-floating-combat-text/13017 . Put damage taken and damage dealt in separate places: https://forum.lastepoch.com/t/floating-combat-text-placement-emphasis-duration-speed-length-custom-elements/22864
- Pickup feed pattern (RoR2 ItemPickupList and similar mods): one compact column at the screen edge, a cap on visible rows, repeats aggregated ("x3"), and the queue speeds up during bursts. Avoid multi-column spill. https://thunderstore.io/c/riskofrain2/p/rfaael/ItemPickupList/ , https://modrinth.com/mod/pickup-notifications
- Juice references: "Juice It or Lose It" (GDC Europe 2012) https://gdcvault.com/play/1016487/Juice-It-or-Lose . The counterpoint, "Don't Juice It or Lose It": https://gdcvault.com/play/1020861/Don-t-Juice-It-or

## 5. Mobile performance
- MDN: pre-render repeated shapes to an offscreen canvas and `drawImage` them. Cache scaled sizes rather than scaling every frame. Use integer coordinates. "Avoid the shadowBlur property whenever possible." https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- `globalCompositeOperation='lighter'` = additive (colors add where they overlap). https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation . Blend cost scales with the drawn area, so small sprites are cheap compared with full-canvas fills. https://construct.net/en/forum/construct-2/javascript-sdk-32/blend-mode-performance-test-57608
- Field reports: about 77 shadowBlur calls per frame was a major FPS drop on a mobile canvas game https://dev.to/weirdcodesofficial/v010-done-46cg . Swapping a live blur for a pre-rendered alpha mask cut a frame from about 10 ms to 2 ms https://www.indiehackers.com/post/show-ih-from-10ms-to-2ms-how-i-rebuilt-my-cameras-render-engine-to-create-a-breathing-vintage-timestamp-f6f860a05a . Blur cost scales with blurred pixel area https://github.com/got-feedBack/feedBack/pull/729
- No benchmark was found comparing a per-frame `createRadialGradient` with a cached sprite on mobile. **(synthesis)** Bake one 64 px white radial sprite per element (or one white sprite plus a tint) at load and `drawImage` it with `'lighter'`. Never use shadowBlur.
- three.js: draw calls are the main cost, so aim for fewer than about 100. Sprites that share one material are batched. `Points` with a sprite texture is one draw call for many particles. https://discourse.threejs.org/t/bad-performance-when-loading-more-than-3500-meshes-into-the-scene/63960/4 , https://discourse.threejs.org/t/better-performance-instanced-mesh-or-points/20293 , https://discourse.threejs.org/t/instancedmesh-and-sprite/68091
- **(synthesis)** 5 orbs × 3 sprite layers = 15 sprites, which is trivial. Shed particles (embers, flakes) belong in the 2D canvas pool or in one shared `THREE.Points`.

## Design rules we should adopt (10)
1. **Orbs are lights, not tokens.** No emoji or icon on the orb. Each orb = a white-hot core plus an element-colored halo plus a faint outer halo, drawn additively (`'lighter'` / `AdditiveBlending`, `depthWrite:false`).
2. **Small:** the core is about 1/6 of the hero's width and the halo about half. Brightness does the work, not size.
3. **Element = color + particle behavior**, never a symbol. Embers rise (fire), flakes fall (ice), dense and steady (stone), a breathing pulse with falling leaves (leaf), twinkle glints (clover). This works for colorblind players too.
4. **State = brightness.** Ready = full glow. Recharging = dim and small, then refilling. Triggered = a quick flare plus a burst (stone break, heal ring, crit sparkle).
5. **Organic motion:** a different angular speed and phase per orb, a breathing radius, a vertical bob, slight noise, spring-lag behind the hero, and 5 to 8 frame fading trails.
6. **Fake bloom, never post-process:** stacked additive sprites. No UnrealBloomPass on phones. No `shadowBlur` in the 2D canvas.
7. **Bake once:** glow sprites are pre-rendered at load to offscreen canvases or textures, drawn with `drawImage` at integer coordinates, and shared material/texture in three.js.
8. **Ground loot is quiet by default:** a small item icon with a soft glow and a glint, no number and no gold ring. Beam plus sound only for rare and up, colored by rarity. Auto-magnet within a short radius.
9. **No text over the hero.** Pickups go to a compact feed at the screen edge (max 3 to 4 rows, repeats merged as "x3", fading in about 2 s). Only damage and healing numbers float, and they stay small: about 0.7 s, random offset, rapid hits merged.
10. **Restraint budget:** a big beam, loud sound or big text only for drops and events that change the player's next action. Provide a "fewer effects" toggle in settings, since survivors-likes get players asking for one.
