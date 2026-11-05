-- Native Roblox avatar rigs. API-created R15 with a self-contained R6 fallback.
local Players=game:GetService("Players")
local Factory={}
local skin=Color3.fromRGB(194,170,144)
-- Curated NPC presentation pools; no gender is inferred from real Roblox users.
local looks={
 Female={hair={451220849,915267638,915267120},shirts={398634295,398635081,144076436,4047886060}},
 Male={hair={63690008,16630147,376548738,417457139},shirts={607785314,144076358,398633584,4047884046}},
}
local complexions={Color3.fromRGB(234,204,170),Color3.fromRGB(199,156,119),Color3.fromRGB(148,105,77),Color3.fromRGB(100,72,55)}
local trousers={382537569,382538503,129458426,398634487}
function Factory.randomStyle(name,gender,rng)
 local pool=looks[gender] or looks.Female
 return {name=name,gender=gender,skin=complexions[rng:NextInteger(1,#complexions)],
  shirt=Color3.fromRGB(235,231,220),pants=Color3.fromRGB(72,75,78),
  hairAsset=pool.hair[rng:NextInteger(1,#pool.hair)],shirtAsset=pool.shirts[rng:NextInteger(1,#pool.shirts)],
  pantsAsset=trousers[rng:NextInteger(1,#trousers)],height=rng:NextNumber(0.94,1.04),width=rng:NextNumber(0.88,1.02)}
end
local function fallback(style)
 local model=Instance.new("Model")
 local function part(name,size,color)
  local p=Instance.new("Part") p.Name=name p.Size=size p.Color=color p.Material=Enum.Material.SmoothPlastic
  p.TopSurface=Enum.SurfaceType.Smooth p.BottomSurface=Enum.SurfaceType.Smooth p.Parent=model
  return p
 end
 local root=part("HumanoidRootPart",Vector3.new(2,2,1),skin) root.Transparency=1
 local torso=part("Torso",Vector3.new(2,2,1),style.shirt)
 local head=part("Head",Vector3.new(2,1,1),style.skin or skin)
 local mesh=Instance.new("SpecialMesh") mesh.MeshType=Enum.MeshType.Head mesh.Scale=Vector3.new(1.25,1.25,1.25) mesh.Parent=head
 local la=part("Left Arm",Vector3.new(1,2,1),style.shirt)
 local ra=part("Right Arm",Vector3.new(1,2,1),style.shirt)
 local ll=part("Left Leg",Vector3.new(1,2,1),style.pants)
 local rl=part("Right Leg",Vector3.new(1,2,1),style.pants)
 local function joint(name,a,b,c0,c1)
  local m=Instance.new("Motor6D") m.Name=name m.Part0=a m.Part1=b m.C0=c0 m.C1=c1 m.Parent=a
  b.CFrame=a.CFrame*c0*c1:Inverse()
 end
 joint("RootJoint",root,torso,CFrame.new(),CFrame.new())
 joint("Neck",torso,head,CFrame.new(0,1,0),CFrame.new(0,-0.5,0))
 joint("Left Shoulder",torso,la,CFrame.new(-1.5,0.5,0),CFrame.new(0,0.5,0))
 joint("Right Shoulder",torso,ra,CFrame.new(1.5,0.5,0),CFrame.new(0,0.5,0))
 joint("Left Hip",torso,ll,CFrame.new(-0.5,-1,0),CFrame.new(0,1,0))
 joint("Right Hip",torso,rl,CFrame.new(0.5,-1,0),CFrame.new(0,1,0))
 local h=Instance.new("Humanoid") h.RigType=Enum.HumanoidRigType.R6 h.Parent=model
 model.PrimaryPart=root
 return model
end
function Factory.create(style)
 local description=Instance.new("HumanoidDescription")
 description.HeadColor=style.skin or skin
 local armColor=style.shirtAsset and (style.skin or skin) or style.shirt
 description.LeftArmColor=armColor description.RightArmColor=armColor description.TorsoColor=style.shirt
 description.LeftLegColor=style.pants description.RightLegColor=style.pants
 if style.hairAsset then description.HairAccessory=tostring(style.hairAsset) end
 if style.shirtAsset then description.Shirt=style.shirtAsset end
 if style.pantsAsset then description.Pants=style.pantsAsset end
 description.HeightScale=style.height or 1
 description.WidthScale=style.width or 1
 local ok,model=pcall(function() return Players:CreateHumanoidModelFromDescriptionAsync(description,Enum.HumanoidRigType.R15) end)
 description:Destroy()
 if not ok or not model then model=fallback(style) end
 model.Name=style.name
 local root=model:FindFirstChild("HumanoidRootPart")
 local humanoid=model:FindFirstChildOfClass("Humanoid")
 model.PrimaryPart=root
 humanoid.DisplayDistanceType=Enum.HumanoidDisplayDistanceType.None
 humanoid.BreakJointsOnDeath=false
 humanoid.MaxHealth=1000000 humanoid.Health=1000000
 if not style.faceless then
  local head=model:FindFirstChild("Head")
  if head and not head:FindFirstChildOfClass("Decal") then
   local face=Instance.new("Decal") face.Name="face" face.Texture="rbxasset://textures/face.png" face.Face=Enum.NormalId.Front face.Parent=head
  end
 else
  for _,p in ipairs(model:GetDescendants()) do if p:IsA("Decal") then p:Destroy() end end
 end
 local head=model:FindFirstChild("Head")
 if head and not style.watcher and not model:FindFirstChildWhichIsA("Accessory") then
  local hair=Instance.new("Part") hair.Name="Hair" hair.Size=Vector3.new(head.Size.X*1.04,head.Size.Y*0.4,head.Size.Z*1.04)
  hair.Color=style.hair or Color3.fromRGB(43,39,33) hair.CanCollide=false hair.Massless=true
  hair.CFrame=head.CFrame*CFrame.new(0,head.Size.Y*0.4,0) hair.Parent=model
  local round=Instance.new("SpecialMesh") round.MeshType=Enum.MeshType.Sphere round.Parent=hair
  local weld=Instance.new("WeldConstraint") weld.Part0=head weld.Part1=hair weld.Parent=hair
 end
 if style.watcher and head then
  local function detail(name,size,cf,color,attach,glow)
   local p=Instance.new("Part") p.Name=name p.Size=size p.CFrame=cf p.Color=color
   p.CanCollide=false p.Massless=true p.Material=glow and Enum.Material.Neon or Enum.Material.Fabric
   if glow then p.Transparency=0.35 end
   p.Parent=model
   local w=Instance.new("WeldConstraint") w.Part0=attach w.Part1=p w.Parent=p
  end
  local cloth=Color3.fromRGB(12,17,17)
  detail("WatcherHoodTop",Vector3.new(head.Size.X*1.16,0.18,head.Size.Z*1.16),head.CFrame*CFrame.new(0,head.Size.Y*0.56,0),cloth,head)
  for _,side in ipairs({-1,1}) do
   detail("WatcherHoodSide",Vector3.new(0.12,head.Size.Y*1.1,head.Size.Z*1.12),head.CFrame*CFrame.new(side*head.Size.X*0.56,0,0),cloth,head)
   detail("WatcherEye",Vector3.new(0.07,0.035,0.035),head.CFrame*CFrame.new(side*head.Size.X*0.19,0.08,-head.Size.Z*0.51),Color3.fromRGB(158,169,146),head,true)
  end
  for _,name in ipairs({"LeftHand","RightHand","Left Arm","Right Arm"}) do
   local hand=model:FindFirstChild(name)
   if hand then
    for finger=-1,1 do
     detail("WatcherFinger",Vector3.new(0.06,0.65,0.09),hand.CFrame*CFrame.new(finger*0.17,-hand.Size.Y/2-0.22,-0.12),Color3.fromRGB(50,57,52),hand)
    end
   end
  end
 end
 for _,p in ipairs(model:GetDescendants()) do
  if p:IsA("BasePart") then p.CanCollide=false p.CanTouch=false p.CanQuery=false p.Massless=true end
 end
 root.Massless=false
 if style.scale then model:ScaleTo(style.scale) end
 model:SetAttribute("SpareRoomAvatar",true)
 if style.gender then model:SetAttribute("Gender",style.gender) end
 return model
end
function Factory.place(model,point)
 local root=model.PrimaryPart
 local h=model:FindFirstChildOfClass("Humanoid")
 local height=h.RigType==Enum.HumanoidRigType.R6 and 3*model:GetScale() or h.HipHeight+root.Size.Y/2
 model:PivotTo(CFrame.new(point+Vector3.new(0,height,0)))
end
return Factory
