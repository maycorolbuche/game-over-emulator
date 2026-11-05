// Nostalgist 0.10 writes commands to stdin. RetroArch 1.21 uses native exports
// and EmscriptenSendCommand instead (as in newer Nostalgist releases).
const exportsByCommand = {
  PAUSE_TOGGLE: '_cmd_toggle_pause',
  SAVE_STATE: '_cmd_save_state',
  LOAD_STATE: '_cmd_load_state',
  RESET: '_cmd_reset',
  SCREENSHOT: '_cmd_take_screenshot',
};
const connected = new WeakSet();

export function connect(instance) {
  const emulator = instance.getEmulator();
  if (connected.has(emulator)) return;
  const module = instance.getEmscriptenModule();
  const legacy = emulator.sendCommand.bind(emulator);
  // Patch the common dispatcher, including calls made inside pause()/resume().
  // Replacing only instance.sendCommand would miss those internal calls.
  emulator.sendCommand = command => {
    const exported = exportsByCommand[command];
    if (exported && typeof module[exported] === 'function') return module[exported]();
    if (typeof module.EmscriptenSendCommand === 'function') return module.EmscriptenSendCommand(command);
    return legacy(command);
  };
  connected.add(emulator);
}
