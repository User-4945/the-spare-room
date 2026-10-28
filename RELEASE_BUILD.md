# v.2.5.0 build record

Game and installer source: `b5b5771592b982fef401d8fc1208705a1e46cbb8`.

[Build and publication workflow](https://github.com/User-4945/the-spare-room/actions/runs/39952541872).

Windows x64, universal macOS and Linux x64 packages passed installed-app checks, Settings checks and save persistence. The Linux job also passed real WebGL rendering and an offline reload with its local server stopped. Each release asset includes its SHA-256 digest; platform build JSON records the game tree and updater commit.

This follow-up commit records verification without rebuilding historical releases. The release tag and installers use the tested game source above.

## Refreshes without changing the game version

Use `.github/workflows/same-version-refresh.yml` on `same-version-refresh` for same-version installer refreshes. Its prepare step preserves each release's shipped desktop-source archive (verified against GitHub's SHA-256), while v2.7.5 takes the current complete `dist` so new web fixes can ship there. Keep older release features isolated.

Every build embeds `release.json.build_revision`, computed from the GitHub run ID (stable across retries). All platforms for one run share the same increasing revision. The publisher validates all seven releases and all platforms before uploading. It uploads `BUILD-REFRESH.json` last for each release, after the installers and matching sources are available. Do not publish a newer revision before the matching installers.

The updater compares semantic version first, then build revision only for the same version. Daily checks and Settings → Check for updates use the same rules. Stable is the default channel. An installed prerelease can refresh its own exact tag even when other prereleases are disabled; it cannot downgrade to an older stable version. Windows uses the existing checksum-verified installer flow. Mac and Linux link to the exact selected release.

Installers shipped before revision-aware updates need a one-time manual reinstall. The new installer embeds its revision, preventing a repeated offer for the same build. Pending update notes are confirmed against both the version and revision before being shown. Existing save/profile paths and preferences remain unchanged.
