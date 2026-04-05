(function () {
  const StillwakeHouse = window.StillwakeHouse || (window.StillwakeHouse = {});
  const { CONFIG, createRenderer, createScene, createCamera, addLights, Player, HouseWorld, UIController } = StillwakeHouse;

  function returnToMenu() {
    if (window.top && window.top !== window) {
      window.top.postMessage({ type: "codex-menu-exit" }, window.location.origin);
      return;
    }
    window.location.href = "../index.html";
  }

  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.renderer = createRenderer(canvas);
      this.scene = createScene();
      this.camera = createCamera();
      addLights(this.scene);

      this.ui = new UIController();
      this.player = new Player();
      this.world = new HouseWorld(this.scene);
      this.scene.add(this.player.group);

      this.keys = Object.create(null);
      this.lastTime = 0;
      this.started = false;
      this.paused = false;
      this.readingLetter = false;
      this.transitioning = false;
      this.activePrompt = null;
      this.tmpDirection = new THREE.Vector3();
      this.desiredVelocity = new THREE.Vector3();
      this.cameraCurrent = new THREE.Vector3(0, 2.6, 6);
      this.cameraLook = new THREE.Vector3();
      this.noteFocus = new THREE.Vector3(1.18, 1.02, 0.08);

      this.bind();
      this.updatePrompt();
    }

    bind() {
      this.ui.startButton.addEventListener("click", () => {
        this.started = true;
        this.ui.title.hidden = true;
        this.ui.beginFade();
      });

      this.ui.closeNote.addEventListener("click", () => {
        this.readingLetter = false;
        this.ui.closeLetter();
      });

      window.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();
        this.keys[key] = true;

        if (["w", "a", "s", "d", "e", "p", "escape"].includes(key)) {
          event.preventDefault();
        }

        if (key === "escape") {
          if (this.readingLetter) {
            this.readingLetter = false;
            this.ui.closeLetter();
            return;
          }
          returnToMenu();
          return;
        }

        if (!this.started) {
          return;
        }

        if (key === "p") {
          this.paused = !this.paused;
        }

        if (key === "e" && !this.paused) {
          if (this.activePrompt && this.activePrompt.type === "note") {
            this.readingLetter = true;
            if (this.activePrompt.focusPoint) {
              this.noteFocus.copy(this.activePrompt.focusPoint);
            }
            this.ui.openLetter(this.activePrompt.note);
          } else if (this.activePrompt && this.activePrompt.type === "transition") {
            this.transitionToZone(this.activePrompt);
          }
        }
      });

      window.addEventListener("keyup", (event) => {
        this.keys[event.key.toLowerCase()] = false;
      });
    }

    movePlayer(dt) {
      if (!this.started || this.paused || this.readingLetter || this.transitioning) {
        this.player.velocity.set(0, 0, 0);
        return;
      }

      const moveX = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0);
      const moveZ = (this.keys.s ? 1 : 0) - (this.keys.w ? 1 : 0);
      this.tmpDirection.set(moveX, 0, moveZ);

      if (this.tmpDirection.lengthSq() > 0) {
        this.tmpDirection.normalize();
        this.desiredVelocity.copy(this.tmpDirection).multiplyScalar(CONFIG.player.speed);
        const targetYaw = Math.atan2(this.tmpDirection.x, this.tmpDirection.z);
        let deltaYaw = targetYaw - this.player.group.rotation.y;
        deltaYaw = Math.atan2(Math.sin(deltaYaw), Math.cos(deltaYaw));
        this.player.group.rotation.y += deltaYaw * 0.14;
      } else {
        this.desiredVelocity.set(0, 0, 0);
      }

      const blend = this.tmpDirection.lengthSq() > 0 ? 0.18 : 0.24;
      this.player.velocity.lerp(this.desiredVelocity, blend);
      this.player.position.addScaledVector(this.player.velocity, dt);
      this.resolveCollisions();
      const bounds = this.world.getBounds();
      this.player.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.player.position.x));
      this.player.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, this.player.position.z));
      this.player.updateVisuals(dt);
    }

    resolveCollisions() {
      const r = CONFIG.player.radius;
      for (const collider of this.world.colliders) {
        if (
          this.player.position.x > collider.minX - r &&
          this.player.position.x < collider.maxX + r &&
          this.player.position.z > collider.minZ - r &&
          this.player.position.z < collider.maxZ + r
        ) {
          const pushLeft = Math.abs(this.player.position.x - (collider.minX - r));
          const pushRight = Math.abs((collider.maxX + r) - this.player.position.x);
          const pushBack = Math.abs(this.player.position.z - (collider.minZ - r));
          const pushFront = Math.abs((collider.maxZ + r) - this.player.position.z);
          const minPush = Math.min(pushLeft, pushRight, pushBack, pushFront);

          if (minPush === pushLeft) this.player.position.x = collider.minX - r;
          else if (minPush === pushRight) this.player.position.x = collider.maxX + r;
          else if (minPush === pushBack) this.player.position.z = collider.minZ - r;
          else this.player.position.z = collider.maxZ + r;
        }
      }
    }

    updatePrompt() {
      this.activePrompt = null;
      let promptText = "";
      for (const interactable of this.world.interactables) {
        const distance = interactable.position.distanceTo(this.player.position);
        if (distance <= CONFIG.interaction.range) {
          this.activePrompt = interactable;
          promptText = interactable.prompt;
          break;
        }
      }
      this.ui.showPrompt(Boolean(this.activePrompt) && !this.readingLetter && !this.transitioning && this.started, promptText);
    }

    updateCamera() {
      const target = new THREE.Vector3(
        this.player.position.x,
        CONFIG.camera.lookHeight,
        this.player.position.z
      );

      let desired;
      let lookAt;
      if (this.readingLetter) {
        desired = new THREE.Vector3(
          this.noteFocus.x + 1.05,
          CONFIG.camera.focusHeight + 0.7,
          this.noteFocus.z + 2.05
        );
        lookAt = this.noteFocus.clone();
      } else {
        desired = new THREE.Vector3(
          this.player.position.x,
          CONFIG.camera.height,
          this.player.position.z + CONFIG.camera.distance
        );
        const bounds = this.world.getBounds();
        desired.x = Math.max(bounds.minX + 1.2, Math.min(bounds.maxX - 1.2, desired.x));
        desired.z = Math.max(bounds.minZ + 1.2, Math.min(bounds.maxZ - 1.2, desired.z));
        lookAt = target;
      }

      this.cameraCurrent.lerp(desired, CONFIG.camera.smooth);
      this.camera.position.copy(this.cameraCurrent);
      this.cameraLook.lerp(lookAt, CONFIG.camera.smooth * 1.15);
      this.camera.lookAt(this.cameraLook);
    }

    update(dt, elapsed) {
      this.movePlayer(dt);
      this.world.update(dt, elapsed);
      this.updatePrompt();
      this.updateCamera();
    }

    transitionToZone(interactable) {
      if (this.transitioning) return;
      this.transitioning = true;
      this.player.velocity.set(0, 0, 0);
      this.desiredVelocity.set(0, 0, 0);
      this.ui.fadeToBlack();

      window.setTimeout(() => {
        this.world.setZone(interactable.targetZone);
        this.player.position.copy(interactable.spawn);
        if (typeof interactable.yaw === "number") {
          this.player.group.rotation.y = interactable.yaw;
        }
        this.cameraCurrent.set(
          this.player.position.x,
          CONFIG.camera.height,
          this.player.position.z + CONFIG.camera.distance
        );
        this.cameraLook.set(this.player.position.x, CONFIG.camera.lookHeight, this.player.position.z);
        this.updatePrompt();
        this.ui.fadeFromBlack();
        window.setTimeout(() => {
          this.transitioning = false;
        }, 320);
      }, 340);
    }

    render() {
      this.renderer.render(this.scene, this.camera);
    }

    frame = (timestamp) => {
      const dt = Math.min(0.033, ((timestamp - this.lastTime) / 1000) || 0);
      this.lastTime = timestamp;
      this.update(dt, timestamp / 1000);
      this.render();
      requestAnimationFrame(this.frame);
    };
  }

  StillwakeHouse.Game = Game;
}());
