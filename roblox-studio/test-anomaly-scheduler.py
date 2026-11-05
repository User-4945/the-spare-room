"""Run the actual pure Luau scheduler against its config, without claiming engine tests."""
from pathlib import Path
import re, subprocess, sys, tempfile
root = Path(__file__).parent
server = (root/'SpareRoomServer.server.lua').read_text()
client = (root/'SpareRoomClient.client.lua').read_text()
config = (root/'SpareRoomConfig.lua').read_text()
section = config.split(' Anomalies = {',1)[1].split('\n Endings = {',1)[0]
ids = re.findall(r'id = "([^"]+)"', section)
assert len(ids) == 10 and len(set(ids)) == 10
for id in ids:
    assert f'data.id == "{id}"' in client, f'Missing construction: {id}'
    assert f'active.id == "{id}"' in client, f'Missing animation: {id}'
assert 'duration = s.active.duration' in server and 'elapsed >= s.active.duration' in server
assert 'mouseButton.Modal=cursorFree' in client
start = server.index('local function nextNaturalAnomaly(s)')
end = server.index('local function eventPoint(player)',start)
scheduler = server[start:end]
with tempfile.TemporaryDirectory() as d:
    folder=Path(d)
    (folder/'Config.lua').write_text(config)
    (folder/'test.lua').write_text('local Config=require("./Config")\n'+scheduler+'''
math.randomseed(4945)
local s = {}
local last = nil
for cycle=1,1000 do
 local seen={}
 for i=1,#Config.Anomalies do
  local a=nextNaturalAnomaly(s)
  assert(not seen[a.id],"Repeated before all anomaly types were drawn")
  assert(a.id~=last,"Repeated across cycle boundary")
  seen[a.id]=true
  last=a.id
 end
end
local other={}
nextNaturalAnomaly(other)
assert(#other.anomalyBag==9 and #s.anomalyBag==0,"Player schedules are shared")
print("PASS: 10,000 natural draws; every type per cycle; no adjacent repeats; independent player bags")
''')
    subprocess.run([sys.argv[1] if len(sys.argv)>1 else 'luau',str(folder/'test.lua')],check=True)
print('PASS: all ten anomalies have constructors and animation handlers; shared duration and modal mouse unlock hooks')
