/* ==============================================
 * SERVICE HISTORY DISPLAY
 * ============================================== */

/**
 * Formats an ISO timestamp for the UI.
 *
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function formatHistoryTime(value) {
  const text = String(value || "").trim();

  if (!text) return "";

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Builds colored history tags for a service row.
 *
 * @param {object | null | undefined} history
 * @param {{ running?: boolean }} [options]
 * @returns {Array<{ tone: string, label: string, time: string, detail?: string }>}
 */
export function getHistoryTags(history, options = {}) {
  if (!history) return [];

  const tags = [];

  if (options.running && history.lastStartedAt) {
    const time = formatHistoryTime(history.lastStartedAt);

    if (time) {
      tags.push({
        tone: "started",
        label: "Started",
        time,
      });
    }
  }

  if (!options.running && history.lastStoppedAt) {
    const time = formatHistoryTime(history.lastStoppedAt);

    if (time) {
      tags.push({
        tone: "stopped",
        label: "Stopped",
        time,
      });
    }
  }

  if (!history.lastConfigChangeAt) {
    return tags;
  }

  const time = formatHistoryTime(history.lastConfigChangeAt);

  if (!time) {
    return tags;
  }

  const from = String(history.lastConfigFrom || "").trim();
  const to = String(history.lastConfigTo || "").trim();
  const detail = from && to ? `${from} to ${to}` : "";

  tags.push({
    tone: "config",
    label: "Startup",
    time,
    detail,
  });

  return tags;
}
