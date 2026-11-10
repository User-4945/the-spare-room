-- The Spare Room: Roblox Studio starter. All positions use Roblox studs.
local Config={
 Version = "Roblox prototype 0.8",
 -- Create a repeatable Developer Product priced at 30 Robux in this experience.
 -- The old gamepass 2073110257 cannot be used as a consumable product.
 ReviveProductId = 3729479338, -- REVIVE developer product; creator-configured price: 30 Robux.
 Classes = {
  Wanderer={name="Wanderer",cost=0,description="Free. Standard stamina, recovery and sanity loss.",damage=1,drain=1,stamina=1,recovery=1,food=0},
  Archivist={name="Archivist",cost=80,description="20% less sanity lost from disturbing discoveries.",damage=0.8,drain=1,stamina=1,recovery=1,food=0},
  Courier={name="Courier",cost=100,description="Sprint uses 25% less stamina; stamina recovers 15% faster.",damage=1,drain=1,stamina=0.75,recovery=1.15,food=0},
  Caretaker={name="Caretaker",cost=120,description="20% less passive sanity loss; sandwiches restore 3% extra.",damage=1,drain=0.8,stamina=1,recovery=1,food=3},
 },
 ClassOrder={"Wanderer","Archivist","Courier","Caretaker"},
 -- Create three distinct developer products in the SAME experience. Never reuse the revive ID.
 ShardPacks={
  {name="+50 Memory Shards",amount=50,productId=3729646165},
  {name="+150 Memory Shards",amount=150,productId=3729646314},
  {name="+1000 Memory Shards",amount=1000,productId=3729646477},
 },
 ReviveSanity = 50,
 SaveEndingJournal = true, -- Saves where Roblox DataStore access is available; local practice still works.
 Modes = {
  Easy = {drain = 0.025, damage = 0.75, sandwich = 15, delay = 45},
  Intermediate = {drain = 0.045, damage = 1, sandwich = 12, delay = 34},
  Hard = {drain = 0.07, damage = 1.25, sandwich = 10, delay = 25},
 },
 Diary = {
  "Mum put four plates out. I counted them because I was learning fours. She said I was getting good at numbers.",
  "Dad fixed the kitchen chair. He told us not to stand on it while the glue was drying. We all promised separately.",
  "We measured our heights beside the little beds. My line was crooked. Someone drew a sun over it.",
  "The spare room is for visitors. I asked why our coats were in its cupboard. Mum said cupboards do not belong to rooms.",
  "We played a game where nobody could say their own name. Dad forgot the rules halfway through and looked frightened.",
  "There was knocking after tea. It copied the number of people at the table. I did not tell anyone I counted five.",
  "Mum and Dad argued about which photograph to keep. Both photographs looked ordinary until they were beside each other.",
  "My school report has the wrong first name. The teacher says it is the name she has always used.",
  "Someone moved my bed. The marks in the carpet say it has never been anywhere else.",
  "Dad wrote a list of everything in the house. He left spaces between the names. Mum folded the spaces out.",
  "The boiler answers if I tap three times. It waits until the house is quiet before adding a fourth.",
  "My sibling says we never had a red bicycle. There is a photograph of us carrying it together.",
  "Mum remembered an extra lunchbox this morning. By the time she found the lid, she could not remember why.",
  "There is a room number on the maintenance sheet that does not appear on the plan. Its inspection is signed.",
  "Dad's coat was warm when I found it. Mum says the man in the photograph is a visitor. She cannot say when he visited.",
  "I can remember two people teaching me the same song. The words disagree. Both voices sound like home.",
  "The little bed has my handwriting underneath. I have grown too tall to reach it without lying on the floor.",
  "I asked how many children lived here. Mum said that was a cruel question. Later she asked me the same thing.",
  "I am keeping both copies. If one of them disappears, please do not decide that the other one was always right.",
  "I left the last page unfinished. There should be somewhere for tomorrow to go. You do not have to give us faces.",
 },
 Anomalies = {
  {id = "watcher", title = "The Watcher", text = "Too tall for the family photograph. Its pale eyes find you slowly. It turns only when you stop watching."},
  {id = "doll", title = "Borrowed Childhood", text = "The doll turns towards a voice you cannot hear. Its empty hands remember holding something."},
  {id = "pages", title = "The Unfinished Sentence", text = "Loose pages circle an empty space. Every line ends before the same name."},
  {id = "door", title = "A Room Short", text = "A door stands without a wall. Someone has polished the handle from the other side."},
  {id = "family", title = "The Family Arrangement", text = "Four silhouettes wait together. The smallest space keeps changing sides."},
  {id = "blocks", title = "Spelling Practice", text = "Children's blocks arrange themselves. There are too few letters for the name you remember."},
  {id = "plates", title = "Places Reserved", text = "Four plates rise where no table stands. A fifth place is almost visible."},
  {id = "lamp", title = "The Answering Light", text = "A lamp answers in groups of three. The last answer always has an extra pulse."},
  {id = "coat", title = "Small Shoulders", text = "A child's coat rises as though someone is inside it. Then it hangs empty."},
  {id = "steps", title = "One Step More", text = "Footprints continue after the person making them should have stopped."},
  {id = "clock", title = "The Uncounted Minute", text = "The clock moves backwards. The house keeps its own time."},
  {id = "chair", title = "One More Place", text = "There is an extra chair. Its legs are free of dust."},
 },
 Endings = {
  morning = {title = "An Ordinary Morning", text = "You keep one ordinary memory without deciding whose it was. Mum puts the kettle on.", diary = 2, anchor = true},
  names = {title = "Names Without Faces", text = "You preserve both records. Neither is declared a mistake. There is room for an answer later.", diary = 6, records = 2},
  seal = {title = "Maintained in Absence", text = "You renew the inspection seal. The earlier signatures remain beneath yours.", diary = 10, valve = true},
  tomorrow = {title = "Somewhere for Tomorrow", text = "You leave the final page unfinished. The house remembers a larger family, but offers no explanation.", diary = 20, records = 3, mum = true},
  glass = {title = "The Far Side of the Glass", text = "You cover the observation pane. The reflection continues arranging places on the other side.", anomalies = 3, sanityMax = 45},
  blueprint = {title="A House Without an Afterthought", text="You erase the red line. Downstairs, a door quietly becomes a wall. The floorboards settle. Mum asks whether you would like to help redecorate your old room.", flags={"note_study","blueprint"}},
  lullaby = {title="The Last Line", text="You finish the song. The clock starts counting forwards. From the empty cot, a child says goodnight. Mum sleeps until morning without calling anyone’s name.", flags={"note_nursery","clock"}},
  letters = {title="A Forwarding Address", text="You type HOME on the last envelope. The letters lift like startled birds and slip beneath the door. Mum is waiting by the front gate. This time, both of you know where you are going.", flags={"note_loft","letters"}},
  fallen = {title="YOU DIED", text="The house grows quiet. Restart for free, or use one paid revive to keep this run’s discoveries."},
  consumed = {title = "YOUR SANITY GOT CONSUMED", text = "The house keeps the memory you could no longer hold."},
 },
 Rooms = {"Storage Room", "Boiler Room", "Maintenance Tunnel", "Archive Room", "Forgotten Family Room", "Hidden Study", "Sealed Corridor", "Observation Room", "Former Children's Area", "Locked Chamber"},
}


