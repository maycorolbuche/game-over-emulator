<template>
  <div>
    GAMES
    {{ consoles }}
  </div>
</template>

<script>
import consoles from "@/json/consoles.json";

export default {
  name: "GamesPage",
  data() {
    return {
      json_consoles: consoles,
    };
  },
  computed: {
    consoles() {
      return this.json_consoles.slice().sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });
    },
  },
};
</script>
