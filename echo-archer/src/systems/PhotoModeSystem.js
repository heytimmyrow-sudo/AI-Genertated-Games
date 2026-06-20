const { THREE } = window;

export class PhotoModeSystem {
  constructor(camera, cameraRig, player, ui = {}) {
    this.camera = camera;
    this.cameraRig = cameraRig;
    this.player = player;
    this.ui = ui;
    this.open = false;
    this.anchor = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.maxDistance = 18;
    this.moveSpeed = 9;
  }

  update(input, deltaSeconds) {
    if (input.wasPressed("KeyP")) {
      this.toggle();
    }
    if (input.wasPressed("Escape") && this.open) {
      this.close();
    }
    if (!this.open) {
      return;
    }

    const mouse = input.consumeMouseDelta();
    this.yaw -= mouse.x * 0.0022;
    this.pitch = THREE.MathUtils.clamp(this.pitch - mouse.y * 0.0022, -1.2, 1.2);

    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.sin(this.yaw + Math.PI / 2), 0, Math.cos(this.yaw + Math.PI / 2));
    const vertical = new THREE.Vector3(0, 1, 0);
    const movement = new THREE.Vector3();
    if (input.isDown("KeyW")) movement.add(forward);
    if (input.isDown("KeyS")) movement.sub(forward);
    if (input.isDown("KeyD")) movement.add(right);
    if (input.isDown("KeyA")) movement.sub(right);
    if (input.isDown("Space")) movement.add(vertical);
    if (input.isDown("ShiftLeft") || input.isDown("ShiftRight")) movement.sub(vertical);
    if (movement.lengthSq() > 0) {
      movement.normalize();
      this.camera.position.addScaledVector(movement, this.moveSpeed * deltaSeconds);
    }

    const offset = this.camera.position.clone().sub(this.anchor);
    if (offset.length() > this.maxDistance) {
      offset.setLength(this.maxDistance);
      this.camera.position.copy(this.anchor).add(offset);
    }

    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
  }

  toggle() {
    this.open ? this.close() : this.openPhotoMode();
  }

  openPhotoMode() {
    this.open = true;
    this.anchor.copy(this.player.group.position);
    this.yaw = this.cameraRig.yaw;
    this.pitch = this.cameraRig.pitch;
    document.body.classList.add("photo-open");
    this.ui.overlay?.classList.add("visible");
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "uiClick", intensity: 0.55 },
    }));
  }

  close() {
    if (!this.open) {
      return;
    }
    this.open = false;
    document.body.classList.remove("photo-open");
    this.ui.overlay?.classList.remove("visible");
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "uiClick", intensity: 0.45 },
    }));
  }
}
