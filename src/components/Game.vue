<template>
  <div
    id="emulator"
    ref="emulator"
    class="d-flex align-stretch"
    style="height: 100%"
  >
    <div
      id="emulator-container"
      ref="emulatorContainer"
      style="overflow: hidden"
      @click="play()"
    >
      <div v-if="is_paused && !interact && !loading" class="message">
        PAUSADO
      </div>

      <a v-if="interact" class="link loading" href="javascript:">
        CLIQUE PARA INICIAR
      </a>
      <div v-else-if="loading" class="loading">CARREGANDO</div>

      <canvas
        id="emulator-canvas"
        ref="emulatorCanvas"
        :style="{
          width: '100%',
          height: '100%',
          opacity: this.is_paused ? 0.2 : 1,
        }"
      />
    </div>
    <div
      v-if="!fullscreen"
      class="d-flex flex-column align-center"
      style="width: 180px; color: #fff"
    >
      <div v-if="image" class="text-center" style="width: 100%">
        <img :src="image" style="width: 100%" />
      </div>
      <div v-if="console_image" class="text-center" style="width: 100%">
        <img :src="console_image" style="calc(100% - 20px)" />
      </div>
      <div class="flex-auto" />
      <div class="d-flex flex-column align-center" style="padding-bottom: 10px">
        <a :class="{ link: true }" href="javascript:" @click="close()">
          CONTROLES
        </a>
        <a
          v-if="!is_paused"
          :class="{ link: true, disabled: loading || interact }"
          href="javascript:"
          @click="pause()"
        >
          PAUSAR
        </a>
        <a
          v-if="is_paused"
          :class="{ link: true, disabled: loading || interact }"
          href="javascript:"
          @click="play()"
        >
          CONTINUAR
        </a>
        <a
          :class="{ link: true, disabled: loading || interact }"
          href="javascript:"
          @click="saveState(0)"
        >
          SALVAR
        </a>
        <a
          :class="{ link: true, disabled: loading || interact }"
          href="javascript:"
          @click="loadState(0)"
        >
          CARREGAR
        </a>
        <a
          :class="{ link: true, disabled: loading || interact }"
          href="javascript:"
          @click="toggleFullscreen()"
        >
          TELA CHEIA</a
        >
        <a
          :class="{ link: true, disabled: loading || interact }"
          href="javascript:"
          @click="restartGame()"
        >
          REINICIAR
        </a>
        <a :class="{ link: true }" href="javascript:" @click="close()">
          FECHAR
        </a>
        {{ slot }}
      </div>
    </div>
  </div>
</template>

<script>
const Storage = require("@/helpers/Storage.js");
const Conversions = require("@/helpers/Conversions.js");

import { Nostalgist } from "nostalgist";
import Swal from "sweetalert2";

export default {
  name: "GameComponent",
  inheritAttrs: false,
  props: {
    id: String,
    name: String,
    filename: String,
    image: String,
    console: String,
    console_image: String,
    core: String,
  },
  data() {
    return {
      loading: false,
      nostalgist: null,
      interact: true,
      is_paused: false,
      fullscreen: false,
      slot: {
        1: null,
        2: null,
        3: null,
        4: null,
        5: null,
        6: null,
        7: null,
        8: null,
        9: null,
        0: null,
      },
    };
  },
  watch: {
    fullscreen(val) {
      this.handleResize();
      if (val) {
        this.play();
      }
    },
  },
  methods: {
    async launchGame() {
      if (this.interact) {
        return;
      }

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
    restart() {
      if (this.nostalgist) {
        this.nostalgist.restart();
      }
    },
    restartGame() {
      this.pause();
      Swal.fire({
        title: "Deseja reinicar este jogo?",
        showCancelButton: true,
        confirmButtonText: "Sim",
        cancelButtonText: `Não`,
      }).then((result) => {
        if (result.isConfirmed) {
          if (this.nostalgist) {
            this.restart();
          }
        }
        this.play();
      });
    },
    close() {
      this.pause();
      Swal.fire({
        title: "Deseja fechar este jogo?",
        showCancelButton: true,
        confirmButtonText: "Sim",
        cancelButtonText: `Não`,
      }).then((result) => {
        if (result.isConfirmed) {
          this.$emit("close");
        } else {
          this.play();
        }
      });
    },
    async saveState(slot) {
      if (this.nostalgist) {
        const { state } = await this.nostalgist.saveState();
        this.slot[slot] = await Conversions.blobToBase64(state);
        console.log(`Estado salvo no slot ${slot}`, state);
        Storage.set(this.console + "." + this.id, this.slot);
      }
    },

    async loadState(slot) {
      if (this.nostalgist) {
        if (this.slot[slot]) {
          const state = Conversions.base64ToBlob(this.slot[slot]);
          await this.nostalgist.loadState(state);
          this.play();
          console.log(`Estado carregado do slot ${slot}`);
        } else {
          console.log(`Nenhum estado salvo no slot ${slot}`);
        }
      }
    },
    toggleFullscreen() {
      let elem = this.$refs.emulatorCanvas;
      if (!this.fullscreen) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen(); // Firefox
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen(); // Chrome, Safari, Opera
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen(); // IE/Edge
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen(); // Firefox
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen(); // Chrome, Safari, Opera
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen(); // IE/Edge
        }
      }
    },
    onFullscreenChange() {
      this.fullscreen = !!(
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
    },
    handleUserInteraction() {
      if (this.interact) {
        this.play();
        this.interact = false;
        this.launchGame();
      }
    },
    handleResize() {
      if (this.fullscreen) {
        this.$refs.emulatorContainer.style.width =
          this.$refs.emulator.clientWidth + "px";
      } else {
        this.$refs.emulatorContainer.style.width =
          this.$refs.emulator.clientWidth - 180 + "px";
      }

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

    document.addEventListener("fullscreenchange", this.onFullscreenChange);
    document.addEventListener(
      "webkitfullscreenchange",
      this.onFullscreenChange
    );
    document.addEventListener("mozfullscreenchange", this.onFullscreenChange);
    document.addEventListener("msfullscreenchange", this.onFullscreenChange);

    this.handleResize();

    this.slot = Storage.get(this.console + "." + this.id, {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
      6: null,
      7: null,
      8: null,
      9: null,
      0: null,
    });

    this.launchGame();
  },
  beforeUnmount() {
    if (this.nostalgist) {
      this.nostalgist.exit();
    }

    window.removeEventListener("click", this.handleUserInteraction);
    window.removeEventListener("keydown", this.handleUserInteraction);
    window.removeEventListener("scroll", this.handleUserInteraction);
    window.removeEventListener("resize", this.handleResize);

    document.removeEventListener("fullscreenchange", this.onFullscreenChange);
    document.removeEventListener(
      "webkitfullscreenchange",
      this.onFullscreenChange
    );
    document.removeEventListener(
      "mozfullscreenchange",
      this.onFullscreenChange
    );
    document.removeEventListener("msfullscreenchange", this.onFullscreenChange);
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
a.link {
  font-family: "Press Start 2P", cursive;
  color: #fff;
  text-decoration: none;
  font-size: 14px;
  padding: 5px 0;
}
a.link:hover {
  animation: piscar 0.3s infinite alternate;
}
a.disabled {
  color: #333;
  pointer-events: none;
  cursor: not-allowed;
}

@keyframes piscar {
  from {
    color: #fff;
  }
  to {
    color: #faa914;
  }
}
</style>
