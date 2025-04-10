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
  cobblestoneTexture.repeat.set(10, 10); // Adjust repeat count to control tiling

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
  textureFolder.add(cobblestoneTexture.repeat, "x", 1, 20, 1).name("Repeat X");
  textureFolder.add(cobblestoneTexture.repeat, "y", 1, 20, 1).name("Repeat Y");

  scene.add(mesh);

  return mesh;
};
