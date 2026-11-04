export function registerPwa(host) {
  if (!host.navigator.serviceWorker) return Promise.resolve();
  return host.navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
}
let initialized = false;
export function initPwa() {
  if (initialized) return;
  initialized = true;
  const register = () => registerPwa(window).catch(error => console.warn('Não foi possível preparar o aplicativo para uso offline.', error));
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
