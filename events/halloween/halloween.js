/* All Hallows' Eve is loaded only by the separate event build.
 * Its save keys are rewritten by prepare-halloween.cjs before the game starts.
 * World-space props use the same +Z gameplay / -Z Three.js convention as the house.
 */
'use strict';
const halloweenSeals = [
  {id:'library', name:'The name', word:'REMEMBER', title:'THE NAME / I', text:'The archive kept the names of everyone who never came home.\nLight this lantern for the forgotten.\nThe cinema holds the face. The chapel holds the voice.'},
  {id:'cinema', name:'The face', word:'RECOGNISE', title:'THE FACE / II', text:'Tonight the audience is wearing your face.\nLight this lantern, but do not give the audience your name.\nIf Mother remembers you, her porch light can still lead you home.'},
  {id:'chapel', name:'The voice', word:'RELEASE', title:'THE VOICE / III', text:'Three lanterns. One bell. No more borrowed children.\nAfter midnight, ring the bell in your garden.\nGive them a way home, or let the procession take you. The tall guest has a spare mask.'}
];
const halloweenEndings = {
  hearth: ['Ending 32 · Leave the porch light on', 'Mother waits beneath the porch lamp. You ring the bell once and speak the name she gave you.\nThe masks on the street split like autumn leaves. Every child finds a different house.\nAt breakfast, Mother sets two places. A third chair remains by the fire, just in case.'],
  unmask: ['Ending 33 · Nobody beneath the masks', 'You ring the bell three times. The lanterns breathe out together.\nA hundred masks settle onto an empty street. Beneath each one is a name the city had forgotten.\nAt sunrise, you pin the names to the garden gate. Someone has crossed yours out.'],
  procession: ['Ending 34 · The last trick-or-treater', 'The mask fits before it touches your face. You take the last place in the procession.\nAt each doorway, another family remembers you for a moment. At your own house, Mother gives you a sweet.\n“Be careful on your way home,” she says. You cannot remember where that is.'],
  guest: ['Ending 35 · A place at the table', 'You tell the tall guest where you live. It thanks you in your own voice.\nWhen you reach the kitchen, it is already sitting beside Mother. She asks you to take off your mask.\nYou reach for your face. There is a seam beneath your chin.']
};

