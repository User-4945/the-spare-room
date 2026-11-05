"""Exercise the real entitlement gate with fake Marketplace responses; never charges Robux."""
from pathlib import Path
import subprocess,sys,tempfile
root=Path(__file__).parent
checks='''
local Revive=require("./Revive")
local p={UserId=4945}
local q={UserId=9999}
local ownership={}
local dead={[p]=true,[q]=true}
local grants,prompts,statuses=0,0,0
local failCheck,failPrompt=false,false
local market={}
function market:UserOwnsGamePassAsync(id,pass)
 if failCheck then error("offline") end
 assert(pass==123)
 return ownership[id]==true
end
function market:PromptGamePassPurchase(player,id)
 if failPrompt then error("unavailable") end
 assert(id==123) prompts+=1
end
local function deps(id)
 return {market=market,passId=id,canRevive=function(player) return dead[player]==true end,
 revive=function(player) grants+=1 dead[player]=false end,status=function() statuses+=1 end}
end
local gate=Revive.new(deps(123))
gate:request(p) gate:request(p)
assert(prompts==1 and grants==0,"Duplicate prompt or unverified grant")
gate:purchaseFinished(p,999,true)
assert(grants==0 and gate.pending[p],"Wrong pass accepted")
gate:purchaseFinished(p,123,false)
assert(grants==0 and dead[p],"Cancelled purchase revived")
gate:request(p) gate:purchaseFinished(p,123,true)
assert(grants==0,"Unowned purchase completion granted")
ownership[p.UserId]=true
gate:request(p)
assert(grants==1 and not dead[p],"Owned pass did not revive")
dead[p]=true
local before=prompts
gate:request(p)
assert(grants==2 and prompts==before,"Permanent owner charged twice")
gate:request(q)
assert(grants==2 and gate.pending[q],"Another player got the benefit")
ownership[q.UserId]=true
gate:purchaseFinished(q,123,true)
assert(grants==3 and not dead[q],"Verified purchase did not revive")
gate:purchaseFinished(q,123,true)
assert(grants==3,"Duplicate completion granted twice")
gate:forget(p)
dead[p]=true ownership[p.UserId]=false failCheck=true
gate:request(p)
assert(grants==3 and prompts==before+1,"Failed ownership check prompted or granted")
failCheck=false failPrompt=true
gate:request(p)
assert(not gate.pending[p] and grants==3,"Failed prompt left a pending lock")
failPrompt=false
local zero=Revive.new(deps(0))
zero:request(p)
assert(grants==3 and not zero.pending[p],"Unconfigured pass allowed purchase")
print("PASS: configured/owned/unowned, cancellation, false completion, wrong pass, duplicate completion, retries and per-player isolation")
'''
server=(root/'SpareRoomServer.server.lua').read_text()
assert 'Players.CharacterAutoLoads = false' in server
assert 'if humanoid then humanoid.Health=0 end' in server
assert 'MarketplaceService.PromptGamePassPurchaseFinished:Connect' in server
assert 's.ended=nil s.sanity=Config.ReviveSanity' in server
assert 's.diary = {}' not in server[server.index('local function revivePlayer'):server.index('local reviveGate=')]
with tempfile.TemporaryDirectory() as d:
 p=Path(d)
 (p/'Revive.lua').write_text((root/'SpareRoomRevive.lua').read_text())
 (p/'test.lua').write_text(checks)
 subprocess.run([sys.argv[1] if len(sys.argv)>1 else 'luau',str(p/'test.lua')],check=True)
print('PASS: sanity death kills the character; revive uses verified server ownership and preserves evidence')
