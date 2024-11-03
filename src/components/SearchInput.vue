<template>
  <div class="container">
    <div class="search-bar">
      <div class="icon">
        <svg
          fill="#FFFFFF"
          height="16px"
          width="16px"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 490.4 490.4"
          xml:space="preserve"
        >
          <g>
            <path
              d="M484.1,454.796l-110.5-110.6c29.8-36.3,47.6-82.8,47.6-133.4c0-116.3-94.3-210.6-210.6-210.6S0,94.496,0,210.796
		s94.3,210.6,210.6,210.6c50.8,0,97.4-18,133.8-48l110.5,110.5c12.9,11.8,25,4.2,29.2,0C492.5,475.596,492.5,463.096,484.1,454.796z
		M41.1,210.796c0-93.6,75.9-169.5,169.5-169.5s169.6,75.9,169.6,169.5s-75.9,169.5-169.5,169.5S41.1,304.396,41.1,210.796z"
            />
          </g>
        </svg>
      </div>

      <input
        v-model="search"
        @input="filterItems"
        @focus="showItems"
        @blur="hideItems"
        type="text"
        class="search-input"
      />
    </div>
    <div v-if="showList" class="search-results">
      <div class="not-found-items" v-if="items.length <= 0">
        Nenhum resultado para: {{ search }}
      </div>
      <router-link
        :to="{
          name: 'Game',
          params: { console_id: item.console, game_id: item.id },
        }"
        class="item-result"
        v-for="(item, key) in items"
        :key="key"
      >
        <img class="img-rom" :src="item.image" />
        <div class="info">
          <div class="name-rom">{{ item.name }}</div>
          <div class="name-console">{{ json_consoles[item.console].name }}</div>
        </div>
        <img class="img-console" :src="json_consoles[item.console].image" />
      </router-link>
    </div>
  </div>
</template>

<script>
import consoles from "@/json/consoles.json";
import roms from "@/json/roms.json";

export default {
  name: "SearchInputComponent",
  inheritAttrs: false,
  data() {
    return {
      json_consoles: {},
      json_roms: roms,

      search: "",
      showList: false,
      items: [],
    };
  },
  methods: {
    filterItems() {
      const value = this.search.toLowerCase();
      this.items = this.json_roms
        .filter((item) => item.name.toLowerCase().includes(value))
        .slice()
        .sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
      this.showItems();
    },
    selectItem(item) {
      this.search = item;
      this.showList = false;
    },
    showItems() {
      this.showList = this.search != "";
    },
    hideItems() {
      setTimeout(() => {
        this.showList = false;
      }, 200);
    },
  },
  mounted() {
    this.json_consoles = consoles.slice().reduce((acc, console) => {
      acc[console.id] = console;
      return acc;
    }, {});
  },
};
</script>

<style scoped>
.container {
  margin: 0 10px 0 10px;
  width: 30%;
  position: relative;
}
.search-bar {
  display: flex;
  border: 2px solid #fff;
  border-radius: 20px;
}
@media (max-width: 800px) {
  .container {
    width: 40%;
  }
}
@media (max-width: 600px) {
  .container {
    width: 50%;
  }
}
@media (max-width: 400px) {
  .container {
    width: 100%;
  }
}

.icon {
  padding: 7px 10px 5px 16px;
}

.search-input {
  background: transparent;
  border: 0;
  outline: none;
  color: #fff;
  padding: 0 10px 0 0;
}

.search-results {
  color: #000;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
}
.item-result {
  color: #000;
  display: flex;
  align-items: center;
  margin-bottom: 1px;
  text-decoration: none;
}
.item-result:hover {
  background: #eee;
}
.item-result .img-rom,
.item-result .img-console {
  width: 60px;
}
.item-result .info {
  flex: 1;
  padding: 8px;
}
.item-result .info .name-console {
  color: #999;
  font-size: 13px;
  font-weight: bold;
}
.not-found-items {
  color: #999;
  padding: 10px;
}
</style>
