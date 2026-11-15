-- StarterPlayerScripts/SpareRoomClient. Roblox renders and handles its default E/touch/controller hold prompts.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local ProximityPromptService = game:GetService("ProximityPromptService")
local player = Players.LocalPlayer
local remote = ReplicatedStorage:WaitForChild("SpareRoomEvent")
local Avatars = require(ReplicatedStorage:WaitForChild("SpareRoomAvatars"))
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
canvas.BorderSizePixel=0
canvas.Parent = gui
local uiScale = Instance.new("UIScale")
uiScale.Parent = canvas
local function fitCanvas()
 local c = workspace.CurrentCamera
 if c then uiScale.Scale = math.min(c.ViewportSize.X / 1280, math.max(1,c.ViewportSize.Y-40) / 720) end
end
local ux={}
local current = {started = false, sanity = 100, stamina = 100, journal = {}, mode = "Easy"}
local modalReason, readingId, confirmationNonce = nil, nil, nil
local thirdPerson = false
local cursorFree = false
local lobbyWalking=true
local wallet={balance=0,owned={Wanderer=true},selected="Wanderer",persistent=false}
local queueMode=nil
local shopPendingEnter=false
local shop -- declared before title Play callback
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
 f.BorderSizePixel=0
 local stroke=Instance.new("UIStroke") stroke.Color=Color3.fromRGB(119,108,86) stroke.Transparency=0.5 stroke.Parent=f
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
 t.TextColor3 = Color3.fromRGB(226,228,214)
 t.TextWrapped = true
 t.Parent = parent
 return t
end
local function button(parent, content, pos, size, callback)
 local b = Instance.new("TextButton")
 b.Position = pos
 b.Size = size
 b.BackgroundColor3 = Color3.fromRGB(30,39,36)
 b.TextColor3 = Color3.fromRGB(225,229,216)
 b.Font = Enum.Font.GothamMedium
 b.TextSize = 16
 b.Text = content
 b.Parent = parent
 local corner = Instance.new("UICorner")
 corner.CornerRadius = UDim.new(0,4)
 corner.Parent = b
 local stroke=Instance.new("UIStroke") stroke.Color=Color3.fromRGB(143,128,94) stroke.Transparency=0.6 stroke.Parent=b
 b.MouseEnter:Connect(function() TweenService:Create(b,TweenInfo.new(0.18),{BackgroundColor3=Color3.fromRGB(70,66,51)}):Play() end)
 b.MouseLeave:Connect(function() TweenService:Create(b,TweenInfo.new(0.18),{BackgroundColor3=Color3.fromRGB(48,47,40)}):Play() end)
 b.Activated:Connect(function()
  if modalReason=="tools" and ux.drawer and b:IsDescendantOf(ux.drawer) then ux.closeTools() end
  callback()
 end)
 return b
end
local function blocked()
 return (not current.started and not lobbyWalking) or current.ended ~= nil or modalReason ~= nil
end
local hud = frame(canvas, "Sanity", UDim2.fromOffset(28,26), UDim2.fromOffset(260,68))
local sanityText = text(hud, "SANITY 100%", UDim2.fromScale(0.04, 0.03), UDim2.fromScale(0.92, 0.3), 16)
local sanityTrack = frame(hud, "SanityTrack", UDim2.fromScale(0.06, 0.4), UDim2.fromScale(0.88, 0.08))
local sanityFill = frame(sanityTrack, "Fill", UDim2.fromScale(0, 0), UDim2.fromScale(1, 1))
sanityFill.BackgroundColor3 = gold
local staminaHud=frame(canvas,"Stamina",UDim2.fromOffset(28,104),UDim2.fromOffset(260,60))
local staminaText=text(staminaHud,"STAMINA 100%",UDim2.fromScale(0.04,0.04),UDim2.fromScale(0.92,0.4),13)
local staminaTrack=frame(staminaHud,"StaminaTrack",UDim2.fromScale(0.06,0.62),UDim2.fromScale(0.88,0.12))
local staminaFill=frame(staminaTrack,"Fill",UDim2.fromScale(0,0),UDim2.fromScale(1,1))
staminaFill.BackgroundColor3=Color3.fromRGB(135,171,161)
local tasks = frame(canvas, "Tasks", UDim2.fromOffset(936,438), UDim2.fromOffset(316,216))
local tasksText = text(tasks, "", UDim2.fromScale(0.05, 0.03), UDim2.fromScale(0.9, 0.94), 14)
tasksText.TextYAlignment = Enum.TextYAlignment.Top
tasksText.TextXAlignment = Enum.TextXAlignment.Left
hud.Visible=false staminaHud.Visible=false tasks.Visible=false
local caption = frame(canvas, "Caption", UDim2.fromOffset(310,116), UDim2.fromOffset(660,74))
caption.Visible = false
local captionText = text(caption, "", UDim2.fromScale(0.04, 0.05), UDim2.fromScale(0.92, 0.9), 16)
local cross = frame(canvas, "Crosshair", UDim2.new(0.5, -1, 0.5, -1), UDim2.fromOffset(3, 3))
cross.BackgroundColor3 = gold
cross.BorderSizePixel = 0
local title = frame(canvas, "TitleScreen", UDim2.fromScale(0, 0), UDim2.fromScale(1, 1))
title.ZIndex = 10
title.BackgroundTransparency=0.3
title.Visible=false
local shade=Instance.new("UIGradient")
shade.Color=ColorSequence.new(Color3.fromRGB(8,14,12),Color3.fromRGB(35,37,31))
shade.Rotation=25 shade.Parent=title
local edition=text(title,"A HOUSE THAT REMEMBERS",UDim2.fromOffset(64,60),UDim2.fromOffset(640,32),14)
edition.TextXAlignment=Enum.TextXAlignment.Left
local masthead=text(title,"THE SPARE\nROOM",UDim2.fromOffset(60,106),UDim2.fromOffset(800,174),70)
masthead.Font=Enum.Font.Garamond masthead.TextXAlignment=Enum.TextXAlignment.Left masthead.TextYAlignment=Enum.TextYAlignment.Top
local subtitle=text(title,"THE LAST BUS STOP",UDim2.fromOffset(64,290),UDim2.fromOffset(650,40),22)
subtitle.TextXAlignment=Enum.TextXAlignment.Left
local tagline=text(title,"Choose who you are before the house remembers you.",UDim2.fromOffset(64,340),UDim2.fromOffset(780,32),17)
tagline.TextXAlignment=Enum.TextXAlignment.Left tagline.TextColor3=Color3.fromRGB(179,179,158)
local titleHousehold=text(title,"EXPLORERS CONNECTED · 1",UDim2.fromOffset(880,60),UDim2.fromOffset(330,32),14)
text(title,"YOUR JOURNEY BEGINS AT THE LAST BUS STOP",UDim2.fromOffset(64,426),UDim2.fromOffset(1000,28),15).TextXAlignment=Enum.TextXAlignment.Left
local playButton=button(title,"PLAY",UDim2.fromOffset(64,472),UDim2.fromOffset(470,100),function()
 shopPendingEnter=true
 remote:FireServer("EnterLobby")
end)
playButton.Name="PlayButton"
text(title,"Visit Ward & Thread for classes. Choose a difficulty at the bus pads or ticket kiosk.",UDim2.fromOffset(566,478),UDim2.fromOffset(630,90),20).TextXAlignment=Enum.TextXAlignment.Left
text(title,"EXPLORE TOGETHER / Your clues, sanity and endings remain your own.",UDim2.fromOffset(64,616),UDim2.fromOffset(1150,28),14).TextXAlignment=Enum.TextXAlignment.Left
text(title,"WASD move · Hold E interact · M release mouse · G district guide · F flashlight",UDim2.fromOffset(64,662),UDim2.fromOffset(1150,24),12).TextXAlignment=Enum.TextXAlignment.Left
local balanceText=text(title,"MEMORY SHARDS · loading…",UDim2.fromOffset(880,106),UDim2.fromOffset(330,35),17)
local shardHud=text(canvas,"MEMORY SHARDS · 0",UDim2.fromOffset(28,170),UDim2.fromOffset(260,32),15)
shardHud.Visible=false
local queueText=text(title,"Choose a bus or depart solo.",UDim2.fromOffset(850,158),UDim2.fromOffset(360,65),17)
local leaveQueue=button(title,"LEAVE QUEUE",UDim2.fromOffset(900,234),UDim2.fromOffset(260,36),function() remote:FireServer("Queue","Leave") end)
leaveQueue.Visible=false
local lobbyMenu=button(canvas,"LOBBY / L",UDim2.fromOffset(1100,26),UDim2.fromOffset(152,36),function()
 remote:FireServer("Pause",true)
 lobbyWalking=false title.Visible=true
end)
lobbyMenu.Visible=false
local worldClock=text(canvas,"DAY 1 · 08:00",UDim2.fromOffset(880,674),UDim2.fromOffset(360,26),15)
local floatingQueue=text(canvas,"",UDim2.fromOffset(28,184),UDim2.fromOffset(300,60),17)
floatingQueue.Visible=false
 worldClock.Visible=current.started
