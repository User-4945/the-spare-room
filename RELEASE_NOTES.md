# THE SPARE ROOM v2.7.6 — Secrets in the Walls

**Prerelease · Maintenance and secrets update**

A few things needed fixing around the house.

Some papers turned up during the work.

## Fixes and stability

- Fixed sticky-note text and wall-attached collectible overlays showing through opaque upstairs floors and ceilings.
- Added exact segment/box visibility checks, architectural floor-slab occlusion and a geometry-versioned spatial index.
- Improved multi-storey object occlusion and third-person overlay visibility. Genuine openings and exterior stairs remain visible.
- Improved anomaly placement with bounded retries at several distances, floor-height checks and clearance validation.
- Improved collision handling for short movement steps around thin obstacles and door frames.
- Added validation and backup recovery for story saves, while retaining legacy progress and unknown gameplay fields.
- Avoided redundant writes for unchanged story snapshots; added a visible warning if saving fails.
- Reduced procedural texture-generation work on startup and reused the visibility index until geometry changes.
- Improved interaction reliability by applying the same precise occlusion checks to nearby-object selection.
- Updated the admin service endpoint and exact desktop allowlist for the current hosted address, avoiding blocked cross-domain redirects. Existing credentials and server authorization remain unchanged.
- General stability improvements, with regression checks for existing stories, event access, ending paths and updater behaviour.

## Small discoveries

- Added 16 optional Easter eggs throughout the house, upstairs rooms, garden and existing city locations.
- Find household records, hidden objects, a maker’s mark, references to earlier discoveries and a rare answering-wall interaction.
- Added **Unfiled Evidence**, a readable journal unlocked by your first new discovery.
- Added five secret achievements with saved discovery progress.
- New evidence causes no sanity loss and changes no existing ending requirements.
- Admin-assisted stories cannot earn the new achievements. Start a new story to return to normal achievement tracking.

Some documents disagree with the building.

Please retain them for your records.

## Existing content

Weeks 1, 2 and 3 retain their existing access rules and stories. This update adds optional secrets rather than another chapter or new ending paths. Existing ending counts are unchanged. Household evidence remains available after Halloween departs; the tailor’s record requires legitimate access to Velvet & Ash.

## Downloads and updates

Windows installer, universal macOS disk image, Linux AppImage/DEB, browser build, installable web build and matching desktop source are attached with SHA-256 checksums.

This is a **prerelease**, not the stable latest release. Enable prerelease updates in desktop Settings to receive it through the updater, or download a build below. Updates never downgrade an installed newer version. Same-version refresh support is retained.

For an installed web version, use **INSTALL → Save and apply update**. Your existing story, ending journal and preferences are retained.

macOS builds are ad-hoc signed and not notarized. Android, iPhone and iPad use the web build; this release does not include native mobile installers.

## Reporting problems

Include your platform, build revision, world generation code, location and what happened. Mention first-person or third-person view. Screenshots or a short recording help. Please mark hidden discoveries as spoilers.

---

The maintenance record lists one more room than you remember.
