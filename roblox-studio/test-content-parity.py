"""Validate imported permanent content and actual server requirement evaluator, not visual parity."""
from pathlib import Path
import json,subprocess,sys,tempfile
r=Path(__file__).parent
source=json.loads((r/'source-content.json').read_text())
assert len(source['cityPlaces'])==20 and len(source['residents'])==6
assert len(source['deepItems'])==59 and len(source['BENEATH']['endings'])==30
assert len(source['legacy']['endings'])==16
server=(r/'SpareRoomServer.server.lua').read_text()
a=server.index('local function sourceRequirements(');b=server.index('local function interact(',a)
checks='''
local Content=require("./Content") local Config=require("./Config")
local function count(t) local n=0 for _ in pairs(t) do n+=1 end return n end
'''+server[a:b]+'''
local s={diary={},evidence={},flags={},anomalies={},sanity=50}
for _,n in ipairs(Content.deepItems) do
 if n.type=="diary" then s.diary[n.number]=true else s.evidence[n.id]=true end
end
for _,actions in pairs(Content.deepActions) do for _,action in ipairs(actions) do s.flags[action[1]]=true end end
s.flags.mum=true -- existing Mum conversation supplies this original requirement
for _,anomaly in ipairs(Content.BENEATH.anomalies) do s.anomalies["source:"..anomaly.id]=true end
for _,e in ipairs(Content.BENEATH.endings) do
 s.sanity=e.requirements.sanityMin or math.min(50,e.requirements.sanityMax or 100)
 assert(sourceRequirements(s,e.requirements),"Unreachable imported requirements: "..e.id)
 local empty={diary={},evidence={},flags={},anomalies={},sanity=50}
 assert(not sourceRequirements(empty,e.requirements),"Imported ending starts ungated: "..e.id)
 assert(Config.Endings["deep:"..e.id].title==e.name)
end
assert(count(Config.Endings)==68,"Wrong total ending definitions")
assert(#Config.Anomalies==37,"Wrong anomaly catalogue")
assert(#Config.Diary==20 and Config.Diary[1]==Content.BENEATH.diary[1].text)
for _,pack in ipairs(Config.ShardPacks) do assert(pack.productId~=Config.ReviveProductId) end
print("PASS: 20 source venues, six source residents, 59 collectibles, 30 gated underground endings, 16 original house/garden paths and 68 total outcome definitions")
'''
with tempfile.TemporaryDirectory() as t:
 p=Path(t)
 (p/'Content.lua').write_text((r/'SpareRoomContent.lua').read_text())
 (p/'Config.lua').write_text((r/'SpareRoomConfig.lua').read_text().replace('require(script.Parent:WaitForChild("SpareRoomContent"))','require("./Content")'))
 (p/'test.lua').write_text(checks)
 subprocess.run([sys.argv[1] if len(sys.argv)>1 else 'luau',str(p/'test.lua')],check=True)
