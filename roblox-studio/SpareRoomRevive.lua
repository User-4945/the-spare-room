-- Server receipt ledger: one developer product buys one revive credit.
-- Purchase-window completion is never proof of payment.
local Revive={}
function Revive.new(deps)
 local gate={pending={},busy={}}
 local function status(p,message) deps.status(p,message) end
 local function ledger(p,change)
  return deps.store:UpdateAsync("user:"..p.UserId,function(old)
   local data=old or {purchases={},credits=0}
   data.purchases=data.purchases or {} data.credits=data.credits or 0
   -- Recover a reservation after a server crash. A short lease prevents two servers consuming it.
   if data.claim and deps.now()-data.claim.at>180 then data.credits+=1 data.claim=nil end
   change(data)
   return data
  end)
 end
 function gate:consume(p)
  if self.busy[p] or not deps.canRevive(p) then return false end
  self.busy[p]=true
  local token=deps.token()
  local ok,data=pcall(ledger,p,function(d)
   if not d.claim and d.credits>0 then d.credits-=1 d.claim={token=token,at=deps.now()} end
  end)
  if not ok then self.busy[p]=nil status(p,"Revive storage is unavailable. No new purchase was opened; try again shortly.") return false end
  if not data.claim or data.claim.token~=token then
   self.busy[p]=nil
   if data.claim then status(p,"Your previous revive is still processing. Please wait before trying again.") end
   return false,data.claim~=nil
  end
  local loaded,result=pcall(deps.revive,p)
  local success=loaded and result==true
  local saved=pcall(ledger,p,function(d)
   if d.claim and d.claim.token==token then
    d.claim=nil
    if not success then d.credits+=1 end
   end
  end)
  self.busy[p]=nil
  if not success then status(p,"Character loading failed. Your paid revive is saved; try again shortly.")
  elseif not saved then status(p,"You revived. Purchase storage is catching up.") end
  return success,true
 end
 function gate:request(p)
  if not deps.canRevive(p) or self.busy[p] then return end
  if deps.productId<=0 or not deps.ready() then status(p,"Revive setup pending. The creator must connect a developer product. Restart is free.") return end
  if self.pending[p] then status(p,"Finish or close the Roblox purchase window first.") return end
  -- Check persistence before checkout. Never prompt when the ledger cannot be read.
  local ok,data=pcall(ledger,p,function() end)
  if not ok then status(p,"Purchase storage is unavailable. Try later; restarting is free.") return end
  if data.credits>0 or data.claim then self:consume(p) return end
  self.pending[p]=true
  local shown=pcall(function() deps.market:PromptProductPurchase(p,deps.productId) end)
  if not shown then self.pending[p]=nil status(p,"The purchase window could not open. Restart is free.") end
 end
 function gate:receipt(info)
  if info.ProductId~=deps.productId or deps.productId<=0 or not info.PurchaseId then return false end
  local p=deps.player(info.PlayerId)
  if not p then return false end
  local purchase=tostring(info.PurchaseId)
  local ok=pcall(ledger,p,function(d)
   if not d.purchases[purchase] then d.purchases[purchase]=true d.credits+=1 end
  end)
  if not ok then return false end -- Roblox retries an unacknowledged receipt.
  self.pending[p]=nil
  deps.defer(function() if deps.canRevive(p) then self:consume(p) else status(p,"Your revive credit is saved for your next sanity death.") end end)
  return true
 end
 function gate:purchaseFinished(p,id)
  if id~=deps.productId then return end
  self.pending[p]=nil -- only a verified receipt can grant a credit
  status(p,"If purchased, Roblox is verifying your revive. Otherwise you can try again or restart for free.")
 end
 function gate:forget(p) self.pending[p]=nil end
 return gate
end
return Revive
