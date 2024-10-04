<template>
  <div class="bg-area">
    <img
      v-if="piece.src"
      :src="piece.src"
      class="piece"
      :style="{
        top: 0,
        left: piece.left + 'px',
        animationDuration: piece.duration + 's',
        transform: 'rotate(' + piece.rotation + 'deg)',
      }"
      @animationend="removePiece(index)"
    />
  </div>
</template>

<script>
export default {
  name: "TetrisComponent",
  inheritAttrs: false,
  data() {
    return {
      piece: {},
    };
  },
  computed: {
    pieces() {
      return [
        require("@/assets/bg/tetris-1.svg"),
        require("@/assets/bg/tetris-1.svg"),
        require("@/assets/bg/tetris-1.svg"),
        require("@/assets/bg/tetris-2.svg"),
        require("@/assets/bg/tetris-2.svg"),
        require("@/assets/bg/tetris-2.svg"),
        require("@/assets/bg/tetris-3.svg"),
        require("@/assets/bg/tetris-4.svg"),
        require("@/assets/bg/tetris-4.svg"),
      ];
    },
  },
  mounted() {
    this.createPiece();
  },
  methods: {
    createPiece() {
      const rotations = [0, 90, 180, 270];
      this.piece = {
        src: this.pieces[Math.floor(Math.random() * this.pieces.length)],
        left: Math.random() * (window.innerWidth - 50),
        duration: Math.random() * (12 - 6) + 6,
        rotation: rotations[Math.floor(Math.random() * rotations.length)],
      };
    },
    removePiece() {
      this.piece = {};
      let self = this;
      setTimeout(() => {
        self.createPiece();
      }, 5000);
    },
  },
};
</script>

<style scoped>
.piece {
  position: absolute;
  top: -50px;
  width: 50px;
  height: 50px;
  animation: fall linear 3s;
}
@media (max-width: 400px) {
  .piece {
    width: 5vmax;
    height: 5vmax;
  }
}

@keyframes fall {
  0% {
    top: -50px;
  }
  100% {
    top: 100vh;
  }
}
</style>
