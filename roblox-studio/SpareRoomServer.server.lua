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
local Content=require(ReplicatedStorage:WaitForChild("SpareRoomContent"))
local world = workspace:WaitForChild("SpareRoomWorld")
local items = world:WaitForChild("Interactables")
local remote = Instance.new("RemoteEvent")
remote.Name = "SpareRoomEvent"
remote.Parent = ReplicatedStorage
-- Keep this allowlist server-side. Never put passwords in a Roblox place.
local ADMIN_USER_IDS = {} -- Example: [123456789] = true
local function isAdmin(player)
 return RunService:IsStudio() or ADMIN_USER_IDS[player.UserId] == true
  or (game.CreatorType == Enum.CreatorType.User and game.CreatorId == player.UserId)
end
local destinations = {
 Upstairs = Vector3.new(0,16,8), House = Vector3.new(0,4,-15), Garden = Vector3.new(0,4,35), Basement = Vector3.new(0,-14,-12),
 Cinema = Vector3.new(-96,4,-79), Archive = Vector3.new(-56,4,-79), Clinic = Vector3.new(-16,4,-79),
 Station = Vector3.new(24,4,-79), Workshop = Vector3.new(64,4,-79), Costumes = Vector3.new(104,4,-79),
 Park = Vector3.new(-85,4,35), School = Vector3.new(85,4,38), Bookshop = Vector3.new(-76,4,-11), Cafe = Vector3.new(76,4,-11),
}
local Revive = require(ReplicatedStorage:WaitForChild("SpareRoomRevive"))
local states = {}
local prompts = {}
local economy, lobby
local lobbySpawn=Vector3.new(400,4,5)
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
  household = household, observed = observed, admin = isAdmin(player), flying = s.flying == true, day = s.day or 1, started = s.started, mode = s.mode, classId=s.classId or "Wanderer", sanity = s.sanity, stamina = s.stamina,
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
 s.ended = id
 s.journal[id] = true
 if economy and id~="consumed" and id~="fallen" then task.spawn(function() economy:award(player,"ending:"..id,40) end) end
 s.sprint = false
 s.active=nil s.flying=false
 if id=="consumed" then
  local humanoid=player.Character and player.Character:FindFirstChildOfClass("Humanoid")
  if humanoid then humanoid.Health=0 end
 end
 remote:FireClient(player, "AnomalyEnd")
 remote:FireClient(player, "Ending", {id = id, title = ending.title, text = id=="legacy:burn" and not(s.flags.photo and s.flags.tape) and ending.unprotectedText or ending.text})
 snapshot(player)
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
  classId=economy and economy:class(player) or "Wanderer", started = true, mode = mode, sanity = 100, stamina = 100, diary = {}, evidence={}, records = {}, rooms = {},
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
if Config.ReviveProductId>0 then
 local ok,err=pcall(function()
  MarketplaceService:BindReceiptHandler(Enum.ReceiptType.DeveloperProduct,function(receipt)
   return reviveGate:receipt(receipt) and Enum.ReceiptDecision.Processed or Enum.ReceiptDecision.NotProcessedYet
  end,{Config.ReviveProductId})
 end)
 receiptReady=ok
 if not ok then warn("Revive receipt handler could not register; purchases disabled: "..tostring(err)) end
end
-- Filtered handler leaves HD Admin and other products' ProcessReceipt handlers intact.
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
local function inLobby(player) local s=states[player] return s~=nil and not s.started end
local function economyStatus(player,message)
 if player.Parent==Players then remote:FireClient(player,"EconomyStatus",message) end
end
economy=Economy.new({store=economyStore,classes=Config.Classes,products=products,market=MarketplaceService,
 player=function(id) return Players:GetPlayerByUserId(id) end,present=function(p) return p.Parent==Players end,
 lobby=inLobby,wait=function() task.wait() end,ready=function() return shardReceiptsReady end,
 send=function(p,data) remote:FireClient(p,"Economy",data) end,status=economyStatus})
