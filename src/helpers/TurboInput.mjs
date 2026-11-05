import { profiles, visibleControls } from './Controls.mjs';

const actions = new Set(['a', 'b', 'c', 'x', 'y', 'z', 'l', 'r', 'button1', 'button2']);
function keyCode(key) {
  if (/^[a-z]$/.test(key)) return 'Key' + key.toUpperCase();
  if (/^[0-9]$/.test(key)) return 'Digit' + key;
  if (/^keypad[0-9]$/.test(key)) return 'Numpad' + key.at(-1);
  return ({ ',': 'Comma', enter: 'Enter', space: 'Space', up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' })[key];
}
export function bindings(consoleId, controls) {
  const result = new Map();
  for (const [name, buttons] of Object.entries(visibleControls(consoleId, controls))) {
    for (const [button, key] of Object.entries(buttons)) {
      if (actions.has(button) && keyCode(key)) result.set(keyCode(key), { player: Number(name.slice(6)), button: profiles[consoleId].buttons[button] });
    }
  }
  return result;
}

// One shared 50 ms half-cycle gives ~10 presses/sec at normal emulation speed.
export function createTurboInput({ mapping, emit, active, target, schedule = setTimeout, cancel = clearTimeout }) {
  const held = new Map(), touch = new Map(), output = new Map(), shifts = new Set();
  let shifted = false, phase = true, timer = null;
  const id = binding => `${binding.player}:${binding.button}`;
  const editable = event => event.isComposing || event.target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
  function render() {
    const desired = new Map();
    for (const binding of held.values()) desired.set(id(binding), { ...binding, down: !shifted || phase });
    // A normal touch held on the same button must not be released by keyboard turbo.
    for (const [key, binding] of touch) desired.set(key, { ...binding, down: true });
    for (const [key, binding] of output) if (!desired.get(key)?.down) {
      emit(binding.button, false, binding.player); output.delete(key);
    }
    for (const [key, binding] of desired) if (binding.down && !output.has(key)) {
      emit(binding.button, true, binding.player); output.set(key, binding);
    }
  }
  function releaseAll() {
    if (timer !== null) cancel(timer);
    timer = null; held.clear(); touch.clear(); shifts.clear(); shifted = false; phase = true;
    render();
  }
  function tick() {
    timer = null;
    if (!active()) { releaseAll(); return; }
    phase = !phase; render(); updateTimer();
  }
  function updateTimer() {
    if (shifted && held.size) {
      if (timer === null) timer = schedule(tick, 50);
    } else {
      if (timer !== null) cancel(timer);
      timer = null; phase = true;
    }
  }
  function refresh() { updateTimer(); render(); }
  function keydown(event) {
    if (editable(event) || event.target !== target()) return;
    if (event.key === 'Shift') {
      if (active()) { shifts.add(event.code); shifted = true; refresh(); }
      return; // preserve Shift+= and all other emulator/browser shortcuts
    }
    const binding = mapping.get(event.code);
    if (!binding || event.ctrlKey || event.altKey || event.metaKey) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (!active() || event.repeat || held.has(event.code)) return;
    shifted = !!event.shiftKey || shifts.size > 0;
    held.set(event.code, binding); refresh();
  }
  function keyup(event) {
    if (event.key === 'Shift') {
      shifts.delete(event.code); shifted = !!event.shiftKey || shifts.size > 0; refresh(); return;
    }
    if (!held.has(event.code)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    held.delete(event.code); refresh();
  }
  function touchInput(button, down, player = 1) {
    const binding = { button, player }, key = id(binding);
    if (down && active()) touch.set(key, binding);
    else touch.delete(key);
    render();
  }
  return { keydown, keyup, touchInput, releaseAll };
}

export const isAction = button => actions.has(button);
