-- Install in ServerScriptService; config belongs in ReplicatedStorage.
local RS=game:GetService("ReplicatedStorage")
local config=require(RS:WaitForChild("SpareRoomChristmasConfig"))
if not config.Enabled then return end
local run=require(RS:WaitForChild("SpareRoomPlaceLayout")).configure()
local weather=require(RS:WaitForChild("SpareRoomWeather"))
-- Existing roof checks and safe-lobby rules remain authoritative.
weather.Profiles.Rain={rain=0,wind=.25,light=.9,density=.42,drain=1.10,pacing=.95}
weather.Profiles.Storm={rain=0,wind=.65,light=.78,density=.49,drain=1.20,pacing=.85}
weather.Profiles.Mist={rain=0,wind=.1,light=.88,density=.51,drain=1.05,pacing=.95}
workspace:SetAttribute("SpareRoomChristmasActive",true)
if run then return end
local depot=workspace.SpareRoomWorld:WaitForChild("LastBusDepot")
local folder=Instance.new("Folder")folder.Name="AshfieldChristmas"folder.Parent=depot
local function part(name,size,cf,color,material)
 local p=Instance.new("Part")p.Name=name p.Size=size p.CFrame=cf p.Color=color p.Material=material or Enum.Material.Fabric
 p.Anchored=true p.CanCollide=false p.CanTouch=false p.CanQuery=false p.Parent=folder return p
end
for _,p in depot:GetDescendants()do if p:IsA("BasePart")and(p.Name=="SlateRoof"or p.Name=="ShelterRoof")then
 part("SnowCap",Vector3.new(p.Size.X,.12,p.Size.Z),p.CFrame*CFrame.new(0,p.Size.Y/2+.07,0),Color3.fromRGB(166,183,172),Enum.Material.Snow)
end end
for i=0,12 do
 local x=422+i*1.85
 part("ShelterGarland",Vector3.new(2.1,.4,.5),CFrame.new(x,9.2,21.7),Color3.fromRGB(35,58,39),Enum.Material.Grass)
 if i%2==0 then part("WarmFairyLight",Vector3.new(.13,.13,.13),CFrame.new(x,8.9,21.9),Color3.fromRGB(213,173,97),Enum.Material.Neon)end
end
local sayings={
 "Four names on the parcels. A fifth ribbon is already tied.",
 "The Christmas timetable has no destination.",
 "Leave a place for whoever comes home.",
 "The snow is untouched beneath a window wiped from outside.",
 "Tomorrow's diary mentions a bell. No one remembers hanging one.",
}
for i,text in sayings do
 local gift=part("UnclaimedParcel",Vector3.new(1.5,1,.9),CFrame.new(442,.75,10+i*1.6),Color3.fromRGB(80,67+i*4,47))
 gift.CanQuery=true
 local prompt=Instance.new("ProximityPrompt")prompt.ActionText="Inspect"prompt.ObjectText="Unclaimed parcel"
 prompt.MaxActivationDistance=7 prompt.HoldDuration=.5 prompt.Parent=gift
 local times=setmetatable({},{__mode="k"})
 prompt.Triggered:Connect(function(player)
  local root=player.Character and player.Character:FindFirstChild("HumanoidRootPart")
  if not root or(root.Position-gift.Position).Magnitude>10 then return end
  if times[player]and os.clock()-times[player]<3 then return end times[player]=os.clock()
  RS.SpareRoomEvent:FireClient(player,"Caption",text)
 end)
end

