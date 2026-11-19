local W={}
W.Profiles={
 Clear={rain=0,wind=.15,light=1,density=.28,drain=1,pacing=1},
 Rain={rain=.6,wind=.3,light=.86,density=.42,drain=1.18,pacing=.9},
 Storm={rain=1,wind=.8,light=.7,density=.48,drain=1.4,pacing=.75},
 Mist={rain=0,wind=.1,light=.8,density=.55,drain=1.1,pacing=.85},
 Wind={rain=0,wind=1,light=.9,density=.34,drain=1.12,pacing=.9},
}
function W.profile(name)W.Profiles.Snow={rain=0,wind=.2,light=.9,density=.42,drain=1.05,pacing=1}
W.Profiles.Snowstorm={rain=0,wind=.7,light=.76,density=.52,drain=1.15,pacing=.9}
return W.Profiles[name or workspace:GetAttribute("SpareRoomWeather")]or W.Profiles.Rain end
function W.effects(name,sheltered,night)
 local p=W.profile(name)
 return {drain=sheltered and 1 or p.drain*(night and 1.08 or 1),pacing=p.pacing,light=p.light,density=p.density}
end
local cache=setmetatable({},{__mode="k"})
function W.sheltered(player,root)
 if not root then return true end if root.Position.Y< -6 then return true end
 local c=cache[player]if c and os.clock()-c.time<.8 and (c.point-root.Position).Magnitude<8 then return c.sheltered end
 local params=RaycastParams.new()params.FilterType=Enum.RaycastFilterType.Exclude
 local ignore={player.Character}local npcs=workspace:FindFirstChild("SpareRoomNPCs")if npcs then table.insert(ignore,npcs)end params.FilterDescendantsInstances=ignore params.RespectCanCollide=true
 local hit=workspace:Raycast(root.Position+Vector3.new(0,1.8,0),Vector3.new(0,45,0),params)
 local sheltered=hit~=nil
 cache[player]={time=os.clock(),point=root.Position,sheltered=sheltered}
 return sheltered
end
function W.safeVisualEvent(isLobby,paused,queued)return isLobby and not paused and not queued end
return W