function halloweenState() {
  if (!s.halloween || !Array.isArray(s.halloween.notes)) {
    s.halloween = {invitation:false, notes:[], seals:[], treats:[], candy:0, offering:0,
      mask:false, promise:false, elapsed:0, midnight:false};
  }
  return s.halloween;
}
function halloweenReady() {
  const h = halloweenState();
  return h.invitation && h.midnight && halloweenSeals.every(n => h.seals.includes(n.id));
}
function halloweenEndingAllowed(id) {
  const h = halloweenState();
  if (s.ending || s.sanityLost) return false;
  if (id === 'guest') return h.invitation && h.offering === 3;
  return halloweenReady() && (id === 'unmask' || id === 'hearth' && h.promise || id === 'procession' && h.mask);
}
const halloweenPreviousEnding = ending;
ending = function(id) {
  if (!id.startsWith('halloween:')) return halloweenPreviousEnding(id);
  const key = id.slice(10), data = halloweenEndings[key];
  if (!data || !halloweenEndingAllowed(key)) return;
  s.ending = {title:data[0], body:data[1]};
  save(); showEnding();
};
function halloweenFinish(key) {
  if (!halloweenEndingAllowed(key)) return;
  modal('End this Halloween story?', halloweenEndings[key][0] + '\nThis finishes this run and keeps the ending in your Halloween journal.', [
    ['Choose this ending', () => ending('halloween:' + key)], ['Keep exploring', close]
  ]);
}
function halloweenReadInvitation() {
  const h = halloweenState(), first = !h.invitation;
  h.invitation = true; save();
  modal('An invitation with no sender', 'ALL HALLOWS’ EVE\n\nThree lanterns are waiting: in the Municipal Archives, Orpheum Cinema and Chapel of the Echo. Read the folded note beside each one, then light its seal.\n\nAfter midnight, return to the bell in your garden. The bell will wait for you.\n\nAsk Mother to leave the porch light on. The masked neighbours are handing out sweets. Do not tell the tall guest where you live.', [['Fold the invitation', close]]);
  if (first) queueSanity(3);
}
function halloweenReadNote(id) {
  const n = halloweenSeals.find(n => n.id === id);
  if (!n) return;
  const h = halloweenState(), first = !h.notes.includes(id);
  if (first) h.notes.push(id);
  save(); modal(n.title, n.text, [['Put the note down', close]]);
  if (first) queueSanity(4);
}
function halloweenLightSeal(id) {
  const n = halloweenSeals.find(n => n.id === id);
  if (!n) return;
  const h = halloweenState();
  if (!h.invitation || !h.notes.includes(id)) {
    return modal('An unlit face', !h.invitation ? 'Read the invitation on the hallway wall first. The HALLOWEEN journal can guide you there.' : 'The folded note on this pedestal explains which word belongs to the lantern.', [['Step back', close]]);
  }
  if (h.seals.includes(id)) return modal('The seal is burning', 'This lantern already remembers its word: ' + n.word + '.', [['Leave it burning', close]]);
  modal(n.name + ' lantern', 'A word appears inside the carved mouth: ' + n.word + '.\nLighting it will bind this seal to the bell in your garden.', [
    ['Light the seal', () => {
      if (h.seals.includes(id)) return close();
      h.seals.push(id); save();
      modal('A flame on the other side', 'The candle lights without a match. For a moment, someone looks out through the carved eyes.\n\nLantern seals: ' + h.seals.length + ' / 3.' + (h.seals.length === 3 ? '\nThe garden bell is waiting.' : ''), [['Step away', close]]);
      queueSanity(6);
    }], ['Leave it unlit', close]
  ]);
}
function halloweenPromise() {
  const h = halloweenState(); h.promise = true; save();
  modal('Mother leaves the porch light on', '“You can always come home,” she says. “Even if you forget what you look like.”\n\nYou ask her to wait by the light. After the three seals are lit, the garden bell can lead you both out.', [['Thank her', close]]);
}
const halloweenPreviousTargets = targets;
targets = function() {
  const all = halloweenPreviousTargets();
  const mother = all.find(t => t.name === 'Speak to Mother');
  if (mother) {
    const original = mother.fn;
    mother.fn = () => modal('Mother · Halloween night', 'She has put an extra bowl of sweets on the table.\n“One for the children who got lost,” she says.', [
      ['Ask her to leave the porch light on', halloweenPromise], ['Talk about the house', original], ['Back', close]
    ]);
  }
  return all.concat([
    {name:'Halloween invitation',p:[-1.28,1.55,4.45],event:'invitation',fn:halloweenReadInvitation},
    {name:'Midnight garden bell',p:[2,1.15,-8.3],event:'bell',fn:halloweenBell},
    {name:'The tall guest',p:[-1.5,1.25,-9.1],event:'guest',fn:halloweenGuest},
    ...halloweenSeals.flatMap(n => {
      const c = cityWorld().find(c => c.id === n.id);
      return [
        {name:n.title + ' · folded note',p:[c.x+1.8,.87,c.z+1.26],event:'note',fn:() => halloweenReadNote(n.id)},
        {name:n.name + ' lantern',p:[c.x+1.8,1.3,c.z+1],event:'lantern',fn:() => halloweenLightSeal(n.id)}
      ];
    })
  ]);
};
const halloweenPreviousSurface = surface;
surface = function(t) {
  if (!t.event) return halloweenPreviousSurface(t);
  return quadAt(t.p, t.event === 'note' ? .38 : t.event === 'guest' ? .55 : .6,
    t.event === 'guest' ? 1.6 : t.event === 'invitation' ? .46 : t.event === 'note' ? .22 : .6,
    t.event === 'invitation' ? 'x' : 'z');
};
const halloweenPreviousResident = speakResident;
speakResident = function(id) {
  if (!residentNames[id]) return halloweenPreviousResident(id);
  const h = halloweenState(), taken = h.treats.includes(id);
  modal(residentNames[id][0] + ' · behind the mask', taken ? '“One sweet per visitor,” they whisper. “You have already been here. We remember your footsteps.”' : 'A paper mask hides their face. They offer one wrapped sweet. The wrapper has your name on it.', [
    ...(!taken ? [['Trick or treat', () => {
      if (!h.treats.includes(id)) { h.treats.push(id); h.candy++; save(); }
      modal('A sweet with your name on it', 'Keep three sweets for the tall guest by the garden gate, or eat one from the Halloween journal to restore 4% sanity.\n\nSweets carried: ' + h.candy, [['Put it in your pocket', close]]);
    }]] : []),
    ['Ask about this place', () => halloweenPreviousResident(id)], ['Goodbye', close]
  ]);
};
function halloweenEatSweet() {
  const h = halloweenState();
  if (h.candy < 1 || s.ending || s.sanityLost) return;
  if (s.sanity >= 100) return modal('Save it for later', 'Your sanity is already full.', [['Back', halloweenJournal]]);
  h.candy--; s.sanity = Math.min(100, s.sanity + 4); save(); sanityDisplay();
  modal('A familiar taste', 'Orange peel. Burnt sugar. A Halloween you almost remember.\nSanity restored by up to 4%.', [['Keep exploring', close]]);
}
function halloweenGuest() {
  const h = halloweenState();
  if (!h.invitation) return modal('The tall guest', '“You have not read your invitation.”\nThe figure points towards your hallway without moving its arm.', [['Step away', close]]);
  if (h.offering !== 3) return modal('The tall guest', '“Three sweets,” it says. “One for each face I used to have.”\n\nThe six masked neighbours near the station, archives, cinema, clinic, chapel and radio building each have one.\nYou carry ' + h.candy + '.', [
    ...(h.candy >= 3 ? [['Offer three sweets', () => {
      if (h.candy < 3 || h.offering === 3) return;
      h.candy -= 3; h.offering = 3; save();
      modal('An empty hand', 'The sweets vanish through the paper mask. There is no mouth beneath it.\n“Now we can be introduced.”', [['Look up', () => { close(); if (!s.sanityLost) halloweenGuest(); }]]);
      queueSanity(5);
    }]] : []), ['Step away', close]
  ]);
  modal('It has saved you a place', 'The guest holds out a spare mask.\n“Wear this, and the procession will recognise you.”\n\nThen, quietly: “Or tell me where you live.”', [
    ...(!h.mask ? [['Take the spare mask', () => {
      h.mask = true; save(); modal('The last mask', 'It is warm on the inside.\nAfter the three seals are lit and midnight has passed, the garden bell can call the procession.', [['Keep it in your pocket', close]]); queueSanity(5);
    }]] : []),
    ['Tell it where you live', () => halloweenFinish('guest')], ['Keep your address to yourself', close]
  ]);
}
function halloweenBell() {
  const h = halloweenState();
  if (!halloweenReady()) return modal('The midnight bell', 'An iron bell hangs above a circle of leaves.\n\n' +
    (!h.invitation ? 'Read the hallway invitation.\n' : '') + 'Lantern seals: ' + h.seals.length + ' / 3.\n' +
    (h.midnight ? 'Midnight has passed. The bell is still waiting for the seals.' : 'Midnight arrives after 90 seconds of active play. Reading and menus pause the countdown.') +
    '\n\nThe Halloween journal gives directions to each seal.', [['Keep exploring', close]]);
  modal('Who comes home tonight?', 'The three lanterns cast one shadow. The bell is waiting for your answer.\n\n' +
    (!h.promise ? 'Mother can leave the porch light on if you ask her.\n' : '') +
    (!h.mask ? 'The tall guest by the garden gate has a spare mask.' : 'The spare mask is breathing inside your pocket.'), [
    ...(h.promise ? [['Ring once · follow Mother’s porch light', () => halloweenFinish('hearth')]] : []),
    ['Ring three times · release the borrowed names', () => halloweenFinish('unmask')],
    ...(h.mask ? [['Wear the mask · join the procession', () => halloweenFinish('procession')]] : []),
    ['Keep exploring', close]
  ]);
}

