# Owner-only Christmas Week 1 preview

Only Roblox user ID 11080546757 (@00user_4945Official) sees the lobby option. Server request authorization uses the immutable user ID, verifies lobby place, rate-limits requests and teleports exactly that player into a new reserved gameplay server. The access code is never sent to clients.

The destination validates reserved server status, same-universe lobby origin, single-member schema and owner identity before activating Christmas. Other players are rejected from an active preview. Public Enabled=false remains unchanged, including before the scheduled December 11 launch. Config bootstrap resolution is shared between concurrent server scripts and replicated to clients.

Studio tests passed: correct owner request; non-owner/wrong place/public server/wrong private owner/extra member rejection. Owner button visible in lobby and global Christmas remains off. Live reserved-server teleport must be tested in the published Roblox client (Studio cannot teleport). Both lobby and gameplay support were published through Studio.
