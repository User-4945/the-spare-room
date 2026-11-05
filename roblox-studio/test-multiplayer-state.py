"""Exercise real server state functions with two lightweight player stubs; not an engine test."""
from pathlib import Path
import subprocess,sys,tempfile
root=Path(__file__).parent
source=(root/'SpareRoomServer.server.lua').read_text()
def function(name):
 start=source.index('local function '+name+'(')
 end=source.index('\nlocal function ',start+1)
 return source[start:end]
stubs='''
local Config=require("./Config")
local states={}
local remote={events={}}
function remote:FireClient(player,action,data) table.insert(self.events,{player=player,action=action,data=data}) end
local CFrame={new=function(...) return {...} end}
local function snapshot(player) end
local function saveJournal(player,s) end
local function position(player) return {} end
local function makePlayer(name)
 local character={}
 function character:FindFirstChildOfClass() return {Health=100} end
 function character:PivotTo(cf) end
 return {Name=name,Character=character}
end
'''
checks='''
local a,b=makePlayer("A"),makePlayer("B")
reset(a,"Easy") reset(b,"Hard")
assert(states[a]~=states[b])
states[a].diary[1]=true states[a].records.test=true states[a].key=true
states[a].reading={cost=4} states[a].sandwichAt=120 states[a].time=10
assert(paused(states[a]) and not paused(states[b]),"A menu paused another player")
assert(not states[b].diary[1] and not states[b].records.test and not states[b].key,"Evidence is shared")
assert(states[b].sandwichAt==0 and states[b].time==0,"Cooldown or timer is shared")
damage(a,10)
assert(states[a].sanity==92.5 and states[b].sanity==100,"Sanity leaked across players")
finish(a,"consumed")
assert(states[a].ended=="consumed" and states[b].ended==nil,"Ending stopped another player")
assert(states[a].journal.consumed and not states[b].journal.consumed,"Journal shared")
reset(a,"Intermediate")
assert(states[a].sanity==100 and not states[a].diary[1] and states[a].journal.consumed,"Restart failed")
assert(states[b].mode=="Hard" and states[b].sanity==100 and states[b].ended==nil)
for _,event in ipairs(remote.events) do
 if event.action=="Ending" or event.action=="SanityHit" then assert(event.player==a,"Private event broadcast") end
end
print("PASS: two-player evidence, sanity, pauses, cooldowns, endings, journals and restarts remain independent")
'''
with tempfile.TemporaryDirectory() as d:
 p=Path(d)
 (p/'Config.lua').write_text((root/'SpareRoomConfig.lua').read_text())
 (p/'test.lua').write_text(stubs+function('paused')+'\n'+function('finish')+'\n'+function('damage')+'\n'+function('reset')+'\n'+checks)
 subprocess.run([sys.argv[1] if len(sys.argv)>1 else 'luau',str(p/'test.lua')],check=True)
