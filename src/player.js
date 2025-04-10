import * as THREE from "three";

/**
 * Creates a player represented by a white capsule
 * @param {THREE.Scene} scene - The scene to add the player to
 * @param {object} gui - The GUI instance for adding controls
 * @returns {THREE.Group} The created player group
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

  // Create debug UI folders
  const playerFolder = gui.addFolder("Player Position");
  const rotationFolder = gui.addFolder("Player Rotation");
  const scaleFolder = gui.addFolder("Player Scale");

  // Position controls - X, Y, Z
  playerFolder
    .add(playerGroup.position, "x")
    .min(-50)
    .max(50)
    .step(0.1)
    .name("X");
  playerFolder
    .add(playerGroup.position, "y")
    .min(-10)
    .max(50)
    .step(0.1)
    .name("Y");
  playerFolder
    .add(playerGroup.position, "z")
    .min(-50)
    .max(50)
    .step(0.1)
    .name("Z");

  // Rotation controls - X, Y, Z (in radians, converted to degrees for UI)
  const rotationControl = {
    x: 0,
    y: 0,
    z: 0,
  };

  // Convert between degrees (UI) and radians (Three.js)
  rotationFolder
    .add(rotationControl, "x")
    .min(-180)
    .max(180)
    .step(1)
    .name("X (deg)")
    .onChange((value) => {
      playerGroup.rotation.x = (value * Math.PI) / 180;
    });
  rotationFolder
    .add(rotationControl, "y")
    .min(-180)
    .max(180)
    .step(1)
    .name("Y (deg)")
    .onChange((value) => {
      playerGroup.rotation.y = (value * Math.PI) / 180;
    });
  rotationFolder
    .add(rotationControl, "z")
    .min(-180)
    .max(180)
    .step(1)
    .name("Z (deg)")
    .onChange((value) => {
      playerGroup.rotation.z = (value * Math.PI) / 180;
    });

  // Scale controls - uniform and per-axis
  const scaleControl = {
    uniform: 1,
    x: 1,
    y: 1,
    z: 1,
  };

  scaleFolder
    .add(scaleControl, "uniform")
    .min(0.1)
    .max(3)
    .step(0.1)
    .name("Uniform")
    .onChange((value) => {
      player.scale.set(value, value, value);
      scaleControl.x = value;
      scaleControl.y = value;
      scaleControl.z = value;

      // Update the scale controllers without triggering their onChange events
      scaleFolder.controllers.forEach((controller) => {
        if (controller.property !== "uniform") {
          controller.setValue(value);
        }
      });

      // Store the current scale for physics updates
      playerGroup.userData.scale = { x: value, y: value, z: value };
    });

  scaleFolder
    .add(scaleControl, "x")
    .min(0.1)
    .max(3)
    .step(0.1)
    .name("X")
    .onChange((value) => {
      player.scale.x = value;
      playerGroup.userData.scale.x = value;
    });

  scaleFolder
    .add(scaleControl, "y")
    .min(0.1)
    .max(3)
    .step(0.1)
    .name("Y")
    .onChange((value) => {
      player.scale.y = value;
      playerGroup.userData.scale.y = value;
    });

  scaleFolder
    .add(scaleControl, "z")
    .min(0.1)
    .max(3)
    .step(0.1)
    .name("Z")
    .onChange((value) => {
      player.scale.z = value;
      playerGroup.userData.scale.z = value;
    });

  // Store a reference to the player mesh on the group
  playerGroup.playerMesh = player;
  playerGroup.marker = marker;

  // Initialize userData for physics-related properties
  playerGroup.userData = {
    scale: { x: 1, y: 1, z: 1 },
    colliderVisible: false,
    colliderHelper: null,
  };

  return playerGroup;
};
