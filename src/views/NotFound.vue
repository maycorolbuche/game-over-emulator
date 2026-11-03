<template>
  <main class="not-found">
    <h1>{{ title }}</h1>
    <p>Este endereço não está disponível. Escolha outro jogo no catálogo.</p>
    <router-link v-if="consoleId" :to="{ name: 'Games', params: { console_id: consoleId } }">
      VOLTAR AOS JOGOS
    </router-link>
    <router-link :to="{ name: 'Consoles' }">VER CONSOLES</router-link>
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
.not-found a { display: inline-block; color: #faa914; margin: 12px; }
</style>
