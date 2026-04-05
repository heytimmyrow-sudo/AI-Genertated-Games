(function () {
  const SkyArcher = window.SkyArcher || (window.SkyArcher = {});

  class Input {
    constructor(canvas) {
      this.canvas = canvas;
      this.mouseX = canvas.width * 0.75;
      this.mouseY = canvas.height * 0.3;
      this.mouseDown = false;
      this.keys = Object.create(null);
      this.previous = Object.create(null);

      canvas.addEventListener("mousemove", (event) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        this.mouseX = (event.clientX - rect.left) * scaleX;
        this.mouseY = (event.clientY - rect.top) * scaleY;
      });

      canvas.addEventListener("mousedown", () => {
        this.mouseDown = true;
      });

      window.addEventListener("mouseup", () => {
        this.mouseDown = false;
      });

      window.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();
        this.keys[key] = true;
        if (["p", "escape", " "].includes(key)) {
          event.preventDefault();
        }
      });

      window.addEventListener("keyup", (event) => {
        this.keys[event.key.toLowerCase()] = false;
      });

      window.addEventListener("blur", () => {
        this.mouseDown = false;
        this.keys = Object.create(null);
        this.previous = Object.create(null);
      });
    }

    pressed(key) {
      return this.keys[key] && !this.previous[key];
    }

    endFrame() {
      this.previous = { ...this.keys };
    }
  }

  SkyArcher.Input = Input;
}());
