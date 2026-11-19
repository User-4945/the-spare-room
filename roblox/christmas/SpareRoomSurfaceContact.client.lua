-- LocalScript for StarterPlayerScripts in Beneath the House.
local deadline = os.clock() + 25
while workspace:GetAttribute("SpareRoomChristmasActive") ~= true and os.clock() < deadline do
 task.wait(.2)
end
if workspace:GetAttribute("SpareRoomChristmasActive") ~= true then return end

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local player = Players.LocalPlayer
local random = Random.new()
local effects = Instance.new("Folder")
effects.Name = "AshfieldContactEffects"
effects.Parent = workspace

local function plate(name)
 local part = Instance.new("Part")
 part.Name = name
 part.Anchored = true
 part.CanCollide = false
 part.CanTouch = false
 part.CanQuery = false
 part.CastShadow = false
 part.Transparency = 1
 part.Parent = effects
 return part
end

local rings, prints, impacts = {}, {}, {}
for i = 1, 8 do
 local part = plate("FootRipple")
 part.Size = Vector3.new(1,.01,1)
 local surface = Instance.new("SurfaceGui")
 surface.Face = Enum.NormalId.Top
 surface.CanvasSize = Vector2.new(64,64)
 surface.LightInfluence = .4
 surface.Enabled = false
 surface.Parent = part
 local frame = Instance.new("Frame")
 frame.BackgroundTransparency = 1
 frame.Position = UDim2.fromScale(.1,.1)
 frame.Size = UDim2.fromScale(.8,.8)
 frame.Parent = surface
 local corner = Instance.new("UICorner",frame)
 corner.CornerRadius = UDim.new(1,0)
 local stroke = Instance.new("UIStroke",frame)
 stroke.Color = Color3.fromRGB(188,211,209)
 stroke.Thickness = 2
 rings[i] = {part=part,surface=surface,stroke=stroke}
end
for i = 1, 24 do
 local part = plate("SnowFootprint")
 part.Color = Color3.fromRGB(117,141,147)
 part.Material = Enum.Material.SmoothPlastic
 local mesh = Instance.new("SpecialMesh",part)
 mesh.MeshType = Enum.MeshType.Sphere
 prints[i] = {part=part}
end
for i = 1, 4 do
 local part = plate("ContactBurst")
 local attachment = Instance.new("Attachment",part)
 local burst = Instance.new("ParticleEmitter",attachment)
 burst.Texture = "rbxasset://textures/particles/sparkles_main.dds"
 burst.Rate = 0
 burst.Lifetime = NumberRange.new(.22,.43)
 burst.EmissionDirection = Enum.NormalId.Top
 burst.SpreadAngle = Vector2.new(52,52)
 burst.Parent = attachment
 local sound = Instance.new("Sound",part)
 sound.RollOffMinDistance = 3
 sound.RollOffMaxDistance = 29
 impacts[i] = {part=part,burst=burst,sound=sound}
end

local ringIndex, printIndex, impactIndex = 0, 0, 0
local function ripple(point, size, duration)
 ringIndex = ringIndex % #rings + 1
 local ring = rings[ringIndex]
 if ring.sizeTween then ring.sizeTween:Cancel(); ring.fade:Cancel() end
 ring.part.Position = point
 ring.part.Size = Vector3.new(.16,.01,.16)
 ring.stroke.Transparency = .25
 ring.surface.Enabled = true
 local info = TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
 ring.sizeTween = TweenService:Create(ring.part,info,{Size=Vector3.new(size,.01,size)})
 ring.fade = TweenService:Create(ring.stroke,info,{Transparency=1})
 ring.sizeTween:Play()
 ring.fade:Play()
end

local function footprint(point, forward, strength)
 printIndex = printIndex % #prints + 1
 local print = prints[printIndex]
 if print.fade then print.fade:Cancel() end
 print.part.CFrame = CFrame.lookAt(point,point+forward)
 print.part.Size = Vector3.new(.23+strength*.13,.012,.42+strength*.24)
 print.part.Transparency = .58-strength*.28
 print.fade = TweenService:Create(print.part,TweenInfo.new(16),{Transparency=1})
 print.fade:Play()
end

local function burstAt(point, water, strength, landing)
 impactIndex = impactIndex % #impacts + 1
 local slot = impacts[impactIndex]
 slot.part.Position = point
 local burst = slot.burst
 burst.Color = ColorSequence.new(water and Color3.fromRGB(156,193,207) or Color3.fromRGB(219,234,237))
 burst.Size = NumberSequence.new({
  NumberSequenceKeypoint.new(0,(water and .10 or .16)+strength*.11),
  NumberSequenceKeypoint.new(1,0)
 })
 burst.Speed = NumberRange.new(1+4*strength,3+8*strength)
 burst.Acceleration = Vector3.new(0,water and -35 or -8,0)
 burst:Emit(math.ceil(3+strength*8+(landing and 5 or 0)))
 local sound = slot.sound
 sound:Stop()
 sound.SoundId = water and "rbxasset://sounds/impact_water.mp3" or "rbxasset://sounds/action_footsteps_plastic.mp3"
 sound.PlaybackSpeed = random:NextNumber(.90,1.07)*(water and 1.04 or .78)
 sound.Volume = .12+strength*.25
 sound:Play()
