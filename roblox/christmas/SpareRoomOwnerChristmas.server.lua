local Players=game:GetService("Players")local RS=game:GetService("ReplicatedStorage")
local Teleport=game:GetService("TeleportService")local Run=game:GetService("RunService")
local Access=require(RS:WaitForChild("SpareRoomChristmasAccess"))
local remote=Instance.new("RemoteEvent")remote.Name="SpareRoomOwnerChristmas"remote.Parent=RS
local pending={}local last={}
local function can(player)return Access.canRequest(player.UserId,game.PlaceId)end
local function joined(player)player:SetAttribute("SpareRoomCanPreviewChristmas",can(player))end
Players.PlayerAdded:Connect(joined)for _,p in Players:GetPlayers()do joined(p)end
remote.OnServerEvent:Connect(function(player)
 if not can(player)or pending[player]or os.clock()-(last[player]or -30)<10 then return end
 last[player]=os.clock()
 if Run:IsStudio()then remote:FireClient(player,"Studio cannot teleport. Use this option in the published lobby.")return end
 pending[player]=true remote:FireClient(player,"Preparing your private Christmas run...")
 local options=Instance.new("TeleportOptions")options.ShouldReserveServer=true
 options:SetTeleportData({schema=1,runId=game:GetService("HttpService"):GenerateGUID(false),mode="Easy",members={player.UserId},christmasWeek1Preview=true,previewOwnerUserId=Access.OwnerUserId})
 local ok=pcall(function()Teleport:TeleportAsync(123323409173400,{player},options)end)
 if not ok then pending[player]=nil remote:FireClient(player,"Could not start the preview. Please try again.")end
end)
Teleport.TeleportInitFailed:Connect(function(player,_,_,placeId)
 if placeId==123323409173400 and pending[player]then pending[player]=nil remote:FireClient(player,"Teleport failed. Please try again.")end
end)
Players.PlayerRemoving:Connect(function(p)pending[p]=nil last[p]=nil end)
