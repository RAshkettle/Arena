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
 * Creates a ground plane mesh and adds it to the scene with GUI controls
 * @param {THREE.Scene} scene - The scene to add the ground plane to
 * @param {lil.GUI} gui - The GUI instance for adding controls
 * @returns {THREE.Mesh} The created ground plane mesh
 */
export const createGround = (scene, gui) => {
  // Create a 50x50 plane
  const geometry = new THREE.PlaneGeometry(50, 50);
  const material = new THREE.MeshBasicMaterial({
    color: 0x8b4513, // Changed from 0x00ff00 (green) to 0x8B4513 (brown)
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);

  // Rotate plane to be horizontal (facing up)
  mesh.rotation.x = -Math.PI / 2;

  gui.add(mesh.position, "y").min(-3).max(3).step(0.01).name("elevation");
  scene.add(mesh);

  return mesh;
};
