# Direction brief, 9.11.2026 (research draft, condensed)

Source: Nir's WhatsApp answers 9.11 (07:19-07:56 IST), a repo read at `0e05a8e`, one live session (v0.3.576.615). Research and proposals only, nothing here is approved to build. New visuals go to Nir as a concept first.

## 1. What Nir wants (paraphrased)
- **World combat:** auto-attack kills before he notices; enemy look and deaths feel flat. He wants drama.
- **Strength-relative:** stronger than a group → crush it, ideally with one skill. Weaker → move, dodge, use all skills. Not longer fights for their own sake.
- **Auto-attack** stays automatic, but weaker relative to skills.
- **Gathering (My Universe):** hours of it if it feels great. Each hit breaks the resource, pieces fly out and are pulled to him.
- **Tool upgrades:** mainly more material and access to a new resource, plus a slight speed gain.
- **Progress he earns:** a mix of village growth and exploration, several ways forward.
- **Village:** starts poor, grows visibly (bigger, better-looking buildings, more options, new guests from the world). A big part of the game. Gives advantages back: better gear upgrades, better quests, a market to convert resources. He asked for more ideas.

## 2. Code today (main, not tested on a phone)
- Sword auto: range 80, arc 2.3, cd 0.55 s (state.js), hits every enemy in range (combat.js); group members have half HP (spawn.js). Hit feel exists (juice.js, hitfeel.js); death fx by damage type, capped per frame (fxcombat.js). combat-feel measures 1v1 only: 0.7-2 s per ordinary enemy.
- Gathering: 6 chips per hit, shrink/sway/fall, loot rises 0.12 s then flies to hero, "+N", counter pulse (gather.js). Fixed yield per node (nodes.js). Tools (gtool.js): 5 tiers, hit power ×1.0-×1.75, hard metals slower with a weak tool, **no yield multiplier** (deliberate rule). Mastery (gmastery.js) raises material per minute, not per node.
- Village: 7 buildings, levels 0-5 capped by center; looks change at 1/3/5. Mill/mine produce by real time; forge unlocks gear tiers; market rates by level. Residents (residents.js): fisher, stone cutter, herbalist, one exchange each. Inn: 3 daily quests. Quest boards per region.
- Area gates (curiosity.js, world.js) read character level and story lanterns only (recommended 6/12/18/24/30), not village or tool progress.

## 3. Mismatches with the new direction
Confirmed: (1) tool tiers add hit power only, no yield and no new resource; (2) area gates ignore village/tool progress; (3) residents don't change forge, quests or market.
To check on the phone: (4) crowds dying together at higher levels; (5) the per-frame fx cap in dense fights; (6) whether gather chips and the pull read at phone size; (7) a "stone 12/40 for the market" cue near resources.

## 4. Proposed first loop
Gather one material family → spend on one visible village project → get something felt in the world (more material per node, maybe a new resource) → that opens a path to an area that visibly waits.
Experiments, one at a time, concept first: A. tool tier raises yield for one family + one new-resource capability (hard vs soft block open); B. gather break readable at phone size (check on phone first); C. enemy death reads on its own in a group, one enemy type first; D. a "crush" moment: a skill clears a weak group, auto stays weaker; E. one path that can also open through a village project, next to level/story.
Don't start with a global rewrite of all enemies or many new residents.

## 5. More ideas
Resident specialists (smith: gear upgrade option; quartermaster: better quest rewards; trader: better rates). Restoration projects (a ruined building rebuilt in stages). A request board asking for a mix of materials. A goal cue near resources.

## 6. Outside sources
- arxiv.org/html/2208.06155v3, impact feel study (lowest-ranked games lack hit stop; correlation only).
- cobomakesgames.com/blog/loot-drops (arc, bounce, short wait, then pull; 0.6 s wait made players walk over loot).
- designoriented.net summary of Vlambeer's 31 game-feel tricks (low enemy HP, hit pause, knockback, bodies stay).

## 7. Not tested
No phone/touch test, no performance numbers, no strong character, skills, forge, village screens or area gates in play.
