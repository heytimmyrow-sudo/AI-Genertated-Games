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
    this.bossDrone = null;
    this.caveDrone = null;
    this.weatherDrone = null;
    this.musicNodes = [];
    this.musicStarted = false;
    this.muted = localStorage.getItem("echo-archer-muted") === "true";
    this.volume = Number(localStorage.getItem("echo-archer-volume") ?? 0.55);
    this.gameplayPaused = false;

    this.handleSoundEvent = this.handleSoundEvent.bind(this);
    this.handleMusicState = this.handleMusicState.bind(this);
    this.handleCaveState = this.handleCaveState.bind(this);
    this.handleWeatherState = this.handleWeatherState.bind(this);
    this.unlock = this.unlock.bind(this);
    window.addEventListener("echo-archer:sound", this.handleSoundEvent);
    window.addEventListener("echo-archer:music-state", this.handleMusicState);
    window.addEventListener("echo-archer:cave-state", this.handleCaveState);
    window.addEventListener("echo-archer:weather-state", this.handleWeatherState);
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
      this.musicGain.gain.value = 0.16;
      this.bossGain.gain.value = 0;
      this.caveGain.gain.value = 0;
      this.weatherGain.gain.value = 0;
      this.sfxGain.gain.value = 0.72;
      this.musicGain.connect(this.masterGain);
      this.bossGain.connect(this.masterGain);
      this.caveGain.connect(this.masterGain);
      this.weatherGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);
      this.applyMasterVolume();
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
      this.musicGain.gain.setTargetAtTime(paused ? 0.08 : 0.16, this.context.currentTime, 0.2);
    }
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
    const root = 196;
    const notes = [0, 7, 12, 7, 3, 10, 12, 15];

    notes.forEach((step, index) => {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = root * Math.pow(2, step / 12);
      gain.gain.value = 0;
      oscillator.connect(gain).connect(this.musicGain);
      oscillator.start(now + index * 0.35);
      this.musicNodes.push({ oscillator, gain, step, index });
    });

    const pad = this.context.createOscillator();
    const padGain = this.context.createGain();
    pad.type = "triangle";
    pad.frequency.value = 98;
    padGain.gain.value = 0.035;
    pad.connect(padGain).connect(this.musicGain);
    pad.start(now);
    this.musicNodes.push({ oscillator: pad, gain: padGain, step: -12, index: -1 });
    this.scheduleMusicLoop();
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

    this.musicGain.gain.setTargetAtTime(active ? 0.1 : 0.16, this.context.currentTime, 0.35);
    this.bossGain.gain.setTargetAtTime(active ? 0.055 : 0, this.context.currentTime, 0.25);
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

    this.musicGain?.gain.setTargetAtTime(active ? 0.11 : 0.16, this.context.currentTime, 0.45);
    this.caveGain.gain.setTargetAtTime(active ? 0.038 : 0, this.context.currentTime, 0.35);
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

    const target = weather === "light-rain" ? 0.028 : weather === "blackwater-fog" ? 0.018 : weather === "fog" || weather === "mistwood-mist" ? 0.012 : 0;
    this.weatherGain.gain.setTargetAtTime(target, this.context.currentTime, 0.5);
  }

  scheduleMusicLoop() {
    if (!this.context || !this.musicStarted) {
      return;
    }

    const now = this.context.currentTime;
    const loopLength = 6.4;
    this.musicNodes.forEach((node) => {
      if (node.index < 0) {
        return;
      }
      for (let cycle = 0; cycle < 4; cycle += 1) {
        const start = now + cycle * loopLength + node.index * 0.62;
        node.gain.gain.setValueAtTime(0, start);
        node.gain.gain.linearRampToValueAtTime(0.055, start + 0.18);
        node.gain.gain.exponentialRampToValueAtTime(0.001, start + 1.45);
      }
    });
    window.setTimeout(() => this.scheduleMusicLoop(), loopLength * 2800);
  }

  playBowDraw(intensity) {
    this.tone({ frequency: 170, endFrequency: 245 + intensity * 35, type: "sawtooth", duration: 0.22, gain: 0.028 * intensity, destination: this.sfxGain });
    this.noise({ duration: 0.18, gain: 0.026 * intensity, filter: 850 });
  }

  playArrowRelease(intensity) {
    this.tone({ frequency: 460, endFrequency: 145, type: "triangle", duration: 0.16, gain: 0.1 * intensity, destination: this.sfxGain });
    this.noise({ duration: 0.11, gain: 0.05 * intensity, filter: 1800 });
  }

  playWoodHit(intensity) {
    this.tone({ frequency: 138, endFrequency: 82, type: "triangle", duration: 0.13, gain: 0.105 * intensity, destination: this.sfxGain });
    this.noise({ duration: 0.075, gain: 0.045 * intensity, filter: 760 });
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
    this.tone({ frequency: 165, endFrequency: 82, type: "sawtooth", duration: 0.17, gain: 0.082 * intensity, destination: this.sfxGain });
    this.noise({ duration: 0.08, gain: 0.028 * intensity, filter: 520 });
  }

  playWeakpointHit(intensity) {
    this.playEnemyHit(intensity * 0.75);
    this.tone({ frequency: 660, endFrequency: 990, type: "sine", duration: 0.12, gain: 0.05 * intensity, destination: this.sfxGain });
    window.setTimeout(() => this.tone({ frequency: 990, endFrequency: 1320, type: "triangle", duration: 0.1, gain: 0.034 * intensity, destination: this.sfxGain }), 55);
  }

  playArrowFlyby(intensity) {
    this.noise({ duration: 0.16, gain: 0.032 * intensity, filter: 2600 });
    this.tone({ frequency: 720, endFrequency: 210, type: "triangle", duration: 0.13, gain: 0.035 * intensity, destination: this.sfxGain });
  }

  playEnemyDefeat(intensity) {
    this.tone({ frequency: 240, endFrequency: 66, type: "triangle", duration: 0.42, gain: 0.118 * intensity, destination: this.sfxGain });
    this.noise({ duration: 0.2, gain: 0.05 * intensity, filter: 420 });
  }

  playBossNotice(intensity) {
    this.tone({ frequency: 98, endFrequency: 147, type: "sawtooth", duration: 0.32, gain: 0.1 * intensity, destination: this.sfxGain });
    this.noise({ duration: 0.22, gain: 0.07 * intensity, filter: 360 });
  }

  playBossCharge(intensity) {
    this.tone({ frequency: 120, endFrequency: 72, type: "triangle", duration: 0.22, gain: 0.1 * intensity, destination: this.sfxGain });
    this.noise({ duration: 0.18, gain: 0.065 * intensity, filter: 520 });
  }

  playBossDefeat(intensity) {
    this.tone({ frequency: 165, endFrequency: 55, type: "sawtooth", duration: 0.52, gain: 0.13 * intensity, destination: this.sfxGain });
    this.noise({ duration: 0.34, gain: 0.075 * intensity, filter: 440 });
    window.setTimeout(() => this.playQuestComplete(0.8), 220);
  }

  playThump(intensity) {
    this.tone({ frequency: 74, endFrequency: 42, type: "sine", duration: 0.18, gain: 0.11 * intensity, destination: this.sfxGain });
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

  noise({ duration, gain, filter }) {
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
    source.connect(bandpass).connect(envelope).connect(this.sfxGain);
    source.start(now);
  }
}
