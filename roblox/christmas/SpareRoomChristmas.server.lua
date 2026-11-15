local RS=game:GetService("ReplicatedStorage")
local B=require(RS.SpareRoomChristmasBootstrap)if not B.active()then return end
local C=require(RS.SpareRoomConfig)B.apply(C)
local run=require(RS.SpareRoomPlaceLayout).configure()
local world=workspace:WaitForChild("SpareRoomWorld")
local data=game:GetService("HttpService"):JSONDecode("{\"launchUTC\":\"2026-12-11T20:00:00Z\",\"githubVersion\":\"3.5.0\",\"githubTag\":\"v.3.5.0\",\"robloxVersion\":\"3.7.0\",\"robloxCurrentVersion\":\"3.5.0\",\"sanityMultiplier\":0.55,\"secrets\":[{\"id\":\"ribbon\",\"name\":\"The fifth ribbon\",\"text\":\"Four names on the parcels. A fifth ribbon is already tied.\"},{\"id\":\"timetable\",\"name\":\"The Christmas timetable\",\"text\":\"The last service is listed for tomorrow. Its destination has been rubbed away.\"},{\"id\":\"card\",\"name\":\"A place at the table\",\"text\":\"Leave a place for whoever comes home. The card has no signature.\"},{\"id\":\"footprints\",\"name\":\"Soot in the snow\",\"text\":\"Heavy boots lead from the chimney to the bus stop. There are no footprints back.\"},{\"id\":\"bell\",\"name\":\"The silent bell\",\"text\":\"The bell has no clapper. You hear it only after you put it down.\"},{\"id\":\"stocking\",\"name\":\"The empty stocking\",\"text\":\"Your old stocking is warm. Something inside it remembers your name.\"}],\"endings\":[{\"id\":\"christmas:place\",\"title\":\"A Place for Christmas\",\"requires\":[\"ribbon\",\"card\"],\"text\":\"You set the fifth place without choosing a name. Mother brings another cup. Outside, the bus waits until the kitchen window lights up.\"},{\"id\":\"christmas:silent\",\"title\":\"A Silent Night in Ashfield\",\"requires\":[\"bell\",\"stocking\",\"footprints\"],\"text\":\"You leave the silent bell beneath the chimney. The footsteps stop above the spare room. For one night, every bedroom stays its proper size.\"},{\"id\":\"christmas:lastgift\",\"title\":\"The Last Gift Home\",\"requires\":[\"ribbon\",\"timetable\",\"card\",\"footprints\",\"bell\",\"stocking\"],\"text\":\"You return the parcel to the empty seat. Its ribbon loosens by itself. At the next stop, someone turns on a light in a room nobody remembers building.\"}],\"classes\":[{\"id\":\"Lamplighter\",\"name\":\"Lamplighter\",\"cost\":350,\"drain\":0.85,\"stamina\":1,\"recovery\":1,\"food\":0,\"description\":\"Christmas class. Keeps memories steady: 15% less sanity loss.\"},{\"id\":\"WinterCourier\",\"name\":\"Winter Courier\",\"cost\":550,\"drain\":1,\"stamina\":0.8,\"recovery\":1.1,\"food\":0,\"description\":\"Christmas class. 20% lower sprint cost and 10% faster recovery.\"},{\"id\":\"Hearthkeeper\",\"name\":\"Hearthkeeper\",\"cost\":700,\"drain\":0.95,\"stamina\":1,\"recovery\":1,\"food\":5,\"description\":\"Christmas class. Sandwiches restore 5 extra sanity; 5% less sanity loss.\"}],\"anomalies\":[{\"base\":\"watcher\",\"title\":\"The Red Coat Waiting\",\"text\":\"A tall shape in a faded red coat waits by the last bus. The hat moves, though there is no wind.\"},{\"base\":\"footprints\",\"title\":\"Soot on the Snow\",\"text\":\"Heavy bootprints cross the untouched snow. They end beneath a chimney with no fireplace.\"},{\"base\":\"knocks\",\"title\":\"The Wrong Chimney\",\"text\":\"Three knocks above the ceiling. A soft bell answers from the spare room.\"}]}")
local function part(parent,name,size,point,color,material)
 local p=Instance.new("Part")p.Name=name p.Size=size p.Position=point p.Color=color p.Material=material or Enum.Material.Fabric
 p.Anchored=true p.CanCollide=false p.CanTouch=false p.Parent=parent return p
end
if run then
 local positions={Vector3.new(-18,2,5),Vector3.new(18,2,6),Vector3.new(-18,2,-5),Vector3.new(18,2,-4),Vector3.new(-14,15,-5),Vector3.new(14,15,5)}
 for i,secret in data.secrets do
  local p=part(world.Interactables,"ChristmasSecret_"..secret.id,Vector3.new(1.1,.2,1),positions[i],Color3.fromRGB(151,130,82))
  for key,value in pairs({Role="story",Flag="christmas:"..secret.id,Title=secret.name,Text=secret.text,Cost="0"})do local v=Instance.new("StringValue")v.Name=key v.Value=value v.Parent=p end
 end
 for i,e in data.endings do
  local p=part(world.Interactables,"ChristmasEnding_"..i,Vector3.new(1,.25,1),Vector3.new(-6+i*3,2,11),Color3.fromRGB(91,113,75))
  for key,value in pairs({Role="ending",Ending=e.id,Title=e.title})do local v=Instance.new("StringValue")v.Name=key v.Value=value v.Parent=p end
 end
else
 local depot=world:WaitForChild("LastBusDepot")local folder=Instance.new("Folder")folder.Name="ChristmasWeekOne"folder.Parent=depot
 for i=0,12 do
  part(folder,"Garland",Vector3.new(2,.4,.5),Vector3.new(422+i*1.85,9.2,21.7),Color3.fromRGB(38,65,42),Enum.Material.Grass)
  if i%2==0 then part(folder,"WarmChristmasBulb",Vector3.new(.14,.14,.14),Vector3.new(422+i*1.85,8.9,21.9),Color3.fromRGB(205,163,90),Enum.Material.Neon)end
 end
 for _,p in depot:GetDescendants()do if p:IsA("BasePart")and(p.Name=="SlateRoof"or p.Name=="ShelterRoof")then
  local cap=part(folder,"RoofSnow",Vector3.new(p.Size.X,.15,p.Size.Z),p.Position+Vector3.new(0,p.Size.Y/2+.09,0),Color3.fromRGB(164,181,171),Enum.Material.Snow)cap.CanQuery=false
 end end
 for i,secret in data.secrets do
  local parcel=part(folder,"UnclaimedParcel",Vector3.new(1.3,.9,1),Vector3.new(442,.7,7+i*1.7),Color3.fromRGB(80,58+i*3,45))
  local prompt=Instance.new("ProximityPrompt")prompt.ActionText="Inspect"prompt.ObjectText=secret.name prompt.MaxActivationDistance=7 prompt.HoldDuration=.5 prompt.Parent=parcel
  prompt.Triggered:Connect(function(player)local root=player.Character and player.Character:FindFirstChild("HumanoidRootPart")if root and(root.Position-parcel.Position).Magnitude<10 then RS.SpareRoomEvent:FireClient(player,"Caption",secret.text)end end)
 end
end

