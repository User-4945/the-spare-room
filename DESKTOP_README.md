# The Spare Room v.2.1.0 — Windows prerelease

Install `The-Spare-Room-Setup-2.1.0-x64.exe` on Windows 10/11 x64, then launch from the desktop or Start menu. Gameplay works offline; all game assets and the runtime are included.

## Updates

Use **UPDATES** or **Game → Check for updates** for a manual check. The app also checks once every 24 hours while running and connected. It uses GitHub’s latest stable release only; prereleases are excluded.

When a new stable release is available, select **Update**. The installer downloads, its size and SHA-256 checksum are checked, progress is saved, and the installer runs. The updated game reopens with release notes in a closeable popup. If installation cannot be completed automatically, **Open latest release** opens GitHub for a manual download.

The repository is private. Under **GitHub access**, add a fine-grained personal access token with **Contents: read** permission for `User-4945/the-spare-room`. Create it in GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens. Choose only this repository and read access to Contents. The token is encrypted with Windows credential protection and never bundled into an installer. Remove access from the same settings panel at any time. Without a token, the browser fallback works with your GitHub login.

Previously installed or downloaded copies need a one-time reinstall from a refreshed installer to gain the updater. Each historical installer retains its original game version. The installer is unsigned.

## Controls and saves

WASD: walk. Shift: sprint. Space: jump. Click: capture mouse. E / click: interact. Esc: release mouse. F11: fullscreen. Ctrl+Q: quit.

Saves and the ending journal remain under `%APPDATA%\The Spare Room`. Desktop and browser saves are separate. Updates and uninstalling preserve progress. Starting a new game replaces that run but keeps the ending journal.

## Building

Use Node.js 24. Run `npm ci`, then `npm start` or `npm run desktop:win` on Windows. `npm test` covers gameplay, packaging and update logic. The release workflow rebuilds every release installer and verifies a real installation, restart, release-notes popup and retained save. Installer provenance is attached as `INSTALLER_BUILD.json`.