if #productIds>0 then
 local ok,err=pcall(function()
  MarketplaceService:BindReceiptHandler(Enum.ReceiptType.DeveloperProduct,function(info)
   return economy:receipt(info) and Enum.ReceiptDecision.Processed or Enum.ReceiptDecision.NotProcessedYet
  end,productIds)
 end)
 shardReceiptsReady=ok
 if not ok then warn("Shard checkout disabled: "..tostring(err)) end
end
MarketplaceService.PromptProductPurchaseFinished:Connect(function(userId,id)
 local p=Players:GetPlayerByUserId(userId) if p then economy:closed(p,id) end
end)
lobby=Lobby.new({modes=Config.Modes,available=inLobby,status=economyStatus,
 send=function(p,data) if p.Parent==Players then remote:FireClient(p,"Queue",data) end end,
 move=function(p,mode)
  local x=mode=="Easy" and 378 or mode=="Intermediate" and 400 or 422
  if p.Character then p.Character:PivotTo(CFrame.new(x,4,-6)) end
 end,
 start=function(p,mode,group)
  p:SetAttribute("DepartureGroup",group) reset(p,mode)
 end})
local function returnLobby(player)
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
  if s.started or s.reading then return false end
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
local function sourceRequirements(s,r)
 if not r then return true end
 local function has(id)
  local n=string.match(id,"^diary(%d+)$")
  return n and s.diary[tonumber(n)] or s.evidence and s.evidence[id]
 end
 for _,id in ipairs(r.items or {}) do if not has(id) then return false end end
 for _,f in ipairs(r.flags or {}) do if not s.flags[f] then return false end end
 for _,id in ipairs(r.anomalies or {}) do if not s.anomalies["source:"..id] then return false end end
 local types={photos="photo",records="record",drawings="drawing",letters="letter",memories="memory",dad="dad"}
 for key,kind in pairs(types) do
  if r[key] then
   local n=0 for _,item in ipairs(Content.deepItems) do if item.type==kind and has(item.id) then n+=1 end end
   if n<r[key] then return false end
  end
 end
 local witnessed=0 for id in pairs(s.anomalies) do if string.sub(id,1,7)=="source:" then witnessed+=1 end end
 return count(s.diary)>=(r.diary or 0) and witnessed>=(r.anomalyCount or 0)
  and (not r.sanityMin or s.sanity>=r.sanityMin) and (not r.sanityMax or s.sanity<=r.sanityMax)
end
local function roomUnlocked(s,id)
 local items=s.evidence or {}
 if id=="archive" then return items["key-archive"] end
 if id=="study" then return items["key-study"] end
 if id=="observation" then return items["key-observation"] end
 if id=="sealed" then return items["key-observation"] and s.flags.valve end
 return true