end

local ray = RaycastParams.new()
ray.RespectCanCollide = true
local world = workspace:WaitForChild("SpareRoomWorld")
local snowParts = {}
local function remember(part)
 if part:IsA("BasePart") and part.Name=="OutdoorSnowCover" then snowParts[part]=true end
end
local function watch(folder)
 if folder.Name~="ChristmasSnowScenery" then return end
 folder.ChildAdded:Connect(remember)
 folder.ChildRemoved:Connect(function(part) snowParts[part]=nil end)
 for _, part in folder:GetChildren() do remember(part) end
end
world.ChildAdded:Connect(watch)
local existing=world:FindFirstChild("ChristmasSnowScenery")
if existing then watch(existing) end

local function classify(ground)
 local point = ground.Position
 local puddles = workspace:FindFirstChild("AshfieldLocalPuddles")
 if puddles then
  for _, part in puddles:GetChildren() do
   if part:IsA("BasePart") and part.Name=="RainPuddle" and part.Transparency<.89 and part:GetAttribute("Placed")==true then
    local localPoint = part.CFrame:PointToObjectSpace(point)
    local x,z = localPoint.X/(part.Size.X*.5),localPoint.Z/(part.Size.Z*.5)
    if math.abs(localPoint.Y)<.18 and (part:FindFirstChildOfClass("SpecialMesh") and x*x+z*z<=1 or not part:FindFirstChildOfClass("SpecialMesh") and math.abs(x)<=1 and math.abs(z)<=1) then return "Water",part.Position.Y+.04 end
   end
  end
 end
 for cap in snowParts do
  local offset = cap.CFrame:PointToObjectSpace(point)
  if cap.Parent and math.abs(offset.Y)<.3 and math.abs(offset.X)<=cap.Size.X*.5 and math.abs(offset.Z)<=cap.Size.Z*.5 then
   return "Snow",cap.Position.Y+cap.Size.Y*.5+.016
  end
 end
 if ground.Material==Enum.Material.Snow then return "Snow",point.Y+.02 end
 if ground.Material==Enum.Material.Water then return "Water",point.Y+.03 end
end

local distance, foot, fallSpeed = 0, 1, 0
local airborne, lastPosition, lastCharacter = false, nil, nil
local function react(character, root, strength, landing)
 ray.FilterDescendantsInstances = {character,effects}
 local forward = root.CFrame.LookVector * Vector3.new(1,0,1)
 if forward.Magnitude<.1 then return end
 forward = forward.Unit
 local offset = landing and 0 or foot*.24
 local hit = workspace:Raycast(root.Position+root.CFrame.RightVector*offset,Vector3.new(0,-6,0),ray)
 if not hit or hit.Normal.Y<.8 then return end
 local kind,height = classify(hit)
 if not kind then return end
 local point = Vector3.new(hit.Position.X,height,hit.Position.Z)
 burstAt(point,kind=="Water",strength,landing)
 if kind=="Water" then
  ripple(point,.55+strength*1.3,.48+strength*.2)
  if landing then
   ripple(point+Vector3.yAxis*.009,1.35+strength*1.2,.85)
  end
 else
  footprint(point,forward,strength)
  if landing then footprint(point+root.CFrame.RightVector*.38+Vector3.yAxis*.003,forward,strength) end
 end
 effects:SetAttribute("LastContact",kind)
 effects:SetAttribute("LastLanding",landing)
end

RunService.Heartbeat:Connect(function()
 local character = player.Character
 local root = character and character:FindFirstChild("HumanoidRootPart")
 local humanoid = character and character:FindFirstChildOfClass("Humanoid")
 if not root or not humanoid or humanoid.Health<=0 then lastCharacter=nil; return end
 local position = root.Position
 local velocity = root.AssemblyLinearVelocity
 local grounded = humanoid.FloorMaterial~=Enum.Material.Air
 if character~=lastCharacter or not lastPosition or (position-lastPosition).Magnitude>12 then
  lastCharacter,lastPosition = character,position
  airborne,fallSpeed,distance = not grounded,0,0
  return
 end
 local movement = (position-lastPosition)*Vector3.new(1,0,1)
 lastPosition = position
 if not grounded then
  local state = humanoid:GetState()
  airborne = state==Enum.HumanoidStateType.Freefall or state==Enum.HumanoidStateType.Jumping
  fallSpeed = airborne and math.max(fallSpeed,-velocity.Y) or 0
  distance = 0
  return
 end
 if airborne and fallSpeed>8 then
  react(character,root,math.clamp(fallSpeed/45,.45,1),true)
  airborne,fallSpeed,distance = false,0,0
  return
 end
 airborne,fallSpeed = false,0
 local speed = (velocity*Vector3.new(1,0,1)).Magnitude
 if humanoid.MoveDirection.Magnitude<.1 or speed<2 then distance=0;return end
 local strength = math.clamp((speed-7)/13,.12,.85)
 distance += movement.Magnitude
 if distance>=1.8+strength*.9 then
  distance = 0
  foot = -foot
  react(character,root,strength,false)
 end
end)
