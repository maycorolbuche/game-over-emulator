<template>
  <div>
    <h1>Jogue Flappy Bird (NES)</h1>
    <canvas id="emulator-canvas" style="width: 256px; height: 240px"></canvas>
    <button id="launch-button" @click="launchGame">Iniciar Jogo</button>
  </div>
</template>

<script>
import { Nostalgist } from "nostalgist";

export default {
  name: "HomePage",
  methods: {
    async launchGame() {
      await Nostalgist.launch({
        element: "#emulator-canvas",
        rom: "http://localhost:8080/roms/snes/Super%20Mario%20World%20(U)%20[!].smc",
        core: "snes9x",
        //core: "fceumm",
      });
      /*
      https://www.igdb.com/
      */
      /*try {8
        // Iniciar o emulador Nostalgist com a ROM do Flappy Bird (NES)
        await Nostalgist.nes("flappybird.nes", {
          canvas: document.getElementById("emulatorCanvas"),
        });
      } catch (error) {
        console.error("Erro ao iniciar o jogo: ", error);
      }*/
    },
  },
};
</script>
