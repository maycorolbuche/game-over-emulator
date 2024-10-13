<template>
  <div class="d-flex align-center">
    <div class="d-flex align-center">
      <template v-for="key in keys" :key="key">
        <div class="key">
          {{ key }}
        </div>
        <div v-if="key !== keys[keys.length - 1]">+</div>
      </template>
    </div>
    <div class="ref">{{ info_ref }}</div>
  </div>
</template>

<script>
export default {
  name: "LogoComponent",
  inheritAttrs: false,
  props: {
    info_key: [String, Array],
    info_ref: String,
  },
  computed: {
    keys() {
      if (typeof this.info_key === "string") {
        return [this.info_key];
      }
      return this.info_key;
    },
  },
};
</script>

<style scoped>
.key {
  border: 1px solid #fff;
  padding: 5px 10px;
  border-radius: 5px;
  margin: 1px;
  font-weight: bold;
  font-size: 10px;
}
.ref {
  padding-left: 8px;
  font-size: 10px;
}
</style>
