-- ServerScriptService.SpareRoomServer
-- ServerScriptService/SpareRoomServer
local Players = game:GetService("Players")
-- Death stays final until a free restart or a verified single-use revive is selected.
Players.CharacterAutoLoads = false
local MarketplaceService = game:GetService("MarketplaceService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Lighting = game:GetService("Lighting")
local DataStoreService = game:GetService("DataStoreService")
local Config = require(ReplicatedStorage:WaitForChild("SpareRoomConfig"))
local Travel=require(ReplicatedStorage:WaitForChild("SpareRoomTravelConfig"))
local remote = Instance.new("RemoteEvent")
remote.Name = "SpareRoomEvent"
remote.Parent = ReplicatedStorage
local isRun=require(ReplicatedStorage:WaitForChild("SpareRoomPlaceLayout")).configure()
local transport=require(ReplicatedStorage:WaitForChild("SpareRoomTransport")).new(function(p,data)
 local event=ReplicatedStorage:FindFirstChild("SpareRoomEvent") if event then event:FireClient(p,"Travel",data) end
end)
local admittedRunId=nil
local Generation=require(ReplicatedStorage:WaitForChild("SpareRoomGeneration"))
local EndingRules=require(ReplicatedStorage:WaitForChild("SpareRoomEndingRules"))
local Weather=require(ReplicatedStorage:WaitForChild("SpareRoomWeather"))
local world = workspace:WaitForChild("SpareRoomWorld")
local items = world:WaitForChild("Interactables")
-- Keep this allowlist server-side. Never put passwords in a Roblox place.
local ADMIN_USER_IDS = {[11080546757]=true}
local function isAdmin(player)
 return ADMIN_USER_IDS[player.UserId]==true
end
local destinations = {
 Upstairs = Vector3.new(0,16,8), House = Vector3.new(0,4,-15), Garden = Vector3.new(0,4,35), Basement = Vector3.new(0,-14,-12),
 Cinema = Vector3.new(-96,4,-79), Archive = Vector3.new(-56,4,-79), Clinic = Vector3.new(-16,4,-79),
 Station = Vector3.new(24,4,-79), Workshop = Vector3.new(64,4,-79), Costumes = Vector3.new(104,4,-79),
 Park = Vector3.new(-85,4,35), School = Vector3.new(85,4,38), Bookshop = Vector3.new(-76,4,-11), Cafe = Vector3.new(76,4,-11),
}
for _,location in require(ReplicatedStorage:WaitForChild("SpareRoomAdminLocations"))do destinations[location.name]=location.position end
for name,p in pairs(destinations)do destinations[name]=Generation.mapPoint(p)end
local Revive = require(ReplicatedStorage:WaitForChild("SpareRoomRevive"))
local states = {}
local prompts = {}
local economy, lobby
local AdminPolicy=require(ReplicatedStorage.SpareRoomAdminPolicy)
local Badges=require(ReplicatedStorage.SpareRoomBadges)
local function adminRole(player)return AdminPolicy.role(player.UserId,economy and economy:class(player)or "Wanderer")end
local lobbySpawn=isRun and Vector3.new(0,4,-15) or Vector3.new(400,4,25)
local function classStats(s) return Config.Classes[s.classId or "Wanderer"] or Config.Classes.Wanderer end
local function value(part, name)
 local v = part:FindFirstChild(name)
 return v and v.Value or ""
end
local function count(set)
 local n = 0
 for _ in pairs(set) do n += 1 end
 return n
end
local function position(player)
 local character = player.Character
 local root = character and character:FindFirstChild("HumanoidRootPart")
 return root
end
local function paused(s)
 return not s.started or s.reading ~= nil or s.menu or s.ended ~= nil
end
local function snapshot(player)
 local s = states[player]
 if not s then return end
 local household = {}
 for _, member in ipairs(Players:GetPlayers()) do
  local state = states[member]
  table.insert(household,{name=member.DisplayName,started=state and state.started==true,paused=not state or paused(state)})
 end
 local observed = {}
 for _, a in ipairs(Config.Anomalies) do
  if s.anomalies[a.id] then table.insert(observed, a.title .. " — " .. a.text) end
 end
 local journal = {}
 for id in pairs(s.journal) do
  local e = Config.Endings[id]
  if e then table.insert(journal, e.title) end
 end
 table.sort(journal)
 remote:FireClient(player, "State", {
  tutorialRead=s.tutorialRead==true, runToken=s.lastStart,
  role=isRun and "Run" or "Lobby", household = household, observed = observed, admin = adminRole(player)~="None", adminRole=adminRole(player), flying = s.flying == true, day = s.day or 1, started = s.started, mode = s.mode, classId=s.classId or "Wanderer", sanity = s.sanity, stamina = s.stamina,
  diary = count(s.diary), records = count(s.records), rooms = count(s.rooms),
  anomalies = count(s.anomalies), hasKey = s.key, journal = journal,
  sandwich = math.max(0, math.ceil(s.sandwichAt - s.time)),
  ended = s.ended, lost = s.ended == "consumed",
 })
end
local function saveJournal(player, s)
 if not Config.SaveEndingJournal or not s.canSave then return end
 local copy = table.clone(s.journal)
 task.spawn(function()
  local ok, err = pcall(function()
   DataStoreService:GetDataStore("SpareRoomRobloxEndings_v1"):UpdateAsync("u" .. player.UserId, function(old)
    local result = {}
    if typeof(old) == "table" then
     for id, yes in pairs(old) do if yes == true and Config.Endings[id] then result[id] = true end end
    end
    for id in pairs(copy) do result[id] = true end
    return result
   end)
  end)
  if not ok then warn("The Spare Room: ending journal was not saved: " .. tostring(err)) end
 end)
end
local function finish(player, id)
 local s = states[player]
 local ending = Config.Endings[id]
 if not s or s.ended or not ending then return end
 if not EndingRules.commit(s,id,Config.Endings)then return end
 if economy and id~="consumed" and id~="fallen" then task.spawn(function() economy:awardEnding(player,id) end) end
 s.sprint = false
 s.active=nil s.flying=false
 if id=="consumed" then
  local humanoid=player.Character and player.Character:FindFirstChildOfClass("Humanoid")
  if humanoid then humanoid.Health=0 end
 end
 remote:FireClient(player, "AnomalyEnd")
 remote:FireClient(player, "Ending", {id = id, title = ending.title, text = ending.text})
 snapshot(player)
 task.spawn(function()Badges.award(player,id,s.journal)end)
 saveJournal(player, s)
end
local function damage(player, amount)
 local s = states[player]
 if not s or s.ended then return end
 local loss = amount * Config.Modes[s.mode].damage * classStats(s).damage
 s.sanity = math.max(0, s.sanity - loss)
 if loss > 2 then remote:FireClient(player, "SanityHit", loss) end
 if s.sanity <= 0 then finish(player, "consumed") end
end
local function tell(player, text)
 remote:FireClient(player, "Caption", text)
end
local function reset(player, mode)
 local old = states[player]
 states[player] = {
  classId=economy and economy:class(player) or "Wanderer", started = true, mode = mode, sanity = 100, stamina = 100, diary = {}, records = {}, rooms = {},
  anomalies = {}, journal = old and old.journal or {}, canSave = old and old.canSave or false,
  flags = {}, key = false, sandwichAt = 0, time = 0, nextAnomaly = Config.Modes[mode].delay,
  active = nil, menu = false, reading = nil, ended = nil, sprint = false, exhausted = false,
  day = 1, flying = false, sequence = old and old.sequence or 0, lastRequest = 0, lastStart = os.clock(),
 }
 remote:FireClient(player, "AnomalyEnd")
 if not player.Character or not player.Character:FindFirstChildOfClass("Humanoid") or player.Character:FindFirstChildOfClass("Humanoid").Health <= 0 then
  pcall(function() player:LoadCharacterAsync() end)
 end
 local root = position(player)
 if root then player.Character:PivotTo(CFrame.new(0, 4, -15)) end
 snapshot(player)
end
local function canRevive(player)
 local s=states[player]
 return s~=nil and (s.ended=="consumed" or s.ended=="fallen") and not s.reviveBusy
end
local function revivePlayer(player)
 local s=states[player]
 if not canRevive(player) then return false end
 s.reviveBusy=true
 local ok=pcall(function() player:LoadCharacterAsync() end)
 if states[player]~=s then return false end
 s.reviveBusy=nil
 if not ok then return false end
 if s.ended~="consumed" and s.ended~="fallen" then return false end
 s.ended=nil s.sanity=Config.ReviveSanity s.stamina=100
 s.reading=nil s.confirm=nil s.menu=false s.sprint=false s.flying=false
 s.active=nil s.nextAnomaly=s.time+Config.Modes[s.mode].delay
 local root=position(player)
 if root then player.Character:PivotTo(CFrame.new(0,4,-15)) end
 remote:FireClient(player,"Revived","You wake at home. Your discoveries remain. Sanity restored to "..Config.ReviveSanity.."%.")
 snapshot(player)
 return true
end
local receiptReady=false
local HttpService=game:GetService("HttpService")
-- A downloaded/unpublished place may reject DataStore access. Purchases must
-- fail closed without preventing the game and its menu handlers from starting.
local storeOK,reviveStore=pcall(function()
 return DataStoreService:GetDataStore("SpareRoomReviveCredits_v1")
end)
if not storeOK then
 warn("Revive storage unavailable; gameplay remains available: "..tostring(reviveStore))
 reviveStore={UpdateAsync=function() error("Publish this place and enable supported DataStore access before testing paid revives.") end}
end
local reviveGate=Revive.new({market=MarketplaceService,productId=Config.ReviveProductId,store=reviveStore,
 ready=function() return receiptReady end, now=os.time, token=function() return HttpService:GenerateGUID(false) end,
 player=function(id) return Players:GetPlayerByUserId(id) end, defer=task.defer,
 canRevive=canRevive,revive=revivePlayer,status=function(player,message)
  if player.Parent==Players then remote:FireClient(player,"ReviveStatus",message) end
 end})
-- Filtered receipt bindings preserve HD Admin and other developer products.
MarketplaceService.PromptProductPurchaseFinished:Connect(function(userId,id)
 local player=Players:GetPlayerByUserId(userId)
 if player then reviveGate:purchaseFinished(player,id) end
end)
-- Currency is separate from revive credits; product filters never overlap.
local Economy=require(ReplicatedStorage:WaitForChild("SpareRoomEconomy"))
local Lobby=require(ReplicatedStorage:WaitForChild("SpareRoomLobby"))
local economyOK,economyStore=pcall(function() return DataStoreService:GetDataStore("SpareRoomMemoryShards_v1") end)
if not economyOK then economyStore={GetAsync=function() error("Storage unavailable") end,UpdateAsync=function() error("Storage unavailable") end} end
local products,productIds={},{}
for _,pack in ipairs(Config.ShardPacks) do
 if pack.productId>0 and pack.productId~=Config.ReviveProductId and not products[pack.productId] then
  products[pack.productId]=pack.amount table.insert(productIds,pack.productId)
 end
end
local shardReceiptsReady=false
local function inLobby(player) local s=states[player] return not isRun and s~=nil and not s.started and not player:GetAttribute("SpareRoomDeparting") end
local function economyStatus(player,message)
 if player.Parent==Players then remote:FireClient(player,"EconomyStatus",message) end
end
economy=Economy.new({store=economyStore,classes=Config.Classes,products=products,market=MarketplaceService,
 player=function(id) return Players:GetPlayerByUserId(id) end,present=function(p) return p.Parent==Players end,
 lobby=inLobby,wait=function() task.wait() end,ready=function() return shardReceiptsReady end,
 send=function(p,data) remote:FireClient(p,"Economy",data) end,status=economyStatus})
local function handleSpareRoomReceipt(info)
 if info.ProductId == Config.ReviveProductId then
  return reviveGate:receipt(info)
 elseif products[info.ProductId] then
  return economy:receipt(info)
 end
 return false -- Unknown product: never acknowledge without granting its benefit.
end
local allProductIds=table.clone(productIds)
if Config.ReviveProductId>0 then table.insert(allProductIds,Config.ReviveProductId) end
local bound,bindError=pcall(function()
 MarketplaceService:BindReceiptHandler(Enum.ReceiptType.DeveloperProduct,function(info)
  local ok,granted=pcall(handleSpareRoomReceipt,info)
  if not ok then warn("Spare Room receipt deferred: "..tostring(granted)) end
  return ok and granted and Enum.ReceiptDecision.Processed or Enum.ReceiptDecision.NotProcessedYet
 end,allProductIds)
end)
receiptReady=bound and Config.ReviveProductId>0
shardReceiptsReady=bound and #productIds>0
if not bound then warn("Spare Room purchases unavailable: "..tostring(bindError)) end
MarketplaceService.PromptProductPurchaseFinished:Connect(function(userId,id)
 local p=Players:GetPlayerByUserId(userId) if p then economy:closed(p,id) end
end)
lobby=Lobby.new({modes=Config.Modes,available=inLobby,status=economyStatus,
 maximum=Travel.MaxPartySize,waitSeconds=Travel.BoardingSeconds,
 send=function(p,data) if p.Parent==Players then remote:FireClient(p,"Queue",data) end end,
 start=function(party,mode)
  for _,p in ipairs(party) do local s=states[p] if s then s.menu=false s.sprint=false end end
  transport:depart(party,mode)
 end})
local function returnLobby(player)
 if isRun then transport:returnLobby(player) return end
 local s=states[player] if not s or s.reviveBusy then return end
 lobby:leave(player)
 s.started=false s.sanity=100 s.stamina=100 s.ended=nil s.reading=nil s.confirm=nil s.menu=false s.sprint=false s.active=nil s.flying=false
 remote:FireClient(player,"AnomalyEnd")
 local h=player.Character and player.Character:FindFirstChildOfClass("Humanoid")
 if not h or h.Health<=0 then pcall(function() player:LoadCharacterAsync() end) end
 if player.Character then player.Character:PivotTo(CFrame.new(lobbySpawn)) end
 snapshot(player) economy:publish(player)
end
local function valid(player, part)
 local s = states[player]
 local root = position(player)
 if not s or not root or not part or not part:IsDescendantOf(items) then return false end
 local role=value(part,"Role")
 local lobbyItem=role=="lobbyQueue" or role=="lobbyNote" or role=="lobbyShop" or role=="lobbySolo"
 if lobbyItem then
  if s.started or s.reading or s.menu then return false end
 elseif paused(s) then return false end
 if (root.Position - part.Position).Magnitude > 7.5 then return false end
 local params = RaycastParams.new()
 params.FilterType = Enum.RaycastFilterType.Exclude
 params.FilterDescendantsInstances = {player.Character, workspace:FindFirstChild("SpareRoomNPCs")}
 local head = player.Character and player.Character:FindFirstChild("Head")
 local origin = head and head.Position or root.Position
 local hit = workspace:Raycast(origin, part.Position - origin, params)
 return hit == nil or hit.Instance == part
end
local function read(player, part, text, cost)
 local s = states[player]
 s.sequence += 1
 s.reading = {id = s.sequence, part = part, cost = cost}
 s.sprint = false
 remote:FireClient(player, "Read", {id = s.sequence, title = value(part, "Title"), text = text})
end
local function interact(player, part)
 local s = states[player]
 local role = value(part, "Role")
 if role=="lobbyQueue" then
  lobby:join(player,value(part,"Mode"))
 elseif role=="lobbyShop" then
  if lobby.membership[player] then economyStatus(player,"Leave the departure queue before shopping.")
  else economy:publish(player) remote:FireClient(player,"OpenClassShop") end
 elseif role=="lobbySolo" then
  local mode=value(part,"Mode")
  if Config.Modes[mode] then lobby:join(player,mode) lobby:configure(player,1) lobby:depart(player) end
 elseif role=="lobbyNote" then
  read(player,part,value(part,"Text"),0)
 elseif role == "diary" then
  local n = tonumber(value(part, "Index"))
  if not n or not Config.Diary[n] then return end
  local first = not s.diary[n]
  s.diary[n] = true
  if first then task.spawn(function() economy:award(player,"diary:"..n,2) end) end
  read(player, part, Config.Diary[n], first and (n > 10 and 3 or 1) or 0)
 elseif role == "record" then
  local id = value(part, "Index")
  local first = not s.records[id]
  s.records[id] = true
  read(player, part, value(part, "Text"), first and 3 or 0)
 elseif role == "story" then
  local flag=value(part,"Flag")
  local first=not s.flags[flag]
  s.flags[flag]=true
  read(player,part,value(part,"Text"),first and (tonumber(value(part,"Cost")) or 0) or 0)
 elseif role == "mum" then
  s.flags.mum = true
  read(player, part, "“I remember making up the beds,” Mum says. “Please do not give me an answer just because I cannot find one.”", 0)
 elseif role == "doll" then
  local first = not s.flags.doll
  s.flags.doll=true
  read(player,part,"A small cloth tag reads: PROPERTY OF THE CHILDREN. Someone has crossed out the final letters, then carefully stitched them back.\n\nMum remembers buying it. She cannot remember how many hands reached for the box.",first and 4 or 0)
 elseif role == "mirror" then
  local first = not s.flags.mirror
  s.flags.mirror = true
  read(player, part, "There are four height marks in the dust on the frame. Your reflection obscures the smallest one. A scratched line says: KEEP BOTH COPIES.", first and 5 or 0)
 elseif role == "valve" then
  s.flags.valve = true
  tell(player, "The knocking pipe falls quiet. Someone has corrected the maintenance date twice.")
 elseif role == "anchor" then
  s.flags.anchor = true
  tell(player, "You keep an ordinary memory close. You do not decide who shared it.")
 elseif role == "key" then
  s.key = true
  tell(player, "You take the unnumbered key. Its label has been corrected by hand.")
 elseif role == "sandwich" then
  if s.time < s.sandwichAt then
   tell(player, "The next sandwich is ready in " .. math.ceil(s.sandwichAt - s.time) .. " seconds of active play.")
  else
   s.sanity = math.min(100, s.sanity + Config.Modes[s.mode].sandwich + classStats(s).food)
   s.sandwichAt = s.time + 120
   tell(player, "You eat the sandwich. The kitchen smells ordinary again.")
  end
 elseif role == "hatch" or role == "stairs" or role == "exitChamber" then
  local target = role == "hatch" and Vector3.new(0, -14, -12) or role == "stairs" and Vector3.new(0, 4, 17) or Vector3.new(0, -14, 63)
  player.Character:PivotTo(CFrame.new(target))
  remote:FireClient(player, "AnomalyEnd")
  s.active = nil
  s.nextAnomaly = s.time + 10
 elseif role == "gate" then
  if not EndingRules.chamberReady(s) then
   tell(player, "The chamber needs 12 diary pages, 3 family records and the unnumbered key.")
  else
   player.Character:PivotTo(CFrame.new(9, -14, 63))
  end
 elseif role == "ending" then
  local id = value(part, "Ending")
  local e = Config.Endings[id]
  if not e then return end
  local ready=EndingRules.ready(s,e)
  if ready then
   s.sequence += 1
   s.confirm = {id = id, nonce = s.sequence, part = part}
   remote:FireClient(player, "Confirm", {id = id, nonce = s.sequence, title = e.title, text = e.text})
   s.menu = true
  else
   if e.flags then tell(player,"Read the room’s hidden note and complete its unfinished task first.") return end
   tell(player, "Requires diary pages: " .. (e.diary or 0) .. ", records: " .. (e.records or 0) .. ", anomalies: " .. (e.anomalies or 0)
    .. (e.anchor and "; hold the ordinary memory" or "") .. (e.valve and "; isolate the boiler pipe" or "")
    .. (e.mum and "; speak with Mum" or "") .. (e.sanityMax and "; sanity at or below " .. e.sanityMax .. "%" or ""))
  end
 end
 snapshot(player)
end
Lighting.ClockTime = isRun and 8 or 19.2
local worldSeconds=0
local worldDay=1
Lighting.GlobalShadows = true
Lighting.EnvironmentDiffuseScale = 0.35
Lighting.EnvironmentSpecularScale = 0.65
Lighting.ExposureCompensation = -0.15
Lighting.Brightness = 1.5
local grade = Instance.new("ColorCorrectionEffect")
grade.Name = "SpareRoomGrade"
grade.TintColor = Color3.fromRGB(225, 233, 221)
grade.Saturation = -0.22
grade.Contrast = 0.12
grade.Parent = Lighting
local bloom = Instance.new("BloomEffect")
bloom.Intensity = 0.12
bloom.Size = 24
bloom.Threshold = 1.6
bloom.Parent = Lighting
Lighting.Ambient = Color3.fromRGB(35, 39, 39)
Lighting.OutdoorAmbient = Color3.fromRGB(50, 57, 63)
Lighting.FogColor = Color3.fromRGB(17, 24, 25)
Lighting.FogStart = 110
Lighting.FogEnd = 310
for _, part in ipairs(world:GetDescendants()) do
 if part:IsA("BasePart") then
  local material = part:FindFirstChild("MaterialName")
  if material and Enum.Material[material.Value] then part.Material = Enum.Material[material.Value] end
  if part.Name == "Lamp" then
   local light = Instance.new("PointLight")
   light.Color = Color3.fromRGB(239, 207, 155)
   light.Brightness = part.Position.Y < -5 and 0.65 or 1.1
   light.Range = part.Position.Y < -5 and 17 or 25
   light.Shadows = true
   light.Parent = part
  end
  local sign = part:FindFirstChild("Sign")
  if sign then
   local gui = Instance.new("SurfaceGui")
   gui.Face = value(part, "Side") == "Right" and Enum.NormalId.Right or value(part, "Side") == "Left" and Enum.NormalId.Left or value(part, "Side") == "Back" and Enum.NormalId.Back or Enum.NormalId.Front
   gui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
   gui.PixelsPerStud = 60
   gui.AlwaysOnTop = false
   gui.Parent = part
   local label = Instance.new("TextLabel")
   label.Size = UDim2.fromScale(1, 1)
   label.BackgroundTransparency = 1
   label.TextColor3 = Color3.fromRGB(232, 218, 181)
   local kind = value(part, "Venue")
   label.Font = (kind == "ARCHIVE" or kind == "BOOKSHOP") and Enum.Font.Garamond
    or kind == "CINEMA" and Enum.Font.GothamBlack or Enum.Font.GothamMedium
   local padding = Instance.new("UIPadding")
   padding.PaddingLeft = UDim.new(0.05, 0)
   padding.PaddingRight = UDim.new(0.05, 0)
   padding.PaddingTop = UDim.new(0.12, 0)
   padding.PaddingBottom = UDim.new(0.12, 0)
   padding.Parent = label
   label.TextScaled = true
   label.TextWrapped = true
   label.Text = sign.Value
   label.Parent = gui
   local opposite={[Enum.NormalId.Front]=Enum.NormalId.Back,[Enum.NormalId.Back]=Enum.NormalId.Front,[Enum.NormalId.Left]=Enum.NormalId.Right,[Enum.NormalId.Right]=Enum.NormalId.Left}
   if opposite[gui.Face] then local reverse=gui:Clone() reverse.Name="ReverseSign" reverse.Face=opposite[gui.Face] reverse.Parent=part end
  end
 end
end
local function registerInteraction(part)
 if part:IsA("BasePart") and value(part,"Role")~="lobbyQueue" and not prompts[part] then
  local prompt = Instance.new("ProximityPrompt")
  prompt.Style = Enum.ProximityPromptStyle.Default
  prompt.ActionText = value(part, "Action")
  prompt.ObjectText = value(part, "Title")
  prompt.KeyboardKeyCode = Enum.KeyCode.E
  prompt.GamepadKeyCode = Enum.KeyCode.ButtonX
  prompt.MaxActivationDistance = 6
  prompt.RequiresLineOfSight = true
  prompt.HoldDuration = 0.8
  prompt.ClickablePrompt = true
  prompt.Exclusivity = Enum.ProximityPromptExclusivity.OnePerButton
  prompt.Parent = part
  prompts[part] = prompt
  -- Roblox owns hold progress. Validate the completed trigger independently.
  -- A second replicated hold-start clock can reject otherwise completed holds.
  prompt.Triggered:Connect(function(player)
   if not prompt.Enabled or not valid(player, part) then return end
   local state = states[player]
   local now = os.clock()
   if now - (state.lastInteraction or -10) < 0.35 then return end
   state.lastInteraction = now
   interact(player, part)
  end)
 end
end
for _,part in items:GetChildren()do registerInteraction(part)end
items.ChildAdded:Connect(function(part)task.defer(registerInteraction,part)end)

local function joined(player)
 states[player] = {
  started = false, mode = "Easy", sanity = 100, stamina = 100, diary = {}, records = {}, rooms = {},
  anomalies = {}, journal = {}, flags = {}, time = 0, sandwichAt = 0, sequence = 0, nextAnomaly = 45, lastRequest = 0,
 }
 task.defer(function()
  economy:load(player)
  if not isRun or player.Parent~=Players then return end
  local mode=nil local join=player:GetJoinData() local data=join.TeleportData
  if RunService:IsStudio() then mode=workspace:GetAttribute("SpareRoomPreviewDifficulty") or "Easy"
  elseif game.PrivateServerId~="" and join.SourcePlaceId==Travel.LobbyPlaceId and join.SourceGameId==game.GameId and type(data)=="table"
   and data.schema==1 and type(data.runId)=="string" and #data.runId<=64 and type(data.members)=="table"
   and table.find(data.members,player.UserId) and Config.Modes[data.mode]
   and (admittedRunId==nil or admittedRunId==data.runId) then
   admittedRunId=data.runId mode=data.mode player:SetAttribute("SpareRoomRunId",data.runId)
  end
  if mode and Config.Modes[mode] then reset(player,mode) else transport:returnLobby(player) end
 end)
 if Config.SaveEndingJournal then
  task.spawn(function()
   local ok, saved = pcall(function() return DataStoreService:GetDataStore("SpareRoomRobloxEndings_v1"):GetAsync("u" .. player.UserId) end)
   local s = states[player]
   if not s then return end
   s.canSave = ok
   if ok and typeof(saved) == "table" then for id, yes in pairs(saved) do if yes == true and Config.Endings[id] then s.journal[id] = true end end end
   snapshot(player)
   if ok then Badges.reconcile(player,s.journal)end
  end)
 end
 player.CharacterAdded:Connect(function(character)
  local humanoid = character:WaitForChild("Humanoid")
  humanoid.UseJumpPower = true
  humanoid.JumpPower = 45
  humanoid.Died:Connect(function()
   local state=states[player]
   if not state or state.ended then return end
   if not state.started then
    task.delay(2,function()
     if states[player]==state and not state.started and player.Parent==Players then pcall(function() player:LoadCharacterAsync() end) end
    end)
    return
   end
   finish(player,"fallen")
  end)
  local state=states[player]
  if state and (state.ended=="consumed" or state.ended=="fallen") and not state.reviveBusy then humanoid.Health=0 return end
  task.wait(0.1)
  if character.Parent then character:PivotTo(CFrame.new(state and state.started and Vector3.new(0,4,-15) or lobbySpawn)) end
 end)
 if not player.Character then task.defer(function() pcall(function() player:LoadCharacterAsync() end) end) end
end
Players.PlayerAdded:Connect(joined)
for _, player in ipairs(Players:GetPlayers()) do joined(player) end
Players.PlayerRemoving:Connect(function(player)
 local s = states[player]
 if s then saveJournal(player, s) end
 lobby:forget(player) transport:forget(player) economy:forget(player)
 states[player] = nil
 reviveGate:forget(player)
end)
game:BindToClose(function()
 if not Config.SaveEndingJournal then return end
 for player, s in pairs(states) do
  if s.canSave then
   pcall(function()
    DataStoreService:GetDataStore("SpareRoomRobloxEndings_v1"):UpdateAsync("u" .. player.UserId, function(old)
     local result = typeof(old) == "table" and old or {}
     for id in pairs(s.journal) do result[id] = true end
     return result
    end)
   end)
  end
 end
end)
remote.OnServerEvent:Connect(function(player, action, data)
 local s = states[player]
 if not s or typeof(action) ~= "string" then return end
 local now = os.clock()
 if action == "Revive" then
  if now-(s.lastReviveRequest or -10)<2 then return end
  s.lastReviveRequest=now
  reviveGate:request(player)
  return
 end
 if action=="Admin" then
  -- Authorization and rate limits belong to the caller, never the selected player.
  if adminRole(player)=="None" or not isRun or typeof(data)~="table" then return end
  local command=data.command
  if command=="Roster" then
   if now-(s.lastAdminRoster or -10)<.7 then return end
   s.lastAdminRoster=now
  else
   if now-(s.lastAdmin or -10)<.25 then remote:FireClient(player,"AdminResult",{ok=false,message="Please wait a moment before the next action."})return end
   s.lastAdmin=now
  end
  local function reply(ok,message) remote:FireClient(player,"AdminResult",{ok=ok,message=message}) end
  if command=="Roster" then
   local roster={}
   for _,p in Players:GetPlayers() do
    local ps=states[p]
    if ps and ps.started and (adminRole(player)=="Owner"or p==player) then table.insert(roster,{userId=p.UserId,name=p.Name,displayName=p.DisplayName,ended=ps.ended or false}) end
   end
   table.sort(roster,function(a,b)return a.name:lower()<b.name:lower()end)
   local details
   local target=typeof(data.targetId)=="number" and Players:GetPlayerByUserId(data.targetId)
   local ts=target and states[target]
   if ts and ts.started and (adminRole(player)=="Owner"or target==player)then
    local h=target.Character and target.Character:FindFirstChildOfClass("Humanoid")
    local r=target.Character and target.Character:FindFirstChild("HumanoidRootPart")
    details={userId=target.UserId,sanity=math.floor(ts.sanity),stamina=math.floor(ts.stamina),health=h and math.floor(h.Health) or 0,mode=ts.mode,ended=ts.ended or false,frozen=r and r:GetAttribute("AdminFrozen")==true or false,flying=ts.flying==true}
   end
   remote:FireClient(player,"AdminRoster",{players=roster,details=details})
   return
  end
  if typeof(data.targetId)~="number" or data.targetId%1~=0 then reply(false,"Choose a player in this run.") return end
  local target=Players:GetPlayerByUserId(data.targetId)
  local ts=target and states[target]
  if not target or not ts or not ts.started then reply(false,"That player has left this run. Choose another player.") return end
  if ts.ended then reply(false,"This player's run has ended. Active-run actions are unavailable.") return end
  local role=adminRole(player)
  if not AdminPolicy.allowed(role,player.UserId,target.UserId,command,data.value)then reply(false,"This prestige class has self-only utility powers. Owner controls are restricted.")return end
  if role=="Limited"then
   ts.utilityTimes=ts.utilityTimes or {}local cooldown=AdminPolicy.cooldowns[command]or 30
   local remaining=cooldown-(now-(ts.utilityTimes[command]or -1000))
   if remaining>0 then reply(false,"Ready in "..math.ceil(remaining).." seconds.")return end
   ts.utilityTimes[command]=now
  end
  local h=target.Character and target.Character:FindFirstChildOfClass("Humanoid")
  local root=position(target)
  if command=="Teleport" and typeof(data.value)=="string" and destinations[data.value] and root then
   target.Character:PivotTo(CFrame.new(destinations[data.value])) remote:FireClient(target,"AnomalyEnd") ts.active=nil
  elseif command=="Sanity" and (data.value==10 or data.value==-10) then
   if data.value<0 then damage(target,10) else ts.sanity=math.min(100,ts.sanity+10) end
  elseif command=="Heal" then
   if not h or h.Health<=0 then reply(false,"This player has no living character.") return end
   h.Health=h.MaxHealth ts.sanity=100 ts.stamina=100
  elseif command=="Stamina" then ts.stamina=100
  elseif command=="Freeze" and root then
   if not root:GetAttribute("AdminFrozen") then root:SetAttribute("AdminFreezeWasAnchored",root.Anchored) root:SetAttribute("AdminFrozen",true) root.Anchored=true end
  elseif command=="Unfreeze" and root then
   if root:GetAttribute("AdminFrozen") then root.Anchored=root:GetAttribute("AdminFreezeWasAnchored")==true root:SetAttribute("AdminFrozen",nil) root:SetAttribute("AdminFreezeWasAnchored",nil) end
  elseif command=="Bring" or command=="Goto" then
   local destination=command=="Bring" and player or target
   local moving=command=="Bring" and target or player
   local dr=position(destination)
   if moving==destination then reply(false,"Select another player for Bring or Go to.")return end
   local mh=moving.Character and moving.Character:FindFirstChildOfClass("Humanoid")
   if not dr or not mh or mh.Health<=0 then reply(false,"Both players need a living character.") return end
   local desired=dr.Position+dr.CFrame.RightVector*5
   local params=RaycastParams.new()params.FilterType=Enum.RaycastFilterType.Exclude
   local ignore={}for _,p in Players:GetPlayers()do if p.Character then table.insert(ignore,p.Character)end end params.FilterDescendantsInstances=ignore
   local hit=workspace:Raycast(desired+Vector3.new(0,8,0),Vector3.new(0,-25,0),params)
   if not hit or hit.Normal.Y<.6 then reply(false,"No safe floor beside that player.")return end
   moving.Character:PivotTo(CFrame.new(hit.Position+Vector3.new(0,3.5,0)))
  elseif command=="Fly" then ts.flying=not ts.flying
  elseif command=="Day" then ts.day=(ts.day or 1)+1 ts.time+=1200
  elseif command=="Clear" then ts.active=nil ts.nextAnomaly=ts.time+Config.Modes[ts.mode].delay remote:FireClient(target,"AnomalyEnd")
  elseif command=="Anomaly" and typeof(data.value)=="string" then
   local found=false
   for _,anomaly in Config.Anomalies do if anomaly.id==data.value then ts.adminAnomaly=anomaly.id ts.nextAnomaly=ts.time ts.active=nil found=true break end end
   if not found then reply(false,"Unknown anomaly.")return end
  else reply(false,"Action unavailable for this player.")return end
  snapshot(target)
  reply(true,command.." applied to @"..target.Name..".")
  return
 end
 if action=="Lobby" or action=="EnterLobby" then returnLobby(player) return end
 if action=="ConfigureQueue" or action=="DepartQueue" or action=="OpenShop" then
  if now-(s.lastBoardingRequest or -10)<.25 or not inLobby(player) then return end s.lastBoardingRequest=now
  if action=="ConfigureQueue" then
   if typeof(data)=="number" and not lobby:configure(player,data) then economyStatus(player,"Choose a whole number of seats from 1 to 4, at least as many as are already boarded.") end
  elseif action=="DepartQueue" then lobby:depart(player)
  elseif not lobby.membership[player] then economy:publish(player) remote:FireClient(player,"OpenClassShop") end
  return
 end
 if action=="Queue" then
  if now-(s.lastLobbyRequest or -10)<0.4 then return end s.lastLobbyRequest=now
  if data=="Leave" then lobby:leave(player,true) s.menu=false end return
 end
 if action=="Class" or action=="BuyShards" or action=="ReloadEconomy" then
  if now-(s.lastEconomyRequest or -10)<1 then return end s.lastEconomyRequest=now
  if not inLobby(player) or lobby.membership[player] then economyStatus(player,"Leave the departure queue before changing classes or shopping.") return end
  if action=="Class" and typeof(data)=="string" then economy:unlock(player,data)
  elseif action=="BuyShards" and typeof(data)=="number" then economy:buy(player,data)
  elseif action=="ReloadEconomy" then economy:load(player) end return
 end
 if action == "Ready" then snapshot(player) economy:publish(player) lobby:send(player) return end
 if action == "Sprint" then s.sprint = data == true return end
 if action == "Start" then
  if not isRun then tell(player,"Step onto a departure pad to create or join a private run.") return end
  if s.reviveBusy then return end
  if now - (s.lastStart or -10) < 2 then return end
  s.lastStart = now
 end
 if action == "Start" then
  if not s.started and typeof(data) == "string" and Config.Modes[data] then lobby:leave(player) reset(player, data) end
 elseif action == "ReadClosed" then
  if s.reading and data == s.reading.id then
   s.tutorialRead=true
   local cost = s.reading.cost
   s.reading = nil
   damage(player, cost)
   snapshot(player)
  end
 elseif action == "Pause" then
  if not s.ended and not s.reading then s.menu = data == true end
 elseif action == "Finish" then
  local c = s.confirm
  if c and data == c.nonce then
   s.menu = false
   s.confirm = nil
   local root = position(player)
   if root and c.part:IsDescendantOf(items) and (root.Position - c.part.Position).Magnitude < 8 and EndingRules.ready(s,Config.Endings[c.id]) then finish(player, c.id) end
  end
 elseif action == "CancelEnding" then s.confirm = nil s.menu = false end
end)
-- Each natural anomaly appears once before the next shuffled set begins.
local function nextNaturalAnomaly(s)
 if not s.anomalyBag or #s.anomalyBag == 0 then
  s.anomalyBag = {}
  for _, a in ipairs(Config.Anomalies) do table.insert(s.anomalyBag, a) end
  for i = #s.anomalyBag, 2, -1 do
   local j = math.random(i)
   s.anomalyBag[i], s.anomalyBag[j] = s.anomalyBag[j], s.anomalyBag[i]
  end
  if #s.anomalyBag > 1 and s.anomalyBag[#s.anomalyBag].id == s.lastNatural then
   s.anomalyBag[1], s.anomalyBag[#s.anomalyBag] = s.anomalyBag[#s.anomalyBag], s.anomalyBag[1]
  end
 end
 local a = table.remove(s.anomalyBag)
 s.lastNatural = a.id
 return a
end
local function eventPoint(player, distant)
 local root = position(player)
 if not root then return nil end
 local params = RaycastParams.new()
 params.FilterType = Enum.RaycastFilterType.Exclude
 params.FilterDescendantsInstances = {player.Character, workspace:FindFirstChild("SpareRoomNPCs")}
 local offsets={}
 if distant then
  local phase=math.random()*math.pi*2
  for i=1,8 do local a=phase+i*math.pi/4 table.insert(offsets,Vector3.new(math.cos(a),0,math.sin(a))*Config.Watcher.spawnDistance) end
 else
  offsets={Vector3.new(4,0,0),Vector3.new(-4,0,0),Vector3.new(0,0,4),Vector3.new(0,0,-4)}
 end
 for _, offset in ipairs(offsets) do
  if not workspace:Raycast(root.Position, offset, params) then
   local down = workspace:Raycast(root.Position + offset, Vector3.new(0, -8, 0), params)
   if down then
    local point = down.Position + Vector3.new(0, 0.05, 0)
    local overlap = OverlapParams.new()
    overlap.FilterType = Enum.RaycastFilterType.Exclude
    overlap.FilterDescendantsInstances = {player.Character}
    local clear = true
    for _, part in ipairs(workspace:GetPartBoundsInBox(CFrame.new(point + Vector3.new(0, 5.5, 0)), Vector3.new(4.5, 10.8, 5), overlap)) do
     if part.CanCollide then clear = false break end
    end
    if clear then return point end
   end
  end
 end
 return nil
end
local accumulator = 0
local lobbyAccumulator=0
local boardAccumulator=0
RunService.Heartbeat:Connect(function(dt)
 -- One shared 12-minute day: keeps advancing while reading or in the safe lobby.
 worldSeconds+=dt
 worldDay=math.floor(((isRun and 8 or 19.2)+worldSeconds/30)/24)+1
 local hour=((isRun and 8 or 19.2)+worldSeconds/30)%24
 Lighting.ClockTime=hour
 local daylight=math.clamp(math.sin((hour-6)/12*math.pi),0,1)
 local weather=Weather.profile()
 Lighting.Brightness=(1.2+daylight*1.3)*weather.light
 Lighting.OutdoorAmbient=isRun and Color3.fromRGB(48+daylight*65,55+daylight*65,63+daylight*62) or Color3.fromRGB(90+daylight*40,101+daylight*35,108+daylight*32)
 Lighting.Ambient=isRun and Color3.fromRGB(35,39,39) or Color3.fromRGB(58+daylight*15,66+daylight*16,61+daylight*15)
 Lighting.ExposureCompensation=-.12+daylight*.12
 local atmosphere=Lighting:FindFirstChild("SpareRoomAtmosphere")
 if not atmosphere then atmosphere=Instance.new("Atmosphere")atmosphere.Name="SpareRoomAtmosphere"atmosphere.Parent=Lighting end
 atmosphere.Density=weather.density atmosphere.Offset=.12 atmosphere.Haze=2.4 atmosphere.Color=Color3.fromRGB(117,134,124)atmosphere.Decay=Color3.fromRGB(63,78,70)atmosphere.Glare=.04
 lobbyAccumulator+=dt
 if lobbyAccumulator>=0.2 then
  local elapsed=lobbyAccumulator lobbyAccumulator=0
  if not isRun then
   for _,p in ipairs(Players:GetPlayers()) do
    if inLobby(p) then
     local root=position(p) local mode=nil
     if root then for _,pad in ipairs(world:GetChildren()) do
      if pad:IsA("BasePart") and pad.Name=="QueuePad" then
       local localPoint=pad.CFrame:PointToObjectSpace(root.Position)
       if math.abs(localPoint.X)<=pad.Size.X/2 and math.abs(localPoint.Z)<=pad.Size.Z/2 and localPoint.Y>=0 and localPoint.Y<=8 then mode=pad:GetAttribute("Difficulty") break end
      end
     end end
     lobby:pad(p,mode)
    end
   end
   lobby:step(elapsed)
   boardAccumulator+=elapsed
   if boardAccumulator>=.5 then boardAccumulator=0 remote:FireAllClients("Boards",lobby:boards()) end
  end
 end
 accumulator += dt
 for player, s in pairs(states) do
  local root = position(player)
  local humanoid = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
  if humanoid then
   local locked = player:GetAttribute("SpareRoomDeparting")==true or s.started and paused(s) or (not s.started and (s.reading~=nil or s.menu==true))
   local moving = root and Vector3.new(root.AssemblyLinearVelocity.X, 0, root.AssemblyLinearVelocity.Z).Magnitude > 1
   if not locked then
    if s.stamina >= 25 then s.exhausted = false end
    local sprinting = s.sprint and not s.exhausted and moving
    s.stamina = math.clamp(s.stamina + (sprinting and -26*classStats(s).stamina or 18*classStats(s).recovery) * dt, 0, 100)
    if s.stamina == 0 then s.exhausted = true end
    humanoid.WalkSpeed = (sprinting and 20 or (isRun and 12 or 16))*(classStats(s).speed or 1)
   else humanoid.WalkSpeed = 0 end
   humanoid.JumpPower = locked and 0 or 45
  end
  if not paused(s) then
   s.time += dt
   local mode = Config.Modes[s.mode]
   local sheltered=Weather.sheltered(player,root)
   local weatherEffect=Weather.effects(nil,sheltered,hour<6 or hour>=18)
   s.sanity = math.max(0, s.sanity - mode.drain * classStats(s).drain * weatherEffect.drain * dt)
   if s.lastWeather~=workspace:GetAttribute("SpareRoomWeather")then
    if s.lastWeather then tell(player,sheltered and "The weather shifts outside. The roof keeps you dry."or "The weather shifts. Find shelter to steady your thoughts.")end
    s.lastWeather=workspace:GetAttribute("SpareRoomWeather")
   end
   if s.sanity <= 0 then finish(player, "consumed") continue end
   if root then
    local room=Generation.roomAt(root.Position)
    if room then s.rooms[room]=true end
    if not s.active and s.time >= s.nextAnomaly then
     local a=s.pendingAnomaly
     if s.adminAnomaly then
      for _,candidate in ipairs(Config.Anomalies) do if candidate.id==s.adminAnomaly then a=candidate break end end
     end
     a=a or nextNaturalAnomaly(s)
     s.pendingAnomaly=a
     local point = eventPoint(player,a.id=="watcher")
     if point then
      s.sequence += 1
      s.pendingAnomaly=nil s.adminAnomaly=nil
      local templates=ReplicatedStorage:FindFirstChild("SpareRoomAvatarTemplates")
      if (a.id=="watcher" or a.id=="doll" or a.id=="family") and (not templates or not templates:FindFirstChild(a.id=="doll" and "Doll" or "Watcher")) then
       a=Config.Anomalies[3] -- API avatar creation may still be loading; retry through the next bag.
      end
      s.active = {elapsed = 0, duration = math.random(14,20), floor = root.Position.Y < -6 and "below" or "above"}
      s.anomalies[a.id] = true
      remote:FireClient(player, "Anomaly", {id = a.id, title = a.title, text = a.text, position = point, duration = s.active.duration})
      damage(player, 2.5)
     else s.nextAnomaly = s.time + 8 if s.adminAnomaly then tell(player, "Move to an open floor area so the anomaly can appear safely.") end end
    end
   end
   if s.active then
    s.active.elapsed += dt
    if not root or (root.Position.Y < -6 and "below" or "above") ~= s.active.floor or s.active.elapsed >= s.active.duration then
     s.active = nil
     s.nextAnomaly = s.time + mode.delay * (Config.AnomalyPacing.minimum + math.random()*(Config.AnomalyPacing.maximum-Config.AnomalyPacing.minimum))*Weather.profile().pacing
     remote:FireClient(player, "AnomalyEnd")
    end
   end
  end
  if accumulator >= 0.5 then
   remote:FireClient(player,"WorldClock",{hour=Lighting.ClockTime,day=worldDay})
   snapshot(player)
  end
 end
 if accumulator >= 0.5 then accumulator = 0 end
end)




