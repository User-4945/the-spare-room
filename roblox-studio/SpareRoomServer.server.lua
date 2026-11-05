-- ServerScriptService/SpareRoomServer
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Lighting = game:GetService("Lighting")
local DataStoreService = game:GetService("DataStoreService")
local Config = require(ReplicatedStorage:WaitForChild("SpareRoomConfig"))
local world = workspace:WaitForChild("SpareRoomWorld")
local items = world:WaitForChild("Interactables")
local remote = Instance.new("RemoteEvent")
remote.Name = "SpareRoomEvent"
remote.Parent = ReplicatedStorage
local states = {}
local prompts = {}
local holds = {}
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
 local journal = {}
 for id in pairs(s.journal) do
  local e = Config.Endings[id]
  if e then table.insert(journal, e.title) end
 end
 table.sort(journal)
 remote:FireClient(player, "State", {
  started = s.started, mode = s.mode, sanity = s.sanity, stamina = s.stamina,
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
 s.sprint = false
 remote:FireClient(player, "AnomalyEnd")
 remote:FireClient(player, "Ending", {id = id, title = ending.title, text = ending.text})
 snapshot(player)
 saveJournal(player, s)
end
local function damage(player, amount)
 local s = states[player]
 if not s or s.ended then return end
 local loss = amount * Config.Modes[s.mode].damage
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
  started = true, mode = mode, sanity = 100, stamina = 100, diary = {}, records = {}, rooms = {},
  anomalies = {}, journal = old and old.journal or {}, canSave = old and old.canSave or false,
  flags = {}, key = false, sandwichAt = 0, time = 0, nextAnomaly = Config.Modes[mode].delay,
  active = nil, menu = false, reading = nil, ended = nil, sprint = false, exhausted = false,
  sequence = old and old.sequence or 0, lastRequest = 0, lastStart = os.clock(),
 }
 holds[player] = {}
 remote:FireClient(player, "AnomalyEnd")
 if not player.Character or not player.Character:FindFirstChildOfClass("Humanoid") or player.Character:FindFirstChildOfClass("Humanoid").Health <= 0 then
  player:LoadCharacter()
 end
 local root = position(player)
 if root then player.Character:PivotTo(CFrame.new(0, 4, -11)) end
 snapshot(player)
end
local function valid(player, part)
 local s = states[player]
 local root = position(player)
 if not s or paused(s) or not root or not part:IsDescendantOf(items) then return false end
 if (root.Position - part.Position).Magnitude > 7.5 then return false end
 local params = RaycastParams.new()
 params.FilterType = Enum.RaycastFilterType.Exclude
 params.FilterDescendantsInstances = {player.Character}
 local hit = workspace:Raycast(root.Position, part.Position - root.Position, params)
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
 if role == "diary" then
  local n = tonumber(value(part, "Index"))
  if not n or not Config.Diary[n] then return end
  local first = not s.diary[n]
  s.diary[n] = true
  read(player, part, Config.Diary[n], first and (n > 10 and 3 or 1) or 0)
 elseif role == "record" then
  local id = value(part, "Index")
  local first = not s.records[id]
  s.records[id] = true
  read(player, part, value(part, "Text"), first and 3 or 0)
 elseif role == "mum" then
  s.flags.mum = true
  read(player, part, "“I remember making up the beds,” Mum says. “Please do not give me an answer just because I cannot find one.”", 0)
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
   s.sanity = math.min(100, s.sanity + Config.Modes[s.mode].sandwich)
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
  if count(s.diary) < 12 or count(s.records) < 3 or not s.key then
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
  if ready then
   s.sequence += 1
   s.confirm = {id = id, nonce = s.sequence, part = part}
   remote:FireClient(player, "Confirm", {id = id, nonce = s.sequence, title = e.title, text = e.text})
   s.menu = true
  else
   tell(player, "Requires diary pages: " .. (e.diary or 0) .. ", records: " .. (e.records or 0) .. ", anomalies: " .. (e.anomalies or 0)
    .. (e.anchor and "; hold the ordinary memory" or "") .. (e.valve and "; isolate the boiler pipe" or "")
    .. (e.mum and "; speak with Mum" or "") .. (e.sanityMax and "; sanity at or below " .. e.sanityMax .. "%" or ""))
  end
 end
 snapshot(player)
end
Lighting.ClockTime = 0
Lighting.Brightness = 1
Lighting.Ambient = Color3.fromRGB(35, 39, 39)
Lighting.OutdoorAmbient = Color3.fromRGB(50, 57, 63)
Lighting.FogColor = Color3.fromRGB(17, 24, 25)
Lighting.FogStart = 65
Lighting.FogEnd = 170
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
   gui.Face = value(part, "Side") == "Right" and Enum.NormalId.Right or value(part, "Side") == "Left" and Enum.NormalId.Left or Enum.NormalId.Front
   gui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
   gui.PixelsPerStud = 60
   gui.AlwaysOnTop = false
   gui.Parent = part
   local label = Instance.new("TextLabel")
   label.Size = UDim2.fromScale(1, 1)
   label.BackgroundTransparency = 1
   label.TextColor3 = Color3.fromRGB(232, 218, 181)
   label.Font = Enum.Font.Gotham
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
  prompt.PromptButtonHoldBegan:Connect(function(player)
   if valid(player, part) then
    holds[player] = holds[player] or {}
    holds[player][part] = os.clock()
   end
  end)
  prompt.Triggered:Connect(function(player)
   local start = holds[player] and holds[player][part]
   if not start or os.clock() - start < 0.65 or os.clock() - start > 8 then return end
   holds[player][part] = nil
   if prompt.Enabled and valid(player, part) then interact(player, part) end
  end)
 end
end
local function joined(player)
 states[player] = {
  started = false, mode = "Easy", sanity = 100, stamina = 100, diary = {}, records = {}, rooms = {},
  anomalies = {}, journal = {}, flags = {}, time = 0, sandwichAt = 0, sequence = 0, nextAnomaly = 45, lastRequest = 0,
 }
 holds[player] = {}
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
  task.wait(0.1)
  if character.Parent then character:PivotTo(CFrame.new(0, 4, -11)) end
 end)
