# Christmas in Ashfield — prepared, not released

Original baseline: v.3.0.0 (Beneath the House). Roblox baseline: lobby 66 / run 13.
The existing v.3.0.0 GitHub release is promoted independently of this event.

## Included preparation

- Disabled original-game seasonal adapter, shared manifest and preparation script.
- Bounded snow particles, warm doorway garlands and an inspectable winter card.
- Five seasonal clue texts. No new ending replaces a permanent ending.
- Exterior snow squalls add modest passive sanity pressure and adjust anomaly pacing.
  Indoors and underground retain the original pressure. No flashing or jump scare.
- Separate Roblox config, server dressing/weather adapter and local snow presentation.
- Roblox parcels carry the same clues. The lobby remains safe; run roof checks shelter players.
- Existing capacity pads, badges, economy, save slots and endings remain intact.

## Preview only

Run `node scripts/prepare-christmas.cjs`. Both copied configs remain disabled.
In a separate test copy only, set the config's enabled flag to true, then restart.
No URL, real-world date, workflow dispatch or calendar can activate the event.

Roblox: install the config ModuleScript in ReplicatedStorage, server Script in
ServerScriptService and LocalScript in StarterPlayerScripts, with their supplied
names minus file extensions. Keep Enabled=false in the saved preparation.
Studio was not connected while preparing this package: installation, rendering,
mobile checks and multiplayer playtesting remain outstanding.

## Release gate — user approval required before activation

1. Preview the enabled event in separate copies of both games.
2. Check surface and basement clues, all existing endings, save migration and return travel.
3. Test roof shelter, low graphics, touch controls, local snow budget and queue readability.
4. Verify no overlapping seasonal rewards; no new badge/product IDs are provisioned.
5. Set a release date and version only when the user chooses them.
6. Publish the original and both Roblox places only after explicit approval.

Do not merge this preparation branch into a publishing branch, create a Christmas
release, change live Roblox art, or announce that the Christmas event is available.
The generated thumbnail is preview artwork, not uploaded live.

