-- ReplicatedStorage.SpareRoomConfig
-- The Spare Room: Roblox Studio starter. All positions use Roblox studs.
local Config = {
 Version = "3.5.0",
 Release = {version="3.5.0",channel="stable",message=""},
 Watcher = {spawnDistance=18,minimumDistance=6.5,stepDistance=3,unseenSeconds=.65,moveCooldown=1.8},
 AnomalyPacing = {minimum=0.78,maximum=1.3},
 -- Create a repeatable Developer Product priced at 30 Robux in this experience.
 -- The old gamepass 2073110257 cannot be used as a consumable product.
 ReviveProductId = 3729479338, -- REVIVE developer product; creator-configured price: 30 Robux.
 Classes = {
  Wanderer={name="Wanderer",cost=0,description="Free. Standard stamina, recovery and sanity loss.",damage=1,drain=1,stamina=1,recovery=1,food=0},
  Archivist={name="Archivist",cost=80,description="20% less sanity lost from disturbing discoveries.",damage=0.8,drain=1,stamina=1,recovery=1,food=0},
  Courier={name="Courier",cost=100,description="Sprint uses 25% less stamina; stamina recovers 15% faster.",damage=1,drain=1,stamina=0.75,recovery=1.15,food=0},
  Caretaker={name="Caretaker",cost=120,description="20% less passive sanity loss; sandwiches restore 3% extra.",damage=1,drain=0.8,stamina=1,recovery=1,food=3},
 },
 ClassOrder={"Wanderer","Archivist","Courier","Caretaker","Medic","Technician","Scout","Medium","Warden","OPAdmin"},
 -- Create three distinct developer products in the SAME experience. Never reuse the revive ID.
 ShardPacks={
  {name="+50 Memory Shards",amount=50,productId=3729646165},
  {name="+150 Memory Shards",amount=150,productId=3729646314},
  {name="+1000 Memory Shards",amount=1000,productId=3729646477},
 },
 ReviveSanity = 50,
 SaveEndingJournal = true, -- Preserve ending discoveries across private runs.
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


Config.Endings["original:station:0"]={title="The passenger",text="You board the train. Every passenger has your face at a different age. At the next stop, you finally recognise the person waiting for you.",flags={"original:station"}}
Config.Endings["original:station:1"]={title="The signal keeper",text="You change the signal to red. The train never arrives at the house. Every night, you keep one more family from boarding.",flags={"original:station"}}
Config.Endings["original:library:0"]={title="The unwritten",text="You erase your entry from the register. Outside, nobody remembers the house. You do not remember it either—until you find the key in your pocket.",flags={"original:library"}}
Config.Endings["original:library:1"]={title="The archivist",text="You sign your name at the desk. The books settle. Every lost child has a place in the catalogue now. One shelf is reserved for you.",flags={"original:library"}}
Config.Endings["original:cinema:0"]={title="The missing scene",text="You cut the film before the door opens. The screen turns white. When you walk home, the hallway ends where it always should have.",flags={"original:cinema"}}
Config.Endings["original:cinema:1"]={title="The understudy",text="You step into the picture. Mother looks up from the kitchen table. Somewhere behind you, an audience begins to applaud.",flags={"original:cinema"}}
Config.Endings["original:clinic:0"]={title="Discharged",text="You destroy the file. The ward doors unlock. You and Mother leave together, but the scar on your palm has two lifelines.",flags={"original:clinic"}}
Config.Endings["original:clinic:1"]={title="The quiet ward",text="You sign the consent form. Your fear disappears first. Then your name. A nurse closes the curtains around a bed that has always been yours.",flags={"original:clinic"}}
Config.Endings["original:chapel:0"]={title="The returned name",text="You speak your own name into the bell. The city answers in Mother’s voice. Every locked door opens, and none of them lead back to the spare room.",flags={"original:chapel"}}
Config.Endings["original:chapel:1"]={title="The last candle",text="You light the final candle. The shadows kneel around you. You promise to keep the light burning until every forgotten child comes home.",flags={"original:chapel"}}
Config.Endings["original:radio:0"]={title="The warning",text="You warn the city never to open an unfamiliar door. All around you, radios click off. At home, Mother puts down the spare key.",flags={"original:radio"}}
Config.Endings["original:radio:1"]={title="The transmission",text="“I’m here,” you say. Your voice escapes through every radio in the city. You can never return to your body, but no one will be alone in the house again.",flags={"original:radio"}}

Config.Classes.Medic={name="Medic",cost=180,description="Sandwiches restore 8 extra sanity. Standard movement.",damage=.9,drain=1,stamina=1,recovery=1,food=8}
Config.Classes.Technician={name="Technician",cost=250,description="30% less discovery damage; 10% faster sanity drain.",damage=.7,drain=1.1,stamina=1,recovery=1,food=0}
Config.Classes.Scout={name="Scout",cost=350,description="12% faster movement and 20% quicker stamina recovery.",damage=1,drain=1,stamina=.9,recovery=1.2,food=0,speed=1.12}
Config.Classes.Medium={name="Medium",cost=600,description="35% slower passive sanity drain; discoveries hurt 15% more.",damage=1.15,drain=.65,stamina=1,recovery=1,food=0}
Config.Classes.Warden={name="Warden",cost=1200,description="40% less discovery damage and 15% slower sanity drain.",damage=.6,drain=.85,stamina=.85,recovery=1.1,food=2}
Config.Classes.OPAdmin={name="OP ADMIN",cost=100000,description="Prestige class. Self-only flight, recovery and safe home travel with cooldowns. No player moderation or owner powers.",damage=.5,drain=.5,stamina=.5,recovery=1.5,food=10}
local seasonal=game.ReplicatedStorage:FindFirstChild("SpareRoomChristmasBootstrap")
if seasonal then require(seasonal).apply(Config)end
return Config
