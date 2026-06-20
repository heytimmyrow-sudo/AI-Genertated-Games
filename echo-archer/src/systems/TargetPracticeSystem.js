const { THREE } = window;

export class TargetPracticeSystem {
  constructor(world, ui) {
    this.world = world;
    this.ui = ui;
    this.goal = 5;
    this.hits = 0;
    this.shots = 0;
    this.comboPulse = 0;
    this.resetDelay = 2.8;
    this.camera = null;
    this.targetHitListeners = [];
    this.challengeHits = new Map();
    this.completedChallenges = new Set();
    window.addEventListener("echo-archer:reset-challenge", (event) => this.resetChallenge(event.detail?.id));
    this.updateUi();
  }

  onTargetHit(callback) {
    this.targetHitListeners.push(callback);
  }

  registerShot() {
    this.shots += 1;
    this.updateUi();
  }

  handleArrowHit(arrow) {
    const target = arrow.hitObjectRef?.userData.target;
    if (!target || !target.active) {
      return;
    }

    const score = this.scoreTargetHit(target, arrow.hitPoint);
    if (!score) {
      return;
    }

    this.hits += 1;
    this.comboPulse = 0.16;
    this.disableTarget(target);
    this.showPopup(arrow.hitPoint, score.bullseye ? "BULLSEYE +150" : `+100${arrow.shotPower > 0.72 ? " POWER" : ""}`, score.bullseye || arrow.shotPower > 0.72);
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: score.bullseye ? "bullseyeHit" : "arrowHit", intensity: score.bullseye ? 1.18 : 0.9 + arrow.shotPower * 0.35 },
    }));
    this.updateUi();
    const challengeComplete = this.handleChallengeTarget(target);
    this.targetHitListeners.forEach((callback) => callback({ target, score, hits: this.hits, challengeComplete }));
  }

  handleChallengeTarget(target) {
    if (!target.challengeId || this.completedChallenges.has(target.challengeId)) {
      return null;
    }

    if (!this.challengeHits.has(target.challengeId)) {
      this.challengeHits.set(target.challengeId, new Set());
    }

    const challengeHits = this.challengeHits.get(target.challengeId);
    challengeHits.add(target.id);
    const goal = this.world.targets.filter((entry) => entry.challengeId === target.challengeId).length;
    if (challengeHits.size < goal) {
      return null;
    }

    this.completedChallenges.add(target.challengeId);
    return {
      id: target.challengeId,
      label: target.challengeLabel ?? "Hidden Challenge",
      goal,
    };
  }

  resetChallenge(id) {
    if (!id) {
      return;
    }
    this.completedChallenges.delete(id);
    this.challengeHits.delete(id);
    this.world.targets.filter((target) => target.challengeId === id).forEach((target) => this.resetTarget(target));
  }

  scoreTargetHit(target, point) {
    const localPoint = target.face.worldToLocal(point.clone());
    const distance = Math.hypot(localPoint.x, localPoint.z);
    const scaledRadius = target.radius / target.baseScale;
    const scaledBullseye = target.bullseyeRadius / target.baseScale;

    if (distance > scaledRadius) {
      return null;
    }

    return {
      bullseye: distance <= scaledBullseye,
      distance,
    };
  }

  disableTarget(target) {
    target.active = false;
    target.resetTimer = this.resetDelay;
    target.group.scale.setScalar(target.baseScale * 0.82);
    target.group.position.y = target.baseY - 0.18;
    target.group.rotation.z = 0.08;
    target.group.rotation.x = -0.04;
    target.face.material.emissive = new THREE.Color(0x4a2c12);
    target.face.material.emissiveIntensity = 0.18;
    target.rings.forEach((ring) => {
      ring.material.emissive = new THREE.Color(0x5c3514);
      ring.material.emissiveIntensity = 0.24;
    });
  }

  resetTarget(target) {
    target.active = true;
    target.resetTimer = 0;
    target.group.scale.setScalar(target.baseScale);
    target.group.position.y = target.baseY;
    target.group.rotation.z = 0;
    target.group.rotation.x = 0;
    target.face.material.emissiveIntensity = 0;
    target.rings.forEach((ring) => {
      ring.material.emissiveIntensity = 0;
    });
  }

  update(deltaSeconds, camera) {
    this.camera = camera;
    this.comboPulse = Math.max(0, this.comboPulse - deltaSeconds);

    this.world.targets.forEach((target) => {
      if (target.active) {
        return;
      }

      target.resetTimer -= deltaSeconds;
      target.group.rotation.z *= 0.92;
      if (target.resetTimer <= 0) {
        this.resetTarget(target);
      }
    });
  }

  updateUi() {
    const accuracy = this.shots === 0 ? 0 : Math.round((this.hits / this.shots) * 100);
    const complete = this.hits >= this.goal;
    this.ui.challenge.textContent = complete ? "Challenge complete" : `Targets ${this.hits}/${this.goal}`;
    this.ui.accuracy.textContent = `Accuracy ${accuracy}%`;
    this.ui.challenge.classList.toggle("complete", complete);
  }

  showPopup(worldPoint, text, bullseye) {
    if (!this.camera || !this.ui.popups) {
      return;
    }

    const projected = worldPoint.clone().project(this.camera);
    if (projected.z < -1 || projected.z > 1) {
      return;
    }

    const popup = document.createElement("span");
    popup.className = bullseye ? "score-popup bullseye" : "score-popup";
    popup.textContent = text;
    popup.style.left = `${(projected.x * 0.5 + 0.5) * window.innerWidth}px`;
    popup.style.top = `${(-projected.y * 0.5 + 0.5) * window.innerHeight}px`;
    this.ui.popups.appendChild(popup);
    window.setTimeout(() => popup.remove(), 950);
  }
}
