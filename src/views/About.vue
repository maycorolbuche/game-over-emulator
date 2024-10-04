<template>
  <div class="d-flex align-center justify-center p-3" style="min-height: 80vh">
    <div
      class="d-flex flex-column align-center justify-center"
      style="z-index: 0"
    >
      <div class="text-center font-weight-bold p-3">
        A ideia do site fornecer jogos antigos, de diversos consoles, totalmente
        online e gratuito. Queremos preservar a história dos jogos e
        possibilitar que as pessoas sejam felizes, jogando os clássicos de
        sempre.
      </div>
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
import Balls from "@/components/bg/Balls.vue";
import Joystick from "@/components/bg/Joystick.vue";
import Control from "@/components/bg/Control.vue";
import Tetris from "@/components/bg/Tetris.vue";
import Star from "@/components/bg/Star.vue";

export default {
  name: "AboutPage",
  components: {
    Balls,
    Joystick,
    Control,
    Tetris,
    Star,
  },
};
</script>
