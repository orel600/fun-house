# Hero fidelity gaps: Orel's five concept images vs the current in-game models (ARI, 9.11.2026)

**Compared:** `hero-concept-*.png` (Orel's morning package, not in the repo) against [`lineup-front.webp`](../refs/hero-lineup-3d/lineup-front.webp) (3D, GPU, current models, front view; see that folder's README).
**Rule of this document:** it states gaps. Nothing here says a model "matches" a concept. Route A (existing KayKit bodies, material and effect polish) is the only path in scope; new models, custom modeling and rigging are not authorized.

## Style gap, all five

| | Concept | Current |
|---|---|---|
| Rendering | Painterly, realistic proportions, tall heroic figures, dark ornate armor, wet reflective floor, lit by their own glow | Low-poly stylized chibi (about 3 heads tall), flat toon colour, one palette texture per model |
| Scale in play | Hero fills the frame | About 60-70 px tall on a phone, under a role icon and HP bar |
| Reachable with owned assets | Not the painterly detail or realistic proportions: those need new models | Emissive accents, rim light, colour grading, per-hero effects, a larger hero scale |

That is the honest ceiling of Route A: a **stylized readable version** of each concept's colour, silhouette and glow, not a copy of it.

## Per hero

| Hero | Concept (what defines it) | Current model | Gap | Route A can do |
|---|---|---|---|---|
| **Tank** | Huge obsidian-and-gold plate, cracked lava lines, glowing chest core, spiked crown, huge glowing war hammer on the shoulder | KayKit barbarian (blond head, no helmet, grey-brown armor, axe prop; in the lineup the axe is not visible in the idle pose) | Armor design, crown, hammer model, dark/gold materials, bulk | Chest ember core (emissive), warm orange rim light, darker/gold tint on the armor, larger scale. A hammer needs `w_hammer_A` swapped in: Orel's call, not done |
| **Warrior** | Bare-chested muscular fighter, red cape, studded pauldrons, huge curved glowing blade | KayKit knight: full helmet, grey plate, small sword | Body type (bare chest vs plate), blade size and shape, cape. Biggest silhouette mismatch of the five | Sword edge glow, red cloth trim. Closer match = barbarian + `dragonBlade`: **not approved, open choice for Orel** |
| **Hunter** | Hooded elf archer, teal cloak, dark leg armor, huge crackling lightning bow, glowing arrows | KayKit ranger: hooded, blue neckerchief, leather, brown bow | **Smallest gap.** Hood and bow match in kind. Missing: teal cloak, dark armor, oversized glowing bow | Bow string and bow edge in lightning colour, teal cloak tint, stormBow prop |
| **Mage** | Tall ice-queen, long white hair, crown, flowing blue-white robe with water wisps, tall orb staff, floating crystal | KayKit mage: purple witch hat, dark hair, purple robe, small staff and floating pet | Hat vs crown, robe colour (purple vs blue-white), no flowing cloth, no floating crystal | Staff orb glow in ice-blue, robe tint toward blue, a floating glow near the free hand. No cloth physics, no crown model |
| **Assassin** | Crouched masked ninja, purple scarf and hair, black armor, two glowing purple curved daggers, purple flame trail | KayKit rogue: small green hood, green tunic | Colours (green vs black/purple), mask, second dagger, ponytail, the crouched pose | Purple dagger glow and trail, darker/purple tint, second dagger in the left hand (feasible), crouch via the owned `Crouching`/`Sneaking` clips. No mask model |

## Things that are not model gaps

- Team colour (blue/red) must survive any tint: team trim on shoulder or cloth, never on the emissive accent.
- Hero scale: heroes should read larger than minions (today 59-72 vs minion 44). That is a visual-only number, and the concept's sense of size cannot be reached without larger models.
- The lineup is the in-game camera. Concepts are front views with painted lighting, so even identical models would not look the same.

## Decisions for Orel

1. Warrior body: keep the knight, or swap to barbarian + `dragonBlade` (closer, not approved).
2. Tank hammer: keep the axe, or the `w_hammer_A` prop.
3. Whether a stylized-readable version is acceptable for all five, or whether the gap means real new models later (Route B, not authorized).
