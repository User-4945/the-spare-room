# The Spare Room v2.0.5 — Windows stable release

Install `The-Spare-Room-Setup-2.0.5-x64.exe` on Windows 10/11 x64, then launch from the desktop or Start menu. Gameplay works offline; all game assets and the runtime are included.

## Updates

Use **UPDATES** or **Game → Check for updates** for a manual check. The app also checks once every 24 hours while running and connected. It uses GitHub’s latest stable release only; prereleases are excluded.

When a new stable release is available, select **Update**. The installer downloads, its size and SHA-256 checksum are checked, progress is saved, and the installer runs. The updated game reopens with release notes in a closeable popup. If installation cannot be completed automatically, **Open latest release** opens GitHub for a manual download.

The repository and releases are public. No GitHub account or token is needed to check for updates, download an installer or use the browser fallback. **Optional GitHub access** lets players add a read-only token if they encounter GitHub request limits. Saved tokens are protected by Windows on that PC and never bundled in an installer. Expired or rejected tokens fall back to public access; **Remove access** clears a saved token.

Previously installed or downloaded copies need a one-time reinstall from a refreshed installer to gain the updater. Each historical installer retains its original game version. The installer is unsigned.

## Controls and saves

WASD: walk. Shift: sprint. Space: jump. Click: capture mouse. E / click: interact. Esc: release mouse. F11: fullscreen. Ctrl+Q: quit.

Saves and the ending journal remain under `%APPDATA%\The Spare Room`. Desktop and browser saves are separate. Updates and uninstalling preserve progress. Starting a new game replaces that run but keeps the ending journal.

## Building

Use Node.js 24. Run `npm ci`, then `npm start` or `npm run desktop:win` on Windows. `npm test` covers gameplay, packaging and update logic. The stable release workflow verifies the sign-only changes, a real installation, and an update from v2.0.0 with automatic restart, release notes and retained saves. Installer provenance is attached as `INSTALLER_BUILD.json`.
