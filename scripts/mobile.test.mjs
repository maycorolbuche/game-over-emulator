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
test('canvas mantém tamanho CSS quando núcleo muda buffer e remove width/height inline', () => {
  const {vm} = game();
  let area = { width: 844, height: 390 }, resizeCalls = 0;
  const properties = new Map();
  const canvas = { width: 300, height: 150, style: {
    setProperty: (key, value) => properties.set(key, value),
    removeProperty: key => properties.delete(key),
  } };
  vm.$refs.gameStage = {};
  vm.$refs.emulatorContainer = { getBoundingClientRect: () => area };
  vm.$refs.emulatorCanvas = canvas;
  vm.nostalgist.resize = () => { resizeCalls++; };
  const source = readFileSync(new URL('../src/components/Game.vue', import.meta.url), 'utf8');
  assert.match(source, /width: var\(--canvas-width, 100%\) !important/);
  assert.match(source, /height: var\(--canvas-height, 100%\) !important/);
  assert.match(source, /\.emulator-canvas\s*\{\s*position: absolute/);
  for (const dpr of [1, 1.25, 1.5, 2, 3]) {
    for (let i = 0; i < 30; i++) {
      vm.handleResize();
      const width = parseFloat(properties.get('--canvas-width'));
      const height = parseFloat(properties.get('--canvas-height'));
      assert.equal(width, 520); assert.equal(height, 390);
      // RetroArch observes CSS pixels, sets a high-DPI backing store and may
      // remove the inline width/height via Browser.updateCanvasDimensions.
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      canvas.style.removeProperty('width'); canvas.style.removeProperty('height');
      assert.equal(parseFloat(properties.get('--canvas-width')), 520);
    }
  }
  assert.equal(resizeCalls, 0);
  area = { width: 390, height: 604 }; vm.handleResize();
  assert.equal(parseFloat(properties.get('--canvas-width')), 390);
  assert.equal(parseFloat(properties.get('--canvas-height')), 292.5);
  vm.console = 'gba'; vm.handleResize();
  assert.equal(parseFloat(properties.get('--canvas-height')), 260);
});
test('rotina real do Nostalgist troca o ID, mas preserva a classe usada pelo CSS', t => {
  const previousDocument = globalThis.document;
  const previousCanvas = globalThis.HTMLCanvasElement;
  class Canvas {
    constructor() { this.id = 'emulator-canvas'; this.className = 'emulator-canvas'; }
  }
  globalThis.document = {};
  globalThis.HTMLCanvasElement = Canvas;
  t.after(() => {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousCanvas === undefined) delete globalThis.HTMLCanvasElement;
    else globalThis.HTMLCanvasElement = previousCanvas;
  });
  const canvas = new Canvas();
  // Extract the installed library's unchanged routine: importing its entire
  // bundle in Node would initialize BrowserFS, which requires browser globals.
  const library = readFileSync(new URL(import.meta.resolve('nostalgist')), 'utf8');
  const start = library.indexOf('  getElementOption() {');
  const end = library.indexOf('\n  getRetroarchCoreOption()', start);
  assert.ok(start > 0 && end > start);
  const method = new Function(`return ({${library.slice(start, end)}}).getElementOption`)();
  const result = method.call({ options: { element: canvas } });
  assert.equal(result, canvas);
  assert.equal(canvas.id, 'canvas');
  assert.equal(canvas.className, 'emulator-canvas');
  const { descriptor } = parse(readFileSync(new URL('../src/components/Game.vue', import.meta.url), 'utf8'));
  assert.match(descriptor.template.content, /class="emulator-canvas"/);
  const css = descriptor.styles.map(style => style.content).join('\n');
  assert.match(css, /\.emulator-canvas\s*\{/);
  assert.doesNotMatch(css, /#emulator-canvas\s*\{/);
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

test('ações mobile fecham menu no gesto e agendam retomada antes do comando', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const {vm,events}=game();vm.mobile_layout=true;vm.toggleMenu();
  t.mock.timers.tick(10);
  let executed=false;const result=vm.runMenuAction(()=>{ executed=true;assert.equal(vm.menu_open,false);assert.equal(vm.is_paused,false);return 123; });
  assert.equal(executed,true);assert.equal(result,123);assert.equal(events.includes('resume'),false);
  t.mock.timers.tick(10);assert.ok(events.includes('resume'));
});
test('pausar permanece pausado após fechar menu; desktop não recolhe a lateral', () => {
  const {vm}=game();vm.mobile_layout=true;vm.toggleMenu();vm.runMenuAction(()=>vm.pause());
  assert.equal(vm.menu_open,false);assert.equal(vm.is_paused,true);
  vm.mobile_layout=false;vm.menu_open=true;vm.runMenuAction(()=>{});
  assert.equal(vm.menu_open,true);
});
