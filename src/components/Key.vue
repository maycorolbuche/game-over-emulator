<template>
  <div class="d-flex align-center">
    <div class="d-flex align-center">
      <template v-for="key in keys" :key="key">
        <div class="key">
          <div v-html="info_key(key)" />
        </div>
        <div v-if="key !== keys[keys.length - 1]">+</div>
      </template>
    </div>
    <div :class="{ ref: true, button: isButton(button) }">
      <div v-html="info(button)" />
    </div>
  </div>
</template>

<script>
export default {
  name: "LogoComponent",
  inheritAttrs: false,
  props: {
    kkey: [String, Array],
    button: String,
  },
  computed: {
    keys() {
      if (typeof this.kkey === "string") {
        return [this.kkey];
      }
      return this.kkey;
    },
  },
  methods: {
    info(key) {
      switch (key.toLowerCase()) {
        case "pause":
          return "Pausar";
        case "save":
          return "Salvar";
        case "load":
          return "Carregar";
        case "fullscreen":
          return "Tela cheia";
        case "restart":
          return "Reiniciar";
        case "accelerate":
          return "Acelerar";
        case "rewind":
          return "Rebobinar (segurar)";
        case "start":
          return "Start";
        case "mode":
          return "Mode";
        case "button1":
          return "1";
        case "button2":
          return "2";
        case "turbo_a":
          return "Turbo A";
        case "turbo_b":
          return "Turbo B";
        case "select":
          return "Select";
        case "up":
          return "&#11205;";
        case "down":
          return "&#11206;";
        case "left":
          return "&#11207;";
        case "right":
          return "&#11208;";
        default:
          return key.toUpperCase();
      }
    },
    info_key(key) {
      key = key.toUpperCase();
      key = key.replace("KEYPAD", "NUM ");
      switch (key) {
        case "SPACE":
          return "ESPAÇO";
        case "UP":
          return "&#11105;";
        case "DOWN":
          return "&#11107;";
        case "LEFT":
          return "&#11104;";
        case "RIGHT":
          return "&#11106;";
        default:
          return key;
      }
    },
    isButton(key) {
      key = key.toLowerCase();
      return (
        ["mode", "button1", "button2", "turbo_a", "turbo_b"].includes(key) ||
        key == "start" ||
        key == "select" ||
        key == "a" ||
        key == "b" ||
        key == "c" ||
        key == "x" ||
        key == "y" ||
        key == "z" ||
        key == "l" ||
        key == "r" ||
        key == "up" ||
        key == "down" ||
        key == "left" ||
        key == "right"
      );
    },
  },
};
</script>

<style scoped>
.key {
  border: 1px solid #fff;
  padding: 5px 10px;
  border-radius: 5px;
  margin: 1px;
  font-weight: bold;
  font-size: 10px;
}
.ref {
  margin-left: 8px;
  font-size: 10px;
}
.button {
  background: #fff;
  color: #000;
  padding: 0 10px;
  border-radius: 5px;
  font-weight: bold;
}
</style>
