-- Waiting areas form departure groups; gameplay remains in this shared prototype world.
local Lobby={}
function Lobby.new(deps)
 local self={queues={},membership={},clock=0,serial=0}
 function self:send(p)
  local mode=self.membership[p] local q=mode and self.queues[mode]
  deps.send(p,{mode=mode,members=q and #q.players or 0,seconds=q and math.max(0,math.ceil(q.deadline-self.clock)) or 0})
 end
 function self:leave(p)
  local mode=self.membership[p] self.membership[p]=nil
  local q=mode and self.queues[mode]
  if q then
   for i=#q.players,1,-1 do if q.players[i]==p then table.remove(q.players,i) end end
   if #q.players==0 then self.queues[mode]=nil else for _,other in ipairs(q.players) do self:send(other) end end
  end
  self:send(p)
 end
 function self:join(p,mode)
  if not deps.modes[mode] or not deps.available(p) then return end
  if self.membership[p]==mode then self:send(p) return end
  local q=self.queues[mode]
  if q and #q.players>=4 then deps.status(p,"That bus is full. Try another difficulty or depart solo.") return end
  self:leave(p)
  q=self.queues[mode] or {players={},deadline=self.clock+15}
  self.queues[mode]=q table.insert(q.players,p) self.membership[p]=mode
  deps.move(p,mode)
  for _,other in ipairs(q.players) do self:send(other) end
 end
 function self:step(dt)
  self.clock+=dt
  local departures={}
  for mode,q in pairs(self.queues) do
   if self.clock>=q.deadline then table.insert(departures,{mode=mode,players=q.players})
   else for _,p in ipairs(q.players) do self:send(p) end end
  end
  for _,group in ipairs(departures) do
   self.queues[group.mode]=nil self.serial+=1
   for _,p in ipairs(group.players) do
    self.membership[p]=nil self:send(p)
    if deps.available(p) then deps.start(p,group.mode,self.serial) end
   end
  end
 end
 return self
end
return Lobby
