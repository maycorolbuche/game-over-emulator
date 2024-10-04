<template>
  <div class="bg-area">
    <div class="bouncing-ball" :style="{ top, bottom, left, right }" />
  </div>
</template>

<script>
export default {
  name: "BallsComponent",
  inheritAttrs: false,
  props: {
    top: String,
    bottom: String,
    left: String,
    right: String,
    start: { type: String, default: "0px" },
    end: { type: String, default: "-100px" },
    speed: { type: String, default: "2s" },
  },
};
</script>

<style scoped>
.bouncing-ball {
  width: 10px;
  height: 10px;
  background-color: #fff;
  border-radius: 50%;
  opacity: 0.3;
  position: absolute;
  animation: bounce v-bind("speed") infinite ease-in-out;
}
@media (max-width: 400px) {
  .bouncing-ball {
    width: 1vmax;
    height: 1vmax;
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(v-bind("start"));
  }
  50% {
    transform: translateY(v-bind("end"));
  }
}
</style>
