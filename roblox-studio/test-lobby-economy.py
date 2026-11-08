"""Exercise real lobby and economy modules with fake services; no Robux is spent."""
from pathlib import Path
import subprocess,sys,tempfile
root=Path(__file__).parent
checks=r'''
local Economy=require("./Economy") local Lobby=require("./Lobby") local Config=require("./Config")
assert(Config.ShardPacks[1].productId==3729646165 and Config.ShardPacks[1].amount==50)
assert(Config.ShardPacks[2].productId==3729646314 and Config.ShardPacks[2].amount==150)
assert(Config.ShardPacks[3].productId==3729646477 and Config.ShardPacks[3].amount==1000)
for _,pack in ipairs(Config.ShardPacks) do assert(pack.productId~=Config.ReviveProductId) end
local p={UserId=1} local q={UserId=2} local r={UserId=3} local t={UserId=4} local u={UserId=5}
local online={[p]=true,[q]=true,[r]=true,[t]=true,[u]=true}
local waiting={[p]=true,[q]=true,[r]=true,[t]=true,[u]=true}
local rows={} local outage=false local prompts=0 local started={} local saved={}
local function clone(v) if type(v)~="table" then return v end local c={} for k,x in pairs(v) do c[k]=clone(x) end return c end
local store={}
function store:GetAsync(k) if outage then error("offline") end return clone(rows[k]) end
function store:UpdateAsync(k,f)
 if outage then error("offline") end
 -- Simulate UpdateAsync invoking its callback more than once before commit.
 f(clone(rows[k])) local d=f(clone(rows[k])) rows[k]=clone(d) return d
end
local market={} function market:PromptProductPurchase(player,id) assert(id==789) prompts+=1 end
local econ=Economy.new({store=store,classes=Config.Classes,products={[789]=100},market=market,
 ready=function() return true end,wait=function() error("Unexpected concurrent test write") end,
 player=function(id) return id==1 and online[p] and p or id==2 and online[q] and q or nil end,
 lobby=function(x) return waiting[x]==true end,present=function(x) return online[x]==true end,
 status=function() end,send=function(player,data) saved[player]=data end})
econ:load(p) econ:load(q)
assert(saved[p].balance==0 and saved[p].selected=="Wanderer")
econ:unlock(p,"Courier") assert(rows['u:1'].balance==0 and not rows['u:1'].owned.Courier,"Overspent shards")
econ:award(p,"ending:morning",40) econ:award(p,"ending:morning",40)
assert(rows['u:1'].balance==40,"Reward replay or UpdateAsync retry duplicated shards")
econ:buy(p,789) econ:buy(p,789) assert(prompts==1)
econ:closed(p,789) assert(rows['u:1'].balance==40,"Prompt closure granted currency")
local receipt={ProductId=789,PlayerId=1,PurchaseId="one"}
assert(econ:receipt(receipt)) assert(econ:receipt(receipt))
assert(rows['u:1'].balance==140,"Duplicate receipt credited twice")
econ:unlock(p,"Courier") econ:unlock(p,"Courier")
assert(rows['u:1'].balance==40 and econ:class(p)=="Courier","Owned class charged twice")
econ:unlock(p,"Wanderer") assert(rows['u:1'].balance==40 and econ:class(p)=="Wanderer")
waiting[p]=false econ:unlock(p,"Courier") econ:buy(p,789)
assert(econ:class(p)=="Wanderer" and prompts==1,"In-run class swap or checkout accepted")
waiting[p]=true
assert(not econ:receipt({ProductId=999,PlayerId=1,PurchaseId="wrong"}))
outage=true assert(not econ:receipt({ProductId=789,PlayerId=1,PurchaseId="retry"}))
econ:buy(p,789) assert(prompts==1,"Prompted while storage offline")
econ:load(q) assert(not saved[q].persistent and saved[q].selected=="Wanderer")
outage=false assert(econ:receipt({ProductId=789,PlayerId=1,PurchaseId="retry"}))
econ:forget(p) econ:load(p) assert(rows['u:1'].balance==140 and saved[p].owned.Courier,"Rejoin lost progress")
assert(saved[q].balance==0,"Currency leaked to another player")
local queue=Lobby.new({modes=Config.Modes,available=function(x) return waiting[x] and online[x] end,
 send=function() end,status=function() end,move=function() end,
 start=function(x,mode,group) table.insert(started,{p=x,mode=mode,group=group}) waiting[x]=false end})
for _,x in ipairs({p,q,r,t}) do queue:join(x,"Easy") end
queue:join(u,"Easy") assert(not queue.membership[u],"Queue over capacity")
queue:join(p,"Easy") assert(#queue.queues.Easy.players==4,"Duplicate queue entry")
queue:step(14.9) assert(#started==0) queue:leave(t)
queue:step(.1) assert(#started==3 and started[1].group==started[3].group,"Countdown departure wrong")
assert(waiting[t] and not queue.membership[p] and not queue.queues.Easy)
queue:join(u,"Hard") queue:leave(u) queue:step(30) assert(#started==3,"Empty bus departed")
for id,c in pairs(Config.Classes) do assert(c.cost>=0 and c.damage>0 and c.stamina>0 and c.drain>0) end
assert(Config.Classes.Archivist.damage==.8 and Config.Classes.Courier.stamina==.75 and Config.Classes.Caretaker.food==3)
assert(20*2+8*40>=80+100+120,"Earned currency cannot unlock all classes")
print("PASS: atomic shard rewards, receipt retries/duplicates/outages, permanent class spending, free equip, persistence, isolation, 4-seat queues, cancellation and shared departure countdown")
'''
with tempfile.TemporaryDirectory() as d:
 p=Path(d)
 for target,source in [('Economy','SpareRoomEconomy'),('Lobby','SpareRoomLobby'),('Config','SpareRoomConfig')]:
  (p/(target+'.lua')).write_text((root/(source+'.lua')).read_text())
 (p/'test.lua').write_text(checks)
 subprocess.run([sys.argv[1] if len(sys.argv)>1 else 'luau',str(p/'test.lua')],check=True)
