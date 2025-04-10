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

/**
 * State for tracking if pointer is locked
 * @type {boolean}
 */
let pointerLocked = false;

/**
 * Sets up event handlers for pointer lock (mouse capture) on click and release on escape
 * @param {HTMLElement} canvas - The DOM element to lock the pointer to
 * @param {Function} onPointerLockChange - Callback function when pointer lock state changes
 */
export const setupPointerLockHandler = (canvas, onPointerLockChange = null) => {
  // Get the pointer lock overlay element
  const overlay = document.getElementById("pointerLockOverlay");

  // Click handler to request pointer lock
  canvas.addEventListener("click", () => {
    if (!pointerLocked) {
      // Request pointer lock
      canvas.requestPointerLock();
    }
  });

  // Pointer lock change handler
  document.addEventListener("pointerlockchange", () => {
    // Update pointer lock state
    pointerLocked = document.pointerLockElement === canvas;

    // Toggle overlay visibility based on pointer lock state
    if (overlay) {
      if (pointerLocked) {
        overlay.classList.add("hidden");
      } else {
        overlay.classList.remove("hidden");
      }
    }

    // Call callback if provided
    if (onPointerLockChange) {
      onPointerLockChange(pointerLocked);
    }

    // Visual indication in the console
    if (pointerLocked) {
      console.log("Pointer locked - press ESC to release");
    } else {
      console.log("Pointer released - click to capture");
    }
  });

  // Escape key handler to exit pointer lock
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && pointerLocked) {
      // Pointer lock is automatically released on Escape,
      // but we handle it here for clarity
      document.exitPointerLock();
    }
  });
};

/**
 * Checks if the pointer is currently locked
 * @returns {boolean} True if the pointer is locked, false otherwise
 */
export const isPointerLocked = () => {
  return pointerLocked;
};
