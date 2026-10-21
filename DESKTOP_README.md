# The Spare Room v.2.1.0 — Windows prerelease

Install `The-Spare-Room-Setup-2.1.0-x64.exe` on Windows 10/11 x64, then launch from the desktop or Start menu. Gameplay works offline; all game assets and the runtime are included.

## Settings and updates

Open **SETTINGS** or **Game → Settings**. **Check for updates** uses the saved update preference. **Include prerelease updates** is off by default. Check it to also receive newer prereleases, then click **Save preferences** to save the choice and check immediately. Leave it unchecked for GitHub’s latest stable release only. Automatic checks run once every 24 hours while open and connected. A newer installed version is never downgraded, even after opting out of prereleases.

When an eligible new release is available, select **Update**. The installer downloads, its size and SHA-256 checksum are checked, progress is saved, and the installer runs. The updated game reopens with release notes in a closeable popup. If installation cannot be completed automatically, **Open release page** opens GitHub for a manual download.

The repository and releases are public. No GitHub account or token is needed to check for updates, download an installer or use the browser fallback. **Optional GitHub access** lets players add a read-only token if they encounter GitHub request limits. Saved tokens are protected by Windows on that PC and never bundled in an installer. Expired or rejected tokens fall back to public access; **Remove access** clears a saved token.

Previously installed or downloaded copies need a one-time reinstall from a refreshed installer to gain Settings. Each historical installer retains its original game version. Its matching desktop-source ZIP includes that game and the updated desktop code. The installer is unsigned.

## Controls and saves

WASD: walk. Shift: sprint. Space: jump. Click: capture mouse. E / click: interact. Esc: release mouse. F11: fullscreen. Ctrl+Q: quit.

Saves, update preferences and the ending journal remain under `%APPDATA%\The Spare Room`. Desktop and browser saves are separate. Updates and uninstalling preserve progress. Starting a new game replaces that run but keeps the ending journal.

## Building

Use Node.js 24. Run `npm ci`, then `npm start` or `npm run desktop:win` on Windows. `npm test` covers gameplay, packaging and update logic. The desktop-refresh workflow rebuilds every release installer from its own game tag, verifies Settings and saved preferences across restarts, and tests real stable and opt-in prerelease upgrades with reopening, release notes and retained saves. Installer provenance is attached as `INSTALLER_BUILD.json`.
