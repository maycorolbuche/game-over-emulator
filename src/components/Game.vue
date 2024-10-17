<template>
  <div
    id="emulator"
    ref="emulator"
    class="d-flex align-stretch"
    style="height: 100%"
  >
    <button v-show="false" v-shortkey.push="['\'']" @shortkey="speed" />
    <div
      id="emulator-container"
      ref="emulatorContainer"
      style="overflow: hidden"
      @click="play()"
    >
      <div
        v-if="(is_paused || message) && !interact && !loading"
        class="message"
      >
        {{ is_paused ? "EMULADOR PAUSADO" : "" }}
        {{ is_paused && message ? " | " : "" }}
        {{ message }}
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
      v-show="!fullscreen"
      class="d-flex flex-column align-stretch"
      style="width: 180px; color: #fff"
    >
      <div v-if="image" class="text-center" style="width: 100%">
        <img :src="image" style="width: 100%" />
      </div>
      <div
        v-show="!show_controls"
        v-if="console_image"
        class="text-center"
        style="width: 100%"
      >
        <img :src="console_image" style="calc(100% - 20px)" />
      </div>
      <div class="flex-auto" />
      <div v-show="!show_controls" class="overflow-auto">
        <div
          class="d-flex flex-column align-center"
          style="padding-bottom: 10px"
        >
          <a
            :class="{ link: true }"
            href="javascript:"
            @click="show_controls = true"
          >
            CONTROLES
          </a>
          <a
            v-if="!is_paused"
            :class="{ link: true, disabled: loading || interact }"
            href="javascript:"
            v-shortkey.once="['ctrl', 'enter']"
            @click="pause()"
            @shortkey="pause()"
          >
            PAUSAR
          </a>
          <a
            v-if="is_paused"
            :class="{ link: true, disabled: loading || interact }"
            href="javascript:"
            v-shortkey.once="['ctrl', 'enter']"
            @click="play()"
            @shortkey="play()"
          >
            CONTINUAR
          </a>
          <a
            :class="{ link: true, disabled: loading || interact }"
            href="javascript:"
            v-shortkey.once="['shift', '+']"
            @click="saveState(0)"
            @shortkey="saveState(0)"
          >
            SALVAR
          </a>
          <a
            :class="{ link: true, disabled: loading || interact }"
            href="javascript:"
            v-shortkey.once="['=']"
            @click="loadState(0)"
            @shortkey="loadState(0)"
          >
            CARREGAR
          </a>
          <a
            :class="{ link: true, disabled: loading || interact }"
            href="javascript:"
            v-shortkey.once="['f11']"
            @click="toggleFullscreen()"
            @shortkey="toggleFullscreen()"
          >
            TELA CHEIA
          </a>
          <a
            :class="{ link: true, disabled: loading || interact }"
            href="javascript:"
            v-shortkey.once="['tab']"
            @click="restartGame()"
            @shortkey="restartGame()"
          >
            REINICIAR
          </a>
          <a
            :class="{ link: true, sticky: true }"
            href="javascript:"
            @click="close()"
          >
            FECHAR
          </a>
        </div>
      </div>
      <div v-show="show_controls" class="overflow-auto">
        <div class="d-flex flex-column" style="padding: 5px 5px 10px 10px">
          <div
            v-for="player in game_controls"
            :key="player.player"
            style="margin-bottom: 10px"
          >
            <div>{{ player.name }}</div>
            <key
              v-for="key in player.controls"
              :key="key.key"
              :info_key="key.key"
              :info_ref="key.ref"
            />
          </div>
          <a
            :class="{ link: true, sticky: true }"
            href="javascript:"
            @click="show_controls = false"
          >
            VOLTAR
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const Storage = require("@/helpers/Storage.js");
const Conversions = require("@/helpers/Conversions.js");
const Screen = require("@/helpers/Screen.js");

import Key from "@/components/Key.vue";

import { Nostalgist } from "nostalgist";
import Swal from "sweetalert2";

