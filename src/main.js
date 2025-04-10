import * as THREE from "three";
import * as lil from "lil-gui";

import { getNewRenderer } from "./renderer";
import {
  createCamera,
  updateCameraAspect,
  updateThirdPersonCamera,
} from "./camera";
import { createControls } from "./controls";
import { createScene, createGround, createSkybox, createWalls } from "./scene";
import { createPlayer, updatePlayerAnimations } from "./player";
import {
  setupResizeHandler,
  setupFullscreenHandler,
  setupPointerLockHandler,
  isPointerLocked,
} from "./events";
import {
  initPhysics,
  createGroundCollider,
  createPlayerCollider,
  updatePhysics,
  setPlayerPosition,
  getPlayerPhysics,
  setPhysicsScene,
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

// Add lights to the scene for the midnight moonlight effect
const ambientLight = new THREE.AmbientLight(0x050512, 0.15); // Very dim dark blue ambient light for midnight
scene.add(ambientLight);

// Create moonlight (directional light with blue tint)
const moonLight = new THREE.DirectionalLight(0xd8e8ff, 0.3); // Soft blue-white color with reduced intensity
moonLight.position.set(-15, 25, -10); // Position to simulate moonlight coming from one side
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 2048;
moonLight.shadow.mapSize.height = 2048;
moonLight.shadow.camera.far = 50;
moonLight.shadow.bias = -0.0005; // Reduce shadow artifacts
scene.add(moonLight);

// Add a point light to simulate the full moon's glow
const moonGlow = new THREE.PointLight(0xd0e0ff, 1, 200, 1.5); // Stronger blue-white light with distance attenuation
moonGlow.position.set(-25, 40, -25); // Higher position for the moon
scene.add(moonGlow);

// Add a subtle flickering light to enhance the eerie atmosphere
const flickerLight = new THREE.PointLight(0x7080a0, 0.2, 50, 2);
flickerLight.position.set(5, 3, 5);
scene.add(flickerLight);

// Add skybox to the scene
createSkybox(scene);

// Add walls to the scene
createWalls(scene, gui);

// Set the scene reference for physics debugging
setPhysicsScene(scene);

// Setup camera
const camera = createCamera(windowSize);

// Setup controls - now simplified without the canvas parameter
const controls = createControls();

// Setup renderer
const renderer = getNewRenderer(canvas, windowSize);

// Setup event handlers
setupResizeHandler(windowSize, camera, renderer);
setupFullscreenHandler(canvas);
setupPointerLockHandler(canvas, (locked) => {
  // Handle pointer lock state changes
  // You could show/hide UI elements, enable/disable controls, etc.
  if (debug) {
    // Toggle GUI visibility based on pointer lock state
    if (locked) {
      gui.hide();
    } else if (debug) {
      gui.show();
    }
  }
});

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
  playerBody = createPlayerCollider(playerMesh, gui); // Pass GUI for debug controls

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
      if (property === "x" || property === "y" || property === "z") {
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
                property === "y" ? value : pos.y,
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

  // Only process movement input if pointer is locked (in game mode)
  if (isPointerLocked()) {
    // Get player input
    const movementDirection = inputHandler.getMovementDirection();
    const jumpPressed = inputHandler.isJumpPressed();
    const playerRotation = inputHandler.getPlayerRotation();

    // Normalize movement direction if needed
    if (movementDirection.x !== 0 && movementDirection.z !== 0) {
      const length = Math.sqrt(
        movementDirection.x * movementDirection.x +
          movementDirection.z * movementDirection.z
      );
      movementDirection.x /= length;
      movementDirection.z /= length;
    }

    // Update physics with player input and camera rotation
    updatePhysics(deltaTime, movementDirection, jumpPressed, playerRotation);

    // Reset jump to prevent continuous jumping while holding space
    if (jumpPressed) {
      inputHandler.resetJump();
    }

    // Update third-person camera to follow the player
    updateThirdPersonCamera(camera, playerMesh, playerRotation);

    // Update player animations based on movement
    updatePlayerAnimations(deltaTime, movementDirection);
  } else {
    // When not in game mode, pass zero movement
    const playerRotation = inputHandler.getPlayerRotation();

    // Still update physics with rotation even when not moving
    updatePhysics(deltaTime, { x: 0, z: 0 }, false, playerRotation);

    // Update camera position
    updateThirdPersonCamera(camera, playerMesh, playerRotation);

    // Update animations with zero movement (should trigger idle animation)
    updatePlayerAnimations(deltaTime, { x: 0, z: 0 });
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

// Start animation loop
tick();
