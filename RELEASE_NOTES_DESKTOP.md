# The Spare Room v.2.0.1

**Bug fixes & anomalies — prerelease.** A scarier update for the browser and offline Windows editions of The Spare Room. This patch fixes stretched building signs and adds eight unsettling encounters to the house and city. It is marked as a prerelease while the new atmosphere and pacing receive player testing; v2.0.0 remains the stable release.

## Bug fixes

- Building labels now use textures with the same proportions as their physical signs. Text is measured and fitted at its natural proportions, with room for borders and line spacing.
- Signs face outward so their lettering cannot appear reversed through the back of a board.
- Each city venue has its own sign colours, border style and font: a cinema marquee, archive plaques, clinic signage, railway lettering, workshop plates and more. House, upstairs and fuse-box labels also use the corrected text layout.
- New encounter positions are checked against walls, walkable space and floor height. Footprints sit above the ground; upstairs encounters stay on the upper floor.

## More things that should not be there

- A tall, silent watcher that disappears if you stare at it.
- Wet, barefoot prints appearing behind you.
- A floating doll whose head turns independently.
- Nearby residents freezing and turning to face you together.
- Writing and handprints forming on the uncovered mirror while its reflection remains active.
- Six answering knocks, with optional sound and a caption.
- A slow dip in the house lights while your torch remains usable.
- An impossible door with a plate reading **YOUR ROOM**.

The **ANOMALIES** journal records the kinds of encounters you actually notice. Encounters pause while menus or reading popups are open, have a grace period at the start of a run, and leave breathing room between appearances. Easy mode gives longer breaks; Hard makes encounters more frequent. A disturbing encounter can reduce sanity only once. Reading-related sanity losses still apply after closing the popup.

## Downloads

- **The-Spare-Room-Setup-2.0.1-x64.exe** — self-contained offline installer for 64-bit Windows 10/11.
- **The-Spare-Room-v2.0.1-web.zip** — browser build for local serving or hosting.
- **SHA256SUMS.txt** — installer checksum.
- **DESKTOP_README.md** — installation, controls and save information.

Play in a browser: https://the-spare-room.sunsetjelly6.chatgpt.site

## Saves and existing content

The 20 city locations, 31 endings, three difficulty modes, upstairs rooms and day/night cycle remain available. Existing saves load without a reset. Generation remains version 2, so `SPARE-2-XXXXXXXX` codes retain their city layout. The anomaly journal belongs to the current run; the ending journal survives starting again.

The app and installer use version **2.0.1**. The GitHub tag is **v.2.0.1**, matching the requested release name. The Windows app keeps the same application identity and `%APPDATA%\The Spare Room` save folder as v2.0.0. Desktop and browser saves remain separate.

## Verification and prerelease status

Automated checks cover sign proportions and text fitting, all eight encounters, once-only sanity damage, pauses, reset behaviour, reusable effect meshes, existing story gates, 200 deterministic city codes and reachable city entrances. The Windows workflow builds the installer, installs it and launches the installed app twice with network access blocked, checking actual canvas text metrics, rendering every encounter and confirming save persistence.

Manual visual and gameplay testing on different graphics hardware is still needed, especially for encounter pacing and lighting. The Windows installer is unsigned and updates are installed manually. Please include your difficulty, location, world code and reproduction steps when reporting an issue.
