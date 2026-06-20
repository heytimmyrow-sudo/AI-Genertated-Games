const { THREE } = window;

const WIND_LABELS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export class WindSystem {
  constructor(world, ui = {}) {
    this.world = world;
    this.ui = ui;
    this.time = 0;
    this.directionAngle = -0.72;
    this.strength = 0;
    this.targetStrength = 0;
    this.active = false;
    this.currentRegion = null;
    this.vector = new THREE.Vector3();
    this.updateUi();
  }

  update(deltaSeconds, player) {
    this.time += deltaSeconds;
    const position = player?.group?.position;
    this.currentRegion = position ? this.world.getRegionAt(position) : null;
    this.active = this.isCoastalRegion(this.currentRegion) || this.isCanyonRegion(this.currentRegion) || this.isAshenRegion(this.currentRegion);
    const gustPulse = Math.sin(this.time * 0.47) * 0.18 + Math.sin(this.time * 0.91) * 0.09;
    const baseStrength = this.active ? this.getRegionalStrength(this.currentRegion) : 0;
    this.targetStrength = Math.max(0, baseStrength + gustPulse);
    this.strength = THREE.MathUtils.lerp(this.strength, this.targetStrength, 0.035);
    this.directionAngle += Math.sin(this.time * 0.22) * deltaSeconds * 0.035;
    this.vector.set(Math.sin(this.directionAngle), 0, Math.cos(this.directionAngle)).normalize().multiplyScalar(this.strength);
    this.updateUi();
  }

  getRegionalStrength(region) {
    if (!region) return 0;
    if (region.id === "windspire-bridge" || region.id === "broken-beacon") return 1.0;
    if (region.id === "stormwatch-fortress" || region.id === "drowned-citadel") return 0.88;
    if (region.id === "shattered-coast") return 0.66;
    if (region.id === "broken-lighthouse") return 0.82;
    if (region.id === "coastal-cliffs") return 0.58;
    if (region.id === "skybridge-crossing" || region.id === "echo-chasm") return 0.72;
    if (region.id === "red-canyon") return 0.42;
    if (region.id === "firewatch-spire" || region.id === "ember-peak") return 0.62;
    if (region.id === "ashen-highlands") return 0.36;
    return 0.44;
  }

  isCoastalRegion(region) {
    return Boolean(region?.id?.includes("coastal")
      || region?.id === "broken-lighthouse"
      || region?.id === "sea-cave-shrine"
      || region?.id === "shipwreck-cove"
      || region?.id === "windspire-bridge"
      || region?.id === "shattered-coast"
      || region?.id === "stormwatch-fortress"
      || region?.id === "broken-beacon"
      || region?.id === "tidefall-caverns"
      || region?.id === "kings-sea-gate"
      || region?.id === "wreckers-point"
      || region?.id === "drowned-citadel");
  }

  isCanyonRegion(region) {
    return Boolean(region?.id?.includes("red-canyon")
      || region?.id === "skybridge-crossing"
      || region?.id === "crimson-arch"
      || region?.id === "forgotten-outpost"
      || region?.id === "sunspire-plateau"
      || region?.id === "echo-chasm");
  }

  isAshenRegion(region) {
    return Boolean(region?.id?.includes("ashen-highlands")
      || region?.id === "ember-peak"
      || region?.id === "obsidian-citadel"
      || region?.id === "ashfall-basin"
      || region?.id === "firewatch-spire"
      || region?.id === "molten-hollow");
  }

  getArrowDrift(origin, power = 1) {
    if (!this.active || this.strength <= 0.05) {
      return new THREE.Vector3();
    }
    const longShotFactor = THREE.MathUtils.clamp((power - 0.42) / 0.58, 0, 1);
    return this.vector.clone().multiplyScalar(0.75 + longShotFactor * 1.55);
  }

  updateUi() {
    if (!this.ui.label) {
      return;
    }
    if (!this.active || this.strength < 0.05) {
      this.ui.label.textContent = "Wind Calm";
      this.ui.label.classList.remove("coastal-wind");
      return;
    }
    const normalized = (this.directionAngle + Math.PI * 2) % (Math.PI * 2);
    const index = Math.round(normalized / (Math.PI * 0.25)) % WIND_LABELS.length;
    this.ui.label.textContent = `Wind ${WIND_LABELS[index]} ${Math.round(this.strength * 10)}`;
    this.ui.label.classList.add("coastal-wind");
  }
}
