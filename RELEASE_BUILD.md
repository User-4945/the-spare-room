# v.2.5.0 build record

Game and installer source: `b5b5771592b982fef401d8fc1208705a1e46cbb8`.

[Build and publication workflow](https://github.com/User-4945/the-spare-room/actions/runs/39952541872).

Windows x64, universal macOS and Linux x64 packages passed installed-app checks, Settings checks and save persistence. The Linux job also passed real WebGL rendering and an offline reload with its local server stopped. Each release asset includes its SHA-256 digest; platform build JSON records the game tree and updater commit.

This follow-up commit records verification without rebuilding historical releases. The release tag and installers use the tested game source above.


## v2.7.6 Secrets in the Walls

Push the tested source to `release-v2.7.6`. `release-276.yml` builds and verifies Windows, universal macOS, Linux, browser and PWA downloads, then publishes `v2.7.6` with prerelease=true and make_latest=false. It never moves an existing tag. Matching source, platform build records, BUILD-REFRESH.json and checksums accompany the release. Save schema validation and the backup loader must run before the inline game script; maintenance and wall-secrets run after the existing gameplay modules.

The initial v2.7.6 run 41869823906 verified all native packages and the new secrets/prompt WebGL checks, then encountered an obsolete pre-unlock assertion in event-art QA after the public unlock date. The final workflow reuses its verified Windows/macOS artifacts and rebuilds Linux with the same revision, verifies identical game-tree provenance, reruns the remaining WebGL/offline checks and publishes from `release-v2.7.6-final`. No gameplay files changed between these test-only commits.

Live verification also detected that the old hosted URL redirects to the current `the-spare-room.udammi26.chatgpt.site` origin. v2.7.6 therefore updates the exact admin endpoint/CSP/network policy and rebuilds all three platforms in `release-276-publish.yml` from `release-v2.7.6-publish`. Earlier installers are not reused in the final release.

The final product tree is bef2f7204d266910220f55558012c2c55b606d1d. Its Windows package passed and its Linux run passed the new secrets, prompts, event art, Halloween and offline WebGL suites. An obsolete Week 2 smoke expected a procession indoors; only that test fixture is corrected. `release-276-linux-final.yml` rebuilds Linux with the same revision and tests the remaining Week 2/3/admin graphics, then combines it with the verified Windows and fallback universal Mac packages. The publisher verifies identical dist, desktop and platforms Git trees before accepting reused artifacts.
