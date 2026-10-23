# The Spare Room · All Hallows’ Eve

A separate Halloween preview built on v.2.1.0. It adds four endings (35 total), three lantern seals, folded notes, masked neighbours with sweets, a midnight garden bell, a tall guest, turning pumpkins, bats and a spectral procession.

The event uses `spare-room-halloween-v1` and `spare-room-halloween-endings`. Original browser saves and published release assets are untouched. The countdown advances only during active play and unlocks after 90 seconds; the ritual never expires. All difficulties are available. Notes and discoveries queue sanity damage until their popups close. Sweets restore up to 4% sanity and are limited to one per resident per run.

Build and check:

```sh
node tests/halloween.cjs
node scripts/prepare-halloween.cjs
node scripts/prepare-pwa.cjs halloween-build pwa-build events/halloween/release.json
node --test tests/pwa.cjs
```

Serve `pwa-build/` for the installable, offline browser version. The `Verify Halloween preview` workflow also runs a real WebGL/interaction test and an offline reload with its HTTP server stopped. It uploads screenshots without publishing or replacing any release installer.

This is a browser preview, not a new desktop installer or GitHub release. The event's package metadata is `2.1.0-halloween.1`; the repository's existing desktop version stays unchanged.

Graphics: pooled Three.js props, seven pumpkins around the house and forty in the city, three local lantern lights, masks attached to the existing resident rigs, and distance culling for decorative pumpkins. WebGL is required for these advanced decorations; the compatibility renderer retains visible puzzle props and interactions.

## Ending paths (spoilers)

- **Leave the porch light on:** read the invitation; light all three seals; wait for midnight; ask Mother to leave the light on; ring once.
- **Nobody beneath the masks:** read the invitation; light all three seals; wait for midnight; ring three times.
- **The last trick-or-treater:** offer three sweets to the tall guest, take its mask, complete the seals, then join the procession at the bell after midnight.
- **A place at the table:** read the invitation, offer three sweets to the tall guest, then tell it where you live.
