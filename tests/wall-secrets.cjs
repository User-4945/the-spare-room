const fs=require('node:fs'),{context,vm}=require('./game-smoke.cjs');
for(const n of ['halloween','more-halloween','action-prompts','release-event','week2','third-person','week3','event-quality','halloween-interactions','maintenance','wall-secrets'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),context);
vm.runInContext(`{
const check=(v,m)=>{if(!v)throw Error(m)};reset();enterReleaseWeek('week1');s.started=true;close();house.x=0;house.z=4;house.jumpHeight=0;house.a=0;buildHouse();renderAdvanced();check(!advancedEngine.failed,'Renderer failed');
check(wallEvidence.length===16&&new Set(wallEvidence.map(n=>n.id)).size===16,'Evidence count');check(wallAchievements.length===5,'Achievement count');
check(!visibleTo({p:[0,4.3,4]}),'Upstairs text through slab');house.jumpHeight=3.2;s.room='upper_landing';check(!visibleTo({p:[0,1.2,4]}),'Ground text through upstairs floor');check(visibleTo({p:[0,4.5,5]}),'Same-floor visibility');
check(!clearWorldSegment([0,1.5,4],[.03,4.5,4.01]),'Steep ray leaks');check(clearWorldSegment([-2.5,2,-4],[-2.5,3.5,-3]),'Open exterior stair incorrectly blocked');
let before=s.sanity;inspectWallEvidence('plan');close();inspectWallEvidence('receipt');close();check(s.sanity===before,'Evidence costs sanity');check(!wallState().achievements.includes('room'),'Compare gate');wallState().compared=true;wallAchievementCheck();check(wallState().achievements.includes('room'),'Room achievement');
for(const id of ['key','address']){inspectWallEvidence(id);close();}check(wallState().achievements.includes('return'),'Return achievement');
enterReleaseWeek('week2');for(const id of ['place','coat','measure']){inspectWallEvidence(id);close();}check(wallState().achievements.includes('four'),'Family achievement');week2State().resolved.push('chapel');for(let i=0;i<3;i++){inspectWallEvidence('answer');close();}check(wallState().achievements.includes('plaster'),'Guaranteed third response');
s.projectorSeen=true;flags().mirror=true;for(const n of wallEvidence){inspectWallEvidence(n.id);close();}inspectWallEvidence('pocket');close();check(wallState().found.length===16&&wallState().achievements.length===5,'All evidence / revisit achievement');const snapshot=JSON.stringify(s);check(validateStory(JSON.parse(snapshot)).wallSecrets.found.length===16,'Save evidence');
reset();wallRunTainted=true;wallState().found=['key','address'];wallAchievementCheck();check(!wallState().achievements.length,'Admin achievement leak');reset();check(!wallState().found.length&&!wallState().achievements.length,'New story reset');
// Both render and overlay occlusion use the same geometry version cache.
const cache=visibilityIndex();visibleTo({p:[0,1,3]});check(cache===visibilityIndex(),'Visibility cache allocated every query');buildHouse();check(cache!==visibilityIndex(),'Stale visibility cache');
console.log('PASS: 16 evidence items, five gated achievements, quiet discoveries, admin isolation, floor/steep-ray occlusion, open stairs, visibility cache and save migration');
}`,context);
