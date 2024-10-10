<template>
  <div id="emulator" class="d-flex align-stretch" style="height: 100%">
    <div
      id="emulator-container"
      ref="emulatorContainer"
      style="overflow: hidden"
    >
      <div v-if="is_paused && !interact && !loading" class="message">
        PAUSADO
      </div>

      <div v-if="interact" class="loading" style="cursor: pointer">
        CLIQUE PARA INICIAR
      </div>
      <div v-else-if="loading" class="loading">CARREGANDO</div>

      <canvas
        id="emulator-canvas"
        :style="{
          width: '100%',
          height: '100%',
          opacity: this.is_paused ? 0.2 : 1,
        }"
      />
    </div>
    <div class="d-flex flex-column align-center" style="width: 180px">
      <img v-if="image" :src="image" style="width: 100%" />
      <div class="text-center" style="width: 100%">
        <img
          v-if="console_image"
          :src="console_image"
          style="calc(100% - 20px)"
        />
      </div>
      <!--
      <div style="overflow: scroll">
        <a href="javascript:" @click="close()">FECHAR</a>
        COL1
        <button @click="launchGame">Iniciar Jogo</button>
        <button @click="pause">PAUSE</button>
        <button @click="play">PLAY</button>
        <p>
          {{ loading }}
        </p>
        {{ name }} <br />
        {{ filename }} <br />
        {{ image }} <br />
        {{ console }}
        ----{{ interact }} [{{ core }}]
        <br />
        PAUSADO? {{ is_paused }} |{{ console_image }}
      </div>
    --></div>
  </div>
</template>

<script>
import { Nostalgist } from "nostalgist";

import consoles from "@/json/consoles.json";
import roms from "@/json/roms.json";

export default {
  name: "GamePage",
  inheritAttrs: false,
  data() {
    return {
      json_consoles: consoles,
      json_roms: roms,

      loading: false,
      nostalgist: null,
      interact: true,
      is_paused: false,
    };
  },
  computed: {
    consol() {
      return this.json_consoles.filter(
        (console) => console.id === this.console_id
      )[0];
    },
    roms() {
      return this.json_roms.filter(
        (rom) => rom.id === this.rom_id && rom.console === this.console_id
      )[0];
    },
  },
  methods: {
    async launchGame() {
      console.log("LAUNCH");
      if (this.interact) {
        return;
      }
      console.log("LAUNCH OK");

      let file = `/roms/${this.console}/${this.filename}`;

      try {
        this.loading = true;

        this.nostalgist = await Nostalgist.launch({
          element: "#emulator-canvas",
          rom: file,
          core: this.core,
          //core: "fceumm",
        });

        this.loading = false;
      } catch (error) {
        this.nostalgist = null;
        console.error("Erro ao iniciar o jogo: ", error);
      }
      /*
      https://www.igdb.com/
      */
    },
    pause() {
      if (this.nostalgist) {
        this.nostalgist.pause();
        this.is_paused = true;
      }
    },
    play() {
      if (this.nostalgist) {
        this.nostalgist.resume();
        this.is_paused = false;
      }
    },
    close() {
      this.$emit("close");
    },

    handleUserInteraction() {
      if (this.interact) {
        this.play();
        this.interact = false;
        this.launchGame();
        console.log("Interação detectada!");
      }
    },
    handleResize() {
      document.getElementById("emulator-container").style.width =
        document.getElementById("emulator").clientWidth - 180 + "px";

      if (this.nostalgist) {
        this.nostalgist.resize({
          width: this.$refs.emulatorContainer.getBoundingClientRect().width,
          height: this.$refs.emulatorContainer.getBoundingClientRect().height,
        });
      }
    },
  },
  mounted() {
    window.addEventListener("click", this.handleUserInteraction);
    window.addEventListener("keydown", this.handleUserInteraction);
    window.addEventListener("scroll", this.handleUserInteraction);
    window.addEventListener("resize", this.handleResize);
    this.handleResize();

    this.launchGame();
  },
  beforeUnmount() {
    console.log("DESTRUIR");
    if (this.nostalgist) {
      this.nostalgist.exit();
    }

    window.removeEventListener("click", this.handleUserInteraction);
    window.removeEventListener("keydown", this.handleUserInteraction);
    window.removeEventListener("scroll", this.handleUserInteraction);
    window.removeEventListener("resize", this.handleResize);
  },
};
</script>

<style scoped>
#emulator {
  background: #000;
}

.loading {
  font-family: "Press Start 2P", cursive;
  width: 100%;
  height: 100%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.message {
  color: #fff;
  position: absolute;
  margin: 5px;
  padding: 10px;
  background: #000;
  font-family: "Press Start 2P", cursive;
  z-index: 300;
}
</style>
