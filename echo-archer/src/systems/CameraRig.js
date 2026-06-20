import { SETTINGS } from "../config/settings.js";

const { THREE } = window;

export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.mode = "third";
    this.yaw = Math.PI;
    this.pitch = -0.18;
    this.aimAmount = 0;
    this.shake = 0;
    this.baseFov = camera.fov;
    this.forward = new THREE.Vector3();
    this.side = new THREE.Vector3();
    this.target = new THREE.Vector3();
    this.scenicTarget = null;
    this.scenicTimer = 0;
    this.scenicDuration = 0;
  }

  toggleMode() {
    this.mode = this.mode === "third" ? "first" : "third";
    return this.mode;
  }

  applyMouseLook(delta) {
    if (this.scenicTimer > 0) {
      return;
    }
    this.yaw -= delta.x * SETTINGS.camera.mouseSensitivity;
    this.pitch -= delta.y * SETTINGS.camera.mouseSensitivity;
    this.pitch = THREE.MathUtils.clamp(this.pitch, SETTINGS.camera.minPitch, SETTINGS.camera.maxPitch);
  }

  setAimState(isDrawing, drawAmount) {
    const target = isDrawing ? THREE.MathUtils.clamp(0.35 + drawAmount * 0.65, 0, 1) : 0;
    this.aimAmount = THREE.MathUtils.lerp(this.aimAmount, target, 0.23);
    const aimFov = this.mode === "first" ? SETTINGS.camera.firstPersonAimFov : SETTINGS.camera.thirdPersonAimFov;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, THREE.MathUtils.lerp(this.baseFov, aimFov, this.aimAmount), 0.18);
    this.camera.updateProjectionMatrix();
  }

  addShake(amount) {
    this.shake = Math.min(1, this.shake + amount);
  }

  startScenicLook(target, duration = 2.6) {
    this.scenicTarget = target.clone ? target.clone() : new THREE.Vector3(target.x, target.y, target.z);
    this.scenicTimer = duration;
    this.scenicDuration = duration;
  }

  getPlanarForward() {
    this.forward.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize();
    return this.forward;
  }

  getPlanarSide() {
    this.side.set(-Math.cos(this.yaw), 0, Math.sin(this.yaw)).normalize();
    return this.side;
  }

  update(player, terrain, deltaSeconds = 0) {
    if (this.mode === "first") {
      this.updateFirstPerson(player);
      this.applyScenicLook(deltaSeconds);
      this.applyShake();
      return;
    }

    this.updateThirdPerson(player, terrain);
    this.applyScenicLook(deltaSeconds);
    this.applyShake();
  }

  updateFirstPerson(player) {
    const eye = player.getEyePosition(SETTINGS.camera.firstPersonHeight);
    const lookDirection = this.getLookDirection();
    const sideOffset = this.getPlanarSide().clone().multiplyScalar(SETTINGS.camera.firstPersonAimSideOffset * this.aimAmount);
    this.camera.position.copy(eye).add(sideOffset);
    this.camera.lookAt(eye.clone().add(lookDirection));
  }

  updateThirdPerson(player, terrain) {
    const playerEye = player.getEyePosition(1.42);
    const planarForward = this.getPlanarForward().clone();
    const lookDirection = this.getLookDirection();
    const shoulder = THREE.MathUtils.lerp(
      SETTINGS.camera.thirdPersonShoulderOffset,
      SETTINGS.camera.thirdPersonAimShoulderOffset,
      this.aimAmount
    );
    const distance = THREE.MathUtils.lerp(
      SETTINGS.camera.thirdPersonDistance,
      SETTINGS.camera.thirdPersonAimDistance,
      this.aimAmount
    );
    const sideOffset = this.getPlanarSide().clone().multiplyScalar(shoulder);
    const focusDistance = SETTINGS.camera.thirdPersonLookAhead + this.aimAmount * 4.2;
    const focus = playerEye.clone().add(lookDirection.clone().multiplyScalar(focusDistance));
    focus.add(sideOffset.clone().multiplyScalar(0.2));

    const backward = planarForward.multiplyScalar(-distance);
    const height = SETTINGS.camera.thirdPersonHeight + Math.max(0, this.pitch) * 0.35;
    const desired = playerEye.clone().add(backward).add(sideOffset);
    desired.y += height;

    const floor = terrain.getHeightAt(desired.x, desired.z) + 0.7;
    desired.y = Math.max(desired.y, floor);

    this.camera.position.lerp(desired, 0.18);
    this.camera.lookAt(focus);
  }

  getLookDirection() {
    const cosPitch = Math.cos(this.pitch);
    return new THREE.Vector3(
      Math.sin(this.yaw) * cosPitch,
      Math.sin(this.pitch),
      Math.cos(this.yaw) * cosPitch
    ).normalize();
  }

  getAimDirection(origin = null) {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    direction.y += SETTINGS.archery.aimLift;
    direction.normalize();

    if (!origin || this.mode === "first") {
      return direction;
    }

    const reticlePoint = this.camera.position.clone().add(direction.clone().multiplyScalar(90));
    return reticlePoint.sub(origin).normalize();
  }

  applyShake() {
    if (this.shake <= 0.001) {
      return;
    }

    const time = performance.now() * 0.032;
    const side = this.getPlanarSide().clone().multiplyScalar(Math.sin(time * 1.7) * this.shake * 0.06);
    const vertical = new THREE.Vector3(0, Math.cos(time * 2.1) * this.shake * 0.04, 0);
    this.camera.position.add(side).add(vertical);
    this.shake *= 0.78;
  }

  applyScenicLook(deltaSeconds) {
    if (!this.scenicTarget || this.scenicTimer <= 0) {
      return;
    }

    this.scenicTimer = Math.max(0, this.scenicTimer - deltaSeconds);
    const strength = Math.sin((this.scenicTimer / Math.max(this.scenicDuration, 0.001)) * Math.PI);
    const currentDirection = new THREE.Vector3();
    this.camera.getWorldDirection(currentDirection);
    const scenicDirection = this.scenicTarget.clone().sub(this.camera.position).normalize();
    const blended = currentDirection.lerp(scenicDirection, THREE.MathUtils.clamp(0.18 + strength * 0.42, 0, 0.62));
    this.camera.lookAt(this.camera.position.clone().add(blended));
    if (this.scenicTimer === 0) {
      this.scenicTarget = null;
    }
  }
}
