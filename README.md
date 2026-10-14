# The Spare Room

A first-person psychological horror game about a house that remembers someone else wearing your face.

**[Play the game](https://the-spare-room.sunsetjelly6.chatgpt.site)**

You return to your childhood home to care for Mother. An unfamiliar room contains a diary predicting your next day. Decide whether to obey it, protect your memories, and investigate what the house is hiding.

## Features

- Three nights of branching story, with twelve endings.
- Walk through a furnished house, courtyard, and garden shed, with detailed plants, paving, a stone well, and gardening puzzles.
- Wall-mounted mirror with a planar reflection and writing on the glass.
- Six hidden sticky notes and optional puzzles involving a music box, well, telephone, and fuse box.
- Jumping, furniture collision, sprinting, and stamina.
- Sanity that drains during active play and after disturbing discoveries. Reading-related losses apply after the popup closes.
- Kitchen sandwiches restore 12 percentage points of sanity, capped at 100%, and refill after two minutes.
- Object highlights, task checklist, fullscreen mode, optional audio, and local progress saving.

## Controls

| Action | Control |
| --- | --- |
| Walk | WASD or up/down arrows |
| Look | Mouse after clicking the game; arrow keys or drag as fallback |
| Release mouse | Esc |
| Interact | Left click or E |
| Jump | Space |
| Sprint | Hold Shift while moving |
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