local Content=require(script.Parent:WaitForChild("SpareRoomContent"))
for i,n in ipairs(Content.BENEATH.diary) do Config.Diary[i]=n.text end
for _,e in ipairs(Content.BENEATH.endings) do
 Config.Endings["deep:"..e.id]={title=e.name,text=e.description.."\n\nAchievement: "..e.achievement,requirements=e.requirements}
end
for _,p in ipairs(Content.cityPlaces) do
 for k,c in ipairs(p.choices) do Config.Endings["city:"..p.id..":"..(k-1)]={title=c[2],text=c[3],flags={"venue:"..p.id}} end
end
local visual={portrait="family",chair="chair",names="blocks",breath="coat",drawer="pages",ink="pages",clock="clock",coat="coat",chalk="blocks",cups="plates",steps="steps",page="pages",shadow="watcher",radio="lamp",door="door",boxes="blocks",glass="family",pipe="lamp",drawing="pages",label="blocks",lamp="lamp",frost="coat",scale="door",inventory="plates",lullaby="doll"}
for _,a in ipairs(Content.BENEATH.anomalies) do
 table.insert(Config.Anomalies,{id="source:"..a.id,visualId=visual[a.id],title=a.name,text=a.description,room=a.room,source=true})
end
for id,e in pairs(Content.legacy.endings) do Config.Endings["legacy:"..id]={title=e.title,text=e.text,flags=e.flags,dayOnly=id=="dawn"} end
Config.Endings["legacy:burn"].unprotectedText="You burn the diary. The door disappears, taking its memories with it.\nMum asks your name. You cannot remember.\nIn your pocket is a photograph of an empty house."
return Config
