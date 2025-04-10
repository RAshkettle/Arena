import * as THREE from "three";

/**
 * Creates a player represented by a white capsule
 * @param {THREE.Scene} scene - The scene to add the player to
 * @param {object} gui - The GUI instance for adding controls
 * @returns {THREE.Mesh} The created player mesh
 */
export const createPlayer = (scene, gui) => {
  // Create a group to hold the player and its marker
  const playerGroup = new THREE.Group();

  // Create a capsule with 2 units height
  const geometry = new THREE.CapsuleGeometry(0.5, 1, 16, 16);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff, // White color
  });
  const player = new THREE.Mesh(geometry, material);

  // Add the capsule mesh to the group
  playerGroup.add(player);

  // Create a small red sphere as a marker for the front of the player
  const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000, // Red color
    emissive: 0xff0000,
    emissiveIntensity: 0.3, // Add some glow effect
  });
  const marker = new THREE.Mesh(sphereGeometry, sphereMaterial);

  // Position the marker at the front of the capsule, 2/3 of the way up
  // Capsule is 2 units tall (radius 0.5 + height 1 + radius 0.5)
  // 2/3 of the way up is at y = 2 * (2/3) - 1 = 0.33
  marker.position.set(0, 0.33, -0.5);

  // Add the marker to the group
  playerGroup.add(marker);

  // Position the player higher to demonstrate gravity
  // The physics system will make it fall onto the ground
  playerGroup.position.y = 5;

  // Add the player group to the scene
  scene.add(playerGroup);

  // Add controls for the player position
  const playerFolder = gui.addFolder("Player Position");
  playerFolder
    .add(playerGroup.position, "x")
    .min(-50)
    .max(50)
    .step(0.1)
    .name("X");
  playerFolder
    .add(playerGroup.position, "z")
    .min(-50)
    .max(50)
    .step(0.1)
    .name("Z");

  // Store a reference to the player mesh on the group
  playerGroup.playerMesh = player;
  playerGroup.marker = marker;

  return playerGroup;
};
