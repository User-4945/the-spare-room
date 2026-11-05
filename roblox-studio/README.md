# The Spare Room — Roblox Studio prototype 0.1

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
- 20 collectible sibling diary pages, four household records, an unnumbered key and a gated chamber.
- Native Roblox E / touch / controller hold prompts, a progress ring, crosshair and visible-object highlighting.
- First person, third person (V), jump, sprint and stamina.
- Easy, Intermediate and Hard modes.
- Server-maintained sanity, deferred reading costs, a 2.2-second loss flash, and a zero-sanity restart screen.
- Sandwiches restore 15/12/10 percent by mode and refill after 120 seconds of active play.
- Four locally animated anomalies with captions; menus and reading pause their timers.
- Six ending paths and a per-player journal for the current server.
- 619 anchored map parts. All art is primitive geometry that you can edit in Studio.

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
The city/chunk generator, upstairs expansion, Halloween quests, the full 61-ending collection,
Roblox badges, a player admin interface, custom avatar animations and true mirror reflections.
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
- Observe all four anomalies while standing still, then pause with a page and resume.
- Trigger the five chosen endings and the sanity-loss ending; restart each time.
- Test with two local clients: reading, sandwiches and sanity must remain independent.
- Inspect View → Output for errors. Report the exact message and what you were doing.

Roblox API references: [proximity prompts](https://create.roblox.com/docs/ui/proximity-prompts), [remote events](https://create.roblox.com/docs/scripting/events/remote), [server validation](https://create.roblox.com/docs/scripting/security/client-server-boundary).
