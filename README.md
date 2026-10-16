# The Spare Room

A Three.js-powered first-person psychological horror game about a house that remembers someone else wearing your face.

**[Play the game](https://the-spare-room.sunsetjelly6.chatgpt.site)**

You return to your childhood home to care for Mother. An unfamiliar room contains a diary predicting your next day. Decide whether to obey it, protect your memories, and investigate what the house is hiding.

## Features

- An optional three-night house story and six city landmarks, with 28 endings in total.
- Explore the house, courtyard, shed, and six city landmarks.
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

Choose a mode on the title screen. Continuing preserves the current run; starting a new game creates a new city seed. All 28 endings remain available.

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
| `dist/city.js` | Seeded city chunks, local endings, sandbox map, and ending journal |
| `dist/living-city.js` | World clock, resident rendering, conversations, and animated projector |
| `dist/advanced.js` | Three.js scene rendering, textures, lighting, joint animation, fuse details, title screen, modes, and four additional endings |
| `dist/vendor/` | Bundled Three.js r160 and planar reflector, with third-party licence |
| `dist/favicon.svg` | Custom door-and-keyhole icon |

Scripts load in the order listed. They currently share global state; treat this as a prototype rather than a finished engine.

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
