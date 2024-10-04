<template>
  <div id="logo" class="text-uppercase" :style="{ fontSize: size }">
    <div id="text-back" class="text-container">
      <div v-for="(line, key) in logoText" :key="key" class="text">
        {{ line }}
      </div>
    </div>

    <div id="text-main" class="text-container">
      <div v-for="(line, key) in logoText" :key="key" class="text">
        {{ line }}
      </div>
    </div>

    <div id="text-border-blue" class="text-container">
      <div v-for="(line, key) in logoText" :key="key" class="text">
        {{ line }}
      </div>
    </div>

    <div id="text-border-white" class="text-container">
      <div v-for="(line, key) in logoText" :key="key" class="text">
        {{ line }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LogoComponent",
  inheritAttrs: false,
  props: {
    size: String,
    text: [String, Boolean],
  },
  computed: {
    logoText() {
      if (!this.text) return ["game", "over"];
      if (Array.isArray(this.text)) return this.text;
      return [this.text];
    },
  },
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Montserrat:wght@400;700&display=swap");

#logo {
  font-family: "Press Start 2P", cursive;
  display: flex;
  user-select: none;
}

.text-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

#text-main .text {
  background: linear-gradient(
    to bottom,
    #41f7fb,
    #41f7fb,
    #1e0273,
    #f004fe,
    #f004fe,
    #f004fe
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

#text-back .text {
  background: linear-gradient(to bottom, #faa914, #ea004f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

#text-border-blue {
  position: absolute;
  color: transparent;
  -webkit-text-stroke: 1px #040138;
}

#text-border-white {
  position: absolute;
  color: transparent;
  -webkit-text-stroke: 1px #ffffff;
  margin-left: -2px;
}

#text-back {
  position: absolute;
  z-index: -1;
  margin-top: 4px;
  margin-left: 4px;
}
</style>