end
local function interact(player, part)
 local s = states[player]
 local role = value(part, "Role")
 if role=="roomGate" then
  local room=value(part,"Room")
  if not roomUnlocked(s,room) then tell(player,"The door needs its labelled key"..(room=="sealed" and " and an isolated boiler valve." or ".")) return end
  local root=position(player) local side=part.Position.X>0 and 1 or -1
  local inside=root and math.abs(root.Position.X)>4
  player.Character:PivotTo(CFrame.new(inside and 0 or side*8,-14,part.Position.Z))
 elseif role=="lobbyQueue" then
  lobby:join(player,value(part,"Mode"))
 elseif role=="lobbyShop" then
  if lobby.membership[player] then economyStatus(player,"Leave the departure queue before shopping.")
  else economy:publish(player) remote:FireClient(player,"OpenClassShop") end
 elseif role=="lobbySolo" then
  local mode=value(part,"Mode")
  if Config.Modes[mode] then lobby:leave(player) reset(player,mode) end
 elseif role=="lobbyNote" then
  read(player,part,value(part,"Text"),0)
 elseif role=="observe" then
  local options={} for _,a in ipairs(Config.Anomalies) do if a.source and a.room==value(part,"Room") then table.insert(options,a.id) end end
  if #options>0 and not s.active then s.requestedAnomaly=options[math.random(#options)] s.nextAnomaly=s.time end
 elseif role=="evidence" then
  local id=value(part,"Evidence") s.evidence=s.evidence or {}
  local first=not s.evidence[id] s.evidence[id]=true
  if id=="key-chamber" then s.key=true end
  read(player,part,value(part,"Text"),first and value(part,"Category")~="key" and 2 or 0)
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
  if count(s.diary) < 12 or (count(s.records) < 3 and not sourceRequirements(s,{records=3})) or not s.key then
   tell(player, "The chamber needs 12 diary pages, 3 family records and the unnumbered key.")
  else
   player.Character:PivotTo(CFrame.new(9, -14, 63))
  end
 elseif role == "ending" then
  local id = value(part, "Ending")
  local e = Config.Endings[id]
  if not e then return end
  local ready = count(s.diary) >= (e.diary or 0) and count(s.records) >= (e.records or 0)
   and count(s.anomalies) >= (e.anomalies or 0) and (not e.anchor or s.flags.anchor)
   and (not e.valve or s.flags.valve) and (not e.mum or s.flags.mum)
   and (not e.sanityMax or s.sanity <= e.sanityMax)
  ready=ready and sourceRequirements(s,e.requirements)
  if e.dayOnly and (Lighting.ClockTime<7 or Lighting.ClockTime>18) then ready=false end
  for _,flag in ipairs(e.flags or {}) do if not s.flags[flag] then ready=false end end
  if ready then
   s.sequence += 1
   s.confirm = {id = id, nonce = s.sequence, part = part}
   remote:FireClient(player, "Confirm", {id = id, nonce = s.sequence, title = e.title, text = id=="legacy:burn" and not(s.flags.photo and s.flags.tape) and e.unprotectedText or e.text})
   s.menu = true
  else
   if e.requirements then tell(player,"This ending needs more original evidence, room decisions or witnessed anomalies. Keep exploring the basement stations.") return end
   if e.flags then tell(player,"Read the room’s hidden note and complete its unfinished task first.") return end
   tell(player, "Requires diary pages: " .. (e.diary or 0) .. ", records: " .. (e.records or 0) .. ", anomalies: " .. (e.anomalies or 0)
    .. (e.anchor and "; hold the ordinary memory" or "") .. (e.valve and "; isolate the boiler pipe" or "")
    .. (e.mum and "; speak with Mum" or "") .. (e.sanityMax and "; sanity at or below " .. e.sanityMax .. "%" or ""))
  end
 end
 snapshot(player)
end
local atmosphere=Instance.new("Atmosphere") atmosphere.Name="AshfieldHaze"
atmosphere.Density=0.18 atmosphere.Offset=0.05 atmosphere.Color=Color3.fromRGB(191,204,184)
atmosphere.Decay=Color3.fromRGB(91,110,98) atmosphere.Glare=0.12 atmosphere.Haze=1.2 atmosphere.Parent=Lighting
local rays=Instance.new("SunRaysEffect") rays.Intensity=0.025 rays.Spread=0.8 rays.Parent=Lighting
Lighting.ClockTime = 8
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
   light.Shadows = part.Position.Y < -5 or math.abs(part.Position.X)<25
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
  end
 end
