import { SETTINGS } from "../config/settings.js";

const { THREE } = window;

export const WEATHER_PROFILES = {
  clear: { name: "Clear", skyTint: 0xffffff, lightDim: 0, fogBoost: 0, rain: 0 },
  cloudy: { name: "Cloudy", skyTint: 0xcbd4cf, lightDim: 0.18, fogBoost: 0.002, rain: 0 },
  "light-rain": { name: "Light Rain", skyTint: 0xaebcca, lightDim: 0.28, fogBoost: 0.004, rain: 1 },
  fog: { name: "Fog", skyTint: 0xd8d2bd, lightDim: 0.16, fogBoost: 0.012, rain: 0 },
  snowfall: { name: "Snowfall", skyTint: 0xdce9f2, lightDim: 0.24, fogBoost: 0.006, rain: 0.65, snow: 1 },
  "icy-fog": { name: "Icy Fog", skyTint: 0xc5d8e6, lightDim: 0.3, fogBoost: 0.018, rain: 0, snow: 0.18 },
  "mountain-wind": { name: "Mountain Wind", skyTint: 0xe5edf2, lightDim: 0.16, fogBoost: 0.004, rain: 0, snow: 0.35, wind: 1 },
  "mistwood-mist": { name: "Mistwood Mist", skyTint: 0xcfe6d8, lightDim: 0.14, fogBoost: 0.016, rain: 0, glow: 1 },
  "blackwater-fog": { name: "Blackwater Fog", skyTint: 0xb7c5a8, lightDim: 0.2, fogBoost: 0.02, rain: 0.08, glow: 0.65 },
  "canyon-dust": { name: "Canyon Dust", skyTint: 0xf1b16d, lightDim: 0.08, fogBoost: 0.006, rain: 0, wind: 0.9 },
  ashfall: { name: "Ashfall", skyTint: 0xc18a6a, lightDim: 0.22, fogBoost: 0.012, rain: 0, ash: 1, wind: 0.65 },
  "ember-haze": { name: "Ember Haze", skyTint: 0xe08b55, lightDim: 0.12, fogBoost: 0.009, rain: 0, ash: 0.55, wind: 0.45 },
  "sea-mist": { name: "Sea Mist", skyTint: 0xb8d2d8, lightDim: 0.16, fogBoost: 0.01, rain: 0.12, wind: 0.55 },
  "storm-haze": { name: "Storm Haze", skyTint: 0x9fb5c2, lightDim: 0.24, fogBoost: 0.013, rain: 0.28, wind: 0.8 },
  "veiled-mist": { name: "Veiled Mist", skyTint: 0xbfd8bf, lightDim: 0.15, fogBoost: 0.017, rain: 0.04, glow: 0.8 },
  "leaf-rain": { name: "Leaf Rain", skyTint: 0xcad8bd, lightDim: 0.18, fogBoost: 0.009, rain: 0.18, glow: 0.4 },
};