shop=frame(canvas,"ClassesAndShards",UDim2.fromOffset(36,35),UDim2.fromOffset(1208,650))
shop.ZIndex=30 shop.Visible=false
text(shop,"CLASSES / MEMORY SHARDS",UDim2.fromOffset(28,20),UDim2.fromOffset(900,45),30).TextXAlignment=Enum.TextXAlignment.Left
local shopBalance=text(shop,"",UDim2.fromOffset(28,70),UDim2.fromOffset(1100,35),17)
local shopStatus=text(shop,"",UDim2.fromOffset(28,535),UDim2.fromOffset(1150,52),15)
button(shop,"CLOSE",UDim2.fromOffset(1055,23),UDim2.fromOffset(120,36),function() shop.Visible=false modalReason=nil remote:FireServer("Pause",false) end)
local classButtons={}
for i,id in ipairs(Config.ClassOrder) do
 local c=Config.Classes[id]
 local card=frame(shop,id,UDim2.fromOffset(28+(i-1)*291,118),UDim2.fromOffset(276,185))
 text(card,c.name,UDim2.fromOffset(14,9),UDim2.fromOffset(248,35),24)
 text(card,c.description,UDim2.fromOffset(110,46),UDim2.fromOffset(152,74),14)
 local viewport=Instance.new("ViewportFrame") viewport.Name="RobloxAvatarPreview" viewport.Size=UDim2.fromOffset(90,90) viewport.Position=UDim2.fromOffset(12,42)
 viewport.BackgroundColor3=Color3.fromRGB(32,39,37) viewport.Ambient=Color3.fromRGB(180,180,170) viewport.LightColor=Color3.fromRGB(255,229,188) viewport.Parent=card
 local camera=Instance.new("Camera") camera.CFrame=CFrame.lookAt(Vector3.new(0,1.5,-6),Vector3.new(0,.5,0)) camera.Parent=viewport viewport.CurrentCamera=camera
 local world=Instance.new("WorldModel") world.Parent=viewport
 task.spawn(function()
  if workspace:GetAttribute("SpareRoomRole")=="Run" then return end
  local templates=ReplicatedStorage:WaitForChild("SpareRoomClassAvatars",30)
  local source=templates and templates:WaitForChild(id,30)
  if not source then text(card,"Avatar unavailable",UDim2.fromOffset(12,72),UDim2.fromOffset(90,40),11) return end
  local avatar=source:Clone()
  for _,part in ipairs(avatar:GetDescendants()) do if part:IsA("BasePart") then part.Anchored=true end end
  avatar.Parent=world avatar:PivotTo(CFrame.new())
  local box,size=avatar:GetBoundingBox()
  camera.FieldOfView=32
  camera.CFrame=CFrame.lookAt(box.Position+Vector3.new(0,.15,-size.Y*.5/math.tan(math.rad(16))*1.12),box.Position)
 end)
 classButtons[id]=button(card,"",UDim2.fromOffset(14,138),UDim2.fromOffset(248,34),function() remote:FireServer("Class",id) end)
end
text(shop,"OPTIONAL SHARD PACKS / Roblox confirms the price before purchase",UDim2.fromOffset(28,322),UDim2.fromOffset(1150,34),17)
for i,pack in ipairs(Config.ShardPacks) do
 local configured=pack.productId>0 and pack.productId~=Config.ReviveProductId
 local b=button(shop,tostring(pack.amount).." SHARDS / "..(configured and "View Roblox price" or "Not configured"),UDim2.fromOffset(28+(i-1)*388,370),UDim2.fromOffset(370,65),function() end)
 b.Activated:Connect(function()
  if configured then remote:FireServer("BuyShards",pack.productId) else shopStatus.Text="The creator must connect this pack’s new developer-product ID. No purchase was opened." end
 end)
 -- Button helper expects a callback; pack buttons connect their guarded callback above.
end
text(shop,"EARN SHARDS: +2 per new diary page; +25 per new ending; +5 for a returning ending once per UTC day.\nDuplicate finishes cannot farm rewards. Classes are permanent unlocks. No random rewards or shard trading.",UDim2.fromOffset(28,453),UDim2.fromOffset(1150,64),16)
button(shop,"RETRY SAVING CONNECTION",UDim2.fromOffset(385,594),UDim2.fromOffset(430,35),function() remote:FireServer("ReloadEconomy") end)
local function updateWallet()
 balanceText.Text="MEMORY SHARDS · "..wallet.balance
 shardHud.Text="MEMORY SHARDS · "..wallet.balance
 shopBalance.Text=tostring(wallet.balance).." SHARDS · "..wallet.selected..(wallet.persistent and " · SAVED" or " · PRACTICE / SAVING UNAVAILABLE")
 for id,b in pairs(classButtons) do
  b.Text=wallet.selected==id and "EQUIPPED" or wallet.owned[id] and "EQUIP" or "UNLOCK / "..Config.Classes[id].cost.." SHARDS"
 end
end
updateWallet()
local menuBlur=Instance.new("BlurEffect") menuBlur.Name="SpareRoomMenuBlur" menuBlur.Size=6 menuBlur.Parent=game:GetService("Lighting")
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
 if reason=="ending" then remote:FireServer("Lobby") return end
 modalReason = nil
 modal.Visible = false
 if reason == "read" then remote:FireServer("ReadClosed", readingId)
 elseif reason == "confirm" then remote:FireServer("CancelEnding")
 elseif reason == "admin" then remote:FireServer("Pause", false)
 elseif reason == "household" then remote:FireServer("Pause", false)
 elseif reason == "map" then remote:FireServer("Pause", false)
 elseif reason == "journal" then remote:FireServer("Pause", false)
 elseif reason == "ending" then remote:FireServer("Lobby") end
