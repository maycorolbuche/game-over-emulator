<template>
  <div class="touch-pad" :class="{ disabled }" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up" @lostpointercapture="up" @contextmenu.prevent>
    <div class="dpad" aria-label="Direcional">
      <template v-for="(cell, index) in directions" :key="index">
        <button v-if="cell.buttons" type="button" :disabled="disabled" :data-buttons="cell.buttons" data-direction="true" :aria-label="cell.label">{{ cell.label }}</button>
        <button v-else type="button" class="joystick" data-stick="true" :disabled="disabled" aria-label="Direcional arrastável">
          <span class="joystick-thumb" :style="{ transform: 'translate(' + stick_x + 'px, ' + stick_y + 'px)' }" />
        </button>
      </template>
    </div>
    <div class="system-buttons">
      <button type="button" :disabled="disabled" data-buttons="rewind" aria-label="Rebobinar (segurar)" title="Segure para rebobinar">⏪</button>
      <button v-for="button in system" :key="button" type="button" :disabled="disabled" :data-buttons="button">{{ label(button) }}</button>
    </div>
    <div class="action-buttons" :class="{ 'six-buttons': actions.length > 4 }">
      <button v-for="button in actions" :key="button" type="button" :disabled="disabled" :data-buttons="button">{{ label(button) }}</button>
    </div>
  </div>
</template>
<script>
import { markRaw } from 'vue';
import { createTouchInput, joystickState } from '@/helpers/TouchInput.mjs';
export default {
  props: { buttons: { type: Array, default: () => [] }, disabled: Boolean },
  emits: ['input'],
  data() { return { input: null, stick_id: null, stick_origin: null, stick_x: 0, stick_y: 0, sliding: new Set(), directions: [
    { label: '↖', buttons: 'up,left' }, { label: '↑', buttons: 'up' }, { label: '↗', buttons: 'up,right' },
    { label: '←', buttons: 'left' }, { label: '', buttons: null }, { label: '→', buttons: 'right' },
    { label: '↙', buttons: 'down,left' }, { label: '↓', buttons: 'down' }, { label: '↘', buttons: 'down,right' },
  ] }; },
  computed: {
    system() { return this.buttons.filter(x => ['start', 'select', 'mode', 'pause'].includes(x)); },
    actions() { return this.buttons.filter(x => !['up', 'down', 'left', 'right', 'start', 'select', 'mode', 'pause', 'turbo_a', 'turbo_b'].includes(x)); },
  },
  watch: { disabled(value) { if (value) this.releaseAll(); }, buttons() { this.releaseAll(); } },
  methods: {
    label(button) { return ({ button1: '1', button2: '2', start: 'Start', select: 'Select', mode: 'Mode', pause: 'Pause' })[button] || button.toUpperCase(); },
    down(event) {
      const stick = event.target.closest("[data-stick]");
      if (stick && this.$el.contains(stick)) {
        if (this.disabled || this.stick_id !== null) return;
        event.preventDefault();
        this.$el.setPointerCapture(event.pointerId);
        const rect = stick.getBoundingClientRect();
        this.stick_origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        this.stick_id = event.pointerId;
        this.updateStick(event);
        return;
      }
      const button = event.target.closest('[data-buttons]');
      if (this.disabled || !button || !this.$el.contains(button)) return;
      event.preventDefault();
      this.$el.setPointerCapture(event.pointerId);
      if (button.dataset.direction) this.sliding.add(event.pointerId);
      this.input.update(event.pointerId, button.dataset.buttons.split(','));
    },
    updateStick(event) {
      if (this.disabled || this.stick_id !== event.pointerId) return;
      const state = joystickState(event.clientX - this.stick_origin.x, event.clientY - this.stick_origin.y);
      this.stick_x = state.x;
      this.stick_y = state.y;
      this.input.update(event.pointerId, state.buttons);
    },
    move(event) {
      if (this.stick_id === event.pointerId) { this.updateStick(event); return; }
      if (!this.sliding.has(event.pointerId) || this.disabled) return;
      const button = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-direction]');
      this.input.update(event.pointerId, button && this.$el.contains(button) ? (button.dataset.buttons || '').split(',').filter(Boolean) : []);
    },
    up(event) {
      this.input?.release(event.pointerId);
      this.sliding.delete(event.pointerId);
      if (this.stick_id === event.pointerId) this.resetStick();
    },
    resetStick() { this.stick_id = null; this.stick_origin = null; this.stick_x = 0; this.stick_y = 0; },
    releaseAll() { this.input?.releaseAll(); this.sliding.clear(); this.resetStick(); },
    visibility() { if (document.hidden) this.releaseAll(); },
  },
  mounted() {
    this.input = markRaw(createTouchInput((button, pressed) => this.$emit('input', button, pressed)));
    window.addEventListener('blur', this.releaseAll);
    window.addEventListener('resize', this.releaseAll);
    document.addEventListener('visibilitychange', this.visibility);
  },
  beforeUnmount() {
    this.releaseAll();
    window.removeEventListener('blur', this.releaseAll);
    window.removeEventListener('resize', this.releaseAll);
    document.removeEventListener('visibilitychange', this.visibility);
  },
};
</script>
<style scoped>
.touch-pad { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 16px max(14px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left)); box-sizing: border-box; touch-action: none; user-select: none; -webkit-user-select: none; }
.touch-pad button { pointer-events: auto; touch-action: none; -webkit-touch-callout: none; border: 2px solid #ffffff90; color: #fff; background: #252545b0; border-radius: 50%; min-width: 44px; min-height: 44px; font-weight: bold; font-size: 15px; }
.touch-pad button:active { background: #faa914b0; color: #000; }
.touch-pad.disabled { opacity: .4; }
.dpad { display: grid; grid-template-columns: repeat(3, 44px); grid-template-rows: repeat(3, 44px); gap: 2px; }
.dpad button { border-radius: 10px; }
.dpad .joystick { position: relative; z-index: 1; border-radius: 50%; overflow: visible; background: #15152bb0; }
.joystick-thumb { display: block; position: absolute; inset: 5px; border: 2px solid #ffffffb0; border-radius: 50%; background: #747495dd; pointer-events: none; box-shadow: 0 2px 5px #0009; will-change: transform; }
.dpad .joystick:active .joystick-thumb { background: #faa914dd; }
.system-buttons { display: flex; flex-direction: column; gap: 8px; }
.system-buttons button { border-radius: 12px; font-size: 10px; min-width: 48px; }
.action-buttons { display: grid; grid-template-columns: repeat(2, 48px); gap: 8px; }
.action-buttons.six-buttons { grid-template-columns: repeat(3, 44px); gap: 4px; }
@media (orientation: landscape) { .touch-pad { pointer-events: none; align-items: flex-end; } .dpad, .action-buttons, .system-buttons { pointer-events: auto; } .system-buttons { flex-direction: row; align-self: flex-end; } }
@media (max-width: 359px) { .touch-pad { padding-left: 4px; padding-right: 4px; gap: 4px; } .dpad { grid-template-columns: repeat(3, 40px); grid-template-rows: repeat(3, 40px); } .dpad button { min-width: 40px; min-height: 40px; } .action-buttons.six-buttons { grid-template-columns: repeat(3, 40px); } .action-buttons.six-buttons button { min-width: 40px; } }
</style>
