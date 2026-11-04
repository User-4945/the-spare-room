/* v2.7.6: optional evidence. No ending requirements or event clocks are changed. */
const wallEvidence=[
 {id:'plan',title:'The Incomplete Plan',p:[-5.8,4.42,9.83],axis:'z',text:'Exterior: 15 metres. Interior total: 12.\nA clean rectangle has no label.\n“Measurements verified. Do not correct the interior total.”'},
 {id:'receipt',title:'Paid in Full',p:[-2.2,1.35,9.88],axis:'z',text:'HOUSEHOLD MAINTENANCE — PAID\nRooms serviced: eight.\nYou can account for seven. Someone has circled EIGHT twice.'},
 {id:'place',title:'The Fourth Place',p:[-3.2,.88,7.8],axis:'floor',text:'A photograph tucked beneath a table mat. Four places are set.\nThe caption names three people.\nOn the back: “Please stop moving the fourth chair.”'},
 {id:'stamp',title:'4945',p:[-1.265,1.37,10.78],axis:'x',text:'A tiny maker’s stamp on the inspection plate: 4945.\nBeneath it, in smaller letters: TSR / KEEP THE OLD PARTS.\nIt is a maker’s mark, not an access code.'},
 {id:'key',title:'An Unused Key',p:[7.15,.28,-2.2],axis:'floor',text:'A small key wrapped in cloth, behind a pot.\nThe tag reads: “Returned. Door not found.”\nNone of the locks you know has this shape.'},
 {id:'fold',title:'The Old Fold',p:[.48,1.055,16.6],axis:'floor',text:'A pressed fragment caught in the diary’s binding.\n“We have already tried leaving it empty.”\nThe fold is older than the page.'},
 {id:'name',title:'A Name Removed',p:[5.35,.89,3.1],axis:'floor',text:'A loose index slip beside the Book of Names.\nThe alphabetical list leaves a deliberate space.\n“Do not restore entry.”'},
 {id:'coat',title:'The Wrong Coat',p:[6.7,4.45,6.48],axis:'z',text:'A child’s coat hangs behind the usual coats. Too small for the child you remember.\nMother remembers the coat. She does not remember buying it.\nThe sewn label says: AGAIN.'},
 {id:'glass',title:'Keep the Glass',p:[4.74,.78,2.3],axis:'z',text:'A repair mark in the lower mirror frame.\n“Replace frame only. Keep original glass.”\nThe signature has been scratched away.'},
 {id:'frame',title:'Frame 00',venue:'cinema',offset:[-2.5,.85,1.8],axis:'floor',text:'One loose frame remains in the projector’s film case.\nIt shows your hallway. There is one more door than you remember.\nThe edge is marked 00.'},
 {id:'address',title:'Return to Sender',p:[.93,1.12,1.1],axis:'floor',text:'An envelope in the letter rack, addressed to this house.\nROOM —\nThe room designation has been neatly cut away.\nNo return address.'},
 {id:'record',title:'Previously Recorded',venue:'library',offset:[-2.4,1,1.6],axis:'floor',text:'An archive report describes someone leaving a house with a family photograph.\n“They continued walking. No destination recorded.”\nIt is filed under HOUSEHOLD RETURNS.'},
 {id:'measure',title:'The Tailor’s Measure',p:[53.7,1.13,-33.6],axis:'floor',event:true,text:'VELVET & ASH — FAMILY ORDER\nFour fittings. Three customers attended.\nFourth fitting completed.\nThe measuring tape has been cut at the same number twice.'},
 {id:'answer',title:'The Answer After',venue:'chapel',offset:[-3,1.3,4.24],axis:'z',text:'Two taps from the wall beside the door.\nA pencilled instruction appears beneath an old bell label:\n“Knock here after they have finished answering.”'},
 {id:'pocket',title:'Inspection Pocket',p:[-.99,3.38,9.8],axis:'x',text:'The loose skirting opens onto a shallow inspection pocket.\nWallpaper samples. A recent inspection seal.\n“Leave sufficient space.”\nThere is no opening beyond it.'},
 {id:'rota',title:'Still on the Rota',p:[-2.85,1.5,2.12],axis:'z',text:'HOUSEHOLD DUTIES\nAn unnamed person has the same task every week: AIR THE ROOM.\nEvery completion box is checked.\n“The sealed section remains the responsibility of the household.”'}
];
const wallAchievements=[
 {id:'room',name:'A Room Short',description:'The numbers agree with each other. The house does not.',needs:['plan','receipt'],compare:true},
 {id:'four',name:'Set for Four',description:'Someone was expected.',needs:['place','coat','measure']},
 {id:'return',name:'Return Address Unknown',description:'You have the address. You have the key.',needs:['key','address']},
 {id:'plaster',name:'An Answer Through Plaster',description:'You knocked on the door. Something else answered.',needs:['answer']},
 {id:'space',name:'Leave Sufficient Space',description:'You noticed what had been left out.',all:true}
];
let wallRunTainted=false;
function wallPreview(){return wallRunTainted||!!window.spareAdmin?.isAuthenticated?.();}
function wallState(){if(!s.wallSecrets||s.wallSecrets.schema!==1)s.wallSecrets={schema:1,found:[],achievements:[],compared:false,visits:0,revisited:false};return s.wallSecrets;}
function wallPosition(n){if(!n.venue)return n.p;const c=cityWorld().find(c=>c.id===n.venue);return [c.x+n.offset[0],n.offset[1],c.z+n.offset[2]];}
function wallAvailable(n){return !n.event||week2WorldActive();}
function wallAchievementCheck(){const w=wallState();if(wallPreview())return;for(const a of wallAchievements){const ok=a.all?w.found.length===wallEvidence.length&&w.revisited:a.needs.every(id=>w.found.includes(id))&&(!a.compare||w.compared);if(ok&&!w.achievements.includes(a.id)){w.achievements.push(a.id);say('Secret achievement · '+a.name);}}}
function inspectWallEvidence(id){const n=wallEvidence.find(n=>n.id===id);if(!n||!wallAvailable(n))return;const w=wallState();if(window.spareAdmin?.isAuthenticated?.()){wallRunTainted=true;s.wallPreviewTainted=true;}
 if(id==='glass'&&!flags().mirror)return modal('Covered frame','The cloth conceals the repair mark.',[['Step back',close]]);
 if(id==='frame'&&!s.projectorSeen)return modal('Closed film case','Watch the projector’s film before examining the loose frame.',[['Step back',close]]);
 if(id==='answer'){if(!s.cityProgress?.chapel&&!week2State().resolved.includes('chapel'))return modal('An old bell label','Visit the chapel before trying the mark beside its door.',[['Step back',close]]);w.visits++;if(!w.found.includes(id)&&w.visits<3&&cityStream(s.worldSeed,'wall-answer-'+w.visits)()>.12){save();return modal('An old bell label','No answer. A faded pencil mark points toward the wall.',[['Step back',close]]);}tone(72,.15);setTimeout(()=>{if(!document.hidden)tone(58,.15);},420);}
 if(id==='pocket'&&w.found.length===wallEvidence.length)w.revisited=true;
 if(!w.found.includes(id))w.found.push(id);wallAchievementCheck();save();wallJournalButton.hidden=false;
 let text=n.text;if(id==='record'&&endingBook.some(e=>/outside|first bus|we were here/i.test(e.title)))text+='\n\nIn your journal, you recognise the shape of an earlier departure.';
 if(id==='pocket'&&w.revisited)text+='\n\nThere is one new line: “Thank you for noticing.”';
 modal(n.title,text,[['Put it back',close],['Unfiled Evidence',wallJournal]]);
}
function wallJournal(){const w=wallState(),found=wallEvidence.filter(n=>w.found.includes(n.id));let text=found.map(n=>n.title+'\n'+n.text).join('\n\n');text+='\n\nSECRET ACHIEVEMENTS\n'+wallAchievements.map(a=>w.achievements.includes(a.id)?'✓ '+a.name+' — '+a.description:'□ Secret achievement').join('\n');if(wallPreview())text+='\n\nAdmin preview: achievements are disabled for this story.';
 modal('Unfiled Evidence · '+found.length+'/16',text||'No evidence filed.',[...(w.found.includes('plan')&&w.found.includes('receipt')?[['Compare the room counts',()=>{w.compared=true;wallAchievementCheck();save();modal('A room short','The plan and receipt agree. The rooms you can reach do not.',[['Back to evidence',wallJournal],['Close',close]]);}]]:[]),['Close',close]]);
}
const wallJournalButton=document.createElement('button');wallJournalButton.textContent='UNFILED EVIDENCE';wallJournalButton.hidden=!wallState().found.length;wallJournalButton.onclick=wallJournal;toolbar.append(wallJournalButton);
const wallTargetsBase=targets;targets=function(){return wallTargetsBase().concat(wallEvidence.filter(wallAvailable).map(n=>({id:'wall:'+n.id,name:n.title,action:n.id==='answer'?'Knock beside the bell':n.id==='pocket'?'Inspect loose skirting':'Examine '+n.title,p:wallPosition(n),wallEvidence:n.id,fn:()=>inspectWallEvidence(n.id)})));};
const wallSurfaceBase=surface;surface=function(t){if(t.wallEvidence){const n=wallEvidence.find(n=>n.id===t.wallEvidence);return wallQuad(n);}return wallSurfaceBase(t);};
function wallQuad(n){const p=wallPosition(n);return n.axis==='floor'?[[p[0]-.14,p[1],p[2]-.1],[p[0]+.14,p[1],p[2]-.1],[p[0]+.14,p[1],p[2]+.1],[p[0]-.14,p[1],p[2]+.1]]:quadAt(p,.28,.22,n.axis);}
const wallBuildBase=buildHouse;buildHouse=function(){wallBuildBase();for(const n of wallEvidence.filter(wallAvailable)){const [x,y,z]=wallPosition(n),paper=!['key','coat','pocket','stamp'].includes(n.id);if(n.venue&&n.id!=='answer'){box(x,y-.08,z,.38,.06,.3,'#685b46');for(const dx of [-.15,.15])box(x+dx,0,z,.035,y-.08,.035,'#685b46');}if(n.id==='address')box(x,y-.08,z,.36,.06,.25,'#685b46');box(x,y-(n.axis==='floor'?0:.11),z,n.axis==='x'?.018:.28,n.axis==='floor'?.012:.22,n.axis==='z'?.018:.2,paper?'#c7baa0':n.id==='key'?'#9c8554':'#645c4e');if(n.id==='key')box(x+.08,y+.013,z,.12,.015,.025,'#9c8554');if(n.id==='coat')box(x,y-.3,z,.2,.3,.04,'#535e54');}}
const wallDecalsBase=drawDecals;drawDecals=function(){wallDecalsBase();for(const n of wallEvidence){if(!wallAvailable(n))continue;const p=wallPosition(n);if(Math.hypot(p[0]-house.x,p[2]-house.z)<4&&visibleTo({p}))drawDecal(textTexture('wall-'+n.id,[n.id==='stamp'?'4945':n.id==='answer'?'AFTER THE ANSWER':n.title.toUpperCase(),'HOUSEHOLD RECORD'],'#c7baa0'),wallQuad(n));}};
const wallResetBase=reset;reset=function(){wallRunTainted=false;const r=wallResetBase.apply(this,arguments);wallJournalButton.hidden=true;return r;};
// Keep admin preview progress separate even if the panel is subsequently locked.
if(window.spareAdmin){const original=window.spareAdmin;window.spareAdmin=Object.freeze({...original,dispatch:async(...args)=>{const r=await original.dispatch(...args);if(r?.ok&&['start','teleport','anomaly','sanity','day','toggle'].includes(args[0])){wallRunTainted=true;s.wallPreviewTainted=true;}return r;}});}
wallRunTainted=!!s.wallPreviewTainted;
const wallVersion=document.createElement("span");wallVersion.textContent="v2.7.6 · Prerelease";wallVersion.className="secret-count";toolbar.append(wallVersion);
buildHouse();render();
