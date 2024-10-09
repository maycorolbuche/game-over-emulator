<template>
  <div id="emulator" class="d-flex align-stretch" style="height: 100%">
    <div id="emulator-container" style="overflow: hidden">
      <div v-if="interact" class="loading">CLIQUE PARA INICIAR</div>
      <div v-else-if="loading" class="loading">CARREGANDO</div>
      <canvas id="emulator-canvas" style="width: 100%; height: 100%" />
    </div>
    <div>
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
    </div>
  </div>
</template>

<script>
import { Nostalgist } from "nostalgist";

export default {
  name: "GameComponent",
  inheritAttrs: false,
  props: {
    name: String,
    filename: String,
    image: String,
    console: String,
    core: String,
  },
  data() {
    return {
      loading: false,
      nostalgist: null,
      interact: true,
    };
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
      console.log("PAUSE!!");
      if (this.nostalgist) {
        console.log("PAUSE");
        this.nostalgist.pause();
      }
    },
    play() {
      if (this.nostalgist) {
        console.log("PLAY");
        this.nostalgist.resume();
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
        document.getElementById("emulator").clientWidth - 150 + "px";
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
#emulator-container {
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
</style>
