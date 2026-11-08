-- Server-authoritative, persistent shards and permanent class unlocks.
-- Every write merges in UpdateAsync; no whole-cache save on leave.
local Economy={}
function Economy.new(deps)
 local self={profiles={},locks={},pending={}}
 local function clean(d)
  d=d or {} d.balance=d.balance or 0 d.owned=d.owned or {Wanderer=true}
  d.owned.Wanderer=true d.selected=d.selected or "Wanderer"
  d.claims=d.claims or {} d.receipts=d.receipts or {} d.revision=d.revision or 0
  if not deps.classes[d.selected] or not d.owned[d.selected] then d.selected="Wanderer" end
  return d
 end
 function self:publish(p)
  local d=self.profiles[p]
  if not d then return end
  deps.send(p,{balance=d.balance,owned=d.owned,selected=d.selected,persistent=d.persistent==true})
 end
 function self:load(p)
  if self.locks[p] then return end
  self.locks[p]=true
  local ok,data=pcall(function() return deps.store:GetAsync("u:"..p.UserId) end)
  local d=clean(ok and data or nil) d.persistent=ok
  if deps.present(p) then self.profiles[p]=d self:publish(p) end
  self.locks[p]=nil
  if not ok then deps.status(p,"Practice lobby: saving is unavailable. Classes and Robux packs are disabled; Wanderer is free.") end
 end
 function self:write(p,change)
  -- Do not let overlapping receipt/reward/menu requests overwrite the local display.
  while self.locks[p] do deps.wait() end
  if not deps.present(p) then return false end
  self.locks[p]=true
  local ok,data=pcall(function()
   return deps.store:UpdateAsync("u:"..p.UserId,function(old)
    local d=clean(old) change(d) d.revision+=1 return d
   end)
  end)
  if ok and deps.present(p) then data.persistent=true self.profiles[p]=data self:publish(p) end
  self.locks[p]=nil
  return ok,data
 end
 function self:class(p)
  local d=self.profiles[p]
  return d and d.selected or "Wanderer"
 end
 function self:unlock(p,id)
  local c=deps.classes[id]
  if not c or not deps.lobby(p) then return end
  local d=self.profiles[p]
  if not d or not d.persistent then deps.status(p,"Class saving is unavailable. Wanderer is still free.") return end
  local ok,data=self:write(p,function(row)
   if not row.owned[id] and row.balance>=c.cost then row.balance-=c.cost row.owned[id]=true end
   if row.owned[id] then row.selected=id end
  end)
  if not ok then deps.status(p,"Could not save the class change. Please retry.")
  elseif data.selected~=id then deps.status(p,"Not enough Memory Shards. Earn them by finding new diary pages and endings.") end
 end
 function self:award(p,key,amount)
  local d=self.profiles[p]
  if not d or not d.persistent or d.claims[key] then return end
  local ok=self:write(p,function(row)
   if not row.claims[key] then row.claims[key]=true row.balance+=amount end
  end)
  if not ok then deps.status(p,"A shard reward could not be saved. Discover it again when saving is available.") end
 end
 function self:receipt(info)
  local amount=deps.products[info.ProductId]
  if not amount or type(info.PurchaseId)~="string" or info.PurchaseId=="" then return false end
  local p=deps.player(info.PlayerId) if not p then return false end
  local ok=self:write(p,function(row)
   if not row.receipts[info.PurchaseId] then row.receipts[info.PurchaseId]=true row.balance+=amount end
  end)
  if ok then self.pending[p]=nil deps.status(p,"Memory Shards saved. You can spend them on permanent classes in the lobby.") end
  return ok -- acknowledge only after benefit and receipt ID are durably saved together
 end
 function self:buy(p,id)
  local d=self.profiles[p]
  if not deps.lobby(p) or not deps.products[id] or not deps.ready() or self.pending[p] then return end
  if not d or not d.persistent then deps.status(p,"Purchases are disabled while saving is unavailable.") return end
  -- Probe the ledger immediately before checkout; never charge against a known outage.
  local ok=self:write(p,function() end)
  if not ok then deps.status(p,"Purchase storage is unavailable. Nothing was opened.") return end
  self.pending[p]=true
  local shown=pcall(function() deps.market:PromptProductPurchase(p,id) end)
  if not shown then self.pending[p]=nil deps.status(p,"Roblox checkout could not open. Please try later.") end
 end
 function self:closed(p,id) if deps.products[id] then self.pending[p]=nil end end
 function self:forget(p) self.profiles[p]=nil self.pending[p]=nil end
 return self
end
return Economy
