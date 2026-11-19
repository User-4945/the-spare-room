-- StarterPlayer.StarterPlayerScripts.SpareRoomWetSurfaces
local Players=game:GetService("Players")local Run=game:GetService("RunService")
local player=Players.LocalPlayer local pool=Instance.new("Folder")pool.Name="AshfieldLocalPuddles"pool.Parent=workspace
local puddles={}local rng=Random.new()
for i=1,18 do
 local p=Instance.new("Part")p.Name="RainPuddle"p.Size=Vector3.new(rng:NextNumber(2,6),.025,rng:NextNumber(1.5,4))
 p.Anchored=true p.CanCollide=false p.CanTouch=false p.CanQuery=false p.Material=Enum.Material.Glass
 p.Color=Color3.fromRGB(62,82,80)p.Reflectance=.25 p.Transparency=1 p.Parent=pool table.insert(puddles,p)
end
local params=RaycastParams.new()params.FilterType=Enum.RaycastFilterType.Exclude params.RespectCanCollide=true
local wetness=0 local elapsed=0
Run.Heartbeat:Connect(function(dt)
 local root=player.Character and player.Character:FindFirstChild("HumanoidRootPart")if not root then return end
 local rain=workspace:GetAttribute("SpareRoomWeatherRain")or 0
 local desired=rain>.05 and 1 or 0
 wetness=math.clamp(wetness+(desired==1 and dt/9 or -dt/65),0,1)
 elapsed+=dt if elapsed<.5 then return end elapsed=0
 local ignored={player.Character,pool}local npcs=workspace:FindFirstChild("SpareRoomNPCs")if npcs then table.insert(ignored,npcs)end params.FilterDescendantsInstances=ignored
 for _,p in puddles do
  if (p.Position-root.Position).Magnitude>34 or p:GetAttribute("Placed")~=true then
   local point=root.Position+Vector3.new(rng:NextNumber(-27,27),4,rng:NextNumber(-27,27))
   local hit=workspace:Raycast(point,Vector3.new(0,-12,0),params)
   if hit and hit.Normal.Y>.97 and hit.Position.Y<root.Position.Y-1 then
    local roof=workspace:Raycast(hit.Position+Vector3.new(0,.5,0),Vector3.new(0,35,0),params)
    if not roof then p.CFrame=CFrame.new(hit.Position+Vector3.new(0,.035,0))*CFrame.Angles(0,rng:NextNumber(0,6.28),0)p:SetAttribute("Placed",true)else p:SetAttribute("Placed",false)end
   else p:SetAttribute("Placed",false)end
  end
  p.Transparency=p:GetAttribute("Placed")==true and 1-wetness*.62 or 1
 end
end)
