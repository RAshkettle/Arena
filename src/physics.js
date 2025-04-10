import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

let world;
let physicsObjects = [];
let gravity = { x: 0.0, y: -9.81, z: 0.0 };
let rapierLoaded = false;
let scene = null;

// Movement and jump settings
const MOVE_SPEED = 2.0; // 2 units per second
const JUMP_FORCE = 5.0; // Jump force
const GROUND_DETECTION_DISTANCE = 0.1; // Distance to check for ground beneath player

// Original collider dimensions for the player
const DEFAULT_CAPSULE_RADIUS = 0.5;
const DEFAULT_CAPSULE_HEIGHT = 0.5; // Half-height of the cylinder part

/**
 * Initializes the Rapier physics engine
 * @returns {Promise<boolean>} Promise that resolves when Rapier is initialized
 */
export const initPhysics = async () => {
  if (rapierLoaded) return true;

  // Initialize Rapier physics engine with a single object parameter
  await RAPIER.init({});

  // Create the physics world with gravity using the new object-based constructor
  world = new RAPIER.World({
    x: gravity.x,
    y: gravity.y,
    z: gravity.z,
  });

  rapierLoaded = true;
  return true;
};

/**
 * Sets the scene reference for debug visualization
 * @param {THREE.Scene} sceneRef - Reference to the Three.js scene
 */
export const setPhysicsScene = (sceneRef) => {
  scene = sceneRef;
};

/**
 * Creates a static plane collider for the ground
 * @param {THREE.Mesh} groundMesh - The mesh representing the ground
 * @returns {RAPIER.Collider} The created collider
 */
export const createGroundCollider = (groundMesh) => {
  if (!world) return null;

  // Create a static rigid body for the ground
  const groundRigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
  const groundRigidBody = world.createRigidBody(groundRigidBodyDesc);

  // Create a collider for the ground plane
  // Using a cuboid with a very thin height as an alternative to halfspace
  const groundSize = 50; // Size of the ground plane
  const groundColliderDesc = RAPIER.ColliderDesc.cuboid(
    groundSize / 2, // half-width in x
    0.1, // half-height in y (very thin)
    groundSize / 2 // half-depth in z
  );

  // Position the collider to match the ground's position
  groundColliderDesc.setTranslation(
    groundMesh.position.x,
    groundMesh.position.y,
    groundMesh.position.z
  );

  const collider = world.createCollider(groundColliderDesc, groundRigidBody);

  // Store reference to mesh for syncing
  physicsObjects.push({
    mesh: groundMesh,
    body: groundRigidBody,
    collider: collider,
    type: "ground",
  });

  return collider;
};

/**
 * Creates a dynamic capsule collider for the player
 * @param {THREE.Group} playerGroup - The group containing the player mesh
 * @param {object} gui - The GUI instance for adding controls
 * @returns {RAPIER.RigidBody} The created rigid body
 */
export const createPlayerCollider = (playerGroup, gui) => {
  if (!world) return null;

  // Create a dynamic rigid body for the player
  const playerRigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(
      playerGroup.position.x,
      playerGroup.position.y,
      playerGroup.position.z
    )
    // Lock rotation to prevent player from falling over
    .lockRotations();

  const playerRigidBody = world.createRigidBody(playerRigidBodyDesc);

  // Create a capsule collider
  // Parameters: half-height of the cylinder part, radius
  const halfHeight = DEFAULT_CAPSULE_HEIGHT;
  const radius = DEFAULT_CAPSULE_RADIUS;

  const playerColliderDesc = RAPIER.ColliderDesc.capsule(halfHeight, radius);
  const collider = world.createCollider(playerColliderDesc, playerRigidBody);

  // Store reference to group for syncing
  const physicsObject = {
    mesh: playerGroup,
    body: playerRigidBody,
    collider: collider,
    type: "player",
    colliderDimensions: {
      radius: radius,
      halfHeight: halfHeight,
    },
  };

  physicsObjects.push(physicsObject);

  // Create debug controls for the collider if GUI is provided
  if (gui) {
    const colliderFolder = gui.addFolder("Player Collider");
    const colliderParams = {
      showCollider: false,
      radius: radius,
      height: halfHeight * 2,
    };

    // Add controls for collider visibility
    colliderFolder
      .add(colliderParams, "showCollider")
      .name("Show Collider")
      .onChange((value) => {
        if (value) {
          createColliderHelper(playerGroup, physicsObject);
        } else {
          removeColliderHelper(playerGroup);
        }
      });

    // Add controls for collider dimensions
    colliderFolder
      .add(colliderParams, "radius")
      .min(0.1)
      .max(2)
      .step(0.1)
      .name("Radius")
      .onChange((value) => {
        updatePlayerCollider(physicsObject, value, colliderParams.height / 2);
        // Update visual representation if visible
        if (colliderParams.showCollider) {
          removeColliderHelper(playerGroup);
          createColliderHelper(playerGroup, physicsObject);
        }
      });

    colliderFolder
      .add(colliderParams, "height")
      .min(0.2)
      .max(4)
      .step(0.1)
      .name("Height")
      .onChange((value) => {
        updatePlayerCollider(physicsObject, colliderParams.radius, value / 2);
        // Update visual representation if visible
        if (colliderParams.showCollider) {
          removeColliderHelper(playerGroup);
          createColliderHelper(playerGroup, physicsObject);
        }
      });
  }

  return playerRigidBody;
};

