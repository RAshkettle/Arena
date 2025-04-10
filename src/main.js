import * as THREE from "three";
import * as lil from "lil-gui";

import { getNewRenderer } from "./renderer";
import {
  createCamera,
  updateCameraAspect,
  updateThirdPersonCamera,
} from "./camera";
import { createControls } from "./controls";
import { createScene, createGround } from "./scene";
import { createPlayer } from "./player";
import { setupResizeHandler, setupFullscreenHandler } from "./events";

/**
 * Global debug flag to control GUI visibility
 * @type {boolean}
 */
const debug = true;

// Initialize GUI
const gui = new lil.GUI();

// Show or hide GUI based on debug flag
if (!debug) {
  gui.hide();
}

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
const groundMesh = createGround(scene, gui);
const playerMesh = createPlayer(scene, gui);

// Add lights to the scene for the standard material
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Setup camera
const camera = createCamera(windowSize);

// Setup controls - now simplified without the canvas parameter
const controls = createControls();

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

  // Update third-person camera to follow the player
  updateThirdPersonCamera(camera, playerMesh);

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

// Start animation loop
tick();