end
for _, part in ipairs(items:GetChildren()) do
 if part:IsA("BasePart") then
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
local function joined(player)
 states[player] = {
  started = false, mode = "Easy", sanity = 100, stamina = 100, diary = {}, evidence={}, records = {}, rooms = {},
  anomalies = {}, journal = {}, flags = {}, time = 0, sandwichAt = 0, sequence = 0, nextAnomaly = 45, lastRequest = 0,
 }
 task.spawn(function() economy:load(player) end)
 if Config.SaveEndingJournal then
  task.spawn(function()
   local ok, saved = pcall(function() return DataStoreService:GetDataStore("SpareRoomRobloxEndings_v1"):GetAsync("u" .. player.UserId) end)
   local s = states[player]
   if not s then return end
   s.canSave = ok
   if ok and typeof(saved) == "table" then for id, yes in pairs(saved) do if yes == true and Config.Endings[id] then s.journal[id] = true end end end
   snapshot(player)
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
 lobby:leave(player) economy:forget(player)
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
 if action == "Admin" then
  if not isAdmin(player) or not s.started or s.ended or typeof(data) ~= "table" then return end
  if now - (s.lastAdmin or 0) < 0.3 then return end
  s.lastAdmin = now
  local root = position(player)
  if data.command == "Teleport" and typeof(data.value) == "string" and destinations[data.value] and root then
   player.Character:PivotTo(CFrame.new(destinations[data.value]))
   remote:FireClient(player, "AnomalyEnd")
   s.active = nil
  elseif data.command == "Sanity" and typeof(data.value) == "number" and (data.value == 10 or data.value == -10) then
   if data.value < 0 then damage(player, 10) else s.sanity = math.min(100, s.sanity + 10) end
  elseif data.command == "Fly" then
   s.flying = not s.flying
  elseif data.command == "Day" then
   s.day = (s.day or 1) + 1
   s.time += 1200
   tell(player, "Admin: advanced to day " .. s.day .. ".")
  elseif data.command == "Clear" then
   s.active = nil
   s.nextAnomaly = s.time + Config.Modes[s.mode].delay
   remote:FireClient(player, "AnomalyEnd")
  elseif data.command == "Anomaly" and typeof(data.value) == "string" then
   for _, a in ipairs(Config.Anomalies) do
    if a.id == data.value then
     if a.id=="watcher" or a.id=="doll" or a.id=="family" then
      local templates=ReplicatedStorage:FindFirstChild("SpareRoomAvatarTemplates")
      if not templates or not templates:FindFirstChild(a.id=="doll" and "Doll" or "Watcher") then
       tell(player,"The house is still preparing its visitors. Try this avatar anomaly again shortly.")
       return
      end
     end
     -- Use the same floor/clearance checks as natural anomalies.
     s.adminAnomaly = a.id
     s.nextAnomaly = s.time
     s.active = nil
     break
    end
   end
  end
  snapshot(player)
  return
 end
 if action=="Lobby" or action=="EnterLobby" then returnLobby(player) return end
 if action=="Queue" then
  if now-(s.lastLobbyRequest or -10)<0.4 then return end s.lastLobbyRequest=now
  if data=="Leave" then lobby:leave(player) elseif typeof(data)=="string" then lobby:join(player,data) end return
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
  if s.reviveBusy then return end
  if now - (s.lastStart or -10) < 2 then return end
  s.lastStart = now
 end
 if action == "Start" then
  if not s.started and typeof(data) == "string" and Config.Modes[data] then lobby:leave(player) reset(player, data) end
 elseif action == "ReadClosed" then
  if s.reading and data == s.reading.id then
   local cost = s.reading.cost
   s.reading = nil
   damage(player, cost)
   snapshot(player)
  end
 elseif action == "Pause" then
  if s.started and not s.ended and not s.reading then s.menu = data == true end
 elseif action == "Finish" then
  local c = s.confirm
  if c and data == c.nonce then
   s.menu = false
   s.confirm = nil
   local root = position(player)
   local e=Config.Endings[c.id]
   local allowed=e and sourceRequirements(s,e.requirements)
   for _,flag in ipairs(e and e.flags or {}) do if not s.flags[flag] then allowed=false end end
   if e and e.dayOnly and (Lighting.ClockTime<7 or Lighting.ClockTime>18) then allowed=false end
   if root and allowed and (root.Position - c.part.Position).Magnitude < 8 then finish(player, c.id) end
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
local function eventPoint(player)
 local root = position(player)
 if not root then return nil end
 local params = RaycastParams.new()
 params.FilterType = Enum.RaycastFilterType.Exclude
 params.FilterDescendantsInstances = {player.Character, workspace:FindFirstChild("SpareRoomNPCs")}
 for _, offset in ipairs({Vector3.new(4, 0, 0), Vector3.new(-4, 0, 0), Vector3.new(0, 0, 4), Vector3.new(0, 0, -4)}) do
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
RunService.Heartbeat:Connect(function(dt)
 -- One shared 12-minute day: keeps advancing while reading or in the safe lobby.
 worldSeconds+=dt
 worldDay=math.floor((8+worldSeconds/30)/24)+1
 local hour=(8+worldSeconds/30)%24
 Lighting.ClockTime=hour
 local daylight=math.clamp(math.sin((hour-6)/12*math.pi),0,1)
 Lighting.Brightness=1.2+daylight*1.3
 Lighting.OutdoorAmbient=Color3.fromRGB(48+daylight*65,55+daylight*65,63+daylight*62)
 Lighting.ExposureCompensation=-0.1+daylight*0.15
 lobbyAccumulator+=dt
 if lobbyAccumulator>=0.5 then local elapsed=lobbyAccumulator lobbyAccumulator=0 lobby:step(elapsed) end
 accumulator += dt
 for player, s in pairs(states) do
  local root = position(player)
  local humanoid = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
  if humanoid then
   local locked = s.started and paused(s) or (not s.started and s.reading~=nil)
   local moving = root and Vector3.new(root.AssemblyLinearVelocity.X, 0, root.AssemblyLinearVelocity.Z).Magnitude > 1
   if not locked then
    if s.stamina >= 25 then s.exhausted = false end
    local sprinting = s.sprint and not s.exhausted and moving
    s.stamina = math.clamp(s.stamina + (sprinting and -26*classStats(s).stamina or 18*classStats(s).recovery) * dt, 0, 100)
    if s.stamina == 0 then s.exhausted = true end
    humanoid.WalkSpeed = sprinting and 20 or 12
   else humanoid.WalkSpeed = 0 end
   humanoid.JumpPower = locked and 0 or 45
  end
  if not paused(s) then
   s.time += dt
   local mode = Config.Modes[s.mode]
   s.sanity = math.max(0, s.sanity - mode.drain * classStats(s).drain * dt)
   if s.sanity <= 0 then finish(player, "consumed") continue end
   if root then
    local row = math.floor((root.Position.Z + 18) / 18)
    if root.Position.Y < -6 and row >= 0 and row < 5 and math.abs(root.Position.X) > 4 and math.abs(root.Position.X) < 28 then
     s.rooms[row * 2 + (root.Position.X > 0 and 2 or 1)] = true
    end
    if not s.active and s.time >= s.nextAnomaly then
     local point = eventPoint(player)
     if point then
      s.sequence += 1
      local a = nil
      if s.adminAnomaly or s.requestedAnomaly then
       local requested=s.adminAnomaly or s.requestedAnomaly
       for _, candidate in ipairs(Config.Anomalies) do if candidate.id == requested then a = candidate break end end
       s.adminAnomaly = nil s.requestedAnomaly=nil
      else a = nextNaturalAnomaly(s) end
      local templates=ReplicatedStorage:FindFirstChild("SpareRoomAvatarTemplates")
      if (a.id=="watcher" or a.id=="doll" or a.id=="family") and (not templates or not templates:FindFirstChild(a.id=="doll" and "Doll" or "Watcher")) then
       a=Config.Anomalies[3] -- API avatar creation may still be loading; retry through the next bag.
      end
      s.active = {elapsed = 0, duration = a.source and 18 or 14, floor = root.Position.Y < -6 and "below" or "above"}
      s.anomalies[a.id] = true
      remote:FireClient(player, "Anomaly", {id = a.visualId or a.id, title = a.title, text = a.text, position = point, duration = s.active.duration})
      if not a.source then damage(player, 2.5) end
     else s.nextAnomaly = s.time + 8 if s.adminAnomaly then tell(player, "Move to an open floor area so the anomaly can appear safely.") end end
    end
   end
   if s.active then
    s.active.elapsed += dt
    if not root or (root.Position.Y < -6 and "below" or "above") ~= s.active.floor or s.active.elapsed >= s.active.duration then
     s.active = nil
     s.nextAnomaly = s.time + mode.delay
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