export class WeatherSystem {
  constructor(scene, world, ui = {}) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.types = SETTINGS.weather.types;
    this.current = "clear";
    this.target = "clear";
    this.blend = 1;
    this.timer = SETTINGS.weather.changeInterval * 0.55;
    this.particleOpacityMultiplier = 1;
    this.activeParticleCount = 180;
    this.regionCheckTimer = 0;
    this.cachedRegion = null;
    this.rain = this.createRain();
    this.frostTypes = ["snowfall", "icy-fog", "mountain-wind"];
    this.mistTypes = ["mistwood-mist", "fog", "cloudy"];
    this.marshTypes = ["blackwater-fog", "fog", "light-rain"];
    this.canyonTypes = ["canyon-dust", "clear", "cloudy"];
    this.ashenTypes = ["ashfall", "ember-haze", "cloudy"];
    this.shatteredTypes = ["sea-mist", "storm-haze", "cloudy"];
    this.veiledTypes = ["veiled-mist", "leaf-rain", "cloudy"];
    this.updateUi();
  }

  createRain() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    for (let index = 0; index < 180; index += 1) {
      positions.push((Math.random() - 0.5) * 90, 10 + Math.random() * 32, (Math.random() - 0.5) * 90);
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xb9d8ff,
      size: 0.08,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    return points;
  }

  setQuality(preset = null) {
    this.activeParticleCount = Math.max(45, Math.min(180, preset?.weatherParticles ?? 180));
    this.particleOpacityMultiplier = preset?.particleMultiplier ?? 1;
    this.rain?.geometry?.setDrawRange(0, this.activeParticleCount);
  }

  update(deltaSeconds, player) {
    this.timer -= deltaSeconds;
    if (this.timer <= 0) {
      this.pickNextWeather();
    }

    if (this.current !== this.target) {
      this.blend = Math.min(1, this.blend + deltaSeconds * SETTINGS.weather.transitionSpeed);
      if (this.blend >= 1) {
        this.current = this.target;
        this.updateUi();
      }
    }

    const profile = this.getActiveProfile();
    this.world.applyWeather?.(profile);
    this.updateRain(deltaSeconds, player, profile.rain);
  }

  pickNextWeather() {
    const activeTypes = this.inFrostpeak ? this.frostTypes : this.inMistwood ? this.mistTypes : this.inBlackwater ? this.marshTypes : this.inCanyon ? this.canyonTypes : this.inAshen ? this.ashenTypes : this.inShatteredCoast ? this.shatteredTypes : this.inVeiledWilds ? this.veiledTypes : this.types;
    const index = activeTypes.indexOf(this.target);
    this.target = activeTypes[(Math.max(0, index) + 1) % activeTypes.length];
    this.blend = 0;
    this.timer = SETTINGS.weather.changeInterval;
    this.updateUi();
    window.dispatchEvent(new CustomEvent("echo-archer:weather-state", {
      detail: { weather: this.target },
    }));
  }

  getActiveProfile() {
    const from = WEATHER_PROFILES[this.current];
    const to = WEATHER_PROFILES[this.target];
    const mix = this.blend;
    return {
      name: mix < 1 ? to.name : from.name,
      skyTint: to.skyTint,
      lightDim: THREE.MathUtils.lerp(from.lightDim, to.lightDim, mix),
      fogBoost: THREE.MathUtils.lerp(from.fogBoost, to.fogBoost, mix),
      rain: THREE.MathUtils.lerp(from.rain, to.rain, mix),
      snow: THREE.MathUtils.lerp(from.snow ?? 0, to.snow ?? 0, mix),
      ash: THREE.MathUtils.lerp(from.ash ?? 0, to.ash ?? 0, mix),
      wind: THREE.MathUtils.lerp(from.wind ?? 0, to.wind ?? 0, mix),
    };
  }

  updateRain(deltaSeconds, player, amount) {
    this.regionCheckTimer -= deltaSeconds;
    if (this.regionCheckTimer <= 0) {
      this.cachedRegion = this.world.getRegionAt?.(player.group.position);
      this.regionCheckTimer = 0.45;
      const ambientRegion = this.cachedRegion?.id ?? this.cachedRegion?.name ?? "forest";
      if (ambientRegion !== this.ambientRegion) {
        this.ambientRegion = ambientRegion;
        window.dispatchEvent(new CustomEvent("echo-archer:ambient-region", {
          detail: { region: ambientRegion },
        }));
      }
    }
    const region = this.cachedRegion;
    const nowFrostpeak = region?.id?.includes("frost") || region?.id === "summit-overlook" || region?.id === "icefall-cavern";
    const nowMistwood = region?.id?.includes("mistwood") || ["elder-tree", "moonlit-clearing", "forgotten-shrine", "rootfall-hollow", "echo-grove"].includes(region?.id);
    const nowBlackwater = region?.id?.includes("blackwater") || ["sunken-shrine", "mosswatch-tower", "crooked-boardwalk", "drowned-ruins", "witchlight-grove"].includes(region?.id);
    const nowCanyon = region?.id?.includes("red-canyon") || ["skybridge-crossing", "crimson-arch", "forgotten-outpost", "sunspire-plateau", "echo-chasm"].includes(region?.id);
    const nowAshen = region?.id?.includes("ashen-highlands") || ["ember-peak", "obsidian-citadel", "ashfall-basin", "firewatch-spire", "molten-hollow"].includes(region?.id);
    const nowShatteredCoast = region?.id?.includes("shattered-coast") || ["stormwatch-fortress", "broken-beacon", "tidefall-caverns", "kings-sea-gate", "wreckers-point", "drowned-citadel"].includes(region?.id);
    const nowVeiledWilds = region?.id?.includes("veiled-wilds") || ["worldroot-grove", "hidden-lake", "greenheart-ruins", "sleeping-arch", "mistveil-hollow", "forgotten-circle-wilds"].includes(region?.id);
    if (nowFrostpeak !== this.inFrostpeak) {
      this.inFrostpeak = nowFrostpeak;
      if (nowFrostpeak && !this.frostTypes.includes(this.target)) {
        this.target = "snowfall";
        this.blend = 0;
        this.updateUi();
      }
    }
    if (nowMistwood !== this.inMistwood) {
      this.inMistwood = nowMistwood;
      if (nowMistwood && !this.mistTypes.includes(this.target)) {
        this.target = "mistwood-mist";
        this.blend = 0;
        this.updateUi();
        window.dispatchEvent(new CustomEvent("echo-archer:weather-state", {
          detail: { weather: this.target },
        }));
      }
    }
    if (nowBlackwater !== this.inBlackwater) {
      this.inBlackwater = nowBlackwater;
      if (nowBlackwater && !this.marshTypes.includes(this.target)) {
        this.target = "blackwater-fog";
        this.blend = 0;
        this.updateUi();
        window.dispatchEvent(new CustomEvent("echo-archer:weather-state", {
          detail: { weather: this.target },
        }));
      }
    }
    if (nowCanyon !== this.inCanyon) {
      this.inCanyon = nowCanyon;
      if (nowCanyon && !this.canyonTypes.includes(this.target)) {
        this.target = "canyon-dust";
        this.blend = 0;
        this.updateUi();
        window.dispatchEvent(new CustomEvent("echo-archer:weather-state", {
          detail: { weather: this.target },
        }));
      }
    }
    if (nowAshen !== this.inAshen) {
      this.inAshen = nowAshen;
      if (nowAshen && !this.ashenTypes.includes(this.target)) {
        this.target = "ashfall";
        this.blend = 0;
        this.updateUi();
        window.dispatchEvent(new CustomEvent("echo-archer:weather-state", {
          detail: { weather: this.target },
        }));
      }
    }
    if (nowShatteredCoast !== this.inShatteredCoast) {
      this.inShatteredCoast = nowShatteredCoast;
      if (nowShatteredCoast && !this.shatteredTypes.includes(this.target)) {
        this.target = "sea-mist";
        this.blend = 0;
        this.updateUi();
        window.dispatchEvent(new CustomEvent("echo-archer:weather-state", {
          detail: { weather: this.target },
        }));
      }
    }
    if (nowVeiledWilds !== this.inVeiledWilds) {
      this.inVeiledWilds = nowVeiledWilds;
      if (nowVeiledWilds && !this.veiledTypes.includes(this.target)) {
        this.target = "veiled-mist";
        this.blend = 0;
        this.updateUi();
        window.dispatchEvent(new CustomEvent("echo-archer:weather-state", {
          detail: { weather: this.target },
        }));
      }
    }
    const profile = WEATHER_PROFILES[this.target] ?? WEATHER_PROFILES.clear;
    const snowAmount = profile.snow ?? 0;
    const ashAmount = profile.ash ?? 0;
    this.rain.material.opacity = Math.max(amount * 0.42, snowAmount * 0.5, ashAmount * 0.34) * this.particleOpacityMultiplier;
    this.rain.material.color.setHex(ashAmount > 0.1 ? 0x6a5c55 : snowAmount > 0.1 ? 0xf2fbff : 0xb9d8ff);
    this.rain.material.size = ashAmount > 0.1 ? 0.105 : snowAmount > 0.1 ? 0.13 : 0.08;
    if (amount <= 0.01 && snowAmount <= 0.01 && ashAmount <= 0.01) {
      return;
    }
    this.rain.position.set(player.group.position.x, 0, player.group.position.z);
    const position = this.rain.geometry.attributes.position;
    const activeCount = Math.min(this.activeParticleCount, position.count);
    for (let index = 0; index < activeCount; index += 1) {
      let x = position.getX(index) + (profile.wind ?? 0) * deltaSeconds * 7;
      let y = position.getY(index) - deltaSeconds * (ashAmount > 0.1 ? 3.8 : snowAmount > 0.1 ? 5.5 : 18);
      if (y < 2) y = 38;
      if (x > 45) x = -45;
      position.setX(index, x);
      position.setY(index, y);
    }
    position.needsUpdate = true;
  }

  updateUi() {
    if (this.ui.label) {
      this.ui.label.textContent = WEATHER_PROFILES[this.target]?.name ?? "Clear";
    }
  }
}
