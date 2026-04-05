export class InputHandler {
  constructor() {
    this.keys = Object.create(null);
    this.pressed = new Set();
    this.previous = Object.create(null);

    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      this.keys[key] = true;
      this.pressed.add(key);
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", (event) => {
      const key = event.key.toLowerCase();
      this.keys[key] = false;
      this.pressed.delete(key);
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        event.preventDefault();
      }
    });

    window.addEventListener("blur", () => {
      this.keys = Object.create(null);
      this.pressed.clear();
      this.previous = Object.create(null);
    });
  }

  isDown(...keys) {
    return keys.some((key) => this.keys[key]);
  }

  wasPressed(...keys) {
    return keys.some((key) => this.keys[key] && !this.previous[key]);
  }

  endFrame() {
    this.previous = { ...this.keys };
  }
}