end
closeButton = button(modal, "Close", UDim2.fromScale(0.05, 0.85), UDim2.fromScale(0.42, 0.1), closeModal)
chooseButton = button(modal, "Choose this ending", UDim2.fromScale(0.52, 0.85), UDim2.fromScale(0.43, 0.1), function()
 if modalReason == "confirm" then remote:FireServer("Finish", confirmationNonce) end
end)
chooseButton.Visible = false
local reviveButton=button(modal,"Buy one revive",UDim2.fromScale(0.52,0.85),UDim2.fromScale(0.43,0.1),function()
 if modalReason=="ending" and (current.ended=="consumed" or current.ended=="fallen") then remote:FireServer("Revive") end
end)
reviveButton.Visible=false
local reviveNotice=text(modal,"",UDim2.fromScale(0.06,0.74),UDim2.fromScale(0.88,0.09),12)
reviveNotice.Visible=false
local journalButton = button(canvas, "JOURNAL", UDim2.fromOffset(1136,26), UDim2.fromOffset(116, 36), function()
 if blocked() then return end
 modalReason = "journal"
 heading.Text = "Ending journal"
 local endings = #current.journal > 0 and table.concat(current.journal, "\n") or "No endings recorded yet."
 local observed = current.observed or {}
 body.Text = "CURRENT DISCOVERIES\n"..tasksText.Text.."\n\nENDING JOURNAL\n" .. endings .. "\n\nANOMALY FIELD NOTES (" .. #observed .. "/" .. #Config.Anomalies .. ")\n"
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
 local location=root and root.Position.Y < -6 and "Beneath the house" or root and root.Position.Y>12 and "Upstairs" or "House and district"
 body.Text="YOU ARE: "..location.."\n\nLeave through the house's front entrance. Follow the path to the road.\n\nACROSS THE ROAD — west to east\nThe Palladium cinema · Municipal Archive · St. Agnes Clinic · Ashfield Station · Ward & Sons · Velvet & Ash\n\nON THE HOUSE SIDE\nThe Second Copy bookshop to the west. The Empty Chair cafe to the east.\n\nNEW PLACES\nAshfield Memorial Park is southwest of the house. Ashfield Primary School is southeast. Follow the side footpaths from the pavement and read the memorial, drawings and school records.\n\nAT HOME\nClimb the hall staircase to the study, nursery, loft and family bedroom. Look for hidden notes and unfinished tasks. The garden is behind the house. The maintenance hatch at the end of the hallway leads below. Use the return stairs to come home.\n\nORIGINAL CITY DISTRICT\nFollow the west road south past the old cinema. Four rows of five walk-in venues contain all 20 original city locations, six named residents and twelve local endings. Read the street directory at the entrance.\n\nPlaces change what you notice. Read the correspondence in every venue."
 local layout=ReplicatedStorage:FindFirstChild("SpareRoomChunkLayout")
 if layout then
  local order={}for _,chunk in layout:GetChildren()do if chunk.Name:sub(1,5)=="city:"then order[chunk:GetAttribute("Slot")]=chunk.Name:sub(6):upper()end end
  local rows={"","TODAY'S DISTRICT · FRONT ROW TO BACK"}
  for row=0,3 do local names={}for col=1,5 do table.insert(names,order[row*5+col]or "?")end table.insert(rows,table.concat(names," / "))end
  body.Text=body.Text.."\n"..table.concat(rows,"\n").."\n\nRooms below and upstairs also change between visits. Trust the door signs."
 end
 closeButton.Text="Fold the map"
 chooseButton.Visible=false
 modal.Visible=true
 remote:FireServer("Pause",true)
end
local mapButton=button(canvas,"MAP / G",UDim2.fromOffset(1136,236),UDim2.fromOffset(116,36),openMap)
local householdButton=button(canvas,"HOUSEHOLD",UDim2.fromOffset(1136,278),UDim2.fromOffset(116,36),function()
 if blocked() then return end
 modalReason="household"
 heading.Text="EXPLORING TOGETHER"
 local lines={}
 for _,member in ipairs(current.household or {}) do table.insert(lines,member.name.." — "..(not member.started and "choosing a difficulty" or member.paused and "reading / resting" or "exploring")) end
 body.Text=table.concat(lines,"\n").."\n\nThe house and its residents are shared. Your clues, sanity, sandwiches, anomalies and ending choices belong to you. Reading pauses only your own timers."
 closeButton.Text="Return to the house" chooseButton.Visible=false modal.Visible=true
 remote:FireServer("Pause",true)
end)
local touchSprint = false
local sprintButton = button(canvas, "SPRINT", UDim2.fromScale(0.02, 0.72), UDim2.fromOffset(110, 36), function()
 if blocked() then return end
 touchSprint = not touchSprint
 remote:FireServer("Sprint", touchSprint)
end)
sprintButton.Visible = UserInputService.TouchEnabled
local controlHints = text(canvas, "WASD  MOVE     SHIFT  SPRINT     SPACE  JUMP     HOLD E  INTERACT     M  MOUSE     F  LIGHT     G  MAP", UDim2.fromOffset(250,674), UDim2.fromOffset(780,26),12)
-- Admin UI is only shown after server-confirmed authorization.
local adminPanel=frame(canvas,"AdminPanel",UDim2.fromOffset(220,70),UDim2.fromOffset(840,570))
adminPanel.Visible=false adminPanel.ZIndex=30
text(adminPanel,"ASHFIELD / HOUSEKEEPER",UDim2.fromOffset(24,12),UDim2.fromOffset(590,32),24)
text(adminPanel,"OWNER ACCESS • CURRENT RUN ONLY",UDim2.fromOffset(24,45),UDim2.fromOffset(590,20),11)
local selectedAdminId=player.UserId
local adminRoster={} local rosterSignature="" local selectedAdminTab="Player"
local adminStatus=text(adminPanel,"Select a player, then choose an action.",UDim2.fromOffset(24,482),UDim2.fromOffset(792,28),14)
adminStatus.Name="ActionStatus"
local stats=text(adminPanel,"Waiting for run status...",UDim2.fromOffset(470,76),UDim2.fromOffset(344,76),14)
stats.Name="PlayerStats"
local playerMenu=frame(adminPanel,"PlayerDropdownMenu",UDim2.fromOffset(24,116),UDim2.fromOffset(420,222))
playerMenu.ZIndex=60 playerMenu.Visible=false
local playerList=Instance.new("ScrollingFrame")
playerList.Name="Players" playerList.Position=UDim2.fromOffset(6,6) playerList.Size=UDim2.new(1,-12,1,-12)
playerList.BackgroundTransparency=1 playerList.ScrollBarThickness=4 playerList.AutomaticCanvasSize=Enum.AutomaticSize.Y playerList.CanvasSize=UDim2.new() playerList.Parent=playerMenu
local listLayout=Instance.new("UIListLayout")listLayout.Padding=UDim.new(0,4)listLayout.SortOrder=Enum.SortOrder.LayoutOrder listLayout.Parent=playerList
local playerDropdown=button(adminPanel,"SELECT PLAYER",UDim2.fromOffset(24,78),UDim2.fromOffset(420,36),function()playerMenu.Visible=not playerMenu.Visible end)
playerDropdown.Name="AdminPlayerDropdown"
local function requestRoster()
 if current.admin then remote:FireServer("Admin",{command="Roster",targetId=selectedAdminId})end
end
local function adminAction(command,value)
 if not selectedAdminId and command~="Weather"and command~="Fog"and command~="Clock"and command~="AtmosphereReset"then adminStatus.Text="Choose a player who is still in this run."return end
 adminStatus.Text="Applying "..command.."..."
 remote:FireServer("Admin",{command=command,value=value,targetId=selectedAdminId})
end
local adminScroll=Instance.new("ScrollingFrame")
adminScroll.Name="Actions" adminScroll.Position=UDim2.fromOffset(24,204)adminScroll.Size=UDim2.fromOffset(792,264)
adminScroll.BackgroundTransparency=1 adminScroll.ScrollBarThickness=5 adminScroll.AutomaticCanvasSize=Enum.AutomaticSize.Y adminScroll.CanvasSize=UDim2.new()adminScroll.Parent=adminPanel
local grid=Instance.new("UIGridLayout")grid.CellSize=UDim2.fromOffset(380,42)grid.CellPadding=UDim2.fromOffset(12,10)grid.SortOrder=Enum.SortOrder.LayoutOrder grid.Parent=adminScroll
local tabs={}
local function adminRow(label,command,value,index)
 local b=button(adminScroll,label,UDim2.new(),UDim2.fromOffset(380,42),function()adminAction(command,value)end)
 b.Name=command..(value and "_"..tostring(value)or"")b.LayoutOrder=index or 0
end
local function renderActions(tab)
 selectedAdminTab=tab playerMenu.Visible=false
 for _,item in adminPanel:GetChildren()do if item:IsA("TextLabel")then
  if item.Text=="OWNER ACCESS • CURRENT RUN ONLY"or item.Name=="AccessLevel"then item.Name="AccessLevel"item.Text=current.adminRole=="Limited"and "PRESTIGE UTILITIES • SELF ONLY • COOLDOWNS APPLY"or "OWNER ACCESS • CURRENT RUN ONLY"end
 end end

 for _,i in adminScroll:GetChildren()do if i:IsA("GuiObject")then i:Destroy()end end
 adminScroll.CanvasPosition=Vector2.zero
 for name,b in pairs(tabs)do b.BackgroundColor3=name==tab and Color3.fromRGB(65,91,82)or Color3.fromRGB(37,40,35)end
 if current.adminRole=="Limited"then
  local actions={{"Restore myself / 30s cooldown","Heal"},{"Restore my stamina / 10s","Stamina"},{"My sanity +10 / 15s","Sanity",10},{"Toggle my flight","Fly"},{"Clear my anomaly / 60s","Clear"},{"Return home / 15s","Teleport","House"},{"Upstairs / 15s","Teleport","Upstairs"},{"Garden / 15s","Teleport","Garden"}}
  for i,v in ipairs(actions)do adminRow(v[1],v[2],v[3],i)end
 elseif tab=="Player"then
  local actions={{"Go to selected player","Goto"},{"Bring selected player to me","Bring"},{"Restore health, sanity & stamina","Heal"},{"Restore stamina","Stamina"},{"Freeze movement","Freeze"},{"Unfreeze movement","Unfreeze"},{"Restore sanity +10%","Sanity",10},{"Remove sanity 10%","Sanity",-10},{"Toggle selected player's flight","Fly"},{"Clear selected player's anomaly","Clear"}}
  for i,v in ipairs(actions)do adminRow(v[1],v[2],v[3],i)end
 elseif tab=="Locations"then
  for i,location in ipairs(require(ReplicatedStorage:WaitForChild("SpareRoomAdminLocations")))do local name=location.name adminRow("Send player / "..name,"Teleport",name,i)end
 elseif tab=="Anomalies"then
  adminRow("Clear active anomaly","Clear",nil,0)
  for i,v in ipairs(Config.Anomalies)do adminRow("Trigger / "..v.title,"Anomaly",v.id,i)end
 else
  adminRow("Advance selected player's event timers one day","Day",nil,1)
  for i,name in ipairs({"Auto","Clear","Rain","Storm","Mist","Wind","Snow","Snowstorm"})do adminRow("WEATHER / "..name,"Weather",name,10+i)end
  for i,v in ipairs({{"Dawn",6},{"Noon",12},{"Dusk",18},{"Midnight",0}})do adminRow("TIME / "..v[1],"Clock",v[2],30+i)end
  for i,v in ipairs({{"Clear",0},{"Light",.2},{"Ashfield",.42},{"Dense",.65}})do adminRow("FOG / "..v[1],"Fog",v[2],40+i)end
  adminRow("Restore automatic environment","AtmosphereReset",nil,50)
  text(adminScroll,"Owner environment controls affect this entire server.",UDim2.new(),UDim2.fromOffset(380,42),13).LayoutOrder=51
 end
end
for i,name in ipairs({"Player","Locations","Anomalies","Run"})do
 local b=button(adminPanel,name,UDim2.fromOffset(24+(i-1)*200,160),UDim2.fromOffset(192,32),function()renderActions(name)end)b.Name=name.."Tab"tabs[name]=b
end
button(adminPanel,"RETURN TO GAME",UDim2.fromOffset(24,524),UDim2.fromOffset(792,30),function()
 playerMenu.Visible=false adminPanel.Visible=false modalReason=nil remote:FireServer("Pause",false)
end)
local function toggleAdmin()
 if not current.admin or not current.started or current.ended then return end
 if adminPanel.Visible then adminPanel.Visible=false playerMenu.Visible=false modalReason=nil remote:FireServer("Pause",false)
 elseif not modalReason then renderActions(selectedAdminTab)adminPanel.Visible=true modalReason="admin"remote:FireServer("Pause",true)requestRoster()end
end
local adminButton=button(canvas,"ADMIN / F8",UDim2.fromOffset(1136,110),UDim2.fromOffset(116,36),toggleAdmin)
adminButton.Visible=false
renderActions("Player")
remote.OnClientEvent:Connect(function(action,data)
 if action=="AdminResult"then
  adminStatus.Text=data.message or "Action completed."
  adminStatus.TextColor3=data.ok and Color3.fromRGB(163,203,177)or Color3.fromRGB(227,158,132)
 elseif action=="AdminRoster"then
  adminRoster=data.players or {}
  local selected local signature={}
  for _,p in ipairs(adminRoster)do
   if p.userId==selectedAdminId then selected=p end
   table.insert(signature,tostring(p.userId)..p.name..tostring(p.ended))
  end
  if not selected then selectedAdminId=nil playerDropdown.Text="CHOOSE A PLAYER  ▾"stats.Text="No player selected."else
   playerDropdown.Text=selected.displayName.."  (@"..selected.name..")  ▾"
   local d=data.details
   if d and d.userId==selectedAdminId then
    stats.Text=string.format("HEALTH %d  /  SANITY %d%%  /  STAMINA %d%%\n%s  •  %s\nMovement: %s  •  Flight: %s",d.health,d.sanity,d.stamina,d.mode or "Run",d.ended and "RUN ENDED"or"ACTIVE",d.frozen and "FROZEN"or"FREE",d.flying and "ON"or"OFF")
   end
  end
  local key=table.concat(signature,"|")
  if key~=rosterSignature then
   rosterSignature=key
   for _,i in playerList:GetChildren()do if i:IsA("TextButton")then i:Destroy()end end
   for index,p in ipairs(adminRoster)do
    local row=button(playerList,p.displayName.."  @"..p.name..(p.ended and " • ENDED"or""),UDim2.new(),UDim2.new(1,-6,0,44),function()
     selectedAdminId=p.userId stats.Text="Loading selected player..." playerDropdown.Text=p.displayName.."  (@"..p.name..")  ▾" playerMenu.Visible=false
     adminStatus.Text="Selected @"..p.name.."." requestRoster()
    end)
    row.Name="Player_"..p.userId row.LayoutOrder=index row.TextSize=13
   end
  end
 end
end)
task.spawn(function()
 while gui.Parent do task.wait(1.5)if adminPanel.Visible and current.admin then requestRoster()end end
end)
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
-- Pose native Motor6D avatar joints without third-party animation assets.
local jointCache=setmetatable({},{__mode="k"})
local function poseAvatar(model,t,moving,look,natural)
 local joints=jointCache[model]
 if not joints then
  joints={}
  for _,joint in ipairs(model:GetDescendants()) do if joint:IsA("Motor6D") then table.insert(joints,joint) end end
  jointCache[model]=joints
 end
 local swing=math.sin(t*(moving and 7 or 1.2))*(moving and 0.4 or natural and 0 or 0.035)
 for _,joint in ipairs(joints) do
  local name=string.gsub(joint.Name," ","")
  if name=="LeftShoulder" or name=="RightHip" then joint.Transform=CFrame.Angles(swing,0,0)
  elseif name=="RightShoulder" or name=="LeftHip" then joint.Transform=CFrame.Angles(-swing,0,0)
  elseif name=="LeftKnee" then joint.Transform=CFrame.Angles(math.max(0,-swing)*0.6,0,0)
  elseif name=="RightKnee" then joint.Transform=CFrame.Angles(math.max(0,swing)*0.6,0,0)
  elseif name=="Waist" then joint.Transform=CFrame.Angles(0,natural and 0 or math.sin(t)*0.025,0)
  elseif name=="Neck" then joint.Transform=CFrame.Angles(natural and 0 or math.sin(t*0.6)*0.035,look or (natural and 0 or math.sin(t*0.4)*0.07),0) end
 end
end
local watcherGaze=setmetatable({},{__mode="k"})
local residentTime=0
RunService.PreSimulation:Connect(function(dt)
 residentTime+=dt
 local npcs=workspace:FindFirstChild("SpareRoomNPCs")
 if npcs then
  for _,model in ipairs(npcs:GetChildren()) do
   local root=model.PrimaryPart
   if root then
    local moving=root.AssemblyLinearVelocity.Magnitude>1 and not root.Anchored
    if model:GetAttribute("NaturalResident") then
     if not model:GetAttribute("UsingAnimator") then poseAvatar(model,residentTime+(model:GetAttribute("Phase") or 0),moving,0,true) end
    elseif model:GetAttribute("Role")=="Watcher" then
     local target=player.Character and player.Character:FindFirstChild("Head")
     local yaw=0
     if target and (target.Position-root.Position).Magnitude<55 then
      local localPoint=root.CFrame:PointToObjectSpace(target.Position)
      yaw=math.clamp(math.atan2(-localPoint.X,-localPoint.Z),-0.6,0.6)
     end
     watcherGaze[model]=(watcherGaze[model] or 0)+(yaw-(watcherGaze[model] or 0))*math.min(dt*0.7,1)
     poseAvatar(model,0,false,watcherGaze[model],true)
    else poseAvatar(model,residentTime,false,nil) end
   end
  end
 end
 if active and active.rigs then
  for i,rig in ipairs(active.rigs) do poseAvatar(rig,active.time+i,false,active.id=="doll" and math.sin(math.floor(active.time/3)*2.4)*.9 or 0) end
 end
end)
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
 local rigs={}
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
  local templates=ReplicatedStorage:FindFirstChild("SpareRoomAvatarTemplates")
  local template=templates and templates:FindFirstChild("Watcher")
  if template then
   for i=1,4 do
    local rig=template:Clone() rig:ScaleTo(i==4 and 0.42 or 0.58)
    rig.PrimaryPart.Anchored=true rig.Parent=model rigs[i]=rig
    for _,part in ipairs(rig:GetDescendants()) do if part:IsA("BasePart") then part.CanCollide=false part.Transparency=part.Name=="HumanoidRootPart" and 1 or 0.35 table.insert(parts,part) end end
   end
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
 if data.id=="watcher" or data.id=="doll" then
  local templates=ReplicatedStorage:FindFirstChild("SpareRoomAvatarTemplates")
  local template=templates and templates:FindFirstChild(data.id=="watcher" and "Watcher" or "Doll")
  if template then
   local rig=template:Clone() rig.Parent=model rig.PrimaryPart.Anchored=true rigs[1]=rig
   for _,part in ipairs(rig:GetDescendants()) do if part:IsA("BasePart") then part.CanCollide=false table.insert(parts,part) end end
  end
 end
 if #rigs==0 then for _,part in ipairs(parts) do part.CFrame=base end end
 for i,rig in ipairs(rigs) do Avatars.place(rig,p+Vector3.new((i-(#rigs+1)/2)*0.95,0,0)) end
 active = {model = model, parts = parts, base = base, id = data.id, time = 0, duration = data.duration or 12, rigs=rigs}
 showCaption(data.title,3.5)
end
UserInputService.InputBegan:Connect(function(input, processed)
 if processed then return end
 if input.KeyCode==Enum.KeyCode.Tab then if ux.toggleTools then ux.toggleTools() end return end
 if input.KeyCode==Enum.KeyCode.Escape and modalReason=="tools" then ux.closeTools() return end
 if input.KeyCode == Enum.KeyCode.F8 then toggleAdmin() return end
 if input.KeyCode == Enum.KeyCode.L and not current.started and not modalReason then remote:FireServer("Pause",true) lobbyWalking=false title.Visible=true return end
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
 if action=="OpenClassShop" then
  shop.Visible=true modalReason="classes" updateWallet() remote:FireServer("Pause",true)
 elseif action=="WorldClock" then
  local h=math.floor(data.hour) local m=math.floor((data.hour-h)*60)
  worldClock.Text=string.format("DAY %d · %02d:%02d",data.day,h,m)
 elseif action=="Economy" then
  wallet=data updateWallet()
 elseif action=="EconomyStatus" then
  if lobbyWalking then showCaption(data,7) end
  shopStatus.Text=data
  queueText.Text=data
 elseif action=="Queue" then
  queueMode=data.mode
  local message=data.mode and (data.mode.." BUS · "..data.members.."/4\nDEPARTS IN "..data.seconds.."s") or "Choose a bus or depart solo."
  queueText.Text=message floatingQueue.Text=message leaveQueue.Visible=data.mode~=nil
 elseif action == "State" then
  current = data
  if shopPendingEnter and not data.started then
   shopPendingEnter=false lobbyWalking=true modalReason=nil shop.Visible=false
  end
  if data.started then
   lobbyWalking=false shop.Visible=false
   if modalReason=="classes" then modalReason=nil end
  end
  if not data.ended and modalReason=="ending" then
   modalReason=nil modal.Visible=false reviveButton.Visible=false reviveNotice.Visible=false
  end
  titleHousehold.Text="EXPLORERS CONNECTED · "..#(data.household or {})
  householdButton.Text="Explorers ("..#(data.household or {})..")"
  adminButton.Visible = data.admin and data.started and not data.ended
  if not data.started or data.ended then adminPanel.Visible=false end
  title.Visible = false
  if not data.started and data.role=="Lobby" then lobbyWalking=true end
  staminaHud.Visible = data.started
  hud.Visible = data.started
  tasks.Visible = data.started
  sanityText.Text = "SANITY " .. math.ceil(data.sanity) .. "%"
  sanityFill.Size = UDim2.fromScale(data.sanity / 100, 1)
  staminaText.Text = "STAMINA " .. math.floor(data.stamina) .. "%"
  staminaFill.Size=UDim2.fromScale(math.clamp(data.stamina/100,0,1),1)
  staminaFill.BackgroundColor3=data.stamina<25 and Color3.fromRGB(186,113,81) or Color3.fromRGB(135,171,161)
  local mark = function(yes) return yes and "✓ " or "□ " end
  tasksText.Text = "BENEATH THE HOUSE / "..(data.classId or "Wanderer").."\n\n"
   .. mark(data.diary >= 20) .. "Collect diary pages (" .. data.diary .. "/20)\n"
   .. mark(data.records >= 3) .. "Find family records (" .. data.records .. "/3)\n"
   .. mark(data.hasKey) .. "Find the unnumbered key\n"
   .. mark(data.rooms >= 10) .. "Explore the rooms (" .. data.rooms .. "/10)\n"
   .. "Sandwich: " .. (data.sandwich == 0 and "ready" or data.sandwich .. "s")
 elseif action == "Read" then
  paper.Size=UDim2.fromScale(0.88,0.56)
  reviveButton.Visible=false reviveNotice.Visible=false
  modalReason = "read"
  readingId = data.id
  heading.Text = data.title
  body.Text = data.text
  closeButton.Text = "Put it back"
  chooseButton.Visible = false
  modal.Visible = true
 elseif action == "Confirm" then
  paper.Size=UDim2.fromScale(0.88,0.56)
  reviveButton.Visible=false reviveNotice.Visible=false
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
  heading.Text = data.id=="consumed" and "The house remembers." or data.id=="fallen" and "Your story is not over." or data.title
  body.Text = data.text
  closeButton.Text = "RETURN TO ASHFIELD"
  reviveButton.Visible=data.id=="consumed" or data.id=="fallen"
  reviveNotice.Visible=data.id=="consumed" or data.id=="fallen"
  paper.Size=UDim2.fromScale(0.88,0.48)
  reviveButton.Text=Config.ReviveProductId>0 and "REVIVE / VIEW PRICE" or "REVIVE UNAVAILABLE"
  reviveNotice.Text=Config.ReviveProductId>0 and "Returning is free. A paid revive keeps this run’s discoveries; Roblox confirms the price." or "Return to Ashfield to begin again."
  chooseButton.Visible = false
  modal.Visible = true
 elseif action=="Travel" then
  if modalReason=="ending" then
   if data.phase=="Departing" then closeButton.Text="Returning to lobby..." else closeButton.Text="Return to lobby / Retry" end
   reviveNotice.Visible=true reviveNotice.Text=data.message or ""
  end
 elseif action == "ReviveStatus" then
  if modalReason=="ending" then reviveNotice.Text=data reviveNotice.Visible=true end
 elseif action == "Revived" then
  modalReason=nil modal.Visible=false reviveButton.Visible=false reviveNotice.Visible=false
  cursorFree=false
  showCaption(data,8)
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
 gui:SetAttribute("Modal",modalReason or "")
 local isBlocked = blocked()
 menuBlur.Size=modalReason and 3 or 0
 shardHud.Visible=false
 lobbyMenu.Visible=false
 floatingQueue.Visible=false
 if ux.update then ux.update(dt)end
 local camera=workspace.CurrentCamera
 if camera then
  if not current.started and not lobbyWalking then
   camera.CameraType=Enum.CameraType.Scriptable
   camera.CFrame=CFrame.lookAt(Vector3.new(400+math.sin(os.clock()*0.08)*1.2,8,-12),Vector3.new(400,5,14))
  elseif camera.CameraType==Enum.CameraType.Scriptable then camera.CameraType=Enum.CameraType.Custom end
 end
 controlHints.Visible=false
 journalButton.Visible=current.started and not current.ended
 cameraButton.Visible=current.started and not current.ended
 mouseButton.Visible=current.started and not current.ended
 lampButton.Visible=false
 mapButton.Visible=current.started and not current.ended
 householdButton.Visible=current.started and not current.ended
 mouseButton.Modal=cursorFree and not isBlocked
 mouseButton.Text=cursorFree and "Capture cursor" or "Release cursor"
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
 local mode = not current.started and "third" or thirdPerson and "third" or "first"
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
 if isBlocked or cursorFree or not current.started then
  UserInputService.MouseBehavior=Enum.MouseBehavior.Default
 elseif not thirdPerson then UserInputService.MouseBehavior=Enum.MouseBehavior.LockCenter end
 UserInputService.MouseIconEnabled = isBlocked or cursorFree or not current.started
 ProximityPromptService.Enabled = not isBlocked
 cross.Visible = not isBlocked and current.started
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
  if active.id == "watcher" then
   local rig=active.rigs[1]
   if rig then
    local cam=workspace.CurrentCamera
    local head=rig:FindFirstChild("Head") or rig.PrimaryPart
    local projected,onScreen=cam:WorldToViewportPoint(head.Position)
    local params=RaycastParams.new() params.FilterType=Enum.RaycastFilterType.Exclude
    params.FilterDescendantsInstances={player.Character,active.model,workspace:FindFirstChild("SpareRoomNPCs")}
    local sight=workspace:Raycast(cam.CFrame.Position,head.Position-cam.CFrame.Position,params)
    local watching=onScreen and projected.Z>0 and sight==nil
    active.unwatched=watching and 0 or (active.unwatched or 0)+dt
    active.nextMove=active.nextMove or 0
    active.ground=active.ground or base.Position
    local root=player.Character and player.Character:FindFirstChild("HumanoidRootPart")
    if root and not watching and active.unwatched>=Config.Watcher.unseenSeconds and t>=active.nextMove then
     local delta=Vector3.new(root.Position.X-active.ground.X,0,root.Position.Z-active.ground.Z)
     if delta.Magnitude>Config.Watcher.minimumDistance+Config.Watcher.stepDistance then
      local step=delta.Unit*Config.Watcher.stepDistance
      local candidate=active.ground+step
      local floor=workspace:Raycast(candidate+Vector3.new(0,2,0),Vector3.new(0,-5,0),params)
      local path=workspace:Raycast(active.ground+Vector3.new(0,4,0),step,params)
      if floor and floor.Instance.CanCollide and math.abs(floor.Position.Y-active.ground.Y)<1 and not path then
       local overlap=OverlapParams.new() overlap.FilterType=Enum.RaycastFilterType.Exclude overlap.FilterDescendantsInstances=params.FilterDescendantsInstances
       local clear=true
       for _,p in ipairs(workspace:GetPartBoundsInBox(CFrame.new(floor.Position+Vector3.new(0,5,0)),Vector3.new(3,9.5,3),overlap)) do if p.CanCollide then clear=false break end end
       if clear then active.ground=floor.Position+Vector3.new(0,.05,0) active.moves=(active.moves or 0)+1 end
      end
     end
     active.nextMove=t+Config.Watcher.moveCooldown
    end
    Avatars.place(rig,active.ground)
    if root then
     local facing=Vector3.new(root.Position.X,rig.PrimaryPart.Position.Y,root.Position.Z)
     if (facing-rig.PrimaryPart.Position).Magnitude>.01 then rig:PivotTo(CFrame.lookAt(rig.PrimaryPart.Position,facing)) end
    end
    rig:SetAttribute("Observed",watching) rig:SetAttribute("UnseenSteps",active.moves or 0)
   end
  elseif active.id == "doll" then
   local rig=active.rigs[1]
   if rig then
    Avatars.place(rig,base.Position)
    rig:PivotTo(CFrame.lookAt(rig.PrimaryPart.Position,rig.PrimaryPart.Position+base.LookVector)*CFrame.Angles(0,math.sin(t*0.25)*0.4,0))
   end
  elseif active.id == "pages" then
   for i,part in ipairs(parts) do
    local angle=t*0.45+i*math.pi/4
    part.CFrame=base*CFrame.new(math.cos(angle)*1.1,1.8+math.sin(t+i)*0.25,math.sin(angle)*1.1)*CFrame.Angles(0,angle,math.sin(t+i)*0.2)
   end
  elseif active.id == "door" then
   local swing=math.sin(math.clamp((t-3)/5,0,1)*math.pi)*.85
   parts[1].CFrame=base*CFrame.new(0,2.4,0)*CFrame.Angles(0,swing,0)
   parts[2].CFrame=parts[1].CFrame*CFrame.new(0.85,0,-0.2)
   parts[3].CFrame=base*CFrame.new(-1.35,2.55,0)
   parts[4].CFrame=base*CFrame.new(1.35,2.55,0)
   parts[5].CFrame=base*CFrame.new(0,5.05,0)
  elseif active.id == "family" then
   for i,rig in ipairs(active.rigs) do
    local point=base.Position+base.RightVector*((i-2.5)*0.95)
    Avatars.place(rig,point)
    rig:PivotTo(CFrame.lookAt(rig.PrimaryPart.Position,rig.PrimaryPart.Position+base.LookVector))
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




-- Responsive settings share the game's pause and input handling.
do
 local overlay=frame(canvas,"Settings",UDim2.fromScale(0,0),UDim2.fromScale(1,1))
 overlay.ZIndex=40 overlay.Visible=false overlay.BackgroundTransparency=.65 overlay.Active=true
 local panel=frame(overlay,"Panel",UDim2.fromOffset(360,90),UDim2.fromOffset(560,540))
 text(panel,"SETTINGS",UDim2.fromOffset(28,20),UDim2.fromOffset(504,40),28)
 text(panel,"Update announcements",UDim2.fromOffset(28,68),UDim2.fromOffset(504,30),18)
 text(panel,"Roblox installs experience updates. These options control release notices.",UDim2.fromOffset(28,103),UDim2.fromOffset(504,48),14)
 local status=text(panel,"",UDim2.fromOffset(28,330),UDim2.fromOffset(504,44),14)
 local options={{"always","Always check for updates"},{"stable","Notify only for stable releases"},{"never","Never check for updates"}}
 local choices={}
 local event=ReplicatedStorage:WaitForChild("SpareRoomUpdatePreference")
 local function refresh()
  local selected=player:GetAttribute("SpareRoomUpdatePreference") or "stable"
  for id,b in pairs(choices) do b.Text=(selected==id and "[ SELECTED ]  " or "")..b:GetAttribute("Label") b.BackgroundColor3=selected==id and Color3.fromRGB(63,78,65) or Color3.fromRGB(38,42,39) end
 end
 local function closeSettings() overlay.Visible=false if modalReason=="settings" then modalReason=nil remote:FireServer("Pause",false) end end
 button(panel,"RETURN TO LOBBY / ENDS THIS RUN",UDim2.fromOffset(28,478),UDim2.fromOffset(504,36),function()
  closeSettings() remote:FireServer("Lobby")
 end).Name="ReturnToLobby"
 for i,option in ipairs(options) do
  local id,label=option[1],option[2]
  local b=button(panel,label,UDim2.fromOffset(28,166+(i-1)*50),UDim2.fromOffset(504,42),function() status.Text="Saving preference..." event:FireServer(id) end)
  b.Name=id b:SetAttribute("Label",label) choices[id]=b
 end
 local function openSettings()
  if modalReason or shop.Visible then return end
  modalReason="settings" overlay.Visible=true status.Text=player:GetAttribute("SpareRoomPreferenceSaved") and "Preference saved." or "Preference applies this session; saving may be unavailable."
  remote:FireServer("Pause",true) refresh()
  if player:GetAttribute("SpareRoomUpdatePreference")~="never" then event:FireServer("Check") end
 end
 local openSignal=Instance.new("BindableEvent") openSignal.Name="OpenSettings" openSignal.Parent=gui openSignal.Event:Connect(openSettings)
 local settingsButton=button(canvas,"SETTINGS",UDim2.fromOffset(1136,362),UDim2.fromOffset(116,36),openSettings)
 settingsButton.Name="SettingsButton" ux.settingsButton=settingsButton settingsButton.ZIndex=15 settingsButton.Visible=current.started
 remote.OnClientEvent:Connect(function(action,data) if action=="State" then settingsButton.Visible=data.started end end)
 button(panel,"REPLAY RUN TUTORIAL",UDim2.fromOffset(28,534),UDim2.fromOffset(504,38),function()
  closeSettings() local replay=gui:FindFirstChild("ReplayTutorial")if replay then replay:Fire()end
 end).Name="ReplayTutorialButton"
 button(panel,"CLOSE",UDim2.fromOffset(166,418),UDim2.fromOffset(228,38),closeSettings).Name="CloseSettings"
 player:GetAttributeChangedSignal("SpareRoomUpdatePreference"):Connect(refresh)
 event.OnClientEvent:Connect(function(data)
  if type(data)~="table" then return end
  if data.status then status.Text=data.status end
  local release=data.release
  if release and player:GetAttribute("SpareRoomUpdatePreference")~="never" then
   local function number(v) local a,b,c=string.match(v,"(%d+)%.(%d+)%.(%d+)") return (tonumber(a) or 0)*1000000+(tonumber(b) or 0)*1000+(tonumber(c) or 0) end
   if number(release.version)>number(data.current or "0.0.0") then
    status.Text="Release "..release.version.." ("..release.channel.."): "..release.message
    showCaption(status.Text,10)
   else status.Text="You are running version "..tostring(data.current)..". No newer release announced." end
  end
 end)
 UserInputService.InputBegan:Connect(function(input) if input.KeyCode==Enum.KeyCode.Escape and overlay.Visible then closeSettings() end end)
 refresh()
 task.delay(6,function() if player:GetAttribute("SpareRoomUpdatePreference")~="never" then event:FireServer("Check") end end)
end

-- Premium presentation layer: quiet exploration HUD; tools appear only on demand.
do
 local muted=Color3.fromRGB(160,177,168)
 local function quiet(frameObject)
  frameObject.BackgroundTransparency=1
  local stroke=frameObject:FindFirstChildOfClass("UIStroke")if stroke then stroke.Enabled=false end
 end
 hud.Position=UDim2.fromOffset(32,36)hud.Size=UDim2.fromOffset(208,42)
 quiet(hud)quiet(sanityTrack)quiet(sanityFill)
 sanityText.Position=UDim2.fromOffset(0,0)sanityText.Size=UDim2.fromOffset(208,22)sanityText.TextSize=13 sanityText.TextXAlignment=Enum.TextXAlignment.Left
 sanityTrack.Position=UDim2.fromOffset(0,29)sanityTrack.Size=UDim2.fromOffset(208,3)sanityTrack.BackgroundTransparency=.55 sanityTrack.BackgroundColor3=Color3.fromRGB(73,87,81)
 sanityFill.BackgroundTransparency=0 sanityFill.BackgroundColor3=Color3.fromRGB(205,190,146)
 staminaHud.Position=UDim2.fromOffset(32,82)staminaHud.Size=UDim2.fromOffset(144,20)quiet(staminaHud)
 staminaText.Visible=false quiet(staminaTrack)quiet(staminaFill)
 staminaTrack.Position=UDim2.fromOffset(0,0)staminaTrack.Size=UDim2.fromOffset(144,2)staminaTrack.BackgroundTransparency=.7 staminaFill.BackgroundTransparency=0
 tasks.Visible=false
 controlHints.Visible=false
 worldClock.Visible=false
 caption.Position=UDim2.fromOffset(340,568)caption.Size=UDim2.fromOffset(600,62)caption.BackgroundTransparency=.3
 captionText.TextSize=17 captionText.TextColor3=Color3.fromRGB(235,232,214)
 local captionStroke=caption:FindFirstChildOfClass("UIStroke")if captionStroke then captionStroke.Enabled=false end
 cross.Size=UDim2.fromOffset(2,2)quiet(cross)cross.BackgroundTransparency=.4
 modal.Position=UDim2.fromOffset(315,92)modal.Size=UDim2.fromOffset(650,530)
 modal.BackgroundColor3=Color3.fromRGB(15,23,21)modal.BackgroundTransparency=.025
 heading.Font=Enum.Font.Garamond heading.TextSize=31 heading.TextColor3=Color3.fromRGB(228,216,182)
 heading.TextXAlignment=Enum.TextXAlignment.Left
 body.TextSize=18 body.LineHeight=1.15 body.TextColor3=Color3.fromRGB(211,220,207)
 ux.dim=Instance.new("Frame")ux.dim.Name="ReadingScrim"ux.dim.Size=UDim2.fromScale(1,1)ux.dim.BackgroundColor3=Color3.fromRGB(4,9,8)ux.dim.BackgroundTransparency=.55 ux.dim.BorderSizePixel=0 ux.dim.Visible=false ux.dim.ZIndex=18 ux.dim.Parent=canvas
 ux.goal=text(canvas,"Find the missing diary pages",UDim2.fromOffset(32,620),UDim2.fromOffset(410,44),15)
 ux.goal.Name="CurrentObjective"ux.goal.TextXAlignment=Enum.TextXAlignment.Left ux.goal.TextYAlignment=Enum.TextYAlignment.Top ux.goal.TextColor3=Color3.fromRGB(210,219,204)
 ux.drawer=frame(canvas,"FieldTools",UDim2.fromOffset(886,300),UDim2.fromOffset(362,348))
 ux.drawer.ZIndex=35 ux.drawer.Visible=false ux.drawer.BackgroundColor3=Color3.fromRGB(15,24,22)ux.drawer.BackgroundTransparency=.025
 text(ux.drawer,"FIELD NOTES",UDim2.fromOffset(20,13),UDim2.fromOffset(322,34),22).Font=Enum.Font.Garamond
 ux.closeTools=function()
  ux.drawer.Visible=false if modalReason=="tools"then modalReason=nil remote:FireServer("Pause",false)end
 end
 ux.toggleTools=function()
  if modalReason=="tools"then ux.closeTools()return end
  if blocked()or not current.started then return end
  ux.drawer.Visible=true modalReason="tools"remote:FireServer("Pause",true)
 end
 ux.notes=button(canvas,"NOTES / TAB",UDim2.fromOffset(1118,654),UDim2.fromOffset(130,34),ux.toggleTools)
 ux.notes.Name="FieldNotesButton"
 ux.torch=button(canvas,"LIGHT / F",UDim2.fromOffset(992,654),UDim2.fromOffset(116,34),toggleTorch)
 ux.torch.Name="FlashlightButton"
 local actions={journalButton,mapButton,householdButton,ux.settingsButton,cameraButton,mouseButton,adminButton}
 local labels={"Discoveries","District guide","Explorers","Settings","Camera view","Release cursor","Housekeeper / F8"}
 for i,b in ipairs(actions)do
  b.Parent=ux.drawer b.Position=UDim2.fromOffset(20+((i-1)%2)*164,62+math.floor((i-1)/2)*47)
  b.Size=UDim2.fromOffset(156,38)b.Text=labels[i]b.TextSize=13 b.ZIndex=36
 end
 text(ux.drawer,"SHIFT Sprint    E Interact    F Light\nG District guide    M Cursor    V View",UDim2.fromOffset(20,254),UDim2.fromOffset(322,48),12).TextColor3=muted
 button(ux.drawer,"CLOSE / TAB",UDim2.fromOffset(20,309),UDim2.fromOffset(322,26),ux.closeTools)
 lampButton.Visible=false lampButton.Parent=ux.drawer -- legacy keyboard state, no duplicate entry
 ux.startedAt=nil ux.staminaUntil=0 ux.lastGoal=""
 ux.update=function(dt)
  local exploring=current.started and not current.ended
  local clear=exploring and modalReason==nil
  sprintButton.Visible=clear and UserInputService.TouchEnabled
  hud.Visible=clear staminaHud.Visible=clear and ((current.stamina or 100)<99 or os.clock()<ux.staminaUntil)
  if (current.stamina or 100)<99 then ux.staminaUntil=os.clock()+1.2 end
  sanityText.Text="SANITY  "..math.ceil(current.sanity or 100).."%"
  sanityText.TextColor3=(current.sanity or 100)<25 and Color3.fromRGB(223,147,121)or Color3.fromRGB(212,219,204)
  tasks.Visible=false shardHud.Visible=false worldClock.Visible=false controlHints.Visible=false
  ux.goal.Visible=clear and not gui:GetAttribute("TutorialActive") ux.notes.Visible=exploring and (not modalReason or modalReason=="tools")
  ux.torch.Visible=clear ux.torch.Text=flashlightOn and "LIGHT ON / F"or"LIGHT OFF / F"
  ux.dim.Visible=modal.Visible or ux.drawer.Visible
  local diary=current.diary or 0 local records=current.records or 0
  ux.goal.Text=diary<20 and ("FIND THE MISSING DIARY PAGES\n"..diary.." / 20 discovered  ·  Notes for all clues")or records<3 and ("RECOVER THE FAMILY RECORDS\n"..records.." / 3 found")or not current.hasKey and "FIND THE UNNUMBERED KEY"or"DISCOVER WHAT LIES BENEATH THE HOUSE"
  if not exploring then ux.drawer.Visible=false end
  lampButton.Visible=false
 end
end

local actionService=game:GetService("ContextActionService")
pcall(function()game:GetService("StarterGui"):SetCoreGuiEnabled(Enum.CoreGuiType.PlayerList,false)end)
actionService:BindActionAtPriority("SpareRoomFieldNotes",function(_,state)if state==Enum.UserInputState.Begin and not UserInputService:GetFocusedTextBox()then ux.toggleTools()end return Enum.ContextActionResult.Sink end,false,3000,Enum.KeyCode.Tab)
-- Unscaled safe-area HUD: readable controls at narrow window and mobile sizes.
do
 ux.safe=Instance.new("Frame")ux.safe.Name="SafeAreaHUD"ux.safe.Size=UDim2.fromScale(1,1)ux.safe.BackgroundTransparency=1 ux.safe.BorderSizePixel=0 ux.safe.ZIndex=10 ux.safe.Parent=gui
 for _,item in {hud,staminaHud,ux.goal,ux.notes,ux.torch,ux.drawer}do item.Parent=ux.safe end
 sanityText.TextSize=14 ux.goal.TextSize=14
 hud.Position=UDim2.fromOffset(24,48)staminaHud.Position=UDim2.fromOffset(24,92)
 ux.notes.AnchorPoint=Vector2.new(1,1)ux.notes.Position=UDim2.new(1,-24,1,-22)ux.notes.Size=UDim2.fromOffset(120,34)
 ux.torch.AnchorPoint=Vector2.new(1,1)ux.torch.Position=UDim2.new(1,-154,1,-22)ux.torch.Size=UDim2.fromOffset(116,34)
 ux.goal.AnchorPoint=Vector2.new(0,1)
 ux.drawer.AnchorPoint=Vector2.new(1,1)ux.drawer.Position=UDim2.new(1,-16,1,-70)
 local previousUpdate=ux.update
 ux.update=function(dt)
  previousUpdate(dt)
  local width=ux.safe.AbsoluteSize.X
  ux.goal.Position=UDim2.new(0,24,1,width<700 and -76 or -25)
  ux.goal.Size=UDim2.fromOffset(math.min(390,width-48),44)
  local drawerWidth=math.min(362,width-32)
  ux.drawer.Size=UDim2.fromOffset(drawerWidth,348)
  for _,item in ux.drawer:GetChildren()do
   if item:IsA("TextButton")then
    if item.Size.X.Offset>250 then item.Size=UDim2.fromOffset(drawerWidth-40,item.Size.Y.Offset)
    else
     local col=item.Position.X.Offset>100 and 1 or 0
     item.Size=UDim2.fromOffset((drawerWidth-52)/2,item.Size.Y.Offset)
     item.Position=UDim2.fromOffset(20+col*((drawerWidth-52)/2+12),item.Position.Y.Offset)
    end
   elseif item:IsA("TextLabel")then item.Size=UDim2.fromOffset(drawerWidth-40,item.Size.Y.Offset)end
  end
 end
 local function quietLegacy(child)if child.Name=="HDAdmin"and child:IsA("ScreenGui")then child.Enabled=true end end
 for _,child in player.PlayerGui:GetChildren()do quietLegacy(child)end
 player.PlayerGui.ChildAdded:Connect(quietLegacy)
end
do
 modal.Parent=ux.safe modal.AnchorPoint=Vector2.new(.5,.5)modal.Position=UDim2.fromScale(.5,.5)
 ux.dim.Parent=ux.safe
 local previousUpdate=ux.update
 ux.update=function(dt)
  previousUpdate(dt)
  local width,height=ux.safe.AbsoluteSize.X,ux.safe.AbsoluteSize.Y
  modal.Size=UDim2.fromOffset(math.min(650,width-32),math.min(530,height-24))
  closeButton.AnchorPoint=Vector2.new(0,1)closeButton.Position=UDim2.new(.05,0,1,-16)closeButton.Size=UDim2.new(.42,0,0,height<430 and 36 or 44)
  chooseButton.AnchorPoint=Vector2.new(0,1)chooseButton.Position=UDim2.new(.52,0,1,-16)chooseButton.Size=closeButton.Size
  reviveButton.AnchorPoint=chooseButton.AnchorPoint reviveButton.Position=chooseButton.Position reviveButton.Size=chooseButton.Size
  heading.TextSize=width<500 and 25 or 31 body.TextSize=width<500 and 16 or 18
 end
end
do
 local settingsOverlay=canvas:FindFirstChild("Settings")
 if settingsOverlay then
  settingsOverlay.Parent=gui
  local panel=settingsOverlay:FindFirstChild("Panel")
  panel.AnchorPoint=Vector2.new(.5,.5)panel.Position=UDim2.fromScale(.5,.5)
  local items={}
  for _,item in panel:GetChildren()do if item:IsA("GuiObject")then
   table.insert(items,{object=item,position=item.Position,size=item.Size})
  end end
  local previousUpdate=ux.update
  ux.update=function(dt)
   previousUpdate(dt)
   if not settingsOverlay.Visible then return end
   local width,height=ux.safe.AbsoluteSize.X,ux.safe.AbsoluteSize.Y
   local sw,sh=math.min(560,width-24),math.min(540,height-24)
   panel.Size=UDim2.fromOffset(sw,sh)
   for _,entry in items do
    local item=entry.object
    item.Size=UDim2.fromOffset(math.min(entry.size.X.Offset,sw-56),entry.size.Y.Offset)
    item.Position=UDim2.fromOffset(item.Name=="CloseSettings"and (sw-item.Size.X.Offset)/2 or 28,entry.position.Y.Offset*sh/540)
    if item:IsA("TextButton")then item.TextSize=width<500 and 13 or 16 end
   end
  end
 end
end
-- Touch controls reserve Roblox's lower-right jump zone; short menus scroll.
do
 sprintButton.Parent=ux.safe sprintButton.AnchorPoint=Vector2.new(1,1)
 local content=Instance.new("ScrollingFrame")
 content.Name="DrawerContent" content.BackgroundTransparency=1 content.BorderSizePixel=0
 content.Size=UDim2.fromScale(1,1) content.CanvasSize=UDim2.fromOffset(0,348) content.ScrollBarThickness=3
 content.Parent=ux.drawer
 for _,item in ux.drawer:GetChildren()do
  if item~=content and item:IsA("GuiObject")then item.Parent=content end
 end
 local entries={}
 local overlay=gui:FindFirstChild("Settings")
 local panel=overlay and overlay:FindFirstChild("Panel")
 if panel then
  local scroll=Instance.new("ScrollingFrame")
  scroll.Name="SettingsContent" scroll.BackgroundTransparency=1 scroll.BorderSizePixel=0
  scroll.Size=UDim2.fromScale(1,1) scroll.CanvasSize=UDim2.fromOffset(0,600) scroll.ScrollBarThickness=3 scroll.Parent=panel
  for _,item in panel:GetChildren()do
   if item~=scroll and item:IsA("GuiObject")then table.insert(entries,{object=item,y=item.Position.Y.Offset}) item.Parent=scroll end
  end
 end
 local previousUpdate=ux.update
 ux.update=function(dt)
  previousUpdate(dt)
  local width,height=ux.safe.AbsoluteSize.X,ux.safe.AbsoluteSize.Y
  local drawerWidth=math.min(362,width-32)
  ux.drawer.Size=UDim2.fromOffset(drawerWidth,math.min(348,height-32))
  ux.drawer.Position=UDim2.new(1,-16,1,height<430 and -16 or -70)
  for _,item in content:GetChildren()do
   if item:IsA("TextButton")then
    if item.Size.X.Offset>250 then item.Size=UDim2.fromOffset(drawerWidth-40,item.Size.Y.Offset)
    else
     local col=item.Position.X.Offset>100 and 1 or 0
     item.Size=UDim2.fromOffset((drawerWidth-52)/2,item.Size.Y.Offset)
     item.Position=UDim2.fromOffset(20+col*((drawerWidth-52)/2+12),item.Position.Y.Offset)
    end
   elseif item:IsA("TextLabel")then item.Size=UDim2.fromOffset(drawerWidth-40,item.Size.Y.Offset)end
  end
  for _,entry in entries do entry.object.Position=UDim2.fromOffset(entry.object.Position.X.Offset,entry.y)end
  if UserInputService.TouchEnabled then
   ux.notes.Position=UDim2.new(1,-24,1,-116) ux.notes.Size=UDim2.fromOffset(120,44)
   ux.torch.Position=UDim2.new(1,-154,1,-116) ux.torch.Size=UDim2.fromOffset(116,44)
   sprintButton.Position=UDim2.new(1,-24,1,-168) sprintButton.Size=UDim2.fromOffset(110,44)
   ux.goal.AnchorPoint=Vector2.zero ux.goal.Position=UDim2.fromOffset(24,128)
   ux.goal.Size=UDim2.fromOffset(math.min(320,width-48),44)
  end
 end
end

-- Responsive class catalogue: all classes stay reachable as the roster grows.
do
 shop.Parent=ux.safe shop.AnchorPoint=Vector2.new(.5,.5)shop.Position=UDim2.fromScale(.5,.5)
 local catalog=Instance.new("ScrollingFrame")catalog.Name="ClassCatalogue"catalog.BackgroundTransparency=1 catalog.BorderSizePixel=0 catalog.ScrollBarThickness=4 catalog.AutomaticCanvasSize=Enum.AutomaticSize.Y catalog.CanvasSize=UDim2.new()catalog.Parent=shop
 local grid=Instance.new("UIGridLayout")grid.CellPadding=UDim2.fromOffset(12,12)grid.SortOrder=Enum.SortOrder.LayoutOrder grid.Parent=catalog
 local cards={}
 for i,id in Config.ClassOrder do local card=shop:FindFirstChild(id)if card then card.Parent=catalog card.LayoutOrder=i table.insert(cards,card)end end
 local footer=Instance.new("ScrollingFrame")footer.Name="ShardOptions"footer.BackgroundTransparency=1 footer.BorderSizePixel=0 footer.ScrollBarThickness=3 footer.CanvasSize=UDim2.fromOffset(0,230)footer.Parent=shop
 local packIndex=0
 for _,item in shop:GetChildren()do
  if item:IsA("TextButton")and item.Text:find("View Roblox price",1,true)then packIndex+=1 item.Parent=footer item.Position=UDim2.fromOffset(0,28+(packIndex-1)*42)item.Size=UDim2.new(1,-8,0,36)item.TextSize=12
  elseif item:IsA("TextLabel")and item.Text:find("OPTIONAL SHARD",1,true)then item.Parent=footer item.Position=UDim2.new()item.Size=UDim2.new(1,-8,0,24)item.TextSize=12
  elseif item:IsA("TextLabel")and item.Text:find("EARN SHARDS",1,true)then item.Parent=footer item.Position=UDim2.fromOffset(0,158)item.Size=UDim2.new(1,-8,0,60)item.TextSize=12
  elseif item:IsA("TextButton")and item.Text=="RETRY SAVING CONNECTION"then item.Parent=footer item.Position=UDim2.fromOffset(0,220)item.Size=UDim2.new(1,-8,0,34)footer.CanvasSize=UDim2.fromOffset(0,264)
  end
 end
 local prev=ux.update
 ux.update=function(dt)
  prev(dt)if not shop.Visible then return end
  local w,h=math.min(1100,ux.safe.AbsoluteSize.X-24),math.min(680,ux.safe.AbsoluteSize.Y-24)
  shop.Size=UDim2.fromOffset(w,h)
  for _,item in shop:GetChildren()do
   if item:IsA("TextButton")and item.Text=="CLOSE"then item.Position=UDim2.new(1,-100,0,12)item.Size=UDim2.fromOffset(86,34)
   elseif item:IsA("TextLabel")and item~=shopBalance and item~=shopStatus then item.Position=UDim2.fromOffset(16,12)item.Size=UDim2.new(1,-130,0,32)item.TextSize=20 end
  end
  shopBalance.Position=UDim2.fromOffset(16,48)shopBalance.Size=UDim2.new(1,-32,0,28)shopBalance.TextSize=12
  shopStatus.Position=UDim2.new(0,16,1,-28)shopStatus.Size=UDim2.new(1,-32,0,24)shopStatus.TextSize=12
  local footerHeight=h<420 and 62 or 100
  footer.Position=UDim2.new(0,16,1,-footerHeight-34)footer.Size=UDim2.new(1,-32,0,footerHeight)
  catalog.Position=UDim2.fromOffset(16,82)catalog.Size=UDim2.new(1,-32,0,math.max(100,h-footerHeight-128))
  local cols=math.max(1,math.floor((w-32)/300))local cw=(w-32-(cols-1)*12-8)/cols
  grid.CellSize=UDim2.fromOffset(cw,224)
  for _,card in cards do
   classButtons[card.Name].Position=UDim2.new(0,12,1,-46)classButtons[card.Name].Size=UDim2.new(1,-24,0,34)classButtons[card.Name].TextSize=12
   for _,item in card:GetChildren()do
    if item:IsA("TextLabel")then
     if item.Text==Config.Classes[card.Name].name then item.Position=UDim2.fromOffset(12,8)item.Size=UDim2.new(1,-24,0,30)item.TextSize=22
     else item.Position=UDim2.fromOffset(110,44)item.Size=UDim2.new(1,-122,0,124)item.TextSize=13 end
    end
   end
  end
 end
end
