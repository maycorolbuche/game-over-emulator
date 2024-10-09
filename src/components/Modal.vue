<template>
  <div>
    <div class="modal-container">
      <slot />
    </div>
    <div class="modal-bg" @click="close()" />
  </div>
</template>

<script>
export default {
  name: "ModalComponent",
  inheritAttrs: false,
  methods: {
    close() {
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
.modal-container {
  color: #000;
  background: #fff;
  z-index: 200;
  position: absolute;
  width: 90vw;
  height: 90vh;
  top: 5vh;
  left: 5vw;
}
@media (max-width: 600px) {
  .modal-container {
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
  }
}

.modal-bg {
  background: #000;
  position: absolute;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  z-index: 100;
  opacity: 0.6;
}
</style>
