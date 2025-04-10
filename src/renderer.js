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
  const renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setSize(windowSize.width, windowSize.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  return renderer;
};
