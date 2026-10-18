# The Spare Room v1.5.1 — Windows desktop

1. Download `The-Spare-Room-Setup-1.5.1-x64.exe` from the GitHub release.
2. Run the installer, choose a destination, and finish installation.
3. Open **The Spare Room** from the desktop or Start menu. No browser, Python, or internet connection is needed to play.

The installer includes the game, its assets and the Electron runtime. It targets 64-bit Windows 10/11. It is unsigned, so Windows may show an unrecognised-publisher warning. It includes no automatic updater, login, or online dependency. Use a future installer to update it.

WASD: walk. Shift: sprint. Space: jump. Click the game: capture mouse. E / click: interact. Esc: release mouse. F11 or the game toolbar: fullscreen. Ctrl+Q: quit.

Progress saves on this PC under `%APPDATA%\The Spare Room`. The desktop app starts with its own save; browser progress is not automatically imported. Uninstalling preserves saved progress. Starting a new game resets that run but keeps the ending journal.

The release also contains a browser-build ZIP. That ZIP is separate from the installer. A SHA-256 checksum for the installer is included in `SHA256SUMS.txt`.

Build from source: install Node.js 24, run `npm ci`, then `npm start` to play locally or `npm run desktop:win` on Windows to create the installer. `npm test` checks game mechanics and asset packaging. The Windows release workflow additionally installs the actual installer and launches the installed game twice to verify rendering, local assets, blocked networking, and saved progress after restart. These checks do not replace manual visual and gameplay testing on your PC.
