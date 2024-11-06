<template>
  <div>
    <div
      class="d-flex flex-wrap align-stretch justify-around m-3"
      style="border-bottom: 1px solid rgb(255 255 255 / 7%)"
    >
      <img v-if="consol.image" :src="consol.image" />
      <div class="d-flex flex-column flex-auto">
        <div
          class="title-console d-flex align-center justify-center flex-auto text-center"
        >
          {{ consol.name }}
        </div>
        <div class="d-flex justify-end align-center">
          <div class="d-flex align-center search-container">
            <div>
              <svg
                width="20px"
                height="20px"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 6H19M21 12H16M21 18H16M7 20V13.5612C7 13.3532 7 13.2492 6.97958 13.1497C6.96147 13.0615 6.93151 12.9761 6.89052 12.8958C6.84431 12.8054 6.77934 12.7242 6.64939 12.5617L3.35061 8.43826C3.22066 8.27583 3.15569 8.19461 3.10948 8.10417C3.06849 8.02393 3.03853 7.93852 3.02042 7.85026C3 7.75078 3 7.64677 3 7.43875V5.6C3 5.03995 3 4.75992 3.10899 4.54601C3.20487 4.35785 3.35785 4.20487 3.54601 4.10899C3.75992 4 4.03995 4 4.6 4H13.4C13.9601 4 14.2401 4 14.454 4.10899C14.6422 4.20487 14.7951 4.35785 14.891 4.54601C15 4.75992 15 5.03995 15 5.6V7.43875C15 7.64677 15 7.75078 14.9796 7.85026C14.9615 7.93852 14.9315 8.02393 14.8905 8.10417C14.8443 8.19461 14.7793 8.27583 14.6494 8.43826L11.3506 12.5617C11.2207 12.7242 11.1557 12.8054 11.1095 12.8958C11.0685 12.9761 11.0385 13.0615 11.0204 13.1497C11 13.2492 11 13.3532 11 13.5612V17L7 20Z"
                  stroke="#FFFFFF"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div>
              <input
                v-model="search"
                type="text"
                placeholder="Buscar nesta seção..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="d-flex flex-wrap align-stretch justify-center">
      <div v-if="search && roms.length <= 0">
        Nenhum resultado para: {{ search }}
      </div>
      <a
        v-for="(rom, key) in roms"
        :key="key"
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
        :core="consol.core"
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
      search: "",
    };
  },
  computed: {
    consol() {
      return this.json_consoles.filter(
        (console) => console.id === this.console_id
      )[0];
    },
    roms() {
      const search = this.search
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      return this.json_roms
        .filter((rom) => rom.active && rom.console === this.console_id)
        .filter((item) =>
          item.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .includes(search)
        )
        .slice()
        .sort((a, b) =>
          a.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .localeCompare(
              b.name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
            )
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
.title-console {
  font-family: "Press Start 2P", cursive;
  font-size: 37px;
}

.search-container {
  border-bottom: 1px solid #fff;
  width: 30%;
}
.search-container input {
  background: transparent;
  border: 0;
  outline: none;
  color: #fff;
  padding: 0 10px 0 10px;
}

@media (max-width: 800px) {
  .search-container {
    width: 40%;
  }
}
@media (max-width: 600px) {
  .search-container {
    width: 50%;
  }
}
@media (max-width: 400px) {
  .search-container {
    width: 100%;
  }
}
</style>
