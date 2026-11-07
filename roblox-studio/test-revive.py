"""Real consumable gate under mocked Roblox services; never spends Robux."""
from pathlib import Path
import subprocess,sys,tempfile
root=Path(__file__).parent
checks='''
local Revive=require("./Revive")
local p={UserId=4945} local q={UserId=9999}
local dead={[p]=true,[q]=true}
local rows={} local failed=false local loadingFails=false local count=0 local prompts=0 local clock=1000
local store={}
function store:UpdateAsync(key,fn)
 if failed then error("storage offline") end
 local value=fn(rows[key]) rows[key]=value return value
end
local market={}
function market:PromptProductPurchase(player,id) assert(id==123) prompts+=1 end
local deferred={}
local function flush() local tasks=deferred deferred={} for _,f in ipairs(tasks) do f() end end
local function make(id)
 return Revive.new({productId=id,market=market,store=store,ready=function() return true end,
 now=function() return clock end,token=function() count+=1 return "token"..count end,
 player=function(id) return id==4945 and p or id==9999 and q or nil end,
 canRevive=function(player) return dead[player]==true end,
 revive=function(player) if loadingFails then return false end dead[player]=false return true end,
 defer=function(f) table.insert(deferred,f) end,status=function() end})
end
local gate=make(123)
gate:request(p) gate:request(p) assert(prompts==1)
gate:purchaseFinished(p,123) assert(dead[p],"Prompt close granted a revive")
assert(not gate:receipt({ProductId=999,PlayerId=4945,PurchaseId="bad"}))
assert(not gate:receipt({ProductId=123,PlayerId=42,PurchaseId="absent"}))
local r={ProductId=123,PlayerId=4945,PurchaseId="purchase-1"}
assert(gate:receipt(r)) flush() assert(not dead[p] and dead[q])
dead[p]=true
assert(gate:receipt(r)) flush() assert(dead[p],"Duplicate receipt gave a free second revive")
gate:request(p) assert(prompts==2,"Second death did not request a new purchase")
failed=true
assert(not gate:receipt({ProductId=123,PlayerId=4945,PurchaseId="purchase-2"}))
gate:purchaseFinished(p,123) gate:request(p) assert(prompts==2,"Prompted with storage offline")
failed=false loadingFails=true
assert(gate:receipt({ProductId=123,PlayerId=4945,PurchaseId="purchase-2"})) flush()
assert(dead[p] and rows['user:4945'].credits==1,"Failed respawn lost paid benefit")
loadingFails=false gate:request(p) assert(not dead[p] and prompts==2)
-- A late receipt after a free restart banks the benefit for a later death.
assert(gate:receipt({ProductId=123,PlayerId=4945,PurchaseId="purchase-3"})) flush()
assert(rows['user:4945'].credits==1)
dead[p]=true gate:request(p) assert(not dead[p] and rows['user:4945'].credits==0)
-- A stale claim recovers after a crash, but a live claim blocks checkout.
dead[q]=true rows['user:9999']={purchases={},credits=0,claim={token='old',at=clock}}
gate:request(q) assert(prompts==2 and dead[q])
clock+=181 gate:request(q) assert(not dead[q])
local zero=make(0) dead[q]=true zero:request(q) assert(prompts==2 and dead[q])
print("PASS: repeat purchases, cancelled/unverified checkout, duplicate/wrong/offline receipts, failed respawn recovery, late credits, claim recovery and player isolation")
'''
server=(root/'SpareRoomServer.server.lua').read_text()
assert 'BindReceiptHandler' in server and 'PromptProductPurchaseFinished' in server
assert 'ProcessReceipt =' not in server and 'PromptGamePassPurchase' not in server
assert 'Players.CharacterAutoLoads = false' in server
assert 's.ended=nil s.sanity=Config.ReviveSanity' in server
with tempfile.TemporaryDirectory() as d:
 p=Path(d);(p/'Revive.lua').write_text((root/'SpareRoomRevive.lua').read_text());(p/'test.lua').write_text(checks)
 subprocess.run([sys.argv[1] if len(sys.argv)>1 else 'luau',str(p/'test.lua')],check=True)
