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
    1000
  );
  // Position the camera back and up to look down at the plane at an angle
  camera.position.set(20, 15, 20);
  // Make the camera look toward the center of the scene
  camera.lookAt(0, 0, 0);
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
