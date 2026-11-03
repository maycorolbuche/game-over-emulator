<template>
  <header-page />
  <pwa-actions />
  <router-view />
  <to-top-button />
</template>

<script>
import PwaActions from "@/components/PwaActions.vue";
import HeaderPage from "@/layout/Header.vue";
import ToTopButton from "@/layout/ToTopButton.vue";

export default {
  name: "App",
  components: {
    HeaderPage,
    PwaActions,
    ToTopButton,
  },
};
</script>
