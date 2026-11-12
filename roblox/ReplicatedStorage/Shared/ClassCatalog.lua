-- Starter classes: proposed Roblox avatar archetypes, not a replacement for canonical PC characters.
local Classes = {
 {id="investigator",name="Investigator",description="Notice subtle environmental changes.",cost=0,walkSpeed=16,ability="Clue Focus",avatarDescription="Trench coat, flashlight and field notebook"},
 {id="survivor",name="Survivor",description="Manage stamina during long explorations.",cost=250,walkSpeed=16,ability="Second Wind",avatarDescription="Backpack and practical outdoor clothing"},
 {id="technician",name="Technician",description="Restore malfunctioning equipment.",cost=350,walkSpeed=16,ability="Quick Repair",avatarDescription="Utility vest, tool pouch and headphones"},
 {id="observer",name="Observer",description="Find clues that others overlook.",cost=500,walkSpeed=16,ability="Unseen Detail",avatarDescription="Dark jacket and paranormal field gear"},
}
local byId={}
for _,entry in ipairs(Classes) do
 assert(not byId[entry.id],"Duplicate class id")
 byId[entry.id]=entry
end
return {all=Classes,byId=byId}
