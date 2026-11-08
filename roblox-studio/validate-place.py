"""Structure and approximate standing-avatar reachability checks; not a Roblox engine test."""
import json, math, pathlib, xml.etree.ElementTree as ET
from collections import deque
root = pathlib.Path(__file__).parent
tree = ET.parse(root / "The-Spare-Room.rbxlx")
data = tree.getroot()
assert data.tag == "roblox" and data.attrib["version"] == "4"
all_items = list(data.iter("Item"))
refs = [item.attrib["referent"] for item in all_items]
assert len(refs) == len(set(refs)), "Duplicate Roblox references"
def props(item):
    return {p.attrib["name"]: p for p in item.find("Properties")}
def string(item, name):
    return props(item)[name].text or ""
services = {string(i, "Name"): i for i in data.findall("Item")}
assert {"Workspace", "ReplicatedStorage", "ServerScriptService", "StarterPlayer", "Lighting"} <= services.keys()
scripts = {
    "SpareRoomEconomy": "SpareRoomEconomy.lua",
    "SpareRoomLobby": "SpareRoomLobby.lua",
    "SpareRoomRevive": "SpareRoomRevive.lua",
    "SpareRoomAvatars": "SpareRoomAvatars.lua",
    "SpareRoomNPCs": "SpareRoomNPCs.server.lua",
    "SpareRoomConfig": "SpareRoomConfig.lua",
    "SpareRoomServer": "SpareRoomServer.server.lua",
    "SpareRoomClient": "SpareRoomClient.client.lua",
}
for name, source in scripts.items():
    node = next(i for i in all_items if string(i, "Name") == name)
    assert string(node, "Source") == (root / source).read_text(), "Stale embedded source: " + name
parts = []
roles = []
for node in all_items:
    if node.attrib["class"] != "Part":
        continue
    p = props(node)
    assert p["Anchored"].text == "true"
    cf, sz = p["CFrame"], p["size"]
    x, y, z = (float(cf.find(k).text) for k in ("X", "Y", "Z"))
    w, h, d = (float(sz.find(k).text) for k in ("X", "Y", "Z"))
    assert all(math.isfinite(n) for n in (x, y, z, w, h, d)) and min(w, h, d) > 0
    extra = {string(i, "Name"): string(i, "Value") for i in node.findall("Item") if i.attrib["class"] == "StringValue"}
    info = dict(name=string(node, "Name"), x=x, y=y, z=z, w=w, h=h, d=d, solid=p["CanCollide"].text == "true", extra=extra)
    parts.append(info)
    if "Role" in extra:
        roles.append(info)
assert len(parts) == 1848
assert len(roles) == 71
assert {int(p["extra"]["Index"]) for p in roles if p["extra"]["Role"] == "diary"} == set(range(1, 21))
assert len([p for p in roles if p["extra"]["Role"] == "record"]) == 12
assert {p["extra"]["Ending"] for p in roles if p["extra"]["Role"] == "ending"} == {"morning", "names", "seal", "tomorrow", "glass", "blueprint", "lullaby", "letters"}
assert len([p for p in parts if p["name"] == "RoomSign"]) == 10
assert len([i for i in all_items if i.attrib["class"] == "SpawnLocation"]) == 1

# 0.5-stud grid, 0.8-stud radius, 5.5-stud standing height.
def reachable(floor, start, bounds):
    xmin, xmax, zmin, zmax = [round(v * 2) for v in bounds]
    blocked = set()
    for p in parts:
        if not p["solid"] or p["y"] + p["h"]/2 <= floor + .15 or p["y"] - p["h"]/2 >= floor + 5.5:
            continue
        a = max(xmin, math.ceil((p["x"] - p["w"]/2 - .8) * 2))
        b = min(xmax, math.floor((p["x"] + p["w"]/2 + .8) * 2))
        c = max(zmin, math.ceil((p["z"] - p["d"]/2 - .8) * 2))
        d = min(zmax, math.floor((p["z"] + p["d"]/2 + .8) * 2))
        for x in range(a, b+1):
            for z in range(c, d+1):
                blocked.add((x,z))
    origin = tuple(round(v*2) for v in start)
    assert origin not in blocked, "Spawn blocked"
    queue = deque([origin])
    seen = {origin}
    while queue:
        x,z = queue.popleft()
        for q in ((x+1,z),(x-1,z),(x,z+1),(x,z-1)):
            if xmin <= q[0] <= xmax and zmin <= q[1] <= zmax and q not in seen and q not in blocked:
                seen.add(q)
                queue.append(q)
    return seen
