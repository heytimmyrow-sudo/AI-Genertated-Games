(function () {
  const THREE = window.THREE;
  const world = window.SanctumWorld;

  const errorBox = document.createElement("div");
  Object.assign(errorBox.style, {
    position: "fixed",
    left: "12px",
    right: "12px",
    bottom: "12px",
    padding: "12px",
    borderRadius: "12px",
    background: "rgba(140,0,0,0.85)",
    color: "white",
    fontFamily: "system-ui, Segoe UI, Arial",
    fontSize: "12px",
    lineHeight: "1.35",
    whiteSpace: "pre-wrap",
    zIndex: "9999",
    display: "none"
  });
  document.body.appendChild(errorBox);

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.style.display = "block";
  }

  if (!THREE || !world || !window.createSanctumEntities || !window.initSanctumUI) {
    showError("Sanctum Arena failed to boot. A required script did not load.");
    return;
  }

  window.addEventListener("error", (e) => showError(`JS Error:\n${e && e.message ? e.message : e}\n\n${e && e.filename ? e.filename : ""}:${e && e.lineno ? e.lineno : ""}`));
  window.addEventListener("unhandledrejection", (e) => showError(`Unhandled Promise Rejection:\n${e && e.reason && e.reason.message ? e.reason.message : (e && e.reason) || e}`));

  const input = { w: false, a: false, s: false, d: false, shift: false, wantSwing: false, lastKey: "(none)" };

  function onKey(e, isDown) {
    const key = (e.key || "").toLowerCase();
    const code = e.code || "";
    input.lastKey = `${isDown ? "down" : "up"}: key="${e.key}" code="${code}"`;

    if (key === "w" || code === "KeyW") input.w = isDown;
    if (key === "a" || code === "KeyA") input.a = isDown;
    if (key === "s" || code === "KeyS") input.s = isDown;
    if (key === "d" || code === "KeyD") input.d = isDown;
    if (key === "shift" || code === "ShiftLeft" || code === "ShiftRight") input.shift = isDown;

    if ((code === "Space" || key === " ") && isDown) input.wantSwing = true;
  }

  window.addEventListener("keydown", (e) => onKey(e, true), true);
  window.addEventListener("keyup", (e) => onKey(e, false), true);
  window.addEventListener("keydown", (e) => {
    if ((e.key && e.key.startsWith("Arrow")) || e.code === "Space") e.preventDefault();
  }, { passive: false });

  let audioCtx = null;
  let musicGain = null;

  function audioUnlock() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      musicGain = audioCtx.createGain();
      musicGain.gain.value = 0.014;
      musicGain.connect(audioCtx.destination);

      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();

      osc1.type = "sine";
      osc2.type = "triangle";
      lfo.type = "sine";
      osc1.frequency.value = 55;
      osc2.frequency.value = 110;
      lfo.frequency.value = 0.16;

      lfoGain.gain.value = 6;
      lfo.connect(lfoGain);
      lfoGain.connect(osc2.frequency);

      const mix = audioCtx.createGain();
      mix.gain.value = 0.7;
      osc1.connect(mix);
      osc2.connect(mix);

      const lp = audioCtx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 240;

      mix.connect(lp);
      lp.connect(musicGain);

      osc1.start();
      osc2.start();
      lfo.start();
    } catch (err) {
      showError(`Audio init failed:\n${err && err.message ? err.message : err}`);
    }
  }

  function pop(freq, dur, vol, type) {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type || "square";
    osc.frequency.setValueAtTime(freq || 520, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(60, (freq || 520) * 0.65), t0 + (dur || 0.06));

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.06, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + (dur || 0.06));

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + (dur || 0.06) + 0.02);
  }

  window.addEventListener("pointerdown", () => {
    document.body.focus({ preventScroll: true });
    input.wantSwing = true;
    audioUnlock();
  });

  const entities = window.createSanctumEntities({ scene: world.scene, ARENA: world.ARENA, pop });
  const ui = window.initSanctumUI({ ARENA: world.ARENA, altar: world.altar, entities });

  window.addEventListener("keydown", (e) => {
    const k = (e.key || "").toLowerCase();
    if (k === "r") entities.restart();
    if ((k === "m") && musicGain) {
      musicGain.gain.value = musicGain.gain.value > 0 ? 0 : 0.014;
    }
  }, true);

  const camOffset = new THREE.Vector3(7.5, 9.0, 7.5);
  world.camera.position.copy(entities.player.position).add(camOffset);
  world.camera.lookAt(entities.player.position.x, 0.9, entities.player.position.z);

  const clock = new THREE.Clock();
  let t = 0;

  function loop() {
    try {
      const dt = Math.min(clock.getDelta(), 0.033);
      t += dt;

      entities.update({ dt, t, input });
      world.updateWorld({ dt, t });
      ui.update({ t, input });

      const desiredCam = new THREE.Vector3().copy(entities.player.position).add(camOffset);
      world.camera.position.lerp(desiredCam, 0.10);
      world.camera.lookAt(entities.player.position.x, 0.9, entities.player.position.z);

      world.renderer.render(world.scene, world.camera);
      requestAnimationFrame(loop);
    } catch (err) {
      showError("Crash inside loop():\n" + (err && err.stack ? err.stack : err));
    }
  }

  loop();

  window.addEventListener("resize", () => {
    world.resizeWorld();
    ui.resize();
  });
})();
