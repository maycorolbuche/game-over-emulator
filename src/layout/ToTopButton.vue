<template>
  <div>
    <button v-if="showScrollButton" @click="scrollToTop" class="scroll-to-top">
      <div style="padding-bottom: 2px">
        <svg
          fill="#FFFFFF"
          height="16px"
          width="16px"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 330 330"
          xml:space="preserve"
        >
          <path
            d="M325.606,229.393l-150.004-150C172.79,76.58,168.974,75,164.996,75c-3.979,0-7.794,1.581-10.607,4.394
	l-149.996,150c-5.858,5.858-5.858,15.355,0,21.213c5.857,5.857,15.355,5.858,21.213,0l139.39-139.393l139.397,139.393
	C307.322,253.536,311.161,255,315,255c3.839,0,7.678-1.464,10.607-4.394C331.464,244.748,331.464,235.251,325.606,229.393z"
          />
        </svg>
      </div>
    </button>
  </div>
</template>

<script>
export default {
  name: "ToTopButton",
  inheritAttrs: false,
  data() {
    return {
      showScrollButton: false,
    };
  },
  mounted() {
    window.addEventListener("scroll", this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    handleScroll() {
      this.showScrollButton = window.scrollY > 200; // Mostra o botão se o scrollY for maior que 200px
    },
    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: "smooth", // Rola a página suavemente até o topo
      });
    },
  },
};
</script>

<style scoped>
.scroll-to-top {
  position: fixed;
  width: 40px;
  height: 40px;
  display: flex;
  bottom: 20px;
  right: 20px;
  background-color: #0e0049;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: opacity 0.3s;
  align-items: center;
  justify-content: center;
}

.scroll-to-top:hover {
  border: 2px solid #fff;
}
</style>
