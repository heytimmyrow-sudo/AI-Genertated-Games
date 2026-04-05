(function () {
window.Relicbound = window.Relicbound || {};

class InputManager {
  constructor() {
    this.keys = Object.create(null);
    this.previous = Object.create(null);
    this.gamepadKeys = Object.create(null);
    this.gamepadAxes = { moveX: 0, moveY: 0 };

    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      this.keys[key] = true;
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " ", "j", "p", "escape", "r", "e", "m", "1", "2", "3", "4"].includes(key)) {
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", (event) => {
      this.keys[event.key.toLowerCase()] = false;
    });

    window.addEventListener("blur", () => {
      this.keys = Object.create(null);
      this.previous = Object.create(null);
    });
  }

  pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = Array.from(pads).find(Boolean);
    this.gamepadKeys = Object.create(null);
    this.gamepadAxes = { moveX: 0, moveY: 0 };
    if (!pad) return;

    const deadzone = (window.Relicbound.GAME_CONFIG?.input?.stickDeadzone) || 0.24;
    const axisX = Math.abs(pad.axes[0] || 0) > deadzone ? pad.axes[0] : 0;
    const axisY = Math.abs(pad.axes[1] || 0) > deadzone ? pad.axes[1] : 0;
    this.gamepadAxes.moveX = axisX;
    this.gamepadAxes.moveY = axisY;

    const pressed = (index) => Boolean(pad.buttons[index] && pad.buttons[index].pressed);
    if (pressed(12)) this.gamepadKeys.arrowup = true;
    if (pressed(13)) this.gamepadKeys.arrowdown = true;
    if (pressed(14)) this.gamepadKeys.arrowleft = true;
    if (pressed(15)) this.gamepadKeys.arrowright = true;
    if (pressed(0)) this.gamepadKeys.pad_attack = true;
    if (pressed(9)) this.gamepadKeys.pad_pause = true;
    if (pressed(8)) this.gamepadKeys.pad_restart = true;
    if (pressed(2)) this.gamepadKeys.pad_interact = true;
    if (pressed(3)) this.gamepadKeys.pad_map = true;
    if (pressed(12)) this.gamepadKeys["1"] = true;
    if (pressed(15)) this.gamepadKeys["2"] = true;
    if (pressed(13)) this.gamepadKeys["3"] = true;
    if (pressed(14)) this.gamepadKeys["4"] = true;
  }

  isDown(...keys) {
    return keys.some((key) => this.keys[key] || this.gamepadKeys[key]);
  }

  wasPressed(...keys) {
    return keys.some((key) => (this.keys[key] || this.gamepadKeys[key]) && !this.previous[key]);
  }

  getMoveVector() {
    const keyboardX = (this.isDown("d", "arrowright") ? 1 : 0) - (this.isDown("a", "arrowleft") ? 1 : 0);
    const keyboardY = (this.isDown("s", "arrowdown") ? 1 : 0) - (this.isDown("w", "arrowup") ? 1 : 0);
    const moveX = keyboardX !== 0 ? keyboardX : this.gamepadAxes.moveX;
    const moveY = keyboardY !== 0 ? keyboardY : this.gamepadAxes.moveY;
    return { x: moveX, y: moveY };
  }

  endFrame() {
    this.previous = { ...this.keys, ...this.gamepadKeys };
  }
}

window.Relicbound.InputManager = InputManager;
}());
