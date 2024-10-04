<template>
  <header-page />
  <router-view />
</template>

<script>
import HeaderPage from "@/layout/Header.vue";

export default {
  name: "App",
  components: {
    HeaderPage,
  },
};
</script>
