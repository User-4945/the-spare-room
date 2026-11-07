# The Spare Room — Roblox Studio prototype 0.5

An importable Roblox Studio place, rebuilt in Luau from the core ideas of The Spare Room.
This is a starter adaptation, not a complete port of the browser/desktop releases.

## Open it
1. Download **The-Spare-Room.rbxlx** from this folder using GitHub's **Download raw file** button. Keep the .rbxlx extension.
2. In Roblox Studio, open that file (File → Open from File, or Ctrl+O on Windows).
3. Press **Play**, choose a difficulty, and explore.
4. In Edit mode, expand **Workspace → SpareRoomWorld** to inspect or edit the furnished map.
5. In Play mode, lighting, labels, prompts and UI are created by the included scripts.

No plugins, paid assets, external audio, credentials or HTTP requests are required.
Opening the place does not publish it to Roblox. You decide when to publish from your own Studio account.

## Included
- A furnished ground-floor house: hallway, kitchen/Mum, bedroom, sitting room and spare room.
- A small garden and a permanent basement with ten named rooms.
- 20 collectible sibling diary pages, twelve household and district records, an unnumbered key and a gated chamber.
- Default Roblox E / touch / controller hold prompts, a progress ring, crosshair and visible-object highlighting.
- First person, third person (V), jump, sprint and stamina.
- Easy, Intermediate and Hard modes.
- Server-maintained sanity, deferred reading costs, a 2.2-second loss flash, and a zero-sanity restart screen.
- Sandwiches restore 15/12/10 percent by mode and refill after 120 seconds of active play.
- Twelve locally animated anomalies with captions; menus and reading pause their timers.
- Six ending paths and a per-player journal for the current server.
- 1,276 anchored map parts. All art is primitive geometry that you can edit in Studio.

## Controls
| Action | Control |
|---|---|
| Move / jump | Roblox default controls; WASD / Space on keyboard |
| Sprint | Hold Shift, or toggle SPRINT |
| Interact | Hold E, click/touch the prompt, or controller X |
| Change camera | V or CAMERA |
| Read ending journal | JOURNAL |
| Close reading | Put it back |
| Restart after an ending | Start again |

## First playthrough
Read the household list on the right hallway wall and speak with Mum in the kitchen.
Use the maintenance hatch at the rear of the hallway. The basement stairs return you upstairs.
Each basement room contains two diary pages. Nine rooms are open.
The children's area contains the unnumbered chamber key.
The chamber needs **12 diary pages, 3 family records and the key**.
Its return prompt takes you back into the central passage.

## Endings
| Ending | Place and requirements |
|---|---|
| An Ordinary Morning | Kitchen window: 2 diary pages and hold the ordinary memory at the repaired chair |
| Names Without Faces | Archive decision: 6 pages and 2 records |
| Maintained in Absence | Sealed corridor decision: 10 pages and isolate the boiler pipe |
| Somewhere for Tomorrow | Chamber decision: all 20 pages, 3 records, and speak with Mum |
| The Far Side of the Glass | Observation decision: 3 anomaly types and sanity at or below 45% |
| Your Sanity Got Consumed | Reach zero sanity |

The evidence suggests a larger family. None of these endings establishes a definitive explanation.

## Editing the project
- `SpareRoomConfig.lua`: difficulty, diary text, anomaly descriptions and ending requirements.
- `SpareRoomServer.server.lua`: interactions, sanity, gates, cooldowns, ending decisions and event scheduling.
- `SpareRoomClient.client.lua`: UI, camera modes, torch, highlighting and anomaly visuals.
- `build-place.cjs`: deterministic editable map generator and XML packaging.

Scripts are already embedded in the place. Edit those scripts in Studio for normal development.
For source-driven changes, use Node.js 20+:
```sh
node roblox-studio/build-place.cjs
python3 roblox-studio/validate-place.py
```
This regenerates the place and replaces manual map edits; save a separate copy before regenerating.

## Multiplayer and saving
Evidence, sanity, sandwiches, gates and ending journals are maintained separately for each player.
Anomaly models are local visual effects. One player closing a menu does not resume another player's timer.
The shared scene uses permanently open interior doorways, and the chamber uses a per-player entry prompt.

