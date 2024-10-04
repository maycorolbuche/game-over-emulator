<template>
  <div class="bg-area">
    <img
      id="control"
      src="@/assets/bg/control.svg"
      :style="{ top, bottom, left, right }"
    />
  </div>
</template>

<script>
export default {
  name: "ControlComponent",
  inheritAttrs: false,
  props: {
    top: String,
    bottom: String,
    left: String,
    right: String,
  },
};
</script>

<style scoped>
#control {
  position: absolute;
  animation: move 3s infinite linear;
  width: 15vw;
  min-width: 50px;
}

@keyframes move {
  0% {
    transform: rotate(-20deg);
  }
  50% {
    transform: rotate(40deg);
  }
  100% {
    transform: rotate(-20deg);
  }
}
</style>
