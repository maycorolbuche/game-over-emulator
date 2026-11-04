import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import GTag from 'vue-gtag';
import shortkey from 'vue3-shortkey';

import '@/assets/css/main.css';
import '@/assets/css/swal.css';

import { initPwa } from '@/helpers/Pwa.mjs';
if (import.meta.env.PROD) initPwa();

createApp(App)
    .use(GTag, {
        config: { id: 'G-53R731FFCM' }
    }, router)
    .use(router)
    .use(shortkey, { prevent: ["input", "textarea"] })
    .mount('#app')
