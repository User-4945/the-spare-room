-- StarterPlayerScripts/SpareRoomClient. Roblox renders and handles its default E/touch/controller hold prompts.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local ProximityPromptService = game:GetService("ProximityPromptService")
local player = Players.LocalPlayer
local remote = ReplicatedStorage:WaitForChild("SpareRoomEvent")
local Config = require(ReplicatedStorage:WaitForChild("SpareRoomConfig"))
local gui = Instance.new("ScreenGui")
gui.Name = "SpareRoomHUD"
gui.ResetOnSpawn = false
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
gui.Parent = player:WaitForChild("PlayerGui")
local canvas = Instance.new("Frame")
canvas.Name = "ResponsiveCanvas"
canvas.AnchorPoint = Vector2.new(0.5,0.5)
canvas.Position = UDim2.fromScale(0.5,0.5)
canvas.Size = UDim2.fromOffset(1280,720)
canvas.BackgroundTransparency = 1
canvas.Parent = gui
local uiScale = Instance.new("UIScale")
uiScale.Parent = canvas
local function fitCanvas()
 local c = workspace.CurrentCamera
 if c then uiScale.Scale = math.min(c.ViewportSize.X / 1280, math.max(1,c.ViewportSize.Y-40) / 720) end
end
local current = {started = false, sanity = 100, stamina = 100, journal = {}, mode = "Easy"}
local modalReason, readingId, confirmationNonce = nil, nil, nil
local thirdPerson = false
local cursorFree = false
local flashlightOn = true
local lastCameraMode = ""
local active = nil
local captionRemaining = 0
local gold = Color3.fromRGB(225, 204, 154)
local function frame(parent, name, pos, size)
 local f = Instance.new("Frame")
 f.Name = name
 f.Position = pos
 f.Size = size
 f.BackgroundColor3 = Color3.fromRGB(20, 22, 21)
 f.BackgroundTransparency = 0.08
 f.BorderColor3 = Color3.fromRGB(119, 108, 86)
 f.Parent = parent
 local corner = Instance.new("UICorner")
 corner.CornerRadius = UDim.new(0,5)
 corner.Parent = f
 return f
end
local function text(parent, content, pos, size, fontSize)
 local t = Instance.new("TextLabel")
 t.Position = pos
 t.Size = size
 t.BackgroundTransparency = 1
 t.Text = content
 t.Font = Enum.Font.Gotham
 t.TextSize = fontSize or 16
 t.TextColor3 = gold
 t.TextWrapped = true
 t.Parent = parent
 return t
end
local function button(parent, content, pos, size, callback)
 local b = Instance.new("TextButton")
 b.Position = pos
 b.Size = size
 b.BackgroundColor3 = Color3.fromRGB(48, 47, 40)
 b.TextColor3 = gold
 b.Font = Enum.Font.GothamBold
 b.TextSize = 16
 b.Text = content
 b.Parent = parent
 local corner = Instance.new("UICorner")
 corner.CornerRadius = UDim.new(0,4)
 corner.Parent = b
 b.Activated:Connect(callback)
 return b
end
local function blocked()
 return not current.started or current.ended ~= nil or modalReason ~= nil
