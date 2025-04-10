import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Creates and configures orbit controls
 * @param {THREE.Camera} camera - The camera to be controlled
 * @param {HTMLElement} canvas - The DOM element to bind the controls to
 * @returns {OrbitControls} The configured orbit controls
 */
export const createControls = (camera, canvas) => {
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  return controls;
};
