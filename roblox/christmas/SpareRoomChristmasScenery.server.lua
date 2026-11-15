local RS=game:GetService("ReplicatedStorage")
if not require(RS:WaitForChild("SpareRoomChristmasBootstrap")).active()then return end
local isRun=require(RS.SpareRoomPlaceLayout).configure()
local world=workspace:WaitForChild("SpareRoomWorld")
if world:FindFirstChild("ChristmasSnowScenery")then return end
local folder=Instance.new("Folder")folder.Name="ChristmasSnowScenery"folder.Parent=world
local function part(name,size,frame,color,material)
 local p=Instance.new("Part")p.Name=name p.Size=size p.CFrame=frame p.Color=color p.Material=material or Enum.Material.SmoothPlastic
 p.Anchored=true p.CanCollide=false p.CanTouch=false p.CanQuery=false p.Parent=folder return p
end
local params=RaycastParams.new()params.FilterType=Enum.RaycastFilterType.Exclude params.FilterDescendantsInstances={folder}params.RespectCanCollide=true
local candidates={}
for _,p in world:GetDescendants()do
 if p:IsA("Part")and p.Shape==Enum.PartType.Block and p.CanCollide and p.Position.Y>=-.5
  and p.Size.X*p.Size.Z>=18 and p.Size.Y<8 and p.CFrame.UpVector.Y>.98
  and not p:IsDescendantOf(world.Interactables)then table.insert(candidates,p)end
end
table.sort(candidates,function(a,b)return a.Size.X*a.Size.Z>b.Size.X*b.Size.Z end)
local count=0 local decorated=0
for i,p in candidates do
 local top=p.Position+Vector3.new(0,p.Size.Y/2+.03,0)
 if not workspace:Raycast(top,Vector3.new(0,100,0),params)then
  local cap=part("OutdoorSnowCover",Vector3.new(p.Size.X,.12,p.Size.Z),p.CFrame*CFrame.new(0,p.Size.Y/2+.07,0),Color3.fromRGB(192,204,199),Enum.Material.Snow)
  count+=1
  if p.Position.Y>7 and p.Size.X>=12 and decorated<34 then
   decorated+=1
   local n=math.min(8,math.floor(p.Size.X/3))
   for j=0,n do local cf=p.CFrame*CFrame.new(-p.Size.X/2+j*p.Size.X/n,p.Size.Y/2-.3,p.Size.Z/2+.08)
    part("EvergreenEaves",Vector3.new(p.Size.X/n,.24,.3),cf,Color3.fromRGB(32,65,45),Enum.Material.Grass)
    part("WarmFestiveBulb",Vector3.new(.13,.13,.13),cf*CFrame.new(0,-.22,0),Color3.fromRGB(239,195,120),Enum.Material.Neon)
   end
  end
 end
 if count>=260 then break end if i%75==0 then task.wait()end
end
local centers=isRun and {Vector3.new(-19,0,30),Vector3.new(19,0,30),Vector3.new(-48,0,-42),Vector3.new(48,0,-42)}or {Vector3.new(416,0,18),Vector3.new(450,0,18)}
for _,point in centers do
 local hit=workspace:Raycast(point+Vector3.new(0,15,0),Vector3.new(0,-25,0),params)
 if hit and hit.Normal.Y>.9 then local base=hit.Position
  part("PineTrunk",Vector3.new(.6,1.8,.6),CFrame.new(base+Vector3.new(0,.9,0)),Color3.fromRGB(66,49,36),Enum.Material.Wood)
  for level=1,3 do local width=6-level local p=part("FestivePine",Vector3.new(width,2.5,width),CFrame.new(base+Vector3.new(0,1.3+level*1.3,0)),Color3.fromRGB(29,59,42),Enum.Material.Grass)p.Shape=Enum.PartType.Ball
   for side=0,3 do local a=side*math.pi/2 local bulb=part("PineLight",Vector3.new(.18,.18,.18),CFrame.new(base+Vector3.new(math.cos(a)*width*.48,1.3+level*1.3,math.sin(a)*width*.48)),Color3.fromRGB(224,177,98),Enum.Material.Neon)bulb.Shape=Enum.PartType.Ball end
  end
  part("PineStar",Vector3.new(.5,.5,.5),CFrame.new(base+Vector3.new(0,6.4,0))*CFrame.Angles(0,0,math.pi/4),Color3.fromRGB(238,197,119),Enum.Material.Neon)
  for j=1,3 do local cf=CFrame.new(base+Vector3.new(j-2,.4,2.5));part("ChristmasParcel",Vector3.new(.85,.7,.85),cf,Color3.fromRGB(85+j*14,40,37),Enum.Material.Fabric)part("ParcelRibbon",Vector3.new(.12,.72,.88),cf,Color3.fromRGB(189,164,107))end
 end
end
folder:SetAttribute("SnowSurfaceCount",count)folder:SetAttribute("DecoratedBuildings",decorated)
