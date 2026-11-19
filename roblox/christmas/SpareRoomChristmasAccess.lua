local A={OwnerUserId=11080546757}
function A.canRequest(userId,placeId)
 return userId==A.OwnerUserId and placeId==121199873496043
end
function A.canEnter(userId,privateId,privateOwnerId,sourcePlaceId,sourceGameId,gameId,data)
 return userId==A.OwnerUserId and privateId~="" and privateOwnerId==0
  and sourcePlaceId==121199873496043 and sourceGameId==gameId
  and type(data)=="table" and data.schema==1 and data.christmasWeek1Preview==true
  and data.previewOwnerUserId==A.OwnerUserId and data.mode=="Easy"
  and type(data.runId)=="string" and #data.runId<=64
  and type(data.members)=="table" and #data.members==1 and data.members[1]==A.OwnerUserId
end
return A
