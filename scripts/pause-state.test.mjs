import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '@vue/compiler-sfc';
import * as PauseState from '../src/helpers/PauseState.mjs';
function engine() {
  const state={running:true,stops:0,starts:0,audio:true};
  const context={state:'running',suspend(){state.audio=false;return Promise.resolve();},resume(){state.audio=true;return Promise.resolve();}};
  const instance={
    pause(){assert.fail('não usar PAUSE_TOGGLE');},resume(){assert.fail('não usar PAUSE_TOGGLE');},
    sendCommand(command){assert.equal(command,'RESET');},
    getEmscripten(){return {Browser:{mainLoop:{pause(){state.running=false;state.stops++;},resume(){state.running=true;state.starts++;}}},AL:{contexts:{1:{audioCtx:context}},currentCtx:{audioCtx:context}}};},
  };
  return {instance,state};
}
test('pausa e retomada explícitas são idempotentes e sincronizam áudio',()=>{
  const {instance,state}=engine();
  PauseState.setPaused(instance,true);PauseState.setPaused(instance,true);
  assert.equal(state.running,false);assert.equal(state.audio,false);assert.equal(state.stops,1);
  PauseState.setPaused(instance,false);PauseState.setPaused(instance,false);
  assert.equal(state.running,true);assert.equal(state.audio,true);assert.equal(state.starts,1);
});
test('estado inicial não agenda outro loop e núcleo novo é independente',()=>{
  const a=engine(),b=engine();PauseState.setPaused(a.instance,false);assert.equal(a.state.starts,0);
  PauseState.setPaused(a.instance,true);PauseState.setPaused(b.instance,false);assert.equal(b.state.running,true);assert.equal(b.state.starts,0);
});
test('camada visual acompanha o loop durante diálogo, cancelamento e pausa manual',async()=>{
  const source=parse(readFileSync(new URL('../src/components/Game.vue',import.meta.url),'utf8')).descriptor.script.content.replace(/^import .*;\s*$/gm,'').replace('export default','return');
  let finish;
  const options=new Function('Key','TouchControls','PauseState','Swal',source)({}, {}, PauseState,{fire:()=>new Promise(resolve=>{finish=resolve;})});
  const {instance,state}=engine();const vm={...options.data(),nostalgist:instance,$refs:{}};
  for(const [name,fn] of Object.entries(options.methods))vm[name]=fn.bind(vm);
  const dialog=vm.restartGame();assert.equal(vm.is_paused,true);assert.equal(state.running,false);
  vm.play();assert.equal(state.running,false);
  finish({isConfirmed:false});await dialog;assert.equal(vm.is_paused,false);assert.equal(state.running,true);
  for(let i=0;i<5;i++){vm.pause();assert.equal(vm.is_paused,true);assert.equal(state.running,false);vm.play();assert.equal(vm.is_paused,false);assert.equal(state.running,true);}
  vm.pause();const paused=vm.restartGame();finish({isConfirmed:false});await paused;
  assert.equal(vm.is_paused,true);assert.equal(state.running,false);
});
