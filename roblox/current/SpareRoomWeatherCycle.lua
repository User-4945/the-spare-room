local RS=game:GetService("ReplicatedStorage")
local Run=game:GetService("RunService")
require(RS.SpareRoomPlaceLayout).configure()
local W=require(RS.SpareRoomWeather)
local rng=Random.new()
local current="Rain"local nextChange=0 local tick=0
local function apply(name)
 current=name local p=W.profile(name)
 workspace:SetAttribute("SpareRoomWeather",name)
 workspace:SetAttribute("SpareRoomWeatherRain",p.rain)
 workspace:SetAttribute("SpareRoomWeatherWind",p.wind)
 local duration=rng:NextInteger(100,170)
 workspace:SetAttribute("SpareRoomWeatherEndsAt",workspace:GetServerTimeNow()+duration)
 nextChange=os.clock()+duration
end
apply("Rain")
Run.Heartbeat:Connect(function(dt)
 tick+=dt if tick<1 then return end tick=0
 local override=workspace:GetAttribute("SpareRoomAdminWeather")or(Run:IsStudio()and workspace:GetAttribute("SpareRoomWeatherTest")or nil)
 if override and W.Profiles[override]then if current~=override then apply(override)end
 elseif os.clock()>=nextChange then
  local choices={"Rain","Rain","Mist","Wind","Clear","Storm"}
  if workspace:GetAttribute("SpareRoomChristmasActive")then choices={"Snow","Snow","Snowstorm","Mist","Clear"}end
local nextName=choices[rng:NextInteger(1,#choices)]
  if nextName==current then nextName=current=="Rain"and "Mist"or "Rain"end
  apply(nextName)
 end
end)