export default {
  name: "GameComponent",
  components: {
    Key,
  },
  inheritAttrs: false,
  props: {
    id: String,
    name: String,
    filename: String,
    image: String,
    console: String,
    console_image: String,
    controls: Array,
  },
  data() {
    return {
      message: null,
      loading: false,
      nostalgist: null,
      interact: true,
      is_paused: false,
      fullscreen: false,
      show_controls: false,
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
  computed: {
    game_controls() {
      return [
        {
          player: "-",
          name: "Emulador",
          controls: [
            {
              key: ["CTRL", "ENTER"],
              ref: "Pausar",
            },
            {
              key: ["SHIFT", "="],
              ref: "Salvar",
            },
            {
              key: "=",
              ref: "Carregar",
            },
            {
              key: "F11",
              ref: "Tela Cheia",
            },
            {
              key: "TAB",
              ref: "Reiniciar",
            },
            {
              key: "'",
              ref: "Acelerar",
            },
          ],
        },
        ...(this.controls || []),
      ];
    },
  },
  watch: {
    fullscreen(val) {
      this.handleResize();
      setTimeout(() => {
        this.handleResize();
      }, 100);
      if (val) {
        this.play();
      }
    },
    message(text) {
      if (text) {
        setTimeout(() => {
          this.message = null;
        }, 2500);
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

        let config = {
          element: "#emulator-canvas",
          rom: file,
          core: (() => {
            switch (this.filename.split(".").pop().toLowerCase()) {
              case "nes":
                return "fceumm";
              case "sfc":
              case "smc":
                return "snes9x";
              case "gba":
                return "mgba";
              case "gb":
              case "gbc":
                return "gambatte";
              case "smd":
                return "genesis_plus_gx";
              default:
                return "";
            }
          })(),
          retroarchConfig: {
            input_player1_start: "enter",
            input_player1_select: "shift",

            input_player1_a: "z",
            input_player1_b: "x",
            input_player1_c: "c",
            input_player1_x: "a",
            input_player1_y: "s",
            input_player1_z: "d",
            input_player1_l: "d",
            input_player1_r: "c",

            input_player1_up: "up",
            input_player1_left: "left",
            input_player1_down: "down",
            input_player1_right: "right",

            input_player2_start: "0",
            input_player2_select: ",",

            input_player2_a: "b",
            input_player2_b: "n",
            input_player2_c: "m",
            input_player2_x: "h",
            input_player2_y: "j",
            input_player2_z: "k",
            input_player2_l: "k",
            input_player2_r: "m",

            input_player2_up: "keypad5",
            input_player2_left: "keypad1",
            input_player2_down: "keypad2",
            input_player2_right: "keypad3",
          },
        };
        console.log("Iniciando....", config);
        this.nostalgist = await Nostalgist.launch(config);

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
      if (this.nostalgist && !this.is_paused) {
        this.nostalgist.pause();
        this.is_paused = true;
      }
    },
    play() {
      if (this.nostalgist && this.is_paused) {
        this.nostalgist.resume();
        this.is_paused = false;
      }
    },
    restart() {
      if (this.nostalgist) {
        this.nostalgist.restart();
      }
    },
    speed() {
      if (this.nostalgist) {
        console.log("FAST_FORWARD");
        this.nostalgist.sendCommand("FAST_FORWARD");
      }
    },
    restartGame() {
      if (this.nostalgist) {
        if (this.fullscreen) {
          this.toggleFullscreen();
        }
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
      }
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
        this.message = "Salvo";
        Storage.set(this.console + "." + this.id, this.slot);
      }
    },

    async loadState(slot) {
      if (this.nostalgist) {
        if (this.slot[slot]) {
          const state = Conversions.base64ToBlob(this.slot[slot]);
          await this.nostalgist.loadState(state);
          this.play();
          this.message = "Carregado";
        } else {
          this.message = "Nada a ser carregado";
        }
      }
    },
    toggleFullscreen() {
      if (!this.fullscreen) {
        Screen.fullscreen(this.$refs.emulatorContainer);
      } else {
        Screen.exitFullscreen();
      }
    },
    onFullscreenChange() {
      this.fullscreen = Screen.isFullscreen();
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
  text-transform: uppercase;
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

a.sticky {
  position: sticky;
  bottom: 0;
  background: #000;
  padding: 7px 10px;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #222;
}
::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #666;
}
</style>
