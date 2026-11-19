-- StarterPlayer.StarterPlayerScripts.SpareRoomWeatherPresentation
local Players=game:GetService("Players")
local RS=game:GetService("ReplicatedStorage")
local Run=game:GetService("RunService")
local SoundService=game:GetService("SoundService")
local Tween=game:GetService("TweenService")
local UIS=game:GetService("UserInputService")
local player=Players.LocalPlayer
local assets=RS:WaitForChild("SpareRoomWeatherAudio")
local rainPart=Instance.new("Part")rainPart.Name="AshfieldLocalRainVolume"rainPart.Size=Vector3.new(30,.1,30)rainPart.Transparency=1 rainPart.Anchored=true rainPart.CanCollide=false rainPart.CanTouch=false rainPart.CanQuery=false rainPart.Parent=workspace
local emitter=Instance.new("ParticleEmitter")emitter.Name="Rain"emitter.Texture=assets.AshfieldRainTexture.Texture emitter.Rate=0 emitter.Lifetime=NumberRange.new(.55,.8)emitter.Speed=NumberRange.new(55,68)emitter.EmissionDirection=Enum.NormalId.Bottom emitter.SpreadAngle=Vector2.new(3,3)emitter.Size=NumberSequence.new(.3)emitter.Squash=NumberSequence.new(2)emitter.Transparency=NumberSequence.new({NumberSequenceKeypoint.new(0,.35),NumberSequenceKeypoint.new(.8,.22),NumberSequenceKeypoint.new(1,1)})emitter.Color=ColorSequence.new(Color3.fromRGB(179,195,182))emitter.LightInfluence=.65 emitter.LightEmission=.12 emitter.Orientation=Enum.ParticleOrientation.VelocityParallel emitter.Parent=rainPart
local function sound(name,parent,volume)
 local source=assets:FindFirstChild(name)if not source then return end
 local s=source:Clone()s.Looped=true s.Volume=volume or 0 s.RollOffMode=Enum.RollOffMode.InverseTapered s.RollOffMinDistance=8 s.RollOffMaxDistance=65 s.Parent=parent s:Play()return s
end
local mix=Instance.new("SoundGroup")mix.Name="AshfieldWeatherMix"mix.Volume=.55 mix.Parent=SoundService
local rain=sound("Indoor Rain Ambience",SoundService,0)local wind=sound("Wind Ambience",SoundService,0)
if rain then rain.SoundGroup=mix end if wind then wind.SoundGroup=mix end
local busSound
task.spawn(function()
 if workspace:GetAttribute("SpareRoomRole")~="Lobby"then return end
 local world=workspace:WaitForChild("SpareRoomWorld")
 local depot=world:WaitForChild("LastBusDepot",30)local bus=depot and depot:FindFirstChild("TheLastBus")
 local body=bus and bus:FindFirstChild("Chassis")
 if body then busSound=sound("Bus engine idle",body,.18)if busSound then busSound.SoundGroup=mix end end
end)
local params=RaycastParams.new()params.FilterType=Enum.RaycastFilterType.Exclude params.RespectCanCollide=true
local timer=0 local sheltered=false local wasSheltered=false
Run.RenderStepped:Connect(function(dt)
 timer+=dt
 local root=player.Character and player.Character:FindFirstChild("HumanoidRootPart")
 if not root then emitter.Enabled=false return end
 if timer>.25 then timer=0
  local ignore={player.Character,rainPart}local npc=workspace:FindFirstChild("SpareRoomNPCs")if npc then table.insert(ignore,npc)end params.FilterDescendantsInstances=ignore
  sheltered=root.Position.Y< -6 or workspace:Raycast(root.Position+Vector3.new(0,1.8,0),Vector3.new(0,45,0),params)~=nil
  player:SetAttribute("AshfieldSheltered",sheltered)
 end
 local intensity=workspace:GetAttribute("SpareRoomWeatherRain")or .6 local gust=workspace:GetAttribute("SpareRoomWeatherWind")or .3
 rainPart.CFrame=CFrame.new(root.Position+Vector3.new(0,18,0))
 emitter.Enabled=not sheltered and intensity>.01
 if sheltered and not wasSheltered then emitter:Clear()end wasSheltered=sheltered
 local target=(UIS.TouchEnabled and 180 or 500)*intensity
 emitter.Rate+=(target-emitter.Rate)*math.min(1,dt*.7)
 emitter.Acceleration=Vector3.new(gust*9,-12,gust*3)
 if rain then local goal=intensity*(sheltered and .055 or .15)rain.Volume+=(goal-rain.Volume)*math.min(1,dt)end
 if wind then local goal=gust*(sheltered and .025 or .09)wind.Volume+=(goal-wind.Volume)*math.min(1,dt)end
end)
