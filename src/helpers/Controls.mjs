const directions = { up: 'up', down: 'down', left: 'left', right: 'right' };
const standard = { ...directions, start: 'start', select: 'select', a: 'a', b: 'b' };
export const profiles = {
  nes: { players: 2, buttons: standard },
  snes: { players: 2, buttons: { ...standard, x: 'x', y: 'y', l: 'l', r: 'r' } },
  gens: { players: 2, buttons: { ...directions, start: 'start', mode: 'select', a: 'y', b: 'b', c: 'a', x: 'l', y: 'x', z: 'r' } },
  sms: { players: 2, buttons: { ...directions, button1: 'b', button2: 'a', pause: 'start' } },
  gba: { players: 1, buttons: { ...standard, l: 'l', r: 'r', turbo_a: 'x', turbo_b: 'y' }, optional: ['turbo_a', 'turbo_b'] },
};
const validKey = key => typeof key === 'string' && (/^[a-z0-9,]$/.test(key) || /^(enter|space|up|down|left|right|keypad[0-9])$/.test(key));
const inputs = ['up', 'down', 'left', 'right', 'start', 'select', 'a', 'b', 'x', 'y', 'l', 'r', 'l2', 'r2', 'l3', 'r3'];
export function visibleControls(consoleId, controls = {}) {
  const profile = profiles[consoleId];
  if (!profile) return {};
  const result = {};
  for (let player = 1; player <= profile.players; player++) {
    const name = `player${player}`;
    result[name] = Object.fromEntries(Object.entries(controls[name] || {}).filter(([button]) => button in profile.buttons && !(consoleId === 'sms' && player === 2 && button === 'pause')));
  }
  return result;
}
export function retroarchControls(consoleId, controls) {
  const profile = profiles[consoleId];
  const result = {};
  // Explicitly clear unused bindings so RetroArch defaults do not activate
  // hidden controls or a second player absent from the console profile.
  for (let player = 1; player <= 2; player++) for (const input of inputs) result[`input_player${player}_${input}`] = 'nul';
  for (const [player, buttons] of Object.entries(visibleControls(consoleId, controls))) {
    for (const [button, key] of Object.entries(buttons)) result[`input_${player}_${profile.buttons[button]}`] = key;
  }
  return result;
}
export function validateControls(consoleId, controls) {
  const profile = profiles[consoleId];
  if (!profile) return [`${consoleId}: perfil de controles inexistente`];
  if (!controls || typeof controls !== 'object' || Array.isArray(controls)) return [`${consoleId}: esperado objeto de controles`];
  const errors = [];
  const expected = Array.from({ length: profile.players }, (_, i) => `player${i + 1}`);
  for (const name of Object.keys(controls)) if (!expected.includes(name)) errors.push(`${consoleId}.${name}: jogador não suportado`);
  for (const player of expected) {
    const buttons = controls[player];
    if (!buttons || typeof buttons !== 'object' || Array.isArray(buttons)) { errors.push(`${consoleId}.${player}: mapa ausente`); continue; }
    const used = new Set();
    for (const [button, key] of Object.entries(buttons)) {
      const location = `${consoleId}.${player}.${button}`;
      if (!(button in profile.buttons) || (consoleId === 'sms' && player === 'player2' && button === 'pause')) errors.push(`${location}: botão não suportado`);
      if (!validKey(key)) errors.push(`${location}: tecla inválida`);
      if (used.has(key)) errors.push(`${location}: tecla duplicada no jogador`);
      used.add(key);
    }
    for (const button of Object.keys(profile.buttons)) {
      if (profile.optional?.includes(button) || (consoleId === 'sms' && player === 'player2' && button === 'pause')) continue;
      if (!(button in buttons)) errors.push(`${consoleId}.${player}.${button}: botão obrigatório ausente`);
    }
  }
  const allKeys = new Set();
  for (const [player, buttons] of Object.entries(controls)) {
    if (!buttons || typeof buttons !== 'object') continue;
    for (const key of Object.values(buttons)) {
      if (allKeys.has(key)) errors.push(`${consoleId}.${player}: tecla em conflito entre jogadores`);
      allKeys.add(key);
    }
  }
  return errors;
}
