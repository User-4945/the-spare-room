# The Spare Room v2.1.0 — prerelease

A Three.js-powered first-person psychological horror game about a house that remembers someone else wearing your face.

**[Latest stable v2.0.5 & downloads](https://github.com/User-4945/the-spare-room/releases/tag/v2.0.5)** · **[v.2.1.0 prerelease & downloads](https://github.com/User-4945/the-spare-room/releases/tag/v.2.1.0)** · [Play the prerelease online](https://the-spare-room.sunsetjelly6.chatgpt.site)

This prerelease adds desktop updates and includes the sign fixes and eight timed anomalies from the renamed v.2.0.1 release. A silent watcher, floating doll, impossible door, fresh footprints and synchronised stares make familiar places less trustworthy. See [release notes](RELEASE_NOTES.md) for details. v2.0.5 is the latest stable GitHub release, containing only the sign fixes backported onto v2.0.0. This branch and the online preview continue to contain the v.2.1.0 prerelease features.

You return to your childhood home to care for Mother. An unfamiliar room contains a diary predicting your next day. Decide whether to obey it, protect your memories, and investigate what the house is hiding.

## Features

- Eight timed anomalies, an encounter journal, and difficulty-based pacing. Visual encounters respect walls and floors; disturbing encounters cost sanity once and pause while reading.
- Proportional, measured sign text with venue-specific fonts, colours and borders.

- An optional three-night house story and twenty city locations, with 31 endings in total.
- Explore the house, courtyard, shed, upstairs rooms, and twenty city locations.
- City chunks reshuffle on each new game using a saved seed; continuing a save preserves its layout.
- Choose twelve city endings locally and keep a persistent ending journal across restarts.
- Wall-mounted mirror with a planar reflection and writing on the glass.
- Six hidden sticky notes and optional puzzles involving a music box, well, telephone, and fuse box.
- Jumping, furniture collision, sprinting, and stamina.
- Sanity that drains during active play and after disturbing discoveries. Reading-related losses apply after the popup closes.
- Kitchen sandwiches restore sanity up to 100%; the amount and refill depend on difficulty.
- Object highlights, task checklist, fullscreen mode, optional audio, and local progress saving.
- A twelve-minute day/night cycle that advances during active play and persists with the save.
- Six walking city residents with conversations and collision.
- An interactive cinema projector showing Mother opening the spare-room door.

## Difficulty modes

Choose a mode on the title screen. Continuing preserves the current run; starting a new game creates a new city seed. All 31 endings remain available.

| Mode | Sanity loss | Sprint cost | Sandwich recovery | Refill | Hints |
| --- | --- | --- | --- | --- | --- |
| Easy | 55% of normal | 65% of normal | 15% | 90 seconds | On |
| Intermediate | Normal | Normal | 12% | 120 seconds | On |
| Hard | 150% of normal | 145% of normal | 10% | 150 seconds | Reduced |

## Controls

| Action | Control |
| --- | --- |
| Walk | WASD or up/down arrows |
| Look | Mouse after clicking the game; arrow keys or drag as fallback |
| Release mouse | Esc |
| Interact | Left click or E |
| Jump | Space |
| Sprint | Hold Shift while moving |
| Title screen / modes | Menu button |
| Fullscreen | Fullscreen button |
| Room navigation | Map button |
| Recorded encounters | Anomalies button |
| Progress the night | End Day button |

Touch controls support movement, jumping, sprinting, and dragging to look.

## Run locally

Python 3 is sufficient; there is no build step or dependency installation.

```bash
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. Use a local server rather than opening the HTML file directly. Mouse capture and fullscreen depend on browser support and user interaction.

## Source layout

| File | Purpose |
| --- | --- |
| `dist/index.html` | Story foundation, interface, and styles |
| `dist/house.js` | House geometry, WebGL renderer, controls, and task HUD |
| `dist/secrets.js` | Exploration clues, additional endings, and movement |
| `dist/sanity.js` | Sanity, food recovery, deferred effects, and vertical collision |
| `dist/garden.js` | Outdoor spaces, sticky notes, mirror reflection, and new endings |
| `dist/realism.js` | Detailed garden, natural movement, and three additional ending paths |
| `dist/city-generation.js` | Twenty-chunk deterministic generation, world codes and themed scenery |
| `dist/city.js` | Seeded city chunks, local endings, sandbox map, and ending journal |
| `dist/living-city.js` | World clock, resident rendering, conversations, and animated projector |
| `dist/signage.js` | Proportional canvas text and themed building signs |
| `dist/advanced.js` | Three.js scene rendering, textures, lighting, joint animation, fuse details, title screen, modes, and four additional endings |
| `dist/upstairs.js` | Upper rooms, stairs, signs, notes and three endings |
| `dist/anomalies.js` | Timed scares, pooled 3D effects and the anomaly journal |
| `dist/vendor/` | Bundled Three.js r160 and planar reflector, with third-party licence |
| `dist/favicon.svg` | Custom door-and-keyhole icon |

The local Three.js vendor scripts load before signage and the advanced renderer. They currently share global state; treat this as a prototype rather than a finished engine.

## Progress and privacy

Progress lives in browser `localStorage` under `spare-room-v1`. The game does not send saved progress to a server. Start Again replaces the current local story.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Use the issue templates for bugs and feature ideas. For rendering bugs, include a screenshot, browser/device details, the current room, and reproduction steps.

## Prototype limitations

Automated state and geometry checks have covered story gates, movement, mirror geometry, and sanity flows. Recent updates have not been visually verified in a live browser. The software rendering fallback may differ from WebGL; screenshots and device testing are useful before a release.

## Licence

MIT — see [LICENSE](LICENSE). This allows reuse and modification, including commercial use, while retaining the copyright and licence notice.

## Rendering and third-party code

The primary renderer is Three.js r160, bundled locally with its MIT licence in `dist/vendor/THREE-LICENSE.txt`. It uses merged textured geometry, lighting, soft shadows, a planar mirror, extended camera range, and articulated AnimationMixer character rigs. The old renderer is retained as a compatibility fallback if advanced graphics cannot initialize. Modern WebGL support is needed for the advanced view.

New rendering and mode behaviour has automated scene-construction and projection checks; live browser visual QA is still required before calling this a stable release.


### Upstairs expansion
Exterior stairs lead to a study, nursery and records room. Each contains a hidden note and an interactive clue, unlocking three additional endings (31 total). Named 3D signs identify city buildings and upstairs rooms. Continuous terrain and foundation skirts cover the garden and city wall bases.

## v1.5.1 city generation

Twenty chunks occupy a connected 5 × 4 layout, with six ending landmarks and fourteen exploration locations. Each seed determines placement, facade height, palette, trees, props and eerie details through separate random streams. Use Map → House, garden and city → World generation code to view or reuse a `SPARE-2-XXXXXXXX` code. Starting from a code resets the current run while keeping the ending journal. Existing saves keep progress but adopt the expanded layout.

Run `node tests/game-smoke.cjs` for the automated mechanics and generation checks. This uses a simulated DOM and renderer; it does not replace browser visual testing. See [RELEASE_NOTES.md](RELEASE_NOTES.md) for this release. GitHub Actions publishes the version in `release.json` with a browser-build ZIP when that file changes on main. The ZIP is not a Windows installer.

## Offline Windows app

The Windows x64 installer is attached to the [v.2.1.0 prerelease](https://github.com/User-4945/the-spare-room/releases/tag/v.2.1.0). It bundles Electron and all game assets. See [DESKTOP_README.md](DESKTOP_README.md) for installation, controls, save locations and building from source. Both the desktop installer and browser build use version 2.1.0.

## Windows Settings and updates

Open **SETTINGS** in the Windows game or **Game → Settings**. **Check for updates** uses your saved preference. **Include prerelease updates** is off by default; check it to also receive newer preview versions, then click **Save preferences** to save the choice and check immediately. Leaving it unchecked checks only GitHub’s latest stable release.

Automatic checks run once every 24 hours while open and online. A newer installed version is never downgraded, even after opting out of prereleases. Downloads are verified before installation; the app reopens with release notes and preserves progress and preferences. **Open release page** provides a browser fallback for the selected release.

Updates are public and need no GitHub account or token. Optional GitHub access is available for request limits; Windows encrypts saved credentials on that PC, and rejected tokens fall back to public access. The game remains playable offline; no saves are uploaded.

All four releases have refreshed Windows installers and matching desktop-source ZIPs. Each preserves its original game files, verified against its own tag; INSTALLER_BUILD.json records the game and updater commits. Browser ZIPs and original tags are unchanged. Existing copies need a one-time reinstall from a refreshed installer to receive Settings.

Shared desktop changes use the desktop-refresh workflow. Game releases use the release workflow when dist, release.json or RELEASE_NOTES.md changes.
