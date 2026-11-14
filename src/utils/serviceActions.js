/* ==============================================
 * IMPORTS
 * ============================================== */

import { sendStatus } from "../../utils/sendStatus.js";

/* ==============================================
 * SERVICE ACTIONS
 * ============================================== */

/**
 * Checks if a bulk/single action mostly worked.
 *
 * @param {object} payload
 * @returns {boolean}
 */
export function actionSucceeded(payload) {
  const results = Array.isArray(payload?.results) ? payload.results : [];

  if (results.length === 0) return false;

  return results.some((result) => result.ok);
}

/**
 * Shows the right notice for an action result.
 *
 * Pass `warn` to show a fixed warning instead of the first error.
 *
 * @param {object} result
 * @param {{ success: string, error: string, warn?: string }} messages
 * @returns {void}
 */
export function reportResult(result, messages) {
  if (actionSucceeded(result)) {
    sendStatus("success", messages.success);
    return;
  }

  if (messages.warn) {
    sendStatus("warn", messages.warn);
    return;
  }

  const firstError = result?.results?.find((entry) => entry.error)?.error;

  sendStatus("error", firstError || messages.error);
}
