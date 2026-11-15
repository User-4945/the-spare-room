local E={OwnerUserId=11080546757}
local weather={Auto=true,Clear=true,Rain=true,Storm=true,Mist=true,Wind=true,Snow=true,Snowstorm=true}
function E.valid(command,value)
 if command=="Weather"then return type(value)=="string"and weather[value]==true end
 if command=="Fog"then return type(value)=="number"and value==value and value>=0 and value<=.8 end
 if command=="Clock"then return type(value)=="number"and value==value and value>=0 and value<24 end
 return command=="AtmosphereReset"
end
function E.apply(userId,command,value)
 if userId~=E.OwnerUserId or not E.valid(command,value)then return false,"Owner environment command rejected."end
 if command=="Weather"then workspace:SetAttribute("SpareRoomAdminWeather",value~="Auto"and value or nil)
 elseif command=="Fog"then workspace:SetAttribute("SpareRoomAdminFog",value)
 elseif command=="Clock"then workspace:SetAttribute("SpareRoomAdminHour",value)
 else for _,key in ipairs({"SpareRoomAdminWeather","SpareRoomAdminFog","SpareRoomAdminHour"})do workspace:SetAttribute(key,nil)end end
 return true,command=="AtmosphereReset"and "Automatic weather, fog and day cycle restored."or command.." updated for this server."
end
return E
