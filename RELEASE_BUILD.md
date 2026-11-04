# v.2.5.0 build record

Game and installer source: `b5b5771592b982fef401d8fc1208705a1e46cbb8`.

[Build and publication workflow](https://github.com/User-4945/the-spare-room/actions/runs/39952541872).

Windows x64, universal macOS and Linux x64 packages passed installed-app checks, Settings checks and save persistence. The Linux job also passed real WebGL rendering and an offline reload with its local server stopped. Each release asset includes its SHA-256 digest; platform build JSON records the game tree and updater commit.

This follow-up commit records verification without rebuilding historical releases. The release tag and installers use the tested game source above.


## v2.7.6 Secrets in the Walls

Push the tested source to `release-v2.7.6`. `release-276.yml` builds and verifies Windows, universal macOS, Linux, browser and PWA downloads, then publishes `v2.7.6` with prerelease=true and make_latest=false. It never moves an existing tag. Matching source, platform build records, BUILD-REFRESH.json and checksums accompany the release. Save schema validation and the backup loader must run before the inline game script; maintenance and wall-secrets run after the existing gameplay modules.
