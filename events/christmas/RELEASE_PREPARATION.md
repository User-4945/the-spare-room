# Christmas Week 1 release preparation

Launch authorized: 11 December 2026, 20:00 GMT (20:00 UTC).
GitHub Christmas: v.3.5.0; Roblox Christmas: v3.7.0.
Original baseline: v.3.0.0. Current Roblox: v3.5.0.

The launch automation is authorized to publish and promote without another approval.
Keep Roblox Enabled=false until launch. Preview only with StudioPreview=true in a test session.
The downloadable GitHub prerelease is an explicitly enabled seasonal preview, not a live Roblox activation.

Content: six persistent secrets, three gated Christmas endings, three winter classes,
Santa-themed anomalies, bounded snow and squalls, warm depot decorations, readable day/time,
and a 0.55 sanity multiplier. Existing permanent endings stay available.

Validation: npm test; node tests/christmas.cjs; node tests/christmas-gameplay.cjs.
Build preview: node scripts/prepare-christmas.cjs; node scripts/build-christmas-preview.cjs --preview.
The release-christmas-2026 branch triggers the prerelease build workflow.

Before launch, verify both Roblox places with preview enabled, shelter/snow, ending gates,
classes, queues and return travel. Publish only lobby 121199873496043 and gameplay
123323409173400 in universe 10774844646. Exclude BETA124403669931999.
If access or tests fail, report the blocker instead of claiming a successful release.
The thumbnail is prepared artwork and has not been uploaded live.
