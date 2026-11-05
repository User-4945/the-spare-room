-- Shared, server-owned residents. Individual player menus never freeze the town.
local Players=game:GetService("Players")
local RS=game:GetService("ReplicatedStorage")
local Physics=game:GetService("PhysicsService")
local Pathfinding=game:GetService("PathfindingService")
local Factory=require(RS:WaitForChild("SpareRoomAvatars"))
local folder=Instance.new("Folder") folder.Name="SpareRoomNPCs" folder.Parent=workspace
local templates=Instance.new("Folder") templates.Name="SpareRoomAvatarTemplates" templates.Parent=RS
for _,name in ipairs({"Residents","Explorers"}) do pcall(function() Physics:RegisterCollisionGroup(name) end) end
Physics:CollisionGroupSetCollidable("Residents","Explorers",false)
Physics:CollisionGroupSetCollidable("Residents","Residents",false)
Physics:CollisionGroupSetCollidable("Explorers","Explorers",false)
local function setupPlayer(player)
 local function character(model)
  local function apply(p) if p:IsA("BasePart") then p.CollisionGroup="Explorers" end end
  for _,p in ipairs(model:GetDescendants()) do apply(p) end
  model.DescendantAdded:Connect(apply)
 end
 player.CharacterAdded:Connect(character)
 if player.Character then character(player.Character) end
end
Players.PlayerAdded:Connect(setupPlayer)
for _,p in ipairs(Players:GetPlayers()) do setupPlayer(p) end
local function setup(model,point,anchored)
 model.Parent=folder
 Factory.place(model,point)
 local root=model.PrimaryPart
 root.Anchored=anchored
 if not anchored then root.CanCollide=true root:SetNetworkOwner(nil) end
 for _,p in ipairs(model:GetDescendants()) do if p:IsA("BasePart") then p.CollisionGroup="Residents" end end
 return model:FindFirstChildOfClass("Humanoid")
end
local green=Color3.fromRGB(77,100,87)
local dark=Color3.fromRGB(44,49,49)
local mumRandom=Random.new()
local styles={
 Factory.randomStyle("Mum","Female",mumRandom),
 {name="Watcher",shirt=Color3.fromRGB(15,19,19),pants=Color3.fromRGB(12,16,17),skin=Color3.fromRGB(33,39,37),faceless=true,watcher=true,width=0.7,scale=1.75},
 {name="Doll",shirt=Color3.fromRGB(125,88,86),pants=Color3.fromRGB(162,150,122),skin=Color3.fromRGB(203,192,165),scale=0.48},
}
local function naturalAnimation(model,h)
 local animator=h:FindFirstChildOfClass("Animator") or Instance.new("Animator",h)
 local r15=h.RigType==Enum.HumanoidRigType.R15
 local ids=r15 and {idle=507766666,walk=507777826} or {idle=180435571,walk=180426354}
 local tracks={}
 for name,id in pairs(ids) do
  local anim=Instance.new("Animation") anim.AnimationId="rbxassetid://"..id
  local ok,track=pcall(function() return animator:LoadAnimation(anim) end)
  anim:Destroy()
  if ok then track.Looped=true track.Priority=name=="walk" and Enum.AnimationPriority.Movement or Enum.AnimationPriority.Idle tracks[name]=track end
 end
 if tracks.idle then tracks.idle:Play(0.25,1,0.9+math.random()*0.2) end
 local walking=false
 h.Running:Connect(function(speed)
  local moving=speed>0.5
  if moving~=walking then
   walking=moving
   if tracks.walk then if moving then tracks.walk:Play(0.2) else tracks.walk:Stop(0.25) end end
   if tracks.idle then if moving then tracks.idle:Stop(0.2) else tracks.idle:Play(0.25) end end
  end
  if moving and tracks.walk then tracks.walk:AdjustSpeed(math.clamp(speed/9,0.55,1.3)) end
 end)
 task.spawn(function()
  for _=1,10 do
   if tracks.walk and tracks.idle and tracks.walk.Length>0 and tracks.idle.Length>0 then model:SetAttribute("UsingAnimator",true) return end
   task.wait(0.5)
  end
 end)
