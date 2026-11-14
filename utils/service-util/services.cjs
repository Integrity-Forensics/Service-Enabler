const {
    getConfiguredServices,
    findTarget,
} = require("./config.cjs");
const {
    normalizeHistory,
    emptyHistory,
} = require("./history.cjs");
const { runScript } = require("./powershell.cjs");

/* ==============================================
 * SAFETY
 * ============================================== */

/*
 * Dont disable these. Messing with them can
 * break random Windows stuff.
 */
const PROTECTED_FROM_DISABLE = Object.freeze([
    "DcomLaunch",
]);

/* ==============================================
 * NORMALIZATION
 * ============================================== */

/**
 * Makes the raw service data nicer for the UI.
 *
 * @param {object} raw
 * @param {{ id: string, match: "exact" | "prefix", description?: string }} target
 * @returns {object}
 */
function normalizeServiceInfo(raw, target) {
    const status = String(raw?.Status || "Unknown");
    const startType = String(raw?.StartType || "Unknown");
    const running = status.toLowerCase() === "running";
    const disabled = startType.toLowerCase() === "disabled";

    return {
        id: target.id,
        name: String(raw?.Name || ""),
        displayName: String(raw?.DisplayName || raw?.Name || ""),
        description: String(target.description || "").trim(),
        status,
        startType,
        running,
        enabled: running && !disabled,
        exists: true,
        match: target.match,
        protected: PROTECTED_FROM_DISABLE.some(
            (name) => name.toLowerCase() === String(raw?.Name || "").toLowerCase()
        ),
        history: normalizeHistory(raw?.History),
    };
}

/**
 * Fallback when the service isnt on the machine.
 *
 * @param {{ id: string, query: string, match: "exact" | "prefix", description?: string }} target
 * @param {string} [error]
 * @returns {object}
 */
function missingServiceInfo(target, error) {
    return {
        id: target.id,
        name: target.match === "prefix" ? `${target.id}_*` : target.query,
        displayName: target.id,
        description: String(target.description || "").trim(),
        status: "NotFound",
        startType: "Unknown",
        running: false,
        enabled: false,
        exists: false,
        match: target.match,
        protected: false,
        history: emptyHistory(),
        error: error || `Service "${target.id}" was not found.`,
    };
}

/**
 * Smaller status object for the UI.
 *
 * @param {object} service
 * @returns {object}
 */
function toStatus(service) {
    return {
        id: service.id,
        name: service.name,
        status: service.status,
        startType: service.startType,
        running: service.running,
        enabled: service.enabled,
        exists: service.exists,
        protected: Boolean(service.protected),
    };
}

/* ==============================================
 * QUERY
 * ============================================== */

/**
 * Checks all the targets in one powershell call.
 *
 * @param {Array<{ id: string, query: string, match: "exact" | "prefix" }>} targets
 * @returns {Promise<Array<{ target: object, services: object[] }>>}
 */
async function queryTargets(targets) {
    if (!targets.length) return [];

    const payload = targets.map((target) => ({
        id: target.id,
        query: target.query,
        match: target.match,
    }));

    const rows = await runScript("Get-ServiceStates.ps1", {
        TargetsJson: JSON.stringify(payload),
    });

    return rows.map((row) => {
        const source =
            targets.find((entry) => entry.id === String(row.id)) || {};

        const target = {
            id: String(row.id),
            query: String(row.query),
            match: row.match === "prefix" ? "prefix" : "exact",
            description: String(source.description || "").trim(),
        };

        return {
            target,
            services: Array.isArray(row.services) ? row.services : [],
        };
    });
}

/**
 * Gets the real windows service names for a target.
 *
 * @param {{ id: string, query: string, match: "exact" | "prefix" }} target
 * @returns {Promise<string[]>}
 */
async function resolveServiceNames(target) {
    const [result] = await queryTargets([target]);
    const names = (result?.services || [])
        .map((service) => String(service.Name || "").trim())
        .filter(Boolean);

    if (names.length === 0) {
        throw new Error(`Service "${target.id}" was not found on this system.`);
    }

    return names;
}

/**
 * Gets all real service names in one go.
 *
 * @param {Array<{ id: string, query: string, match: "exact" | "prefix" }>} targets
 * @returns {Promise<string[]>}
 */
async function resolveAllServiceNames(targets) {
    const queried = await queryTargets(targets);
    const names = queried.flatMap((result) =>
        result.services
            .map((service) => String(service.Name || "").trim())
            .filter(Boolean)
    );

    return [...new Set(names)];
}

