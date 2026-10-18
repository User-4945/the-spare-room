# The Spare Room v1.5.1

The city now has **20 explorable locations**, up from six, across a connected five-column, four-row layout.

- Added a cafe, laundry, dead letter office, clock workshop, florist, bakery, apartments, hotel, market, glasshouse, pump house, garage, bookshop and playroom. Each has an unsettling discovery and themed interior props.
- Added independently seeded generation for location placement, facade heights, palettes, street props, trees and eerie details.
- Added reusable `SPARE-2-XXXXXXXX` world codes through Map → House, garden and city → World generation code. Starting from a code replaces the current run while keeping the ending journal.
- Expanded continuous terrain, roads, border walls, foundation coverage, building signs and map destinations to cover the larger city.
- Kept street lighting to a pool of eight nearby lights as the city grows.
- Preserved all 31 endings, difficulty modes, upstairs rooms, residents, day/night cycle and projector sequence.

## Play

https://the-spare-room.sunsetjelly6.chatgpt.site

The attached **web** archive is a browser-game build, not an `.exe` installer. Extract it, then run `python3 -m http.server 8000 --directory dist` from the extracted folder and open http://localhost:8000. Its assets are bundled locally.

Existing saves retain story progress and the ending journal. Their city layout updates to generation version 2. Start a new game for a fresh city, or reuse a world code to reproduce a layout.

## Validation

Automated checks cover 200 deterministic world codes, connected routes to all 20 entrances across eight seeds, terrain coverage, doorway and stair collision, rendering/interaction camera alignment, ending gates, reset behaviour and existing game systems. Browser visual QA was unavailable in this environment; this remains a prototype release.

## Offline Windows desktop installer

Download **The-Spare-Room-Setup-1.5.1-x64.exe** from the assets below. It installs a self-contained Windows 10/11 x64 app that plays offline, with desktop/Start menu shortcuts, fullscreen and local saves. No browser or Python is needed. The installer is unsigned. Browser saves are separate from desktop saves. See DESKTOP_README.md for installation and controls, and SHA256SUMS.txt for the installer checksum.

The installer was built on Windows and checked by installing it and launching it twice, verifying the 3D engine, local assets, blocked network requests and persistence after restart. Manual visual testing remains necessary.