/**
 * Creates a visual helper for the player's collider
 * @param {THREE.Group} playerGroup - The player group
 * @param {Object} physicsObject - The physics object containing the collider
 */
const createColliderHelper = (playerGroup, physicsObject) => {
  if (!scene) return;

  removeColliderHelper(playerGroup); // Remove existing helper first

  // Create a wireframe capsule to visualize the collider
  const radius = physicsObject.colliderDimensions.radius;
  const halfHeight = physicsObject.colliderDimensions.halfHeight;

  const geometry = new THREE.CapsuleGeometry(radius, halfHeight * 2, 16, 8);
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
    opacity: 0.5,
    transparent: true,
  });

  const colliderHelper = new THREE.Mesh(geometry, material);
  playerGroup.add(colliderHelper);

  // Store reference to the helper
  playerGroup.userData.colliderHelper = colliderHelper;
};

/**
 * Removes the visual helper for the player's collider
 * @param {THREE.Group} playerGroup - The player group
 */
const removeColliderHelper = (playerGroup) => {
  if (playerGroup.userData.colliderHelper) {
    playerGroup.remove(playerGroup.userData.colliderHelper);
    playerGroup.userData.colliderHelper = null;
  }
};

/**
 * Updates the player collider dimensions
 * @param {Object} physicsObject - The physics object containing the collider
 * @param {number} radius - The new radius for the capsule collider
 * @param {number} halfHeight - The new half-height for the capsule collider
 */
const updatePlayerCollider = (physicsObject, radius, halfHeight) => {
  if (!physicsObject || !world) return;

  // Store the current body position before removing the old collider
  const currentPos = physicsObject.body.translation();
  const currentVel = physicsObject.body.linvel();

  // Remove the current collider
  world.removeCollider(physicsObject.collider, true);

  // Create a new collider with the updated dimensions
  const colliderDesc = RAPIER.ColliderDesc.capsule(halfHeight, radius);
  physicsObject.collider = world.createCollider(
    colliderDesc,
    physicsObject.body
  );

  // Update stored dimensions
  physicsObject.colliderDimensions = {
    radius: radius,
    halfHeight: halfHeight,
  };
};

/**
 * Updates the physics world and syncs mesh positions
 * @param {number} deltaTime - Time step for the physics update
 * @param {Object} inputDirection - Direction input from player
 * @param {boolean} jumpRequested - Whether the player has requested to jump
 */
