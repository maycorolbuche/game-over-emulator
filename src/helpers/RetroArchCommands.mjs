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

export const CONFIG_PATH = '/home/web_user/retroarch/userdata/retroarch.cfg';
export const STATE_DIRECTORY = '/home/web_user/retroarch/userdata/states';

export function configureLaunch(instance) {
  const module = instance.getEmscriptenModule();
  const fileName = instance.getEmulatorOptions().rom[0]?.fileName;
  if (!fileName) throw new Error('Não foi possível identificar a ROM para iniciar o núcleo.');
  const romPath = `/home/web_user/retroarch/userdata/content/${fileName}`;
  const args = [...(module.arguments || [])];
  // Providing Module.arguments disables 0.10's automatic ROM argument: retain it.
  if (!args.includes(romPath)) args.push(romPath);
  for (let index = args.length - 1; index >= 0; index--) {
    if (args[index] === '-c' || args[index] === '--config') args.splice(index, 2);
  }
  args.push('-c', CONFIG_PATH);
  instance.getEmscriptenFS().mkdirTree(STATE_DIRECTORY);
  module.arguments = args;
}

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
