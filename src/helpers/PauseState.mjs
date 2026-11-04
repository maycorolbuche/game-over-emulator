const states = new WeakMap();
// Freeze the exposed Emscripten loop instead of queueing PAUSE_TOGGLE.
// Nostalgist's gameStatus cannot observe RetroArch's own focus pause.
export function setPaused(instance, paused) {
  if (states.get(instance) === paused) return;
  if (!states.has(instance) && !paused) { states.set(instance, false); return; }
  const { Browser, AL } = instance.getEmscripten();
  if (!Browser?.mainLoop?.pause || !Browser?.mainLoop?.resume) throw new Error('O núcleo não disponibiliza o controle de pausa.');
  if (paused) Browser.mainLoop.pause();
  else Browser.mainLoop.resume();
  states.set(instance, paused);
  const contexts = new Set(Object.values(AL?.contexts || {}).map(context => context.audioCtx));
  if (AL?.currentCtx?.audioCtx) contexts.add(AL.currentCtx.audioCtx);
  for (const context of contexts) {
    if (!context || context.state === 'closed') continue;
    try {
      const promise = paused ? context.suspend() : context.resume();
      promise?.catch(error => console.warn('Não foi possível ajustar o áudio do emulador.', error));
    } catch (error) { console.warn('Não foi possível ajustar o áudio do emulador.', error); }
  }
}