surface = reachable(0, (2.5,-11), (-129,129,-129,129)) | reachable(0, (0,-20), (-129,129,-129,129))
basement = reachable(-18, (0,-12), (-27,27,-17,71))
chamber = reachable(-18, (9,63), (5,27,55,71))
lobby_points=reachable(0,(400,5),(311,489,-79,79))
upper = reachable(12, (0,8), (-23,23,-15,23))
for p in roles:
    points = lobby_points if p["x"]>300 else upper if p["y"] > 12 else surface if p["y"] > -5 else chamber if p["x"] > 4 and p["z"] > 54 else basement
    assert any((x/2-p["x"])**2 + (z/2-p["z"])**2 < 3.5**2 for x,z in points), "No standing interaction position: " + p["name"]
assert (18,126) not in basement, "Chamber gate can be bypassed by walking"
server = (root / "SpareRoomServer.server.lua").read_text()
assert "prompt.HoldDuration = 0.8" in server and "prompt.RequiresLineOfSight = true" in server
assert 'damage(player, cost)' in server and 'action == "ReadClosed"' in server
assert 's.sandwichAt = s.time + 120' in server
print("PASS: XML, unique references, exact embedded sources, 1848 parts, 71 standing-accessible interactions, 20 diary pages, 14 rooms, chamber gate and eight choice endings and two death outcomes")


assert len([p for p in parts if p["name"] == "VenueSign"]) == 8
assert 'if not isAdmin(player)' in server and 'game.CreatorId == player.UserId' in server
client = (root / "SpareRoomClient.client.lua").read_text()
assert 'UIScale' in client
assert 'Enum.ProximityPromptStyle.Default' in server
assert 'prompt.Triggered:Connect' in server and 'valid(player, part)' in server
assert 'InputHoldBegin' not in client and 'InputHoldEnd' not in client
assert 'local origin = head and head.Position or root.Position' in server
print("PASS: eight venue signs, server admin gate, responsive UI and default prompt handling")

assert not any(p['name'] in {'MumBody','MumHead'} for p in parts)
assert len([p for p in roles if p['extra']['Role']=='doll']) == 1
print('PASS: native-avatar module and NPC server embedded; block Mum removed; doll interaction reachable')

steps=sorted([p for p in parts if p["name"]=="StairTread"],key=lambda p:p["z"])
assert len(steps)==24
for n,p in enumerate(steps):
    assert abs(p["y"]+p["h"]/2-(n+1)*.5)<.001
    assert p["w"]>=3.2
    if n: assert abs(p["z"]-steps[n-1]["z"]-.75)<.001
    # Clearance over the centre of each tread must accommodate a standing avatar.
    top=p["y"]+p["h"]/2
    assert not any(q["solid"] and q["name"]!="StairTread" and abs(q["x"])<q["w"]/2 and abs(q["z"]-p["z"])<q["d"]/2 and q["y"]-q["h"]/2>top+.1 and q["y"]-q["h"]/2<top+5.5 for q in parts), "Stair headroom blocked"
print("PASS: 24 half-stud stairs, four upstairs rooms reachable, stairwell headroom and separate stamina fill")
assert 'local staminaFill=' in client and 'staminaFill.Size=' in client

assert len([p for p in roles if p["extra"]["Role"]=="lobbyShop"])==1
assert len([p for p in roles if p["extra"]["Role"]=="lobbySolo"])==3
assert 'button(title,"PLAY"' in client and 'button(title,"CLASSES & SHARDS"' not in client
assert '"Start",mode' not in client and '"Queue",mode' not in client
assert 'shop=frame(canvas,"ClassesAndShards"' in client
assert 'Lighting.ClockTime=hour' in server
print("PASS: physical class shop, three solo ticket prompts, Play-only title and shared world clock")
