import * as THREE from "three";
import * as lil from "lil-gui";

/**
 * Creates a new Three.js scene
 * @returns {THREE.Scene} The created scene
 */
export const createScene = () => {
  return new THREE.Scene();
};

/**
 * Creates a cube mesh and adds it to the scene with GUI controls
 * @param {THREE.Scene} scene - The scene to add the cube to
 * @param {lil.GUI} gui - The GUI instance for adding controls
 * @returns {THREE.Mesh} The created cube mesh
 */
export const createCube = (scene, gui) => {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const mesh = new THREE.Mesh(geometry, material);

  gui.add(mesh.position, "y").min(-3).max(3).step(0.01).name("elevation");
  scene.add(mesh);

  return mesh;
};
