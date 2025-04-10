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
import {
  initPhysics,
  createGroundCollider,
  createPlayerCollider,
  updatePhysics,
  setPlayerPosition,
  getPlayerPhysics,
} from "./physics";
import InputHandler from "./input";

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

// Create input handler for player controls
const inputHandler = new InputHandler();

// Physics objects
let playerBody = null;
let groundCollider = null;

// Initialize physics and set up the scene once ready
initPhysics().then(() => {
  // Create physics colliders
  groundCollider = createGroundCollider(groundMesh);
  playerBody = createPlayerCollider(playerMesh);

  if (debug) {
    // Add physics controls to GUI
    const physicsFolder = gui.addFolder("Physics");
    const physicsParams = {
      resetPlayer: () => {
        setPlayerPosition(playerBody, 0, 5, 0);
      },
    };

    physicsFolder
      .add(physicsParams, "resetPlayer")
      .name("Reset Player Position");
  }
});

// Connect GUI controls to physics
if (debug) {
  // Override player position controls to update physics
  const playerFolder = gui.folders.find((f) => f.title === "Player Position");
  if (playerFolder) {
    // Store original onChange handlers
    const controllers = playerFolder.controllers;

    controllers.forEach((controller) => {
      const property = controller.property;
      if (property === "x" || property === "z") {
        const originalOnChange = controller.onChange;
        controller.onChange((value) => {
          // Call original handler if it exists
          if (originalOnChange) {
            originalOnChange(value);
          }

          // Update physics body
          if (playerBody) {
            const physics = getPlayerPhysics();
            if (physics && physics.body) {
              const pos = physics.body.translation();
              setPlayerPosition(
                physics.body,
                property === "x" ? value : pos.x,
                pos.y,
                property === "z" ? value : pos.z
              );
            }
          }
        });
      }
    });
  }
}

// Animation loop
/**
 * Clock for tracking elapsed time
 * @type {THREE.Clock}
 */
const clock = new THREE.Clock();
let previousTime = 0;

/**
 * Animation loop function that renders each frame
 * @param {number} [timestamp] - The current timestamp (automatically provided by requestAnimationFrame)
 */
const tick = (timestamp) => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Get player input
  const movementDirection = inputHandler.getMovementDirection();
  const jumpPressed = inputHandler.isJumpPressed();

  // Normalize movement direction if needed
  if (movementDirection.x !== 0 && movementDirection.z !== 0) {
    const length = Math.sqrt(
      movementDirection.x * movementDirection.x +
        movementDirection.z * movementDirection.z
    );
    movementDirection.x /= length;
    movementDirection.z /= length;
  }

  // Update physics with player input
  updatePhysics(deltaTime, movementDirection, jumpPressed);

  // Reset jump to prevent continuous jumping while holding space
  if (jumpPressed) {
    inputHandler.resetJump();
  }

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
