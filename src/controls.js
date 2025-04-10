/**
 * Creates a simple placeholder for controls
 * @returns {Object} A simple controls object with an update method
 */
export const createControls = () => {
  // Replace OrbitControls with a simple object that has an update method
  // This allows us to maintain the same interface in the main code
  return {
    update: () => {
      // No control updates needed here since camera follows player directly
    },
  };
};
