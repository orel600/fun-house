# Combat renewal v14 - two-effect PREVIEW

New module: js/combat-renewal.js. Loaded after attack-guides.js.

Coverage is two arena actions only: quake and splash. This is not all40 completion or an invitation for user acceptance.

- Quake replaces tall canvas spikes with depth-tested ground fissures and short actual-hit contact flashes. Private texture/material/geometry are discarded at expiry or reset.
- Splash replaces standing columns with tapered cyan crests, sparse droplets, and actual-hit flashes.
- No model, rig or combat geometry changes. No damage, radius, targeting, cooldown or status timing changes.
- Opt out with ?combatnew=0, keeping previous effects intact.

Checks:
- Source motion: 36 actual rendered frames per action at 844x390, normal cast and normal updates, no runtime errors.
- Eight classic skills A/B: 331 actual update steps each, 67 sampled states each. HP, status, radii, positions, cooldowns, landing clocks and pool ticks identical with the module on/off.
- Expiry/reset texture cleanup checked separately.
- Export is tested after patch application to the v13 export.

Known limits:
- Quake still reads as angular orange fissures, not finished earth artwork.
- Splash composition and actual contact are improved, not an accepted full-scene result.
- Natural crowd association, all40 animation/contact/audio, physical-phone FPS, portrait and full renewal remain unverified or unfinished.
- Staged stationary targets prove execution and reveal visual flaws, not natural combat acceptance.

Apply after v13. No remote branch or main deployment is included.
