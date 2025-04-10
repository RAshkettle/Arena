import * as THREE from "three";
import * as lil from "lil-gui";

import { getNewRenderer } from "./renderer";
import { createCamera, updateCameraAspect } from "./camera";
import { createControls } from "./controls";
import { createScene, createCube } from "./scene";
import { setupResizeHandler, setupFullscreenHandler } from "./events";

// Initialize GUI
const gui = new lil.GUI();

// Get canvas
/**
 * @type {HTMLCanvasElement}
 */
const canvas = document.querySelector("canvas.webgl");

/**
 * Window dimensions object
 * @type {{width: number, height: number}}
 */
const windowSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Setup scene and objects
const scene = createScene();
const mesh = createCube(scene, gui);

// Setup camera
const camera = createCamera(windowSize);

// Setup controls
const controls = createControls(camera, canvas);

// Setup renderer
const renderer = getNewRenderer(canvas, windowSize);

// Setup event handlers
setupResizeHandler(windowSize, camera, renderer);
setupFullscreenHandler(canvas);

// Initial resize
updateCameraAspect(camera, windowSize);
renderer.setSize(windowSize.width, windowSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Animation loop
/**
 * Clock for tracking elapsed time
 * @type {THREE.Clock}
 */
const clock = new THREE.Clock();

/**
 * Animation loop function that renders each frame
 * @param {number} [timestamp] - The current timestamp (automatically provided by requestAnimationFrame)
 */
const tick = (timestamp) => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

// Start animation loop
tick();
