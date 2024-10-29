<template>
  <div>
    <div
      class="d-flex flex-wrap align-center justify-center m-3"
      style="border-bottom: 1px solid rgb(255 255 255 / 7%)"
    >
      <img v-if="consol.image" :src="consol.image" />
    </div>

    <div class="d-flex flex-wrap align-stretch justify-center">
      <a
        v-for="rom in roms"
        :key="rom.id"
        class="rom-card d-flex flex-column align-center"
        href="javascript:"
        @click="openGame(rom)"
      >
        <img
          v-if="rom.image"
          :src="rom.image"
          style="height: 240px; object-fit: contain"
        />
        <div
          v-else
          style="
            width: 180px;
            height: 240px;
            background: #888;
            display: flex;
            align-items: center;
            justify-content: center;
          "
        >
          <span
            style="font-size: 100px; font-family: 'Press Start 2P', cursive"
          >
            !
          </span>
        </div>
        <span>{{ rom.name }}</span>
      </a>
    </div>

    <modal v-if="game" @close="closeGame()">
      <game
        v-bind="game"
        :console="consol.id"
        :console_image="consol.image"
        :controls="consol.controls"
        @close="closeGame()"
      />
    </modal>
  </div>
</template>

<script>
import Modal from "@/components/Modal.vue";
import Game from "@/components/Game.vue";

import consoles from "@/json/consoles.json";
import roms from "@/json/roms.json";

export default {
  name: "GamesPage",
  components: {
    Modal,
    Game,
  },
  props: {
    console_id: {
      type: String,
      required: true,
    },
    game_id: {
      type: String,
    },
  },

  data() {
    return {
      json_consoles: consoles,
      json_roms: roms,
      game: null,
    };
  },
  computed: {
    consol() {
      return this.json_consoles.filter(
        (console) => console.id === this.console_id
      )[0];
    },
    roms() {
      return this.json_roms
        .filter((rom) => rom.active && rom.console === this.console_id)
        .slice()
        .sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
    },
  },
  watch: {
    $route(to) {
      if (to.params.game_id) {
        this.openGame(
          this.json_roms.find(
            (rom) =>
              rom.id === to.params.game_id &&
              rom.console === to.params.console_id
          )
        );
      } else {
        this.closeGame();
      }
    },
  },
  methods: {
    openGame(game) {
      if (!game || game == undefined) {
        this.closeGame();
        return;
      }

      this.$router.push({
        name: "Game",
        params: {
          console_id: game.console,
          game_id: game.id,
        },
      });

      this.game = game;

      console.log(game);
    },
    closeGame() {
      this.$router.push({
        name: "Games",
        params: {
          console_id: this.console_id,
        },
      });

      this.game = null;
    },
  },
  mounted() {
    if (this.game_id) {
      this.openGame(
        this.json_roms.find(
          (rom) => rom.id === this.game_id && rom.console === this.console_id
        )
      );
    }
  },
};
</script>

<style scoped>
.rom-card {
  margin: 15px;
  text-decoration: none;
  width: 180px;
}
.rom-card img,
.rom-card div {
  box-shadow: 5px 5px #faa914, 10px 10px #ea004f;
  background: #000;
  width: 100%;
}
.rom-card:hover img,
.rom-card:hover div {
  box-shadow: 5px 5px #41f7fb, 10px 10px #f004fe;
}
.rom-card span {
  color: #fff;
  text-decoration: none;
  padding-top: 12px;
  text-align: center;
}
</style>
