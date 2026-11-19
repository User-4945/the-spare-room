local Players=game:GetService("Players")local RS=game:GetService("ReplicatedStorage")
local player=Players.LocalPlayer
if player.UserId~=11080546757 or game.PlaceId~=121199873496043 then return end
local remote=RS:WaitForChild("SpareRoomOwnerChristmas")
local gui=Instance.new("ScreenGui")gui.Name="SpareRoomOwnerChristmas"gui.ResetOnSpawn=false gui.DisplayOrder=10 gui.Parent=player:WaitForChild("PlayerGui")
local button=Instance.new("TextButton")button.Name="PlayChristmasWeek1"button.Size=UDim2.fromOffset(250,36)
button.AnchorPoint=Vector2.new(0,1)button.Position=UDim2.new(0,24,1,-58)
button.BackgroundColor3=Color3.fromRGB(33,47,40)button.BackgroundTransparency=.1
button.TextColor3=Color3.fromRGB(228,214,173)button.Font=Enum.Font.GothamMedium button.TextSize=12
button.Text="CHRISTMAS WEEK 1  /  PRIVATE PREVIEW"button.Parent=gui
local corner=Instance.new("UICorner")corner.CornerRadius=UDim.new(0,6)corner.Parent=button
local stroke=Instance.new("UIStroke")stroke.Color=Color3.fromRGB(113,105,76)stroke.Transparency=.4 stroke.Parent=button
local hint=Instance.new("TextLabel")hint.BackgroundTransparency=1 hint.TextColor3=button.TextColor3 hint.Font=Enum.Font.Gotham hint.TextSize=12 hint.TextWrapped=true
hint.Size=UDim2.fromOffset(250,40)hint.AnchorPoint=Vector2.new(0,1)hint.Position=UDim2.new(0,24,1,-98)hint.Text=""hint.Parent=gui
local busy=false
button.Activated:Connect(function()
 if busy or player:GetAttribute("SpareRoomCanPreviewChristmas")~=true then return end
 busy=true button.AutoButtonColor=false remote:FireServer()
 task.delay(10,function()busy=false button.AutoButtonColor=true end)
end)
remote.OnClientEvent:Connect(function(message)if type(message)=="string"then hint.Text=message end end)
local function refresh()button.Visible=player:GetAttribute("SpareRoomCanPreviewChristmas")==true end
player:GetAttributeChangedSignal("SpareRoomCanPreviewChristmas"):Connect(refresh)refresh()
