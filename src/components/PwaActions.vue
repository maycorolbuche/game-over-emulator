<template>
  <div v-if="available && ((!state.installed && (state.canInstall || state.ios)) || state.updateAvailable || state.offline)" class="pwa-actions">
    <button v-if="!state.installed && (state.canInstall || state.ios)" type="button" @click="install">INSTALAR APP</button>
    <p v-if="state.updateAvailable" role="status">Nova versão disponível. Feche o app e todas as abas deste site para atualizar.</p>
    <p v-if="state.offline" role="status">Sem conexão. O catálogo está disponível; iniciar jogos pode exigir internet.</p>
  </div>
</template>
<script>
import Swal from 'sweetalert2';
import { pwaState, installPwa } from '@/helpers/Pwa.mjs';
export default {
  data() { return { state: pwaState, available: import.meta.env.PROD }; },
  methods: {
    async install() {
      if (this.state.canInstall) {
        try { await installPwa(); } catch { Swal.fire({ icon: 'error', title: 'Instalação indisponível', text: 'Tente novamente pelo menu do navegador.', confirmButtonText: 'Entendi' }); }
      } else if (this.state.ios) {
        Swal.fire({ title: 'Instalar no iPhone ou iPad', text: 'Abra este site no Safari, toque em Compartilhar e escolha Adicionar à Tela de Início. Se houver a opção Abrir como App da Web, mantenha-a ativada.', confirmButtonText: 'Entendi' });
      }
    },
  },
};
</script>
<style scoped>
.pwa-actions { padding: 8px 16px; color: #fff; background: #0e0049; font-size: 13px; }
.pwa-actions button { background: #faa914; color: #000; padding: 12px 16px; border: 0; font-weight: bold; cursor: pointer; }
.pwa-actions button:focus-visible { outline: 3px solid #41f7fb; outline-offset: 3px; }
.pwa-actions p { margin: 8px 0; line-height: 1.5; }

</style>
