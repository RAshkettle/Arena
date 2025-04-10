import * as THREE from "three";
import * as lil from "lil-gui";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { TextureLoader } from "three";

/**
 * Creates a new Three.js scene
 * @returns {THREE.Scene} The created scene
 */
export const createScene = () => {
  return new THREE.Scene();
};

/**
 * Creates a skybox using an HDR environment map and adds it to the scene
 * @param {THREE.Scene} scene - The scene to add the skybox to
 * @param {lil.GUI} gui - The GUI instance for adding controls (optional)
 * @returns {Promise<THREE.Texture>} The loaded environment map
 */
export const createSkybox = (scene, gui) => {
  return new Promise((resolve, reject) => {
    // Create a loader for the HDR file
    const rgbeLoader = new RGBELoader();

    // Optional UI feedback
    if (gui) {
      const skyboxFolder = gui.addFolder("Skybox");
      const skyboxParams = {
        intensity: 1.0,
      };

      skyboxFolder
        .add(skyboxParams, "intensity", 0, 2, 0.01)
        .name("Brightness")
        .onChange((value) => {
          if (scene.environment) {
            scene.environment.intensity = value;
          }
        });
    }

    // Load the HDR environment map
    rgbeLoader.load(
      "/assets/skybox.hdr",
      (texture) => {
        // Configure the texture for skybox use
        texture.mapping = THREE.EquirectangularReflectionMapping;

        // Apply the texture as background and environment map
        scene.background = texture;
        scene.environment = texture;

        console.log("Skybox loaded successfully");
        resolve(texture);
      },
      undefined,
      (error) => {
        console.error("Error loading skybox:", error);
        reject(error);
      }
    );
  });
};

/**
 * Creates a ground plane mesh and adds it to the scene with GUI controls
 * @param {THREE.Scene} scene - The scene to add the ground plane to
 * @param {lil.GUI} gui - The GUI instance for adding controls
 * @returns {THREE.Mesh} The created ground plane mesh
 */
export const createGround = (scene, gui) => {
  // Load the cobblestone texture
  const textureLoader = new TextureLoader();
  const cobblestoneTexture = textureLoader.load("assets/cobblestone.jpg");

  // Set texture repeat for a tiled effect
  cobblestoneTexture.wrapS = THREE.RepeatWrapping;
  cobblestoneTexture.wrapT = THREE.RepeatWrapping;
  cobblestoneTexture.repeat.set(20, 20); // Adjust repeat count to control tiling

  // Create a 50x50 plane
  const geometry = new THREE.PlaneGeometry(50, 50);
  const material = new THREE.MeshStandardMaterial({
    map: cobblestoneTexture,
    side: THREE.DoubleSide,
    roughness: 0.8,
    metalness: 0.2,
  });
  const mesh = new THREE.Mesh(geometry, material);

  // Rotate plane to be horizontal (facing up)
  mesh.rotation.x = -Math.PI / 2;

  // Add GUI controls for elevation and texture tiling
  gui.add(mesh.position, "y").min(-3).max(3).step(0.01).name("elevation");

  const textureFolder = gui.addFolder("Cobblestone Texture");
  textureFolder.add(cobblestoneTexture.repeat, "x", 1, 50, 1).name("Repeat X");
  textureFolder.add(cobblestoneTexture.repeat, "y", 1, 50, 1).name("Repeat Y");

  scene.add(mesh);

  return mesh;
};

/**
 * Creates walls around the perimeter of the ground plane
 * @param {THREE.Scene} scene - The scene to add the walls to
 * @param {lil.GUI} gui - The GUI instance for adding controls (optional)
 * @returns {THREE.Group} Group containing all wall meshes
 */
export const createWalls = (scene, gui) => {
  const wallsGroup = new THREE.Group();

  // Wall dimensions
  const wallHeight = 2.5;
  const wallThickness = 0.5;
  const groundSize = 50; // Same as the ground plane

  // Load wall texture
  const textureLoader = new TextureLoader();
  const wallTexture = textureLoader.load("assets/wall.jpg");

  // Configure texture
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;

  // Create material with the wall texture
  const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture,
    side: THREE.DoubleSide,
    roughness: 0.7,
    metalness: 0.2,
  });

  // Create walls on all four sides
  // North wall (positive Z)
  const northWall = createWall(
    groundSize,
    wallHeight,
    wallThickness,
    0,
    wallHeight / 2,
    groundSize / 2,
    0,
    0,
    0,
    wallMaterial
  );
  wallsGroup.add(northWall);

  // South wall (negative Z)
  const southWall = createWall(
    groundSize,
    wallHeight,
    wallThickness,
    0,
    wallHeight / 2,
    -groundSize / 2,
    0,
    0,
    0,
    wallMaterial
  );
  wallsGroup.add(southWall);

  // East wall (positive X)
  const eastWall = createWall(
    wallThickness,
    wallHeight,
    groundSize,
    groundSize / 2,
    wallHeight / 2,
    0,
    0,
    0,
    0,
    wallMaterial
  );
  wallsGroup.add(eastWall);

  // West wall (negative X)
  const westWall = createWall(
    wallThickness,
    wallHeight,
    groundSize,
    -groundSize / 2,
    wallHeight / 2,
    0,
    0,
    0,
    0,
    wallMaterial
  );
  wallsGroup.add(westWall);

  // Configure texture repeat for walls
  if (gui) {
    const wallsFolder = gui.addFolder("Walls");

    const textureConfig = {
      repeatX: 16,
      repeatY: 1,
    };

    // Apply initial texture repeat
    [northWall, southWall, eastWall, westWall].forEach((wall) => {
      wall.material.map.repeat.set(
        textureConfig.repeatX,
        textureConfig.repeatY
      );
    });

    // Add GUI controls
    wallsFolder
      .add(textureConfig, "repeatX", 1, 20, 1)
      .name("Texture Repeat X")
      .onChange((value) => {
        [northWall, southWall, eastWall, westWall].forEach((wall) => {
          wall.material.map.repeat.x = value;
        });
      });

    wallsFolder
      .add(textureConfig, "repeatY", 1, 10, 1)
      .name("Texture Repeat Y")
      .onChange((value) => {
        [northWall, southWall, eastWall, westWall].forEach((wall) => {
          wall.material.map.repeat.y = value;
        });
      });
  }

  scene.add(wallsGroup);
  return wallsGroup;
};

/**
 * Helper function to create a single wall
 * @param {number} width - Width of the wall
 * @param {number} height - Height of the wall
 * @param {number} depth - Depth/thickness of the wall
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} z - Z position
 * @param {number} rx - X rotation
 * @param {number} ry - Y rotation
 * @param {number} rz - Z rotation
 * @param {THREE.Material} material - Material to use
 * @returns {THREE.Mesh} The created wall mesh
 */
function createWall(width, height, depth, x, y, z, rx, ry, rz, material) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const wall = new THREE.Mesh(geometry, material);

  wall.position.set(x, y, z);
  wall.rotation.set(rx, ry, rz);

  return wall;
}