export const updatePhysics = (
  deltaTime,
  inputDirection = { x: 0, z: 0 },
  jumpRequested = false
) => {
  if (!world) return;

  // Process player movement and jump if player exists
  const playerPhysics = getPlayerPhysics();
  if (playerPhysics) {
    // Handle player movement
    movePlayer(playerPhysics.body, inputDirection, deltaTime);

    // Handle jumping
    if (jumpRequested && isPlayerOnGround(playerPhysics.body)) {
      playerJump(playerPhysics.body);
    }

    // Check for scale changes and update collider if needed
    const playerGroup = playerPhysics.mesh;
    if (playerGroup.userData && playerGroup.userData.scale) {
      const scale = playerGroup.userData.scale;

      // Check if scale has changed enough to warrant updating the collider
      const currentRadius = playerPhysics.colliderDimensions.radius;
      const currentHalfHeight = playerPhysics.colliderDimensions.halfHeight;

      const targetRadius = DEFAULT_CAPSULE_RADIUS * ((scale.x + scale.z) / 2);
      const targetHalfHeight = DEFAULT_CAPSULE_HEIGHT * scale.y;

      if (
        Math.abs(targetRadius - currentRadius) > 0.01 ||
        Math.abs(targetHalfHeight - currentHalfHeight) > 0.01
      ) {
        updatePlayerCollider(playerPhysics, targetRadius, targetHalfHeight);

        // Update collider helper if it exists
        if (playerGroup.userData.colliderHelper) {
          removeColliderHelper(playerGroup);
          createColliderHelper(playerGroup, playerPhysics);
        }
      }
    }
  }

  // Step the physics simulation
  world.step();

  // Sync physics objects with meshes
  for (const obj of physicsObjects) {
    if (obj.type === "player") {
      // Update player group position based on physics body
      const position = obj.body.translation();
      obj.mesh.position.x = position.x;
      obj.mesh.position.y = position.y;
      obj.mesh.position.z = position.z;

      // Only rotate the player group to face the direction of movement
      // if it's not controlled by the debug UI
      if (inputDirection.x !== 0 || inputDirection.z !== 0) {
        // Calculate angle based on input direction
        const angle = Math.atan2(inputDirection.x, inputDirection.z);
        obj.mesh.rotation.y = angle;
      }
    }
    // Ground is static, so no need to update its position
  }
};

/**
 * Moves the player based on input direction
 * @param {RAPIER.RigidBody} playerBody - The player's rigid body
 * @param {Object} direction - Input direction (normalized)
 * @param {number} deltaTime - Time step in seconds
 */
const movePlayer = (playerBody, direction, deltaTime) => {
  if (!playerBody) return;

  // Calculate move distance for this frame (units/second * seconds = units)
  const moveDistance = MOVE_SPEED * deltaTime;

  // Get the current velocity
  const velocity = playerBody.linvel();

  // Apply horizontal movement while preserving vertical velocity
  playerBody.setLinvel(
    {
      x: direction.x * MOVE_SPEED,
      y: velocity.y, // Preserve vertical velocity (gravity, jump)
      z: direction.z * MOVE_SPEED,
    },
    true
  );
};

/**
 * Makes the player jump by applying an upward impulse
 * @param {RAPIER.RigidBody} playerBody - The player's rigid body
 */
const playerJump = (playerBody) => {
  if (!playerBody) return;

  // Apply an upward impulse for jumping
  playerBody.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 }, true);
};

/**
 * Checks if the player is on the ground by ray casting
 * @param {RAPIER.RigidBody} playerBody - The player's rigid body
 * @returns {boolean} - True if the player is on the ground
 */
const isPlayerOnGround = (playerBody) => {
  if (!playerBody || !world) return false;

  // Get player position
  const position = playerBody.translation();

  // Cast a ray straight down from the player's position
  const rayOrigin = { x: position.x, y: position.y, z: position.z };
  const rayDirection = { x: 0, y: -1, z: 0 }; // Straight down

  // Create a ray in the world
  const ray = new RAPIER.Ray(rayOrigin, rayDirection);
  const hit = world.castRay(ray, GROUND_DETECTION_DISTANCE, true);

  // If hit is not null and distance is small enough, player is on ground
  return hit !== null && hit.toi <= GROUND_DETECTION_DISTANCE;
};

/**
 * Sets the position of the player physics body
 * @param {RAPIER.RigidBody} playerBody - The player rigid body
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} z - Z position
 */
export const setPlayerPosition = (playerBody, x, y, z) => {
  if (!playerBody) return;
  playerBody.setTranslation({ x, y, z }, true);
};

/**
 * Gets the player physics object
 * @returns {Object|null} The player physics object or null if not found
 */
export const getPlayerPhysics = () => {
  return physicsObjects.find((obj) => obj.type === "player") || null;
};
