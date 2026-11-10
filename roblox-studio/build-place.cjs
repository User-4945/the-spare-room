const fs=require("node:fs"),path=require("node:path");
const buildPlace=function buildRobloxPlace(sources) {
 let ref=0, count=0, interactables=0;
 const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
 const id=()=>`RBX${++ref}`;
 const str=(n,v)=>`<string name="${n}">${esc(v)}</string>`;
 const num=(n,v)=>`<float name="${n}">${v}</float>`;
 const bool=(n,v)=>`<bool name="${n}">${v?"true":"false"}</bool>`;
 function item(cls,name,properties="",children=""){return `<Item class="${cls}" referent="${id()}"><Properties>${str("Name",name)}${properties}</Properties>${children}</Item>`;}
 function val(name,v){return item("StringValue",name,str("Value",v));}
 function part(name,x,y,z,w,h,d,color=[100,105,94],material="WoodPlanks",meta={},solid=true,transparency=0){
  count++;
  let children=val("MaterialName",material);
  const materials={WoodPlanks:528,Wood:512,Concrete:816,Grass:1280,Slate:800,Metal:1088,Glass:1568,Fabric:1312,Marble:784,Brick:848,SmoothPlastic:272,Neon:288};
  for(const [n,v]of Object.entries(meta))children+=val(n,v);
  if(meta.Role)interactables++;
  const cframe=`<CoordinateFrame name="CFrame"><X>${x}</X><Y>${y}</Y><Z>${z}</Z><R00>1</R00><R01>0</R01><R02>0</R02><R10>0</R10><R11>1</R11><R12>0</R12><R20>0</R20><R21>0</R21><R22>1</R22></CoordinateFrame>`;
  const size=`<Vector3 name="size"><X>${w}</X><Y>${h}</Y><Z>${d}</Z></Vector3>`;
  return item("Part",name,cframe+size+bool("Anchored",true)+bool("CanCollide",solid)+bool("CanTouch",false)+bool("CanQuery",true)+num("Transparency",transparency)+`<token name="Material">${materials[material]||528}</token>`+`<Color3uint8 name="Color3uint8">${color[0]*65536+color[1]*256+color[2]}</Color3uint8>`+`<token name="TopSurface">0</token><token name="BottomSurface">0</token>`,children);
 }
 const world=[], interactions=[];
 const content=sources.contentData;
 const add=(...a)=>world.push(part(...a));
 const prop=(name,role,title,action,x,y,z,w,h,d,extra={},color=[205,190,150])=>{
  interactions.push(part(name,x,y,z,w,h,d,color,role==="key"?"Metal":"Wood",{Role:role,Title:title,Action:action,...extra},false,(role==="doll"||role==="mum")?1:0));
 };
 function wall(name,x,y,z,w,h,d){add(name,x,y+h/2,z,w,h,d,[106,113,103],"Concrete");}
 function desk(x,y,z,w=4,d=2){
  add("DeskTop",x,y+3.2,z,w,.25,d,[104,79,54]);
  for(const dx of [-w/2+.22,w/2-.22])for(const dz of [-d/2+.2,d/2-.2])add("DeskLeg",x+dx,y+1.6,z+dz,.22,3.1,.22,[69,55,42]);
 }
 function chair(x,y,z){
  add("ChairSeat",x,y+1.6,z,1.8,.2,1.8,[108,91,65]);
  add("ChairBack",x,y+2.6,z+.8,1.8,2,.18,[108,91,65]);
  for(const dx of [-.7,.7])for(const dz of [-.7,.7])add("ChairLeg",x+dx,y+.8,z+dz,.18,1.6,.18,[80,69,48]);
 }
 add("GardenGround",0,-.45,15,100,.5,150,[53,68,49],"Grass");
 add("HouseFloor",0,-.25,4,48,.5,40,[116,94,64]);
 add("HouseRoof",0,24.25,4,49,.5,41,[62,66,61],"Slate");
 for(const side of [-1,1]){
  for(const [a,b]of [[-16,-11],[-5,12],[18,24]])wall("ExteriorPier",side*24,0,(a+b)/2,.5,12,b-a);
  for(const z of [-8,15]){wall("WindowLowerWall",side*24,0,z,.5,3,6);wall("WindowUpperWall",side*24,8,z,.5,4,6);}
 }
 wall("BackExterior",0,0,24,48,12,.5);
 wall("FrontLeft",-13.5,0,-16,21,12,.5);wall("FrontRight",13.5,0,-16,21,12,.5);
 wall("FrontHeader",0,9,-16,6,3,.5);
 for(const side of [-1,1]){
  for(const [a,b]of [[-16,-9],[-3,11],[17,24]])wall("HallPartition",side*4,0,(a+b)/2,.4,12,b-a);
  for(const z of [-6,14]){
   wall("RoomDoorHeader",side*4,9,z,.4,3,6);
   for(const dz of [-3.2,3.2])add("RoomDoorFrame",side*4,4.5,z+dz,.65,9,.3,[173,156,123]);
  }
  wall("RoomDivider",side*14,0,4,20,12,.4);
  for(const z of [-8,15]){
   for(const dz of [-3,3])add("WindowJamb",side*23.55,5.5,z+dz,.35,5,.22,[171,165,144]);
   for(const y of [3,8])add("WindowRail",side*23.55,y,z,.35,.22,6.2,[171,165,144]);
   add("WindowGlass",side*23.35,5.5,z,.1,4.5,5.4,[82,112,118],"Glass",{},false,.35);
   add("WindowMullion",side*23.2,5.5,z,.15,4.5,.12,[190,179,150]);
  }
 }
 for(const z of [-9,5,20])add("Lamp",0,11.5,z,1,.2,1,[226,202,145],"Metal",{},false);
 add("HallRunner",0,.04,5,3.5,.08,33,[82,53,48],"Fabric",{},false);
 for(const side of [-1,1])for(const z of [-6,14])add("RoomPlaque",side*3.7,10,z,.16,1.1,5,[36,55,46],"Wood",{Sign:side<0?(z<0?"KITCHEN":"SPARE ROOM"):(z<0?"BEDROOM":"SITTING ROOM"),Side:side<0?"Right":"Left"},false);
 desk(-14,0,-6,7,4);chair(-14,0,-3);chair(-17,0,-6);chair(-11,0,-6);
 for(const x of [-21,-18,-15]){add("KitchenCabinet",x,1.6,-13.8,2.8,3.2,3,[91,105,90]);add("Countertop",x,3.35,-13.8,2.9,.2,3.2,[159,161,145],"Marble");}
 prop("Sandwich","sandwich","Kitchen sandwich","Eat sandwich",-18,3.65,-13.8,1.2,.25,.8);
 prop("DollEvidence","doll","The doll that remembers","Inspect the doll",-16,5.5,16,.3,.3,.3,{},[151,127,107]);
 prop("MumConversation","mum","Mum","Speak with Mum",-14,4.2,-1.5,.7,.7,.2,{});
 prop("OrdinaryMemory","anchor","The repaired chair","Hold an ordinary memory",-17,2.5,-5,1,.2,.7);
 prop("MorningChoice","ending","The kitchen window","Choose an ordinary morning",-21,4.6,-8,1.4,.8,.2,{Ending:"morning"});
 add("BedFrame",13,1,0,5,2,7,[96,75,55]);
 add("Mattress",13,2.15,0,4.8,.5,6.8,[160,153,125],"Fabric");
 add("Pillow",13,2.55,-2.4,3,.3,1.5,[185,178,152],"Fabric");
 add("Wardrobe",21,4,-10,4,8,3,[86,70,56]);
 prop("Mirror","mirror","The covered mirror","Uncover and inspect the mirror",23.05,5,1,.2,4.5,2.6,{});
 desk(-16,0,16,6,3);add("SpareBed",-17,1.2,8,5,2.4,5,[112,111,91],"Fabric");
 desk(15,0,17,5,3);chair(15,0,14);
 add("Sofa",19,1.5,10,7,3,3,[81,101,90],"Fabric");
 prop("HallInvitation","record","A household list","Read the household list",3.6,4,8,.12,1.4,1.6,{Index:"hall",Text:"The household list begins with four entries. Its certified copy has two. Neither is marked amended."});
 prop("MaintenanceHatch","hatch","The maintenance hatch","Descend beneath the house",0,.16,20,3,.3,3,{});
 // Permanent upper floor, with a real walkable staircase and an open stairwell.
 for(const side of [-1,1])add("UpperFloor",side*13,11.75,4,22,.5,40,[116,94,64]);
 add("UpperLanding",0,11.75,14,4,.5,20,[116,94,64]);
 add("UpperFrontFloor",0,11.75,-15,4,.5,2,[116,94,64]);
 for(let n=0;n<24;n++){
  const top=(n+1)*.5,z=-13.625+n*.75;
  add("StairTread",0,top/2,z,3.3,top,.75,[105,82,57]);
  add("StairNosing",0,top+.02,z+.3,3.35,.04,.1,[155,134,99],"Wood",{},false);
 }
 // Railings are confined to the upper floor; ground-floor side lanes stay clear.
 for(const side of [-1,1]){
  add("LandingRail",side*1.6,14.8,-5,.16,.16,18,[101,83,58]);
  for(let z=-13;z<=3;z+=2)add("LandingBaluster",side*1.6,13.4,z,.12,2.8,.12,[101,83,58]);
  wall("UpperExterior",side*24,12,4,.5,12,40);
  for(const [a,b]of [[-16,-9],[-3,11],[17,24]])wall("UpperHallPartition",side*4,12,(a+b)/2,.4,12,b-a);
  wall("UpperRoomDivider",side*14,12,4,20,12,.4);
  for(const z of [-6,14]){
   wall("UpperDoorHeader",side*4,21,z,.4,3,6);
   for(const dz of [-3.2,3.2])add("UpperDoorFrame",side*4,16.5,z+dz,.65,9,.3,[173,156,123]);
   add("UpperRoomPlaque",side*3.7,22,z,.16,1.1,5,[36,55,46],"Wood",{Sign:side<0?(z<0?"STUDY":"LOFT"):(z<0?"NURSERY":"FAMILY ROOM"),Side:side<0?"Right":"Left"},false);
  }
 }
 wall("UpperFront",0,12,-16,48,12,.5);wall("UpperBack",0,12,24,48,12,.5);
 for(const z of [-9,8,20])add("Lamp",0,23.5,z,1,.2,1,[226,202,145],"Metal",{},false);
 for(const x of [-14,14])for(const z of [-7,15])add("Lamp",x,23.5,z,1.3,.2,1.3,[226,202,145],"Metal",{},false);
 desk(-15,12,-7,7,4);chair(-15,12,-3);
 for(let level=1;level<=4;level++){
  add("StudyBookShelf",-22,12+level*1.8,-7,2.5,.15,12,[88,69,51]);
  for(let z=-12;z<=-3;z++)add("StudyBook",-22,12+level*1.8+.65,z,1.5,1.2,.6,[79+(z+12)*5,78,63]);
 }
 add("BlueprintSheet",-15,15.38,-7,4,.03,2.5,[169,183,172],"Fabric",{},false);
 for(const x of [-16.4,-15,-13.6])add("BlueprintLine",x,15.41,-7,.04,.02,2,[69,89,83],"Metal",{},false);
 const story=(name,title,action,x,y,z,flag,text,cost=2)=>prop(name,"story",title,action,x,y,z,1.1,.12,.85,{Flag:flag,Text:text,Cost:String(cost)});
 story("StudyNote","THE HOUSE WAS DRAWN","Read study note",-17.5,15.4,-7,"note_study","The blueprint is under the study lamp. Erase the spare room, not the house. One line is holding us here.");
 story("Blueprint","A line in red","Erase the red line",-15,15.46,-7,"blueprint","You follow the plan with your finger. The red line does not join any of the walls. You rub it away. A quiet settling sound travels through the house.",4);
 prop("BlueprintEnding","ending","The revised plan","Keep the revised plan",-12.5,15.4,-7,1,.12,.8,{Ending:"blueprint"});
 // Empty cot, two height scales and the stopped nursery clock.
 for(const x of [11,15]){
  add("CotBed",x,13.5,-6,2.8,.45,5,[164,151,122]);
  for(const dx of [-1.4,1.4]){
   add("CotRail",x+dx,15,-6,.12,.16,5,[164,151,122]);
   for(let z=-8;z<=-4;z++)add("CotSpindle",x+dx,14.1,z,.1,1.8,.1,[164,151,122]);
  }
 }
 desk(20,12,-10,4,2);add("NurseryClockCase",20,16.4,-10,1.4,1.8,.5,[92,75,52]);
 story("NurseryNote","SING THE LAST LINE","Read nursery note",19,15.4,-10,"note_nursery","The nursery clock stopped before the lullaby ended. Wind it. Then let the song finish.");
 story("NurseryClock","The stopped clock","Wind the nursery clock",21,15.4,-10,"clock","The spring resists, then catches. Tick. Tick. You remember a line of the lullaby that Mum has never sung.",3);
 prop("LullabyEnding","ending","An unfinished lullaby","Sing the last line",13,15,-9.5,1,.2,.8,{Ending:"lullaby"});
 for(let h=1;h<=6;h++)for(const x of [8,8.5])add("HeightMark",x,12+h,3.74,.3,.035,.04,[79,64,51],"Wood",{},false);
 desk(-15,12,17,7,3);chair(-15,12,14);
 for(const x of [-22,-19])for(const z of [8,11,20])add("LoftStorageBox",x,13.2,z,2.6,2.4,2.6,[120,102,70]);
 add("TypewriterBody",-15,15.6,17,2.8,.6,1.7,[45,50,47],"Metal");
 for(let row=0;row<3;row++)for(let key=0;key<9;key++)add("TypewriterKey",-16+key*.25,15.95,16.5+row*.25,.15,.07,.15,[177,173,145],"Metal",{},false);
 story("LoftNote","LEAVE AN ADDRESS","Read loft note",-17.8,15.4,17,"note_loft","The records are letters nobody sent. Read them beside the old typewriter. Write a forwarding address.");
 story("UnsentLetters","Letters nobody sent","Read the unsent letters",-12.5,15.4,17,"letters","The envelopes all carry the same handwriting. Each is addressed to a different child. Every return address is this house.",3);
 prop("LettersEnding","ending","An empty address","Type HOME",-15,16,17,1,.1,.6,{Ending:"letters"});
 add("FamilyBed",15,13,15,6,2,7,[96,75,55]);add("FamilyQuilt",15,14.2,15,5.8,.4,6.8,[102,113,103],"Fabric");
 desk(20,12,7,4,2);chair(20,12,10);
 story("FamilyPhotograph","The larger photograph","Inspect the family photograph",20,15.5,7,"family_photo","Mum stands beside someone whose face has been rubbed away. Two children lean into the frame. On the back: ALL OF US, BEFORE THE RENOVATION.",4);
 story("SchoolReport","A report with two names","Read the school report",21,15.5,7,"school_report","The teacher has praised two different children for the same drawing. Both signatures are yours. The year is the same.");
 story("DadCoat","A warm coat","Check the coat pockets",22,16,21,"dad_coat","A folded receipt for five train tickets. A pencil. A note in a hand you almost recognise: If they ask, leave the places set.",3);
 // Details below echo evidence on the upper floor without resolving the family history.
 for(const [i,x,z]of [[1,-21,32],[2,21,32],[3,-21,52]]){
  add("GardenBench",x,1.8,z,6,.35,2,[91,79,55]);
  story("GardenLetter"+i,"A weathered letter","Read the weathered letter",x,2.1,z,"garden_letter"+i,["The gardener was paid to keep a path clear. The path is not drawn on the plan.","Someone asked for the same flowers each year. The card says: From all the children.","Do not move the spare chair outside. He will think we are waiting for him."][i-1]);
 }
 add("BasementFloor",0,-18.25,27,56,.5,90,[78,81,73],"Concrete");
 add("BasementCeiling",0,-5.25,27,56,.5,90,[51,61,56],"Concrete");
 wall("BasementWest",-28,-18,27,.5,12.5,90);wall("BasementEast",28,-18,27,.5,12.5,90);
 wall("BasementNorth",0,-18,-18,56,12.5,.5);wall("BasementSouth",0,-18,72,56,12.5,.5);
 const rooms=["Storage Room","Boiler Room","Maintenance Tunnel","Archive Room","Forgotten Family Room","Hidden Study","Sealed Corridor","Observation Room","Former Children's Area","Locked Chamber"];
 for(let row=0;row<5;row++){
  const z=-9+row*18;
  add("Lamp",0,-6,z,1,.2,1,[202,187,140],"Metal",{},false);
  for(const side of [-1,1]){
   const index=row*2+(side>0?1:0),x=side*16;
   for(const dz of [-6,6])wall("BasementHallWall",side*4,-18,z+dz,.5,12.5,6);
   wall("BasementDoorHeader",side*4,-8,z,.5,2.5,6);
   for(const dz of [-3.15,3.15])add("BasementDoorTrim",side*4,-13,z+dz,.7,10,.25,[151,137,111]);
   if(row>0)wall("BasementRoomBoundary",x,-18,z-9,24,12.5,.5);
   add("RoomSign",side*3.7,-7.2,z,.16,1.1,5.5,[30,49,39],"Metal",{Sign:rooms[index].toUpperCase(),Side:side<0?"Right":"Left"},false);
   add("Lamp",x,-6,z,1.3,.2,.7,[192,177,131],"Metal",{},false);
   for(const offset of [-.8,.8]){
    add("CeilingPipe",x+offset,-6.5,z,.12,.12,15,[111,98,73],"Metal");
    for(const dz of [-5,0,5])add("PipeBracket",x+offset,-6.65,z+dz,.3,.4,.14,[55,68,59],"Metal");
   }
   for(let i=0;i<2;i++){
    const px=x+(i===0?-4:4),pz=z+3;
    desk(px,-18,pz,3,1.8);
    prop("Diary"+(index*2+i+1),"diary","Sibling diary · "+(index*2+i+1),"Read diary page",px,-14.5,pz,1.2,.12,.85,{Index:String(index*2+i+1)});
   }
   add("StorageShelf",side*26,-14,z,2,.2,10,[100,90,67]);
   add("StorageShelf",side*26,-11,z,2,.2,10,[100,90,67]);
   for(let i=0;i<4;i++)add("StorageBox",side*26,-13.2,z-3+i*2,1.5,1.4,1.6,[118-i*9,108-i*6,78]);
   if(index===1){
    add("BoilerTank",x,-13.5,z,4,9,3,[70,86,82],"Metal");
    for(const dx of [-1.3,0,1.3])add("BoilerPipe",x+dx,-8,z,.2,3,.2,[145,118,77],"Metal");
    add("BoilerGauge",x,-11,z-1.58,1.1,1.1,.1,[189,182,145],"SmoothPlastic");
    for(let i=0;i<4;i++)add("BoilerVent",x,-15.5+i*.5,z-1.6,2,.12,.05,[30,42,36],"Metal");
    prop("BoilerValve","valve","The isolated pipe","Isolate the knocking pipe",x+2.4,-14,z,1.2,1.2,.3,{},[150,119,69]);
   }
   if(index===3||index===5){
    for(let i=0;i<3;i++){
     add("ArchiveCabinet",x-3+i*3,-14.5,z-6,2.5,7,2,[75,88,76],"Metal");
     for(let j=0;j<5;j++)add("ArchiveDrawerHandle",x-3+i*3,-17+j*1.3,z-7.1,.7,.12,.15,[160,145,106],"Metal");
    }
   }
   if(index===4||index===9){desk(x,-18,z,4,2.5);chair(x-3,-18,z);chair(x+3,-18,z);chair(x,-18,z-3);}
   if(index===7){
    add("ObservationFrame",x,-12,z-6,8,6,.4,[106,96,73],"Metal");
    add("ObservationGlass",x,-12,z-6.3,7.4,5.4,.08,[71,97,98],"Glass",{},false,.3);
   }
   if(index===8){
    for(const dz of [-5,5]){add("ChildBed",x,-17,z+dz,6,2,3,[116,116,92],"Fabric");add("ChildPillow",x-2,-15.8,z+dz,1.4,.3,2,[179,166,133],"Fabric");}
    for(let i=0;i<4;i++)add("HeightMark",x+i*.25,-14+i*.6,z+8.65,.8,.05,.05,[170,147,105],"Wood",{},false);
    prop("ChamberKey","key","The unnumbered key","Take the unnumbered key",x,-14.4,z+3,.9,.15,.4,{},[192,158,79]);
   }
  }
 }
 // Evidence is private per player. It remains visible as a physical prop after being read.
 for(const [x,z,index,content]of [[16,9,"archive","Two household records disagree about how many children attended school. Both carry the same signature."],[-16,27,"family","A family photograph has four places at the table. A crease passes through two faces."],[16,27,"study","An unfinished letter begins Dear children. A second draft begins Dear child. Both are signed D."]]){
  desk(x,-18,z+6,3,1.8);
  prop("Record"+index,"record","Family record · "+index,"Read family record",x,-14.5,z+6,1.3,.12,.9,{Index:index,Text:content});
 }
 prop("BasementStairs","stairs","The stairs home","Return upstairs",0,-16,-15,2,1.5,1,{});
 add("ChamberDoor",4,-13,63,.5,10,6,[79,71,53],"Wood");
 prop("ChamberLock","gate","The unnumbered chamber","Unlock the chamber",3.45,-13,63,.2,1.2,1,{});
 prop("ChamberExit","exitChamber","Chamber return","Return to the passage",6,-13,63,.3,1.2,1,{});
 for(const [name,id,x,z]of [["ArchiveDecision","names",23,12],["SealDecision","seal",-23,48],["GlassDecision","glass",23,48],["TomorrowDecision","tomorrow",23,66]]){
  desk(x,-18,z,3,1.8);
  prop(name,"ending","A decision · "+id,"Consider this ending",x,-14.5,z,1.4,.15,1,{Ending:id});
 }
 // Walkable district with solid foundations, open doorways and themed venue interiors.
 add("DistrictGround",0,-.45,10,300,.5,300,[43,55,43],"Grass");
 add("Street",0,-.12,-45,260,.24,18,[44,48,49],"Concrete");
 for(const z of [-57,-33])add("Pavement",0,.05,z,260,.1,6,[127,124,110],"Concrete");
 for(let x=-120;x<=120;x+=12)add("RoadMark",x,.015,-45,5,.02,.2,[181,169,128],"SmoothPlastic",{},false);
 for(const x of [-130,130])add("DistrictBoundary",x,6,0,1,16,260,[47,57,49],"Brick");
 add("DistrictBoundary",0,6,130,260,16,1,[47,57,49],"Brick");
 for(const x of [-68,68])add("DistrictBoundary",x,6,-130,124,16,1,[47,57,49],"Brick");
 add("GardenPath",0,.04,-24,6,.08,16,[112,110,96],"Concrete");
 const venues=[
  [-96,-79,"CINEMA","THE PALLADIUM",[83,45,44]],[-56,-79,"ARCHIVE","MUNICIPAL ARCHIVE",[62,76,65]],
  [-16,-79,"CLINIC","ST. AGNES CLINIC",[72,101,108]],[24,-79,"RAILWAY","ASHFIELD STATION",[61,74,87]],
  [64,-79,"WORKSHOP","WARD & SONS",[100,77,48]],[104,-79,"COSTUME SHOP","VELVET & ASH",[76,49,80]],
  [-76,-11,"BOOKSHOP","THE SECOND COPY",[76,67,54]],[76,-11,"CAFE","THE EMPTY CHAIR",[70,87,72]]
 ];
 for(const [x,z,kind,name,c]of venues){
  const front=z< -50?z+14:z-14;
  add("VenueFoundation",x,-.25,z,28,.5,28,[93,91,82],"Concrete");
  add("VenueRoof",x,14.25,z,29,.5,29,[49,53,51],"Slate");
  wall("VenueSide",x-14,0,z,.5,14,28);wall("VenueSide",x+14,0,z,.5,14,28);
  wall("VenueBack",x,0,z+(front<z?14:-14),28,14,.5);
  for(const dx of [-8.5,8.5])add("VenueFacade",x+dx,7,front,11,14,.6,c,"Brick");
  add("VenueLintel",x,12,front,6,4,.6,c,"Brick");
  for(const dx of [-3.2,3.2])add("VenueDoorTrim",x+dx,5,front,.3,10,.9,[160,145,112]);
  add("VenueSign",x,11.7,front+(front<z?-.5:.5),24,2.5,.25,c,"Metal",{Sign:name,Side:front<z?"Front":"Back",Venue:kind},false);
  for(const dx of [-9,9]){
   add("ShopWindow",x+dx,5,front+(front<z?-.4:.4),6,6,.15,[91,117,120],"Glass",{},false,.25);
   add("WindowSill",x+dx,1.9,front,6.5,.25,1,[157,147,126],"Concrete");
  }
  add("Lamp",x,13,z,1.5,.2,1.5,[239,203,143],"Metal",{},false);
  desk(x,0,z+3,8,3);chair(x-5,0,z+3);chair(x+5,0,z+3);
  prop("DistrictRecord"+kind,"record",name+" · correspondence","Read correspondence",x,3.5,z+3,1.3,.12,.9,{Index:kind,Text:kind+": The household account still lists four names. A clerk has written: do not correct the original. The delivery address has no room number."});
  for(const dx of [-10,10])for(let level=1;level<=3;level++){
   add("VenueShelf",x+dx,level*2,z-9,4,.16,5,[86,72,54]);
   for(let i=0;i<4;i++)add("VenueContents",x+dx-1.4+i*.8,level*2+.65,z-9,.6,1.2,1,[70+i*18,71+i*9,58+i*6],kind==="CLINIC"?"SmoothPlastic":"Wood");
  }
  if(kind==="CINEMA"){
   add("CinemaScreen",x,7,z-13.5,19,9,.15,[161,158,137],"Fabric");
   for(let row=0;row<2;row++)for(const dx of [-7,-3,3,7])chair(x+dx,0,z-5+row*4);
  }
  if(kind==="RAILWAY")for(const dx of [-7,7])add("PlatformBench",x+dx,1.7,z-5,4,.3,2,[108,89,63]);
 }
 for(let x=-116;x<=116;x+=29){
  add("StreetLampPole",x,7,-59,.22,14,.22,[52,60,55],"Metal");
  add("Lamp",x,14,-59,1.4,.3,1.4,[232,200,139],"Metal",{},false);
  add("LampHousing",x,14.4,-59,1.8,.16,1.8,[43,52,46],"Metal");
 }
 for(const x of [-35,35])for(const z of [35,60,85]){
  add("TreeTrunk",x,5,z,1.3,10,1.3,[78,65,47]);
  add("TreeCanopy",x,12,z,8,7,8,[34,56,42],"Grass");
 }
 for(const side of [-1,1])for(const z of [-7,13]){
  add("Skirting",side*3.65,.3,z,.12,.6,14,[145,132,106],"Wood",{},false);
  add("WallCornice",side*3.65,11.6,z,.2,.5,14,[167,156,129]);
 }
 add("FuseBoxCase",3.6,5,8,.3,2.5,1.8,[68,75,71],"Metal");
 for(let i=0;i<4;i++)add("FuseSwitch",3.35,4.3+i*.43,8,.2,.25,.65,[161,158,135],"SmoothPlastic");
 add("FuseWarning",3.3,6,8,.05,.4,1.2,[192,160,65],"Metal",{Sign:"MAIN / 240V",Side:"Left"},false);
 // Source-driven evidence and decision stations across the existing basement rooms.
 const roomIndex=Object.fromEntries(content.BENEATH.rooms.map((r,i)=>[r.id,i]));
 for(const room of content.BENEATH.rooms){
  const i=roomIndex[room.id],x=i%2?16:-16,z=-9+Math.floor(i/2)*18;
  const evidence=content.deepItems.filter(n=>n.room===room.id&&n.type!=="diary");
  evidence.forEach((n,k)=>{
   const px=x-8+(k%5)*4,pz=z-8.6;
   prop("Evidence_"+n.id,"evidence",n.title,n.type==="key"?"Take key":"File evidence",px,-13.5+Math.floor(k/5)*1.6,pz,1,1.1,.08,{Evidence:n.id,Text:n.text,Category:n.type});
  });
  (content.deepActions[room.id]||[]).forEach(([flag,label,text],k)=>{
   prop("Decision_"+room.id+"_"+flag,"story",label,label,x+10,-13.5,z-5+k*2, .15,1,.9,{Flag:flag,Text:text,Cost:"0"});
  });
 }
 const endingRoom=content.deepEndRoom;
 for(const room of content.BENEATH.rooms){
  const list=content.BENEATH.endings.filter(e=>endingRoom[e.category]===room.id),i=roomIndex[room.id],x=i%2?16:-16,z=-9+Math.floor(i/2)*18;
  list.forEach((e,k)=>prop("DeepEnding_"+e.id,"ending",e.name,"Consider ending",x-9+k*3,-13,z+7,1,.2,.7,{Ending:"deep:"+e.id}));
 }
 // Annex preserves all 20 original city venues; boulevard connects through the old north boundary.
 add("CityAnnexGround",0,-.45,-220,260,.5,240,[47,60,47],"Grass");
 for(const z of [-145,-185,-225,-265]){
  add("AnnexStreet",0,-.1,z,250,.2,10,[43,47,47],"Concrete");
  for(const dz of [-7,7])add("AnnexPavement",0,.04,z+dz,250,.08,4,[124,120,105],"Concrete",{},false);
 }
 add("AnnexBoulevard",0,.02,-126,7,.04,45,[119,117,101],"Concrete",{},false);
 for(const p of content.cityPlaces){
  const x=p.x,z=p.z;
  add("OriginalVenueFloor",x,-.25,z,28,.5,28,[106,98,79]);
  wall("OriginalVenueBack",x,0,z-14,28,12,.5);
  for(const dx of [-14,14])wall("OriginalVenueSide",x+dx,0,z,.5,12,28);
  wall("OriginalVenueFront",x-8.5,0,z+14,11,12,.5);wall("OriginalVenueFront",x+8.5,0,z+14,11,12,.5);wall("OriginalVenueHeader",x,9,z+14,6,3,.5);
  add("OriginalVenueRoof",x,12.2,z,29,.4,29,[57,66,57],"Slate");
  add("OriginalVenueSign",x,10,z+14.3,25,1.6,.12,[37,57,47],"Metal",{Sign:p.name,Side:"Back",Venue:p.id.toUpperCase()},false);
  add("Lamp",x,11,z,1.4,.2,1.4,[225,206,155],"Metal",{},false);
  desk(x,0,z+3,7,3);chair(x-5,0,z+3);
  prop("OriginalVenueClue_"+p.id,"story",p.name,"Investigate evidence",x,3.5,z+3,1.2,.1,.9,{Flag:"venue:"+p.id,Text:p.clue,Cost:"4"});
  p.choices.forEach(([action,title,text],k)=>prop("CityEnding_"+p.id+"_"+k,"ending",title,action,x-5+k*10,3,z-8,1,.15,.7,{Ending:"city:"+p.id+":"+k}));
  for(const dx of [-10,10])for(let y=1;y<=3;y++){
   add("OriginalVenueShelf",x+dx,y*2,z-8,3,.15,7,[93,75,54]);
   for(let n=0;n<5;n++)add("OriginalVenueProp",x+dx,y*2+.6,z-10+n,1,1.1,.65,[89+n*7,98,78]);
  }
 }
 for(const [room,index]of [["archive",3],["study",5],["sealed",6],["observation",7]]){
  const side=index%2?1:-1,z=-9+Math.floor(index/2)*18;
  interactions.push(part("KeyedRoomGate_"+room,side*4,-13.5,z,.55,9,6,[89,80,56],"Wood",{Role:"roomGate",Room:room,Title:"The "+room+" door",Action:"Use keyed door"},true));
 }
 // Permanent original house/garden clues and sixteen original ending paths.
 const legacyActions=[
 ["photo","The old family photograph","Keep the photograph",20,3.6,17,"Proof that you were here. You keep the original, including the person outside the frame."],
 ["tape","An old voice recording","Keep the recording",13,3.6,-10,"Your voice answers Mum from another room. Another child's voice answers with you."],
 ["tomorrowDiary","Tomorrow's diary","Read tomorrow's diary",-16,3.5,16,"You came home to care for Mum. Tomorrow's entry describes a door opening tonight."],
 ["truth","The book of names","Read both names",15,3.5,17,"Both your names are here. One has been crossed out. The ink has not dried."],
 ["called","The telephone","Call for help",18,3.5,-11,"A familiar voice answers before the telephone finishes ringing."],
 ["power","The fuse box","Isolate the spare-room circuit",3.1,5,8,"You isolate the labelled branch safely. Along the street, the lamps seem clearer."],
 ["ward","The chalk circle","Complete the chalk circle",12,1,2,"You close the final gap in the chalk line."],
 ["music","The garden music box","Wind the music box",-25,3.5,45,"The little mechanism plays a lullaby with its last line missing."],
 ["wellQuiet","The quiet well","Let the well fall quiet",-18,2,62.3,"The echoes stop answering. You leave the stones undisturbed."],
 ["gateWords","Three words at the gate","Say WE WERE HERE",0,4,88,"You speak the words in the order the hidden notes gave you."],
 ["planted","An empty flowerbed","Plant the black seeds",24,1,50,"You press the seeds into ordinary soil and leave room for tomorrow."],
 ["buried","A memory beneath roots","Bury the painful memory",-30,1,68,"You lay the written memory beneath the roots. You keep the rest."],
 ["lantern","The garden lantern","Light the lantern",25,3,70,"The flame throws one shadow. This one moves when you do."],
 ["projectorSeen","A home movie","Watch the projector",-96,4,-82,"On the screen, Mum reaches for the spare-room door. The film stops before she turns the handle."]
 ];
 for(const [flag,title,action,x,y,z,text]of legacyActions)
  prop("LegacyAction_"+flag,"story",title,action,x,y,z,1.4,.6,.9,{Flag:flag,Text:text,Cost:"3"});
 const notePositions=[[-3.6,4,9],[-20,4,-13],[3.6,5,18],[-23,3,44],[23,4,68],[22.8,2,1]];
 content.legacy.noteDefs.forEach((n,i)=>{
  const [x,y,z]=notePositions[i];prop("LegacyNote_"+n.id,"story",n.title,"Read sticky note",x,y,z,.12,1,1.2,{Flag:n.id,Text:n.text,Cost:"3"},[202,181,103]);
 });
 add("MusicBoxTable",-25,1.6,45,5,3.2,2,[99,76,53]);
 add("WellStoneRim",-18,.6,65,5,1.2,5,[105,109,92],"Slate");
 add("WellDarkCentre",-18,1.21,65,3,.02,3,[12,20,16],"Slate",{},false);
 add("GardenGatePost",-4,4,88,.5,8,.5,[106,93,65]);add("GardenGatePost",4,4,88,.5,8,.5,[106,93,65]);
 for(const [i,id]of Object.keys(content.legacy.endings).entries()){
  const e=content.legacy.endings[id],x=-20+(i%8)*5,z=102+Math.floor(i/8)*5;
  prop("LegacyEnding_"+id,"ending",e.title,"Consider this path",x,3,z,1.2,.25,.8,{Ending:"legacy:"+id});
 }
 // Room-specific observation stations reveal original anomalies without admin tools.
 for(const room of content.BENEATH.rooms){const i=roomIndex[room.id],x=i%2?16:-16,z=-9+Math.floor(i/2)*18;
  prop("Observe_"+room.id,"observe",room.name,"Wait and observe",i%2?7:-7,-13,z,1,.3,.8,{Room:room.id});
 }
 // Two permanent district destinations, reached on foot from the house-side pavement.
 for(const x of [-48,48])add("DistrictFootpath",x,.04,35,5,.08,130,[113,112,98],"Concrete",{},false);
 add("ParkEntrancePath",-80,.04,27,64,.08,5,[113,112,98],"Concrete",{},false);
 add("SchoolEntrancePath",82,.04,29,72,.08,5,[113,112,98],"Concrete",{},false);
 add("ParkLawn",-85,-.1,68,64,.2,76,[59,78,49],"Grass",{},false);
 add("ParkWalk",-85,.04,65,5,.08,76,[124,116,94],"Concrete",{},false);
 add("ParkCrossWalk",-85,.04,65,60,.08,5,[124,116,94],"Concrete",{},false);
 add("ParkSign",-96,5,29,22,2,.25,[32,66,44],"Wood",{Sign:"ASHFIELD MEMORIAL PARK"},false);
 for(const x of [-114,-56])for(const z of [38,54,78,96]){
  add("ParkTreeTrunk",x,5,z,1.1,10,1.1,[82,65,43]);
  add("ParkCanopy",x,11,z,7,7,7,[37,66,39],"Grass",{},false);
 }
 for(const x of [-98,-72])for(const z of [47,83]){
  add("ParkBenchSeat",x,1.7,z,8,.3,2,[106,82,51]);add("ParkBenchBack",x,2.8,z+1,8,2,.2,[106,82,51]);
  for(const dx of [-3,3])add("ParkBenchLeg",x+dx,.8,z,.25,1.6,1.5,[59,69,57],"Metal");
 }
 add("MemorialStone",-103,2.2,65,4,4.4,2,[102,110,102],"Slate");
 add("MemorialPlaque",-103,3,63.9,3.5,1.4,.1,[77,84,66],"Metal",{Sign:"FOR THOSE WE STILL REMEMBER"},false);
 prop("ParkMemorialNote","record","The omitted dedication","Read the dedication",-103,2,63.8,1.3,.8,.1,{Index:"park_dedication",Text:"The mason charged for five names. Four lines have been filled. The fifth is polished smooth, but its letters are still visible when rain settles in the stone."});
 add("ParkGazeboRoof",-85,9,96,16,.35,12,[67,78,59],"Slate");
 for(const x of [-92,-78])for(const z of [91,101])add("GazeboPost",x,4.5,z,.25,9,.25,[135,123,91]);
 desk(-85,0,97,6,2);
 prop("ParkLostDrawing","record","The picnic drawing","Inspect the drawing",-85,3.5,97,1.2,.1,.9,{Index:"park_drawing",Text:"Two adults and three children sit beneath this shelter. Someone has pencilled YOU above a different child in each copy. A red bicycle leans against a tree."});
 // School: reception hall, two classrooms, library and rear playground.
 add("SchoolFloor",85,-.25,65,64,.5,64,[127,116,91],"WoodPlanks");
 for(const x of [53,117]){
  for(const [a,b]of [[33,41],[47,71],[77,97]])wall("SchoolWindowPier",x,0,(a+b)/2,.5,12,b-a);
  for(const z of [44,74]){
   wall("SchoolWindowSill",x,0,z,.5,3,6);wall("SchoolWindowLintel",x,8,z,.5,4,6);
   add("SchoolWindowGlass",x,5.5,z,.15,5,6,[99,133,143],"Glass",{},true,.5);
   add("SchoolWindowMullion",x,5.5,z,.3,5,.15,[165,169,149],"Metal");
  }
 }wall("SchoolBack",85,0,97,64,12,.5);
 wall("SchoolFrontLeft",67.5,0,33,29,12,.5);wall("SchoolFrontRight",102.5,0,33,29,12,.5);wall("SchoolEntryHeader",85,9,33,6,3,.5);
 add("SchoolRoof",85,12.25,65,65,.5,65,[62,72,64],"Slate");
 add("SchoolSign",85,10,32.6,49,1.8,.15,[46,69,81],"Metal",{Sign:"ASHFIELD PRIMARY SCHOOL"},false);
 for(const x of [81,89]){
  for(const [a,b]of [[33,43],[49,73],[79,97]])wall("SchoolHallWall",x,0,(a+b)/2,.35,12,b-a);
  for(const z of [46,76])wall("SchoolDoorHeader",x,9,z,.35,3,6);
 }
 for(const x of [67,103])wall("SchoolRoomDivider",x,0,61,28,12,.35);
 for(const x of [67,85,103])for(const z of [46,78])add("Lamp",x,11.3,z,1.2,.2,1.2,[226,211,162],"Metal",{},false);
 for(const x of [60,68,76])for(const z of [44,50,56]){desk(x,0,z,3,1.8);chair(x,0,z+2);}
 add("ClassroomBlackboard",67,5,33.4,19,4,.15,[35,55,42],"Slate",{Sign:"OUR FAMILY / DRAW EVERYONE AT HOME",Side:"Back"},false);
 desk(102,0,47,7,3);chair(102,0,50);
 prop("SchoolRegister","record","The attendance register","Read the register",102,3.5,47,1.3,.1,1,{Index:"school_register",Text:"Three children at the same address. One entry has been marked transferred; the destination column is blank. Mum's signature appears beside all three. The youngest child's height is recorded in your handwriting."});
 for(const x of [58,61])for(let n=1;n<=4;n++)add("SchoolLibraryShelf",x,n*1.8,80,2,.15,23,[98,80,54]);
 desk(69,0,79,6,3);chair(69,0,82);
 prop("SchoolLibraryLetter","record","A letter never collected","Read the teacher's letter",69,3.5,79,1.2,.1,.9,{Index:"school_letter",Text:"Dear parent: your children continue to describe a room absent from the approved plans. Please do not correct their drawings before our meeting. The envelope is addressed to Dad. It has never been opened."});
 for(const x of [96,104,112])for(const z of [70,77,84]){desk(x,0,z,3,1.8);chair(x,0,z+2);}
 prop("SchoolReportBoard","record","The duplicated school report","Inspect the school report",103,4,96.6,1.3,1.2,.1,{Index:"school_report",Text:"Both reports praise a drawing of the park. Different first names, identical marks, identical date. The teacher has written: Neither child is copying. Please keep both originals."});
 for(const [x,z]of [[-83,34],[-83,86],[49,28],[120,36],[120,90]]){
  add("DistrictNewLampPost",x,7,z,.2,14,.2,[53,67,58],"Metal");add("Lamp",x,14,z,1.4,.3,1.4,[227,207,153],"Metal",{},false);
 }
 // The Last Bus Stop: a separate safe staging area east of Ashfield.
 add("LobbyGround",400,-.5,0,180,1,160,[45,52,47],"Concrete");
 add("LobbyRoad",400,.02,-25,100,.12,14,[36,39,38],"Slate",{},false);
 for(const side of [-1,1])wall("LobbyBoundary",400+side*90,0,0,1,12,160);
 wall("LobbyBack",400,0,80,180,12,1);wall("LobbyFront",400,0,-80,180,12,1);
 add("BusStopShelterRoof",400,10,13,31,.5,12,[40,52,46],"Metal");
 for(const x of [385,415])for(const z of [8,18])add("ShelterPost",x,5,z,.25,10,.25,[94,106,90],"Metal");
 add("ShelterGlass",400,5,18,29,9,.15,[102,127,119],"Glass",{},false,.55);
 add("LobbyBench",400,2,15,19,.35,2,[109,85,56]);
 for(const x of [394,406])add("LobbyBenchLeg",x,1,15,.3,2,1.5,[69,73,65],"Metal");
 add("BusStopSign",400,8.5,17.8,23,1.8,.15,[28,48,40],"Metal",{Sign:"THE LAST BUS STOP / ASHFIELD"},false);
 add("DepartureBoard",400,5,17.7,16,3,.12,[27,35,31],"Wood",{Sign:"CHOOSE A CLASS. JOIN A BUS.\nTHE HOUSE REMEMBERS EVERY ARRIVAL."},false);
 for(const [i,mode]of ["Easy","Intermediate","Hard"].entries()){
  const x=378+i*22;
  add("QueuePad",x,.06,-8,16,.12,10,[[74,104,82],[128,110,67],[117,69,66]][i],"Concrete",{},false);
  add("QueueSign",x,5,-13,14,2,.2,[30,43,36],"Metal",{Sign:mode.toUpperCase()+" / UP TO 4 EXPLORERS"},false);
  prop("BusQueue"+mode,"lobbyQueue",mode+" departure","Join "+mode+" bus",x,2.8,-8,2,.2,1,{Mode:mode});
 }
 add("LobbyBusBody",432,3,-27,10,5,25,[71,86,66],"Metal");
 add("LobbyBusRoof",432,6,-27,10,.4,25,[41,48,42],"Metal");
 for(const side of [-1,1])for(const z of [-35,-31,-27,-23,-19])add("BusWindow",432+side*5.02,4.5,z,.08,2.4,3,[87,110,108],"Glass",{},false,.2);
 for(const z of [-35,-19])for(const side of [-1,1])add("BusWheel",432+side*4.6,1,z,1.2,2.2,2.2,[25,28,26],"SmoothPlastic");
 add("BusDestination",432,4.5,-39.6,8,1.4,.1,[17,27,21],"Metal",{Sign:"ASHFIELD / LAST SERVICE"},false);
 for(const x of [377,423]){add("LobbyLampPost",x,7,12,.25,14,.25,[72,79,67],"Metal");add("Lamp",x,14,12,1.5,.3,1.5,[229,204,145],"Metal",{},false);}
 prop("LobbyPracticeNote","lobbyNote","The last timetable","Read the timetable",389,3,14,1.2,.1,1,{Text:"Hold E to interact. New diary pages earn 2 Memory Shards each; each first story ending earns 40. Rewards are once per account, not per restart. The lobby is safe. No purchases are needed to enter the house."});
 // Courtyard paving, planted borders, shops and a sheltered waiting garden.
 for(let x=320;x<=480;x+=8)for(let z=24;z<=72;z+=8)add("CourtyardPaver",x,.035,z,7.7,.07,7.7,[83+(x%3)*3,86,77],"Slate",{},false);
 for(const x of [325,475])for(const z of [-58,-5,40,68]){
  add("LobbyPlanter",x,1,z,5,2,5,[85,88,76],"Brick");
  add("LobbyShrub",x,2.5,z,4,2,4,[43,66,45],"Grass");
  add("LobbyLampPost",x+4,7,z,.22,14,.22,[62,70,61],"Metal");add("Lamp",x+4,14,z,1.4,.3,1.4,[226,205,151],"Metal",{},false);
 }
 for(const x of [370,400,430]){
  add("CourtyardBench",x,1.8,62,10,.3,2,[105,82,57]);
  add("CourtyardBenchBack",x,3,63,10,2,.2,[105,82,57]);
  for(const dx of [-4,4])add("CourtyardBenchLeg",x+dx,.85,62,.3,1.7,1.5,[64,70,61],"Metal");
 }
 // The class shop has a six-stud doorway, counter, display tables and four outfits.
 wall("ClassShopBack",347,0,49,32,12,.5);
 wall("ClassShopSide",331,0,35,.5,12,28);wall("ClassShopSide",363,0,35,.5,12,28);
 wall("ClassShopFrontLeft",337.5,0,21,13,12,.5);wall("ClassShopFrontRight",356.5,0,21,13,12,.5);
 wall("ClassShopDoorHeader",347,9,21,6,3,.5);
 add("ClassShopRoof",347,12.2,35,33,.4,29,[47,56,48],"Slate");
 add("ClassShopSign",347,10,20.6,25,1.6,.15,[33,57,46],"Metal",{Sign:"WARD & THREAD / CLASS OUTFITTERS"},false);
 add("ClassShopCounter",347,1.8,40,19,3.6,2.5,[86,72,51]);
 add("Lamp",347,11,32,1.6,.2,1.6,[229,205,146],"Metal",{},false);
 prop("ClassShopkeeper","lobbyShop","Ward & Thread","Browse classes and Memory Shards",347,3.8,38.5,1.2,.2,1,{Text:"Choose your work before you return to the house."});
 for(const [i,name]of ["WANDERER","ARCHIVIST","COURIER","CARETAKER"].entries()){
  const x=335+i*8;
  add("ClassDisplayPlinth",x,.5,46,3,1,3,[65,73,61]);
  add("ClassDisplayPlaque",x,1.1,44.4,3,.8,.1,[30,45,36],"Metal",{Sign:name},false);
 }
 // Open-front ticket kiosk: difficulty belongs to departure, never the title screen.
 add("TicketKioskRoof",454,8,30,23,.4,13,[55,65,52],"Metal");
 for(const x of [443,465])for(const z of [24,36])add("KioskPost",x,4,z,.25,8,.25,[90,99,79],"Metal");
 add("KioskCounter",454,1.8,32,20,3.6,2,[93,78,53]);
 add("TicketSign",454,6.6,24,20,1.6,.15,[28,48,39],"Metal",{Sign:"ASHFIELD TICKETS / SOLO DEPARTURES"},false);
 for(const [i,mode]of ["Easy","Intermediate","Hard"].entries())
  prop("SoloTicket"+mode,"lobbySolo",mode+" ticket","Depart solo / "+mode,447+i*7,3.7,30.5,1,.15,1,{Mode:mode});
 add("NoticeBoard",400,4,49,20,7,.4,[85,69,47]);
 add("NoticeBoardPaper",400,4.5,48.7,17,5,.1,[170,164,134],"Fabric",{Sign:"ASHFIELD VISITORS\nCLASS SHOP WEST / TICKETS EAST\nBUSES LEAVE FROM THE FRONT PADS"},false);
 for(let i=0;i<8;i++)add("CourtyardBollard",372+i*8,1.4,21,.45,2.8,.45,[79,85,73],"Metal");
 // Lobby detail pass: curb stones, roof trim, pavement lamps and shop fixtures.
 for(let x=316;x<=484;x+=6){add("LobbyCurb",x,.2,-16,5.8,.4,.45,[139,136,117],"Concrete");add("LobbyCurb",x,.2,75,5.8,.4,.45,[139,136,117],"Concrete");}
 for(const x of [331,363])add("ShopRoofCornice",x,11.8,35,.7,.4,29,[149,137,102]);
 for(const z of [21,49])add("ShopRoofCornice",347,11.8,z,33,.4,.7,[149,137,102]);
 for(const x of [333,361]){
  add("ShopDisplayFrame",x,5,20.65,2.4,6,.35,[91,81,57]);
  add("ShopDisplayGlass",x,5,20.4,2,5.5,.12,[103,130,122],"Glass",{},false,.65);
 }
 add("ShopRug",347,.035,31,18,.07,10,[79,58,46],"Fabric",{},false);
 add("ShopRegister",351,4,40,2,.7,1.3,[43,56,47],"Metal");
 for(const x of [338,340,342])add("ShopFoldedClothing",x,3.9,40,1.5,.5,1.2,[102,116,92],"Fabric");
 for(let i=0;i<4;i++)add("ShopHangingRail",334+i*8,7,47,4,.1,.1,[138,132,108],"Metal");
 add("LobbyClockFace",400,7.5,49,3,2.2,.12,[169,164,136],"Wood",{Sign:"LAST SERVICE / ASHFIELD"},false);
 for(const x of [382,418]){
  add("LobbyBin",x,1.5,17,1.7,3,1.7,[53,68,57],"Metal");
  add("LobbyBinLid",x,3.1,17,1.9,.2,1.9,[35,46,38],"Metal");
 }
 for(const z of [39,55,69])for(const x of [319,481]){
  add("LobbyTallTree",x,5,z,1.2,10,1.2,[80,64,43]);
  for(let k=0;k<3;k++)add("LobbyTreeCrown",x,9+k*2,z,8-k,4,8-k,[40+k*5,65+k*5,43+k*4],"Grass",{},false);
 }
 const spawn=item("SpawnLocation","HomeSpawn",`<Vector3 name="size"><X>5</X><Y>0.2</Y><Z>5</Z></Vector3><CoordinateFrame name="CFrame"><X>400</X><Y>0.1</Y><Z>5</Z><R00>1</R00><R01>0</R01><R02>0</R02><R10>0</R10><R11>1</R11><R12>0</R12><R20>0</R20><R21>0</R21><R22>1</R22></CoordinateFrame>`+bool("Anchored",true)+bool("Neutral",true)+bool("CanCollide",false)+num("Transparency",1)+num("Duration",0));
 const script=(cls,name,source)=>item(cls,name,`<ProtectedString name="Source">${esc(source)}</ProtectedString>`+(cls==="ModuleScript"?"":bool("Disabled",false)));
 const folder=item("Folder","SpareRoomWorld","",world.join("")+spawn+item("Folder","Interactables","",interactions.join("")));
 const xml=`<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="4"><External>null</External><External>nil</External>${item("Workspace","Workspace","",folder)}${item("ReplicatedStorage","ReplicatedStorage","",script("ModuleScript","SpareRoomConfig",sources.config)+script("ModuleScript","SpareRoomAvatars",sources.avatars)+script("ModuleScript","SpareRoomRevive",sources.revive)+script("ModuleScript","SpareRoomEconomy",sources.economy)+script("ModuleScript","SpareRoomLobby",sources.lobby)+script("ModuleScript","SpareRoomContent",sources.content))}${item("ServerScriptService","ServerScriptService","",script("Script","SpareRoomServer",sources.server)+script("Script","SpareRoomNPCs",sources.npcs))}${item("StarterPlayer","StarterPlayer","",item("StarterPlayerScripts","StarterPlayerScripts","",script("LocalScript","SpareRoomClient",sources.client)+script("LocalScript","SpareRoomPresentation",sources.presentation)))}${item("Lighting","Lighting",`<token name="LightingStyle">1</token>`+bool("GlobalShadows",true))}</roblox>`;
 return {xml,stats:{parts:count,interactables,basementRooms:10,diaryEntries:20,upstairsRooms:4,endings:68,anomalies:37,venues:28,npcs:21,park:1,schoolRooms:4,classes:4,shardPacks:3,lobbyCapacity:4}};
};
const dir=__dirname;
fs.writeFileSync(path.join(dir,"SpareRoomContent.lua"),require("./generate-content.cjs")(JSON.parse(fs.readFileSync(path.join(dir,"source-content.json"),"utf8"))));
const result=buildPlace({presentation:fs.readFileSync(path.join(dir,"SpareRoomPresentation.client.lua"),"utf8"),contentData:JSON.parse(fs.readFileSync(path.join(dir,"source-content.json"),"utf8")),content:fs.readFileSync(path.join(dir,"SpareRoomContent.lua"),"utf8"),economy:fs.readFileSync(path.join(dir,"SpareRoomEconomy.lua"),"utf8"),lobby:fs.readFileSync(path.join(dir,"SpareRoomLobby.lua"),"utf8"),config:fs.readFileSync(path.join(dir,"SpareRoomConfig.lua"),"utf8"),server:fs.readFileSync(path.join(dir,"SpareRoomServer.server.lua"),"utf8"),client:fs.readFileSync(path.join(dir,"SpareRoomClient.client.lua"),"utf8"),revive:fs.readFileSync(path.join(dir,"SpareRoomRevive.lua"),"utf8"),avatars:fs.readFileSync(path.join(dir,"SpareRoomAvatars.lua"),"utf8"),npcs:fs.readFileSync(path.join(dir,"SpareRoomNPCs.server.lua"),"utf8")});
fs.writeFileSync(path.join(dir,"The-Spare-Room.rbxlx"),result.xml);
fs.writeFileSync(path.join(dir,"build-stats.json"),JSON.stringify(result.stats,null,2)+"\n");
console.log(result.stats);

