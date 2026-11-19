local RS=game:GetService("ReplicatedStorage")local Run=game:GetService("RunService")
local cfg=require(RS:WaitForChild("SpareRoomChristmasConfig"))
local B={}
local ownerPreview=nil local resolving=false
local function privatePreview()
 if Run:IsClient()then
  if game.PrivateServerId==""then return false end
  local deadline=os.clock()+20
  while workspace:GetAttribute("SpareRoomPreviewResolved")==nil and os.clock()<deadline do task.wait(.1)end
  return workspace:GetAttribute("SpareRoomOwnerChristmasPreview")==true
 end
 if ownerPreview~=nil then return ownerPreview end
 if resolving then while ownerPreview==nil do task.wait()end return ownerPreview end
 if game.PrivateServerId=="" or game.PrivateServerOwnerId~=0 then ownerPreview=false return false end
 resolving=true
 local Players=game:GetService("Players")local Access=require(RS:WaitForChild("SpareRoomChristmasAccess"))
 local deadline=os.clock()+20 local player=Players:GetPlayers()[1]
 while not player and os.clock()<deadline do task.wait(.1)player=Players:GetPlayers()[1]end
 local allowed=false
 if player then
  local join=player:GetJoinData()
  allowed=Access.canEnter(player.UserId,game.PrivateServerId,game.PrivateServerOwnerId,join.SourcePlaceId,join.SourceGameId,game.GameId,join.TeleportData)
 end
 ownerPreview=allowed
 workspace:SetAttribute("SpareRoomOwnerChristmasPreview",ownerPreview)
 workspace:SetAttribute("SpareRoomPreviewResolved",true)
 if ownerPreview then
  local function guard(p)if p.UserId~=Access.OwnerUserId then p:Kick("This preview is private.")end end
  Players.PlayerAdded:Connect(guard)for _,p in Players:GetPlayers()do guard(p)end
 end
 return ownerPreview
end
function B.active()
 return (cfg.Enabled and(os.time()>=1797019200 or(Run:IsStudio()and cfg.StudioPreview==true)))or privatePreview()
end
function B.apply(C)
 if not B.active()or C.ChristmasApplied then return end C.ChristmasApplied=true
 local D=game:GetService("HttpService"):JSONDecode("{\"launchUTC\":\"2026-12-11T20:00:00Z\",\"githubVersion\":\"3.5.0\",\"githubTag\":\"v.3.5.0\",\"robloxVersion\":\"3.7.0\",\"robloxCurrentVersion\":\"3.5.0\",\"sanityMultiplier\":0.55,\"secrets\":[{\"id\":\"ribbon\",\"name\":\"The fifth ribbon\",\"text\":\"Four names on the parcels. A fifth ribbon is already tied.\"},{\"id\":\"timetable\",\"name\":\"The Christmas timetable\",\"text\":\"The last service is listed for tomorrow. Its destination has been rubbed away.\"},{\"id\":\"card\",\"name\":\"A place at the table\",\"text\":\"Leave a place for whoever comes home. The card has no signature.\"},{\"id\":\"footprints\",\"name\":\"Soot in the snow\",\"text\":\"Heavy boots lead from the chimney to the bus stop. There are no footprints back.\"},{\"id\":\"bell\",\"name\":\"The silent bell\",\"text\":\"The bell has no clapper. You hear it only after you put it down.\"},{\"id\":\"stocking\",\"name\":\"The empty stocking\",\"text\":\"Your old stocking is warm. Something inside it remembers your name.\"}],\"endings\":[{\"id\":\"christmas:place\",\"title\":\"A Place for Christmas\",\"requires\":[\"ribbon\",\"card\"],\"text\":\"You set the fifth place without choosing a name. Mother brings another cup. Outside, the bus waits until the kitchen window lights up.\"},{\"id\":\"christmas:silent\",\"title\":\"A Silent Night in Ashfield\",\"requires\":[\"bell\",\"stocking\",\"footprints\"],\"text\":\"You leave the silent bell beneath the chimney. The footsteps stop above the spare room. For one night, every bedroom stays its proper size.\"},{\"id\":\"christmas:lastgift\",\"title\":\"The Last Gift Home\",\"requires\":[\"ribbon\",\"timetable\",\"card\",\"footprints\",\"bell\",\"stocking\"],\"text\":\"You return the parcel to the empty seat. Its ribbon loosens by itself. At the next stop, someone turns on a light in a room nobody remembers building.\"}],\"classes\":[{\"id\":\"Lamplighter\",\"name\":\"Lamplighter\",\"cost\":350,\"drain\":0.85,\"stamina\":1,\"recovery\":1,\"food\":0,\"description\":\"Christmas class. Keeps memories steady: 15% less sanity loss.\"},{\"id\":\"WinterCourier\",\"name\":\"Winter Courier\",\"cost\":550,\"drain\":1,\"stamina\":0.8,\"recovery\":1.1,\"food\":0,\"description\":\"Christmas class. 20% lower sprint cost and 10% faster recovery.\"},{\"id\":\"Hearthkeeper\",\"name\":\"Hearthkeeper\",\"cost\":700,\"drain\":0.95,\"stamina\":1,\"recovery\":1,\"food\":5,\"description\":\"Christmas class. Sandwiches restore 5 extra sanity; 5% less sanity loss.\"}],\"anomalies\":[{\"base\":\"watcher\",\"title\":\"The Red Coat Waiting\",\"text\":\"A tall shape in a faded red coat waits by the last bus. The hat moves, though there is no wind.\"},{\"base\":\"footprints\",\"title\":\"Soot on the Snow\",\"text\":\"Heavy bootprints cross the untouched snow. They end beneath a chimney with no fireplace.\"},{\"base\":\"knocks\",\"title\":\"The Wrong Chimney\",\"text\":\"Three knocks above the ceiling. A soft bell answers from the spare room.\"}]}")
 C.Version=D.robloxVersion C.Release={version=D.robloxVersion,channel="stable",message="Christmas Week 1 — Ashfield"}
 for _,e in D.endings do local flags={}for _,id in e.requires do table.insert(flags,"christmas:"..id)end C.Endings[e.id]={title=e.title,text=e.text,flags=flags}end
 for _,class in D.classes do class.damage=1 C.Classes[class.id]=class table.insert(C.ClassOrder,class.id)end
 local names={watcher=D.anomalies[1],pages=D.anomalies[2],door=D.anomalies[3]}
 for _,a in C.Anomalies do if names[a.id]then a.title=names[a.id].title a.text=names[a.id].text end end
 if Run:IsServer()then
  workspace:SetAttribute("SpareRoomChristmasActive",true)
  local W=require(RS.SpareRoomWeather)local effects=W.effects
  W.effects=function(name,sheltered,night)local e=effects(name,sheltered,night)e.drain*=D.sanityMultiplier return e end
  W.Profiles.Snow={rain=0,wind=.2,light=.9,density=.42,drain=1.05,pacing=1}
  W.Profiles.Snowstorm={rain=0,wind=.7,light=.76,density=.52,drain=1.15,pacing=.9}
 end
end
return B

