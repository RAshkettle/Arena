import * as THREE from "three";

/**
 * Creates a player represented by a white capsule
 * @param {THREE.Scene} scene - The scene to add the player to
 * @param {object} gui - The GUI instance for adding controls
 * @returns {THREE.Mesh} The created player mesh
 */
export const createPlayer = (scene, gui) => {
  // Create a capsule with 2 units height
  const geometry = new THREE.CapsuleGeometry(0.5, 1, 16, 16);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff, // White color
  });
  const player = new THREE.Mesh(geometry, material);

  // Position the player to stand on the ground
  // Capsule height is 2 units (radius 0.5 + height 1 + radius 0.5)
  // We need to shift it up by half its height to make it stand on the ground
  player.position.y = 1;

  // Add the player to the scene
  scene.add(player);

  // Add controls for the player position
  const playerFolder = gui.addFolder("Player Position");
  playerFolder.add(player.position, "x").min(-50).max(50).step(0.1).name("X");
  playerFolder.add(player.position, "z").min(-50).max(50).step(0.1).name("Z");

  return player;
};
