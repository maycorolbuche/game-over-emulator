<template>
  <div id="emulator" class="d-flex align-stretch" style="height: 100%">
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
        :style="{
          width: '100%',
          height: '100%',
          opacity: this.is_paused ? 0.2 : 1,
        }"
      />
    </div>
    <div
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
          @click="close()"
        >
          SALVAR
        </a>
        <a
          :class="{ link: true, disabled: loading || interact }"
          href="javascript:"
          @click="close()"
        >
          CARREGAR
        </a>
        <a
          :class="{ link: true, disabled: loading || interact }"
          href="javascript:"
          @click="close()"
        >
          TELA CHEIA</a
        >
        <a
          :class="{ link: true, disabled: loading || interact }"
          href="javascript:"
          @click="close()"
        >
          REINICIAR
        </a>
        <a :class="{ link: true }" href="javascript:" @click="close()">
          FECHAR
        </a>
      </div>
      <!--
      <div style="overflow: scroll">
        <a class="link" href="javascript:" @click="close()">FECHAR</a>
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
import Swal from "sweetalert2";

export default {
  name: "GameComponent",
  inheritAttrs: false,
  props: {
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
