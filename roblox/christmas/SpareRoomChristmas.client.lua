-- Install in StarterPlayerScripts. Only a bounded local snow volume is rendered.
local RS=game:GetService("ReplicatedStorage")
local config=require(RS:WaitForChild("SpareRoomChristmasConfig"))
if not require(RS:WaitForChild("SpareRoomChristmasBootstrap")).active() or not config.Snow then return end
local Players=game:GetService("Players")local Run=game:GetService("RunService")
local player=Players.LocalPlayer local UIS=game:GetService("UserInputService")
local volume=Instance.new("Part")volume.Name="AshfieldLocalSnow"volume.Transparency=1
volume.Size=Vector3.new(32,.1,32)volume.Anchored=true volume.CanCollide=false volume.CanTouch=false volume.CanQuery=false volume.Parent=workspace
local snow=Instance.new("ParticleEmitter")snow.Texture="rbxasset://textures/particles/sparkles_main.dds"
snow.EmissionDirection=Enum.NormalId.Bottom snow.Lifetime=NumberRange.new(3,5)snow.Speed=NumberRange.new(5,8)
snow.Size=NumberSequence.new(.065)snow.Transparency=NumberSequence.new(.6)
snow.Color=ColorSequence.new(Color3.fromRGB(204,220,209))snow.LightInfluence=.8 snow.Rate=0 snow.Parent=volume
local params=RaycastParams.new()params.FilterType=Enum.RaycastFilterType.Exclude params.RespectCanCollide=true
local clock=0 local sheltered=true
Run.RenderStepped:Connect(function(dt)
 local root=player.Character and player.Character:FindFirstChild("HumanoidRootPart")
 if not root then snow.Enabled=false return end
 clock+=dt if clock>=.25 then clock=0
  params.FilterDescendantsInstances={player.Character,volume,workspace:FindFirstChild("SpareRoomNPCs")}
  sheltered=root.Position.Y< -6 or workspace:Raycast(root.Position+Vector3.new(0,1.8,0),Vector3.new(0,45,0),params)~=nil
 end
 volume.CFrame=CFrame.new(root.Position+Vector3.new(0,16,0))
 if sheltered and snow.Enabled then snow:Clear()end snow.Enabled=not sheltered
 local weather=workspace:GetAttribute("SpareRoomWeather")
 local factor=weather=="Snowstorm"and 1 or weather=="Snow"and .6 or 0
 snow.Rate=(UIS.TouchEnabled and config.MobileSnowRate or config.DesktopSnowRate)*factor
 snow.Acceleration=Vector3.new(weather=="Storm"and 2 or .3,-1,0)
end)

