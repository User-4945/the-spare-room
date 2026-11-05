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
local styles={
 {name="Mum",shirt=green,pants=Color3.fromRGB(65,65,57),hair=Color3.fromRGB(74,66,53)},
 {name="Watcher",shirt=Color3.fromRGB(29,34,33),pants=dark,skin=Color3.fromRGB(111,115,101),faceless=true,scale=1.12},
 {name="Doll",shirt=Color3.fromRGB(125,88,86),pants=Color3.fromRGB(162,150,122),skin=Color3.fromRGB(203,192,165),scale=0.48},
}
-- Each character loads independently, so one failed avatar request cannot block the game.
for i,style in ipairs(styles) do
 task.spawn(function()
  local model=Factory.create(style)
  local template=model:Clone() template.Name=style.name template.Parent=templates
  local point=i==1 and Vector3.new(-14,0,-2.1) or i==2 and Vector3.new(0,0,55) or Vector3.new(-16,3.35,16)
  setup(model,point,true)
  model:SetAttribute("Role",style.name)
 end)
end
local function walkRoute(model,h,route)
 local root=model.PrimaryPart
 local index=1
 h.WalkSpeed=6
 while model.Parent and h.Health>0 do
  local target=route[index]
  local path=Pathfinding:CreatePath({AgentRadius=1.5,AgentHeight=5,AgentCanJump=false,WaypointSpacing=5})
  local ok=pcall(function() path:ComputeAsync(root.Position,target) end)
  if ok and path.Status==Enum.PathStatus.Success then
   for _,waypoint in ipairs(path:GetWaypoints()) do
    if not model.Parent then return end
    h:MoveTo(waypoint.Position)
    if not h.MoveToFinished:Wait() then break end
   end
  else
   -- Recompute later rather than walking through a building or teleporting.
   h:MoveTo(root.Position)
  end
  index=index%#route+1
  task.wait(1.5)
 end
end
for i=1,8 do
 task.spawn(function()
  local x=-110+(i-1)*30
  local z=i%2==0 and -57 or -33
  local model=Factory.create({name="Resident "..i,shirt=Color3.fromRGB(60+i*8,77+i*4,72+i*3),pants=dark,hair=Color3.fromRGB(33+i*5,31+i*4,27+i*3)})
  model:SetAttribute("Role","Citizen") model:SetAttribute("Phase",i)
  local h=setup(model,Vector3.new(x,0,z),false)
  local head=model:FindFirstChild("Head")
  if head then
   local prompt=Instance.new("ProximityPrompt")
   prompt.ActionText="Speak with resident" prompt.ObjectText="Neighbour"
   prompt.HoldDuration=0.8 prompt.MaxActivationDistance=6 prompt.RequiresLineOfSight=true
   prompt.Style=Enum.ProximityPromptStyle.Default prompt.ClickablePrompt=true prompt.Parent=head
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
  walkRoute(model,h,{Vector3.new(math.max(-120,x-12),0,z),Vector3.new(math.min(120,x+12),0,z)})
 end)
end
