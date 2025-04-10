import * as THREE from "three";

/**
 * Creates and configures a WebGL renderer
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @param {Object} windowSize - The window dimensions
 * @param {number} windowSize.width - The window width
 * @param {number} windowSize.height - The window height
 * @returns {THREE.WebGLRenderer} The configured renderer
 */
export const getNewRenderer = (canvas, windowSize) => {
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
  });

  // Configure renderer
  renderer.setSize(windowSize.width, windowSize.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Enable physically correct lighting
  renderer.physicallyCorrectLights = true;

  // Configure tone mapping for HDR
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Enable shadow maps
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  return renderer;
};
