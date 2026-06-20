import { SETTINGS } from "../config/settings.js";

export const ARROW_TYPE_ORDER = ["standard", "fire", "ice", "explosive"];

const FALLBACK_ARROW_TYPES = {
  standard: { name: "Standard Arrow", color: 0xffe3a0, damageMultiplier: 1, rangeMultiplier: 1 },
  fire: { name: "Fire Arrow", color: 0xff8a3d, damageMultiplier: 1.08, rangeMultiplier: 0.98, burnDuration: 3.8 },
  ice: { name: "Ice Arrow", color: 0x8ddcff, damageMultiplier: 0.92, rangeMultiplier: 1, slowDuration: 3.2 },
  explosive: { name: "Explosive Arrow", color: 0xffcf5f, damageMultiplier: 0.82, rangeMultiplier: 0.92, radius: 4.2 },
};

export class SpecialArrowSystem {
  constructor(ui = {}) {
    this.ui = ui;
    this.currentType = "standard";
    this.types = SETTINGS.archery?.arrowTypes ?? FALLBACK_ARROW_TYPES;
    this.updateUi();
  }

  update(input) {
    if (input.wasPressed("Digit1")) this.select("standard");
    if (input.wasPressed("Digit2")) this.select("fire");
    if (input.wasPressed("Digit3")) this.select("ice");
    if (input.wasPressed("Digit4")) this.select("explosive");
    if (input.wasPressed("BracketLeft")) this.cycle(-1);
    if (input.wasPressed("BracketRight")) this.cycle(1);
  }

  cycle(direction) {
    const index = ARROW_TYPE_ORDER.indexOf(this.currentType);
    const next = (index + direction + ARROW_TYPE_ORDER.length) % ARROW_TYPE_ORDER.length;
    this.select(ARROW_TYPE_ORDER[next]);
  }

  select(type) {
    if (!this.types[type] || type === this.currentType) {
      return;
    }
    this.currentType = type;
    this.updateUi();
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "uiClick", intensity: 0.58 },
    }));
  }

  getCurrentArrowType() {
    return {
      id: this.currentType,
      ...this.types[this.currentType],
    };
  }

  updateUi() {
    if (this.ui.label) {
      this.ui.label.textContent = this.types[this.currentType]?.name ?? "Standard Arrow";
    }
  }
}
