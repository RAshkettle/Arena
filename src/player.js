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

  // Load the Skeleton model
  const loader = new GLTFLoader();
  loader.load(
    "assets/Skeleton.glb",
    (gltf) => {
      // Remove the temporary capsule
      playerGroup.remove(tempMesh);

      const model = gltf.scene;

      // Modify material properties to look more like bone
      model.traverse((node) => {
        if (node.isMesh && node.material) {
          // Handle both single materials and material arrays
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          
          materials.forEach(material => {
            // Make material more bone-like (less reflective, more matte)
            material.roughness = 0.9;       // High roughness for matte appearance
            material.metalness = 0.1;       // Low metalness for non-metallic look
            material.color.set(0xf0efe7);   // Slightly off-white bone color
            material.emissive.set(0x000000); // No emission
            
            // Optional: add subtle subsurface scattering effect if it's a MeshPhysicalMaterial
            if (material.type === 'MeshPhysicalMaterial') {
              material.transmission = 0.1;  // Slight translucency
              material.clearcoat = 0.2;     // Subtle clearcoat for bone shine
            }
          });
        }
      });

      // Get the bounding box of the model to calculate proper scaling
      const boundingBox = new THREE.Box3().setFromObject(model);
      const originalHeight = boundingBox.max.y - boundingBox.min.y;

      // Calculate scale factor to make the model 2 units high
      const targetHeight = 2.0;
      const scaleFactor = targetHeight / originalHeight;

      // Apply uniform scaling to maintain proportions
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);

      // Update the bounding box after scaling
      const scaledBoundingBox = new THREE.Box3().setFromObject(model);

      // Calculate the offset needed to align the model with the physics collider
      // The collider is a capsule with its origin at its center
      const modelHeight = scaledBoundingBox.max.y - scaledBoundingBox.min.y;
      const modelCenter = new THREE.Vector3();
      scaledBoundingBox.getCenter(modelCenter);

      // Position model so its feet are at y=0 and center of gravity aligns with collider
      model.position.set(0, -scaledBoundingBox.min.y, 0);

      // Add the model to the group
      playerGroup.add(model);

      // Update the player mesh reference
      playerGroup.playerMesh = model;

      console.log("Skeleton model loaded successfully");
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    (error) => {
      console.error("Error loading model:", error);
    }
  );

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

          // Create animation actions
          animations.forEach((clip) => {
            const action = playerMixer.clipAction(clip);
            animationActions[clip.name] = action;

            // Set default animation parameters
            action.clampWhenFinished = true;
            action.loop = THREE.LoopRepeat;
          });

          // Set default animation
          currentAction = animationActions["Idle"];
          if (currentAction) {
            currentAction.play();
          }
        }

        // Calculate bounding box for proper positioning
        const boundingBox = new THREE.Box3().setFromObject(model);
        const scaledBoundingBox = boundingBox.clone();

        // Position model so feet are at y=0
        model.position.set(0, -scaledBoundingBox.min.y, 0);

        // Create a group to hold the player model
        playerGroup = new THREE.Group();
        playerGroup.add(model);

        // Store the original model dimensions for scale updates
        playerGroup.userData = {
          originalHeight: boundingBox.max.y - boundingBox.min.y,
          originalWidth: Math.max(
            boundingBox.max.x - boundingBox.min.x,
            boundingBox.max.z - boundingBox.min.z
          ),
          scale: { x: 1.0, y: 1.0, z: 1.0 },
          boundingBox: boundingBox.clone(),
        };

        // Add the player group to the scene
        scene.add(playerGroup);

        // Create physics collider for the player
        createPlayerCollider(playerGroup);

        resolve(playerGroup);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("An error happened while loading the player", error);
        reject(error);
      }
    );
  });
};

/**
 * Sets the scale of the player
 * @param {object} scale - Scale values {x, y, z}
 */
export const setPlayerScale = (scale) => {
  if (!playerGroup || !playerModel) return;

  // Apply scale to the model
  playerModel.scale.set(scale.x, scale.y, scale.z);

  // Store the scale for physics updates
  playerGroup.userData.scale = {
    x: scale.x,
    y: scale.y,
    z: scale.z,
  };

  // The scale is now synchronized between player model and collider
  // Physics system will detect this change via the userData.scale property
  // and update the collider dimensions accordingly in the next update cycle

  // Update the player group position in the y direction based on the new scale
  // This ensures the model's feet stay at y=0
  const boundingBox = playerGroup.userData.boundingBox.clone();
  boundingBox.min.y *= scale.y;
  playerModel.position.y = -boundingBox.min.y;
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
  const targetAction = isMoving
    ? animationActions["Walk"]
    : animationActions["Idle"];

  // Change animation if needed
  if (targetAction && currentAction !== targetAction) {
    previousAction = currentAction;
    currentAction = targetAction;

    if (previousAction) {
      // Crossfade to new animation
      previousAction.fadeOut(0.2);
    }

    currentAction.reset();
    currentAction.fadeIn(0.2);
    currentAction.play();
  }
};