function halloweenTravel(place) {
  let position;
  if (place === 'invitation') {position=[0,4.45,-Math.PI/2];s.room='hall';}
  else if (place === 'bell') {position=[2,-6.5,Math.PI];s.room='garden';}
  else if (place === 'guest') {position=[-1.5,-7.3,Math.PI];s.room='garden';}
  else {
    const c=cityWorld().find(c=>c.id===place); if (!c) return;
    s.cityOpen=true;position=[c.x+1.8,c.z+2.8,Math.PI];s.room=place;
  }
  [house.x,house.z,house.a]=position;house.pitch=0;house.jumpHeight=0;house.jumpVelocity=0;
  save();close();
}
function halloweenJournal() {
  const h=halloweenState();
  const details=halloweenSeals.map(n=>(h.seals.includes(n.id)?'✓ ':'○ ')+n.name+' — '+cityPlaces.find(p=>p.id===n.id).name+(h.notes.includes(n.id)?' · note read':'')).join('\n');
  modal('All Hallows’ Eve · field notes', 'Find the invitation, read each folded note, and light the three lanterns. Return to the garden bell after midnight.\n\n'+details+'\n\nSweets: '+h.candy+' · Mask: '+(h.mask?'collected':'missing')+'\nPorch light: '+(h.promise?'Mother is waiting':'ask Mother in the kitchen')+'\n'+(h.midnight?'Midnight has passed. There is no time limit to finish.':'Midnight countdown pauses whenever you read.'), [
    ['Hallway invitation',()=>halloweenTravel('invitation')],
    ...halloweenSeals.map(n=>[n.name+' lantern',()=>halloweenTravel(n.id)]),
    ['Garden bell',()=>halloweenTravel('bell')],['The tall guest',()=>halloweenTravel('guest')],
    ...(h.candy>0?[['Eat a sweet (+4% sanity)',halloweenEatSweet]]:[]), ['Keep exploring',close]
  ]);
}
const halloweenPreviousTasks=taskRows;
taskRows=function(){
  const h=halloweenState();
  return [
    {label:'Read the Halloween invitation',done:h.invitation},
    ...halloweenSeals.map(n=>({label:'Light '+n.name.toLowerCase()+' seal · '+cityPlaces.find(p=>p.id===n.id).name,done:h.seals.includes(n.id)})),
    {label:'Return to the garden bell after midnight',done:!!s.ending}
  ];
};
const halloweenPreviousChecklist=updateChecklist;
updateChecklist=function(){
  halloweenPreviousChecklist();
  const heading=taskHUD.querySelector('.task-heading'),count=taskHUD.querySelector('.secret-count');
  if(heading)heading.textContent='ALL HALLOWS’ EVE · TASKS';
  if(count)count.textContent='38 ENDINGS · '+endingBook.length+' FOUND · '+currentMode().name.toUpperCase();
};
endingJournal=function(){modal('Halloween ending journal · '+endingBook.length+'/38',endingBook.length?endingBook.map(e=>'✓ '+e.title).join('\n'):'31 original paths and seven Halloween endings. This event keeps its own ending journal.',[['Back',close]])};

