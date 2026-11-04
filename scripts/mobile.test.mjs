import test from 'node:test';
import assert from 'node:assert/strict';
import { createTouchInput, fitScreen, joystickState } from '../src/helpers/TouchInput.mjs';
import { parse } from '@vue/compiler-sfc';
import { readFileSync } from 'node:fs';
import * as Controls from '../src/helpers/Controls.mjs';

test('multitoque segura direcional e ação independentemente', () => {
  const events = []; const input = createTouchInput((b, down) => events.push([b, down]));
  input.update(1, ['right']); input.update(2, ['a']); input.release(1);
  assert.deepEqual(events, [['right', true], ['a', true], ['right', false]]);
  input.releaseAll(); assert.deepEqual(events.at(-1), ['a', false]);
  input.releaseAll(); assert.equal(events.length, 4);
});
test('deslizar para diagonal mantém botões compartilhados e libera ao cancelar', () => {
  const events = []; const input = createTouchInput((b, down) => events.push([b, down]));
  input.update(1, ['up']); input.update(1, ['up', 'right']); input.update(2, ['right']);
  input.release(1); assert.equal(events.filter(x => x[0] === 'right' && !x[1]).length, 0);
  input.release(2); assert.deepEqual(events, [['up', true], ['right', true], ['up', false], ['right', false]]);
});
test('redimensionamento mantém proporção em pé e deitado sem exceder área', () => {
  for (const [w,h] of [[390,604],[844,390],[320,240],[0,0]]) {
    const size = fitScreen(w,h,4/3); assert.ok(size.width <= w); assert.ok(size.height <= h);
    if (w && h) assert.equal(size.width / size.height, 4/3);
  }
  assert.equal(fitScreen(390,604,3/2).height,260);
});
function game() {
  const source = parse(readFileSync(new URL('../src/components/Game.vue', import.meta.url),'utf8')).descriptor.script.content.replace(/^import .*;\s*$/gm,'').replace('export default','return');
  const options = new Function('Key','TouchControls','Controls','Storage','Conversions','Screen','Nostalgist','Swal','markRaw','SaveTransfer','EmulatorState','fitScreen',source)({}, {}, Controls, {}, {}, {}, {}, { isVisible: () => false }, x=>x, {}, {}, fitScreen);
  const events=[];
  const vm={...options.data(), console:'gens', $refs:{touchControls:{releaseAll(){events.push('release');}}}, nostalgist:{pause(){events.push('pause');},resume(){events.push('resume');},pressDown(b,p){events.push(['down',b,p]);},pressUp(b,p){events.push(['up',b,p]);}}};
  for(const [k,v] of Object.entries(options.methods)) vm[k]=v.bind(vm);
  return {vm,events};
}
test('toques usam tradução de console exclusivamente no jogador 1',()=>{
  const {vm,events}=game(); vm.touchInput('x',true); vm.touchInput('x',false);
  assert.deepEqual(events,[['down','l',1],['up','l',1]]);
  vm.menu_open=true;vm.touchInput('a',true);assert.equal(events.length,2);
});
test('menu libera toques, pausa e retoma apenas sessão anteriormente ativa',()=>{
  const {vm,events}=game(); const instance=vm.nostalgist;
  vm.toggleMenu();assert.equal(vm.menu_open,true);assert.equal(vm.is_paused,true);
  vm.toggleMenu();assert.equal(vm.is_paused,false);assert.equal(vm.nostalgist,instance);
  vm.pause();events.length=0;vm.toggleMenu();vm.toggleMenu();assert.equal(events.includes('resume'),false);
});

test('direcional central cobre oito direções, zona neutra e limite visual', () => {
  const samples = [[30,0,['right']], [30,30,['down','right']], [0,30,['down']], [-30,30,['down','left']], [-30,0,['left']], [-30,-30,['up','left']], [0,-30,['up']], [30,-30,['up','right']]];
  for (const [x,y,expected] of samples) assert.deepEqual(joystickState(x,y).buttons, expected);
  assert.deepEqual(joystickState(3,3).buttons, []);
  assert.ok(Math.hypot(joystickState(1000,1000).x, joystickState(1000,1000).y) <= 34.0001);
});
test('arrastar mantém captura, permite ação simultânea e centraliza ao cancelar', () => {
  const source = parse(readFileSync(new URL('../src/components/TouchControls.vue',import.meta.url),'utf8')).descriptor.script.content.replace(/^import .*;\s*$/gm,'').replace('export default','return');
  const options = new Function('markRaw','createTouchInput','joystickState',source)(x=>x,createTouchInput,joystickState);
  const events = []; const vm = {...options.data(), disabled:false};
  vm.input = createTouchInput((button, down)=>events.push([button,down]));
  const stick = { getBoundingClientRect:()=>({left:0,top:0,width:44,height:44}) };
  let captures=0;vm.$el={contains:()=>true,setPointerCapture(){captures++;}};
  for(const [key,method] of Object.entries(options.methods)) vm[key]=method.bind(vm);
  vm.down({pointerId:1,clientX:22,clientY:22,target:{closest:selector=>selector==='[data-stick]'?stick:null},preventDefault(){}});
  vm.move({pointerId:1,clientX:60,clientY:22});
  vm.input.update(2,['a']);
  vm.move({pointerId:1,clientX:22,clientY:-20});
  assert.deepEqual(events,[['right',true],['a',true],['right',false],['up',true]]);
  assert.equal(captures,1);
  vm.up({pointerId:1});assert.equal(vm.stick_id,null);assert.equal(vm.stick_x,0);assert.equal(vm.stick_y,0);
  assert.deepEqual(events.at(-1),['up',false]);
  vm.releaseAll();assert.deepEqual(events.at(-1),['a',false]);
});
