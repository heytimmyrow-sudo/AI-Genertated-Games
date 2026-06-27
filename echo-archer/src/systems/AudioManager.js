const AUDIO_UNLOCK_EVENTS = ["pointerdown", "keydown"];

export class AudioManager {
  constructor(ui = {}) {
    this.ui = ui;
    this.context = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.bossGain = null;
    this.caveGain = null;
    this.weatherGain = null;
    this.ambientGain = null;
    this.bossDrone = null;
    this.caveDrone = null;
    this.weatherDrone = null;
    this.ambientDrone = null;
    this.currentAmbient = "forest";
    this.currentMusicProfile = "forest";
    this.ambientPulseTimer = 2.5;
    this.musicNodes = [];
    this.musicStarted = false;
    this.muted = localStorage.getItem("echo-archer-muted") === "true";
    this.volume = Number(localStorage.getItem("echo-archer-volume") ?? 0.55);
    this.gameplayPaused = false;

    this.handleSoundEvent = this.handleSoundEvent.bind(this);
    this.handleMusicState = this.handleMusicState.bind(this);
    this.handleCaveState = this.handleCaveState.bind(this);
    this.handleWeatherState = this.handleWeatherState.bind(this);
    this.handleAmbientRegion = this.handleAmbientRegion.bind(this);
    this.unlock = this.unlock.bind(this);
    window.addEventListener("echo-archer:sound", this.handleSoundEvent);
    window.addEventListener("echo-archer:music-state", this.handleMusicState);
    window.addEventListener("echo-archer:cave-state", this.handleCaveState);
    window.addEventListener("echo-archer:weather-state", this.handleWeatherState);
    window.addEventListener("echo-archer:ambient-region", this.handleAmbientRegion);
    AUDIO_UNLOCK_EVENTS.forEach((eventName) => window.addEventListener(eventName, this.unlock, { once: true }));
    this.bindUi();
    this.syncUi();
  }

  bindUi() {
    this.ui.mute?.addEventListener("click", (event) => {
      event.preventDefault();
      this.unlock();
      this.setMuted(!this.muted);
      this.playSound("uiClick", 0.7, { allowDuringMenu: true });
    });

    this.ui.volume?.addEventListener("input", () => {
      this.unlock();
      this.setVolume(Number(this.ui.volume.value));
    });
  }

  unlock() {
    if (!this.context) {
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.musicGain = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.bossGain = this.context.createGain();
      this.caveGain = this.context.createGain();
      this.weatherGain = this.context.createGain();
      this.ambientGain = this.context.createGain();
      this.musicGain.gain.value = 0.15;
      this.bossGain.gain.value = 0;
      this.caveGain.gain.value = 0;
      this.weatherGain.gain.value = 0;
      this.ambientGain.gain.value = 0;
      this.sfxGain.gain.value = 0.68;
      this.musicGain.connect(this.masterGain);
      this.bossGain.connect(this.masterGain);
      this.caveGain.connect(this.masterGain);
      this.weatherGain.connect(this.masterGain);
      this.ambientGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);
      this.applyMasterVolume();
      this.setRegionalAmbience(this.currentAmbient);
    }

    if (this.context.state === "suspended") {
      this.context.resume();
    }

