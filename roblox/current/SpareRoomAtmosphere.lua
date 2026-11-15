-- StarterPlayer.StarterPlayerScripts.SpareRoomAtmosphere
local Players=game:GetService("Players")
local RS=game:GetService("ReplicatedStorage")
local RunService=game:GetService("RunService")
local Lighting=game:GetService("Lighting")
local p=Players.LocalPlayer
local gui=Instance.new("ScreenGui")gui.Name="SpareRoomDateTime"gui.ResetOnSpawn=false gui.Parent=p:WaitForChild("PlayerGui")
local box=Instance.new("TextLabel")box.Name="InGameClock"box.Text="DAY 1  ·  --:--"box.AnchorPoint=Vector2.new(1,0)box.Position=UDim2.new(1,-20,0,12)box.Size=UDim2.fromOffset(176,44)box.BackgroundColor3=Color3.fromRGB(15,24,22)box.BackgroundTransparency=.18 box.BorderSizePixel=0 box.Font=Enum.Font.Gotham box.TextSize=16 box.TextColor3=Color3.fromRGB(203,216,202)box.Parent=gui
Instance.new("UICorner",box).CornerRadius=UDim.new(0,5)
local sight=RS:FindFirstChild("SpareRoomWatcherSight")
RS.ChildAdded:Connect(function(child)if child.Name=="SpareRoomWatcherSight"then sight=child end end)
local effect=Instance.new("ColorCorrectionEffect")effect.Name="SpareRoomDread"effect.Parent=Lighting
local activeUntil=0 local intensity=0
local gameDay=1 local gameHour=8
local function updateClock()
 local lobby=workspace:GetAttribute("SpareRoomRole")=="Lobby"
 local touch=game:GetService("UserInputService").TouchEnabled
 box.Size=UDim2.fromOffset(218,34)
 box.AnchorPoint=lobby and Vector2.new(0,1)or Vector2.new(1,0)
 box.Position=lobby and UDim2.new(0,24,1,-12)or UDim2.new(1,-20,0,12)
 box.BackgroundTransparency=.14
 box.TextXAlignment=Enum.TextXAlignment.Center
 local hud=p.PlayerGui:FindFirstChild("SpareRoomHUD")box.Visible=not hud or(hud:GetAttribute("Modal")or "")==""

 local minutes=math.floor((gameHour%24)*60)
 box.Text=string.format("DAY %d  ·  %02d:%02d",gameDay,math.floor(minutes/60),minutes%60)
end
local remote=RS:WaitForChild("SpareRoomEvent")
remote.OnClientEvent:Connect(function(action,data)
 if action=="WorldClock"then
  gameDay=math.max(1,math.floor(data.day or 1))gameHour=data.hour or 8 updateClock()
 elseif action=="Anomaly"then activeUntil=os.clock()+(data.duration or 14)
 elseif action=="AnomalyEnd"then activeUntil=0 end
end)
local timer=0 local clockTimer=0
RunService.RenderStepped:Connect(function(dt)
 clockTimer+=dt timer+=dt
 if clockTimer>=1 then clockTimer=0 updateClock()end
 local target=os.clock()<activeUntil and .065 or 0 intensity+=(target-intensity)*math.min(1,dt*2)
 effect.Saturation=-intensity effect.Contrast=intensity effect.Brightness=-intensity*.3
 if timer<.35 or not sight then return end timer=0
 local folder=workspace:FindFirstChild("SpareRoomNPCs")local watcher=folder and folder:FindFirstChild("Watcher")
 local head=watcher and watcher:FindFirstChild("Head")local camera=workspace.CurrentCamera
 local seen=false
 if head and camera then
  local v,onScreen=camera:WorldToViewportPoint(head.Position)
  if onScreen and v.Z>0 and v.Z<90 then
   local params=RaycastParams.new()params.FilterType=Enum.RaycastFilterType.Exclude params.FilterDescendantsInstances={p.Character,folder}
   seen=workspace:Raycast(camera.CFrame.Position,head.Position-camera.CFrame.Position,params)==nil
  end
 end
 sight:FireServer(seen)
end)
