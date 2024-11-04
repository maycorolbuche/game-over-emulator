<template>
  <header-page />
  <router-view />
  <to-top-button />
</template>

<script>
import HeaderPage from "@/layout/Header.vue";
import ToTopButton from "@/layout/ToTopButton.vue";

export default {
  name: "App",
  components: {
    HeaderPage,
    ToTopButton,
  },
};
</script>
