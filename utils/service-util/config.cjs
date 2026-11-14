const fs = require("fs");
const path = require("path");

/* ==============================================
 * CONFIG
 * ============================================== */

/**
 * Reads the local config file.
 *
 * @param {string} rootDir
 * @returns {object}
 */
function readAppConfig(rootDir) {
    const configFile = path.join(rootDir, "configuration", "api", "config.json");

    try {
        return JSON.parse(fs.readFileSync(configFile, "utf8"));
    } catch (error) {
        throw new Error(
            `Failed to load app configuration from "${configFile}": ${error.message}`,
            { cause: error }
        );
    }
}

/**
 * Turns a config service entry into a lookup target.
 * CDPUserSvc_* matches all the per-user ones.
 *
 * @param {string | { id?: string, name?: string, description?: string }} entry
 * @returns {{ id: string, query: string, match: "exact" | "prefix", description: string }}
 */
function parseServiceEntry(entry) {
    const rawEntry =
        entry && typeof entry === "object"
            ? entry
            : { id: entry };

    const raw = String(rawEntry.id || rawEntry.name || "").trim();
    const description = String(rawEntry.description || "").trim();

    if (!raw) {
        throw new Error("Service entry cannot be empty.");
    }

    if (raw.endsWith("_*")) {
        const prefix = raw.slice(0, -2);

        return {
            id: prefix,
            query: `${prefix}*`,
            match: "prefix",
            description,
        };
    }

    return {
        id: raw,
        query: raw,
        match: "exact",
        description,
    };
}

/**
 * Grabs every service listed in config.
 *
 * @param {string} rootDir
 * @returns {Array<{ id: string, query: string, match: "exact" | "prefix", description: string }>}
 */
function getConfiguredServices(rootDir) {
    const services = readAppConfig(rootDir)?.services;

    if (!Array.isArray(services) || services.length === 0) {
        throw new Error("App configuration is missing a services list.");
    }

    return services.map(parseServiceEntry);
}

/**
 * Finds a service from the config list by name.
 *
 * @param {Array<{ id: string, query: string, match: "exact" | "prefix", description: string }>} targets
 * @param {string} serviceKey
 * @returns {{ id: string, query: string, match: "exact" | "prefix", description: string }}
 */
function findTarget(targets, serviceKey) {
    const key = String(serviceKey || "").trim();

    if (!key) {
        throw new Error("Service key is required.");
    }

    const lowered = key.toLowerCase();

    const target = targets.find((entry) => {
        if (entry.id.toLowerCase() === lowered) return true;
        if (entry.query.toLowerCase() === lowered) return true;

        return (
            entry.match === "prefix" &&
            lowered.startsWith(entry.id.toLowerCase())
        );
    });

    if (!target) {
        throw new Error(
            `Service "${key}" is not in the configured services list.`
        );
    }

    return target;
}

module.exports = {
    readAppConfig,
    parseServiceEntry,
    getConfiguredServices,
    findTarget,
};
