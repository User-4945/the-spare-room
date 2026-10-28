# The Spare Room v.2.7.5 — Halloween Departs: The Last Knock

See RELEASE_NOTES.md for the Week 3 farewell quest, three new endings, the third-person camera and native download details.

Week 1: play now. Week 2: 30 October 2026 at 17:00 GMT. Week 3: 3 November 2026 at 15:00 GMT. Both timed weeks remain locked until their absolute UTC instant. V or CAMERA switches viewpoint.

# The Spare Room v.2.5.0 — All Hallows’ Eve

A first-person psychological horror game built with Three.js. A house remembers someone else wearing your face; the neighbourhood has dressed for a Halloween that never ends.

[Download the latest release](https://github.com/User-4945/the-spare-room/releases/tag/v.2.5.0) · [Play online](https://the-spare-room.sunsetjelly6.chatgpt.site/)

## This update

- 38 endings: the original 31 paths and seven Halloween stories.
- Three lantern seals, folded notes, masked neighbours, sweets, a midnight garden bell and a tall guest.
- Help a lost child, grow an October orchard or open a wax window through the mirror. HALLOWEEN → Three more October stories provides directions.
- Eight anomalies: watcher, footprints, floating doll, synchronised stares, mirror hands, answering knocks, brownout and impossible door.
- Explore a furnished two-storey house, garden and twenty city venues. Saved generation codes reproduce the same city layout.
- Easy, Intermediate and Hard modes; sanity and recovery; day/night cycles; jumping, sprinting, interactive highlights and a task checklist.

See [release notes](RELEASE_NOTES.md) for the full update.

## Install and play

Windows x64 EXE, universal Mac DMG, Linux x64 AppImage/DEB and an installable offline web archive are attached to the release. The Mac package is ad-hoc signed and not Apple-notarized. Android, iPhone and iPad use the installable web app with touch controls: open the game online, select INSTALL and wait for Ready to play offline.

Desktop SETTINGS offers daily and manual update checks, an optional prerelease checkbox and Save preferences. Versions never downgrade. Windows can download and verify an installer; Mac/Linux link to the matching release page.

WASD walk · mouse look · E/click interact · Shift sprint · Space jump · Esc release mouse · MENU choose a difficulty · HALLOWEEN view quests · MAP travel.

## Saves

The Halloween run uses `spare-room-halloween-v1`; its journal uses `spare-room-halloween-endings`. Original game saves remain on the device under their existing keys. The Halloween preview and v2.5.0 share the seasonal save format. Progress is stored locally; clearing site data removes it. Browser and desktop saves are separate.

## Run from source

Serve `dist/` with a local HTTP server, for example `python3 -m http.server 8000 --directory dist`. Open http://localhost:8000.

For desktop: `npm ci`, then `npm start`. `npm test` verifies the original game, desktop packaging and updater; `node tests/halloween.cjs` also verifies the seasonal ending and quest gates. The release workflow builds, installs and launches the native packages, checks Settings and saves, and verifies real WebGL rendering plus offline browser reloads.

Gameplay source is in `dist/`. Seasonal modules are also maintained in `events/halloween/`; `scripts/prepare-halloween.cjs` produces an isolated web build. The source uses shared global state and remains a prototype. Modern WebGL is needed for the advanced graphics; the compatibility renderer retains core puzzle props.

MIT licence. Three.js and Reflector are bundled with their third-party licence in `dist/vendor/THREE-LICENSE.txt`. Contributions: see CONTRIBUTING.md.


## Admin event previews and flight

Halloween countdown screens offer **Admin login / event previews**. Sign in with the existing online admin account, then choose a preview in the panel. Only events included in that game version appear. Public unlock dates stay unchanged: Week 2 on 30 October 2026 at 17:00 GMT; Week 3 on 3 November 2026 at 15:00 GMT. A still-locked preview closes when the session locks, expires or fails authorization.

In **ADMIN → Session tools**, enable **Fly / pass through walls**. Use WASD to move, Space to rise, Ctrl to descend and Shift to move faster. Disable flight to return to the take-off point. Teleporting or changing event stops flight first. Flight and preview access are never saved. F8 opens the admin panel.

The same shared admin controls are included in all refreshed release downloads without adding newer game content to older releases. Existing same-version installs require a one-time re-download and reinstall; save profiles and update preferences are preserved.
