import * as THREE from "three";

/**
 * Creates and configures a perspective camera
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
    100
  );
  camera.position.z = 3;
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
