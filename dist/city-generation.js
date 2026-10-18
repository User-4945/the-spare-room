// v2.0.0: independent deterministic streams keep scenery stable when another system changes.
const CITY_GENERATION_VERSION=2;
const CITY_BOUNDS={left:-46,right:46,near:-11,far:-90};
const extraCityPlaces=[
['cafe','The Wakeful Cafe','#82705b','Three cups are warm. The receipt says you have been sitting here since Tuesday.','cafe'],
['laundry','Pale Street Laundry','#70837d','A machine turns without water. Inside, your school uniform is still your size.','laundry'],
['postoffice','Dead Letter Office','#826952','The undelivered letters are all addressed to the upstairs records room.','post'],
['workshop','Hollow Clock Repairs','#717d78','Every clock runs normally until you look away. One ticks inside a locked drawer.','workshop'],
['florist','Night Bloom Florist','#758367','Someone ordered flowers for your return. The delivery date is tomorrow.','florist'],
['bakery','Ash and Honey Bakery','#8d7860','The oven is cold. A loaf on the counter is breathing slowly.','bakery'],
['apartments','Number Nine Flats','#747780','The tenants list contains your name twenty times. Each signature is different.','apartments'],
['hotel','Hotel Afterimage','#816e72','The guest book says you checked in with Mother. There is no departure column.','hotel'],
['market','Empty Sunday Market','#7e805f','The stalls sell objects you lost as a child. One vendor has your missing tooth.','market'],
['greenhouse','Glasshouse Gardens','#617968','The plants lean away from the sun and towards the spare-room key in your pocket.','greenhouse'],
['waterworks','Stillwater Pump House','#627b80','The gauge pulses like a heartbeat. Through the pipes, someone whispers your address.','waterworks'],
['garage','End of Road Garage','#7a7665','A car waits with its engine off. In the rear-view mirror, the driver is still here.','garage'],
['bookshop','Second Hand Stories','#7e6c63','Every book has the same last sentence: please do not leave me in that room.','books'],
['playground','The Empty Playroom','#7f7b69','The rocking horse moves once. Through the glass you see no hand that pushed it.','playroom']
].map(([id,name,color,clue,kind])=>({id,name,color,clue,kind,choices:[]}));
function cityStream(seed,label){let hash=seed>>>0;for(let c of label)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;return seededRandom(hash)}
function shuffledCity(items,random){let result=items.slice();for(let i=result.length-1;i>0;i--){let j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}
function generateCityChunks(seed,places){let ids=shuffledCity(places.map(p=>p.id),cityStream(seed,'layout-v2'));return ids.map((id,i)=>{let r=cityStream(seed,'chunk:'+id),column=i%5,row=Math.floor(i/5);return{id,column,row,x:(column-2)*18,z:-24-row*18,style:Math.floor(r()*4),trees:1+Math.floor(r()*3),height:[2.8,4.1,5.3][Math.floor(r()*3)],palette:Math.floor(r()*4),prop:Math.floor(r()*3),disturbance:Math.floor(r()*6)}})}
function worldCode(seed=s.worldSeed){return 'SPARE-2-'+(seed>>>0).toString(16).toUpperCase().padStart(8,'0')}
function seedFromCode(code){let m=/^SPARE-2-([0-9A-F]{8})$/i.exec(code.trim());return m&&parseInt(m[1],16)>0?parseInt(m[1],16):null}
function cityColor(c,p){return c.palette===0?p.color:['#777d6a','#84766b','#687b80'][c.palette-1]}
function decorateCityChunk(c,p){let x=c.x,z=c.z;
// Taller facades are sealed upper storeys, not unreachable floating walls.
if(c.height>2.8){box(x,2.94,z-1,10.2,c.height-2.8,10.2,cityColor(c,p));box(x,c.height+.14,z-1,10.4,.12,10.4,'#414b44');for(let dx of [-3,0,3]){box(x+dx,3.25,z+4.13,1.15,.65,.025,c.disturbance===2&&dx===0?'#16251f':'#657e7b');box(x+dx,3.52,z+4.16,1.2,.045,.04,'#c1b598')}}
// Street clutter remains off the connected pedestrian routes and entrances.
box(x-3.1,0,z+5.2,1.8,.45,.55,'#6c6150',true);box(x-3.1,.45,z+5.42,1.8,.45,.08,'#82745c');if(c.prop===1){cylinder(x+3.6,0,z+5.3,.28,.7,'#536158');box(x+3.6,.7,z+5.3,.65,.06,.65,'#313e36')}else if(c.prop===2){box(x+3.6,0,z+5.3,.7,.7,.7,'#676e52',true);foliage(x+3.6,.85,z+5.3,.45,'#506c46')}
let kind=p.kind;if(!kind)return;
if(['cafe','bakery','hotel'].includes(kind)){for(let side of [-1,1]){table(x+side*2.9,z-2.8,1.1,.7);for(let dz of [-.8,.8])box(x+side*2.9,0,z-2.8+dz,.6,.45,.5,'#76604d',true)}if(kind==='bakery')box(x-3,0,z-5,2,1.2,1,'#414d45',true)}
if(kind==='laundry'){for(let side of [-1,1])for(let j=0;j<3;j++){box(x+side*3.6,0,z-4+j*2,1.25,1.1,1.2,'#b9bdb1',true);box(x+side*3.6,.3,z-3.38+j*2,.65,.55,.025,'#3f575a')}}
if(['books','post','workshop'].includes(kind)){for(let side of [-1,1])for(let y of [.4,1.1,1.8]){box(x+side*4,y,z-1,.65,.07,7,'#726047');for(let j=0;j<6;j++)box(x+side*4,y+.07,z-4+j*1.1,.5,.4,.35,kind==='post'?'#b29f78':kind==='workshop'?'#8f987e':'#80615d')}}
if(['florist','greenhouse','market'].includes(kind)){for(let side of [-1,1])for(let j=0;j<3;j++){box(x+side*3,0,z-4+j*2,.8,.5,.8,'#827154',true);foliage(x+side*3,.65,z-4+j*2,.48,kind==='florist'?'#9c7d8b':'#547948')}}
if(['apartments','hotel'].includes(kind))for(let dx of [-3,3]){box(x+dx,0,z-5.84,1.2,2,.05,'#68563f');box(x+dx+.4,1,z-5.78,.06,.06,.06,'#c7b475')}
if(kind==='waterworks'){for(let dx of [-3,3]){cylinder(x+dx,0,z-3,.8,1.5,'#5b7777');box(x+dx,1.5,z-3,.07,.65,.07,'#b6ac80')}box(x,1.7,z-5.8,5,.12,.15,'#788a81')}
if(kind==='garage'){box(x-3,0,z-3,1.5,.5,3,'#536868',true);box(x-3,.5,z-3,1.3,.6,1.3,'#74918c');box(x+3,0,z-3,1,1,2,'#6b6653',true)}
if(kind==='playroom'){box(x-2.8,.3,z-3,1.3,.25,.5,'#8c7357');for(let dx of [-.5,.5])box(x-2.8+dx,0,z-3,.1,.3,.6,'#5d6850');box(x+3,0,z-4,1.2,.7,1.2,'#7b6e80',true)}
if(c.disturbance===4)box(x+3,1.1,z+4.17,.17,.65,.022,'#17271f');
}
function worldCodeMenu(){modal('World generation code','The same code generates the same 20 locations and scenery in v2.0.0. Starting from a code replaces this run; your ending journal is kept.',[['Start a new world from this code',()=>{let seed=seedFromCode(input.value);if(seed===null){error.textContent='Use SPARE-2- followed by eight hexadecimal characters (not all zero).';return}reset();s.worldSeed=seed;s.cityOpen=true;house.citySeed=null;house.chunks=null;cityWorld();s.room='city';save();render();$('modal').classList.remove('title-modal');close();start()}],['Back to the map',()=>showMap()]]);let input=document.createElement('input');input.value=worldCode();input.maxLength=16;input.setAttribute('aria-label','World generation code');input.style.cssText='width:100%;box-sizing:border-box;padding:12px;background:#15221b;color:#e1d8b7;border:1px solid #ad9b64;font:16px monospace';let error=document.createElement('p');error.setAttribute('role','alert');$('modal').append(input,error)}
