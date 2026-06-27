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
    this.virtualPointerActive = false;
    this.touchLookPointerId = null;
    this.touchLookLast = { x: 0, y: 0 };
    this.virtualMoveCodes = new Set();
    this.touchJoysticks = new Map();

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleTouchLookStart = this.handleTouchLookStart.bind(this);
    this.handleTouchLookMove = this.handleTouchLookMove.bind(this);
    this.handleTouchLookEnd = this.handleTouchLookEnd.bind(this);
    this.handlePointerLockChange = this.handlePointerLockChange.bind(this);

    canvas.addEventListener("click", (event) => {
      if (!this.isGameplayPointerEvent(event)) {
        return;
      }
      this.requestPointerLock();
    });
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("mousedown", this.handleMouseDown, true);
    window.addEventListener("mouseup", this.handleMouseUp, true);
    document.addEventListener("mousemove", this.handleMouseMove);
    canvas.addEventListener("pointerdown", this.handleTouchLookStart);
    canvas.addEventListener("pointermove", this.handleTouchLookMove);
    canvas.addEventListener("pointerup", this.handleTouchLookEnd);
    canvas.addEventListener("pointercancel", this.handleTouchLookEnd);
    document.addEventListener("pointerlockchange", this.handlePointerLockChange);
    this.bindTouchControls();
  }

  bindTouchControls() {
    document.querySelectorAll("[data-touch-key]").forEach((button) => {
      const code = button.dataset.touchKey;
      const press = (event) => {
        event.preventDefault();
        this.pressVirtualKey(code);
      };
      const release = (event) => {
        event.preventDefault();
        this.releaseVirtualKey(code);
      };
      button.addEventListener("pointerdown", press);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
    });

    document.querySelectorAll("[data-touch-tap]").forEach((button) => {
      const code = button.dataset.touchTap;
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this.tapVirtualKey(code);
      });
    });

    document.querySelectorAll("[data-touch-mouse]").forEach((button) => {
      const mouseButton = Number(button.dataset.touchMouse ?? 0);
      const press = (event) => {
        event.preventDefault();
        this.pressVirtualMouse(mouseButton);
      };
      const release = (event) => {
        event.preventDefault();
        this.releaseVirtualMouse(mouseButton);
      };
      button.addEventListener("pointerdown", press);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
    });

    document.querySelectorAll("[data-touch-joystick]").forEach((joystick) => {
      const type = joystick.dataset.touchJoystick;
      const state = {
        type,
        pointerId: null,
        origin: { x: 0, y: 0 },
        knob: joystick.querySelector(".touch-joystick-knob"),
      };
      this.touchJoysticks.set(joystick, state);
      joystick.addEventListener("pointerdown", (event) => this.handleJoystickStart(event, joystick, state));
      joystick.addEventListener("pointermove", (event) => this.handleJoystickMove(event, joystick, state));
      joystick.addEventListener("pointerup", (event) => this.handleJoystickEnd(event, joystick, state));
      joystick.addEventListener("pointercancel", (event) => this.handleJoystickEnd(event, joystick, state));
    });
  }

  handleJoystickStart(event, joystick, state) {
    if (event.pointerType === "mouse" || this.gameplayBlocked || state.pointerId !== null) {
      return;
    }
    event.preventDefault();
    state.pointerId = event.pointerId;
    state.origin.x = event.clientX;
    state.origin.y = event.clientY;
    joystick.classList.add("active");
    joystick.setPointerCapture?.(event.pointerId);
    this.updateJoystick(event, state);
  }

  handleJoystickMove(event, joystick, state) {
    if (event.pointerId !== state.pointerId || this.gameplayBlocked) {
      return;
    }
    event.preventDefault();
    this.updateJoystick(event, state);
  }

  handleJoystickEnd(event, joystick, state) {
    if (event.pointerId !== state.pointerId) {
      return;
    }
    event.preventDefault();
    state.pointerId = null;
    joystick.classList.remove("active");
    joystick.releasePointerCapture?.(event.pointerId);
    this.resetJoystick(state);
  }

  updateJoystick(event, state) {
    const maxDistance = 42;
    const deltaX = event.clientX - state.origin.x;
    const deltaY = event.clientY - state.origin.y;
    const distance = Math.min(maxDistance, Math.hypot(deltaX, deltaY));
    const angle = Math.atan2(deltaY, deltaX);
    const clampedX = Math.cos(angle) * distance;
    const clampedY = Math.sin(angle) * distance;
    const normalizedX = clampedX / maxDistance;
    const normalizedY = clampedY / maxDistance;

    if (state.knob) {
      state.knob.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;
    }

    if (state.type === "move") {
      this.setVirtualMoveFromAxis(normalizedX, normalizedY);
      return;
    }

    if (state.type === "look") {
      const deadZone = 0.08;
      if (Math.abs(normalizedX) > deadZone || Math.abs(normalizedY) > deadZone) {
        this.mouseDelta.x += normalizedX * 14;
        this.mouseDelta.y += normalizedY * 14;
        this.virtualPointerActive = true;
      }
    }
  }

  resetJoystick(state) {
    state.knob?.style.removeProperty("transform");
    if (state.type === "move") {
      this.setVirtualMoveFromAxis(0, 0);
      return;
    }
    if (state.type === "look") {
      this.virtualPointerActive = this.mouseButtons.size > 0;
    }
  }

  setVirtualMoveFromAxis(axisX, axisY) {
    const deadZone = 0.28;
    const nextCodes = new Set();
    if (axisY < -deadZone) {
      nextCodes.add("KeyW");
    }
    if (axisY > deadZone) {
      nextCodes.add("KeyS");
    }
    if (axisX < -deadZone) {
      nextCodes.add("KeyA");
    }
    if (axisX > deadZone) {
      nextCodes.add("KeyD");
    }

    ["KeyW", "KeyA", "KeyS", "KeyD"].forEach((code) => {
      if (nextCodes.has(code) && !this.virtualMoveCodes.has(code)) {
        this.pressVirtualKey(code);
      }
      if (!nextCodes.has(code) && this.virtualMoveCodes.has(code)) {
        this.releaseVirtualKey(code);
      }
    });
    this.virtualMoveCodes = nextCodes;
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
      this.requestPointerLock();
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

  handleTouchLookStart(event) {
    if (event.pointerType === "mouse" || !this.isGameplayPointerEvent(event)) {
      return;
    }
    event.preventDefault();
    this.touchLookPointerId = event.pointerId;
    this.touchLookLast.x = event.clientX;
    this.touchLookLast.y = event.clientY;
    this.canvas.setPointerCapture?.(event.pointerId);
  }

  handleTouchLookMove(event) {
    if (event.pointerId !== this.touchLookPointerId || this.gameplayBlocked) {
      return;
    }
    event.preventDefault();
    const lookScale = 1.45;
    this.mouseDelta.x += (event.clientX - this.touchLookLast.x) * lookScale;
    this.mouseDelta.y += (event.clientY - this.touchLookLast.y) * lookScale;
    this.touchLookLast.x = event.clientX;
    this.touchLookLast.y = event.clientY;
  }

  handleTouchLookEnd(event) {
    if (event.pointerId !== this.touchLookPointerId) {
      return;
    }
    this.touchLookPointerId = null;
    this.canvas.releasePointerCapture?.(event.pointerId);
  }

  handlePointerLockChange() {
    this.pointerLocked = document.pointerLockElement === this.canvas;
    if (!this.pointerLocked) {
      this.mouseButtons.clear();
    }
  }

  requestPointerLock() {
    if (this.gameplayBlocked || typeof this.canvas.requestPointerLock !== "function") {
      return;
    }
    try {
      this.canvas.requestPointerLock();
    } catch {
      // Touch browsers often do not support pointer lock; touch-look handles aiming there.
    }
  }

  pressVirtualKey(code) {
    if (!code || this.gameplayBlocked) {
      return;
    }
    if (!this.keys.has(code)) {
      this.justPressed.add(code);
    }
    this.keys.add(code);
  }

  releaseVirtualKey(code) {
    if (!code) {
      return;
    }
    this.keys.delete(code);
  }

  tapVirtualKey(code) {
    if (!code || this.gameplayBlocked) {
      return;
    }
    this.justPressed.add(code);
  }

  pressVirtualMouse(button) {
    if (this.gameplayBlocked) {
      return;
    }
    this.virtualPointerActive = true;
    if (!this.mouseButtons.has(button)) {
      this.justMousePressed.add(button);
    }
    this.mouseButtons.add(button);
  }

  releaseVirtualMouse(button) {
    this.virtualPointerActive = false;
    if (this.mouseButtons.has(button)) {
      this.mouseButtons.delete(button);
      this.justMouseReleased.add(button);
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
      this.virtualPointerActive = false;
      this.touchLookPointerId = null;
      this.setVirtualMoveFromAxis(0, 0);
      this.touchJoysticks.forEach((state, joystick) => {
        state.pointerId = null;
        state.knob?.style.removeProperty("transform");
        joystick.classList.remove("active");
      });
    }
  }

  hasGameplayPointer() {
    return this.pointerLocked || this.virtualPointerActive;
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
