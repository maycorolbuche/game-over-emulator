<template>
  <div class="p-3 d-flex align-center" id="main-menu">
    <router-link :to="{ name: 'Home' }" class="logo">
      <logo size="30px" text="GO" />
    </router-link>
    <div style="width: 100%" />
    <router-link
      class="menu"
      :to="{ name: 'Home' }"
      :class="{ active: $route.name === 'Home' }"
    >
      Início
    </router-link>
    <router-link
      class="menu"
      :to="{ name: 'Games' }"
      :class="{ active: $route.name === 'Games' }"
    >
      Jogos
    </router-link>
    <router-link
      class="menu"
      :to="{ name: 'About' }"
      :class="{ active: $route.name === 'About' }"
    >
      Sobre
    </router-link>
  </div>
</template>

<script>
import Logo from "@/components/Logo.vue";

export default {
  name: "HeaderLayout",
  inheritAttrs: false,
  components: {
    Logo,
  },
};
</script>

<style scoped>
a {
  text-decoration: none;
}
a.menu {
  color: #fff;
  margin: 0 40px;
}
a.menu.active {
  font-weight: bold;
}
a.menu:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  a.menu {
    margin: 0 20px;
  }
}

@media (max-width: 400px) {
  a.menu {
    margin: 5px 0;
  }
  #main-menu {
    flex-direction: column !important;
  }
}
</style>
