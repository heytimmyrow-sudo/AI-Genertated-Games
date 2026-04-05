(function () {
  const ShadowCircuit = window.ShadowCircuit || (window.ShadowCircuit = {});

  class InputHandler {
    constructor() {
      this.keys = Object.create(null);
      this.previous = Object.create(null);

      window.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();
        this.keys[key] = true;
        if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "shift", "p", "escape"].includes(key)) {
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

    isDown(...keys) {
      return keys.some((key) => this.keys[key]);
    }

    pressed(...keys) {
      return keys.some((key) => this.keys[key] && !this.previous[key]);
    }

    getMoveVector() {
      const left = this.isDown("a", "arrowleft");
      const right = this.isDown("d", "arrowright");
      const up = this.isDown("w", "arrowup");
      const down = this.isDown("s", "arrowdown");
      return {
        x: (right ? 1 : 0) - (left ? 1 : 0),
        y: (down ? 1 : 0) - (up ? 1 : 0)
      };
    }

    endFrame() {
      this.previous = { ...this.keys };
    }
  }

  ShadowCircuit.InputHandler = InputHandler;
}());