end
local hud = frame(canvas, "Sanity", UDim2.fromOffset(28,26), UDim2.fromOffset(260,86))
local sanityText = text(hud, "SANITY 100%", UDim2.fromScale(0.04, 0.03), UDim2.fromScale(0.92, 0.3), 16)
local sanityTrack = frame(hud, "SanityTrack", UDim2.fromScale(0.06, 0.4), UDim2.fromScale(0.88, 0.08))
local sanityFill = frame(sanityTrack, "Fill", UDim2.fromScale(0, 0), UDim2.fromScale(1, 1))
sanityFill.BackgroundColor3 = gold
local staminaText = text(hud, "STAMINA 100%", UDim2.fromScale(0.04, 0.56), UDim2.fromScale(0.92, 0.3), 13)
local tasks = frame(canvas, "Tasks", UDim2.fromOffset(936,438), UDim2.fromOffset(316,216))
local tasksText = text(tasks, "", UDim2.fromScale(0.05, 0.03), UDim2.fromScale(0.9, 0.94), 14)
tasksText.TextYAlignment = Enum.TextYAlignment.Top
tasksText.TextXAlignment = Enum.TextXAlignment.Left
local caption = frame(canvas, "Caption", UDim2.fromOffset(310,116), UDim2.fromOffset(660,74))
caption.Visible = false
local captionText = text(caption, "", UDim2.fromScale(0.04, 0.05), UDim2.fromScale(0.92, 0.9), 16)
local cross = frame(canvas, "Crosshair", UDim2.new(0.5, -1, 0.5, -1), UDim2.fromOffset(3, 3))
cross.BackgroundColor3 = gold
cross.BorderSizePixel = 0
local title = frame(canvas, "TitleScreen", UDim2.fromScale(0, 0), UDim2.fromScale(1, 1))
title.ZIndex = 10
text(title, "THE SPARE ROOM", UDim2.fromScale(0.1, 0.12), UDim2.fromScale(0.8, 0.12), 32)
text(title, "BENEATH THE HOUSE\nThere was always something underneath.\n\nRoblox Studio starter · six ending paths", UDim2.fromScale(0.1, 0.27), UDim2.fromScale(0.8, 0.2), 19)
for i, mode in ipairs({"Easy", "Intermediate", "Hard"}) do
 button(title, mode, UDim2.fromScale(0.32, 0.5 + (i - 1) * 0.1), UDim2.fromScale(0.36, 0.08), function()
  remote:FireServer("Start", mode)
 end)
end
text(title, "WASD · Shift sprint · Space jump · V camera\nHold E, click, touch or controller X near an object.\nRead the hallway invitation, then inspect the maintenance hatch.", UDim2.fromScale(0.1, 0.83), UDim2.fromScale(0.8, 0.14), 14)
local modal = frame(canvas, "Reading", UDim2.fromScale(0.12, 0.13), UDim2.fromScale(0.76, 0.72))
modal.ZIndex = 20
modal.Visible = false
local heading = text(modal, "", UDim2.fromScale(0.05, 0.03), UDim2.fromScale(0.9, 0.16), 25)
local paper = Instance.new("ScrollingFrame")
paper.Position = UDim2.fromScale(0.06,0.22)
paper.Size = UDim2.fromScale(0.88,0.56)
paper.BackgroundTransparency = 1
paper.BorderSizePixel = 0
paper.ScrollBarThickness = 4
paper.AutomaticCanvasSize = Enum.AutomaticSize.Y
paper.CanvasSize = UDim2.new()
paper.Parent = modal
local body = text(paper, "", UDim2.fromOffset(0,0), UDim2.new(1,-14,0,0), 17)
body.AutomaticSize = Enum.AutomaticSize.Y
body.TextYAlignment = Enum.TextYAlignment.Top
body.TextXAlignment = Enum.TextXAlignment.Left
local closeButton
local chooseButton
local function closeModal()
 local reason = modalReason
 modalReason = nil
 modal.Visible = false
 if reason == "read" then remote:FireServer("ReadClosed", readingId)
 elseif reason == "confirm" then remote:FireServer("CancelEnding")
 elseif reason == "admin" then remote:FireServer("Pause", false)
 elseif reason == "map" then remote:FireServer("Pause", false)
 elseif reason == "journal" then remote:FireServer("Pause", false)
 elseif reason == "ending" then remote:FireServer("Start", current.mode) end