By default, progress lasts for the current server session. Browser/desktop saves do not transfer.
Optional **ending-journal-only** persistence is implemented behind `SaveEndingJournal = false`.
Leave it off for ordinary local Studio tests. To enable it, publish a test experience, configure DataStore access in Studio if testing there, and set that option to true.
A failed load does not overwrite the stored journal. Active runs are not saved between servers.
Use a separate test experience rather than a live production data store for persistence tests.

## Deliberately not ported yet
The procedural city/chunk generator, upstairs expansion, Halloween quests, the full 61-ending collection,
Roblox badges, fully authored animation assets and true mirror reflections.
The mirror is an interactive lore prop. The starter contains no real family voice recordings or external music.

## Validation limits
Automated checks verify XML structure, embedded script/source agreement, map reachability and Luau compilation.
They do not run Roblox's engine. This place still needs Studio playtesting for camera behavior,
prompt visuals, physics, touch layouts and performance before public publication.

### Studio test checklist
- Choose each difficulty and use both cameras.
- Reach every open room without flying.
- Read and close a disturbing page: sanity loss and the flash should happen after closing.
- Try E, click/touch and controller hold prompts.
- Eat a sandwich twice: the second interaction should show its cooldown.
- Unlock the chamber using the actual evidence and key.
- Observe all twelve anomalies while standing still, then pause with a page and resume.
- Trigger the five chosen endings and the sanity-loss ending; restart each time.
- Test with two local clients: reading, sandwiches and sanity must remain independent.
- Inspect View → Output for errors. Report the exact message and what you were doing.

