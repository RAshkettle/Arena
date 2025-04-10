import * as THREE from "three";

export const getNewRenderer = (canvas, windowSize) => {
  const renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setSize(windowSize.width, windowSize.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  return renderer;
};
