<template>
  <div class="p-3 d-flex align-center" id="main-menu">
    <router-link :to="{ name: 'Home' }" class="logo">
      <logo size="30px" text="GO" />
    </router-link>
    <button class="header-toggle" type="button" aria-label="Menu do site" :aria-expanded="menu_open" @keydown.esc="menu_open = false" aria-controls="site-navigation" @click="menu_open = !menu_open">☰</button>
    <nav id="site-navigation" :class="{ open: menu_open }" aria-label="Navegação principal" @click="menu_open = false">
    <router-link
      class="menu"
      :to="{ name: 'Home' }"
      :class="{ active: $route.name === 'Home' }"
    >
      Início
    </router-link>
    <router-link
      class="menu"
      :to="{ name: 'Consoles' }"
      :class="{ active: $route.name === 'Consoles' || $route.name === 'Games' }"
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
    </nav>
  </div>
  <div
    ref="searchBar"
    class="d-flex justify-end search-bar"
    style="z-index: 10"
  >
    <search-input />
  </div>
</template>

<script>
import Logo from "@/components/Logo.vue";
import SearchInput from "@/components/SearchInput.vue";

export default {
  name: "HeaderLayout",
  inheritAttrs: false,
  components: {
    Logo,
    SearchInput,
  },
  data() {
    return {
      observer: null,
      menu_open: false,
    };
  },
  watch: { $route() { this.menu_open = false; } },
  methods: {
    handleScroll() {
      const searchBar = this.$refs.searchBar;
      if (searchBar.getBoundingClientRect().top === 0) {
        searchBar.classList.add("sticky");
      } else {
        searchBar.classList.remove("sticky");
      }
    },
  },
  mounted() {
    window.addEventListener("scroll", this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
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

#main-menu { justify-content: space-between; position: relative; }
#site-navigation { display: flex; align-items: center; }
.header-toggle { display: none; color: #fff; border: 2px solid #faa914; background: #000; font-size: 24px; min-width: 44px; min-height: 44px; }
@media (max-width: 900px) {
  .header-toggle { display: block; }
  #main-menu { flex-direction: row !important; }
  #site-navigation { display: none; position: absolute; top: 100%; left: 0; right: 0; background: #0e0049; z-index: 30; padding: 12px; }
  #site-navigation.open { display: flex; flex-direction: column; align-items: stretch; }
  a.menu { margin: 0; padding: 16px; }
  .search-bar { padding: 8px 12px; }
  .search-bar :deep(.container) { width: 100%; margin: 0; }
  .search-bar :deep(.search-input) { width: 100%; min-width: 0; }
}
.search-bar {
  position: sticky;
  top: 0;
}
.search-bar.sticky {
  background: #0e0049;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);
}
</style>
