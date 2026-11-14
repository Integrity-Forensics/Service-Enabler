/* ==============================================
 * SERVICE HISTORY HELPERS
 * ============================================== */

/**
 * Normalizes raw PowerShell history into a stable object.
 *
 * @param {object} [raw]
 * @returns {{
 *   lastStartedAt: string | null,
 *   lastStoppedAt: string | null,
 *   lastConfigChangeAt: string | null,
 *   lastConfigFrom: string | null,
 *   lastConfigTo: string | null
 * }}
 */
function normalizeHistory(raw) {
    return {
        lastStartedAt: toNullableIso(raw?.lastStartedAt),
        lastStoppedAt: toNullableIso(raw?.lastStoppedAt),
        lastConfigChangeAt: toNullableIso(raw?.lastConfigChangeAt),
        lastConfigFrom: toNullableText(raw?.lastConfigFrom),
        lastConfigTo: toNullableText(raw?.lastConfigTo),
    };
}

/**
 * Empty history when Windows has nothing useful.
 *
 * @returns {ReturnType<typeof normalizeHistory>}
 */
function emptyHistory() {
    return normalizeHistory(null);
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function toNullableIso(value) {
    const text = String(value || "").trim();

    if (!text) return null;

    const date = new Date(text);

    if (Number.isNaN(date.getTime())) return null;

    return date.toISOString();
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function toNullableText(value) {
    const text = String(value || "").trim();

    return text || null;
}

/**
 * Formats an ISO timestamp for the UI.
 *
 * @param {string | null | undefined} value
 * @returns {string}
 */
function formatHistoryTime(value) {
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
 * Builds short history lines for a service row.
 *
 * @param {ReturnType<typeof normalizeHistory> | null | undefined} history
 * @param {{ running?: boolean }} [options]
 * @returns {string[]}
 */
function getHistoryLines(history, options = {}) {
    if (!history) return [];

    const lines = [];

    if (options.running && history.lastStartedAt) {
        const started = formatHistoryTime(history.lastStartedAt);

        if (started) {
            lines.push(`Last started ${started}`);
        }
    }

    if (!options.running && history.lastStoppedAt) {
        const stopped = formatHistoryTime(history.lastStoppedAt);

        if (stopped) {
            lines.push(`Last stopped ${stopped}`);
        }
    }

    if (history.lastConfigChangeAt) {
        const changed = formatHistoryTime(history.lastConfigChangeAt);

        if (changed) {
            const from = history.lastConfigFrom;
            const to = history.lastConfigTo;

            if (from && to) {
                lines.push(`Startup changed ${changed} (${from} to ${to})`);
            } else {
                lines.push(`Startup changed ${changed}`);
            }
        }
    }

    return lines;
}

module.exports = {
    normalizeHistory,
    emptyHistory,
    formatHistoryTime,
    getHistoryLines,
};