Roblox API references: [proximity prompts](https://create.roblox.com/docs/ui/proximity-prompts), [remote events](https://create.roblox.com/docs/scripting/events/remote), [server validation](https://create.roblox.com/docs/scripting/security/client-server-boundary).



## District and UI refresh

This refreshed starter adds eight enterable, furnished venues: The Palladium cinema, Municipal Archive, St. Agnes Clinic, Ashfield Station, Ward & Sons workshop, Velvet & Ash costume shop, The Second Copy bookshop and The Empty Chair cafe. Each contains a family correspondence collectible. These are compact prototype interiors, not full ports of the original city quests.

The HUD now uses a centered 1280×720 design canvas scaled to the viewport: sanity at upper left, controls at upper right, objectives at lower right, and Roblox’s default proximity prompts with its built-in hold progress ring. Reading panels scroll. Dark paper panels, muted brass typography, natural Roblox materials, shadowed lamps, color grading, bloom, framed window openings and detailed fuse switches bring it closer to the original's atmosphere. No external art assets are required.

## Admin access

Press **F8** or **ADMIN** after starting a run. Access is checked by the server on every command. Studio playtest users are authorized; in a published user-owned experience, its creator is authorized. For other users or group-owned experiences, edit `ADMIN_USER_IDS` near the top of `SpareRoomServer.server.lua` to add numeric Roblox UserIds, e.g. `{[123456789] = true}`. Do not enter the web version's password or username: Roblox identity replaces password authentication here.

Tools: teleport to house/garden/basement/all eight venues; spawn any of the twelve animated anomalies; clear anomalies; add/remove sanity; toggle flight; skip a day (advances active event timers). Anomalies use the normal floor and clearance checks; move to open floor space if a spawn is postponed. Close the admin panel to resume the paused game and see the anomaly.

Flight: WASD direction, Space up, Left Ctrl down; toggling flight off returns normal movement. Keyboard flight is intended for desktop Studio testing. Day skipping changes the run's day counter and timers; this prototype does not yet implement a complete day/night schedule or calendar-gated events.

## Scope and testing

This is still a Roblox starter, not a graphics-identical or complete port. It does not include every original quest, procedural city generation, full avatar animations, a functioning mirror reflection, or all original endings. Existing browser and desktop releases are unchanged.

Automated checks validate XML, exact embedded source, map reachability, sealed-chamber isolation, admin authorization hooks and Luau compilation. They do not replace testing camera, UI, interaction input, lighting, flight or multiplayer in Roblox Studio. Recommended tests: all three difficulty buttons, resize Studio viewport, hold E and hold click on the same prop, close a diary and inspect sanity, visit every venue, test F8 flight and all anomalies, reset a run, and verify a non-admin cannot use tools in a published test experience.


### Default interaction prompt fix
Custom prompt rendering and manual input forwarding have been removed. Roblox renders the prompt and hold circle. The server validates completed triggers with distance, line-of-sight, game-state checks and a short anti-spam cooldown, without relying on a separately replicated hold-start clock. The visibility ray starts at the avatar's head so desk edges do not reject visible tabletop pages. Hold time remains 0.8 seconds. Studio keyboard, mouse/touch and controller testing is still required.


## Mouse, exploration and anomalies refresh

- **M** or **MOUSE** releases/captures the pointer. While released, click empty game space to capture it again; UI clicks remain available. The game keeps running while the pointer is released. Reading, maps and other menus still pause gameplay.
- **F** or **LIGHT** toggles the flashlight. There is no battery drain.
- **G** or **MAP** opens the district guide. It pauses the run and gives directions to each venue.
- **JOURNAL** now includes this run's discovered anomaly descriptions as well as recorded endings.
- Ten anomaly types: the original coat, footprints, backwards clock and extra chair, plus orbiting diary pages, a freestanding door, a family of silhouettes, rearranging letter blocks, floating plates and an answering lamp.
- Natural anomalies can appear in the house, basement or district when a nearby floor area has sufficient clearance. A shuffled bag ensures every type is seen before that cycle repeats, without immediate repetition between cycles. Admin spawns do not consume this bag.
- Animation, captions and cleanup share a 14-second active-play lifetime, including a final two-second fade. Menus pause all three. Lamp pulses are gentle and local rather than rapid full-screen flashes.
- These are local visual anomalies without collision. Studio playtesting is still needed to verify actual rendering, mouse recapture and every input method.


## Avatars, Watcher, doll and multiplayer refresh

The server now creates **11 native Roblox avatar NPCs**: Mum, the garden Watcher, the doll in the spare room, and eight citizens. Roblox's HumanoidDescription API builds R15 models; an embedded R6 rig factory provides a fallback when avatar creation fails. These use curated body colours and simple hair, not real users' outfits or commissioned character art. No player account lookup, external avatar IDs or paid animation assets are needed.

Citizens follow server-owned pathfinding routes on the pavements and offer eight short family clues via default Roblox hold prompts. If a path fails, the NPC stops and recomputes later instead of teleporting through geometry. Client-side Motor6D poses add walk cycles, arm swing, knee movement, breathing and head motion. The Watcher and doll also appear as two new animated anomalies, bringing the total to **12**. Family silhouettes use avatar rigs too. The doll in the spare room has a readable lore interaction; its first reading costs sanity after the popup closes.

The title screen now frames the house with a slow camera movement, serif title, three difficulty cards, hover transitions and a live connected-player count. **HOUSEHOLD** shows who's exploring or reading. Each player chooses their own difficulty; there is no shared host difficulty or combined ending vote.

### Multiplayer

Multiple players can explore the same server, house, district and NPCs. Player/NPC collision groups keep residents and explorers from blocking doorways. All walking NPC movement comes from the server. Evidence, sanity, sandwich timers, anomaly schedules, menus and endings remain individual. A player reading never pauses someone else's run. Personal anomalies remain visible only to that player; the persistent garden Watcher and room doll are shared.

For a Studio test, use the Test controls to start a server with two clients. In each client select a difficulty, meet in the kitchen, open a diary on only one client, and verify that the other can still walk/interact. Speak to a resident and inspect the doll. Test a restart and one player leaving. For friends to join outside Studio, publish the experience in your Roblox account and configure access and a suitable server size (8 players recommended). This file does not publish a live Roblox experience or create a private-server invitation automatically.

### Regression tests

`python roblox-studio/test-multiplayer-state.py /path/to/luau` runs the actual server reset, pause, damage and ending functions with two player stubs. It checks that evidence, timers, menus, sanity, journals and restarts do not leak between players. It is not a Roblox network/physics test. Avatar loading, pathfinding, gait, prompt placement, viewport layout and two-client play still require Studio testing.


## Natural residents and revive-pass refresh

Mum always uses the female NPC style pool; citizens alternate female/male character roles with random looks from curated pools. These are fictional NPC roles, not guesses about the gender of Roblox users. Hair, classic shirts and trousers use Roblox-published catalogue assets, with random complexions and proportions. Four male hairstyles, three female hairstyles and multiple clothing combinations replace the matching grey bodies. If avatar services fail, the self-contained R6 fallback remains available.

Ordinary NPCs now use Roblox idle/walk animation tracks with per-resident timing, different walking speeds, random destinations and rest breaks. The old procedural head/torso sway is disabled for ordinary NPCs. A simple neutral gait remains as a fallback if animation assets cannot load. Mum independently walks between kitchen spots, and her interaction prompt follows her head. Residents stop walking briefly when someone begins speaking to them. The Watcher and doll intentionally retain their unsettling movement.

### One purchase per revive (prototype 0.6)

Sanity loss or an accidental death opens the death screen. **Restart / Free** starts over. **Buy one revive** buys one consumable credit and respawns at home with 50% sanity, full stamina and the current run’s evidence preserved. Another death needs another credit. A late receipt after restarting banks the purchased credit; a failed character load preserves it for retry.

The old permanent gamepass `2073110257` is no longer used for checkout. It cannot be converted to a repeatable purchase. If it has existing buyers, retire its sale and communicate the changed offering before publishing.

1. In your experience’s Creator Hub, open **Monetization → Developer Products**.
2. Create **One Revive**, set its price to **30 Robux**, and explain that each purchase revives once. Roblox checkout shows the actual price.
3. Copy the new **Developer Product ID** into `ReplicatedStorage → SpareRoomConfig → ReviveProductId` (configured as `3729479338`). Do not paste the old gamepass ID.
4. Publish to the same experience that owns the product. Confirm cancellation, successful receipt delivery, repeat purchase after another death, and reconnect recovery in Roblox.
5. Purchases are disabled if the product ID is missing, the filtered receipt handler cannot register, or the persistent ledger cannot be accessed. Studio testing may need API-services access; use a separate test experience to avoid writing production data.

The server grants only from verified receipts, persists purchase IDs before acknowledgement, deduplicates receipts, reserves credits atomically and recovers stale reservations. `BindReceiptHandler` filters to this product without replacing HD Admin’s `ProcessReceipt`. A different script must not also register the same product. No receipt is granted from the purchase-window-close event. The code does not create products or set their price.

`python roblox-studio/test-revive.py /path/to/luau` checks the actual module with mocked Roblox services. It makes no purchases and does not certify live checkout or character loading.

### Taller Watcher refresh
The Watcher now uses 1.75× rig scale (ordinary adults remain near 1×), narrower proportions, an almost-black hood, tiny dim eyes and elongated fingers. The garden figure stays motionless while its head slowly follows nearby players. The anomaly version retains its turn-away behaviour. Spawn clearance now reserves 10.8 studs vertically so the larger model is not placed under low lintels. Family silhouettes still rescale their template to their original small sizes. Visual proportions and clearance need Studio verification.

### Upstairs and HUD expansion (prototype 0.6)

Four furnished upper rooms are accessible by 24 physical half-stud stairs. The study blueprint, nursery clock and loft letters introduce three source-inspired ending paths; the family bedroom adds a photograph, school report and coat clue. Three garden letters extend the family mystery. Lamps, shelving, cot rails, height marks and a keyed typewriter add detail. The district guide and owner teleport list include upstairs. Default Roblox hold-to-interact prompts remain in place.

Sanity and stamina have separate panels and independent progress bars. Sprint drains stamina; standing/walking restores it. Low stamina changes its bar colour.

This remains an adaptation rather than a complete copy of the web game: 10 basement rooms, 4 upstairs rooms, 20 diary pages, 12 anomalies, 8 city venues, 63 interactions, 8 choice endings plus 2 death outcomes. Current runs are not fully persisted; optional ending-journal saving and paid-revive credits are separate. No Halloween content or full set of 61 web ending paths is implied. Verify the stairs, R15 clearance, lighting, prompts, NPCs and purchases in Studio before publishing. These changes have not been run inside Roblox Studio here.

Revive product connected: `3729479338` (REVIVE). The owner-provided Creator Hub screenshot shows a 30 Robux price. Publish this place to the experience that owns that product. Live checkout and receipt delivery still need Roblox testing.

### Local Studio title-screen startup fix
Revive DataStore acquisition is protected. An unpublished local file or disabled API access can disable paid revives without terminating server startup or leaving difficulty buttons unresponsive. Sanity, stamina and task panels stay hidden until a run starts. Test local-file startup and published purchase flow separately.
