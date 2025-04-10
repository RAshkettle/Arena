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
 * Updates the camera position to follow the player in third-person view
 * @param {THREE.PerspectiveCamera} camera - The camera to update
 * @param {THREE.Mesh} player - The player mesh to follow
 */
export const updateThirdPersonCamera = (camera, player) => {
  // Position the camera 4 units behind and 2 units above the player
  camera.position.set(
    player.position.x,
    player.position.y + 2,
    player.position.z + 4
  );

  // Look at the player (slightly above its base to target more at the head)
  camera.lookAt(player.position.x, player.position.y + 0.5, player.position.z);
};
