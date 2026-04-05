(function () {
  const THREE = window.THREE;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  document.body.tabIndex = 0;
  document.body.focus({ preventScroll: true });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070d);
  scene.fog = new THREE.Fog(0x05070d, 18, 95);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 240);

  scene.add(new THREE.HemisphereLight(0xbfd9ff, 0x070a12, 0.85));

  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(10, 16, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);

  const sanctumGlow = new THREE.PointLight(0xfff0c2, 0.65, 90, 2);
  sanctumGlow.position.set(0, 10, 0);
  scene.add(sanctumGlow);

  const ARENA = { tilesX: 26, tilesZ: 18, tileSize: 1.4, grout: 0.06 };
  ARENA.halfW = ARENA.tilesX * ARENA.tileSize * 0.5 - 1.0;
  ARENA.halfD = ARENA.tilesZ * ARENA.tileSize * 0.5 - 1.0;

  const slab = new THREE.Mesh(
    new THREE.PlaneGeometry(ARENA.tilesX * ARENA.tileSize, ARENA.tilesZ * ARENA.tileSize),
    new THREE.MeshStandardMaterial({ color: 0x8f98a6, roughness: 0.95 })
  );
  slab.rotation.x = -Math.PI / 2;
  slab.receiveShadow = true;
  scene.add(slab);

  const altar = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 1.2, 2.2),
    new THREE.MeshStandardMaterial({ color: 0xcfd6e2, roughness: 0.9 })
  );
  altar.position.set(0, 0.6, -ARENA.halfD + 1.4);
  altar.castShadow = true;
  altar.receiveShadow = true;
  scene.add(altar);

  const aura = new THREE.Mesh(
    new THREE.RingGeometry(2.5, 3.1, 64),
    new THREE.MeshStandardMaterial({
      color: 0xffe6a0,
      emissive: 0xffd680,
      emissiveIntensity: 2.0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    })
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.set(0, 0.05, altar.position.z);
  scene.add(aura);

  const candles = [];

  function addCandle(x, z) {
    const group = new THREE.Group();

    const wax = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 0.4, 10),
      new THREE.MeshStandardMaterial({ color: 0xf5f1e6 })
    );
    wax.position.y = 0.2;

    const flame = new THREE.PointLight(0xffc06b, 1.2, 6, 2);
    flame.position.y = 0.45;

    group.add(wax, flame);
    group.position.set(x, 0, z);
    scene.add(group);

    candles.push({ light: flame });
  }

  for (let i = -4; i <= 4; i++) {
    addCandle(i * 0.9, altar.position.z + 2.2);
  }

  const motesGeo = new THREE.BufferGeometry();
  const count = 180;
  const pos = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    pos[i * 3] = THREE.MathUtils.randFloat(-ARENA.halfW, ARENA.halfW);
    pos[i * 3 + 1] = THREE.MathUtils.randFloat(0.8, 8);
    pos[i * 3 + 2] = THREE.MathUtils.randFloat(-ARENA.halfD, ARENA.halfD);
  }
  motesGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

  const motes = new THREE.Points(
    motesGeo,
    new THREE.PointsMaterial({ size: 0.06, opacity: 0.4, transparent: true })
  );
  scene.add(motes);

  function updateWorld(args) {
    const dt = args.dt;
    const t = args.t;

    sanctumGlow.intensity = 0.6 + Math.sin(t * 0.5) * 0.08;
    aura.material.opacity = 0.45 + Math.sin(t * 1.4) * 0.1;
    aura.rotation.z += dt * 0.2;

    for (const c of candles) {
      c.light.intensity = 1.0 + Math.random() * 0.3;
    }

    const p = motes.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      p.array[i * 3 + 1] += Math.sin(t + i) * dt * 0.15;
    }
    p.needsUpdate = true;
  }

  function resizeWorld() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.SanctumWorld = {
    renderer,
    scene,
    camera,
    ARENA,
    altar,
    updateWorld,
    resizeWorld
  };
})();
