/* ==============================================
 * MOTION
 * ============================================== */

export const ease = [0.16, 1, 0.3, 1];

/**
 * Builds a soft rise-in animation for a page section.
 *
 * @param {number} delay
 * @returns {object}
 */
export function riseIn(delay = 0) {
  return {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease },
  };
}