end
local function walkRoute(model,h,route,rng)
 local root=model.PrimaryPart
 h.WalkSpeed=rng:NextNumber(4.8,7.6)
 while model.Parent and h.Health>0 do
  while os.clock()<(model:GetAttribute("TalkingUntil") or 0) do task.wait(0.25) end
  local target=route[rng:NextInteger(1,#route)]
  local path=Pathfinding:CreatePath({AgentRadius=1.5,AgentHeight=5,AgentCanJump=false,WaypointSpacing=5})
  local ok=pcall(function() path:ComputeAsync(root.Position,target) end)
  model:SetAttribute("Activity","Walking")
  if ok and path.Status==Enum.PathStatus.Success then
   for _,waypoint in ipairs(path:GetWaypoints()) do
    if not model.Parent then return end
    if os.clock()<(model:GetAttribute("TalkingUntil") or 0) then break end
    h:MoveTo(waypoint.Position)
    if not h.MoveToFinished:Wait() then break end
   end
  else h:MoveTo(root.Position) end
  model:SetAttribute("Activity","Resting")
  task.wait(rng:NextNumber(2.5,8))
 end
end
-- Mum has her own kitchen routine; the Watcher and doll retain their uncanny stillness.
for i,style in ipairs(styles) do
 task.spawn(function()
  local model=Factory.create(style)
  local template=model:Clone() template.Name=style.name template.Parent=templates
  local point=i==1 and Vector3.new(-14,0,-2.1) or i==2 and Vector3.new(0,0,55) or Vector3.new(-16,3.35,16)
  local h=setup(model,point,i~=1)
  model:SetAttribute("Role",style.name)
  if i==1 then
   model:SetAttribute("NaturalResident",true)
   naturalAnimation(model,h)
   local anchor=workspace:WaitForChild("SpareRoomWorld"):WaitForChild("Interactables"):WaitForChild("MumConversation")
   local prompt=anchor:WaitForChild("ProximityPrompt")
   prompt.PromptButtonHoldBegan:Connect(function() model:SetAttribute("TalkingUntil",os.clock()+4) h:MoveTo(model.PrimaryPart.Position) end)
   task.spawn(function()
    while model.Parent do
     local head=model:FindFirstChild("Head")
     if head then anchor.Position=head.Position+Vector3.new(0,0,-0.7) end
     task.wait(0.1)
    end
   end)
   task.wait(0.35)
   walkRoute(model,h,{Vector3.new(-18,0,-10),Vector3.new(-10,0,-10),Vector3.new(-14,0,-2)},mumRandom)
  end
 end)
end
for i=1,8 do
 task.spawn(function()
  local x=-110+(i-1)*30
  local z=i%2==0 and -57 or -33
  local rng=Random.new()
  local gender=i%2==0 and "Female" or "Male"
  local model=Factory.create(Factory.randomStyle("Resident "..i,gender,rng))
  model:SetAttribute("NaturalResident",true)
  model:SetAttribute("Role","Citizen") model:SetAttribute("Phase",i)
  local h=setup(model,Vector3.new(x,0,z),false)
  naturalAnimation(model,h)
  local head=model:FindFirstChild("Head")
  if head then
   local prompt=Instance.new("ProximityPrompt")
   prompt.ActionText="Speak with resident" prompt.ObjectText="Neighbour"
   prompt.HoldDuration=0.8 prompt.MaxActivationDistance=6 prompt.RequiresLineOfSight=true
   prompt.Style=Enum.ProximityPromptStyle.Default prompt.ClickablePrompt=true prompt.Parent=head
   prompt.PromptButtonHoldBegan:Connect(function()
    model:SetAttribute("TalkingUntil",os.clock()+4)
    h:MoveTo(model.PrimaryPart.Position)
   end)
   local last={}
   local lines={
    "Your mother used to take the long way home. There were more hands to hold.",
    "The station kept a family ticket. Nobody agrees how many seats it covered.",
    "That house has always had the same windows. I count them every evening.",
    "Someone returned a library book with two different names inside it.",
    "I remember a small red bicycle. Perhaps it belonged to another street.",
    "The shop stopped selling that doll years ago. Please do not ask how many they made.",
    "There is an extra signature on your household account. It was never added.",
    "If you see someone waiting in the garden, do not give them a name for my sake.",
   }
   prompt.Triggered:Connect(function(player)
    local root=player.Character and player.Character:FindFirstChild("HumanoidRootPart")
    if not root or (root.Position-head.Position).Magnitude>7.5 or os.clock()-(last[player.UserId] or -10)<2 then return end
    last[player.UserId]=os.clock()
    local remote=RS:FindFirstChild("SpareRoomEvent")
    if remote then remote:FireClient(player,"Caption",lines[i]) end
   end)
  end
  task.wait(0.35)
  walkRoute(model,h,{Vector3.new(math.max(-120,x-22),0,z),Vector3.new(math.min(120,x+22),0,z),Vector3.new(x,0,z)},rng)
 end)
end
