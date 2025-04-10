import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

let world;
let physicsObjects = [];
let gravity = { x: 0.0, y: -9.81, z: 0.0 };
let rapierLoaded = false;

/**
 * Initializes the Rapier physics engine
 * @returns {Promise<boolean>} Promise that resolves when Rapier is initialized
 */
export const initPhysics = async () => {
  if (rapierLoaded) return true;

  // Initialize Rapier physics engine with a single object parameter
  await RAPIER.init({});

  // Create the physics world with gravity
  world = new RAPIER.World(gravity);

  rapierLoaded = true;
  return true;
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
 * @param {THREE.Mesh} playerMesh - The mesh representing the player
 * @returns {RAPIER.RigidBody} The created rigid body
 */
export const createPlayerCollider = (playerMesh) => {
  if (!world) return null;

  // Create a dynamic rigid body for the player
  const playerRigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
    playerMesh.position.x,
    playerMesh.position.y,
    playerMesh.position.z
  );
  const playerRigidBody = world.createRigidBody(playerRigidBodyDesc);

  // Create a capsule collider
  // Parameters: half-height of the cylinder part, radius
  const halfHeight = 0.5; // Half of cylinder part (1 unit)
  const radius = 0.5; // Capsule radius

  const playerColliderDesc = RAPIER.ColliderDesc.capsule(halfHeight, radius);
  const collider = world.createCollider(playerColliderDesc, playerRigidBody);

  // Store reference to mesh for syncing
  physicsObjects.push({
    mesh: playerMesh,
    body: playerRigidBody,
    collider: collider,
    type: "player",
  });

  return playerRigidBody;
};

/**
 * Updates the physics world and syncs mesh positions
 * @param {number} deltaTime - Time step for the physics update
 */
export const updatePhysics = (deltaTime) => {
  if (!world) return;

  // Step the physics simulation
  world.step();

  // Sync physics objects with meshes
  for (const obj of physicsObjects) {
    if (obj.type === "player") {
      // Update player mesh position based on physics body
      const position = obj.body.translation();
      obj.mesh.position.x = position.x;
      obj.mesh.position.y = position.y;
      obj.mesh.position.z = position.z;
    }
    // Ground is static, so no need to update its position
  }
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
