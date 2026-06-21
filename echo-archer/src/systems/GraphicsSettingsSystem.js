const QUALITY_STORAGE_KEY = "echo-archer-graphics-quality-v1";

export const GRAPHICS_PRESETS = {
  low: {
    id: "low",
    label: "Low",
    pixelRatio: 0.9,
    shadows: false,
    shadowMapSize: 768,
    detailDistance: 34,
    particleMultiplier: 0.42,
    weatherParticles: 70,
    effectsQuality: 0.55,
    waterQuality: 0.55,
    cameraSmoothing: 0.22,
  },
  medium: {
    id: "medium",
    label: "Medium",
    pixelRatio: 1.1,
    shadows: true,
    shadowMapSize: 1280,
    detailDistance: 55,
    particleMultiplier: 0.7,
    weatherParticles: 120,
    effectsQuality: 0.78,
    waterQuality: 0.78,
    cameraSmoothing: 0.18,
  },
  high: {
    id: "high",
    label: "High",
    pixelRatio: 1.45,
    shadows: true,
    shadowMapSize: 2048,
    detailDistance: 86,
    particleMultiplier: 1,
    weatherParticles: 180,
    effectsQuality: 1,
    waterQuality: 1,
    cameraSmoothing: 0.15,
  },
};

export class GraphicsSettingsSystem {
  constructor(renderer, systems = {}, ui = {}) {
    this.renderer = renderer;
    this.systems = systems;
    this.ui = ui;
    this.open = false;
    this.quality = this.loadQuality();
    this.bindUi();
    this.applyQuality(this.quality);
  }

  loadQuality() {
    try {
      const stored = localStorage.getItem(QUALITY_STORAGE_KEY);
      if (GRAPHICS_PRESETS[stored]) {
        return stored;
      }
    } catch {
      // Ignore storage failures and fall back to a safe preset.
    }

    const lowDevice = (navigator.hardwareConcurrency ?? 8) <= 4 || (navigator.deviceMemory ?? 8) <= 4;
    return lowDevice ? "low" : "medium";
  }

  saveQuality(quality) {
    try {
      localStorage.setItem(QUALITY_STORAGE_KEY, quality);
    } catch {
      // localStorage may be disabled; settings still apply for this session.
    }
  }

  bindUi() {
    this.ui.toggle?.addEventListener("click", () => this.toggle());
    this.ui.buttons?.forEach((button) => {
      button.addEventListener("click", () => this.setQuality(button.dataset.quality));
    });
  }

  toggle(force = null) {
    this.open = force ?? !this.open;
    this.ui.panel?.classList.toggle("visible", this.open);
  }

  setQuality(quality) {
    if (!GRAPHICS_PRESETS[quality]) {
      return;
    }
    this.quality = quality;
    this.saveQuality(quality);
    this.applyQuality(quality);
  }

  applyQuality(quality) {
    const preset = GRAPHICS_PRESETS[quality] ?? GRAPHICS_PRESETS.medium;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, preset.pixelRatio);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.shadowMap.enabled = preset.shadows;

    this.systems.world?.applyGraphicsQuality?.(preset);
    this.systems.feedback?.setQuality?.(preset);
    this.systems.weather?.setQuality?.(preset);
    this.systems.archery?.setQuality?.(preset);
    this.systems.cameraRig?.setQuality?.(preset);

    if (this.ui.label) {
      this.ui.label.textContent = `${preset.label} Graphics`;
    }
    this.ui.buttons?.forEach((button) => {
      button.classList.toggle("active", button.dataset.quality === quality);
      button.setAttribute("aria-pressed", String(button.dataset.quality === quality));
    });
  }

  update(input) {
    if (input.wasPressed("F2")) {
      this.toggle();
    }
    if (this.open && input.wasPressed("Escape")) {
      this.toggle(false);
    }
  }

  getPreset() {
    return GRAPHICS_PRESETS[this.quality] ?? GRAPHICS_PRESETS.medium;
  }
}
