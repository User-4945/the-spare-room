-- ServerScriptService.SpareRoomFlowingWater
local RS=game:GetService("ReplicatedStorage")
if require(RS.SpareRoomPlaceLayout).configure()then return end
local depot=workspace.SpareRoomWorld:WaitForChild("LastBusDepot")
local model=Instance.new("Model")model.Name="AshfieldDrinkingFountain"model.Parent=depot
local function part(name,size,position,color,material)
 local p=Instance.new("Part")p.Name=name p.Size=size p.Position=position p.Color=color p.Material=material or Enum.Material.Concrete
 p.Anchored=true p.Parent=model return p
end
local center=Vector3.new(493,0,46)
part("FountainPedestal",Vector3.new(2,2.7,2),center+Vector3.new(0,1.4,0),Color3.fromRGB(76,83,71))
part("Basin",Vector3.new(4,.35,3),center+Vector3.new(0,2.8,0),Color3.fromRGB(92,103,91),Enum.Material.Marble)
local surface=part("RunningWater",Vector3.new(3.4,.06,2.4),center+Vector3.new(0,3.01,0),Color3.fromRGB(78,119,119),Enum.Material.Glass)
surface.Transparency=.3 surface.Reflectance=.25 surface.CanCollide=false surface.CanQuery=false
local tap=part("Tap",Vector3.new(.3,.8,.3),center+Vector3.new(0,3.35,-.8),Color3.fromRGB(105,112,101),Enum.Material.Metal)
local attachment=Instance.new("Attachment",tap)attachment.Position=Vector3.new(0,.1,.25)
local stream=Instance.new("ParticleEmitter",attachment)stream.Texture="rbxasset://textures/particles/sparkles_main.dds"stream.Rate=24 stream.Lifetime=NumberRange.new(.25,.4)
stream.Speed=NumberRange.new(1.3,2)stream.Acceleration=Vector3.new(0,-10,0)stream.EmissionDirection=Enum.NormalId.Bottom
stream.Size=NumberSequence.new(.065)stream.Transparency=NumberSequence.new(.4)stream.Color=ColorSequence.new(Color3.fromRGB(162,200,196))
local source=RS:FindFirstChild("SpareRoomWeatherAudio")source=source and source:FindFirstChild("Indoor Rain Ambience")
if source then local sound=source:Clone()sound.Name="FlowingWater"sound.Looped=true sound.Volume=.035 sound.RollOffMaxDistance=17 sound.Parent=tap sound:Play()end
local prompt=Instance.new("ProximityPrompt",tap)prompt.ActionText="Run water"prompt.ObjectText="Ashfield drinking fountain"prompt.HoldDuration=.3 prompt.MaxActivationDistance=7
prompt.Triggered:Connect(function(player)
 local root=player.Character and player.Character:FindFirstChild("HumanoidRootPart")
 if root and(root.Position-tap.Position).Magnitude<10 then stream:Emit(12)end
end)
