<template>
  <div
    id="emulator"
    ref="emulator"
    class="d-flex align-stretch"
    :class="{ 'mobile-layout': mobile_layout }"
    :style="{ '--game-ratio': console === 'gba' ? '3 / 2' : '4 / 3' }"
    @keydown.esc.stop="menu_open && toggleMenu()"
  >
    <button v-show="false" v-shortkey.push="['\'']" @shortkey="speed" />
    <button
      v-if="mobile_layout"
      class="game-menu-toggle"
      type="button"
      :aria-expanded="menu_open"
      aria-controls="game-options"
      aria-label="Menu do jogo"
      @click.stop="toggleMenu()"
    >
      ☰
    </button>
    <div class="game-stage" ref="gameStage">
      <div
        id="emulator-container"
        ref="emulatorContainer"
        style="overflow: hidden"
        @click="resumeFromCanvas()"
        @pointerdown="handleUserInteraction()"
      >
        <div
          v-if="(is_paused || message) && !interact && !loading"
          class="message"
        >
          {{ is_paused ? "EMULADOR PAUSADO" : "" }}
          {{ is_paused && message ? " | " : "" }}
          {{ message }}
        </div>

        <button
          v-if="interact"
          class="link loading start-game"
          type="button"
          @click.stop="handleUserInteraction()"
        >
          TOQUE OU CLIQUE PARA INICIAR
        </button>
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
      <touch-controls
        v-if="mobile_layout && show_touch"
        ref="touchControls"
        :buttons="touch_buttons"
        :disabled="
          !nostalgist || is_paused || menu_open || save_busy || !!launch_error
        "
        @input="touchInput"
      />
    </div>
    <button
      v-if="mobile_layout && menu_open"
      class="game-menu-backdrop"
      type="button"
      aria-label="Fechar menu"
      @click="toggleMenu()"
    />
    <div
      id="game-options"
      v-show="mobile_layout ? menu_open : !fullscreen"
      class="game-options flex-column align-stretch"
      style="width: 180px; color: #fff"
    >
      <button
        v-if="mobile_layout"
        class="link"
        type="button"
        @click="toggleMenu()"
      >
        VOLTAR AO JOGO
      </button>
      <button
        v-if="mobile_layout"
        class="link"
        type="button"
        @click="runMenuAction(() => show_touch = !show_touch)"
      >
        {{ show_touch ? "OCULTAR BOTÕES" : "MOSTRAR BOTÕES" }}
      </button>
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
            @click="runMenuAction(() => openControls())"
          >
            CONTROLES
          </a>
          <a
            v-if="!is_paused"
            :class="{
              link: true,
              disabled: loading || interact || !!launch_error,
            }"
            href="javascript:"
            v-shortkey.once="['ctrl', 'enter']"
            @click="runMenuAction(() => pause())"
            @shortkey="pause()"
          >
            PAUSAR
          </a>
          <a
            v-if="is_paused"
            :class="{
              link: true,
              disabled: loading || interact || !!launch_error,
            }"
            href="javascript:"
            v-shortkey.once="['ctrl', 'enter']"
            @click="runMenuAction(() => play())"
            @shortkey="play()"
          >
            CONTINUAR
          </a>
          <a
            :class="{
              link: true,
              disabled: loading || interact || !!launch_error,
            }"
            href="javascript:"
            v-shortkey.once="['shift', '+']"
            @click="runMenuAction(() => saveState(0))"
            @shortkey="saveState(0)"
          >
            SALVAR
          </a>
          <a
            :class="{
              link: true,
              disabled: loading || interact || !!launch_error,
            }"
            href="javascript:"
            v-shortkey.once="['=']"
            @click="runMenuAction(() => loadState(0))"
            @shortkey="loadState(0)"
          >
            CARREGAR
          </a>
          <a
            :class="{
              link: true,
              disabled: loading || interact || !!launch_error,
            }"
            href="javascript:"
            v-shortkey.once="['f11']"
            @click="runMenuAction(() => toggleFullscreen())"
            @shortkey="toggleFullscreen()"
          >
            TELA CHEIA
          </a>
          <a
            :class="{
              link: true,
              disabled: loading || interact || !!launch_error,
            }"
            href="javascript:"
            v-shortkey.once="['tab']"
            @click="runMenuAction(() => restartGame())"
            @shortkey="restartGame()"
          >
            REINICIAR
          </a>
          <button
            class="link"
            :disabled="!nostalgist || save_busy"
            @click="runMenuAction(() => exportSave())"
          >
            EXPORTAR
          </button>
          <button
            class="link"
            :disabled="!nostalgist || save_busy"
            @click="runMenuAction(() => $refs.importFile.click())"
          >
            IMPORTAR
          </button>
          <input
            ref="importFile"
            type="file"
            accept=".json,application/json"
            hidden
            @change="importSave($event)"
          />
          <a :class="{ link: true }" href="javascript:" @click="runMenuAction(() => close())">
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
            :class="{ link: true }"
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
import * as Controls from "@/helpers/Controls.mjs";
import TouchControls from "@/components/TouchControls.vue";
import { fitScreen } from "@/helpers/TouchInput.mjs";
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
    TouchControls,
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
      mobile_layout: false,
      show_touch: true,
      menu_open: false,
      resume_after_menu: false,
      resize_observer: null,
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
      playback_applied_paused: false,
      playback_timer: null,
      playback_waiters: [],
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
    touch_buttons() {
      return Object.keys(
        Controls.visibleControls(this.console, this.controls).player1 || {},
      );
    },
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
        ...Controls.visibleControls(this.console, this.controls),
      };
    },
    retroarch_controls() {
      return Controls.retroarchControls(this.console, this.controls);
    },
  },
  watch: {
    show_touch() {
      this.$nextTick?.(this.handleResize);
    },
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
    runMenuAction(action) {
      if (this.mobile_layout && this.menu_open) {
        const resume = this.resume_after_menu;
        this.menu_open = false;
        this.resume_after_menu = false;
        if (resume && !Swal.isVisible()) this.play();
      }
      return action();
    },
    async openControls() {
      if (!this.mobile_layout) {
        this.show_controls = true;
        return;
      }
      const wasPaused = this.is_paused;
      this.pause();
      const labels = { up: "Cima", down: "Baixo", left: "Esquerda", right: "Direita", button1: "1", button2: "2", mode: "Mode", turbo_a: "Turbo A", turbo_b: "Turbo B", pause: "Pausar", save: "Salvar", load: "Carregar", fullscreen: "Tela cheia", restart: "Reiniciar", accelerate: "Acelerar" };
      const text = Object.entries(this.game_controls).map(([player, controls]) =>
        this.info_player(player) + "\n" + Object.entries(controls).map(([button, keys]) =>
          (labels[button] || button.toUpperCase()) + ": " + (Array.isArray(keys) ? keys.join(" + ") : keys)
        ).join("\n")
      ).join("\n\n");
      await Swal.fire({ title: "Controles", text, confirmButtonText: "Voltar ao jogo", target: this.$refs.emulator, heightAuto: false, customClass: { htmlContainer: "game-controls-text" } });
      if (!wasPaused && !this.session_closed) this.play();
    },
    resumeFromCanvas() {
      if (!Swal.isVisible() && !this.menu_open) this.play();
    },
    touchInput(button, pressed) {
      const input = Controls.profiles[this.console]?.buttons[button];
      if (
        !input ||
        !this.nostalgist ||
        (pressed && (this.menu_open || this.is_paused || this.save_busy))
      )
        return;
      this.nostalgist[pressed ? "pressDown" : "pressUp"](input, 1);
    },
    releaseTouch() {
      this.$refs?.touchControls?.releaseAll();
    },
    toggleMenu() {
      if (!this.menu_open) {
        this.resume_after_menu = !!this.nostalgist && !this.is_paused;
        this.releaseTouch();
        this.pause();
        this.menu_open = true;
      } else {
        this.menu_open = false;
        if (this.resume_after_menu && !Swal.isVisible()) this.play();
      }
    },
    updateViewport() {
      const mobile = window.matchMedia(
        "(max-width: 900px), (pointer: coarse)",
      ).matches;
      if (!mobile && this.menu_open) this.toggleMenu();
      this.mobile_layout = mobile;
      this.releaseTouch();
      this.$nextTick?.(this.handleResize);
    },
    pageVisibility() {
      if (document.hidden) {
        this.releaseTouch();
        this.pause();
      }
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
        target: this.$refs.emulator,
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
      if (
        this.interact ||
        this.loading ||
        this.nostalgist ||
        this.session_closed
      )
        return;
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
        this.playback_applied_paused = false;
        this.$nextTick?.(this.handleResize);
      } catch (error) {
        if (!this.session_closed && attempt === this.launch_id) {
          this.nostalgist = null;
          this.launch_error =
            "Não foi possível iniciar o jogo. Verifique sua conexão e tente novamente.";
          console.error("Erro ao iniciar o jogo:", error);
        }
      } finally {
        if (!this.session_closed && attempt === this.launch_id)
          this.loading = false;
      }
    },
    disposeGame() {
      this.releaseTouch();
      if (this.session_closed) return;
      this.session_closed = true;
      clearTimeout(this.playback_timer);
      this.playback_timer = null;
      this.finishPlayback(false);
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
      this.releaseTouch();
      return this.requestPlayback(true);
    },
    play() {
      return this.requestPlayback(false);
    },
    finishPlayback(applied) {
      const waiters = this.playback_waiters.splice(0);
      for (const resolve of waiters) resolve(applied);
    },
    requestPlayback(paused) {
      if (!this.nostalgist || this.session_closed) return Promise.resolve(false);
      const instance = this.nostalgist;
      this.is_paused = paused;
      clearTimeout(this.playback_timer);
      const settled = new Promise(resolve => this.playback_waiters.push(resolve));
      // Coalesce opposite requests before sending RetroArch's PAUSE_TOGGLE.
      this.playback_timer = setTimeout(() => {
        this.playback_timer = null;
        if (this.session_closed || this.nostalgist !== instance) {
          this.finishPlayback(false);
          return;
        }
        try {
          if (this.playback_applied_paused !== this.is_paused) {
            instance[this.is_paused ? "pause" : "resume"]();
            this.playback_applied_paused = this.is_paused;
          }
          this.finishPlayback(true);
        } catch (error) {
          this.is_paused = this.playback_applied_paused;
          this.finishPlayback(false);
          console.error("Erro ao alterar pausa do jogo:", error);
        }
      }, 10);
      return settled;
    },
    restart() {
      if (this.nostalgist) {
        // Nostalgist.restart() also resumes immediately, bypassing the queue.
        this.nostalgist.sendCommand("RESET");
        return this.play();
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
      try {
        const ready = await this.play();
        if (!ready || this.is_paused || this.session_closed || this.nostalgist !== instance)
          throw new Error("A sessão não está disponível para carregar o estado.");
        await EmulatorState.restoreState(instance, state, {
          active: () => !this.session_closed && this.nostalgist === instance,
        });
      } finally {
        if (wasPaused && !this.session_closed && this.nostalgist === instance)
          await this.pause();
      }
    },
    async captureCurrentState(instance) {
      const wasPaused = this.is_paused;
      try {
        const ready = await this.play();
        if (!ready || this.is_paused || this.session_closed || this.nostalgist !== instance)
          throw new Error("A sessão não está disponível para capturar o estado.");
        return await EmulatorState.captureState(instance, {
          active: () => !this.session_closed && this.nostalgist === instance,
        });
      } finally {
        if (wasPaused && !this.session_closed && this.nostalgist === instance)
          await this.pause();
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
        const identity = await SaveTransfer.gameIdentity(
          instance,
          this.console,
          this.id,
        );
        const json = await SaveTransfer.exportState(state, identity);
        if (this.session_closed || this.nostalgist !== instance) return;
        const url = URL.createObjectURL(
          new Blob([json], { type: "application/json" }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.download =
          ("game-over-" + this.console + "-" + this.id).replace(
            /[^a-zA-Z0-9_-]/g,
            "_",
          ) + ".save.json";
        document.body.append(link);
        try {
          link.click();
        } finally {
          link.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        this.message = "Estado atual exportado";
      } catch (error) {
        if (!this.session_closed)
          this.save_error = "Não foi possível exportar: " + error.message;
      } finally {
        this.save_busy = false;
        if (!paused && !this.session_closed && this.nostalgist === instance)
          this.play();
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
        const identity = await SaveTransfer.gameIdentity(
          instance,
          this.console,
          this.id,
        );
        const state = await SaveTransfer.importState(file, identity);
        if (this.session_closed || this.nostalgist !== instance) return;
        await this.restoreCurrentState(instance, state);
        if (this.session_closed || this.nostalgist !== instance) return;
        this.play();
        this.message = "Save importado e carregado";
      } catch (error) {
        if (!this.session_closed)
          this.save_error = "Não foi possível importar: " + error.message;
      } finally {
        this.save_busy = false;
      }
    },
    readSavedSlots() {
      const slots = Storage.get(this.console + "." + this.id, {});
      if (
        !slots ||
        typeof slots !== "object" ||
        Array.isArray(slots) ||
        Object.entries(slots).some(
          ([key, value]) =>
            !/^[0-9]$/.test(key) ||
            (value !== null &&
              (typeof value !== "string" ||
                !/^data:[^,]*;base64,[A-Za-z0-9+/]+={0,2}$/.test(value))),
        )
      ) {
        throw new Error("INVALID_SAVE");
      }
      return slots;
    },
    saveFailure(error, action) {
      if (this.session_closed) return;
      this.message = null;
      if (
        error?.name === "QuotaExceededError" ||
        error?.name === "NS_ERROR_DOM_QUOTA_REACHED"
      ) {
        this.save_error =
          "Não foi possível salvar: o armazenamento do navegador está cheio. O salvamento anterior foi mantido.";
      } else if (
        error instanceof SyntaxError ||
        error?.message === "INVALID_SAVE" ||
        error?.name === "InvalidCharacterError"
      ) {
        this.save_error =
          "O salvamento deste jogo contém dados inválidos. Os dados foram preservados; não foi possível " +
          action +
          ".";
      } else {
        this.save_error =
          "Não foi possível " +
          action +
          " o progresso. Verifique se o navegador permite armazenar dados deste site e tente novamente.";
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
        Screen.fullscreen(this.$refs.emulator);
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
      if (
        this.session_closed ||
        !this.$refs.emulatorContainer ||
        !this.$refs.gameStage
      )
        return;
      this.releaseTouch();
      const area = this.$refs.emulatorContainer.getBoundingClientRect();
      const size = fitScreen(
        area.width,
        area.height,
        this.console === "gba" ? 3 / 2 : 4 / 3,
      );
      const canvas = this.$refs.emulatorCanvas;
      if (canvas && size.width > 0 && size.height > 0) {
        canvas.style.setProperty("width", size.width + "px", "important");
        canvas.style.setProperty("height", size.height + "px", "important");
        if (this.nostalgist) this.nostalgist.resize(size);
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
    window.addEventListener("resize", this.updateViewport);
    document.addEventListener("visibilitychange", this.pageVisibility);
    this.updateViewport();
    if (typeof ResizeObserver !== "undefined") {
      this.resize_observer = markRaw(new ResizeObserver(this.handleResize));
      this.resize_observer.observe(this.$refs.emulatorContainer);
    }

    document.addEventListener("fullscreenchange", this.onFullscreenChange);
    document.addEventListener(
      "webkitfullscreenchange",
      this.onFullscreenChange,
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
    window.removeEventListener("resize", this.updateViewport);
    document.removeEventListener("visibilitychange", this.pageVisibility);
    this.resize_observer?.disconnect();

    document.removeEventListener("fullscreenchange", this.onFullscreenChange);
    document.removeEventListener(
      "webkitfullscreenchange",
      this.onFullscreenChange,
    );
    document.removeEventListener(
      "mozfullscreenchange",
      this.onFullscreenChange,
    );
    document.removeEventListener("msfullscreenchange", this.onFullscreenChange);
  },
};
</script>

<style scoped>
#emulator :deep(.game-controls-text) { white-space: pre-line; text-align: left; }
#emulator {
  background: #000;
  position: relative;
  height: 100%;
  height: 100dvh !important;
  overflow: hidden;
}
.game-stage {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
#emulator-container {
  min-height: 0;
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
#emulator-canvas {
  flex: none;
  max-width: 100%;
  max-height: 100%;
}
.game-options {
  display: flex;
  flex: none;
  overflow-y: auto;
  background: #000;
}
.start-game {
  background: #000;
  border: 0;
  cursor: pointer;
}
.game-menu-toggle {
  position: absolute;
  top: max(8px, env(safe-area-inset-top));
  right: max(8px, env(safe-area-inset-right));
  z-index: 420;
  width: 48px;
  height: 44px;
  border: 2px solid #faa914;
  background: #000b;
  color: #fff;
  font-size: 26px;
}
.game-menu-backdrop {
  position: absolute;
  inset: 0;
  background: #0009;
  border: 0;
  z-index: 400;
}
.mobile-layout .game-options {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(280px, 85vw) !important;
  z-index: 410;
  padding: 64px 12px max(16px, env(safe-area-inset-bottom));
  box-sizing: border-box;
  border-left: 2px solid #faa914;
}
.mobile-layout .game-options img {
  display: none;
}
.mobile-layout .game-options .link {
  padding: 12px 4px;
  font-size: 12px;
}
.mobile-layout .game-stage {
  width: 100%;
}
.mobile-layout .game-stage > :deep(.touch-pad) {
  flex: 1 1 auto;
  min-height: 200px;
}
@media (orientation: portrait) {
  .mobile-layout #emulator-container {
    flex: 0 1 auto;
    width: 100%;
    aspect-ratio: var(--game-ratio);
    max-height: calc(100% - 200px);
  }
}
@media (orientation: landscape) {
  .mobile-layout .game-stage > :deep(.touch-pad) {
    position: absolute;
    inset: 0;
    z-index: 310;
    min-height: 0;
  }
}
.message {
  pointer-events: none;
  font-size: 11px;
  max-width: 90%;
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
button.link:focus-visible {
  outline: 2px solid #41f7fb;
  outline-offset: 3px;
}
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
