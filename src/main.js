import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import shortkey from 'vue3-shortkey';

import '@/assets/css/main.css';
import '@/assets/css/swal.css';

createApp(App).use(router).use(shortkey, { prevent: ["input", "textarea"] }).mount('#app')
