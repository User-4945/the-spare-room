# The Spare Room — Roblox migration workspace

This is an initial Luau implementation scaffold based on the original PC repository, not a completed Roblox port or published experience.

## Studio setup
Create the exact folders and ModuleScripts/Scripts matching the paths in this directory. ReplicatedStorage/Shared contains the two ModuleScripts. ServerScriptService contains the server Script. Roblox Studio is required to assemble and test the place.

## Update preferences
The UpdatePreferences module provides Always, Stable only (default), and Never modes. PlayerPreferences.server.lua persists choices and exposes a RemoteEvent named UpdatePreferenceChanged. A client Settings UI should invoke FireServer with one of: always, stable, never. Roblox itself manages client application updates; these options control only custom in-game release announcements. Never mode must also suppress automatic release-network checks in any future client-side announcement service.

## Content parity roadmap
The source README documents the house, garden, twenty city venues, reproducible city generation codes, sanity, day/night, difficulties, endings and the Watcher anomaly. Do not substitute invented citizens or places for canonical data. First export canonical venue/NPC records from the PC source; then implement streamed Roblox locations, NPC schedules, dialogue, replicated anomaly state and persistence.

## Watcher behaviour
Build a server-authoritative encounter state machine (Dormant, Observe, Shadow, Distort, Pursue, Cooldown). Drive visual and audio effects locally; validate line of sight, hiding spots, collision and multiplayer fairness server-side. Prefer suspense over frequent jumpscares.

## Lobby and shop
Build a detailed streaming-enabled lobby with matchmaking, class preview, cosmetics, achievements and an update board. ClassCatalog.lua contains four provisional balanced archetypes. Use Roblox HumanoidDescription for previews and actual avatar customization, and validate any currency transactions on the server.

## Compatibility
Do not rewrite historical release tags, alter their save keys, or replace the current stable release. Use this branch for incremental development and Roblox Studio validation.
