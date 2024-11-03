<template>
  <div>
    <div class="d-flex flex-wrap align-stretch justify-center">
      <router-link
        v-for="console in consoles"
        :key="console.id"
        class="console-card d-flex flex-column align-center justify-center"
        :to="{ name: 'Games', params: { console_id: console.id } }"
      >
        <img v-if="console.image" :src="console.image" />
        <span>{{ console.name }}</span>
      </router-link>
    </div>

    <div class="text-center">Mais consoles em breve!</div>

    <tetris />
    <star />
  </div>
</template>

<script>
import Tetris from "@/components/bg/Tetris.vue";
import Star from "@/components/bg/Star.vue";

import consoles from "@/json/consoles.json";

export default {
  name: "ConsolesPage",
  components: {
    Tetris,
    Star,
  },
  data() {
    return {
      json_consoles: consoles,
    };
  },
  computed: {
    consoles() {
      return this.json_consoles
        .filter((console) => console.active)
        .slice()
        .sort((a, b) => {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        });
    },
  },
};
</script>

<style scoped>
.console-card {
  border: 3px solid #ea004e11;
  border-radius: 10px;
  background: linear-gradient(to bottom, #faa914, #ea004f);
  background-clip: padding-box;
  padding: 10px;
  margin: 10px;
  padding: 10px;
  text-decoration: none;
  color: #fff;
}
.console-card:hover {
  border: 3px solid #ea004f;
  animation: blink 1s infinite;
}

@keyframes blink {
  0% {
    border-color: #ea004f;
  }
  50% {
    border-color: #faa914;
  }
  100% {
    border-color: #ea004f;
  }
}
</style>
