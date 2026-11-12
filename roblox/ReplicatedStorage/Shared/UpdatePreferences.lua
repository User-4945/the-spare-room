-- The Spare Room: update notification policy (Roblox announcements only).
-- Roblox experience binaries are deployed by Roblox, not by this module.
local Preferences = {}
Preferences.ALWAYS = "always"
Preferences.STABLE = "stable"
Preferences.NEVER = "never"
Preferences.DEFAULT = Preferences.STABLE
function Preferences.normalize(value)
 if value == Preferences.ALWAYS or value == Preferences.STABLE or value == Preferences.NEVER then return value end
 return Preferences.DEFAULT
end
function Preferences.shouldNotify(preference, release)
 preference = Preferences.normalize(preference)
 if preference == Preferences.NEVER then return false end
 if type(release) ~= "table" or type(release.version) ~= "string" then return false end
 if preference == Preferences.STABLE and release.prerelease == true then return false end
 return true
end
return Preferences
