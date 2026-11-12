-- Server-authoritative preference storage. Enable Studio API access for DataStore tests.
local Players=game:GetService("Players")
local DataStoreService=game:GetService("DataStoreService")
local ReplicatedStorage=game:GetService("ReplicatedStorage")
local Preferences=require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("UpdatePreferences"))
local store=DataStoreService:GetDataStore("SpareRoomPlayerSettings_v1")
local remote=ReplicatedStorage:FindFirstChild("UpdatePreferenceChanged")
if not remote then
 remote=Instance.new("RemoteEvent")
 remote.Name="UpdatePreferenceChanged"
 remote.Parent=ReplicatedStorage
end
local current={}
local function key(player) return "player_"..player.UserId end
Players.PlayerAdded:Connect(function(player)
 local ok,data=pcall(function() return store:GetAsync(key(player)) end)
 current[player.UserId]=Preferences.normalize(ok and data or nil)
 player:SetAttribute("UpdatePreference",current[player.UserId])
end)
remote.OnServerEvent:Connect(function(player,choice)
 if type(choice)~="string" or Preferences.normalize(choice)~=choice then return end
 current[player.UserId]=choice
 player:SetAttribute("UpdatePreference",choice)
 local ok,err=pcall(function() store:SetAsync(key(player),choice) end)
 if not ok then warn("Could not persist update preference:",err) end
end)
Players.PlayerRemoving:Connect(function(player)
 local choice=current[player.UserId]
 if choice then
  local ok,err=pcall(function() store:SetAsync(key(player),choice) end)
  if not ok then warn("Could not persist update preference:",err) end
 end
 current[player.UserId]=nil
end)
