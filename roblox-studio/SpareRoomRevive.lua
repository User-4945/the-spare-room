-- Server-only entitlement gate. A pass is permanent, never a per-death consumable.
local Revive={}
function Revive.new(deps)
 local gate={pending={},busy={},owned={}}
 local function status(player,message) deps.status(player,message) end
 local function verify(player)
  if gate.owned[player] then return true end
  local ok,owns=pcall(function() return deps.market:UserOwnsGamePassAsync(player.UserId,deps.passId) end)
  if ok and owns then gate.owned[player]=true end
  return ok and owns==true,ok
 end
 local function grant(player)
  if not deps.canRevive(player) then return end
  deps.revive(player)
 end
 function gate:request(player)
  if not deps.canRevive(player) or self.busy[player] then return end
  if deps.passId<=0 then status(player,"Revive pass setup pending. You can still restart for free.") return end
  if self.pending[player] then status(player,"Finish or close the Roblox purchase window first.") return end
  self.busy[player]=true
  local owns,ok=verify(player)
  self.busy[player]=nil
  if not deps.canRevive(player) then return end
  if not ok and not owns then status(player,"Roblox could not verify ownership. Please try again; nothing was granted.") return end
  if owns then grant(player) return end
  self.pending[player]=true
  local shown=pcall(function() deps.market:PromptGamePassPurchase(player,deps.passId) end)
  if not shown then self.pending[player]=nil status(player,"The purchase window could not open. You can restart for free.") end
 end
 function gate:purchaseFinished(player,id,purchased)
  if id~=deps.passId or not self.pending[player] then return end
  self.pending[player]=nil
  if not purchased then status(player,"Purchase cancelled or unavailable. Your run is still here; restart is free.") return end
  local owns=verify(player)
  if owns then grant(player)
  else status(player,"Ownership is still updating. Press Revive again to recheck; do not buy a second pass.") end
 end
 function gate:forget(player)
  self.pending[player]=nil self.busy[player]=nil self.owned[player]=nil
 end
 return gate
end
return Revive
