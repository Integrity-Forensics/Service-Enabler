/* ==============================================
 * SERVICE STATUS
 * ============================================== */

/**
 * Picks a compact status label for a service row.
 *
 * @param {object} service
 * @returns {string}
 */
export function getStatusLabel(service) {
  if (!service.exists) return "Missing";
  if (service.protected) return "Protected";
  if (service.running) return "Running";
  return "Stopped";
}

/**
 * Picks the status tone used for classes and icons.
 *
 * @param {object} service
 * @returns {"missing" | "protected" | "running" | "stopped"}
 */
export function getStatusTone(service) {
  if (!service.exists) return "missing";
  if (service.protected) return "protected";
  if (service.running) return "running";
  return "stopped";
}

/**
 * Checks if the row action should be locked.
 *
 * @param {object} service
 * @param {boolean} isBusy
 * @returns {boolean}
 */
export function isActionDisabled(service, isBusy) {
  if (isBusy) return true;
  if (!service.exists) return true;

  return Boolean(service.running && service.protected);
}

/* ==============================================
 * FILTERING + COUNTS
 * ============================================== */

/**
 * Filters services by a search query.
 *
 * @param {object[]} services
 * @param {string} query
 * @returns {object[]}
 */
export function filterServices(services, query) {
  const needle = query.trim().toLowerCase();

  if (!needle) return services;

  return services.filter((service) => {
    const haystack = [
      service.id,
      service.name,
      service.displayName,
      service.description,
      service.startType,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(needle);
  });
}

/**
 * Counts running and stopped services.
 *
 * @param {object[]} services
 * @returns {{ running: number, stopped: number }}
 */
export function countServices(services) {
  let running = 0;
  let stopped = 0;

  for (const service of services) {
    if (!service.exists) continue;

    if (service.running) {
      running += 1;
      continue;
    }

    stopped += 1;
  }

  return { running, stopped };
}
