# The Spare Room v2.0.0

**The offline desktop edition.** The Spare Room now has a versioned Windows installer alongside the browser build. This release brings the existing expanded horror sandbox into a self-contained desktop app.

## Offline Windows game

- Install with **The-Spare-Room-Setup-2.0.0-x64.exe** on 64-bit Windows 10/11.
- Play without an internet connection, browser, Python, or separate runtime installation. All game assets and the Electron runtime are bundled.
- Launch from desktop and Start menu shortcuts. Use F11 for fullscreen and Ctrl+Q to quit.
- Keep progress and the ending journal locally under `%APPDATA%\The Spare Room`.
- The app and installer now identify themselves as version 2.0.0.

## Included game content

- 20 explorable city locations, including the cinema, station, archives, cafe, hotel, laundry, bookshop, glasshouse and pump house.
- Seeded location placement, facade heights, colours, props, trees and creepy discoveries. Reuse a `SPARE-2-XXXXXXXX` world code to revisit a layout.
- 31 endings across the house, garden, upstairs rooms and city.
- Easy, Intermediate and Hard modes; sanity, food recovery, sprinting and jumping.
- Day/night cycles, walking residents, a reflective mirror and an animated cinema projector.
- An upstairs study, nursery and records room with hidden notes and secret endings.

## Downloads

- **The-Spare-Room-Setup-2.0.0-x64.exe** — offline Windows installer.
- **The-Spare-Room-v2.0.0-web.zip** — browser build for local serving or web hosting.
- **SHA256SUMS.txt** — installer checksum.
- **DESKTOP_README.md** — installation instructions, controls and save information.

Browser version: https://the-spare-room.sunsetjelly6.chatgpt.site

## Saves and compatibility

Desktop saves are separate from browser saves and are not automatically imported. The desktop edition uses the same application identity and save folder as the earlier v1.5.1 desktop build. Uninstalling preserves saved progress. World generation remains version 2, so existing `SPARE-2` codes keep their layouts.

## Validation and known limitations

Release checks cover game mechanics, 200 deterministic world codes, reachable entrances across eight layouts, complete local assets, and a Windows installation followed by two launches to check rendering, blocked network requests and save persistence.

The installer is unsigned, so Windows may display an unknown-publisher warning. This is a prototype; automated checks do not replace manual visual and gameplay testing. Updates require downloading a newer installer.
