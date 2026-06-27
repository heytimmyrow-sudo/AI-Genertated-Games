export class InputController {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouseDelta = { x: 0, y: 0 };
    this.pointerLocked = false;
    this.justPressed = new Set();
    this.mouseButtons = new Set();
    this.justMousePressed = new Set();
    this.justMouseReleased = new Set();
    this.gameplayBlocked = false;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handlePointerLockChange = this.handlePointerLockChange.bind(this);

    canvas.addEventListener("click", (event) => {
      if (!this.isGameplayPointerEvent(event)) {
        return;
      }
      canvas.requestPointerLock();
    });
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("mousedown", this.handleMouseDown, true);
    window.addEventListener("mouseup", this.handleMouseUp, true);
    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("pointerlockchange", this.handlePointerLockChange);
  }

  handleKeyDown(event) {
    if (["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ShiftLeft", "ShiftRight", "KeyC", "KeyE", "KeyQ", "KeyU", "KeyI", "KeyJ", "KeyK", "KeyM", "KeyN", "KeyO", "KeyP", "KeyR", "Escape", "F2", "F3", "Digit1", "Digit2", "Digit3", "Digit4", "BracketLeft", "BracketRight"].includes(event.code)) {
      event.preventDefault();
    }

    if (!this.keys.has(event.code)) {
      this.justPressed.add(event.code);
    }

    this.keys.add(event.code);
  }

  handleKeyUp(event) {
    this.keys.delete(event.code);
  }

  handleMouseDown(event) {
    if (!this.isGameplayPointerEvent(event)) {
      return;
    }

    event.preventDefault();
    if (event.button === 0 && !this.pointerLocked) {
      this.canvas.requestPointerLock();
    }

    if (!this.mouseButtons.has(event.button)) {
      this.justMousePressed.add(event.button);
    }

    this.mouseButtons.add(event.button);
  }

  handleMouseUp(event) {
    if (!this.isGameplayPointerEvent(event)) {
      return;
    }

    event.preventDefault();
    this.mouseButtons.delete(event.button);
    this.justMouseReleased.add(event.button);
  }

  handleMouseMove(event) {
    if (!this.pointerLocked) {
      return;
    }

    this.mouseDelta.x += event.movementX;
    this.mouseDelta.y += event.movementY;
  }

  handlePointerLockChange() {
    this.pointerLocked = document.pointerLockElement === this.canvas;
    if (!this.pointerLocked) {
      this.mouseButtons.clear();
    }
  }

  isGameplayPointerEvent(event) {
    const interactive = event.target.closest?.("[data-ui-interactive='true'], button, input, select, textarea, a");
    if (interactive) {
      return false;
    }

    if (this.gameplayBlocked) {
      return false;
    }

    if (this.pointerLocked) {
      return true;
    }

    return event.target === this.canvas || event.target.closest?.("#game-shell");
  }

  setGameplayBlocked(blocked) {
    this.gameplayBlocked = blocked;
    if (blocked) {
      this.mouseButtons.clear();
    }
  }

  isDown(code) {
    return this.keys.has(code);
  }

  wasPressed(code) {
    return this.justPressed.has(code);
  }

  isMouseDown(button) {
    return !this.gameplayBlocked && this.mouseButtons.has(button);
  }

  wasMousePressed(button) {
    return !this.gameplayBlocked && this.justMousePressed.has(button);
  }

  wasMouseReleased(button) {
    return !this.gameplayBlocked && this.justMouseReleased.has(button);
  }

  consumeMouseDelta() {
    const delta = { ...this.mouseDelta };
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return delta;
  }

  endFrame() {
    this.justPressed.clear();
    this.justMousePressed.clear();
    this.justMouseReleased.clear();
  }
}
