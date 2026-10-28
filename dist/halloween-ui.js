document.body.classList.add('halloween-ui');
const halloweenSkin=document.createElement('link');halloweenSkin.rel='stylesheet';halloweenSkin.href='halloween-ui.css';document.head.append(halloweenSkin);
// Update guidance wherever the base game opens its standard help text.
const halloweenUiModal=modal;modal=function(title,body,...rest){return halloweenUiModal(title,typeof body==='string'?body.replace(/E \/ click to interact/g,'Hold E / hold click to interact').replace(/then click or press E/g,'then hold E or hold click').replace(/CLICK \/ E INTERACT/g,'HOLD E / CLICK TO INTERACT'):body,...rest);};
const halloweenUiRender=render;render=function(...args){const result=halloweenUiRender(...args);const hint=$('nav').querySelector('.small');if(hint)hint.textContent='WASD WALK · SHIFT SPRINT · SPACE JUMP · HOLD E / CLICK TO INTERACT · ESC RELEASE';return result;};

{const hint=$('nav').querySelector('.small');if(hint)hint.textContent='WASD WALK · SHIFT SPRINT · SPACE JUMP · HOLD E / CLICK TO INTERACT · ESC RELEASE';}