/* ==============================================
 * INFO / STATUS
 * ============================================== */

/**
 * Grabs info for every service in config.
 *
 * @param {string} rootDir
 * @returns {Promise<object[]>}
 */
async function getAllServiceInfo(rootDir) {
    const targets = getConfiguredServices(rootDir);
    const results = await queryTargets(targets);
    const info = [];

    for (const result of results) {
        if (!result.services.length) {
            info.push(missingServiceInfo(result.target));
            continue;
        }

        for (const service of result.services) {
            info.push(normalizeServiceInfo(service, result.target));
        }
    }

    return info;
}

/**
 * Grabs info for one service.
 *
 * @param {string} rootDir
 * @param {string} serviceKey
 * @returns {Promise<object[]>}
 */
async function getServiceInfo(rootDir, serviceKey) {
    const target = findTarget(getConfiguredServices(rootDir), serviceKey);
    const [result] = await queryTargets([target]);

    if (!result?.services?.length) {
        return [missingServiceInfo(target)];
    }

    return result.services.map((service) =>
        normalizeServiceInfo(service, target)
    );
}

/**
 * Grabs status for every service in config.
 *
 * @param {string} rootDir
 * @returns {Promise<object[]>}
 */
async function getAllStatuses(rootDir) {
    const info = await getAllServiceInfo(rootDir);

    return info.map(toStatus);
}

/**
 * Grabs status for one service.
 *
 * @param {string} rootDir
 * @param {string} serviceKey
 * @returns {Promise<object[]>}
 */
async function getStatus(rootDir, serviceKey) {
    const info = await getServiceInfo(rootDir, serviceKey);

    return info.map(toStatus);
}

/* ==============================================
 * ENABLE / DISABLE
 * ============================================== */

/**
 * Runs enable or disable on the given service names.
 *
 * @param {string[]} serviceNames
 * @param {"enable" | "disable"} action
 * @returns {Promise<object[]>}
 */
async function applyServiceAction(serviceNames, action) {
    const names = [
        ...new Set(
            serviceNames
                .map((name) => String(name).trim())
                .filter(Boolean)
        ),
    ];

    if (names.length === 0) {
        throw new Error("No Windows services were resolved for this action.");
    }

    // elevate so we dont need the whole app running as admin
    return runScript(
        "Set-ServiceStates.ps1",
        {
            Action: action,
            NamesJson: JSON.stringify(names),
            ProtectedJson: JSON.stringify(PROTECTED_FROM_DISABLE),
        },
        { elevated: true },
    );
}

/**
 * Enables one service from config.
 *
 * @param {string} rootDir
 * @param {string} serviceKey
 * @returns {Promise<object>}
 */
async function enableService(rootDir, serviceKey) {
    const target = findTarget(getConfiguredServices(rootDir), serviceKey);
    const names = await resolveServiceNames(target);
    const results = await applyServiceAction(names, "enable");

    return {
        id: target.id,
        action: "enable",
        results,
    };
}

/**
 * Disables one service from config.
 *
 * @param {string} rootDir
 * @param {string} serviceKey
 * @returns {Promise<object>}
 */
async function disableService(rootDir, serviceKey) {
    const target = findTarget(getConfiguredServices(rootDir), serviceKey);
    const names = await resolveServiceNames(target);
    const results = await applyServiceAction(names, "disable");

    return {
        id: target.id,
        action: "disable",
        results,
    };
}

/**
 * Enables every service in config.
 *
 * @param {string} rootDir
 * @returns {Promise<object>}
 */
async function enableAllServices(rootDir) {
    const names = await resolveAllServiceNames(getConfiguredServices(rootDir));
    const results = await applyServiceAction(names, "enable");

    return {
        action: "enableAll",
        results,
    };
}

/**
 * Disables every service in config.
 * Protected / kernel ones get skipped.
 *
 * @param {string} rootDir
 * @returns {Promise<object>}
 */
async function disableAllServices(rootDir) {
    const names = await resolveAllServiceNames(getConfiguredServices(rootDir));
    const results = await applyServiceAction(names, "disable");

    return {
        action: "disableAll",
        results,
    };
}

/* ==============================================
 * EXPORTS
 * ============================================== */

module.exports = {
    getConfiguredServices,
    getAllServiceInfo,
    getServiceInfo,
    getAllStatuses,
    getStatus,
    enableService,
    disableService,
    enableAllServices,
    disableAllServices,
};