end
Players.PlayerAdded:Connect(joined)
for _, player in ipairs(Players:GetPlayers()) do joined(player) end
Players.PlayerRemoving:Connect(function(player)
 local s = states[player]
 if s then saveJournal(player, s) end
 states[player] = nil
 holds[player] = nil
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
 if action == "Ready" then snapshot(player) return end
 if action == "Sprint" then s.sprint = data == true return end
 if action == "Start" then
  if now - (s.lastStart or -10) < 2 then return end
  s.lastStart = now
 end
 if action == "Start" then
  if typeof(data) == "string" and Config.Modes[data] then reset(player, data) end
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
   if root and (root.Position - c.part.Position).Magnitude < 8 then finish(player, c.id) end
  end
 elseif action == "CancelEnding" then s.confirm = nil s.menu = false end
end)
local function eventPoint(player)
 local root = position(player)
 if not root then return nil end
 local params = RaycastParams.new()
 params.FilterType = Enum.RaycastFilterType.Exclude
 params.FilterDescendantsInstances = {player.Character}
 for _, offset in ipairs({Vector3.new(4, 0, 0), Vector3.new(-4, 0, 0), Vector3.new(0, 0, 4), Vector3.new(0, 0, -4)}) do
  if not workspace:Raycast(root.Position, offset, params) then
   local down = workspace:Raycast(root.Position + offset, Vector3.new(0, -8, 0), params)
   if down then
    local point = down.Position + Vector3.new(0, 0.05, 0)
    local overlap = OverlapParams.new()
    overlap.FilterType = Enum.RaycastFilterType.Exclude
    overlap.FilterDescendantsInstances = {player.Character}
    local clear = true
    for _, part in ipairs(workspace:GetPartBoundsInBox(CFrame.new(point + Vector3.new(0, 2, 0)), Vector3.new(4, 4, 5), overlap)) do
     if part.CanCollide then clear = false break end
    end
    if clear then return point end
   end
  end
 end
 return nil
end
local accumulator = 0
RunService.Heartbeat:Connect(function(dt)
 accumulator += dt
 for player, s in pairs(states) do
  local root = position(player)
  local humanoid = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
  if humanoid then
   local locked = paused(s)
   local moving = root and Vector3.new(root.AssemblyLinearVelocity.X, 0, root.AssemblyLinearVelocity.Z).Magnitude > 1
   if not locked then
    if s.stamina >= 25 then s.exhausted = false end
    local sprinting = s.sprint and not s.exhausted and moving
    s.stamina = math.clamp(s.stamina + (sprinting and -26 or 18) * dt, 0, 100)
    if s.stamina == 0 then s.exhausted = true end
    humanoid.WalkSpeed = sprinting and 20 or 12
   else humanoid.WalkSpeed = 0 end
   humanoid.JumpPower = locked and 0 or 45
  end
  if not paused(s) then
   s.time += dt
   local mode = Config.Modes[s.mode]
   s.sanity = math.max(0, s.sanity - mode.drain * dt)
   if s.sanity <= 0 then finish(player, "consumed") end
   if root and root.Position.Y < -6 then
    local row = math.floor((root.Position.Z + 18) / 18)
    if row >= 0 and row < 5 and math.abs(root.Position.X) > 4 and math.abs(root.Position.X) < 28 then
     s.rooms[row * 2 + (root.Position.X > 0 and 2 or 1)] = true
    end
    if not s.active and s.time >= s.nextAnomaly then
     local point = eventPoint(player)
     if point then
      s.sequence += 1
      local a = Config.Anomalies[(s.sequence % #Config.Anomalies) + 1]
      s.active = {elapsed = 0}
      s.anomalies[a.id] = true
      remote:FireClient(player, "Anomaly", {id = a.id, title = a.title, text = a.text, position = point})
      damage(player, 2.5)
     else s.nextAnomaly = s.time + 8 end
    end
   end
   if s.active then
    s.active.elapsed += dt
    if not root or root.Position.Y > -6 or s.active.elapsed >= 12 then
     s.active = nil
     s.nextAnomaly = s.time + mode.delay
     remote:FireClient(player, "AnomalyEnd")
    end
   end
  end
  if accumulator >= 0.5 then snapshot(player) end
 end
 if accumulator >= 0.5 then accumulator = 0 end
end)
