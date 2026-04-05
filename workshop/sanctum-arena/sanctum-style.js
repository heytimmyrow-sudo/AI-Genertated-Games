import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// Tiny gradient texture for MeshToonMaterial (the “Zelda bands” look)
export function makeToonRamp() {
  const data = new Uint8Array([
    20, 24, 40,   // deep shadow
    80, 95, 125,  // mid shadow
    165, 190, 220,// light
    255, 245, 220 // highlight (warm)
  ]);

  const tex = new THREE.DataTexture(data, 4, 1, THREE.RGBFormat);
  tex.needsUpdate = true;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

export function toonMat({ color, emissive = 0x000000, emissiveIntensity = 0.0, ramp }) {
  return new THREE.MeshToonMaterial({
    color,
    emissive,
    emissiveIntensity,
    gradientMap: ramp
  });
}