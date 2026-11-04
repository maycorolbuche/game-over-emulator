import { reactive } from 'vue';
export const pwaState = reactive({ canInstall: false, installed: false, ios: false, offline: false, updateAvailable: false });
export function createPwaController(host, state) {
  let promptEvent;
  const standalone = host.matchMedia('(display-mode: standalone)');
  const updateInstalled = () => { state.installed = standalone.matches || host.navigator.standalone === true; if (state.installed) { promptEvent = null; state.canInstall = false; } };
  const beforeInstall = event => { event.preventDefault(); promptEvent = event; state.canInstall = !state.installed; };
  const installed = () => { promptEvent = null; state.canInstall = false; state.installed = true; };
  const online = () => { state.offline = !host.navigator.onLine; };
  updateInstalled(); online();
  state.ios = /iPhone|iPad|iPod/.test(host.navigator.userAgent) || (host.navigator.platform === 'MacIntel' && host.navigator.maxTouchPoints > 1);
  host.addEventListener('beforeinstallprompt', beforeInstall);
  host.addEventListener('appinstalled', installed);
  host.addEventListener('online', online); host.addEventListener('offline', online);
  standalone.addEventListener?.('change', updateInstalled);
  return {
    async install() {
      if (!promptEvent || state.installed) return false;
      const event = promptEvent; promptEvent = null; state.canInstall = false;
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === 'accepted') state.installed = true;
      return choice.outcome === 'accepted';
    },
    async register() {
      if (!host.navigator.serviceWorker) return;
      const registration = await host.navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
      state.updateAvailable = !!registration.waiting;
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && host.navigator.serviceWorker.controller) state.updateAvailable = true;
        });
      });
      return registration;
    },
    stop() {
      host.removeEventListener('beforeinstallprompt', beforeInstall); host.removeEventListener('appinstalled', installed);
      host.removeEventListener('online', online); host.removeEventListener('offline', online);
      standalone.removeEventListener?.('change', updateInstalled);
    },
  };
}
let controller;
export function initPwa() {
  if (controller) return;
  controller = createPwaController(window, pwaState);
  const register = () => controller.register().catch(error => console.warn('Não foi possível preparar o aplicativo para uso offline.', error));
  if (document.readyState === 'complete') register(); else window.addEventListener('load', register, { once: true });
}
export function installPwa() { return controller?.install(); }
