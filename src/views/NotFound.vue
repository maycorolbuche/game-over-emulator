<template>
  <main class="not-found">
    <h1>{{ title }}</h1>
    <p>Este endereço não está disponível. Escolha outro jogo no catálogo.</p>
    <div class="not-found-actions">
    <router-link class="return-button return-button-primary" v-if="consoleId" :to="{ name: 'Games', params: { console_id: consoleId } }">
      VOLTAR AOS JOGOS
    </router-link>
    <router-link class="return-button" :class="{ 'return-button-primary': !consoleId }" :to="{ name: 'Consoles' }">VER CONSOLES</router-link>
    </div>
  </main>
</template>

<script>
export default {
  name: "NotFoundPage",
  props: {
    title: { type: String, default: "Página não encontrada" },
    consoleId: String,
  },
};
</script>

<style scoped>
.not-found {
  padding: 48px 20px;
  text-align: center;
  color: #fff;
}
.not-found h1 { font-size: 24px; }
.not-found p { margin: 24px 0; }
.not-found-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
}
.return-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  box-sizing: border-box;
  padding: 16px 20px;
  border: 3px solid #fff;
  border-radius: 0;
  background: #000;
  color: #fff;
  font-family: "Press Start 2P", cursive;
  font-size: 11px;
  line-height: 1.8;
  text-decoration: none;
  box-shadow: 4px 4px 0 #fff;
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.return-button-primary {
  background: #faa914;
  border-color: #faa914;
  color: #000;
  box-shadow: 4px 4px 0 #a86c00;
}
.return-button:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #fff;
}
.return-button-primary:hover { box-shadow: 6px 6px 0 #a86c00; }
.return-button:active {
  transform: translate(3px, 3px);
  box-shadow: none;
}
.return-button:focus-visible {
  outline: 3px solid #41f7fb;
  outline-offset: 6px;
}
@media (max-width: 480px) {
  .return-button { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .return-button { transition: none; }
}
</style>