const halloweenHUD=document.createElement('div');halloweenHUD.className='halloween-status';gameScene.append(halloweenHUD);
function halloweenDisplay(){
  const h=halloweenState(),remaining=Math.max(0,Math.ceil(90-h.elapsed));
  const text=(h.midnight?'MIDNIGHT · THE BELL IS WAITING':'MIDNIGHT IN '+Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0'))+'\nSEALS '+h.seals.length+'/3 · SWEETS '+h.candy;
  if(halloweenHUD.textContent!==text)halloweenHUD.textContent=text;
  const objective=taskRows().find(task=>!task.done)?.label||'Halloween story complete.';
  if($('objective').textContent!==objective)$('objective').textContent=objective;
}
function advanceHalloween(dt){
  if(!s.started||paused()||s.ending||s.sanityLost)return;
  const h=halloweenState();h.elapsed+=Math.max(0,Math.min(.1,dt));
  if(!h.midnight&&h.elapsed>=90){
    h.midnight=true;tone(62,2.4);save();
    say('Midnight. A bell sounds from your garden, though nobody is standing beside it. The ritual will wait until you are ready.');
  }
  halloweenDisplay();
}
const halloweenPreviousMovement=updateMovement;
updateMovement=function(dt){halloweenPreviousMovement(dt);advanceHalloween(dt)};

// Only the small pedestals collide. Decoration stays away from doors and paths.
const halloweenPreviousBuild=buildHouse;
buildHouse=function(){
  halloweenPreviousBuild();
  box(-1.3,1.32,4.45,.035,.46,.36,'#e0b885');
  for(const n of halloweenSeals){const c=cityWorld().find(c=>c.id===n.id);
    box(c.x+1.8,0,c.z+1,.46,.94,.46,'#514037',true);
    box(c.x+1.8,.76,c.z+1.24,.38,.22,.025,'#d6b98b');
    if(!advancedEngine||advancedEngine.failed)box(c.x+1.8,.96,c.z+1,.45,.44,.43,'#d07a32');
  }
  for(const x of [1.58,2.42])box(x,0,-8.3,.07,1.75,.07,'#675144',true);
  box(2,1.75,-8.3,.96,.08,.12,'#675144');
  if(!advancedEngine||advancedEngine.failed){box(2,1,-8.3,.4,.5,.4,'#ac8353');box(-1.5,0,-9.1,.38,1.7,.32,'#26202b');}
};

function createHalloweenVisuals(e){
  const T=THREE,root=new T.Group();root.name='halloween-pool';e.scene.add(root);
  const material=(color,glow)=>new T.MeshStandardMaterial({color,roughness:.8,...(glow?{emissive:color,emissiveIntensity:1.3}:{})});
  const orange=material('#b9541e'),stem=material('#625535'),glow=material('#ffd18b',true),wax=material('#c4b191');
  const dark=material('#29212d'),ivory=material('#ded1b5'),black=material('#201c24');
  const sphere=new T.SphereGeometry(1,12,9),stemGeo=new T.CylinderGeometry(.04,.065,.16,7);
  const pumpkinParts=[];
  function mesh(parent,geo,mat,x,y,z,sx=1,sy=1,sz=1){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
  function triangle(parent,x,y,scale){const shape=new T.Shape();shape.moveTo(-scale,0);shape.lineTo(0,scale*1.4);shape.lineTo(scale,0);shape.closePath();mesh(parent,new T.ShapeGeometry(shape),glow,x,y,.318);}
  function pumpkin(size=1){const g=new T.Group();root.add(g);g.scale.setScalar(size);
    mesh(g,sphere,orange,0,.28,0,.34,.27,.3);for(let i=0;i<7;i++){let a=i*Math.PI*2/7;mesh(g,sphere,orange,Math.sin(a)*.15,.28,Math.cos(a)*.13,.19,.275,.17);}
    mesh(g,stemGeo,stem,0,.58,0).rotation.z=.2;
    triangle(g,-.12,.34,.075);triangle(g,.12,.34,.075);
    const mouth=new T.Shape();mouth.moveTo(-.18,.23);mouth.lineTo(-.11,.13);mouth.lineTo(.12,.13);mouth.lineTo(.19,.23);mouth.lineTo(.07,.18);mouth.lineTo(0,.22);mouth.lineTo(-.07,.18);mouth.closePath();mesh(g,new T.ShapeGeometry(mouth),glow,0,0,.297);
    pumpkinParts.push(g);return g;
  }
  const home=[[-.95,.015,-1.2],[.95,.015,-1.2],[1.75,.015,-3],[3,.015,-8.6],[-.85,.015,9],[-.8,3.21,2.7],[6.9,3.21,5.8]];
  const decorations=Array.from({length:47},(_,i)=>pumpkin(i<home.length?.85:.85+(i%3)*.12));
  const seals=halloweenSeals.map(n=>({id:n.id,group:pumpkin(1),light:new T.PointLight('#ffb56c',0,4,2)}));
  for(const item of seals){root.add(item.light);item.faceMaterial=glow.clone();item.group.traverse(m=>{if(m.material===glow)m.material=item.faceMaterial;});}
  const bell=new T.Group();bell.position.set(2,1.05,8.3);root.add(bell);
  mesh(bell,new T.CylinderGeometry(.15,.28,.38,16,1,true),material('#ac8150'),0,.12,0);
  mesh(bell,new T.TorusGeometry(.28,.025,6,18),wax,0,-.07,0).rotation.x=Math.PI/2;
  mesh(bell,sphere,black,0,-.025,0,.05,.08,.05);
  const bellLabel=engineLabel(root,['MIDNIGHT','ONE / THREE / FOLLOW'],2,.7,8.42,.76,.23,{bg:'#251d26',fg:'#e9bd89',font:'Georgia',border:'#aa815b'});bellLabel.rotation.y=Math.PI;
  const invitation=engineLabel(root,['ALL HALLOWS’ EVE','THREE LANTERNS. ONE BELL.'], -1.275,1.55,-4.45,.36,.46,{bg:'#e0b885',fg:'#402c26',font:'Georgia',border:'#714936'});invitation.rotation.y=Math.PI/2;
  const labels=halloweenSeals.map(n=>{let m=engineLabel(root,[n.title,'READ BEFORE LIGHTING'],0,0,0,.38,.22,{bg:'#d6b98b',fg:'#3e2b26',font:'Georgia',border:'#866148'});m.rotation.y=Math.PI;return m;});
  function maskedFigure(parent,scale=1){const g=new T.Group();parent.add(g);g.scale.setScalar(scale);
    mesh(g,new T.ConeGeometry(.24,1.45,8),dark,0,.8,0);
    mesh(g,sphere,ivory,0,1.63,.03,.135,.19,.10);
    for(const side of [-1,1])mesh(g,sphere,black,side*.045,1.66,.122,.025,.033,.012);
    mesh(g,new T.CylinderGeometry(.035,.04,.9,6),dark,-.23,.95,0).rotation.z=-.1;
    mesh(g,new T.CylinderGeometry(.035,.04,.9,6),dark,.23,.95,0).rotation.z=.1;
    return g;
  }
  const guest=maskedFigure(root,1.15);guest.position.set(-1.5,0,9.1);guest.rotation.y=Math.PI;
  const parade=new T.Group();root.add(parade);const walkers=Array.from({length:5},(_,i)=>{let g=maskedFigure(parade,.8+i*.035);g.position.x=(i-2)*1.15;return g;});
  // Masks are parented to existing articulated residents and share their motion.
  for(const actor of e.actors){if(actor.root.getObjectByName('halloween-mask'))continue;
    const mask=mesh(actor.torso,sphere,ivory,0,1.57,.11,.12,.16,.065);mask.name='halloween-mask';
    for(const side of [-1,1])mesh(mask,sphere,black,side*.37,.14,.86,.18,.18,.11);
  }
  const batGeometry=new T.BufferGeometry();batGeometry.setAttribute('position',new T.Float32BufferAttribute([-.36,0,0,-.1,.09,0,0,0,0,0,0,0,.1,.09,0,.36,0,0],3));
  const batMaterial=new T.MeshBasicMaterial({color:'#201725',side:T.DoubleSide});
  const bats=Array.from({length:8},()=>mesh(root,batGeometry,batMaterial,0,0,0));
  e.halloween={root,decorations,home,seals,labels,bell,guest,parade,walkers,bats,seed:null};return e.halloween;
}
const halloweenPreviousVisuals=updateAnomalyVisuals;
updateAnomalyVisuals=function(e){
  halloweenPreviousVisuals(e);
  const pool=e.halloween||createHalloweenVisuals(e),h=halloweenState(),t=h.elapsed;
  if(pool.seed!==s.worldSeed){
    const placements=pool.home.concat(cityWorld().flatMap(c=>[[-2.2,0,5],[2.2,0,5]].map(([x,y,z])=>[c.x+x,y,c.z+z])));
    pool.decorations.forEach((g,i)=>{const p=placements[i];g.position.set(p[0],p[1],-p[2]);g.rotation.y=Math.PI;});
    pool.seals.forEach((item,i)=>{const c=cityWorld().find(c=>c.id===item.id);item.group.position.set(c.x+1.8,.96,-(c.z+1));item.group.rotation.y=Math.PI;item.light.position.set(c.x+1.8,1.5,-(c.z+1));pool.labels[i].position.set(c.x+1.8,.87,-(c.z+1.258));});
    const station=cityWorld().find(c=>c.id==='station');pool.parade.position.set(station.x,0,-(station.z+6.2));pool.seed=s.worldSeed;
  }
  const daylight=worldDaylight(),sky=new THREE.Color().lerpColors(new THREE.Color('#292335'),new THREE.Color('#a18e87'),daylight);
  e.scene.background=sky;e.scene.fog.color.copy(sky);e.hemi.color.set('#e2c9d5');
  e.ambient.intensity=Math.max(.43,e.ambient.intensity);e.torch.intensity=Math.max(8,e.torch.intensity);
  pool.seals.forEach(item=>{const lit=h.seals.includes(item.id);item.light.intensity=lit?2.3:0;item.faceMaterial.emissiveIntensity=lit?1.8:.08;item.group.scale.setScalar(lit?1.05:1);});
  // The pumpkins turn only while outside the player's forward view. No flicker.
  for(const g of pool.decorations){const dx=g.position.x-house.x,dz=-g.position.z-house.z,dist=Math.hypot(dx,dz);g.visible=dist<27;if(dist<11&&dist>.5&&(dx*Math.sin(house.a)+dz*Math.cos(house.a))/dist<.45)g.rotation.y=Math.atan2(-dx,dz);}
  const phase=(t-90)%72,show=h.midnight&&phase>=0&&phase<18&&!s.ending&&!s.sanityLost;
  pool.parade.visible=show;
  if(show)pool.walkers.forEach((g,i)=>{g.position.x=(i-2)*1.15+Math.sin(phase/18*Math.PI)*.65;g.position.y=.025+Math.sin(phase*1.3+i)*.025;g.rotation.y=Math.PI;});
  pool.guest.lookAt(house.x,0,-house.z);
  pool.bell.rotation.z=h.midnight?Math.sin(t*.7)*.07:0;
  pool.bats.forEach((b,i)=>{let a=t*.23+i*.8;b.position.set(Math.sin(a)*5,4.9+Math.sin(a*1.7+i)*.5,6+Math.cos(a)*3);b.rotation.y=-a;b.rotation.z=Math.sin(t*6+i)*.25;});
  halloweenDisplay();
};

const halloweenPreviousReset=reset;
reset=function(){
  halloweenPreviousReset();s.halloween=null;halloweenState();s.worldSeconds=180;s.cityOpen=true;
  save();render();clockDisplay();halloweenDisplay();titleScreen();
};
titleScreen=function(){
  if(locked())document.exitPointerLock();house.keys={};
  modal('THE SPARE ROOM','',[]);
  const panel=$('modal');panel.classList.remove('title-modal');panel.classList.add('halloween-title');panel.replaceChildren();
  function add(tag,cls,text){const el=document.createElement(tag);el.className=cls;el.textContent=text;panel.append(el);return el;}
  const moon=add('div','halloween-moon','');moon.setAttribute('aria-hidden','true');
  add('p','event-kicker','v.2.5.0 · HALLOWEEN UPDATE');
  add('h2','','THE SPARE ROOM');add('p','event-subtitle','All Hallows’ Eve');
  add('p','event-story','The neighbourhood has dressed for Halloween. The people behind the masks have not. Find three lanterns before you answer the midnight bell. Mother has left a light on for you.');
  const chips=add('div','event-chips','');for(const text of ['7 NEW ENDINGS','3 LANTERN SEALS','A SEPARATE SAVE']){let chip=document.createElement('span');chip.textContent=text;chips.append(chip);}
  const modes=add('div','difficulty-grid','');for(const [id,m]of Object.entries(gameModes)){
    const b=document.createElement('button');b.className='difficulty-card'+(s.difficulty===id?' selected':'');
    const name=document.createElement('strong');name.textContent=m.name;const detail=document.createElement('span');detail.textContent=id==='easy'?'A gentler haunt. More recovery, fewer scares.':id==='hard'?'The masks notice you. Faster sanity loss.':'A balanced night. Keep your lantern close.';b.append(name,detail);
    b.onclick=()=>{const begin=()=>{reset();s.difficulty=id;save();panel.classList.remove('halloween-title');close();start();say('An orange invitation waits on the hallway wall. Press HALLOWEEN for your field notes and directions.');};
      if(s.started&&!s.ending&&!s.sanityLost)modal('Start a new Halloween run?','This replaces only your current Halloween run. Your Halloween ending journal is kept.',[['Start '+m.name+' game',begin],['Back',titleScreen]]);else begin();};modes.append(b);
  }
  const actions=add('div','event-actions','');
  function button(label,fn,cls){const b=document.createElement('button');b.textContent=label;b.className=cls||'';b.onclick=fn;actions.append(b);}
  if(s.started&&!s.ending&&!s.sanityLost)button('Continue · '+currentMode().name,()=>{panel.classList.remove('halloween-title');close();start();},'event-continue');
  button('How to play',()=>modal('A guide to All Hallows’ Eve','WASD walk · Shift sprint · Space jump\nClick to capture the mouse · E / click to interact\nOn touchscreens: drag to look, use the movement and USE buttons.\n\nRead the hallway invitation. Find notes and lanterns in the archives, cinema and chapel. Return to the garden bell after midnight. The HALLOWEEN button contains directions.\n\nMasked neighbours have sweets. Mother can leave a light on. The tall guest is waiting by the gate.\n\nThe original 31 endings are also available. Reading and menus pause the countdown and scares. Audio is optional.',[['Back',titleScreen]]));
  add('p','event-footnote','38 possible endings · Original saves stay separate · No calendar lock: play whenever you like.');
};
// Resolve callbacks at click time; existing controls captured the earlier title function.
menuButton.onclick=()=>titleScreen();journalButton.onclick=()=>endingJournal();
const halloweenButton=document.createElement('button');halloweenButton.textContent='HALLOWEEN';halloweenButton.onclick=halloweenJournal;toolbar.append(halloweenButton);
const halloweenPreviousModal=modal;
modal=function(...args){$('modal').classList.remove('halloween-title');return halloweenPreviousModal(...args)};
document.body.classList.add('halloween-event');
const eventLogo=document.querySelector('.logo');if(eventLogo)eventLogo.textContent='THE SPARE ROOM · ALL HALLOWS’ EVE';
if(!s.halloween){halloweenState();s.worldSeconds=180;s.cityOpen=true;}
save();render();clockDisplay();halloweenDisplay();titleScreen();
