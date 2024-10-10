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
  mounted() {
    document.body.style.overflow = "hidden";
  },
  beforeUnmount() {
    document.body.style.overflow = "";
  },
};
</script>

<style scoped>
.modal-container {
  color: #000;
  background: #fff;
  z-index: 200;
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
@media (max-width: 600px) {
  .modal-container {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }
}

.modal-bg {
  background: #000;
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 100;
  opacity: 0.6;
}

html,
body {
  overflow: hidden;
}
</style>
