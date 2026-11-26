<template>
  <div class="d-flex align-center justify-center p-3" style="min-height: 80vh">
    <div
      class="d-flex flex-column align-center justify-center"
      style="z-index: 0"
    >
      <logo size="15vmin" />
      <h1 class="text-center h4 mt-3">Jogos clássicos online grátis</h1>
      <div class="text-center font-weight-bold p-3">
        Jogue clássicos de Nintendo, Super Nintendo, Mega Drive, Master System
        e Game Boy Advance direto no navegador, sem cadastro nem instalação.
      </div>
      <router-link to="/games">Explorar jogos por console</router-link>
    </div>

    <div style="z-index: -10">
      <joystick top="25%" right="15%" />
      <control top="50%" right="10%" />

      <tetris />
      <star />

      <balls bottom="10%" left="5%" speed="2s" />
      <balls bottom="10%" left="10%" speed="2.1s" />
      <balls bottom="10%" left="15%" speed="2.2s" />
      <balls bottom="10%" left="20%" speed="2.3s" />
      <balls bottom="10%" left="25%" speed="2.4s" />
      <balls bottom="10%" left="30%" speed="2.5s" />
      <balls bottom="10%" left="35%" speed="2.6s" />
      <balls bottom="10%" left="40%" speed="2.7s" />

      <balls top="30%" right="5%" speed="2.8s" />
      <balls top="30%" right="10%" speed="2.9s" />
      <balls top="30%" right="15%" speed="3.0s" />
      <balls top="30%" right="20%" speed="3.1s" />
      <balls top="30%" right="25%" speed="3.2s" />
      <balls top="30%" right="30%" speed="3.3s" />
      <balls top="30%" right="35%" speed="3.4s" />
      <balls top="30%" right="40%" speed="3.5s" />
    </div>
  </div>
</template>

<script>
import Logo from "@/components/Logo.vue";
import Balls from "@/components/bg/Balls.vue";
import Joystick from "@/components/bg/Joystick.vue";
import Control from "@/components/bg/Control.vue";
import Tetris from "@/components/bg/Tetris.vue";
import Star from "@/components/bg/Star.vue";

export default {
  name: "HomePage",
  components: {
    Logo,
    Balls,
    Joystick,
    Control,
    Tetris,
    Star,
  },
};
</script>
