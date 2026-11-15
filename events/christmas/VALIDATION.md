# Validation — 15 November 2026

GitHub workflow 43724713989 passed. v.3.5.0 is a prerelease with web preview, source ZIP, checksums and metadata. v.3.0.0 remains the stable baseline. The native installer is not included in this preview.

Original tests pass: baseline suite, disabled seasonal adapter, six persistent secrets, three gated Christmas endings, class modifier and Santa visual pool.

Roblox Studio lobby test: Storm rain enabled (approximately 487 particles/sec), 18 visible pooled puddles; Clear disables rain. Flowing fountain exists. Clock displays DAY 1 and in-game time at size 16. A weather cycle end/local syntax issue was fixed and retested.

Temporary Christmas Studio preview: v3.7.0, 0.55 weather sanity multiplier, all three winter classes, Snowstorm and local snow volume. Each of the three seasonal endings rejects missing flags, accepts complete flags, and commits successfully through EndingRules. This checks server rules, not full player traversal of every ending.

Christmas config restored to Enabled=false, StudioPreview=false before saving lobby revision 74. ServerStorage staging remains inactive. Current live publication was NOT completed; publish lobby and gameplay weather fixes after connection recovery. No current gameplay-place publish is claimed. Separate run traversal, multiplayer travel and mobile visual checks remain outstanding.

Only publish lobby 121199873496043 and gameplay 123323409173400; exclude BETA124403669931999. Current weather scripts are stored under roblox/current and seasonal scripts under roblox/christmas. Apply with a backup and the proper Instance classes/locations; do not replace unrelated project content.
