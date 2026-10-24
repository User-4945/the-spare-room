// One prompt follows the renderer's visible, in-range interaction target.
// New content can supply `action: 'Knock'` (or a function) on its target.
function interactionAction(target) {
  if (typeof target.action === 'function') return target.action(target);
  if (target.action) return target.action;
  const name = target.name || '';
  const eventActions = {
    invitation:'Read invitation',note:'Read note',bell:'Ring the bell',guest:'Talk to the guest',
    child:'Talk to the child',ribbon:'Take ribbon',porch:'Follow the lantern',
    flowers:'Tend the flower bed',wax:'Examine wax mark',seed:'Take black seed'
  };
  if (target.event === 'lantern') {
    const seal = halloweenSeals.find(n => name === n.name + ' lantern');
    return seal && halloweenState().seals.includes(seal.id) ? 'Inspect lit lantern' : 'Light lantern';
  }
  if (eventActions[target.event]) return eventActions[target.event];
  if (/^(Sticky note:|Upstairs note:)/.test(name)) return 'Read note';
  if (/^Investigate /.test(name)) return 'Investigate evidence';
  if (/^Talk to /.test(name)) return 'Talk · ' + name.slice(8);
  if (/^(Open|Close) .*door$/.test(name)) return name;
  const actions = {
    'Childhood photograph':'Examine photograph','Speak to Mother':'Talk to Mother',
    'Kitchen drawer':'Open drawer','Cassette tape':'Examine cassette',
    'Brass key':'Pick up key','Play / erase recording':'Use cassette player',
    'Read tomorrow’s diary':'Read diary','Face the room':'Face the room',
    'Book of names':'Read book of names','Letter under the bed':'Read hidden letter',
    'Covered mirror':flags().mirror ? 'Inspect mirror' : 'Uncover mirror',
    'Finish the chalk circle':'Draw the chalk circle','Fuse box':'Use fuse box',
    'Hallway telephone':'Use telephone','Kitchen sandwiches':'Eat sandwich',
    'Garden gate':'Open garden gate','Music box':'Wind music box','Old well':'Look into the well',
    'Seed packet':'Take seed packet','Watering can':'Take watering can',
    'Flower bed':'Plant and water seeds','Gardener’s shovel':'Take shovel',
    'Disturbed earth':'Dig here','Old tree roots':'Examine the roots','Storm lantern':'Light storm lantern',
    'Original blueprint':'Examine blueprint','Nursery clock':'Wind nursery clock',
    'Unsent letters':'Read unsent letters','Cinema projector':s.projectorOn ? 'Switch off projector' : 'Use projector',
    'Return to the house':'Return home'
  };
  return actions[name] || (/^Knock/.test(name) ? 'Knock' : 'Examine ' + name.toLowerCase());
}

const actionPrompt = document.createElement('button');
actionPrompt.id = 'action-prompt';
actionPrompt.type = 'button';
actionPrompt.hidden = true;
const actionKey = document.createElement('span');actionKey.className = 'action-key';
actionKey.setAttribute('aria-hidden','true');
const actionLabel = document.createElement('span');actionLabel.className = 'action-label';
actionPrompt.append(actionKey,actionLabel);gameScene.append(actionPrompt);
const actionStyle = document.createElement('style');
actionStyle.textContent = `
 #action-prompt[hidden]{display:none!important}
 #action-prompt{position:absolute;left:50%;bottom:82px;transform:translateX(-50%);z-index:6;display:flex;align-items:center;gap:14px;max-width:calc(100% - 32px);min-height:60px;padding:8px 21px 8px 9px;border:1px solid #c4bbae66;border-radius:14px;background:#383a36ed;color:#faf5e9;box-shadow:0 5px 20px #0007;font:18px/1.3 system-ui,sans-serif;text-align:left;letter-spacing:0;touch-action:manipulation}
 #action-prompt:hover{background:#4a4841;border-color:#e4bd80}
 #action-prompt:focus-visible{outline:2px solid #ffd58b;outline-offset:3px}
 #action-prompt .action-key{display:flex;align-items:center;justify-content:center;flex:0 0 43px;width:43px;height:43px;border-radius:50%;background:#777a73;color:#fff;font:20px/1 system-ui,sans-serif}
 #action-prompt .action-key:before{content:'';position:absolute;width:24px;height:29px;border:2px solid #eee9dc;border-radius:6px;pointer-events:none}
 #action-prompt .action-label{overflow-wrap:anywhere}
 .has-action-prompt #interaction-hint{visibility:hidden}
 .touch-game.has-action-prompt #touch-use{display:none}
 .touch-game #action-prompt{bottom:55px;min-height:54px;padding-right:14px;gap:10px;font-size:15px;max-width:85%}
 .touch-game #action-prompt .action-key{font-size:10px}
 .touch-game #action-prompt .action-key:before{display:none}
 @media(max-width:600px){#action-prompt{font-size:15px;gap:10px;bottom:60px;min-height:54px;padding-right:14px}.has-action-prompt .task-hud{max-height:35%}}
`;
document.body.append(actionStyle);

function hideActionPrompt() {
  actionPrompt.hidden = true;
  document.body.classList.remove('has-action-prompt');
}
function updateActionPrompt() {
  const target=house.target;
  if (!target || paused() || !s.started || s.ending || s.sanityLost) return hideActionPrompt();
  const text=interactionAction(target),touch=document.body.classList.contains('touch-game');
  actionPrompt.hidden=false;document.body.classList.add('has-action-prompt');
  if (actionLabel.textContent!==text) actionLabel.textContent=text;
  actionKey.textContent=touch?'TAP':'E';
  actionPrompt.setAttribute('aria-label',text+(touch?'':'. Press E or click'));
  actionPrompt.setAttribute('aria-keyshortcuts','E');
  const use=document.getElementById('touch-use');
  if (use) {use.textContent=text;use.setAttribute('aria-label',text);}
}
actionPrompt.onclick=()=>{
  if(paused() || s.ending || s.sanityLost)return hideActionPrompt();
  // Re-evaluate range, aim and occlusion: a stale prompt cannot activate an object.
  updateTargets();
  if(house.target){tone();house.target.fn();updateActionPrompt();}
};
const promptsTargets=updateTargets;
updateTargets=function(){promptsTargets();updateActionPrompt();};
const promptsModal=modal;
modal=function(...args){hideActionPrompt();return promptsModal(...args);};
updateActionPrompt();
