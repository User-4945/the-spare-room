# Install The Spare Room

Each release's packages preserve that release's game content. v2.0.5 is the latest stable release; v.2.1.0 is the preview with anomalies.

## Windows
Run the x64 Setup.exe. Existing Windows settings, updates and saves are retained.

## Mac
Download the mac-universal.dmg for your chosen release, open it and drag The Spare Room into Applications. The universal app includes Apple Silicon and Intel code. The build is ad-hoc signed and has no Apple notarization: macOS may require you to approve it in System Settings → Privacy & Security after an initial launch attempt. Do this only if you trust this download; do not disable Gatekeeper globally.

## Linux
For Debian/Ubuntu x64, download the .deb and use `sudo apt install ./The-Spare-Room-VERSION-linux-x64.deb` with the actual filename. For other x64 distributions, make the AppImage executable with `chmod +x The-Spare-Room-VERSION-linux-x64.AppImage`, then launch it. AppImage environments need FUSE; distributions that block unprivileged user namespaces may need their supported Electron/AppImage sandbox configuration. Do not disable the sandbox globally.

Mac and Linux Settings support daily checks, manual checks and the saved prerelease preference. Use Open release page to download the correct platform package; Windows EXEs are never run on another OS. Mac/Linux updates are installed manually. Saves live under ~/Library/Application Support/The Spare Room on Mac and $XDG_CONFIG_HOME/The Spare Room (usually ~/.config/The Spare Room) on Linux.

## Android, iPhone and iPad
Stable: https://the-spare-room.sunsetjelly6.chatgpt.site/stable/
Preview: https://the-spare-room.sunsetjelly6.chatgpt.site/

Open the chosen link in your mobile browser and tap INSTALL. Android Chrome: use Install app or Add to Home screen. iPhone/iPad Safari: Share → Add to Home Screen → Add; enable Open as Web App if shown. Open the installed app once online and wait for Ready to play offline. After that, the cached game can start offline. Saves stay on this device; stable and preview saves are separate. Clearing browser/site storage removes both cached files and that app's saves.

These are installable home-screen web apps, not native APK/IPA files or store listings. Native store distribution would need platform-specific packaging, signing accounts and store review. No store account is needed to install this web version.

Drag to look, use movement buttons to walk, RUN and JUMP, and USE to interact. Landscape and the fullscreen control give the game more room. Backgrounding pauses the game and saves progress. An available offline web update is applied only through Save and apply update.

## Self-host a specific version
Extract that release's installable-web.zip and serve its contents over HTTPS. Do not open index.html through a file URL. Each archive contains the manifest, icons and versioned offline cache for that exact release. localhost may be used for development. Preserve the same hosting origin/path to keep installed app identity and saves.

## Building native packages
On Mac/Linux, use Node.js 24, npm ci, node scripts/prepare-desktop.cjs, then npx electron-builder --config platforms/electron-builder.cjs --mac (or --linux) --publish never. Use a Mac to build the DMG. node scripts/prepare-pwa.cjs prepares the mobile web build. CI verifies original game file hashes, builds each release separately, launches each desktop package twice and checks saves and Settings.
