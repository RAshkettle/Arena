/**
 * Sets up event handler for window resize
 * @param {Object} windowSize - The window dimensions object to update
 * @param {number} windowSize.width - The window width
 * @param {number} windowSize.height - The window height
 * @param {THREE.Camera} camera - The camera to update on resize
 * @param {THREE.WebGLRenderer} renderer - The renderer to update on resize
 */
export const setupResizeHandler = (windowSize, camera, renderer) => {
  window.addEventListener("resize", () => {
    windowSize.width = window.innerWidth;
    windowSize.height = window.innerHeight;

    camera.aspect = windowSize.width / windowSize.height;
    camera.updateProjectionMatrix();

    renderer.setSize(windowSize.width, windowSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
};

/**
 * Sets up event handler for fullscreen toggle on double click
 * @param {HTMLElement} canvas - The DOM element to toggle fullscreen on
 */
export const setupFullscreenHandler = (canvas) => {
  window.addEventListener("dblclick", () => {
    const fullscreenElement =
      document.fullscreenElement || document.webkitFullscreenElement;

    if (!fullscreenElement) {
      if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
      } else if (canvas.webkitRequestFullscreen) {
        canvas.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  });
};