end
closeButton = button(modal, "Close", UDim2.fromScale(0.05, 0.85), UDim2.fromScale(0.42, 0.1), closeModal)
chooseButton = button(modal, "Choose this ending", UDim2.fromScale(0.52, 0.85), UDim2.fromScale(0.43, 0.1), function()
 if modalReason == "confirm" then remote:FireServer("Finish", confirmationNonce) end
end)
chooseButton.Visible = false
local journalButton = button(canvas, "JOURNAL", UDim2.fromOffset(1136,26), UDim2.fromOffset(116, 36), function()
 if blocked() then return end
 modalReason = "journal"
 heading.Text = "Ending journal"
 local endings = #current.journal > 0 and table.concat(current.journal, "\n") or "No endings recorded yet."
 local observed = current.observed or {}
 body.Text = "ENDING JOURNAL\n" .. endings .. "\n\nANOMALY FIELD NOTES (" .. #observed .. "/" .. #Config.Anomalies .. ")\n"
  .. (#observed > 0 and table.concat(observed,"\n\n") or "No anomalies witnessed this run.")
 closeButton.Text = "Close"
 chooseButton.Visible = false
 modal.Visible = true
 remote:FireServer("Pause", true)
end)
local cameraButton = button(canvas, "CAMERA · V", UDim2.fromOffset(1136,68), UDim2.fromOffset(116, 36), function()
 if not blocked() then thirdPerson = not thirdPerson end
end)
local mouseButton
local function toggleMouse()
 if blocked() then return end
 cursorFree = not cursorFree
end
mouseButton = button(canvas,"MOUSE / M",UDim2.fromOffset(1136,152),UDim2.fromOffset(116,36),toggleMouse)
local lampButton
local function toggleTorch()
 if blocked() then return end
 flashlightOn=not flashlightOn
 lampButton.Text=flashlightOn and "LIGHT ON / F" or "LIGHT OFF / F"
end
lampButton=button(canvas,"LIGHT ON / F",UDim2.fromOffset(1136,194),UDim2.fromOffset(116,36),toggleTorch)
local function openMap()
 if blocked() then return end
 modalReason="map"
 heading.Text="ASHFIELD / DISTRICT GUIDE"
 local root=player.Character and player.Character:FindFirstChild("HumanoidRootPart")
 local location=root and root.Position.Y < -6 and "Beneath the house" or "House and district"
 body.Text="YOU ARE: "..location.."\n\nLeave through the house's front entrance. Follow the path to the road.\n\nACROSS THE ROAD — west to east\nThe Palladium cinema · Municipal Archive · St. Agnes Clinic · Ashfield Station · Ward & Sons · Velvet & Ash\n\nON THE HOUSE SIDE\nThe Second Copy bookshop to the west. The Empty Chair cafe to the east.\n\nAT HOME\nThe garden is behind the house. The maintenance hatch at the end of the hallway leads below. Use the return stairs to come home.\n\nPlaces change what you notice. Read the correspondence in every venue."
 closeButton.Text="Fold the map"
 chooseButton.Visible=false
 modal.Visible=true
 remote:FireServer("Pause",true)
end
local mapButton=button(canvas,"MAP / G",UDim2.fromOffset(1136,236),UDim2.fromOffset(116,36),openMap)
local touchSprint = false
local sprintButton = button(canvas, "SPRINT", UDim2.fromScale(0.02, 0.72), UDim2.fromOffset(110, 36), function()
 if blocked() then return end
 touchSprint = not touchSprint
 remote:FireServer("Sprint", touchSprint)
end)
sprintButton.Visible = UserInputService.TouchEnabled
local controlHints = text(canvas, "WASD  MOVE     SHIFT  SPRINT     SPACE  JUMP     HOLD E  INTERACT     M  MOUSE     F  LIGHT     G  MAP", UDim2.fromOffset(250,674), UDim2.fromOffset(780,26),12)
-- Admin UI is only shown after server-confirmed authorization.
local adminPanel = frame(canvas, "AdminPanel", UDim2.fromOffset(300,92), UDim2.fromOffset(680,540))
adminPanel.Visible = false
adminPanel.ZIndex = 30
text(adminPanel,"HOUSEKEEPER / ADMIN TOOLS",UDim2.fromOffset(24,12),UDim2.fromOffset(500,38),23)
local adminScroll = Instance.new("ScrollingFrame")
adminScroll.Position = UDim2.fromOffset(24,64)
adminScroll.Size = UDim2.fromOffset(632,404)
adminScroll.BackgroundTransparency = 1
adminScroll.ScrollBarThickness = 5
adminScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
adminScroll.CanvasSize = UDim2.new()
adminScroll.Parent = adminPanel
local adminLayout = Instance.new("UIListLayout")
adminLayout.Padding = UDim.new(0,8)
adminLayout.SortOrder = Enum.SortOrder.LayoutOrder
adminLayout.Parent = adminScroll
local function adminAction(command,value)
 remote:FireServer("Admin",{command=command,value=value})
end
local rowNumber = 0
local function adminRow(label,command,value)
 rowNumber += 1
 local b = button(adminScroll,label,UDim2.new(),UDim2.new(1,-12,0,36),function() adminAction(command,value) end)
 b.LayoutOrder = rowNumber
end
for _, location in ipairs({"House","Garden","Basement","Cinema","Archive","Clinic","Station","Workshop","Costumes","Bookshop","Cafe"}) do
 adminRow("TELEPORT / "..location,"Teleport",location)
end
for _, a in ipairs(Config.Anomalies) do adminRow("ANOMALY / "..a.title,"Anomaly",a.id) end
adminRow("Clear active anomaly","Clear")
adminRow("Restore sanity +10%","Sanity",10)
adminRow("Remove sanity 10% (difficulty adjusted)","Sanity",-10)
adminRow("Toggle flight (WASD, Space up, Ctrl down)","Fly")
adminRow("Skip one day / advance event timers","Day")
button(adminPanel,"Return to game",UDim2.fromOffset(24,482),UDim2.fromOffset(632,38),function()
 adminPanel.Visible=false
 modalReason=nil
 remote:FireServer("Pause",false)
end)
local function toggleAdmin()
 if not current.admin or not current.started or current.ended then return end
 if adminPanel.Visible then
  adminPanel.Visible=false modalReason=nil remote:FireServer("Pause",false)
 elseif not modalReason then
  adminPanel.Visible=true modalReason="admin" remote:FireServer("Pause",true)
 end
end
local adminButton = button(canvas,"ADMIN / F8",UDim2.fromOffset(1136,110),UDim2.fromOffset(116,36),toggleAdmin)
adminButton.Visible=false
local flyAttachment, flyVelocity, flyRoot
local function stopFlight()
 if flyVelocity then flyVelocity:Destroy() flyVelocity=nil end
 if flyAttachment then flyAttachment:Destroy() flyAttachment=nil end
 if flyRoot and flyRoot.Parent then
  local h=flyRoot.Parent:FindFirstChildOfClass("Humanoid")
  if h then h.PlatformStand=false end
 end
 flyRoot=nil
end
local flash = frame(canvas, "SanityFlash", UDim2.fromScale(0, 0), UDim2.fromScale(1, 1))
flash.BackgroundColor3 = Color3.fromRGB(110, 20, 15)
flash.BackgroundTransparency = 1
flash.ZIndex = 6
flash.BorderSizePixel = 0
local flashTween = nil
local torchPart = Instance.new("Part")
torchPart.Name = "SpareRoomLocalTorch"
torchPart.Anchored = true
torchPart.CanCollide = false
torchPart.CanQuery = false
torchPart.CanTouch = false
torchPart.Transparency = 1
torchPart.Size = Vector3.new(0.1, 0.1, 0.1)
torchPart.Parent = workspace
local torch = Instance.new("SpotLight")
torch.Face = Enum.NormalId.Front
torch.Range = 26
torch.Angle = 72
torch.Brightness = 2.6
torch.Color = Color3.fromRGB(233, 219, 183)
torch.Shadows = true
torch.Parent = torchPart
local highlight = Instance.new("Highlight")
highlight.Name = "NearbyInteractable"
highlight.DepthMode = Enum.HighlightDepthMode.Occluded
highlight.FillTransparency = 0.88
highlight.OutlineColor = gold
highlight.FillColor = gold
highlight.Enabled = false
highlight.Parent = workspace
local shown = {}
ProximityPromptService.PromptShown:Connect(function(prompt)
 if prompt:IsDescendantOf(workspace:WaitForChild("SpareRoomWorld"):WaitForChild("Interactables")) then shown[prompt] = true end
end)
ProximityPromptService.PromptHidden:Connect(function(prompt) shown[prompt] = nil end)
local function showCaption(message, duration)
 captionText.Text = message
 captionRemaining = duration or 7
 caption.Visible = not blocked()
end
local function endAnomaly()
 if active then active.model:Destroy() active = nil end
end
local function anomalyPart(model, size, color)
 local part = Instance.new("Part")
 part.Size = size
 part.Color = color
 part.Material = Enum.Material.SmoothPlastic
 part.Anchored = true
 part.CanCollide = false
 part.CanQuery = false
 part.CanTouch = false
 part.Parent = model
 return part
end
local function startAnomaly(data)
 endAnomaly()
 local model = Instance.new("Model")
 model.Name = "SpareRoomLocalAnomaly"
 model.Parent = workspace
 local camera = workspace.CurrentCamera
 local p = data.position
 local eye = camera.CFrame.Position
 local base = CFrame.lookAt(p, Vector3.new(eye.X, p.Y, eye.Z))
 local parts = {}
 if data.id == "coat" then
  parts[1] = anomalyPart(model, Vector3.new(1.2, 2.1, 0.4), Color3.fromRGB(89, 106, 91))
  parts[2] = anomalyPart(model, Vector3.new(0.6, 0.5, 0.4), Color3.fromRGB(158, 147, 113))
  for i = 3, 4 do parts[i] = anomalyPart(model, Vector3.new(0.3, 1.5, 0.35), Color3.fromRGB(89, 106, 91)) end
 elseif data.id == "steps" then
  for i = 1, 7 do parts[i] = anomalyPart(model, Vector3.new(0.35, 0.035, 0.7), Color3.fromRGB(59, 77, 65)) end
 elseif data.id == "clock" then
  parts[1] = anomalyPart(model, Vector3.new(2, 2, 0.16), Color3.fromRGB(194, 184, 149))
  parts[1].Shape = Enum.PartType.Ball
  parts[2] = anomalyPart(model, Vector3.new(0.08, 0.9, 0.06), Color3.fromRGB(31, 49, 41))
 elseif data.id == "chair" then
  parts[1] = anomalyPart(model, Vector3.new(1.5, 0.18, 1.5), Color3.fromRGB(129, 103, 74))
  parts[2] = anomalyPart(model, Vector3.new(1.5, 1.7, 0.15), Color3.fromRGB(129, 103, 74))
  for i = 3, 6 do parts[i] = anomalyPart(model, Vector3.new(0.15, 1.4, 0.15), Color3.fromRGB(91, 76, 57)) end
 end
 if data.id == "pages" then
  for i=1,8 do parts[i]=anomalyPart(model,Vector3.new(0.7,0.025,1),Color3.fromRGB(205,194,160)) end
 elseif data.id == "door" then
  parts[1]=anomalyPart(model,Vector3.new(2.4,4.8,0.16),Color3.fromRGB(83,68,50))
  parts[2]=anomalyPart(model,Vector3.new(0.12,0.12,0.25),Color3.fromRGB(185,157,93))
  for i=3,4 do parts[i]=anomalyPart(model,Vector3.new(0.16,5.1,0.3),Color3.fromRGB(138,119,86)) end
  parts[5]=anomalyPart(model,Vector3.new(2.8,0.2,0.3),Color3.fromRGB(138,119,86))
 elseif data.id == "family" then
  for i=1,8 do
   parts[i]=anomalyPart(model,i%2==0 and Vector3.new(0.55,0.6,0.55) or Vector3.new(0.7,1.6,0.35),Color3.fromRGB(31,39,35))
   if i%2==0 then parts[i].Shape=Enum.PartType.Ball end
  end
 elseif data.id == "blocks" then
  for i=1,5 do
   parts[i]=anomalyPart(model,Vector3.new(0.65,0.65,0.65),Color3.fromRGB(126+i*9,113+i*3,82))
   local face=Instance.new("SurfaceGui") face.Face=Enum.NormalId.Front face.Parent=parts[i]
   local letter=text(face,string.sub("HOME?",i,i),UDim2.new(),UDim2.fromScale(1,1),32)
   letter.TextScaled=true letter.TextColor3=Color3.fromRGB(46,49,41)
  end
 elseif data.id == "plates" then
  for i=1,5 do
   parts[i]=anomalyPart(model,Vector3.new(0.09,1.05,1.05),Color3.fromRGB(194,189,164))
   parts[i].Shape=Enum.PartType.Cylinder
  end
 elseif data.id == "lamp" then
  parts[1]=anomalyPart(model,Vector3.new(0.2,2.6,0.2),Color3.fromRGB(80,81,63))
  parts[2]=anomalyPart(model,Vector3.new(1.5,0.6,1.5),Color3.fromRGB(183,166,121))
  parts[3]=anomalyPart(model,Vector3.new(1.1,0.1,1.1),Color3.fromRGB(79,79,60))
  local light=Instance.new("PointLight") light.Range=10 light.Color=Color3.fromRGB(237,207,143) light.Parent=parts[2]
 end
 for _,part in ipairs(parts) do part.CFrame=base end
 active = {model = model, parts = parts, base = base, id = data.id, time = 0, duration = data.duration or 12}
 showCaption(data.title .. " — " .. data.text, data.duration or 12)
end
UserInputService.InputBegan:Connect(function(input, processed)
 if processed then return end
 if input.KeyCode == Enum.KeyCode.F8 then toggleAdmin() return end
 if input.KeyCode == Enum.KeyCode.M then toggleMouse() return end
 if input.KeyCode == Enum.KeyCode.F then toggleTorch() return end
 if input.KeyCode == Enum.KeyCode.G then openMap() return end
 if input.UserInputType == Enum.UserInputType.MouseButton1 and cursorFree and not blocked() then cursorFree=false end
 if input.KeyCode == Enum.KeyCode.LeftShift and not blocked() then remote:FireServer("Sprint", true) end
 if input.KeyCode == Enum.KeyCode.V and not blocked() then thirdPerson = not thirdPerson end
end)
UserInputService.InputEnded:Connect(function(input)
 if input.KeyCode == Enum.KeyCode.LeftShift then remote:FireServer("Sprint", false) end
end)
UserInputService.WindowFocusReleased:Connect(function() remote:FireServer("Sprint", false) end)
remote.OnClientEvent:Connect(function(action, data)
 if action == "State" then
  current = data
  adminButton.Visible = data.admin and data.started and not data.ended
  if not data.started or data.ended then adminPanel.Visible=false end
  title.Visible = not data.started
  hud.Visible = data.started
  tasks.Visible = data.started
  sanityText.Text = "SANITY " .. math.ceil(data.sanity) .. "%"
  sanityFill.Size = UDim2.fromScale(data.sanity / 100, 1)
  staminaText.Text = "STAMINA " .. math.floor(data.stamina) .. "%"
  local mark = function(yes) return yes and "✓ " or "□ " end
  tasksText.Text = "BENEATH THE HOUSE\n\n"
   .. mark(data.diary >= 20) .. "Collect diary pages (" .. data.diary .. "/20)\n"
   .. mark(data.records >= 3) .. "Find family records (" .. data.records .. "/3)\n"
   .. mark(data.hasKey) .. "Find the unnumbered key\n"
   .. mark(data.rooms >= 10) .. "Explore the rooms (" .. data.rooms .. "/10)\n"
   .. "Sandwich: " .. (data.sandwich == 0 and "ready" or data.sandwich .. "s")
 elseif action == "Read" then
  modalReason = "read"
  readingId = data.id
  heading.Text = data.title
  body.Text = data.text
  closeButton.Text = "Put it back"
  chooseButton.Visible = false
  modal.Visible = true
 elseif action == "Confirm" then
  modalReason = "confirm"
  confirmationNonce = data.nonce
  heading.Text = data.title
  body.Text = data.text .. "\n\nChoose this ending, or keep exploring."
  closeButton.Text = "Keep exploring"
  chooseButton.Visible = true
  modal.Visible = true
 elseif action == "Ending" then
  endAnomaly()
  modalReason = "ending"
  heading.Text = data.id == "consumed" and "YOU LOST: YOUR SANITY GOT CONSUMED" or data.title
  body.Text = data.text
  closeButton.Text = "Start again"
  chooseButton.Visible = false
  modal.Visible = true
 elseif action == "Caption" then showCaption(data, 7)
 elseif action == "SanityHit" then
  if flashTween then flashTween:Cancel() end
  flash.BackgroundTransparency = 0.55
  flashTween = TweenService:Create(flash, TweenInfo.new(2.2), {BackgroundTransparency = 1})
  flashTween:Play()
 elseif action == "Anomaly" then startAnomaly(data)
 elseif action == "AnomalyEnd" then endAnomaly() end
end)
RunService:BindToRenderStep("SpareRoomVisuals", Enum.RenderPriority.Camera.Value + 1, function(dt)
 fitCanvas()
 local isBlocked = blocked()
 controlHints.Visible=not isBlocked
 journalButton.Visible=current.started and not current.ended
 cameraButton.Visible=current.started and not current.ended
 mouseButton.Visible=current.started and not current.ended
 lampButton.Visible=current.started and not current.ended
 mapButton.Visible=current.started and not current.ended
 mouseButton.Modal=cursorFree and not isBlocked
 mouseButton.Text=cursorFree and "CAPTURE / M" or "MOUSE / M"
 if current.admin and current.flying and not current.ended and current.started then
  local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
  if root and root ~= flyRoot then
   stopFlight()
   flyRoot=root
   flyAttachment=Instance.new("Attachment") flyAttachment.Parent=root
   flyVelocity=Instance.new("LinearVelocity")
   flyVelocity.Attachment0=flyAttachment
   flyVelocity.MaxForce=math.huge
   flyVelocity.RelativeTo=Enum.ActuatorRelativeTo.World
   flyVelocity.Parent=root
  end
  if flyVelocity then
   local h=player.Character:FindFirstChildOfClass("Humanoid")
   if h then h.PlatformStand=true end
   local direction=Vector3.zero
   if not isBlocked and workspace.CurrentCamera then
    local camera=workspace.CurrentCamera.CFrame
    if UserInputService:IsKeyDown(Enum.KeyCode.W) then direction+=camera.LookVector end
    if UserInputService:IsKeyDown(Enum.KeyCode.S) then direction-=camera.LookVector end
    if UserInputService:IsKeyDown(Enum.KeyCode.D) then direction+=camera.RightVector end
    if UserInputService:IsKeyDown(Enum.KeyCode.A) then direction-=camera.RightVector end
    if UserInputService:IsKeyDown(Enum.KeyCode.Space) then direction+=Vector3.yAxis end
    if UserInputService:IsKeyDown(Enum.KeyCode.LeftControl) then direction-=Vector3.yAxis end
   end
   flyVelocity.VectorVelocity=direction.Magnitude>0 and direction.Unit*28 or Vector3.zero
  end
 else stopFlight() end
 if not isBlocked then captionRemaining = math.max(0, captionRemaining - dt) end
 caption.Visible = not isBlocked and captionRemaining > 0
 local mode = isBlocked and "menu" or thirdPerson and "third" or "first"
 if mode ~= lastCameraMode then
  lastCameraMode = mode
  if mode == "first" then
   player.CameraMode = Enum.CameraMode.LockFirstPerson
   player.CameraMinZoomDistance = 0.5
   player.CameraMaxZoomDistance = 0.5
  else
   player.CameraMode = Enum.CameraMode.Classic
   player.CameraMaxZoomDistance = 14
   player.CameraMinZoomDistance = 6
  end
 end
 if isBlocked or cursorFree then
  UserInputService.MouseBehavior=Enum.MouseBehavior.Default
 elseif not thirdPerson then UserInputService.MouseBehavior=Enum.MouseBehavior.LockCenter end
 UserInputService.MouseIconEnabled = isBlocked or cursorFree
 ProximityPromptService.Enabled = not isBlocked
 cross.Visible = not isBlocked
 torch.Enabled = flashlightOn and current.started and not current.ended
 if workspace.CurrentCamera then torchPart.CFrame = workspace.CurrentCamera.CFrame end
 local nearest, nearestPrompt, distance = nil, nil, math.huge
 local character = player.Character
 local root = character and character:FindFirstChild("HumanoidRootPart")
 if root and not isBlocked then
  for prompt in pairs(shown) do
   if prompt.Parent and prompt.Enabled then
    local d = (prompt.Parent.Position - root.Position).Magnitude
    if d < distance and d <= 6 then nearest = prompt.Parent nearestPrompt=prompt distance = d end
   end
  end
 end
 highlight.Adornee = nearest
 highlight.Enabled = nearest ~= nil
 if active and not isBlocked then
  active.time += dt
  local t, parts, base = active.time, active.parts, active.base
  if active.id == "pages" then
   for i,part in ipairs(parts) do
    local angle=t*0.45+i*math.pi/4
    part.CFrame=base*CFrame.new(math.cos(angle)*1.1,1.8+math.sin(t+i)*0.25,math.sin(angle)*1.1)*CFrame.Angles(0,angle,math.sin(t+i)*0.2)
   end
  elseif active.id == "door" then
   local swing=math.sin(math.clamp((t-3)/5,0,1)*math.pi)*0.22
   parts[1].CFrame=base*CFrame.new(0,2.4,0)*CFrame.Angles(0,swing,0)
   parts[2].CFrame=parts[1].CFrame*CFrame.new(0.85,0,-0.2)
   parts[3].CFrame=base*CFrame.new(-1.35,2.55,0)
   parts[4].CFrame=base*CFrame.new(1.35,2.55,0)
   parts[5].CFrame=base*CFrame.new(0,5.05,0)
  elseif active.id == "family" then
   for i=1,4 do
    local x=(i-2.5)*0.9
    local small=i==4 and 0.65 or 1
    local sway=math.sin(t*0.35+i)*0.06
    parts[i*2-1].CFrame=base*CFrame.new(x+sway,small*1.5,0)
    parts[i*2].CFrame=base*CFrame.new(x+sway,small*2.55,0)
    parts[i*2-1].Transparency=0.35+math.sin(t*0.5+i)*0.1
    parts[i*2].Transparency=parts[i*2-1].Transparency
   end
  elseif active.id == "blocks" then
   for i,part in ipairs(parts) do
    local settle=math.clamp((t-i*0.6)/2,0,1)
    part.CFrame=base*CFrame.new((i-3)*0.75,0.35+(1-settle)*1.8,math.sin(i)*(1-settle))*CFrame.Angles(0,(1-settle)*i,0)
   end
  elseif active.id == "plates" then
   for i,part in ipairs(parts) do
    local angle=(i-1)*math.pi/2
    part.CFrame=base*CFrame.new(i==5 and 0 or math.cos(angle)*1.1,1.8+math.sin(t*0.8+i)*0.06,i==5 and 0 or math.sin(angle)*1.1)*CFrame.Angles(0,0,math.pi/2)
    part.Transparency=i==5 and 0.78+math.sin(t*0.5)*0.15 or math.max(0,1-t/2)
   end
  elseif active.id == "lamp" then
   parts[1].CFrame=base*CFrame.new(0,1.3,0)
   parts[2].CFrame=base*CFrame.new(0,2.8,0)
   parts[3].CFrame=base*CFrame.new(0,0.1,0)
   -- Gentle pulses rather than rapid flashes: three, then one late answer.
   local phase=t%6
   local pulse=0
   for _,beat in ipairs({0.6,1.8,3,4.8}) do pulse=math.max(pulse,math.max(0,1-math.abs(phase-beat)/0.4)) end
   parts[2]:FindFirstChildOfClass("PointLight").Brightness=0.2+pulse*1.2
  elseif active.id == "coat" then
   local lift = math.sin(math.min(t, 10) / 10 * math.pi) * 0.6
   parts[1].CFrame = base * CFrame.new(0, 1.6 + lift, 0)
   parts[2].CFrame = base * CFrame.new(0, 2.85 + lift, 0)
   parts[3].CFrame = base * CFrame.new(-0.75, 1.6 + lift, 0) * CFrame.Angles(0, 0, 0.13)
   parts[4].CFrame = base * CFrame.new(0.75, 1.6 + lift, 0) * CFrame.Angles(0, 0, -0.13)
  elseif active.id == "steps" then
   for i, part in ipairs(parts) do
    part.CFrame = base * CFrame.new(i % 2 == 0 and 0.25 or -0.25, 0.025, (i - 4) * 0.6)
    part.Transparency = t >= i * 0.65 and 0.2 or 1
   end
  elseif active.id == "clock" then
   parts[1].CFrame = base * CFrame.new(0, 2, 0)
   parts[2].CFrame = base * CFrame.new(0, 2, -0.15) * CFrame.Angles(0, 0, -t * 0.65) * CFrame.new(0, 0.45, 0)
  elseif active.id == "chair" then
   parts[1].CFrame = base * CFrame.new(0, 1.5, 0)
   parts[2].CFrame = base * CFrame.new(0, 2.3, 0.7)
   for i = 3, 6 do
    local dx = i % 2 == 0 and -0.6 or 0.6
    local dz = i <= 4 and -0.6 or 0.6
    parts[i].CFrame = base * CFrame.new(dx, 0.75, dz)
   end
   for _, part in ipairs(parts) do part.Transparency = math.clamp(1 - (t - 0.8) / 1.4, 0, 1) end
  end
  local fade=math.clamp((t-(active.duration-2))/2,0,1)
  if fade>0 then for _,part in ipairs(parts) do part.Transparency=math.max(part.Transparency,fade) end end
 end
end)
remote:FireServer("Ready")

