<template>
  <div class="bg-area">
    <img
      v-if="star.show"
      src="@/assets/bg/star.svg"
      class="star"
      :style="{
        top: star.top + 'px',
        left: star.left + 'px',
        animationDuration: star.duration + 's',
        transform: 'rotate(' + star.rotation + 'deg)',
      }"
      @animationend="removeStar(index)"
    />
  </div>
</template>

<script>
export default {
  name: "StarComponent",
  inheritAttrs: false,
  data() {
    return {
      star: { show: false },
    };
  },
  mounted() {
    this.createStar();
  },
  methods: {
    createStar() {
      this.star = {
        show: true,
        top: Math.random() * (window.innerWidth - 50),
        left: Math.random() * (window.innerWidth - 50),
        duration: 1,
        rotation: Math.random() * 360,
      };
    },
    removeStar() {
      this.star = { show: false };
      let self = this;
      setTimeout(() => {
        self.createStar();
      }, 100);
    },
  },
};
</script>

<style scoped>
.star {
  position: absolute;
  width: 50px;
  height: 50px;
  animation: blink ease-in-out 3s;
}
@media (max-width: 400px) {
  .star {
    width: 5vmax;
    height: 5vmax;
  }
}

@keyframes blink {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.5);
    opacity: 0;
  }
}
</style>
