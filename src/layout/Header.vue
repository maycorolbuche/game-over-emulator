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
  </div>
  <div ref="searchBar" class="d-flex justify-end search-bar">
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
    };
  },
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

.search-bar {
  position: sticky;
  top: 0;
}
.search-bar.sticky {
  background: #0e0049;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);
}
</style>
