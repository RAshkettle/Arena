import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { createPlayerCollider, getPlayerPhysics } from "./physics";

let playerGroup = null;
let playerModel = null;
let playerMixer = null;
let animationActions = {};
let currentAction = null;
let previousAction = null;

/**
 * Creates a player using a loaded skeleton model
 * @param {THREE.Scene} scene - The scene to add the player to
 * @param {object} gui - The GUI instance for adding controls
 * @returns {THREE.Group} The created player group
 */
export const createPlayer = (scene, gui) => {
  // Create a group to hold the player and its marker
  const playerGroup = new THREE.Group();

  // Position the player higher to demonstrate gravity
  // The physics system will make it fall onto the ground
  playerGroup.position.y = 5;

  // Add the player group to the scene
  scene.add(playerGroup);

  // Set up a temporary capsule until the model loads
  const tempGeometry = new THREE.CapsuleGeometry(0.5, 1, 16, 16);
  const tempMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
  });
  const tempMesh = new THREE.Mesh(tempGeometry, tempMaterial);
  playerGroup.add(tempMesh);

  // Store a reference to the player mesh on the group
  playerGroup.playerMesh = tempMesh;

  // Use loadPlayer instead of directly loading the model here
  loadPlayer(scene)
    .then((loadedPlayerGroup) => {
      // Remove the temporary capsule
      playerGroup.remove(tempMesh);

      // Copy the loaded model to our player group
      const model = loadedPlayerGroup.children[0];
      playerGroup.add(model);

      // Update the player mesh reference
      playerGroup.playerMesh = model;

      // Copy userData from loaded player
      if (loadedPlayerGroup.userData) {
        playerGroup.userData = {
          ...playerGroup.userData,
          ...loadedPlayerGroup.userData,
        };
      }

      // Remove the loaded group since we've transferred its contents
      scene.remove(loadedPlayerGroup);
    })
    .catch((error) => {
      // Error handling remains but without console.error
    });

  // Create debug UI folders
  const playerFolder = gui.addFolder("Player Position");
  const rotationFolder = gui.addFolder("Player Rotation");
  const scaleFolder = gui.addFolder("Player Scale");

  // Position controls - X, Y, Z
  playerFolder
    .add(playerGroup.position, "x")
    .min(-50)
    .max(50)
    .step(0.1)
    .name("X");
  playerFolder
    .add(playerGroup.position, "y")
    .min(-10)
    .max(50)
    .step(0.1)
    .name("Y");
  playerFolder
    .add(playerGroup.position, "z")
    .min(-50)
    .max(50)
    .step(0.1)
    .name("Z");

  // Rotation controls - X, Y, Z (in radians, converted to degrees for UI)
  const rotationControl = {
    x: 0,
    y: 0,
    z: 0,
  };

  // Convert between degrees (UI) and radians (Three.js)
  rotationFolder
    .add(rotationControl, "x")
    .min(-180)
    .max(180)
    .step(1)
    .name("X (deg)")
    .onChange((value) => {
      playerGroup.rotation.x = (value * Math.PI) / 180;
    });
  rotationFolder
    .add(rotationControl, "y")
    .min(-180)
    .max(180)
    .step(1)
    .name("Y (deg)")
    .onChange((value) => {
      playerGroup.rotation.y = (value * Math.PI) / 180;
    });
  rotationFolder
    .add(rotationControl, "z")
    .min(-180)
    .max(180)
    .step(1)
    .name("Z (deg)")
    .onChange((value) => {
      playerGroup.rotation.z = (value * Math.PI) / 180;
    });

  // Scale controls - uniform and per-axis
  const scaleControl = {
    uniform: 1,
    x: 1,
    y: 1,
    z: 1,
  };

  scaleFolder
    .add(scaleControl, "uniform")
    .min(0.1)
    .max(3)
    .step(0.1)
    .name("Uniform")
    .onChange((value) => {
      playerGroup.playerMesh.scale.set(value, value, value);
      scaleControl.x = value;
      scaleControl.y = value;
      scaleControl.z = value;

      // Update the scale controllers without triggering their onChange events
      scaleFolder.controllers.forEach((controller) => {
        if (controller.property !== "uniform") {
          controller.setValue(value);
        }
      });

      // Store the current scale for physics updates
      // This will be used in updatePhysics to scale the collider
      playerGroup.userData.scale = { x: value, y: value, z: value };
    });

  scaleFolder
    .add(scaleControl, "x")
    .min(0.1)
    .max(3)
    .step(0.1)
    .name("X")
    .onChange((value) => {
      playerGroup.playerMesh.scale.x = value;
      // Store the updated scale for physics collider synchronization
      playerGroup.userData.scale.x = value;
    });

  scaleFolder
    .add(scaleControl, "y")
    .min(0.1)
    .max(3)
    .step(0.1)
    .name("Y")
    .onChange((value) => {
      playerGroup.playerMesh.scale.y = value;
      // Store the updated scale for physics collider synchronization
      playerGroup.userData.scale.y = value;
    });

  scaleFolder
    .add(scaleControl, "z")
    .min(0.1)
    .max(3)
    .step(0.1)
    .name("Z")
    .onChange((value) => {
      playerGroup.playerMesh.scale.z = value;
      // Store the updated scale for physics collider synchronization
      playerGroup.userData.scale.z = value;
    });

  // Initialize userData for physics-related properties
  playerGroup.userData = {
    scale: { x: 1, y: 1, z: 1 },
    colliderVisible: false,
    colliderHelper: null,
  };

  return playerGroup;
};

