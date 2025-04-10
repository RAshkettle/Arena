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
 * Creates a dynamic point-based physics object for the player
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

  // Create a ball collider as a simple replacement for the capsule
  const radius = 0.5;
  const playerColliderDesc = RAPIER.ColliderDesc.ball(radius);
  const collider = world.createCollider(playerColliderDesc, playerRigidBody);

  // Store reference to group for syncing
  const physicsObject = {
    mesh: playerGroup,
    body: playerRigidBody,
    collider: collider,
    type: "player",
  };

  physicsObjects.push(physicsObject);

  return playerRigidBody;
};

/**
 * Updates the physics world and syncs mesh positions
 * @param {number} deltaTime - Time step for the physics update
 * @param {Object} inputDirection - Direction input from player
 * @param {boolean} jumpRequested - Whether the player has requested to jump
 * @param {Object} cameraRotation - Camera rotation from mouse input
 */
export const updatePhysics = (
  deltaTime,
  inputDirection = { x: 0, z: 0 },
  jumpRequested = false,
  cameraRotation = { x: 0, y: 0 }
) => {
  if (!world) return;

  // Process player movement and jump if player exists
  const playerPhysics = getPlayerPhysics();
  if (playerPhysics) {
    // Rotate input direction based on camera rotation
    const rotatedDirection = rotateDirectionWithCamera(
      inputDirection,
      cameraRotation
    );

    // Handle player movement with rotated direction
    movePlayer(playerPhysics.body, rotatedDirection, deltaTime);

    // Handle jumping
    if (jumpRequested && isPlayerOnGround(playerPhysics.body)) {
      playerJump(playerPhysics.body);
    }

    // Always update player rotation to face the camera direction
    updatePlayerRotation(playerPhysics.mesh, cameraRotation);
  }

  // Step the physics simulation
  world.step();

  // Sync physics objects with meshes
  for (const obj of physicsObjects) {
    if (obj.type === "player") {
      // Update player group position based on physics body
      // The translation affects the collider, and we move the player to match
      const position = obj.body.translation();

      // Apply position from collider to player mesh to maintain alignment
      obj.mesh.position.x = position.x;
      obj.mesh.position.y = position.y;
      obj.mesh.position.z = position.z;
    }
    // Ground is static, so no need to update its position
  }
};

/**
 * Rotates the input direction to align with camera rotation
 * @param {Object} direction - Raw input direction
 * @param {Object} cameraRotation - Camera rotation
 * @returns {Object} - Rotated direction vector
 */
const rotateDirectionWithCamera = (direction, cameraRotation) => {
  if (direction.x === 0 && direction.z === 0) return direction;

  const angle = cameraRotation.y;

  return {
    x: direction.x * Math.cos(angle) - direction.z * Math.sin(angle),
    z: direction.x * Math.sin(angle) + direction.z * Math.cos(angle),
  };
};

/**
 * Updates the player rotation to face the direction the camera is pointing
 * @param {THREE.Group|THREE.Mesh} playerMesh - The player mesh or group
 * @param {Object} cameraRotation - Camera rotation
 */
const updatePlayerRotation = (playerMesh, cameraRotation) => {
  if (!playerMesh) return;

  // Set player rotation to match camera's horizontal rotation
  playerMesh.rotation.y = cameraRotation.y;

  // Only rotate the player mesh, not the collider
  // This ensures rotations are always applied to the player model
  // while the collider remains aligned with global axes
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

  // The player mesh will be synced to match this position in updatePhysics()
};

/**
 * Gets the player physics object
 * @returns {Object|null} The player physics object or null if not found
 */
export const getPlayerPhysics = () => {
  return physicsObjects.find((obj) => obj.type === "player") || null;
};