    if (!this.musicStarted) {
      this.startMusic();
    }
  }

  setGameplayPaused(paused) {
    this.gameplayPaused = paused;
    if (this.musicGain) {
      const profile = this.getMusicProfile(this.currentMusicProfile);
      this.musicGain.gain.setTargetAtTime(paused ? 0.075 : profile.gain, this.context.currentTime, 0.28);
    }
  }

  update(deltaSeconds) {
    if (!this.context || this.muted || this.gameplayPaused) {
      return;
    }

    this.ambientPulseTimer -= deltaSeconds;
    if (this.ambientPulseTimer > 0) {
      return;
    }

    this.ambientPulseTimer = 5.5 + Math.random() * 5.5;
    this.playAmbientPulse();
  }

  setMuted(muted) {
    this.muted = muted;
    localStorage.setItem("echo-archer-muted", String(muted));
    this.applyMasterVolume();
    this.syncUi();
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem("echo-archer-volume", String(this.volume));
    this.applyMasterVolume();
    this.syncUi();
  }

  applyMasterVolume() {
    if (!this.masterGain) {
      return;
    }

    this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.context.currentTime, 0.04);
  }

  syncUi() {
    if (this.ui.mute) {
      this.ui.mute.textContent = this.muted ? "Unmute" : "Mute";
      this.ui.mute.setAttribute("aria-pressed", String(!this.muted));
    }
    if (this.ui.volume) {
      this.ui.volume.value = String(this.volume);
    }
  }

  handleSoundEvent(event) {
    const { name, intensity = 1 } = event.detail ?? {};
    this.playSound(name, intensity);
  }

  handleMusicState(event) {
    this.setBossMusic(Boolean(event.detail?.boss));
  }

  handleCaveState(event) {
    this.setCaveAmbience(Boolean(event.detail?.active));
  }

  handleWeatherState(event) {
    this.setWeatherAmbience(event.detail?.weather ?? "clear");
  }

  handleAmbientRegion(event) {
    this.setRegionalAmbience(event.detail?.region ?? event.detail?.id ?? "forest");
  }

  playSound(name, intensity = 1, options = {}) {
    if (this.gameplayPaused && !options.allowDuringMenu && !["uiClick", "questComplete"].includes(name)) {
      return;
    }

    this.unlock();
    if (!this.context || this.muted) {
      return;
    }

    const sounds = {
      bowDraw: () => this.playBowDraw(intensity),
      bowRelease: () => this.playArrowRelease(intensity),
      arrowHit: () => this.playWoodHit(intensity),
      bullseyeHit: () => this.playBullseyeHit(intensity),
      caveArrowHit: () => this.playCaveArrowHit(intensity),
      enemyHit: () => this.playEnemyHit(intensity),
      weakpointHit: () => this.playWeakpointHit(intensity),
      enemyDefeat: () => this.playEnemyDefeat(intensity),
      arrowFlyby: () => this.playArrowFlyby(intensity),
      bossNotice: () => this.playBossNotice(intensity),
      bossCharge: () => this.playBossCharge(intensity),
      bossDefeat: () => this.playBossDefeat(intensity),
      powerfulHit: () => this.playThump(intensity),
      questComplete: () => this.playQuestComplete(intensity),
      uiClick: () => this.playUiClick(intensity),
      caveGateOpen: () => this.playCaveGateOpen(intensity),
    };

    sounds[name]?.();
  }

  startMusic() {
    if (!this.context || this.musicStarted) {
      return;
    }

    this.musicStarted = true;
    const now = this.context.currentTime;
    const profile = this.getMusicProfile(this.currentMusicProfile);
    const root = profile.root;
    const notes = profile.steps;

    notes.forEach((step, index) => {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = profile.voice;
      oscillator.frequency.value = root * Math.pow(2, step / 12);
      gain.gain.value = 0;
      oscillator.connect(gain).connect(this.musicGain);
      oscillator.start(now + index * 0.35);
      this.musicNodes.push({ oscillator, gain, step, index, role: "melody" });
    });

    const pad = this.context.createOscillator();
    const padGain = this.context.createGain();
    pad.type = profile.padVoice;
    pad.frequency.value = profile.root * 0.5;
    padGain.gain.value = profile.padGain;
    pad.connect(padGain).connect(this.musicGain);
    pad.start(now);
    this.musicNodes.push({ oscillator: pad, gain: padGain, step: -12, index: -1, role: "pad" });
    this.musicGain.gain.setTargetAtTime(profile.gain, now, 0.35);
    this.scheduleMusicLoop();
  }

  setMusicProfile(profileKey) {
    this.currentMusicProfile = profileKey;
    if (!this.context || !this.musicStarted) {
      return;
    }

    const profile = this.getMusicProfile(profileKey);
    const now = this.context.currentTime;
    this.musicGain.gain.setTargetAtTime(this.gameplayPaused ? 0.075 : profile.gain, now, 0.75);
    this.musicNodes.forEach((node) => {
      if (node.role === "pad") {
        node.oscillator.type = profile.padVoice;
        node.oscillator.frequency.setTargetAtTime(profile.root * 0.5, now, 0.9);
        node.gain.gain.setTargetAtTime(profile.padGain, now, 0.75);
        return;
      }
      const step = profile.steps[node.index % profile.steps.length] ?? node.step;
      node.step = step;
      node.oscillator.type = profile.voice;
      node.oscillator.frequency.setTargetAtTime(profile.root * Math.pow(2, step / 12), now, 0.8);
    });
  }

  setBossMusic(active) {
    this.unlock();
    if (!this.context || !this.bossGain) {
      return;
    }

    if (active && !this.bossDrone) {
      const oscillator = this.context.createOscillator();
      const pulse = this.context.createOscillator();
      const pulseGain = this.context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = 73.42;
      pulse.type = "sine";
      pulse.frequency.value = 1.2;
      pulseGain.gain.value = 0.018;
      pulse.connect(pulseGain).connect(this.bossGain.gain);
      oscillator.connect(this.bossGain);
      oscillator.start();
      pulse.start();
      this.bossDrone = { oscillator, pulse };
    }

    const profile = this.getMusicProfile(this.currentMusicProfile);
    this.musicGain.gain.setTargetAtTime(active ? 0.085 : profile.gain, this.context.currentTime, 0.45);
    this.bossGain.gain.setTargetAtTime(active ? 0.07 : 0, this.context.currentTime, 0.3);
  }

  setCaveAmbience(active) {
    this.unlock();
    if (!this.context || !this.caveGain) {
      return;
    }

    if (active && !this.caveDrone) {
      const low = this.context.createOscillator();
      const shimmer = this.context.createOscillator();
      const shimmerGain = this.context.createGain();
      low.type = "sine";
      low.frequency.value = 82.41;
      shimmer.type = "triangle";
      shimmer.frequency.value = 246.94;
      shimmerGain.gain.value = 0.012;
      low.connect(this.caveGain);
      shimmer.connect(shimmerGain).connect(this.caveGain);
      low.start();
      shimmer.start();
      this.caveDrone = { low, shimmer, shimmerGain };
    }

    const profile = this.getMusicProfile(this.currentMusicProfile);
    this.musicGain?.gain.setTargetAtTime(active ? 0.1 : profile.gain, this.context.currentTime, 0.55);
    this.caveGain.gain.setTargetAtTime(active ? 0.046 : 0, this.context.currentTime, 0.45);
  }

  setWeatherAmbience(weather) {
    this.unlock();
    if (!this.context || !this.weatherGain) {
      return;
    }

    if (!this.weatherDrone) {
      const source = this.context.createBufferSource();
      const duration = 2;
      const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) {
        data[index] = (Math.random() * 2 - 1) * 0.18;
      }
      const filter = this.context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 720;
      source.buffer = buffer;
      source.loop = true;
      source.connect(filter).connect(this.weatherGain);
      source.start();
      this.weatherDrone = { source, filter };
    }

    const profile = this.getWeatherAudioProfile(weather);
    this.weatherDrone.filter.frequency.setTargetAtTime(profile.frequency, this.context.currentTime, 0.6);
    this.weatherDrone.filter.Q.setTargetAtTime(profile.q, this.context.currentTime, 0.6);
    const target = profile.gain;
    this.weatherGain.gain.setTargetAtTime(target, this.context.currentTime, 0.5);
  }

  setRegionalAmbience(region) {
    this.currentAmbient = this.getAmbientKey(region);
    this.setMusicProfile(this.currentAmbient);
    if (!this.context || !this.ambientGain) {
      return;
    }

    if (!this.ambientDrone) {
      const source = this.context.createBufferSource();
      const duration = 3;
      const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) {
        const flutter = Math.sin(index * 0.013) * 0.04;
        data[index] = ((Math.random() * 2 - 1) * 0.12 + flutter) * (0.8 + Math.random() * 0.2);
      }
      const filter = this.context.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 900;
      filter.Q.value = 0.55;
      source.buffer = buffer;
      source.loop = true;
      source.connect(filter).connect(this.ambientGain);
      source.start();
      this.ambientDrone = { source, filter };
    }

    const profile = this.getAmbientProfile(this.currentAmbient);

    this.ambientDrone.filter.frequency.setTargetAtTime(profile.frequency, this.context.currentTime, 0.8);
    this.ambientDrone.filter.Q.setTargetAtTime(profile.q, this.context.currentTime, 0.8);
    this.ambientGain.gain.setTargetAtTime(profile.gain, this.context.currentTime, 0.9);
  }

  getAmbientKey(region = "") {
    const value = String(region).toLowerCase();
    if (value.includes("cave") || value.includes("hollow") || value.includes("cavern")) return "cave";
    if (value.includes("village") || value.includes("guild") || value.includes("inn") || value.includes("market") || value.includes("lodge")) return "village";
    if (value.includes("fortress") || value.includes("hall-of-arrows") || value.includes("mountain-fortress")) return "fortress";
    if (value.includes("coast") || value.includes("sea") || value.includes("harbor") || value.includes("shattered") || value.includes("beacon") || value.includes("tide")) return "coast";
    if (value.includes("marsh") || value.includes("blackwater") || value.includes("sunken") || value.includes("mire")) return "marsh";
    if (value.includes("frost") || value.includes("mountain") || value.includes("summit") || value.includes("ice")) return "mountain";
    if (value.includes("mistwood") || value.includes("veiled") || value.includes("grove") || value.includes("worldroot")) return "mistwood";
    if (value.includes("canyon") || value.includes("chasm") || value.includes("plateau") || value.includes("skybridge")) return "canyon";
    if (value.includes("ashen") || value.includes("ember") || value.includes("molten") || value.includes("ash")) return "ashen";
    if (value.includes("frontier") || value.includes("plains") || value.includes("greenwater")) return "frontier";
    if (value.includes("kingdom") || value.includes("archive") || value.includes("temple") || value.includes("ruins") || value.includes("sentinel")) return "ruins";
    if (value.includes("celestial") || value.includes("star") || value.includes("sky") || value.includes("crystal")) return "celestial";
    if (value.includes("pond") || value.includes("lake") || value.includes("river")) return "water";
    return "forest";
  }

  getAmbientProfile(key) {
    return {
      forest: { gain: 0.019, frequency: 1520, q: 0.52 },
      water: { gain: 0.024, frequency: 620, q: 0.46 },
      village: { gain: 0.026, frequency: 780, q: 0.72 },
      fortress: { gain: 0.021, frequency: 520, q: 0.85 },
      coast: { gain: 0.032, frequency: 390, q: 0.44 },
      marsh: { gain: 0.028, frequency: 500, q: 0.95 },
      mountain: { gain: 0.024, frequency: 340, q: 0.54 },
      mistwood: { gain: 0.023, frequency: 1180, q: 0.9 },
      canyon: { gain: 0.024, frequency: 460, q: 0.42 },
      cave: { gain: 0.02, frequency: 245, q: 0.7 },
      ashen: { gain: 0.027, frequency: 280, q: 0.86 },
      frontier: { gain: 0.021, frequency: 980, q: 0.5 },
      ruins: { gain: 0.02, frequency: 700, q: 0.92 },
      celestial: { gain: 0.022, frequency: 1240, q: 1.16 },
    }[key] ?? { gain: 0.019, frequency: 900, q: 0.6 };
  }

  getWeatherAudioProfile(weather = "clear") {
    const value = String(weather).toLowerCase();
    if (value.includes("rain")) return { gain: 0.034, frequency: 850, q: 0.72 };
    if (value.includes("snow") || value.includes("icy")) return { gain: 0.024, frequency: 1120, q: 0.62 };
    if (value.includes("sea")) return { gain: 0.03, frequency: 420, q: 0.5 };
    if (value.includes("dust") || value.includes("wind")) return { gain: 0.026, frequency: 360, q: 0.58 };
    if (value.includes("ash")) return { gain: 0.03, frequency: 260, q: 0.82 };
    if (value.includes("blackwater") || value.includes("fog") || value.includes("mist") || value.includes("veiled")) return { gain: 0.018, frequency: 540, q: 0.9 };
    return { gain: 0, frequency: 720, q: 0.8 };
  }

  getMusicProfile(key) {
    return {
      forest: { root: 196, steps: [0, 7, 12, 7, 3, 10, 12, 15], voice: "sine", padVoice: "triangle", gain: 0.15, padGain: 0.034, peak: 0.052, loopLength: 6.4 },
      water: { root: 174.61, steps: [0, 5, 9, 12, 14, 9, 5, 2], voice: "sine", padVoice: "sine", gain: 0.14, padGain: 0.03, peak: 0.046, loopLength: 7.2 },
      village: { root: 220, steps: [0, 4, 7, 12, 11, 7, 4, 2], voice: "triangle", padVoice: "sine", gain: 0.165, padGain: 0.038, peak: 0.058, loopLength: 6.8 },
      fortress: { root: 146.83, steps: [0, 7, 12, 14, 12, 7, 5, 0], voice: "triangle", padVoice: "triangle", gain: 0.155, padGain: 0.044, peak: 0.052, loopLength: 7.6 },
      coast: { root: 185, steps: [0, 5, 12, 17, 14, 12, 7, 5], voice: "sine", padVoice: "triangle", gain: 0.15, padGain: 0.033, peak: 0.05, loopLength: 7.4 },
      marsh: { root: 164.81, steps: [0, 3, 7, 10, 7, 3, -2, 0], voice: "triangle", padVoice: "sine", gain: 0.138, padGain: 0.034, peak: 0.044, loopLength: 7.8 },
      mountain: { root: 130.81, steps: [0, 7, 12, 19, 17, 12, 7, 5], voice: "sine", padVoice: "triangle", gain: 0.145, padGain: 0.04, peak: 0.048, loopLength: 8 },
      mistwood: { root: 207.65, steps: [0, 2, 7, 12, 14, 12, 7, 2], voice: "sine", padVoice: "sine", gain: 0.14, padGain: 0.032, peak: 0.044, loopLength: 7.5 },
      canyon: { root: 174.61, steps: [0, 7, 10, 14, 17, 14, 10, 7], voice: "triangle", padVoice: "triangle", gain: 0.148, padGain: 0.036, peak: 0.052, loopLength: 7 },
      cave: { root: 110, steps: [0, 5, 7, 10, 7, 5, 0, -2], voice: "sine", padVoice: "sine", gain: 0.12, padGain: 0.046, peak: 0.036, loopLength: 8.2 },
      ashen: { root: 123.47, steps: [0, 3, 7, 12, 10, 7, 3, -2], voice: "triangle", padVoice: "sawtooth", gain: 0.14, padGain: 0.03, peak: 0.046, loopLength: 7.1 },
      frontier: { root: 196, steps: [0, 4, 9, 12, 16, 12, 9, 4], voice: "sine", padVoice: "triangle", gain: 0.15, padGain: 0.034, peak: 0.05, loopLength: 6.9 },
      ruins: { root: 146.83, steps: [0, 5, 8, 12, 15, 12, 8, 5], voice: "triangle", padVoice: "sine", gain: 0.135, padGain: 0.038, peak: 0.042, loopLength: 8 },
      celestial: { root: 246.94, steps: [0, 7, 11, 14, 19, 14, 11, 7], voice: "sine", padVoice: "sine", gain: 0.142, padGain: 0.036, peak: 0.046, loopLength: 8.4 },
    }[key] ?? { root: 196, steps: [0, 7, 12, 7, 3, 10, 12, 15], voice: "sine", padVoice: "triangle", gain: 0.15, padGain: 0.034, peak: 0.052, loopLength: 6.4 };
  }

  playAmbientPulse() {
    const profile = {
      forest: () => {
        this.tone({ frequency: 1180 + Math.random() * 360, endFrequency: 1380 + Math.random() * 320, type: "sine", duration: 0.09, gain: 0.006, destination: this.ambientGain });
        if (Math.random() > 0.55) {
          window.setTimeout(() => this.tone({ frequency: 980, endFrequency: 1280, type: "sine", duration: 0.08, gain: 0.0045, destination: this.ambientGain }), 160);
        }
      },
      water: () => {
        this.noise({ duration: 0.42, gain: 0.0065, filter: 520, destination: this.ambientGain });
        this.tone({ frequency: 320, endFrequency: 250, type: "sine", duration: 0.24, gain: 0.0035, destination: this.ambientGain });
      },
      village: () => {
        this.tone({ frequency: 520, endFrequency: 420, type: "triangle", duration: 0.08, gain: 0.0055, destination: this.ambientGain });
        this.noise({ duration: 0.045, gain: 0.0038, filter: 920, destination: this.ambientGain });
        if (Math.random() > 0.5) {
          window.setTimeout(() => this.tone({ frequency: 330, endFrequency: 370, type: "triangle", duration: 0.06, gain: 0.0035, destination: this.ambientGain }), 180);
        }
      },
      fortress: () => {
        this.tone({ frequency: 196, endFrequency: 146, type: "triangle", duration: 0.24, gain: 0.0045, destination: this.ambientGain });
        this.noise({ duration: 0.08, gain: 0.0038, filter: 620, destination: this.ambientGain });
      },
      coast: () => {
        this.noise({ duration: 0.55, gain: 0.008, filter: 360, destination: this.ambientGain });
        this.tone({ frequency: 260, endFrequency: 180, type: "sine", duration: 0.38, gain: 0.0038, destination: this.ambientGain });
      },
      marsh: () => {
        this.tone({ frequency: 130 + Math.random() * 35, endFrequency: 92, type: "sine", duration: 0.16, gain: 0.007, destination: this.ambientGain });
        window.setTimeout(() => this.tone({ frequency: 112, endFrequency: 84, type: "sine", duration: 0.12, gain: 0.0045, destination: this.ambientGain }), 120);
      },
      mountain: () => {
        this.noise({ duration: 0.5, gain: 0.006, filter: 520, destination: this.ambientGain });
      },
      mistwood: () => {
        this.tone({ frequency: 920 + Math.random() * 260, endFrequency: 1240 + Math.random() * 180, type: "sine", duration: 0.16, gain: 0.005, destination: this.ambientGain });
        window.setTimeout(() => this.tone({ frequency: 620, endFrequency: 820, type: "sine", duration: 0.12, gain: 0.0032, destination: this.ambientGain }), 190);
      },
      canyon: () => {
        this.noise({ duration: 0.4, gain: 0.0064, filter: 420, destination: this.ambientGain });
        this.tone({ frequency: 180, endFrequency: 118, type: "sine", duration: 0.28, gain: 0.0034, destination: this.ambientGain });
      },
      cave: () => {
        this.tone({ frequency: 210, endFrequency: 158, type: "sine", duration: 0.5, gain: 0.0045, destination: this.ambientGain });
      },
      ashen: () => {
        this.noise({ duration: 0.22, gain: 0.006, filter: 260, destination: this.ambientGain });
        this.tone({ frequency: 86, endFrequency: 64, type: "triangle", duration: 0.28, gain: 0.0045, destination: this.ambientGain });
      },
      frontier: () => {
        this.noise({ duration: 0.32, gain: 0.0045, filter: 760, destination: this.ambientGain });
        this.tone({ frequency: 560 + Math.random() * 120, endFrequency: 640, type: "sine", duration: 0.1, gain: 0.0036, destination: this.ambientGain });
      },
      ruins: () => {
        this.tone({ frequency: 246, endFrequency: 185, type: "sine", duration: 0.32, gain: 0.0042, destination: this.ambientGain });
        window.setTimeout(() => this.tone({ frequency: 370, endFrequency: 277, type: "triangle", duration: 0.2, gain: 0.0028, destination: this.ambientGain }), 170);
      },
      celestial: () => {
        [0, 7].forEach((step, index) => {
          window.setTimeout(() => this.tone({
            frequency: 740 * Math.pow(2, step / 12),
            endFrequency: 740 * Math.pow(2, step / 12),
            type: "sine",
            duration: 0.18,
            gain: 0.0048,
            destination: this.ambientGain,
          }), index * 140);
        });
      },
    }[this.currentAmbient];

    profile?.();
  }

  scheduleMusicLoop() {
    if (!this.context || !this.musicStarted) {
      return;
    }

    const now = this.context.currentTime;
    const profile = this.getMusicProfile(this.currentMusicProfile);
    const loopLength = profile.loopLength;
    this.musicNodes.forEach((node) => {
      if (node.index < 0) {
        return;
      }
      for (let cycle = 0; cycle < 4; cycle += 1) {
        const start = now + cycle * loopLength + node.index * (loopLength / Math.max(1, profile.steps.length + 2));
        node.gain.gain.setValueAtTime(0, start);
        node.gain.gain.linearRampToValueAtTime(profile.peak, start + 0.2);
        node.gain.gain.exponentialRampToValueAtTime(0.001, start + 1.55);
      }
    });
    window.setTimeout(() => this.scheduleMusicLoop(), loopLength * 2800);
  }

  playBowDraw(intensity) {
    this.tone({ frequency: 138, endFrequency: 284 + intensity * 58, type: "sawtooth", duration: 0.22, gain: 0.026 * intensity, destination: this.sfxGain });
    this.tone({ frequency: 84, endFrequency: 126 + intensity * 22, type: "triangle", duration: 0.2, gain: 0.012 * intensity, destination: this.sfxGain });
    this.noise({ duration: 0.18, gain: 0.021 * intensity, filter: 1120 });
  }

  playArrowRelease(intensity) {
    this.tone({ frequency: 660, endFrequency: 112, type: "triangle", duration: 0.16, gain: 0.118 * intensity, destination: this.sfxGain });
    this.tone({ frequency: 210, endFrequency: 66, type: "sine", duration: 0.15, gain: 0.036 * intensity, destination: this.sfxGain });
    this.noise({ duration: 0.12, gain: 0.047 * intensity, filter: 2700 });
  }

  playWoodHit(intensity) {
    this.tone({ frequency: 142, endFrequency: 78, type: "triangle", duration: 0.14, gain: 0.096 * intensity, destination: this.sfxGain });
    this.noise({ duration: 0.09, gain: 0.046 * intensity, filter: 760 });
  }

  playBullseyeHit(intensity) {
    this.playWoodHit(intensity * 0.82);
    [0, 7, 12].forEach((step, index) => {
      window.setTimeout(() => {
        this.tone({
          frequency: 520 * Math.pow(2, step / 12),
          endFrequency: 520 * Math.pow(2, step / 12),
          type: "sine",
          duration: 0.11,
          gain: 0.042 * intensity,
          destination: this.sfxGain,
        });
      }, index * 42);
    });
  }

  playCaveArrowHit(intensity) {
    this.playWoodHit(intensity * 0.72);
    window.setTimeout(() => this.tone({ frequency: 220, endFrequency: 164, type: "sine", duration: 0.16, gain: 0.035 * intensity, destination: this.sfxGain }), 65);
    window.setTimeout(() => this.tone({ frequency: 164, endFrequency: 110, type: "triangle", duration: 0.2, gain: 0.024 * intensity, destination: this.sfxGain }), 140);
  }

  playEnemyHit(intensity) {
    this.tone({ frequency: 196, endFrequency: 70, type: "sawtooth", duration: 0.18, gain: 0.088 * intensity, destination: this.sfxGain });
    this.tone({ frequency: 98, endFrequency: 52, type: "triangle", duration: 0.13, gain: 0.032 * intensity, destination: this.sfxGain });
    this.noise({ duration: 0.085, gain: 0.034 * intensity, filter: 640 });
  }

  playWeakpointHit(intensity) {
    this.playEnemyHit(intensity * 0.75);
    this.tone({ frequency: 720, endFrequency: 1080, type: "sine", duration: 0.12, gain: 0.058 * intensity, destination: this.sfxGain });
    window.setTimeout(() => this.tone({ frequency: 1080, endFrequency: 1440, type: "triangle", duration: 0.1, gain: 0.04 * intensity, destination: this.sfxGain }), 55);
  }

  playArrowFlyby(intensity) {
    this.noise({ duration: 0.18, gain: 0.03 * intensity, filter: 3100 });
    this.tone({ frequency: 820, endFrequency: 190, type: "triangle", duration: 0.14, gain: 0.038 * intensity, destination: this.sfxGain });
  }

  playEnemyDefeat(intensity) {
    this.tone({ frequency: 245, endFrequency: 62, type: "triangle", duration: 0.46, gain: 0.108 * intensity, destination: this.sfxGain });
    this.noise({ duration: 0.22, gain: 0.046 * intensity, filter: 430 });
  }

  playBossNotice(intensity) {
    this.tone({ frequency: 92, endFrequency: 155, type: "sawtooth", duration: 0.34, gain: 0.096 * intensity, destination: this.sfxGain });
    this.noise({ duration: 0.24, gain: 0.064 * intensity, filter: 340 });
  }

  playBossCharge(intensity) {
    this.tone({ frequency: 132, endFrequency: 52, type: "triangle", duration: 0.3, gain: 0.112 * intensity, destination: this.sfxGain });
    this.noise({ duration: 0.25, gain: 0.07 * intensity, filter: 460 });
  }

  playBossDefeat(intensity) {
    this.tone({ frequency: 165, endFrequency: 55, type: "sawtooth", duration: 0.52, gain: 0.13 * intensity, destination: this.sfxGain });
    this.noise({ duration: 0.34, gain: 0.075 * intensity, filter: 440 });
    window.setTimeout(() => this.playQuestComplete(0.8), 220);
  }

  playThump(intensity) {
    this.tone({ frequency: 78, endFrequency: 38, type: "sine", duration: 0.2, gain: 0.118 * intensity, destination: this.sfxGain });
  }

  playQuestComplete(intensity) {
    [0, 4, 7, 12].forEach((step, index) => {
      window.setTimeout(() => {
        this.tone({
          frequency: 330 * Math.pow(2, step / 12),
          endFrequency: 330 * Math.pow(2, step / 12),
          type: "sine",
          duration: 0.18,
          gain: 0.075 * intensity,
          destination: this.sfxGain,
        });
      }, index * 90);
    });
  }

  playUiClick(intensity) {
    this.tone({ frequency: 640, endFrequency: 420, type: "sine", duration: 0.07, gain: 0.045 * intensity, destination: this.sfxGain });
  }

  playCaveGateOpen(intensity) {
    this.tone({ frequency: 86, endFrequency: 52, type: "sawtooth", duration: 0.42, gain: 0.1 * intensity, destination: this.sfxGain });
    this.noise({ duration: 0.36, gain: 0.07 * intensity, filter: 360 });
    window.setTimeout(() => this.playCaveArrowHit(0.55 * intensity), 180);
  }

  tone({ frequency, endFrequency, type, duration, gain, destination }) {
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), now + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope).connect(destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  noise({ duration, gain, filter, destination = this.sfxGain }) {
    const now = this.context.currentTime;
    const sampleCount = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, sampleCount, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < sampleCount; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / sampleCount);
    }

    const source = this.context.createBufferSource();
    const bandpass = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    bandpass.type = "bandpass";
    bandpass.frequency.value = filter;
    bandpass.Q.value = 0.8;
    envelope.gain.value = gain;
    source.buffer = buffer;
    source.connect(bandpass).connect(envelope).connect(destination);
    source.start(now);
  }
}