/**
 * Loads the player model and creates the player in the scene
 * @param {THREE.Scene} scene - The scene to add the player to
 * @returns {Promise<THREE.Group>} - Promise that resolves to the player group
 */
export const loadPlayer = async (scene) => {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      "assets/Skeleton.glb",
      (gltf) => {
        const model = gltf.scene;
        playerModel = model;

        // Create animations
        const animations = gltf.animations;
        if (animations && animations.length) {
          // Set up animation mixer and actions
          playerMixer = new THREE.AnimationMixer(model);

          // Animation name mapping - map the actual animation names to simplified ones
          const animationNameMap = {
            "CharacterArmature|CharacterArmature|CharacterArmature|Idle|CharacterArmature|Idle":
              "Idle",
            // Map other animations as needed once identified
          };

          // Create animation actions
          animations.forEach((clip) => {
            const action = playerMixer.clipAction(clip);

            // Use the mapped name if available, otherwise use original name
            const simplifiedName = animationNameMap[clip.name] || clip.name;
            animationActions[simplifiedName] = action;

            // Set default animation parameters
            action.clampWhenFinished = false; // Change to false to allow looping
            action.loop = THREE.LoopRepeat;
            action.repetitions = Infinity; // Ensure it repeats indefinitely
          });

          // Set default animation
          currentAction = animationActions["Idle"];
          if (currentAction) {
            currentAction.play();
          }
        }

        // Adjust material properties to look like bone
        model.traverse((child) => {
          if (child.isMesh && child.material) {
            // Handle both single materials and material arrays
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];

            materials.forEach((material) => {
              if (
                material.isMeshStandardMaterial ||
                material.isMeshPhysicalMaterial
              ) {
                material.metalness = 0.1; // Lower metallic to 0.1 as requested
                material.roughness = 0.8; // Increase roughness for a more bone-like appearance
                material.needsUpdate = true;
              }
            });
          }
        });

        // Calculate bounding box for proper positioning
        const boundingBox = new THREE.Box3().setFromObject(model);
        const scaledBoundingBox = boundingBox.clone();

        // Position model so feet are at y=0
        model.position.set(0, -scaledBoundingBox.min.y, 0);

        // Create a group to hold the player model
        playerGroup = new THREE.Group();
        playerGroup.add(model);

        // Add the player group to the scene
        scene.add(playerGroup);

        // Note: Removed duplicate createPlayerCollider call here - physics collider is created in main.js

        resolve(model);
      },
      (xhr) => {
        // Progress callback without console.log
      },
      (error) => {
        // Error callback without console.error
        reject(error);
      }
    );
  });
};

/**
 * Updates the animations of the player
 * @param {number} deltaTime - Time step for animation update
 * @param {object} movementInput - Input for movement (x, z)
 */
export const updatePlayerAnimations = (deltaTime, movementInput) => {
  if (!playerMixer || !playerModel) return;

  // Update the animation mixer
  playerMixer.update(deltaTime);

  // Determine animation based on player movement
  const isMoving =
    Math.abs(movementInput.x) > 0.1 || Math.abs(movementInput.z) > 0.1;

  // Change animation based on movement state
  const targetAnimationName = isMoving ? "Walk" : "Idle";
  const targetAction = animationActions[targetAnimationName];

  // Change animation if needed
  if (targetAction && currentAction !== targetAction) {
    previousAction = currentAction;
    currentAction = targetAction;

    if (previousAction) {
      // Crossfade to new animation
      previousAction.fadeOut(0.2);
    }

    // Ensure loop settings are properly applied to new animation
    currentAction.reset();
    currentAction.clampWhenFinished = false;
    currentAction.loop = THREE.LoopRepeat;
    currentAction.repetitions = Infinity;
    currentAction.fadeIn(0.2);
    currentAction.play();
  }
};
