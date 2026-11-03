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
      @click="resumeFromCanvas()"
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
        v-show="!interact && !loading && !launch_error"
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
        <img :src="console_image" width="160" />
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
            :class="{ link: true, disabled: loading || interact || !!launch_error }"
            href="javascript:"
            v-shortkey.once="['ctrl', 'enter']"
            @click="pause()"
            @shortkey="pause()"
          >
            PAUSAR
          </a>
          <a
            v-if="is_paused"
            :class="{ link: true, disabled: loading || interact || !!launch_error }"
            href="javascript:"
            v-shortkey.once="['ctrl', 'enter']"
            @click="play()"
            @shortkey="play()"
          >
            CONTINUAR
          </a>
          <a
            :class="{ link: true, disabled: loading || interact || !!launch_error }"
            href="javascript:"
            v-shortkey.once="['shift', '+']"
            @click="saveState(0)"
            @shortkey="saveState(0)"
          >
            SALVAR
          </a>
          <a
            :class="{ link: true, disabled: loading || interact || !!launch_error }"
            href="javascript:"
            v-shortkey.once="['=']"
            @click="loadState(0)"
            @shortkey="loadState(0)"
          >
            CARREGAR
          </a>
          <a
            :class="{ link: true, disabled: loading || interact || !!launch_error }"
            href="javascript:"
            v-shortkey.once="['f11']"
            @click="toggleFullscreen()"
            @shortkey="toggleFullscreen()"
          >
            TELA CHEIA
          </a>
          <a
            :class="{ link: true, disabled: loading || interact || !!launch_error }"
            href="javascript:"
            v-shortkey.once="['tab']"
            @click="restartGame()"
            @shortkey="restartGame()"
          >
            REINICIAR
          </a>
          <button class="link" :disabled="!nostalgist || save_busy" @click="exportSave()">EXPORTAR</button>
          <button class="link" :disabled="!nostalgist || save_busy" @click="$refs.importFile.click()">IMPORTAR</button>
          <input ref="importFile" type="file" accept=".json,application/json" hidden @change="importSave($event)" />
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
            v-for="(controls, player) in game_controls"
            :key="player"
            style="margin-bottom: 10px"
          >
            <div>{{ info_player(player) }}</div>
            <key
              v-for="(key, button) in controls"
              :key="button"
              :kkey="key"
              :button="button"
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
import { markRaw } from "vue";
import * as SaveTransfer from "@/helpers/SaveTransfer.mjs";
import * as EmulatorState from "@/helpers/EmulatorState.mjs";
import Storage from "@/helpers/Storage.js";
import Conversions from "@/helpers/Conversions.js";
import Screen from "@/helpers/Screen.js";

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
    controls: Object,
  },
  data() {
    return {
      launch_error: null,
      session_closed: false,
      launch_id: 0,
      launch_controller: null,
      resize_timer: null,
      message_timer: null,
      save_error: null,
      save_busy: false,
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
      return {
        emulator: {
          pause: ["CTRL", "ENTER"],
          save: ["SHIFT", "="],
          load: "=",
          fullscreen: "F11",
          restart: "TAB",
          accelerate: "'",
        },
        ...(this.controls || {}),
      };
    },
    retroarch_controls() {
      let result = {};

      Object.keys(this.controls).map((player) => {
        Object.keys(this.controls[player]).map((button) => {
          const key = this.controls[player][button];
          if (this.console == "gens") {
            switch (button) {
              case "a":
                button = "y";
                break;
              case "y":
                button = "c";
                break;
              case "c":
                button = "a";
                break;
            }
          }
          result[`input_${player}_${button}`] = key;
        });
      });
      return result;
    },
  },
  watch: {
    launch_error(text) {
      if (text) this.showError(text, true);
    },
    save_error(text) {
      if (text) this.showError(text);
    },
    fullscreen(val) {
      this.handleResize();
      clearTimeout(this.resize_timer);
      this.resize_timer = setTimeout(() => {
        if (!this.session_closed) this.handleResize();
      }, 100);
      if (val) {
        this.play();
      }
    },
    message(text) {
      if (text) {
        clearTimeout(this.message_timer);
        this.message_timer = setTimeout(() => {
          if (!this.session_closed) this.message = null;
        }, 2500);
      }
    },
  },
  methods: {
    resumeFromCanvas() {
      if (!Swal.isVisible()) this.play();
    },
    async showError(text, retry = false) {
      if (this.session_closed) return;
      const instance = this.nostalgist;
      const wasPaused = this.is_paused;
      this.pause();
      const result = await Swal.fire({
        icon: "error",
        title: retry ? "Não foi possível iniciar" : "Não foi possível concluir",
        text,
        confirmButtonText: retry ? "Tentar novamente" : "Entendi",
        showCancelButton: retry,
        cancelButtonText: "Fechar jogo",
        allowOutsideClick: false,
        allowEscapeKey: !retry,
        heightAuto: false,
        target: this.$refs.emulatorContainer,
      });
      if (this.session_closed) return;
      if (retry) {
        if (result.isConfirmed) this.launchGame();
        else {
          this.disposeGame();
          this.$emit("close");
        }
      } else if (!wasPaused && this.nostalgist === instance) {
        this.play();
      }
    },
    async launchGame() {
      if (this.interact || this.loading || this.nostalgist || this.session_closed) return;
      const attempt = ++this.launch_id;
      this.launch_controller = markRaw(new AbortController());
      this.launch_error = null;
      this.is_paused = false;
      let file = this.filename;

      try {
        this.loading = true;

        let config = {
          element: this.$refs.emulatorCanvas,
          signal: this.launch_controller.signal,
          rom: file,
          core: (() => {
            switch (this.console) {
              case "nes":
                return "fceumm";
              case "snes":
                return "snes9x";
              case "gba":
                return "mgba";
              /*  case "gb":
                case "gbc":
                  return "gambatte";*/
              case "gens":
              case "sms":
                return "genesis_plus_gx";
              default:
                return "";
            }
          })(),
          retroarchConfig: {
            savestate_thumbnail_enable: false,
            ...this.retroarch_controls,
          },
        };
        const instance = await Nostalgist.launch(config);
        if (this.session_closed || attempt !== this.launch_id) {
          instance.exit({ removeCanvas: false });
          return;
        }
        this.nostalgist = markRaw(instance);
      } catch (error) {
        if (!this.session_closed && attempt === this.launch_id) {
          this.nostalgist = null;
          this.launch_error = "Não foi possível iniciar o jogo. Verifique sua conexão e tente novamente.";
          console.error("Erro ao iniciar o jogo:", error);
        }
      } finally {
        if (!this.session_closed && attempt === this.launch_id) this.loading = false;
      }
    },
    disposeGame() {
      if (this.session_closed) return;
      this.session_closed = true;
      this.launch_id++;
      if (this.loading) this.launch_controller?.abort();
      clearTimeout(this.resize_timer);
      clearTimeout(this.message_timer);
      const instance = this.nostalgist;
      this.nostalgist = null;
      this.loading = false;
      try {
        if (instance) instance.exit({ removeCanvas: false });
      } catch (error) {
        console.error("Erro ao encerrar o jogo:", error);
      }
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
          if (this.session_closed) return;
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
        if (this.session_closed) return;
        if (result.isConfirmed) {
          this.disposeGame();
          this.$emit("close");
        } else {
          this.play();
        }
      });
    },
    async restoreCurrentState(instance, state) {
      const wasPaused = this.is_paused;
      if (wasPaused) this.play();
      try {
        await EmulatorState.restoreState(instance, state, { active: () => !this.session_closed && this.nostalgist === instance });
      } finally {
        if (wasPaused && !this.session_closed && this.nostalgist === instance) this.pause();
      }
    },
    async captureCurrentState(instance) {
      const wasPaused = this.is_paused;
      if (wasPaused) this.play();
      try {
        return await EmulatorState.captureState(instance, { active: () => !this.session_closed && this.nostalgist === instance });
      } finally {
        if (wasPaused && !this.session_closed && this.nostalgist === instance) this.pause();
      }
    },
    async exportSave() {
      const instance = this.nostalgist;
      if (!instance || this.save_busy || this.session_closed) return;
      this.save_busy = true;
      this.save_error = null;
      const paused = this.is_paused;
      try {
        const { state } = await this.captureCurrentState(instance);
        const identity = await SaveTransfer.gameIdentity(instance, this.console, this.id);
        const json = await SaveTransfer.exportState(state, identity);
        if (this.session_closed || this.nostalgist !== instance) return;
        const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = ("game-over-" + this.console + "-" + this.id).replace(/[^a-zA-Z0-9_-]/g, "_") + ".save.json";
        document.body.append(link);
        try { link.click(); } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
        this.message = "Estado atual exportado";
      } catch (error) {
        if (!this.session_closed) this.save_error = "Não foi possível exportar: " + error.message;
      } finally {
        this.save_busy = false;
        if (!paused && !this.session_closed && this.nostalgist === instance) this.play();
      }
    },
    async importSave(event) {
      const file = event.target.files?.[0];
      event.target.value = "";
      const instance = this.nostalgist;
      if (!file || !instance || this.save_busy || this.session_closed) return;
      this.save_busy = true;
      this.save_error = null;
      try {
        const identity = await SaveTransfer.gameIdentity(instance, this.console, this.id);
        const state = await SaveTransfer.importState(file, identity);
        if (this.session_closed || this.nostalgist !== instance) return;
        await this.restoreCurrentState(instance, state);
        if (this.session_closed || this.nostalgist !== instance) return;
        this.play();
        this.message = "Save importado e carregado";
      } catch (error) {
        if (!this.session_closed) this.save_error = "Não foi possível importar: " + error.message;
      } finally {
        this.save_busy = false;
      }
    },
    readSavedSlots() {
      const slots = Storage.get(this.console + "." + this.id, {});
      if (!slots || typeof slots !== "object" || Array.isArray(slots) ||
          Object.entries(slots).some(([key, value]) =>
            !/^[0-9]$/.test(key) || (value !== null &&
              (typeof value !== "string" || !/^data:[^,]*;base64,[A-Za-z0-9+/]+={0,2}$/.test(value))))) {
        throw new Error("INVALID_SAVE");
      }
      return slots;
    },
    saveFailure(error, action) {
      if (this.session_closed) return;
      this.message = null;
      if (error?.name === "QuotaExceededError" || error?.name === "NS_ERROR_DOM_QUOTA_REACHED") {
        this.save_error = "Não foi possível salvar: o armazenamento do navegador está cheio. O salvamento anterior foi mantido.";
      } else if (error instanceof SyntaxError || error?.message === "INVALID_SAVE" || error?.name === "InvalidCharacterError") {
        this.save_error = "O salvamento deste jogo contém dados inválidos. Os dados foram preservados; não foi possível " + action + ".";
      } else {
        this.save_error = "Não foi possível " + action + " o progresso. Verifique se o navegador permite armazenar dados deste site e tente novamente.";
      }
    },
    async saveState(slot) {
      const instance = this.nostalgist;
      if (!instance || this.session_closed || this.save_busy) return;
      this.save_busy = true;
      this.save_error = null;
      try {
        const previous = this.readSavedSlots();
        const { state } = await this.captureCurrentState(instance);
        const encoded = await Conversions.blobToBase64(state);
        if (this.session_closed || this.nostalgist !== instance) return;
        const next = { ...previous, [slot]: encoded };
        Storage.set(this.console + "." + this.id, next);
        this.slot = next;
        this.message = "Salvo";
      } catch (error) {
        this.saveFailure(error, "salvar");
      } finally {
        this.save_busy = false;
      }
    },
    async loadState(slot) {
      const instance = this.nostalgist;
      if (!instance || this.session_closed || this.save_busy) return;
      this.save_busy = true;
      this.save_error = null;
      try {
        const saved = this.readSavedSlots();
        if (!saved[slot]) {
          this.message = "Nada a ser carregado";
          return;
        }
        const state = Conversions.base64ToBlob(saved[slot]);
        await this.restoreCurrentState(instance, state);
        if (this.session_closed || this.nostalgist !== instance) return;
        this.slot = saved;
        this.play();
        this.message = "Carregado";
      } catch (error) {
        this.saveFailure(error, "carregar");
      } finally {
        this.save_busy = false;
      }
    },
    toggleFullscreen() {
      if (!this.nostalgist || this.session_closed) return;
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
      if (this.interact && !this.session_closed) {
        this.play();
        this.interact = false;
        this.launchGame();
      }
    },
    handleResize() {
      if (this.session_closed || !this.$refs.emulatorContainer || !this.$refs.emulator) return;
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
    info_player(info) {
      if (info.startsWith("player")) {
        const playerNumber = info.replace("player", "");
        return `Player ${playerNumber}`;
      } else if (info === "emulator") {
        return "Emulador";
      }
      return info;
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

    try {
      this.slot = this.readSavedSlots();
    } catch (error) {
      this.saveFailure(error, "ler");
    }

    this.launchGame();
  },
  beforeUnmount() {
    this.disposeGame();

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
button.link {
  background: transparent;
  border: 0;
  cursor: pointer;
}
button.link:focus-visible { outline: 2px solid #41f7fb; outline-offset: 3px; }
a.link,
button.link {
  font-family: "Press Start 2P", cursive;
  color: #fff;
  text-decoration: none;
  font-size: 14px;
  padding: 5px 0;
}
a.link:hover,
button.link:hover:not(:disabled) {
  animation: piscar 0.3s infinite alternate;
}
a.disabled,
button.link:disabled {
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
