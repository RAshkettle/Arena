import * as THREE from "three";

/**
 * Creates and configures a perspective camera for third-person view
 * @param {Object} windowSize - The window dimensions
 * @param {number} windowSize.width - The window width
 * @param {number} windowSize.height - The window height
 * @returns {THREE.PerspectiveCamera} The configured camera
 */
export const createCamera = (windowSize) => {
  const camera = new THREE.PerspectiveCamera(
    75,
    windowSize.width / windowSize.height,
    0.1,
    1000
  );

  // Initial position will be updated by updateThirdPersonCamera
  return camera;
};

/**
 * Updates the camera aspect ratio based on window size
 * @param {THREE.PerspectiveCamera} camera - The camera to update
 * @param {Object} windowSize - The window dimensions
 * @param {number} windowSize.width - The window width
 * @param {number} windowSize.height - The window height
 */
export const updateCameraAspect = (camera, windowSize) => {
  camera.aspect = windowSize.width / windowSize.height;
  camera.updateProjectionMatrix();
};

/**
 * Updates the camera position to always be behind the player
 * @param {THREE.PerspectiveCamera} camera - The camera to update
 * @param {THREE.Group|THREE.Mesh} player - The player object to follow
 * @param {Object} [cameraRotation] - Camera rotation from mouse input
 * @param {number} [cameraRotation.x] - X-axis rotation (pitch)
 * @param {number} [cameraRotation.y] - Y-axis rotation (yaw)
 */
export const updateThirdPersonCamera = (camera, player, cameraRotation = { x: 0, y: 0 }) => {
  // Camera settings
  const cameraDistance = 4;
  const cameraHeight = 2;
  
  // Get player rotation around Y axis
  const playerAngle = player.rotation.y;
  
  // Apply pitch (vertical angle) from mouse input
  const cameraPhi = cameraRotation.x; 
  
  // Calculate camera position to be directly behind the player
  // Use player's rotation angle for horizontal positioning
  const x = -Math.sin(playerAngle) * Math.cos(cameraPhi) * cameraDistance;
  const y = Math.sin(cameraPhi) * cameraDistance + cameraHeight;
  const z = -Math.cos(playerAngle) * Math.cos(cameraPhi) * cameraDistance;
  
  // Position camera relative to player
  camera.position.set(
    player.position.x + x,
    player.position.y + y,
    player.position.z + z
  );
  
  // Look at the player (slightly above its base)
  camera.lookAt(player.position.x, player.position.y + 0.5, player.position.z);
};
