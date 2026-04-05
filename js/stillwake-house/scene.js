(function () {
  const StillwakeHouse = window.StillwakeHouse || (window.StillwakeHouse = {});
  const { CONFIG } = StillwakeHouse;

  function createRenderer(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(CONFIG.width, CONFIG.height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.physicallyCorrectLights = true;
    return renderer;
  }

  function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb4cbe0);
    scene.fog = new THREE.Fog(0xb4cbe0, 6.8, 20);
    return scene;
  }

  function createCamera() {
    const camera = new THREE.PerspectiveCamera(55, CONFIG.width / CONFIG.height, 0.1, 100);
    camera.position.set(0, 2.6, 6);
    return camera;
  }

  function addLights(scene) {
    // Lighting is the main atmosphere control point for the house scene.
    // Warm interior lights live here, while world.js handles furniture and materials.
    const ambient = new THREE.HemisphereLight(0xf8e5bf, 0x4d6277, 0.46);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffc779, 5.6);
    sun.position.set(7.6, 8.8, -3.6);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 4096;
    sun.shadow.mapSize.height = 4096;
    sun.shadow.camera.left = -14;
    sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.bias = -0.0001;
    sun.shadow.radius = 5;
    scene.add(sun);

    const windowKey = new THREE.SpotLight(0xffd79c, 44, 16, 0.62, 0.55, 1.2);
    windowKey.position.set(6.4, 3.25, -2.2);
    windowKey.target.position.set(1.4, 1.0, -0.4);
    windowKey.castShadow = true;
    windowKey.shadow.mapSize.width = 2048;
    windowKey.shadow.mapSize.height = 2048;
    windowKey.shadow.bias = -0.00012;
    windowKey.shadow.radius = 6;
    scene.add(windowKey);
    scene.add(windowKey.target);

    const windowBounce = new THREE.PointLight(0xffdfb0, 30, 10.5, 2);
    windowBounce.position.set(4.4, 1.95, -1.25);
    scene.add(windowBounce);

    const warmLamp = new THREE.PointLight(0xffa85d, 36, 8.2, 2);
    warmLamp.position.set(1.5, 1.68, 0.02);
    warmLamp.castShadow = true;
    warmLamp.shadow.mapSize.width = 1024;
    warmLamp.shadow.mapSize.height = 1024;
    warmLamp.shadow.bias = -0.00006;
    warmLamp.shadow.radius = 5;
    scene.add(warmLamp);

    const tableFill = new THREE.PointLight(0xffc48d, 11, 5.4, 2);
    tableFill.position.set(0.85, 1.22, 0.5);
    scene.add(tableFill);

    const roomFill = new THREE.PointLight(0xffc18f, 4.6, 8.8, 2);
    roomFill.position.set(-1.6, 1.25, 2.1);
    scene.add(roomFill);

    const mysteryCool = new THREE.PointLight(0x7696bb, 6.4, 6.2, 2);
    mysteryCool.position.set(-1.1, 2.0, -4.25);
    scene.add(mysteryCool);

    const ceilingWarm = new THREE.PointLight(0xffe2bb, 2.4, 11, 2);
    ceilingWarm.position.set(0.2, 3.05, 0.6);
    scene.add(ceilingWarm);

    const porchGlow = new THREE.PointLight(0xffbc74, 6.2, 8.6, 2);
    porchGlow.position.set(7.2, 1.4, 2.8);
    scene.add(porchGlow);
  }

  StillwakeHouse.createRenderer = createRenderer;
  StillwakeHouse.createScene = createScene;
  StillwakeHouse.createCamera = createCamera;
  StillwakeHouse.addLights = addLights;
}());
