<template>
  <div class="bg-area">
    <img
      id="joystick"
      src="@/assets/bg/joystick.svg"
      :style="{ top, bottom, left, right }"
    />
  </div>
</template>

<script>
export default {
  name: "JoystickComponent",
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
#joystick {
  position: absolute;
  animation: move 4s infinite linear;
  width: 10vw;
  min-width: 50px;
}

@keyframes move {
  0% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(90deg);
  }
  100% {
    transform: rotate(0deg);
  }
}
</style>
