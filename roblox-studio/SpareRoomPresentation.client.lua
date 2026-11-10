-- Local viewport presentations. Approximate planar reflection, not ray-traced rendering.
local Players=game:GetService("Players")
local RS=game:GetService("ReplicatedStorage")
local RunService=game:GetService("RunService")
local player=Players.LocalPlayer
local world=workspace:WaitForChild("SpareRoomWorld")
local remote=RS:WaitForChild("SpareRoomEvent")
local mirror=world:WaitForChild("Interactables"):WaitForChild("Mirror")
local surface=Instance.new("SurfaceGui") surface.Name="RoomReflection" surface.Face=Enum.NormalId.Left
surface.SizingMode=Enum.SurfaceGuiSizingMode.PixelsPerStud surface.PixelsPerStud=90
surface.AlwaysOnTop=false surface.Parent=mirror
local function viewport(parent)
 local view=Instance.new("ViewportFrame") view.Name="MemoryViewport" view.Size=UDim2.fromScale(1,1)
 view.BackgroundColor3=Color3.fromRGB(16,24,22) view.BorderSizePixel=0
 view.Ambient=Color3.fromRGB(115,125,112) view.LightColor=Color3.fromRGB(220,216,180)
 view.LightDirection=Vector3.new(-1,-1,-.5) view.Active=false view.Parent=parent
 local scene=Instance.new("WorldModel") scene.Parent=view
 local camera=Instance.new("Camera") camera.FieldOfView=55 camera.Parent=view view.CurrentCamera=camera
 return view,scene,camera
end
local reflected,reflectionScene,reflectionCamera=viewport(surface)
local function copyPart(part,parent)
 if not part.Archivable then return end
 local clone=part:Clone()
 if not clone then return end
 for _,desc in ipairs(clone:GetDescendants()) do
  if desc:IsA("LuaSourceContainer") or desc:IsA("JointInstance") or desc:IsA("Constraint") or desc:IsA("SurfaceGui") or desc:IsA("ProximityPrompt") then desc:Destroy() end
 end
 clone.Anchored=true clone.CanCollide=false clone.CanTouch=false clone.CanQuery=false clone.Parent=parent
 return clone
end
local function inside(part)
 local p=part.Position
 return p.X>=-24 and p.X<22.9 and p.Z>=-16 and p.Z<=24 and p.Y>=-.5 and p.Y<=12.5
end
local function captureActors(scene)
 local npc=workspace:FindFirstChild("SpareRoomNPCs")
 if npc then for _,part in ipairs(npc:GetDescendants()) do if part:IsA("BasePart") and part.Transparency<1 and inside(part) then copyPart(part,scene) end end end
 if player.Character then for _,part in ipairs(player.Character:GetDescendants()) do if part:IsA("BasePart") and part.Transparency<1 and inside(part) then copyPart(part,scene) end end end
end
local function capture(scene,includeActors)
 scene:ClearAllChildren()
 for _,part in ipairs(world:GetDescendants()) do
  if part:IsA("BasePart") and part~=mirror and part.Transparency<1 and inside(part) then copyPart(part,scene) end
 end
 if includeActors then captureActors(scene) end
end
local movie,filmScene,filmCamera,movieParent,paper,paperSize,filmStart,mother
local function stopFilm()
 if movie then movie:Destroy() movie=nil end
 if paper and paper.Parent and paperSize then paper.Size=paperSize end
 mother=nil filmScene=nil filmCamera=nil
end
local function startFilm()
 stopFilm()
 local hud=player.PlayerGui:FindFirstChild("SpareRoomHUD")
 local canvas=hud and hud:FindFirstChild("ResponsiveCanvas")
 movieParent=canvas and canvas:FindFirstChild("Reading")
 if not movieParent then return end
 movie,filmScene,filmCamera=viewport(movieParent)
 movie.Position=UDim2.fromScale(.53,.22) movie.Size=UDim2.fromScale(.41,.46) movie.ZIndex=22
 paper=movieParent:FindFirstChildOfClass("ScrollingFrame")
 if paper then paperSize=paper.Size paper.Size=UDim2.fromScale(.43,.48) end
 capture(filmScene,false)
 local npcs=workspace:FindFirstChild("SpareRoomNPCs") local original=npcs and npcs:FindFirstChild("Mum")
 if original then
  mother=Instance.new("Model") mother.Name="RecordedMum" mother.Parent=filmScene
  for _,part in ipairs(original:GetDescendants()) do if part:IsA("BasePart") and part.Transparency<1 then copyPart(part,mother) end end
 end
 filmCamera.CFrame=CFrame.lookAt(Vector3.new(-20,6,-12),Vector3.new(-8,4,-5)) filmStart=os.clock()
end
remote.OnClientEvent:Connect(function(action,data)
 if action=="Read" then if data.scene=="projector" then task.defer(startFilm) else stopFilm() end
 elseif action=="Ending" or action=="Revived" then stopFilm() end
end)
local refresh=0
local mirrorWasVisible=false
local reflectionActors
RunService.RenderStepped:Connect(function(dt)
 local camera=workspace.CurrentCamera
 if camera then
  local distance=(camera.CFrame.Position-mirror.Position).Magnitude
  surface.Enabled=distance<24 and camera.CFrame.Position.X<mirror.Position.X
  if surface.Enabled then
   if not mirrorWasVisible then
    capture(reflectionScene,false)
    reflectionActors=Instance.new("Model") reflectionActors.Name="ReflectedActors" reflectionActors.Parent=reflectionScene
    refresh=0
   end
   refresh-=dt
   if refresh<=0 and reflectionActors then reflectionActors:ClearAllChildren() captureActors(reflectionActors) refresh=.3 end
   local p=camera.CFrame.Position local eye=Vector3.new(2*mirror.Position.X-p.X,p.Y,p.Z)
   reflectionCamera.CFrame=CFrame.lookAt(eye,mirror.Position)
   reflectionCamera.FieldOfView=math.clamp(math.deg(2*math.atan(mirror.Size.Y/(2*math.max(2,distance)))),15,80)
  end
  mirrorWasVisible=surface.Enabled
 end
 if movie then
  if not movieParent or not movieParent.Visible then stopFilm() return end
  local t=math.min(9,os.clock()-filmStart)
  if mother then
   local start=Vector3.new(-14,0,-2)
   local point=start:Lerp(Vector3.new(-6,0,-6),math.clamp((t-1)/7,0,1))
   mother:PivotTo(CFrame.new(point+Vector3.new(0,3,0))*CFrame.Angles(0,-math.pi/2,0))
  end
  filmCamera.CFrame=CFrame.lookAt(Vector3.new(-20,6,-12),Vector3.new(-8,4,-5))
  movie.ImageColor3=t>=8.5 and Color3.fromRGB(15,18,16) or Color3.fromRGB(180,173,137)
 end
end)
