/**
 * Input handler for keyboard controls
 */
class InputHandler {
  constructor() {
    // Movement state
    this.keys = {
      forward: false, // W
      backward: false, // S
      left: false, // A
      right: false, // D
      jump: false, // Space
    };

    // Set up event listeners
    window.addEventListener("keydown", this.onKeyDown.bind(this));
    window.addEventListener("keyup", this.onKeyUp.bind(this));
  }

  /**
   * Handle key down events
   * @param {KeyboardEvent} event - The keyboard event
   */
  onKeyDown(event) {
    // Prevent default for game controls to avoid scrolling the page
    if (["w", "a", "s", "d", " "].includes(event.key.toLowerCase())) {
      event.preventDefault();
    }

    switch (event.key.toLowerCase()) {
      case "w":
        this.keys.forward = true;
        break;
      case "a":
        this.keys.left = true;
        break;
      case "s":
        this.keys.backward = true;
        break;
      case "d":
        this.keys.right = true;
        break;
      case " ":
        this.keys.jump = true;
        break;
    }
  }

  /**
   * Handle key up events
   * @param {KeyboardEvent} event - The keyboard event
   */
  onKeyUp(event) {
    switch (event.key.toLowerCase()) {
      case "w":
        this.keys.forward = false;
        break;
      case "a":
        this.keys.left = false;
        break;
      case "s":
        this.keys.backward = false;
        break;
      case "d":
        this.keys.right = false;
        break;
      case " ":
        this.keys.jump = false;
        break;
    }
  }

  /**
   * Get current movement direction based on keys pressed
   * @returns {Object} Movement direction vector
   */
  getMovementDirection() {
    return {
      x: (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0),
      z: (this.keys.backward ? 1 : 0) - (this.keys.forward ? 1 : 0),
    };
  }

  /**
   * Check if jump key is pressed
   * @returns {boolean} True if jump key is pressed
   */
  isJumpPressed() {
    return this.keys.jump;
  }

  /**
   * Reset the jump key state (to prevent continuous jumping)
   */
  resetJump() {
    this.keys.jump = false;
  }
}

export default InputHandler;
