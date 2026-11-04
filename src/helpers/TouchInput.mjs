// Track pointers independently and reference-count shared buttons (diagonals).
export function createTouchInput(emit) {
  const pointers = new Map();
  const counts = new Map();
  function update(id, buttons = []) {
    const before = pointers.get(id) || new Set();
    const after = new Set(buttons);
    for (const button of before) if (!after.has(button)) {
      const count = counts.get(button) - 1;
      if (count) counts.set(button, count);
      else { counts.delete(button); emit(button, false); }
    }
    for (const button of after) if (!before.has(button)) {
      if (!counts.has(button)) emit(button, true);
      counts.set(button, (counts.get(button) || 0) + 1);
    }
    if (after.size) pointers.set(id, after); else pointers.delete(id);
  }
  return { update, release: id => update(id), releaseAll() { for (const id of [...pointers.keys()]) update(id); } };
}
export function fitScreen(width, height, ratio) {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };
  const fittedWidth = Math.min(width, height * ratio);
  return { width: fittedWidth, height: fittedWidth / ratio };
}

export function joystickState(dx, dy, radius = 34, deadZone = 8) {
  const distance = Math.hypot(dx, dy);
  const scale = distance > radius ? radius / distance : 1;
  const sectors = [
    ['right'], ['down', 'right'], ['down'], ['down', 'left'],
    ['left'], ['up', 'left'], ['up'], ['up', 'right'],
  ];
  const sector = (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
  return { x: dx * scale, y: dy * scale, buttons: distance <= deadZone ? [] : sectors[sector] };
}
